import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { atomicWriteSync, safeLoadJSON } from '../atomic-write.mjs';

const CACHE_DIR = join(process.cwd(), '.cache', 'translations');
const CACHE_FILE = join(CACHE_DIR, 'index.json');

let cacheLoaded = false;
let cacheData = {};
// Le cache disque est une OPTIMISATION, jamais un bloqueur. En conteneur, /app/.cache
// peut ne pas être inscriptible par l'utilisateur runtime (EACCES sur mkdir) — ce qui
// faisait throw ensureLoaded() et CASSAIT toute la traduction (status failed_internal,
// corps des pages bloqué en FR malgré une API LLM fonctionnelle). Bug diagnostiqué le
// 2026-05-31. On bascule alors en cache MÉMOIRE best-effort, sans jamais throw.
let cacheDiskDisabled = false;

function ensureLoaded() {
  if (cacheLoaded) return;
  cacheLoaded = true;
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    cacheData = safeLoadJSON(CACHE_FILE) || {};
  } catch {
    cacheDiskDisabled = true; // disque indisponible → cache mémoire uniquement
    cacheData = {};
  }
}

function persist() {
  ensureLoaded();
  if (cacheDiskDisabled) return; // best-effort : pas de persistance disque
  try {
    atomicWriteSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
  } catch {
    cacheDiskDisabled = true; // l'écriture a échoué une fois → on cesse d'essayer
  }
}

export function computeCacheKey(parts) {
  const normalized = JSON.stringify(parts);
  return createHash('sha256').update(normalized).digest('hex');
}

export function computeContentHash(content) {
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}

export function getCacheEntry(key) {
  ensureLoaded();
  return cacheData[key] || null;
}

export function setCacheEntry(key, value) {
  ensureLoaded();
  cacheData[key] = {
    ...value,
    cached_at: new Date().toISOString()
  };
  persist();
  return cacheData[key];
}
