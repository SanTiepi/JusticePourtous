import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const LOCALES_DIR = join(ROOT, 'src', 'public', 'locales');

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

const bundles = Object.fromEntries(
  readdirSync(LOCALES_DIR)
    .filter(function (name) { return name.endsWith('.json'); })
    .map(function (name) { return [name.replace(/\.json$/u, ''), readJson(join(LOCALES_DIR, name))]; })
);

const frenchLeakPatterns = [
  /Erreur/u,
  /Chargement/u,
  /Méthodologie/u,
  /Confidentialité/u,
  /Mentions légales/u,
  /Retour à l'accueil/u,
  /Déjà client/u,
  /Code à 6 chiffres/u,
  /Recevoir un code/u,
  /Vérifier/u,
  /Renvoyer un code/u,
  /Générer la lettre/u,
  /Télécharger \.docx/u
];

const localeSpecificDenylist = {
  en: ['Contestation']
};

test('non-French locale bundles do not contain obvious French UI leakage', function () {
  for (const [lang, dict] of Object.entries(bundles)) {
    if (lang === 'fr') continue;
    for (const [key, value] of Object.entries(dict)) {
      if (typeof value !== 'string') continue;
      for (const pattern of frenchLeakPatterns) {
        assert.equal(
          pattern.test(value),
          false,
          lang + ' leaked French UI string in key ' + key + ': ' + value
        );
      }
    }
  }
});

test('known locale-specific bad substrings are absent', function () {
  for (const [lang, denylist] of Object.entries(localeSpecificDenylist)) {
    const dict = bundles[lang];
    assert.ok(dict, 'missing locale bundle ' + lang);
    for (const [key, value] of Object.entries(dict)) {
      if (typeof value !== 'string') continue;
      for (const bad of denylist) {
        assert.equal(
          value.includes(bad),
          false,
          lang + ' contains bad substring "' + bad + '" in key ' + key + ': ' + value
        );
      }
    }
  }
});
