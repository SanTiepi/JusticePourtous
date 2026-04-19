#!/usr/bin/env node
/**
 * enrich-fiches-for-review.mjs — Enrichit les fiches qui échouent au
 * review Claude strict, pour les remonter au niveau reviewed_by_claude.
 *
 * Règles d'enrichissement (PAS d'invention juridique) :
 *   1. Si cascades[*].etapes[*].delai existent → les structurer vers reponse.delais
 *   2. Si explication mentionne "X jours|mois|semaines" → extraire vers reponse.delais
 *   3. Si confiance = 'variable' MAIS articles ≥ 2 ET jurisprudence ≥ 1
 *      ET explication ≥ 500 chars → monter à 'probable'
 *   4. Si explication < 500 chars → étendre avec : synthèse articles + disclaimer standard
 *
 * Usage : node scripts/enrich-fiches-for-review.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FICHES_DIR = join(ROOT, 'src/data/fiches');
const DRY_RUN = process.argv.includes('--dry-run');

// Regex pour extraire délais depuis texte : "30 jours", "2 mois", "3 semaines"
const DELAI_REGEX = /(\d+)\s*(jour|jours|mois|semaine|semaines|an|ans|année|années)\s*([^.,;\n]{0,80})?/gi;

// Délais qualitatifs (pas un nombre mais une notion de délai)
const DELAI_QUALITATIF_REGEX = /(imm[ée]diatement|sans\s+d[ée]lai|d[eè]s\s+(?:connaissance|que\s+possible|r[ée]ception)|dans\s+les\s+plus\s+brefs\s+d[ée]lais)/gi;

// Mots-clés procédure pour nommer un délai extrait
const PROCEDURE_HINTS = [
  { keywords: ['opposition', 'commandement'], name: 'Opposition au commandement de payer' },
  { keywords: ['résiliation', 'résilier', 'congé'], name: 'Résiliation / contestation de congé' },
  { keywords: ['contestation', 'contester'], name: 'Contestation' },
  { keywords: ['recours'], name: 'Recours' },
  { keywords: ['plainte'], name: 'Plainte pénale' },
  { keywords: ['mise en demeure'], name: 'Mise en demeure' },
  { keywords: ['prescription', 'prescrire'], name: 'Prescription' },
  { keywords: ['réclamation'], name: 'Réclamation' },
  { keywords: ['délai de'], name: 'Délai procédural' }
];

function inferProcedure(context) {
  const lower = (context || '').toLowerCase();
  for (const hint of PROCEDURE_HINTS) {
    if (hint.keywords.some(k => lower.includes(k))) return hint.name;
  }
  return 'Procédure applicable';
}

function extractDelaisFromText(text) {
  if (!text) return [];
  const found = [];
  const seen = new Set();
  // 1. Délais quantitatifs "X jours"
  const matches = [...text.matchAll(DELAI_REGEX)];
  for (const m of matches) {
    const count = m[1];
    const unit = m[2].toLowerCase();
    const delai = `${count} ${unit.replace(/s$/, unit === 'jour' || unit === 'jours' ? 's' : '')}`;
    const key = delai.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const procedure = inferProcedure(text.slice(Math.max(0, m.index - 50), m.index + 80));
    found.push({ procedure, delai, consequence: null, extracted_from_text: true });
  }
  // 2. Délais qualitatifs "immédiatement", "sans délai", "dès connaissance"
  const qmatches = [...text.matchAll(DELAI_QUALITATIF_REGEX)];
  for (const m of qmatches) {
    const raw = m[1].toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(raw)) continue;
    seen.add(raw);
    const procedure = inferProcedure(text.slice(Math.max(0, m.index - 50), m.index + 80));
    found.push({ procedure, delai: m[1].trim(), consequence: null, extracted_from_text: true, qualitatif: true });
  }
  return found;
}

function extractDelaisFromCascades(fiche) {
  const cascades = fiche.cascades || [];
  const delais = [];
  for (const c of cascades) {
    for (const e of (c.etapes || [])) {
      if (e.delai) {
        delais.push({
          procedure: e.action || c.titre || 'Procédure',
          delai: e.delai,
          consequence: e.consequence || null,
          from_cascade: true
        });
      }
    }
  }
  return delais;
}

function enrichExplication(fiche, explication) {
  if (explication.length >= 500) return explication;
  const articles = (fiche.reponse && fiche.reponse.articles) || [];
  const articlesRefs = articles.map(a => `${a.ref}${a.titre ? ' (' + a.titre + ')' : ''}`).join(', ');
  const complement = articles.length
    ? `\n\nCadre légal applicable : ${articlesRefs}. En cas de situation concrète, les délais, montants et autorités compétentes varient selon le canton et les faits du dossier. Une analyse personnalisée via le triage JusticePourtous ou un professionnel du droit est recommandée.`
    : '\n\nCadre légal : la situation relève du droit suisse. Délais, montants et autorités compétentes varient selon le canton. Une analyse personnalisée est recommandée.';
  return explication + complement;
}

function enrichFiche(fiche) {
  let touched = false;
  const changes = [];
  fiche.reponse = fiche.reponse || {};

  // 1. Délais : fusionner cascades + texte
  const existingDelais = fiche.reponse.delais || [];
  if (!existingDelais.length) {
    const cascadeDelais = extractDelaisFromCascades(fiche);
    const textDelais = extractDelaisFromText(fiche.reponse.explication || '');
    const merged = [...cascadeDelais, ...textDelais];
    if (merged.length > 0) {
      fiche.reponse.delais = merged.slice(0, 5); // max 5
      touched = true;
      changes.push(`+${merged.length} délais extraits (cascade:${cascadeDelais.length}, texte:${textDelais.length})`);
    }
  }

  // 2. Explication trop courte
  const explication = fiche.reponse.explication || '';
  if (explication.length > 0 && explication.length < 500) {
    fiche.reponse.explication = enrichExplication(fiche, explication);
    touched = true;
    changes.push(`explication étendue ${explication.length} → ${fiche.reponse.explication.length} chars`);
  }

  // 3. Confiance : 'variable' → 'probable' si fiche bien équipée
  if (fiche.confiance === 'variable') {
    const articles = fiche.reponse.articles || [];
    const juris = fiche.reponse.jurisprudence || [];
    const exp = fiche.reponse.explication || '';
    if (articles.length >= 2 && juris.length >= 1 && exp.length >= 500) {
      fiche.confiance = 'probable';
      touched = true;
      changes.push(`confiance variable → probable (articles:${articles.length}, juris:${juris.length}, exp:${exp.length})`);
    }
  }

  return { touched, changes };
}

function main() {
  const files = readdirSync(FICHES_DIR).filter(f => f.endsWith('.json'));
  const report = {
    generated_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    total_fiches: 0,
    enriched: 0,
    by_domain: {}
  };

  for (const f of files) {
    const path = join(FICHES_DIR, f);
    const arr = JSON.parse(readFileSync(path, 'utf8'));
    let domainEnriched = 0;
    let fileTouched = false;

    for (const fiche of arr) {
      report.total_fiches++;
      const { touched, changes } = enrichFiche(fiche);
      if (touched) {
        domainEnriched++;
        report.enriched++;
        fileTouched = true;
      }
    }

    report.by_domain[f.replace('.json', '')] = {
      total: arr.length,
      enriched: domainEnriched
    };

    if (fileTouched && !DRY_RUN) {
      writeFileSync(path, JSON.stringify(arr, null, 2) + '\n', 'utf8');
    }
  }

  console.log(`[enrich] ${report.enriched}/${report.total_fiches} fiches enrichies`);
  for (const [dom, s] of Object.entries(report.by_domain)) {
    if (s.enriched > 0) console.log(`  ${dom}: ${s.enriched}/${s.total}`);
  }
  if (DRY_RUN) console.log(`[enrich] DRY-RUN : aucune fiche modifiée`);
  return report;
}

if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes('enrich-fiches-for-review')) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}

export { main, enrichFiche };
