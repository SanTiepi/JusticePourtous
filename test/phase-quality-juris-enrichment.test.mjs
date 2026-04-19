/**
 * Phase Quality — Jurisprudence enrichment tests
 *
 * Couvre :
 *   - deriveTier / deriveTierLabel
 *   - normalizeDate / buildDateDisplay / yearsAgo
 *   - computeStrength (strong / moderate / weak)
 *   - enrichDecisionHolding (fusion complète + valeurs par défaut)
 *   - certifyIssue / juris_tier_adequacy check (downgrade à 'limited')
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  enrichDecisionHolding,
  deriveTier,
  deriveTierLabel,
  normalizeDate,
  buildDateDisplay,
  formatDateDisplay,
  yearsAgo,
  computeStrength,
} from '../src/services/object-registry.mjs';
import { certifyIssue } from '../src/services/coverage-certificate.mjs';

// Un "now" fixe pour reproductibilité (2026-04-18, date du jour projet)
const NOW = new Date('2026-04-18T00:00:00Z');

describe('enrichDecisionHolding — tier derivation', () => {
  it('tier 1 : ATF in signature', () => {
    const e = enrichDecisionHolding({ signature: 'ATF 140 III 244', tribunal: 'TF', date: '2020-06-15' });
    assert.equal(e.tier, 1);
    assert.equal(e.tier_label, '1 - Tribunal Fédéral publié (ATF)');
  });

  it('tier 1 : TF publie=true sans ATF prefix', () => {
    const t = deriveTier('4A_32/2018', 'TF', true);
    assert.equal(t, 1);
  });

  it('tier 2 : TF dossier-style signature non publié (4A_/5A_/6B_)', () => {
    const e = enrichDecisionHolding({ signature: '4A_32/2018', tribunal: 'TF', date: '2020-05-15' });
    assert.equal(e.tier, 2);
    assert.equal(e.tier_label, '2 - Tribunal Fédéral arrêt');
  });

  it('tier 3 : tribunal cantonal / inconnu', () => {
    const e = enrichDecisionHolding({ signature: 'CACI.2020.12', tribunal: 'CACI-VD', date: '2020-05-15' });
    assert.equal(e.tier, 3);
    assert.equal(e.tier_label, '3 - Cantonal ou inférieur');
  });
});

describe('enrichDecisionHolding — age + strength', () => {
  it('strength strong : tier 1 & age < 10y', () => {
    const e = enrichDecisionHolding({
      signature: 'ATF 140 III 244', tribunal: 'TF', date: '2020-06-15'
    });
    const age = yearsAgo('2020-06-15', NOW);
    assert.ok(age < 10, `age=${age}`);
    // computeStrength on tier 1 + <10y → 'strong'
    assert.equal(computeStrength(1, age), 'strong');
  });

  it('strength moderate : tier 1 & age >= 10y', () => {
    assert.equal(computeStrength(1, 12), 'moderate');
  });

  it('strength weak : age >= 20y régardless of tier', () => {
    assert.equal(computeStrength(1, 21), 'weak');
    assert.equal(computeStrength(2, 25), 'weak');
  });

  it('strength moderate : tier 3 par défaut (age <= 10y)', () => {
    assert.equal(computeStrength(3, 5), 'moderate');
  });

  it('strength weak : tier 3 & age > 10y', () => {
    assert.equal(computeStrength(3, 11), 'weak');
  });
});

describe('enrichDecisionHolding — inference without date', () => {
  it('arret sans date : age_years null, date_iso null, tier OK', () => {
    const e = enrichDecisionHolding({ signature: '4A_32/2018', tribunal: 'TF' });
    assert.equal(e.tier, 2);
    assert.equal(e.date_iso, null);
    assert.equal(e.age_years, null);
    assert.equal(e.date_display, null);
    // strength_badge doit rester calculable (age inconnu → traité comme 0)
    assert.ok(['strong', 'moderate', 'weak'].includes(e.strength_badge));
  });

  it('scope_territorial CH par défaut pour TF', () => {
    const e = enrichDecisionHolding({ signature: '4A_32/2018', tribunal: 'TF' });
    assert.equal(e.scope_territorial, 'CH');
  });
});

describe('normalizeDate + buildDateDisplay', () => {
  it('gère "2020-06-15" (ISO)', () => {
    assert.equal(normalizeDate('2020-06-15'), '2020-06-15');
    const disp = buildDateDisplay('2020-06-15', NOW);
    assert.match(disp, /^2020-06-15 \(il y a \d+ ans?\)$/);
  });

  it('gère "15.06.2020" (DD.MM.YYYY)', () => {
    assert.equal(normalizeDate('15.06.2020'), '2020-06-15');
    const disp = formatDateDisplay('15.06.2020', NOW);
    assert.match(disp, /^2020-06-15 \(il y a \d+ ans?\)$/);
  });

  it('retourne null pour null / invalide', () => {
    assert.equal(normalizeDate(null), null);
    assert.equal(normalizeDate(''), null);
    assert.equal(normalizeDate('xx/yy/zz'), null);
    assert.equal(buildDateDisplay(null), null);
    assert.equal(buildDateDisplay('xx-yy-zz'), null);
  });
});

describe('coverage-certificate — juris_tier_adequacy', () => {
  const baseIssue = {
    issue_id: 'test',
    qualification: 'test',
    domaine: 'bail',
    articles: [{ ref: 'CO 259a', source_id: 'fedlex:rs220:co-259a' }],
    delais: [{ procedure: 'test', delai: '30j' }],
    preuves: [{}], anti_erreurs: [{}], patterns: [{}], contacts: [{}],
  };

  it('passe si ≥1 arret tier<=2', () => {
    const issue = {
      ...baseIssue,
      arrets: [
        { role: 'favorable', resultat: 'favorable_locataire', source_id: 'juris:tf:a', tier: 1 },
        { role: 'defavorable', resultat: 'favorable_bailleur', source_id: 'juris:tf:b', tier: 3 },
      ],
    };
    const cert = certifyIssue(issue);
    const tierCheck = cert.checks.find(c => c.id === 'juris_tier_adequacy');
    assert.ok(tierCheck);
    assert.equal(tierCheck.passed, true);
    assert.equal(cert.status, 'sufficient');
  });

  it('échoue si uniquement tier 3 → status downgrade à "limited"', () => {
    const issue = {
      ...baseIssue,
      arrets: [
        { role: 'favorable', resultat: 'favorable_locataire', source_id: 'juris:ca:a', tier: 3 },
        { role: 'defavorable', resultat: 'favorable_bailleur', source_id: 'juris:ca:b', tier: 3 },
      ],
    };
    const cert = certifyIssue(issue);
    const tierCheck = cert.checks.find(c => c.id === 'juris_tier_adequacy');
    assert.equal(tierCheck.passed, false);
    // Status doit être limited, PAS insufficient
    assert.equal(cert.status, 'limited', `Expected limited, got ${cert.status}`);
    assert.ok(cert.limited_fails.includes('juris_tier_adequacy'));
  });

  it('neutre si 0 arret (pas de pénalité)', () => {
    const issue = { ...baseIssue, arrets: [] };
    const cert = certifyIssue(issue);
    const tierCheck = cert.checks.find(c => c.id === 'juris_tier_adequacy');
    assert.equal(tierCheck.passed, true);
    // L'absence d'arret ne pénalise PAS ce check (contradictoire le fera, lui)
  });
});
