import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { translateStructuredContent } from './i18n/translation-orchestrator.mjs';
import { OFFERED_LOCALES, normalizeLocale } from './i18n/locale-registry.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FICHES_DIR = join(ROOT, 'data', 'fiches');
const INTENTS_PATH = join(ROOT, 'data', 'meta', 'intents-catalog.json');
const SITE_URL = 'https://justicepourtous.ch';

let intentsCache = null;
let fichesCache = null;

function loadIntents() {
  if (!intentsCache) intentsCache = JSON.parse(readFileSync(INTENTS_PATH, 'utf-8'));
  return intentsCache;
}

function loadFiches() {
  if (fichesCache) return fichesCache;
  fichesCache = new Map();
  for (const file of readdirSync(FICHES_DIR)) {
    if (!file.endsWith('.json')) continue;
    const fiches = JSON.parse(readFileSync(join(FICHES_DIR, file), 'utf-8'));
    for (const fiche of fiches) fichesCache.set(fiche.id, fiche);
  }
  return fichesCache;
}

function escapeHtml(input) {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(input, max) {
  if (!input) return '';
  const clean = String(input).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice;
  return cut + '…';
}

function extractDelais(fiche) {
  const out = [];
  for (const cascade of fiche?.cascades || []) {
    for (const etape of cascade?.etapes || []) {
      if (!etape?.delai) continue;
      out.push({
        action: etape.action || '',
        delai: etape.delai,
        base_legale: etape.base_legale || null
      });
      if (out.length >= 6) return out;
    }
  }
  return out;
}

function extractArticles(fiche) {
  return (fiche?.reponse?.articles || []).slice(0, 8).map((article) => ({
    ref: article.ref || '',
    titre: article.titre || '',
    lien: article.lien || null
  }));
}

function pickReferenceFiche(intent) {
  const fiches = loadFiches();
  for (const ficheId of intent.fiches_associees || []) {
    const fiche = fiches.get(ficheId);
    if (fiche) return fiche;
  }
  return null;
}

function buildGuideModel(intent, fiche, locale) {
  const explication = fiche?.reponse?.explication || intent.label_citoyen;
  return {
    locale,
    slug: intent.id,
    title: `${intent.label_citoyen} — JusticePourtous`,
    description: truncate(explication, 160),
    h1: intent.label_citoyen,
    eyebrow: 'Guide pratique',
    summary: truncate(explication, 300),
    section_articles_title: 'Articles de loi applicables',
    section_delais_title: 'Délais critiques',
    section_tags_title: 'Mots-clés',
    cta_title: 'Obtenir une analyse de votre situation',
    cta_text: 'Décrivez votre cas et obtenez un plan d’action, les délais et les autorités utiles.',
    cta_button: 'Lancer l’analyse',
    disclaimer_title: 'Information juridique générale',
    disclaimer_text: 'JusticePourtous fournit des informations juridiques générales basées sur le droit suisse en vigueur. Ce service ne remplace pas un conseil d’avocat personnalisé.',
    verified_label: fiche?.last_verified_at ? `Sources vérifiées le ${fiche.last_verified_at}.` : null,
    no_articles_text: 'Cette fiche ne contient pas encore de liste d’articles publics.',
    no_delais_text: 'Cette fiche ne contient pas encore de délai critique structuré.',
    tags: (intent.tags || []).slice(0, 8),
    cantons: (intent.cantons_specifiques || []).slice(0, 6),
    cantons_label: 'Cantons concernés',
    footer_methodology: 'Méthodologie',
    footer_directory: 'Annuaire',
    footer_privacy: 'Confidentialité',
    footer_legal: 'JusticePourtous fournit des informations juridiques générales basées sur le droit suisse en vigueur. Ce service ne remplace pas un conseil d’avocat personnalisé.',
    footer_copy: '© 2026 JusticePourtous',
    nav_directory: 'Annuaire',
    nav_methodology: 'Méthodologie',
    nav_premium: 'Premium',
    quickexit_label: 'Quitter',
    quickexit_sublabel: '— sortie rapide',
    quickexit_title: 'Quitter rapidement ce site — vous redirige vers MétéoSuisse',
    articles: extractArticles(fiche),
    delais: extractDelais(fiche),
    canonical: locale === 'fr'
      ? `${SITE_URL}/guides/${intent.id}.html`
      : `${SITE_URL}/guides/${locale}/${intent.id}.html`,
    fr_canonical: `${SITE_URL}/guides/${intent.id}.html`,
    cta_query: intent.label_citoyen || intent.label_juridique || intent.id
  };
}

function buildAlternateLinks(slug) {
  return OFFERED_LOCALES.map((locale) => {
    const href = locale === 'fr'
      ? `${SITE_URL}/guides/${slug}.html`
      : `${SITE_URL}/guides/${locale}/${slug}.html`;
    return `<link rel="alternate" hreflang="${locale}" href="${escapeHtml(href)}">`;
  }).join('\n  ');
}

function renderGuideHtml(model) {
  const htmlLang = escapeHtml(model.locale);
  const dir = htmlLang === 'ar' ? 'rtl' : 'ltr';
  const alternateLinks = buildAlternateLinks(model.slug);
  const articlesBlock = model.articles.length
    ? `
      <section class="guide-section">
        <h2>${escapeHtml(model.section_articles_title)}</h2>
        <ul class="guide-articles">
          ${model.articles.map((article) => {
            const ref = escapeHtml(article.ref);
            const titre = escapeHtml(article.titre);
            if (article.lien && /^https?:\/\//i.test(article.lien)) {
              return `<li><a href="${escapeHtml(article.lien)}" rel="noopener nofollow" target="_blank"><strong>${ref}</strong> — ${titre}</a></li>`;
            }
            return `<li><strong>${ref}</strong> — ${titre}</li>`;
          }).join('\n          ')}
        </ul>
      </section>`
    : `
      <section class="guide-section">
        <h2>${escapeHtml(model.section_articles_title)}</h2>
        <p>${escapeHtml(model.no_articles_text)}</p>
      </section>`;

  const delaisBlock = model.delais.length
    ? `
      <section class="guide-section">
        <h2>${escapeHtml(model.section_delais_title)}</h2>
        <ol class="guide-delais">
          ${model.delais.map((item) => {
            const action = escapeHtml(item.action);
            const delai = escapeHtml(item.delai);
            const base = item.base_legale ? ` <span class="guide-delai-base">(${escapeHtml(item.base_legale)})</span>` : '';
            return `<li><strong>${action}</strong> — <em>${delai}</em>${base}</li>`;
          }).join('\n          ')}
        </ol>
      </section>`
    : `
      <section class="guide-section">
        <h2>${escapeHtml(model.section_delais_title)}</h2>
        <p>${escapeHtml(model.no_delais_text)}</p>
      </section>`;

  const tagsBlock = model.tags.length
    ? `
      <section class="guide-section">
        <h2>${escapeHtml(model.section_tags_title)}</h2>
        <p class="guide-tags">${model.tags.map((tag) => `<span class="guide-tag">${escapeHtml(tag)}</span>`).join(' ')}</p>
      </section>`
    : '';

  const cantonsBlock = model.cantons.length
    ? `<p class="guide-cantons"><strong>${escapeHtml(model.cantons_label)} :</strong> ${model.cantons.map((canton) => escapeHtml(canton)).join(', ')}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="${htmlLang}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(model.title)}</title>
  <meta name="description" content="${escapeHtml(model.description)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${escapeHtml(model.canonical)}">
  ${alternateLinks}
  <meta property="og:title" content="${escapeHtml(model.title)}">
  <meta property="og:description" content="${escapeHtml(model.description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escapeHtml(model.canonical)}">
  <meta property="og:image" content="${SITE_URL}/og-image.svg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <a href="https://www.meteosuisse.admin.ch" class="quick-exit" title="${escapeHtml(model.quickexit_title)}" aria-label="${escapeHtml(model.quickexit_title)}">
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 12L12 4M12 4H6M12 4V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <span>${escapeHtml(model.quickexit_label)}</span>
    <span class="quick-exit-label">${escapeHtml(model.quickexit_sublabel)}</span>
  </a>

  <nav class="nav" id="nav">
    <div class="nav-inner">
      <a href="/" class="nav-brand">
        <span class="nav-mark" aria-hidden="true"></span>
        <span class="nav-wordmark">JusticePourtous</span>
      </a>
      <div class="nav-links">
        <a href="/annuaire.html">${escapeHtml(model.nav_directory)}</a>
        <a href="/methodologie.html">${escapeHtml(model.nav_methodology)}</a>
        <a href="/premium.html" class="nav-premium">${escapeHtml(model.nav_premium)}</a>
      </div>
    </div>
  </nav>

  <main class="page">
    <div class="page-inner">
      <div class="notice-juridique" role="note">
        <strong>${escapeHtml(model.disclaimer_title)}</strong> — ${escapeHtml(model.disclaimer_text)}
      </div>
      <p class="hero-eyebrow">${escapeHtml(model.eyebrow)}</p>
      <h1 class="page-title">${escapeHtml(model.h1)}</h1>
      <p class="guide-summary">${escapeHtml(model.summary)}</p>
      ${cantonsBlock}
      ${model.verified_label ? `<p class="guide-verified">${escapeHtml(model.verified_label)}</p>` : ''}
      ${articlesBlock}
      ${delaisBlock}
      ${tagsBlock}
      <section class="guide-section guide-cta">
        <h2>${escapeHtml(model.cta_title)}</h2>
        <p>${escapeHtml(model.cta_text)}</p>
        <a href="/resultat.html?q=${encodeURIComponent(model.cta_query)}" class="btn btn-primary guide-cta-btn">${escapeHtml(model.cta_button)}</a>
      </section>
    </div>
  </main>

  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="nav-mark" aria-hidden="true"></span>
        <span>JusticePourtous</span>
      </div>
      <div class="footer-links">
        <a href="/methodologie.html">${escapeHtml(model.footer_methodology)}</a>
        <a href="/annuaire.html">${escapeHtml(model.footer_directory)}</a>
        <a href="/confidentialite.html">${escapeHtml(model.footer_privacy)}</a>
      </div>
      <div class="footer-legal">${escapeHtml(model.footer_legal)}</div>
      <div class="footer-copy">${escapeHtml(model.footer_copy)}</div>
    </div>
  </footer>
</body>
</html>`;
}

export async function renderGuideForLocale(slug, locale = 'fr') {
  const intent = loadIntents().find((entry) => entry.id === slug);
  if (!intent) return null;
  const fiche = pickReferenceFiche(intent);
  const normalized = normalizeLocale(locale);
  const baseModel = buildGuideModel(intent, fiche, normalized);
  if (normalized === 'fr') {
    return {
      html: renderGuideHtml(baseModel),
      model: baseModel,
      translation_status: 'fresh'
    };
  }
  const translated = await translateStructuredContent(baseModel, {
    targetLang: normalized,
    sourceLang: 'fr',
    contentType: 'seo_guides',
    domain: intent.domaines?.[0] || fiche?.domaine || null,
    sourceLastVerified: intent.last_verified_at || fiche?.last_verified_at || null
  });
  if (translated.translation_status === 'failed') {
    return {
      html: null,
      model: translated,
      translation_status: 'failed'
    };
  }
  return {
    html: renderGuideHtml(translated),
    model: translated,
    translation_status: translated.translation_status
  };
}
