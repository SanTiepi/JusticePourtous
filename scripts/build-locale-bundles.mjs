#!/usr/bin/env node

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE = join(ROOT, 'src', 'public', 'i18n.js');
const EXTENDED = join(ROOT, 'src', 'public', 'i18n-extended.js');
const OUTPUT_DIR = join(ROOT, 'src', 'public', 'locales');

function loadBundles() {
  function createNode() {
    return {
      innerHTML: '',
      textContent: '',
      setAttribute() {},
      appendChild() {},
      querySelector() { return null; },
      querySelectorAll() { return []; }
    };
  }
  const sandbox = {
    console,
    fetch: async function () {
      return { ok: false, json: async function () { return {}; } };
    },
    sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    window: {
      location: { pathname: '/' },
      __JB_I18N_NO_INIT__: true
    },
    document: {
      readyState: 'loading',
      documentElement: { lang: 'fr', dir: 'ltr' },
      createElement: createNode,
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {}
    }
  };
  sandbox.window.document = sandbox.document;
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(SOURCE, 'utf-8'), sandbox, { filename: SOURCE });
  vm.runInContext(readFileSync(EXTENDED, 'utf-8'), sandbox, { filename: EXTENDED });
  return sandbox.I18N || sandbox.window.I18N;
}

const bundles = loadBundles();
if (!bundles || typeof bundles !== 'object') {
  throw new Error('Impossible de charger les bundles i18n hérités');
}

mkdirSync(OUTPUT_DIR, { recursive: true });
for (const [locale, dict] of Object.entries(bundles)) {
  writeFileSync(join(OUTPUT_DIR, `${locale}.json`), JSON.stringify(dict, null, 2) + '\n', 'utf-8');
}

console.log(`Generated ${Object.keys(bundles).length} locale bundles in ${OUTPUT_DIR}`);
