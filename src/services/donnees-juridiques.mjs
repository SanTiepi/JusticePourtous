import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

function loadJSON(relativePath) {
  const fullPath = join(dataDir, relativePath);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, 'utf-8'));
}

// --- Loi ---
import { readdirSync } from 'node:fs';

// Load ALL loi files dynamically
const loiDir = join(dataDir, 'loi');
const loiFiles = existsSync(loiDir) ? readdirSync(loiDir).filter(f => f.endsWith('.json')) : [];
const articles = [];
for (const f of loiFiles) {
  const data = loadJSON(`loi/${f}`);
  if (data) articles.push(...data);
}

export function getAllArticles() {
  return { status: 200, data: { articles, total: articles.length } };
}

export function searchArticles(query) {
  const q = query.toLowerCase();
  const results = articles.filter(a =>
    a.ref?.toLowerCase().includes(q) ||
    a.titre?.toLowerCase().includes(q) ||
    a.resume?.toLowerCase().includes(q) ||
    a.texte?.toLowerCase().includes(q)
  );
  return { status: 200, data: { articles: results, total: results.length, query } };
}

// --- Jurisprudence ---
const jurisDir = join(dataDir, 'jurisprudence');
const jurisprudenceFiles = existsSync(jurisDir) ? readdirSync(jurisDir).filter(f => f.endsWith('.json')) : [];
const arrets = [];
for (const f of jurisprudenceFiles) {
  const data = loadJSON(`jurisprudence/${f}`);
  if (data) arrets.push(...data);
}

export function getAllArrets() {
  return { status: 200, data: { arrets, total: arrets.length } };
}

export function searchArrets(query) {
  const q = query.toLowerCase();
  const results = arrets.filter(a =>
    a.signature?.toLowerCase().includes(q) ||
    a.resume?.toLowerCase().includes(q) ||
    a.domaine?.toLowerCase().includes(q) ||
    a.principe?.toLowerCase().includes(q)
  );
  return { status: 200, data: { arrets: results, total: results.length, query } };
}

// --- Confiance ---
const confianceData = loadJSON('confiance/niveaux-confiance.json');

export function getNiveauxConfiance() {
  if (!confianceData) return { status: 404, error: 'Données confiance non disponibles' };
  return { status: 200, data: confianceData };
}

// --- Recevabilité ---
const recevabiliteData = loadJSON('recevabilite/conditions.json') || [];

export function getRecevabilite() {
  return { status: 200, data: { conditions: recevabiliteData, total: recevabiliteData.length } };
}

export function getRecevabiliteByProcedure(procedure) {
  const p = procedure.toLowerCase();
  const result = recevabiliteData.find(r => r.procedure?.toLowerCase().includes(p));
  if (!result) return { status: 404, error: `Procédure '${procedure}' non trouvée` };
  return { status: 200, data: result };
}

// --- Délais ---
const delaisData = loadJSON('delais/delais-procedures.json') || [];

export function getDelais() {
  return { status: 200, data: { delais: delaisData, total: delaisData.length } };
}

export function getDelaisByDomaine(domaine) {
  const results = delaisData.filter(d => d.domaine?.toLowerCase() === domaine.toLowerCase());
  return { status: 200, data: { delais: results, total: results.length, domaine } };
}

// --- Preuves ---
const preuvesData = loadJSON('preuves/exigences-preuves.json') || [];

export function getPreuves() {
  return { status: 200, data: { preuves: preuvesData, total: preuvesData.length } };
}

// --- Taxonomie ---
const taxonomieData = loadJSON('taxonomie/taxonomie-juridique.json') || [];

export function getTaxonomie() {
  return { status: 200, data: { taxonomie: taxonomieData, total: taxonomieData.length } };
}

export function searchTaxonomie(query) {
  const q = query.toLowerCase();
  const results = taxonomieData.filter(t =>
    t.probleme_profane?.toLowerCase().includes(q) ||
    t.qualification_juridique?.toLowerCase().includes(q) ||
    t.domaine?.toLowerCase().includes(q)
  );
  return { status: 200, data: { taxonomie: results, total: results.length, query } };
}

// --- Anti-erreurs ---
const antiErreursData = loadJSON('anti-erreurs/anti-erreurs.json') || [];

export function getAntiErreurs() {
  return { status: 200, data: { erreurs: antiErreursData, total: antiErreursData.length } };
}

export function getAntiErreursByDomaine(domaine) {
  const results = antiErreursData.filter(e => e.domaine?.toLowerCase() === domaine.toLowerCase());
  return { status: 200, data: { erreurs: results, total: results.length, domaine } };
}

// --- Patterns praticien ---
const patternsData = loadJSON('patterns/strategies-praticien.json') || [];

export function getPatterns() {
  return { status: 200, data: { patterns: patternsData, total: patternsData.length } };
}

export function getPatternsByDomaine(domaine) {
  const results = patternsData.filter(p => p.domaine?.toLowerCase() === domaine.toLowerCase());
  return { status: 200, data: { patterns: results, total: results.length, domaine } };
}

// --- Cas pratiques ---
const casData = loadJSON('cas-pratiques/cas-anonymises.json') || [];

export function getCasPratiques() {
  return { status: 200, data: { cas: casData, total: casData.length } };
}

export function getCasByDomaine(domaine) {
  const results = casData.filter(c => c.domaine?.toLowerCase() === domaine.toLowerCase());
  return { status: 200, data: { cas: results, total: results.length, domaine } };
}

// --- Escalade ---
const escaladeData = loadJSON('escalade/reseau-relais.json') || [];

export function getEscalade() {
  return { status: 200, data: { relais: escaladeData, total: escaladeData.length } };
}

export function getEscaladeByDomaine(domaine) {
  const d = domaine.toLowerCase();
  const results = escaladeData.filter(e => e.domaines?.some(dom => dom.toLowerCase() === d));
  return { status: 200, data: { relais: results, total: results.length, domaine } };
}

// --- Annuaire complet ---
const annuaireComplet = loadJSON('annuaire/annuaire-complet.json') || [];

export function getAnnuaireComplet() {
  return { status: 200, data: { services: annuaireComplet, total: annuaireComplet.length } };
}

export function getAnnuaireByCanton(canton) {
  const c = canton.toUpperCase();
  const results = annuaireComplet.filter(s => s.canton === c || s.cantons?.includes(c));
  return { status: 200, data: { services: results, total: results.length, canton: c } };
}

// --- Cantons ---
const cantonsData = loadJSON('cantons/donnees-cantonales.json') || [];

export function getCantons() {
  return { status: 200, data: { cantons: cantonsData, total: cantonsData.length } };
}

export function getCantonByCode(code) {
  const result = cantonsData.find(c => c.code === code.toUpperCase());
  if (!result) return { status: 404, error: `Canton '${code}' non trouvé` };
  return { status: 200, data: result };
}

// --- Coûts ---
const coutsData = loadJSON('couts/couts-procedures.json') || [];

export function getCouts() {
  return { status: 200, data: { couts: coutsData, total: coutsData.length } };
}

// --- Templates ---
const templatesData = loadJSON('templates/lettres.json') || [];

export function getTemplates() {
  return { status: 200, data: { templates: templatesData, total: templatesData.length } };
}

export function getTemplateById(id) {
  const tpl = templatesData.find(t => t.id === id);
  if (!tpl) return { status: 404, error: `Template '${id}' non trouvé` };
  return { status: 200, data: tpl };
}

// --- Meta / Couverture ---
const metaData = loadJSON('meta/couverture.json');

export function getCouverture() {
  if (!metaData) {
    return { status: 200, data: {
      dateGeneration: new Date().toISOString().split('T')[0],
      totalArticles: articles.length,
      totalArrets: arrets.length,
      totalDelais: delaisData.length,
      totalPatterns: patternsData.length,
      totalCas: casData.length,
      totalRelais: escaladeData.length,
      totalTemplates: templatesData.length,
      totalAntiErreurs: antiErreursData.length,
      totalTaxonomie: taxonomieData.length,
      totalRecevabilite: recevabiliteData.length,
      totalCantons: cantonsData.length
    }};
  }
  return { status: 200, data: metaData };
}
