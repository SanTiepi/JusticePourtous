import { randomBytes } from 'node:crypto';

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
  const now = Date.now();
  const expiryMs = WALLET_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  return (now - wallet.createdAt) > expiryMs;
}

export function acheterWallet() {
  const sessionCode = generateSessionCode();
  const wallet = {
    sessionCode,
    solde: WALLET_CREDITS_CENTIMES,
    createdAt: Date.now(),
    historique: [
      { action: 'achat', montant: WALLET_PRICE_CENTIMES, date: new Date().toISOString() }
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
