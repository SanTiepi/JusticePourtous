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

// Pages publiques principales (hors guides) — incluses dans le sitemap pour ne pas
// les perdre à la régénération. /guides/ = hub de maillage interne.
const MAIN_PAGES = [
  '/', '/consulter.html', '/annuaire.html', '/methodologie.html',
  '/confidentialite.html', '/premium.html', '/pour-juristes.html',
  '/cgu.html', '/mentions-legales.html', '/guides/'
];

const DOMAIN_LABELS = {
  bail: 'Logement et bail', travail: 'Travail et emploi', famille: 'Famille',
  dettes: 'Dettes et poursuites', etrangers: 'Étrangers et permis',
  assurances: 'Assurances sociales', social: 'Aide sociale',
  violence: 'Violence et protection', accident: 'Accidents et responsabilité',
  entreprise: 'Entreprise et société', consommation: 'Consommation',
  voisinage: 'Voisinage', successions: 'Successions et héritage',
  sante: 'Santé et patients', circulation: 'Circulation routière'
};

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Hub de guides : page crawlable listant tous les guides groupés par domaine.
// Donne aux 314 guides un maillage interne (avant : pages orphelines, atteignables
// uniquement par le sitemap → aucun transfert de link equity).
function buildHubHtml(intents) {
  const byDomain = new Map();
  for (const intent of intents) {
    const dom = (intent.domaines || [])[0] || 'autre';
    if (!byDomain.has(dom)) byDomain.set(dom, []);
    byDomain.get(dom).push(intent);
  }
  const order = Object.keys(DOMAIN_LABELS).filter((d) => byDomain.has(d))
    .concat([...byDomain.keys()].filter((d) => !DOMAIN_LABELS[d]));

  const sections = order.map((dom) => {
    const list = byDomain.get(dom)
      .slice()
      .sort((a, b) => (a.label_citoyen || '').localeCompare(b.label_citoyen || '', 'fr'))
      .map((i) => `<li><a href="/guides/${esc(i.id)}.html">${esc(i.label_citoyen || i.label_juridique || i.id)}</a></li>`)
      .join('\n        ');
    return `    <section class="guide-section">
      <h2>${esc(DOMAIN_LABELS[dom] || dom)}</h2>
      <ul class="guide-hub-list">
        ${list}
      </ul>
    </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guides juridiques pratiques — JusticePourtous</title>
  <meta name="description" content="Tous les guides juridiques de JusticePourtous, classés par domaine : bail, travail, dettes, famille, circulation, santé et plus. Trouvez votre situation et vos démarches.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${SITE_URL}/guides/">
  <meta property="og:title" content="Guides juridiques pratiques — JusticePourtous">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${SITE_URL}/guides/">
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <a href="https://www.meteosuisse.admin.ch" class="quick-exit" title="Quitter rapidement ce site" aria-label="Quitter rapidement ce site">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span>Quitter</span>
  </a>
  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a href="/" class="nav-brand"><span class="nav-mark" aria-hidden="true"></span><span class="nav-wordmark">JusticePourtous</span></a>
      <div class="nav-links">
        <a href="/annuaire.html">Annuaire</a>
        <a href="/methodologie.html">Méthodologie</a>
        <a href="/premium.html" class="nav-premium">Premium</a>
      </div>
    </div>
  </nav>
  <main class="page">
    <div class="page-inner">
      <p class="hero-eyebrow">Guides pratiques</p>
      <h1 class="page-title">Tous les guides juridiques</h1>
      <p class="guide-summary">Choisissez votre situation pour comprendre vos droits, vos délais et les démarches à suivre — gratuitement et anonymement. Ou <a href="/">décrivez votre cas en quelques mots</a> pour une analyse personnalisée.</p>
${sections}
    </div>
  </main>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand"><span class="nav-mark" aria-hidden="true"></span><span>JusticePourtous</span></div>
      <div class="footer-links">
        <a href="/methodologie.html">Méthodologie</a>
        <a href="/annuaire.html">Annuaire</a>
        <a href="/confidentialite.html">Confidentialité</a>
      </div>
      <div class="footer-legal">JusticePourtous fournit des informations juridiques générales basées sur le droit suisse en vigueur. Ce service ne remplace pas un conseil d'avocat personnalisé.</div>
      <div class="footer-copy">© 2026 JusticePourtous</div>
    </div>
  </footer>
</body>
</html>
`;
}

// Sitemap basé sur les fichiers RÉELLEMENT présents (sur toutes les locales offertes,
// pas seulement celles régénérées ce run) → pas de 404 listés, pas de guides existants
// dropés quand on ne régénère que le FR.
function buildSitemap(intents, guidesDir) {
  const urls = MAIN_PAGES.map((p) => `${SITE_URL}${p}`);
  for (const intent of intents) {
    if (fs.existsSync(path.join(guidesDir, `${intent.id}.html`))) {
      urls.push(`${SITE_URL}/guides/${intent.id}.html`);
    }
    for (const locale of OFFERED_LOCALES) {
      if (locale === 'fr') continue;
      if (fs.existsSync(path.join(guidesDir, locale, `${intent.id}.html`))) {
        urls.push(`${SITE_URL}/guides/${locale}/${intent.id}.html`);
      }
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

  // Hub de maillage interne (FR) : rend les guides crawlables hors sitemap.
  writeFile(path.join(args.output, 'index.html'), buildHubHtml(intents));

  writeFile(path.join(ROOT, 'src', 'public', 'sitemap.xml'), buildSitemap(intents, args.output));
  writeFile(path.join(ROOT, 'src', 'public', 'robots.txt'), buildRobots());
  console.log(`Generated ${generated} guides (${skipped} skipped) + hub /guides/index.html.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
