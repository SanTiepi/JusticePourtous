import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const I18N_SOURCE = readFileSync(join(ROOT, 'src', 'public', 'i18n.js'), 'utf8');
const CITIZEN_SOURCE = readFileSync(join(ROOT, 'src', 'public', 'citizen-ui.js'), 'utf8');
const INDEX_SOURCE = readFileSync(join(ROOT, 'src', 'public', 'index.html'), 'utf8');

test('head translations stay wired for non-French pages', function () {
  assert.match(I18N_SOURCE, /function translateHeadIfNeeded\(\)/, 'translateHeadIfNeeded helper is missing');
  assert.match(I18N_SOURCE, /meta\[name="description"\]/, 'meta description translation is missing');
  assert.match(I18N_SOURCE, /meta\[property="og:title"\]/, 'og:title translation is missing');
  assert.match(I18N_SOURCE, /meta\[property="og:description"\]/, 'og:description translation is missing');
  assert.match(I18N_SOURCE, /return translateHeadIfNeeded\(\)\.then\(function\(\) \{\s*return translateStaticFragmentIfNeeded\(\);/s, 'head translation must run before static fragment translation');
});

test('runtime fragment translation hides french source before swapping markup', function () {
  assert.match(I18N_SOURCE, /root\.style\.visibility = 'hidden'/, 'static fragment translation must hide the source fragment');
  assert.match(I18N_SOURCE, /node\.style\.visibility = 'hidden'/, 'dynamic fragment translation must hide the source fragment');
  assert.match(I18N_SOURCE, /root\.__jbI18nStaticPromise/, 'static fragment translation must deduplicate concurrent runs');
  assert.match(I18N_SOURCE, /node\.__jbI18nDynamicPromise/, 'dynamic fragment translation must deduplicate concurrent runs');
});

test('citizen modals translate accessibility labels and loading states', function () {
  assert.match(CITIZEN_SOURCE, /function translateAttributeText\(/, 'citizen accessibility translation helper is missing');
  assert.match(CITIZEN_SOURCE, /applyDynamicHtml\(loading, '<p style="text-align:center;color:#666;padding:40px 0">Chargement…<\/p>'/, 'citizen loading state must reuse dynamic translation pipeline');
  assert.match(CITIZEN_SOURCE, /translatePlainText\('📄 Générer une lettre'/, 'citizen letter CTA must be translated proactively');
});

test('homepage keeps generated content and search suggestions locale-aware', function () {
  assert.match(INDEX_SOURCE, /data-i18n="hero\.title_line1"/, 'homepage hero first line must be translated');
  assert.match(INDEX_SOURCE, /fillSearch\('search\.fill_caution'\)/, 'homepage suggestions must use i18n-backed fill text');
  assert.match(INDEX_SOURCE, /translateHtmlFragment\(container\.innerHTML, \{\s*lang: getLang\(\),\s*content_type: 'chrome\/ui',\s*page_path: '\/index-domaines'/s, 'homepage domain cards must go through runtime translation');
});
