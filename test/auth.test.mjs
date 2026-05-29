/**
 * Tests unitaires — auth.mjs
 *
 * Vérifie les propriétés de sécurité du service d'authentification :
 *   - sendCode         : validation email, rate-limit cooldown
 *   - verifyCode       : guards, brute-force protection, expiry, succès
 *   - resolveAuthToken : cycle de vie, expiry
 *   - wallet CRUD      : linkWalletToEmail / getWalletsByEmail / getEmailByWallet
 *
 * Zéro LLM, zéro réseau (pas de RESEND_API_KEY → dev mode, aucun email réel envoyé).
 */

import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  sendCode,
  verifyCode,
  resolveAuthToken,
  linkWalletToEmail,
  getWalletsByEmail,
  getEmailByWallet,
  _testOnlySetPendingCode,
  _testOnlySetAuthToken,
  _testOnlyReset,
} from '../src/services/auth.mjs';

// Nettoyer l'état en mémoire après tous les tests (annule aussi les timers de sauvegarde)
after(() => { _testOnlyReset(); });

// ─── sendCode — validation et rate-limit ─────────────────────────────────────

describe('sendCode — validation email', () => {
  it('email null → status 400', async () => {
    const r = await sendCode(null);
    assert.equal(r.status, 400);
    assert.ok(r.error);
  });

  it('email sans @ → status 400', async () => {
    const r = await sendCode('pasunemaildutout');
    assert.equal(r.status, 400);
  });

  it('email vide → status 400', async () => {
    const r = await sendCode('');
    assert.equal(r.status, 400);
  });

  it('email valide dev mode → status 200 + expiresIn 600s', async () => {
    const r = await sendCode('valide@jpt.test');
    assert.equal(r.status, 200);
    assert.ok(r.data?.message);
    assert.equal(r.data?.expiresIn, 600);
  });
});

describe('sendCode — rate-limit cooldown', () => {
  it('second envoi dans la minute → status 429 + waitSec entier positif', async () => {
    const email = 'ratelimit@jpt.test';
    await sendCode(email); // premier envoi
    const r = await sendCode(email); // second immédiat
    assert.equal(r.status, 429);
    assert.ok(r.error?.includes('Attendez'), `message inattendu : ${r.error}`);
    const m = r.error?.match(/(\d+)s/);
    assert.ok(m, 'doit contenir un nombre de secondes');
    assert.ok(parseInt(m[1], 10) > 0, 'waitSec doit être > 0');
  });
});

// ─── verifyCode — guards et anti brute-force ─────────────────────────────────

describe('verifyCode — paramètres invalides', () => {
  it('email null → status 400', () => {
    const r = verifyCode(null, '123456');
    assert.equal(r.status, 400);
  });

  it('code null → status 400', () => {
    const r = verifyCode('user@jpt.test', null);
    assert.equal(r.status, 400);
  });

  it('email et code null → status 400', () => {
    const r = verifyCode(null, null);
    assert.equal(r.status, 400);
  });

  it('pas de code en attente → status 404', () => {
    const r = verifyCode('inconnu@jpt.test', '123456');
    assert.equal(r.status, 404);
  });
});

describe('verifyCode — code expiré', () => {
  it('code expiré → status 410 + code supprimé', () => {
    const email = 'expired@jpt.test';
    _testOnlySetPendingCode(email, '999888', { expiresAt: Date.now() - 1 });
    const r = verifyCode(email, '999888');
    assert.equal(r.status, 410);
    // Après expiry, le code est supprimé — un nouvel appel donne 404
    const r2 = verifyCode(email, '999888');
    assert.equal(r2.status, 404, 'code doit être supprimé après expiry');
  });
});

describe('verifyCode — brute force protection', () => {
  it('1ère tentative incorrecte → 401 + 4 tentatives restantes', () => {
    const email = 'bf1@jpt.test';
    _testOnlySetPendingCode(email, 'CORRECT');
    const r = verifyCode(email, 'FAUX');
    assert.equal(r.status, 401);
    assert.ok(r.error?.includes('4 tentatives restantes'), `message: ${r.error}`);
  });

  it('5ème tentative incorrecte → 401 + 0 tentatives restantes', () => {
    const email = 'bf5@jpt.test';
    _testOnlySetPendingCode(email, 'CORRECT', { attempts: 4 }); // déjà 4 tentatives
    const r = verifyCode(email, 'FAUX'); // devient attempts=5
    assert.equal(r.status, 401);
    assert.ok(r.error?.includes('0 tentatives restantes'), `message: ${r.error}`);
  });

  it('6ème tentative → 429 lockout + code supprimé', () => {
    const email = 'bf6@jpt.test';
    _testOnlySetPendingCode(email, 'CORRECT', { attempts: 5 }); // déjà 5 tentatives
    const r = verifyCode(email, 'FAUX'); // 5+1=6 > MAX_ATTEMPTS(5) → lockout
    assert.equal(r.status, 429);
    // Code supprimé : prochain appel donne 404
    const r2 = verifyCode(email, 'CORRECT');
    assert.equal(r2.status, 404, 'code doit être supprimé après lockout');
  });
});

describe('verifyCode — succès', () => {
  it('code correct → 200 + authToken hex 64 + email normalisé + authenticated', () => {
    const email = 'SUCCESS@JPT.TEST'; // majuscules intentionnelles
    _testOnlySetPendingCode(email, 'BONCODE');
    const r = verifyCode(email, 'BONCODE');
    assert.equal(r.status, 200);
    assert.ok(r.data?.authenticated === true);
    assert.equal(r.data?.email, 'success@jpt.test', 'email doit être normalisé en minuscules');
    assert.match(r.data?.authToken, /^[0-9a-f]{64}$/, 'authToken doit être hex 64 chars');
    assert.equal(r.data?.walletCount, 0, 'nouvel utilisateur sans wallet');
  });

  it('code correct consommé une seule fois → second appel donne 404', () => {
    const email = 'oneshot@jpt.test';
    _testOnlySetPendingCode(email, 'UNIQUE');
    const r1 = verifyCode(email, 'UNIQUE');
    assert.equal(r1.status, 200);
    const r2 = verifyCode(email, 'UNIQUE');
    assert.equal(r2.status, 404, 'code doit être supprimé après usage');
  });

  it('code avec espaces autour est accepté (trim)', () => {
    const email = 'trim@jpt.test';
    _testOnlySetPendingCode(email, '654321');
    const r = verifyCode(email, '  654321  ');
    assert.equal(r.status, 200, 'le trim doit permettre le succès');
  });
});

// ─── resolveAuthToken — cycle de vie du token ────────────────────────────────

describe('resolveAuthToken — guards', () => {
  it('token null → null', () => {
    assert.equal(resolveAuthToken(null), null);
  });

  it('token chaîne vide → null', () => {
    assert.equal(resolveAuthToken(''), null);
  });

  it('token inexistant → null', () => {
    assert.equal(resolveAuthToken('deadbeef'.repeat(8)), null);
  });
});

describe('resolveAuthToken — cycle de vie', () => {
  it('token valide → retourne email + activeSession', () => {
    _testOnlySetAuthToken('tok_valid', { email: 'tok@jpt.test', activeSession: 'sess_abc' });
    const r = resolveAuthToken('tok_valid');
    assert.deepEqual(r, { email: 'tok@jpt.test', activeSession: 'sess_abc' });
  });

  it('token expiré → null + supprimé du store', () => {
    _testOnlySetAuthToken('tok_expired', { email: 'exp@jpt.test', expiresAt: Date.now() - 1 });
    assert.equal(resolveAuthToken('tok_expired'), null);
    // Confirmé supprimé : second appel aussi null (pas d'entrée résiduelle)
    assert.equal(resolveAuthToken('tok_expired'), null);
  });

  it('token généré par verifyCode est résolvable', () => {
    const email = 'flow@jpt.test';
    _testOnlySetPendingCode(email, 'FLOWTEST');
    const { data } = verifyCode(email, 'FLOWTEST');
    const resolved = resolveAuthToken(data.authToken);
    assert.ok(resolved, 'le token doit être résolvable');
    assert.equal(resolved.email, email);
  });
});

// ─── Wallet CRUD — linkWalletToEmail / getWalletsByEmail / getEmailByWallet ──

describe('wallet CRUD', () => {
  it('getWalletsByEmail email inconnu → []', () => {
    assert.deepEqual(getWalletsByEmail('nobody@jpt.test'), []);
  });

  it('getWalletsByEmail null → []', () => {
    assert.deepEqual(getWalletsByEmail(null), []);
  });

  it('getWalletsByEmail email vide → []', () => {
    assert.deepEqual(getWalletsByEmail(''), []);
  });

  it('linkWalletToEmail null email → pas de crash', () => {
    assert.doesNotThrow(() => linkWalletToEmail(null, 'session_x'));
  });

  it('linkWalletToEmail null session → pas de crash', () => {
    assert.doesNotThrow(() => linkWalletToEmail('w@jpt.test', null));
  });

  it('link session → apparaît dans getWalletsByEmail', () => {
    linkWalletToEmail('wlink@jpt.test', 'sess_001');
    const wallets = getWalletsByEmail('wlink@jpt.test');
    assert.ok(wallets.includes('sess_001'));
  });

  it('pas de doublon si même session liée deux fois', () => {
    linkWalletToEmail('nodup@jpt.test', 'sess_dup');
    linkWalletToEmail('nodup@jpt.test', 'sess_dup');
    const wallets = getWalletsByEmail('nodup@jpt.test');
    assert.equal(wallets.filter(s => s === 'sess_dup').length, 1, 'pas de doublon');
  });

  it('getEmailByWallet retourne l\'email correspondant', () => {
    linkWalletToEmail('owner@jpt.test', 'sess_find_me');
    assert.equal(getEmailByWallet('sess_find_me'), 'owner@jpt.test');
  });

  it('getEmailByWallet session inconnue → null', () => {
    assert.equal(getEmailByWallet('session_inconnue_xyz'), null);
  });
});
