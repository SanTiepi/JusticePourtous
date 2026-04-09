/**
 * Graph Builder — Génère l'index bidirectionnel du savoir juridique
 *
 * Lit TOUTES les données, extrait TOUTES les références, produit un graphe
 * qui permet de naviguer dans n'importe quelle direction :
 *   article → fiches, jurisprudence, templates, délais, patterns
 *   fiche → fiches liées, articles, arrêts
 *   tag → fiches
 *   domaine → tout
 *
 * Détecte aussi les orphelins (= ce qui manque).
 *
 * Usage: node src/services/graph-builder.mjs
 * Output: src/data/index/graph.json
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');
const indexDir = join(dataDir, 'index');

// --- Helpers ---

function loadJSON(path) {
  if (!existsSync(path)) return null;
  try { return JSON.parse(readFileSync(path, 'utf-8')); }
  catch { return null; }
}

function loadAllInDir(dir) {
  if (!existsSync(dir)) return [];
  const all = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const data = loadJSON(join(dir, f));
    if (Array.isArray(data)) all.push(...data);
    else if (data && typeof data === 'object') {
      for (const v of Object.values(data)) {
        if (Array.isArray(v)) all.push(...v);
      }
    }
  }
  return all;
}

function normalizeRef(ref) {
  // Normalize "art. 259a CO" → "CO 259a", "CO 259 al. 1" → "CO 259 al. 1"
  return ref.trim()
    .replace(/^art\.?\s*/i, '')
    .replace(/\s+/g, ' ');
}

function addToMap(map, key, value) {
  if (!key) return;
  const k = normalizeRef(key);
  if (!map[k]) map[k] = [];
  if (!map[k].includes(value)) map[k].push(value);
}

function addToSet(map, key, values) {
  if (!key || !values) return;
  if (!map[key]) map[key] = new Set();
  for (const v of values) map[key].add(v);
}

// --- Load all data ---

function loadAllData() {
  const fiches = loadAllInDir(join(dataDir, 'fiches'));
  const articles = loadAllInDir(join(dataDir, 'loi'));
  const arrets = loadAllInDir(join(dataDir, 'jurisprudence'));
  const templates = loadAllInDir(join(dataDir, 'templates'));
  const delais = loadAllInDir(join(dataDir, 'delais'));
  const patterns = loadAllInDir(join(dataDir, 'patterns'));
  const antiErreurs = loadAllInDir(join(dataDir, 'anti-erreurs'));
  const casPratiques = loadAllInDir(join(dataDir, 'cas-pratiques'));
  const escalade = loadAllInDir(join(dataDir, 'escalade'));
  const preuves = loadAllInDir(join(dataDir, 'preuves'));
  const taxonomie = loadAllInDir(join(dataDir, 'taxonomie'));
  const recevabilite = loadAllInDir(join(dataDir, 'recevabilite'));
  const workflows = loadJSON(join(dataDir, 'workflows', 'moments-de-vie.json')) || [];
  const cascades = loadJSON(join(dataDir, 'cascades', 'cascades.json')) || [];
  const formulaires = loadAllInDir(join(dataDir, 'formulaires'));
  const couts = loadAllInDir(join(dataDir, 'couts'));
  const cantons = loadJSON(join(dataDir, 'cantons', 'donnees-cantonales.json')) || [];
  const baremes = loadJSON(join(dataDir, 'baremes', 'references-nationales.json')) || {};

  return { fiches, articles, arrets, templates, delais, patterns, antiErreurs,
           casPratiques, escalade, preuves, taxonomie, recevabilite,
           workflows, cascades, formulaires, couts, cantons, baremes };
}

// --- Build the graph ---

export function buildGraph() {
  const data = loadAllData();
  const graph = {
    generatedAt: new Date().toISOString(),
    stats: {},

    // Bidirectional indexes
    articleToFiches: {},
    articleToJurisprudence: {},
    articleToTemplates: {},
    articleToDelais: {},
    articleToPatterns: {},
    articleToAntiErreurs: {},
    articleToPreuves: {},

    ficheToArticles: {},
    ficheToJurisprudence: {},
    ficheToTemplates: {},
    ficheToFiches: {},        // related fiches (same tags, same articles)

    tagToFiches: {},
    domaineToFiches: {},
    domaineToArticles: {},
    domaineToArrets: {},
    domaineToTemplates: {},
    domaineToPatterns: {},
    domaineToAntiErreurs: {},
    domaineToDelais: {},

    // Tables des matières — structure hiérarchique des codes
    tableDesMatieres: {},

    // Orphans (completeness detection)
    orphans: {
      articlesReferencedButMissing: [],
      fichesReferencedButMissing: [],
      cascadePhantoms: [],
      fichesWithoutArticle: [],
      articlesWithoutFiche: [],
      domainesWithoutJurisprudence: [],
    }
  };

  // Known article refs in our loi database
  const knownArticles = new Set(data.articles.map(a => normalizeRef(a.ref)));
  // Known fiche IDs
  const knownFiches = new Set(data.fiches.map(f => f.id));
  // All article refs mentioned anywhere
  const allReferencedArticles = new Set();
  // All fiche refs mentioned anywhere
  const allReferencedFiches = new Set();

  // --- 1. Index fiches ---
  for (const fiche of data.fiches) {
    const ficheId = fiche.id;
    const domaine = fiche.domaine;

    // domaine → fiches
    addToMap(graph.domaineToFiches, domaine, ficheId);

    // tags → fiches
    for (const tag of (fiche.tags || [])) {
      addToMap(graph.tagToFiches, tag.toLowerCase(), ficheId);
    }

    // articles in fiche → bidirectional links
    const ficheArticles = [];
    for (const a of (fiche.reponse?.articles || [])) {
      const ref = normalizeRef(a.ref);
      ficheArticles.push(ref);
      allReferencedArticles.add(ref);
      addToMap(graph.articleToFiches, ref, ficheId);
      addToMap(graph.domaineToArticles, domaine, ref);
    }
    if (ficheArticles.length > 0) {
      graph.ficheToArticles[ficheId] = ficheArticles;
    }

    // jurisprudence in fiche
    for (const j of (fiche.reponse?.jurisprudence || [])) {
      const sig = j.ref || j.signature;
      if (sig) {
        addToMap(graph.ficheToJurisprudence, ficheId, sig);
      }
    }
  }

  // --- 2. Index jurisprudence ---
  // Deduce domaine from filename since it's not always in the data
  const domainesWithJuris = new Set();
  const jurisDir = join(dataDir, 'jurisprudence');
  if (existsSync(jurisDir)) {
    for (const f of readdirSync(jurisDir).filter(f => f.endsWith('.json'))) {
      // index-bail.json → "bail", index-travail.json → "travail"
      const match = f.match(/^index-(\w+)\.json$/);
      if (match) domainesWithJuris.add(match[1]);
    }
  }

  for (const arret of data.arrets) {
    const sig = arret.signature;

    // articles appliqués → jurisprudence
    for (const ref of (arret.articlesAppliques || [])) {
      const r = normalizeRef(ref);
      allReferencedArticles.add(r);
      addToMap(graph.articleToJurisprudence, r, sig);
    }

    addToMap(graph.domaineToArrets, arret.domaine || arret.theme?.split(' ')[0] || 'general', sig);
  }

  // --- 3. Index templates ---
  for (const tpl of data.templates) {
    const tplId = tpl.id;
    addToMap(graph.domaineToTemplates, tpl.domaine, tplId);

    // baseLegale → templates
    const refs = typeof tpl.baseLegale === 'string'
      ? tpl.baseLegale.split(',').map(s => s.trim())
      : (tpl.baseLegale || []);
    for (const ref of refs) {
      if (ref) {
        allReferencedArticles.add(normalizeRef(ref));
        addToMap(graph.articleToTemplates, normalizeRef(ref), tplId);
      }
    }
  }

  // --- 4. Index délais ---
  for (const d of data.delais) {
    const delaiId = d.id || d.procedure;
    addToMap(graph.domaineToDelais, d.domaine, delaiId);

    const ref = d.base_legale;
    if (ref) {
      // May contain multiple refs like "CO 273, CPC 209"
      for (const r of ref.split(',').map(s => s.trim())) {
        if (r) {
          allReferencedArticles.add(normalizeRef(r));
          addToMap(graph.articleToDelais, normalizeRef(r), delaiId);
        }
      }
    }
  }

  // --- 5. Index patterns ---
  for (const p of data.patterns) {
    const patId = p.id || `pattern_${p.domaine}_${data.patterns.indexOf(p)}`;
    addToMap(graph.domaineToPatterns, p.domaine, patId);
  }

  // --- 6. Index anti-erreurs ---
  for (const ae of data.antiErreurs) {
    const aeId = ae.id || `ae_${ae.domaine}_${data.antiErreurs.indexOf(ae)}`;
    addToMap(graph.domaineToAntiErreurs, ae.domaine, aeId);

    const ref = ae.base_legale;
    if (ref) {
      for (const r of ref.split(',').map(s => s.trim())) {
        if (r) {
          allReferencedArticles.add(normalizeRef(r));
          addToMap(graph.articleToAntiErreurs, normalizeRef(r), aeId);
        }
      }
    }
  }

  // --- 7. Index preuves ---
  for (const pr of data.preuves) {
    const ref = pr.base_legale;
    if (ref) {
      for (const r of ref.split(',').map(s => s.trim())) {
        if (r) {
          allReferencedArticles.add(normalizeRef(r));
          addToMap(graph.articleToPreuves, normalizeRef(r), pr.procedure);
        }
      }
    }
  }

  // --- 8. Build fiche-to-fiche links (via shared articles + tags) ---
  const ficheByArticle = {}; // article → [ficheIds]
  for (const [ficheId, arts] of Object.entries(graph.ficheToArticles)) {
    for (const art of arts) {
      if (!ficheByArticle[art]) ficheByArticle[art] = [];
      ficheByArticle[art].push(ficheId);
    }
  }

  for (const fiche of data.fiches) {
    const related = new Set();
    // Same articles → related
    for (const art of (graph.ficheToArticles[fiche.id] || [])) {
      for (const otherId of (ficheByArticle[art] || [])) {
        if (otherId !== fiche.id) related.add(otherId);
      }
    }
    // Same tags → related (lighter weight)
    for (const tag of (fiche.tags || [])) {
      for (const otherId of (graph.tagToFiches[tag.toLowerCase()] || [])) {
        if (otherId !== fiche.id) related.add(otherId);
      }
    }
    if (related.size > 0) {
      graph.ficheToFiches[fiche.id] = [...related].slice(0, 10); // max 10 related
    }
  }

  // --- 9. Cascade phantom detection ---
  for (const cascade of data.cascades) {
    for (const etape of (cascade.etapes || [])) {
      for (const ficheRef of (etape.fichesConcernees || [])) {
        allReferencedFiches.add(ficheRef);
        if (!knownFiches.has(ficheRef)) {
          graph.orphans.cascadePhantoms.push(ficheRef);
        }
      }
    }
  }

  // --- 10. Build tables des matières ---
  // Group articles by law code (CO, CC, LP, LEI, etc.)
  const articlesByCode = {};
  for (const a of data.articles) {
    const parts = a.ref.split(' ');
    const code = parts[0]; // "CO", "CC", "LP", etc.
    if (!articlesByCode[code]) articlesByCode[code] = [];
    articlesByCode[code].push({
      ref: a.ref,
      titre: a.titre,
      domaines: a.domaines || [],
      articlesLies: a.articlesLies || []
    });
  }

  // Sort by article number within each code
  for (const [code, arts] of Object.entries(articlesByCode)) {
    arts.sort((a, b) => {
      const numA = parseInt(a.ref.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.ref.replace(/[^0-9]/g, '')) || 0;
      return numA - numB;
    });

    // Build hierarchical TOC structure
    graph.tableDesMatieres[code] = {
      nom: getCodeName(code),
      rs: getCodeRS(code),
      articles: arts,
      total: arts.length
    };
  }

  // --- 11. Orphan detection ---
  // Articles referenced but not in our loi database
  graph.orphans.articlesReferencedButMissing = [...allReferencedArticles]
    .filter(ref => !knownArticles.has(ref))
    .sort();

  // Fiches without any article reference
  graph.orphans.fichesWithoutArticle = data.fiches
    .filter(f => !f.reponse?.articles?.length)
    .map(f => f.id);

  // Articles in loi that no fiche references
  graph.orphans.articlesWithoutFiche = data.articles
    .filter(a => !graph.articleToFiches[normalizeRef(a.ref)])
    .map(a => a.ref);

  // Domains without jurisprudence
  const allDomaines = ['bail', 'travail', 'famille', 'dettes', 'etrangers'];
  graph.orphans.domainesWithoutJurisprudence = allDomaines
    .filter(d => !domainesWithJuris.has(d));

  // Dedupe
  graph.orphans.cascadePhantoms = [...new Set(graph.orphans.cascadePhantoms)];

  // --- Stats ---
  graph.stats = {
    totalFiches: data.fiches.length,
    totalArticles: data.articles.length,
    totalArrets: data.arrets.length,
    totalTemplates: data.templates.length,
    totalDelais: data.delais.length,
    totalPatterns: data.patterns.length,
    totalAntiErreurs: data.antiErreurs.length,
    totalCasPratiques: data.casPratiques.length,
    totalEscalade: data.escalade.length,
    totalPreuves: data.preuves.length,
    totalFormulaires: data.formulaires.length,
    totalTaxonomie: data.taxonomie.length,
    totalWorkflows: data.workflows.length,
    totalCascades: data.cascades.length,
    uniqueArticleRefs: allReferencedArticles.size,
    knownArticleRefs: knownArticles.size,
    missingArticleRefs: graph.orphans.articlesReferencedButMissing.length,
    ficheToFicheLinks: Object.keys(graph.ficheToFiches).length,
    codesInTDM: Object.keys(graph.tableDesMatieres).length,
    cascadePhantoms: graph.orphans.cascadePhantoms.length,
  };

  return graph;
}

function getCodeName(code) {
  const names = {
    CO: 'Code des obligations',
    CC: 'Code civil suisse',
    LP: 'Loi sur la poursuite pour dettes et la faillite',
    LEI: 'Loi sur les étrangers et l\'intégration',
    LAsi: 'Loi sur l\'asile',
    LN: 'Loi sur la nationalité suisse',
    CPC: 'Code de procédure civile',
    CP: 'Code pénal suisse',
    LTr: 'Loi sur le travail',
    LACI: 'Loi sur l\'assurance-chômage',
    LEg: 'Loi sur l\'égalité',
    LAVS: 'Loi sur l\'AVS',
    LPP: 'Loi sur la prévoyance professionnelle',
    LAA: 'Loi sur l\'assurance-accidents',
    LAMal: 'Loi sur l\'assurance-maladie',
    Cst: 'Constitution fédérale',
  };
  return names[code] || code;
}

function getCodeRS(code) {
  const rs = {
    CO: '220', CC: '210', LP: '281.1', LEI: '142.20', LAsi: '142.31',
    LN: '141.0', CPC: '272', CP: '311.0', LTr: '822.11', LACI: '837.0',
    LEg: '151.1', LAVS: '831.10', LPP: '831.40', LAA: '832.20',
    LAMal: '832.10', Cst: '101',
  };
  return rs[code] || '';
}

// --- CLI: Generate and save ---
if (process.argv[1]?.includes('graph-builder')) {
  console.log('Building knowledge graph...');
  const graph = buildGraph();

  if (!existsSync(indexDir)) mkdirSync(indexDir, { recursive: true });
  const outFile = join(indexDir, 'graph.json');
  writeFileSync(outFile, JSON.stringify(graph, null, 2), 'utf-8');

  console.log(`\n${'='.repeat(60)}`);
  console.log('  KNOWLEDGE GRAPH — JusticePourtous');
  console.log(`${'='.repeat(60)}\n`);
  console.log('  Stats:');
  for (const [k, v] of Object.entries(graph.stats)) {
    console.log(`    ${k}: ${v}`);
  }

  console.log('\n  Tables des matières:');
  for (const [code, tdm] of Object.entries(graph.tableDesMatieres)) {
    console.log(`    ${code} (${tdm.nom}): ${tdm.total} articles`);
  }

  console.log('\n  Fiche-to-fiche links:');
  const topLinked = Object.entries(graph.ficheToFiches)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);
  for (const [fiche, related] of topLinked) {
    console.log(`    ${fiche} → ${related.length} fiches liées`);
  }

  console.log('\n  Orphelins:');
  console.log(`    Articles manquants: ${graph.orphans.articlesReferencedButMissing.length}`);
  console.log(`    Fiches fantômes (cascades): ${graph.orphans.cascadePhantoms.length}`);
  console.log(`    Fiches sans article: ${graph.orphans.fichesWithoutArticle.length}`);
  console.log(`    Articles sans fiche: ${graph.orphans.articlesWithoutFiche.length}`);
  console.log(`    Domaines sans jurisprudence: ${graph.orphans.domainesWithoutJurisprudence.join(', ') || 'aucun'}`);

  console.log(`\n  → ${outFile}`);
}

export { loadAllData };
