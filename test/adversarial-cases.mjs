/**
 * Adversarial cases — écrits SANS regarder le dictionnaire de synonymes.
 *
 * Principe : mesurer si le pipeline peut encore qualifier correctement
 * un problème quand le citoyen utilise du vocabulaire imprévu, des
 * fautes d'orthographe, des périphrases, ou combine plusieurs problèmes.
 *
 * Chaque cas a :
 *  - query : formulation profane libre
 *  - expected_domaine : le domaine ATTENDU (1 seul, strict)
 *  - expected_any_article : au moins 1 article de cette liste doit être cité
 *  - notes : pourquoi ce cas est adversarial
 */

export const ADVERSARIAL_CASES = [
  // ========== BAIL — reformulations inattendues ==========
  {
    id: 'adv_bail_01',
    query: 'J\'habite à Lausanne. L\'eau coule du plafond quand il pleut, mon matelas est foutu, ça fait six mois que la régie s\'en fout.',
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 259a', 'CO 259b', 'CO 259d', 'CO 259e'],
    notes: 'Défaut de la chose louée décrit par symptômes concrets, sans le mot "défaut" ni "moisissure".',
  },
  {
    id: 'adv_bail_02',
    query: 'Le contrat de mon studio se termine fin juin, la gérance me dit qu\'elle veut reprendre les locaux et ne renouvelle pas. J\'ai trois enfants en bas âge.',
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 266', 'CO 271', 'CO 271a', 'CO 272'],
    notes: 'Résiliation / prolongation sans dire "résiliation" ni "prolongation".',
  },
  {
    id: 'adv_bail_03',
    query: 'Mon propriétaire me demande 400 francs de plus par mois à partir de janvier. Il dit juste "marché". Pas de formule officielle.',
    canton: 'FR',
    expected_domaine: 'bail',
    expected_any_article: ['CO 269', 'CO 269a', 'CO 269d', 'CO 270b'],
    notes: 'Augmentation sans formule officielle — signal nullité CO 269d.',
  },
  {
    id: 'adv_bail_04',
    query: 'Je dois partir plus tôt que prévu de mon appart à cause d\'un nouveau job à l\'étranger. Comment je peux me libérer du contrat sans payer des mois de rien ?',
    canton: 'ZH',
    expected_domaine: 'bail',
    expected_any_article: ['CO 264'],
    notes: 'Restitution anticipée / locataire de remplacement — vocabulaire absent du dico.',
  },
  {
    id: 'adv_bail_05',
    query: 'J\'ai rendu mon trois-pièces le 15, état des lieux sans problème signé. Deux mois plus tard, la gérance refuse de libérer mes 3 mois de garantie bancaire.',
    canton: 'BE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 257e'],
    notes: 'Caution / garantie bancaire avec langage bancaire plutôt que "caution".',
  },

  // ========== TRAVAIL — adversarial ==========
  {
    id: 'adv_travail_01',
    query: 'Je suis en incapacité totale depuis trois semaines à cause de ma dépression. Aujourd\'hui j\'ai reçu ma lettre de fin de contrat. J\'ai 7 ans de maison.',
    canton: null,
    expected_domaine: 'travail',
    expected_any_article: ['CO 336c'],
    notes: 'Licenciement pendant incapacité — "fin de contrat" au lieu de "licenciement".',
  },
  {
    id: 'adv_travail_02',
    query: 'Mon chef m\'humilie devant toute l\'équipe depuis que j\'ai refusé ses avances. Il me donne que les tâches ingrates. J\'ose plus aller bosser.',
    canton: null,
    expected_domaine: 'travail',
    expected_any_article: ['CO 328', 'CO 328b'],
    notes: 'Harcèlement sexuel + atteinte à la personnalité sans "harcèlement" ni "mobbing".',
  },
  {
    id: 'adv_travail_03',
    query: 'La boîte ne m\'a pas versé les 2 dernières fin de mois. Mon bailleur va me mettre dehors si je paie pas vite. Je fais quoi ?',
    canton: null,
    expected_domaine: 'travail',
    expected_any_article: ['CO 322', 'CO 323', 'CO 337a'],
    notes: 'Salaire impayé avec cascade (bail) — piège cross-domain.',
  },
  {
    id: 'adv_travail_04',
    query: 'J\'ai appris que ma collègue est payée 800 balles de plus que moi pour exactement la même fonction, même ancienneté. Je suis une femme.',
    canton: null,
    expected_domaine: 'travail',
    expected_any_article: ['LEg 3', 'LEg 5', 'Cst 8'],
    notes: 'Discrimination salariale — aucun mot direct du dico.',
  },
  {
    id: 'adv_travail_05',
    query: 'Mon employeur refuse de me donner le papier qui dit ce que j\'ai fait chez eux pendant 6 ans. J\'en ai besoin pour postuler ailleurs.',
    canton: null,
    expected_domaine: 'travail',
    expected_any_article: ['CO 330a'],
    notes: 'Certificat de travail par périphrase, pas le mot "certificat".',
  },

  // ========== DETTES — adversarial ==========
  {
    id: 'adv_dettes_01',
    query: 'Un type est passé ce matin me laisser un papier bleu. Il me réclame 3400 francs pour une facture d\'il y a 15 ans que j\'avais oubliée.',
    canton: null,
    expected_domaine: 'dettes',
    expected_any_article: ['LP 74', 'LP 75', 'CO 127', 'CO 128'],
    notes: 'Commandement de payer + prescription potentielle — pas dit "commandement".',
  },
  {
    id: 'adv_dettes_02',
    query: 'L\'office veut me prendre 1200 balles sur mon salaire de 3800. Avec deux gamins à charge, je peux pas survivre.',
    canton: 'VD',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 93'],
    notes: 'Minimum vital contesté — pas dit "minimum vital" ni "saisie" clairement.',
  },
  {
    id: 'adv_dettes_03',
    query: 'J\'ai signé un concordat il y a 3 ans, maintenant un créancier prétend que je lui dois encore 8000. Est-ce qu\'il peut ?',
    canton: null,
    expected_domaine: 'dettes',
    expected_any_article: ['LP 303', 'LP 310', 'LP 311'],
    notes: 'Concordat — terme technique, pas dans le dico de synonymes.',
  },
  {
    id: 'adv_dettes_04',
    query: 'Ma carte de crédit a été bloquée, la banque demande 9000 francs d\'un coup. Je peux pas payer. Comment éviter que ça devienne pire ?',
    canton: null,
    expected_domaine: 'dettes',
    expected_any_article: ['LP 38', 'LP 67', 'LP 74'],
    notes: 'Surendettement pré-poursuite — langage bancaire.',
  },

  // ========== FAMILLE — adversarial ==========
  {
    id: 'adv_famille_01',
    query: 'Mon mari et moi on vit plus ensemble depuis 4 mois, il veut garder la maison et les petits. Je sais pas par où commencer.',
    canton: 'VS',
    expected_domaine: 'famille',
    expected_any_article: ['CC 111', 'CC 112', 'CC 114', 'CC 176'],
    notes: 'Séparation avec enjeux garde + logement — multi-facteur.',
  },
  {
    id: 'adv_famille_02',
    query: 'Mon ex paye plus la pension des enfants depuis 6 mois. Il travaille au noir donc difficile de le coincer.',
    canton: null,
    expected_domaine: 'famille',
    expected_any_article: ['CC 276', 'CC 289', 'CC 291'],
    notes: 'Recouvrement pension alimentaire — piège cross-domain (dettes).',
  },

  // ========== ÉTRANGERS — adversarial ==========
  {
    id: 'adv_etrangers_01',
    query: 'Je vis en Suisse depuis 11 ans avec un permis B, j\'ai toujours bossé. Ma boîte vient de fermer. Est-ce que je peux perdre mon droit de rester ?',
    canton: 'ZH',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 33', 'LEI 62', 'LEI 61'],
    notes: 'Permis B + chômage — piège cross-domain travail.',
  },
  {
    id: 'adv_etrangers_02',
    query: 'Ma femme vit au Kosovo avec notre fille de 3 ans. Je veux qu\'elles viennent me rejoindre ici. J\'ai un permis C depuis 2 ans.',
    canton: null,
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 43', 'LEI 44', 'LEI 47'],
    notes: 'Regroupement familial — deux formulations possibles.',
  },

  // ========== CAS HYBRIDES (pièges) ==========
  {
    id: 'adv_hybride_01',
    query: 'Mon propriétaire m\'a donné congé parce que j\'ai porté plainte contre lui pour harcèlement. Il vient tous les jours me crier dessus dans l\'appartement.',
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 271', 'CO 271a'],
    notes: 'Congé de représailles + harcèlement. Le mot "harcèlement" DOIT pointer bail, pas travail.',
  },
  {
    id: 'adv_hybride_02',
    query: 'Je reçois l\'aide sociale depuis 2 ans. Mon propriétaire veut que je libère l\'appart pour faire des travaux, mais le CSR refuse de payer un nouveau loyer plus cher.',
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 260', 'CO 271', 'CO 272'],
    notes: 'Travaux bailleur + pression aide sociale — vrai problème = bail.',
  },

  // ========== BAIL — extension wave 2 ==========
  {
    id: 'adv_bail_06',
    query: 'Trois semaines sans chauffage en plein janvier dans mon appart, la régie me dit qu\'ils cherchent un installateur. Mes gamins toussent à mort.',
    canton: 'NE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 259a', 'CO 259b', 'CO 259d'],
    notes: 'Défaut grave (chauffage hiver) décrit par conséquences corporelles — sans le mot "défaut".',
  },
  {
    id: 'adv_bail_07',
    query: 'Ma voisine du dessus claque les portes et écoute la télé fort jusqu\'à 2h du mat. J\'ai signalé 4 fois à la gérance, elle dit qu\'elle peut rien faire.',
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 259a', 'CO 259b', 'CO 259d', 'CO 257f'],
    notes: 'Trouble du voisinage = défaut imputable bailleur. Vocabulaire profane.',
  },
  {
    id: 'adv_bail_08',
    query: 'Je voudrais accueillir ma cousine du Brésil deux mois chez moi. Le règlement de la régie dit qu\'il faut leur demander. Ils peuvent vraiment refuser ?',
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 262'],
    notes: 'Sous-location partielle / hébergement — éviter le mot "sous-louer" en gros.',
  },

  // ========== TRAVAIL — extension wave 2 ==========
  {
    id: 'adv_travail_06',
    query: 'Ça fait 14 mois que je fais 10-12h par jour, ils m\'ont jamais payé une seule heure en plus. Mon contrat dit 42h.',
    canton: null,
    expected_domaine: 'travail',
    expected_any_article: ['CO 321c', 'CO 322'],
    notes: 'Heures supplémentaires impayées — sans "heures sup" ni "majoration".',
  },
  {
    id: 'adv_travail_07',
    query: 'Mon patron m\'a convoqué demain matin "pour parler de mon avenir dans l\'entreprise". Il m\'a déjà dit la semaine passée qu\'il était pas content. Je flippe.',
    canton: null,
    expected_domaine: 'travail',
    expected_any_article: ['CO 335', 'CO 335c', 'CO 336'],
    notes: 'Pré-licenciement / résiliation imminente — anticipation, pas encore lettre.',
  },

  // ========== DETTES — extension wave 2 ==========
  {
    id: 'adv_dettes_05',
    query: 'L\'hôpital de Berne a envoyé toutes mes factures à un bureau de recouvrement. 18\'400 francs au total. Je peux pas, je vis au RI.',
    canton: 'BE',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 38', 'LP 67', 'LP 93'],
    notes: 'Factures médicales en recouvrement + minimum vital — sans "saisie".',
  },
  {
    id: 'adv_dettes_06',
    query: 'En 2019 j\'ai signé un papier comme garant pour mon meilleur pote pour son prêt voiture. Il est parti à Dubai. La banque m\'envoie tout sur le dos maintenant.',
    canton: null,
    expected_domaine: 'dettes',
    expected_any_article: ['CO 492', 'CO 493', 'CO 509', 'LP 38'],
    notes: 'Cautionnement personnel — vocabulaire profane, pas dit "caution".',
  },

  // ========== FAMILLE — extension wave 2 ==========
  {
    id: 'adv_famille_03',
    query: 'On a vécu 5 ans ensemble, jamais mariés. On a un fils de 3 ans. Je veux partir, mais il dit qu\'il garde le petit parce qu\'il a plus d\'argent que moi.',
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 296', 'CC 298', 'CC 298a', 'CC 298b'],
    notes: 'Autorité parentale concubinage — sans "garde" ni "autorité parentale".',
  },
  {
    id: 'adv_famille_04',
    query: 'Mon père est mort il y a 2 mois sans laisser de papier qui dit quoi pour qui. On est 3 enfants mais ma belle-mère prétend qu\'elle a droit à tout.',
    canton: 'TI',
    expected_domaine: 'successions',
    expected_any_article: ['CC 457', 'CC 458', 'CC 462'],
    notes: 'Succession ab intestat / réserve héréditaire — sans "succession" ni "testament". Domaine = successions (le navigator route correctement ici, pas vers famille).',
  },

  // ========== ÉTRANGERS — extension wave 2 ==========
  {
    id: 'adv_etrangers_03',
    query: 'Je suis venu de Tunisie avec mon mari suisse il y a 4 ans, j\'ai un permis B. On est séparés depuis 8 mois, il veut divorcer. Est-ce que je peux rester ?',
    canton: 'GE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 50', 'LEI 49'],
    notes: 'Rupture union conjugale + maintien permis B — Art 50 LEI, sans dire "LEI".',
  },

  // ========== WAVE 3 — 10 nouveaux domaines et angles non couverts ==========

  // BAIL — hausse de loyer indexée au renchérissement
  {
    id: 'adv_bail_09',
    query: 'La régie vient de m\'envoyer une lettre qui dit que mon loyer monte de 3.4% dès le 1er avril, justifié par "l\'évolution des prix depuis la signature du bail". J\'ai cherché sur internet et ça me semble excessif. Comment c\'est calculé ?',
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 269b', 'CO 270', 'CO 270b'],
    notes: 'Indexation loyer au renchérissement IPC — sans les mots "indexation" ni "IPC". Le % peut être contesté si mal calculé.',
  },

  // TRAVAIL — clause de non-concurrence post-emploi
  {
    id: 'adv_travail_08',
    query: 'J\'ai accepté un poste chez un concurrent direct. Mon ancien employeur m\'a envoyé une lettre d\'avocat en citant "l\'article 8 de mon contrat d\'embauche" — il dit que j\'ai pas le droit de travailler dans la branche pendant 2 ans.',
    canton: null,
    expected_domaine: 'travail',
    expected_any_article: ['CO 340', 'CO 340a', 'CO 340b'],
    notes: 'Clause de non-concurrence post-emploi — sans "non-concurrence". Durée 2 ans potentiellement excessive.',
  },

  // ÉTRANGERS — naturalisation (vocabulaire profane : "passeport rouge")
  {
    id: 'adv_etrangers_04',
    query: 'Ça fait 12 ans que je vis ici, j\'ai le permis C depuis 4 ans, je parle français, je paie mes impôts, j\'ai jamais eu de problème avec la justice. Mon voisin dit qu\'il suffit de 10 ans pour avoir le passeport rouge. C\'est vrai ? Je fais comment ?',
    canton: 'GE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LN 9', 'LN 10', 'LEI 34'],
    notes: 'Naturalisation ordinaire — "passeport rouge" plutôt que "naturalisation". Durée de séjour + conditions.',
  },

  // SUCCESSIONS — réserve héréditaire lésée par testament
  {
    id: 'adv_successions_01',
    query: 'Mon père est décédé il y a deux semaines. Il avait fait un testament notarié qui laisse 80% de ses biens à une fondation religieuse et ne nous laisse que 20% à nous trois enfants. Il pouvait vraiment faire ça ?',
    canton: 'TI',
    expected_domaine: 'successions',
    expected_any_article: ['CC 471', 'CC 522'],
    notes: 'Réserve héréditaire lésée par testament — sans "réserve" ni "quotité disponible". Complément à adv_famille_04 (ab intestat).',
  },

  // VOISINAGE — arbres empiétants (racines + branches)
  {
    id: 'adv_voisinage_01',
    query: 'Les racines du grand noyer de chez mon voisin soulèvent ma terrasse et ses branches plongent au-dessus de ma voiture. J\'en ai parlé plusieurs fois, il dit que l\'arbre est là depuis 40 ans et qu\'il ne touchera pas à un seul tronc.',
    canton: 'BE',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 684', 'CC 685', 'CC 687'],
    notes: 'Empiètement végétal — "noyer", "racines", "branches" sans les termes juridiques. Droit de couper CC 687.',
  },

  // CONSOMMATION — garantie légale 2 ans vs 1 an commercial
  {
    id: 'adv_consommation_01',
    query: 'J\'ai acheté un lave-vaisselle 1100 francs dans une grande surface il y a 14 mois. La pompe a lâché. Le service après-vente dit que la garantie d\'un an est expirée et qu\'ils ne feront rien. Y\'a-t-il un autre recours ?',
    canton: null,
    expected_domaine: 'consommation',
    expected_any_article: ['CO 197', 'CO 210'],
    notes: 'Garantie légale vice caché 2 ans CO 210 vs 1 an commercial — vocabulaire profane. Fréquent et mal connu.',
  },

  // FAMILLE — recherche en paternité / reconnaissance forcée
  {
    id: 'adv_famille_05',
    query: 'Je suis enceinte de 6 mois. Le père biologique nie tout et refuse de signer quoi que ce soit. Je veux que l\'enfant soit reconnu officiellement par son père et que celui-ci participe financièrement. C\'est possible de l\'obliger ?',
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 261', 'CC 260', 'CC 276'],
    notes: 'Action en constatation de paternité + obligation alimentaire — sans "filiation" ni "action en paternité".',
  },

  // CIRCULATION — retrait de permis après infraction routière
  {
    id: 'adv_circulation_01',
    query: 'Hier soir j\'ai grillé un feu rouge, la police m\'a arrêté et m\'a dit que j\'allais probablement recevoir une convocation de l\'office des automobiles pour discuter de mon permis. J\'ai déjà un avertissement de l\'an dernier. C\'est quoi la suite ?',
    canton: 'ZH',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 16', 'LCR 16b', 'LCR 16c'],
    notes: 'Retrait de permis administratif après récidive — sans "retrait administratif". Récidive aggrave la sanction.',
  },

  // DETTES — surendettement total / concordat
  {
    id: 'adv_dettes_07',
    query: 'Je dois 54\'000 francs en tout entre deux cartes de crédit, un crédit conso et des impôts impayés. Je gagne 3200 nets. Je commence à plus répondre au téléphone. Y\'a-t-il une procédure légale pour reprendre le contrôle et éventuellement repartir à zéro ?',
    canton: null,
    expected_domaine: 'dettes',
    expected_any_article: ['LP 293', 'LP 38', 'LP 67'],
    notes: 'Sursis concordataire / désendettement — "repartir à zéro" au lieu de "concordat". Cumul de créanciers.',
  },

  // HYBRIDE — bailleur qui veut vider l\'immeuble pour travaux (piège : "vider" ≠ expulsion)
  {
    id: 'adv_hybride_03',
    query: 'Le propriétaire veut rénover entièrement l\'immeuble et nous demande de vider nos appartements pendant 4 mois. Il propose 800 francs de dédommagement. Je suis parent seul avec deux enfants — me retrouver à l\'hôtel 4 mois avec 800 francs c\'est intenable. Il peut vraiment exiger ça ?',
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 260', 'CO 259d', 'CO 272'],
    notes: 'Travaux extensifs bailleur + évacuation temporaire — "vider" pourrait confondre avec expulsion. Droit réduction loyer CO 259d, tolérance travaux CO 260.',
  },

  // ========== WAVE 4 — domaines beta sans couverture (social/assurances/sante/violence/entreprise/accident) ==========

  // SOCIAL → ASSURANCES — AI : rente quart contestée (60% incapacité médicale vs évaluation AI)
  {
    id: 'adv_social_01',
    query: "L'assurance-invalidité m'a accordé un quart de rente seulement. Mon médecin traitant atteste 60% d'incapacité de travail depuis 18 mois. Leur médecin-conseil a conclu à 40%. Quel recours j'ai contre leur décision ?",
    canton: null,
    expected_domaine: 'assurances',
    expected_any_article: ['LAI 28', 'LAI 28a', 'LPGA 52', 'LPGA 61'],
    notes: "Rente AI insuffisante — 'quart de rente' sans mention 'recours LPGA'. Conflit médecin traitant vs médecin-conseil. Opposition LPGA 52 puis recours cantonal. NOTE: JusticePourtous classe AI/chômage dans domaine 'assurances' (assurance_ai_opposition) et non 'social'.",
  },

  // SOCIAL → ASSURANCES — chômage après démission pour harcèlement (juste motif LACI 30)
  // FICHE MANQUANTE POTENTIELLE : LACI 30 (suspension démission juste motif) absent des fiches retournées
  {
    id: 'adv_social_02',
    query: "J'ai quitté mon poste parce que mon responsable me harcelait depuis 8 mois, j'ai des preuves écrites. La caisse de chômage m'impose une suspension de 5 semaines et réduit mes indemnités. Ils peuvent vraiment pénaliser quelqu'un qui a dû partir pour se protéger ?",
    canton: null,
    expected_domaine: 'assurances',
    expected_any_article: ['LACI 30', 'LACI 17'],
    notes: "Suspension chômage après démission — harcèlement documenté = juste motif LACI 30 al. 1 lit. a. Vocabulaire : 'harcèlement' et non 'juste motif de résiliation'. Piège : la suspension paraît injuste mais peut être contestée. NOTE: JusticePourtous classe chômage dans 'assurances'. LACI 30 absent des fiches existantes → gap 'assurance_chomage_demission_juste_motif' documenté dans docs/missing-fiches.md.",
  },

  // SOCIAL → ASSURANCES — délai-cadre cotisation insuffisant (CDD 6 mois, 60%)
  {
    id: 'adv_social_03',
    query: "Mon contrat à durée déterminée vient de se terminer après 6 mois à 60%. La caisse de chômage me dit que je n'ai pas assez cotisé pour avoir droit aux indemnités. Il y a pas d'exception pour les contrats courts ou les personnes en sortant d'une formation ?",
    canton: null,
    expected_domaine: 'assurances',
    expected_any_article: ['LACI 8', 'LACI 13', 'LACI 14'],
    notes: "Délai-cadre de cotisation insuffisant — CDD 6 mois à 60% = 3.6 mois ETP. LACI 8 (conditions générales), LACI 13 (délai-cadre), LACI 14 (libération des conditions de cotisation pour retour de formation). NOTE: JusticePourtous classe chômage dans 'assurances' (assurance_chomage_indemnites_conditions).",
  },

  // ASSURANCES → SANTE — refus remboursement LAMal (IRM prescrite = 'pas médicalement nécessaire')
  {
    id: 'adv_assurances_01',
    query: "Mon médecin a prescrit une IRM du genou après une entorse grave. Mon assurance-maladie refuse de rembourser en invoquant une décision de son médecin-conseil qui dit que c'est 'pas médicalement nécessaire'. La facture est de 850 francs. Je peux les obliger à payer ?",
    canton: null,
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 34', 'LPGA 52', 'OPAS'],
    notes: "Refus remboursement LAMal sur avis médecin-conseil — 'pas médicalement nécessaire' sans mention 'opposition LPGA 52'. OPAS art. 9 (imagerie médicale). Procédure : opposition écrite dans 30 jours. NOTE: JusticePourtous classe les refus LAMal dans domaine 'sante' (sante_lamal_refus_prestation) et non 'assurances'.",
  },

  // SANTE — erreur médicale / complication post-opératoire (responsabilité civile)
  {
    id: 'adv_sante_01',
    query: "Opéré du ménisque il y a 4 mois, j'ai encore un genou qui se bloque et des douleurs permanentes. Un deuxième chirurgien pense qu'il y a eu une erreur de technique lors de l'intervention. Le premier chirurgien dit que c'est 'dans les risques normaux'. J'ai un recours contre lui ?",
    canton: 'VD',
    expected_domaine: 'sante',
    expected_any_article: ['CO 394', 'CO 41', 'CO 97'],
    notes: "Responsabilité médicale civile — vocabulaire : 'erreur de technique' plutôt que 'faute médicale'. Relation médecin-patient = mandat CO 394. Responsabilité délictuelle CO 41 (Code des Obligations, pas CC). Expertise médicale indépendante recommandée.",
  },

  // VIOLENCE — harcèlement obsessionnel ex-partenaire (stalking CP 181a)
  {
    id: 'adv_violence_01',
    query: "Mon ex ne me laisse pas tranquille depuis 3 mois : messages toutes les heures, se poste devant mon travail, a contacté mes amis. La police dit qu'elle ne peut rien faire s'il ne me touche pas physiquement. Il y a une loi qui me protège ?",
    canton: null,
    expected_domaine: 'violence',
    expected_any_article: ['CP 181a', 'CC 28b', 'CP 180'],
    notes: "Stalking sans violence physique — 'harcèlement' et non 'poursuite obsessionnelle'. CP 181a (harcèlement obsessionnel, en vigueur depuis 2022), CC 28b (interdiction de prise de contact ordonnée par juge civil). Fréquent : victime pense que la loi l'exige.",
  },

  // ENTREPRISE — dissolution Sàrl sans dettes (procédure simplifiée)
  {
    id: 'adv_entreprise_01',
    query: "J'ai une Sàrl de conseil informatique que je veux fermer. Aucune dette, plus d'activité depuis 18 mois. Je dois passer par un avocat et un notaire pour la radier du Registre du commerce, ou il y a une procédure simplifiée que je peux faire moi-même ?",
    canton: null,
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 821', 'CO 740', 'CO 746'],
    notes: "Dissolution Sàrl volontaire sans passif — vocabulaire : 'fermer', 'radier', 'RC'. CO 821 (dissolution Sàrl), CO 740 (nomination liquidateur), CO 746 (clôture liquidation). Procédure possible sans avocat si simple.",
  },

  // ENTREPRISE — associé Sàrl qui veut sortir / blocage du rachat de parts
  {
    id: 'adv_entreprise_02',
    query: "Mon associé dans ma Sàrl veut partir et exige que je lui rachète ses 40% à 180'000 francs. Je n'ai pas cette somme, et je trouve pas d'acheteur extérieur non plus parce que les statuts l'interdisent. On est bloqués. Qu'est-ce qu'on peut faire ?",
    canton: null,
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 786', 'CO 822', 'CO 821'],
    notes: "Sortie associé Sàrl bloquée — 'racheter ses parts' au lieu de 'cession de parts sociales CO 786'. Clause d'agrément dans les statuts. Possible dissolution par voie judiciaire si impasse.",
  },

  // ACCIDENT — accident de travail LAA, réduction indemnités pour faute grave
  {
    id: 'adv_accident_01',
    query: "Tombé d'un échafaudage sur mon chantier, fracture du poignet, 8 semaines d'arrêt. Mon patron dit que c'est ma faute car je portais pas le harnais. La SUVA a payé les soins mais réduit mes indemnités journalières de 20%. C'est légal ? Mon employeur avait fourni le harnais, je sais même pas si j'étais obligé.",
    canton: null,
    expected_domaine: 'accident',
    expected_any_article: ['LAA 6', 'LAA 37', 'OPA 5'],
    notes: "Réduction indemnités LAA pour prétendue faute grave — 'ils ont réduit mes indemnités' sans référence LAA 37. Obligations patronales OPA 5 (sécurité chantier) peuvent contrebalancer la faute de l'employé.",
  },

  // ACCIDENT — accident vélo / RC propriétaire de véhicule motorisé
  {
    id: 'adv_accident_02',
    query: "Un automobiliste m'a renversé à vélo — j'avais la priorité à droite. Épaule fracturée, 6 semaines d'arrêt maladie. Son assurance RC propose 9'000 francs de dédommagement mais mes seuls salaires perdus dépassent 14'000. C'est normal qu'ils proposent si peu, et est-ce que je peux négocier ou porter plainte ?",
    canton: null,
    expected_domaine: 'accident',
    expected_any_article: ['LCR 58', 'LCR 65', 'CO 46'],
    notes: "RC propriétaire véhicule motorisé vs cycliste — 'renversé à vélo', pas 'LCR 58 responsabilité causale'. Offre assurance inférieure au dommage réel (lucrum cessans CO 46). Négociation possible, action en justice LCR 65.",
  },

  // ========== WAVE 5 — approfondissement domaines sous-représentés (voisinage×2 / violence×2 / successions×2 / consommation×2 / circulation / assurances) ==========

  // VOISINAGE — servitude de passage non inscrite au registre foncier (droit de passage nécessaire)
  {
    id: 'adv_voisinage_02',
    query: "J'ai acheté une maison à la campagne. Pour y accéder depuis la route, je dois passer sur le chemin qui traverse le terrain du voisin — c'est comme ça depuis des générations. Son fils vient d'hériter et veut poser un portail fermé à clé. Sans ce passage, je n'ai aucun autre accès à ma propriété.",
    canton: 'FR',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 694', 'CC 679', 'CC 684'],
    notes: "Droit de passage nécessaire (enclave) — 'passer sur le chemin' sans 'servitude' ni 'CC 694'. Même sans inscription au RF, le droit d'accès peut être revendiqué (CC 694 voie d'accès, CC 695 servitude légale). Action en établissement de servitude ou action négatoire.",
  },

  // VOISINAGE — dégâts causés par les travaux de construction du voisin
  {
    id: 'adv_voisinage_03',
    query: "Mon voisin a fait construire une grande extension accolée à notre mur mitoyen l'été passé. Depuis, j'ai des fissures dans mon salon et ma cave est humide. Un expert indépendant a établi par écrit que les dégâts viennent des travaux de fondation du voisin. Il refuse d'admettre le lien et dit que c'est la vétusté de ma maison.",
    canton: 'GE',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 679', 'CC 684', 'CO 41'],
    notes: "Responsabilité propriétaire foncier pour dommages consécutifs à travaux — 'fissures + humidité suite aux travaux' sans 'CC 679'. Expertise contradictoire utile. Conciliation obligatoire avant action civile dans la plupart des cantons.",
  },

  // VIOLENCE — violence conjugale répétée, protection urgente avec enfants
  {
    id: 'adv_violence_02',
    query: "Mon mari me frappe régulièrement depuis des années. Hier c'était grave, j'ai des bleus. Mes enfants de 7 et 10 ans ont tout vu. Je veux partir avec eux ce soir mais j'ai peur qu'il nous retrouve et qu'il revienne. Qu'est-ce que je peux faire pour nous protéger lui et moi tout de suite ?",
    canton: 'VD',
    expected_domaine: 'violence',
    expected_any_article: ['CC 28b', 'LAVI 9', 'CP 123'],
    notes: "Violence conjugale avec urgence — 'il me frappe' sans 'expulsion du domicile CC 28b'. Mesures d'urgence civiles (ordonnance d'interdiction d'approche, expulsion du domicile conjugal) et pénales (arrestation CP 123). Hébergement d'urgence LAVI 9.",
  },

  // VIOLENCE — agression dans l'espace public par auteur inconnu, indemnisation LAVI
  {
    id: 'adv_violence_03',
    query: "J'ai été agressée dans la rue vendredi soir. Deux côtes cassées, 6 semaines d'arrêt maladie. La police a ouvert une enquête mais dit qu'il y a peu de chances de retrouver l'auteur. Mon assurance maladie couvre les frais médicaux mais pas mon salaire perdu. Qui peut m'aider à récupérer ces 9'000 francs si l'auteur est introuvable ?",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['LAVI 2', 'LAVI 19', 'LAVI 22'],
    notes: "Indemnisation LAVI quand auteur inconnu ou insolvable — 'récupérer le salaire perdu' sans 'LAVI'. L'État (bureau LAVI cantonal) indemnise les pertes économiques même sans condamnation pénale (LAVI 19, 22). Délai de dépôt : 10 ans depuis l'infraction (LAVI 25).",
  },

  // SUCCESSIONS — héritage sans testament, famille recomposée
  {
    id: 'adv_successions_02',
    query: "Mon père est décédé la semaine dernière. Il était remarié depuis 12 ans — sa deuxième femme a deux enfants d'un premier mariage à elle. Mon père avait aussi une maison achetée avant le remariage. Il n'avait pas de testament. Comment se fait le partage entre moi, ma sœur, et sa veuve ?",
    canton: 'NE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 457', 'CC 462', 'CC 471'],
    notes: "Succession ab intestat avec famille recomposée — 'partage entre moi, ma sœur et sa veuve' sans 'CC 462 quote-part légale conjoint'. Les enfants du conjoint survivant ne sont PAS héritiers légaux. Part légale conjoint (CC 462 : moitié) vs réserve des descendants (CC 471 : moitié des parts légales). NOTE eval wave5 : haiku inclut famille_regime_matrimonial (à cause de 'remariage') + génère IDs succession sans préfixe domaine → eval inférait domaine=famille. Routing gap : query succession + contexte remariage → risque de confusion avec famille. Gap documenté dans docs/missing-fiches.md.",
  },

  // SUCCESSIONS — contestation testament pour incapacité de discernement (curatelle)
  {
    id: 'adv_successions_03',
    query: "Ma grand-mère de 93 ans était sous curatelle depuis 3 ans pour démence sénile. Mon oncle lui a fait signer un testament il y a 5 mois qui lui laisse presque tout (la maison vaut CHF 650'000). Elle est décédée le mois passé. Ce testament peut être annulé ?",
    canton: 'GE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 467', 'CC 519', 'CC 16'],
    notes: "Nullité testament pour incapacité de discernement — 'curatelle pour démence' sans 'CC 467 capacité de disposer'. Curatelle de portée générale → présomption d'incapacité de discernement. Action en nullité CC 519 al. 1 ch. 1 (délai 1 an depuis la connaissance + 10 ans absolu).",
  },

  // CONSOMMATION — achat en ligne non livré, vendeur injoignable
  {
    id: 'adv_consommation_02',
    query: "J'ai commandé et payé CHF 760 en ligne pour un vélo électrique. La livraison était promise sous 2 semaines, il y a maintenant 8 semaines. Le vendeur ne répond plus aux emails, le chat du site est fermé, mais le site est toujours actif et continue à vendre. Comment est-ce que je récupère mon argent ?",
    canton: 'ZH',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 102', 'CO 107', 'CO 184'],
    notes: "Demeure du vendeur + e-commerce — 'ne répond plus' sans 'mise en demeure CO 102'. Recours chargeback bancaire possible (délai 120 jours Visa/MC). Mise en demeure formelle avant désistement CO 107. Plainte pénale possible si intention frauduleuse.",
  },

  // CONSOMMATION — vice caché véhicule d'occasion vendu par particulier
  {
    id: 'adv_consommation_03',
    query: "J'ai acheté une voiture d'occasion à un particulier il y a 6 semaines, CHF 11'500. Il m'a dit 'impeccable, aucun problème'. Maintenant la boîte de vitesses rend l'âme — devis de CHF 4'200. Mon mécanicien dit que c'est un problème préexistant évident, pas lié à mon usage. Le vendeur dit 'vendu en l'état, c'est vos risques'.",
    canton: 'VD',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 197', 'CO 201', 'CO 199'],
    notes: "Vice caché vente particulier-particulier — 'garanti sans problème' puis 'vendu en l'état'. Exclusion garantie invalide si vendeur connaissait le vice (CO 199). Délai de notification immédiatement après découverte (CO 201). Résolution ou réduction prix (CO 205).",
  },

  // CIRCULATION — conduite en état d'ivresse qualifié (première infraction)
  {
    id: 'adv_circulation_02',
    query: "J'ai été contrôlé hier soir après un contrôle routier. L'alcootest indiquait 0.82 pour mille — c'est la première fois que ça m'arrive. La police m'a annoncé une dénonciation à l'office de la circulation. Est-ce que mon permis est automatiquement retiré, pour combien de temps, et est-ce que je risque du pénal ?",
    canton: 'BE',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 91', 'LCR 16c', 'LCR 31'],
    notes: "Ivresse qualifiée 1ère infraction — '0.82 pour mille' sans 'LCR 91 a. 2' ni 'infraction grave'. Seuil qualifié = ≥0.8‰ sang (≥0.4 mg/L haleine). LCR 16c : infraction grave → retrait min. 3 mois même 1ère fois. Procédure pénale et administrative parallèles (amende + jours-amende + retrait).",
  },

  // ASSURANCES — demande AI (burn-out) en souffrance depuis 10 mois, menace licenciement
  {
    id: 'adv_assurances_02',
    query: "Je suis en arrêt de travail total depuis 17 mois pour burn-out sévère. J'ai déposé une demande à l'assurance-invalidité il y a 10 mois. L'office AI a demandé deux fois des examens complémentaires mais je n'ai toujours aucune décision. Mon employeur me menace de licenciement. J'ai droit à quoi pendant l'attente ?",
    canton: 'GE',
    expected_domaine: 'assurances',
    expected_any_article: ['LAI 28', 'LAI 70', 'LPGA 58'],
    notes: "Demande AI trop longue + menace licenciement — 'arrêt total depuis 17 mois' sans 'LAI 28 rente d'invalidité'. LAI 70 (prestations provisoires pendant instruction), LPGA 58 (devoir de célérité). Protection contre licenciement ≠ absolue mais délai de résiliation suspendu si incapacité. NOTE: JusticePourtous classe AI dans domaine 'assurances' (assurance_ai_opposition).",
  },

  // ========== WAVE 6 — bail/travail/dettes/famille/etrangers/hybride/sante/fiscal/accident (60→70) ==========

  // BAIL — travaux importants par le bailleur pendant occupation
  {
    id: 'adv_bail_10',
    query: "Mon propriétaire veut refaire complètement ma salle de bain et remplacer toutes les fenêtres. Il dit que les travaux vont durer 6 semaines et que je dois rester dans l'appartement pendant ce temps. Il propose 10% de réduction sur mon loyer pendant les travaux. C'est suffisant comme compensation, et est-ce qu'il peut vraiment m'imposer ça ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 260', 'CO 257h', 'CO 259d', 'CO 260a'],
    notes: "Travaux du bailleur (rénovation/amélioration) pendant occupation — CO 260 (locataire doit tolérer les travaux nécessaires), CO 257h (réduction de loyer proportionnelle pendant défaut). 'Refaire la salle de bain, changer les fenêtres' sans 'CO 260' ni 'indemnisation travaux'.",
  },

  // TRAVAIL — licenciement annoncé pendant grossesse
  {
    id: 'adv_travail_09',
    query: "Je suis enceinte de 4 mois et mon patron vient de m'appeler pour me dire que mon poste est supprimé dans 3 mois à cause d'une 'réorganisation'. Je travaille dans cette entreprise depuis 2 ans et demi. Est-ce qu'il peut vraiment me licencier maintenant que je suis enceinte ?",
    canton: 'VD',
    expected_domaine: 'travail',
    expected_any_article: ['CO 336c', 'CO 336', 'LEg 10'],
    notes: "Protection contre le licenciement pendant grossesse — CO 336c al. 1 let. c interdit le licenciement ordinaire pendant la grossesse et les 16 semaines post-partum. 'Poste supprimé' sans 'CO 336c' ni 'protection maternité'. Licenciement pendant ce délai = nul de plein droit.",
  },

  // DETTES — saisie de salaire, calcul du minimum vital LP 93
  {
    id: 'adv_dettes_08',
    query: "L'office des poursuites a envoyé un document à mon employeur pour bloquer une partie de mon salaire. Je gagne CHF 3'600 net, mon loyer coûte CHF 1'400, j'ai une femme et deux enfants à charge. Est-ce qu'ils peuvent saisir tout ce qui dépasse le loyer, ou bien il y a un montant minimum qu'on doit me laisser pour vivre ?",
    canton: 'BE',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 93', 'LP 92'],
    notes: "Saisie de salaire / calcul du minimum vital — LP 93 al. 1 (saisie limitée à l'excédent sur le minimum vital calculé en fonction des charges réelles). Charges de famille réduisent considérablement le saisissable. 'Bloquer une partie de mon salaire' sans 'LP 93' ni 'minimum vital'.",
  },

  // FAMILLE — pension alimentaire enfant majeur en formation professionnelle
  {
    id: 'adv_famille_06',
    query: "Ma fille a eu 20 ans en octobre et est en 2ème année d'apprentissage (elle finit dans 18 mois). Son père a arrêté de payer la contribution mensuelle en novembre en disant qu'elle est 'adulte maintenant'. Notre jugement de divorce prévoyait une contribution jusqu'à la fin de sa formation. Il a le droit de faire ça ?",
    canton: 'VS',
    expected_domaine: 'famille',
    expected_any_article: ['CC 277', 'CC 285'],
    notes: "Obligation d'entretien enfant majeur en formation — CC 277 al. 2 : l'obligation d'entretien persiste si l'enfant n'a pas encore terminé sa formation. 'Arrêté de payer parce qu'adulte' sans 'CC 277' ni 'pension enfant majeur'. Jugement de divorce avec clause explicite renforce la position.",
  },

  // ETRANGERS — regroupement familial conjoint étranger (époux/se de Suisse)
  {
    id: 'adv_etrangers_05',
    query: "Je suis suisse et je veux faire venir ma femme du Kosovo. On s'est mariés il y a 8 mois à Pristina. À la commune on m'a dit qu'il fallait prouver qu'on a 'les moyens de vivre sans l'aide sociale'. Quel est le revenu minimum requis, et est-ce que mon revenu seul est suffisant pour qu'on lui donne un visa ?",
    canton: 'ZH',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 42', 'LEI 44', 'OASA 73'],
    notes: "Regroupement familial conjoint étranger d'un Suisse — LEI 42 al. 1 (droit de séjour du conjoint d'un Suisse). Condition : ne pas dépendre de l'aide sociale (OASA 73). 'Faire venir ma femme du Kosovo' sans 'LEI 42' ni 'regroupement familial'. Délai de dépôt de la demande dans les 3 mois suivant l'entrée.",
  },

  // HYBRIDE (BAIL + FAMILLE) — séparation concubins, logement au nom d'un seul
  {
    id: 'adv_hybride_04',
    query: "Mon compagnon et moi on se sépare après 4 ans ensemble, on n'est pas mariés. Le bail est uniquement à son nom mais j'habite là depuis le premier jour. Il veut partir à l'étranger et me 'céder' l'appartement. La régie dit que comme mon nom n'est pas sur le contrat, je dois aussi quitter les lieux. Est-ce que c'est vraiment le seul issue ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 263', 'CO 273c', 'CO 262'],
    notes: "Transfert de bail / logement concubins non-mariés — CO 263 : le locataire peut transférer son bail à un tiers avec accord écrit du bailleur. Contrairement aux époux (CO 121/273c automatique), les concubins n'ont pas de droit légal au transfert. 'Me céder l'appartement' sans 'CO 263' ni 'accord du bailleur'. Cas cross-domaine bail+famille/couple.",
  },

  // SANTE — responsabilité médicale, opération d'urgence sans consentement explicite
  {
    id: 'adv_sante_02',
    query: "J'ai été opéré d'urgence pendant que j'étais inconscient après un accident de vélo. Personne n'a contacté ma famille. L'opération a laissé des séquelles permanentes à la jambe. Le chirurgien dit qu'il avait le droit d'opérer sans ma signature parce que c'était une 'urgence vitale'. C'est vrai, et est-ce que j'ai un recours pour les séquelles ?",
    canton: 'GE',
    expected_domaine: 'sante',
    expected_any_article: ['CC 28', 'LS 3', 'CO 41'],
    notes: "Consentement médical en urgence / responsabilité civile médicale — droit à l'autodétermination (CC 28), intervention sans consentement justifiée en urgence vitale uniquement. Séquelles permanentes → responsabilité civile (CO 41) si erreur médicale ou dépassement de l'urgence. 'Séquelles permanentes à la jambe' sans 'responsabilité médicale' ni 'CC 28'.",
  },

  // FISCAL — taxation d'office contestation, délai réclamation
  {
    id: 'adv_fiscal_01',
    query: "J'ai reçu une 'taxation d'office' pour mes impôts 2024 d'un montant 3 fois supérieur à ce que j'aurais dû payer. Pourtant j'avais envoyé ma déclaration en mars avec un accusé réception par recommandé. L'administration dit qu'elle ne l'a pas reçue. J'ai quel recours et surtout dans quel délai avant que ce montant soit définitif ?",
    canton: 'VD',
    expected_domaine: 'fiscal',
    expected_any_article: ['LIFD 130', 'LIFD 132', 'LIFD 133'],
    notes: "Taxation d'office + réclamation — LIFD 132 al. 1 : délai de réclamation de 30 jours (péremptoire) depuis notification. Preuve d'envoi de la déclaration (recommandé) peut invalider la taxation d'office. 'Montant 3 fois trop élevé' sans 'LIFD 132' ni 'réclamation fiscale délai 30 jours'.",
  },

  // ACCIDENT — LAA, accident non-professionnel hors horaires de travail
  {
    id: 'adv_accident_03',
    query: "Je me suis déchiré le ligament croisé du genou en jouant au foot un samedi. Mon assurance accident LAA refuse de payer parce que c'était 'hors des heures de travail et pas lié au travail'. Pourtant je travaille à 60% chez mon employeur. Est-ce que la LAA couvre vraiment les accidents de sport le week-end et sinon qui paie ?",
    canton: 'FR',
    expected_domaine: 'assurances',
    expected_any_article: ['LAA 7', 'LAA 6', 'LAA 8'],
    notes: "AANP (accident non-professionnel) — LAA 7 al. 1 : couverture AANP si taux d'occupation ≥ 8h/sem. 60% ≈ 24h/sem → AANP obligatoirement couverte. Refus de la LAA probablement erroné. 'Déchiré le ligament en jouant au foot' sans 'AANP' ni 'LAA 7'. Si refus confirmé, recours via opposition puis tribunal cantonal des assurances.",
  },

  // TRAVAIL — clause de non-concurrence géographiquement et temporellement excessive
  {
    id: 'adv_travail_10',
    query: "J'ai signé un contrat de travail qui m'interdit de travailler dans 'tout secteur technologique en Suisse' pendant 5 ans si je quitte l'entreprise. Mon patron menace de me poursuivre si je rejoins une autre boîte IT. Cette clause est-elle vraiment valable dans sa totalité ou est-ce que je peux quand même chercher un autre emploi dans mon domaine ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 340', 'CO 340a', 'CO 340b'],
    notes: "Clause de non-concurrence excessive — CO 340a al. 1 : la clause doit être limitée raisonnablement (lieu, temps, activité). 5 ans + Suisse entière + tout le secteur IT = vraisemblablement excessive. CO 340b : le juge peut réduire la portée. 'Tout secteur technologique en Suisse pendant 5 ans' sans 'CO 340' ni 'non-concurrence'.",
  },

  // ========== WAVE 7 — sous-cas peu testés, délais péremptoires, procédures peu connues ==========

  // BAIL — congé pour besoin propre abusif, délai de contestation 30 jours
  {
    id: 'adv_bail_11',
    query: "Mon propriétaire m'a envoyé un courrier recommandé pour résilier mon bail pour 'besoins propres' — il veut récupérer l'appart pour sa fille. Mais je sais que sa fille vit déjà dans un grand appartement de luxe à côté. Comment je conteste ça et dans quel délai avant qu'il soit trop tard ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 271', 'CO 271a', 'CO 273', 'CO 272'],
    notes: "Congé pour besoin propre (CO 261) + abus de droit (CO 271) + délai de contestation 30 jours dès réception (CO 273 al. 1). 'Besoins propres' + 'sa fille vit déjà dans un grand appartement' sans 'CO 271' ni 'contestation congé délai 30 jours'. Le délai de 30 jours est péremptoire.",
  },

  // TRAVAIL — heures supplémentaires impayées, prescription 5 ans
  {
    id: 'adv_travail_11',
    query: "Je travaille dans une PME depuis 4 ans. Mon contrat dit '42h/sem' mais je fais en réalité 50-55h toutes les semaines depuis le début. Mon patron dit que les heures sup sont 'comprises dans le salaire'. J'ai gardé mes fiches de salaire et mes agendas. J'ai encore combien de temps pour réclamer et comment je fais valoir mes droits ?",
    canton: 'BE',
    expected_domaine: 'travail',
    expected_any_article: ['CO 321c', 'CO 128', 'CO 335b'],
    notes: "Heures supplémentaires non rémunérées + clause 'incluses dans le salaire' potentiellement nulle si disproportionnée (CO 321c al. 1). Prescription des créances salariales 5 ans (CO 128 ch. 3). 'J\'ai gardé mes agendas' sans 'CO 321c' ni 'heures supplémentaires prescription'.",
  },

  // DETTES — séquestre avant jugement, créancier pressé
  {
    id: 'adv_dettes_09',
    query: "Un client me doit 35 000 francs pour des travaux. Il vient de mettre sa voiture et ses meubles au nom de sa femme et dit qu'il n'a plus rien. J'ai peur qu'il cache ses biens avant que je puisse le poursuivre légalement. Est-ce qu'il existe un moyen d'urgence pour bloquer ses avoirs avant même d'avoir un jugement ?",
    canton: 'VD',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 271', 'LP 272', 'LP 278', 'LP 281'],
    notes: "Séquestre avant jugement (LP 271 lit. a : créance non garantie + motif de séquestre probable). 'Bloquer ses avoirs avant un jugement' + 'mise au nom de sa femme' sans 'LP 271' ni 'séquestre'. Procédure d'urgence méconnue.",
  },

  // ETRANGERS — regroupement familial enfants mineurs, délai péremptoire LEI 47
  {
    id: 'adv_etrangers_06',
    query: "Mon mari a le permis B depuis 6 ans en Suisse. Nous sommes du Kosovo. Nos deux enfants de 12 et 15 ans sont restés avec leurs grands-parents au pays. On veut les faire venir vivre avec nous ici. L'office des migrations nous parle d'un 'délai pour le regroupement familial'. Quel est ce délai et est-ce qu'il y a un risque que ce soit trop tard ?",
    canton: 'ZH',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 44', 'LEI 47', 'LEI 43', 'LEI 42'],
    notes: "Regroupement familial enfants mineurs + délai LEI 47 : demande dans les 5 ans pour enfants jusqu'à 12 ans révolus (délai péremptoire !) + cas particulier enfants 12-18 ans (LEI 47 al. 4 : délai 12 mois). Enfant de 15 ans = risque de délai dépassé. 'Faire venir nos enfants' + 'délai pour le regroupement' sans 'LEI 47'.",
  },

  // FAMILLE — pension alimentaire impayée, saisie sur salaire LP 93
  {
    id: 'adv_famille_07',
    query: "Divorcée depuis 2 ans, j'ai la garde de mes 2 enfants. Mon ex-mari devait payer 1 200 francs par mois selon le jugement de divorce. Depuis 4 mois il ne paye plus rien, il dit qu'il a des problèmes financiers. Comment je peux le forcer à payer et est-ce qu'on peut saisir directement son salaire ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 285', 'CC 276', 'LP 93', 'LP 67'],
    notes: "Pension alimentaire impayée + voies d'exécution forcée. CC 285 (contribution d'entretien) + LP 93 (saisie sur salaire sans jugement supplémentaire si jugement divorce = titre). 'Il ne paye plus rien' + 'saisir son salaire' sans 'LP 93' ni 'contributions d'entretien exécution'.",
  },

  // ASSURANCES — changement de caisse maladie, délai réception LAMal 7
  {
    id: 'adv_assurances_03',
    query: "Je veux changer de caisse maladie pour économiser sur la prime à partir de janvier prochain. J'ai envoyé ma résiliation fin septembre. Mon assureur répond que ma lettre est arrivée le 1er octobre et que j'ai manqué le délai de 3 mois. Ils refusent le transfert. Est-ce qu'ils ont raison ou est-ce que je peux quand même changer ?",
    canton: 'NE',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 7', 'LAMal 64a'],
    notes: "Résiliation assurance maladie de base (LAMal 7) — délai : assureur doit RECEVOIR la résiliation avant le 30 novembre. 'Envoyé fin septembre' + 'arrivée 1er octobre' = dans le délai. 'Je veux changer de caisse' sans 'LAMal 7' ni 'résiliation délai novembre'. L'assureur a probablement tort.",
  },

  // CONSOMMATION — livraison défectueuse, responsabilité vendeur CO 197
  {
    id: 'adv_consommation_04',
    query: "J'ai commandé un vélo électrique à 3 200 francs sur un site suisse. À la livraison, le cadre était fissuré et la batterie ne charge pas. La boutique en ligne répond que c'est 'causé par le transport' et que c'est à moi de réclamer au transporteur. Mes droits contre la boutique directement ? Et est-ce que la garantie légale couvre ça ?",
    canton: 'AG',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 197', 'CO 205', 'CO 208'],
    notes: "Garantie des défauts achat à distance (CO 197 ss). CO 205 al. 1 : résolution ou réduction du prix. Délai d'avis 7 jours pour vices apparents (CO 201). 'Cadre fissuré dès la livraison' + 'boutique rejette sur le transporteur' sans 'CO 197' ni 'garantie légale'. Vendeur = responsable envers acheteur même pour dommage transport.",
  },

  // SANTE — refus soins urgents hôpital, libre choix LAMal 41 al. 3
  {
    id: 'adv_sante_03',
    query: "Je me suis tordu la cheville en tombant dans un escalier un dimanche soir. Je suis allé aux urgences de l'hôpital cantonal le plus proche. Ils m'ont demandé mon attestation d'assurance et ont dit que mon assureur ne figure pas dans leur liste de 'partenaires'. Ils m'ont conseillé d'aller dans une autre ville à 30 km. Peuvent-ils vraiment refuser de soigner une urgence ?",
    canton: 'SG',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 41', 'LAMal 36', 'OAMal 29'],
    notes: "Refus de soins urgents + libre choix du médecin/hôpital (LAMal 41 al. 3 : en urgence, l'assuré peut se faire soigner par tout fournisseur). L'hôpital cantonal ne peut pas refuser les urgences pour motif d'assureur. 'Mon assureur pas dans leur liste' sans 'LAMal 41' ni 'urgence libre choix'.",
  },

  // VOISINAGE — bruit nocturne chronique, double recours locataire (CC 684 + CO 259a)
  {
    id: 'adv_voisinage_04',
    query: "Mon voisin du dessus rentre tous les soirs après minuit et marche si fort que j'entends chaque pas. J'ai des tapotements de meubles jusqu'à 2h du matin. Cela dure depuis 18 mois, j'ai tout essayé à l'amiable, la régie ne répond plus. Quels recours légaux me restent-il ? Et ça change quelque chose que je sois locataire ?",
    canton: 'ZH',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 684', 'CC 679', 'CC 679a'],
    notes: "Troubles de voisinage excessifs (CC 684 al. 2 : immissions immatérielles). CC 679 : action en cessation + réparation. 'Marche si fort jusqu'à 2h du matin' sans 'CC 684' ni 'immissions'. Si locataire : double recours (CC 684 contre voisin + CO 259a contre bailleur pour défaut). Régie inactive = obligation du bailleur non remplie.",
  },

  // ENTREPRISE — fermeture raison individuelle, responsabilité illimitée CO 945
  {
    id: 'adv_entreprise_03',
    query: "J'ai une petite boutique inscrite au registre du commerce comme raison individuelle depuis 5 ans. Je veux tout fermer. J'ai encore 15 000 francs de dettes fournisseurs et un loyer commercial en cours. Comment je fais pour radier l'inscription officielle et est-ce que je reste personnellement responsable des dettes après la fermeture ?",
    canton: 'VD',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 945', 'CO 552', 'LP 39'],
    notes: "Radiation raison individuelle au RC (ORC 155 ss) + responsabilité illimitée du titulaire (CO 945 : l'entrepreneur répond sur tout son patrimoine privé). 'Fermer ma boutique inscrite au RC' + 'rester personnellement responsable des dettes' sans 'CO 945' ni 'responsabilité illimitée'. Les dettes subsistent après radiation.",
  },

  // ─── WAVE 8 — 2026-06-09 ───────────────────────────────────────────────────

  // FISCAL — revenus locatifs non déclarés, rappel d'impôt, prescription
  {
    id: 'adv_fiscal_02',
    query: "Je loue une chambre chez moi depuis 4 ans et je n'ai jamais déclaré ces revenus locatifs. L'administration fiscale cantonale vient de me contacter et parle de 'rappel d'impôt sur 10 ans'. Est-ce qu'ils peuvent vraiment remonter aussi loin ? Et est-ce que j'ai une amende en plus ?",
    canton: 'GE',
    expected_domaine: 'fiscal',
    expected_any_article: ['LIFD 151', 'LIFD 152', 'LIFD 175', 'LHID 53'],
    notes: "Rappel d'impôt (LIFD 151/152 : 10 ans pour soustraction non intentionnelle, 15 ans si fraude intentionnelle) + amende pour soustraction d'impôt (LIFD 175 = 1× impôt soustrait en général). 'Louer une chambre sans déclarer' + 'rappel 10 ans' sans 'LIFD 151' ni 'soustraction fiscale'. Fiscal blind spot confirmé run précédent : domaines=[] sur adv_fiscal_01.",
  },

  // CIRCULATION — excès vitesse modéré autoroute, 1ère infraction, retrait ou non ?
  {
    id: 'adv_circulation_03',
    query: "J'ai été contrôlé à 140 km/h sur l'autoroute où la limite était 120 km/h. C'est la première fois que j'ai une infraction de ce genre. L'officier a dit que ce serait traité 'administrativement' pas seulement comme une amende. Est-ce que je risque de perdre mon permis ? Pour combien de temps ?",
    canton: 'BE',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 16', 'LCR 16b', 'LCR 90'],
    notes: "Excès de 20 km/h en zone 120 = infraction moyennement grave (LCR 16b). Première infraction → retrait 1 mois minimum. 'Contrôlé à 140 en zone 120' + 'traitement administratif' sans 'LCR 16b' ni 'retrait permis'. L'adjectif 'administrativement' (employé par l'officier) est le signal adversarial — le citoyen ne connaît pas LCR 16b.",
  },

  // VIOLENCE — harcèlement moral au travail longue durée, dépôt plainte pénale
  {
    id: 'adv_violence_04',
    query: "Mon chef me fait des remarques humiliantes devant les collègues depuis 2 ans, m'exclut systématiquement des réunions importantes et a changé mes horaires sans motif juste pour me nuire. J'ai tout noté dans un journal. Les RH ne font rien. Est-ce que je peux porter plainte pénalement contre lui, ou c'est uniquement du droit du travail ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 328', 'CP 181', 'CP 174', 'LPTr 6'],
    notes: "Harcèlement moral systématique (mobbing) — JPT classe ce cas en domaine 'travail' (CO 328 protection personnalité du travailleur). La voie pénale (CP 181 contrainte, CP 174 diffamation) est secondaire. Ground-truth corrigée : 'violence' → 'travail' car le navigator route correctement vers travail_harcelement. 'Remarques humiliantes + exclusion + changement horaires' sans 'CP 181' ni 'harcèlement moral' ni 'mobbing'. La question 'plainte pénale vs droit du travail' est le signal adversarial.",
  },

  // BAIL — commandement de payer reçu pour loyers impayés, délai 30 jours avant résiliation
  {
    id: 'adv_bail_12',
    query: "J'ai reçu ce matin un document de l'office des poursuites qui dit que mon bailleur me réclame 2 mois de loyer impayés et que je dois payer dans les 30 jours sinon il peut résilier le bail. J'ai l'argent maintenant mais j'ai eu des problèmes de santé. Si je paie dans les 30 jours, est-ce que mon appartement est sauvegardé ? Et après, est-ce qu'il peut quand même me donner congé ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 257d', 'CO 271', 'CO 273'],
    notes: "Mise en demeure locataire (CO 257d) : délai 30 jours pour payer, puis résiliation extraordinaire possible. Si paiement dans le délai → résiliation n'est pas possible pour ce motif. Mais bailleur peut encore résilier ordinairement (CO 271). 'Document de l'office des poursuites' + '30 jours' + 'appartement sauvegardé' sans 'CO 257d' ni 'mise en demeure'. La question sur la résiliation ultérieure est le signal adversarial.",
  },

  // TRAVAIL — refus vacances été par employeur, droits du salarié CO 329c
  {
    id: 'adv_travail_12',
    query: "J'ai demandé 3 semaines de vacances en juillet et août il y a 2 mois. Mon employeur vient de refuser sans explication, en disant que c'est trop chargé cet été. J'ai déjà reservé mon billet d'avion. Est-ce qu'il a le droit de refuser ? Et si je pars quand même, qu'est-ce qui se passe ?",
    canton: 'AG',
    expected_domaine: 'travail',
    expected_any_article: ['CO 329', 'CO 329a', 'CO 329c'],
    notes: "Droit aux vacances (CO 329) et fixation (CO 329c al. 3 : l'employeur tient compte des désirs du travailleur, mais peut refuser pour raisons d'exploitation). Départ malgré refus = abandon de poste. 'Billet réservé' + 'employeur refuse sans explication' + '2 mois à l'avance' sans 'CO 329c' ni 'fixation des vacances'. Signal adversarial = 'j'ai reservé mon billet' comme fait accompli.",
  },

  // DETTES — reconnaissance de dette signée, débiteur conteste, délai prescription
  {
    id: 'adv_dettes_10',
    query: "J'ai prêté 8 000 francs à un ami en 2018. Il m'a signé un papier à la main qui dit qu'il me devra rembourser d'ici fin 2019. Il n'a jamais payé. Il dit maintenant que c'était un 'cadeau' et que le papier ne vaut rien. Est-ce que ce document peut m'aider ? Et est-ce que c'est trop tard pour aller au tribunal ?",
    canton: 'FR',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 17', 'CO 127', 'LP 82', 'CO 312'],
    notes: "Reconnaissance de dette + prêt entre particuliers. CO 17 : reconnaissance de dette écrite suffit (pas besoin de témoin). LP 82 : mainlevée provisoire possible sur titre. Prescription : CO 127 = 10 ans pour créances civiles ordinaires (pas prescrits en 2026). 'Papier signé à la main' + 'ami dit que c'était un cadeau' sans 'CO 17' ni 'reconnaissance de dette' ni 'mainlevée'.",
  },

  // FAMILLE — droit de visite refusé systématiquement, voies d'exécution
  {
    id: 'adv_famille_08',
    query: "Mon ex-femme refuse d'amener les enfants depuis 3 mois lors de mes droits de visite fixés par le juge. J'appelle la police mais ils disent que c'est 'une affaire civile'. J'ai un jugement officiel qui dit que j'ai les enfants tous les mercredis et un week-end sur deux. Comment je peux faire appliquer ce jugement ?",
    canton: 'NE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 273', 'CC 274', 'CC 308', 'CPC 343'],
    notes: "Exécution forcée droit de visite. CC 273 : droit aux relations personnelles garanti. CPC 343 : exécution des décisions — le tribunal peut prononcer une amende d'ordre ou demander l'intervention des autorités. 'Jugement officiel + police dit affaire civile' sans 'CPC 343' ni 'exécution forcée jugement'. Signal adversarial = police inactive → citoyen croit être sans recours.",
  },

  // ASSURANCES — LAA : accident travail, assureur invoque condition préexistante
  {
    id: 'adv_assurances_04',
    query: "Je me suis blessé le genou en tombant sur un chantier. L'assurance accident de mon employeur a pris en charge au début, puis après 6 mois elle dit que mon problème de genou existait avant l'accident et réduit mes indemnités de 50%. J'avais un léger problème de cartilage mais l'accident a tout aggravé. Ils ont le droit ?",
    canton: 'BS',
    expected_domaine: 'assurances',
    expected_any_article: ['LAA 36', 'LAA 6', 'LAA 105', 'OLAA 49'],
    notes: "Concausalité LAA (LAA 36 : réduction si cause étrangère, MAIS uniquement si lésion préexistante 'significative'). L'assureur peut réduire les prestations seulement si la cause étrangère est significative (pas si l'accident est la cause prépondérante d'une aggravation). LAA 105 : droit de recours contre la décision d'assurance. 'Accident aggrave une lésion préexistante mineure' + 'assureur réduit 50%' sans 'LAA 36' ni 'concausalité'.",
  },

  // ENTREPRISE — abus de confiance entre associés SARL, double voie pénale + civile
  {
    id: 'adv_entreprise_04',
    query: "Je suis co-fondateur d'une SARL avec un associé. J'ai découvert que pendant 2 ans, mon associé se versait des avances sur frais fictives — environ 40 000 francs au total. Il a accès à la comptabilité. Comment est-ce que je peux récupérer cet argent et est-ce que c'est aussi pénal ?",
    canton: 'ZG',
    expected_domaine: 'entreprise',
    expected_any_article: ['CP 138', 'CO 803', 'CO 827', 'CO 812'],
    notes: "Abus de confiance (CP 138) + responsabilité du gérant/associé SARL (CO 827 renvoi CC → CO 717 = diligence du mandataire). Action civile en remboursement (CO 803 : obligations des associés). 'Avances fictives 40k sur 2 ans' sans 'CP 138' ni 'abus de confiance' ni 'gérant SARL'. Signal adversarial = vocabulaire 'avances sur frais' au lieu d'abus de confiance.",
  },

  // HYBRIDE — séparation couple marié, seul un conjoint sur le bail, attribution logement familial
  {
    id: 'adv_hybride_05',
    query: "On est mariés et on vit dans un appartement loué uniquement à mon nom. On est en train de se séparer et mon mari veut partir mais je ne veux pas rester seule avec le loyer. De l'autre côté mon mari dit qu'il veut l'appartement lui. Qui décide et est-ce qu'il peut prendre l'appartement alors qu'il n'est pas sur le contrat ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 121', 'CO 263', 'CC 176'],
    notes: "Attribution du logement familial (CC 121 : le juge peut attribuer l'usage du logement familial à l'un des époux, même si le bail est au nom de l'autre). CC 176 : mesures protectrices de l'union conjugale. Cession du bail possible (CO 263). 'Bail uniquement à mon nom + mari veut l'appartement' sans 'CC 121' ni 'attribution logement' ni 'mesures protectrices'. Cross-domain famille+bail : l'attribution dépend du juge famille, pas du droit du bail.",
  },

  // ─── WAVE 9 — 2026-06-10 ───────────────────────────────────────────────────

  // BAIL — clause no-smoking dans le bail, résiliation pour violation, tolérance de fait
  {
    id: 'adv_bail_13',
    query: "Mon contrat de bail interdit de fumer dans l'appartement et sur le balcon. J'ai toujours fumé sur mon balcon depuis 5 ans et le propriétaire n'a jamais rien dit. Maintenant un voisin s'est plaint et le propriétaire m'a envoyé une lettre de résiliation. Est-ce qu'une clause no-smoking est valable ? Et est-ce que le fait qu'il ait toléré pendant 5 ans change quelque chose ?",
    canton: 'ZH',
    expected_domaine: 'bail',
    expected_any_article: ['CO 257a', 'CO 257f', 'CO 271', 'CO 266'],
    notes: "Obligation d'égards du locataire (CO 257a) + résiliation pour violation (CO 257f al. 3 : résiliation après avertissement, avec délai 30 jours pour cas grave). La tolérance de fait pendant 5 ans peut qualifier la résiliation d'abusive (CO 271). Résiliation doit respecter la forme officielle (CO 266l). 'No-smoking toléré 5 ans + résiliation suite plainte voisin' sans 'CO 257f' ni 'résiliation abusive'. Signal adversarial = longue tolérance de fait avant résiliation soudaine.",
  },

  // TRAVAIL — surveillance par webcam et lecture d'emails professionnels
  {
    id: 'adv_travail_13',
    query: "Mon employeur a installé des caméras dans notre open-space sans nous en parler. J'ai aussi appris qu'il lit les emails professionnels de certains employés pour 'contrôler le rendement'. Notre RH dit que c'est son matériel donc ses droits. C'est vrai ? Quels sont mes droits ?",
    canton: null,
    expected_domaine: 'travail',
    expected_any_article: ['CO 328b', 'CO 328', 'LPD 26'],
    notes: "Surveillance des travailleurs : CO 328b (traitement données personnelles admis seulement pour apprécier aptitude ou exécution du contrat). LPD 26 : conditions de licéité. Caméras sans information préalable + lecture emails = atteinte à la personnalité (CO 328). 'Caméras sans prévenir + emails lus par patron' sans 'CO 328b' ni 'protection données au travail'. Signal adversarial = 'son matériel donc ses droits' (fausse croyance répandue).",
  },

  // FAMILLE — protection de l'adulte, curatelle pour parent âgé incapable de gérer ses affaires
  {
    id: 'adv_famille_09',
    query: "Mon père de 78 ans a un début de démence diagnostiqué. Il a fait des virements de 12 000 francs à des inconnus trouvés sur internet. Ma mère est décédée. Je voudrais avoir légalement le droit de gérer ses finances pour le protéger. Je dois faire quoi et auprès de qui ?",
    canton: 'VS',
    expected_domaine: 'famille',
    expected_any_article: ['CC 390', 'CC 394', 'CC 398', 'CC 449'],
    notes: "Curatelle de gestion (CC 390 : curatelle si personne ne peut gérer ses affaires du fait d'une maladie mentale). CC 394 : curatelle de représentation. CC 398 : curatelle de portée générale. CC 449 : mesures provisionnelles urgentes. Requête à l'Autorité de Protection de l'Adulte et de l'Enfant (APEA). 'Démence + virements à des inconnus' sans 'curatelle' ni 'APEA'. Signal adversarial = parent encore vivant (pas une succession) mais incapable.",
  },

  // DETTES — acte de défaut de biens après saisie infructueuse, nouvelle poursuite possible
  {
    id: 'adv_dettes_11',
    query: "J'avais des dettes en 2016. L'office des poursuites est venu, a constaté que je n'avais rien à saisir, et m'a remis un document officiel. On m'a dit que c'était 'terminé'. Mon créancier me contacte encore et menace de reprendre la procédure. Peut-il vraiment recommencer ? Est-ce que ça s'efface avec le temps ?",
    canton: 'BE',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 149', 'LP 149a', 'LP 265'],
    notes: "Acte de défaut de biens (ADB) : la dette ne s'éteint PAS avec l'ADB (LP 149). Le créancier peut reprendre la poursuite à tout moment dans les 20 ans (LP 149a al. 1). 'Huissier venu / rien à saisir / document officiel / on m'a dit terminé' sans 'LP 149' ni 'acte de défaut de biens'. Signal adversarial = croyance très répandue que l'ADB libère définitivement de la dette.",
  },

  // ETRANGERS — regroupement familial enfant adulte (> 18 ans), réfugié reconnu en Suisse
  {
    id: 'adv_etrangers_07',
    query: "Je suis réfugié reconnu en Suisse depuis 4 ans. J'ai un fils de 22 ans resté dans mon pays d'origine. Il vit seul là-bas, la situation est dangereuse. Est-ce que je peux faire venir mon fils en Suisse grâce au regroupement familial ?",
    canton: null,
    expected_domaine: 'etrangers',
    expected_any_article: ['LAsi 51', 'LEI 44', 'LEI 51'],
    notes: "Regroupement familial réfugié reconnu : LAsi 51 couvre conjoint + enfants mineurs AU MOMENT de la demande. Enfant majeur (22 ans) = hors regroupement automatique. Possible via LEI 44 al. 3 si dépendance prouvée. 'Réfugié reconnu + fils de 22 ans dans pays dangereux' sans 'LAsi 51' ni 'limite d'âge regroupement'. Signal adversarial = confusion entre statut réfugié et permis B étranger (règles différentes).",
  },

  // SOCIAL — aide sociale remboursement après retour à meilleure fortune
  {
    id: 'adv_social_04',
    query: "La commune m'a versé de l'aide sociale pendant 20 mois quand j'étais sans emploi. Maintenant j'ai retrouvé un emploi à bon salaire depuis 9 mois. La commune me demande de rembourser 16 000 francs. Est-ce qu'ils ont vraiment le droit de me demander ça ? C'est un prêt ou pas ?",
    canton: 'FR',
    expected_domaine: 'social',
    expected_any_article: ['Cst 12', 'LIAS 26', 'LIAS 27'],
    notes: "Remboursement aide sociale : la plupart des cantons prévoient une obligation de restitution si la situation économique s'améliore (droit cantonal). Base constitutionnelle = Cst 12 (droit à des conditions minimales). L'aide sociale n'est pas un don — c'est une avance remboursable selon les lois cantonales d'aide sociale. 'Commune demande remboursement + nouveau travail' sans 'obligation de restitution'. Signal adversarial = croyance que l'aide sociale est non remboursable.",
  },

  // VOISINAGE — fumée de barbecue quotidien, seuil d'excès CC 684, action en cessation
  {
    id: 'adv_voisinage_05',
    query: "Mon voisin fait des barbecues presque tous les soirs en été depuis 3 ans. La fumée envahit ma terrasse et entre dans ma maison par les fenêtres. Ma fille est asthmatique. Il refuse de changer ses habitudes en disant qu'il est chez lui. Je suis propriétaire. Sur quelle base légale puis-je agir ?",
    canton: 'AG',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 684', 'CC 679', 'CC 679a'],
    notes: "Immissions excessives de fumée/odeurs (CC 684 al. 2 : sont illicites les fumées et odeurs qui dépassent les limites de la tolérance du voisinage compte tenu de la situation locale). CC 679 : action en cessation + réparation du dommage. 'Barbecues quotidiens + asthmatique + 3 ans + voisin dit je suis chez moi' sans 'CC 684' ni 'immissions'. Signal adversarial = 'je suis chez moi' (CC 684 al. 2 limite précisément ce droit sur son propre fond).",
  },

  // SUCCESSIONS — testament olographe contesté, réserve des enfants, captation d'héritage
  {
    id: 'adv_successions_04',
    query: "Mon père est décédé. On a trouvé un testament écrit à la main signé où il laisse tout à sa nouvelle compagne avec qui il vivait depuis 2 ans. Ma sœur et moi sommes ses seuls enfants. Nous pensons qu'elle l'avait manipulé car il avait des troubles cognitifs les 6 derniers mois. Quels sont nos droits ?",
    canton: 'GE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 505', 'CC 519', 'CC 522', 'CC 470'],
    notes: "Testament olographe valide si manuscrit + daté + signé (CC 505). Mais : nullité si incapacité de discernement (CC 519 al. 1 ch. 1). Réserve des descendants = 1/2 de leur part légale (CC 470 al. 1, révision 2023). Action en réduction si atteinte aux réserves (CC 522). Délai action en nullité = 1 an depuis connaissance (CC 521). 'Testament manuscrit + compagne + troubles cognitifs' sans 'CC 505' ni 'captation' ni 'réserve héréditaire'. Signal adversarial = 'manipulation' au lieu de 'incapacité de discernement'.",
  },

  // ASSURANCES — invalidité AI, taux à la limite du droit (35% vs 40%), recours
  {
    id: 'adv_assurances_05',
    query: "J'ai eu un accident grave. Deux médecins indépendants estiment mon invalidité à 40–42%. L'AI suisse a calculé de son côté 35% d'invalidité et m'a dit que je n'ai droit à aucune rente (le minimum c'est 40%). Leur méthode de calcul me semble incorrecte. Que puis-je faire ?",
    canton: 'TI',
    expected_domaine: 'assurances',
    expected_any_article: ['LAI 28', 'LPGA 52', 'LPGA 56', 'LAI 69'],
    notes: "Seuil d'invalidité pour rente AI (LAI 28 al. 1 : rente entière si ≥ 70%, 3/4 si ≥ 60%, 1/2 si ≥ 50%, 1/4 si ≥ 40%). Opposition contre décision AI (LPGA 52 : 30 jours dès notification). Recours au tribunal cantonal des assurances (LPGA 56). Expertise médicale indépendante possible (LAI 69). '35% selon AI vs 40-42% selon médecins' sans 'LPGA 52' ni 'opposition'. Signal adversarial = 1 point de différence sur le seuil (35% vs 40%) et citoyen qui croit ne pas pouvoir contester.",
  },

  // CONSOMMATION — démarchage à domicile, droit de révocation 14 jours, signature sur place
  {
    id: 'adv_consommation_05',
    query: "Un commercial est venu hier chez moi sans rendez-vous. Il était très convaincant et j'ai signé un contrat pour des cours de sport à domicile sur 2 ans pour 3 600 francs. Ce matin je regrette complètement. Est-ce que je peux annuler ce contrat que j'ai signé sur le bon de commande ?",
    canton: 'VD',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 40a', 'CO 40b', 'CO 40e'],
    notes: "Droit de révocation contrat conclu hors établissement commercial (CO 40a al. 1 : 14 jours pour révoquer, sans motif). CO 40b : le commerçant doit informer du droit de révocation. CO 40e : révocation par écrit. 'Commercial à domicile + signé hier + je regrette' sans 'CO 40a' ni 'droit de révocation' ni 'démarchage à domicile'. Signal adversarial = 'j'ai signé le bon de commande' (croyance que la signature vaut engagement définitif).",
  },

  // DETTES — délai d'opposition raté (10 jours écoulés), que faire après ?
  {
    id: 'adv_dettes_12',
    query: "J'ai trouvé dans ma boîte aux lettres il y a 3 semaines une lettre officielle tamponnée de l'État avec un formulaire concernant une dette de 3 800 francs envers mon ancien propriétaire. Il était écrit qu'il fallait répondre dans les 10 jours mais j'étais en voyage professionnel. Ce délai est maintenant largement dépassé. Il y a maintenant une date d'audience mentionnée. Est-ce que tout est perdu ou y a-t-il encore quelque chose à faire ?",
    canton: 'VD',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 74', 'LP 63', 'LP 80'],
    notes: "Opposition tardive à commandement de payer — LP 74 (délai d'opposition 10 jours dès notification). LP 63 (continuation de la poursuite si pas d'opposition dans le délai). LP 80 (mainlevée définitive sur titre). Voies possibles après délai raté : vérifier la régularité de la notification (LP 72), restitution de délai si motif valable. 'Lettre officielle + 10 jours + dépassé + audience' sans 'commandement de payer' ni 'LP 74'. Signal adversarial = citoyen qui croit avoir 'tout perdu' alors que des voies procédurales subsistent selon les circonstances.",
  },

  // ÉTRANGERS — asile rejeté, admission provisoire (permis F) comme alternative
  {
    id: 'adv_etrangers_08',
    query: "J'ai reçu une décision négative sur ma demande de protection en Suisse. Mon avocat commis d'office m'a dit qu'il existait une alternative au retour forcé, une sorte de 'statut provisoire'. Le SEM maintient que je dois rentrer. Cette alternative existe-t-elle vraiment et comment peut-on en bénéficier après un refus ?",
    canton: null,
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 83', 'LEI 84', 'LEI 85'],
    notes: "Admission provisoire (permis F) — LEI 83 (= LAsi 83 dans la numérotation JPT) : octroyée si le renvoi est illicite, inexigible ou impossible. Distinct de l'asile reconnu. Possible même après refus d'asile. LEI 84 : durée et révision. JPT cite la fiche 'etranger_admission_provisoire_f' avec articles LEI 83/84/85 (LExI, anciennement LSEE). 'Décision négative + statut provisoire + SEM maintient' sans 'permis F' ni 'LEI 83'. Signal adversarial = confusion asile refusé = départ obligatoire (le permis F peut permettre le maintien sous conditions).",
  },

  // ACCIDENT — chute dans un commerce (responsabilité du propriétaire d'ouvrage)
  {
    id: 'adv_accident_04',
    query: "Je suis tombé dans l'allée d'un grand magasin à cause d'un carton qui dépassait d'une étagère et bloquait le passage. Je me suis cassé la clavicule. Arrêt de travail 6 semaines. Le chef de rayon m'a dit que je n'avais 'qu'à faire attention'. L'assurance du magasin répond 'en cours d'enquête' depuis 3 mois sans autre suite. Est-ce que le magasin peut être tenu responsable de mes frais médicaux et de ma perte de revenus ?",
    canton: 'ZH',
    expected_domaine: 'accident',
    expected_any_article: ['CO 58', 'CO 41', 'CO 46'],
    notes: "Responsabilité du détenteur d'ouvrage (CO 58) : établissement commercial = ouvrage, carton obstruant le passage = défaut d'entretien ou de surveillance. Responsabilité présumée sans que la faute doive être prouvée par la victime. CO 46 : réparation du dommage (frais médicaux + lucrum cessans). 'Je suis tombé dans un magasin + carton qui dépassait + chef de rayon dit ma faute' sans 'CO 58' ni 'défaut de l'ouvrage'. Signal adversarial = inversion de la charge de la preuve présentée comme normale par le commerçant.",
  },

  // TRAVAIL — harcèlement sexuel, représailles après refus, pas de preuve écrite
  {
    id: 'adv_travail_14',
    query: "Mon responsable direct me fait des commentaires sur mon physique et me touche l'épaule régulièrement malgré mes refus répétés depuis 2 mois. Depuis que j'ai évité les situations où on était seuls, mes évaluations ont chuté et on m'a retiré un dossier important. Je n'ai rien par écrit. Les RH connaissent très bien mon responsable. Que puis-je faire concrètement ?",
    canton: 'GE',
    expected_domaine: 'travail',
    expected_any_article: ['LEg 4', 'CO 328', 'CO 336c'],
    notes: "Harcèlement sexuel au travail (LEg 4 : constitue une atteinte grave à la personnalité, engagement de la responsabilité de l'employeur). CO 328 : obligation de l'employeur de protéger la personnalité de l'employé. CO 336c : protection contre la résiliation pendant une procédure pour atteinte à la personnalité. Preuve : journal de bord daté, témoins, signalement par écrit à l'employeur. 'Commentaires + touche l'épaule + évaluations baissées' sans 'LEg 4' ni 'harcèlement sexuel'. Signal adversarial = 'je n'ai rien par écrit' (croyance que sans écrit on ne peut pas agir).",
  },

  // FAMILLE — modification de la contribution d'entretien au conjoint après divorce (CC 129)
  {
    id: 'adv_famille_10',
    query: "Mon jugement de divorce de 2021 m'oblige à verser 650 francs par mois à mon ex-épouse pendant 5 ans. Elle a retrouvé un emploi à temps plein depuis 9 mois à un bon salaire. Les 5 ans ne sont pas encore écoulés. Est-ce que je peux demander à diminuer ou supprimer cette pension maintenant, avant le terme prévu par le jugement, et si oui, comment ?",
    canton: 'BE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 129', 'CC 125', 'CPC 268'],
    notes: "Modification de la contribution d'entretien après divorce (CC 129 al. 1 : modification si les circonstances changent notablement depuis le jugement). Nouvel emploi à temps plein de l'ex-épouse = changement notable de circonstances. Procédure : demande de modification au tribunal compétent (CPC 268). CC 125 : bases légales de la rente de soutien. 'Jugement de divorce + ex a retrouvé emploi + veux réduire avant le terme' sans 'CC 129' ni 'modification de rente'. Signal adversarial = croyance que le jugement est immuable pendant la durée prévue.",
  },

  // CIRCULATION — retrait préventif du permis pour raisons médicales (épilepsie)
  {
    id: 'adv_circulation_04',
    query: "Suite à une première crise d'épilepsie il y a 18 mois, mon médecin en a informé les autorités et l'office de la circulation m'a retiré le permis de façon préventive. Je n'ai eu aucune autre crise depuis. Mon neurologue dit par écrit que je suis apte à reprendre le volant. L'office dit d'attendre encore 6 mois sans explication précise. Quels sont mes droits et comment demander officiellement la restitution ?",
    canton: 'FR',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 14', 'LCR 16', 'OAC 27'],
    notes: "Retrait du permis pour inaptitude médicale (LCR 14 : conditions physiques et psychiques requises pour conduire). Restitution : expertise médicale spécialisée + décision de l'office de la circulation (OAC 27 et ss. : contrôle périodique des conducteurs). Délai sans crise exigé selon les directives médicales de l'OFROU. Recours contre refus possible (voie administrative + recours cantonal). 'Épilepsie une fois + neurologue dit OK + office dit attendre' sans 'LCR 14' ni 'aptitude médicale'. Signal adversarial = l'office ne motive pas son refus et le citoyen ignore que l'avis du médecin spécialiste est contraignant pour l'administration.",
  },

  // SANTÉ — accès au dossier médical refusé par le médecin traitant
  {
    id: 'adv_sante_04',
    query: "Mon médecin de famille me suit depuis 8 ans. J'ai besoin de mon dossier médical complet pour une expertise AI et pour un deuxième avis médical à l'étranger. Il refuse de me le transmettre en disant que ces notes sont 'à usage professionnel interne' et lui appartiennent. Est-ce qu'il peut légalement refuser de me donner accès à mes propres informations médicales ?",
    canton: 'VD',
    expected_domaine: 'sante',
    expected_any_article: ['LPD 8', 'CC 28', 'LS 3'],
    notes: "Droit d'accès au dossier médical — LPD 8 (droit d'accès aux données personnelles : le patient peut demander les données le concernant). Les données médicales appartiennent au patient même si le support appartient au médecin. CC 28 (atteinte à la personnalité en cas de refus injustifié). LS cantonale VD art. 3 (droit du patient à l'information). 'Médecin refuse + dit propriété interne' sans 'LPD 8' ni 'droit d'accès aux données'. Signal adversarial = confusion entre le support matériel (propriété du médecin) et les données personnelles (droits du patient).",
  },

  // VOISINAGE — copropriété PPE, travaux bruyants les week-ends, administrateur passif
  {
    id: 'adv_voisinage_06',
    query: "Je suis propriétaire d'un appartement en copropriété à Lausanne. Mon voisin du dessus fait des travaux de rénovation depuis 7 semaines avec perceuses et marteaux chaque samedi et dimanche dès 7h30. J'ai signalé la situation à l'administrateur de notre communauté de copropriétaires qui m'a répondu qu'il 'ne peut pas s'immiscer dans les affaires des copropriétaires'. Ai-je un recours concret ?",
    canton: 'VD',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 684', 'CC 712m', 'CC 679'],
    notes: "Double fondement : CC 684 (immissions excessives entre propriétaires voisins) + règlement de copropriété PPE (heures de tranquillité obligatoires). CC 712m al. 2 : l'administrateur a l'obligation d'exécuter les décisions de l'assemblée et d'appliquer le règlement. Son refus d'intervenir est lui-même contestable. CC 679 : action en cessation + réparation. 'PPE + travaux dimanche 7h30 + administrateur dit ne peut rien faire' sans 'CC 684' ni 'règlement PPE'. Signal adversarial = administrateur qui se défausse de son rôle exécutif obligatoire.",
  },

  // SOCIAL — travailleur pauvre (working poor), droits aux subsides et aides, peur de la stigmatisation
  {
    id: 'adv_social_05',
    query: "Je travaille à 50% comme caissière depuis 2 ans. Mon salaire est de 2 200 francs. Après le loyer, les primes d'assurance maladie et les charges fixes, il me reste moins de 200 francs par mois. On m'a dit de 'demander l'aide sociale' mais j'ai peur d'être fichée ou de perdre des droits. Existe-t-il d'autres aides auxquelles j'aurais droit sans passer par l'aide sociale classique ?",
    canton: 'GE',
    expected_domaine: 'assurances',
    expected_any_article: ['LAMal 65', 'LPC 4', 'LPC 9'],
    notes: "Travailleur pauvre (working poor) — subsides LAMal 65 (réduction individuelle de la prime selon revenus, accordée directement par le canton). Prestations complémentaires cantonales (Genève : Hospice général, LIAS). Aide sociale ≠ inscription permanente ou perte de droits — c'est un droit constitutionnel (Cst 12). 'Salaire insuffisant + peur aide sociale + existe d'autres aides ?' sans 'LAMal 65 subsides' ni 'aide sociale = droit'. Signal adversarial = croyance que demander de l'aide sociale crée un 'fichage' durable, alors que des subsides LAMal sont accessibles sans stigma.",
  },

  // HYBRIDE — travailleur frontalier (France/CH) licencié, quel droit applicable, indemnité ?
  {
    id: 'adv_hybride_06',
    query: "J'habite en France voisine et je travaille depuis 4 ans dans une PME genevoise avec un contrat signé en Suisse. Mon employeur m'annonce un licenciement pour restructuration. En droit français j'aurais eu une indemnité légale de licenciement. Est-ce que le droit suisse prévoit quelque chose de similaire ? Et mon préavis pour 4 ans d'ancienneté, c'est combien de mois selon la loi suisse ?",
    canton: 'GE',
    expected_domaine: 'travail',
    expected_any_article: ['CO 335b', 'CO 336', 'CO 336a'],
    notes: "Travailleur frontalier — lieu de travail habituel = Genève (Suisse) → droit suisse applicable (LDIP 121 al. 1 : loi du lieu de travail habituel). En droit suisse : AUCUNE indemnité légale de licenciement économique (contrairement au droit français). Préavis CO 335b : 1 mois la 1ère année, 2 mois de 2 à 9 ans, 3 mois à partir de 10 ans → 4 ans = 2 mois. Recours si résiliation abusive : CO 336a (indemnité jusqu'à 6 mois de salaire). 'Je vis en France + entreprise suisse + indemnité de licenciement' sans 'CO 335b' ni 'droit suisse applicable'. Signal adversarial = confusion droit du travail suisse vs français (risque critique : attendre une indemnité inexistante en droit suisse).",
  },

  // ─── WAVE 11 — 2026-06-14 ──────────────────────────────────────────────────

  // BAIL — sous-location / Airbnb sans accord du bailleur
  {
    id: 'adv_bail_14',
    query: "Je pars travailler 2 mois à l'étranger. Je voudrais louer ma chambre libre via une plateforme de vacances pendant mon absence pour payer mon loyer. Mon bail ne parle pas d'Airbnb ou de sous-location. Est-ce que j'ai le droit de le faire sans en parler à la gérance ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 262', 'CO 257f'],
    notes: "Sous-location — CO 262 al. 1 : le locataire peut sous-louer avec le consentement écrit du bailleur. Le silence du bail sur ce point ne vaut pas autorisation. Le bailleur peut refuser si les conditions de sous-location sont abusives ou si la sous-location cause un inconvénient majeur. CO 257f : résiliation si violation. 'Ma chambre libre pendant mon absence + Airbnb + bail ne l'interdit pas' sans 'CO 262' ni 'sous-location'. Signal adversarial = croyance que l'absence d'interdiction explicite vaut autorisation.",
  },

  // TRAVAIL — réduction unilatérale de salaire annoncée par email
  {
    id: 'adv_travail_15',
    query: "Mon patron m'a envoyé un email lundi pour me dire qu'à partir du mois prochain mon salaire mensuel passe de 5 400 à 4 600 francs 'en raison des difficultés économiques de la société'. Je n'ai signé aucun avenant. Est-ce qu'il peut décider ça tout seul ? Et que se passe-t-il si je refuse ?",
    canton: 'AG',
    expected_domaine: 'travail',
    expected_any_article: ['CO 319', 'CO 320', 'CO 335'],
    notes: "Modification unilatérale du contrat — en droit suisse, l'employeur ne peut pas réduire le salaire sans accord du travailleur. La solution légale = résiliation du contrat de travail (CO 335) assortie d'une offre de nouvel engagement aux nouvelles conditions (résiliation-modification). CO 319 al. 2 : les conventions contraires à ce qui est convenu ne s'imposent pas sans accord. CO 320 : présomption de contrat si le travailleur continue. 'Mon patron m'annonce une réduction de salaire par email + je n'ai rien signé' sans 'CO 319' ni 'résiliation-modification'. Signal adversarial = croyance que l'employeur peut imposer une modification unilatérale.",
  },

  // DETTES — cession de créance à une société de recouvrement inconnue
  {
    id: 'adv_dettes_13',
    query: "J'ai reçu hier une lettre d'une société de recouvrement que je ne connais pas du tout, qui réclame 5 200 francs qu'ils disent avoir 'rachetés' auprès de mon ancien opérateur télécom. Je n'ai jamais reçu de facture de cette somme de la part de l'opérateur, et je ne sais même pas si c'est réel. Est-ce que cette société a le droit de me réclamer cet argent ? Que dois-je faire avant de payer quoi que ce soit ?",
    canton: 'BE',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 164', 'CO 167', 'LP 80', 'LP 67'],
    notes: "Cession de créance (CO 164) : le créancier peut céder sa créance à un tiers sans consentement du débiteur. La cession est valable mais le débiteur peut opposer au cessionnaire toutes les exceptions qu'il aurait pu faire valoir contre le cédant (CO 169). CO 167 : le débiteur qui a payé de bonne foi au cédant est libéré. Avant de payer : vérifier l'existence de la dette (bordereau, justificatifs), demander la preuve de la cession. LP 80 : la société ne peut pas lancer une poursuite sans titre valable. 'Société inconnue + rachetés + jamais reçu de facture' sans 'CO 164' ni 'cession de créance'. Signal adversarial = croyance que la cession est illégale ou que la société ment forcément.",
  },

  // ÉTRANGERS — permis C refusé après 10+ ans de permis B
  {
    id: 'adv_etrangers_09',
    query: "Je vis en Suisse depuis 12 ans avec un permis B qui se renouvelle chaque année sans problème. J'ai un contrat de travail stable, je paie mes impôts, je n'ai jamais eu d'ennuis avec la police. L'office cantonal des migrations vient de rejeter ma demande de permis C sans m'expliquer clairement pourquoi. Quelles sont les conditions que je n'aurais pas remplies et quels sont mes recours ?",
    canton: 'ZH',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 34', 'LEI 38', 'LEI 96'],
    notes: "Permis C (autorisation d'établissement) — LEI 34 al. 2 : octroi après 10 ans de séjour légal ininterrompu (5 ans pour ressortissants UE/AELE) si critères d'intégration remplis (LEI 58a : langue, participation vie économique, respect ordre juridique). LEI 38 al. 2 : l'autorité peut refuser si critères non remplis. LEI 96 : voie de recours (recours auprès de l'instance cantonale compétente dans les 30 jours). '12 ans + casier vierge + impôts payés + refus non expliqué' sans 'LEI 34' ni 'critères intégration'. Signal adversarial = croyance que la durée seule suffit sans les critères d'intégration formels (langue, participation économique).",
  },

  // FAMILLE — autorité parentale, parents non mariés, père reconnaît l'enfant
  {
    id: 'adv_famille_11',
    query: "J'ai eu un enfant il y a 3 ans avec un homme avec qui je n'étais pas en couple. Il vient de reconnaître l'enfant à l'état civil. Maintenant il veut avoir son mot à dire sur le choix de l'école et les soins médicaux, et parle de 'garde partagée'. Je n'ai jamais voulu qu'il soit impliqué à ce niveau. Est-ce qu'il peut exiger ça ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 296', 'CC 298a', 'CC 301', 'CC 273'],
    notes: "Autorité parentale parents non mariés — CC 298a : depuis 2014, l'autorité parentale conjointe est la règle même pour les parents non mariés, dès lors que le père a reconnu l'enfant et qu'une déclaration commune a été déposée (ou décision du juge). CC 296 al. 2 : autorité parentale conjointe dans l'intérêt de l'enfant. CC 301 : décisions quotidiennes à la charge du parent gardien. CC 273 : droit de visite minimum même sans autorité parentale. 'Il a reconnu l'enfant + veut décider école et médecin + garde partagée' sans 'CC 298a' ni 'autorité parentale conjointe'. Signal adversarial = croyance que la non-relation amoureuse exclut l'autorité parentale.",
  },

  // SUCCESSIONS — pacte successoral, renonciation à la réserve héréditaire
  {
    id: 'adv_successions_05',
    query: "Mon père veut me donner 150 000 francs maintenant, de son vivant, et en échange il veut que je signe un document chez un notaire pour renoncer à ce qui me reviendrait lors de sa succession. Sa compagne doit recevoir l'essentiel. Est-ce que c'est légalement possible ? Qu'est-ce que je risque à signer ?",
    canton: 'GE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 495', 'CC 470', 'CC 522', 'CC 494'],
    notes: "Pacte successoral de renonciation (CC 495) : valide uniquement par acte authentique en présence du notaire et des parties ; le renonçant abandonne ses droits successoraux contre une éventuelle contre-prestation. Mais la renonciation NE PEUT PAS porter sur la réserve héréditaire future d'un descendant mineur (CC 470 al. 1, révision 2023 = 1/2 part légale). Si la contre-prestation est insuffisante, l'action en réduction reste possible (CC 522) dans les délais. CC 494 : libéralité de la part légale (alternative au pacte). '150 000 francs + renoncer à l'héritage futur + notaire' sans 'CC 495' ni 'pacte successoral'. Signal adversarial = croyance que la transaction est simple/définitive alors que la réserve héréditaire ne peut pas être totalement sacrifiée.",
  },

  // CIRCULATION — alcool au volant 0.55‰, première infraction, taux avéré
  {
    id: 'adv_circulation_05',
    query: "Samedi soir j'ai été contrôlé par la police et j'ai soufflé 0.55 pour mille. C'est la première fois que j'ai ce genre d'ennuis. Je n'avais pas eu d'accident. La police a pris mon permis sur place. Est-ce que je vais perdre mon permis définitivement ou seulement un certain temps, et quelles autres conséquences est-ce que je risque ?",
    canton: 'FR',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 91', 'LCR 16b', 'LCR 55'],
    notes: "Conduite en état d'ivresse — LCR 91 al. 1 : infraction si taux d'alcool ≥ 0.5‰. LCR 55 : contrôle obligatoire à 0.5‰. Taux 0.55‰ = infraction moyennement grave (LCR 16b : retrait de permis 1 mois minimum, première infraction). Amende pénale en plus. Au-dessus de 0.8‰ ou récidive → infraction grave (LCR 16c, 3 mois min). La prise du permis sur place est une mesure conservatoire. '0.55 pour mille + permis pris sur place + première fois' sans 'LCR 91' ni 'infraction moyennement grave'. Signal adversarial = confusion entre infraction légère (avertissement) et moyennement grave (retrait effectif).",
  },

  // VIOLENCE — revenge porn / diffusion d'images intimes sans consentement
  {
    id: 'adv_violence_05',
    query: "Mon ex-petit ami a publié des photos intimes de moi sur des sites pornographiques sans que je sois au courant. Une amie les a trouvées par hasard. Je n'ai plus de contact avec lui depuis 8 mois. Ces images sont encore visibles en ligne. Que puis-je faire légalement pour les faire retirer et pour qu'il soit sanctionné ?",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CP 197', 'CC 28', 'CC 28a', 'CP 179'],
    notes: "Revenge porn / atteinte à l'honneur et à la personnalité — CP 197 al. 4 : diffusion de représentations sexuelles non consenties = crime, peine privative de liberté jusqu'à 3 ans. CC 28 : atteinte à la personnalité (image, honneur, sphère privée). CC 28a : action civile en cessation + dommages-intérêts. CP 179quater : atteinte au domaine secret (captation d'images non autorisée si original non consenti). Signalement aux plateformes + plainte pénale + action civile en suppression. 'Ex-copain + photos intimes + sites pornographiques + sans contact' sans 'CP 197' ni 'revenge porn'. Signal adversarial = victime qui croit ne rien pouvoir faire sans contact avec l'auteur.",
  },

  // SOCIAL — expulsion avec enfants, hébergement d'urgence, obligation de l'État
  {
    id: 'adv_social_06',
    query: "L'huissier est venu ce matin et mes enfants et moi sommes à la rue. Nos affaires sont dans le couloir. Mon ex-mari est parti il y a 3 mois et avait arrêté de payer le loyer sans me le dire. Nous n'avons pas d'autre logement et pas d'argent. Qui a l'obligation de nous aider ce soir et comment je fais pour trouver un hébergement d'urgence ?",
    canton: 'VD',
    expected_domaine: 'social',
    expected_any_article: ['Cst 12', 'LIAS 8', 'Cst 41'],
    notes: "Hébergement d'urgence — Cst 12 : droit fondamental à des conditions minimales d'existence, justiciable et d'application immédiate (TF 8C_622/2009). La commune ou le canton a l'obligation de fournir un hébergement d'urgence même sans démarche préalable. LIAS (loi cantonale aide sociale VD) art. 8 : aide immédiate en cas de détresse. Lignes d'urgence sociales cantonales. 'Huissier ce matin + enfants à la rue + pas d'argent + ce soir' sans 'Cst 12' ni 'hébergement d'urgence'. Signal adversarial = ne pas savoir que la commune doit agir immédiatement sans procédure longue.",
  },

  // ENTREPRISE — actionnaire minoritaire d'une SA, AG non convoqué, décisions contraires aux intérêts
  {
    id: 'adv_entreprise_05',
    query: "Nous sommes 3 actionnaires à parts égales dans notre petite SA. Les deux autres ont tenu une assemblée générale en janvier à laquelle je n'ai jamais été convoqué. Ils ont voté une augmentation de leurs propres salaires de direction de 30% et une émission de nouvelles actions qui va diluer ma part de 33% à 18%. Je l'ai appris par hasard. Quels sont mes recours ?",
    canton: 'ZH',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 706', 'CO 697', 'CO 704', 'CO 706b'],
    notes: "Nullité des décisions de l'AG — CO 697 al. 1 : convocation de l'AG à tous les actionnaires inscrits dans les 20 jours (défaut de convocation = vice formel). CO 706 : action en annulation dans les 2 mois dès la connaissance (défaut de convocation = motif suffisant). CO 706b : nullité absolue (cas énumérés dont suppression des droits essentiels des actionnaires sans accord). CO 704 al. 1 : augmentation du capital social requiert une majorité qualifiée des 2/3. 'AG sans moi + augmentation salaires + dilution de mes actions' sans 'CO 706' ni 'action en annulation'. Signal adversarial = croyance que la majorité peut tout décider sans respecter les droits procéduraux de la minorité.",
  },

  // ─── WAVE 12 — 2026-06-14 ──────────────────────────────────────────────────

  // BAIL — bail commercial, congé avec préavis court, pas de protection CO 271a
  {
    id: 'adv_bail_15',
    query: "Je tiens un magasin de fleurs dans un local que je loue depuis 8 ans. Mon bailleur m'envoie un congé avec 3 mois de préavis pour récupérer le local. J'ai investi 60 000 CHF en aménagements. Mon bail est marqué 'bail commercial'. Est-ce que je peux contester ce congé comme pour un logement ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 253a', 'CO 272a', 'CO 268'],
    notes: "Bail commercial (locaux à usage commercial, CO 253a) — protection limitée par rapport au bail d'habitation : pas de CO 271a (congé abusif de l'habitation, liste exhaustive) ; la prolongation n'est accordée qu'en cas de besoins clairement prépondérants du locataire (CO 272a al. 1 : 1 prolongation max de 6 ans). Délai de préavis 6 mois pour bail commercial si > 1 an (CO 268). L'investissement en aménagements peut donner droit à une indemnité si le bailleur en profite (CO 260a). 'Bail commercial + congé 3 mois + 60k aménagements' sans 'CO 253a' ni 'différence bail commercial'. Signal adversarial = citoyen qui croit bénéficier de la même protection que pour un logement.",
  },

  // TRAVAIL — pourboires retenus partiellement par l'employeur
  {
    id: 'adv_travail_16',
    query: "Je suis serveuse dans un restaurant. Mon contrat prévoit un salaire fixe de 3 200 CHF plus les pourboires. Depuis un mois mon patron retient 40% de tous les pourboires 'pour les redistribuer à la cuisine'. Je n'ai signé aucun avenant pour ce changement. Est-ce qu'il a le droit de faire ça ?",
    canton: 'VD',
    expected_domaine: 'travail',
    expected_any_article: ['CO 322a', 'CO 322', 'CO 335'],
    notes: "Pourboires — CO 322a al. 1 : le pourboire appartient au travailleur, pas à l'employeur. L'employeur ne peut le retenir ou le redistribuer qu'avec l'accord exprès du travailleur (ou si le contrat le prévoit). Une modification sans avenant signé est une modification unilatérale nulle (CO 320 al. 2). Si le travailleur continue à travailler sans protestation, risque de présomption d'acceptation. CO 322 : le salaire est fixé par accord. CO 335 : résiliation-modification comme seule voie légale. 'Mon patron retient 40% des pourboires + sans ma signature' sans 'CO 322a' ni 'pourboires appartiennent au travailleur'. Signal adversarial = croyance que l'employeur peut redistribuer les pourboires à discrétion.",
  },

  // DETTES — revendication par un tiers d'un objet saisi (LP 106)
  {
    id: 'adv_dettes_14',
    query: "L'huissier a saisi la télévision du salon et l'ordinateur de mon appartement pour une dette que j'ai. Ces objets appartiennent à ma mère qui vit avec moi — elle a les factures à son nom et peut le prouver. Comment est-ce qu'on fait pour récupérer ces objets et montrer qu'ils ne sont pas à moi ?",
    canton: 'BE',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 106', 'LP 108', 'LP 275'],
    notes: "Opposition à la saisie / revendication de tiers (LP 106 al. 1) : tout tiers qui prétend avoir des droits sur un objet saisi peut s'y opposer dans les 10 jours dès que l'office l'en a informé. LP 108 : si le créancier conteste, le tiers doit ouvrir action en revendication dans les 20 jours. Preuve : factures au nom du tiers, relevés bancaires montrant le paiement depuis son compte. Le tiers n'a pas à prouver l'absence de prêt ; le créancier doit prouver que l'objet appartient au débiteur. 'Huissier saisi les affaires de ma mère qui a les factures + comment récupérer' sans 'LP 106' ni 'revendication tierce'. Signal adversarial = ignorance totale du droit d'opposition du tiers propriétaire.",
  },

  // FAMILLE — divorce, bien acheté avant mariage avec fonds propres
  {
    id: 'adv_famille_12',
    query: "Mon mari veut divorcer. Il dit qu'il a droit à la moitié de mon appartement parce que nous sommes mariés. J'ai acheté cet appartement 3 ans avant notre mariage avec l'argent de mon héritage. Nous n'avons jamais signé de contrat de mariage. Est-ce qu'il a vraiment droit à la moitié ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 197', 'CC 198', 'CC 204', 'CC 196'],
    notes: "Participation aux acquêts (régime légal, CC 196) — biens propres vs acquêts. CC 198 ch. 2 : les biens acquis avant le mariage par un conjoint et ceux reçus en héritage sont des biens propres, exclus du partage. CC 204 al. 1 : chaque conjoint reprend ses biens propres sans partage. CC 197 : seuls les acquêts (revenus du travail, économies) sont partagés à 50/50. L'appartement acheté avant le mariage avec un héritage = bien propre → le mari n'y a droit à RIEN (sous réserve d'un apport sur acquêts pour les remboursements hypothécaires pendant le mariage). '3 ans avant le mariage + héritage + pas de contrat' sans 'CC 197' ni 'biens propres'. Signal adversarial = croyance que le mariage donne automatiquement droit à la moitié de tous les biens.",
  },

  // ÉTRANGERS — regroupement familial refusé pour logement insuffisant
  {
    id: 'adv_etrangers_10',
    query: "Je vis en Suisse avec un permis C depuis 6 ans. J'ai demandé le regroupement familial pour faire venir ma femme du Maroc. L'office des migrations refuse car mon appartement de 2 pièces (48 m²) serait 'insuffisant pour 2 personnes adultes'. Ils citent une norme cantonale. Est-ce légal et peut-on contester ?",
    canton: 'ZH',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 44', 'LEI 42', 'OASA 73', 'LEI 96'],
    notes: "Regroupement familial + condition de logement approprié — LEI 44 al. 1 lit. b : le logement approprié est une condition légale (idem LEI 42 pour conjoint de Suisse). OASA 73 : le logement doit correspondre aux normes usuelles de la région (appréciation cantonale). 48 m² pour 2 adultes peut être considéré suffisant selon le canton. Recours : contester par voie administrative dans les 30 jours + produire un bail pour un logement plus grand ou expertise sur les normes de la région (certains cantons : 35 m² par personne). LEI 96 : obligation de proportionnalité de l'autorité. 'Permis C + femme du Maroc + appartement 2 pièces refusé' sans 'LEI 44' ni 'logement approprié'. Signal adversarial = croyance que l'autorité peut fixer des normes sans limite légale.",
  },

  // SUCCESSIONS — désigné exécuteur testamentaire, obligations et pouvoirs
  {
    id: 'adv_successions_06',
    query: "Mon beau-père vient de mourir et son testament me désigne comme exécuteur testamentaire. Sa fille (l'héritière principale) me presse de lui remettre les clés de la maison et de tout lui transférer immédiatement. Elle dit que j'ai l'obligation légale d'agir dans les 24 heures. Quels sont vraiment mes droits et devoirs dans ce rôle ?",
    canton: 'GE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 517', 'CC 518', 'CC 553'],
    notes: "Exécuteur testamentaire — CC 517 al. 1 : désigné par acte de dernière volonté, il administre la succession selon les instructions du testateur. CC 518 al. 1 : l'exécuteur testamentaire a la possession des biens successoraux (possession, pas propriété). CC 518 al. 2 : il inventorie les biens, paye les dettes, exécute les legs et opère la répartition. CC 553 : l'autorité peut ordonner un inventaire immédiat. L'héritière ne peut pas exiger le transfert immédiat — c'est l'exécuteur qui administre jusqu'à la liquidation. Délai raisonnable = plusieurs semaines à mois. '24h + transfert immédiat + héritière presse' sans 'CC 518' ni 'exécuteur testamentaire rôle'. Signal adversarial = confusion entre les droits de l'exécuteur (administrateur fiduciaire) et ceux de l'héritière (destinataire final).",
  },

  // ASSURANCES — AANP accident de ski, indemnité 80% contestée
  {
    id: 'adv_assurances_06',
    query: "Mon mari travaille à 100% dans une entreprise. Il s'est cassé le genou en skiant le week-end dernier. L'assurance-accidents dit que comme c'est en dehors du travail, il touche seulement 80% de son salaire pendant l'arrêt. Nous pensions qu'il aurait 100%. Y a-t-il un moyen de contester ou d'obtenir les 20% manquants ?",
    canton: 'FR',
    expected_domaine: 'assurances',
    expected_any_article: ['LAA 17', 'LAA 6', 'LAA 13', 'OLAA 23'],
    notes: "Accident non professionnel (AANP) — LAA 6 al. 2 : les travailleurs à temps plein (≥ 8h/sem) sont assurés LAA contre les AANP. LAA 17 : indemnité journalière AANP = 80% du salaire assuré (contrairement à l'accident professionnel = 80% aussi — mais souvent le contrat CCT ou police complémentaire donne 100% pour AP). Pour obtenir 100%, il faudrait une assurance complémentaire privée ou une CCT prévoyant l'indemnité complète pour AANP. OLAA 23 : base de calcul du gain assuré. Opposition possible si le calcul du salaire assuré est erroné. '80% au lieu de 100% + accident ski week-end' sans 'LAA 17' ni 'AANP'. Signal adversarial = croyance que l'assurance LAA paye toujours 100% du salaire pour tous les accidents.",
  },

  // SANTÉ — certificat médical contesté par l'employeur, menaces de sanctions
  {
    id: 'adv_sante_05',
    query: "J'étais arrêtée une semaine pour maladie avec un certificat de mon médecin de famille. Mon patron dit que ce certificat est 'de complaisance' et il me menace d'un avertissement si ça se reproduit. Il veut aussi que je sois examinée par le médecin-conseil de l'entreprise. Peut-il légalement remettre en cause mon certificat médical et m'imposer ce médecin d'entreprise ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 324a', 'CO 328', 'LAMal 40'],
    notes: "Contestation certificat médical — CO 324a : droit au salaire en cas de maladie empêchant le travail (pas de faute du travailleur requise). L'employeur peut légitimement demander un 2ème avis médical (médecin-conseil), mais ne peut pas unilatéralement invalider un certificat valide. LAMal 40 : libre choix du médecin traitant par l'assuré. CO 328 : le patron qui formule des accusations publiques de complaisance sans preuve porte atteinte à la personnalité. L'avertissement pour maladie attestée peut être constitutif d'une résiliation abusive (CO 336 al. 1 lit. a : exercice d'un droit constitutionnel — droit à la santé). 'Certificat de mon médecin + patron dit complaisant + médecin d'entreprise imposé' sans 'CO 324a' ni 'contestation certificat'. Signal adversarial = ignorance de la hiérarchie des preuves (certificat prime sauf expertise contraire ordonnée par autorité).",
  },

  // VOISINAGE — caméra de surveillance pointée vers propriété voisine
  {
    id: 'adv_voisinage_07',
    query: "Mon voisin a installé une caméra de surveillance sur sa façade. Elle est orientée de façon à filmer directement ma cour privée et parfois ma fenêtre de chambre. Il dit qu'il a le droit de surveiller sa propre entrée. J'ai demandé à voir les images et il a refusé. Quels sont mes recours contre cette intrusion visuelle ?",
    canton: 'VD',
    expected_domaine: 'voisinage',
    expected_any_article: ['LPD 30', 'CC 28', 'CC 684', 'LPD 25'],
    notes: "Vidéosurveillance par le voisin — LPD 25/30 (droit d'accès aux données + obligations du responsable du traitement). La caméra qui filme la propriété privée d'un voisin constitue un traitement de données personnelles (LPD 5 lit. a). LPD 30 : le responsable du traitement doit informer les personnes filmées (panneaux) et ne peut traiter que ce qui est nécessaire. CC 28 (personnalité) + CC 28a (action en cessation + réparation) : filmer la cour ou chambre d'un voisin sans nécessité = atteinte à la sphère privée. CC 684 : immissions immatérielles (l'observation continue d'une propriété peut être excessive). 'Caméra voisin filme ma cour + refus de voir les images' sans 'LPD 30' ni 'vidéosurveillance'. Signal adversarial = croyance que le droit de surveiller sa propre entrée inclut le droit de filmer la propriété voisine.",
  },

  // HYBRIDE — concubinage long, décès sans testament, famille biologique réclame tout
  {
    id: 'adv_hybride_07',
    query: "Mon compagnon et moi vivons ensemble depuis 15 ans sans nous être mariés. Il est décédé sans testament. Sa famille (ses frères et sœurs) vient de m'informer qu'ils héritent de tout, y compris notre appartement commun que nous avons acheté à 50/50. Ils veulent que je parte. Quels sont mes droits en tant que partenaire de longue date non marié ?",
    canton: 'GE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 457', 'CC 462', 'CC 481', 'CC 652'],
    notes: "Concubin survivant sans testament — CC 457 : en l'absence de descendants, les collatéraux (frères et sœurs) héritent par représentation. Le concubin non marié N'A AUCUN droit successoral légal (CC 457 ne mentionne pas le partenaire de vie). CC 462 : seul le conjoint marié ou partenaire enregistré (LPart) bénéficie d'une quote-part légale. Sur l'appartement acheté à 50/50 (CC 652 — copropriété) : les héritiers ne peuvent forcer la vente qu'en demandant la licitation (action en partage CC 650). Le concubin possède sa part de 50% et ne peut pas être expulsé sans son accord. CC 481 : le de cujus aurait pu avantager son partenaire par testament (jusqu'à la quotité disponible). '15 ans ensemble + décédé + famille dit tout hériter + appartement 50/50' sans 'CC 457' ni 'copropriété'. Signal adversarial = confusion entre héritage légal (nul pour concubin) et droits de copropriété (protégés).",
  },

  // ========== WAVE 13 — angles inédits ==========

  // BAIL — colocataire veut partir, bail solidaire à deux noms
  {
    id: 'adv_bail_16',
    query: "On est deux à avoir signé le bail de cet appartement, moi et mon ami. On ne s'entend plus. Lui veut rester, moi je veux partir. La régie dit que je suis toujours responsable du loyer même si je pars. Est-ce qu'il peut garder l'appart sans moi et comment est-ce que je me dégage de la responsabilité du bail ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 143', 'CO 264', 'CO 266'],
    notes: "Colocataire / bail solidaire (CO 143) — en Suisse, si deux personnes signent un bail ensemble, elles sont solidairement responsables de tout le loyer. Pour que le premier locataire se dégage, il faut : (a) que le bailleur accepte formellement de le libérer, ou (b) qu'un locataire de remplacement solvable soit trouvé (analogie CO 264). On ne peut pas 'quitter' un bail solidaire sans l'accord du bailleur — le bail ne prend fin que si TOUS les locataires donnent le congé ensemble (CO 266). 'Je veux partir + lui reste + régie dit que je dois quand même payer' sans 'CO 143' ni 'solidarité'. Signal adversarial = ignorance que le bail solidaire lie le colocataire sortant jusqu'à la fin du contrat ou remplacement accepté.",
  },

  // TRAVAIL — licenciement abrupt en période d'essai, 7 jours seulement
  {
    id: 'adv_travail_17',
    query: "J'ai commencé un nouveau travail il y a 3 semaines. Hier mon patron m'a dit que ça ne marchait pas et il me donnait une semaine pour partir. Aucune explication, aucune lettre, juste verbal. Est-ce que c'est légal de me virer aussi vite sans rien me dire ?",
    canton: null,
    expected_domaine: 'travail',
    expected_any_article: ['CO 335b', 'CO 335'],
    notes: "Licenciement en période d'essai — CO 335b al. 1 : pendant le premier mois de travail (période d'essai standard), délai de résiliation de 7 jours. L'employeur n'a pas à motiver sa décision pendant la période d'essai (sauf abus manifeste CO 336). Une semaine de préavis verbal est légalement possible. Mais : si aucune lettre n'est envoyée et que le travailleur conteste avoir reçu le congé, l'employeur doit prouver la notification (recommandé ou remise en main propre). '3 semaines + une semaine pour partir + sans explication' sans 'CO 335b' ni 'période d'essai'. Signal adversarial = citoyen qui croit que le licenciement nécessite toujours un motif écrit.",
  },

  // DETTES — dette ancienne reçue par une agence de recouvrement, prescription
  {
    id: 'adv_dettes_15',
    query: "J'ai reçu un appel d'une société de recouvrement qui dit que je dois CHF 4'800 pour un crédit que j'aurais pris en 2014. Je ne me souviens plus de ce crédit et je n'ai rien payé depuis au moins 8 ans. Est-ce que cette dette est encore valable et est-ce que je dois payer ?",
    canton: null,
    expected_domaine: 'dettes',
    expected_any_article: ['CO 127', 'CO 128', 'CO 142'],
    notes: "Prescription d'une dette (CO 127 : 10 ans prescription ordinaire). Une dette non reconnue depuis plus de 5 ans peut être prescrite selon le type (CO 128 : 5 ans pour les créances périodiques). La prescription doit être invoquée par le débiteur (CO 142 : le juge ne peut la suppléer d'office). Si aucun acte interruptif (reconnaissance, commandement de payer, paiement partiel) n'a eu lieu depuis 10 ans, la dette est prescrite. Le cédant (agence de recouvrement) ne peut pas exiger plus que le créancier original. 'Crédit 2014 + rien payé depuis 8 ans + société de recouvrement' sans 'CO 127' ni 'prescription'. Signal adversarial = citoyen qui ignore que les dettes anciennes peuvent être prescrites et que c'est lui qui doit l'invoquer.",
  },

  // VIOLENCE — violence conjugale physique, besoin de partir avec les enfants en urgence
  {
    id: 'adv_violence_06',
    query: "Mon mari me frappe régulièrement depuis 2 ans, surtout quand il a bu. Hier soir il a aussi levé la main sur notre fils de 8 ans. J'ai peur de rester à la maison mais je ne sais pas comment partir avec les enfants sans qu'il ne nous retrouve. Est-ce qu'il y a une façon légale de l'obliger à quitter le domicile plutôt que de fuir moi-même ?",
    canton: 'VD',
    expected_domaine: 'violence',
    expected_any_article: ['CC 28b', 'CC 176', 'LAVI'],
    notes: "Violence conjugale + enfants — CC 28b : le tribunal peut ordonner une interdiction de périmètre / d'approcher la victime et les enfants. CC 176 al. 1 ch. 2 : dans le cadre des mesures protectrices de l'union conjugale, le juge peut attribuer le logement conjugal à l'un des époux. LAVI : aide aux victimes d'infractions — consultant gratuit, soutien psychologique, indemnité. La victime peut déposer une plainte pénale (CP 122/123 lésions corporelles) + une demande de mesures urgentes (CPC 261 mesures provisionnelles). L'autorité de protection de l'enfant (APEA/KESB) peut intervenir pour protéger le fils. 'Mari frappe depuis 2 ans + fils touché + partir avec enfants + obliger mari à quitter' sans 'CC 28b' ni 'mesures protectrices'. Signal adversarial = ignorance que c'est l'auteur qui peut être expulsé du domicile et non la victime qui doit fuir.",
  },

  // ÉTRANGERS — permis F (admis provisoire), droits au travail
  {
    id: 'adv_etrangers_11',
    query: "Je suis arrivé de Syrie il y a 2 ans. Ma demande d'asile a été refusée mais on m'a dit que je ne pouvais pas être renvoyé pour l'instant et que j'ai un 'permis F'. Je cherche du travail mais les employeurs disent qu'ils ne savent pas si c'est autorisé. Ai-je le droit de travailler avec ce permis et pour combien de temps ?",
    canton: 'BE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 83', 'LEI 85', 'OASA 61a'],
    notes: "Admis provisoire (permis F) — LEI 83 : renvoi provisoirement impossible (illicite, inexigible ou matériellement impossible). LEI 85 al. 2 : les étrangers admis provisoirement ont le droit d'exercer une activité lucrative (délai d'attente de 3 mois, annulation possible si intérêt économique ou urgence). L'employeur n'a pas besoin d'une autorisation spéciale au-delà de l'annonce à l'autorité cantonale. OASA 61a : exigences simplifiées pour l'accès au marché du travail des admis provisoires. Durée : le permis F est renouvelé tant que le renvoi reste impossible. 'Permis F + employeurs disent pas sûr + droit de travailler ?' sans 'LEI 83' ni 'admis provisoire'. Signal adversarial = ignorance que le permis F donne un droit au travail légal en Suisse.",
  },

  // SANTÉ — suspension assurance maladie pour arriérés de primes, urgence médicale
  {
    id: 'adv_sante_06',
    query: "J'ai des arriérés de primes d'assurance maladie depuis 6 mois. Ma caisse maladie m'a envoyé une lettre disant que mon assurance est 'suspendue'. Aujourd'hui j'ai eu de fortes douleurs dans la poitrine. J'ai peur qu'à l'hôpital ils refusent de me soigner parce que mon assurance est suspendue. Qu'est-ce qui se passe exactement quand l'assurance est suspendue ?",
    canton: 'GE',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 64a', 'LAMal 41'],
    notes: "Suspension LAMal pour non-paiement — LAMal 64a al. 7 : même en cas de suspension, l'assureur doit prendre en charge les soins urgents (c'est l'État cantonal qui paie et récupère ensuite). La suspension signifie que les soins non urgents ne sont pas remboursés, mais l'accès aux urgences reste garanti par la loi. LAMal 41 : libre choix du médecin/hôpital. La dette envers la caisse reste due (plus intérêts 5%), mais les arriérés peuvent faire l'objet d'un arrangement de paiement. Dans les cantons du concordat LCA/listes noires : le débiteur est sur liste cantonale des mauvais payeurs → seuls les soins urgents remboursés. 'Suspension assurance maladie + douleurs poitrines + peur refus soins' sans 'LAMal 64a' ni 'soins urgents toujours couverts'. Signal adversarial = croyance que la suspension = perte totale de l'accès aux soins.",
  },

  // CONSOMMATION — voyage organisé annulé par l'agence, droit au remboursement vs bon
  {
    id: 'adv_consommation_06',
    query: "J'avais réservé et payé CHF 3'200 un circuit organisé en Thaïlande auprès d'une agence de voyage suisse. 3 semaines avant le départ, l'agence m'informe qu'elle annule le circuit 'faute de participants suffisants'. Elle me propose un bon valable 18 mois. J'aimerais un remboursement en cash, pas un bon. Ai-je ce droit ?",
    canton: 'ZH',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 397a', 'CO 119', 'CO 205', 'CO 208'],
    notes: "Voyage à forfait annulé par l'organisateur — en droit suisse (Loi fédérale sur les voyages à forfait LFP, RS 944.3, en vigueur depuis 2019), si l'organisateur annule le voyage, le voyageur a droit au remboursement intégral dans les 14 jours (LFP 13 al. 1). L'organisateur ne peut pas imposer un bon à la place d'un remboursement en espèces — c'est le choix du consommateur. CO 397a (responsabilité de l'agent de voyages) s'applique subsidiairement. Si l'organisateur refuse, le consommateur peut déposer plainte auprès de la Commission de conciliation des voyages à forfait ou agir au tribunal (CPC procédure simplifiée < 30'000 CHF). 'Voyage annulé 3 semaines avant + bon imposé + je veux cash' sans 'LFP' ni 'remboursement 14 jours'. Signal adversarial = ignorance que le bon est une faveur et non un droit de l'agence.",
  },

  // SOCIAL — allocation perte de gain maternité pour travailleuse indépendante
  {
    id: 'adv_social_07',
    query: "Je suis photographe indépendante, je cotise à l'AVS depuis 4 ans. Je suis enceinte de 7 mois et je prévois d'accoucher dans 2 mois. On m'a dit que j'ai droit à quelque chose pendant ma maternité mais je ne suis pas salariée. Ai-je vraiment droit à une allocation et combien ?",
    canton: null,
    expected_domaine: 'assurances',
    expected_any_article: ['LAPG 16b', 'LAPG 16d', 'LAPG 16f'],
    notes: "APG maternité pour indépendante — La loi sur les allocations pour perte de gain (LAPG) couvre aussi les travailleuses indépendantes qui cotisent à l'AVS depuis au moins 5 mois (LAPG 16b al. 2). Durée : 98 jours (14 semaines) à partir de l'accouchement. Montant : 80% du revenu moyen soumis à l'AVS, plafonné au gain assuré. La demande doit être faite auprès de la caisse de compensation AVS dans les 5 ans suivant l'accouchement. Pour y avoir droit, il faut avoir été affiliée à l'AVS sans interruption depuis 5 mois et avoir exercé une activité lucrative. '4 ans AVS + photographe indépendante + enceinte + allocation possible ?' sans 'LAPG' ni 'allocation maternité indépendante'. Signal adversarial = croyance que l'APG maternité est réservée aux salariées.",
  },

  // VOISINAGE — racines d'arbre voisin soulèvent ma terrasse, qui paie les dégâts ?
  {
    id: 'adv_voisinage_08',
    query: "Les racines du chêne de mon voisin ont soulevé ma terrasse en béton et ma clôture. Les réparations vont coûter environ CHF 8'000. Mon voisin dit que c'est un phénomène naturel et qu'il n'est pas responsable. Qui doit payer et est-ce que j'ai le droit de couper les racines ?",
    canton: 'FR',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 679', 'CC 687', 'CC 684'],
    notes: "Racines empiétantes et dommages — CC 687 al. 1 : le propriétaire peut couper et garder les racines et branches qui empiètent sur son fonds, après avoir accordé un délai convenable au voisin. CC 679 al. 1 : le propriétaire qui use de son fonds en excédant ses droits de propriété et cause des dommages à un voisin en est responsable (responsabilité causale). Si les racines causent des dommages matériels, le propriétaire de l'arbre peut être tenu responsable même sans faute si l'usage est excessif (CC 684 : immissions — bruits, émanations, etc., par extension jurisprudentielle pour racines). Action en réparation + permission de couper les racines entrantes. Prescription 10 ans (CO 127). 'Racines voisin + terrasse soulevée + 8000 CHF + phénomène naturel' sans 'CC 679' ni 'responsabilité du propriétaire'. Signal adversarial = croyance que le propriétaire n'est jamais responsable des dommages causés par ses arbres.",
  },

  // SUCCESSIONS — hoirie bloquée 15 ans, un héritier refuse tout partage
  {
    id: 'adv_successions_07',
    query: "Notre père est décédé il y a 15 ans. L'appartement qu'il possédait à Fribourg est toujours au nom de l'hoirie. Mon frère refuse depuis 15 ans de signer quoi que ce soit — il dit qu'il préfère 'attendre'. Les deux autres héritiers (moi et ma sœur) voulons vendre et récupérer notre part. Est-ce que mon frère peut bloquer le partage indéfiniment ?",
    canton: 'FR',
    expected_domaine: 'successions',
    expected_any_article: ['CC 604', 'CC 610', 'CC 650'],
    notes: "Partage forcé de l'hoirie — CC 604 al. 1 : chaque héritier peut demander le partage à tout moment (le droit au partage est imprescriptible). CC 610 : sauf accord contraire, les parts héréditaires sont égales. Un héritier ne peut pas bloquer indéfiniment le partage. Si le frère refuse de négocier, les autres héritiers peuvent saisir le tribunal et demander un partage judiciaire. CC 650 : si les parties ne s'entendent pas sur l'attribution de biens en nature, le juge peut ordonner la vente aux enchères (licitation). La procédure de partage judiciaire se fait selon les règles cantonales (CPC 274 pour les litiges successoraux). 'Hoirie 15 ans + frère refuse + voulons vendre + peut-il bloquer ?' sans 'CC 604' ni 'partage imprescriptible'. Signal adversarial = croyance que l'unanimité est toujours requise et qu'un héritier peut bloquer éternellement.",
  },

  // ─── WAVE 14 — 2026-06-16 ──────────────────────────────────────────────────

  // BAIL — vente de l'immeuble, transfert automatique du bail au nouveau propriétaire (CO 261)
  {
    id: 'adv_bail_17',
    query: "J'ai reçu une lettre du notaire m'informant que l'immeuble où je loue mon appartement depuis 9 ans a été vendu la semaine dernière à une société immobilière. La société m'a ensuite écrit pour me dire qu'elle récupère les locaux dans 6 mois pour ses propres besoins et que mon bail 'ne la concerne pas' car elle n'était pas partie au contrat original. Elle a raison ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 261', 'CO 261a', 'CO 271', 'CO 271a'],
    notes: "Transfert du bail lors de vente de l'immeuble — CO 261 al. 1 : si le bailleur aliène la chose louée, le bail passe à l'acquéreur avec tous les droits et obligations. L'acquéreur NE PEUT PAS mettre fin au bail avant l'échéance (il peut résilier pour terme prochain, mais uniquement en respectant les délais et formes légaux, et le congé reste contestable si abusif, CO 271a). Résiliation pour besoin propre admissible mais doit être réel et urgent. '9 ans + vendu + nouveau propriétaire dit que le bail ne le concerne pas' sans 'CO 261' ni 'transfert automatique du bail'. Signal adversarial = croyance répandue (y compris chez les nouveaux propriétaires) que l'achat libère des baux existants.",
  },

  // TRAVAIL — travail du dimanche imposé unilatéralement, sans accord ni supplément (LTr 19)
  {
    id: 'adv_travail_18',
    query: "Je travaille dans un garage depuis 4 ans. Mon patron exige depuis 2 mois que je vienne le dimanche matin de 8h à 12h pour 'rattraper les retards de commandes'. Il ne paie aucun supplément et dit que c'est du travail normal. Mon contrat ne mentionne pas le dimanche. Est-ce légal et ai-je droit à une compensation ?",
    canton: 'BE',
    expected_domaine: 'travail',
    expected_any_article: ['LTr 19', 'LTr 17', 'CO 321c', 'LTr 20'],
    notes: "Travail du dimanche — LTr 19 al. 1 : le travail du dimanche est en principe interdit. LTr 19 al. 3 : autorisé seulement avec autorisation de l'autorité cantonale, si justifié par des raisons techniques ou économiques impérieuses. LTr 20 : si travail du dimanche autorisé, supplément de salaire de 50% obligatoire (en plus du temps compensatoire). Un garage n'est pas une entreprise bénéficiant d'autorisation permanente de travail dominical. 'Garage + dimanche matin depuis 2 mois + pas de supplément + contrat sans dimanche' sans 'LTr 19' ni 'interdiction travail dominical'. Signal adversarial = patron qui présente le dimanche comme 'travail normal' sans autorisation légale.",
  },

  // FISCAL — assujettissement TVA après dépassement du seuil de CHF 100 000 (LTVA 10)
  {
    id: 'adv_fiscal_03',
    query: "Je suis photographe indépendant. Cette année pour la première fois mon chiffre d'affaires va dépasser 100 000 francs. Mon comptable parle de 'devoir m'inscrire à la TVA'. Je n'ai jamais eu à m'en occuper. Qu'est-ce que ça change concrètement pour mes factures, pour mes clients et est-ce qu'il y a un délai pour s'inscrire ?",
    canton: null,
    expected_domaine: 'fiscal',
    expected_any_article: ['LTVA 10', 'LTVA 25', 'LTVA 21'],
    notes: "Assujettissement TVA obligatoire — LTVA 10 al. 1 : toute personne qui exploite une entreprise dont le chiffre d'affaires annuel dépasse 100 000 CHF doit s'inscrire auprès de l'AFC. LTVA 25 : taux (7.7% normal, 3.7% hébergement, 2.5% biens première nécessité). LTVA 21 : prestation exclue de la TVA (certains services médicaux/éducatifs). Délai d'inscription : dans les 30 jours dès dépassement du seuil. Impact : facturer la TVA aux clients, la reverser à l'AFC, mais possibilité de récupérer la TVA sur les achats professionnels. 'Photographe + 100k pour la première fois + inscription TVA' sans 'LTVA 10' ni 'assujettissement'. Signal adversarial = confusion entre impôt sur le revenu (déjà connu) et TVA (mécanisme différent). ATTENTION: domaine 'fiscal' est un blind spot JPT — 0% attendu.",
  },

  // ACCIDENT — maladie professionnelle diagnostiquée après la retraite (LAA 9, surdité bruit)
  {
    id: 'adv_accident_05',
    query: "J'ai 66 ans et suis à la retraite depuis 2 ans après 28 ans comme menuisier. Mon audiologiste vient de m'annoncer que j'ai une surdité sévère des deux oreilles clairement liée au bruit des machines sur les chantiers. Mon ancien employeur principal est faillité depuis 5 ans. L'assureur LAA de cet employeur dit que c'est 'trop tard'. Ai-je encore un recours ?",
    canton: 'NE',
    expected_domaine: 'assurances',
    expected_any_article: ['LAA 9', 'LAA 77', 'OLAA 1', 'LAA 49'],
    notes: "Maladie professionnelle (LAA 9) — distincte de l'accident professionnel (LAA 6). La surdité liée au bruit = maladie professionnelle listée à l'OLAA 1 (liste des maladies professionnelles). LAA 77 : en cas de disparition de l'employeur ou de son assureur, la SUVA reprend les prestations. LAA 49 : délai de prescription 5 ans dès connaissance du dommage (pas 5 ans dès la fin de l'exposition). La retraite ne fait pas courir le délai — la prescription court dès le diagnostic ou la connaissance du lien causal. '28 ans menuisier + surdité + employer faillité + trop tard selon assureur' sans 'LAA 9' ni 'maladie professionnelle'. Signal adversarial = croyance que la maladie professionnelle doit être déclarée pendant l'emploi et que la retraite ou la faillite de l'employeur interrompt le droit. NOTE: JPT classe les cas LAA en domaine 'assurances'.",
  },

  // VIOLENCE — cyberharcèlement / harcèlement en ligne ex-partenaire (CP 179septies, CP 177)
  {
    id: 'adv_violence_07',
    query: "Mon ex-copain crée régulièrement de faux comptes Instagram pour m'envoyer des messages insultants depuis 7 mois que j'ai rompu. Il a aussi publié de fausses rumeurs sur moi sur des groupes Facebook de mon quartier. La police m'a dit que 'ce n'est pas physique donc ce n'est pas de la violence'. J'ai tout sauvegardé en screenshots avec les dates.",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CP 177', 'CP 173', 'CC 28a', 'CP 179septies'],
    notes: "Harcèlement en ligne / cyberviolence — CP 177 : injures (insultes publiques). CP 173 : diffamation (imputer à autrui un fait contraire à l'honneur). CC 28a : action en cessation de l'atteinte à la personnalité (droit civil). CP 179septies : utilisation abusive d'une installation de télécommunication (messages répétés et non voulus = punissable). La police a tort : le harcèlement non physique est punissable. Plainte pénale dans les 3 mois pour injures et diffamation (délits à poursuivre sur plainte). 'Faux comptes Instagram + insultes + fausses rumeurs Facebook + police dit pas physique' sans 'CP 177' ni 'injures' ni 'cyberviolence'. Signal adversarial = information policière erronée décourageant le dépôt de plainte.",
  },

  // ENTREPRISE — confusion de patrimoine SARL, créanciers attaquent personnellement l'associé unique
  {
    id: 'adv_entreprise_06',
    query: "J'ai fermé ma SARL il y a 18 mois car elle avait des dettes envers des fournisseurs (environ 35 000 CHF). À l'époque j'avais parfois utilisé le compte bancaire de la société pour des achats personnels. Deux fournisseurs me réclament maintenant personnellement ces dettes en disant que j'ai 'confondu mon argent avec celui de la société'. Peuvent-ils vraiment attaquer mon compte personnel ?",
    canton: 'ZH',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 794', 'CO 828', 'CO 803', 'LP 46'],
    notes: "Confusion de patrimoine (percement du voile corporatif) — CO 794 al. 1 : la SARL est une personne morale distincte, les associés ne répondent pas des dettes sociales sur leur patrimoine personnel. EXCEPTION (jurisprudence TF) : si l'associé unique a délibérément confondu son patrimoine avec celui de la société (usage du compte social pour dépenses privées sans remboursement), le juge peut 'percer le voile' et engager la responsabilité personnelle. CO 828 : responsabilité des gérants en cas de gestion fautive. CO 803 : fidélité et diligence des associés. LP 46 : la faillite de la SARL n'éteint pas la responsabilité personnelle en cas de faute grave de gestion. '35k dettes SARL + achats perso sur compte société + créanciers attaquent personnellement' sans 'CO 794' ni 'confusion de patrimoine'. Signal adversarial = croyance que la SARL protège TOUJOURS le patrimoine personnel, même en cas de confusion intentionnelle.",
  },

  // SOCIAL — AVS femme au foyer pendant 20 ans, bonification pour tâches éducatives, lacunes cotisation
  {
    id: 'adv_social_08',
    query: "J'ai 61 ans et j'ai élevé 3 enfants pendant 22 ans sans travailler à l'extérieur. Mon mari travaillait. Il est décédé il y a 3 ans. La caisse AVS me dit que j'ai des 'lacunes de cotisation' pour ces 22 années et que ma rente sera réduite. Pourtant je m'occupais des enfants. Y a-t-il des compensations pour les années passées à la maison, et est-ce que les cotisations de mon mari couvraient aussi les miennes ?",
    canton: 'FR',
    expected_domaine: 'assurances',
    expected_any_article: ['LAVS 10', 'LAVS 29', 'LAVS 23'],
    notes: "AVS épouse sans activité lucrative : bonifications pour tâches éducatives — LAVS 10 al. 1 : les conjoints sans activité lucrative sont assurés via le compte de leur conjoint actif (cotisation double réputée payée si le conjoint cotise au moins le double du minimum). Si cette condition est remplie, PAS de lacune. LAVS 29sexies : bonification pour tâches éducatives (enfants < 16 ans) = augmentation fictive du revenu pour le calcul de la rente, même si pas de revenu. LAVS 23 : rente de veuf/veuve si conjoint décédé. LAVS 29ter : taux de cotisation pour assurés sans activité. 'Femme au foyer 22 ans + 3 enfants + lacunes AVS + mari décédé' sans 'LAVS 29sexies' ni 'bonification tâches éducatives'. Signal adversarial = système très peu connu et contre-intuitif : si le mari cotisait, la femme au foyer peut NE PAS avoir de lacune ET bénéficier de bonifications éducatives.",
  },

  // VOISINAGE — empiètement d'une construction sur le terrain voisin (CC 674)
  {
    id: 'adv_voisinage_09',
    query: "Mon voisin a construit une terrasse couverte qui dépasse d'environ 50 centimètres sur mon terrain selon le relevé cadastral que j'ai fait faire. J'ai découvert ça en commandant un plan pour un autre projet. La construction date d'il y a 3 ans. Mon voisin dit que c'est 'à peine rien' et que c'est prescrit. Y a-t-il vraiment prescription, et quels sont mes droits ?",
    canton: 'AG',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 674', 'CC 679', 'CC 641'],
    notes: "Empiètement sur fonds voisin (CC 674) — CC 674 al. 1 : les constructions empiétant sur un fonds voisin restent propriété du constructeur seulement si celui qui subit l'empiétement a consenti ou s'est opposé tardivement. CC 674 al. 2 : si opposition dans le délai légal (CC 928, action possessoire dans l'année), le propriétaire du fonds peut demander la démolition et la remise en état. CC 641 : le propriétaire peut revendiquer sa chose. Prescription extinctive : la question est distincte selon si on agit en 'dommages-intérêts' (CO 60, 10 ans) ou en 'cessation de l'atteinte' (action réelle, généralement imprescriptible pour l'état du fond). '50 cm sur mon terrain + 3 ans + voisin dit prescrit' sans 'CC 674' ni 'empiètement'. Signal adversarial = voisin qui invoque la prescription alors que l'action en revendication sur un immeuble est en principe imprescriptible.",
  },

  // SUCCESSIONS — rapport de libéralités / bien familial donné verbalement avant décès (CC 626)
  {
    id: 'adv_successions_08',
    query: "Ma grand-mère est décédée le mois dernier. De son vivant elle avait dit à ma tante devant toute la famille qu'elle lui 'donnait' sa bague en or ancienne valant environ 12 000 francs. La bague est au doigt de ma tante depuis 2 ans. Mon père (fils unique de la grand-mère) dit maintenant que la bague doit être rapportée à la succession car sa valeur doit être partagée. Qui a raison ?",
    canton: 'GE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 626', 'CO 242', 'CC 522', 'CC 474'],
    notes: "Rapport de libéralités et donation inter vivos — CO 242 : la donation manuelle (objet mobilier remis de la main à la main) est valide sans forme écrite. Si la bague a effectivement été remise à la tante (tradition) avant le décès, la donation est parfaite et valable. CC 626 al. 1 : les descendants doivent rapporter à la succession les libéralités reçues du défunt, SAUF si le défunt les en a dispensés (expressément ou implicitement). Le contexte familial 'devant tous' peut démontrer une dispense de rapport. CC 522 : si la donation dépasse la quotité disponible, action en réduction possible. CC 474 : quotité disponible = tout le disponible sauf les réserves légales. 'Bague donnée verbalement + remise physiquement + succession veut la récupérer' sans 'CO 242' ni 'donation manuelle' ni 'CC 626'. Signal adversarial = croyance que toute donation avant le décès est forcément annulable par les héritiers.",
  },

  // ÉTRANGERS — cours de langue obligatoire imposé, conséquences pour permis B (LEI 58a, OISA)
  {
    id: 'adv_etrangers_12',
    query: "Voilà 5 ans que j'ai mon permis B. La commune m'a notifié que je dois suivre un cours de français et passer un examen de niveau A2 dans les 8 mois sous peine de ne pas renouveler mon permis. Je travaille à temps plein en équipes décalées et je ne peux pas assister aux cours du soir. Peuvent-ils vraiment me retirer mon permis si j'échoue ou si je ne peux pas y aller ?",
    canton: 'VD',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 58a', 'LEI 62', 'OISA 4', 'LEI 96'],
    notes: "Obligation d'intégration / critères langue — LEI 58a al. 1 : la maîtrise d'une langue nationale est un critère d'intégration pouvant influer sur le renouvellement ou le refus de titre de séjour. OISA 4 : niveau A2 oral requis pour certaines catégories (intégration obligatoire). Mais : LEI 96 al. 1 : l'autorité doit respecter le principe de proportionnalité — un refus de renouvellement pour seul motif de langue est exceptionnel (notamment si travail stable et intégration réelle). Mesure d'accompagnement possible (convention d'intégration, financement partiel des cours). LEI 62 al. 1 : motifs de révocation limitatifs. '5 ans permis B + cours de français A2 + travail décalé + refus possible ?' sans 'LEI 58a' ni 'convention d'intégration'. Signal adversarial = croyance que l'échec à un cours de langue entraîne automatiquement la perte du permis (c'est un facteur parmi d'autres, pas automatique).",
  },

  // WAVE 15 — angles inédits : caution max, résiliation immédiate, prescription courte, voyage enfant, BNA, libre choix spécialiste, fissures chantier, délit de fuite parking, répudiation héritier insolvable, concurrence déloyale ex-employé

  // BAIL — caution dépôt supérieure au maximum légal de 3 mois (CO 257e)
  {
    id: 'adv_bail_18',
    query: "À la signature de mon bail il y a 2 ans, le propriétaire m'a demandé 4 mois de loyer en caution (4 × 1 800 CHF = 7 200 CHF). J'ai payé sans discuter. Un ami m'a dit récemment que la loi limite ça à 3 mois. Est-ce vrai, et puis-je récupérer le mois en trop même après 2 ans ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 257e', 'CO 267a'],
    notes: "Caution maximale — CO 257e al. 2 : la caution en espèces ne peut excéder 3 mois de loyer net. Toute stipulation contraire est nulle (nullité partielle, le surplus est dû au locataire). La restitution du trop-perçu peut être demandée à tout moment (pas de prescription courte), par lettre recommandée au bailleur. '4 mois de caution + signé sans discuter + 2 ans plus tard' sans 'CO 257e' ni 'caution maximum'. Signal adversarial = citoyen croit avoir accepté valablement quelque chose de nul de plein droit.",
  },

  // TRAVAIL — résiliation immédiate pour justes motifs (salaire impayé 2 mois) — CO 337
  {
    id: 'adv_travail_19',
    query: "Mon patron n'a pas versé mon salaire depuis presque 3 mois. Il dit toujours 'la semaine prochaine' et me promet de rattraper. J'en ai marre mais mon contrat dit 3 mois de préavis. Si je pars maintenant sans respecter le préavis, est-ce que je lui dois des indemnités ?",
    canton: 'BE',
    expected_domaine: 'travail',
    expected_any_article: ['CO 337', 'CO 322', 'CO 337c'],
    notes: "Résiliation immédiate pour justes motifs — CO 337 al. 1 : chaque partie peut résilier immédiatement le contrat pour de justes motifs. Le non-paiement répété du salaire constitue un juste motif reconnu par la jurisprudence (ATF 127 III 153). CO 337c : si la résiliation immédiate est fondée, aucune indemnité n'est due à l'employeur ; au contraire, l'employeur doit indemniser le travailleur pour le préjudice subi (salaires dus + dommages). CO 322 al. 1 : l'employeur est tenu de payer le salaire. '3 mois sans salaire + préavis 3 mois + peur des indemnités' sans 'CO 337' ni 'résiliation immédiate'. Signal adversarial = citoyen croit devoir respecter le délai de préavis même face à un employeur défaillant.",
  },

  // DETTES — prescription courte de 5 ans pour loyers et location (CO 128 ch. 1)
  {
    id: 'adv_dettes_16',
    query: "J'ai reçu une lettre d'une agence de recouvrement qui me réclame 6 800 CHF de loyers impayés d'un appartement que j'avais quitté il y a 6 ans et demi. L'agence dit avoir 'racheté' la créance. Est-ce que c'est encore possible de me poursuivre après autant de temps ?",
    canton: 'GE',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 128', 'CO 127', 'CO 142', 'LP 69'],
    notes: "Prescription courte créances de loyer — CO 128 al. 1 ch. 1 : les créances de loyer (et autres périodiques analogues) se prescrivent par 5 ans, et non par 10 ans (CO 127). La prescription court dès l'exigibilité de chaque loyer. Si les derniers loyers datent de 6+ ans, la créance est prescrite. CO 142 : la prescription doit être invoquée par le débiteur (elle n'est pas relevée d'office par le juge). La cession à une agence (CO 164) ne rallonge pas la prescription. '6,5 ans + loyers impayés + agence de recouvrement' sans 'CO 128' ni 'prescription 5 ans'. Signal adversarial = citoyen croit que toutes les dettes se prescrivent en 10 ans (CO 127), ignore la règle spéciale des loyers (CO 128).",
  },

  // FAMILLE — refus de l'autre parent pour un voyage à l'étranger avec l'enfant (CC 301/304)
  {
    id: 'adv_famille_13',
    query: "Je suis séparée et j'ai la garde de mes deux filles de 8 et 11 ans. Je voudrais les emmener en vacances en Espagne cet été. Leur père refuse catégoriquement de me donner une autorisation de voyage. Est-ce qu'il peut vraiment me bloquer ça, et est-ce que j'ai besoin de son accord par écrit pour passer la frontière ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 301', 'CC 296', 'CC 298', 'CPC 343'],
    notes: "Voyages à l'étranger et autorité parentale conjointe — CC 301 al. 3 : pour les actes qui vont au-delà des soins ordinaires (dont les voyages à l'étranger), les deux parents disposant de l'autorité parentale conjointe doivent se consulter et trouver un accord. En cas de désaccord, le parent qui veut voyager peut saisir le juge aux affaires familiales d'une demande d'autorisation urgente (CPC 343). L'autorité de protection de l'enfant peut aussi intervenir. La Police des frontières suisse (et espagnole) peut refuser l'embarquement d'un enfant voyageant avec un seul parent sans document. CC 298 al. 2 : après séparation, autorité parentale conjointe en principe. 'Vacances Espagne + garde + père refuse autorisation' sans 'CC 301' ni 'autorité parentale conjointe'. Signal adversarial = mère croit que la garde seule lui donne le droit de voyager sans l'accord du père.",
  },

  // ASSURANCES — Bureau national d'assurance (BNA) pour accident causé par conducteur non-assuré (LCR 76)
  {
    id: 'adv_assurances_07',
    query: "Je circulais à vélo quand une voiture a grillé un feu rouge et m'a renversé. Le conducteur s'est enfui. La police a retrouvé la plaque : la voiture était volée et le conducteur fuyard n'a pas d'assurance. Mon genou est cassé, j'ai 6 semaines d'arrêt de travail. Comment est-ce que je vais être indemnisé ?",
    canton: 'ZH',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 76', 'LCR 63', 'LCR 65'],
    notes: "Bureau National d'Assurance (BNA) — LCR 76 al. 1 : le BNA (Fonds de garantie / Schweizerischer Nationalfonds) indemnise les victimes d'accidents de la circulation causés par des véhicules non assurés, des véhicules dont le détenteur n'est pas identifié (délit de fuite), ou des véhicules volés. LCR 64 : assurance RC obligatoire pour tous les véhicules automobiles. LCR 65 : en cas d'insolvabilité de l'assureur ou d'absence d'assurance, le BNA intervient en lieu et place. La victime doit annoncer le sinistre directement au BNA (Fonds de garantie, Berne). '4 vélo renversé + fuite + voiture volée + conducteur non-assuré + genou cassé' sans 'LCR 76' ni 'BNA' ni 'fonds de garantie'. Signal adversarial = victime croit ne pas pouvoir être indemnisée si le responsable est inconnu ou non-assuré.",
  },

  // SANTE — libre choix du médecin spécialiste sans référence obligatoire du généraliste (LAMal 41)
  {
    id: 'adv_sante_07',
    query: "Ça fait 8 mois que j'ai des douleurs chroniques au dos. Mon médecin de famille dit que c'est 'musculaire' et refuse de m'envoyer voir un rhumatologue ou un orthopédiste. Je veux un deuxième avis. Est-ce que j'ai le droit de consulter un spécialiste directement sans son accord, et est-ce que ma caisse maladie remboursera ?",
    canton: 'BS',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 41', 'OAMal 36'],
    notes: "Libre choix du prestataire — LAMal 41 al. 1 : l'assuré peut choisir librement son fournisseur de prestations parmi ceux qui sont admis (médecins, hôpitaux, etc.) dans les limites des dispositions légales. En assurance de base ordinaire (modèle standard), il n'existe pas d'obligation de passer par le médecin de famille pour consulter un spécialiste. OAMal 36 : conditions de remboursement des spécialistes admis par les caisses. EXCEPTION : si l'assuré a opté pour un modèle alternatif (médecin de famille obligatoire, HMO, TelFirst), la référence préalable est contractuellement obligatoire et le non-respect peut entraîner une réduction du remboursement. '8 mois douleurs + généraliste refuse référence + veut voir spécialiste' sans 'LAMal 41' ni 'libre choix'. Signal adversarial = citoyen croit avoir besoin d'une ordonnance du généraliste pour consulter tout spécialiste (vrai en modèle alternatif, faux en standard).",
  },

  // VOISINAGE — fissures dans la maison causées par des travaux de fondations du voisin (CC 679)
  {
    id: 'adv_voisinage_10',
    query: "Mon voisin a fait construire une extension de sa maison avec excavation. Depuis la fin des travaux il y a 4 mois, j'ai d'importantes fissures dans mon mur porteur et ma cave présente des infiltrations. Un maçon m'a dit que ça vient probablement des vibrations ou du tassement du terrain. Comment prouver la responsabilité de mon voisin et obtenir réparation ?",
    canton: 'AG',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 679', 'CC 684', 'CO 41'],
    notes: "Responsabilité pour dommages causés par utilisation excessive du fonds — CC 679 al. 1 : si un propriétaire use de son fonds d'une façon qui excède les limites de la propriété ou dépasse ce qui est tolérable, il répond du dommage causé. Il n'est pas nécessaire de prouver une faute : la responsabilité est causale (strict liability). CC 679a (al. 2) : responsabilité en cas de travaux de construction qui affectent les fonds voisins, même en l'absence de faute. Une expertise privée (ou judiciaire CC 679 + CO 58 + CPC 158) peut établir le lien de causalité entre l'excavation et les fissures. CO 41 : action en dommages-intérêts si faute prouvée (cumulable). '4 mois après travaux + fissures mur porteur + infiltrations' sans 'CC 679' ni 'responsabilité dommages voisinage'. Signal adversarial = propriétaire croit devoir prouver une faute du voisin (erreur de travaux), alors que la responsabilité est causale.",
  },

  // CIRCULATION — délit de fuite après accrochage dans un parking privé (LCR 92)
  {
    id: 'adv_circulation_06',
    query: "J'ai maladroitement abîmé la portière d'une voiture garée dans le parking d'un centre commercial en manœuvrant. J'ai paniqué et je suis parti sans laisser de note ni signaler. Le lendemain, j'ai reçu un message de la police : une caméra aurait capturé ma plaque. Qu'est-ce que je risque réellement ?",
    canton: 'ZG',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 92', 'LCR 16a', 'CP 90'],
    notes: "Délit de fuite (omission de signalement après accident) — LCR 92 al. 1 : quiconque, étant impliqué dans un accident de la route, ne s'arrête pas alors qu'il est tenu de le faire commet une infraction. Obligation : en cas d'accident avec dommages matériels, se signaler à la personne lésée ou, si elle est absente, à la police (LCR 51/LCR 92). CP 90 al. 2 : le délit de fuite avec dommages matériels est une contravention (et non un crime) mais entraîne un retrait de permis administratif. LCR 16a : retrait de permis de courte durée pour infraction légère (1 mois minimum). 'Accrochage parking + fuite + caméra police' sans 'LCR 92' ni 'délit de fuite'. Signal adversarial = citoyen pense que les dommages dans un parking privé ne relèvent pas du code de la route.",
  },

  // SUCCESSIONS — répudiation de la succession par un héritier insolvable, créanciers s'y opposent (CC 578)
  {
    id: 'adv_successions_09',
    query: "J'ai des dettes importantes (environ 40 000 CHF de découverts et crédits). Ma tante vient de mourir et je vais hériter environ 70 000 CHF. Mon conseiller financier me dit de 'refuser l'héritage' pour que cet argent ne parte pas directement à mes créanciers. Est-ce que ça marche légalement ?",
    canton: 'ZH',
    expected_domaine: 'successions',
    expected_any_article: ['CC 566', 'CC 578', 'CC 482', 'LP 285'],
    notes: "Répudiation par héritier insolvable — CC 566 al. 1 : tout héritier peut répudier la succession dans un délai de 3 mois. Mais CC 578 al. 1 : si un héritier insolvable répudie, ses créanciers peuvent, dans le même délai, accepter la succession à sa place pour couvrir leurs créances. En clair : la répudiation stratégique ne protège pas les biens de l'héritage contre les créanciers — ceux-ci peuvent exercer l'action en révocation (Pauliana) ou demander l'acceptation forcée. LP 285 : action révocatoire (paulienne) contre les actes du débiteur en préjudice des créanciers. '70k héritage + 40k dettes + veut refuser' sans 'CC 578' ni 'créanciers peuvent accepter à la place'. Signal adversarial = citoyen croit que la répudiation est un bouclier légal contre ses créanciers.",
  },

  // ENTREPRISE — concurrence déloyale par un ex-employé utilisant des listes clients confidentielles (LCD 4/5)
  {
    id: 'adv_entreprise_07',
    query: "Mon ancien directeur commercial est parti il y a 2 mois chez mon concurrent principal. Cette semaine, 4 de mes clients clés m'ont dit qu'il les avait contactés avec des offres reprenant exactement mes tarifs et mes projets en cours. Il avait accès à toute ma base clients confidentielle. Son contrat n'avait pas de clause de non-concurrence. Que puis-je faire ?",
    canton: 'GE',
    expected_domaine: 'entreprise',
    expected_any_article: ['LCD 4', 'LCD 5', 'LCD 9', 'CO 321a'],
    notes: "Concurrence déloyale par détournement de secrets d'affaires — LCD 4 ch. b : agit de façon déloyale celui qui exploite ou qui communique à des tiers le résultat de travail d'un tiers (liste clients), dont il sait ou devrait savoir qu'il lui a été confié dans des circonstances déterminées mais qu'il a obtenu sans son consentement. LCD 5 al. 1 ch. a : est déloyal celui qui reproduit sans autorisation des produits du travail d'autrui dont il ne pourrait normalement prendre connaissance que de manière illégitime. LCD 9 : actions civiles urgentes (mesures provisionnelles, cessation, constatation, dommages-intérêts). CO 321a al. 4 : devoir de fidélité de l'employé — persistance après la fin du contrat pour les secrets acquis pendant l'emploi. MÊME SANS clause de non-concurrence, l'utilisation d'une liste clients confidentiellement acquise est répréhensible. '2 mois parti + concurrent + liste clients confidentielle + pas de clause non-concurrence' sans 'LCD 4' ni 'concurrence déloyale'. Signal adversarial = employeur croit qu'il faut une clause de non-concurrence pour agir (la LCD s'applique indépendamment).",
  },

  // ========== WAVE 16 ==========

  // TRAVAIL — faillite de l'employeur, salaires impayés (CO 219 / LAA 52b / LPP 53a)
  {
    id: 'adv_travail_20',
    query: "Ma boîte vient de faire faillite du jour au lendemain. Je travaille là depuis 4 ans, j'ai 2 mois de salaire en retard, et je ne sais pas si mon patron a versé mes cotisances retraite. Il paraît qu'il y a un 'liquidateur' maintenant. Est-ce que je vais toucher quelque chose, et à qui est-ce que je dois m'adresser ?",
    canton: 'NE',
    expected_domaine: 'travail',
    expected_any_article: ['LP 219', 'CO 337', 'CO 337a', 'LACI 51'],
    notes: "Faillite employeur — salaires impayés et droits du travailleur. LP 219 al. 4 ch. a : les créances des travailleurs issues des 6 derniers mois sont des créances de 1ère classe (privilégiées). LACI 51 : garantie des salaires — l'assurance chômage couvre les salaires impayés si l'employeur est insolvable (délai de carence = les 3 derniers mois avant l'ouverture de la faillite ou la résiliation). CO 337a : résiliation immédiate pour justes motifs si l'employeur ne paie pas le salaire de manière persistante. LPP 53a : en cas de faillite, les avoirs LPP sont protégés (institution supplétive). 'Boîte en faillite + liquidateur + salaires en retard + cotisances LPP manquantes' sans 'LP 219 première classe' ni 'garantie de salaire LACI 51'. Signal adversarial = travailleur croit avoir tout perdu alors que 2 protections existent (créance 1ère classe LP + garantie de salaire AC).",
  },

  // TRAVAIL — certificat de travail refusé ou falsifié (CO 330a)
  {
    id: 'adv_travail_21',
    query: "J'ai quitté mon emploi il y a 3 semaines. Mon ex-patron refuse catégoriquement de me donner un certificat de travail malgré mes relances. Il dit qu'il est trop occupé. J'ai une offre d'emploi chez un autre employeur qui attend ce document. Est-ce que je peux le forcer à me l'émettre, et en combien de temps ?",
    canton: 'SO',
    expected_domaine: 'travail',
    expected_any_article: ['CO 330a', 'CO 330b'],
    notes: "Droit au certificat de travail — CO 330a al. 1 : le travailleur peut en tout temps demander un certificat de travail portant sur la nature et la durée des rapports de travail, ainsi que sur la qualité de son travail et sa conduite. CO 330b : droit à une attestation simple (en cours de rapports de travail). Le délai pour émettre le certificat n'est pas fixé légalement mais doit être raisonnable (quelques jours à 2 semaines selon la jurisprudence). Le refus de délivrer un certificat constitue une violation du contrat : l'employé peut saisir le juge civil (tribunal du travail) en urgence pour obtenir une exécution forcée. 'Certificat refusé + ex-patron occupé + offre emploi en attente' sans 'CO 330a' ni 'certificat de travail obligatoire'. Signal adversarial = travailleur croit que l'employeur peut légalement refuser ou retarder indéfiniment le certificat.",
  },

  // DETTES — commandement de payer, opposition tardive mais mal rédigée (LP 74 al. 1)
  {
    id: 'adv_dettes_17',
    query: "J'ai reçu un commandement de payer de la part d'une société de recouvrement pour une dette que je conteste. J'ai fait opposition le 8ème jour (dans les délais), mais j'ai juste écrit 'je refuse' sur le formulaire et remis ça au facteur. Maintenant la société me dit que mon opposition est nulle parce que mal formulée. C'est vrai ça ?",
    canton: 'FR',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 74', 'LP 67', 'LP 17'],
    notes: "Opposition au commandement de payer — LP 74 al. 1 : le débiteur peut faire opposition totale ou partielle dans les dix jours dès réception du commandement de payer, par déclaration verbale ou écrite à l'office des poursuites. LP 74 al. 2 : l'opposition n'a pas à être motivée — elle n'est soumise à aucune condition de forme particulière. Toute déclaration claire de refus de payer, même sommaire ('je refuse', 'je conteste', 'j'y fais opposition') est valable. La société de recouvrement dit que l'opposition est nulle = affirmation fausse. LP 17 : recours hiérarchique contre l'office des poursuites si celui-ci refuse de traiter l'opposition. 'Opposition faite dans les délais + forme imparfaite + société dit nulle' sans 'LP 74 al. 1 aucune forme' ni 'opposition sans motivation'. Signal adversarial = citoyen croit qu'une opposition doit être motivée juridiquement pour être valable.",
  },

  // FAMILLE — adoption simple d'un adulte par son beau-père (CC 266)
  {
    id: 'adv_famille_14',
    query: "Je suis né hors mariage. Mon beau-père m'a élevé depuis mes 5 ans — je suis maintenant adulte (29 ans). Mon père biologique n'a jamais été là. Mon beau-père et moi souhaitons officialiser notre lien par une adoption. Est-ce que c'est possible en Suisse pour un adulte ? Quel est le lien de parenté avec ma mère après ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 266', 'CC 267', 'CC 268c'],
    notes: "Adoption d'un adulte — CC 266 al. 1 : une personne majeure peut être adoptée si elle a vécu pendant au moins un an au foyer de l'adoptant avant sa majorité. CC 266 al. 2 : l'adoptant doit avoir au moins 16 ans de plus que l'adopté. CC 267 : l'adoption confère à l'adopté la situation juridique d'un enfant né du mariage (nom, nationalité, droits successoraux). CC 268c : le lien de parenté avec la famille de l'adoptant est créé ; le lien avec le père biologique est en principe rompu. En Suisse, l'adoption d'un adulte est possible sous conditions strictes (tribunal cantonal, consentement de toutes les parties). 'Beau-père m'a élevé depuis 5 ans + adulte 29 ans + père biologique absent' sans 'CC 266 adoption adulte' ni 'adoption majorité'. Signal adversarial = citoyen croit que l'adoption n'est possible qu'avec un enfant mineur.",
  },

  // ETRANGERS — regroupement familial pour enfant adulte en situation de handicap (LEI 43 / LEI 44)
  {
    id: 'adv_etrangers_13',
    query: "J'ai le permis C depuis 12 ans. Ma fille de 24 ans vit encore dans mon pays d'origine (Macédoine). Elle a un handicap mental modéré et ne peut pas vivre seule. Elle n'a jamais travaillé. Est-ce que je peux la faire venir en Suisse pour vivre avec moi ? Elle est adulte donc je ne sais pas si le regroupement familial s'applique encore.",
    canton: 'ZH',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 43', 'LEI 44', 'LEI 47', 'OASA 73'],
    notes: "Regroupement familial — enfant adulte dépendant. LEI 43 al. 1 : le conjoint et les enfants célibataires de moins de 18 ans d'un ressortissant étranger titulaire d'une autorisation d'établissement (permis C) ont droit au regroupement familial. Cependant, LEI 44 al. 3 et l'art. 73 OASA permettent le regroupement d'un enfant adulte en cas de dépendance effective et prouvée (handicap ou maladie grave rendant impossible la vie autonome), si la dépendance existait avant la majorité. La jurisprudence du TAF exige : (1) dépendance effective prouvée (certificats médicaux), (2) absence d'alternative dans le pays d'origine, (3) lien de famille prépondérant. 'Fille 24 ans + handicap mental modéré + permis C depuis 12 ans + Macédoine' sans 'LEI 43 exception adulte dépendant' ni 'LEI 44 al. 3'. Signal adversarial = parent croit que le regroupement familial ne s'applique qu'aux enfants mineurs, ignore l'exception pour adultes dépendants.",
  },

  // CIRCULATION — cannabis au volant, test salivaire (LCR 91a / LCR 2)
  {
    id: 'adv_circulation_07',
    query: "J'ai été arrêté à un contrôle de police. Je n'avais pas fumé depuis 3 jours mais le test salivaire était positif au THC. Je n'étais absolument pas sous l'emprise, je me sentais normal. L'agent a dit que ça ne change rien. Qu'est-ce qui m'attend comme sanctions ? Vaut-il la peine de contester ?",
    canton: 'BE',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 91a', 'LCR 16', 'LCR 2', 'OFR 34'],
    notes: "Conduite sous l'influence de stupéfiants — LCR 91a al. 1 : condamnable quiconque conduit un véhicule automobile en état d'incapacité de conduire due aux drogues. OFR 34 (Ordonnance sur les courses de contrôle) et les seuils légaux THC : le droit suisse fixe des valeurs-limite pour le sang (1.5 μg/L THC pour urines) mais c'est la détection par test salivaire + analyse sanguine qui fait foi. Jurisprudence : le Tribunal fédéral a confirmé que même l'imprégnation résiduelle (sans effet actuel) peut être punissable si les valeurs-limite sont dépassées dans le sang. LCR 16 : retrait du permis (minimum 3 mois pour 1ère infraction). LCR 2 al. 2 : définition de la capacité de conduire. La contestation sur l'absence d'effet subjectif est rarement couronnée de succès (valeurs objectives). 'Test positif THC + 3 jours sans fumer + pas sous l'emprise' sans 'LCR 91a' ni 'valeur-limite sanguine'. Signal adversarial = conducteur croit pouvoir conduire légalement après un délai sans consommer, ignore les seuils sanguins objectifs.",
  },

  // SANTE — facture hospitalière contestée, franchise et quote-part (LAMal 64 / LAMal 64a)
  {
    id: 'adv_sante_08',
    query: "J'ai été hospitalisé 5 jours en urgence. La caisse maladie me réclame maintenant 2'300 CHF de 'participation aux coûts'. J'ai payé ma franchise de 300 CHF, mais là ils disent que je dois encore une 'quote-part' de 10% sur les frais restants, plus 15 CHF par jour d'hospitalisation. J'ai l'impression qu'on m'invente des frais. Est-ce légal ?",
    canton: 'TI',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 64', 'OAMal 77', 'OAMal 104'],
    notes: "Participation aux coûts — mécanisme légal à 3 niveaux. LAMal 64 al. 1 : les assurés participent aux coûts des prestations selon un montant annuel de franchise (300–2500 CHF selon le choix). LAMal 64 al. 2 : après la franchise, l'assuré paie une quote-part de 10% des coûts restants jusqu'à concurrence d'un maximum annuel (700 CHF adulte). OAMal 77 : contribution de 15 CHF par jour d'hospitalisation (contribution aux frais d'hôtellerie). OAMal 104 : le décompte annuel cumule franchise + quote-part + contribution hospitalière. Le montant de 2'300 CHF peut être légitime si l'assuré avait une franchise basse (300 CHF) + frais importants + hospitalisé 5 jours × 15 CHF. 'Franchise 300 payée + quote-part 10% + 15 CHF/jour + facture 2300 CHF' sans 'LAMal 64 participation aux coûts' ni 'quote-part légale'. Signal adversarial = assuré croit que la franchise couvre toute sa participation et ignore la quote-part et la contribution hospitalière.",
  },

  // VOISINAGE — passage de câbles et canalisations sur un fonds voisin (CC 695)
  {
    id: 'adv_voisinage_11',
    query: "Mon voisin veut faire passer des câbles de fibre optique dans mon jardin pour raccorder sa maison au réseau. Il dit que de toute façon la commune peut l'obliger à passer par chez moi. Mon jardin est petit et ça va abîmer mes massifs de fleurs. Est-ce qu'il peut me forcer à accepter ce passage ?",
    canton: 'SG',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 695', 'CC 694', 'CC 691'],
    notes: "Passage de conduites et câbles sur un fonds voisin — CC 695 : tout propriétaire est tenu de souffrir la pose et le passage de conduites et de canalisations nécessaires aux besoins d'autres fonds situés dans le voisinage (eau, gaz, électricité, etc.) contre pleine indemnité. Le passage de la fibre optique n'est pas explicitement mentionné dans CC 695 mais la jurisprudence et l'art. 695 al. 1 l'étendent aux conduites de télécommunication (lignes téléphoniques, câbles). La servitude est inscrite au registre foncier. CC 694 : passage nécessaire pour enclave — si la propriété ne peut être accessible autrement. CC 691 : servitudes légales en général. Condition : nécessité réelle + indemnisation équitable. 'Câbles fibre optique + jardin voisin + dommages massifs fleurs + commune peut forcer' sans 'CC 695 conduites' ni 'servitude légale'. Signal adversarial = voisin croit pouvoir imposer un passage sans compensation ni procédure formelle.",
  },

  // SUCCESSIONS — action en partage forcée contre un cohéritier récalcitrant (CC 604 / CC 650)
  {
    id: 'adv_successions_10',
    query: "Notre grand-mère est décédée il y a 6 ans. On est 4 héritiers. Mon oncle bloque la vente de la maison depuis des années — il dit qu'il veut la garder mais ne peut pas racheter les parts des autres. On est coincés, on ne peut ni vendre ni récupérer notre argent. Y a-t-il quelque chose qu'on peut faire légalement pour débloquer cette situation ?",
    canton: 'JU',
    expected_domaine: 'successions',
    expected_any_article: ['CC 604', 'CC 610', 'CC 651'],
    notes: "Action en partage — CC 604 al. 1 : tout héritier peut à tout moment demander le partage de la succession (droit imprescriptible). CC 610 : si les héritiers ne peuvent se mettre d'accord sur le mode de partage, chaque héritier peut demander au juge de procéder à la licitation (vente aux enchères publiques) ou au partage en nature selon estimation. CC 651 al. 1 : si la chose est indivisible ou ne peut être partagée sans une notable diminution de valeur, le juge peut ordonner la vente aux enchères publiques ou l'attribution à l'un des héritiers avec indemnisation des autres. Le délai de prescription ne court pas pour l'action en partage (CC 604 — droit perpétuel). '6 ans bloqué + 4 héritiers + oncle refuse vente + ne peut pas racheter' sans 'CC 604 action en partage' ni 'licitation judiciaire'. Signal adversarial = cohéritiers croient qu'un héritier seul peut bloquer indéfiniment la vente ou le partage.",
  },

  // BAIL — résiliation par le bailleur pour besoin du conjoint, locataire refuse de partir (CO 261a)
  {
    id: 'adv_bail_19',
    query: "Mon propriétaire vient de vendre l'appartement que j'occupe depuis 8 ans. Le nouvel acquéreur me demande de partir dans 3 mois pour que sa fille puisse s'y installer. J'ai refusé. Mon propriétaire initial dit que la vente change tout et que je n'ai plus les mêmes droits. Est-ce vrai, ou est-ce que mon bail continue ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 261', 'CO 261a', 'CO 272'],
    notes: "Vente de l'immeuble et transfert du bail — CO 261 al. 1 : en cas d'aliénation de la chose louée, le bail passe au nouvel acquéreur (subrogation légale). Le locataire n'a pas à accepter ni à signer un nouveau contrat. CO 261 al. 2 : le nouvel acquéreur peut résilier le bail pour besoin urgent et personnel (lui-même ou sa famille proche) au plus tôt à la fin d'une période de bail, après un préavis légal. CO 261a : malgré la résiliation pour besoin urgent, le locataire peut exiger la prolongation du bail si les conditions légales sont remplies (CO 272 : intérêts prépondérants du locataire vs bailleur). La résiliation pour besoin urgent post-vente doit respecter les délais légaux (comme tout congé ordinaire) et peut être contestée devant l'autorité de conciliation. '3 mois délai + vente appartement + fille nouvel acquéreur + 8 ans d'ancienneté' sans 'CO 261 transfert bail' ni 'bail passe à l'acquéreur'. Signal adversarial = locataire croit que la vente de l'immeuble résilie automatiquement son bail ou réduit ses droits.",
  },

  // ─── WAVE 17 — 2026-06-19 ──────────────────────────────────────────────────

  // BAIL — restitution appartement, bailleur retient caution pour peinture jaunie (CO 267a usure normale)
  {
    id: 'adv_bail_20',
    query: "J'ai habité 11 ans dans mon appartement et je viens de le rendre. La gérance me retient 2'400 CHF sur ma caution de 2'600 CHF pour refaire toute la peinture. Je n'ai causé aucun dégât — les murs avaient juste un peu jauni avec les années. Est-ce que la gérance peut vraiment tout me facturer pour une peinture qui était là depuis 11 ans ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 267', 'CO 267a', 'CO 257e'],
    notes: "Restitution du logement et usure normale — CO 267a : le locataire répond des dommages résultant de sa faute mais non de l'usure due à un usage conforme au contrat. Les peintures ont une durée de vie standard (8-12 ans selon les recommandations SIA), au-delà de laquelle le remplacement est à charge du bailleur. CO 267 : état de la chose louée à restitution. CO 257e : délais pour l'état des lieux de sortie. '11 ans + peinture jaunie + 2400 CHF + pas de dégâts' sans 'CO 267a usure normale' ni 'durée de vie installations'. Signal adversarial = locataire croit intuitivement avoir raison mais ne connaît pas le mécanisme légal de l'usure normale ni la table de durée de vie.",
  },

  // TRAVAIL — licenciement pendant arrêt maladie prolongé, protection CO 336c (dépression 18 mois)
  {
    id: 'adv_travail_22',
    query: "Je suis en arrêt maladie depuis 18 mois pour une dépression sévère. Mon employeur vient de me licencier par courrier recommandé avec un préavis de 2 mois. Pourtant j'ai un contrat à durée indéterminée depuis 5 ans. Mon médecin dit que je serai encore incapable de travailler pendant 6 mois. Le licenciement est-il valide ou est-ce qu'il y a quelque chose qui me protège ?",
    canton: 'BE',
    expected_domaine: 'travail',
    expected_any_article: ['CO 336c', 'CO 336', 'CO 336a'],
    notes: "Protection contre le licenciement en temps inopportun — CO 336c al. 1 let. b : après le temps d'essai, l'employeur ne peut résilier le contrat pendant une incapacité de travail totale ou partielle résultant d'une maladie ou d'un accident non imputables à sa faute, pendant les délais suivants : jusqu'à 30 jours la 1ère année, jusqu'à 90 jours de la 2e à la 5e année, jusqu'à 180 jours dès la 6e année de service. CO 336c al. 2 : la résiliation donnée pendant ce délai est nulle. Mais après 5 ans (pas encore 6) → protection 90 jours, et 18 mois > 90 jours → la résiliation est VALIDE si donnée après le délai de protection expiré. '18 mois dépression + CDI 5 ans + licencié' sans 'CO 336c délai de protection' ni 'temps inopportun'. Signal adversarial = locataire croit que la maladie protège indéfiniment du licenciement.",
  },

  // FISCAL — indépendant, déduction bureau à domicile et matériel informatique (LIFD 27/33)
  {
    id: 'adv_fiscal_04',
    query: "Je suis graphiste indépendant depuis 3 ans. Je travaille depuis chez moi, j'ai une pièce de 22m² dédiée à mon activité professionnelle sur un appartement de 90m² total. J'ai aussi acheté un MacBook Pro à 3'500 CHF et un écran à 900 CHF. Mon comptable me dit que 'le fisc refuse souvent le bureau à domicile'. Est-ce que je peux quand même déduire ces frais ?",
    canton: 'ZH',
    expected_domaine: 'fiscal',
    expected_any_article: ['LIFD 27', 'LIFD 33', 'LIFD 29'],
    notes: "Déductions frais professionnels pour indépendant — LIFD 27 al. 1 : les frais justifiés par l'usage commercial sont déductibles (matériel professionnel exclusif, bureau). LIFD 33 : frais généraux d'acquisition du revenu pour salariés (moins pertinent ici). Pour un indépendant, le bureau à domicile est déductible si la pièce est réservée exclusivement à l'usage professionnel (prorata surface). LIFD 29 : la déduction porte sur les frais exposés pour l'acquisition du revenu. '22m² bureau chez soi + graphiste indépendant + MacBook professionnel + fisc refuse' sans 'LIFD 27' ni 'frais professionnels indépendant'. Signal adversarial = blind spot fiscal JPT (domaine beta non couvert) ; le citoyen confond aussi les règles salarié vs indépendant.",
  },

  // ASSURANCES — rechute après accident SUVA, assureur qualifie de 'nouvelle maladie' (LAA 21 révision)
  {
    id: 'adv_assurances_09',
    query: "Il y a 3 ans j'ai eu un accident de travail au dos. La SUVA a pris en charge le traitement et a clôturé mon dossier il y a 18 mois en disant que j'étais guéri. Depuis 4 mois j'ai des douleurs chroniques qui reviennent, mon médecin est sûr que c'est lié à l'accident. La SUVA refuse de rouvrir le dossier et dit que c'est une 'nouvelle affection non assurée'. Comment puis-je contester ?",
    canton: 'LU',
    expected_domaine: 'assurances',
    expected_any_article: ['LAA 21', 'LPGA 17', 'LPGA 52', 'LPGA 61'],
    notes: "Révision de rente/prestation après rechute — LAA 21 : si l'état de santé de l'assuré se modifie notablement après fixation de la rente, celle-ci est révisée. LPGA 17 : révision de la rente d'invalidité si le taux d'invalidité change de manière notable. LPGA 52 : opposition à la décision de la SUVA dans les 30 jours. LPGA 61 : recours au tribunal cantonal des assurances sociales. 'SUVA clôturée + rechute + nouvelle maladie refusée' sans 'LAA 21 révision' ni 'opposition LPGA 52'. Signal adversarial = citoyen ignore la distinction accident-rechute et le droit à revision de prestation ; confond 'clôture' avec 'fin définitive'.",
  },

  // FAMILLE — désaveu de paternité, test ADN révèle que le mari n'est pas le père (CC 255/256)
  {
    id: 'adv_famille_15',
    query: "Ma femme et moi sommes en séparation de fait depuis 2 ans mais pas encore divorcés. Elle a eu un bébé il y a 8 mois. J'ai longtemps cru être le père mais un test ADN qu'on a fait ensemble confirme que je ne suis pas le père biologique. Est-ce que je suis automatiquement considéré comme le père légal ? Est-ce que je serai obligé de payer une pension pour cet enfant ?",
    canton: 'SG',
    expected_domaine: 'famille',
    expected_any_article: ['CC 255', 'CC 256', 'CC 260a', 'CC 261'],
    notes: "Désaveu de paternité — CC 255 al. 1 : le mari est présumé père de l'enfant né pendant le mariage ou dans les 300 jours qui suivent la dissolution du mariage. CC 256 al. 1 : le mari peut intenter action en désaveu dans le délai d'un an à compter du jour où il a connu la naissance et su qu'il n'en était pas le père ; une tardivité du délai ne se répare pas. CC 260a : reconnaissance volontaire de paternité possible par le tiers. CC 261 : action en constatation de la paternité. 'Test ADN + séparation 2 ans + présumé père légal + pension' sans 'CC 255 présomption paternité' ni 'délai 1 an action désaveu'. Signal adversarial = père biologiquement exclu mais légalement présumé ; risque de dépasser le délai péremptoire d'1 an.",
  },

  // DETTES — action en révocation (paulienne) contre donation faite avant jugement (LP 285/286)
  {
    id: 'adv_dettes_18',
    query: "Mon ex-associé nous doit 50'000 CHF suite à un jugement civil obtenu l'an dernier. On a lancé des poursuites mais il n'a aucun bien saisissable. On a découvert qu'il a donné sa moto d'occasion (estimée à 18'000 CHF) à son frère exactement 2 mois avant que le jugement soit rendu. Son frère l'a revendue depuis. Est-ce qu'on peut faire quelque chose pour récupérer au moins une partie de notre dû ?",
    canton: 'ZH',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 285', 'LP 286', 'LP 288', 'LP 289'],
    notes: "Action révocatoire (paulienne) — LP 285 al. 1 : sont révocables les actes accomplis par le débiteur dans les 5 ans avant la saisie ou la faillite qui ont diminué son actif ou augmenté son passif, s'il en résulte un préjudice pour les créanciers. LP 286 : révocabilité des libéralités dans les 2 ans précédant la saisie. LP 288 : responsabilité du tiers acquéreur de bonne foi. LP 289 : délai de 2 ans pour intenter l'action en révocation. 'Don moto + 2 mois avant jugement + frère + bien revendu' sans 'LP 285 action révocatoire' ni 'paulienne'. Signal adversarial = créancier ne sait pas qu'une donation faite avant la procédure peut être annulée ; ignore aussi que la revente du bien crée une action en valeur.",
  },

  // ETRANGERS — frontalier allemand permis G, changer d'employeur pendant chômage (ALCP / LEI 35)
  {
    id: 'adv_etrangers_14',
    query: "Je suis allemand et je travaille en Suisse depuis 8 ans avec un permis frontalier G. Mon employeur va licencier 30 personnes et je suis dans la liste. Un autre employeur suisse m'a proposé un poste mais dans un autre canton (je passe de Zurich à Lucerne). Est-ce que je peux changer d'emploi et de canton avec mon permis G ? Et si je me retrouve au chômage entre les deux postes, est-ce que j'ai droit aux indemnités suisses ?",
    canton: 'ZH',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 35', 'ALCP 6', 'OASA 6', 'LEI 61'],
    notes: "Permis frontalier G et mobilité professionnelle — ALCP art. 6 : les frontaliers UE/AELE disposent du libre accès au marché suisse du travail (mobilité géographique dans les régions frontalières). Après 5 ans, la restriction géographique de la 'région frontalière' est levée → libre accès sur tout le territoire suisse. LEI 35 : permis G frontalier, renouvellement automatique si emploi suisse maintenu. OASA 6 : frontalier autorisé à travailler dans tout le canton précisé sur le permis. En cas de chômage : LACI 8 + ALCP → droit aux indemnités suisses si domicile habituel en CH ou en cas d'application de l'accord bilatéral. '8 ans permis G + changer canton + chômage intermittent' sans 'ALCP libre accès' ni 'LEI 35'. Signal adversarial = frontalier croit que son permis est lié à un employeur et un canton spécifiques.",
  },

  // CONSOMMATION — abonnement fitness contracté sur tablette, résiliation bloquée par clause auto-renouvellement
  {
    id: 'adv_consommation_07',
    query: "J'ai signé un abonnement de fitness annuel en 2022 sur une tablette dans la salle. Le contrat s'est renouvelé automatiquement en 2023 et 2024 sans que je reçoive aucun préavis. Maintenant je veux partir mais ils me disent qu'il fallait résilier 3 mois avant l'échéance annuelle, et que sinon je dois payer encore 12 mois. La clause est en petits caractères au dos du contrat. Ai-je un recours ?",
    canton: 'GE',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 8', 'LCD 8', 'CO 40a', 'CO 256'],
    notes: "Clauses abusives dans un contrat de consommation — LCD 8 : est déloyal quiconque, en utilisant des conditions commerciales générales, prévoit une disproportion notable et injustifiée entre les droits et les obligations. CO 8 al. 2 : les clauses de tacite reconduction dans les CCG doivent être expressément signalées. CO 40a (démarchage) : révocation possible dans les 14 jours si contrat signé hors établissement ou à distance (mais ici en magasin = limite du droit de révocation). '3 mois préavis + renouvellement auto + petits caractères + tablette' sans 'LCD 8 clauses abusives' ni 'tacite reconduction'. Signal adversarial = consommateur ignore que les clauses de reconduction auto peuvent être abusives et contestables.",
  },

  // ASSURANCES — sinistre déclaré tardivement à l'assurance ménage (LCA 38 délai de déclaration)
  {
    id: 'adv_assurances_10',
    query: "En janvier j'ai eu une infiltration d'eau dans ma cave sans m'en rendre compte (canalisations derrière le mur). En juin j'ai découvert que tout était moisi — mobilier, vêtements, archives. J'ai déclaré le sinistre à mon assurance ménage en juin. Ils refusent de rembourser parce que le sinistre 'n'a pas été annoncé dans les délais contractuels de 5 jours'. Pourtant c'était invisible ! Ont-ils raison ?",
    canton: 'AG',
    expected_domaine: 'assurances',
    expected_any_article: ['LCA 38', 'LCA 39', 'LCA 33', 'LCA 40'],
    notes: "Délai de déclaration de sinistre et force majeure — LCA 38 al. 1 : l'ayant droit doit, dès qu'il a connaissance du sinistre, en aviser l'assureur. Le délai court non depuis le sinistre lui-même mais depuis la DÉCOUVERTE par l'assuré. LCA 39 : l'assureur ne peut se libérer qu'en prouvant que le retard a causé un préjudice à ses intérêts. LCA 33 : couverture des dommages aux biens assurés (eau). LCA 40 : exclusion de garantie en cas de réticence ou fraude, pas pour simple retard de déclaration bonne foi. 'Infiltration invisible + découverte 5 mois après + délai 5 jours non respecté' sans 'LCA 38 connaissance du sinistre' ni 'délai depuis découverte'. Signal adversarial = assuré croit avoir définitivement perdu son droit car 'délai dépassé', ignore que le délai court depuis la découverte et non l'événement.",
  },

  // VOISINAGE — haie mitoyenne taillée unilatéralement par le voisin sans accord (CC 697 / CC 671)
  {
    id: 'adv_voisinage_12',
    query: "Mon voisin et moi avons une haie de thuyas de 3 mètres plantée exactement sur la limite entre nos jardins. La semaine dernière, pendant que j'étais en vacances, mon voisin a coupé 'son côté' à 80 cm de haut sans me demander quoi que ce soit. Maintenant la haie est asymétrique et ses arbres n'ont plus aucune feuille côté lui. Il dit que 'la moitié lui appartient donc il fait ce qu'il veut'. A-t-il le droit ?",
    canton: 'VD',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 697', 'CC 671', 'CC 684', 'CC 666'],
    notes: "Haie mitoyenne et copropriété forcée — CC 671 al. 1 : les plantations sur la limite sont présumées mitoyennes. CC 697 : le propriétaire peut couper les branches qui empiètent sur son fonds, mais d'une haie mitoyenne (appartenant aux deux voisins par moitié), toute modification substantielle requiert l'accord de l'autre copropriétaire (règles de la copropriété). CC 684 al. 1 : nuisances excessives des fonds voisins. CC 666 : disposition des parties communes (copropriété). La coupe unilatérale de la haie mitoyenne à 80cm sans accord peut constituer une modification substantielle illicite donnant lieu à dommages-intérêts. 'Haie sur limite + voisin coupe son côté + asymétrique + pendant vacances' sans 'CC 671 haie mitoyenne' ni 'copropriété accord requis'. Signal adversarial = voisin invoque à tort le droit de propriété sur 'sa moitié' sans respecter les règles de la copropriété mitoyenne.",
  },

  // ========== WAVE 18 — angles inédits (180 → 190 cas) ==========

  // ACCIDENT — guide de montagne fautif, passage rocheux non sécurisé (CO 41 / CO 97)
  {
    id: 'adv_accident_06',
    query: "J'ai fait une randonnée guidée dans les Alpes bernoises cet été. Le guide nous a emmenés sur un passage rocheux sans nous prévenir du danger, j'ai glissé et je me suis fracturé le poignet. L'association de guides dit que 'la montagne comporte toujours des risques' et qu'ils ne sont pas responsables. J'ai une assurance accident qui couvre mes soins mais pas mes 3 semaines de perte de salaire. Est-ce que j'ai un recours contre le guide ?",
    canton: 'BE',
    expected_domaine: 'accident',
    expected_any_article: ['CO 41', 'CO 97', 'CO 101', 'CO 394'],
    notes: "Responsabilité guide de montagne — CO 41 : responsabilité délictuelle (faute prouvée si risque non signalé). CO 97 : responsabilité contractuelle du mandataire (CO 394 : contrat de guidage = mandat, le guide doit apporter tous les soins nécessaires). CO 101 : responsabilité pour les auxiliaires. La clause 'risques inhérents à la montagne' ne couvre pas la faute professionnelle. '3 semaines perte salaire + guide + passage rocheux + non prévenu' sans 'CO 41 faute' ni 'CO 97 responsabilité contractuelle'. Signal adversarial = citoyen croit que la montagne = toujours risque personnel, ignore la faute professionnelle du guide (mandat CO 394 et obligation de sécurité).",
  },

  // BAIL — résiliation CO 257d, paiement tardif après délai comminatoire (CO 273)
  {
    id: 'adv_bail_21',
    query: "Mon bailleur m'a envoyé une résiliation de bail pour loyers impayés. Il dit qu'il m'avait donné 30 jours pour payer et que ce délai était dépassé. J'ai payé tout ce que je devais 3 jours après avoir reçu la résiliation. Il dit que c'est trop tard, que le bail est résilié et que je dois partir dans 2 mois. J'ai ma famille ici. Est-ce qu'il y a encore quelque chose à faire ?",
    canton: 'VS',
    expected_domaine: 'bail',
    expected_any_article: ['CO 257d', 'CO 273', 'CO 271', 'CO 271a'],
    notes: "Résiliation pour loyers impayés et contestation — CO 257d al. 1 : le délai comminatoire de 30 jours doit être pleinement écoulé avant que la résiliation ne soit valable. Si le délai est expiré au moment de la résiliation, le paiement postérieur ne la rend pas nulle. CO 273 al. 1 : toute résiliation peut être contestée devant l'autorité de conciliation dans les 30 jours. CO 271 : la résiliation est annulable si elle contrevient aux règles de la bonne foi (mais ici elle est a priori légitime). 'Payé 3 jours après résiliation + famille + 2 mois pour partir' sans 'CO 273 contestation' ni 'autorité de conciliation'. Signal adversarial = locataire croit que payer rétroactivement suffit à annuler la résiliation ; ignore qu'il peut quand même contester la résiliation (abus de droit si conditions strictes pas remplies) dans les 30 jours.",
  },

  // TRAVAIL — retour congé maternité à temps partiel, refus employeur (CO 336c / LEg 3)
  {
    id: 'adv_travail_23',
    query: "Je reviens de mon congé maternité et j'ai demandé à mon patron de passer à 70% pour m'occuper de mon bébé le vendredi. Mon contrat dit '100% temps plein'. Il a refusé en disant que le poste est défini à 100% et que si je ne reprends pas à 100% il devra 'envisager d'autres solutions'. Est-ce qu'il peut me forcer à reprendre à 100% ou me licencier si je refuse ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 336c', 'LEg 3', 'LEg 6', 'CO 328'],
    notes: "Protection maternité et discrimination — CO 336c al. 1 let. c : résiliation interdite pendant les 16 semaines suivant l'accouchement. LEg 3 : interdiction de discrimination à raison du sexe, directe ou indirecte ; la maternité et les responsabilités familiales sont des critères protégés. LEg 6 : si discrimination rendue vraisemblable, la charge de la preuve est renversée. L'employeur n'est pas obligé d'accorder un temps partiel non contractuel, mais un licenciement motivé par la maternité/responsabilités familiales est discriminatoire. '70% pour bébé + refus + menace licenciement + congé maternité' sans 'CO 336c protection' ni 'LEg discrimination'. Signal adversarial = mère croit qu'elle n'a aucun droit si son contrat dit 100%.",
  },

  // DETTES — commandement de payer non retiré au bureau de poste, notification fictive (LP 66 / LP 74)
  {
    id: 'adv_dettes_19',
    query: "J'ai trouvé un avis de passage du facteur dans ma boîte aux lettres pendant que j'étais en vacances 2 semaines. En rentrant, j'ai vu que le recommandé était retourné à l'expéditeur. J'apprends que c'était un commandement de payer de 15'000 CHF. Une société de recouvrement me dit que le délai d'opposition de 10 jours est dépassé et que le commandement est maintenant exécutoire. Est-ce vrai ?",
    canton: 'TI',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 66', 'LP 74', 'LP 78', 'LP 64'],
    notes: "Notification fictive LP — LP 66 al. 4 : si un recommandé n'est pas retiré, il est réputé notifié le 7e jour suivant le dépôt de l'avis (fiction légale, ATF 138 III 225). LP 74 al. 1 : l'opposition doit être formée dans les 10 jours après la notification. LP 78 al. 1 : restitution du délai possible si le requérant n'est pas en faute (ex. absence non anticipée, hospitalisation — mais les vacances planifiées = faute). '2 semaines vacances + recommandé non retiré + retourné expéditeur + délai 10 jours dépassé' sans 'LP 66 notification fictive 7e jour' ni 'LP 78 restitution délai'. Signal adversarial = citoyen croit que le recommandé non retiré = non reçu = délai non couru.",
  },

  // SUCCESSIONS — réserve héréditaire violée par testament, enfants du premier mariage (CC 470 / CC 519)
  {
    id: 'adv_successions_11',
    query: "Mon père est décédé et laisse un testament notarié léguant tout à sa deuxième femme. Ma sœur et moi (enfants du premier mariage) ne recevons rien. Le notaire dit que le testament est valide et exécutoire. On pense que notre belle-mère avait une énorme influence sur papa qui était malade en fin de vie. Est-ce qu'on peut vraiment tout perdre ?",
    canton: 'FR',
    expected_domaine: 'successions',
    expected_any_article: ['CC 470', 'CC 471', 'CC 519', 'CC 522'],
    notes: "Réserve héréditaire et action en réduction — CC 470 al. 1 : les descendants ont une réserve héréditaire (révision 2023 : 1/2 de leur part légale). CC 471 : part légale d'un enfant. CC 519 al. 1 ch. 1 : les dispositions pour cause de mort sont annulables si le testateur n'était pas capable de disposer. CC 522 : les dispositions qui empiètent sur la réserve sont réductibles (action en réduction, délai 1 an depuis connaissance). 'Tout à la belle-mère + rien pour nous + notaire dit valide + influence' sans 'CC 470 réserve' ni 'action en réduction'. Signal adversarial = enfants croient que testament notarié = définitif et intouchable.",
  },

  // VIOLENCE — stalking physique et messages ex-petit ami, sans violence physique (CC 28b / CPC 265)
  {
    id: 'adv_violence_09',
    query: "Mon ex-petit ami me suit partout depuis 4 mois — il attend devant chez moi le soir, me suit dans les magasins, m'envoie 20-30 messages par jour en changeant de numéro chaque fois que je le bloque. Je n'ai jamais été physiquement blessée mais je vis dans la peur. La police m'a dit qu'ils ne peuvent rien faire 'sans violence physique'. Que puis-je faire ?",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CC 28b', 'CC 28', 'CPC 265', 'CP 286'],
    notes: "Stalking / harcèlement obsessionnel — CC 28b (en vigueur depuis 2022) : protection contre la violence, les menaces ou le harcèlement ; le tribunal peut ordonner des interdictions d'approcher, de prendre contact et d'accéder à des zones déterminées. CPC 265 : mesures provisionnelles d'urgence (interdiction d'approcher, délai très court). CP 286 : empêchement d'accomplir un acte officiel si injonction ordonnée. La police se trompe : CC 28b protège sans violence physique. '20-30 messages + suit dans magasins + attend devant chez moi + change numéro + peur + pas de coups' sans 'CC 28b harcèlement' ni 'interdiction approcher'. Signal adversarial = victime croit que sans coups physiques il n'existe aucun recours légal.",
  },

  // ASSURANCES — demande AI pour burnout, franchise 365 jours (LAI 29)
  {
    id: 'adv_social_09',
    query: "Je suis en arrêt de travail depuis 14 mois à cause d'un burnout sévère diagnostiqué dépression majeure par mon psychiatre. Mon employeur arrête de me payer le mois prochain. Mon médecin me dit de déposer une demande AI. Comment ça fonctionne et combien de temps avant de recevoir quelque chose ?",
    canton: 'NE',
    expected_domaine: 'assurances',
    expected_any_article: ['LAI 29', 'LAI 6', 'LAI 28', 'LPGA 52'],
    notes: "Demande AI — burnout et délais — LAI 29 al. 1 : la rente AI prend naissance au plus tôt 6 mois après que la personne a fait valoir son droit. LAI 29 al. 3 : une incapacité de travail ininterrompue de 365 jours minimum est requise (franchise) avant que le droit à la rente ne naisse. LAI 28 al. 1 : droit à une rente entière si incapacité de gain ≥ 70%. '14 mois arrêt + burnout + dépression + combien de temps + employeur arrête de payer' sans 'LAI 29 franchise 365 jours' ni 'délai 6 mois après demande'. Signal adversarial = personne croit que sa demande AI sera traitée rapidement et génère un revenu immédiat.",
  },

  // ENTREPRISE — révocation gérant Sàrl sans convocation, confusion mandat/contrat travail (CO 810)
  {
    id: 'adv_entreprise_08',
    query: "J'ai fondé une Sàrl avec deux associés il y a 6 ans. Je suis le gérant à plein temps avec un salaire. La semaine dernière mes deux autres associés ont voté ma révocation lors d'une assemblée à laquelle ils ne m'ont pas invité. Ils disent que c'est légal car ils ont 60% des parts et veulent que je parte immédiatement. Est-ce qu'ils peuvent faire ça ?",
    canton: 'GE',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 810', 'CO 808a', 'CO 803', 'CO 335'],
    notes: "Révocation gérant Sàrl — CO 810 al. 2 : l'assemblée des associés peut révoquer les gérants en tout temps, avec ou sans justes motifs. CO 803 : droit à la convocation (décision sans convocation valable peut être contestée via CO 808a). Le gérant révoqué comme organe conserve ses droits de salarié (CO 335 : contrat de travail distinct du mandat d'organe). La révocation prend effet immédiatement mais le licenciement comme salarié est soumis aux délais légaux. '6 ans + gérant + pas invité + révocation immédiate + 60% parts' sans 'CO 810 révocabilité gérant' ni 'mandat vs contrat de travail'. Signal adversarial = fondateur-gérant confond révocation du mandat d'organe (immédiate, légale) avec licenciement comme employé (soumis aux délais légaux).",
  },

  // VOISINAGE — drone voisin filmant régulièrement jardin et terrasse (LPD 30 / CC 28)
  {
    id: 'adv_voisinage_13',
    query: "Mon voisin utilise un drone presque tous les week-ends et survole régulièrement mon jardin et ma terrasse. J'ai clairement vu qu'il filmait notre barbecue en famille avec nos enfants. Il dit que 'l'espace aérien est libre' et qu'il peut voler où il veut. Est-ce qu'il a le droit de me filmer dans mon jardin ?",
    canton: 'AG',
    expected_domaine: 'voisinage',
    expected_any_article: ['LPD 30', 'CC 28', 'CC 684', 'CC 679'],
    notes: "Drone et protection vie privée / nuisances voisinage — LPD 30 (nLPD en vigueur sept. 2023) : la prise de vue de personnes dans leur espace privé sans consentement est une violation de la loi sur la protection des données. CC 28 : protection de la personnalité ; filmer le jardin privé sans consentement = atteinte illicite. CC 684 : nuisances excessives des fonds voisins (bruit drone + survol répété). L'argument 'espace aérien libre' ne tient pas face à la LPD et au CC 28. 'Drone + survol jardin + filme barbecue + enfants + espace aérien libre' sans 'LPD protection image' ni 'CC 28 personnalité'. Signal adversarial = propriétaire drone confond liberté de voler avec droit de filmer des personnes sur leur propriété.",
  },

  // CONSOMMATION — défaut révélé dans les 6 mois, renversement charge de la preuve (CO 197 / CO 210)
  {
    id: 'adv_consommation_08',
    query: "J'ai acheté un téléviseur il y a 4 mois et demi pour 980 CHF. Depuis 3 semaines l'écran a des bandes verticales de couleur. Le vendeur dit que c'est un 'choc physique de ma faute' même si je n'en ai eu aucun. Il refuse la garantie et me dit que c'est à moi de prouver que c'était leur faute. Est-ce vrai que c'est à moi de prouver ?",
    canton: 'SG',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 197', 'CO 210', 'CO 205', 'CO 208'],
    notes: "Garantie légale et renversement charge de preuve — CO 197 al. 1 : le vendeur répond des défauts qui diminuent la valeur de la chose. CO 210 al. 1 : délai de 2 ans depuis la délivrance pour agir en garantie. Principe jurisprudentiel (ATF 130 III 564) : si le défaut se manifeste dans les 6 mois suivant l'achat, on présume qu'il existait lors de la délivrance — c'est au vendeur de prouver que le défaut est postérieur. CO 205/208 : résolution ou réduction du prix possible. '4 mois + bandes couleur + choc physique prétendu + à moi de prouver' sans 'CO 197 garantie' ni 'présomption défaut 6 mois'. Signal adversarial = consommateur croit devoir prouver la faute du vendeur ; ignore que dans les 6 mois c'est le vendeur qui doit prouver.",
  },

  // ===== WAVE 19 — angles inédits : tacite reconduction, prime variable, prêt oral, concubinage pension, cas de rigueur, décompte LAMal, vol vélo assurance ménage, refus éthylomètre, impôt anticipé, succession raison individuelle =====

  // BAIL — bail à durée indéterminée reconduit depuis 20 ans, résiliation par lettre simple non valable (CO 266a / CO 266l / CO 267)
  {
    id: 'adv_bail_22',
    query: "J'habite dans cet appartement depuis 20 ans, j'ai signé un contrat en 2004 et depuis on n'a jamais refait de papier. La semaine dernière le proprio m'a envoyé un simple email en disant qu'il voulait récupérer son bien dans 3 mois pour sa fille. Est-ce qu'il peut vraiment faire ça par email avec seulement 3 mois ? Et est-ce que 20 ans sans nouveau contrat c'est légal ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 266a', 'CO 266l', 'CO 271', 'CO 267'],
    notes: "Bail à durée indéterminée (CO 266a : congé 3 mois pour fin de trimestre, formule officielle cantonale obligatoire CO 266l) vs résiliation par email sans formule. CO 271 : résiliation pour besoin propre doit respecter les formes. Signal adversarial = locataire confond durée du bail (peut se poursuivre indéfiniment par tacite reconduction = légal) avec les formes impératives de résiliation (email = nul). La question sur les '20 ans sans papier' mélange deux problèmes distincts.",
  },

  // TRAVAIL — gratification vs prime contractuelle : employeur supprime bonus 'habituel' en invoquant clause discrétionnaire (CO 322d / CO 322)
  {
    id: 'adv_travail_24',
    query: "Mon contrat de travail dit que je peux recevoir une 'gratification discrétionnaire' selon les résultats. J'ai touché un bonus de 4000-6000 CHF chaque année pendant 7 ans sans interruption. Cette année mon patron dit que les résultats sont 'moyens' et refuse de payer quoi que ce soit. Est-ce que la clause 'discrétionnaire' lui permet vraiment de ne rien payer après 7 ans de versement ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 322d', 'CO 322', 'CO 335'],
    notes: "Gratification discrétionnaire vs prime fixe — CO 322d : la gratification n'est due que si elle a été convenue ; mais la jurisprudence du TF distingue si le versement répété et régulier l'a transformée en 'usage d'entreprise' (obligation contractuelle implicite). CO 322 : salaire au sens large inclut les primes promises. 'Clause discrétionnaire + 7 ans sans interruption + même montant à chaque fois' sans 'CO 322d jurisprudence habituel'. Signal adversarial = employé et employeur croient tous deux que la clause discrétionnaire est un bouclier absolu, alors qu'un versement régulier sur 7 ans peut créer une obligation de facto selon le TF.",
  },

  // DETTES — prêt entre particuliers sans contrat écrit, preuve par témoins/virements (CO 312 / CO 8 / CO 127)
  {
    id: 'adv_dettes_20',
    query: "J'ai prêté 9'500 CHF à mon frère il y a 4 ans pour qu'il paie son loyer de retard. On n'a rien signé, c'était de la famille. Depuis il dit que c'était un cadeau et refuse de rembourser. J'ai les virements de ma banque vers son compte. Est-ce que je peux me défendre sans contrat écrit ?",
    canton: 'BE',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 312', 'CO 127', 'CO 8'],
    notes: "Prêt entre particuliers (CO 312 : contrat de prêt = remise avec obligation de restituer) — le contrat de prêt est valable sans écrit (pas de forme prescrite pour ce montant). CO 8 : la preuve peut être rapportée par tous moyens (historique bancaire, SMS, emails, témoins). CO 127 : prescription 10 ans pour les créances résultant d'un prêt. 'Virement bancaire + pas de contrat + frère dit cadeau' sans 'CO 312 preuve' ni 'prescription 10 ans'. Signal adversarial = prêteur croit qu'un prêt oral sans reçu est impossible à prouver et qu'un virement bancaire ne prouve rien juridiquement.",
  },

  // FAMILLE — rente de conjoint divorcé, réduction si concubinage stable (CC 130 al. 2 / CC 129)
  {
    id: 'adv_famille_16',
    query: "Je paie une pension alimentaire de 1800 CHF par mois à mon ex-femme depuis notre divorce il y a 5 ans. J'ai appris qu'elle vit avec quelqu'un depuis 2 ans, ils ont emménagé ensemble. Notre jugement de divorce ne mentionne rien sur le concubinage. Est-ce que je dois continuer à payer la même somme même si elle vit avec un nouveau partenaire ?",
    canton: 'GE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 130', 'CC 129', 'CC 179'],
    notes: "Rente de conjoint et concubinage — CC 130 al. 2 : la rente s'éteint de plein droit au remariage. Le TF a admis (ATF 138 III 689) que le concubinage stable (cohabitation commune, communauté de vie) peut constituer un motif de modification voire de suppression de la rente selon CC 129. Même sans mention dans le jugement de divorce, le changement de situation peut justifier une action en modification. '1800 CHF/mois + 5 ans + cohabite depuis 2 ans' sans 'CC 130 concubinage' ni 'modification jugement'. Signal adversarial = débiteur croit que seul le remariage éteint la rente, alors que le concubinage stable suffit pour une action en modification.",
  },

  // ÉTRANGERS — cas de rigueur, famille déboutée depuis 10 ans, enfants nés et scolarisés en Suisse (LEI 30 / OASA 31)
  {
    id: 'adv_etrangers_15',
    query: "Ma famille est en Suisse depuis 10 ans, ma demande d'asile a été rejetée mais on n'a jamais été renvoyés. Mes deux enfants sont nés ici, le grand a 11 ans et est en 5e primaire à Genève. On nous dit maintenant qu'on doit partir dans 30 jours. Mes enfants ne connaissent que la Suisse. Est-ce qu'il y a quelque chose à faire ?",
    canton: 'GE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 30', 'OASA 31', 'LEI 64', 'Cst 13'],
    notes: "Cas de rigueur — LEI 30 al. 1 let. b : dérogation aux conditions d'admission possible pour cas individuels d'une extrême gravité. OASA 31 : critères du cas de rigueur (durée séjour, intégration, scolarisation des enfants, situation personnelle, conséquences du renvoi). L'enfant né et scolarisé depuis 11 ans est un facteur fort pour le cas de rigueur (ATF 123 II 125). '10 ans en Suisse + asile rejeté + enfants nés ici + école + 30 jours pour partir' sans 'LEI 30 cas de rigueur' ni 'OASA 31 critères'. Signal adversarial = famille croit que la naissance en Suisse et la scolarisation donnent automatiquement un droit de rester, alors qu'il s'agit d'une procédure discrétionnaire qui demande à être activée.",
  },

  // SANTE — décompte LAMal erroné, franchise non créditée, contestation (LAMal 56a / LPGA 52 / LAMal 61)
  {
    id: 'adv_sante_09',
    query: "J'ai choisi une franchise de 2500 CHF pour cette année. J'ai eu une opération en février qui m'a coûté 3200 CHF. Mais sur le décompte de ma caisse maladie, il est écrit que j'ai une franchise de 300 CHF et ils ont calculé ma participation sur cette base, ce qui m'a fait payer moins. Est-ce que je dois les signaler ou garder le silence ? Et s'il y avait une erreur en ma défaveur, j'aurais eu combien de temps pour contester ?",
    canton: 'VD',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 56a', 'LPGA 52', 'LAMal 61', 'LAMal 64'],
    notes: "Décompte LAMal et contestation — LAMal 61 : les primes sont fixées par contrat, la franchise choisie lie l'assuré et la caisse. LAMal 64 : participation aux frais (franchise + quote-part 10%). LPGA 52 : l'assuré peut faire opposition aux décisions de l'assureur dans les 30 jours. En cas d'erreur favorable à l'assuré (franchise trop basse calculée), l'assureur peut réclamer la différence jusqu'à la prescription. 'Franchise 2500 CHF + décompte dit 300 CHF + opération 3200 CHF + dois-je les prévenir' sans 'LPGA 52 opposition 30 jours' ni 'LAMal 64 participation'. Signal adversarial = citoyen se demande s'il doit signaler l'erreur (obligation légale) et ignore le délai de contestation.",
  },

  // ASSURANCES — vol vélo électrique en cave fermée à clé, assurance ménage refuse (clause effraction) (LCA 18 / LCA 39)
  {
    id: 'adv_assurances_11',
    query: "Mon vélo électrique à 3800 CHF a été volé dans la cave fermée à clé de mon immeuble. La serrure a été forcée. Mon assurance ménage refuse d'indemniser en disant que le vélo 'ne se trouvait pas à l'intérieur du logement assuré' et que la cave est un 'local annexe non couvert pour les vélos de valeur'. J'ai bien une police ménage complète. Comment est-ce possible ?",
    canton: 'BS',
    expected_domaine: 'assurances',
    expected_any_article: ['LCA 18', 'LCA 39', 'LCA 33'],
    notes: "Assurance ménage et locaux annexes — LCA 18 : les polices d'assurance ménage définissent le 'lieu assuré' (en général le domicile et parfois les dépendances, avec ou sans limitation pour les vélos de valeur). LCA 39 : devoirs de l'assureur en cas de sinistre. LCA 33 : étendue de la responsabilité selon les conditions générales. La cave (local annexe) peut être exclue ou couverte avec un sous-plafond selon les CG. '3800 CHF + cave forcée + assurance ménage + cave non couverte' sans 'LCA 18 lieu assuré' ni 'conditions générales locaux annexes'. Signal adversarial = assuré croit que l'assurance ménage 'complète' couvre tout vol dans son immeuble, sans lire la définition de 'lieu assuré' dans les CG.",
  },

  // CIRCULATION — refus de souffler dans l'éthylomètre, sanction identique à l'ivresse qualifiée (LCR 91a / LCR 55)
  {
    id: 'adv_circulation_08',
    query: "J'ai été arrêté à un contrôle routier hier soir. Le policier voulait que je souffle dans l'éthylomètre mais j'ai refusé en lui disant que j'avais le droit de garder le silence comme dans un interrogatoire. Il m'a dit que je serais poursuivi. Est-ce que j'ai vraiment le droit de refuser l'éthylomètre et quelles sont les conséquences si je n'avais en réalité rien bu ?",
    canton: 'AG',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 91a', 'LCR 55', 'LCR 91'],
    notes: "Refus d'éthylomètre — LCR 55 : la police peut ordonner un contrôle d'alcoolémie à tout conducteur. LCR 91a al. 1 : le refus de se soumettre à un test est puni comme s'il y avait ivresse (LCR 91 al. 2 = crime si taux élevé supposé). Le droit au silence ne s'applique pas aux tests d'alcoolémie. Même si le conducteur n'avait rien bu, le refus crée une présomption légale et expose à la même sanction. 'Contrôle routier + refus de souffler + droit de garder le silence + rien bu' sans 'LCR 91a refus = même peine' ni 'présomption alcoolémie'. Signal adversarial = conducteur confond le droit au silence pénal (interrogatoire) avec l'obligation de se soumettre aux tests de sécurité routière.",
  },

  // FISCAL — impôt anticipé 35% sur dividendes Sàrl, récupération via déclaration d'impôt (LIA 21 / LIA 24)
  {
    id: 'adv_fiscal_05',
    query: "Je suis actionnaire et gérant de ma Sàrl. En décembre ma société a versé un dividende de 50'000 CHF dont l'AFC a prélevé 35% soit 17'500 CHF 'à la source'. On m'a dit que ces 17'500 CHF étaient perdus définitivement car c'est l'impôt fédéral. Mais un ami comptable dit que je peux les récupérer dans ma déclaration d'impôt cantonale. Qui a raison ?",
    canton: 'ZH',
    expected_domaine: 'fiscal',
    expected_any_article: ['LIA 21', 'LIA 24', 'LIA 1'],
    notes: "Impôt anticipé (LIA) — LIA 1 : l'impôt anticipé frappe les dividendes de capitaux mobiliers suisses (taux 35% LIA 13). LIA 21 al. 1 : le remboursement est accordé au bénéficiaire domicilié en Suisse qui a déclaré le revenu dans sa déclaration d'impôt cantonal. LIA 24 al. 1 : le remboursement périme si non demandé dans les 3 ans. L'ami comptable a raison : l'impôt anticipé est un mécanisme de retenue récupérable via la déclaration, à condition de le déclarer. '50'000 CHF dividende + 35% prélevé + impôt fédéral + perdus définitivement' sans 'LIA 21 remboursement' ni 'déclaration cantonal'. Signal adversarial = actionnaire croit que l'impôt anticipé est définitif alors qu'il est entièrement remboursable si déclaré — domaine fiscal : blind spot attendu (JPT beta).",
  },

  // HYBRIDE — décès propriétaire raison individuelle, dettes commerciales réclamées aux héritiers (CC 560 / CC 568 / CO 579)
  {
    id: 'adv_hybride_08',
    query: "Mon père vient de mourir et il avait une petite épicerie en raison individuelle. Il avait des dettes professionnelles d'environ 30'000 CHF envers ses fournisseurs. Ma sœur et moi on voulait accepter l'héritage pour garder l'appartement de famille, mais repousser les dettes du magasin car on n'est pas dans le commerce. Est-ce possible de séparer les deux ?",
    canton: 'TI',
    expected_domaine: 'successions',
    expected_any_article: ['CC 560', 'CC 568', 'CC 580', 'CC 566'],
    notes: "Succession raison individuelle et dettes commerciales — CC 560 al. 2 : les héritiers sont saisis de plein droit de la succession à l'ouverture, y compris les dettes. CC 568 : les héritiers répondent solidairement des dettes du défunt sur leur fortune personnelle. CO 579 : il n'y a pas de séparation entre patrimoine privé et commercial dans une raison individuelle — tout est confondu, les dettes de l'épicerie sont des dettes personnelles du défunt. La seule échappatoire est la répudiation (CC 566/580 : délai 3 mois) ou le bénéfice d'inventaire (CC 580). 'Père décédé + raison individuelle + dettes 30k fournisseurs + appartement à garder + séparer les deux' sans 'CC 568 dettes solidaires' ni 'bénéfice d'inventaire'. Signal adversarial = héritiers croient que la structure 'raison individuelle' crée une séparation patrimoine privé/professionnel (comme une Sàrl), alors que c'est le contraire absolu.",
  },

  // WAVE 20 — angles inédits, domaines sous-représentés

  // ACCIDENT — morsure de chien (CC 56 responsabilité causale du détenteur d'animal)
  {
    id: 'adv_accident_07',
    query: "Je me promenais dans un parc avec mon fils samedi dernier quand le chien d'une dame l'a mordu au bras, 7 points de suture à l'hôpital. La dame dit que c'est la faute de mon fils qui a couru vers le chien. Son chien n'avait pas de laisse et elle dit qu'elle n'a aucune responsabilité. Est-ce qu'on peut quand même être indemnisés ?",
    canton: 'BE',
    expected_domaine: 'accident',
    expected_any_article: ['CC 56', 'CO 41', 'CC 46'],
    notes: "Responsabilité causale du détenteur d'animal (CC 56) — la responsabilité est objective (pas besoin de prouver une faute du détenteur). La faute de la victime peut réduire l'indemnité (CC 56 al. 2) mais ne l'annule pas sauf en cas de faute grave. L'absence de laisse est un indice de négligence. 'Chien sans laisse + 7 points de suture + dame dit faute du fils' sans 'CC 56 responsabilité causale' ni 'détenteur animal'. Signal adversarial = parent croit que la dispute sur la faute empêche toute indemnisation, ignore la responsabilité causale de CC 56.",
  },

  // ASSURANCES — prestations complémentaires AVS refusées car propriétaire d'un logement (LPC 9/11)
  {
    id: 'adv_social_10',
    query: "J'ai 74 ans et ma rente AVS est de 1'150 CHF par mois, plus 280 CHF de mon ancienne caisse de pension. J'ai fait une demande de prestations complémentaires car c'est insuffisant pour vivre. La caisse cantonale m'a refusé en disant que j'ai un appartement en propriété estimé à 380'000 CHF et que cela dépasse les limites de fortune. C'est mon seul logement depuis 30 ans et je ne veux pas le vendre. Ont-ils le droit de compter mon logement comme fortune ?",
    canton: 'VS',
    expected_domaine: 'assurances',
    expected_any_article: ['LPC 9', 'LPC 11', 'LPC 17a'],
    notes: "Prestations complémentaires AVS/AI et fortune immobilière (LPC 9/11) — LPC 11 al. 1 let. c : un immeuble servant de résidence principale à l'ayant droit est pris en compte dans la fortune, mais avec une franchise (actuellement CHF 112'500 pour une personne seule). La valeur vénale ou fiscale s'applique selon les cantons. Le refus peut être justifié si la fortune nette dépasse les seuils, mais le calcul précis peut être contesté. '74 ans + AVS 1150 + PC refusées + appartement 380k + logement depuis 30 ans' sans 'LPC 11 franchise résidence principale' ni 'calcul fortune PC'. Signal adversarial = retraité ignore les règles de prise en compte de la résidence principale dans le calcul LPC, et la possibilité de contester le montant retenu.",
  },

  // VIOLENCE — violence économique dans le couple, contrôle financier total par le conjoint (CP 181 / CC 163)
  {
    id: 'adv_violence_10',
    query: "Mon mari contrôle tout notre argent depuis 9 ans de mariage. Je n'ai accès à aucun compte, ni commun ni personnel. Pour acheter des vêtements à nos enfants je dois lui demander et il refuse souvent ou donne quelques francs en mauvaise humeur. Si je lui déplais il coupe les vivres pendant des jours. Je ne travaille pas car il a insisté pour que je reste à la maison. Est-ce une infraction pénale ou juste une mauvaise situation familiale ?",
    canton: 'VD',
    expected_domaine: 'violence',
    expected_any_article: ['CP 181', 'CP 181a', 'CC 163', 'CC 172'],
    notes: "Violence économique conjugale — CP 181 : la contrainte (obliger par la pression à tolérer quelque chose) couvre le contrôle financier extrême selon la jurisprudence récente. CC 163 : chaque époux contribue aux charges du ménage selon ses facultés — le refus total d'accès aux ressources viole cette obligation. CC 172 : mesures judiciaires de protection de l'union conjugale si un époux manque à ses devoirs. La violence économique est reconnue comme forme de violence domestique (Programme OMS, ATF récents). 'Mari contrôle argent + aucun compte + couper les vivres + 9 ans' sans 'CP 181 contrainte économique' ni 'CC 163 obligation contribution'. Signal adversarial = victime croit que la violence doit être physique, ignore que la contrainte économique totale est une infraction pénale.",
  },

  // CONSOMMATION — hôtel surréservé, downgrade forcé, agence et hôtel se renvoient la responsabilité (CO 97 / CO 101)
  {
    id: 'adv_consommation_09',
    query: "J'avais réservé et entièrement payé via une agence de voyage 5 nuits dans un hôtel 4 étoiles à Lugano à 380 CHF la nuit. En arrivant, ils m'ont dit qu'il n'y avait plus de chambre (surréservation) et qu'ils me mettaient dans un hôtel 2 étoiles voisin. L'agence dit que c'est la faute de l'hôtel. L'hôtel dit que c'est l'agence qui gère. Personne ne veut rembourser la différence ni les frais supplémentaires. Que puis-je faire ?",
    canton: 'TI',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 97', 'CO 101', 'CO 398'],
    notes: "Surréservation hôtelière et responsabilité de la chaîne contractuelle — CO 97 : inexécution du contrat (chambre promise non livrée). CO 101 : le débiteur répond des faits de ses auxiliaires d'exécution comme de ses propres (l'agence répond donc de l'hôtel qu'elle a choisi). CO 398 : diligence du mandataire. Le consommateur peut agir en priorité contre l'agence avec qui il a conclu le contrat. 'Hôtel 4 étoiles + surréservation + 2 étoiles + agence rejette sur hôtel + hôtel renvoie à agence' sans 'CO 97 inexécution' ni 'CO 101 auxiliaires d'exécution'. Signal adversarial = citoyen est piégé entre deux responsables qui se renvoient la balle, ignore qu'il peut agir contre son cocontractant direct (l'agence).",
  },

  // ENTREPRISE — associé Sàrl qui veut vendre ses parts, veto sans motif des co-associés (CO 784/785)
  {
    id: 'adv_entreprise_09',
    query: "Je veux quitter la Sàrl que j'ai fondée avec deux associés il y a 6 ans. J'ai trouvé un acheteur pour mes parts à 120'000 CHF. Mes co-associés bloquent la vente depuis 4 mois sans jamais expliquer pourquoi — ils disent juste que les statuts leur donnent le droit de refuser. Je suis bloqué dans la société contre ma volonté. Peuvent-ils me bloquer indéfiniment ?",
    canton: 'ZH',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 784', 'CO 785', 'CO 786'],
    notes: "Cession de parts Sàrl et clause d'agrément (CO 784/785) — CO 784 : les parts sociales sont librement cessibles sauf restrictions statutaires. CO 785 : si l'assemblée refuse la cession, l'associé cédant peut exiger le rachat de ses parts à leur valeur réelle — le refus de cession sans offre de rachat est abusif. '120k + co-associés bloquent 4 mois + aucun motif + statuts invoqués' sans 'CO 784 cession parts' ni 'CO 785 droit au rachat valeur réelle'. Signal adversarial = associé croit être prisonnier de la Sàrl, ignore que le refus de cession lui ouvre un droit de sortie forcé à valeur réelle.",
  },

  // CIRCULATION — récidive d'infractions légères cumulées menant à un retrait de permis (LCR 16a)
  {
    id: 'adv_circulation_09',
    query: "En 18 mois j'ai eu 3 amendes pour excès de vitesse, chaque fois 5 à 9 km/h au-dessus de la limite, j'ai payé à chaque fois. Le service cantonal des véhicules me menace maintenant d'un retrait de permis pour 'récidive'. Pourtant chaque infraction individuellement ne mérite qu'un avertissement. Est-il légal d'additionner des petites infractions pour retirer le permis alors que j'ai déjà payé les amendes ?",
    canton: 'SG',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 16a', 'LCR 33', 'LCR 16'],
    notes: "Cumul d'infractions légères et retrait de permis (LCR 16a) — LCR 16a : infraction légère (dépassement faible, pas de blessés). Mais LCR 16a al. 2bis : en cas de récidive dans les 10 ans, la 3e infraction légère entraîne un retrait d'au minimum 1 mois. Le paiement de l'amende est distinct de la mesure administrative de retrait. LCR 33 : l'autorité cantonale prononce les retraits. '3 amendes 18 mois + chacune légère + payée + menace retrait' sans 'LCR 16a récidive cumulative' ni 'amende ≠ mesure administrative'. Signal adversarial = conducteur croit que payer chaque amende clôt définitivement chaque affaire, ignore l'effet cumulatif sur le casier routier et la procédure administrative séparée.",
  },

  // SANTE — médicament hors liste des spécialités, prise en charge exceptionnelle possible (LAMal 52 / OAMal 71a)
  {
    id: 'adv_sante_10',
    query: "Mon médecin m'a prescrit un médicament pour une maladie rare (vascularite systémique). Ma caisse maladie refuse de rembourser en disant qu'il n'est pas sur leur liste. Il coûte 4'200 CHF par mois et mon médecin dit qu'il n'y a aucun médicament équivalent sur le marché suisse. Sans ce traitement ma maladie progresse rapidement. Y a-t-il un moyen de le faire rembourser malgré tout ?",
    canton: 'ZH',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 52', 'LAMal 32', 'LPGA 52'],
    notes: "Médicament hors liste des spécialités (LS), prise en charge individuelle — LAMal 52 : la liste des spécialités (LS) fixe les médicaments remboursables. OAMal 71a : un médicament hors LS peut être pris en charge si le médecin établit qu'il est efficace, adéquat et économique dans le cas spécifique (therapeutic alternative absent). LPGA 52 : opposition à la décision de l'assureur dans les 30 jours. 'Maladie rare + 4200 CHF/mois + pas sur la liste + aucune alternative + maladie progresse' sans 'OAMal 71a prise en charge individuelle' ni 'LPGA 52 opposition 30 jours'. Signal adversarial = patient croit le refus définitif, ignore la procédure de remboursement exceptionnel hors LS.",
  },

  // FISCAL — double imposition internationale sur pension étrangère, CDI (LIFD 6 / CDI)
  {
    id: 'adv_fiscal_06',
    query: "Je suis retraitée domiciliée à Berne depuis 12 ans. Je reçois une pension mensuelle d'Allemagne de 900 euros de mon ancien employeur privé allemand. En Suisse, je déclare ce revenu et paie l'impôt. Mais l'Allemagne prélève aussi 15% à la source avant de me verser la pension. Je paie donc deux fois des impôts sur le même argent. Existe-t-il un moyen légal d'éviter ça ?",
    canton: 'BE',
    expected_domaine: 'fiscal',
    expected_any_article: ['LIFD 6', 'LIFD 3', 'CDI'],
    notes: "Double imposition internationale et convention CDI — les CDI (conventions de double imposition) règlent quel pays peut imposer quoi. La CDI Suisse-Allemagne (RS 0.672.913.62) prévoit que les pensions privées sont imposées dans le pays de résidence, non dans l'État source. L'Allemagne ne devrait pas retenir un impôt à la source sur une pension privée versée à une résidente suisse. La retraitée peut demander le remboursement de la retenue à la source allemande auprès du Bundeszentralamt für Steuern. 'Pension allemande + retenue source 15% + Suisse impose aussi + double imposition' sans 'CDI Suisse-Allemagne' ni 'remboursement retenue source'. Signal adversarial = domaine fiscal = blind spot complet JPT (0% attendu).",
  },

  // FAMILLE — déplacement unilatéral de l'enfant dans une autre ville par le parent gardien (CC 301a)
  {
    id: 'adv_famille_17',
    query: "Je suis séparé de la mère de ma fille de 8 ans depuis 18 mois. Ma fille vit avec sa mère à Genève et j'ai un droit de visite un week-end sur deux. La mère vient de m'annoncer par SMS qu'elle déménage à Zurich dans 6 semaines avec ma fille pour un nouveau travail. Elle dit n'avoir pas besoin de mon accord puisqu'elle a la garde principale. Est-ce qu'elle a vraiment le droit de partir avec notre fille sans mon accord ?",
    canton: 'GE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 301a', 'CC 298', 'CC 301'],
    notes: "Déplacement unilatéral de l'enfant et accord parental (CC 301a) — CC 301a (en vigueur depuis 2014) : le parent qui veut changer de lieu de résidence avec l'enfant doit obtenir l'accord de l'autre parent ou, en cas de désaccord, une décision judiciaire. La garde principale ne donne PAS le droit de déménager librement avec l'enfant. '8 ans + séparation 18 mois + un week-end sur deux + SMS Zurich + dit pas besoin accord' sans 'CC 301a déplacement unilatéral interdit' ni 'accord requis ou juge'. Signal adversarial = parent gardien croit que la garde principale équivaut à une liberté totale de déménagement, alors que CC 301a l'en empêche sauf accord ou décision judiciaire.",
  },

  // VOISINAGE — serre haute du voisin qui prive de lumière (CC 684 immissions / permis communal)
  {
    id: 'adv_voisinage_14',
    query: "Mon voisin a érigé une serre en verre de 3.5 mètres de haut juste de l'autre côté de notre clôture commune. Depuis la fin des travaux il y a 4 mois, notre salon n'a plus de lumière l'après-midi car la serre bloque le soleil de 13h à 17h. La commune dit qu'elle ne peut rien faire car le permis de construire était légal. Le permis communal efface-t-il vraiment mes droits de voisinage ?",
    canton: 'ZH',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 684', 'CC 679', 'CC 686'],
    notes: "Immissions excessives et droit de voisinage (CC 684) — CC 684 al. 1 : le propriétaire s'abstient de tout excès au détriment des fonds voisins. La privation d'ensoleillement peut constituer une immission excessive selon la jurisprudence TF (critère : intensité, durée, situation locale). Un permis de construire légal ne supprime PAS les droits fondés sur le droit civil de voisinage — le droit public (permis) et le droit privé (CC 684) sont indépendants. 'Serre 3.5m + permis valide + soleil coupé 4h/jour + commune impuissante' sans 'CC 684 immissions excessives' ni 'permis n'efface pas voisinage CC'. Signal adversarial = propriétaire croit que le permis communal légal exclut tout recours de voisinage, alors que CC 684 est autonome du droit public.",
  },

  // ========== WAVE 21 — 2026-06-23 ==========

  // BAIL — dépôt de garantie non restitué 3 ans après l'état des lieux signé sans réserve (CO 257e)
  {
    id: 'adv_bail_23',
    query: "J'ai quitté mon appartement en mars 2022 après 5 ans de location. L'état des lieux de sortie a été signé par la régie sans aucune remarque. On est maintenant en juin 2025 et je n'ai toujours pas récupéré mes 3 mois de caution, soit 4'500 CHF déposés en banque. La régie ne répond plus à mes lettres recommandées depuis 8 mois. Y a-t-il un délai légal pour qu'ils me rendent cet argent, et est-ce que des intérêts courent depuis le départ ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 257e', 'CO 104', 'CO 257c'],
    notes: "Restitution tardive du dépôt de garantie (CO 257e) — CO 257e al. 3 : à la fin du bail, le bailleur doit restituer la garantie dès qu'il n'a plus de prétentions à faire valoir, au plus tard dans un délai raisonnable (jurisprudence : 1 mois si état des lieux sans réserve). CO 104 : intérêts de retard sur la somme détenue. CO 257c : le dépôt est légalement limité à 3 mois de loyer. '3 ans + état des lieux signé sans réserve + régie silencieuse + 4500 CHF + intérêts ?' sans 'CO 257e délai restitution' ni 'CO 104 intérêts retard'. Signal adversarial = locataire formule par 'ils ne répondent pas' et 'est-ce légal' sans citer la restitution ni le délai légal.",
  },

  // TRAVAIL — clause contractuelle "heures sup incluses dans le salaire", réalité 55h+/semaine (CO 321c / LTr 9)
  {
    id: 'adv_travail_25',
    query: "Mon contrat de travail stipule que 'toutes les heures supplémentaires éventuelles sont incluses dans le salaire mensuel'. Depuis 2 ans je travaille réellement entre 55 et 60 heures par semaine. Mon employeur refuse toute compensation en citant ce paragraphe. J'ai lu quelque part que la loi fixe une durée maximum de travail de 45 ou 50 heures. Est-ce que cette clause dans mon contrat peut vraiment m'obliger à travailler autant sans supplément ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 321c', 'LTr 9', 'LTr 12'],
    notes: "Forfait heures supplémentaires et limites LTr (CO 321c / LTr 9) — CO 321c al. 3 : les heures supplémentaires doivent être compensées ou payées à 125%, sauf accord écrit d'un forfait valable. Un forfait n'est admis que si le salaire est suffisamment élevé et les heures supplémentaires prévisibles (jurisprudence TF). LTr 9 : durée maximale légale = 45h/sem (industrie) ou 50h/sem (autres). Au-delà de LTr 9, l'employeur encourt des sanctions pénales indépendamment du contrat. LTr 12 : les heures supplémentaires LTr (dépassement de la durée légale) sont distinctes du dépassement de l'horaire contractuel (CO 321c). 'Contrat forfait + 55-60h/semaine + 2 ans + refus compensation + loi 45/50h' sans 'CO 321c forfait limites' ni 'LTr 9 sanction pénale indépendante'. Signal adversarial = travailleur connaît vaguement LTr mais ignore la distinction CO 321c (heures contractuelles) / LTr 9 (durée maximale) et la nullité du forfait au-delà.",
  },

  // ASSURANCES — RC privée du voisin refuse de couvrir dégâts causés par son enfant (CO 41 / LCA gap)
  {
    id: 'adv_assurances_12',
    query: "Le fils de ma voisine, qui a 11 ans, a cassé ma fenêtre en jouant au foot dans le jardin. Les dégâts se montent à 950 CHF. La voisine m'a dit que son assurance responsabilité civile prendrait en charge le sinistre. Mais l'assurance refuse en invoquant que l'acte était 'intentionnel' car l'enfant visait délibérément le ballon. La voisine dit qu'elle ne peut rien faire. Qui paie finalement ?",
    canton: 'BE',
    expected_domaine: 'assurances',
    expected_any_article: ['CO 41', 'CC 333', 'CO 97'],
    notes: "Responsabilité des parents pour dommages causés par leurs enfants mineurs (CC 333 / CO 41) — CC 333 al. 1 : le chef de famille répond des dommages causés par les personnes sous son autorité, sauf preuve d'avoir exercé toute la surveillance commandée par les circonstances. CO 41 : responsabilité délictuelle (faute + dommage + causalité). L'assurance RC privée couvre la responsabilité civile involontaire — viser un ballon (pas la fenêtre) = faute négligente, non intentionnelle, couverte. L'invocation de 'l'intentionnalité' par l'assureur est abusive : l'acte intentionnel en RC exige que le dommage ait été voulu, pas seulement l'acte déclencheur. Note : gap connu JPT — aucune fiche pour l'assurance RC privée (vs assurances sociales couvertes). 'Enfant 11 ans + fenêtre cassée + ballon + RC refuse intentionnel + voisine impuissante' sans 'CC 333 responsabilité parentale' ni 'RC = faute négligente couverte'. Signal adversarial = victime croit l'assureur sur parole, ignore que 'intentionnel' ≠ dommage voulu.",
  },

  // FAMILLE — divorce consensuel : juge refuse d'homologuer la convention sur la pension enfant (CC 285 / CPC 280)
  {
    id: 'adv_famille_18',
    query: "Mon ex-mari et moi voulons divorcer par consentement mutuel. Nous avons élaboré avec un avocat un accord sur la garde alternée et une pension alimentaire de 550 CHF par mois pour notre fils de 8 ans. Le juge a refusé d'homologuer notre convention en nous disant que la pension est insuffisante au regard des besoins de l'enfant. Peut-il vraiment imposer un montant plus élevé alors que nous sommes tous les deux d'accord et que nous avons trouvé cet accord avec un professionnel ?",
    canton: 'FR',
    expected_domaine: 'famille',
    expected_any_article: ['CC 285', 'CC 133', 'CPC 280', 'CC 276'],
    notes: "Divorce consentement mutuel et contrôle judiciaire de la pension enfant (CC 285 / CPC 280) — CC 133 al. 3 : même en cas de divorce par consentement mutuel, le juge doit vérifier que les accords sur les droits des enfants correspondent à l'intérêt de ceux-ci. CC 285 : la pension est fixée selon les besoins de l'enfant ET les capacités financières des parents — le juge n'est pas lié par l'accord des parties si la pension est insuffisante. CPC 280 : homologation de la convention impossible si contraire à l'intérêt de l'enfant. '550 CHF + avocat + juge refuse + dit insuffisant' sans 'CC 285 intérêt supérieur primant l'accord' ni 'CPC 280 contrôle judiciaire obligatoire'. Signal adversarial = couple croit que le divorce consensuel = entérinement automatique par le juge, ignore que CC 133/285 confèrent au juge un contrôle substantiel sur la pension enfant.",
  },

  // ETRANGERS — demandeur d'asile permis N, droits de travailler après 3 mois (LAsi 43 / OASA 65)
  {
    id: 'adv_etrangers_16',
    query: "Je suis demandeur d'asile, je suis arrivé en Suisse il y a 5 mois et j'ai un permis N. J'ai trouvé un employeur dans la restauration prêt à m'engager comme plongeur. Mais le service cantonal de l'emploi et l'employeur me disent que travailler avec un permis N est 'impossible'. Pourtant quelqu'un du foyer m'a dit qu'après 3 mois on a le droit de travailler. Qui dit vrai ?",
    canton: 'VD',
    expected_domaine: 'etrangers',
    expected_any_article: ['LAsi 43', 'LEI 30', 'OASA 65'],
    notes: "Droit au travail des requérants d'asile (LAsi 43) — LAsi 43 al. 1 : les requérants d'asile ont le droit d'exercer une activité lucrative après un délai d'attente de 3 mois dès le dépôt de la demande d'asile (modification 2018). Ce droit est subordonné à une autorisation cantonale (OASA 65) et à la priorité des résidents suisses et UE/AELE. LEI 30 al. 1 let. l : exception à l'admission (personnes en procédure d'asile). Le service cantonal peut refuser si la priorité locale n'est pas respectée, mais il ne peut pas refuser systématiquement l'accès au travail. 'Permis N + 5 mois + restauration + service emploi dit impossible + 3 mois entendus' sans 'LAsi 43 délai 3 mois' ni 'autorisation cantonale requise mais possible'. Signal adversarial = requérant entendu le bon droit mais confronté à un refus administratif non motivé ; confusion entre 'impossible' (faux) et 'soumis à autorisation' (vrai).",
  },

  // SUCCESSIONS — héritier institué dans le testament pré-décède avant le testateur (CC 488 / CC 496)
  {
    id: 'adv_successions_12',
    query: "Mon père a rédigé un testament en 2016 dans lequel il léguait notre chalet de montagne à mon frère aîné, et le reste à partager entre nous trois enfants. Mon frère aîné est décédé en 2023 d'un cancer, soit un an avant mon père. Mon père n'a jamais actualisé son testament. Mon frère avait deux enfants (mes neveux). Qui hérite maintenant du chalet ? Est-ce que mes neveux prennent la place de leur père, ou est-ce que le legs tombe et le chalet revient dans la masse à partager entre nous deux restants ?",
    canton: 'VS',
    expected_domaine: 'successions',
    expected_any_article: ['CC 488', 'CC 496', 'CC 539', 'CC 485'],
    notes: "Caducité du legs par prédécès et représentation (CC 488 / CC 496) — CC 488 al. 1 : les dispositions testamentaires en faveur d'un héritier qui prédécède sans que le testateur ait prévu de substitution sont en principe caduques. CC 496 : en l'absence de disposition contraire dans le testament, les descendants de l'héritier pré-décédé n'héritent pas automatiquement du legs — la représentation au sens de la succession légale (CC 543) ne s'applique pas automatiquement aux successions testamentaires. La part caduque retombe dans la masse successorale et se répartit entre les autres héritiers institués (ou selon la loi si le testament ne règle pas la caducité). 'Frère décédé 2023 + testament 2016 + neveux ou autres héritiers + chalet + testament pas mis à jour' sans 'CC 488 caducité disposition' ni 'représentation testamentaire non automatique'. Signal adversarial = héritier croit que les descendants remplacent automatiquement leur parent pré-décédé, ignore que la représentation est légale (ab intestat) et non automatiquement testamentaire.",
  },

  // VIOLENCE — voisin menaçant et agressif, police peu réactive, mesures civiles possibles (CP 180 / CC 28b)
  {
    id: 'adv_violence_11',
    query: "Mon voisin du dessus est alcoolique. Depuis 8 mois, il frappe sur mon plafond, m'insulte dans les escaliers et m'a dit deux fois 'je vais te faire regretter'. La semaine dernière il m'a poussé dans l'escalier, je me suis cogné l'épaule mais sans blessure visible. J'ai appelé la police à 5 reprises, ils viennent, ça se calme, mais ça reprend dès le lendemain. La police dit qu'elle 'ne peut rien faire sans fait grave'. Y a-t-il une procédure judiciaire pour m'en protéger même sans blessure physique sérieuse ?",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CP 180', 'CC 28b', 'CC 28', 'CP 126'],
    notes: "Menaces et ordonnance de protection civile (CP 180 / CC 28b) — CP 180 al. 1 : quiconque menace autrui d'un danger grave et imminent pour son intégrité corporelle ou sa vie est punissable. CP 126 : voies de fait réitérées. CC 28b : action en cessation de l'atteinte à la personnalité — le juge civil peut ordonner une interdiction de s'approcher (ordonnance de protection) sans attendre une condamnation pénale. La procédure civile CC 28b est plus rapide que la procédure pénale et ne requiert pas de blessure grave. 'Menaces verbales + push + police répétée + sans blessure grave + police impuissante' sans 'CC 28b ordonnance de protection civile' ni 'CP 180 menaces indépendamment des blessures'. Signal adversarial = victime cherche uniquement une solution policière/pénale, ignore la voie civile CC 28b qui permet une ordonnance d'interdiction d'approche sans procédure pénale.",
  },

  // CONSOMMATION — formation en ligne non livrée, CG disent no-refund, coach disparu (CO 97 / CO 107 / CO 100)
  {
    id: 'adv_consommation_10',
    query: "J'ai payé 1'380 CHF pour un coaching professionnel en ligne de 8 séances sur une plateforme. Après 2 séances, le coach a arrêté de répondre à mes messages et n'a plus donné signe de vie depuis 3 mois. La plateforme me répond qu'elle n'est 'qu'un intermédiaire' et ne rembourse pas. Les conditions générales du coach stipulaient 'aucun remboursement après la première séance'. Est-ce que cette clause m'empêche vraiment de récupérer mes 1'380 CHF alors qu'il n'a pas exécuté ce qu'il avait promis ?",
    canton: 'ZH',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 97', 'CO 107', 'CO 100', 'CO 109'],
    notes: "Inexécution du contrat et nullité des clauses d'exclusion en cas de dol/faute grave (CO 97 / CO 100 / CO 107) — CO 97 al. 1 : le débiteur qui n'exécute pas sa prestation doit réparer le dommage, sauf cause libératoire. CO 107 al. 2 : si le débiteur est en demeure, le créancier peut renoncer à la prestation et réclamer des dommages-intérêts ou résoudre le contrat. CO 100 al. 1 : est nulle toute clause qui exclut la responsabilité pour dol ou faute grave. Une clause 'no-refund' ne peut pas exclure les droits du créancier en cas d'inexécution totale (abandon du contrat = faute grave). '1380 CHF + 2/8 séances + coach disparu 3 mois + plateforme intermédiaire + CG no-refund' sans 'CO 97/107 inexécution' ni 'CO 100 nullité clause exclusion faute grave'. Signal adversarial = consommateur croit la clause no-refund absolue, ignore que CO 100 la rend nulle en cas d'inexécution délibérée.",
  },

  // SANTE — médecin réclame 350 CHF pour copie du dossier médical, envoie un résumé à la place (LPD 25 / LPMéd 11)
  {
    id: 'adv_sante_11',
    query: "J'ai changé de médecin traitant après 6 ans. J'ai écrit à mon ancien médecin pour obtenir l'intégralité de mon dossier médical. Il m'a répondu par courrier qu'il me fournira le dossier contre paiement de 380 CHF 'pour la préparation et la numérisation'. Comme je refusais de payer, il m'a envoyé un résumé de 3 pages au lieu du dossier complet. A-t-il le droit de bloquer l'accès à mon propre dossier derrière un paiement de 380 CHF ?",
    canton: 'BE',
    expected_domaine: 'sante',
    expected_any_article: ['LPD 25', 'LPMéd 11', 'Cst 13', 'LPD 5'],
    notes: "Droit d'accès au dossier médical et tarification (LPD 25 / LPMéd 11) — LPD 25 al. 2 (nLPD, en vigueur depuis sept. 2023) : le droit d'accès est en principe gratuit ; des frais ne peuvent être mis à la charge du requérant que si la demande est manifestement abusive ou entraîne un travail disproportionné. 380 CHF pour un dossier de 6 ans n'est pas justifiable. LPMéd 11 : le patient a le droit de consulter son dossier médical. Un résumé de 3 pages ne constitue pas un accès complet au sens de LPD 25 (accès = données telles qu'elles existent, pas un résumé sélectif). 'Changement médecin + 380 CHF + résumé 3 pages + dossier complet refusé' sans 'LPD 25 accès en principe gratuit' ni 'résumé ≠ accès LPD'. Signal adversarial = patient croit que le médecin peut monétiser l'accès aux données personnelles médicales, ignore la nLPD 2023 et LPMéd 11.",
  },

  // FISCAL — impôt sur les gains immobiliers après 17 ans de possession, déductions rénovations (LIFD 218 / droit cantonal)
  {
    id: 'adv_fiscal_07',
    query: "J'ai acheté ma maison en 2008 pour 560'000 CHF. Je veux la vendre maintenant, le notaire estime la valeur à 920'000 CHF. Mon comptable me parle d'un 'impôt sur les gains immobiliers'. J'ai habité et entretenu cette maison pendant 17 ans, et j'ai fait des rénovations importantes (cuisine et salle de bain pour 85'000 CHF en 2019). La durée de possession et mes travaux réduisent-ils cet impôt ?",
    canton: 'VD',
    expected_domaine: 'fiscal',
    expected_any_article: ['LIFD 43', 'LIFD 218', 'LHID 12', 'LIFD 12'],
    notes: "Impôt sur les gains immobiliers — droit cantonal exclusivement (LHID 12 / LGIM selon canton) — En Suisse, l'impôt sur les gains immobiliers est exclusivement cantonal (LHID 12 ; chaque canton a sa propre loi, ex. LGIM pour VD). La LIFD ne s'applique pas à la vente d'un bien de fortune privée (LIFD 16 al. 3 exonère les gains privés). Barème dégressif : plus la durée de possession est longue, plus le taux est bas (VD : réduction de 2% par année dès la 2e, exonération partielle possible après 25 ans). Travaux de rénovation : augmentent le prix de revient et réduisent le gain imposable (à déclarer avec factures). '17 ans + rénovations 85k + gain 360k + impôt gain immobilier + déductions ?' sans 'droit cantonal LGIM' ni 'LHID 12' ni 'réductions pour durée et travaux'. Signal adversarial = domaine fiscal = blind spot complet JPT (0% attendu sur tous les cas fiscaux).",
  },

  // BAIL — clause interdisant les animaux, locataire adopte un chien pour raison médicale attestée (CO 256 / CO 257f / jurisprudence TF)
  {
    id: 'adv_bail_24',
    query: "Mon bail interdit formellement les animaux domestiques, c'est écrit noir sur blanc. J'ai adopté un golden retriever il y a 6 mois car mon psychiatre m'a prescrit un 'animal de soutien émotionnel' suite à une dépression sévère. La régie a appris l'existence du chien par ma voisine et m'a envoyé un avertissement me sommant de m'en séparer sous 30 jours, faute de quoi elle résiliera mon bail. Est-ce qu'une attestation médicale peut faire exception à la clause d'interdiction des animaux ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 256', 'CO 257f', 'CO 271', 'CO 272'],
    notes: "Clause d'interdiction des animaux et obligation d'usage conforme (CO 256 / CO 257f) — CO 256 al. 1 : le bailleur est tenu de délivrer la chose dans un état approprié à l'usage convenu. Une clause interdisant tous les animaux peut être contestée si elle empêche un usage raisonnable, notamment pour des raisons médicales attestées. La jurisprudence TF (ATF 138 III 59) admet que l'interdiction générale et absolue des animaux peut être qualifiée de clause abusive selon les circonstances. CO 257f al. 2 : sanction de résiliation possible mais seulement si le manquement est grave et persistant. CO 271 : résiliation abusive si le bailleur agit de mauvaise foi ou sans intérêt légitime. 'Chien + prescription psychiatrique + avertissement régie + 30 jours + résilier' sans 'CO 256 usage approprié' ni 'jurisprudence TF clause abusive' ni 'CO 271 résiliation contestable'. Signal adversarial = locataire croit la clause absolue et incontestable, ignore la relativisation jurisprudentielle et l'obligation CO 256.",
  },

  // TRAVAIL — contrat CDD renouvelé 4 fois sur 5 ans, employeur n'offre pas de renouvellement, citoyen pense avoir un CDI (CO 334 / CO 335)
  {
    id: 'adv_travail_26',
    query: "Je travaille depuis 5 ans pour la même PME avec des contrats à durée déterminée d'un an, renouvelés chaque année avec une lettre signée. Mon employeur vient de m'informer qu'il ne renouvellera pas mon contrat à l'échéance en août. Un collègue m'a dit qu'après autant de renouvellements, mon CDD s'est automatiquement transformé en CDI et qu'il ne peut pas juste me laisser partir. Est-ce vrai ? Ai-je droit à un préavis ou à une indemnité ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 334', 'CO 335', 'CO 335c', 'CO 336'],
    notes: "Transformation CDD en CDI et renouvellement exprès (CO 334 / CO 335) — CO 334 al. 2 : si un contrat de durée déterminée est reconduit tacitement (sans accord exprès), il se transforme en contrat de durée indéterminée. Mais si chaque renouvellement fait l'objet d'une lettre signée (accord exprès), il n'y a pas de reconduction tacite — la transformation en CDI n'est pas automatique. Exception (jurisprudence TF) : si les renouvellements successifs visent à contourner la protection légale du CDI (notamment les délais de congé et la protection contre le licenciement abusif), le juge peut requalifier. CO 335c : les délais légaux de congé s'appliquent au CDI; sans requalification, la non-reconduction du CDD est un simple terme contractuel. '5 ans + 4 renouvellements + lettre chaque année + non-renouvellement + CDI automatique ?' sans 'CO 334 tacite vs exprès' ni 'risque de requalification seulement si contournement abusif'. Signal adversarial = travailleur confond reconduction tacite et renouvellement exprès, ignore que la lettre annuelle empêche la transformation automatique.",
  },

  // DETTES — commandement de payer reçu 12 ans après la dette originale, cédée 3x, prescription plaidée (CO 127 / CO 135 / LP 67)
  {
    id: 'adv_dettes_21',
    query: "En 2012 j'avais une dette de carte de crédit de 3'800 CHF avec Cembra Bank. Je n'ai jamais pu rembourser et la banque a arrêté de me contacter en 2014. Je pensais que c'était terminé. Or hier j'ai reçu un commandement de payer d'une société de recouvrement que je ne connais pas, pour 5'600 CHF avec les intérêts. Sur le document, il y a écrit 'créancier cédant : Creditreform, cédant initial : Cembra Bank, 2012'. Est-ce que cette vieille dette peut encore être légalement réclamée après 12 ans ?",
    canton: 'AG',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 127', 'CO 135', 'CO 142', 'LP 67', 'LP 74'],
    notes: "Prescription décennale et interruption par actes de poursuite (CO 127 / CO 135) — CO 127 : la prescription des créances est de 10 ans en règle générale. Si la dette date de 2012 et qu'aucun acte interruptif n'est intervenu depuis 2014, elle pourrait être prescrite depuis 2022 (10 ans). CO 135 ch. 2 : la prescription est interrompue par tout acte de poursuite (commandement de payer, LP 67) ou acte de reconnaissance de dette. Si la société de recouvrement a envoyé un commandement de payer avant 2022 (sans que le citoyen le sache car changement d'adresse, notif fictive LP 67 al. 1), la prescription a pu être interrompue. CO 142 : la prescription doit être invoquée (moyen de droit, pas d'office). LP 74 al. 1 : le débiteur peut former opposition totale sans motif — seule voie pour bloquer la poursuite sans avocat. 'Cembra 2012 + cédée + 5600 CHF + 12 ans + société inconnue' sans 'CO 127 prescription 10 ans' ni 'CO 135 interruption par poursuite antérieure' ni 'LP 74 opposition sans motif'. Signal adversarial = citoyen ignore que la cession de créance ne réinitialise pas la prescription, mais qu'un commandement de payer intermédiaire peut l'avoir interrompue.",
  },

  // ACCIDENT — morsure de chien par l'animal personnel d'un livreur en service, responsabilité employeur (CC 56 / CO 55 / CO 41)
  {
    id: 'adv_accident_08',
    query: "Un livreur est venu déposer un colis chez moi la semaine passée. Il avait amené son propre chien (un berger malinois) attaché à sa camionnette. Quand il est sorti chercher le colis, le chien a sauté par la vitre baissée et m'a mordu au bras — 14 points de suture et 3 semaines d'arrêt de travail. La société de livraison (son employeur) dit qu'ils 'ne savent pas pourquoi il avait son chien' et que c'est son problème personnel. Qui est responsable et doit payer mes frais médicaux et la perte de salaire ?",
    canton: 'LU',
    expected_domaine: 'accident',
    expected_any_article: ['CC 56', 'CO 55', 'CO 41', 'CO 46'],
    notes: "Responsabilité du détenteur d'animal et de l'employeur (CC 56 / CO 55) — CC 56 al. 1 : le détenteur d'un animal répond du dommage causé par celui-ci, sauf s'il prouve toute la diligence requise ou que le dommage serait survenu même sans faute de sa part. Le livreur (détenteur du chien) est directement responsable. CO 55 al. 1 : l'employeur est responsable des dommages causés par ses auxiliaires dans l'exercice de leurs fonctions, sauf preuve que toutes les précautions nécessaires ont été observées. L'argument 'problème personnel' de l'employeur est fragile si le livreur était en mission officielle au moment du sinistre (livraison client = exercice des fonctions). CO 46 : indemnisation dommage corporel = frais médicaux + perte de gain (arrêt de travail). 'Livreur + chien personnel + morsure + 14 points + 3 semaines arrêt + employeur nie' sans 'CC 56 détenteur animal' ni 'CO 55 responsabilité employeur pour auxiliaire en mission'. Signal adversarial = victime croit l'argument de l'employeur (séparation sphère privée/professionnelle), ignore CO 55 (mission en cours = responsabilité employeur possible cumulativement).",
  },

  // ENTREPRISE — associé Sàrl prête de l'argent à sa propre société en difficulté, rang en cas de faillite (LP 219 / CO 792 / CO 757)
  {
    id: 'adv_entreprise_10',
    query: "Je suis associé à 40% d'une Sàrl avec deux autres personnes. La société traverse une mauvaise passe et nous manquons de liquidités pour payer les fournisseurs. J'ai prêté personnellement 80'000 CHF à la société il y a 8 mois, avec un contrat de prêt et des intérêts à 3%. Si la société fait faillite, est-ce que je récupère mon argent comme n'importe quel créancier ? Ou le fait d'être associé me défavorise-t-il dans la répartition ?",
    canton: 'ZG',
    expected_domaine: 'entreprise',
    expected_any_article: ['LP 219', 'CO 792', 'CO 757', 'CO 716a'],
    notes: "Prêt d'associé à la société et rang en faillite (LP 219 / subordination) — LP 219 : en cas de faillite, les créanciers sont répartis en 3 classes (salaires, rentes, autres). Les créances chirographaires (prêts ordinaires) sont en 3e classe. Le prêt d'un associé est en principe une créance ordinaire (pas automatiquement subordonnée). Cependant, la jurisprudence TF (sur la base du principe de prohibition du capital apparent) peut subordonner le prêt d'associé si la société était sous-capitalisée lors du prêt — la créance passe après toutes les autres. CO 757 : l'associé ne peut pas voter sur les points du contrat le concernant (conflit d'intérêt). CO 792 : la responsabilité des associés est limitée à leur part. 'Prêt 80k + contrat + intérêts + faillite + rang créancier ?' sans 'LP 219 classes de créanciers' ni 'subordination prêt associé si sous-capitalisation'. Signal adversarial = associé croit être un créancier ordinaire, ignore le risque de subordination si la société était déjà en difficulté au moment du prêt.",
  },

  // VOISINAGE — clôture du voisin empiète de 60 cm sur le terrain selon cadastre, voisin invoque la prescription (CC 641 / CC 667 / CC 669)
  {
    id: 'adv_voisinage_15',
    query: "J'ai fait faire un relevé cadastral après avoir acheté ma maison il y a 2 ans. Le géomètre confirme que la clôture en béton de mon voisin empiète de 62 cm sur mon terrain sur toute la longueur (18 mètres), soit une surface de plus de 11 m². Quand j'en ai parlé à mon voisin, il m'a dit 'ça fait 25 ans que cette clôture est là, c'est prescrit, elle est à moi maintenant'. A-t-il raison ? Est-ce qu'une clôture plantée sur mon terrain peut devenir la propriété du voisin par le simple passage du temps ?",
    canton: 'FR',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 641', 'CC 667', 'CC 662', 'CC 669'],
    notes: "Empiètement et prescription acquisitive (CC 641 / CC 662 / CC 667) — CC 641 al. 2 : le propriétaire peut revendiquer son bien contre quiconque le détient sans droit. CC 662 : la possession d'un immeuble à titre de propriétaire pendant 30 ans sans inscription au registre foncier ouvre la prescription acquisitive (usucapion) — mais ce délai court depuis la possession de bonne foi continue et sans interruption. 25 ans de possession d'une clôture = insuffisant pour l'usucapion ordinaire (30 ans CC 662). De plus, si la frontière n'est pas inscrite comme servitude au registre foncier, la prescription ne court pas automatiquement. CC 667 : l'action en bornage est imprescriptible — le propriétaire peut toujours demander une délimitation officielle. 'Empiètement 62 cm + 25 ans + voisin dit prescrit' sans 'CC 662 usucapion 30 ans (pas 25)' ni 'CC 667 action bornage imprescriptible'. Signal adversarial = propriétaire croit le voisin sur parole ('c'est prescrit'), ignore que la prescription acquisitive mobilière (CC 728) est 5 ans mais immobilière ordinaire (CC 662) est 30 ans, et que l'action en bornage est imprescriptible.",
  },

  // ASSURANCES — inondation cave après 3 semaines de vacances, assureur invoque une clause d'inoccupation longue durée (LCA 14 / LCA 6)
  {
    id: 'adv_assurances_13',
    query: "Je suis rentré de vacances il y a 3 jours (3 semaines d'absence) et j'ai découvert que ma cave était inondée à cause d'une rupture d'un tuyau d'alimentation. Dégâts estimés à 22'000 CHF (mobilier cave, local technique). Mon assurance ménage a envoyé un expert qui m'a dit que ma police contient une clause indiquant que les dommages survenus 'pendant une période d'inoccupation prolongée de plus de 30 jours consécutifs' ne sont pas couverts. Puis il a ajouté qu'ils allaient quand même 'examiner le dossier'. J'ai été absent exactement 22 jours. Peuvent-ils vraiment refuser ?",
    canton: 'BS',
    expected_domaine: 'assurances',
    expected_any_article: ['LCA 14', 'LCA 6', 'LCA 61', 'LCA 38'],
    notes: "Clause d'exclusion inoccupation et interprétation stricte (LCA 14 / LCA 6) — LCA 14 : les clauses d'exclusion doivent être rédigées clairement et de façon restrictive; toute ambiguïté s'interprète en faveur du preneur d'assurance (principe in dubio contra proferentem). Si la clause dit '>30 jours' et l'absence est de 22 jours, la condition d'exclusion n'est pas remplie — point final. LCA 6 : la description du risque assuré détermine la couverture; une clause d'exclusion ne peut que restreindre cette couverture, pas l'élargir par analogie. LCA 61 : l'assureur ne peut pas refuser l'indemnisation si la cause du sinistre (rupture de tuyauterie) est un risque assuré et que l'exclusion n'est pas strictement remplie. '22 jours + clause >30 jours + expert examine + 22k CHF' sans 'LCA 14 strict (22 < 30 = clause non remplie)' ni 'interprétation contra proferentem'. Signal adversarial = assuré croit que l'assureur peut 'examiner' et trouver un autre prétexte, ignore que l'absence de 22 jours exclut littéralement la clause invoquée.",
  },

  // FAMILLE — grands-parents maternels dont la fille est décédée veulent voir leurs petits-enfants, père refuse (CC 273 / CC 274)
  {
    id: 'adv_famille_19',
    query: "Notre fille est décédée d'un accident de la route il y a 18 mois. Elle laisse deux enfants de 6 et 9 ans que notre gendre a la garde exclusive. Depuis le décès, notre gendre a progressivement coupé tout contact — d'abord 'les enfants ont besoin de calme', puis plus de réponse à nos appels. Nous n'avons pas vu nos petits-enfants depuis 11 mois. Avons-nous, en tant que grands-parents, un droit légal à maintenir des relations avec eux, ou cela dépend-il entièrement de la bonne volonté de leur père ?",
    canton: 'NE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 273', 'CC 274', 'CC 275'],
    notes: "Droit propre aux relations des grands-parents (CC 273) — CC 273 al. 2 : les parents, grands-parents et frères et sœurs ont le droit d'entretenir des relations personnelles avec l'enfant; le juge peut ordonner un droit de visite si le titulaire de l'autorité parentale s'y oppose sans motif légitime. Il s'agit d'un droit PROPRE, pas seulement dérivé du droit de l'enfant — les grands-parents peuvent saisir le juge indépendamment. CC 274 al. 2 : le juge peut restreindre ou supprimer le droit de visite si l'intérêt de l'enfant l'exige — mais la simple résistance du parent gardien sans motif valable ne suffit pas. L'absence de contact depuis 11 mois constitue une violation des relations personnelles au sens de CC 273. 'Grands-parents + fille décédée + gendre refuse + 11 mois sans contact + droit légal ?' sans 'CC 273 al. 2 droit propre grands-parents' ni 'saisine du juge sans accord du père'. Signal adversarial = grands-parents croient dépendre de la tolérance du père, ignorent que CC 273 leur confère un droit propre actionnable en justice.",
  },

  // ETRANGERS — ressortissant algérien permis B depuis 7 ans, demande permis C, années de formation comptent-elles ? (LEI 34 / LEI 60 / OASA 84)
  {
    id: 'adv_etrangers_17',
    query: "Je suis algérien, j'ai étudié en Suisse de 2016 à 2019 avec un permis d'étudiant, puis j'ai obtenu un emploi et un permis B en octobre 2019. On m'a dit que pour avoir un permis C il faut 10 ans de séjour légal en Suisse. Avec mes 3 ans d'études en plus de mes 7 ans de permis B, j'aurais techniquement 10 ans de présence en Suisse depuis cette année. Est-ce que les années passées avec un permis étudiant comptent pour le calcul de durée vers le permis C ?",
    canton: 'ZH',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 34', 'LEI 60', 'OASA 84', 'LEI 96'],
    notes: "Durée de séjour et permis C — comptage des années d'études (LEI 34 / OASA 84) — LEI 34 al. 1 : l'autorisation d'établissement (permis C) est octroyée si l'étranger a séjourné régulièrement en Suisse pendant 10 ans. La question est de savoir si les années passées avec un permis d'étudiant (LEI 27) entrent dans le calcul. OASA 84 al. 1 : le séjour aux fins d'études (permis L ou B formation) compte en principe pour la durée de séjour, mais le SEM et les cantons ont une pratique variable — beaucoup de cantons ne comptent que les années de permis de travail (permis B activité lucrative). LEI 60 : exception pour les cas de rigueur (séjour long, intégration). La pratique ZH : les années d'études ne comptent généralement pas pour les 10 ans LEI 34 — le délai repart depuis le permis B de travail (2019), soit permis C possible en 2029. '3 ans étudiant + 7 ans B + 10 ans total + permis C ?' sans 'OASA 84 années études souvent non comptées' ni 'délai repart permis B activité lucrative'. Signal adversarial = ressortissant additionne naïvement les années sans savoir que la pratique cantonale distingue le type de permis.",
  },

  // HYBRIDE — travail non déclaré 3 ans pour un ami-employeur, brouille, citoyen veut récupérer ses droits AVS et vacances (CO 319 / LAVS 5 / CO 329)
  {
    id: 'adv_hybride_09',
    query: "Pendant 3 ans j'ai travaillé pour un ancien ami qui tient une boulangerie. On avait un arrangement verbal — je bossais 4 jours par semaine, il me payait 2'800 CHF en liquide par mois, sans contrat ni fiche de salaire. On vient d'avoir un énorme conflit personnel. Il refuse de me payer mes 3 derniers mois et dit que si je le poursuis il va 'tout nier'. Je n'ai aucun document, mais des virements irréguliers et des photos de moi au travail. Ai-je des droits malgré l'absence de contrat écrit et le paiement en liquide ? Et maintenant je réalise que je n'ai probablement aucune cotisation AVS depuis 3 ans.",
    canton: 'VS',
    expected_domaine: 'travail',
    expected_any_article: ['CO 319', 'CO 329', 'CO 336', 'LAVS 5', 'CO 323'],
    notes: "Contrat de travail verbal, preuve et cotisations AVS (CO 319 / LAVS 5) — CO 319 al. 1 : le contrat de travail n'exige aucune forme particulière — un contrat oral est valable. Les photos au travail, les virements et les témoignages constituent des moyens de preuve valables. CO 323 : le salaire est dû même si non acquitté par écrit. CO 329 al. 1 : le travailleur a droit à des vacances (4 semaines min.) indépendamment de la forme du contrat. LAVS 5 : les cotisations AVS sont dues par l'employeur sur tout salaire versé — l'absence de déclaration constitue une fraude AVS, et la caisse cantonale peut récupérer 3 ans de cotisations auprès de l'employeur (délai de prescription LAVS 82). Le fait que l'employeur nie est un risque procédural mais non absolu — le tribunal du travail apprécie les preuves librement. 'Verbal + liquide + 3 ans + brouille + ni contrat ni fiches + photos + virements + AVS ?' sans 'CO 319 contrat oral valable' ni 'LAVS 5 obligation AVS indépendante de l'accord' ni 'preuves alternatives admises'. Signal adversarial = citoyen croit qu'un accord non écrit et non déclaré n'a aucune valeur juridique, ignore la validité du contrat oral et la récupération des cotisations AVS.",
  },

  // === WAVE 23 ===

  // BAIL — état des lieux de sortie contesté a posteriori : bailleur absent à la remise des clés, PV unilatéral 12 jours plus tard (CO 267a / CO 257e)
  {
    id: 'adv_bail_25',
    query: "J'ai rendu mon appartement le 31 mai à 9h00. Le bailleur n'est pas venu à l'état des lieux — il m'avait dit par SMS qu'il 'passerait plus tard'. J'ai laissé les clés dans la boîte aux lettres. J'ai pris des photos de chaque pièce ce matin-là. 12 jours après, je reçois un recommandé avec un 'procès-verbal de sortie' unilatéral listant 3'800 CHF de dommages : peinture entière (9 ans d'occupation), salle de bain (calcaire), rayure parquet. Il annonce retenir ma caution de 2'400 CHF. Que peut-il facturer légalement après 9 ans ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 267a', 'CO 267', 'CO 257e', 'CO 268a'],
    notes: "État des lieux, usure normale et PV unilatéral a posteriori (CO 267a / CO 268a) — CO 267a al. 1 : à la fin du bail, le locataire restitue la chose dans l'état résultant d'un usage conforme. CO 267a al. 2 : l'usure résultant d'un usage normal (peinture jaunie, calcaire après 9 ans) n'est PAS à la charge du locataire — l'amortissement complet de la peinture est fixé à 8-10 ans. Un PV unilatéral établi 12 jours après la remise des clés, sans signature du locataire, a une valeur probante très limitée devant la commission de conciliation bail. Les photos prises le jour J sont une preuve opposable. CO 257e : la caution ne peut être retenue que pour des dommages prouvés dépassant l'usure normale. '9 ans + bailleur absent + PV unilatéral 12 jours + peinture + calcaire' sans 'CO 267a al. 2 usure normale' ni 'PV sans co-signature = preuve faible' ni 'peinture 9 ans = amortie'. Signal adversarial = locataire croit que l'absence d'état des lieux co-signé l'expose à toutes les demandes du bailleur.",
  },

  // TRAVAIL — congé de paternité légal 2 semaines refusé par PME (CO 329g / LAPG 16e)
  {
    id: 'adv_travail_27',
    query: "Mon fils est né le 15 juin. J'ai demandé à mon patron (PME de 8 employés, boulangerie) mon congé de paternité de 2 semaines. Il m'a répondu que 'ça n'existait pas dans leur secteur' et que 'le congé paternité c'est une faveur, pas une obligation'. Il m'a proposé 3 jours de congé non payé. J'ai entendu que la loi avait changé en 2021 mais mon patron semble sincèrement ignorer ça. Ai-je vraiment droit à 2 semaines et comment les indemnités sont-elles payées ?",
    canton: 'FR',
    expected_domaine: 'travail',
    expected_any_article: ['CO 329g', 'LAPG 16e', 'LAPG 16i', 'CO 362'],
    notes: "Congé de paternité légal 2 semaines depuis 1er janvier 2021 (CO 329g / LAPG 16e) — CO 329g al. 1 : le père a droit à un congé de paternité de deux semaines, à prendre dans les six mois suivant la naissance. Ce droit est impératif (CO 362) — toute convention moins favorable est nulle. La taille de l'entreprise est sans pertinence. LAPG 16e : l'indemnité APG paternité = 80% du revenu moyen soumis à l'AVS, max 220 CHF/jour. LAPG 16i : le droit s'éteint 6 mois après la naissance. L'employeur verse le salaire puis est remboursé par l'APG. 'Père + naissance + PME + patron dit faveur pas obligation + 2021' sans 'CO 329g = droit légal depuis 01.01.2021' ni 'CO 362 impératif' ni 'APG 80% remboursé'. Signal adversarial = père croit le patron qui présente le congé comme facultatif, ignore que CO 329g est entré en vigueur en 2021 et est impératif.",
  },

  // DETTES — saisie de compte bancaire : salaire déposé gelé le jour même, minimum vital (LP 93 / LP 89 / LP 130)
  {
    id: 'adv_dettes_22',
    query: "L'office des poursuites a saisi mon compte bancaire UBS à la demande d'un créancier (loyer impayé 4'200 CHF). La banque a gelé la totalité de mon solde : 3'150 CHF qui correspondent exactement au salaire que mon employeur venait de virer ce matin-là. J'ai deux enfants à charge et aucun autre revenu. L'office dit que c'est au juge de décider, la banque dit qu'elle ne peut rien faire. Puis-je récupérer quelque chose rapidement pour payer loyer et épicerie ?",
    canton: 'GE',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 93', 'LP 89', 'LP 130', 'LP 92'],
    notes: "Protection du minimum vital : salaire viré sur compte saisi (LP 93 / LP 89) — LP 89 al. 1 : la saisie du salaire se limite au surplus dépassant le minimum vital (LP 93). LP 93 al. 1 : le revenu insaisissable comprend le minimum vital du débiteur et de sa famille — avec 2 enfants à GE, environ 2'600–3'000 CHF. LP 130 : le salaire déjà viré sur compte devient techniquement une créance bancaire, mais les fonds provenant du salaire récemment versé conservent leur protection LP 93 si le débiteur prouve l'origine et la nécessité (minimum vital). Procédure d'urgence : demander à l'office des poursuites l'établissement du minimum vital (formulaire urgent), la banque débloque le surplus insaisissable. '3150 CHF salaire viré + gelé + 2 enfants + office dit juge + banque dit rien' sans 'LP 93 minimum vital' ni 'salaire récent protégé' ni 'demande urgente office'. Signal adversarial = citoyen croit son salaire perdu une fois saisi, ignore que LP 93 protège le minimum vital même après virement.",
  },

  // FAMILLE — pension alimentaire pendant procédure de divorce : mesures provisoires immédiates (CC 176 / CPC 276)
  {
    id: 'adv_famille_20',
    query: "Mon mari a déposé une demande de divorce unilatérale en janvier. Depuis mars il ne verse plus rien pour moi ni pour nos 2 enfants (6 et 9 ans). Il dit que 'tant que le juge n'a pas statué on verra'. La procédure peut durer 2-3 ans. Je travaille à 40% (600 CHF/mois) et lui gagne 8'000 CHF/mois. Je ne peux pas attendre 3 ans pour une contribution d'entretien. Y a-t-il quelque chose à faire maintenant ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 176', 'CC 173', 'CPC 276', 'CC 163'],
    notes: "Mesures provisionnelles pendant procédure de divorce (CC 176 / CPC 276) — CC 176 al. 1 ch. 1 : dès le dépôt de la demande de divorce, le juge peut ordonner des mesures provisionnelles, notamment fixer la contribution d'entretien. Ces mesures s'obtiennent rapidement (4-8 semaines) et s'appliquent sans attendre le jugement final. CPC 276 al. 1 : le tribunal ordonne les mesures provisionnelles nécessaires pendant la procédure. CC 173 al. 1 : le juge du domicile de l'un ou l'autre époux peut statuer sur les mesures provisionnelles. CC 163 : les époux se doivent assistance — obligation maintenue jusqu'au prononcé du divorce. 'Divorce en cours + mari 8k CHF + rien versé mars + dure 3 ans + 2 enfants' sans 'CC 176 mesures provisionnelles immédiates' ni 'CPC 276 demande urgente' ni 'sans attendre jugement final'. Signal adversarial = épouse croit devoir attendre le jugement de divorce, ignore que CC 176 permet des mesures en quelques semaines.",
  },

  // ACCIDENT — accident de ski par skieur fautif, RC civile et subrogation LAA (CC 41 / LAA 6 / CC 47)
  {
    id: 'adv_accident_09',
    query: "En janvier sur les pistes de Verbier, un skieur à grande vitesse m'a percuté par derrière sur une piste bleue. Fracture du plateau tibial gauche — opération, 3 mois plâtre, 4 mois de rééducation. Manque à gagner environ 18'000 CHF (je suis indépendante). Mon assurance accident SUVA couvre les soins et l'indemnité journalière à 80% du revenu déclaré. Je connais l'identité du skieur. Puis-je le poursuivre pour le différentiel et les souffrances ?",
    canton: 'VS',
    expected_domaine: 'assurances',
    expected_any_article: ['CC 41', 'LAA 6', 'LAA 16', 'CC 47'],
    notes: "Responsabilité civile du skieur fautif et subrogation LAA (CC 41 / LAA 6) — CC 41 al. 1 : quiconque cause illicitement un dommage à autrui par négligence est tenu à réparation — skieur percutant par derrière à grande vitesse = faute (règles FIS). CC 47 : en cas de lésions corporelles, indemnité équitable à titre de tort moral. LAA 6 : la SUVA couvre l'AANP — prestations (soins + IJM 80%) versées à titre primaire. Subrogation LAA 72/73 : la SUVA se subroge dans les droits de la victime contre le tiers responsable — la victime réclame au skieur fautif uniquement le dommage non couvert par la LAA (20% du salaire + tort moral + manque à gagner d'indépendante dépassant les IJM). La RC du skieur est typiquement couverte par son assurance ménage (clause RC). 'Fracture + LAA 80% + skieur fautif identifié + manque à gagner + tort moral' sans 'CC 41 RC directe contre skieur' ni 'subrogation LAA' ni 'CC 47 tort moral indépendant'. Signal adversarial = victime croit que la LAA règle tout, ignore que la RC CC 41 couvre le différentiel + tort moral.",
  },

  // ETRANGERS — étrangère mariée à un Suisse, divorce après 3 ans, enfant suisse : peut-elle rester ? (LEI 50 / LEI 51 / CC 25)
  {
    id: 'adv_etrangers_18',
    query: "Je suis ressortissante brésilienne. J'ai épousé un Suisse en 2021, j'ai obtenu un permis B regroupement familial. Nous nous séparons maintenant (3 ans de mariage). Nous avons une fille de 2 ans née en Suisse, donc suissesse. Mon mari veut le divorce. Il m'a dit que 'sans lui' je devrai quitter la Suisse. J'ai peur de perdre mon titre de séjour. Qu'est-ce que je risque vraiment ?",
    canton: 'GE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 50', 'LEI 51', 'LEI 44', 'CC 25'],
    notes: "Droit de séjour résiduel après divorce, enfant suisse (LEI 50 / LEI 51 / CC 25) — LEI 50 al. 1 : après dissolution du mariage, le droit au séjour subsiste si l'union a duré au moins 3 ans ET que l'intégration est réussie (let. a) OU raisons personnelles majeures (let. b). 3 ans = seuil exactement atteint. LEI 51 al. 2 : le droit au séjour du parent étranger subsiste aussi longtemps qu'il exerce l'autorité parentale sur l'enfant et entretient des relations avec lui. CC 25 al. 1 : l'enfant né d'un parent suisse acquiert la nationalité suisse. L'enfant suisse renforce considérablement l'ancrage de la mère via LEI 51 al. 2. 'Brésilienne + 3 ans mariage + fille suisse 2 ans + divorce + mari dit partir' sans 'LEI 50 al. 1 let. a 3 ans + intégration' ni 'LEI 51 al. 2 enfant suisse = ancrage fort'. Signal adversarial = mère étrangère croit que le permis tombe avec le divorce, ignore les droits résiduels LEI 50/51 renforcés par la nationalité suisse de l'enfant.",
  },

  // CIRCULATION — téléphone au volant LCR 31a, opposition ordonnance pénale, risque d'aggravation ? (LCR 31a / CPP 352 / CPP 356)
  {
    id: 'adv_circulation_10',
    query: "J'ai été contrôlé le 8 mai : téléphone tenu en main au volant à un feu rouge. Ordonnance pénale de 250 CHF + rapport à l'autorité des permis. Pas d'antécédent. Un collègue dit que si je fais opposition 'le juge peut aggraver la sanction' et qu'il vaut mieux payer. L'opposition est-elle vraiment risquée ? Et l'inscription au casier judiciaire est-elle inévitable ?",
    canton: 'ZH',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 31a', 'CPP 352', 'CPP 356', 'LCR 90'],
    notes: "LCR 31a téléphone volant et opposition ordonnance pénale (CPP 352 / CPP 356) — LCR 31a al. 1 (depuis oct. 2021) : téléphone tenu en main = infraction. CPP 352 al. 1 : opposition écrite dans les 10 jours. CPP 356 al. 3 : le tribunal ne peut prononcer une peine plus sévère sans avertissement préalable — la reformatio in peius est interdite sauf si le MP aggrave ses réquisitions. Le mythe 'l'opposition aggrave automatiquement' est faux pour les 1ères infractions simples : le risque d'aggravation par le MP est marginal. LCR 90 al. 1 : infraction légère = amende, sans inscription au casier judiciaire VOSTRA si sanction = amende uniquement. '250 CHF + 1ère infraction + feu rouge + collègue dit risque aggravation' sans 'CPP 356 reformatio in peius protège' ni 'LCR 90 infraction légère pas de casier' ni '10 jours délai'. Signal adversarial = contrevenant croit le mythe de l'aggravation, ignore la protection CPP 356.",
  },

  // SANTE — HMO médecin de famille, référent parti, changement refusé pendant 'période de blocage' (LAMal 41 / OAMal 93a)
  {
    id: 'adv_sante_12',
    query: "Il y a 2 ans j'ai souscrit un modèle HMO (médecin de famille) chez CSS pour la prime réduite. Mon médecin référent a quitté le cabinet il y a 4 mois. CSS m'a désigné un nouveau médecin que je ne connais pas et avec qui le contact ne passe pas. CSS dit que je dois rester avec le médecin attribué pendant encore 10 mois (fin du contrat alternatif). Je souffre d'anxiété sévère — la relation de confiance est pour moi une condition de soins. Existe-t-il une exception légale ?",
    canton: 'BE',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 41', 'OAMal 93a', 'LAMal 93', 'LAMal 7'],
    notes: "Modèle HMO : départ du médecin référent et exception médicale (LAMal 41 / OAMal 93a) — LAMal 41 al. 4 : dans les modèles alternatifs, l'assuré limite son libre choix en échange de primes réduites. OAMal 93a : les CGA du modèle alternatif doivent prévoir une procédure de changement si le médecin référent part — l'assuré a le droit à un médecin de remplacement acceptable parmi le réseau, pas uniquement celui désigné unilatéralement. Le départ du référent (4 mois) modifie la base contractuelle : l'assuré peut légitimement demander un choix. Exception médicale psychiatrique/psychologique : la relation thérapeutique est une condition de traitement reconnue par les directives OFSP. LAMal 7 al. 2 : changement d'assureur (et de modèle) possible au 30 novembre. '2 ans HMO + médecin parti + nouveau désigné + blocage 10 mois + anxiété sévère' sans 'OAMal 93a droit à choix si référent parti' ni 'exception médicale anxiété' ni 'LAMal 7 sortie modèle nov.'. Signal adversarial = assurée croit que le blocage HMO est absolu, ignore le droit à choix si le référent quitte.",
  },

  // HYBRIDE — couple non marié copropriétaires d'un appartement, séparation, l'un refuse de vendre (CC 646 / CC 650 / CC 651)
  {
    id: 'adv_hybride_10',
    query: "Mon compagnon et moi avons acheté un appartement ensemble en 2019 (50/50 au registre foncier). On se sépare. Je veux vendre car ni lui ni moi ne peut racheter la part de l'autre. Il refuse absolument, dit qu'il 'a le droit de rester'. On n'est pas mariés et sans contrat de concubinage. J'ai continué à payer ma moitié du prêt hypothécaire. Peut-il me bloquer indéfiniment ?",
    canton: 'GE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 646', 'CC 650', 'CC 651', 'CO 533'],
    notes: "Copropriété et droit de partage imprescriptible (CC 646 / CC 650 / CC 651) — CC 646 al. 1 : la copropriété confère à chaque copropriétaire une quote-part sur la chose indivise. CC 650 al. 1 : tout copropriétaire peut exiger à tout moment le partage — droit imprescriptible. CC 651 al. 1 : si les copropriétaires ne s'entendent pas, le juge ordonne la vente aux enchères publiques (licitation) et répartit le produit. CO 533 : dissolution possible de la société simple tacite. L'absence de mariage est sans pertinence — CC 650 donne un droit absolu de demander le partage à tout moment. '50/50 + non mariés + séparation + refuse de vendre + hypothèque payée' sans 'CC 650 droit de partage imprescriptible' ni 'CC 651 licitation judiciaire' ni 'refus = voie judiciaire'. Signal adversarial = copropriétaire croit que le compagnon peut bloquer à vie, ignore le droit imprescriptible de CC 650.",
  },

  // FISCAL — plus-value immeuble en France par résident suisse, double imposition F/CH ? (CDI art. 13 / LIFD 21)
  {
    id: 'adv_fiscal_08',
    query: "J'ai hérité il y a 3 ans d'un appartement à Antibes (France) de ma mère française. Je suis suisse, domicilié à Zurich. Je viens de vendre cet appartement et j'ai réalisé une plus-value nette de 85'000 EUR après impôt français sur les plus-values immobilières (environ 45'000 EUR prélevés en France). Ma banque suisse et l'AFC me disent que 'les revenus étrangers sont imposables en Suisse'. Est-ce que je vais être imposé deux fois ?",
    canton: 'ZH',
    expected_domaine: 'fiscal',
    expected_any_article: ['LIFD 21', 'LIFD 6', 'LIFD 16'],
    notes: "Double imposition F/CH sur plus-value immobilière (CDI art. 13 / LIFD 21) — Convention de double imposition F/CH art. 13 al. 1 : les gains provenant de l'aliénation de biens immobiliers situés en France sont imposables en France exclusivement (territorialité immobilière). LIFD 21 al. 2 (méthode d'exonération) : les revenus immobiliers étrangers sont exonérés de l'IFD suisse mais peuvent influencer le taux marginal sur les revenus suisses (progression). Au niveau cantonal ZH : même principe d'exemption avec progression. Résultat : la plus-value de 85k EUR n'est PAS réimposée en Suisse — mais elle peut augmenter le taux applicable aux autres revenus suisses de l'année. Le domaine fiscal est un blind spot complet chez JPT — 0% attendu. '85k EUR + impôt France déjà payé + AFC dit imposable + double imposition ?' sans 'CDI art. 13 France exclusive' ni 'LIFD 21 exonération + progression seulement'. Signal adversarial = contribuable suisse croit à la double imposition, ignore la CDI F/CH qui attribue l'imposition exclusive à la France.",
  },

  // WAVE 24 — 10 nouveaux cas, angles inédits, écrits sans consulter le dico du retriever

  // BAIL — prolongation bail famille monoparentale, résiliation ordinaire bailleur vente (CO 272 / CO 273a)
  {
    id: 'adv_bail_26',
    query: "Je suis mère seule avec trois enfants (4, 8 et 12 ans). Mon bailleur a résilié mon bail pour le 31 octobre — il dit qu'il veut vendre l'appartement. J'ai reçu le congé en bonne et due forme il y a 4 mois. Je n'ai pas trouvé de logement adapté à 4 personnes dans mon budget dans la région. Mon assistante sociale me dit que je peux demander une prolongation mais que ça ne marche pas toujours. Quelle est la procédure et combien de temps puis-je espérer ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 272', 'CO 273', 'CO 273a', 'CO 271'],
    notes: "Prolongation du bail et famille monoparentale (CO 272 / CO 273a) — CO 272 al. 1 : le locataire peut requérir la prolongation lorsque la fin du contrat lui causerait des conséquences pénibles et que les intérêts du bailleur ne le justifient pas. CO 272 al. 2 : les juges tiennent compte de la situation personnelle, durée du bail, présence d'enfants. CO 273 al. 1 : la demande de prolongation doit être adressée à l'autorité de conciliation dans les 30 jours suivant le congé. CO 273a : une prolongation maximum de 4 ans pour logements de famille avec enfants. '3 enfants + mère seule + résiliation vente + aucun logement trouvé + prolongation?' sans 'CO 272 pesée d'intérêts' ni 'CO 273a jusqu'à 4 ans' ni 'délai 30 jours conciliation'. Signal adversarial = locataire ignore que la procédure de prolongation est distincte de la contestation du congé.",
  },

  // TRAVAIL — travail de nuit régulier, droit aux contreparties et examen médical (LTr 17b / LTr 26)
  {
    id: 'adv_travail_28',
    query: "Je suis boulanger depuis 7 ans dans la même boulangerie. Je travaille de nuit 5 nuits par semaine (22h-6h). Mon employeur ne m'a jamais proposé d'examen médical ni payé de supplément pour le travail de nuit — il dit que 'les boulangers c'est comme ça'. Depuis 1 an j'ai des troubles du sommeil sévères et mon médecin recommande de travailler de jour. Mon employeur dit qu'il n'y a pas de poste de jour disponible. Quels sont mes droits ?",
    canton: 'FR',
    expected_domaine: 'travail',
    expected_any_article: ['LTr 17b', 'LTr 26', 'CO 328'],
    notes: "Travail de nuit régulier : contreparties et protection santé (LTr 17b / LTr 26) — LTr 17b al. 1 : les travailleurs occupés régulièrement la nuit ont droit à une compensation (supplément au moins 10%). LTr 26 al. 1 : l'employeur doit proposer une visite médicale gratuite dès 12 mois de travail nocturne régulier. OLT 4 art. 16 : en cas de contre-indication médicale, l'employeur doit affecter le travailleur à un poste de jour si possible. CO 328 : protection de la santé du travailleur. '7 ans nuit + aucun examen médical + aucun supplément + troubles sommeil + médecin dit de jour + patron refuse' sans 'LTr 17b supplément 10%' ni 'LTr 26 examen médical obligatoire' ni 'reclassement si contre-indication'. Signal adversarial = travailleur nocturne croit que ces conditions sont normales, ignore ses droits LTr.",
  },

  // DETTES — codébiteurs solidaires, recours interne entre cosignataires (CO 143 / CO 148 / CO 149)
  {
    id: 'adv_dettes_23',
    query: "En 2018 mon frère et moi avons cosigné un prêt personnel de 25'000 CHF à la banque Migros pour financer une voiture — à l'époque il remboursait et moi j'étais cosignataire. Depuis 2021 il ne paie plus rien et a fait une faillite personnelle. La banque me réclame maintenant la totalité des 18'400 CHF restants. J'ai payé 3 mensualités depuis. Est-ce que je peux me retourner contre mon frère même s'il est en faillite ? Et dois-je vraiment rembourser tout seul les 18'400 CHF ?",
    canton: 'BE',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 143', 'CO 148', 'CO 149', 'LP 219'],
    notes: "Solidarité parfaite et recours interne entre codébiteurs (CO 143 / CO 148 / CO 149) — CO 143 al. 1 : la banque peut réclamer la totalité à l'un ou l'autre des codébiteurs solidaires. CO 148 al. 2 : le débiteur qui a payé au-delà de sa part peut exercer un recours contre les autres, au prorata (ici 50/50). CO 149 al. 1 : le débiteur subrogé peut participer à la faillite du codébiteur insolvable. LP 219 : rang des créances dans la faillite. 'Cosignataires + frère faillite + banque réclame tout + 3 mensualités payées' sans 'CO 148 recours interne 50%' ni 'CO 149 production dans faillite' ni 'je ne dois que ma moitié'. Signal adversarial = codébiteur croit devoir tout payer, ignore le recours interne CO 148.",
  },

  // FAMILLE — autorité parentale exclusive pour parent absent depuis 2 ans (CC 296 / CC 298b / CC 304)
  {
    id: 'adv_famille_21',
    query: "Le père de mon fils (8 ans) ne l'a pas vu depuis 2 ans et ne paie pas la pension. Il est introuvable — la dernière adresse connue est à Zurich mais il est parti sans laisser d'adresse. J'ai l'autorité parentale conjointe depuis notre séparation (on n'était pas mariés). Je dois choisir une école secondaire cet été (inscription délai 30 juin), et un traitement médical est en attente de sa signature. Comment obtenir l'autorité exclusive sans lui ?",
    canton: 'GE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 296', 'CC 298b', 'CC 297', 'CC 304'],
    notes: "Autorité parentale exclusive pour parent absent (CC 296 / CC 297 / CC 298b / CC 304) — CC 296 al. 2 : si l'autorité parentale conjointe nuit au bien de l'enfant, le juge peut l'attribuer à un seul parent. CC 298b al. 3 : le tribunal peut modifier le régime d'autorité parentale si les circonstances ont changé. CC 297 al. 2 : un parent peut exercer seul l'autorité parentale si l'autre est absent ou empêché. CC 304 al. 1 : pour les actes urgents, chaque parent peut agir seul si l'autre est injoignable. 'Père absent 2 ans + introuvable + pension impayée + autorité conjointe + école délai 30 juin + signature médicale' sans 'CC 298b modification autorité' ni 'CC 304 actes urgents seul'. Signal adversarial = mère croit bloquée, ignore que l'absence avérée permet d'agir seul.",
  },

  // ETRANGERS — ressortissant hors-UE, perte emploi faillite employeur, délai séjour (LEI 61a / OASA 77b)
  {
    id: 'adv_etrangers_19',
    query: "Je suis ressortissant togolais avec un permis B depuis 4 ans. Mon employeur (garage automobile à Lausanne) a fait faillite en mars. Je suis au chômage depuis 3 mois. L'office cantonal des migrations m'a écrit que mon permis B 'peut être révoqué si je ne retrouve pas un emploi rapidement'. J'ai des entretiens mais rien de signé. Je panique — combien de temps ai-je vraiment avant qu'ils révoquent mon permis ?",
    canton: 'VD',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 61a', 'LEI 62', 'LEI 33'],
    notes: "Permis B hors-UE et perte d'emploi : délai légal avant révocation (LEI 61a / OASA 77b) — LEI 62 al. 1 let. e : révocation possible si dépendance notable à l'aide sociale. OASA 77b : un délai raisonnable doit être accordé (6-12 mois en pratique). LACI : tant qu'il perçoit des indemnités chômage, il ne dépend pas de l'aide sociale — révocation immédiate non légale. '4 ans permis B + faillite employeur + chômage 3 mois + lettre migration révocation + entretiens en cours' sans 'OASA 77b délai 6-12 mois' ni 'LACI = pas aide sociale donc pas révocation immédiate'. Signal adversarial = citoyen hors-UE croit la révocation imminente, ignore que les indemnités chômage protègent.",
  },

  // SANTE — médicament hors LS (off-label), procédure de prise en charge individuelle (OAMal 71a / LAMal 52)
  {
    id: 'adv_sante_13',
    query: "J'ai un cancer du sein rare (HER2 faible). Mon oncologue a prescrit un médicament approuvé par Swissmedic mais pas encore sur la liste des spécialités LAMal pour mon indication précise — usage 'hors-indication'. Le médicament coûte 12'000 CHF/mois. Ma caisse Helsana a refusé la prise en charge. Y a-t-il un recours légal ?",
    canton: 'ZH',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 52', 'LPGA 52', 'OAMal 71a'],
    notes: "Médicament hors-LS et prise en charge individuelle (OAMal 71a / LAMal 52) — OAMal 71a al. 1 : un médicament Swissmedic mais non listé pour l'indication peut être pris en charge si a) aucune alternative inscrite, b) avantage thérapeutique important, c) coût proportionné. La caisse doit statuer dans 30 jours sur demande du médecin. En cas de refus : opposition LPGA 52 → tribunal cantonal. 'Cancer rare + médicament Swissmedic + hors LS + 12k CHF/mois + Helsana refuse' sans 'OAMal 71a demande individuelle médecin 30 jours' ni 'LPGA 52 opposition puis tribunal'. Signal adversarial = patiente ignore la voie OAMal 71a, pense que le refus de liste est définitif.",
  },

  // VOISINAGE — pompe à chaleur air-air, nuisances sonores, CC 684 indépendant de l'OPB (CC 684 / CC 679)
  {
    id: 'adv_voisinage_16',
    query: "Mon voisin a installé une pompe à chaleur air-air externe directement face à ma chambre à coucher (2,5 m de distance). Les mesures de la commune indiquent 58 dB(A) le soir — en-dessous du seuil OPB de 60 dB pour ma zone résidentielle. La commune dit que c'est 'légal' donc rien à faire. Mais je n'arrive plus à dormir avec ce ronronnement constant depuis 8 mois. Y a-t-il une autre voie légale que l'OPB ?",
    canton: 'GE',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 684', 'CC 679', 'CC 679a'],
    notes: "Immissions sonores pompe à chaleur : CC 684 indépendant de l'OPB (CC 684 / CC 679) — CC 684 al. 2 : les immissions excédant la mesure tolérée selon la situation des fonds sont interdites — standard civil INDÉPENDANT des seuils administratifs OPB. Le fait que 58 dB soient sous le seuil OPB (60 dB) n'est pas déterminant pour CC 684 : le juge civil apprécie selon les circonstances (2.5m de la chambre, nocturne, 8 mois). CC 679 al. 1 : responsabilité du propriétaire pour immissions excessives. CC 679a : action en cessation immédiate. '58 dB + commune dit légal OPB + chambre + 8 mois + ronronnement' sans 'CC 684 indépendant de l'OPB' ni 'CC 679a action en cessation civile'. Signal adversarial = voisin croit la décision administrative définitive, ignore que CC 684 donne une voie civile autonome.",
  },

  // CIRCULATION — cumul d'infractions légères et requalification en infraction moyennement grave (LCR 16 / LCR 16b)
  {
    id: 'adv_circulation_11',
    query: "J'ai eu un stop grillé en 2023 (amende 280 CHF, avertissement sans retrait de permis) et un excès de 12 km/h en 2024 (amende 200 CHF). Maintenant l'autorité des permis m'écrit que 'la deuxième infraction légère dans les 10 ans équivaut à une infraction moyennement grave' et me menace d'un retrait de permis d'un mois. Je ne comprends pas — les deux infractions étaient 'légères' séparément. Comment peut-on les combiner pour un retrait ?",
    canton: 'ZH',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 16', 'LCR 16a', 'LCR 16b'],
    notes: "Cumul d'infractions légères et requalification en infraction moyennement grave (LCR 16b) — LCR 16 al. 2 : une infraction légère entraîne un avertissement. LCR 16b al. 1 : une infraction moyennement grave entraîne un retrait d'un mois minimum. Principe de 'récidive qualifiante' : une 2e infraction légère dans les 10 ans est requalifiée en infraction moyennement grave. Ce n'est pas un cumul de deux peines — c'est une requalification du comportement global. '2 infractions légères + 10 ans + avertissement avant + retrait 1 mois + comment combiner ?' sans 'LCR 16b récidive qualifiante' ni 'requalification infraction moyennement grave'. Signal adversarial = conducteur croit que 2 légères ne peuvent pas déclencher retrait, ignore LCR 16b.",
  },

  // ASSURANCES SOCIALES — prestations complémentaires coupées après donation (LPC 10 / LPC 11)
  {
    id: 'adv_social_11',
    query: "Je suis à la retraite (71 ans) avec une rente AVS de 1'820 CHF et des prestations complémentaires de 640 CHF/mois. Mon patrimoine était de 8'400 CHF. En mai, ma fille m'a offert 20'000 CHF pour mon anniversaire (virement bancaire). L'office PC vient de me couper les prestations complémentaires 'car mon patrimoine dépasse désormais le seuil'. Ma fille veut reprendre l'argent pour éviter la coupure mais l'office dit que c'est trop tard. Ont-ils raison ?",
    canton: 'VD',
    expected_domaine: 'assurances',
    expected_any_article: ['LPC 10', 'LPC 9', 'LPGA 25', 'LPC 11'],
    notes: "Prestations complémentaires, seuil de fortune et dessaisissement (LPC 10 / LPC 11) — LPC 9a al. 2 : les PC sont supprimées si la fortune dépasse le seuil (25'000 CHF pour une personne seule depuis 2021). LPC 11 al. 1 let. g : si la fortune a été transférée sans contre-prestation, l'office peut imputer la fortune dessaisie pendant 10 ans. Même si la fille 'reprend' les 20k CHF, l'office peut maintenir l'imputation comme dessaisissement apparent. Recours LPGA 52 : opposition dans les 30 jours. '71 ans + PC 640/mois + gift 20k fille + fortune 28k > seuil + reprendre l'argent?' sans 'LPC 11 dessaisissement imputé 10 ans' ni 'LPGA 52 opposition 30 jours'. Signal adversarial = bénéficiaire PC croit que rendre l'argent efface le dépassement, ignore la règle de dessaisissement LPC.",
  },

  // ENTREPRISE — droit d'information actionnaire SA, procès-verbaux AG refusés (CO 697 / CO 697a / CO 697b)
  {
    id: 'adv_entreprise_11',
    query: "Je suis actionnaire minoritaire dans une SA familiale (j'ai 12% du capital). Je soupçonne que le CA gère mal la société — les comptes présentés à l'AG me semblent ne pas refléter la réalité. J'ai demandé par écrit les procès-verbaux des 3 dernières AG et les comptes détaillés. Le CA refuse, disant que c'est 'confidentiel' et que 'vous n'avez qu'à faire confiance à la direction'. Ai-je un droit légal d'accès à ces documents ?",
    canton: 'ZH',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 697', 'CO 697a', 'CO 697b'],
    notes: "Droit d'information de l'actionnaire SA et ses limites (CO 697 / CO 697a) — CO 697 al. 1 : chaque actionnaire peut demander à l'AG des renseignements sur les affaires. CO 697a al. 1 : tout actionnaire peut consulter les PV des AG au siège social dans les délais légaux. CO 697b : le juge peut ordonner la production si le CA s'y oppose sans motif légitime. La confidentialité 'générale' du CA ne suffit pas. 12% > 10% = seuil pour demander un contrôle spécial CO 697c. 'SA familiale + 12% + demande PV AG + CA dit confidentiel + faire confiance' sans 'CO 697a droit de consultation PV AG' ni 'CO 697b juge peut ordonner production'. Signal adversarial = actionnaire croit que la direction peut refuser arbitrairement, ignore le droit légal CO 697/697a.",
  },

  // === WAVE 25 — 2026-06-27 ===

  // BAIL — rénovation énergétique imposée par le bailleur pendant occupation, réduction loyer pendant travaux (CO 259d / CO 260)
  {
    id: 'adv_bail_27',
    query: "Mon propriétaire a décidé de faire remplacer toutes les fenêtres et d'isoler les murs extérieurs de l'immeuble. Les travaux durent 7 semaines : ouvriers tous les jours à partir de 7h, poussière, bruit de perceuse, ma cuisine inutilisable une semaine entière. Il m'a juste envoyé un avis écrit et dit que 'c'est une amélioration donc vous ne pouvez rien réclamer'. Est-ce vrai que je n'ai aucun droit à une réduction de loyer pendant ces travaux même s'ils sont imposés ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 259d', 'CO 260', 'CO 259a'],
    notes: "Réduction loyer pendant travaux bailleur (CO 259d / CO 260) — CO 259d al. 1 : si le bailleur effectue des travaux qui rendent la chose plus ou moins impropre à l'usage convenu, le locataire peut exiger une réduction proportionnelle du loyer pour la durée de la gêne. CO 260 al. 1 : le bailleur peut effectuer des travaux de rénovation avec un préavis raisonnable — mais le locataire conserve ses droits CO 259d. L'argument 'amélioration donc pas de réduction' est partiellement faux : même les travaux d'amélioration donnent droit à réduction si l'usage est perturbé. 7 semaines × 7h/jour de bruit + cuisine inutilisable = gêne chiffrable. '7 semaines + bruit 7h + cuisine inutilisable + bailleur dit amélioration donc rien' sans 'CO 259d réduction proportionnelle usage perturbé' ni 'même travaux amélioration ouvrent droit réduction'. Signal adversarial = locataire accepte l'argument 'amélioration = pas de droits', ignore CO 259d.",
  },

  // FAMILLE — couple non-marié séparé, père refuse pension sans jugement, mesures provisoires rapides (CC 276 / CPC 276)
  {
    id: 'adv_famille_22',
    query: "Je ne suis pas mariée. Mon compagnon et moi nous sommes séparés il y a 3 mois et j'ai la garde de notre fils de 4 ans. Son père ne paie rien depuis la séparation. Il dit qu'il n'a 'aucune obligation légale sans jugement de tribunal'. Je n'ai pas les moyens d'un avocat et une procédure complète prend des mois. Existe-t-il un moyen rapide et peu coûteux d'obtenir une contribution pour mon fils ?",
    canton: 'GE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 276', 'CC 285', 'CPC 276'],
    notes: "Pension alimentaire enfant hors mariage et mesures provisoires urgentes (CC 276 / CPC 276) — CC 276 al. 1 : l'obligation d'entretien de l'enfant est indépendante du statut matrimonial des parents — le père doit contribuer dès la naissance. CPC 276 al. 1 : le juge peut ordonner des mesures provisoires pour assurer l'entretien de l'enfant pendant la procédure (délai = quelques semaines). Le père a tort : l'obligation alimentaire ne requiert aucun jugement préalable pour exister, seulement pour l'exécution forcée. 'Non-mariés + séparé 3 mois + fils 4 ans + père dit pas obligé sans jugement + pas d'avocat + urgent' sans 'CC 276 obligation alimentaire indépendante mariage' ni 'CPC 276 mesures provisoires rapides'. Signal adversarial = mère croit que la non-cohabitation efface l'obligation alimentaire du père non-marié.",
  },

  // DETTES — voiture indispensable au travail saisie par l'huissier malgré l'absence de transport public (LP 92)
  {
    id: 'adv_dettes_24',
    query: "Un huissier est venu chez moi hier matin et a inscrit ma voiture (Toyota Yaris 2015, valeur ~4'500 CHF) sur la liste de saisie. C'est ma seule voiture et je l'utilise pour me rendre au travail — je suis aide-soignante dans une maison de retraite à 28 km de chez moi, sans aucun transport en commun sur ce trajet à 6h du matin. L'huissier a dit que 'les voitures ne sont pas protégées par la loi'. Est-ce vrai ?",
    canton: 'FR',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 92', 'LP 93'],
    notes: "Biens insaisissables : outil de travail indispensable (LP 92 / LP 93) — LP 92 al. 1 ch. 11 : les objets indispensables à l'exercice de la profession du débiteur sont insaisissables à hauteur du montant nécessaire. Une voiture utilisée pour aller travailler dans une zone sans transports publics (28 km, horaire 6h) peut constituer un 'outil de travail indispensable' — doctrine et jurisprudence le reconnaissent pour soignants, artisans, agriculteurs. LP 93 al. 1 : le minimum vital comprend les frais nécessaires à l'exercice de la profession. L'huissier a tort en affirmant catégoriquement que les voitures ne sont jamais protégées. Réclamation auprès de l'office des poursuites dans les 10 jours. '28 km + 6h matin + aucun bus + Toyota 4500 CHF + huissier dit pas protégée' sans 'LP 92 outil professionnel indispensable insaisissable' ni 'délai 10 jours réclamation'. Signal adversarial = débiteur accepte la saisie croyant les voitures jamais protégées.",
  },

  // SANTE — urgence dentaire (extraction dent infectée), LAMal refuse : soins dentaires exclus, pas d'exception urgence (LAMal 31)
  {
    id: 'adv_sante_14',
    query: "Ce week-end j'ai eu une violente rage de dents. Un dentiste de garde m'a extrait samedi une molaire très infectée — la note est de 750 CHF. Je pensais que c'était couvert par mon assurance maladie obligatoire (LAMal). Ma caisse refuse le remboursement en disant que 'les soins dentaires ne sont pas couverts par l'assurance de base'. Mais c'était une urgence ! Existe-t-il une exception pour les soins dentaires d'urgence ?",
    canton: null,
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 31', 'LAMal 34'],
    notes: "Soins dentaires et LAMal — exclusion générale et exceptions limitées (LAMal 31 / LAMal 34) — LAMal 31 al. 1 : l'assurance obligatoire ne prend en charge les soins dentaires que dans 3 cas : a) maladie grave et non évitable du système masticatoire, b) soins rendus nécessaires par une maladie grave du reste de l'organisme, c) séquelles d'un accident LAA. LAMal 34 : l'OPAS définit les prestations remboursables. Une extraction de molaire infectée pour carie, même en urgence le week-end, ne rentre pas dans ces exceptions — c'est une maladie dentaire ordinaire. L'urgence n'est PAS un critère d'exception LAMal pour les soins dentaires. Solution : assurance complémentaire dentaire privée (LCA). '750 CHF + extraction + infection + urgence week-end + LAMal refuse + exception urgence ?' sans 'LAMal 31 exceptions dentaires limitées à 3 cas' ni 'urgence n'est pas une exception prévue'. Signal adversarial = patient croit que l'urgence médicale entraîne automatiquement la couverture LAMal.",
  },

  // SUCCESSIONS — donation 2 ans avant décès qui ampute la réserve héréditaire, action en réduction (CC 522 / CC 527)
  {
    id: 'adv_successions_13',
    query: "Ma mère est décédée il y a 6 semaines. Avant de mourir, elle avait donné 180'000 CHF à ma sœur aînée 'de son vivant' 2 ans avant son décès — ma mère disait que c'était 'pour récompenser les sacrifices de ma sœur'. La succession ne comprend plus que 90'000 CHF à partager entre nous 4 enfants. Sans cette donation, ma part aurait dû être bien plus grande. Peut-on contester cette donation faite 2 ans avant le décès ?",
    canton: 'VD',
    expected_domaine: 'successions',
    expected_any_article: ['CC 522', 'CC 527', 'CC 470', 'CC 475'],
    notes: "Action en réduction et rapport des libéralités (CC 522 / CC 527 / CC 470) — CC 470 al. 1 : la réserve des descendants est de 1/2 de leur part légale (4 enfants → réserve = 1/4 × 1/2 du total reconstitué). CC 522 al. 1 : l'action en réduction est ouverte si une libéralité (donation ou legs) porte atteinte à la réserve. CC 527 ch. 1 : les libéralités entre vifs effectuées dans les 5 années avant le décès sont réductibles même si elles n'étaient pas destinées à frustrer les héritiers. CC 475 al. 1 : les donations sont imputées pour calculer la quotité disponible. Délai : 10 ans dès le décès. '180k sœur + 2 ans avant décès + succession 90k + 4 enfants + contester ?' sans 'CC 522 action en réduction' ni 'CC 527 donation dans les 5 ans réductible'. Signal adversarial = héritier croit que la donation faite de son vivant est définitivement intouchable.",
  },

  // VIOLENCE — harcèlement cybernétique anonyme, messages et photos depuis comptes inconnus, police passive (CC 28b / CP 179)
  {
    id: 'adv_violence_12',
    query: "Depuis 7 mois je reçois des messages insultants et des photos de moi prises en public, envoyés depuis des comptes anonymes Instagram et des adresses email jetables. Ces messages mentionnent mes horaires précis, mon quartier, mon lieu de travail — la personne me surveille clairement. La police a dit qu'elle ne peut 'rien faire sans identité de l'auteur' et m'a conseillé de 'bloquer les comptes'. Est-ce la seule option ?",
    canton: null,
    expected_domaine: 'violence',
    expected_any_article: ['CC 28b', 'CC 28a', 'CP 179'],
    notes: "Harcèlement anonyme en ligne / stalking cybernétique (CC 28b / CC 28a / CP 179) — CC 28b al. 1 (en vigueur depuis 2022) : la victime d'atteinte à la personnalité peut demander au juge civil d'interdire à l'auteur de la contacter ou de la surveiller — applicable même si l'auteur n'est pas encore identifié si des indices suffisants existent. CC 28a al. 2 : mesures provisionnelles super-urgentes sans audition préalable de l'auteur possibles. CP 179novies : prise de photos de la sphère privée sans consentement. La police peut requérir auprès des plateformes les données d'identification (IP, compte) via voie judiciaire. '7 mois + anonyme + photos en public + horaires précis + police dit rien à faire' sans 'CC 28b ordonnance interdiction même sans auteur identifié' ni 'réquisition données aux plateformes'. Signal adversarial = victime croit que l'anonymat bloque toute action légale.",
  },

  // ACCIDENT — trottinette électrique grille stop sur piste cyclable, fracture blessé, conducteur sans assurance RC (CO 41 / LCR 37)
  {
    id: 'adv_accident_10',
    query: "Je roulais à vélo sur une piste cyclable balisée quand une trottinette électrique a grillé le stop à l'intersection et m'a renversé. J'ai une fracture du poignet et mon vélo est cassé (2'200 CHF de dégâts). La personne sur la trottinette dit que 'les trottinettes ne sont pas des véhicules, je n'ai pas besoin d'assurance'. Mon assurance RC dit que ce n'est pas son problème. Qui est responsable et comment j'obtiens réparation ?",
    canton: 'ZH',
    expected_domaine: 'accident',
    expected_any_article: ['CO 41', 'CO 46'],
    notes: "Trottinette électrique : responsabilité sans assurance RC (CO 41 / LCR 37) — LCR 1 + ordonnance VCL : une trottinette électrique légère (≤25 km/h, ≤1 kW) est un cycle au sens de la loi — pas d'obligation d'assurance RC (contrairement aux voitures). Mais CO 41 al. 1 : tout acte dommageable causé par faute engage la responsabilité civile personnelle de l'auteur, indépendamment de l'assurance. LCR 37 al. 1 : griller un stop est une faute. CO 46 al. 1 : dommage corporel = frais médicaux + perte de gain + vélo. Voie : action civile directe contre le trottineteur + commandement de payer LP. '2200 CHF vélo + fracture + trottinette dit pas véhicule + pas assurance' sans 'CO 41 responsabilité civile directe sans assurance' ni 'LCR 37 faute = responsabilité'. Signal adversarial = victime croit que sans assurance RC il n'y a rien à faire.",
  },

  // CONSOMMATION — abonnement salle de sport non résiliable selon CG, déménagement à 80 km pour travail, clause abusive (CO 40a / CO 407a)
  {
    id: 'adv_consommation_11',
    query: "J'avais un abonnement annuel à un fitness (560 CHF/an). J'ai dû déménager à 80 km à cause d'un changement de travail. J'ai résilié avec 1 mois de préavis. Le fitness dit que 'les abonnements annuels ne sont pas résiliables, vous devez payer les 6 mois restants selon vos conditions générales signées'. Dois-je vraiment payer 280 CHF pour un club que je ne peux plus utiliser ?",
    canton: 'ZH',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 40a', 'CO 407a', 'CO 8'],
    notes: "Résiliation abonnement fitness pour juste motif et clauses abusives (CO 40a / CO 407a) — CO 407a (en vigueur depuis 2022) : les contrats de fitness conclus avec des consommateurs peuvent être résiliés en tout temps pour juste motif (déménagement à longue distance en est un). La clause 'non résiliable pendant la durée' dans les CG est nulle dans ce contexte. CO 40a / CO 8 LCD : les clauses standard abusives qui entravent de façon disproportionnée le droit de résiliation sont inopposables. 'Déménagement 80 km + travail + abonnement annuel + fitness dit 6 mois à payer + CG signées' sans 'CO 407a juste motif = résiliation de plein droit' ni 'clause non-résiliable nulle'. Signal adversarial = consommateur croit les CG inattaquables même pour clauses abusives.",
  },

  // HYBRIDE — locataire en PPE : bailleur-gérant vote des travaux coûteux à l'AG et répercute les charges sur le loyer (CO 269a / CC 712m)
  {
    id: 'adv_hybride_11',
    query: "J'habite en location dans un appartement PPE. Mon propriétaire-bailleur est aussi le gérant de la PPE. Lors de la dernière AG de la PPE, il a fait voter des travaux de rénovation de l'entrée (150'000 CHF) dont je suspecte qu'ils ne sont pas urgents. Un mois après l'AG, il m'a annoncé une hausse de loyer de +190 CHF/mois pour 'répercuter la hausse des charges communes'. Je peux contester quoi et auprès de qui ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 269a', 'CO 270', 'CO 270b', 'CC 712m'],
    notes: "Hausse de loyer fondée sur charges PPE + conflit d'intérêts bailleur-gérant (CO 269a / CO 270b / CC 712m) — CO 270b al. 1 : le locataire peut contester une hausse de loyer à l'autorité de conciliation dans les 30 jours dès la notification. CO 269a let. b : hausse admissible si justifiée par hausse réelle des coûts — le bailleur doit démontrer la réalité et la proportionnalité. CC 712m al. 2 : l'administrateur PPE doit gérer les intérêts communs avec diligence ; un conflit d'intérêts (bailleur = gérant votant pour ses propres intérêts) peut être invoqué pour contester les décisions AG. '190 CHF hausse + PPE + bailleur = gérant + travaux votés par lui + charges répercutées' sans 'CO 270b délai 30j contestation hausse loyer' ni 'CO 269a charges justifiées + proportionnalité'. Signal adversarial = locataire ne sait pas qu'il peut contester séparément la hausse loyer ET les décisions PPE.",
  },

  // VOISINAGE — chien du voisin entre dans le jardin et tue les poules, voisin nie, commune dit litige privé (CC 56 / CC 679 / CC 641)
  {
    id: 'adv_voisinage_17',
    query: "Le chien de mon voisin (labrador, jamais attaché) entre régulièrement dans mon jardin. La semaine passée il a attaqué et tué 3 de mes poules. J'ai des photos du chien dans mon jardin prises plusieurs fois ce mois. Mon voisin dit 'un chien c'est un chien, prouvez que c'était le mien'. La commune me dit que c'est un 'litige privé entre voisins, on ne peut pas intervenir'. Que puis-je faire pour faire cesser et être indemnisé ?",
    canton: 'BE',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 56', 'CC 679', 'CC 684', 'CC 641'],
    notes: "Intrusion chien voisin + dommages + action en cessation (CC 56 / CC 679 / CC 641) — CC 56 al. 1 : le détenteur d'animal répond du dommage causé, sauf preuve de diligence requise. Le voisin ne peut pas nier si la présence du chien dans le jardin est établie par photos horodatées. CC 641 al. 2 : le propriétaire du jardin peut exiger que son fonds soit respecté (action négatoire = cessation). CC 679 al. 1 : responsabilité du propriétaire pour immissions excessives (intrusions répétées). CC 684 al. 2 : incursions répétées d'un animal excèdent l'usage toléré. Voie : (1) mise en demeure écrite au voisin avec photos, (2) requête en mesures superprovisionnelles au juge de paix, (3) demande d'indemnisation poules. 'Labrador non-attaché + 3 poules tuées + photos + voisin nie + commune dit litige privé' sans 'CC 56 détenteur d'animal responsable + photos suffisent' ni 'CC 679 action en cessation + indemnisation'. Signal adversarial = propriétaire croit devoir prouver au-delà de tout doute, ignore que les photos constituent une preuve civile suffisante.",
  },

  // BAIL — résiliation pour besoin propre, locataire confond délai de préavis et délai d'opposition 30 jours péremptoire (CO 272 / CO 273)
  {
    id: 'adv_bail_28',
    query: "Mon bailleur m'a envoyé un congé recommandé pour son 'besoin propre' — il dit que sa fille veut habiter l'appartement. Le congé est pour fin septembre (3 mois de préavis). J'ai reçu la lettre il y a 3 semaines. Mon bailleur dit que j'ai encore 2 mois pour partir. Mais un ami m'a dit que je dois faire quelque chose rapidement si je veux contester. Qu'est-ce que je dois faire et dans quel délai ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 272', 'CO 273'],
    notes: "Délai péremptoire 30 jours pour s'opposer à une résiliation (CO 273 al. 1) — CO 271a al. 1 let. a : le congé pour besoin propre est attaquable si le besoin n'est pas réel ou si le congé est abusif. CO 273 al. 1 : le locataire qui entend s'opposer au congé doit le faire dans les 30 jours qui suivent la réception du congé, sous peine de forclusion absolue (délai péremptoire non prolongeable). CO 272 al. 1 : l'opposition doit être déposée à l'autorité de conciliation compétente. Ici, si le locataire a reçu la lettre il y a 3 semaines, il lui reste environ 7 jours. '3 semaines depuis réception + préavis 3 mois + bailleur dit encore 2 mois + ami dit agir vite' — le locataire confond le délai de préavis (pour quitter l'appartement) avec le délai d'opposition (pour contester juridiquement le congé). Ces deux délais sont totalement indépendants. Signal adversarial = locataire pense avoir jusqu'à la fin du préavis pour réagir juridiquement.",
  },

  // TRAVAIL — retenue directe sur salaire pour dommages causés au travail sans accord ni jugement, clause contractuelle invoquée à tort (CO 323b / CO 321e)
  {
    id: 'adv_travail_29',
    query: "Je suis livreur depuis 18 mois. La semaine passée, j'ai accidentellement renversé un chariot élévateur qui a endommagé des marchandises (dégâts estimés à 4'800 CHF par l'employeur). Mon patron m'a annoncé qu'il allait retenir directement la totalité sur mes deux prochains salaires. Mon contrat dit que 'tout dommage causé par négligence est à la charge du collaborateur'. Dois-je accepter cette retenue directe ?",
    canton: 'VD',
    expected_domaine: 'travail',
    expected_any_article: ['CO 323b', 'CO 321e'],
    notes: "Retenue sur salaire pour dommages : limite légale et nécessité d'accord ou de jugement (CO 323b / CO 321e) — CO 323b al. 1 : le salaire ne peut faire l'objet de compensations ou de retenues que dans la mesure permettant la saisie selon LP (environ 1/5 du salaire net selon le minimum vital). CO 323b al. 2 : toute retenue par compensation nécessite soit le consentement écrit du travailleur, soit un jugement. CO 321e al. 2 : la réparation du dommage peut être réduite par le juge selon le degré de faute, les risques professionnels assumés et la rémunération. La clause contractuelle 'dommage à charge du collaborateur' n'autorise pas la retenue directe intégrale — CO 323b est d'ordre semi-impératif (les dérogations au détriment du travailleur sont nulles). '4'800 CHF + retenue directe deux salaires + clause contrat + négligence' sans 'CO 323b limite 1/5 et accord écrit ou jugement requis' ni 'CO 321e réduction judiciaire selon risque professionnel'. Signal adversarial = salarié croit que la clause contractuelle permet à l'employeur de retenir directement la totalité du dommage.",
  },

  // DETTES — saisie d'un compte bancaire joint, codétenteur non poursuivi croit que sa part est automatiquement protégée (LP 95 / LP 106)
  {
    id: 'adv_dettes_25',
    query: "L'office des poursuites a saisi mon compte bancaire commun avec ma femme. Je suis le seul poursuivi — la dette de 6'200 CHF est à mon seul nom. L'office a bloqué 4'100 CHF sur le compte, dont environ 2'050 CHF que ma femme a virés de son propre salaire le mois passé (elle a les relevés bancaires). Ma femme dit que 'sa part ne peut pas être saisie car c'est son argent'. L'huissier dit que tout ce qui est sur le compte est saisissable. Qui a raison ?",
    canton: 'ZH',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 95', 'LP 106'],
    notes: "Saisie compte joint : la part du cotitulaire non poursuivi est revendicable, pas automatiquement protégée (LP 95 / LP 106 / LP 107) — LP 95 al. 1 : les biens en copropriété ou en main commune peuvent être saisis à concurrence de la part du débiteur — en pratique, l'office saisit l'intégralité du solde du compte joint. LP 106 al. 1 : le tiers (ici l'épouse) qui prétend avoir un droit sur les biens saisis peut déposer une revendication. LP 107 al. 1 : la revendication doit être formée dans les 10 jours dès que le tiers a eu connaissance de la saisie (délai péremptoire). Preuve à apporter : relevés bancaires montrant les virements depuis le compte personnel de l'épouse. LP 106 al. 2 : si la revendication est admise, les biens sont libérés de la saisie à concurrence du montant revendiqué. '2'050 CHF wife + virements prouvables + office bloque tout' sans 'LP 106 revendication tiers dans 10 jours' ni 'LP 95 saisie limitée à la part du débiteur poursuivi'. Signal adversarial = cotitulaire croit que sa part d'un compte joint est automatiquement protégée, sans savoir qu'il faut déposer activement une revendication dans les 10 jours.",
  },

  // FAMILLE — divorce régime matrimonial légal, appartement acheté pendant le mariage avec mise de fonds héritée, épouse croit avoir droit à la moitié (CC 197/198/204)
  {
    id: 'adv_famille_23',
    query: "Je divorce après 12 ans de mariage. Mon mari a acheté un appartement en 2018 avec 80'000 CHF de mise de fonds provenant d'un héritage de sa mère. Le reste (320'000 CHF) a été financé par une hypothèque remboursée conjointement. L'appartement est au nom de mon mari uniquement. Il dit que l'appartement lui appartient entièrement car la mise de fonds vient de sa famille et que c'est lui le titulaire. J'ai aussi travaillé à mi-temps et géré les enfants. Ai-je droit à une part de cet appartement ?",
    canton: 'BE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 197', 'CC 198', 'CC 204'],
    notes: "Régime légal des acquêts — liquidation divorce, biens propres vs acquêts (CC 197/198/204) — CC 197 al. 1 : sous le régime légal (participation aux acquêts), les acquêts comprennent tous les biens acquis à titre onéreux pendant le mariage. CC 198 ch. 2 : les biens reçus par héritage ou donation sont des biens propres — la mise de fonds de 80'000 CHF est bien propre du mari. CC 204 al. 1 : lors du divorce, l'excédent de chaque masse d'acquêts est partagé par moitié. Calcul : la fraction hypothécaire (320k/400k = 80%) de l'appartement est un acquêt partageable ; la fraction héritée (80k/400k = 20%) est bien propre. L'épouse a droit à la moitié de la plus-value des acquêts, indépendamment du fait que l'appartement soit au nom du seul mari (CC 200 al. 3). '80k héritage + 320k hypothèque + nom du mari + mari dit tout lui appartient + 12 ans mariage' sans 'CC 197 fraction hypothécaire = acquêt partageable' ni 'CC 204 partage 50/50 des acquêts indépendamment du nom sur l'acte'. Signal adversarial = épouse croit que le nom sur l'acte détermine la propriété au divorce, ou que la mise de fonds héritée protège l'intégralité de l'appartement.",
  },

  // ÉTRANGERS — procédure Dublin III, renvoi vers premier pays d'entrée (France), requérant avec famille en Suisse (LAsi 31a / Dublin III art. 8)
  {
    id: 'adv_etrangers_20',
    query: "Je suis syrien. J'ai fui la Syrie et je suis arrivé en Suisse via la Grèce et la France. À la frontière suisse on a relevé mes empreintes. Le SEM me dit maintenant que je dois retourner en France car mes empreintes y ont été enregistrées — c'est le 'pays Dublin responsable'. Mon frère est en Suisse depuis 2019 avec un permis B et il peut m'héberger. Est-ce que je peux quand même déposer une demande d'asile en Suisse ?",
    canton: null,
    expected_domaine: 'etrangers',
    expected_any_article: ['LAsi 31a', 'LAsi 3'],
    notes: "Règlement Dublin III — exception regroupement familial ou clause de souveraineté (LAsi 31a / LAsi 3 / Dublin III art. 8 et 17) — LAsi 31a al. 1 let. b : le SEM n'entre pas en matière sur une demande si le requérant peut retourner dans un État tiers sûr (la France = État Dublin sûr). Règlement Dublin III art. 8 al. 2 : si le demandeur a un membre de sa famille (frère = proche au sens du règlement) légalement présent dans un État Dublin, cet État peut être désigné compétent si le regroupement sert l'intérêt du demandeur. Dublin III art. 17 al. 1 : clause de souveraineté — la Suisse peut décider d'examiner elle-même la demande même si un autre État est compétent pour des raisons humanitaires. LAsi 31a al. 3 : raisons humanitaires exceptionnelles peuvent fonder l'entrée en matière. Procédure : déposer formellement la demande en invoquant le lien familial et demander l'application de la clause souveraineté art. 17. 'Syrien + France Dublin + frère permis B Suisse + SEM dit retourner en France' sans 'Dublin III art. 8 regroupement familial exception' ni 'clause souveraineté art. 17 demande formelle'. Signal adversarial = requérant croit que l'enregistrement en France lui interdit automatiquement l'asile en Suisse, sans connaître les exceptions Dublin familiales.",
  },

  // ACCIDENT — chute dans escalier défectueux d'un centre commercial, propriétaire invoque clause CG, responsabilité causale CO 58 non excluable (CO 58 / CO 46 / CO 47)
  {
    id: 'adv_accident_11',
    query: "J'ai glissé et chuté dans un escalier d'un centre commercial — une marche du bas était fissurée et légèrement soulevée (j'ai des photos prises juste après). Fracture de la cheville, opération, 8 semaines d'incapacité, frais médicaux 9'200 CHF non remboursés intégralement. Le responsable du magasin dit que 'nos conditions d'accès excluent notre responsabilité pour les accidents survenus dans nos locaux' et propose 500 CHF de geste commercial. Dois-je accepter ?",
    canton: 'VD',
    expected_domaine: 'accident',
    expected_any_article: ['CO 58', 'CO 46', 'CO 47'],
    notes: "Responsabilité causale du propriétaire d'ouvrage — clause CG nulle pour responsabilité légale (CO 58 / CO 100 / CO 46) — CO 58 al. 1 : le propriétaire d'un bâtiment ou d'un ouvrage répond du dommage causé par des défauts de construction ou de défaut d'entretien — c'est une responsabilité causale (sans faute à prouver), engagée dès que le défaut (marche fissurée) et le lien de causalité sont établis. CO 100 al. 1 : est nulle toute stipulation tendant à exclure ou à limiter la responsabilité dans les cas de dol ou de faute grave ; a fortiori, les responsabilités légales causales (CO 58) ne peuvent pas être exclues par des CG. CO 46 al. 1 : dommage corporel = frais médicaux + perte de gain. CO 47 : indemnité pour tort moral possible selon gravité. Marche fissurée photographiée = preuve du défaut + causalité. '9'200 CHF + 8 semaines + marche fissurée + CG excluent responsabilité + 500 CHF offerts' sans 'CO 58 responsabilité causale non excluable par CG (CO 100)' ni 'offre 500 CHF = reconnaissance implicite'. Signal adversarial = blessé croit que les CG d'un centre commercial peuvent valablement exclure la responsabilité pour défaut d'entretien.",
  },

  // SANTÉ — soins Spitex : la LAMal ne couvre que les soins infirmiers prescrits, pas l'aide ménagère ni les repas (LAMal 25a / OPAS 33)
  {
    id: 'adv_sante_15',
    query: "Mon père de 84 ans vit seul depuis le décès de ma mère. Il n'arrive plus à se laver seul, préparer ses repas ou faire ses courses — mentalement il est encore lucide. Son médecin a prescrit des soins Spitex. La Spitex locale propose 4h par jour (soins + aide ménagère + préparation repas) à 28 CHF/h soit 3'360 CHF/mois. La caisse maladie dit qu'elle ne prend en charge 'qu'une petite partie'. Combien la LAMal paie-t-elle exactement et pour quoi ?",
    canton: 'VD',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 25a', 'LAMal 26'],
    notes: "Soins Spitex remboursables LAMal vs aide ménagère non couverte (LAMal 25a / OPAS 33) — LAMal 25a al. 1 : l'assurance prend en charge les soins à domicile sur prescription médicale — uniquement les prestations de soins infirmiers définis à l'OPAS 33 : évaluation/conseils (let. a), soins de base (bain assisté, prise médicaments, soins de plaies) (let. b), activités médico-techniques (injections, pansements) (let. c). L'aide ménagère (cuisine, courses, nettoyage), la préparation des repas et l'accompagnement social ne sont PAS des soins LAMal. Financement alternatif pour l'aide ménagère : aide et soins à domicile (ASD) cantonaux, prestations complémentaires (LPC), Pro Senectute/repas à domicile. Tarifs LAMal : plafonnés par l'OFSP (pas le tarif commercial Spitex). '84 ans seul + 4h/jour + 28 CHF/h + soins + repas + courses + caisse dit petite partie' sans 'LAMal 25a couvre uniquement les soins infirmiers' ni 'aide ménagère = alternatives cantonales ASD/LPC'. Signal adversarial = famille confond soins infirmiers couverts LAMal et aide à domicile générale non remboursée.",
  },

  // CONSOMMATION — aspirateur en panne après 18 mois, fabricant invoque usure normale pour refuser la garantie, acheteur ignore la garantie légale contre le vendeur (CO 197 / CO 210)
  {
    id: 'adv_consommation_12',
    query: "Mon aspirateur haut de gamme acheté 480 CHF est tombé en panne après 18 mois — le moteur a lâché. La marque affiche '2 ans de garantie' sur l'emballage. Le service après-vente dit que c'est de 'l'usure normale du moteur' et refuse la prise en charge sous garantie. Le magasin où j'ai acheté l'appareil dit qu'il ne peut rien faire, que c'est une affaire entre moi et la marque. Ai-je un recours légal indépendamment de la garantie commerciale de la marque ?",
    canton: 'GE',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 197', 'CO 210'],
    notes: "Garantie légale du vendeur (CO 197/210) distincte et indépendante de la garantie commerciale du fabricant — CO 197 al. 1 : le vendeur garantit à l'acheteur que la chose est exempte de défauts qui en diminuent ou en suppriment la valeur ou l'utilité prévue. CO 210 al. 1 : les actions en garantie du vendeur se prescrivent par 2 ans dès la délivrance. La garantie légale lie le vendeur (le magasin), pas le fabricant. Un moteur d'aspirateur tombant en panne après 18 mois sur un appareil prévu pour durer 5-10 ans peut constituer un vice caché CO 197. Inversion de la preuve : après 6 mois mais avant 2 ans, c'est au vendeur de prouver que le défaut n'existait pas à la vente. Voie : lettre recommandée au magasin (vendeur = débiteur de la garantie légale) — réparation, remplacement ou remboursement selon CO 206. '18 mois + panne moteur + marque dit usure normale + magasin dit ce n'est pas son problème' sans 'CO 197 garantie légale contre le magasin directement' ni 'inversion preuve après 6 mois : vendeur doit prouver absence de défaut à la vente'. Signal adversarial = acheteur croit que seule la garantie commerciale du fabricant s'applique, sans savoir qu'il a une garantie légale indépendante contre le magasin.",
  },

  // VOISINAGE — chaudière à granulés conforme OPair mais fumée/suie excessive, action civile CC 684 indépendante du droit public (CC 684 / CC 679a)
  {
    id: 'adv_voisinage_18',
    query: "Mon voisin a installé une chaudière à granulés de bois en 2023. En hiver, les jours sans vent, une fumée grisâtre entre par mes fenêtres ouvertes, des traces de suie se déposent sur mes habits séchant dehors et j'ai des irritations respiratoires. La commune m'a dit que la chaudière est 'conforme à l'OPair et possède le permis de construire — nous ne pouvons pas intervenir'. Le voisin invoque la même conformité. Suis-je vraiment sans recours ?",
    canton: 'BE',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 684', 'CC 679a'],
    notes: "Immissions fumée/suie : droit privé CC 684 autonome du droit public OPair (CC 684 / CC 679a / LPE 74) — CC 684 al. 1 : le propriétaire est tenu, en usant de son fonds, de s'abstenir de tout excès au préjudice des propriétaires voisins — incluant fumées, suie, odeurs ou émanations. Al. 2 : dépassent les limites tolérables les immissions qui nuisent à l'utilisation du fonds voisin au-delà de la mesure ordinaire. CC 679a al. 1 (en vigueur depuis 2012) : la conformité au droit public (ici l'OPair) ne supprime pas la responsabilité fondée sur le droit privé CC 679 et CC 684. Les deux ordres juridiques sont indépendants. LPE 74 al. 2 : les propriétaires affectés peuvent agir au civil indépendamment de l'action des autorités. Action possible : action en cessation (CC 641 al. 2) + dommages-intérêts + mesures provisionnelles urgentes. 'OPair conforme + permis = intervention commune impossible + suie + irritations' sans 'CC 679a action civile indépendante de la conformité administrative' ni 'CC 684 al. 2 excès mesure ordinaire = cause d'action même si chaudière légale'. Signal adversarial = voisin lésé croit que la conformité OPair épuise tout recours civil.",
  },

  // ── WAVE 27 ────────────────────────────────────────────────────────────────────

  // BAIL — résiliation représailles 2 semaines après dépôt d'une plainte en conciliation (CO 271a al. 1 let. c / CO 273)
  {
    id: 'adv_bail_29',
    query: "Je suis locataire depuis 8 ans et j'ai déposé en janvier une plainte formelle à l'autorité de conciliation contre mon bailleur pour des réparations non effectuées (problèmes d'humidité persistants). Deux semaines après le dépôt de la plainte, j'ai reçu un congé recommandé pour la prochaine échéance de bail. Mon bailleur affirme que les deux choses sont 'totalement indépendantes'. Comment est-ce que je me défends contre ce congé ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 271a', 'CO 273'],
    notes: "Résiliation représailles après procédure locative — présomption légale d'abus (CO 271a al. 1 let. c / CO 273) — CO 271a al. 1 let. c : est présumée abusive la résiliation donnée par le bailleur pendant une procédure de conciliation ou judiciaire relative au bail, à condition que le locataire n'ait pas de graves obligations à se reprocher. CO 273 al. 1 : délai d'opposition de 30 jours (péremptoire) à l'autorité de conciliation dès réception du congé. Charge de la preuve inversée : c'est au bailleur de renverser la présomption d'abus. CO 271 al. 1 : le tribunal peut annuler le congé reconnu abusif. '8 ans + plainte conciliation janvier + congé 2 semaines après + bailleur dit indépendant' sans 'CO 271a al. 1 let. c présomption d'abus post-procédure' ni 'charge de preuve renversée sur bailleur'. Signal adversarial = locataire croit devoir prouver lui-même le lien de causalité, sans savoir que la loi présume l'abus dans ce délai.",
  },

  // TRAVAIL — délai péremptoire 30 jours pour invoquer licenciement abusif doit intervenir AVANT la fin du contrat (CO 336b al. 1)
  {
    id: 'adv_travail_30',
    query: "Mon employeur m'a donné mon congé le 15 mars avec 2 mois de préavis, dernier jour le 15 mai. Je suis convaincu que ce licenciement est abusif — il punissait mon refus de falsifier un bilan. Le 20 mai (5 jours après mon départ), un avocat m'a dit que j'avais peut-être un recours. Il a parlé d'un 'délai' mais n'a pas été précis. Quel est le délai exact et que dois-je faire ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 336b', 'CO 336a'],
    notes: "Délai péremptoire pour invoquer le licenciement abusif — DOIT être fait avant la fin du contrat (CO 336b al. 1) — CO 336b al. 1 : la partie qui entend demander l'indemnité pour licenciement abusif (CO 336a) doit faire opposition par écrit AVANT la fin du contrat de travail. CO 336b al. 2 : si l'opposition n'est pas faite avant l'échéance, le droit à l'indemnité est définitivement perdu sauf reconnaissance écrite de l'autre partie. Dans ce cas : dernier jour du contrat = 15 mai, avocat consulté le 20 mai = délai expiré depuis 5 jours. L'indemnité est définitivement perdue. '15 mars congé + 15 mai fin contrat + 20 mai avocat + refus de falsifier bilan' sans 'CO 336b al. 1 opposition écrite requise AVANT fin du contrat = délai expiré' ni 'droit à indemnité perdu définitivement si opposition tardive'. Signal adversarial = salarié croit avoir un délai après la fin du contrat pour réagir, sans savoir que le délai expire le jour de fin de contrat lui-même.",
  },

  // DETTES — exception d'inexécution : droit de retenir le solde pour travaux défectueux sans payer d'abord (CO 82 / CO 368)
  {
    id: 'adv_dettes_26',
    query: "J'ai commandé la pose d'un parquet dans mon appartement pour 7'400 CHF (30% versés à la commande). Le parqueteur a posé le parquet mais avec des défauts visibles : 8 lattes mal alignées, des clous qui ressortent et 3 zones qui craquent. Le parqueteur exige le solde de 70% (5'180 CHF) immédiatement sous menace de poursuite. Mon voisin m'a dit de 'payer d'abord, puis réclamer les réparations après'. Est-ce que je dois vraiment payer la totalité avant de pouvoir contester les défauts ?",
    canton: 'VD',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 82', 'CO 368'],
    notes: "Exception d'inexécution et retenue proportionnelle sur solde — droit de refuser sans payer d'abord (CO 82 / CO 368) — CO 82 : dans un contrat bilatéral, chaque partie peut refuser d'exécuter sa prestation si l'autre partie n'a pas correctement exécuté la sienne (exceptio non adimpleti contractus). CO 368 al. 1 : si l'ouvrage est défectueux, le maître peut retenir une partie du prix proportionnelle à la valeur des défauts et réduire le prix. CO 368 al. 2 : si les défauts sont importants, refus de réception possible. Procédure : notification écrite des défauts avec délai de réparation (CO 366/367) ; retenue légale du montant correspondant à la réparation estimée. Payer d'abord est bien plus difficile à récupérer ensuite. '7'400 CHF + lattes mal alignées + clous ressortent + craquements + poursuite menacée + payer d'abord voisin dit' sans 'CO 82 droit de refuser la prestation si mal exécutée' ni 'CO 368 retenue proportionnelle légale sur solde'. Signal adversarial = maître d'ouvrage croit devoir payer le solde intégralement avant de pouvoir réclamer réparation des défauts.",
  },

  // FAMILLE — action judiciaire en constatation de paternité quand père refuse de reconnaître l'enfant hors mariage (CC 261 / CC 279)
  {
    id: 'adv_famille_24',
    query: "J'ai un enfant de 3 ans (né hors mariage) dont le père biologique refuse catégoriquement de le reconnaître et ne paye rien. Il a admis par SMS être le père mais dit 'tu ne prouveras jamais rien légalement'. Un test ADN fait par une agence privée confirme la paternité à 99.99% mais il dit que ça 'ne vaut rien légalement'. Je n'ai aucun jugement, aucune contribution. Quelle est la procédure pour établir la paternité et obtenir une pension ?",
    canton: 'GE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 261', 'CC 279'],
    notes: "Action en constatation judiciaire de paternité + contributions provisoires (CC 261 / CC 279) — CC 261 al. 1 : si le père ne reconnaît pas l'enfant, la mère, l'enfant ou les autorités de protection peuvent intenter une action en constatation judiciaire de paternité devant le juge. CC 261 al. 3 : sur demande du tribunal, un test ADN peut être ordonné ; les SMS admettant la paternité constituent un commencement de preuve. CC 279 al. 1 : la contribution d'entretien peut être fixée avec effet rétroactif dès la naissance. CC 303 : la contribution provisoire peut être accordée dès le dépôt de la demande, sans attendre le jugement final. Action imprescriptible tant que l'enfant est mineur. '3 ans + hors mariage + SMS admission + test privé 99.99% + refus reconnaissance + rien payé' sans 'CC 261 action judiciaire en constatation de paternité : SMS = commencement de preuve' ni 'CC 279 contributions rétroactives depuis naissance'. Signal adversarial = mère croit ne rien pouvoir faire sans reconnaissance volontaire du père, et que seul un test ADN légal officiel ouvre le recours.",
  },

  // VOISINAGE — haie plantée à distance inférieure à la limite légale cantonale, droit d'en exiger l'abattage après 5 ans (CC 686 / loi cantonale)
  {
    id: 'adv_voisinage_19',
    query: "Mon voisin a planté une haie de thuyas il y a 5 ans. Elle fait maintenant 4 mètres de haut et se trouve à 30 cm de la limite de propriété (côté sud). Elle bloque complètement l'ensoleillement de mon potager et mes panneaux solaires ont perdu 40% de rendement. La commune dit 'les plantations sont légales, nous ne pouvons pas intervenir'. Le voisin refuse de tailler. Est-ce que j'ai vraiment un recours pour faire tailler ou enlever cette haie ?",
    canton: 'VD',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 686', 'CC 679'],
    notes: "Distances légales pour plantations — violation → droit d'exiger l'abattage ou la taille (CC 686 / règles cantonales VD) — CC 686 al. 1 : les cantons fixent les distances à observer pour les haies, arbres et autres plantations. Vaud (RATC) : haies > 2m = distance min. 1.50m de la limite. Haie de 4m à 30 cm = violation manifeste des distances légales cantonales. CC 686 al. 2 : si les distances ne sont pas observées, le propriétaire lésé peut exiger l'abattage ou la taille à la distance légale. CC 679 al. 1 : action possible pour suppression des immissions dépassant les distances légales. CC 686 al. 3 : ce droit se prescrit si les plantations existent depuis plus de 30 ans sans plainte — ici 5 ans = délai non écoulé. '4m + 30 cm + potager bloqué + panneaux -40% + commune dit légal' sans 'CC 686 violation distances légales cantonales → droit d'exiger abattage' ni 'délai 30 ans non atteint, droit intact'. Signal adversarial = propriétaire croit que si la commune dit 'légal', tout recours civil est exclu.",
  },

  // VIOLENCE / LAVI — victime d'agression, agresseur insolvable, aide LAVI de l'État pour frais médicaux et psychologiques (LAVI 1 / LAVI 19)
  {
    id: 'adv_violence_13',
    query: "Il y a 7 mois, j'ai été victime d'une agression physique dans la rue (fracture du nez, contusions, 3 semaines d'arrêt de travail). L'agresseur a été condamné mais n'a aucun bien à saisir et ne peut rien payer. J'ai des frais non remboursés de 4'800 CHF (franchise LAMal, taxi hôpital, suivi psychologique pour stress post-traumatique). Mon avocat me dit qu'une poursuite civile contre l'agresseur insolvable ne donnera rien. Est-ce qu'il existe une aide de l'État pour ma situation ?",
    canton: 'VD',
    expected_domaine: 'violence',
    expected_any_article: ['LAVI 1', 'LAVI 19'],
    notes: "Aide aux victimes d'infractions LAVI — l'État rembourse si l'auteur est insolvable (LAVI 1 / LAVI 19 / LAVI 4) — LAVI 1 al. 1 : toute personne physique lésée dans son intégrité corporelle, sexuelle ou psychique par une infraction a droit à l'aide aux victimes (indépendamment de la capacité de paiement de l'auteur). LAVI 19 al. 1 : les cantons accordent une indemnité pour le dommage subi (frais médicaux non couverts, perte de gain, frais thérapeutiques) et une réparation morale si l'auteur est insolvable ou inconnu. LAVI 4 : délai de 10 ans pour déposer la demande auprès du centre LAVI cantonal. Conditions : infraction commise + plainte déposée + infraction reconnue (jugement ici = condition remplie). Prise en charge : frais médicaux non couverts LAMal, psychologue PTSD, perte de gain. 'Agression + condamné insolvable + fracture + PTSD + 4'800 CHF + avocat dit sans recours' sans 'LAVI 19 indemnisation par l'État si auteur insolvable' ni 'centre LAVI cantonal, délai 10 ans'. Signal adversarial = victime croit que l'insolvabilité de l'agresseur la prive de toute aide, sans connaître l'aide LAVI financée par les cantons.",
  },

  // SANTÉ — médicament hors liste LS pour maladie grave de l'enfant, procédure urgente d'autorisation individuelle et recours LAMal (OAMal 71a / LPGA 52)
  {
    id: 'adv_sante_16',
    query: "Ma caisse maladie a refusé de rembourser un médicament prescrit par le spécialiste pour mon enfant de 5 mois (amyotrophie spinale type 1). Ce médicament n'est pas sur la liste des spécialités LAMal. La décision de refus est datée du 3 juin. Le médecin dit qu'il n'y a pas d'alternative et que chaque semaine compte pour préserver les capacités motrices. Nous n'avons pas les moyens de payer ce traitement. Que faire d'urgence et dans quel délai ?",
    canton: 'GE',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 41', 'LAMal 53'],
    notes: "Médicament hors liste LS, urgence médicale — autorisation individuelle OAMal 71a + recours LPGA 52 avec mesures provisionnelles — OAMal 71a : pour un médicament non inscrit sur la liste des spécialités, le médecin peut demander une autorisation individuelle à la caisse si le médicament est approprié et qu'aucune alternative n'existe (condition de l'unicité). LPGA 52 al. 1 : délai d'opposition à la décision de refus = 30 jours dès notification (péremptoire) — ici décision du 3 juin → opposition avant le 3 juillet. LPGA 56 : recours au tribunal cantonal des assurances dans 30 jours si l'opposition est rejetée. Mesures provisionnelles : si le risque d'atteinte irréversible est documenté médicalement, possibilité de demander mesures superprovisionnelles pour forcer le remboursement avant décision finale. '3 juin refus + bébé 5 mois + amyotrophie + pas d'alternative + urgence' sans 'LPGA 52 opposition 30j avant 3 juillet' ni 'OAMal 71a autorisation individuelle si unique alternative'. Signal adversarial = famille croit que le refus de la caisse est définitif sans avocat, sans connaître la procédure d'opposition directe et OAMal 71a.",
  },

  // ACCIDENT — chauffeur de livraison blesse un piéton avec le véhicule de société, responsabilité de l'employeur commettant quasi-causale (CO 55 / LCR 58)
  {
    id: 'adv_accident_12',
    query: "Un chauffeur de livraison m'a renversé avec sa camionnette de société en marche arrière dans un parking lors de son dernier arrêt de tournée — fracture du genou, 6 semaines d'incapacité, 3'200 CHF de frais non couverts. L'assurance du chauffeur dit que c'est 'une faute personnelle, pas la faute de l'entreprise'. La société de livraison dit que cet arrêt 'n'était pas planifié dans son plan de route officiel'. Le chauffeur n'a pas les moyens de payer. Ai-je un recours contre la société ?",
    canton: 'VD',
    expected_domaine: 'accident',
    expected_any_article: ['CO 55', 'CO 41'],
    notes: "Responsabilité du commettant pour auxiliaire — quasi-causale, difficile à écarter même pour un arrêt 'non planifié' (CO 55 / LCR 58) — CO 55 al. 1 : l'employeur (commettant) répond du dommage causé par ses travailleurs (auxiliaires) dans l'accomplissement de leur travail ; CO 55 al. 2 : il peut s'exculper s'il prouve avoir pris tous les soins commandés — exculpation quasi-impossible en pratique. Condition 'dans l'accomplissement du travail' : dernier arrêt de tournée avec véhicule de société = toujours dans l'exercice de la fonction, même si arrêt 'non prévu'. LCR 58 al. 1 : responsabilité causale du détenteur du véhicule (la société) pour dommages causés par le véhicule en circulation. '3'200 CHF + camionnette société + dernier arrêt tournée non planifié + chauffeur insolvable + entreprise nie' sans 'CO 55 responsabilité commettant quasi-causale + LCR 58 détenteur' ni 'arrêt non planifié ≠ rupture du lien de préposition'. Signal adversarial = victime croit que la faute personnelle du chauffeur ou l'arrêt 'non planifié' exonère la société.",
  },

  // ENTREPRISE — perte des deux tiers du capital d'une SA, obligation du CA de convoquer l'AG et recours de l'actionnaire minoritaire (CO 725 / CO 699)
  {
    id: 'adv_entreprise_12',
    query: "Je suis actionnaire à 25% d'une petite SA familiale. La révision du dernier exercice montre que les actifs nets représentent moins d'un tiers du capital-actions nominal (pertes lourdes depuis 2 ans). Le conseil d'administration (3 administrateurs dont mon frère) n'a rien fait depuis 6 mois malgré plusieurs emails. Quelle est l'obligation légale du CA et quel est mon recours si le CA ne bouge pas ?",
    canton: 'GE',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 725', 'CO 699'],
    notes: "Perte des deux tiers du capital SA — obligation légale du CA de convoquer l'AG + recours actionnaire (CO 725 / CO 699 / CO 754) — CO 725 al. 1 : si la moitié du capital-actions et des réserves légales n'est plus couverte, le CA doit immédiatement convoquer une AG extraordinaire et lui proposer des mesures d'assainissement. CO 725 al. 2 : en cas de surendettement (actifs < dettes), le CA doit aviser le juge. Ici : actifs < 1/3 du capital = situation CO 725 al. 1, obligation de convoquer. CO 699 al. 3 : un actionnaire représentant au moins 10% du capital (ou actions valant ≥ 1M CHF) peut lui-même exiger la convocation d'une AG extraordinaire. Avec 25%, l'actionnaire a ce droit. CO 754 : les administrateurs qui ne prennent pas les mesures imposées par CO 725 engagent leur responsabilité civile personnelle. '25% + actifs < 1/3 capital + CA inactif 6 mois + frère administrateur' sans 'CO 725 convocation obligatoire immédiate par CA' ni 'CO 699 al. 3 actionnaire 25% peut lui-même convoquer l'AG'. Signal adversarial = actionnaire minoritaire croit ne pas avoir les moyens de forcer une action du CA sans être majoritaire.",
  },

  // ÉTRANGERS — ressortissant UE vivant en Suisse depuis 4 ans sans permis, obligation d'annonce ALCP, régularisation de droit si conditions remplies (ALCP / LEI 90)
  {
    id: 'adv_etrangers_21',
    query: "Je suis Français et je vis en Suisse depuis 4 ans. J'ai un contrat de travail suisse avec une entreprise suisse. Je n'ai jamais demandé de permis de séjour car on m'avait dit qu'en tant que citoyen UE 'pas besoin de permis grâce à la libre circulation'. Il y a deux semaines, lors d'un contrôle de police, l'agent m'a demandé mon permis de séjour et j'ai dû admettre ne pas en avoir. Il m'a dit de 'régulariser rapidement'. Mon employeur menace de suspendre mon accès aux systèmes sans permis. Que dois-je faire et est-ce que je risque une expulsion ?",
    canton: 'GE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 90', 'ALCP 2'],
    notes: "Ressortissant UE sans permis de séjour — obligation d'annonce et régularisation de droit si conditions remplies (ALCP art. 2 / LEI 90 / OASA 12) — ALCP art. 2 al. 1 : les ressortissants UE/AELE ont le droit de séjourner et travailler en Suisse, mais doivent obtenir une autorisation de séjour (permis B ou L UE). LEI 90 / OASA 12 : l'étranger UE doit s'annoncer auprès du service de la population dans les 8 jours suivant le début de son séjour de plus de 90 jours (ou dès le début de l'emploi). Conséquence d'un séjour non annoncé : amende contraventionnelle possible, mais pas d'expulsion automatique pour un ressortissant UE salarié régularisable. Régularisation : le permis B UE est délivré de droit si contrat de travail valide en Suisse et pas d'empêchements légaux. '4 ans + Français + employeur CH + contrôle police + pas de permis' sans 'ALCP/LEI 90 obligation d'annonce mais régularisation de droit si salarié UE' ni 'pas d'expulsion automatique : amende mais pas de renvoi'. Signal adversarial = ressortissant UE croit soit que la libre circulation exempte de toute démarche, soit qu'il risque l'expulsion en régularisant maintenant.",
  },

  // ── WAVE 28 ──────────────────────────────────────────────────────────────────
  // 10 nouveaux cas — angles inédits — écrits sans consulter le dico du retriever

  // FISCAL — déduction frais de formation professionnelle (LIFD 33a en vigueur depuis 2022 supprime distinction formation continue / reconversion)
  {
    id: 'adv_fiscal_09',
    query: "Je travaille en banque depuis 8 ans. J'ai payé de ma poche 4'800 CHF pour un certificat en conformité réglementaire — ça m'a permis d'obtenir un poste d'analyste. Le fisc cantonal refuse la déduction en disant que c'est une 'formation de reconversion' et non une 'formation continue d'entretien des compétences'. J'ai entendu qu'une loi avait changé en 2022. Est-ce qu'ils ont le droit de refuser ?",
    canton: 'ZH',
    expected_domaine: 'fiscal',
    expected_any_article: ['LIFD 33a'],
    notes: "Déduction frais de formation LIFD 33a (en vigueur 01.01.2022) — depuis 2022, la distinction formation continue vs reconversion est supprimée : jusqu'à 12'800 CHF (2024) déductibles pour toute formation ou perfectionnement professionnels, indépendamment du lien avec l'activité actuelle. Le fisc cantonal qui maintient l'ancienne distinction commet une erreur de droit. Délai de réclamation 30 jours (LIFD 132). '4'800 CHF + certificat compliance + fisc refuse reconversion + loi 2022' sans 'LIFD 33a' ni 'déduction reconversion autorisée depuis 2022'. Signal adversarial = domaine fiscal = blind spot attendu JPT.",
  },

  // CIRCULATION — speed pedelec (vélo électrique 45 km/h) assimilé cyclomoteur, assurance RC obligatoire, accident piéton
  {
    id: 'adv_circulation_12',
    query: "J'ai percuté un piéton avec mon vélo électrique rapide — il peut monter jusqu'à 45 km/h — sur une piste cyclable. Le piéton a une fracture du poignet. Son avocat me contacte pour une indemnisation de 4'500 CHF. Mon vélo n'est pas assuré car je croyais que les vélos n'avaient pas besoin d'assurance. Qu'est-ce que je risque légalement ?",
    canton: 'BE',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 18', 'LCR 63', 'OCV 21'],
    notes: "Speed pedelec (>25 km/h, max 45 km/h) = cyclomoteur léger selon LCR 18 / OCV 21. Assurance RC obligatoire (LCR 63). Sans assurance = infraction LCR 96 + responsabilité civile personnelle intégrale du propriétaire (LCR 58 s'applique : les speed pedelec sont assimilés à des véhicules à moteur). Piéton = droit à réparation intégrale CO 41/LCR 65. Contrairement au vélo classique (pur CO 41 avec faute prouvée), un speed pedelec engage la responsabilité causale du détenteur. '45 km/h + vélo + fracture piéton + pas d'assurance + croyait pas nécessaire' sans 'speed pedelec = cyclomoteur LCR + RC obligatoire'. Signal adversarial = confusion vélo classique vs speed pedelec.",
  },

  // SOCIAL — aide sociale et héritage reçu : pas de remboursement rétroactif pour prestations légalement versées (LIAS restitution)
  {
    id: 'adv_social_12',
    query: "Je reçois l'aide sociale depuis 3 ans après une dépression sévère. Il y a 5 mois, j'ai reçu un héritage de 22'000 CHF de ma grand-mère. J'en ai déjà utilisé 8'000 pour payer des dettes. La travailleuse sociale m'informe que je dois déclarer l'héritage et qu'elle peut 'exiger le remboursement des 3 dernières années d'aide'. Est-ce qu'ils peuvent vraiment récupérer les 3 ans d'aide sociale passés ?",
    canton: 'VD',
    expected_domaine: 'social',
    expected_any_article: ['Cst 12', 'LIAS 42', 'LIAS 26'],
    notes: "Aide sociale et héritage : obligation de déclaration sans restitution rétroactive — L'héritage doit être déclaré (LIAS VD 42 / équivalents cantonaux : obligation de déclarer tout changement de situation). Les futures prestations seront réduites ou supprimées tant que la fortune subsiste (franchise cantonale variable, ~10k CHF VD). MAIS : les prestations versées légalement AVANT l'héritage ne peuvent pas être réclamées rétroactivement — elles étaient dues au moment du versement et leur remboursement ne peut être exigé que si la situation avait été frauduleusement dissimulée. 22k − 8k = 14k disponible → réduction/suspension des aides futures, mais pas remboursement des 3 ans passés. 'Héritage 22k + 3 ans aide + remboursement rétroactif ?' sans 'pas de restitution pour prestations légalement versées antérieurement'. Signal adversarial = croyance que tout héritage déclenche un remboursement rétroactif total.",
  },

  // HYBRIDE (travail) — consultant facturant avec contrat prestataire = faux indépendant si 4 critères TF remplis (CO 319 requalification)
  {
    id: 'adv_hybride_12',
    query: "Je travaille pour une startup depuis 2 ans avec un 'contrat de consultant indépendant'. Je gagne 8'000 CHF par mois, je n'ai qu'eux comme client, je travaille dans leurs bureaux de 9h à 18h avec leur matériel informatique et sous leurs directives. Ils stoppent notre collaboration immédiatement sans préavis ni indemnité, en disant 'vous n'êtes pas un employé'. Mon comptable parle de 'faux indépendant'. Ai-je des droits comme un salarié ?",
    canton: 'GE',
    expected_domaine: 'travail',
    expected_any_article: ['CO 319', 'CO 335c'],
    notes: "Requalification contrat consultant en contrat de travail (pseudo-indépendant) — CO 319 : le contrat de travail se définit par la subordination. Les 4 critères TF (ATF 129 III 664) : intégration dans l'organisation (bureaux + matériel), absence de risque économique propre, temps fixé par l'employeur, dépendance d'un seul client. Ici tous remplis → requalification probable en contrat de travail → préavis légal CO 335c (2 mois en 3e année d'ancienneté), droit aux vacances CO 329a, cotisations AVS/AI/AC dues. LAVS 5 al. 2 : l'activité dépendante de fait est soumise aux cotisations même si facturée en prestation de service. 'Consultant + un seul client + bureau + directives + stop immédiat + faux indépendant' sans 'CO 319 requalification' ni 'label contractuel ≠ réalité économique'. Signal adversarial = employeur croit pouvoir contourner le CO par un label contractuel.",
  },

  // BAIL — panne de chaudière en hiver, 6 semaines à 15°C, bébé, bailleur silencieux : résiliation CO 259f + réduction loyer CO 259d
  {
    id: 'adv_bail_30',
    query: "Depuis 6 semaines ma chaudière est en panne et il fait 15°C dans mon appartement. J'ai un bébé de 9 mois. J'ai envoyé 3 lettres recommandées au propriétaire qui ne répond jamais. Maintenant je veux soit partir soit retenir mon loyer. Est-ce que c'est possible et puis-je récupérer une partie du loyer pour les 6 semaines sans chauffage ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 259', 'CO 259a', 'CO 259d', 'CO 259f'],
    notes: "Défaut grave non corrigé — réduction loyer + résiliation accélérée — CO 259a : locataire peut exiger réduction du loyer proportionnelle au défaut (absence chauffage hiver = défaut important, réduction 20-50% selon jurisprudence). CO 259d : réduction peut être exigée rétroactivement pour toute la période de défaut (6 semaines). CO 259f : si défaut grave mettant en danger la santé ou la sécurité (15°C avec bébé = oui) et non corrigé après mise en demeure avec délai raisonnable, résiliation du bail avec préavis de 30 jours possible par le locataire. Retenue directe du loyer : NON permise sans passer par l'autorité de conciliation (consignation judiciaire). '6 semaines + 15°C + bébé + 3 lettres + propriétaire silencieux + retenir loyer ?' sans 'CO 259d réduction rétroactive' ni 'CO 259f résiliation pour défaut grave santé'. Signal adversarial = ne pas savoir qu'on peut résilier et récupérer du loyer payé.",
  },

  // TRAVAIL — clause de non-concurrence 2 ans all-fintech Suisse, validité CO 340, peine conventionnelle CO 340b
  {
    id: 'adv_travail_31',
    query: "Après 5 ans comme ingénieur dans une startup fintech, j'ai démissionné et rejoint un concurrent 6 semaines après. Mon ex-employeur m'envoie une lettre d'avocat réclamant 50'000 CHF de 'peine conventionnelle' pour violation d'une clause dans mon contrat qui m'interdit de travailler dans le secteur fintech en Suisse pendant 2 ans. Est-ce que cette clause est légalement valable et dois-je vraiment payer ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 340', 'CO 340a', 'CO 340b'],
    notes: "Validité clause de non-concurrence (CO 340/340a/340b) — CO 340 al. 2 : clause valide si l'employé avait accès à la clientèle ou à des secrets de fabrication ET si leur utilisation peut causer un préjudice sensible. CO 340a al. 1 : limitée en durée (max 3 ans), lieu (pas nécessairement Suisse entier) et objet (pas plus large que nécessaire). 2 ans fintech Suisse entier = potentiellement trop large géographiquement mais pas au-delà de 3 ans. CO 340b al. 2 : le juge peut réduire la peine conventionnelle si excessive. TF jurisprudence : si l'employeur a résilié sans juste motif, la clause tombe (CO 340c al. 2). Si c'est l'employé qui démissionne sans juste motif imputable à l'employeur, la clause reste applicable. À analyser : est-ce que l'ingénieur avait vraiment accès à des secrets de fabrication ? '50k CHF + non-concurrence 2 ans + fintech + démission + concurrent' sans 'CO 340 conditions validité' ni 'CO 340b réduction judiciaire'. Signal adversarial = employé croit la clause automatiquement valide et applicable.",
  },

  // DETTES — prêt privé 2017, prescription CO 127 (10 ans, non 5 ans) + interruption CO 135 par reconnaissance SMS
  {
    id: 'adv_dettes_27',
    query: "J'ai emprunté 12'000 CHF à un ami en 2017 via un papier signé à la main. Je n'ai jamais remboursé. Il y a 2 mois, mon ami m'a envoyé un SMS disant 'tu dois me rembourser les 12'000 CHF' et j'ai répondu 'oui je sais, je vais m'arranger'. Il parle maintenant de me poursuivre. Est-ce que c'est prescrit après 7 ans ou est-ce qu'il peut encore agir ?",
    canton: null,
    expected_domaine: 'dettes',
    expected_any_article: ['CO 127', 'CO 130', 'CO 135', 'CO 138'],
    notes: "Prescription prêt privé (CO 127 = 10 ans) + interruption par reconnaissance SMS (CO 135 lit. b) — CO 127 : délai de prescription ordinaire des créances civiles = 10 ANS (erreur très répandue : les 5 ans de CO 128 ne s'appliquent qu'aux créances périodiques comme loyers, intérêts, salaires). Un prêt de 2017 n'est pas prescrit en 2024 (échéance 2027). Double piège : CO 135 lit. b : la prescription est interrompue lorsque le débiteur reconnaît la dette — 'oui je sais, je vais m'arranger' par SMS peut constituer une reconnaissance écrite implicite, ce qui rouvre un nouveau délai de 10 ans depuis le SMS. Résultat : créancier peut agir, prescription non-atteinte ET le SMS peut avoir rouvert le délai. '2017 + prêt papier + 7 ans + SMS + prescrit ?' sans 'CO 127 = 10 ans (pas 5)' ni 'CO 135 interruption par reconnaissance'. Signal adversarial = croyance très répandue que les dettes se prescrivent en 5 ans.",
  },

  // VOISINAGE — abri de jardin contre mur mitoyen, permis accordé, humidité sur fonds voisin : CC 679 indépendant du permis
  {
    id: 'adv_voisinage_20',
    query: "Mon voisin a construit un abri en bois de 12 m² contre notre mur mitoyen il y a 2 ans. Le permis de construire avait été accordé et je n'avais pas fait recours dans les 30 jours. Depuis cette construction, mon salon est beaucoup plus humide et j'ai des moisissures sur le mur commun. Puis-je encore faire quelque chose si le délai de recours contre le permis est passé ?",
    canton: 'VD',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 679', 'CC 684'],
    notes: "Action civile en immissions indépendante du permis public (CC 679 / CC 684) — Le permis de construire (droit public des constructions) est accordé et le délai de recours administratif est expiré. MAIS le droit privé est indépendant : CC 679 al. 1 : le propriétaire qui use de son fonds de façon à causer à d'autres propriétaires voisins des dommages ou des immissions excessives engage sa responsabilité civile même si l'ouvrage est légalement autorisé. CC 684 al. 1 : immissions excessives dépassant la mesure ordinaire tolérée (humidité mesurable, moisissures documentées = excès). Action : en cessation + dommages-intérêts CO 97/41 devant le tribunal civil. Délai : 3 ans depuis connaissance du dommage (CO 60). Le délai recours permis (administratif) et délai action civile (CC 679) sont totalement distincts. '2 ans + permis accordé + abri + humidité + moisissures + délai recours passé' sans 'CC 679 indépendant du permis' ni 'action civile délai 3 ans depuis dommage'. Signal adversarial = croyance que le permis accordé immunise définitivement contre toute action.",
  },

  // CONSOMMATION — rayure de fabrication sur TV neuf livré, marchand refuse garantie car 'cosmétique pas fonctionnel' (CO 197 / CO 205)
  {
    id: 'adv_consommation_13',
    query: "J'ai commandé un téléviseur 1'400 CHF sur un site suisse en ligne. En déballant la commande, j'ai découvert une rayure de fabrication bien visible sur l'écran. Le service client dit que 'les rayures ne sont pas couvertes par la garantie car c'est cosmétique, pas fonctionnel, le TV marche'. Le délai de 10 jours pour retourner l'article est presque expiré. Ai-je des droits ?",
    canton: null,
    expected_domaine: 'consommation',
    expected_any_article: ['CO 197', 'CO 205', 'CO 210'],
    notes: "Défaut matériel à la livraison — garantie légale vendeur (CO 197 / CO 205) — CO 197 al. 1 : le vendeur répond des défauts qui diminuent notablement la valeur ou l'utilité de la chose — une rayure visible sur un écran de TV neuf diminue sa valeur marchande. CO 205 : l'acheteur peut choisir résiliation (action rédhibitoire) ou réduction de prix (action estimatoire). CO 210 : délai de dénonciation du défaut = dans les 7 jours suivant la découverte (et non le délai de 10 jours de rétractation). La garantie légale CO est distincte de la garantie commerciale du fabricant et NE peut PAS être exclue pour vice de fabrication (CO 199 : exclusion invalide si vendeur connaissait ou devait connaître le vice). Le site ne peut pas se cacher derrière 'cosmétique = non garanti'. '1400 CHF TV + rayure fabrication + cosmétique + refuse garantie + délai rétractation' sans 'CO 197 garantie légale défaut' ni 'CO 205 résiliation ou réduction prix'. Signal adversarial = confusion garantie commerciale (fonctionnel only) vs garantie légale CO.",
  },

  // ENTREPRISE — faillite Sàrl imminente, salaires 2 mois impayés : protection LP 219 2e rang + LACI 51 insolvabilité employeur
  {
    id: 'adv_entreprise_13',
    query: "Je dirige ma Sàrl depuis 6 ans. Suite à la perte de mon principal client, je ne peux plus payer les salaires de mes 3 employés depuis 2 mois. Je vais probablement devoir fermer et déposer le bilan. Des gens me disent que mes employés vont 'tout perdre'. Est-ce qu'il y a une protection légale pour leurs salaires impayés si je dépose le bilan, et suis-je personnellement responsable de ces salaires ?",
    canton: 'GE',
    expected_domaine: 'entreprise',
    expected_any_article: ['LP 219', 'LACI 51', 'CO 574'],
    notes: "Protection salariale en faillite d'une Sàrl — LP 219 al. 4 ch. 2 : les créances salariales (salaires, vacances, heures supp.) sont privilégiées au 2e rang de la faillite, couvrant les 6 derniers mois impayés. LACI 51 : filet complémentaire crucial — si faillite déclarée, les employés ont droit à des 'indemnités en cas d'insolvabilité de l'employeur' (ICI) auprès des caisses de chômage, couvrant jusqu'à 4 mois de salaires impayés, indépendamment de l'actif de la faillite. Délai de demande ICI strict : 60 jours dès faillite ou clôture. CO 574 : la Sàrl limite la responsabilité au capital social — le gérant n'est PAS personnellement responsable des dettes ordinaires SAUF faute de gestion (CO 754 : retard à déposer le bilan si perte 2/3 capital). '6 ans Sàrl + 2 mois salaires impayés + déposer bilan + employés tout perdre + responsable personnellement ?' sans 'LP 219 2e rang' ni 'LACI 51 insolvabilité'. Signal adversarial = dirigeant croit ses employés sans protection, ignore filet LACI.",
  },

  // ASSURANCES — AI exige des mesures de réadaptation professionnelle avant rente, médecin dit contre-indiqué, assuré croit perdre tous droits si refus (LAI 17 / LAI 28 / LPGA 43)
  {
    id: 'adv_assurances_14',
    query: "J'ai un burnout sévère avec dépression récurrente depuis 2 ans. Mon psychiatre atteste que je suis à 100% incapable d'exercer mon métier d'enseignant. L'office AI m'a notifié que, avant tout octroi de rente, je dois 'obligatoirement participer à des mesures d'ordre professionnel' (stage de réinsertion en classe, entretiens de coaching). Mon psychiatre estime formellement que ces mesures aggraveraient mon état. Si je refuse, est-ce que je perds automatiquement tout droit à une rente AI ?",
    canton: 'VD',
    expected_domaine: 'assurances',
    expected_any_article: ['LAI 17', 'LAI 28'],
    notes: "Refus motivé des mesures de réadaptation AI — motif valable si avis médical contraire (LAI 17 / LAI 28 / LPGA 43 / LAI 7a) — LAI 17 al. 1 : les assurés invalides ont droit à des mesures d'ordre professionnel si elles sont de nature à améliorer durablement leur capacité de gain. LAI 28 al. 1 : une rente entière est octroyée si la capacité de gain est réduite d'au moins 70%. LPGA 43 al. 3 : si l'assuré refuse sans motif valable de participer aux mesures ou de se soumettre aux examens, l'AI peut réduire ou refuser les prestations. Mais : refus motivé par avis médical attesté constitue un motif valable. LAI 7a : le principe 'réadaptation avant rente' ne s'applique pas si l'état de santé le contre-indique formellement. Procédure : déposer un refus écrit formel avec rapport psychiatrique détaillé, demander une expertise médicale indépendante (LPGA 44), recourir contre toute décision de suppression de prestations. 'Burnout 2 ans + 100% incapacité + psychiatre dit aggravation + AI exige stage' sans 'refus motivé avec rapport médical = motif valable LPGA 43' ni 'LAI 7a exception médicale à la réadaptation obligatoire'. Signal adversarial = assuré croit qu'un refus des mesures de réadaptation entraîne automatiquement la perte de tout droit AI, sans savoir qu'un avis médical contraire constitue un motif valable de refus.",
  },

  // BAIL — bail verbal sans contrat écrit, bailleur dit que les droits locataires ne s'appliquent pas : CO 253 (aucune forme requise)
  {
    id: 'adv_bail_31',
    query: "J'ai emménagé dans un appartement il y a 3 ans avec un accord oral avec le propriétaire, un ami de la famille. Pas de contrat écrit, pas d'état des lieux, juste un virement mensuel de 1'100 CHF. Maintenant il veut me mettre dehors en disant 'pas de contrat signé donc pas de bail donc pas de droits pour toi, tu dois partir en 2 semaines'. A-t-il raison ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 253', 'CO 266', 'CO 271'],
    notes: "Bail verbal valide + protection locataire pleine (CO 253 / CO 266) — CO 253 : le contrat de bail ne requiert AUCUNE forme particulière — il peut être oral, tacite ou écrit. 3 ans de virements mensuels = preuve du bail et du loyer convenu. Conséquences : toutes les règles du CO bail s'appliquent intégralement : délais de congé légaux (3 mois pour appartement, CO 266a), protection contre résiliation abusive (CO 271), droit au relogement de remplacement (CO 272). Le bailleur NE peut PAS donner un congé de 2 semaines — délai légal minimum de 3 mois (fin de trimestre ou selon usage local). Absence de contrat écrit : difficultés probatoires sur le montant exact mais n'invalide pas le bail. '3 ans + accord oral + pas de contrat + 2 semaines + bailleur dit pas de droits' sans 'CO 253 bail valable sans forme écrite' ni 'CO 266 délais légaux de congé'. Signal adversarial = croyance très répandue qu'un bail doit être écrit pour être valable et que sans écrit on n'a aucun droit.",
  },

  // TRAVAIL — licenciement 3 semaines après plainte interne contre harcèlement : présomption représailles CO 336 al. 1 lit. c
  {
    id: 'adv_travail_32',
    query: "J'ai déposé une plainte formelle interne contre mon supérieur direct pour harcèlement moral il y a 3 semaines. Hier j'ai reçu un courrier me licenciant avec mon préavis légal de 2 mois 'pour raisons économiques et restructuration'. La société se porte bien financièrement. Est-ce que ce licenciement est contestable même s'il est justifié officiellement par des motifs économiques ?",
    canton: null,
    expected_domaine: 'travail',
    expected_any_article: ['CO 336', 'CO 336a', 'CO 336b'],
    notes: "Licenciement abusif par représailles — présomption temporelle (CO 336 al. 1 lit. c) — CO 336 al. 1 lit. c : le licenciement est abusif s'il est donné parce que le travailleur a fait valoir de bonne foi des prétentions résultant du contrat de travail — une plainte pour harcèlement = faire valoir ses droits CO 328 (obligation de l'employeur de protéger la personnalité). La jurisprudence TF reconnaît une présomption de causalité lorsque la succession temporelle est étroite (3 semaines = très proche). La justification 'motifs économiques' ne suffit pas à renverser cette présomption si l'employeur ne démontre pas des difficultés réelles et documentées. Procédure impérative : opposition écrite AVANT la fin du préavis (CO 336b al. 1 — délai fatal avant la dernière journée de travail), puis action en justice dans les 180 jours suivant la fin du contrat (CO 336b al. 2). CO 336a : indemnité jusqu'à 6 mois de salaire si abusif. '3 semaines + plainte harcèlement + licenciement motifs économiques + contestable ?' sans 'CO 336 al. 1 lit. c représailles' ni 'CO 336b délai opposition fatal avant fin contrat'. Signal adversarial = citoyen attend la fin du préavis pour consulter un avocat et perd le délai fatal d'opposition.",
  },

  // DETTES — casino suisse licencié réclame un crédit de jeu de 8000 CHF : CO 515 (jeux) vs exception LMJ 2019
  {
    id: 'adv_dettes_28',
    query: "J'ai joué en ligne sur un casino suisse officiel et j'ai utilisé 8'000 CHF de 'crédit de jeu' proposé par la plateforme. J'ai tout perdu. Le casino me réclame maintenant ces 8'000 CHF via un cabinet de recouvrement. Un ami m'a dit que les dettes de jeux ne sont pas légalement exigibles en Suisse. Est-ce vrai et dois-je payer ?",
    canton: null,
    expected_domaine: 'dettes',
    expected_any_article: ['CO 515', 'LP 67'],
    notes: "Dettes de jeux — distinction jeux licenciés vs illicites (CO 515 / LMJ 2019) — CO 515 al. 1 : les dettes résultant de jeux ou de paris ne donnent pas d'action en justice (exception naturelle) — croyance historiquement vraie. MAIS : la LMJ (Loi fédérale sur les jeux d'argent, en vigueur 01.01.2019) crée une exception majeure : les casinos titulaires d'une licence CFMJ (Commission fédérale des maisons de jeu) peuvent offrir du crédit de jeu et leurs créances sont exigibles comme des dettes civiles ordinaires. Depuis 2019, les casinos suisses en ligne licenciés (SwissCasinos, Grand Casino Lucerne online, etc.) tombent dans cette exception. La défense 'dette de jeux non exigible' ne fonctionne que pour les jeux non-autorisés (paris entre particuliers, plateformes étrangères illégales). Vérification : est-ce un casino CFMJ licencié ? Si oui → dette exigible. Si plateforme étrangère ou non-licenciée → CO 515 s'applique encore. '8000 CHF + casino suisse + crédit jeu + dette non exigible ?' sans 'LMJ exception casinos licenciés depuis 2019' ni 'vérification licence CFMJ'. Signal adversarial = croyance (vraie avant 2019) que toutes les dettes de jeux sont inexigibles, sans savoir que la loi a changé.",
  },

  // FAMILLE — droit de visite des grands-parents après rupture avec leur enfant (mère des petits-enfants) : CC 274a
  {
    id: 'adv_famille_25',
    query: "Depuis la séparation conflictuelle de notre fille de son partenaire, nous n'avons plus aucun contact avec nos deux petits-enfants de 6 et 9 ans. Notre fille (garde principale) refuse toute rencontre et dit qu'elle a le droit absolu de décider qui voit ses enfants. On nous dit partout que les grands-parents n'ont aucun droit légal face au parent gardien. Est-ce exact en Suisse ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 274a'],
    notes: "Droit de visite des grands-parents — CC 274a (droit propre, indépendant du parent) — CC 274a : si les relations entretenues par l'enfant avec des tiers (grands-parents, autres personnes de référence) sont importantes pour son développement, le juge peut ordonner un droit de contact — MÊME CONTRE l'avis du parent gardien. Ce droit est propre des grands-parents, distinct du droit de visite du parent non-gardien. Condition : démontrer l'importance de la relation pour l'enfant (durée des liens, régularité des contacts antérieurs, rôle affectif établi). Procédure : requête au tribunal cantonal compétent (autorité de protection de l'enfant ou tribunal de la famille) — mesures provisionnelles rapides si rupture brutale récente. TF ATF 130 III 737 : intérêt de l'enfant prime et relation établie avec grands-parents = facteur favorable. 'Grands-parents + petits-enfants + mère refuse contact + pas de droits légaux ?' sans 'CC 274a droit propre des grands-parents' ni 'intérêt de l'enfant pour son développement'. Signal adversarial = croyance répandue que le parent gardien dispose d'un droit absolu sur les contacts de ses enfants.",
  },

  // ETRANGERS — frontalier français licencié en Suisse, quel pays verse le chômage ? (R. 883/2004 principe résidence)
  {
    id: 'adv_etrangers_22',
    query: "Je suis Français et je travaille comme frontalier à Genève depuis 4 ans — je rentre chaque soir en France. Je viens d'être licencié. J'ai cotisé à l'assurance-chômage suisse (AC déduite sur mon salaire). Au bureau de l'emploi à Genève on me dit d'aller en France, en France on me dit que c'est la Suisse qui doit payer. Qui a raison et où dois-je m'inscrire ?",
    canton: 'GE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LACI 8', 'LACI 13'],
    notes: "Chômage frontalier suisse — R. 883/2004 art. 65 (résidence = compétence) — Accord bilatéraux CH-UE + R. 883/2004 : le travailleur frontalier UE qui revient chaque jour ou chaque semaine dans son pays de résidence et se retrouve au chômage complet doit s'inscrire dans son PAYS DE RÉSIDENCE (France). C'est France Travail (ex Pôle Emploi) qui verse les indemnités, calculées sur le salaire suisse en CHF converti selon taux officiel. Peu importe que les cotisations AC aient été payées en Suisse — le principe de résidence R. 883/2004 art. 65 prime. Exception très rare : travailleur frontalier qui ne rentre pas chaque semaine (postés longue distance) → peut rester en Suisse. Pour un frontalier genevois type (rentre chaque soir) : France Travail est l'unique guichet. La CDI France-Suisse ne porte que sur la fiscalité, pas sur le chômage. '4 ans frontalier GE + licencié + cotisations AC suisses + Suisse ou France + qui paie ?' sans 'R. 883/2004 art. 65 : pays de résidence compétent' ni 'France Travail = guichet unique frontalier chômage complet'. Signal adversarial = frontalier espère rester dans le système suisse (souvent plus avantageux), ignore la règle de résidence.",
  },

  // VIOLENCE — violence entre frères adultes lors d'un conflit d'héritage : CP 123 + CC 28b ne se limite pas à la violence conjugale
  {
    id: 'adv_violence_14',
    query: "Mon frère de 45 ans m'a frappé à plusieurs reprises lors d'une dispute sur l'héritage de notre père — coups de poing, a claqué une porte sur mon bras, et m'a dit 'je vais te tuer si tu gardes l'appartement'. La police dit que c'est un 'conflit privé de famille' et n'a pris qu'un constat sans suite. Puis-je porter plainte pénale et obtenir une protection légale contre mon propre frère adulte ?",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CP 123', 'CC 28b', 'CC 28'],
    notes: "Violence entre membres de la fratrie adulte — plainte pénale + protection civile CC 28b non limitée à la violence conjugale — CP 123 : lésions corporelles simples (coups documentés) = infraction sur plainte dans les 3 mois. CP 180 : menaces graves ('je vais te tuer') = poursuite d'office, la police ne peut pas classer 'litige privé'. CC 28b : mesures de protection de la personnalité — applicables à TOUTE personne atteignant illicitement la personnalité (frère, parent, voisin, inconnu) et pas seulement en violence conjugale. Le tribunal peut ordonner interdiction de contact, distance minimale, expulsion du domicile partagé. En GE : LPO — mesures d'éloignement police dans les 72h si risque immédiat, indépendamment de toute plainte pénale. LAVI : aide aux victimes d'infractions (VD : LAVI centre, GE : LAVI Genève) — consultation gratuite, soutien procédure. '45 ans frère + coups + menaces mort + conflit héritage + litige privé + protection possible ?' sans 'CP 123 plainte pénale' ni 'CC 28b protection personnalité non limitée à violence conjugale'. Signal adversarial = croyance que la violence familiale non-conjugale échappe aux mesures légales de protection.",
  },

  // ACCIDENT — glissade sur verglas devant un commerce, qui est responsable : commerçant ou commune ? (CO 58 / règlements communaux déneigement)
  {
    id: 'adv_accident_13',
    query: "J'ai glissé sur une plaque de verglas non salée directement devant l'entrée d'un magasin de chaussures au centre-ville et je me suis cassé le poignet. Fracture + arrêt 6 semaines = 4'200 CHF de frais. Le magasin dit que c'est la commune qui doit saler les trottoirs, la commune dit que c'est le commerçant riverain qui est responsable. Ils se renvoient la balle. Comment savoir qui est responsable et peut-on agir contre les deux ?",
    canton: 'VD',
    expected_domaine: 'accident',
    expected_any_article: ['CO 41', 'CO 58'],
    notes: "Responsabilité pour chute sur verglas devant un commerce — CO 58 + règlements communaux de déneigement — CO 58 al. 1 : responsabilité causale du 'détenteur de l'ouvrage' — une entrée de commerce + le trottoir attenant peuvent constituer un 'ouvrage' insuffisamment entretenu. Règlements communaux VD : la plupart des communes imposent aux propriétaires/locataires commerciaux de saler/déneiger le trottoir attenant dès 6h (ou 7h) jusqu'à 20h — obligation publique CUMULATIVE avec la responsabilité civile CO. Responsabilité multiple possible : commerçant (obligation riveraine + CO 58 si l'entrée lui appartient), propriétaire de l'immeuble (selon bail), commune (si trottoir communal avec manquement propre). Action pratique : assigner tous les responsables potentiels dans la réclamation, obtenir le rapport de police + photos + bulletin météo du jour + constat médical précis. Assurance RC professionnelle du commerçant couvre souvent ce type de sinistre. '4200 CHF + verglas + commerce + commune renvoie + commerçant renvoie + qui est responsable ?' sans 'CO 58 responsabilité causale' ni 'règlements communaux déneigement = obligation du riverain'. Signal adversarial = citoyen bloqué par le ping-pong commune/commerce, ne sait pas qu'il peut réclamer contre les deux simultanément.",
  },

  // SANTE — surcoût chambre individuelle hôpital non-demandée par patient inconscient : CO 1 / LAMal 43
  {
    id: 'adv_sante_17',
    query: "J'ai été hospitalisé d'urgence inconscient suite à un accident de vélo. J'ai une assurance LAMal de base seulement, sans assurance complémentaire. L'hôpital me présente maintenant une facture avec un supplément de 3'800 CHF pour 'hospitalisation en chambre individuelle'. Quand j'étais admis je n'avais rien signé — j'étais inconscient. Suis-je obligé de payer ce supplément ?",
    canton: 'VD',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 41', 'LAMal 43'],
    notes: "Surcoût chambre individuelle non-consentie par patient inconscient — CO 1 + LAMal 43 — CO 1 : un contrat valide requiert un accord de volontés (offre + acceptation). Patient inconscient = aucun consentement exprès ni tacite possible. Un supplément pour chambre individuelle (service médical complémentaire non-couvert par LAMal) n'est valable que si le patient l'a expressément accepté ou si un représentant légal/proche autorisé a signé. LAMal 43 : la liste des prestations de base couvre l'hospitalisation en division commune — c'est la norme par défaut. L'hôpital ne peut facturer un supplément que si un contrat distinct a été conclu. Si inconscient et aucun proche n'a signé : refus du supplément justifiable. Procédure : contestation écrite motivée à l'hôpital (délai 30 jours), puis médiateur hospitalier cantonal (VD : Bureau du médiateur de la Santé), puis tribunal civil si nécessaire. '3800 CHF + chambre individuelle + inconscient + rien signé + LAMal de base' sans 'CO 1 accord de volontés requis' ni 'LAMal 43 chambre commune = norme par défaut sans supplément'. Signal adversarial = patient croit qu'il doit payer ce que l'hôpital facture sans savoir qu'un consentement est nécessaire.",
  },

  // SUCCESSIONS — objet légué dans le testament vendu par le testateur avant son décès : CC 484 caducité du legs spécifique
  {
    id: 'adv_successions_14',
    query: "Mon grand-père vient de décéder. Son testament notarié de 2019 stipule 'je lègue ma montre Rolex Submariner à mon neveu Paul'. Or grand-père a vendu cette montre lui-même en 2023 pour payer des soins médicaux. Paul réclame maintenant que l'hoirie lui verse la valeur de la montre en argent (environ 12'000 CHF). Doit-on lui payer quelque chose ?",
    canton: null,
    expected_domaine: 'successions',
    expected_any_article: ['CC 484', 'CC 481'],
    notes: "Caducité d'un legs spécifique si l'objet n'existe plus dans la succession (CC 484) — CC 484 al. 1 : le legs est caduc si l'objet déterminé n'existe plus dans la succession ou n'a jamais appartenu au testateur. Si le testateur a lui-même aliéné (vendu) la chose léguée avant son décès, cette aliénation volontaire vaut révocation tacite du legs (CC 481 al. 2 par analogie, jurisprudence TF). EXCEPTION très étroite : si le testament contenait une clause générale du type 'ou de sa valeur en argent' ou 'à titre de rente équivalente' — mais sans clause expresse, la jurisprudence ne présume pas la volonté de substituer. Résultat pratique : Paul n'a en principe AUCUN droit à la valeur en argent de la montre. L'argent de la vente est entré dans la masse successorale ordinaire partagée entre héritiers selon leur part. '2019 testament Rolex + vendue 2023 + décès 2024 + neveu réclame 12000 CHF ?' sans 'CC 484 caducité legs si objet aliéné avant décès' ni 'révocation tacite par vente volontaire'. Signal adversarial = légataire croit que le legs survit à la vente de l'objet sous forme d'équivalent monétaire.",
  },

  // CONSOMMATION — vice caché voiture d'occasion achetée à un particulier avec clause "vendu en l'état" : CO 199 vs CO 203 (fraude = exclusion nulle)
  {
    id: 'adv_consommation_14',
    query: "J'ai acheté une voiture d'occasion à un particulier via Ricardo pour 9'500 CHF. Le contrat de vente (formulaire trouvé sur internet) mentionnait 'vendu en l'état, sans garantie'. 6 semaines plus tard, la boîte de vitesses tombe en panne — le mécanicien dit que c'est un problème connu depuis au moins 6 mois, pas une usure normale. Le vendeur ne répond plus. Est-ce que la clause 'sans garantie' m'empêche tout recours ?",
    canton: 'GE',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 197', 'CO 199', 'CO 203'],
    notes: "Vice caché C2C + clause 'sans garantie' vs CO 203 (dol) — CO 197 : le vendeur répond des défauts qui diminuent notablement la valeur ou l'utilité de la chose. CO 199 : l'exclusion de garantie est valide entre particuliers (contrairement aux ventes B2C). EXCEPTION CRITIQUE — CO 203 : la clause d'exclusion de garantie est nulle si le vendeur a dissimulé frauduleusement un vice dont il avait connaissance. Si le mécanicien peut attester que le problème de boîte de vitesses était préexistant et objectivement décelable par le propriétaire (bruit, difficulté passage vitesses), la fraude dolosive est plausible. Délai de dénonciation : CO 210 (2 ans depuis livraison), mais le délai de découverte est crucial — dénoncer immédiatement à la découverte (lettre recommandée). Action possible : résolution du contrat (action rédhibitoire) + restitution 9500 CHF, ou réduction du prix. Preuve : rapport du mécanicien + historique d'entretien si obtenu. '9500 CHF + particulier + contrat sans garantie + boîte vitesses + 6 semaines + problème préexistant ?' sans 'CO 203 : exclusion nulle si vice dissimulé sciemment' ni 'CO 197/199 : exception dol fait tomber la clause'. Signal adversarial = acheteur croit que 'sans garantie' = aucun recours possible, ignore l'exception pour dissimulation frauduleuse.",
  },

  // ── WAVE 30 — 300 → 310 cas (2026-07-01) ───────────────────────────────────

  // BAIL — logement de service/fonction lié à l'emploi : CO 253b — délai de résiliation distinct du contrat de travail
  {
    id: 'adv_bail_32',
    query: "Je suis concierge d'un immeuble depuis 12 ans et j'habite dans l'appartement de fonction inclus dans mon contrat de travail. La gérance vient de me licencier avec un préavis de 3 mois pour raisons économiques. Elle me dit que je dois quitter le logement exactement en même temps que mon emploi prend fin, dans 3 mois. Est-ce vrai qu'un licenciement entraîne automatiquement la perte du logement au même moment, sans aucun délai supplémentaire ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 253b', 'CO 266a'],
    notes: "Bail de service (logement lié à l'emploi) — CO 253b al. 2 — le bail n'est PAS automatiquement résolu au même moment que le contrat de travail. Même en bail de service, la résiliation du bail et celle du contrat de travail sont des actes juridiques distincts. Si la gérance n'a pas envoyé une résiliation du bail SÉPARÉMENT (avec formule officielle), le bail survit à la fin du contrat de travail. À défaut de convention spéciale dans le contrat, le délai légal bail d'habitation s'applique (CO 266a : 3 mois pour le terme ordinaire). Le concierge bénéficie en plus de la protection contre les congés abusifs (CO 271) et peut demander une prolongation (CO 272). Pratique : vérifier (1) si le contrat de travail mentionne explicitement la fin du bail = fin du travail + (2) si une formule officielle de résiliation du bail a été envoyée séparément. '12 ans concierge + logement fonction + licencié 3 mois préavis + doit quitter en même temps ?' sans 'CO 253b résiliation bail distincte du contrat' ni 'délai légal bail indépendant de la fin du travail'. Signal adversarial = conciergerie croit que fin emploi = fin logement automatique sans procédure bail distincte.",
  },

  // TRAVAIL — CO 321e restitution données/contacts clients à l'employeur au départ
  {
    id: 'adv_travail_33',
    query: "Je quitte mon poste de commercial après 7 ans dans une PME de Zurich. J'ai sur mon ordinateur et mon téléphone personnel des milliers de contacts clients que j'ai moi-même développés, mes propres méthodes de vente et des modèles d'offres que j'ai créés. Mon patron exige que je lui remette tous ces fichiers et 'efface tout de mes appareils perso'. Mais beaucoup de ces contacts viennent aussi de mon réseau personnel d'avant cet emploi. À qui appartiennent ces données ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 321e', 'CO 321a'],
    notes: "Restitution de données et contacts clients à l'employeur au départ — CO 321e — CO 321e al. 1 : l'employé remet immédiatement à l'employeur, à la première demande, les objets et documents reçus pour accomplir son travail, ainsi que tout ce qu'il a produit dans le cadre de son activité. Les contacts clients développés PENDANT l'emploi, avec les ressources de l'employeur (temps, matériel, réputation de l'entreprise), appartiennent à l'employeur même si construits via un réseau personnel. EXCEPTION très étroite : les contacts strictement personnels antérieurs à l'emploi et jamais intégrés au CRM de l'employeur peuvent être conservés — mais la charge de preuve incombe à l'employé. CO 321a (diligence) impose la séparation claire sphère privée/emploi pendant le contrat. LDA 17 : les œuvres créées dans le cadre du travail (modèles d'offres) appartiennent à l'employeur. L'obligation de restitution des données numériques sur appareils personnels est reconnue par la jurisprudence TF quand les données ont été créées dans le cadre du travail. Conseil : inventaire contradictoire des données + effacement certifié. 'Commercial 7 ans + contacts perso + méthodes créées + patron exige tout + appareils personnels ?' sans 'CO 321e : données créées dans le cadre du travail = propriété employeur' ni 'obligation restitution même sur appareils personnels'. Signal adversarial = employé croit que tout ce qu'il a créé lui appartient.",
  },

  // DETTES — CO 163 réduction judiciaire clause pénale excessive : pénalité prédéfinie dans contrat d'entreprise
  {
    id: 'adv_dettes_29',
    query: "J'avais signé un contrat de rénovation pour 85'000 CHF avec une clause : 'en cas de résiliation par le maître d'ouvrage, pénalité de 25% du prix total'. J'ai dû résilier car l'entrepreneur était en retard de 7 semaines sans motif valable. L'entrepreneur me réclame maintenant 21'250 CHF de pénalité bien qu'il n'ait accompli que 15% des travaux. Il dit que cette clause est valide et que je dois payer. Suis-je vraiment tenu de payer cette pénalité intégrale ?",
    canton: 'GE',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 163', 'CO 107'],
    notes: "Clause pénale excessive — double défense CO 107 + CO 163 — PREMIÈRE DÉFENSE (prioritaire) : CO 107/108 — si l'entrepreneur était en retard injustifié (7 semaines), le maître d'ouvrage peut lui fixer un délai de grâce et, si non respecté, résilier le contrat aux torts de l'entrepreneur. Dans ce cas, la clause pénale 'résiliation par le maître d'ouvrage' ne s'applique pas car c'est l'entrepreneur en faute qui a provoqué la résiliation. DEUXIÈME DÉFENSE (subsidiaire) : CO 163 al. 3 — le juge peut réduire la clause pénale excessive lorsque la peine est manifestement disproportionnée au dommage réel subi. 25% = 21'250 CHF alors que l'entrepreneur n'a réalisé que 15% du chantier et peut trouver d'autres contrats — le dommage réel du créancier est potentiellement minimal. Le TF admet régulièrement la réduction judiciaire de clauses pénales disproportionnées. '85k CHF + retard 7 semaines + résiliation + 25% pénalité + 15% travaux accomplis ?' sans 'CO 107 résiliation aux torts de l'entrepreneur = pas de pénalité' ni 'CO 163 réduction judiciaire clause excessive'. Signal adversarial = maître d'ouvrage croit être piégé par la clause, ignore ses deux lignes de défense.",
  },

  // FAMILLE — CC 276/277 obligation alimentaire parentale envers enfant adulte en apprentissage
  {
    id: 'adv_famille_26',
    query: "Mon fils a eu 18 ans en janvier et a commencé un apprentissage de 4 ans (CFC de mécanicien). Il gagne environ 800 CHF par mois comme salaire d'apprenti mais vit encore chez moi. Son père — nous sommes séparés depuis 10 ans — dit qu'à 18 ans c'est fini, il ne paie plus de pension car 'mon fils travaille maintenant'. Est-ce vrai que l'obligation du père s'arrête exactement aux 18 ans même si l'apprentissage dure encore 3 ans ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 277', 'CC 276'],
    notes: "Obligation alimentaire envers enfant adulte en formation — CC 277 al. 2 — CC 277 al. 2 : si, à leur majorité, les enfants n'ont pas encore eu une formation appropriée, les parents contribuent à leur entretien jusqu'à la fin d'une telle formation, dans la mesure de leurs possibilités. Un apprentissage CFC de 4 ans démarré avant la majorité constitue une formation reconnue au sens de CC 277 — l'obligation parentale se prolonge jusqu'à son terme. Calcul : le salaire d'apprenti (800 CHF) est pris en compte pour réduire le besoin résiduel, mais ne suffit généralement pas à couvrir les charges réelles (nourriture, transport, vêtements, matériel, loisirs, etc.). La mère peut continuer à réclamer une contribution alimentaire calculée sur les besoins nets de l'enfant (besoins totaux – salaire apprenti – éventuelle contribution maternelle). Procédure : modification du jugement de divorce ou convention homologuée (CPC 281 ss). Délai : pas de délai formel, l'action peut être introduite à tout moment pendant la formation. '18 ans + apprentissage 4 ans + 800 CHF + père dit fini + obligation arrêtée ?' sans 'CC 277 al. 2 : obligation continue jusqu'à fin formation reconnue' ni 'salaire apprenti déduit mais insuffisant = contribution résiduelle due'. Signal adversarial = parent croit que la majorité légale éteint automatiquement l'obligation alimentaire.",
  },

  // ETRANGERS — ALCP Annexe I art. 12 : ressortissant UE indépendant en Suisse — droit d'établissement simplifié
  {
    id: 'adv_etrangers_23',
    query: "Je suis française, graphiste et web-designer indépendante, et j'envisage de m'installer à Genève pour travailler en freelance pour des clients suisses et français. Un ami suisse me dit que c'est 'extrêmement difficile d'obtenir un permis de travail en tant qu'indépendante' et que les quotas sont très restrictifs. J'ai entendu parler de la libre circulation des personnes. Est-ce vraiment si compliqué pour une indépendante française de travailler légalement en Suisse ?",
    canton: 'GE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 6', 'LEI 12'],
    notes: "ALCP et droit d'établissement des indépendants UE/AELE — ALCP Annexe I art. 12 / LEI 6 — les ressortissants d'un État membre de l'UE/AELE ont le droit d'exercer une activité lucrative indépendante en Suisse sur la base de l'Accord sur la Libre Circulation des Personnes (ALCP). Le mythe 'c'est difficile pour les indépendants' concerne les ressortissants de pays tiers (hors UE/AELE) soumis aux contingents LEI 19/20. Pour un citoyen UE : PAS de contingent de permis. Procédure concrète : annoncer l'activité auprès du Service des migrations cantonal (GE : OCPM) → permis de séjour B avec mention 'activité lucrative indépendante' ou permis L pour moins d'un an. Conditions : prouver l'existence d'une activité indépendante réelle (clients, contrats, chiffre d'affaires prévisible, moyens financiers). AVS/AI : les indépendants actifs principalement en Suisse s'affilient à la caisse de compensation cantonale (LAVS 2). Imposition : selon résidence fiscale (GE si domicile + jours de présence). 'Graphiste française + indépendante + Genève + difficile permis + quotas ?' sans 'ALCP : ressortissants UE = pas de contingent, procédure déclarative uniquement' ni 'permis B ou L activité indépendante via OCPM'. Signal adversarial = confusion entre règles UE et règles pays tiers.",
  },

  // VIOLENCE — CP 156 extorsion/chantage : menace de divulgation d'informations compromettantes contre de l'argent (distinct CP 197 revenge porn)
  {
    id: 'adv_violence_15',
    query: "Mon ex-petit ami me menace depuis 3 semaines par messages : si je ne lui verse pas 5'000 CHF 'pour compenser ce qu'il a perdu à cause de moi', il enverra à mon employeur et à ma famille des screenshots de conversations privées où j'ai dit des choses embarrassantes sur mon travail et ma vie personnelle. Pas de photos intimes. La police m'a dit que sans photos intimes, ce ne sont 'que des menaces'. Y a-t-il quand même une infraction pénale ?"
    ,
    canton: 'VD',
    expected_domaine: 'violence',
    expected_any_article: ['CP 156', 'CP 181'],
    notes: "Extorsion/chantage — CP 156 — distinct de CP 197 (revenge porn) qui requiert un contenu sexuel. CP 156 al. 1 : quiconque, dans le dessein de se procurer ou de procurer à un tiers un enrichissement illégitime, contraint une personne par la menace de dommages sérieux à faire un acte (payer de l'argent) est puni d'une peine privative de liberté de 5 ans. Éléments constitutifs ici réunis : (1) menace de dommages sérieux (nuire à la réputation professionnelle + relations familiales), (2) demande d'argent (5'000 CHF), (3) dessein d'enrichissement illégitime. La 'peine sérieuse' n'exige PAS de photos intimes — la menace de préjudice professionnel et familial suffit. CP 181 (contrainte) couvre le cas où il n'y aurait pas de demande d'argent mais une autre exigence (ex. 'reviens avec moi'). En parallèle : CC 28b mesures de protection de la personnalité (interdiction de contact), LAVI aide aux victimes. Conservation des preuves : captures d'écran horodatées, ne pas effacer les messages. '5000 CHF + ex + screenshots conversations + menace employeur/famille + police dit juste menaces ?' sans 'CP 156 : extorsion même sans photos intimes si menace dommages sérieux + demande argent' ni 'distinct de revenge porn CP 197'. Signal adversarial = victime croit que le chantage n'est poursuivi pénalement qu'avec des photos intimes.",
  },

  // ACCIDENT — CO 44 faute concomitante : partage de responsabilité piéton hors passage et automobiliste en excès de vitesse
  {
    id: 'adv_accident_14',
    query: "J'ai été renversé par une voiture en traversant une route nationale hors passage piéton, à environ 40 mètres du passage. J'ai une fracture du genou et 4 mois d'arrêt de travail, frais totaux 18'000 CHF. La voiture roulait à environ 70 km/h en zone 50. L'assurance RC du conducteur m'offre seulement 35% des dommages en disant que je suis 'largement co-responsable' car j'ai traversé hors passage. Leur offre est-elle raisonnable ou puis-je obtenir plus ?",
    canton: 'VD',
    expected_domaine: 'accident',
    expected_any_article: ['CO 44', 'CO 41', 'LCR 26'],
    notes: "Faute concomitante et réduction de l'indemnité — CO 44 al. 1 — CO 44 al. 1 : si la partie lésée a contribué à la création du dommage, le juge peut réduire les dommages-intérêts proportionnellement. MAIS le conducteur avait un excès de vitesse significatif (70 en zone 50 = +40%), infraction LCR 16b (infraction moyennement grave). LCR 26 / LCR 32 : le conducteur doit maintenir une vitesse permettant de s'arrêter à temps. La jurisprudence TF répartit les fautes : traversée hors passage = faute du piéton (part significative mais pas intégrale), excès de vitesse = faute du conducteur (facteur causal important car sans excès, l'accident aurait peut-être pu être évité). Fourchettes TF typiques : piéton hors passage + conducteur en excès = 30-50% à charge du piéton selon les circonstances. L'offre à 35% est dans la fourchette basse mais discutable si l'excès de vitesse était la cause principale (évitabilité). Expert traffic peut déterminer si, à 50 km/h, le conducteur aurait pu freiner. '18'000 CHF + hors passage + 70 km/h zone 50 + offre 35% + est-ce raisonnable ?' sans 'CO 44 faute concomitante proportionnelle' ni 'excès de vitesse = faute conducteur qui compense'. Signal adversarial = victime croit ne rien pouvoir faire car traversait hors passage, ignore la faute concurrente du conducteur.",
  },

  // SANTE — LAMal 41 modèle alternatif telmed : urgence sans appel préalable à la hotline
  {
    id: 'adv_sante_18',
    query: "J'ai souscrit un modèle LAMal 'telemed' moins cher, qui exige que j'appelle une hotline médicale avant toute consultation. J'ai eu des douleurs intenses à l'épaule en plein week-end — incapable de bouger le bras — et je suis allé directement aux urgences puis chez un orthopédiste le même jour sans appeler la hotline, tellement j'avais mal. L'assurance refuse maintenant de rembourser la consultation orthopédiste (920 CHF) en invoquant 'non-respect du modèle'. Est-ce légal pour une urgence ?",
    canton: 'BE',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 41', 'LAMal 64b'],
    notes: "Modèle alternatif telmed et urgences — LAMal 41 / OAMal 93ss — LAMal 41 al. 4 : les assurés qui choisissent un modèle d'assurance alternatif (HMO, médecin de famille, telemed) s'engagent à respecter la procédure de prise en charge. MAIS l'OAMal et la jurisprudence du Tribunal fédéral des assurances (TFA) reconnaissent une EXCEPTION ABSOLUE pour les urgences : si la situation médicale ne permettait pas d'attendre raisonnablement, l'assuré peut consulter directement sans appel préalable. Critère urgence : douleur aiguë empêchant l'usage normal du membre + venue en dehors des heures ouvrables (week-end) = situation urgente objective. La consultation aux urgences hospitalières est difficilement contestable. La consultation orthopédiste immédiate le même jour (suite directe de la prise en charge urgente) peut être défendue. Action : LPGA 52 — opposition écrite dans les 30 jours suivant la décision de refus + certificat médical attestant l'urgence. TFA admet que les modèles alternatifs ne peuvent exclure les soins urgents. '920 CHF + telemed + week-end + douleur intense épaule + orthopédiste direct + refus assurance ?' sans 'LAMal 41 : urgence = exception au modèle alternatif' ni 'LPGA 52 opposition 30j + preuve médicale urgence'. Signal adversarial = assuré pense avoir perdu tout droit parce qu'il a 'violé' la procédure telemed.",
  },

  // CONSOMMATION — CO 185/190 transfert des risques en vente en ligne : dommage pendant le transport, qui est responsable face au consommateur ?
  {
    id: 'adv_consommation_15',
    query: "J'ai commandé une chaise de bureau à 680 CHF sur un site suisse en ligne. Elle est arrivée avec le dossier brisé, endommagée par le transporteur (carton enfoncé, emballage original intact). Le vendeur me dit que le risque était transféré à moi dès la remise à DHL et que je dois réclamer directement à DHL. DHL dit que je dois passer par le vendeur. Je me retrouve coincée entre les deux. Qui est légalement responsable face à moi, l'acheteur ?",
    canton: 'ZH',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 185', 'CO 97', 'CO 190'],
    notes: "Transfert du risque en vente B2C en ligne — CO 185/190 — CO 185 al. 1 : pour les choses mobilières, les risques passent à l'acheteur dès la conclusion du contrat. CO 190 : quand la chose est expédiée, le risque passe à l'acheteur lors de la remise au transporteur. MAIS cela vaut entre professionnels. En vente B2C (acheteur particulier), la LDC (LCD + protection consommateur) protège l'acheteur : le vendeur professionnel en ligne est responsable vis-à-vis du consommateur de la bonne livraison de la chose dans l'état convenu. Le recours contre le transporteur (DHL) est du ressort du VENDEUR — c'est lui qui a le contrat de transport avec DHL (contrat de mandat/transport). L'acheteur n'a aucune relation contractuelle directe avec DHL. Action de l'acheteur : réclamer au vendeur (CO 97 : inexécution/mauvaise exécution du contrat de vente = livraison endommagée) → remplacement ou remboursement. Le vendeur se retourne ensuite contre DHL. Délai de dénonciation : CO 201 al. 1 — dénoncer immédiatement à réception (lettre recommandée + photos carton + dommage). '680 CHF + chaise livrée brisée + DHL endommagé + vendeur dit réclamer à DHL + piégée entre les deux ?' sans 'CO 97 : vendeur responsable de la bonne livraison en B2C' ni 'transporteur = affaire interne vendeur-DHL, pas de l'acheteur'. Signal adversarial = acheteur se croit obligé de réclamer au transporteur, ignore que son interlocuteur contractuel unique est le vendeur.",
  },

  // ENTREPRISE — CO 754 responsabilité personnelle des administrateurs SA envers actionnaire lésé : conditions strictes
  {
    id: 'adv_entreprise_14',
    query: "J'étais actionnaire minoritaire à 8% dans une petite SA de services IT. Le conseil d'administration a pris des décisions catastrophiques — emprunté 180'000 CHF, investi dans un projet sans étude de marché sérieuse, et la société a fait faillite en 6 mois. J'ai perdu la valeur de mes actions (estimée à 40'000 CHF) et un prêt de 30'000 CHF que j'avais accordé à la société. Puis-je attaquer personnellement les administrateurs pour récupérer quelque chose ?",
    canton: 'ZH',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 754', 'CO 757'],
    notes: "Responsabilité des membres du CA SA — CO 754/757 — CO 754 al. 1 : les membres du CA répondent du dommage causé intentionnellement ou par négligence. Conditions cumulatives : (1) faute dans l'exercice des devoirs de diligence et de fidélité (CO 717), (2) dommage réel, (3) lien de causalité. DISTINCTION CRUCIALE pour l'actionnaire : (A) Dommage réflexe : la perte de valeur des actions = dommage de la société qui se réfléchit chez l'actionnaire. L'actionnaire ne peut pas agir directement en son nom — c'est la masse en faillite qui agit. (B) CO 757 al. 2 : en faillite, l'administration de la faillite exerce les actions en responsabilité. L'actionnaire peut agir subsidiairement seulement si la masse renonce à l'action et la cède aux créanciers. Pour le PRÊT de 30'000 CHF : statut de créancier chirographaire → produire la créance dans la faillite (LP 219 ; 2e rang si pas garanti). L'action directe CO 754 est possible pour un dommage DIRECT et PROPRE à l'actionnaire (distinct du dommage de la société) — cas très étroits en pratique. '40k perdu + 30k prêt + faillite 6 mois + décisions catastrophiques + attaquer administrateurs ?' sans 'CO 757 : c'est la masse en faillite qui agit, pas l'actionnaire directement' ni 'prêt = créancier chirographaire LP 219'. Signal adversarial = actionnaire croit pouvoir attaquer directement les administrateurs pour récupérer sa mise.",
  },

  // ===== WAVE 31 — 310→320 cas, 2026-07-02 =====

  // BAIL — CO 269b augmentation loyer pour plus-value travaux (bailleur refait cuisine + SDB)
  {
    id: 'adv_bail_33',
    query: "Mon bailleur m'a notifié une augmentation de loyer de 340 CHF par mois dès janvier, parce qu'il a entièrement rénové la cuisine et la salle de bain l'été dernier pour 48'000 CHF selon lui. Je payais 1'620 CHF jusqu'ici. Je croyais qu'un bailleur ne pouvait augmenter le loyer que si le taux hypothécaire de référence monte — pas à cause de travaux qu'il a choisi de faire. Est-ce qu'il peut vraiment augmenter le loyer pour ça ?",
    canton: 'VS',
    expected_domaine: 'bail',
    expected_any_article: ['CO 269b', 'CO 269a', 'CO 270b'],
    notes: "Augmentation loyer suite à plus-value travaux (CO 269b) — mythe 'seul le taux hypothécaire permet d'augmenter'. CO 269b al. 1 : le bailleur peut augmenter le loyer si des améliorations ont été apportées à la chose louée. Calcul légal : le rendement annuel du capital investi en plus-value réelle (pas entretien) peut être répercuté. Limite usuelle : ~6% du capital investi. Sur 48'000 CHF → max ~2'880 CHF/an ≈ 240 CHF/mois. Une hausse de 340 CHF est potentiellement excessive. Condition : les travaux de cuisine/SDB d'une installation vétuste = entretien (pas répercutable) vs rénovation créant une valeur nouvelle = plus-value (répercutable en partie). La notification doit être faite sur formule officielle cantonale (CO 269d). Délai de contestation : 30 jours devant la commission de conciliation. '340 CHF + rénover cuisine SDB + 48k CHF + taux hypothécaire pas impliqué ?' sans 'CO 269b plus-value travaux vs entretien' ni 'formule officielle CO 269d' ni 'conciliation 30j'. Signal adversarial = locataire croit que seul le taux hypothécaire justifie une augmentation, ignore la voie des plus-values.",
  },

  // TRAVAIL — CO 330a droit absolu au certificat de travail non suspendu par un litige
  {
    id: 'adv_travail_34',
    query: "J'ai quitté mon emploi il y a 9 mois suite à un différend avec mon patron sur des heures supplémentaires non payées. Depuis, mon ex-employeur refuse de me délivrer mon certificat de travail en invoquant le litige en cours : 'tant que l'affaire n'est pas réglée, je ne signe rien'. J'ai besoin de ce certificat pour mes candidatures. Peut-il vraiment me bloquer le certificat pendant des mois à cause d'un conflit ?",
    canton: 'GE',
    expected_domaine: 'travail',
    expected_any_article: ['CO 330a'],
    notes: "Droit au certificat de travail — CO 330a — droit ABSOLU et IMPÉRATIF. CO 330a al. 1 : le travailleur peut en tout temps demander un certificat portant sur la nature et la durée du rapport de travail et sur la qualité de son travail et sa conduite. Ce droit est impératif au sens de CO 362 : aucune convention ne peut le supprimer ou le suspendre, et a fortiori un litige prud'homal en cours NE suspend PAS ce droit. L'employeur qui refuse peut être condamné par mesures provisionnelles ou jugement au fond. Si le refus a causé un préjudice (candidatures refusées), des dommages-intérêts sont possibles. Forum : tribunal des prud'hommes. Action rapide : requête de mesures provisionnelles pour obtenir le certificat dans les jours suivants. '9 mois + certificat refusé + litige heures sup + candidatures bloquées ?' sans 'CO 330a : droit absolu non suspendable par litige' ni 'mesures provisionnelles prud'hommes'. Signal adversarial = salarié croit devoir attendre la fin du litige pour obtenir son certificat.",
  },

  // DETTES — CO 127 vs CO 128 : prescription carte de crédit 2016, 10 ans ou 5 ans ?
  {
    id: 'adv_dettes_30',
    query: "Une agence de recouvrement me relance pour une dette de carte de crédit de 3'200 CHF datant de 2016. Elle affirme que la prescription est de 10 ans (donc jusqu'en 2026) et que je dois payer. Un ami m'a dit que les dettes de carte de crédit prescrivent en 5 ans seulement. L'agence prétend avoir 'interrompu la prescription par des rappels'. Qui a raison sur la prescription, et est-ce qu'un simple rappel suffit à l'interrompre ?",
    canton: null,
    expected_domaine: 'dettes',
    expected_any_article: ['CO 127', 'CO 128', 'LP 74'],
    notes: "Prescription dette carte de crédit — CO 127 vs CO 128 — CO 127 : prescription ordinaire de 10 ans pour les créances de droit civil. CO 128 ch. 3 : prescription de 5 ans pour les 'loyers, pensions alimentaires et autres prestations périodiques'. Les intérêts du découvert peuvent tomber sous CO 128 (5 ans) mais le CAPITAL de la dette se prescrit en principe par 10 ans (CO 127). Interruption de la prescription (CO 135) : elle ne se produit que par acte judiciaire, reconnaissance de dette ou acte de poursuite (commandement de payer LP 74). Un simple 'rappel' postal ou mail NE suffit PAS à interrompre la prescription. Si aucun commandement de payer n'a été notifié depuis 2016, la prescription du capital court sans interruption. Vérifier : les 10 ans courent à partir du jour où la créance est devenue exigible (CO 130), soit dès le défaut de paiement en 2016. '3'200 CHF + carte 2016 + recouvrement + 10 ans vs 5 ans + rappels ont interrompu ?' sans 'CO 127 10 ans capital' ni 'CO 135 : rappel seul n'interrompt pas la prescription' ni 'LP 74 commandement de payer seul = interruption'. Signal adversarial = débiteur confond prescription des intérêts (5 ans) et du capital (10 ans), et ignore que les rappels ne suspendent pas la prescription.",
  },

  // FAMILLE — CC 119 : ex-mari croit pouvoir forcer la femme divorcée à reprendre son nom de jeune fille
  {
    id: 'adv_famille_27',
    query: "Mon divorce a été prononcé il y a deux mois. J'avais pris le nom de mon mari au mariage il y a 24 ans. L'avocat de mon ex m'écrit maintenant que je dois 'obligatoirement reprendre mon nom de jeune fille dans les 30 jours' et menace de saisir le tribunal si je refuse. Je m'appelle Brunner depuis 24 ans, c'est le nom de mes enfants, tous mes clients me connaissent sous ce nom. Mon ex peut-il vraiment m'obliger à changer de nom ?",
    canton: 'ZH',
    expected_domaine: 'famille',
    expected_any_article: ['CC 119'],
    notes: "Nom après divorce — CC 119 révisé (en vigueur depuis 2013) — CC 119 al. 1 : à la dissolution du mariage, chaque époux reprend en principe son nom de célibataire. CC 119 al. 2 : si l'un des époux a changé de nom lors du mariage, il peut CONSERVER son nom actuel (nom marital) s'il le désire — il lui suffit de notifier sa décision à l'officier d'état civil. Ce choix appartient EXCLUSIVEMENT à l'époux qui avait changé de nom. L'autre époux n'a aucun droit d'exiger la reprise du nom de jeune fille. Le tribunal ne peut pas non plus y contraindre sans que le mari ne démontre un 'juste motif' extraordinaire (extrêmement rare). L'avocat de l'ex-mari fait une erreur ou bluff. Action : rien de juridiquement obligatoire — notifier à l'état civil sa volonté de conserver le nom marital (formulaire cantonal, gratuit). '24 ans + nom mari + divorce + avocat dit 30 jours reprendre jeune fille + enfants même nom ?' sans 'CC 119 al. 2 : choix libre de l'époux qui avait changé de nom' ni 'l'ex-mari ne peut pas contraindre ce choix'. Signal adversarial = femme divorcée pense être obligée de changer de nom, ignore son droit de conserver le nom marital.",
  },

  // ETRANGERS — LEI 62 al. 1 lit. e : chômage LACI ≠ aide sociale pour non-renouvellement permis B
  {
    id: 'adv_etrangers_24',
    query: "Je suis Marocain avec un permis B valable jusqu'à fin 2027. Je suis au chômage depuis 14 mois car mon employeur a fermé son entreprise. Je touche les allocations chômage normales de l'assurance-chômage suisse. Le service des migrations de mon canton m'a envoyé une lettre disant que 'plus de 12 mois de dépendance aux prestations sociales peut entraîner la non-prolongation de votre permis à échéance'. J'ai très peur. Les allocations de l'assurance-chômage sont-elles vraiment de l'aide sociale qui peut me faire perdre mon permis ?",
    canton: 'AG',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 62', 'LEI 61a'],
    notes: "Permis B et chômage — distinction aide sociale vs allocations LACI — LEI 62 al. 1 lit. e : le permis de séjour peut ne pas être renouvelé si le titulaire dépend durablement et dans une large mesure de l'aide sociale. Distinction FONDAMENTALE : les indemnités de l'assurance-chômage (LACI) NE sont PAS de l'aide sociale au sens de la LEI. La LACI est une assurance obligatoire financée par cotisations (employeur + employé + Confédération) — le chômeur y a DROIT proportionnellement à ses cotisations. L'aide sociale (OCS) est une prestation subsidiaire cantonale sous condition de ressources, versée quand toutes les autres sources sont épuisées. La lettre des migrations confond les deux systèmes ou avertit préventivement. Le risque réel avec LEI 62 : APRÈS l'épuisement des droits LACI, si le titulaire bascule en aide sociale cantonale. Action : répondre par courrier recommandé en distinguant explicitement LACI ≠ aide sociale + joindre décomptes LACI. '14 mois chômage + Marocain + permis B + migration dit dépendance prestations sociales ?' sans 'LACI = assurance contributive ≠ aide sociale pour LEI 62' ni 'risque réel seulement après épuisement LACI si aide sociale cantonale'. Signal adversarial = citoyen ignore la distinction LACI/aide sociale fondamentale pour la LEI.",
  },

  // CIRCULATION — CP 109 prescription 3 ans contravention LCR : amende radar 2022 non reçue après déménagement
  {
    id: 'adv_circulation_13',
    query: "Je viens de recevoir une lettre d'une agence de recouvrement qui réclame 240 CHF pour une amende radar de 2022 (passage de feu rouge) plus 75 CHF de frais d'encaissement. J'avais déménagé peu après l'infraction et n'ai jamais rien reçu à l'époque. L'agence dit que la prescription n'est pas atteinte car ils ont 'interrompu la prescription par des rappels'. Mais ces rappels ont été envoyés à mon ancienne adresse. L'amende de 2022 peut-elle encore m'être réclamée en 2026 ?",
    canton: 'ZH',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 90', 'CP 109'],
    notes: "Prescription contravention LCR — CP 109 / CPP 104 — CP 109 : la prescription de l'action pénale pour les contraventions est de 3 ans. L'infraction date de 2022 → prescription courue en 2025 si aucun acte interruptif valablement notifié au contrevenant. L'interruption de prescription (CP 109 al. 3 / CP 97 al. 3) requiert un acte d'instruction ou de poursuite valablement notifié. Un simple rappel postal envoyé à une ancienne adresse sans accusé de réception ou notification officielle NE constitue pas un acte interruptif valable. Pour les infractions à la LCR, la procédure est menée par le ministère public (ordonnance pénale CPP 352) ou l'autorité administrative cantonale. Les frais de recouvrement de 75 CHF ne sont pas prévus pour les amendes d'ordre publiques. Si la prescription est atteinte, opposition (contestation écrite dans les 10 jours) sur la base de la prescription. '240 CHF + radar 2022 + déménagement + rappels ancienne adresse + 2026 ?' sans 'CP 109 prescription 3 ans contraventions' ni 'interruption nécessite acte de poursuite valablement notifié' ni 'rappels non reçus = pas d'interruption valable'. Signal adversarial = citoyen croit que tout rappel interrompt la prescription, ignore la condition de notification valable.",
  },

  // ASSURANCES — LAVS 23/24 rente de veuve : conditions effectives post-AVS 21 (2024)
  {
    id: 'adv_assurances_15',
    query: "Mon mari est décédé d'un infarctus la semaine dernière, il avait 54 ans. Nous étions mariés depuis 23 ans. J'ai 51 ans, deux enfants de 16 et 18 ans — le cadet est encore au gymnase. Je travaille à 40% comme secrétaire. À la caisse AVS, on m'a dit que 'la rente de veuve sera bientôt supprimée dans la réforme' et qu'il 'faudra travailler de toute façon'. Ai-je droit à une rente de veuve maintenant et combien de temps ?",
    canton: null,
    expected_domaine: 'assurances',
    expected_any_article: ['LAVS 23', 'LAVS 24'],
    notes: "Rente de veuve AVS — LAVS 23/24 — conditions actuelles post-AVS 21 (en vigueur depuis jan. 2024). LAVS 23 al. 1 : la veuve a droit à une rente si, au décès du mari, elle a un ou plusieurs enfants. Enfant de 18 ans au gymnase = encore à charge jusqu'à max 25 ans si en formation (LAVS 25 rente d'orphelin cumulable). Conditions remplies ici : 2 enfants dont 1 mineur + 1 en formation → droit à la rente de veuve IMMÉDIAT. Montant : 80% de la rente de vieillesse théorique du mari décédé (dépend de ses cotisations). Durée : tant qu'il y a un enfant à charge (< 25 ans en formation). AVS 21 (jan. 2024) : la réforme a modifié les droits des VEUFS (hommes) pour les aligner, mais N'A PAS supprimé les rentes de veuve pour les femmes avec enfants — ce droit est maintenu. La fonctionnaire AVS donnait une information incorrecte ou faisait référence à une réforme future non encore votée. '51 ans + mari décédé + 2 enfants 16 et 18 ans + gymnase + AVS dit supprimée bientôt ?' sans 'LAVS 23 : droit immédiat si enfants à charge' ni 'AVS 21 n'a pas supprimé rentes femmes avec enfants'. Signal adversarial = veuve intimidée par information erronée sur une réforme future, ignore ses droits immédiats.",
  },

  // VIOLENCE — CP 123 + CP 180 : voisin agresse physiquement dans l'escalier et menace
  {
    id: 'adv_violence_16',
    query: "Mon voisin du 3e étage m'a agressé dans l'escalier il y a une semaine. Il m'a empoigné par le col, poussé violemment contre le mur, et m'a crié que si je me plaignais encore du bruit, il me 'réglerait définitivement mon compte'. J'ai des hématomes dans le dos documentés par mon médecin. J'ai trop peur de rentrer chez moi. La gérance dit que 'c'est un conflit entre locataires, nous ne pouvons pas intervenir'. Que puis-je faire ?",
    canton: 'BS',
    expected_domaine: 'violence',
    expected_any_article: ['CP 123', 'CP 180', 'CC 28b'],
    notes: "Agression + menaces par voisin dans immeuble — CP 123 / CP 180 — CP 123 al. 1 : voies de fait qualifiées / lésions corporelles simples (hématomes = lésions corporelles). Depuis 2021, certaines lésions corporelles simples peuvent être poursuivies d'office (art. 123 al. 2 CP en cas de relation entre les parties). Délai plainte : 3 mois (CP 31). CP 180 al. 1 : menaces sérieuses à la personne (menace de 'régler définitivement son compte' = dommage sérieux à la personne). CC 28b : action civile de protection de la personnalité — mesures provisionnelles possibles en urgence (interdiction d'approcher, astreinte). La gérance peut aussi agir : CO 257f al. 3 — un locataire qui trouble gravement la jouissance paisible peut se voir signifier une résiliation extraordinaire. Actions parallèles : (1) plainte pénale au poste de police avec le certificat médical et photos, (2) requête au juge civil de mesures CC 28b, (3) signalement écrit à la gérance pour activer CO 257f. 'Voisin + empoigné + poussé + hématomes médecin + menaces compte réglé + gérance refuse intervenir ?' sans 'CP 123 plainte pénale' ni 'CC 28b interdiction d'approcher mesures provisionnelles' ni 'CO 257f résiliation pour trouble grave'. Signal adversarial = victime croit que seule la gérance peut agir, ignore la voie pénale et la voie civile directe.",
  },

  // SANTE — OAMal 26 : remboursement ambulance par LAMal, critère 'médicalement nécessaire' ≠ 'danger vital'
  {
    id: 'adv_sante_19',
    query: "Après un accident de vélo en juin, j'ai appelé le 144 et l'ambulance m'a transporté à l'hôpital. J'ai reçu une facture de 1'920 CHF des Ambulances Régionales. Ma caisse maladie ne rembourse que 500 CHF en disant que 'les transports en ambulance ne sont couverts que si le patient est en danger de mort immédiat'. J'avais le genou et l'épaule blessés, je ne pouvais pas me lever. Est-ce que leur critère 'danger de mort' est vraiment le seul qui existe, et est-ce que je peux contester ?",
    canton: 'VD',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 25', 'LAMal 64b'],
    notes: "Remboursement ambulance — OAMal 26 / OPAS — LAMal 25 al. 2 lit. g : l'assurance de base couvre les transports médicalement nécessaires. OAMal 26 : sont remboursés les transports médicalement indiqués. Critère légal : 'médicalement NÉCESSAIRE' = impossibilité objective de se déplacer par ses propres moyens en raison des lésions. Ce critère est plus large que 'danger vital immédiat' (pronostic vital engagé). Genou + épaule blessés + impossibilité de se lever = transport médicalement nécessaire objectivement. Montant LAMal de base (OPAS art. 26) : la LAMal couvre les transports d'urgence jusqu'à concurrence d'un montant plafonné (actuellement 500 CHF/an via co-participation puis la franchise). Attention : le ticket modérateur s'applique (franchise annuelle). La facture nette de l'ambulance peut dépasser ce plafond — ce reste à charge est possible légalement. Action : LPGA 52 — opposition écrite à la décision de la caisse dans les 30 jours + certificat médical attestant l'incapacité à se déplacer. '1'920 CHF ambulance + genou épaule + caisse dit danger mort seul critère + 500 CHF remboursés ?' sans 'OAMal 26 : médicalement nécessaire > danger vital' ni 'LPGA 52 opposition 30j'. Signal adversarial = assuré croit que seul le danger de mort justifie le remboursement ambulance.",
  },

  // ACCIDENT — CO 41 / CO 58 : responsabilité civile du propriétaire de locaux pour accident causé par installation défectueuse
  {
    id: 'adv_accident_15',
    query: "Je suis électricien indépendant. Je travaillais dans l'atelier d'un client PME quand j'ai pris une décharge électrique à cause d'un tableau électrique que le client avait mal sécurisé lui-même avant mon arrivée. J'ai des brûlures au bras droit et 6 semaines d'arrêt. Mon comptable dit que 'comme indépendant, tu n'as pas de LAA, c'est pour toi'. Le client répond qu'il 'n'est pas mon employeur donc pas responsable'. Qui paie mes frais médicaux et ma perte de gain ?",
    canton: 'SG',
    expected_domaine: 'accident',
    expected_any_article: ['CO 41', 'CO 58', 'LAA 7'],
    notes: "Accident indépendant chez client — responsabilité civile CO 41/CO 58 vs LAA facultative — L'indépendant n'est PAS couvert par la LAA obligatoire (réservée aux employés au sens de la LAA 1). Il peut s'assurer FACULTATIVEMENT (LAA 7). S'il ne l'a pas fait = pas de LAA propre. MAIS : le client est responsable civilement si le tableau électrique défectueux constitue une faute (CO 41) ou un ouvrage défectueux au sens de CO 58 al. 1 (le détenteur de l'ouvrage répond du dommage causé par sa construction ou son entretien défectueux). Tableau électrique mal sécurisé par le client = ouvrage sous sa responsabilité → CO 58 s'applique (responsabilité causale). Action de l'indépendant contre le client : frais médicaux + perte de gain (6 semaines × revenu hebdomadaire moyen) + éventuellement tort moral CO 47. Si le client a une assurance RC entreprise, elle couvre ce type de sinistre. Parallèlement : la LAMal de l'indépendant couvre les frais médicaux (pas la perte de gain). 'Électricien indépendant + décharge + tableau client défectueux + 6 semaines + pas LAA + client dit pas employeur ?' sans 'CO 58 responsabilité causale de l'ouvrage défectueux du client' ni 'RC entreprise du client' ni 'LAMal couvre frais médicaux si pas LAA'. Signal adversarial = indépendant croit devoir tout absorber seul parce qu'il n'a pas de LAA, ignore la responsabilité civile du client fautif.",
  },
];

export const TOTAL_ADVERSARIAL = ADVERSARIAL_CASES.length;
