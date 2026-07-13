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

  // ⚠ 2026-07-11 — ce test EXIGEAIT que chaque guide pousse le visiteur vers l'analyse
  // personnalisée (/resultat.html?q=…). Cette analyse est suspendue : elle pouvait citer
  // une procédure ou un délai faux. Un test qui impose d'envoyer les gens vers un service
  // qu'on sait défaillant n'est pas un garde-fou, c'est un entonnoir.
  // Le guide doit toujours offrir une sortie — mais vers un humain qui répond de ce qu'il
  // dit. À rebasculer vers le triage quand un juriste aura validé le contenu.
  it('chaque page offre une sortie vers de l’aide humaine (et non vers l’analyse suspendue)', () => {
    const files = readdirSync(GUIDES).filter(f => f.endsWith('.html')).slice(0, 5);
    for (const f of files) {
      const html = readFileSync(join(GUIDES, f), 'utf-8');
      assert.match(html, /\/annuaire\.html/, `${f}: aucune orientation vers une permanence juridique`);
      assert.doesNotMatch(html, /\/resultat\.html\?q=/,
        `${f}: renvoie encore vers l'analyse personnalisée, qui est suspendue`);
    }
  });

  it('pas de balise script inline non sécurisée (guard XSS basique)', () => {
    const files = readdirSync(GUIDES).filter(f => f.endsWith('.html')).slice(0, 20);
    for (const f of files) {
      const html = readFileSync(join(GUIDES, f), 'utf-8');
      // Pages guides sont statiques, pas de JS exécutable attendu. Le JSON-LD
      // (application/ld+json) est inerte et standard pour le SEO : on l'exclut.
      const stripped = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');
      assert.ok(!/<script[^>]*>[^<]/.test(stripped), `${f}: script inline exécutable détecté (risque XSS)`);
    }
  });

  /**
   * ⚠ CE TEST EXIGEAIT ≥ 100 URLs. IL ENCODAIT « PLUS DE PAGES = MIEUX ».
   *
   * C'est exactement l'hypothèse qu'on vient de rejeter, le 13 juillet 2026.
   *
   * Le sitemap contenait 921 pages, dont 912 guides générés depuis les 314 fiches. Un audit de
   * 986 affirmations juridiques de ce corpus, vérifiées contre Fedlex : 238 correctes (24 %),
   * 365 fausses, 383 imprécises — et 399 pouvaient FAIRE PERDRE UN DROIT.
   *
   * Un test qui exige du VOLUME dans un sitemap est un test qui pousse à servir du faux. Il
   * mesurait la mauvaise chose, et il l'a mesurée pendant des mois avec zèle.
   *
   * Ce qu'on veut maintenant : que chaque page listée soit défendable LIGNE PAR LIGNE.
   * Il en reste neuf. Voir test/desindexation-guides.test.mjs pour le détail.
   */
  it('sitemap.xml ne contient QUE des pages défendables — le volume n’est pas une qualité', () => {
    assert.ok(existsSync(SITEMAP), 'sitemap.xml manquant');
    const xml = readFileSync(SITEMAP, 'utf-8');
    assert.match(xml, /^<\?xml version/);
    assert.match(xml, /<urlset[^>]+xmlns=/);

    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    assert.ok(urls.length >= 1, 'sitemap vide');

    const guides = urls.filter(u => u.includes('/guides'));
    assert.deepEqual(guides, [],
      `⚠⚠ ${guides.length} guide(s) sont de retour dans le sitemap. Ils viennent d'un corpus dont 76 % des affirmations sont fausses ou dangereusement incomplètes. On ne les remet PAS avant qu'un juriste humain les ait validées.`);
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
