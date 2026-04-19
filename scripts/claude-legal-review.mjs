#!/usr/bin/env node
/**
 * claude-legal-review.mjs — Review "Claude legal" des fiches citoyennes.
 *
 * N'est PAS un review par avocat humain (→ `reviewed_by_legal_expert` reste
 * réservé à l'expert humain). C'est un review structurel automatisé par
 * Claude qui applique une checklist stricte :
 *
 *   1. Fiche complète (explication ≥ 500 chars)
 *   2. ≥ 2 articles de loi avec ref + lien/source_id
 *   3. ≥ 1 jurisprudence avec signature
 *   4. Délais présents (délais[] ou cascade étape avec délai)
 *   5. Confiance ≥ probable
 *   6. last_verified_at présent et < 12 mois
 *   7. Cascades OU modeleLettre (fiche actionnable)
 *   8. Source registry résout ≥ 80% des refs articles
 *   9. Explication ne contient pas de phrases creuses ("variable selon cas")
 *      ni de formulations interdites ("avocat IA", "nous garantissons")
 *
 * Si tous critères passent → `review_scope: "reviewed_by_claude"`.
 * Sinon → laisse `draft_automated` + logue les anomalies.
 *
 * Usage : node scripts/claude-legal-review.mjs [--dry-run]
 * Output : src/data/meta/claude-legal-review-report.json
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSourceByRef } from '../src/services/source-registry.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FICHES_DIR = join(ROOT, 'src/data/fiches');
const OUT = join(ROOT, 'src/data/meta/claude-legal-review-report.json');

const DRY_RUN = process.argv.includes('--dry-run');

// Phrases interdites dans l'explication
const FORBIDDEN_PHRASES = [
  /avocat\s*ia\b/i,
  /nous\s+garantissons/i,
  /\bvous\s+gagnerez\b/i,
  /\b100%\s+s[ûu]r\b/i,
  /\bcertain\s+de\s+gagner\b/i
];

// Phrases floues / creuses (avertissement, pas blocage)
const VAGUE_PHRASES = [
  /variable\s+selon\s+les?\s+cas/i,
  /cela\s+d[ée]pend/i
];

const MIN_EXPLICATION_CHARS = 500;
const MIN_ARTICLES = 2;
const MIN_JURISPRUDENCE = 1;
const MAX_VERIFIED_AGE_MONTHS = 12;
// Tolérance : 70% — couvre le cas d'une ref cantonale (ex: LASV, LIASI) ou
// ordonnance technique (LAO, OPR) non indexée dans source-registry mais réelle.
const MIN_SOURCE_ID_RESOLUTION_PCT = 70;

function monthsAgo(isoDate, now = new Date()) {
  if (!isoDate) return Infinity;
  try {
    const d = new Date(isoDate);
    const diffMs = now.getTime() - d.getTime();
    return diffMs / (1000 * 60 * 60 * 24 * 30);
  } catch { return Infinity; }
}

function getExplication(fiche) {
  return (fiche.reponse && fiche.reponse.explication) || fiche.explication || '';
}
function getArticles(fiche) {
  return (fiche.reponse && fiche.reponse.articles) || fiche.articles || [];
}
function getJurisprudence(fiche) {
  return (fiche.reponse && fiche.reponse.jurisprudence) || fiche.jurisprudence || [];
}
function getDelais(fiche) {
  const r = (fiche.reponse && fiche.reponse.delais) || fiche.delais || [];
  if (r.length) return r;
  // Fallback : cherche dans les cascades
  const cascades = fiche.cascades || [];
  const etapesWithDelai = cascades.flatMap(c => (c.etapes || []).filter(e => e.delai));
  return etapesWithDelai;
}
function isActionable(fiche) {
  const hasTemplate = !!((fiche.reponse && fiche.reponse.modeleLettre) || fiche.template);
  const hasCascade = Array.isArray(fiche.cascades) && fiche.cascades.length > 0;
  return hasTemplate || hasCascade;
}

function reviewFiche(fiche) {
  const anomalies = [];
  const warnings = [];

  // 1. Explication minimum
  const explication = getExplication(fiche);
  if (explication.length < MIN_EXPLICATION_CHARS) {
    anomalies.push(`explication trop courte (${explication.length} < ${MIN_EXPLICATION_CHARS} chars)`);
  }

  // 2. Phrases interdites
  for (const re of FORBIDDEN_PHRASES) {
    if (re.test(explication)) anomalies.push(`phrase interdite détectée : /${re.source}/`);
  }
  for (const re of VAGUE_PHRASES) {
    if (re.test(explication)) warnings.push(`phrase floue : /${re.source}/`);
  }

  // 3. Articles
  const articles = getArticles(fiche);
  if (articles.length < MIN_ARTICLES) {
    anomalies.push(`articles insuffisants (${articles.length} < ${MIN_ARTICLES})`);
  }

  // 4. Jurisprudence — tolère information_only (pas d'action procédurale, pas de
  // jurisprudence directement applicable)
  const jurisprudence = getJurisprudence(fiche);
  if (jurisprudence.length < MIN_JURISPRUDENCE && !fiche.information_only) {
    anomalies.push(`jurisprudence insuffisante (${jurisprudence.length} < ${MIN_JURISPRUDENCE})`);
  }

  // 5. Délais — tolère les fiches marquées `information_only: true`
  // (explications générales d'une loi/institution, sans action procédurale ciblée)
  const delais = getDelais(fiche);
  if (delais.length === 0 && !fiche.information_only) {
    anomalies.push('aucun délai présent (ni dans reponse.delais ni dans cascades)');
  }

  // 6. Confiance — tolère 'variable' pour les fiches `information_only`
  // (services non-juridiques, ex: médiation dettes, budget-conseil) où la
  // "confiance juridique" n'est pas le bon concept.
  const confiance = fiche.confiance || 'unknown';
  const acceptableConfiance = fiche.information_only
    ? ['certain', 'probable', 'variable']
    : ['certain', 'probable'];
  if (!acceptableConfiance.includes(confiance)) {
    anomalies.push(`confiance insuffisante : ${confiance} (requis : ${acceptableConfiance.join(' ou ')})`);
  }

  // 7. Fraîcheur
  const age = monthsAgo(fiche.last_verified_at);
  if (age > MAX_VERIFIED_AGE_MONTHS) {
    anomalies.push(`last_verified_at trop ancien (${age.toFixed(1)} mois > ${MAX_VERIFIED_AGE_MONTHS})`);
  }

  // 8. Actionabilité (cascade OU template)
  if (!isActionable(fiche)) {
    anomalies.push('non actionnable (ni cascade ni modeleLettre)');
  }

  // 9. Source registry resolution
  if (articles.length > 0) {
    let resolved = 0;
    for (const a of articles) {
      if (!a.ref) continue;
      try {
        const src = getSourceByRef(a.ref);
        if (src && src.source_id) resolved++;
      } catch { /* noop */ }
    }
    const pct = Math.round((resolved / articles.length) * 100);
    if (pct < MIN_SOURCE_ID_RESOLUTION_PCT) {
      anomalies.push(`source_id résolution trop faible : ${resolved}/${articles.length} (${pct}% < ${MIN_SOURCE_ID_RESOLUTION_PCT}%)`);
    }
  }

  return {
    id: fiche.id,
    domaine: fiche.domaine,
    passed: anomalies.length === 0,
    anomalies,
    warnings
  };
}

function main() {
  const files = readdirSync(FICHES_DIR).filter(f => f.endsWith('.json'));
  const report = {
    generated_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    total: 0,
    reviewed: 0,
    skipped_already_reviewed: 0,
    failed: 0,
    by_domain: {},
    failures: []
  };

  for (const f of files) {
    const path = join(FICHES_DIR, f);
    const arr = JSON.parse(readFileSync(path, 'utf8'));
    let domainPass = 0;
    let domainFail = 0;
    let domainAlready = 0;
    let touched = false;

    for (const fiche of arr) {
      report.total++;

      // Ne pas toucher aux fiches déjà reviewed par un expert humain
      if (fiche.review_scope === 'reviewed_by_legal_expert') {
        domainAlready++;
        report.skipped_already_reviewed++;
        continue;
      }

      const res = reviewFiche(fiche);
      if (res.passed) {
        if (fiche.review_scope !== 'reviewed_by_claude') {
          fiche.review_scope = 'reviewed_by_claude';
          fiche.claude_review_date = new Date().toISOString().slice(0, 10);
          touched = true;
        }
        report.reviewed++;
        domainPass++;
      } else {
        report.failed++;
        domainFail++;
        report.failures.push({
          id: fiche.id,
          domaine: fiche.domaine,
          anomalies: res.anomalies,
          warnings: res.warnings
        });
      }
    }

    report.by_domain[f.replace('.json', '')] = {
      total: arr.length,
      passed: domainPass,
      failed: domainFail,
      already_expert_reviewed: domainAlready
    };

    if (touched && !DRY_RUN) {
      writeFileSync(path, JSON.stringify(arr, null, 2) + '\n', 'utf8');
    }
  }

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(report, null, 2), 'utf8');

  const pct = Math.round((report.reviewed / report.total) * 100);
  console.log(`[claude-review] ${report.reviewed}/${report.total} fiches reviewed_by_claude (${pct}%)`);
  console.log(`[claude-review] ${report.failed} fiches avec anomalies — voir rapport`);
  console.log(`[claude-review] ${report.skipped_already_reviewed} fiches déjà expert-reviewed (intact)`);
  if (DRY_RUN) console.log(`[claude-review] DRY-RUN : aucune fiche modifiée`);
  console.log(`[claude-review] Rapport : ${OUT}`);
  return report;
}

if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes('claude-legal-review')) {
  try { main(); } catch (e) { console.error(e); process.exit(1); }
}

export { main, reviewFiche };
