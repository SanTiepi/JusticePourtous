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
];

export const TOTAL_ADVERSARIAL = ADVERSARIAL_CASES.length;
