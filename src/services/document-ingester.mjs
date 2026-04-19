/**
 * Document Ingester — Extraction structurée de faits depuis des PDFs
 *
 * Pipeline : PDF → texte → extraction LLM (Haiku) → JSON structuré
 *
 * Zero deps : utilise Claude CLI pour l'extraction (pas besoin de clé API).
 * Chaque document produit un objet structuré avec :
 *   - metadata (type, date, expediteur, destinataire)
 *   - faits extraits (dates, acteurs, actions, lieux, montants)
 *   - claims (affirmations avec source)
 *   - questions sans réponse
 *
 * Coût : ~$0.01 par document (Haiku) ou gratuit (CLI)
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, basename, extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createLogger } from './logger.mjs';

const log = createLogger('document-ingester');

// ============================================================
// PDF TEXT EXTRACTION (zero deps — binary regex)
// ============================================================

function extractTextFromPDF(buffer) {
  // Try to extract text streams from PDF binary
  const str = buffer.toString('latin1');
  const texts = [];

  // Method 1: Extract between BT...ET text blocks
  const btMatches = str.matchAll(/BT\s([\s\S]*?)ET/g);
  for (const m of btMatches) {
    const tjMatches = m[1].matchAll(/\(([^)]*)\)\s*Tj/g);
    for (const tj of tjMatches) texts.push(tj[1]);
    const tdMatches = m[1].matchAll(/\[(.*?)\]\s*TJ/g);
    for (const td of tdMatches) {
      const parts = td[1].matchAll(/\(([^)]*)\)/g);
      for (const p of parts) texts.push(p[1]);
    }
  }

  // Method 2: Extract from stream objects
  if (texts.length < 10) {
    const streamMatches = str.matchAll(/stream\r?\n([\s\S]*?)endstream/g);
    for (const sm of streamMatches) {
      const readable = sm[1].replace(/[^\x20-\x7E\xC0-\xFF\n\r]/g, ' ').trim();
      if (readable.length > 50) texts.push(readable);
    }
  }

  const result = texts.join(' ')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\s{3,}/g, ' ')
    .trim();

  return result;
}

// ============================================================
// DOCUMENT TYPE DETECTION
// ============================================================

const DOC_PATTERNS = [
  { type: 'arret_tribunal', patterns: ['tribunal cantonal', 'chambre des recours', 'tribunal fédéral', 'arrêt', 'considérant', 'par ces motifs'] },
  { type: 'ordonnance_classement', patterns: ['ordonnance de classement', 'classement', 'art. 319 cpp', 'ministère public'] },
  { type: 'rapport_autopsie', patterns: ['autopsie', 'curml', 'médecine légale', 'examen externe', 'examen interne', 'toxicolog'] },
  { type: 'rapport_investigation', patterns: ['rapport d\'investigation', 'brigade criminelle', 'enquête de police', 'rapport de police'] },
  { type: 'pv_audition', patterns: ['procès-verbal', 'audition', 'personne appelée', 'prévenu', 'déclar'] },
  { type: 'pv_operations', patterns: ['procès-verbal des opérations', 'pv des opérations', 'journal des opérations'] },
  { type: 'recours', patterns: ['recours', 'recourant', 'intimé', 'conclusions', 'il est conclu'] },
  { type: 'correspondance_famille', patterns: ['cher monsieur', 'chère madame', 'nous nous permettons', 'courrier recommandé'] },
  { type: 'correspondance_autorite', patterns: ['ministère public', 'procureur', 'nous accusons réception', 'je vous informe'] },
  { type: 'rapport_medical', patterns: ['curml', 'rapport préliminaire', 'centre universitaire', 'médecine légale'] },
  { type: 'plainte', patterns: ['plainte pénale', 'dépôt de plainte', 'porte plainte'] },
  { type: 'procuration', patterns: ['procuration', 'par la présente', 'donne procuration', 'mandataire'] },
];

function detectDocumentType(text, filename) {
  const lower = text.toLowerCase();
  const fLower = filename.toLowerCase();

  let bestType = 'inconnu';
  let bestScore = 0;

  for (const { type, patterns } of DOC_PATTERNS) {
    const score = patterns.filter(p => lower.includes(p)).length;
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  // Filename hints
  if (fLower.includes('autopsie')) bestType = 'rapport_autopsie';
  if (fLower.includes('ordonnance') && fLower.includes('classement')) bestType = 'ordonnance_classement';
  if (fLower.includes('arrêt') || fLower.includes('arret')) bestType = 'arret_tribunal';
  if (fLower.includes('pv') && fLower.includes('audition')) bestType = 'pv_audition';
  if (fLower.includes('recours')) bestType = 'recours';
  if (fLower.includes('investigation')) bestType = 'rapport_investigation';
  if (fLower.includes('plainte')) bestType = 'plainte';
  if (fLower.includes('procuration')) bestType = 'procuration';

  return bestType;
}

// ============================================================
// METADATA EXTRACTION (deterministic — no LLM)
// ============================================================

function extractMetadata(text, filename) {
  const meta = {
    dates: [],
    actors: [],
    legal_refs: [],
    amounts: [],
  };

  // Dates (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD)
  const datePatterns = text.matchAll(/(\d{1,2}[.\/]\d{1,2}[.\/]\d{4}|\d{4}-\d{2}-\d{2})/g);
  for (const m of datePatterns) meta.dates.push(m[1]);

  // Date from filename (YYMMDD or YYYYMMDD)
  const fnDate = filename.match(/^(\d{6})_/);
  if (fnDate) {
    const yy = fnDate[1].slice(0, 2);
    const mm = fnDate[1].slice(2, 4);
    const dd = fnDate[1].slice(4, 6);
    meta.dates.unshift(`${dd}.${mm}.20${yy}`);
  }

  // Actors (capitalized names like FRAGNIERE, PAPA, WORROD)
  const actorMatches = text.matchAll(/\b([A-ZÀÂÉÈÊËÏÔÙÛÜ]{3,})\b/g);
  const actors = new Set();
  for (const m of actorMatches) {
    const name = m[1];
    if (!['CURML', 'CHUV', 'LANDI', 'GRINDR', 'CPP', 'CEDH', 'LAVI', 'JSON', 'NULL', 'PAGE'].includes(name)) {
      actors.add(name);
    }
  }
  meta.actors = [...actors].slice(0, 20);

  // Legal references (CO 259a, CP 123, CPP 319, etc.)
  const legalMatches = text.matchAll(/\b(CO|CP|CC|CPP|LP|LTF|CEDH|Cst|LAVI|LVCPP|LOJV)\s*\.?\s*(\d+\w*(?:\s*(?:al|ch|let|ss)\.\s*\d*\w*)?)/gi);
  const refs = new Set();
  for (const m of legalMatches) refs.add(`${m[1].toUpperCase()} ${m[2]}`);
  meta.legal_refs = [...refs];

  // Amounts (CHF, francs)
  const amountMatches = text.matchAll(/(?:CHF|Fr\.?)\s*([\d',.\s]+)/gi);
  for (const m of amountMatches) meta.amounts.push(m[1].trim());

  return meta;
}

// ============================================================
// LLM EXTRACTION (structured facts from document text)
// ============================================================

const EXTRACTION_PROMPT = `Tu extrais les faits d'un document juridique suisse. Sois EXHAUSTIF.

REPONDS EN JSON STRICT:
{
  "resume": "2-3 phrases resumant le document",
  "type_document": "arret|ordonnance|rapport|pv|correspondance|autre",
  "date_document": "JJ.MM.AAAA ou null",
  "expediteur": "nom ou null",
  "destinataire": "nom ou null",
  "faits": [
    {"date": "JJ.MM.AAAA", "heure": "HH:MM ou null", "acteur": "nom", "action": "description", "lieu": "lieu ou null"}
  ],
  "claims": [
    {"texte": "affirmation factuelle", "source": "qui dit ca", "certitude": "etabli|conteste|inconnu"}
  ],
  "contradictions": [
    {"element": "ce qui pose probleme", "version_a": "version 1", "version_b": "version 2"}
  ],
  "questions_sans_reponse": ["question 1", "question 2"],
  "mesures_demandees": ["mesure 1"],
  "mesures_refusees": ["mesure 1"],
  "base_legale": ["CPP 319", "CEDH 2"]
}`;

function extractFactsWithLLM(text, filename) {
  const truncated = text.slice(0, 12000); // Haiku context limit safety
  const prompt = `${EXTRACTION_PROMPT}\n\n---\nFICHIER: ${filename}\n\nCONTENU:\n${truncated}`;

  try {
    const result = execSync('claude --print --model haiku', {
      input: prompt,
      timeout: 60000,
      encoding: 'utf-8',
      maxBuffer: 2 * 1024 * 1024
    });

    return parseJSON(result.trim());
  } catch (e) {
    // Fallback: try without model flag
    try {
      const result = execSync('claude --print', {
        input: prompt,
        timeout: 60000,
        encoding: 'utf-8',
        maxBuffer: 2 * 1024 * 1024
      });
      return parseJSON(result.trim());
    } catch (e2) {
      return null;
    }
  }
}

function parseJSON(text) {
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ============================================================
// MAIN INGESTION PIPELINE
// ============================================================

/**
 * Ingest a single document
 * @param {string} filePath - Path to PDF or text file
 * @returns {object} Structured document object
 */
export function ingestDocument(filePath) {
  const filename = basename(filePath);
  const ext = extname(filePath).toLowerCase();

  let text = '';
  if (ext === '.pdf') {
    const buffer = readFileSync(filePath);
    text = extractTextFromPDF(buffer);
  } else if (['.txt', '.md', '.docx'].includes(ext)) {
    text = readFileSync(filePath, 'utf-8');
  } else {
    return { id: randomUUID(), filename, status: 'skipped', reason: `unsupported format: ${ext}` };
  }

  if (text.length < 20) {
    return { id: randomUUID(), filename, status: 'empty', reason: 'no extractable text (scanned PDF?)' };
  }

  const docType = detectDocumentType(text, filename);
  const metadata = extractMetadata(text, filename);

  return {
    id: randomUUID(),
    filename,
    status: 'extracted',
    type: docType,
    text_length: text.length,
    text_preview: text.slice(0, 500),
    text_full: text,
    metadata,
  };
}

/**
 * Ingest all documents from a directory
 * @param {string} dirPath - Path to directory containing documents
 * @returns {object} Dossier with all ingested documents
 */
export function ingestDossier(dirPath) {
  if (!existsSync(dirPath)) {
    return { error: `Directory not found: ${dirPath}` };
  }

  const files = [];
  function scanDir(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scanDir(join(dir, entry.name));
      } else if (['.pdf', '.txt', '.md'].includes(extname(entry.name).toLowerCase())) {
        files.push(join(dir, entry.name));
      }
    }
  }
  scanDir(dirPath);

  const documents = [];
  for (const f of files) {
    const doc = ingestDocument(f);
    documents.push(doc);
  }

  return {
    dossier_id: randomUUID(),
    source_dir: dirPath,
    ingested_at: new Date().toISOString(),
    total_files: files.length,
    extracted: documents.filter(d => d.status === 'extracted').length,
    skipped: documents.filter(d => d.status === 'skipped').length,
    empty: documents.filter(d => d.status === 'empty').length,
    documents,
  };
}

/**
 * Enrich documents with LLM extraction (expensive step — run selectively)
 * @param {object} dossier - Output of ingestDossier
 * @param {object} options - { maxDocs, priorityTypes }
 * @returns {object} Enriched dossier
 */
export function enrichWithLLM(dossier, options = {}) {
  const { maxDocs = 20, priorityTypes = ['arret_tribunal', 'ordonnance_classement', 'rapport_autopsie', 'rapport_investigation', 'pv_audition', 'recours'] } = options;

  // Sort by priority type first, then by text length (longer = more content)
  const toEnrich = dossier.documents
    .filter(d => d.status === 'extracted')
    .sort((a, b) => {
      const aPrio = priorityTypes.indexOf(a.type);
      const bPrio = priorityTypes.indexOf(b.type);
      if (aPrio !== -1 && bPrio === -1) return -1;
      if (aPrio === -1 && bPrio !== -1) return 1;
      if (aPrio !== -1 && bPrio !== -1) return aPrio - bPrio;
      return b.text_length - a.text_length;
    })
    .slice(0, maxDocs);

  let enriched = 0;
  for (const doc of toEnrich) {
    log.info('enriching_doc', { filename: doc.filename, type: doc.type });
    const facts = extractFactsWithLLM(doc.text_full, doc.filename);
    if (facts) {
      doc.llm_extraction = facts;
      doc.status = 'enriched';
      enriched++;
    }
  }

  dossier.enriched = enriched;
  return dossier;
}

export default { ingestDocument, ingestDossier, enrichWithLLM };
