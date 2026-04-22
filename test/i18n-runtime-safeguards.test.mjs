import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const I18N_SOURCE = readFileSync(join(ROOT, 'src', 'public', 'i18n.js'), 'utf8');
const CITIZEN_SOURCE = readFileSync(join(ROOT, 'src', 'public', 'citizen-ui.js'), 'utf8');
const INDEX_SOURCE = readFileSync(join(ROOT, 'src', 'public', 'index.html'), 'utf8');
const APP_SOURCE = readFileSync(join(ROOT, 'src', 'public', 'app.js'), 'utf8');
const PREMIUM_SOURCE = readFileSync(join(ROOT, 'src', 'public', 'premium.html'), 'utf8');

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

test('legal-content frontends propagate lang explicitly to APIs', function () {
  assert.match(APP_SOURCE, /\/api\/search\?q=' \+ encodeURIComponent\(query\) \+ '&lang=' \+ encodeURIComponent\(lang\)/, 'search result page must send lang explicitly');
  assert.match(APP_SOURCE, /\/api\/fiches\/' \+ ficheId \+ '\?lang=' \+ encodeURIComponent\(lang\)/, 'fiche fetch must send lang explicitly');
  assert.match(APP_SOURCE, /\/api\/domaines\/' \+ domaine \+ '\/questions\?lang=' \+ encodeURIComponent\(lang\)/, 'consultation questions must send lang explicitly');
  assert.match(APP_SOURCE, /lang: lang/, 'consultation submit must include lang in body');
  assert.match(PREMIUM_SOURCE, /JSON\.stringify\(\{ texte: q, session: sessionCode, lang: getLang\(\) \}\)/, 'premium analysis must include lang');
  assert.match(PREMIUM_SOURCE, /JSON\.stringify\(\{ texte: lastQuery, reponses: answers, session: sessionCode, lang: getLang\(\) \}\)/, 'premium refine must include lang');
  assert.match(CITIZEN_SOURCE, /lang: currentLang\(\)/, 'citizen letter generation must include lang');
});

test('results and premium translation chrome use explicit i18n keys instead of hardcoded french labels', function () {
  assert.match(APP_SOURCE, /t\('result\.caselaw_canon'\)/, 'caselaw canon heading must use i18n key');
  assert.match(APP_SOURCE, /t\('result\.leading_cases'\)/, 'leading cases heading must use i18n key');
  assert.match(APP_SOURCE, /t\('result\.nuances'\)/, 'nuances heading must use i18n key');
  assert.match(APP_SOURCE, /t\('result\.cantonal_practice'\)/, 'cantonal practice heading must use i18n key');
  assert.match(APP_SOURCE, /t\('result\.similar_cases_count', \{ count: canon\.similar_cases\.length \}\)/, 'similar cases summary must use i18n key');
  assert.match(APP_SOURCE, /t\('result\.source_asloca_kit', \{ number: q\.numero \|\| '' \}\)/, 'ASLOCA kit source label must use i18n key');
  assert.match(APP_SOURCE, /t\('result\.source_asloca_ref', \{ ref: ae\.question_ref \|\| '' \}\)/, 'ASLOCA reference source label must use i18n key');
  assert.match(APP_SOURCE, /t\('result\.source_asloca_short'\)/, 'ASLOCA source footer label must use i18n key');
  assert.match(PREMIUM_SOURCE, /t\('premium\.translate_select'\)/, 'premium translate selector must use i18n key');
  assert.match(PREMIUM_SOURCE, /t\('premium\.translate_button'\)/, 'premium translate button must use i18n key');
  assert.match(PREMIUM_SOURCE, /t\('premium\.translate_cost_receipt'/, 'premium translation receipt must use i18n key');
});
