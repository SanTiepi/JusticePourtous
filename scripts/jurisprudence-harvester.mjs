/**
 * Jurisprudence Harvester — Aspiration des arrêts du TF et cantonaux
 * Source: entscheidsuche.ch REST API
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

// Keywords by domaine for search
const SEARCH_KEYWORDS = {
  bail: ['bail', 'loyer', 'locataire', 'bailleur', 'résiliation bail', 'CO 253', 'CO 259', 'CO 271'],
  travail: ['contrat de travail', 'licenciement', 'salaire', 'CO 319', 'CO 336', 'congé abusif'],
  famille: ['divorce', 'garde', 'pension alimentaire', 'CC 133', 'CC 176', 'autorité parentale'],
  dettes: ['poursuite', 'faillite', 'mainlevée', 'LP 74', 'LP 82', 'commandement de payer'],
  etrangers: ['LEI', 'permis de séjour', 'renvoi', 'regroupement familial', 'naturalisation', 'asile']
};

// entscheidsuche.ch API
function searchEntscheidsuche(query, limit = 50) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      q: query,
      lang: 'fr',
      rows: String(limit),
      sort: 'date desc'
    });

    const options = {
      hostname: 'entscheidsuche.ch',
      path: `/api/search?${params.toString()}`,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };

    const req = https.get(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API error ${res.statusCode}: ${body.slice(0, 200)}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
  });
}

// Extract article references from text
function extractArticleRefs(text) {
  if (!text) return [];
  const refs = new Set();
  // Patterns: "art. 259a CO", "CO 259a", "LP 82", "CC 133 al. 2"
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

// Classify the relationship between an arrêt and existing jurisprudence
function classifyRelation(arret, existingArrets) {
  // Simple heuristic — in production, use NLP
  const keywords = {
    confirme: ['confirme', 'confirmé', 'dans le même sens', 'conformément à'],
    infirme: ['contrairement à', 'à la différence de', 'revirement', 'abandonne'],
    nuance: ['précise', 'nuance', 'complète', 'ajoute que']
  };

  const text = (arret.resume || '').toLowerCase();
  for (const [relation, words] of Object.entries(keywords)) {
    if (words.some(w => text.includes(w))) {
      return relation;
    }
  }
  return 'applique';
}

// Load existing log
function loadLog() {
  if (!existsSync(logFile)) return { runs: [], lastRun: null };
  return JSON.parse(readFileSync(logFile, 'utf-8'));
}

function saveLog(log) {
  const metaDir = join(dataDir, 'meta');
  if (!existsSync(metaDir)) mkdirSync(metaDir, { recursive: true });
  writeFileSync(logFile, JSON.stringify(log, null, 2), 'utf-8');
}

// Load existing arrêts to avoid duplicates
function loadExistingArrets(domaine) {
  const file = join(jurisDir, `index-${domaine}.json`);
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, 'utf-8'));
}

async function harvest(domaines, limit) {
  const log = loadLog();
  const results = { date: new Date().toISOString(), domaines: {}, errors: [] };

  for (const domaine of domaines) {
    const keywords = SEARCH_KEYWORDS[domaine];
    if (!keywords) {
      results.errors.push(`Domaine inconnu: ${domaine}`);
      continue;
    }

    console.log(`\n--- Harvesting jurisprudence: ${domaine} ---`);
    const existing = loadExistingArrets(domaine);
    const existingIds = new Set(existing.map(a => a.signature));
    const newArrets = [];

    for (const keyword of keywords) {
      console.log(`  Searching: "${keyword}"...`);
      try {
        const data = await searchEntscheidsuche(keyword, limit);
        const docs = data.response?.docs || data.docs || [];

        for (const doc of docs) {
          const signature = doc.reference || doc.id || '';
          if (existingIds.has(signature)) continue;

          const arret = {
            signature,
            date: doc.date || doc.decision_date || null,
            tribunal: doc.court || 'TF',
            domaine,
            resume: doc.abstract_fr || doc.summary || '',
            principe: doc.regeste_fr || doc.headnote || '',
            articlesLies: extractArticleRefs((doc.abstract_fr || '') + ' ' + (doc.regeste_fr || '')),
            url: doc.url || `https://entscheidsuche.ch/docs/${signature}`,
            harvestDate: new Date().toISOString()
          };

          newArrets.push(arret);
          existingIds.add(signature);
        }
        console.log(`  → ${docs.length} résultats, ${newArrets.length} nouveaux`);
      } catch (err) {
        console.error(`  ✗ Erreur "${keyword}": ${err.message}`);
        results.errors.push({ keyword, error: err.message });
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
    console.log(`  → ${domaine}: +${newArrets.length} nouveaux → total ${merged.length}`);
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
  || (args.includes('--limit') ? args[args.indexOf('--limit') + 1] : '50'));

const domaines = domaineArg ? [domaineArg] : Object.keys(SEARCH_KEYWORDS);

console.log(`Jurisprudence Harvester — ${new Date().toISOString()}`);
console.log(`Domaines: ${domaines.join(', ')} | Limit: ${limitArg}/keyword`);

harvest(domaines, limitArg).then(results => {
  console.log('\n=== Résultats ===');
  for (const [d, r] of Object.entries(results.domaines)) {
    console.log(`  ${d}: +${r.new} nouveaux → total ${r.total}`);
  }
  if (results.errors.length) {
    console.log(`  ⚠ ${results.errors.length} erreur(s)`);
  }
}).catch(err => {
  console.error('Harvest failed:', err);
  process.exit(1);
});

export { harvest, SEARCH_KEYWORDS, extractArticleRefs };
