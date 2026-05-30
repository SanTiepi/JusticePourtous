/**
 * Tests directs pour triage-enrichment.mjs (enrichTriageResult + extractFactsFromNav)
 * et urgency-marker.mjs (cas non couverts par phase3-enrichment.test.mjs).
 *
 * Compléments ciblés : phase3-enrichment.test.mjs couvre 6 happy-paths via
 * enrichTriageResult et 6 cas urgency-marker. Ce fichier couvre les branches
 * manquantes (entrées dégénérées, shape champs, extractFactsFromNav, urgency-marker
 * sans/avec procédure, pluriel/singulier).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { enrichTriageResult } from '../src/services/triage-enrichment.mjs';
import { buildUrgencyMarker } from '../src/services/urgency-marker.mjs';
import { TIERS } from '../src/services/complexity-router.mjs';

// =============================================================
// enrichTriageResult — entrées dégénérées
// =============================================================

describe('enrichTriageResult — entrées dégénérées', () => {
  it('sans arguments → ne crashe pas et retourne les champs obligatoires', () => {
    let out;
    assert.doesNotThrow(() => { out = enrichTriageResult(); });
    assert.ok(typeof out.tier === 'string');
    assert.ok(Array.isArray(out.recommended_domain_order));
    assert.ok(Array.isArray(out.flags ? [] : [])); // flags existe
    assert.ok(out._eval_snapshot !== undefined);
  });

  it('navigation vide + enrichedAll vide → recommended_domain_order = []', () => {
    const out = enrichTriageResult({ navigation: {}, enrichedAll: [], enrichedPrimary: null });
    assert.deepEqual(out.recommended_domain_order, []);
  });

  it('enrichedPrimary avec delais vide + pas de delai_jours dans nav → urgency_marker null', () => {
    const out = enrichTriageResult({
      navigation: { infos_extraites: { canton: 'VD' } },
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'probable', delais: [], cascades: [] },
      enrichedAll: []
    });
    assert.equal(out.urgency_marker, null);
  });

  it('enrichedPrimary null → ne crashe pas', () => {
    assert.doesNotThrow(() => {
      enrichTriageResult({
        navigation: { infos_extraites: {} },
        enrichedPrimary: null,
        enrichedAll: []
      });
    });
  });
});

// =============================================================
// enrichTriageResult — shape de sortie complète
// =============================================================

describe('enrichTriageResult — shape de sortie', () => {
  const baseInput = {
    navigation: { infos_extraites: { canton: 'VD', domaine: 'bail' } },
    enrichedPrimary: {
      fiche: { domaine: 'bail' },
      confiance: 'probable',
      delais: [{ delai: '14 jours', procedure: 'Contestation résiliation' }]
    },
    enrichedAll: [{ fiche: { domaine: 'bail' }, delais: [{ delai: '14 jours' }] }]
  };

  it('tier_score et tier_max sont des nombres positifs', () => {
    const out = enrichTriageResult(baseInput);
    assert.equal(typeof out.tier_score, 'number');
    assert.equal(typeof out.tier_max, 'number');
    assert.ok(out.tier_score >= 0);
    assert.ok(out.tier_max > 0);
  });

  it('hard_rules_triggered est un tableau', () => {
    const out = enrichTriageResult(baseInput);
    assert.ok(Array.isArray(out.hard_rules_triggered));
  });

  it('_eval_snapshot contient tier, score, delta, delta_pct', () => {
    const out = enrichTriageResult(baseInput);
    assert.ok('tier' in out._eval_snapshot, '_eval_snapshot.tier manquant');
    assert.ok('score' in out._eval_snapshot, '_eval_snapshot.score manquant');
    assert.ok('delta' in out._eval_snapshot, '_eval_snapshot.delta manquant');
    assert.ok('delta_pct' in out._eval_snapshot, '_eval_snapshot.delta_pct manquant');
  });

  it('urgency_marker utilise la procedure de enrichedPrimary.delais[0]', () => {
    const out = enrichTriageResult({
      navigation: { infos_extraites: { canton: 'VD' } },
      enrichedPrimary: {
        fiche: { domaine: 'bail' },
        confiance: 'probable',
        delais: [{ delai: '2 jours', procedure: 'Opposition urgente' }]
      },
      enrichedAll: [{ fiche: { domaine: 'bail' }, delais: [{ delai: '2 jours' }] }]
    });
    assert.ok(out.urgency_marker !== null, 'urgency_marker attendu non null');
    assert.equal(out.urgency_marker.level, 'critical');
    assert.match(out.urgency_marker.action_hint, /Opposition urgente/);
  });

  it('uncertainties est un tableau', () => {
    const out = enrichTriageResult(baseInput);
    assert.ok(Array.isArray(out.uncertainties));
  });

  it('dimensions_detail contient urgency, clarity, stakes, adversary', () => {
    const out = enrichTriageResult(baseInput);
    assert.ok(out.dimensions_detail, 'dimensions_detail absent');
    assert.ok('urgency' in out.dimensions_detail, 'dimension urgency absente');
    assert.ok('clarity' in out.dimensions_detail, 'dimension clarity absente');
    assert.ok('stakes' in out.dimensions_detail, 'dimension stakes absente');
    assert.ok('adversary' in out.dimensions_detail, 'dimension adversary absente');
  });
});

// =============================================================
// enrichTriageResult — extractFactsFromNav (indirect)
// =============================================================

describe('enrichTriageResult — extractFactsFromNav via facts=null', () => {
  it('facts=null → extrait infos_extraites de la navigation sans crash', () => {
    let out;
    assert.doesNotThrow(() => {
      out = enrichTriageResult({
        navigation: {
          infos_extraites: {
            canton: 'ZH',
            domaine: 'travail',
            montant_chf: 8000,
            adversaire: 'état',
            delai_jours: 10
          }
        },
        enrichedPrimary: { fiche: { domaine: 'travail' }, confiance: 'probable' },
        enrichedAll: [{ fiche: { domaine: 'travail' } }],
        facts: null
      });
    });
    assert.ok(typeof out.tier === 'string');
  });

  it('navigation sans infos_extraites → extractFactsFromNav retourne des nulls (pas de crash)', () => {
    assert.doesNotThrow(() => {
      enrichTriageResult({
        navigation: {},
        enrichedPrimary: { fiche: { domaine: 'bail' } },
        enrichedAll: [],
        facts: null
      });
    });
  });

  it('facts explicites avec recours_tf=true → tier HUMAIN (override nav)', () => {
    const out = enrichTriageResult({
      navigation: { infos_extraites: { canton: 'GE', domaine: 'bail' } },
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'probable' },
      enrichedAll: [{ fiche: { domaine: 'bail' } }],
      facts: { recours_tf: true }
    });
    assert.equal(out.tier, TIERS.HUMAIN);
    assert.equal(out.flags.humain_requis, true);
  });

  it('montant_chf dans infos_extraites influence dimensions.stakes', () => {
    const outAvec = enrichTriageResult({
      navigation: { infos_extraites: { montant_chf: 60000 } },
      enrichedPrimary: { fiche: { domaine: 'bail' } },
      enrichedAll: [],
      facts: null
    });
    const outSans = enrichTriageResult({
      navigation: { infos_extraites: {} },
      enrichedPrimary: { fiche: { domaine: 'bail' } },
      enrichedAll: [],
      facts: null
    });
    assert.ok(
      outAvec.dimensions_detail.stakes.score >= outSans.dimensions_detail.stakes.score,
      'montant élevé devrait augmenter le score stakes'
    );
  });
});

// =============================================================
// buildUrgencyMarker — cas manquants
// =============================================================

describe('buildUrgencyMarker — cas non couverts', () => {
  it('sans propriété delaiJours (objet vide) → null', () => {
    const m = buildUrgencyMarker({});
    assert.equal(m, null);
  });

  it('niveau high sans procedure → action_hint contient "jours pour agir"', () => {
    const m = buildUrgencyMarker({ delaiJours: 7 });
    assert.equal(m.level, 'high');
    assert.equal(m.color, 'orange');
    assert.match(m.action_hint, /7 jours pour agir/);
    assert.ok(!m.action_hint.includes(':'), 'pas de procedure donc pas de deux-points');
  });

  it('niveau high avec procedure → action_hint contient la procedure', () => {
    const m = buildUrgencyMarker({ delaiJours: 10, procedure: 'Mise en demeure' });
    assert.equal(m.level, 'high');
    assert.match(m.action_hint, /Mise en demeure/);
    assert.match(m.action_hint, /10 jours/);
  });

  it('niveau moderate sans procedure → action_hint contient "jours"', () => {
    const m = buildUrgencyMarker({ delaiJours: 20 });
    assert.equal(m.level, 'moderate');
    assert.equal(m.color, 'yellow');
    assert.match(m.action_hint, /20 jours/);
  });

  it('niveau moderate avec procedure → action_hint contient procedure et jours', () => {
    const m = buildUrgencyMarker({ delaiJours: 25, procedure: 'Médiation obligatoire' });
    assert.equal(m.level, 'moderate');
    assert.match(m.action_hint, /Médiation obligatoire/);
    assert.match(m.action_hint, /25 jours/);
  });

  it('niveau critical sans procedure → action_hint contient "agir immédiatement" sans label', () => {
    const m = buildUrgencyMarker({ delaiJours: 3 });
    assert.equal(m.level, 'critical');
    assert.equal(m.color, 'red');
    assert.match(m.action_hint, /3 jours avant échéance — agir immédiatement/);
  });

  it('délai = 2 → pluriel "jours" (complement test singulier)', () => {
    const m = buildUrgencyMarker({ delaiJours: 2 });
    assert.equal(m.level, 'critical');
    assert.match(m.action_hint, /2 jours/);
    assert.ok(!m.action_hint.includes('2 jour '), 'pluriel attendu pour delaiJours=2');
  });

  it('délai = 31 → niveau normal, action_hint = null', () => {
    const m = buildUrgencyMarker({ delaiJours: 31 });
    assert.equal(m.level, 'normal');
    assert.equal(m.color, 'gray');
    assert.equal(m.action_hint, null);
    assert.equal(m.label, 'Pas de délai imminent');
  });

  it('délai = 4 → high (juste au-dessus de critical ≤3)', () => {
    const m = buildUrgencyMarker({ delaiJours: 4 });
    assert.equal(m.level, 'high');
  });
});
