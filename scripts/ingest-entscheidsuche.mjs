#!/usr/bin/env node
/**
 * ingest-entscheidsuche.mjs — Ingestion de jurisprudence cantonale depuis
 * entscheidsuche.ch (projet open source, 800'000+ décisions agrégées).
 *
 * Positionnement : les arrêts TF sont publics sur tf.ch. La jurisprudence
 * cantonale et de 1ère instance est fragmentée dans 26 systèmes → invisible
 * pour le citoyen. Entscheidsuche.ch fait le travail d'agrégation libre.
 * Nous l'ingérons et matchons aux fiches citoyennes.
 *
 * Modes :
 *   --mock            : génère 10-20 décisions fictives pour dev/CI (défaut)
 *   --live            : appelle la vraie API entscheidsuche.ch
 *   --limit N         : plafonne le nombre de décisions ingérées
 *   --canton XX       : filtre par canton (VD, GE, ZH, …)
 *   --domaine XX      : filtre par domaine (bail, travail, …)
 *
 * Output :
 *   - src/data/jurisprudence-cantonale/entscheidsuche-<YYYY-MM-DD>.json
 *   - src/data/meta/entscheidsuche-ingestion-log.json (append)
 *
 * Non-breaking : ne modifie pas les fichiers `index-*.json` existants
 * (jurisprudence TF). Crée un corpus parallèle cantonal.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'src/data/jurisprudence-cantonale');
const LOG_PATH = join(ROOT, 'src/data/meta/entscheidsuche-ingestion-log.json');

// Config API entscheidsuche (à confirmer avec leur équipe en mode live)
const ENTSCHEIDSUCHE_ENDPOINT = process.env.ENTSCHEIDSUCHE_URL || 'https://entscheidsuche.ch/_search';
const DEFAULT_LIMIT = 100;

function parseFlags(argv) {
  const flags = { mock: true, live: false, limit: DEFAULT_LIMIT, canton: null, domaine: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--live') { flags.live = true; flags.mock = false; }
    else if (a === '--mock') { flags.mock = true; flags.live = false; }
    else if (a === '--limit') flags.limit = parseInt(argv[++i], 10) || DEFAULT_LIMIT;
    else if (a === '--canton') flags.canton = argv[++i];
    else if (a === '--domaine') flags.domaine = argv[++i];
  }
  return flags;
}

function hashDecision(d) {
  return createHash('sha256')
    .update(String(d.court || '') + '|' + String(d.date || '') + '|' + String(d.title || '').slice(0, 100))
    .digest('hex').slice(0, 16);
}

// ─── Mode MOCK ────────────────────────────────────────────────────

function generateMockDecisions(flags) {
  const MOCK_CANTONS = ['VD', 'GE', 'ZH', 'BE', 'BS', 'TI', 'NE', 'FR'];
  const MOCK_DOMAINS = ['bail', 'travail', 'famille', 'dettes', 'etrangers', 'assurances'];
  const MOCK_COURTS = {
    VD: ['Tribunal cantonal VD — Cour civile', 'Tribunal cantonal VD — Cour de droit public'],
    GE: ['Cour de justice GE — Chambre des baux et loyers', 'Cour de justice GE — Chambre des prud\'hommes'],
    ZH: ['Obergericht ZH — Handelsgericht', 'Bezirksgericht Zürich'],
    BE: ['Obergericht BE — Zivilabteilung'],
    BS: ['Appellationsgericht BS'],
    TI: ['Tribunale d\'appello TI'],
    NE: ['Cour de cassation NE'],
    FR: ['Tribunal cantonal FR']
  };
  const results = [];
  for (let i = 0; i < Math.min(flags.limit, 20); i++) {
    const canton = flags.canton || MOCK_CANTONS[i % MOCK_CANTONS.length];
    const domaine = flags.domaine || MOCK_DOMAINS[i % MOCK_DOMAINS.length];
    const courts = MOCK_COURTS[canton] || ['Tribunal cantonal ' + canton];
    const court = courts[i % courts.length];
    const year = 2020 + (i % 5);
    const date = `${year}-${String(((i * 7) % 12) + 1).padStart(2, '0')}-${String(((i * 11) % 28) + 1).padStart(2, '0')}`;
    results.push({
      source: 'entscheidsuche.ch (mock)',
      canton,
      court,
      date,
      domaine,
      title: `Mock ${domaine} ${canton} n°${i + 1}`,
      summary: `Décision cantonale simulée pour ${domaine} dans ${canton}. Applique les règles du droit suisse.`,
      text_excerpt: `Considérant que...\n\nLe tribunal considère que la jurisprudence constante sur ${domaine} s'applique ici.`,
      references: pickReferences(domaine),
      result: i % 3 === 0 ? 'favorable_demandeur' : (i % 3 === 1 ? 'defavorable_demandeur' : 'partiellement_admis'),
      url: `https://entscheidsuche.ch/mock/${canton}-${year}-${i}`
    });
  }
  return results;
}

function pickReferences(domaine) {
  const byDomain = {
    bail: ['CO 257e', 'CO 259a', 'CO 266', 'CO 273'],
    travail: ['CO 336', 'CO 336c', 'CO 337', 'CO 329'],
    famille: ['CC 125', 'CC 276', 'CC 298', 'CC 273'],
    dettes: ['LP 74', 'LP 80', 'LP 82', 'LP 93'],
    etrangers: ['LEI 42', 'LEI 62', 'LEI 66', 'LAsi 108'],
    assurances: ['LPGA 52', 'LAA 36', 'LAI 28', 'LAMal 25']
  };
  const pool = byDomain[domaine] || ['CO 1'];
  return pool.slice(0, 2);
}

// ─── Mode LIVE ────────────────────────────────────────────────────

async function fetchLiveDecisions(flags) {
  // Proposition de requête Elasticsearch-like entscheidsuche.
  // L'API réelle peut requérir une auth/clé — à confirmer avec leur équipe.
  const query = {
    size: flags.limit,
    query: {
      bool: {
        must: []
      }
    }
  };
  if (flags.canton) query.query.bool.must.push({ term: { canton: flags.canton } });
  if (flags.domaine) query.query.bool.must.push({ match: { domain: flags.domaine } });

  try {
    const resp = await fetch(ENTSCHEIDSUCHE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    // Normalisation : adapter au format réel d'entscheidsuche
    const hits = data.hits?.hits || [];
    return hits.map(h => ({
      source: 'entscheidsuche.ch',
      canton: h._source?.canton || null,
      court: h._source?.court || h._source?.issuer || null,
      date: h._source?.date || null,
      domaine: h._source?.domain || null,
      title: h._source?.title || null,
      summary: h._source?.abstract || h._source?.text?.slice(0, 300),
      text_excerpt: h._source?.text?.slice(0, 1000),
      references: h._source?.references || [],
      result: h._source?.outcome || null,
      url: h._source?.url || null
    }));
  } catch (e) {
    console.error(`[entscheidsuche-live] erreur : ${e.message}`);
    console.error('[entscheidsuche-live] fallback automatique vers mode mock');
    return generateMockDecisions(flags);
  }
}

// ─── Ingestion ────────────────────────────────────────────────────

function appendLog(entry) {
  mkdirSync(dirname(LOG_PATH), { recursive: true });
  let log = [];
  if (existsSync(LOG_PATH)) {
    try { log = JSON.parse(readFileSync(LOG_PATH, 'utf8')); } catch { log = []; }
  }
  if (!Array.isArray(log)) log = [];
  log.push(entry);
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2), 'utf8');
}

async function main() {
  const flags = parseFlags(process.argv);
  const mode = flags.live ? 'live' : 'mock';

  console.log(`[entscheidsuche] mode=${mode} limit=${flags.limit} canton=${flags.canton || 'all'} domaine=${flags.domaine || 'all'}`);

  const decisions = flags.live ? await fetchLiveDecisions(flags) : generateMockDecisions(flags);

  // Dédoublonnage par hash
  const seen = new Set();
  const unique = [];
  for (const d of decisions) {
    const h = hashDecision(d);
    if (seen.has(h)) continue;
    seen.add(h);
    unique.push({ ...d, hash: h, ingested_at: new Date().toISOString() });
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const outPath = join(OUT_DIR, `entscheidsuche-${today}.json`);
  writeFileSync(outPath, JSON.stringify(unique, null, 2), 'utf8');

  // Index par canton et par domaine
  const byCanton = {};
  const byDomaine = {};
  for (const d of unique) {
    if (d.canton) byCanton[d.canton] = (byCanton[d.canton] || 0) + 1;
    if (d.domaine) byDomaine[d.domaine] = (byDomaine[d.domaine] || 0) + 1;
  }

  appendLog({
    ran_at: new Date().toISOString(),
    mode,
    flags,
    count: unique.length,
    by_canton: byCanton,
    by_domaine: byDomaine,
    out_file: outPath
  });

  console.log(`[entscheidsuche] ${unique.length} décisions ingérées → ${outPath}`);
  console.log(`[entscheidsuche] par canton :`, byCanton);
  console.log(`[entscheidsuche] par domaine :`, byDomaine);
  return { count: unique.length, path: outPath };
}

if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes('ingest-entscheidsuche')) {
  main().catch(e => { console.error(e); process.exit(1); });
}

export { main, generateMockDecisions, hashDecision };
