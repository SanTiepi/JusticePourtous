/**
 * ⚠ L'ORACLE — les 5 cas où un modèle gratuit nous a battus, et le piège de chacun
 *
 * POURQUOI CE FICHIER EXISTE (2026-07-12)
 *
 * Trois instruments de mesure de ce projet étaient incapables d'annoncer une mauvaise
 * nouvelle :
 *   · le benchmark « ×6.4 » — le score du concurrent était écrit EN DUR dans le code ;
 *   · le badge « vérifié » — la fiche était relue par le même LLM qui l'avait écrite ;
 *   · les 282 « invariants de régression » — GÉNÉRÉS depuis les fiches, donc ils
 *     punissaient les corrections du droit (quand on a corrigé un faux délai de 7 jours,
 *     le test est passé au rouge).
 *
 * Un instrument qui ne peut pas dire « tu as perdu » ne mesure rien. Celui-ci le peut,
 * et c'est sa seule raison d'être.
 *
 * ─── CE QUI EST MESURÉ, ET COMMENT ───────────────────────────────────────────
 *
 * Pour chaque cas, le PIÈGE est connu d'avance : la règle qui sauve le droit, avec son
 * article, vérifiée à la source (Fedlex, 12 juillet 2026). Elle n'est PAS l'opinion d'un
 * LLM — c'est la loi.
 *
 * La mesure principale est donc MÉCANIQUE : la réponse cite-t-elle l'article qui sauve
 * le droit ? Un jury LLM intervient ensuite, en aveugle, pour la qualité d'ensemble —
 * mais il ne peut pas repeindre un piège manqué en victoire.
 *
 * ─── LES DEUX ERREURS SYMÉTRIQUES ────────────────────────────────────────────
 *
 * `piege` : ce qu'il faut TROUVER. Le manquer coûte un droit.
 * `hameçon` : ce qu'il ne faut PAS dire. L'affirmer coûte un droit aussi — envoyer
 *   quelqu'un faire « opposition » à une décision AI (qui n'admet pas l'opposition)
 *   consomme ses 30 jours de recours pendant qu'il attend une réponse qui ne viendra
 *   jamais. Un système qui hallucine avec zèle est plus dangereux qu'un système muet.
 *
 * CONSOMMÉ PAR : scripts/duel.mjs
 */

export const CAS = [
  {
    id: 'bail_conge_represailles',
    titre: 'Congé de bail après une contestation',
    texte: `J'habite à Lausanne depuis 6 ans. En janvier j'ai écrit à ma régie parce que le chauffage ne marchait pas bien, et j'ai demandé une baisse de loyer. Ils ont refusé. Là je viens de recevoir une lettre recommandée qui résilie mon bail pour le 30 septembre. C'est une feuille avec le tampon de la régie. Je suis sûr que c'est parce que j'ai réclamé. J'ai reçu la lettre il y a 5 jours.`,
    canton: 'Vaud',

    // Ce qu'un bon conseil DOIT trouver. Vérifié : art. 271a al. 1 let. a CO (congé donné
    // parce que le locataire fait valoir des prétentions = annulable) ; art. 273 al. 1 CO
    // (30 jours dès la réception pour saisir l'autorité de conciliation) ; art. 266l al. 2
    // CO (le congé doit être donné sur la FORMULE OFFICIELLE agréée par le canton — une
    // simple lettre à en-tête de régie est NULLE, art. 266o CO). Le troisième point est le
    // vrai cadeau : il est invocable en tout temps, même si les 30 jours sont passés.
    piege: {
      titre: 'Le congé n\'est pas sur la formule officielle → il est NUL, sans condition de délai',
      articles: [/266\s*l/i, /266\s*o/i],
      pourquoi: 'Une simple lettre de régie ne vaut pas congé (art. 266l al. 2 + 266o CO). C\'est la nullité, pas l\'annulation : elle ne dépend d\'aucun délai.',
    },
    aussi_attendu: [
      { quoi: 'congé-représailles', articles: [/271\s*a/i] },
      { quoi: 'délai 30 jours pour contester', articles: [/\b273\b/] },
      { quoi: 'autorité de conciliation (gratuite)', motifs: [/conciliation/i] },
    ],
    hamecons: [
      { quoi: 'affirme que le congé est valable parce qu\'il est recommandé', motifs: [/valable.{0,40}recommand/i] },
    ],
  },

  {
    id: 'travail_licenciement_arret_maladie',
    titre: 'Licenciement pendant un arrêt maladie',
    texte: `Je travaille dans cette entreprise depuis 4 ans. Je suis en arrêt maladie depuis le 20 juin (burn-out, certificat médical). Mon patron m'a envoyé mon congé le 30 juin, pour fin août. Il dit que le délai de congé est de 2 mois donc que ça tombe fin août. Je me sens complètement lâché. Je suis à Genève.`,
    canton: 'Genève',

    // LE piège qui a fait perdre ce cas. Art. 336c al. 1 let. b CO : après 4 ans de
    // service, la période de protection est de 90 jours. Le congé donné PENDANT cette
    // période est NUL (al. 2) — il ne compte pas, il faudra le redonner. Le patron se
    // trompe : le contrat ne finit pas fin août. Quelqu'un qui croit son patron cherche
    // un travail dans la panique et signe une convention de départ qu'il n'aurait pas
    // dû signer.
    piege: {
      titre: 'Le congé donné pendant l\'arrêt maladie est NUL (période de protection de 90 jours)',
      articles: [/336\s*c/i],
      pourquoi: 'Art. 336c al. 1 let. b + al. 2 CO : de la 2e à la 5e année de service, protection de 90 jours. Congé donné pendant = nul. Le contrat ne finit PAS fin août.',
    },
    aussi_attendu: [
      { quoi: 'la nullité (pas l\'annulabilité)', motifs: [/\bnul/i] },
      { quoi: 'écrire à l\'employeur pour contester la date de fin', motifs: [/(employeur|patron)/i] },
    ],
    hamecons: [
      // L'erreur qui coûte tout : traiter ça comme un congé abusif (art. 336) à contester
      // en 30 jours (art. 336b, sous peine de péremption) — alors qu'un congé NUL n'a
      // aucun délai à respecter. Envoyer la personne courir après un délai inexistant,
      // c'est la faire renoncer à un droit qu'elle a pour toujours.
      { quoi: 'réduit le cas à un congé abusif à contester en 30 jours', motifs: [/336\s*b/i] },
    ],
  },

  {
    id: 'dettes_commandement_j12',
    titre: 'Commandement de payer reçu il y a 12 jours',
    texte: `J'ai reçu un commandement de payer il y a 12 jours, pour une facture de 1'800 francs que je conteste (une salle de sport que j'avais résiliée). J'ai rien fait parce que je savais pas quoi faire et j'avais peur. On m'a dit que j'avais 10 jours et que maintenant c'est foutu. On est le 12 juillet, j'habite à Sion.`,
    canton: 'Wallis / Valais',
    date_du_jour: '2026-07-12',

    // Le cas conçu pour piéger le « c'est trop tard ». Le délai d'opposition est bien de
    // 10 jours (art. 74 al. 1 LP). MAIS : les féries de poursuite courent du 15 juillet
    // au 31 juillet (art. 56 ch. 2 LP) et, surtout, l'art. 33 al. 4 LP permet la
    // RESTITUTION du délai à qui a été empêché sans sa faute. Et même délai échu, la
    // poursuite n'est PAS un jugement : il reste l'action en annulation (art. 85a LP) et
    // le fait que le créancier doit encore obtenir la mainlevée devant un juge, où on peut
    // se défendre.
    //
    // ⚠ Le vrai enjeu de ce cas n'est pas juridique, il est humain : la seule réponse
    // interdite est « c'est foutu ». Une réponse qui décourage produit exactement
    // l'inégalité que ce projet combat.
    piege: {
      titre: 'Ne JAMAIS dire « c\'est foutu » — il reste des voies même après les 10 jours',
      articles: [/\b85\s*a\b/i, /\b33\b/, /mainlev/i, /\b56\b/],
      pourquoi: 'Restitution du délai (art. 33 al. 4 LP), action en annulation (art. 85a LP), et surtout : le créancier devra obtenir la mainlevée devant un juge, où l\'on peut se défendre. La poursuite n\'est pas un jugement.',
    },
    aussi_attendu: [
      { quoi: 'aller au guichet de l\'office aujourd\'hui', motifs: [/(office des poursuites|guichet)/i] },
      { quoi: 'l\'opposition est gratuite et sans motif', motifs: [/gratuit/i] },
    ],
    hamecons: [
      // L'hameçon central : le désespoir. Toute formulation qui ferme la porte.
      { quoi: 'CONCLUT QUE C\'EST TROP TARD', motifs: [/(c'est (foutu|fini|trop tard)|il n'y a plus rien à faire|vous avez perdu (votre droit|toute possibilité)|aucun recours possible)/i] },
    ],
  },

  {
    id: 'ai_refus_recours',
    titre: 'Refus de rente AI',
    texte: `J'ai reçu une décision de l'office AI qui refuse ma rente. Je suis malade depuis 3 ans, je ne peux plus travailler à plus de 40%. La décision date du 25 juin, je l'ai reçue le 27 juin. Je veux faire opposition mais je sais pas où envoyer ma lettre. J'habite à Fribourg.`,
    canton: 'Freiburg / Fribourg',
    date_du_jour: '2026-07-12',

    // LE piège le plus meurtrier du corpus, et celui que l'ancien site servait à l'envers.
    // Art. 69 al. 1 let. a LAI DÉROGE aux art. 52 et 58 LPGA : en assurance-invalidité, il
    // n'y a PAS d'opposition. C'est un RECOURS direct au tribunal cantonal des assurances,
    // 30 jours (art. 60 LPGA). Quelqu'un qui envoie une « opposition » à l'office AI attend
    // une réponse qui ne viendra jamais — pendant que ses 30 jours s'éteignent. Le site
    // recommandait littéralement de faire opposition. C'est un droit perdu, pas une faute
    // de style.
    piege: {
      titre: 'Il n\'y a PAS d\'opposition en AI — c\'est un recours au tribunal cantonal, 30 jours',
      articles: [/\b69\b/, /tribunal cantonal/i],
      pourquoi: 'Art. 69 al. 1 let. a LAI déroge aux art. 52 et 58 LPGA. Une « opposition » envoyée à l\'office AI ne conserve AUCUN délai : les 30 jours de recours (art. 60 LPGA) s\'éteignent pendant qu\'on attend.',
    },
    aussi_attendu: [
      { quoi: 'le délai de 30 jours', motifs: [/30\s*jours/i] },
      { quoi: 'corriger explicitement le mot « opposition » de la personne', motifs: [/(pas d'opposition|n'est pas une opposition|ce n'est pas une opposition|il ne s'agit pas d'une opposition)/i] },
    ],
    hamecons: [
      // Le pire résultat possible : confirmer la personne dans son erreur.
      { quoi: 'CONFIRME QU\'IL FAUT FAIRE OPPOSITION À L\'OFFICE AI', motifs: [/(faites|faire|envoyez|adressez|déposez)[^.]{0,60}opposition[^.]{0,40}(office|caisse)/i] },
    ],
  },

  {
    id: 'vague_argent_proprietaire',
    titre: 'Cas volontairement vague',
    texte: `Mon propriétaire veut pas me rendre l'argent.`,
    canton: null,

    // Aucune information. Le seul comportement correct est de POSER DES QUESTIONS —
    // c'est exactement la vision de Robin : « on récolte les infos dont on a besoin via
    // des questions à l'utilisateur, et quand on a tout, on cherche la réponse ».
    // Un système qui répond quand même est un système qui invente : il ne peut pas savoir
    // s'il s'agit d'une garantie de loyer, d'un trop-perçu, de frais accessoires ou d'un
    // dépôt jamais restitué. Et si c'est une caution garantie par une assurance
    // (SwissCaution), il n'y a pas d'argent à récupérer du tout.
    piege: {
      titre: 'NE PAS RÉPONDRE — poser des questions. On ne sait pas de quel argent il s\'agit.',
      motifs: [/\?/],  // au minimum : la réponse contient de vraies questions
      pourquoi: 'Garantie de loyer, trop-perçu, frais accessoires, dépôt ? Et si c\'est une assurance-caution (SwissCaution), il n\'y a aucun argent bloqué à récupérer. Répondre ici, c\'est inventer.',
    },
    aussi_attendu: [
      { quoi: 'demande de quel argent il s\'agit', motifs: [/(quel|quelle|de quoi|s'agit-il)/i] },
    ],
    hamecons: [
      // Le réflexe fatal : supposer « garantie de loyer », citer l'art. 257e CO et le
      // délai d'un an, et envoyer la personne à la banque — alors qu'on n'en sait rien.
      { quoi: 'AFFIRME UN DÉLAI OU UNE PROCÉDURE SANS SAVOIR DE QUOI IL S\'AGIT', motifs: [/vous (avez|disposez) (de\s*)?\d+\s*(jours|mois|ans?)/i] },
    ],
  },
];

/** Vérifie mécaniquement si un texte de réponse touche une cible (article ou motif). */
export function toucheLaCible(texte, cible) {
  const t = String(texte || '');
  const motifs = [...(cible.articles || []), ...(cible.motifs || [])];
  return motifs.some(m => m.test(t));
}
