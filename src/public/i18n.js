/**
 * JusticePourtous — i18n (internationalization)
 * Supports: FR (default), DE (Swiss German legal terminology)
 *
 * Usage:
 *   <script src="/i18n.js"></script>
 *   t('nav.annuaire')           → "Annuaire" / "Verzeichnis"
 *   t('hero.subtitle', {name})  → interpolation with {{name}}
 *   setLang('de')               → switch + reload UI
 *   getLang()                    → 'fr' | 'de'
 */

// ---------------------------------------------------------------------------
// Translation dictionaries
// ---------------------------------------------------------------------------

var I18N = {
  fr: {
    // -- Navigation --
    'nav.annuaire': 'Annuaire',
    'nav.methodologie': 'Méthodologie',
    'nav.premium': 'Premium',
    'nav.accueil': 'Accueil',
    'nav.nouvelle_recherche': 'Nouvelle recherche',

    // -- Quick exit --
    'quickexit.label': 'Quitter',
    'quickexit.sublabel': '— sortie rapide',
    'quickexit.title': 'Quitter rapidement ce site — vous redirige vers MétéoSuisse',

    // -- Disclaimer --
    'disclaimer.title': 'Information juridique générale',
    'disclaimer.text': 'JusticePourtous ne remplace pas un conseil d\'avocat personnalisé. Les informations sont fournies à titre indicatif, sans garantie d\'exhaustivité.',
    'disclaimer.text_full': 'JusticePourtous ne remplace pas un conseil d\'avocat personnalisé. Les informations sont fournies à titre indicatif, sans garantie d\'exhaustivité. En cas de doute, consultez un professionnel du droit.',

    // -- Footer --
    'footer.legal': 'JusticePourtous fournit des informations juridiques générales basées sur le droit suisse en vigueur. Ce service ne remplace pas un conseil d\'avocat personnalisé.',
    'footer.legal_full': 'JusticePourtous fournit des informations juridiques générales basées sur le droit suisse en vigueur. Ce service ne remplace pas un conseil d\'avocat personnalisé. En cas de doute, consultez un professionnel du droit.',
    'footer.copy': '\u00a9 2026 JusticePourtous',

    // -- Homepage: Hero --
    'hero.eyebrow': 'Droit suisse pratique',
    'hero.title_line1': 'Le droit suisse,',
    'hero.title_accent': 'accessible à tous.',
    'hero.subtitle': 'JusticePourtous identifie votre situation juridique, vous dit quoi faire, dans quel délai, et vers qui vous tourner \u2014 gratuitement et anonymement.',

    // -- Homepage: Process --
    'process.eyebrow': 'Comment ça marche',
    'process.step1_title': 'Décrivez',
    'process.step1_text': 'Expliquez votre situation en quelques mots, comme vous le feriez à un ami.',
    'process.step2_title': 'Comprenez',
    'process.step2_text': 'On identifie votre situation juridique, les lois applicables et la jurisprudence.',
    'process.step3_title': 'Agissez',
    'process.step3_text': 'Délais, documents, autorité compétente, modèle de lettre et contacts gratuits.',

    // -- Homepage: Domains --
    'domains.eyebrow': 'Parcourir par domaine',

    // -- Homepage: Search --
    'search.eyebrow': 'Analyser ma situation',
    'search.subtitle': 'Décrivez votre problème et notre IA identifie vos droits, vos délais et les démarches à suivre.',
    'search.placeholder': 'Mon propriétaire refuse de rembourser ma caution...',
    'search.aria_label': 'Décrivez votre problème juridique',
    'search.submit': 'Analyser',
    'search.suggestion_caution': 'Caution non remboursée',
    'search.suggestion_licenciement': 'Licenciement & maladie',
    'search.suggestion_heures': 'Heures sup impayées',
    'search.suggestion_commandement': 'Commandement de payer',
    'search.suggestion_pension': 'Pension impayée',
    'search.fill_caution': 'mon propriétaire refuse de rembourser ma caution',
    'search.fill_licenciement': 'licenciement pendant arrêt maladie',
    'search.fill_heures': 'heures supplémentaires non payées',
    'search.fill_commandement': 'j\'ai reçu un commandement de payer',
    'search.fill_pension': 'mon ex ne paie pas la pension',

    // -- Homepage: Premium CTA --
    'premiumcta.title': 'Analyse approfondie',
    'premiumcta.text': 'Notre IA analyse votre dossier en profondeur : argumentation contradictoire, certificat de couverture, génération de lettres et documents Word prêts à envoyer.',
    'premiumcta.button': 'Découvrir le Premium',
    'premiumcta.feature1_title': 'Questions ciblées',
    'premiumcta.feature1_text': 'L\'IA pose les bonnes questions pour affiner votre dossier',
    'premiumcta.feature2_title': 'Arguments vérifiés',
    'premiumcta.feature2_text': 'Pour et contre, avec sources juridiques',
    'premiumcta.feature3_title': 'Lettres .docx',
    'premiumcta.feature3_text': 'Mise en demeure, opposition, contestation prêtes à signer',

    // -- Homepage: Trust band --
    'trust.anonymous_title': 'Anonyme',
    'trust.anonymous_text': 'Aucune donnée stockée',
    'trust.sources_title': 'Sources vérifiées',
    'trust.sources_text': 'Fedlex, jurisprudence TF',
    'trust.law_title': 'Droit suisse',
    'trust.law_text': 'Fédéral et cantonal',
    'trust.free_title': 'Gratuit',
    'trust.free_text': 'Consultation libre',

    // -- Homepage: Stat --
    'stat.text': 'des Suisses renoncent à faire valoir leurs droits à cause du coût.',
    'stat.source': 'sondage gfs.bern, 2023',

    // -- Results page --
    'result.title': 'Résultat de votre consultation',
    'result.refine_aria': 'Préciser votre recherche',
    'result.refine_submit': 'Relancer',
    'result.your_situation': 'Votre situation',
    'result.your_search': 'Votre recherche',
    'result.juridical_qualification': 'Qualification juridique',
    'result.qualification': 'Qualification',
    'result.articles_title': 'Articles de loi applicables',
    'result.jurisprudence_title': 'Jurisprudence du Tribunal fédéral',
    'result.templates_title': 'Modèles de lettres',
    'result.services_title': 'Services compétents',
    'result.delais_title': 'Délais à connaître',
    'result.anti_erreurs_title': 'Erreurs à éviter',
    'result.lacunes_title': 'Ce que nous ne savons pas encore',
    'result.lacune_type_default': 'Information manquante',
    'result.alternatives_title': 'Situations similaires',
    'result.normative_rules_title': 'Règles juridiques applicables',
    'result.vulg_title': 'Questions fréquentes des citoyens',
    'result.baremes_title': 'Taux de référence',
    'result.baremes_label': 'Taux hypothécaire de référence OFL',
    'result.baremes_consequence': 'Base pour contester une augmentation de loyer (CO 269a). Publié le {{date}}',
    'result.source_footer': 'Sources : {{articles}} articles, {{arrets}} arrêts',
    'result.source_rules': '{{count}} règles',
    'result.no_result': 'Aucun résultat. Vérifiez votre description.',
    'result.error_fiche': 'Fiche non trouvée.',
    'result.error_connection': 'Erreur de connexion.',
    'result.error_no_query': 'Aucune recherche spécifiée.',
    'result.back_home': 'Retour à l\'accueil',
    'result.model_letter': 'Modèle de lettre',

    // -- Results: Jurisprudence roles --
    'role.favorable': 'Favorable',
    'role.defavorable': 'Défavorable',
    'role.neutre': 'Neutre',

    // -- Results: Confidence levels --
    'confidence.certain': 'Certain',
    'confidence.probable': 'Probable',
    'confidence.variable': 'Variable',
    'confidence.incertain': 'Incertain',

    // -- Results: Tier badges --
    'tier.1': 'LOI',
    'tier.2': 'TF',
    'tier.3': 'PRATIQUE',

    // -- Results: Premium CTA (in-results) --
    'premiumcta_result.title': 'Aller plus loin avec l\'analyse premium',
    'premiumcta_result.badge': 'Dès CHF 0.15',
    'premiumcta_result.intro': 'Ce premier triage vous donne les bases. L\'analyse premium va beaucoup plus loin :',
    'premiumcta_result.q_title': 'Questions personnalisées',
    'premiumcta_result.q_text': 'L\'IA vous pose les questions qui changent le diagnostic \u2014 pas des questions génériques',
    'premiumcta_result.arg_title': 'Argumentation contradictoire',
    'premiumcta_result.arg_text': 'Arguments pour ET contre votre position, avec les articles de loi et la jurisprudence',
    'premiumcta_result.cert_title': 'Certificat de couverture',
    'premiumcta_result.cert_text': 'On vérifie que rien ne manque dans votre dossier avant d\'agir',
    'premiumcta_result.letter_title': 'Lettres prêtes à envoyer',
    'premiumcta_result.letter_text': 'Mise en demeure, opposition, contestation \u2014 en .docx avec vos informations',
    'premiumcta_result.button': 'Lancer l\'analyse premium',

    // -- Results: Upsell --
    'upsell.title': 'Besoin d\'une analyse personnalisée ?',
    'upsell.text': 'Notre IA analyse votre situation en détail pour CHF 0.03 à 0.10 par question.',
    'upsell.button': 'Espace Premium',

    // -- Common actions --
    'action.analyser': 'Analyser',
    'action.imprimer': 'Imprimer / Sauvegarder PDF',
    'action.imprimer_short': 'Imprimer / PDF',
    'action.copier': 'Copier',
    'action.copier_texte': 'Copier le texte',
    'action.copie': 'Copié !',
    'action.telecharger_docx': 'Télécharger .docx',
    'action.nouvelle_consultation': 'Nouvelle consultation',
    'action.nouvelle_recherche': 'Nouvelle recherche',
    'action.afficher': 'Afficher',
    'action.masquer': 'Masquer',
    'action.suivant': 'Suivant',
    'action.precedent': 'Précédent',
    'action.voir_droits': 'Voir mes droits',
    'action.site_web': 'Site web',
    'action.trouver_avocat': 'Trouver un avocat',
    'action.activer': 'Activer',
    'action.affiner': 'Affiner l\'analyse',

    // -- Consultation --
    'consult.title': 'Consultation',
    'consult.question_n': 'Question {{n}} sur {{total}}',
    'consult.loading': 'Chargement...',
    'consult.analysis_loading': 'Analyse en cours',
    'consult.canton_select': '-- Canton --',
    'consult.error': 'Une erreur est survenue.',

    // -- Premium page --
    'premium.eyebrow': 'Espace Premium',
    'premium.title': 'Analyse juridique personnalisée',
    'premium.subtitle': 'Intelligence artificielle au service de votre situation juridique.',
    'premium.offer_title': 'Analyse juridique personnalisée par IA',
    'premium.offer_features': 'Questions ciblées, argumentation contradictoire, certificat de couverture, lettres prêtes à envoyer en .docx.',
    'premium.pricing_one_label': 'Un problème',
    'premium.pricing_one_detail': 'Suffisant pour 1 dossier simple avec analyse + lettre',
    'premium.pricing_one_btn': 'Charger CHF 5',
    'premium.pricing_rec_label': 'Recommandé',
    'premium.pricing_rec_detail': 'Couvre 1 à 3 dossiers \u2014 le choix le plus courant',
    'premium.pricing_rec_btn': 'Charger CHF 10',
    'premium.pricing_complex_label': 'Dossier complexe',
    'premium.pricing_complex_detail': 'Pour les situations multi-domaines ou nécessitant plusieurs lettres',
    'premium.pricing_complex_btn': 'Charger CHF 20',
    'premium.cost_table_title': 'Coût indicatif par opération',
    'premium.cost_simple': 'Analyse simple',
    'premium.cost_simple_range': 'CHF 0.15 \u2013 0.25',
    'premium.cost_questions': 'Analyse + questions + affinage',
    'premium.cost_questions_range': 'CHF 0.30 \u2013 0.50',
    'premium.cost_dossier': 'Dossier complet avec lettre',
    'premium.cost_dossier_range': 'CHF 0.50 \u2013 1.00',
    'premium.cost_complex': 'Dossier complexe (multi-domaines, plusieurs lettres)',
    'premium.cost_complex_range': 'CHF 1.00 \u2013 3.00',
    'premium.cost_letter': 'Lettre supplémentaire (.docx)',
    'premium.cost_letter_range': 'CHF 0.05 \u2013 0.10',
    'premium.cost_note': 'Le coût exact est affiché après chaque opération. Votre solde est rechargeable à tout moment.',
    'premium.code_label': 'Vous avez un code d\'accès ?',
    'premium.code_placeholder': 'Entrez votre code',
    'premium.wallet_label': 'Solde restant',
    'premium.analyze_title': 'Analyser votre situation',
    'premium.analyze_cost_hint': 'Coût estimé : CHF 0.03 à 0.10 par analyse',
    'premium.analyze_placeholder': 'Décrivez votre situation juridique en détail...',
    'premium.analyze_submit': 'Analyser ma situation',
    'premium.upload_label': 'Joindre un document (PDF, image)',
    'premium.upload_change': 'Changer de document',
    'premium.analysis_label': 'Analyse',
    'premium.letter_generated': 'Lettre générée',
    'premium.history_title': 'Historique',
    'premium.history_empty': 'Aucune action',
    'premium.generate_letter': 'Générer la lettre',
    'premium.print': 'Imprimer',

    // -- Premium: Letter types --
    'letter.mise_en_demeure': 'Mise en demeure',
    'letter.contestation': 'Contestation',
    'letter.opposition': 'Opposition',
    'letter.resiliation': 'Résiliation',
    'letter.plainte': 'Plainte',

    // -- Premium: V4 response --
    'v4.questions_title': 'Questions pour affiner l\'analyse',
    'v4.critique': 'Critique',
    'v4.resume': 'Résumé',
    'v4.arguments_title': 'Arguments vérifiés',
    'v4.objections_title': 'Objections possibles',
    'v4.deadlines_title': 'Délais critiques',
    'v4.fatal_errors_title': 'Erreurs à éviter absolument',
    'v4.action_plan': 'Plan d\'action',
    'v4.certificate_title': 'Certificat de couverture',
    'v4.certificate_score': 'Score',
    'v4.lawyer_recommended': 'Un avocat est recommandé',
    'v4.sources_count': 'Analyse basée sur {{count}} sources',
    'v4.cost_receipt': 'Coût de cette analyse : CHF {{cost}} \u2014 Solde restant : CHF {{remaining}}',
    'v4.no_result': 'Aucun résultat. Vérifiez votre description.',
    'v4.no_text': 'Aucun texte à analyser.',
    'v4.refine_loading': 'Affinage en cours...',

    // -- Premium: Loading messages --
    'loading.sub': 'L\'analyse complète prend 10 à 30 secondes',
    'loading.msg_01': 'Compréhension de votre situation...',
    'loading.msg_02': 'Identification des problèmes juridiques...',
    'loading.msg_03': 'Construction du dossier contradictoire...',
    'loading.msg_04': 'Recherche des articles de loi applicables...',
    'loading.msg_05': 'Consultation de la jurisprudence du TF...',
    'loading.msg_06': 'Analyse des arguments pour et contre...',
    'loading.msg_07': 'Vérification du certificat de couverture...',
    'loading.msg_08': 'Évaluation par le comité d\'experts...',
    'loading.msg_09': 'Compilation des règles normatives...',
    'loading.msg_10': 'Identification des délais critiques...',
    'loading.msg_11': 'Recherche des erreurs fatales à éviter...',
    'loading.msg_12': 'Calcul de la fourchette de montant...',
    'loading.msg_13': 'Vérification des sources juridiques...',
    'loading.msg_14': 'Génération des questions de suivi...',
    'loading.msg_15': 'Préparation de l\'analyse complète...',
    'loading.msg_16': 'Croisement avec les barèmes cantonaux...',
    'loading.msg_17': 'Vérification de la recevabilité...',
    'loading.msg_18': 'Analyse des preuves à réunir...',
    'loading.msg_19': 'Identification des contacts compétents...',
    'loading.msg_20': 'Finalisation du rapport...',

    // -- Search result loading messages --
    'loading_search.sub': 'Cela prend généralement 5 à 15 secondes',
    'loading_search.msg_01': 'Lecture de votre situation...',
    'loading_search.msg_02': 'Identification du domaine juridique...',
    'loading_search.msg_03': 'Recherche des articles de loi applicables...',
    'loading_search.msg_04': 'Consultation de la jurisprudence du Tribunal fédéral...',
    'loading_search.msg_05': 'Vérification des délais légaux...',
    'loading_search.msg_06': 'Analyse des conditions de recevabilité...',
    'loading_search.msg_07': 'Extraction des faits pertinents...',
    'loading_search.msg_08': 'Croisement avec les fiches vérifiées...',
    'loading_search.msg_09': 'Évaluation de la complexité juridique...',
    'loading_search.msg_10': 'Recherche des services compétents dans votre canton...',
    'loading_search.msg_11': 'Vérification des modèles de lettres disponibles...',
    'loading_search.msg_12': 'Analyse des erreurs fréquentes à éviter...',
    'loading_search.msg_13': 'Consultation des barèmes et taux de référence...',
    'loading_search.msg_14': 'Compilation des règles normatives applicables...',
    'loading_search.msg_15': 'Construction du plan d\'action personnalisé...',
    'loading_search.msg_16': 'Vérification des sources et références...',
    'loading_search.msg_17': 'Recherche de jurisprudence contradictoire...',
    'loading_search.msg_18': 'Évaluation du niveau de confiance...',
    'loading_search.msg_19': 'Identification des lacunes d\'information...',
    'loading_search.msg_20': 'Préparation de votre dossier...',

    // -- Annuaire page --
    'annuaire.eyebrow': 'Ressources',
    'annuaire.title': 'Annuaire des services juridiques',
    'annuaire.subtitle': 'Trouvez les services compétents dans votre canton.',
    'annuaire.canton_label': 'Canton',
    'annuaire.canton_select': '-- Choisir un canton --',
    'annuaire.filter_all': 'Tous',
    'annuaire.filter_asloca': 'ASLOCA',
    'annuaire.filter_csp': 'CSP',
    'annuaire.filter_syndicat': 'Syndicat',
    'annuaire.filter_conciliation': 'Conciliation',
    'annuaire.filter_aide': 'Aide juridictionnelle',
    'annuaire.services_count': 'Services disponibles ({{count}})',
    'annuaire.no_services': 'Aucun service référencé pour ce canton.',
    'annuaire.no_services_type': 'Aucun service de ce type dans ce canton.',
    'annuaire.error_load': 'Impossible de charger les services. Vérifiez que le serveur est en marche.',

    // -- Methodologie page --
    'methodo.eyebrow': 'Transparence',
    'methodo.title': 'Comment fonctionne JusticePourtous',

    // -- Errors / alerts --
    'error.payment_create': 'Impossible de créer la session de paiement',
    'error.payment_connection': 'Erreur de connexion au service de paiement.',
    'error.payment_cancelled': 'Paiement annulé. Vous pouvez réessayer.',
    'error.payment_processing': 'Le paiement est en cours de traitement. Rechargez la page dans quelques instants.',
    'error.charge_failed': 'Erreur lors du chargement. Réessayez.',
    'error.analysis_failed': 'Erreur lors de l\'analyse. Réessayez.',
    'error.refine_failed': 'Erreur lors de l\'affinage.',
    'error.generation_failed': 'Erreur lors de la génération.',
    'error.docx_failed': 'Erreur lors de la génération du document.',
    'error.download_failed': 'Erreur lors du téléchargement.',
    'error.file_too_large': 'Fichier trop volumineux (max 10 MB)',
    'error.extraction': 'Extraction du document...',
    'error.no_letter': 'Pas de lettre générée',

    // -- Language switcher --
    'lang.fr': 'FR',
    'lang.de': 'DE',
    'lang.switch_label': 'Langue',
  },

  de: {
    // -- Navigation --
    'nav.annuaire': 'Verzeichnis',
    'nav.methodologie': 'Methodik',
    'nav.premium': 'Premium',
    'nav.accueil': 'Startseite',
    'nav.nouvelle_recherche': 'Neue Suche',

    // -- Quick exit --
    'quickexit.label': 'Verlassen',
    'quickexit.sublabel': '— Schnellausgang',
    'quickexit.title': 'Diese Seite schnell verlassen — Weiterleitung zu MeteoSchweiz',

    // -- Disclaimer --
    'disclaimer.title': 'Allgemeine Rechtsinformation',
    'disclaimer.text': 'JusticePourtous ersetzt keine persönliche Rechtsberatung durch eine Anwältin oder einen Anwalt. Die Informationen dienen nur zur allgemeinen Orientierung, ohne Gewähr auf Vollständigkeit.',
    'disclaimer.text_full': 'JusticePourtous ersetzt keine persönliche Rechtsberatung durch eine Anwältin oder einen Anwalt. Die Informationen dienen nur zur allgemeinen Orientierung, ohne Gewähr auf Vollständigkeit. Im Zweifelsfall wenden Sie sich an eine Fachperson.',

    // -- Footer --
    'footer.legal': 'JusticePourtous stellt allgemeine Rechtsinformationen auf Grundlage des geltenden Schweizer Rechts bereit. Dieser Dienst ersetzt keine persönliche Rechtsberatung.',
    'footer.legal_full': 'JusticePourtous stellt allgemeine Rechtsinformationen auf Grundlage des geltenden Schweizer Rechts bereit. Dieser Dienst ersetzt keine persönliche Rechtsberatung. Im Zweifelsfall wenden Sie sich an eine Fachperson.',
    'footer.copy': '\u00a9 2026 JusticePourtous',

    // -- Homepage: Hero --
    'hero.eyebrow': 'Schweizer Recht praxisnah',
    'hero.title_line1': 'Schweizer Recht,',
    'hero.title_accent': 'für alle zugänglich.',
    'hero.subtitle': 'JusticePourtous erkennt Ihre rechtliche Situation, sagt Ihnen was zu tun ist, innert welcher Frist und an wen Sie sich wenden können \u2014 kostenlos und anonym.',

    // -- Homepage: Process --
    'process.eyebrow': 'So funktioniert es',
    'process.step1_title': 'Beschreiben',
    'process.step1_text': 'Erklären Sie Ihre Situation in wenigen Worten, so wie Sie es einem Freund erzählen würden.',
    'process.step2_title': 'Verstehen',
    'process.step2_text': 'Wir erkennen Ihre Rechtslage, die anwendbaren Gesetze und die Rechtsprechung.',
    'process.step3_title': 'Handeln',
    'process.step3_text': 'Fristen, Dokumente, zuständige Behörde, Briefvorlage und kostenlose Anlaufstellen.',

    // -- Homepage: Domains --
    'domains.eyebrow': 'Nach Rechtsgebiet durchsuchen',

    // -- Homepage: Search --
    'search.eyebrow': 'Meine Situation analysieren',
    'search.subtitle': 'Beschreiben Sie Ihr Problem und unsere KI erkennt Ihre Rechte, Fristen und die nächsten Schritte.',
    'search.placeholder': 'Mein Vermieter weigert sich, die Mietkaution zurückzuzahlen...',
    'search.aria_label': 'Beschreiben Sie Ihr rechtliches Problem',
    'search.submit': 'Analysieren',
    'search.suggestion_caution': 'Kaution nicht zurückbezahlt',
    'search.suggestion_licenciement': 'Kündigung & Krankheit',
    'search.suggestion_heures': 'Unbezahlte Überstunden',
    'search.suggestion_commandement': 'Zahlungsbefehl',
    'search.suggestion_pension': 'Unbezahlte Alimente',
    'search.fill_caution': 'mein Vermieter weigert sich, die Mietkaution zurückzuzahlen',
    'search.fill_licenciement': 'Kündigung während Krankschreibung',
    'search.fill_heures': 'unbezahlte Überstunden',
    'search.fill_commandement': 'ich habe einen Zahlungsbefehl erhalten',
    'search.fill_pension': 'mein Ex-Partner zahlt die Alimente nicht',

    // -- Homepage: Premium CTA --
    'premiumcta.title': 'Vertiefte Analyse',
    'premiumcta.text': 'Unsere KI analysiert Ihr Dossier eingehend: kontradiktorische Argumentation, Deckungszertifikat, Brieferstellung und Word-Dokumente versandfertig.',
    'premiumcta.button': 'Premium entdecken',
    'premiumcta.feature1_title': 'Gezielte Fragen',
    'premiumcta.feature1_text': 'Die KI stellt die richtigen Fragen, um Ihr Dossier zu verfeinern',
    'premiumcta.feature2_title': 'Geprüfte Argumente',
    'premiumcta.feature2_text': 'Dafür und dagegen, mit juristischen Quellen',
    'premiumcta.feature3_title': 'Briefe als .docx',
    'premiumcta.feature3_text': 'Mahnung, Einsprache, Anfechtung unterschriftsbereit',

    // -- Homepage: Trust band --
    'trust.anonymous_title': 'Anonym',
    'trust.anonymous_text': 'Keine Daten gespeichert',
    'trust.sources_title': 'Geprüfte Quellen',
    'trust.sources_text': 'Fedlex, Bundesgerichtspraxis',
    'trust.law_title': 'Schweizer Recht',
    'trust.law_text': 'Bundes- und Kantonsrecht',
    'trust.free_title': 'Kostenlos',
    'trust.free_text': 'Freie Konsultation',

    // -- Homepage: Stat --
    'stat.text': 'der Schweizerinnen und Schweizer verzichten kostenbedingt auf die Durchsetzung ihrer Rechte.',
    'stat.source': 'Umfrage gfs.bern, 2023',

    // -- Results page --
    'result.title': 'Ergebnis Ihrer Konsultation',
    'result.refine_aria': 'Suche verfeinern',
    'result.refine_submit': 'Erneut suchen',
    'result.your_situation': 'Ihre Situation',
    'result.your_search': 'Ihre Suche',
    'result.juridical_qualification': 'Rechtliche Einordnung',
    'result.qualification': 'Einordnung',
    'result.articles_title': 'Anwendbare Gesetzesartikel',
    'result.jurisprudence_title': 'Rechtsprechung des Bundesgerichts',
    'result.templates_title': 'Briefvorlagen',
    'result.services_title': 'Zuständige Stellen',
    'result.delais_title': 'Fristen',
    'result.anti_erreurs_title': 'Fehler vermeiden',
    'result.lacunes_title': 'Was wir noch nicht wissen',
    'result.lacune_type_default': 'Fehlende Information',
    'result.alternatives_title': 'Ähnliche Situationen',
    'result.normative_rules_title': 'Anwendbare Rechtsregeln',
    'result.vulg_title': 'Häufige Fragen von Bürgerinnen und Bürgern',
    'result.baremes_title': 'Referenzzinssatz',
    'result.baremes_label': 'Hypothekarischer Referenzzinssatz BWO',
    'result.baremes_consequence': 'Grundlage zur Anfechtung einer Mietzinserhöhung (OR 269a). Veröffentlicht am {{date}}',
    'result.source_footer': 'Quellen: {{articles}} Artikel, {{arrets}} Urteile',
    'result.source_rules': '{{count}} Regeln',
    'result.no_result': 'Keine Ergebnisse. Überprüfen Sie Ihre Beschreibung.',
    'result.error_fiche': 'Merkblatt nicht gefunden.',
    'result.error_connection': 'Verbindungsfehler.',
    'result.error_no_query': 'Keine Suche angegeben.',
    'result.back_home': 'Zurück zur Startseite',
    'result.model_letter': 'Briefvorlage',

    // -- Results: Jurisprudence roles --
    'role.favorable': 'Günstig',
    'role.defavorable': 'Ungünstig',
    'role.neutre': 'Neutral',

    // -- Results: Confidence levels --
    'confidence.certain': 'Sicher',
    'confidence.probable': 'Wahrscheinlich',
    'confidence.variable': 'Variabel',
    'confidence.incertain': 'Unsicher',

    // -- Results: Tier badges --
    'tier.1': 'GESETZ',
    'tier.2': 'BGer',
    'tier.3': 'PRAXIS',

    // -- Results: Premium CTA (in-results) --
    'premiumcta_result.title': 'Weiter mit der Premium-Analyse',
    'premiumcta_result.badge': 'Ab CHF 0.15',
    'premiumcta_result.intro': 'Diese erste Einschätzung gibt Ihnen die Grundlagen. Die Premium-Analyse geht deutlich weiter:',
    'premiumcta_result.q_title': 'Persönliche Fragen',
    'premiumcta_result.q_text': 'Die KI stellt die Fragen, die die Beurteilung verändern \u2014 keine Standardfragen',
    'premiumcta_result.arg_title': 'Kontradiktorische Argumentation',
    'premiumcta_result.arg_text': 'Argumente dafür UND dagegen, mit Gesetzesartikeln und Rechtsprechung',
    'premiumcta_result.cert_title': 'Deckungszertifikat',
    'premiumcta_result.cert_text': 'Wir prüfen, ob in Ihrem Dossier etwas fehlt, bevor Sie handeln',
    'premiumcta_result.letter_title': 'Versandfertige Briefe',
    'premiumcta_result.letter_text': 'Mahnung, Einsprache, Anfechtung \u2014 als .docx mit Ihren Angaben',
    'premiumcta_result.button': 'Premium-Analyse starten',

    // -- Results: Upsell --
    'upsell.title': 'Brauchen Sie eine persönliche Analyse?',
    'upsell.text': 'Unsere KI analysiert Ihre Situation detailliert für CHF 0.03 bis 0.10 pro Frage.',
    'upsell.button': 'Premium-Bereich',

    // -- Common actions --
    'action.analyser': 'Analysieren',
    'action.imprimer': 'Drucken / PDF speichern',
    'action.imprimer_short': 'Drucken / PDF',
    'action.copier': 'Kopieren',
    'action.copier_texte': 'Text kopieren',
    'action.copie': 'Kopiert!',
    'action.telecharger_docx': '.docx herunterladen',
    'action.nouvelle_consultation': 'Neue Konsultation',
    'action.nouvelle_recherche': 'Neue Suche',
    'action.afficher': 'Anzeigen',
    'action.masquer': 'Ausblenden',
    'action.suivant': 'Weiter',
    'action.precedent': 'Zurück',
    'action.voir_droits': 'Meine Rechte sehen',
    'action.site_web': 'Webseite',
    'action.trouver_avocat': 'Anwalt finden',
    'action.activer': 'Aktivieren',
    'action.affiner': 'Analyse verfeinern',

    // -- Consultation --
    'consult.title': 'Konsultation',
    'consult.question_n': 'Frage {{n}} von {{total}}',
    'consult.loading': 'Wird geladen...',
    'consult.analysis_loading': 'Analyse läuft',
    'consult.canton_select': '-- Kanton --',
    'consult.error': 'Ein Fehler ist aufgetreten.',

    // -- Premium page --
    'premium.eyebrow': 'Premium-Bereich',
    'premium.title': 'Persönliche Rechtsanalyse',
    'premium.subtitle': 'Künstliche Intelligenz im Dienst Ihrer Rechtslage.',
    'premium.offer_title': 'Persönliche Rechtsanalyse per KI',
    'premium.offer_features': 'Gezielte Fragen, kontradiktorische Argumentation, Deckungszertifikat, versandfertige Briefe als .docx.',
    'premium.pricing_one_label': 'Ein Problem',
    'premium.pricing_one_detail': 'Ausreichend für 1 einfaches Dossier mit Analyse + Brief',
    'premium.pricing_one_btn': 'CHF 5 laden',
    'premium.pricing_rec_label': 'Empfohlen',
    'premium.pricing_rec_detail': 'Deckt 1 bis 3 Dossiers ab \u2014 die häufigste Wahl',
    'premium.pricing_rec_btn': 'CHF 10 laden',
    'premium.pricing_complex_label': 'Komplexes Dossier',
    'premium.pricing_complex_detail': 'Für Situationen mit mehreren Rechtsgebieten oder mehreren Briefen',
    'premium.pricing_complex_btn': 'CHF 20 laden',
    'premium.cost_table_title': 'Richtkosten pro Vorgang',
    'premium.cost_simple': 'Einfache Analyse',
    'premium.cost_simple_range': 'CHF 0.15 \u2013 0.25',
    'premium.cost_questions': 'Analyse + Fragen + Verfeinerung',
    'premium.cost_questions_range': 'CHF 0.30 \u2013 0.50',
    'premium.cost_dossier': 'Vollständiges Dossier mit Brief',
    'premium.cost_dossier_range': 'CHF 0.50 \u2013 1.00',
    'premium.cost_complex': 'Komplexes Dossier (mehrere Gebiete, mehrere Briefe)',
    'premium.cost_complex_range': 'CHF 1.00 \u2013 3.00',
    'premium.cost_letter': 'Zusätzlicher Brief (.docx)',
    'premium.cost_letter_range': 'CHF 0.05 \u2013 0.10',
    'premium.cost_note': 'Die genauen Kosten werden nach jedem Vorgang angezeigt. Ihr Guthaben kann jederzeit aufgeladen werden.',
    'premium.code_label': 'Haben Sie einen Zugangscode?',
    'premium.code_placeholder': 'Code eingeben',
    'premium.wallet_label': 'Restguthaben',
    'premium.analyze_title': 'Ihre Situation analysieren',
    'premium.analyze_cost_hint': 'Geschätzte Kosten: CHF 0.03 bis 0.10 pro Analyse',
    'premium.analyze_placeholder': 'Beschreiben Sie Ihre rechtliche Situation im Detail...',
    'premium.analyze_submit': 'Meine Situation analysieren',
    'premium.upload_label': 'Dokument anhängen (PDF, Bild)',
    'premium.upload_change': 'Dokument wechseln',
    'premium.analysis_label': 'Analyse',
    'premium.letter_generated': 'Erstellter Brief',
    'premium.history_title': 'Verlauf',
    'premium.history_empty': 'Keine Aktionen',
    'premium.generate_letter': 'Brief erstellen',
    'premium.print': 'Drucken',

    // -- Premium: Letter types --
    'letter.mise_en_demeure': 'Mahnung',
    'letter.contestation': 'Anfechtung',
    'letter.opposition': 'Einsprache',
    'letter.resiliation': 'Kündigung',
    'letter.plainte': 'Strafanzeige',

    // -- Premium: V4 response --
    'v4.questions_title': 'Fragen zur Verfeinerung der Analyse',
    'v4.critique': 'Kritisch',
    'v4.resume': 'Zusammenfassung',
    'v4.arguments_title': 'Geprüfte Argumente',
    'v4.objections_title': 'Mögliche Einwände',
    'v4.deadlines_title': 'Kritische Fristen',
    'v4.fatal_errors_title': 'Unbedingt zu vermeidende Fehler',
    'v4.action_plan': 'Massnahmenplan',
    'v4.certificate_title': 'Deckungszertifikat',
    'v4.certificate_score': 'Punktzahl',
    'v4.lawyer_recommended': 'Ein Anwalt wird empfohlen',
    'v4.sources_count': 'Analyse basiert auf {{count}} Quellen',
    'v4.cost_receipt': 'Kosten dieser Analyse: CHF {{cost}} \u2014 Restguthaben: CHF {{remaining}}',
    'v4.no_result': 'Keine Ergebnisse. Überprüfen Sie Ihre Beschreibung.',
    'v4.no_text': 'Kein Text zum Analysieren.',
    'v4.refine_loading': 'Verfeinerung läuft...',

    // -- Premium: Loading messages --
    'loading.sub': 'Die vollständige Analyse dauert 10 bis 30 Sekunden',
    'loading.msg_01': 'Erfassung Ihrer Situation...',
    'loading.msg_02': 'Identifizierung der Rechtsfragen...',
    'loading.msg_03': 'Aufbau des kontradiktorischen Dossiers...',
    'loading.msg_04': 'Suche der anwendbaren Gesetzesartikel...',
    'loading.msg_05': 'Konsultation der Bundesgerichtspraxis...',
    'loading.msg_06': 'Analyse der Argumente dafür und dagegen...',
    'loading.msg_07': 'Überprüfung des Deckungszertifikats...',
    'loading.msg_08': 'Beurteilung durch das Expertenkomitee...',
    'loading.msg_09': 'Zusammenstellung der normativen Regeln...',
    'loading.msg_10': 'Identifizierung der kritischen Fristen...',
    'loading.msg_11': 'Suche nach fatalen Fehlern...',
    'loading.msg_12': 'Berechnung der Betragsschätzung...',
    'loading.msg_13': 'Überprüfung der juristischen Quellen...',
    'loading.msg_14': 'Erstellung der Folgefragen...',
    'loading.msg_15': 'Vorbereitung der vollständigen Analyse...',
    'loading.msg_16': 'Abgleich mit den kantonalen Richtwerten...',
    'loading.msg_17': 'Prüfung der Zulässigkeit...',
    'loading.msg_18': 'Analyse der zu sammelnden Beweise...',
    'loading.msg_19': 'Identifizierung der zuständigen Stellen...',
    'loading.msg_20': 'Fertigstellung des Berichts...',

    // -- Search result loading messages --
    'loading_search.sub': 'Dies dauert in der Regel 5 bis 15 Sekunden',
    'loading_search.msg_01': 'Erfassung Ihrer Situation...',
    'loading_search.msg_02': 'Identifizierung des Rechtsgebiets...',
    'loading_search.msg_03': 'Suche der anwendbaren Gesetzesartikel...',
    'loading_search.msg_04': 'Konsultation der Bundesgerichtspraxis...',
    'loading_search.msg_05': 'Prüfung der gesetzlichen Fristen...',
    'loading_search.msg_06': 'Analyse der Zulässigkeitsvoraussetzungen...',
    'loading_search.msg_07': 'Extraktion der relevanten Sachverhalte...',
    'loading_search.msg_08': 'Abgleich mit den geprüften Merkblättern...',
    'loading_search.msg_09': 'Beurteilung der rechtlichen Komplexität...',
    'loading_search.msg_10': 'Suche der zuständigen Stellen in Ihrem Kanton...',
    'loading_search.msg_11': 'Prüfung der verfügbaren Briefvorlagen...',
    'loading_search.msg_12': 'Analyse der häufigsten Fehler...',
    'loading_search.msg_13': 'Konsultation der Richtwerte und Referenzzinssätze...',
    'loading_search.msg_14': 'Zusammenstellung der anwendbaren Rechtsregeln...',
    'loading_search.msg_15': 'Erstellung des persönlichen Massnahmenplans...',
    'loading_search.msg_16': 'Überprüfung der Quellen und Referenzen...',
    'loading_search.msg_17': 'Suche nach gegensätzlicher Rechtsprechung...',
    'loading_search.msg_18': 'Beurteilung des Vertrauensniveaus...',
    'loading_search.msg_19': 'Identifizierung der Informationslücken...',
    'loading_search.msg_20': 'Vorbereitung Ihres Dossiers...',

    // -- Annuaire page --
    'annuaire.eyebrow': 'Ressourcen',
    'annuaire.title': 'Verzeichnis der Rechtsberatungsstellen',
    'annuaire.subtitle': 'Finden Sie die zuständigen Stellen in Ihrem Kanton.',
    'annuaire.canton_label': 'Kanton',
    'annuaire.canton_select': '-- Kanton wählen --',
    'annuaire.filter_all': 'Alle',
    'annuaire.filter_asloca': 'Mieterverband',
    'annuaire.filter_csp': 'CSP',
    'annuaire.filter_syndicat': 'Gewerkschaft',
    'annuaire.filter_conciliation': 'Schlichtung',
    'annuaire.filter_aide': 'Unentgeltliche Rechtspflege',
    'annuaire.services_count': 'Verfügbare Stellen ({{count}})',
    'annuaire.no_services': 'Keine Stelle für diesen Kanton erfasst.',
    'annuaire.no_services_type': 'Keine Stelle dieses Typs in diesem Kanton.',
    'annuaire.error_load': 'Stellen konnten nicht geladen werden. Prüfen Sie, ob der Server läuft.',

    // -- Methodologie page --
    'methodo.eyebrow': 'Transparenz',
    'methodo.title': 'Wie JusticePourtous funktioniert',

    // -- Errors / alerts --
    'error.payment_create': 'Zahlungssitzung konnte nicht erstellt werden',
    'error.payment_connection': 'Verbindungsfehler zum Zahlungsdienst.',
    'error.payment_cancelled': 'Zahlung abgebrochen. Sie können es erneut versuchen.',
    'error.payment_processing': 'Die Zahlung wird verarbeitet. Laden Sie die Seite in einigen Augenblicken neu.',
    'error.charge_failed': 'Fehler beim Laden. Versuchen Sie es erneut.',
    'error.analysis_failed': 'Fehler bei der Analyse. Versuchen Sie es erneut.',
    'error.refine_failed': 'Fehler bei der Verfeinerung.',
    'error.generation_failed': 'Fehler bei der Erstellung.',
    'error.docx_failed': 'Fehler bei der Dokumenterstellung.',
    'error.download_failed': 'Fehler beim Herunterladen.',
    'error.file_too_large': 'Datei zu gross (max. 10 MB)',
    'error.extraction': 'Dokument wird extrahiert...',
    'error.no_letter': 'Kein Brief erstellt',

    // -- Language switcher --
    'lang.fr': 'FR',
    'lang.de': 'DE',
    'lang.switch_label': 'Sprache',
  }
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

var _currentLang = null;

/**
 * Get the current language code ('fr' or 'de').
 */
function getLang() {
  if (_currentLang) return _currentLang;
  try {
    var stored = localStorage.getItem('jb_lang');
    if (stored && I18N[stored]) {
      _currentLang = stored;
      return _currentLang;
    }
  } catch (e) { /* localStorage unavailable */ }
  _currentLang = 'fr';
  return _currentLang;
}

/**
 * Set the language and persist to localStorage.
 * @param {string} lang - 'fr' or 'de'
 */
function setLang(lang) {
  if (!I18N[lang]) return;
  _currentLang = lang;
  try { localStorage.setItem('jb_lang', lang); } catch (e) { /* silent */ }
  // Dispatch event so components can react
  if (typeof CustomEvent !== 'undefined') {
    document.dispatchEvent(new CustomEvent('jb:langchange', { detail: { lang: lang } }));
  }
}

/**
 * Translate a key with optional interpolation.
 * @param {string} key - dot-separated key, e.g. 'hero.title'
 * @param {Object} [params] - interpolation values, e.g. {name: 'Robin'}
 * @returns {string} translated string, or the key itself if not found
 *
 * Interpolation uses {{variable}} syntax:
 *   t('greeting', {name: 'Robin'}) with "Bonjour {{name}}" → "Bonjour Robin"
 */
function t(key, params) {
  var lang = getLang();
  var dict = I18N[lang] || I18N.fr;
  var str = dict[key];

  // Fallback to French if key missing in current language
  if (str === undefined && lang !== 'fr') {
    str = I18N.fr[key];
  }

  // If still not found, return the key
  if (str === undefined) return key;

  // Interpolation
  if (params) {
    Object.keys(params).forEach(function(k) {
      str = str.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'g'), params[k]);
    });
  }

  return str;
}

/**
 * Get all loading messages for a given prefix.
 * @param {string} prefix - 'loading' or 'loading_search'
 * @returns {string[]} array of translated messages
 */
function tLoadingMessages(prefix) {
  var msgs = [];
  for (var i = 1; i <= 20; i++) {
    var num = i < 10 ? '0' + i : '' + i;
    msgs.push(t(prefix + '.msg_' + num));
  }
  return msgs;
}

/**
 * Create a language switcher DOM element.
 * Returns a <div> with FR | DE buttons. Append it wherever needed (e.g. nav).
 * Active language gets the 'active' class.
 *
 * @returns {HTMLElement}
 */
function createLangSwitcher() {
  var container = document.createElement('div');
  container.className = 'lang-switcher';
  container.setAttribute('role', 'radiogroup');
  container.setAttribute('aria-label', t('lang.switch_label'));

  var langs = ['fr', 'de'];
  var current = getLang();

  langs.forEach(function(lang, i) {
    if (i > 0) {
      var sep = document.createElement('span');
      sep.className = 'lang-separator';
      sep.textContent = '|';
      sep.setAttribute('aria-hidden', 'true');
      container.appendChild(sep);
    }

    var btn = document.createElement('button');
    btn.className = 'lang-btn' + (lang === current ? ' active' : '');
    btn.setAttribute('type', 'button');
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', lang === current ? 'true' : 'false');
    btn.setAttribute('data-lang', lang);
    btn.textContent = t('lang.' + lang);
    btn.addEventListener('click', function() {
      setLang(lang);
      // Reload page to apply translations
      window.location.reload();
    });
    container.appendChild(btn);
  });

  return container;
}
