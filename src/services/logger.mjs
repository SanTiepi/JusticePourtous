/**
 * logger.mjs — Logger centralisé zero-dep.
 *
 * Objectifs :
 *   - JSON structuré en production (parseable par Datadog/Loki/grep)
 *   - Lisible humain en dev (`LOG_FORMAT=pretty` par défaut hors prod)
 *   - Silencieux en test (`NODE_ENV=test`) sauf si LOG_LEVEL explicite
 *   - Niveaux : debug | info | warn | error | silent
 *
 * Usage :
 *   import { createLogger } from './logger.mjs';
 *   const log = createLogger('triage');
 *   log.info('triage_start', { caseId, domaine });
 *   log.error('llm_failed', { err: err.message });
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

function resolveLevel() {
  const explicit = process.env.LOG_LEVEL;
  if (explicit && LEVELS[explicit] !== undefined) return LEVELS[explicit];
  if (process.env.NODE_ENV === 'test') return LEVELS.silent;
  if (process.env.NODE_ENV === 'production') return LEVELS.info;
  return LEVELS.debug;
}

function resolveFormat() {
  const explicit = process.env.LOG_FORMAT;
  if (explicit === 'json' || explicit === 'pretty') return explicit;
  return process.env.NODE_ENV === 'production' ? 'json' : 'pretty';
}

const CURRENT_LEVEL = resolveLevel();
const CURRENT_FORMAT = resolveFormat();

const COLORS = {
  debug: '\x1b[90m',  // gray
  info: '\x1b[36m',   // cyan
  warn: '\x1b[33m',   // yellow
  error: '\x1b[31m',  // red
  reset: '\x1b[0m',
};

function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    if (value instanceof Error) {
      return { message: value.message, stack: value.stack, name: value.name };
    }
    return value;
  });
}

// Lazy metrics bridge — avoids circular init and lets tests mock it out.
let _metricsRef = null;
async function metricsHook(level, module, event) {
  if (level !== 'error' && level !== 'warn') return;
  try {
    if (!_metricsRef) {
      _metricsRef = await import('./metrics.mjs');
    }
    _metricsRef.recordError(module, event);
  } catch { /* metrics module not available — ignore */ }
}

function emit(level, module, event, context) {
  if (LEVELS[level] < CURRENT_LEVEL) return;
  // Fire-and-forget: compteur d'erreurs pour /api/admin/metrics.
  metricsHook(level, module, event);
  const record = {
    ts: new Date().toISOString(),
    level,
    module,
    event,
    ...(context || {}),
  };
  const out = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  if (CURRENT_FORMAT === 'json') {
    out.write(safeStringify(record) + '\n');
  } else {
    const color = COLORS[level] || '';
    const ctx = context && Object.keys(context).length
      ? ' ' + safeStringify(context)
      : '';
    out.write(`${color}[${record.ts}] ${level.toUpperCase().padEnd(5)} ${module}:${event}${COLORS.reset}${ctx}\n`);
  }
}

export function createLogger(module) {
  return {
    debug: (event, ctx) => emit('debug', module, event, ctx),
    info: (event, ctx) => emit('info', module, event, ctx),
    warn: (event, ctx) => emit('warn', module, event, ctx),
    error: (event, ctx) => emit('error', module, event, ctx),
    child: (childModule) => createLogger(`${module}.${childModule}`),
  };
}

export function getLoggerConfig() {
  return {
    level: Object.keys(LEVELS).find(k => LEVELS[k] === CURRENT_LEVEL) || 'info',
    format: CURRENT_FORMAT,
    env: process.env.NODE_ENV || 'development',
  };
}
