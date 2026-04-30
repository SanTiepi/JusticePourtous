#!/usr/bin/env node
/**
 * e2e-triage-funnel.mjs — Test E2E complet du funnel triage sur prod live.
 *
 * Pour chaque cas : POST /api/triage → si questions, simule réponses
 * → POST /api/triage/refine → vérifie que le résultat est cohérent.
 *
 * Usage : node scripts/e2e-triage-funnel.mjs
 */

const BASE = process.env.E2E_BASE || 'https://justicepourtous.ch';

const CASES = [
  {
    name: 'Bail moisissure simple',
    texte: 'moisissure dans mon appartement à Lausanne depuis 3 mois',
    expectedDomain: 'bail',
    expectedFichePattern: /moisissure|defaut/,
    answers: { q1: 'Oui, par lettre recommandée', q2: 'Plus de 30 jours', q3: 'Vaud (VD)' }
  },
  {
    name: 'Licenciement abusif',
    texte: 'mon employeur m a licencié sans motif après 5 ans',
    expectedDomain: 'travail',
    expectedFichePattern: /licenciement/,
    answers: { q1: '2 à 10 ans', q2: 'Non, je suis en capacité de travail', q3: 'Genève (GE)' }
  },
  {
    name: 'Commandement de payer urgent',
    texte: 'je viens de recevoir un commandement de payer pour CHF 5000',
    expectedDomain: 'dettes',
    expectedFichePattern: /commandement|opposition/,
    answers: { q1: 'Non, je conteste la dette', q2: 'Moins de 10 jours', q3: 'Vaud (VD)' }
  },
  {
    name: 'Renvoi étrangers urgent',
    texte: 'j ai reçu une décision de renvoi de Suisse',
    expectedDomain: 'etrangers',
    expectedFichePattern: /renvoi|expulsion/,
    answers: { q1: 'Oui, j ai un conjoint suisse', q2: 'Moins de 30 jours' }
  },
  {
    name: 'Garde d enfants après divorce',
    texte: 'mon ex refuse de me laisser voir mes enfants',
    expectedDomain: 'famille',
    expectedFichePattern: /garde|visite|parental/,
    answers: { q1: 'Autorité parentale conjointe', q2: 'Moins de 6 mois' }
  },
  {
    name: 'Violence conjugale',
    texte: 'mon conjoint me bat',
    expectedDomain: 'violence',
    expectedFichePattern: /violence|protection|plainte/,
    answers: { q1: 'Oui, je suis en danger immédiat', q2: 'Non, pas encore' }
  },
  {
    name: 'Cas vague',
    texte: 'j ai un problème',
    expectedDomain: null,
    expectedFichePattern: null,
    answers: {}
  },
  {
    name: 'Cas multi-fiches (violence + dette + permis)',
    texte: 'mon mari me bat, on a une dette commune et il a un permis B',
    expectedDomain: 'violence',
    expectedFichePattern: /violence|protection/,
    answers: { q1: 'Oui, je suis en danger', q2: 'Non' }
  }
];

async function callApi(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function runCase(c, idx) {
  console.log(`\n━━━ ${idx + 1}/${CASES.length} ${c.name} ━━━`);
  console.log(`Input: "${c.texte}"`);

  // Round 0 : initial triage
  const r1 = await callApi('/api/triage', { texte: c.texte, canton: null, lang: 'fr' });
  if (r1.status !== 200) {
    console.log(`  ❌ Triage failed: HTTP ${r1.status} — ${JSON.stringify(r1.data).slice(0, 150)}`);
    return { ok: false, name: c.name, error: 'triage_http_error', status: r1.status };
  }

  const status1 = r1.data.status;
  const fiche1 = r1.data.ficheId;
  const domain1 = r1.data.domaine;
  const qs1 = r1.data.questionsManquantes || [];
  console.log(`  Round 1 status=${status1} fiche=${fiche1} domain=${domain1} questions=${qs1.length}`);

  let issues = [];

  // Domain check
  if (c.expectedDomain && domain1 !== c.expectedDomain) {
    issues.push(`domaine attendu '${c.expectedDomain}' mais reçu '${domain1}'`);
  }

  // Fiche pattern check (si applicable)
  if (c.expectedFichePattern && fiche1 && !c.expectedFichePattern.test(fiche1)) {
    issues.push(`fiche '${fiche1}' ne match pas pattern ${c.expectedFichePattern}`);
  }

  // Question count : pas plus de 3 par round (notre nouvelle règle)
  if (qs1.length > 3) {
    issues.push(`⚠️ ${qs1.length} questions dans 1 round (max 3 attendu — règle 'multi-rounds 1-3')`);
  }

  // Si questions, simuler refine
  let lastRound = r1;
  if (qs1.length > 0 && Object.keys(c.answers).length > 0) {
    const sessionId = r1.data.sessionId || r1.data.case_id;
    const answers = {};
    qs1.forEach((q, i) => {
      const key = q.id || ('q' + (i + 1));
      // Tente de matcher la réponse hardcoded ou prend le 1er choix
      answers[key] = c.answers[key] || q.choix?.[0] || 'oui';
    });
    console.log(`  Réponses simulées:`, JSON.stringify(answers).slice(0, 100));

    const r2 = await callApi('/api/triage/refine', { sessionId, reponses: answers, lang: 'fr' });
    lastRound = r2;
    if (r2.status !== 200) {
      issues.push(`refine failed: HTTP ${r2.status}`);
    } else {
      const status2 = r2.data.status;
      const fiche2 = r2.data.ficheId;
      const qs2 = r2.data.questionsManquantes || [];
      console.log(`  Round 2 status=${status2} fiche=${fiche2} questions=${qs2.length}`);
      if (qs2.length > 3) {
        issues.push(`⚠️ Round 2 ${qs2.length} questions (>3)`);
      }
      // Vérifier cohérence : si user a dit NON à arrêt maladie, le LLM ne doit pas
      // poser des questions sur "quand par rapport à l'arrêt"
      if (qs2.length > 0) {
        const noArretAnswer = Object.values(answers).find(a => /^non/i.test(String(a)) || /capacité/i.test(String(a)));
        if (noArretAnswer) {
          for (const q of qs2) {
            if (/par rapport.*arr[êe]t|certificat médical|durée.*arr[êe]t/i.test(q.question)) {
              issues.push(`⚠️ INCOHÉRENT : user a dit '${noArretAnswer}' à arrêt maladie, mais Q="${q.question}"`);
            }
          }
        }
      }
    }
  } else if (qs1.length === 0 && status1 !== 'ready_for_pipeline') {
    issues.push(`pas de questions mais status='${status1}' (attendu 'ready_for_pipeline')`);
  }

  // Verdict
  if (issues.length === 0) {
    console.log(`  ✅ OK`);
    return { ok: true, name: c.name };
  } else {
    issues.forEach(i => console.log(`  ❌ ${i}`));
    return { ok: false, name: c.name, issues };
  }
}

async function main() {
  const results = [];
  for (let i = 0; i < CASES.length; i++) {
    try {
      const r = await runCase(CASES[i], i);
      results.push(r);
    } catch (err) {
      results.push({ ok: false, name: CASES[i].name, error: err.message });
      console.log(`  💥 Exception: ${err.message}`);
    }
    // small delay
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`RÉSUMÉ FUNNEL E2E`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  const ok = results.filter(r => r.ok).length;
  console.log(`✅ ${ok}/${results.length} cas OK`);
  const ko = results.filter(r => !r.ok);
  if (ko.length > 0) {
    console.log(`\n❌ ${ko.length} cas avec problèmes :`);
    ko.forEach(r => {
      console.log(`  - ${r.name}`);
      if (r.issues) r.issues.forEach(i => console.log(`      ${i}`));
      if (r.error) console.log(`      ${r.error}`);
    });
  }
}

main().catch(console.error);
