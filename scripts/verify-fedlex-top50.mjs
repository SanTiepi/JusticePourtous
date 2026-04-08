/**
 * verify-fedlex-top50.mjs — Verification des top 50 fiches Fedlex
 * Cross-check articles en vigueur + ajout champ dateVerification
 *
 * Usage: node scripts/verify-fedlex-top50.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import https from 'node:https';
import http from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');
const fichesDir = join(dataDir, 'fiches');
const TODAY = '2026-04-08';

// Order of priority for top 50 (domaines principaux d'abord)
const DOMAINE_ORDER = ['bail', 'travail', 'famille', 'dettes', 'etrangers', 'social', 'assurances', 'accident', 'violence', 'entreprise'];

// Check if a URL is accessible (returns HTTP status)
function checkUrl(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method: 'HEAD', timeout: 8000 }, (res) => {
      resolve({ status: res.statusCode, ok: res.statusCode < 400 });
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, ok: false, error: 'timeout' }); });
    req.on('error', (e) => resolve({ status: 0, ok: false, error: e.message }));
    req.end();
  });
}

// Small delay to avoid hammering Fedlex
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log(`\n=== Verification Fedlex top 50 fiches — ${TODAY} ===\n`);

  // Collect top 50 fiches in priority order
  const fichesPlan = []; // { domaine, file, index }
  for (const domaine of DOMAINE_ORDER) {
    const file = join(fichesDir, `${domaine}.json`);
    let data;
    try { data = JSON.parse(readFileSync(file, 'utf-8')); }
    catch { continue; }
    for (let i = 0; i < data.length; i++) {
      fichesPlan.push({ domaine, file, index: i, fiche: data[i] });
      if (fichesPlan.length >= 50) break;
    }
    if (fichesPlan.length >= 50) break;
  }

  console.log(`${fichesPlan.length} fiches selectionnees pour verification.\n`);

  // Group by file for batch writes
  const fileMap = {}; // file -> full data array
  for (const { file, domaine } of fichesPlan) {
    if (!fileMap[file]) {
      fileMap[file] = JSON.parse(readFileSync(file, 'utf-8'));
    }
  }

  const report = {
    date: TODAY,
    totalFiches: fichesPlan.length,
    totalArticles: 0,
    articlesOk: 0,
    articlesKo: 0,
    issues: []
  };

  for (const { fiche, file, index } of fichesPlan) {
    const articles = fiche.reponse?.articles || [];
    let ficheOk = true;
    console.log(`[${index + 1}] ${fiche.id} (${articles.length} articles)`);

    for (const art of articles) {
      if (!art.lien) continue;
      report.totalArticles++;
      const result = await checkUrl(art.lien);
      if (result.ok) {
        report.articlesOk++;
        process.stdout.write(`  ✓ ${art.ref}\n`);
      } else {
        report.articlesKo++;
        ficheOk = false;
        const issue = { fiche: fiche.id, ref: art.ref, lien: art.lien, status: result.status, error: result.error };
        report.issues.push(issue);
        console.warn(`  ✗ ${art.ref} — HTTP ${result.status}${result.error ? ' ('+result.error+')' : ''}`);
        // Try to flag the article as potentially changed
        art.verificationNote = `HTTP ${result.status} le ${TODAY} — a reverifier`;
      }
      await sleep(200); // gentle rate limit
    }

    // Add dateVerification to the fiche
    fileMap[file][index] = {
      ...fiche,
      dateVerification: TODAY,
      verificationOk: ficheOk
    };
  }

  // Write updated fiches back to disk
  const filesUpdated = new Set(fichesPlan.map(f => f.file));
  for (const file of filesUpdated) {
    writeFileSync(file, JSON.stringify(fileMap[file], null, 2) + '\n', 'utf-8');
    console.log(`\nEcrit: ${file}`);
  }

  // Write report
  const reportFile = join(dataDir, 'meta', 'verify-fedlex-report.json');
  writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n', 'utf-8');

  console.log(`\n=== Rapport ===`);
  console.log(`Fiches verifiees : ${report.totalFiches}`);
  console.log(`Articles checks  : ${report.totalArticles}`);
  console.log(`  OK  : ${report.articlesOk}`);
  console.log(`  KO  : ${report.articlesKo}`);
  if (report.issues.length > 0) {
    console.log(`\nProblemes detectes :`);
    for (const issue of report.issues) {
      console.log(`  - ${issue.fiche} / ${issue.ref} — ${issue.lien} (HTTP ${issue.status})`);
    }
  } else {
    console.log(`\nTous les liens Fedlex sont valides.`);
  }
  console.log(`\nRapport ecrit: ${reportFile}`);
}

main().catch(e => { console.error(e); process.exit(1); });
