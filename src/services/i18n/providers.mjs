import { createLogger } from '../logger.mjs';
import { getLocaleMeta } from './locale-registry.mjs';

const log = createLogger('translation-providers');

const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_ANTHROPIC_MODEL = process.env.ANTHROPIC_TRANSLATION_MODEL || 'claude-haiku-4-5-20251001';

function supportsDeepL(locale) {
  return !!getLocaleMeta(locale).deepl;
}

async function callDeepL({ text, targetLang, sourceLang = 'FR', html = false, glossary = {} }) {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) return null;
  if (!supportsDeepL(targetLang)) return null;

  const localeMeta = getLocaleMeta(targetLang);
  const params = new URLSearchParams();
  params.set('text', text);
  params.set('source_lang', sourceLang.toUpperCase());
  params.set('target_lang', localeMeta.deepl);
  if (html) {
    params.set('tag_handling', 'html');
    params.set('outline_detection', '0');
  }

  try {
    const response = await fetch('https://api.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    if (!response.ok) {
      log.warn('deepl_failed', { status: response.status, targetLang });
      return null;
    }
    const data = await response.json();
    const translated = data.translations?.[0]?.text;
    if (!translated) return null;
    return {
      text: applyGlossaryOverrides(translated, glossary),
      provider: 'deepl',
      usage: data
    };
  } catch (err) {
    log.warn('deepl_exception', { err: err.message, targetLang });
    return null;
  }
}

async function callAnthropicTranslation({ text, targetLang, html = false, purpose = 'translate', glossary = {} }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const localeMeta = getLocaleMeta(targetLang);
  const system = purpose === 'qa'
    ? `You are a Swiss legal translation reviewer. Improve the translation into ${localeMeta.name} only if needed. Preserve every protected token (__JB_KEEP_*__), every URL, law reference, amount, date, citation and placeholder. Return only the revised translation.`
    : `You are a Swiss legal translator. Translate the text into ${localeMeta.name}. Preserve every protected token (__JB_KEEP_*__), every URL, law reference, amount, date, citation and placeholder exactly. ${html ? 'The input is HTML. Preserve tags and attributes exactly.' : ''} Return only the translation.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION
      },
      body: JSON.stringify({
        model: DEFAULT_ANTHROPIC_MODEL,
        max_tokens: 4000,
        system,
        messages: [{ role: 'user', content: applyGlossaryPreface(text, glossary) }]
      })
    });
    if (!response.ok) {
      log.warn('anthropic_translation_failed', { status: response.status, targetLang, purpose });
      return null;
    }
    const data = await response.json();
    const translated = data.content?.[0]?.text;
    if (!translated) return null;
    return {
      text: applyGlossaryOverrides(translated, glossary),
      provider: purpose === 'qa' ? 'anthropic_qa' : 'anthropic_mt',
      usage: data.usage || null
    };
  } catch (err) {
    log.warn('anthropic_translation_exception', { err: err.message, targetLang, purpose });
    return null;
  }
}

function applyGlossaryPreface(text, glossary) {
  const entries = Object.entries(glossary || {});
  if (!entries.length) return text;
  const rules = entries.map(([source, target]) => `${source} => ${target}`).join('\n');
  return `Preferred glossary:\n${rules}\n\nText:\n${text}`;
}

function applyGlossaryOverrides(text, glossary) {
  if (!text || !glossary || !Object.keys(glossary).length) return text;
  let out = text;
  for (const [source, target] of Object.entries(glossary)) {
    if (source && target && out.includes(source)) out = out.split(source).join(target);
  }
  return out;
}

async function callFakeTranslation({ text, targetLang }) {
  if (process.env.JB_TRANSLATION_FAKE !== '1') return null;
  return {
    text: `[[${targetLang}]] ${text}`,
    provider: 'fake_mt',
    usage: null
  };
}

export async function translateWithPrimaryProviders(input) {
  if (process.env.JB_TRANSLATION_FAKE === '1') {
    const fake = await callFakeTranslation(input);
    if (fake) return fake;
  }
  const deepl = await callDeepL(input);
  if (deepl) return deepl;
  const anthropic = await callAnthropicTranslation(input);
  if (anthropic) return anthropic;
  return await callFakeTranslation(input);
}

export async function runQaPass(input) {
  if (process.env.JB_TRANSLATION_FAKE === '1') {
    return { text: input.text, provider: 'fake_qa', usage: null };
  }
  const qa = await callAnthropicTranslation({ ...input, purpose: 'qa' });
  if (qa) return qa;
  return null;
}
