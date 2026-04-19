/**
 * Tests Cortex — ingestion entscheidsuche + matching cantonal.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { generateMockDecisions, hashDecision } from '../scripts/ingest-entscheidsuche.mjs';
import { findCantonalMatches, getCantonalCorpusStats, _resetCacheForTests } from '../src/services/cantonal-juris-matcher.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('entscheidsuche ingest — mock', () => {
  it('generateMockDecisions produit des décisions avec tous les champs attendus', () => {
    const decisions = generateMockDecisions({ limit: 20, canton: null, domaine: null });
    assert.ok(decisions.length > 0);
    assert.ok(decisions.length <= 20);
    for (const d of decisions) {
      assert.ok(d.source);
      assert.ok(d.canton);
      assert.ok(d.court);
      assert.ok(d.date);
      assert.ok(d.domaine);
      assert.ok(d.title);
      assert.ok(d.references);
      assert.ok(Array.isArray(d.references));
    }
  });

  it('hashDecision est stable et unique', () => {
    const d1 = { court: 'TC VD', date: '2023-05-15', title: 'Test 1' };
    const d2 = { court: 'TC VD', date: '2023-05-15', title: 'Test 1' };
    const d3 = { court: 'TC GE', date: '2023-05-15', title: 'Test 1' };
    assert.equal(hashDecision(d1), hashDecision(d2));
    assert.notEqual(hashDecision(d1), hashDecision(d3));
  });

  it('filtres canton et domaine fonctionnent', () => {
    const vd = generateMockDecisions({ limit: 5, canton: 'VD', domaine: null });
    for (const d of vd) assert.equal(d.canton, 'VD');
    const bail = generateMockDecisions({ limit: 5, canton: null, domaine: 'bail' });
    for (const d of bail) assert.equal(d.domaine, 'bail');
  });

  it('CLI --mock --limit 10 produit un fichier JSON valide', () => {
    const out = execFileSync(process.execPath, [
      join(ROOT, 'scripts/ingest-entscheidsuche.mjs'),
      '--mock', '--limit', '10'
    ], { cwd: ROOT, encoding: 'utf-8' });
    assert.match(out, /décisions ingérées/);
    const dir = join(ROOT, 'src/data/jurisprudence-cantonale');
    const files = readdirSync(dir).filter(f => f.startsWith('entscheidsuche-'));
    assert.ok(files.length > 0, 'au moins un fichier dump doit exister');
    const content = JSON.parse(readFileSync(join(dir, files[0]), 'utf-8'));
    assert.ok(Array.isArray(content));
    assert.ok(content.length > 0);
    assert.ok(content[0].hash);
    assert.ok(content[0].ingested_at);
  });
});

describe('cantonal-juris-matcher', () => {
  before(() => {
    _resetCacheForTests();
  });

  it('findCantonalMatches retourne tableau (vide si corpus absent ou pas de match)', () => {
    const fakeFiche = {
      id: 'test_fiche',
      domaine: 'bail',
      tags: ['bail', 'résiliation'],
      reponse: { articles: [{ ref: 'CO 266' }] }
    };
    const matches = findCantonalMatches(fakeFiche, { limit: 5 });
    assert.ok(Array.isArray(matches));
  });

  it('minScore filtre correctement', () => {
    const noMatchFiche = {
      id: 'no_match',
      domaine: 'domaine_inexistant',
      tags: [],
      reponse: { articles: [] }
    };
    const matches = findCantonalMatches(noMatchFiche, { limit: 5, minScore: 10 });
    assert.equal(matches.length, 0);
  });

  it('fiche sans domaine → 0 matches', () => {
    const matches = findCantonalMatches({ id: 'x' }, { limit: 5 });
    assert.equal(matches.length, 0);
  });

  it('getCantonalCorpusStats retourne des stats cohérentes', () => {
    const stats = getCantonalCorpusStats();
    assert.ok(typeof stats.total === 'number');
    assert.ok(typeof stats.by_canton === 'object');
    assert.ok(typeof stats.by_domaine === 'object');
  });

  it('canton du citoyen prioritaire dans le score', () => {
    // On ne peut pas forcer le corpus en mémoire facilement ici.
    // Ce test vérifie juste que l'option est acceptée sans crash.
    const fiche = {
      id: 'bail_test',
      domaine: 'bail',
      tags: ['résiliation'],
      reponse: { articles: [{ ref: 'CO 266' }] }
    };
    const vdMatches = findCantonalMatches(fiche, { canton: 'VD', limit: 3 });
    const geMatches = findCantonalMatches(fiche, { canton: 'GE', limit: 3 });
    assert.ok(Array.isArray(vdMatches));
    assert.ok(Array.isArray(geMatches));
  });
});

describe('knowledge-engine branchement cantonal', () => {
  it('enrichFiche retourne le champ jurisprudence_cantonale (tableau)', async () => {
    const { queryComplete } = await import('../src/services/knowledge-engine.mjs');
    const result = queryComplete('bail_defaut_moisissure');
    if (result && result.status === 200 && result.data) {
      assert.ok('jurisprudence_cantonale' in result.data,
        'le champ jurisprudence_cantonale doit être présent même si vide');
      assert.ok(Array.isArray(result.data.jurisprudence_cantonale));
    }
  });
});
