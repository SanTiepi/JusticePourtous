export const OFFERED_LOCALES = ['fr', 'de', 'it', 'en'];
export const DEFAULT_LOCALE = 'fr';
export const RTL_LOCALES = [];
export const UNSUPPORTED_BUT_DETECTED = ['rm', 'pt', 'ar', 'tr', 'sq', 'hr'];

const LOCALE_META = {
  fr: { name: 'Français', deepl: 'FR', dir: 'ltr' },
  de: { name: 'Deutsch', deepl: 'DE', dir: 'ltr' },
  it: { name: 'Italiano', deepl: 'IT', dir: 'ltr' },
  en: { name: 'English', deepl: 'EN', dir: 'ltr' },
};

export function isOfferedLocale(value) {
  return OFFERED_LOCALES.includes(normalizeLocale(value));
}

export function normalizeLocale(value) {
  if (!value || typeof value !== 'string') return DEFAULT_LOCALE;
  const lower = value.toLowerCase().trim();
  if (OFFERED_LOCALES.includes(lower)) return lower;
  const base = lower.split(/[-_]/)[0];
  if (OFFERED_LOCALES.includes(base)) return base;
  return DEFAULT_LOCALE;
}

export function getLocaleMeta(locale) {
  const normalized = normalizeLocale(locale);
  return { locale: normalized, ...LOCALE_META[normalized] };
}

export function isRtlLocale(locale) {
  return RTL_LOCALES.includes(normalizeLocale(locale));
}

export function pickLocaleFromAcceptLanguage(header) {
  if (!header || typeof header !== 'string') return DEFAULT_LOCALE;
  const raw = header.split(',').map((part) => part.split(';')[0].trim()).filter(Boolean);
  for (const item of raw) {
    const normalized = normalizeLocale(item);
    if (isOfferedLocale(normalized)) return normalized;
  }
  return DEFAULT_LOCALE;
}
