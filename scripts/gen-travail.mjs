import { readFileSync, writeFileSync } from 'fs';
const data = JSON.parse(readFileSync('src/data/fiches/travail.json', 'utf8'));
const D = 'JusticePourtous fournit des informations juridiques generales basees sur le droit suisse en vigueur. Il ne remplace pas un conseil d avocat personnalise. Les informations sont donnees a titre indicatif et sans garantie d exhaustivite. En cas de doute, consultez un professionnel du droit ou contactez les services listes.';
const SV = { nom: 'Syndicat Unia Vaud', tel: '021 310 45 45', url: 'https://www.unia.ch/fr/region/vaud', canton: 'VD' };
const SG = { nom: 'Syndicat Unia Geneve', tel: '022 949 13 00', url: 'https://www.unia.ch/fr/region/geneve', canton: 'GE' };
const Q5 = { id: 'q5', text: 'Votre canton ?', type: 'canton' };

const newFiches = [
  {
    id: 'travail_periode_essai', domaine: 'travail', sousDomaine: 'contrat',
    tags: ['periode d essai', 'resiliation', 'delai', 'debut'],
    questions: [
      { id: 'q1', text: 'Duree de la periode d essai prevue ?', options: ['1 mois (legal)', '2 mois', '3 mois', 'aucune mention'] },
      { id: 'q2', text: 'Qui a resilie ?', options: ['employeur', 'employe'] },
      { id: 'q3', text: 'Jours de travail effectifs ?', options: ['<14 jours', '14-30 jours', '>30 jours'] },
      { id: 'q4', text: 'Motif donne ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "La periode d essai est de 1 mois sauf accord ecrit different (art. 335b al. 1 CO). Elle peut etre etendue jusqu a 3 mois maximum par accord ecrit. Pendant cette periode, chaque partie peut resilier avec un delai de 7 jours pour n importe quel jour (art. 335b al. 1 CO). Si l employe est malade, accidente ou en service militaire pendant l essai, la periode d essai est prolongee d autant (art. 335b al. 3 CO). La protection contre le licenciement en temps inopportun (art. 336c CO) ne s applique PAS pendant la periode d essai. L employeur n est pas tenu de motiver le licenciement pendant l essai, sauf si le motif est discriminatoire.",
      articles: [
        { ref: 'CO 335b', titre: 'Temps d essai', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_335_b' },
        { ref: 'CO 336c', titre: 'Resiliation en temps inopportun', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_336_c' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_64/2011', resume: "La protection de l art. 336c CO ne s applique pas pendant la periode d essai." },
        { ref: 'TF 4A_385/2014', resume: "Une periode d essai de 3 mois est admissible uniquement si prevue par ecrit dans le contrat." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_non_concurrence', domaine: 'travail', sousDomaine: 'contrat',
    tags: ['non-concurrence', 'clause', 'interdiction', 'concurrence'],
    questions: [
      { id: 'q1', text: 'Clause de non-concurrence signee ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q2', text: 'Duree de l interdiction ?', options: ['<1 an', '1-2 ans', '2-3 ans', '>3 ans'] },
      { id: 'q3', text: 'Perimetre geographique defini ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Qui a resilie le contrat ?', options: ['employeur sans juste motif', 'employe', 'accord mutuel'] },
      Q5
    ],
    reponse: {
      explication: "La clause de non-concurrence doit etre ecrite, limitee dans le temps, l espace et le genre d affaires (art. 340 CO). Elle ne peut exceder 3 ans (art. 340a al. 1 CO). Elle n est valable que si le travailleur a eu acces a la clientele ou aux secrets d affaires et que l utilisation de ces connaissances peut causer un prejudice sensible a l employeur. La clause tombe si l employeur resilie le contrat sans que le travailleur lui ait donne un motif justifie (art. 340c al. 2 CO). Le juge peut reduire une clause excessive (art. 340a al. 2 CO). La peine conventionnelle libere le travailleur de l interdiction sauf clause contraire.",
      articles: [
        { ref: 'CO 340', titre: 'Prohibition de faire concurrence — conditions', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_340' },
        { ref: 'CO 340a', titre: 'Prohibition — limites', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_340_a' },
        { ref: 'CO 340c', titre: 'Prohibition — fin', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_340_c' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_209/2008', resume: "Clause de non-concurrence annulee car le travailleur n avait pas eu acces a des secrets d affaires." },
        { ref: 'TF 4A_28/2018', resume: "La clause tombe lorsque l employeur resilie sans motif justifie imputable au travailleur." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_secret_professionnel', domaine: 'travail', sousDomaine: 'obligations',
    tags: ['secret', 'professionnel', 'confidentialite', 'donnees', 'devoir'],
    questions: [
      { id: 'q1', text: 'Type de secret ?', options: ['secret de fabrication', 'donnees clients', 'informations financieres', 'autre'] },
      { id: 'q2', text: 'Clause de confidentialite signee ?', options: ['oui', 'non'] },
      { id: 'q3', text: 'L information a-t-elle ete divulguee ?', options: ['oui', 'non mais risque'] },
      { id: 'q4', text: 'Par qui ?', options: ['par moi', 'par un collegue', 'par l employeur'] },
      Q5
    ],
    reponse: {
      explication: "Le travailleur a un devoir legal de fidelite et de discretion (art. 321a CO). Il ne doit pas reveler les secrets de fabrication ou d affaires dont il a connaissance pendant la duree du contrat. Ce devoir subsiste meme apres la fin du contrat pour les secrets de fabrication (art. 321a al. 4 CO). La violation du secret peut entrainer un licenciement avec effet immediat (art. 337 CO), des dommages-interets (art. 321e CO) et des sanctions penales (art. 162 CP pour violation du secret de fabrication). L employeur peut aussi demander des mesures provisionnelles pour empecher une divulgation imminente.",
      articles: [
        { ref: 'CO 321a', titre: 'Devoir de diligence et de fidelite', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_321_a' },
        { ref: 'CO 321e', titre: 'Responsabilite du travailleur', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_321_e' },
        { ref: 'CP 162', titre: 'Violation du secret de fabrication', lien: 'https://www.fedlex.admin.ch/eli/cc/54/757_781_799/fr#art_162' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_226/2014', resume: "Licenciement immediat justifie pour transmission de donnees clients a un concurrent." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO/CP etat 2025-01-01'
  },
  {
    id: 'travail_temps_partiel', domaine: 'travail', sousDomaine: 'contrat',
    tags: ['temps partiel', 'droits', 'egalite', 'travail sur appel'],
    questions: [
      { id: 'q1', text: 'Taux d occupation ?', options: ['<20%', '20-50%', '50-80%', '>80%'] },
      { id: 'q2', text: 'Probleme ?', options: ['pas de vacances payees', 'pas de 13e salaire', 'pas d assurances', 'discrimination'] },
      { id: 'q3', text: 'Type de contrat ?', options: ['fixe', 'sur appel regulier', 'sur appel irregulier', 'pas de contrat ecrit'] },
      { id: 'q4', text: 'Depuis combien de temps ?', options: ['<1 an', '1-5 ans', '>5 ans'] },
      Q5
    ],
    reponse: {
      explication: "Les travailleurs a temps partiel ont les memes droits que les travailleurs a plein temps, proportionnellement a leur taux d activite. Ils ont droit aux vacances (art. 329a CO), a la protection contre le licenciement, au certificat de travail. Le 13e salaire, s il est prevu par le contrat ou la CCT, s applique aussi au temps partiel. Le travail sur appel est licite mais si un volume de travail regulier s etablit, le travailleur peut pretendre a ce volume minimum. L assurance LPP (2e pilier) est obligatoire des CHF 22'050/an (seuil 2025). Les travailleurs a temps partiel ne doivent pas etre discrimines par rapport aux temps plein pour des prestations equivalentes.",
      articles: [
        { ref: 'CO 329a', titre: 'Duree des vacances', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_329_a' },
        { ref: 'CO 319', titre: 'Contrat de travail — definition', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_319' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_509/2009', resume: "Le travailleur sur appel regulier peut pretendre au volume moyen de travail des 12 derniers mois si l employeur reduit brusquement les heures." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_teletravail', domaine: 'travail', sousDomaine: 'conditions',
    tags: ['teletravail', 'homeoffice', 'domicile', 'frais', 'equipement'],
    questions: [
      { id: 'q1', text: 'Le teletravail est-il prevu au contrat ?', options: ['oui', 'non mais tolere', 'non'] },
      { id: 'q2', text: 'Probleme ?', options: ['refus du teletravail', 'frais non rembourses', 'surveillance excessive', 'teletravail impose'] },
      { id: 'q3', text: 'Frequence ?', options: ['100%', '2-3 jours/semaine', 'occasionnel'] },
      { id: 'q4', text: 'Equipement fourni ?', options: ['oui', 'partiellement', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le teletravail n est pas un droit legal en Suisse ; il necessite un accord entre les parties. L employeur peut l imposer dans des circonstances exceptionnelles (pandemie) en vertu de son droit de donner des directives (art. 321d CO). Lorsque le teletravail est convenu, l employeur doit fournir les outils necessaires ou rembourser les frais (art. 327 et 327a CO) : ordinateur, telephone, part du loyer et des charges (internet, electricite). Si l employeur impose le teletravail, il doit assumer tous les frais supplementaires. Le temps de travail et les regles de sante au travail (LTr) s appliquent aussi en teletravail. L assurance-accidents couvre les accidents survenus en teletravail dans l exercice de l activite.",
      articles: [
        { ref: 'CO 327', titre: 'Outils de travail', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_327' },
        { ref: 'CO 327a', titre: 'Remboursement des frais', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_327_a' },
        { ref: 'CO 321d', titre: 'Directives de l employeur', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_321_d' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_533/2018', resume: "L employeur qui impose le teletravail doit rembourser une part des frais de loyer et d electricite du domicile." }
      ],
      modeleLettre: "Objet : Demande de remboursement des frais de teletravail\n\nMadame, Monsieur,\n\nTravaillant depuis mon domicile [X] jours par semaine [selon accord / sur votre instruction], je vous demande le remboursement des frais engages conformement a l art. 327a CO : [equipement, internet, electricite, part de loyer].\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_burnout', domaine: 'travail', sousDomaine: 'sante',
    tags: ['burnout', 'maladie professionnelle', 'epuisement', 'sante', 'incapacite'],
    questions: [
      { id: 'q1', text: 'Avez-vous un certificat medical ?', options: ['oui arret total', 'oui arret partiel', 'non'] },
      { id: 'q2', text: 'Cause principale ?', options: ['surcharge', 'harcelement', 'pression', 'conditions de travail'] },
      { id: 'q3', text: 'Avez-vous signale le probleme a l employeur ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Assurance perte de gain ?', options: ['oui', 'non', 'je ne sais pas'] },
      Q5
    ],
    reponse: {
      explication: "Le burn-out est traite comme une maladie en droit suisse et non comme un accident professionnel (sauf cas extremes). L employe en incapacite a droit au maintien du salaire (art. 324a CO) selon l echelle applicable (Berne, Zurich ou Bale) ou via l assurance perte de gain (80% pendant 720 jours). L employeur a une obligation de proteger la sante de ses employes (art. 328 CO, art. 6 LTr). S il a neglige cette obligation (surcharge chronique, heures excessives), le travailleur peut demander des dommages-interets (art. 97 CO) et une indemnite pour tort moral (art. 49 CO). L AI peut intervenir avec des mesures de reinsertion precoce. La protection contre le licenciement s applique pendant l incapacite (art. 336c CO).",
      articles: [
        { ref: 'CO 328', titre: 'Protection de la personnalite', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_328' },
        { ref: 'CO 324a', titre: 'Empechement de travailler', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_324_a' },
        { ref: 'LTr 6', titre: 'Protection de la sante', lien: 'https://www.fedlex.admin.ch/eli/cc/1966/57_57_57/fr#art_6' },
        { ref: 'CO 336c', titre: 'Resiliation en temps inopportun', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_336_c' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_310/2019', resume: "L employeur qui n a pas pris de mesures malgre les signes d epuisement viole son devoir de protection (art. 328 CO)." },
        { ref: 'TF 4A_245/2009', resume: "Indemnite pour tort moral en cas d atteinte a la personnalite par surcharge de travail systematique." }
      ],
      modeleLettre: "",
      services: [SV, SG, { nom: 'Pro Mente Sana', tel: '0800 182 382', url: 'https://www.promentesana.ch', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO/LTr etat 2025-01-01'
  },
  {
    id: 'travail_assurance_chomage', domaine: 'travail', sousDomaine: 'chomage',
    tags: ['chomage', 'assurance', 'indemnite', 'LACI', 'conditions'],
    questions: [
      { id: 'q1', text: 'Avez-vous cotise 12 mois dans les 2 dernieres annees ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q2', text: 'Motif de la perte d emploi ?', options: ['licenciement', 'fin CDD', 'demission', 'faillite employeur'] },
      { id: 'q3', text: 'Etes-vous inscrit a l ORP ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Avez-vous un permis de travail valide ?', options: ['oui/citoyen', 'permis B', 'permis C', 'autre'] },
      Q5
    ],
    reponse: {
      explication: "Pour avoir droit aux indemnites de chomage, il faut avoir cotise au moins 12 mois pendant les 2 ans precedant l inscription (art. 13 LACI). L indemnite est de 70% du gain assure (80% avec enfants ou salaire < CHF 3797). La duree varie : 260 indemnites journalieres pour les cotisants de 12-18 mois, 400 pour 18-22 mois, 520 pour les plus de 55 ans ou les invalides (art. 27 LACI). En cas de demission sans juste motif ou de licenciement pour faute, suspension de 1 a 60 jours (art. 44 LACI). L assure doit rechercher activement un emploi et accepter tout travail convenable. L inscription a l ORP doit se faire le 1er jour de chomage.",
      articles: [
        { ref: 'LACI 13', titre: 'Periode de cotisation', lien: 'https://www.fedlex.admin.ch/eli/cc/1982/2184_2184_2184/fr#art_13' },
        { ref: 'LACI 22', titre: 'Montant de l indemnite', lien: 'https://www.fedlex.admin.ch/eli/cc/1982/2184_2184_2184/fr#art_22' },
        { ref: 'LACI 27', titre: 'Nombre maximum d indemnites', lien: 'https://www.fedlex.admin.ch/eli/cc/1982/2184_2184_2184/fr#art_27' },
        { ref: 'LACI 44', titre: 'Suspension du droit', lien: 'https://www.fedlex.admin.ch/eli/cc/1982/2184_2184_2184/fr#art_44' }
      ],
      jurisprudence: [
        { ref: 'TF 8C_465/2017', resume: "La demission pour cause de harcelement n entraine pas de suspension si le harcelement est prouve." }
      ],
      modeleLettre: "",
      services: [SV, SG, { nom: 'ORP Vaud', url: 'https://www.vd.ch/themes/economie/emploi-chomage', canton: 'VD' }, { nom: 'ORP Geneve', url: 'https://www.ge.ch/inscrire-au-chomage', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'LACI etat 2025-01-01'
  },
  {
    id: 'travail_orp_inscription', domaine: 'travail', sousDomaine: 'chomage',
    tags: ['ORP', 'inscription', 'chomage', 'recherche emploi', 'obligation'],
    questions: [
      { id: 'q1', text: 'Quand prenez-vous fin ?', options: ['deja sans emploi', '<1 mois', '1-3 mois', '>3 mois'] },
      { id: 'q2', text: 'Vous etes-vous deja inscrit ?', options: ['oui', 'non'] },
      { id: 'q3', text: 'Avez-vous commence les recherches ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Nationalite/permis ?', options: ['suisse', 'permis C', 'permis B', 'autre'] },
      Q5
    ],
    reponse: {
      explication: "L inscription a l ORP (Office regional de placement) doit se faire le premier jour de chomage au plus tard. Il est recommande de s inscrire des la reception du licenciement. L assure doit effectuer au minimum 10-12 recherches d emploi par mois (selon le canton). Il doit se presenter aux entretiens de conseil, accepter le travail convenable propose et participer aux mesures du marche du travail (cours, stages). Le non-respect de ces obligations entraine des suspensions de l indemnite. L assure doit apporter les documents : contrat de travail, lettre de licenciement, certificats, fiches de salaire, piece d identite, permis de travail.",
      articles: [
        { ref: 'LACI 17', titre: 'Devoirs de l assure', lien: 'https://www.fedlex.admin.ch/eli/cc/1982/2184_2184_2184/fr#art_17' },
        { ref: 'LACI 30', titre: 'Suspension en cas de faute', lien: 'https://www.fedlex.admin.ch/eli/cc/1982/2184_2184_2184/fr#art_30' }
      ],
      jurisprudence: [
        { ref: 'TF 8C_192/2013', resume: "L inscription tardive a l ORP entraine la perte des indemnites pour les jours anterieurs a l inscription." }
      ],
      modeleLettre: "",
      services: [{ nom: 'ORP Vaud', url: 'https://www.vd.ch/themes/economie/emploi-chomage', canton: 'VD' }, { nom: 'ORP Geneve', url: 'https://www.ge.ch/inscrire-au-chomage', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'LACI etat 2025-01-01'
  },
  {
    id: 'travail_delai_conge', domaine: 'travail', sousDomaine: 'resiliation',
    tags: ['delai', 'conge', 'resiliation', 'preavis', 'fin contrat'],
    questions: [
      { id: 'q1', text: 'Anciennete ?', options: ['periode d essai', '<1 an', '1-9 ans', '>9 ans'] },
      { id: 'q2', text: 'CCT applicable ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q3', text: 'Clause contractuelle specifique ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Resiliation donnee quand ?', options: ['debut de mois', 'milieu', 'fin'] },
      Q5
    ],
    reponse: {
      explication: "Les delais de conge legaux sont (art. 335c CO) : pendant l essai, 7 jours ; 1ere annee, 1 mois pour la fin d un mois ; 2e a 9e annee, 2 mois pour la fin d un mois ; des la 10e annee, 3 mois pour la fin d un mois. Le contrat ou la CCT peut prevoir des delais plus longs (jamais plus courts sauf par CCT). Le conge doit etre recu par l autre partie avant le debut du delai. Par lettre recommandee, c est la date de reception qui compte (non l envoi). Le non-respect du delai ne rend pas le conge nul mais le reporte au prochain terme.",
      articles: [
        { ref: 'CO 335c', titre: 'Delais de conge', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_335_c' },
        { ref: 'CO 335b', titre: 'Temps d essai', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_335_b' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_56/2013', resume: "Le conge doit parvenir a l employe avant le debut du delai de preavis ; un envoi tardif reporte au terme suivant." }
      ],
      modeleLettre: "Objet : Resiliation du contrat de travail\n\nMadame, Monsieur,\n\nPar la presente, je vous notifie la resiliation de mon contrat de travail avec effet au [date], en respectant le delai de [1/2/3] mois prevu par [le contrat / l art. 335c CO].\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_indemnite_depart', domaine: 'travail', sousDomaine: 'resiliation',
    tags: ['indemnite', 'depart', 'anciennete', 'licenciement', 'age'],
    questions: [
      { id: 'q1', text: 'Age ?', options: ['<50 ans', '50-55 ans', '55-60 ans', '>60 ans'] },
      { id: 'q2', text: 'Anciennete ?', options: ['<20 ans', '20-25 ans', '25-30 ans', '>30 ans'] },
      { id: 'q3', text: 'Caisse de pension (LPP) ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Qui a resilie ?', options: ['employeur', 'employe'] },
      Q5
    ],
    reponse: {
      explication: "L indemnite de depart (art. 339b CO) est due aux travailleurs de plus de 50 ans avec 20 ans de service minimum. Le montant est de 2 mois de salaire pour 20 ans, augmentant jusqu a 8 mois pour des rapports de tres longue duree (art. 339c CO). Les prestations de la caisse de pension (LPP) sont deduites de l indemnite dans la mesure ou elles ont ete financees par l employeur (art. 339d CO). En pratique, avec la generalisation du 2e pilier, l indemnite est souvent reduite a zero. Le contrat ou la CCT peut prevoir des indemnites plus favorables. L indemnite n est pas due si le travailleur demissionne ou est licencie pour faute grave.",
      articles: [
        { ref: 'CO 339b', titre: 'Indemnite a raison de longs rapports', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_339_b' },
        { ref: 'CO 339c', titre: 'Montant de l indemnite', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_339_c' },
        { ref: 'CO 339d', titre: 'Prestations de remplacement', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_339_d' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_194/2011', resume: "Les prestations LPP financees par l employeur sont deduites de l indemnite de depart." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_convention_collective', domaine: 'travail', sousDomaine: 'contrat',
    tags: ['CCT', 'convention collective', 'contrat-type', 'branche'],
    questions: [
      { id: 'q1', text: 'Connaissez-vous la CCT applicable ?', options: ['oui', 'non', 'pas de CCT'] },
      { id: 'q2', text: 'Secteur ?', options: ['construction', 'hotellerie', 'sante', 'commerce', 'industrie', 'autre'] },
      { id: 'q3', text: 'Probleme ?', options: ['salaire inferieur CCT', 'conditions non respectees', 'pas d information', 'autre'] },
      { id: 'q4', text: 'Employeur affilie a une association patronale ?', options: ['oui', 'non', 'je ne sais pas'] },
      Q5
    ],
    reponse: {
      explication: "Les conventions collectives de travail (CCT) fixent des conditions minimales (salaire, vacances, temps de travail) pour une branche ou une entreprise (art. 356 CO). Certaines CCT sont declarees de force obligatoire (etendue) par le Conseil federal et s appliquent a tous les employeurs de la branche, meme non signataires. Le travailleur peut consulter les CCT sur www.service-cct.ch. Si l employeur ne respecte pas la CCT, le travailleur peut reclamer les prestations manquantes. La commission paritaire de la branche peut effectuer des controles. L action en paiement se prescrit par 5 ans (art. 128 ch. 3 CO).",
      articles: [
        { ref: 'CO 356', titre: 'Convention collective — definition', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_356' },
        { ref: 'CO 357', titre: 'Effets sur les parties', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_357' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_163/2012', resume: "La CCT etendue s applique meme si le contrat individuel prevoit des conditions differentes, pour autant que la CCT soit plus favorable." }
      ],
      modeleLettre: "",
      services: [SV, SG, { nom: 'Service CCT (SECO)', url: 'https://www.service-cct.ch', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_temporaire', domaine: 'travail', sousDomaine: 'contrat',
    tags: ['temporaire', 'interim', 'agence', 'location services', 'mission'],
    questions: [
      { id: 'q1', text: 'Type de mission ?', options: ['interim court (<3 mois)', 'interim long (>3 mois)', 'mission unique', 'missions repetees'] },
      { id: 'q2', text: 'Probleme ?', options: ['fin de mission abrupte', 'salaire insuffisant', 'pas d assurances', 'conditions de travail'] },
      { id: 'q3', text: 'Agence autorisee ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q4', text: 'Contrat ecrit ?', options: ['oui contrat cadre', 'oui contrat de mission', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le travail temporaire (location de services) est regi par la LSE (art. 12 ss). L agence (bailleur) est l employeur juridique du travailleur. Elle doit detenir une autorisation cantonale. Le contrat de mission doit etre ecrit (art. 19 LSE). Le travailleur temporaire a droit aux memes conditions de salaire et de travail que les employes fixes de l entreprise utilisatrice pour un travail equivalent (CCT applicable). L agence doit verser les cotisations sociales (AVS/AI/APG/AC) et l assurance-accidents. Apres 3 mois de mission continue chez le meme utilisateur, la protection contre le licenciement en temps inopportun s applique. La CCT Location de services fixe des minima salariaux par branche.",
      articles: [
        { ref: 'LSE 12', titre: 'Location de services — obligation d autorisation', lien: 'https://www.fedlex.admin.ch/eli/cc/1991/392_392_392/fr#art_12' },
        { ref: 'LSE 19', titre: 'Contrat de travail', lien: 'https://www.fedlex.admin.ch/eli/cc/1991/392_392_392/fr#art_19' },
        { ref: 'LSE 20', titre: 'Conditions de travail', lien: 'https://www.fedlex.admin.ch/eli/cc/1991/392_392_392/fr#art_20' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_428/2010', resume: "Le travailleur temporaire a droit au meme salaire que les employes permanents de l entreprise utilisatrice pour un poste equivalent." }
      ],
      modeleLettre: "",
      services: [SV, SG, { nom: 'SECO — location de services', url: 'https://www.seco.admin.ch/seco/fr/home/Arbeit/Personenfreizugigkeit_Arbeitsbeziehungen/Arbeitsvermittlung.html', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'LSE etat 2025-01-01'
  },
  {
    id: 'travail_stagiaire', domaine: 'travail', sousDomaine: 'contrat',
    tags: ['stage', 'stagiaire', 'droits', 'remuneration', 'formation'],
    questions: [
      { id: 'q1', text: 'Type de stage ?', options: ['obligatoire (formation)', 'post-formation', 'reconversion', 'non defini'] },
      { id: 'q2', text: 'Remunere ?', options: ['oui', 'non', 'defraiement uniquement'] },
      { id: 'q3', text: 'Duree ?', options: ['<3 mois', '3-6 mois', '6-12 mois', '>12 mois'] },
      { id: 'q4', text: 'Contrat ecrit ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le stagiaire est un travailleur au sens du CO si un lien de subordination existe (art. 319 CO). Il a droit aux memes protections : salaire, vacances, protection contre le licenciement. Un stage gratuit n est admis que si la formation est l element preponderant. Si le stagiaire effectue un travail productif, il doit etre remunere. Les stages de plus de 3 mois doivent etre declares aux assurances sociales (AVS/AI/APG). La LTr (protection de la sante, temps de travail) s applique aux stagiaires. Un stage qui se prolonge sans objectif de formation defini risque d etre requalifie en contrat de travail ordinaire.",
      articles: [
        { ref: 'CO 319', titre: 'Contrat de travail — definition', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_319' },
        { ref: 'CO 344', titre: 'Contrat d apprentissage', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_344' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_200/2015', resume: "Un stage de longue duree avec travail productif est requalifie en contrat de travail ouvrant droit au salaire usuel." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_apprenti', domaine: 'travail', sousDomaine: 'formation',
    tags: ['apprenti', 'apprentissage', 'CFC', 'formation', 'droits'],
    questions: [
      { id: 'q1', text: 'Annee d apprentissage ?', options: ['1ere', '2e', '3e', '4e'] },
      { id: 'q2', text: 'Probleme ?', options: ['resiliation', 'salaire', 'conditions de travail', 'formation insuffisante', 'harcelement'] },
      { id: 'q3', text: 'Formateur en entreprise designe ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Office de formation professionnelle contacte ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le contrat d apprentissage (art. 344-346a CO) est un contrat de travail special. La periode d essai est de 1 a 3 mois (art. 344a al. 5 CO). Apres l essai, la resiliation n est possible que pour justes motifs (art. 346 CO) ou par accord des parties avec l approbation de l autorite cantonale. L employeur doit former l apprenti conformement au plan de formation et ne peut pas l utiliser principalement pour un travail productif. L apprenti a droit aux vacances (5 semaines jusqu a 20 ans, art. 345a al. 3 CO), aux jours de cours (art. 345a al. 2 CO), et a un salaire. En cas de conflit, l office cantonal de la formation professionnelle peut intervenir comme mediateur.",
      articles: [
        { ref: 'CO 344', titre: 'Contrat d apprentissage — definition', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_344' },
        { ref: 'CO 344a', titre: 'Forme et contenu', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_344_a' },
        { ref: 'CO 345a', titre: 'Obligations de l employeur', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_345_a' },
        { ref: 'CO 346', titre: 'Fin du contrat d apprentissage', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_346' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_35/2017', resume: "La resiliation du contrat d apprentissage apres l essai n est valable que pour justes motifs graves." }
      ],
      modeleLettre: "",
      services: [SV, SG, { nom: 'DGEP Vaud (formation professionnelle)', url: 'https://www.vd.ch/themes/formation/formation-professionnelle', canton: 'VD' }, { nom: 'OFPC Geneve', url: 'https://www.ge.ch/organisation/office-orientation-formation-professionnelle-continue', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_13e_salaire', domaine: 'travail', sousDomaine: 'salaire',
    tags: ['13e salaire', 'gratification', 'bonus', 'remuneration'],
    questions: [
      { id: 'q1', text: 'Le 13e salaire est-il prevu ?', options: ['oui au contrat', 'oui CCT', 'non', 'je ne sais pas'] },
      { id: 'q2', text: 'Probleme ?', options: ['pas verse', 'montant incorrect', 'pro rata conteste', 'supprime'] },
      { id: 'q3', text: 'Etes-vous parti en cours d annee ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'En periode d essai ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le 13e salaire n est pas prevu par la loi mais par le contrat, la CCT ou l usage. S il est contractuellement prevu, il est un element du salaire et ne peut pas etre supprime unilateralement. En cas de depart en cours d annee, le 13e est du pro rata temporis sauf clause contraire valable. La distinction entre 13e salaire (du dans tous les cas) et gratification (a discretion de l employeur) est importante : le 13e est un droit, la gratification est en principe facultative. Si une gratification est versee regulierement pendant 3 ans consecutifs sans reserve, elle peut devenir un droit acquis.",
      articles: [
        { ref: 'CO 322', titre: 'Salaire', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_322' },
        { ref: 'CO 322d', titre: 'Gratification', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_322_d' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_463/2017', resume: "Le 13e salaire contractuel est du pro rata temporis en cas de depart en cours d annee, sauf clause contraire claire." },
        { ref: 'TF 4A_172/2012', resume: "Une gratification versee sans reserve pendant 3 ans consecutifs devient un droit acquis." }
      ],
      modeleLettre: "Objet : Reclamation du 13e salaire\n\nMadame, Monsieur,\n\nConformement a [mon contrat / la CCT applicable], je n ai pas recu le 13e salaire pour l annee [annee] / le pro rata pour la periode du [date] au [date].\n\nJe vous prie de proceder au versement dans un delai de 10 jours.\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_gratification', domaine: 'travail', sousDomaine: 'salaire',
    tags: ['gratification', 'bonus', 'prime', 'discretionnaire'],
    questions: [
      { id: 'q1', text: 'La gratification est-elle prevue au contrat ?', options: ['oui montant fixe', 'oui variable', 'non mais versee regulierement', 'non'] },
      { id: 'q2', text: 'Versee combien d annees consecutives ?', options: ['1', '2', '3+', 'jamais encore'] },
      { id: 'q3', text: 'Clause de reserve ecrite ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q4', text: 'Motif du non-versement ?', options: ['resultat entreprise', 'performance individuelle', 'depart', 'aucun motif donne'] },
      Q5
    ],
    reponse: {
      explication: "La gratification (bonus) est en principe facultative et a la discretion de l employeur (art. 322d CO). Toutefois, elle devient obligatoire si : (1) elle est fixee dans le contrat, (2) elle est versee regulierement pendant au moins 3 ans sans reserve de caractere facultatif. Si le montant est determine ou determinable, elle est assimilee a du salaire. Pour les tres hauts salaires (>5x le salaire median suisse), le TF considere que le bonus reste discretionnaire meme en cas de versements repetes. L employeur qui supprime un bonus devenu obligatoire doit respecter un conge-modification.",
      articles: [
        { ref: 'CO 322d', titre: 'Gratification', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_322_d' },
        { ref: 'CO 322', titre: 'Salaire', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_322' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_172/2012', resume: "Gratification versee 3 ans sans reserve : droit acquis, l employeur ne peut plus la supprimer." },
        { ref: 'TF 4A_513/2017', resume: "Pour les tres hauts salaires, le bonus reste discretionnaire meme apres versements repetes." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_frais_professionnels', domaine: 'travail', sousDomaine: 'salaire',
    tags: ['frais', 'professionnels', 'remboursement', 'deplacement', 'repas'],
    questions: [
      { id: 'q1', text: 'Type de frais ?', options: ['deplacement', 'repas', 'telephone', 'equipement', 'formation'] },
      { id: 'q2', text: 'Remboursement prevu au contrat ?', options: ['oui forfait', 'oui sur justificatifs', 'non', 'je ne sais pas'] },
      { id: 'q3', text: 'Frais engages sur demande de l employeur ?', options: ['oui', 'non initiative personnelle'] },
      { id: 'q4', text: 'Montant approximatif ?', options: ['<200 CHF/mois', '200-500 CHF', '>500 CHF'] },
      Q5
    ],
    reponse: {
      explication: "L employeur doit rembourser tous les frais imposes par l execution du travail (art. 327a CO). Cette obligation est imperative et ne peut pas etre supprimee par contrat. Les frais comprennent les deplacements professionnels, les repas hors domicile, le telephone utilise pour le travail, l equipement specifique. Un forfait est admissible s il couvre raisonnablement les frais reels. L employeur doit aussi fournir les outils de travail (art. 327 CO). Les frais non rembourses sont deductibles fiscalement. Si l employeur refuse, le travailleur peut les deduire de son salaire apres mise en demeure (compensation, art. 120 CO).",
      articles: [
        { ref: 'CO 327a', titre: 'Remboursement des frais', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_327_a' },
        { ref: 'CO 327', titre: 'Outils de travail', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_327' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_533/2018', resume: "L obligation de rembourser les frais professionnels est imperative ; un forfait insuffisant doit etre complete." }
      ],
      modeleLettre: "Objet : Demande de remboursement de frais professionnels\n\nMadame, Monsieur,\n\nConformement a l art. 327a CO, je vous demande le remboursement des frais professionnels suivants engages dans le cadre de mon travail :\n- [Type de frais] : CHF [montant] (justificatif joint)\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  },
  {
    id: 'travail_protection_donnees', domaine: 'travail', sousDomaine: 'protection',
    tags: ['donnees', 'protection', 'employe', 'personnel', 'vie privee'],
    questions: [
      { id: 'q1', text: 'Probleme ?', options: ['acces au dossier personnel refuse', 'donnees transmises a des tiers', 'collecte excessive', 'cameras/surveillance'] },
      { id: 'q2', text: 'Avez-vous demande l acces ?', options: ['oui par ecrit', 'oui oralement', 'non'] },
      { id: 'q3', text: 'L employeur a-t-il un reglement de protection des donnees ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q4', text: 'Donnees concernees ?', options: ['sante', 'performance', 'correspondance', 'localisation', 'autre'] },
      Q5
    ],
    reponse: {
      explication: "L employeur ne peut traiter les donnees de l employe que dans la mesure ou elles sont necessaires au rapport de travail (art. 328b CO). La nouvelle LPD (2023) renforce les droits : droit d acces (art. 25 LPD), droit de rectification, droit a l effacement. L employeur ne peut pas collecter de donnees sur la sante au-dela de ce qui est necessaire pour le poste. La transmission de donnees a des tiers (nouveau employeur, assureur) necessite le consentement sauf obligation legale. Le dossier personnel doit etre accessible a l employe sur demande. Les references professionnelles ne peuvent etre donnees qu avec l accord de l employe.",
      articles: [
        { ref: 'CO 328b', titre: 'Protection des donnees personnelles', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_328_b' },
        { ref: 'LPD 25', titre: 'Droit d acces', lien: 'https://www.fedlex.admin.ch/eli/cc/2022/491/fr#art_25' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_518/2020', resume: "L employeur qui refuse l acces au dossier personnel viole l art. 328b CO et la LPD." }
      ],
      modeleLettre: "Objet : Demande d acces a mes donnees personnelles\n\nMadame, Monsieur,\n\nConformement a l art. 25 LPD et a l art. 328b CO, je demande l acces a l integralite des donnees me concernant detenues par l entreprise, y compris mon dossier personnel.\n\nJe vous prie de me transmettre ces informations dans un delai de 30 jours.\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG, { nom: 'Preopose federal a la protection des donnees (PFPDT)', url: 'https://www.edoeb.admin.ch', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO/LPD etat 2025-01-01'
  },
  {
    id: 'travail_surveillance', domaine: 'travail', sousDomaine: 'protection',
    tags: ['surveillance', 'cameras', 'GPS', 'email', 'monitoring'],
    questions: [
      { id: 'q1', text: 'Type de surveillance ?', options: ['cameras', 'GPS vehicule', 'logiciel sur PC', 'emails lus', 'telephone ecoute'] },
      { id: 'q2', text: 'En avez-vous ete informe ?', options: ['oui', 'non'] },
      { id: 'q3', text: 'Reglement d utilisation signe ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q4', text: 'La surveillance est-elle permanente ?', options: ['oui', 'non ponctuelle'] },
      Q5
    ],
    reponse: {
      explication: "La surveillance des employes est encadree par l art. 26 OLT 3 (interdiction des systemes de surveillance du comportement) et l art. 328 CO (protection de la personnalite). Les cameras dans les espaces de travail a des fins de controle du comportement sont interdites. La surveillance electronique (emails, internet) n est admise qu apres avertissement prealable et pour des motifs objectifs (securite, productivite). Le GPS sur un vehicule professionnel est admis pour des raisons logistiques, pas pour surveiller le comportement. La lecture des emails prives est interdite. En cas de soupcon d infraction, l employeur peut proceder a un controle cible mais doit d abord avertir l employe.",
      articles: [
        { ref: 'CO 328', titre: 'Protection de la personnalite', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_328' },
        { ref: 'CO 328b', titre: 'Protection des donnees', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_328_b' }
      ],
      jurisprudence: [
        { ref: 'TF 1C_582/2012', resume: "Le GPS sur le vehicule professionnel est admissible a des fins logistiques mais pas pour surveiller le comportement de l employe." },
        { ref: 'TF 6B_536/2009', resume: "La lecture des emails prives de l employe sans avertissement prealable viole la personnalite." }
      ],
      modeleLettre: "",
      services: [SV, SG, { nom: 'PFPDT', url: 'https://www.edoeb.admin.ch', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO/OLT 3 etat 2025-01-01'
  },
  {
    id: 'travail_reference_negative', domaine: 'travail', sousDomaine: 'fin',
    tags: ['reference', 'negative', 'certificat', 'ancien employeur', 'reputation'],
    questions: [
      { id: 'q1', text: 'De quoi s agit-il ?', options: ['reference telephonique negative', 'certificat de travail negatif', 'diffamation', 'refus de donner des references'] },
      { id: 'q2', text: 'Avez-vous perdu une opportunite a cause de cela ?', options: ['oui', 'non mais craint', 'je ne sais pas'] },
      { id: 'q3', text: 'Avez-vous des preuves ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'L ancien employeur a-t-il ete contacte ?', options: ['oui par un recruteur', 'oui par moi', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le certificat de travail doit etre veridique et bienveillant (art. 330a CO). L ancien employeur qui donne des references fausses ou exagerement negatives engage sa responsabilite (art. 328 CO, art. 41 CO). Les references doivent etre objectives et factuelles. L employe peut demander la modification d un certificat de travail inexact ou excessivement negatif. L ancien employeur ne peut pas communiquer des informations sans rapport avec le travail (vie privee, sante, opinions politiques). Le travailleur peut interdire la prise de references. Si l employe perd un emploi a cause d une reference injustifiee, il peut reclamer des dommages-interets.",
      articles: [
        { ref: 'CO 330a', titre: 'Certificat de travail', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_330_a' },
        { ref: 'CO 328', titre: 'Protection de la personnalite', lien: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_328' }
      ],
      jurisprudence: [
        { ref: 'TF 4A_117/2007', resume: "L ancien employeur qui donne des references fausses et cause un prejudice au travailleur doit reparer le dommage." },
        { ref: 'TF 4A_137/2014', resume: "Le certificat de travail doit etre a la fois veridique et bienveillant ; en cas de conflit, la verite prime." }
      ],
      modeleLettre: "Objet : Demande de modification du certificat de travail\n\nMadame, Monsieur,\n\nLe certificat de travail du [date] contient les elements suivants que je conteste : [description].\n\nConformement a l art. 330a CO, je vous demande de modifier le certificat pour qu il soit objectif et bienveillant.\n\nA defaut de reponse dans 15 jours, je saisirai le tribunal competent.\n\nVeuillez agreer, Madame, Monsieur, mes salutations distinguees.\n\n[Signature]",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CO etat 2025-01-01'
  }
];

data.push(...newFiches);
console.log('Total travail fiches: ' + data.length);
writeFileSync('src/data/fiches/travail.json', JSON.stringify(data, null, 2) + '\n');
console.log('travail.json written OK');
