#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = resolve(fileURLToPath(new URL('.', import.meta.url)));
const ROOT = resolve(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'src', 'public');
const LOCALES_DIR = join(PUBLIC_DIR, 'locales');

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function listHtmlFiles(dir) {
  return readdirSync(dir)
    .filter(function(name) { return name.endsWith('.html'); })
    .sort();
}

function collectDataKeys(html) {
  var re = /data-i18n(?:-(?:placeholder|title|aria-label|html))?="([^"]+)"/g;
  var keys = [];
  var match = null;
  while ((match = re.exec(html))) keys.push(match[1]);
  return keys;
}

const localeFiles = readdirSync(LOCALES_DIR).filter(function(name) { return name.endsWith('.json'); }).sort();
const bundles = Object.fromEntries(localeFiles.map(function(file) {
  return [file.replace(/\.json$/u, ''), readJson(join(LOCALES_DIR, file))];
}));

const frKeys = new Set(Object.keys(bundles.fr || {}));
const localeIssues = [];
for (const [lang, dict] of Object.entries(bundles)) {
  const missing = [...frKeys].filter(function(key) { return !(key in dict); });
  const extra = Object.keys(dict).filter(function(key) { return !frKeys.has(key); });
  if (missing.length || extra.length) {
    localeIssues.push({ lang, missing, extra });
  }
}

const htmlFiles = listHtmlFiles(PUBLIC_DIR);
const htmlIssues = [];
for (const file of htmlFiles) {
  const fullPath = join(PUBLIC_DIR, file);
  if (!statSync(fullPath).isFile()) continue;
  const html = readFileSync(fullPath, 'utf8');
  const missing = [];

  if (!html.includes('/i18n.js')) missing.push('missing /i18n.js include');
  if (!html.includes('langSwitcher')) missing.push('missing lang switcher host');

  const unknownKeys = collectDataKeys(html).filter(function(key) { return !frKeys.has(key); });
  if (unknownKeys.length) {
    missing.push('unknown data-i18n keys: ' + unknownKeys.join(', '));
  }

  if (missing.length) {
    htmlIssues.push({ file, missing });
  }
}

if (!localeIssues.length && !htmlIssues.length) {
  console.log('i18n audit OK');
  console.log('Locales:', Object.keys(bundles).join(', '));
  console.log('Pages:', htmlFiles.join(', '));
  process.exit(0);
}

console.error('i18n audit FAILED');
for (const issue of localeIssues) {
  console.error('- locale', issue.lang);
  if (issue.missing.length) console.error('  missing:', issue.missing.join(', '));
  if (issue.extra.length) console.error('  extra:', issue.extra.join(', '));
}
for (const issue of htmlIssues) {
  console.error('- page', issue.file + ':', issue.missing.join(' | '));
}
process.exit(1);
