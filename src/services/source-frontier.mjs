/**
 * Source Frontier — Cartographie nationale des sources juridiques suisses
 *
 * Vise large, progresse intelligemment.
 * Chaque source est cartographiée en METADATA AVANT ingestion.
 * L'ingestion ne se fait que si la source fait bouger un golden case.
 *
 * 3 niveaux de profondeur :
 *   1. mapped    — on sait que ça existe, type + URL + périmètre
 *   2. assessed  — on connaît la valeur probatoire + stratégie d'ingestion
 *   3. ingested  — données dans notre registre avec source_id
 */

import { getRegistry } from './source-registry.mjs';
import { getObjectStats } from './object-registry.mjs';

// ─── Source catalog — ce qui EXISTE en Suisse ───────────────────

const SOURCE_CATALOG = {

  // ═══ TIER 1 — Officiel contraignant ═══

  fedlex_lois: {
    id: 'fedlex_lois',
    name: 'Lois fédérales (Fedlex)',
    type: 'loi_federale',
    tier: 1,
    url: 'https://www.fedlex.admin.ch/fr/cc',
    format: 'HTML + XML/ELI',
    coverage: 'national',
    domaines: ['bail', 'travail', 'dettes', 'famille', 'etrangers'],
    freshness: 'consolidation continue',
    ingestion_strategy: 'ELI API + HTML scraping par article range',
    our_status: 'ingested', // 4448 articles
    our_count: 4448,
  },
  atf_publies: {
    id: 'atf_publies',
    name: 'Arrêts du TF publiés (ATF)',
    type: 'jurisprudence_federale',
    tier: 1,
    url: 'https://www.bger.ch/fr/index/juridiction/jurisdiction-inherit-template/jurisdiction-recht.htm',
    format: 'HTML (JS required)',
    coverage: 'national',
    domaines: ['bail', 'travail', 'dettes', 'famille', 'etrangers'],
    freshness: 'mise à jour quotidienne',
    ingestion_strategy: 'entscheidsuche.ch API ou bger.ch scraping',
    our_status: 'ingested', // 2487 arrêts
    our_count: 2487,
  },

  // ═══ TIER 2 — Quasi-officiel ═══

  entscheidsuche: {
    id: 'entscheidsuche',
    name: 'entscheidsuche.ch — moteur de recherche jurisprudence',
    type: 'jurisprudence_agregateur',
    tier: 2,
    url: 'https://entscheidsuche.ch',
    format: 'JSON API',
    coverage: 'national + cantonal',
    domaines: ['bail', 'travail', 'dettes', 'famille', 'etrangers'],
    freshness: 'quasi temps réel',
    ingestion_strategy: 'API search par domaine + date range',
    our_status: 'partial', // source de nos 2487 arrêts
    gap: 'jurisprudence cantonale manquante',
  },
  directives_ofas: {
    id: 'directives_ofas',
    name: 'Directives OFAS (assurances sociales)',
    type: 'directive_federale',
    tier: 2,
    url: 'https://sozialversicherungen.admin.ch/fr/d/6576',
    format: 'PDF',
    coverage: 'national',
    domaines: ['travail', 'social'],
    freshness: 'annuelle',
    ingestion_strategy: 'PDF download + extraction structurée',
    our_status: 'not_mapped',
    gap: 'barèmes assurances sociales manquants',
  },
  circulaires_tribunal: {
    id: 'circulaires_tribunal',
    name: 'Circulaires des tribunaux cantonaux',
    type: 'directive_cantonale',
    tier: 2,
    url: null, // varies by canton
    format: 'PDF',
    coverage: 'cantonal',
    domaines: ['bail', 'travail', 'dettes'],
    freshness: 'variable',
    ingestion_strategy: 'par canton, sites tribunaux',
    our_status: 'not_mapped',
    gap: 'pratiques cantonales non documentées',
    cantonal_urls: {
      VD: 'https://www.vd.ch/toutes-les-autorites/departements/tribunal-cantonal',
      GE: 'https://justice.ge.ch',
      BE: 'https://www.justice.be.ch',
      ZH: 'https://www.gerichte-zh.ch',
    },
  },

  // ═══ BAIL — Sources spécifiques ═══

  baremes_svit: {
    id: 'baremes_svit',
    name: 'Barèmes SVIT (loyers de référence)',
    type: 'bareme_professionnel',
    tier: 3,
    url: 'https://www.svit.ch',
    format: 'PDF / tables',
    coverage: 'national (par région)',
    domaines: ['bail'],
    freshness: 'annuelle',
    ingestion_strategy: 'tables de référence par région + type logement',
    our_status: 'not_mapped',
    gap: 'pas de données de référence loyer pour contester un loyer abusif',
    value_for_golden_cases: ['bail_augmentation_ne'],
  },
  formulaires_bail_cantonaux: {
    id: 'formulaires_bail_cantonaux',
    name: 'Formulaires officiels bail par canton',
    type: 'formulaire_officiel',
    tier: 2,
    url: null,
    format: 'PDF',
    coverage: 'cantonal',
    domaines: ['bail'],
    freshness: 'stable',
    ingestion_strategy: 'download liens directs par canton',
    our_status: 'not_mapped',
    gap: 'formulaires de contestation/résiliation non indexés',
    cantonal_urls: {
      VD: 'https://www.vd.ch/themes/logement/bail-a-loyer',
      GE: 'https://www.ge.ch/louer-logement',
      BE: 'https://www.be.ch/de/themen/mieten-und-vermieten',
    },
    value_for_golden_cases: ['bail_augmentation_ne', 'bail_expulsion_vd'],
  },
  conciliation_bail: {
    id: 'conciliation_bail',
    name: 'Autorités de conciliation en matière de baux',
    type: 'autorite_contact',
    tier: 2,
    url: null,
    format: 'HTML / annuaire',
    coverage: 'cantonal',
    domaines: ['bail'],
    freshness: 'stable',
    ingestion_strategy: 'scraping annuaires cantonaux',
    our_status: 'partial', // 14 cantons in donnees-cantonales.json
    our_count: 14,
    gap: 'manque 12 cantons (petits cantons)',
    value_for_golden_cases: ['bail_moisissure_vd', 'bail_caution_ge'],
  },
  taux_hypothecaire_reference: {
    id: 'taux_hypothecaire_reference',
    name: 'Taux hypothécaire de référence (OFL)',
    type: 'bareme_officiel',
    tier: 1,
    url: 'https://www.bwo.admin.ch/bwo/fr/home/mietrecht/referenzzinssatz.html',
    format: 'HTML table',
    coverage: 'national',
    domaines: ['bail'],
    freshness: 'trimestrielle',
    ingestion_strategy: 'table simple, 1 valeur + historique',
    our_status: 'ingested',
    our_count: 1,
    gap: null,
    value_for_golden_cases: ['bail_augmentation_ne'],
  },

  // ═══ TRAVAIL — Sources spécifiques ═══

  ccnt_conventions: {
    id: 'ccnt_conventions',
    name: 'Conventions collectives de travail (CCT/CCNT)',
    type: 'convention_collective',
    tier: 2,
    url: 'https://www.seco.admin.ch/seco/fr/home/Arbeit/Personenfreizugigkeit_Arbeitsbeziehungen/Gesamtarbeitsvertraege.html',
    format: 'PDF + liste',
    coverage: 'national (par branche)',
    domaines: ['travail'],
    freshness: 'variable',
    ingestion_strategy: 'liste des CCT étendues + extraction conditions clés',
    our_status: 'ingested',
    our_count: 5,
    gap: null,
    value_for_golden_cases: ['travail_salaire_impaye'],
  },
  orp_contacts: {
    id: 'orp_contacts',
    name: 'Offices régionaux de placement (ORP) par canton',
    type: 'autorite_contact',
    tier: 2,
    url: 'https://www.arbeit.swiss/secoalv/fr/home/menue/institutionen-medien/adressen-und-links/rav-logistikstellen-arbeitslosenkassen.html',
    format: 'HTML annuaire',
    coverage: 'cantonal',
    domaines: ['travail'],
    freshness: 'stable',
    ingestion_strategy: 'scraping annuaire officiel',
    our_status: 'not_mapped',
    gap: 'contacts ORP manquants pour le plan d\'action chômage',
  },
  calculateur_salaire: {
    id: 'calculateur_salaire',
    name: 'Calculateur de salaire (OFS Salarium)',
    type: 'outil_reference',
    tier: 3,
    url: 'https://www.gate.bfs.admin.ch/salarium/public/index.html',
    format: 'API / outil web',
    coverage: 'national',
    domaines: ['travail'],
    freshness: 'bisannuelle',
    ingestion_strategy: 'liens de référence + fourchettes par branche',
    our_status: 'not_mapped',
    gap: 'pas de référence pour savoir si un salaire est "normal" ou sous-payé',
  },

  // ═══ DETTES — Sources spécifiques ═══

  offices_poursuites: {
    id: 'offices_poursuites',
    name: 'Offices des poursuites par district',
    type: 'autorite_contact',
    tier: 2,
    url: null,
    format: 'HTML annuaire',
    coverage: 'cantonal (par district)',
    domaines: ['dettes'],
    freshness: 'stable',
    ingestion_strategy: 'annuaire cantonal par district',
    our_status: 'partial',
    gap: 'pas tous les districts, pas toutes les permanences',
    cantonal_urls: {
      VD: 'https://www.vd.ch/toutes-les-autorites/offices-des-poursuites',
      GE: 'https://www.ge.ch/demarche/consulter-office-poursuites',
    },
  },
  minimum_vital_lp93: {
    id: 'minimum_vital_lp93',
    name: 'Normes du minimum vital (LP 93, par canton)',
    type: 'bareme_cantonal',
    tier: 2,
    url: null,
    format: 'PDF / directives cantonales',
    coverage: 'cantonal',
    domaines: ['dettes'],
    freshness: 'annuelle',
    ingestion_strategy: 'extraction des normes par canton depuis directives',
    our_status: 'ingested',
    our_count: 8,
    gap: null,
    value_for_golden_cases: ['dettes_saisie_salaire'],
  },
  desendettement_services: {
    id: 'desendettement_services',
    name: 'Services de désendettement (Caritas, CSP, etc.)',
    type: 'autorite_contact',
    tier: 3,
    url: 'https://www.schulden.ch/fr/',
    format: 'HTML annuaire',
    coverage: 'national + cantonal',
    domaines: ['dettes'],
    freshness: 'stable',
    ingestion_strategy: 'annuaire schulden.ch + Caritas cantonaux',
    our_status: 'partial',
    gap: 'pas exhaustif par canton',
    value_for_golden_cases: ['dettes_commandement_payer'],
  },

  // ═══ VULGARISATION (textes simplifiés existants) ═══

  mobiliere_guides: {
    id: 'mobiliere_guides',
    name: 'La Mobilière — Guides juridiques gratuits',
    type: 'vulgarisation_professionelle',
    tier: 3,
    url: 'https://www.mobiliere.ch/theme/guide-juridique',
    format: 'HTML structuré + templates',
    coverage: 'national',
    domaines: ['bail', 'travail'],
    freshness: 'mise à jour régulière',
    ingestion_strategy: 'Extraire les textes simplifiés et modèles de lettres. Structure HTML propre.',
    our_status: 'assessed',
    ingestion_blocker: 'SPA — requires browser-based scraping (Playwright/Puppeteer)',
    gap: 'excellente source de texteSimple pour nos articles — langage citoyen vérifié par des juristes',
  },
  droitpourlapratique: {
    id: 'droitpourlapratique',
    name: 'droitpourlapratique.ch — Arrêts résumés',
    type: 'vulgarisation_jurisprudence',
    tier: 3,
    url: 'https://droitpourlapratique.ch',
    format: 'HTML structuré',
    coverage: 'national',
    domaines: ['bail', 'travail', 'dettes'],
    freshness: 'mise à jour continue',
    ingestion_strategy: 'Résumés d\'arrêts en langage pratique. Complémente nos arrêts bruts avec des résumés accessibles.',
    our_status: 'assessed',
    ingestion_blocker: 'SPA — requires browser-based scraping',
    gap: 'nos arrêts ont des résumés juridiques, pas des résumés citoyens',
  },
  guidesocial: {
    id: 'guidesocial',
    name: 'Guide social romand (guidesocial.ch)',
    type: 'vulgarisation_sociale',
    tier: 3,
    url: 'https://www.guidesocial.ch',
    format: 'HTML fiches + PDF',
    coverage: 'Suisse romande',
    domaines: ['bail', 'travail', 'dettes', 'famille', 'social'],
    freshness: 'mise à jour annuelle',
    ingestion_strategy: 'Fiches thématiques cantonales. Structure claire par thème/canton. Bonne source pour les spécificités romandes.',
    our_status: 'assessed',
    ingestion_blocker: 'SPA — fiches sociojuridiques require authenticated search filters',
    gap: 'nos fiches manquent de contexte cantonal romand structuré',
  },
  questiondedroit: {
    id: 'questiondedroit',
    name: 'questiondedroit.ch — FAQ juridique citoyen',
    type: 'vulgarisation_faq',
    tier: 3,
    url: 'https://www.questiondedroit.ch',
    format: 'HTML articles',
    coverage: 'national',
    domaines: ['bail', 'travail', 'famille'],
    freshness: 'variable',
    ingestion_strategy: 'Q&A en langage profane. Source de profane_aliases et match_description pour nos fiches.',
    our_status: 'assessed',
    ingestion_blocker: 'Site is a law firm, not a public FAQ — low value vs initial assessment',
    gap: 'nos fiches utilisent du jargon — ces Q&A montrent comment les citoyens posent leurs questions',
  },
  asloca_kit: {
    id: 'asloca_kit',
    name: 'ASLOCA — Kit des locataires (PDF)',
    type: 'guide_pratique',
    tier: 3,
    url: 'https://vaud.asloca.ch/sites/vaud.asloca.ch/files/2022-12/10_KIT-WEB.pdf',
    format: 'PDF structuré',
    coverage: 'national (focus romand)',
    domaines: ['bail'],
    freshness: 'édition 2022',
    ingestion_strategy: 'Guide complet bail en langage citoyen. Couvre signature, vie du bail, fin du bail. Source de practitioner_patterns + anti_erreurs citoyens.',
    our_status: 'ingested',
    our_count: 30,
    gap: null,
  },
  ch_ch_themes: {
    id: 'ch_ch_themes',
    name: 'ch.ch — Portail fédéral thématique',
    type: 'vulgarisation_officielle',
    tier: 2,
    url: 'https://www.ch.ch/fr/',
    format: 'HTML simple',
    coverage: 'national',
    domaines: ['bail', 'travail', 'dettes', 'famille', 'etrangers'],
    freshness: 'mise à jour continue',
    ingestion_strategy: 'Pages thématiques en langage citoyen. Validées par la Chancellerie fédérale. Source officielle de vulgarisation.',
    our_status: 'assessed',
    ingestion_blocker: 'SPA (Angular) — requires browser-based scraping, 404 on direct URLs',
    gap: 'textes simplifiés officiels non exploités',
  },

  // ═══ TRANSVERSAL ═══

  aide_juridique_cantonale: {
    id: 'aide_juridique_cantonale',
    name: 'Services d\'aide juridique gratuite par canton',
    type: 'autorite_contact',
    tier: 2,
    url: null,
    format: 'HTML annuaire',
    coverage: 'cantonal',
    domaines: ['bail', 'travail', 'dettes'],
    freshness: 'stable',
    ingestion_strategy: 'compilation annuaires cantonaux',
    our_status: 'partial',
    gap: 'couverture incomplète, heures d\'ouverture manquantes',
  },
  lavi_centres: {
    id: 'lavi_centres',
    name: 'Centres LAVI (aide aux victimes) par canton',
    type: 'autorite_contact',
    tier: 1,
    url: 'https://www.bj.admin.ch/bj/fr/home/gesellschaft/opferhilfe/beratung.html',
    format: 'HTML liste',
    coverage: 'national (par canton)',
    domaines: ['violence', 'famille'],
    freshness: 'stable',
    ingestion_strategy: 'liste officielle OFJ',
    our_status: 'partial', // 6 cantons romands dans CRISIS-DESIGN
    gap: 'cantons alémaniques manquants',
  },

  // ═══ VULGARISATION SPÉCIALISÉE (catalogue 2026-04-13) ═══

  // --- Bail / logement ---
  mieterverband: {
    id: 'mieterverband',
    name: 'Mieterverband — Checklists et modèles locataires (DE)',
    type: 'vulgarisation_syndicat',
    tier: 3,
    url: 'https://www.mieterverband.ch',
    format: 'HTML + PDF',
    coverage: 'national (alémanique)',
    domaines: ['bail'],
    freshness: 'mise à jour régulière',
    ingestion_strategy: 'Équivalent alémanique ASLOCA. Checklists, modèles, FAQ. Structure HTML.',
    our_status: 'not_mapped',
    acces: 'mixte',
    public_cible: 'locataires alémaniques',
    type_source: 'association',
    gap: 'couverture alémanique manquante',
  },
  proloca: {
    id: 'proloca',
    name: 'PROLOCA — FAQ, modèles, calculateur charges',
    type: 'vulgarisation_association',
    tier: 3,
    url: 'https://www.proloca.ch',
    format: 'HTML + PDF',
    coverage: 'national',
    domaines: ['bail'],
    freshness: 'mise à jour régulière',
    ingestion_strategy: 'FAQ citoyen, modèles de lettres, calculateur de charges, conciliation.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'locataires',
    type_source: 'association',
    gap: 'calculateur de charges non indexé',
  },

  // --- Travail ---
  unia_guides: {
    id: 'unia_guides',
    name: 'Unia — Guides droit du travail',
    type: 'vulgarisation_syndicat',
    tier: 3,
    url: 'https://www.unia.ch/fr/monde-du-travail/de-a-a-z',
    format: 'HTML structuré',
    coverage: 'national',
    domaines: ['travail'],
    freshness: 'mise à jour régulière',
    ingestion_strategy: 'Guides A-Z: salaire, horaires, licenciement, vacances, harcèlement, assurances sociales.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'travailleurs',
    type_source: 'syndicat',
    gap: 'textes simplifiés travail manquants dans nos fiches',
  },

  // --- Consommation ---
  frc: {
    id: 'frc',
    name: 'FRC — Fédération romande des consommateurs',
    type: 'vulgarisation_association',
    tier: 3,
    url: 'https://www.frc.ch',
    format: 'HTML articles',
    coverage: 'Suisse romande',
    domaines: ['consommation', 'assurances'],
    freshness: 'mise à jour continue',
    ingestion_strategy: 'Guides: assurance-maladie, CGV, démarchage, télécom, recouvrement, achats en ligne.',
    our_status: 'not_mapped',
    acces: 'mixte',
    public_cible: 'consommateurs romands',
    type_source: 'association',
    gap: 'domaine consommation pas couvert dans nos fiches',
  },

  // --- Dettes / désendettement ---
  caritas_dettes: {
    id: 'caritas_dettes',
    name: 'Caritas — Service Dettes conseils',
    type: 'vulgarisation_service_social',
    tier: 3,
    url: 'https://www.caritas.ch/fr/ce-que-nous-faisons/engagement-en-suisse/lutte-contre-la-pauvrete/conseil-en-matiere-de-dettes.html',
    format: 'HTML + PDF',
    coverage: 'national',
    domaines: ['dettes'],
    freshness: 'stable',
    ingestion_strategy: 'Guides pratiques budget, poursuites, désendettement.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'personnes endettées',
    type_source: 'service spécialisé',
    gap: 'guides pratiques désendettement manquants',
  },
  dettes_conseils_suisse: {
    id: 'dettes_conseils_suisse',
    name: 'Dettes Conseils Suisse — schulden.ch',
    type: 'vulgarisation_faitiere',
    tier: 3,
    url: 'https://www.schulden.ch/fr/',
    format: 'HTML + PDF',
    coverage: 'national',
    domaines: ['dettes'],
    freshness: 'stable',
    ingestion_strategy: 'Annuaire + guides: budget, poursuites, prévention.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'personnes endettées',
    type_source: 'faîtière',
    gap: 'annuaire et guides non indexés',
  },
  csp_vaud_argent: {
    id: 'csp_vaud_argent',
    name: 'CSP Vaud — Aide-mémoires argent',
    type: 'vulgarisation_service_social',
    tier: 3,
    url: 'https://www.csp.ch/vaud/aide-memoires/argent/',
    format: 'HTML + PDF',
    coverage: 'VD (applicable plus largement)',
    domaines: ['dettes'],
    freshness: 'mise à jour annuelle',
    ingestion_strategy: 'Aide-mémoires: budget, poursuites, vivre avec ses dettes, désendettement.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'personnes en difficulté financière',
    type_source: 'service spécialisé',
    gap: 'guides pratiques step-by-step manquants pour dettes',
  },

  // --- Famille / séparation ---
  csp_vaud_famille: {
    id: 'csp_vaud_famille',
    name: 'CSP Vaud — Aide-mémoires séparation/divorce',
    type: 'vulgarisation_service_social',
    tier: 3,
    url: 'https://www.csp.ch/vaud/aide-memoires/se-separer/',
    format: 'HTML + PDF',
    coverage: 'VD (applicable plus largement)',
    domaines: ['famille'],
    freshness: 'mise à jour annuelle',
    ingestion_strategy: 'Aide-mémoires: se séparer, divorcer, autorité parentale, entretien.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'familles en séparation',
    type_source: 'service spécialisé',
    gap: 'guides pratiques famille non couverts',
  },
  f_information: {
    id: 'f_information',
    name: 'f-information — Séparation, divorce, violences',
    type: 'vulgarisation_association',
    tier: 3,
    url: 'https://www.f-information.org',
    format: 'HTML',
    coverage: 'GE + national',
    domaines: ['famille', 'violence', 'travail', 'etrangers'],
    freshness: 'mise à jour régulière',
    ingestion_strategy: 'Guides: séparation, divorce, violences, permis, travail, assurances sociales.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'femmes',
    type_source: 'association',
    gap: 'perspective genre manquante dans nos fiches',
  },

  // --- Violences ---
  violence_que_faire: {
    id: 'violence_que_faire',
    name: 'Violence Que Faire — Orientation victimes',
    type: 'vulgarisation_officielle',
    tier: 2,
    url: 'https://www.violencequefaire.ch',
    format: 'HTML structuré',
    coverage: 'national',
    domaines: ['violence', 'famille'],
    freshness: 'mise à jour continue',
    ingestion_strategy: 'Parcours citoyen: violence conjugale, séparation, protection, orientation vers LAVI.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'victimes de violence',
    type_source: 'service spécialisé',
    gap: 'parcours violence non couvert',
  },
  aide_victimes_suisse: {
    id: 'aide_victimes_suisse',
    name: 'Aide aux victimes en Suisse — LAVI droits',
    type: 'vulgarisation_officielle',
    tier: 2,
    url: 'https://www.aide-aux-victimes.ch',
    format: 'HTML',
    coverage: 'national',
    domaines: ['violence'],
    freshness: 'stable',
    ingestion_strategy: 'Droits LAVI, centres cantonaux, procédures.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'victimes d\'infractions',
    type_source: 'service spécialisé',
    gap: 'droits LAVI non détaillés dans nos fiches',
  },

  // --- Migration ---
  csp_vaud_migration: {
    id: 'csp_vaud_migration',
    name: 'CSP Vaud — Questions de migration',
    type: 'vulgarisation_service_social',
    tier: 3,
    url: 'https://www.csp.ch/vaud/aide-memoires/questions-de-migration/',
    format: 'HTML + PDF',
    coverage: 'VD (applicable plus largement)',
    domaines: ['etrangers'],
    freshness: 'mise à jour annuelle',
    ingestion_strategy: 'Aide-mémoires: permis, regroupement, sans-papiers, assurances.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'personnes migrantes',
    type_source: 'service spécialisé',
    gap: 'guides pratiques migration manquants',
  },

  // --- Asile ---
  asile_ch: {
    id: 'asile_ch',
    name: 'asile.ch — Droits des réfugiés',
    type: 'vulgarisation_faitiere',
    tier: 3,
    url: 'https://asile.ch',
    format: 'HTML structuré',
    coverage: 'national',
    domaines: ['etrangers'],
    freshness: 'mise à jour continue',
    ingestion_strategy: 'Guides: permis N/F/B/S, travail, aide sociale, regroupement.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'réfugiés et requérants d\'asile',
    type_source: 'faîtière',
    gap: 'statuts asile non couverts dans nos fiches',
  },
  osar: {
    id: 'osar',
    name: 'OSAR — Organisation suisse d\'aide aux réfugiés',
    type: 'vulgarisation_faitiere',
    tier: 3,
    url: 'https://www.osar.ch',
    format: 'HTML + PDF',
    coverage: 'national',
    domaines: ['etrangers'],
    freshness: 'mise à jour régulière',
    ingestion_strategy: 'Procédure d\'asile, aide sociale, bases juridiques.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'réfugiés',
    type_source: 'faîtière',
    gap: 'procédure d\'asile non détaillée',
  },

  // --- Handicap ---
  pro_infirmis: {
    id: 'pro_infirmis',
    name: 'Pro Infirmis — Guide juridique handicap',
    type: 'vulgarisation_faitiere',
    tier: 3,
    url: 'https://www.proinfirmis.ch/fr/guide-juridique.html',
    format: 'HTML structuré',
    coverage: 'national',
    domaines: ['assurances', 'travail'],
    freshness: 'mise à jour annuelle',
    ingestion_strategy: 'Guides: travail, AI, égalité, logement, proches.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'personnes handicapées et proches',
    type_source: 'faîtière',
    gap: 'droits handicap non couverts',
  },
  inclusion_handicap: {
    id: 'inclusion_handicap',
    name: 'Inclusion Handicap — Égalité et assurances sociales',
    type: 'vulgarisation_faitiere',
    tier: 3,
    url: 'https://www.inclusion-handicap.ch',
    format: 'HTML + PDF',
    coverage: 'national',
    domaines: ['assurances'],
    freshness: 'mise à jour régulière',
    ingestion_strategy: 'Guides: égalité, assurances sociales, politique du handicap.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'personnes handicapées',
    type_source: 'faîtière',
    gap: 'perspective handicap dans assurances sociales',
  },

  // --- Santé psychique ---
  pro_mente_sana: {
    id: 'pro_mente_sana',
    name: 'Pro Mente Sana — Brochures droits patients psychiatriques',
    type: 'vulgarisation_faitiere',
    tier: 3,
    url: 'https://www.promentesana.ch',
    format: 'HTML + PDF brochures',
    coverage: 'national',
    domaines: ['famille', 'assurances'],
    freshness: 'mise à jour annuelle',
    ingestion_strategy: 'Brochures: hospitalisation, traitement sous contrainte, droits des proches, recours.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'patients psychiatriques et proches',
    type_source: 'faîtière',
    gap: 'droits patients psychiatriques non couverts',
  },

  // --- Droits des patients ---
  spo_droits_patients: {
    id: 'spo_droits_patients',
    name: 'SPO/OSP — Droits des patients',
    type: 'vulgarisation_officielle',
    tier: 2,
    url: 'https://www.spo.ch',
    format: 'HTML',
    coverage: 'national (par canton)',
    domaines: ['assurances'],
    freshness: 'stable',
    ingestion_strategy: 'Guides: information, consentement, dossier patient, confidentialité.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'patients',
    type_source: 'service spécialisé',
    gap: 'droits des patients non couverts',
  },

  // --- VIH ---
  aide_sida: {
    id: 'aide_sida',
    name: 'Aide Suisse contre le Sida — Guide juridique VIH',
    type: 'vulgarisation_association',
    tier: 3,
    url: 'https://www.aids.ch/fr/vivre-avec-le-vih/droit-et-travail/',
    format: 'HTML + PDF + lettres-types',
    coverage: 'national',
    domaines: ['travail', 'assurances'],
    freshness: 'mise à jour annuelle',
    ingestion_strategy: 'Guide juridique VIH, lettres-types, travail, patients, pénalisation.',
    our_status: 'not_mapped',
    acces: 'public',
    public_cible: 'personnes vivant avec le VIH',
    type_source: 'association',
    gap: 'discrimination VIH au travail non couverte',
  },

  // --- Protection de l'adulte ---
  pro_senectute: {
    id: 'pro_senectute',
    name: 'Pro Senectute — Mandat pour cause d\'inaptitude',
    type: 'vulgarisation_faitiere',
    tier: 3,
    url: 'https://www.prosenectute.ch',
    format: 'HTML + PDF',
    coverage: 'national',
    domaines: ['famille'],
    freshness: 'stable',
    ingestion_strategy: 'Guides: mandat pour cause d\'inaptitude, directives anticipées, Docupass.',
    our_status: 'not_mapped',
    acces: 'mixte',
    public_cible: 'personnes âgées et proches',
    type_source: 'faîtière',
    gap: 'protection de l\'adulte non couverte dans nos fiches',
    note_acces: 'Guides publics sur le mandat; certains outils Docupass sont payants',
  },
};

// ─── Frontier analysis ──────────────────────────────────────────

/**
 * Analyze the current state of source coverage.
 */
export function analyzeFrontier() {
  const catalog = Object.values(SOURCE_CATALOG);
  const registry = getRegistry();
  const objStats = getObjectStats();

  const byStatus = { ingested: [], partial: [], not_mapped: [] };
  for (const src of catalog) {
    const status = src.our_status || 'not_mapped';
    if (!byStatus[status]) byStatus[status] = [];
    byStatus[status].push(src);
  }

  // Sources that would impact golden cases
  const highValueGaps = catalog.filter(src =>
    src.our_status !== 'ingested' && src.value_for_golden_cases?.length > 0
  );

  // Coverage by domain
  const byDomain = {};
  for (const src of catalog) {
    for (const d of (src.domaines || [])) {
      if (!byDomain[d]) byDomain[d] = { mapped: 0, ingested: 0, gaps: [] };
      byDomain[d].mapped++;
      if (src.our_status === 'ingested') byDomain[d].ingested++;
      else byDomain[d].gaps.push({ id: src.id, name: src.name, gap: src.gap });
    }
  }

  return {
    total_sources_known: catalog.length,
    ingested: byStatus.ingested.length,
    partial: byStatus.partial.length,
    not_mapped: byStatus.not_mapped.length,
    coverage_rate: Math.round((byStatus.ingested.length / catalog.length) * 100) + '%',
    high_value_gaps: highValueGaps.map(s => ({
      id: s.id,
      name: s.name,
      tier: s.tier,
      gap: s.gap,
      impacts_golden_cases: s.value_for_golden_cases,
    })),
    by_domain: byDomain,
    registry_stats: {
      total_sources_in_registry: registry.totalSources,
      total_objects: objStats.total_objects,
    },
    generated_at: new Date().toISOString(),
  };
}

/**
 * Get the top N highest-value sources to ingest next.
 * Ranked by: tier (lower = better) × golden case impact × coverage gap severity.
 */
export function getNextIngestionPriorities(maxResults = 10) {
  const catalog = Object.values(SOURCE_CATALOG);

  const candidates = catalog
    .filter(src => src.our_status !== 'ingested')
    .map(src => {
      let score = 0;
      // Tier: lower tier = higher value
      score += (4 - src.tier) * 3;
      // Golden case impact
      score += (src.value_for_golden_cases?.length || 0) * 5;
      // Has a gap description = known problem
      if (src.gap) score += 2;
      // V1 domains boost
      const v1 = ['bail', 'travail', 'dettes'];
      const v1Overlap = (src.domaines || []).filter(d => v1.includes(d)).length;
      score += v1Overlap * 2;
      // Partial = less work than not_mapped
      if (src.our_status === 'partial') score += 1;

      return { ...src, priority_score: score };
    })
    .sort((a, b) => b.priority_score - a.priority_score);

  return candidates.slice(0, maxResults);
}

/**
 * Get full source catalog.
 */
export function getSourceCatalog() {
  return Object.values(SOURCE_CATALOG);
}

export { SOURCE_CATALOG };
