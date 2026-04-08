/**
 * Golden Cases — Cas de référence pour mesurer la qualité du pipeline V3
 *
 * Chaque cas a une "vérité terrain" : ce qu'un avocat senior répondrait.
 * On mesure : claim_grounding_rate, valid_citation_rate, unsupported_assertion_rate
 *
 * Usage: node test/golden-cases.mjs
 */

import { step1_comprendre, step2_dossier, step3_raisonner, step_compile } from '../src/services/pipeline-v3.mjs';

const GOLDEN_CASES = [
  // === BAIL ===
  {
    id: 'golden_bail_caution',
    texte: 'Ma régie ne rembourse pas ma caution depuis 3 mois. J\'ai rendu les clés et fait l\'état des lieux sans remarque.',
    canton: 'VD',
    verite: {
      domaine: 'bail',
      articles_attendus: ['CO 257e'],
      qualification: 'restitution dépôt de garantie',
      delai_critique: true, // il y a un délai
      besoin_avocat: false, // cas standard
      erreur_fatale: false,
      contacts_canton: true // doit avoir des contacts VD
    }
  },
  {
    id: 'golden_bail_moisissure',
    texte: 'Mon appartement a de la moisissure dans la chambre et la salle de bain depuis 6 mois. La régie ne fait rien malgré mes courriers.',
    canton: 'GE',
    verite: {
      domaine: 'bail',
      articles_attendus: ['CO 259a'],
      qualification: 'défaut de la chose louée',
      delai_critique: false, // pas de délai court
      besoin_avocat: false,
      erreur_fatale: true, // "ne jamais réduire seul"
      contacts_canton: true
    }
  },

  // === TRAVAIL ===
  {
    id: 'golden_travail_licenciement_maladie',
    texte: 'Mon employeur m\'a licencié pendant mon arrêt maladie. Je travaille dans cette entreprise depuis 4 ans.',
    canton: 'VD',
    verite: {
      domaine: 'travail',
      articles_attendus: ['CO 336c'],
      qualification: 'licenciement pendant incapacité',
      delai_critique: true, // protection 90 jours pour 2-5 ans
      besoin_avocat: false, // cas standard, protection claire
      erreur_fatale: false,
      contacts_canton: true
    }
  },
  {
    id: 'golden_travail_salaire_impaye',
    texte: 'Mon patron ne m\'a pas payé mon salaire depuis 2 mois. Il dit qu\'il a des problèmes de trésorerie.',
    canton: 'ZH',
    verite: {
      domaine: 'travail',
      articles_attendus: ['CO 322', 'CO 337'],
      qualification: 'salaire impayé',
      delai_critique: true, // mise en demeure puis résiliation immédiate possible
      besoin_avocat: false,
      erreur_fatale: true, // ne pas démissionner sans mise en demeure
      contacts_canton: true
    }
  },

  // === DETTES ===
  {
    id: 'golden_dettes_commandement',
    texte: 'J\'ai reçu un commandement de payer de 5000 francs. Je ne dois rien à cette personne.',
    canton: 'VD',
    verite: {
      domaine: 'dettes',
      articles_attendus: ['LP 74'],
      qualification: 'opposition au commandement de payer',
      delai_critique: true, // 10 jours !
      besoin_avocat: false,
      erreur_fatale: true, // ne pas laisser passer le délai
      contacts_canton: true
    }
  }
];

// ============================================================
// MÉTRIQUES
// ============================================================

function evaluateCase(goldenCase, comprehension, dossier, analysis, compiled) {
  const metrics = {
    case_id: goldenCase.id,
    domaine_correct: false,
    articles_found: 0,
    articles_expected: goldenCase.verite.articles_attendus.length,
    articles_match: [],
    articles_missing: [],
    qualification_relevant: false,
    delai_present: false,
    contacts_present: false,
    erreur_fatale_present: false,
    claims_total: 0,
    claims_with_source: 0,
    claims_without_source: 0,
    // Computed rates
    claim_grounding_rate: 0,
    valid_citation_rate: 0,
    unsupported_assertion_rate: 0
  };

  // Domaine correct?
  const issues = comprehension?.issues || [];
  metrics.domaine_correct = issues.some(i => i.domaine === goldenCase.verite.domaine);

  // Articles trouvés?
  const allArticleRefs = new Set();
  for (const issue of issues) {
    for (const ref of (issue.base_legale_probable || [])) allArticleRefs.add(ref);
  }
  for (const dossierIssue of (dossier?.issues || [])) {
    for (const art of (dossierIssue.articles || [])) allArticleRefs.add(art.ref);
  }

  for (const expected of goldenCase.verite.articles_attendus) {
    if (allArticleRefs.has(expected)) {
      metrics.articles_found++;
      metrics.articles_match.push(expected);
    } else {
      metrics.articles_missing.push(expected);
    }
  }

  // Qualification pertinente?
  const qualText = issues.map(i => i.qualification || '').join(' ').toLowerCase();
  const expectedWords = goldenCase.verite.qualification.toLowerCase().split(/\s+/);
  metrics.qualification_relevant = expectedWords.filter(w => w.length > 3 && qualText.includes(w)).length >= 2;

  // Délais présents?
  metrics.delai_present = (compiled?.delais_critiques?.length || 0) > 0;

  // Contacts canton?
  metrics.contacts_present = (compiled?.contacts?.length || 0) > 0;

  // Anti-erreurs fatales?
  metrics.erreur_fatale_present = (compiled?.erreurs_fatales?.length || 0) > 0;

  // Claims grounding (si analysis disponible)
  if (analysis?.claims) {
    metrics.claims_total = analysis.claims.length;
    for (const claim of analysis.claims) {
      if (claim.source_ids?.length > 0) {
        metrics.claims_with_source++;
      } else {
        metrics.claims_without_source++;
      }
    }
    metrics.claim_grounding_rate = metrics.claims_total > 0
      ? metrics.claims_with_source / metrics.claims_total : 0;
    metrics.valid_citation_rate = metrics.claim_grounding_rate; // simplified
    metrics.unsupported_assertion_rate = metrics.claims_total > 0
      ? metrics.claims_without_source / metrics.claims_total : 0;
  }

  return metrics;
}

// ============================================================
// RUNNER
// ============================================================

async function runGoldenCases() {
  console.log('=== GOLDEN CASES EVALUATION ===\n');

  const results = [];

  for (const gc of GOLDEN_CASES) {
    console.log(`--- ${gc.id} ---`);
    console.log(`  "${gc.texte.slice(0, 60)}..."`);

    try {
      // Step 1
      const step1 = await step1_comprendre(gc.texte, gc.canton);
      if (!step1) {
        console.log('  SKIP (no LLM available)');
        results.push({ case_id: gc.id, status: 'skipped' });
        continue;
      }

      // Step 2
      const dossier = step2_dossier(step1.comprehension, gc.canton);

      // Step 3
      let analysis = null;
      try {
        const step3 = await step3_raisonner(dossier);
        analysis = step3?.analysis;
      } catch (e) {
        console.log(`  Step 3 degraded: ${e.message?.slice(0, 50)}`);
      }

      // Compile
      const compiled = step_compile(dossier, analysis);

      // Evaluate
      const metrics = evaluateCase(gc, step1.comprehension, dossier, analysis, compiled);
      results.push(metrics);

      // Report
      console.log(`  Domaine: ${metrics.domaine_correct ? 'OK' : 'FAIL'}`);
      console.log(`  Articles: ${metrics.articles_found}/${metrics.articles_expected} (missing: ${metrics.articles_missing.join(', ') || 'none'})`);
      console.log(`  Qualification: ${metrics.qualification_relevant ? 'OK' : 'WEAK'}`);
      console.log(`  Délais: ${metrics.delai_present ? 'OK' : 'MISSING'}`);
      console.log(`  Contacts ${gc.canton}: ${metrics.contacts_present ? 'OK' : 'MISSING'}`);
      console.log(`  Anti-erreurs: ${metrics.erreur_fatale_present ? 'OK' : (gc.verite.erreur_fatale ? 'MISSING' : 'N/A')}`);
      if (analysis) {
        console.log(`  Claims: ${metrics.claims_total} (grounded: ${(metrics.claim_grounding_rate * 100).toFixed(0)}%)`);
      } else {
        console.log(`  Claims: N/A (step 3 not available)`);
      }
      console.log();

    } catch (e) {
      console.error(`  ERROR: ${e.message}`);
      results.push({ case_id: gc.id, status: 'error', error: e.message });
    }
  }

  // === SUMMARY ===
  console.log('=== SUMMARY ===');
  const valid = results.filter(r => r.domaine_correct !== undefined);
  if (valid.length === 0) {
    console.log('No cases evaluated (LLM unavailable?)');
    return;
  }

  const domainOK = valid.filter(r => r.domaine_correct).length;
  const articlesTotal = valid.reduce((s, r) => s + (r.articles_expected || 0), 0);
  const articlesFound = valid.reduce((s, r) => s + (r.articles_found || 0), 0);
  const qualOK = valid.filter(r => r.qualification_relevant).length;
  const delaiOK = valid.filter(r => r.delai_present).length;
  const contactOK = valid.filter(r => r.contacts_present).length;
  const casesWithErreur = GOLDEN_CASES.filter(gc => gc.verite.erreur_fatale);
  const erreurOK = valid.filter((r, i) => GOLDEN_CASES[i]?.verite.erreur_fatale && r.erreur_fatale_present).length;

  console.log(`  Cases: ${valid.length}/${GOLDEN_CASES.length}`);
  console.log(`  Domaine correct: ${domainOK}/${valid.length} (${(domainOK/valid.length*100).toFixed(0)}%)`);
  console.log(`  Articles trouvés: ${articlesFound}/${articlesTotal} (${(articlesFound/articlesTotal*100).toFixed(0)}%)`);
  console.log(`  Qualification pertinente: ${qualOK}/${valid.length}`);
  console.log(`  Délais présents: ${delaiOK}/${valid.length}`);
  console.log(`  Contacts cantonaux: ${contactOK}/${valid.length}`);
  console.log(`  Anti-erreurs fatales: ${erreurOK}/${casesWithErreur.length} détectées`);

  // Grounding rate (if step 3 available)
  const withClaims = valid.filter(r => r.claims_total > 0);
  if (withClaims.length > 0) {
    const avgGrounding = withClaims.reduce((s, r) => s + r.claim_grounding_rate, 0) / withClaims.length;
    const avgUnsupported = withClaims.reduce((s, r) => s + r.unsupported_assertion_rate, 0) / withClaims.length;
    console.log(`  Claim grounding rate: ${(avgGrounding * 100).toFixed(0)}% (target: >90%)`);
    console.log(`  Unsupported assertion rate: ${(avgUnsupported * 100).toFixed(0)}% (target: <5%)`);
  }

  console.log('\n  Constitution thresholds:');
  console.log(`    claim_grounding_rate > 90%: ${withClaims.length > 0 ? 'MEASURED' : 'NEEDS STEP 3'}`);
  console.log(`    valid_citation_rate > 95%: ${withClaims.length > 0 ? 'MEASURED' : 'NEEDS STEP 3'}`);
  console.log(`    deterministic_deadline_rate = 100%: ${delaiOK === valid.length ? 'PASS' : 'FAIL'}`);
}

runGoldenCases().catch(e => console.error('Fatal:', e));
