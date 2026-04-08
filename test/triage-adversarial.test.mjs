import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { semanticSearch } from '../src/services/semantic-search.mjs';
import { getAllFiches } from '../src/services/fiches.mjs';

const fiches = getAllFiches();

const SCENARIOS = [
  { query: 'Ma regie veut me foutre dehors demain', expectedDomain: 'bail' },
  { query: 'Mon appart est plein de moisissure et le proprio ne fait rien', expectedDomain: 'bail' },
  { query: 'On m a augmente les charges sans justificatif', expectedDomain: 'bail' },
  { query: 'Mon voisin fait du bruit toute la nuit', expectedDomain: 'bail' },
  { query: 'Mon employeur ne me paie pas mon salaire', expectedDomain: 'travail' },
  { query: 'Je subis du mobbing au travail', expectedDomain: 'travail' },
  { query: 'J ai ete licencie pendant mon arret maladie', expectedDomain: 'travail' },
  { query: 'On me refuse mon certificat de travail', expectedDomain: 'travail' },
  { query: 'Mon ex ne paie plus la pension des enfants', expectedDomain: 'famille' },
  { query: 'Je veux la garde de mon enfant', expectedDomain: 'famille' },
  { query: 'Mon conjoint est violent et me menace', expectedDomain: 'famille' },
  { query: 'Je dois payer des dettes et je risque une saisie', expectedDomain: 'dettes' },
  { query: 'J ai recu un commandement de payer mais je ne dois rien', expectedDomain: 'dettes' },
  { query: 'Un huissier veut saisir mes meubles', expectedDomain: 'dettes' },
  { query: 'Mon permis de sejour a ete refuse', expectedDomain: 'etrangers' },
  { query: 'Je risque d etre renvoye dans mon pays', expectedDomain: 'etrangers' },
  { query: 'Je suis sans papiers et jai besoin de soins', expectedDomain: 'etrangers' },
  { query: 'Mon patron me discrimine parce que je suis enceinte', expectedDomain: 'travail' },
  { query: 'Je cherche un avocat gratuit', expectedDomain: 'global' },
  { query: 'Mon ex veut partir a l etranger avec notre enfant', expectedDomain: 'famille' }
];

function run(query, limit = 3) {
  return semanticSearch(query, fiches, limit);
}

describe('Triage adversarial', () => {
  it('keeps top-3 coverage over 20 profane scenarios', () => {
    const misses = [];

    for (const scenario of SCENARIOS) {
      const results = run(scenario.query, 3);
      const domains = results.map(r => r.fiche.domaine);

      if (scenario.expectedDomain === 'global') {
        if (results.length === 0) {
          misses.push(`${scenario.query} => no result`);
        }
        continue;
      }

      if (!domains.includes(scenario.expectedDomain)) {
        misses.push(`${scenario.query} => ${domains.join(', ') || 'no result'}`);
      }
    }

    assert.equal(
      misses.length,
      0,
      `Top-3 misses (${misses.length}):\n${misses.join('\n')}`
    );
  });

  it('limits top-1 false positives on profane scenarios', () => {
    const falsePositives = [];

    for (const scenario of SCENARIOS) {
      if (scenario.expectedDomain === 'global') continue;

      const top = run(scenario.query, 1)[0];
      if (!top) {
        falsePositives.push(`${scenario.query} => no result`);
        continue;
      }

      if (top.fiche.domaine !== scenario.expectedDomain) {
        falsePositives.push(`${scenario.query} => ${top.fiche.id} (${top.fiche.domaine})`);
      }
    }

    assert.ok(
      falsePositives.length <= 5,
      `Top-1 false positives (${falsePositives.length}) exceed threshold 5:\n${falsePositives.join('\n')}`
    );
  });

  it('keeps complexity bounded on adversarial batch', () => {
    const durations = [];

    for (let i = 0; i < 60; i++) {
      for (const scenario of SCENARIOS) {
        const start = performance.now();
        run(scenario.query, 5);
        durations.push(performance.now() - start);
      }
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    assert.ok(
      p95 < 12,
      `P95 too high (${p95.toFixed(2)}ms), expected < 12ms over ${durations.length} searches`
    );
  });
});
