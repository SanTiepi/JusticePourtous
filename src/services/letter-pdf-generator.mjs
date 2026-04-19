/**
 * Letter PDF Generator — Cortex Phase 3
 *
 * Génère une lettre juridique dans un format "livrable" pour le citoyen :
 *  - DOCX (via `docx` déjà dans package.json et docx-generator.mjs) — PRIORITAIRE
 *  - PDF minimal (PDF 1.4 natif, zero-deps, basé texte)
 *  - TXT structuré (fallback universel)
 *
 * Enrobe letter-generator.mjs (corps rédigé par Opus) en document téléchargeable.
 *
 * Sortie : écrit le fichier dans src/data/meta/generated-letters/{letter_id}.{ext}
 * et retourne { pdf_path, pdf_url, metadata }.
 *
 * Les fichiers générés sont gitignorés.
 */

import { randomBytes } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { generateLetter } from './letter-generator.mjs';
import { generateDocx } from './docx-generator.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = join(__dirname, '..', 'data', 'meta', 'generated-letters');

let OUTPUT_DIR = process.env.LETTERS_OUTPUT_DIR || DEFAULT_OUTPUT_DIR;

/** Reset / override output dir — tests only. */
export function _setOutputDirForTests(dir) {
  OUTPUT_DIR = dir;
}
export function _getOutputDir() {
  return OUTPUT_DIR;
}

function ensureDir() {
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
}

function newLetterId() {
  return randomBytes(8).toString('hex');
}

// ─── PDF minimal (fallback si docx non dispo) ──────────────────

/**
 * Escape a string for use as a PDF literal (inside parentheses).
 * We also convert non-ASCII chars to their octal escapes so the file stays
 * 7-bit safe regardless of the PDF viewer's encoding assumptions.
 */
function pdfEscapeText(s) {
  const buf = Buffer.from(s || '', 'utf-8');
  let out = '';
  for (const b of buf) {
    if (b === 0x28) out += '\\(';        // (
    else if (b === 0x29) out += '\\)';   // )
    else if (b === 0x5c) out += '\\\\';  // \
    else if (b === 0x0a) out += '\\n';   // newline (shouldn't happen inside a single line)
    else if (b === 0x0d) out += '\\r';
    else if (b >= 0x20 && b < 0x7f) out += String.fromCharCode(b);
    else out += '\\' + b.toString(8).padStart(3, '0');
  }
  return out;
}

/**
 * Construit un PDF 1.4 minimal multi-pages contenant du texte courant.
 * Utilise Helvetica (standard PDF, pas d'embedding). Les caractères accentués
 * sont encodés en WinAnsi via octal escapes — lisibilité "bonne" pour fr.
 *
 * Ce n'est PAS un PDF typographique — c'est un livrable de fallback. Préfère
 * DOCX quand dispo.
 */
function buildMinimalPDF(text) {
  // Lignes par page, chars par ligne — très approximatif, suffisant pour lettre.
  const LINES_PER_PAGE = 48;
  const MAX_CHARS_PER_LINE = 90;
  const FONT_SIZE = 11;
  const LINE_HEIGHT = 14;

  // Wrap lines
  const rawLines = (text || '').split(/\r?\n/);
  const wrapped = [];
  for (const line of rawLines) {
    if (line.length <= MAX_CHARS_PER_LINE) { wrapped.push(line); continue; }
    // soft wrap on word boundary
    let rest = line;
    while (rest.length > MAX_CHARS_PER_LINE) {
      let cut = rest.lastIndexOf(' ', MAX_CHARS_PER_LINE);
      if (cut < 40) cut = MAX_CHARS_PER_LINE;
      wrapped.push(rest.slice(0, cut));
      rest = rest.slice(cut).trimStart();
    }
    if (rest.length) wrapped.push(rest);
  }

  // Chunk into pages
  const pages = [];
  for (let i = 0; i < wrapped.length; i += LINES_PER_PAGE) {
    pages.push(wrapped.slice(i, i + LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push(['']);

  // Build content streams for each page
  const pageContents = pages.map(pageLines => {
    const yStart = 780;
    let content = 'BT\n/F1 ' + FONT_SIZE + ' Tf\n' + `50 ${yStart} Td\n`;
    for (let i = 0; i < pageLines.length; i++) {
      const escaped = pdfEscapeText(pageLines[i]);
      if (i === 0) {
        content += `(${escaped}) Tj\n`;
      } else {
        content += `0 -${LINE_HEIGHT} Td\n(${escaped}) Tj\n`;
      }
    }
    content += 'ET\n';
    return content;
  });

  // Objects: 1 Catalog, 2 Pages, 3 Font, 4..N = Page + Content per page
  // object numbering:
  //  1 = Catalog
  //  2 = Pages
  //  3 = Font (Helvetica)
  //  For each page i: Page obj = 4 + 2*i, Content obj = 5 + 2*i
  const pageObjNumbers = pages.map((_, i) => 4 + 2 * i);
  const contentObjNumbers = pages.map((_, i) => 5 + 2 * i);

  const objects = [];
  // 1 Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  // 2 Pages
  const kidsRef = pageObjNumbers.map(n => `${n} 0 R`).join(' ');
  objects.push(`2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${kidsRef}] >>\nendobj\n`);
  // 3 Font
  objects.push(`3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`);

  // Pages + Contents
  for (let i = 0; i < pages.length; i++) {
    const pageNum = pageObjNumbers[i];
    const contentNum = contentObjNumbers[i];
    objects.push(`${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentNum} 0 R >>\nendobj\n`);
    const stream = pageContents[i];
    const streamBuf = Buffer.from(stream, 'utf-8');
    objects.push(`${contentNum} 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n${stream}endstream\nendobj\n`);
  }

  // Assemble with byte offsets for xref
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let bodyBytes = Buffer.from(header, 'binary');
  const offsets = [];
  for (const obj of objects) {
    offsets.push(bodyBytes.length);
    bodyBytes = Buffer.concat([bodyBytes, Buffer.from(obj, 'utf-8')]);
  }

  const xrefStart = bodyBytes.length;
  const nObjects = objects.length;
  let xref = `xref\n0 ${nObjects + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  const trailer = `trailer\n<< /Size ${nObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  const tail = Buffer.from(xref + trailer, 'utf-8');

  return Buffer.concat([bodyBytes, tail]);
}

// ─── Entry point ───────────────────────────────────────────────

/**
 * Génère une lettre + l'emballe en document téléchargeable.
 *
 * @param {object} params
 * @param {string} params.ficheId
 * @param {object} params.userContext
 * @param {string} params.type — mise_en_demeure | contestation | opposition | resiliation | plainte
 * @param {string} [params.lang='fr']
 * @param {string} [params.format='auto'] — 'docx' | 'pdf' | 'txt' | 'auto'
 * @returns {Promise<{ pdf_path, pdf_url, metadata }>}
 */
export async function generateLetterPDF({ ficheId, userContext, type, lang = 'fr', format = 'auto' }) {
  if (!ficheId) throw new Error('ficheId requis');
  if (!type) throw new Error('type requis');

  ensureDir();

  // 1. Rédige le corps via letter-generator (utilise Opus si clé API sinon template)
  const letterResult = await generateLetter({ ficheId, userContext, type });
  const letterText = letterResult.lettre;

  const generated_at = new Date().toISOString();
  const letter_id = newLetterId();

  // 2. Choix du format
  let chosenFormat = format;
  if (chosenFormat === 'auto') {
    // Priorité : docx si lib dispo → pdf minimal → txt
    try {
      await import('docx');
      chosenFormat = 'docx';
    } catch {
      chosenFormat = 'pdf';
    }
  }

  let buffer;
  let ext;
  let contentType;

  try {
    if (chosenFormat === 'docx') {
      buffer = await generateDocx(letterText, { type, ficheId, domaine: userContext?.domaine });
      ext = 'docx';
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (chosenFormat === 'pdf') {
      buffer = buildMinimalPDF(letterText);
      ext = 'pdf';
      contentType = 'application/pdf';
    } else {
      buffer = Buffer.from(letterText, 'utf-8');
      ext = 'txt';
      contentType = 'text/plain; charset=utf-8';
    }
  } catch (err) {
    // Fallback to TXT if docx/pdf generation fails unexpectedly
    buffer = Buffer.from(letterText, 'utf-8');
    ext = 'txt';
    contentType = 'text/plain; charset=utf-8';
    chosenFormat = 'txt';
  }

  // 3. Write file
  const filename = `${ficheId}_${type}_${letter_id}.${ext}`;
  const filePath = join(OUTPUT_DIR, filename);
  writeFileSync(filePath, buffer);

  return {
    pdf_path: filePath,
    pdf_url: `/api/letters/download/${filename}`,
    metadata: {
      generated_at,
      letter_id,
      fiche_id: ficheId,
      type,
      lang,
      format: chosenFormat,
      filename,
      content_type: contentType,
      size_bytes: buffer.length,
      mode: letterResult.mode || 'template',
      disclaimer: letterResult.disclaimer
    }
  };
}

// Exports pour tests/debug
export { buildMinimalPDF };
