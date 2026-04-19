/**
 * Knowledge Engine — Moteur de décision traçable
 *
 * 4 points d'entrée, 1 moteur. Chaque réponse vient avec
 * sa chaîne de provenance complète.
 *
 * Ce qui nous différencie de ChatGPT :
 * - Traçabilité : chaque affirmation → source exacte
 * - Complétude : "voici ce qu'on sait ET ce qu'on ne sait pas"
 * - Intelligence praticien : patterns, anti-erreurs, signaux faibles
 * - Cascade : "voici votre problème ET ce qui va suivre"
 */

import { buildGraph, loadAllData } from './graph-builder.mjs';
import { semanticSearch, expandQuery } from './semantic-search.mjs';
import { getSourceByRef, getSourceBySignature } from './source-registry.mjs';
// Matching jurisprudence cantonale (entscheidsuche) — gap démocratique comblé
import { findCantonalMatches } from './cantonal-juris-matcher.mjs';
import { enrichEscaladeWithMatrix } from './cantons-matrix.mjs';
import { computeFreshness } from './freshness-badge.mjs';

// Always build graph fresh from data files at startup (takes ~60ms)
// This ensures the graph is never stale relative to the data files.
const graph = buildGraph();

// Load all raw data for enrichment
const allData = loadAllData();

// Build lookup maps
const ficheMap = new Map(allData.fiches.map(f => [f.id, f]));
const articleMap = new Map(allData.articles.map(a => [a.ref, a]));
const arretMap = new Map(allData.arrets.map(a => [a.signature, a]));
const templateMap = new Map(allData.templates.map(t => [t.id, t]));

// --- Enrichment: given a fiche ID, get EVERYTHING related ---
// Read-through cache. `allData` + `graph` sont figés au boot → résultat pur par ficheId.
// Invalidation via `_clearEnrichCache()` pour les tests qui mutent.
const enrichCache = new Map();
const enrichStats = { hits: 0, misses: 0 };

export function _enrichCacheStats() {
  return {
    size: enrichCache.size,
    hits: enrichStats.hits,
    misses: enrichStats.misses,
    hit_rate: enrichStats.hits + enrichStats.misses === 0
      ? 0
      : enrichStats.hits / (enrichStats.hits + enrichStats.misses),
  };
}

export function _clearEnrichCache() {
  enrichCache.clear();
  enrichStats.hits = 0;
  enrichStats.misses = 0;
}

function enrichFiche(ficheId) {
  const cached = enrichCache.get(ficheId);
  if (cached) {
    enrichStats.hits++;
    // Shallow clone pour isoler les callers qui font `result.X = ...` (ex. filtrage
    // canton, ajout caselaw_canon). Sans ça, un caller mute le cache partagé.
    return { ...cached };
  }
  enrichStats.misses++;
  const built = _buildEnrichedFiche(ficheId);
  if (built) enrichCache.set(ficheId, built);
  return built ? { ...built } : null;
}

function _buildEnrichedFiche(ficheId) {
  const rawFiche = ficheMap.get(ficheId);
  if (!rawFiche) return null;
  // Injecte le badge fraîcheur sur la fiche. Copie pour ne pas polluer ficheMap.
  const fiche = { ...rawFiche, freshness: computeFreshness(rawFiche) };

  // Articles complets (pas juste les refs) — enrichis avec source_id
  const articleRefs = graph.ficheToArticles[ficheId] || [];
  const articles = articleRefs
    .map(ref => {
      const art = articleMap.get(ref);
      if (!art) return null;
      const src = getSourceByRef(ref);
      return { ...art, source_id: src?.source_id || null, tier: src?.tier || null };
    })
    .filter(Boolean);

  // Jurisprudence — enrichie avec source_id + role citoyen
  const jurisRefs = graph.ficheToJurisprudence[ficheId] || [];
  const jurisprudence = jurisRefs
    .map(sig => {
      const arret = arretMap.get(sig);
      if (!arret) return null;
      const src = getSourceBySignature(sig);
      return { ...arret, source_id: src?.source_id || null, role: classifyArretRole(arret.resultat) };
    })
    .filter(Boolean);

  // Also find jurisprudence via shared articles
  const jurisViaArticles = new Set(jurisRefs);
  for (const ref of articleRefs) {
    for (const sig of (graph.articleToJurisprudence[ref] || [])) {
      jurisViaArticles.add(sig);
    }
  }
  // Also find contra jurisprudence from same domain (for contradictoire)
  // This ensures the dossier has both pro AND contra even when articles don't overlap
  const domainArretSigs = graph.domaineToArrets[fiche.domaine] || [];
  for (const sig of domainArretSigs) {
    if (jurisViaArticles.has(sig)) continue;
    const arret = arretMap.get(sig);
    if (!arret) continue;
    const role = classifyArretRole(arret.resultat);
    if (role === 'defavorable' || role === 'neutre') {
      jurisViaArticles.add(sig);
    }
  }

  const jurisprudenceElargie = [...jurisViaArticles]
    .map(sig => {
      const arret = arretMap.get(sig);
      if (!arret) return null;
      const src = getSourceBySignature(sig);
      return { ...arret, source_id: src?.source_id || null, role: classifyArretRole(arret.resultat) };
    })
    .filter(Boolean);

  // Templates liés (via articles partagés)
  const templateIds = new Set();
  for (const ref of articleRefs) {
    for (const tplId of (graph.articleToTemplates[ref] || [])) {
      templateIds.add(tplId);
    }
  }
  // Also templates of same domain
  for (const tplId of (graph.domaineToTemplates[fiche.domaine] || [])) {
    templateIds.add(tplId);
  }
  const templates = [...templateIds]
    .map(id => templateMap.get(id))
    .filter(Boolean);

  // Délais liés
  const delaiIds = new Set();
  for (const ref of articleRefs) {
    for (const dId of (graph.articleToDelais[ref] || [])) {
      delaiIds.add(dId);
    }
  }
  const delais = allData.delais.filter(d =>
    delaiIds.has(d.id || d.procedure) ||
    d.domaine === fiche.domaine
  );

  // Anti-erreurs du même domaine
  const antiErreurs = allData.antiErreurs.filter(ae =>
    ae.domaine === fiche.domaine
  );

  // Patterns du même domaine
  const patterns = allData.patterns.filter(p =>
    p.domaine === fiche.domaine
  );

  // Preuves liées
  const preuves = allData.preuves.filter(p =>
    p.domaine === fiche.domaine
  );

  // Cascades qui mentionnent cette fiche
  const cascades = allData.cascades.filter(c =>
    c.etapes?.some(e => e.fichesConcernees?.includes(ficheId))
  );

  // Escalade pour ce domaine
  const escalade = allData.escalade.filter(e =>
    e.domaines?.includes(fiche.domaine)
  );

  // Fiches liées
  const relatedIds = graph.ficheToFiches[ficheId] || [];
  const related = relatedIds
    .map(id => {
      const f = ficheMap.get(id);
      return f ? { id: f.id, domaine: f.domaine, titre: f.reponse?.explication?.slice(0, 100) + '...', tags: f.tags } : null;
    })
    .filter(Boolean);

  // Confiance — determined by source quality
  const confiance = determineConfiance(fiche, articles, jurisprudenceElargie);

  // Ce qu'on ne sait pas
  const lacunes = detectLacunes(fiche, articles, jurisprudenceElargie, delais);

  // Jurisprudence cantonale (entscheidsuche matcher hérité) — compat backward.
  // Le nouveau pipeline est `caselaw/index.buildCanonForFiche` qui produit
  // leading_cases + nuances + cantonal_practice. Le matcher simple reste
  // exposé pour compat mais le front doit migrer vers le canon.
  let jurisprudence_cantonale = [];
  try {
    jurisprudence_cantonale = findCantonalMatches(fiche, { limit: 5, minScore: 3 });
  } catch (_) { /* silent */ }

  return {
    fiche,
    articles,
    jurisprudence: jurisprudenceElargie,
    jurisprudence_cantonale,
    templates,
    delais,
    antiErreurs,
    patterns,
    preuves,
    cascades,
    escalade,
    related,
    confiance,
    lacunes,
    _meta: {
      ficheId,
      domaine: fiche.domaine,
      articlesCount: articles.length,
      jurisprudenceCount: jurisprudenceElargie.length,
      templatesCount: templates.length,
      relatedCount: related.length,
      generatedAt: new Date().toISOString()
    }
  };
}

// --- Query by problem (citizen entry point) ---

export function queryByProblem(text, canton) {
  if (!text) return { status: 400, error: 'Texte requis' };

  // Semantic search: expands profane language to juridical terms
  const topResults = semanticSearch(text, allData.fiches, 5);

  // Also try taxonomie for qualification
  const { terms } = expandQuery(text);
  const termKeys = [...terms.keys()].map(t => t.toLowerCase());

  // Minimum score threshold — below this, the match is not confident enough
  const MIN_SCORE_THRESHOLD = 5;

  if (topResults.length === 0 || topResults[0].score < MIN_SCORE_THRESHOLD) {
    // Taxonomie fallback
    const taxMatch = allData.taxonomie.find(t =>
      termKeys.some(w => t.probleme_profane?.toLowerCase().includes(w)) ||
      termKeys.some(w => t.qualification_juridique?.toLowerCase().includes(w))
    );
    if (taxMatch) {
      return {
        status: 200,
        data: {
          type: 'taxonomie',
          qualification: taxMatch,
          suggestion: `Votre problème semble relever de : ${taxMatch.qualification_juridique}`,
          domaine: taxMatch.domaine
        }
      };
    }
    return {
      status: 200,
      data: {
        type: 'unclear',
        message: 'Nous n\'avons pas pu identifier votre situation juridique. Essayez de décrire votre problème plus en détail.',
        suggestions: [
          'Précisez le domaine (bail, travail, famille, dettes...)',
          'Décrivez ce qui s\'est passé et quand',
          'Indiquez votre canton'
        ],
        bestScore: topResults.length > 0 ? topResults[0].score : 0
      }
    };
  }

  // Enrich the best match
  const best = enrichFiche(topResults[0].fiche.id);

  if (best) {
    // Enrichissement cantons-matrix : ajoute autorités cantonales + fallback fédéral.
    // Fait AVANT le filtre canton pour que l'enrichissement matrix coexiste avec
    // l'escalade de base, puis on filtre par canton (en gardant les entrées sans
    // champ cantons, supposées fédérales/universelles).
    best.escalade = enrichEscaladeWithMatrix(best.escalade, canton, best.fiche?.domaine);
    if (canton) {
      best.escalade = best.escalade.filter(e =>
        !e.cantons || e.cantons.includes(canton.toUpperCase())
      );
    }
  }

  return {
    status: 200,
    data: {
      type: 'enriched',
      ...best,
      alternatives: topResults.slice(1).map(s => ({
        id: s.fiche.id,
        domaine: s.fiche.domaine,
        tags: s.fiche.tags,
        score: s.score
      }))
    }
  };
}

// --- Query by article (lawyer entry point) ---

export function queryByArticle(ref) {
  if (!ref) return { status: 400, error: 'Référence d\'article requise' };

  const normalRef = ref.trim();

  // Find the article in our database
  const article = articleMap.get(normalRef);

  // Find all connected entities via graph
  const ficheIds = graph.articleToFiches[normalRef] || [];
  const arretSigs = graph.articleToJurisprudence[normalRef] || [];
  const templateIds = graph.articleToTemplates[normalRef] || [];
  const delaiIds = graph.articleToDelais[normalRef] || [];
  const antiErreurIds = graph.articleToAntiErreurs[normalRef] || [];
  const preuveProcs = graph.articleToPreuves[normalRef] || [];

  const fiches = ficheIds.map(id => {
    const f = ficheMap.get(id);
    return f ? { id: f.id, domaine: f.domaine, tags: f.tags, explication: f.reponse?.explication?.slice(0, 200) } : null;
  }).filter(Boolean);

  const jurisprudence = arretSigs.map(sig => arretMap.get(sig)).filter(Boolean);
  const templates = templateIds.map(id => templateMap.get(id)).filter(Boolean);
  const delais = allData.delais.filter(d => delaiIds.includes(d.id || d.procedure));
  const antiErreurs = allData.antiErreurs.filter(ae => antiErreurIds.includes(ae.id || `ae_${ae.domaine}_${allData.antiErreurs.indexOf(ae)}`));
  const preuves = allData.preuves.filter(p => preuveProcs.includes(p.procedure));

  // Find related articles via articlesLies
  const relatedArticles = (article?.articlesLies || [])
    .map(ref => articleMap.get(ref))
    .filter(Boolean);

  // Table des matières context
  const code = normalRef.split(' ')[0];
  const tdm = graph.tableDesMatieres[code];

  return {
    status: 200,
    data: {
      article: article || { ref: normalRef, status: 'non indexé dans notre base' },
      fiches,
      jurisprudence,
      templates,
      delais,
      antiErreurs,
      preuves,
      relatedArticles,
      tableDesMatieres: tdm ? { code, nom: tdm.nom, totalArticles: tdm.total } : null,
      _meta: {
        ref: normalRef,
        inDatabase: !!article,
        fichesCount: fiches.length,
        jurisprudenceCount: jurisprudence.length,
        templatesCount: templates.length
      }
    }
  };
}

// --- Query by court decision (judge entry point) ---

export function queryByDecision(signature) {
  if (!signature) return { status: 400, error: 'Signature d\'arrêt requise' };

  const arret = arretMap.get(signature);
  if (!arret) {
    return { status: 404, error: `Arrêt '${signature}' non trouvé` };
  }

  // Find all articles this decision applies
  const articles = (arret.articlesAppliques || [])
    .map(ref => ({
      ref,
      article: articleMap.get(ref),
      fiches: (graph.articleToFiches[ref] || []).map(id => ficheMap.get(id)).filter(Boolean)
    }));

  // Find related decisions (same articles)
  const relatedSigs = new Set();
  for (const ref of (arret.articlesAppliques || [])) {
    for (const sig of (graph.articleToJurisprudence[ref] || [])) {
      if (sig !== signature) relatedSigs.add(sig);
    }
  }
  const relatedArrets = [...relatedSigs]
    .map(sig => arretMap.get(sig))
    .filter(Boolean)
    .slice(0, 10);

  return {
    status: 200,
    data: {
      arret,
      articlesAppliques: articles,
      relatedArrets,
      _meta: {
        signature,
        articlesCount: articles.length,
        relatedCount: relatedArrets.length
      }
    }
  };
}

// --- Query by domain (association entry point) ---

export function queryByDomain(domain, filters = {}) {
  const d = domain.toLowerCase();
  const fiches = (graph.domaineToFiches[d] || [])
    .map(id => ficheMap.get(id))
    .filter(Boolean);

  if (fiches.length === 0) {
    return { status: 404, error: `Domaine '${domain}' non trouvé` };
  }

  const articleRefs = graph.domaineToArticles[d] || [];
  const arretSigs = graph.domaineToArrets[d] || [];
  const templateIds = graph.domaineToTemplates[d] || [];
  const patternIds = graph.domaineToPatterns[d] || [];

  // Canton filter
  let escalade = allData.escalade.filter(e => e.domaines?.includes(d));
  if (filters.canton) {
    escalade = escalade.filter(e =>
      e.cantons?.includes(filters.canton.toUpperCase())
    );
  }

  return {
    status: 200,
    data: {
      domaine: d,
      fiches: fiches.map(f => ({ id: f.id, tags: f.tags, sousDomaine: f.sousDomaine })),
      articlesCount: articleRefs.length,
      jurisprudenceCount: arretSigs.length,
      templatesCount: templateIds.length,
      patternsCount: patternIds.length,
      delais: allData.delais.filter(dl => dl.domaine === d),
      antiErreurs: allData.antiErreurs.filter(ae => ae.domaine === d),
      patterns: allData.patterns.filter(p => p.domaine === d),
      casPratiques: allData.casPratiques.filter(c => c.domaine === d),
      escalade,
      cascades: allData.cascades.filter(c =>
        c.etapes?.some(e => e.fichesConcernees?.some(fId =>
          ficheMap.get(fId)?.domaine === d
        ))
      ),
      _meta: {
        domaine: d,
        fichesCount: fiches.length,
        canton: filters.canton || null
      }
    }
  };
}

// --- Query complete (enrich a single fiche with full context) ---

export function queryComplete(ficheId) {
  const result = enrichFiche(ficheId);
  if (!result) return { status: 404, error: `Fiche '${ficheId}' non trouvée` };
  return { status: 200, data: result };
}

/**
 * Variante async qui enrichit avec le canon caselaw 2.0 :
 *   - leading_cases
 *   - nuances
 *   - cantonal_practice
 *   - similar_cases (panneau secondaire)
 * À utiliser dans triage-engine pour les réponses publiques.
 */
export async function queryCompleteWithCanon(ficheId, { citizenCanton = null } = {}) {
  const result = enrichFiche(ficheId);
  if (!result) return { status: 404, error: `Fiche '${ficheId}' non trouvée` };
  try {
    const { buildCanonForFiche } = await import('./caselaw/index.mjs');
    const canon = await buildCanonForFiche(result.fiche, { citizenCanton });
    result.caselaw_canon = canon;
  } catch (err) {
    result.caselaw_canon = { error: err.message, leading_cases: [], nuances: [], cantonal_practice: [], similar_cases: [] };
  }
  return { status: 200, data: result };
}

// --- Table des matières ---

export function getTableDesMatieres(code) {
  if (code) {
    const tdm = graph.tableDesMatieres[code.toUpperCase()];
    if (!tdm) return { status: 404, error: `Code '${code}' non trouvé` };
    return { status: 200, data: tdm };
  }
  // Return all TOCs summary
  const summary = {};
  for (const [k, v] of Object.entries(graph.tableDesMatieres)) {
    summary[k] = { nom: v.nom, rs: v.rs, totalArticles: v.total };
  }
  return { status: 200, data: { codes: summary } };
}

// --- Completeness dashboard ---

export function getCompleteness() {
  return {
    status: 200,
    data: {
      stats: graph.stats,
      orphans: graph.orphans,
      coverage: {
        articlesIndexes: `${graph.stats.knownArticleRefs}/${graph.stats.uniqueArticleRefs} (${Math.round(graph.stats.knownArticleRefs/graph.stats.uniqueArticleRefs*100)}%)`,
        fichesAvecLiens: `${graph.stats.ficheToFicheLinks}/${graph.stats.totalFiches}`,
        cascadesCompletes: `${graph.stats.totalCascades - graph.stats.cascadePhantoms > 0 ? 'partiel' : 'complet'}`
      },
      tableDesMatieres: Object.entries(graph.tableDesMatieres).map(([code, tdm]) => ({
        code, nom: tdm.nom, articles: tdm.total
      })),
      generatedAt: graph.generatedAt
    }
  };
}

// --- Helpers ---

function determineConfiance(fiche, articles, jurisprudence) {
  // More sources = higher confidence
  if (articles.length >= 2 && jurisprudence.length >= 2) return 'certain';
  if (articles.length >= 1 && jurisprudence.length >= 1) return 'probable';
  if (articles.length >= 1) return 'variable';
  if (jurisprudence.length >= 1) return 'variable';
  return 'incertain';
}

// Citizen-perspective role classification (same logic as object-registry)
const CITIZEN_ACTORS = new Set(['locataire', 'employe', 'debiteur', 'etranger', 'enfant', 'epouse', 'mere', 'pere', 'heritier']);
const AUTHORITY_ACTORS = new Set(['bailleur', 'employeur', 'creancier', 'autorite']);

function classifyArretRole(resultat) {
  if (!resultat) return 'neutre';
  const n = resultat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (n.includes('rejete') || n.includes('rejet')) return 'defavorable';
  if (n.startsWith('partiellement')) return 'neutre';
  if (n.startsWith('favorable_')) {
    const actor = n.replace('favorable_', '');
    if (CITIZEN_ACTORS.has(actor)) return 'favorable';
    if (AUTHORITY_ACTORS.has(actor)) return 'defavorable';
    return 'favorable';
  }
  if (n.includes('favorable')) return 'favorable';
  return 'neutre';
}

// --- Suggested follow-up questions (dynamic, per fiche) ---

// Common follow-up patterns per domaine
const DOMAINE_FOLLOWUPS = {
  bail: [
    { text: 'Comment mettre mon propriétaire en demeure ?', query: 'mise en demeure propriétaire bail' },
    { text: 'Puis-je résilier mon bail de manière anticipée ?', query: 'résiliation anticipée bail locataire' },
    { text: 'Puis-je consigner mon loyer ?', query: 'consignation loyer défaut logement' },
    { text: 'Comment contester une augmentation de loyer ?', query: 'contestation augmentation loyer' },
    { text: 'Quels sont mes droits en cas de résiliation abusive ?', query: 'résiliation abusive bail protection locataire' },
  ],
  travail: [
    { text: 'Comment contester un licenciement abusif ?', query: 'licenciement abusif contestation indemnités' },
    { text: 'Ai-je droit à un certificat de travail ?', query: 'certificat de travail obligation employeur' },
    { text: 'Comment réclamer des heures supplémentaires impayées ?', query: 'heures supplémentaires salaire impayé' },
    { text: 'Quels sont mes droits pendant le délai de congé ?', query: 'délai de congé droits employé' },
    { text: 'Puis-je toucher le chômage après un licenciement ?', query: 'inscription chômage après licenciement' },
  ],
  famille: [
    { text: 'Comment calculer la pension alimentaire ?', query: 'calcul pension alimentaire enfant' },
    { text: 'Quels sont mes droits de visite ?', query: 'droit de visite parent non gardien' },
    { text: 'Comment demander le divorce ?', query: 'procédure divorce suisse étapes' },
    { text: 'Comment protéger les enfants en cas de conflit ?', query: 'mesures protection enfant divorce' },
  ],
  dettes: [
    { text: 'Comment calculer mon minimum vital ?', query: 'calcul minimum vital saisie poursuite' },
    { text: 'Puis-je faire opposition à une poursuite ?', query: 'opposition poursuite commandement de payer' },
    { text: 'Comment demander un arrangement de paiement ?', query: 'arrangement paiement dette échelonnement' },
    { text: 'Quelles sont les conséquences d\'un acte de défaut de biens ?', query: 'acte défaut de biens conséquences' },
  ],
  etrangers: [
    { text: 'Comment renouveler mon permis de séjour ?', query: 'renouvellement permis séjour procédure' },
    { text: 'Puis-je faire un recours contre un refus de permis ?', query: 'recours refus permis séjour' },
    { text: 'Quelles sont les conditions de naturalisation ?', query: 'naturalisation suisse conditions procédure' },
  ],
  assurances: [
    { text: 'Comment contester une décision AI ?', query: 'recours décision assurance invalidité' },
    { text: 'Ai-je droit à des prestations complémentaires ?', query: 'prestations complémentaires conditions calcul' },
    { text: 'Comment déclarer un accident de travail ?', query: 'déclaration accident travail LAA procédure' },
  ],
  violence: [
    { text: 'Comment obtenir une mesure d\'éloignement ?', query: 'mesure éloignement violence domestique' },
    { text: 'Où trouver un hébergement d\'urgence ?', query: 'foyer accueil hébergement urgence violence' },
    { text: 'Comment déposer une plainte pénale ?', query: 'plainte pénale violence procédure' },
  ],
};

/**
 * Generate context-specific follow-up questions based on fiche, triage, and data.
 * Does NOT hardcode per fiche — derives dynamically from:
 *   1. Related fiches (alternatives)
 *   2. Article references (legal concepts)
 *   3. Domain follow-up patterns
 *   4. Missing questions from LLM triage
 */
export function generateSuggestedQuestions(ficheId, enrichedData, triageData) {
  const suggestions = [];
  const seen = new Set();

  function add(text, query) {
    const key = query.toLowerCase().trim();
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push({ text, query });
  }

  const fiche = enrichedData?.fiche || ficheMap.get(ficheId);
  if (!fiche) return [];

  const domaine = fiche.domaine;
  const sousDomaine = fiche.sousDomaine;

  // 1. Missing questions from LLM triage — rephrase as user-friendly suggestions
  const questionsManquantes = triageData?.questions || triageData?.questionsManquantes || [];
  for (const q of questionsManquantes.slice(0, 2)) {
    const qText = typeof q === 'string' ? q : q.text || q.question || '';
    if (qText.length > 10) {
      add(qText, qText);
    }
  }

  // 2. Related fiches — suggest exploring alternatives
  const relatedIds = graph.ficheToFiches[ficheId] || [];
  for (const relId of relatedIds.slice(0, 2)) {
    const rel = ficheMap.get(relId);
    if (!rel) continue;
    const label = rel.reponse?.explication?.slice(0, 80) || rel.tags?.join(', ') || relId.replace(/_/g, ' ');
    const query = rel.tags?.slice(0, 3).join(' ') || relId.replace(/_/g, ' ');
    add(label.endsWith('...') ? label : label + '...', query);
  }

  // 3. Article-derived suggestions — extract key legal concepts from referenced articles
  const articleRefs = graph.ficheToArticles[ficheId] || [];
  for (const ref of articleRefs.slice(0, 3)) {
    const art = articleMap.get(ref);
    if (!art || !art.titre) continue;
    // Create a question from the article title
    const titre = art.titre.replace(/\.$/, '');
    if (titre.length > 15 && titre.length < 100) {
      add(`Que dit la loi sur : ${titre} ?`, `${ref} ${titre}`);
    }
  }

  // 4. Domain follow-up patterns — filtered to exclude current fiche's topic
  const domainFollowups = DOMAINE_FOLLOWUPS[domaine] || [];
  const ficheTagsLower = (fiche.tags || []).map(t => t.toLowerCase());
  for (const fp of domainFollowups) {
    // Skip if the follow-up is too similar to the current fiche
    const queryWords = fp.query.toLowerCase().split(/\s+/);
    const overlap = queryWords.filter(w => ficheTagsLower.includes(w)).length;
    if (overlap >= 2) continue; // too similar to current result
    add(fp.text, fp.query);
  }

  // Return max 5
  return suggestions.slice(0, 5);
}

function detectLacunes(fiche, articles, jurisprudence, delais) {
  const lacunes = [];

  if (jurisprudence.length === 0) {
    lacunes.push({
      type: 'jurisprudence_manquante',
      message: 'Aucun arrêt TF indexé pour cette situation. La position juridique repose uniquement sur le texte de loi.',
      impact: 'moyen'
    });
  }

  if (delais.length === 0) {
    lacunes.push({
      type: 'delais_manquants',
      message: 'Les délais spécifiques pour cette procédure ne sont pas encore documentés.',
      impact: 'élevé'
    });
  }

  // Check if any referenced article is missing from our database
  const missingArticles = (fiche.reponse?.articles || [])
    .filter(a => !articleMap.has(a.ref))
    .map(a => a.ref);

  if (missingArticles.length > 0) {
    lacunes.push({
      type: 'articles_non_indexes',
      message: `${missingArticles.length} article(s) cité(s) non encore indexé(s) dans notre base : ${missingArticles.join(', ')}`,
      impact: 'faible'
    });
  }

  return lacunes;
}
