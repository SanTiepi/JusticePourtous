/**
 * semantic-search — edge / degenerate input hardening
 *
 * Sonde les entrées limites des trois fonctions pures exportées :
 *   - expandQuery(text)          → { terms: Map, originalWords: string[] }
 *   - scoreFiche(fiche, terms)   → number
 *   - semanticSearch(text, fiches, limit) → [{ fiche, score }]
 *
 * Pas de LLM, pas de réseau : 100% déterministe.
 *
 * Ce test VERROUILLE le comportement actuel (vert). Quand un input crashe
 * réellement, on l'asserte avec `assert.throws` + un commentaire « BUG À
 * CORRIGER » : le jour où la fonction est durcie, l'assertion casse et
 * signale qu'il faut basculer vers un assert de retour gracieux.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  expandQuery,
  scoreFiche,
  semanticSearch,
} from '../src/services/semantic-search.mjs';

// Fiche de référence valide pour les tests de scoring/search.
const FICHE = {
  id: 'bail_resiliation_conteste',
  domaine: 'bail',
  sousDomaine: 'résiliation',
  tags: ['résiliation', 'congé', 'expulsion'],
  reponse: { explication: 'Contester un congé abusif devant le tribunal des baux.' },
};

// --- expandQuery : comportements GRACIEUX réels --------------------------

test('expandQuery("") retourne des structures vides sans throw', () => {
  const { terms, originalWords } = expandQuery('');
  assert.ok(terms instanceof Map);
  assert.equal(terms.size, 0);
  assert.deepEqual(originalWords, []);
});

test('expandQuery(espaces uniquement) retourne vide', () => {
  const { terms, originalWords } = expandQuery('     ');
  assert.equal(terms.size, 0);
  assert.deepEqual(originalWords, []);
});

test('expandQuery(caractères regex spéciaux) ne crashe pas et reste vide', () => {
  // .*+?[]()\ sont nettoyés par le filtre [^\w...] → aucun mot >1 char.
  // Important : ces caractères ne sont JAMAIS injectés dans un new RegExp,
  // donc pas de ReDoS / SyntaxError possible ici.
  const { terms } = expandQuery('.*+?[]()\\{}^$|');
  assert.ok(terms instanceof Map);
  assert.equal(terms.size, 0);
});

test('expandQuery(texte non français / japonais) reste gracieux', () => {
  const { terms } = expandQuery('私の家主が立ち退きを要求しています');
  assert.ok(terms instanceof Map);
  // Caractères hors set autorisé → filtrés → aucun terme.
  assert.equal(terms.size, 0);
});

test('expandQuery(emoji) reste gracieux', () => {
  const { terms } = expandQuery('😀🏠💰');
  assert.ok(terms instanceof Map);
  assert.equal(terms.size, 0);
});

test('expandQuery(10000 caractères répétés) ne crashe pas, dédoublonne via Map', () => {
  // 2000× "virer " ≈ 12000 chars. Le résultat est borné par les synonymes
  // de "virer" (3 termes) — pas d'explosion mémoire ni de blocage CPU.
  const huge = 'virer '.repeat(2000);
  assert.ok(huge.length >= 10000);
  const { terms } = expandQuery(huge);
  assert.ok(terms instanceof Map);
  assert.equal(terms.size, 3); // résiliation, expulsion, congé
});

test('expandQuery(10000 caractères sans espace) reste borné', () => {
  const { terms } = expandQuery('a'.repeat(10000));
  // Un seul "mot" inconnu → passthrough as-is = 1 entrée.
  assert.equal(terms.size, 1);
});

test('expandQuery(requête normale) produit des termes pondérés', () => {
  const { terms } = expandQuery('on veut me virer de mon appartement');
  assert.ok(terms.size > 0);
  assert.ok(terms.has('résiliation'));
  assert.ok(terms.get('résiliation') > 0);
});

// --- expandQuery : CRASHES RÉELS (bugs verrouillés) ----------------------
// Contrat caller : server.mjs passe toujours une string. Mais la fonction
// exportée ne se garde pas. On verrouille le crash ; corriger = remplacer
// par un assert de retour gracieux (Map vide).

test('expandQuery(null) THROW — BUG À CORRIGER (semantic-search.mjs:174 text.toLowerCase sur null)', () => {
  assert.throws(() => expandQuery(null), TypeError);
});

test('expandQuery(undefined) THROW — BUG À CORRIGER (semantic-search.mjs:174 text.toLowerCase sur undefined)', () => {
  assert.throws(() => expandQuery(undefined), TypeError);
});

test('expandQuery(number) THROW — BUG À CORRIGER (semantic-search.mjs:174 toLowerCase n est pas une fonction)', () => {
  assert.throws(() => expandQuery(123), TypeError);
});

// --- scoreFiche ----------------------------------------------------------

test('scoreFiche(fiche valide, Map vide) retourne 0 sans throw', () => {
  const score = scoreFiche(FICHE, new Map());
  assert.equal(score, 0);
});

test('scoreFiche(fiche valide, termes pertinents) retourne un score > 0', () => {
  const { terms } = expandQuery('virer');
  const score = scoreFiche(FICHE, terms);
  assert.ok(typeof score === 'number');
  assert.ok(score > 0);
});

test('scoreFiche(fiche sans tags ni reponse mais avec id) reste gracieux', () => {
  // id présent → pas de crash ligne 258 ; tags?/reponse? optional-chained.
  const { terms } = expandQuery('virer');
  const score = scoreFiche({ id: 'x_y', domaine: 'bail' }, terms);
  assert.ok(typeof score === 'number');
  assert.ok(score >= 0);
});

test('scoreFiche({} sans id) THROW — BUG À CORRIGER (semantic-search.mjs:258 fiche.id.toLowerCase sur undefined)', () => {
  const { terms } = expandQuery('virer');
  assert.throws(() => scoreFiche({}, terms), TypeError);
});

test('scoreFiche(null) THROW — BUG À CORRIGER (semantic-search.mjs:236 lecture .id sur null)', () => {
  const { terms } = expandQuery('virer');
  assert.throws(() => scoreFiche(null, terms), TypeError);
});

// --- semanticSearch : comportements GRACIEUX réels -----------------------

test('semanticSearch("", [fiche]) retourne un tableau vide', () => {
  const res = semanticSearch('', [FICHE]);
  assert.ok(Array.isArray(res));
  assert.equal(res.length, 0);
});

test('semanticSearch(espaces, [fiche]) retourne un tableau vide', () => {
  const res = semanticSearch('   ', [FICHE]);
  assert.ok(Array.isArray(res));
  assert.equal(res.length, 0);
});

test('semanticSearch(requête valide, [fiche]) retourne des résultats notés', () => {
  const res = semanticSearch('virer', [FICHE]);
  assert.ok(Array.isArray(res));
  assert.equal(res.length, 1);
  assert.equal(res[0].fiche.id, FICHE.id);
  assert.ok(res[0].score > 0);
});

test('semanticSearch(requête valide, []) retourne un tableau vide', () => {
  const res = semanticSearch('virer', []);
  assert.ok(Array.isArray(res));
  assert.equal(res.length, 0);
});

test('semanticSearch(caractères regex spéciaux) ne crashe pas, tableau vide', () => {
  const res = semanticSearch('.*+?[]()\\', [FICHE]);
  assert.ok(Array.isArray(res));
  assert.equal(res.length, 0);
});

test('semanticSearch(canton invalide) reste gracieux', () => {
  // Un canton inexistant ne doit jamais faire crasher : on asserte la FORME
  // (array de { fiche, score }), pas un compte précis — un mot passthrough
  // ("canton") peut matcher le texte d'une fiche, ce qui reste valide.
  const res = semanticSearch('mon dossier dans le canton ZZ inexistant', [FICHE]);
  assert.ok(Array.isArray(res));
  for (const r of res) {
    assert.ok('fiche' in r && typeof r.score === 'number');
    assert.ok(r.score > 0);
  }
});

test('semanticSearch(texte non français) reste gracieux', () => {
  const res = semanticSearch('私の家主', [FICHE]);
  assert.ok(Array.isArray(res));
  assert.equal(res.length, 0);
});

test('semanticSearch respecte limit', () => {
  const fiches = Array.from({ length: 10 }, (_, i) => ({
    ...FICHE,
    id: `bail_${i}`,
  }));
  const res = semanticSearch('virer', fiches, 3);
  assert.ok(res.length <= 3);
});

// --- semanticSearch : CRASHES RÉELS (bugs verrouillés) -------------------

test('semanticSearch(null, [fiche]) THROW — BUG À CORRIGER (propagé depuis expandQuery:174)', () => {
  assert.throws(() => semanticSearch(null, [FICHE]), TypeError);
});

test('semanticSearch("virer", null) THROW — BUG À CORRIGER (semantic-search.mjs:322 fiches.map sur null)', () => {
  assert.throws(() => semanticSearch('virer', null), TypeError);
});
