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

  // ─── Prolongation du bail ───────────────────────────────────
  {
    id: 'bail_prolongation',
    label: 'Prolongation du bail d\'habitation',
    base_legale: 'CO 272-272c',
    source_ids: ['fedlex:rs220:co-272', 'fedlex:rs220:co-272a', 'fedlex:rs220:co-272b', 'fedlex:rs220:co-272c'],
    condition: (f) => f.domaine === 'bail' && (f.prolongation_demandee || f.conge_recu),
    consequence: (f) => ({
      text: 'Le locataire peut demander une prolongation du bail en cas de congé causant des conséquences pénibles, si l\'intérêt du bailleur ne s\'y oppose pas.',
      delai_saisine: '30 jours dès réception du congé',
      delai_jours_saisine: 30,
      duree_max_habitation: '4 ans',
      duree_max_commercial: '6 ans',
      type_bail: f.type_bail || 'habitation',
      autorite: 'Commission de conciliation en matière de bail',
      gratuit: true,
      nombre_prolongations: 'La prolongation peut être accordée une ou deux fois (CO 272b al. 1).',
      critere: 'Pesée d\'intérêts : pénibilité pour le locataire vs. intérêt du bailleur.',
    }),
    exceptions: [
      {
        id: 'bail_prolongation_exclue_defaut_paiement',
        label: 'Pas de prolongation si congé pour défaut de paiement',
        condition: (f) => f.motif_conge === 'defaut_paiement' || f.motif_conge === 'demeure',
        consequence: 'La prolongation est exclue en cas de résiliation pour demeure du locataire (CO 272a al. 1 let. a).',
        source_id: 'fedlex:rs220:co-272a',
        blocks: true,
      },
      {
        id: 'bail_prolongation_exclue_violation_devoirs',
        label: 'Pas de prolongation si violation grave des devoirs',
        condition: (f) => f.motif_conge === 'violation_devoirs' || f.motif_conge === 'manquement_grave',
        consequence: 'La prolongation est exclue en cas de violation grave des devoirs du locataire (CO 272a al. 1 let. b).',
        source_id: 'fedlex:rs220:co-272a',
        blocks: true,
      },
    ],
  },

  // ─── Sous-location ──────────────────────────────────────────
  {
    id: 'bail_sous_location',
    label: 'Droit à la sous-location',
    base_legale: 'CO 262',
    source_ids: ['fedlex:rs220:co-262'],
    condition: (f) => f.domaine === 'bail' && f.sous_location,
    consequence: () => ({
      text: 'Le locataire peut sous-louer tout ou partie de la chose avec le consentement du bailleur. Le bailleur ne peut refuser son consentement qu\'à des conditions strictes.',
      consentement: 'Consentement écrit du bailleur recommandé',
      motifs_refus_legaux: [
        'Refus du locataire de communiquer les conditions de la sous-location',
        'Conditions abusives par rapport à celles du bail principal',
        'Inconvénients majeurs pour le bailleur',
      ],
      forme_demande: 'Lettre recommandée au bailleur avec nom du sous-locataire, durée, loyer',
      delai_reponse: 'Bailleur doit répondre dans un délai raisonnable (typiquement 30 jours)',
      consequence_refus_injustifie: 'Le locataire peut saisir la commission de conciliation si le refus est injustifié.',
    }),
    exceptions: [
      {
        id: 'bail_sous_location_sans_consentement',
        label: 'Sous-location sans consentement = motif de résiliation',
        condition: (f) => f.sous_location_sans_consentement,
        consequence: 'Sous-louer sans demander le consentement constitue un manquement pouvant justifier une résiliation ordinaire (voire extraordinaire si grave).',
        source_id: 'fedlex:rs220:co-262',
        blocks: false,
      },
    ],
  },

  // ─── Intérêt de la garantie de loyer ────────────────────────
  {
    id: 'bail_caution_interets',
    label: 'Intérêts de la garantie de loyer',
    base_legale: 'CO 257e al. 2',
    source_ids: ['fedlex:rs220:co-257e'],
    condition: (f) => f.domaine === 'bail' && (f.caution_deposee || f.fin_bail),
    consequence: () => ({
      text: 'La garantie doit être déposée sur un compte d\'épargne bancaire au nom du locataire. Les intérêts reviennent au locataire.',
      forme_depot: 'Compte bancaire bloqué au nom du locataire',
      interets_beneficiaire: 'Locataire',
      liberation: 'Accord écrit du bailleur OU commandement de payer non frappé d\'opposition OU jugement',
      prescription_pretentions: '1 an après fin du bail (CO 257e al. 3)',
      recuperation_directe: 'Si bailleur n\'agit pas dans l\'année, la banque libère sur simple demande du locataire.',
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
    id: 'travail_certificat_travail',
    label: 'Droit au certificat de travail',
    base_legale: 'CO 330a',
    source_ids: ['fedlex:rs220:co-330a'],
    condition: (f) => f.domaine === 'travail' && (f.certificat_travail || f.fin_emploi),
    consequence: () => ({
      text: 'Le travailleur peut en tout temps demander à l\'employeur un certificat portant sur la nature et la durée des rapports de travail, la qualité de son travail et sa conduite.',
      types: [
        { type: 'certificat_complet', contenu: 'Nature + durée + qualité travail + conduite' },
        { type: 'certificat_simple', contenu: 'Nature et durée uniquement (sur demande explicite du travailleur)' },
      ],
      principes: ['véracité', 'bienveillance', 'complétude'],
      droit_rectification: 'Le travailleur peut exiger la rectification d\'un certificat inexact ou ambigu. Action possible devant le tribunal des prud\'hommes.',
      prescription: '10 ans (CO 127) pour l\'action en délivrance; en pratique recommandée dans les 1-2 ans après la fin du contrat.',
    }),
    exceptions: [],
  },
  {
    id: 'travail_heures_supplementaires',
    label: 'Compensation des heures supplémentaires',
    base_legale: 'CO 321c',
    source_ids: ['fedlex:rs220:co-321c'],
    condition: (f) => f.domaine === 'travail' && f.heures_supplementaires,
    consequence: (f) => {
      const heures = Number.isFinite(f.nombre_heures_sup) ? f.nombre_heures_sup : null;
      const taux_horaire = Number.isFinite(f.taux_horaire) ? f.taux_horaire : null;
      const indemnite = (heures !== null && taux_horaire !== null) ? Math.round(heures * taux_horaire * 1.25) : null;
      return {
        text: 'L\'employeur doit compenser les heures supplémentaires soit par un congé équivalent (avec accord du travailleur), soit par le versement du salaire majoré de 25%.',
        compensation_par_defaut: 'Salaire + supplément 25% (sauf accord écrit contraire)',
        taux_majoration: '125%',
        compensation_alternative: 'Congé équivalent en temps, mais uniquement avec l\'accord du travailleur',
        exception_convention: 'Un accord écrit ou une CCT peut déroger (par ex. supprimer le supplément pour cadres).',
        heures_declarees: heures,
        indemnite_estimee_chf: indemnite,
        prescription: '5 ans (CO 128 ch. 3)',
      };
    },
    exceptions: [
      {
        id: 'travail_heures_sup_renonciation_ecrite',
        label: 'Renonciation écrite au supplément (sauf LTr)',
        condition: (f) => f.accord_ecrit_pas_supplement === true,
        consequence: 'Le supplément peut être supprimé par accord écrit, CCT ou contrat-type (CO 321c al. 3). Mais les heures supplémentaires au sens de la LTr (>45h ou >50h) donnent toujours droit à un supplément de 25% minimum.',
        source_id: 'fedlex:rs220:co-321c',
        blocks: false,
      },
    ],
  },
  {
    id: 'travail_resiliation_abusive',
    label: 'Indemnité pour résiliation abusive',
    base_legale: 'CO 336-336a',
    source_ids: ['fedlex:rs220:co-336', 'fedlex:rs220:co-336a'],
    condition: (f) => f.domaine === 'travail' && f.conge_abusif,
    consequence: (f) => {
      const salaire = Number.isFinite(f.salaire_mensuel) ? f.salaire_mensuel : null;
      const indemnite_max = salaire ? salaire * 6 : null;
      return {
        text: 'En cas de résiliation abusive (motif discriminatoire, représailles, bonne foi), la partie qui a reçu le congé a droit à une indemnité jusqu\'à 6 mois de salaire.',
        indemnite_max_mois: 6,
        indemnite_max_chf: indemnite_max,
        delai_opposition: '60 jours au maximum avant la fin du délai de congé, par écrit',
        delai_jours_action: 180,
        delai_action: '180 jours après la fin des rapports de travail pour saisir le tribunal',
        motifs_typiques: [
          'Appartenance à un syndicat',
          'Exercice d\'un droit constitutionnel',
          'Plainte interne de bonne foi (CO 336 al. 1 let. d)',
          'Représailles suite à accident LAA / maladie',
          'Service militaire / obligation légale',
        ],
        autorite: 'Tribunal des prud\'hommes',
        condition_prealable: 'Opposition écrite au congé avant la fin du délai de résiliation (CO 336b).',
      };
    },
    exceptions: [
      {
        id: 'travail_resiliation_abusive_pas_opposition',
        label: 'Indemnité perdue sans opposition écrite préalable',
        condition: (f) => f.opposition_conge_ecrite === false,
        consequence: 'À défaut d\'opposition écrite avant la fin du délai de congé, la prétention en indemnité est perdue (CO 336b al. 1).',
        source_id: 'fedlex:rs220:co-336b',
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
    id: 'dettes_continuation_poursuite',
    label: 'Continuation de la poursuite après levée d\'opposition',
    base_legale: 'LP 88',
    source_ids: ['fedlex:rs281.1:lp-88'],
    condition: (f) => f.domaine === 'dettes' && (f.opposition_levee || f.mainlevee_prononcee),
    consequence: () => ({
      text: 'Lorsque la poursuite n\'est pas arrêtée par une opposition, le créancier peut requérir la continuation de la poursuite. Le délai court dès la levée d\'opposition ou la notification du commandement non frappé d\'opposition.',
      delai_min: '20 jours après notification du commandement de payer',
      delai_min_jours: 20,
      delai_max: '1 an dès la notification du commandement de payer',
      delai_max_jours: 365,
      point_depart: 'Notification du commandement ou entrée en force du jugement de mainlevée',
      consequence_passe_delai: 'Le commandement de payer devient caduc; il faut relancer une nouvelle poursuite.',
      suite: 'L\'office procède à la saisie (LP 89) ou à la faillite (LP 159) selon le mode de poursuite.',
    }),
    exceptions: [],
  },
  {
    id: 'dettes_saisie_revenu_csias',
    label: 'Saisie de revenu — minimum vital élargi (CSIAS + frais effectifs)',
    base_legale: 'LP 93 + Normes CSIAS + pratique cantonale',
    source_ids: ['fedlex:rs281.1:lp-93', 'csias:normes:minimum-vital-saisie'],
    condition: (f) => f.domaine === 'dettes' && f.saisie_revenu === true,
    consequence: (f) => {
      const base = f.canton === 'GE' ? 1350 : 1200;
      const enfants = (f.nombre_enfants || 0);
      const loyer = Number.isFinite(f.loyer_effectif) ? f.loyer_effectif : 0;
      const lamal = Number.isFinite(f.prime_lamal) ? f.prime_lamal : 0;
      const frais_pro = Number.isFinite(f.frais_professionnels) ? f.frais_professionnels : 0;
      const total = base + (enfants * 400) + loyer + lamal + frais_pro;
      return {
        text: `Le minimum vital pour la saisie comprend le forfait d'entretien (${base} CHF base + ${enfants * 400} enfants), le loyer effectif, les primes LAMal, et les frais professionnels indispensables.`,
        composantes: {
          forfait_base_chf: base,
          supplements_enfants_chf: enfants * 400,
          loyer_effectif_chf: loyer,
          prime_lamal_chf: lamal,
          frais_professionnels_chf: frais_pro,
        },
        total_minimum_vital_chf: total,
        part_saisissable: 'Revenu mensuel net − minimum vital total = quotité saisissable',
        duree_saisie_max: '1 an (LP 93 al. 2), renouvelable après procès-verbal',
        note_cantonale: 'Les offices cantonaux appliquent les Normes CSIAS et les directives cantonales. Des suppléments peuvent s\'ajouter (primes assurances complémentaires, pension, etc.).',
      };
    },
    exceptions: [
      {
        id: 'dettes_saisie_alimentaire_etendue',
        label: 'Créance alimentaire: saisie pouvant entamer le minimum vital',
        condition: (f) => f.creance_alimentaire === true,
        consequence: 'Pour les créances d\'aliments courants des 12 derniers mois, le minimum vital peut être entamé (LP 93 al. 3 et jurisprudence), dans les limites du minimum absolu.',
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

// ═══════════════════════════════════════════════════════════════
// CONSOMMATION RULES
// ═══════════════════════════════════════════════════════════════

const CONSOMMATION_RULES = [
  {
    id: 'consommation_garantie_legale',
    label: 'Garantie légale des défauts (vente)',
    base_legale: 'CO 197-210',
    source_ids: ['fedlex:rs220:co-197'],
    condition: (f) => f.domaine === 'consommation' && f.achat_defectueux,
    consequence: (f) => {
      const delaiSignalement = f.achat_neuf ? '2 ans' : '1 an (usage)';
      return {
        text: `L'acheteur doit signaler le défaut immédiatement après sa découverte. La prescription est de ${delaiSignalement} dès la livraison.`,
        delai_signalement: 'immédiat (dès découverte)',
        prescription: delaiSignalement,
        droits: ['réduction du prix (CO 205)', 'résolution de la vente (CO 205)', 'remplacement si chose de genre (CO 206)'],
        condition_prealable: 'Le défaut ne doit pas avoir été connu à l\'achat.',
      };
    },
    computation: (f) => f.prix_achat ? `Prix payé: ${f.prix_achat} CHF — remboursement partiel ou total possible` : null,
    exceptions: [
      {
        id: 'consommation_garantie_exclue_connue',
        label: 'Défaut connu à l\'achat',
        condition: (f) => f.defaut_connu_achat,
        consequence: 'Si l\'acheteur connaissait le défaut au moment de l\'achat, il ne peut plus s\'en prévaloir (CO 200).',
        source_id: 'fedlex:rs220:co-200',
        blocks: true,
      },
    ],
  },
  {
    id: 'consommation_droit_revocation_demarchage',
    label: 'Droit de révocation (démarchage à domicile)',
    base_legale: 'CO 40a-40g',
    source_ids: ['fedlex:rs220:co-40a'],
    condition: (f) => f.domaine === 'consommation' && f.demarchage_domicile,
    consequence: () => ({
      text: 'En cas de démarchage à domicile ou de contrat conclu dans des circonstances similaires (foire, rue), le consommateur dispose de 14 jours pour révoquer le contrat.',
      delai: '14 jours',
      delai_jours: 14,
      point_depart: 'réception de la chose ou conclusion du contrat',
      forme: 'Déclaration écrite (pas de motivation nécessaire)',
      consequence: 'Le vendeur doit restituer le prix payé.',
    }),
    exceptions: [
      {
        id: 'consommation_revocation_montant_min',
        label: 'Pas de révocation sous CHF 100',
        condition: (f) => f.prix_achat && f.prix_achat < 100,
        consequence: 'Le droit de révocation ne s\'applique pas aux contrats portant sur moins de CHF 100 (CO 40a al. 2).',
        source_id: 'fedlex:rs220:co-40a',
        blocks: true,
      },
    ],
  },
  {
    id: 'consommation_retard_livraison',
    label: 'Retard de livraison — droits de l\'acheteur',
    base_legale: 'CO 107-109',
    source_ids: ['fedlex:rs220:co-107'],
    condition: (f) => f.domaine === 'consommation' && f.retard_livraison,
    consequence: () => ({
      text: 'En cas de retard de livraison, l\'acheteur doit fixer un délai supplémentaire raisonnable par écrit. Passé ce délai, il peut renoncer à la livraison et demander des dommages-intérêts, ou maintenir sa demande.',
      etapes: [
        { numero: 1, action: 'Mise en demeure écrite avec délai supplémentaire', delai: 'raisonnable (7-30 jours selon l\'objet)' },
        { numero: 2, action: 'Si toujours pas livré: choix entre résolution ou exécution', delai: 'après expiration du délai' },
      ],
    }),
    exceptions: [],
  },
];

// ═══════════════════════════════════════════════════════════════
// ASSURANCES RULES
// ═══════════════════════════════════════════════════════════════

const ASSURANCES_RULES = [
  {
    id: 'assurance_lamal_subsides',
    label: 'Droit aux subsides LAMal',
    base_legale: 'LAMal 65',
    source_ids: ['fedlex:rs832.10:lamal-65'],
    condition: (f) => f.domaine === 'assurances' && f.difficulte_primes_lamal,
    consequence: (f) => ({
      text: 'Les personnes de condition économique modeste ont droit à des subsides cantonaux pour réduire leurs primes d\'assurance-maladie.',
      demarche: f.canton
        ? `Contacter le service des subsides du canton de ${f.canton}.`
        : 'Contacter le service cantonal des subsides LAMal.',
      delai: 'Demande possible en tout temps',
      retroactivite: 'Certains cantons accordent des subsides rétroactifs (max. 5 ans).',
    }),
    exceptions: [],
  },
  {
    id: 'assurance_contestation_decision',
    label: 'Opposition à une décision d\'assurance sociale',
    base_legale: 'LPGA 52',
    source_ids: ['fedlex:rs830.1:lpga-52'],
    condition: (f) => f.domaine === 'assurances' && f.decision_assurance_contestee,
    consequence: () => ({
      text: 'Toute décision d\'un assureur social (AI, AVS, LAA, etc.) peut être contestée par opposition dans les 30 jours.',
      delai: '30 jours',
      delai_jours: 30,
      point_depart: 'notification de la décision',
      forme: 'Opposition écrite et motivée à l\'assureur qui a rendu la décision',
      gratuit: true,
      etape_suivante: 'Si l\'opposition est rejetée: recours au tribunal cantonal des assurances dans les 30 jours.',
    }),
    exceptions: [],
  },
  {
    id: 'assurance_lamal_refus_prestations',
    label: 'Opposition au refus de prestations LAMal',
    base_legale: 'LAMal 56-60 + LPGA 52',
    source_ids: ['fedlex:rs832.10:lamal-56', 'fedlex:rs832.10:lamal-60', 'fedlex:rs830.1:lpga-52'],
    condition: (f) => f.domaine === 'assurances' && (f.refus_lamal || f.decision_lamal),
    consequence: () => ({
      text: 'En cas de refus de prise en charge par l\'assureur LAMal (traitement, médicament, hospitalisation), le patient peut former opposition dans les 30 jours.',
      delai_opposition: '30 jours',
      delai_jours: 30,
      point_depart: 'notification de la décision de refus',
      forme: 'Opposition écrite et motivée à l\'assureur',
      gratuit: true,
      motifs_typiques_refus: [
        'Prestation jugée non économique (LAMal 56)',
        'Traitement non inscrit au catalogue des prestations',
        'Absence d\'efficacité / appropriation / économicité (EAE)',
      ],
      etape_suivante: 'Si l\'opposition est rejetée, recours au tribunal cantonal des assurances dans les 30 jours.',
      suivi: 'Tribunal fédéral en dernière instance (LTF 95).',
    }),
    exceptions: [],
  },
  {
    id: 'assurance_laa_refus_ij',
    label: 'Opposition au refus d\'indemnité journalière LAA',
    base_legale: 'LAA 66 + LPGA 52',
    source_ids: ['fedlex:rs832.20:laa-66', 'fedlex:rs830.1:lpga-52'],
    condition: (f) => f.domaine === 'assurances' && (f.refus_laa || f.refus_ij_accident),
    consequence: () => ({
      text: 'Le refus de l\'indemnité journalière LAA (SUVA ou assureur privé) peut être contesté par opposition dans les 30 jours.',
      delai_opposition: '30 jours',
      delai_jours: 30,
      point_depart: 'notification de la décision',
      forme: 'Opposition écrite et motivée à l\'assureur (SUVA / assureur LAA privé)',
      gratuit: true,
      taux_ij: '80% du gain assuré dès le 3e jour qui suit celui de l\'accident (LAA 17)',
      contestation_frequente: [
        'Lien de causalité accident-atteinte nié',
        'Atteinte considérée comme état antérieur (maladie)',
        'Capacité de travail estimée supérieure à la réalité',
      ],
      etape_suivante: 'Recours au tribunal cantonal des assurances dans les 30 jours si décision sur opposition défavorable.',
    }),
    exceptions: [],
  },
  {
    id: 'assurance_accident_delai_annonce',
    label: 'Délai d\'annonce d\'un accident professionnel',
    base_legale: 'LAA 45, OLAA 53',
    source_ids: ['fedlex:rs832.20:laa-45'],
    condition: (f) => f.domaine === 'assurances' && f.accident_professionnel,
    consequence: () => ({
      text: 'L\'accident doit être annoncé immédiatement à l\'employeur, qui le transmet à l\'assurance-accidents. L\'employeur a 3 jours pour annoncer.',
      delai_employeur: '3 jours dès connaissance de l\'accident',
      delai_travailleur: 'immédiatement',
      consequence_retard: 'Un retard d\'annonce peut réduire les prestations si l\'assureur subit un préjudice.',
      prestations: ['frais médicaux 100%', 'indemnité journalière 80% du salaire', 'rente invalidité si séquelles'],
    }),
    exceptions: [],
  },
];

// ═══════════════════════════════════════════════════════════════
// VOISINAGE RULES
// ═══════════════════════════════════════════════════════════════

const VOISINAGE_RULES = [
  {
    id: 'voisinage_immissions_excessives',
    label: 'Protection contre les immissions excessives',
    base_legale: 'CC 684',
    source_ids: ['fedlex:rs210:cc-684'],
    condition: (f) => f.domaine === 'voisinage' || (f.domaine === 'bail' && f.nuisance_voisin),
    consequence: () => ({
      text: 'La propriété est grevée d\'une interdiction d\'émettre des immissions excessives (bruit, fumée, odeurs, vibrations). Le voisin lésé peut agir en cessation et en dommages-intérêts.',
      demarche: 'Action civile au tribunal de district/arrondissement',
      mesures_provisionnelles: 'Possibilité de mesures superprovisionnelles en cas d\'urgence',
      preuve: 'Documenter les nuisances (journal, photos, témoignages, mesures de décibels)',
    }),
    exceptions: [
      {
        id: 'voisinage_immissions_usage_local',
        label: 'Tolérance selon usage local',
        condition: (f) => f.zone_industrielle || f.zone_agricole,
        consequence: 'En zone industrielle ou agricole, le seuil de tolérance est plus élevé (CC 684 al. 2).',
        source_id: 'fedlex:rs210:cc-684',
        blocks: false,
      },
    ],
  },
  {
    id: 'voisinage_arbres_distance',
    label: 'Distance des plantations à la limite',
    base_legale: 'CC 687',
    source_ids: ['fedlex:rs210:cc-687'],
    condition: (f) => f.domaine === 'voisinage' && f.probleme_plantations,
    consequence: (f) => ({
      text: 'Le droit cantonal fixe les distances minimales pour les plantations. En l\'absence de règle cantonale, les arbres de haute tige doivent être à 5m de la limite, les autres à 0.5m.',
      distance_haute_tige: '5 mètres (à défaut de droit cantonal)',
      distance_autres: '0.5 mètre (à défaut de droit cantonal)',
      note: f.canton ? `Vérifier le droit cantonal de ${f.canton} qui peut prévoir des distances différentes.` : 'Le droit cantonal prime.',
      action: 'Demander l\'arrachage ou l\'élagage si les distances ne sont pas respectées.',
    }),
    exceptions: [],
  },
  {
    id: 'voisinage_droit_passage',
    label: 'Droit de passage nécessaire',
    base_legale: 'CC 694',
    source_ids: ['fedlex:rs210:cc-694'],
    condition: (f) => f.domaine === 'voisinage' && f.enclave,
    consequence: () => ({
      text: 'Le propriétaire qui n\'a pas d\'accès suffisant à la voie publique peut exiger un droit de passage sur le fonds voisin, contre pleine indemnité.',
      conditions: ['pas d\'accès suffisant à la voie publique', 'nécessité effective', 'indemnité au voisin'],
      forme: 'Accord amiable ou action au tribunal',
      inscription: 'Servitude inscrite au registre foncier',
    }),
    exceptions: [],
  },
];

// ═══════════════════════════════════════════════════════════════
// PHASE 5 — DOMAIN EXTENSIONS (famille / etrangers / social / violence / accident / entreprise)
// ═══════════════════════════════════════════════════════════════

const FAMILLE_RULES = [
  {
    id: 'famille_pension_enfant',
    label: 'Pension alimentaire enfant — fourchette indicative',
    base_legale: 'CC 276 al. 1 / 285',
    source_ids: ['fedlex:rs210:cc-276', 'fedlex:rs210:cc-285'],
    condition: (f) => f.domaine === 'famille' && f.type_pension === 'enfant',
    consequence: (f) => {
      // Tableaux indicatifs (méthode des coûts effectifs Bundesgericht 2017, valeurs courantes)
      // Ces valeurs sont des FOURCHETTES, pas des montants stricts (le juge peut s'écarter).
      const enfants = Number.isFinite(f.enfants_a_charge) ? f.enfants_a_charge : 1;
      const par_enfant = { min: 600, mediane: 850, max: 1200 };
      return {
        text: 'Le montant dépend des besoins de l\'enfant et de la capacité du débirentier. Fourchette indicative par enfant (entretien convenable).',
        enfants_consideres: enfants,
        par_enfant_chf: par_enfant,
        fourchette_mensuelle_chf: {
          min: par_enfant.min * enfants,
          mediane: par_enfant.mediane * enfants,
          max: par_enfant.max * enfants,
        },
        note: 'Le minimum vital du débirentier est intangible (CC 285 al. 2 + jurisprudence TF).',
      };
    },
    exceptions: [
      {
        id: 'famille_pension_capacite_insuffisante',
        label: 'Capacité contributive insuffisante (minimum vital non respecté)',
        condition: (f) => f.minimum_vital_respecte === false,
        consequence: 'Si le débirentier ne dispose pas du minimum vital, la pension peut être réduite ou suspendue (CC 285 + jurisprudence).',
        source_id: 'fedlex:rs210:cc-285',
        blocks: false,
      },
    ],
  },
  {
    id: 'famille_entretien_post_divorce',
    label: 'Contribution d\'entretien après divorce (ex-conjoint)',
    base_legale: 'CC 125',
    source_ids: ['fedlex:rs210:cc-125'],
    condition: (f) => f.domaine === 'famille' && (f.divorce || f.type_pension === 'conjoint'),
    consequence: (f) => {
      const duree = Number.isFinite(f.duree_mariage_annees) ? f.duree_mariage_annees : null;
      const mariage_lebenspraegend = duree !== null && duree >= 10;
      return {
        text: 'Après le divorce, une contribution d\'entretien peut être allouée à l\'ex-conjoint qui ne peut raisonnablement pourvoir lui-même à son entretien convenable.',
        critere_principal: 'Le mariage a-t-il marqué durablement la vie de l\'époux créancier (« lebenspraegend ») ?',
        duree_mariage_annees: duree,
        mariage_lebenspraegend_probable: mariage_lebenspraegend,
        criteres_ponderables: [
          'Durée du mariage',
          'Répartition des tâches pendant le mariage',
          'Âge et état de santé des époux',
          'Revenu et fortune des époux',
          'Étendue et durée de la prise en charge des enfants',
          'Formation et perspectives de gain',
          'Expectatives LPP / AVS',
        ],
        methode: 'Méthode en deux étapes du TF (ATF 147 III 265) : minimum vital + répartition excédent.',
        duree_typique: duree && duree >= 20 ? 'Souvent jusqu\'à l\'âge AVS (contribution durable)' : 'Limitée dans le temps (réinsertion)',
        minimum_vital_debirentier: 'Intangible (jurisprudence constante).',
        modification: 'Modification possible en cas de changement notable et durable des circonstances (CC 129).',
      };
    },
    exceptions: [
      {
        id: 'famille_entretien_concubinage_qualifie',
        label: 'Concubinage stable du créancier = suppression possible',
        condition: (f) => f.concubinage_stable === true,
        consequence: 'Un concubinage stable (5 ans) du créancier peut entraîner la suppression de la contribution (ATF 124 III 52).',
        source_id: 'fedlex:rs210:cc-125',
        blocks: false,
      },
    ],
  },
  {
    id: 'famille_mesures_protectrices_union',
    label: 'Mesures protectrices de l\'union conjugale',
    base_legale: 'CC 172-179',
    source_ids: ['fedlex:rs210:cc-172', 'fedlex:rs210:cc-176'],
    condition: (f) => f.domaine === 'famille' && (f.separation || f.mesures_protectrices),
    consequence: (f) => ({
      text: 'En cas de crise conjugale (violence, séparation, désaccord grave), un époux peut saisir le juge pour obtenir des mesures protectrices (attribution du domicile, garde des enfants, contribution d\'entretien, séparation des biens).',
      autorite: 'Juge civil du domicile (tribunal de district / d\'arrondissement)',
      procedure: 'Procédure sommaire (CPC 271) — rapide, contradictoire',
      urgence: f.urgence === true ? 'Mesures superprovisionnelles possibles en cas d\'urgence (CPC 265) — sans audition préalable' : 'Audition contradictoire habituelle',
      objets_possibles: [
        'Attribution du logement conjugal (CC 176 al. 1 ch. 2)',
        'Attribution de la garde et droit de visite (CC 176 al. 3)',
        'Contribution d\'entretien famille et conjoint (CC 176 al. 1 ch. 1)',
        'Séparation des biens (CC 176 al. 1 ch. 3)',
        'Avis au débiteur (CC 177)',
      ],
      delai_urgence: f.urgence ? 'Superprovisionnelles : jours (audition reportée)' : 'Provisionnelles : 2-8 semaines typique',
      duree_validite: 'Jusqu\'à modification ou reprise de la vie commune ou divorce',
    }),
    exceptions: [],
  },
  {
    id: 'famille_autorite_parentale_conjointe',
    label: 'Autorité parentale conjointe par défaut',
    base_legale: 'CC 296 al. 2',
    source_ids: ['fedlex:rs210:cc-296'],
    condition: (f) => f.domaine === 'famille' && f.type_question === 'autorite_parentale',
    consequence: () => ({
      text: 'Depuis 2014, l\'autorité parentale conjointe est la règle, même hors mariage et après divorce.',
      regle: 'conjointe par défaut',
      derogation: 'Le juge peut attribuer l\'autorité à un seul parent si l\'intérêt de l\'enfant le commande.',
    }),
    exceptions: [],
  },
];

const ETRANGERS_RULES = [
  {
    id: 'etrangers_permis_renouvellement_delai',
    label: 'Délai recommandé pour le renouvellement du permis B',
    base_legale: 'LEtr/LEI 33 + pratique cantonale',
    source_ids: ['fedlex:rs142.20:lei-33'],
    condition: (f) => f.domaine === 'etrangers' && f.type_permis === 'B' && f.renouvellement === true,
    consequence: (f) => ({
      text: 'Déposer la demande de renouvellement environ 3 mois avant l\'expiration du permis.',
      delai_recommande: '3 mois avant expiration',
      autorite_competente: f.canton
        ? `Service de la population / migration du canton de ${f.canton}`
        : 'Service cantonal de la population (canton de domicile)',
    }),
    exceptions: [],
  },
  {
    id: 'etrangers_regroupement_familial',
    label: 'Regroupement familial — délai et conditions',
    base_legale: 'LEI 43-44',
    source_ids: ['fedlex:rs142.20:lei-43', 'fedlex:rs142.20:lei-44'],
    condition: (f) => f.domaine === 'etrangers' && f.regroupement_familial,
    consequence: (f) => {
      const permis = f.type_permis || null;
      const delai_principal = '12 mois dès octroi du permis ou du lien familial';
      const delai_enfants_12plus = permis === 'C'
        ? '5 ans dès octroi du permis OU 12 mois après le 12e anniversaire si survient plus tard'
        : '5 ans dès octroi du permis OU 12 mois après le 12e anniversaire';
      return {
        text: 'Les ressortissants étrangers titulaires d\'un permis B ou C peuvent obtenir le regroupement familial pour leur conjoint et leurs enfants mineurs, dans certains délais.',
        type_permis_requerant: permis,
        delai_principal: delai_principal,
        delai_enfants_plus_12_ans: delai_enfants_12plus,
        conditions_cumulatives: [
          'Logement approprié à la taille de la famille',
          'Moyens financiers suffisants (pas d\'aide sociale)',
          'Volonté et capacité à communiquer (langue nationale, pour conjoint permis B dès 2019)',
          'Absence de motif de révocation (condamnations, aide sociale)',
        ],
        consequence_delai_depasse: 'Regroupement différé possible uniquement pour « raisons familiales majeures » (LEI 47 al. 4) — intérêt supérieur de l\'enfant, changement notable.',
        autorite: f.canton
          ? `Service de la population / migration du canton de ${f.canton}`
          : 'Service cantonal des migrations, avec approbation SEM',
        recours: 'Recours cantonal 30 jours, puis Tribunal administratif fédéral',
      };
    },
    exceptions: [
      {
        id: 'etrangers_regroupement_permis_b_conjoint_attente',
        label: 'Permis B : regroupement soumis à conditions renforcées',
        condition: (f) => f.type_permis === 'B',
        consequence: 'Pour les titulaires d\'un permis B, le regroupement familial est possible mais non un droit absolu (LEI 44). Refus possible si conditions non remplies, sous réserve de l\'art. 8 CEDH.',
        source_id: 'fedlex:rs142.20:lei-44',
        blocks: false,
      },
    ],
  },
  {
    id: 'etrangers_revocation_permis',
    label: 'Révocation du permis de séjour — motifs et procédure',
    base_legale: 'LEI 62-63',
    source_ids: ['fedlex:rs142.20:lei-62', 'fedlex:rs142.20:lei-63'],
    condition: (f) => f.domaine === 'etrangers' && (f.revocation_permis || f.menace_revocation),
    consequence: (f) => ({
      text: 'L\'autorité peut révoquer un permis B ou C en cas de motifs graves. Le droit d\'être entendu (audition préalable) doit être respecté.',
      motifs_permis_b_lei62: [
        'Condamnation à une peine privative de liberté de longue durée (jurisp. : >1 an)',
        'Atteinte grave ou répétée à la sécurité et l\'ordre publics',
        'Dépendance durable et importante à l\'aide sociale',
        'Fausses déclarations / dissimulation de faits essentiels',
        'Non-respect d\'une convention d\'intégration',
      ],
      motifs_permis_c_lei63: [
        'Condamnation à peine privative de liberté de longue durée',
        'Atteinte très grave à la sécurité et l\'ordre publics',
        'Dépendance durable et importante à l\'aide sociale (si <15 ans de séjour)',
      ],
      procedure: [
        '1. Information des motifs envisagés',
        '2. Droit d\'être entendu (audition ou prise de position écrite, délai 30 jours)',
        '3. Décision motivée et notifiée',
        '4. Délai de recours 30 jours',
      ],
      autorite: f.canton
        ? `Service de la population / migration du canton de ${f.canton}`
        : 'Service cantonal des migrations',
      recours: 'Recours cantonal 30 jours, puis Tribunal administratif fédéral (TAF), puis TF',
      examen_proportionnalite: 'Pesée d\'intérêts obligatoire : durée du séjour, intégration, liens familiaux (art. 8 CEDH), gravité des faits.',
    }),
    exceptions: [],
  },
  {
    id: 'etrangers_asile_recours_delai',
    label: 'Délai de recours en matière d\'asile',
    base_legale: 'LAsi 108',
    source_ids: ['fedlex:rs142.31:lasi-108'],
    condition: (f) => f.domaine === 'etrangers' && f.type_procedure === 'asile',
    consequence: (f) => {
      const acc = f.procedure_acceleree === true;
      return {
        delai_jours: acc ? 7 : 30,
        type_procedure: acc ? 'accélérée' : 'étendue',
        text: acc
          ? 'En procédure accélérée, le recours doit être déposé dans les 7 jours ouvrables (LAsi 108 al. 1).'
          : 'En procédure étendue, le recours doit être déposé dans les 30 jours (LAsi 108 al. 2).',
        autorite: 'Tribunal administratif fédéral (TAF)',
      };
    },
    exceptions: [
      {
        id: 'etrangers_asile_cas_dublin',
        label: 'Cas Dublin — délai raccourci à 5 jours',
        condition: (f) => f.procedure_dublin === true,
        consequence: 'Pour les décisions Dublin (renvoi vers un autre État Dublin), le délai de recours est de 5 jours ouvrables (LAsi 108 al. 3).',
        source_id: 'fedlex:rs142.31:lasi-108',
        blocks: false,
      },
    ],
  },
];

const SOCIAL_RULES = [
  {
    id: 'social_forfait_base_csias',
    label: 'Forfait CSIAS pour l\'entretien (aide sociale)',
    base_legale: 'Normes CSIAS chap. C.3 + LASoc cantonales',
    source_ids: ['csias:normes:c3-forfait-base'],
    condition: (f) => f.domaine === 'social' && f.type_aide === 'aide_sociale',
    consequence: (f) => {
      // Tableau CSIAS 2024 (forfait mensuel, en CHF)
      const taille = Number.isFinite(f.taille_menage) ? f.taille_menage : 1;
      const TABLE = { 1: 1031, 2: 1576, 3: 1918, 4: 2207, 5: 2502, 6: 2796, 7: 3090 };
      const forfait = TABLE[taille] || (TABLE[7] + (taille - 7) * 250);
      return {
        text: 'Le forfait pour l\'entretien couvre alimentation, vêtements, hygiène, transports publics, loisirs.',
        taille_menage: taille,
        forfait_chf: forfait,
        unite: 'CHF/mois',
        note: 'Loyer et primes LAMal en sus, selon barèmes cantonaux.',
      };
    },
    exceptions: [],
  },
  {
    id: 'social_ai_rente_ordinaire',
    label: 'Rente AI — seuil d\'invalidité et échelle',
    base_legale: 'LAI 28-28b',
    source_ids: ['fedlex:rs831.20:lai-28', 'fedlex:rs831.20:lai-28b'],
    condition: (f) => f.domaine === 'social' && (f.demande_ai || f.type_aide === 'ai'),
    consequence: (f) => {
      const taux = Number.isFinite(f.taux_invalidite) ? f.taux_invalidite : null;
      let droit = null;
      let quotite = null;
      if (taux !== null) {
        if (taux < 40) { droit = false; quotite = 0; }
        else if (taux < 50) { droit = true; quotite = taux; }
        else if (taux < 70) { droit = true; quotite = taux; }
        else { droit = true; quotite = 100; }
      }
      return {
        text: 'Le droit à une rente AI suppose un taux d\'invalidité d\'au moins 40% et une cotisation minimale de 3 ans. Depuis 2022, l\'échelle est linéaire entre 40% et 70%.',
        seuil_minimum: '40% d\'invalidité',
        cotisation_minimale: '3 années complètes de cotisations AVS/AI',
        taux_declare: taux,
        droit_probable: droit,
        quotite_rente_percent: quotite,
        echelle: [
          { taux_inv: '< 40%', rente: 'aucune' },
          { taux_inv: '40-49%', rente: 'rente partielle linéaire (quart, demi...) selon taux exact' },
          { taux_inv: '50-69%', rente: 'rente partielle linéaire' },
          { taux_inv: '>= 70%', rente: 'rente entière' },
        ],
        delai_attente: '6 mois d\'incapacité de travail d\'au moins 40% (LAI 28 al. 1 let. b)',
        delai_carence: 'Rente versée au plus tôt 6 mois après le dépôt de la demande (LAI 29 al. 1)',
        autorite: 'Office AI cantonal',
      };
    },
    exceptions: [
      {
        id: 'social_ai_cotisation_insuffisante',
        label: 'Cotisation inférieure à 3 ans — pas de rente ordinaire',
        condition: (f) => f.annees_cotisation !== undefined && f.annees_cotisation < 3,
        consequence: 'Sans 3 années complètes de cotisations, pas de rente ordinaire. Rente extraordinaire possible sous conditions restrictives (LAI 39).',
        source_id: 'fedlex:rs831.20:lai-28',
        blocks: true,
      },
    ],
  },
  {
    id: 'social_chomage_conditions',
    label: 'Indemnités chômage — conditions et délais',
    base_legale: 'LACI 8-14',
    source_ids: ['fedlex:rs837.0:laci-8', 'fedlex:rs837.0:laci-13', 'fedlex:rs837.0:laci-14'],
    condition: (f) => f.domaine === 'social' && (f.demande_chomage || f.type_aide === 'chomage'),
    consequence: (f) => {
      const cotisation = Number.isFinite(f.mois_cotisation) ? f.mois_cotisation : null;
      const age = Number.isFinite(f.age) ? f.age : null;
      const enfants = Number.isFinite(f.nombre_enfants) ? f.nombre_enfants : 0;
      let duree_max = null;
      if (cotisation !== null && age !== null) {
        if (cotisation >= 12 && cotisation < 18) duree_max = 260; // 260 IJ
        else if (cotisation >= 18 && age < 55) duree_max = 400;
        else if (cotisation >= 18 && age >= 55) duree_max = 520;
        else if (cotisation >= 22 && enfants > 0) duree_max = 520;
      }
      return {
        text: 'Pour avoir droit aux indemnités chômage, il faut avoir cotisé 12 mois dans les 2 dernières années, être apte au placement, et s\'être inscrit auprès de l\'ORP.',
        conditions_cumulatives: [
          'Perte de travail indemnisable (LACI 11)',
          'Domicile en Suisse (LACI 8 al. 1 let. c)',
          'Âge d\'assuré — avoir achevé la scolarité obligatoire, n\'ayant pas atteint l\'âge AVS',
          'Avoir cotisé min. 12 mois dans les 2 dernières années (LACI 13)',
          'Être apte au placement (LACI 15)',
          'Satisfaire aux exigences de contrôle (ORP)',
        ],
        delai_inscription: 'Le jour même de la perte de travail, à l\'ORP',
        delai_inscription_jours: 1,
        mois_cotisation_declares: cotisation,
        duree_max_ij_selon_profil: duree_max,
        echelle_duree: [
          { cotisation: '12-17 mois', age: '< 55 ans', ij_max: 260 },
          { cotisation: '18+ mois', age: '< 55 ans', ij_max: 400 },
          { cotisation: '22+ mois', age: '>= 55 ans OU enfants', ij_max: 520 },
        ],
        taux_ij: '80% du gain assuré (70% sans enfants et gain > CHF 3\'797)',
        delai_attente: '5-20 jours selon gain (LACI 18)',
        autorite: 'ORP / caisse de chômage',
      };
    },
    exceptions: [
      {
        id: 'social_chomage_liberation_cotisation',
        label: 'Libération des conditions de cotisation',
        condition: (f) => f.motif_liberation_cotisation === true,
        consequence: 'Certaines personnes sont libérées de la période de cotisation (formation, maladie de longue durée, divorce, séjour à l\'étranger pour un conjoint travaillant). Voir LACI 14.',
        source_id: 'fedlex:rs837.0:laci-14',
        blocks: false,
      },
    ],
  },
  {
    id: 'social_recours_decision_delai',
    label: 'Délai de recours contre une décision d\'aide sociale',
    base_legale: 'LASoc cantonales (typiquement 30 jours)',
    source_ids: ['csias:procedure:recours-30j'],
    condition: (f) => f.domaine === 'social' && f.decision_aide === true,
    consequence: (f) => ({
      text: 'Le délai de recours contre une décision d\'aide sociale est typiquement de 30 jours dès notification.',
      delai_jours_typique: 30,
      autorite_recours: f.canton
        ? `Conseil d\'État / tribunal cantonal du canton de ${f.canton}`
        : 'Autorité cantonale de recours (selon canton)',
      note: 'Vérifier le délai exact dans la décision et la loi cantonale (LASoc).',
    }),
    exceptions: [],
  },
];

const VIOLENCE_RULES = [
  {
    id: 'violence_plainte_penale_delai',
    label: 'Délai pour porter plainte pénale',
    base_legale: 'CP 31',
    source_ids: ['fedlex:rs311:cp-31'],
    condition: (f) => f.domaine === 'violence' && f.infraction_plainte === true,
    consequence: () => ({
      text: 'La plainte doit être déposée dans les 3 mois dès le jour où l\'ayant droit a connu l\'auteur de l\'infraction.',
      delai_mois: 3,
      depart_delai: 'connaissance de l\'auteur',
      autorite: 'Police ou Ministère public',
    }),
    exceptions: [
      {
        id: 'violence_infraction_office',
        label: 'Infraction poursuivie d\'office — pas de délai de plainte',
        condition: (f) => f.poursuite_office === true,
        consequence: 'Les infractions poursuivies d\'office (lésions corporelles graves, viol, etc.) sont poursuivies indépendamment d\'une plainte. Le délai de prescription pénale s\'applique.',
        source_id: 'fedlex:rs311:cp-97',
        blocks: true,
      },
    ],
  },
  {
    id: 'violence_mesures_eloignement',
    label: 'Mesures d\'éloignement du conjoint violent',
    base_legale: 'CC 28b + lois cantonales sur la violence domestique',
    source_ids: ['fedlex:rs210:cc-28b', 'canton:ge-lvd', 'canton:vd-lvd'],
    condition: (f) => f.domaine === 'violence' && (f.violence_domestique || f.mesures_eloignement),
    consequence: (f) => ({
      text: 'En cas de violence, de menaces ou de harcèlement, la victime peut demander des mesures d\'éloignement (interdiction de périmètre, interdiction de contact, expulsion du domicile commun).',
      voie_civile: {
        base: 'CC 28b',
        autorite: 'Juge civil du domicile',
        mesures: [
          'Interdiction de s\'approcher (périmètre donné, typ. 100-500m)',
          'Interdiction de fréquenter certains lieux (domicile, lieu de travail, école des enfants)',
          'Interdiction de prendre contact (téléphone, courriel, réseaux sociaux)',
        ],
        procedure: 'Procédure sommaire + superprovisionnelles en urgence',
      },
      voie_policiere_cantonale: {
        base: 'Lois cantonales (ex. LOVD VD, LVD GE)',
        autorite: 'Police cantonale',
        duree_initiale: '10 à 14 jours selon canton',
        duree_jours_min: 10,
        duree_jours_max: 14,
        prolongation: 'Prolongation possible par le juge civil jusqu\'à 3 mois',
      },
      voie_penale: {
        base: 'CPP + mesures provisionnelles',
        autorite: 'Ministère public / juge des mesures de contrainte',
      },
      accompagnement: 'Centre LAVI cantonal, hébergement d\'urgence (maisons d\'accueil), plainte pénale possible séparément.',
      urgence: f.urgence === true ? 'Police: 117. Ordonnance de protection d\'urgence possible par décision du commandant de police.' : 'Demande au juge civil en procédure sommaire.',
    }),
    exceptions: [],
  },
  {
    id: 'violence_lavi_indemnite',
    label: 'Indemnisation et réparation morale LAVI',
    base_legale: 'LAVI 19-30',
    source_ids: ['fedlex:rs312.5:lavi-19', 'fedlex:rs312.5:lavi-22', 'fedlex:rs312.5:lavi-23'],
    condition: (f) => f.domaine === 'violence' && f.victime === true && (f.indemnite_lavi || f.demande_indemnite),
    consequence: (f) => ({
      text: 'La victime d\'une infraction commise en Suisse peut obtenir de l\'État une indemnité pour le dommage subi et une réparation morale (tort moral), si elle ne peut l\'obtenir de l\'auteur ou d\'un tiers.',
      conditions_cumulatives: [
        'Atteinte à l\'intégrité physique, psychique ou sexuelle',
        'Infraction commise en Suisse',
        'Dépôt de la demande au canton',
      ],
      prestations: [
        { type: 'indemnite_dommage_materiel', plafond_chf: 120000, description: 'Indemnité pour dommage matériel (revenus, frais médicaux non couverts, etc.)' },
        { type: 'reparation_morale_victime', plafond_chf: 70000, description: 'Réparation morale pour la victime directe (LAVI 23)' },
        { type: 'reparation_morale_proches', plafond_chf: 35000, description: 'Réparation morale pour les proches de la victime (LAVI 23)' },
      ],
      subsidiarite: 'Les prestations LAVI sont subsidiaires à celles de l\'auteur, des assurances et d\'autres tiers (LAVI 4).',
      conditions_revenu_indemnite: 'L\'indemnité pour dommage matériel est soumise à conditions de revenu (LAVI 6).',
      delai: '5 ans dès la commission de l\'infraction (LAVI 25)',
      delai_jours: 5 * 365,
      autorite: f.canton
        ? `Instance LAVI du canton de ${f.canton}`
        : 'Instance cantonale LAVI (selon canton de l\'infraction ou de domicile)',
    }),
    exceptions: [],
  },
  {
    id: 'violence_lavi_aide_immediate',
    label: 'Aide immédiate LAVI sans conditions financières',
    base_legale: 'LAVI 13',
    source_ids: ['fedlex:rs312.5:lavi-13'],
    condition: (f) => f.domaine === 'violence' && f.victime === true,
    consequence: () => ({
      text: 'Toute victime au sens de la LAVI a droit à une aide immédiate (conseil, hébergement d\'urgence, prise en charge psychologique) sans condition de revenu.',
      sans_conditions_financieres: true,
      prestations_immediates: ['conseil juridique', 'hébergement urgence', 'soutien psychologique', 'aide médicale'],
      contact: 'Centre de consultation LAVI du canton',
    }),
    exceptions: [],
  },
];

const ACCIDENT_RULES = [
  {
    id: 'accident_declaration_employeur',
    label: 'Déclaration d\'accident professionnel à l\'assureur LAA',
    base_legale: 'LAA 45',
    source_ids: ['fedlex:rs832.20:laa-45'],
    condition: (f) => f.domaine === 'accident' && f.accident_travail === true,
    consequence: () => ({
      text: 'L\'accident professionnel doit être annoncé sans retard à l\'employeur, qui le déclare à l\'assureur LAA (généralement la SUVA ou un assureur privé).',
      qui_annonce: 'L\'employeur déclare à l\'assureur LAA, après notification du salarié.',
      delai: 'Sans retard',
      assureur_typique: 'SUVA ou assureur privé selon contrat employeur',
    }),
    exceptions: [],
  },
  {
    id: 'accident_rc_prescription',
    label: 'Prescription de l\'action en responsabilité civile (accident)',
    base_legale: 'CO 60',
    source_ids: ['fedlex:rs220:co-60'],
    condition: (f) => f.domaine === 'accident' && f.responsabilite_civile === true,
    consequence: () => ({
      text: 'L\'action se prescrit par 3 ans dès la connaissance du dommage et de la personne responsable, et au plus tard par 10 ans dès le fait dommageable.',
      delai_relatif: '3 ans dès connaissance du dommage et de l\'auteur',
      delai_absolu: '10 ans dès le fait dommageable',
    }),
    exceptions: [
      {
        id: 'accident_dommage_corporel',
        label: 'Dommage corporel — délai absolu porté à 20 ans',
        condition: (f) => f.dommage_corporel === true,
        consequence: 'En cas de dommage corporel, le délai absolu est porté à 20 ans (CO 60 al. 1bis, révision entrée en vigueur 2020).',
        source_id: 'fedlex:rs220:co-60',
        blocks: false,
      },
    ],
  },
];

const SUCCESSIONS_RULES = [
  {
    id: 'successions_reserve_hereditaire',
    label: 'Réserve héréditaire — descendants et conjoint',
    base_legale: 'CC 470-471 (révision 2023)',
    source_ids: ['fedlex:rs210:cc-470', 'fedlex:rs210:cc-471'],
    condition: (f) => f.domaine === 'successions' && (f.reserve_heritiere || f.heritage),
    consequence: (f) => {
      const a_descendants = f.descendants === true || (Number.isFinite(f.nombre_enfants) && f.nombre_enfants > 0);
      const a_conjoint = f.conjoint === true || f.partenaire_enregistre === true;
      const a_parents = f.parents_vivants === true;
      // Depuis le 1er janvier 2023 (révision CC): descendants = 1/2, conjoint = 1/2, parents = 0.
      const reserves = [];
      let quotite_disponible = 1;
      if (a_descendants) { reserves.push({ qui: 'descendants', reserve: '1/2 de leur part légale', fraction_num: 0.5, base_legale: 'CC 471 ch. 1' }); quotite_disponible -= 0.5; }
      if (a_conjoint) { reserves.push({ qui: 'conjoint survivant / partenaire enregistré', reserve: '1/2 de sa part légale', fraction_num: 0.5, base_legale: 'CC 471 ch. 2' }); }
      return {
        text: 'Depuis la révision du droit successoral entrée en vigueur au 1er janvier 2023, la réserve des descendants est de 1/2 et celle du conjoint de 1/2. Les parents n\'ont plus de réserve.',
        reserves_applicables: reserves,
        parents_reserve: a_parents ? 'Aucune — supprimée par la révision 2023 (anciennement 1/2)' : null,
        quotite_disponible_indicative: 'La quotité disponible augmente sensiblement — plus grande liberté testamentaire.',
        action_en_reduction: 'L\'héritier lésé dans sa réserve peut agir en réduction dans l\'année suivant la connaissance de l\'atteinte, et au plus 10 ans (CC 533).',
        delai_reduction_prescription_absolu: '10 ans',
        delai_reduction_prescription_relatif: '1 an dès connaissance',
        autorite: 'Tribunal civil du dernier domicile du défunt',
      };
    },
    exceptions: [
      {
        id: 'successions_exheredation',
        label: 'Exhérédation — suppression de la réserve pour motifs graves',
        condition: (f) => f.exheredation === true,
        consequence: 'Un héritier réservataire peut être exhérédé pour cause d\'infraction grave contre le défunt ou ses proches (CC 477), ou pour violation grave des obligations de famille. L\'exhérédation doit être motivée dans le testament.',
        source_id: 'fedlex:rs210:cc-477',
        blocks: false,
      },
    ],
  },
  {
    id: 'successions_repudiation',
    label: 'Répudiation de la succession — délai',
    base_legale: 'CC 566-567',
    source_ids: ['fedlex:rs210:cc-566', 'fedlex:rs210:cc-567'],
    condition: (f) => f.domaine === 'successions' && (f.repudiation || f.succession_endettee),
    consequence: (f) => ({
      text: 'L\'héritier peut répudier la succession dans les 3 mois. Le délai court dès la connaissance du décès pour les héritiers légaux, et dès la notification officielle pour les héritiers institués par testament.',
      delai_mois: 3,
      delai_jours: 90,
      point_depart: 'Connaissance du décès (héritiers légaux) ou notification officielle (héritiers institués)',
      forme: 'Déclaration écrite ou orale à l\'autorité compétente (juge de paix / justice de paix / autorité successorale cantonale)',
      effet: 'L\'héritier qui répudie est considéré comme n\'ayant jamais été héritier. Les héritiers suivants dans l\'ordre prennent sa place.',
      prolongation: 'Prolongation possible par l\'autorité en cas de justes motifs (CC 567 al. 3)',
      presomption_repudiation: 'Si la succession est notoirement insolvable au décès, elle est présumée répudiée (CC 566 al. 2) — aucune action requise.',
      insolvabilite: f.succession_endettee === true ? 'Envisager le bénéfice d\'inventaire (CC 580) avant de décider.' : null,
      benefice_inventaire: 'Demande dans le mois dès connaissance (CC 580) — permet de connaître l\'actif/passif avant de choisir.',
      delai_benefice_inventaire_jours: 30,
      autorite: f.canton
        ? `Autorité successorale cantonale / Juge de paix du canton de ${f.canton}`
        : 'Autorité successorale du dernier domicile du défunt',
      attention: 'Passé 3 mois sans répudiation, l\'héritier est réputé avoir accepté (acceptation tacite) — il répond des dettes sur son propre patrimoine.',
    }),
    exceptions: [
      {
        id: 'successions_acceptation_tacite',
        label: 'Acceptation tacite par immixtion',
        condition: (f) => f.immixtion_heritier === true || f.a_dispose_biens_succession === true,
        consequence: 'L\'héritier qui s\'immisce dans les affaires de la succession (prélève des biens, vend, dispose) perd le droit de répudier (CC 571 al. 2).',
        source_id: 'fedlex:rs210:cc-571',
        blocks: true,
      },
    ],
  },
];

const ENTREPRISE_RULES = [
  {
    id: 'entreprise_faillite_opposition_delai',
    label: 'Délai d\'opposition à la commination de faillite',
    base_legale: 'LP 174',
    source_ids: ['fedlex:rs281.1:lp-174'],
    condition: (f) => f.domaine === 'entreprise' && f.commination_faillite === true,
    consequence: () => ({
      text: 'Le débiteur dispose de 10 jours dès la notification de la commination pour requérir le sursis ou former opposition.',
      delai_jours: 10,
      autorite: 'Juge de la faillite (tribunal du for)',
    }),
    exceptions: [],
  },
  {
    id: 'entreprise_sarl_capital_minimum',
    label: 'Capital social minimum pour une Sàrl',
    base_legale: 'CO 773',
    source_ids: ['fedlex:rs220:co-773'],
    condition: (f) => f.domaine === 'entreprise' && f.forme_juridique === 'sarl',
    consequence: () => ({
      text: 'Le capital social d\'une société à responsabilité limitée (Sàrl) doit être de 20\'000 CHF au moins, intégralement libéré.',
      capital_minimum_chf: 20000,
      liberation: 'intégrale',
    }),
    exceptions: [],
  },
];

// ─── All rules registry ─────────────────────────────────────────

const ALL_RULES = [
  ...BAIL_RULES,
  ...TRAVAIL_RULES,
  ...DETTES_RULES,
  ...TRANSVERSAL_RULES,
  ...CONSOMMATION_RULES,
  ...ASSURANCES_RULES,
  ...VOISINAGE_RULES,
  ...FAMILLE_RULES,
  ...ETRANGERS_RULES,
  ...SOCIAL_RULES,
  ...VIOLENCE_RULES,
  ...ACCIDENT_RULES,
  ...ENTREPRISE_RULES,
  ...SUCCESSIONS_RULES,
];

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

export {
  ALL_RULES,
  BAIL_RULES,
  TRAVAIL_RULES,
  DETTES_RULES,
  TRANSVERSAL_RULES,
  CONSOMMATION_RULES,
  ASSURANCES_RULES,
  VOISINAGE_RULES,
  FAMILLE_RULES,
  ETRANGERS_RULES,
  SOCIAL_RULES,
  VIOLENCE_RULES,
  ACCIDENT_RULES,
  ENTREPRISE_RULES,
  SUCCESSIONS_RULES,
  execRule,
};
