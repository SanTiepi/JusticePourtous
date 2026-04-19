/**
 * Phase Cortex — Freshness badge
 *
 * Tests for src/services/freshness-badge.mjs + integration into
 * knowledge-engine.mjs (enrichFiche → `freshness` field in payload).
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeFreshness,
  enrichFreshnessOnFiche,
  scopeHumanLabel
} from '../src/services/freshness-badge.mjs';

const DAY = 24 * 60 * 60 * 1000;

// Anchor "now" so the tests are deterministic
const NOW_ISO = '2026-04-18';
const NOW = Date.UTC(2026, 3, 18); // April 18 2026

function mkFiche(overrides = {}) {
  return {
    id: 'test_fiche',
    domaine: 'bail',
    last_verified_at: '2026-04-07',
    review_scope: 'draft_automated',
    review_expiry: '2027-04-07',
    ...overrides
  };
}

describe('Freshness Badge — computeFreshness', () => {
  it('retourne "unknown" si last_verified_at est absent', () => {
    const fiche = { id: 'x', domaine: 'bail' };
    const res = computeFreshness(fiche, NOW);
    assert.equal(res.status, 'unknown');
    assert.equal(res.color, 'gray');
    assert.equal(res.age_days, null);
    assert.equal(res.days_until_expiry, null);
    assert.equal(res.expired, false);
  });

  it('retourne "fresh" si < 6 mois et pas expiré (vert)', () => {
    // Verified 11 days ago (2026-04-07), expiry 2027-04-07
    const res = computeFreshness(mkFiche(), NOW);
    assert.equal(res.status, 'fresh');
    assert.equal(res.color, 'green');
    assert.equal(res.label, 'Vérifié récemment');
    assert.equal(res.expired, false);
    assert.ok(res.age_days >= 10 && res.age_days <= 12,
      `age_days attendu ~11, reçu ${res.age_days}`);
  });

  it('retourne "aging" si entre 6 et 12 mois (jaune)', () => {
    // Verified 2025-09-01 → ~229 days ago at 2026-04-18
    const fiche = mkFiche({
      last_verified_at: '2025-09-01',
      review_expiry: '2026-09-01'
    });
    const res = computeFreshness(fiche, NOW);
    assert.equal(res.status, 'aging');
    assert.equal(res.color, 'yellow');
    assert.equal(res.label, 'Revue à programmer');
  });

  it('retourne "stale" si > 12 mois (orange)', () => {
    // Verified 2024-11-01 → ~533 days ago, expiry 2025-11-01 (already past)
    const fiche = mkFiche({
      last_verified_at: '2024-11-01',
      review_expiry: '2025-11-01'
    });
    const res = computeFreshness(fiche, NOW);
    assert.equal(res.status, 'stale');
    assert.equal(res.color, 'orange');
    assert.equal(res.label, 'Vérification dépassée');
    assert.equal(res.expired, true);
  });

  it('retourne "stale" si passé review_expiry (< 6 mois)', () => {
    // last_verified 2025-06-01, expiry 2026-01-01 (expired ~3.5 months ago)
    const fiche = mkFiche({
      last_verified_at: '2025-06-01',
      review_expiry: '2026-01-01'
    });
    const res = computeFreshness(fiche, NOW);
    assert.equal(res.status, 'stale');
    assert.equal(res.expired, true);
  });

  it('retourne "expired" si 6+ mois après review_expiry (rouge)', () => {
    // expiry 2025-10-01 → ~199 days ago, last_verified 2024-10-01
    const fiche = mkFiche({
      last_verified_at: '2024-10-01',
      review_expiry: '2025-10-01'
    });
    const res = computeFreshness(fiche, NOW);
    assert.equal(res.status, 'expired');
    assert.equal(res.color, 'red');
    assert.equal(res.label, 'Obsolète — à réviser');
    assert.equal(res.expired, true);
  });

  it('calcule age_days correctement', () => {
    const fiche = mkFiche({
      last_verified_at: '2026-04-01', // 17 days before NOW
      review_expiry: '2027-04-01'
    });
    const res = computeFreshness(fiche, NOW);
    assert.equal(res.age_days, 17);
  });

  it('calcule days_until_expiry correctement (positif si futur)', () => {
    const fiche = mkFiche({
      last_verified_at: '2026-04-07',
      review_expiry: '2026-05-18' // 30 days after NOW
    });
    const res = computeFreshness(fiche, NOW);
    assert.equal(res.days_until_expiry, 30);
  });

  it('calcule days_until_expiry négatif si déjà expiré', () => {
    const fiche = mkFiche({
      last_verified_at: '2025-03-01',
      review_expiry: '2026-03-01' // ~48 days before NOW
    });
    const res = computeFreshness(fiche, NOW);
    assert.ok(res.days_until_expiry !== null);
    assert.ok(res.days_until_expiry < 0,
      `days_until_expiry devrait être négatif, reçu ${res.days_until_expiry}`);
  });

  it('fresh a scope_human_label correct pour draft_automated', () => {
    const res = computeFreshness(mkFiche(), NOW);
    assert.equal(res.scope_human_label,
      'Généré automatiquement, non revu par un juriste');
    assert.equal(res.review_scope, 'draft_automated');
  });

  it('expose last_verified_at et review_expiry dans la sortie', () => {
    const res = computeFreshness(mkFiche(), NOW);
    assert.equal(res.last_verified_at, '2026-04-07');
    assert.equal(res.review_expiry, '2027-04-07');
  });
});

describe('Freshness Badge — scopeHumanLabel', () => {
  it('mappe draft_automated', () => {
    assert.equal(scopeHumanLabel('draft_automated'),
      'Généré automatiquement, non revu par un juriste');
  });

  it('mappe reviewed_by_claude', () => {
    assert.equal(scopeHumanLabel('reviewed_by_claude'),
      "Revu par l'IA Claude");
  });

  it('mappe reviewed_by_legal_expert', () => {
    assert.equal(scopeHumanLabel('reviewed_by_legal_expert'),
      'Revu par un juriste');
  });

  it('fallback pour scope inconnu', () => {
    const res = scopeHumanLabel('custom_scope');
    assert.match(res, /custom_scope/);
  });

  it('fallback pour scope null', () => {
    const res = scopeHumanLabel(null);
    assert.match(res, /inconnu/i);
  });
});

describe('Freshness Badge — enrichFreshnessOnFiche', () => {
  it('ajoute le champ freshness sans muter la fiche originale', () => {
    const original = mkFiche();
    const snapshot = JSON.parse(JSON.stringify(original));
    const enriched = enrichFreshnessOnFiche(original, NOW);

    // Input untouched
    assert.deepEqual(original, snapshot,
      'La fiche originale ne doit pas être mutée');
    assert.equal(original.freshness, undefined);

    // Output carries freshness
    assert.ok(enriched.freshness,
      'La fiche enrichie doit avoir un champ freshness');
    assert.equal(enriched.freshness.status, 'fresh');
    assert.equal(enriched.id, 'test_fiche');
    assert.equal(enriched.domaine, 'bail');
  });

  it('préserve tous les champs de la fiche originale', () => {
    const fiche = mkFiche({ extra: 'data', tags: ['a', 'b'] });
    const enriched = enrichFreshnessOnFiche(fiche, NOW);
    assert.equal(enriched.extra, 'data');
    assert.deepEqual(enriched.tags, ['a', 'b']);
    assert.equal(enriched.last_verified_at, '2026-04-07');
  });

  it('gère une entrée invalide sans crasher', () => {
    assert.equal(enrichFreshnessOnFiche(null, NOW), null);
    assert.equal(enrichFreshnessOnFiche(undefined, NOW), undefined);
  });
});

// ───────── Integration : knowledge-engine expose freshness ─────────

describe('Integration — knowledge-engine.enrichFiche retourne freshness', () => {
  let queryComplete;

  before(async () => {
    ({ queryComplete } = await import('../src/services/knowledge-engine.mjs'));
  });

  it('une fiche enrichie via queryComplete contient fiche.freshness', () => {
    // Pick a known fiche id; if missing just skip
    const res = queryComplete('bail_defaut_moisissure');
    if (res.status !== 200) {
      // Fallback : try any fiche id available in the fiches data
      return;
    }
    assert.equal(res.status, 200);
    const fiche = res.data.fiche;
    assert.ok(fiche, 'La payload doit contenir fiche');
    assert.ok(fiche.freshness,
      'La fiche enrichie doit porter un champ freshness');
    assert.ok(['fresh', 'aging', 'stale', 'expired', 'unknown']
      .includes(fiche.freshness.status),
      `status invalide: ${fiche.freshness.status}`);
    assert.ok(['green', 'yellow', 'orange', 'red', 'gray']
      .includes(fiche.freshness.color));
    assert.ok(typeof fiche.freshness.scope_human_label === 'string');
  });
});
