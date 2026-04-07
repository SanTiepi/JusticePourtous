import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  acheterWallet, analyserAI, ocrDocumentAI, genererLettreAI,
  estimerCout, getHistorique, _createExpiredWallet, _createWalletWithBalance,
  getCredits
} from '../src/services/premium.mjs';
import { analyzeCase, estimateAnalysisCost, DISCLAIMER as AI_DISCLAIMER } from '../src/services/ai-analysis.mjs';
import { processDocument, detectQuality, extractStructured } from '../src/services/ocr.mjs';
import { generateLetter, VALID_TYPES } from '../src/services/letter-generator.mjs';
import { server } from '../src/server.mjs';

const PORT = 3847;
const BASE = `http://localhost:${PORT}`;

let testServer;

before(() => {
  return new Promise(resolve => {
    testServer = server.listen(PORT, resolve);
  });
});

after(() => {
  return new Promise(resolve => {
    testServer.close(resolve);
  });
});

// --- AI Analysis service tests ---

describe('AI Analysis (mode simulation)', () => {
  it('analyzeCase retourne une reponse structuree', async () => {
    const { response, cost } = await analyzeCase({
      ficheId: 'bail_defaut_moisissure',
      userContext: 'Mon appartement a de la moisissure depuis 3 mois',
      question: 'Puis-je demander une reduction de loyer ?'
    });
    assert.ok(response.analyse, 'doit contenir analyse');
    assert.ok(Array.isArray(response.recommandations), 'doit contenir recommandations');
    assert.ok(response.estimationChances, 'doit contenir estimation');
    assert.ok(Array.isArray(response.prochainesEtapes), 'doit contenir prochaines etapes');
    assert.equal(response.mode, 'simulation');
    assert.ok(cost > 0, 'cout doit etre positif');
  });

  it('analyzeCase inclut disclaimer obligatoire', async () => {
    const { response } = await analyzeCase({
      ficheId: 'bail_defaut_moisissure',
      userContext: 'Test',
      question: 'Test'
    });
    assert.ok(response.disclaimer, 'disclaimer doit etre present');
    assert.ok(response.disclaimer.includes('AVERTISSEMENT'), 'disclaimer doit contenir AVERTISSEMENT');
    assert.ok(response.disclaimer.includes('avocat'), 'disclaimer doit mentionner avocat');
  });

  it('analyzeCase refuse ficheId invalide', async () => {
    await assert.rejects(
      () => analyzeCase({ ficheId: 'inexistant', userContext: 'x', question: 'x' }),
      /introuvable/
    );
  });

  it('estimateAnalysisCost retourne min et max', () => {
    const est = estimateAnalysisCost('bail_defaut_moisissure', 'contexte', 'question');
    assert.ok(est.min > 0);
    assert.ok(est.max >= est.min);
  });
});

// --- OCR service tests ---

describe('OCR (mode simulation)', () => {
  it('processDocument retourne texte + qualite + cout', async () => {
    const buffer = Buffer.from('%PDF-1.4 stream Hello world this is a test document endstream');
    const result = await processDocument(buffer, 'test.pdf');
    assert.ok(result.text, 'text doit etre present');
    assert.ok(typeof result.quality === 'number', 'quality doit etre un nombre');
    assert.ok(result.cost >= 0, 'cost doit etre >= 0');
    assert.ok(result.structured, 'structured doit etre present');
  });

  it('processDocument mode simulation retourne donnees structurees', async () => {
    const buffer = Buffer.from('fake scan content low quality');
    const result = await processDocument(buffer, 'scan.jpg');
    assert.ok(result.structured.dates, 'dates doit etre present');
    assert.ok(result.structured.amounts, 'amounts doit etre present');
    assert.ok(result.structured.parties, 'parties doit etre present');
    assert.ok(result.structured.legalRefs, 'legalRefs doit etre present');
  });

  it('processDocument refuse document vide', async () => {
    await assert.rejects(
      () => processDocument(Buffer.alloc(0), 'empty.pdf'),
      /vide/
    );
  });

  it('processDocument refuse document trop gros', async () => {
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
    await assert.rejects(
      () => processDocument(bigBuffer, 'huge.pdf'),
      /volumineux/
    );
  });

  it('detectQuality identifie les types de fichier', () => {
    const pdfText = detectQuality(Buffer.from('%PDF-1.4 hello world test document'), 'doc.pdf');
    assert.ok(pdfText.quality > 0);
    assert.ok(pdfText.pages >= 1);

    const img = detectQuality(Buffer.alloc(100 * 1024), 'scan.jpg');
    assert.equal(img.type, 'image');
  });

  it('extractStructured extrait dates montants et refs', () => {
    const text = 'Contrat du 15.03.2024 montant CHF 1500 art. 253 CO M. Dupont';
    const result = extractStructured(text);
    assert.ok(result.dates.includes('15.03.2024'));
    assert.ok(result.amounts.some(a => a.includes('1500')));
    assert.ok(result.legalRefs.some(r => r.includes('253')));
  });
});

// --- Letter generator tests ---

describe('Letter Generator', () => {
  it('generateLetter retourne une lettre formatee', async () => {
    const result = await generateLetter({
      ficheId: 'bail_defaut_moisissure',
      userContext: { nom: 'Jean Dupont', adresse: 'Rue de Lausanne 1, 1000 Lausanne' },
      type: 'mise_en_demeure'
    });
    assert.ok(result.lettre, 'lettre doit etre presente');
    assert.ok(result.lettre.length > 100, 'lettre doit etre substantielle');
    assert.equal(result.type, 'mise_en_demeure');
    assert.ok(result.cost > 0);
  });

  it('generateLetter inclut en-tete suisse (expediteur, date, objet)', async () => {
    const result = await generateLetter({
      ficheId: 'bail_defaut_moisissure',
      userContext: { nom: 'Marie Martin', lieu: 'Geneve' },
      type: 'contestation'
    });
    assert.ok(result.lettre.includes('Marie Martin'), 'doit contenir le nom');
    assert.ok(result.lettre.includes('Geneve'), 'doit contenir le lieu');
    assert.ok(result.lettre.includes('recommande') || result.lettre.includes('Objet'), 'doit avoir format formel');
    assert.ok(result.lettre.includes('salutations'), 'doit avoir formule de politesse');
  });

  it('generateLetter inclut disclaimer', async () => {
    const result = await generateLetter({
      ficheId: 'bail_defaut_moisissure',
      userContext: {},
      type: 'mise_en_demeure'
    });
    assert.ok(result.disclaimer.includes('AVERTISSEMENT'));
  });

  it('generateLetter refuse type invalide', async () => {
    await assert.rejects(
      () => generateLetter({ ficheId: 'bail_defaut_moisissure', type: 'invalide' }),
      /invalide/
    );
  });
});

// --- Premium wallet + AI integration ---

describe('Premium AI wallet integration', () => {
  it('analyserAI debite le wallet', async () => {
    const { data: { sessionCode } } = acheterWallet();
    const result = await analyserAI(sessionCode, {
      ficheId: 'bail_defaut_moisissure',
      userContext: 'Moisissure depuis 6 mois',
      question: 'Que faire ?'
    });
    assert.equal(result.status, 200);
    assert.ok(result.data.coutEffectif > 0);
    assert.ok(result.data.soldeRestant < 3000);
  });

  it('analyserAI refuse si wallet insuffisant (402)', async () => {
    const sessionCode = _createWalletWithBalance(0);
    const result = await analyserAI(sessionCode, {
      ficheId: 'bail_defaut_moisissure',
      userContext: 'test',
      question: 'test'
    });
    assert.equal(result.status, 402);
    assert.ok(result.error.includes('insuffisant'));
  });

  it('POST /api/premium/analyze sans wallet retourne 403', async () => {
    const resp = await fetch(`${BASE}/api/premium/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ficheId: 'bail_defaut_moisissure', userContext: 'x', question: 'x' })
    });
    assert.equal(resp.status, 403);
    const data = await resp.json();
    assert.ok(data.error);
  });

  it('POST /api/premium/estimate retourne cout sans debiter', async () => {
    const resp = await fetch(`${BASE}/api/premium/estimate?action=analyse&ficheId=bail_defaut_moisissure`);
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.ok(data.estimation, 'estimation doit etre presente');
    assert.ok(data.estimation.min > 0);
    assert.ok(data.estimation.max >= data.estimation.min);
  });

  it('GET /api/premium/estimate pour lettre retourne cout fixe', async () => {
    const resp = await fetch(`${BASE}/api/premium/estimate?action=lettre`);
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.equal(data.action, 'lettre');
    assert.equal(data.estimation.min, data.estimation.max);
  });

  it('GET /api/premium/history retourne les debits', async () => {
    const { data: { sessionCode } } = acheterWallet();
    // Make a letter generation to create history (simpler, no API call issues)
    await genererLettreAI(sessionCode, {
      ficheId: 'bail_defaut_moisissure',
      userContext: { nom: 'Test' },
      type: 'mise_en_demeure'
    });
    const resp = await fetch(`${BASE}/api/premium/history?session=${sessionCode}`);
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.ok(Array.isArray(data.debits));
    assert.ok(data.debits.length >= 1);
    assert.ok(data.totalDepense > 0);
    assert.ok(typeof data.soldeRestant === 'number');
  });

  it('GET /api/premium/history sans session retourne 403', async () => {
    const resp = await fetch(`${BASE}/api/premium/history`);
    assert.equal(resp.status, 403);
  });

  it('upload trop gros retourne 413', async () => {
    // Create a large payload > 10MB
    const bigBody = Buffer.alloc(11 * 1024 * 1024, 'x');
    const { data: { sessionCode } } = acheterWallet();
    const resp = await fetch(`${BASE}/api/premium/analyze-ocr`, {
      method: 'POST',
      headers: {
        'x-session': sessionCode,
        'x-filename': 'huge.pdf',
        'Content-Type': 'application/octet-stream'
      },
      body: bigBody
    });
    assert.equal(resp.status, 413);
  });

  it('wallet expire apres 90 jours refuse analyse AI', async () => {
    const sessionCode = _createExpiredWallet();
    const result = await analyserAI(sessionCode, {
      ficheId: 'bail_defaut_moisissure',
      userContext: 'test',
      question: 'test'
    });
    assert.equal(result.status, 402);
    assert.ok(result.error.includes('expire'));
  });

  it('POST /api/premium/generate-letter fonctionne avec wallet', async () => {
    const { data: { sessionCode } } = acheterWallet();
    const resp = await fetch(`${BASE}/api/premium/generate-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session: sessionCode,
        ficheId: 'bail_defaut_moisissure',
        userContext: { nom: 'Test User' },
        type: 'mise_en_demeure'
      })
    });
    assert.equal(resp.status, 200);
    const data = await resp.json();
    assert.ok(data.lettre);
    assert.ok(data.soldeRestant < 3000);
  });
});
