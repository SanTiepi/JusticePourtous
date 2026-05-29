/**
 * Contrat de génération de lettre — verrouille le contrat de download.
 *
 * La route /api/case/:id/letter/:letter_id/download cherche le fichier dans
 * le output dir par SUFFIXE contenant le letter_id. Ce test garantit que :
 *  - letter_id est une string non vide
 *  - un fichier dont le nom CONTIENT letter_id est écrit sur disque
 *  - ce fichier fait > 1000 bytes (livrable réel, pas un stub)
 *
 * Force le mode TEMPLATE (pas d'ANTHROPIC_API_KEY) → déterministe, zéro réseau.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  generateLetterPDF,
  _setOutputDirForTests,
  _getOutputDir
} from '../src/services/letter-pdf-generator.mjs';

test('generateLetterPDF écrit un fichier contenant letter_id (contrat download)', async () => {
  // 1. Force le mode template
  const savedApiKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  // 2. Output dir isolé dans tmpdir
  const savedOutputDir = _getOutputDir();
  const outputDir = mkdtempSync(join(tmpdir(), 'jpt-letter-contract-'));
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  _setOutputDirForTests(outputDir);

  try {
    // 3. Génère la lettre
    const result = await generateLetterPDF({
      ficheId: 'consommation_livraison_retard',
      type: 'mise_en_demeure',
      userContext: { nom: 'Test', adresse: 'Rue Test 1, 1003 Lausanne' },
      lang: 'fr',
      format: 'auto'
    });

    // 4. Assertions sur le contrat
    const letterId = result.metadata.letter_id;
    assert.equal(typeof letterId, 'string', 'letter_id doit être une string');
    assert.ok(letterId.length > 0, 'letter_id ne doit pas être vide');

    // Un fichier dont le nom CONTIENT letter_id (suffix lookup de la route download)
    const files = readdirSync(outputDir);
    const match = files.find(f => f.includes(letterId));
    assert.ok(match, `un fichier contenant "${letterId}" doit exister (trouvés: ${files.join(', ')})`);

    // > 1000 bytes
    const size = statSync(join(outputDir, match)).size;
    assert.ok(size > 1000, `le fichier doit faire > 1000 bytes (réel: ${size})`);
  } finally {
    // 5. Nettoyage
    _setOutputDirForTests(savedOutputDir);
    rmSync(outputDir, { recursive: true, force: true });
    if (savedApiKey !== undefined) process.env.ANTHROPIC_API_KEY = savedApiKey;
  }
});
