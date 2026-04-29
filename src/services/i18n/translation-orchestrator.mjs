import { getLocaleMeta, normalizeLocale, DEFAULT_LOCALE } from './locale-registry.mjs';
import { getPreferredGlossary, getTermbaseVersion, listNeverTranslate } from './termbase.mjs';
import { protectText, restoreProtectedTokens, validateProtectedTokens } from './token-protector.mjs';
import { computeCacheKey, computeContentHash, getCacheEntry, setCacheEntry } from './translation-cache.mjs';
import { runQaPass, translateWithPrimaryProviders } from './providers.mjs';

export const TRANSLATION_PIPELINE_VERSION = '2026-04-20-v3';

const STRUCTURED_SKIP_KEYS = /(id|ids|slug|path|href|url|lien|lang|locale|code|case_id|session|resume_expires_at_iso|translated_at|translation_|source_lang|display_lang|canonical|created_at|updated_at|last_verified_at|published_at|source_id|court_id|signature|provider|filename|status|domaine|sousdomaine|sousDomaine|triage_method|verification_status|canton|court|tier|claude_review_date|claude_legal_review_date|claude_legal_review_notes|review_scope|review_expiry|maj|dateVerification|verificationOk)$/i;
const SHORT_QA_SKIP_THRESHOLD = 120;
const DEFAULT_TRANSLATION_CONCURRENCY = 6;
const LONG_FORM_QA_THRESHOLD = 320;
const LEGAL_SIGNAL_PATTERN = /\b(?:art\.?\s*\d+[a-z]?|ATF\s+\d{1,3}\s+[IVXLC]+\s+\d+|[1-9][A-Z]_[0-9]+\/20\d{2}|CHF\s?\d|\d+\s*(?:jours?|semaines?|mois|ans?|heures?)|Fedlex|tribunal|arr[êe]t|jugement|recours|r[eé]siliation|licenciement|opposition|poursuite|bail|contrat|autorit[ée])\b/iu;
const QA_PRIORITY_KEY_PATTERN = /(?:explication|resume|citizen_summary|reponse_courte|reponse_detail|message|question)$/i;

const inFlightStringTranslations = new Map();
const translationQueue = [];
let activeTranslationTasks = 0;

const DURATION_LABELS = {
  de: {
    jour: ['Tag', 'Tage'],
    semaine: ['Woche', 'Wochen'],
    mois: ['Monat', 'Monate'],
    an: ['Jahr', 'Jahre'],
    heure: ['Stunde', 'Stunden']
  },
  it: {
    jour: ['giorno', 'giorni'],
    semaine: ['settimana', 'settimane'],
    mois: ['mese', 'mesi'],
    an: ['anno', 'anni'],
    heure: ['ora', 'ore']
  },
  en: {
    jour: ['day', 'days'],
    semaine: ['week', 'weeks'],
    mois: ['month', 'months'],
    an: ['year', 'years'],
    heure: ['hour', 'hours']
  }
};

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

  // Bulletproof : si translateOneString échoue (LLM indispo, timeout, quota), on
  // renvoie le texte source plutôt que de propager l'erreur. Le caller décide
  // (200 + warning vs autre stratégie) en lisant translation_status.
  try {
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
  } catch (err) {
    return {
      translated: text,
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
    };
  }
}

async function translateNode(node, ctx, keyHint = '') {
  if (node === null || node === undefined) return node;
  if (typeof node === 'string') return await translateOneString(node, ctx, keyHint);
  if (typeof node !== 'object') return node;
  if (Array.isArray(node)) {
    return await Promise.all(node.map((item) => translateNode(item, ctx, keyHint)));
  }

  const entries = await Promise.all(Object.entries(node).map(async ([key, value]) => {
    if (STRUCTURED_SKIP_KEYS.test(key)) return [key, value];
    if (typeof value === 'string') return [key, await translateOneString(value, ctx, key)];
    return [key, await translateNode(value, ctx, key)];
  }));
  return Object.fromEntries(entries);
}

async function translateOneString(text, ctx, keyHint = '') {
  if (!text || typeof text !== 'string') return text;
  if (!text.trim()) return text;
  if (looksLikeIdentifier(text)) return text;

  const cacheKey = computeStringTranslationCacheKey(text, ctx);
  const cached = getCacheEntry(cacheKey);
  if (cached?.translated_text) return cached.translated_text;

  if (inFlightStringTranslations.has(cacheKey)) {
    return await inFlightStringTranslations.get(cacheKey);
  }

  const job = runWithTranslationLimit(async () => {
    const glossary = getPreferredGlossary(ctx.domain, ctx.targetLang);
    const extraTerms = listNeverTranslate(ctx.domain);
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

    if (shouldRunQa(text, { ...ctx, keyHint, html })) {
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
    }

    translated = localizeDurationExpressions(translated, ctx.targetLang);

    setCacheEntry(cacheKey, {
      translated_text: translated,
      qa_passed: true,
      qa_failed: false,
      needs_regen: false
    });
    return translated;
  });

  inFlightStringTranslations.set(cacheKey, job);
  try {
    return await job;
  } finally {
    inFlightStringTranslations.delete(cacheKey);
  }
}

function buildCacheKey(content, options) {
  return computeCacheKey({
    content_hash: computeContentHash(content),
    locale: normalizeLocale(options.targetLang),
    content_type: options.contentType || 'structured_legal_content',
    glossary_version: getTermbaseVersion(),
    source_last_verified: options.sourceLastVerified || null,
    pipeline_version: TRANSLATION_PIPELINE_VERSION,
    provider_mode: getProviderMode()
  });
}

export function computeStringTranslationCacheKey(text, options = {}) {
  return computeCacheKey({
    content_hash: computeContentHash(text),
    locale: normalizeLocale(options.targetLang || DEFAULT_LOCALE),
    source_lang: normalizeLocale(options.sourceLang || DEFAULT_LOCALE),
    content_type: options.contentType || 'structured_legal_content',
    domain: options.domain || null,
    source_last_verified: options.sourceLastVerified || null,
    glossary_version: getTermbaseVersion(),
    pipeline_version: TRANSLATION_PIPELINE_VERSION,
    provider_mode: getProviderMode()
  });
}

export function shouldRunQa(text, options = {}) {
  if (!text || typeof text !== 'string') return false;
  if (process.env.JB_TRANSLATION_FORCE_QA === '1') return true;
  if (process.env.JB_TRANSLATION_SKIP_QA === '1') return false;

  const threshold = Number(process.env.JB_TRANSLATION_SKIP_QA_UNDER || SHORT_QA_SKIP_THRESHOLD);
  const html = options.html === true || options.contentType === 'html';
  if (html) return true;
  if (options.keyHint && QA_PRIORITY_KEY_PATTERN.test(options.keyHint)) return true;
  if (text.length >= LONG_FORM_QA_THRESHOLD) return true;
  if (text.length >= threshold && LEGAL_SIGNAL_PATTERN.test(text)) return true;
  if ((text.match(/[.!?;:]/g) || []).length >= 2) return true;
  return false;
}

function getProviderMode() {
  if (process.env.JB_TRANSLATION_FAKE === '1') return 'fake';
  if (process.env.DEEPL_API_KEY) return 'deepl';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'none';
}

function getMaxTranslationConcurrency() {
  const parsed = Number(process.env.JB_TRANSLATION_MAX_CONCURRENCY || DEFAULT_TRANSLATION_CONCURRENCY);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_TRANSLATION_CONCURRENCY;
}

async function runWithTranslationLimit(task) {
  if (activeTranslationTasks < getMaxTranslationConcurrency()) {
    activeTranslationTasks += 1;
    try {
      return await task();
    } finally {
      activeTranslationTasks -= 1;
      flushTranslationQueue();
    }
  }

  return await new Promise((resolve, reject) => {
    translationQueue.push({ task, resolve, reject });
  });
}

function flushTranslationQueue() {
  while (translationQueue.length && activeTranslationTasks < getMaxTranslationConcurrency()) {
    const next = translationQueue.shift();
    activeTranslationTasks += 1;
    Promise.resolve()
      .then(() => next.task())
      .then((value) => next.resolve(value), (err) => next.reject(err))
      .finally(() => {
        activeTranslationTasks -= 1;
        flushTranslationQueue();
      });
  }
}

function looksLikeIdentifier(text) {
  return /^(?:\/[^\s]+|[A-Z0-9._:-]{2,}|[a-z0-9_/-]+\.html?)$/.test(text.trim());
}

function looksLikeReviewerNotes(candidate, original) {
  if (!candidate || typeof candidate !== 'string') return false;
  if (candidate.length > original.length * 2.2) return true;
  return /\*\*|^\s*-\s|^\s*changes?:/im.test(candidate);
}

function localizeDurationExpressions(text, targetLang) {
  const locale = normalizeLocale(targetLang);
  const labels = DURATION_LABELS[locale];
  if (!text || typeof text !== 'string' || !labels) return text;

  return text.replace(/\b(\d+)\s*(jour|jours|semaine|semaines|mois|an|ans|heure|heures)\b/giu, (_, countRaw, unitRaw) => {
    const count = Number(countRaw);
    const singularKey = unitRaw.toLowerCase().startsWith('jour')
      ? 'jour'
      : unitRaw.toLowerCase().startsWith('semaine')
        ? 'semaine'
        : unitRaw.toLowerCase().startsWith('mois')
          ? 'mois'
          : unitRaw.toLowerCase().startsWith('heure')
            ? 'heure'
            : 'an';
    const pair = labels[singularKey];
    if (!pair) return `${countRaw} ${unitRaw}`;
    const translatedUnit = count === 1 ? pair[0] : pair[1];
    return `${countRaw} ${translatedUnit}`;
  });
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
