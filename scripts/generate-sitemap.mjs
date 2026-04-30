#!/usr/bin/env node
/**
 * generate-sitemap.mjs — Phase Cortex §8 (SEO intent-first)
 *
 * Génère `src/public/sitemap.xml` listant :
 *   - Les pages principales (priorité 1.0 home, 0.5 secondaires)
 *   - Toutes les pages guides générées dans `src/public/guides/*.html`
 *     avec priorité 0.8 et `lastmod` issu de `last_verified_at`
 *     de la fiche associée à l'intent.
 *
 * Usage :
 *   node scripts/generate-sitemap.mjs
 *   node scripts/generate-sitemap.mjs --output /tmp/sitemap.xml
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SITE_URL = 'https://justicepourtous.ch';

// ─── Pages principales ───────────────────────────────────────────
// Priorité 1.0 = home. 0.5 = pages secondaires/légales.
const MAIN_PAGES = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/resultat.html', priority: '0.5', changefreq: 'monthly' },
  { loc: '/annuaire.html', priority: '0.5', changefreq: 'monthly' },
  { loc: '/methodologie.html', priority: '0.5', changefreq: 'monthly' },
  { loc: '/consulter.html', priority: '0.5', changefreq: 'monthly' },
  { loc: '/premium.html', priority: '0.5', changefreq: 'monthly' },
  { loc: '/pour-juristes.html', priority: '0.4', changefreq: 'monthly' },
  { loc: '/cgu.html', priority: '0.3', changefreq: 'yearly' },
  { loc: '/confidentialite.html', priority: '0.3', changefreq: 'yearly' },
  { loc: '/mentions-legales.html', priority: '0.3', changefreq: 'yearly' },
];

// ─── Helpers ─────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { output: null, catalog: null, fichesDir: null, guidesDir: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--output' || a === '-o') args.output = argv[++i];
    else if (a === '--catalog' || a === '-c') args.catalog = argv[++i];
    else if (a === '--fiches' || a === '-f') args.fichesDir = argv[++i];
    else if (a === '--guides' || a === '-g') args.guidesDir = argv[++i];
  }
  return args;
}

function escapeXml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDate(d) {
  if (!d) return null;
  // accepte YYYY-MM-DD ou Date.toISOString()
  const m = String(d).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function loadAllFiches(fichesDir) {
  const map = new Map();
  if (!fs.existsSync(fichesDir)) return map;
  for (const file of fs.readdirSync(fichesDir)) {
    if (!file.endsWith('.json')) continue;
    let arr;
    try { arr = JSON.parse(fs.readFileSync(path.join(fichesDir, file), 'utf8')); }
    catch { continue; }
    if (!Array.isArray(arr)) continue;
    for (const fiche of arr) {
      if (fiche && fiche.id) map.set(fiche.id, fiche);
    }
  }
  return map;
}

function lastVerifiedFor(intent, fichesMap) {
  if (!intent || !Array.isArray(intent.fiches_associees)) return null;
  for (const fid of intent.fiches_associees) {
    const f = fichesMap.get(fid);
    if (!f) continue;
    const d = f.last_verified_at || f.dateVerification || f.maj || null;
    const iso = isoDate(d);
    if (iso) return iso;
  }
  return null;
}

function buildIntentIndex(catalog) {
  const map = new Map();
  for (const i of catalog) {
    if (i && i.id) map.set(i.id, i);
  }
  return map;
}

// ─── Build ───────────────────────────────────────────────────────

export function generateSitemap({
  catalogPath,
  fichesDir,
  guidesDir,
  outputPath,
} = {}) {
  const _catalog = catalogPath || path.join(ROOT, 'src/data/meta/intents-catalog.json');
  const _fiches = fichesDir || path.join(ROOT, 'src/data/fiches');
  const _guides = guidesDir || path.join(ROOT, 'src/public/guides');
  const _out = outputPath || path.join(ROOT, 'src/public/sitemap.xml');

  const catalog = fs.existsSync(_catalog)
    ? JSON.parse(fs.readFileSync(_catalog, 'utf8'))
    : [];
  if (!Array.isArray(catalog)) {
    throw new Error('Catalogue invalide (attendu array)');
  }

  const fichesMap = loadAllFiches(_fiches);
  const intentMap = buildIntentIndex(catalog);

  const today = new Date().toISOString().slice(0, 10);

  const urls = [];

  // Pages principales
  for (const p of MAIN_PAGES) {
    urls.push({
      loc: SITE_URL + p.loc,
      lastmod: today,
      changefreq: p.changefreq,
      priority: p.priority,
    });
  }

  // Pages guides FR (priorité 0.8) + versions multilangues DE/IT/EN si présentes (priorité 0.5)
  let guideCount = 0;
  let multilangCount = 0;
  if (fs.existsSync(_guides)) {
    const files = fs.readdirSync(_guides).filter((f) => f.endsWith('.html')).sort();
    for (const file of files) {
      const id = file.replace(/\.html$/, '');
      const intent = intentMap.get(id);
      const lastmod = (intent && lastVerifiedFor(intent, fichesMap)) || today;
      urls.push({
        loc: `${SITE_URL}/guides/${id}.html`,
        lastmod,
        changefreq: 'monthly',
        priority: '0.8',
      });
      guideCount += 1;
      // Inclure les versions multilangues SI le fichier physique existe
      // (évite 404 SEO si une langue est manquante pour un slug donné).
      for (const locale of ['de', 'it', 'en']) {
        const localizedPath = path.join(_guides, locale, file);
        if (fs.existsSync(localizedPath)) {
          urls.push({
            loc: `${SITE_URL}/guides/${locale}/${id}.html`,
            lastmod,
            changefreq: 'monthly',
            priority: '0.5',
          });
          multilangCount += 1;
        }
      }
    }
  }

  // Sérialisation XML
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  for (const u of urls) {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(u.loc)}</loc>`);
    if (u.lastmod) lines.push(`    <lastmod>${escapeXml(u.lastmod)}</lastmod>`);
    if (u.changefreq) lines.push(`    <changefreq>${escapeXml(u.changefreq)}</changefreq>`);
    if (u.priority) lines.push(`    <priority>${escapeXml(u.priority)}</priority>`);
    lines.push('  </url>');
  }
  lines.push('</urlset>');
  lines.push('');

  fs.writeFileSync(_out, lines.join('\n'), 'utf8');

  if (process.argv[1] === __filename) {
    console.log(`✓ Sitemap : ${urls.length} URLs (${MAIN_PAGES.length} principales + ${guideCount} guides FR + ${multilangCount} multilang DE/IT/EN) → ${_out}`);
  }

  return {
    outputPath: _out,
    totalUrls: urls.length,
    mainPages: MAIN_PAGES.length,
    guidePages: guideCount,
    multilangPages: multilangCount,
  };
}

// ─── CLI entry ───────────────────────────────────────────────────
if (process.argv[1] === __filename) {
  const args = parseArgs(process.argv);
  try {
    generateSitemap({
      catalogPath: args.catalog,
      fichesDir: args.fichesDir,
      guidesDir: args.guidesDir,
      outputPath: args.output,
    });
  } catch (err) {
    console.error('✗ Erreur :', err.message);
    process.exit(1);
  }
}
