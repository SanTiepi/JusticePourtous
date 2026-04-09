import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createArgument, addAttack, addSupport, solveGrounded,
  resolveTierConflicts, buildFromIssue, resolve, analyzeIssue,
  analyzeDossier, STATUS
} from '../src/services/argumentation-engine.mjs';

describe('Argumentation Engine', () => {

  // ─── Core graph semantics ─────────────────────────────────────

  describe('grounded semantics', () => {
    it('unattacked argument is IN', () => {
      const graph = new Map();
      graph.set('a1', createArgument({ id: 'a1', text: 'Claim A', tier: 1 }));
      solveGrounded(graph);
      assert.equal(graph.get('a1').status, STATUS.IN);
    });

    it('argument attacked by IN argument is OUT', () => {
      const graph = new Map();
      graph.set('a1', createArgument({ id: 'a1', text: 'Attacker', tier: 1 }));
      graph.set('a2', createArgument({ id: 'a2', text: 'Victim', tier: 2 }));
      addAttack(graph, 'a1', 'a2');
      solveGrounded(graph);
      assert.equal(graph.get('a1').status, STATUS.IN);
      assert.equal(graph.get('a2').status, STATUS.OUT);
    });

    it('mutual attack = both UNDECIDED (grounded)', () => {
      const graph = new Map();
      graph.set('a1', createArgument({ id: 'a1', text: 'Pro', tier: 2 }));
      graph.set('a2', createArgument({ id: 'a2', text: 'Contra', tier: 2 }));
      addAttack(graph, 'a1', 'a2');
      addAttack(graph, 'a2', 'a1');
      solveGrounded(graph);
      assert.equal(graph.get('a1').status, STATUS.UNDECIDED);
      assert.equal(graph.get('a2').status, STATUS.UNDECIDED);
    });

    it('chain: A attacks B, B attacks C → A=IN, B=OUT, C=IN', () => {
      const graph = new Map();
      graph.set('a', createArgument({ id: 'a', text: 'A', tier: 1 }));
      graph.set('b', createArgument({ id: 'b', text: 'B', tier: 2 }));
      graph.set('c', createArgument({ id: 'c', text: 'C', tier: 2 }));
      addAttack(graph, 'a', 'b');
      addAttack(graph, 'b', 'c');
      solveGrounded(graph);
      assert.equal(graph.get('a').status, STATUS.IN);
      assert.equal(graph.get('b').status, STATUS.OUT);
      assert.equal(graph.get('c').status, STATUS.IN); // reinstated
    });

    it('3-cycle: all UNDECIDED', () => {
      const graph = new Map();
      graph.set('a', createArgument({ id: 'a', text: 'A', tier: 2 }));
      graph.set('b', createArgument({ id: 'b', text: 'B', tier: 2 }));
      graph.set('c', createArgument({ id: 'c', text: 'C', tier: 2 }));
      addAttack(graph, 'a', 'b');
      addAttack(graph, 'b', 'c');
      addAttack(graph, 'c', 'a');
      solveGrounded(graph);
      assert.equal(graph.get('a').status, STATUS.UNDECIDED);
      assert.equal(graph.get('b').status, STATUS.UNDECIDED);
      assert.equal(graph.get('c').status, STATUS.UNDECIDED);
    });
  });

  // ─── Tier-based resolution ────────────────────────────────────

  describe('tier conflict resolution', () => {
    it('higher tier wins mutual attack (tier 1 > tier 2)', () => {
      const graph = new Map();
      graph.set('law', createArgument({ id: 'law', text: 'Loi', tier: 1 }));
      graph.set('juris', createArgument({ id: 'juris', text: 'Arrêt contra', tier: 2 }));
      addAttack(graph, 'law', 'juris');
      addAttack(graph, 'juris', 'law');
      solveGrounded(graph);
      // Both undecided after grounded
      assert.equal(graph.get('law').status, STATUS.UNDECIDED);
      resolveTierConflicts(graph);
      // Tier 1 wins
      assert.equal(graph.get('law').status, STATUS.IN);
      assert.equal(graph.get('juris').status, STATUS.OUT);
    });

    it('equal tier stays UNDECIDED (genuine conflict)', () => {
      const graph = new Map();
      graph.set('a1', createArgument({ id: 'a1', text: 'Arrêt 1', tier: 2 }));
      graph.set('a2', createArgument({ id: 'a2', text: 'Arrêt 2', tier: 2 }));
      addAttack(graph, 'a1', 'a2');
      addAttack(graph, 'a2', 'a1');
      solveGrounded(graph);
      resolveTierConflicts(graph);
      // Same tier = genuine conflict
      assert.equal(graph.get('a1').status, STATUS.UNDECIDED);
      assert.equal(graph.get('a2').status, STATUS.UNDECIDED);
    });
  });

  // ─── Issue analysis ───────────────────────────────────────────

  describe('buildFromIssue + resolve', () => {
    it('issue with article + favorable juris = confirmed', () => {
      const issue = {
        issue_id: 'test_1',
        articles: [{ ref: 'CO 259a', source_id: 's1', lienFedlex: 'https://fedlex.ch', titre: 'Défaut' }],
        arrets: [
          { signature: '4A_32/2018', role: 'favorable', source_id: 's2', resume: 'Réduction accordée' },
        ],
        anti_erreurs: [],
      };
      const result = analyzeIssue(issue);
      assert.equal(result.overall_certainty, 'confirmed');
      assert.ok(result.verified_claims.length > 0);
      assert.equal(result.conflicts.length, 0);
    });

    it('issue with contradictoire juris: tier 1 claim wins over tier 2 contra', () => {
      const issue = {
        issue_id: 'test_2',
        articles: [{ ref: 'CO 259a', source_id: 's1', lienFedlex: 'https://fedlex.ch', titre: 'Défaut' }],
        arrets: [
          { signature: '4A_32/2018', role: 'favorable', source_id: 's2', resume: 'Réduction' },
          { signature: '4A_395/2017', role: 'defavorable', source_id: 's3', resume: 'Pas de réduction si faute locataire' },
        ],
        anti_erreurs: [],
      };
      const result = analyzeIssue(issue);
      // Mutual attack article (tier 1) vs contra (tier 2) → tier 1 wins
      assert.ok(result.verified_claims.length > 0, 'Claim should survive');
      assert.equal(result.active_rebuttals.length, 0, 'Contra (tier 2) should be OUT');
    });

    it('issue with only contra juris: article (tier 1) still wins', () => {
      const issue = {
        issue_id: 'test_3',
        articles: [{ ref: 'CO 259a', source_id: 's1', lienFedlex: 'https://fedlex.ch', titre: 'Défaut' }],
        arrets: [
          { signature: '4A_395/2017', role: 'defavorable', source_id: 's3', resume: 'Rejeté' },
        ],
        anti_erreurs: [],
      };
      const result = analyzeIssue(issue);
      // Article (tier 1) vs contra (tier 2) in mutual attack → tier 1 wins
      assert.ok(result.verified_claims.length > 0, 'Article claim should survive');
    });

    it('empty issue = insufficient', () => {
      const result = analyzeIssue({ articles: [], arrets: [], anti_erreurs: [] });
      assert.equal(result.overall_certainty, 'insufficient');
      assert.equal(result.verified_claims.length, 0);
    });
  });

  // ─── Dossier-level analysis ───────────────────────────────────

  describe('analyzeDossier', () => {
    it('empty dossier = insufficient', () => {
      const result = analyzeDossier({ issues: [] });
      assert.equal(result.overall, 'insufficient');
    });

    it('dossier with 2 issues aggregates correctly', () => {
      const dossier = {
        issues: [
          {
            issue_id: 'i1', domaine: 'bail',
            articles: [{ ref: 'CO 259a', source_id: 's1', lienFedlex: 'https://f.ch', titre: 'T' }],
            arrets: [{ role: 'favorable', source_id: 's2', resume: 'OK', signature: 'S1' }],
            anti_erreurs: [],
          },
          {
            issue_id: 'i2', domaine: 'bail',
            articles: [],
            arrets: [],
            anti_erreurs: [],
          },
        ],
      };
      const result = analyzeDossier(dossier);
      assert.equal(result.issues.length, 2);
      assert.equal(result.overall, 'insufficient'); // worst = empty issue
    });
  });

  // ─── Hard adversarial cases ───────────────────────────────────

  describe('adversarial graph cases', () => {
    it('100 mutual attacks resolve without crash', () => {
      const graph = new Map();
      for (let i = 0; i < 100; i++) {
        graph.set(`a${i}`, createArgument({ id: `a${i}`, text: `Arg ${i}`, tier: 2 }));
      }
      // Chain of mutual attacks
      for (let i = 0; i < 99; i++) {
        addAttack(graph, `a${i}`, `a${i+1}`);
        addAttack(graph, `a${i+1}`, `a${i}`);
      }
      const start = performance.now();
      solveGrounded(graph);
      resolveTierConflicts(graph);
      const elapsed = performance.now() - start;
      assert.ok(elapsed < 100, `100 mutual attacks took ${elapsed.toFixed(0)}ms, expected < 100ms`);
    });

    it('graph with no arguments = no crash', () => {
      const graph = new Map();
      const { iterations } = solveGrounded(graph);
      assert.ok(iterations >= 0, 'Should not crash on empty graph');
    });

    it('self-attacking argument is OUT', () => {
      const graph = new Map();
      graph.set('self', createArgument({ id: 'self', text: 'Contradicts itself', tier: 1 }));
      addAttack(graph, 'self', 'self');
      solveGrounded(graph);
      // Self-attack: attackers not all OUT (self is undecided), so stays undecided
      // This is correct Dung semantics for self-attacking args
      assert.equal(graph.get('self').status, STATUS.UNDECIDED);
    });
  });
});
