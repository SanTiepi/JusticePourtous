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

  // ========== WAVE 32 — angles inédits ==========

  // BAIL — CO 267/267a état des lieux de sortie unilatéral : PV non co-signé, retenue dépôt injustifiée
  {
    id: 'adv_bail_34',
    query: "J'ai rendu mon appartement le 30 avril. La régie a fait l'état des lieux de sortie sans moi : j'avais demandé un report d'une semaine pour raisons professionnelles, ils ont refusé et l'ont fait dans mon dos. Maintenant ils me retiennent 2'600 CHF sur mon dépôt de garantie pour 'rayures parquet' et 'peinture tachée'. Mais ces dégâts étaient déjà là à l'entrée — j'ai des photos. Est-ce que ce PV de sortie fait sans ma présence est valable et peuvent-ils retenir cette somme ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 267', 'CO 267a'],
    notes: "État des lieux de sortie unilatéral et retenue du dépôt — CO 267/267a — La pratique exige que l'état des lieux de sortie soit contradictoire (en présence des deux parties) pour avoir pleine valeur probante. Un PV fait sans le locataire n'est pas nul en soi, mais sa force probante est fortement réduite : le locataire peut contester les constatations. Photos d'entrée + absence de PV d'entrée co-signé mentionnant les dommages = charge de la preuve sur le bailleur. CO 267a : le locataire ne répond que de la détérioration résultant d'un usage non conforme à sa destination (CO 267 al. 2). L'usure normale (peinture jaunie, calcaire, légères rayures sur parquet vieux) est à la charge du bailleur — cf. durée d'amortissement cantonale. Le PV unilatéral ne lui donne pas plus de droits qu'un PV contradictoire : les montants retenus doivent être justifiés et correspond au-delà de l'usure normale. Action : lettre recommandée contestant le décompte dans les 30 jours + exiger la restitution auprès de la banque dépositaire si le blocage est injustifié, ou saisine de la conciliation bail. 'Gérance fait PV sans moi + retient 2600 CHF + photos d'entrée attestant dommages préexistants ?' sans 'PV unilatéral = valeur probante réduite' ni 'CO 267a usure normale à charge du bailleur' ni 'contestation décompte recommandée dans 30j'. Signal adversarial = locataire croit que le PV fait en son absence est définitif et que les retenues sont automatiquement valables.",
  },

  // TRAVAIL — CO 324a obligation minimale salariale pendant maladie sans assurance IJM collective
  {
    id: 'adv_travail_35',
    query: "Je suis malade depuis 3 semaines, médecin m'a mis en arrêt total. Mon employeur (PME de 4 personnes, aucune assurance maladie collective) m'a versé 3 jours de salaire et maintenant il me dit que c'est 'ce que la loi oblige' et qu'il ne doit plus rien. J'ai travaillé dans cette entreprise depuis 2 ans et demi. Est-ce qu'il a raison, ou est-ce que j'ai droit à plus ?",
    canton: 'NE',
    expected_domaine: 'travail',
    expected_any_article: ['CO 324a'],
    notes: "Obligation de payer le salaire pendant maladie — CO 324a — CO 324a al. 2 : en l'absence d'accord plus favorable, l'employeur doit verser le salaire selon les barèmes cantonaux (échelle de Berne, Zurich, Bâle selon le canton). Barème bernois (le plus courant) pour 2 ans et demi de service : minimum 3 semaines de salaire à 100%. Les 3 jours versés ne couvrent pas cette obligation. Sans assurance indemnité journalière collective, l'employeur prend le risque à sa charge. CO 324a al. 3 : l'obligation cesse si l'employeur a souscrit une assurance maladie-IJM couvrant au moins autant (90% du salaire, dès le 1er ou 3e jour). Ici : pas d'assurance collective → l'obligation légale CO 324a al. 2 s'applique directement. Pour 2,5 ans d'ancienneté : minimum 3 semaines (barème bernois). Lettre recommandée réclamant le solde. Si refus : Office cantonal du travail ou tribunal du travail. 'PME + 2,5 ans service + maladie 3 semaines + patron dit 3 jours légaux ?' sans 'CO 324a barème bernois min. 3 semaines pour 2,5 ans' ni 'obligation sans assurance IJM = plein salaire sur durée légale'. Signal adversarial = employé ignore l'existence du barème cantonal CO 324a et croit que 3 jours est la norme légale.",
  },

  // DETTES — LP 84 mainlevée définitive sur clause de reconnaissance de dette contractuelle
  {
    id: 'adv_dettes_31',
    query: "Une banque m'a envoyé un commandement de payer pour 12'400 CHF. J'ai fait opposition parce que je conteste les frais ajoutés, mais la banque m'a répondu qu'elle allait demander la 'mainlevée définitive' car le contrat de crédit que j'ai signé contient une clause qui dit que 'le solde certifié par la banque vaut reconnaissance de dette et titre de mainlevée'. Est-ce que cette clause suffit vraiment pour que le juge lève mon opposition sans procès ?",
    canton: 'VD',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 80', 'LP 81', 'LP 82'],
    notes: "Mainlevée définitive vs provisoire — clause de reconnaissance de dette contractuelle — LP 80 : la mainlevée définitive est possible si le créancier est au bénéfice d'un jugement ou d'une décision assimilée. LP 81/82 : mainlevée provisoire si le créancier produit un titre de mainlevée (reconnaissance de dette, acte authentique, contrat signé + reconnaissance). Clause 'solde certifié = titre de mainlevée' : les contrats de crédit standard ne constituent en général qu'un titre de mainlevée PROVISOIRE (LP 82), pas définitive. Avec une mainlevée provisoire accordée, le débiteur peut intenter une action en libération de dette dans les 20 jours (LP 83). Pour la mainlevée définitive, il faut un jugement (LP 80). La distinction est cruciale : provisoire = procès possible encore ; définitive = seul recours en révision. '12'400 CHF + opposition + banque dit clause = mainlevée définitive ?' sans 'LP 82 mainlevée provisoire seulement pour contrat de crédit' ni 'LP 83 action en libération de dette dans 20j après provisoire'. Signal adversarial = débiteur ne sait pas qu'il peut encore agir en libération de dette même si mainlevée provisoire accordée.",
  },

  // FAMILLE — CC 298b al. 2 / CC 301 : droits du père non marié pour décisions médicales de l'enfant
  {
    id: 'adv_famille_28',
    query: "J'ai un fils de 5 ans avec une femme avec qui je ne suis pas marié. Nous sommes séparés depuis 2 ans. L'autorité parentale est 'conjointe' depuis les réformes, mais mon fils doit subir une opération des amygdales et la mère a pris tous les rendez-vous sans m'informer, sans me consulter. Elle dit que 'c'est elle qui décide pour la santé' puisque l'enfant vit chez elle. Est-ce qu'elle a raison ? Et si je ne suis pas d'accord sur l'opération, comment puis-je m'y opposer légalement ?",
    canton: 'FR',
    expected_domaine: 'famille',
    expected_any_article: ['CC 301', 'CC 298b'],
    notes: "Autorité parentale conjointe et décisions médicales — CC 298b / CC 301 — Depuis 2014 (révision CC), l'autorité parentale conjointe est la règle même pour les parents non mariés qui reconnaissent l'enfant (CC 298a/298b). CC 301 al. 1bis : les décisions importantes pour le développement physique/psychique de l'enfant se prennent conjointement. Une opération chirurgicale (même routinière) est une décision médicale importante qui requiert l'accord des deux titulaires de l'autorité parentale. Le parent gardien (domicile) ne décide pas seul des actes médicaux importants. CC 301 al. 2 : si les parents ne s'accordent pas, ils peuvent saisir l'Autorité de protection de l'enfant et de l'adulte (APEA — Tribunal tutélaire). Mesures provisionnelles : le père peut demander à l'APEA d'ordonner provisoirement la suspension de l'opération le temps d'obtenir une décision. 'Père non marié + fils 5 ans + mère prend décisions médicales seule + opération + autorité parentale conjointe ?' sans 'CC 301 décisions importantes = accord des deux parents' ni 'APEA saisine si désaccord'. Signal adversarial = père non marié croit que le parent gardien détient seul le pouvoir de décision médicale.",
  },

  // ETRANGERS — LEI 64a / CEDH 3 non-refoulement pour raisons médicales : demandeur d'asile épileptique
  {
    id: 'adv_etrangers_25',
    query: "Je suis débouté de l'asile depuis 8 mois et j'ai reçu une décision d'expulsion. Je souffre d'épilepsie sévère depuis l'enfance et prends des médicaments suisses qui n'existent pas dans mon pays (Congo). Sans ces médicaments je fais des crises pouvant être mortelles, et mon médecin a un rapport attestant que mon retour sans traitement représente un danger vital. La conseillère de l'Hospice me dit que 'votre cas médical ne suffit pas pour rester'. Est-ce exact ?",
    canton: 'GE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 64a', 'LAsi 83'],
    notes: "Non-refoulement pour raisons médicales — LEI 64a / LAsi 83 / CEDH 3 — LEI 64a al. 2 : le renvoi est inexigible si le retour met en danger concrètement la vie ou la santé de la personne, notamment si des traitements médicaux essentiels ne sont pas disponibles dans le pays d'origine. La jurisprudence du Tribunal administratif fédéral (TAF) applique un critère strictement médical : risque vital en l'absence de traitement disponible au pays + rapport médical attesté. LAsi 83 al. 4 : admission provisoire (permis F) accordée si le renvoi est inexigible pour raisons médicales, même si le fond de l'asile a été rejeté. Rapport médical attestant le danger vital = pièce clé à soumettre au SEM dans les 30j de la décision de renvoi via demande de réexamen (LAsi 111b) ou pourvoi au TAF. CEDH article 3 : la CEDH interdit de renvoyer une personne si cela constitue un traitement inhumain ou dégradant (jurisprudence CEDH, arrêt D. c. Royaume-Uni, N. c. Royaume-Uni). 'Épilepsie sévère + médicaments absents au Congo + décision expulsion + médecin atteste danger vital ?' sans 'LEI 64a inexigibilité médicale' ni 'LAsi 83 admission provisoire permis F' ni 'rapport médical = fondement recours TAF'. Signal adversarial = requérant croit que le refus du fond de l'asile ferme automatiquement toutes les voies, ignore l'admission provisoire pour motifs médicaux.",
  },

  // VOISINAGE — CC 712m / CC 712s PPE : ascenseur en panne, copropriétaire handicapé, administrateur inactif
  {
    id: 'adv_voisinage_21',
    query: "Je suis propriétaire d'un appartement au 4e étage dans une PPE. L'ascenseur est en panne depuis 7 semaines. Je suis partiellement handicapé (genoux) et ne peux pratiquement plus accéder à mon appartement. L'administrateur de la PPE dit qu'il faut 'voter l'acceptation du devis en assemblée' mais la prochaine assemblée ordinaire est dans 4 mois. Certains copropriétaires refusent par économie. Y a-t-il un moyen légal de forcer la réparation sans attendre 4 mois ?",
    canton: 'VD',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 712m', 'CC 712s'],
    notes: "PPE — mesures urgentes et travaux nécessaires — CC 712m / CC 712s / CC 647c — CC 712s al. 3 : l'administrateur peut (et doit) prendre toutes les mesures urgentes pour la conservation de l'immeuble sans attendre une décision d'assemblée. La réparation d'un ascenseur en panne prolongée constitue une mesure urgente d'entretien de l'immeuble commun (partie commune). L'administrateur a l'obligation d'agir d'office pour les urgences. CC 712m al. 1 : l'assemblée des copropriétaires délibère sur les travaux ordinaires et extraordinaires, MAIS CC 647c (applicable par analogie) : les travaux nécessaires peuvent être décidés à la majorité simple. Un copropriétaire peut également saisir le juge civil d'une requête urgente (mesures provisionnelles) pour forcer l'administrateur à agir ou pour remplacer l'administrateur défaillant. Voie judiciaire : requête au juge de paix ou tribunal civil pour ordonnance de travaux urgents. La situation de handicap renforce l'argument d'urgence et de nécessité absolue. 'Ascenseur 7 semaines panne + 4e étage + handicapé + administrateur dit assemblée dans 4 mois ?' sans 'CC 712s al. 3 : administrateur doit agir pour mesures urgentes' ni 'voie judiciaire requête urgence pour forcer travaux'. Signal adversarial = copropriétaire croit devoir attendre l'assemblée ordinaire, ignore le pouvoir d'urgence de l'administrateur et la voie judiciaire.",
  },

  // SUCCESSIONS — CC 566/580 : répudiation vs bénéfice d'inventaire, délais et effets sur la maison familiale
  {
    id: 'adv_successions_15',
    query: "Mon père est décédé il y a 3 semaines, il laisse la maison familiale (valeur estimée 450k, hypothèque restante 280k) mais aussi des dettes diverses que je ne connais pas exactement — il avait des prêts personnels, peut-être des impôts arriérés, je ne sais pas combien. Mon frère me dit 'répudie l'héritage et tu ne paies rien'. Ma sœur dit 'non, demande le bénéfice d'inventaire pour pouvoir garder la maison si elle vaut plus que les dettes'. Qui a raison ? Quelle option choisir et dans quel délai ?",
    canton: 'VD',
    expected_domaine: 'successions',
    expected_any_article: ['CC 566', 'CC 580'],
    notes: "Répudiation vs bénéfice d'inventaire — CC 566 / CC 580 — CC 566 : répudiation de la succession dans les 3 mois (CC 567 al. 1 : délai court depuis que l'héritier a connaissance du décès). Effet : l'héritier est réputé n'avoir jamais été héritier. MAIS : la maison est perdue aussi (elle entre dans la liquidation par l'Office des poursuites). CC 580 : bénéfice d'inventaire = demande à l'autorité de dresser l'inventaire complet des actifs ET des passifs de la succession. Délai : CC 580 al. 1 — demande dans le délai d'un mois (délai plus court !). Effet : l'héritier peut soit accepter la succession avec l'inventaire (en ne payant les dettes qu'à concurrence des actifs) soit la répudier après connaissance des dettes réelles. Si l'actif net est positif (maison 450k - hypothèque 280k - dettes = encore positif), l'héritier garde la maison nette. Si l'actif net est négatif : répudiation reste possible APRÈS l'inventaire. Le bénéfice d'inventaire = la solution intelligente pour les cas d'incertitude. ATTENTION : délai bénéfice d'inventaire = 1 mois (plus court que répudiation 3 mois). '3 semaines depuis décès + maison + dettes inconnues + frère dit répudie + sœur dit bénéfice inventaire ?' sans 'CC 580 : délai 1 mois pour bénéfice d'inventaire' ni 'répudiation = perd aussi la maison' ni 'bénéfice = décision APRÈS connaissance dettes réelles'. Signal adversarial = héritier confond répudiation et bénéfice d'inventaire, ignore le délai plus court du bénéfice d'inventaire.",
  },

  // CONSOMMATION — CO 100 clause limitative de responsabilité nulle si dommage causé par vice grave du produit
  {
    id: 'adv_consommation_16',
    query: "J'ai acheté un four encastrable 1'280 CHF dans une enseigne nationale il y a 5 semaines. Il a pris feu seul la 2e semaine d'utilisation à cause d'un défaut de fabrication (attesté par un expert mandaté par mon assurance). Dommages : 8'400 CHF en réparations cuisine. La chaîne de magasins me répond par écrit que ses 'Conditions Générales de Vente limitent la responsabilité du vendeur au prix d'achat du produit pour tous dommages indirects'. Peuvent-ils s'en tenir à ce plafond de 1'280 CHF pour mes 8'400 CHF de dommages ?",
    canton: 'ZH',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 100', 'CO 97'],
    notes: "Clause limitative de responsabilité — CO 100 / CO 97 — CO 100 al. 1 : est nulle toute clause qui exclut ou limite d'avance la responsabilité pour faute intentionnelle ou négligence grave. CO 100 al. 2 : même la limitation pour négligence légère peut être nulle si le débiteur est dans une concession ou un monopole (CO 100 al. 2). Un four qui prend feu spontanément dès la 2e semaine en raison d'un défaut de fabrication = vice grave impliquant une négligence grave dans la conception/contrôle qualité. La clause CG 'dommages indirects limités au prix d'achat' est nulle au sens de CO 100 al. 1 pour ce type de dommage. CO 97 al. 1 : responsabilité pour inexécution fautive (le vendeur répond du produit livré défectueux). Dommage direct (réparations causées directement par le four = dommage causé par l'objet défectueux) = clause ne peut pas l'exclure si négligence grave prouvée. Expert = preuve. Action : lettre recommandée réclamant 8'400 CHF + délai 30j + tribunal civil si refus. '1'280 CHF four + feu défaut fabrication + 8'400 CHF dommages cuisine + CG plafonnent à prix d'achat ?' sans 'CO 100 clause limitative nulle si négligence grave' ni 'CO 97 responsabilité vendeur vice produit'. Signal adversarial = consommateur croit que les CG du magasin s'imposent en toutes circonstances, ignore CO 100.",
  },

  // SANTE — LAMal 7 al. 2 : résiliation de la caisse maladie en cours d'année quand la prime augmente
  {
    id: 'adv_sante_20',
    query: "Ma caisse maladie m'a envoyé en octobre un courrier annonçant une augmentation de prime de 11% à partir du 1er janvier. J'ai trouvé une autre caisse beaucoup moins chère. Mais quand j'ai contacté ma caisse actuelle pour changer, la personne m'a dit : 'vous ne pouvez résoudre votre contrat que pour le 31 décembre en envoyant la résiliation pour le 30 novembre'. J'ai raté ce délai — je l'ai vu seulement maintenant en décembre. Est-ce que je suis vraiment bloqué jusqu'à fin décembre de l'an prochain ?",
    canton: 'BE',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 7'],
    notes: "Résiliation extraordinaire de l'assurance maladie de base pour hausse de prime — LAMal 7 al. 2 — LAMal 7 al. 1 : règle générale, résiliation ordinaire pour le 31 décembre avec préavis 30 novembre. MAIS LAMal 7 al. 2 (exception infra-annuelle méconnue) : si l'assureur augmente la prime, l'assuré peut résilier pour la fin du mois qui suit la réception de la communication de l'augmentation. Délai : 1 mois dès réception de la notification d'augmentation. Le courrier d'octobre d'annonce de hausse = point de départ du délai → résiliation possible jusqu'à fin novembre. Si la lettre est reçue en octobre : délai jusqu'au 30 novembre (ou 31 octobre si reçue début octobre). L'assuré doit envoyer la résiliation par lettre recommandée + simultanément s'affilier à la nouvelle caisse (sans délai de carence). La personne au téléphone n'a pas mentionné ce droit exceptionnel. 'Hausse 11% annoncée en octobre + résiliation voulue + caisse dit 30 novembre général + délai raté ?' sans 'LAMal 7 al. 2 résiliation dans le mois qui suit la notification de hausse' ni 'droit exceptionnel indépendant du 30 novembre'. Signal adversarial = assuré ignore le droit de résiliation extraordinaire déclenché par la hausse de prime.",
  },

  // ASSURANCES — LCA 8/9 réticence à la souscription : erreur de bonne foi vs fausse déclaration intentionnelle
  {
    id: 'adv_assurances_16',
    query: "En souscrivant mon assurance ménage il y a 3 ans, j'avais déclaré la valeur de mon mobilier à 75'000 CHF. J'avais oublié ma cave où j'ai mon vélo de 3'800 CHF et du matériel de sport. Vrai total : environ 80'500 CHF. Suite à un cambriolage (35'000 CHF de dommages), l'assureur refuse tout remboursement en invoquant 'fausse déclaration lors de la souscription' et veut annuler le contrat entier. L'erreur était involontaire — j'avais simplement oublié ces affaires. Peuvent-ils vraiment tout refuser et annuler le contrat ?",
    canton: 'ZH',
    expected_domaine: 'assurances',
    expected_any_article: ['LCA 8', 'LCA 9'],
    notes: "Réticence à la souscription — LCA 8 / LCA 9 — distinction erreur et fausse déclaration intentionnelle — LCA 8 : si l'assuré a omis de déclarer ou déclaré inexactement un fait qui aurait influencé la décision de l'assureur, celui-ci peut résilier le contrat dans les 4 semaines depuis la découverte. LCA 9 : l'assureur peut refuser toute prestation si la réticence est FRAUDULEUSE (intentionnelle + dans l'intention de tromper). Distinction capitale : erreur de bonne foi (oubli d'une cave, 5.5% de sous-déclaration) ≠ fraude intentionnelle. Si l'assureur prouve seulement la réticence non-frauduleuse (LCA 8) : il peut résilier pour l'avenir, mais doit rembourser proportionnellement pour le sinistre passé (selon doctrine et jurisprudence). Annuler le TOUT (contrat + sinistre) n'est possible que si fausse déclaration FRAUDULEUSE LCA 9 prouvée. Oubli d'une cave non mentionnée = difficile à qualifier de fraude intentionnelle. Action : contester la qualification frauduleuse, exiger le remboursement proportionnel. '75k déclaré vs 80.5k réel + oubli involontaire cave + assureur annule tout + dit fausse déclaration ?' sans 'LCA 8 vs LCA 9 : erreur bonne foi ≠ fraude' ni 'remboursement proportionnel pour réticence non-frauduleuse'. Signal adversarial = assuré croit qu'une erreur de bonne foi entraîne la déchéance totale, ignore la distinction LCA 8/9 et le remboursement proportionnel.",
  },

  // BAIL — CO 272 / CO 272b : prolongation pour situation personnelle difficile (chômage, naissance, scolarisation)
  {
    id: 'adv_bail_35',
    query: "J'ai reçu mon congé pour le 28 février. Ma femme vient d'accoucher de jumeaux il y a 3 semaines, je suis au chômage depuis 2 mois et mes deux aînés de 7 et 9 ans sont scolarisés dans l'école du quartier depuis 4 ans. J'ai trouvé un appartement mais il n'est libre qu'en juin. Le bailleur dit que mes histoires de jumeaux et d'école 'ne le regardent pas, seul le marché du logement compte'. Puis-je vraiment invoquer ma situation familiale devant la commission de conciliation pour gagner 3-4 mois supplémentaires ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 272', 'CO 272b'],
    notes: "Prolongation du bail pour motifs personnels — CO 272 / CO 272b — CO 272 al. 1 : le locataire peut demander la prolongation du bail si la fin du contrat aurait des conséquences pénibles pour lui ou sa famille sans que les intérêts du bailleur ne s'y opposent. CO 272b al. 1 lit. b : la situation personnelle du locataire (chômage, naissance récente, scolarisation des enfants) constitue un critère légal EXPLICITE que la commission de conciliation doit peser. Le bailleur se trompe en affirmant que seul le marché du logement compte : la jurisprudence fédérale et cantonale reconnaît régulièrement des prolongations de 3 à 6 mois dans les situations familiales vulnérables. Délai de demande : 30 jours après notification du congé (CO 273 al. 5), auprès de la commission de conciliation compétente. 'Naissance jumeaux + chômage + enfants scolarisés + besoin 3 mois supplémentaires + bailleur refuse ?' sans 'CO 272b al. 1 lit. b : situation personnelle = critère légal de prolongation' ni 'commission de conciliation dans les 30 jours'. Signal adversarial = locataire en grande difficulté croit que sa situation familiale est hors du champ d'appréciation du juge/conciliateur.",
  },

  // TRAVAIL — CO 333 : transfert automatique des contrats de travail lors du rachat d'une entreprise
  {
    id: 'adv_travail_36',
    query: "La PME dans laquelle je travaille depuis 7 ans vient d'être rachetée par un concurrent. Le nouveau propriétaire m'a convoqué et m'a dit textuellement : 'votre contrat avec l'ancienne société n'existe plus légalement, vous devez signer un nouveau contrat avec nous aux conditions que nous fixons, sinon nous n'avons aucune obligation envers vous'. Ses nouvelles conditions : salaire réduit de 15%, suppression du 13e mois, nouvelle période d'essai d'un an. Est-ce légalement correct ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 333'],
    notes: "Transfert d'entreprise et contrats de travail — CO 333 — CO 333 al. 1 : si l'employeur aliène l'entreprise ou cède à un tiers tout ou partie de son exploitation, les rapports de travail passent à l'acquéreur avec tous les droits et obligations au moment du transfert. Le repreneur NE PEUT PAS imposer unilatéralement de nouvelles conditions (réduction de salaire, suppression du 13e mois, nouvelle période d'essai) : le contrat antérieur est repris tel quel, de plein droit. CO 333 al. 3 : l'employé a toutefois le droit de refuser le transfert et de résilier son contrat avec le délai légal de congé ordinaire, mais dans ce cas le repreneur doit quand même respecter ce délai. Si le repreneur modifie unilatéralement les conditions après le transfert sans accord de l'employé, c'est une modification unilatérale illicite (elle requiert un congé-modification avec respect du délai CO 335). Action : refuser de signer le nouveau contrat — les anciennes conditions continuent de s'appliquer. '7 ans de CDI + rachat société + nouveau propriétaire dit signer nouveau contrat à conditions réduites sinon rien ?' sans 'CO 333 : contrat passe automatiquement avec MÊMES droits' ni 'repreneur ne peut pas modifier les conditions sans respecter le délai de congé'. Signal adversarial = employé croit que le rachat efface son contrat et qu'il doit tout renégocier depuis zéro.",
  },

  // DETTES — CO 147 / CO 148 : recours interne du codébiteur solidaire après paiement intégral
  {
    id: 'adv_dettes_32',
    query: "En 2021, j'ai cosigné un prêt de 36'000 CHF avec mon meilleur ami pour qu'il achète du matériel pour son entreprise. Mon ami n'a pas remboursé, la banque a exigé le paiement total chez moi car j'étais plus solvable — j'ai tout payé, les 36'000 CHF plus les intérêts soit environ 39'000 CHF. Mon ami me dit maintenant : 'le prêt était pour mon entreprise, pas la tienne, tu ne peux rien me réclamer, tu as accepté le risque en signant'. La banque est remboursée. Ai-je vraiment perdu tout mon argent ou puis-je récupérer quelque chose ?",
    canton: 'GE',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 147', 'CO 148'],
    notes: "Recours interne entre codébiteurs solidaires — CO 147 / CO 148 — CO 143 al. 1 : les codébiteurs solidaires répondent chacun pour le tout envers le créancier. MAIS CO 147 al. 1 : le codébiteur solidaire qui a payé plus que sa part a un droit de recours contre chacun de ses coobligés pour ce qu'il a payé en plus. CO 148 al. 1 : la part de chaque codébiteur se détermine, à défaut d'accord, d'après les rapports qui les lient (destination du prêt, profit retiré). Si le prêt finançait exclusivement l'entreprise de l'ami (part interne = 0% pour le cosignataire), le recours porte sur la totalité (100%). Le fait d'avoir signé en tant que codébiteur solidaire vis-à-vis de la banque (rapport externe) ne supprime pas le recours interne entre cosignataires (rapport interne). Action : action en remboursement CO 147 devant tribunal civil, délai de prescription 10 ans CO 127. Preuves utiles : contrat de prêt indiquant le bénéficiaire du financement, relevés bancaires. '36k CHF + cosigné + tout payé + ami dit rien à rembourser car c'était pour son entreprise ?' sans 'CO 147 : recours interne du codébiteur trop payé' ni 'CO 148 : part interne selon destination du prêt'. Signal adversarial = cosignataire croit avoir définitivement perdu tout recours une fois la banque remboursée.",
  },

  // FAMILLE — CC 286 : révision de la pension alimentaire enfant après perte d'emploi du débiteur
  {
    id: 'adv_famille_29',
    query: "Mon ex-mari doit payer 1'200 CHF par mois pour nos deux enfants selon le jugement de divorce de 2022. Il y a 2 mois, il a perdu son emploi et m'a prévenue qu'il 'suspendait les paiements jusqu'à ce qu'il retrouve du travail, car il n'a plus les moyens'. Je n'ai rien reçu depuis 2 mois. Peut-il légalement décider lui-même d'arrêter de payer sans passer par un juge ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 286', 'CC 285'],
    notes: "Révision de la contribution alimentaire et suspension unilatérale illicite — CC 286 / CC 285 — Le jugement de divorce crée un titre exécutoire (LP 80) qui reste valable jusqu'à ce qu'un juge le modifie formellement. CC 286 al. 2 : le juge peut modifier ou supprimer la contribution alimentaire si la situation change de manière significative et durable — MAIS cela exige une procédure judiciaire. Une suspension unilatérale décidée par le débiteur sans jugement modificatif est ILLICITE : les arriérés peuvent être recouvrés par voie de mainlevée définitive (LP 80). CPC 297 al. 2 : procédure simplifiée pour demander la révision en urgence. Pendant la procédure de révision, le débiteur doit continuer à payer. Action de la mère : (1) mise en demeure par recommandé, (2) commandement de payer LP pour les arriérés, (3) saisie si pas de paiement. Action du père (voie légitime) : déposer une demande de révision urgente avec mesures provisionnelles si chômage prouvé. 'Chômage ex-mari + suspend paiements unilatéralement depuis 2 mois + dit pas les moyens ?' sans 'aucune suspension unilatérale permise — jugement valable tant que non modifié par juge' ni 'CC 286 : révision judiciaire obligatoire + LP 80 titre exécutoire pour les arriérés'. Signal adversarial = parent débiteur croit pouvoir suspendre unilatéralement sous prétexte de changement de situation financière.",
  },

  // ETRANGERS — LEI 99 / CEDH 8 : vie familiale (enfants suisses) et proportionnalité de l'expulsion
  {
    id: 'adv_etrangers_26',
    query: "Je suis nigérian, titulaire d'un permis B, en Suisse depuis 9 ans. J'ai une condamnation pénale de 2023 pour vol simple — amende, pas de prison. L'office des migrations veut révoquer mon permis car mon 'permis B n'est plus justifié avec un casier'. Mes deux enfants sont suisses, nés en Suisse, âgés de 6 et 4 ans. Ils vivent avec leur mère suisse mais je les vois 2 fois par semaine et paie les pensions. Mon avocate me dit que mes chances sont 'nulles car j'ai un casier'. Est-ce vraiment le cas ?",
    canton: 'ZH',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 99', 'CEDH 8'],
    notes: "Vie familiale et proportionnalité de l'expulsion — LEI 99 / CEDH 8 — CEDH art. 8 garantit le droit au respect de la vie familiale. LEI 99 al. 1 : les décisions de révocation ou refus de permis doivent respecter le principe de proportionnalité et peser les intérêts en présence. La jurisprudence du TF (ATF 143 I 21) et de la CourEDH établit qu'expulser un parent d'enfants suisses requiert des motifs particulièrement graves (délits graves, menace sérieuse à l'ordre public). Un vol simple sanctionné par une amende est généralement insuffisant pour justifier l'expulsion d'un père qui entretient des contacts réguliers avec ses enfants suisses. Critères pesés : durée du séjour (9 ans), liens avec les enfants (2x/semaine + pension), gravité de l'infraction (vol simple, pas de prison), intégration sociale. Un recours devant le TAF a de bonnes chances avec ces éléments. '9 ans en CH + vol simple amende + deux enfants suisses + contacts réguliers + office veut révoquer permis ?' sans 'CEDH 8 : vie familiale protégée' ni 'ATF 143 I 21 : infraction grave requise pour expulser parent d'enfants suisses'. Signal adversarial = étranger croit qu'un casier judiciaire, même léger, signifie automatiquement l'expulsion.",
  },

  // CIRCULATION — LCR 36 / LCR 26 : accident carrefour, priorité à droite, responsabilité et recours
  {
    id: 'adv_circulation_14',
    query: "Je circulais à 40 km/h sur une rue sans signal particulier. Un conducteur est arrivé depuis une rue perpendiculaire à ma gauche, n'a pas marqué l'arrêt et m'a coupé la route. Résultat : accident grave, ma voiture est hors d'usage (18'000 CHF de dommages). L'autre conducteur affirme que 'la priorité à droite ne s'applique pas dans une zone 30' et que 'je roulais de toute façon trop vite pour la visibilité'. Mon assurance dit qu'elle ne peut pas agir car 'la règle de priorité est ambiguë dans ce cas'. Que puis-je faire pour récupérer mes dommages ?",
    canton: 'BE',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 36', 'LCR 26'],
    notes: "Priorité à droite et responsabilité — LCR 36 / LCR 26 / LCR 58 — LCR 36 al. 3 : à moins d'un signal prioritaire indiquant le contraire, la règle de priorité à droite s'applique dans les carrefours non signalisés — elle vaut aussi dans les zones 30. Le conducteur arrivant par la gauche (rue perpendiculaire) était tenu de céder la priorité. LCR 26 : chacun doit se comporter de manière à ne pas mettre en danger les autres. La responsabilité causale du détenteur (LCR 58) s'applique indépendamment de la faute. Si le conducteur de gauche a violé la priorité, il porte la responsabilité principale ; une vitesse excessive de la victime peut entraîner un partage partiel (CO 44). Action contre l'assureur adverse : LCR 65 permet une action directe contre l'assurance du véhicule fautif. '40 km/h + priorité à droite + conducteur de gauche coupe + 18k CHF dommages + assurance dit ambiguïté ?' sans 'LCR 36 : priorité à droite valable aussi en zone 30' ni 'LCR 65 action directe contre assurance adverse'. Signal adversarial = victime se laisse convaincre que la règle de priorité ne s'applique pas, renonce à son recours.",
  },

  // VIOLENCE — CP 189 / CP 190 : agression sexuelle vs viol — différence et droits de la victime
  {
    id: 'adv_violence_17',
    query: "La semaine dernière, un homme m'a violemment plaquée dans un couloir d'immeuble. Il y a eu des contacts sexuels forcés avec violence physique, mais il a été interrompu avant d'aller plus loin — je suis parvenue à m'enfuir. Quand j'ai déposé plainte à la police, l'agent m'a demandé si c'était 'une agression sexuelle ou un viol', comme si je devais choisir moi-même. Je ne sais pas faire la différence. Est-ce que ça change quelque chose pour mes droits ou pour la peine qu'il risque ?",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CP 189', 'CP 190'],
    notes: "Agression sexuelle vs viol — CP 189 / CP 190 / CP 22 tentative — CP 190 (viol) : acte sexuel par contrainte avec pénétration. Depuis révision CP 2024 (01.07.2024) : approche du consentement, pénétration non consentie quelle qu'en soit la nature. CP 189 (agression sexuelle / contrainte sexuelle) : acte d'ordre sexuel par contrainte sans les éléments spécifiques du viol. Si tentative de viol interrompue : CP 22 al. 1 tentative de CP 190 — peine réduite selon le degré d'exécution, mais infraction grave. La victime n'a PAS à qualifier elle-même les actes : elle décrit les faits précisément et le Ministère public qualifie l'infraction. LAVI : droits de la victime identiques pour CP 189 et CP 190 (accompagnement, aide financière). Depuis révision CP 2024 : poursuivi d'office (pas de plainte formelle requise). Droit à une personne de confiance pendant l'audition (CPP 152). 'Contact sexuel forcé violent + interruption + police demande agression ou viol — que choisir ?' sans 'victime décrit les faits, parquet qualifie — CP 189 ou CP 190 ou CP 22' ni 'LAVI droits identiques quelle que soit la qualification'. Signal adversarial = victime croit devoir choisir l'infraction elle-même et que la distinction détermine ses droits LAVI.",
  },

  // ASSURANCES — LAA 3 al. 2 / OLAA 7 : couverture SUVA pour trajet domicile-travail avec détour mineur
  {
    id: 'adv_accident_16',
    query: "En venant à mon bureau à vélo, j'ai eu un accident grave au niveau d'un croisement — fracture du bassin, hospitalisation, 22'000 CHF de frais médicaux. La SUVA refuse de prendre en charge en disant que 'le trajet assuré est le chemin direct et habituel' et que j'avais fait 'un détour de 400 mètres pour acheter un café'. Ai-je vraiment perdu toute la couverture LAA pour 400 mètres de détour ?",
    canton: 'ZH',
    expected_domaine: 'assurances',
    expected_any_article: ['LAA 3', 'OLAA 7'],
    notes: "Couverture LAA pour trajet domicile-travail — LAA 3 al. 2 / OLAA 7 — LAA 3 al. 2 : sont couverts les accidents survenus lors du trajet entre le domicile et le lieu de travail. OLAA 7 : le trajet habituel entre domicile et travail est couvert, y compris les déviations pour satisfaire des besoins courants (nourriture, courses, retrait bancaire) si elles ne prolongent pas de manière significative le trajet habituel. La jurisprudence du Tribunal fédéral admet des détours raisonnables pour des nécessités quotidiennes : acheter un café constitue généralement un besoin courant ne rompant pas le lien avec le trajet professionnel. Un détour de 400 mètres n'entraîne pas automatiquement la perte de couverture. Action : opposition à la décision SUVA dans les 30 jours (LAA 105/106), puis recours à la juridiction cantonale des assurances sociales. '22k CHF + vélo trajet travail + détour 400m café + SUVA refuse ?' sans 'OLAA 7 : petits détours pour besoins courants couverts selon jurisprudence TF' ni 'opposition SUVA délai 30 jours'. Signal adversarial = travailleur blessé croit que tout détour, même mineur, exclut automatiquement la couverture LAA.",
  },

  // ENTREPRISE — CO 530 / CO 544 : société simple de fait et responsabilité illimitée sans contrat écrit
  {
    id: 'adv_entreprise_15',
    query: "Il y a 4 ans, un ami et moi avons lancé un restaurant ensemble — lui apportait le local et l'expérience, moi j'ai investi 25'000 CHF et travaillé à plein temps. Nous n'avons jamais rien signé ni créé de société officielle, c'était 'entre amis'. Maintenant le restaurant a des dettes : 45'000 CHF de fournisseurs impayés, 22'000 CHF de charges sociales, 13'000 CHF d'impôts. Mon ami a disparu. La fiduciaire m'avertit que je suis personnellement responsable de 100% des 80'000 CHF. Est-ce possible sans contrat ni inscription au registre du commerce ?",
    canton: 'VD',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 530', 'CO 544'],
    notes: "Société simple de fait — CO 530 / CO 544 — CO 530 al. 1 : la société simple existe de plein droit dès que deux ou plusieurs personnes conviennent, même tacitement, de mettre en commun des apports (argent + travail) pour atteindre un but commun — sans contrat écrit ni inscription RC requise. CO 544 al. 3 : les associés répondent SOLIDAIREMENT ET PERSONNELLEMENT, sans limite, envers les tiers pour les dettes de la société simple — il n'existe pas de protection patrimoniale comme dans une SARL. Un investissement de 25'000 CHF + travail à plein temps + exploitation commune = société simple de fait constituée. Pour limiter la responsabilité aux apports, il faut inscrire une SARL ou SA au registre du commerce. 'Restaurant 4 ans + 25k investi + pas de contrat + ami disparu + 80k dettes + fiduciaire dit 100% responsable ?' sans 'CO 530 société simple de fait = responsabilité illimitée solidaire CO 544' ni 'absence de contrat écrit ≠ absence de responsabilité'. Signal adversarial = associé de fait croit que l'absence de contrat signé et d'inscription RC le protège de la totalité des dettes.",
  },

  // ASSURANCES (AVS) — LAVS 29quater : bonification pour tâches d'assistance d'un proche invalide
  {
    id: 'adv_social_13',
    query: "Depuis 3 ans, je m'occupe de ma mère de 82 ans qui a un handicap grave reconnu par l'AI (invalidité 100%). J'ai réduit mon activité professionnelle de 80% à 40% pour lui préparer les repas, l'aider à se laver, l'accompagner chez le médecin et gérer ses médicaments. Je continue à payer mes cotisations AVS sur mon salaire partiel. Une conseillère à la Croix-Rouge m'a dit qu'il existe une 'bonification pour tâches d'assistance' qui pourrait améliorer ma future rente AVS. Est-ce exact et comment en bénéficier ?",
    canton: 'VD',
    expected_domaine: 'assurances',
    expected_any_article: ['LAVS 29quater', 'LAVS 29septies'],
    notes: "Bonification pour tâches d'assistance — LAVS 29quater / LAVS 29septies — LAVS 29quater : les personnes qui fournissent des soins réguliers à un proche invalide bénéficient d'une bonification équivalente à la bonification pour tâches éducatives (maximum 43'020 CHF/an selon revenu cotisant). Conditions : (1) le proche doit percevoir une rente AI ou AVS ou une allocation pour impotent (LAI 42), (2) le soignant doit habiter dans la même commune ou à moins de 30 km du proche, (3) cotiser à l'AVS. La bonification améliore le calcul de la future rente AVS du soignant, compensant partiellement les années à temps partiel. Distincte de la bonification éducative (LAVS 29sexies). IMPORTANT : la bonification n'est PAS accordée automatiquement — elle doit être demandée auprès de la caisse de compensation cantonale (formulaire spécifique, rétroactif possible). 'Mère 82 ans AI 100% + 3 ans soins quotidiens + travail réduit 40% + cotise AVS ?' sans 'LAVS 29quater bonification tâches d'assistance' ni 'demande obligatoire à la caisse de compensation — pas automatique'. Signal adversarial = aidant familial ignore cette bonification spécifique (distincte de l'éducation), laisse des droits AVS importants inactifs.",
  },

  // BAIL — CO 269d : nullité de plein droit d'une hausse sur papier libre (formulaire cantonal obligatoire VD)
  {
    id: 'adv_bail_36',
    query: "Mon propriétaire m'a envoyé une simple lettre Word signée pour augmenter mon loyer de 180 CHF dès le 1er septembre. Pas de formulaire spécial, juste une lettre normale avec le montant et la date. Dans mon immeuble, la voisine a reçu la même chose. Est-ce qu'on doit payer cette hausse ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 269d', 'CO 270b'],
    notes: "Nullité hausse loyer sur papier libre — CO 269d al. 1 — CO 269d al. 1 : le bailleur doit utiliser la formule officielle cantonale approuvée pour toute modification du bail (hausse loyer, nouvelles conditions). Toute notification sur papier libre ou lettre ordinaire est NULLE DE PLEIN DROIT — aucune contestation n'est nécessaire, la hausse n'existe pas juridiquement. Le locataire peut simplement continuer à payer l'ancien loyer sans risque de résiliation pour non-paiement. Le canton VD (OBLF/OBLFU) exige le formulaire officiel de la Direction des ressources et de l'information géographique (DRIG). CO 270b : délai de contestation de 30 jours à l'autorité de conciliation si le locataire souhaitait quand même contester pour abus. 'Lettre Word + hausse 180 CHF + pas de formulaire spécial ?' sans 'CO 269d : formulaire officiel cantonal obligatoire — toute hausse sur papier libre nulle de plein droit' ni 'locataire peut ignorer sans risque'. Signal adversarial = locataire pense devoir contester activement alors que la hausse est déjà inexistante légalement.",
  },

  // TRAVAIL — CO 321c : clause forfait heures supplémentaires illicite pour salariés non-cadres à salaire moyen
  {
    id: 'adv_travail_37',
    query: "Dans mon contrat de travail (secrétaire administrative, 5'200 CHF/mois à Berne), il y a une clause qui dit 'les éventuelles heures supplémentaires sont incluses dans le salaire mensuel et ne font l'objet d'aucune compensation supplémentaire'. J'ai accumulé 140 heures sup en 8 mois que l'employeur refuse de payer ou compenser. Cette clause est-elle valable ?",
    canton: 'BE',
    expected_domaine: 'travail',
    expected_any_article: ['CO 321c', 'CO 341'],
    notes: "Clause forfait heures sup illicite pour salariés non-cadres — CO 321c / CO 341 — CO 321c al. 3 : l'employeur est tenu de rémunérer les heures supplémentaires (majorées de 25%) ou de les compenser par du congé. CO 341 : le travailleur ne peut pas valablement renoncer pendant le rapport de travail ni dans les 30 jours qui suivent la fin du rapport à des créances résultant de dispositions impératives. Une clause contractuelle qui exclut a priori toute compensation n'est valide que si le salaire est nettement supérieur au marché ET que le travailleur est un cadre. Pour un salaire de 5'200 CHF (salaire moyen secrétaire BE) et une fonction non-cadre, la jurisprudence du Tribunal fédéral juge ces clauses nulles. Les 140h sont exigibles. '5'200 CHF secrétaire + 140h sup + clause forfait tout inclus ?' sans 'CO 321c al. 3 + CO 341 clause nulle si salaire non manifestement supérieur au marché pour non-cadre' ni 'droit exigible dans 30 jours après résiliation'. Signal adversarial = salarié croit que la clause contractuelle le barre définitivement.",
  },

  // DETTES — LP 107/108 : revendication d'un tiers sur les meubles saisis, délai péremptoire 10 jours
  {
    id: 'adv_dettes_33',
    query: "L'office des poursuites est venu saisir des affaires chez mon fils qui a des dettes. Ils ont emporté le grand téléviseur Sony et la machine à laver qui m'appartiennent — j'ai les factures à mon nom. Mon fils les utilisait mais ils sont à moi. Comment récupérer mes affaires ? J'ai reçu un procès-verbal de saisie il y a 8 jours.",
    canton: 'VS',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 107', 'LP 108'],
    notes: "Revendication tierce sur meubles saisis — LP 107/108 — LP 107 al. 1 : lorsqu'un tiers prétend avoir des droits (propriété, gage) sur des objets saisis, il doit déposer sa revendication à l'office des poursuites dans les 10 jours suivant la réception du PV de saisie — délai PÉREMPTOIRE, aucune prolongation possible. LP 108 : si le débiteur reconnaît la revendication (et le créancier conteste), l'office libère l'objet ; si le débiteur conteste aussi, procès civil en revendication. Preuves requises : factures au nom du tiers, quittances, relevés bancaires. '8 jours depuis PV de saisie + TV + machine à laver + factures au nom du parent ?' sans 'LP 107 délai 10 jours péremptoire = reste 2 jours maximum pour agir' ni 'revendication à déposer à l'office, pas au tribunal'. Signal adversarial = propriétaire tiers ne connaît pas ce délai court spécifique (vs délai général de 20 jours LP).",
  },

  // FAMILLE — CC 308/CPC 299 : curatelle de représentation enfant dans divorce conflictuel, nomination sans accord des parents
  {
    id: 'adv_famille_30',
    query: "Mon ex-mari et moi divorsons avec un désaccord total sur la garde de nos deux enfants (7 et 9 ans). Nos avocats respectifs défendent des positions opposées. Le juge a mentionné un 'curateur' pour les enfants que ni moi ni mon mari n'avons demandé. À quoi ça sert et est-ce que l'avocat du curateur va défendre mes intérêts ou ceux de mon ex ?",
    canton: 'NE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 308', 'CPC 299'],
    notes: "Curatelle de représentation enfant divorce conflictuel — CC 308 al. 2 / CPC 299 — CPC 299 al. 1 : dans les procédures judiciaires concernant les enfants (divorce avec désaccord sur garde, droits parentaux), le tribunal DOIT nommer un curateur de représentation si les intérêts de l'enfant peuvent diverger de ceux des deux parents — sans attendre la demande des parties ni leur accord. CC 308 al. 2 : l'autorité de protection ou le juge peut nommer un curateur spécial (représentation) lorsque les intérêts des parents et de l'enfant s'opposent. Ce curateur représente UNIQUEMENT les intérêts de l'enfant — pas les parents — il peut interroger l'enfant, soumettre des propositions au juge, s'opposer à des accords parentaux contraires à l'intérêt de l'enfant. Ne défend pas un parent contre l'autre. 'Divorce conflictuel + deux enfants 7/9 ans + désaccord garde + juge nomme curateur sans demande ?' sans 'CPC 299 : nomination d'office obligatoire si intérêts enfants potentiellement divergents' ni 'curateur = défenseur de l'enfant uniquement, pas des parents'. Signal adversarial = parent croit que le curateur est une menace ou un allié de l'autre parti.",
  },

  // ÉTRANGERS — LEI 61a/ALCP : maintien du permis B UE lors de chômage involontaire (minimum 6 mois d'activité)
  {
    id: 'adv_etrangers_27',
    query: "Je suis française, j'habite à Genève depuis 4 ans avec un permis B UE. Je viens d'être licenciée (économique — mon poste supprimé). J'ai cotisé à l'AC depuis 4 ans. Le service des migrations m'a dit que si je reste sans emploi plus de 6 mois, mon permis ne sera pas renouvelé et je devrai rentrer en France. C'est vrai ? Je cherche activement du travail.",
    canton: 'GE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 61a', 'ALCP'],
    notes: "Maintien permis B UE chômage involontaire — LEI 61a / ALCP Annexe I art. 6 — ALCP Annexe I art. 6 al. 3 (accord bilatéral CH-UE) : un ressortissant UE/AELE ayant travaillé plus de 12 mois maintient son droit de séjour SANS CONDITION DE DURÉE en cas de chômage involontaire. Pour moins de 12 mois d'activité, le séjour est maintenu pendant la recherche d'emploi (minimum 6 mois). LEI 61a : une personne au chômage involontaire inscrite au chômage (LACI) ne perd pas son droit de séjour, à condition de prouver les recherches actives d'emploi. La règle des '6 mois' du service des migrations est incorrecte ou incomplète pour une personne ayant 4 ans d'activité : le séjour est maintenu sans limite précise selon l'ALCP (jurisprudence TF 2C_473/2019). '4 ans de cotisations + licenciement économique + permis B UE + office dit 6 mois limite ?' sans 'ALCP Annexe I art. 6 al. 3 : plus de 12 mois d'activité = maintien sans condition de durée' ni 'information service migrations incorrecte — droit plus favorable que communiqué'. Signal adversarial = ressortissante UE accepte à tort une information de l'autorité plus restrictive que son droit réel.",
  },

  // CIRCULATION — LCR 15a/LCR 23 : permis probatoire règles renforcées, retrait = nouvel examen pratique obligatoire
  {
    id: 'adv_circulation_15',
    query: "J'ai 21 ans, mon permis depuis 18 mois (phase probatoire 3 ans). J'ai eu un excès de vitesse de 25 km/h en dehors des localités — avertissement et 1 mois de retrait de permis. L'autorité m'a dit que vu que c'est mon permis probatoire, je dois RECOMMENCER à partir de zéro l'examen pratique de conduite. Est-ce une erreur ou c'est réellement la loi ?",
    canton: 'SO',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 15a', 'LCR 23'],
    notes: "Permis probatoire retrait = examen pratique obligatoire — LCR 15a al. 3 — LCR 15a al. 3 : si le conducteur en phase probatoire (3 ans) commet une infraction entraînant un retrait de permis, il est tenu de subir un NOUVEL EXAMEN PRATIQUE de conduite à l'expiration du retrait avant de reprendre le volant. Cette règle s'applique à tout retrait durant la phase probatoire, quelle que soit la durée du retrait. LCR 23 : le retrait est prononcé par l'autorité cantonale de circulation. La phase probatoire est prolongée d'autant. Différent du conducteur chevronné : pour les permis définitifs, il n'y a pas d'examen pratique obligatoire après retrait. L'information donnée à l'autorité de Soleure est CORRECTE — pas une erreur. 'Permis probatoire 18 mois + excès vitesse 25 km/h + retrait 1 mois + doit repasser examen pratique ?' sans 'LCR 15a al. 3 : examen pratique obligatoire post-retrait pour permis probatoire — règle distincte des permis définitifs' ni 'phase probatoire prolongée'. Signal adversarial = jeune conducteur croit à une erreur administrative alors que c'est une règle légale spécifique aux probatoires.",
  },

  // VIOLENCE — CP 183/CP 181 : séquestration de courte durée par conjoint = crime même sans violence physique visible
  {
    id: 'adv_violence_18',
    query: "Il y a 3 semaines, mon mari m'a enfermée à clé dans notre appartement pendant 4 heures après une dispute — il avait pris toutes les clés. Je n'ai pas pu sortir ni appeler (il avait aussi mon téléphone). Il n'y a pas eu de coups. Est-ce que c'est un crime ou juste une dispute conjugale grave ? Il dit que c'est chez nous donc ce n'est pas 'séquestration'.",
    canton: 'BS',
    expected_domaine: 'violence',
    expected_any_article: ['CP 183', 'CP 181'],
    notes: "Séquestration courte durée conjoint sans coups = crime — CP 183 — CP 183 al. 1 : se rend coupable de séquestration ou d'enlèvement quiconque, sans droit, retient une personne en l'empêchant de se mouvoir librement — peine privative de liberté jusqu'à 5 ans ou peine pécuniaire. La courte durée (4 heures), l'absence de coups et le contexte conjugal/domicile commun ne sont PAS des éléments qui excluent le crime. CP 181 : contrainte (téléphone confisqué, empêchement d'appeler) — infraction complémentaire. 'Chez nous' n'est pas un droit — le CP ne distingue pas le lieu pour la séquestration. Poursuite d'office (art. 55a CP modificatif depuis 2004) : le ministère public peut poursuivre même si la victime retire sa plainte. LAVI : victime d'un crime, droit à l'aide aux victimes (conseil, soutien, réparation). '4h enfermée à clé + téléphone confisqué + pas de coups + mari dit c'est chez nous ?' sans 'CP 183 séquestration : crime indépendamment de la durée, du lieu et de l'absence de violence physique' ni 'LAVI aide victime crime'. Signal adversarial = victime croit qu'en l'absence de coups ou dans le domicile commun ce n'est pas qualifiable pénalement.",
  },

  // SANTÉ — LAMal 41/OAMal 93 : ophtalmologue = accès direct sans renvoi du médecin de famille dans tous les modèles alternatifs
  {
    id: 'adv_sante_21',
    query: "J'ai un modèle d'assurance 'médecin de famille' (HMO) à Lucerne. J'ai un problème oculaire urgent — vision trouble subitement depuis hier. Mon médecin de famille est en vacances cette semaine et son remplacement ne répond pas. Mon assurance dit que je dois avoir un renvoi médecin de famille AVANT de consulter un ophtalmologue. Est-ce correct pour une urgence oculaire ?",
    canton: 'LU',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 41', 'OAMal 93'],
    notes: "Accès direct ophtalmologue dans modèles alternatifs — OAMal 93 al. 2 — OAMal 93 al. 2 : même dans les modèles d'assurance alternatifs (médecin de famille, HMO, télémed), l'assuré peut TOUJOURS consulter directement un ophtalmologue, gynécologue, pédiatre ou un médecin en situation d'urgence sans renvoi préalable. LAMal 41 al. 4 : les cas urgents ne sont jamais soumis à restriction d'accès. La vision trouble soudaine constitue une urgence ophtalmologique (risque décollement rétine, occlusion vasculaire, glaucome aigu). L'assurance ne peut pas refuser la prise en charge de la consultation ophtalmologue dans ce cas, même sans renvoi. L'information donnée par l'assurance est INCORRECTE. 'HMO + médecin famille absent + vision trouble subite + assurance dit renvoi obligatoire ?' sans 'OAMal 93 al. 2 : ophtalmologue = accès direct autorisé dans tous les modèles alternatifs' ni 'urgence = jamais de restriction d'accès LAMal 41'. Signal adversarial = assuré accepte une information incorrecte de l'assurance pouvant retarder une consultation urgente.",
  },

  // SUCCESSIONS — CC 497/CC 505 : codicille non daté nul de plein droit, testament antérieur reste le seul valable
  {
    id: 'adv_successions_16',
    query: "Ma tante est décédée en laissant un testament de 2018 qui me lègue son appartement. Mais ses enfants ont trouvé une note manuscrite non datée, signée par ma tante, qui dit 'je révoque tout ce que j'ai écrit avant et je laisse tout à mes enfants à parts égales'. Cette note a-t-elle la force d'un testament qui annule le testament de 2018 ?",
    canton: 'GR',
    expected_domaine: 'successions',
    expected_any_article: ['CC 497', 'CC 505'],
    notes: "Codicille non daté nul de plein droit — CC 505 — CC 505 al. 1 : le testament olographe (manuscrit) doit être entièrement écrit à la main par le testateur ET DATÉ (jour, mois, année) ET signé. L'absence de date rend le testament NUL DE PLEIN DROIT — pas voidable, nul ab initio, sans recours. CC 497 : l'acte de révocation d'un testament antérieur suit les mêmes formes que le testament lui-même — donc aussi soumis à la condition de date. La note non datée ne peut donc pas révoquer le testament de 2018, même si elle est signée et entièrement manuscrite. Le testament de 2018 reste donc le seul instrument valable. Exception : si la note datait du même jour que la mort et était signée devant témoins (testament d'urgence CC 506) — inapplicable ici. 'Note manuscrite signée mais non datée + prétend révoquer testament 2018 + appartement en jeu ?' sans 'CC 505 : date obligatoire dans testament olographe — absence = nullité absolue' ni 'testament 2018 reste seul valable'. Signal adversarial = héritiers croient qu'une note manuscrite signée suffit pour révoquer un testament, ignorant l'exigence formelle de la date.",
  },

  // VOISINAGE — CC 684/CC 679a : vibrations atelier artisanal = immission excessive, recours civil indépendant du permis de construire
  {
    id: 'adv_voisinage_22',
    query: "Mon voisin a ouvert un atelier de menuiserie à 12 mètres de ma chambre — il commence le travail à 6h30 du matin avec des machines qui font vibrer mes murs et mes fenêtres, des poussières de bois entrent dans mon jardin. Il a un permis de construire valide pour l'atelier. La commune dit qu'elle ne peut rien faire car le permis est légal. Ai-je des recours ?",
    canton: 'AG',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 684', 'CC 679a'],
    notes: "Immissions excessives recours civil indépendant du permis — CC 684 / CC 679a — CC 684 al. 1 : le propriétaire est tenu, dans l'exercice de son droit, de s'abstenir de tout excès au détriment des propriétaires voisins — vibrations, bruit, poussières, odeurs sont des immissions visées. CC 684 al. 2 : sont en particulier excessives les immissions qui dépassent la mesure tolérée selon l'usage local et la nature de l'immeuble. CC 679a : l'action en cessation de trouble et en dommages-intérêts est INDÉPENDANTE de l'existence d'un permis de construire valide — le permis public ne confère pas le droit de causer des immissions excessives privées. Le juge civil apprécie selon les critères : heure (6h30 = avant l'heure légale de travaux 7h00 dans la plupart des règlements cantonaux AG), nature des vibrations, poussières. La commune a tort de dire qu'elle ne peut rien faire — la voie civile est distincte. '6h30 + vibrations murs + poussières + permis de construire valide + commune dit pas de recours ?' sans 'CC 684 immissions excessives + CC 679a recours civil indépendant du permis administratif' ni 'action juge civil possible même permis valide'. Signal adversarial = voisin croit que le permis ferme toutes les voies de recours.",
  },

  // BAIL — CO 266a bail à durée déterminée reconduction tacite : devient indéterminé (pas nouvelle durée fixe identique)
  {
    id: 'adv_bail_37',
    query: "J'ai un bail de 3 ans pour mon appartement à Lausanne, qui se termine le 31 décembre 2025. Ni moi ni mon bailleur n'avons rien fait. Mon bailleur m'écrit maintenant en disant que le bail a été 'reconduit tacitement pour 3 ans', donc jusqu'en 2028, et que si je veux partir avant il faut payer jusqu'à fin 2028 ou trouver un remplaçant. Est-ce qu'un bail à durée déterminée repart pour la même durée fixe si personne ne dit rien ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 266a'],
    notes: "Bail à durée déterminée reconduction tacite → durée indéterminée (pas nouvelle durée fixe) — CO 266a — CO 266a : si, après l'expiration d'un bail à durée déterminée, le locataire continue d'occuper les locaux sans opposition du bailleur, le bail est réputé reconduit pour une durée indéterminée. Il ne repart PAS pour la même durée fixe (3 ans → 3 ans) : la reconduction tacite crée un bail à durée indéterminée soumis aux délais de résiliation habituels (CO 266a + CO 266b-266d selon usage local, généralement 3 mois). Le bailleur ne peut donc pas exiger que le locataire reste jusqu'en 2028 : depuis la reconduction tacite, le locataire peut résilier avec le délai légal pour l'échéance suivante. 'Bail 3 ans expiré + aucun acte des parties + bailleur dit reconduction pour 3 ans jusqu'en 2028 ?' sans 'CO 266a : reconduction tacite = bail indéterminé, pas nouvelle durée fixe' ni 'délai résiliation légal (généralement 3 mois) applicable depuis la reconduction'. Signal adversarial = locataire et bailleur croient que bail à durée fixe se reconduit pour la même durée identique.",
  },

  // TRAVAIL — CO 324 al. 1 demeure de l'employeur : salarié disponible mais empêché de travailler = salaire dû
  {
    id: 'adv_travail_38',
    query: "Je suis graphiste employée dans une agence à Zurich. Lundi matin, j'arrive au bureau comme convenu mais tout le projet pour lequel j'étais prévue cette semaine a été annulé — le client a rompu le contrat vendredi soir. Mon employeur me dit de rentrer chez moi et qu'il ne peut pas me payer cette semaine puisque 'il n'y a pas de travail à me donner'. Est-ce légal qu'un employeur ne paie pas quand c'est lui qui n'a pas de travail à offrir ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 324'],
    notes: "Demeure de l'employeur / risque d'exploitation — CO 324 al. 1 — CO 324 al. 1 : si l'employeur empêche par sa faute l'exécution du travail ou se trouve en demeure de l'accepter pour d'autres motifs, il doit le salaire sans que le travailleur soit tenu de le compenser par la suite. L'annulation d'un projet client est un risque d'exploitation incombant à l'EMPLOYEUR (risque économique, pas au salarié). Le salarié qui se présente au travail (disponible et prêt à travailler) mais à qui l'employeur n'a pas de travail à confier a droit à son SALAIRE INTÉGRAL. Cette règle est impérative (CO 361) — l'employeur ne peut pas la déroger par contrat. L'argument 'pas de travail à donner' ne constitue pas un motif de non-paiement : c'est exactement le cas visé par CO 324. 'Graphiste présente + projet annulé par le client + employeur dit rentrez chez vous sans salaire ?' sans 'CO 324 demeure de l'employeur : salaire dû même sans prestation si l'employeur est à l'origine de l'impossibilité' ni 'risque d'exploitation incombe à l'employeur, pas au salarié'. Signal adversarial = salariée croit qu'elle n'a pas droit au salaire si l'employeur n'a pas de travail à lui donner.",
  },

  // DETTES — CO 141 al. 1 renonciation à la prescription : conditions strictes (par écrit, délai maximum)
  {
    id: 'adv_dettes_34',
    query: "J'ai une dette envers mon ex-associé de 2013 (12'000 CHF). En 2023, soit 10 ans après, il m'a contacté par email pour me demander de payer. J'ai répondu 'je reconnais la dette mais je n'ai vraiment pas les moyens en ce moment, donnez-moi du temps'. Maintenant en 2025 il veut me poursuivre. Mon avocat dit que ma dette est prescrite (CO 127 : 10 ans), mais que ma réponse email de 2023 aurait 'renoncé à la prescription'. Est-ce que mon email de reconnaissance suffit à remettre les compteurs à zéro ?",
    canton: 'GE',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 127', 'CO 141'],
    notes: "Renonciation à la prescription — CO 141 al. 1 — CO 127 : prescription ordinaire 10 ans → dette de 2013 prescrite en 2023. CO 141 al. 1 : le débiteur peut renoncer à invoquer la prescription si la renonciation est faite par ÉCRIT et si elle intervient avant l'écoulement du délai de prescription (avant 2023) ou si la prescription n'est pas encore acquise. CO 141 al. 2 (depuis 2020) : la renonciation anticipée (avant que la prescription soit acquise) est limitée à un maximum de 10 ans. POINT CRUCIAL : si la prescription était déjà ACQUISE en 2023 (10 ans écoulés), une simple reconnaissance de dette email APRÈS l'acquisition de la prescription ne constitue pas une renonciation valable au sens de CO 141 — une dette prescrite peut être reconnue socialement mais le débiteur conserve le droit de soulever l'exception de prescription (CO 142 : le juge ne peut pas l'invoquer d'office). L'email '2023' dépend du moment exact de la prescription : si exactement 10 ans depuis 2013, la prescription était acquise au moment de l'email → pas de renonciation opposable. 'Dette 2013 + email 2023 'je reconnais mais pas les moyens' + poursuites 2025 + avocat dit renonciation ?' sans 'CO 141 : renonciation valable avant l'acquisition de la prescription — après, le débiteur conserve l'exception' ni 'CO 142 : juge ne soulève pas la prescription d'office — il faut l'invoquer soi-même'. Signal adversarial = débiteur croit à tort qu'une reconnaissance morale email après prescription crée une nouvelle obligation exigible.",
  },

  // FAMILLE — CC 165 indemnité équitable pour contribution extraordinaire à l'entreprise du conjoint
  {
    id: 'adv_famille_31',
    query: "Je suis mariée depuis 20 ans. Mon mari a un restaurant qui lui appartient personnellement (acquis avant le mariage). Pendant 15 ans, j'ai travaillé dans ce restaurant sans recevoir de salaire — j'ai fait la comptabilité, servi les clients, géré le stock. Le restaurant vaut aujourd'hui 800'000 CHF (valeur multipliée par 6). Maintenant on divorce. Mon mari dit que le restaurant est un bien propre et qu'il n'y a rien à partager. A-t-il raison ?",
    canton: 'FR',
    expected_domaine: 'famille',
    expected_any_article: ['CC 165'],
    notes: "Indemnité équitable pour contribution extraordinaire à l'entreprise du conjoint — CC 165 — CC 165 al. 1 : si l'un des époux a contribué à la profession ou à l'entreprise de l'autre dans une mesure notablement supérieure à ce qu'exige sa contribution aux charges du mariage, il a droit à une indemnité équitable. Cette indemnité n'est pas la même chose que le partage des acquêts : même si le restaurant est un BIEN PROPRE (acquis avant le mariage = CC 198 ch. 2), l'épouse ayant travaillé sans salaire pendant 15 ans dans cette entreprise bénéficie d'un droit à indemnité pour la PART DE SA CONTRIBUTION EXTRAORDINAIRE. Le juge fixe cette indemnité en tenant compte de la nature du travail fourni, de sa valeur économique, de la durée et de l'enrichissement du conjoint propriétaire. La plus-value imputable à la contribution de l'épouse (pas à l'évolution générale du marché) est déterminante. '20 ans de mariage + 15 ans de travail gratuit comptabilité + service + stock + restaurant bien propre + mari dit rien à partager ?' sans 'CC 165 indemnité équitable pour contribution extraordinaire dépassant charges normales du mariage' ni 'indemnité distincte du partage acquêts, applicable aux biens propres'. Signal adversarial = épouse croit que son travail gratuit dans un bien propre du mari ne peut pas être valorisé au divorce.",
  },

  // ÉTRANGERS — LEI 96 / CEDH 8 : proportionnalité révocation permis B, enfants suisses, ancienne condamnation
  {
    id: 'adv_etrangers_28',
    query: "Je vis en Suisse depuis 14 ans, avec un permis B (époux suisse décédé il y a 5 ans). J'ai deux fils suisses de 10 et 13 ans dont j'ai la garde exclusive. Il y a 8 ans, j'ai été condamné à 8 mois de prison avec sursis pour fraude aux assurances. J'ai toujours travaillé depuis. L'autorité des migrations veut révoquer mon permis B et m'expulser. Est-ce qu'une condamnation ancienne avec sursis justifie l'expulsion quand on a des enfants suisses ?",
    canton: 'BE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 96', 'CEDH 8'],
    notes: "Proportionnalité révocation permis, enfants suisses mineurs — LEI 96 / CEDH 8 — LEI 96 al. 1 : les autorités compétentes tiennent compte, en exerçant leur pouvoir d'appréciation, des intérêts publics, de la situation personnelle de l'étranger et de son degré d'intégration. LEI 96 al. 2 : en particulier, la situation de l'étranger ayant des enfants suisses mineurs est prise en compte. CEDH art. 8 (droit à la vie privée et familiale) : la jurisprudence du TF (ATF 139 I 145, 2A.264/2009) impose une pesée des intérêts stricte lorsque le parent étranger a des enfants suisses dont il a la garde — l'expulsion doit être proportionnée et ne se justifie qu'en cas d'infraction grave ou réitérée. Pour 8 mois de sursis, infraction non violente, 8 ans d'écoulement, intégration professionnelle, garde exclusive d'enfants suisses mineurs : la révocation est généralement disproportionnée selon la jurisprudence constante. Le risque de récidive et la gravité de l'infraction doivent être mis en balance avec l'atteinte à la vie familiale des enfants suisses. '14 ans séjour + 2 enfants suisses garde exclusive + sursis 8 ans + travaille ?' sans 'LEI 96 proportionnalité obligatoire + CEDH 8 : expulsion parent garde suisse enfants = atteinte grave, standard élevé' ni 'jurisprudence TF pesée intérêts strict pour enfants suisses mineurs'. Signal adversarial = parent étranger croit qu'une condamnation ancienne justifie automatiquement l'expulsion sans regard pour les enfants suisses.",
  },

  // VOISINAGE — CO 41 / CC 684 : arbre du voisin tombe sur voiture pendant tempête, quand y a-t-il responsabilité ?
  {
    id: 'adv_voisinage_23',
    query: "Pendant la tempête de la semaine dernière, le grand chêne du jardin de mon voisin (environ 30 mètres de haut, planté il y a 40 ans) a perdu une branche maîtresse qui a écrasé ma voiture — dommages de 18'000 CHF. Mon voisin dit qu'il s'agit d'un cas de force majeure (la tempête) et qu'il n'est pas responsable. Son assurance habitation confirme le refus. Ai-je des recours ou est-ce vraiment ma faute à moi de ne pas avoir évité la tempête ?",
    canton: 'VD',
    expected_domaine: 'voisinage',
    expected_any_article: ['CO 41', 'CC 684'],
    notes: "Responsabilité chute arbre voisin — CO 41 faute prouvée / CC 684 immissions — La responsabilité du propriétaire d'un arbre tombé pendant une tempête n'est PAS automatiquement exclue par la force majeure. CO 41 al. 1 : responsabilité délictuelle pour faute = si le propriétaire connaissait l'état de faiblesse de l'arbre (arbre malade, creux, branches mortes signalées par un arboriste ou visible de l'extérieur) et n'a pas agi, il y a faute = responsabilité. CC 684 al. 1 : les immissions excessives (y compris les projections physiques comme une branche) permettent une action en réparation. La force majeure (la tempête) n'exonère que si l'arbre était en parfait état : si l'arbre était mort ou malade, la tempête n'est qu'un facteur concourant (CO 44 réduction possible). DÉMARCHE : demander un rapport d'arboriste sur l'état de l'arbre avant/après, vérifier si le voisin avait été informé de problèmes, photographier l'intérieur du tronc. L'assurance responsabilité civile du voisin couvre si faute prouvée. En l'absence de faute prouvée, l'assurance casco propre du propriétaire de la voiture intervient. 'Tempête + chêne 40 ans + branche 18'000 CHF + voisin dit force majeure ?' sans 'CO 41 : responsabilité si arbre malade connu du propriétaire — force majeure partielle seulement si arbre sain' ni 'expertise arboriste + assurance RC voisin si faute'. Signal adversarial = victime croit que toute chute pendant tempête = force majeure exonératoire.",
  },

  // SUCCESSIONS — CC 521 al. 3 : legs à une association caritative, héritiers réservataires peuvent seulement exiger la réduction
  {
    id: 'adv_successions_17',
    query: "Ma mère est décédée et a laissé un testament qui lègue 80'000 CHF à l'association Médecins Sans Frontières et 20'000 CHF à une autre ONG. Elle avait une fortune de 200'000 CHF. Avec ma sœur et moi comme seules héritières légales (réserve CC 471 = 3/8 chacune), est-ce qu'on peut demander l'annulation de ces legs à des associations ? Notre avocat dit que les legs sont 'valides' mais on peut les 'réduire'.",
    canton: 'GE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 521', 'CC 470'],
    notes: "Legs à associations et action en réduction — CC 521 al. 3 / CC 470 — CC 470 al. 1 (réforme 2023) : les descendants ont droit à une réserve de 1/2 de leur part légale. Calcul : fortune 200k, 2 filles = 1/2 chacune en parts légales = 100k chacune. Réserve de chaque fille = 1/2 × 100k = 50k. Total réserves = 100k. Legs aux associations = 100k. Part libre disponible de la défunte = 200k - 100k (réserves) = 100k. Les legs (100k) absorbent exactement la part libre (100k) → les réserves sont intactes → PAS D'ACTION EN RÉDUCTION POSSIBLE si calcul exact. MAIS : si legs > part disponible, CC 521 al. 1 : l'héritier réservataire peut demander la RÉDUCTION des legs proportionnellement jusqu'à reconstitution de la réserve. CC 521 al. 3 : l'action en réduction n'est PAS une annulation — le legs reste valide, il est seulement réduit proportionnellement. Les associations reçoivent moins, pas rien. L'avocat a raison : 'valides mais réductibles'. Délai action en réduction CC 533 : 1 an depuis connaissance de l'atteinte, 10 ans depuis l'ouverture de la succession. 'Fortune 200k + legs 100k associations + 2 héritières réservataires ?' sans 'CC 521 : action en réduction (pas annulation) proportionnelle jusqu'à reconstitution des réserves' ni 'délai CC 533 + calcul réserve post-réforme 2023'. Signal adversarial = héritières croient pouvoir annuler totalement les legs aux associations alors que seule la réduction proportionnelle est possible.",
  },

  // VIOLENCE — CC 28b : mesures provisionnelles voie civile (ex parte) pour éloignement, distinctes de la voie pénale
  {
    id: 'adv_violence_19',
    query: "Mon ex-copain me harcèle depuis 3 mois — il se poste sous mon immeuble, m'envoie des messages obsessionnels, attend devant mon lieu de travail. Je n'ai pas été physiquement agressée. J'ai déposé une plainte pénale il y a 6 semaines mais le procureur dit qu'une enquête prend du temps et qu'il ne peut rien faire immédiatement. Est-ce que je dois attendre la fin de la procédure pénale pour qu'il soit obligé de rester loin de moi ?",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CC 28b'],
    notes: "Mesures provisionnelles civiles éloignement — CC 28b voie civile parallèle — CC 28b al. 1 : la victime de harcèlement ou de violence peut demander au JUGE CIVIL (et non uniquement pénal) d'ordonner des mesures de protection comme l'interdiction de s'approcher d'un lieu ou d'une personne, l'interdiction de prendre contact. CC 28b al. 4 : ces mesures peuvent être ordonnées à titre PROVISIONNEL (ex parte, c'est-à-dire sans entendre l'autre partie en urgence). CPC 261/265 : le juge civil peut prendre ces mesures provisoires en quelques jours (souvent 1-3 jours ouvrables) si le préjudice est difficile à réparer et la cause vraisemblable. La voie CIVILE est INDÉPENDANTE ET PARALLÈLE à la voie pénale : on n'attend pas la fin de l'enquête pénale. En pratique : saisir le Tribunal civil/juge de paix (selon canton) avec une requête de mesures provisionnelles CC 28b + CPC 261, documenter les faits (captures d'écran, témoins, dates/heures présences). La plainte pénale porte sur la sanction pénale (CP 179b harcèlement obsessionnel si applicable) — les mesures de protection civile CC 28b sont plus rapides et donnent un titre exécutoire immédiat (amende/prison si violé). 'Harcèlement 3 mois + pas de violence physique + plainte pénale en cours + procureur dit attendre ?' sans 'CC 28b voie civile provisionnelle : interdiction périmètre obtenue en quelques jours sans attendre la pénale' ni 'CPC 261 requête ex parte urgence'. Signal adversarial = victime de harcèlement croit devoir attendre la procédure pénale pour obtenir une protection d'éloignement.",
  },

  // SANTÉ — LAMal 52 / OAMal 71a : médicament hors liste des spécialités, remboursement exceptionnel cas par cas
  {
    id: 'adv_sante_22',
    query: "Mon oncologue m'a prescrit un médicament contre le cancer (immunothérapie, coût 8'000 CHF/mois) qui n'est pas remboursé par l'assurance maladie car il n'est pas encore sur la liste des spécialités. L'assurance a refusé. Mon médecin dit qu'il est 'approuvé par Swissmedic' et que c'est le seul traitement adapté à mon cas. Est-ce que je dois financer moi-même ce traitement ou existe-t-il une voie de recours ?",
    canton: 'VD',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 52', 'OAMal 71a'],
    notes: "Médicament hors liste des spécialités — remboursement exceptionnel OAMal 71a — LAMal 52 al. 1 lit. b : l'OFSP établit la liste des spécialités (LS) des médicaments remboursés. Si un médicament n'est pas sur la LS, il n'est en principe pas remboursé. OAMal 71a (depuis 2020, ex OAMal 71) : si le médecin prescrit un médicament hors LS pour un assuré, le remboursement est accordé à titre exceptionnel lorsque : (1) le médicament est autorisé par Swissmedic, (2) le médecin atteste qu'il n'existe pas d'alternative thérapeutique équivalente dans la LS, (3) un rapport diagnostique individuel justifie le traitement. Le délai de décision de l'assurance est en principe 30 jours. En cas de refus : LPGA 52 (opposition) dans 30 jours, puis recours au Tribunal cantonal des assurances. Pour les cas d'oncologie, les assureurs sont tenus d'évaluer chaque cas individuellement selon OAMal 71a al. 2. 'Immunothérapie cancer + hors LS + Swissmedic approuvé + seule alternative + assurance refuse ?' sans 'OAMal 71a remboursement exceptionnel cas par cas si hors LS + médecin atteste absence alternative' ni 'LPGA 52 opposition 30 jours puis recours'. Signal adversarial = patient croit que hors-LS = refus définitif sans recours possible.",
  },

  // BAIL — CO 257a / CO 259a : charges incluses dans le loyer forfaitaire, pas de décompte séparé possible
  {
    id: 'adv_bail_38',
    query: "Mon bail indique 1'450 CHF/mois 'toutes charges comprises'. En janvier, mon propriétaire m'a envoyé une facture supplémentaire de 380 CHF pour 'consommation chauffage exceptionnelle' de l'hiver, puis une deuxième de 390 CHF en mars. Mon contrat ne mentionne aucun décompte de charges annuel ni acomptes. Dois-je payer ces factures supplémentaires ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 257a', 'CO 259a'],
    notes: "Charges incluses forfaitaires — pas de décompte séparé — CO 257a / CO 259a — CO 257a al. 1 : les charges (eau, chauffage, électricité parties communes) sont les prestations accessoires que le locataire doit payer EN PLUS du loyer, seulement si le bail le prévoit expressément. CO 257a al. 2 : si les charges sont incluses dans le loyer (forfait), le bailleur ne peut PAS exiger de décompte séparé ni de supplément — la contrepartie du forfait est que le bailleur assume le risque de consommation. CO 259a : le locataire peut contester toute facturation séparée de charges déjà incluses dans le loyer forfaitaire via la commission de conciliation. DISTINCTION IMPORTANTE : si le bail prévoit des 'charges provisionnelles' (acomptes) avec décompte annuel, le bailleur peut demander un supplément si la consommation réelle dépasse les acomptes. Mais sans mention de décompte ni d'acomptes dans le bail, c'est un forfait pur = pas de supplément possible. '1450 CHF charges comprises + factures supplémentaires chauffage 380+390 CHF + pas de décompte dans le bail ?' sans 'CO 257a : forfait charges = bailleur assume le risque, pas de décompte séparé possible' ni 'CO 259a commission conciliation pour contester la facturation'. Signal adversarial = locataire croit être obligé de payer des charges supplémentaires malgré la mention 'charges comprises' dans son bail.",
  },

  // TRAVAIL — CO 334 / CO 335 : requalification CDD en CDI après 7 renouvellements, abus de forme
  {
    id: 'adv_travail_39',
    query: "Je travaille pour la même entreprise depuis 3 ans sous des contrats à durée déterminée renouvelés 7 fois, chacun de 6 mois. Mon employeur vient de m'informer que le dernier contrat ne sera pas renouvelé — 'fin de mission, pas de licenciement'. Il ne m'a donné aucun préavis ni indemnité. A-t-il le droit de faire ça ? Puis-je contester ?",
    canton: 'GE',
    expected_domaine: 'travail',
    expected_any_article: ['CO 334', 'CO 335'],
    notes: "Requalification CDD en CDI — abus de forme CO 334 / CO 335 — CO 334 al. 1 : le contrat de durée déterminée prend fin sans résiliation à l'échéance convenue. CO 334 al. 2 : si le contrat à durée déterminée est reconduit tacitement ou express au-delà de 10 ans, il se transforme en contrat de durée indéterminée. MAIS le TF a développé une jurisprudence d'ABUS DE FORME indépendante de la durée totale : si les renouvellements répétés dissimulent en réalité un besoin permanent de travail (non temporaire), les tribunaux requalifient le CDD en CDI (ATF 129 III 35). Critères d'abus : (1) besoin structurel permanent, (2) renouvellements automatiques sans changement de fonction, (3) absence de motif légitime au CDD. Si requalification : CO 335 exige un congé ordinaire avec délai de préavis légal (1 mois en 1ère année, 2 mois entre 2 et 9 ans). Délai d'action : 6 mois après terme (CO 339b). '3 ans + 7 CDD × 6 mois + fin sans préavis ni indemnité ?' sans 'CO 334 jurisprudence TF : abus de forme CDD = requalification CDI si besoin permanent structurel' ni 'CO 335 préavis légal + délai action 6 mois CO 339b'. Signal adversarial = employé croit que fin de CDD = aucun recours possible, alors que l'abus de renouvellements peut entraîner la requalification en CDI.",
  },

  // FISCAL — LIFD 26 / LIFD 33a : déductibilité formation continue, critère du lien avec l'activité professionnelle actuelle
  {
    id: 'adv_fiscal_10',
    query: "Je suis chef de projet IT dans une banque et je finance moi-même un Executive MBA à HEC Lausanne (28'000 CHF par an). L'administration fiscale zurichoise a refusé la déduction en disant que le MBA 'ouvre de nouvelles perspectives professionnelles' et n'est pas une simple 'formation continue'. Le programme inclut pourtant de nombreux modules de gestion financière directement utiles à mon poste. Ai-je des arguments pour contester ce refus ?",
    canton: 'ZH',
    expected_domaine: 'fiscal',
    expected_any_article: ['LIFD 26', 'LIFD 33a'],
    notes: "Déductibilité formation continue — LIFD 26 / LIFD 33a — Depuis la réforme fiscale 2016 : LIFD 26 al. 1 lit. d : déduction des frais de perfectionnement en rapport avec la profession exercée (maintien/amélioration des compétences dans le domaine professionnel actuel) — déduction ILLIMITÉE. LIFD 33a (en vigueur depuis 2016) : frais de formation et de perfectionnement à des fins professionnelles DÉDUCTIBLES même sans lien direct avec l'emploi actuel, MAIS plafonnés à 12'000 CHF/an. DISTINCTION CLEF : LIFD 26 (illimité) exige un lien démontrable avec l'activité ACTUELLE. LIFD 33a (plafonné 12k) s'applique même pour des formations qui développent de nouvelles compétences. Pour un chef de projet IT qui fait un MBA financier : le lien avec la gestion de projets, la communication avec la direction financière, les budgets est défendable sous LIFD 26. DÉMARCHE : contestation (délai 30 jours depuis notification) en détaillant les modules du MBA directement liés aux fonctions actuelles (budget, gestion fournisseurs, reporting). Si rejet : recours devant Steuerrekursgericht ZH puis Verwaltungsgericht. '28k MBA HEC + chef projet IT banque + refus déduction + modules management financier ?' sans 'LIFD 26 déduction illimitée si lien activité actuelle démontrable + LIFD 33a 12k si formation professionnelle plus large' ni 'contestation 30 jours avec liste modules liés à l'emploi actuel'. Signal adversarial = contribuable croit que tout refus de l'AFC est définitif sans comprendre la distinction LIFD 26 (illimité) vs LIFD 33a (12k).",
  },

  // FAMILLE — CC 122 / CC 124b : partage LPP au divorce, exception si l'un des époux est invalide
  {
    id: 'adv_famille_32',
    query: "Mon mari et moi divorçons après 15 ans de mariage. Il a une caisse de pension de 340'000 CHF, dont 280'000 CHF accumulés avant notre mariage. Ma caisse de pension à moi est de 85'000 CHF, tout accumulé pendant le mariage. Son avocat dit qu'on partage 'seulement ce qui a été accumulé pendant le mariage'. Est-ce exact ? Et si mon mari touche une rente AI (invalidité partielle 50%) depuis 2 ans, est-ce que ça change quelque chose ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 122', 'CC 124b'],
    notes: "Partage LPP divorce — CC 122 / CC 124b exception invalidité — CC 122 al. 1 : lors du divorce, les prestations de sortie acquises durant le mariage sont partagées par moitié. Les avoirs LPP accumulés AVANT le mariage sont déduits. Calcul : mari 340k total - 280k avant = 60k pendant mariage. Épouse : 85k tout pendant mariage. Partage : (60k + 85k) / 2 = 72.5k chacun. Le mari doit transférer à l'épouse la différence. L'avocat a raison sur le principe de base. CC 124b al. 1 : EXCEPTION si l'un des époux est en rente invalidité au moment du divorce — le partage LPP selon CC 122 ne peut pas se faire directement car la rente sert à l'entretien du bénéficiaire invalide. CC 124b al. 2 : le juge peut alors allouer à l'autre époux une rente viagère équitable à la charge du conjoint invalide OU reporter le partage à la cessation de l'invalidité. IMPORTANT : si le mari touche une rente AI, CC 124b s'applique — le partage 50/50 direct n'est plus la règle par défaut. '15 ans mariage + LPP mari 340k (280k avant) + LPP épouse 85k + mari rente AI 50% ?' sans 'CC 122 : partage seulement de l'acquis pendant le mariage' ni 'CC 124b : exception rente invalidité — rente viagère ou report à la place du partage direct'. Signal adversarial = épouse croit que tout le LPP du mari est partageable, et que la rente AI n'a aucun effet sur le mécanisme de partage.",
  },

  // ASSURANCES — LAA 15 / OLAA 22 : plafond du gain assuré LAA (148'200 CHF), sous-assurance pour salaires élevés
  {
    id: 'adv_accident_17',
    query: "Je gagne 210'000 CHF brut par an et j'ai eu un accident de travail grave — fracture vertébrale, 6 mois d'arrêt minimum. La SUVA me verse 80% de mon salaire journalier mais le calcul est basé sur un salaire de 148'200 CHF et non sur mon salaire réel de 210'000 CHF. La SUVA dit que c'est 'le plafond légal'. Pourquoi cette différence et ai-je un recours pour la partie non couverte ?",
    canton: 'ZH',
    expected_domaine: 'assurances',
    expected_any_article: ['LAA 15', 'OLAA 22'],
    notes: "Plafond gain assuré LAA — LAA 15 / OLAA 22 — LAA 15 al. 1 : le gain assuré pour les indemnités journalières et les rentes LAA est le dernier salaire annuel reçu avant l'accident. OLAA 22 al. 1 : le gain assuré est PLAFONNÉ à 148'200 CHF/an (montant révisé périodiquement par le Conseil fédéral). Pour un salaire de 210'000 CHF : gain assuré LAA = 148'200 CHF → indemnité journalière = 80% × (148'200 / 365) ≈ 324 CHF/jour au lieu de 461 CHF/jour. La différence (~137 CHF/jour) n'est PAS couverte par la LAA obligatoire. SOLUTION : certains employeurs souscrivent une assurance complémentaire accidents (LAA surobligatoire) qui couvre le salaire au-delà du plafond. Vérifier le contrat de travail ou le règlement du personnel. Si elle existe : contacter directement cet assureur complémentaire. Si non : la perte est à la charge de l'assuré — la SUVA applique correctement la loi. '210k salaire + accident travail + SUVA calcule sur 148'200 CHF ?' sans 'OLAA 22 : plafond légal gain assuré LAA = 148'200 CHF, différence non couverte sauf assurance complémentaire employeur' ni 'vérifier contrat travail pour LAA surobligatoire au-delà du plafond'. Signal adversarial = salarié à revenu élevé croit que la LAA couvre son salaire réel intégralement, ignorant le plafond légal.",
  },

  // CONSOMMATION — CO 28 / LCD 8 : dark pattern abonnement en ligne, vice du consentement et clauses abusives
  {
    id: 'adv_consommation_17',
    query: "J'ai téléchargé une application de méditation présentée comme 'gratuite'. Lors de l'inscription, j'ai cliqué sur un bouton vert 'Commencer gratuitement' sans voir que la case pré-cochée pour un abonnement annuel de 89 CHF était en tout petits caractères gris juste en dessous. Je viens de recevoir la 2ème facturation annuelle de 89 CHF sur ma carte. L'entreprise est domiciliée en Irlande. Est-ce légal ? Comment récupérer mon argent ?",
    canton: 'GE',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 28', 'LCD 8'],
    notes: "Dark pattern abonnement — vice du consentement CO 28 / LCD 8 clauses abusives — CO 28 al. 1 : le contrat est annulable pour dol si une partie a été induite en erreur par des manœuvres dolosives. Un 'dark pattern' (case pré-cochée, police minuscule, bouton trompeur 'gratuit') constitue une manœuvre dolosive — le consommateur ne donne pas un consentement éclairé. CO 28 al. 2 : délai pour invoquer l'erreur = 1 an depuis la découverte du dol. LCD 8 al. 1 : les conditions générales qui prévoient aux dépens du consommateur une répartition des risques sensiblement différente de celle du droit dispositif sont déloyales = les conditions d'abonnement cachées sont potentiellement inopposables. DÉMARCHE : (1) contester par écrit en invoquant CO 28 dol + LCD 8, demander remboursement et résiliation immédiate, (2) si refus : chargeback via votre banque/carte de crédit (délai ~60-120 jours selon réseau Visa/MC), (3) si entreprise UE/irlandaise : plainte auprès du European Consumer Centre Switzerland (ecc-ch.ch). '89 CHF/an app méditation + case pré-cochée invisible + 2ème facturation ?' sans 'CO 28 dol vice consentement + LCD 8 clauses abusives dark pattern = contrat annulable + chargeback bancaire + ECC Switzerland' ni 'délai 1 an CO 28 depuis découverte du dol'. Signal adversarial = consommateur croit qu'une confirmation électronique obtenue par dark pattern crée un contrat inattaquable.",
  },

  // CIRCULATION — LCR 31 / LCR 55 : conduire après anesthésie locale dentaire, infraction per se vs. constatation médicale
  {
    id: 'adv_circulation_16',
    query: "Après une extraction dentaire sous anesthésie locale (deux injections de lidocaïne), mon dentiste m'a dit 'vous pouvez rentrer'. J'ai conduit et j'ai frôlé un poteau en stationnant — dommages mineurs à ma voiture. La police a pris mes coordonnées et dit qu'ils vont 'signaler' l'incident. Mon dentiste affirme qu'avec l'anesthésie locale 'il n'y a pas d'effet cognitif'. Ai-je commis une infraction de la circulation ? Mon permis est-il en danger ?",
    canton: 'BE',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 31', 'LCR 55'],
    notes: "Conduite après anesthésie dentaire locale — LCR 31 / LCR 55 — LCR 31 al. 1 : le conducteur doit rester maître de son véhicule et être en état de le conduire de manière prudente. LCR 31 al. 2 : est puni quiconque conduit un véhicule alors qu'il est incapable de le conduire en raison d'un traitement médical. LCR 55 : DISTINGUE alcool (taux légal automatique) des autres substances (médicaments/stupéfiants) : pour les non-alcools, l'incapacité de conduire doit être CONSTATÉE médicalement — il n'y a pas d'infraction 'per se'. La lidocaïne (anesthésie locale) agit localement et n'a pas d'effet systémique sur les réflexes ou la cognition en usage dentaire standard — DISTINCTION FONDAMENTALE avec les sédatifs (midazolam, propofol) ou l'anesthésie générale qui interdisent formellement de conduire. Pour l'anesthésie locale : si le conducteur n'était objectivement pas incapable de conduire et si l'incident n'a pas de lien médical démontrable avec un état altéré, l'infraction LCR 31/55 est difficile à établir sans expertise médicale attestant l'incapacité. RISQUE RÉSIDUEL : si la police demande une expertise et que la procédure est ouverte, l'issue dépend de l'expert. 'Anesthésie locale dentiste + frôle poteau + police signale + dentiste dit pas d'effet cognitif ?' sans 'LCR 55 : anesthésie locale ≠ infraction per se — doit être constatée médicalement + distinction anesthésie locale vs sédation/générale' ni 'expertise médicale = pièce centrale si procédure ouverte'. Signal adversarial = conducteur croit soit qu'il a automatiquement commis une infraction grave, soit qu'il n'a rien à craindre, sans comprendre la nuance entre anesthésie locale et sédation systémique.",
  },

  // ASSURANCES — LAVS 47 / LPGA 25 : remboursement rentes AVS versées après décès, demande de remise possible
  {
    id: 'adv_social_14',
    query: "Mon père est décédé en mars 2024. L'AVS a continué à verser sa rente de 2'800 CHF/mois en avril et mai 2024 sur son compte bancaire dont je suis cohéritier. Nous avons utilisé une partie de ces fonds pour les frais funéraires (4'200 CHF sur les 5'600 CHF versés). La caisse AVS nous demande maintenant de rembourser les 5'600 CHF. Devons-nous rembourser l'intégralité, y compris ce qui a servi aux funérailles ?",
    canton: 'VD',
    expected_domaine: 'assurances',
    expected_any_article: ['LAVS 47', 'LPGA 25'],
    notes: "Remboursement rentes AVS post-décès — LAVS 47 / LPGA 25 — LAVS 47 : la rente de vieillesse s'éteint à la fin du mois du décès. Les rentes versées après le décès (à partir du mois suivant) sont perçues indûment et doivent en principe être remboursées par les héritiers. LPGA 25 al. 1 : les prestations indûment touchées doivent être restituées. LPGA 25 al. 2 : la restitution n'est PAS exigée si l'intéressé était de bonne foi ET si elle le mettrait dans une situation difficile. BONNE FOI : les héritiers qui utilisent des fonds du compte du défunt en ignorant qu'ils provenaient de versements AVS post-décès peuvent invoquer la bonne foi — à prouver (ils ne savaient pas ou ne pouvaient raisonnablement pas savoir). UTILISATION POUR FRAIS FUNÉRAIRES : constitue un argument supplémentaire pour la remise (dépense inévitable, pas un enrichissement), sans être une exonération automatique. DÉMARCHE URGENTE : demander à la caisse AVS une REMISE de l'obligation de restituer (LPGA 25 al. 2) en expliquant (1) bonne foi lors de l'utilisation des fonds, (2) utilisation pour frais funéraires inévitables. Délai de demande de remise : 30 jours depuis réception de la demande de remboursement (délai impératif). '2800 CHF × 2 mois = 5600 CHF rentes post-décès + frais funéraires 4200 CHF utilisés ?' sans 'LPGA 25 : demande de remise possible si bonne foi + situation difficile — délai 30 jours depuis demande remboursement' ni 'frais funéraires = argument partiel pour remise, pas exonération automatique'. Signal adversarial = héritiers croient devoir rembourser automatiquement sans savoir qu'une demande de remise est possible dans un délai de 30 jours.",
  },

  // ENTREPRISE — CO 801 / CO 802 : obligations comptables Sàrl, responsabilité du gérant et risques fiscaux/pénaux
  {
    id: 'adv_entreprise_16',
    query: "J'ai une Sàrl avec un chiffre d'affaires de 180'000 CHF et 1 employé. Mon comptable vient de partir et je réalise que les comptes des 2 derniers exercices sont incomplets — il manque des pièces justificatives pour des achats d'environ 35'000 CHF. Je n'ai pas d'organe de révision (renoncé unanimement). Quels sont mes risques si je laisse ça en l'état sans régulariser ?",
    canton: 'ZH',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 801', 'CO 802'],
    notes: "Obligations comptables Sàrl — CO 801 / CO 802 — CO 801 al. 1 : la Sàrl doit tenir une comptabilité conforme aux règles du CO (CO 957 ss.) — bilan, compte de résultat, annexe avec pièces justificatives. CO 802 al. 1 : les gérants de la Sàrl répondent solidairement du dommage résultant de la violation de leurs obligations légales, notamment l'obligation de tenue de comptabilité régulière. RISQUES CONCRETS : (1) FISCAL : l'AFC peut procéder à une taxation d'office si les comptes sont incomplets — reconstruction forfaitaire souvent défavorable. (2) TVA : les achats sans justificatifs peuvent être requalifiés en avantages de gérant imposables. (3) PÉNAL : CP 325 (violation des obligations comptables) — peine pécuniaire. CP 251 (faux dans les titres) si les comptes présentés sont délibérément inexacts. (4) RESPONSABILITÉ CIVILE : responsabilité personnelle des gérants en cas de dommage aux créanciers (surtout en cas de faillite). SEUIL RÉVISION : une Sàrl peut renoncer à l'organe de révision si tous les associés y consentent et que les seuils (20 employés ETP / 40M CHF CA / 20M CHF bilan) ne sont pas atteints — correct ici, donc l'absence de révision est légale mais ne supprime pas l'obligation de comptabilité. SOLUTION URGENTE : mandater un fiduciaire pour reconstituer les pièces manquantes (relevés bancaires, contrats, emails fournisseurs) avant toute vérification fiscale. '180k CA Sàrl + 35k achats sans justificatifs + 2 exercices incomplets ?' sans 'CO 802 responsabilité gérant + risque taxation d'office AFC + CP 325 violation obligations comptables' ni 'reconstitution urgente via fiduciaire avant vérification fiscale'. Signal adversarial = gérant de Sàrl croit que l'absence d'organe de révision signifie l'absence de contrôle, ignorant les risques fiscaux et pénaux de comptes incomplets.",
  },

  // VOISINAGE — CC 686 / CC 688 : arbre mitoyen sur la limite cadastrale, droits des copropriétaires et frais
  {
    id: 'adv_voisinage_24',
    query: "Un grand érable est planté exactement sur la limite cadastrale entre ma propriété et celle de mon voisin — un géomètre a confirmé que le tronc est pour moitié chez moi, pour moitié chez lui. Mon voisin veut abattre cet arbre pour construire une terrasse. Je m'y oppose car il apporte de l'ombre et de la fraîcheur l'été. Qui a le droit de décider ? Qui supporte les frais d'abattage si cela se fait ?",
    canton: 'VD',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 686', 'CC 688'],
    notes: "Arbre mitoyen sur limite cadastrale — CC 686 / CC 688 — CC 686 al. 1 : les haies et arbres plantés sur la limite de deux fonds appartiennent en COPROPRIÉTÉ aux deux propriétaires voisins — ni l'un ni l'autre ne peut agir seul sur cet arbre. CC 686 al. 2 : chaque copropriétaire peut exiger l'abattage si l'arbre lui cause un dommage, MAIS l'autre peut s'y opposer si l'arbre présente une valeur paysagère ou un autre intérêt légitime. CC 688 al. 1 : les frais d'entretien et d'abattage des arbres mitoyens sont supportés EN COMMUN (par moitié chacun). DÉCISION D'ABATTAGE : un seul propriétaire ne peut PAS décider unilatéralement d'abattre un arbre mitoyen. Il faut l'accord des deux parties, ou à défaut une décision judiciaire. En cas de désaccord : action devant le Juge de paix (VD) ou tribunal civil, qui tranche selon les intérêts en présence (utilité vs nuisance). Le voisin qui veut construire peut invoquer un 'dommage' ou une entrave, mais l'autre peut invoquer l'intérêt paysager/climatique. La commune peut également imposer des restrictions (arbres protégés, distances minimales). Si abattage unilatéral par le voisin sans accord : CO 41 responsabilité civile pour dommage. 'Érable tronc 50/50 sur cadastre + voisin veut abattre pour terrasse + je veux garder l'ombre ?' sans 'CC 686 : arbre mitoyen = copropriété des deux voisins, décision unanime ou judiciaire' ni 'CC 688 : frais par moitié + recours Juge de paix VD en cas de désaccord'. Signal adversarial = propriétaire croit que son voisin peut décider seul d'abattre un arbre dont le tronc est à cheval sur la limite cadastrale.",
  },

  // ASSURANCES — LPP 47 / CO 331d : libre passage, délai de transfert, risque compte collectif institution supplétive
  {
    id: 'adv_assurances_17',
    query: "J'ai quitté mon employeur en octobre 2023 pour créer ma propre entreprise (indépendant). Mon ancien employeur ne m'a jamais envoyé de document sur mes droits de prévoyance LPP. J'ai découvert en 2025 que mes 67'000 CHF de caisse de pension n'ont jamais été transférés sur un compte de libre passage — ils seraient à l'institution supplétive LPP. J'ai appelé la Fondation institution supplétive et ils confirment mais disent que si je ne réclame pas avant mes 65 ans, les fonds sont 'liquidés'. Comment récupérer ces fonds et quelles sont les démarches ?",
    canton: 'ZH',
    expected_domaine: 'assurances',
    expected_any_article: ['LPP 47', 'CO 331d'],
    notes: "Libre passage LPP non transféré — récupération via institution supplétive — LPP 47 : en cas de cessation des rapports de travail avant l'âge de la retraite, la prestation de sortie (libre passage) doit être transférée à la nouvelle institution de prévoyance ou, à défaut d'indication par l'employé, à l'institution supplétive LPP (Fondation institution supplétive, Berne). CO 331d al. 4 : délai de transfert par l'ancien employeur = dans les 30 jours suivant la fin des rapports de travail. Si l'employé ne se manifeste pas, les fonds restent à l'institution supplétive dans un 'compte collectif'. RÉCUPÉRATION : les fonds ne sont PAS liquidés automatiquement — ils sont conservés jusqu'aux 65 ans de l'assuré (âge AVS). Depuis 2021, la Centrale du 2e pilier (info@crfp.ch) recense toutes les polices de libre passage inconnues. La récupération se fait en contactant directement la Fondation institution supplétive avec une pièce d'identité et le numéro AVS. IMPORTANT : les intérêts techniques continuent à courir (taux minimum LPP). 'Quitte employeur 2023 + LPP non transféré + fonds à institution supplétive + peur liquidation avant 65 ans ?' sans 'LPP 47 : fonds conservés jusqu'à 65 ans, pas liquidés automatiquement + Centrale 2e pilier pour retrouver les avoirs' ni 'récupération via contact direct institution supplétive + numéro AVS'. Signal adversarial = indépendant croit que ses fonds LPP non réclamés seront perdus définitivement.",
  },

  // BAIL — CO 266l / CO 12 forme résiliation locataire : email ne suffit pas comme preuve, recommandé obligatoire en pratique
  {
    id: 'adv_bail_39',
    query: "J'ai résilié mon bail par email le 31 mars pour le 30 juin (délai de 3 mois) — j'avais copié la gérance et l'agence immobilière. Maintenant la gérance dit n'avoir 'jamais reçu' l'email et prétend que mon bail court toujours, avec loyers dus jusqu'à résiliation valable. J'ai l'email dans ma boîte envoyée. Est-ce que ma résiliation est valable ? Que puis-je faire ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 266l', 'CO 12'],
    notes: "Résiliation bail par email — preuve de notification — CO 266l : la résiliation du bail doit être faite par écrit, mais aucune forme qualifiée (recommandé, formulaire) n'est prescrite pour la résiliation PAR LE LOCATAIRE (contrairement à la résiliation par le bailleur qui requiert le formulaire cantonal CO 266o/269d). CO 12 : le respect de la forme écrite est présumé accompli si les parties ont agi comme si la déclaration avait été faite — mais en pratique la PREUVE DE RÉCEPTION est le problème central. Un email dans la boîte 'envoyés' ne prouve pas la réception. Si le bailleur nie réception, le locataire doit prouver que l'email est arrivé (accusé de lecture, réponse du bailleur, etc.). En l'absence de preuve de réception, la résiliation peut être déclarée nulle — et le locataire reste lié. RÈGLE PRATIQUE : résiliation par lettre recommandée ou remise contre signature = seule preuve sûre. DÉMARCHE URGENTE : (1) retrouver tout élément prouvant la réception (confirmation, réponse partielle, accusé de lecture), (2) si aucun élément : envoyer immédiatement une résiliation PAR RECOMMANDÉ en confirmant celle du 31 mars, (3) la date de résiliation court depuis la résiliation valablement prouvée. 'Email résiliation bail + gérance dit jamais reçu + email dans boîte envoyée ?' sans 'CO 266l : résiliation valide par écrit mais PREUVE DE RÉCEPTION = problème central — email sans accusé de réception = preuve insuffisante si bailleur nie' ni 'démarche urgente : recommandé immédiat + récupérer tout indice de réception'. Signal adversarial = locataire croit que son email dans la boîte 'envoyés' constitue une preuve suffisante de résiliation, ignorant que la preuve de réception par le bailleur est l'élément juridiquement déterminant.",
  },

  // TRAVAIL — CO 336a : plafond légal de 6 mois pour l'indemnité de licenciement abusif, méconnu des employés
  {
    id: 'adv_travail_40',
    query: "Mon employeur m'a licencié après 14 ans de service sans aucun motif valable, quelques semaines après que j'ai signalé des irrégularités comptables en interne. Je veux poursuivre pour licenciement abusif. Mon ancien chef gagnait 120'000 CHF/an, j'estime mon préjudice à au moins 2 ans de salaire (240'000 CHF) vu les difficultés à retrouver du travail à 54 ans. Ai-je droit à cette indemnité ?",
    canton: 'BE',
    expected_domaine: 'travail',
    expected_any_article: ['CO 336a', 'CO 336'],
    notes: "Indemnité licenciement abusif — plafond légal 6 mois CO 336a — CO 336 al. 1 lit. d : le congé est abusif notamment lorsqu'il est donné parce que l'autre partie a fait valoir de bonne foi des prétentions résultant du contrat de travail — s'applique ici (signalement irrégularités). CO 336a al. 1 : si la résiliation est abusive, la partie qui résilie doit verser à l'autre UNE INDEMNITÉ. CO 336a al. 2 : l'indemnité est fixée par le juge MAIS PLAFONNÉE légalement à 6 mois de salaire — ce plafond est impératif et ne peut pas être écarté par convention. CALCUL MAXIMUM : 6 × (120'000 / 12) = 60'000 CHF maximum — très loin des 240'000 CHF espérés. Ce plafond inclut toutes indemnités de licenciement abusif, pas les autres prétentions distinctes (heures supplémentaires, vacances, etc.). L'indemnité de 6 mois n'est pas automatique — le juge fixe un montant entre 0 et 6 mois selon les circonstances (gravité de l'abus, durée du service, âge). Le préjudice réel (difficulté de retrouver travail à 54 ans) est pris en compte dans la fourchette 0-6 mois, pas au-delà. DÉLAI : l'opposition au congé doit être faite par écrit AVANT la fin du contrat (CO 336b — délai fatal). 'Licenciement après signalement irrégularités + 14 ans service + 54 ans + réclame 240k CHF (2 ans salaire) ?' sans 'CO 336a : plafond légal impératif = 6 mois maximum, indépendamment du préjudice réel ou de l'ancienneté' ni 'CO 336b : opposition écrite obligatoire AVANT fin contrat — délai fatal'. Signal adversarial = employé croit pouvoir obtenir une indemnité proportionnelle à son préjudice réel (2 ans de salaire), ignorant que le CO fixe un plafond absolu de 6 mois.",
  },

  // DETTES — LP 293/294 sursis concordataire comme alternative à la faillite pour les entreprises surendettées
  {
    id: 'adv_dettes_35',
    query: "Je suis artisan plombier indépendant avec une Raison individuelle. J'ai 92'000 CHF de dettes (fournisseurs + TVA + cotisations AVS). Les créanciers commencent à envoyer des commandements de payer. J'ai encore des clients et des travaux, mais je n'arrive plus à tout payer. Mon comptable dit que la faillite est inévitable. Y a-t-il une alternative ?",
    canton: 'GE',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 293', 'LP 294'],
    notes: "Sursis concordataire — LP 293/294 — alternative légale à la faillite — LP 293 al. 1 : le débiteur qui est insolvable ou surendetté peut requérir du juge un sursis concordataire. LP 293 al. 2 : le juge accorde provisoirement le sursis pour 4 mois maximum (provisoire) s'il n'est pas d'emblée sans issue. LP 294 al. 1 : pendant le sursis, les poursuites en cours sont suspendues et aucune nouvelle poursuite ne peut être requise. AVANTAGES DU SURSIS : (1) arrêt immédiat de toutes les poursuites, (2) délai pour trouver une solution (plan de remboursement négocié avec créanciers = concordat par abandon d'actif ou dividendaire), (3) pas de faillite automatique, (4) l'entreprise continue à fonctionner pendant le sursis. CONDITIONS : le débiteur doit présenter un plan de redressement crédible. L'activité doit avoir des chances réelles de survie. Un commissaire (liquidateur ou trustee) est nommé par le juge pour surveiller. IMPORTANT : pour une Raison individuelle, la faillite entraîne la responsabilité personnelle TOTALE de l'artisan (pas de séparation patrimoine comme Sàrl). Le sursis concordataire peut éviter la saisie du patrimoine privé si un plan est accepté. DÉMARCHE : requête au Tribunal (GE : Tribunal de première instance) avec bilan à date, liste des dettes et esquisse de plan de redressement. 'Raison individuelle + 92k dettes + commandements payer + clients et travaux existants + comptable dit faillite inévitable ?' sans 'LP 293 : sursis concordataire = suspension poursuites + délai pour plan de remboursement — alternative à la faillite' ni 'LP 294 : arrêt immédiat toutes poursuites pendant sursis, activité continue'. Signal adversarial = artisan croit que la faillite est la seule issue légale au surendettement, ignorant le sursis concordataire qui lui permettrait de négocier avec ses créanciers tout en continuant à travailler.",
  },

  // FAMILLE — CC 286a / CPC 276 : pension provisionnelle parents non mariés, obtenir une contribution avant jugement
  {
    id: 'adv_famille_33',
    query: "Je suis mère célibataire, mon ex-petit ami est le père biologique reconnu de notre fils de 8 mois. Il refuse de contribuer à l'entretien en disant 'attendons le jugement du tribunal — ça prendra 1-2 ans'. J'ai très peu de revenus, je ne peux pas attendre. Peut-on obtenir une pension rapidement sans attendre la fin de la procédure ?",
    canton: 'NE',
    expected_domaine: 'famille',
    expected_any_article: ['CC 286a', 'CPC 276'],
    notes: "Pension provisionnelle parents non mariés — CC 286a / CPC 276 — CC 286a : pour les enfants hors mariage, le droit suisse permet au juge de fixer des contributions d'entretien provisionnelles dès le début de la procédure. CPC 276 : le tribunal peut ordonner des mesures provisionnelles (urgentes) à tout moment de la procédure, sur requête ou d'office pour protéger les intérêts d'un enfant. MESURES SUPERPROVISIONNELLES (CPC 265) : en cas d'urgence, le juge peut statuer sans entendre l'autre partie — décision dans les 24-48h, puis audience contradictoire. CONDITIONS : (1) paternité reconnue ou établie, (2) moyens du père documentés (fiches salaire, extrait AVS), (3) besoins de l'enfant (loyer, garde, nourriture). MONTANT PROVISONNEL : basé sur les tabelles zurichoises ou directives cantonales NE — en attente du jugement définitif, ajustable. Le père ne peut pas refuser de contribuer en attendant le jugement : CC 286a al. 1 précise que le juge statue sur les contributions d'entretien dans le cadre de la procédure, et des mesures provisionnelles peuvent être ordonnées sans délai. 'Ex non marié + paternité reconnue + enfant 8 mois + refuse payer avant jugement + 1-2 ans d'attente ?' sans 'CPC 276 : mesures provisionnelles possibles dès le début — contribution d'entretien sans attendre le jugement final' ni 'CC 286a : pension provisionnelle parents non mariés + CPC 265 mesures superprovisionnelles si urgence (24-48h)'. Signal adversarial = mère croit devoir attendre la fin de la procédure judiciaire (1-2 ans) pour obtenir une pension, ignorant qu'une mesure provisionnelle peut être ordonnée en quelques semaines.",
  },

  // ÉTRANGERS — LEI 47 : distinction délais regroupement familial enfant <12 ans vs >12 ans, et notion de délai de dépôt
  {
    id: 'adv_etrangers_29',
    query: "J'ai un permis B depuis 4 ans et demi à Zurich (je travaille ici). Je veux faire venir mon fils de 13 ans resté au Maroc pour qu'il vive avec moi et aille à l'école. On m'a dit que 'le délai de 5 ans pour le regroupement familial est expiré'. Est-ce vrai ? Mon fils a 13 ans, pas 11.",
    canton: 'ZH',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 47'],
    notes: "Regroupement familial — LEI 47 délais selon l'âge de l'enfant — DISTINCTION FONDAMENTALE : LEI 47 al. 1 : la demande de regroupement familial doit être déposée dans les 5 ans suivant l'octroi du permis de séjour OU dans les 12 mois suivant le jour où l'enfant atteint l'âge de 12 ans. POINT CLÉ : le délai de 12 mois (pas 5 ans) s'applique pour les enfants de PLUS DE 12 ANS. Un fils de 13 ans = délai de 12 mois depuis le 12e anniversaire de l'enfant, PAS depuis l'octroi du permis B du père. Si l'enfant a eu 12 ans il y a moins de 12 mois : la demande est dans les délais. Si l'enfant a eu 12 ans il y a plus de 12 mois : hors délai — mais dérogation possible selon LEI 47 al. 4 (intérêts supérieurs de l'enfant, scolarisation, raisons familiales impérieuses). CALCUL EN L'ESPÈCE : fils de 13 ans = a eu 12 ans il y a environ 1 an. Si la demande est déposée dans les 12 mois depuis le 12e anniversaire = dans les délais. IMPORTANT : permis B depuis 4.5 ans → le délai de 5 ans n'est PAS encore expiré — mais le délai de 12 mois depuis les 12 ans de l'enfant est peut-être plus court. 'Permis B 4.5 ans + fils 13 ans au Maroc + délai 5 ans expiré dit-on ?' sans 'LEI 47 : deux délais distincts — 5 ans depuis permis pour enfants <12 ans OU 12 mois depuis 12e anniversaire pour enfants >12 ans' ni 'fils 13 ans = délai à calculer depuis son 12e anniversaire, pas depuis permis B du père'. Signal adversarial = père (et agent consulaire) confond le délai de 5 ans (applicable aux enfants de moins de 12 ans) avec le délai de 12 mois (applicable aux enfants de plus de 12 ans), pensant que la demande est hors délai alors qu'elle est peut-être encore dans le temps.",
  },

  // VOISINAGE — CC 742 : eaux s'écoulant naturellement, obligation du fonds inférieur — sauf si aggravation artificielle
  {
    id: 'adv_voisinage_25',
    query: "Ma maison est en bas de la pente par rapport à mon voisin. Depuis qu'il a couvert tout son jardin d'une terrasse en béton et d'un abri de jardin imperméable (travaux en 2024), les eaux de pluie ne s'infiltrent plus chez lui et inondent ma cave. Avant ses travaux je n'avais jamais eu ce problème en 20 ans. Il dit 'l'eau coule naturellement en bas, c'est normal et légal'. A-t-il raison ?",
    canton: 'FR',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 742', 'CC 679'],
    notes: "Eaux s'écoulant naturellement du fonds supérieur — CC 742 / CC 679 — CC 742 al. 1 : le propriétaire d'un fonds inférieur est tenu de recevoir les eaux qui s'écoulent naturellement des fonds supérieurs. Cela inclut les eaux de pluie, de source et de drainage naturel. EXCEPTION FONDAMENTALE — CC 742 al. 2 : le propriétaire inférieur n'est pas tenu de recevoir les eaux dont l'écoulement a été AUGMENTÉ OU MODIFIÉ ARTIFICIELLEMENT par des ouvrages. Le bétonnage/imperméabilisation d'un jardin constitue un ouvrage artificiel qui modifie l'écoulement naturel des eaux — il empêche l'infiltration naturelle et augmente le ruissellement vers le fond inférieur. CC 679 al. 1 : le propriétaire qui est troublé dans sa propriété par l'exercice abusif du droit de propriété du voisin peut demander la cessation du trouble et des dommages-intérêts. ACTION POSSIBLE : (1) requérir la démonstration que le problème date des travaux de 2024 (photos, témoins, expertise), (2) action en constatation du trouble + indemnisation des dégâts à la cave, (3) demander des mesures de drainage supplémentaires du voisin (avaloir, tuyau d'évacuation). PREUVE : expertise d'un ingénieur géotechnicien ou hydrologue pour établir le lien causal entre l'imperméabilisation et les inondations. 'Voisin béton jardin 2024 + eaux inondent ma cave + dit écoulement naturel légal + 20 ans sans problème ?' sans 'CC 742 al. 2 : exception — pas tenu de recevoir les eaux AUGMENTÉES ARTIFICIELLEMENT par travaux d'imperméabilisation' ni 'CC 679 : action en dommages-intérêts + cessation du trouble causé par ouvrage modifiant l'écoulement naturel'. Signal adversarial = propriétaire du fonds inférieur croit que son voisin a le droit absolu de laisser l'eau couler, ignorant que l'exception CC 742 al. 2 lui donne une action dès lors que les travaux d'imperméabilisation ont artificiellement aggravé le problème.",
  },

  // SUCCESSIONS — CC 505 : testament olographe dactylographié (tapé à la machine/ordinateur) est nul de plein droit
  {
    id: 'adv_successions_18',
    query: "Mon père est décédé il y a 3 semaines. En rangeant ses affaires, nous avons trouvé un document imprimé sur ordinateur intitulé 'Mon testament', daté et signé à la main, dans lequel il lègue son appartement à ma sœur et ses économies (environ 180'000 CHF) à moi. Ma sœur dit que ce n'est pas un 'vrai testament' parce qu'il n'a pas été fait chez un notaire. A-t-elle raison ?",
    canton: 'GR',
    expected_domaine: 'successions',
    expected_any_article: ['CC 505'],
    notes: "Testament olographe dactylographié — CC 505 — nullité absolue — CC 505 al. 1 : le testament olographe doit être ENTIÈREMENT ÉCRIT À LA MAIN par le testateur, daté et signé. CONDITION CUMULATIVE : les trois éléments (écriture manuscrite intégrale + date + signature) doivent être réunis. Un document imprimé ou dactylographié sur ordinateur, même signé et daté à la main, NE SATISFAIT PAS à l'exigence de l'écriture manuscrite intégrale — il est NUL DE PLEIN DROIT comme testament olographe. DISTINCTION : le testament authentique (notarié, CC 499) peut être rédigé mécaniquement, mais requiert la présence de 2 témoins + officier public. Un 'testament' imprimé signé = nul comme olographe ET nul comme authentique (pas de notaire). CONSÉQUENCES : si ce document est le seul testament, la succession s'ouvre AB INTESTAT (CC 457 ss.) — les héritiers légaux héritent selon leur rang (descendants, parents, etc.), sans tenir compte du document nul. Si le père avait aussi un testament authentique valide antérieur, c'est lui qui s'applique. DÉMARCHE : (1) vérifier s'il existe d'autres testaments (registre cantonal GR, notaires consultés antérieurement), (2) si aucun testament valide : succession ab intestat selon CC 457/CC 462 — les enfants héritent à parts égales. 'Testament imprimé ordinateur + daté et signé à la main + legs appartement sœur + économies 180k à moi ?' sans 'CC 505 : testament olographe doit être ENTIÈREMENT manuscrit — testament dactylographié est nul de plein droit même signé à la main' ni 'conséquence : succession ab intestat CC 457, enfants à parts égales, si pas d'autre testament valide'. Signal adversarial = héritiers croient que le document imprimé signé constitue un testament valide parce qu'il est daté et signé, ignorant que l'exigence d'écriture manuscrite intégrale est une condition de forme absolue dont le non-respect entraîne la nullité.",
  },

  // VIOLENCE / ATTEINTES AUX DROITS — CP 179ter : enregistrement clandestin d'une conversation, légalité selon qui enregistre
  {
    id: 'adv_violence_20',
    query: "Lors d'un déjeuner d'affaires, mon associé a filmé clandestinement notre conversation avec son téléphone posé à plat sur la table. Il vient d'utiliser cet enregistrement vidéo dans notre litige devant le tribunal civil. Je n'ai pas consenti à être filmé. Est-ce qu'il a commis une infraction ? Cette preuve peut-elle être admise par le tribunal ?",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CP 179ter', 'CC 28'],
    notes: "Enregistrement clandestin d'une conversation — CP 179ter / CC 28 — DISTINCTION FONDAMENTALE : CP 179ter s'applique à celui qui enregistre une conversation à laquelle il ne PREND PAS PART. En l'espèce, l'associé PARTICIPAIT à la conversation — il l'enregistrait avec son propre téléphone pendant qu'il y prenait part. CP 179ter (écoute clandestine) ne s'applique PAS aux participants qui enregistrent leur propre conversation — seul le tiers qui espionne une conversation sans y prendre part est punissable. MAIS CP 179quater peut s'appliquer si l'image d'une personne dans un lieu non public est captée sans consentement. ATTEINTE À LA PERSONNALITÉ CC 28 : l'utilisation de la vidéo pour nuire constitue une atteinte à la personnalité même si l'enregistrement lui-même n'est pas illicite (CC 28 al. 1). ADMISSIBILITÉ EN JUSTICE : le tribunal civil apprécie librement la valeur probante. CPC 152 al. 2 : les preuves obtenues illicitement ne sont prises en considération que si l'intérêt à la manifestation de la vérité l'emporte. Si l'enregistrement n'est pas strictement illicite (participant qui enregistre sa propre conversation), le tribunal peut l'admettre. ACTION POSSIBLE : CC 28a + action en interdiction d'utiliser la vidéo dans d'autres contextes + dommages-intérêts si préjudice documenté. 'Associé filmé clandestinement déjeuner + utilisé en justice + non-consentement ?' sans 'CP 179ter : ne s'applique pas aux participants — exclut celui qui enregistre sa propre conversation (tiers seulement)' ni 'CPC 152 al. 2 : admissibilité à la discrétion du juge + CC 28 atteinte personnalité pour usage dommageable'. Signal adversarial = personne filmée croit que tout enregistrement sans consentement exprès est illicite et que la preuve sera automatiquement exclue, ignorant la distinction entre participant et tiers dans CP 179ter.",
  },

  // SANTÉ — LAMal 3 / LAMal 6 : assurance maladie obligatoire dès le domicile en Suisse, rétroactivité 3 mois
  {
    id: 'adv_sante_23',
    query: "Je suis originaire de Bulgarie, j'ai emménagé à Zurich en octobre pour un emploi. Je savais que je devais m'assurer mais j'ai repoussé. En janvier, j'ai eu un accident et les urgences coûtent 3'800 CHF. Depuis je n'ai toujours pas de LAMal. On me dit que l'assureur peut refuser de me couvrir 'rétroactivement'. Est-ce vrai ?",
    canton: 'ZH',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 3', 'LAMal 6'],
    notes: "Assurance LAMal obligatoire — délai 3 mois et rétroactivité — LAMal 3 al. 1 : toute personne domiciliée en Suisse doit s'assurer auprès d'un assureur maladie — l'assurance est obligatoire dès l'établissement du domicile. LAMal 6 al. 1 : les personnes tenues de s'assurer doivent s'affilier dans les 3 mois suivant leur prise de domicile ou la naissance. LAMal 6 al. 2 : si la demande d'affiliation est faite dans le délai de 3 mois, la couverture est RÉTROACTIVE dès la prise de domicile — l'assuré est couvert dès son arrivée, même pour des soins antérieurs à l'affiliation. APRÈS 3 MOIS : l'assureur ne peut toujours pas refuser l'affiliation (obligation d'accepter tous les résidents — LAMal 5), mais la couverture ne sera rétroactive qu'au moment de la demande (pas depuis l'arrivée). SITUATION EN L'ESPÈCE : arrivée en octobre, accident en janvier = 3 mois se sont potentiellement écoulés (selon date exacte). Si la personne fait une demande NOW (en janvier/février), l'assureur est obligé de l'accepter. La couverture rétroactive depuis octobre dépend du dépassement ou non du délai de 3 mois. SANCTIONS : canton peut résilier et placer d'office auprès d'un assureur, avec frais supplémentaires. 'Bulgare Zurich octobre + accident urgences 3800 CHF + pas encore LAMal + assureur peut refuser rétroactivité ?' sans 'LAMal 6 : si demande dans les 3 mois = couverture rétroactive depuis le domicile' ni 'LAMal 5 : assureur NE PEUT PAS refuser l'affiliation (obligation d'accepter tous résidents Suisse) — mais rétroactivité dépend du délai 3 mois'. Signal adversarial = résident étranger croit que l'assureur peut refuser sa demande ou refuser la rétroactivité, ignorant l'obligation légale d'accepter tout résident et les règles de rétroactivité dépendant du délai de 3 mois.",
  },

  // CONSOMMATION — CPC 114 / CPC 243 : procédure simplifiée pour litiges <30'000 CHF, sans avocat obligatoire
  {
    id: 'adv_consommation_18',
    query: "Une entreprise de rénovation a mal refait ma salle de bain : carrelage fissuré, joints noirs après 3 mois, douche qui fuit. J'estime les réparations à 6'200 CHF. J'ai un devis d'un autre artisan. L'entreprise refuse tout remboursement. Je veux aller en justice mais mon voisin avocat dit que 'ça coûtera plus cher en avocats (3'000-5'000 CHF) que ce qu'on peut espérer récupérer'. Est-ce vrai ?",
    canton: 'BE',
    expected_domaine: 'consommation',
    expected_any_article: ['CPC 114', 'CPC 243'],
    notes: "Procédure simplifiée litiges <30'000 CHF — sans avocat obligatoire — CPC 114 : les litiges patrimoniaux dont la valeur litigieuse n'excède pas 30'000 CHF sont soumis à la procédure simplifiée. CPC 243 al. 2 : dans la procédure simplifiée, le tribunal établit d'office les faits et apprécie librement les preuves — il peut faire appel à des experts. CPC 247 : le tribunal interroge les parties personnellement, sans formalisme juridique strict. PAS D'AVOCAT OBLIGATOIRE : en procédure simplifiée, les parties peuvent se représenter elles-mêmes (et le plus souvent le font) — les frais d'avocat ne sont donc pas une nécessité. FRAIS DE JUSTICE (BE) : dépôt de la demande = quelques centaines de CHF (arrêté cantonal des émoluments BE, taux selon valeur litigieuse ≤ 10'000 → émolument forfaitaire ~400-600 CHF). PRÉREQUIS — CONCILIATION : avant de saisir le tribunal, il faut d'abord passer devant l'autorité de conciliation (CPC 197 ss.) — gratuite, rapide (~1-2 mois), permet souvent de trouver un accord. Si conciliation échoue : procès en procédure simplifiée. PREUVES : devis de l'autre artisan + photos + emails de réclamation restés sans suite = preuves suffisantes. 'Rénovation mal faite + 6200 CHF réparation estimée + avocat dit trop cher vs récupération ? ?' sans 'CPC 114/243 : procédure simplifiée <30'000 CHF — sans avocat obligatoire, frais de justice = quelques centaines de CHF' ni 'CPC 197 : conciliation gratuite obligatoire d'abord — souvent suffit à obtenir un accord'. Signal adversarial = consommateur croit que poursuivre en justice coûte toujours plus cher que le montant réclamé (frais d'avocat), ignorant que la procédure simplifiée ne requiert pas d'avocat et que les frais de tribunal pour 6'200 CHF sont marginaux.",
  },

  // ── WAVE 38 ─────────────────────────────────────────────────────────────────

  // BAIL — CO 266h : résiliation du bail en cas de faillite du locataire
  {
    id: 'adv_bail_40',
    query: "Mon locataire vient d'être déclaré en faillite par le tribunal. J'ai appris ça par un tiers — je n'ai reçu aucune communication officielle. Est-ce que le contrat de bail est automatiquement résilié ? Dois-je faire quelque chose de spécifique ou simplement attendre ?",
    canton: 'BE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 266h'],
    notes: "Faillite du locataire et bail — CO 266h — CO 266h al. 1 : en cas de faillite du locataire, le bailleur peut résilier le bail pour la prochaine échéance légale en donnant le délai de congé prévu par la loi. Le bail n'est PAS automatiquement résilié — le bailleur DOIT agir. CO 266h al. 2 : l'office des faillites peut exiger le maintien du bail si celui-ci est nécessaire à la liquidation. PROCÉDURE : le bailleur doit notifier la résiliation à l'office des faillites (qui représente le locataire failli), pas directement au locataire. DÉLAIS CO 266 : délai légal pour bail d'habitation = 3 mois pour fin d'un trimestre civil. GARANTIES : le bailleur est créancier de la masse en faillite pour les loyers dus (3e classe, LP 219) — priorité faible. 'Locataire en faillite + pas de communication officielle + bail automatiquement résilié ?' sans 'CO 266h : pas automatique — bailleur DOIT résilier activement, délai légal applicable' ni 'notification à l'office des faillites (pas au locataire), créancier 3e classe LP 219'. Signal adversarial = bailleur croit que la faillite entraîne résiliation automatique ou qu'il ne peut rien faire, ignorant CO 266h (droit de résiliation active avec délai légal) et la procédure via l'office des faillites.",
  },

  // HYBRIDE famille/civil — CC 117/118 : séparation de corps judiciaire comme alternative au divorce
  {
    id: 'adv_hybride_13',
    query: "Mon mari et moi sommes catholiques pratiquants — le divorce est inenvisageable pour nous pour des raisons religieuses. Mais notre mariage est devenu insupportable : violences verbales, comptes séparés depuis 2 ans, plus de vie commune. Existe-t-il en Suisse une solution légale qui protège nos droits patrimoniaux sans prononcer le divorce ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 117', 'CC 118'],
    notes: "Séparation de corps judiciaire — CC 117/118 — alternative au divorce pour raisons religieuses — CC 117 : le tribunal prononce la séparation de corps (pas le divorce) sur requête d'un époux qui invoque de justes motifs — régime légal alternatif au divorce. CC 118 : la séparation de corps produit les mêmes effets que le divorce pour les rapports patrimoniaux et la liquidation du régime matrimonial, SAUF que le mariage subsiste (pas de dissolution du lien conjugal). EFFETS : séparation des biens (CC 118 → liquidation du régime matrimonial), entretien, garde des enfants — tout comme le divorce. MARIAGE SUBSISTE : les époux restent mariés (obligations alimentaires mutuelles, droits héréditaires légaux, pas possibilité de se remarier). CONVERSION : CC 119 — après 2 ans de séparation de corps, chaque époux peut demander la conversion en divorce. RAISON INVOCABLE : 2 ans de vie séparée en ménages distincts + violences verbales = juste motif suffisant pour CC 117. 'Catholiques + divorce inenvisageable + violence verbale + comptes séparés 2 ans + protection patrimoniale ?' sans 'CC 117/118 : séparation de corps judiciaire — protège droits patrimoniaux comme le divorce mais mariage subsiste (pas dissolution lien conjugal)' ni 'MAIS CC 119 : après 2 ans de séparation de corps, reconversion possible en divorce à la demande d'un seul époux'. Signal adversarial = couple croyant il n'existe que divorce ou rien, ignorant CC 117/118 (séparation de corps = troisième voie juridique suisse protégeant patrimoine sans dissoudre mariage).",
  },

  // ASSURANCES — LCA 76/78 : bénéficiaire prédécédé dans une assurance-vie
  {
    id: 'adv_assurances_18',
    query: "Mon père avait une assurance-vie avec ma mère comme bénéficiaire. Ma mère est décédée 3 mois avant mon père. Mon père n'a jamais changé le bénéficiaire. À son décès, l'assureur dit que le capital de 180'000 CHF 'tombe dans la succession'. Ma sœur dit que ce capital ne devrait pas être inclus dans la succession. Qui a raison ?",
    canton: 'GE',
    expected_domaine: 'assurances',
    expected_any_article: ['LCA 76', 'LCA 78'],
    notes: "Bénéficiaire prédécédé assurance-vie — LCA 76/78 — LCA 76 al. 1 : le preneur d'assurance peut désigner un bénéficiaire — le capital lui revient directement à l'échéance, sans passer par la succession. LCA 78 al. 1 : si le bénéficiaire désigné décède AVANT l'assuré et qu'aucun autre bénéficiaire n'est désigné, le capital revient au preneur (ou à sa succession si le preneur est aussi l'assuré). SITUATION EN L'ESPÈCE : la mère (bénéficiaire) décède avant le père (assuré/preneur) — la désignation devient caduque. Le capital revient à la succession du père → à partager entre héritiers légaux (CC 457 ss.) ou testamentaires. L'ASSUREUR A RAISON : le capital de 180'000 CHF tombe dans la succession du père — soumis au droit successoral, aux réserves héréditaires, etc. EXCEPTION : si la désignation était 'mes héritiers' ou incluait une clause de substitution ('à défaut ma fille X'), le résultat serait différent. ACTION POSSIBLE : demander à l'assureur la copie exacte de la clause bénéficiaire — vérifier si clause de substitution ou désignation 'héritiers légaux'. 'Assurance-vie + mère bénéficiaire prédécédée + père n'a pas changé + capital 180k + succession ou pas ?' sans 'LCA 78 : si bénéficiaire prédécède et pas de clause de substitution → capital revient à la succession (assureur a raison)' ni 'VÉRIFIER : la clause bénéficiaire exacte — si clause 'héritiers légaux' ou substitution, résultat différent'. Signal adversarial = héritier croit que le capital assurance-vie échappe toujours à la succession (avantage fiscal/hors masse), ignorant que la désignation devient caduque si le bénéficiaire prédécède sans clause de substitution.",
  },

  // ASSURANCES/SOCIAL — LACI 17/30 : obligation de recherche d'emploi et formation non-autorisée
  {
    id: 'adv_social_15',
    query: "Je suis au chômage depuis 4 mois. Sans en parler à ma caisse, j'ai commencé une formation en ligne de 3 mois (comptabilité, CHF 1'200, 8h/semaine). La caisse vient de l'apprendre et me menace d'une suspension de 31 jours d'indemnités pour 'disponibilité insuffisante'. Est-ce légal ? Puis-je contester ?",
    canton: 'GE',
    expected_domaine: 'assurances',
    expected_any_article: ['LACI 17', 'LACI 30'],
    notes: "Formation pendant le chômage sans autorisation — LACI 17/30 — LACI 17 al. 1 : le chômeur est tenu d'être disponible pour le placement et d'accepter tout travail convenable — sa disponibilité doit être totale pendant les heures normales de travail. LACI 17 al. 3 : toute formation ou occupation à temps partiel doit être annoncée à la caisse et approuvée pour être compatible avec les indemnités. FORMATION NON AUTORISÉE : une formation suivie sans autorisation réduit la disponibilité → violation LACI 17 → sanction LACI 30. LACI 30 al. 1 let. d : suspension du droit aux indemnités si l'assuré n'a pas respecté ses obligations. DURÉE : LACI 30 al. 3 + OACI 45 : 1-15 jours (légère), 16-30 jours (grave), 31-60 jours (très grave) — 31 jours = sanction 'grave'. CONTESTATION : la suspension de 31 jours pour formation de 8h/semaine est potentiellement disproportionnée — une formation de 8h/semaine ne rend pas indisponible sur le marché du travail. ARGUMENT : demander révision interne (LACI 100 → délai 30 jours) en argumentant disponibilité préservée (8h = 1 jour/semaine, formation compatible avec recherches). Jurisprudence : ATF 122 V 265 — disponibilité doit être effective, mais formations courtes et partielles ne compromettent pas nécessairement le placement. 'Chômage + formation comptabilité 8h/semaine non autorisée + suspension 31 jours menacée ?' sans 'LACI 17 : formation DOIT être autorisée par caisse — violation si non annoncée' ni 'MAIS LACI 30 + OACI 45 : 31 jours pour 8h/semaine potentiellement disproportionné — délai contestation 30 jours, argument disponibilité préservée'. Signal adversarial = chômeur croit que toute formation améliore son dossier et est tacitement autorisée, ignorant l'obligation d'annonce LACI 17 et le risque de suspension LACI 30.",
  },

  // CIRCULATION — LCR 62/92 : contravention parking laissée sur pare-brise, délai de paiement et contestation
  {
    id: 'adv_circulation_17',
    query: "Je suis revenu à ma voiture et j'ai trouvé une contravention de parking CHF 60 sur le pare-brise à Zurich. Aucun policier présent. La contravention porte un numéro de référence mais pas mon nom. Puis-je l'ignorer ? Si je ne paie pas, que se passe-t-il ? Qui prouve que c'était bien moi qui conduisais ?",
    canton: 'ZH',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 62', 'LCR 92'],
    notes: "Contravention parking — LCR 62/92 — procédure et charge de la preuve — LCR 90/92 : les infractions aux règles de stationnement sont des contraventions punissables. Amende d'ordre AOA (Loi sur les amendes d'ordre) : les infractions légères (arrêt/stationnement interdit simple) → amende d'ordre forfaitaire sans procédure pénale si payée dans le délai. REGISTRE DES VÉHICULES : via le numéro de plaque, l'autorité identifie le DÉTENTEUR du véhicule (pas le conducteur). RESPONSABILITÉ DU DÉTENTEUR : LCR 93 — le détenteur est responsable de la tenue en règle de son véhicule. Pour contraventions parking, c'est le DÉTENTEUR qui est contacté, pas nécessairement le conducteur au moment. CHARGE DE LA PREUVE : si le détenteur n'était pas au volant, il peut désigner le conducteur effectif — sinon c'est lui qui est poursuivi. IGNORER LA CONTRAVENTION : amende d'ordre non payée → relance, puis mise en demeure, puis procédure pénale ordinaire + frais + casier possible. CONTESTATION : possible (LCR 90 ss.) — droit de réponse par écrit dans le délai indiqué. 'Contravention parking pare-brise + pas de policier + pas mon nom + peuvent-ils prouver que c'était moi ?' sans 'LCR + AOA : détenteur du véhicule identifié via plaque — lui incombe de désigner le conducteur sinon présumé responsable' ni 'ignorer → procédure pénale + frais supplémentaires + possibilité casier'. Signal adversarial = automobiliste croit que l'absence de son nom sur la contravention et du policier à l'heure du PV lui offre un bouclier, ignorant que le détenteur est identifiable via les plaques et présumé responsable.",
  },

  // ENTREPRISE — CO 784/786 : sortie forcée d'un associé d'une Sàrl
  {
    id: 'adv_entreprise_17',
    query: "Je suis associé minoritaire dans une Sàrl (30% des parts). Les deux associés majoritaires (70%) ont voté pour m'exclure de la société lors d'une assemblée des associés — ils disent avoir ce droit dans les statuts. Ils veulent me racheter mes parts à la valeur nominale (CHF 3'000 pour 30% d'une Sàrl qui vaut selon moi plus de 500'000 CHF). Est-ce légal ?",
    canton: 'ZH',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 784', 'CO 786'],
    notes: "Exclusion associé Sàrl et prix de rachat — CO 784/786 — CO 784 : l'assemblée des associés peut exclure un associé pour de justes motifs (CO 784 al. 1) — pas arbitrairement. Les statuts peuvent prévoir des cas d'exclusion supplémentaires mais ne peuvent pas supprimer les protections légales. CO 786 al. 1 : en cas de sortie (volontaire ou forcée), l'associé a droit à une indemnité équitable représentant la VALEUR RÉELLE de ses parts (pas la valeur nominale). VALEUR RÉELLE ≠ VALEUR NOMINALE : la jurisprudence (ATF 120 II 259) établit que l'indemnité doit refléter la valeur vénale des parts — basée sur la valeur substantielle + valeur de rendement de la société. RACHAT À LA VALEUR NOMINALE = ILLÉGAL si la valeur réelle est supérieure. PROCÉDURE D'EXCLUSION : action judiciaire requise (CO 784 al. 2) — les majoritaires ne peuvent pas exclure par simple vote si pas prévu dans statuts + justes motifs requis. ACTION : contester l'exclusion ET/OU l'indemnité proposée devant le tribunal civil (délai 2 mois CO 784 al. 3). Expert judiciaire pour établir la valeur réelle. 'Associé minoritaire 30% Sàrl + exclusion par vote + rachat à valeur nominale 3000 CHF vs valeur réelle 500k ?' sans 'CO 786 : indemnité DOIT être la valeur réelle (ATF 120 II 259) — rachat à valeur nominale illégal si valeur réelle supérieure' ni 'CO 784 : exclusion nécessite justes motifs + action judiciaire — délai contestation 2 mois'. Signal adversarial = associé minoritaire croit que les statuts permettent tout et que le prix imposé est légal, ignorant CO 786 (indemnité à valeur réelle impérative) et le droit de contester l'exclusion et l'évaluation.",
  },

  // CONSOMMATION — CO 40a/197 : vente aux enchères internet et droit de rétractation
  {
    id: 'adv_consommation_19',
    query: "J'ai acheté un téléphone sur Ricardo.ch (enchères internet) pour CHF 380. En le recevant, je constate qu'il est cassé intérieurement — le vendeur l'avait décrit comme 'état impeccable'. Le vendeur (particulier) refuse tout retour en disant que 'les ventes aux enchères sont définitives'. Est-ce qu'il a raison ? Ai-je un recours ?",
    canton: 'VD',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 40a', 'CO 197'],
    notes: "Enchères internet particulier — CO 40a / CO 197 — droit de rétractation et garantie des défauts — CO 40a (droit de révocation) : s'applique aux contrats conclus à distance avec un PROFESSIONNEL — PAS aux ventes entre particuliers. Vendeur particulier sur Ricardo → CO 40a NE S'APPLIQUE PAS : pas de droit de rétractation légal de 14 jours. MAIS CO 197 (garantie des défauts) : s'applique à toute vente, y compris entre particuliers — CO 197 al. 1 : le vendeur répond envers l'acheteur des défauts qui diminuent notablement la valeur ou l'usage prévu de la chose. 'Cassé intérieurement' alors que décrit 'état impeccable' = défaut caché + dol possible (CO 198 exclusion garantie ne couvre pas le dol). CO 203 : le vendeur qui a dissimulé un défaut ne peut pas se prévaloir d'une clause excluant la garantie. RECOURS : mise en demeure écrite → demande de réduction de prix (action rédhibitoire, CO 205) ou résolution du contrat + dommages-intérêts. DÉLAI : CO 201 — signalement du défaut immédiatement après découverte + action dans le délai de prescription. 'Téléphone Ricardo.ch particulier + cassé intérieurement + décrit impeccable + enchères définitives ?' sans 'CO 40a : droit révocation = B2C uniquement, pas particulier→particulier' ni 'CO 197 + 203 : garantie des défauts s'applique aux particuliers + dol exclut clause limitation garantie'. Signal adversarial = acheteur croit avoir droit de rétractation (CO 40a) sur une vente aux enchères entre particuliers, ou au contraire accepte le 'définitif' sans connaître la garantie des défauts CO 197.",
  },

  // SANTÉ — LAMal 41/OAMal 93a : urgence médicale avec médecin HMO hors réseau
  {
    id: 'adv_sante_24',
    query: "J'ai un modèle HMO (médecin de famille obligatoire, primes réduites). Pendant mes vacances à Davos, j'ai eu une urgence cardiaque et j'ai été traité à l'hôpital cantonal de Coire (hors de mon réseau HMO). L'assureur refuse maintenant de rembourser en disant que je 'n'ai pas respecté le modèle'. Est-ce qu'il peut refuser ?",
    canton: 'ZH',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 41', 'OAMal 93a'],
    notes: "Urgence médicale HMO hors réseau — LAMal 41 / OAMal 93a — LAMal 41 al. 1 : l'assuré a le libre choix du fournisseur de prestations parmi les fournisseurs admis SAUF si le modèle alternatif (HMO, médecin de famille) prévoit une restriction. OAMal 93a : les modèles alternatifs peuvent restreindre le choix, MAIS les urgences constituent une exception légale — l'assureur doit rembourser les soins urgents même hors réseau. DÉFINITION URGENCE : soins médicalement nécessaires qui ne peuvent pas être différés (urgence cardiaque = urgence indiscutable). REMBOURSEMENT URGENCE HORS RÉSEAU : LAMal 41 al. 1bis + OAMal 93a — l'assureur rembourse les urgences selon les tarifs en vigueur, même dans un modèle HMO restrictif. REFUS DE REMBOURSEMENT = ILLÉGAL pour urgences avérées. PROCÉDURE : contester par écrit avec les documents médicaux attestant de l'urgence → si refus maintenu : Ombudsman LAMal ou Tribunal cantonal des assurances (délai 30 jours). 'HMO + urgence cardiaque Davos + hôpital hors réseau + assureur refuse remboursement ?' sans 'OAMal 93a : urgences TOUJOURS couvertes même hors réseau HMO — refus illégal' ni 'procédure : contestation écrite + documents médicaux + Ombudsman LAMal si refus maintenu'. Signal adversarial = assuré HMO croit que son modèle alternatif l'empêche d'être remboursé pour toute consultation hors réseau, ignorant l'exception légale impérative pour les urgences.",
  },

  // FAMILLE — CC 182/184 : contrat de mariage et intervention notariale obligatoire
  {
    id: 'adv_famille_34',
    query: "Avant notre mariage dans 3 mois, mon futur mari et moi voulons convenir que ce qu'on apporte chacun dans le mariage reste notre propriété personnelle si on divorce. On a rédigé un document qu'on a tous les deux signé. Est-ce que ce document est valable légalement en Suisse ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 182', 'CC 184'],
    notes: "Contrat de mariage — CC 182/184 — forme authentique obligatoire — CC 182 al. 1 : les époux peuvent, avant ou pendant le mariage, conclure un contrat de mariage pour modifier le régime matrimonial légal (participation aux acquêts) ou choisir un autre régime. CC 184 : le contrat de mariage doit être passé en la FORME AUTHENTIQUE (acte notarié) — signé devant notaire et instrumenté par lui. DOCUMENT SIGNÉ ENTRE EUX = NUL : un simple document signé par les deux parties, sans intervention notariale, est nul et sans effet juridique pour modifier le régime matrimonial. RÉGIME SOUHAITÉ : 'ce qu'on apporte reste notre propriété' → séparation des biens totale ou régime de la participation aux acquêts avec exclusion des biens propres — les deux nécessitent un acte notarié (CC 184). COÛT : acte notarié en VD → CHF 300-800 selon étude notariale. DÉLAI : possible avant OU pendant le mariage (CC 182 al. 1). ACTION : consulter un notaire vaudois, expliquer l'objectif → il instrumentera le contrat dans la forme authentique requise. 'Futurs mariés + accord patrimonial + document signé ensemble + valide en Suisse ?' sans 'CC 184 : contrat de mariage DOIT être un acte notarié — document signé entre eux = NUL' ni 'CC 182 : possible avant ou pendant mariage, régime séparation biens = 100% légal mais forme authentique obligatoire'. Signal adversarial = futurs mariés croient qu'un accord écrit bilatéral signé suffit pour modifier le régime matrimonial, ignorant l'exigence de forme authentique CC 184.",
  },

  // SUCCESSIONS — CC 626/628 : rapport des donations à la succession (libéralités rapportables)
  {
    id: 'adv_successions_19',
    query: "Mon père est décédé. De son vivant, il avait donné 80'000 CHF à mon frère il y a 5 ans pour l'aider à acheter un appartement. À moi il n'a rien donné. La succession est de 120'000 CHF. Mon frère dit que la donation de 80'000 CHF 'c'est du passé' et qu'on partage juste les 120'000 CHF. Est-ce exact ?",
    canton: 'GE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 626', 'CC 628'],
    notes: "Rapport des libéralités à la succession — CC 626/628 — CC 626 al. 1 : les héritiers légaux (enfants du défunt) sont tenus de rapporter à la succession les libéralités (donations) reçues du défunt de son vivant, pour que le partage s'établisse sur l'ensemble des biens. CC 626 al. 2 : sauf si le défunt a expressément dispensé le donataire du rapport (disposition testamentaire ou déclaration écrite au moment de la donation). CC 628 : le rapport s'effectue en valeur (pas en nature) au moment du décès — si l'appartement a pris de la valeur, c'est la valeur au moment du rapport qui compte. SITUATION EN L'ESPÈCE : 80'000 CHF donné au frère il y a 5 ans → rapportable à la succession SAUF dispense expresse du père. CALCUL AVEC RAPPORT : masse de calcul = 120'000 (succession) + 80'000 (rapport frère) = 200'000 CHF. Part légale de chaque enfant = 100'000 CHF. Frère reçoit : 100'000 - 80'000 = 20'000 CHF. Sœur/narrateur reçoit : 100'000 CHF. VÉRIFIER : si le père a rédigé un testament ou fait une déclaration dispensant le frère du rapport → changer le calcul. 'Père décédé + don 80k au frère il y a 5 ans + succession 120k + frère dit c'est du passé ?' sans 'CC 626 : donation rapportable à la succession sauf dispense expresse du défunt' ni 'calcul masse avec rapport : 200k total → 100k chacun → frère ne reçoit que 20k sur les 120k'. Signal adversarial = héritier lésé croit que les donations antérieures sont 'prescrites' ou hors-succession, ignorant CC 626 (rapport obligatoire des libéralités entre héritiers légaux sauf dispense expresse).",
  },

  // ========== WAVE 39 — angles inédits, 10 domaines ==========

  // BAIL — CO 264 : bail à durée déterminée, sortie anticipée par substitution de locataire
  {
    id: 'adv_bail_41',
    query: "J'ai signé un bail de 3 ans (durée fixe) il y a 18 mois. Je dois déménager à Berne pour un nouveau travail. Mon bailleur dit que je suis obligé de payer les 18 mois restants car c'est un bail à durée déterminée. Est-ce que je suis vraiment coincé ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 264', 'CO 266'],
    notes: "Bail à durée déterminée — CO 264 — sortie anticipée par présentation d'un remplaçant solvable — CO 264 al. 1 : si le locataire restitue les locaux avant le terme fixé, il reste tenu des loyers jusqu'au moment où le bail peut prendre fin ou a été repris par un tiers aux mêmes conditions. MYTHE : bail à durée déterminée = on ne peut jamais partir avant l'échéance. RÉALITÉ CO 264 : le locataire peut se libérer en présentant au bailleur un candidat locataire solvable, prêt à reprendre le bail aux mêmes conditions. Si le bailleur refuse un remplaçant acceptable sans motif valable, le locataire est libéré. PROCÉDURE : proposer par écrit un/des remplaçants solvables, délai raisonnable au bailleur pour se prononcer. DISTINCTION CO 266 : CO 266 = résiliation ordinaire (préavis + terme, bail à durée indéterminée). CO 264 = sortie anticipée bail fixe via substitution. Le locataire NE DOIT PAS payer 18 mois d'avance si un remplaçant convenable est trouvé. 'Bail 3 ans durée fixe + déménagement professionnel + bailleur exige 18 mois restants ?' sans 'CO 264 : sortie anticipée possible par présentation remplaçant solvable aux mêmes conditions — bailleur ne peut pas refuser sans motif valable'. Signal adversarial = locataire croit être totalement bloqué par la durée fixe du bail, ignorant la possibilité légale de substitution CO 264.",
  },

  // TRAVAIL — CO 327a/327b : remboursement formation par l'employé, validité et limites
  {
    id: 'adv_travail_41',
    query: "Mon employeur m'a payé un CAS en management (CHF 9'200) avec une clause dans le contrat : si je pars dans les 3 ans, je dois rembourser 100% de la formation. Je veux partir après 14 mois. La clause est-elle valable ? Dois-je vraiment rembourser 9'200 CHF ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 327a', 'CO 327b'],
    notes: "Remboursement formation — CO 327a/327b — validité et limites — CO 327a al. 1 : si l'employeur expose des frais de formation ou de perfectionnement qui ne sont pas requis pour l'exécution du travail convenu, l'employé peut être tenu de rembourser si la relation de travail prend fin dans un délai déterminé. VALIDITÉ : la clause doit être écrite, le délai de rétention doit être proportionnel à la durée et à l'utilité de la formation. CO 327b : si l'employé est licencié sans faute de sa part, la clause de remboursement devient inopposable — l'employé ne doit rien. PROPORTIONNALITÉ TF : le Tribunal fédéral admet des clauses de remboursement si le délai de retention (3 ans) est raisonnable par rapport à la formation (CAS 1 an). DÉGRESSIVITÉ : les tribunaux appliquent souvent une réduction proportionnelle au temps déjà écoulé (14/36 mois écoulés → ~ 39% du montant dû, soit ~3'600 CHF, pas 9'200 CHF). CO 341 : l'employé ne peut pas renoncer pendant le rapport de travail à ses droits légaux impératifs, mais les clauses de remboursement ne sont pas des droits légaux impératifs — elles sont valables si non abusives. 'CAS 9200 CHF + clause remboursement 3 ans + départ à 14 mois ?' sans 'CO 327b : licenciement sans faute = clause inopposable' ni 'dégressivité judiciaire fréquente : 14 mois/36 mois = réduction proportionnelle possible, pas remboursement intégral'. Signal adversarial = employé croit qu'il doit rembourser 100% du montant, ignorant la dégressivité et l'inopposabilité si licencié sans faute.",
  },

  // DETTES — CO 169 : exceptions opposables au cessionnaire, prescription malgré cession
  {
    id: 'adv_dettes_36',
    query: "J'avais une dette de 2'800 CHF chez un dentiste en 2013. Je n'ai jamais reçu de rappel. Maintenant en 2026 je reçois une lettre d'une société de recouvrement 'RecoveryPlus SA' qui dit avoir racheté cette créance et me réclame 4'600 CHF avec intérêts. Dois-je payer ?",
    canton: 'GE',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 127', 'CO 169'],
    notes: "Cession de créance et opposabilité exceptions — CO 169 / CO 127 — CO 169 al. 1 : le débiteur peut opposer au cessionnaire (la société de recouvrement) toutes les exceptions qu'il avait contre le cédant (le dentiste) au moment où la cession lui a été notifiée — y compris LA PRESCRIPTION. CO 127 : la dette de soins dentaires est une créance civile ordinaire, prescription de 5 ans (CO 128 pour honoraires médecins = 5 ans également). CALCUL : dette 2013, réclamée 2026 = 13 ans écoulés → PRESCRIPTION ACQUISE. La cession de la créance à une société de recouvrement n'efface pas la prescription, ni ne fait courir un nouveau délai. Les intérêts calculés sur une dette prescrite sont aussi prescrits. POINT CLÉ : la prescription doit être INVOQUÉE par le débiteur (CO 142) — elle ne s'applique pas d'office par le juge. Le débiteur doit répondre en invoquant la prescription par écrit. ATTENTION : si le débiteur paie ou reconnaît la dette (même partiellement), il renonce implicitement à la prescription (CO 141 al. 1). 'Dentiste 2013 + 13 ans sans contact + société recouvrement réclame 4600 CHF ?' sans 'CO 127/128 : prescription 5 ans déjà acquise' ni 'CO 169 : invoquer prescription contre le cessionnaire = opposable exactement comme contre le créancier initial'. Signal adversarial = débiteur croit que la cession de la créance à une société de recouvrement repart à zéro et que les 13 ans n'ont pas d'effet, ignorant CO 169 (mêmes exceptions opposables au cessionnaire).",
  },

  // FAMILLE — CC 648/649 : copropriété entre concubins, quotes-parts réelles et dissolution
  {
    id: 'adv_famille_35',
    query: "Mon compagnon et moi avons acheté un appartement ensemble (lui a apporté 120'000 CHF, moi 40'000 CHF). Nous ne sommes pas mariés. Après 6 ans, nous nous séparons. Il dit que c'est 50/50 car 'on était en couple'. Ai-je droit à seulement 25% ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 646', 'CC 649'],
    notes: "Copropriété concubinage — CC 646/648/649 — quotes-parts réelles et dissolution — CC 646 al. 1 : la copropriété est constituée selon les quotes-parts inscrites au registre foncier (ou selon l'acte d'achat si non inscrit). CC 646 al. 2 : sauf disposition contraire, les parts sont présumées ÉGALES — mais cette présomption est réfutable par preuve. PREUVE DES QUOTES-PARTS : l'acte notarié d'achat ou les contrats entre parties définissent les quotes-parts réelles. Si le registre foncier indique 75%/25% (ou 3/4 et 1/4), c'est cette répartition qui prévaut, pas le mythe du 50/50 pour les couples. FINANCEMENT : 120k vs 40k = ratio 3:1 → quotes-parts 75%/25% si inscrit conformément. DISSOLUTION CC 649 : l'un des copropriétaires peut demander le partage ou la vente judiciaire si pas d'accord. CO 530/544 (société simple) : si pas d'acte de copropriété formel, la société simple entre concubins = liquidation selon apports réels. MYTHE : séparation d'un couple non marié = partage à 50/50 automatiquement. RÉALITÉ : les quotes-parts de copropriété suivent les parts inscrites/l'investissement réel. 'Appartement concubins + 120k vs 40k + séparation + compagnon dit 50/50 ?' sans 'CC 646 : quotes-parts de copropriété réelles = suivent l'acte/le financement réel, pas présumées 50/50 si preuve du contraire' ni 'CC 649 : si pas d'accord, demande de partage judiciaire possible'. Signal adversarial = conjointe de fait croit qu'elle n'a droit qu'à 25% alors que la clarification légale permet de revendiquer la quote-part réelle selon l'investissement documenté.",
  },

  // ÉTRANGERS — LEI 44/52 : regroupement familial, fratrie exclue, limites légales
  {
    id: 'adv_etrangers_30',
    query: "Je vis en Suisse depuis 12 ans avec un permis C. Mon frère de 28 ans vit encore en Tunisie et aimerait venir me rejoindre en Suisse. J'ai un appartement assez grand. Y a-t-il un regroupement familial possible pour un frère adulte ?",
    canton: 'GE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 44', 'LEI 42'],
    notes: "Regroupement familial — LEI 42/44 — limites légales (fratrie exclue) — LEI 42 (regroupement familial pour ressortissants suisses) et LEI 44 (pour titulaires permis C) définissent limitativement les membres de la famille pouvant bénéficier du regroupement familial : conjoint, partenaire enregistré, enfants mineurs de moins de 18 ans (avec délais stricts LEI 47), et dans des cas très limités les parents âgés à charge. FRATRIE ADULTE EXCLUE : un frère ou une sœur adulte (28 ans) ne fait PAS partie des membres de la famille éligibles au regroupement familial en droit ordinaire, que le demandeur ait un permis C ou même la nationalité suisse. LEI 52 : regroupement familial pour cas de rigueur exceptionnels (dépendance économique et fonctionnelle complète) — conditions très strictes, rarement accordées pour la fratrie adulte indépendante. ALTERNATIVES : permis de travail ordinaire si emploi trouvé (contingent), formation universitaire (permis étudiant), pas de voie 'regroupement familial'. MYTHE : avec un permis C depuis longtemps, on peut faire venir toute sa famille. RÉALITÉ : le regroupement familial est strictement limité aux membres du noyau familial immédiat. 'Permis C 12 ans + frère 28 ans Tunisie + appartement grand ?' sans 'LEI 44 : regroupement familial limité conjoint/enfants mineurs — fratrie adulte EXCLUE' ni 'alternatives : permis travail ou formation, pas regroupement familial'. Signal adversarial = titulaire permis C croit que sa longue résidence et son logement lui permettent de faire venir sa fratrie adulte par regroupement familial.",
  },

  // SUCCESSIONS — CC 635 : droit de préemption légal entre cohéritiers lors cession part
  {
    id: 'adv_successions_20',
    query: "Mon frère et moi avons hérité en parts égales de la maison de nos parents. Mon frère veut vendre sa part à son ami pour 180'000 CHF. Il m'a dit que je n'ai rien à dire là-dessus. Est-ce que j'ai un droit de priorité pour racheter sa part ?",
    canton: 'NE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 635', 'CC 636'],
    notes: "Droit de préemption légal entre cohéritiers — CC 635/636 — CC 635 al. 1 : chaque héritier copropriétaire d'un immeuble héréditaire a un droit de préemption légal si l'un des cohéritiers veut aliéner sa quote-part à un tiers. CC 635 al. 2 : le cohéritier souhaitant exercer son droit de préemption doit le faire dans un délai de 3 mois dès qu'il a eu connaissance de la vente. CC 636 : le prix d'exercice du droit de préemption est le prix stipulé avec le tiers (180'000 CHF dans ce cas). MYTHE : une fois la succession ouverte, chaque héritier peut vendre librement sa part à qui il veut. RÉALITÉ CC 635 : le cohéritier a un droit de préemption LÉGAL (pas seulement contractuel) sur la quote-part de l'autre cohéritier. Ce droit de préemption s'exerce aux conditions du marché (même prix que l'acheteur tiers). PROCÉDURE : notification formelle de l'exercice du droit de préemption dans 3 mois → rachat aux conditions de l'offre tiers. CC 682 : droit de préemption légal s'applique aussi aux copropriétaires non-héritiers d'un immeuble. 'Frère veut vendre sa part héritage maison 180k à un ami + peut-on l'en empêcher ?' sans 'CC 635 : droit de préemption légal du cohéritier dans 3 mois, au même prix offert par le tiers' ni 'CC 636 : exercice au prix du marché (180k) — pas de décote'. Signal adversarial = cohéritier ignore qu'il dispose d'un droit de préemption légal de CC 635 et croit qu'il ne peut pas empêcher la vente à un tiers.",
  },

  // VIOLENCE — CP 177 : injure par voie privée (WhatsApp), poursuivable
  {
    id: 'adv_violence_21',
    query: "Mon ex-beau-frère m'envoie depuis 3 mois des messages WhatsApp très insultants ('ordure', 'moins que rien', 'je vais te détruire'). Quand j'ai demandé à déposer plainte, le policier m'a dit que c'est une conversation privée et qu'il ne peut rien faire. Est-ce vrai ?",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CP 177', 'CP 180'],
    notes: "Injure par voie privée — CP 177 / CP 180 — CP 177 al. 1 : celui qui, d'une autre manière que prévu à CP 173 et 174, aura attaqué autrui dans son honneur sera puni d'une peine pécuniaire de 90 jours-amendes au plus. CP 177 s'applique INDÉPENDAMMENT du caractère privé ou public du message — une insulte sur WhatsApp (canal privé) constitue une injure au sens de CP 177 si elle atteint la dignité de la personne. CP 180 : menaces ('je vais te détruire') peuvent constituer une menace (CP 180) si l'auteur cherche à inspirer une crainte sérieuse. IMPORTANT : CP 177 (injure) est une infraction poursuivie SUR PLAINTE (pas d'office) — la victime doit déposer plainte dans 3 mois dès la connaissance de l'auteur. CP 180 (menaces) peut être d'office si menaces graves. PREUVE : captures d'écran suffisent comme preuve (art. 173 CPC sur pièces). POLICIER A TORT : la nature privée de WhatsApp n'immunise pas l'auteur des insultes — l'injure vise la dignité de la personne, pas la publicité de l'acte. 'Messages WhatsApp insultants + menaces + policier dit conversation privée = rien à faire ?' sans 'CP 177 : injure par canal privé (WhatsApp) = infraction punissable, plainte dans 3 mois' ni 'CP 180 : menaces = infraction distincte, captures écran = preuve recevable'. Signal adversarial = victime croit que les insultes par WhatsApp sont hors-droit pénal car 'conversation privée', ignorant CP 177 (injure) et CP 180 (menaces).",
  },

  // SANTÉ — LAMal 25/OAMal 35 : ostéopathe non médecin, non remboursé assurance de base
  {
    id: 'adv_sante_25',
    query: "Je souffre de lombalgies chroniques. Mon médecin m'a dit d'essayer l'ostéopathie. Mon ostéopathe n'est pas médecin (pas de numéro RCC). J'ai payé 130 CHF la séance. Mon assurance de base LAMal refuse de rembourser. Ont-ils raison ?",
    canton: 'VD',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 25', 'OAMal 35'],
    notes: "Ostéopathe non médecin — LAMal 25 / OAMal 35 — OAMal 35 dresse la liste exhaustive des fournisseurs de prestations dont les prestations sont remboursées par l'assurance de base LAMal : médecins, pharmaciens, hôpitaux, sages-femmes, infirmiers, physiothérapeutes, ergothérapeutes, nutritionnistes, optométristes, chiropraticiens. OSTÉOPATHE NON MÉDECIN = NON DANS LA LISTE : les ostéopathes sans titre médecin (sans numéro RCC/numéro GLN de médecin reconnu LAMal) ne sont PAS des fournisseurs de prestations reconnus pour l'assurance de base. Remboursement IMPOSSIBLE par l'assurance de base, même avec prescription médicale (la prescription ne crée pas le droit au remboursement si le prestataire n'est pas reconnu). EXCEPTION : si l'ostéopathe est aussi médecin diplômé reconnu LAMal, ses prestations entrent dans LAMal. ASSURANCES COMPLÉMENTAIRES (LCA) : les assurances complémentaires (lamal complémentaires, médecines alternatives) peuvent couvrir l'ostéopathie — vérifier son contrat. PHYSIOTHÉRAPEUTE reconnu LAMal : alternative remboursable pour lombalgies. 'Ostéopathe non médecin + 130 CHF séance + assurance de base refuse ?' sans 'OAMal 35 : ostéopathe sans titre médecin = non reconnu comme fournisseur de prestations LAMal — refus assurance LÉGAL' ni 'assurance complémentaire LCA : vérifier couverture médecines alternatives'. Signal adversarial = patient croit que la prescription médicale suffit pour que n'importe quel thérapeute soit couvert par l'assurance de base, ignorant OAMal 35 (liste fermée des fournisseurs reconnus).",
  },

  // ENTREPRISE — CO 568/569 : sortie société en nom collectif, responsabilité 5 ans dettes existantes
  {
    id: 'adv_entreprise_18',
    query: "J'ai une société en nom collectif avec mon associé depuis 7 ans (plomberie). Je veux me retirer. Mon notaire dit que même si je sors de la société, je reste responsable des dettes. Est-ce vrai ? Pendant combien de temps ?",
    canton: 'FR',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 568', 'CO 569'],
    notes: "Sortie société en nom collectif — CO 568/569 — responsabilité résiduelle 5 ans — CO 568 al. 1 : la responsabilité des associés d'une société en nom collectif est ILLIMITÉE et SOLIDAIRE pour toutes les dettes de la société. CO 568 al. 3 : l'associé qui sort reste responsable des dettes EXISTANTES au moment de son départ pendant 5 ans à compter de la radiation au registre du commerce (RC). PROCÉDURE OBLIGATOIRE CO 569 : pour que la sortie soit opposable aux tiers, elle doit être inscrite au registre du commerce (modification de la raison sociale). SANS INSCRIPTION RC : l'associé sortant reste pleinement responsable vis-à-vis des créanciers qui ne savaient pas qu'il était sorti. DETTES FUTURES : après la radiation + 5 ans, l'ex-associé n'est PAS responsable des nouvelles dettes contractées après son départ. DETTES PRÉEXISTANTES : responsable pendant 5 ans depuis la radiation. DISSOLUTION vs SORTIE : si les 2 associés partent = dissolution et liquidation de la société. CAPITAL DE LIQUIDATION : chaque associé reçoit sa part après remboursement des créanciers. 'Société en nom collectif + sortie + responsabilité des dettes ?' sans 'CO 568 al. 3 : responsabilité résiduelle 5 ans sur dettes existantes depuis radiation RC' ni 'CO 569 : inscription RC obligatoire pour opposabilité aux tiers'. Signal adversarial = associé croit que sa sortie met fin immédiatement à toute responsabilité, ignorant CO 568 al. 3 (5 ans de responsabilité résiduelle pour dettes préexistantes).",
  },

  // VOISINAGE — CC 684 : immissions négatives (privation lumière/vue) hors champ CC 684
  {
    id: 'adv_voisinage_26',
    query: "Mon voisin a construit une véranda vitrée de 4 mètres de haut juste sur la limite de propriété. Ça coupe toute la lumière de mon salon et de mon jardin. Le commune dit que c'est légal car il a eu un permis. Puis-je agir sur la base des immissions excessives CC 684 ?",
    canton: 'VD',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 684', 'CC 679'],
    notes: "Immissions négatives — CC 684 / CC 679 — privation de lumière et de vue — CC 684 al. 1 : le propriétaire est tenu, dans l'exercice de son droit, notamment en cas d'exploitation industrielle de sa propriété, de s'abstenir de tout excès au détriment des fonds voisins. CC 684 vise les IMMISSIONS POSITIVES excessives (bruit, fumée, odeur, vibrations, poussière, vapeur) qui émanent du fonds voisin et affectent positivement le fonds voisin. IMMISSIONS NÉGATIVES (privation de lumière, de vue, de panorama) : EN PRINCIPE hors champ d'application de CC 684 selon la jurisprudence dominante du TF — CC 684 ne protège pas contre la perte de vue ou d'ensoleillement causée par une construction légale. CC 679/680 : action en responsabilité pour dommage causé par dépassement du droit de propriété — limites à la construction fixées par le droit cantonal des constructions. PERMIS DE CONSTRUIRE : la légalité administrative (permis) n'exclut pas l'action civile CC 679 si les dommages dépassent les atteintes normales du voisinage. DISTANCES LÉGALES : recours possible si la véranda viole les distances de construction cantonales VD (règlement cantonal ou communal). RÉALISME : action CC 684 pour perte d'ensoleillement = difficile/rare; recours droit des constructions = plus efficace. 'Véranda voisin + perte lumière/vue + permis accordé + CC 684 immissions excessives ?' sans 'CC 684 : immissions négatives (perte lumière/vue) = hors champ d'application en règle générale — action droit des constructions plus adaptée' ni 'CC 679 : vérification distances légales cantonales VD = voie plus efficace'. Signal adversarial = citoyen croit que CC 684 (immissions excessives) couvre aussi la privation de lumière et de vue, ignorant que CC 684 vise les immissions positives et que les immissions négatives relèvent du droit des constructions.",
  },

  // ========== WAVE 40 — angles inédits, 10 domaines ==========

  // FISCAL — LIFD 26 : déduction home office salarié (non déductible si bureau disponible à l'office)
  {
    id: 'adv_fiscal_11',
    query: "Je télétravaille depuis chez moi 3 jours sur 5 depuis deux ans. Mon employeur ne rembourse rien (pas internet, pas une partie du loyer). Mon collègue dit qu'on peut déduire le bureau à domicile dans la déclaration d'impôts. J'ai un espace de travail réservé au bureau, mais je n'y vais qu'2 jours par semaine.",
    canton: 'ZH',
    expected_domaine: 'fiscal',
    expected_any_article: ['LIFD 26', 'LIFD 33'],
    notes: "Déduction home office salarié — LIFD 26 al. 1 let. a — règle TF stricte — LIFD 26 al. 1 let. a : les salariés peuvent déduire les frais professionnels nécessaires. BUREAU À DOMICILE SALARIÉ : déductible UNIQUEMENT si l'employeur n'a pas de poste de travail fixe à disposition. RÈGLE TF (ATF 124 II 29) : si un bureau est disponible à l'office (même non utilisé chaque jour), la déduction est REFUSÉE. LIFD 34 let. a : choix personnel de travailler à domicile = dépense privée non déductible. 'Télétravail 3j/5 + bureau disponible au bureau + déduction impôts ?' sans 'LIFD 26 + ATF 124 II 29 : déduction refusée si poste disponible à l'office' ni 'LIFD 34 let. a : choix personnel = dépense privée'. Signal adversarial = salarié croit que le télétravail fréquent justifie une déduction, ignorant la condition sine qua non 'bureau indisponible à l'office'.",
  },

  // HYBRIDE — divorce + licenciement par conjoint-employeur (travail primary)
  {
    id: 'adv_hybride_14',
    query: "Je travaille depuis 10 ans dans la société de ma femme comme directeur commercial, j'ai un contrat signé. On est en train de divorcer et elle vient de m'envoyer une lettre de licenciement 'pour restructuration'. Je pense que c'est une vengeance. Est-ce un licenciement abusif ?",
    canton: 'GE',
    expected_domaine: 'travail',
    expected_any_article: ['CO 336', 'CO 336a', 'CO 336b'],
    notes: "Licenciement par conjoint-employeur dans contexte de divorce — CO 336 licenciement abusif — CO 336 al. 1 : résiliation abusive notamment pour représailles (let. d). Contemporanéité divorce/licenciement = indice fort d'abus, mais travailleur doit prouver. CO 336a : indemnité max 6 mois salaire. CO 336b : contester formellement par écrit avant fin contrat + délai 180 jours. TF ATF 136 III 513 : mobile de représailles = cause abusive. Le licenciement reste du droit du travail (CO), pas du droit de la famille (CC). 'Directeur commercial 10 ans + licenciement pendant divorce + restructuration invoquée ?' sans 'CO 336 al. 1 : contemporanéité divorce/licenciement = indice abus' ni 'CO 336b : contestation écrite + délai 180 jours'. Signal adversarial = salarié perçoit cela comme un conflit conjugal, ignorant les règles propres du droit du travail.",
  },

  // ASSURANCES — LAI 17 / LPGA 17 : révision rente AI, amélioration légère ≠ suppression automatique
  {
    id: 'adv_social_16',
    query: "J'ai une demi-rente de l'assurance invalidité depuis 7 ans pour des problèmes de dos lombaires. Mon médecin traitant dit que mon état s'est un peu amélioré grâce à la physio. Quelques semaines après j'ai reçu une lettre de l'OAI qui parle de 'révision'. Ils peuvent m'enlever ma rente parce que j'ai un peu mieux ?",
    canton: 'BE',
    expected_domaine: 'assurances',
    expected_any_article: ['LAI 17', 'LPGA 17', 'LPGA 52'],
    notes: "Révision rente AI — LAI 17 / LPGA 17 — LAI 17 al. 1 : modification notable du taux d'invalidité requise pour changer la rente. TF ATF 130 V 71 : seuil de 5 points de pourcentage. Amélioration légère à la physio ≠ suppression automatique. LPGA 52 : opposition dans 30 jours. Rente maintenue pendant la procédure. 'Demi-rente AI 7 ans + légère amélioration + lettre révision OAI ?' sans 'LAI 17 : modification notable requise (5+ pp ATF 130 V 71)' ni 'LPGA 52 : opposition 30j + rente maintenue'. Signal adversarial = bénéficiaire croit que toute amélioration entraîne automatiquement la perte de la rente.",
  },

  // ACCIDENT — CO 58 : responsabilité propriétaire d'ouvrage, glissade piscine publique
  {
    id: 'adv_accident_18',
    query: "Ma fille de 9 ans a glissé sur le bord mouillé de la piscine de la commune cet été et s'est cassé le bras. Il y avait une petite pancarte 'attention sol glissant'. La mairie dit qu'elle décline toute responsabilité grâce à cette pancarte. On a 4000 CHF de frais médicaux.",
    canton: 'VD',
    expected_domaine: 'accident',
    expected_any_article: ['CO 58', 'CO 41'],
    notes: "Responsabilité propriétaire d'ouvrage — CO 58 — piscine publique — CO 58 al. 1 : le propriétaire répond du dommage causé par des vices ou défaut d'entretien de l'ouvrage. Piscine communale = ouvrage. Pancarte insuffisante pour exonérer la commune si bord excessivement glissant. TF ATF 130 III 213 : conditions strictes pour l'exonération par mise en garde. CO 44 : faute concomitante d'un enfant de 9 ans réduit mais n'exclut pas l'indemnité. 'Glissade piscine communale enfant 9 ans + pancarte + frais 4000 CHF + mairie décline ?' sans 'CO 58 : défaut d'entretien → responsabilité commune, pancarte insuffisante pour enfant' ni 'CO 44 : faute concomitante enfant réduit sans exclure totalement'. Signal adversarial = parents croient que la pancarte exonère totalement la commune.",
  },

  // ASSURANCES — LCA 40 : déchéance totale pour fraude ou exagération sinistre
  {
    id: 'adv_assurances_19',
    query: "Mon appartement a été cambriolé. J'ai fait la liste pour mon assurance ménage. Ils vérifient tout et disent qu'un objet de 800 CHF sur ma liste ne peut pas être prouvé. Ils menacent de refuser TOUTE ma demande, même pour les objets prouvés (2500 CHF de dommages certains). Ils ont vraiment ce droit ?",
    canton: 'ZH',
    expected_domaine: 'assurances',
    expected_any_article: ['LCA 40', 'LCA 39'],
    notes: "Déchéance totale LCA 40 — si l'ayant droit a déclaré inexactement dans l'intention de tromper, l'assureur N'EST PAS LIÉ. SANCTION INTÉGRALE : même exagération partielle peut justifier refus total. INTENTION DE TROMPER requise : l'assureur doit prouver le dol. Un oubli ou estimation de bonne foi ≠ déchéance. 'Cambriolage + 1 objet non prouvé 800 CHF + assureur menace refus total ?' sans 'LCA 40 : déchéance totale légale mais intention de tromper doit être prouvée' ni 'bonne foi protège l'assuré contre la déchéance'. Signal adversarial = assuré ignore que LCA 40 prévoit une déchéance totale légale, mais seulement si intention frauduleuse prouvée.",
  },

  // CIRCULATION — LCR 28 : leçon de conduite, assurance RC auto-école intervient en premier
  {
    id: 'adv_circulation_18',
    query: "J'étais en leçon d'auto-école hier. En faisant le créneau, j'ai touché la voiture garée derrière. Mon moniteur avait la main sur le frein à main de son côté. Les dégâts sont environ 1200 CHF. Qui paie — mon assurance personnelle ou l'assurance de l'auto-école ?",
    canton: 'ZH',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 28', 'LCR 58', 'LCR 70'],
    notes: "Accident en leçon de conduite — LCR 28 / LCR 58 — LCR 28 al. 1 : le moniteur doit pouvoir intervenir sur les commandes. LCR 58 : le DÉTENTEUR du véhicule (auto-école) est responsable civilement. L'assurance RC obligatoire du véhicule de l'auto-école (LCR 63/70) couvre le dommage au tiers en premier. Assurance personnelle de l'élève non nécessaire (l'élève n'est pas détenteur). 'Leçon auto-école + touche voiture garée + moniteur au frein + 1200 CHF ?' sans 'LCR 58 : détenteur = auto-école, RC du véhicule de l'auto-école intervient en premier' ni 'élève n'est pas détenteur = pas d'assurance personnelle requise'. Signal adversarial = élève croit devoir mobiliser son assurance personnelle, ignorant que l'assurance RC de l'auto-école est la couverture primaire.",
  },

  // CONSOMMATION — CO 370 al. 2 : réception sans réserve ne couvre pas les défauts cachés
  {
    id: 'adv_consommation_20',
    query: "J'ai payé 14'000 CHF à une entreprise de plomberie-carrelage pour rénover ma salle de bain. À la réception j'ai signé un procès-verbal 'sans réserve'. Six mois plus tard le carrelage se décolle par plaques et il y a une fuite dans le mur. L'artisan dit que j'ai signé la réception donc c'est terminé. Il a raison ?",
    canton: 'VD',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 368', 'CO 367', 'CO 370'],
    notes: "Contrat d'entreprise — CO 368 — défauts cachés — CO 370 al. 2 : réception formelle sans réserve ne couvre PAS les défauts cachés (non apparents lors de la réception). Carrelage décollé 6 mois + fuite dans le mur = défauts cachés. Délai prescription CO 371 : 5 ans dès réception (constructions). CO 370 al. 3 : avis des défauts cachés aussitôt après découverte. DÉMARCHE : lettre recommandée + mise en demeure. 'Salle de bain 14k + carrelage décolle 6 mois + fuite + procès-verbal sans réserve signé ?' sans 'CO 370 al. 2 : réception sans réserve ne couvre pas les défauts cachés' ni 'CO 368 : droit aux réparations dans 5 ans'. Signal adversarial = maître d'ouvrage croit que la signature du PV l'a privé de tout recours.",
  },

  // SANTÉ — LAMal 64a al. 7 : soins urgents maintenus malgré suspension pour arriérés de primes
  {
    id: 'adv_sante_26',
    query: "J'ai perdu mon emploi il y a 4 mois et je n'arrive plus à payer mes primes LAMal. Mon assurance m'a envoyé une lettre disant qu'elle va 'suspendre les prestations dès le 1er du mois prochain'. J'ai besoin de mes médicaments contre le diabète. Est-ce qu'ils peuvent vraiment m'interdire d'aller chez le médecin ?",
    canton: 'GE',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 64a', 'LAMal 41', 'LAMal 65'],
    notes: "Suspension prestations LAMal pour arriérés — LAMal 64a al. 7 (depuis 2022) : pendant la suspension des prestations, les soins urgents sont TOUJOURS couverts. Médicaments diabète = potentiellement urgents si absence → complications immédiates. CANTON prend en charge les soins urgents et facture l'assuré (LAMal 64a al. 8). SUBSIDES CANTONAUX LAMal 65 : demande urgente à faire (GE). PLAN ÉCHELONNEMENT : demander par écrit à l'assureur. 'Chômage + arriérés + suspension + médicaments diabète ?' sans 'LAMal 64a al. 7 : soins urgents toujours couverts malgré suspension' ni 'LAMal 65 : subsides cantonaux + plan échelonnement'. Signal adversarial = assuré croit que suspension = interdiction totale de soins, ignorant LAMal 64a al. 7 et les subsides.",
  },

  // ENTREPRISE — CO 530 : société simple de fait (food truck sans contrat), CO 548 propriété commune
  {
    id: 'adv_entreprise_19',
    query: "Mon ami et moi avons lancé un food truck il y a 3 ans. On a tout payé ensemble (camion à son nom 25'000 CHF, équipement cuisine 8'000 CHF dont 4'000 de moi). On partageait les bénéfices 50/50. On n'a jamais rien signé ni créé de société. Il veut arrêter et prendre tout le matériel qui est à son nom. J'ai mis 4'000 CHF au départ et 3 ans de travail. Je n'ai aucun droit ?",
    canton: 'NE',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 530', 'CO 548', 'CO 533'],
    notes: "Société simple de fait — CO 530 ss — CO 530 : contrat de société simple résultant d'actes concluants. PAS DE FORME REQUISE : 3 ans co-exploitation + partage bénéfices 50/50 + apports communs = société simple de fait valide. CO 548 : les biens apportés à la société constituent une propriété commune des associés, même si titrés au nom d'un seul. CO 533 : part égale dans bénéfices et pertes sauf convention contraire. CO 549 : liquidation au prorata des apports en cas de dissolution. PREUVE : virements bancaires + relevés comptes + communications. 'Food truck 3 ans + camion au nom ami + équipement commun + partage 50/50 + rien signé ?' sans 'CO 530 : société simple de fait par actes concluants = valide sans écrit' ni 'CO 548 : biens apportés = propriété commune même si au nom d'un seul'. Signal adversarial = associé croit que l'absence de contrat écrit l'a privé de tout droit.",
  },

  // VOISINAGE — CO 685 : distances légales vues, permis bâtir ≠ dispense droit privé fédéral
  {
    id: 'adv_voisinage_27',
    query: "Mon voisin construit une grande terrasse couverte avec garde-corps vitré à 80 centimètres de ma fenêtre de chambre. Il aura une vue directe dans ma pièce. Il a le permis de construire de la commune. Est-ce que je peux encore faire quelque chose, et est-ce que le droit des distances s'applique aussi aux terrasses ?",
    canton: 'VD',
    expected_domaine: 'voisinage',
    expected_any_article: ['CO 685', 'CC 684'],
    notes: "Distances légales et vues — CO 685 / droit cantonal — CO 685 al. 1 : fenêtres et ouvertures donnant vue sur le fonds voisin : distance minimale 50 cm en cas de vues droites. CO 685 = DROIT PRIVÉ fédéral, distinct du permis de construire (droit public). TERRASSE EN ÉLÉVATION avec vue directe peut être couverte par CO 685. PERMIS DE CONSTRUIRE communal ne dispense pas de respecter CO 685. RECOURS : action civile CC 641 al. 2 + CO 685. MESURES PROVISIONNELLES CPC 261 : urgence avant achèvement. 'Terrasse 80 cm fenêtre chambre + vue directe + permis accordé ?' sans 'CO 685 : distances 50 cm minimum vue droite, droit privé distinct du permis public' ni 'CPC 261 : mesures provisionnelles urgentes avant achèvement'. Signal adversarial = riverain croit que le permis communal est définitif et clôt tout recours, ignorant CO 685 (droit privé fédéral).",
  },

  // ── WAVE 41 — 2026-07-12 ──────────────────────────────────────

  // BAIL — CO 269a : hausse loyer après rénovation, plafond rendement net
  {
    id: 'adv_bail_42',
    query: "Mon propriétaire a refait la toiture et installé un ascenseur dans l'immeuble. Il veut augmenter mon loyer de 350 CHF par mois dès le prochain terme. Il dit que les travaux ont coûté 480'000 CHF pour tout l'immeuble donc il a le droit d'augmenter tous les loyers. Je n'ai aucun recours ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 269a', 'CO 269c'],
    notes: "Hausse loyer après rénovation — CO 269a let. b — CO 269a : le loyer n'est pas abusif s'il est justifié par des prestations supplémentaires du bailleur. MAIS : la hausse doit respecter le plafond du RENDEMENT NET (CO 269). Le bailleur ne peut pas répercuter 100% du coût en hausse de loyer si cela dépasse le rendement admissible. CO 269c : méthode de calcul du loyer licite. CONTESTATION : 30 jours calendriers dès réception de l'avis de majoration (CO 270b), autorité de conciliation du canton. Travaux = toiture + ascenseur = travaux d'entretien (CO 269a let. a, pas let. b si pas vraie plus-value). 'Immeuble rénovation + hausse 350 CHF + travaux 480k ?' sans 'CO 269a : hausse justifiée seulement si plus-value réelle ET dans limite rendement net' ni 'CO 270b : opposition 30 jours dès avis'. Signal adversarial = locataire croit que tout travail légitime n'importe quelle hausse sans plafond.",
  },

  // TRAVAIL — CO 337/335c : licenciement immédiat vs ordinaire, accumulation avertissements
  {
    id: 'adv_travail_42',
    query: "Je travaille depuis 7 ans comme comptable dans une PME. J'ai reçu deux avertissements écrits en 18 mois pour des retards répétés. Ce matin mon employeur m'a licencié avec effet immédiat en invoquant ces deux avertissements cumulés. Il m'a remis une lettre disant que les avertissements répétés constituent une 'faute grave'. A-t-il le droit de me virer sans préavis ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 337', 'CO 335c'],
    notes: "Licenciement immédiat — CO 337 — CO 337 al. 1 : justes motifs = comportement rendant impossible la continuation des rapports de travail. ACCUMULATION D'AVERTISSEMENTS ≠ justes motifs CO 337 automatiques : les avertissements documentent une faute persistante mais le licenciement immédiat exige une faute grave UNIQUE (ATF 127 III 153). Des retards répétés = motif de licenciement ORDINAIRE (CO 335a/335c) avec préavis 3 mois (7 ans d'ancienneté). Licenciement immédiat injustifié → CO 337c : indemnité jusqu'à 6 mois de salaire + salaire pendant délai de préavis dû. 'Comptable 7 ans + 2 avertissements retards + licencié immédiat ?' sans 'CO 337 al. 1 : accumulation avertissements ≠ faute grave unique → licenciement immédiat injustifié' ni 'CO 337c : indemnité 6 mois + préavis 3 mois'. Signal adversarial = employeur confond comportement répété justifiant ordinaire (CO 335c) vs faute grave unique justifiant immédiat (CO 337).",
  },

  // DETTES — LP 278 : opposition séquestre, délai 10 jours péremptoire dès notification
  {
    id: 'adv_dettes_37',
    query: "J'ai reçu un avis de l'office des poursuites m'informant qu'un séquestre a été ordonné sur mon compte bancaire par un créancier. Mon compte est bloqué à hauteur de 8'000 CHF. Je suis choqué car ce créancier n'a aucun titre contre moi. Mon voisin me dit que j'ai 3 mois pour contester. Est-ce vrai ?",
    canton: 'GE',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 278', 'LP 279'],
    notes: "Opposition au séquestre — LP 278 — LP 278 al. 1 : DÉLAI PÉREMPTOIRE DE 10 JOURS dès la NOTIFICATION de l'acte de séquestre pour former opposition au juge qui a ordonné le séquestre. NON SUSPENSIF : le compte reste bloqué pendant la procédure. LP 279 : après opposition accueillie, séquestre maintenu si le créancier introduit une action civile dans les 10 jours (ou validation). Le délai de 3 mois cité par le voisin est ERRONÉ — il n'existe pas pour l'opposition LP 278. DOSSIER : preuve que créance inexistante (contrats, correspondances). 'Compte bloqué 8k + séquestre + pas de titre ?' sans 'LP 278 : 10 jours péremptoires dès notification pour opposition — pas 3 mois' ni 'LP 279 : créancier doit encore valider dans 10 jours si opposition accueillie'. Signal adversarial = débiteur attend en croyant avoir 3 mois alors que le délai LP 278 de 10 jours est péremptoire et déjà en cours.",
  },

  // FAMILLE — CC 134/296 : révision garde, enfant 14 ans, audition obligatoire non vinculante
  {
    id: 'adv_famille_36',
    query: "Ma fille a 14 ans et veut habiter chez moi à temps plein. Sa mère a la garde principale depuis le divorce. Ma fille dit au juge qu'elle veut vivre chez moi. Le juge est-il obligé de respecter son choix ? Elle est assez grande pour décider non ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 134', 'CC 296'],
    notes: "Révision garde et audition enfant — CC 134 / CC 298 — CC 296 al. 3 : l'enfant capable de discernement (en principe dès 12 ans) doit être entendu avant toute décision relative à la garde. CC 134 al. 2 : modification jugement divorce sur garde si changement notable de circonstances. MAIS : l'avis de l'enfant est PRIS EN COMPTE, il n'est PAS VINCULANT. ATF 142 III 617 : plus l'enfant est âgé, plus son souhait pèse, mais le juge décide selon le BIEN DE L'ENFANT (CC 296 al. 2). À 14 ans le souhait a un poids important mais n'est pas décisif si le bien de l'enfant commande autrement. 'Fille 14 ans + veut chez père + mère garde principale ?' sans 'CC 296 : audition obligatoire mais NON vinculante — juge décide selon bien de l'enfant' ni 'CC 134 : révision exige changement notable de circonstances, pas simple souhait'. Signal adversarial = père (et fille) croient que l'enfant de 12+ ans décide seul de son domicile.",
  },

  // ÉTRANGERS — LEI 84/85a : permis S Ukraine, travail autorisé, regroupement familial restreint
  {
    id: 'adv_etrangers_31',
    query: "Je suis ukrainienne avec un permis S depuis 2022. Je veux faire venir ma mère (65 ans) et ma sœur (30 ans) qui sont encore en Ukraine. Mon frère vit en Suisse depuis 10 ans avec un permis B. Est-ce que mon permis S me donne le droit au regroupement familial pour ma mère et ma sœur ?",
    canton: 'BE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 84', 'LEI 85a'],
    notes: "Permis S — protection temporaire — LEI 84 al. 1 : le permis S est accordé aux personnes à protéger (Ukraine depuis mars 2022). LEI 85a : titulaires du statut S peuvent exercer une activité lucrative sans autorisation spéciale. REGROUPEMENT FAMILIAL RESTREINT pour permis S : seuls CONJOINT et ENFANTS MINEURS peuvent rejoindre (LEI 85 al. 3 applicable par analogie). Ni les parents (ascendants) ni les frères/sœurs ne sont inclus dans le regroupement familial du permis S — contrairement au permis B/C. La mère (65 ans) et la sœur (30 ans) NE PEUVENT PAS venir via le regroupement S. 'Permis S + mère 65 ans + sœur 30 ans + regroupement familial ?' sans 'LEI 84/85a : regroupement S = conjoint + enfants mineurs seulement, pas ascendants ni fratrie' ni distinction permis S vs B pour le regroupement. Signal adversarial = bénéficiaire S croit que le regroupement couvre la famille élargie comme un permis B.",
  },

  // ASSURANCES — LAVS 29quinquies : splitting AVS divorce, rente propre pas part rente ex
  {
    id: 'adv_assurances_20',
    query: "Je divorce après 22 ans de mariage. J'ai travaillé à temps partiel et m'en suis occupée des enfants. Mon mari a une rente AVS de 1'800 CHF. On m'a dit que j'aurai droit à la moitié de sa rente après le divorce. Est-ce que cela signifie qu'il devra me verser 900 CHF par mois de SA rente ?",
    canton: 'VD',
    expected_domaine: 'assurances',
    expected_any_article: ['LAVS 29', 'LAVS 21'],
    notes: "Splitting AVS divorce — LAVS 29quinquies — Partage des revenus (splitting) : les revenus des deux époux pendant le mariage sont additionnés et répartis par moitié sur leurs comptes AVS RESPECTIFS pour les années communes. Résultat : chaque époux reçoit une RENTE PROPRE calculée sur ses revenus bonifiés — l'ex-mari NE VERSE PAS une partie de SA rente. La rente de l'ex-femme sera calculée sur ses propres cotisations cumulées (temps partiel + bonifications pour tâches éducatives CC/LAVS). Si ces cotisations sont insuffisantes, la rente sera inférieure à 900 CHF. LAVS 29 : rente ordinaire. LAVS 21 : âge de la rente. BONIFICATIONS LAVS 29ter : pour tâches éducatives. 'Divorce 22 ans + temps partiel + rente mari 1800 CHF + partage ?' sans 'LAVS 29quinquies : splitting = rente propre calculée sur compte AVS personnel, pas prélèvement sur rente ex-mari' ni 'LAVS 29ter : bonifications pour tâches éducatives'. Signal adversarial = femme au foyer croit que l'ex-mari lui versera la moitié de SA rente mensuelle.",
  },

  // CONSOMMATION — CO 158 : arrhes vs acompte, restitution double si réclamant défaille
  {
    id: 'adv_consommation_21',
    query: "J'ai versé 3'000 CHF d'arrhes à une agence événementielle pour organiser mon mariage. À deux mois de la date, l'agence m'annonce qu'elle fait faillite et ne peut pas assurer la prestation. Elle propose de me rembourser seulement mes 3'000 CHF. Mais j'ai dû tout réorganiser en urgence et j'ai perdu des opportunités. Est-ce que je peux récupérer plus que mes 3'000 CHF ?",
    canton: 'NE',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 205', 'CO 107', 'CO 97'],
    notes: "Arrhes — CO 158 — CO 158 al. 2 : si la partie qui A REÇU les arrhes est en demeure ou résilie, elle doit restituer LE DOUBLE des arrhes reçues. Ici l'agence (réclamant = destinataire des arrhes) défaille → restitution du double = 6'000 CHF (pas seulement 3'000 CHF). CO 158 al. 3 : si le dommage dépasse le double des arrhes, la partie lésée peut réclamer la différence en prouvant le dommage supplémentaire (CO 97). FAILLITE : créance au passif de la masse si la société est en liquidation. DOMMAGES SUPPLÉMENTAIRES : coûts de réorganisation, perte sur prestataires retenus. 'Mariage + arrhes 3000 + agence faillite + veut seulement rembourser ?' sans 'CO 158 al. 2 : défaillance du réclamant = restitution du DOUBLE (6000 CHF)' ni 'CO 97/158 al. 3 : dommages supplémentaires réclamables si >double'. Signal adversarial = client croit que les arrhes sont une simple avance remboursable à l'identique, ignorant la sanction double de CO 158.",
  },

  // CIRCULATION — LCR 16c/90 : zone travaux, +30 km/h au-dessus de 80, retrait permis 3 mois
  {
    id: 'adv_circulation_19',
    query: "J'ai été flashé à 127 km/h dans une zone de travaux limitée à 80 km/h sur l'A1. C'est un excès de 47 km/h. Je n'ai jamais eu de problème avec le permis. La police dit que je risque un retrait de permis de 3 mois minimum. Je pensais payer une amende et c'est tout pour une première infraction. Est-ce possible qu'ils me retirent vraiment le permis ?",
    canton: 'BE',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 16c', 'LCR 90'],
    notes: "Excès de vitesse grave — LCR 16c — LCR 16c al. 1 let. a : infraction grave = dépassement de +30 km/h sur routes avec limite ≤ 50 km/h, ou +40 km/h sur routes > 50 km/h. LCR 16c al. 1 let. b : EN ZONE DE TRAVAUX, le seuil est RÉDUIT : +20 km/h sur route à 80 km/h en zone de travaux = infraction grave (OASA 16c). 47 km/h au-dessus de 80 km/h en zone travaux = TRÈS grave (quasi LCR 16d). RETRAIT MINIMAL : LCR 16c al. 2 let. a → 3 mois MINIMUM, même pour première infraction. LCR 90 al. 2 : sanction pénale parallèle (amende ou peine pécuniaire). 'A1 travaux + flashé 127 sur 80 + 47 km/h d'excès + première infraction ?' sans 'LCR 16c : zone travaux → infraction grave → retrait 3 mois minimum même 1ère infraction, pas seulement amende' ni 'LCR 90 al. 2 : sanction pénale séparée'. Signal adversarial = conducteur croit qu'une première infraction = seulement amende, ignorant LCR 16c qui impose retrait minimum 3 mois.",
  },

  // SANTÉ — LAMal 29/64 : maternité, franchise et quote-part suspendues consultations prénatales
  {
    id: 'adv_sante_27',
    query: "Je suis enceinte de 5 mois. J'ai une franchise annuelle LAMal de 2'500 CHF que je n'ai pas encore atteinte. Mon gynécologue m'a envoyé une facture de 380 CHF pour ma dernière consultation prénatale. Est-ce que je dois vraiment payer de ma poche jusqu'à ce que j'atteigne ma franchise ?",
    canton: 'GE',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 64', 'LAMal 29'],
    notes: "Maternité et franchise LAMal — LAMal 29 / OAMal 104 — LAMal 29 al. 2 : les prestations en cas de maternité (soins préventifs, consultations de contrôle de la grossesse, accouchement, soins post-partum) sont EXEMPTÉES de franchise et de quote-part. OAMal 104 : liste des examens de contrôle préventifs de grossesse pris en charge sans franchise. CONSÉQUENCE : la consultation prénatale de contrôle (gynécologue, sage-femme, dépistages T21) ne doit PAS être payée de la poche de la patiente, même si la franchise n'est pas atteinte. La facture doit être transmise à l'assureur qui prend en charge 100%. 'Enceinte 5 mois + franchise 2500 CHF + consultation gynéco 380 CHF + facture personnelle ?' sans 'LAMal 29 : maternité exemptée de franchise et quote-part' ni 'OAMal 104 : consultations prénatales de contrôle = exemptées'. Signal adversarial = patiente paie à tort sa franchise sur des soins de grossesse pourtant exemptés par LAMal 29.",
  },

  // ENTREPRISE — CO 754/718b : organe de fait, dirigeant sans inscription RC, responsabilité identique
  {
    id: 'adv_entreprise_20',
    query: "J'ai fondé une SA mais je n'ai pas voulu figurer au registre du commerce pour des raisons personnelles. Un ami de confiance est l'administrateur officiel mais c'est moi qui prends toutes les décisions, signe les contrats et gère les finances. La société a des dettes importantes. Mon ami me dit qu'il est seul responsable puisque c'est son nom au RC. Est-ce vrai ?",
    canton: 'ZH',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 754', 'CO 718b'],
    notes: "Organe de fait — CO 754 / jurisprudence TF — CO 754 al. 1 : responsabilité des personnes chargées de la gestion ou de la surveillance. ORGANE DE FAIT : le TF étend la responsabilité CO 754 aux personnes qui exercent EFFECTIVEMENT des fonctions d'organe sans y être formellement désignées (ATF 128 III 29). Dirigeant de facto (toutes décisions + contrats + finances) = organe de fait = responsabilité IDENTIQUE à l'administrateur formel. L'absence d'inscription au RC NE PROTÈGE PAS contre CO 754. CO 718b : représentation de la SA engage la société envers les tiers de bonne foi même si le représentant outrepassait ses pouvoirs. En cas de faillite : LP 285 ss actions révocatoires possibles contre organe de fait. 'SA + ami administrateur nominal + moi décisions réelles + dettes ?' sans 'CO 754 + jurisprudence TF : organe de fait = responsabilité identique à administrateur formel, absence RC = pas de protection' ni 'ATF 128 III 29 : critère de l'exercice effectif des fonctions'. Signal adversarial = fondateur de fait croit que l'absence d'inscription au RC le protège totalement de la responsabilité pour les dettes.",
  },

  // ===== WAVE 42 — 2026-07-13 =====

  // BAIL — CO 266l/266m : résiliation doit être donnée sur formule officielle cantonale
  {
    id: 'adv_bail_43',
    query: "Mon propriétaire m'a envoyé un email le 15 juin pour me dire que mon bail est résilié pour le 31 août. Je suis locataire depuis 4 ans à Genève. Est-ce que je dois commencer à chercher un appartement d'urgence ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 266l', 'CO 266m'],
    notes: "Résiliation bail d'habitation — formule officielle obligatoire — CO 266l al. 1 : le congé donné par le bailleur pour un bail d'habitation ou de locaux commerciaux doit être communiqué au moyen d'une FORMULE OFFICIELLE agréée par le canton. CO 266l al. 2 : le congé donné sans formule officielle est NUL de plein droit — le locataire n'a aucune obligation de partir. Un email ou une simple lettre du propriétaire ne vaut rien juridiquement pour résilier un bail d'habitation. Le locataire peut ignorer la résiliation et rester en place ; c'est le propriétaire qui est en tort. GE : formule officielle agréée par le canton disponible auprès de l'autorité de conciliation en matière de baux. CO 266m : mêmes règles pour les baux d'habitation loués meublés. 'Email résiliation 15 juin pour 31 août à Genève ?' sans 'CO 266l : formule officielle cantonale obligatoire — email = congé nul de plein droit' ni 'locataire peut ignorer et rester'. Signal adversarial = locataire croit qu'un email de résiliation du propriétaire a force légale et qu'il doit partir.",
  },

  // TRAVAIL — CO 336c : suspension du délai de congé pendant maladie, pas nullité absolue
  {
    id: 'adv_travail_43',
    query: "Je suis en arrêt maladie depuis 3 semaines. Mon employeur m'a envoyé une lettre de licenciement hier. J'ai 6 ans d'ancienneté. On m'a dit qu'il ne peut pas me licencier quand je suis malade. Est-ce que mon licenciement est nul ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 336c', 'CO 335c'],
    notes: "Résiliation pendant maladie — CO 336c — CO 336c al. 1 let. b : après le temps d'essai, l'employeur ne peut pas RÉSILIER LE CONTRAT pendant une incapacité de travail totale ou partielle (maladie) pendant 30 jours la 1ère année, 90 jours de la 2e à la 5e année, 180 jours dès la 6e année. CO 336c al. 2 : si le congé est donné PENDANT ce délai de protection, il est NUL. NUANCE CRUCIALE : si l'employeur a résilié AVANT la maladie (délai de congé déjà en cours) et que le travailleur tombe malade ensuite, le délai de congé est SUSPENDU (gelé) et recommence à courir après la guérison — le licenciement reste valable. Situation en l'espèce : 6 ans d'ancienneté → délai de protection 180 jours. Lettre reçue PENDANT l'arrêt maladie → congé nul si résilié pendant cet arrêt. CO 335c : délai de congé 2 mois si ancienneté 2-9 ans. 'Arrêt maladie 3 semaines + licenciement reçu hier + 6 ans ancienneté ?' sans 'CO 336c : résiliation pendant arrêt = nulle si dans délai de protection (180j dès 6e année)' ni 'distinction congé donné pendant vs avant la maladie'. Signal adversarial = travailleur confond 'licenciement nul si donné pendant maladie' avec 'impossible d'être licencié du tout quand on est malade'.",
  },

  // DETTES — LP 149 : acte de défaut de biens ne libère pas la dette (prescription 20 ans)
  {
    id: 'adv_dettes_38',
    query: "Il y a 7 ans, un créancier m'a poursuivi pour 12'000 CHF. La saisie n'a rien trouvé et j'ai reçu un document appelé 'acte de défaut de biens'. Maintenant que j'ai retrouvé un emploi stable, il relance une nouvelle poursuite pour le même montant. Je pensais que l'acte de défaut de biens effaçait la dette. Est-ce légal ?",
    canton: 'VD',
    expected_domaine: 'dettes',
    expected_any_article: ['LP 149', 'LP 149a'],
    notes: "Acte de défaut de biens — LP 149 — LP 149 al. 1 : l'acte de défaut de biens est délivré quand la saisie est infructueuse. LP 149 al. 4 : l'acte de défaut de biens vaut TITRE DE CRÉANCE : le créancier peut relancer une poursuite DÈS QUE le débiteur retrouve des biens. La dette N'EST PAS effacée par l'ADB. LP 149a : prescription de la créance constatée par ADB = 20 ans dès la date de l'acte (délai spécial, distinct des prescriptions CO). Après 20 ans seulement, la créance se prescrit définitivement. Le mythe 'acte de défaut de biens = ardoise effacée' est très répandu : l'ADB gèle et cristallise la créance, il ne la supprime pas. Tant que 20 ans ne sont pas écoulés et que le débiteur retrouve des biens, la poursuite peut reprendre. 'Acte de défaut de biens il y a 7 ans + nouvelle poursuite même montant + emploi retrouvé ?' sans 'LP 149 : ADB = titre de créance persistant, poursuite possible si biens retrouvés' ni 'LP 149a : prescription 20 ans seulement'. Signal adversarial = débiteur croit que l'ADB a définitivement libéré sa dette.",
  },

  // FAMILLE — CC 277 : obligation alimentaire continue après 18 ans si formation en cours
  {
    id: 'adv_famille_37',
    query: "Mon fils fête ses 18 ans le mois prochain. Il est en 2e année d'apprentissage de mécanicien, il lui reste encore 2 ans. Son père dit que dès ses 18 ans, il n'est plus obligé de payer la pension alimentaire parce que notre fils est majeur. A-t-il raison ?",
    canton: 'FR',
    expected_domaine: 'famille',
    expected_any_article: ['CC 277', 'CC 276'],
    notes: "Entretien post-majorité — CC 277 — CC 277 al. 1 : si, à sa majorité, l'enfant n'a pas encore de formation appropriée, les parents continuent de subvenir à son entretien pendant la durée d'une formation normale. La majorité civile (18 ans) N'ÉTEINT PAS automatiquement l'obligation alimentaire si l'enfant est encore en formation. CC 277 al. 2 : si l'enfant perçoit un salaire d'apprenti, ce revenu est pris en compte mais réduit généralement la contribution sans la supprimer (salaire apprenti mécanicien = CHF 600-900/mois, insuffisant pour couvrir les frais). Le montant peut être revu à la baisse (changement de besoins à 18 ans, salaire apprenti) mais l'obligation ne cesse pas. Procédure : modification de la contribution d'entretien par voie amiable ou judiciaire. CC 276 : les parents pourvoient à l'entretien jusqu'à ce que l'enfant ait acquis une formation appropriée. 'Fils 18 ans + apprentissage 2 ans restants + père veut arrêter pension ?' sans 'CC 277 al. 1 : obligation entretien continue pendant formation même après 18 ans' ni 'salaire apprenti réduit mais ne supprime pas la contribution'. Signal adversarial = père croit que la majorité civile éteint automatiquement l'obligation alimentaire quelle que soit la situation de formation.",
  },

  // ÉTRANGERS — LEI 47 : délai 5 ans (conjoint) et 12 mois (enfants >12 ans) pour regroupement
  {
    id: 'adv_etrangers_32',
    query: "Je suis arrivé en Suisse en 2018 avec un permis B travail. J'ai ma femme et mes deux enfants (14 ans et 9 ans en 2024) encore au Maroc. Je n'avais pas les moyens de les faire venir avant. Maintenant j'ai un appartement et un bon salaire. On m'a dit que c'était trop tard pour les faire venir.",
    canton: 'BS',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 47', 'LEI 44'],
    notes: "Regroupement familial — délais LEI 47 — LEI 47 al. 1 : le regroupement familial doit être demandé dans les 5 ANS pour le conjoint et les enfants. DÉLAI RACCOURCI pour enfants >12 ans : LEI 47 al. 1 let. b : pour les enfants de PLUS DE 12 ANS, délai = 12 mois dès l'entrée du parent OU dès que l'enfant a 12 ans. SITUATION EN L'ESPÈCE (2024) : arrivée 2018, 6 ans écoulés. Conjoint : délai 5 ans dépassé → regroupement difficile, conditionné à une exception (LEI 47 al. 4 : cas de rigueur avéré). Enfant de 14 ans (avait 8 ans en 2018 → a eu 12 ans en 2022) : délai 12 mois depuis 2022 = DÉPASSÉ depuis 2023. Enfant de 9 ans (né 2015, a eu 12 ans en 2027 → délai court encore si <12 ans en 2024) : délai 5 ans dépassé. LEI 44 al. 1 : conditions logement + ressources. LEI 47 al. 4 : clause d'exception si raisons sérieuses expliquent le retard. 'Maroc + permis B 2018 + femme + enfants 14 et 9 ans + 6 ans écoulés ?' sans 'LEI 47 : délai 5 ans pour conjoint et enfants dépassé, délai 12 mois pour enfant >12 ans aussi dépassé' ni 'LEI 47 al. 4 : exception possible si raisons sérieuses + intégration prouvée'. Signal adversarial = ressortissant croit que le regroupement familial est toujours possible quand les ressources sont disponibles, ignorant les délais de LEI 47.",
  },

  // ASSURANCES — LAMal 4/8 : obligation d'acceptation, assureur de base ne peut pas refuser
  {
    id: 'adv_assurances_21',
    query: "Je viens d'arriver en Suisse depuis l'Espagne. J'ai une maladie chronique (diabète type 1). Quand j'essaie de m'inscrire à l'assurance maladie de base LAMal, l'assureur me dit qu'il ne peut pas m'accepter à cause de ma maladie préexistante. Est-ce légal ?",
    canton: 'VD',
    expected_domaine: 'assurances',
    expected_any_article: ['LAMal 4', 'LAMal 8'],
    notes: "Obligation d'acceptation LAMal — LAMal 8 — LAMal 4 al. 1 : toute personne domiciliée en Suisse est tenue de s'assurer auprès d'un assureur-maladie agréé. LAMal 8 al. 1 : les assureurs-maladie sont tenus d'admettre tout requérant dans l'assurance OBLIGATOIRE des soins — SANS SÉLECTION DU RISQUE. Un assureur qui refuse pour cause de maladie préexistante viole la LAMal. LAMal 8 al. 2 : l'assureur de base ne peut ni poser des questions médicales, ni refuser, ni faire de réserve, ni fixer une surprime pour l'assurance de base. Recours : signaler le refus au Service cantonal de santé ou à l'OFSP. DISTINCTION FONDAMENTALE : seule l'assurance de base (LAMal) est soumise à cette obligation — les assurances complémentaires (LCA) peuvent légalement refuser ou appliquer des réserves selon l'état de santé. 'Diabète type 1 + refus assureur de base LAMal ?' sans 'LAMal 8 : refus par assureur de base = illégal, obligation d'acceptation sans sélection risque' ni 'distinction assurance de base LAMal (sans sélection) vs complémentaire LCA (avec sélection)'. Signal adversarial = nouvel arrivant croit que les assureurs maladie suisses peuvent sélectionner les risques comme dans d'autres pays.",
  },

  // CONSOMMATION — CO 40d : délai révocation étendu si vendeur n'informe pas l'acheteur
  {
    id: 'adv_consommation_22',
    query: "J'ai commandé un canapé en ligne il y a 18 jours. Il est arrivé mais les dimensions ne correspondent pas. Le vendeur me dit que le délai de retour de 14 jours est dépassé et refuse tout échange. Mais je n'ai jamais reçu d'information sur ce droit de retour. Que puis-je faire ?",
    canton: 'GE',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 40d', 'CO 40a'],
    notes: "Droit de révocation vente à distance — CO 40a-40g — CO 40a : droit de révocation pour contrats conclus à distance (internet, téléphone). CO 40d al. 1 : délai de révocation = 14 jours dès réception du bien. CO 40d al. 2 : SI LE VENDEUR N'A PAS INFORMÉ le consommateur de son droit de révocation, le délai est PROLONGÉ DE 12 MOIS. Sans information reçue sur le droit de retour, le consommateur peut encore se rétracter même après 18 jours (délai de 14 jours + 12 mois). CO 40e : exclusions (biens confectionnés sur mesure, denrées périssables, etc.) — un canapé standard non personnalisé n'est pas exclu. CHARGE DE LA PREUVE : c'est au vendeur de prouver qu'il a informé l'acheteur de son droit de révocation. 'Canapé internet + 18 jours + pas d'info droit de retour + vendeur refuse ?' sans 'CO 40d al. 2 : sans information sur droit de révocation → délai prolongé de 12 mois' ni 'charge de la preuve de l'information = vendeur'. Signal adversarial = consommateur croit que le délai de 14 jours est absolu et que l'absence d'information sur ce droit ne change rien.",
  },

  // CIRCULATION — LCR 33 : priorité piéton UNIQUEMENT sur passage balisé, pas partout
  {
    id: 'adv_circulation_20',
    query: "J'ai eu un accident hier soir. Je traversais la route en dehors d'un passage piéton (il n'y en avait pas à proximité). Une voiture m'a renversé. Mon ami me dit que les piétons ont toujours la priorité en Suisse et que le conducteur est automatiquement responsable. Est-ce vrai ?",
    canton: 'BE',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 33', 'LCR 26'],
    notes: "Priorité piéton — LCR 33 — LCR 33 al. 2 : aux passages pour piétons NON RÉGLÉS PAR DES SIGNAUX, les véhicules doivent céder le passage aux piétons sur le passage ou s'apprêtant à l'emprunter. MAIS : cette priorité ne vaut QUE sur les passages piétons officiellement balisés (bandes blanches + signalisation). HORS PASSAGE BALISÉ : LCR 49 al. 1 : les piétons doivent utiliser les passages piétons disponibles s'il y en a un à proximité. LCR 26 al. 1 : règle générale — chacun doit se comporter de manière à ne pas gêner ou mettre en danger les autres. Piéton qui traverse hors passage = faute concomitante. RESPONSABILITÉ PARTAGÉE : LCR 58 (responsabilité causale du détenteur) réduite par la faute du piéton (LCR 59 al. 1 : réduction ou libération si la faute de la victime a contribué). La nuit aggrave la faute du piéton (visibilité réduite). 'Traversée hors passage + renversé + nuit ?' sans 'LCR 33 : priorité piéton UNIQUEMENT sur passage balisé' ni 'LCR 59 : responsabilité partagée si faute concomitante du piéton hors passage'. Signal adversarial = piéton croit avoir la priorité absolue partout en Suisse.",
  },

  // SANTÉ — LAMal 25/38 : psychothérapie psychologue couverte LAMal depuis juil. 2022 uniquement avec prescription médicale préalable
  {
    id: 'adv_sante_28',
    query: "Je souffre d'anxiété chronique depuis des mois. J'ai trouvé un psychologue indépendant en cabinet privé à Lausanne. Il me facture 160 CHF par séance. Je pensais que depuis la réforme, la psychothérapie était remboursée par ma caisse de base. Ma caisse maladie refuse de rembourser. Qui a raison ?",
    canton: 'VD',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 25', 'LAMal 38'],
    notes: "Psychothérapie et LAMal — réforme juillet 2022 — LAMal 25 al. 1 : l'assurance de base prend en charge les soins dispensés par les fournisseurs reconnus (liste LAMal 38). Depuis le 1er juillet 2022 (OAMal 45a), les psychologues-psychothérapeutes figurent sur la liste. CONDITION IMPÉRATIVE : le remboursement LAMal est soumis au MODÈLE DE PRESCRIPTION : (1) le patient doit d'abord consulter un médecin (généraliste, psychiatre, pédiatre ou médecin MPR) qui PRESCRIT la psychothérapie ; (2) le psychologue-psychothérapeute doit être habilité et pratiquer SOUS MANDAT MÉDICAL. Psychologue en cabinet indépendant SANS prescription médicale préalable → NON remboursé par la caisse de base LAMal. L'assurance complémentaire (LCA) peut couvrir une partie hors prescription. DÉMARCHE CORRECTE : consulter un médecin → prescription → psychologue agréé. 'Psychologue indépendant + anxiété + 160 CHF + caisse refuse ?' sans 'LAMal 38 : remboursé depuis 2022 MAIS uniquement avec prescription médicale préalable + psychologue sous mandat' ni 'sans prescription = hors LAMal de base'. Signal adversarial = patient croit que la réforme 2022 couvre automatiquement tout psychologue, sans connaître la condition du mandat médical.",
  },

  // ENTREPRISE — CO 800 SARL : responsabilité limitée des associés, biens personnels protégés sauf exceptions
  {
    id: 'adv_entreprise_21',
    query: "J'ai une SARL avec un associé. La société a accumulé 85'000 CHF de dettes fournisseurs et de loyers impayés. On doit déposer le bilan. Un créancier m'a contacté personnellement et m'a dit qu'il allait me poursuivre sur mes biens personnels (appartement, épargne) parce que je suis associé. A-t-il le droit ?",
    canton: 'GE',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 800', 'CO 794'],
    notes: "Responsabilité limitée SARL — CO 800 — CO 794 al. 1 : les dettes de la société à responsabilité limitée sont couvertes UNIQUEMENT par le patrimoine de la société. CO 800 al. 1 : les associés ne répondent PAS personnellement des dettes de la SARL au-delà de leur apport social. C'est l'essence même de la 'responsabilité limitée'. EXCEPTIONS à connaître : (1) CO 800 al. 2 : si les statuts prévoient une obligation de fournir des apports supplémentaires (Nachschusspflicht), l'associé peut devoir compléter jusqu'à concurrence du montant statutaire ; (2) Garanties personnelles données par l'associé (cautionnement, lettre de confort) → responsabilité personnelle pour ces engagements spécifiques ; (3) LP 285 ss : actions en révocation si l'associé a effectué des actes préjudiciables aux créanciers avant la faillite. Sans de telles clauses ou engagements personnels, le créancier ne peut PAS poursuivre l'associé sur ses biens privés. 'SARL + 85000 CHF dettes + faillite + créancier menace biens personnels ?' sans 'CO 800 : associés SARL ne répondent pas personnellement des dettes sociales sauf statuts avec Nachschusspflicht ou garanties personnelles' ni 'CO 794 : seul le patrimoine social répond des dettes'. Signal adversarial = associé SARL croit que sa responsabilité personnelle est engagée pour toutes les dettes de la société.",
  },

  // ========== WAVE 43 — 2026-07-16 ==========

  // SOCIAL — Cst 12 / LIAS : seuil fortune avant aide sociale, mythe "zéro centime d'abord"
  {
    id: 'adv_social_17',
    query: "Mon chômage s'est terminé il y a 3 semaines. J'ai demandé l'aide sociale à ma commune. L'assistante sociale m'a dit que je devais d'abord utiliser toutes mes économies jusqu'au dernier franc avant qu'ils m'accordent quoi que ce soit. J'ai 5'800 CHF de côté pour des urgences. Est-ce que c'est vraiment obligatoire de tout dépenser ?",
    canton: 'VD',
    expected_domaine: 'social',
    expected_any_article: ['Cst 12', 'LIAS 11'],
    notes: "Aide sociale + fortune résiduelle — Cst 12 + LIAS 11 — L'aide sociale est subsidiaire (LIAS 5) : la personne doit d'abord utiliser ses propres ressources. MAIS : les lois cantonales prévoient généralement un SEUIL DE FORTUNE résiduelle admissible (fortune exemptée avant d'être tenue d'épuiser son capital). En VD : LASV art. 11 permet de conserver une réserve modeste. MYTHE ADVERSARIAL : l'assistante sociale simplifie à tort en disant 'zéro centime'. En réalité, la plupart des cantons fixent un seuil de fortune exemptée (selon composition du ménage). La fortune dépassant ce seuil doit certes être mobilisée progressivement, mais pas la totalité immédiatement. 'Aide sociale + 5800 CHF + doit-on tout dépenser ?' sans 'Cst 12 : droit à l'aide dans des situations de détresse' ni 'fortune exemptée — seuil cantonal VD' ni 'LIAS : subsidiarité ≠ épuisement total immédiat'. Signal adversarial = citoyen prend la règle de subsidiarité pour une obligation de dénuement absolu.",
  },

  // SOCIAL — Cst 12 / LIAS : héritage modeste et aide sociale, réduction vs suppression immédiate
  {
    id: 'adv_social_18',
    query: "Je suis à l'aide sociale depuis 14 mois. Ma mère vient de décéder et j'hérite de 11'500 CHF. L'office social me dit que mon aide est suspendue immédiatement et que je dois utiliser cet argent en priorité. Ont-ils le droit de me couper l'aide d'un coup dès maintenant ?",
    canton: 'GE',
    expected_domaine: 'social',
    expected_any_article: ['Cst 12', 'LIAS 26'],
    notes: "Aide sociale + héritage — LIAS 26 + subsidiarité — L'aide sociale est subsidiaire : l'héritage est une ressource qui doit être déclarée et prise en compte (LIAS 26 al. 1 : obligation de rembourser si retour à meilleure fortune). PROCÉDURE : (1) déclaration immédiate obligatoire de l'héritage à l'office social ; (2) révision du budget — l'héritage est intégré comme ressource disponible ; (3) la prestation est réduite ou suspendue selon les règles cantonales, mais pas nécessairement d'un coup. GE (LIASI) : l'héritage inférieur au seuil cantonal peut être conservé en partie (réserve). MYTHE ADVERSARIAL : l'office dit 'suspension immédiate' alors que la pratique est une réévaluation du budget avec prise en compte progressive ou partielle selon montant. 11'500 CHF est un montant modeste qui dépasse le seuil ordinaire → aide suspendue pendant épuisement du capital, mais selon procédure — pas d'un claquement. 'Aide sociale + héritage 11500 CHF + coupure immédiate ?' sans 'LIAS 26 : obligation déclaration + remboursement mais procédure de réévaluation, pas suspension instantanée arbitraire' ni 'seuil fortune exemptée'. Signal adversarial = bénéficiaire pense que toute ressource = coupure instantanée sans recours ni procédure.",
  },

  // ACCIDENT — CO 55 / CO 58 : équipement scolaire défectueux, responsabilité de la commune
  {
    id: 'adv_accident_19',
    query: "Mon fils de 9 ans s'est cassé le bras la semaine dernière pendant un cours de gym à l'école. Un banc suédois mal fixé au mur s'est renversé sur lui. La directrice m'a dit que c'est un 'accident malheureux' et que l'école n'est pas responsable. Mon fils va avoir besoin d'une opération qui coûte 4'000 CHF après franchise. Que puis-je faire ?",
    canton: 'VD',
    expected_domaine: 'accident',
    expected_any_article: ['CO 55', 'CO 58', 'CO 41'],
    notes: "Responsabilité commune pour équipement scolaire défectueux — CO 55 / CO 58 — CO 58 : responsabilité causale pour les ouvrages et les bâtiments — un équipement sportif fixé au mur est assimilé à un 'ouvrage' au sens de CO 58 ; si son installation ou entretien était défectueux, la commune (ou l'État comme propriétaire) répond causalement. CO 55 : responsabilité de l'employeur (maître) pour ses auxiliaires (enseignant de gym qui n'a pas vérifié la fixation). CO 41 : responsabilité délictuelle si faute prouvable (entretien insuffisant documenté). DÉMARCHE : (1) conserver les preuves (photos, rapport médical, rapport d'incident école) ; (2) demander le rapport de sécurité de l'équipement ; (3) mise en demeure à la commune ; (4) assurance accidents personnelle de l'enfant = première ligne, puis recours contre la commune. 'Fils + banc suédois + bras cassé + école dit pas responsable ?' sans 'CO 58 : responsabilité causale propriétaire ouvrage défectueux — banc = ouvrage' ni 'CO 55 : responsabilité auxiliaires (enseignant gym)'. Signal adversarial = parent accepte 'accident malheureux' comme réponse finale, ne connaît pas la responsabilité causale CO 58.",
  },

  // ACCIDENT — CO 41 / CO 55 : glissade eau supermarché, responsabilité pour auxiliaires
  {
    id: 'adv_accident_20',
    query: "Je suis tombée dans un supermarché en marchant dans une flaque d'eau près du rayon frais. Aucun panneau d'avertissement. Je me suis fracturé la cheville, 3 semaines d'arrêt et des soins à 2'800 CHF. Le manager m'a dit que c'est un accident et qu'ils n'en sont pas responsables. Est-ce qu'ils doivent quand même payer quelque chose ?",
    canton: 'BE',
    expected_domaine: 'accident',
    expected_any_article: ['CO 55', 'CO 41'],
    notes: "Responsabilité supermarché pour sol glissant — CO 41 / CO 55 — CO 55 : le maître (supermarché) répond du dommage causé par ses auxiliaires (employés qui n'ont pas nettoyé ou signalé la flaque). La preuve requise est l'absence de diligence dans la surveillance et l'entretien. L'employeur doit prouver qu'il a pris toutes les précautions nécessaires (CO 55 al. 1 : libération si preuve de diligence). CO 41 : faute par omission — ne pas signaler une flaque d'eau visible = violation du devoir de diligence envers les clients. DÉMARCHE : (1) rapport d'accident écrit au manager le jour même ; (2) témoins + photos du lieu ; (3) factures médicales + certificat incapacité ; (4) mise en demeure à l'enseigne (siège social), pas seulement au magasin. 'Flaque eau + cheville fracturée + manager dit pas responsable ?' sans 'CO 55 : responsabilité maître pour auxiliaires = supermarché doit prouver diligence, pas la victime' ni 'CO 41 : absence panneau + flaque visible = faute par omission'. Signal adversarial = victime accepte la réponse du manager et ignore que le fardeau de preuve est inversé sous CO 55.",
  },

  // VIOLENCE — CP 177 / CP 180 / CP 261bis / CC 28b : insultes racistes et menaces voisin, plainte pénale
  {
    id: 'adv_violence_22',
    query: "Mon voisin m'insulte avec des termes racistes et me menace depuis 8 mois, presque quotidiennement depuis son balcon ou dans la cage d'escalier. La police est venue une fois et a dit que c'est un litige de voisinage et qu'il faut s'arranger entre nous. Je ne sais plus quoi faire légalement.",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CP 177', 'CP 180', 'CC 28b'],
    notes: "Insultes racistes et menaces voisin — CP 177 + CP 180 + CP 261bis — CP 177 al. 1 : injure (Beschimpfung) — insultes racistes répétées = injure punissable, poursuite sur plainte, délai 3 mois dès connaissance de l'auteur. CP 180 : menaces — les menaces graves d'un tort sérieux sont poursuivies d'office si graves, sinon sur plainte. CIRCONSTANCE AGGRAVANTE : CP 261bis (discrimination raciale) — insultes à caractère raciste constituent une infraction autonome, poursuite d'OFFICE (pas besoin de plainte formelle de la victime). VOIE CIVILE PARALLÈLE : CC 28b (protection de la personnalité) — mesures provisionnelles d'éloignement ou d'interdiction d'approcher prononcées rapidement par le juge civil, indépendamment de la pénale. MYTHE : police = seule voie. En réalité : (1) dépôt de plainte formelle au commissariat ; (2) CP 261bis = infraction d'office pour discrimination raciale ; (3) CC 28b : voie civile urgente en parallèle. 'Insultes racistes + menaces voisin + police passive ?' sans 'CP 261bis : discrimination raciale = infraction d'office, pas besoin de plainte' ni 'CC 28b : mesures provisionnelles civiles urgentes indépendantes de la pénale'. Signal adversarial = victime croit être bloquée par la passivité policière, ignore la plainte formelle et la voie civile rapide.",
  },

  // CONSOMMATION — CO 197 / CO 210 : garantie légale 2 ans vs garantie commerciale 1 an
  {
    id: 'adv_consommation_23',
    query: "J'ai acheté un robot pâtissier à 780 CHF dans une grande enseigne il y a 15 mois. Le moteur est tombé en panne lors d'une utilisation normale. Le vendeur me répond que la garantie du fabricant d'un an est expirée et qu'il ne peut rien faire. Est-ce que j'ai vraiment aucun recours ?",
    canton: 'ZH',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 197', 'CO 210', 'CO 205'],
    notes: "Garantie légale 2 ans — CO 197 / CO 210 — CO 197 al. 1 : le vendeur garantit à l'acheteur que la chose livrée est exempte de défauts qui en suppriment ou en diminuent notablement la valeur ou l'utilité. CO 210 al. 1 (révisé 2013) : l'action en garantie se prescrit par 2 ANS dès la livraison pour les meubles. Cette garantie légale CO est DISTINCTE et CUMULATIVE avec la garantie commerciale du fabricant. Le fait que la garantie commerciale (1 an) soit expirée ne supprime PAS la garantie légale CO (2 ans). CONDITIONS : (1) défaut annoncé sans délai dès découverte (CO 201) ; (2) défaut ne résultant pas d'une usure anormale ; (3) présomption favorable acheteur dans les 6 premiers mois (ATF 133 III 229). RECOURS : réduction du prix (CO 205) ou résolution. 'Robot 780 CHF + panne 15 mois + vendeur dit garantie expirée ?' sans 'CO 210 : garantie légale 2 ans INDÉPENDANTE de la garantie commerciale' ni 'CO 197 : action garantie légale possible jusqu'à 24 mois'. Signal adversarial = consommateur confond garantie commerciale (fabricant, 1 an) et garantie légale CO (vendeur, 2 ans).",
  },

  // ENTREPRISE — CO 530 / CO 62 : société simple de fait + enrichissement illégitime, startup sweat equity
  {
    id: 'adv_entreprise_22',
    query: "J'ai travaillé bénévolement pendant 18 mois avec deux amis pour développer une application. On s'était mis d'accord verbalement sur 30% des parts chacun. L'app marche bien, l'entreprise est valorisée à 500'000 CHF. Mes deux associés refusent maintenant de me donner des parts et disent que la promesse verbale n'était pas contraignante. J'ai des emails et messages prouvant ma contribution et l'accord.",
    canton: 'GE',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 530', 'CO 62', 'CO 41'],
    notes: "Société simple de fait + enrichissement illégitime — CO 530 / CO 62-67 — CO 530 : il y a société simple dès que plusieurs personnes s'unissent pour atteindre un but commun en mettant en commun des ressources (ici : travail + compétences + temps). Une société simple de fait se forme même sans contrat écrit si les éléments constitutifs sont présents (apports + but commun + affectio societatis). CO 544 : les associés répondent solidairement et les droits sur les bénéfices sont proportionnels aux apports. PARALLÈLE : CO 62-63 : action en enrichissement illégitime — si la société simple est niée, les 2 fondateurs se sont enrichis de la valeur apportée par le demandeur (travail, code, design) sans cause légitime. CO 41 : si dol prouvé (promesse délibérément mensongère pour exploiter le travail). PREUVES : les emails et messages attestant l'accord et les contributions sont valables (CO 1 + Cst 9). DÉMARCHE : mise en demeure + action en reconnaissance de société simple et partage OU enrichissement illégitime. 'Startup + travail 18 mois + accord verbal 30% + refus ?' sans 'CO 530 : société simple de fait par actes concluants = droits sur les bénéfices' ni 'CO 62 : enrichissement illégitime si société simple niée'. Signal adversarial = fondateur croit que sans contrat écrit signé, aucun droit sur l'entreprise co-créée.",
  },

  // CIRCULATION — LCR 58 / LCR 65 / LCA 21 : conduite véhicule d'autrui, exclusion RC assurance
  {
    id: 'adv_circulation_21',
    query: "J'ai conduit la voiture de mon ami avec sa permission verbale. J'ai percuté un véhicule garé (2'400 CHF de dégâts). L'assurance RC de mon ami a refusé de payer en disant que je ne figure pas comme conducteur autorisé dans la police. Mon ami est hors de lui. Qui doit payer ?",
    canton: 'ZH',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 58', 'LCR 65'],
    notes: "Conduite véhicule d'autrui + exclusion RC — LCR 58 / LCR 65 / LCA 21 — LCR 58 al. 1 : le DÉTENTEUR du véhicule (l'ami propriétaire) est responsable causalement des dommages causés par le véhicule, même s'il ne conduisait pas. LCR 65 : la RC de véhicule est obligatoire. Pour les TIERS (victime du véhicule garé), la LCR impose un paiement direct de l'assureur (LCR 65 al. 2 : l'assureur répond directement envers le lésé). L'exclusion interne (conducteur non inscrit) ne protège PAS la victime tiers. ENTRE ASSUREUR ET ASSURÉ : LCA 21 permet à l'assureur d'exercer un droit de recours contre le détenteur ou le conducteur pour violation des clauses contractuelles. RÉSUMÉ : (1) la victime SERA indemnisée par l'assurance RC ; (2) l'assureur peut exercer un recours contre l'ami (détenteur) et/ou contre le conducteur ; (3) entre ami et conducteur : CO 143/148 pour la répartition interne. 'Voiture ami + accident + assurance RC refuse car non-inscrit ?' sans 'LCR 65 al. 2 : tiers toujours indemnisés même si exclusion contractuelle' ni 'LCA 21 : exclusion RC interne ≠ refus d'indemniser le tiers'. Signal adversarial = conducteur croit que 'exclusion RC' = personne ne sera payé.",
  },

  // ÉTRANGERS — ALCP Annexe I art. 6 / LEI 61a : UE permis B + chômage involontaire maintien séjour
  {
    id: 'adv_etrangers_33',
    query: "Je suis ressortissant espagnol et je vis en Suisse depuis 9 ans avec un permis B UE. J'ai perdu mon emploi il y a 6 mois suite à une restructuration. Je reçois des indemnités chômage et suis inscrit à l'ORP. La police des étrangers me demande de prouver que je retrouverai un emploi dans 3 mois sinon mon permis B ne sera pas renouvelé. Ont-ils le droit ?",
    canton: 'GE',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 61a', 'LEI 43'],
    notes: "UE permis B + chômage involontaire — ALCP Annexe I art. 6 + LEI 61a — ALCP Annexe I art. 6 : les ressortissants UE/AELE qui perdent involontairement leur emploi bénéficient d'un droit de séjour maintenu pendant la recherche d'emploi, à condition d'être inscrits auprès d'un office de placement et d'avoir des chances réelles d'être engagés. LEI 61a al. 1 : le droit de séjour du travailleur UE est maintenu s'il est en chômage involontaire ET inscrit à l'ORP. DURÉE : si le travailleur a exercé plus de 12 mois → maintien 12 mois minimum (ALCP Annexe I art. 6 al. 3). MYTHE ADVERSARIAL : délai 3 mois imposé par la police des étrangers est erroné pour un travailleur UE avec 9 ans d'activité + chômage involontaire + ORP inscrit. Après 12 mois de chômage, réévaluation mais pas suppression automatique. LEI 61a al. 2 : le maintien s'applique aussi aux non-UE qui tombent au chômage involontaire. '9 ans + permis B + chômage involontaire + ORP inscrit + menace non-renouvellement 3 mois ?' sans 'ALCP Annexe I art. 6 : maintien séjour UE chômage involontaire ≥12 mois' ni 'LEI 61a : protection légale chômage involontaire'. Signal adversarial = citoyen UE pense que perdre son emploi = perdre automatiquement son droit de séjour.",
  },

  // DETTES — CO 127 / CO 135 : prescription interrompue par paiements partiels, délai repart à zéro
  {
    id: 'adv_dettes_39',
    query: "Je viens de recevoir un commandement de payer pour un prêt bancaire de 2012 d'un montant de 22'000 CHF. J'avais fait deux petits versements de 500 CHF en 2016 et 400 CHF en 2018 pour montrer ma bonne volonté. La banque dit que la prescription de 10 ans est repartie de zéro à chaque versement et que donc je leur dois encore tout. Ont-ils raison ?",
    canton: 'VD',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 127', 'CO 135'],
    notes: "Prescription + interruption par paiements partiels — CO 127 / CO 135 — CO 127 : prescription ordinaire de 10 ans pour les créances commerciales (prêt bancaire). CO 135 al. 1 : la prescription est interrompue notamment par (let. b) la RECONNAISSANCE DE DETTE — un paiement partiel volontaire vaut reconnaissance de dette et interrompt la prescription. CONSÉQUENCE : après chaque paiement partiel (2016, 2018), le délai de 10 ans REPART À ZÉRO depuis la date du dernier paiement. Si dernier paiement = 2018 → prescription s'achève en 2028. La banque a donc raison sur le principe. MYTHE ADVERSARIAL : le débiteur croit que la prescription court depuis la date originale du prêt (2012) et qu'elle serait prescrite depuis 2022. En réalité, CO 135 let. b : tout paiement = reconnaissance de dette = délai repart. NUANCE : les paiements sans réserve expresse sont des reconnaissances implicites. Pour éviter d'interrompre la prescription, il aurait fallu ne plus payer après la prescription acquise OU payer sous réserve expresse. '22000 CHF + prêt 2012 + versements 2016-2018 + prescription repart ?' sans 'CO 135 al. 1 let. b : paiement partiel = reconnaissance de dette = interruption prescription + délai repart' ni 'délai CO 127 repart depuis chaque paiement'. Signal adversarial = débiteur confond prescription courant depuis l'origine et prescription interrompue par ses propres paiements.",
  },

  // ASSURANCES — LPP 30c / OLP 3a : retrait anticipé LPP logement principal, consentement conjoint obligatoire
  {
    id: 'adv_assurances_22',
    query: "Mon épouse et moi voulons acheter un appartement à Lausanne. J'ai 180'000 CHF dans mon 2e pilier. Je voulais en retirer 120'000 CHF pour financer le projet. Ma caisse de pension me demande une signature de mon épouse en plus de la mienne. Je lui en ai parlé mais elle est réticente. Est-ce vraiment nécessaire qu'elle signe ?",
    canton: 'VD',
    expected_domaine: 'assurances',
    expected_any_article: ['LPP 30c'],
    notes: "LPP retrait anticipé + consentement écrit conjoint obligatoire — LPP 30c al. 5 / OLP 3a — LPP 30c al. 5 : le versement anticipé pour l'acquisition d'un logement principal nécessite le CONSENTEMENT ÉCRIT du conjoint ou du partenaire enregistré. Ce consentement ne peut pas être remplacé par une décision de justice. Si l'épouse refuse, le retrait est bloqué. RATIO : les avoirs LPP accumulés durant le mariage sont soumis au partage en cas de divorce (CC 122/LFLP 22). Permettre un retrait sans consentement permettrait de réduire unilatéralement les avoirs partagés en cas de divorce futur. OLP 3a : le consentement doit être authentifié ou établi par écrit. ALTERNATIVE : l'épouse peut signer mais formuler des conditions (ex. désintéressement de sa quote-part future). MYTHE : le citoyen croit que ses avoirs LPP lui appartiennent entièrement et qu'il peut en disposer librement. En réalité, le régime matrimonial implique des droits de l'autre conjoint sur les avoirs accumulés pendant le mariage. 'LPP + logement + signature conjoint ?' sans 'LPP 30c al. 5 : consentement écrit conjoint OBLIGATOIRE, pas remplaçable par jugement' ni 'OLP 3a : forme écrite authentifiée'. Signal adversarial = époux pense que ses avoirs LPP lui appartiennent exclusivement et que la signature est une simple formalité.",
  },

  // SUCCESSIONS — CC 505 : testament olographe tapé à l'ordinateur = nul
  {
    id: 'adv_successions_21',
    query: "Mon père est décédé il y a 3 semaines. Il avait rédigé un testament sur son ordinateur, l'avait imprimé, signé et daté de sa main. Dans ce document il me laisse tout (j'ai 2 sœurs). Le notaire dit que ce testament n'est peut-être pas valable. Comment est-ce possible ? Il était de plein lucide et avait bien signé.",
    canton: 'GE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 505', 'CC 520'],
    notes: "Testament olographe nul si tapé à l'ordinateur — CC 505 al. 1 — CC 505 al. 1 : pour être valable, le testament olographe doit être ENTIÈREMENT ÉCRIT, daté et signé DE LA MAIN du testateur. Un testament tapé à l'ordinateur ou à la machine à écrire est NUL MÊME s'il est signé et daté manuellement, car la loi exige que TOUT le texte soit manuscrit. CC 520 : les héritiers lésés peuvent demander l'annulation en justice dans l'année suivant la connaissance du vice. ALTERNATIVE VALABLE : testament authentique devant notaire (CC 499/501) ou testament public. CONSÉQUENCE PRATIQUE : si le testament est nul, la succession est réglée par la loi (dévolution légale CC 457ss) : les 3 enfants héritent à parts égales. MYTHE : le citoyen confond 'signature de la main' et 'entièrement écrit de la main'. La signature ne suffit pas — le texte intégral doit être manuscrit. '2 sœurs + testament imprimé signé + notaire conteste ?' sans 'CC 505 al. 1 : testament olographe = TOUT écrit à la main, pas seulement signé' ni 'CC 520 : annulation dans l'année dès connaissance'. Signal adversarial = héritier confond conditions de forme du testament olographe (tout manuscrit) avec une simple signature.",
  },

  // ACCIDENT — CO 41 / CO 44 : piéton hors passage balisé renverse un cycliste, faute concomitante
  {
    id: 'adv_accident_21',
    query: "Je suis cycliste. En traversant une intersection à vitesse normale et sur ma voie, un piéton a surgi d'entre deux voitures en dehors d'un passage piéton balisé. Je n'ai pas pu l'éviter et me suis blessé en chutant (épaule cassée, 6 semaines d'arrêt). Le piéton dit que 'les cyclistes doivent faire attention aux piétons' et refuse de payer. Ai-je un recours ?",
    canton: 'BE',
    expected_domaine: 'accident',
    expected_any_article: ['CO 41', 'CO 44'],
    notes: "Faute concomitante piéton hors passage balisé — CO 41 / CO 44 / LCR 33 — LCR 33 al. 2 : les piétons bénéficient de la priorité sur les passages pour piétons balisés UNIQUEMENT. Hors passage balisé, c'est la circulation ordinaire qui s'applique : le piéton qui traverse doit céder le passage aux véhicules. CO 41 al. 1 : faute du piéton prouvable — surgir entre des voitures hors passage est une violation de la règle de la prudence. CO 44 al. 1 : la faute concomitante de la victime peut réduire son indemnité (et peut même jouer sur la responsabilité des deux parties). MÉCANIQUE : le cycliste (victime blessée) peut invoquer la responsabilité délictuelle du piéton fautif via CO 41. La faute du cycliste (vitesse adaptée ?) sera aussi évaluée. DÉMARCHE : (1) constat de police ou rapport d'incident ; (2) témoins visuels ; (3) demande à l'assurance RC du piéton (si elle existe) ; (4) si pas d'assurance RC : action directe contre le piéton en responsabilité civile. 'Cycliste blessé + piéton hors passage + faute concomitante ?' sans 'LCR 33 : priorité piéton uniquement sur passage BALISÉ — hors passage le piéton doit céder' ni 'CO 41 : faute du piéton + CO 44 : répartition des fautes'. Signal adversarial = cycliste victime croit que 'cyclistes responsables envers piétons' est une règle absolue.",
  },

  // SOCIAL — LAPG 1 / LAPG 8 : indépendant + service civil, droit à l'APG
  {
    id: 'adv_social_19',
    query: "Je suis graphiste indépendant depuis 5 ans. Je dois effectuer 21 jours de service civil le mois prochain. Mes collègues salariés touchent une allocation perte de gain pendant le service. On m'a dit que les indépendants n'ont pas droit à l'APG. Est-ce vrai ?",
    canton: 'ZH',
    expected_domaine: 'social',
    expected_any_article: ['LAPG 1', 'LAPG 8'],
    notes: "APG indépendants service civil/militaire — LAPG 1 / LAPG 8 — LAPG 1 al. 1 : le régime des allocations pour perte de gain (APG) couvre les personnes astreintes au service militaire, au service civil ou à la protection civile QUI EXERCENT UNE ACTIVITÉ LUCRATIVE. Cela inclut explicitement les INDÉPENDANTS. LAPG 8 : l'indemnité est calculée sur le revenu soumis à cotisations AVS (pas sur un salaire). Pour l'indépendant : revenu déterminant = revenu AVS moyen des dernières années. MONTANT : maximum 196 CHF/jour (2024). CONDITIONS : être inscrit à l'AVS et cotiser en tant qu'indépendant. Pratiquement tous les indépendants qui paient l'AVS ont droit à l'APG. MYTHE : l'indépendant croit que l'APG est réservée aux salariés. En réalité l'obligation de service s'accompagne du droit à l'indemnisation quel que soit le statut professionnel. DÉMARCHE : formulaire APG rempli avant le début du service, envoyé à la caisse AVS. 'Graphiste indépendant + 21 jours service civil + APG ?' sans 'LAPG 1 : APG couvre aussi les INDÉPENDANTS astreints au service' ni 'LAPG 8 : calcul sur revenu AVS, pas uniquement sur salaire'. Signal adversarial = indépendant croit à tort que l'APG est exclusivement réservée aux salariés.",
  },

  // FISCAL — Impôt sur gains immobiliers + remploi résidence principale (droit cantonal)
  {
    id: 'adv_fiscal_12',
    query: "J'ai vendu ma maison principale à Zurich après 8 ans (gain net 180'000 CHF). L'agent immobilier m'a dit que je devrai payer environ 40'000 CHF d'impôt sur le gain immobilier. Mais j'ai entendu qu'on pouvait 'remployer' le gain dans un nouvel achat pour éviter l'impôt. Est-ce possible ?",
    canton: 'ZH',
    expected_domaine: 'fiscal',
    expected_any_article: ['LICD', 'StHG 12'],
    notes: "Gain immobilier résidence principale + remploi — droit cantonal — StHG 12 al. 3 let. a (et droit cantonal zurichois § 221 StG ZH) : le gain réalisé sur la vente de la résidence principale PEUT être différé (report d'imposition) si le produit est remployé dans un délai raisonnable (généralement 2 ans) pour acquérir un nouveau logement principal de valeur équivalente ou supérieure. Ce n'est pas une exonération définitive : l'imposition est REPORTÉE à la prochaine vente, avec une durée de possession calculée depuis l'achat original. CONDITIONS : (1) résidence principale effective pendant toute la période ; (2) remploi dans un délai défini (2 ans dans la plupart des cantons) ; (3) le nouveau bien doit lui aussi servir de résidence principale ; (4) la plus-value doit être entièrement réinvestie. MYTHE : le citoyen ne connaît pas l'existence du remploi et croit devoir payer l'impôt immédiatement en toute circonstance. En réalité, le report d'imposition est une option légitime pour les propriétaires qui enchaînent les achats. DÉMARCHE : déclaration à l'administration fiscale cantonale avec preuve du projet d'achat ou de l'achat effectué. '180000 CHF gain + résidence principale + remploi dans achat ?' sans 'StHG 12 al. 3 let. a : report d'imposition si remploi résidence principale' ni 'délai 2 ans et conditions cantonales'. Signal adversarial = vendeur accepte le montant d'impôt sans explorer le remploi.",
  },

  // BAIL — CO 257e al. 3 : intérêts du dépôt de garantie reviennent au locataire
  {
    id: 'adv_bail_44',
    query: "J'ai versé 4'500 CHF de dépôt de garantie (3 mois de loyer) à mon bailleur il y a 6 ans sur un compte bloqué. Mon bail prend fin le mois prochain. Mon bailleur m'a dit que les intérêts du compte (environ 180 CHF) lui reviennent car 'c'est son compte'. Est-ce légal ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 257e'],
    notes: "Intérêts dépôt de garantie reviennent au locataire — CO 257e al. 3 — CO 257e al. 3 : les intérêts portés sur le dépôt de garantie reviennent au LOCATAIRE. Le dépôt de garantie est placé sur un compte bancaire au nom du locataire (et non du bailleur). CO 257e al. 1 : le dépôt est limité à 3 mois de loyer. La banque est le dépositaire neutre : le compte est ouvert au nom du locataire mais bloqué en faveur du bailleur jusqu'au règlement des comptes finaux. CONSÉQUENCE : les intérêts (même modestes avec les taux actuels) s'accumulent au profit du locataire pendant toute la durée du bail. Le bailleur ne peut ni les toucher ni les retenir. RESTITUTION : après restitution de l'appartement et délai de 1 an (CO 257e al. 3), le bailleur dispose d'un délai pour faire valoir ses prétentions. Si aucune réclamation : la banque libère le dépôt + intérêts au locataire. MYTHE : le bailleur croit que les intérêts d'un compte portant son nom (ou son objet) lui reviennent. La réglementation spéciale CO 257e prime le droit commun. 'Dépôt 4500 CHF + 6 ans + intérêts 180 CHF + bailleur réclame intérêts ?' sans 'CO 257e al. 3 : intérêts du dépôt = propriété du LOCATAIRE' ni 'compte dépôt = compte locataire bloqué'. Signal adversarial = locataire accepte la version du bailleur sans connaître CO 257e al. 3.",
  },

  // TRAVAIL — CO 336 al. 2 let. a : licenciement abusif pour activité syndicale
  {
    id: 'adv_travail_44',
    query: "Je travaille depuis 4 ans dans un entrepôt logistique. J'ai rejoint le syndicat de ma branche il y a 3 mois et j'ai participé à une réunion syndicale légale (hors des heures de travail). Deux mois plus tard, mon employeur me licencie en invoquant une 'réorganisation'. Je n'ai pas d'écrit prouvant le lien avec le syndicat. Est-ce que je peux quand même contester ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 336', 'CO 337c'],
    notes: "Licenciement abusif motif syndical — CO 336 al. 2 let. a — CO 336 al. 2 let. a : le congé est abusif lorsqu'il est donné en raison de l'appartenance à une organisation de travailleurs ou en raison d'une activité syndicale légale. Cette protection est EXPLICITE dans la loi. CHARGE DE LA PREUVE : le travailleur doit rendre vraisemblable le motif abusif (pas prouver au-delà de tout doute). La proximité temporelle entre l'adhésion/activité syndicale et le licenciement est un indice fort. CO 337c al. 3 : le juge peut allouer au travailleur une indemnité correspondant à 2 mois de salaire maximum si le licenciement est abusif. PROCÉDURE : opposition par écrit avant la fin du délai de congé (CO 336b al. 1 : délai de 1 mois dès la fin du délai de congé pour agir en justice). MYTHE : le travailleur croit qu'il doit disposer d'une preuve écrite directe du lien causal pour pouvoir agir. En réalité, la vraisemblance + la proximité temporelle suffisent pour ouvrir la procédure, puis le tribunal évalue. 'Syndicat + réunion légale + licenciement 2 mois après + réorganisation prétexte ?' sans 'CO 336 al. 2 let. a : activité syndicale = protection légale explicite contre le congé' ni 'CO 336b : opposition dans le délai de congé obligatoire'. Signal adversarial = employé renonce à contester faute de 'preuve directe' alors que la vraisemblance + temporalité suffisent.",
  },

  // FAMILLE — CC 273 : droit de visite indépendant du paiement de la pension alimentaire
  {
    id: 'adv_famille_38',
    query: "Mon ex-mari n'a pas payé la pension alimentaire des enfants depuis 4 mois (total 6'400 CHF). La prochaine visite est dans 2 semaines. Mon avocat dit que je ne peux pas refuser les visites pour cette raison, mais logiquement il me semble que s'il ne remplit pas ses obligations, il n'a plus le droit de voir les enfants. Qui a raison ?",
    canton: 'FR',
    expected_domaine: 'famille',
    expected_any_article: ['CC 273', 'CC 176'],
    notes: "Droit de visite indépendant de la pension alimentaire — CC 273 — CC 273 al. 1 : le parent qui ne détient pas l'autorité parentale ou la garde a le droit et le devoir d'entretenir des relations personnelles avec l'enfant. Ce droit est FONDAMENTAL et INDÉPENDANT des obligations financières. Refuser les visites à cause des impayés de pension constitue une violation grave de CC 273 qui peut entraîner (1) une sanction du parent gardien, (2) dans les cas graves, un changement de garde au profit du parent non-gardien. VOIES POUR LES IMPAYÉS : (a) saisie de salaire LP 93/132 ; (b) avances cantonales LAF si prévues ; (c) mesures d'exécution via le juge. LES DEUX OBLIGATIONS SONT PARALLÈLES ET INDÉPENDANTES : le non-paiement se règle par les voies financières, pas en supprimant le contact avec l'enfant. INTÉRÊT SUPÉRIEUR DE L'ENFANT (CC 4/296) : maintenir la relation avec les deux parents est dans l'intérêt de l'enfant, indépendamment du conflit financier des parents. MYTHE : confondre obligations financières et droits de visite comme si elles formaient un tout conditionnel. 'Pension impayée 4 mois + refus visite logique ?' sans 'CC 273 : droit de visite INDÉPENDANT du paiement pension' ni 'non-paiement → voies LP, pas suppression visite'. Signal adversarial = parent gardien croit légitimement pouvoir conditionner les visites au paiement.",
  },

  // DETTES — CO 143 / CO 144 : codébiteurs solidaires, créancier peut poursuivre n'importe lequel
  {
    id: 'adv_dettes_40',
    query: "Mon ex-colocataire et moi avions signé un bail ensemble il y a 2 ans. Quand il est parti sans payer les 4 derniers mois de loyer (5'200 CHF au total), le bailleur me réclame maintenant la totalité à moi, alors que je suis parti légalement et que j'ai payé ma part. Il dit que comme on a co-signé, il peut me poursuivre pour TOUT. Est-ce possible ?",
    canton: 'GE',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 143', 'CO 144'],
    notes: "Codébiteurs solidaires — CO 143 / CO 144 — CO 143 al. 1 : lorsque plusieurs débiteurs s'obligent solidairement, le créancier a le droit de réclamer l'exécution totale à n'importe lequel d'entre eux. CO 144 al. 1 : le créancier peut s'adresser à son choix à l'un ou l'autre des débiteurs solidaires pour l'intégralité de la dette, sans devoir d'abord poursuivre l'autre. Le bail co-signé crée une solidarité passive entre les locataires. CONSÉQUENCE : le bailleur A LE DROIT de réclamer la totalité de la dette (5'200 CHF) à celui qui reste solvable, même si ce n'est pas lui qui est parti. RECOURS INTERNE : CO 148 al. 2 — le codébiteur qui a payé plus que sa part dispose d'un recours (action récursoire) contre l'autre codébiteur pour la part de celui-ci. PRATIQUEMENT : le locataire resté devrait (1) payer le bailleur pour éviter la poursuite, (2) exercer son recours CO 148 contre l'ex-colocataire pour 50% (ou selon quote-part convenue). MYTHE : le codébiteur croit que le créancier doit 'équitablement' s'adresser à chaque codébiteur pour sa propre part. La solidarité signifie exactement l'inverse. 'Bail co-signé + colocataire parti + bailleur réclame tout à l'autre ?' sans 'CO 143 : solidarité passive = créancier poursuit QUI IL VEUT pour TOUT' ni 'CO 148 : recours interne contre colocataire débiteur'. Signal adversarial = codébiteur croit à tort que la solidarité est limitée à 'sa part'.",
  },

  // HYBRIDE (bail + successions) — CO 261 / CC 560 : décès du propriétaire, bail transmis aux héritiers
  {
    id: 'adv_hybride_15',
    query: "Mon propriétaire est décédé il y a 6 semaines. Sa fille, qui hérite de l'immeuble, m'a écrit une lettre disant qu'elle reprend le bien pour y habiter et que mon bail est 'automatiquement résilié' au décès de son père. Mon bail court jusqu'en décembre 2026. Dois-je vraiment quitter les lieux ?",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 261', 'CC 560'],
    notes: "Décès propriétaire + transmission du bail aux héritiers — CO 261 / CC 560 — CC 560 : la succession est transmise de plein droit aux héritiers au moment du décès. Parmi les actifs ET les passifs transmis, figurent les baux en cours. CO 261 al. 1 : en cas d'aliénation de la chose louée (vente, donation, succession), le bail passe à l'acquéreur/héritier avec tous les droits et obligations. Le bail N'EST PAS RÉSILIÉ par le décès du bailleur. L'héritière devient le nouveau bailleur aux mêmes conditions. DROIT DE RÉSILIATION POUR BESOIN PROPRE : CO 261 al. 2 let. a — l'acquéreur (héritière ici) peut résilier le bail pour besoin personnel urgent, mais (1) avec le délai de congé légal (CO 266l : formule officielle cantonale) et (2) en respectant le prochain terme légal de résiliation (généralement mars ou septembre selon le canton). La résiliation doit respecter les formes légales et n'est pas 'automatique'. PROTECTION LOCATAIRE : CO 271a al. 1 let. d — dans les 3 ans suivant un transfert, la résiliation pour besoin propre est soumise à conditions strictes (urgence réelle, absence d'alternative). MYTHE : l'héritier croit que le décès du propriétaire met fin automatiquement aux baux en cours. '6 semaines + décès propriétaire + bail jusqu'en dec 2026 + lettre résiliation automatique ?' sans 'CO 261 : bail transmis automatiquement aux héritiers = résiliation automatique INEXISTANTE' ni 'CO 261 al. 2 let. a : besoin propre = procédure avec délais légaux'. Signal adversarial = locataire croit que la lettre informelle de l'héritière a valeur de résiliation légale.",
  },

  // FAMILLE — CC 197 / CC 198 al. 2 let. a : héritage pendant le mariage = bien propre, pas acquêt
  {
    id: 'adv_famille_39',
    query: "Mon mari et moi sommes mariés depuis 12 ans. Sa mère est décédée il y a 4 ans et lui a laissé un appartement estimé à 460'000 CHF. Maintenant qu'on divorce, mon avocate dit que je n'ai pas droit à la moitié de cet appartement parce que c'est un 'bien propre'. Mais il l'a reçu PENDANT notre mariage — comment c'est possible que je n'aie rien ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 197', 'CC 198'],
    notes: "Biens propres par succession vs acquêts — CC 197 / CC 198 al. 2 — CC 197 al. 1 : les acquêts comprennent les biens acquis par un époux à titre onéreux pendant le régime (salaires, revenus, rentes). CC 198 al. 2 : constituent des BIENS PROPRES les biens acquis PAR SUCCESSION ou DONATION, même pendant le mariage. L'appartement hérité est donc un bien propre de l'époux, exclu de la participation aux acquêts lors de la liquidation. CONSÉQUENCE : lors du divorce, l'épouse ne reçoit aucune part de l'appartement hérité. La liquidation ne porte que sur les ACQUÊTS des deux époux (épargne constituée sur salaires, plus-values d'avoirs propres réinvestis en acquêts selon CC 206, etc.). EXCEPTION : si l'appartement a généré des loyers (acquêts) ou si des fonds mixtes ont été utilisés pour sa rénovation (rémunération CC 206 al. 1). MYTHE : 'tout ce qui est reçu/acquis pendant le mariage est automatiquement partagé moitié-moitié'. La distinction propres/acquêts est fondamentale : l'origine du bien (travail vs gratuité) détermine sa qualification, pas la date d'acquisition. 'Appartement hérité pendant le mariage + divorce + pas de part pour l'épouse ?' sans 'CC 198 al. 2 : succession = bien propre, exclu de la participation aux acquêts' ni 'CC 197 : acquêts = biens acquis à titre onéreux (salaire, revenus)'. Signal adversarial = épouse croit que le critère est temporel (pendant le mariage) alors que le critère est la nature de l'acquisition (onéreux vs gratuit).",
  },

  // FISCAL — LIFD 175 vs LIFD 186 : soustraction d'impôts (amende) vs fraude fiscale (pénal)
  {
    id: 'adv_fiscal_13',
    query: "J'ai un appartement que je loue en France depuis 5 ans. Un ami comptable français m'a dit que je devais déclarer ces revenus en France, pas en Suisse. J'ai suivi son conseil. En fait il avait tort — mes revenus auraient dû figurer dans ma déclaration suisse. On parle d'environ 8'000 CHF de revenus locatifs non déclarés par an. Je risque quoi ? La prison ?",
    canton: 'GE',
    expected_domaine: 'fiscal',
    expected_any_article: ['LIFD 175', 'LIFD 186'],
    notes: "Soustraction d'impôts vs fraude fiscale — LIFD 175 vs LIFD 186 — LIFD 175 al. 1 : le contribuable qui soustrait intentionnellement ou par négligence des impôts commet une soustraction punissable d'une amende (en général 1× l'impôt soustrait, jusqu'à 3× en cas de récidive). LIFD 186 : la FRAUDE fiscale = usage de documents faux, falsifiés ou inexacts pour tromper l'autorité. DISTINCTION ESSENTIELLE : une simple omission (ne pas déclarer des revenus) = LIFD 175 → procédure administrative, rappel d'impôt + amende. L'usage de FAUX DOCUMENTS = LIFD 186 → peine privative de liberté jusqu'à 3 ans ou peine pécuniaire. Dans ce cas : aucun faux document, simple omission sur conseil erroné = LIFD 175 uniquement. RAPPEL D'IMPÔT : LIFD 151 → l'AFC peut réclamer 10 ans en arrière. Le contribuable devra payer l'impôt + intérêts moratoires + amende, mais PAS de prison. MYTHE : 'si je n'ai pas déclaré des revenus, je risque la prison'. La prison (LIFD 186) requiert un USAGE DE FAUX. L'omission, même intentionnelle, reste dans le champ administratif (LIFD 175). '8'000 CHF/an × 5 ans non déclaré + conseil comptable erroné + risque prison ?' sans 'LIFD 175 : soustraction = amende administrative, pas de prison' ni 'LIFD 186 : fraude = faux documents uniquement (pas le cas ici)'. Signal adversarial = citoyen assimile non-déclaration et fraude pénale.",
  },

  // SOCIAL — LACI 31 / LACI 32 : réduction de l'horaire de travail (RHT / chômage partiel)
  {
    id: 'adv_social_20',
    query: "L'entreprise où je travaille depuis 7 ans a perdu ses principaux clients à cause d'un contrat annulé. La direction a annoncé qu'on passe de 5 jours à 3 jours de travail par semaine pendant au moins 6 mois. Je garde mon emploi mais je perds 40% de mon salaire. Y a-t-il quelque chose qui compense ces 2 jours perdus ? Mon patron dit que ça s'appelle 'chômage partiel' mais je ne comprends pas comment ça fonctionne.",
    canton: 'ZH',
    expected_domaine: 'assurances',
    expected_any_article: ['LACI 31', 'LACI 32'],
    notes: "Réduction de l'horaire de travail (RHT) — LACI 31 / LACI 32 — LACI 31 al. 1 : les travailleurs ont droit à l'indemnité en cas de réduction de l'horaire de travail (RHT) lorsque l'employeur justifie d'une perte de travail d'au moins 10% due à des raisons économiques. LACI 32 : l'employeur doit faire une demande préalable à l'ORP cantonal (délai : avant le début de la réduction). MONTANT : 80% du salaire perdu (pour les heures chômées), jusqu'à 12 mois en 2 ans (délai-cadre). CONCRÈTEMENT : pour 2 jours perdus sur 5 (40% de réduction) → l'assurance-chômage verse 80% × 40% du salaire = 32% du salaire brut, directement à l'employeur qui reverse au travailleur. CONDITION : le travail doit être temporairement réductible et le poste doit subsister (pas de licenciement envisagé). NB : JPT classe LACI/chômage en domaine 'assurances' et non 'social' (chômage partiel est une branche des assurances sociales). MYTHE : 'je garde mon travail donc l'assurance chômage ne m'aide pas'. La RHT est précisément conçue pour les salariés qui CONSERVENT leur emploi mais travaillent moins. '3 jours sur 5 + 6 mois + 40% salaire perdu ?' sans 'LACI 31 : indemnité RHT compense 80% des heures perdues' ni 'LACI 32 : demande préalable employeur obligatoire'. Signal adversarial = salarié assimile 'chômage partiel' à 'je suis licencié partiellement' plutôt qu'à l'indemnité RHT.",
  },

  // ACCIDENT — CO 58 : responsabilité du propriétaire d'ouvrage (chemin communal mal entretenu)
  {
    id: 'adv_accident_22',
    query: "Je faisais une randonnée sur un sentier officiel balisé dans les Préalpes. Une planche de bois de la passerelle enjambant un ruisseau était pourrie et s'est cassée sous mon pied. Je me suis fracturé le poignet en tombant. Le sentier appartient à la commune. La commune dit qu'elle n'est pas responsable parce que 'c'est en plein air et que les gens randonnent à leurs risques'. Est-ce que j'ai quand même un recours ?",
    canton: 'VD',
    expected_domaine: 'accident',
    expected_any_article: ['CO 58', 'CO 41'],
    notes: "Responsabilité du propriétaire d'ouvrage — CO 58 — CO 58 al. 1 : le propriétaire d'un bâtiment ou de tout autre ouvrage répond des dommages causés par des vices de construction ou par le défaut d'entretien. Cette responsabilité s'applique sans faute prouvée (responsabilité causale simple) : il suffit de démontrer le défaut de l'ouvrage et le lien de causalité. UN SENTIER BALISÉ AVEC INFRASTRUCTURE (passerelle, marches, barrières) = OUVRAGE au sens de CO 58. La commune est propriétaire et a l'obligation d'entretien. Une planche pourrie = défaut d'entretien manifeste → responsabilité de la commune engagée. PREUVE : photos du lieu, rapport médical, certificat médical. CO 41 al. 1 : dommages corporels (frais médicaux, incapacité de gain, tort moral). EXCEPTION : CO 58 al. 2 — le propriétaire peut se libérer en prouvant qu'il a pris tous les soins voulus (inspection régulière, entretien réalisé). MYTHE : 'en plein air + randonnée = risque personnel assumé, pas de recours contre la commune'. CO 58 s'applique aux ouvrages en plein air (route, pont, chemin, passerelle). 'Passerelle commune + planche pourrie + fracture poignet + risque randonnée ?' sans 'CO 58 : propriétaire ouvrage = responsable du défaut d'entretien' ni 'commune = propriétaire d'ouvrage obligée d'entretenir'. Signal adversarial = victime accepte l'argument du 'risque personnel' sans connaître CO 58.",
  },

  // CIRCULATION — LCR 51 : obligation d'attendre ou d'aviser la police après un accident matériel
  {
    id: 'adv_circulation_22',
    query: "En manoeuvrant dans un parking souterrain à 22h, j'ai accroché la portière d'une voiture garée. J'ai laissé un mot sous l'essuie-glace avec mon nom et numéro de téléphone. Deux jours plus tard, la police me contacte pour un 'délit de fuite'. Je pensais qu'un mot suffisait. Est-ce que j'ai vraiment commis une infraction ?",
    canton: 'GE',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 51', 'CP 92'],
    notes: "Devoir d'arrêt et d'annonce après accident — LCR 51 / CP 92 — LCR 51 al. 1 : toute personne impliquée dans un accident doit s'arrêter immédiatement et prendre les mesures de sécurité nécessaires. LCR 51 al. 3 : si l'autre usager est absent (voiture garée), le responsable doit ATTENDRE un temps raisonnable ou AVISER LA POLICE. LAISSER UN MOT ≠ équivalent à aviser la police. Le mot est une bonne démarche mais ne remplit pas formellement l'obligation légale d'annonce (LCR 51 al. 3 : 'la police' ou 'le lésé'). CP 92 : quiconque, après un accident, prend la fuite pour se soustraire à ses obligations → peine privative de liberté jusqu'à 3 ans ou peine pécuniaire. ATTÉNUANT : la bonne foi (laisser un mot = reconnaissance de responsabilité) → peut influencer la peine mais ne supprime pas l'infraction. PROCÉDURE : en GE, signaler immédiatement au 117 ou à la police cantonale même si dommages mineurs. MYTHE : 'un mot avec mes coordonnées suffit à remplir mon obligation après un accrochage sans blessé'. LCR 51 impose soit d'attendre (raisonnablement), soit de contacter la police. 'Note + numéro + voiture garée de nuit + délit de fuite quand même ?' sans 'LCR 51 al. 3 : note ≠ annonce police, obligation soit attendre soit appeler 117' ni 'CP 92 : fuite après accident = infraction pénale même sans blessé'. Signal adversarial = automobiliste croit s'être acquitté de ses obligations par un simple mot.",
  },

  // SUCCESSIONS — CC 488 / CC 491 : substitution fidéicommissaire dans le testament
  {
    id: 'adv_successions_22',
    query: "Ma grand-mère est décédée et a laissé un testament manuscrit signé qui dit : 'Je lègue ma maison à ma fille Isabelle, mais Isabelle devra remettre cette maison à mes petits-enfants (les enfants d'Isabelle) à sa mort.' Isabelle veut vendre la maison maintenant pour financer sa retraite. Peut-elle le faire ou le testament l'interdit ?",
    canton: 'VD',
    expected_domaine: 'successions',
    expected_any_article: ['CC 488', 'CC 491'],
    notes: "Substitution fidéicommissaire — CC 488 / CC 491 — CC 488 al. 1 : le testateur peut instituer un héritier en lui imposant de conserver la succession et de la remettre à un tiers (substitut fidéicommissaire) lors d'un événement déterminé (ici, le décès d'Isabelle). Cette clause EST VALABLE si le tiers (les petits-enfants) est désigné clairement. CC 491 al. 1 : l'héritier grevé (Isabelle) peut jouir de la succession mais ne peut pas EN ALIÉNER les biens soumis à la substitution — elle ne peut donc PAS vendre la maison. CC 491 al. 3 : inscription au registre foncier de la restriction (avertissement d'aliénation). Si Isabelle vend quand même → les petits-enfants peuvent exercer une action en restitution contre l'acquéreur de mauvaise foi. LIMITE : CC 488 al. 3 — la clause ne peut pas viser un tiers au-delà de la génération suivante. Dans ce cas : petits-enfants = génération suivante → valide. NUANCE : Isabelle peut utiliser les FRUITS (revenus locatifs) mais pas aliéner le bien grevé. MYTHE : 'Isabelle hérite de la maison → elle peut en faire ce qu'elle veut'. La substitution fidéicommissaire prive l'héritier du droit d'aliéner. 'Testament olographe + transmission aux petits-enfants au décès + Isabelle veut vendre ?' sans 'CC 488 : substitution fidéicommissaire = héritier grevé ne peut pas aliéner' ni 'CC 491 al. 1 : interdiction d'aliéner inscriptible au registre foncier'. Signal adversarial = héritière croit disposer librement du bien car elle en est 'propriétaire'.",
  },

  // HYBRIDE (bail + travail) — CO 319 / CO 266a : logement de service lié au contrat de travail
  {
    id: 'adv_hybride_16',
    query: "Je suis concierge d'un grand immeuble depuis 9 ans. Mon contrat de travail prévoit que j'occupe le logement de conciergerie au rez-de-chaussée. La PPE (copropriété) vient de me licencier avec 3 mois de préavis. Ils disent que je dois vider le logement en même temps que la fin du contrat. Mon contrat de travail et mon logement sont-ils vraiment liés à ce point ? Dois-je partir en 3 mois ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 319', 'CO 266a'],
    notes: "Logement de service lié au contrat de travail — CO 319 / CO 266a — Lorsque le logement est remis au travailleur EN RAISON du contrat de travail (logement de service ou logement de fonction), il ne constitue pas un bail ordinaire au sens de CO 253ss mais un accessoire du contrat de travail. CO 266a al. 1 : le bail à durée indéterminée peut être résilié. MAIS pour un logement de service : la résiliation du contrat de travail entraîne en principe la fin du droit au logement. CEPENDANT : CO 272 al. 1 s'applique par analogie si le logement constitue la résidence principale — le travailleur peut demander une PROLONGATION du délai de restitution. Selon TF, même un logement de service bénéficie d'une protection minimale : le travailleur ne peut pas être expulsé immédiatement à la fin du contrat si cela crée une situation personnelle difficile. DISTINCTION : si le loyer est payé séparément du salaire → présomption de bail ordinaire avec toute la protection CO 271ss. CONCRÈTEMENT : 3 mois de délai de congé professionnel ≠ automatiquement délai de restitution du logement. Le travailleur doit contester la date de restitution devant l'autorité de conciliation bail. MYTHE : 'logement de service = même délai que contrat de travail'. Le logement de service bénéficie d'une protection autonome, surtout s'il s'agit du domicile principal. 'Concierge + logement contrat lié + licenciement 3 mois ?' sans 'CO 272 : prolongation possible même logement de service' ni 'autorité de conciliation bail compétente'. Signal adversarial = concierge croit ne pas pouvoir contester le délai de restitution.",
  },

  // VOISINAGE — CC 688 : distances minimales pour haies et clôtures végétales
  {
    id: 'adv_voisinage_28',
    query: "Mon voisin a planté une rangée de bambous qui atteignent maintenant 4 mètres de haut, à seulement 30 cm de la limite de propriété entre nos terrains. Ces bambous me privent de soleil l'après-midi et leurs rhizomes envahissent mon jardin. Selon lui, 'les bambous ne sont pas des arbres donc il n'y a pas de règle de distance'. A-t-il raison ?",
    canton: 'VD',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 688', 'CC 679'],
    notes: "Distances haies/clôtures végétales et envahissement rhizomes — CC 688 / CC 679 — CC 688 al. 1 : les cantons règlent les distances à observer lors de la plantation d'arbres et d'arbustes par rapport à la limite des propriétés voisines. En VD, pour les haies et arbustes : plus de 1m50 de hauteur → distance minimale 75cm. Les bambous sont des graminées rhizomateuses mais traités comme des haies végétales — la hauteur détermine la distance minimale. À 4m de hauteur → distance requise = 75cm minimum en VD. Le voisin est à 30cm → INFRACTION. CC 688 al. 2 : si le droit cantonal est silencieux, la distance = moitié de la hauteur (4m → 2m minimum). PROBLÈME SUPPLÉMENTAIRE : CC 679 al. 1 — l'envahissement des rhizomes constitue une perturbation excessive du fonds voisin. L'action est en cessation + dommages et intérêts (CC 679 al. 3). DÉLAI : l'action en réduction à hauteur/distance légale n'est pas prescrite tant que le trouble continue. MYTHE : 'bambou ≠ arbre donc pas de règle de distance'. En droit voisinage suisse, c'est la HAUTEUR et l'effet sur le voisin qui déterminent les règles, pas la classification botanique. '4m bambous + 30cm limite + rhizomes envahissants ?' sans 'CC 688 : distance minimale selon hauteur (VD : min 75cm pour plus de 1m50)' ni 'CC 679 : envahissement rhizomes = trouble excessif du voisinage'. Signal adversarial = propriétaire accepte l'argument 'bambou ≠ arbre' sans connaître CC 688.",
  },

  // ETRANGERS — LEI 50 : maintien de l'autorisation de séjour après dissolution du mariage
  {
    id: 'adv_etrangers_34',
    query: "Je suis ressortissant philippin et je vis en Suisse depuis 6 ans grâce à mon mariage avec une citoyenne suisse. Nous avons deux enfants de 4 et 7 ans nés ici. Ma femme veut divorcer. Elle m'a dit que dès que le divorce sera prononcé, mon permis B sera automatiquement annulé et que je devrai rentrer aux Philippines. Est-ce vraiment le cas ?",
    canton: 'VD',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 50', 'LEI 43'],
    notes: "Maintien de l'autorisation de séjour après dissolution du mariage — LEI 50 — LEI 50 al. 1 let. a : après la dissolution de l'union conjugale, le droit du conjoint à l'autorisation de séjour subsiste si l'union conjugale a duré au moins 3 ans ET si l'intégration est réussie. 6 ans de mariage → condition de durée LARGEMENT remplie. L'intégration est présumée (présence de longue durée, enfants, langue). LEI 50 al. 1 let. b (en alternative) : raisons personnelles majeures — enfants de nationalité suisse ou scolarisés en Suisse = intérêt supérieur des enfants → raison personnelle majeure reconnue par le TF. CC 296 al. 3 / CDE art. 9 : intérêt de l'enfant à maintenir contact avec les deux parents → renforce le droit de séjour du père/mère étranger. PROCÉDURE : le service des migrations examine le dossier APRÈS le divorce. Le permis B n'est PAS automatiquement annulé au jour du jugement de divorce. MYTHE : 'divorce = annulation automatique du permis B du conjoint étranger'. LEI 50 crée un droit propre au séjour après 3 ans de mariage + intégration, indépendant du conjoint suisse. '6 ans mariage + 2 enfants nés en Suisse + divorce + annulation automatique permis B ?' sans 'LEI 50 al. 1 : maintien du séjour après 3 ans de mariage + intégration' ni 'LEI 50 al. 1 let. b : enfants en Suisse = raison personnelle majeure'. Signal adversarial = conjoint étranger croit à une expulsion automatique post-divorce.",
  },

  // ========== WAVE 46 — 10 domaines, angles inédits (bail/travail/dettes/famille/assurances/entreprise/sante/violence/successions/voisinage) ==========

  // BAIL — CO 270 : contestation du loyer initial dans les 30 jours
  {
    id: 'adv_bail_45',
    query: "J'ai signé un bail pour un appartement à Lausanne à 1'980 CHF par mois. En cherchant sur Internet, j'ai trouvé l'annonce de location publiée il y a 3 mois sur un site d'immobilier — le loyer annoncé était exactement le même. Est-ce que je peux encore contester ce loyer, et si oui comment ? Ça fait 3 semaines que j'ai reçu les clés.",
    canton: 'VD',
    expected_domaine: 'bail',
    expected_any_article: ['CO 270', 'CO 269'],
    notes: "Contestation loyer initial dans les 30 jours avec annonce comme preuve de rendement excessif — CO 270 al. 1 : délai de 30 jours dès remise des clés pour saisir l'autorité de conciliation. CO 269 : loyer abusif si rendement excessif ou non conforme aux loyers usuels du quartier. L'annonce de location peut être produite comme preuve. À 3 semaines, le délai de 30 jours est encore ouvert. MYTHE : 'loyer initial non contestable si on a signé le bail'. CO 270 réserve explicitement ce droit même après signature. '1'980 CHF + annonce identique + 3 semaines depuis clés ?' sans 'CO 270 : 30 jours pour contester le loyer initial à compter de la remise des clés'.",
  },

  // TRAVAIL — CO 329d / CO 341 : vacances non compensables en argent en cours d'emploi
  {
    id: 'adv_travail_45',
    query: "Mon employeur m'a proposé de me payer mes 3 semaines de vacances restantes de l'année en argent plutôt qu'en congés, parce qu'on est débordés. Il dit que ça m'arrange aussi car j'aurais besoin de cet argent. Est-ce que j'ai le droit d'accepter ? Mon contrat ne dit rien là-dessus.",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 329d', 'CO 341'],
    notes: "Indemnisation des vacances en argent en cours d'emploi — CO 329d al. 2 : les vacances doivent être accordées pendant le rapport de travail et ne peuvent pas être compensées pécuniairement SAUF lors de la fin du rapport de travail. CO 341 al. 1 : nullité absolue des conventions contraires aux dispositions protectrices du CO sur les vacances — même si le salarié y consent. L'accord proposé est NUL de plein droit. L'employeur doit accorder les vraies vacances. MYTHE : 'l'employeur peut racheter les vacances non prises contre paiement si le salarié accepte'. La protection CO 329d est d'ordre public — le consentement du salarié ne la rend pas valable. '3 semaines vacances + paiement en argent + accord salarié ?' sans 'CO 329d al. 2 : interdiction de compenser les vacances en argent pendant le contrat' ni 'CO 341 : nullité de tout accord contraire, même consenti'.",
  },

  // DETTES — CO 120 / CO 124 : compensation légale de créances réciproques
  {
    id: 'adv_dettes_41',
    query: "Je dois 4'200 CHF à mon ancien associé suite à un jugement. Lui me doit 3'800 CHF de travaux que j'ai effectués pour lui et qu'il n'a pas payés — j'ai une facture acceptée. Est-ce que je peux simplement lui payer la différence de 400 CHF et considérer l'affaire réglée ? Ou dois-je payer les 4'200 CHF et ensuite le poursuivre pour les 3'800 CHF ?",
    canton: 'GE',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 120', 'CO 124'],
    notes: "Compensation légale de créances réciproques exigibles — CO 120 al. 1 : lorsque deux personnes se doivent réciproquement des sommes d'argent, chaque débiteur peut compenser sa dette avec sa créance si les deux créances sont exigibles. CO 124 al. 1 : la compensation s'opère par déclaration faite à l'autre partie. La compensation réduit les deux dettes à concurrence de la plus faible. Si les 3'800 CHF de travaux sont exigibles (facture acceptée = créance liquide), la compensation est valable. Solde restant : 400 CHF dus à l'ancien associé. ATTENTION : si la dette de 4'200 CHF est née d'un jugement, vérifier si une clause d'exécution provisoire bloque la compensation (CPC 336). MYTHE : 'un débiteur ne peut pas unilatéralement compenser — il faut l'accord du créancier'. CO 120/124 permettent la compensation légale par déclaration unilatérale si les conditions sont remplies. '4'200 CHF jugement + 3'800 CHF facture acceptée + compensation possible ?' sans 'CO 120 al. 1 : compensation légale si créances réciproques exigibles' ni 'CO 124 : par déclaration unilatérale'.",
  },

  // FAMILLE — CC 120 / CC 121 : séparation de biens judiciaire pour surendettement
  {
    id: 'adv_famille_40',
    query: "Mon mari a accumulé des dettes importantes à cause de sa société qui a fait faillite — environ 180'000 CHF de créances non couvertes. Nous sommes mariés sous le régime de la participation aux acquêts. Ses créanciers peuvent-ils venir saisir nos biens communs, y compris notre appartement qui est à mon nom ? Est-ce que je peux faire quelque chose pour me protéger ?",
    canton: 'VD',
    expected_domaine: 'famille',
    expected_any_article: ['CC 120', 'CC 121'],
    notes: "Séparation de biens judiciaire pour surendettement — CC 120 al. 1 : un époux peut demander au juge la séparation de biens si son conjoint est surendetté. CC 121 : la séparation de biens peut aussi être demandée si une poursuite a été engagée pour des dettes nées pendant le mariage. RÉGIME DE PARTICIPATION AUX ACQUÊTS : chaque époux répond de ses propres dettes sur ses propres biens (CC 202 al. 1). Les biens propres de l'épouse (appartement à son seul nom) ne peuvent pas être saisis pour les dettes personnelles du mari. MAIS liquidation du régime : à la fin du mariage (divorce ou décès), les acquêts sont partagés — les créanciers du mari peuvent avoir des droits sur sa part de participation. La séparation de biens judiciaire PROTÈGE contre cette liquidation future. Procédure : action devant le tribunal civil. MYTHE : 'séparation de biens = uniquement possible par contrat de mariage notarié'. CC 120 permet la séparation judiciaire en cours de mariage sans contrat. 'Dettes mari 180'000 CHF faillite + appartement à mon nom + saisie possible ?' sans 'CC 202 : responsabilité personnelle des dettes propres' ni 'CC 120 : séparation de biens judiciaire protège contre la liquidation future'.",
  },

  // ASSURANCES — LAVS 35 / LAVS 21 : rente AVS anticipée et réduction permanente
  {
    id: 'adv_assurances_23',
    query: "J'ai 62 ans et je pense prendre ma retraite anticipée de 2 ans. Mon conseiller de la caisse de compensation m'a dit que ma rente AVS serait réduite de 6,8% par année d'anticipation. J'ai entendu dire que cette réduction disparaît dès que j'atteins 65 ans et que ma rente sera ensuite calculée normalement. Est-ce exact ?",
    canton: 'ZH',
    expected_domaine: 'assurances',
    expected_any_article: ['LAVS 35', 'LAVS 21'],
    notes: "Rente AVS anticipée — réduction permanente et définitive — LAVS 35 al. 1 : les personnes qui souhaitent devancer leur rente peuvent le faire dès 63 ans (femmes) ou 63 ans (hommes après réforme AVS 21). La réduction est calculée selon LAVS 35 et le règlement. LAVS 21 : la réduction est PERMANENTE — elle ne disparaît PAS à 65 ans. Un retrait anticipé de 2 ans = réduction de 13,6% (2 × 6,8%) sur TOUTE la durée de vie. Si rente normale à 65 ans = 2'400 CHF/mois → avec anticipation 2 ans = 2'073 CHF/mois À VIE. MYTHE : 'la réduction disparaît à 65 ans et la rente revient au montant normal'. C'est une croyance répandue mais totalement fausse — la réduction est actuarielle et définitive. L'anticipation se calcule sur espérance de vie, pas sur une date calendaire. '62 ans + retraite anticipée 2 ans + réduction 6,8%/an + disparaît à 65 ans ?' sans 'LAVS 35 : réduction PERMANENTE, calculée sur la durée de vie entière' ni 'mythe : récupération à 65 ans = inexistante'.",
  },

  // ENTREPRISE — CO 675 / CO 671 : interdiction de dividendes en cas de perte ou de réserves insuffisantes
  {
    id: 'adv_entreprise_23',
    query: "Notre SA a eu une mauvaise année — nous avons subi une perte de 85'000 CHF. Malgré ça, les trois actionnaires veulent voter en assemblée générale pour se distribuer un dividende de 30'000 CHF puisqu'il reste encore des bénéfices reportés des années précédentes au bilan. Est-ce que c'est légal de voter ce dividende ?",
    canton: 'ZH',
    expected_domaine: 'entreprise',
    expected_any_article: ['CO 675', 'CO 671'],
    notes: "Dividendes interdits en cas de perte et réserves insuffisantes — CO 675 al. 2 : il ne peut être distribué de dividendes que sur le bénéfice résultant du bilan et sur les réserves constituées à cet effet, pour autant que les réserves légales soient entièrement dotées. CO 671 al. 1 : la société doit affecter 5% du bénéfice annuel à la réserve légale jusqu'à ce qu'elle atteigne 20% du capital-actions. ANALYSE : la perte de 85'000 CHF doit d'abord être imputée sur les bénéfices reportés avant toute distribution. Si les réserves légales ne sont pas entièrement dotées, aucun dividende n'est possible. Distribution malgré perte = décision AG nulle (CO 675 al. 2 + CO 706 al. 2). Les administrateurs engagent leur responsabilité CO 754 si une distribution illégale est effectuée. MYTHE : 'l'assemblée générale peut décider librement des dividendes si elle est unanime'. L'AG est liée par CO 675 — l'unanimité ne rend pas légale une distribution prohibée. '85'000 CHF perte + bénéfices reportés + dividende 30'000 CHF + vote AG unanime ?' sans 'CO 675 al. 2 : dividende impossible si perte non couverte / réserves insuffisantes' ni 'nullité de la décision AG contraire'.",
  },

  // SANTE — LAMal 25 / OAMal 12 : médecines complémentaires remboursées sous conditions
  {
    id: 'adv_sante_29',
    query: "Mon médecin de famille pratique l'acupuncture et me l'a prescrite pour des douleurs chroniques au dos. Ma caisse maladie refuse de rembourser en disant que 'les médecines alternatives ne sont pas couvertes par la LaMal'. Mon médecin a un diplôme ASCA reconnu et travaille en cabinet. Est-ce que ma caisse a raison ?",
    canton: 'VD',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 25', 'OAMal 12'],
    notes: "Remboursement des médecines complémentaires par l'AOS — LAMal 25 / OAMal 12 — OAMal 12 : certaines médecines complémentaires (acupuncture, médecine anthroposophique, homéopathie, phytothérapie, médecine chinoise traditionnelle) sont remboursées par l'AOS sous condition que le médecin ait une formation spécifique reconnue par la FMH (Foederatio Medicorum Helveticorum). Diploma ASCA seul = thérapeute non-médecin → non remboursable par l'AOS de base. DISTINCTION CRITIQUE : si le médecin de famille a le TITRE FMH spécialisé (p.ex. 'praticien en médecine chinoise' accrédité FMH), le remboursement est possible. ASCA reconnu ≠ formation FMH. Question à poser : le médecin a-t-il un titre de formation complémentaire reconnu par la FMH ? MYTHE : 'médecines complémentaires = jamais remboursées par la caisse maladie de base'. OAMal 12 les intègre si le médecin a la qualification FMH idoine. 'Acupuncture + médecin cabinet + diplôme ASCA + refus caisse ?' sans 'OAMal 12 : remboursement AOS si médecin avec formation FMH reconnue' ni 'ASCA ≠ qualification FMH suffisante'.",
  },

  // VIOLENCE — CC 28b / CPC 261 : mesures de protection civile indépendantes de la plainte pénale
  {
    id: 'adv_violence_23',
    query: "Mon ex-partenaire (pas un ex-conjoint, juste un ex-petit ami de 2 ans) me harcèle depuis 4 mois — messages incessants, se poste devant chez moi, s'est présenté sur mon lieu de travail. Je n'ai pas envie de porter plainte pénale car j'ai peur des représailles et que ça prenne des mois. Est-ce qu'il existe une protection juridique rapide sans passer par la police ou la procédure pénale ?",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CC 28b', 'CPC 261'],
    notes: "Protection civile contre harcèlement par ex-partenaire non-conjugal — CC 28b al. 1 : en cas de violence, de menaces ou de harcèlement, le tribunal peut interdire à l'auteur de l'atteinte d'approcher la victime, de la contacter ou de la suivre. La mesure est CIVILE et indépendante de toute plainte pénale. CPC 261 : mesures provisionnelles d'urgence sans même entendre l'autre partie si périculum in mora (danger imminent). PROCÉDURE : requête directe au tribunal civil → audition possible en 24-48h → ordonnance d'interdiction d'approche. DURÉE : jusqu'à 2 ans, renouvelable. VIOLATION : constitue une infraction pénale (CP 292). L'ordonnance civile est souvent plus rapide que la procédure pénale (CP 179a, CP 180). La victime n'est pas obligée de porter plainte pénale pour obtenir la protection civile. MYTHE : 'protection juridique contre harceleur = uniquement via plainte pénale, procédure longue'. CC 28b donne accès à une protection civile rapide et autonome. 'Harcèlement ex-petit ami 4 mois + messages + surveillance + pas de plainte pénale voulue ?' sans 'CC 28b : interdiction d'approche civile sans plainte pénale' ni 'CPC 261 : urgence = audition sous 48h'.",
  },

  // SUCCESSIONS — CC 509 / CC 505 : révocabilité du testament notarié
  {
    id: 'adv_successions_23',
    query: "Il y a 10 ans, j'ai fait un testament chez le notaire en faveur de mes deux fils. Depuis, je me suis réconcilié avec ma fille aînée que j'avais exclue, et je veux maintenant la réintégrer dans ma succession. Mon notaire n'est plus disponible. Est-ce que je peux faire un testament écrit à la main qui modifie ou remplace le testament notarié d'il y a 10 ans, ou est-ce que le testament notarié est 'plus fort' ?",
    canton: 'VD',
    expected_domaine: 'successions',
    expected_any_article: ['CC 509', 'CC 505'],
    notes: "Révocabilité du testament et hiérarchie entre formes testamentaires — CC 509 al. 1 : le testateur peut révoquer son testament en tout temps par un acte de même nature ou d'une forme différente postérieure. CC 505 al. 1 : le testament olographe (entièrement écrit, daté, signé de la main du testateur) est une forme valable. Un testament olographe postérieur RÉVOQUE ou MODIFIE le testament notarié antérieur si c'est l'intention du testateur. Il n'y a pas de hiérarchie entre les formes testamentaires — seule la DATE détermine. Le testament le plus RÉCENT prévaut. ATTENTION : l'acte notarié reste au greffe du tribunal ou chez un notaire — il faut soit le révoquer explicitement dans le nouveau testament, soit déposer le nouveau testament auprès du même registre. MYTHE : 'testament notarié = irrévocable, plus fort qu'un testament manuscrit'. CC 509 al. 1 est clair : tout testament peut être révoqué par tout acte testamentaire valable postérieur, quelle qu'en soit la forme. 'Testament notarié 10 ans + réintégrer fille + testament olographe = valable ?' sans 'CC 509 : révocabilité absolue' ni 'CC 505 : testament olographe = forme valable révocatoire'.",
  },

  // VOISINAGE — CC 700 / CC 679 : droit d'accès nécessaire sur fonds voisin pour travaux
  {
    id: 'adv_voisinage_29',
    query: "Je dois refaire le crépi extérieur de mon chalet de montagne. Le mur côté nord est à moins d'un mètre de la limite de propriété — un ouvrier ne peut pas travailler depuis mon terrain. J'ai demandé à mon voisin l'autorisation de poser un échafaudage sur son terrain pour 3 semaines. Il a refusé catégoriquement. Qu'est-ce que je peux faire ?",
    canton: 'FR',
    expected_domaine: 'voisinage',
    expected_any_article: ['CC 700', 'CC 679'],
    notes: "Droit d'accès nécessaire sur fonds voisin pour travaux d'entretien — CC 700 al. 1 : le propriétaire est tenu de permettre que des travaux soient exécutés sur son fonds lorsqu'ils sont nécessaires et ne peuvent être accomplis autrement, moyennant réparation intégrale du dommage éventuel. Ce droit existe même sans accord du voisin et même si le voisin refuse. PROCÉDURE EN CAS DE REFUS : requête de mesures provisionnelles au tribunal civil (CPC 261) pour autorisation d'accéder au fonds voisin — accordée si travaux nécessaires, durée limitée, dommage indemnisé. Le requérant peut offrir de payer une indemnité ou une caution. CC 679 al. 1 : si le refus d'accès crée un préjudice excessif au propriétaire voisin, action en troubles du voisinage envisageable. MYTHE : 'le voisin peut toujours refuser l'accès à son terrain pour des travaux chez moi'. CC 700 crée une servitude légale d'accès temporaire pour travaux nécessaires — le refus n'est pas absolu. 'Crépi mur nord + 1m limite + échafaudage voisin refus + CC 700 accès nécessaire ?' sans 'CC 700 al. 1 : droit d'accès légal si travaux nécessaires' ni 'CPC 261 : mesures provisionnelles pour forcer l'accès si refus'.",
  },

  // CONSOMMATION — CO 199 / CO 197 : exclusion de la garantie des vices entre particuliers
  {
    id: 'adv_consommation_24',
    query: "J'ai acheté une voiture de 8 ans et 110'000 km à un particulier (pas un garage). Le contrat de vente indiquait 'vendu en l'état, sans aucune garantie'. Trois mois après l'achat, la boîte de vitesses lâche — réparation estimée à 4'800 CHF. Le vendeur refuse de payer quoi que ce soit en invoquant la clause 'sans garantie'. Puis-je quand même m'appuyer sur la garantie légale de 2 ans ?",
    canton: 'BE',
    expected_domaine: 'consommation',
    expected_any_article: ['CO 199', 'CO 197'],
    notes: "Exclusion de la garantie des vices entre particuliers — CO 199 / CO 197 — CO 197 al. 1 : le vendeur est tenu de garantir l'acheteur tant en raison des qualités promises que des défauts qui enlèvent à la chose sa valeur ou son utilité prévue. MAIS CO 199 : les parties PEUVENT, lors d'une vente entre particuliers, exclure ou restreindre la garantie par convention. La clause 'vendu en l'état, sans garantie' EST VALABLE entre particuliers — contrairement aux ventes B2C (professionnel-consommateur) où l'exclusion est interdite. CONSÉQUENCE : l'acheteur ne peut en principe pas se prévaloir de CO 197 pour une boîte de vitesses défectueuse. EXCEPTION IMPÉRATIVE : CO 199 in fine — l'exclusion de garantie est NULLE si le vendeur a dissimulé frauduleusement le défaut (dol). Si le vendeur savait que la boîte de vitesses était en mauvais état et l'a caché → exclusion nulle → garantie entière. PREUVE : rapport de garage antérieur, historique entretien, témoins. DÉLAI : CO 210 al. 1 — 2 ans à partir de la livraison pour agir en garantie (si la clause est annulée pour dol). MYTHE : 'la garantie légale de 2 ans s'applique toujours, même entre particuliers, même avec clause d'exclusion'. Entre particuliers, CO 199 permet d'exclure la garantie valablement SAUF dol. 'Voiture particulier + clause sans garantie + boîte vitesses 3 mois ?' sans 'CO 199 : exclusion de garantie VALABLE entre particuliers sauf dol' ni 'exception dol : si vendeur savait = exclusion nulle'. Signal adversarial = acheteur croit que la garantie légale 2 ans est d'ordre public et ne peut pas être écartée.",
  },

  // BAIL — CO 259a / CO 259b : remèdes pour défaut non réparé par bailleur
  {
    id: 'adv_bail_46',
    query: "Mon appartement a des infiltrations d'eau par le toit depuis 8 mois. J'ai signalé le problème à mon bailleur par écrit à trois reprises — aucune réaction. Les dégâts s'aggravent (moisissures sur deux murs). Mon loyer est de 1'650 CHF/mois. Quels sont mes droits exacts ? Est-ce que je peux juste arrêter de payer ?",
    canton: 'GE',
    expected_domaine: 'bail',
    expected_any_article: ['CO 259a', 'CO 259b'],
    notes: "Remèdes du locataire pour défaut non réparé par bailleur — CO 259a liste les 4 remèdes cumulables : réduction de loyer, réparation aux frais du bailleur si urgent, dommages-intérêts, résiliation anticipée. CO 259b al. 1 : si défaut grave → locataire peut fixer délai de réparation au bailleur, puis — si pas réparé — résilier avec délai de 30 jours pour fin de mois (CO 259b al. 2). CO 259c : locataire peut faire réparer aux frais du bailleur si réparation urgente + bailleur inaccessible/refuse. DÉPÔT LOYER : CO 259g — locataire peut consigner le loyer auprès du tribunal pour forcer le bailleur à agir — PAS une cessation unilatérale de paiement. PROCÉDURE CORRECTE : (1) mise en demeure écrite avec délai fixé, (2) si inaction → requête autorité conciliation bail (GE : Tribunal des baux), (3) consignation loyer via juge si bailleur persiste. MYTHE : 'la seule option est de demander une réduction de loyer' ou pire 'je peux arrêter de payer'. Arrêter unilatéralement = risque de résiliation pour défaut de paiement (CO 257d). Le remède officiel est la consignation judiciaire. 'Infiltrations eau 8 mois + moisissures + bailleur ne répond pas + GE ?' sans 'CO 259b : résiliation pour défaut grave si bailleur n'agit pas après délai' ni 'CO 259g : consignation du loyer via tribunal — PAS arrêt unilatéral'. Signal adversarial = locataire croit que réduction de loyer est le seul outil ou qu'il peut juste cesser de payer.",
  },

  // TRAVAIL — CO 329a / CO 329b : minimum légal de vacances annuelles
  {
    id: 'adv_travail_46',
    query: "Je travaille chez le même employeur depuis 22 ans. J'ai toujours eu 4 semaines de vacances par an. Un collègue m'a dit que la loi prévoit 5 semaines après 20 ans d'ancienneté. Mon contrat ne mentionne que 4 semaines. Ai-je droit à une 5e semaine ?",
    canton: 'ZH',
    expected_domaine: 'travail',
    expected_any_article: ['CO 329a', 'CO 329b'],
    notes: "Minimum légal de vacances annuelles indépendant de l'ancienneté — CO 329a al. 1 : 4 semaines de vacances payées par an pour tous les travailleurs adultes. CO 329a al. 3 : 5 semaines pour les travailleurs de moins de 20 ans. Il N'EXISTE PAS de droit légal à une 5e semaine après 20 ans d'ancienneté — cette règle n'existe PAS dans le CO. SOURCES POSSIBLES D'UNE 5e SEMAINE : (1) convention collective de travail (CCT) applicable au secteur, (2) contrat individuel qui accorde plus que le minimum légal, (3) usage d'entreprise constant et non équivoque. CO 329b : règles sur le report des vacances non prises. VÉRIFIER : la CCT applicable à l'employeur en ZH (ex : CCT construction, CCT hôtellerie, etc.) peut effectivement prévoir 5 semaines — mais c'est la CCT, pas le CO. MYTHE : 'après 20 ans, la loi garantit une 5e semaine de vacances'. Le CO garantit 4 semaines (et 5 semaines pour les moins de 20 ans) sans égard à l'ancienneté. L'ancienneté n'est pas un critère du droit légal aux vacances. 'Vacances 4 semaines + 22 ans ancienneté + ZH ?' sans 'CO 329a : 4 semaines minimum légal = plafond du CO, pas de 5e semaine selon l'ancienneté' ni 'vérifier CCT applicable pour bonification conventionnelle'. Signal adversarial = travailleur croit que l'ancienneté crée un droit légal à plus de vacances.",
  },

  // DETTES — CO 62 / CO 63 : enrichissement illégitime et répétition de l'indu
  {
    id: 'adv_dettes_42',
    query: "J'ai payé deux fois la même facture de 1'800 CHF à mon fournisseur d'électricité — une fois par virement automatique et une fois manuellement. Le service client admet l'erreur mais dit qu'ils ont 'déjà réparti le montant dans les comptes' et ne peuvent pas rembourser. Est-ce que je peux exiger le remboursement ?",
    canton: 'VD',
    expected_domaine: 'dettes',
    expected_any_article: ['CO 62', 'CO 63'],
    notes: "Répétition de l'indu — enrichissement illégitime — CO 62 al. 1 : celui qui, sans cause légitime, s'est enrichi aux dépens d'autrui, est tenu à restitution. CO 63 al. 1 : celui qui a payé volontairement ce qu'il ne devait pas peut répéter ce qu'il a payé s'il prouve qu'il a payé en croyant, par erreur, qu'il était débiteur. La bonne foi du créancier ou le fait qu'il ait 'déjà réparti le montant' NE constitue PAS une cause légitime — il reste tenu à restitution. EXCEPTION : CO 63 al. 2 — répétition exclue si le créancier a détruit ses preuves de créance ou renoncé à une sûreté de bonne foi en se fondant sur le paiement. MAIS : un double paiement d'une facture d'électricité ne tombe pas dans cette exception (le créancier ne détruit pas de preuves). DÉLAI : CO 67 — 1 an dès connaissance de l'enrichissement + 10 ans depuis l'acte générateur. PROCÉDURE : mise en demeure écrite → commandement de payer LP si refus → puis action en restitution. MYTHE : 'si le destinataire est de bonne foi et a déjà dépensé l'argent, il peut le garder'. CO 62 ne connaît pas la bonne foi comme cause de conservation — il suffit que l'enrichissement soit sans cause. 'Double paiement facture + fournisseur refuse remboursement + VD ?' sans 'CO 62 : enrichissement illégitime — bonne foi du créancier ne l'exonère pas' ni 'CO 63 : répétition de l'indu si paiement par erreur'. Signal adversarial = débiteur croit que la bonne foi ou la comptabilité interne du créancier peut bloquer la répétition.",
  },

  // FAMILLE — CC 163 / CC 164 : contribution du conjoint au foyer et argent du ménage
  {
    id: 'adv_famille_41',
    query: "J'ai arrêté de travailler il y a 8 ans pour m'occuper de nos trois enfants, avec l'accord de mon mari. Il gère les finances et me remet une somme mensuelle 'pour les courses'. Je voudrais avoir accès à plus d'argent pour mes dépenses personnelles (vêtements, sorties, etc.). Mon mari dit que c'est 'son salaire, ses règles'. A-t-il raison ?",
    canton: 'FR',
    expected_domaine: 'famille',
    expected_any_article: ['CC 163', 'CC 164'],
    notes: "Droit à une somme personnelle du conjoint au foyer — CC 163 : chaque époux contribue selon ses facultés à l'entretien convenable de la famille. CC 164 al. 1 : le conjoint qui assume la gestion du ménage ou qui s'occupe des enfants a droit à recevoir régulièrement une somme d'argent appropriée pour couvrir ses besoins personnels. Ce droit est IMPÉRATIF — il ne peut pas être écarté par accord entre époux. 'Approprié' = prend en compte le niveau de vie de la famille, les besoins réels du conjoint. CC 164 al. 2 : en cas de désaccord sur le montant, le juge fixe. PROCÉDURE EN CAS DE REFUS : requête au juge de la famille (FR : Tribunal civil) pour fixer le montant de la somme personnelle. CC 163 : les charges communes incluent aussi l'éducation des enfants — contribution en nature valorisée. MYTHE : 'les revenus du salariant lui appartiennent seuls et il peut fixer unilatéralement ce qu'il donne à son conjoint'. CC 164 crée un droit légal impératif à une somme personnelle. Le travail domestique est une contribution économique équivalente au salaire. 'Conjoint foyer 8 ans + mari gère finances + somme insuffisante + FR ?' sans 'CC 164 al. 1 : droit impératif à une somme personnelle appropriée' ni 'juge peut fixer le montant si désaccord'. Signal adversarial = conjoint au foyer croit que l'autre peut décider seul de la somme.",
  },

  // ÉTRANGERS — LEI 38 / ALCP Annexe I art. 24 : retraité UE en Suisse
  {
    id: 'adv_etrangers_35',
    query: "Je suis citoyen belge à la retraite, j'ai 68 ans et je perçois une pension de l'État belge. Je souhaite m'installer définitivement à Lausanne pour être proche de mes enfants suisses. On m'a dit que les retraités étrangers doivent demander un visa de long séjour et prouver qu'ils ne demanderont jamais l'aide sociale. Quelle est la procédure exacte ?",
    canton: 'VD',
    expected_domaine: 'etrangers',
    expected_any_article: ['LEI 38', 'ALCP'],
    notes: "Droit de séjour du retraité UE/AELE en Suisse — ALCP Annexe I art. 24 : les ressortissants UE qui ne sont pas ou plus actifs en Suisse ont le droit de séjourner en Suisse s'ils ont des moyens financiers suffisants et sont couverts par une assurance maladie. Ce droit découle DIRECTEMENT de l'ALCP — pas d'un visa. PROCÉDURE : demande d'autorisation de séjour à l'office cantonal des migrations VD (SPOP), avec : passeport UE valide, preuve de moyens financiers (pension, épargne), attestation d'assurance maladie suisse (LAMal obligatoire dès 3 mois). LEI 38 : la Suisse délivre une autorisation de séjour UE/AELE (permis B) sans condition de réciprocité formelle si conditions ALCP remplies. PAS de visa de long séjour requis — les citoyens UE entrent sans visa et demandent le permis directement à l'arrivée dans les 90 jours (ALCP art. 1). MYTHE : 'les retraités UE doivent obtenir un visa de long séjour avant d'arriver'. Les citoyens UE/AELE bénéficient du droit d'entrée sans visa en vertu de l'ALCP — le visa de long séjour est pour les ressortissants d'États tiers (hors UE/AELE). 'Retraité belge + pension belge + installation VD + enfants suisses ?' sans 'ALCP Annexe I art. 24 : droit de séjour retraité UE direct — pas de visa requis' ni 'permis B UE/AELE à demander à l'arrivée via SPOP'. Signal adversarial = citoyen UE croit qu'il doit suivre la procédure visa des ressortissants tiers.",
  },

  // CIRCULATION — LCR 16 / LCR 16a : graduation des mesures administratives
  {
    id: 'adv_circulation_23',
    query: "J'ai reçu une amende d'ordre pour un excès de vitesse de 7 km/h dans une zone à 50 (mesuré à 57 km/h après déduction). C'est ma première infraction. Mon permis de conduire est indispensable pour mon travail. Mon employeur m'a dit que 'tout excès de vitesse entraîne automatiquement un retrait de permis'. Est-ce vrai ?",
    canton: 'BE',
    expected_domaine: 'circulation',
    expected_any_article: ['LCR 16', 'LCR 16a'],
    notes: "Graduation des mesures administratives LCR — LCR 16 définit 3 catégories : infractions légères (LCR 16a), moyennement graves (LCR 16b), graves (LCR 16c). LCR 16a al. 1 : infraction légère = violation mineure des règles de circulation, faute légère, absence de danger concret. Conséquence : ADMONESTRATION uniquement — pas de retrait de permis, sauf récidive (LCR 16a al. 2 : retrait si 2e infraction légère dans les 2 ans). EXCÈS 7 KM/H ZONE 50 : catégorie légère selon la jurisprudence fédérale si première infraction et pas de circonstances aggravantes. L'amende d'ordre confirme souvent la qualification légère. MESURE = admonestration seulement. RETRAIT DE PERMIS : LCR 16b (infraction moyennement grave, ex : 20 km/h de plus) ou LCR 16c (grave, ex : 30 km/h de plus en localité). LCR 16c al. 1 let. a : en zone 50, excès de 30 km/h ou plus = infraction grave → retrait 3 mois minimum. MYTHE : 'toute infraction LCR = retrait automatique de permis'. Pour les infractions légères (1re), la loi prévoit l'admonestration — pas de retrait. 'Excès 7 km/h zone 50 + première infraction + amende d'ordre + BE ?' sans 'LCR 16a : infraction légère → admonestration seulement, pas de retrait' ni 'retrait seulement si 2e infraction légère dans les 2 ans ou si infraction moyennement grave/grave'. Signal adversarial = conducteur croit que tout excès de vitesse déclenche automatiquement un retrait.",
  },

  // VIOLENCE — CP 126 al. 2 : voies de fait répétées entre partenaires — poursuite d'office
  {
    id: 'adv_violence_24',
    query: "Mon mari me bouscule et me saisit brutalement par les bras depuis des mois, souvent devant nos enfants. Il ne me frappe pas au visage et dit que 'ce n'est pas de la violence'. J'ai déposé une plainte mais je voudrais maintenant la retirer car j'ai peur des conséquences financières pour la famille. Est-ce que je peux retirer ma plainte et arrêter les poursuites ?",
    canton: 'GE',
    expected_domaine: 'violence',
    expected_any_article: ['CP 126', 'LAVI'],
    notes: "Voies de fait répétées entre partenaires — poursuite d'office — CP 126 al. 1 : voies de fait punissables sur plainte. CP 126 al. 2 let. b : EXCEPTION — voies de fait répétées entre partenaires (dans le cadre d'une relation de couple ou d'une relation similaire) = poursuite D'OFFICE. Le retrait de plainte n'arrête PAS les poursuites si le ministère public maintient l'accusation. CPP 55a : en matière de violence domestique, le ministère public peut suspendre la procédure si la victime le demande, mais il peut aussi maintenir les poursuites dans l'intérêt public. AUTORITÉ COMPÉTENTE GE : Ministère public genevois + LAVI (aide aux victimes). LAVI art. 14 : droit à une consultation gratuite et confidentielle, aide financière. PROTECTION : mesures d'éloignement (CC 28b) indépendantes de la plainte pénale. MYTHE : 'retirer ma plainte suffit à stopper les poursuites'. Pour les voies de fait répétées entre partenaires (CP 126 al. 2), c'est une infraction poursuivie d'office — le MP peut continuer même sans la victime. 'Bousculades répétées + mari + GE + retrait plainte ?' sans 'CP 126 al. 2 : voies de fait répétées entre partenaires = infraction d'office — retrait ne suffit pas' ni 'CPP 55a : le MP peut maintenir malgré la suspension demandée'. Signal adversarial = victime croit avoir le contrôle total sur l'arrêt des poursuites.",
  },

  // ASSURANCES — LPP 2 : seuil d'assujettissement obligatoire LPP
  {
    id: 'adv_assurances_24',
    query: "Je travaille comme aide à domicile auprès de plusieurs ménages à temps partiel. Mon employeur principal m'emploie environ 12 heures par semaine pour un salaire annuel de 13'500 CHF. Il me dit que je ne suis pas soumise à la LPP et qu'il ne cotise pas pour ma prévoyance professionnelle. Est-ce correct ?",
    canton: 'ZH',
    expected_domaine: 'assurances',
    expected_any_article: ['LPP 2', 'LPP 46'],
    notes: "Seuil d'assujettissement obligatoire LPP — LPP 2 al. 1 : les salariés qui ont plus de 17 ans ET dont le salaire annuel dépasse le seuil d'entrée (CHF 22'050 en 2024, soit 3/4 de la rente AVS maximale simple) sont soumis obligatoirement à la LPP. CONSÉQUENCE : salaire 13'500 CHF/an < 22'050 CHF = PAS d'assujettissement LPP obligatoire pour cet employeur. L'employeur a techniquement raison. CUMUL MULTI-EMPLOYEURS : LPP 46 — si plusieurs employeurs, les salaires peuvent être additionnés pour dépasser le seuil ; dans ce cas, le travailleur peut demander à s'assurer auprès de l'institution supplétive (Fondation institution supplétive LPP). SALAIRE COORDONNÉ : LPP 8 — seul le salaire entre 25'725 CHF et 88'200 CHF est « coordonné » et cotise. AVS toujours obligatoire : indépendamment du seuil LPP, les cotisations AVS/AI/APG sont dues dès le 1er franc. MYTHE : 'tout salarié en Suisse a obligatoirement une LPP'. La LPP n'est obligatoire que si le salaire annuel dépasse CHF 22'050 chez le même employeur. Les temps partiels à faible revenu sont souvent exclus. 'Aide à domicile + 12h/semaine + 13'500 CHF/an + ZH ?' sans 'LPP 2 : seuil 22'050 CHF — en dessous, pas d'assujettissement obligatoire' ni 'LPP 46 : cumul multi-employeurs possible via institution supplétive'. Signal adversarial = salariée croit que la LPP est universelle dès le 1er franc de salaire.",
  },

  // SANTÉ — LAMal 31 / OAMal 17-18 : soins dentaires remboursés si maladie grave
  {
    id: 'adv_sante_30',
    query: "Je suis traité pour un cancer de la gorge avec radiothérapie intensive de la mâchoire. Le traitement a provoqué une ostéoradionécrose mandibulaire — j'ai besoin de soins dentaires lourds estimés à 9'000 CHF. Mon assureur LAMal refuse de couvrir en disant 'la LAMal ne rembourse pas les soins dentaires'. Est-ce vrai ?",
    canton: 'VD',
    expected_domaine: 'sante',
    expected_any_article: ['LAMal 31', 'OAMal 18'],
    notes: "Soins dentaires remboursés par l'AOS si causés par une maladie grave — LAMal 31 al. 1 let. a : l'AOS prend en charge les soins dentaires causés par une maladie grave et non évitable de l'appareil masticatoire. LAMal 31 al. 1 let. b : l'AOS prend en charge les soins dentaires causés par une autre maladie grave ou ses séquelles. OAMal 17 et 18 : liste positive des maladies graves ouvrant droit aux soins dentaires — inclut explicitement les tumeurs malignes irradiées (ostéoradionécrose est une séquelle directe de la radiothérapie pour cancer). PROCÉDURE : demande préalable à la caisse LAMal avec rapport médical + rapport du médecin-dentiste + rapport d'oncologie. Délai de réponse 30 jours. En cas de refus : opposition puis recours au tribunal cantonal des assurances (VD : Cour des assurances sociales). AUTRES CAS DE REMBOURSEMENT : maladies systémiques graves (leucémie, hémophilie, immunodépression), malformations congénitales graves de la mâchoire. MYTHE : 'la LAMal ne rembourse jamais les soins dentaires'. LAMal 31 prévoit une exception importante : soins dentaires causés par une maladie grave ou ses traitements (radiothérapie, chimiothérapie). L'ostéoradionécrose mandibulaire post-radio est un cas classiquement couvert. 'Radiothérapie gorge + ostéoradionécrose + 9'000 CHF + VD ?' sans 'LAMal 31 : soins dentaires remboursés si séquelle de maladie grave' ni 'OAMal 18 : liste des maladies graves incluant tumeurs irradiées'. Signal adversarial = patient croit que l'exclusion dentaire est absolue et universelle.",
  },

  // SUCCESSIONS — CC 602 / CC 648 : droits des co-héritiers sur l'immeuble indivis
  {
    id: 'adv_successions_24',
    query: "Mon père est décédé il y a 6 mois. Nous sommes 3 héritiers : mon frère (50%), ma sœur (25%) et moi (25%). La succession comprend une maison valant 600'000 CHF. Mon frère dit qu'il est majoritaire et qu'il peut signer seul une promesse de vente avec un acheteur. Ma sœur et moi refusons de vendre. A-t-il le droit de vendre sans notre accord ?",
    canton: 'GE',
    expected_domaine: 'successions',
    expected_any_article: ['CC 602', 'CC 648'],
    notes: "Unanimité requise pour les actes dispositifs sur la succession — CC 602 al. 2 : les héritiers exercent en commun les droits de la succession et disposent en commun des biens successoraux. CC 648 al. 1 : chaque communiste (co-héritier) peut faire des actes d'administration nécessaires et urgents sans le consentement des autres. CC 648 al. 2 : pour les actes d'administration ordinaire, la majorité en parts décide. CC 648 al. 3 : pour les ACTES DISPOSITIFS (aliénation, constitution de droits réels, etc.) → UNANIMITÉ requise. CONSÉQUENCE : vente d'un immeuble = acte dispositif → unanimité des co-héritiers requise. Le frère avec 50% ne peut PAS signer une promesse de vente valable sans l'accord des deux autres. PROTECTION : si le frère tente quand même, les co-héritiers peuvent requérir une inscription d'une restriction au RF (CC 960) pour bloquer toute vente. PARTAGE FORCÉ : si mésentente persistante, tout héritier peut demander le partage judiciaire (CC 604). MYTHE : 'l'héritier avec la moitié des parts peut décider seul de vendre'. Pour les actes dispositifs sur l'immeuble indivis, la loi exige l'unanimité — la majorité en parts ne suffit pas (c'est réservé aux actes d'administration). 'Succession 50%/25%/25% + maison + frère veut vendre seul + GE ?' sans 'CC 602 + CC 648 al. 3 : unanimité requise pour vente = acte dispositif' ni 'restriction au RF pour bloquer une vente sans accord'. Signal adversarial = héritier croit que la majorité en parts équivaut à un pouvoir de décision exclusif.",
  },
];

export const TOTAL_ADVERSARIAL = ADVERSARIAL_CASES.length;
