import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runCommittee, analyzeWithCommittee, ROLES } from '../src/services/committee-engine.mjs';

describe('Committee Engine', () => {

  it('has 4 roles defined', () => {
    assert.equal(Object.keys(ROLES).length, 4);
    assert.ok(ROLES.citizen_counsel);
    assert.ok(ROLES.adverse_counsel);
    assert.ok(ROLES.clerk);
    assert.ok(ROLES.judge);
  });

  it('each role has id, label, mission, system_prompt', () => {
    for (const role of Object.values(ROLES)) {
      assert.ok(role.id);
      assert.ok(role.label);
      assert.ok(role.mission);
      assert.ok(role.system_prompt);
    }
  });

  it('confirmed claims get unanimous confirmed', () => {
    const argResult = {
      verified_claims: [
        { id: 'c1', text: 'Le locataire a droit à la réduction', source_ids: ['s1'], tier: 1 },
      ],
      active_rebuttals: [],
      conflicts: [],
    };
    const certificate = { status: 'sufficient', critical_fails: [] };
    const result = runCommittee(argResult, certificate);

    assert.equal(result.decisions.length, 1);
    assert.equal(result.decisions[0].final_statut, 'confirmed');
    assert.equal(result.decisions[0].unanime, true);
    assert.equal(result.besoin_avocat, false);
  });

  it('conflicted issues produce disagreements + besoin_avocat', () => {
    const argResult = {
      verified_claims: [
        { id: 'c1', text: 'Claim', source_ids: ['s1'], tier: 1 },
      ],
      active_rebuttals: [],
      conflicts: [
        { id: 'x1', text: 'Point disputé', reason: 'mutual_attack_same_tier', recommendation: 'Consulter un pro' },
      ],
    };
    const certificate = { status: 'sufficient' };
    const result = runCommittee(argResult, certificate);

    assert.equal(result.decisions[0].final_statut, 'conflicted');
    assert.equal(result.disagreements.length, 1);
    assert.equal(result.besoin_avocat, true);
    assert.ok(result.besoin_avocat_raison.includes('disputé'));
  });

  it('insufficient certificate makes clerk vote irrecevable', () => {
    const argResult = {
      verified_claims: [
        { id: 'c1', text: 'Claim', source_ids: ['s1'], tier: 1 },
      ],
      active_rebuttals: [],
      conflicts: [],
    };
    const certificate = { status: 'insufficient', critical_fails: ['delai'] };
    const result = runCommittee(argResult, certificate);

    assert.equal(result.decisions[0].votes.clerk, 'irrecevable');
    assert.equal(result.decisions[0].final_statut, 'insufficient');
    assert.equal(result.besoin_avocat, true);
  });

  it('active rebuttals produce limited + warnings', () => {
    const argResult = {
      verified_claims: [
        { id: 'c1', text: 'Claim', source_ids: ['s1'], tier: 1 },
      ],
      active_rebuttals: [
        { id: 'r1', text: 'Counter', source_ids: ['s1'], severity: 'high' },
      ],
      conflicts: [],
    };
    const certificate = { status: 'sufficient' };
    const result = runCommittee(argResult, certificate);

    assert.equal(result.decisions[0].final_statut, 'limited');
    assert.equal(result.warnings.length, 1);
  });

  it('empty argumentation returns empty committee', () => {
    const result = runCommittee({ verified_claims: [], active_rebuttals: [], conflicts: [] }, null);
    assert.equal(result.decisions.length, 0);
    assert.equal(result.summary.total_claims, 0);
  });

  it('summary unanimity_rate is correct', () => {
    const argResult = {
      verified_claims: [
        { id: 'c1', text: 'A', source_ids: ['s1'], tier: 1 },
        { id: 'c2', text: 'B', source_ids: ['s2'], tier: 1 },
      ],
      active_rebuttals: [],
      conflicts: [{ id: 'x1', text: 'Dispute', reason: 'test' }], // makes c1 conflicted
    };
    const cert = { status: 'sufficient' };
    const result = runCommittee(argResult, cert);
    // Both claims have conflicts → both conflicted → 0% unanimity
    assert.equal(result.summary.unanimity_rate, 0);
  });
});
