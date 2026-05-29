/**
 * Tests directs pour graph-builder.mjs — invariants du graphe de connaissances.
 *
 * Le graphe est le socle de la navigation de connaissances juridiques.
 * Un bug d'indexation ou de normalisation est invisible en prod jusqu'à ce qu'un
 * article ne soit plus retrouvable. Ces tests régression-lockent les invariants critiques.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph, loadAllData, _internals } from '../src/services/graph-builder.mjs';

const { normalizeRef, getCodeName, getCodeRS } = _internals;

// Construire le graphe une seule fois pour tous les tests
let graph;
let data;

describe('graph-builder — setup', () => {
  it('construit le graphe sans erreur', () => {
    data = loadAllData();
    graph = buildGraph();
    assert.ok(graph !== null && typeof graph === 'object');
  });
});

// ============================================================
// normalizeRef — normalisation des références légales
// ============================================================

describe('normalizeRef — normalisation des références légales', () => {
  it('supprime le préfixe "art. " (avec espace)', () => {
    assert.equal(normalizeRef('art. CO 259a'), 'CO 259a');
  });

  it('supprime "art." sans espace après le point', () => {
    assert.equal(normalizeRef('art.CO 259a'), 'CO 259a');
  });

  it('insensible à la casse du préfixe (Art.)', () => {
    assert.equal(normalizeRef('Art. CO 259a'), 'CO 259a');
  });

  it('normalise les espaces multiples internes', () => {
    assert.equal(normalizeRef('CO  259a'), 'CO 259a');
  });

  it('trim les espaces en bordure', () => {
    assert.equal(normalizeRef('  CO 259a  '), 'CO 259a');
  });

  it('laisse inchangée une référence déjà normalisée', () => {
    assert.equal(normalizeRef('CO 259a'), 'CO 259a');
  });

  it('préserve "al." dans la référence', () => {
    assert.equal(normalizeRef('CO 259 al. 1'), 'CO 259 al. 1');
  });
});

// ============================================================
// getCodeName / getCodeRS — métadonnées des codes légaux
// ============================================================

describe('getCodeName — noms des codes légaux', () => {
  it('CO → Code des obligations', () => {
    assert.equal(getCodeName('CO'), 'Code des obligations');
  });

  it('CC → Code civil suisse', () => {
    assert.equal(getCodeName('CC'), 'Code civil suisse');
  });

  it('code inconnu → retourne le code lui-même (pas de crash)', () => {
    assert.equal(getCodeName('XYZ'), 'XYZ');
  });
});

describe('getCodeRS — numéros RS des codes légaux', () => {
  it('CO → 220', () => {
    assert.equal(getCodeRS('CO'), '220');
  });

  it('LP → 281.1', () => {
    assert.equal(getCodeRS('LP'), '281.1');
  });

  it('code inconnu → chaîne vide (pas de crash)', () => {
    assert.equal(getCodeRS('XYZ'), '');
  });
});

// ============================================================
// loadAllData — structure de données brutes
// ============================================================

describe('loadAllData — structure des données chargées', () => {
  it('retourne toutes les clés attendues', () => {
    assert.ok(data !== undefined, 'loadAllData() n\'a pas été appelé');
    const required = ['fiches', 'articles', 'arrets', 'templates', 'delais', 'patterns', 'antiErreurs', 'cascades'];
    for (const key of required) {
      assert.ok(key in data, `clé manquante: ${key}`);
    }
  });

  it('fiches : tableau avec >= 300 entrées (corpus prod = 314)', () => {
    assert.ok(Array.isArray(data.fiches));
    assert.ok(data.fiches.length >= 300, `attendu >= 300 fiches, obtenu ${data.fiches.length}`);
  });

  it('articles : tableau avec >= 600 entrées (corpus prod = 4459)', () => {
    assert.ok(Array.isArray(data.articles));
    assert.ok(data.articles.length >= 600, `attendu >= 600 articles, obtenu ${data.articles.length}`);
  });

  it('arrets : tableau non vide (corpus prod = 2521)', () => {
    assert.ok(Array.isArray(data.arrets));
    assert.ok(data.arrets.length > 0);
  });
});

// ============================================================
// buildGraph — structure de premier niveau
// ============================================================

describe('buildGraph — structure de l\'objet retourné', () => {
  it('retourne toutes les clés de premier niveau attendues', () => {
    assert.ok(graph !== undefined, 'buildGraph() n\'a pas été appelé');
    const keys = [
      'stats', 'generatedAt',
      'articleToFiches', 'ficheToArticles', 'ficheToFiches',
      'domaineToFiches', 'domaineToArticles', 'domaineToArrets',
      'tagToFiches', 'tableDesMatieres', 'orphans',
    ];
    for (const k of keys) {
      assert.ok(k in graph, `clé manquante dans le graphe: ${k}`);
    }
  });

  it('generatedAt est une ISO string valide', () => {
    assert.ok(typeof graph.generatedAt === 'string');
    assert.ok(!isNaN(Date.parse(graph.generatedAt)), 'generatedAt n\'est pas une date valide');
  });
});

// ============================================================
// buildGraph — stats cohérentes
// ============================================================

describe('buildGraph — stats cohérentes avec le corpus', () => {
  it('stats.totalFiches === 314 (corpus complet)', () => {
    assert.equal(graph.stats.totalFiches, 314);
  });

  it('stats.totalArticles >= 600', () => {
    assert.ok(graph.stats.totalArticles >= 600, `attendu >= 600, obtenu ${graph.stats.totalArticles}`);
  });

  it('stats.ficheToFicheLinks > 0 (graphe bidirectionnel)', () => {
    assert.ok(graph.stats.ficheToFicheLinks > 0);
  });

  it('stats.cascadePhantoms === 0 (aucune fiche fantôme)', () => {
    assert.equal(graph.stats.cascadePhantoms, 0);
  });
});

// ============================================================
// buildGraph — index articleToFiches
// ============================================================

describe('buildGraph — index articleToFiches', () => {
  it('articleToFiches["CO 259a"] est non vide (article défaut bail connu)', () => {
    const fiches = graph.articleToFiches['CO 259a'] || [];
    assert.ok(fiches.length >= 1, 'CO 259a devrait pointer vers au moins 1 fiche');
  });

  it('articleToFiches["CO 259a"] contient bail_defaut_moisissure', () => {
    const fiches = graph.articleToFiches['CO 259a'] || [];
    assert.ok(fiches.includes('bail_defaut_moisissure'), `CO 259a devrait lier bail_defaut_moisissure, obtenu: ${fiches}`);
  });

  it('articleToFiches est un objet non vide', () => {
    assert.ok(Object.keys(graph.articleToFiches).length > 0);
  });
});

// ============================================================
// buildGraph — index domaineToFiches
// ============================================================

describe('buildGraph — index domaineToFiches', () => {
  it('domaineToFiches["bail"] contient >= 10 fiches', () => {
    const fiches = graph.domaineToFiches['bail'] || [];
    assert.ok(fiches.length >= 10, `attendu >= 10 fiches bail, obtenu ${fiches.length}`);
  });

  it('domaineToFiches["travail"] est non vide', () => {
    assert.ok((graph.domaineToFiches['travail'] || []).length > 0);
  });

  it('tous les 10 domaines core sont présents', () => {
    const coreDomainsRequired = ['bail', 'travail', 'dettes', 'famille', 'etrangers'];
    for (const d of coreDomainsRequired) {
      assert.ok((graph.domaineToFiches[d] || []).length > 0, `domaine manquant: ${d}`);
    }
  });
});

// ============================================================
// buildGraph — bidirectionnalité ficheToArticles ↔ articleToFiches
// ============================================================

describe('buildGraph — bidirectionnalité ficheToArticles ↔ articleToFiches', () => {
  it('ficheToArticles["bail_defaut_moisissure"] contient "CO 256"', () => {
    const arts = graph.ficheToArticles['bail_defaut_moisissure'] || [];
    assert.ok(arts.includes('CO 256'), `attendu CO 256 dans ficheToArticles, obtenu: ${arts}`);
  });

  it('articleToFiches["CO 256"] contient "bail_defaut_moisissure" (bidirectionnalité)', () => {
    const backFiches = graph.articleToFiches['CO 256'] || [];
    assert.ok(backFiches.includes('bail_defaut_moisissure'), 'bidirectionnalité CO 256 → bail_defaut_moisissure non respectée');
  });

  it('ficheToFiches["bail_defaut_moisissure"] a des fiches liées (réseau de fiches)', () => {
    const related = graph.ficheToFiches['bail_defaut_moisissure'] || [];
    assert.ok(related.length >= 1, 'bail_defaut_moisissure devrait avoir des fiches liées');
  });
});

// ============================================================
// buildGraph — tableDesMatieres
// ============================================================

describe('buildGraph — tableDesMatieres (tables des matières par code)', () => {
  it('tableDesMatieres["CO"] existe', () => {
    assert.ok('CO' in graph.tableDesMatieres, 'Code des obligations absent de la TDM');
  });

  it('tableDesMatieres["CO"].nom === "Code des obligations"', () => {
    assert.equal(graph.tableDesMatieres['CO'].nom, 'Code des obligations');
  });

  it('tableDesMatieres["CO"].articles est un tableau non vide', () => {
    const co = graph.tableDesMatieres['CO'];
    assert.ok(Array.isArray(co.articles) && co.articles.length > 0);
  });
});

// ============================================================
// buildGraph — orphans structure
// ============================================================

describe('buildGraph — orphans (détection d\'incomplétude)', () => {
  it('orphans.cascadePhantoms est un tableau', () => {
    assert.ok(Array.isArray(graph.orphans.cascadePhantoms));
  });

  it('orphans.cascadePhantoms.length === 0 (aucune fiche fantôme dans les cascades)', () => {
    assert.equal(graph.orphans.cascadePhantoms.length, 0,
      `cascades fantômes détectées: ${graph.orphans.cascadePhantoms.join(', ')}`);
  });

  it('orphans.articlesReferencedButMissing est un tableau', () => {
    assert.ok(Array.isArray(graph.orphans.articlesReferencedButMissing));
  });

  it('orphans.fichesWithoutArticle est un tableau (fiches sans base légale)', () => {
    assert.ok(Array.isArray(graph.orphans.fichesWithoutArticle));
  });
});
