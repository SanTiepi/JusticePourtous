import { randomBytes } from 'node:crypto';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeCase, estimateAnalysisCost } from './ai-analysis.mjs';
import { processDocument } from './ocr.mjs';
import { generateLetter } from './letter-generator.mjs';
import { atomicWriteSync, safeLoadJSON } from './atomic-write.mjs';

// --- Persistence layer ---
const __dirname = dirname(fileURLToPath(import.meta.url));
const WALLETS_PATH = join(__dirname, '..', 'data', 'meta', 'wallets.json');

const wallets = new Map();

/** Load wallets from disk. Silent no-op if file missing (first run). */
function loadWallets() {
  const entries = safeLoadJSON(WALLETS_PATH);
  if (!Array.isArray(entries)) return;
  wallets.clear();
  for (const [key, value] of entries) {
    wallets.set(key, value);
  }
}

let _saveTimer = null;
/** Debounced save — max 1 write per second. */
function saveWallets() {
  if (_saveTimer) return; // already scheduled
  _saveTimer = setTimeout(() => {
    _saveTimer = null;
    try {
      const dir = dirname(WALLETS_PATH);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const entries = [...wallets.entries()];
      atomicWriteSync(WALLETS_PATH, JSON.stringify(entries, null, 2));
    } catch {
      // Disk write failed — log in production, silent in dev
    }
  }, 1000);
}

/** Force an immediate flush (useful for graceful shutdown). */
export function _flushWallets() {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  try {
    const dir = dirname(WALLETS_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const entries = [...wallets.entries()];
    atomicWriteSync(WALLETS_PATH, JSON.stringify(entries, null, 2));
  } catch {
    // silent
  }
}

// --- Constants ---
const WALLET_PRICE_CENTIMES = 5000; // CHF 50
const WALLET_CREDITS_CENTIMES = 3000; // CHF 30
const ANALYSE_COST_MIN = 3; // CHF 0.03
const ANALYSE_COST_MAX = 10; // CHF 0.10
const LETTRE_COST = 5; // CHF 0.05
const OCR_COST = 1; // CHF 0.01
const WALLET_EXPIRY_DAYS = 90;

function generateSessionCode() {
  return randomBytes(16).toString('hex');
}

function isExpired(wallet) {
  if (wallet.isTest) return false; // test accounts never expire
  const now = Date.now();
  const expiryMs = WALLET_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return (now - wallet.createdAt) > expiryMs;
}

function getWallet(sessionCode) {
  if (!sessionCode) return { error: 'Session requise', status: 403 };
  const wallet = wallets.get(sessionCode);
  if (!wallet) return { error: 'Session invalide', status: 403 };
  if (isExpired(wallet)) return { error: 'Wallet expire', status: 402 };
  return { wallet };
}

function debit(wallet, amount, action, details = {}) {
  if (wallet.solde < amount) {
    return {
      error: 'Solde insuffisant',
      status: 402,
      data: { solde: wallet.solde, coutEstime: amount }
    };
  }
  wallet.solde -= amount;
  wallet.historique.push({
    action,
    montant: -amount,
    date: new Date().toISOString(),
    ...details
  });
  saveWallets();
  return null; // no error
}

// --- Initialization: load persisted wallets, then ensure test account exists ---
loadWallets();

const TEST_SESSION = process.env.ADMIN_TEST_SESSION || 'dev-test-fallback-' + randomBytes(8).toString('hex');
// Only create test wallet outside production — in production, ADMIN_TEST_SESSION should not auto-create unlimited credits
if (process.env.NODE_ENV !== 'production' && !wallets.has(TEST_SESSION)) {
  wallets.set(TEST_SESSION, {
    sessionCode: TEST_SESSION,
    solde: 999999, // effectively unlimited
    createdAt: Date.now(),
    isTest: true,
    historique: [
      { action: 'compte_test', montant: 0, date: new Date().toISOString() }
    ]
  });
  saveWallets();
}

const MARGIN_MULTIPLIER = 2.5; // 150% margin on API costs — conservative to cover edge cases

/**
 * Debit a session wallet. Cost in centimes, with margin applied.
 * @param {string} sessionCode
 * @param {number} apiCostCentimes — raw API cost
 * @param {string} action — description for history
 * @returns {{error?: string, status?: number, charged?: number}}
 */
export function debitSession(sessionCode, apiCostCentimes, action = 'analyse') {
  const { wallet, error, status } = getWallet(sessionCode);
  if (error) return { error, status };

  const charged = Math.max(1, Math.ceil(apiCostCentimes * MARGIN_MULTIPLIER));
  const err = debit(wallet, charged, action);
  if (err) return err;
  return { charged, solde: wallet.solde };
}

/**
 * Credit (refund) a session wallet.
 * @param {string} sessionCode
 * @param {number} amount — amount in centimes to refund
 * @param {string} reason — reason for the refund
 * @returns {{error?: string, status?: number, solde?: number}}
 */
export function creditSession(sessionCode, amount, reason) {
  const { wallet, error, status } = getWallet(sessionCode);
  if (error) return { error, status };
  wallet.solde += amount;
  wallet.historique.push({ action: 'remboursement', montant: amount, date: new Date().toISOString(), raison: reason });
  saveWallets();
  return { solde: wallet.solde };
}

export function acheterWallet(montantCentimes) {
  const solde = montantCentimes || WALLET_CREDITS_CENTIMES;
  const sessionCode = generateSessionCode();
  const wallet = {
    sessionCode,
    solde,
    createdAt: Date.now(),
    historique: [
      { action: 'achat', montant: solde, date: new Date().toISOString() }
    ]
  };
  wallets.set(sessionCode, wallet);
  saveWallets();
  return {
    status: 200,
    data: {
      sessionCode,
      solde: wallet.solde,
      expiresIn: `${WALLET_EXPIRY_DAYS} jours`
    }
  };
}

export function getCredits(sessionCode) {
  if (!sessionCode) return { error: 'Session requise', status: 403 };
  const wallet = wallets.get(sessionCode);
  if (!wallet) return { error: 'Session invalide', status: 403 };
  if (isExpired(wallet)) return { error: 'Wallet expire', status: 402 };
  return {
    status: 200,
    data: {
      solde: wallet.solde,
      historique: wallet.historique,
      expire: isExpired(wallet)
    }
  };
}

// --- Legacy simple functions (kept for backward compat) ---

export function analyser(sessionCode, question) {
  if (!sessionCode) return { error: 'Session requise', status: 403 };
  const wallet = wallets.get(sessionCode);
  if (!wallet) return { error: 'Session invalide', status: 403 };
  if (isExpired(wallet)) return { error: 'Wallet expire', status: 402 };

  const cost = Math.floor(Math.random() * (ANALYSE_COST_MAX - ANALYSE_COST_MIN + 1)) + ANALYSE_COST_MIN;

  if (wallet.solde < cost) {
    return {
      error: 'Solde insuffisant',
      status: 402,
      data: { solde: wallet.solde, coutEstime: cost }
    };
  }

  wallet.solde -= cost;
  wallet.historique.push({
    action: 'analyse',
    montant: -cost,
    date: new Date().toISOString(),
    question: question ? question.substring(0, 100) : ''
  });
  saveWallets();

  return {
    status: 200,
    data: {
      reponse: `[Simulation Premium] Analyse juridique personnalisee pour votre situation. En production, Claude Sonnet analyserait vos documents et fournirait une reponse detaillee basee sur la jurisprudence specifique a votre cas. Cout: CHF ${(cost / 100).toFixed(2)}`,
      coutEffectif: cost,
      soldeRestant: wallet.solde,
      estimationCout: { min: ANALYSE_COST_MIN, max: ANALYSE_COST_MAX }
    }
  };
}

export function genererLettre(sessionCode, params) {
  if (!sessionCode) return { error: 'Session requise', status: 403 };
  const wallet = wallets.get(sessionCode);
  if (!wallet) return { error: 'Session invalide', status: 403 };
  if (isExpired(wallet)) return { error: 'Wallet expire', status: 402 };

  if (wallet.solde < LETTRE_COST) {
    return { error: 'Solde insuffisant', status: 402, data: { solde: wallet.solde, coutEstime: LETTRE_COST } };
  }

  wallet.solde -= LETTRE_COST;
  wallet.historique.push({
    action: 'lettre',
    montant: -LETTRE_COST,
    date: new Date().toISOString()
  });
  saveWallets();

  return {
    status: 200,
    data: {
      lettre: `[Simulation Premium] Lettre personnalisee generee. En production, Claude adapterait le modele a vos circonstances specifiques.`,
      coutEffectif: LETTRE_COST,
      soldeRestant: wallet.solde
    }
  };
}

export function ocrDocument(sessionCode) {
  if (!sessionCode) return { error: 'Session requise', status: 403 };
  const wallet = wallets.get(sessionCode);
  if (!wallet) return { error: 'Session invalide', status: 403 };
  if (isExpired(wallet)) return { error: 'Wallet expire', status: 402 };

  if (wallet.solde < OCR_COST) {
    return { error: 'Solde insuffisant', status: 402, data: { solde: wallet.solde, coutEstime: OCR_COST } };
  }

  wallet.solde -= OCR_COST;
  wallet.historique.push({
    action: 'ocr',
    montant: -OCR_COST,
    date: new Date().toISOString()
  });
  saveWallets();

  return {
    status: 200,
    data: {
      texte: `[Simulation Premium] Document analyse par OCR. En production, Mistral OCR extrairait le texte de vos documents.`,
      coutEffectif: OCR_COST,
      soldeRestant: wallet.solde
    }
  };
}

// --- New AI-powered premium functions ---

/**
 * AI-powered case analysis with wallet debit.
 */
export async function analyserAI(sessionCode, { ficheId, userContext, question }) {
  const check = getWallet(sessionCode);
  if (check.error) return check;
  const { wallet } = check;

  // Estimate cost first
  const estimate = estimateAnalysisCost(ficheId, userContext, question);

  // Check minimum balance
  if (wallet.solde < estimate.min) {
    return {
      error: 'Solde insuffisant',
      status: 402,
      data: { solde: wallet.solde, coutEstime: estimate }
    };
  }

  try {
    const { response, cost } = await analyzeCase({ ficheId, userContext, question });
    const actualCost = Math.min(cost, wallet.solde); // never exceed balance

    const debitErr = debit(wallet, actualCost, 'analyse_ai', {
      ficheId,
      question: question.substring(0, 100)
    });
    if (debitErr) return debitErr;

    return {
      status: 200,
      data: {
        ...response,
        coutEffectif: actualCost,
        soldeRestant: wallet.solde,
        estimationCout: estimate
      }
    };
  } catch (err) {
    return { error: err.message, status: 500 };
  }
}

/**
 * OCR with wallet debit.
 */
export async function ocrDocumentAI(sessionCode, buffer, filename) {
  const check = getWallet(sessionCode);
  if (check.error) return check;
  const { wallet } = check;

  if (wallet.solde < OCR_COST) {
    return {
      error: 'Solde insuffisant',
      status: 402,
      data: { solde: wallet.solde, coutEstime: OCR_COST }
    };
  }

  try {
    const result = await processDocument(buffer, filename);
    const actualCost = Math.max(result.cost, OCR_COST);

    const debitErr = debit(wallet, actualCost, 'ocr_ai', { filename });
    if (debitErr) return debitErr;

    return {
      status: 200,
      data: {
        ...result,
        coutEffectif: actualCost,
        soldeRestant: wallet.solde
      }
    };
  } catch (err) {
    if (err.message.includes('trop volumineux')) {
      return { error: err.message, status: 413 };
    }
    return { error: err.message, status: 500 };
  }
}

/**
 * Letter generation with wallet debit.
 */
export async function genererLettreAI(sessionCode, { ficheId, userContext, type }) {
  const check = getWallet(sessionCode);
  if (check.error) return check;
  const { wallet } = check;

  if (wallet.solde < LETTRE_COST) {
    return {
      error: 'Solde insuffisant',
      status: 402,
      data: { solde: wallet.solde, coutEstime: LETTRE_COST }
    };
  }

  try {
    const result = await generateLetter({ ficheId, userContext, type });

    const debitErr = debit(wallet, result.cost, 'lettre_ai', { ficheId, type });
    if (debitErr) return debitErr;

    return {
      status: 200,
      data: {
        ...result,
        coutEffectif: result.cost,
        soldeRestant: wallet.solde
      }
    };
  } catch (err) {
    return { error: err.message, status: 400 };
  }
}

/**
 * Estimate cost before action (does not debit).
 */
export function estimerCout(action, params = {}) {
  switch (action) {
    case 'analyse':
      return {
        status: 200,
        data: {
          action: 'analyse',
          estimation: estimateAnalysisCost(params.ficheId, params.userContext, params.question),
          unite: 'centimes CHF'
        }
      };
    case 'lettre':
      return {
        status: 200,
        data: {
          action: 'lettre',
          estimation: { min: LETTRE_COST, max: LETTRE_COST },
          unite: 'centimes CHF'
        }
      };
    case 'ocr':
      return {
        status: 200,
        data: {
          action: 'ocr',
          estimation: { min: OCR_COST, max: OCR_COST * 5 },
          unite: 'centimes CHF'
        }
      };
    default:
      return { error: 'Action inconnue', status: 400 };
  }
}

/**
 * Get debit history for a wallet.
 */
export function getHistorique(sessionCode) {
  const check = getWallet(sessionCode);
  if (check.error) return check;
  const { wallet } = check;

  const debits = wallet.historique.filter(h => h.montant < 0);
  const total = debits.reduce((sum, h) => sum + Math.abs(h.montant), 0);

  return {
    status: 200,
    data: {
      debits,
      totalDepense: total,
      soldeRestant: wallet.solde,
      nombreOperations: debits.length
    }
  };
}

// For testing: create an expired wallet
export function _createExpiredWallet() {
  const sessionCode = generateSessionCode();
  const wallet = {
    sessionCode,
    solde: WALLET_CREDITS_CENTIMES,
    createdAt: Date.now() - (WALLET_EXPIRY_DAYS + 1) * 24 * 60 * 60 * 1000,
    historique: []
  };
  wallets.set(sessionCode, wallet);
  saveWallets();
  return sessionCode;
}

// For testing: create wallet with specific balance
export function _createWalletWithBalance(balance) {
  const sessionCode = generateSessionCode();
  const wallet = {
    sessionCode,
    solde: balance,
    createdAt: Date.now(),
    historique: []
  };
  wallets.set(sessionCode, wallet);
  saveWallets();
  return sessionCode;
}
