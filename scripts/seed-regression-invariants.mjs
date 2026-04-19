#!/usr/bin/env node
/**
 * seed-regression-invariants.mjs — Pack de régression juridique par intent
 *
 * Sélectionne les TOP 30 intents prioritaires depuis src/data/meta/intents-catalog.json
 * et produit src/data/meta/regression-invariants.json avec au moins 4 invariants
 * par intent, dérivés de l'état actuel des fiches.
 *
 * Sélection :
 *   - priority "high" = etat_couverture === 'complete' (11 intents aujourd'hui)
 *   - priority "medium" = etat_couverture === 'partial' parmi bail/travail/dettes,
 *     triés par richesse (articles + jurisprudence + services), complément jusqu'à 30
 *
 * Si le fichier existe déjà, le script NE L'ÉCRASE PAS (respect de l'existant).
 * Utiliser --force pour regénérer.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const CATALOG_PATH = path.join(ROOT, 'src/data/meta/intents-catalog.json');
const FICHES_DIR = path.join(ROOT, 'src/data/fiches');
const OUT_PATH = path.join(ROOT, 'src/data/meta/regression-invariants.json');

const PRIORITY_DOMAINS = new Set(['bail', 'travail', 'dettes']);
const TARGET_TOTAL = 30;

function loadCatalog() {
  return JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
}

function loadFichesById() {
  const map = new Map();
  for (const f of fs.readdirSync(FICHES_DIR).filter(x => x.endsWith('.json'))) {
    const arr = JSON.parse(fs.readFileSync(path.join(FICHES_DIR, f), 'utf-8'));
    for (const fiche of arr) map.set(fiche.id, fiche);
  }
  return map;
}

function richnessScore(fiche) {
  if (!fiche) return 0;
  const art = (fiche.reponse?.articles || []).length;
  const juris = (fiche.reponse?.jurisprudence || []).length;
  const svc = (fiche.reponse?.services || []).length;
  const casc = (fiche.cascades || []).length;
  return art * 2 + juris * 2 + svc + casc * 3;
}

// --- Détection des types d'escalade depuis le nom du service ---
const ESCALADE_TYPE_PATTERNS = [
  { type: 'asloca', re: /asloca/i },
  { type: 'syndicat', re: /syndicat|unia|sit\b/i },
  { type: 'tribunal', re: /tribunal|prud'?hommes/i },
  { type: 'conciliation', re: /conciliation|autorit[ée]/i },
  { type: 'lavi', re: /lavi/i },
  { type: 'caritas', re: /caritas/i },
  { type: 'csp', re: /centre social|csp\b/i },
  { type: 'office_poursuites', re: /office des poursuites|office.*faillite/i },
  { type: 'egalite', re: /bureau de l.?[ée]galit[ée]/i },
  { type: 'avocat', re: /ordre des avocats|barreau|avocat/i },
];

function detectEscaladeType(serviceName) {
  if (!serviceName) return null;
  for (const p of ESCALADE_TYPE_PATTERNS) {
    if (p.re.test(serviceName)) return p.type;
  }
  return null;
}

function collectEscaladeTypes(fiche) {
  const types = new Set();
  for (const s of (fiche.reponse?.services || [])) {
    const t = detectEscaladeType(s.nom);
    if (t) types.add(t);
  }
  return [...types];
}

// --- Extraction des délais (depuis cascades / étapes) ---
function collectDelaiMatches(fiche) {
  const matches = new Set();
  for (const c of (fiche.cascades || [])) {
    for (const e of (c.etapes || [])) {
      const delai = (e.delai || '').toLowerCase();
      // Capture un chiffre ou un mot clé typique
      const numMatch = delai.match(/\b(\d+)\s*(jour|mois|semaine|an)/);
      if (numMatch) matches.add(numMatch[1] + '|' + numMatch[2]);
      if (/imm[ée]diat/.test(delai)) matches.add('immédiat');
      if (/notif/.test(delai)) matches.add('notification');
      if (/r[ée]ception/.test(delai)) matches.add('réception');
      if (/[ée]ch[ée]ance/.test(delai)) matches.add('échéance');
    }
  }
  return [...matches];
}

// --- Détection confiance ---
function confianceFromFiche(fiche) {
  return (fiche?.confiance || 'variable').toLowerCase();
}

// --- Génération d'invariants pour une fiche ---
function generateInvariants(fiche) {
  const inv = [];
  const articles = (fiche.reponse?.articles || []).map(a => a.ref).filter(Boolean);
  const juris = fiche.reponse?.jurisprudence || [];
  const svcTypes = collectEscaladeTypes(fiche);
  const delais = collectDelaiMatches(fiche);

  // 1. article_present pour chaque article cité (max 3 pour éviter bruit)
  for (const ref of articles.slice(0, 3)) {
    inv.push({ type: 'article_present', value: ref });
  }

  // 2. article_with_source_id (regex = premier article, adapté)
  if (articles.length > 0) {
    const first = articles[0];
    // Regex qui match au moins le premier article exactement
    const ref_regex = first.replace(/([.*+?^${}()|[\]\\])/g, '\\$1');
    inv.push({ type: 'article_with_source_id', ref_regex });
  }

  // 3. jurisprudence_min_count
  if (juris.length > 0) {
    inv.push({ type: 'jurisprudence_min_count', value: Math.min(juris.length, 2) });
  }

  // 4. escalade_type_present : prendre le 1er type détecté
  if (svcTypes.length > 0) {
    inv.push({ type: 'escalade_type_present', value: svcTypes[0] });
  }

  // 5. delai_exists : si cascades présentes, prendre un délai représentatif
  if (delais.length > 0) {
    // Préférer un délai numérique (ex : "30|jour") si dispo
    const numeric = delais.find(d => /\|/.test(d));
    const chosen = numeric || delais[0];
    const parts = chosen.split('|');
    const match = parts.length === 2
      ? `${parts[0]}|${parts[1].slice(0, 4)}`  // "30|jour"
      : chosen;
    inv.push({ type: 'delai_exists', match });
  }

  // 6. confiance_at_least — verrouille le niveau actuel
  const conf = confianceFromFiche(fiche);
  if (conf && conf !== 'incertain') {
    inv.push({ type: 'confiance_at_least', value: conf });
  }

  // 7. template_exists si la fiche a un modèle lettre
  if (fiche.reponse?.modeleLettre && fiche.reponse.modeleLettre.length > 50) {
    inv.push({ type: 'template_exists' });
  }

  // 8. tag_present — prendre un tag significatif (pas trop générique)
  const tags = (fiche.tags || []);
  const goodTag = tags.find(t => t && t.length >= 5 && !['droit', 'loi'].includes(t.toLowerCase()));
  if (goodTag) {
    inv.push({ type: 'tag_present', value: goodTag });
  }

  return inv;
}

// --- Sélection des 30 intents prioritaires ---
function selectIntents(catalog, fichesById) {
  const complete = catalog.filter(i => i.etat_couverture === 'complete');
  const partial = catalog
    .filter(i => i.etat_couverture === 'partial' && i.domaines.some(d => PRIORITY_DOMAINS.has(d)))
    .map(i => ({ intent: i, score: richnessScore(fichesById.get(i.id)) }))
    .sort((a, b) => b.score - a.score)
    .map(x => x.intent);

  const selected = [];
  // Tous les complete (priority high)
  for (const i of complete) {
    const fiche = fichesById.get(i.id);
    if (!fiche) continue;
    selected.push({ intent: i, priority: 'high' });
  }

  // Compléter jusqu'à TARGET_TOTAL avec les meilleurs partial
  for (const i of partial) {
    if (selected.length >= TARGET_TOTAL) break;
    const fiche = fichesById.get(i.id);
    if (!fiche) continue;
    // Éviter les fiches très pauvres (< 2 articles OU 0 juris + 0 svc)
    const art = (fiche.reponse?.articles || []).length;
    const juris = (fiche.reponse?.jurisprudence || []).length;
    const svc = (fiche.reponse?.services || []).length;
    if (art < 2) continue;
    if (juris === 0 && svc === 0) continue;
    selected.push({ intent: i, priority: 'medium' });
  }

  return selected.slice(0, TARGET_TOTAL);
}

function buildDef({ intent, priority }, fiche) {
  const invariants = generateInvariants(fiche);
  return {
    intent_id: intent.id,
    fiche_id: intent.fiches_associees?.[0] || intent.id,
    domaine: intent.domaines?.[0] || fiche.domaine || 'unknown',
    priority,
    invariants,
  };
}

function main() {
  const force = process.argv.includes('--force');
  if (fs.existsSync(OUT_PATH) && !force) {
    console.log(`[seed] ${path.relative(ROOT, OUT_PATH)} existe déjà — respect de l'existant. Utiliser --force pour regénérer.`);
    return;
  }

  const catalog = loadCatalog();
  const fichesById = loadFichesById();
  const selected = selectIntents(catalog, fichesById);

  const defs = [];
  for (const s of selected) {
    const fiche = fichesById.get(s.intent.id);
    if (!fiche) continue;
    const def = buildDef(s, fiche);
    if (def.invariants.length < 4) {
      console.warn(`[seed] ${s.intent.id} a seulement ${def.invariants.length} invariants — skip`);
      continue;
    }
    defs.push(def);
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(defs, null, 2) + '\n', 'utf-8');

  const byPriority = { high: 0, medium: 0 };
  let totalInv = 0;
  for (const d of defs) {
    byPriority[d.priority]++;
    totalInv += d.invariants.length;
  }
  console.log(`[seed] Écrit ${defs.length} intents → ${path.relative(ROOT, OUT_PATH)}`);
  console.log(`[seed] high=${byPriority.high} medium=${byPriority.medium} | invariants=${totalInv}`);
}

main();
