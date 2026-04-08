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
import { randomBytes } from 'node:crypto';

// In-memory session store for multi-turn triage
const sessions = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

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

  // Resume existing session if refining
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

    // 8. Create session for follow-up
    let newSessionId = null;
    if (questionsManquantes.length > 0) {
      newSessionId = randomBytes(16).toString('hex');
      sessions.set(newSessionId, {
        texte,
        canton: effectiveCanton,
        navigation: nav,
        enrichedPrimary: primary,
        enrichedAll: enrichedFiches,
        createdAt: Date.now()
      });
      // Cleanup old sessions
      cleanupSessions();
    }

    // 9. Generate action plan (even partial)
    const planAction = generateActionPlan(primary, effectiveCanton);

    // 10. Build result
    return {
      status: 200,
      data: {
        trouve: true,
        complet: !hasUnansweredCritical,
        sessionId: newSessionId,

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

        // Transparency
        confiance: primary.confiance || 'variable',
        lacunes: (primary.lacunes || []).map(l => l.message || l),

        // Cost
        usage: result.usage,

        // Always
        disclaimer: buildDisclaimer()
      }
    };
  } catch (err) {
    // If LLM fails, fall back to semantic search
    console.error('LLM navigator error, falling back:', err.message);
    return triageFallback(texte, canton);
  }
}

// ============================================================
// REFINE — second tour with user answers
// ============================================================

async function refineTriage(sessionId, reponses) {
  const session = sessions.get(sessionId);
  if (!session) {
    return { status: 404, error: 'Session expirée ou introuvable. Recommencez l\'analyse.' };
  }

  try {
    // Build context with previous answers
    const fullText = session.texte + '\n\nInformations complémentaires : ' +
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

    const primary = enrichedFiches[0] || session.enrichedPrimary;
    const effectiveCanton = session.canton || nav.infos_extraites?.canton;
    const scoring = scoreComplexity(primary, enrichedFiches);
    const urgence = deriveUrgency(primary);
    const besoinAvocat = needsLawyer(scoring, urgence, primary);
    const planAction = generateActionPlan(primary, effectiveCanton);

    // Clean up session
    sessions.delete(sessionId);

    return {
      status: 200,
      data: {
        trouve: true,
        complet: true,
        sessionId: null,
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
        confiance: primary.confiance || 'variable',
        lacunes: (primary.lacunes || []).map(l => l.message || l),
        usage: result.usage,
        disclaimer: buildDisclaimer()
      }
    };
  } catch (err) {
    console.error('Refine error:', err.message);
    // Return what we had
    const primary = session.enrichedPrimary;
    if (primary) {
      const scoring = scoreComplexity(primary, session.enrichedAll || [primary]);
      return {
        status: 200,
        data: {
          trouve: true, complet: false,
          diagnostic: 'Erreur lors de l\'affinage. Voici notre meilleure analyse avec les informations disponibles.',
          domaine: primary.fiche.domaine,
          ficheId: primary.fiche.id,
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

function buildDisclaimer() {
  return 'JusticePourtous fournit des informations juridiques générales basées sur le droit suisse. ' +
    'Le contenu provient de sources vérifiées (Fedlex, jurisprudence TF) mais ne constitue pas un avis juridique personnalisé. ' +
    'Consultez un professionnel du droit pour toute décision importante.';
}

function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}
