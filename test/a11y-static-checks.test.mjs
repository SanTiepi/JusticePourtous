// test/a11y-static-checks.test.mjs
//
// Verrouille des invariants d'accessibilité de BASE sur les pages publiques
// statiques (src/public/*.html). Parsing par regex/string — pas de lib DOM
// (le repo est zero-deps). Ces checks sont volontairement conservateurs :
// ils n'inspectent QUE le HTML statique livré, pas le DOM injecté en JS
// (contenu des <script>/<style> exclu pour éviter les faux positifs).
//
// Invariants verrouillés (tous ACTUELLEMENT respectés au moment de l'écriture,
// mesurés avant assertion) :
//   1. <html> porte un attribut `lang`.
//   2. chaque <img> porte un attribut `alt` (alt="" toléré — image décorative).
//   3. chaque <button> et <a> a un nom accessible : texte visible, OU
//      aria-label/title sur la balise, OU un enfant porteur de nom
//      (img[alt], aria-label).
//
// Si une nouvelle page ou un nouveau composant casse l'un de ces invariants,
// ce test devient rouge — c'est le garde-fou voulu.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '..', 'src', 'public');

/** Retire commentaires + contenu des <script>/<style> (HTML statique seul). */
function staticHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '');
}

function htmlHasLang(html) {
  const tag = html.match(/<html\b[^>]*>/i);
  return Boolean(tag && /\blang\s*=\s*["'][^"']*["']/i.test(tag[0]));
}

function imgsWithoutAlt(html) {
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  return imgs.filter((t) => !/\balt\s*=/.test(t));
}

/** Un enfant porte-t-il un nom accessible (img[alt non vide] ou aria-label) ? */
function innerHasAccessibleName(inner) {
  if (/<img\b[^>]*\balt\s*=\s*["'][^"']+["']/i.test(inner)) return true;
  if (/\baria-label\s*=\s*["'][^"']+["']/i.test(inner)) return true;
  return false;
}

/** Renvoie les ouvertures de balises `tag` sans nom accessible. */
function elementsWithoutName(html, tag) {
  const re = new RegExp(`<${tag}\\b([^>]*)>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const bad = [];
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1];
    const inner = m[2];
    const hasOwnLabel =
      /\baria-label\s*=\s*["'][^"']+["']/i.test(attrs) ||
      /\btitle\s*=\s*["'][^"']+["']/i.test(attrs);
    const text = inner.replace(/<[^>]*>/g, '').trim();
    if (!hasOwnLabel && !text && !innerHasAccessibleName(inner)) {
      bad.push(`<${tag}${attrs}>`.slice(0, 100));
    }
  }
  return bad;
}

const pages = fs.existsSync(PUBLIC_DIR)
  ? fs
      .readdirSync(PUBLIC_DIR)
      .filter((f) => f.endsWith('.html'))
      .sort()
  : [];

test('au moins une page publique existe', () => {
  assert.ok(pages.length > 0, `aucune page HTML trouvée dans ${PUBLIC_DIR}`);
});

for (const file of pages) {
  test(`a11y statique — ${file}`, () => {
    const raw = fs.readFileSync(path.join(PUBLIC_DIR, file), 'utf8');
    const html = staticHtml(raw);

    // 1. <html lang="...">
    assert.ok(
      htmlHasLang(raw),
      `${file} : la balise <html> doit porter un attribut lang`,
    );

    // 2. chaque <img> a un attribut alt (alt="" toléré)
    const noAlt = imgsWithoutAlt(html);
    assert.equal(
      noAlt.length,
      0,
      `${file} : ${noAlt.length} <img> sans attribut alt → ${noAlt.join(' | ')}`,
    );

    // 3. chaque <button> a un nom accessible
    const badButtons = elementsWithoutName(html, 'button');
    assert.equal(
      badButtons.length,
      0,
      `${file} : ${badButtons.length} <button> sans nom accessible → ${badButtons.join(' | ')}`,
    );

    // 3bis. chaque <a> a un nom accessible
    const badLinks = elementsWithoutName(html, 'a');
    assert.equal(
      badLinks.length,
      0,
      `${file} : ${badLinks.length} <a> sans nom accessible → ${badLinks.join(' | ')}`,
    );
  });
}
