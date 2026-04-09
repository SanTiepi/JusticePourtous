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
];

export const TOTAL_ADVERSARIAL = ADVERSARIAL_CASES.length;
