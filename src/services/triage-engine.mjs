/**
 * Triage Engine v3 — LLM-navigué, données vérifiées
 *
 * Flow :
 * 1. LLM identifie la situation + extrait les infos + pose les questions
 * 2. Knowledge engine charge les fiches identifiées + enrichit
 * 3. Scoring calcule la complexité sur les données structurées
 * 4. Action planner génère le plan d'action
 * 5. Tout le contenu juridique vient de nos fiches, JAMAIS du LLM
 *
 * Fallback : si pas de clé API → semantic search (v1)
 */

import { callNavigator, isAvailable as llmAvailable } from './llm-navigator.mjs';
import { queryByProblem, queryComplete } from './knowledge-engine.mjs';
import { generateActionPlan } from './action-planner.mjs';
import { semanticSearch } from './semantic-search.mjs';
import { getAllFiches } from './fiches.mjs';
import {
  createCase, getCase, touchCase, updateCaseState, recordRound,
  advancePaymentGate, exportCase
} from './case-store.mjs';
import { enrichTriageResult } from './triage-enrichment.mjs';
import * as _objectRegistry from './object-registry.mjs';
import { buildCanonForFiche } from './caselaw/index.mjs';
import { createLogger } from './logger.mjs';

const log = createLogger('triage');

// enrichDecisionHolding est optionnel (pas encore exposé par object-registry).
// Import défensif : si absent, on renvoie l'arrêt tel quel.
const enrichDecisionHolding = typeof _objectRegistry.enrichDecisionHolding === 'function'
  ? _objectRegistry.enrichDecisionHolding
  : (d) => d;

/**
 * Construit le canon caselaw pour la réponse publique. Best-effort :
 * tout échec est silent — le triage renvoie la réponse sans canon.
 */
async function buildCanonSafe(fiche, citizenCanton) {
  if (!fiche) return null;
  try {
    return await buildCanonForFiche(fiche, { citizenCanton });
  } catch { return null; }
}

/**
 * Triage — point d'entrée principal
 *
 * @param {string} texte - Description du problème en langage libre
 * @param {string} [canton] - Canton de l'utilisateur
 * @param {string} [sessionId] - Pour les tours suivants
 * @param {object} [reponses] - Réponses aux questions posées au tour précédent
 */
export async function triage(texte, canton, sessionId, reponses) {
  if (!texte && !sessionId) {
    return { status: 400, error: 'Décrivez votre problème en quelques mots' };
  }

  // Resume existing session if refining (sessionId = case_id in the new store)
  if (sessionId && reponses) {
    return await refineTriage(sessionId, reponses);
  }

  if (!texte || texte.trim().length < 3) {
    return { status: 400, error: 'Décrivez votre problème en quelques mots' };
  }

  // Try LLM navigator first, fall back to semantic search
  if (llmAvailable()) {
    return await triageLLM(texte, canton);
  } else {
    return triageFallback(texte, canton);
  }
}

/**
 * Cost estimation — show price BEFORE execution
 */
export function estimateCost(type) {
  const costs = {
    triage: { min: 2, max: 2, description: 'Analyse de votre situation + plan d\'action' },
    approfondissement: { min: 5, max: 5, description: 'Questions de suivi + cas similaires + stratégie' },
    lettre: { min: 10, max: 15, description: 'Lettre personnalisée prête à envoyer' },
    document: { min: 15, max: 25, description: 'Analyse d\'un document reçu (OCR + analyse)' }
  };
  return costs[type] || null;
}

// ============================================================
// LLM-POWERED TRIAGE
// ============================================================

async function triageLLM(texte, canton) {
  try {
    // 1. LLM navigates: identifies fiches, extracts info, suggests questions
    const result = await callNavigator(texte);
    const nav = result.navigation;

    // 2. Load identified fiches via knowledge engine
    const ficheIds = nav.fiches_pertinentes || [];
    const enrichedFiches = [];

    for (const ficheId of ficheIds.slice(0, 3)) {
      const complete = queryComplete(ficheId);
      if (complete.status === 200) {
        enrichedFiches.push(complete.data);
      }
    }

    // Primary fiche = first match
    const primary = enrichedFiches[0];

    if (!primary) {
      return {
        status: 200,
        data: buildNoMatchResult(nav, canton)
      };
    }

    // 3. Apply extracted canton if not provided
    const effectiveCanton = canton || nav.infos_extraites?.canton;

    // 4. Calculate complexity from structured data
    const scoring = scoreComplexity(primary, enrichedFiches);

    // 5. Determine urgency from deadline data
    const urgence = deriveUrgency(primary);

    // 6. Determine lawyer need
    const besoinAvocat = needsLawyer(scoring, urgence, primary);

    // 7. Check if we need more info
    const questionsManquantes = nav.questions_manquantes || [];
    const hasUnansweredCritical = questionsManquantes.some(q => q.importance === 'critique');

    // 8. Create case (case-store) for follow-up — every triage gets a case_id
    //    Si questions manquantes : on snapshot la navigation + fiches
    //    pour permettre refine ultérieur. Si pas de questions : case sert
    //    à tracer le flux (payment gate, audit, escalation).
    let caseInfo = null;
    caseInfo = createCase({
      texte,
      canton: effectiveCanton,
      navigation: nav,
      enrichedPrimary: primary,
      enrichedAll: enrichedFiches
    });
    recordRound(caseInfo.case_id, { questions: questionsManquantes, answers: {} });
    // PAYMENT GATE — fix 2026-04-30 : ne déclencher 'complete_bootstrap_round'
    // (qui passe BOOTSTRAP → CONTINUATION_REQUIRED → bloque refine) QUE si le
    // triage est vraiment terminé (pas de questions critiques restantes).
    // Sinon, le user pouvait pas répondre aux follow-up sans payer = absurde.
    // Tant que questionsManquantes critiques restent → le triage continue
    // gratuitement en multi-rounds. Paiement n'intervient que pour les
    // features post-triage (analyse approfondie, lettres premium).
    if (!hasUnansweredCritical) {
      const gateAdvance = advancePaymentGate(caseInfo.case_id, 'complete_bootstrap_round');
      if (gateAdvance?.payment_gate) caseInfo.payment_gate = gateAdvance.payment_gate;
    }

    // 9. Generate action plan (even partial)
    const planAction = generateActionPlan(primary, effectiveCanton);

    // 10. Enrichment Phase 3 (complexity router, domain recommender, urgency)
    const enriched = enrichTriageResult({
      navigation: nav,
      enrichedPrimary: primary,
      enrichedAll: enrichedFiches
    });
    if (caseInfo?.case_id) {
      updateCaseState(caseInfo.case_id, { last_eval: enriched._eval_snapshot });
    }
    const { _eval_snapshot, ...enrichedPublic } = enriched;

    // 10b. Canon caselaw 2.0 — leading / nuances / cantonal_practice
    const caselawCanon = await buildCanonSafe(primary.fiche, effectiveCanton);

    // 11. Build result
    return {
      status: 200,
      data: {
        trouve: true,
        complet: !hasUnansweredCritical,
        sessionId: caseInfo?.case_id || null,
        case_id: caseInfo?.case_id || null,
        resume_expires_at_iso: caseInfo?.resume_expires_at_iso || null,
        payment_gate: caseInfo?.payment_gate || null,

        // Identification (from LLM)
        domaine: primary.fiche.domaine,
        ficheId: primary.fiche.id,
        fichesSecondaires: enrichedFiches.slice(1).map(e => ({
          id: e.fiche.id, domaine: e.fiche.domaine, tags: e.fiche.tags
        })),
        resumeSituation: nav.resume_situation,
        infosExtraites: nav.infos_extraites,

        // Triage (calculated from structured data)
        complexite: scoring.level,
        complexiteScore: scoring.score,
        complexiteDetail: scoring.dimensions,
        besoinAvocat,
        urgence,

        // Questions à poser (if any)
        questionsManquantes: questionsManquantes.map(q => ({
          id: q.id,
          question: q.question,
          choix: q.choix,
          importance: q.importance
        })),

        // Diagnostic
        diagnostic: buildDiagnostic(primary, scoring, besoinAvocat, urgence, hasUnansweredCritical),

        // Plan d'action (from our verified data)
        planAction: planAction ? {
          etapes: planAction.etapes?.slice(0, 6),
          pieges: planAction.pieges?.slice(0, 3),
          documents: planAction.documents,
          lettresDisponibles: planAction.lettresDisponibles?.slice(0, 3)
        } : null,

        // Contacts filtered by canton
        contacts: filterContacts(primary.escalade || [], effectiveCanton),

        // Deadlines from our data
        delaisCritiques: (primary.delais || [])
          .filter(d => d.domaine === primary.fiche.domaine)
          .slice(0, 3)
          .map(d => ({ procedure: d.procedure, delai: d.delai, consequence: d.consequence })),

        // Jurisprudence enrichie (tier/age/role) — Phase 3 (legacy)
        jurisprudence_enriched: (primary.jurisprudence || []).map(enrichDecisionHolding),

        // Caselaw 2.0 — hiérarchie citoyenne (leading → nuances → cantonal_practice → similar)
        caselaw_canon: caselawCanon,

        // Transparency
        confiance: primary.confiance || 'variable',
        lacunes: (primary.lacunes || []).map(l => l.message || l),

        // Enrichment Phase 3 (non-breaking)
        ...enrichedPublic,

        // Cost
        usage: result.usage,

        // Always
        disclaimer: buildDisclaimer()
      }
    };
  } catch (err) {
    // If LLM fails, fall back to semantic search
    log.error('llm_navigator_failed_fallback', { err: err.message });
    return triageFallback(texte, canton);
  }
}

// ============================================================
// REFINE — second tour with user answers
// ============================================================

async function refineTriage(sessionId, reponses) {
  // sessionId est désormais un case_id (case-store)
  const caseRec = getCase(sessionId);
  if (!caseRec) {
    return { status: 404, error: 'Session expirée ou introuvable. Recommencez l\'analyse.' };
  }

  const prevTexte = caseRec.state.texte_initial || '';
  const prevCanton = caseRec.state.canton;
  const prevNav = caseRec.state.navigation;
  const prevPrimary = caseRec.state.enriched_primary;
  const prevAll = caseRec.state.enriched_all || [];

  try {
    // Build context with previous answers
    const fullText = prevTexte + '\n\nInformations complémentaires : ' +
      Object.entries(reponses).map(([q, a]) => `${q}: ${a}`).join(', ');

    // Re-navigate with more info
    const result = await callNavigator(fullText, reponses);
    const nav = result.navigation;

    // Re-enrich
    const ficheIds = nav.fiches_pertinentes || [];
    const enrichedFiches = [];
    for (const ficheId of ficheIds.slice(0, 3)) {
      const complete = queryComplete(ficheId);
      if (complete.status === 200) enrichedFiches.push(complete.data);
    }

    const primary = enrichedFiches[0] || prevPrimary;
    const effectiveCanton = prevCanton || nav.infos_extraites?.canton;
    const scoring = scoreComplexity(primary, enrichedFiches.length ? enrichedFiches : prevAll);
    const urgence = deriveUrgency(primary);
    const besoinAvocat = needsLawyer(scoring, urgence, primary);
    const planAction = generateActionPlan(primary, effectiveCanton);

    // Record round + update state (no delete — case stays 72h)
    recordRound(sessionId, { questions: nav.questions_manquantes || [], answers: reponses });
    updateCaseState(sessionId, {
      navigation: nav,
      enriched_primary: primary,
      enriched_all: enrichedFiches.length ? enrichedFiches : prevAll,
      canton: effectiveCanton,
      last_answers: reponses
    });
    touchCase(sessionId);

    // Enrichment Phase 3
    const enriched = enrichTriageResult({
      navigation: nav,
      enrichedPrimary: primary,
      enrichedAll: enrichedFiches.length ? enrichedFiches : prevAll
    });
    updateCaseState(sessionId, { last_eval: enriched._eval_snapshot });
    const { _eval_snapshot, ...enrichedPublic } = enriched;

    const exportSnap = exportCase(sessionId);

    // Canon caselaw pour le refine aussi
    const caselawCanonRefine = await buildCanonSafe(primary.fiche, effectiveCanton);

    return {
      status: 200,
      data: {
        trouve: true,
        complet: true,
        sessionId,
        case_id: sessionId,
        resume_expires_at_iso: exportSnap?.resume_expires_at_iso || null,
        payment_gate: exportSnap?.payment_gate || null,
        domaine: primary.fiche.domaine,
        ficheId: primary.fiche.id,
        resumeSituation: nav.resume_situation,
        infosExtraites: nav.infos_extraites,
        complexite: scoring.level,
        complexiteScore: scoring.score,
        complexiteDetail: scoring.dimensions,
        besoinAvocat,
        urgence,
        questionsManquantes: [],
        diagnostic: buildDiagnostic(primary, scoring, besoinAvocat, urgence, false),
        planAction: planAction ? {
          etapes: planAction.etapes?.slice(0, 6),
          pieges: planAction.pieges?.slice(0, 3),
          documents: planAction.documents,
          lettresDisponibles: planAction.lettresDisponibles?.slice(0, 3)
        } : null,
        contacts: filterContacts(primary.escalade || [], effectiveCanton),
        delaisCritiques: (primary.delais || [])
          .filter(d => d.domaine === primary.fiche.domaine).slice(0, 3)
          .map(d => ({ procedure: d.procedure, delai: d.delai, consequence: d.consequence })),
        jurisprudence_enriched: (primary.jurisprudence || []).map(enrichDecisionHolding),
        caselaw_canon: caselawCanonRefine,
        confiance: primary.confiance || 'variable',
        lacunes: (primary.lacunes || []).map(l => l.message || l),
        ...enrichedPublic,
        usage: result.usage,
        disclaimer: buildDisclaimer()
      }
    };
  } catch (err) {
    log.error('refine_failed', { err: err.message });
    // Return what we had
    const primary = prevPrimary;
    if (primary) {
      const scoring = scoreComplexity(primary, prevAll.length ? prevAll : [primary]);
      return {
        status: 200,
        data: {
          trouve: true, complet: false,
          case_id: sessionId,
          diagnostic: 'Erreur lors de l\'affinage. Voici notre meilleure analyse avec les informations disponibles.',
          domaine: primary.fiche?.domaine,
          ficheId: primary.fiche?.id,
          complexite: scoring.level,
          disclaimer: buildDisclaimer()
        }
      };
    }
    return { status: 500, error: 'Erreur lors de l\'analyse. Veuillez réessayer.' };
  }
}

// ============================================================
// FALLBACK — semantic search (no LLM, free)
// ============================================================

function triageFallback(texte, canton) {
  const allFiches = getAllFiches();
  const results = semanticSearch(texte, allFiches, 5);

  if (results.length === 0) {
    return {
      status: 200,
      data: buildNoMatchResult(null, canton)
    };
  }

  // IMPORTANT: en mode basique, on ne CHOISIT PAS une fiche.
  // On propose les 3 meilleures et l'utilisateur confirme.
  // Un mauvais match avec un plan d'action = conseil FAUX = dangereux.

  const topMatches = results.slice(0, 3).map(r => {
    const fiche = r.fiche;
    return {
      id: fiche.id,
      domaine: fiche.domaine,
      tags: fiche.tags,
      description: fiche.reponse?.explication?.slice(0, 200) + '...',
      score: r.score
    };
  });

  // On donne quand même le domaine le plus probable et les contacts
  const bestDomaine = topMatches[0].domaine;
  const bestFicheId = topMatches[0].id;
  const complete = queryComplete(bestFicheId);
  const primary = complete.status === 200 ? complete.data : null;

  return {
    status: 200,
    data: {
      trouve: true,
      complet: false,
      sessionId: null,
      mode: 'basique',
      domaine: bestDomaine,

      // On montre les 3 possibilités, pas 1 seule
      situationsPossibles: topMatches,

      diagnostic: `Nous avons identifié ${topMatches.length} situations qui pourraient correspondre à votre problème. ` +
        'Sélectionnez celle qui vous correspond le mieux pour obtenir un plan d\'action précis. ' +
        'Pour une analyse automatique et personnalisée, utilisez l\'analyse complète.',

      // PAS de plan d'action en mode basique — trop risqué de donner le mauvais
      planAction: null,

      // Les contacts et délais du domaine sont fiables même sans match exact
      // Pas de complexité calculée en mode basique — on ne sait pas assez
      complexite: 'incertain',
      complexiteScore: null,
      besoinAvocat: null, // On ne sait pas — mieux que de deviner faux
      urgence: 'ce_mois',

      contacts: primary ? filterContacts(primary.escalade || [], canton) : filterContacts([], canton),
      delaisCritiques: primary ? (primary.delais || [])
        .filter(d => d.domaine === bestDomaine).slice(0, 3)
        .map(d => ({ procedure: d.procedure, delai: d.delai, consequence: d.consequence })) : [],
      confiance: 'incertain',
      lacunes: [
        'Mode basique : nous ne sommes pas certains d\'avoir identifié la bonne situation.',
        'Vérifiez les situations proposées ci-dessus.',
        'Pour une identification automatique et fiable, utilisez l\'analyse complète.'
      ],
      alternatives: topMatches.slice(1),
      disclaimer: buildDisclaimer()
    }
  };
}

// ============================================================
// COMPLEXITY SCORING — from structured data
// ============================================================

function scoreComplexity(primary, allEnriched) {
  const dimensions = {};
  let totalScore = 0;

  // Dimension 1: Domains involved (0-15)
  const domains = new Set();
  for (const e of allEnriched) domains.add(e.fiche?.domaine);
  const domainScore = domains.size === 1 ? 0 : domains.size === 2 ? 8 : 15;
  dimensions.domaines = { count: domains.size, score: domainScore };
  totalScore += domainScore;

  // Dimension 2: Cascades (0-20)
  const cascadeSteps = primary.cascades?.reduce((sum, c) => sum + (c.etapes?.length || 0), 0) || 0;
  const cascadeScore = Math.min(20, cascadeSteps * 4);
  dimensions.cascades = { etapes: cascadeSteps, score: cascadeScore };
  totalScore += cascadeScore;

  // Dimension 3: Data confidence (0-15)
  const confMap = { certain: 0, probable: 5, variable: 10, incertain: 15 };
  const confScore = confMap[primary.confiance] ?? 10;
  dimensions.confiance = { niveau: primary.confiance, score: confScore };
  totalScore += confScore;

  // Dimension 4: Gaps in our knowledge (0-10)
  const gapScore = Math.min(10, (primary.lacunes?.length || 0) * 5);
  dimensions.lacunes = { count: primary.lacunes?.length || 0, score: gapScore };
  totalScore += gapScore;

  // Dimension 5: Template availability (0-10, inverted)
  const tplScore = (primary.templates?.length || 0) >= 2 ? 0 : (primary.templates?.length || 0) === 1 ? 3 : 10;
  dimensions.templates = { count: primary.templates?.length || 0, score: tplScore };
  totalScore += tplScore;

  // Dimension 6: Jurisprudence depth (0-10, inverted)
  const jurisCount = primary.jurisprudence?.length || 0;
  const jurisScore = jurisCount >= 5 ? 0 : jurisCount >= 2 ? 3 : jurisCount >= 1 ? 5 : 10;
  dimensions.jurisprudence = { count: jurisCount, score: jurisScore };
  totalScore += jurisScore;

  // Dimension 7: Pattern availability (0-10, inverted)
  const patScore = (primary.patterns?.length || 0) >= 2 ? 0 : (primary.patterns?.length || 0) === 1 ? 3 : 10;
  dimensions.patterns = { count: primary.patterns?.length || 0, score: patScore };
  totalScore += patScore;

  const level = totalScore < 25 ? 'simple' : totalScore < 50 ? 'moyen' : 'complexe';
  return { score: totalScore, maxScore: 100, level, dimensions };
}

function deriveUrgency(primary) {
  const delais = primary.delais || [];
  const domaine = primary.fiche?.domaine;

  for (const d of delais.filter(d => d.domaine === domaine)) {
    const text = (d.delai || '').toLowerCase();
    if (text.includes('immédiat') || text.includes('24h') || text.includes('48h')) return 'immediate';
    const m = text.match(/(\d+)\s*jours/);
    if (m && parseInt(m[1]) <= 10) return 'cette_semaine';
    if (m && parseInt(m[1]) <= 30) return 'cette_semaine';
  }

  for (const c of (primary.cascades || [])) {
    if (c.etapes?.[0]?.delai?.toLowerCase().includes('immédiat')) return 'cette_semaine';
  }

  return 'ce_mois';
}

function needsLawyer(scoring, urgence, primary) {
  if (scoring.score >= 50) return true;
  if (!(primary.templates?.length) && !(primary.patterns?.length)) return true;
  if (scoring.dimensions.domaines.count >= 3) return true;
  if (primary.confiance === 'incertain') return true;
  if ((primary.lacunes?.length || 0) >= 3) return true;
  if (urgence === 'immediate' && scoring.score >= 15) return true;
  return false;
}

// ============================================================
// HELPERS
// ============================================================

function buildDiagnostic(primary, scoring, besoinAvocat, urgence, isPartial) {
  const parts = [];
  const names = {
    bail: 'droit du bail', travail: 'droit du travail',
    famille: 'droit de la famille', dettes: 'poursuites et faillites',
    etrangers: 'droit des étrangers', assurances: 'assurances sociales',
    social: 'aide sociale', violence: 'violence et protection',
    accident: 'responsabilité civile', entreprise: 'droit commercial'
  };

  if (primary.fiche?.domaine) {
    parts.push(`Votre situation relève du ${names[primary.fiche.domaine] || primary.fiche.domaine}.`);
  }

  if (scoring.level === 'simple') {
    parts.push('C\'est un cas courant et bien documenté.');
  } else if (scoring.level === 'moyen') {
    const reasons = [];
    if (scoring.dimensions.domaines.count > 1) reasons.push('plusieurs domaines juridiques');
    if (scoring.dimensions.cascades.etapes > 0) reasons.push('risque d\'effets en cascade');
    if (scoring.dimensions.confiance.niveau === 'variable') reasons.push('jurisprudence variable');
    parts.push(`Complexité modérée${reasons.length ? ' : ' + reasons.join(', ') + '.' : '.'}`);
  } else {
    parts.push('Situation complexe nécessitant un accompagnement professionnel.');
  }

  if (urgence === 'immediate') parts.push('⚠ Des délais courts courent — agissez immédiatement.');
  else if (urgence === 'cette_semaine') parts.push('Attention aux délais légaux.');

  if (besoinAvocat) parts.push('Nous recommandons de consulter un professionnel du droit.');
  if (isPartial) parts.push('Répondez aux questions ci-dessous pour affiner cette analyse.');

  return parts.join(' ');
}

function filterContacts(escalade, canton) {
  let contacts = escalade;
  if (canton) {
    const c = canton.toUpperCase();
    contacts = contacts.filter(e => e.cantons?.includes(c) || !e.cantons?.length);
  }
  return contacts.slice(0, 5).map(e => ({
    nom: e.nom, type: e.type, gratuit: e.gratuit,
    contact: e.contact, conditions: e.conditions
  }));
}

function buildNoMatchResult(nav, canton) {
  return {
    trouve: false, complet: false,
    complexite: 'incertain',
    besoinAvocat: true,
    urgence: 'ce_mois',
    diagnostic: 'Nous n\'avons pas trouvé de fiche correspondant à votre situation. ' +
      'Contactez un service d\'aide juridique gratuit pour un premier avis.',
    resumeSituation: nav?.resume_situation || null,
    contacts: filterContacts([], canton),
    lacunes: ['Situation non couverte par notre base'],
    disclaimer: buildDisclaimer()
  };
}

/**
 * Disclaimer LLCA — export nommé requis par escalation-pack et server.mjs.
 * Retourne un objet { short, full, llca_note } selon freeze disclaimer UI.
 */
export function buildDisclaimer() {
  const short = 'JusticePourtous n\'est pas un avocat. Ces informations sont générales, pas un conseil juridique personnalisé.';
  const full = 'JusticePourtous réduit le besoin de consulter un avocat payant sur les cas citoyens standardisés. ' +
    'Le contenu provient de sources vérifiées (Fedlex, jurisprudence TF) et ne constitue pas un avis juridique personnalisé. ' +
    'Pour une représentation en justice, une stratégie complexe, ou une négociation fine, consultez un avocat.';
  const llca_note = 'Conforme LLCA art. 12 — ceci est de l\'information juridique générale, pas un conseil personnalisé.';
  const scope_superior = 'Supérieur à l\'avocat uniquement sur : intake standardisé, exhaustivité des sources contradictoires, auditabilité, vitesse, suivi opérationnel.';
  const scope_inferior = 'Inférieur à l\'avocat sur : représentation, stratégie fine, négociation complexe, plaidoirie.';
  return { short, full, llca_note, scope_superior, scope_inferior };
}

