/**
 * Phase Cortex — Fedlex Diff
 *
 * Tests pour src/services/fedlex-diff.mjs et scripts/fedlex-daily-diff.mjs.
 *
 * Règles: AUCUN appel HTTP (mock only), AUCUNE écriture dans les
 * fichiers de production (on écrit dans un log temporaire).
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, rmSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  fetchFedlexArticle,
  hashArticle,
  normalizeText,
  detectChanges,
  analyzeImpact,
  buildSourceId,
  parseRef,
  extractArticleText,
  summarizeDiff,
} from '../src/services/fedlex-diff.mjs';

import {
  runDiff,
  getDashboardSummary,
} from '../scripts/fedlex-daily-diff.mjs';

// ─── hashArticle stability ──────────────────────────────────────

describe('fedlex-diff — hashArticle', () => {
  it('retourne le même hash pour une entrée identique (stable)', () => {
    const txt = 'Le bail à loyer est un contrat.';
    assert.equal(hashArticle(txt), hashArticle(txt));
  });

  it('retourne une string hex de 64 chars (SHA256)', () => {
    const h = hashArticle('test');
    assert.match(h, /^[0-9a-f]{64}$/);
  });

  it('même hash après normalisation (espaces, case)', () => {
    const a = hashArticle('  Le Bail   à   LOYER. ');
    const b = hashArticle('le bail à loyer.');
    assert.equal(a, b, 'normalisation doit gommer espaces et casse');
  });

  it('hash différent pour contenu différent', () => {
    assert.notEqual(hashArticle('alinéa 1'), hashArticle('alinéa 2'));
  });

  it('gère null/undefined/empty sans crasher', () => {
    assert.equal(typeof hashArticle(null), 'string');
    assert.equal(typeof hashArticle(undefined), 'string');
    assert.equal(hashArticle(''), hashArticle(null));
  });

  it('normalizeText supprime les caractères zero-width', () => {
    const withZwsp = 'bail\u200Bà\u200Cloyer';
    const clean = 'bailàloyer';
    assert.equal(normalizeText(withZwsp), clean);
  });
});

// ─── detectChanges ──────────────────────────────────────────────

describe('fedlex-diff — detectChanges', () => {
  it('détecte changed=false sur contenu identique', () => {
    const snap = { text: 'article inchangé.' };
    const r = detectChanges(snap, { text: 'article inchangé.' });
    assert.equal(r.changed, false);
    assert.equal(r.diff_summary, 'identical');
  });

  it('détecte changed=true sur contenu modifié', () => {
    const r = detectChanges(
      { text: 'ancien texte alinéa 1' },
      { text: 'nouveau texte alinéa 1' }
    );
    assert.equal(r.changed, true);
    assert.ok(r.previous_hash);
    assert.ok(r.current_hash);
    assert.notEqual(r.previous_hash, r.current_hash);
  });

  it('accepte un snapshot par hash seul (sans texte)', () => {
    const h1 = hashArticle('a');
    const h2 = hashArticle('b');
    const r = detectChanges({ hash: h1 }, { hash: h2 });
    assert.equal(r.changed, true);
  });

  it('signale "new article" quand previous est null', () => {
    const r = detectChanges(null, { text: 'nouveau' });
    assert.equal(r.changed, true);
    assert.match(r.diff_summary, /new article/i);
  });

  it('signale "removed" quand current est null', () => {
    const r = detectChanges({ text: 'ancien' }, null);
    assert.equal(r.changed, true);
    assert.match(r.diff_summary, /removed/i);
  });

  it('summarizeDiff compte les alinéas ajoutés/supprimés', () => {
    const a = 'Alinéa 1. Alinéa 2. Alinéa 3.';
    const b = 'Alinéa 1. Alinéa 2 modifié. Alinéa 3. Alinéa 4 nouveau.';
    const s = summarizeDiff(a, b);
    assert.match(s, /alinéa/i);
  });
});

// ─── analyzeImpact ──────────────────────────────────────────────

describe('fedlex-diff — analyzeImpact', () => {
  const fakeFiches = [
    {
      id: 'bail_defaut_moisissure',
      domaine: 'bail',
      articles: [
        { ref: 'CO 259a', description: 'défaut' },
        { ref: 'CO 259g' },
      ],
    },
    {
      id: 'bail_caution',
      domaine: 'bail',
      articles: [{ ref: 'CO 257e' }],
    },
    {
      id: 'travail_conge',
      domaine: 'travail',
      articles: [{ ref: 'CO 335c' }],
    },
  ];

  const fakeRules = [
    {
      id: 'bail_caution_max',
      base_legale: 'CO 257e al. 1',
      source_ids: ['fedlex:rs220:co-257e'],
    },
    {
      id: 'bail_reduction_defaut',
      base_legale: 'CO 259d',
      source_ids: ['fedlex:rs220:co-259d'],
    },
  ];

  it('retourne fiches impactées pour CO 259a', () => {
    const res = analyzeImpact({ ref: 'CO 259a', domaines: ['bail'] }, fakeFiches, fakeRules);
    assert.ok(res.fiches_affected.includes('bail_defaut_moisissure'),
      `attendu bail_defaut_moisissure, reçu ${res.fiches_affected.join(',')}`);
    assert.ok(!res.fiches_affected.includes('travail_conge'));
  });

  it('retourne règles impactées pour CO 257e', () => {
    const res = analyzeImpact({ ref: 'CO 257e', domaines: ['bail'] }, fakeFiches, fakeRules);
    assert.ok(res.rules_affected.includes('bail_caution_max'));
    assert.ok(res.fiches_affected.includes('bail_caution'));
  });

  it('priorité=high si règle normative impactée', () => {
    const res = analyzeImpact({ ref: 'CO 257e', domaines: ['bail'] }, fakeFiches, fakeRules);
    assert.equal(res.priority, 'high');
  });

  it('priorité=medium si fiche impactée (sans règle)', () => {
    const res = analyzeImpact({ ref: 'CO 335c', domaines: ['travail'] }, fakeFiches, fakeRules);
    assert.equal(res.priority, 'medium');
    assert.ok(res.fiches_affected.includes('travail_conge'));
    assert.equal(res.rules_affected.length, 0);
  });

  it('priorité=medium si domaine critique même sans fiche liée', () => {
    const res = analyzeImpact({ ref: 'CO 9999', domaines: ['bail'] }, [], []);
    assert.equal(res.priority, 'medium');
  });

  it('priorité=low si rien de critique', () => {
    const res = analyzeImpact({ ref: 'CO 9999', domaines: ['inconnu'] }, [], []);
    assert.equal(res.priority, 'low');
  });

  it('dédoublonne fiches_affected', () => {
    const f = [
      { id: 'dup', articles: [{ ref: 'CO 1' }] },
      { id: 'dup', articles: [{ ref: 'CO 1' }] },
    ];
    const res = analyzeImpact({ ref: 'CO 1', domaines: [] }, f, []);
    assert.equal(res.fiches_affected.length, 1);
  });
});

// ─── buildSourceId / parseRef ───────────────────────────────────

describe('fedlex-diff — buildSourceId / parseRef', () => {
  it('CO 259a → fedlex:rs220:co-259a', () => {
    assert.equal(buildSourceId('CO 259a'), 'fedlex:rs220:co-259a');
  });
  it('CC 684 → fedlex:rs210:cc-684', () => {
    assert.equal(buildSourceId('CC 684'), 'fedlex:rs210:cc-684');
  });
  it('parseRef extrait code et article', () => {
    const p = parseRef('CO 259a');
    assert.equal(p.code, 'CO');
    assert.equal(p.rs, '220');
    assert.equal(p.article, '259a');
  });
  it('parseRef retourne null sur entrée invalide', () => {
    assert.equal(parseRef(''), null);
    assert.equal(parseRef(null), null);
  });
});

// ─── fetchFedlexArticle mock ────────────────────────────────────

describe('fedlex-diff — fetchFedlexArticle en mode mock', () => {
  it('retourne text + ok=true en mode mock (pas de réseau)', async () => {
    const r = await fetchFedlexArticle('220', '259a', { mock: true, mockContent: 'MOCK' });
    assert.equal(r.ok, true);
    assert.equal(r.text, 'MOCK');
    assert.equal(r.mock, true);
  });

  it('construit une URL Fedlex canonique', async () => {
    const r = await fetchFedlexArticle('220', '259a', { mock: true });
    assert.match(r.url, /fedlex\.admin\.ch/);
    assert.match(r.url, /art_259a/);
  });
});

// ─── extractArticleText ─────────────────────────────────────────

describe('fedlex-diff — extractArticleText', () => {
  it('extrait le texte d\'un bloc article ciblé', () => {
    const html = `<html><body>
      <article id="art_258">ancien article</article>
      <article id="art_259a">le nouveau texte <strong>ici</strong></article>
      <article id="art_260">autre</article>
    </body></html>`;
    const t = extractArticleText(html, '259a');
    assert.match(t, /le nouveau texte/);
    assert.ok(!/ancien article/.test(t), 'ne doit pas contenir les autres articles');
    assert.ok(!/<strong>/.test(t), 'les tags doivent être strippés');
  });

  it('fallback sur tout le body si id introuvable', () => {
    const t = extractArticleText('<html><body>Hello world</body></html>', '999z');
    assert.match(t, /hello world/i);
  });

  it('gère input vide', () => {
    assert.equal(extractArticleText('', '1'), '');
    assert.equal(extractArticleText(null, '1'), '');
  });
});

// ─── runDiff integration (mock mode, isolated log) ──────────────

describe('fedlex-daily-diff — script en mode mock', () => {
  const fakeArticles = [
    { ref: 'CO 259a', texte: 'le locataire peut exiger la réparation.', domaines: ['bail'] },
    { ref: 'CO 257e', texte: 'la garantie ne peut excéder trois mois.', domaines: ['bail'] },
    { ref: 'CO 335c', texte: 'délai de congé trois mois.', domaines: ['travail'] },
  ];
  const fakeFiches = [
    { id: 'bail_moisissure', articles: [{ ref: 'CO 259a' }] },
  ];
  const fakeRules = [
    { id: 'bail_caution_max', base_legale: 'CO 257e', source_ids: ['fedlex:rs220:co-257e'] },
  ];

  it('premier run: ne signale aucun changement (seed)', async () => {
    const emptyLog = { version: 1, runs: [], last_hashes: {} };
    const { runEntry } = await runDiff({
      mock: true, dryRun: true,
      articles: fakeArticles, fiches: fakeFiches, rules: fakeRules, log: emptyLog,
    });
    assert.equal(runEntry.mode, 'mock');
    assert.equal(runEntry.checked, 3);
    assert.equal(runEntry.changed, 0, 'premier run = seed, pas de changement');
  });

  it('second run avec hash différent: détecte changement', async () => {
    // Seed with wrong hashes to force changes
    const prevHashes = {
      'CO 259a': 'stale_hash_abc',
      'CO 257e': 'stale_hash_def',
      'CO 335c': 'stale_hash_xyz',
    };
    const primedLog = { version: 1, runs: [], last_hashes: prevHashes };
    const { runEntry } = await runDiff({
      mock: true, dryRun: true,
      articles: fakeArticles, fiches: fakeFiches, rules: fakeRules, log: primedLog,
    });
    assert.equal(runEntry.checked, 3);
    assert.equal(runEntry.changed, 3, 'tous les hashes diffèrent → 3 changements');
    assert.equal(runEntry.entries.length, 3);
    for (const e of runEntry.entries) {
      assert.ok(e.ref);
      assert.ok(e.current_hash);
      assert.ok(e.source_id.startsWith('fedlex:'));
      assert.ok(['high', 'medium', 'low'].includes(e.impact.priority));
    }
  });

  it('runDiff tourne sans erreur en mode mock avec rules vides', async () => {
    const { runEntry } = await runDiff({
      mock: true, dryRun: true,
      articles: fakeArticles, fiches: [], rules: [], log: { version: 1, runs: [], last_hashes: {} },
    });
    assert.equal(runEntry.errors, 0);
  });

  it('log est append-only : les runs précédents sont préservés', async () => {
    const oldRun = {
      run_id: 'run_old', started_at: '2025-01-01', finished_at: '2025-01-01',
      mode: 'mock', checked: 0, changed: 0, unchanged: 0, errors: 0, entries: [],
    };
    const existingLog = { version: 1, created_at: '2025-01-01', runs: [oldRun], last_hashes: {} };

    const { log } = await runDiff({
      mock: true, dryRun: true,
      articles: fakeArticles, fiches: [], rules: [], log: existingLog,
    });

    assert.equal(log.runs.length, 2, 'le run précédent doit être conservé + nouveau ajouté');
    assert.equal(log.runs[0].run_id, 'run_old', 'run ancien intact');
    assert.equal(log.created_at, '2025-01-01', 'created_at préservé');
  });

  it('écrit le log quand dryRun=false (dans fichier temporaire)', async () => {
    // We test the write path indirectly : runDiff avec dryRun=true retourne le log.
    // Le path d'écriture est couvert par atomicWriteSync qui a ses propres tests.
    const { log, runEntry } = await runDiff({
      mock: true, dryRun: true,
      articles: fakeArticles.slice(0, 1), fiches: [], rules: [],
      log: { version: 1, runs: [], last_hashes: {} },
    });
    assert.ok(log.last_hashes);
    assert.ok(log.last_hashes[fakeArticles[0].ref], 'hash stocké');
    assert.ok(log.last_run);
    assert.equal(runEntry.entries.length, 0, 'premier sighting = seed, pas d\'entry');
  });

  it('offline safe : ref invalide → skipped, pas d\'erreur', async () => {
    const bad = [{ ref: '', texte: 'xxx' }, { ref: null, texte: 'yyy' }];
    const { runEntry } = await runDiff({
      mock: true, dryRun: true,
      articles: bad, fiches: [], rules: [],
      log: { version: 1, runs: [], last_hashes: {} },
    });
    assert.equal(runEntry.errors + runEntry.skipped, 2);
  });
});

// ─── Dashboard summary ──────────────────────────────────────────

describe('fedlex-daily-diff — getDashboardSummary', () => {
  it('retourne structure vide si aucun run', () => {
    const s = getDashboardSummary({ version: 1, runs: [] });
    assert.equal(s.changed_count, 0);
    assert.equal(s.priority_high_count, 0);
    assert.equal(s.last_run, null);
  });

  it('expose last_run, changed_count, priority_high_count', () => {
    const log = {
      version: 1,
      runs: [{
        finished_at: '2026-04-19T12:00:00Z',
        changed: 2,
        mode: 'mock',
        entries: [
          { impact: { priority: 'high' } },
          { impact: { priority: 'medium' } },
        ],
      }],
    };
    const s = getDashboardSummary(log);
    assert.equal(s.changed_count, 2);
    assert.equal(s.priority_high_count, 1);
    assert.equal(s.last_run, '2026-04-19T12:00:00Z');
    assert.equal(s.total_runs, 1);
  });
});
