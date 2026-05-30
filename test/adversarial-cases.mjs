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
    expected_any_article: ['CO 394', 'CC 41', 'CO 97'],
    notes: "Responsabilité médicale civile — vocabulaire : 'erreur de technique' plutôt que 'faute médicale'. Relation médecin-patient = mandat CO 394. Responsabilité délictuelle CC 41. Expertise médicale indépendante recommandée.",
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
];

export const TOTAL_ADVERSARIAL = ADVERSARIAL_CASES.length;
