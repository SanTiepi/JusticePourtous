/**
 * Fedlex Diff — Détection de changements législatifs et analyse d'impact
 *
 * Mission Cortex Phase 2 : scraping Fedlex continu qui détecte les
 * modifications d'articles de loi et analyse l'impact sur nos fiches
 * et règles normatives.
 *
 * Zero deps (native https), mode offline safe, mode mock pour CI/dev.
 *
 * API publique :
 *   - fetchFedlexArticle(rsNumber, article, opts) → { ok, text, url, status }
 *   - hashArticle(content) → SHA256 hex du texte normalisé
 *   - detectChanges(previous, current) → { changed, diff_summary }
 *   - analyzeImpact(changedArticle, fiches, rules) → { fiches_affected, rules_affected, priority }
 *   - buildSourceId(ref) → "fedlex:rs220:co-259a"
 */

import { createHash } from 'node:crypto';
import https from 'node:https';

// ─── Fetch ───────────────────────────────────────────────────────

/**
 * Fetch raw HTML/text for a Fedlex article.
 * @param {string} rsNumber  — ex "220" (CO), "210" (CC)
 * @param {string} article   — ex "259a", "257e"
 * @param {object} opts      — { timeout, mock, mockContent, signal }
 * @returns {Promise<{ok:boolean, text:string|null, url:string, status:number|null, error?:string}>}
 */
export function fetchFedlexArticle(rsNumber, article, opts = {}) {
  const timeout = opts.timeout ?? 10_000;
  const url = buildFedlexUrl(rsNumber, article);

  // Mock mode: no network, deterministic output
  if (opts.mock) {
    return Promise.resolve({
      ok: true,
      text: opts.mockContent ?? `MOCK:rs${rsNumber}:art${article}`,
      url,
      status: 200,
      mock: true,
    });
  }

  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = https.request({
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'User-Agent': 'JusticeBot-FedlexDiff/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
        timeout,
      }, (res) => {
        // Follow one level of redirect
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve({
            ok: false, text: null, url,
            status: res.statusCode,
            error: `redirect to ${res.headers.location}`,
          });
        }
        let buf = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk) => { buf += chunk; });
        res.on('end', () => {
          const ok = res.statusCode >= 200 && res.statusCode < 300;
          resolve({
            ok,
            text: ok ? extractArticleText(buf, article) : null,
            url,
            status: res.statusCode,
            error: ok ? undefined : `HTTP ${res.statusCode}`,
          });
        });
      });
      req.on('error', (err) => {
        resolve({ ok: false, text: null, url, status: null, error: err.message });
      });
      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, text: null, url, status: null, error: 'timeout' });
      });
      req.end();
    } catch (err) {
      resolve({ ok: false, text: null, url, status: null, error: err.message });
    }
  });
}

/**
 * Build a canonical Fedlex URL for an article.
 * Format : https://www.fedlex.admin.ch/eli/cc/<rs_eli>/fr#art_<n>
 * When rs_eli not known we fall back to the short query form.
 */
export function buildFedlexUrl(rsNumber, article) {
  const a = String(article).toLowerCase().replace(/\s+/g, '');
  // Canonical short form — Fedlex redirects RS numbers to ELI
  return `https://www.fedlex.admin.ch/eli/cc/${rsNumber}/fr#art_${a}`;
}

/**
 * Attempt to extract the text of a specific article from a raw HTML page.
 * Fedlex wraps articles in <article id="art_X"> ... </article>.
 * This is a best-effort regex extraction — if the shape changes we fall
 * back to the full body (still hashable, diff still works).
 */
export function extractArticleText(html, article) {
  if (!html || typeof html !== 'string') return '';
  const a = String(article).toLowerCase().replace(/\s+/g, '');
  const re = new RegExp(
    `<(?:article|section|div)[^>]*id=["']art_${a}["'][^>]*>([\\s\\S]*?)<\\/(?:article|section|div)>`,
    'i'
  );
  const m = html.match(re);
  const scoped = m ? m[1] : html;
  // Strip tags, collapse whitespace
  return scoped
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Hashing ─────────────────────────────────────────────────────

/**
 * SHA256 hex of the normalized article text.
 * Normalization : lowercase, collapse whitespace, trim, drop zero-width chars.
 * Stable across runs for identical inputs.
 * @param {string} content
 * @returns {string}
 */
export function hashArticle(content) {
  const normalized = normalizeText(content);
  return createHash('sha256').update(normalized, 'utf-8').digest('hex');
}

export function normalizeText(content) {
  if (content == null) return '';
  return String(content)
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// ─── Diff ────────────────────────────────────────────────────────

/**
 * Compare two article snapshots.
 * @param {{hash?:string, text?:string}} previous
 * @param {{hash?:string, text?:string}} current
 * @returns {{changed:boolean, diff_summary:string, previous_hash:string|null, current_hash:string|null}}
 */
export function detectChanges(previous, current) {
  const prev = previous || {};
  const curr = current || {};
  const prevHash = prev.hash || (prev.text != null ? hashArticle(prev.text) : null);
  const currHash = curr.hash || (curr.text != null ? hashArticle(curr.text) : null);

  if (!prevHash && !currHash) {
    return { changed: false, diff_summary: 'no content on both sides',
             previous_hash: null, current_hash: null };
  }
  if (!prevHash) {
    return { changed: true, diff_summary: 'new article (no previous snapshot)',
             previous_hash: null, current_hash: currHash };
  }
  if (!currHash) {
    return { changed: true, diff_summary: 'article removed (no current snapshot)',
             previous_hash: prevHash, current_hash: null };
  }
  if (prevHash === currHash) {
    return { changed: false, diff_summary: 'identical',
             previous_hash: prevHash, current_hash: currHash };
  }
  return {
    changed: true,
    diff_summary: summarizeDiff(prev.text || '', curr.text || ''),
    previous_hash: prevHash,
    current_hash: currHash,
  };
}

/**
 * Lightweight textual diff summary — line-level adds/removes.
 * Not a full LCS; enough to say "alinéa X modifié / ajouté / supprimé".
 */
export function summarizeDiff(a, b) {
  const linesA = splitAlineas(a);
  const linesB = splitAlineas(b);
  if (linesA.length === 0 && linesB.length === 0) return 'content changed';

  const setA = new Set(linesA.map(normalizeText));
  const setB = new Set(linesB.map(normalizeText));
  const added = linesB.filter(l => !setA.has(normalizeText(l)));
  const removed = linesA.filter(l => !setB.has(normalizeText(l)));

  const parts = [];
  if (removed.length) parts.push(`${removed.length} alinéa(s) supprimé(s)/modifié(s)`);
  if (added.length) parts.push(`${added.length} alinéa(s) ajouté(s)/modifié(s)`);
  if (parts.length === 0) {
    return `contenu modifié (${linesA.length}→${linesB.length} alinéas)`;
  }
  return parts.join(', ');
}

function splitAlineas(text) {
  if (!text) return [];
  // Fedlex marks alinéas with ^1, ^2 or numbers — we split on sentence-like boundaries
  return String(text)
    .split(/(?:\n+|(?<=[.!?])\s{2,}|(?<=\s)(?=\d+\s))/g)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// ─── Impact analysis ─────────────────────────────────────────────

/**
 * List fiches + normative rules impacted by a changed article.
 *
 * @param {{ref:string, source_id?:string, domaines?:string[]}} changedArticle
 * @param {Array<object>} fiches — list of fiches (with articles[] or articlesLies[])
 * @param {Array<object>} rules — ALL_RULES from normative-compiler (id, source_ids, base_legale)
 * @returns {{fiches_affected:string[], rules_affected:string[], priority:'high'|'medium'|'low', reasons:string[]}}
 */
export function analyzeImpact(changedArticle, fiches = [], rules = []) {
  const ref = (changedArticle?.ref || '').trim();
  const sourceId = changedArticle?.source_id || buildSourceId(ref);
  const domainesArticle = Array.isArray(changedArticle?.domaines)
    ? changedArticle.domaines : [];

  const fichesAffected = [];
  const reasons = [];

  for (const fiche of fiches) {
    if (!fiche || typeof fiche !== 'object') continue;
    if (ficheReferencesArticle(fiche, ref, sourceId)) {
      fichesAffected.push(fiche.id || fiche.ref || '<unknown>');
    }
  }

  const rulesAffected = [];
  for (const rule of rules) {
    if (!rule) continue;
    const ids = rule.source_ids || [];
    const baseLegale = rule.base_legale || '';
    if (ids.includes(sourceId) || baseLegale.includes(ref)) {
      rulesAffected.push(rule.id);
    }
  }

  // Priority heuristic
  let priority = 'low';
  if (rulesAffected.length >= 1) {
    priority = 'high';
    reasons.push(`${rulesAffected.length} règle(s) normative(s) impactée(s)`);
  } else if (fichesAffected.length >= 3) {
    priority = 'high';
    reasons.push(`${fichesAffected.length} fiches impactées`);
  } else if (fichesAffected.length >= 1) {
    priority = 'medium';
    reasons.push(`${fichesAffected.length} fiche(s) impactée(s)`);
  } else {
    reasons.push('aucun lien direct avec fiches/règles');
  }

  // Domain-level boost
  const criticalDomains = ['bail', 'travail', 'dettes'];
  if (domainesArticle.some(d => criticalDomains.includes(d)) && priority === 'low') {
    priority = 'medium';
    reasons.push(`article dans domaine critique (${domainesArticle.join(',')})`);
  }

  return {
    fiches_affected: Array.from(new Set(fichesAffected)),
    rules_affected: Array.from(new Set(rulesAffected)),
    priority,
    reasons,
  };
}

/** Does a fiche reference this article (by ref or source_id) ? */
function ficheReferencesArticle(fiche, ref, sourceId) {
  const refLc = ref.toLowerCase();
  // 1. fiche.articles[] (nested)
  const nested = fiche.articles || fiche.articlesLies || [];
  if (Array.isArray(nested)) {
    for (const a of nested) {
      const aref = typeof a === 'string' ? a : (a?.ref || a?.base_legale || '');
      if (aref && aref.toLowerCase() === refLc) return true;
      if (a?.source_id && a.source_id === sourceId) return true;
    }
  }
  // 2. scenarios[].base_legale
  const scenarios = fiche.scenarios || fiche.cases || [];
  if (Array.isArray(scenarios)) {
    for (const s of scenarios) {
      const bl = s?.base_legale || '';
      if (bl && bl.toLowerCase().includes(refLc)) return true;
    }
  }
  // 3. Shallow: fiche.base_legale or fiche.source_ids
  if (fiche.base_legale && String(fiche.base_legale).toLowerCase().includes(refLc)) return true;
  if (Array.isArray(fiche.source_ids) && fiche.source_ids.includes(sourceId)) return true;
  // 4. Last resort: JSON string contains ref (coarse, but safe for our data shape)
  try {
    const blob = JSON.stringify(fiche).toLowerCase();
    if (blob.includes(refLc)) return true;
  } catch { /* ignore */ }
  return false;
}

/**
 * Build a canonical source_id from an article ref like "CO 259a".
 * Returns "fedlex:rs220:co-259a".
 */
export function buildSourceId(ref) {
  if (!ref) return 'fedlex:unknown';
  const m = String(ref).trim().match(/^([A-Za-z]+)\s*([0-9a-zA-Z]+(?:[.\-][0-9a-zA-Z]+)?)$/);
  if (!m) return `fedlex:unknown:${String(ref).toLowerCase().replace(/\s+/g, '-')}`;
  const code = m[1].toLowerCase();
  const num = m[2].toLowerCase();
  const rs = codeToRs(code);
  return `fedlex:${rs}:${code}-${num}`;
}

function codeToRs(code) {
  const map = {
    co: 'rs220', cc: 'rs210', cp: 'rs311', cpc: 'rs272', lp: 'rs281.1',
    ltr: 'rs220', lei: 'rs142.20', lasi: 'rs142.31', ln: 'rs141.0',
    oblf: 'rs221.213.11',
  };
  return map[code] || `rs${code}`;
}

// ─── RS number helpers ──────────────────────────────────────────

/**
 * Parse an article ref (ex: "CO 259a") into { code, rs, article }.
 */
export function parseRef(ref) {
  const m = String(ref || '').trim().match(/^([A-Za-z]+)\s*([0-9a-zA-Z.\-]+)$/);
  if (!m) return null;
  const code = m[1].toUpperCase();
  const rs = codeToRs(m[1].toLowerCase()).replace(/^rs/, '');
  return { code, rs, article: m[2] };
}
