import { getLocaleMeta, normalizeLocale, DEFAULT_LOCALE } from './locale-registry.mjs';
import { getPreferredGlossary, getTermbaseVersion, listNeverTranslate } from './termbase.mjs';
import { protectText, restoreProtectedTokens, validateProtectedTokens } from './token-protector.mjs';
import { computeCacheKey, computeContentHash, getCacheEntry, setCacheEntry } from './translation-cache.mjs';
import { runQaPass, translateWithPrimaryProviders } from './providers.mjs';

export const TRANSLATION_PIPELINE_VERSION = '2026-04-19-v1';

const STRUCTURED_SKIP_KEYS = /(id|ids|slug|path|href|url|lien|lang|locale|code|case_id|session|resume_expires_at_iso|translated_at|translation_|source_lang|display_lang|canonical|created_at|updated_at|last_verified_at|published_at|source_id|court_id|signature|provider|filename|status|domaine|sousdomaine|sousDomaine|triage_method|verification_status|canton|court|tier)$/i;

export async function translateStructuredContent(content, options = {}) {
  const targetLang = normalizeLocale(options.targetLang || DEFAULT_LOCALE);
  const sourceLang = normalizeLocale(options.sourceLang || DEFAULT_LOCALE);
  const contentType = options.contentType || 'structured_legal_content';
  if (targetLang === sourceLang) {
    return withMeta(content, {
      display_lang: targetLang,
      source_lang: sourceLang,
      translation_status: 'fresh',
      translation_pipeline_version: TRANSLATION_PIPELINE_VERSION,
      translated_at: new Date().toISOString(),
      qa_passed: true,
      qa_failed: false,
      cache_hit: false,
      needs_regen: false
    });
  }

  const key = buildCacheKey(content, {
    ...options,
    targetLang,
    sourceLang,
    contentType
  });
  const cached = getCacheEntry(key);
  if (cached?.translated) {
    return withMeta(cached.translated, {
      display_lang: targetLang,
      source_lang: sourceLang,
      translation_status: 'cached',
      translation_pipeline_version: TRANSLATION_PIPELINE_VERSION,
      translated_at: cached.translated_at || cached.cached_at,
      qa_passed: cached.qa_passed !== false,
      qa_failed: cached.qa_failed === true,
      cache_hit: true,
      needs_regen: false
    });
  }

  try {
    const translated = await translateNode(content, {
      ...options,
      targetLang,
      sourceLang,
      contentType
    });
    const translatedAt = new Date().toISOString();
    setCacheEntry(key, {
      translated,
      translated_at: translatedAt,
      qa_passed: true,
      qa_failed: false,
      needs_regen: false
    });
    return withMeta(translated, {
      display_lang: targetLang,
      source_lang: sourceLang,
      translation_status: 'fresh',
      translation_pipeline_version: TRANSLATION_PIPELINE_VERSION,
      translated_at: translatedAt,
      qa_passed: true,
      qa_failed: false,
      cache_hit: false,
      needs_regen: false
    });
  } catch (err) {
    return withMeta(content, {
      display_lang: targetLang,
      source_lang: sourceLang,
      translation_status: 'failed',
      translation_pipeline_version: TRANSLATION_PIPELINE_VERSION,
      translated_at: new Date().toISOString(),
      qa_passed: false,
      qa_failed: true,
      cache_hit: false,
      needs_regen: true,
      translation_error: err.message
    });
  }
}

export async function translateTextContent(text, options = {}) {
  const targetLang = normalizeLocale(options.targetLang || DEFAULT_LOCALE);
  const sourceLang = normalizeLocale(options.sourceLang || DEFAULT_LOCALE);
  if (targetLang === sourceLang) {
    return {
      translated: text,
      display_lang: targetLang,
      source_lang: sourceLang,
      translation_status: 'fresh',
      translation_pipeline_version: TRANSLATION_PIPELINE_VERSION,
      translated_at: new Date().toISOString(),
      qa_passed: true,
      qa_failed: false,
      cache_hit: false,
      needs_regen: false
    };
  }

  const contentType = options.contentType || 'text';
  const key = buildCacheKey(text, { ...options, targetLang, sourceLang, contentType });
  const cached = getCacheEntry(key);
  if (cached?.translated_text) {
    return {
      translated: cached.translated_text,
      display_lang: targetLang,
      source_lang: sourceLang,
      translation_status: 'cached',
      translation_pipeline_version: TRANSLATION_PIPELINE_VERSION,
      translated_at: cached.translated_at || cached.cached_at,
      qa_passed: cached.qa_passed !== false,
      qa_failed: cached.qa_failed === true,
      cache_hit: true,
      needs_regen: false
    };
  }

  const translated = await translateOneString(text, {
    ...options,
    targetLang,
    sourceLang,
    contentType
  });
  const translatedAt = new Date().toISOString();
  setCacheEntry(key, {
    translated_text: translated,
    translated_at: translatedAt,
    qa_passed: true,
    qa_failed: false,
    needs_regen: false
  });
  return {
    translated,
    display_lang: targetLang,
    source_lang: sourceLang,
    translation_status: 'fresh',
    translation_pipeline_version: TRANSLATION_PIPELINE_VERSION,
    translated_at: translatedAt,
    qa_passed: true,
    qa_failed: false,
    cache_hit: false,
    needs_regen: false
  };
}

async function translateNode(node, ctx, keyHint = '') {
  if (node === null || node === undefined) return node;
  if (typeof node === 'string') return await translateOneString(node, ctx);
  if (typeof node !== 'object') return node;
  if (Array.isArray(node)) {
    const out = [];
    for (const item of node) out.push(await translateNode(item, ctx, keyHint));
    return out;
  }

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (STRUCTURED_SKIP_KEYS.test(key)) {
      out[key] = value;
      continue;
    }
    if (typeof value === 'string') {
      out[key] = await translateOneString(value, ctx);
    } else {
      out[key] = await translateNode(value, ctx, key);
    }
  }
  return out;
}

async function translateOneString(text, ctx) {
  if (!text || typeof text !== 'string') return text;
  if (looksLikeIdentifier(text)) return text;

  const glossary = getPreferredGlossary(ctx.domain, ctx.targetLang);
  const extraTerms = [
    ...Object.keys(glossary),
    ...Object.values(glossary),
    ...listNeverTranslate(ctx.domain)
  ];
  const { text: protectedText, tokens } = protectText(text, { extraTerms });
  const html = ctx.contentType === 'html' || /<\/?[a-z][\s\S]*>/i.test(text);
  const primary = await translateWithPrimaryProviders({
    text: protectedText,
    targetLang: ctx.targetLang,
    sourceLang: getLocaleMeta(ctx.sourceLang).deepl || ctx.sourceLang.toUpperCase(),
    html,
    glossary
  });
  if (!primary) {
    throw new Error(`No translation provider available for ${ctx.targetLang}`);
  }

  let translated = restoreProtectedTokens(primary.text, tokens);
  const validation = validateProtectedTokens(text, translated, tokens);
  if (!validation.ok) {
    throw new Error(`Protected token lost: ${validation.missing.join(', ')}`);
  }

  const qa = await runQaPass({
    text: protectText(translated, { extraTerms }).text,
    targetLang: ctx.targetLang,
    html,
    glossary
  });
  if (qa?.text) {
    const qaRestored = restoreProtectedTokens(qa.text, tokens);
    const qaValidation = validateProtectedTokens(text, qaRestored, tokens);
    if (qaValidation.ok && !looksLikeReviewerNotes(qaRestored, text)) translated = qaRestored;
  }
  return translated;
}

function buildCacheKey(content, options) {
  return computeCacheKey({
    content_hash: computeContentHash(content),
    locale: normalizeLocale(options.targetLang),
    content_type: options.contentType || 'structured_legal_content',
    glossary_version: getTermbaseVersion(),
    source_last_verified: options.sourceLastVerified || null,
    pipeline_version: TRANSLATION_PIPELINE_VERSION,
    provider_mode: process.env.JB_TRANSLATION_FAKE === '1'
      ? 'fake'
      : process.env.DEEPL_API_KEY
        ? 'deepl'
        : process.env.ANTHROPIC_API_KEY
          ? 'anthropic'
          : 'none'
  });
}

function looksLikeIdentifier(text) {
  return /^(?:\/[^\s]+|[A-Z0-9._:-]{2,}|[a-z0-9_/-]+\.html?)$/.test(text.trim());
}

function looksLikeReviewerNotes(candidate, original) {
  if (!candidate || typeof candidate !== 'string') return false;
  if (candidate.length > original.length * 2.2) return true;
  return /\*\*|^\s*-\s|^\s*changes?:/im.test(candidate);
}

function withMeta(content, meta) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return {
      translated: content,
      ...meta
    };
  }
  return {
    ...content,
    ...meta
  };
}
