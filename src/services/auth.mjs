/**
 * Auth Service — Email-based authentication with magic codes
 *
 * Flow:
 * 1. User enters email → POST /api/auth/send-code → 6-digit code sent by email
 * 2. User enters code → POST /api/auth/verify-code → returns session token
 * 3. Session token stored in localStorage, used for all premium API calls
 * 4. Stripe checkout includes email → wallet auto-linked to email
 *
 * No passwords. No OAuth. Just email + code.
 */

import { randomInt, randomBytes } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicWriteSync, safeLoadJSON } from './atomic-write.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USERS_FILE = join(__dirname, '..', 'data', 'meta', 'users.json');

// ─── In-memory stores ───────────────────────────────────────────

const pendingCodes = new Map(); // email → { code, expiresAt, attempts }
const authTokens = new Map();   // token → { email, activeSession, createdAt, expiresAt }
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const AUTH_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 5;
const CODE_COOLDOWN_MS = 60 * 1000; // 1 min between sends

// ─── User store (persisted to file) ─────────────────────────────

let users = new Map(); // email → { email, walletSessions: [], createdAt, lastLogin }

function loadUsers() {
  const data = safeLoadJSON(USERS_FILE);
  if (Array.isArray(data)) {
    users = new Map(data);
  }
}

let saveTimer = null;
function saveUsers() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      atomicWriteSync(USERS_FILE, JSON.stringify([...users], null, 2));
    } catch (err) {
      console.error('Failed to save users:', err.message);
    }
  }, 1000);
}

export function _flushUsers() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  try {
    atomicWriteSync(USERS_FILE, JSON.stringify([...users], null, 2));
  } catch {}
}

loadUsers();

// ─── Email sending ──────────────────────────────────────────────

let resend = null;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'JusticePourtous <noreply@justicepourtous.ch>';

if (RESEND_KEY) {
  const { Resend } = await import('resend');
  resend = new Resend(RESEND_KEY);
  console.log('Email service enabled (Resend)');
} else {
  if (process.env.NODE_ENV === 'production') {
    console.warn('WARNING: Email service not configured in production — codes will NOT be logged');
  } else {
    console.log('Email service not configured — codes logged to console (dev mode)');
  }
}

async function sendEmail(to, subject, html) {
  if (resend) {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    if (error) throw new Error(error.message);
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Service email non configuré. Contactez l\'administrateur.');
    } else {
      // Dev mode — log to console
      console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      console.log(html.replace(/<[^>]+>/g, ''));
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Send a 6-digit verification code to email.
 */
export async function sendCode(email) {
  if (!email || !email.includes('@')) {
    return { error: 'Email invalide', status: 400 };
  }

  const normalized = email.toLowerCase().trim();

  // Rate limit
  const existing = pendingCodes.get(normalized);
  if (existing && Date.now() - existing.sentAt < CODE_COOLDOWN_MS) {
    const waitSec = Math.ceil((CODE_COOLDOWN_MS - (Date.now() - existing.sentAt)) / 1000);
    return { error: `Attendez ${waitSec}s avant de renvoyer un code`, status: 429 };
  }

  // Generate 6-digit code
  const code = String(randomInt(100000, 999999));

  pendingCodes.set(normalized, {
    code,
    expiresAt: Date.now() + CODE_EXPIRY_MS,
    attempts: 0,
    sentAt: Date.now(),
  });

  // Send email
  try {
    await sendEmail(normalized, 'Votre code JusticePourtous', `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <h2 style="color:#1B1B1B;margin-bottom:8px">JusticePourtous</h2>
        <p style="color:#4A4A4A">Votre code de connexion :</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#8B2500;padding:16px;background:#FAF9F7;border-radius:8px;text-align:center;margin:16px 0">
          ${code}
        </div>
        <p style="color:#7A7A7A;font-size:13px">Ce code expire dans 10 minutes. Si vous n'avez pas demandé ce code, ignorez cet email.</p>
        <hr style="border:none;border-top:1px solid #E5E2DE;margin:20px 0">
        <p style="color:#7A7A7A;font-size:11px">justicepourtous.ch — Information juridique générale</p>
      </div>
    `);
  } catch (err) {
    console.error('Email send error:', err.message);
    return { error: 'Impossible d\'envoyer le code. Réessayez.', status: 500 };
  }

  return { status: 200, data: { message: 'Code envoyé', expiresIn: CODE_EXPIRY_MS / 1000 } };
}

/**
 * Verify a code and return the user's wallet sessions.
 */
export function verifyCode(email, code) {
  if (!email || !code) {
    return { error: 'Email et code requis', status: 400 };
  }

  const normalized = email.toLowerCase().trim();
  const pending = pendingCodes.get(normalized);

  if (!pending) {
    return { error: 'Aucun code en attente. Demandez un nouveau code.', status: 404 };
  }

  if (Date.now() > pending.expiresAt) {
    pendingCodes.delete(normalized);
    return { error: 'Code expiré. Demandez un nouveau code.', status: 410 };
  }

  pending.attempts++;
  if (pending.attempts > MAX_ATTEMPTS) {
    pendingCodes.delete(normalized);
    return { error: 'Trop de tentatives. Demandez un nouveau code.', status: 429 };
  }

  if (pending.code !== String(code).trim()) {
    return { error: `Code incorrect. ${MAX_ATTEMPTS - pending.attempts} tentatives restantes.`, status: 401 };
  }

  // Code valid — clean up
  pendingCodes.delete(normalized);

  // Get or create user
  let user = users.get(normalized);
  if (!user) {
    user = { email: normalized, walletSessions: [], createdAt: new Date().toISOString(), lastLogin: null };
    users.set(normalized, user);
  }
  user.lastLogin = new Date().toISOString();

  // Return only the most recent valid wallet session, not all raw codes
  const activeSession = user.walletSessions.length > 0
    ? user.walletSessions[user.walletSessions.length - 1]
    : null;

  // Generate a short-lived auth token instead of exposing wallet codes
  const authToken = randomBytes(32).toString('hex');
  authTokens.set(authToken, {
    email: normalized,
    activeSession,
    createdAt: Date.now(),
    expiresAt: Date.now() + AUTH_TOKEN_EXPIRY_MS,
  });

  saveUsers();

  return {
    status: 200,
    data: {
      email: normalized,
      authToken,
      activeSession,
      walletCount: user.walletSessions.length,
      authenticated: true,
    }
  };
}

/**
 * Link a wallet session to an email.
 */
export function linkWalletToEmail(email, sessionCode) {
  if (!email || !sessionCode) return;
  const normalized = email.toLowerCase().trim();

  let user = users.get(normalized);
  if (!user) {
    user = { email: normalized, walletSessions: [], createdAt: new Date().toISOString(), lastLogin: null };
    users.set(normalized, user);
  }

  if (!user.walletSessions.includes(sessionCode)) {
    user.walletSessions.push(sessionCode);
    saveUsers();
  }
}

/**
 * Get all wallet sessions for an email.
 */
export function getWalletsByEmail(email) {
  if (!email) return [];
  const normalized = email.toLowerCase().trim();
  const user = users.get(normalized);
  return user?.walletSessions || [];
}

/**
 * Get email by wallet session (reverse lookup).
 */
export function getEmailByWallet(sessionCode) {
  for (const [email, user] of users) {
    if (user.walletSessions.includes(sessionCode)) return email;
  }
  return null;
}

/**
 * Resolve an auth token to the associated wallet session.
 * Returns { email, activeSession } or null if invalid/expired.
 */
export function resolveAuthToken(token) {
  if (!token) return null;
  const entry = authTokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    authTokens.delete(token);
    return null;
  }
  return { email: entry.email, activeSession: entry.activeSession };
}
