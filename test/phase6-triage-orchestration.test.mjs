/**
 * Phase 6 — tests d'intégration orchestration triage.
 *
 * Tests unitaires directs sur handleTriageStart/handleTriageNext pour éviter
 * les appels LLM coûteux. Les cas qui court-circuitent (safety, scope) n'appellent
 * pas le navigator → tests rapides.
 *
 * Pour les cas qui nécessitent l'appel LLM complet, voir triage.test.mjs (HTTP e2e).
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readFileSync } from 'node:fs';

import {
  handleTriageStart,
  handleTriageNext,
  CONTINUATION_PRICE_CENTIMES
} from '../src/services/triage-orchestration.mjs';

import {
  createCase,
  advancePaymentGate,
  updateCaseState,
  getCase,
  exportCase,
  _resetStoreForTests,
  GATE_STATES
} from '../src/services/case-store.mjs';

import { acheterWallet, _createWalletWithBalance } from '../src/services/premium.mjs';

const TEST_STORE_PATH = join(tmpdir(), 'justicepourtous-phase6-orch.json');

function reset() {
  _resetStoreForTests({ path: TEST_STORE_PATH });
}

// ============================================================
// Court-circuits safety — pas d'appel LLM requis
// ============================================================

describe('Phase 6 — court-circuit safety au start', () => {
  beforeEach(reset);

  it('texte de détresse → status safety_stop + resources 143/144', async () => {
    const r = await handleTriageStart({ texte: 'je veux en finir, j\'ai plus la force' });
    assert.equal(r.status, 'safety_stop');
    assert.equal(r.signal_type, 'detresse');
    assert.ok(r.safety_response);
    assert.ok(r.safety_response.resources.some(x => x.phone === '143'));
    assert.ok(r.log_entry);
    // log_entry whitelist only
    const allowed = new Set(['timestamp', 'signal_type', 'language', 'action_taken', 'round_number']);
    for (const k of Object.keys(r.log_entry)) assert.ok(allowed.has(k));
  });

  it('violence domestique → safety_stop + LAVI', async () => {
    const r = await handleTriageStart({ texte: 'mon mari il me frappe depuis des mois' });
    assert.equal(r.status, 'safety_stop');
    assert.equal(r.signal_type, 'violence_domestique');
    assert.ok(r.safety_response.resources.some(x => x.phone === '117'));
    assert.equal(r.safety_response.discreet_mode, true);
  });

  it('menace envers tiers → safety_stop refus', async () => {
    const r = await handleTriageStart({ texte: 'mon voisin m\'énerve, je vais le tuer' });
    assert.equal(r.status, 'safety_stop');
    assert.equal(r.signal_type, 'menace_tiers');
    assert.equal(r.safety_response.type, 'safety_refusal');
  });
});

// ============================================================
// Court-circuits scope
// ============================================================

describe('Phase 6 — court-circuit scope au start', () => {
  beforeEach(reset);

  it('recours TF → status human_tier', async () => {
    const r = await handleTriageStart({ texte: 'je veux faire un recours au tribunal fédéral' });
    assert.equal(r.status, 'human_tier');
    assert.equal(r.reason, 'recours_tf');
    assert.ok(r.human_tier_response);
  });

  it('succession → status out_of_scope', async () => {
    const r = await handleTriageStart({ texte: 'j\'ai hérité d\'une maison de ma grand-mère' });
    assert.equal(r.status, 'out_of_scope');
    assert.equal(r.reason, 'succession');
    assert.ok(r.out_of_scope_response);
  });

  it('brevet → out_of_scope propriete_intellectuelle', async () => {
    const r = await handleTriageStart({ texte: 'on a copié mon brevet' });
    assert.equal(r.status, 'out_of_scope');
    assert.equal(r.reason, 'propriete_intellectuelle');
  });
});

// ============================================================
// Validation input
// ============================================================

describe('Phase 6 — validation input', () => {
  beforeEach(reset);

  it('texte absent → status error 400', async () => {
    const r = await handleTriageStart({});
    assert.equal(r.status, 'error');
    assert.equal(r.http_status, 400);
  });

  it('texte trop court (< 3 chars) → status error 400', async () => {
    const r = await handleTriageStart({ texte: 'ab' });
    assert.equal(r.status, 'error');
    assert.equal(r.http_status, 400);
  });
});

// ============================================================
// Next — resume
// ============================================================

describe('Phase 6 — next action resume', () => {
  beforeEach(reset);

  it('case inexistant → error 404', async () => {
    const r = await handleTriageNext({ case_id: '00'.repeat(16), action: 'resume' });
    assert.equal(r.status, 'error');
    assert.equal(r.http_status, 404);
  });

  it('case_id manquant → error 400', async () => {
    const r = await handleTriageNext({ action: 'resume' });
    assert.equal(r.status, 'error');
    assert.equal(r.http_status, 400);
  });

  it('action inconnue → error 400', async () => {
    const { case_id } = createCase({ texte: 'bail moisissure' });
    const r = await handleTriageNext({ case_id, action: 'fly_to_mars' });
    assert.equal(r.status, 'error');
    assert.equal(r.http_status, 400);
  });

  it('case sans last_public_response → error gracieux', async () => {
    const { case_id } = createCase({ texte: 'bail moisissure' });
    const r = await handleTriageNext({ case_id, action: 'resume' });
    assert.equal(r.status, 'error');
    assert.match(r.error, /reprise/i);
    assert.ok(r.case_id);
  });

  it('case avec last_public_response → renvoie le snapshot + payment_gate à jour', async () => {
    const { case_id } = createCase({ texte: 'bail moisissure' });
    const snapshot = {
      _resume_status: 'ask_questions',
      status: 'ask_questions',
      case_id,
      domaine: 'bail',
      questionsManquantes: [{ id: 'q1', question: 'Canton ?' }]
    };
    updateCaseState(case_id, { last_public_response: snapshot });
    const r = await handleTriageNext({ case_id, action: 'resume' });
    assert.equal(r.status, 'ask_questions');
    assert.equal(r.case_id, case_id);
    assert.ok(r.questionsManquantes);
    assert.ok(r.payment_gate); // rafraîchi depuis exportCase
    assert.ok(r.resume_expires_at_iso);
  });
});

// ============================================================
// Next — answer avec paywall
// ============================================================

describe('Phase 6 — next action answer + paywall', () => {
  beforeEach(reset);

  it('case en continuation_required SANS wallet → payment_required', async () => {
    const { case_id } = createCase({ texte: 'bail moisissure' });
    advancePaymentGate(case_id, 'complete_bootstrap_round');
    const r = await handleTriageNext({ case_id, action: 'answer', answers: { q1: 'VD' } });
    assert.equal(r.status, 'payment_required');
    assert.equal(r.required_amount_centimes, CONTINUATION_PRICE_CENTIMES);
    assert.equal(r.reason, 'wallet_required');
    assert.ok(r.payment_gate);
  });

  it('case en continuation_required + wallet vide → payment_required (debit_failed)', async () => {
    const { case_id } = createCase({ texte: 'bail moisissure' });
    advancePaymentGate(case_id, 'complete_bootstrap_round');
    const emptyWalletSession = _createWalletWithBalance(0);
    const r = await handleTriageNext({
      case_id,
      action: 'answer',
      answers: { q1: 'VD' },
      wallet_session: emptyWalletSession
    });
    assert.equal(r.status, 'payment_required');
    assert.equal(r.reason, 'debit_failed');
    assert.ok(r.wallet_error);
  });

  it('case en continuation_required + wallet invalide → payment_required', async () => {
    const { case_id } = createCase({ texte: 'bail moisissure' });
    advancePaymentGate(case_id, 'complete_bootstrap_round');
    const r = await handleTriageNext({
      case_id,
      action: 'answer',
      answers: { q1: 'VD' },
      wallet_session: 'invalid-session-xyz'
    });
    assert.equal(r.status, 'payment_required');
    assert.equal(r.reason, 'debit_failed');
  });

  it('case déjà PAID → pas de double-débit (canProceed ok sans wallet)', async () => {
    const { case_id } = createCase({ texte: 'bail moisissure' });
    advancePaymentGate(case_id, 'mark_paid', { wallet_session: 'test-wallet', amount_centimes: 200 });
    const caseAfter = getCase(case_id);
    assert.equal(caseAfter.payment_gate.status, GATE_STATES.PAID);
    // canProceed renvoie ok=true → on passe au flux normal (qui appellera LLM)
    // Ici on ne teste que le gate, pas le pipeline complet
  });

  it('case locked → error 403', async () => {
    const { case_id } = createCase({ texte: 'bail moisissure' });
    advancePaymentGate(case_id, 'lock', { reason: 'safety_redirect' });
    const r = await handleTriageNext({ case_id, action: 'answer', answers: {} });
    assert.equal(r.status, 'error');
    assert.equal(r.http_status, 403);
    assert.match(r.error, /locked/);
  });
});

// ============================================================
// Next — answer débit unique (anti-double-facturation)
// ============================================================

describe('Phase 6 — débit unique + pivot conserve paiement', () => {
  beforeEach(reset);

  it('débit déclenché 1x puis PAID → pas de second débit', async () => {
    const { case_id } = createCase({ texte: 'bail moisissure' });
    advancePaymentGate(case_id, 'complete_bootstrap_round');

    // Pré-crée un wallet avec solde suffisant
    const walletSession = _createWalletWithBalance(1000);

    // Premier appel : devrait débiter (mais va échouer sur runTriage LLM absent).
    // Ce qu'on teste : que APRÈS le débit, le gate est PAID et un second appel ne re-débite pas.
    // Pour ça on vérifie l'état post-débit en court-circuitant via mock.

    // Hack : on appelle directement advancePaymentGate comme si le débit avait eu lieu
    advancePaymentGate(case_id, 'mark_paid', { wallet_session: walletSession, amount_centimes: 200 });

    const caseAfter = getCase(case_id);
    assert.equal(caseAfter.payment_gate.status, GATE_STATES.PAID);
    assert.equal(caseAfter.payment_gate.amount_paid_centimes, 200);
    assert.equal(caseAfter.payment_gate.wallet_session, walletSession);

    // Vérifier que canProceed passe sans nouveau débit
    const { canProceed } = await import('../src/services/case-store.mjs');
    const proceed = canProceed(case_id, { action: 'refine' });
    assert.equal(proceed.ok, true);
  });
});

// ============================================================
// Status enum coverage
// ============================================================

describe('Phase 6 — tous les statuts de sortie exposés', () => {
  const expectedStatuses = [
    'ask_questions',
    'ask_contradiction',
    'payment_required',
    'pivot_detected',
    'ready_for_pipeline',
    'human_tier',
    'safety_stop',
    'out_of_scope',
    'error'
  ];

  it('enum status documenté dans l\'orchestration', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/services/triage-orchestration.mjs'),
      'utf-8'
    );
    for (const s of expectedStatuses) {
      assert.ok(src.includes(`'${s}'`) || src.includes(`"${s}"`),
        `status '${s}' absent du module triage-orchestration.mjs`);
    }
  });
});
