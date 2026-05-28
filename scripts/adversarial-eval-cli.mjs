#!/usr/bin/env node
/**
 * Adversarial eval via `claude -p` CLI (no ANTHROPIC_API_KEY).
 *
 * Reproduces the LLM-first navigation path: same SYSTEM_PROMPT + catalog
 * as src/services/llm-navigator.mjs. The CLI subscription answers in
 * place of the API key path. Output JSON is mapped to fiches → domain/
 * articles via src/data/fiches/*.json.
 *
 * Score per case (max 8) :
 *   - found (fiches_pertinentes non vide) — weight 2
 *   - domain_correct (au moins une fiche du domaine attendu) — weight 3
 *   - article_required (au moins un article attendu cité par les fiches) — weight 3
 *
 * Les rubriques contacts/délais du runner API ne s'appliquent pas ici
 * (elles dépendent de l'enrichment post-navigator, hors scope CLI).
 *
 * Usage :
 *   node scripts/adversarial-eval-cli.mjs [--limit N] [--model haiku|sonnet|opus]
 *   node scripts/adversarial-eval-cli.mjs --json > report.json
 *
 * Skip si `claude` CLI absent du PATH.
 */

import { ADVERSARIAL_CASES } from '../test/adversarial-cases.mjs';
import { SYSTEM_PROMPT } from '../src/services/llm-navigator.mjs';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(name);
  return i === -1 ? def : args[i + 1];
};
const LIMIT = parseInt(flag('--limit', String(ADVERSARIAL_CASES.length)), 10);
const MODEL = flag('--model', 'haiku');
const CONCURRENCY = parseInt(flag('--concurrency', '4'), 10);
const PARSE_RETRIES = parseInt(flag('--retries', '1'), 10);
const JSON_MODE = args.includes('--json');
const log = JSON_MODE ? () => {} : (...a) => console.log(...a);
const writeRaw = JSON_MODE ? () => {} : (s) => process.stdout.write(s);

// ─── Pre-flight: claude CLI present ? ──────────────────────────
const check = spawnSync('claude', ['--version'], { encoding: 'utf8' });
if (check.status !== 0) {
  console.error('adversarial CLI eval skipped: claude CLI not in PATH');
  process.exit(0); // soft skip — CI gate not failed
}

// ─── Load fiches index : id → {domaine, articles} ──────────────
function loadFicheIndex() {
  const dir = join(ROOT, 'src/data/fiches');
  const idx = new Map();
  for (const f of readdirSync(dir).filter(x => x.endsWith('.json'))) {
    const arr = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const fiche of arr) {
      const articles = (fiche.reponse?.articles || []).map(a => a.ref);
      idx.set(fiche.id, { domaine: fiche.domaine, articles });
    }
  }
  return idx;
}

const SCHEMA_REMINDER = `\n\nIMPORTANT — Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de \`\`\`). La clé OBLIGATOIRE est "fiches_pertinentes" (array de string IDs du catalogue, pas d'objets imbriqués). Schéma minimal :\n{"fiches_pertinentes":["id1","id2"],"confiance":"haute|moyenne|basse","resume_situation":"..."}`;

// ─── Spawn claude -p, return parsed JSON or {error} ────────────
function spawnClaudeOnce(userQuery, systemPromptFile, cleanCwd) {
  return new Promise((resolve) => {
    const child = spawn('claude', [
      '-p',
      '--system-prompt-file', systemPromptFile,
      '--append-system-prompt', SCHEMA_REMINDER,
      '--model', MODEL,
      '--output-format', 'text',
      '--no-session-persistence',
      '--disable-slash-commands',
      userQuery,
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      // Run from a clean directory so CLAUDE.md / hooks from the JPT repo
      // do not leak into the eval prompt.
      cwd: cleanCwd,
    });

    let out = '', err = '';
    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);

    const timeout = setTimeout(() => {
      try { child.kill('SIGTERM'); } catch {}
    }, 120000);

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        resolve({ error: `claude exit ${code}: ${(err || out).slice(0, 200)}`, raw: out });
        return;
      }
      const clean = out
        .replace(/^```json\s*/im, '')
        .replace(/```\s*$/m, '')
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      try {
        resolve({ data: JSON.parse(clean), raw: out });
        return;
      } catch {}
      // Fallback: extract first top-level {...} block
      const m = clean.match(/\{[\s\S]*\}/);
      if (m) {
        try { resolve({ data: JSON.parse(m[0]), raw: out }); return; } catch {}
      }
      resolve({ error: `parse failed: ${clean.slice(0, 200)}`, raw: out, parseFail: true });
    });
  });
}

// Retry wrapper: haiku occasionally answers outside the JSON schema. A single
// retry recovers most of these transient parse failures (only parse-fails are
// retried — exit-code errors like timeouts are not, to avoid re-waiting).
async function callClaudeCLI(userQuery, systemPromptFile, cleanCwd) {
  let resp = await spawnClaudeOnce(userQuery, systemPromptFile, cleanCwd);
  for (let attempt = 0; attempt < PARSE_RETRIES && resp.parseFail; attempt++) {
    resp = await spawnClaudeOnce(userQuery, systemPromptFile, cleanCwd);
  }
  return resp;
}

// ─── Scoring ───────────────────────────────────────────────────
const RUBRICS = [
  { id: 'found', label: 'Fiches pertinentes retournées', weight: 2 },
  { id: 'domain_correct', label: 'Domaine attendu présent', weight: 3 },
  { id: 'article_required', label: 'Au moins 1 article attendu cité', weight: 3 },
];
const MAX_POINTS = RUBRICS.reduce((s, r) => s + r.weight, 0);

function scoreCase(gc, llmResp, ficheIndex) {
  if (llmResp.error) {
    return {
      id: gc.id, error: llmResp.error, score: 0,
      ctx: { expected_domaine: gc.expected_domaine, expected_any_article: gc.expected_any_article },
      rubrics: RUBRICS.map(r => ({ id: r.id, label: r.label, weight: r.weight, passed: false })),
    };
  }
  // Normalize : LLM sometimes returns array of {id, raison} objects instead of bare
  // string IDs, and sometimes uses fiches_candidates / fiches / matches as the key.
  const d = llmResp.data || {};
  const rawList =
    d.fiches_pertinentes
    || d.fiches_candidates
    || d.fiches
    || d.matches
    || [];
  const ficheIds = (Array.isArray(rawList) ? rawList : [])
    .map(x => (typeof x === 'string' ? x : (x && typeof x === 'object' ? (x.id || x.ficheId || x.fiche_id) : null)))
    .filter(Boolean);
  const fiches = ficheIds.map(id => ficheIndex.get(id)).filter(Boolean);
  const domaines = [...new Set(fiches.map(f => f.domaine))];
  const articleRefs = [...new Set(fiches.flatMap(f => f.articles))];

  const required = new Set(gc.expected_any_article);
  const checks = {
    found: ficheIds.length > 0,
    domain_correct: domaines.includes(gc.expected_domaine),
    article_required: articleRefs.some(r => required.has(r)),
  };
  const rubrics = RUBRICS.map(r => ({
    id: r.id, label: r.label, weight: r.weight, passed: checks[r.id],
  }));
  const points = rubrics.reduce((s, r) => s + (r.passed ? r.weight : 0), 0);
  const score = Math.round((points / MAX_POINTS) * 100);
  return {
    id: gc.id, score, rubrics,
    ctx: {
      expected_domaine: gc.expected_domaine,
      expected_any_article: gc.expected_any_article,
      ficheIds, domaines, articleRefs: articleRefs.slice(0, 8),
      raw_keys: Object.keys(llmResp.data || {}),
      ...checks,
    },
  };
}

// ─── Main ──────────────────────────────────────────────────────
const cases = ADVERSARIAL_CASES.slice(0, LIMIT);

log('='.repeat(72));
log(`ADVERSARIAL EVAL CLI — ${cases.length} cases via claude -p (model=${MODEL})`);
log('='.repeat(72));
log();

const ficheIndex = loadFicheIndex();
const tmp = mkdtempSync(join(tmpdir(), 'adv-eval-cli-'));
const sysFile = join(tmp, 'system-prompt.txt');
writeFileSync(sysFile, SYSTEM_PROMPT);
// Run claude -p with cwd outside the JPT repo so CLAUDE.md / hooks don't
// leak into the eval prompt and break JSON output.
const cleanCwd = tmp;

async function runCase(gc, idx) {
  const start = Date.now();
  const resp = await callClaudeCLI(gc.query, sysFile, cleanCwd);
  const elapsed = Date.now() - start;
  const r = scoreCase(gc, resp, ficheIndex);
  r.elapsed = elapsed;
  r.query = gc.query;
  r.notes = gc.notes;
  if (resp.error || r.score < 100) {
    r.raw_excerpt = (resp.raw || '').slice(0, 400);
  }
  const label = resp.error
    ? `ERROR (${elapsed}ms): ${resp.error.slice(0, 60)}`
    : `${r.score}% (${elapsed}ms)`;
  log(`  [${idx + 1}/${cases.length}] ${gc.id.padEnd(22)} ${label}`);
  return r;
}

// Concurrency-bounded parallel runner
const results = new Array(cases.length);
let cursor = 0;
async function worker() {
  while (true) {
    const i = cursor++;
    if (i >= cases.length) return;
    results[i] = await runCase(cases[i], i);
  }
}
log(`(running with concurrency=${CONCURRENCY})`);
log();
await Promise.all(Array.from({ length: Math.max(1, CONCURRENCY) }, worker));

const total = results.length;
const globalScore = total > 0
  ? Math.round(results.reduce((s, r) => s + r.score, 0) / total)
  : 0;

log();
log('='.repeat(72));
log(`GLOBAL SCORE: ${globalScore}%   (${total} cases)`);
log('='.repeat(72));
log();

// Distribution
const buckets = { '100': 0, '80-99': 0, '50-79': 0, '0-49': 0 };
for (const r of results) {
  if (r.score === 100) buckets['100']++;
  else if (r.score >= 80) buckets['80-99']++;
  else if (r.score >= 50) buckets['50-79']++;
  else buckets['0-49']++;
}
log('DISTRIBUTION:');
log(`  100%      : ${buckets['100']}`);
log(`  80-99%    : ${buckets['80-99']}`);
log(`  50-79%    : ${buckets['50-79']}`);
log(`  0-49%     : ${buckets['0-49']}`);
log();

// Rubric failures
const failCounts = {};
for (const r of results) {
  for (const rub of (r.rubrics || [])) {
    if (!rub.passed) failCounts[rub.label] = (failCounts[rub.label] || 0) + 1;
  }
}
log('RUBRIC FAILURE COUNT:');
const ranked = Object.entries(failCounts).sort((a, b) => b[1] - a[1]);
for (const [label, count] of ranked) {
  const pct = Math.round((count / total) * 100);
  log(`  ${String(count).padStart(3)} / ${total}  (${String(pct).padStart(3)}%)  ${label}`);
}
log();

// Worst cases
const worst = [...results].sort((a, b) => a.score - b.score);
log('CASES WITH FAILS:');
log();
for (const r of worst) {
  if (r.score === 100) break;
  log(`[${r.score >= 80 ? 'WARN' : 'FAIL'}] ${String(r.score).padStart(3)}%  ${r.id}  (${r.elapsed}ms)`);
  log(`         Query: "${r.query.slice(0, 90)}${r.query.length > 90 ? '...' : ''}"`);
  log(`         Notes: ${r.notes}`);
  log(`         Expected: domaine=${r.ctx.expected_domaine} articles=${r.ctx.expected_any_article.join('|')}`);
  log(`         Got:      domaines=[${(r.ctx.domaines || []).join(',')}] fiches=[${(r.ctx.ficheIds || []).join(', ')}]`);
  log(`         Articles: [${(r.ctx.articleRefs || []).join(', ')}]`);
  if (r.error) log(`         ERROR: ${r.error}`);
  log();
}

if (JSON_MODE) {
  process.stdout.write(JSON.stringify({
    model: MODEL,
    total,
    global_score: globalScore,
    distribution: buckets,
    rubric_failures: failCounts,
    results,
  }, null, 2));
} else {
  // Persist report for SPRINT-LOG references
  const reportPath = join(ROOT, 'src/data/meta/adversarial-cli-report.json');
  try {
    writeFileSync(reportPath, JSON.stringify({
      generated_at: new Date().toISOString(),
      model: MODEL,
      total,
      global_score: globalScore,
      distribution: buckets,
      rubric_failures: failCounts,
      results,
    }, null, 2));
    log(`Report : ${reportPath}`);
  } catch (e) {
    log(`(report write skipped : ${e.message})`);
  }
}

// Exit code 0 always — gate logic is "score >= 95" interpreted by caller.
