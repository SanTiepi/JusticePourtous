/**
 * fiche-validator.mjs — Phase Cortex 4
 *
 * Validateur zero-deps pour les fiches juridiques de JusticePourtous.
 * Ne couvre pas le standard JSON Schema complet : valide uniquement
 * les règles critiques de notre schéma custom (cf src/data/schemas/fiche.schema.json).
 *
 * API :
 *   - validateFiche(fiche, { strict }) → { valid, errors, warnings }
 *   - validateAllFiches({ root? })     → rapport global
 *   - countFicheSchemaIssues(report)   → statistiques agrégées
 *
 * Codes d'erreurs :
 *   - MISSING_FIELD       : champ obligatoire absent
 *   - INVALID_TYPE        : type primaire incorrect
 *   - INVALID_PATTERN     : regex non respectée (id, dates)
 *   - INVALID_ENUM        : valeur hors enum (domaine, confiance, review_scope)
 *   - MIN_ITEMS           : tableau trop court
 *   - MIN_LENGTH          : chaîne trop courte (explication < 200)
 *   - INVALID_QUESTION    : sous-objet question malformé
 *   - INVALID_ARTICLE     : sous-objet article sans ref
 *   - DUPLICATE_ID        : id rencontré plusieurs fois (mode validateAllFiches)
 *
 * Codes de warnings :
 *   - CONFIANCE_CERTAIN_NOT_REVIEWED : confiance=certain sans expert review
 *   - EXPIRY_BEFORE_VERIFIED         : review_expiry <= last_verified_at
 *   - NOT_ACTIONABLE                 : ni cascades ni modeleLettre
 *   - SHORT_EXPLICATION_FEW_ARTICLES : explication courte + 1 seul article
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCHEMA_PATH = path.resolve(__dirname, '../data/schemas/fiche.schema.json');
const FICHES_DIR = path.resolve(__dirname, '../data/fiches');

// Cached schema (lazy)
let _schema = null;
function loadSchema() {
  if (_schema) return _schema;
  const raw = fs.readFileSync(SCHEMA_PATH, 'utf8');
  _schema = JSON.parse(raw);
  return _schema;
}

// --- Helpers --------------------------------------------------------------

const ID_REGEX = /^[a-z][a-z0-9_]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

const DOMAIN_ENUM = [
  'bail', 'travail', 'famille', 'dettes', 'etrangers',
  'assurances', 'social', 'violence', 'accident', 'entreprise',
  'circulation', 'consommation', 'voisinage',
  'successions', 'sante'
];

const CONFIANCE_ENUM = ['certain', 'probable', 'variable', 'incertain'];

const REVIEW_SCOPE_ENUM = [
  'draft_automated',
  'reviewed_by_claude',
  'reviewed_by_legal_expert'
];

const REQUIRED_TOP = [
  'id', 'domaine', 'sousDomaine', 'tags', 'confiance',
  'questions', 'reponse', 'last_verified_at', 'review_scope', 'review_expiry'
];

function err(path, code, message) {
  return { path, code, message };
}

function warn(path, code, message) {
  return { path, code, message };
}

function isString(v) { return typeof v === 'string'; }
function isObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }
function isArray(v) { return Array.isArray(v); }

// --- Core validators ------------------------------------------------------

function validateQuestions(questions, errors) {
  if (!isArray(questions)) {
    errors.push(err('questions', 'INVALID_TYPE', 'questions doit être un tableau'));
    return;
  }
  if (questions.length < 3) {
    errors.push(err('questions', 'MIN_ITEMS', `questions doit contenir au moins 3 éléments (reçu ${questions.length})`));
  }
  questions.forEach((q, idx) => {
    const base = `questions[${idx}]`;
    if (!isObject(q)) {
      errors.push(err(base, 'INVALID_QUESTION', 'la question doit être un objet'));
      return;
    }
    if (!isString(q.id) || q.id.length === 0) {
      errors.push(err(`${base}.id`, 'MISSING_FIELD', 'champ id manquant ou vide'));
    }
    if (!isString(q.text) || q.text.length === 0) {
      errors.push(err(`${base}.text`, 'MISSING_FIELD', 'champ text manquant ou vide'));
    }
    const hasOptions = isArray(q.options) && q.options.length > 0;
    const hasType = isString(q.type) && q.type.length > 0;
    if (!hasOptions && !hasType) {
      errors.push(err(base, 'INVALID_QUESTION', 'la question doit avoir options[] ou type'));
    }
  });
}

function validateReponse(reponse, errors) {
  if (!isObject(reponse)) {
    errors.push(err('reponse', 'INVALID_TYPE', 'reponse doit être un objet'));
    return;
  }
  // explication
  if (!isString(reponse.explication)) {
    errors.push(err('reponse.explication', 'MISSING_FIELD', 'explication manquante'));
  } else if (reponse.explication.length < 200) {
    errors.push(err('reponse.explication', 'MIN_LENGTH',
      `explication trop courte (${reponse.explication.length} chars, min 200)`));
  }
  // articles
  if (!isArray(reponse.articles)) {
    errors.push(err('reponse.articles', 'MISSING_FIELD', 'articles manquant ou non-array'));
  } else if (reponse.articles.length < 1) {
    errors.push(err('reponse.articles', 'MIN_ITEMS', 'articles doit contenir au moins 1 élément'));
  } else {
    reponse.articles.forEach((a, idx) => {
      if (!isObject(a) || !isString(a.ref) || a.ref.length === 0) {
        errors.push(err(`reponse.articles[${idx}].ref`, 'INVALID_ARTICLE', 'article sans ref'));
      }
    });
  }
  // jurisprudence (optionnelle, min 0)
  if (reponse.jurisprudence !== undefined && !isArray(reponse.jurisprudence)) {
    errors.push(err('reponse.jurisprudence', 'INVALID_TYPE', 'jurisprudence doit être un tableau'));
  }
}

/**
 * Valide une fiche.
 *
 * @param {object} fiche
 * @param {object} [opts]
 * @param {boolean} [opts.strict=false] — si true, les warnings deviennent des errors
 * @returns {{ valid: boolean, errors: Array, warnings: Array }}
 */
export function validateFiche(fiche, { strict = false } = {}) {
  const errors = [];
  const warnings = [];

  if (!isObject(fiche)) {
    return {
      valid: false,
      errors: [err('', 'INVALID_TYPE', 'la fiche doit être un objet')],
      warnings: []
    };
  }

  // Required top-level
  for (const field of REQUIRED_TOP) {
    if (fiche[field] === undefined || fiche[field] === null) {
      errors.push(err(field, 'MISSING_FIELD', `champ obligatoire absent : ${field}`));
    }
  }

  // id
  if (fiche.id !== undefined) {
    if (!isString(fiche.id)) {
      errors.push(err('id', 'INVALID_TYPE', 'id doit être une chaîne'));
    } else if (!ID_REGEX.test(fiche.id)) {
      errors.push(err('id', 'INVALID_PATTERN',
        `id doit matcher ${ID_REGEX} (reçu "${fiche.id}")`));
    }
  }

  // domaine
  if (fiche.domaine !== undefined) {
    if (!DOMAIN_ENUM.includes(fiche.domaine)) {
      errors.push(err('domaine', 'INVALID_ENUM',
        `domaine "${fiche.domaine}" hors enum [${DOMAIN_ENUM.join(', ')}]`));
    }
  }

  // sousDomaine
  if (fiche.sousDomaine !== undefined && (!isString(fiche.sousDomaine) || fiche.sousDomaine.length === 0)) {
    errors.push(err('sousDomaine', 'INVALID_TYPE', 'sousDomaine doit être une chaîne non vide'));
  }

  // tags
  if (fiche.tags !== undefined) {
    if (!isArray(fiche.tags)) {
      errors.push(err('tags', 'INVALID_TYPE', 'tags doit être un tableau'));
    } else if (fiche.tags.length < 1) {
      errors.push(err('tags', 'MIN_ITEMS', 'tags doit contenir au moins 1 élément'));
    }
  }

  // confiance
  if (fiche.confiance !== undefined && !CONFIANCE_ENUM.includes(fiche.confiance)) {
    errors.push(err('confiance', 'INVALID_ENUM',
      `confiance "${fiche.confiance}" hors enum [${CONFIANCE_ENUM.join(', ')}]`));
  }

  // questions
  if (fiche.questions !== undefined) {
    validateQuestions(fiche.questions, errors);
  }

  // reponse
  if (fiche.reponse !== undefined) {
    validateReponse(fiche.reponse, errors);
  }

  // dates
  for (const dateField of ['last_verified_at', 'review_expiry']) {
    if (fiche[dateField] !== undefined) {
      if (!isString(fiche[dateField]) || !DATE_REGEX.test(fiche[dateField])) {
        errors.push(err(dateField, 'INVALID_PATTERN',
          `${dateField} doit être une date ISO (reçu "${fiche[dateField]}")`));
      }
    }
  }

  // review_scope
  if (fiche.review_scope !== undefined && !REVIEW_SCOPE_ENUM.includes(fiche.review_scope)) {
    errors.push(err('review_scope', 'INVALID_ENUM',
      `review_scope "${fiche.review_scope}" hors enum [${REVIEW_SCOPE_ENUM.join(', ')}]`));
  }

  // --- Warnings (non bloquants) -------------------------------------------

  // confiance=certain doit être expert-reviewed
  if (fiche.confiance === 'certain' && fiche.review_scope !== 'reviewed_by_legal_expert') {
    warnings.push(warn('confiance', 'CONFIANCE_CERTAIN_NOT_REVIEWED',
      'confiance="certain" devrait être validée par un expert juridique (review_scope=reviewed_by_legal_expert)'));
  }

  // review_expiry > last_verified_at
  if (isString(fiche.last_verified_at) && isString(fiche.review_expiry)
      && DATE_REGEX.test(fiche.last_verified_at) && DATE_REGEX.test(fiche.review_expiry)) {
    if (fiche.review_expiry <= fiche.last_verified_at) {
      warnings.push(warn('review_expiry', 'EXPIRY_BEFORE_VERIFIED',
        `review_expiry (${fiche.review_expiry}) doit être postérieur à last_verified_at (${fiche.last_verified_at})`));
    }
  }

  // not actionable
  const hasCascades = isArray(fiche.cascades) && fiche.cascades.length > 0;
  const hasLettre = isObject(fiche.reponse) && isString(fiche.reponse.modeleLettre)
    && fiche.reponse.modeleLettre.length > 0;
  if (!hasCascades && !hasLettre) {
    warnings.push(warn('', 'NOT_ACTIONABLE',
      'fiche ni actionnable (pas de cascades) ni épistolaire (pas de modeleLettre)'));
  }

  // explication courte + peu d'articles
  if (isObject(fiche.reponse) && isString(fiche.reponse.explication)
      && fiche.reponse.explication.length < 400
      && isArray(fiche.reponse.articles) && fiche.reponse.articles.length < 2) {
    warnings.push(warn('reponse', 'SHORT_EXPLICATION_FEW_ARTICLES',
      'explication < 400 chars avec moins de 2 articles : enrichir recommandé'));
  }

  // strict : warnings → errors
  if (strict) {
    for (const w of warnings) {
      errors.push({ ...w, code: `STRICT_${w.code}` });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: strict ? [] : warnings
  };
}

/**
 * Parcourt toutes les fiches sur disque et applique validateFiche.
 *
 * @param {object} [opts]
 * @param {string} [opts.root] — répertoire racine alternatif (tests)
 * @param {boolean} [opts.strict=false]
 * @returns {{
 *   total: number,
 *   valid_count: number,
 *   invalid_count: number,
 *   warning_count: number,
 *   error_count: number,
 *   duplicates: string[],
 *   per_file: Array,
 *   per_fiche: Array
 * }}
 */
export function validateAllFiches({ root, strict = false } = {}) {
  const dir = root ? path.resolve(root) : FICHES_DIR;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

  const seenIds = new Map(); // id -> firstFile
  const duplicates = [];

  let total = 0;
  let valid_count = 0;
  let invalid_count = 0;
  let warning_count = 0;
  let error_count = 0;

  const per_file = [];
  const per_fiche = [];

  for (const file of files) {
    const full = path.join(dir, file);
    let arr;
    try {
      arr = JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch (e) {
      per_file.push({ file, parse_error: e.message, fiche_count: 0 });
      continue;
    }
    if (!isArray(arr)) {
      per_file.push({ file, parse_error: 'le fichier ne contient pas un tableau de fiches', fiche_count: 0 });
      continue;
    }

    let fileValid = 0;
    let fileInvalid = 0;
    let fileWarn = 0;

    for (const fiche of arr) {
      total++;
      const result = validateFiche(fiche, { strict });

      // Duplicate ID
      if (fiche && isString(fiche.id)) {
        if (seenIds.has(fiche.id)) {
          duplicates.push(fiche.id);
          result.errors.push(err('id', 'DUPLICATE_ID',
            `id "${fiche.id}" déjà présent dans ${seenIds.get(fiche.id)}`));
          result.valid = false;
        } else {
          seenIds.set(fiche.id, file);
        }
      }

      if (result.valid) {
        valid_count++;
        fileValid++;
      } else {
        invalid_count++;
        fileInvalid++;
      }
      warning_count += result.warnings.length;
      error_count += result.errors.length;
      if (result.warnings.length > 0) fileWarn++;

      per_fiche.push({
        id: fiche?.id ?? '<no-id>',
        file,
        valid: result.valid,
        errors: result.errors,
        warnings: result.warnings
      });
    }

    per_file.push({
      file,
      fiche_count: arr.length,
      valid: fileValid,
      invalid: fileInvalid,
      with_warnings: fileWarn
    });
  }

  return {
    total,
    valid_count,
    invalid_count,
    warning_count,
    error_count,
    duplicates,
    per_file,
    per_fiche
  };
}

/**
 * Statistiques agrégées.
 *
 * @param {object} [report] — résultat de validateAllFiches() (sinon recalculé)
 */
export function countFicheSchemaIssues(report) {
  const r = report ?? validateAllFiches();
  const byErrorCode = {};
  const byWarningCode = {};
  const byDomain = {};
  const topProblematic = [];

  for (const item of r.per_fiche) {
    if (!byDomain[item.id?.split('_')?.[0] ?? 'unknown']) {
      byDomain[item.id?.split('_')?.[0] ?? 'unknown'] = { valid: 0, invalid: 0 };
    }
    const dKey = item.id?.split('_')?.[0] ?? 'unknown';
    if (item.valid) byDomain[dKey].valid++;
    else byDomain[dKey].invalid++;

    for (const e of item.errors) {
      byErrorCode[e.code] = (byErrorCode[e.code] || 0) + 1;
    }
    for (const w of item.warnings) {
      byWarningCode[w.code] = (byWarningCode[w.code] || 0) + 1;
    }
    if (item.errors.length + item.warnings.length > 0) {
      topProblematic.push({
        id: item.id,
        file: item.file,
        error_count: item.errors.length,
        warning_count: item.warnings.length
      });
    }
  }

  topProblematic.sort((a, b) =>
    (b.error_count * 10 + b.warning_count) - (a.error_count * 10 + a.warning_count));

  return {
    total: r.total,
    valid_count: r.valid_count,
    invalid_count: r.invalid_count,
    warning_count: r.warning_count,
    error_count: r.error_count,
    duplicates: r.duplicates,
    valid_pct: r.total === 0 ? 0 : Math.round(1000 * r.valid_count / r.total) / 10,
    by_error_code: byErrorCode,
    by_warning_code: byWarningCode,
    by_domain: byDomain,
    top_problematic: topProblematic.slice(0, 10)
  };
}
