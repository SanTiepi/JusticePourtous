#!/usr/bin/env node
/**
 * Fedlex Daily Diff — détection quotidienne des changements Fedlex
 *
 * Mission Cortex Phase 2.
 *
 * - Itère sur tous les articles harvestés (src/data/loi/*.json)
 * - Fetch Fedlex (ou mode mock)
 * - Compare hash avec dernier snapshot stocké
 * - Si changement : enregistre diff + analyse d'impact
 * - Écrit append-only src/data/meta/fedlex-diff-log.json
 *
 * Usage:
 *   node scripts/fedlex-daily-diff.mjs            # live mode (Fedlex)
 *   node scripts/fedlex-daily-diff.mjs --mock     # mock mode (0-2 changes)
 *   node scripts/fedlex-daily-diff.mjs --limit=10 # only 10 articles
 *   node scripts/fedlex-daily-diff.mjs --dry-run  # no write
 *
 * Offline safe : si le réseau est down et pas --mock → skip proprement
 * avec 0 changement enregistré.
 */

import { readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  fetchFedlexArticle,
  hashArticle,
  detectChanges,
  analyzeImpact,
  buildSourceId,
  parseRef,
} from '../src/services/fedlex-diff.mjs';
import { atomicWriteSync, safeLoadJSON } from '../src/services/atomic-write.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOI_DIR = join(ROOT, 'src', 'data', 'loi');
const FICHES_DIR = join(ROOT, 'src', 'data', 'fiches');
const META_DIR = join(ROOT, 'src', 'data', 'meta');
const LOG_FILE = join(META_DIR, 'fedlex-diff-log.json');

// ─── Args ────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { mock: false, dryRun: false, limit: Infinity, delay: 500 };
  for (const a of argv.slice(2)) {
    if (a === '--mock') args.mock = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a.startsWith('--limit=')) args.limit = parseInt(a.split('=')[1], 10) || Infinity;
    else if (a.startsWith('--delay=')) args.delay = parseInt(a.split('=')[1], 10) || 0;
  }
  return args;
}

// ─── Load helpers ────────────────────────────────────────────────

export function loadAllArticles() {
  const byRef = new Map();
  if (!existsSync(LOI_DIR)) return [];
  for (const f of readdirSync(LOI_DIR).filter(f => f.endsWith('.json') && !f.endsWith('.corrupted'))) {
    const data = safeLoadJSON(join(LOI_DIR, f));
    if (!Array.isArray(data)) continue;
    for (const a of data) {
      if (!a || !a.ref) continue;
      // Dedup by ref: prefer entries that actually have text
      const existing = byRef.get(a.ref);
      if (!existing) { byRef.set(a.ref, a); continue; }
      if (!existing.texte && a.texte) byRef.set(a.ref, a);
    }
  }
  return Array.from(byRef.values());
}

export function loadAllFiches() {
  const out = [];
  if (!existsSync(FICHES_DIR)) return out;
  for (const f of readdirSync(FICHES_DIR).filter(f => f.endsWith('.json'))) {
    const data = safeLoadJSON(join(FICHES_DIR, f));
    if (Array.isArray(data)) out.push(...data);
  }
  return out;
}

export function loadRules() {
  // Lazy import: normative-compiler is heavy, only load when needed.
  try {
    // dynamic import handled by caller for test-friendliness
    return null;
  } catch { return []; }
}

export function loadDiffLog() {
  const existing = safeLoadJSON(LOG_FILE);
  if (existing && typeof existing === 'object' && Array.isArray(existing.runs)) {
    return existing;
  }
  return { version: 1, created_at: new Date().toISOString(), runs: [] };
}

// ─── Hash store (last known hash per article) ────────────────────
// Stored inside the log file under `last_hashes: { ref: hash }`.

function getLastHashes(log) {
  return (log && typeof log.last_hashes === 'object' && log.last_hashes) || {};
}

// ─── Mock mode ───────────────────────────────────────────────────

function mockFetchResult(article, state) {
  // Deterministic pseudo-random per ref. 0-2 changes per run:
  // first run seeds, subsequent runs flip ~2% of articles.
  const last = state.lastHashes[article.ref];
  if (!last) {
    // first sighting → same content as stored texte
    return { ok: true, text: article.texte || article.ref, url: 'mock://', status: 200, mock: true };
  }
  // Flip ~2% based on hash of run timestamp + ref
  const seed = (state.runSalt + article.ref).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const bucket = seed % 100;
  if (bucket < 2 && state.flipCount < 2) {
    state.flipCount++;
    return { ok: true, text: (article.texte || '') + ' [MODIFIÉ ' + state.runSalt + ']',
             url: 'mock://', status: 200, mock: true };
  }
  return { ok: true, text: article.texte || article.ref, url: 'mock://', status: 200, mock: true };
}

// ─── Main run ────────────────────────────────────────────────────

export async function runDiff({ mock = false, dryRun = false, limit = Infinity, delay = 500,
                                articles = null, fiches = null, rules = null, log = null } = {}) {
  const allArticles = articles || loadAllArticles();
  const allFiches = fiches || loadAllFiches();
  const allRules = rules || await loadRulesAsync();
  const diffLog = log || loadDiffLog();

  const state = {
    lastHashes: getLastHashes(diffLog),
    runSalt: new Date().toISOString().slice(0, 10),
    flipCount: 0,
  };

  const runEntry = {
    run_id: `run_${Date.now()}`,
    started_at: new Date().toISOString(),
    last_run: new Date().toISOString(),
    mode: mock ? 'mock' : 'live',
    checked: 0,
    unchanged: 0,
    changed: 0,
    errors: 0,
    skipped: 0,
    entries: [],
  };

  const updatedHashes = { ...state.lastHashes };
  const toProcess = allArticles.slice(0, limit);

  for (const art of toProcess) {
    runEntry.checked++;
    const parsed = parseRef(art.ref);
    if (!parsed) { runEntry.skipped++; continue; }

    let result;
    try {
      if (mock) {
        result = mockFetchResult(art, state);
      } else {
        result = await fetchFedlexArticle(parsed.rs, parsed.article, { timeout: 10_000 });
      }
    } catch (err) {
      runEntry.errors++;
      continue;
    }

    if (!result || !result.ok) {
      runEntry.errors++;
      // offline-safe: don't crash, don't overwrite stored hash
      continue;
    }

    const currentHash = hashArticle(result.text || '');
    const previousHash = state.lastHashes[art.ref] || null;

    const diff = detectChanges(
      previousHash ? { hash: previousHash, text: art.texte } : null,
      { hash: currentHash, text: result.text }
    );

    if (!diff.changed) {
      runEntry.unchanged++;
      updatedHashes[art.ref] = currentHash;
      continue;
    }

    // First sighting doesn't count as a change for reporting
    if (!previousHash) {
      runEntry.unchanged++;
      updatedHashes[art.ref] = currentHash;
      continue;
    }

    runEntry.changed++;
    const impact = analyzeImpact(
      { ref: art.ref, source_id: buildSourceId(art.ref), domaines: art.domaines || [] },
      allFiches,
      allRules
    );

    runEntry.entries.push({
      ref: art.ref,
      source_id: buildSourceId(art.ref),
      detected_at: new Date().toISOString(),
      previous_hash: diff.previous_hash,
      current_hash: diff.current_hash,
      diff_summary: diff.diff_summary,
      url: result.url,
      impact,
    });

    updatedHashes[art.ref] = currentHash;

    // Polite rate-limit in live mode
    if (!mock && delay > 0) await sleep(delay);
  }

  runEntry.finished_at = new Date().toISOString();

  // Append-only: push the new run, keep history, refresh last_hashes
  const newLog = {
    ...diffLog,
    version: diffLog.version || 1,
    created_at: diffLog.created_at || new Date().toISOString(),
    last_run: runEntry.finished_at,
    last_hashes: updatedHashes,
    runs: [...(diffLog.runs || []), runEntry],
  };

  if (!dryRun) {
    if (!existsSync(META_DIR)) mkdirSync(META_DIR, { recursive: true });
    atomicWriteSync(LOG_FILE, JSON.stringify(newLog, null, 2));
  }

  return { runEntry, log: newLog };
}

async function loadRulesAsync() {
  try {
    const mod = await import('../src/services/normative-compiler.mjs');
    return mod.ALL_RULES || [];
  } catch { return []; }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Dashboard summary helper ────────────────────────────────────

export function getDashboardSummary(log = null) {
  const l = log || loadDiffLog();
  const last = (l.runs || []).slice(-1)[0];
  if (!last) {
    return { last_run: null, changed_count: 0, priority_high_count: 0, total_runs: 0 };
  }
  const high = (last.entries || []).filter(e => e.impact?.priority === 'high').length;
  return {
    last_run: last.finished_at || last.last_run || last.started_at,
    changed_count: last.changed || 0,
    priority_high_count: high,
    total_runs: (l.runs || []).length,
    mode: last.mode || 'live',
  };
}

// ─── CLI entry ───────────────────────────────────────────────────

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const args = parseArgs(process.argv);
  runDiff(args).then(({ runEntry }) => {
    const summary = `[fedlex-diff] mode=${runEntry.mode} checked=${runEntry.checked} ` +
      `changed=${runEntry.changed} unchanged=${runEntry.unchanged} ` +
      `errors=${runEntry.errors} skipped=${runEntry.skipped}`;
    console.log(summary);
    if (runEntry.changed > 0) {
      console.log(`[fedlex-diff] ${runEntry.entries.length} change(s) logged in ${LOG_FILE}`);
      for (const e of runEntry.entries.slice(0, 5)) {
        console.log(`  - ${e.ref} (${e.impact.priority}): ${e.diff_summary}`);
      }
    }
  }).catch((err) => {
    console.error('[fedlex-diff] FATAL:', err.message);
    process.exit(1);
  });
}
