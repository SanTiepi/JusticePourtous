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
  execRule,
};
