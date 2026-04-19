import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { atomicWriteSync, safeLoadJSON } from '../atomic-write.mjs';

const CACHE_DIR = join(process.cwd(), '.cache', 'translations');
const CACHE_FILE = join(CACHE_DIR, 'index.json');

let cacheLoaded = false;
let cacheData = {};

function ensureLoaded() {
  if (cacheLoaded) return;
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  cacheData = safeLoadJSON(CACHE_FILE) || {};
  cacheLoaded = true;
}

function persist() {
  ensureLoaded();
  atomicWriteSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
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
