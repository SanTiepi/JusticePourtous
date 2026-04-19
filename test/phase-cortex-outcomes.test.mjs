/**
 * Phase Cortex — Outcomes Tracker tests.
 *
 * Couvre :
 *  - consent obligatoire (no_consent sinon)
 *  - hash case_id (PII jamais en clair)
 *  - anonymisation notes (email/tél/adresse/CP+ville/nom)
 *  - troncature 200 chars
 *  - k-anonymity (n < 5 → null)
 *  - getOutcomeStats avec n ≥ 5
 *  - idempotence (même case_id + fiche_id → update, pas double)
 *  - lookup intent_id via intents-catalog
 *  - validation (action / result / satisfaction range)
 *  - scan PII regex sur outcomes.json (zéro fuite)
 *  - script outcomes-stats-report
 */

import { describe, it, beforeEach, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, rmSync, readFileSync } from 'node:fs';

const TEST_OUTCOMES_PATH = join(tmpdir(), 'jpt-outcomes-test.json');
process.env.OUTCOMES_STORE_PATH = TEST_OUTCOMES_PATH;
process.env.OUTCOMES_HASH_SALT = 'test-salt-deterministic';

const {
  recordOutcome,
  getOutcomesByIntent,
  getOutcomeStats,
  anonymizeNotes,
  snapshotStore,
  _listOutcomes,
  _resetOutcomesForTests,
  _flushOutcomes,
  K_ANONYMITY_THRESHOLD,
  NOTES_MAX_LENGTH
} = await import('../src/services/outcomes-tracker.mjs');

const { buildReport } = await import('../scripts/outcomes-stats-report.mjs');

function reset() {
  _resetOutcomesForTests({ path: TEST_OUTCOMES_PATH });
}

before(reset);
after(() => {
  _flushOutcomes();
  try { if (existsSync(TEST_OUTCOMES_PATH)) rmSync(TEST_OUTCOMES_PATH); } catch {}
});

// ═══════════════════════════════════════════════════════════════
// Consent workflow
// ═══════════════════════════════════════════════════════════════

describe('outcomes-tracker — consent obligatoire', () => {
  beforeEach(reset);

  it('recordOutcome sans consent_given → status no_consent, rien stocké', () => {
    const r = recordOutcome({
      case_id: 'abc123',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      canton: 'VD',
      action_taken: 'negotiated',
      result: 'partially_won'
      // consent_given absent
    });
    assert.equal(r.status, 'no_consent');
    assert.equal(r.outcome_id, null);
    assert.equal(_listOutcomes().length, 0);
  });

  it('recordOutcome avec consent_given: false → no_consent', () => {
    const r = recordOutcome({
      case_id: 'abc123',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      consent_given: false
    });
    assert.equal(r.status, 'no_consent');
    assert.equal(_listOutcomes().length, 0);
  });

  it('recordOutcome avec consent_given: "true" (string) → no_consent (strict)', () => {
    const r = recordOutcome({
      case_id: 'abc123',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      consent_given: 'true' // string, pas boolean
    });
    assert.equal(r.status, 'no_consent');
  });

  it('recordOutcome consent strict true + payload complet → recorded', () => {
    const r = recordOutcome({
      case_id: 'case-001',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      canton: 'VD',
      consent_given: true,
      action_taken: 'negotiated',
      result: 'partially_won',
      duration_weeks: 8,
      cost_chf: 0,
      satisfaction: 4,
      notes_anonymized: 'obtenu 15% reduction apres conciliation'
    });
    assert.equal(r.status, 'recorded');
    assert.match(r.outcome_id, /^[0-9a-f]{16}$/);
  });
});

// ═══════════════════════════════════════════════════════════════
// Hash case_id : PII jamais en clair
// ═══════════════════════════════════════════════════════════════

describe('outcomes-tracker — hash case_id', () => {
  beforeEach(reset);

  it('case_id JAMAIS stocké en clair, seulement le hash', () => {
    const case_id = 'super-secret-case-id-xyz';
    recordOutcome({
      case_id,
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      consent_given: true
    });
    const list = _listOutcomes();
    assert.equal(list.length, 1);
    assert.ok(list[0].case_id_hash);
    assert.equal(list[0].case_id_hash.length, 64); // sha256 hex
    assert.equal(list[0].case_id, undefined, 'case_id en clair NE DOIT PAS exister');
    assert.notEqual(list[0].case_id_hash, case_id);
    // Et nulle part dans le JSON sérialisé
    const serialized = JSON.stringify(list);
    assert.ok(!serialized.includes(case_id), 'case_id ne doit pas fuir dans le JSON');
  });

  it('même case_id → même hash (déterministe avec salt fixe)', () => {
    recordOutcome({
      case_id: 'caseA',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      consent_given: true
    });
    const h1 = _listOutcomes()[0].case_id_hash;
    reset();
    recordOutcome({
      case_id: 'caseA',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      consent_given: true
    });
    const h2 = _listOutcomes()[0].case_id_hash;
    assert.equal(h1, h2);
  });
});

// ═══════════════════════════════════════════════════════════════
// Anonymisation notes
// ═══════════════════════════════════════════════════════════════

describe('outcomes-tracker — anonymizeNotes', () => {
  it('strippe les emails', () => {
    const r = anonymizeNotes('Contact : foo.bar@example.ch pour suite');
    assert.ok(!r.includes('foo.bar@example.ch'));
    assert.ok(r.includes('[redacted]'));
  });

  it('strippe les téléphones suisses (format +41)', () => {
    const r = anonymizeNotes('Tel +41 78 123 45 67 dispo le matin');
    assert.ok(!r.includes('78 123 45 67'));
    assert.ok(!r.includes('+41'));
    assert.ok(r.includes('[redacted]'));
  });

  it('strippe les téléphones suisses (format 0XX)', () => {
    const r = anonymizeNotes('Mon natel 078.123.45.67 pour info');
    assert.ok(!r.includes('078.123.45.67'));
    assert.ok(r.includes('[redacted]'));
  });

  it('strippe les adresses (rue + numéro)', () => {
    const r = anonymizeNotes('habite rue de Lausanne 42 depuis 3 ans');
    assert.ok(!r.includes('rue de Lausanne 42'));
    assert.ok(r.includes('[redacted]'));
  });

  it('strippe code postal + ville', () => {
    const r = anonymizeNotes('reside a 1003 Lausanne actuellement');
    assert.ok(!r.includes('1003 Lausanne'));
    assert.ok(r.includes('[redacted]'));
  });

  it('strippe noms propres (Prénom Nom)', () => {
    const r = anonymizeNotes('rdv avec Jean Dupont la semaine prochaine');
    assert.ok(!r.includes('Jean Dupont'));
    assert.ok(r.includes('[redacted]'));
  });

  it('strippe noms avec titre (Maître, M., Mme)', () => {
    const r = anonymizeNotes('contacté Maître Schmid puis Mme Müller');
    assert.ok(!r.includes('Schmid'));
    assert.ok(!r.includes('Müller'));
  });

  it('tronque à NOTES_MAX_LENGTH chars', () => {
    const long = 'a'.repeat(500);
    const r = anonymizeNotes(long);
    assert.ok(r.length <= NOTES_MAX_LENGTH);
  });

  it('garde le contenu utile (chiffres, %, mots métier)', () => {
    const r = anonymizeNotes('obtenu 15% de reduction apres conciliation');
    assert.ok(r.includes('15%'));
    assert.ok(r.includes('reduction'));
  });

  it('null/undefined → string vide (jamais de crash)', () => {
    assert.equal(anonymizeNotes(null), '');
    assert.equal(anonymizeNotes(undefined), '');
    assert.equal(anonymizeNotes(''), '');
  });
});

// ═══════════════════════════════════════════════════════════════
// k-anonymity
// ═══════════════════════════════════════════════════════════════

describe('outcomes-tracker — k-anonymity (k=5)', () => {
  beforeEach(reset);

  function seed(n, overrides = {}) {
    for (let i = 0; i < n; i++) {
      recordOutcome({
        case_id: `case-${overrides.prefix || 'x'}-${i}`,
        fiche_id: overrides.fiche_id || 'bail_defaut_moisissure',
        domaine: overrides.domaine || 'bail',
        canton: overrides.canton || 'VD',
        consent_given: true,
        action_taken: 'negotiated',
        result: i % 2 === 0 ? 'partially_won' : 'won',
        duration_weeks: 4 + i,
        cost_chf: 100 * i,
        satisfaction: (i % 5) + 1,
        notes_anonymized: 'note neutre'
      });
    }
  }

  it('getOutcomeStats n < 5 → null (k-anonymity actif)', () => {
    seed(3);
    const stats = getOutcomeStats({ domaine: 'bail', canton: 'VD' });
    assert.equal(stats, null, 'doit refuser une stat sur échantillon trop petit');
  });

  it('getOutcomeStats n = 4 → null (juste sous le seuil)', () => {
    seed(4);
    const stats = getOutcomeStats({ domaine: 'bail' });
    assert.equal(stats, null);
  });

  it('getOutcomeStats n ≥ 5 → stats agrégées retournées', () => {
    seed(6);
    const stats = getOutcomeStats({ domaine: 'bail', canton: 'VD' });
    assert.ok(stats);
    assert.equal(stats.n, 6);
    assert.equal(stats.domaine, 'bail');
    assert.ok(stats.by_result);
    assert.ok(stats.median_duration_weeks != null);
    assert.ok(stats.median_cost_chf != null);
    assert.ok(stats.mean_satisfaction != null);
  });

  it('getOutcomeStats min_n custom respecté', () => {
    seed(3);
    const strict = getOutcomeStats({ domaine: 'bail', min_n: 10 });
    assert.equal(strict, null);
    const lax = getOutcomeStats({ domaine: 'bail', min_n: 2 });
    assert.ok(lax);
    assert.equal(lax.n, 3);
  });

  it('K_ANONYMITY_THRESHOLD exporté = 5', () => {
    assert.equal(K_ANONYMITY_THRESHOLD, 5);
  });
});

// ═══════════════════════════════════════════════════════════════
// Idempotence
// ═══════════════════════════════════════════════════════════════

describe('outcomes-tracker — idempotence', () => {
  beforeEach(reset);

  it('même case_id + fiche_id → update, pas doublon', () => {
    const r1 = recordOutcome({
      case_id: 'idemp-1',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      canton: 'VD',
      consent_given: true,
      action_taken: 'awaiting',
      result: 'pending'
    });
    assert.equal(r1.status, 'recorded');

    const r2 = recordOutcome({
      case_id: 'idemp-1',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      canton: 'VD',
      consent_given: true,
      action_taken: 'negotiated',
      result: 'partially_won',
      duration_weeks: 12,
      satisfaction: 5
    });
    assert.equal(r2.status, 'updated');
    assert.equal(r2.outcome_id, r1.outcome_id);

    const list = _listOutcomes();
    assert.equal(list.length, 1, 'aucun doublon');
    assert.equal(list[0].action_taken, 'negotiated');
    assert.equal(list[0].result, 'partially_won');
    assert.equal(list[0].duration_weeks, 12);
    assert.equal(list[0].satisfaction, 5);
  });

  it('même case_id mais fiche différente → 2 outcomes distincts', () => {
    recordOutcome({
      case_id: 'multi-fiche',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      consent_given: true
    });
    recordOutcome({
      case_id: 'multi-fiche',
      fiche_id: 'bail_expulsion',
      domaine: 'bail',
      consent_given: true
    });
    assert.equal(_listOutcomes().length, 2);
  });
});

// ═══════════════════════════════════════════════════════════════
// Intent lookup + agrégation
// ═══════════════════════════════════════════════════════════════

describe('outcomes-tracker — intent lookup et getOutcomesByIntent', () => {
  beforeEach(reset);

  it('intent_id résolu via intents-catalog (fiche → intent)', () => {
    recordOutcome({
      case_id: 'intent-1',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      consent_given: true
    });
    const o = _listOutcomes()[0];
    assert.equal(o.intent_id, 'bail_defaut_moisissure');
  });

  it('fiche inconnue → intent_id null (pas crash)', () => {
    recordOutcome({
      case_id: 'unknown-fiche',
      fiche_id: 'fiche_inexistante_xyz',
      domaine: 'bail',
      consent_given: true
    });
    const o = _listOutcomes()[0];
    assert.equal(o.intent_id, null);
  });

  it('getOutcomesByIntent agrège sur l\'intent', () => {
    for (let i = 0; i < 3; i++) {
      recordOutcome({
        case_id: `intent-agg-${i}`,
        fiche_id: 'bail_defaut_moisissure',
        domaine: 'bail',
        canton: 'VD',
        consent_given: true,
        action_taken: 'negotiated',
        result: 'won',
        duration_weeks: 6 + i,
        cost_chf: 0,
        satisfaction: 4
      });
    }
    const agg = getOutcomesByIntent('bail_defaut_moisissure');
    assert.ok(agg);
    assert.equal(agg.total, 3);
    assert.equal(agg.by_result.won, 3);
    assert.equal(agg.by_action.negotiated, 3);
    assert.ok(agg.median_duration_weeks != null);
  });

  it('getOutcomesByIntent sur intent inconnu → total 0', () => {
    const r = getOutcomesByIntent('intent_inexistant');
    assert.equal(r.total, 0);
  });
});

// ═══════════════════════════════════════════════════════════════
// Validation
// ═══════════════════════════════════════════════════════════════

describe('outcomes-tracker — validation', () => {
  beforeEach(reset);

  it('action_taken invalide → status action_invalid', () => {
    const r = recordOutcome({
      case_id: 'val-1',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      consent_given: true,
      action_taken: 'something_weird'
    });
    assert.equal(r.status, 'action_invalid');
  });

  it('result invalide → status result_invalid', () => {
    const r = recordOutcome({
      case_id: 'val-2',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      consent_given: true,
      result: 'destroyed'
    });
    assert.equal(r.status, 'result_invalid');
  });

  it('satisfaction hors range 1-5 → satisfaction_out_of_range', () => {
    const r = recordOutcome({
      case_id: 'val-3',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      consent_given: true,
      satisfaction: 9
    });
    assert.equal(r.status, 'satisfaction_out_of_range');
  });

  it('case_id manquant → case_id_required', () => {
    const r = recordOutcome({
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      consent_given: true
    });
    assert.equal(r.status, 'case_id_required');
  });
});

// ═══════════════════════════════════════════════════════════════
// Garde-fou : aucun PII dans le store sérialisé
// ═══════════════════════════════════════════════════════════════

describe('outcomes-tracker — scan PII regex sur outcomes.json', () => {
  beforeEach(reset);

  it('outcomes.json ne contient aucun email, tél, ou case_id en clair', () => {
    recordOutcome({
      case_id: 'pii-leak-test-CASE-007',
      fiche_id: 'bail_defaut_moisissure',
      domaine: 'bail',
      canton: 'VD',
      consent_given: true,
      action_taken: 'negotiated',
      result: 'won',
      notes_anonymized: 'contact: jean.dupont@gmail.com tel +41 78 999 88 77 habite rue Verte 7 a 1003 Lausanne'
    });
    _flushOutcomes();

    assert.ok(existsSync(TEST_OUTCOMES_PATH));
    const raw = readFileSync(TEST_OUTCOMES_PATH, 'utf-8');

    // case_id en clair
    assert.ok(!raw.includes('pii-leak-test-CASE-007'), 'case_id en clair fuite');
    // email
    assert.ok(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(raw),
      'email présent dans le store');
    // tél +41
    assert.ok(!/(?:\+|00)\s*41[\s.-]?\d{2}[\s.-]?\d{3}/.test(raw),
      'téléphone +41 présent');
    // tél 0XX
    assert.ok(!/\b0\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}\b/.test(raw),
      'téléphone 0XX présent');
    // adresse
    assert.ok(!/rue\s+\w+\s+\d+/i.test(raw), 'adresse présente');
    // CP + ville
    assert.ok(!/\b1003\s+Lausanne\b/.test(raw), 'CP+ville présent');
  });
});

// ═══════════════════════════════════════════════════════════════
// Script outcomes-stats-report
// ═══════════════════════════════════════════════════════════════

describe('outcomes-stats-report — buildReport', () => {
  beforeEach(reset);

  it('rapport vide si aucun outcome', () => {
    const report = buildReport();
    assert.equal(report.total_outcomes, 0);
    assert.equal(report.intents_published, 0);
    assert.equal(report.k_anonymity_threshold, 5);
  });

  it('rapport publie un intent quand n ≥ 5, supprime sinon', () => {
    // 6 outcomes pour un intent (publié) + 2 pour un autre (supprimé)
    for (let i = 0; i < 6; i++) {
      recordOutcome({
        case_id: `r-pub-${i}`,
        fiche_id: 'bail_defaut_moisissure',
        domaine: 'bail',
        canton: 'VD',
        consent_given: true,
        result: 'won',
        action_taken: 'negotiated'
      });
    }
    for (let i = 0; i < 2; i++) {
      recordOutcome({
        case_id: `r-sup-${i}`,
        fiche_id: 'bail_animaux',
        domaine: 'bail',
        canton: 'GE',
        consent_given: true,
        result: 'lost',
        action_taken: 'abandoned'
      });
    }

    const report = buildReport();
    assert.equal(report.total_outcomes, 8);
    assert.equal(report.intents_tracked, 2);
    assert.equal(report.intents_published, 1);
    assert.equal(report.intents_suppressed_low_n, 1);
    assert.ok(report.by_intent.bail_defaut_moisissure);
    assert.equal(report.by_intent.bail_defaut_moisissure.n, 6);
    assert.ok(!report.by_intent.bail_animaux, 'intent < k doit être supprimé');
  });
});
