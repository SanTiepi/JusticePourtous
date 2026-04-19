/**
 * Cantons Matrix Service — Matrice cantonale des autorités et formulaires
 *
 * Phase Cortex 1 — sortie actionnable.
 *
 * Centralise les autorités compétentes (conciliation, tribunaux, offices)
 * et les formulaires officiels par canton (VD, GE, ZH, BE, BS, TI) pour
 * 10 domaines (bail, travail, dettes, etrangers, famille, social, violence,
 * accident, assurances, entreprise).
 *
 * Quand un canton n'est pas couvert, la matrice retombe sur les autorités
 * fédérales (OFL, SECO, SEM, OFAS, OFJ, etc.).
 *
 * Lecture seule — données statiques chargées au démarrage.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MATRIX_PATH = join(__dirname, '..', 'data', 'meta', 'cantons-matrix.json');

let _matrix = null;

function loadMatrix() {
  if (_matrix) return _matrix;
  try {
    _matrix = JSON.parse(readFileSync(MATRIX_PATH, 'utf-8'));
  } catch (err) {
    // Defensive default — never crash the engine if the matrix is missing.
    _matrix = {
      version: '0.0.0',
      generated_at: new Date().toISOString(),
      cantons: {},
      fallback_federal: {},
      domaines_couverts: []
    };
  }
  return _matrix;
}

const SUPPORTED_CANTONS = ['VD', 'GE', 'ZH', 'BE', 'BS', 'TI'];

/**
 * Returns the full cantons matrix (for inspection / dashboards).
 * @returns {object}
 */
export function getCantonsMatrix() {
  return loadMatrix();
}

/**
 * Returns the list of supported canton codes (uppercase).
 * @returns {string[]} ['VD','GE','ZH','BE','BS','TI']
 */
export function listCantonsSupported() {
  return [...SUPPORTED_CANTONS];
}

/**
 * Get all authorities for a given canton + domain pair.
 * Returns an array of {key, ...autorite} objects.
 * If the canton or domain is unknown, returns [].
 *
 * @param {string} canton - canton code (e.g. 'VD')
 * @param {string} domaine - domain key (e.g. 'bail')
 * @returns {Array<{key: string, nom: string, ...}>}
 */
export function getAutoritesByCantonDomaine(canton, domaine) {
  if (!canton || !domaine) return [];
  const m = loadMatrix();
  const c = String(canton).toUpperCase();
  const d = String(domaine).toLowerCase();
  const cantonData = m.cantons?.[c];
  if (!cantonData) return [];
  const autorites = cantonData.autorites?.[d];
  if (!autorites || typeof autorites !== 'object') return [];
  return Object.entries(autorites).map(([key, value]) => ({
    key,
    canton: c,
    domaine: d,
    ...value
  }));
}

/**
 * Get all official forms for a given canton + (optional) domain.
 * Returns an array of {key, ...formulaire} objects.
 * If `domaine` is provided, filters forms whose key starts with the domain prefix.
 *
 * @param {string} canton
 * @param {string} [domaine] - optional filter (e.g. 'bail')
 * @returns {Array}
 */
export function getFormulairesCantonaux(canton, domaine) {
  if (!canton) return [];
  const m = loadMatrix();
  const c = String(canton).toUpperCase();
  const cantonData = m.cantons?.[c];
  if (!cantonData) return [];
  const forms = cantonData.formulaires_officiels;
  if (!forms || typeof forms !== 'object') return [];
  let entries = Object.entries(forms).map(([key, value]) => ({
    key,
    canton: c,
    ...value
  }));
  if (domaine) {
    const d = String(domaine).toLowerCase();
    entries = entries.filter(e => e.key?.toLowerCase().startsWith(d + '_') || e.key?.toLowerCase() === d);
  }
  return entries;
}

/**
 * Returns ALL contacts (autorités, all domains) for a given canton, flat.
 * Useful for "pack canton" rendering.
 *
 * @param {string} canton
 * @returns {Array}
 */
export function getContactsByCanton(canton) {
  if (!canton) return [];
  const m = loadMatrix();
  const c = String(canton).toUpperCase();
  const cantonData = m.cantons?.[c];
  if (!cantonData) return [];
  const out = [];
  for (const [domaine, entries] of Object.entries(cantonData.autorites || {})) {
    if (!entries || typeof entries !== 'object') continue;
    for (const [key, value] of Object.entries(entries)) {
      out.push({ key, canton: c, domaine, ...value });
    }
  }
  return out;
}

/**
 * Returns the federal fallback authorities for a given domain when the
 * citizen's canton is not yet covered by the matrix.
 *
 * @param {string} domaine
 * @returns {Array}
 */
export function fallbackFederal(domaine) {
  if (!domaine) return [];
  const m = loadMatrix();
  const d = String(domaine).toLowerCase();
  const fb = m.fallback_federal?.[d];
  if (!fb || typeof fb !== 'object') return [];
  return Object.entries(fb).map(([key, value]) => ({
    key,
    domaine: d,
    federal: true,
    ...value
  }));
}

/**
 * Convenience: enrich a list of escalade contacts with cantonal authorities
 * from the matrix. Existing entries keep priority — the matrix entries are
 * appended (not deduplicated by name) so the caller can see both sources.
 *
 * Returns a new array; does not mutate the input.
 *
 * @param {Array} escalade - existing escalade contacts (from data/escalade)
 * @param {string} canton - canton code
 * @param {string} domaine - domain key
 * @returns {Array}
 */
export function enrichEscaladeWithMatrix(escalade, canton, domaine) {
  const base = Array.isArray(escalade) ? [...escalade] : [];
  if (!canton) return base;
  const c = String(canton).toUpperCase();
  if (!SUPPORTED_CANTONS.includes(c)) {
    // Unsupported canton — append federal fallback for the domain
    if (!domaine) return base;
    const fb = fallbackFederal(domaine);
    return base.concat(fb.map(toEscaladeShape));
  }
  if (!domaine) return base;
  const cantonals = getAutoritesByCantonDomaine(c, domaine);
  return base.concat(cantonals.map(toEscaladeShape));
}

function toEscaladeShape(autorite) {
  // Map the matrix shape onto the escalade shape used elsewhere
  // (id/nom/type/gratuit/contact/conditions/cantons/domaines) so
  // downstream renderers stay agnostic.
  const isFree = String(autorite.cout || '').toLowerCase().includes('gratuit')
    || String(autorite.cout || '').toLowerCase().includes('couvert')
    || autorite.gratuit === true;
  return {
    id: `matrix_${autorite.canton || 'CH'}_${autorite.domaine || autorite.key}_${autorite.key}`.toLowerCase(),
    nom: autorite.nom,
    type: autorite.federal ? 'autorite_federale' : 'autorite_cantonale',
    gratuit: !!isFree,
    contact: autorite.site || autorite.tel || autorite.adresse || null,
    conditions: autorite.procedure || null,
    cantons: autorite.canton ? [autorite.canton] : null,
    domaines: autorite.domaine ? [autorite.domaine] : null,
    delaiReponse: autorite.delai_reaction || null,
    source: 'cantons-matrix',
    _meta: {
      adresse: autorite.adresse || null,
      site: autorite.site || null,
      tel: autorite.tel || null,
      cout: autorite.cout || null
    }
  };
}

// Internal helper exposed for testing only.
export const _internals = { toEscaladeShape, SUPPORTED_CANTONS };
