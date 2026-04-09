/**
 * Marginal Value Questioner — Questions à plus haute valeur décisionnelle
 *
 * Innovation V4 #3: Pour chaque fait manquant, simule les mondes possibles
 * (oui/non/inconnu) et mesure ce que ce fait change dans :
 *   - le statut d'un claim (confirmed → insufficient)
 *   - un délai (30 jours vs 90 jours)
 *   - une autorité compétente (tribunal vs conciliation)
 *   - une fourchette de montant
 *
 * Le but : poser 2-3 questions qui CHANGENT le résultat, pas des questions
 * "pour mieux comprendre".
 */

import { certifyIssue } from './coverage-certificate.mjs';
import { analyzeIssue } from './argumentation-engine.mjs';

// ─── Fact dimensions that affect legal outcomes ─────────────────

const FACT_DIMENSIONS = [
  {
    id: 'canton',
    question: 'Dans quel canton habitez-vous ?',
    why: 'Les autorités compétentes, délais et procédures varient par canton.',
    impacts: ['autorite_competente', 'delai', 'contact'],
    detect_missing: (comprehension) => !comprehension.canton,
  },
  {
    id: 'duree',
    question: 'Depuis combien de temps dure cette situation ?',
    why: 'La durée détermine les délais de prescription et les montants de réduction.',
    impacts: ['delai', 'montant', 'prescription'],
    detect_missing: (comprehension) => {
      const facts = comprehension.faits || [];
      return !facts.some(f =>
        typeof f === 'string' && (f.includes('mois') || f.includes('an') || f.includes('jour') || f.includes('semaine'))
      );
    },
  },
  {
    id: 'montant',
    question: 'Quel est le montant en jeu (loyer, salaire, dette) ?',
    why: 'Le montant détermine la procédure (simplifiée vs ordinaire) et les coûts.',
    impacts: ['procedure', 'cout', 'montant'],
    detect_missing: (comprehension) => {
      const facts = comprehension.faits || [];
      return !facts.some(f =>
        typeof f === 'string' && (f.includes('CHF') || f.includes('francs') || /\d{3,}/.test(f))
      );
    },
  },
  {
    id: 'mise_en_demeure',
    question: 'Avez-vous déjà envoyé une mise en demeure écrite (lettre recommandée) ?',
    why: 'La mise en demeure est souvent une condition préalable obligatoire.',
    impacts: ['recevabilite', 'procedure', 'delai'],
    detect_missing: (comprehension) => {
      const facts = comprehension.faits || [];
      const docs = comprehension.documents || [];
      return !facts.some(f => typeof f === 'string' && (f.includes('mise en demeure') || f.includes('recommandé')))
        && !docs.some(d => typeof d === 'string' && (d.includes('mise en demeure') || d.includes('recommandé')));
    },
  },
  {
    id: 'contrat_ecrit',
    question: 'Avez-vous un contrat écrit (bail, contrat de travail) ?',
    why: 'L\'existence d\'un contrat écrit change les preuves requises et les moyens d\'action.',
    impacts: ['preuve', 'procedure'],
    detect_missing: (comprehension) => {
      const docs = comprehension.documents || [];
      return !docs.some(d =>
        typeof d === 'string' && (d.includes('contrat') || d.includes('bail'))
      );
    },
  },
  {
    id: 'tentative_resolution',
    question: 'Avez-vous déjà essayé de résoudre le problème directement avec l\'autre partie ?',
    why: 'Certaines procédures exigent une tentative de conciliation préalable.',
    impacts: ['recevabilite', 'procedure'],
    detect_missing: (comprehension) => {
      const facts = comprehension.faits || [];
      return !facts.some(f =>
        typeof f === 'string' && (f.includes('contact') || f.includes('négoci') || f.includes('concili'))
      );
    },
  },
  {
    id: 'anciennete',
    question: 'Depuis combien de temps êtes-vous dans cette relation (bail, emploi) ?',
    why: 'L\'ancienneté détermine les délais de congé, la protection et les indemnités.',
    impacts: ['delai_conge', 'protection', 'indemnite'],
    detect_missing: (comprehension) => {
      const facts = comprehension.faits || [];
      return !facts.some(f =>
        typeof f === 'string' && (f.includes('année') || f.includes('ans') || f.includes('ancienneté'))
      );
    },
  },
  {
    id: 'urgence',
    question: 'Y a-t-il une date limite ou une urgence (expulsion prévue, fin de délai) ?',
    why: 'Une urgence peut nécessiter des mesures provisionnelles immédiates.',
    impacts: ['procedure', 'delai', 'mesures_provisionnelles'],
    detect_missing: (comprehension) => {
      const facts = comprehension.faits || [];
      return !facts.some(f =>
        typeof f === 'string' && (f.includes('urgent') || f.includes('demain') || f.includes('délai') || f.includes('expuls'))
      );
    },
  },
];

// ─── Impact scoring ─────────────────────────────────────────────

/**
 * Score how much a missing fact would change the legal outcome.
 * Higher score = question has more decision value.
 */
function scoreFactImpact(factDim, issue, certificate) {
  let score = 0;

  // 1. Does it affect a critical certificate check that failed?
  const criticalFails = certificate?.critical_fails || [];
  if (factDim.impacts.includes('delai') && criticalFails.includes('delai')) score += 5;
  if (factDim.impacts.includes('preuve') && criticalFails.includes('source_ids')) score += 3;
  if (factDim.impacts.includes('recevabilite')) score += 4; // always high value

  // 2. Does it affect the argumentation outcome?
  if (factDim.impacts.includes('procedure')) score += 3;
  if (factDim.impacts.includes('montant')) score += 2;
  if (factDim.impacts.includes('prescription')) score += 4;
  if (factDim.impacts.includes('protection')) score += 3;

  // 3. Domain-specific boosts
  const domaine = issue?.domaine || '';
  if (domaine === 'bail' && factDim.id === 'duree') score += 2;
  if (domaine === 'travail' && factDim.id === 'anciennete') score += 3;
  if (domaine === 'dettes' && factDim.id === 'montant') score += 3;

  // 4. Canton always valuable if missing
  if (factDim.id === 'canton') score += 3;

  return score;
}

// ─── Main API ───────────────────────────────────────────────────

/**
 * Generate the highest-value questions for a comprehension result.
 * @param {object} comprehension — from pipeline V3 step 1
 * @param {object} issue — from dossier (optional, for domain context)
 * @param {object} certificate — from certifyIssue (optional)
 * @param {number} maxQuestions — max questions to return (default 3)
 * @returns {object[]} ranked questions with scores
 */
export function generateQuestions(comprehension, issue = null, certificate = null, maxQuestions = 3) {
  if (!comprehension) return [];

  // Find which facts are missing
  const missingFacts = FACT_DIMENSIONS.filter(fd => fd.detect_missing(comprehension));

  if (missingFacts.length === 0) return [];

  // Score each missing fact by impact
  const scored = missingFacts.map(fd => ({
    id: fd.id,
    question: fd.question,
    why: fd.why,
    impacts: fd.impacts,
    score: scoreFactImpact(fd, issue, certificate),
  }));

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, maxQuestions);
}

/**
 * Generate questions for a full dossier (all issues).
 */
export function generateDossierQuestions(comprehension, dossier, certificate, maxQuestions = 3) {
  const bestIssue = dossier?.issues?.[0] || null;
  const bestIssueCert = certificate?.issues?.[0] || null;
  return generateQuestions(comprehension, bestIssue, bestIssueCert, maxQuestions);
}

export { FACT_DIMENSIONS };
