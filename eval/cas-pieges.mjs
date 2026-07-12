/**
 * ⚠ L'ORACLE — ce qui sauve un droit, et ce qui le tue
 *
 * ═══ POURQUOI CE FICHIER A ÉTÉ RÉÉCRIT DE FOND EN COMBLE (2026-07-12) ═══════
 *
 * Première version : des expressions régulières cherchant des mots-clés dans la réponse.
 * Elle a menti TROIS FOIS EN UN JOUR, et chaque fois dans le sens confortable :
 *   · elle a puni le comité à tort (elle sanctionnait la présence du texte « 336b », alors que
 *     le juge menait correctement avec la nullité de l'art. 336c et n'ajoutait l'opposition
 *     qu'en précaution, dans la même lettre — de la bonne pratique) ;
 *   · elle a absous le modèle gratuit à tort (elle cherchait « envoyez » là où il écrivait
 *     « envoyer », et comptait « tribunal cantonal » comme piège trouvé alors que ces mots
 *     décrivaient la MAUVAISE procédure) ;
 *   · elle a crié à l'erreur sur la phrase « lettre de RECOURS (pas une opposition) » —
 *     c'est-à-dire sur la seule bonne réponse que le comité ait jamais produite.
 * Un regex ne voit pas une négation. Il ne pouvait pas mesurer du droit.
 *
 * ⚠ ET L'ORACLE LUI-MÊME ÉTAIT FAUX. Un audit contre Fedlex a trouvé 2 erreurs sur 4, TOUTES
 * DANS LE SENS RASSURANT — le pire des biais possibles ici :
 *   · j'avais écrit que, passé le délai d'opposition, « le créancier devra de toute façon
 *     obtenir la mainlevée devant un juge, où le débiteur peut se défendre ». C'EST FAUX.
 *     Art. 88 al. 1 LP : « Lorsque la poursuite n'est pas suspendue par l'opposition ou par un
 *     jugement, le créancier peut requérir la continuation de la poursuite ». Art. 89 LP :
 *     l'office « procède SANS RETARD à la saisie ». Aucun juge ne vient vérifier que la dette
 *     existe. J'avais INVENTÉ UN FILET DE SÉCURITÉ — une fausse bonne nouvelle, qui endort
 *     quelqu'un pendant que la saisie arrive.
 *   · j'avais collé un délai de « 30 jours » sur l'art. 336b CO, où ce chiffre n'existe pas.
 *
 * Ce projet a déjà eu TROIS instruments incapables d'annoncer une mauvaise nouvelle : un
 * benchmark dont le score du concurrent était écrit en dur (« ×6.4 »), un badge « vérifié »
 * apposé par le LLM qui avait écrit la fiche, et 282 « invariants de régression » générés
 * depuis les fiches qu'ils étaient censés contrôler (ils passaient au rouge quand on corrigeait
 * une erreur de droit). Celui-ci est le quatrième. Il a le droit de dire non.
 *
 * ═══ COMMENT IL EST CONSTRUIT MAINTENANT ═══════════════════════════════════
 *
 * Chaque cas définit une LISTE FERMÉE d'actes possibles. Un agent-transcripteur range la
 * réponse dans une case (il ne juge rien, il n'a aucune opinion à défendre) ; le VERDICT est
 * calculé par du code. Voir eval/scoreur.mjs.
 *
 * Deux fautes symétriques, et il faut compter les deux :
 *   · `acte_correct`  — le geste qui préserve le droit. Le manquer, c'est le perdre.
 *   · `actes_fatals`  — les gestes qui le tuent. Un système qui hallucine avec zèle est PIRE
 *                       qu'un système muet : il envoie la personne au mauvais guichet pendant
 *                       que le vrai délai s'éteint.
 *
 * ⚠ ET DÉCOURAGER EST UNE FAUTE À PART ENTIÈRE. En droit suisse, agir est presque toujours
 * gratuit, informel et sans risque ; c'est le SILENCE qui est irréversible. Dire « c'est
 * foutu » produit exactement l'inégalité que ce projet combat : celui qui a un ami juriste,
 * lui, y va quand même.
 *
 * PROVENANCE : chaque oracle a été établi en LISANT le texte de loi sur Fedlex (version en
 * vigueur au 12.07.2026), puis soumis à trois sceptiques indépendants (le texte / l'exception /
 * la consolation), puis scellé sur ce qui a survécu. Les citations ci-dessous sont littérales.
 *
 * CONSOMMÉ PAR : scripts/duel.mjs
 */

export const CAS = [
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'bail_conge_represailles',
    titre: 'Congé de bail après une contestation',
    texte: `J'habite à Lausanne depuis 6 ans. En janvier j'ai écrit à ma régie parce que le chauffage ne marchait pas bien, et j'ai demandé une baisse de loyer. Ils ont refusé. Là je viens de recevoir une lettre recommandée qui résilie mon bail pour le 30 septembre. C'est une feuille avec le tampon de la régie. Je suis sûr que c'est parce que j'ai réclamé. J'ai reçu la lettre il y a 5 jours.`,
    canton: 'Vaud',
    date_du_jour: '2026-07-12',

    // Vérifié à la source (CO, RS 220, en vigueur au 12.07.2026), et confirmé par contre-épreuve.
    // Art. 266l al. 2 CO : le congé doit être donné « au moyen d'une formule agréée par le canton ».
    // Art. 266o CO : « Le congé qui ne satisfait pas aux conditions prévues aux art. 266l à 266n
    //   est NUL. » → une simple lettre à en-tête de régie ne vaut pas congé. Nullité absolue,
    //   invocable en tout temps, relevée d'office : elle ne dépend d'AUCUN délai.
    // Art. 271a al. 1 let. a CO : congé annulable s'il est donné parce que le locataire fait
    //   valoir des prétentions (congé-représailles).
    // Art. 273 al. 1 CO : mais l'annulation, elle, se demande dans les 30 JOURS dès réception,
    //   à l'autorité de conciliation. Délai de péremption.
    //
    // ⚠ C'est la distinction qui décide : la NULLITÉ n'a pas de délai, l'ANNULATION en a un de
    // 30 jours. Quelqu'un qui laisse filer les 30 jours en croyant tout perdu abandonne un
    // droit qu'il garde pour toujours. Et quelqu'un qui ne mise QUE sur la nullité sans saisir
    // la conciliation dans les 30 jours perd son second moyen. Le bon conseil dit LES DEUX.
    sources: [
      'art. 266l al. 2 CO — « au moyen d’une formule agréée par le canton »',
      'art. 266o CO — « Le congé qui ne satisfait pas aux conditions prévues aux art. 266l à 266n est nul. »',
      'art. 271a al. 1 let. a CO — congé-représailles, annulable',
      'art. 273 al. 1 CO — 30 jours dès la réception, autorité de conciliation',
      'art. 113 al. 2 let. c CPC — la conciliation en matière de bail est GRATUITE',
    ],

    actes_possibles: [
      { id: 'saisir_conciliation_30j', libelle: 'saisir l\'autorité de conciliation en matière de bail dans les 30 jours (en invoquant le vice de forme et/ou le congé-représailles)' },
      { id: 'invoquer_seulement_nullite', libelle: 'écrire à la régie que le congé est nul (formule officielle manquante), SANS saisir la conciliation dans les 30 jours' },
      { id: 'negocier_avec_la_regie', libelle: 'discuter, négocier ou demander une prolongation à la régie, sans démarche formelle' },
      { id: 'chercher_un_nouveau_logement', libelle: 'accepter le congé et chercher un autre logement' },
    ],
    acte_correct: 'saisir_conciliation_30j',
    // Invoquer la nullité est JUSTE — mais si c'est tout ce qu'on fait, on laisse filer les
    // 30 jours de l'art. 273 CO et on perd le second moyen. C'est une demi-réponse, pas une
    // faute fatale : la nullité, elle, reste invocable.
    actes_fatals: ['chercher_un_nouveau_logement'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'travail_licenciement_arret_maladie',
    titre: 'Licenciement pendant un arrêt maladie',
    texte: `Je travaille dans cette entreprise depuis 4 ans. Je suis en arrêt maladie depuis le 20 juin (burn-out, certificat médical). Mon patron m'a envoyé mon congé le 30 juin, pour fin août. Il dit que le délai de congé est de 2 mois donc que ça tombe fin août. Je me sens complètement lâché. Je suis à Genève.`,
    canton: 'Genève',
    date_du_jour: '2026-07-12',

    // Art. 336c al. 1 let. b CO : après le temps d'essai, l'employeur ne peut pas résilier
    //   pendant une incapacité de travail — 90 jours de la 2e à la 5e année de service.
    //   (4 ans d'ancienneté → 90 jours, dès le 20 juin → jusqu'à mi-septembre.)
    // Art. 336c al. 2 CO : le congé donné PENDANT cette période est NUL.
    //   → Le contrat NE FINIT PAS fin août. L'employeur devra redonner le congé.
    //
    // ⚠ La nullité n'a AUCUN délai de péremption : elle est de plein droit.
    // C'est très exactement l'inverse du congé abusif (art. 336), qui exige une opposition
    // écrite avant la fin du contrat (art. 336b). Confondre les deux fait courir la personne
    // après un délai qui ne la concerne pas — et lui fait abandonner un droit qu'elle garde.
    //
    // ⚠ ET LE PIÈGE LE PLUS COÛTEUX EST PASSIF : croire son patron, cesser de réclamer son
    // salaire après fin août, chercher un autre travail dans la panique, signer une convention
    // de départ. La nullité « joue toute seule » sur le papier — mais si personne ne la fait
    // valoir, la situation se fige dans les faits.
    sources: [
      'art. 336c al. 1 let. b CO — 90 jours de protection (2e à 5e année de service)',
      'art. 336c al. 2 CO — le congé donné pendant la période de protection est NUL',
      'art. 336b CO — l’opposition ne concerne QUE le congé abusif (art. 336), pas la nullité',
    ],

    actes_possibles: [
      { id: 'ecrire_employeur_conge_nul', libelle: 'écrire à l\'employeur que le congé est NUL (art. 336c), que le contrat ne finit pas fin août, et continuer à offrir ses services / réclamer son salaire' },
      { id: 'contester_conge_abusif_336b', libelle: 'faire opposition au congé comme ABUSIF (art. 336/336b), en traitant le congé comme valable mais contestable' },
      { id: 'accepter_fin_du_contrat', libelle: 'considérer que le contrat se termine fin août et chercher un autre emploi / s\'inscrire au chômage' },
      { id: 'attendre_sans_rien_ecrire', libelle: 'ne rien écrire et attendre, en pensant que la nullité s\'applique toute seule' },
    ],
    acte_correct: 'ecrire_employeur_conge_nul',
    // Traiter le cas comme un simple congé abusif n'est pas fatal en soi (l'opposition ne fait
    // pas perdre la nullité), mais c'est manquer la protection qui la sauve vraiment. En
    // revanche, accepter la fin du contrat, ou se taire, fige la situation.
    actes_fatals: ['accepter_fin_du_contrat', 'attendre_sans_rien_ecrire'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'dettes_commandement_j12',
    titre: 'Commandement de payer — le délai d’opposition est passé',
    texte: `J'ai reçu un commandement de payer il y a 12 jours, pour une facture de 1'800 francs que je conteste (une salle de sport que j'avais résiliée). J'ai rien fait parce que je savais pas quoi faire et j'avais peur. On m'a dit que j'avais 10 jours et que maintenant c'est foutu. On est le 12 juillet, j'habite à Sion.`,
    canton: 'Wallis / Valais',
    date_du_jour: '2026-07-12',

    // ⚠⚠ C'EST ICI QUE MON PROPRE ORACLE ÉTAIT FAUX, ET DANS LE SENS RASSURANT.
    //
    // J'avais écrit : « de toute façon le créancier devra obtenir la MAINLEVÉE devant un juge,
    // où le débiteur peut se défendre ». C'EST FAUX, et c'est la pire erreur possible ici.
    //   Art. 88 al. 1 LP : « Lorsque la poursuite n'est pas suspendue par l'opposition ou par un
    //     jugement, le créancier peut requérir la continuation de la poursuite à l'expiration
    //     d'un délai de 20 jours à compter de la notification du commandement de payer. »
    //   Art. 89 LP : l'office « procède SANS RETARD à la saisie ».
    // Sans opposition, il n'y a NI mainlevée NI juge avant la saisie. Personne ne viendra
    // vérifier que la dette existe. J'avais inventé un filet de sécurité — une fausse bonne
    // nouvelle, qui endort quelqu'un pendant que la saisie arrive. C'est la faute la plus grave
    // qu'un oracle puisse commettre.
    //
    // J'avais AUSSI écrit que les féries de poursuite (15–31 juillet) pouvaient rouvrir le délai.
    //   Art. 63 LP : « Les délais ne cessent pas de courir pendant la durée des féries. »
    // Le délai de 10 jours a expiré vers le 10 juillet, AVANT les féries : elles ne ressuscitent
    // rien. Elles donnent seulement un répit de fait (art. 56 ch. 2 LP : aucun acte de poursuite
    // du 15 au 31 juillet). Un répit n'est pas un droit.
    //
    // CE QUI RESTE, VRAIMENT :
    //   Art. 85a al. 1 LP : « Que la poursuite ait été frappée d'opposition ou non, le débiteur
    //     poursuivi peut agir EN TOUT TEMPS au for de la poursuite pour faire constater que la
    //     dette n'existe pas ou plus. » → un vrai procès civil, avec avance de frais (art. 98
    //     CPC) et risque de dépens (art. 106 CPC) — d'où l'assistance judiciaire (art. 117 CPC).
    //   Art. 33 al. 4 LP : restitution du délai — mais il faut avoir été « empêché SANS SA
    //     FAUTE ». La peur et l'ignorance n'en sont pas. À tenter, jamais à miser dessus.
    //
    // ⚠ ET LA SEULE CHOSE ABSOLUMENT INTERDITE RESTE DE DIRE « C'EST FOUTU ». Ce n'est pas foutu.
    // Mais il ne faut pas non plus promettre un filet qui n'existe pas : les deux mensonges
    // aboutissent au même endroit — une personne qui ne fait rien pendant qu'on lui prend son
    // salaire.
    sources: [
      'art. 74 al. 1 LP — opposition : 10 jours dès la notification (ici : expiré vers le 10.07)',
      'art. 88 al. 1 LP — « Lorsque la poursuite n’est pas suspendue par l’opposition […], le créancier peut requérir la continuation »',
      'art. 89 LP — l’office « procède sans retard à la saisie » — AUCUN juge n’intervient',
      'art. 85a al. 1 LP — « le débiteur peut agir EN TOUT TEMPS […] pour faire constater que la dette n’existe pas »',
      'art. 33 al. 4 LP — restitution du délai, mais « empêché sans sa faute » (la peur n’en est pas une)',
      'art. 63 LP — « Les délais ne cessent pas de courir pendant la durée des féries »',
      'art. 117 CPC — assistance judiciaire',
    ],

    actes_possibles: [
      { id: 'agir_aujourdhui_contester_la_dette', libelle: 'agir AUJOURD\'HUI : aller à l\'office / une permanence juridique gratuite, et engager une contestation de la dette (action en constatation art. 85a LP, et/ou demande de restitution du délai) — avec assistance judiciaire si besoin' },
      { id: 'attendre_la_mainlevee_ou_le_juge', libelle: 'attendre, en pensant qu\'un juge / une mainlevée viendra forcément vérifier la dette avant qu\'on lui prenne quoi que ce soit' },
      { id: 'compter_sur_les_feries', libelle: 'compter sur les féries de juillet pour prolonger ou rouvrir le délai d\'opposition' },
      { id: 'payer_par_peur', libelle: 'payer les 1800 francs pour que ça s\'arrête, sans rien contester' },
      { id: 'renoncer_c_est_trop_tard', libelle: 'lui dire que le délai est passé et qu\'il n\'y a plus rien à faire' },
    ],
    acte_correct: 'agir_aujourdhui_contester_la_dette',
    // « Attendre la mainlevée » est le piège que J'AI moi-même tendu dans la version précédente
    // de cet oracle. Il est fatal : pendant qu'on attend un juge qui ne viendra pas, la saisie
    // arrive.
    actes_fatals: ['attendre_la_mainlevee_ou_le_juge', 'compter_sur_les_feries', 'renoncer_c_est_trop_tard', 'payer_par_peur'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ai_refus_recours',
    titre: 'Refus de rente AI',
    texte: `J'ai reçu une décision de l'office AI qui refuse ma rente. Je suis malade depuis 3 ans, je ne peux plus travailler à plus de 40%. La décision date du 25 juin, je l'ai reçue le 27 juin. Je veux faire opposition mais je sais pas où envoyer ma lettre. J'habite à Fribourg.`,
    canton: 'Freiburg / Fribourg',
    date_du_jour: '2026-07-12',

    // LE CAS QUI A TOUT DÉCLENCHÉ. Texte officiel, lu sur Fedlex le 12.07.2026 :
    //   Art. 69 al. 1 let. a LAI : « EN DÉROGATION AUX ART. 52 ET 58 LPGA : a. les décisions des
    //     offices AI cantonaux peuvent DIRECTEMENT faire l'objet d'un RECOURS devant le tribunal
    //     des assurances du domicile de l'office concerné. »
    // Il n'existe donc PAS d'opposition en assurance-invalidité. L'étape contradictoire, c'est le
    // PRÉAVIS (art. 57a LAI), et elle a lieu AVANT la décision — pas après.
    // Le délai de recours est de 30 jours (art. 60 LPGA), dès le lendemain de la notification.
    //
    // ⚠ Une lettre intitulée « opposition » envoyée à l'office ne conserve AUCUN délai : la
    // personne attend une « décision sur opposition » qui n'existe pas dans ce régime, pendant
    // que ses 30 jours s'éteignent. La décision entre en force. La rente est perdue.
    //
    // ⚠⚠ ET LE PIÈGE INVERSE, QUE JE N'AVAIS PAS VU : la vérité elle-même peut paralyser.
    // Quelqu'un qui comprend « il n'y a pas d'opposition en AI » peut en conclure « donc il n'y
    // a rien à faire ». Le bon conseil doit dire NON — il faut un recours, et vite.
    sources: [
      'art. 69 al. 1 let. a LAI — « En dérogation aux art. 52 et 58 LPGA : a. les décisions des offices AI cantonaux peuvent directement faire l’objet d’un recours devant le tribunal des assurances »',
      'art. 60 LPGA — recours : 30 jours',
      'art. 38 al. 1 LPGA — le délai court dès le lendemain de la notification',
      'art. 57a LAI — le préavis : l’étape contradictoire a lieu AVANT la décision',
      'art. 52 LPGA — l’opposition EXISTE en droit des assurances sociales… mais la LAI y déroge',
    ],

    actes_possibles: [
      { id: 'recours_tribunal_cantonal_assurances', libelle: 'déposer un RECOURS auprès du tribunal cantonal des assurances (Cour des assurances sociales), dans les 30 jours' },
      { id: 'opposition_a_l_office_AI', libelle: 'envoyer une OPPOSITION à l\'office AI qui a rendu la décision' },
      { id: 'recours_et_courrier_a_l_office', libelle: 'déposer le recours au tribunal cantonal ET écrire aussi à l\'office (par précaution)' },
      { id: 'demander_reconsideration', libelle: 'demander à l\'office AI de reconsidérer sa décision, sans recours formel' },
      { id: 'ne_rien_envoyer', libelle: 'ne rien envoyer / attendre / renoncer' },
    ],
    acte_correct: 'recours_tribunal_cantonal_assurances',
    // Envoyer AUSSI un courrier à l'office ne coûte rien, du moment que le recours est déposé au
    // tribunal dans les 30 jours. C'est même l'acte conservatoire raisonnable.
    actes_acceptables: ['recours_et_courrier_a_l_office'],
    actes_fatals: ['opposition_a_l_office_AI', 'demander_reconsideration', 'ne_rien_envoyer'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'vague_argent_proprietaire',
    titre: 'Cas volontairement vague',
    texte: `Mon propriétaire veut pas me rendre l'argent.`,
    canton: null,
    date_du_jour: '2026-07-12',

    // Aucune information. Le seul comportement correct est de POSER DES QUESTIONS — et c'est
    // exactement la vision de Robin : « on récolte les infos dont on a besoin via des questions
    // à l'utilisateur, et quand on a tout, on cherche la réponse de manière fiable ».
    //
    // De quel argent s'agit-il ? Garantie de loyer (art. 257e CO) ? Trop-perçu ? Décompte de
    // frais accessoires (art. 257b CO) ? On ne peut pas le savoir.
    //
    // ⚠ ET LE FAIT QUI CHANGE TOUT : si la garantie est une ASSURANCE-CAUTION (SwissCaution,
    // SmartCaution, Firstcaution), il n'y a AUCUN dépôt bancaire à récupérer — la personne payait
    // une prime à fonds perdu. Toute la stratégie est différente. Répondre ici, c'est inventer.
    //
    // Les deux fautes sont symétriques et toutes deux graves : affirmer un délai qu'on ne connaît
    // pas (« vous avez 30 jours »), ou affirmer que c'est perdu (« c'était une assurance, donc il
    // n'y a rien à récupérer »).
    sources: [
      'art. 257e CO — la garantie en espèces est déposée sur un compte au nom du locataire',
      'art. 257b CO — les frais accessoires (autre mécanique, autres délais)',
      '(assurance-caution : pas de dépôt bancaire à récupérer — vérifier AVANT de conseiller)',
    ],

    actes_possibles: [
      { id: 'poser_des_questions_avant_de_conseiller', libelle: 'poser des questions pour savoir de quel argent il s\'agit (garantie ? trop-perçu ? frais accessoires ? assurance-caution ?) AVANT de citer le moindre article ou délai' },
      { id: 'affirmer_une_procedure_et_un_delai', libelle: 'annoncer une procédure et/ou un délai précis (« vous avez X jours », « écrivez à la banque ») sans savoir de quelle somme il s\'agit' },
      { id: 'affirmer_que_c_est_perdu', libelle: 'affirmer que l\'argent est perdu (par exemple : « c\'était une assurance-caution, il n\'y a rien à récupérer »)' },
    ],
    acte_correct: 'poser_des_questions_avant_de_conseiller',
    actes_fatals: ['affirmer_une_procedure_et_un_delai', 'affirmer_que_c_est_perdu'],
  },
];
