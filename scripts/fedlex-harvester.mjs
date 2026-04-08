/**
 * Fedlex Harvester — Aspiration automatique des lois fédérales suisses
 * Source: Fedlex HTML filestore + SPARQL for metadata
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

// ELI URIs mapped from SPARQL (verified April 2026)
// Format: { rs, titre, eliPath, consolidationDate, articles (range or 'all'), domaines }
const LAW_SOURCES = {
  bail: [
    { rs: '220', titre: 'Code des obligations (CO)', eliPath: 'eli/cc/27/317_321_377', articleRange: [253, 274], prefix: 'CO' },
    { rs: '221.213.11', titre: 'OBLF (Ordonnance sur le bail à loyer)', eliPath: 'eli/cc/1990/835_835_835', articleRange: null, prefix: 'OBLF' },
    { rs: '221.213.111', titre: 'OBCL', eliPath: 'eli/cc/2008/60', articleRange: null, prefix: 'OBCL' },
  ],
  travail: [
    { rs: '220', titre: 'Code des obligations (CO)', eliPath: 'eli/cc/27/317_321_377', articleRange: [319, 362], prefix: 'CO' },
    { rs: '822.11', titre: 'Loi sur le travail (LTr)', eliPath: 'eli/cc/1966/57_57_57', articleRange: null, prefix: 'LTr' },
    { rs: '837.0', titre: 'Loi sur l\'assurance-chômage (LACI)', eliPath: 'eli/cc/1982/2184_2184_2184', articleRange: null, prefix: 'LACI' },
    { rs: '151.1', titre: 'Loi sur l\'égalité (LEg)', eliPath: 'eli/cc/1996/1498_1498_1498', articleRange: null, prefix: 'LEg' },
  ],
  famille: [
    { rs: '210', titre: 'Code civil suisse (CC)', eliPath: 'eli/cc/24/233_245_233', articleRange: [90, 456], prefix: 'CC' },
    { rs: '211.231', titre: 'Ordonnance sur le droit du nom', eliPath: 'eli/cc/2005/782', articleRange: null, prefix: 'OEN' },
  ],
  dettes: [
    { rs: '281.1', titre: 'Loi sur la poursuite et la faillite (LP)', eliPath: 'eli/cc/11/529_488_529', articleRange: null, prefix: 'LP' },
    { rs: '220', titre: 'Code des obligations (CO)', eliPath: 'eli/cc/27/317_321_377', articleRange: [68, 109], prefix: 'CO' },
  ],
  etrangers: [
    { rs: '142.20', titre: 'Loi sur les étrangers et l\'intégration (LEI)', eliPath: 'eli/cc/2007/758', articleRange: null, prefix: 'LEI' },
    { rs: '142.31', titre: 'Loi sur l\'asile (LAsi)', eliPath: 'eli/cc/1999/358', articleRange: null, prefix: 'LAsi' },
    { rs: '142.31', titre: 'Loi sur l\'asile (LAsi, ancienne)', eliPath: 'eli/cc/1980/1718_1718_1718', articleRange: null, prefix: 'LAsi' },
    { rs: '141.0', titre: 'Loi sur la nationalité suisse (LN)', eliPath: 'eli/cc/2016/404', articleRange: null, prefix: 'LN' },
  ],
  // Extra: full CO and CC for general coverage
  general: [
    { rs: '220', titre: 'Code des obligations (CO)', eliPath: 'eli/cc/27/317_321_377', articleRange: null, prefix: 'CO' },
    { rs: '210', titre: 'Code civil suisse (CC)', eliPath: 'eli/cc/24/233_245_233', articleRange: null, prefix: 'CC' },
    { rs: '272', titre: 'Code de procédure civile (CPC)', eliPath: 'eli/cc/2010/262', articleRange: null, prefix: 'CPC' },
  ]
};

// Fallback consolidation dates to try if SPARQL fails
const FALLBACK_DATES = ['20250101', '20260101', '20240101', '20230101', '20220101', '20210101', '20200101'];

// HTTP GET helper
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'Accept': '*/*', 'User-Agent': 'JusticeBot-Harvester/2.0' },
      timeout: 30000
    };

    const req = https.get(options, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `https://${parsedUrl.hostname}${res.headers.location}`;
        return httpGet(redirectUrl).then(resolve).catch(reject);
      }

      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// SPARQL query to discover HTML manifestation dates for a law
async function discoverHtmlDates(eliPath) {
  const uri = `https://fedlex.data.admin.ch/${eliPath}`;
  const query = `PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
SELECT DISTINCT ?manif WHERE {
  ?consol jolux:isMemberOf <${uri}> .
  ?consol jolux:isRealizedBy ?expr .
  ?expr jolux:language <http://publications.europa.eu/resource/authority/language/FRA> .
  ?expr jolux:isEmbodiedBy ?manif .
  FILTER(CONTAINS(STR(?manif), 'html'))
} ORDER BY DESC(?manif) LIMIT 5`;

  try {
    const postData = `query=${encodeURIComponent(query)}`;
    const res = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'fedlex.data.admin.ch',
        path: '/sparqlendpoint',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/sparql-results+json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 15000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('SPARQL timeout')); });
      req.write(postData);
      req.end();
    });

    if (res.status === 200) {
      const data = JSON.parse(res.body);
      // Extract dates from manifestation URIs like .../20250101/fr/html
      return data.results.bindings
        .map(b => {
          const match = b.manif.value.match(/\/(\d{8})\/fr\/html/);
          return match ? match[1] : null;
        })
        .filter(Boolean);
    }
  } catch (e) {
    console.log(`    SPARQL date discovery failed: ${e.message}`);
  }
  return [];
}

// Build the filestore URL for a given law
function buildFilestoreUrl(eliPath, date) {
  const slug = `fedlex-data-admin-ch-${eliPath.replace(/\//g, '-')}-${date}-fr-html`;
  return `https://www.fedlex.admin.ch/filestore/fedlex.data.admin.ch/${eliPath}/${date}/fr/html/${slug}.html`;
}

// Fetch HTML for a law, trying SPARQL-discovered dates first, then fallbacks
async function fetchLawHtml(eliPath) {
  // First: discover actual dates from SPARQL
  const sparqlDates = await discoverHtmlDates(eliPath);
  const datesToTry = [...new Set([...sparqlDates, ...FALLBACK_DATES])];

  for (const date of datesToTry) {
    const url = buildFilestoreUrl(eliPath, date);
    try {
      const res = await httpGet(url);
      if (res.status === 200 && res.body.length > 1000) {
        // Verify it's actual law content, not the SPA shell
        const hasLawContent = res.body.includes('lawcontent') || res.body.includes('<article id="art_');
        if (!hasLawContent) {
          continue; // SPA shell, try next date
        }
        console.log(`    Found: ${date} (${Math.round(res.body.length / 1024)}KB)`);
        return { html: res.body, date };
      }
    } catch (e) {
      // Try next date
    }
  }
  return null;
}

// Parse articles from Fedlex HTML
function parseArticles(html, source) {
  const articles = [];
  // Match <article id="art_XXX">...</article>
  const articleRegex = /<article id="art_(\d+[a-z]?)">([\s\S]*?)<\/article>/gi;
  let match;

  while ((match = articleRegex.exec(html)) !== null) {
    const artNum = match[1];
    const artHtml = match[2];

    // Check article range filter
    if (source.articleRange) {
      const numOnly = parseInt(artNum);
      if (numOnly < source.articleRange[0] || numOnly > source.articleRange[1]) continue;
    }

    // Extract title from heading (marginal note)
    const titleMatch = artHtml.match(/<b>Art\.\s*\d+[a-z]?<\/b>(?:<sup>[^<]*<\/sup>)?\s*([\s\S]*?)(?:<\/a>|<\/h6>)/i);
    let titre = '';
    if (titleMatch) {
      titre = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Extract all paragraph text
    const paragraphs = [];
    const pRegex = /<p class="[^"]*absatz[^"]*"[^>]*>([\s\S]*?)<\/p>/gi;
    let pMatch;
    while ((pMatch = pRegex.exec(artHtml)) !== null) {
      const text = pMatch[1]
        .replace(/<sup>[^<]*<\/sup>/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) paragraphs.push(text);
    }

    // Also extract lettered items (a, b, c...)
    const itemRegex = /<(?:span|td|p)[^>]*class="[^"]*let[^"]*"[^>]*>([\s\S]*?)<\/(?:span|td|p)>/gi;
    let itemMatch;
    while ((itemMatch = itemRegex.exec(artHtml)) !== null) {
      const text = itemMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      if (text && text.length > 2) paragraphs.push(text);
    }

    const fullText = paragraphs.join(' ').slice(0, 1000);
    if (!fullText && paragraphs.length === 0) {
      // Try a more lenient text extraction
      const rawText = artHtml
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
      if (rawText.length > 20) {
        paragraphs.push(rawText.slice(0, 1000));
      }
    }

    const ref = `${source.prefix} ${artNum}`;
    articles.push({
      ref,
      titre: titre || `Article ${artNum}`,
      rs: `RS ${source.rs}`,
      lienFedlex: `https://www.fedlex.admin.ch/eli/cc/${source.eliPath.split('eli/cc/')[1]}/fr#art_${artNum}`,
      texte: fullText || paragraphs.join(' ').slice(0, 1000),
      domaines: [],
      articlesLies: [],
      harvestDate: new Date().toISOString()
    });
  }

  return articles;
}

// Classify articles into domaines based on content
function classifyDomaine(article, domaine) {
  article.domaines = [domaine];
  return article;
}

// Load existing harvest log
function loadLog() {
  if (!existsSync(logFile)) return { runs: [], lastRun: null };
  try { return JSON.parse(readFileSync(logFile, 'utf-8')); } catch { return { runs: [], lastRun: null }; }
}

function saveLog(log) {
  const metaDir = join(dataDir, 'meta');
  if (!existsSync(metaDir)) mkdirSync(metaDir, { recursive: true });
  writeFileSync(logFile, JSON.stringify(log, null, 2), 'utf-8');
}

// Deduplicate articles by ref
function deduplicateArticles(articles) {
  const seen = new Map();
  for (const art of articles) {
    const key = art.ref;
    if (!seen.has(key) || (art.texte && art.texte.length > (seen.get(key).texte || '').length)) {
      seen.set(key, art);
    }
  }
  return [...seen.values()];
}

// Load existing articles for a domaine
function loadExisting(domaine) {
  const file = join(loiDir, `${domaine}-fedlex.json`);
  if (!existsSync(file)) return [];
  try { return JSON.parse(readFileSync(file, 'utf-8')); } catch { return []; }
}

// Main harvest function
async function harvest(domaines) {
  if (!existsSync(loiDir)) mkdirSync(loiDir, { recursive: true });

  const log = loadLog();
  const results = { date: new Date().toISOString(), domaines: {}, errors: [] };

  // Track already-fetched laws to avoid re-downloading
  const fetchedHtml = new Map();

  for (const domaine of domaines) {
    const sources = LAW_SOURCES[domaine];
    if (!sources) {
      results.errors.push(`Domaine inconnu: ${domaine}`);
      continue;
    }

    console.log(`\n--- Harvesting: ${domaine} ---`);
    let allArticles = [];

    for (const source of sources) {
      console.log(`  Fetching RS ${source.rs} (${source.titre})...`);

      try {
        let htmlData;
        if (fetchedHtml.has(source.eliPath)) {
          htmlData = fetchedHtml.get(source.eliPath);
          console.log(`    Using cached HTML`);
        } else {
          htmlData = await fetchLawHtml(source.eliPath);
          if (htmlData) fetchedHtml.set(source.eliPath, htmlData);
        }

        if (!htmlData) {
          console.error(`    SKIP: no HTML found for ${source.eliPath}`);
          results.errors.push({ rs: source.rs, error: 'No HTML found for any consolidation date' });
          continue;
        }

        const articles = parseArticles(htmlData.html, source);
        for (const art of articles) {
          classifyDomaine(art, domaine);
        }

        console.log(`    Parsed ${articles.length} articles`);
        allArticles.push(...articles);
      } catch (err) {
        console.error(`    ERROR RS ${source.rs}: ${err.message}`);
        results.errors.push({ rs: source.rs, error: err.message });
      }
    }

    // Merge with existing (keep existing custom fields like texteSimple, exemplesConcrets)
    const existing = loadExisting(domaine);
    const existingMap = new Map(existing.map(a => [a.ref, a]));

    // Merge: keep existing enriched articles, add new ones
    const merged = [];
    const seenRefs = new Set();

    // First pass: keep all existing articles (they may have manual enrichments)
    for (const art of existing) {
      merged.push(art);
      seenRefs.add(art.ref);
    }

    // Second pass: add new articles not in existing
    for (const art of allArticles) {
      if (!seenRefs.has(art.ref)) {
        merged.push(art);
        seenRefs.add(art.ref);
      }
    }

    const deduplicated = deduplicateArticles(merged);

    // Save
    const outFile = join(loiDir, `${domaine}-fedlex.json`);
    writeFileSync(outFile, JSON.stringify(deduplicated, null, 2), 'utf-8');

    results.domaines[domaine] = {
      existing: existing.length,
      harvested: allArticles.length,
      total: deduplicated.length,
      file: outFile
    };
    console.log(`  => ${domaine}: ${existing.length} existing + ${allArticles.length} new => ${deduplicated.length} total`);
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

const domaines = domaineArg ? [domaineArg] : Object.keys(LAW_SOURCES);

console.log(`Fedlex Harvester v2 — ${new Date().toISOString()}`);
console.log(`Domaines: ${domaines.join(', ')}`);

harvest(domaines).then(results => {
  console.log('\n=== Results ===');
  let totalArticles = 0;
  for (const [d, r] of Object.entries(results.domaines)) {
    console.log(`  ${d}: ${r.total} articles (${r.harvested} from Fedlex)`);
    totalArticles += r.total;
  }
  console.log(`  TOTAL: ${totalArticles} articles`);
  if (results.errors.length) {
    console.log(`  WARNING: ${results.errors.length} error(s)`);
  }
}).catch(err => {
  console.error('Harvest failed:', err);
  process.exit(1);
});

export { harvest, LAW_SOURCES, parseArticles };
