import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const PUBLIC_DIR = join(ROOT, 'src', 'public');
const LOCALES_DIR = join(PUBLIC_DIR, 'locales');

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function collectDataKeys(html) {
  const re = /data-i18n(?:-(?:placeholder|title|aria-label|html))?="([^"]+)"/g;
  const keys = [];
  let match = null;
  while ((match = re.exec(html))) keys.push(match[1]);
  return keys;
}

test('all locale bundles contain the French keyset', function () {
  const localeFiles = readdirSync(LOCALES_DIR).filter(function (name) { return name.endsWith('.json'); }).sort();
  const bundles = Object.fromEntries(localeFiles.map(function (file) {
    return [file.replace(/\.json$/u, ''), readJson(join(LOCALES_DIR, file))];
  }));
  const frKeys = Object.keys(bundles.fr || {}).sort();

  for (const [lang, dict] of Object.entries(bundles)) {
    assert.deepEqual(
      Object.keys(dict).sort(),
      frKeys,
      'locale key mismatch for ' + lang
    );
  }
});

/**
 * ⚠ LES DEUX PAGES QUI NE DOIVENT JAMAIS PASSER PAR L'i18n — 2026-07-13
 *
 * « commandement-de-payer.html » et « zahlungsbefehl.html » ne contiennent presque rien d'autre
 * que du TEXTE DE LOI LITTÉRAL :
 *
 *     art. 18 OELP  — « Les opérations relatives à l'opposition sont gratuites. »
 *     art. 75 LP    — « Il n'est pas nécessaire de motiver l'opposition. »
 *     art. 18 GebV  — « Die mit dem Rechtsvorschlag verbundenen Verrichtungen sind gebührenfrei. »
 *
 * Ces deux versions ne sont PAS des traductions l'une de l'autre : ce sont les deux textes
 * officiels, lus séparément sur Fedlex, et qui font foi chacun dans sa langue.
 *
 * Brancher un système de traduction runtime dessus reviendrait à laisser une machine RÉÉCRIRE un
 * texte de loi. C'est exactement le geste qui a produit les 314 fiches hallucinées de ce projet —
 * dont un audit contre Fedlex a établi que 76 % des affirmations sont fausses ou dangereusement
 * incomplètes, et que 399 peuvent faire perdre un droit.
 *
 * Traduire une loi, c'est la réécrire. Ces deux pages sont exemptées, et elles doivent le rester.
 */
const HORS_I18N = new Set(['commandement-de-payer.html', 'zahlungsbefehl.html']);

test('all public html pages load i18n and only reference known keys', function () {
  const frKeys = new Set(Object.keys(readJson(join(LOCALES_DIR, 'fr.json'))));
  const htmlFiles = readdirSync(PUBLIC_DIR).filter(function (name) { return name.endsWith('.html'); }).sort();

  for (const file of htmlFiles) {
    const html = readFileSync(join(PUBLIC_DIR, file), 'utf8');
    if (HORS_I18N.has(file)) {
      // Le contrat inverse : ces pages doivent RESTER hors i18n. Si quelqu'un les y branche un
      // jour « pour l'uniformité », une machine se mettra à réécrire les citations de la loi.
      assert.doesNotMatch(html, /\/i18n\.js/,
        '⚠⚠ ' + file + ' charge i18n.js. Cette page ne contient que du TEXTE DE LOI LITTÉRAL, lu sur Fedlex. Un traducteur runtime le réécrirait — c\'est exactement ce qui a produit les 314 fiches hallucinées. Traduire une loi, c\'est la réécrire.');
      continue;
    }
    assert.match(html, /\/i18n\.js/, file + ' must load /i18n.js');
    assert.match(html, /langSwitcher/, file + ' must expose a lang switcher host');
    for (const key of collectDataKeys(html)) {
      assert.ok(frKeys.has(key), file + ' references unknown i18n key ' + key);
    }
  }
});
