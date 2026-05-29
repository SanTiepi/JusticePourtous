/**
 * Tests unitaires — atomic-write.mjs
 *
 * Vérifie l'intégrité des données persistées :
 *   - atomicWriteSync : écriture atomique (pas de fichier tronqué en cas de crash)
 *   - safeLoadJSON    : lecture sécurisée avec backup .corrupted si fichier corrompu
 *
 * Zéro LLM, zéro réseau, zéro dépendance externe.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { atomicWriteSync, safeLoadJSON } from '../src/services/atomic-write.mjs';

// ─── atomicWriteSync ─────────────────────────────────────────────────────────

describe('atomicWriteSync — écriture atomique', () => {
  it('crée le fichier cible avec le bon contenu', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jpt-atomic-'));
    try {
      const filePath = join(dir, 'data.json');
      atomicWriteSync(filePath, '{"ok":true}');
      assert.ok(existsSync(filePath), 'le fichier doit exister');
      assert.equal(readFileSync(filePath, 'utf-8'), '{"ok":true}');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('aucun fichier .tmp résiduel après écriture réussie', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jpt-atomic-'));
    try {
      const filePath = join(dir, 'data.json');
      atomicWriteSync(filePath, 'hello');
      assert.equal(existsSync(filePath + '.tmp'), false, 'pas de .tmp résiduel');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('écrase un fichier existant — ancien contenu remplacé', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jpt-atomic-'));
    try {
      const filePath = join(dir, 'data.json');
      writeFileSync(filePath, '{"old":1}', 'utf-8');
      atomicWriteSync(filePath, '{"new":2}');
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
      assert.equal(parsed.new, 2);
      assert.equal(parsed.old, undefined);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('supporte les chaînes vides (fichier vide créé)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jpt-atomic-'));
    try {
      const filePath = join(dir, 'empty.txt');
      atomicWriteSync(filePath, '');
      assert.ok(existsSync(filePath));
      assert.equal(readFileSync(filePath, 'utf-8'), '');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ─── safeLoadJSON ────────────────────────────────────────────────────────────

describe('safeLoadJSON — lecture sécurisée', () => {
  it('retourne null si le fichier n\'existe pas', () => {
    const result = safeLoadJSON('/nonexistent/__jpt_test_missing_42__.json');
    assert.equal(result, null);
  });

  it('retourne l\'objet parsé pour un JSON valide', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jpt-safe-'));
    try {
      const filePath = join(dir, 'data.json');
      writeFileSync(filePath, '{"a":1,"b":["x","y"]}', 'utf-8');
      const result = safeLoadJSON(filePath);
      assert.deepEqual(result, { a: 1, b: ['x', 'y'] });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('retourne null et crée .corrupted pour JSON invalide (texte)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jpt-safe-'));
    try {
      const filePath = join(dir, 'data.json');
      writeFileSync(filePath, '{ INVALID JSON !!!', 'utf-8');
      const result = safeLoadJSON(filePath);
      assert.equal(result, null, 'doit retourner null');
      assert.ok(existsSync(filePath + '.corrupted'), '.corrupted backup doit être créé');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('retourne null et crée .corrupted pour contenu binaire non-UTF8', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jpt-safe-'));
    try {
      const filePath = join(dir, 'data.json');
      // Séquence UTF-8 invalide pour provoquer un JSON.parse fail
      writeFileSync(filePath, '\x00\x01\x02\xff\xfe');
      const result = safeLoadJSON(filePath);
      assert.equal(result, null);
      assert.ok(existsSync(filePath + '.corrupted'));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('retourne null pour fichier vide (pas de JSON valide)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jpt-safe-'));
    try {
      const filePath = join(dir, 'empty.json');
      writeFileSync(filePath, '', 'utf-8');
      const result = safeLoadJSON(filePath);
      assert.equal(result, null);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('retourne null pour JSON syntaxiquement valide mais valeur null', () => {
    // JSON.parse('null') === null — indiscernable de "fichier absent"
    // Comportement documenté (pas un bug) : le case-store ne stocke pas null.
    const dir = mkdtempSync(join(tmpdir(), 'jpt-safe-'));
    try {
      const filePath = join(dir, 'null.json');
      writeFileSync(filePath, 'null', 'utf-8');
      const result = safeLoadJSON(filePath);
      assert.equal(result, null);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('invariant round-trip : données case-store lisibles après atomicWriteSync', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jpt-roundtrip-'));
    try {
      const filePath = join(dir, 'cases.json');
      const original = {
        version: 1,
        cases: { c1: { id: 'c1', texte: 'Moisissure depuis 6 mois' } }
      };
      atomicWriteSync(filePath, JSON.stringify(original));
      const reloaded = safeLoadJSON(filePath);
      assert.deepEqual(reloaded, original, 'round-trip doit être exact');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
