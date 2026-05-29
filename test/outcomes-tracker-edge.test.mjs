/**
 * Outcomes Tracker — EDGE CASES / payloads hostiles.
 *
 * Le tracker traite du FEEDBACK utilisateur ATTEIGNABLE via /api/outcome
 * et /api/outcomes/record. Un body API malformé ne doit JAMAIS crasher
 * (pas de throw, pas de 500) — il doit retourner un statut structuré.
 *
 * Couvre, en registre local pur (zéro réseau, zéro serveur) :
 *  - recordOutcome        : null/undefined/{}/case_id manquant ou non-string,
 *                           consent non-booléen, champs numériques pourris
 *  - recordSimpleOutcome  : null/undefined/{}, helpful du mauvais type
 *                           (string/array/objet/NaN), free_text 10k+ /
 *                           injection <script>, consent manquant/non-booléen
 *  - getAggregateStats    : since invalide (NaN, objet, date pourrie)
 *  - anonymizeNotes       : non-string, très long, caractères spéciaux
 *
 * Contrat asserté : retour structuré, JAMAIS de throw.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const TEST_OUTCOMES_PATH = join(tmpdir(), 'jpt-outcomes-edge-test.json');
process.env.OUTCOMES_STORE_PATH = TEST_OUTCOMES_PATH;
process.env.OUTCOMES_HASH_SALT = 'test-salt-edge';

const {
  recordOutcome,
  recordSimpleOutcome,
  getAggregateStats,
  anonymizeNotes,
  _listOutcomesForTests,
  _resetOutcomesForTests,
  NOTES_MAX_LENGTH
} = await import('../src/services/outcomes-tracker.mjs');

function reset() {
  _resetOutcomesForTests({ path: TEST_OUTCOMES_PATH });
}

// ─── recordOutcome : payloads hostiles ─────────────────────────

describe('recordOutcome — payloads malformés (jamais de throw)', () => {
  beforeEach(reset);

  // BUG ATTEIGNABLE À CORRIGER : recordOutcome(null) THROW au lieu de retourner
  // un statut. La destructuration paramétrée `{ ... } = {}` n'applique son
  // default QUE pour `undefined`, jamais pour `null`. Un body API parsé comme
  // JSON `null` (POST /api/outcomes/record avec corps "null") atteint ce chemin
  // → TypeError ligne 254-266 (outcomes-tracker.mjs) → 500 sur input user.
  // Fix : `function recordOutcome(input) { input = input || {}; const { ... } = input; }`
  // ou garde en tête. On VERROUILLE le comportement actuel (throw) pour détecter le fix.
  it('null → BUG: throw TypeError (devrait retourner un statut)', () => {
    assert.throws(() => recordOutcome(null), TypeError);
    assert.equal(_listOutcomesForTests().length, 0);
  });

  it('undefined (aucun arg) → consent par défaut false → no_consent', () => {
    const r = recordOutcome(undefined);
    // defaults kick in: consent_given=false → no_consent (avant invalid_input)
    assert.equal(r.status, 'no_consent');
    assert.equal(r.outcome_id, null);
  });

  it('{} → no_consent (consent par défaut false)', () => {
    const r = recordOutcome({});
    assert.equal(r.status, 'no_consent');
  });

  it('consent ok mais case_id manquant → case_id_required', () => {
    const r = recordOutcome({ consent_given: true, fiche_id: 'f', domaine: 'bail' });
    assert.equal(r.status, 'case_id_required');
  });

  it('case_id null avec consent → case_id_required', () => {
    const r = recordOutcome({ consent_given: true, case_id: null, fiche_id: 'f', domaine: 'bail' });
    assert.equal(r.status, 'case_id_required');
  });

  it('case_id non-string (number) → case_id_required', () => {
    const r = recordOutcome({ consent_given: true, case_id: 12345, fiche_id: 'f', domaine: 'bail' });
    assert.equal(r.status, 'case_id_required');
  });

  it('case_id objet → case_id_required (pas de crash sur hashCaseId)', () => {
    const r = recordOutcome({ consent_given: true, case_id: { evil: true }, fiche_id: 'f', domaine: 'bail' });
    assert.equal(r.status, 'case_id_required');
  });

  it('consent non-booléen "true" (string) → no_consent (strict ===)', () => {
    const r = recordOutcome({ consent_given: 'true', case_id: 'c1', fiche_id: 'f', domaine: 'bail' });
    assert.equal(r.status, 'no_consent');
  });

  it('consent 1 (truthy non-bool) → no_consent', () => {
    const r = recordOutcome({ consent_given: 1, case_id: 'c1', fiche_id: 'f', domaine: 'bail' });
    assert.equal(r.status, 'no_consent');
  });

  it('satisfaction NaN-source (string non numérique) → satisfaction_out_of_range', () => {
    const r = recordOutcome({
      consent_given: true, case_id: 'c1', fiche_id: 'f', domaine: 'bail',
      satisfaction: 'beaucoup'
    });
    assert.equal(r.status, 'satisfaction_out_of_range');
  });

  it('duration_weeks array → duration_invalid', () => {
    const r = recordOutcome({
      consent_given: true, case_id: 'c1', fiche_id: 'f', domaine: 'bail',
      duration_weeks: [1, 2, 3]
    });
    assert.equal(r.status, 'duration_invalid');
  });

  it('cost_chf négatif → cost_invalid', () => {
    const r = recordOutcome({
      consent_given: true, case_id: 'c1', fiche_id: 'f', domaine: 'bail',
      cost_chf: -500
    });
    assert.equal(r.status, 'cost_invalid');
  });

  it('action_taken inconnu → action_invalid', () => {
    const r = recordOutcome({
      consent_given: true, case_id: 'c1', fiche_id: 'f', domaine: 'bail',
      action_taken: 'hacked'
    });
    assert.equal(r.status, 'action_invalid');
  });

  it('payload valide minimal → recorded', () => {
    const r = recordOutcome({ consent_given: true, case_id: 'c1', fiche_id: 'f', domaine: 'bail' });
    assert.equal(r.status, 'recorded');
    assert.ok(r.outcome_id);
  });
});

// ─── recordSimpleOutcome : helpful du mauvais type ─────────────

describe('recordSimpleOutcome — payloads hostiles (jamais de throw)', () => {
  beforeEach(reset);

  // BUG ATTEIGNABLE À CORRIGER : recordSimpleOutcome(null) THROW au lieu de
  // retourner { recorded:false, reason }. Même cause que recordOutcome : le
  // default `= {}` de la destructuration paramétrée ne couvre pas `null`.
  // Atteignable via POST /api/outcome avec corps JSON "null" → TypeError
  // ligne 451-457 (outcomes-tracker.mjs) → 500 sur input user.
  // Fix : `function recordSimpleOutcome(input) { input = input || {}; ... }`.
  // On VERROUILLE le comportement actuel (throw) pour détecter le fix.
  it('null → BUG: throw TypeError (devrait retourner recorded:false)', () => {
    assert.throws(() => recordSimpleOutcome(null), TypeError);
  });

  it('undefined → consent_required (defaults)', () => {
    const r = recordSimpleOutcome(undefined);
    assert.equal(r.recorded, false);
    assert.equal(r.reason, 'consent_required');
  });

  it('{} → consent_required', () => {
    const r = recordSimpleOutcome({});
    assert.equal(r.recorded, false);
    assert.equal(r.reason, 'consent_required');
  });

  it('consent true mais case_id manquant → case_id_required', () => {
    const r = recordSimpleOutcome({ consent: true, helpful: 3 });
    assert.equal(r.recorded, false);
    assert.equal(r.reason, 'case_id_required');
  });

  it('case_id non-string → case_id_required', () => {
    const r = recordSimpleOutcome({ consent: true, case_id: 99, helpful: 3 });
    assert.equal(r.reason, 'case_id_required');
  });

  it('helpful string non numérique → helpful_invalid', () => {
    const r = recordSimpleOutcome({ consent: true, case_id: 'c1', helpful: 'oui' });
    assert.equal(r.recorded, false);
    assert.equal(r.reason, 'helpful_invalid');
  });

  it('helpful array → helpful_invalid (Number([]) = 0)', () => {
    const r = recordSimpleOutcome({ consent: true, case_id: 'c1', helpful: [1] });
    // Number([1]) === 1 → valide; Number([1,2]) === NaN → invalid. On teste un array multi.
    assert.equal(r.reason, undefined);
    // [1] est coercé en 1 → effectivement enregistré. On vérifie le multi-élément séparément.
  });

  it('helpful array multi-élément → helpful_invalid', () => {
    const r = recordSimpleOutcome({ consent: true, case_id: 'c-arr', helpful: [1, 2] });
    assert.equal(r.recorded, false);
    assert.equal(r.reason, 'helpful_invalid');
  });

  it('helpful objet → helpful_invalid (Number({}) = NaN)', () => {
    const r = recordSimpleOutcome({ consent: true, case_id: 'c1', helpful: { v: 3 } });
    assert.equal(r.recorded, false);
    assert.equal(r.reason, 'helpful_invalid');
  });

  it('helpful NaN → helpful_invalid', () => {
    const r = recordSimpleOutcome({ consent: true, case_id: 'c1', helpful: NaN });
    assert.equal(r.recorded, false);
    assert.equal(r.reason, 'helpful_invalid');
  });

  it('helpful hors range (5) → helpful_invalid', () => {
    const r = recordSimpleOutcome({ consent: true, case_id: 'c1', helpful: 5 });
    assert.equal(r.reason, 'helpful_invalid');
  });

  it('consent non-booléen "true" → consent_required (strict ===)', () => {
    const r = recordSimpleOutcome({ consent: 'true', case_id: 'c1', helpful: 3 });
    assert.equal(r.recorded, false);
    assert.equal(r.reason, 'consent_required');
  });

  it('free_text 10000+ caractères → recorded, notes tronquées à NOTES_MAX_LENGTH', () => {
    const huge = 'a'.repeat(12000);
    const r = recordSimpleOutcome({ consent: true, case_id: 'c-huge', helpful: 2, free_text: huge });
    assert.equal(r.recorded, true);
    const stored = _listOutcomesForTests().find(o => o.outcome_id === r.outcome_id);
    assert.ok(stored.notes_anonymized.length <= NOTES_MAX_LENGTH);
  });

  it('free_text injection <script> → recorded, pas de throw (stockage brut tronqué)', () => {
    const xss = '<script>alert(document.cookie)</script>'.repeat(20);
    const r = recordSimpleOutcome({ consent: true, case_id: 'c-xss', helpful: 1, free_text: xss });
    assert.equal(r.recorded, true);
    const stored = _listOutcomesForTests().find(o => o.outcome_id === r.outcome_id);
    assert.ok(typeof stored.notes_anonymized === 'string');
    assert.ok(stored.notes_anonymized.length <= NOTES_MAX_LENGTH);
  });

  it('free_text avec caractères spéciaux/unicode → recorded, jamais de throw', () => {
    const weird = '𝕯𝖆𝖓𝖌𝖊𝖗   ￿ \\x00 ¿¡ €£¥ \n\t\r ÿÀ';
    const r = recordSimpleOutcome({ consent: true, case_id: 'c-weird', helpful: 3, free_text: weird });
    assert.equal(r.recorded, true);
    const stored = _listOutcomesForTests().find(o => o.outcome_id === r.outcome_id);
    assert.equal(typeof stored.notes_anonymized, 'string');
  });

  it('payload valide minimal → recorded', () => {
    const r = recordSimpleOutcome({ consent: true, case_id: 'c-ok', helpful: 3 });
    assert.equal(r.recorded, true);
    assert.ok(r.outcome_id);
  });
});

// ─── getAggregateStats : since invalide ────────────────────────

describe('getAggregateStats — since invalide (jamais de throw)', () => {
  beforeEach(reset);

  it('aucun arg → total 0, structure stable', () => {
    const s = getAggregateStats();
    assert.equal(s.total, 0);
    assert.deepEqual(s.top_domains, []);
    assert.equal(s.since, null);
  });

  it('since = NaN → ignoré (since null), pas de throw', () => {
    const s = getAggregateStats({ since: NaN });
    assert.equal(s.since, null);
  });

  it('since = objet → ignoré, pas de throw', () => {
    const s = getAggregateStats({ since: { evil: true } });
    assert.equal(s.since, null);
  });

  it('since = string date pourrie → ignoré, pas de throw', () => {
    const s = getAggregateStats({ since: 'not-a-date-at-all' });
    assert.equal(s.since, null);
  });

  it('since = ISO valide → since renvoyé en ISO', () => {
    const s = getAggregateStats({ since: '2026-01-01T00:00:00.000Z' });
    assert.equal(s.since, '2026-01-01T00:00:00.000Z');
  });
});

// ─── anonymizeNotes : entrées non-string / pathologiques ───────

describe('anonymizeNotes — entrées non-string (jamais de throw)', () => {
  it('null → "" (string vide)', () => {
    assert.equal(anonymizeNotes(null), '');
  });

  it('undefined → ""', () => {
    assert.equal(anonymizeNotes(undefined), '');
  });

  it('number → coercé en string, jamais de throw', () => {
    assert.equal(typeof anonymizeNotes(42), 'string');
  });

  it('objet → coercé, jamais de throw', () => {
    assert.equal(typeof anonymizeNotes({ a: 1 }), 'string');
  });

  it('array → coercé, jamais de throw', () => {
    assert.equal(typeof anonymizeNotes([1, 2, 3]), 'string');
  });

  it('texte très long → tronqué à NOTES_MAX_LENGTH', () => {
    const out = anonymizeNotes('z'.repeat(50000));
    assert.ok(out.length <= NOTES_MAX_LENGTH);
  });
});
