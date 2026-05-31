/**
 * Tests unitaires — analytics.mjs
 *
 * Module in-memory (compteurs de pages vues, recherches, langues).
 * Aucun LLM, aucun réseau, aucun appel serveur.
 * _resetForTests() isole chaque suite pour éviter la pollution d'état.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  trackPageView,
  trackSearch,
  trackPremiumAnalysis,
  trackLanguage,
  trackEvent,
  getFunnelMetrics,
  recordClaimbackAmount,
  getStats,
  _resetForTests,
} from '../src/services/analytics.mjs';

// ============================================================
// trackPageView
// ============================================================

describe('trackPageView', () => {
  beforeEach(() => _resetForTests());

  it('incrémente le compteur pour un path valide', () => {
    trackPageView('/api/search');
    assert.equal(getStats().pageViews['/api/search'], 1);
  });

  it('incrémente à nouveau pour le même path', () => {
    trackPageView('/api/search');
    trackPageView('/api/search');
    assert.equal(getStats().pageViews['/api/search'], 2);
  });

  it('null/undefined/vide → no-op (pas de crash, pageViews reste vide)', () => {
    assert.doesNotThrow(() => trackPageView(null));
    assert.doesNotThrow(() => trackPageView(undefined));
    assert.doesNotThrow(() => trackPageView(''));
    assert.deepEqual(getStats().pageViews, {});
  });

  it('multiple paths distincts trackés indépendamment', () => {
    trackPageView('/a');
    trackPageView('/b');
    trackPageView('/a');
    const s = getStats();
    assert.equal(s.pageViews['/a'], 2);
    assert.equal(s.pageViews['/b'], 1);
  });
});

// ============================================================
// trackSearch
// ============================================================

describe('trackSearch', () => {
  beforeEach(() => _resetForTests());

  it('démarre à 0 après reset', () => {
    assert.equal(getStats().searchCount, 0);
  });

  it('incrémente searchCount à chaque appel', () => {
    trackSearch();
    assert.equal(getStats().searchCount, 1);
    trackSearch();
    assert.equal(getStats().searchCount, 2);
  });
});

// ============================================================
// trackPremiumAnalysis
// ============================================================

describe('trackPremiumAnalysis', () => {
  beforeEach(() => _resetForTests());

  it('démarre à 0 après reset', () => {
    assert.equal(getStats().premiumAnalysisCount, 0);
  });

  it('incrémente premiumAnalysisCount', () => {
    trackPremiumAnalysis();
    assert.equal(getStats().premiumAnalysisCount, 1);
    trackPremiumAnalysis();
    assert.equal(getStats().premiumAnalysisCount, 2);
  });
});

// ============================================================
// trackLanguage
// ============================================================

describe('trackLanguage', () => {
  beforeEach(() => _resetForTests());

  it('track une langue valide', () => {
    trackLanguage('fr');
    assert.equal(getStats().languages['fr'], 1);
  });

  it('normalise en minuscules', () => {
    trackLanguage('FR');
    assert.equal(getStats().languages['fr'], 1);
  });

  it('tronque à 10 caractères max', () => {
    trackLanguage('fr-CH-extended-extra');
    const keys = Object.keys(getStats().languages);
    assert.equal(keys.length, 1);
    assert.ok(keys[0].length <= 10);
  });

  it('null/vide → no-op (languages reste vide)', () => {
    assert.doesNotThrow(() => trackLanguage(null));
    assert.doesNotThrow(() => trackLanguage(''));
    assert.deepEqual(getStats().languages, {});
  });

  it('incrémente le même code plusieurs fois', () => {
    trackLanguage('de');
    trackLanguage('de');
    assert.equal(getStats().languages['de'], 2);
  });

  it('plusieurs langues coexistent', () => {
    trackLanguage('fr');
    trackLanguage('de');
    trackLanguage('it');
    trackLanguage('fr');
    const s = getStats();
    assert.equal(s.languages['fr'], 2);
    assert.equal(s.languages['de'], 1);
    assert.equal(s.languages['it'], 1);
  });
});

// ============================================================
// getStats
// ============================================================

describe('getStats', () => {
  beforeEach(() => _resetForTests());

  it('retourne un objet avec tous les champs attendus', () => {
    const s = getStats();
    assert.equal(typeof s.pageViews, 'object');
    assert.equal(typeof s.searchCount, 'number');
    assert.equal(typeof s.premiumAnalysisCount, 'number');
    assert.equal(typeof s.languages, 'object');
    assert.ok('lastFlush' in s);
    assert.equal(typeof s.startedAt, 'string');
    assert.equal(typeof s._snapshotAt, 'string');
  });

  it('_snapshotAt est une ISO string proche de now', () => {
    const before = Date.now();
    const s = getStats();
    const after = Date.now();
    const t = new Date(s._snapshotAt).getTime();
    assert.ok(t >= before && t <= after, `_snapshotAt ${s._snapshotAt} hors fenêtre`);
  });

  it('snapshot reflète l\'état courant — round-trip track + getStats', () => {
    trackPageView('/guide/bail');
    trackSearch();
    trackLanguage('it');
    const s = getStats();
    assert.equal(s.pageViews['/guide/bail'], 1);
    assert.equal(s.searchCount, 1);
    assert.equal(s.languages['it'], 1);
  });
});

// ============================================================
// trackEvent / getFunnelMetrics (funnel 2a/2b)
// ============================================================

describe('trackEvent — funnel', () => {
  beforeEach(() => _resetForTests());

  it('incrémente le compteur pour un event de l\'allowlist', () => {
    trackEvent('home_view');
    trackEvent('home_view');
    assert.equal(getStats().funnel['home_view'], 2);
  });

  it('ignore un event hors allowlist (anti-pollution)', () => {
    trackEvent('evil_event', { caseId: 'c1' });
    trackEvent('');
    trackEvent(null);
    assert.equal(getStats().funnel['evil_event'], undefined);
    assert.equal(getFunnelMetrics().cases_tracked, 0);
  });

  it('ne crash pas sans caseId', () => {
    assert.doesNotThrow(() => trackEvent('input_focus'));
    assert.equal(getStats().funnel['input_focus'], 1);
  });

  it('rejette un caseId malformé (pas de tracking de case)', () => {
    trackEvent('triage_submit', { caseId: 'bad id with spaces!' });
    assert.equal(getFunnelMetrics().cases_tracked, 0);
    // le compteur global s\'incrémente quand même
    assert.equal(getStats().funnel['triage_submit'], 1);
  });
});

describe('recordClaimbackAmount — KPI argent surfacé', () => {
  beforeEach(() => _resetForTests());

  it('accumule le montant détecté + compte les bilans avec droit', () => {
    recordClaimbackAmount(24270);
    recordClaimbackAmount(0); // bilan sans droit
    recordClaimbackAmount(7728);
    const c = getStats().claimback;
    assert.equal(c.bilans, 3);
    assert.equal(c.bilans_avec_droit, 2);
    assert.equal(c.total_detected_chf, 24270 + 7728);
  });

  it('ignore les valeurs invalides et borne les aberrations', () => {
    recordClaimbackAmount(-5);
    recordClaimbackAmount('abc');
    recordClaimbackAmount(999999); // borné à 100000
    const c = getStats().claimback;
    assert.equal(c.bilans, 1);
    assert.equal(c.total_detected_chf, 100000);
  });
});

describe('getFunnelMetrics — corrélation submit→render', () => {
  beforeEach(() => _resetForTests());

  it('corrèle submit et result_rendered par case_id', () => {
    trackEvent('triage_submit', { caseId: 'caseA' });
    trackEvent('triage_result_rendered', { caseId: 'caseA' });
    trackEvent('triage_submit', { caseId: 'caseB' }); // soumis mais jamais rendu
    const m = getFunnelMetrics();
    assert.equal(m.triage_submitted, 2);
    assert.equal(m.triage_rendered, 1);
    assert.equal(m.submit_to_render_rate, 0.5);
  });

  it('compte les erreurs sans rendu', () => {
    trackEvent('triage_submit', { caseId: 'caseC' });
    trackEvent('triage_error', { caseId: 'caseC' });
    const m = getFunnelMetrics();
    assert.equal(m.triage_submitted, 1);
    assert.equal(m.triage_rendered, 0);
    assert.equal(m.triage_errored_no_render, 1);
  });

  it('rate null quand aucun submit', () => {
    trackEvent('home_view');
    assert.equal(getFunnelMetrics().submit_to_render_rate, null);
  });

  it('un result_rendered sans case (chemin recherche) n\'affecte pas le taux', () => {
    trackEvent('triage_submit', { caseId: 'caseD' });
    trackEvent('triage_result_rendered', { caseId: 'caseD' });
    trackEvent('triage_result_rendered'); // recherche, pas de case
    const m = getFunnelMetrics();
    assert.equal(m.triage_submitted, 1);
    assert.equal(m.triage_rendered, 1);
    assert.equal(m.submit_to_render_rate, 1);
  });
});
