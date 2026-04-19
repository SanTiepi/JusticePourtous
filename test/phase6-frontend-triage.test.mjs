/**
 * Phase 6 — Tests HTTP couvrant le flux multi-round exposé au front.
 *
 * Vérifie que les statuts attendus côté UI (ask_questions / payment_required /
 * safety_stop / human_tier / out_of_scope / error) sont bien produits par
 * les endpoints /api/triage et /api/triage/next, dans le format consommé
 * par app.js / resultat.html.
 *
 * Pas d'appel LLM coûteux : on s'appuie sur les court-circuits (safety, scope)
 * et sur l'orchestration directe pour préparer un case en continuation_required
 * avant le test paywall.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/server.mjs';
import { createCase, advancePaymentGate, _resetStoreForTests } from '../src/services/case-store.mjs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const PORT = 9881;
const BASE = `http://localhost:${PORT}`;
const STORE_PATH = join(tmpdir(), 'justicepourtous-phase6-front.json');

async function httpPost(path, body) {
  const http = await import('node:http');
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.default.request(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, data: buf }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

describe('Phase 6 frontend triage — endpoints /api/triage(/next)', () => {
  before(() => new Promise(resolve => server.listen(PORT, resolve)));
  after(() => new Promise(resolve => server.close(resolve)));
  beforeEach(() => { _resetStoreForTests({ path: STORE_PATH }); });

  it('POST /api/triage texte normal → status ask_questions ou ready_for_pipeline', async () => {
    const res = await httpPost('/api/triage', { texte: 'mon appart est moisi', canton: 'VD' });
    assert.equal(res.status, 200);
    assert.ok(res.data, 'payload requis');
    assert.ok(['ask_questions', 'ready_for_pipeline'].includes(res.data.status),
      `status inattendu: ${res.data.status}`);
    assert.ok(res.data.case_id, 'case_id requis pour reprise');
    // resume_expires_at_iso utile pour localStorage 72h
    assert.ok(res.data.resume_expires_at_iso || res.data.resume_expires_at_iso === null,
      'resume_expires_at_iso doit être présent');
  });

  it('POST /api/triage/next action=resume sans case → 404 status=error', async () => {
    const res = await httpPost('/api/triage/next', {
      case_id: '00'.repeat(16),
      action: 'resume'
    });
    assert.equal(res.status, 404);
    assert.equal(res.data.status, 'error');
  });

  it('POST /api/triage/next action=answer sur case continuation sans wallet → status payment_required', async () => {
    // Setup : crée un case et le passe en continuation_required (gate post-R1)
    const { case_id } = createCase({ texte: 'bail moisissure' });
    advancePaymentGate(case_id, 'complete_bootstrap_round');

    const res = await httpPost('/api/triage/next', {
      case_id,
      action: 'answer',
      answers: { q1: 'VD' }
      // pas de wallet_session
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'payment_required');
    assert.equal(res.data.required_amount_centimes, 200,
      'le front a besoin de required_amount_centimes pour le paywall');
    assert.equal(res.data.case_id, case_id);
    assert.ok(res.data.payment_gate, 'payment_gate exposé pour rendu UI');
  });

  it('POST /api/triage texte de détresse → status safety_stop avec resources', async () => {
    const res = await httpPost('/api/triage', {
      texte: 'je veux en finir, j\'ai plus la force'
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'safety_stop');
    assert.ok(res.data.safety_response, 'safety_response requis pour renderSafetyStop');
    assert.ok(Array.isArray(res.data.safety_response.resources));
    assert.ok(res.data.safety_response.resources.length > 0);
    // Au moins un numéro de téléphone
    const phones = res.data.safety_response.resources.map(r => r.phone).filter(Boolean);
    assert.ok(phones.length > 0, 'au moins un téléphone d\'urgence');
  });

  it('POST /api/triage "recours tribunal fédéral" → status human_tier', async () => {
    const res = await httpPost('/api/triage', {
      texte: 'je veux faire un recours au tribunal fédéral'
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'human_tier');
    assert.ok(res.data.human_tier_response, 'human_tier_response requis pour renderHumanTier');
  });

  it('POST /api/triage "succession" → status out_of_scope', async () => {
    const res = await httpPost('/api/triage', {
      texte: 'j\'ai hérité d\'une maison de ma grand-mère'
    });
    assert.equal(res.status, 200);
    assert.equal(res.data.status, 'out_of_scope');
    assert.ok(res.data.out_of_scope_response, 'out_of_scope_response requis pour renderOutOfScope');
  });

  it('POST /api/triage texte trop court → status error 400', async () => {
    const res = await httpPost('/api/triage', { texte: 'ab' });
    assert.equal(res.status, 400);
    assert.equal(res.data.status, 'error');
  });

  it('POST /api/triage/next action inconnue → status error 400', async () => {
    const { case_id } = createCase({ texte: 'bail moisissure' });
    const res = await httpPost('/api/triage/next', {
      case_id,
      action: 'fly_to_mars'
    });
    assert.equal(res.status, 400);
    assert.equal(res.data.status, 'error');
  });
});
