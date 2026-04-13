import { randomBytes } from 'node:crypto';
import { analyzeCase, estimateAnalysisCost } from './ai-analysis.mjs';
import { processDocument } from './ocr.mjs';
import { generateLetter } from './letter-generator.mjs';

// In-memory wallets (simulated)
const wallets = new Map();

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
  return null; // no error
}

// --- Test account (created at startup, never expires, infinite credits) ---
const TEST_SESSION = 'test-robin-2026';
wallets.set(TEST_SESSION, {
  sessionCode: TEST_SESSION,
  solde: 999999, // effectively unlimited
  createdAt: Date.now(),
  isTest: true,
  historique: [
    { action: 'compte_test', montant: 0, date: new Date().toISOString() }
  ]
});

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
  return sessionCode;
}
