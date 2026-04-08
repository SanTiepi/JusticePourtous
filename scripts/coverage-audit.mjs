/**
 * Coverage Audit — Détection automatique des lacunes
 * Vérifie la complétude de la base juridique et signale ce qui manque.
 *
 * Usage: node scripts/coverage-audit.mjs
 * Output: rapport JSON + texte dans src/data/meta/coverage-report.json
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'src', 'data');

function loadJSON(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch { return null; }
}

function loadAllJSON(dir) {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir).filter(f => f.endsWith('.json'));
  const all = [];
  for (const f of files) {
    const data = loadJSON(join(dir, f));
    if (Array.isArray(data)) all.push(...data);
    else if (data && typeof data === 'object') {
      // Handle wrapped arrays
      for (const v of Object.values(data)) {
        if (Array.isArray(v)) all.push(...v);
      }
    }
  }
  return all;
}

const DOMAINES = ['bail', 'travail', 'famille', 'dettes', 'etrangers'];
const CANTONS_ROMANDS = ['VD', 'GE', 'VS', 'NE', 'FR', 'JU'];
const CANTONS_PRINCIPAUX = [...CANTONS_ROMANDS, 'BE', 'ZH', 'BS'];

function audit() {
  const report = {
    date: new Date().toISOString(),
    score: 0,
    maxScore: 0,
    lacunes: [],
    couverture: {},
    recommandations: []
  };

  // Load all data
  const fiches = loadAllJSON(join(dataDir, 'fiches'));
  const articles = loadAllJSON(join(dataDir, 'loi'));
  const arrets = loadAllJSON(join(dataDir, 'jurisprudence'));
  const delais = loadAllJSON(join(dataDir, 'delais'));
  const preuves = loadAllJSON(join(dataDir, 'preuves'));
  const taxonomie = loadAllJSON(join(dataDir, 'taxonomie'));
  const antiErreurs = loadAllJSON(join(dataDir, 'anti-erreurs'));
  const patterns = loadAllJSON(join(dataDir, 'patterns'));
  const casPratiques = loadAllJSON(join(dataDir, 'cas-pratiques'));
  const escalade = loadAllJSON(join(dataDir, 'escalade'));
  const annuaire = loadAllJSON(join(dataDir, 'annuaire'));
  const cantons = loadAllJSON(join(dataDir, 'cantons'));
  const couts = loadAllJSON(join(dataDir, 'couts'));
  const templates = loadAllJSON(join(dataDir, 'templates'));
  const confiance = loadJSON(join(dataDir, 'confiance', 'niveaux-confiance.json'));
  const recevabilite = loadAllJSON(join(dataDir, 'recevabilite'));
  const workflows = loadJSON(join(dataDir, 'workflows', 'moments-de-vie.json')) || [];
  const cascades = loadJSON(join(dataDir, 'cascades', 'cascades.json')) || [];
  const stats = loadAllJSON(join(dataDir, 'statistiques'));

  // --- Check 1: Fiches par domaine (objectif: 30 par domaine) ---
  for (const d of DOMAINES) {
    const count = fiches.filter(f => f.domaine === d || f.id?.startsWith(d)).length;
    const target = 30;
    report.maxScore += 10;
    const score = Math.min(10, Math.round(count / target * 10));
    report.score += score;
    report.couverture[d] = { fiches: count, cible: target, score: `${score}/10` };
    if (count < target) {
      report.lacunes.push({
        type: 'fiches',
        domaine: d,
        manquant: target - count,
        message: `${d}: ${count}/${target} fiches (manque ${target - count})`
      });
    }
  }

  // --- Check 2: Articles de loi indexés ---
  report.maxScore += 10;
  const artScore = Math.min(10, Math.round(articles.length / 300 * 10));
  report.score += artScore;
  report.couverture.articles = { total: articles.length, cible: 3000, score: `${artScore}/10` };
  if (articles.length < 300) {
    report.lacunes.push({
      type: 'loi',
      message: `Seulement ${articles.length} articles indexés (cible: 3000, minimum: 300)`
    });
  }

  // --- Check 3: Arrêts indexés ---
  report.maxScore += 10;
  const arrScore = Math.min(10, Math.round(arrets.length / 500 * 10));
  report.score += arrScore;
  report.couverture.arrets = { total: arrets.length, cible: 5000, score: `${arrScore}/10` };

  // --- Check 4: Chaque fiche cite au moins un article de loi ---
  report.maxScore += 10;
  let fichesSansSource = 0;
  for (const f of fiches) {
    const hasLegalRef = f.articlesLoi?.length > 0 || f.baseLegale?.length > 0
      || f.articles?.length > 0 || f.loi;
    if (!hasLegalRef) fichesSansSource++;
  }
  const sourceScore = fiches.length > 0 ? Math.round((1 - fichesSansSource / fiches.length) * 10) : 0;
  report.score += sourceScore;
  if (fichesSansSource > 0) {
    report.lacunes.push({
      type: 'tracabilite',
      message: `${fichesSansSource} fiches sans référence légale explicite`
    });
  }

  // --- Check 5: Délais par domaine ---
  report.maxScore += 10;
  for (const d of DOMAINES) {
    const count = delais.filter(dl => dl.domaine === d).length;
    if (count < 3) {
      report.lacunes.push({
        type: 'delais',
        domaine: d,
        message: `${d}: seulement ${count} délais documentés (minimum 5)`
      });
    }
  }
  const delaisScore = Math.min(10, Math.round(delais.length / 25 * 10));
  report.score += delaisScore;
  report.couverture.delais = { total: delais.length, cible: 25, score: `${delaisScore}/10` };

  // --- Check 6: Anti-erreurs par domaine ---
  report.maxScore += 10;
  const aeScore = Math.min(10, Math.round(antiErreurs.length / 25 * 10));
  report.score += aeScore;
  report.couverture.antiErreurs = { total: antiErreurs.length, cible: 25, score: `${aeScore}/10` };

  // --- Check 7: Patterns praticien ---
  report.maxScore += 10;
  const patScore = Math.min(10, Math.round(patterns.length / 15 * 10));
  report.score += patScore;
  report.couverture.patterns = { total: patterns.length, cible: 15, score: `${patScore}/10` };

  // --- Check 8: Cas pratiques ---
  report.maxScore += 10;
  const casScore = Math.min(10, Math.round(casPratiques.length / 20 * 10));
  report.score += casScore;
  report.couverture.casPratiques = { total: casPratiques.length, cible: 20, score: `${casScore}/10` };

  // --- Check 9: Cantons couverts dans l'annuaire ---
  report.maxScore += 10;
  const cantonsCovered = new Set();
  for (const s of annuaire) {
    if (s.canton) cantonsCovered.add(s.canton);
    if (s.cantons) s.cantons.forEach(c => cantonsCovered.add(c));
  }
  const cantonScore = Math.min(10, Math.round(cantonsCovered.size / CANTONS_PRINCIPAUX.length * 10));
  report.score += cantonScore;
  const cantonsMissing = CANTONS_PRINCIPAUX.filter(c => !cantonsCovered.has(c));
  report.couverture.cantons = {
    couverts: [...cantonsCovered],
    manquants: cantonsMissing,
    score: `${cantonScore}/10`
  };
  if (cantonsMissing.length > 0) {
    report.lacunes.push({
      type: 'cantons',
      message: `Cantons non couverts dans l'annuaire: ${cantonsMissing.join(', ')}`
    });
  }

  // --- Check 10: Templates ---
  report.maxScore += 10;
  const tplScore = Math.min(10, Math.round(templates.length / 50 * 10));
  report.score += tplScore;
  report.couverture.templates = { total: templates.length, cible: 200, score: `${tplScore}/10` };

  // --- Check 11: Escalade / réseau relais ---
  report.maxScore += 5;
  const escScore = Math.min(5, Math.round(escalade.length / 20 * 5));
  report.score += escScore;
  report.couverture.escalade = { total: escalade.length, cible: 20, score: `${escScore}/5` };

  // --- Check 12: Taxonomie ---
  report.maxScore += 5;
  const taxScore = Math.min(5, Math.round(taxonomie.length / 30 * 5));
  report.score += taxScore;
  report.couverture.taxonomie = { total: taxonomie.length, cible: 30, score: `${taxScore}/5` };

  // --- Check 13: Workflows ---
  report.maxScore += 5;
  const wfScore = Math.min(5, Math.round(workflows.length / 10 * 5));
  report.score += wfScore;
  report.couverture.workflows = { total: workflows.length, cible: 10, score: `${wfScore}/5` };

  // --- Check 14: Cascades ---
  report.maxScore += 5;
  const cascScore = Math.min(5, Math.round(cascades.length / 5 * 5));
  report.score += cascScore;
  report.couverture.cascades = { total: cascades.length, cible: 5, score: `${cascScore}/5` };

  // --- Overall ---
  report.scorePct = Math.round(report.score / report.maxScore * 100);

  // Recommendations
  report.lacunes.sort((a, b) => {
    const priority = { tracabilite: 0, fiches: 1, delais: 2, loi: 3, cantons: 4 };
    return (priority[a.type] ?? 5) - (priority[b.type] ?? 5);
  });

  if (fichesSansSource > 10) {
    report.recommandations.push('CRITIQUE: Ajouter les références légales aux fiches sans source');
  }
  if (delais.length < 25) {
    report.recommandations.push('HAUTE: Compléter les délais procéduraux (essentiel pour les avocats)');
  }
  if (articles.length < 300) {
    report.recommandations.push('HAUTE: Lancer le Fedlex Harvester pour indexer plus d\'articles');
  }
  if (cantonsMissing.length > 0) {
    report.recommandations.push(`MOYENNE: Couvrir les cantons manquants: ${cantonsMissing.join(', ')}`);
  }
  if (casPratiques.length < 20) {
    report.recommandations.push('MOYENNE: Ajouter des cas pratiques anonymisés');
  }

  return report;
}

// Run
const report = audit();

// Save
const outFile = join(dataDir, 'meta', 'coverage-report.json');
writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf-8');

// Display
console.log(`\n${'='.repeat(60)}`);
console.log(`  AUDIT DE COUVERTURE — JusticePourtous`);
console.log(`  ${report.date}`);
console.log(`${'='.repeat(60)}\n`);
console.log(`  Score global: ${report.score}/${report.maxScore} (${report.scorePct}%)\n`);

console.log('  Couverture par type:');
for (const [key, val] of Object.entries(report.couverture)) {
  if (val.score) {
    const bar = '█'.repeat(parseInt(val.score)) + '░'.repeat(10 - parseInt(val.score));
    console.log(`    ${key.padEnd(15)} ${bar} ${val.score} — ${val.total || val.fiches || 0}/${val.cible || '?'}`);
  }
}

if (report.lacunes.length) {
  console.log(`\n  Lacunes (${report.lacunes.length}):`);
  for (const l of report.lacunes) {
    console.log(`    ⚠ ${l.message}`);
  }
}

if (report.recommandations.length) {
  console.log('\n  Recommandations:');
  for (const r of report.recommandations) {
    console.log(`    → ${r}`);
  }
}

console.log(`\n  Rapport sauvé: ${outFile}`);

export { audit };
