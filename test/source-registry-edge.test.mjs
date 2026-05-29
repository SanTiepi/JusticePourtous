import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  articleSourceId, arretSourceId,
  extractPrefix, resolveByPrefix, RS_BY_PREFIX,
  getSourceById, getSourceByRef, getSourceBySignature,
  getSourcesForArticleRef, getSourcesForArretSignature,
  resolveSources, validateClaimSources,
  getSourcesByTier, getSourcesByDomain,
} from '../src/services/source-registry.mjs';

// Edge / fuzzing du Source Registry. Objectif : verrouiller le comportement
// GRACIEUX réel sur entrées dégénérées (null/undefined/''/casse/non-string),
// et capturer les crashs réels (bug 500-class) en figeant le comportement
// actuel avec assert.throws + un commentaire « bug à corriger ».
//
// Toutes les fonctions ciblées sont pures ou s'appuient sur un registre bâti
// localement (loadAllData, pas de réseau).

describe('source-registry — extractPrefix (pur, gardé)', () => {
  it('retourne null sur null/undefined/non-string (pas de throw)', () => {
    assert.equal(extractPrefix(null), null);
    assert.equal(extractPrefix(undefined), null);
    assert.equal(extractPrefix(123), null);
    assert.equal(extractPrefix({}), null);
  });

  it('retourne null sur chaîne vide ou sans préfixe séparé par espace', () => {
    assert.equal(extractPrefix(''), null);
    assert.equal(extractPrefix('   '), null);
    assert.equal(extractPrefix('CO259a'), null); // pas d'espace après le préfixe
  });

  it('extrait le préfixe sur ref bien formée, y.c. accentuée', () => {
    assert.equal(extractPrefix('CO 259a'), 'CO');
    assert.equal(extractPrefix('  LP 67  '), 'LP');
    assert.equal(extractPrefix('LPMéd 40'), 'LPMéd');
  });
});

describe('source-registry — resolveByPrefix (pur, gardé)', () => {
  it('retourne null sur entrées dégénérées (pas de throw)', () => {
    assert.equal(resolveByPrefix(null), null);
    assert.equal(resolveByPrefix(undefined), null);
    assert.equal(resolveByPrefix(''), null);
    assert.equal(resolveByPrefix(123), null);
    assert.equal(resolveByPrefix({}), null);
  });

  it('retourne null sur préfixe inconnu', () => {
    assert.equal(resolveByPrefix('ZZZ 999'), null);
    assert.equal(resolveByPrefix('Foobar 12'), null);
  });

  it('résout une ref connue (exact match)', () => {
    const r = resolveByPrefix('CO 259a');
    assert.ok(r);
    assert.equal(r.tier, 1);
    assert.equal(r.resolvedBy, 'prefix_fallback');
    assert.equal(r.source_id, 'fedlex:rs220:co-259a');
  });

  it('tolère une casse de table différente via le fallback case-insensitive', () => {
    // La table a "Cst" ; "CST" (tout majuscules) passe par ciLookup.
    const upper = resolveByPrefix('CST 5');
    assert.ok(upper);
    assert.equal(upper.tier, 1);
    assert.equal(upper.source_id, 'fedlex:rs101:cst-5');
  });

  it('exige une majuscule en tête (préfixe tout-minuscule = non résolu)', () => {
    // extractPrefix requiert [A-Z] en première position → "co 259a" → null.
    assert.equal(extractPrefix('co 259a'), null);
    assert.equal(resolveByPrefix('co 259a'), null);
  });
});

describe('source-registry — RS_BY_PREFIX (table gelée)', () => {
  it('est gelée et contient les codes de base attendus', () => {
    assert.equal(Object.isFrozen(RS_BY_PREFIX), true);
    assert.equal(RS_BY_PREFIX.CO.rs, '220');
    assert.equal(RS_BY_PREFIX.CC.rs, '210');
  });
});

describe('source-registry — lookups registre (gracieux)', () => {
  it('getSourceById retourne null sur id inconnu / null', () => {
    assert.equal(getSourceById('introuvable:xxx'), null);
    assert.equal(getSourceById(null), null);
    assert.equal(getSourceById(undefined), null);
  });

  it('getSourceByRef retombe sur le fallback préfixe ou null', () => {
    // ref non indexée mais à préfixe connu → résolution dynamique
    const r = getSourceByRef('CO 9999z');
    assert.ok(r === null || typeof r === 'object');
    // entrées dégénérées : pas de throw, retour défini
    assert.equal(getSourceByRef(null), null);
    assert.equal(getSourceByRef(123), null);
    assert.equal(getSourceByRef(''), null);
  });

  it('getSourceBySignature retourne null sur signature inconnue / null', () => {
    assert.equal(getSourceBySignature('XX_0/0000'), null);
    assert.equal(getSourceBySignature(null), null);
  });

  it('aliases getSourcesForArticleRef / getSourcesForArretSignature ne throw pas', () => {
    assert.doesNotThrow(() => getSourcesForArticleRef(null));
    assert.doesNotThrow(() => getSourcesForArretSignature(null));
  });
});

describe('source-registry — resolveSources / validateClaimSources', () => {
  it('resolveSources([]) retourne resolved/missing vides', () => {
    assert.deepEqual(resolveSources([]), { resolved: [], missing: [] });
  });

  it('resolveSources met les ids inconnus dans missing (y.c. null/undefined)', () => {
    const r = resolveSources(['nope:1', null, undefined]);
    assert.equal(r.resolved.length, 0);
    assert.deepEqual(r.missing, ['nope:1', null, undefined]);
  });

  it('validateClaimSources([]) est valide et sans source contraignante', () => {
    const r = validateClaimSources([]);
    assert.equal(r.valid, true);
    assert.equal(r.hasBindingSource, false);
    assert.deepEqual(r.issues, []);
  });

  it('validateClaimSources signale source_not_found + no_binding_source', () => {
    const r = validateClaimSources(['junk:1']);
    assert.equal(r.valid, false);
    assert.equal(r.hasBindingSource, false);
    assert.ok(r.issues.some(i => i.issue === 'source_not_found'));
    assert.ok(r.issues.some(i => i.issue === 'no_binding_source'));
  });
});

describe('source-registry — getSourcesByTier / getSourcesByDomain', () => {
  it('getSourcesByTier retourne [] sur tier invalide (pas de throw)', () => {
    assert.deepEqual(getSourcesByTier(99), []);
    assert.deepEqual(getSourcesByTier(null), []);
    assert.deepEqual(getSourcesByTier('1'), []); // type mismatch (=== strict)
  });

  it('getSourcesByDomain retourne [] sur domaine inconnu / dégénéré', () => {
    assert.deepEqual(getSourcesByDomain('domaine-inexistant'), []);
    assert.deepEqual(getSourcesByDomain(null), []);
    assert.deepEqual(getSourcesByDomain(''), []);
  });
});

// ─── Crashs réels capturés (bugs 500-class à corriger) ──────────────────
// Ces appels throw aujourd'hui. On NE corrige PAS le code (hors scope) ; on
// fige le comportement actuel pour qu'un futur fix fasse échouer le test.

describe('source-registry — crashs réels figés (À CORRIGER)', () => {
  it('articleSourceId crash sur ref null/undefined/non-string', () => {
    // bug à corriger : src/services/source-registry.mjs:32
    //   `ref.toLowerCase()` sans garde → TypeError sur null/undefined/number.
    assert.throws(() => articleSourceId(null, 'RS 220'), TypeError);
    assert.throws(() => articleSourceId(undefined), TypeError);
    assert.throws(() => articleSourceId(123, '220'), TypeError);
    // ref='' "fonctionne" (ne throw pas) mais produit un id dégénéré "fedlex::"
    assert.equal(articleSourceId('', ''), 'fedlex::');
  });

  it('arretSourceId crash sur signature null/undefined/non-string', () => {
    // bug à corriger : src/services/source-registry.mjs:39
    //   `signature.toLowerCase()` sans garde → TypeError.
    assert.throws(() => arretSourceId(null, 'TF'), TypeError);
    assert.throws(() => arretSourceId(undefined), TypeError);
    assert.throws(() => arretSourceId(42), TypeError);
  });

  it('resolveSources / validateClaimSources crash sur argument null (non itérable)', () => {
    // bug à corriger : source-registry.mjs:439 et :456
    //   `for (const id of sourceIds)` sans garde → TypeError si null/undefined.
    assert.throws(() => resolveSources(null), TypeError);
    assert.throws(() => validateClaimSources(null), TypeError);
  });
});
