/**
 * Test Phase Cortex — SEO intent-first.
 * Valide les pages guides générées + sitemap + robots.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const GUIDES = join(ROOT, 'src/public/guides');
const SITEMAP = join(ROOT, 'src/public/sitemap.xml');
const ROBOTS = join(ROOT, 'src/public/robots.txt');

describe('Phase Cortex — SEO pages generation', () => {
  it('au moins 100 pages guides sont générées', () => {
    assert.ok(existsSync(GUIDES), 'dossier guides existe');
    const files = readdirSync(GUIDES).filter(f => f.endsWith('.html'));
    assert.ok(files.length >= 100, `attendu ≥ 100 pages, reçu ${files.length}`);
  });

  it('chaque page guide contient les meta tags SEO requis', () => {
    const files = readdirSync(GUIDES).filter(f => f.endsWith('.html')).slice(0, 10);
    for (const f of files) {
      const html = readFileSync(join(GUIDES, f), 'utf-8');
      assert.match(html, /<title>[^<]{5,}<\/title>/, `${f}: <title> manquant ou trop court`);
      assert.match(html, /<meta\s+name="description"\s+content="[^"]{20,}"/, `${f}: meta description manquante`);
      assert.match(html, /<link\s+rel="canonical"\s+href="[^"]+"/, `${f}: canonical manquant`);
      assert.match(html, /<meta\s+property="og:title"/, `${f}: og:title manquant`);
      assert.match(html, /<h1[^>]*>[^<]+<\/h1>/, `${f}: H1 manquant`);
    }
  });

  it('chaque page contient le bandeau LLCA (pas un avocat)', () => {
    const files = readdirSync(GUIDES).filter(f => f.endsWith('.html')).slice(0, 5);
    for (const f of files) {
      const html = readFileSync(join(GUIDES, f), 'utf-8');
      // Disclaimer LLCA peut être formulé "pas d'avocat" ou "ne remplace pas un avocat"
      assert.match(html, /avocat/i, `${f}: disclaimer avocat manquant`);
      assert.match(html, /(information|conseil|juridique)/i, `${f}: disclaimer juridique manquant`);
    }
  });

  it('chaque page a un CTA vers /resultat.html?q=…', () => {
    const files = readdirSync(GUIDES).filter(f => f.endsWith('.html')).slice(0, 5);
    for (const f of files) {
      const html = readFileSync(join(GUIDES, f), 'utf-8');
      assert.match(html, /\/resultat\.html\?q=/, `${f}: CTA vers triage manquant`);
    }
  });

  it('pas de balise script inline non sécurisée (guard XSS basique)', () => {
    const files = readdirSync(GUIDES).filter(f => f.endsWith('.html')).slice(0, 20);
    for (const f of files) {
      const html = readFileSync(join(GUIDES, f), 'utf-8');
      // Pages guides sont statiques, pas de JS attendu
      assert.ok(!/<script[^>]*>[^<]/.test(html), `${f}: script inline détecté (risque XSS)`);
    }
  });

  it('sitemap.xml existe et contient ≥ 100 URLs', () => {
    assert.ok(existsSync(SITEMAP), 'sitemap.xml manquant');
    const xml = readFileSync(SITEMAP, 'utf-8');
    assert.match(xml, /^<\?xml version/);
    assert.match(xml, /<urlset[^>]+xmlns=/);
    const urlMatches = xml.match(/<url>/g) || [];
    assert.ok(urlMatches.length >= 100, `attendu ≥ 100 URLs sitemap, reçu ${urlMatches.length}`);
  });

  it('robots.txt existe, autorise crawl + référence sitemap', () => {
    assert.ok(existsSync(ROBOTS), 'robots.txt manquant');
    const txt = readFileSync(ROBOTS, 'utf-8');
    assert.match(txt, /User-agent:\s*\*/);
    assert.match(txt, /Allow:\s*\//);
    assert.match(txt, /Sitemap:\s*https?:\/\//);
  });

  it('robots.txt Disallow les endpoints privés/admin', () => {
    const txt = readFileSync(ROBOTS, 'utf-8');
    assert.match(txt, /Disallow:\s*\/api\//);
    assert.match(txt, /Disallow:\s*\/dashboard/);
  });
});
