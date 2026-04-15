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

function enrichFiche(ficheId) {
  const fiche = ficheMap.get(ficheId);
  if (!fiche) return null;

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

  return {
    fiche,
    articles,
    jurisprudence: jurisprudenceElargie,
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

  // Filter by canton if specified
  if (canton && best) {
    best.escalade = best.escalade.filter(e =>
      e.cantons?.includes(canton.toUpperCase()) || !e.cantons
    );
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
