import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TERMBASE_PATH = join(__dirname, '..', '..', 'data', 'i18n', 'termbase.json');

let cached = null;

export function loadTermbase() {
  if (cached) return cached;
  cached = JSON.parse(readFileSync(TERMBASE_PATH, 'utf-8'));
  return cached;
}

export function getTermbaseVersion() {
  return loadTermbase().version || 'unversioned';
}

export function getTermRules(domain) {
  const termbase = loadTermbase();
  const domainRules = domain && termbase.domains?.[domain] ? termbase.domains[domain] : null;
  return {
    version: termbase.version || 'unversioned',
    global: termbase.global || {},
    domain: domainRules || { never_translate: [], preferred: {}, translate: {} }
  };
}

export function listNeverTranslate(domain) {
  const rules = getTermRules(domain);
  return Array.from(new Set([
    ...(rules.global.never_translate || []),
    ...(rules.domain.never_translate || [])
  ]));
}

export function getPreferredGlossary(domain, targetLang) {
  const rules = getTermRules(domain);
  const merged = {
    ...(rules.global.preferred || {}),
    ...(rules.domain.preferred || {})
  };
  const out = {};
  for (const [source, translations] of Object.entries(merged)) {
    if (translations && translations[targetLang]) out[source] = translations[targetLang];
  }
  return out;
}
