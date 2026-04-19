import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { recommendDomainOrder } from '../src/services/domain-recommender.mjs';
import { buildUrgencyMarker } from '../src/services/urgency-marker.mjs';
import { enrichTriageResult } from '../src/services/triage-enrichment.mjs';
import { TIERS } from '../src/services/complexity-router.mjs';

// ============================================================
// domain-recommender
// ============================================================

describe('domain-recommender', () => {
  it('un seul domaine = une seule reco', () => {
    const recos = recommendDomainOrder([
      { fiche: { domaine: 'bail' }, delais: [{ delai: '30 jours' }] }
    ]);
    assert.equal(recos.length, 1);
    assert.equal(recos[0].domaine, 'bail');
  });

  it('délai critique monte la priorité', () => {
    const recos = recommendDomainOrder([
      { fiche: { domaine: 'bail' }, delais: [{ delai: '60 jours' }] },
      { fiche: { domaine: 'travail' }, delais: [{ delai: '3 jours' }] }
    ]);
    assert.equal(recos[0].domaine, 'travail');
    assert.ok(recos[0].reasons.some(r => r.includes('critique')));
    assert.ok(recos[0].priority_score > recos[1].priority_score);
  });

  it('cascades effet domino ajoutent au score', () => {
    const recos = recommendDomainOrder([
      {
        fiche: { domaine: 'bail' },
        delais: [{ delai: '14 jours' }],
        cascades: [{ etapes: [{ delai: '14 jours' }, { delai: '30 jours' }, { delai: '60 jours' }] }]
      },
      { fiche: { domaine: 'travail' }, delais: [{ delai: '14 jours' }] }
    ]);
    assert.equal(recos[0].domaine, 'bail');
    assert.ok(recos[0].reasons.some(r => r.includes('cascade')));
  });

  it('confiance incertaine pénalise', () => {
    const recos = recommendDomainOrder([
      { fiche: { domaine: 'bail' }, confiance: 'incertain', delais: [{ delai: '30 jours' }] },
      { fiche: { domaine: 'travail' }, confiance: 'certain', delais: [{ delai: '30 jours' }] }
    ]);
    assert.equal(recos[0].domaine, 'travail');
  });

  it('enjeu financier direct détecté bail/dettes/travail avec délai court', () => {
    const recos = recommendDomainOrder([
      { fiche: { domaine: 'bail' }, delais: [{ delai: '14 jours' }] },
      { fiche: { domaine: 'assurances' }, delais: [{ delai: '14 jours' }] }
    ]);
    assert.equal(recos[0].domaine, 'bail');
    assert.ok(recos[0].reasons.some(r => r.includes('financier')));
  });
});

// ============================================================
// urgency-marker
// ============================================================

describe('urgency-marker', () => {
  it('délai null = pas de marqueur', () => {
    assert.equal(buildUrgencyMarker({ delaiJours: null }), null);
  });

  it('délai ≤ 3 = critical / red', () => {
    const m = buildUrgencyMarker({ delaiJours: 3, procedure: 'Contestation résiliation' });
    assert.equal(m.level, 'critical');
    assert.equal(m.color, 'red');
    assert.match(m.action_hint, /immédiatement/);
  });

  it('délai ≤ 14 = high / orange', () => {
    const m = buildUrgencyMarker({ delaiJours: 14 });
    assert.equal(m.level, 'high');
    assert.equal(m.color, 'orange');
  });

  it('délai ≤ 30 = moderate / yellow', () => {
    const m = buildUrgencyMarker({ delaiJours: 30 });
    assert.equal(m.level, 'moderate');
    assert.equal(m.color, 'yellow');
  });

  it('délai > 30 = normal / gray', () => {
    const m = buildUrgencyMarker({ delaiJours: 90 });
    assert.equal(m.level, 'normal');
    assert.equal(m.color, 'gray');
    assert.equal(m.action_hint, null);
  });

  it('accord singulier/pluriel pour "1 jour"', () => {
    const m = buildUrgencyMarker({ delaiJours: 1 });
    assert.match(m.action_hint, /1 jour /); // pas "jours"
  });
});

// ============================================================
// triage-enrichment (intégration)
// ============================================================

describe('triage-enrichment — sortie API', () => {
  it('retourne tier, dimensions, flags, recommended_domain_order, urgency_marker', () => {
    const out = enrichTriageResult({
      navigation: { resume_situation: 'moisissure', infos_extraites: { canton: 'VD', date: '2024-01', domaine: 'bail' } },
      enrichedAll: [{ fiche: { domaine: 'bail' }, confiance: 'probable', delais: [{ delai: '14 jours' }] }],
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'probable', delais: [{ delai: '14 jours' }] }
    });
    assert.ok(out.tier);
    assert.ok(out.dimensions_detail);
    assert.ok(out.flags);
    assert.ok(out.uncertainties !== undefined);
    assert.ok(Array.isArray(out.recommended_domain_order));
    assert.ok(out.urgency_marker);
    assert.ok(out._eval_snapshot);
  });

  it('cas hors scope : tier limite + flag hors_scope', () => {
    const out = enrichTriageResult({
      navigation: { infos_extraites: {} },
      enrichedPrimary: { fiche: { domaine: 'successions' }, confiance: 'certain' },
      enrichedAll: [{ fiche: { domaine: 'successions' } }]
    });
    assert.equal(out.flags.hors_scope, true);
    assert.ok([TIERS.LIMITE, TIERS.HUMAIN].includes(out.tier));
  });

  it('cas urgent : flag urgent + urgency_marker critical', () => {
    const out = enrichTriageResult({
      navigation: { infos_extraites: { canton: 'VD' } },
      enrichedPrimary: {
        fiche: { domaine: 'bail' },
        confiance: 'probable',
        delais: [{ delai: '2 jours', procedure: 'Opposition' }]
      },
      enrichedAll: [{ fiche: { domaine: 'bail' }, delais: [{ delai: '2 jours' }] }]
    });
    assert.equal(out.flags.urgent, true);
    assert.equal(out.urgency_marker.level, 'critical');
  });

  it('cas tier humain : flag humain_requis', () => {
    const out = enrichTriageResult({
      navigation: { infos_extraites: {} },
      enrichedPrimary: { fiche: { domaine: 'travail' } },
      enrichedAll: [{ fiche: { domaine: 'travail' } }],
      facts: { recours_tf: true }
    });
    assert.equal(out.flags.humain_requis, true);
    assert.equal(out.tier, TIERS.HUMAIN);
  });

  it('previousEval passé : delta calculé', () => {
    const out = enrichTriageResult({
      navigation: { infos_extraites: { canton: 'VD' } },
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'probable' },
      enrichedAll: [{ fiche: { domaine: 'bail' } }],
      previousEval: { tier: TIERS.STANDARD, score: 20 }
    });
    assert.ok(out._eval_snapshot.delta != null);
  });

  it('multi-domaines : recommended_domain_order non vide et trié par priority_score', () => {
    const out = enrichTriageResult({
      navigation: { infos_extraites: { canton: 'VD' } },
      enrichedAll: [
        { fiche: { domaine: 'bail' }, delais: [{ delai: '30 jours' }] },
        { fiche: { domaine: 'travail' }, delais: [{ delai: '7 jours' }] },
        { fiche: { domaine: 'dettes' }, delais: [{ delai: '20 jours' }] }
      ],
      enrichedPrimary: { fiche: { domaine: 'bail' }, confiance: 'probable' }
    });
    assert.equal(out.recommended_domain_order.length, 3);
    // Trié décroissant par priority_score
    for (let i = 1; i < out.recommended_domain_order.length; i++) {
      assert.ok(out.recommended_domain_order[i - 1].priority_score >= out.recommended_domain_order[i].priority_score);
    }
  });
});
