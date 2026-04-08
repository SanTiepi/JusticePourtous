import { readFileSync, writeFileSync } from 'fs';
const data = JSON.parse(readFileSync('src/data/fiches/famille.json', 'utf8'));
const D = 'JusticePourtous fournit des informations juridiques generales basees sur le droit suisse en vigueur. Il ne remplace pas un conseil d avocat personnalise. Les informations sont donnees a titre indicatif et sans garantie d exhaustivite. En cas de doute, consultez un professionnel du droit ou contactez les services listes.';
const SV = { nom: 'Centre de consultation LAVI VD', tel: '021 631 03 00', url: 'https://www.centrelavi.ch', canton: 'VD' };
const SG = { nom: 'Centre LAVI Geneve', tel: '022 320 01 02', url: 'https://www.centrelavi-ge.ch', canton: 'GE' };
const Q5 = { id: 'q5', text: 'Votre canton ?', type: 'canton' };

const newFiches = [
  {
    id: 'famille_mariage_etranger', domaine: 'famille', sousDomaine: 'mariage',
    tags: ['mariage', 'etranger', 'reconnaissance', 'transcription', 'international'],
    questions: [
      { id: 'q1', text: 'Ou le mariage a-t-il ete celebre ?', options: ['pays UE', 'pays hors UE', 'consulat suisse'] },
      { id: 'q2', text: 'Le mariage est-il valable dans le pays de celebration ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q3', text: 'Avez-vous demande la transcription en Suisse ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Nationalites des epoux ?', options: ['les deux suisses', 'un suisse + un etranger', 'les deux etrangers'] },
      Q5
    ],
    reponse: {
      explication: "Un mariage celebre a l etranger est reconnu en Suisse s il est valable selon le droit du lieu de celebration (art. 45 LDIP). Il doit etre transcrit dans le registre de l etat civil suisse. La transcription est necessaire pour qu il produise des effets en Suisse (permis, assurances, succession). La demande se fait aupres de l Office de l etat civil du lieu de domicile. Les documents requis sont : acte de mariage apostille ou legalise, traduction certifiee, pieces d identite. Un mariage polygame ou impliquant un mineur n est pas reconnu en Suisse. Le delai de traitement est de 2 a 6 mois.",
      articles: [
        { ref: 'LDIP 45', titre: 'Reconnaissance du mariage celebre a l etranger', lien: 'https://www.fedlex.admin.ch/eli/cc/1988/1776_1776_1776/fr#art_45' },
        { ref: 'CC 159', titre: 'Effets generaux du mariage', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_159' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_702/2016', resume: "Reconnaissance d un mariage celebre a l etranger sous reserve de l ordre public suisse (pas de mariage de mineurs)." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Etat civil VD', url: 'https://www.vd.ch/themes/population/etat-civil', canton: 'VD' }, { nom: 'Etat civil GE', url: 'https://www.ge.ch/organisation/service-etat-civil', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'LDIP/CC etat 2025-01-01'
  },
  {
    id: 'famille_partenariat', domaine: 'famille', sousDomaine: 'union',
    tags: ['partenariat', 'enregistre', 'PACS', 'couple', 'meme sexe'],
    questions: [
      { id: 'q1', text: 'Situation ?', options: ['conclusion', 'droits pendant', 'dissolution', 'conversion en mariage'] },
      { id: 'q2', text: 'Probleme specifique ?', options: ['succession', 'impots', 'nom', 'nationalite', 'autre'] },
      { id: 'q3', text: 'Partenariat conclu ou ?', options: ['en Suisse', 'a l etranger'] },
      { id: 'q4', text: 'Souhaitez-vous convertir en mariage ?', options: ['oui', 'non', 'deja fait'] },
      Q5
    ],
    reponse: {
      explication: "Depuis le 1er juillet 2022, le mariage est ouvert a tous les couples en Suisse (mariage pour tous). Les partenariats enregistres existants restent valables mais ne peuvent plus etre conclus. Les partenaires enregistres peuvent convertir leur partenariat en mariage par simple declaration commune a l etat civil (art. 35 de la loi d introduction). Les effets juridiques du partenariat enregistre (LPart) sont similaires au mariage : devoir d assistance (art. 12 LPart), entretien (art. 13 LPart), effets successoraux equivalents au conjoint. La dissolution suit une procedure simplifiee si les deux partenaires sont d accord.",
      articles: [
        { ref: 'LPart 1', titre: 'Partenariat enregistre — principes', lien: 'https://www.fedlex.admin.ch/eli/cc/2007/100/fr#art_1' },
        { ref: 'LPart 12', titre: 'Devoir d assistance', lien: 'https://www.fedlex.admin.ch/eli/cc/2007/100/fr#art_12' },
        { ref: 'CC 94', titre: 'Mariage — conditions', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_94' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_158/2017', resume: "Le partenariat enregistre confere les memes droits successoraux que le mariage." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Etat civil VD', url: 'https://www.vd.ch/themes/population/etat-civil', canton: 'VD' }, { nom: 'Etat civil GE', url: 'https://www.ge.ch/organisation/service-etat-civil', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'LPart/CC etat 2025-01-01'
  },
  {
    id: 'famille_adoption', domaine: 'famille', sousDomaine: 'filiation',
    tags: ['adoption', 'enfant', 'filiation', 'conditions', 'procedure'],
    questions: [
      { id: 'q1', text: 'Type d adoption ?', options: ['conjointe (couple)', 'de l enfant du conjoint', 'par une personne seule', 'internationale'] },
      { id: 'q2', text: 'Age de l enfant ?', options: ['bebe', '<10 ans', '10-18 ans', 'adulte (>18 ans)'] },
      { id: 'q3', text: 'Etape ?', options: ['debut de procedure', 'evaluation en cours', 'decision rendue', 'contestation'] },
      { id: 'q4', text: 'Pays d origine de l enfant ?', options: ['Suisse', 'Convention de La Haye', 'autre pays'] },
      Q5
    ],
    reponse: {
      explication: "L adoption cree un lien de filiation juridique complet (art. 264 ss CC). Conditions : les adoptants doivent avoir au moins 28 ans et 1 an de plus que l enfant ; les couples maries doivent etre maries depuis 3 ans ou avoir 28 ans (art. 264a CC). Depuis 2018, les couples non maries peuvent adopter l enfant du partenaire. L adoption d un mineur necessite le consentement des parents biologiques (art. 265a CC) et un placement prealable d un an minimum. L adoption internationale est regie par la Convention de La Haye et l OFJ. La procedure passe par l autorite cantonale qui mene une enquete sur l aptitude des adoptants. L adoption d un adulte est possible dans des cas exceptionnels (art. 266 CC).",
      articles: [
        { ref: 'CC 264', titre: 'Adoption — conditions', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_264' },
        { ref: 'CC 264a', titre: 'Adoption conjointe', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_264_a' },
        { ref: 'CC 265a', titre: 'Consentement des parents', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_265_a' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_609/2016', resume: "L adoption de l enfant du conjoint est admise lorsque l interet de l enfant le commande et que les liens avec le parent biologique sont maintenus." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Service de protection de la jeunesse VD (SPJ)', url: 'https://www.vd.ch/themes/sante-soins-et-handicap/enfance-et-jeunesse', canton: 'VD' }, { nom: 'Service de protection des mineurs GE (SPMi)', url: 'https://www.ge.ch/organisation/service-protection-mineurs', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_autorite_parentale_conjointe', domaine: 'famille', sousDomaine: 'enfant',
    tags: ['autorite parentale', 'conjointe', 'garde', 'decisions', 'parents'],
    questions: [
      { id: 'q1', text: 'Situation ?', options: ['parents maries', 'parents non maries', 'apres divorce', 'apres separation'] },
      { id: 'q2', text: 'Probleme ?', options: ['desaccord education', 'desaccord medical', 'desaccord demenagement', 'exclusion d un parent'] },
      { id: 'q3', text: 'L autorite parentale est-elle conjointe ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q4', text: 'Y a-t-il un jugement ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Depuis 2014, l autorite parentale conjointe est la regle, meme en cas de divorce ou pour les parents non maries (art. 296 al. 2 CC). Les deux parents prennent ensemble les decisions importantes (ecole, religion, soins medicaux, demenagement). Le parent gardien prend seul les decisions courantes et les mesures urgentes (art. 301 al. 1bis CC). Le demenagement a l etranger ou dans un autre canton avec impact significatif necessite l accord de l autre parent ou une decision judiciaire (art. 301a CC). L autorite parentale exclusive n est attribuee que si l interet de l enfant l exige (art. 298 al. 1 CC). En cas de desaccord persistant, le juge ou l APEA tranche.",
      articles: [
        { ref: 'CC 296', titre: 'Autorite parentale — principe', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_296' },
        { ref: 'CC 301', titre: 'Exercice de l autorite parentale', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_301' },
        { ref: 'CC 301a', titre: 'Changement de lieu de residence', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_301_a' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_923/2018', resume: "Le demenagement en France avec l enfant sans accord du pere viole l autorite parentale conjointe." }
      ],
      modeleLettre: "",
      services: [SV, SG, { nom: 'APEA / Justice de paix VD', url: 'https://www.vd.ch/autorites/ordre-judiciaire/justices-de-paix', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_enlevement_international', domaine: 'famille', sousDomaine: 'enfant',
    tags: ['enlevement', 'international', 'enfant', 'La Haye', 'deplacement illicite'],
    questions: [
      { id: 'q1', text: 'L enfant a-t-il ete emmene a l etranger ?', options: ['oui', 'non retenu a l etranger'] },
      { id: 'q2', text: 'Le pays est-il partie a la Convention de La Haye ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q3', text: 'Depuis quand ?', options: ['<1 semaine', '1 semaine-1 mois', '1-12 mois', '>1 an'] },
      { id: 'q4', text: 'Y a-t-il un jugement de garde ?', options: ['oui', 'non', 'en cours'] },
      Q5
    ],
    reponse: {
      explication: "Le deplacement ou la retention illicite d un enfant est regi par la Convention de La Haye (CLaH 80). L autorite centrale suisse (OFJ) doit etre saisie immediatement. Le retour de l enfant doit etre ordonne si la demande est faite dans l annee (art. 12 CLaH 80). Le retour peut etre refuse si l enfant est expose a un danger grave (art. 13 al. 1 let. b CLaH 80) ou si l enfant mature s oppose au retour. En Suisse, le tribunal cantonal competent statue en procedure sommaire (art. 7 LF-EEA). Le deplacement illicite est aussi un delit penal (art. 220 CP, enlevement de mineur). Il faut agir TRES rapidement : chaque jour compte.",
      articles: [
        { ref: 'CLaH 80 art. 3', titre: 'Deplacement illicite — definition', lien: 'https://www.fedlex.admin.ch/eli/cc/1984/370_370_370/fr#art_3' },
        { ref: 'CP 220', titre: 'Enlevement de mineur', lien: 'https://www.fedlex.admin.ch/eli/cc/54/757_781_799/fr#art_220' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_584/2018', resume: "Retour ordonne dans les 6 semaines apres la saisine ; le danger grave doit etre concret et grave, pas hypothetique." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Autorite centrale suisse (OFJ)', tel: '058 462 47 62', url: 'https://www.bj.admin.ch/bj/fr/home/gesellschaft/kindesentfuehrung.html', canton: 'VD' }, SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CLaH 80/CP etat 2025-01-01'
  },
  {
    id: 'famille_mediation', domaine: 'famille', sousDomaine: 'procedure',
    tags: ['mediation', 'familiale', 'conflit', 'accord', 'amiable'],
    questions: [
      { id: 'q1', text: 'Contexte ?', options: ['divorce', 'separation', 'conflit parental', 'succession', 'autre'] },
      { id: 'q2', text: 'Les deux parties acceptent la mediation ?', options: ['oui', 'non', 'je ne sais pas'] },
      { id: 'q3', text: 'Une procedure judiciaire est-elle en cours ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Avez-vous des enfants mineurs ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "La mediation familiale est un processus volontaire de resolution des conflits avec l aide d un mediateur neutre. Le CPC la prevoit comme alternative (art. 213-218 CPC). Le tribunal peut recommander la mediation a tout stade de la procedure (art. 214 CPC). Le processus est confidentiel. L accord de mediation peut etre homologue par le tribunal et devient executoire. La mediation est particulierement recommandee pour les conflits parentaux (garde, visite) car elle preserve la relation entre les parents. Les frais sont partages et souvent inferieurs a ceux d une procedure judiciaire. Certains cantons subventionnent la mediation familiale.",
      articles: [
        { ref: 'CPC 213', titre: 'Mediation — principes', lien: 'https://www.fedlex.admin.ch/eli/cc/2010/262/fr#art_213' },
        { ref: 'CPC 214', titre: 'Mediation en procedure', lien: 'https://www.fedlex.admin.ch/eli/cc/2010/262/fr#art_214' },
        { ref: 'CPC 217', titre: 'Homologation de l accord', lien: 'https://www.fedlex.admin.ch/eli/cc/2010/262/fr#art_217' }
      ],
      jurisprudence: [],
      modeleLettre: "",
      services: [{ nom: 'Federation suisse des avocats-mediateurs', url: 'https://www.mediation-ch.org', canton: 'VD' }, { nom: 'Service de mediation familiale VD', url: 'https://www.vd.ch/themes/sante-soins-et-handicap/enfance-et-jeunesse', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CPC etat 2025-01-01'
  },
  {
    id: 'famille_protection_adulte_apea', domaine: 'famille', sousDomaine: 'protection',
    tags: ['APEA', 'protection adulte', 'curatelle', 'tutelle', 'incapacite'],
    questions: [
      { id: 'q1', text: 'Qui est concerne ?', options: ['moi-meme', 'un parent', 'un proche', 'un voisin'] },
      { id: 'q2', text: 'Raison ?', options: ['maladie psychique', 'demence', 'addiction', 'handicap', 'mise en danger'] },
      { id: 'q3', text: 'Mesure demandee ?', options: ['curatelle d accompagnement', 'curatelle de representation', 'curatelle de gestion', 'PAFA'] },
      { id: 'q4', text: 'La personne est-elle d accord ?', options: ['oui', 'non', 'ne peut pas s exprimer'] },
      Q5
    ],
    reponse: {
      explication: "L APEA (Autorite de protection de l adulte et de l enfant) intervient lorsqu une personne ne peut plus gerer ses affaires en raison d une deficience mentale, d un trouble psychique, ou d une situation similaire (art. 390 CC). Les mesures vont de la curatelle d accompagnement (aide sans representation, art. 393 CC) a la curatelle de portee generale (art. 398 CC). L APEA respecte le principe de proportionnalite : la mesure la moins restrictive possible. Tout le monde peut signaler une personne en danger a l APEA (art. 443 CC). La personne concernee peut contester toute mesure (art. 450 CC). Le placement a des fins d assistance (PAFA) est possible en cas de danger grave (art. 426 CC).",
      articles: [
        { ref: 'CC 390', titre: 'Conditions de la curatelle', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_390' },
        { ref: 'CC 393', titre: 'Curatelle d accompagnement', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_393' },
        { ref: 'CC 426', titre: 'Placement a des fins d assistance', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_426' },
        { ref: 'CC 443', titre: 'Signalement a l APEA', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_443' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_794/2017', resume: "La curatelle doit etre proportionnee ; une curatelle de portee generale n est justifiee qu en dernier recours." }
      ],
      modeleLettre: "",
      services: [{ nom: 'APEA / Justice de paix VD', url: 'https://www.vd.ch/autorites/ordre-judiciaire/justices-de-paix', canton: 'VD' }, { nom: 'Tribunal de protection de l adulte et de l enfant GE', url: 'https://justice.ge.ch/fr/institution/tribunal-protection-adulte-enfant', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_mandat_inaptitude', domaine: 'famille', sousDomaine: 'protection',
    tags: ['mandat', 'inaptitude', 'incapacite', 'directives anticipees', 'prevoyance'],
    questions: [
      { id: 'q1', text: 'Objectif ?', options: ['rediger un mandat', 'activer un mandat existant', 'contester un mandat', 'modifier un mandat'] },
      { id: 'q2', text: 'La personne est-elle encore capable de discernement ?', options: ['oui', 'non', 'partiellement'] },
      { id: 'q3', text: 'Le mandat est-il ecrit a la main ?', options: ['oui entierement', 'non', 'acte notarie'] },
      { id: 'q4', text: 'Le mandataire designe accepte-t-il ?', options: ['oui', 'non', 'pas encore contacte'] },
      Q5
    ],
    reponse: {
      explication: "Toute personne capable de discernement peut etablir un mandat pour cause d inaptitude (art. 360 CC), designant une personne de confiance pour la representer en cas de perte de la capacite de discernement. Le mandat doit etre entierement ecrit a la main, date et signe (art. 361 CC), OU passe en la forme d un acte authentique (notarie). Il peut couvrir l assistance personnelle, la gestion du patrimoine et les relations juridiques. L APEA verifie la validite du mandat lorsqu il doit etre active (art. 363 CC). Le mandataire agit dans l interet de la personne. Les directives anticipees du patient (art. 370 CC) sont un instrument complementaire pour les decisions medicales.",
      articles: [
        { ref: 'CC 360', titre: 'Mandat pour cause d inaptitude', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_360' },
        { ref: 'CC 361', titre: 'Forme du mandat', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_361' },
        { ref: 'CC 370', titre: 'Directives anticipees du patient', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_370' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_872/2018', resume: "Le mandat pour cause d inaptitude non ecrit entierement a la main est nul." }
      ],
      modeleLettre: "",
      services: [{ nom: 'APEA / Justice de paix VD', url: 'https://www.vd.ch/autorites/ordre-judiciaire/justices-de-paix', canton: 'VD' }, { nom: 'Pro Senectute', tel: '0848 111 112', url: 'https://www.prosenectute.ch', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_testament_olographe', domaine: 'famille', sousDomaine: 'succession',
    tags: ['testament', 'olographe', 'redaction', 'succession', 'volontes'],
    questions: [
      { id: 'q1', text: 'Objectif ?', options: ['rediger', 'modifier', 'contester un testament', 'comprendre les regles'] },
      { id: 'q2', text: 'Avez-vous des heritiers reservataires ?', options: ['oui conjoint', 'oui enfants', 'oui les deux', 'non'] },
      { id: 'q3', text: 'Le testament est-il ecrit entierement a la main ?', options: ['oui', 'non tape', 'pas encore redige'] },
      { id: 'q4', text: 'Ou sera-t-il depose ?', options: ['chez moi', 'chez un notaire', 'au tribunal', 'je ne sais pas'] },
      Q5
    ],
    reponse: {
      explication: "Le testament olographe doit etre ecrit entierement a la main, date (jour, mois, annee) et signe par le testateur (art. 505 CC). Un testament tape a l ordinateur est NUL. Le testateur peut disposer librement de la quotite disponible mais doit respecter les reserves heritaires : les descendants ont droit a la moitie de leur part legale, le conjoint a la moitie (art. 471 CC, revision 2023). Le testament peut etre depose aupres d un notaire ou au tribunal pour plus de securite. Il peut etre revoque a tout moment par un nouveau testament ou par destruction (art. 509-510 CC). L action en reduction permet aux heritiers leses de reclamer leur reserve (art. 522 CC, prescription 1 an).",
      articles: [
        { ref: 'CC 505', titre: 'Testament olographe', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_505' },
        { ref: 'CC 471', titre: 'Reserves hereditaires', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_471' },
        { ref: 'CC 522', titre: 'Action en reduction', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_522' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_748/2016', resume: "Un testament partiellement tape est nul dans son entier car ne respectant pas la forme olographe." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Chambre des notaires VD', url: 'https://www.notaires-vaud.ch', canton: 'VD' }, { nom: 'Chambre des notaires GE', url: 'https://www.notaires-geneve.ch', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_partage_succession', domaine: 'famille', sousDomaine: 'succession',
    tags: ['partage', 'succession', 'heritage', 'heritiers', 'conflit'],
    questions: [
      { id: 'q1', text: 'Probleme ?', options: ['desaccord sur le partage', 'heritier qui bloque', 'dette du defunt', 'bien immobilier a partager'] },
      { id: 'q2', text: 'Y a-t-il un testament ?', options: ['oui', 'non'] },
      { id: 'q3', text: 'Les heritiers se sont-ils accord s ?', options: ['oui', 'partiellement', 'non'] },
      { id: 'q4', text: 'Un executeur testamentaire est-il designe ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Les heritiers forment une communaute hereditaire et doivent administrer la succession ensemble (art. 602 CC). Chaque heritier peut demander le partage a tout moment (art. 604 CC). En cas de desaccord, le tribunal designe un representant ou ordonne le partage judiciaire. Les dettes du defunt passent aux heritiers solidairement (art. 603 CC) sauf repudiation dans les 3 mois (art. 567 CC). Le benefice d inventaire permet de connaitre l etendue des dettes avant d accepter (art. 580 CC). Les biens immobiliers sont en principe attribues a un heritier qui compense les autres. Si aucun accord, la vente aux encheres publiques est ordonnee.",
      articles: [
        { ref: 'CC 602', titre: 'Communaute hereditaire', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_602' },
        { ref: 'CC 604', titre: 'Droit au partage', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_604' },
        { ref: 'CC 567', titre: 'Repudiation — delai', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_567' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_406/2017', resume: "Le partage judiciaire peut etre ordonne meme si un seul heritier s oppose au partage amiable." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Chambre des notaires VD', url: 'https://www.notaires-vaud.ch', canton: 'VD' }, { nom: 'Chambre des notaires GE', url: 'https://www.notaires-geneve.ch', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_visite_grands_parents', domaine: 'famille', sousDomaine: 'enfant',
    tags: ['grands-parents', 'visite', 'relations personnelles', 'enfant'],
    questions: [
      { id: 'q1', text: 'Qui empeche le contact ?', options: ['un parent', 'les deux parents', 'une decision judiciaire'] },
      { id: 'q2', text: 'Aviez-vous une relation reguliere avec l enfant ?', options: ['oui', 'parfois', 'peu'] },
      { id: 'q3', text: 'Motif invoque pour le refus ?', options: ['conflit familial', 'protection enfant', 'aucun motif', 'autre'] },
      { id: 'q4', text: 'Avez-vous tente une mediation ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Les grands-parents peuvent se voir accorder un droit de visite si des circonstances exceptionnelles le justifient et que l interet de l enfant le commande (art. 274a CC). C est un droit de l enfant a des relations personnelles avec ses proches, pas un droit absolu des grands-parents. L APEA peut ordonner un droit de visite contre la volonte des parents si le bien de l enfant l exige. Le refus des parents n est justifie que si le contact nuit a l enfant. La jurisprudence est restrictive : il faut demontrer que la relation est importante pour l enfant et que son absence lui cause un prejudice.",
      articles: [
        { ref: 'CC 274a', titre: 'Relations personnelles — tiers', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_274_a' },
        { ref: 'CC 273', titre: 'Relations personnelles — principe', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_273' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_463/2017', resume: "Droit de visite accorde aux grands-parents lorsque la relation existante est importante pour le developpement de l enfant." }
      ],
      modeleLettre: "",
      services: [{ nom: 'APEA / Justice de paix VD', url: 'https://www.vd.ch/autorites/ordre-judiciaire/justices-de-paix', canton: 'VD' }, { nom: 'SPMi GE', url: 'https://www.ge.ch/organisation/service-protection-mineurs', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_entretien_parents', domaine: 'famille', sousDomaine: 'entretien',
    tags: ['entretien', 'parents', 'obligation', 'aliments', 'ascendants'],
    questions: [
      { id: 'q1', text: 'Qui demande l entretien ?', options: ['parent age', 'autorite (aide sociale)', 'je suis le parent'] },
      { id: 'q2', text: 'Le parent est-il dans le besoin ?', options: ['oui aide sociale', 'oui difficile', 'non'] },
      { id: 'q3', text: 'Votre situation financiere ?', options: ['aisee', 'moyenne', 'modeste'] },
      { id: 'q4', text: 'Relations avec le parent ?', options: ['bonnes', 'distantes', 'coupees'] },
      Q5
    ],
    reponse: {
      explication: "Les enfants majeurs ont une obligation d entretien envers leurs parents dans le besoin si cela ne compromet pas leur propre entretien (art. 328 CC). Cette obligation est subsidiaire : elle n intervient que si le parent ne peut pas subvenir a ses besoins par ses propres moyens (AVS, AI, PC, fortune). L aide sociale peut se retourner contre les enfants pour reclamer le remboursement des prestations versees (action recursoire). L obligation est proportionnelle aux moyens de l enfant ; son minimum vital est preserve. La dette d entretien peut etre reduite si les relations sont gravement perturbees. L obligation est imposee a tous les enfants, chacun selon ses moyens.",
      articles: [
        { ref: 'CC 328', titre: 'Obligation d entretien entre parents', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_328' },
        { ref: 'CC 329', titre: 'Action en paiement', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_329' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_158/2010', resume: "L obligation d entretien des enfants envers les parents est subsidiaire et limitee par le minimum vital de l enfant." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Pro Senectute VD', url: 'https://vd.prosenectute.ch', canton: 'VD' }, { nom: 'Pro Senectute GE', url: 'https://ge.prosenectute.ch', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_changement_nom', domaine: 'famille', sousDomaine: 'etat civil',
    tags: ['nom', 'changement', 'etat civil', 'prenom', 'identite'],
    questions: [
      { id: 'q1', text: 'Que souhaitez-vous changer ?', options: ['nom de famille', 'prenom', 'les deux'] },
      { id: 'q2', text: 'Motif ?', options: ['mariage/divorce', 'motif personnel serieux', 'changement de genre', 'nom ridicule/penible'] },
      { id: 'q3', text: 'Age ?', options: ['mineur', 'majeur'] },
      { id: 'q4', text: 'Nationalite ?', options: ['suisse', 'double national', 'etranger'] },
      Q5
    ],
    reponse: {
      explication: "Le changement de nom de famille est possible pour justes motifs aupres du gouvernement cantonal (art. 30 al. 1 CC). Les justes motifs incluent : nom ridicule ou penible, changement de genre, motifs personnels graves. Le changement de prenom est possible avec une simple declaration a l officier de l etat civil (simplifie depuis 2022 pour les motifs de genre, art. 30b CC). En cas de mariage, chaque epoux conserve son nom sauf choix d un nom commun (art. 160 CC). Apres le divorce, l epoux qui a change de nom peut reprendre son nom anterieur par simple declaration (art. 119 CC). Emolument cantonal de CHF 200-1000 environ.",
      articles: [
        { ref: 'CC 30', titre: 'Changement de nom', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_30' },
        { ref: 'CC 160', titre: 'Nom des epoux', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_160' },
        { ref: 'CC 119', titre: 'Nom apres le divorce', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_119' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_61/2017', resume: "Le changement de nom est accorde lorsque le maintien du nom actuel cause un prejudice objectivement grave." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Etat civil VD', url: 'https://www.vd.ch/themes/population/etat-civil', canton: 'VD' }, { nom: 'Etat civil GE', url: 'https://www.ge.ch/organisation/service-etat-civil', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_reconnaissance_enfant', domaine: 'famille', sousDomaine: 'filiation',
    tags: ['reconnaissance', 'enfant', 'paternite', 'pere', 'filiation'],
    questions: [
      { id: 'q1', text: 'Situation ?', options: ['parents non maries', 'pere inconnu', 'contestation reconnaissance'] },
      { id: 'q2', text: 'La reconnaissance a-t-elle ete faite ?', options: ['oui', 'non', 'refusee'] },
      { id: 'q3', text: 'La mere est-elle d accord ?', options: ['oui', 'non', 'inconnue'] },
      { id: 'q4', text: 'L enfant est-il deja ne ?', options: ['oui', 'non (reconnaissance prenatale)'] },
      Q5
    ],
    reponse: {
      explication: "Lorsque les parents ne sont pas maries, la filiation paternelle est etablie par reconnaissance volontaire aupres de l officier de l etat civil (art. 260 CC). La reconnaissance peut se faire avant ou apres la naissance. Elle est irrevocable sauf action en contestation dans l annee (art. 260a CC). Si le pere refuse de reconnaitre, la mere ou l enfant peuvent intenter une action en paternite (art. 261 CC), avec un test ADN. La reconnaissance etablit l autorite parentale conjointe par declaration commune des parents a l etat civil (art. 298a CC). Sans cette declaration, la mere a l autorite parentale seule. La reconnaissance est la condition prealable pour la pension alimentaire.",
      articles: [
        { ref: 'CC 260', titre: 'Reconnaissance — conditions', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_260' },
        { ref: 'CC 261', titre: 'Action en paternite', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_261' },
        { ref: 'CC 298a', titre: 'Autorite parentale — parents non maries', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_298_a' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_748/2017', resume: "L action en paternite est admise sur la base d un test ADN meme si le pere presume conteste la procedure." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Etat civil VD', url: 'https://www.vd.ch/themes/population/etat-civil', canton: 'VD' }, { nom: 'Etat civil GE', url: 'https://www.ge.ch/organisation/service-etat-civil', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_desaveu_paternite', domaine: 'famille', sousDomaine: 'filiation',
    tags: ['desaveu', 'paternite', 'contestation', 'filiation', 'ADN'],
    questions: [
      { id: 'q1', text: 'Qui conteste la paternite ?', options: ['le pere legal (mari)', 'l enfant', 'le pere biologique presume'] },
      { id: 'q2', text: 'Les parents etaient-ils maries a la naissance ?', options: ['oui', 'non'] },
      { id: 'q3', text: 'Depuis quand le doute ?', options: ['<1 an', '1-5 ans', '>5 ans'] },
      { id: 'q4', text: 'Un test ADN a-t-il ete effectue ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le mari de la mere est presume pere de l enfant (art. 255 CC). Il peut contester cette presomption par une action en desaveu dans l annee suivant la decouverte (art. 256c CC), mais au plus tard 5 ans apres la naissance. L enfant peut agir jusqu a 1 an apres sa majorite (art. 256c al. 3 CC). L action doit demontrer que le mari n est pas le pere biologique (generalement par test ADN). Le tribunal peut ordonner un test ADN meme contre la volonte de la mere (art. 254 CC). La reussite de l action supprime retroactivement le lien de filiation avec le pere legal. Si un homme a reconnu un enfant hors mariage, la reconnaissance peut etre contestee dans l annee (art. 260a-260c CC).",
      articles: [
        { ref: 'CC 255', titre: 'Presomption de paternite', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_255' },
        { ref: 'CC 256', titre: 'Action en desaveu', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_256' },
        { ref: 'CC 256c', titre: 'Delais de l action', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_256_c' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_590/2016', resume: "Le delai d un an court des la connaissance effective des faits justifiant le doute, pas de la naissance." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Ordre des avocats VD', url: 'https://www.oav.ch', canton: 'VD' }, { nom: 'Ordre des avocats GE', url: 'https://www.odage.ch', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_mesures_superprovisionnelles', domaine: 'famille', sousDomaine: 'procedure',
    tags: ['superprovisionnelles', 'urgence', 'mesures', 'provisoire', 'immediate'],
    questions: [
      { id: 'q1', text: 'Urgence ?', options: ['violence immediate', 'enlevement enfant', 'dilapidation biens', 'autre danger'] },
      { id: 'q2', text: 'Avez-vous deja depose une requete ?', options: ['oui', 'non'] },
      { id: 'q3', text: 'L autre partie est-elle informee ?', options: ['oui', 'non'] },
      { id: 'q4', text: 'Avez-vous un avocat ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Les mesures superprovisionnelles sont des mesures d urgence rendues sans audition de la partie adverse (art. 265 CPC). Elles sont justifiees en cas de danger immediat : violence conjugale (interdiction d approcher), risque d enlevement d enfant (interdiction de quitter le territoire), dilapidation de biens (blocage de comptes). Le juge statue dans les heures ou jours suivant la requete. Ces mesures sont provisoires et doivent etre confirmees ou revoquees rapidement lors d une audience contradictoire (art. 265 al. 2 CPC). La requete doit demontrer l urgence et la vraisemblance du droit invoque. Un avocat est fortement recommande.",
      articles: [
        { ref: 'CPC 265', titre: 'Mesures superprovisionnelles', lien: 'https://www.fedlex.admin.ch/eli/cc/2010/262/fr#art_265' },
        { ref: 'CPC 261', titre: 'Mesures provisionnelles — principe', lien: 'https://www.fedlex.admin.ch/eli/cc/2010/262/fr#art_261' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_901/2017', resume: "Mesure superprovisionnelle d interdiction de quitter la Suisse avec l enfant accordee en cas de risque concret d enlevement." }
      ],
      modeleLettre: "",
      services: [SV, SG, { nom: 'Permanence juridique VD', url: 'https://www.vd.ch/themes/etat-droit-finances/justice-tribunaux', canton: 'VD' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CPC etat 2025-01-01'
  },
  {
    id: 'famille_logement_conjugal', domaine: 'famille', sousDomaine: 'mariage',
    tags: ['logement', 'conjugal', 'familial', 'attribution', 'separation'],
    questions: [
      { id: 'q1', text: 'Situation ?', options: ['separation en cours', 'divorce en cours', 'violence conjugale', 'desaccord sur qui reste'] },
      { id: 'q2', text: 'Qui est titulaire du bail / proprietaire ?', options: ['moi seul', 'l autre seul', 'les deux', 'je ne sais pas'] },
      { id: 'q3', text: 'Y a-t-il des enfants ?', options: ['oui mineurs', 'oui majeurs', 'non'] },
      { id: 'q4', text: 'Un juge a-t-il deja statue ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "Le logement familial beneficie d une protection speciale en droit suisse. Pendant le mariage, aucun epoux ne peut disposer du logement sans le consentement de l autre, meme s il est seul proprietaire ou titulaire du bail (art. 169 CC). En cas de separation, le juge attribue le logement a l un des epoux en tenant compte de l interet des enfants et de la situation des parties (art. 176 al. 1 ch. 2 CC). En cas de divorce, l attribution suit les memes principes (art. 121 CC). Le transfert du bail est possible par decision judiciaire (art. 121 al. 2 CC). En cas de violence, le conjoint violent peut etre expulse immediatement (art. 28b CC).",
      articles: [
        { ref: 'CC 169', titre: 'Protection du logement familial', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_169' },
        { ref: 'CC 176', titre: 'Mesures protectrices — attribution du logement', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_176' },
        { ref: 'CC 121', titre: 'Attribution du logement apres divorce', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_121' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_591/2017', resume: "Le logement familial est attribue au parent qui a la garde principale des enfants, meme si l autre est proprietaire." }
      ],
      modeleLettre: "",
      services: [SV, SG],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_regime_matrimonial', domaine: 'famille', sousDomaine: 'mariage',
    tags: ['regime matrimonial', 'liquidation', 'biens', 'divorce', 'partage'],
    questions: [
      { id: 'q1', text: 'Regime matrimonial ?', options: ['participation aux acquets (defaut)', 'separation de biens', 'communaute de biens', 'je ne sais pas'] },
      { id: 'q2', text: 'Contexte ?', options: ['divorce', 'deces', 'changement de regime', 'information'] },
      { id: 'q3', text: 'Duree du mariage ?', options: ['<5 ans', '5-15 ans', '>15 ans'] },
      { id: 'q4', text: 'Biens en jeu ?', options: ['immobilier', 'epargne', 'entreprise', 'mixte'] },
      Q5
    ],
    reponse: {
      explication: "Le regime legal ordinaire est la participation aux acquets (art. 196 ss CC). A la dissolution (divorce, deces), chaque epoux reprend ses biens propres (apports, heritages, art. 198 CC) et a droit a la moitie du benefice des acquets de l autre (art. 215 CC). Les acquets sont les biens acquis a titre onereux pendant le mariage (salaire, revenus, art. 197 CC). Le logement familial et le mobilier peuvent etre attribues a un epoux meme s ils appartiennent a l autre (art. 205 CC). Les epoux peuvent choisir la separation de biens ou la communaute par contrat de mariage notarie (art. 182 CC). La liquidation du regime est un prealable au jugement de divorce.",
      articles: [
        { ref: 'CC 196', titre: 'Participation aux acquets — principe', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_196' },
        { ref: 'CC 197', titre: 'Acquets', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_197' },
        { ref: 'CC 215', titre: 'Partage du benefice', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_215' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_111/2016', resume: "L augmentation de valeur d un bien propre pendant le mariage est un acquis a partager." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Chambre des notaires VD', url: 'https://www.notaires-vaud.ch', canton: 'VD' }, { nom: 'Chambre des notaires GE', url: 'https://www.notaires-geneve.ch', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_protection_enfant_apea', domaine: 'famille', sousDomaine: 'enfant',
    tags: ['protection', 'enfant', 'APEA', 'mesures', 'danger'],
    questions: [
      { id: 'q1', text: 'Situation ?', options: ['negligence', 'violence', 'conflit parental grave', 'addiction parent', 'autre danger'] },
      { id: 'q2', text: 'Qui signale ?', options: ['un parent', 'un proche', 'professionnel', 'je suis l enfant'] },
      { id: 'q3', text: 'Mesure souhaitee ?', options: ['curatelle educative', 'droit de regard', 'retrait de garde', 'placement'] },
      { id: 'q4', text: 'L APEA est-elle deja saisie ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "L APEA intervient lorsque le developpement de l enfant est menace et que les parents ne peuvent ou ne veulent pas y remedier (art. 307 CC). Les mesures vont de l avertissement (art. 307 al. 3 CC) au retrait de l autorite parentale (art. 311 CC), en passant par la curatelle educative (art. 308 CC) et le placement (art. 310 CC). Le principe de proportionnalite s applique : la mesure la moins invasive d abord. Tout professionnel en contact avec des enfants a une obligation de signalement (art. 314d CC). Les parents peuvent contester les mesures (art. 450 CC). L enfant capable de discernement est entendu (art. 314a CC).",
      articles: [
        { ref: 'CC 307', titre: 'Mesures de protection de l enfant', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_307' },
        { ref: 'CC 308', titre: 'Curatelle educative', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_308' },
        { ref: 'CC 310', titre: 'Retrait du droit de garde', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_310' },
        { ref: 'CC 311', titre: 'Retrait de l autorite parentale', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_311' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_131/2018', resume: "Le placement de l enfant est une mesure de dernier recours, seulement si les mesures moins restrictives sont insuffisantes." }
      ],
      modeleLettre: "",
      services: [{ nom: 'APEA / Justice de paix VD', url: 'https://www.vd.ch/autorites/ordre-judiciaire/justices-de-paix', canton: 'VD' }, { nom: 'SPMi GE', url: 'https://www.ge.ch/organisation/service-protection-mineurs', canton: 'GE' }, SV],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC etat 2025-01-01'
  },
  {
    id: 'famille_audition_enfant', domaine: 'famille', sousDomaine: 'procedure',
    tags: ['audition', 'enfant', 'procedure', 'avis', 'representation'],
    questions: [
      { id: 'q1', text: 'Age de l enfant ?', options: ['<6 ans', '6-12 ans', '12-16 ans', '16-18 ans'] },
      { id: 'q2', text: 'Procedure en cours ?', options: ['divorce', 'garde', 'droit de visite', 'protection', 'autre'] },
      { id: 'q3', text: 'L enfant a-t-il ete entendu ?', options: ['oui', 'non', 'pas encore'] },
      { id: 'q4', text: 'Un representant de l enfant est-il nomme ?', options: ['oui', 'non'] },
      Q5
    ],
    reponse: {
      explication: "L enfant capable de discernement doit etre entendu personnellement et de maniere appropriee dans les procedures qui le concernent (art. 314a CC, art. 298 CPC). En general, les tribunaux entendent les enfants des 6 ans environ. L audition est menee par le juge ou un specialiste, sans les parents. L avis de l enfant est pris en compte mais n est pas determinant a lui seul. Le tribunal peut nommer un curateur de representation de l enfant (art. 299 CPC) lorsque c est necessaire, en particulier en cas de conflit grave entre les parents. L enfant de plus de 14 ans peut s opposer a certaines mesures et a un droit de recours. L absence d audition peut constituer un motif d annulation du jugement.",
      articles: [
        { ref: 'CC 314a', titre: 'Audition de l enfant', lien: 'https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr#art_314_a' },
        { ref: 'CPC 298', titre: 'Audition de l enfant — procedure matrimoniale', lien: 'https://www.fedlex.admin.ch/eli/cc/2010/262/fr#art_298' },
        { ref: 'CPC 299', titre: 'Representation de l enfant', lien: 'https://www.fedlex.admin.ch/eli/cc/2010/262/fr#art_299' }
      ],
      jurisprudence: [
        { ref: 'TF 5A_425/2016', resume: "L omission de l audition d un enfant de 8 ans dans une procedure de garde constitue une violation du droit d etre entendu." }
      ],
      modeleLettre: "",
      services: [{ nom: 'Tribunal d arrondissement VD', url: 'https://www.vd.ch/autorites/ordre-judiciaire', canton: 'VD' }, { nom: 'Tribunal de premiere instance GE', url: 'https://justice.ge.ch', canton: 'GE' }],
      routageEcosysteme: {},
      disclaimer: D
    },
    maj: '2026-04-07', sourceLoi: 'CC/CPC etat 2025-01-01'
  }
];

data.push(...newFiches);
console.log('Total famille fiches: ' + data.length);
writeFileSync('src/data/fiches/famille.json', JSON.stringify(data, null, 2) + '\n');
console.log('famille.json written OK');
