#!/usr/bin/env node
/**
 * Génère les guides SEO statiques depuis la source structurée FR.
 *
 * Sorties :
 *   - /guides/<slug>.html pour FR
 *   - /guides/<lang>/<slug>.html pour les autres locales offertes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderGuideForLocale } from '../src/services/guide-renderer.mjs';
import { OFFERED_LOCALES } from '../src/services/i18n/locale-registry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const GUIDES_DIR = path.join(ROOT, 'src', 'public', 'guides');
const INTENTS_PATH = path.join(ROOT, 'src', 'data', 'meta', 'intents-catalog.json');
const SITE_URL = 'https://justicepourtous.ch';

function parseArgs(argv) {
  const args = { output: GUIDES_DIR, locales: OFFERED_LOCALES, verbose: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--output' || arg === '-o') args.output = path.resolve(argv[++i]);
    else if (arg === '--locales' || arg === '-l') args.locales = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    else if (arg === '--verbose' || arg === '-v') args.verbose = true;
  }
  return args;
}

function loadIntents() {
  return JSON.parse(fs.readFileSync(INTENTS_PATH, 'utf-8'));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

function buildSitemap(intents, locales) {
  const urls = [];
  for (const intent of intents) {
    urls.push(`${SITE_URL}/guides/${intent.id}.html`);
    for (const locale of locales) {
      if (locale === 'fr') continue;
      urls.push(`${SITE_URL}/guides/${locale}/${intent.id}.html`);
    }
  }
  const body = urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function buildRobots() {
  return `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /dashboard\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}

async function main() {
  const args = parseArgs(process.argv);
  const intents = loadIntents().filter((intent) =>
    ['complete', 'partial'].includes(intent.etat_couverture) && Array.isArray(intent.fiches_associees) && intent.fiches_associees.length > 0
  );

  let generated = 0;
  let skipped = 0;

  for (const intent of intents) {
    for (const locale of args.locales) {
      const rendered = await renderGuideForLocale(intent.id, locale);
      if (!rendered || !rendered.html) {
        skipped += 1;
        if (args.verbose) console.warn(`skip ${locale}/${intent.id} (${rendered?.translation_status || 'missing'})`);
        continue;
      }
      const outputPath = locale === 'fr'
        ? path.join(args.output, `${intent.id}.html`)
        : path.join(args.output, locale, `${intent.id}.html`);
      writeFile(outputPath, rendered.html);
      generated += 1;
      if (args.verbose) console.log(`wrote ${outputPath}`);
    }
  }

  writeFile(path.join(ROOT, 'src', 'public', 'sitemap.xml'), buildSitemap(intents, args.locales));
  writeFile(path.join(ROOT, 'src', 'public', 'robots.txt'), buildRobots());
  console.log(`Generated ${generated} guides (${skipped} skipped).`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
