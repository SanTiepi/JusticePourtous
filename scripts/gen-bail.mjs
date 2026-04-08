import { readFileSync, writeFileSync } from 'fs';
const bail = JSON.parse(readFileSync('src/data/fiches/bail.json', 'utf8'));
const D = 'JusticePourtous fournit des informations juridiques generales basees sur le droit suisse en vigueur. Il ne remplace pas un conseil d avocat personnalise. Les informations sont donnees a titre indicatif et sans garantie d exhaustivite. En cas de doute, consultez un professionnel du droit ou contactez les services listes.';
const SV = { nom: 'ASLOCA Vaud', tel: '021 617 11 37', url: 'https://vaud.asloca.ch', canton: 'VD' };
const SG = { nom: 'ASLOCA Geneve', tel: '022 716 18 00', url: 'https://www.asloca.ch/asloca-geneve', canton: 'GE' };
const Q5 = { id: 'q5', text: 'Votre canton ?', type: 'canton' };

const newFiches = [
  {
    id: 'bail_sous_location_refusee', domaine: 'bail', sousDomaine: 'sous-location',
    tags: ['sous-location', 'refus', 'autorisation', 'bailleur'],
    questions: [
      { id: 'q1', text: 'Avez-vous demande l autorisation par ecrit ?', options: ['oui', 'non'] },
      { id: 'q2', text: 'Le bailleur a-t-il motive son refus ?', options: ['oui', 'non', 'pas de reponse'] },
      { id: 'q3', text: 'Duree prevue de la sous-location ?', options: ['<1 an', '1-2 ans', 'indefinie'] },
      { id: 'q4', text: 'Le sous-loyer depasse-t-il votre loyer ?', options: ['oui', 'non', 'identique'] },
      Q5
    ],
    reponse: {
      explication: "Le locataire peut sous-louer avec le consentement du bailleur (art. 262 al. 1 CO). Le bailleur ne peut refuser que pour trois motifs : (1) le locataire refuse de communiquer les conditions, (2) les conditions sont abusives (sous-loyer excessif), (3) la sous-location presente des inconvenients majeurs (art. 262 al. 2 CO). Un refus injustifie autorise le locataire a sous-louer apres mise en demeure. Le silence du bailleur pendant environ 30 jours vaut acceptation tacite. Sans autorisation ou malgre un refus justifie, le bailleur peut resilier avec 30 jours de preavis (art. 257f al. 3 CO).",
      articles: [
        { ref: 'CO 262', titre: 'Sous-location', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_262' },
        { ref: 'CO 257f', titre: 'Violation du devoir de diligence', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_257_f' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_367/2010', resume: "Refus de sous-location injustifie si non motive par l un des trois motifs legaux de l art. 262 al. 2 CO." },
        { ref: 'TF 4A_524/2018', resume: "Sous-location a conditions abusives (sous-loyer 50% superieur) justifie le refus du bailleur." }
      ],
      modeleLettre: "Objet : Demande d autorisation de sous-location\n\nMadame, Monsieur,\n\nConformement a l art. 262 CO, je sollicite votre autorisation pour sous-louer [tout/partie] de mon logement sis [adresse] a [nom] pour la periode du [date] au [date].\n\nConditions : sous-loyer mensuel CHF [montant], duree [duree].\n\nJe vous prie de me repondre dans un delai de 30 jours.\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_animaux', domaine: 'bail', sousDomaine: 'usage',
    tags: ['animaux', 'animal', 'chien', 'chat', 'interdiction'],
    questions: [
      { id: 'q1', text: 'Type d animal ?', options: ['chien', 'chat', 'petit animal (cage)', 'NAC/reptile'] },
      { id: 'q2', text: 'Le bail interdit-il les animaux ?', options: ['oui clause expresse', 'non', 'pas mentionne'] },
      { id: 'q3', text: 'L animal cause-t-il des nuisances ?', options: ['non', 'bruit', 'odeurs', 'degats'] },
      { id: 'q4', text: 'Animal acquis avant ou pendant le bail ?', options: ['avant', 'pendant'] },
      Q5
    ],
    reponse: {
      explication: "Pas de disposition specifique sur la detention d animaux en logement loue. Une clause d interdiction est valable si elle figure au contrat. Les petits animaux en cage (hamsters, poissons, oiseaux) ne peuvent pas etre interdits car sans nuisance. Pour les chiens et chats, une interdiction est admissible mais doit etre proportionnee. Sans clause ni nuisance, le bailleur ne peut pas resilier. Si l animal cause des nuisances repetees, mise en demeure puis resiliation possible (art. 257f al. 3 CO). Le locataire repond des degats (art. 267 CO).",
      articles: [
        { ref: 'CO 257f', titre: 'Violation du devoir de diligence', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_257_f' },
        { ref: 'CO 267', titre: 'Restitution de la chose', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_267' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_516/2014', resume: "Interdiction de detenir un chat disproportionnee lorsque l animal ne cause aucune nuisance." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_nuisances_voisins', domaine: 'bail', sousDomaine: 'voisinage',
    tags: ['nuisances', 'voisins', 'bruit', 'immissions', 'tapage'],
    questions: [
      { id: 'q1', text: 'Type de nuisance ?', options: ['bruit musique', 'bruit pas/chocs', 'odeurs', 'comportement'] },
      { id: 'q2', text: 'Horaires ?', options: ['jour (7h-22h)', 'nuit (22h-7h)', 'les deux'] },
      { id: 'q3', text: 'Frequence ?', options: ['quotidien', 'plusieurs fois/semaine', 'occasionnel'] },
      { id: 'q4', text: 'Dialogue tente ?', options: ['oui sans succes', 'amelioration partielle', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Les nuisances de voisinage engagent la responsabilite du bailleur qui doit faire respecter le reglement (art. 257f CO). Le locataire victime peut exiger l intervention du bailleur. En cas d inaction, reduction de loyer possible (art. 259a CO). Le perturbateur s expose a resiliation avec 30 jours de preavis (art. 257f al. 3 CO). Le tapage nocturne (22h-7h) est une contravention de police. Les immissions excessives relevent aussi de l art. 684 CC.",
      articles: [
        { ref: 'CO 257f', titre: 'Violation du devoir de diligence', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_257_f' },
        { ref: 'CO 259a', titre: 'Droits du locataire en cas de defaut', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_259_a' },
        { ref: 'CC 684', titre: 'Immissions excessives', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_684' }
      ],
      jurisprudence: [
        { ref: 'TF 4C.219/2005', resume: "Le bailleur repond du bruit des autres locataires s il n intervient pas apres signalement." },
        { ref: 'TF 4A_248/2017', resume: "Reduction de 8% pour nuisances repetees, le bailleur n ayant pas pris de mesures." }
      ],
      modeleLettre: "Objet : Plainte pour nuisances de voisinage\n\nMadame, Monsieur,\n\nJe porte a votre connaissance les nuisances repetees du locataire [reference] sis [adresse] : [description, frequence, horaires].\n\nConformement a l art. 257f CO, je vous prie d intervenir dans un delai de 15 jours. A defaut, je demanderai une reduction de loyer (art. 259a CO).\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG, { nom: 'Police municipale Lausanne', url: 'https://www.lausanne.ch/vie-pratique/securite/police.html', canton: 'VD' }],
      routageEcosysteme: { habiter: { condition: 'nuisance_voisinage', url: 'habiter.app' } },
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_renovation_forcee', domaine: 'bail', sousDomaine: 'travaux',
    tags: ['renovation', 'travaux', 'tolerance', 'relogement', 'reduction'],
    questions: [
      { id: 'q1', text: 'Type de travaux ?', options: ['renovation totale', 'partielle', 'entretien courant', 'amelioration energetique'] },
      { id: 'q2', text: 'Devez-vous quitter ?', options: ['oui', 'non mais nuisances', 'non'] },
      { id: 'q3', text: 'Prevenu a l avance ?', options: ['oui >3 mois', 'oui <3 mois', 'non'] },
      { id: 'q4', text: 'Relogement propose ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le locataire doit tolerer les travaux necessaires (art. 260 al. 1 CO). Le bailleur doit les annoncer en temps utile. Si les travaux restreignent l usage, reduction de loyer proportionnelle (art. 259d CO). Si le logement est inhabitable, le bailleur doit proposer un relogement a ses frais. Apres travaux de plus-value, augmentation de loyer possible dans les limites de l art. 269a CO, contestable dans les 30 jours.",
      articles: [
        { ref: 'CO 260', titre: 'Travaux de renovation', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_260' },
        { ref: 'CO 259d', titre: 'Reduction du loyer', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_259_d' },
        { ref: 'CO 269a', titre: 'Loyers abusifs — cas particuliers', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_269_a' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_186/2018', resume: "Reduction de 100% pendant inhabitabilite pour renovation lourde, plus indemnite de relogement." },
        { ref: 'TF 4A_429/2015', resume: "Le bailleur qui ne previent pas suffisamment tot viole son obligation et doit indemniser." }
      ],
      modeleLettre: "Objet : Demande de reduction de loyer pendant travaux\n\nMadame, Monsieur,\n\nDes travaux ont debute le [date] au [adresse], causant [bruit, poussiere, restriction d usage]. Conformement a l art. 259d CO, je demande une reduction proportionnelle de mon loyer pendant toute la duree des travaux.\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG],
      routageEcosysteme: { habiter: { condition: 'travaux_renovation', url: 'habiter.app' } },
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_loyer_initial_abusif', domaine: 'bail', sousDomaine: 'loyer',
    tags: ['loyer', 'initial', 'abusif', 'contestation', 'formulaire'],
    questions: [
      { id: 'q1', text: 'Formule officielle de fixation du loyer initial recue ?', options: ['oui', 'non'] },
      { id: 'q2', text: 'Loyer du precedent locataire connu ?', options: ['oui plus bas', 'identique', 'non'] },
      { id: 'q3', text: 'Depuis quand dans le logement ?', options: ['<30 jours', '1-6 mois', '>6 mois'] },
      { id: 'q4', text: 'Signe sous pression (penurie) ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Contestation possible dans les 30 jours suivant la reception de la chose (art. 270 al. 1 CO) si : (1) contraint par necessite ou marche, ET (2) loyer sensiblement superieur au precedent. Dans les cantons VD, GE, FR, ZH, NE, formule officielle obligatoire. Sans formule, le loyer est contestable en tout temps. Le TF considere qu une hausse de plus de 10% est sensible et doit etre justifiee.",
      articles: [
        { ref: 'CO 270', titre: 'Contestation du loyer initial', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_270' },
        { ref: 'CO 269', titre: 'Loyers abusifs — principe', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_269' },
        { ref: 'CO 269d', titre: 'Notification d augmentation', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_269_d' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_400/2017', resume: "Contestation admise : hausse de 40% sans travaux justificatifs." },
        { ref: 'TF 4A_250/2012', resume: "Sans formule officielle, le loyer initial est contestable en tout temps." }
      ],
      modeleLettre: "Objet : Contestation du loyer initial\n\nA la Commission de conciliation,\n\nMadame, Monsieur,\n\nEmmenage au [adresse] le [date], loyer CHF [montant]. Je conteste ce loyer initial (art. 270 CO) car [sensiblement superieur au precedent / absence de formule officielle].\n\nJe demande la fixation judiciaire d un loyer non abusif.\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG, { nom: 'Commission de conciliation VD', url: 'https://www.vd.ch/themes/territoire-et-construction/baux-a-loyer', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_frais_chauffage', domaine: 'bail', sousDomaine: 'charges',
    tags: ['chauffage', 'frais', 'charges', 'decompte', 'accessoires'],
    questions: [
      { id: 'q1', text: 'Probleme ?', options: ['decompte excessif', 'pas de decompte', 'repartition injuste', 'chauffage insuffisant'] },
      { id: 'q2', text: 'Forfait ou acompte ?', options: ['forfait', 'acompte + decompte', 'je ne sais pas'] },
      { id: 'q3', text: 'Decompte detaille recu ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Depuis combien d annees ?', options: ['1 an', '2-3 ans', '>3 ans'] },
      Q5
    ],
    reponse: {
      explication: "Les frais de chauffage sont des frais accessoires (art. 257a CO). Avec un acompte, le bailleur doit fournir un decompte annuel detaille (art. 4 OBLF). Le locataire peut consulter les pieces justificatives. Avec un forfait, pas de supplement possible meme si les frais reels depassent. Decompte contestable dans un delai raisonnable (~30 jours). La repartition doit suivre une cle objective (surface, compteurs). Un chauffage insuffisant (<20 degres) constitue un defaut ouvrant droit a reduction de loyer.",
      articles: [
        { ref: 'CO 257a', titre: 'Frais accessoires', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_257_a' },
        { ref: 'CO 257b', titre: 'Frais accessoires — decompte', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_257_b' },
        { ref: 'OBLF 4', titre: 'Frais accessoires — precision', lien: 'https://www.fedlex.admin.ch/eli/cc/1990/835_835_835/fr#art_4' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_460/2014', resume: "Sans decompte detaille, le bailleur ne peut reclamer de supplement au locataire." },
        { ref: 'TF 4A_33/2016', resume: "Le forfait de chauffage ne peut etre augmente qu avec le loyer, selon les regles d augmentation." }
      ],
      modeleLettre: "Objet : Contestation du decompte de chauffage\n\nMadame, Monsieur,\n\nJe conteste le decompte de chauffage pour [periode] : [montant excessif / absence de justificatifs / cle de repartition incorrecte].\n\nConformement a l art. 257b CO, je vous demande les pieces justificatives detaillees dans un delai de 30 jours.\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG],
      routageEcosysteme: { habiter: { condition: 'chauffage', url: 'habiter.app' } },
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO/OBLF etat 2025-01-01'
  },
  {
    id: 'bail_parking', domaine: 'bail', sousDomaine: 'accessoire',
    tags: ['parking', 'place', 'voiture', 'garage', 'accessoire'],
    questions: [
      { id: 'q1', text: 'Parking lie au bail du logement ?', options: ['oui meme contrat', 'non contrat separe', 'je ne sais pas'] },
      { id: 'q2', text: 'Probleme ?', options: ['resiliation du parking seul', 'loyer excessif', 'place inutilisable', 'attribution refusee'] },
      { id: 'q3', text: 'Duree du bail parking ?', options: ['meme que logement', 'indeterminee', 'determinee'] },
      { id: 'q4', text: 'Reglement specifique ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Si la place est liee au bail principal (meme contrat), elle est un accessoire (art. 253a CO) et suit le meme regime de protection. Le bailleur ne peut la resilier separement. Si c est un contrat separe, les delais de resiliation sont de 2 semaines (places non couvertes) ou 3 mois (garages, art. 266c CO par analogie). Le loyer du parking est soumis aux regles sur les loyers abusifs.",
      articles: [
        { ref: 'CO 253a', titre: 'Champ d application — baux a loyer', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_253_a' },
        { ref: 'CO 266c', titre: 'Delais de conge', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_266_c' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_198/2014', resume: "Place de parking louee avec le logement : le bailleur ne peut resilier le parking seul." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_cave_grenier', domaine: 'bail', sousDomaine: 'accessoire',
    tags: ['cave', 'grenier', 'local', 'accessoire', 'depot'],
    questions: [
      { id: 'q1', text: 'Cave/grenier inclus dans le bail ?', options: ['oui', 'non', 'pas mentionne'] },
      { id: 'q2', text: 'Probleme ?', options: ['acces refuse', 'humidite/degats', 'vol', 'changement d attribution'] },
      { id: 'q3', text: 'Local en bon etat ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Probleme signale ?', options: ['oui ecrit', 'oui oral', 'non'] },
      Q5
    ],
    reponse: {
      explication: "La cave ou grenier attribue avec le logement est un accessoire du bail (art. 253a CO). Le bailleur doit le maintenir en etat. Un local humide ou inonde constitue un defaut (art. 259a CO) ouvrant droit aux memes remedes. Le bailleur ne peut pas retirer un local attribue sans accord du locataire. En cas de vol, le bailleur n est responsable que s il a neglige la securite (serrures defectueuses).",
      articles: [
        { ref: 'CO 253a', titre: 'Champ d application', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_253_a' },
        { ref: 'CO 259a', titre: 'Droits du locataire en cas de defaut', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_259_a' },
        { ref: 'CO 256', titre: 'Obligation de delivrer la chose', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_256' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_129/2011', resume: "Le retrait d une cave attribuee sans accord du locataire constitue une modification unilaterale du bail." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_colocation', domaine: 'bail', sousDomaine: 'contrat',
    tags: ['colocation', 'colocataire', 'solidarite', 'depart', 'contrat'],
    questions: [
      { id: 'q1', text: 'Type de colocation ?', options: ['bail commun (solidaire)', 'baux individuels', 'sous-location'] },
      { id: 'q2', text: 'Probleme ?', options: ['depart colocataire', 'impaye colocataire', 'nuisances', 'ajout colocataire'] },
      { id: 'q3', text: 'Clause de solidarite ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q4', text: 'Nombre de colocataires ?', options: ['2', '3-4', '>4'] },
      Q5
    ],
    reponse: {
      explication: "En bail solidaire, tous les colocataires sont solidairement responsables du loyer (art. 143 ss CO). Le bailleur peut reclamer l integralite a n importe lequel. Un colocataire ne peut resilier sa part sans accord de tous ET du bailleur. Le depart d un colocataire ne libere pas les autres. Pour sortir de la solidarite : avenant au bail ou resiliation par tous. En baux individuels, chacun est responsable de sa part. La sous-location (un titulaire sous-loue) est regie par l art. 262 CO.",
      articles: [
        { ref: 'CO 143', titre: 'Solidarite — principe', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_143' },
        { ref: 'CO 262', titre: 'Sous-location', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_262' },
        { ref: 'CO 266c', titre: 'Delais de conge', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_266_c' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_524/2011', resume: "En bail solidaire, la resiliation n est valable que si elle emane de tous les colocataires." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_deces_locataire', domaine: 'bail', sousDomaine: 'fin',
    tags: ['deces', 'locataire', 'succession', 'heritiers', 'resiliation'],
    questions: [
      { id: 'q1', text: 'Vous etes ?', options: ['heritier', 'conjoint survivant', 'colocataire', 'bailleur'] },
      { id: 'q2', text: 'Bail a duree ?', options: ['indeterminee', 'determinee'] },
      { id: 'q3', text: 'Conjoint/partenaire colocataire ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Souhaitez-vous reprendre le bail ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Au deces, le bail passe aux heritiers (art. 560 CC). Les heritiers peuvent resilier avec le delai legal pour le prochain terme (art. 266i CO), preavis 3 mois minimum. Le conjoint survivant a un droit legal de reprise (art. 121 CC). Le bailleur ne peut pas resilier au motif du deces. Les heritiers repondent des dettes de loyer dans la limite de la succession acceptee. En cas de repudiation, pas de responsabilite pour les dettes du bail.",
      articles: [
        { ref: 'CO 266i', titre: 'Resiliation par les heritiers', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_266_i' },
        { ref: 'CC 560', titre: 'Acquisition de la succession', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_560' },
        { ref: 'CC 121', titre: 'Logement familial', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_121' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_461/2015', resume: "Les heritiers peuvent resilier avec le delai legal sans attendre le terme contractuel." }
      ],
      modeleLettre: "Objet : Resiliation du bail suite au deces du locataire\n\nMadame, Monsieur,\n\nEn qualite d heritier(e) de feu [nom], locataire au [adresse], je resilie le bail conformement a l art. 266i CO, avec effet au [prochain terme legal].\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO/CC etat 2025-01-01'
  },
  {
    id: 'bail_faillite_locataire', domaine: 'bail', sousDomaine: 'fin',
    tags: ['faillite', 'locataire', 'poursuite', 'garantie', 'resiliation'],
    questions: [
      { id: 'q1', text: 'Situation ?', options: ['faillite', 'procedure en cours', 'poursuites sans faillite'] },
      { id: 'q2', text: 'Arrieres de loyer ?', options: ['oui', 'non'] },
      { id: 'q3', text: 'Menace de resiliation ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Depot de garantie ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "En cas de faillite, le bailleur peut exiger des suretes pour les loyers futurs dans un delai raisonnable (art. 266h CO). Sans suretes, resiliation immediate possible. La faillite ne met pas fin automatiquement au bail. L administration de la faillite decide du maintien ou de la resiliation. Le depot de garantie (art. 257e CO) couvre en priorite les arrieres. En cas de poursuites sans faillite, le bailleur ne peut resilier que pour retard de paiement (art. 257d CO).",
      articles: [
        { ref: 'CO 266h', titre: 'Faillite du locataire', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_266_h' },
        { ref: 'CO 257d', titre: 'Retard de paiement du loyer', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_257_d' },
        { ref: 'CO 257e', titre: 'Suretes du locataire', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_257_e' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_182/2013', resume: "Le delai raisonnable pour fournir des suretes apres faillite est en general de 60 jours." }
      ],
      modeleLettre: "",
      services: [SV, SG, { nom: 'Service des faillites VD', url: 'https://www.vd.ch/themes/etat-droit-finances/poursuites-et-faillites', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_changement_proprietaire', domaine: 'bail', sousDomaine: 'contrat',
    tags: ['vente', 'proprietaire', 'transfert', 'nouveau bailleur'],
    questions: [
      { id: 'q1', text: 'Comment avez-vous appris le changement ?', options: ['lettre nouveau proprio', 'lettre ancien', 'bouche a oreille', 'pas informe'] },
      { id: 'q2', text: 'Le nouveau proprietaire veut ?', options: ['augmenter loyer', 'resilier', 'rien changer', 'je ne sais pas'] },
      { id: 'q3', text: 'Anciennete ?', options: ['<1 an', '1-5 ans', '>5 ans'] },
      { id: 'q4', text: 'Avis de resiliation recu ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "En cas de vente, le bail passe automatiquement au nouveau proprietaire (art. 261 al. 1 CO). Le locataire n a aucune demarche ; le bail continue aux memes conditions. Le nouveau proprietaire peut resilier pour le prochain terme avec preavis contractuel, ou pour besoin urgent personnel (art. 261 al. 2 let. a CO). Le conge est contestable (art. 271 ss CO). Le changement de proprietaire ne justifie pas a lui seul une augmentation. Le nouveau proprietaire est lie par toutes les clauses du bail existant.",
      articles: [
        { ref: 'CO 261', titre: 'Alienation de la chose louee', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_261' },
        { ref: 'CO 261a', titre: 'Execution forcee', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_261_a' },
        { ref: 'CO 271', titre: 'Annulabilite du conge', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_271' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_198/2016', resume: "Conge pour besoin propre annulable si le besoin n est pas serieux et actuel." },
        { ref: 'TF 4A_475/2015', resume: "Prolongation accordee malgre la vente, le locataire ayant des enfants scolarises." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_droit_preemption', domaine: 'bail', sousDomaine: 'contrat',
    tags: ['preemption', 'achat', 'vente', 'immeuble', 'locataire'],
    questions: [
      { id: 'q1', text: 'Logement en PPE ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q2', text: 'Informe de la vente ?', options: ['oui', 'non'] },
      { id: 'q3', text: 'Droit de preemption contractuel ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q4', text: 'Vente conclue ?', options: ['oui', 'non', 'je ne sais pas'] },
      Q5
    ],
    reponse: {
      explication: "En droit suisse, le locataire n a PAS de droit de preemption legal. Un tel droit n existe que s il est convenu contractuellement (art. 216 ss CO) ou inscrit au registre foncier. A Geneve, la LDTR prevoit certaines restrictions de vente d appartements loues. Le locataire est protege par le transfert automatique du bail (art. 261 CO) mais ne peut pas empecher la vente ni exiger d acheter.",
      articles: [
        { ref: 'CO 216', titre: 'Droit de preemption conventionnel', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_216' },
        { ref: 'CO 261', titre: 'Alienation de la chose louee', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_261' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_87/2012', resume: "Le locataire n a pas de droit de preemption legal ; seul un accord contractuel peut en conferer un." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_prolongation', domaine: 'bail', sousDomaine: 'fin',
    tags: ['prolongation', 'bail', 'conge', 'consequences penibles'],
    questions: [
      { id: 'q1', text: 'Raison ?', options: ['recherche difficile', 'enfants scolarises', 'sante', 'age avance', 'autre'] },
      { id: 'q2', text: 'Anciennete ?', options: ['<1 an', '1-5 ans', '5-10 ans', '>10 ans'] },
      { id: 'q3', text: 'Deja obtenu une prolongation ?', options: ['oui une fois', 'non', 'deuxieme demande'] },
      { id: 'q4', text: 'Marche locatif ?', options: ['tres tendu', 'tendu', 'normal'] },
      Q5
    ],
    reponse: {
      explication: "Le locataire peut demander une prolongation si la fin du bail cause des consequences penibles (art. 272 CO). Maximum 4 ans pour les logements (art. 272b CO), en une ou deux fois. Le juge considere la situation familiale, l age, la sante, le marche et les efforts de recherche. Demande dans les 30 jours du conge, a l autorite de conciliation (art. 273 CO). Peut etre assortie de conditions (adaptation du loyer).",
      articles: [
        { ref: 'CO 272', titre: 'Prolongation — conditions', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_272' },
        { ref: 'CO 272b', titre: 'Prolongation — duree', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_272_b' },
        { ref: 'CO 273', titre: 'Delai pour contester et prolonger', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_273' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_475/2015', resume: "Prolongation de 3 ans pour famille avec enfants scolarises en marche tendu." },
        { ref: 'TF 4A_380/2014', resume: "Refus de prolongation : aucun effort de recherche pendant la premiere prolongation." }
      ],
      modeleLettre: "Objet : Demande de prolongation de bail\n\nA la Commission de conciliation,\n\nMadame, Monsieur,\n\nResiliation recue le [date] pour le [date]. Je demande une prolongation (art. 272 CO) pour :\n- [Consequences penibles, efforts de recherche]\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG, { nom: 'Commission de conciliation VD', url: 'https://www.vd.ch/themes/territoire-et-construction/baux-a-loyer', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_expulsion', domaine: 'bail', sousDomaine: 'fin',
    tags: ['expulsion', 'evacuation', 'execution forcee', 'huissier'],
    questions: [
      { id: 'q1', text: 'Jugement d evacuation recu ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q2', text: 'Recours encore possible ?', options: ['oui', 'non', 'delai depasse'] },
      { id: 'q3', text: 'Huissier presente ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Logement de remplacement ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "L expulsion ne peut se faire que sur jugement executoire. Le bailleur ne peut jamais proceder lui-meme (justice privee interdite). Apres resiliation, requete d evacuation au tribunal. Si conge conteste, le tribunal statue d abord. Jugement en force : execution par huissier (art. 343 CPC). Le locataire peut demander un sursis d execution en cas de circonstances exceptionnelles. L aide sociale peut intervenir pour le relogement d urgence.",
      articles: [
        { ref: 'CPC 343', titre: 'Execution forcee', lien: 'https://www.fedlex.admin.ch/eli/cc/2010/262/fr#art_343' },
        { ref: 'CO 267', titre: 'Restitution de la chose', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_267' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_603/2016', resume: "Sursis a l evacuation accorde pour courte duree quand le locataire demontre qu il sera sans logement." }
      ],
      modeleLettre: "",
      services: [SV, SG, { nom: 'Centre social regional VD', url: 'https://www.vd.ch/themes/sante-soins-et-handicap/action-sociale', canton: 'VD' }, { nom: 'Hospice general GE', url: 'https://www.hospicegeneral.ch', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO/CPC etat 2025-01-01'
  },
  {
    id: 'bail_etat_lieux_conteste', domaine: 'bail', sousDomaine: 'fin',
    tags: ['etat des lieux', 'contestation', 'degats', 'usure', 'sortie'],
    questions: [
      { id: 'q1', text: 'Degats reproches ?', options: ['trous murs', 'sols abimes', 'peinture', 'appareils', 'autre'] },
      { id: 'q2', text: 'Duree d occupation ?', options: ['<3 ans', '3-5 ans', '5-10 ans', '>10 ans'] },
      { id: 'q3', text: 'PV signe ?', options: ['oui avec reserves', 'oui sans reserves', 'refuse'] },
      { id: 'q4', text: 'Decompte envoye ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le locataire restitue dans l etat d une utilisation conforme (art. 267 al. 1 CO). L usure normale n est pas a sa charge. La table paritaire (ASLOCA/SVIT) fixe la duree de vie (peinture 8-10 ans, moquette 10 ans, stores 14 ans). Au-dela, aucun dedommagement. Le bailleur doit signaler les defauts immediatement (art. 267a CO), sinon perte de droits. Le locataire peut contester les retenues sur garantie. Le fardeau de la preuve des degats incombe au bailleur.",
      articles: [
        { ref: 'CO 267', titre: 'Restitution de la chose', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_267' },
        { ref: 'CO 267a', titre: 'Verification et avis des defauts', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_267_a' }
      ],
      jurisprudence: [
        { ref: 'TF 4C.261/2006', resume: "Le bailleur qui ne signale pas les defauts lors de l etat des lieux perd le droit de reclamer." },
        { ref: 'TF 4A_140/2014', resume: "Application de la table paritaire pour la vetuste ; le locataire ne doit payer que la valeur residuelle." }
      ],
      modeleLettre: "Objet : Contestation de l etat des lieux de sortie\n\nMadame, Monsieur,\n\nSuite a l etat des lieux du [date] au [adresse], je conteste :\n- [Element] : usure normale apres [X] ans (duree de vie table paritaire : [Y] ans).\n\nJe vous prie de reviser votre decompte et liberer la garantie.\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_reparations_locataire', domaine: 'bail', sousDomaine: 'entretien',
    tags: ['reparations', 'menu entretien', 'a charge', 'locataire'],
    questions: [
      { id: 'q1', text: 'Type de reparation ?', options: ['robinet', 'serrure', 'interrupteur', 'joint', 'peinture', 'autre'] },
      { id: 'q2', text: 'Montant estime ?', options: ['<150 CHF', '150-300 CHF', '>300 CHF'] },
      { id: 'q3', text: 'Defaut existait a l entree ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q4', text: 'Signale au bailleur ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le locataire effectue a ses frais le menu entretien (art. 259 CO) : petites reparations sans connaissances speciales (joints, plaquettes WC, siphons, ampoules). Les reparations plus importantes (plomberie, electricite, appareils integres) sont au bailleur (art. 256 al. 1 CO). La limite financiere est environ 150-200 CHF par reparation en pratique. Si le defaut resulte de l usure normale ou d un vice de construction, c est le bailleur qui paie, meme pour de petits montants.",
      articles: [
        { ref: 'CO 259', titre: 'Menu entretien', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_259' },
        { ref: 'CO 256', titre: 'Obligation de delivrer la chose', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_256' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_395/2017', resume: "Le menu entretien se limite aux reparations que tout locataire peut effectuer seul, sans outillage special." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: { habiter: { condition: 'reparation', url: 'habiter.app' } },
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_modification_contrat', domaine: 'bail', sousDomaine: 'contrat',
    tags: ['modification', 'contrat', 'avenant', 'bail', 'conditions'],
    questions: [
      { id: 'q1', text: 'Modification ?', options: ['augmentation loyer', 'changement regles', 'retrait accessoire', 'autre'] },
      { id: 'q2', text: 'Unilaterale ?', options: ['oui imposee', 'accord mutuel', 'je ne sais pas'] },
      { id: 'q3', text: 'Formule officielle recue ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Delai pour repondre ?', options: ['<30 jours', '>30 jours', 'aucun'] },
      Q5
    ],
    reponse: {
      explication: "Le bail ne peut etre modifie que d un commun accord ou par voie legale. Les augmentations de loyer necessitent une formule officielle et le respect de la procedure (art. 269d CO). Toute autre modification (retrait de local, changement de reglement) necessite le consentement du locataire. Le locataire peut contester une modification non conforme dans les 30 jours. Un avenant ecrit est recommande.",
      articles: [
        { ref: 'CO 269d', titre: 'Notification de l augmentation', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_269_d' },
        { ref: 'CO 270b', titre: 'Contestation de l augmentation', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_270_b' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_554/2013', resume: "Modification unilaterale sans formule officielle : nulle, le locataire n est pas lie." }
      ],
      modeleLettre: "Objet : Opposition a la modification du bail\n\nMadame, Monsieur,\n\nJe conteste la modification notifiee le [date] concernant [description]. Cette modification est [unilaterale / non conforme].\n\nToute modification necessite mon consentement ou le respect de la procedure legale.\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_droit_retractation', domaine: 'bail', sousDomaine: 'contrat',
    tags: ['retractation', 'annulation', 'signature', 'bail', 'delai'],
    questions: [
      { id: 'q1', text: 'Quand avez-vous signe ?', options: ['aujourd hui', '<7 jours', '7-30 jours', '>30 jours'] },
      { id: 'q2', text: 'Deja emmenage ?', options: ['oui', 'non'] },
      { id: 'q3', text: 'Motif ?', options: ['erreur', 'meilleure offre', 'changement situation', 'vice du consentement'] },
      { id: 'q4', text: 'Depot ou premier loyer verse ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le droit suisse ne prevoit PAS de delai de retractation pour les baux. Une fois signe, le bail lie les parties. Le locataire peut chercher un accord amiable ou proposer un remplacant solvable (analogie art. 264 CO). Si le bail a commence, respect du delai de resiliation (3 mois, art. 266c CO). Un bail peut etre annule pour vice du consentement (erreur, dol, crainte, art. 23 ss CO) mais les conditions sont strictes.",
      articles: [
        { ref: 'CO 264', titre: 'Restitution anticipee', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_264' },
        { ref: 'CO 266c', titre: 'Delais de conge', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_266_c' },
        { ref: 'CO 23', titre: 'Erreur — vice du consentement', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_23' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_198/2013', resume: "Pas de droit de retractation apres signature ; le locataire doit trouver un remplacant." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'bail_logement_insalubre', domaine: 'bail', sousDomaine: 'defaut',
    tags: ['insalubre', 'insalubrite', 'sante', 'habitabilite', 'defaut grave'],
    questions: [
      { id: 'q1', text: 'Type de probleme ?', options: ['moisissure grave', 'nuisibles', 'pas de chauffage', 'pas d eau chaude', 'structure dangereuse'] },
      { id: 'q2', text: 'Depuis combien de temps ?', options: ['<1 mois', '1-6 mois', '>6 mois'] },
      { id: 'q3', text: 'Constat medical ou d expert ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Bailleur alerte par ecrit ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Un logement insalubre constitue un defaut grave (art. 258 CO). Le locataire peut exiger la remise en etat immediate (art. 259a CO). Si totalement inhabitable, resiliation immediate possible (art. 259b let. a CO) sans obligation de payer le loyer. En defaut grave partiel, consignation du loyer (art. 259g CO) apres mise en demeure. Le locataire peut signaler au service d hygiene cantonal. Le bailleur engage sa responsabilite civile pour les dommages (frais medicaux, relogement).",
      articles: [
        { ref: 'CO 258', titre: 'Defaut au debut du bail', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_258' },
        { ref: 'CO 259a', titre: 'Droits du locataire', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_259_a' },
        { ref: 'CO 259b', titre: 'Resiliation pour defaut grave', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_259_b' },
        { ref: 'CO 259g', titre: 'Consignation du loyer', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_259_g' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_32/2018', resume: "Moisissure grave structurelle : reduction de 25% et obligation de travaux pour le bailleur." },
        { ref: 'TF 4A_585/2019', resume: "Resiliation immediate justifiee pour danger sanitaire (amiante non securisee)." }
      ],
      modeleLettre: "Objet : Mise en demeure urgente — logement insalubre\n\nRecommande\n\nMadame, Monsieur,\n\nLe logement au [adresse] presente un defaut grave : [description].\n\nConformement a l art. 259a CO, je vous mets en demeure de reparer dans un delai de [10/15] jours. A defaut, je consignerai le loyer (art. 259g CO) et me reserve le droit de resilier (art. 259b CO).\n\nJe signalerai egalement la situation au service d hygiene.\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG, { nom: 'Service d hygiene Lausanne', url: 'https://www.lausanne.ch/vie-pratique/logement.html', canton: 'VD' }, { nom: 'Direction generale de la sante GE', url: 'https://www.ge.ch/organisation/direction-generale-sante', canton: 'GE' }],
      routageEcosysteme: { habiter: { condition: 'insalubrite', url: 'habiter.app' } },
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  }
];

bail.push(...newFiches);
console.log('Total bail fiches: ' + bail.length);
writeFileSync('src/data/fiches/bail.json', JSON.stringify(bail, null, 2) + '\n');
console.log('bail.json written OK');
