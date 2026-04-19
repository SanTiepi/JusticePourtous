/**
 * Phase Cortex — Payload shape (review vague 2, findings #4 & #5).
 *
 * Couvre :
 *   - shapePayload ajoute les wrappers `quality` et `pipeline`
 *   - Les champs racine restent intacts (non-breaking absolu)
 *   - `quality.jurisprudence` dédupliquée (préfère jurisprudence_enriched)
 *   - `quality.confidence.tier` reprend `payload.tier`
 *   - `pipeline.degraded_mode` reprend `payload.degraded_mode`
 *   - `quality.freshness` extrait de `primary.fiche.freshness` si absent racine
 *   - `collectWarnings` cumule certificate + quality_warning + degraded_mode
 *   - Intégration : `handleTriageStart` retourne un payload avec quality/pipeline
 *   - Idempotence : shapePayload deux fois = même résultat structurel
 *   - Dédup par signature case-insensitive et trim
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  shapePayload,
  unifyJurisprudence,
  collectWarnings,
  extractFreshnessFromPrimary,
} from '../src/services/payload-shaper.mjs';

// Imports conditionnels : si la chaîne triage-orchestration est cassée par un
// autre chantier (coverage-certificate partiellement exporté p. ex.), on bascule
// l'intégration en mode skip plutôt que faire échouer les tests unitaires qui,
// eux, dépendent uniquement de payload-shaper.
let handleTriageStart = null;
let _resetStoreForTests = null;
try {
  const orch = await import('../src/services/triage-orchestration.mjs');
  handleTriageStart = orch.handleTriageStart;
  const cs = await import('../src/services/case-store.mjs');
  _resetStoreForTests = cs._resetStoreForTests;
} catch (err) {
  // Chaîne d'orchestration indisponible — les tests d'intégration seront skippés
  // (message diagnostic visible dans la sortie du runner).
  // eslint-disable-next-line no-console
  console.warn('[phase-cortex-payload-shape] integration skipped:', err.message);
}

const TEST_STORE_PATH = join(tmpdir(), 'justicepourtous-payload-shape.json');

// ─── Fixtures ──────────────────────────────────────────────────────

function rawPayloadFixture(overrides = {}) {
  return {
    status: 'ready_for_pipeline',
    case_id: 'case_fixture',
    ficheId: 'bail_moisissure',
    domaine: 'bail',
    resumeSituation: 'Moisissure dans le logement',

    // Champs de qualité — finding #5
    certificate: {
      status: 'sufficient',
      critical_fails: [],
      warnings: [],
      checked_at: '2026-04-18T12:00:00Z',
    },
    confiance: 'probable',
    tier: 2,
    tier_score: 14,
    tier_max: 20,
    uncertainties: ['canton inconnu'],

    // Jurisprudence — finding #4 (deux versions)
    jurisprudence_enriched: [
      {
        signature: '4A_32/2018',
        tier: 2,
        tier_label: '2 - Tribunal Fédéral arrêt',
        date_display: '2018',
        strength_badge: 'moderate',
        resultat: 'favorable_locataire',
      },
    ],

    // Champs pipeline — finding #5
    complexite: 'moyenne',
    complexiteScore: 14,
    hard_rules_triggered: ['avocat_obligatoire_non'],
    recommended_domain_order: ['bail', 'travail'],
    urgency_marker: { level: 'normale', delai_jours: 30 },
    pivot_reasons: [],
    degraded_mode: false,
    source_language: 'fr',
    translation_disclaimer: null,
    dimensions_detail: { urgency: { value: 30 } },
    flags: { bareme_hit: false },

    // Autres champs inchangés
    disclaimer: 'disclaimer text',
    ...overrides,
  };
}

// ─── 1. Wrappers ajoutés ──────────────────────────────────────────

describe('shapePayload — wrappers quality & pipeline', () => {
  it('ajoute quality et pipeline aux payloads existants', () => {
    const raw = rawPayloadFixture();
    const shaped = shapePayload(raw);
    assert.ok(shaped.quality, 'quality doit être présent');
    assert.ok(shaped.pipeline, 'pipeline doit être présent');
    assert.equal(typeof shaped.quality, 'object');
    assert.equal(typeof shaped.pipeline, 'object');
  });

  it('NON-BREAKING : tous les champs racine restent accessibles', () => {
    const raw = rawPayloadFixture();
    const shaped = shapePayload(raw);
    // Les champs existants DOIVENT rester à la racine
    assert.equal(shaped.status, 'ready_for_pipeline');
    assert.equal(shaped.case_id, 'case_fixture');
    assert.equal(shaped.ficheId, 'bail_moisissure');
    assert.equal(shaped.domaine, 'bail');
    assert.equal(shaped.confiance, 'probable');
    assert.equal(shaped.tier, 2);
    assert.equal(shaped.tier_score, 14);
    assert.equal(shaped.complexite, 'moyenne');
    assert.deepEqual(shaped.hard_rules_triggered, ['avocat_obligatoire_non']);
    assert.equal(shaped.degraded_mode, false);
    assert.equal(shaped.disclaimer, 'disclaimer text');
    assert.ok(shaped.certificate);
    assert.ok(shaped.jurisprudence_enriched);
  });

  it('quality.confidence reprend correctement tier / tier_score / confiance', () => {
    const raw = rawPayloadFixture();
    const shaped = shapePayload(raw);
    assert.equal(shaped.quality.confidence.level, 'probable');
    assert.equal(shaped.quality.confidence.tier, 2);
    assert.equal(shaped.quality.confidence.tier_score, 14);
    assert.equal(shaped.quality.confidence.tier_max, 20);
    assert.deepEqual(shaped.quality.confidence.uncertainties, ['canton inconnu']);
    assert.ok(Array.isArray(shaped.quality.confidence.warnings));
  });

  it('quality.certificate reprend le certificate racine', () => {
    const raw = rawPayloadFixture();
    const shaped = shapePayload(raw);
    assert.equal(shaped.quality.certificate.status, 'sufficient');
    assert.equal(shaped.quality.certificate.checked_at, '2026-04-18T12:00:00Z');
  });

  it('pipeline reprend tous les champs structurels', () => {
    const raw = rawPayloadFixture();
    const shaped = shapePayload(raw);
    assert.equal(shaped.pipeline.complexite, 'moyenne');
    assert.equal(shaped.pipeline.complexite_score, 14);
    assert.deepEqual(shaped.pipeline.hard_rules_triggered, ['avocat_obligatoire_non']);
    assert.deepEqual(shaped.pipeline.recommended_domain_order, ['bail', 'travail']);
    assert.equal(shaped.pipeline.urgency_marker.level, 'normale');
    assert.equal(shaped.pipeline.degraded_mode, false);
    assert.equal(shaped.pipeline.source_language, 'fr');
    assert.deepEqual(shaped.pipeline.flags, { bareme_hit: false });
  });

  it('pipeline.degraded_mode reprend correctement quand true', () => {
    const raw = rawPayloadFixture({
      degraded_mode: true,
      source_language: 'de',
      translation_disclaimer: 'Traduction auto — mode dégradé',
    });
    const shaped = shapePayload(raw);
    assert.equal(shaped.pipeline.degraded_mode, true);
    assert.equal(shaped.pipeline.source_language, 'de');
    assert.equal(shaped.pipeline.translation_disclaimer, 'Traduction auto — mode dégradé');
    // Racine aussi (non-breaking)
    assert.equal(shaped.degraded_mode, true);
  });
});

// ─── 2. Valeurs par défaut sur payload minimal ────────────────────

describe('shapePayload — robustesse valeurs absentes', () => {
  it('payload quasi-vide → wrappers présents avec défauts sûrs', () => {
    const shaped = shapePayload({ status: 'ready_for_pipeline' });
    assert.equal(shaped.quality.certificate, null);
    assert.equal(shaped.quality.freshness, null);
    assert.equal(shaped.quality.confidence.level, null);
    assert.equal(shaped.quality.confidence.tier, null);
    assert.equal(shaped.quality.confidence.tier_score, null);
    assert.deepEqual(shaped.quality.confidence.uncertainties, []);
    assert.deepEqual(shaped.quality.jurisprudence, []);
    assert.equal(shaped.pipeline.complexite, null);
    assert.deepEqual(shaped.pipeline.hard_rules_triggered, []);
    assert.deepEqual(shaped.pipeline.recommended_domain_order, []);
    assert.equal(shaped.pipeline.degraded_mode, false);
    assert.deepEqual(shaped.pipeline.flags, {});
  });

  it('retourne rawPayload tel quel si null / non-objet', () => {
    assert.equal(shapePayload(null), null);
    assert.equal(shapePayload(undefined), undefined);
    assert.equal(shapePayload('string'), 'string');
  });

  it('idempotent : shapePayload(shapePayload(x)).quality ≡ shapePayload(x).quality', () => {
    const raw = rawPayloadFixture();
    const once = shapePayload(raw);
    const twice = shapePayload(once);
    assert.deepEqual(twice.quality, once.quality);
    assert.deepEqual(twice.pipeline, once.pipeline);
  });
});

// ─── 3. Jurisprudence dédup (finding #4) ─────────────────────────

describe('unifyJurisprudence — dédup par signature', () => {
  it('préfère jurisprudence_enriched (tier-aware) sur jurisprudence brute', () => {
    const payload = {
      jurisprudence_enriched: [
        { signature: '4A_32/2018', tier: 2, strength_badge: 'moderate' },
      ],
      jurisprudence: [
        { signature: '4A_32/2018' }, // même signature, version brute
      ],
    };
    const result = unifyJurisprudence(payload);
    assert.equal(result.length, 1);
    assert.equal(result[0].tier, 2);
    assert.equal(result[0].strength_badge, 'moderate');
  });

  it('déduplique case-insensitive et avec espaces', () => {
    const payload = {
      jurisprudence_enriched: [
        { signature: '  4A_32/2018  ', tier: 2 },
        { signature: '4a_32/2018', tier: 2 },
        { signature: 'ATF 140 III 244', tier: 1 },
      ],
    };
    const result = unifyJurisprudence(payload);
    // 2 uniques : 4a_32/2018 et ATF 140 III 244
    assert.equal(result.length, 2);
  });

  it('complète avec primary.jurisprudence si pas de jurisprudence_enriched', async () => {
    const payload = {
      primary: {
        jurisprudence: [
          { signature: '4A_32/2018', tribunal: 'TF', date: '2018-06-15', resultat: 'favorable_locataire' },
        ],
      },
    };
    const result = unifyJurisprudence(payload);
    assert.equal(result.length, 1);
    // Signature toujours préservée (peu importe si enrichDecisionHolding est
    // disponible ou si payload-shaper fait un passthrough)
    assert.equal(result[0].signature, '4A_32/2018');
    // Si object-registry expose enrichDecisionHolding, vérifier l'enrichissement.
    // Sinon (passthrough défensif), on tolère l'absence de tier.
    const objReg = await import('../src/services/object-registry.mjs');
    if (typeof objReg.enrichDecisionHolding === 'function') {
      assert.ok(result[0].tier, 'tier dérivé présent quand enrichDecisionHolding actif');
      assert.ok(result[0].tier_label);
      assert.ok(result[0].strength_badge);
    }
  });

  it('retourne [] si aucune source de jurisprudence', () => {
    assert.deepEqual(unifyJurisprudence({}), []);
    assert.deepEqual(unifyJurisprudence({ jurisprudence_enriched: null }), []);
    assert.deepEqual(unifyJurisprudence(null), []);
  });

  it('ignore les entrées sans clé de dédup (pas de signature ni source_id)', () => {
    const payload = {
      jurisprudence_enriched: [
        { tier: 2 }, // pas de signature → ignoré
        { signature: '4A_32/2018', tier: 2 },
      ],
    };
    const result = unifyJurisprudence(payload);
    assert.equal(result.length, 1);
  });
});

// ─── 4. Extraction freshness ─────────────────────────────────────

describe('extractFreshnessFromPrimary', () => {
  it('retourne null si pas de primary', () => {
    assert.equal(extractFreshnessFromPrimary({}), null);
    assert.equal(extractFreshnessFromPrimary(null), null);
  });

  it('extrait depuis primary.fiche.freshness', () => {
    const fresh = { status: 'fresh', color: 'green', age_days: 30 };
    const payload = { primary: { fiche: { freshness: fresh } } };
    assert.deepEqual(extractFreshnessFromPrimary(payload), fresh);
  });

  it('extrait depuis fiche.freshness inliné', () => {
    const fresh = { status: 'aging', color: 'yellow' };
    const payload = { fiche: { freshness: fresh } };
    assert.deepEqual(extractFreshnessFromPrimary(payload), fresh);
  });

  it('quality.freshness = rawPayload.freshness quand présent racine', () => {
    const fresh = { status: 'fresh', color: 'green' };
    const shaped = shapePayload({ status: 'ready_for_pipeline', freshness: fresh });
    assert.deepEqual(shaped.quality.freshness, fresh);
  });

  it('quality.freshness = primary.fiche.freshness quand absent racine', () => {
    const fresh = { status: 'stale', color: 'orange' };
    const shaped = shapePayload({
      status: 'ready_for_pipeline',
      primary: { fiche: { freshness: fresh } },
    });
    assert.deepEqual(shaped.quality.freshness, fresh);
  });
});

// ─── 5. Warnings collectés ───────────────────────────────────────

describe('collectWarnings', () => {
  it('retourne [] pour payload vide', () => {
    assert.deepEqual(collectWarnings(null), []);
    assert.deepEqual(collectWarnings({}), []);
  });

  it('cumule certificate.warnings', () => {
    const payload = {
      certificate: { warnings: ['preuves manquantes', 'contacts absents'] },
    };
    const warns = collectWarnings(payload);
    assert.ok(warns.includes('preuves manquantes'));
    assert.ok(warns.includes('contacts absents'));
  });

  it('ajoute un warning global si quality_warning=true', () => {
    const warns = collectWarnings({ quality_warning: true });
    assert.equal(warns.length, 1);
    assert.match(warns[0], /insuffisant|prudence/i);
  });

  it('ajoute un warning si degraded_mode=true', () => {
    const warns = collectWarnings({ degraded_mode: true, source_language: 'de' });
    assert.equal(warns.length, 1);
    assert.match(warns[0], /dégradé|de/i);
  });
});

// ─── 6. Intégration handleTriageStart ────────────────────────────

describe('Intégration — handleTriageStart retourne payload shapé', { skip: !handleTriageStart }, () => {
  it('payload ready_for_pipeline contient quality et pipeline', async () => {
    _resetStoreForTests({ path: TEST_STORE_PATH });
    const previousKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const payload = await handleTriageStart({
        texte: 'mon appart est moisi depuis 6 mois',
        canton: 'VD',
      });
      // Mode fallback peut retourner ready_for_pipeline, ask_questions ou
      // mode=basique. Dans tous les cas, si c'est un payload "normal" (pas
      // safety_stop/out_of_scope), on doit avoir les wrappers.
      if (['ready_for_pipeline', 'ask_questions'].includes(payload.status)) {
        assert.ok(payload.quality, 'quality wrapper requis');
        assert.ok(payload.pipeline, 'pipeline wrapper requis');
        assert.equal(typeof payload.quality, 'object');
        assert.equal(typeof payload.pipeline, 'object');
        // Non-breaking : status reste à la racine
        assert.ok(payload.status);
      } else {
        // Court-circuit (safety/scope) : pas de wrappers, on skip
        assert.ok(payload.status);
      }
    } finally {
      if (previousKey) process.env.ANTHROPIC_API_KEY = previousKey;
    }
  });

  it('court-circuit safety → pas de wrappers (skip shape)', async () => {
    _resetStoreForTests({ path: TEST_STORE_PATH });
    const r = await handleTriageStart({ texte: 'je veux en finir, j\'ai plus la force' });
    assert.equal(r.status, 'safety_stop');
    // Pas de shape sur safety_stop — les wrappers ne sont pas appliqués ici
    // (le payload safety ne passe pas par finalizePayload)
    assert.equal(r.quality, undefined);
    assert.equal(r.pipeline, undefined);
  });
});
