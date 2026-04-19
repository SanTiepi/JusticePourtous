/**
 * Phase Cortex — tests escalade universelle ("ce cas me dépasse → humain").
 *
 * Couvre :
 *  - buildEscalationPack : schéma complet + adaptation par domaine + filtrage canton
 *  - chronologie ordonnée à partir de audit.rounds
 *  - questions au professionnel non-vides quand uncertainties présents
 *  - route POST /api/triage/escalation (200 pour case valide, 404 sinon)
 *  - route GET download.json (contenu JSON parseable)
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, rmSync } from 'node:fs';

import {
  createCase,
  updateCaseState,
  recordRound,
  getCase,
  _resetStoreForTests,
  _flushCases
} from '../src/services/case-store.mjs';
import { buildEscalationPack, _internals } from '../src/services/escalation-pack.mjs';
import { server } from '../src/server.mjs';

const TEST_STORE_PATH = join(tmpdir(), 'justicepourtous-cortex-escalation.json');
const PORT = 9887;
const BASE = `http://localhost:${PORT}`;

function reset() {
  _resetStoreForTests({ path: TEST_STORE_PATH });
}

async function httpPost(path, body) {
  const http = await import('node:http');
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.default.request(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(buf) }); }
        catch { resolve({ status: res.statusCode, data: buf, raw: true }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function httpGet(path) {
  const http = await import('node:http');
  return new Promise((resolve, reject) => {
    http.default.get(`${BASE}${path}`, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: buf, headers: res.headers });
      });
    }).on('error', reject);
  });
}

/** Construit un case simulé réaliste (état ready avec audit). */
function buildFakeCase({ domaine = 'bail', canton = 'VD', withUncertainties = true } = {}) {
  const { case_id } = createCase({ texte: 'Mon appartement est envahi de moisissures depuis 6 mois', canton });
  const primary = {
    fiche: { id: 'bail_moisissure', domaine, tags: ['moisissure', 'defaut'] },
    lacunes: [{ message: 'Jurisprudence cantonale peu documentée sur ce type de défaut' }],
    escalade: [
      {
        nom: 'ASLOCA — Association des locataires',
        type: 'association',
        gratuit: true,
        contact: 'https://www.asloca.ch',
        conditions: 'Cotisation annuelle ~70-90 CHF',
        cantons: ['VD', 'GE']
      },
      {
        nom: 'Autorité de conciliation bailleur-locataire',
        type: 'autorité',
        gratuit: true,
        contact: 'Voir site du canton',
        conditions: 'Saisine préalable obligatoire',
        cantons: ['VD']
      }
    ],
    delais: [],
    jurisprudence: [],
    templates: [],
    patterns: []
  };
  const navigation = {
    resume_situation: 'Locataire confronté à des moisissures persistantes depuis 6 mois, bailleur passif.',
    infos_extraites: { canton, domaine, date: null, montant_chf: null }
  };
  updateCaseState(case_id, {
    canton,
    navigation,
    enriched_primary: primary,
    enriched_all: [primary],
    last_eval: withUncertainties
      ? { uncertainties: [
          { kind: 'faits_critiques', impact: 5 },
          { kind: 'confiance_faible', impact: 4 },
          { kind: 'montant_inconnu', impact: 3 }
        ] }
      : { uncertainties: [] }
  });
  recordRound(case_id, {
    questions: [
      { id: 'q1', question: 'Depuis combien de temps le défaut est-il présent ?', kind: 'facts' },
      { id: 'q2', question: 'Avez-vous notifié formellement le bailleur ?', kind: 'facts' }
    ],
    answers: { q1: '6 mois', q2: 'oui, par courrier recommandé en janvier' }
  });
  return getCase(case_id);
}

// ============================================================
// Unit — buildEscalationPack
// ============================================================

describe('buildEscalationPack — schéma complet', () => {
  before(() => { reset(); });
  beforeEach(() => { reset(); });
  after(() => { _flushCases(); try { if (existsSync(TEST_STORE_PATH)) rmSync(TEST_STORE_PATH); } catch {} });

  it('retourne un objet avec TOUS les champs requis', () => {
    const caseRec = buildFakeCase();
    const pack = buildEscalationPack(caseRec);
    assert.ok(pack, 'pack doit être défini');
    assert.equal(typeof pack.summary, 'string');
    assert.ok(pack.summary.length > 10);
    assert.ok(Array.isArray(pack.chronologie));
    assert.ok(Array.isArray(pack.pieces_jointes_suggerees));
    assert.ok(pack.pieces_jointes_suggerees.length > 0);
    assert.ok(Array.isArray(pack.points_litigieux));
    assert.ok(Array.isArray(pack.questions_a_poser_au_professionnel));
    assert.ok(Array.isArray(pack.redirections_par_canton));
    assert.equal(typeof pack.disclaimer, 'string');
    assert.ok(pack.disclaimer.length > 10);
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(pack.generated_at));
  });

  it('retourne null pour caseRec invalide', () => {
    assert.equal(buildEscalationPack(null), null);
    assert.equal(buildEscalationPack({}), null);
  });
});

describe('buildEscalationPack — adaptation par domaine', () => {
  beforeEach(() => { reset(); });

  it('pièces_jointes_suggerees sont spécifiques au domaine bail', () => {
    const caseRec = buildFakeCase({ domaine: 'bail' });
    const pack = buildEscalationPack(caseRec);
    const joined = pack.pieces_jointes_suggerees.join(' ').toLowerCase();
    assert.ok(joined.includes('bail'), 'doit mentionner le contrat de bail');
    assert.ok(joined.includes('état des lieux') || joined.includes('etat des lieux'),
      'doit mentionner état des lieux');
  });

  it('pièces_jointes_suggerees bail ≠ pièces travail', () => {
    const bail = _internals.buildPieces('bail');
    const travail = _internals.buildPieces('travail');
    assert.notDeepEqual(bail, travail);
    const joinedT = travail.join(' ').toLowerCase();
    assert.ok(joinedT.includes('salaire') || joinedT.includes('contrat de travail'));
  });

  it('domaine inconnu → liste de défaut non vide', () => {
    const pieces = _internals.buildPieces('xyz_inexistant');
    assert.ok(pieces.length > 0);
  });
});

describe('buildEscalationPack — filtrage canton', () => {
  beforeEach(() => { reset(); });

  it('redirections_par_canton filtre bien par canton VD', () => {
    const caseRec = buildFakeCase({ canton: 'VD' });
    const pack = buildEscalationPack(caseRec);
    assert.ok(pack.redirections_par_canton.length > 0);
    // L'autorité canton-specific (VD) doit apparaître
    const hasAutoriteVD = pack.redirections_par_canton.some(r =>
      /conciliation/i.test(r.nom) && r.canton === 'VD'
    );
    assert.ok(hasAutoriteVD, 'l\'autorité cantonale VD doit être listée');
  });

  it('redirections ne contiennent PAS une asloca ZH pour un canton VD', () => {
    // Redir fiche est VD/GE, donc ZH ne serait jamais dedans. On vérifie
    // que pour un case canton GE, l'autorité VD (canton-restreint) ne sort pas.
    const caseRec = buildFakeCase({ canton: 'GE' });
    const pack = buildEscalationPack(caseRec);
    const hasVDOnly = pack.redirections_par_canton.some(r =>
      /conciliation/i.test(r.nom) && r.canton === 'VD'
    );
    assert.equal(hasVDOnly, false, 'l\'autorité canton-restreint VD ne doit pas sortir pour GE');
  });
});

describe('buildEscalationPack — chronologie', () => {
  beforeEach(() => { reset(); });

  it('chronologie respecte l\'ordre chronologique (saisie initiale d\'abord)', () => {
    const caseRec = buildFakeCase();
    const pack = buildEscalationPack(caseRec);
    assert.ok(pack.chronologie.length >= 2, 'doit contenir au moins saisie + 1 Q&R');
    // Le premier événement = saisie initiale (pas de date, ordre 0)
    assert.equal(pack.chronologie[0].source, 'triage_initial');
    // Les suivants ont une date ISO
    const withDates = pack.chronologie.filter(e => e.date);
    for (let i = 1; i < withDates.length; i++) {
      assert.ok(withDates[i - 1].date <= withDates[i].date,
        'dates doivent être croissantes');
    }
  });
});

describe('buildEscalationPack — questions au professionnel', () => {
  beforeEach(() => { reset(); });

  it('non-vide si uncertainties présents', () => {
    const caseRec = buildFakeCase({ withUncertainties: true });
    const pack = buildEscalationPack(caseRec);
    assert.ok(pack.questions_a_poser_au_professionnel.length >= 3,
      'au moins 3 questions attendues');
    // Doit commencer par "Demandez" (style reformulé)
    assert.ok(pack.questions_a_poser_au_professionnel.every(q => /demandez/i.test(q)),
      'chaque question doit être reformulée en "Demandez au professionnel..."');
  });

  it('fallback non-vide même sans uncertainties ni domaine', () => {
    const caseRec = buildFakeCase({ withUncertainties: false });
    const pack = buildEscalationPack(caseRec);
    assert.ok(pack.questions_a_poser_au_professionnel.length >= 2,
      'fallback doit produire ≥ 2 questions');
  });
});

// ============================================================
// Integration HTTP — route POST / GET download
// ============================================================

describe('HTTP — POST /api/triage/escalation', () => {
  before(() => new Promise(resolve => server.listen(PORT, resolve)));
  beforeEach(() => { reset(); });
  after(() => new Promise(resolve => {
    _flushCases();
    try { if (existsSync(TEST_STORE_PATH)) rmSync(TEST_STORE_PATH); } catch {}
    server.close(resolve);
  }));

  it('retourne 200 + pack pour un case valide', async () => {
    const caseRec = buildFakeCase();
    const res = await httpPost('/api/triage/escalation', { case_id: caseRec.case_id });
    assert.equal(res.status, 200);
    assert.ok(res.data.escalation_pack);
    assert.ok(res.data.download_url);
    assert.equal(typeof res.data.escalation_pack.summary, 'string');
    assert.ok(Array.isArray(res.data.escalation_pack.pieces_jointes_suggerees));
  });

  it('retourne 404 pour case_id inconnu', async () => {
    const res = await httpPost('/api/triage/escalation', { case_id: '00'.repeat(16) });
    assert.equal(res.status, 404);
    assert.ok(res.data.error);
  });

  it('retourne 400 si case_id absent', async () => {
    const res = await httpPost('/api/triage/escalation', {});
    assert.equal(res.status, 400);
    assert.ok(res.data.error);
  });

  it('GET download.json retourne le pack JSON parseable', async () => {
    const caseRec = buildFakeCase();
    const res = await httpGet(`/api/triage/escalation/${caseRec.case_id}/download.json`);
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'] || '', /application\/json/);
    assert.match(res.headers['content-disposition'] || '', /attachment/);
    let parsed;
    assert.doesNotThrow(() => { parsed = JSON.parse(res.body); });
    assert.ok(parsed.summary);
    assert.ok(Array.isArray(parsed.chronologie));
    assert.ok(Array.isArray(parsed.redirections_par_canton));
  });

  it('GET download.json retourne 404 pour case inconnu', async () => {
    const res = await httpGet(`/api/triage/escalation/${'aa'.repeat(16)}/download.json`);
    assert.equal(res.status, 404);
  });
});
