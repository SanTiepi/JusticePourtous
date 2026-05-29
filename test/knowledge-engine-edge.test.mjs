/**
 * knowledge-engine-edge.test.mjs
 *
 * Verrouille la robustesse du knowledge-engine sur des entrées dégénérées
 * (id inexistant, null, undefined, chaîne vide).
 *
 * Toutes les fonctions ici sont pures (pas de LLM, pas de réseau) : le graphe
 * et les données sont figés au boot. On asserte le comportement RÉELLEMENT
 * observé (lecture du code + probe), pas un comportement souhaité.
 *
 * Bug trouvé par ce harness le 2026-05-29 et CORRIGÉ : `queryByDomain`
 * appelait `domain.toLowerCase()` sans garde → TypeError (= 500 HTTP) sur
 * `null` / `undefined`. Garde ajoutée → 404 gracieux comme les autres points
 * d'entrée. Le test ci-dessous verrouille ce comportement gracieux.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  queryComplete,
  queryByProblem,
  queryByArticle,
  queryByDecision,
  queryByDomain,
  queryCompleteWithCanon,
  getTableDesMatieres,
  generateSuggestedQuestions,
} from '../src/services/knowledge-engine.mjs';

// Entrées dégénérées communes (sans null/undefined quand la fonction throw dessus).
const BAD_IDS = ['xxx_nope', null, undefined, ''];

// --- queryComplete : 404 gracieux sur toute entrée invalide ---

test('queryComplete ne throw pas et renvoie 404 sur entrées dégénérées', () => {
  for (const id of BAD_IDS) {
    let res;
    assert.doesNotThrow(() => { res = queryComplete(id); }, `queryComplete(${String(id)})`);
    assert.equal(typeof res, 'object');
    assert.notEqual(res, null);
    assert.equal(res.status, 404, `queryComplete(${String(id)}) doit être 404`);
    assert.equal(typeof res.error, 'string');
  }
});

// --- queryByProblem : 400 gracieux quand le texte est absent/vide ---

test('queryByProblem ne throw pas et renvoie 400 sur texte absent/vide', () => {
  for (const text of [null, undefined, '']) {
    let res;
    assert.doesNotThrow(() => { res = queryByProblem(text); }, `queryByProblem(${String(text)})`);
    assert.equal(res.status, 400, `queryByProblem(${String(text)}) doit être 400`);
    assert.equal(typeof res.error, 'string');
  }
});

test('queryByProblem ne throw pas sur texte non identifiable + canton bidon', () => {
  let res;
  assert.doesNotThrow(() => { res = queryByProblem('xxx_nope_zzz_qqq', 'XX'); });
  assert.equal(res.status, 200);
  assert.equal(typeof res.data, 'object');
  // Forme bien définie : un `type` discriminant est toujours présent.
  assert.equal(typeof res.data.type, 'string');
});

// --- queryByArticle : 400 sur ref absente, 200 "non indexé" sur ref inconnue ---

test('queryByArticle ne throw pas : 400 si vide, 200 structuré si ref inconnue', () => {
  for (const ref of [null, undefined, '']) {
    let res;
    assert.doesNotThrow(() => { res = queryByArticle(ref); }, `queryByArticle(${String(ref)})`);
    assert.equal(res.status, 400, `queryByArticle(${String(ref)}) doit être 400`);
  }

  let res;
  assert.doesNotThrow(() => { res = queryByArticle('xxx_nope'); });
  assert.equal(res.status, 200);
  assert.equal(typeof res.data, 'object');
  assert.equal(res.data.article.status, 'non indexé dans notre base');
  assert.equal(res.data._meta.inDatabase, false);
  assert.deepEqual(res.data.fiches, []);
});

// --- queryByDecision : 400 sur signature absente, 404 sur signature inconnue ---

test('queryByDecision ne throw pas : 400 si vide, 404 si signature inconnue', () => {
  for (const sig of [null, undefined, '']) {
    let res;
    assert.doesNotThrow(() => { res = queryByDecision(sig); }, `queryByDecision(${String(sig)})`);
    assert.equal(res.status, 400, `queryByDecision(${String(sig)}) doit être 400`);
  }

  let res;
  assert.doesNotThrow(() => { res = queryByDecision('xxx_nope'); });
  assert.equal(res.status, 404);
  assert.equal(typeof res.error, 'string');
});

// --- queryByDomain : 404 gracieux sur '' et domaine inconnu ---
//     MAIS throw sur null/undefined (bug documenté, NON corrigé).

test('queryByDomain ne throw pas et renvoie 404 sur chaîne vide / domaine inconnu', () => {
  for (const d of ['', 'xxx_nope']) {
    let res;
    assert.doesNotThrow(() => { res = queryByDomain(d); }, `queryByDomain(${String(d)})`);
    assert.equal(res.status, 404, `queryByDomain(${String(d)}) doit être 404`);
    assert.equal(typeof res.error, 'string');
  }
});

test('queryByDomain gère null/undefined gracieusement (404, pas de throw) — fix 2026-05-29', () => {
  for (const d of [null, undefined]) {
    let res;
    assert.doesNotThrow(() => { res = queryByDomain(d); }, `queryByDomain(${String(d)})`);
    assert.equal(res.status, 404, `queryByDomain(${String(d)}) doit être 404`);
    assert.equal(typeof res.error, 'string');
  }
});

// --- getTableDesMatieres : 404 sur code inconnu, summary global sans arg ---

test('getTableDesMatieres ne throw pas : 404 si code inconnu, 200 summary sans arg', () => {
  let r404;
  assert.doesNotThrow(() => { r404 = getTableDesMatieres('xxx_nope'); });
  assert.equal(r404.status, 404);

  let rAll;
  assert.doesNotThrow(() => { rAll = getTableDesMatieres(undefined); });
  assert.equal(rAll.status, 200);
  assert.equal(typeof rAll.data.codes, 'object');
});

// --- generateSuggestedQuestions : tableau vide gracieux sur fiche inconnue ---

test('generateSuggestedQuestions ne throw pas et renvoie [] sur entrées dégénérées', () => {
  for (const id of BAD_IDS) {
    let res;
    assert.doesNotThrow(() => { res = generateSuggestedQuestions(id, null, null); }, `gsq(${String(id)})`);
    assert.ok(Array.isArray(res), `gsq(${String(id)}) doit renvoyer un tableau`);
    assert.equal(res.length, 0);
  }
});

// --- queryCompleteWithCanon (async) : 404 gracieux sur entrées dégénérées ---

test('queryCompleteWithCanon ne reject pas et renvoie 404 sur entrées dégénérées', async () => {
  for (const id of BAD_IDS) {
    let res;
    await assert.doesNotReject(async () => { res = await queryCompleteWithCanon(id); }, `qcwc(${String(id)})`);
    assert.equal(res.status, 404, `queryCompleteWithCanon(${String(id)}) doit être 404`);
    assert.equal(typeof res.error, 'string');
  }
});
