/**
 * Jurisprudence Harvester v2 — Aspiration des arrêts du TF et cantonaux
 * Source: entscheidsuche.ch JSON files + bger.ch
 *
 * Strategy: entscheidsuche.ch's REST API is dead (404 since ~2025).
 * But individual JSON files are still accessible at /docs/CH_BGer/
 * We construct filenames from known case reference patterns.
 *
 * Usage: node scripts/jurisprudence-harvester.mjs [--domaine bail] [--limit 100]
 * Cron: 1x/semaine
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');
const jurisDir = join(dataDir, 'jurisprudence');
const logFile = join(dataDir, 'meta', 'jurisprudence-log.json');

// BGer chambers relevant to each domaine
// Chamber 004 = I. Zivilrechtliche Abteilung (4A_ = contract, bail, travail)
// Chamber 005 = II. Zivilrechtliche Abteilung (5A_ = famille, tutelle)
// Chamber 002 = II. Öffentlich-rechtliche (2C_ = étrangers)
// Chamber 010 = Schuldbetreibungs- und Konkurskammer (dettes, faillite)
// Chamber 008 = Sozialrecht (assurances sociales)
const DOMAINE_CHAMBERS = {
  bail: [
    { chamber: '004', prefix: '4A', keywords: ['bail', 'loyer', 'locataire', 'bailleur', 'résiliation', 'CO 253', 'CO 259', 'CO 271', 'CO 269', 'CO 261', 'CO 267', 'défaut de la chose louée'] },
  ],
  travail: [
    { chamber: '004', prefix: '4A', keywords: ['travail', 'licenciement', 'salaire', 'CO 319', 'CO 336', 'congé', 'contrat de travail', 'délai de congé'] },
  ],
  famille: [
    { chamber: '005', prefix: '5A', keywords: ['divorce', 'garde', 'pension alimentaire', 'CC 133', 'CC 176', 'autorité parentale', 'séparation', 'entretien', 'CC 125', 'CC 285'] },
  ],
  dettes: [
    { chamber: '005', prefix: '5A', keywords: ['poursuite', 'faillite', 'mainlevée', 'LP 74', 'LP 82', 'commandement', 'opposition', 'saisie'] },
    { chamber: '004', prefix: '4A', keywords: ['dette', 'créance', 'compensation', 'CO 68', 'CO 97'] },
  ],
  etrangers: [
    { chamber: '002', prefix: '2C', keywords: ['séjour', 'renvoi', 'regroupement familial', 'naturalisation', 'asile', 'LEI', 'permis', 'LEtr'] },
    { chamber: '002', prefix: '2D', keywords: ['assistance', 'aide sociale', 'étranger'] },
  ]
};

// Case number ranges to try — we generate plausible filenames
// entscheidsuche.ch format: CH_BGer_XXX_PREFIX-NUM-YEAR_YYYY-MM-DD.json
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const CASE_NUMBERS = [];
// Generate case numbers 1-600 for good coverage
for (let i = 1; i <= 600; i++) CASE_NUMBERS.push(i);

// HTTP GET helper with timeout
function httpGet(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = https.get({
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: { 'Accept': 'application/json', 'User-Agent': 'JusticeBot-Harvester/2.0' },
      timeout
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Fetch a single decision JSON from entscheidsuche.ch
// We don't know the exact date, so we need to try the directory listing
// OR we can batch-fetch from the directory listing
async function fetchDecisionDirect(chamber, prefix, caseNum, year) {
  // Try to construct URL: CH_BGer_XXX_PREFIX-NUM-YEAR_YYYY-MM-DD.json
  // Problem: we don't know the exact date.
  // Solution: use bger.ch search to get case references, then map to entscheidsuche files
  const padChamber = chamber.padStart(3, '0');
  // Pattern: CH_BGer_004_4A-100-2024_2024-05-07.json
  // We don't know the date part, so this approach won't work directly.
  // Instead, we'll use bger.ch to search and get case metadata.
  return null;
}

// Search bger.ch for decisions matching a query
async function searchBger(query, numDocs = 50) {
  const params = new URLSearchParams({
    lang: 'fr',
    type: 'simple_query',
    query: query,
    method: 'and',
    num_docs: String(numDocs),
    from_date: '01.01.2018',
    to_date: '31.12.2026'
  });

  const url = `https://www.bger.ch/ext/eurospider/live/fr/php/aza/http/index.php?${params.toString()}`;

  try {
    const res = await httpGet(url, 20000);
    if (res.status !== 200) return [];
    return parseBgerHtml(res.body);
  } catch (e) {
    console.error(`    bger.ch search error: ${e.message}`);
    return [];
  }
}

// Parse bger.ch HTML search results to extract case references
function parseBgerHtml(html) {
  const results = [];

  // bger.ch returns HTML with case links like:
  // <a href="...azaclir=aza&highlight_docid=aza://DD-MM-YYYY-REF...">REFERENCE</a>
  // And date/regeste info

  // Pattern 1: Extract case references from highlight_docid
  const docidRegex = /highlight_docid=aza%3A%2F%2F(\d{2})-(\d{2})-(\d{4})-([^&"]+)/g;
  let match;

  while ((match = docidRegex.exec(html)) !== null) {
    const day = match[1], month = match[2], year = match[3], ref = match[4];
    const date = `${year}-${month}-${day}`;
    const signature = decodeURIComponent(ref).replace(/-/g, '_').replace(/_/g, '/').replace(/^(\d[A-Z])\//, '$1_');

    // Clean up the signature
    const cleanRef = ref.replace(/-/g, '.').replace(/\.(\d{4})$/, '/$1');

    results.push({
      signature: cleanRef,
      date,
      rawRef: ref,
      year: parseInt(year)
    });
  }

  // Pattern 2: Also try to extract from visible text
  const refRegex = /(\d[A-Z])[_.](\d+)\/(\d{4})/g;
  while ((match = refRegex.exec(html)) !== null) {
    const sig = `${match[1]}_${match[2]}/${match[3]}`;
    if (!results.find(r => r.signature === sig)) {
      results.push({ signature: sig, date: null, rawRef: `${match[1]}-${match[2]}-${match[3]}`, year: parseInt(match[3]) });
    }
  }

  return results;
}

// Fetch decision detail from entscheidsuche.ch using the reference
async function fetchDecisionFromEntscheidsuche(ref, date, chamber) {
  // Construct filename: CH_BGer_XXX_REF_DATE.json
  // ref format: 4A-100-2024, date format: 2024-05-07
  if (!date) return null;

  const padChamber = chamber.padStart(3, '0');
  const filename = `CH_BGer_${padChamber}_${ref}_${date}.json`;
  const url = `https://entscheidsuche.ch/docs/CH_BGer/${filename}`;

  try {
    const res = await httpGet(url, 8000);
    if (res.status === 200) {
      return JSON.parse(res.body);
    }
  } catch (e) {
    // File not found or parse error
  }
  return null;
}

// Extract article references from text
function extractArticleRefs(text) {
  if (!text) return [];
  const refs = new Set();
  const patterns = [
    /art\.?\s*(\d+[a-z]?(?:\s+al\.?\s*\d+)?)\s+(CO|CC|LP|LEI|LAsi|LTr|LACI|CPC|CPP)/gi,
    /(CO|CC|LP|LEI|LAsi|LTr|LACI|CPC|CPP)\s+(\d+[a-z]?(?:\s+al\.?\s*\d+)?)/gi,
    /ATF\s+(\d+\s+[IVX]+\s+\d+)/gi
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      refs.add(match[0].trim());
    }
  }
  return [...refs];
}

// Determine domaine relevance of a decision based on its content
function isRelevantForDomaine(decision, domaine) {
  const chamberConfig = DOMAINE_CHAMBERS[domaine];
  if (!chamberConfig) return false;

  const textToSearch = [
    decision.resume || '',
    decision.principe || '',
    ...(decision.Abstract || []).map(a => a.Text || ''),
    ...(decision.Kopfzeile || []).map(k => k.Text || '')
  ].join(' ').toLowerCase();

  for (const config of chamberConfig) {
    if (config.keywords.some(kw => textToSearch.includes(kw.toLowerCase()))) {
      return true;
    }
  }
  return false;
}

// Convert entscheidsuche.ch format to our format
function convertToOurFormat(esDoc, domaine) {
  const frAbstract = (esDoc.Abstract || []).find(a =>
    (a.Sprachen || []).includes('fr') || (a.Text || '').match(/[àéèêëïîôùûüç]/i)
  );
  const frKopf = (esDoc.Kopfzeile || []).find(k =>
    (k.Sprachen || []).includes('fr')
  );

  const resume = frAbstract?.Text || (esDoc.Abstract || [])[0]?.Text || '';
  const kopf = frKopf?.Text || (esDoc.Kopfzeile || [])[0]?.Text || '';

  const allText = resume + ' ' + kopf;

  return {
    signature: (esDoc.Num || [])[0] || esDoc.Signatur || '',
    date: esDoc.Datum || null,
    tribunal: 'TF',
    domaine,
    resume: resume.slice(0, 500),
    principe: kopf.slice(0, 300),
    articlesLies: extractArticleRefs(allText),
    url: esDoc.HTML?.URL || `https://www.bger.ch`,
    harvestDate: new Date().toISOString(),
    source: 'entscheidsuche.ch'
  };
}

// Generate synthetic decisions from bger.ch search results when entscheidsuche files aren't available
function createFromBgerResult(ref, date, domaine, searchQuery) {
  return {
    signature: ref.replace(/-/g, '.').replace(/\.(\d{4})$/, '/$1') || ref,
    date: date || null,
    tribunal: 'TF',
    domaine,
    resume: '',
    principe: '',
    articlesLies: [],
    url: `https://www.bger.ch/ext/eurospider/live/fr/php/aza/http/index.php?lang=fr&type=show_document&highlight_docid=aza%3A%2F%2F${date ? date.split('-').reverse().join('-') : ''}-${ref}`,
    harvestDate: new Date().toISOString(),
    source: 'bger.ch',
    searchQuery
  };
}

// Load existing
function loadLog() {
  if (!existsSync(logFile)) return { runs: [], lastRun: null };
  try { return JSON.parse(readFileSync(logFile, 'utf-8')); } catch { return { runs: [], lastRun: null }; }
}

function saveLog(log) {
  const metaDir = join(dataDir, 'meta');
  if (!existsSync(metaDir)) mkdirSync(metaDir, { recursive: true });
  writeFileSync(logFile, JSON.stringify(log, null, 2), 'utf-8');
}

function loadExistingArrets(domaine) {
  const file = join(jurisDir, `index-${domaine}.json`);
  if (!existsSync(file)) return [];
  try { return JSON.parse(readFileSync(file, 'utf-8')); } catch { return []; }
}

// Batch search bger.ch with multiple queries
async function batchSearchBger(keywords, limit) {
  const allResults = [];
  const seenRefs = new Set();

  for (const keyword of keywords) {
    console.log(`    Searching bger.ch: "${keyword}"...`);
    try {
      const results = await searchBger(keyword, limit);
      let newCount = 0;
      for (const r of results) {
        const key = r.signature || r.rawRef;
        if (!seenRefs.has(key)) {
          seenRefs.add(key);
          r.searchQuery = keyword;
          allResults.push(r);
          newCount++;
        }
      }
      console.log(`      => ${results.length} results, ${newCount} new`);

      // Rate limiting — be respectful
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`      ERROR: ${e.message}`);
    }
  }

  return allResults;
}

// Try to enrich from entscheidsuche.ch
async function enrichFromEntscheidsuche(bgerResults, chamber, concurrency = 5) {
  const enriched = [];
  let found = 0;

  // Process in batches
  for (let i = 0; i < bgerResults.length; i += concurrency) {
    const batch = bgerResults.slice(i, i + concurrency);
    const promises = batch.map(async (r) => {
      const doc = await fetchDecisionFromEntscheidsuche(r.rawRef, r.date, chamber);
      if (doc) {
        found++;
        return { bger: r, es: doc };
      }
      return { bger: r, es: null };
    });

    const results = await Promise.all(promises);
    enriched.push(...results);

    if (i % 20 === 0 && i > 0) {
      console.log(`      Progress: ${i}/${bgerResults.length}, enriched: ${found}`);
    }
  }

  return enriched;
}

async function harvest(domaines, limit) {
  if (!existsSync(jurisDir)) mkdirSync(jurisDir, { recursive: true });

  const log = loadLog();
  const results = { date: new Date().toISOString(), domaines: {}, errors: [] };

  for (const domaine of domaines) {
    const configs = DOMAINE_CHAMBERS[domaine];
    if (!configs) {
      results.errors.push(`Domaine inconnu: ${domaine}`);
      continue;
    }

    console.log(`\n--- Harvesting jurisprudence: ${domaine} ---`);
    const existing = loadExistingArrets(domaine);
    const existingIds = new Set(existing.map(a => a.signature));
    const newArrets = [];

    for (const config of configs) {
      console.log(`  Chamber ${config.chamber} (${config.prefix}_):`);

      // Step 1: Search bger.ch for case references
      const bgerResults = await batchSearchBger(config.keywords, limit);
      console.log(`    Total unique from bger.ch: ${bgerResults.length}`);

      // Step 2: Try to enrich from entscheidsuche.ch
      console.log(`    Enriching from entscheidsuche.ch...`);
      const enriched = await enrichFromEntscheidsuche(bgerResults, config.chamber);

      // Step 3: Convert to our format
      for (const item of enriched) {
        let arret;
        if (item.es) {
          arret = convertToOurFormat(item.es, domaine);
        } else {
          arret = createFromBgerResult(
            item.bger.rawRef,
            item.bger.date,
            domaine,
            item.bger.searchQuery
          );
        }

        if (!existingIds.has(arret.signature) && arret.signature) {
          newArrets.push(arret);
          existingIds.add(arret.signature);
        }
      }
    }

    // Merge with existing
    const merged = [...existing, ...newArrets];
    const outFile = join(jurisDir, `index-${domaine}.json`);
    writeFileSync(outFile, JSON.stringify(merged, null, 2), 'utf-8');

    results.domaines[domaine] = {
      existing: existing.length,
      new: newArrets.length,
      total: merged.length,
      file: outFile
    };
    console.log(`  => ${domaine}: +${newArrets.length} new => total ${merged.length}`);
  }

  log.runs.push(results);
  log.lastRun = results.date;
  saveLog(log);

  return results;
}

// CLI
const args = process.argv.slice(2);
const domaineArg = args.find(a => a.startsWith('--domaine='))?.split('=')[1]
  || (args.includes('--domaine') ? args[args.indexOf('--domaine') + 1] : null);
const limitArg = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]
  || (args.includes('--limit') ? args[args.indexOf('--limit') + 1] : '100'));

const domaines = domaineArg ? [domaineArg] : Object.keys(DOMAINE_CHAMBERS);

console.log(`Jurisprudence Harvester v2 — ${new Date().toISOString()}`);
console.log(`Domaines: ${domaines.join(', ')} | Limit: ${limitArg}/keyword`);

harvest(domaines, limitArg).then(results => {
  console.log('\n=== Results ===');
  let totalNew = 0, totalAll = 0;
  for (const [d, r] of Object.entries(results.domaines)) {
    console.log(`  ${d}: +${r.new} new => total ${r.total}`);
    totalNew += r.new;
    totalAll += r.total;
  }
  console.log(`  TOTAL: +${totalNew} new, ${totalAll} total`);
  if (results.errors.length) {
    console.log(`  WARNING: ${results.errors.length} error(s)`);
  }
}).catch(err => {
  console.error('Harvest failed:', err);
  process.exit(1);
});

export { harvest, DOMAINE_CHAMBERS, extractArticleRefs };
