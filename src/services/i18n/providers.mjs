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

// Détecte si la sortie LLM contient un méta-commentaire (au lieu de la traduction
// pure). Apparu en prod : Anthropic répondait parfois '*Hinweis: Der Text ist
// bereits korrekt übersetzt. Keine Änderungen notwendig.*' au lieu de retourner
// le texte original. Ces patterns finissaient dans og:description / contenu HTML.
//
// Approche : co-occurrence de phrases-clés "déjà correct" + "pas de changement".
// Plus robuste qu'un regex sur la forme exacte (parenthèses vs astérisques vs
// markdown — Anthropic varie sa façon d'éluder la consigne).
const POLLUTION_KEYWORDS_QUALITY = [
  // 'déjà correct' multilingue
  'bereits korrekt', 'déjà correct', 'déjà bien traduit', 'already correct',
  'already accurate', 'già corretto', 'già tradotto', 'bereits richtig',
  'übersetzung ist korrekt', 'übersetzung ist bereits',
  'translation is correct', 'translation is already',
  'traduction est correcte', 'traduzione è corretta', 'traduzione è già'
];
const POLLUTION_KEYWORDS_NOCHANGE = [
  // 'pas de changement nécessaire' multilingue
  'keine änderung', 'keine verbesser', 'keiner verbesser', 'bedarf keiner',
  'nicht nötig', 'nicht notwendig', 'nicht erforderlich',
  'aucun changement', 'aucune modification', 'aucune amélioration',
  'pas de modification', 'pas nécessaire', 'pas besoin',
  'no improvement', 'no change', 'no need', 'not needed',
  'nessun miglioramento', 'nessuna modifica', 'non necessaria', 'non occorre'
];

function isPollutedTranslation(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  // Si le LLM a injecté à la fois "déjà correct" ET "pas de changement", c'est
  // un méta-commentaire — pas une traduction pure.
  const hasQualityClaim = POLLUTION_KEYWORDS_QUALITY.some(k => lower.includes(k));
  const hasNoChangeClaim = POLLUTION_KEYWORDS_NOCHANGE.some(k => lower.includes(k));
  return hasQualityClaim && hasNoChangeClaim;
}

async function callAnthropicTranslation({ text, targetLang, html = false, purpose = 'translate', glossary = {} }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const localeMeta = getLocaleMeta(targetLang);
  const system = purpose === 'qa'
    ? `You are a Swiss legal translation reviewer. Improve the translation into ${localeMeta.name} only if needed. Preserve every protected token (__JB_KEEP_*__), every URL, law reference, amount, date, citation and placeholder. CRITICAL: Return ONLY the revised translation text — NO commentary, NO meta-notes (e.g. "Hinweis: ...", "Note: already correct"), NO markdown wrappers. If no changes are needed, return the original text VERBATIM.`
    : `You are a Swiss legal translator. Translate the text into ${localeMeta.name}. Preserve every protected token (__JB_KEEP_*__), every URL, law reference, amount, date, citation and placeholder exactly. ${html ? 'The input is HTML. Preserve tags and attributes exactly.' : ''} CRITICAL: Return ONLY the translation — NO commentary, NO notes, NO meta-text. If the input is already in ${localeMeta.name}, return it verbatim.`;

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
    // Filtre anti-pollution : si le LLM a retourné du méta-commentaire au lieu
    // d'une traduction pure, fallback sur le texte d'entrée. Évite que
    // 'Hinweis: Der Text ist bereits korrekt übersetzt...' fuite dans le HTML
    // de prod (incident observé : ~30 fiches polluées en cycle 37+).
    if (isPollutedTranslation(translated)) {
      log.warn('translation_pollution_detected', {
        targetLang,
        purpose,
        sample: translated.slice(0, 100)
      });
      // Pour QA pass : retourner le texte tel qu'il a été soumis
      // (i.e. la traduction primaire, qui est `text` ici).
      // Pour translate pass : retourner le texte source (l'utilisateur verra FR).
      return {
        text: applyGlossaryOverrides(text, glossary),
        provider: purpose === 'qa' ? 'anthropic_qa_polluted_fallback' : 'anthropic_mt_polluted_fallback',
        usage: data.usage || null
      };
    }
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
  const entries = Object.entries(glossary).sort((a, b) => b[0].length - a[0].length);
  for (const [source, target] of entries) {
    if (!source || !target) continue;
    const pattern = new RegExp(`(?<![\\p{L}])${escapeRegExp(source)}(?![\\p{L}])`, 'gu');
    out = out.replace(pattern, target);
  }
  return out;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function callFakeTranslation({ text, targetLang, glossary = {} }) {
  if (process.env.JB_TRANSLATION_FAKE !== '1') return null;
  // Test hook : simule une panne LLM (API Anthropic down, quota épuisé, timeout)
  // pour tester le fallback gracieux côté caller. Sans cela, impossible de
  // tester les chemins try/catch sans une vraie clé API down.
  if (process.env.JB_TRANSLATION_FAKE_THROW === '1') {
    throw new Error('fake_translation_failure (LLM provider unavailable)');
  }
  const delayMs = Number(process.env.JB_TRANSLATION_FAKE_DELAY_MS || 0);
  if (Number.isFinite(delayMs) && delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return {
    text: applyGlossaryOverrides(`[[${targetLang}]] ${text}`, glossary),
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
