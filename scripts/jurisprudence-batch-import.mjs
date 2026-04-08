/**
 * Jurisprudence Batch Import — Download and classify decisions from entscheidsuche.ch
 * Uses pre-extracted filenames from directory listing.
 *
 * Usage: node scripts/jurisprudence-batch-import.mjs [--max 500] [--concurrency 10]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import https from 'node:https';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');
const jurisDir = join(dataDir, 'jurisprudence');

// Classification keywords per domaine
const DOMAINE_KEYWORDS = {
  bail: {
    strong: ['bail', 'loyer', 'locataire', 'bailleur', 'locatif', 'sous-location', 'sous-locataire'],
    articles: ['CO 253', 'CO 254', 'CO 255', 'CO 256', 'CO 257', 'CO 258', 'CO 259', 'CO 260', 'CO 261', 'CO 262', 'CO 263', 'CO 264', 'CO 265', 'CO 266', 'CO 267', 'CO 268', 'CO 269', 'CO 270', 'CO 271', 'CO 272', 'CO 273', 'CO 274', 'art. 253', 'art. 259', 'art. 271', 'art. 269', 'OBLF'],
    weak: ['résiliation', 'défaut', 'consignation', 'état des lieux', 'loyers', 'rendement net']
  },
  travail: {
    strong: ['contrat de travail', 'employeur', 'employé', 'travailleur', 'licenciement', 'salaire', 'congé abusif'],
    articles: ['CO 319', 'CO 320', 'CO 321', 'CO 322', 'CO 323', 'CO 324', 'CO 325', 'CO 326', 'CO 327', 'CO 328', 'CO 329', 'CO 330', 'CO 331', 'CO 332', 'CO 333', 'CO 334', 'CO 335', 'CO 336', 'CO 337', 'CO 338', 'CO 339', 'CO 340', 'CO 341', 'CO 342', 'CO 343', 'CO 355', 'CO 356', 'CO 357', 'CO 358', 'CO 359', 'CO 360', 'CO 361', 'CO 362', 'LTr', 'LACI', 'LEg', 'art. 336', 'art. 337'],
    weak: ['heures supplémentaires', 'certificat de travail', 'délai de congé', 'préavis', 'indemnité']
  },
  famille: {
    strong: ['divorce', 'séparation', 'garde', 'pension alimentaire', 'autorité parentale', 'droit de visite', 'entretien de l\'enfant'],
    articles: ['CC 90', 'CC 111', 'CC 114', 'CC 119', 'CC 120', 'CC 121', 'CC 122', 'CC 123', 'CC 124', 'CC 125', 'CC 126', 'CC 133', 'CC 134', 'CC 170', 'CC 173', 'CC 175', 'CC 176', 'CC 179', 'CC 276', 'CC 277', 'CC 278', 'CC 285', 'CC 286', 'CC 296', 'CC 298', 'CC 307', 'CC 308', 'CC 310', 'CC 311', 'CC 312', 'CC 314', 'CC 388', 'CC 389', 'CC 390', 'CC 391', 'CC 392', 'CC 393', 'CC 394', 'CC 395', 'CC 396', 'CC 397', 'art. 125 CC', 'art. 133 CC', 'art. 176 CC', 'art. 285 CC'],
    weak: ['mariage', 'époux', 'épouse', 'enfant', 'conjoint', 'couple', 'partage', 'liquidation du régime', 'prévoyance professionnelle']
  },
  dettes: {
    strong: ['poursuite', 'faillite', 'mainlevée', 'commandement de payer', 'saisie', 'séquestre'],
    articles: ['LP 17', 'LP 38', 'LP 46', 'LP 56', 'LP 67', 'LP 68', 'LP 69', 'LP 74', 'LP 75', 'LP 80', 'LP 81', 'LP 82', 'LP 83', 'LP 84', 'LP 85', 'LP 86', 'LP 87', 'LP 88', 'LP 89', 'LP 93', 'LP 97', 'LP 115', 'LP 149', 'LP 174', 'LP 175', 'LP 191', 'LP 192', 'LP 207', 'LP 208', 'LP 219', 'LP 250', 'LP 260', 'LP 271', 'LP 272', 'art. 80 LP', 'art. 82 LP'],
    weak: ['dette', 'créancier', 'débiteur', 'opposition', 'réalisation', 'continuation', 'acte de défaut de biens']
  },
  etrangers: {
    strong: ['étranger', 'permis de séjour', 'renvoi', 'regroupement familial', 'naturalisation', 'asile', 'requérant d\'asile'],
    articles: ['LEI', 'LEtr', 'LAsi', 'LN', 'art. 30 LEI', 'art. 42 LEI', 'art. 43 LEI', 'art. 44 LEI', 'art. 50 LEI', 'art. 62 LEI', 'art. 63 LEI', 'art. 64 LEI', 'art. 83 LEI', 'art. 3 LAsi', 'art. 7 LAsi'],
    weak: ['intégration', 'admission provisoire', 'refoulement', 'titre de séjour', 'permis B', 'permis C', 'permis L']
  }
};

// HTTP GET helper
function httpGet(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const req = https.get({
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
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

// Classify a decision into domaines
function classifyDecision(doc) {
  const text = [
    ...(doc.Abstract || []).map(a => a.Text || ''),
    ...(doc.Kopfzeile || []).map(k => k.Text || ''),
    ...(doc.Meta || []).map(m => m.Text || '')
  ].join(' ').toLowerCase();

  const matches = [];

  for (const [domaine, keywords] of Object.entries(DOMAINE_KEYWORDS)) {
    let score = 0;

    // Strong keywords: 3 points each
    for (const kw of keywords.strong) {
      if (text.includes(kw.toLowerCase())) score += 3;
    }

    // Article references: 5 points each (very specific)
    for (const art of keywords.articles) {
      if (text.includes(art.toLowerCase())) score += 5;
    }

    // Weak keywords: 1 point each
    for (const kw of keywords.weak) {
      if (text.includes(kw.toLowerCase())) score += 1;
    }

    if (score >= 3) {
      matches.push({ domaine, score });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  return matches;
}

// Extract article references from text
function extractArticleRefs(text) {
  if (!text) return [];
  const refs = new Set();
  const patterns = [
    /art\.?\s*(\d+[a-z]?(?:\s+al\.?\s*\d+)?)\s+(CO|CC|LP|LEI|LAsi|LTr|LACI|CPC|CPP|LN|OBLF)/gi,
    /(CO|CC|LP|LEI|LAsi|LTr|LACI|CPC|CPP|LN|OBLF)\s+(\d+[a-z]?)/gi,
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

// Convert entscheidsuche.ch format to our format
function convertDoc(esDoc, domaine) {
  const frAbstract = (esDoc.Abstract || []).find(a =>
    (a.Sprachen || []).includes('fr')
  ) || (esDoc.Abstract || [])[0];

  const frKopf = (esDoc.Kopfzeile || []).find(k =>
    (k.Sprachen || []).includes('fr')
  ) || (esDoc.Kopfzeile || [])[0];

  const resume = frAbstract?.Text || '';
  const kopf = frKopf?.Text || '';
  const allText = resume + ' ' + kopf;

  return {
    signature: (esDoc.Num || [])[0] || '',
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

// Load existing arrêts
function loadExisting(domaine) {
  const file = join(jurisDir, `index-${domaine}.json`);
  if (!existsSync(file)) return [];
  try { return JSON.parse(readFileSync(file, 'utf-8')); } catch { return []; }
}

// Download and classify decisions in batches
async function batchImport(maxPerChamber, concurrency) {
  if (!existsSync(jurisDir)) mkdirSync(jurisDir, { recursive: true });

  // Load filenames
  const filenamesArg = args.find(a => a.startsWith('--filenames='))?.split('=')[1];
  const filenamesPath = filenamesArg || join(process.env.TEMP || process.env.TMP || '/tmp', 'bger_filenames.json');
  if (!existsSync(filenamesPath)) {
    console.error('ERROR: bger_filenames.json not found. Run directory listing extraction first.');
    process.exit(1);
  }
  const allFilenames = JSON.parse(readFileSync(filenamesPath, 'utf8'));

  // Load existing arrêts per domaine
  const existingPerDomaine = {};
  const existingSignatures = new Set();
  for (const domaine of Object.keys(DOMAINE_KEYWORDS)) {
    existingPerDomaine[domaine] = loadExisting(domaine);
    for (const a of existingPerDomaine[domaine]) {
      existingSignatures.add(a.signature);
    }
  }

  console.log(`Existing signatures: ${existingSignatures.size}`);

  // Collect classified decisions per domaine
  const newPerDomaine = {};
  for (const domaine of Object.keys(DOMAINE_KEYWORDS)) {
    newPerDomaine[domaine] = [];
  }

  let downloaded = 0, classified = 0, errors = 0;

  // Process each chamber
  for (const [chamber, filenames] of Object.entries(allFilenames)) {
    // Take a strategic sample: spread across the list for variety
    const sample = [];
    const step = Math.max(1, Math.floor(filenames.length / maxPerChamber));
    for (let i = 0; i < filenames.length && sample.length < maxPerChamber; i += step) {
      sample.push(filenames[i]);
    }

    console.log(`\n--- Chamber ${chamber}: ${sample.length} files to download (${filenames.length} available) ---`);

    // Download in batches
    for (let i = 0; i < sample.length; i += concurrency) {
      const batch = sample.slice(i, i + concurrency);
      const promises = batch.map(async (filename) => {
        const url = `https://entscheidsuche.ch/docs/CH_BGer/${filename}`;
        try {
          const res = await httpGet(url);
          if (res.status !== 200) return null;
          return JSON.parse(res.body);
        } catch {
          errors++;
          return null;
        }
      });

      const results = await Promise.all(promises);

      for (const doc of results) {
        if (!doc) continue;
        downloaded++;

        const sig = (doc.Num || [])[0] || '';
        if (!sig || existingSignatures.has(sig)) continue;

        const classifications = classifyDecision(doc);
        if (classifications.length === 0) continue;

        classified++;
        existingSignatures.add(sig);

        // Add to primary domaine (highest score)
        const primaryDomaine = classifications[0].domaine;
        newPerDomaine[primaryDomaine].push(convertDoc(doc, primaryDomaine));

        // Also add to secondary domaines if score is high enough
        for (let j = 1; j < classifications.length && j < 2; j++) {
          if (classifications[j].score >= 5) {
            const secDomaine = classifications[j].domaine;
            newPerDomaine[secDomaine].push(convertDoc(doc, secDomaine));
          }
        }
      }

      if (i % 50 === 0 && i > 0) {
        const counts = Object.entries(newPerDomaine).map(([d, a]) => `${d}:${a.length}`).join(' ');
        console.log(`  Progress: ${i}/${sample.length} downloaded=${downloaded} classified=${classified} errors=${errors} | ${counts}`);
      }
    }
  }

  // Save results
  console.log('\n=== Saving results ===');
  const summary = {};
  for (const [domaine, newArrets] of Object.entries(newPerDomaine)) {
    const existing = existingPerDomaine[domaine];
    const merged = [...existing, ...newArrets];
    const outFile = join(jurisDir, `index-${domaine}.json`);
    writeFileSync(outFile, JSON.stringify(merged, null, 2), 'utf-8');

    summary[domaine] = { existing: existing.length, new: newArrets.length, total: merged.length };
    console.log(`  ${domaine}: ${existing.length} existing + ${newArrets.length} new = ${merged.length} total`);
  }

  // Update log
  const logFile = join(dataDir, 'meta', 'jurisprudence-log.json');
  const log = existsSync(logFile) ? JSON.parse(readFileSync(logFile, 'utf-8')) : { runs: [] };
  log.runs.push({
    date: new Date().toISOString(),
    type: 'batch-import',
    downloaded,
    classified,
    errors,
    domaines: summary
  });
  log.lastRun = new Date().toISOString();
  const metaDir = join(dataDir, 'meta');
  if (!existsSync(metaDir)) mkdirSync(metaDir, { recursive: true });
  writeFileSync(logFile, JSON.stringify(log, null, 2), 'utf-8');

  return summary;
}

// CLI
const args = process.argv.slice(2);
const maxArg = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '800');
const concurrencyArg = parseInt(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '10');

console.log(`Jurisprudence Batch Import — ${new Date().toISOString()}`);
console.log(`Max per chamber: ${maxArg} | Concurrency: ${concurrencyArg}`);

batchImport(maxArg, concurrencyArg).then(summary => {
  console.log('\n=== Final Summary ===');
  let total = 0;
  for (const [d, s] of Object.entries(summary)) {
    console.log(`  ${d}: ${s.total} total (+${s.new} new)`);
    total += s.total;
  }
  console.log(`  GRAND TOTAL: ${total} arrêts`);
}).catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
