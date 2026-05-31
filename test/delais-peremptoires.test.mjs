/**
 * Régression — délais péremptoires (audit 2026-05-31, gap 2).
 *
 * topDelaisCritiques doit enrichir les délais surfacés avec la CONSÉQUENCE (curatée,
 * delais-procedures.json) là où la cascade laissait consequence=null, et flaguer
 * péremptoire sur les signaux forts de perte de droit. Données vérifiées, pas de LLM.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topDelaisCritiques, isPeremptoire } from '../src/services/triage-engine.mjs';
import { queryComplete } from '../src/services/knowledge-engine.mjs';

test('isPeremptoire : flague la forfaiture, PAS la prescription', () => {
  // Péremption / forfaiture → true
  assert.equal(isPeremptoire('Perte du droit à l\'indemnité pour licenciement abusif'), true);
  assert.equal(isPeremptoire('Sans opposition : l\'action en indemnité est irrecevable'), true);
  assert.equal(isPeremptoire('Le congé devient définitif et non contestable'), true);
  assert.equal(isPeremptoire('Délai péremptoire — aucun prolongement possible'), true);
  // Prescription (interruptible, ≠ péremption) → false (ne pas sur-étiqueter)
  assert.equal(isPeremptoire('Les créances prescrites ne peuvent plus être recouvrées'), false);
  assert.equal(isPeremptoire('Prescription de la créance'), false);
  // Neutre → false
  assert.equal(isPeremptoire('Vérification formelle du document'), false);
  assert.equal(isPeremptoire(null, undefined), false);
});

test('le délai de forfaiture 180j (licenciement abusif CO 336b) est flagué péremptoire', () => {
  const primary = queryComplete('travail_licenciement_abusif').data;
  const ds = topDelaisCritiques(primary);
  const j180 = ds.find(d => /180\s*jours/i.test(d.delai || ''));
  if (j180) assert.equal(j180.peremptoire, true, '180j licenciement abusif devrait être péremptoire');
});

test('opposition au commandement de payer → conséquence remplie + péremptoire', () => {
  const primary = queryComplete('dettes_commandement_payer').data;
  const delais = topDelaisCritiques(primary);
  assert.ok(delais.length > 0, 'aucun délai surfacé');
  // Au moins un délai de 10 jours avec une conséquence non nulle
  const dix = delais.find(d => /10\s*jours/i.test(d.delai || ''));
  assert.ok(dix, 'délai 10 jours absent');
  assert.ok(dix.consequence, 'conséquence toujours nulle (enrichissement raté)');
  assert.equal(dix.peremptoire, true, 'le délai d\'opposition 10j devrait être péremptoire');
});

test('chaque délai surfacé expose le schéma enrichi (procedure/delai/consequence/peremptoire)', () => {
  for (const id of ['dettes_commandement_payer', 'bail_augmentation_loyer']) {
    const primary = queryComplete(id).data;
    if (!primary) continue;
    for (const d of topDelaisCritiques(primary)) {
      assert.ok('procedure' in d && 'delai' in d && 'consequence' in d && 'peremptoire' in d,
        `${id}: schéma délai incomplet`);
      assert.equal(typeof d.peremptoire, 'boolean', `${id}: peremptoire non booléen`);
    }
  }
});

test('topDelaisCritiques robuste (null/vide)', () => {
  assert.deepEqual(topDelaisCritiques(null), []);
  assert.deepEqual(topDelaisCritiques({}), []);
});
