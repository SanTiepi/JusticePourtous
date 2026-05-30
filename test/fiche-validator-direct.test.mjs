/**
 * Tests directs pour fiche-validator.mjs
 *
 * Ce module est le gate CI #2 (appelé par le 2e gate avant tout push).
 * validateFiche/validateAllFiches/countFicheSchemaIssues avaient 0 tests
 * directs — un bug silencieux dans le validateur pouvait laisser passer
 * des fiches invalides sans être détecté.
 *
 * Couverture : entrées dégénérées, champs REQUIRED_TOP, id pattern,
 * domaine/confiance/review_scope ENUM, tags, questions, reponse,
 * dates ISO, warnings (CONFIANCE_CERTAIN_NOT_REVIEWED, EXPIRY_BEFORE_VERIFIED,
 * NOT_ACTIONABLE, SHORT_EXPLICATION_FEW_ARTICLES), mode strict,
 * countFicheSchemaIssues agrégats, intégration sur les 314 vraies fiches.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFiche,
  validateAllFiches,
  countFicheSchemaIssues,
} from '../src/services/fiche-validator.mjs';

// ─── Fiche de base valide (zéro warning) ────────────────────────────────

// explication > 400 chars + 2 articles → évite SHORT_EXPLICATION_FEW_ARTICLES
const EXPLICATION_OK = 'Selon le droit suisse des obligations, le bailleur doit livrer '
  + 'la chose louée dans un état approprié à l\'usage convenu et l\'entretenir en cet état '
  + 'pendant toute la durée du bail. Le locataire dispose de plusieurs recours légaux en cas '
  + 'de manquement du bailleur à ses obligations. Cette règle fondamentale structure tout le '
  + 'droit du bail en Suisse et s\'applique à toutes les formes de location d\'habitation.';
// ~410 chars

const BASE_FICHE = {
  id: 'test_fiche_valide',
  domaine: 'bail',
  sousDomaine: 'Défauts de la chose louée',
  tags: ['bail', 'defaut'],
  confiance: 'probable',
  questions: [
    { id: 'q1', text: 'Avez-vous signalé le défaut au bailleur?', options: ['oui', 'non'] },
    { id: 'q2', text: 'Depuis combien de temps?', type: 'text' },
    { id: 'q3', text: 'Type de défaut?', options: ['moisissure', 'chauffage', 'autre'] },
  ],
  reponse: {
    explication: EXPLICATION_OK,
    articles: [
      { ref: 'CO 259a', titre: 'Défauts' },
      { ref: 'CO 259b', titre: 'Effets' },
    ],
    modeleLettre: 'Madame, Monsieur, je vous informe d\'un défaut...',
  },
  last_verified_at: '2026-01-01',
  review_expiry: '2027-01-01',
  review_scope: 'reviewed_by_claude',
};

function ficheWith(overrides) {
  return { ...BASE_FICHE, ...overrides };
}

// ─── validateFiche — entrées dégénérées ─────────────────────────────────

describe('validateFiche — entrées dégénérées', () => {
  it('null → valid=false, INVALID_TYPE', () => {
    const r = validateFiche(null);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.code === 'INVALID_TYPE'));
  });

  it('undefined → valid=false, INVALID_TYPE', () => {
    const r = validateFiche(undefined);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.code === 'INVALID_TYPE'));
  });

  it('string → valid=false, INVALID_TYPE', () => {
    const r = validateFiche('une fiche');
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.code === 'INVALID_TYPE'));
  });

  it('tableau → valid=false, INVALID_TYPE (tableau ≠ objet pour isObject)', () => {
    const r = validateFiche([]);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.code === 'INVALID_TYPE'));
  });
});

// ─── validateFiche — fiche minimale valide ───────────────────────────────

describe('validateFiche — fiche valide', () => {
  it('fiche bien formée → valid=true, 0 errors', () => {
    const r = validateFiche(BASE_FICHE);
    assert.equal(r.valid, true, `errors inattendus: ${JSON.stringify(r.errors)}`);
    assert.equal(r.errors.length, 0);
  });

  it('retourne { valid: boolean, errors: [], warnings: [] }', () => {
    const r = validateFiche(BASE_FICHE);
    assert.equal(typeof r.valid, 'boolean');
    assert.ok(Array.isArray(r.errors));
    assert.ok(Array.isArray(r.warnings));
  });
});

// ─── validateFiche — MISSING_FIELD (champs top-level) ───────────────────

describe('validateFiche — MISSING_FIELD champs obligatoires', () => {
  it('id absent → MISSING_FIELD sur id', () => {
    const r = validateFiche(ficheWith({ id: undefined }));
    assert.ok(r.errors.some(e => e.code === 'MISSING_FIELD' && e.path === 'id'));
  });

  it('domaine absent → MISSING_FIELD sur domaine', () => {
    const r = validateFiche(ficheWith({ domaine: undefined }));
    assert.ok(r.errors.some(e => e.code === 'MISSING_FIELD' && e.path === 'domaine'));
  });

  it('reponse absent → MISSING_FIELD sur reponse', () => {
    const r = validateFiche(ficheWith({ reponse: undefined }));
    assert.ok(r.errors.some(e => e.code === 'MISSING_FIELD' && e.path === 'reponse'));
  });

  it('review_scope absent → MISSING_FIELD sur review_scope', () => {
    const r = validateFiche(ficheWith({ review_scope: undefined }));
    assert.ok(r.errors.some(e => e.code === 'MISSING_FIELD' && e.path === 'review_scope'));
  });

  it('last_verified_at null → MISSING_FIELD (null considéré absent)', () => {
    const r = validateFiche(ficheWith({ last_verified_at: null }));
    assert.ok(r.errors.some(e => e.code === 'MISSING_FIELD' && e.path === 'last_verified_at'));
  });
});

// ─── validateFiche — id ──────────────────────────────────────────────────

describe('validateFiche — id pattern', () => {
  it('id avec tiret → INVALID_PATTERN', () => {
    const r = validateFiche(ficheWith({ id: 'bail-defaut' }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_PATTERN' && e.path === 'id'));
  });

  it('id commence par chiffre → INVALID_PATTERN', () => {
    const r = validateFiche(ficheWith({ id: '1bail_defaut' }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_PATTERN' && e.path === 'id'));
  });

  it('id non-string (nombre) → INVALID_TYPE', () => {
    const r = validateFiche(ficheWith({ id: 42 }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_TYPE' && e.path === 'id'));
  });

  it('id valide avec chiffres et underscores → ok', () => {
    const r = validateFiche(ficheWith({ id: 'bail_defaut_moisissure2' }));
    assert.ok(!r.errors.some(e => e.path === 'id'),
      `erreur id inattendue: ${JSON.stringify(r.errors.filter(e => e.path === 'id'))}`);
  });
});

// ─── validateFiche — INVALID_ENUM ────────────────────────────────────────

describe('validateFiche — INVALID_ENUM', () => {
  it('domaine hors enum → INVALID_ENUM', () => {
    const r = validateFiche(ficheWith({ domaine: 'notaire' }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_ENUM' && e.path === 'domaine'));
  });

  it('confiance hors enum → INVALID_ENUM', () => {
    const r = validateFiche(ficheWith({ confiance: 'élevée' }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_ENUM' && e.path === 'confiance'));
  });

  it('review_scope hors enum → INVALID_ENUM', () => {
    const r = validateFiche(ficheWith({ review_scope: 'reviewed_by_human' }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_ENUM' && e.path === 'review_scope'));
  });

  it('tous les 15 domaines valides → pas d\'erreur domaine', () => {
    const domaines = ['bail','travail','famille','dettes','etrangers',
      'assurances','social','violence','accident','entreprise',
      'circulation','consommation','voisinage','successions','sante'];
    for (const dom of domaines) {
      const r = validateFiche(ficheWith({ domaine: dom }));
      assert.ok(!r.errors.some(e => e.path === 'domaine'),
        `domaine "${dom}" devrait être valide`);
    }
  });
});

// ─── validateFiche — tags ────────────────────────────────────────────────

describe('validateFiche — tags', () => {
  it('tags vide → MIN_ITEMS', () => {
    const r = validateFiche(ficheWith({ tags: [] }));
    assert.ok(r.errors.some(e => e.code === 'MIN_ITEMS' && e.path === 'tags'));
  });

  it('tags non-tableau → INVALID_TYPE', () => {
    const r = validateFiche(ficheWith({ tags: 'bail defaut' }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_TYPE' && e.path === 'tags'));
  });
});

// ─── validateFiche — questions ───────────────────────────────────────────

describe('validateFiche — questions', () => {
  it('questions non-tableau → INVALID_TYPE', () => {
    const r = validateFiche(ficheWith({ questions: 'Q1: situation?' }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_TYPE' && e.path === 'questions'));
  });

  it('moins de 3 questions → MIN_ITEMS', () => {
    const r = validateFiche(ficheWith({ questions: [
      { id: 'q1', text: 'Q?', options: ['oui'] },
    ]}));
    assert.ok(r.errors.some(e => e.code === 'MIN_ITEMS' && e.path === 'questions'));
  });

  it('question sans id → MISSING_FIELD sur questions[0].id', () => {
    const r = validateFiche(ficheWith({ questions: [
      { text: 'Q?', options: ['oui'] },
      { id: 'q2', text: 'Q?', options: ['oui'] },
      { id: 'q3', text: 'Q?', options: ['oui'] },
    ]}));
    assert.ok(r.errors.some(e => e.code === 'MISSING_FIELD' && e.path.includes('questions[0]')));
  });

  it('question sans text → MISSING_FIELD sur questions[0].text', () => {
    const r = validateFiche(ficheWith({ questions: [
      { id: 'q1', options: ['oui'] },
      { id: 'q2', text: 'Q?', options: ['oui'] },
      { id: 'q3', text: 'Q?', options: ['oui'] },
    ]}));
    assert.ok(r.errors.some(e => e.code === 'MISSING_FIELD' && e.path === 'questions[0].text'));
  });

  it('question sans options ni type → INVALID_QUESTION', () => {
    const r = validateFiche(ficheWith({ questions: [
      { id: 'q1', text: 'Q?' },
      { id: 'q2', text: 'Q?', options: ['oui'] },
      { id: 'q3', text: 'Q?', options: ['oui'] },
    ]}));
    assert.ok(r.errors.some(e => e.code === 'INVALID_QUESTION' && e.path === 'questions[0]'));
  });

  it('question avec type (string) sans options → ok', () => {
    const r = validateFiche(ficheWith({ questions: [
      { id: 'q1', text: 'Décrivez votre situation', type: 'text' },
      { id: 'q2', text: 'Depuis quand?', type: 'date' },
      { id: 'q3', text: 'Montant?', type: 'number' },
    ]}));
    assert.ok(!r.errors.some(e => e.code === 'INVALID_QUESTION'));
  });
});

// ─── validateFiche — reponse ─────────────────────────────────────────────

describe('validateFiche — reponse', () => {
  it('reponse non-objet → INVALID_TYPE', () => {
    const r = validateFiche(ficheWith({ reponse: 'texte brut' }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_TYPE' && e.path === 'reponse'));
  });

  it('explication < 200 chars → MIN_LENGTH', () => {
    const r = validateFiche(ficheWith({
      reponse: { ...BASE_FICHE.reponse, explication: 'Trop court.' }
    }));
    assert.ok(r.errors.some(e => e.code === 'MIN_LENGTH' && e.path === 'reponse.explication'));
  });

  it('explication exactement 200 chars → ok (borne incluse)', () => {
    const r = validateFiche(ficheWith({
      reponse: { ...BASE_FICHE.reponse, explication: 'A'.repeat(200) }
    }));
    assert.ok(!r.errors.some(e => e.path === 'reponse.explication'));
  });

  it('articles vide → MIN_ITEMS', () => {
    const r = validateFiche(ficheWith({
      reponse: { ...BASE_FICHE.reponse, articles: [] }
    }));
    assert.ok(r.errors.some(e => e.code === 'MIN_ITEMS' && e.path === 'reponse.articles'));
  });

  it('article sans ref → INVALID_ARTICLE', () => {
    const r = validateFiche(ficheWith({
      reponse: { ...BASE_FICHE.reponse, articles: [{ titre: 'Sans ref' }] }
    }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_ARTICLE'));
  });

  it('jurisprudence non-tableau → INVALID_TYPE', () => {
    const r = validateFiche(ficheWith({
      reponse: { ...BASE_FICHE.reponse, jurisprudence: 'ATF 123' }
    }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_TYPE' && e.path === 'reponse.jurisprudence'));
  });

  it('jurisprudence tableau vide → ok (optionnel, min 0)', () => {
    const r = validateFiche(ficheWith({
      reponse: { ...BASE_FICHE.reponse, jurisprudence: [] }
    }));
    assert.ok(!r.errors.some(e => e.path === 'reponse.jurisprudence'));
  });
});

// ─── validateFiche — dates ISO ───────────────────────────────────────────

describe('validateFiche — dates ISO', () => {
  it('last_verified_at format DD.MM.YYYY → INVALID_PATTERN', () => {
    const r = validateFiche(ficheWith({ last_verified_at: '01.01.2026' }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_PATTERN' && e.path === 'last_verified_at'));
  });

  it('review_expiry format YYYY/MM/DD → INVALID_PATTERN', () => {
    const r = validateFiche(ficheWith({ review_expiry: '2027/01/01' }));
    assert.ok(r.errors.some(e => e.code === 'INVALID_PATTERN' && e.path === 'review_expiry'));
  });

  it('format ISO avec heure → valide', () => {
    const r = validateFiche(ficheWith({ last_verified_at: '2026-01-01T00:00:00Z' }));
    assert.ok(!r.errors.some(e => e.path === 'last_verified_at'),
      `erreur date inattendue: ${JSON.stringify(r.errors.filter(e => e.path === 'last_verified_at'))}`);
  });
});

// ─── validateFiche — warnings ────────────────────────────────────────────

describe('validateFiche — warnings', () => {
  it('confiance=certain sans expert review → CONFIANCE_CERTAIN_NOT_REVIEWED', () => {
    const r = validateFiche(ficheWith({ confiance: 'certain', review_scope: 'reviewed_by_claude' }));
    assert.ok(r.warnings.some(w => w.code === 'CONFIANCE_CERTAIN_NOT_REVIEWED'));
  });

  it('confiance=certain avec reviewed_by_legal_expert → pas de warning', () => {
    const r = validateFiche(ficheWith({ confiance: 'certain', review_scope: 'reviewed_by_legal_expert' }));
    assert.ok(!r.warnings.some(w => w.code === 'CONFIANCE_CERTAIN_NOT_REVIEWED'));
  });

  it('review_expiry antérieur à last_verified_at → EXPIRY_BEFORE_VERIFIED', () => {
    const r = validateFiche(ficheWith({ last_verified_at: '2026-06-01', review_expiry: '2026-01-01' }));
    assert.ok(r.warnings.some(w => w.code === 'EXPIRY_BEFORE_VERIFIED'));
  });

  it('review_expiry égal à last_verified_at → EXPIRY_BEFORE_VERIFIED (comparaison <=)', () => {
    const r = validateFiche(ficheWith({ last_verified_at: '2026-06-01', review_expiry: '2026-06-01' }));
    assert.ok(r.warnings.some(w => w.code === 'EXPIRY_BEFORE_VERIFIED'));
  });

  it('sans cascades ni modeleLettre → NOT_ACTIONABLE', () => {
    const reponse = { ...BASE_FICHE.reponse };
    delete reponse.modeleLettre;
    const r = validateFiche(ficheWith({ reponse, cascades: undefined }));
    assert.ok(r.warnings.some(w => w.code === 'NOT_ACTIONABLE'));
  });

  it('avec cascades (et sans modeleLettre) → pas NOT_ACTIONABLE', () => {
    const reponse = { ...BASE_FICHE.reponse };
    delete reponse.modeleLettre;
    const r = validateFiche(ficheWith({ reponse, cascades: [{ action: 'lettre' }] }));
    assert.ok(!r.warnings.some(w => w.code === 'NOT_ACTIONABLE'));
  });

  it('explication 200-399 chars + 1 article → SHORT_EXPLICATION_FEW_ARTICLES', () => {
    const r = validateFiche(ficheWith({ reponse: {
      explication: 'B'.repeat(250), // 200-399 chars
      articles: [{ ref: 'CO 259a', titre: 'Défaut' }],
      modeleLettre: 'Lettre...',
    }}));
    assert.ok(r.warnings.some(w => w.code === 'SHORT_EXPLICATION_FEW_ARTICLES'));
  });

  it('explication ≥ 400 chars + 1 article → pas SHORT_EXPLICATION_FEW_ARTICLES', () => {
    const r = validateFiche(ficheWith({ reponse: {
      explication: 'C'.repeat(400),
      articles: [{ ref: 'CO 259a', titre: 'Défaut' }],
      modeleLettre: 'Lettre...',
    }}));
    assert.ok(!r.warnings.some(w => w.code === 'SHORT_EXPLICATION_FEW_ARTICLES'));
  });
});

// ─── validateFiche — mode strict ─────────────────────────────────────────

describe('validateFiche — strict=true', () => {
  it('warning NOT_ACTIONABLE → devient STRICT_NOT_ACTIONABLE dans errors, warnings=[]]', () => {
    const reponse = { ...BASE_FICHE.reponse };
    delete reponse.modeleLettre;
    const r = validateFiche(ficheWith({ reponse, cascades: undefined }), { strict: true });
    assert.equal(r.valid, false);
    assert.ok(r.errors.some(e => e.code === 'STRICT_NOT_ACTIONABLE'));
    assert.equal(r.warnings.length, 0);
  });
});

// ─── countFicheSchemaIssues ───────────────────────────────────────────────

describe('countFicheSchemaIssues — rapport synthétique', () => {
  it('rapport vide → all zeros, valid_pct=0', () => {
    const report = {
      total: 0, valid_count: 0, invalid_count: 0,
      warning_count: 0, error_count: 0, duplicates: [],
      per_file: [], per_fiche: [],
    };
    const s = countFicheSchemaIssues(report);
    assert.equal(s.total, 0);
    assert.equal(s.error_count, 0);
    assert.equal(s.valid_pct, 0);
  });

  it('2 valides / 1 invalide → valid_pct=66.7, by_error_code correct', () => {
    const report = {
      total: 3, valid_count: 2, invalid_count: 1,
      warning_count: 0, error_count: 1, duplicates: [],
      per_file: [],
      per_fiche: [
        { id: 'bail_a', domaine: 'bail', valid: true, errors: [], warnings: [] },
        { id: 'bail_b', domaine: 'bail', valid: true, errors: [], warnings: [] },
        { id: 'bail_c', domaine: 'bail', valid: false, errors: [{ code: 'MISSING_FIELD', path: 'id', message: '' }], warnings: [] },
      ],
    };
    const s = countFicheSchemaIssues(report);
    assert.equal(s.valid_pct, 66.7);
    assert.equal(s.error_count, 1);
    assert.equal(s.by_error_code.MISSING_FIELD, 1);
  });

  it('by_domain regroupe correctement par domaine', () => {
    const report = {
      total: 3, valid_count: 2, invalid_count: 1,
      warning_count: 0, error_count: 1, duplicates: [],
      per_file: [],
      per_fiche: [
        { id: 'bail_ok', domaine: 'bail', valid: true, errors: [], warnings: [] },
        { id: 'travail_ok', domaine: 'travail', valid: true, errors: [], warnings: [] },
        { id: 'bail_bad', domaine: 'bail', valid: false, errors: [{ code: 'MIN_LENGTH', path: 'reponse.explication', message: '' }], warnings: [] },
      ],
    };
    const s = countFicheSchemaIssues(report);
    assert.equal(s.by_domain.bail.valid, 1);
    assert.equal(s.by_domain.bail.invalid, 1);
    assert.equal(s.by_domain.travail.valid, 1);
    assert.equal(s.by_domain.travail.invalid, 0);
  });

  it('top_problematic trié par sévérité (errors×10 + warnings) desc', () => {
    const report = {
      total: 2, valid_count: 0, invalid_count: 2,
      warning_count: 1, error_count: 3, duplicates: [],
      per_file: [],
      per_fiche: [
        { id: 'fiche_a', domaine: 'bail', valid: false,
          errors: [{ code: 'X', path: '', message: '' }],
          warnings: [{ code: 'Y', path: '', message: '' }] },
        { id: 'fiche_b', domaine: 'bail', valid: false,
          errors: [{ code: 'X', path: '', message: '' }, { code: 'Z', path: '', message: '' }],
          warnings: [] },
      ],
    };
    const s = countFicheSchemaIssues(report);
    // fiche_b : 2 errors = 20 pts ; fiche_a : 1 error + 1 warning = 11 pts → b avant a
    assert.equal(s.top_problematic[0].id, 'fiche_b');
    assert.equal(s.top_problematic[1].id, 'fiche_a');
  });

  it('by_warning_code compté séparément des errors', () => {
    const report = {
      total: 1, valid_count: 1, invalid_count: 0,
      warning_count: 1, error_count: 0, duplicates: [],
      per_file: [],
      per_fiche: [
        { id: 'bail_ok', domaine: 'bail', valid: true, errors: [],
          warnings: [{ code: 'NOT_ACTIONABLE', path: '', message: '' }] },
      ],
    };
    const s = countFicheSchemaIssues(report);
    assert.equal(s.by_warning_code.NOT_ACTIONABLE, 1);
    assert.equal(Object.keys(s.by_error_code).length, 0);
  });
});

// ─── Intégration : validateAllFiches sur les données réelles ────────────

describe('validateAllFiches + countFicheSchemaIssues sur données réelles', () => {
  it('314 fiches en prod → 0 errors, valid_pct=100%', () => {
    const report = validateAllFiches();
    const s = countFicheSchemaIssues(report);
    assert.equal(s.total, 314,
      `total fiches attendu 314, obtenu ${s.total}`);
    assert.equal(s.error_count, 0,
      `erreurs de validation inattendues: ${JSON.stringify(s.by_error_code)}`);
    assert.equal(s.valid_pct, 100);
  });
});
