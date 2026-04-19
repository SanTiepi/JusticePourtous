import { describe, it, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, rmSync } from 'node:fs';
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
  cleanupExpired,
  _flushCases,
  _resetStoreForTests,
  _listActiveCases,
  CASE_TTL_MS,
  MAX_PIVOTS,
  GATE_STATES
} from '../src/services/case-store.mjs';

const TEST_STORE_PATH = join(tmpdir(), 'justicepourtous-case-store-test.json');

function reset() {
  _resetStoreForTests({ path: TEST_STORE_PATH });
}

before(() => { reset(); });
after(() => {
  _flushCases();
  try { if (existsSync(TEST_STORE_PATH)) rmSync(TEST_STORE_PATH); } catch { /* noop */ }
});

describe('case-store — création et lookup', () => {
  beforeEach(() => { reset(); });

  it('createCase retourne case_id hex 32 + expires_at futur + gate bootstrap', () => {
    const c = createCase({ texte: 'mon bail a une moisissure', canton: 'VD' });
    assert.ok(c.case_id);
    assert.match(c.case_id, /^[0-9a-f]{32}$/);
    assert.ok(c.expires_at > Date.now());
    assert.ok(c.expires_at <= Date.now() + CASE_TTL_MS + 1000);
    assert.equal(c.payment_gate.status, GATE_STATES.BOOTSTRAP);
    assert.equal(c.payment_gate.trial_round_done, false);
  });

  it('getCase retourne null pour id inconnu', () => {
    assert.equal(getCase('deadbeef'.repeat(4)), null);
  });

  it('getCase retourne null et purge si expiré', () => {
    const { case_id } = createCase({ texte: 'test' });
    const live = getCase(case_id);
    assert.ok(live);
    live.expires_at = Date.now() - 1;
    assert.equal(getCase(case_id), null);
    assert.ok(!_listActiveCases().includes(case_id));
  });

  it('case conserve texte initial, canton, nav, enriched', () => {
    const navStub = { resume_situation: 'moisissure', fiches_pertinentes: ['bail-moisissure'] };
    const { case_id } = createCase({
      texte: 'mur noir',
      canton: 'GE',
      navigation: navStub,
      enrichedPrimary: { fiche: { id: 'bail-moisissure' } },
      enrichedAll: [{ fiche: { id: 'bail-moisissure' } }]
    });
    const c = getCase(case_id);
    assert.equal(c.state.texte_initial, 'mur noir');
    assert.equal(c.state.canton, 'GE');
    assert.equal(c.state.navigation.resume_situation, 'moisissure');
    assert.equal(c.state.enriched_primary.fiche.id, 'bail-moisissure');
  });
});

describe('case-store — activité glissante (72h)', () => {
  beforeEach(() => { reset(); });

  it('touchCase repousse expires_at', async () => {
    const { case_id, expires_at: initial } = createCase({ texte: 't' });
    const live = getCase(case_id);
    live.expires_at = Date.now() + 1000; // artificiellement réduit
    const r = touchCase(case_id);
    assert.ok(r.expires_at >= initial - 100);
    assert.ok(r.expires_at > Date.now() + CASE_TTL_MS - 1000);
  });

  it('updateCaseState fusionne et bump activité', () => {
    const { case_id } = createCase({ texte: 't' });
    const state = updateCaseState(case_id, { canton: 'VS', assumptions: ['date_floue'] });
    assert.equal(state.canton, 'VS');
    assert.deepEqual(state.assumptions, ['date_floue']);
    assert.equal(state.texte_initial, 't'); // not wiped
  });

  it('touchCase sur case expiré renvoie null', () => {
    const { case_id } = createCase({ texte: 't' });
    const live = getCase(case_id);
    live.expires_at = Date.now() - 1;
    assert.equal(touchCase(case_id), null);
  });
});

describe('case-store — rounds', () => {
  beforeEach(() => { reset(); });

  it('recordRound incrémente rounds_done et append audit', () => {
    const { case_id } = createCase({ texte: 't' });
    const r1 = recordRound(case_id, { questions: [{ id: 'q1', question: 'quel canton ?' }], answers: { q1: 'VD' } });
    assert.equal(r1.rounds_done, 1);
    const r2 = recordRound(case_id, { questions: [{ id: 'q2', question: 'date ?' }], answers: { q2: '2024-01' } });
    assert.equal(r2.rounds_done, 2);
    const c = getCase(case_id);
    assert.equal(c.audit.rounds.length, 2);
    assert.equal(c.audit.rounds[0].questions[0].id, 'q1');
    assert.equal(c.audit.rounds[1].answers.q2, '2024-01');
  });
});

describe('case-store — pivots et anti-abuse', () => {
  beforeEach(() => { reset(); });

  it('pivots s\'incrémentent sans forcer jusqu\'à MAX_PIVOTS', () => {
    const { case_id } = createCase({ texte: 't' });
    for (let i = 1; i <= MAX_PIVOTS; i++) {
      const r = recordPivot(case_id, { from_summary: 'bail', to_summary: 'travail' });
      assert.equal(r.forced_new, false);
      assert.equal(r.pivots_count, i);
    }
    const c = getCase(case_id);
    assert.notEqual(c.payment_gate.status, GATE_STATES.LOCKED);
  });

  it('MAX_PIVOTS + 1 force un new case et lock l\'ancien', () => {
    const { case_id } = createCase({ texte: 't' });
    for (let i = 1; i <= MAX_PIVOTS; i++) recordPivot(case_id, {});
    const overflow = recordPivot(case_id, { from_summary: 'x', to_summary: 'y' });
    assert.equal(overflow.forced_new, true);
    assert.equal(overflow.reason, 'max_pivots_exceeded');
    const c = getCase(case_id);
    assert.equal(c.payment_gate.status, GATE_STATES.LOCKED);
    assert.ok(c.audit.locks.some(l => l.reason === 'max_pivots_exceeded'));
  });

  it('pivot dans limite ne change pas payment_gate (pas de double-facturation)', () => {
    const { case_id } = createCase({ texte: 't' });
    advancePaymentGate(case_id, 'mark_paid', { wallet_session: 'w1', amount_centimes: 200 });
    recordPivot(case_id, {});
    recordPivot(case_id, {});
    const c = getCase(case_id);
    assert.equal(c.payment_gate.status, GATE_STATES.PAID);
    assert.equal(c.payment_gate.wallet_session, 'w1');
    assert.equal(c.payment_gate.amount_paid_centimes, 200);
  });
});

describe('case-store — payment_gate transitions', () => {
  beforeEach(() => { reset(); });

  it('complete_bootstrap_round : BOOTSTRAP → CONTINUATION_REQUIRED', () => {
    const { case_id } = createCase({ texte: 't' });
    const r = advancePaymentGate(case_id, 'complete_bootstrap_round');
    assert.equal(r.payment_gate.status, GATE_STATES.CONTINUATION_REQUIRED);
    assert.equal(r.payment_gate.trial_round_done, true);
  });

  it('complete_bootstrap_round : PAID reste PAID', () => {
    const { case_id } = createCase({ texte: 't' });
    advancePaymentGate(case_id, 'mark_paid', { wallet_session: 'w1', amount_centimes: 200 });
    const r = advancePaymentGate(case_id, 'complete_bootstrap_round');
    assert.equal(r.payment_gate.status, GATE_STATES.PAID);
    assert.equal(r.payment_gate.trial_round_done, true);
  });

  it('mark_paid enregistre wallet_session + amount + paid_at', () => {
    const { case_id } = createCase({ texte: 't' });
    const before = Date.now();
    const r = advancePaymentGate(case_id, 'mark_paid', { wallet_session: 'w-xyz', amount_centimes: 200 });
    assert.equal(r.payment_gate.status, GATE_STATES.PAID);
    assert.equal(r.payment_gate.wallet_session, 'w-xyz');
    assert.equal(r.payment_gate.amount_paid_centimes, 200);
    assert.ok(r.payment_gate.paid_at >= before);
  });

  it('mark_paid sur LOCKED retourne erreur case_locked', () => {
    const { case_id } = createCase({ texte: 't' });
    advancePaymentGate(case_id, 'lock', { reason: 'abuse' });
    const r = advancePaymentGate(case_id, 'mark_paid', { wallet_session: 'w1', amount_centimes: 200 });
    assert.equal(r.error, 'case_locked');
  });

  it('lock ajoute audit et set status LOCKED', () => {
    const { case_id } = createCase({ texte: 't' });
    const r = advancePaymentGate(case_id, 'lock', { reason: 'safety_redirect' });
    assert.equal(r.payment_gate.status, GATE_STATES.LOCKED);
    const c = getCase(case_id);
    assert.ok(c.audit.locks.some(l => l.reason === 'safety_redirect'));
  });

  it('action inconnue renvoie erreur', () => {
    const { case_id } = createCase({ texte: 't' });
    const r = advancePaymentGate(case_id, 'fly_to_mars');
    assert.equal(r.error, 'unknown_action');
  });
});

describe('case-store — canProceed (gate enforcement)', () => {
  beforeEach(() => { reset(); });

  it('BOOTSTRAP : bootstrap action ok, refine ok (R1 gratuit)', () => {
    const { case_id } = createCase({ texte: 't' });
    assert.equal(canProceed(case_id, { action: 'bootstrap' }).ok, true);
    assert.equal(canProceed(case_id, { action: 'refine' }).ok, true);
  });

  it('CONTINUATION_REQUIRED : refine bloqué avec payment_required', () => {
    const { case_id } = createCase({ texte: 't' });
    advancePaymentGate(case_id, 'complete_bootstrap_round');
    const r = canProceed(case_id, { action: 'refine' });
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'payment_required');
  });

  it('PAID : refine et deep_analysis ok', () => {
    const { case_id } = createCase({ texte: 't' });
    advancePaymentGate(case_id, 'mark_paid', { wallet_session: 'w1', amount_centimes: 200 });
    assert.equal(canProceed(case_id, { action: 'refine' }).ok, true);
    assert.equal(canProceed(case_id, { action: 'deep_analysis' }).ok, true);
  });

  it('LOCKED : tout bloqué avec case_locked', () => {
    const { case_id } = createCase({ texte: 't' });
    advancePaymentGate(case_id, 'lock', { reason: 'abuse' });
    const r = canProceed(case_id, { action: 'refine' });
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'case_locked');
  });

  it('case inconnu ou expiré : case_not_found_or_expired', () => {
    const r = canProceed('deadbeef'.repeat(4), { action: 'refine' });
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'case_not_found_or_expired');
  });
});

describe('case-store — R1 gratuit puis paywall (règle freeze #48)', () => {
  beforeEach(() => { reset(); });

  it('scénario complet : bootstrap → R1 → paywall → paiement → refine autorisé', () => {
    // Création : R1 gratuit autorisé
    const { case_id } = createCase({ texte: 'moisissure' });
    assert.equal(canProceed(case_id, { action: 'bootstrap' }).ok, true);

    // R1 exécuté
    recordRound(case_id, { questions: [{ id: 'q1', question: 'canton ?' }], answers: { q1: 'VD' } });
    const g1 = advancePaymentGate(case_id, 'complete_bootstrap_round');
    assert.equal(g1.payment_gate.status, GATE_STATES.CONTINUATION_REQUIRED);

    // Paywall actif
    const blocked = canProceed(case_id, { action: 'refine' });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.reason, 'payment_required');

    // Paiement
    advancePaymentGate(case_id, 'mark_paid', { wallet_session: 'w-citoyen', amount_centimes: 200 });

    // Refine maintenant autorisé
    assert.equal(canProceed(case_id, { action: 'refine' }).ok, true);
    assert.equal(canProceed(case_id, { action: 'deep_analysis' }).ok, true);
  });

  it('payment_gate survit au pivot (pas de double-facturation sur reset cas)', () => {
    const { case_id } = createCase({ texte: 't' });
    advancePaymentGate(case_id, 'mark_paid', { wallet_session: 'w1', amount_centimes: 200 });

    recordPivot(case_id, { from_summary: 'bail', to_summary: 'bail+travail' });
    recordPivot(case_id, { from_summary: 'bail+travail', to_summary: 'travail' });

    assert.equal(canProceed(case_id, { action: 'refine' }).ok, true);
    const c = getCase(case_id);
    assert.equal(c.payment_gate.status, GATE_STATES.PAID);
  });
});

describe('case-store — expiration et cleanup', () => {
  beforeEach(() => { reset(); });

  it('cleanupExpired supprime les cases passés expires_at', () => {
    const a = createCase({ texte: 'a' });
    const b = createCase({ texte: 'b' });
    getCase(a.case_id).expires_at = Date.now() - 1;
    const removed = cleanupExpired();
    assert.equal(removed, 1);
    assert.equal(getCase(a.case_id), null);
    assert.ok(getCase(b.case_id));
  });

  it('listActiveCases ne liste pas les expirés', () => {
    const a = createCase({ texte: 'a' });
    const b = createCase({ texte: 'b' });
    getCase(a.case_id).expires_at = Date.now() - 1;
    const active = _listActiveCases();
    assert.equal(active.includes(a.case_id), false);
    assert.equal(active.includes(b.case_id), true);
  });
});

describe('case-store — exportCase (API shape)', () => {
  beforeEach(() => { reset(); });

  it('exportCase retourne champs publics + ISO timestamp', () => {
    const { case_id } = createCase({ texte: 't', canton: 'VD' });
    updateCaseState(case_id, { assumptions: ['date_floue'], redacted_dimensions: ['montant'] });
    const out = exportCase(case_id);
    assert.equal(out.case_id, case_id);
    assert.equal(out.canton, 'VD');
    assert.equal(out.rounds_done, 0);
    assert.equal(out.pivots_count, 0);
    assert.deepEqual(out.assumptions, ['date_floue']);
    assert.deepEqual(out.redacted_dimensions, ['montant']);
    assert.ok(out.payment_gate);
    assert.ok(out.resume_expires_at_iso.match(/^\d{4}-\d{2}-\d{2}T/));
  });

  it('exportCase retourne null pour inconnu/expiré', () => {
    assert.equal(exportCase('00'.repeat(16)), null);
  });
});

describe('case-store — persistance disque', () => {
  beforeEach(() => { reset(); });

  it('_flushCases écrit sur disque et le JSON est relisable', () => {
    const { case_id } = createCase({ texte: 'bail moisissure', canton: 'VD' });
    _flushCases();
    assert.ok(existsSync(TEST_STORE_PATH));
    const raw = readFileSync(TEST_STORE_PATH, 'utf-8');
    const entries = JSON.parse(raw);
    assert.ok(Array.isArray(entries));
    const found = entries.find(([id]) => id === case_id);
    assert.ok(found, 'case doit être persisté');
    assert.equal(found[1].state.texte_initial, 'bail moisissure');
    assert.equal(found[1].state.canton, 'VD');
    assert.equal(found[1].payment_gate.status, GATE_STATES.BOOTSTRAP);
  });
});
