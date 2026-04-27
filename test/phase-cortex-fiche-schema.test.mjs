/**
 * Phase Cortex 4 — JSON Schema formel des fiches juridiques.
 *
 * Couvre :
 *   - validateFiche : tous les chemins (champs requis, enums, regex,
 *     min items, longueur explication)
 *   - validateAllFiches : parcours réel des 264 fiches actuelles
 *   - countFicheSchemaIssues : statistiques agrégées
 *   - script audit : exit 0 avec --tolerant
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  validateFiche,
  validateAllFiches,
  countFicheSchemaIssues
} from '../src/services/fiche-validator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function fullFiche(overrides = {}) {
  return {
    id: 'bail_test_demo',
    domaine: 'bail',
    sousDomaine: 'défaut',
    tags: ['moisissure', 'humidité'],
    confiance: 'probable',
    questions: [
      { id: 'q1', text: 'Quel défaut ?', options: ['moisissure', 'bruit'] },
      { id: 'q2', text: 'Depuis combien ?', options: ['<1 mois', '>1 mois'] },
      { id: 'q3', text: 'Canton ?', type: 'canton' }
    ],
    reponse: {
      explication: 'A'.repeat(220),
      articles: [
        { ref: 'CO 256', titre: 'Délivrance' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_32/2018', resume: 'Réduction de 20%' }
      ],
      modeleLettre: 'Madame, Monsieur, ...',
      services: []
    },
    last_verified_at: '2026-04-07',
    review_scope: 'draft_automated',
    review_expiry: '2027-04-07',
    cascades: [{ titre: 'X', etapes: [] }],
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// validateFiche unit tests
// ---------------------------------------------------------------------------

describe('validateFiche — fiche complète', () => {
  it('retourne valid=true sur fiche complète conforme', () => {
    const r = validateFiche(fullFiche());
    assert.equal(r.valid, true, JSON.stringify(r.errors));
    assert.equal(r.errors.length, 0);
  });

  it('warning vide quand fiche complète et actionnable', () => {
    const r = validateFiche(fullFiche());
    // Pas de NOT_ACTIONABLE car cascades + modeleLettre
    const codes = r.warnings.map(w => w.code);
    assert.ok(!codes.includes('NOT_ACTIONABLE'));
  });
});

describe('validateFiche — champs requis', () => {
  it('échec si id manquant, erreur sur path "id"', () => {
    const f = fullFiche();
    delete f.id;
    const r = validateFiche(f);
    assert.equal(r.valid, false);
    const e = r.errors.find(x => x.path === 'id' && x.code === 'MISSING_FIELD');
    assert.ok(e, `attendu MISSING_FIELD sur id, reçu ${JSON.stringify(r.errors)}`);
  });

  it('échec si domaine manquant', () => {
    const f = fullFiche();
    delete f.domaine;
    const r = validateFiche(f);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path === 'domaine' && e.code === 'MISSING_FIELD'));
  });

  it('échec si questions absent', () => {
    const f = fullFiche();
    delete f.questions;
    const r = validateFiche(f);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path === 'questions' && e.code === 'MISSING_FIELD'));
  });

  it('échec si reponse absent', () => {
    const f = fullFiche();
    delete f.reponse;
    const r = validateFiche(f);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path === 'reponse' && e.code === 'MISSING_FIELD'));
  });
});

describe('validateFiche — enums et patterns', () => {
  it('échec si domaine inconnu', () => {
    const r = validateFiche(fullFiche({ domaine: 'fiscalite' }));
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path === 'domaine' && e.code === 'INVALID_ENUM'));
  });

  it('échec si confiance hors enum', () => {
    const r = validateFiche(fullFiche({ confiance: 'sûr' }));
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path === 'confiance' && e.code === 'INVALID_ENUM'));
  });

  it('échec si review_scope inconnu', () => {
    const r = validateFiche(fullFiche({ review_scope: 'reviewed_by_intern' }));
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path === 'review_scope' && e.code === 'INVALID_ENUM'));
  });

  it('échec si id ne respecte pas snake_case', () => {
    const r = validateFiche(fullFiche({ id: 'BailTest' }));
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path === 'id' && e.code === 'INVALID_PATTERN'));
  });

  it('échec si last_verified_at non-ISO', () => {
    const r = validateFiche(fullFiche({ last_verified_at: '07/04/2026' }));
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path === 'last_verified_at' && e.code === 'INVALID_PATTERN'));
  });
});

describe('validateFiche — sous-structures critiques', () => {
  it('échec si reponse.articles vide ou manquant', () => {
    const f = fullFiche();
    f.reponse.articles = [];
    const r = validateFiche(f);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path === 'reponse.articles' && e.code === 'MIN_ITEMS'));
  });

  it('échec si une question sans options ni type', () => {
    const f = fullFiche();
    f.questions[2] = { id: 'q3', text: 'Canton ?' }; // ni options ni type
    const r = validateFiche(f);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path.startsWith('questions[2]') && e.code === 'INVALID_QUESTION'));
  });

  it('échec si moins de 3 questions', () => {
    const f = fullFiche();
    f.questions = f.questions.slice(0, 2);
    const r = validateFiche(f);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path === 'questions' && e.code === 'MIN_ITEMS'));
  });

  it('échec si explication < 200 chars', () => {
    const f = fullFiche();
    f.reponse.explication = 'Trop court.';
    const r = validateFiche(f);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.path === 'reponse.explication' && e.code === 'MIN_LENGTH'));
  });

  it('article sans ref → INVALID_ARTICLE', () => {
    const f = fullFiche();
    f.reponse.articles = [{ titre: 'Sans ref' }];
    const r = validateFiche(f);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.code === 'INVALID_ARTICLE'));
  });
});

describe('validateFiche — champs optionnels', () => {
  it('valide sans cascades (champ optionnel)', () => {
    const f = fullFiche();
    delete f.cascades;
    // garde modeleLettre pour rester actionnable
    const r = validateFiche(f);
    assert.equal(r.valid, true, JSON.stringify(r.errors));
  });

  it('valide sans jurisprudence (min 0)', () => {
    const f = fullFiche();
    delete f.reponse.jurisprudence;
    const r = validateFiche(f);
    assert.equal(r.valid, true, JSON.stringify(r.errors));
  });

  it('valide avec champs optionnels exotiques (anti_erreurs, patterns…)', () => {
    const f = fullFiche({
      anti_erreurs: [{ erreur: 'X', explication: 'Y' }],
      patterns: ['regex'],
      delais: [{ nom: 'Délai bail', jours: 30 }]
    });
    const r = validateFiche(f);
    assert.equal(r.valid, true);
  });
});

describe('validateFiche — warnings non bloquants', () => {
  it('warning CONFIANCE_CERTAIN_NOT_REVIEWED si confiance=certain et pas legal_expert', () => {
    const r = validateFiche(fullFiche({
      confiance: 'certain',
      review_scope: 'draft_automated'
    }));
    assert.equal(r.valid, true); // bloquant : non
    assert.ok(r.warnings.some(w => w.code === 'CONFIANCE_CERTAIN_NOT_REVIEWED'));
  });

  it('pas de warning CONFIANCE_CERTAIN si reviewed_by_legal_expert', () => {
    const r = validateFiche(fullFiche({
      confiance: 'certain',
      review_scope: 'reviewed_by_legal_expert'
    }));
    assert.ok(!r.warnings.some(w => w.code === 'CONFIANCE_CERTAIN_NOT_REVIEWED'));
  });

  it('warning EXPIRY_BEFORE_VERIFIED si review_expiry <= last_verified_at', () => {
    const r = validateFiche(fullFiche({
      last_verified_at: '2026-04-07',
      review_expiry: '2025-04-07'
    }));
    assert.ok(r.warnings.some(w => w.code === 'EXPIRY_BEFORE_VERIFIED'));
  });

  it('warning NOT_ACTIONABLE si ni cascades ni modeleLettre', () => {
    const f = fullFiche();
    delete f.cascades;
    delete f.reponse.modeleLettre;
    const r = validateFiche(f);
    assert.ok(r.warnings.some(w => w.code === 'NOT_ACTIONABLE'));
  });

  it('mode strict : warnings deviennent errors', () => {
    const f = fullFiche();
    delete f.cascades;
    delete f.reponse.modeleLettre;
    const r = validateFiche(f, { strict: true });
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.code === 'STRICT_NOT_ACTIONABLE'));
    assert.equal(r.warnings.length, 0); // converties en errors
  });
});

// ---------------------------------------------------------------------------
// validateAllFiches : parcours réel
// ---------------------------------------------------------------------------

describe('validateAllFiches — parcours des 264 fiches réelles', () => {
  let report;
  let stats;

  before(() => {
    report = validateAllFiches();
    stats = countFicheSchemaIssues(report);
  });

  it('retourne un rapport avec total, valid_count, invalid_count', () => {
    assert.ok(typeof report.total === 'number');
    assert.ok(typeof report.valid_count === 'number');
    assert.ok(typeof report.invalid_count === 'number');
    assert.equal(report.total, report.valid_count + report.invalid_count);
  });

  it('couvre au moins 250 fiches', () => {
    assert.ok(report.total >= 250, `attendu ≥ 250 fiches, reçu ${report.total}`);
  });

  it('au moins 80% des fiches sont valides (tolérance qualité actuelle)', () => {
    const pct = stats.valid_pct;
    assert.ok(pct >= 80, `attendu ≥ 80% valides, reçu ${pct}%`);
  });

  it('aucun id dupliqué sur l\'ensemble du corpus', () => {
    assert.equal(stats.duplicates.length, 0,
      `IDs dupliqués détectés : ${stats.duplicates.join(', ')}`);
  });

  it('countFicheSchemaIssues retourne by_error_code et by_warning_code', () => {
    assert.ok(stats.by_error_code && typeof stats.by_error_code === 'object');
    assert.ok(stats.by_warning_code && typeof stats.by_warning_code === 'object');
    assert.ok(stats.by_domain && typeof stats.by_domain === 'object');
  });

  it('top_problematic est trié par sévérité décroissante', () => {
    const tp = stats.top_problematic;
    for (let i = 1; i < tp.length; i++) {
      const a = tp[i - 1], b = tp[i];
      const sa = a.error_count * 10 + a.warning_count;
      const sb = b.error_count * 10 + b.warning_count;
      assert.ok(sa >= sb, `top_problematic mal trié à l'index ${i}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Script audit : exit 0 avec --tolerant
// ---------------------------------------------------------------------------

describe('scripts/audit-fiches-schema.mjs', () => {
  it('exit 0 avec --tolerant et écrit le rapport JSON', () => {
    const scriptPath = path.join(ROOT, 'scripts/audit-fiches-schema.mjs');
    const reportPath = path.join(ROOT, 'src/data/meta/fiches-schema-audit.json');

    // Should not throw
    let stdout = '';
    try {
      stdout = execFileSync(process.execPath, [scriptPath, '--tolerant', '--quiet'], {
        cwd: ROOT,
        encoding: 'utf8'
      });
    } catch (e) {
      assert.fail(`script a échoué : ${e.message}\n${e.stdout}\n${e.stderr}`);
    }
    assert.ok(fs.existsSync(reportPath), 'rapport JSON manquant');
    const json = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    assert.ok(json.summary && typeof json.summary.total === 'number');
    assert.ok(typeof json.strict === 'boolean');
    // Console output sanity (timestamp en console seulement, pas dans le JSON déterministe)
    assert.ok(stdout.includes('AUDIT SCHEMA FICHES'));
  });
});
