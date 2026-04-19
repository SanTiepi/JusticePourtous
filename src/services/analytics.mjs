// Analytics service — lightweight in-memory counters persisted to file
// No external deps, flush to JSON every 5 minutes

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { atomicWriteSync, safeLoadJSON } from './atomic-write.mjs';
import { createLogger } from './logger.mjs';

const log = createLogger('analytics');
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'data', 'meta', 'analytics.json');

// In-memory counters
let stats = {
  pageViews: {},       // path → count
  searchCount: 0,
  premiumAnalysisCount: 0,
  languages: {},       // lang → count
  lastFlush: null,
  startedAt: new Date().toISOString()
};

// Load from file on startup
function loadFromFile() {
  const saved = safeLoadJSON(DATA_FILE);
  if (saved && typeof saved === 'object') {
    stats.pageViews = saved.pageViews || {};
    stats.searchCount = saved.searchCount || 0;
    stats.premiumAnalysisCount = saved.premiumAnalysisCount || 0;
    stats.languages = saved.languages || {};
    stats.lastFlush = saved.lastFlush || null;
    stats.startedAt = saved.startedAt || stats.startedAt;
  }
}

loadFromFile();

// Flush to file
function flushToFile() {
  try {
    stats.lastFlush = new Date().toISOString();
    atomicWriteSync(DATA_FILE, JSON.stringify(stats, null, 2));
  } catch (err) {
    log.error('flush_failed', { err: err.message });
  }
}

// Flush every 5 minutes (unref so tests can exit)
setInterval(flushToFile, 5 * 60 * 1000).unref();

// --- Public API ---

export function trackPageView(path) {
  if (!path || typeof path !== 'string') return;
  stats.pageViews[path] = (stats.pageViews[path] || 0) + 1;
}

export function trackSearch() {
  stats.searchCount++;
}

export function trackPremiumAnalysis() {
  stats.premiumAnalysisCount++;
}

export function trackLanguage(lang) {
  if (!lang || typeof lang !== 'string') return;
  const clean = lang.slice(0, 10).toLowerCase();
  stats.languages[clean] = (stats.languages[clean] || 0) + 1;
}

export function getStats() {
  return {
    ...stats,
    _snapshotAt: new Date().toISOString()
  };
}

// Flush on process exit (best effort)
process.on('beforeExit', flushToFile);
