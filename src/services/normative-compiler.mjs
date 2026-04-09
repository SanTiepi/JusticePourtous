/**
 * Normative Compiler — Règles juridiques stables en code exécutable
 *
 * Innovation V4 #5: Mini DSL inspiré Catala, compilé vers JS.
 * Le LLM ne "dit" plus le droit — le code l'EXÉCUTE.
 *
 * 4 slices V1:
 *   1. Bail: caution, congé, défaut, augmentation loyer
 *   2. Travail: délai de congé, protection maladie, salaire impayé
 *   3. Dettes: opposition commandement, saisie minimum vital, prescription
 *   4. Transversal: assistance judiciaire
 *
 * Chaque règle: condition → conséquence → exception → source
 * Tout est déterministe et tracé par source_id.
 */

// ─── Rule engine ────────────────────────────────────────────────

/**
 * Execute a rule against facts. Returns the consequence + source chain.
 */
function execRule(rule, facts) {
  const result = {
    rule_id: rule.id,
    label: rule.label,
    applicable: false,
    consequence: null,
    exceptions: [],
    source_ids: rule.source_ids,
    base_legale: rule.base_legale,
    computation: null,
  };

  // Check conditions
  if (!rule.condition(facts)) return result;
  result.applicable = true;

  // Check exceptions
  for (const exc of (rule.exceptions || [])) {
    if (exc.condition(facts)) {
      result.exceptions.push({
        id: exc.id,
        label: exc.label,
        triggered: true,
        consequence: exc.consequence,
        source_id: exc.source_id,
      });
      if (exc.blocks) {
        result.applicable = false;
        result.consequence = exc.consequence;
        return result;
      }
    }
  }

  // Compute consequence
  result.consequence = rule.consequence(facts);
  result.computation = rule.computation?.(facts) || null;

  return result;
}

// ═══════════════════════════════════════════════════════════════
// BAIL RULES
// ═══════════════════════════════════════════════════════════════

const BAIL_RULES = [
  // ─── Caution / garantie ─────────────────────────────────────
  {
    id: 'bail_caution_max',
    label: 'Montant maximal de la garantie de loyer',
    base_legale: 'CO 257e al. 1',
    source_ids: ['fedlex:rs220:co-257e'],
    condition: (f) => f.domaine === 'bail',
    consequence: (f) => ({
      text: 'La garantie ne peut excéder 3 mois de loyer net (hors charges).',
      montant_max: f.loyer_mensuel ? f.loyer_mensuel * 3 : null,
      unite: 'CHF',
    }),
    computation: (f) => f.loyer_mensuel ? `${f.loyer_mensuel} × 3 = ${f.loyer_mensuel * 3} CHF` : null,
    exceptions: [
      {
        id: 'bail_caution_commercial',
        label: 'Bail commercial: pas de limite légale',
        condition: (f) => f.type_bail === 'commercial',
        consequence: 'Pour les locaux commerciaux, il n\'y a pas de limite légale au montant de la garantie.',
        source_id: 'fedlex:rs220:co-257e',
        blocks: true,
      },
    ],
  },
  {
    id: 'bail_caution_restitution_delai',
    label: 'Délai de restitution de la garantie',
    base_legale: 'CO 257e al. 3',
    source_ids: ['fedlex:rs220:co-257e'],
    condition: (f) => f.domaine === 'bail' && f.fin_bail,
    consequence: () => ({
      text: 'Le bailleur a 1 an après la fin du bail pour faire valoir des prétentions. Passé ce délai, la banque doit libérer la garantie.',
      delai: '1 an',
      delai_jours: 365,
      point_depart: 'fin du bail (restitution des locaux)',
    }),
    exceptions: [
      {
        id: 'bail_caution_pretentions',
        label: 'Prétentions du bailleur bloquent la libération',
        condition: (f) => f.pretentions_bailleur,
        consequence: 'Si le bailleur a des prétentions (dégâts, loyers impayés), il peut bloquer la libération en saisissant la commission de conciliation.',
        source_id: 'fedlex:rs220:co-257e',
        blocks: false,
      },
    ],
  },

  // ─── Congé / résiliation ────────────────────────────────────
  {
    id: 'bail_delai_conge',
    label: 'Délai de résiliation du bail',
    base_legale: 'CO 266c-266e',
    source_ids: ['fedlex:rs220:co-266c'],
    condition: (f) => f.domaine === 'bail',
    consequence: (f) => {
      const type = f.type_bail || 'habitation';
      if (type === 'habitation') return { text: 'Délai de congé: 3 mois pour la prochaine échéance usuelle.', delai: '3 mois', terme: f.terme_bail || 'échéance contractuelle' };
      if (type === 'commercial') return { text: 'Délai de congé: 6 mois pour la prochaine échéance usuelle.', delai: '6 mois' };
      if (type === 'chambre_meublee') return { text: 'Délai de congé: 2 semaines pour fin de mois.', delai: '2 semaines' };
      return { text: 'Délai de congé: selon contrat et type de bail.', delai: 'selon contrat' };
    },
    exceptions: [
      {
        id: 'bail_conge_formule_officielle',
        label: 'Formule officielle obligatoire',
        condition: () => true, // always applicable
        consequence: 'Le congé donné au locataire DOIT utiliser la formule officielle cantonale (CO 266l). Un congé sans formule officielle est ANNULABLE.',
        source_id: 'fedlex:rs220:co-266l',
        blocks: false,
      },
    ],
  },
  {
    id: 'bail_contestation_conge',
    label: 'Délai pour contester un congé',
    base_legale: 'CO 273 al. 1',
    source_ids: ['fedlex:rs220:co-273'],
    condition: (f) => f.domaine === 'bail' && f.conge_recu,
    consequence: () => ({
      text: 'Le locataire dispose de 30 jours dès réception du congé pour saisir la commission de conciliation et contester le congé ou demander une prolongation.',
      delai: '30 jours',
      delai_jours: 30,
      point_depart: 'réception du congé',
      autorite: 'Commission de conciliation en matière de bail',
      gratuit: true,
    }),
    exceptions: [],
  },

  // ─── Augmentation loyer ─────────────────────────────────────
  {
    id: 'bail_contestation_augmentation',
    label: 'Délai et conditions pour contester une augmentation',
    base_legale: 'CO 270b',
    source_ids: ['fedlex:rs220:co-270b'],
    condition: (f) => f.domaine === 'bail' && f.augmentation_recue,
    consequence: () => ({
      text: 'Le locataire peut contester l\'augmentation dans les 30 jours dès réception de l\'avis devant la commission de conciliation.',
      delai: '30 jours',
      delai_jours: 30,
      point_depart: 'réception de l\'avis d\'augmentation',
    }),
    exceptions: [],
  },

  // ─── Défaut de la chose louée ───────────────────────────────
  {
    id: 'bail_reduction_defaut',
    label: 'Réduction de loyer pour défaut',
    base_legale: 'CO 259d',
    source_ids: ['fedlex:rs220:co-259d'],
    condition: (f) => f.domaine === 'bail' && f.defaut_signale,
    consequence: (f) => {
      const gravite = f.gravite_defaut || 'moyen';
      const fourchettes = { leger: { min: 5, max: 15 }, moyen: { min: 15, max: 30 }, grave: { min: 30, max: 100 } };
      const range = fourchettes[gravite] || fourchettes.moyen;
      return {
        text: `Pour un défaut ${gravite}, la réduction se situe entre ${range.min}% et ${range.max}% du loyer.`,
        reduction_min: range.min,
        reduction_max: range.max,
        unite: '%',
        condition: 'Dès la signalisation du défaut au bailleur',
      };
    },
    exceptions: [
      {
        id: 'bail_defaut_faute_locataire',
        label: 'Pas de réduction si le défaut est causé par le locataire',
        condition: (f) => f.defaut_faute_locataire,
        consequence: 'Si le défaut est causé par le locataire (ex: moisissure par défaut d\'aération), aucune réduction n\'est due.',
        source_id: 'fedlex:rs220:co-259a',
        blocks: true,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// TRAVAIL RULES
// ═══════════════════════════════════════════════════════════════

const TRAVAIL_RULES = [
  {
    id: 'travail_delai_conge',
    label: 'Délai de congé selon ancienneté',
    base_legale: 'CO 335c',
    source_ids: ['fedlex:rs220:co-335c'],
    condition: (f) => f.domaine === 'travail',
    consequence: (f) => {
      const ans = f.anciennete_annees || 0;
      if (f.periode_essai) return { text: 'Période d\'essai: 7 jours de préavis.', delai: '7 jours', delai_jours: 7 };
      if (ans < 1) return { text: '1ère année: 1 mois de préavis pour fin de mois.', delai: '1 mois', delai_jours: 30 };
      if (ans < 10) return { text: '2e-9e année: 2 mois de préavis pour fin de mois.', delai: '2 mois', delai_jours: 60 };
      return { text: '10+ ans: 3 mois de préavis pour fin de mois.', delai: '3 mois', delai_jours: 90 };
    },
    exceptions: [],
  },
  {
    id: 'travail_protection_maladie',
    label: 'Protection contre le licenciement pendant la maladie',
    base_legale: 'CO 336c al. 1 lit. b',
    source_ids: ['fedlex:rs220:co-336c'],
    condition: (f) => f.domaine === 'travail' && f.en_arret_maladie,
    consequence: (f) => {
      const ans = f.anciennete_annees || 0;
      let jours;
      if (ans < 1) jours = 30;
      else if (ans < 6) jours = 90;
      else jours = 180;
      return {
        text: `Protection de ${jours} jours contre le licenciement pendant l'incapacité de travail.`,
        duree_protection: jours,
        unite: 'jours',
        consequence_violation: 'Un licenciement pendant cette période est NUL (sans effet juridique).',
      };
    },
    exceptions: [
      {
        id: 'travail_maladie_periode_essai',
        label: 'Pas de protection pendant la période d\'essai',
        condition: (f) => f.periode_essai,
        consequence: 'La protection contre le licenciement en cas de maladie ne s\'applique pas pendant le temps d\'essai.',
        source_id: 'fedlex:rs220:co-336c',
        blocks: true,
      },
    ],
  },
  {
    id: 'travail_salaire_impaye_mise_en_demeure',
    label: 'Mise en demeure pour salaire impayé',
    base_legale: 'CO 102, CO 337',
    source_ids: ['fedlex:rs220:co-102', 'fedlex:rs220:co-337'],
    condition: (f) => f.domaine === 'travail' && f.salaire_impaye,
    consequence: () => ({
      text: 'En cas de salaire impayé, le travailleur doit mettre l\'employeur en demeure par écrit avec un délai raisonnable (7-14 jours). Si le salaire n\'est pas versé après la mise en demeure, le travailleur peut résilier avec effet immédiat (CO 337).',
      etapes: [
        { numero: 1, action: 'Mise en demeure écrite (recommandé)', delai: 'immédiatement' },
        { numero: 2, action: 'Fixer un délai de paiement de 7-14 jours', delai: '7-14 jours' },
        { numero: 3, action: 'Si non payé: résiliation immédiate possible', delai: 'après expiration du délai' },
        { numero: 4, action: 'Saisir le tribunal des prud\'hommes', delai: '5 ans (prescription CO 128)' },
      ],
    }),
    exceptions: [],
  },
];

// ═══════════════════════════════════════════════════════════════
// DETTES RULES
// ═══════════════════════════════════════════════════════════════

const DETTES_RULES = [
  {
    id: 'dettes_opposition_commandement',
    label: 'Opposition au commandement de payer',
    base_legale: 'LP 74',
    source_ids: ['fedlex:rs281.1:lp-74'],
    condition: (f) => f.domaine === 'dettes' && f.commandement_recu,
    consequence: () => ({
      text: 'Le débiteur dispose de 10 JOURS dès la notification du commandement de payer pour faire opposition. L\'opposition est gratuite et n\'a pas besoin d\'être motivée.',
      delai: '10 jours',
      delai_jours: 10,
      point_depart: 'notification du commandement de payer',
      gratuit: true,
      forme: 'Déclaration à l\'office des poursuites (oral ou écrit)',
      consequence_non_opposition: 'Sans opposition, le créancier peut requérir la continuation de la poursuite.',
    }),
    exceptions: [],
  },
  {
    id: 'dettes_minimum_vital',
    label: 'Minimum vital insaisissable',
    base_legale: 'LP 93',
    source_ids: ['fedlex:rs281.1:lp-93'],
    condition: (f) => f.domaine === 'dettes' && f.saisie_salaire,
    consequence: (f) => {
      const base = f.canton === 'GE' ? 1350 : 1200;
      const enfants = (f.nombre_enfants || 0);
      const montant = base + (enfants * 400);
      return {
        text: `Le minimum vital insaisissable est de CHF ${montant}/mois (base ${base} + ${enfants} enfant(s) × 400).`,
        minimum_vital: montant,
        base: base,
        supplements_enfants: enfants * 400,
        unite: 'CHF/mois',
        note: f.canton === 'GE' ? 'Genève applique un montant de base plus élevé.' : 'Montant de base standard.',
        supplements_non_inclus: ['loyer effectif', 'primes LAMal', 'frais professionnels'],
      };
    },
    exceptions: [
      {
        id: 'dettes_pension_alimentaire_privilegiee',
        label: 'Pension alimentaire: saisie étendue possible',
        condition: (f) => f.creance_alimentaire,
        consequence: 'Pour les créances alimentaires, le minimum vital peut être entamé (LP 93 al. 2). Le débiteur conserve un minimum absolu.',
        source_id: 'fedlex:rs281.1:lp-93',
        blocks: false,
      },
    ],
  },
  {
    id: 'dettes_prescription',
    label: 'Prescription des dettes',
    base_legale: 'CO 127-128',
    source_ids: ['fedlex:rs220:co-127', 'fedlex:rs220:co-128'],
    condition: (f) => f.domaine === 'dettes',
    consequence: (f) => {
      const type = f.type_dette || 'generale';
      const prescriptions = {
        generale: { delai: '10 ans', base: 'CO 127' },
        loyer: { delai: '5 ans', base: 'CO 128 ch. 1' },
        salaire: { delai: '5 ans', base: 'CO 128 ch. 3' },
        pension: { delai: '5 ans', base: 'CO 128 ch. 2' },
        acte_defaut_biens: { delai: '20 ans', base: 'LP 149a' },
        impots: { delai: '5 ans', base: 'LIFD 120' },
      };
      const p = prescriptions[type] || prescriptions.generale;
      return {
        text: `La prescription pour ce type de dette est de ${p.delai} (${p.base}).`,
        delai: p.delai,
        base_legale_specifique: p.base,
        type_dette: type,
        note: 'La prescription peut être interrompue par un commandement de payer, une reconnaissance de dette, ou une action en justice.',
      };
    },
    exceptions: [],
  },
];

// ═══════════════════════════════════════════════════════════════
// TRANSVERSAL RULES
// ═══════════════════════════════════════════════════════════════

const TRANSVERSAL_RULES = [
  {
    id: 'assistance_judiciaire',
    label: 'Éligibilité à l\'assistance judiciaire',
    base_legale: 'CPC 117-118',
    source_ids: ['fedlex:rs272:cpc-117'],
    condition: (f) => f.demande_assistance_judiciaire || f.revenu_mensuel,
    consequence: (f) => {
      const revenu = f.revenu_mensuel || 0;
      const charges = f.charges_mensuelles || 0;
      const fortune = f.fortune || 0;
      const disponible = revenu - charges;
      const seuil_base = f.canton === 'GE' ? 1600 : 1350;
      const eligible = disponible < seuil_base && fortune < 10000;
      return {
        text: eligible
          ? 'Vous pourriez être éligible à l\'assistance judiciaire (avocat gratuit + dispense de frais).'
          : 'Avec vos revenus actuels, l\'assistance judiciaire pourrait être refusée. Consultez quand même — la décision est cantonale.',
        eligible_probable: eligible,
        revenu_disponible: disponible,
        seuil_cantonal: seuil_base,
        conditions: ['revenus insuffisants', 'fortune modeste', 'cause non dénuée de chances de succès'],
      };
    },
    exceptions: [],
  },
];

// ─── All rules registry ─────────────────────────────────────────

const ALL_RULES = [...BAIL_RULES, ...TRAVAIL_RULES, ...DETTES_RULES, ...TRANSVERSAL_RULES];

// ─── Public API ─────────────────────────────────────────────────

/**
 * Compile all applicable rules for a set of facts.
 * @param {object} facts — extracted from user input + comprehension
 * @returns {object} compiled results with applicable rules + exceptions
 */
export function compile(facts) {
  const results = [];
  for (const rule of ALL_RULES) {
    const result = execRule(rule, facts);
    if (result.applicable || result.exceptions.some(e => e.triggered)) {
      results.push(result);
    }
  }

  return {
    facts_received: Object.keys(facts),
    rules_evaluated: ALL_RULES.length,
    rules_applicable: results.filter(r => r.applicable).length,
    rules_blocked: results.filter(r => !r.applicable && r.exceptions.length > 0).length,
    results,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Get all rules for a domain.
 */
export function getRulesForDomain(domaine) {
  return ALL_RULES.filter(r =>
    r.condition({ domaine }) || r.id.startsWith(domaine)
  );
}

/**
 * Get rule definition (for API / frontend display).
 */
export function getRuleDefinitions() {
  return ALL_RULES.map(r => ({
    id: r.id,
    label: r.label,
    base_legale: r.base_legale,
    source_ids: r.source_ids,
    exceptions: (r.exceptions || []).map(e => ({ id: e.id, label: e.label })),
  }));
}

export { ALL_RULES, BAIL_RULES, TRAVAIL_RULES, DETTES_RULES, TRANSVERSAL_RULES, execRule };
