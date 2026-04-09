/**
 * Deep Analysis — Analyse approfondie multi-tour
 *
 * Philosophie: pas plus rapide, MIEUX en qualité.
 * Le temps n'est pas un souci. La précision prime.
 *
 * 3 tours de LLM, chacun avec plus de contexte:
 *   Tour 1: Comprendre (identifier domaine + fiches)
 *   Tour 2: Approfondir (lire les données, poser les bonnes questions)
 *   Tour 3: Conclure (dossier contradictoire complet)
 *
 * Chaque tour enrichit le contexte du suivant.
 * Le citoyen peut répondre entre tour 2 et tour 3.
 */

import { queryComplete, queryByProblem } from './knowledge-engine.mjs';
import { compile as compileNormative } from './normative-compiler.mjs';
import { certifyIssue } from './coverage-certificate.mjs';
import { analyzeIssue } from './argumentation-engine.mjs';

const API_URL = 'https://api.anthropic.com/v1/messages';

async function callLLM(system, user, maxTokens = 2000) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }]
    })
  });

  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  const data = await resp.json();
  const text = data.content[0].text;
  // Robust JSON extraction — handle truncated or dirty output
  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    // Try to fix common issues: trailing commas, truncated arrays
    let fixed = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonStart = fixed.indexOf('{');
    if (jsonStart >= 0) fixed = fixed.slice(jsonStart);
    // Remove trailing incomplete elements
    fixed = fixed.replace(/,\s*[}\]]?\s*$/, '}');
    // Ensure it ends with }
    if (!fixed.endsWith('}')) {
      const lastBrace = fixed.lastIndexOf('}');
      if (lastBrace > 0) fixed = fixed.slice(0, lastBrace + 1);
    }
    try {
      parsed = JSON.parse(fixed);
    } catch {
      // Last resort: return raw text as description
      parsed = { _raw: text.slice(0, 500), _parse_error: true };
    }
  }
  return {
    parsed,
    usage: { input: data.usage?.input_tokens || 0, output: data.usage?.output_tokens || 0 },
  };
}

// ─── Tour 1: Comprendre ─────────────────────────────────────────

const TOUR1_SYSTEM = `Tu es un juriste suisse expérimenté. Tu lis la description d'un citoyen et tu identifies:
1. Le domaine juridique (bail, travail, dettes, famille, etc.)
2. Les faits déjà connus
3. Les faits CRITIQUES manquants
4. Les questions à poser en PREMIER (celles qui changent le plus le résultat)

Réponds en JSON: {
  "domaine": "bail|travail|dettes|...",
  "sous_probleme": "description courte du type de problème",
  "faits_extraits": { "canton": null, "duree": null, "montant": null, "anciennete": null, "adversaire": null, "urgence": false, "actions_deja_faites": [], "documents_mentionnes": [] },
  "faits_manquants_critiques": ["fait1", "fait2"],
  "questions": [{ "question": "...", "choix": ["A", "B", "C"], "pourquoi": "Change X dans le résultat" }],
  "resume": "Compréhension en 1-2 phrases"
}`;

export async function tour1_comprendre(texte) {
  return await callLLM(TOUR1_SYSTEM, `SITUATION DU CITOYEN:\n${texte}`);
}

// ─── Tour 2: Approfondir ────────────────────────────────────────

const TOUR2_SYSTEM = `Tu es un juriste suisse qui a DÉJÀ identifié la situation. Tu reçois maintenant:
- La situation du citoyen
- Les données juridiques VÉRIFIÉES (articles, arrêts, délais, règles)
- Les réponses du citoyen aux premières questions

Ta mission: avec TOUTES ces données, identifie:
1. Les points juridiques CONFIRMÉS (avec source)
2. Les points juridiques INCERTAINS (source contradictoire ou manquante)
3. Les questions RESTANTES (faits qui changeraient encore le résultat)
4. Les RISQUES que le citoyen ne voit pas
5. Les ERREURS à ne surtout pas faire

Pose autant de questions que nécessaire. La précision prime sur la rapidité.

Réponds en JSON: {
  "points_confirmes": [{ "point": "...", "source": "CO 259d", "certitude": "certain|probable|variable" }],
  "points_incertains": [{ "point": "...", "raison": "...", "source_pro": "...", "source_contra": "..." }],
  "questions_restantes": [{ "question": "...", "choix": ["A", "B", "C"], "pourquoi": "...", "impact": "change délai|montant|procédure|autorité" }],
  "risques": ["..."],
  "erreurs_a_eviter": ["..."],
  "besoin_avocat": false,
  "besoin_avocat_raison": null
}`;

export async function tour2_approfondir(texte, tour1Result, reponsesCitoyen, enrichedData) {
  const context = `SITUATION ORIGINALE:\n${texte}\n\n`;

  const faits = tour1Result.parsed || {};
  const factsSummary = `FAITS EXTRAITS (tour 1):\n${JSON.stringify(faits.faits_extraits, null, 2)}\n\n`;

  const repSummary = reponsesCitoyen
    ? `RÉPONSES DU CITOYEN:\n${JSON.stringify(reponsesCitoyen, null, 2)}\n\n`
    : '';

  // Compact enriched data
  const articles = (enrichedData.articles || []).slice(0, 8).map(a =>
    `${a.ref}: ${a.texteSimple || a.texte || a.titre} [source: ${a.source_id}]`
  ).join('\n');

  const arrets = (enrichedData.jurisprudence || []).slice(0, 6).map(a =>
    `${a.signature} (${a.role}): ${a.resume?.slice(0, 120)} [${a.resultat}]`
  ).join('\n');

  const delais = (enrichedData.delais || []).slice(0, 5).map(d =>
    `${d.procedure}: ${d.delai} — ${d.consequence || ''}`
  ).join('\n');

  const normative = enrichedData.normative?.results
    ?.filter(r => r.applicable)
    .map(r => `${r.label}: ${r.consequence?.text?.slice(0, 100) || ''} [${r.base_legale}]`)
    .join('\n') || '';

  const dataBlock = `DONNÉES JURIDIQUES VÉRIFIÉES:\n\nArticles:\n${articles}\n\nJurisprudence:\n${arrets}\n\nDélais:\n${delais}\n\nRègles compilées:\n${normative}`;

  return await callLLM(TOUR2_SYSTEM, context + factsSummary + repSummary + dataBlock, 3000);
}

// ─── Tour 3: Conclure ───────────────────────────────────────────

const TOUR3_SYSTEM = `Tu es un juriste suisse qui finalise un dossier contradictoire. Tu as TOUTES les données.

Produis le DOSSIER FINAL avec:
1. Claims vérifiés (chaque affirmation + source exacte + certitude)
2. Objections connues (ce que l'adversaire peut dire)
3. Plan d'action concret (étapes numérotées avec délais)
4. Documents à réunir
5. Ce qu'on ne sait PAS encore
6. Estimation si avocat nécessaire

RÈGLE ABSOLUE: chaque claim DOIT citer une source (article de loi ou arrêt). Pas de source = pas de claim.
Les délais et montants viennent des données fournies, JAMAIS de ta mémoire.

Réponds en JSON: {
  "claims": [{ "texte": "...", "source": "CO 259d", "certitude": "certain|probable|variable", "conditions": ["si..."] }],
  "objections": [{ "texte": "...", "source": "...", "gravite": "haute|moyenne|basse" }],
  "plan_action": [{ "etape": 1, "action": "...", "delai": "...", "document": "..." }],
  "documents_requis": ["..."],
  "inconnues": ["..."],
  "besoin_avocat": false,
  "besoin_avocat_raison": null,
  "resume_citoyen": "Résumé en 3-4 phrases compréhensibles par un non-juriste"
}`;

export async function tour3_conclure(texte, tour1Result, tour2Result, enrichedData, reponsesFinales) {
  const context = `SITUATION:\n${texte}\n\n`;
  const t1 = `COMPRÉHENSION (tour 1):\n${JSON.stringify(tour1Result.parsed, null, 2)}\n\n`;
  const t2 = `ANALYSE APPROFONDIE (tour 2):\n${JSON.stringify(tour2Result.parsed, null, 2)}\n\n`;
  const rep = reponsesFinales
    ? `RÉPONSES ADDITIONNELLES:\n${JSON.stringify(reponsesFinales, null, 2)}\n\n`
    : '';

  // Enriched data summary
  const articles = (enrichedData.articles || []).slice(0, 10).map(a =>
    `${a.ref}: ${a.texteSimple || a.texte || a.titre}`
  ).join('\n');

  const normative = enrichedData.normative?.results
    ?.filter(r => r.applicable)
    .map(r => `RÈGLE: ${r.label} → ${JSON.stringify(r.consequence)?.slice(0, 150)} [${r.base_legale}]`)
    .join('\n') || '';

  return await callLLM(TOUR3_SYSTEM, context + t1 + t2 + rep + `\nDONNÉES:\nArticles:\n${articles}\n\nRègles:\n${normative}`, 4000);
}

// ─── Orchestrateur ──────────────────────────────────────────────

// ─── Complexity assessment ──────────────────────────────────────

function assessComplexity(t1Parsed, enriched) {
  let score = 0;
  const reasons = [];

  // Multiple domains = complex
  const domaine = t1Parsed.domaine;
  if (t1Parsed.multi_fiches) { score += 2; reasons.push('multi-fiches'); }

  // Many missing facts = complex
  const missing = t1Parsed.faits_manquants_critiques?.length || 0;
  if (missing >= 3) { score += 2; reasons.push(`${missing} faits manquants`); }
  else if (missing >= 1) { score += 1; reasons.push(`${missing} fait(s) manquant(s)`); }

  // Has contradictory jurisprudence = complex
  const juris = enriched.jurisprudence || [];
  const contra = juris.filter(j => j.role === 'defavorable').length;
  if (contra >= 2) { score += 2; reasons.push(`${contra} arrêts contra`); }
  else if (contra >= 1) { score += 1; reasons.push('jurisprudence contradictoire'); }

  // Urgency = needs depth
  if (t1Parsed.faits_extraits?.urgence) { score += 1; reasons.push('urgence'); }

  // Cantonal variation matters
  if (!t1Parsed.faits_extraits?.canton) { score += 1; reasons.push('canton inconnu'); }

  // Determine level
  let level;
  if (score <= 1) level = 'simple';
  else if (score <= 3) level = 'standard';
  else level = 'complexe';

  return { score, level, reasons, max_tours: level === 'simple' ? 2 : 3 };
}

/**
 * Run adaptive deep analysis.
 * Simple cases: 2 tours (comprendre + conclure direct).
 * Complex cases: 3 tours (comprendre + approfondir avec questions + conclure).
 *
 * Returns with questions if user input needed.
 * Returns final dossier when complete.
 */
export async function deepAnalysis(texte, canton, reponses) {
  // Tour 1: Comprendre
  const t1 = await tour1_comprendre(texte);
  if (!t1) return { error: 'LLM unavailable', status: 'degraded' };

  const domaine = t1.parsed.domaine;

  // Enrich with our data
  const searchResult = queryByProblem(texte, canton);
  const enriched = searchResult.status === 200 ? searchResult.data : {};

  // Add normative compilation
  const normativeFacts = {
    domaine,
    canton: t1.parsed.faits_extraits?.canton || canton,
    ...extractNormativeFacts(t1.parsed),
  };
  enriched.normative = compileNormative(normativeFacts);

  // Assess complexity
  const complexity = assessComplexity(t1.parsed, enriched);

  // Tour 2: Approfondir (always — even simple cases benefit from reading the data)
  const t2 = await tour2_approfondir(texte, t1, reponses, enriched);
  if (!t2) return { error: 'LLM unavailable at tour 2', status: 'degraded', tour1: t1.parsed, complexity };

  // If complex and has remaining questions — return for user input
  const remainingQuestions = t2.parsed.questions_restantes || [];
  if (remainingQuestions.length > 0 && !reponses) {
    return {
      status: 'needs_input',
      tour: 2,
      complexity,
      tour1: t1.parsed,
      tour2: t2.parsed,
      questions: remainingQuestions,
      points_confirmes: t2.parsed.points_confirmes,
      risques: t2.parsed.risques,
      usage: { tour1: t1.usage, tour2: t2.usage },
    };
  }

  // Tour 3: Conclure
  const t3 = await tour3_conclure(texte, t1, t2, enriched, reponses);
  if (!t3) return { error: 'LLM unavailable at tour 3', status: 'degraded', tour1: t1.parsed, tour2: t2.parsed, complexity };

  // Build argumentation graph from enriched data
  const issue = {
    issue_id: 'deep_1',
    domaine,
    articles: (enriched.articles || []).map(a => ({ ref: a.ref, source_id: a.source_id, lienFedlex: a.lienFedlex, titre: a.titre })),
    arrets: (enriched.jurisprudence || []).map(j => ({ signature: j.signature, role: j.role, resultat: j.resultat, source_id: j.source_id, resume: j.resume })),
    anti_erreurs: enriched.antiErreurs || [],
  };
  const argumentation = analyzeIssue(issue);
  const certificate = certifyIssue(issue);

  return {
    status: 'complete',
    tour: 3,
    complexity,
    tour1: t1.parsed,
    tour2: t2.parsed,
    tour3: t3.parsed,
    argumentation,
    certificate,
    normative: enriched.normative,
    usage: { tour1: t1.usage, tour2: t2.usage, tour3: t3.usage },
  };
}

function extractNormativeFacts(t1Parsed) {
  const f = t1Parsed.faits_extraits || {};
  return {
    loyer_mensuel: parseFloat(f.montant) || null,
    anciennete_annees: parseInt(f.anciennete) || null,
    conge_recu: f.actions_deja_faites?.some(a => a.includes('congé') || a.includes('résili')),
    defaut_signale: f.actions_deja_faites?.some(a => a.includes('signal') || a.includes('plainte')),
    commandement_recu: f.actions_deja_faites?.some(a => a.includes('commandement')),
    saisie_salaire: f.actions_deja_faites?.some(a => a.includes('saisie')),
    en_arret_maladie: f.actions_deja_faites?.some(a => a.includes('maladie') || a.includes('arrêt')),
    salaire_impaye: f.actions_deja_faites?.some(a => a.includes('impayé') || a.includes('pas payé')),
  };
}
