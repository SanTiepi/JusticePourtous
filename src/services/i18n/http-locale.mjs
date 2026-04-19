import { DEFAULT_LOCALE, normalizeLocale, pickLocaleFromAcceptLanguage, isOfferedLocale } from './locale-registry.mjs';

export function parseCookies(header) {
  const out = {};
  if (!header || typeof header !== 'string') return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());
    if (key) out[key] = value;
  }
  return out;
}

export function resolveRequestLocale(req, url, body = null) {
  const explicit =
    body?.lang ||
    url?.searchParams?.get?.('lang') ||
    req?.headers?.['x-jb-lang'];

  if (explicit && isOfferedLocale(explicit)) return normalizeLocale(explicit);

  const cookies = parseCookies(req?.headers?.cookie || '');
  if (cookies.jb_lang && isOfferedLocale(cookies.jb_lang)) return normalizeLocale(cookies.jb_lang);

  return pickLocaleFromAcceptLanguage(req?.headers?.['accept-language']) || DEFAULT_LOCALE;
}
