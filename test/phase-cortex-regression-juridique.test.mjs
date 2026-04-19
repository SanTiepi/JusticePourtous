/**
 * phase-cortex-regression-juridique.test.mjs — Pack de régression juridique par intent
 *
 * Garantit qu'une modification accidentelle d'une fiche (suppression d'un article critique,
 * d'un délai, d'une escalade, baisse de confiance, etc.) fait FAILER immédiatement le test
 * de l'intent concerné.
 *
 * Source des invariants : src/data/meta/regression-invariants.json
 * Runner                : src/services/regression-invariants-runner.mjs
 *
 * Chaque invariant est exposé comme un `it(...)` distinct → message clair sur l'élément cassé.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runInvariants } from '../src/services/regression-invariants-runner.mjs';
import { getAllFiches } from '../src/services/fiches.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const INVARIANTS_PATH = path.join(ROOT, 'src/data/meta/regression-invariants.json');

const invariantsDef = JSON.parse(fs.readFileSync(INVARIANTS_PATH, 'utf-8'));
const fichesById = new Map(getAllFiches().map(f => [f.id, f]));

// Exécute tous les invariants en une passe — on recherche ensuite par intent_id + invariant
const result = runInvariants(invariantsDef, fichesById);

function sameInvariant(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function invariantLabel(inv) {
  const payload = inv.value ?? inv.match ?? inv.ref_regex ?? '∅';
  return `${inv.type}: ${JSON.stringify(payload)}`;
}

describe('Régression juridique — invariants top 30 intents', () => {
  it('seed file contient exactement 30 intents', () => {
    assert.equal(invariantsDef.length, 30, `attendu 30, reçu ${invariantsDef.length}`);
  });

  it('total invariants ≥ 120 (couverture minimale)', () => {
    assert.ok(
      result.total_count >= 120,
      `total invariants = ${result.total_count}, attendu ≥ 120`,
    );
  });

  it('chaque intent a ≥ 4 invariants', () => {
    const thin = invariantsDef.filter(d => (d.invariants || []).length < 4);
    assert.equal(
      thin.length, 0,
      `intents avec < 4 invariants : ${thin.map(t => t.intent_id).join(', ')}`,
    );
  });

  for (const def of invariantsDef) {
    describe(`${def.priority.toUpperCase()} · ${def.intent_id}`, () => {
      for (const inv of (def.invariants || [])) {
        it(invariantLabel(inv), () => {
          const fail = result.failures.find(
            f => f.intent_id === def.intent_id && sameInvariant(f.invariant, inv),
          );
          assert.ok(!fail, fail ? `FAIL [${def.intent_id}] ${invariantLabel(inv)} → ${fail.reason}` : '');
        });
      }
    });
  }
});
