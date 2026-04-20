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

  // ─── Commission de conciliation obligatoire ─────────────────
  {
    id: 'bail_commission_conciliation',
    label: 'Commission de conciliation en matière de bail — étape obligatoire',
    base_legale: 'CO 274c + OBLF 5',
    source_ids: ['fedlex:rs220:co-274c', 'fedlex:rs221.213.11:oblf-5'],
    condition: (f) => f.domaine === 'bail' && (
      f.litige_bail === true ||
      f.conge_recu === true ||
      f.augmentation_recue === true ||
      f.defaut_signale === true ||
      f.prolongation_demandee === true
    ),
    consequence: () => ({
      text: 'Avant toute action au tribunal en matière de bail, les parties doivent saisir la commission de conciliation. La procédure est gratuite et orale.',
      autorite: 'Commission de conciliation en matière de bail (cantonale)',
      gratuit: true,
      procedure: 'Orale et contradictoire',
      duree_typique: 'Audience dans 2-4 mois',
      issues_possibles: [
        'Accord (transaction) — force exécutoire (CPC 208)',
        'Proposition de jugement (valeurs litigieuses ≤ 5\'000 CHF) — CO 274e al. 3',
        'Autorisation de procéder (si pas d\'accord) — délai 30 jours pour saisir le tribunal',
      ],
      delai_action_apres_autorisation: '30 jours dès délivrance de l\'autorisation de procéder (CPC 209 al. 3)',
      delai_jours_action: 30,
      obligatoire: 'Oui — l\'action directe devant le tribunal est irrecevable sans passage préalable (sauf cas expulsion motif de demeure CO 257d)',
    }),
    exceptions: [
      {
        id: 'bail_conciliation_exception_expulsion_demeure',
        label: 'Expulsion pour demeure (CO 257d) — procédure sommaire directe',
        condition: (f) => f.motif_conge === 'defaut_paiement' || f.motif_conge === 'demeure',
        consequence: 'En cas de résiliation anticipée pour demeure du locataire (CO 257d), le bailleur peut saisir directement le juge en procédure sommaire (CPC 257) sans passer par la conciliation.',
        source_id: 'fedlex:rs220:co-257d',
        blocks: false,
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
    id: 'travail_protection_grossesse',
    label: 'Protection contre le licenciement pendant la grossesse et le post-partum',
    base_legale: 'CO 336c al. 1 let. c + LTr 35-35a',
    source_ids: ['fedlex:rs220:co-336c', 'fedlex:rs822.11:ltr-35', 'fedlex:rs822.11:ltr-35a'],
    condition: (f) => f.domaine === 'travail' && (f.grossesse === true || f.accouchement_recent === true),
    consequence: (f) => ({
      text: 'Pendant la grossesse et les 16 semaines qui suivent l\'accouchement, le licenciement donné par l\'employeur est NUL (sans effet juridique). Le congé donné pendant une période protégée précédant la grossesse voit son délai suspendu.',
      duree_protection_postnatale_semaines: 16,
      duree_protection_postnatale_jours: 112,
      debut_protection: 'Premier jour de la grossesse (dès conception, même si inconnue à l\'employeur au moment du congé)',
      fin_protection: '16 semaines après l\'accouchement',
      consequence_violation: 'Le licenciement est NUL (CO 336c al. 2). La travailleuse reste employée et a droit au salaire.',
      conge_maternite_payant: '14 semaines d\'allocation pour perte de gain maternité (LAPG 16b-16h) — 80% du revenu',
      interdiction_travailler_postnatale: 'Interdiction absolue de travailler pendant les 8 semaines suivant l\'accouchement (LTr 35a al. 3)',
      protection_travaux_penibles: 'Dispense ou aménagement pour travaux pénibles/dangereux (LTr 35 + OLT1 62)',
      grossesse_declaree: f.grossesse === true,
      accouchement_recent: f.accouchement_recent === true,
      pause_allaitement: 'Jusqu\'à 1 an après accouchement: temps d\'allaitement rémunéré (LTr 35a al. 2 + OLT1 60)',
    }),
    exceptions: [
      {
        id: 'travail_grossesse_periode_essai',
        label: 'Pas de protection pendant la période d\'essai',
        condition: (f) => f.periode_essai === true,
        consequence: 'La protection contre le licenciement en cas de grossesse ne s\'applique pas pendant le temps d\'essai (CO 336c al. 1).',
        source_id: 'fedlex:rs220:co-336c',
        blocks: true,
      },
      {
        id: 'travail_grossesse_resiliation_immediate',
        label: 'Résiliation immédiate pour justes motifs non bloquée',
        condition: (f) => f.justes_motifs === true,
        consequence: 'La protection ne s\'applique pas en cas de résiliation immédiate pour justes motifs (CO 337). L\'employeur doit prouver les justes motifs.',
        source_id: 'fedlex:rs220:co-337',
        blocks: false,
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
    id: 'dettes_mainlevee_provisoire',
    label: 'Mainlevée provisoire de l\'opposition — reconnaissance de dette',
    base_legale: 'LP 82',
    source_ids: ['fedlex:rs281.1:lp-82'],
    condition: (f) => f.domaine === 'dettes' && (f.mainlevee_provisoire_requise === true || f.reconnaissance_dette_signee === true),
    consequence: (f) => ({
      text: 'Si le créancier dispose d\'une reconnaissance de dette écrite et signée, il peut requérir la mainlevée provisoire de l\'opposition. Le juge ordonne la mainlevée sauf si le débiteur rend immédiatement vraisemblable sa libération.',
      autorite: 'Juge de la mainlevée (tribunal de district / arrondissement)',
      procedure: 'Procédure sommaire (CPC 251 let. a)',
      titre_requis: 'Reconnaissance de dette écrite et signée par le débiteur (avec montant déterminé)',
      delai_jugement: 'Typiquement 1-3 mois',
      moyens_debiteur: [
        'Rendre vraisemblable la libération (paiement, compensation, remise de dette)',
        'Contester l\'authenticité de la signature',
        'Invoquer un vice du consentement (erreur, dol, crainte fondée)',
      ],
      consequence_mainlevee_accordee: 'Le créancier peut requérir la continuation de la poursuite (saisie ou faillite). Le débiteur peut encore agir en libération de dette (LP 83 al. 2) dans les 20 jours.',
      emolument_typique_chf: '100-400 CHF selon valeur litigieuse',
      recours: 'Recours cantonal (CPC 319) dans les 10 jours',
      delai_recours_jours: 10,
    }),
    exceptions: [
      {
        id: 'dettes_mainlevee_provisoire_libération_vraisemblable',
        label: 'Libération rendue vraisemblable = mainlevée refusée',
        condition: (f) => f.liberation_vraisemblable === true || f.paiement_prouve === true,
        consequence: 'Si le débiteur rend immédiatement vraisemblable sa libération (quittance, reçu, preuve de compensation), la mainlevée provisoire est refusée (LP 82 al. 2).',
        source_id: 'fedlex:rs281.1:lp-82',
        blocks: true,
      },
    ],
  },
  {
    id: 'dettes_mainlevee_definitive',
    label: 'Mainlevée définitive de l\'opposition — jugement exécutoire',
    base_legale: 'LP 80-81',
    source_ids: ['fedlex:rs281.1:lp-80', 'fedlex:rs281.1:lp-81'],
    condition: (f) => f.domaine === 'dettes' && (f.mainlevee_definitive_requise === true || f.jugement_executoire === true || f.decision_administrative_executoire === true),
    consequence: () => ({
      text: 'Lorsque le créancier dispose d\'un jugement exécutoire ou d\'une décision administrative assimilée, il peut requérir la mainlevée définitive. Les moyens du débiteur sont très limités.',
      autorite: 'Juge de la mainlevée (tribunal de district / arrondissement)',
      procedure: 'Procédure sommaire (CPC 251 let. a)',
      titres_admissibles: [
        'Jugement suisse exécutoire (LP 80 al. 1)',
        'Jugement étranger reconnu selon la CL ou la LDIP',
        'Décision administrative exécutoire assimilée (LP 80 al. 2 — AVS, AI, LAA, impôts, etc.)',
        'Sentence arbitrale exécutoire',
        'Transaction judiciaire ou extrajudiciaire homologuée',
      ],
      moyens_debiteur: [
        'Prouver par titre l\'extinction ou le sursis de la dette depuis le jugement (LP 81 al. 1)',
        'Invoquer la prescription depuis le jugement',
        'Opposer la compensation, mais uniquement si reconnue par titre',
      ],
      consequence_mainlevee: 'Mainlevée définitive — aucune action en libération de dette possible. Le créancier peut continuer la poursuite.',
      recours: 'Recours cantonal (CPC 319) dans les 10 jours',
      delai_recours_jours: 10,
    }),
    exceptions: [
      {
        id: 'dettes_mainlevee_definitive_extinction_prouvee',
        label: 'Extinction prouvée par titre depuis le jugement',
        condition: (f) => f.extinction_posterieure_prouvee === true,
        consequence: 'Si le débiteur prouve par titre l\'extinction, le sursis ou la prescription de la dette survenus après le jugement, la mainlevée définitive est refusée (LP 81 al. 1).',
        source_id: 'fedlex:rs281.1:lp-81',
        blocks: true,
      },
    ],
  },
  {
    id: 'dettes_action_liberation_dette',
    label: 'Action en libération de dette après mainlevée provisoire',
    base_legale: 'LP 83',
    source_ids: ['fedlex:rs281.1:lp-83'],
    condition: (f) => f.domaine === 'dettes' && (f.mainlevee_provisoire_prononcee === true || f.action_liberation_dette === true),
    consequence: () => ({
      text: 'Dans les 20 jours dès la notification du jugement de mainlevée provisoire, le débiteur peut agir en libération de dette devant le juge ordinaire. L\'action inverse les rôles procéduraux : le débiteur est demandeur.',
      delai: '20 jours',
      delai_jours: 20,
      point_depart: 'notification du jugement de mainlevée provisoire',
      autorite: 'Tribunal ordinaire du for de la poursuite (CPC 46)',
      procedure: 'Procédure ordinaire ou simplifiée selon valeur litigieuse',
      effet: 'Suspend la continuation de la poursuite jusqu\'au jugement au fond (LP 83 al. 2). La poursuite ne peut être continuée qu\'après jugement définitif de libération rejeté.',
      fardeau_preuve: 'Le débiteur (demandeur) doit prouver qu\'il ne doit pas le montant réclamé. Inversion des rôles probatoires.',
      consequence_passe_delai: 'Sans action dans les 20 jours, la mainlevée provisoire devient définitive — la poursuite peut continuer sans restriction.',
      frais: 'Avance de frais et dépens à la charge du débiteur (fardeau de la preuve et du procès)',
    }),
    exceptions: [
      {
        id: 'dettes_liberation_restitution_delai',
        label: 'Restitution de délai en cas d\'empêchement non fautif',
        condition: (f) => f.empechement_non_fautif === true,
        consequence: 'Le délai de 20 jours peut faire l\'objet d\'une restitution en cas d\'empêchement non fautif (CPC 148), par requête motivée dans les 10 jours après la fin de l\'empêchement.',
        source_id: 'fedlex:rs272:cpc-148',
        blocks: false,
      },
    ],
  },
  {
    id: 'dettes_sequestre_contestation',
    label: 'Contestation d\'un séquestre — opposition et recours',
    base_legale: 'LP 278',
    source_ids: ['fedlex:rs281.1:lp-278'],
    condition: (f) => f.domaine === 'dettes' && (f.sequestre_execute === true || f.ordonnance_sequestre_recue === true),
    consequence: () => ({
      text: 'Le débiteur ou un tiers touché par un séquestre peut former opposition à l\'ordonnance de séquestre dans les 10 jours dès la connaissance du séquestre. Le recours contre la décision sur opposition s\'exerce dans les 10 jours également.',
      delai_opposition: '10 jours',
      delai_jours_opposition: 10,
      point_depart_opposition: 'Connaissance du séquestre (notification du procès-verbal ou de l\'ordonnance)',
      autorite_opposition: 'Juge qui a ordonné le séquestre',
      procedure: 'Procédure sommaire (CPC 251 let. a)',
      moyens: [
        'Contester la créance alléguée (existence, quotité, exigibilité)',
        'Contester les cas de séquestre (LP 271)',
        'Contester la quotité des biens séquestrés',
        'Invoquer l\'insaisissabilité de certains biens',
      ],
      delai_recours: '10 jours dès notification de la décision sur opposition',
      delai_jours_recours: 10,
      autorite_recours: 'Autorité cantonale supérieure (tribunal cantonal)',
      validation_sequestre: 'Le créancier doit valider le séquestre par une poursuite ou une action dans les 10 jours (LP 279), faute de quoi le séquestre tombe.',
      delai_validation_creancier_jours: 10,
      surete: 'Le juge peut exiger des sûretés du créancier pour le dommage éventuel (LP 273)',
    }),
    exceptions: [
      {
        id: 'dettes_sequestre_tiers_revendication',
        label: 'Tiers propriétaire de biens séquestrés — revendication',
        condition: (f) => f.tiers_proprietaire === true,
        consequence: 'Un tiers qui revendique la propriété d\'un bien séquestré peut agir par voie de revendication (LP 106-109) dans les 10 jours dès connaissance du séquestre.',
        source_id: 'fedlex:rs281.1:lp-106',
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
    id: 'violence_protection_ordonnance',
    label: 'Ordonnance de protection civile (superprovisionnelle / provisionnelle)',
    base_legale: 'CC 28b + CPC 261-265',
    source_ids: ['fedlex:rs210:cc-28b', 'fedlex:rs272:cpc-261', 'fedlex:rs272:cpc-265'],
    condition: (f) => f.domaine === 'violence' && (f.ordonnance_protection === true || f.mesures_superprovisionnelles === true),
    consequence: (f) => ({
      text: 'Le juge civil peut prononcer des mesures superprovisionnelles (sans audition de la partie adverse) en cas d\'urgence particulière, suivies d\'une audience contradictoire sous 10 jours. Une ordonnance de police administrative cantonale peut prendre le relais pour 10-14 jours.',
      procedure_judiciaire: {
        base: 'CC 28b + CPC 261-265',
        autorite: 'Juge civil du domicile ou du lieu de l\'acte',
        mesures_superprovisionnelles: {
          delai_prononce: 'Sans délai (heures — même jours fériés)',
          sans_audition: true,
          duree: '10 jours maximum avant audience contradictoire (CPC 265 al. 2)',
          delai_jours_audience: 10,
        },
        mesures_provisionnelles: {
          procedure: 'Procédure sommaire contradictoire (CPC 253)',
          duree: 'Jusqu\'au jugement au fond ou expiration fixée',
          renouvelable: true,
        },
        mesures_possibles: [
          'Interdiction d\'approcher (périmètre — typiquement 100-500m)',
          'Interdiction de fréquenter certains lieux (domicile, travail, école)',
          'Interdiction de prendre contact (physique, téléphone, email, réseaux sociaux)',
          'Attribution exclusive du logement commun',
          'Expulsion du domicile commun',
        ],
      },
      voie_police_cantonale: {
        base: 'Lois cantonales sur la violence domestique (LOVD VD, LVD GE, etc.)',
        autorite: 'Police cantonale (commandement)',
        duree_initiale_jours: 10,
        duree_max_jours: 14,
        prolongation: 'Prolongation jusqu\'à 3 mois possible par requête au juge civil',
        delai_recours_cantonal: 'Typiquement 10-30 jours selon canton',
      },
      sanction_violation: 'La violation de l\'ordonnance est punissable (CP 292 — insoumission à décision de l\'autorité) : amende ou emprisonnement.',
      article_cp_violation: 'CP 292',
      delai_recours_judiciaire: '10 jours dès notification de l\'ordonnance (CPC 319)',
      delai_jours_recours: 10,
      urgence: f.urgence === true ? 'Police 117 en cas de danger immédiat. Ordonnance de protection d\'urgence possible.' : 'Demande au juge civil.',
      cumul_penal: 'Une plainte pénale (lésions, menaces, contrainte) peut être déposée en parallèle — indépendante de la voie civile.',
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

// Extension SUCCESSIONS
SUCCESSIONS_RULES.push(
  {
    id: 'successions_action_reduction',
    label: 'Action en réduction — protection des réservataires',
    base_legale: 'CC 522-533',
    source_ids: ['fedlex:rs210:cc-522', 'fedlex:rs210:cc-527', 'fedlex:rs210:cc-533'],
    condition: (f) => f.domaine === 'successions' && (f.reserve_atteinte === true || f.action_reduction === true || f.liberalite_excessive === true),
    consequence: () => ({
      text: 'L\'héritier réservataire dont la réserve est lésée peut agir en réduction contre les libéralités entre vifs et les dispositions à cause de mort qui excèdent la quotité disponible.',
      delai_relatif: '1 an dès connaissance de la lésion de la réserve',
      delai_jours_relatif: 365,
      delai_absolu: '10 ans dès l\'ouverture de la succession',
      delai_jours_absolu: 3650,
      autorite: 'Tribunal civil du dernier domicile du défunt',
      procedure: 'Procédure ordinaire',
      ordre_reduction: [
        '1. Dispositions à cause de mort (testament / pacte successoral)',
        '2. Libéralités entre vifs les plus récentes d\'abord',
        '3. Libéralités plus anciennes (remonter dans le temps, CC 532)',
      ],
      liberalites_reductibles: [
        'Donations faites dans les 5 ans précédant le décès (CC 527 ch. 3)',
        'Libéralités manifestement destinées à éluder les règles de la réserve (CC 527 ch. 4)',
        'Dotations, avancements d\'hoirie révocables, abandons de droits de réversion',
        'Toute libéralité au conjoint dans les 5 ans précédant le décès',
      ],
      effet: 'Le bénéficiaire de la libéralité doit restituer (en nature ou en valeur) ce qui dépasse la quotité disponible.',
      valeur_determinante: 'Valeur des biens au moment du décès (CC 537 al. 2)',
    }),
    exceptions: [
      {
        id: 'successions_reduction_exheredation_valable',
        label: 'Exhérédation valable bloque l\'action',
        condition: (f) => f.exheredation_valable === true,
        consequence: 'Si l\'héritier a été valablement exhérédé (motifs CC 477), il perd sa qualité de réservataire et son droit à la réduction.',
        source_id: 'fedlex:rs210:cc-477',
        blocks: true,
      },
    ],
  },
  {
    id: 'successions_exheredation_motifs',
    label: 'Exhérédation — motifs limitatifs et forme',
    base_legale: 'CC 477-480',
    source_ids: ['fedlex:rs210:cc-477', 'fedlex:rs210:cc-478', 'fedlex:rs210:cc-479'],
    condition: (f) => f.domaine === 'successions' && (f.exheredation === true || f.exheredation_envisagee === true),
    consequence: () => ({
      text: 'Un héritier réservataire ne peut être privé de sa réserve que dans des cas limitativement énumérés : infraction grave contre le défunt ou un proche, ou violation grave d\'obligations légales de famille.',
      motifs_limitatifs: [
        'Infraction grave contre le défunt ou l\'un de ses proches (CC 477 ch. 1) — p.ex. crime/délit grave',
        'Violation grave des obligations que la loi lui impose envers le défunt ou sa famille (CC 477 ch. 2) — p.ex. abandon, défaut d\'entretien',
      ],
      exheredation_surendettement: 'L\'exhérédation d\'un descendant surendetté (CC 480) est possible pour protéger ses descendants — la moitié de la part va aux enfants du descendant exhérédé.',
      forme_obligatoire: 'L\'exhérédation doit être prononcée dans un testament ou un pacte successoral. Elle doit indiquer le motif de manière suffisamment précise.',
      fardeau_preuve: 'Celui qui se prévaut de l\'exhérédation doit prouver le motif (CC 479 al. 2). En cas de doute sur la validité, l\'exhérédation est inopérante.',
      effet: 'L\'héritier exhérédé perd sa réserve ET sa part légale. Il est considéré comme prédécédé (sauf substitution).',
      contestation: 'L\'héritier exhérédé peut contester la validité de l\'exhérédation par une action en nullité ou en réduction dans le délai de CC 533 (1 an / 10 ans).',
      autorite: 'Tribunal civil du dernier domicile du défunt',
    }),
    exceptions: [
      {
        id: 'successions_exheredation_pardon',
        label: 'Pardon ultérieur = exhérédation caduque',
        condition: (f) => f.pardon_defunt === true,
        consequence: 'Si le défunt a pardonné à l\'héritier après la cause d\'exhérédation (manifesté par acte ou comportement), l\'exhérédation est caduque.',
        source_id: 'fedlex:rs210:cc-477',
        blocks: true,
      },
    ],
  },
  {
    id: 'successions_rapport_liberalites',
    label: 'Rapport des libéralités entre descendants',
    base_legale: 'CC 626-632',
    source_ids: ['fedlex:rs210:cc-626', 'fedlex:rs210:cc-628', 'fedlex:rs210:cc-630'],
    condition: (f) => f.domaine === 'successions' && (f.rapport_liberalites === true || f.donation_descendant === true),
    consequence: (f) => ({
      text: 'Les descendants qui viennent à la succession doivent rapporter à la masse successorale toutes les libéralités reçues à titre d\'avancement d\'hoirie (dot, frais d\'établissement, abandon de biens, remise de dette), sauf dispense expresse du disposant.',
      presomption: 'Les libéralités aux descendants sont présumées rapportables (CC 626 al. 2).',
      liberalites_rapportables: [
        'Avancements d\'hoirie (dot, installation, donations)',
        'Frais d\'établissement (formation exceptionnelle, installation professionnelle)',
        'Abandon de biens, remise de dette',
        'Constitutions de revenus, dotations',
      ],
      non_rapportables_sauf_disposition_contraire: [
        'Cadeaux d\'usage (anniversaires, Noël)',
        'Frais d\'entretien et d\'éducation normaux (CC 631)',
      ],
      dispense_possible: 'Le défunt peut dispenser expressément du rapport (dans l\'acte de libéralité ou par testament). La dispense ne peut porter atteinte aux réserves (CC 626 al. 2).',
      valeur_rapport: 'Valeur de la libéralité au moment du décès (CC 630 al. 1), sauf convention contraire. Les plus-values et moins-values non imputables au bénéficiaire sont prises en compte.',
      modalites_rapport: [
        'Rapport en nature (CC 628 al. 1) — au choix de l\'héritier',
        'Rapport en moins-prenant (imputation sur la part) — par défaut si valeur ≤ part héréditaire',
        'Si valeur > part : restitution de l\'excédent (CC 629)',
      ],
      descendants_exclus: 'Les descendants qui répudient ou sont exhérédés ne sont pas tenus de rapporter.',
      autorite: 'Tribunal civil du dernier domicile du défunt (en cas de litige au partage)',
      delai_prescription: 'Pas de prescription propre — l\'action en partage est imprescriptible (CC 604)',
    }),
    exceptions: [
      {
        id: 'successions_rapport_non_descendants',
        label: 'Héritiers non descendants — pas de rapport par défaut',
        condition: (f) => f.rapport_heritiers_non_descendants === true,
        consequence: 'Les héritiers autres que les descendants (conjoint, frères/soeurs, etc.) ne sont tenus au rapport que si le défunt l\'a expressément prescrit (CC 626 al. 1 a contrario).',
        source_id: 'fedlex:rs210:cc-626',
        blocks: true,
      },
    ],
  },
);

// ═══════════════════════════════════════════════════════════════
// FISCAL RULES — impôts directs et LIFD/LHID
// ═══════════════════════════════════════════════════════════════

const FISCAL_RULES = [
  {
    id: 'fiscal_taxation_reclamation',
    label: 'Réclamation contre la décision de taxation',
    base_legale: 'LIFD 132 + LHID 48',
    source_ids: ['fedlex:rs642.11:lifd-132', 'fedlex:rs642.14:lhid-48'],
    condition: (f) => f.domaine === 'fiscal' && (f.decision_taxation === true || f.reclamation_fiscale === true),
    consequence: (f) => ({
      text: 'Le contribuable peut adresser une réclamation écrite à l\'autorité de taxation dans les 30 jours dès la notification de la décision. La réclamation doit être motivée et, le cas échéant, accompagnée des moyens de preuve.',
      delai: '30 jours',
      delai_jours: 30,
      point_depart: 'notification de la décision de taxation',
      autorite: f.canton
        ? `Administration fiscale cantonale de ${f.canton} (impôt cantonal et fédéral direct)`
        : 'Administration cantonale des contributions (impôt cantonal et IFD)',
      forme: 'Écrite, motivée, signée',
      contenu: [
        'Désignation de la décision attaquée',
        'Conclusions (quel revenu/fortune rectifié)',
        'Motivation (faits et droit)',
        'Offres de preuves (pièces, témoins)',
      ],
      gratuit: true,
      effet: 'Effet dévolutif — l\'autorité réexamine toute la taxation et peut procéder à la reformatio in pejus (CC LIFD 135 al. 1).',
      decision: 'Décision sur réclamation motivée par l\'autorité',
      recours_suivant: 'Recours à la commission cantonale de recours en matière fiscale ou au tribunal administratif, 30 jours dès notification de la décision sur réclamation (LIFD 140 + LHID 50)',
      delai_recours_suivant_jours: 30,
      taxation_office_sans_retour: 'Si la taxation a été notifiée d\'office, la réclamation doit être motivée sous peine d\'irrecevabilité (LIFD 132 al. 3)',
    }),
    exceptions: [
      {
        id: 'fiscal_taxation_office_motivation',
        label: 'Taxation d\'office — réclamation doit démontrer le caractère manifestement inexact',
        condition: (f) => f.taxation_office === true,
        consequence: 'Contre une taxation d\'office (défaut de déclaration), la réclamation n\'est recevable que si elle démontre le caractère manifestement inexact (LIFD 132 al. 3). Le contribuable doit produire les éléments manquants.',
        source_id: 'fedlex:rs642.11:lifd-132',
        blocks: false,
      },
    ],
  },
  {
    id: 'fiscal_remise_impot',
    label: 'Demande de remise d\'impôt pour situation financière difficile',
    base_legale: 'LIFD 167-167g + LHID 47',
    source_ids: ['fedlex:rs642.11:lifd-167', 'fedlex:rs642.14:lhid-47'],
    condition: (f) => f.domaine === 'fiscal' && (f.demande_remise === true || f.difficulte_financiere_fiscale === true),
    consequence: (f) => ({
      text: 'Le contribuable qui, par suite de pertes ou de circonstances extraordinaires (maladie, accident, charges de famille, chômage), se trouve dans le dénuement ou dont l\'acquittement de l\'impôt entraînerait pour lui des conséquences très dures peut demander la remise totale ou partielle de l\'impôt.',
      autorite_ifd: 'Administration fédérale des contributions (AFC) — après préavis du canton',
      autorite_canton: f.canton
        ? `Service cantonal des contributions / Commission de remise du canton de ${f.canton}`
        : 'Autorité cantonale de remise (service des contributions)',
      conditions_cumulatives: [
        'Impôt dû devenu définitif (décision entrée en force)',
        'Situation financière actuelle (pas prospective) justifiant le dénuement',
        'Acquittement entraînerait des conséquences très dures (disproportion entre dette et capacité)',
        'Pas de faute propre du contribuable (pas de manquement grave)',
      ],
      exclusions_typiques: [
        'Impôts anticipés et retenus à la source (pas de remise IA LIFD 167b al. 3)',
        'Dettes aliénées par cession ou actes de défaut de biens',
      ],
      delai: 'Pas de délai légal — demande possible tant que l\'impôt n\'est pas payé / prescrit',
      gratuit: 'Oui — pas d\'émolument pour la demande',
      forme: 'Écrite, motivée, accompagnée de pièces (budget familial, revenus, charges, dettes, fortune, attestations)',
      decision_sur_recours: 'La décision de refus peut faire l\'objet d\'un recours (LIFD 167g) ; la décision d\'octroi n\'est pas attaquable par des tiers.',
      effet: 'Remise totale ou partielle — le solde est éteint. Peut s\'accompagner de plans de paiement.',
      note_interet_public: 'L\'autorité tient compte de l\'intérêt public (équité fiscale) et évite de créer un précédent abusif.',
    }),
    exceptions: [
      {
        id: 'fiscal_remise_faute_grave',
        label: 'Faute grave du contribuable bloque la remise',
        condition: (f) => f.faute_grave_contribuable === true || f.soustraction_fiscale === true,
        consequence: 'En cas de faute grave du contribuable (fraude fiscale, soustraction répétée, dissimulation manifeste), la remise est en principe refusée (LIFD 167 al. 1 a contrario).',
        source_id: 'fedlex:rs642.11:lifd-167',
        blocks: true,
      },
    ],
  },
  {
    id: 'fiscal_rappel_impot',
    label: 'Rappel d\'impôt — prescription et droit d\'être entendu',
    base_legale: 'LIFD 151-153 + LHID 53',
    source_ids: ['fedlex:rs642.11:lifd-151', 'fedlex:rs642.11:lifd-152', 'fedlex:rs642.11:lifd-153', 'fedlex:rs642.14:lhid-53'],
    condition: (f) => f.domaine === 'fiscal' && (f.rappel_impot === true || f.procedure_rappel === true),
    consequence: (f) => ({
      text: 'Si des faits ou moyens de preuve inconnus de l\'autorité au moment de la taxation permettent de constater que celle-ci est incomplète, une procédure de rappel d\'impôt peut être ouverte. Le contribuable a un droit d\'être entendu complet avant toute décision.',
      prescription_droit_ouvrir: '10 ans dès la fin de la période fiscale (LIFD 152 al. 1)',
      prescription_droit_ouvrir_annees: 10,
      prescription_fixation: '15 ans dès la fin de la période fiscale (LIFD 152 al. 3) — délai maximum',
      prescription_fixation_annees: 15,
      conditions_ouverture: [
        'Faits ou moyens de preuve inconnus de l\'autorité au moment de la taxation',
        'Taxation incomplète résultant de ces faits',
        'Pas de faute de l\'autorité dans l\'incomplétude (si l\'autorité aurait pu se rendre compte → impossible)',
      ],
      droit_etre_entendu: 'Obligatoire — le contribuable reçoit notification écrite de l\'ouverture et peut se déterminer par écrit sur les faits et leur imputabilité (LIFD 153)',
      forme_ouverture: 'Notification écrite avec désignation des années et faits, accompagnée d\'un délai pour se déterminer (typiquement 30 jours)',
      distinction_soustraction: 'Le rappel n\'est PAS une sanction pénale. Si soustraction intentionnelle, une amende fiscale (LIFD 175) s\'ajoute — procédure pénale fiscale distincte.',
      impact: 'L\'impôt supplémentaire est dû avec intérêts moratoires. Pas de remise automatique.',
      autorite: f.canton
        ? `Administration cantonale des contributions de ${f.canton}`
        : 'Administration cantonale des contributions',
      denonciation_spontanee: 'Le contribuable peut bénéficier d\'une dénonciation spontanée non punissable (une fois dans la vie, LIFD 175 al. 3) — remise de l\'amende mais rappel d\'impôt dû avec intérêts.',
    }),
    exceptions: [
      {
        id: 'fiscal_rappel_prescription_acquise',
        label: 'Prescription de 15 ans acquise — rappel impossible',
        condition: (f) => f.annees_depuis_periode !== undefined && f.annees_depuis_periode > 15,
        consequence: 'Passé 15 ans dès la fin de la période fiscale, la prescription absolue est acquise — aucun rappel d\'impôt n\'est plus possible (LIFD 152 al. 3).',
        source_id: 'fedlex:rs642.11:lifd-152',
        blocks: true,
      },
      {
        id: 'fiscal_rappel_faute_autorite',
        label: 'Faute de l\'autorité exclut le rappel',
        condition: (f) => f.faute_autorite_taxation === true,
        consequence: 'Si l\'autorité aurait pu se rendre compte des faits lors de la taxation (éléments apparents dans la déclaration ou les annexes), le rappel d\'impôt est exclu — seule une révision en défaveur du contribuable est en principe impossible.',
        source_id: 'fedlex:rs642.11:lifd-151',
        blocks: true,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// LPP RULES — prévoyance professionnelle (retraite)
// ═══════════════════════════════════════════════════════════════

const LPP_RULES = [
  {
    id: 'lpp_prestation_invalidite',
    label: 'Prestation d\'invalidité LPP — coordination avec AI',
    base_legale: 'LPP 23-26',
    source_ids: ['fedlex:rs831.40:lpp-23', 'fedlex:rs831.40:lpp-24', 'fedlex:rs831.40:lpp-26'],
    condition: (f) => f.domaine === 'lpp' && (f.invalidite === true || f.rente_invalidite_lpp === true),
    consequence: (f) => {
      const taux_ai = Number.isFinite(f.taux_invalidite_ai) ? f.taux_invalidite_ai : null;
      let droit_lpp = null;
      let quotite = null;
      if (taux_ai !== null) {
        if (taux_ai < 40) { droit_lpp = false; quotite = 0; }
        else if (taux_ai < 50) { droit_lpp = true; quotite = taux_ai; }
        else if (taux_ai < 70) { droit_lpp = true; quotite = taux_ai; }
        else { droit_lpp = true; quotite = 100; }
      }
      return {
        text: 'L\'assuré qui est invalide à 40% au moins au sens de l\'AI a droit à des prestations d\'invalidité de la prévoyance professionnelle obligatoire. La rente LPP est coordonnée avec la rente AI — décision AI = liante pour l\'institution de prévoyance.',
        seuil_minimum: '40% d\'invalidité AI (LPP 23)',
        coordination_ai: 'La décision de l\'Office AI sur le taux est liante pour l\'institution LPP (sauf erreur manifeste). L\'institution peut intervenir dans la procédure AI (LAI 49).',
        echelle_quotite: [
          { taux_ai: '< 40%', rente_lpp: 'aucune' },
          { taux_ai: '40-49%', rente_lpp: 'rente partielle linéaire' },
          { taux_ai: '50-69%', rente_lpp: 'rente partielle linéaire' },
          { taux_ai: '>= 70%', rente_lpp: 'rente entière' },
        ],
        taux_ai_declare: taux_ai,
        droit_probable_lpp: droit_lpp,
        quotite_rente_percent: quotite,
        debut_prestations: 'Dès la naissance du droit à une rente AI (LPP 26 al. 1) — décision AI',
        montant_minimum_obligatoire: 'LPP obligatoire: rente calculée sur l\'avoir de vieillesse projeté jusqu\'à l\'âge de référence, avec taux de conversion 6.8% (LPP 14)',
        sur_obligatoire: 'Les règlements LPP enveloppants (avec part sur-obligatoire) peuvent prévoir des prestations plus élevées — consulter le règlement de la caisse.',
        autorite: 'Institution de prévoyance (caisse LPP) de l\'employeur au moment de la survenance de l\'incapacité de travail durable',
        recours: 'Action au tribunal cantonal des assurances (LPP 73) — sans épuisement préalable d\'opposition',
        prescription_action: '5 ans pour les prestations périodiques, 10 ans pour le capital (LPP 41)',
      };
    },
    exceptions: [
      {
        id: 'lpp_invalidite_avant_affiliation',
        label: 'Invalidité survenue avant affiliation = pas de droit LPP',
        condition: (f) => f.incapacite_anterieure_affiliation === true,
        consequence: 'Si la cause de l\'invalidité (incapacité de travail durable) est survenue avant l\'affiliation à l\'institution de prévoyance, celle-ci n\'est pas tenue aux prestations (LPP 23 — lien temporel).',
        source_id: 'fedlex:rs831.40:lpp-23',
        blocks: true,
      },
    ],
  },
  {
    id: 'lpp_encouragement_propriete',
    label: 'Encouragement à la propriété du logement — retrait anticipé LPP',
    base_legale: 'LPP 30c + OEPL',
    source_ids: ['fedlex:rs831.40:lpp-30c', 'fedlex:rs831.411:oepl-1'],
    condition: (f) => f.domaine === 'lpp' && (f.encouragement_propriete === true || f.retrait_achat_logement === true || f.versement_anticipe === true),
    consequence: (f) => {
      const age = Number.isFinite(f.age) ? f.age : null;
      return {
        text: 'L\'assuré peut retirer ou mettre en gage tout ou partie de son avoir LPP pour l\'acquisition ou la construction d\'un logement à usage propre (résidence principale), l\'amortissement d\'un emprunt hypothécaire ou l\'acquisition de parts de coopératives d\'habitation.',
        utilisations_autorisees: [
          'Acquisition ou construction d\'un logement en propriété pour usage propre',
          'Investissements augmentant la valeur du logement (rénovations majeures)',
          'Amortissement d\'un emprunt hypothécaire existant',
          'Acquisition de parts de coopératives d\'habitation / sociétés immobilières analogues',
        ],
        condition_usage: 'Usage PROPRE = résidence principale de l\'assuré. Pas de résidences secondaires ni de biens de placement.',
        montant_minimum_retrait: '20\'000 CHF (sauf parts de coopératives)',
        montant_minimum_chf: 20000,
        limitation_apres_50_ans: age !== null && age >= 50
          ? 'À partir de 50 ans, le retrait est limité au montant de l\'avoir à 50 ans OU à la moitié de l\'avoir actuel (le plus favorable) — LPP 30c al. 2'
          : 'Avant 50 ans : retrait de la totalité de l\'avoir possible',
        age_declare: age,
        frequence: 'Retrait possible tous les 5 ans (OEPL 5)',
        consentement_conjoint: 'Consentement écrit du conjoint / partenaire enregistré OBLIGATOIRE (LPP 30c al. 5) — signature authentifiée',
        impot_retrait: 'Le versement est imposé séparément du reste du revenu comme prestation en capital (LIFD 38 + canton) — taux réduit',
        remboursement: 'Remboursement autorisé (et recommandé pour reconstituer les prestations), jusqu\'à 3 ans avant la retraite (LPP 30d al. 3)',
        restriction_revente: 'En cas de revente, obligation de restitution à la caisse si prix > acquisition (LPP 30d) — mention au registre foncier',
        mise_en_gage: 'Alternative: mise en gage de l\'avoir (sans retrait) — permet meilleur emprunt hypothécaire sans impact fiscal immédiat',
        couverture_apres_retrait: 'Le retrait diminue les prestations futures (vieillesse, invalidité, décès). Il est recommandé de conclure une assurance complémentaire.',
        autorite: 'Institution de prévoyance (caisse LPP)',
        delai_versement: 'Maximum 6 mois dès demande complète',
      };
    },
    exceptions: [
      {
        id: 'lpp_propriete_consentement_conjoint_manquant',
        label: 'Défaut de consentement du conjoint = retrait nul',
        condition: (f) => f.conjoint_present === true && f.consentement_conjoint_ecrit === false,
        consequence: 'Le retrait sans consentement écrit du conjoint ou partenaire enregistré est nul (LPP 30c al. 5). Le conjoint peut agir pour restitution.',
        source_id: 'fedlex:rs831.40:lpp-30c',
        blocks: true,
      },
    ],
  },
  {
    id: 'lpp_partage_divorce',
    label: 'Partage de la prévoyance LPP au divorce',
    base_legale: 'LPP 22-22f + CC 122-124e',
    source_ids: ['fedlex:rs831.40:lpp-22', 'fedlex:rs210:cc-122', 'fedlex:rs210:cc-123', 'fedlex:rs210:cc-124'],
    condition: (f) => f.domaine === 'lpp' && (f.divorce === true || f.partage_lpp === true),
    consequence: (f) => ({
      text: 'Au divorce, les prestations de sortie LPP acquises pendant le mariage (entre mariage et introduction de la procédure) sont partagées par moitié entre les époux. Le partage s\'opère indépendamment du régime matrimonial.',
      principe: 'Partage par moitié des prestations de sortie acquises pendant le mariage (CC 122)',
      periode_partage: 'Du jour du mariage au jour du dépôt de la demande en divorce',
      objets_partage: [
        'Avoir de vieillesse LPP (obligatoire + sur-obligatoire)',
        'Libre passage (comptes de libre passage, polices de libre passage)',
        'Pilier 3a (si argument de rattachement professionnel — jurisprudence)',
      ],
      non_partage: [
        'Prestations acquises avant le mariage',
        'Prestations acquises après introduction de la demande',
        'Rentes déjà versées (mais calcul hypothétique possible CC 124)',
      ],
      cas_rente_en_cours: 'Si l\'un des époux reçoit déjà une rente LPP (invalidité ou vieillesse) au moment du divorce, le partage s\'opère par transfert d\'une part de la rente (CC 124a) calculée selon les tables LPC.',
      transfert: 'La part transférée est portée à l\'avoir de prévoyance ou au compte de libre passage de l\'ex-conjoint bénéficiaire (CC 123)',
      forme: 'Convention des époux homologuée par le juge OU décision judiciaire du juge du divorce',
      autorite_decision: 'Juge du divorce (tribunal civil de district / arrondissement)',
      execution: 'Tribunal des assurances sociales cantonal ordonne le transfert aux institutions LPP',
      refus_partage: 'Un partage peut être refusé en cas de violation manifeste de l\'équité (CC 124b) — ex: un époux a causé la ruine financière, absence pendant le mariage, etc.',
      delai_reclamation: 'Imprescriptible pendant le mariage ; action récursoire possible après divorce si partage non effectué (prescription 10 ans)',
      valeurs_determinantes: 'Valeurs au jour de l\'introduction de la procédure en divorce (CC 123 al. 1)',
      impact_fiscal: 'Le transfert est exempt d\'impôt (pas de prestation en capital imposable) car il reste dans le cycle de la prévoyance.',
    }),
    exceptions: [
      {
        id: 'lpp_partage_inequitable',
        label: 'Partage inéquitable — refus ou réduction',
        condition: (f) => f.inequite_partage === true,
        consequence: 'Le juge peut refuser le partage (ou ne le faire que partiellement) en cas d\'inéquité manifeste (CC 124b al. 2) — ex: période de mariage très courte, violation des obligations d\'entretien.',
        source_id: 'fedlex:rs210:cc-124',
        blocks: false,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// PPE RULES — propriété par étages (copropriété)
// ═══════════════════════════════════════════════════════════════

const PPE_RULES = [
  {
    id: 'ppe_charges_communes',
    label: 'Répartition des charges communes — PPE',
    base_legale: 'CC 712h-712m',
    source_ids: ['fedlex:rs210:cc-712h', 'fedlex:rs210:cc-712m'],
    condition: (f) => f.domaine === 'ppe' && (f.charges_communes === true || f.repartition_charges === true),
    consequence: (f) => ({
      text: 'Les charges communes (frais d\'entretien, réparations, chauffage, conciergerie, primes d\'assurance du bâtiment) sont réparties entre les copropriétaires en proportion des quotes-parts (millièmes), sauf convention contraire inscrite dans l\'acte constitutif ou le règlement d\'administration.',
      principe: 'Répartition selon quotes-parts (millièmes) — CC 712h al. 1',
      forme_convention_contraire: 'Convention dérogatoire possible dans l\'acte constitutif ou par décision de l\'assemblée des copropriétaires (CC 712h al. 3)',
      categories_charges: [
        'Charges d\'entretien et réparations courantes (usage intensif pris en compte)',
        'Charges d\'administration (conciergerie, gestion)',
        'Charges d\'énergie (chauffage — selon consommation avec compteurs individuels, OMEn)',
        'Primes d\'assurance bâtiment',
        'Fonds de rénovation (CC 712m al. 1 ch. 5)',
      ],
      decision_budget: 'L\'assemblée des copropriétaires décide du budget annuel à la majorité des voix et des quotes-parts (CC 712m al. 2 — majorité simple par défaut)',
      paiement: 'Avances trimestrielles ou mensuelles selon règlement. Décompte annuel après exercice.',
      opposition: 'Un copropriétaire peut contester une décision de l\'assemblée dans les 30 jours dès notification (CC 712p — voir règle ppe_recours_decision_ag)',
      garantie_creances: 'Hypothèque légale pour les charges des 3 dernières années (CC 712i) — inscription dans les 3 mois dès exigibilité',
      delai_hypotheque_mois: 3,
      autorite: 'Administrateur / assemblée des copropriétaires — en cas de litige : tribunal civil',
    }),
    exceptions: [
      {
        id: 'ppe_charges_usage_exclusif',
        label: 'Charges liées à l\'usage exclusif — seul le bénéficiaire paye',
        condition: (f) => f.charges_usage_exclusif === true,
        consequence: 'Les charges liées à des parties dont un copropriétaire a l\'usage exclusif (balcon, jardin, cave) peuvent être mises à sa charge seule selon le règlement (CC 712h al. 3).',
        source_id: 'fedlex:rs210:cc-712h',
        blocks: false,
      },
    ],
  },
  {
    id: 'ppe_travaux_majoritaire',
    label: 'Travaux en PPE — majorités selon type',
    base_legale: 'CC 647c-647e + 712g',
    source_ids: ['fedlex:rs210:cc-647c', 'fedlex:rs210:cc-647d', 'fedlex:rs210:cc-647e', 'fedlex:rs210:cc-712g'],
    condition: (f) => f.domaine === 'ppe' && (f.travaux_ppe === true || f.decision_travaux === true),
    consequence: (f) => {
      const type = f.type_travaux || null;
      const majorites = {
        entretien: { nom: 'Actes d\'administration courante (CC 647a)', majorite: 'Administrateur décide seul', article: 'CC 647a' },
        necessaires: { nom: 'Travaux de construction nécessaires (CC 647c)', majorite: 'Majorité simple des copropriétaires (1 voix par unité)', article: 'CC 647c' },
        utiles: { nom: 'Travaux utiles (CC 647d)', majorite: 'Majorité des copropriétaires représentant la majorité des quotes-parts (double majorité)', article: 'CC 647d' },
        somptuaires: { nom: 'Travaux somptuaires / de pur agrément (CC 647e)', majorite: 'UNANIMITÉ de tous les copropriétaires', article: 'CC 647e' },
      };
      const info = type ? majorites[type] : null;
      return {
        text: 'La majorité requise pour une décision de travaux dépend de leur nature : nécessaires (majorité simple), utiles (double majorité), somptuaires (unanimité).',
        type_travaux_declare: type,
        majorite_applicable: info || 'À déterminer selon nature — voir tableau',
        tableau_majorites: [
          { type: 'Administration courante', majorite_requise: 'Administrateur seul', base: 'CC 647a' },
          { type: 'Travaux nécessaires (conservation)', majorite_requise: 'Majorité simple (par tête)', base: 'CC 647c' },
          { type: 'Travaux utiles (amélioration)', majorite_requise: 'Double majorité : têtes + quotes-parts', base: 'CC 647d' },
          { type: 'Travaux somptuaires', majorite_requise: 'UNANIMITÉ', base: 'CC 647e' },
        ],
        regle_2023: 'Depuis le 1er janvier 2023 (révision), les travaux utiles de rénovation énergétique bénéficient d\'un régime allégé dans certains cantons.',
        proces_verbal: 'Décision consignée au procès-verbal de l\'assemblée (CC 712m) avec indication du nombre de voix',
        contestation_delai: '30 jours dès notification pour contester (CC 712p renvoyant à CC 75)',
        delai_jours_contestation: 30,
        autorite_contestation: 'Tribunal civil du lieu de l\'immeuble',
        financement: 'Prélèvement sur le fonds de rénovation ou appel de fonds proportionnel aux quotes-parts (sauf autre règle)',
        travaux_urgents: 'L\'administrateur ou un copropriétaire peut entreprendre seul des travaux urgents (CC 647 al. 2 ch. 1), à charge d\'en informer la communauté.',
      };
    },
    exceptions: [
      {
        id: 'ppe_travaux_droit_cantonal',
        label: 'Dérogations cantonales ou règlement interne',
        condition: (f) => f.regle_ppe_derogatoire === true,
        consequence: 'Le règlement d\'administration peut prévoir des majorités différentes (plus strictes, pas moins), sauf pour travaux somptuaires qui exigent toujours l\'unanimité (CC 647e al. 1).',
        source_id: 'fedlex:rs210:cc-712g',
        blocks: false,
      },
    ],
  },
  {
    id: 'ppe_recours_decision_ag',
    label: 'Recours contre une décision de l\'assemblée des copropriétaires',
    base_legale: 'CC 712p + CC 75',
    source_ids: ['fedlex:rs210:cc-712p', 'fedlex:rs210:cc-75'],
    condition: (f) => f.domaine === 'ppe' && (f.recours_decision_ag === true || f.contestation_ag === true),
    consequence: (f) => ({
      text: 'Tout copropriétaire qui n\'a pas consenti à la décision ou qui n\'y a pas été régulièrement convoqué peut, dans le mois dès qu\'il en a eu connaissance, l\'attaquer en justice.',
      delai: '1 mois (30 jours)',
      delai_jours: 30,
      point_depart: 'connaissance de la décision (à défaut de notification : date raisonnablement présumée)',
      autorite: 'Tribunal civil du lieu de l\'immeuble',
      qualite_pour_agir: [
        'Copropriétaire qui n\'a pas consenti à la décision (vote contre / abstention)',
        'Copropriétaire qui n\'a pas été régulièrement convoqué à l\'assemblée',
        'Copropriétaire empêché de voter (représentation refusée abusivement)',
      ],
      motifs_invocables: [
        'Violation de la loi (CC 647c-e, majorité incorrecte)',
        'Violation de l\'acte constitutif ou du règlement (convocation, ordre du jour, quorum)',
        'Décision contraire à la destination de l\'immeuble',
        'Décision abusive (abus de majorité, atteinte disproportionnée aux droits individuels)',
      ],
      procedure: 'Procédure ordinaire ou simplifiée selon valeur litigieuse (CPC 243)',
      effet_jugement: 'Annulation ex tunc de la décision (rétroactive). La décision est réputée n\'avoir jamais existé.',
      mesures_provisionnelles: 'Possibilité de demander des mesures provisionnelles (CPC 261) pour suspendre l\'exécution de la décision attaquée',
      consequence_passe_delai: 'Passé le délai d\'1 mois, la décision devient inattaquable (sauf nullité absolue rare — décision contraire à l\'ordre public, atteinte à un droit strictement personnel)',
      role_administrateur: 'L\'administrateur défend la communauté (CC 712s). Le copropriétaire agit CONTRE la communauté.',
    }),
    exceptions: [
      {
        id: 'ppe_ag_nullite_absolue',
        label: 'Nullité absolue — hors délai possible',
        condition: (f) => f.decision_nullite_absolue === true,
        consequence: 'Une décision frappée de nullité absolue (ex: violation d\'un droit strictement personnel, contraire à l\'ordre public, impossibilité objective) peut être invoquée en tout temps — hors délai d\'un mois.',
        source_id: 'fedlex:rs210:cc-75',
        blocks: false,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// CIRCULATION RULES — LCR et retraits de permis
// ═══════════════════════════════════════════════════════════════

const CIRCULATION_RULES = [
  {
    id: 'circulation_retrait_permis_admonestation',
    label: 'Retrait de permis à titre d\'admonestation — infraction légère',
    base_legale: 'LCR 16a',
    source_ids: ['fedlex:rs741.01:lcr-16a'],
    condition: (f) => f.domaine === 'circulation' && (f.infraction_legere === true || f.retrait_admonestation === true),
    consequence: (f) => {
      const recidive = f.recidive === true;
      return {
        text: 'Pour une infraction légère (mise en danger faible des autres usagers), un avertissement est prononcé. Si l\'intéressé a déjà été sanctionné dans les 2 années précédentes, un retrait de permis de 1 mois AU MOINS peut être prononcé.',
        premiere_infraction: 'Avertissement (pas de retrait) sauf cumul',
        recidive_2_ans: 'Retrait de 1 mois au moins (LCR 16a al. 2)',
        duree_minimum_mois: recidive ? 1 : 0,
        recidive_declaree: recidive,
        exemples_leger: [
          'Excès de vitesse 1-15 km/h en localité',
          'Excès 1-20 km/h hors localité',
          'Excès 1-25 km/h sur autoroute',
          'Distance insuffisante (cas léger)',
          'Infraction aux règles de stationnement grave mais sans mise en danger',
        ],
        consideration: 'Mise en danger FAIBLE des autres + faute LÉGÈRE du conducteur (cumul cumulatif CP 100 ch. 1)',
        delai_recours: '30 jours dès notification (LCR 24 + loi cantonale de procédure)',
        delai_jours_recours: 30,
        autorite_decision: f.canton
          ? `Service cantonal des automobiles (SAN) / Office de la circulation du canton de ${f.canton}`
          : 'Service cantonal des automobiles (Office de la circulation)',
        autorite_recours: 'Tribunal administratif cantonal (puis TF)',
        effet_suspensif: 'Selon canton — généralement pas d\'effet suspensif automatique, demande de restitution possible',
        procedure: 'Procédure administrative contradictoire avec droit d\'être entendu (audition ou prise de position écrite)',
        cumul_amende: 'Le retrait administratif s\'ajoute à l\'amende pénale (infraction au code de la route) — pas de double sanction au sens strict (dualité admin/pénal)',
        casier_admin: 'Inscrit au Système d\'information relatif à l\'admission à la circulation (SIAC / ADMAS) — consultable par autorités',
      };
    },
    exceptions: [],
  },
  {
    id: 'circulation_retrait_permis_obligatoire',
    label: 'Retrait de permis obligatoire — infraction moyennement grave ou grave',
    base_legale: 'LCR 16b-16c',
    source_ids: ['fedlex:rs741.01:lcr-16b', 'fedlex:rs741.01:lcr-16c'],
    condition: (f) => f.domaine === 'circulation' && (f.infraction_moyenne === true || f.infraction_grave === true || f.retrait_obligatoire === true),
    consequence: (f) => {
      const type = f.infraction_grave === true ? 'grave' : (f.infraction_moyenne === true ? 'moyenne' : null);
      const recidive = f.recidive === true;
      let duree_min = null;
      let base_article = null;
      if (type === 'moyenne') {
        duree_min = recidive ? 4 : 1; // LCR 16b al. 2
        base_article = 'LCR 16b';
      } else if (type === 'grave') {
        duree_min = recidive ? 12 : 3; // LCR 16c al. 2
        base_article = 'LCR 16c';
      }
      return {
        text: `Infraction ${type || 'à qualifier'} : le retrait de permis est obligatoire. La durée minimale est fixée par la loi et ne peut pas être réduite en dessous.`,
        type_infraction_declare: type,
        recidive_5_ans: recidive,
        duree_minimum_mois: duree_min,
        base_article_applicable: base_article,
        moyenne_definition: 'Mise en danger ACCRUE des autres usagers + faute NON légère (LCR 16b al. 1)',
        grave_definition: 'Mise en danger SÉRIEUSE des autres usagers + faute GRAVE ou intentionnelle (LCR 16c al. 1)',
        exemples_moyenne: [
          'Excès 16-24 km/h en localité',
          'Excès 21-29 km/h hors localité',
          'Excès 26-34 km/h sur autoroute',
          'Ébriété 0.5-0.79‰',
          'Refus de céder le passage avec mise en danger',
        ],
        exemples_grave: [
          'Excès ≥ 25 km/h en localité / ≥ 30 km/h hors localité / ≥ 35 km/h autoroute',
          'Ébriété qualifiée ≥ 0.8‰ (art. 91 al. 2 LCR)',
          'Conduite sous stupéfiants',
          'Fuite après accident avec blessés',
          'Violation grossière des règles (course-poursuite, circulation à contresens)',
        ],
        duree_table_moyenne: [
          { situation: '1ère infraction', duree_min: '1 mois' },
          { situation: 'Récidive dans 5 ans', duree_min: '4 mois' },
          { situation: 'Récidive multiple', duree_min: '9 mois' },
          { situation: 'Après retrait pour infraction grave', duree_min: '12 mois (LCR 16b al. 2 let. d)' },
        ],
        duree_table_grave: [
          { situation: '1ère infraction', duree_min: '3 mois' },
          { situation: 'Récidive dans 10 ans (après grave)', duree_min: '12 mois' },
          { situation: 'Récidive dans 10 ans (après 2 graves)', duree_min: 'DÉFINITIF (LCR 16c al. 2 let. d)' },
        ],
        delai_recours: '30 jours dès notification',
        delai_jours_recours: 30,
        autorite_decision: f.canton
          ? `Service cantonal des automobiles de ${f.canton}`
          : 'Service cantonal des automobiles (Office de la circulation)',
        test_MCT: 'Un test psychologique / médical (MCT) peut être ordonné pour attester l\'aptitude avant restitution — obligatoire pour chauffard (Via sicura)',
        ne_peut_etre_reduit: 'La durée minimale légale est INTANGIBLE — le juge ne peut pas réduire en dessous même pour bonne renommée ou nécessité professionnelle (ATF 132 II 234).',
        adaptation_necessite_professionnelle: 'La nécessité professionnelle est prise en compte uniquement pour ALLONGER la durée ou pas, dans les cas où un retrait plus court serait suffisant — mais jamais pour réduire sous le minimum légal.',
      };
    },
    exceptions: [
      {
        id: 'circulation_chauffard_via_sicura',
        label: 'Délit de chauffard — retrait minimum 2 ans (Via sicura)',
        condition: (f) => f.delit_chauffard === true,
        consequence: 'En cas de délit de chauffard (LCR 90 al. 3 et 4 — excès massifs), le retrait est de 2 ans au moins (LCR 16c al. 2 let. abis). Peine privative de liberté 1-4 ans + amende.',
        source_id: 'fedlex:rs741.01:lcr-16c',
        blocks: false,
      },
    ],
  },
  {
    id: 'circulation_recours_retrait',
    label: 'Recours contre un retrait de permis',
    base_legale: 'LCR 24 + lois cantonales de procédure administrative',
    source_ids: ['fedlex:rs741.01:lcr-24'],
    condition: (f) => f.domaine === 'circulation' && (f.recours_retrait === true || f.decision_retrait_recue === true),
    consequence: (f) => ({
      text: 'Le recours contre une décision de retrait de permis est adressé au tribunal administratif cantonal dans les 30 jours dès la notification. L\'effet suspensif varie selon canton et nature de la décision.',
      delai: '30 jours',
      delai_jours: 30,
      point_depart: 'notification de la décision de retrait',
      autorite_recours_1: f.canton
        ? `Tribunal cantonal / Cour administrative du canton de ${f.canton}`
        : 'Tribunal administratif cantonal',
      autorite_recours_2: 'Tribunal fédéral (recours en matière de droit public, LTF 82)',
      delai_recours_tf: '30 jours dès notification de l\'arrêt cantonal',
      forme: 'Écrite, motivée, signée, accompagnée de la décision attaquée et des pièces à l\'appui',
      effet_suspensif: {
        regle_generale: 'L\'effet suspensif est SOUVENT refusé en matière de retrait (intérêt public à la sécurité routière)',
        regle_cantonale: 'Varie selon canton — certains cantons accordent effet suspensif pour infractions légères, d\'autres jamais',
        demande: 'Doit être demandé expressément dans le recours (sinon décision exécutoire immédiatement)',
        critere_balance: 'Pesée d\'intérêts : sécurité routière vs. conséquences pour le recourant (perte d\'emploi, famille)',
      },
      motifs_invocables: [
        'Constatation inexacte des faits',
        'Violation du droit (LCR, LTV, OAC)',
        'Qualification juridique erronée (léger vs. moyen vs. grave)',
        'Proportionnalité de la durée (mais pas en dessous du minimum légal)',
        'Violation du droit d\'être entendu',
      ],
      procedure: 'Procédure administrative ordinaire avec échange d\'écritures (recours, réponse, réplique, duplique)',
      frais: 'Emolument judiciaire selon valeur/intérêt (typiquement 500-3\'000 CHF), à charge du recourant s\'il succombe',
      assistance_judiciaire: 'Possible si moyens insuffisants et cause pas dénuée de chances de succès (CPC 117 par analogie cantonale)',
      note: 'Consulter rapidement un avocat spécialisé en droit administratif routier — délais courts et procédure technique.',
    }),
    exceptions: [
      {
        id: 'circulation_recours_hors_delai',
        label: 'Délai dépassé — recours irrecevable sauf restitution',
        condition: (f) => f.delai_recours_depasse === true,
        consequence: 'Passé le délai de 30 jours, le recours est irrecevable (décision en force). Une restitution de délai est possible en cas d\'empêchement non fautif (accident, hospitalisation, PTT) par requête motivée dans les 10 jours après la fin de l\'empêchement.',
        source_id: 'fedlex:rs741.01:lcr-24',
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
  ...FISCAL_RULES,
  ...LPP_RULES,
  ...PPE_RULES,
  ...CIRCULATION_RULES,
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
  FISCAL_RULES,
  LPP_RULES,
  PPE_RULES,
  CIRCULATION_RULES,
  execRule,
};
