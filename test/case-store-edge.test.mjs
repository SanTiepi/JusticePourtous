import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  createCase,
  getCase,
  touchCase,
  updateCaseState,
  recordRound,
  recordPivot,
  advancePaymentGate,
  canProceed,
  exportCase,
  _flushCases,
  _resetStoreForTests,
  GATE_STATES
} from '../src/services/case-store.mjs';

// Store dédié pour ne pas polluer (ni dépendre de) les autres suites.
const TEST_STORE_PATH = join(tmpdir(), 'justicepourtous-case-store-edge.json');

before(() => { _resetStoreForTests({ path: TEST_STORE_PATH }); });
after(() => {
  _flushCases();
  try { if (existsSync(TEST_STORE_PATH)) rmSync(TEST_STORE_PATH); } catch { /* noop */ }
});

// ─── getCase — entrées dégénérées ───────────────────────────────────
describe('getCase — entrées dégénérées', () => {
  it('null / undefined / "" → null sans throw', () => {
    assert.equal(getCase(null), null);
    assert.equal(getCase(undefined), null);
    assert.equal(getCase(''), null);
  });

  it('id inconnu → null', () => {
    assert.equal(getCase('inconnu'), null);
  });

  it('types non-string (number/object/array/bool) → null sans throw', () => {
    assert.equal(getCase(0), null);          // falsy → guard
    assert.equal(getCase(42), null);         // truthy mais absent de la Map
    assert.equal(getCase({}), null);
    assert.equal(getCase([]), null);
    assert.equal(getCase(true), null);
    assert.equal(getCase(false), null);      // falsy → guard
    assert.equal(getCase(NaN), null);        // falsy → guard
  });
});

// ─── updateCaseState — entrées dégénérées ───────────────────────────
describe('updateCaseState — entrées dégénérées', () => {
  it('id inconnu → null (pas de throw)', () => {
    assert.equal(updateCaseState('inconnu', { canton: 'VD' }), null);
    assert.equal(updateCaseState(null, { canton: 'VD' }), null);
  });

  it('patch null sur case réel → no-op gracieux (spread de null)', () => {
    const { case_id } = createCase({ texte: 'test', canton: 'VD' });
    const before = getCase(case_id).state.canton;
    const state = updateCaseState(case_id, null); // {...state, ...null} valide en JS
    assert.ok(state && typeof state === 'object');
    assert.equal(state.canton, before); // inchangé
  });

  it('patch absent sur case réel → no-op (default {})', () => {
    const { case_id } = createCase({ texte: 'x' });
    const state = updateCaseState(case_id);
    assert.ok(state && typeof state === 'object');
  });
});

// ─── recordRound — entrées dégénérées ───────────────────────────────
describe('recordRound — entrées dégénérées', () => {
  it('id inconnu → null', () => {
    assert.equal(recordRound('inconnu', { questions: [], answers: {} }), null);
    assert.equal(recordRound(null), null);
  });

  it('arg de round absent sur case réel → defaults appliqués', () => {
    const { case_id } = createCase({ texte: 'x' });
    const r = recordRound(case_id); // { questions=[], answers={} } par défaut
    assert.deepEqual(r, { rounds_done: 1 });
  });
});

// ─── createCase — sans arg / vide / partiel ─────────────────────────
describe('createCase — init dégénéré', () => {
  it('sans argument → record valide avec defaults', () => {
    const r = createCase();
    assert.ok(r.case_id && typeof r.case_id === 'string');
    assert.ok(r.expires_at > Date.now());
    assert.equal(r.payment_gate.status, GATE_STATES.BOOTSTRAP);
    const c = getCase(r.case_id);
    assert.equal(c.state.texte_initial, '');
    assert.equal(c.state.canton, null);
    assert.deepEqual(c.state.enriched_all, []);
  });

  it('init vide {} → mêmes defaults', () => {
    const r = createCase({});
    const c = getCase(r.case_id);
    assert.equal(c.state.texte_initial, '');
    assert.equal(c.state.canton, null);
  });

  it('init partiel (texte seul) → canton/navigation null', () => {
    const r = createCase({ texte: 'loyer abusif' });
    const c = getCase(r.case_id);
    assert.equal(c.state.texte_initial, 'loyer abusif');
    assert.equal(c.state.canton, null);
    assert.equal(c.state.navigation, null);
  });
});

// ─── advancePaymentGate — entrées dégénérées ────────────────────────
describe('advancePaymentGate — entrées dégénérées', () => {
  it('id inconnu → { error: case_not_found }', () => {
    assert.deepEqual(advancePaymentGate('inconnu', 'mark_paid'), { error: 'case_not_found' });
    assert.deepEqual(advancePaymentGate(null, 'lock'), { error: 'case_not_found' });
  });

  it('action inconnue sur case réel → { error: unknown_action }', () => {
    const { case_id } = createCase({ texte: 'x' });
    const r = advancePaymentGate(case_id, 'action_bidon');
    assert.equal(r.error, 'unknown_action');
    assert.equal(r.action, 'action_bidon');
  });

  it('action undefined sur case réel → unknown_action (default switch)', () => {
    const { case_id } = createCase({ texte: 'x' });
    const r = advancePaymentGate(case_id);
    assert.equal(r.error, 'unknown_action');
  });

  it('mark_paid sans payload → defaults (amount 0, wallet null)', () => {
    const { case_id } = createCase({ texte: 'x' });
    const r = advancePaymentGate(case_id, 'mark_paid');
    assert.equal(r.payment_gate.status, GATE_STATES.PAID);
    assert.equal(r.payment_gate.amount_paid_centimes, 0);
    assert.equal(r.payment_gate.wallet_session, null);
  });
});

// ─── Fonctions sœurs touchées par case_id externe ───────────────────
describe('fonctions sœurs — id inconnu reste gracieux', () => {
  it('touchCase / recordPivot / canProceed / exportCase sur id inconnu', () => {
    assert.equal(touchCase('inconnu'), null);
    assert.deepEqual(recordPivot('inconnu'), { forced_new: false, pivots_count: 0, error: 'case_not_found' });
    assert.deepEqual(canProceed('inconnu'), { ok: false, reason: 'case_not_found_or_expired' });
    assert.equal(exportCase('inconnu'), null);
  });

  it('touchCase(null) / exportCase(null) → null', () => {
    assert.equal(touchCase(null), null);
    assert.equal(exportCase(null), null);
  });
});
