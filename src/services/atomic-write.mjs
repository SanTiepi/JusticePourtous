/**
 * Atomic file write — write to .tmp then rename.
 * Prevents corruption if the process crashes mid-write.
 *
 * On load failure: backs up corrupted file as .corrupted and logs a warning.
 */

import { writeFileSync, renameSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { createLogger } from './logger.mjs';

const log = createLogger('atomic-write');

/**
 * Write data atomically: write to tmpPath, then rename over target.
 *
 * The rename is retried briefly on EPERM/EBUSY/EACCES — Windows can transiently
 * hold a lock on the destination (AV scanner, indexer, parallel test runners)
 * and reject the rename even though the writer owns the file.
 *
 * @param {string} filePath — target file path
 * @param {string} data — stringified content to write
 */
export function atomicWriteSync(filePath, data) {
  const tmpPath = filePath + '.tmp';
  writeFileSync(tmpPath, data, 'utf-8');

  const transient = new Set(['EPERM', 'EBUSY', 'EACCES']);
  const delays = [5, 15, 40, 100, 250];
  let lastErr;
  for (let i = 0; i <= delays.length; i++) {
    try {
      renameSync(tmpPath, filePath);
      return;
    } catch (err) {
      lastErr = err;
      if (!transient.has(err.code) || i === delays.length) throw err;
      const until = Date.now() + delays[i];
      while (Date.now() < until) { /* spin briefly */ }
    }
  }
  throw lastErr;
}

/**
 * Safely load JSON from a file. If the file is corrupted:
 * - Backs it up as .corrupted
 * - Logs a warning
 * - Returns null
 *
 * @param {string} filePath
 * @returns {any|null} parsed JSON or null
 */
export function safeLoadJSON(filePath) {
  if (!existsSync(filePath)) return null;
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    log.warn('corrupted_json', { filePath, err: err.message });
    try {
      const backupPath = filePath + '.corrupted';
      copyFileSync(filePath, backupPath);
      log.warn('corrupted_backed_up', { backupPath });
    } catch { /* best effort */ }
    return null;
  }
}
