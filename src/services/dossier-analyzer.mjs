/**
 * Dossier Analyzer — Pipeline complet d'analyse de dossier citoyen
 *
 * Ce qui le rend meilleur qu'un prompt LLM brut :
 *   1. Ingestion parallèle (N docs en même temps, pas 1 par 1)
 *   2. Croisement déterministe (code trouve les contradictions)
 *   3. Checklist procédurale (normative compiler vérifie les obligations)
 *   4. Traçabilité totale (chaque claim → document + page)
 *   5. Coût maîtrisé (Haiku pour extraction, Sonnet pour synthèse)
 *   6. Reproductible (même dossier → même analyse)
 *
 * Pipeline :
 *   [Upload] → [Ingérer] → [Croiser] → [Checklist] → [Rapport]
 */

import { ingestDossier, enrichWithLLM } from './document-ingester.mjs';
import { buildTimeline, buildActorGraph, detectContradictions, detectGaps } from './contradiction-detector.mjs';
import { checkInvestigation, extractInvestigationFacts } from './investigation-checklist.mjs';
import { analyzeDossier as analyzeArguments } from './argumentation-engine.mjs';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLogger } from './logger.mjs';

const log = createLogger('dossier-analyzer');

// ============================================================
// MAIN PIPELINE
// ============================================================

/**
 * Analyze a complete dossier
 * @param {string} dirPath - Path to directory containing documents
 * @param {object} options - { enrichWithLLM: true, maxDocs: 20, outputDir: null }
 * @returns {object} Complete analysis
 */
export async function analyzeDossier(dirPath, options = {}) {
  const startTime = Date.now();
  const {
    enrich = true,
    maxDocs = 20,
    outputDir = null,
    generateReport = true,
  } = options;

  log.info('analyze_start', { dirPath });

  // ── ÉTAPE 1: INGÉRER ──────────────────────────────────────
  const dossier = ingestDossier(dirPath);
  log.info('step1_ingest', {
    total_files: dossier.total_files,
    extracted: dossier.extracted,
    empty: dossier.empty,
    skipped: dossier.skipped,
  });

  // Types de documents détectés
  const typeCounts = {};
  for (const doc of dossier.documents.filter(d => d.status === 'extracted')) {
    typeCounts[doc.type] = (typeCounts[doc.type] || 0) + 1;
  }
  log.info('step1_types', { typeCounts });

  // ── ÉTAPE 2: ENRICHIR (LLM) ───────────────────────────────
  if (enrich) {
    log.info('step2_enrich_start', { maxDocs });
    enrichWithLLM(dossier, { maxDocs });
    log.info('step2_enrich_done', { enriched: dossier.enriched });
  } else {
    log.info('step2_enrich_skipped', {});
  }

  // ── ÉTAPE 3: CROISER ──────────────────────────────────────
  const enrichedDocs = dossier.documents.filter(d => d.llm_extraction);
  const crossAnalysis = detectContradictions(enrichedDocs);
  const gaps = detectGaps(enrichedDocs);
  const actorGraph = buildActorGraph(enrichedDocs);

  log.info('step3_cross_analysis', {
    contradictions: crossAnalysis.contradictions.length,
    unresolved_questions: crossAnalysis.unresolved_questions.length,
    timeline_events: crossAnalysis.timeline.length,
    gaps_refused: gaps.total_refused,
    gaps_requested: gaps.total_requested,
    actors: Object.keys(actorGraph).length,
  });

  // ── ÉTAPE 4: CHECKLIST ────────────────────────────────────
  const investigationFacts = extractInvestigationFacts(dossier);
  const checklist = checkInvestigation(investigationFacts);

  log.info('step4_checklist', {
    score: checklist.score,
    status: checklist.status,
    passed: checklist.passed,
    total_checks: checklist.total_checks,
    critical_failures: checklist.critical_failures,
    high_failures: checklist.high_failures,
  });

  if (checklist.summary.critique.length > 0) {
    log.warn('step4_critical_failures', {
      failures: checklist.summary.critique.map(f => ({ label: f.label, detail: f.detail })),
    });
  }

  // ── ÉTAPE 5: RAPPORT ──────────────────────────────────────
  let report = null;
  if (generateReport) {
    report = generateAnalysisReport(dossier, crossAnalysis, gaps, checklist, actorGraph);
    log.info('step5_report_generated', { length: report.length });
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  log.info('analyze_complete', { duration_s: +duration });

  const result = {
    dossier_id: dossier.dossier_id,
    source_dir: dirPath,
    analyzed_at: new Date().toISOString(),
    duration_seconds: +duration,
    documents: {
      total: dossier.total_files,
      extracted: dossier.extracted,
      enriched: dossier.enriched || 0,
    },
    timeline: crossAnalysis.timeline,
    contradictions: crossAnalysis.contradictions,
    unresolved_questions: crossAnalysis.unresolved_questions,
    gaps,
    actors: actorGraph,
    investigation_checklist: checklist,
    report,
  };

  // Save to disk if outputDir provided
  if (outputDir) {
    const outPath = join(outputDir, `analyse_${dossier.dossier_id.slice(0, 8)}.json`);
    writeFileSync(outPath, JSON.stringify(result, null, 2));
    log.info('results_saved', { outPath });

    if (report) {
      const reportPath = join(outputDir, `rapport_${dossier.dossier_id.slice(0, 8)}.md`);
      writeFileSync(reportPath, report);
      log.info('report_saved', { reportPath });
    }
  }

  return result;
}

// ============================================================
// REPORT GENERATOR
// ============================================================

function generateAnalysisReport(dossier, crossAnalysis, gaps, checklist, actorGraph) {
  const lines = [];

  lines.push('# RAPPORT D\'ANALYSE DE DOSSIER');
  lines.push(`## Généré automatiquement par JusticePourtous — Dossier Analyzer`);
  lines.push(`> Date: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`> Documents analysés: ${dossier.enriched || 0}/${dossier.total_files}`);
  lines.push('');
  lines.push('> **AVERTISSEMENT** : Ce rapport est un outil d\'aide à l\'analyse. Il ne constitue pas un avis juridique.');
  lines.push('');

  // --- SCORE ---
  lines.push('---');
  lines.push(`## SCORE D'ENQUÊTE: ${checklist.score}% — ${checklist.status.toUpperCase()}`);
  lines.push('');
  lines.push(`| Métrique | Valeur |`);
  lines.push(`|----------|--------|`);
  lines.push(`| Obligations vérifiées | ${checklist.total_checks} |`);
  lines.push(`| Remplies | ${checklist.passed} |`);
  lines.push(`| Manquements critiques | ${checklist.critical_failures} |`);
  lines.push(`| Manquements élevés | ${checklist.high_failures} |`);
  lines.push('');

  // --- MANQUEMENTS ---
  if (checklist.summary.critique.length > 0) {
    lines.push('## MANQUEMENTS CRITIQUES');
    lines.push('');
    for (const f of checklist.summary.critique) {
      lines.push(`### ✗ ${f.label}`);
      lines.push(`- **Détail**: ${f.detail}`);
      lines.push(`- **Check**: ${f.id}`);
      lines.push('');
    }
  }

  if (checklist.summary.haute.length > 0) {
    lines.push('## MANQUEMENTS ÉLEVÉS');
    lines.push('');
    for (const f of checklist.summary.haute) {
      lines.push(`### ⚠ ${f.label}`);
      lines.push(`- **Détail**: ${f.detail}`);
      lines.push('');
    }
  }

  // --- CONTRADICTIONS ---
  if (crossAnalysis.contradictions.length > 0) {
    lines.push('## CONTRADICTIONS DÉTECTÉES');
    lines.push('');
    for (const c of crossAnalysis.contradictions) {
      lines.push(`### ${c.severity.toUpperCase()}: ${c.element || c.description}`);
      if (c.version_a) lines.push(`- **Version A**: ${Array.isArray(c.version_a) ? c.version_a.join('; ') : c.version_a}`);
      if (c.version_b) lines.push(`- **Version B**: ${Array.isArray(c.version_b) ? c.version_b.join('; ') : c.version_b}`);
      if (c.versions) lines.push(`- **Versions**: ${c.versions.join(' vs ')}`);
      lines.push('');
    }
  }

  // --- GAPS ---
  if (gaps.total_refused > 0) {
    lines.push('## MESURES REFUSÉES');
    lines.push('');
    lines.push(`Taux d'acceptation: ${gaps.acceptance_rate}`);
    lines.push('');
    for (const r of gaps.refused) {
      lines.push(`- ${r.mesure} *(${r.source})*`);
    }
    lines.push('');
  }

  // --- QUESTIONS ---
  if (crossAnalysis.unresolved_questions.length > 0) {
    lines.push('## QUESTIONS SANS RÉPONSE');
    lines.push('');
    for (const q of crossAnalysis.unresolved_questions.slice(0, 20)) {
      lines.push(`- ${q.question} *(${q.source})*`);
    }
    lines.push('');
  }

  // --- ACTEURS ---
  lines.push('## ACTEURS IDENTIFIÉS');
  lines.push('');
  lines.push('| Acteur | Rôles | Documents | Claims |');
  lines.push('|--------|-------|-----------|--------|');
  for (const [name, data] of Object.entries(actorGraph).slice(0, 15)) {
    lines.push(`| ${name} | ${data.roles.join(', ')} | ${data.docs_count} | ${data.claims_count} |`);
  }
  lines.push('');

  // --- TIMELINE ---
  if (crossAnalysis.timeline.length > 0) {
    lines.push('## CHRONOLOGIE');
    lines.push('');
    lines.push('| Date | Heure | Acteur | Action | Source |');
    lines.push('|------|-------|--------|--------|--------|');
    for (const e of crossAnalysis.timeline.slice(0, 50)) {
      lines.push(`| ${e.date || '?'} | ${e.heure || '?'} | ${e.acteur} | ${e.action?.slice(0, 60) || ''} | ${e.source_doc} |`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('*Rapport généré par JusticePourtous — Dossier Analyzer*');
  lines.push('*Méthode: ingestion parallèle → croisement déterministe → checklist procédurale → rapport sourcé*');

  return lines.join('\n');
}

// ============================================================
// CLI ENTRY POINT
// ============================================================

// Run from command line: node src/services/dossier-analyzer.mjs <path>
const args = process.argv.slice(2);
if (args.length > 0) {
  const dirPath = args[0];
  const outputDir = args[1] || dirPath;
  const noLLM = args.includes('--no-llm');

  analyzeDossier(dirPath, {
    enrich: !noLLM,
    maxDocs: 20,
    outputDir,
    generateReport: true,
  }).then(result => {
    log.info('cli_summary', {
      score: result.investigation_checklist.score,
      contradictions: result.contradictions.length,
      unresolved_questions: result.unresolved_questions.length,
    });
  }).catch(err => {
    log.error('cli_failed', { err: err.message });
    process.exit(1);
  });
}

export default { analyzeDossier };
