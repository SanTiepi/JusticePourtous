import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { acheterWallet, getCredits, analyser, _createExpiredWallet, _createWalletWithBalance } from '../src/services/premium.mjs';

describe('Premium', () => {
  it('POST acheter cree wallet avec solde 3000 centimes', () => {
    const result = acheterWallet();
    assert.equal(result.status, 200);
    assert.equal(result.data.solde, 3000);
    assert.ok(result.data.sessionCode);
  });

  it('analyser avec wallet valide retourne reponse + debit', () => {
    const wallet = acheterWallet();
    const sessionCode = wallet.data.sessionCode;
    const result = analyser(sessionCode, 'Test question juridique');
    assert.equal(result.status, 200);
    assert.ok(result.data.reponse);
    assert.ok(result.data.coutEffectif > 0);
    assert.ok(result.data.soldeRestant < 3000);
  });

  it('analyser sans wallet retourne 403', () => {
    const result = analyser(null, 'Question');
    assert.equal(result.status, 403);
    assert.ok(result.error);
  });

  it('analyser wallet vide retourne 402', () => {
    const sessionCode = _createWalletWithBalance(0);
    const result = analyser(sessionCode, 'Question');
    assert.equal(result.status, 402);
    assert.ok(result.error);
  });

  it('GET credits retourne solde correct', () => {
    const wallet = acheterWallet();
    const sessionCode = wallet.data.sessionCode;
    const credits = getCredits(sessionCode);
    assert.equal(credits.status, 200);
    assert.equal(credits.data.solde, 3000);
  });

  it('estimation cout affichee avant action', () => {
    const wallet = acheterWallet();
    const sessionCode = wallet.data.sessionCode;
    const result = analyser(sessionCode, 'Test');
    assert.equal(result.status, 200);
    assert.ok(result.data.estimationCout);
    assert.ok(result.data.estimationCout.min > 0);
    assert.ok(result.data.estimationCout.max > result.data.estimationCout.min);
  });

  it('session anonyme (pas de login, code session)', () => {
    const wallet = acheterWallet();
    assert.ok(wallet.data.sessionCode);
    assert.ok(wallet.data.sessionCode.length >= 16);
    // Session is just a hex string, no login
    assert.match(wallet.data.sessionCode, /^[0-9a-f]+$/);
  });

  it('wallet expire apres 90 jours', () => {
    const sessionCode = _createExpiredWallet();
    const credits = getCredits(sessionCode);
    assert.equal(credits.status, 402);
    assert.ok(credits.error.includes('expire'));
  });
});
