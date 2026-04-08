/**
 * Fedlex Harvester — Aspiration automatique des lois fédérales suisses
 * Source: Fedlex SPARQL API (https://fedlex.data.admin.ch/sparql)
 *
 * Usage: node scripts/fedlex-harvester.mjs [--domaine bail|travail|famille|dettes|etrangers]
 * Cron: 1x/semaine
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');
const loiDir = join(dataDir, 'loi');
const logFile = join(dataDir, 'meta', 'harvest-log.json');

// RS numbers by domaine — the laws we care about
const RS_MAP = {
  bail: [
    { rs: '220', titre: 'Code des obligations (CO)', articles: '253-274g' },
    { rs: '221.213.11', titre: 'OBLF (Ordonnance sur le bail à loyer)', articles: 'all' },
    { rs: '221.213.111', titre: 'OBCL (Ordonnance sur les baux à loyer commerciaux)', articles: 'all' },
  ],
  travail: [
    { rs: '220', titre: 'Code des obligations (CO)', articles: '319-362' },
    { rs: '822.11', titre: 'Loi sur le travail (LTr)', articles: 'all' },
    { rs: '837.0', titre: 'Loi sur l\'assurance-chômage (LACI)', articles: 'all' },
    { rs: '151.1', titre: 'Loi sur l\'égalité (LEg)', articles: 'all' },
  ],
  famille: [
    { rs: '210', titre: 'Code civil suisse (CC)', articles: '90-456' },
    { rs: '211.231', titre: 'Ordonnance sur le droit du nom', articles: 'all' },
  ],
  dettes: [
    { rs: '281.1', titre: 'Loi sur la poursuite et la faillite (LP)', articles: 'all' },
    { rs: '220', titre: 'Code des obligations (CO)', articles: '68-83,97-109' },
  ],
  etrangers: [
    { rs: '142.20', titre: 'Loi sur les étrangers et l\'intégration (LEI)', articles: 'all' },
    { rs: '142.31', titre: 'Loi sur l\'asile (LAsi)', articles: 'all' },
    { rs: '141.0', titre: 'Loi sur la nationalité suisse (LN)', articles: 'all' },
  ]
};

const FEDLEX_ENDPOINT = 'https://fedlex.data.admin.ch/sparqlendpoint';

// SPARQL query to get articles for a given RS number
function buildQuery(rsNumber) {
  return `
PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT DISTINCT ?article ?title ?text ?dateEntree WHERE {
  ?act jolux:classifiedByTaxonomyEntry <https://fedlex.data.admin.ch/vocabulary/legal-taxonomy/${rsNumber}> .
  ?act jolux:isRealizedBy ?expression .
  ?expression jolux:language <http://publications.europa.eu/resource/authority/language/FRA> .
  ?expression rdfs:label ?title .
  OPTIONAL { ?expression jolux:dateEntryInForce ?dateEntree . }
  OPTIONAL { ?expression jolux:hasTextualContent ?text . }
  ?act jolux:classifiedByTaxonomyEntry ?article .
}
LIMIT 500
`;
}

// HTTP request helper (native Node.js, no deps)
function sparqlQuery(query) {
  return new Promise((resolve, reject) => {
    const postData = `query=${encodeURIComponent(query)}`;
    const options = {
      hostname: 'fedlex.data.admin.ch',
      port: 443,
      path: '/sparqlendpoint',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`SPARQL error ${res.statusCode}: ${body.slice(0, 200)}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Invalid JSON from Fedlex: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Alternative: use the Fedlex REST API for classified texts
function fetchRSMetadata(rsNumber) {
  return new Promise((resolve, reject) => {
    const url = `https://www.fedlex.admin.ch/eli/cc/${rsNumber}/fr`;
    const req = https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body.slice(0, 500) });
        }
      });
    });
    req.on('error', reject);
  });
}

// Load existing harvest log
function loadLog() {
  if (!existsSync(logFile)) return { runs: [], lastRun: null };
  return JSON.parse(readFileSync(logFile, 'utf-8'));
}

function saveLog(log) {
  const metaDir = join(dataDir, 'meta');
  if (!existsSync(metaDir)) mkdirSync(metaDir, { recursive: true });
  writeFileSync(logFile, JSON.stringify(log, null, 2), 'utf-8');
}

// Main harvest function
async function harvest(domaines) {
  const log = loadLog();
  const results = { date: new Date().toISOString(), domaines: {}, errors: [] };

  for (const domaine of domaines) {
    const sources = RS_MAP[domaine];
    if (!sources) {
      results.errors.push(`Domaine inconnu: ${domaine}`);
      continue;
    }

    console.log(`\n--- Harvesting: ${domaine} ---`);
    const articles = [];

    for (const source of sources) {
      console.log(`  Fetching RS ${source.rs} (${source.titre})...`);
      try {
        const query = buildQuery(source.rs);
        const data = await sparqlQuery(query);

        if (data.results?.bindings) {
          for (const binding of data.results.bindings) {
            articles.push({
              ref: binding.article?.value?.split('/').pop() || '',
              titre: binding.title?.value || source.titre,
              texte: binding.text?.value?.slice(0, 500) || '',
              dateEntreeVigueur: binding.dateEntree?.value || null,
              source: `RS ${source.rs}`,
              lienFedlex: `https://www.fedlex.admin.ch/eli/cc/${source.rs}/fr`,
              domaine,
              harvestDate: new Date().toISOString()
            });
          }
          console.log(`  → ${data.results.bindings.length} résultats`);
        }
      } catch (err) {
        console.error(`  ✗ Erreur RS ${source.rs}: ${err.message}`);
        results.errors.push({ rs: source.rs, error: err.message });
      }
    }

    // Save to domain-specific file
    const outFile = join(loiDir, `${domaine}-fedlex.json`);
    writeFileSync(outFile, JSON.stringify(articles, null, 2), 'utf-8');
    results.domaines[domaine] = { articles: articles.length, file: outFile };
    console.log(`  → Total ${domaine}: ${articles.length} articles → ${outFile}`);
  }

  // Update log
  log.runs.push(results);
  log.lastRun = results.date;
  saveLog(log);

  return results;
}

// CLI
const args = process.argv.slice(2);
const domaineArg = args.find(a => a.startsWith('--domaine='))?.split('=')[1]
  || (args.includes('--domaine') ? args[args.indexOf('--domaine') + 1] : null);

const domaines = domaineArg ? [domaineArg] : Object.keys(RS_MAP);

console.log(`Fedlex Harvester — ${new Date().toISOString()}`);
console.log(`Domaines: ${domaines.join(', ')}`);

harvest(domaines).then(results => {
  console.log('\n=== Résultats ===');
  for (const [d, r] of Object.entries(results.domaines)) {
    console.log(`  ${d}: ${r.articles} articles`);
  }
  if (results.errors.length) {
    console.log(`  ⚠ ${results.errors.length} erreur(s)`);
  }
}).catch(err => {
  console.error('Harvest failed:', err);
  process.exit(1);
});

export { harvest, RS_MAP, sparqlQuery };
