/**
 * Eval Harness — Mesure reproductible de la qualité des réponses
 *
 * Inspiré de LRAGE (arXiv 2504.01840) + Stanford "22 criteria" + LegalBench.
 * Adapté au contexte suisse citoyen (bail/travail/dettes V1).
 *
 * Chaque golden case est évalué sur 10 rubrics pondérés.
 * Le harness produit un score par cas, par domaine, et global.
 * Pas de LLM-as-judge pour l'instant — rubrics vérifiables par code.
 */

// ─── Rubrics definition (10 criteria) ───────────────────────────

const RUBRICS = [
  {
    id: 'domain_correct',
    label: 'Domaine juridique correct',
    weight: 2,
    evaluate: (result, expected) =>
      result.domaine === expected.domaine,
  },
  {
    id: 'fiche_match',
    label: 'Fiche principale correcte',
    weight: 2,
    evaluate: (result, expected) =>
      expected.fiche_ids.includes(result.fiche_id),
  },
  {
    id: 'articles_present',
    label: 'Articles de loi clés présents',
    weight: 2,
    evaluate: (result, expected) => {
      const found = new Set((result.articles || []).map(a => a.ref));
      const required = expected.required_articles || [];
      // At least ONE required article must be present (OR logic, not AND)
      return required.length === 0 || required.some(ref => found.has(ref));
    },
  },
  {
    id: 'articles_grounded',
    label: 'Articles ont des source_ids',
    weight: 1,
    evaluate: (result) => {
      const articles = result.articles || [];
      return articles.length > 0 && articles.every(a => a.source_id);
    },
  },
  {
    id: 'juris_present',
    label: 'Jurisprudence pertinente trouvée',
    weight: 1,
    evaluate: (result) =>
      (result.arrets || result.jurisprudence || []).length > 0,
  },
  {
    id: 'juris_contradictoire',
    label: 'Jurisprudence pro ET contra',
    weight: 1,
    evaluate: (result) => {
      const arrets = result.arrets || result.jurisprudence || [];
      const hasFav = arrets.some(a => a.role === 'favorable' || a.resultat?.includes('favorable'));
      const hasCon = arrets.some(a => a.role === 'defavorable' || a.role === 'neutre');
      return hasFav && hasCon;
    },
  },
  {
    id: 'delai_present',
    label: 'Délai identifié',
    weight: 1,
    evaluate: (result) =>
      (result.delais || []).length > 0,
  },
  {
    id: 'anti_erreur_present',
    label: 'Anti-erreurs fournies',
    weight: 0.5,
    evaluate: (result) =>
      (result.anti_erreurs || []).length > 0,
  },
  {
    id: 'contact_present',
    label: 'Contact/autorité fourni',
    weight: 0.5,
    evaluate: (result) =>
      (result.contacts || []).length > 0,
  },
  {
    id: 'certificate_sufficient',
    label: 'Certificat de suffisance passé',
    weight: 2,
    evaluate: (result) =>
      result.certificate?.status === 'sufficient',
  },
  {
    id: 'expected_juris_match',
    label: 'Jurisprudence attendue présente si requise',
    weight: 1,
    evaluate: (result, expected) => {
      if (!expected.expected_juris) return true; // not required → pass
      return (result.arrets || result.jurisprudence || []).length > 0;
    },
  },
  {
    id: 'expected_delai_match',
    label: 'Délai attendu présent si requis',
    weight: 1,
    evaluate: (result, expected) => {
      if (!expected.expected_delai) return true; // not required → pass
      return (result.delais || []).length > 0;
    },
  },
];

// ─── Golden cases ───────────────────────────────────────────────

const GOLDEN_CASES = [
  // BAIL
  {
    id: 'bail_moisissure_vd',
    domaine: 'bail',
    description: 'Moisissure persistante dans appartement VD',
    query: 'Mon appartement a de la moisissure depuis 6 mois et le propriétaire ne fait rien. Canton de Vaud.',
    canton: 'VD',
    fiche_ids: ['bail_defaut_moisissure'],
    required_articles: ['CO 259a'],
    expected_juris: true,
    expected_delai: true,
  },
  {
    id: 'bail_caution_ge',
    domaine: 'bail',
    description: 'Restitution caution après départ GE',
    query: 'J ai quitté mon appartement il y a 3 mois et le bailleur ne me rend pas la caution. Genève.',
    canton: 'GE',
    fiche_ids: ['bail_caution_restitution', 'bail_garantie', 'bail_depot_garantie'],
    required_articles: ['CO 257e'],
    expected_juris: true,
    expected_delai: true,
  },
  {
    id: 'bail_expulsion_vd',
    domaine: 'bail',
    description: 'Menace expulsion pour retard loyer VD',
    query: 'Ma régie veut me foutre dehors car j ai 2 mois de retard de loyer. Vaud.',
    canton: 'VD',
    fiche_ids: ['bail_expulsion_retard', 'bail_conge_retard_loyer', 'bail_loyers_impayes'],
    required_articles: ['CO 257d'],
    expected_juris: false,
    expected_delai: true,
  },
  {
    id: 'bail_augmentation_ne',
    domaine: 'bail',
    description: 'Augmentation loyer abusive NE',
    query: 'Mon proprio augmente le loyer de 200 francs sans justification. Neuchâtel.',
    canton: 'NE',
    fiche_ids: ['bail_loyer_abusif', 'bail_augmentation_loyer'],
    required_articles: ['CO 269', 'CO 269a', 'CO 269d', 'CO 270b'],
    expected_juris: true,
    expected_delai: true,
  },

  // TRAVAIL
  {
    id: 'travail_licenciement_maladie',
    domaine: 'travail',
    description: 'Licenciement pendant arrêt maladie',
    query: 'Mon employeur m a licencié pendant mon arrêt maladie après 3 ans de service.',
    canton: null,
    fiche_ids: ['travail_licenciement_maladie', 'travail_protection_maladie'],
    required_articles: ['CO 336c'],
    expected_juris: true,
    expected_delai: true,
  },
  {
    id: 'travail_salaire_impaye',
    domaine: 'travail',
    description: 'Salaire impayé depuis 2 mois',
    query: 'Mon patron ne me paie plus mon salaire depuis 2 mois.',
    canton: null,
    fiche_ids: ['travail_salaire_impaye', 'travail_saisie_salaire'],
    required_articles: ['CO 322', 'LP 93'],
    expected_juris: false,
    expected_delai: true,
  },
  {
    id: 'travail_harcelement',
    domaine: 'travail',
    description: 'Harcèlement au travail (mobbing)',
    query: 'Je subis du mobbing au travail, mon chef me met la pression tous les jours.',
    canton: null,
    fiche_ids: ['travail_harcelement', 'travail_mobbing'],
    required_articles: ['CO 328'],
    expected_juris: true,
    expected_delai: false,
  },

  // DETTES
  {
    id: 'dettes_commandement_payer',
    domaine: 'dettes',
    description: 'Réception commandement de payer contesté',
    query: 'J ai reçu un commandement de payer de 5000 francs mais je ne dois rien.',
    canton: null,
    fiche_ids: ['dettes_commandement_payer', 'dettes_commandement_contestation'],
    required_articles: ['LP 74', 'LP 75'],
    expected_juris: false,
    expected_delai: true,
  },
  {
    id: 'dettes_saisie_salaire',
    domaine: 'dettes',
    description: 'Saisie sur salaire minimum vital',
    query: 'L office des poursuites veut saisir mon salaire mais je gagne très peu.',
    canton: null,
    fiche_ids: ['dettes_saisie_salaire', 'dettes_minimum_vital'],
    required_articles: ['LP 93'],
    expected_juris: false,
    expected_delai: true,
  },
  {
    id: 'dettes_prescription',
    domaine: 'dettes',
    description: 'Dette prescrite réclamée',
    query: 'On me réclame une dette de plus de 12 ans. Est-ce que c est prescrit?',
    canton: null,
    fiche_ids: ['dettes_prescription', 'dettes_acte_defaut_biens'],
    required_articles: ['CO 127', 'CO 128', 'LP 149a'],
    expected_juris: false,
    expected_delai: false,
  },
];

// ─── Evaluation engine ──────────────────────────────────────────

/**
 * Evaluate a single result against a golden case.
 * @param {object} result — from pipeline or search, with certificate attached
 * @param {object} goldenCase — from GOLDEN_CASES
 * @returns {object} evaluation with score per rubric + total
 */
export function evaluateCase(result, goldenCase) {
  const maxScore = RUBRICS.reduce((s, r) => s + r.weight, 0);
  const evaluations = RUBRICS.map(rubric => {
    const passed = rubric.evaluate(result, goldenCase);
    return {
      id: rubric.id,
      label: rubric.label,
      weight: rubric.weight,
      passed,
      points: passed ? rubric.weight : 0,
    };
  });

  const totalPoints = evaluations.reduce((s, e) => s + e.points, 0);
  const score = Math.round((totalPoints / maxScore) * 100);

  return {
    case_id: goldenCase.id,
    domaine: goldenCase.domaine,
    description: goldenCase.description,
    score,
    max_score: maxScore,
    total_points: totalPoints,
    evaluations,
    passed_count: evaluations.filter(e => e.passed).length,
    total_count: evaluations.length,
  };
}

/**
 * Run a batch evaluation function against all golden cases.
 * @param {function} analyzeFn — async (query, canton) => result object
 * @returns {object} full report with per-case + aggregate scores
 */
export async function runEvalSuite(analyzeFn) {
  const results = [];

  for (const gc of GOLDEN_CASES) {
    try {
      const result = await analyzeFn(gc.query, gc.canton);
      const evaluation = evaluateCase(result, gc);
      results.push({ ...evaluation, error: null });
    } catch (err) {
      results.push({
        case_id: gc.id,
        domaine: gc.domaine,
        description: gc.description,
        score: 0,
        error: err.message,
        evaluations: [],
      });
    }
  }

  // Aggregate by domain
  const byDomain = {};
  for (const r of results) {
    if (!byDomain[r.domaine]) byDomain[r.domaine] = [];
    byDomain[r.domaine].push(r);
  }

  const domainScores = {};
  for (const [domain, cases] of Object.entries(byDomain)) {
    const avg = Math.round(
      cases.reduce((s, c) => s + c.score, 0) / cases.length
    );
    domainScores[domain] = {
      cases: cases.length,
      avg_score: avg,
      min_score: Math.min(...cases.map(c => c.score)),
      max_score: Math.max(...cases.map(c => c.score)),
    };
  }

  const globalAvg = Math.round(
    results.reduce((s, r) => s + r.score, 0) / results.length
  );

  return {
    global_score: globalAvg,
    total_cases: results.length,
    by_domain: domainScores,
    results,
    rubrics: RUBRICS.map(r => ({ id: r.id, label: r.label, weight: r.weight })),
    generated_at: new Date().toISOString(),
  };
}

// ─── Exports ────────────────────────────────────────────────────

export { GOLDEN_CASES, RUBRICS };
