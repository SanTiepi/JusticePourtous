#!/usr/bin/env node
/**
 * live-domain-battery.mjs — Test de régression du ROUTING triage sur prod live,
 * couvrant les 15 domaines (avec focus sur les 5 domaines `readiness: beta`).
 *
 * Complète scripts/e2e-triage-funnel.mjs (qui teste le funnel multi-round) :
 * ici on vérifie qu'une formulation profane par domaine est routée vers le
 * bon domaine et retourne une fiche (ou un safety_stop / ready_for_pipeline
 * légitime). Détecte les régressions de classification avant qu'un usager ne
 * tombe sur une mauvaise fiche.
 *
 * Usage : node scripts/live-domain-battery.mjs
 *         E2E_BASE=http://localhost:3000 node scripts/live-domain-battery.mjs
 *
 * Exit code 1 si une anomalie RÉELLE est détectée (hors known_gap).
 */

const BASE = process.env.E2E_BASE || 'https://justicepourtous.ch';
const CONCURRENCY = 3;

// expected : domaine attendu (ou liste de domaines acceptables).
// known_gap : fallback connu et documenté (docs/missing-fiches.md) — ne fait pas échouer.
const CASES = [
  { tier: 'core', expected: 'bail',         texte: 'Ma régie veut augmenter mon loyer de 300 francs par mois sans aucun formulaire officiel' },
  { tier: 'core', expected: 'travail',      texte: 'Mon patron m a viré du jour au lendemain alors que j étais en arrêt maladie' },
  { tier: 'core', expected: 'dettes',       texte: 'J ai reçu un commandement de payer pour une facture que j ai déjà réglée il y a longtemps' },
  { tier: 'core', expected: 'famille',      texte: 'Je veux divorcer mais mon mari refuse, on a deux enfants en bas âge' },
  { tier: 'core', expected: 'etrangers',    texte: 'Mon permis B expire bientôt et mon employeur a fait faillite, je risque le renvoi ?' },
  { tier: 'beta', expected: 'consommation', texte: 'J ai acheté un frigo en ligne, il est arrivé cassé et le vendeur refuse de me rembourser' },
  { tier: 'beta', expected: 'voisinage',    texte: 'Mon voisin a planté une haie de 4 mètres qui me cache tout le soleil dans mon jardin' },
  { tier: 'beta', expected: 'circulation',  texte: 'J ai reçu un retrait de permis après un excès de vitesse, je peux contester ?' },
  { tier: 'beta', expected: 'successions',  texte: 'Mon père est décédé, mes frères veulent vendre la maison mais moi je veux la garder' },
  { tier: 'beta', expected: 'sante',        texte: 'Ma caisse maladie refuse de rembourser une opération que mon médecin juge nécessaire' },
  // accident de travail / SUVA : LAA = assurance-accidents → 'assurances' est légitime.
  { tier: 'core', expected: ['accident', 'assurances'], texte: 'J ai eu un accident sur mon lieu de travail et la SUVA refuse de couvrir mes soins' },
  // dégât des eaux ménage/RC : aucune fiche d'assurance PRIVÉE de chose → fallback conso. Gap documenté.
  { tier: 'core', expected: 'assurances', known_gap: true, texte: 'Mon assurance refuse de payer après un dégât des eaux qui a ruiné mon salon' },
  { tier: 'core', expected: 'entreprise',  texte: 'Je gère une petite Sàrl, mon associé veut partir et réclame la moitié des parts' },
  { tier: 'core', expected: 'social',      texte: 'On m a coupé mon aide sociale du jour au lendemain sans aucune explication' },
  { tier: 'core', expected: 'violence',    texte: 'Mon ex me harcèle et me menace tous les jours par messages, j ai peur' },
];

async function triage(texte) {
  const t0 = Date.now();
  const r = await fetch(BASE + '/api/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texte, canton: null, lang: 'fr' }),
  });
  let d; try { d = await r.json(); } catch (e) { d = { __parse_err: e.message }; }
  return { http: r.status, ms: Date.now() - t0, d };
}

function evaluate(c, http, d) {
  const flags = [];
  if (http !== 200) { flags.push('HTTP_' + http); return flags; }
  if (d.status === 'safety_stop') return flags; // safety prioritaire = OK quel que soit le domaine
  const expected = Array.isArray(c.expected) ? c.expected : [c.expected];
  if (!d.domaine) flags.push('NO_DOMAIN');
  else if (!expected.includes(d.domaine)) flags.push(`DOMAIN(${d.domaine}∉${expected.join('|')})`);
  if (!d.ficheId && d.status !== 'ready_for_pipeline') flags.push('NO_FICHE');
  if ((d.questionsManquantes || []).length > 4) flags.push('Q>' + d.questionsManquantes.length);
  return flags;
}

const results = new Array(CASES.length);
let cursor = 0;
async function worker() {
  while (cursor < CASES.length) {
    const i = cursor++;
    const c = CASES[i];
    const { http, ms, d } = await triage(c.texte);
    const flags = evaluate(c, http, d);
    results[i] = {
      ...c, http, ms,
      status: d.status, domaine: d.domaine, fiche: d.ficheId, signal: d.signal_type,
      q: (d.questionsManquantes || []).length,
      flags,
      // un flag sur un known_gap n'est pas une vraie anomalie
      real_anomaly: flags.length > 0 && !c.known_gap,
    };
  }
}

console.log(`Batterie live routing — ${CASES.length} cas, base=${BASE}`);
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log('\nTIER  EXPECT       HTTP ms    STATUS           DOMAINE       FICHE                                Q  FLAGS');
for (const r of results) {
  console.log(
    r.tier.padEnd(5),
    (Array.isArray(r.expected) ? r.expected.join('/') : r.expected).padEnd(12),
    String(r.http).padEnd(4),
    String(r.ms).padEnd(5),
    (r.status || '-').padEnd(16),
    (r.domaine || (r.signal ? '[' + r.signal + ']' : '-')).padEnd(13),
    (r.fiche || '-').padEnd(36),
    String(r.q).padEnd(2),
    r.flags.join(',') + (r.flags.length && r.known_gap ? ' (known_gap)' : ''),
  );
}

const realAnomalies = results.filter(r => r.real_anomaly);
const knownGaps = results.filter(r => r.flags.length && r.known_gap);
console.log(`\n✓ ${results.length - results.filter(r => r.flags.length).length}/${results.length} routés sans flag`);
if (knownGaps.length) console.log(`ℹ ${knownGaps.length} known_gap(s) documenté(s) (cf. docs/missing-fiches.md)`);
if (realAnomalies.length) {
  console.log(`\n✗ ${realAnomalies.length} ANOMALIE(S) RÉELLE(S) :`);
  for (const r of realAnomalies) {
    console.log(`  "${r.texte.slice(0, 60)}..." → ${r.flags.join(',')} (status=${r.status} domaine=${r.domaine} fiche=${r.fiche})`);
  }
  process.exitCode = 1;
} else {
  console.log('✓ Aucune anomalie réelle de routing.');
}
