#!/usr/bin/env node
/**
 * Runner d'éval "hyper poussée" sur cas juridiques complexes.
 *
 * Pour chaque cas (test/complex-cases.mjs ou --cases <path>), exécute LES DEUX
 * chemins de triage et capture la sortie COMPLÈTE (pas juste les fiches) :
 *
 *  1. Chemin NAVIGATOR LLM (le futur, quand l'API sera financée) — rejoué via
 *     `claude -p` + le VRAI SYSTEM_PROMPT de src/services/llm-navigator.mjs,
 *     model haiku (= modèle de prod). Capture fiches_pertinentes + infos_extraites
 *     + questions_manquantes + confiance + resume_situation.
 *
 *  2. Chemin KEYWORD fallback (la PROD ACTUELLE, LLM down) — queryByProblem().
 *     Capture la fiche primaire + alternatives + articles + délais + escalade.
 *
 * Sortie : JSON [{ case, nav, keyword }] sur --out <path> (défaut C:/tmp/complex-eval-runs.json).
 *
 * Usage :
 *   node scripts/run-complex-eval.mjs [--cases test/complex-cases.mjs] [--out ...] [--limit N] [--model haiku] [--concurrency 4]
 *
 * Skip navigator si `claude` CLI absent (keyword quand même exécuté).
 */
import { queryByProblem } from '../src/services/knowledge-engine.mjs';
import { SYSTEM_PROMPT } from '../src/services/llm-navigator.mjs';
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { dirname, join, isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
const CASES_PATH = flag('--cases', join(ROOT, 'test/complex-cases.mjs'));
const OUT = flag('--out', 'C:/tmp/complex-eval-runs.json');
const MODEL = flag('--model', 'haiku');
const CONCURRENCY = parseInt(flag('--concurrency', '4'), 10);
const PARSE_RETRIES = parseInt(flag('--retries', '1'), 10);
const LIMIT = parseInt(flag('--limit', '9999'), 10);

const SCHEMA_REMINDER = `\n\nIMPORTANT — Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown). Clés: "fiches_pertinentes" (array d'IDs string du catalogue), "confiance", "resume_situation", "infos_extraites" (objet), "questions_manquantes" (array d'objets {question, importance}).`;

// Lance le CLI via `node cli.js` (argv propre, pas de shell → pas d'enfer
// d'échappement avec apostrophes/accents). claude.cmd n'est pas résolu par
// spawn sans shell sur Windows.
const CLAUDE_CLI = process.env.CLAUDE_CLI ||
  'C:/Users/robin/AppData/Roaming/npm/node_modules/@anthropic-ai/claude-code/cli.js';

function navPossible() {
  if (!existsSync(CLAUDE_CLI)) return false;
  const c = spawnSync(process.execPath, [CLAUDE_CLI, '--version'], { encoding: 'utf8' });
  return c.status === 0;
}

function spawnClaudeOnce(query, sysFile, cwd) {
  return new Promise((res) => {
    const child = spawn(process.execPath, [
      CLAUDE_CLI,
      '-p', '--system-prompt-file', sysFile, '--append-system-prompt', SCHEMA_REMINDER,
      '--model', MODEL, '--output-format', 'text', '--no-session-persistence',
      '--disable-slash-commands', query,
    ], { stdio: ['ignore', 'pipe', 'pipe'], cwd });
    let out = '', err = '';
    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
    const to = setTimeout(() => { try { child.kill('SIGTERM'); } catch {} }, 120000);
    child.on('close', (code) => {
      clearTimeout(to);
      if (code !== 0) return res({ error: `claude exit ${code}: ${(err || out).slice(0, 160)}` });
      const clean = out.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try { return res({ data: JSON.parse(clean) }); } catch {}
      const m = clean.match(/\{[\s\S]*\}/);
      if (m) { try { return res({ data: JSON.parse(m[0]) }); } catch {} }
      res({ error: 'parse failed', parseFail: true, raw: clean.slice(0, 200) });
    });
  });
}
async function callNav(query, sysFile, cwd) {
  let r = await spawnClaudeOnce(query, sysFile, cwd);
  for (let i = 0; i < PARSE_RETRIES && r.parseFail; i++) r = await spawnClaudeOnce(query, sysFile, cwd);
  return r;
}

// ── Keyword path capture ──────────────────────────────────────
function runKeyword(query, canton) {
  try {
    const r = queryByProblem(query, canton || null);
    const d = r.data || {};
    if (d.type === 'enriched') {
      return {
        type: 'enriched',
        primary_id: d.fiche?.id || null,
        primary_domaine: d.fiche?.domaine || null,
        articles: (d.articles || []).map(a => a.ref).slice(0, 8),
        delais_count: (d.delais || []).length,
        escalade_count: (d.escalade || []).length,
        alternatives: (d.alternatives || []).map(a => ({ id: a.id, domaine: a.domaine, score: a.score })).slice(0, 4),
      };
    }
    return { type: d.type || 'unknown', qualification: d.qualification?.qualification_juridique || null, bestScore: d.bestScore ?? null };
  } catch (e) {
    return { type: 'error', error: String(e).slice(0, 160) };
  }
}

// ── Main ──────────────────────────────────────────────────────
const casesUrl = pathToFileURL(isAbsolute(CASES_PATH) ? CASES_PATH : resolve(ROOT, CASES_PATH)).href;
const mod = await import(casesUrl);
const CASES = (mod.COMPLEX_CASES || mod.default || []).slice(0, LIMIT);
console.error(`[run-complex-eval] ${CASES.length} cas | nav model=${MODEL} | conc=${CONCURRENCY}`);

const canNav = navPossible();
if (!canNav) console.error('[run-complex-eval] claude CLI absent — chemin navigator SKIPPÉ, keyword seul.');

let sysFile = null, cleanCwd = null;
if (canNav) {
  const tmp = mkdtempSync(join(tmpdir(), 'cx-eval-'));
  sysFile = join(tmp, 'sys.txt');
  writeFileSync(sysFile, SYSTEM_PROMPT);
  cleanCwd = tmp;
}

const out = new Array(CASES.length);
let idx = 0, done = 0;
async function worker() {
  while (idx < CASES.length) {
    const i = idx++;
    const c = CASES[i];
    const keyword = runKeyword(c.query, c.canton);
    let nav = { skipped: true };
    if (canNav) {
      const r = await callNav(c.query, sysFile, cleanCwd);
      if (r.error) nav = { error: r.error };
      else {
        const dd = r.data || {};
        nav = {
          fiches_pertinentes: Array.isArray(dd.fiches_pertinentes) ? dd.fiches_pertinentes
            : (Array.isArray(dd.fiches) ? dd.fiches : []),
          confiance: dd.confiance ?? null,
          resume_situation: dd.resume_situation ?? null,
          infos_extraites: dd.infos_extraites ?? {},
          questions_manquantes: Array.isArray(dd.questions_manquantes) ? dd.questions_manquantes : [],
        };
        // Normalise fiches_pertinentes en IDs string
        nav.fiches_pertinentes = nav.fiches_pertinentes
          .map(x => typeof x === 'string' ? x : (x && (x.id || x.ficheId || x.fiche_id)) || null)
          .filter(Boolean);
      }
    }
    out[i] = { case: c, keyword, nav };
    done++;
    if (done % 5 === 0 || done === CASES.length) console.error(`  … ${done}/${CASES.length}`);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, CASES.length) }, worker));

writeFileSync(OUT, JSON.stringify(out, null, 2));
console.error(`[run-complex-eval] écrit ${OUT} (${out.length} runs)`);
