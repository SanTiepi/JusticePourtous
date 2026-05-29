/**
 * SEO meta completeness — verrouille la complétude SEO des pages publiques
 * (celles qui amènent les gens via Google : guides FR de premier niveau + index).
 *
 * Stratégie (cf. demande Robin) : on MESURE d'abord, on n'ASSERT que les
 * invariants actuellement respectés sur l'échantillon (test vert), et on LISTE
 * les gaps SEO dans le rapport console (à remonter, pas à corriger ici).
 *
 * Invariants vérifiés par page :
 *   - <title> non vide
 *   - <meta name="description" ...> avec content non vide
 *   - <link rel="canonical" ...>
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'src/public');
const GUIDES = join(PUBLIC, 'guides');

// --- Parsing string/regex (pas de DOM) -------------------------------------

function hasNonEmptyTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  return !!(m && m[1].trim().length > 0);
}

function hasNonEmptyMetaDescription(html) {
  // <meta name="description" content="..."> (ordre attribut tolérant)
  const m = html.match(
    /<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([\s\S]*?)["'][^>]*>/i,
  ) || html.match(
    /<meta\b[^>]*\bcontent=["']([\s\S]*?)["'][^>]*\bname=["']description["'][^>]*>/i,
  );
  return !!(m && m[1].trim().length > 0);
}

function hasCanonical(html) {
  return /<link\b[^>]*\brel=["']canonical["'][^>]*>/i.test(html);
}

// --- Échantillon ~20 guides FR premier niveau (pas de/it/en) + index --------

function sampleGuides(n) {
  // Top-level uniquement : readdir non-récursif → exclut guides/de, /it, /en.
  const all = readdirSync(GUIDES)
    .filter((f) => f.endsWith('.html'))
    .sort();
  if (all.length <= n) return all;
  // Échantillonnage déterministe régulièrement espacé sur tout l'alphabet
  // (couvre plusieurs domaines : accident, assurance, bail, circulation, ...).
  const step = all.length / n;
  const picked = [];
  for (let i = 0; i < n; i++) {
    picked.push(all[Math.floor(i * step)]);
  }
  return [...new Set(picked)];
}

const SAMPLE = [
  ...sampleGuides(20).map((f) => ({ label: `guides/${f}`, path: join(GUIDES, f) })),
  { label: 'index.html', path: join(PUBLIC, 'index.html') },
];

// --- Mesure (avant assertion) ----------------------------------------------

const gaps = { title: [], description: [], canonical: [] };
const checks = [];

for (const page of SAMPLE) {
  if (!existsSync(page.path)) continue;
  const html = readFileSync(page.path, 'utf-8');
  const c = {
    label: page.label,
    title: hasNonEmptyTitle(html),
    description: hasNonEmptyMetaDescription(html),
    canonical: hasCanonical(html),
  };
  if (!c.title) gaps.title.push(page.label);
  if (!c.description) gaps.description.push(page.label);
  if (!c.canonical) gaps.canonical.push(page.label);
  checks.push(c);
}

// --- Rapport gaps SEO (console — à remonter) --------------------------------

function reportGaps() {
  const lines = [];
  lines.push(`[SEO] échantillon : ${checks.length} pages publiques inspectées`);
  for (const field of ['title', 'description', 'canonical']) {
    if (gaps[field].length === 0) {
      lines.push(`[SEO] ${field} : présent sur 100% de l'échantillon`);
    } else {
      lines.push(
        `[SEO] GAP ${field} manquant sur ${gaps[field].length} page(s) : ${gaps[field].join(', ')}`,
      );
    }
  }
  // eslint-disable-next-line no-console
  console.log('\n' + lines.join('\n') + '\n');
}

// --- Tests ------------------------------------------------------------------

describe('SEO meta completeness — pages publiques (guides FR + index)', () => {
  it('échantillonne au moins 15 pages publiques', () => {
    reportGaps();
    assert.ok(
      checks.length >= 15,
      `attendu ≥ 15 pages échantillonnées, reçu ${checks.length}`,
    );
  });

  it('toutes les pages échantillonnées ont un <title> non vide', () => {
    assert.deepEqual(
      gaps.title,
      [],
      `pages sans <title> non vide : ${gaps.title.join(', ')}`,
    );
  });

  it('toutes les pages échantillonnées ont une meta description non vide', () => {
    assert.deepEqual(
      gaps.description,
      [],
      `pages sans meta description non vide : ${gaps.description.join(', ')}`,
    );
  });

  it('toutes les pages échantillonnées (guides + index) ont un canonical', () => {
    // index.html a reçu son <link rel="canonical"> le 2026-05-29 (gap SEO comblé) —
    // on exige désormais le canonical sur TOUT l'échantillon.
    assert.deepEqual(
      gaps.canonical,
      [],
      `pages sans canonical : ${gaps.canonical.join(', ')}`,
    );
  });
});
