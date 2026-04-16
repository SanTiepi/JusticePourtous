/**
 * Atomic file write — write to .tmp then rename.
 * Prevents corruption if the process crashes mid-write.
 *
 * On load failure: backs up corrupted file as .corrupted and logs a warning.
 */

import { writeFileSync, renameSync, existsSync, readFileSync, copyFileSync } from 'node:fs';

/**
 * Write data atomically: write to tmpPath, then rename over target.
 * @param {string} filePath — target file path
 * @param {string} data — stringified content to write
 */
export function atomicWriteSync(filePath, data) {
  const tmpPath = filePath + '.tmp';
  writeFileSync(tmpPath, data, 'utf-8');
  renameSync(tmpPath, filePath);
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
    console.warn(`[WARN] Corrupted JSON at ${filePath}: ${err.message}`);
    try {
      const backupPath = filePath + '.corrupted';
      copyFileSync(filePath, backupPath);
      console.warn(`[WARN] Backed up corrupted file to ${backupPath}`);
    } catch { /* best effort */ }
    return null;
  }
}
