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

// Cleanup rate limit store every 5 min
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT.windowMs * 2;
  for (const [ip, entry] of rateLimitStore) {
    if (entry.windowStart < cutoff) rateLimitStore.delete(ip);
  }
}, 300000);

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
