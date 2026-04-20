/**
 * Deadline Reminders — tests end-to-end (nouvelle API + dispatcher + admin).
 *
 * Couvre :
 *   - scheduleReminder({account_id,...}) stocke correctement + retourne id
 *   - getDueReminders({before}) filtre par date
 *   - markAsSent mute le statut + attache le result
 *   - _listRemindersForTests helper
 *   - maskAccountId k-anon
 *   - autoScheduleRemindersForCase intégration triage → délai < 90j
 *   - scripts/send-due-reminders dry-run produit payload correct
 *   - GET /api/admin/reminders (auth + shape)
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { existsSync, rmSync } from 'node:fs';

import {
  scheduleReminder,
  getDueReminders,
  markAsSent,
  _listRemindersForTests,
  _resetRemindersForTests,
  autoScheduleRemindersForCase,
  maskAccountId,
  SEVERITY
} from '../src/services/deadline-reminders.mjs';

import {
  createCase,
  updateCaseState,
  getCase,
  _resetStoreForTests,
  _flushCases,
  _linkCaseToAccount
} from '../src/services/case-store.mjs';

const TEST_CASE_STORE = join(tmpdir(), 'jpt-deadline-cases.json');
const TEST_REMINDERS_STORE = join(tmpdir(), 'jpt-deadline-reminders.json');

function resetAll() {
  _resetStoreForTests({ path: TEST_CASE_STORE });
  try { if (existsSync(TEST_REMINDERS_STORE)) rmSync(TEST_REMINDERS_STORE); } catch {}
  _resetRemindersForTests({ path: TEST_REMINDERS_STORE });
}

// ============================================================
// scheduleReminder — unit
// ============================================================

describe('scheduleReminder (API unitaire)', () => {
  beforeEach(() => resetAll());
  after(() => { _flushCases(); });

  it('crée un reminder et retourne un reminder_id', () => {
    const id = scheduleReminder({
      account_id: 'acc_abcdef123',
      case_id: 'case_xyz',
      due_date: new Date(Date.now() + 10 * 86400000).toISOString(),
      titre: 'Opposition au commandement de payer',
      description: 'LP 74 — délai 10j'
    });
    assert.ok(id && typeof id === 'string');
    const all = _listRemindersForTests();
    assert.equal(all.length, 1);
    assert.equal(all[0].account_id, 'acc_abcdef123');
    assert.equal(all[0].case_id, 'case_xyz');
    assert.equal(all[0].titre, 'Opposition au commandement de payer');
    assert.equal(all[0].sent, false);
    assert.ok(all[0].due_date_iso);
  });

  it('accepte due_date comme Date, string ISO ou ms', () => {
    const base = Date.now() + 5 * 86400000;
    scheduleReminder({ account_id: 'a1234', case_id: 'c1', due_date: new Date(base), titre: 'T1' });
    scheduleReminder({ account_id: 'a1234', case_id: 'c2', due_date: new Date(base).toISOString(), titre: 'T2' });
    scheduleReminder({ account_id: 'a1234', case_id: 'c3', due_date: base, titre: 'T3' });
    const all = _listRemindersForTests();
    assert.equal(all.length, 3);
    for (const r of all) {
      assert.ok(r.due_date_iso);
      assert.equal(new Date(r.due_date_iso).getTime(), base);
    }
  });

  it('calcule severity automatiquement', () => {
    const id = scheduleReminder({
      account_id: 'acc_short',
      case_id: 'c1',
      due_date: Date.now() + 3 * 86400000, // 3j → critical
      titre: 'Urgent'
    });
    const [r] = _listRemindersForTests();
    assert.equal(r.reminder_id, id);
    assert.equal(r.severity, SEVERITY.CRITICAL);
  });

  it('rejette les inputs invalides', () => {
    assert.throws(() => scheduleReminder({ case_id: 'c', due_date: Date.now(), titre: 't' }), /account_id/);
    assert.throws(() => scheduleReminder({ account_id: 'a', due_date: Date.now(), titre: 't' }), /case_id/);
    assert.throws(() => scheduleReminder({ account_id: 'a', case_id: 'c', due_date: Date.now() }), /titre/);
    assert.throws(() => scheduleReminder({ account_id: 'a', case_id: 'c', titre: 't', due_date: 'not-a-date' }), /due_date/);
  });
});

// ============================================================
// getDueReminders — unit
// ============================================================

describe('getDueReminders', () => {
  beforeEach(() => resetAll());

  it('filtre par date before', () => {
    const now = Date.now();
    scheduleReminder({ account_id: 'a1', case_id: 'c1', due_date: now + 1 * 86400000, titre: 'Demain' });
    scheduleReminder({ account_id: 'a1', case_id: 'c2', due_date: now + 10 * 86400000, titre: 'Dans 10j' });
    scheduleReminder({ account_id: 'a1', case_id: 'c3', due_date: now + 30 * 86400000, titre: 'Dans 30j' });

    const due48h = getDueReminders({ before: now + 48 * 3600000 });
    assert.equal(due48h.length, 1);
    assert.equal(due48h[0].titre, 'Demain');

    const due15d = getDueReminders({ before: now + 15 * 86400000 });
    assert.equal(due15d.length, 2);
  });

  it('exclut les reminders déjà envoyés', () => {
    const now = Date.now();
    const id = scheduleReminder({ account_id: 'a1', case_id: 'c1', due_date: now + 86400000, titre: 'T' });
    scheduleReminder({ account_id: 'a1', case_id: 'c2', due_date: now + 86400000, titre: 'U' });
    markAsSent(id);
    const due = getDueReminders({ before: now + 2 * 86400000 });
    assert.equal(due.length, 1);
    assert.equal(due[0].titre, 'U');
  });

  it('default before = now + 48h', () => {
    const now = Date.now();
    scheduleReminder({ account_id: 'a1', case_id: 'c1', due_date: now + 24 * 3600000, titre: 'Demain' });
    scheduleReminder({ account_id: 'a1', case_id: 'c2', due_date: now + 72 * 3600000, titre: 'J+3' });
    const due = getDueReminders();
    assert.equal(due.length, 1);
    assert.equal(due[0].titre, 'Demain');
  });

  it('tri asc par date due', () => {
    const now = Date.now();
    scheduleReminder({ account_id: 'a1', case_id: 'c1', due_date: now + 2 * 86400000, titre: 'B' });
    scheduleReminder({ account_id: 'a1', case_id: 'c2', due_date: now + 1 * 86400000, titre: 'A' });
    const due = getDueReminders({ before: now + 10 * 86400000 });
    assert.equal(due[0].titre, 'A');
    assert.equal(due[1].titre, 'B');
  });
});

// ============================================================
// markAsSent — unit
// ============================================================

describe('markAsSent', () => {
  beforeEach(() => resetAll());

  it('mute sent=true + sent_at_iso + result', () => {
    const id = scheduleReminder({
      account_id: 'a1', case_id: 'c1',
      due_date: Date.now() + 86400000, titre: 'T'
    });
    const result = { ok: true, provider: 'resend', message_id: 'msg_123' };
    const r = markAsSent(id, { sent_at: Date.now(), result });
    assert.ok(r);
    assert.equal(r.sent, true);
    assert.ok(r.sent_at_iso);
    assert.deepEqual(r.send_result, result);

    const [stored] = _listRemindersForTests();
    assert.equal(stored.sent, true);
    assert.equal(stored.send_result.message_id, 'msg_123');
  });

  it('retourne null pour id inconnu', () => {
    const r = markAsSent('inexistant');
    assert.equal(r, null);
  });
});

// ============================================================
// maskAccountId — k-anon
// ============================================================

describe('maskAccountId', () => {
  it('masque correctement', () => {
    assert.equal(maskAccountId('acc_abc123xyz'), 'acc_****');
    assert.equal(maskAccountId('1234567890'), '1234****');
    assert.equal(maskAccountId(''), '****');
    assert.equal(maskAccountId('ab'), '****');
    assert.equal(maskAccountId(null), '****');
    assert.equal(maskAccountId(undefined), '****');
  });
});

// ============================================================
// autoScheduleRemindersForCase — intégration triage
// ============================================================

describe('autoScheduleRemindersForCase', () => {
  beforeEach(() => resetAll());
  after(() => { _flushCases(); });

  function buildBailCase() {
    const { case_id } = createCase({ texte: 'Commandement de payer reçu', canton: 'VD' });
    const primary = {
      fiche: { id: 'dettes_opposition', domaine: 'dettes', tags: [] },
      delais: [
        {
          procedure: 'Opposition au commandement de payer',
          delai: '10 jours',
          consequence: 'Continuation de la poursuite',
          base_legale: 'LP 74 al. 1'
        },
        {
          procedure: 'Procédure inapplicable 2 ans',
          delai: '2 ans',
          consequence: 'x'
        }
      ],
      cascades: [], escalade: [], jurisprudence: [], templates: [], patterns: []
    };
    updateCaseState(case_id, { enriched_primary: primary, enriched_all: [primary] });
    return getCase(case_id);
  }

  it('planifie les délais < 90j pour un account donné', () => {
    const caseRec = buildBailCase();
    const res = autoScheduleRemindersForCase(caseRec, 'acc_test123', { maxDaysAhead: 90 });
    assert.ok(res.scheduled >= 1, `attendu >= 1, reçu ${res.scheduled}`);
    assert.ok(res.skipped >= 1, 'le délai 2 ans doit être skip');
    const all = _listRemindersForTests();
    const bail = all.find(r => r.titre.includes('Opposition'));
    assert.ok(bail);
    assert.equal(bail.account_id, 'acc_test123');
    assert.equal(bail.case_id, caseRec.case_id);
  });

  it('idempotent : deux appels ne dupliquent pas', () => {
    const caseRec = buildBailCase();
    autoScheduleRemindersForCase(caseRec, 'acc_test123');
    const countAfter1 = _listRemindersForTests().length;
    autoScheduleRemindersForCase(caseRec, 'acc_test123');
    const countAfter2 = _listRemindersForTests().length;
    assert.equal(countAfter1, countAfter2, 'doit être idempotent');
  });

  it('noop si pas d\'account_id', () => {
    const caseRec = buildBailCase();
    const res = autoScheduleRemindersForCase(caseRec, null);
    assert.equal(res.scheduled, 0);
  });

  it('intégration : triage bail → délai identifié → reminder scheduled', () => {
    const caseRec = buildBailCase();
    // Simule le linking citoyen (case-store direct)
    _linkCaseToAccount(caseRec.case_id, 'acc_integration', 365 * 86400000);
    const caseAfterLink = getCase(caseRec.case_id);
    assert.equal(caseAfterLink.linked_account_id, 'acc_integration');

    const res = autoScheduleRemindersForCase(caseAfterLink, 'acc_integration');
    assert.ok(res.scheduled >= 1);
    const pending = getDueReminders({ before: Date.now() + 365 * 86400000 });
    assert.ok(pending.some(r => r.account_id === 'acc_integration'));
  });
});

// ============================================================
// send-due-reminders script (dry-run)
// ============================================================

describe('scripts/send-due-reminders dry-run', () => {
  beforeEach(() => resetAll());

  it('composeEmail produit un payload multilingue-ready (FR)', async () => {
    const { composeEmail } = await import('../scripts/send-due-reminders.mjs');
    const reminder = {
      reminder_id: 'r1',
      account_id: 'acc_test123',
      case_id: 'case_abc',
      titre: 'Opposition au commandement de payer',
      description: 'LP 74 — délai 10j',
      due_date_iso: new Date(Date.now() + 2 * 86400000).toISOString(),
      severity: SEVERITY.HIGH,
      base_legale: 'LP 74 al. 1',
      consequence: 'Continuation de la poursuite'
    };
    const caseRec = {
      case_id: 'case_abc',
      state: { enriched_primary: { fiche: { id: 'dettes_opposition' } } }
    };

    const { subject, text, html } = composeEmail(reminder, caseRec);
    assert.ok(subject.includes('Opposition'));
    assert.ok(subject.includes('JusticePourtous'));
    // Le mot "Important" apparaît pour severity=high
    assert.ok(/Important|URGENT/i.test(subject));
    assert.ok(text.includes('délai juridique'));
    assert.ok(text.includes('LP 74 al. 1'));
    assert.ok(text.includes('Continuation de la poursuite'));
    assert.ok(text.includes('/fiche.html?id=dettes_opposition'));
    assert.ok(text.includes('information juridique') || text.includes('Information juridique'));
    assert.ok(html.startsWith('<div'));
  });

  it('runSendDueReminders dry-run skip sans account_id + retourne stats JSON', async () => {
    // reminder legacy (sans account_id) — doit être skipped
    scheduleReminder({
      account_id: 'acc_no_email_known',
      case_id: 'c1',
      due_date: Date.now() + 24 * 3600000,
      titre: 'Test dry-run'
    });

    // Force dry-run via env
    process.env.REMINDERS_DRY_RUN = '1';
    // Reload le module (ESM cache) : on appelle runSendDueReminders directement
    const mod = await import('../scripts/send-due-reminders.mjs?dryrun1');
    // Capture console.log
    const logs = [];
    const origLog = console.log;
    console.log = (...args) => logs.push(args.join(' '));
    let stats;
    try {
      stats = await mod.runSendDueReminders();
    } finally {
      console.log = origLog;
      delete process.env.REMINDERS_DRY_RUN;
    }
    assert.ok(stats);
    assert.equal(stats.dry_run, true);
    assert.equal(stats.total, 1);
    // En dry-run, pas d'envoi effectif : soit skipped (dry_run), soit skipped (no email)
    assert.equal(stats.sent, 0);
    assert.ok(stats.skipped >= 1);
  });
});

// ============================================================
// HTTP — /api/admin/reminders
// ============================================================

describe('HTTP /api/admin/reminders', () => {
  const PORT = 9889;
  const BASE = `http://localhost:${PORT}`;
  let server;

  before(async () => {
    process.env.ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'x';
    const mod = await import('../src/server.mjs');
    server = mod.server;
    await new Promise(resolve => server.listen(PORT, resolve));
  });

  beforeEach(() => resetAll());

  after(() => new Promise(resolve => server.close(resolve)));

  async function httpGet(path, token) {
    const http = await import('node:http');
    return new Promise((resolve, reject) => {
      const opts = {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      };
      const req = http.default.request(`${BASE}${path}`, opts, res => {
        let buf = '';
        res.on('data', c => buf += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(buf) }); }
          catch { resolve({ status: res.statusCode, data: buf, raw: true }); }
        });
      });
      req.on('error', reject);
      req.end();
    });
  }

  it('refuse sans token admin (403)', async () => {
    const res = await httpGet('/api/admin/reminders');
    assert.equal(res.status, 403);
  });

  it('retourne la liste paginée avec account_ids masqués', async () => {
    scheduleReminder({
      account_id: 'acc_secret_123456',
      case_id: 'c1',
      due_date: Date.now() + 86400000,
      titre: 'Opposition'
    });
    scheduleReminder({
      account_id: 'acc_other_789xyz',
      case_id: 'c2',
      due_date: Date.now() + 2 * 86400000,
      titre: 'Contestation'
    });

    const res = await httpGet('/api/admin/reminders?limit=50', process.env.ADMIN_TOKEN);
    assert.equal(res.status, 200);
    assert.equal(res.data.total, 2);
    assert.equal(res.data.reminders.length, 2);
    for (const r of res.data.reminders) {
      // Account ID doit être masqué (pas d'ID complet)
      assert.ok(r.account_id_masked);
      assert.ok(r.account_id_masked.endsWith('****') || r.account_id_masked === '****');
      // Pas de champ account_id brut
      assert.equal(r.account_id, undefined);
    }
  });

  it('filtre status=pending', async () => {
    const id1 = scheduleReminder({
      account_id: 'acc_a', case_id: 'c1',
      due_date: Date.now() + 86400000, titre: 'T1'
    });
    scheduleReminder({
      account_id: 'acc_b', case_id: 'c2',
      due_date: Date.now() + 86400000, titre: 'T2'
    });
    markAsSent(id1, { result: { ok: true, provider: 'resend' } });

    const pending = await httpGet('/api/admin/reminders?status=pending', process.env.ADMIN_TOKEN);
    assert.equal(pending.status, 200);
    assert.equal(pending.data.total, 1);
    assert.equal(pending.data.reminders[0].sent, false);

    const sent = await httpGet('/api/admin/reminders?status=sent', process.env.ADMIN_TOKEN);
    assert.equal(sent.status, 200);
    assert.equal(sent.data.total, 1);
    assert.equal(sent.data.reminders[0].sent, true);
  });
});
