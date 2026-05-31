/**
 * Régression — injection SEO multilingue serveur (2026-05-31, item 3).
 * Rend les variantes de langue (?lang=de/it/en) indexables : cluster hreflang +
 * <html lang> + canonical auto-référencé par langue. Traduction client-side (i18n.js),
 * Googlebot exécute le JS ; le serveur déclare proprement les versions.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { injectI18nSeo } from '../src/lib/http-helpers.mjs';

const PAGE = `<!doctype html><html lang="fr"><head>
<link rel="canonical" href="https://justicepourtous.ch/methodologie.html">
<title>x</title></head><body>ok</body></html>`;

test('FR (sans lang) : hreflang ajouté, canonical INCHANGÉ, lang=fr', () => {
  const out = injectI18nSeo(PAGE, '');
  assert.match(out, /<html lang="fr"/);
  assert.match(out, /rel="canonical" href="https:\/\/justicepourtous\.ch\/methodologie\.html"/);
  assert.match(out, /hreflang="de" href="https:\/\/justicepourtous\.ch\/methodologie\.html\?lang=de"/);
  assert.match(out, /hreflang="x-default" href="https:\/\/justicepourtous\.ch\/methodologie\.html"/);
  // les 4 langues + x-default
  assert.equal((out.match(/hreflang=/g) || []).length, 5);
});

test('DE : <html lang="de"> + canonical auto-référencé ?lang=de', () => {
  const out = injectI18nSeo(PAGE, 'de');
  assert.match(out, /<html lang="de"/);
  assert.match(out, /rel="canonical" href="https:\/\/justicepourtous\.ch\/methodologie\.html\?lang=de"/);
  assert.match(out, /hreflang="fr" href="https:\/\/justicepourtous\.ch\/methodologie\.html"/);
});

test('lang invalide → traité comme fr', () => {
  const out = injectI18nSeo(PAGE, 'xx');
  assert.match(out, /<html lang="fr"/);
});

test('idempotent : pas de double cluster hreflang', () => {
  const once = injectI18nSeo(PAGE, 'de');
  const twice = injectI18nSeo(once, 'de');
  assert.equal((twice.match(/hreflang=/g) || []).length, 5);
});

test('page SANS canonical → laissée intacte (non indexable)', () => {
  const noCanon = `<html lang="fr"><head><title>x</title></head><body>y</body></html>`;
  assert.equal(injectI18nSeo(noCanon, 'de'), noCanon);
});
