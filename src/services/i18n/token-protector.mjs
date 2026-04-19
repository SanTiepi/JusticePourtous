const PROTECTED_PATTERNS = [
  /https?:\/\/[^\s<>"']+/giu,
  /\[[A-Z0-9_ -]{2,}\]/gu,
  /\b20\d{2}-\d{2}-\d{2}\b/g,
  /\bCHF\s?\d[\d\s'.,]*(?:\.\d+)?\b/giu,
  /\b\d+\s*(?:jours?|semaines?|mois|ans?|heures?)\b/giu,
  /\b(?:ATF\s+\d{1,3}\s+[IVXLC]+\s+\d+|[1-9][A-Z]_[0-9]+\/20\d{2})\b/gu,
  /\b(?:art\.?\s*\d+[a-z]?(?:\s*al\.?\s*\d+)?(?:\s*let\.?\s*[a-z])?(?:\s*(?:CO|CC|CP|CPC|CPP|LP|LEI|LTF|Cst))|(?:CO|CC|CP|CPC|CPP|LP|LEI|LTF|Cst)\s*\d+[a-z]?(?:\s*al\.?\s*\d+)?)\b/giu,
  /\b(?:source|decision|article|template)_[A-Za-z0-9._:-]+\b/gu
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function protectText(text, { extraTerms = [] } = {}) {
  if (typeof text !== 'string' || !text.length) return { text: text || '', tokens: [] };

  const seen = new Map();
  const items = [];
  let working = text;

  const protectedTerms = Array.from(new Set(extraTerms.filter(Boolean))).sort((a, b) => b.length - a.length);
  for (const term of protectedTerms) {
    const regex = new RegExp(escapeRegExp(term), 'gu');
    working = working.replace(regex, (match) => injectToken(match));
  }

  for (const pattern of PROTECTED_PATTERNS) {
    working = working.replace(pattern, (match) => injectToken(match));
  }

  return { text: working, tokens: items };

  function injectToken(match) {
    if (seen.has(match)) return seen.get(match);
    const marker = `__JB_KEEP_${items.length}__`;
    seen.set(match, marker);
    items.push({ marker, value: match });
    return marker;
  }
}

export function restoreProtectedTokens(text, tokens = []) {
  if (typeof text !== 'string' || !tokens.length) return text;
  let restored = text;
  for (const token of tokens) {
    restored = restored.split(token.marker).join(token.value);
  }
  return restored;
}

export function validateProtectedTokens(original, translated, tokens = []) {
  const missing = [];
  for (const token of tokens) {
    if (!translated.includes(token.value)) missing.push(token.value);
  }
  return {
    ok: missing.length === 0,
    missing
  };
}
