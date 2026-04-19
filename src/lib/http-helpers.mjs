/**
 * HTTP helper utilities extracted from server.mjs
 * Shared by all route handlers: parsing, responses, static serving, rate limiting, sanitization.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

// ─── Constants ──────────────────────────────────────────────────

export const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_QUERY_LENGTH = 2000; // max chars for search queries
export const MAX_BODY_SIZE = 100 * 1024; // 100KB for JSON bodies

// ─── Security headers ───────────────────────────────────────────

export function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

// ─── JSON response ──────────────────────────────────────────────

export function json(res, statusCode, data) {
  setSecurityHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// ─── Body parsing ───────────────────────────────────────────────

export function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) { req.destroy(); reject(new Error('Body too large')); return; }
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

export function parseRawBody(req, maxSize) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxSize) {
        tooLarge = true;
        chunks.length = 0;
      }
      if (!tooLarge) chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) return reject(new Error('BODY_TOO_LARGE'));
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

// ─── Static file serving ────────────────────────────────────────

export function serveStatic(req, res, filePath, publicDir) {
  if (!existsSync(filePath)) {
    const notFoundPage = join(publicDir, '404.html');
    if (existsSync(notFoundPage)) {
      setSecurityHeaders(res);
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(readFileSync(notFoundPage));
    } else {
      json(res, 404, { error: 'Not found' });
    }
    return;
  }
  const ext = extname(filePath);
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  setSecurityHeaders(res);
  let cacheControl = 'no-cache';
  if (ext === '.css' || ext === '.js') {
    cacheControl = 'public, max-age=3600';
  } else if (ext === '.png' || ext === '.svg' || ext === '.ico' || ext === '.jpg' || ext === '.jpeg' || ext === '.gif' || ext === '.webp') {
    cacheControl = 'public, max-age=86400';
  }
  res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cacheControl });
  res.end(readFileSync(filePath));
}

// ─── Input sanitization (anti-prompt injection) ─────────────────

export function sanitizeUserInput(text, maxLength = 5000) {
  if (!text || typeof text !== 'string') return '';
  let clean = text.slice(0, maxLength);
  clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  clean = clean.replace(/ignore\s+(all\s+)?previous\s+instructions?/gi, '[filtered]');
  clean = clean.replace(/system\s*prompt/gi, '[filtered]');
  clean = clean.replace(/you\s+are\s+now/gi, '[filtered]');
  clean = clean.replace(/act\s+as\s+(a|an)\s/gi, '[filtered] ');
  clean = clean.replace(/\bDAN\b/g, '[filtered]');
  return clean.trim();
}

// ─── Rate limiter (in-memory, per IP) ───────────────────────────

const rateLimitStore = new Map();
const RATE_LIMIT = { windowMs: 60000, maxRequests: 60 };

export function rateLimit(ip) {
  const now = Date.now();
  let entry = rateLimitStore.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT.windowMs) {
    entry = { windowStart: now, count: 0 };
    rateLimitStore.set(ip, entry);
  }
  entry.count++;
  if (entry.count > RATE_LIMIT.maxRequests) return false;
  return true;
}

// Cleanup rate limit store every 5 min (unref so tests can exit)
const _rlCleanup = setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT.windowMs * 2;
  for (const [ip, entry] of rateLimitStore) {
    if (entry.windowStart < cutoff) rateLimitStore.delete(ip);
  }
}, 300000).unref();

// ─── Rate limiter différencié par bucket (review vague 2, HAUT sécurité) ──
// Fenêtre glissante par (ip, bucket). Chaque bucket a son propre max/min.

export const RATE_LIMIT_BUCKETS = {
  premium_llm:       { max: 10, windowMs: 60_000 },
  letter_generation: { max: 10, windowMs: 60_000 },
  validation_heavy:  { max: 20, windowMs: 60_000 },
  default:           { max: 60, windowMs: 60_000 },
};

/**
 * Mappe un path d'API → bucket de rate-limit.
 * Liste fermée : tout ce qui n'est pas nommé retombe sur 'default'.
 */
export function bucketForPath(path) {
  if (!path || typeof path !== 'string') return 'default';

  // premium_llm : LLM coûteux
  if (path === '/api/premium/analyze') return 'premium_llm';
  if (path.startsWith('/api/premium/analyze-v3')) return 'premium_llm';
  if (path === '/api/premium/ocr') return 'premium_llm';
  if (path === '/api/premium/analyze-ocr') return 'premium_llm';
  if (path === '/api/premium/translate') return 'premium_llm';

  // letter_generation : pack lourd IO + synthèse
  if (path === '/api/premium/generate-letter') return 'letter_generation';
  if (path === '/api/triage/escalation') return 'letter_generation';
  if (/^\/api\/triage\/escalation\/[^/]+\/download\.json$/.test(path)) return 'letter_generation';
  if (/^\/api\/case\/[^/]+\/letter$/.test(path)) return 'letter_generation';

  // validation_heavy : sources
  if (path === '/api/sources/validate') return 'validation_heavy';

  return 'default';
}

// Store par bucket : Map<bucket, Map<ip, number[]>> (timestamps ms)
const _bucketStores = new Map();
for (const key of Object.keys(RATE_LIMIT_BUCKETS)) _bucketStores.set(key, new Map());

/**
 * Sliding-window rate limiter par (ip, bucket).
 *
 * @param {string} pathOrBucket — path d'API (résolu via bucketForPath) OU nom direct de bucket
 * @param {string} ip
 * @param {number} [now] — timestamp ms (injectable pour tests)
 * @returns {{allowed: boolean, bucket: string, retry_after_seconds?: number, reason?: string}}
 */
// Compteurs par bucket (cumul depuis le boot). Exposés via getRateLimitStats().
const _bucketCounters = new Map();
for (const key of Object.keys(RATE_LIMIT_BUCKETS)) {
  _bucketCounters.set(key, { allowed: 0, throttled: 0 });
}

export function rateLimitFor(pathOrBucket, ip, now = Date.now()) {
  const bucket = RATE_LIMIT_BUCKETS[pathOrBucket] ? pathOrBucket : bucketForPath(pathOrBucket);
  const cfg = RATE_LIMIT_BUCKETS[bucket] || RATE_LIMIT_BUCKETS.default;
  const store = _bucketStores.get(bucket);
  const counters = _bucketCounters.get(bucket);
  const key = ip || 'unknown';
  let timestamps = store.get(key);
  if (!timestamps) {
    timestamps = [];
    store.set(key, timestamps);
  }
  // Purge expired
  const cutoff = now - cfg.windowMs;
  while (timestamps.length && timestamps[0] <= cutoff) timestamps.shift();
  if (timestamps.length >= cfg.max) {
    const oldest = timestamps[0];
    const retryMs = Math.max(1000, oldest + cfg.windowMs - now);
    const retry_after_seconds = Math.max(1, Math.min(60, Math.ceil(retryMs / 1000)));
    if (counters) counters.throttled++;
    return { allowed: false, bucket, retry_after_seconds, reason: 'rate_limit_exceeded' };
  }
  timestamps.push(now);
  if (counters) counters.allowed++;
  return { allowed: true, bucket };
}

/** Stats rate-limit par bucket, pour /api/admin/metrics. */
export function getRateLimitStats() {
  const out = {};
  for (const [bucket, counters] of _bucketCounters) {
    const cfg = RATE_LIMIT_BUCKETS[bucket];
    const store = _bucketStores.get(bucket);
    out[bucket] = {
      ...counters,
      active_ips: store.size,
      window_ms: cfg.windowMs,
      max_per_window: cfg.max,
    };
  }
  return out;
}

/** Reset interne pour les tests. */
export function _resetRateLimitStores() {
  for (const store of _bucketStores.values()) store.clear();
  for (const c of _bucketCounters.values()) { c.allowed = 0; c.throttled = 0; }
  rateLimitStore.clear();
}

// Cleanup buckets every 5 min — unref so tests can exit
const _bucketCleanup = setInterval(() => {
  const now = Date.now();
  for (const [bucketName, store] of _bucketStores) {
    const windowMs = (RATE_LIMIT_BUCKETS[bucketName] || RATE_LIMIT_BUCKETS.default).windowMs;
    const cutoff = now - windowMs;
    for (const [ip, ts] of store) {
      while (ts.length && ts[0] <= cutoff) ts.shift();
      if (ts.length === 0) store.delete(ip);
    }
  }
}, 300_000).unref();

// ─── Triage audit log (in-memory, last 1000) ────────────────────

const triageLog = [];
const MAX_TRIAGE_LOG = 1000;

export function logTriage(input, output, method, durationMs) {
  const entry = {
    timestamp: new Date().toISOString(),
    input: typeof input === 'string' ? input.slice(0, 200) : '(structured)',
    method,
    ficheId: output?.ficheId || output?.fiche?.id || null,
    domaine: output?.domaine || output?.fiche?.domaine || null,
    confiance: output?.confiance || null,
    durationMs: Math.round(durationMs),
  };
  triageLog.push(entry);
  if (triageLog.length > MAX_TRIAGE_LOG) triageLog.shift();
}

export function getTriageLog() {
  return triageLog;
}

// ─── Admin token check ──────────────────────────────────────────

export function checkAdmin(req, res) {
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
  if (!ADMIN_TOKEN) {
    json(res, 403, { error: 'Admin access not configured' });
    return false;
  }
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== ADMIN_TOKEN) {
    json(res, 403, { error: 'Forbidden' });
    return false;
  }
  return true;
}

// ─── In-memory feedback store ───────────────────────────────────

const feedbackStore = [];

export function getFeedbackStore() {
  return feedbackStore;
}
