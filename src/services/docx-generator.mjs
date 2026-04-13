/**
 * DOCX Generator — Génération de documents Word professionnels
 *
 * Format lettre suisse : SN 010 130 (norme typographique)
 * - Expéditeur en haut à gauche
 * - Destinataire à droite décalé
 * - Lieu, date
 * - Envoi en recommandé (gras)
 * - Objet (gras)
 * - Corps
 * - Salutations
 * - Signature
 * - Disclaimer en pied de page
 */

import {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, TabStopType, TabStopPosition,
  BorderStyle, PageNumber, NumberFormat,
  HeadingLevel, ShadingType
} from 'docx';

// ─── Design tokens ─────────────────────────────────────────────

const FONT = 'Arial';
const FONT_SIZE = 22; // half-points → 11pt
const FONT_SIZE_SMALL = 18; // 9pt
const FONT_SIZE_HEADER = 16; // 8pt
const COLOR_TEXT = '1B1B1B';
const COLOR_SECONDARY = '4A4A4A';
const COLOR_TERTIARY = '7A7A7A';
const COLOR_ACCENT = '8B2500';
const COLOR_PLACEHOLDER = 'D4A017'; // gold for placeholders
const LINE_SPACING = 276; // 1.15x line spacing

// ─── Placeholder detection ─────────────────────────────────────

const PLACEHOLDER_RE = /\[([^\]]+)\]/g;

/**
 * Parse a text line into TextRun segments, highlighting [placeholders]
 */
function parseLineWithPlaceholders(text, baseOpts = {}) {
  const runs = [];
  let lastIndex = 0;
  let match;

  PLACEHOLDER_RE.lastIndex = 0;
  while ((match = PLACEHOLDER_RE.exec(text)) !== null) {
    // Text before placeholder
    if (match.index > lastIndex) {
      runs.push(new TextRun({
        text: text.slice(lastIndex, match.index),
        font: FONT,
        size: FONT_SIZE,
        color: COLOR_TEXT,
        ...baseOpts,
      }));
    }
    // Placeholder itself — highlighted
    runs.push(new TextRun({
      text: match[0],
      font: FONT,
      size: FONT_SIZE,
      color: COLOR_ACCENT,
      bold: true,
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFF3E0' },
      ...baseOpts,
    }));
    lastIndex = PLACEHOLDER_RE.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({
      text: text.slice(lastIndex),
      font: FONT,
      size: FONT_SIZE,
      color: COLOR_TEXT,
      ...baseOpts,
    }));
  }

  if (runs.length === 0) {
    runs.push(new TextRun({
      text: text || '',
      font: FONT,
      size: FONT_SIZE,
      color: COLOR_TEXT,
      ...baseOpts,
    }));
  }

  return runs;
}

// ─── Document builder ──────────────────────────────────────────

/**
 * Generate a professional DOCX from a letter text.
 *
 * @param {string} letterText — full letter text (Swiss format from letter-generator)
 * @param {object} meta — optional metadata {type, ficheId, domaine}
 * @returns {Promise<Buffer>} DOCX file as Buffer
 */
export async function generateDocx(letterText, meta = {}) {
  // Parse the letter text into sections
  const lines = letterText.split('\n');
  const paragraphs = [];

  // Find the disclaimer separator
  const disclaimerIdx = lines.findIndex(l => l.trim() === '---');
  const bodyLines = disclaimerIdx >= 0 ? lines.slice(0, disclaimerIdx) : lines;
  const disclaimerLines = disclaimerIdx >= 0 ? lines.slice(disclaimerIdx + 1) : [];

  let inObjet = false;
  let inRecommande = false;

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i];
    const trimmed = line.trim();

    // Empty line → spacing paragraph
    if (!trimmed) {
      paragraphs.push(new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: '', font: FONT, size: FONT_SIZE })],
      }));
      continue;
    }

    // "Envoi en recommandé" line
    if (trimmed.toLowerCase().startsWith('envoi en recommand')) {
      paragraphs.push(new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({
          text: trimmed,
          font: FONT,
          size: FONT_SIZE,
          bold: true,
          underline: {},
        })],
      }));
      continue;
    }

    // "Objet :" line
    if (trimmed.startsWith('Objet')) {
      paragraphs.push(new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun({
          text: trimmed,
          font: FONT,
          size: FONT_SIZE,
          bold: true,
        })],
      }));
      continue;
    }

    // Location + date line (contains "le " + month)
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const isDateLine = months.some(m => trimmed.toLowerCase().includes(m));
    if (isDateLine && trimmed.includes('le ')) {
      paragraphs.push(new Paragraph({
        spacing: { before: 60, after: 200 },
        children: parseLineWithPlaceholders(trimmed),
      }));
      continue;
    }

    // "Madame, Monsieur," salutation
    if (trimmed.startsWith('Madame, Monsieur') || trimmed.startsWith('Dans l') || trimmed.startsWith('Je vous prie') || trimmed.startsWith('Veuillez')) {
      paragraphs.push(new Paragraph({
        spacing: { before: 200, after: 100 },
        children: parseLineWithPlaceholders(trimmed),
      }));
      continue;
    }

    // Default: body paragraph with placeholder highlighting
    paragraphs.push(new Paragraph({
      spacing: { after: 60, line: LINE_SPACING },
      children: parseLineWithPlaceholders(trimmed),
    }));
  }

  // Build document
  const doc = new Document({
    creator: 'JusticePourtous.ch',
    title: meta.type ? `Lettre — ${meta.type}` : 'Lettre juridique',
    description: 'Document généré par JusticePourtous.ch — information juridique générale',
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            size: FONT_SIZE,
            color: COLOR_TEXT,
          },
          paragraph: {
            spacing: { line: LINE_SPACING },
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134, // ~2cm
            bottom: 1134,
            left: 1418, // ~2.5cm
            right: 1134,
          },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({
              text: 'JusticePourtous.ch',
              font: FONT,
              size: FONT_SIZE_HEADER,
              color: COLOR_TERTIARY,
              italics: true,
            })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 200 },
              border: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'D1CEC8' },
              },
              children: [
                new TextRun({
                  text: disclaimerLines.join(' ').trim() ||
                    'AVERTISSEMENT : Ce document est généré automatiquement à titre de modèle. Il ne constitue pas un document juridique définitif. Faites-le relire par un professionnel avant envoi.',
                  font: FONT,
                  size: 14, // 7pt
                  color: COLOR_TERTIARY,
                  italics: true,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Page ',
                  font: FONT,
                  size: 14,
                  color: COLOR_TERTIARY,
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: FONT,
                  size: 14,
                  color: COLOR_TERTIARY,
                }),
              ],
            }),
          ],
        }),
      },
      children: paragraphs,
    }],
  });

  return await Packer.toBuffer(doc);
}

/**
 * Generate DOCX from structured letter parts (alternative to text parsing).
 */
export async function generateDocxFromParts({
  expediteur = {},
  destinataire = {},
  lieu,
  objet,
  corps,
  type,
  disclaimer,
}) {
  const dateStr = new Intl.DateTimeFormat('fr-CH', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(new Date());

  const senderName = expediteur.nom || '[Votre nom et prénom]';
  const senderAddr = expediteur.adresse || '[Votre adresse]\n[NPA Localité]';
  const destName = destinataire.nom || '[Nom du destinataire]';
  const destAddr = destinataire.adresse || '[Adresse du destinataire]\n[NPA Localité]';
  const locationStr = lieu || '[Localité]';

  const fullText = `${senderName}
${senderAddr}

${destName}
${destAddr}

${locationStr}, le ${dateStr}

Envoi en recommandé

Objet : ${objet || type || 'Courrier'}

Madame, Monsieur,

${corps || '[Corps de la lettre]'}

Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.

${senderName}

---
${disclaimer || 'AVERTISSEMENT : Ce document est généré automatiquement à titre de modèle. Faites-le relire par un professionnel avant envoi. JusticePourtous.ch'}`;

  return generateDocx(fullText, { type });
}
