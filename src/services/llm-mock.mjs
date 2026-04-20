/**
 * llm-mock.mjs — Deterministic LLM responses for CI/tests.
 *
 * Activated ONLY when process.env.LLM_MOCK === '1'.
 * Returns a navigation object matching the real llm-navigator.mjs schema so
 * downstream code (triage-engine, coverage-certificate, argumentation, etc.)
 * does not crash.
 *
 * Rules are heuristic keyword matchers on the user text, ordered by specificity.
 * When no rule matches → empty fiches with low confidence → the engine falls
 * back to semantic-search as it would in real life.
 *
 * Mock is strictly a test harness — production always uses the real Anthropic
 * client via llm-navigator.callNavigator().
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createLogger } from './logger.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fichesDir = join(__dirname, '..', 'data', 'fiches');
const log = createLogger('llm-mock');

// Build set of valid fiche IDs at module load — prevents mock from referencing
// non-existent fiches which would produce empty results downstream.
const VALID_IDS = new Set();
for (const f of readdirSync(fichesDir).filter(f => f.endsWith('.json'))) {
  const fiches = JSON.parse(readFileSync(join(fichesDir, f), 'utf-8'));
  for (const fiche of fiches) VALID_IDS.add(fiche.id);
}

// ─── Mock rules ─────────────────────────────────────────────────
// Each rule: { match: (textLower) => boolean, fiches: string[], domaine, confiance, resume }
// First match wins.
const RULES = [
  // BAIL
  {
    name: 'bail_moisissure',
    match: (t) => /moisiss|moisi|humidité|humidite|champignon/i.test(t),
    fiches: ['bail_defaut_moisissure'],
    domaine: 'bail',
    confiance: 'haute',
    resume: 'Défaut de la chose louée (moisissure) — droit à réduction de loyer (CO 259d).'
  },
  {
    name: 'bail_bruit',
    match: (t) => /bruit|nuisance sonore|tapage/i.test(t) && /bail|locataire|bailleur|appart|loyer/i.test(t),
    fiches: ['bail_defaut_bruit'],
    domaine: 'bail',
    confiance: 'haute',
    resume: 'Défaut de la chose louée (bruit) — démarche auprès du bailleur puis autorité de conciliation.'
  },
  {
    name: 'bail_caution',
    match: (t) => /caution|dépôt de garantie|depot de garantie|garantie bancaire|garantie.*loyer|libérer.*garantie|liberer.*garantie|restitu.*caution/i.test(t),
    fiches: ['bail_depot_garantie'],
    domaine: 'bail',
    confiance: 'haute',
    resume: 'Restitution de la caution après fin de bail (CO 257e).'
  },
  {
    name: 'bail_augmentation',
    match: (t) => /(hausse|augmentation).*(loyer)|loyer.*(hausse|augment)/i.test(t),
    fiches: ['bail_augmentation_loyer'],
    domaine: 'bail',
    confiance: 'haute',
    resume: 'Contestation d\'augmentation de loyer — délai 30 jours (CO 270b).'
  },
  {
    name: 'bail_expulsion',
    match: (t) => /(expuls|mettre dehors|virer de l.appart|chasse.*bail)/i.test(t),
    fiches: ['bail_expulsion'],
    domaine: 'bail',
    confiance: 'haute',
    resume: 'Menace d\'expulsion — procédure de conciliation obligatoire.'
  },
  {
    name: 'bail_resiliation',
    match: (t) => /(résiliation|resiliation|congé|conge).*(bail|loyer|bailleur|appart)/i.test(t),
    fiches: ['bail_resiliation_conteste'],
    domaine: 'bail',
    confiance: 'haute',
    resume: 'Contestation de résiliation de bail — délai 30 jours (CO 273).'
  },
  {
    name: 'bail_loyer_generique',
    match: (t) => /(loyer|bail|bailleur|propriétaire|proprietaire).*(trop cher|abusif|problème|probleme|pas|refuse)/i.test(t) ||
      /\b(loyer|bail)\b/i.test(t),
    fiches: ['bail_loyer_abusif'],
    domaine: 'bail',
    confiance: 'moyenne',
    resume: 'Problème de loyer — à qualifier (abusif, impayé, augmentation).'
  },

  // TRAVAIL
  {
    name: 'travail_licenciement_maladie',
    match: (t) => /licenci.*(maladie|arrêt|arret|cong[éè] maladie)|(maladie|arrêt).*licenci/i.test(t),
    fiches: ['travail_licenciement_maladie'],
    domaine: 'travail',
    confiance: 'haute',
    resume: 'Licenciement en temps inopportun (maladie) — nullité possible (CO 336c).'
  },
  {
    name: 'travail_harcelement',
    match: (t) => /harcèle|harcele|mobbing|patron.*harc/i.test(t),
    fiches: ['travail_harcelement'],
    domaine: 'travail',
    confiance: 'haute',
    resume: 'Harcèlement au travail (CO 328).'
  },
  {
    name: 'travail_heures_sup',
    match: (t) => /heures sup|heures supplémentaires|heures supplementaires|overtime/i.test(t),
    fiches: ['travail_heures_sup'],
    domaine: 'travail',
    confiance: 'haute',
    resume: 'Heures supplémentaires impayées (CO 321c).'
  },
  {
    name: 'travail_salaire',
    match: (t) => /salaire.*(impayé|impaye|pas payé|pas paye|non pay)|non-paiement.*salaire/i.test(t),
    fiches: ['travail_salaire_impaye'],
    domaine: 'travail',
    confiance: 'haute',
    resume: 'Salaire impayé — mise en demeure puis résiliation immédiate (CO 337).'
  },
  {
    name: 'travail_licenciement_generique',
    match: (t) => /licenci|viré|vire\b|renvoyé|renvoye\b/i.test(t),
    fiches: ['travail_licenciement_abusif'],
    domaine: 'travail',
    confiance: 'moyenne',
    resume: 'Licenciement — vérifier caractère abusif (CO 336).'
  },

  // DETTES
  {
    name: 'dettes_commandement',
    match: (t) => /commandement de payer|commandement.*payer|comdt.*payer/i.test(t),
    fiches: ['dettes_commandement_payer', 'dettes_opposition'],
    domaine: 'dettes',
    confiance: 'haute',
    resume: 'Commandement de payer reçu — opposition possible dans les 10 jours (LP 74).'
  },
  {
    name: 'dettes_saisie',
    match: (t) => /saisie.*salaire|office des poursuites.*salaire|saisir mon salaire/i.test(t),
    fiches: ['dettes_saisie_salaire', 'dettes_minimum_vital'],
    domaine: 'dettes',
    confiance: 'haute',
    resume: 'Saisie de salaire — minimum vital protégé (LP 93).'
  },
  {
    name: 'dettes_poursuite',
    match: (t) => /poursuite|office des poursuites|acte de défaut|acte de defaut|faillite/i.test(t),
    fiches: ['dettes_commandement_payer'],
    domaine: 'dettes',
    confiance: 'moyenne',
    resume: 'Procédure de poursuite en cours.'
  },

  // FAMILLE
  {
    name: 'famille_pension',
    match: (t) => /pension.*(impayé|impaye|pas payé|pas paye|refus)|pension alimentaire/i.test(t),
    fiches: ['famille_pension_impayee'],
    domaine: 'famille',
    confiance: 'haute',
    resume: 'Pension alimentaire impayée — recouvrement via BRAPA/SOSAP.'
  },
  {
    name: 'famille_divorce',
    match: (t) => /divorce|divorcer|séparation|separation/i.test(t),
    fiches: ['famille_divorce_procedure'],
    domaine: 'famille',
    confiance: 'haute',
    resume: 'Procédure de divorce.'
  },
  {
    name: 'famille_garde',
    match: (t) => /garde.*(enfant|enfants)|droit de visite/i.test(t),
    fiches: ['famille_garde_modification'],
    domaine: 'famille',
    confiance: 'haute',
    resume: 'Garde et droit de visite.'
  },

  // ASSURANCES
  {
    name: 'assurance_laa_suva',
    match: (t) => /\bsuva\b|\blaa\b|accident.*(travail|professionn)/i.test(t),
    fiches: ['assurance_laa', 'assurance_laa_contestation'],
    domaine: 'assurances',
    confiance: 'haute',
    resume: 'Prestations SUVA / LAA — voie d\'opposition 30 jours.'
  },
  {
    name: 'assurance_lamal',
    match: (t) => /\blamal\b|assurance maladie.*(refus|rembours)/i.test(t),
    fiches: ['assurance_lamal_subsides_refus'],
    domaine: 'assurances',
    confiance: 'haute',
    resume: 'Refus de remboursement LAMal — opposition 30 jours.'
  },
  {
    name: 'assurance_ai',
    match: (t) => /\bai\b.*rente|assurance invalidité|assurance invalidite/i.test(t),
    fiches: ['assurance_ai_rente', 'assurance_ai_opposition'],
    domaine: 'assurances',
    confiance: 'haute',
    resume: 'Rente AI — procédure et opposition.'
  },
  {
    name: 'assurance_chomage',
    match: (t) => /chômage|chomage|orp\b|caisse.*chômage/i.test(t),
    fiches: ['assurance_chomage_inscription'],
    domaine: 'assurances',
    confiance: 'haute',
    resume: 'Inscription et prestations chômage.'
  },

  // ETRANGERS
  {
    name: 'etranger_permis',
    match: (t) => /permis b|permis c|permis.*renouvel|service de la population|service population/i.test(t),
    fiches: ['etranger_permis_b_renouvellement', 'etranger_permis_b_c'],
    domaine: 'etrangers',
    confiance: 'haute',
    resume: 'Renouvellement / refus de permis B ou C.'
  },
  {
    name: 'etranger_renvoi',
    match: (t) => /renvoi|expulsion.*suisse|décision de renvoi|decision de renvoi/i.test(t),
    fiches: ['etranger_renvoi_recours'],
    domaine: 'etrangers',
    confiance: 'haute',
    resume: 'Décision de renvoi — recours 30 jours.'
  },
  {
    name: 'etranger_naturalisation',
    match: (t) => /naturalisation|devenir suisse|nationalité suisse|nationalite suisse/i.test(t),
    fiches: ['etranger_naturalisation'],
    domaine: 'etrangers',
    confiance: 'haute',
    resume: 'Procédure de naturalisation.'
  },
];

// Rules filtered to only include fiches that actually exist
// (protect against drift between data and mock rules)
const ACTIVE_RULES = RULES.map(rule => ({
  ...rule,
  fiches: rule.fiches.filter(id => VALID_IDS.has(id))
})).filter(rule => rule.fiches.length > 0);

// Warn at boot if any rule lost fiches
const lost = RULES.length - ACTIVE_RULES.length;
if (lost > 0) {
  log.warn('llm_mock_rules_dropped', { dropped: lost, reason: 'fiche ID not found in data/' });
}

// ─── Fact extraction ──────────────────────────────────────────
// Keyword scan for canton codes, durations, and common actions.

const CANTON_CODES = new Set([
  'VD','GE','VS','NE','FR','BE','ZH','BS','BL','LU','SG','AG','TI','SO','ZG',
  'SZ','NW','OW','UR','GL','AR','AI','TG','SH','GR','JU'
]);

const CITY_TO_CANTON = {
  lausanne: 'VD', morges: 'VD', nyon: 'VD', vevey: 'VD', yverdon: 'VD',
  genève: 'GE', geneve: 'GE',
  sion: 'VS', martigny: 'VS', monthey: 'VS',
  neuchâtel: 'NE', neuchatel: 'NE',
  fribourg: 'FR', bulle: 'FR',
  berne: 'BE', bern: 'BE', biel: 'BE', bienne: 'BE',
  zurich: 'ZH', zürich: 'ZH',
  bâle: 'BS', basel: 'BS', 'bâle-ville': 'BS',
  lucerne: 'LU', luzern: 'LU',
  'saint-gall': 'SG', 'st-gall': 'SG',
  argovie: 'AG', aarau: 'AG',
  tessin: 'TI', lugano: 'TI', bellinzone: 'TI',
  soleure: 'SO', solothurn: 'SO'
};

function extractCanton(text) {
  // Uppercase code match
  for (const code of CANTON_CODES) {
    const re = new RegExp(`\\b${code}\\b`);
    if (re.test(text)) return code;
  }
  const lower = text.toLowerCase();
  for (const [city, code] of Object.entries(CITY_TO_CANTON)) {
    if (lower.includes(city)) return code;
  }
  return null;
}

function extractDuration(text) {
  const m = text.match(/(\d+)\s*(jour|semaine|mois|an|année|annee)s?/i);
  if (!m) return null;
  return `${m[1]} ${m[2]}${m[1] > 1 ? 's' : ''}`;
}

function extractMontant(text) {
  const m = text.match(/(\d[\d\s.']*)\s*(chf|fr|francs?)\b/i);
  if (!m) return null;
  return `${m[1].replace(/\s+/g, '')} CHF`;
}

function extractDejaFait(text) {
  const actions = [];
  const t = text.toLowerCase();
  if (/mise en demeure/.test(t)) actions.push('mise en demeure');
  if (/opposition/.test(t)) actions.push('opposition');
  if (/plainte/.test(t)) actions.push('plainte');
  if (/lettre recommand/.test(t)) actions.push('lettre recommandée');
  return actions;
}

function extractUrgence(text) {
  return /urgent|urgence|immédiat|immediat|d[éè]lai qui court|expulsion.*prévu|expulsion.*prevu/i.test(text);
}

// ─── Mock callNavigator ──────────────────────────────────────

/**
 * Deterministic mock matching the shape of callNavigator() from llm-navigator.mjs.
 * Returns { navigation, usage } or null (to trigger the real fallback path).
 */
export async function mockCallNavigator(userText, previousAnswers) {
  const text = String(userText || '');
  const lower = text.toLowerCase();

  // Merge previous answers into text so multi-round refinement sees them
  const combined = previousAnswers
    ? text + ' ' + Object.values(previousAnswers).join(' ')
    : text;
  const combinedLower = combined.toLowerCase();

  // Match all rules (keep matches to detect multi-fiche)
  const matches = [];
  for (const rule of ACTIVE_RULES) {
    if (rule.match(combinedLower)) matches.push(rule);
  }

  // Pick primary rule (first match = highest specificity)
  const primary = matches[0];

  // Collect up to 3 fiches across matches (primary first, then secondaries
  // from other domains if multi-domain situation)
  const fichesOrdered = [];
  if (primary) {
    for (const id of primary.fiches) fichesOrdered.push(id);
    // Add from other rules (different domain) for multi_fiches support
    for (const other of matches.slice(1)) {
      if (other.domaine !== primary.domaine) {
        for (const id of other.fiches) {
          if (!fichesOrdered.includes(id) && fichesOrdered.length < 3) {
            fichesOrdered.push(id);
          }
        }
      }
    }
  }

  const canton = extractCanton(combined);
  const duree = extractDuration(combined);
  const montant = extractMontant(combined);
  const dejaFait = extractDejaFait(combined);
  const urgence = extractUrgence(combined);

  const infos_extraites = {
    canton,
    duree,
    montant,
    anciennete: null,
    deja_fait: dejaFait,
    adversaire: null,
    urgence,
    contrat_ecrit: null
  };

  // Build minimal "questions_manquantes" — only if we have a primary match
  // and no answers yet. Kept small and realistic.
  const questions_manquantes = (!primary || previousAnswers) ? [] : buildQuestionsFor(primary, infos_extraites);

  const navigation = primary
    ? {
        fiches_pertinentes: fichesOrdered.slice(0, 3),
        confiance: primary.confiance,
        infos_extraites,
        questions_manquantes,
        multi_fiches: fichesOrdered.length > 1,
        resume_situation: primary.resume,
        _mock_rule: primary.name
      }
    : {
        // No rule matched — return minimal low-confidence navigation
        // which mirrors the LLM saying "I don't know" → triage can
        // fall back to semantic search.
        fiches_pertinentes: [],
        confiance: 'basse',
        infos_extraites,
        questions_manquantes: [],
        multi_fiches: false,
        resume_situation: null,
        _mock_rule: 'no_match'
      };

  const usage = {
    inputTokens: 0,
    outputTokens: 0,
    costCentimes: 0,
    mock: true
  };

  return { navigation, usage };
}

/**
 * Build 1-3 questions based on what's missing. Each question must "change
 * the juridical result" per the system prompt rules — keep them realistic.
 */
function buildQuestionsFor(rule, infos) {
  const qs = [];
  if (!infos.canton) {
    qs.push({
      id: 'q_canton',
      question: 'Dans quel canton êtes-vous ?',
      choix: ['VD', 'GE', 'VS', 'NE', 'FR', 'BE', 'ZH', 'Autre'],
      importance: 'critique',
      pourquoi: 'Détermine l\'autorité compétente et les contacts cantonaux.'
    });
  }
  if (!infos.duree && ['bail_moisissure', 'bail_bruit', 'travail_salaire'].includes(rule.name)) {
    qs.push({
      id: 'q_duree',
      question: 'Depuis combien de temps dure la situation ?',
      choix: ['Moins d\'1 mois', '1-3 mois', '3-6 mois', 'Plus de 6 mois'],
      importance: 'utile',
      pourquoi: 'Change le niveau de gravité et les actions possibles.'
    });
  }
  if (rule.domaine === 'dettes' && !infos.deja_fait.includes('opposition')) {
    qs.push({
      id: 'q_opposition',
      question: 'Avez-vous fait opposition ?',
      choix: ['Oui', 'Non', 'Je ne sais pas'],
      importance: 'critique',
      pourquoi: 'L\'opposition suspend la poursuite (délai 10 jours).'
    });
  }
  return qs.slice(0, 3);
}

export function isMockEnabled() {
  return process.env.LLM_MOCK === '1';
}

// Log once on activation so operators know the mock is live
if (isMockEnabled()) {
  log.info('llm_mock_active', {
    rules: ACTIVE_RULES.length,
    valid_fiche_ids: VALID_IDS.size
  });
}
