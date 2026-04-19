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

test('all public html pages load i18n and only reference known keys', function () {
  const frKeys = new Set(Object.keys(readJson(join(LOCALES_DIR, 'fr.json'))));
  const htmlFiles = readdirSync(PUBLIC_DIR).filter(function (name) { return name.endsWith('.html'); }).sort();

  for (const file of htmlFiles) {
    const html = readFileSync(join(PUBLIC_DIR, file), 'utf8');
    assert.match(html, /\/i18n\.js/, file + ' must load /i18n.js');
    assert.match(html, /langSwitcher/, file + ' must expose a lang switcher host');
    for (const key of collectDataKeys(html)) {
      assert.ok(frKeys.has(key), file + ' references unknown i18n key ' + key);
    }
  }
});
