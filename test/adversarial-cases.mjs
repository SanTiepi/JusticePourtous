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
    expected_domaine: 'social',
    expected_any_article: ['Cst 12', 'LAMal 65', 'LIAS 5'],
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
    expected_domaine: 'sante',
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
    expected_domaine: 'famille',
    expected_any_article: ['CC 457', 'CC 462', 'CC 481', 'CC 652'],
    notes: "Concubin survivant sans testament — CC 457 : en l'absence de descendants, les collatéraux (frères et sœurs) héritent par représentation. Le concubin non marié N'A AUCUN droit successoral légal (CC 457 ne mentionne pas le partenaire de vie). CC 462 : seul le conjoint marié ou partenaire enregistré (LPart) bénéficie d'une quote-part légale. Sur l'appartement acheté à 50/50 (CC 652 — copropriété) : les héritiers ne peuvent forcer la vente qu'en demandant la licitation (action en partage CC 650). Le concubin possède sa part de 50% et ne peut pas être expulsé sans son accord. CC 481 : le de cujus aurait pu avantager son partenaire par testament (jusqu'à la quotité disponible). '15 ans ensemble + décédé + famille dit tout hériter + appartement 50/50' sans 'CC 457' ni 'copropriété'. Signal adversarial = confusion entre héritage légal (nul pour concubin) et droits de copropriété (protégés).",
  },
];

export const TOTAL_ADVERSARIAL = ADVERSARIAL_CASES.length;
