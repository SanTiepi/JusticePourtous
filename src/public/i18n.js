/**
 * JusticePourtous — i18n (internationalization)
 * Supports: FR (default), DE (Swiss German), IT (Swiss Italian), EN (English), PT (Portuguese)
 *
 * Usage:
 *   <script src="/i18n.js"></script>
 *   t('nav.annuaire')           → "Annuaire" / "Verzeichnis"
 *   t('hero.subtitle', {name})  → interpolation with {{name}}
 *   setLang('de')               → switch + reload UI
 *   getLang()                    → 'fr' | 'de' | 'it' | 'en' | 'pt'
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
    'lang.it': 'IT',
    'lang.en': 'EN',
    'lang.pt': 'PT',
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
    'lang.it': 'IT',
    'lang.en': 'EN',
    'lang.pt': 'PT',
    'lang.switch_label': 'Sprache',
  },

  it: {
    // -- Navigation --
    'nav.annuaire': 'Elenco',
    'nav.methodologie': 'Metodologia',
    'nav.premium': 'Premium',
    'nav.accueil': 'Home',
    'nav.nouvelle_recherche': 'Nuova ricerca',

    // -- Quick exit --
    'quickexit.label': 'Uscire',
    'quickexit.sublabel': '— uscita rapida',
    'quickexit.title': 'Lasciare rapidamente questo sito — reindirizzamento a MeteoSvizzera',

    // -- Disclaimer --
    'disclaimer.title': 'Informazione giuridica generale',
    'disclaimer.text': 'JusticePourtous non sostituisce una consulenza legale personalizzata. Le informazioni sono fornite a titolo indicativo, senza garanzia di completezza.',
    'disclaimer.text_full': 'JusticePourtous non sostituisce una consulenza legale personalizzata. Le informazioni sono fornite a titolo indicativo, senza garanzia di completezza. In caso di dubbio, consultate un professionista del diritto.',

    // -- Footer --
    'footer.legal': 'JusticePourtous fornisce informazioni giuridiche generali basate sul diritto svizzero vigente. Questo servizio non sostituisce una consulenza legale personalizzata.',
    'footer.legal_full': 'JusticePourtous fornisce informazioni giuridiche generali basate sul diritto svizzero vigente. Questo servizio non sostituisce una consulenza legale personalizzata. In caso di dubbio, consultate un professionista del diritto.',
    'footer.copy': '\u00a9 2026 JusticePourtous',

    // -- Homepage: Hero --
    'hero.eyebrow': 'Diritto svizzero pratico',
    'hero.title_line1': 'Il diritto svizzero,',
    'hero.title_accent': 'accessibile a tutti.',
    'hero.subtitle': 'JusticePourtous identifica la vostra situazione giuridica, vi indica cosa fare, entro quale termine e a chi rivolgervi \u2014 gratuitamente e in modo anonimo.',

    // -- Homepage: Process --
    'process.eyebrow': 'Come funziona',
    'process.step1_title': 'Descrivete',
    'process.step1_text': 'Spiegate la vostra situazione in poche parole, come fareste con un amico.',
    'process.step2_title': 'Capite',
    'process.step2_text': 'Identifichiamo la vostra situazione giuridica, le leggi applicabili e la giurisprudenza.',
    'process.step3_title': 'Agite',
    'process.step3_text': 'Termini, documenti, autorit\u00e0 competente, modello di lettera e contatti gratuiti.',

    // -- Homepage: Domains --
    'domains.eyebrow': 'Sfoglia per settore giuridico',

    // -- Homepage: Search --
    'search.eyebrow': 'Analizzare la mia situazione',
    'search.subtitle': 'Descrivete il vostro problema e la nostra IA identifica i vostri diritti, i termini e le procedure da seguire.',
    'search.placeholder': 'Il mio proprietario rifiuta di restituire la cauzione...',
    'search.aria_label': 'Descrivete il vostro problema giuridico',
    'search.submit': 'Analizzare',
    'search.suggestion_caution': 'Cauzione non restituita',
    'search.suggestion_licenciement': 'Licenziamento e malattia',
    'search.suggestion_heures': 'Ore supplementari non pagate',
    'search.suggestion_commandement': 'Precetto esecutivo',
    'search.suggestion_pension': 'Alimenti non pagati',
    'search.fill_caution': 'il mio proprietario rifiuta di restituire la cauzione',
    'search.fill_licenciement': 'licenziamento durante congedo malattia',
    'search.fill_heures': 'ore supplementari non pagate',
    'search.fill_commandement': 'ho ricevuto un precetto esecutivo',
    'search.fill_pension': 'il mio ex non paga gli alimenti',

    // -- Homepage: Premium CTA --
    'premiumcta.title': 'Analisi approfondita',
    'premiumcta.text': 'La nostra IA analizza il vostro dossier in profondit\u00e0: argomentazione contraddittoria, certificato di copertura, generazione di lettere e documenti Word pronti da inviare.',
    'premiumcta.button': 'Scoprire il Premium',
    'premiumcta.feature1_title': 'Domande mirate',
    'premiumcta.feature1_text': 'L\'IA pone le domande giuste per affinare il vostro dossier',
    'premiumcta.feature2_title': 'Argomenti verificati',
    'premiumcta.feature2_text': 'Pro e contro, con fonti giuridiche',
    'premiumcta.feature3_title': 'Lettere .docx',
    'premiumcta.feature3_text': 'Diffida, opposizione, contestazione pronte da firmare',

    // -- Homepage: Trust band --
    'trust.anonymous_title': 'Anonimo',
    'trust.anonymous_text': 'Nessun dato memorizzato',
    'trust.sources_title': 'Fonti verificate',
    'trust.sources_text': 'Fedlex, giurisprudenza TF',
    'trust.law_title': 'Diritto svizzero',
    'trust.law_text': 'Federale e cantonale',
    'trust.free_title': 'Gratuito',
    'trust.free_text': 'Consultazione libera',

    // -- Homepage: Stat --
    'stat.text': 'degli svizzeri rinunciano a far valere i propri diritti a causa dei costi.',
    'stat.source': 'sondaggio gfs.bern, 2023',

    // -- Results page --
    'result.title': 'Risultato della vostra consultazione',
    'result.refine_aria': 'Precisare la ricerca',
    'result.refine_submit': 'Rilanciare',
    'result.your_situation': 'La vostra situazione',
    'result.your_search': 'La vostra ricerca',
    'result.juridical_qualification': 'Qualificazione giuridica',
    'result.qualification': 'Qualificazione',
    'result.articles_title': 'Articoli di legge applicabili',
    'result.jurisprudence_title': 'Giurisprudenza del Tribunale federale',
    'result.templates_title': 'Modelli di lettera',
    'result.services_title': 'Servizi competenti',
    'result.delais_title': 'Termini da conoscere',
    'result.anti_erreurs_title': 'Errori da evitare',
    'result.lacunes_title': 'Ci\u00f2 che non sappiamo ancora',
    'result.lacune_type_default': 'Informazione mancante',
    'result.alternatives_title': 'Situazioni simili',
    'result.normative_rules_title': 'Regole giuridiche applicabili',
    'result.vulg_title': 'Domande frequenti dei cittadini',
    'result.baremes_title': 'Tassi di riferimento',
    'result.baremes_label': 'Tasso ipotecario di riferimento UFAB',
    'result.baremes_consequence': 'Base per contestare un aumento dell\'affitto (CO 269a). Pubblicato il {{date}}',
    'result.source_footer': 'Fonti: {{articles}} articoli, {{arrets}} sentenze',
    'result.source_rules': '{{count}} regole',
    'result.no_result': 'Nessun risultato. Verificate la vostra descrizione.',
    'result.error_fiche': 'Scheda non trovata.',
    'result.error_connection': 'Errore di connessione.',
    'result.error_no_query': 'Nessuna ricerca specificata.',
    'result.back_home': 'Ritorno alla home',
    'result.model_letter': 'Modello di lettera',

    // -- Results: Jurisprudence roles --
    'role.favorable': 'Favorevole',
    'role.defavorable': 'Sfavorevole',
    'role.neutre': 'Neutro',

    // -- Results: Confidence levels --
    'confidence.certain': 'Certo',
    'confidence.probable': 'Probabile',
    'confidence.variable': 'Variabile',
    'confidence.incertain': 'Incerto',

    // -- Results: Tier badges --
    'tier.1': 'LEGGE',
    'tier.2': 'TF',
    'tier.3': 'PRATICA',

    // -- Results: Premium CTA (in-results) --
    'premiumcta_result.title': 'Andare oltre con l\'analisi premium',
    'premiumcta_result.badge': 'Da CHF 0.15',
    'premiumcta_result.intro': 'Questa prima valutazione vi fornisce le basi. L\'analisi premium va molto pi\u00f9 lontano:',
    'premiumcta_result.q_title': 'Domande personalizzate',
    'premiumcta_result.q_text': 'L\'IA pone le domande che cambiano la diagnosi \u2014 non domande generiche',
    'premiumcta_result.arg_title': 'Argomentazione contraddittoria',
    'premiumcta_result.arg_text': 'Argomenti a favore E contro la vostra posizione, con articoli di legge e giurisprudenza',
    'premiumcta_result.cert_title': 'Certificato di copertura',
    'premiumcta_result.cert_text': 'Verifichiamo che non manchi nulla nel vostro dossier prima di agire',
    'premiumcta_result.letter_title': 'Lettere pronte da inviare',
    'premiumcta_result.letter_text': 'Diffida, opposizione, contestazione \u2014 in .docx con le vostre informazioni',
    'premiumcta_result.button': 'Avviare l\'analisi premium',

    // -- Results: Upsell --
    'upsell.title': 'Avete bisogno di un\'analisi personalizzata?',
    'upsell.text': 'La nostra IA analizza la vostra situazione in dettaglio per CHF 0.03 a 0.10 per domanda.',
    'upsell.button': 'Spazio Premium',

    // -- Common actions --
    'action.analyser': 'Analizzare',
    'action.imprimer': 'Stampare / Salvare PDF',
    'action.imprimer_short': 'Stampare / PDF',
    'action.copier': 'Copiare',
    'action.copier_texte': 'Copiare il testo',
    'action.copie': 'Copiato!',
    'action.telecharger_docx': 'Scaricare .docx',
    'action.nouvelle_consultation': 'Nuova consultazione',
    'action.nouvelle_recherche': 'Nuova ricerca',
    'action.afficher': 'Mostrare',
    'action.masquer': 'Nascondere',
    'action.suivant': 'Seguente',
    'action.precedent': 'Precedente',
    'action.voir_droits': 'Vedere i miei diritti',
    'action.site_web': 'Sito web',
    'action.trouver_avocat': 'Trovare un avvocato',
    'action.activer': 'Attivare',
    'action.affiner': 'Affinare l\'analisi',

    // -- Consultation --
    'consult.title': 'Consultazione',
    'consult.question_n': 'Domanda {{n}} su {{total}}',
    'consult.loading': 'Caricamento...',
    'consult.analysis_loading': 'Analisi in corso',
    'consult.canton_select': '-- Cantone --',
    'consult.error': 'Si \u00e8 verificato un errore.',

    // -- Premium page --
    'premium.eyebrow': 'Spazio Premium',
    'premium.title': 'Analisi giuridica personalizzata',
    'premium.subtitle': 'Intelligenza artificiale al servizio della vostra situazione giuridica.',
    'premium.offer_title': 'Analisi giuridica personalizzata con IA',
    'premium.offer_features': 'Domande mirate, argomentazione contraddittoria, certificato di copertura, lettere pronte da inviare in .docx.',
    'premium.pricing_one_label': 'Un problema',
    'premium.pricing_one_detail': 'Sufficiente per 1 dossier semplice con analisi + lettera',
    'premium.pricing_one_btn': 'Caricare CHF 5',
    'premium.pricing_rec_label': 'Raccomandato',
    'premium.pricing_rec_detail': 'Copre da 1 a 3 dossier \u2014 la scelta pi\u00f9 comune',
    'premium.pricing_rec_btn': 'Caricare CHF 10',
    'premium.pricing_complex_label': 'Dossier complesso',
    'premium.pricing_complex_detail': 'Per situazioni multi-settore o che richiedono pi\u00f9 lettere',
    'premium.pricing_complex_btn': 'Caricare CHF 20',
    'premium.cost_table_title': 'Costo indicativo per operazione',
    'premium.cost_simple': 'Analisi semplice',
    'premium.cost_simple_range': 'CHF 0.15 \u2013 0.25',
    'premium.cost_questions': 'Analisi + domande + affinamento',
    'premium.cost_questions_range': 'CHF 0.30 \u2013 0.50',
    'premium.cost_dossier': 'Dossier completo con lettera',
    'premium.cost_dossier_range': 'CHF 0.50 \u2013 1.00',
    'premium.cost_complex': 'Dossier complesso (pi\u00f9 settori, pi\u00f9 lettere)',
    'premium.cost_complex_range': 'CHF 1.00 \u2013 3.00',
    'premium.cost_letter': 'Lettera supplementare (.docx)',
    'premium.cost_letter_range': 'CHF 0.05 \u2013 0.10',
    'premium.cost_note': 'Il costo esatto viene mostrato dopo ogni operazione. Il vostro saldo pu\u00f2 essere ricaricato in qualsiasi momento.',
    'premium.code_label': 'Avete un codice di accesso?',
    'premium.code_placeholder': 'Inserire il codice',
    'premium.wallet_label': 'Saldo rimanente',
    'premium.analyze_title': 'Analizzare la vostra situazione',
    'premium.analyze_cost_hint': 'Costo stimato: CHF 0.03 a 0.10 per analisi',
    'premium.analyze_placeholder': 'Descrivete la vostra situazione giuridica in dettaglio...',
    'premium.analyze_submit': 'Analizzare la mia situazione',
    'premium.upload_label': 'Allegare un documento (PDF, immagine)',
    'premium.upload_change': 'Cambiare documento',
    'premium.analysis_label': 'Analisi',
    'premium.letter_generated': 'Lettera generata',
    'premium.history_title': 'Cronologia',
    'premium.history_empty': 'Nessuna azione',
    'premium.generate_letter': 'Generare la lettera',
    'premium.print': 'Stampare',

    // -- Premium: Letter types --
    'letter.mise_en_demeure': 'Diffida',
    'letter.contestation': 'Contestazione',
    'letter.opposition': 'Opposizione',
    'letter.resiliation': 'Disdetta',
    'letter.plainte': 'Denuncia',

    // -- Premium: V4 response --
    'v4.questions_title': 'Domande per affinare l\'analisi',
    'v4.critique': 'Critico',
    'v4.resume': 'Riassunto',
    'v4.arguments_title': 'Argomenti verificati',
    'v4.objections_title': 'Obiezioni possibili',
    'v4.deadlines_title': 'Termini critici',
    'v4.fatal_errors_title': 'Errori da evitare assolutamente',
    'v4.action_plan': 'Piano d\'azione',
    'v4.certificate_title': 'Certificato di copertura',
    'v4.certificate_score': 'Punteggio',
    'v4.lawyer_recommended': 'Si raccomanda un avvocato',
    'v4.sources_count': 'Analisi basata su {{count}} fonti',
    'v4.cost_receipt': 'Costo di questa analisi: CHF {{cost}} \u2014 Saldo rimanente: CHF {{remaining}}',
    'v4.no_result': 'Nessun risultato. Verificate la vostra descrizione.',
    'v4.no_text': 'Nessun testo da analizzare.',
    'v4.refine_loading': 'Affinamento in corso...',

    // -- Premium: Loading messages --
    'loading.sub': 'L\'analisi completa richiede da 10 a 30 secondi',
    'loading.msg_01': 'Comprensione della vostra situazione...',
    'loading.msg_02': 'Identificazione dei problemi giuridici...',
    'loading.msg_03': 'Costruzione del dossier contraddittorio...',
    'loading.msg_04': 'Ricerca degli articoli di legge applicabili...',
    'loading.msg_05': 'Consultazione della giurisprudenza del TF...',
    'loading.msg_06': 'Analisi degli argomenti pro e contro...',
    'loading.msg_07': 'Verifica del certificato di copertura...',
    'loading.msg_08': 'Valutazione del comitato di esperti...',
    'loading.msg_09': 'Compilazione delle regole normative...',
    'loading.msg_10': 'Identificazione dei termini critici...',
    'loading.msg_11': 'Ricerca degli errori fatali da evitare...',
    'loading.msg_12': 'Calcolo della fascia di importo...',
    'loading.msg_13': 'Verifica delle fonti giuridiche...',
    'loading.msg_14': 'Generazione delle domande di approfondimento...',
    'loading.msg_15': 'Preparazione dell\'analisi completa...',
    'loading.msg_16': 'Incrocio con le tariffe cantonali...',
    'loading.msg_17': 'Verifica della ricevibilit\u00e0...',
    'loading.msg_18': 'Analisi delle prove da raccogliere...',
    'loading.msg_19': 'Identificazione dei contatti competenti...',
    'loading.msg_20': 'Finalizzazione del rapporto...',

    // -- Search result loading messages --
    'loading_search.sub': 'Di solito richiede da 5 a 15 secondi',
    'loading_search.msg_01': 'Lettura della vostra situazione...',
    'loading_search.msg_02': 'Identificazione del settore giuridico...',
    'loading_search.msg_03': 'Ricerca degli articoli di legge applicabili...',
    'loading_search.msg_04': 'Consultazione della giurisprudenza del Tribunale federale...',
    'loading_search.msg_05': 'Verifica dei termini legali...',
    'loading_search.msg_06': 'Analisi delle condizioni di ricevibilit\u00e0...',
    'loading_search.msg_07': 'Estrazione dei fatti pertinenti...',
    'loading_search.msg_08': 'Incrocio con le schede verificate...',
    'loading_search.msg_09': 'Valutazione della complessit\u00e0 giuridica...',
    'loading_search.msg_10': 'Ricerca dei servizi competenti nel vostro cantone...',
    'loading_search.msg_11': 'Verifica dei modelli di lettera disponibili...',
    'loading_search.msg_12': 'Analisi degli errori frequenti da evitare...',
    'loading_search.msg_13': 'Consultazione delle tariffe e dei tassi di riferimento...',
    'loading_search.msg_14': 'Compilazione delle regole normative applicabili...',
    'loading_search.msg_15': 'Costruzione del piano d\'azione personalizzato...',
    'loading_search.msg_16': 'Verifica delle fonti e dei riferimenti...',
    'loading_search.msg_17': 'Ricerca di giurisprudenza contraddittoria...',
    'loading_search.msg_18': 'Valutazione del livello di fiducia...',
    'loading_search.msg_19': 'Identificazione delle lacune informative...',
    'loading_search.msg_20': 'Preparazione del vostro dossier...',

    // -- Annuaire page --
    'annuaire.eyebrow': 'Risorse',
    'annuaire.title': 'Elenco dei servizi giuridici',
    'annuaire.subtitle': 'Trovate i servizi competenti nel vostro cantone.',
    'annuaire.canton_label': 'Cantone',
    'annuaire.canton_select': '-- Scegliere un cantone --',
    'annuaire.filter_all': 'Tutti',
    'annuaire.filter_asloca': 'ASI',
    'annuaire.filter_csp': 'CSP',
    'annuaire.filter_syndicat': 'Sindacato',
    'annuaire.filter_conciliation': 'Conciliazione',
    'annuaire.filter_aide': 'Assistenza giudiziaria',
    'annuaire.services_count': 'Servizi disponibili ({{count}})',
    'annuaire.no_services': 'Nessun servizio registrato per questo cantone.',
    'annuaire.no_services_type': 'Nessun servizio di questo tipo in questo cantone.',
    'annuaire.error_load': 'Impossibile caricare i servizi. Verificate che il server sia in funzione.',

    // -- Methodologie page --
    'methodo.eyebrow': 'Trasparenza',
    'methodo.title': 'Come funziona JusticePourtous',

    // -- Errors / alerts --
    'error.payment_create': 'Impossibile creare la sessione di pagamento',
    'error.payment_connection': 'Errore di connessione al servizio di pagamento.',
    'error.payment_cancelled': 'Pagamento annullato. Potete riprovare.',
    'error.payment_processing': 'Il pagamento \u00e8 in corso. Ricaricate la pagina tra qualche istante.',
    'error.charge_failed': 'Errore durante il caricamento. Riprovate.',
    'error.analysis_failed': 'Errore durante l\'analisi. Riprovate.',
    'error.refine_failed': 'Errore durante l\'affinamento.',
    'error.generation_failed': 'Errore durante la generazione.',
    'error.docx_failed': 'Errore durante la generazione del documento.',
    'error.download_failed': 'Errore durante il download.',
    'error.file_too_large': 'File troppo grande (max 10 MB)',
    'error.extraction': 'Estrazione del documento...',
    'error.no_letter': 'Nessuna lettera generata',

    // -- Language switcher --
    'lang.fr': 'FR',
    'lang.de': 'DE',
    'lang.it': 'IT',
    'lang.en': 'EN',
    'lang.pt': 'PT',
    'lang.switch_label': 'Lingua',
  },

  en: {
    // -- Navigation --
    'nav.annuaire': 'Directory',
    'nav.methodologie': 'Methodology',
    'nav.premium': 'Premium',
    'nav.accueil': 'Home',
    'nav.nouvelle_recherche': 'New search',

    // -- Quick exit --
    'quickexit.label': 'Leave',
    'quickexit.sublabel': '— quick exit',
    'quickexit.title': 'Quickly leave this site — redirects to MeteoSwiss',

    // -- Disclaimer --
    'disclaimer.title': 'General legal information',
    'disclaimer.text': 'JusticePourtous does not replace personalised legal advice from a lawyer. The information is provided for general guidance only, without any guarantee of completeness.',
    'disclaimer.text_full': 'JusticePourtous does not replace personalised legal advice from a lawyer. The information is provided for general guidance only, without any guarantee of completeness. If in doubt, consult a legal professional.',

    // -- Footer --
    'footer.legal': 'JusticePourtous provides general legal information based on Swiss law in force. This service does not replace personalised legal advice.',
    'footer.legal_full': 'JusticePourtous provides general legal information based on Swiss law in force. This service does not replace personalised legal advice. If in doubt, consult a legal professional.',
    'footer.copy': '\u00a9 2026 JusticePourtous',

    // -- Homepage: Hero --
    'hero.eyebrow': 'Practical Swiss law',
    'hero.title_line1': 'Swiss law,',
    'hero.title_accent': 'accessible to all.',
    'hero.subtitle': 'JusticePourtous identifies your legal situation, tells you what to do, by when, and who to contact \u2014 free and anonymous.',

    // -- Homepage: Process --
    'process.eyebrow': 'How it works',
    'process.step1_title': 'Describe',
    'process.step1_text': 'Explain your situation in a few words, as you would to a friend.',
    'process.step2_title': 'Understand',
    'process.step2_text': 'We identify your legal situation, the applicable laws and case law.',
    'process.step3_title': 'Act',
    'process.step3_text': 'Deadlines, documents, competent authority, letter template and free contacts.',

    // -- Homepage: Domains --
    'domains.eyebrow': 'Browse by legal area',

    // -- Homepage: Search --
    'search.eyebrow': 'Analyse my situation',
    'search.subtitle': 'Describe your problem and our AI identifies your rights, deadlines and the steps to follow.',
    'search.placeholder': 'My landlord refuses to return my rental deposit...',
    'search.aria_label': 'Describe your legal problem',
    'search.submit': 'Analyse',
    'search.suggestion_caution': 'Deposit not returned',
    'search.suggestion_licenciement': 'Dismissal & illness',
    'search.suggestion_heures': 'Unpaid overtime',
    'search.suggestion_commandement': 'Payment order',
    'search.suggestion_pension': 'Unpaid maintenance',
    'search.fill_caution': 'my landlord refuses to return my rental deposit',
    'search.fill_licenciement': 'dismissal during sick leave',
    'search.fill_heures': 'unpaid overtime',
    'search.fill_commandement': 'I received a payment order (debt enforcement)',
    'search.fill_pension': 'my ex does not pay maintenance',

    // -- Homepage: Premium CTA --
    'premiumcta.title': 'In-depth analysis',
    'premiumcta.text': 'Our AI analyses your case in depth: adversarial argumentation, coverage certificate, letter generation and Word documents ready to send.',
    'premiumcta.button': 'Discover Premium',
    'premiumcta.feature1_title': 'Targeted questions',
    'premiumcta.feature1_text': 'The AI asks the right questions to refine your case',
    'premiumcta.feature2_title': 'Verified arguments',
    'premiumcta.feature2_text': 'For and against, with legal sources',
    'premiumcta.feature3_title': 'Letters as .docx',
    'premiumcta.feature3_text': 'Formal notice, objection, contestation ready to sign',

    // -- Homepage: Trust band --
    'trust.anonymous_title': 'Anonymous',
    'trust.anonymous_text': 'No data stored',
    'trust.sources_title': 'Verified sources',
    'trust.sources_text': 'Fedlex, Federal Supreme Court case law',
    'trust.law_title': 'Swiss law',
    'trust.law_text': 'Federal and cantonal',
    'trust.free_title': 'Free',
    'trust.free_text': 'Open consultation',

    // -- Homepage: Stat --
    'stat.text': 'of Swiss residents give up asserting their rights due to cost.',
    'stat.source': 'gfs.bern survey, 2023',

    // -- Results page --
    'result.title': 'Result of your consultation',
    'result.refine_aria': 'Refine your search',
    'result.refine_submit': 'Search again',
    'result.your_situation': 'Your situation',
    'result.your_search': 'Your search',
    'result.juridical_qualification': 'Legal qualification',
    'result.qualification': 'Qualification',
    'result.articles_title': 'Applicable legal articles',
    'result.jurisprudence_title': 'Federal Supreme Court case law',
    'result.templates_title': 'Letter templates',
    'result.services_title': 'Competent services',
    'result.delais_title': 'Key deadlines',
    'result.anti_erreurs_title': 'Mistakes to avoid',
    'result.lacunes_title': 'What we do not know yet',
    'result.lacune_type_default': 'Missing information',
    'result.alternatives_title': 'Similar situations',
    'result.normative_rules_title': 'Applicable legal rules',
    'result.vulg_title': 'Frequently asked questions',
    'result.baremes_title': 'Reference rates',
    'result.baremes_label': 'SFHO mortgage reference rate',
    'result.baremes_consequence': 'Basis for contesting a rent increase (CO 269a). Published on {{date}}',
    'result.source_footer': 'Sources: {{articles}} articles, {{arrets}} rulings',
    'result.source_rules': '{{count}} rules',
    'result.no_result': 'No results. Please check your description.',
    'result.error_fiche': 'Fact sheet not found.',
    'result.error_connection': 'Connection error.',
    'result.error_no_query': 'No search specified.',
    'result.back_home': 'Back to home',
    'result.model_letter': 'Letter template',

    // -- Results: Jurisprudence roles --
    'role.favorable': 'Favourable',
    'role.defavorable': 'Unfavourable',
    'role.neutre': 'Neutral',

    // -- Results: Confidence levels --
    'confidence.certain': 'Certain',
    'confidence.probable': 'Probable',
    'confidence.variable': 'Variable',
    'confidence.incertain': 'Uncertain',

    // -- Results: Tier badges --
    'tier.1': 'LAW',
    'tier.2': 'FSC',
    'tier.3': 'PRACTICE',

    // -- Results: Premium CTA (in-results) --
    'premiumcta_result.title': 'Go further with premium analysis',
    'premiumcta_result.badge': 'From CHF 0.15',
    'premiumcta_result.intro': 'This initial assessment gives you the basics. The premium analysis goes much further:',
    'premiumcta_result.q_title': 'Personalised questions',
    'premiumcta_result.q_text': 'The AI asks the questions that change the diagnosis \u2014 not generic questions',
    'premiumcta_result.arg_title': 'Adversarial argumentation',
    'premiumcta_result.arg_text': 'Arguments for AND against your position, with legal articles and case law',
    'premiumcta_result.cert_title': 'Coverage certificate',
    'premiumcta_result.cert_text': 'We check that nothing is missing in your case before you act',
    'premiumcta_result.letter_title': 'Ready-to-send letters',
    'premiumcta_result.letter_text': 'Formal notice, objection, contestation \u2014 as .docx with your information',
    'premiumcta_result.button': 'Start premium analysis',

    // -- Results: Upsell --
    'upsell.title': 'Need a personalised analysis?',
    'upsell.text': 'Our AI analyses your situation in detail for CHF 0.03 to 0.10 per question.',
    'upsell.button': 'Premium area',

    // -- Common actions --
    'action.analyser': 'Analyse',
    'action.imprimer': 'Print / Save as PDF',
    'action.imprimer_short': 'Print / PDF',
    'action.copier': 'Copy',
    'action.copier_texte': 'Copy text',
    'action.copie': 'Copied!',
    'action.telecharger_docx': 'Download .docx',
    'action.nouvelle_consultation': 'New consultation',
    'action.nouvelle_recherche': 'New search',
    'action.afficher': 'Show',
    'action.masquer': 'Hide',
    'action.suivant': 'Next',
    'action.precedent': 'Previous',
    'action.voir_droits': 'See my rights',
    'action.site_web': 'Website',
    'action.trouver_avocat': 'Find a lawyer',
    'action.activer': 'Activate',
    'action.affiner': 'Refine analysis',

    // -- Consultation --
    'consult.title': 'Consultation',
    'consult.question_n': 'Question {{n}} of {{total}}',
    'consult.loading': 'Loading...',
    'consult.analysis_loading': 'Analysis in progress',
    'consult.canton_select': '-- Canton --',
    'consult.error': 'An error has occurred.',

    // -- Premium page --
    'premium.eyebrow': 'Premium area',
    'premium.title': 'Personalised legal analysis',
    'premium.subtitle': 'Artificial intelligence at the service of your legal situation.',
    'premium.offer_title': 'Personalised legal analysis by AI',
    'premium.offer_features': 'Targeted questions, adversarial argumentation, coverage certificate, ready-to-send letters as .docx.',
    'premium.pricing_one_label': 'One issue',
    'premium.pricing_one_detail': 'Sufficient for 1 simple case with analysis + letter',
    'premium.pricing_one_btn': 'Load CHF 5',
    'premium.pricing_rec_label': 'Recommended',
    'premium.pricing_rec_detail': 'Covers 1 to 3 cases \u2014 the most common choice',
    'premium.pricing_rec_btn': 'Load CHF 10',
    'premium.pricing_complex_label': 'Complex case',
    'premium.pricing_complex_detail': 'For multi-area situations or those requiring several letters',
    'premium.pricing_complex_btn': 'Load CHF 20',
    'premium.cost_table_title': 'Indicative cost per operation',
    'premium.cost_simple': 'Simple analysis',
    'premium.cost_simple_range': 'CHF 0.15 \u2013 0.25',
    'premium.cost_questions': 'Analysis + questions + refinement',
    'premium.cost_questions_range': 'CHF 0.30 \u2013 0.50',
    'premium.cost_dossier': 'Complete case with letter',
    'premium.cost_dossier_range': 'CHF 0.50 \u2013 1.00',
    'premium.cost_complex': 'Complex case (multiple areas, several letters)',
    'premium.cost_complex_range': 'CHF 1.00 \u2013 3.00',
    'premium.cost_letter': 'Additional letter (.docx)',
    'premium.cost_letter_range': 'CHF 0.05 \u2013 0.10',
    'premium.cost_note': 'The exact cost is shown after each operation. Your balance can be topped up at any time.',
    'premium.code_label': 'Do you have an access code?',
    'premium.code_placeholder': 'Enter your code',
    'premium.wallet_label': 'Remaining balance',
    'premium.analyze_title': 'Analyse your situation',
    'premium.analyze_cost_hint': 'Estimated cost: CHF 0.03 to 0.10 per analysis',
    'premium.analyze_placeholder': 'Describe your legal situation in detail...',
    'premium.analyze_submit': 'Analyse my situation',
    'premium.upload_label': 'Attach a document (PDF, image)',
    'premium.upload_change': 'Change document',
    'premium.analysis_label': 'Analysis',
    'premium.letter_generated': 'Generated letter',
    'premium.history_title': 'History',
    'premium.history_empty': 'No actions',
    'premium.generate_letter': 'Generate letter',
    'premium.print': 'Print',

    // -- Premium: Letter types --
    'letter.mise_en_demeure': 'Formal notice',
    'letter.contestation': 'Contestation',
    'letter.opposition': 'Objection',
    'letter.resiliation': 'Termination',
    'letter.plainte': 'Criminal complaint',

    // -- Premium: V4 response --
    'v4.questions_title': 'Questions to refine the analysis',
    'v4.critique': 'Critical',
    'v4.resume': 'Summary',
    'v4.arguments_title': 'Verified arguments',
    'v4.objections_title': 'Possible objections',
    'v4.deadlines_title': 'Critical deadlines',
    'v4.fatal_errors_title': 'Mistakes to absolutely avoid',
    'v4.action_plan': 'Action plan',
    'v4.certificate_title': 'Coverage certificate',
    'v4.certificate_score': 'Score',
    'v4.lawyer_recommended': 'A lawyer is recommended',
    'v4.sources_count': 'Analysis based on {{count}} sources',
    'v4.cost_receipt': 'Cost of this analysis: CHF {{cost}} \u2014 Remaining balance: CHF {{remaining}}',
    'v4.no_result': 'No results. Please check your description.',
    'v4.no_text': 'No text to analyse.',
    'v4.refine_loading': 'Refinement in progress...',

    // -- Premium: Loading messages --
    'loading.sub': 'The full analysis takes 10 to 30 seconds',
    'loading.msg_01': 'Understanding your situation...',
    'loading.msg_02': 'Identifying the legal issues...',
    'loading.msg_03': 'Building the adversarial case file...',
    'loading.msg_04': 'Searching for applicable legal articles...',
    'loading.msg_05': 'Consulting Federal Supreme Court case law...',
    'loading.msg_06': 'Analysing arguments for and against...',
    'loading.msg_07': 'Checking the coverage certificate...',
    'loading.msg_08': 'Expert committee evaluation...',
    'loading.msg_09': 'Compiling normative rules...',
    'loading.msg_10': 'Identifying critical deadlines...',
    'loading.msg_11': 'Searching for fatal errors to avoid...',
    'loading.msg_12': 'Calculating the amount range...',
    'loading.msg_13': 'Verifying legal sources...',
    'loading.msg_14': 'Generating follow-up questions...',
    'loading.msg_15': 'Preparing the complete analysis...',
    'loading.msg_16': 'Cross-referencing cantonal benchmarks...',
    'loading.msg_17': 'Checking admissibility...',
    'loading.msg_18': 'Analysing evidence to gather...',
    'loading.msg_19': 'Identifying competent contacts...',
    'loading.msg_20': 'Finalising the report...',

    // -- Search result loading messages --
    'loading_search.sub': 'This usually takes 5 to 15 seconds',
    'loading_search.msg_01': 'Reading your situation...',
    'loading_search.msg_02': 'Identifying the legal area...',
    'loading_search.msg_03': 'Searching for applicable legal articles...',
    'loading_search.msg_04': 'Consulting Federal Supreme Court case law...',
    'loading_search.msg_05': 'Checking statutory deadlines...',
    'loading_search.msg_06': 'Analysing admissibility conditions...',
    'loading_search.msg_07': 'Extracting relevant facts...',
    'loading_search.msg_08': 'Cross-referencing with verified fact sheets...',
    'loading_search.msg_09': 'Assessing legal complexity...',
    'loading_search.msg_10': 'Searching for competent services in your canton...',
    'loading_search.msg_11': 'Checking available letter templates...',
    'loading_search.msg_12': 'Analysing common mistakes to avoid...',
    'loading_search.msg_13': 'Consulting benchmarks and reference rates...',
    'loading_search.msg_14': 'Compiling applicable legal rules...',
    'loading_search.msg_15': 'Building your personalised action plan...',
    'loading_search.msg_16': 'Verifying sources and references...',
    'loading_search.msg_17': 'Searching for contrary case law...',
    'loading_search.msg_18': 'Assessing the confidence level...',
    'loading_search.msg_19': 'Identifying information gaps...',
    'loading_search.msg_20': 'Preparing your case file...',

    // -- Annuaire page --
    'annuaire.eyebrow': 'Resources',
    'annuaire.title': 'Legal services directory',
    'annuaire.subtitle': 'Find the competent services in your canton.',
    'annuaire.canton_label': 'Canton',
    'annuaire.canton_select': '-- Choose a canton --',
    'annuaire.filter_all': 'All',
    'annuaire.filter_asloca': 'Tenants\' association',
    'annuaire.filter_csp': 'CSP',
    'annuaire.filter_syndicat': 'Trade union',
    'annuaire.filter_conciliation': 'Conciliation',
    'annuaire.filter_aide': 'Legal aid',
    'annuaire.services_count': 'Available services ({{count}})',
    'annuaire.no_services': 'No services listed for this canton.',
    'annuaire.no_services_type': 'No services of this type in this canton.',
    'annuaire.error_load': 'Unable to load services. Check that the server is running.',

    // -- Methodologie page --
    'methodo.eyebrow': 'Transparency',
    'methodo.title': 'How JusticePourtous works',

    // -- Errors / alerts --
    'error.payment_create': 'Unable to create payment session',
    'error.payment_connection': 'Connection error with the payment service.',
    'error.payment_cancelled': 'Payment cancelled. You can try again.',
    'error.payment_processing': 'Payment is being processed. Reload the page in a few moments.',
    'error.charge_failed': 'Error during loading. Try again.',
    'error.analysis_failed': 'Error during analysis. Try again.',
    'error.refine_failed': 'Error during refinement.',
    'error.generation_failed': 'Error during generation.',
    'error.docx_failed': 'Error during document generation.',
    'error.download_failed': 'Error during download.',
    'error.file_too_large': 'File too large (max 10 MB)',
    'error.extraction': 'Extracting document...',
    'error.no_letter': 'No letter generated',

    // -- Language switcher --
    'lang.fr': 'FR',
    'lang.de': 'DE',
    'lang.it': 'IT',
    'lang.en': 'EN',
    'lang.pt': 'PT',
    'lang.switch_label': 'Language',
  },

  pt: {
    // -- Navigation --
    'nav.annuaire': 'Diret\u00f3rio',
    'nav.methodologie': 'Metodologia',
    'nav.premium': 'Premium',
    'nav.accueil': 'In\u00edcio',
    'nav.nouvelle_recherche': 'Nova pesquisa',

    // -- Quick exit --
    'quickexit.label': 'Sair',
    'quickexit.sublabel': '— sa\u00edda r\u00e1pida',
    'quickexit.title': 'Sair rapidamente deste site — redireciona para MeteoSu\u00ed\u00e7a',

    // -- Disclaimer --
    'disclaimer.title': 'Informa\u00e7\u00e3o jur\u00eddica geral',
    'disclaimer.text': 'JusticePourtous n\u00e3o substitui o aconselhamento jur\u00eddico personalizado de um advogado. As informa\u00e7\u00f5es s\u00e3o fornecidas a t\u00edtulo indicativo, sem garantia de exaustividade.',
    'disclaimer.text_full': 'JusticePourtous n\u00e3o substitui o aconselhamento jur\u00eddico personalizado de um advogado. As informa\u00e7\u00f5es s\u00e3o fornecidas a t\u00edtulo indicativo, sem garantia de exaustividade. Em caso de d\u00favida, consulte um profissional do direito.',

    // -- Footer --
    'footer.legal': 'JusticePourtous fornece informa\u00e7\u00f5es jur\u00eddicas gerais baseadas no direito su\u00ed\u00e7o em vigor. Este servi\u00e7o n\u00e3o substitui o aconselhamento jur\u00eddico personalizado.',
    'footer.legal_full': 'JusticePourtous fornece informa\u00e7\u00f5es jur\u00eddicas gerais baseadas no direito su\u00ed\u00e7o em vigor. Este servi\u00e7o n\u00e3o substitui o aconselhamento jur\u00eddico personalizado. Em caso de d\u00favida, consulte um profissional do direito.',
    'footer.copy': '\u00a9 2026 JusticePourtous',

    // -- Homepage: Hero --
    'hero.eyebrow': 'Direito su\u00ed\u00e7o pr\u00e1tico',
    'hero.title_line1': 'O direito su\u00ed\u00e7o,',
    'hero.title_accent': 'acess\u00edvel a todos.',
    'hero.subtitle': 'JusticePourtous identifica a sua situa\u00e7\u00e3o jur\u00eddica, indica-lhe o que fazer, em que prazo e a quem recorrer \u2014 gratuitamente e de forma an\u00f3nima.',

    // -- Homepage: Process --
    'process.eyebrow': 'Como funciona',
    'process.step1_title': 'Descreva',
    'process.step1_text': 'Explique a sua situa\u00e7\u00e3o em poucas palavras, como faria a um amigo.',
    'process.step2_title': 'Compreenda',
    'process.step2_text': 'Identificamos a sua situa\u00e7\u00e3o jur\u00eddica, as leis aplic\u00e1veis e a jurisprud\u00eancia.',
    'process.step3_title': 'Aja',
    'process.step3_text': 'Prazos, documentos, autoridade competente, modelo de carta e contactos gratuitos.',

    // -- Homepage: Domains --
    'domains.eyebrow': 'Pesquisar por \u00e1rea jur\u00eddica',

    // -- Homepage: Search --
    'search.eyebrow': 'Analisar a minha situa\u00e7\u00e3o',
    'search.subtitle': 'Descreva o seu problema e a nossa IA identifica os seus direitos, prazos e os passos a seguir.',
    'search.placeholder': 'O meu senhorio recusa-se a devolver a cau\u00e7\u00e3o...',
    'search.aria_label': 'Descreva o seu problema jur\u00eddico',
    'search.submit': 'Analisar',
    'search.suggestion_caution': 'Cau\u00e7\u00e3o n\u00e3o devolvida',
    'search.suggestion_licenciement': 'Despedimento e doen\u00e7a',
    'search.suggestion_heures': 'Horas extras n\u00e3o pagas',
    'search.suggestion_commandement': 'Mandado de pagamento',
    'search.suggestion_pension': 'Pens\u00e3o n\u00e3o paga',
    'search.fill_caution': 'o meu senhorio recusa-se a devolver a cau\u00e7\u00e3o',
    'search.fill_licenciement': 'despedimento durante baixa m\u00e9dica',
    'search.fill_heures': 'horas extras n\u00e3o pagas',
    'search.fill_commandement': 'recebi um mandado de pagamento',
    'search.fill_pension': 'o meu ex n\u00e3o paga a pens\u00e3o',

    // -- Homepage: Premium CTA --
    'premiumcta.title': 'An\u00e1lise aprofundada',
    'premiumcta.text': 'A nossa IA analisa o seu dossier em profundidade: argumenta\u00e7\u00e3o contradit\u00f3ria, certificado de cobertura, gera\u00e7\u00e3o de cartas e documentos Word prontos a enviar.',
    'premiumcta.button': 'Descobrir o Premium',
    'premiumcta.feature1_title': 'Perguntas direcionadas',
    'premiumcta.feature1_text': 'A IA faz as perguntas certas para afinar o seu dossier',
    'premiumcta.feature2_title': 'Argumentos verificados',
    'premiumcta.feature2_text': 'A favor e contra, com fontes jur\u00eddicas',
    'premiumcta.feature3_title': 'Cartas .docx',
    'premiumcta.feature3_text': 'Interpela\u00e7\u00e3o, oposi\u00e7\u00e3o, contesta\u00e7\u00e3o prontas a assinar',

    // -- Homepage: Trust band --
    'trust.anonymous_title': 'An\u00f3nimo',
    'trust.anonymous_text': 'Nenhum dado armazenado',
    'trust.sources_title': 'Fontes verificadas',
    'trust.sources_text': 'Fedlex, jurisprud\u00eancia do TF',
    'trust.law_title': 'Direito su\u00ed\u00e7o',
    'trust.law_text': 'Federal e cantonal',
    'trust.free_title': 'Gratuito',
    'trust.free_text': 'Consulta livre',

    // -- Homepage: Stat --
    'stat.text': 'dos su\u00ed\u00e7os renunciam a fazer valer os seus direitos por causa do custo.',
    'stat.source': 'sondagem gfs.bern, 2023',

    // -- Results page --
    'result.title': 'Resultado da sua consulta',
    'result.refine_aria': 'Precisar a pesquisa',
    'result.refine_submit': 'Pesquisar novamente',
    'result.your_situation': 'A sua situa\u00e7\u00e3o',
    'result.your_search': 'A sua pesquisa',
    'result.juridical_qualification': 'Qualifica\u00e7\u00e3o jur\u00eddica',
    'result.qualification': 'Qualifica\u00e7\u00e3o',
    'result.articles_title': 'Artigos de lei aplic\u00e1veis',
    'result.jurisprudence_title': 'Jurisprud\u00eancia do Tribunal Federal',
    'result.templates_title': 'Modelos de carta',
    'result.services_title': 'Servi\u00e7os competentes',
    'result.delais_title': 'Prazos a conhecer',
    'result.anti_erreurs_title': 'Erros a evitar',
    'result.lacunes_title': 'O que ainda n\u00e3o sabemos',
    'result.lacune_type_default': 'Informa\u00e7\u00e3o em falta',
    'result.alternatives_title': 'Situa\u00e7\u00f5es semelhantes',
    'result.normative_rules_title': 'Regras jur\u00eddicas aplic\u00e1veis',
    'result.vulg_title': 'Perguntas frequentes dos cidad\u00e3os',
    'result.baremes_title': 'Taxas de refer\u00eancia',
    'result.baremes_label': 'Taxa hipotec\u00e1ria de refer\u00eancia OFL',
    'result.baremes_consequence': 'Base para contestar um aumento de renda (CO 269a). Publicado em {{date}}',
    'result.source_footer': 'Fontes: {{articles}} artigos, {{arrets}} ac\u00f3rd\u00e3os',
    'result.source_rules': '{{count}} regras',
    'result.no_result': 'Nenhum resultado. Verifique a sua descri\u00e7\u00e3o.',
    'result.error_fiche': 'Ficha n\u00e3o encontrada.',
    'result.error_connection': 'Erro de conex\u00e3o.',
    'result.error_no_query': 'Nenhuma pesquisa especificada.',
    'result.back_home': 'Voltar ao in\u00edcio',
    'result.model_letter': 'Modelo de carta',

    // -- Results: Jurisprudence roles --
    'role.favorable': 'Favor\u00e1vel',
    'role.defavorable': 'Desfavor\u00e1vel',
    'role.neutre': 'Neutro',

    // -- Results: Confidence levels --
    'confidence.certain': 'Certo',
    'confidence.probable': 'Prov\u00e1vel',
    'confidence.variable': 'Vari\u00e1vel',
    'confidence.incertain': 'Incerto',

    // -- Results: Tier badges --
    'tier.1': 'LEI',
    'tier.2': 'TF',
    'tier.3': 'PR\u00c1TICA',

    // -- Results: Premium CTA (in-results) --
    'premiumcta_result.title': 'Ir mais longe com a an\u00e1lise premium',
    'premiumcta_result.badge': 'A partir de CHF 0.15',
    'premiumcta_result.intro': 'Esta primeira avalia\u00e7\u00e3o d\u00e1-lhe as bases. A an\u00e1lise premium vai muito mais longe:',
    'premiumcta_result.q_title': 'Perguntas personalizadas',
    'premiumcta_result.q_text': 'A IA faz as perguntas que mudam o diagn\u00f3stico \u2014 n\u00e3o perguntas gen\u00e9ricas',
    'premiumcta_result.arg_title': 'Argumenta\u00e7\u00e3o contradit\u00f3ria',
    'premiumcta_result.arg_text': 'Argumentos a favor E contra a sua posi\u00e7\u00e3o, com artigos de lei e jurisprud\u00eancia',
    'premiumcta_result.cert_title': 'Certificado de cobertura',
    'premiumcta_result.cert_text': 'Verificamos que n\u00e3o falta nada no seu dossier antes de agir',
    'premiumcta_result.letter_title': 'Cartas prontas a enviar',
    'premiumcta_result.letter_text': 'Interpela\u00e7\u00e3o, oposi\u00e7\u00e3o, contesta\u00e7\u00e3o \u2014 em .docx com as suas informa\u00e7\u00f5es',
    'premiumcta_result.button': 'Iniciar a an\u00e1lise premium',

    // -- Results: Upsell --
    'upsell.title': 'Precisa de uma an\u00e1lise personalizada?',
    'upsell.text': 'A nossa IA analisa a sua situa\u00e7\u00e3o em detalhe por CHF 0.03 a 0.10 por pergunta.',
    'upsell.button': 'Espa\u00e7o Premium',

    // -- Common actions --
    'action.analyser': 'Analisar',
    'action.imprimer': 'Imprimir / Guardar PDF',
    'action.imprimer_short': 'Imprimir / PDF',
    'action.copier': 'Copiar',
    'action.copier_texte': 'Copiar o texto',
    'action.copie': 'Copiado!',
    'action.telecharger_docx': 'Descarregar .docx',
    'action.nouvelle_consultation': 'Nova consulta',
    'action.nouvelle_recherche': 'Nova pesquisa',
    'action.afficher': 'Mostrar',
    'action.masquer': 'Ocultar',
    'action.suivant': 'Seguinte',
    'action.precedent': 'Anterior',
    'action.voir_droits': 'Ver os meus direitos',
    'action.site_web': 'Website',
    'action.trouver_avocat': 'Encontrar um advogado',
    'action.activer': 'Ativar',
    'action.affiner': 'Afinar a an\u00e1lise',

    // -- Consultation --
    'consult.title': 'Consulta',
    'consult.question_n': 'Pergunta {{n}} de {{total}}',
    'consult.loading': 'A carregar...',
    'consult.analysis_loading': 'An\u00e1lise em curso',
    'consult.canton_select': '-- Cant\u00e3o --',
    'consult.error': 'Ocorreu um erro.',

    // -- Premium page --
    'premium.eyebrow': 'Espa\u00e7o Premium',
    'premium.title': 'An\u00e1lise jur\u00eddica personalizada',
    'premium.subtitle': 'Intelig\u00eancia artificial ao servi\u00e7o da sua situa\u00e7\u00e3o jur\u00eddica.',
    'premium.offer_title': 'An\u00e1lise jur\u00eddica personalizada por IA',
    'premium.offer_features': 'Perguntas direcionadas, argumenta\u00e7\u00e3o contradit\u00f3ria, certificado de cobertura, cartas prontas a enviar em .docx.',
    'premium.pricing_one_label': 'Um problema',
    'premium.pricing_one_detail': 'Suficiente para 1 dossier simples com an\u00e1lise + carta',
    'premium.pricing_one_btn': 'Carregar CHF 5',
    'premium.pricing_rec_label': 'Recomendado',
    'premium.pricing_rec_detail': 'Cobre 1 a 3 dossiers \u2014 a escolha mais comum',
    'premium.pricing_rec_btn': 'Carregar CHF 10',
    'premium.pricing_complex_label': 'Dossier complexo',
    'premium.pricing_complex_detail': 'Para situa\u00e7\u00f5es multi-\u00e1rea ou que exijam v\u00e1rias cartas',
    'premium.pricing_complex_btn': 'Carregar CHF 20',
    'premium.cost_table_title': 'Custo indicativo por opera\u00e7\u00e3o',
    'premium.cost_simple': 'An\u00e1lise simples',
    'premium.cost_simple_range': 'CHF 0.15 \u2013 0.25',
    'premium.cost_questions': 'An\u00e1lise + perguntas + afinamento',
    'premium.cost_questions_range': 'CHF 0.30 \u2013 0.50',
    'premium.cost_dossier': 'Dossier completo com carta',
    'premium.cost_dossier_range': 'CHF 0.50 \u2013 1.00',
    'premium.cost_complex': 'Dossier complexo (v\u00e1rias \u00e1reas, v\u00e1rias cartas)',
    'premium.cost_complex_range': 'CHF 1.00 \u2013 3.00',
    'premium.cost_letter': 'Carta suplementar (.docx)',
    'premium.cost_letter_range': 'CHF 0.05 \u2013 0.10',
    'premium.cost_note': 'O custo exato \u00e9 apresentado ap\u00f3s cada opera\u00e7\u00e3o. O seu saldo pode ser recarregado a qualquer momento.',
    'premium.code_label': 'Tem um c\u00f3digo de acesso?',
    'premium.code_placeholder': 'Introduza o c\u00f3digo',
    'premium.wallet_label': 'Saldo restante',
    'premium.analyze_title': 'Analisar a sua situa\u00e7\u00e3o',
    'premium.analyze_cost_hint': 'Custo estimado: CHF 0.03 a 0.10 por an\u00e1lise',
    'premium.analyze_placeholder': 'Descreva a sua situa\u00e7\u00e3o jur\u00eddica em detalhe...',
    'premium.analyze_submit': 'Analisar a minha situa\u00e7\u00e3o',
    'premium.upload_label': 'Anexar um documento (PDF, imagem)',
    'premium.upload_change': 'Alterar documento',
    'premium.analysis_label': 'An\u00e1lise',
    'premium.letter_generated': 'Carta gerada',
    'premium.history_title': 'Hist\u00f3rico',
    'premium.history_empty': 'Nenhuma a\u00e7\u00e3o',
    'premium.generate_letter': 'Gerar a carta',
    'premium.print': 'Imprimir',

    // -- Premium: Letter types --
    'letter.mise_en_demeure': 'Interpela\u00e7\u00e3o',
    'letter.contestation': 'Contesta\u00e7\u00e3o',
    'letter.opposition': 'Oposi\u00e7\u00e3o',
    'letter.resiliation': 'Rescis\u00e3o',
    'letter.plainte': 'Queixa-crime',

    // -- Premium: V4 response --
    'v4.questions_title': 'Perguntas para afinar a an\u00e1lise',
    'v4.critique': 'Cr\u00edtico',
    'v4.resume': 'Resumo',
    'v4.arguments_title': 'Argumentos verificados',
    'v4.objections_title': 'Obje\u00e7\u00f5es poss\u00edveis',
    'v4.deadlines_title': 'Prazos cr\u00edticos',
    'v4.fatal_errors_title': 'Erros a evitar absolutamente',
    'v4.action_plan': 'Plano de a\u00e7\u00e3o',
    'v4.certificate_title': 'Certificado de cobertura',
    'v4.certificate_score': 'Pontua\u00e7\u00e3o',
    'v4.lawyer_recommended': 'Recomenda-se um advogado',
    'v4.sources_count': 'An\u00e1lise baseada em {{count}} fontes',
    'v4.cost_receipt': 'Custo desta an\u00e1lise: CHF {{cost}} \u2014 Saldo restante: CHF {{remaining}}',
    'v4.no_result': 'Nenhum resultado. Verifique a sua descri\u00e7\u00e3o.',
    'v4.no_text': 'Nenhum texto para analisar.',
    'v4.refine_loading': 'Afinamento em curso...',

    // -- Premium: Loading messages --
    'loading.sub': 'A an\u00e1lise completa demora 10 a 30 segundos',
    'loading.msg_01': 'Compreens\u00e3o da sua situa\u00e7\u00e3o...',
    'loading.msg_02': 'Identifica\u00e7\u00e3o dos problemas jur\u00eddicos...',
    'loading.msg_03': 'Constru\u00e7\u00e3o do dossier contradit\u00f3rio...',
    'loading.msg_04': 'Pesquisa dos artigos de lei aplic\u00e1veis...',
    'loading.msg_05': 'Consulta da jurisprud\u00eancia do TF...',
    'loading.msg_06': 'An\u00e1lise dos argumentos a favor e contra...',
    'loading.msg_07': 'Verifica\u00e7\u00e3o do certificado de cobertura...',
    'loading.msg_08': 'Avalia\u00e7\u00e3o pelo comit\u00e9 de especialistas...',
    'loading.msg_09': 'Compila\u00e7\u00e3o das regras normativas...',
    'loading.msg_10': 'Identifica\u00e7\u00e3o dos prazos cr\u00edticos...',
    'loading.msg_11': 'Pesquisa dos erros fatais a evitar...',
    'loading.msg_12': 'C\u00e1lculo da faixa de valor...',
    'loading.msg_13': 'Verifica\u00e7\u00e3o das fontes jur\u00eddicas...',
    'loading.msg_14': 'Gera\u00e7\u00e3o das perguntas de acompanhamento...',
    'loading.msg_15': 'Prepara\u00e7\u00e3o da an\u00e1lise completa...',
    'loading.msg_16': 'Cruzamento com as tarifas cantonais...',
    'loading.msg_17': 'Verifica\u00e7\u00e3o da admissibilidade...',
    'loading.msg_18': 'An\u00e1lise das provas a reunir...',
    'loading.msg_19': 'Identifica\u00e7\u00e3o dos contactos competentes...',
    'loading.msg_20': 'Finaliza\u00e7\u00e3o do relat\u00f3rio...',

    // -- Search result loading messages --
    'loading_search.sub': 'Geralmente demora 5 a 15 segundos',
    'loading_search.msg_01': 'Leitura da sua situa\u00e7\u00e3o...',
    'loading_search.msg_02': 'Identifica\u00e7\u00e3o da \u00e1rea jur\u00eddica...',
    'loading_search.msg_03': 'Pesquisa dos artigos de lei aplic\u00e1veis...',
    'loading_search.msg_04': 'Consulta da jurisprud\u00eancia do Tribunal Federal...',
    'loading_search.msg_05': 'Verifica\u00e7\u00e3o dos prazos legais...',
    'loading_search.msg_06': 'An\u00e1lise das condi\u00e7\u00f5es de admissibilidade...',
    'loading_search.msg_07': 'Extra\u00e7\u00e3o dos factos pertinentes...',
    'loading_search.msg_08': 'Cruzamento com as fichas verificadas...',
    'loading_search.msg_09': 'Avalia\u00e7\u00e3o da complexidade jur\u00eddica...',
    'loading_search.msg_10': 'Pesquisa dos servi\u00e7os competentes no seu cant\u00e3o...',
    'loading_search.msg_11': 'Verifica\u00e7\u00e3o dos modelos de carta dispon\u00edveis...',
    'loading_search.msg_12': 'An\u00e1lise dos erros frequentes a evitar...',
    'loading_search.msg_13': 'Consulta das tarifas e taxas de refer\u00eancia...',
    'loading_search.msg_14': 'Compila\u00e7\u00e3o das regras normativas aplic\u00e1veis...',
    'loading_search.msg_15': 'Constru\u00e7\u00e3o do plano de a\u00e7\u00e3o personalizado...',
    'loading_search.msg_16': 'Verifica\u00e7\u00e3o das fontes e refer\u00eancias...',
    'loading_search.msg_17': 'Pesquisa de jurisprud\u00eancia contradit\u00f3ria...',
    'loading_search.msg_18': 'Avalia\u00e7\u00e3o do n\u00edvel de confian\u00e7a...',
    'loading_search.msg_19': 'Identifica\u00e7\u00e3o das lacunas informativas...',
    'loading_search.msg_20': 'Prepara\u00e7\u00e3o do seu dossier...',

    // -- Annuaire page --
    'annuaire.eyebrow': 'Recursos',
    'annuaire.title': 'Diret\u00f3rio de servi\u00e7os jur\u00eddicos',
    'annuaire.subtitle': 'Encontre os servi\u00e7os competentes no seu cant\u00e3o.',
    'annuaire.canton_label': 'Cant\u00e3o',
    'annuaire.canton_select': '-- Escolher um cant\u00e3o --',
    'annuaire.filter_all': 'Todos',
    'annuaire.filter_asloca': 'ASLOCA',
    'annuaire.filter_csp': 'CSP',
    'annuaire.filter_syndicat': 'Sindicato',
    'annuaire.filter_conciliation': 'Concilia\u00e7\u00e3o',
    'annuaire.filter_aide': 'Assist\u00eancia judici\u00e1ria',
    'annuaire.services_count': 'Servi\u00e7os dispon\u00edveis ({{count}})',
    'annuaire.no_services': 'Nenhum servi\u00e7o registado para este cant\u00e3o.',
    'annuaire.no_services_type': 'Nenhum servi\u00e7o deste tipo neste cant\u00e3o.',
    'annuaire.error_load': 'Imposs\u00edvel carregar os servi\u00e7os. Verifique se o servidor est\u00e1 em funcionamento.',

    // -- Methodologie page --
    'methodo.eyebrow': 'Transpar\u00eancia',
    'methodo.title': 'Como funciona o JusticePourtous',

    // -- Errors / alerts --
    'error.payment_create': 'Imposs\u00edvel criar a sess\u00e3o de pagamento',
    'error.payment_connection': 'Erro de conex\u00e3o com o servi\u00e7o de pagamento.',
    'error.payment_cancelled': 'Pagamento cancelado. Pode tentar novamente.',
    'error.payment_processing': 'O pagamento est\u00e1 a ser processado. Recarregue a p\u00e1gina dentro de alguns instantes.',
    'error.charge_failed': 'Erro durante o carregamento. Tente novamente.',
    'error.analysis_failed': 'Erro durante a an\u00e1lise. Tente novamente.',
    'error.refine_failed': 'Erro durante o afinamento.',
    'error.generation_failed': 'Erro durante a gera\u00e7\u00e3o.',
    'error.docx_failed': 'Erro durante a gera\u00e7\u00e3o do documento.',
    'error.download_failed': 'Erro durante o download.',
    'error.file_too_large': 'Ficheiro demasiado grande (m\u00e1x. 10 MB)',
    'error.extraction': 'Extra\u00e7\u00e3o do documento...',
    'error.no_letter': 'Nenhuma carta gerada',

    // -- Language switcher --
    'lang.fr': 'FR',
    'lang.de': 'DE',
    'lang.it': 'IT',
    'lang.en': 'EN',
    'lang.pt': 'PT',
    'lang.switch_label': 'Idioma',
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
 * @param {string} lang - 'fr', 'de', 'it', 'en' or 'pt'
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
 * Returns a <div> with FR | DE | IT | EN | PT buttons. Append it wherever needed (e.g. nav).
 * Active language gets the 'active' class.
 *
 * @returns {HTMLElement}
 */
function createLangSwitcher() {
  var container = document.createElement('div');
  container.className = 'lang-switcher';
  container.setAttribute('role', 'radiogroup');
  container.setAttribute('aria-label', t('lang.switch_label'));

  var langs = ['fr', 'de', 'it', 'en', 'pt'];
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
