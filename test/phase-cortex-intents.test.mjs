/**
 * phase-cortex-intents.test.mjs — Phase Cortex : catalogue d'intents
 *
 * Vérifie que :
 *   1. Le catalogue se génère et est un JSON valide
 *   2. Au moins 150 intents sont présents
 *   3. Chaque intent a les champs obligatoires (id unique, label_citoyen, domaines, etat_couverture)
 *   4. Les intents dérivés de fiches ont des domaines cohérents avec leurs fiches associées
 *   5. Les états de couverture sont répartis (pas 100% identique)
 *   6. Le coverage-report est généré et parseable
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Finding 4 review : écrire dans tmpdir pour ne pas polluer les fichiers versionnés.
const TEST_TMP = path.join(tmpdir(), 'justicepourtous-intents-test-' + Date.now());
fs.mkdirSync(TEST_TMP, { recursive: true });
const CATALOG_PATH = path.join(TEST_TMP, 'intents-catalog.json');
const REPORT_JSON_PATH = path.join(TEST_TMP, 'intents-coverage-report.json');
const REPORT_MD_PATH = path.join(TEST_TMP, 'intents-coverage.md');
const FICHES_DIR = path.join(ROOT, 'src/data/fiches');

const VALID_STATES = new Set(['complete', 'partial', 'stub', 'missing']);
// CLAUDE.md (2026-04-19) : 15 domaines couverts = 10 core + 5 beta
//   core : bail, travail, famille, dettes, etrangers, assurances,
//          social, violence, accident, entreprise
//   beta : consommation, voisinage, circulation, successions, sante
// Les domaines beta produisent des intents dérivés des fiches beta
// (cf. scripts/build-intent-catalog.mjs). Ils sont valides ici.
const VALID_DOMAINS = new Set([
  'bail', 'travail', 'famille', 'dettes', 'etrangers',
  'assurances', 'social', 'violence', 'accident', 'entreprise',
  'consommation', 'voisinage', 'circulation',
  'successions', 'sante',
]);

function runNode(script, args = []) {
  execFileSync(process.execPath, [path.join(ROOT, script), ...args], {
    cwd: ROOT,
    stdio: 'pipe',
  });
}

describe('Phase Cortex — catalogue d\'intents', () => {
  let intents;
  let report;
  let ficheIdToDomain;

  before(() => {
    // Regénère explicitement pour des tests reproductibles dans tmpdir (Finding 4)
    runNode('scripts/build-intent-catalog.mjs', ['--output', CATALOG_PATH]);
    runNode('scripts/intent-coverage-report.mjs', [
      '--catalog', CATALOG_PATH,
      '--json', REPORT_JSON_PATH,
      '--md', REPORT_MD_PATH
    ]);

    intents = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    report = JSON.parse(fs.readFileSync(REPORT_JSON_PATH, 'utf8'));

    ficheIdToDomain = new Map();
    for (const f of fs.readdirSync(FICHES_DIR).filter(x => x.endsWith('.json'))) {
      const arr = JSON.parse(fs.readFileSync(path.join(FICHES_DIR, f), 'utf8'));
      for (const fiche of arr) ficheIdToDomain.set(fiche.id, fiche.domaine);
    }
  });

  it('1. le catalog se génère et est un tableau JSON non vide', () => {
    assert.ok(Array.isArray(intents), 'intents doit être un tableau');
    assert.ok(intents.length > 0, 'le catalogue ne doit pas être vide');
  });

  it('2. contient au moins 150 intents', () => {
    assert.ok(
      intents.length >= 150,
      `attendu ≥ 150 intents, reçu ${intents.length}`,
    );
  });

  it('3. chaque intent a id unique + champs obligatoires valides', () => {
    const seen = new Set();
    for (const i of intents) {
      assert.equal(typeof i.id, 'string', 'id doit être une string');
      assert.ok(/^[a-z0-9_]+$/.test(i.id), `id "${i.id}" doit être snake_case (a-z0-9_)`);
      assert.ok(!seen.has(i.id), `id dupliqué : ${i.id}`);
      seen.add(i.id);

      assert.equal(typeof i.label_citoyen, 'string', `${i.id}: label_citoyen manquant`);
      assert.ok(i.label_citoyen.length > 0, `${i.id}: label_citoyen vide`);
      assert.equal(typeof i.label_juridique, 'string', `${i.id}: label_juridique manquant`);

      assert.ok(Array.isArray(i.domaines), `${i.id}: domaines doit être un array`);
      assert.ok(i.domaines.length >= 1, `${i.id}: au moins 1 domaine requis`);
      for (const d of i.domaines) {
        assert.ok(VALID_DOMAINS.has(d), `${i.id}: domaine inconnu "${d}"`);
      }

      assert.ok(VALID_STATES.has(i.etat_couverture),
        `${i.id}: etat_couverture "${i.etat_couverture}" invalide`);
      assert.ok(Array.isArray(i.fiches_associees), `${i.id}: fiches_associees doit être un array`);
      assert.ok(Array.isArray(i.tags), `${i.id}: tags doit être un array`);
      assert.ok(Array.isArray(i.cantons_specifiques), `${i.id}: cantons_specifiques doit être un array`);
      assert.equal(typeof i.has_cascade, 'boolean', `${i.id}: has_cascade doit être boolean`);
      assert.equal(typeof i.has_template, 'boolean', `${i.id}: has_template doit être boolean`);
      assert.equal(typeof i.has_jurisprudence, 'boolean', `${i.id}: has_jurisprudence doit être boolean`);
      assert.equal(typeof i.has_source_ids, 'boolean', `${i.id}: has_source_ids doit être boolean`);
    }
  });

  it('4. intents dérivés d\'une fiche ont un domaine cohérent', () => {
    let checked = 0;
    for (const i of intents) {
      if (!i.fiches_associees || i.fiches_associees.length === 0) continue;
      for (const ficheId of i.fiches_associees) {
        const ficheDomain = ficheIdToDomain.get(ficheId);
        if (!ficheDomain) continue; // fiche inconnue — tolérance
        assert.ok(
          i.domaines.includes(ficheDomain),
          `intent ${i.id}: fiche ${ficheId} est du domaine "${ficheDomain}" mais non présent dans intent.domaines=${JSON.stringify(i.domaines)}`,
        );
        checked += 1;
      }
    }
    assert.ok(checked > 100, `attendu ≥ 100 mappings fiches vérifiés, reçu ${checked}`);
  });

  it('5. les états de couverture sont répartis (≥ 2 états distincts non nuls)', () => {
    const counts = { complete: 0, partial: 0, stub: 0, missing: 0 };
    for (const i of intents) counts[i.etat_couverture] += 1;
    const nonZero = Object.values(counts).filter(v => v > 0).length;
    assert.ok(
      nonZero >= 2,
      `attendu au moins 2 états distincts, reçu ${nonZero} (${JSON.stringify(counts)})`,
    );
    // Aucun état ne doit représenter 100 %
    for (const [state, c] of Object.entries(counts)) {
      assert.ok(
        c < intents.length,
        `état "${state}" représente 100% des intents — répartition suspecte`,
      );
    }
  });

  it('6. le rapport coverage-report est généré et parseable', () => {
    assert.ok(fs.existsSync(REPORT_JSON_PATH), 'intents-coverage-report.json manquant');
    assert.ok(fs.existsSync(REPORT_MD_PATH), 'docs/intents-coverage.md manquant');
    assert.equal(typeof report.totals, 'object');
    assert.equal(report.totals.total, intents.length, 'total du rapport ≠ taille du catalogue');
    assert.ok(Array.isArray(report.by_domain));
    assert.ok(report.by_domain.length >= 5, 'attendu ≥ 5 domaines dans le rapport');
    assert.ok(Array.isArray(report.top_20_priority));
    assert.ok(report.top_20_priority.length > 0, 'top_20_priority vide');
    assert.ok(report.top_20_priority.length <= 20, 'top_20_priority > 20');

    // Chaque domaine a un quality_pct valide (0-100)
    for (const d of report.by_domain) {
      assert.ok(d.quality_pct >= 0 && d.quality_pct <= 100,
        `domaine ${d.domain}: quality_pct=${d.quality_pct} hors [0,100]`);
      assert.equal(
        d.complete + d.partial + d.stub + d.missing,
        d.total,
        `domaine ${d.domain}: total ≠ somme des états`,
      );
    }

    // Le markdown contient les sections attendues
    const md = fs.readFileSync(REPORT_MD_PATH, 'utf8');
    assert.ok(md.includes('# Intents'), 'markdown : titre manquant');
    assert.ok(md.includes('Par domaine'), 'markdown : section "Par domaine" manquante');
    assert.ok(md.includes('Top 20'), 'markdown : section "Top 20" manquante');
  });

  it('7. les intents marqués "missing" n\'ont aucune fiche associée', () => {
    for (const i of intents) {
      if (i.etat_couverture === 'missing') {
        assert.equal(
          i.fiches_associees.length,
          0,
          `intent ${i.id}: état=missing mais fiches_associees non vide`,
        );
        assert.equal(i.has_cascade, false, `${i.id}: missing mais has_cascade=true`);
        assert.equal(i.has_template, false, `${i.id}: missing mais has_template=true`);
      }
    }
  });
});
