/**
 * JusticePourtous — i18n (internationalization)
 * Supports: FR (default), DE (Swiss German), IT (Swiss Italian), EN (English),
 *           PT (Portuguese), AR (Arabic — RTL), TR (Turkish), SQ (Albanian), HR (Serbo-Croatian)
 *
 * Usage:
 *   <script src="/i18n.js"></script>
 *   t('nav.annuaire')           → "Annuaire" / "Verzeichnis"
 *   t('hero.subtitle', {name})  → interpolation with {{name}}
 *   setLang('de')               → switch + reload UI
 *   getLang()                    → 'fr' | 'de' | 'it' | 'en' | 'pt' | 'ar' | 'tr' | 'sq' | 'hr'
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
    'trust.anonymous_title': 'Données minimales',
    'trust.anonymous_text': 'Pas de tracking ni profilage',
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
    'suggested.title': 'Pour aller plus loin',
    'suggested.intro': 'Ces questions peuvent vous aider à approfondir votre situation :',
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
    'upsell.text': 'Notre IA analyse votre situation en détail pour CHF 0.08 à 0.25 par question.',
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

    // -- Feedback --
    'feedback.question': 'Cette réponse vous a été utile ?',
    'feedback.yes': '\ud83d\udc4d Oui',
    'feedback.no': '\ud83d\udc4e Non',
    'feedback.thanks': 'Merci pour votre retour !',

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
    'premium.analyze_cost_hint': 'Coût estimé : CHF 0.08 à 0.25 par analyse',
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
    'lang.ar': 'AR',
    'lang.tr': 'TR',
    'lang.sq': 'SQ',
    'lang.hr': 'HR',
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
    'trust.anonymous_title': 'Minimale Daten',
    'trust.anonymous_text': 'Kein Tracking, kein Profiling',
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
    'suggested.title': 'Weiterführende Fragen',
    'suggested.intro': 'Diese Fragen können Ihnen helfen, Ihre Situation zu vertiefen:',
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
    'upsell.text': 'Unsere KI analysiert Ihre Situation detailliert für CHF 0.08 bis 0.25 pro Frage.',
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

    // -- Feedback --
    'feedback.question': 'War diese Antwort hilfreich?',
    'feedback.yes': '\ud83d\udc4d Ja',
    'feedback.no': '\ud83d\udc4e Nein',
    'feedback.thanks': 'Vielen Dank für Ihr Feedback!',

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
    'premium.analyze_cost_hint': 'Geschätzte Kosten: CHF 0.08 bis 0.25 pro Analyse',
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
    'lang.ar': 'AR',
    'lang.tr': 'TR',
    'lang.sq': 'SQ',
    'lang.hr': 'HR',
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
    'trust.anonymous_title': 'Dati minimi',
    'trust.anonymous_text': 'Nessun tracking né profilazione',
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
    'suggested.title': 'Per approfondire',
    'suggested.intro': 'Queste domande possono aiutarvi ad approfondire la vostra situazione:',
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
    'upsell.text': 'La nostra IA analizza la vostra situazione in dettaglio per CHF 0.08 a 0.25 per domanda.',
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

    // -- Feedback --
    'feedback.question': 'Questa risposta ti è stata utile?',
    'feedback.yes': '\ud83d\udc4d Sì',
    'feedback.no': '\ud83d\udc4e No',
    'feedback.thanks': 'Grazie per il tuo feedback!',

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
    'premium.analyze_cost_hint': 'Costo stimato: CHF 0.08 a 0.25 per analisi',
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
    'lang.ar': 'AR',
    'lang.tr': 'TR',
    'lang.sq': 'SQ',
    'lang.hr': 'HR',
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
    'trust.anonymous_title': 'Minimal data',
    'trust.anonymous_text': 'No tracking or profiling',
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
    'suggested.title': 'Dig deeper',
    'suggested.intro': 'These questions can help you explore your situation further:',
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
    'upsell.text': 'Our AI analyses your situation in detail for CHF 0.08 to 0.25 per question.',
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

    // -- Feedback --
    'feedback.question': 'Was this answer helpful?',
    'feedback.yes': '\ud83d\udc4d Yes',
    'feedback.no': '\ud83d\udc4e No',
    'feedback.thanks': 'Thank you for your feedback!',

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
    'premium.analyze_cost_hint': 'Estimated cost: CHF 0.08 to 0.25 per analysis',
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
    'lang.ar': 'AR',
    'lang.tr': 'TR',
    'lang.sq': 'SQ',
    'lang.hr': 'HR',
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
    'trust.anonymous_title': 'Dados m\u00ednimos',
    'trust.anonymous_text': 'Sem tracking nem perfila\u00e7\u00e3o',
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
    'suggested.title': 'Para ir mais longe',
    'suggested.intro': 'Estas perguntas podem ajud\u00e1-lo a aprofundar a sua situa\u00e7\u00e3o:',
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
    'upsell.text': 'A nossa IA analisa a sua situa\u00e7\u00e3o em detalhe por CHF 0.08 a 0.25 por pergunta.',
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

    // -- Feedback --
    'feedback.question': 'Esta resposta foi útil?',
    'feedback.yes': '\ud83d\udc4d Sim',
    'feedback.no': '\ud83d\udc4e Não',
    'feedback.thanks': 'Obrigado pelo seu feedback!',

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
    'premium.analyze_cost_hint': 'Custo estimado: CHF 0.08 a 0.25 por an\u00e1lise',
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
    'lang.ar': 'AR',
    'lang.tr': 'TR',
    'lang.sq': 'SQ',
    'lang.hr': 'HR',
    'lang.switch_label': 'Idioma',
  },

  // ---------------------------------------------------------------------------
  // Arabic (RTL) — RTL partially implemented via CSS (html[lang="ar"] { direction: rtl })
  // ---------------------------------------------------------------------------
  ar: {
    // -- Navigation --
    'nav.annuaire': '\u062f\u0644\u064a\u0644',
    'nav.methodologie': '\u0627\u0644\u0645\u0646\u0647\u062c\u064a\u0629',
    'nav.premium': '\u0645\u0645\u064a\u0632',
    'nav.accueil': '\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629',
    'nav.nouvelle_recherche': '\u0628\u062d\u062b \u062c\u062f\u064a\u062f',

    // -- Quick exit --
    'quickexit.label': '\u0645\u063a\u0627\u062f\u0631\u0629',
    'quickexit.sublabel': '\u2014 \u062e\u0631\u0648\u062c \u0633\u0631\u064a\u0639',
    'quickexit.title': '\u0645\u063a\u0627\u062f\u0631\u0629 \u0647\u0630\u0627 \u0627\u0644\u0645\u0648\u0642\u0639 \u0628\u0633\u0631\u0639\u0629 \u2014 \u064a\u0639\u064a\u062f \u0627\u0644\u062a\u0648\u062c\u064a\u0647 \u0625\u0644\u0649 MeteoSwiss',

    // -- Disclaimer --
    'disclaimer.title': '\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0639\u0627\u0645\u0629',
    'disclaimer.text': 'JusticePourtous \u0644\u0627 \u064a\u063a\u0646\u064a \u0639\u0646 \u0627\u0644\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0627\u0644\u0634\u062e\u0635\u064a\u0629 \u0645\u0646 \u0645\u062d\u0627\u0645\u064d. \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0645\u0642\u062f\u0645\u0629 \u0644\u0644\u0625\u0631\u0634\u0627\u062f \u0627\u0644\u0639\u0627\u0645 \u0641\u0642\u0637\u060c \u062f\u0648\u0646 \u0636\u0645\u0627\u0646 \u0627\u0644\u0634\u0645\u0648\u0644\u064a\u0629.',
    'disclaimer.text_full': 'JusticePourtous \u0644\u0627 \u064a\u063a\u0646\u064a \u0639\u0646 \u0627\u0644\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0627\u0644\u0634\u062e\u0635\u064a\u0629 \u0645\u0646 \u0645\u062d\u0627\u0645\u064d. \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0645\u0642\u062f\u0645\u0629 \u0644\u0644\u0625\u0631\u0634\u0627\u062f \u0627\u0644\u0639\u0627\u0645 \u0641\u0642\u0637\u060c \u062f\u0648\u0646 \u0636\u0645\u0627\u0646 \u0627\u0644\u0634\u0645\u0648\u0644\u064a\u0629. \u0641\u064a \u062d\u0627\u0644\u0629 \u0627\u0644\u0634\u0643\u060c \u0627\u0633\u062a\u0634\u0631 \u0645\u062e\u062a\u0635\u0651\u0627\u064b \u0641\u064a \u0627\u0644\u0642\u0627\u0646\u0648\u0646.',

    // -- Footer --
    'footer.legal': 'JusticePourtous \u064a\u0642\u062f\u0645 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0639\u0627\u0645\u0629 \u0628\u0646\u0627\u0621\u064b \u0639\u0644\u0649 \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0633\u0648\u064a\u0633\u0631\u064a \u0627\u0644\u0633\u0627\u0631\u064a. \u0647\u0630\u0647 \u0627\u0644\u062e\u062f\u0645\u0629 \u0644\u0627 \u062a\u063a\u0646\u064a \u0639\u0646 \u0627\u0644\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0627\u0644\u0634\u062e\u0635\u064a\u0629.',
    'footer.legal_full': 'JusticePourtous \u064a\u0642\u062f\u0645 \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0639\u0627\u0645\u0629 \u0628\u0646\u0627\u0621\u064b \u0639\u0644\u0649 \u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0633\u0648\u064a\u0633\u0631\u064a \u0627\u0644\u0633\u0627\u0631\u064a. \u0647\u0630\u0647 \u0627\u0644\u062e\u062f\u0645\u0629 \u0644\u0627 \u062a\u063a\u0646\u064a \u0639\u0646 \u0627\u0644\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0627\u0644\u0634\u062e\u0635\u064a\u0629. \u0641\u064a \u062d\u0627\u0644\u0629 \u0627\u0644\u0634\u0643\u060c \u0627\u0633\u062a\u0634\u0631 \u0645\u062e\u062a\u0635\u0651\u0627\u064b \u0641\u064a \u0627\u0644\u0642\u0627\u0646\u0648\u0646.',
    'footer.copy': '\u00a9 2026 JusticePourtous',

    // -- Homepage: Hero --
    'hero.eyebrow': '\u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0633\u0648\u064a\u0633\u0631\u064a \u0627\u0644\u0639\u0645\u0644\u064a',
    'hero.title_line1': '\u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0633\u0648\u064a\u0633\u0631\u064a\u060c',
    'hero.title_accent': '\u0641\u064a \u0645\u062a\u0646\u0627\u0648\u0644 \u0627\u0644\u062c\u0645\u064a\u0639.',
    'hero.subtitle': 'JusticePourtous \u064a\u062d\u062f\u062f \u0648\u0636\u0639\u0643 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u060c \u064a\u062e\u0628\u0631\u0643 \u0628\u0645\u0627 \u064a\u062c\u0628 \u0641\u0639\u0644\u0647\u060c \u0648\u0641\u064a \u0623\u064a \u0645\u0647\u0644\u0629\u060c \u0648\u0625\u0644\u0649 \u0645\u0646 \u062a\u062a\u0648\u062c\u0647 \u2014 \u0645\u062c\u0627\u0646\u0627\u064b \u0648\u0628\u0634\u0643\u0644 \u0645\u062c\u0647\u0648\u0644.',

    // -- Homepage: Process --
    'process.eyebrow': '\u0643\u064a\u0641 \u064a\u0639\u0645\u0644',
    'process.step1_title': '\u0635\u0650\u0641',
    'process.step1_text': '\u0627\u0634\u0631\u062d \u0648\u0636\u0639\u0643 \u0628\u0643\u0644\u0645\u0627\u062a \u0642\u0644\u064a\u0644\u0629\u060c \u0643\u0645\u0627 \u0644\u0648 \u0643\u0646\u062a \u062a\u062a\u062d\u062f\u062b \u0625\u0644\u0649 \u0635\u062f\u064a\u0642.',
    'process.step2_title': '\u0627\u0641\u0647\u0645',
    'process.step2_text': '\u0646\u062d\u062f\u062f \u0648\u0636\u0639\u0643 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u060c \u0627\u0644\u0642\u0648\u0627\u0646\u064a\u0646 \u0627\u0644\u0645\u0639\u0645\u0648\u0644 \u0628\u0647\u0627 \u0648\u0627\u0644\u0627\u062c\u062a\u0647\u0627\u062f\u0627\u062a \u0627\u0644\u0642\u0636\u0627\u0626\u064a\u0629.',
    'process.step3_title': '\u062a\u0635\u0631\u0651\u0641',
    'process.step3_text': '\u0627\u0644\u0645\u0647\u0644\u060c \u0627\u0644\u0648\u062b\u0627\u0626\u0642\u060c \u0627\u0644\u062c\u0647\u0629 \u0627\u0644\u0645\u062e\u062a\u0635\u0629\u060c \u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0648\u062c\u0647\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0627\u0644\u0645\u062c\u0627\u0646\u064a\u0629.',

    // -- Homepage: Domains --
    'domains.eyebrow': '\u062a\u0635\u0641\u062d \u062d\u0633\u0628 \u0627\u0644\u0645\u062c\u0627\u0644 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a',

    // -- Homepage: Search --
    'search.eyebrow': '\u062a\u062d\u0644\u064a\u0644 \u0648\u0636\u0639\u064a',
    'search.subtitle': '\u0635\u0650\u0641 \u0645\u0634\u0643\u0644\u062a\u0643 \u0648\u0633\u064a\u062d\u062f\u062f \u0630\u0643\u0627\u0624\u0646\u0627 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u062d\u0642\u0648\u0642\u0643\u060c \u0627\u0644\u0645\u0647\u0644 \u0648\u0627\u0644\u062e\u0637\u0648\u0627\u062a \u0627\u0644\u0648\u0627\u062c\u0628 \u0627\u062a\u0628\u0627\u0639\u0647\u0627.',
    'search.placeholder': '\u0645\u0627\u0644\u0643 \u0627\u0644\u0639\u0642\u0627\u0631 \u064a\u0631\u0641\u0636 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0643\u0641\u0627\u0644\u0629...',
    'search.aria_label': '\u0635\u0650\u0641 \u0645\u0634\u0643\u0644\u062a\u0643 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629',
    'search.submit': '\u062a\u062d\u0644\u064a\u0644',
    'search.suggestion_caution': '\u0643\u0641\u0627\u0644\u0629 \u063a\u064a\u0631 \u0645\u0633\u062a\u0631\u062f\u0629',
    'search.suggestion_licenciement': '\u0641\u0635\u0644 \u0648\u0645\u0631\u0636',
    'search.suggestion_heures': '\u0633\u0627\u0639\u0627\u062a \u0625\u0636\u0627\u0641\u064a\u0629 \u063a\u064a\u0631 \u0645\u062f\u0641\u0648\u0639\u0629',
    'search.suggestion_commandement': '\u0623\u0645\u0631 \u062f\u0641\u0639',
    'search.suggestion_pension': '\u0646\u0641\u0642\u0629 \u063a\u064a\u0631 \u0645\u062f\u0641\u0648\u0639\u0629',
    'search.fill_caution': '\u0645\u0627\u0644\u0643 \u0627\u0644\u0639\u0642\u0627\u0631 \u064a\u0631\u0641\u0636 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0643\u0641\u0627\u0644\u0629',
    'search.fill_licenciement': '\u0641\u0635\u0644 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u0625\u062c\u0627\u0632\u0629 \u0627\u0644\u0645\u0631\u0636\u064a\u0629',
    'search.fill_heures': '\u0633\u0627\u0639\u0627\u062a \u0625\u0636\u0627\u0641\u064a\u0629 \u063a\u064a\u0631 \u0645\u062f\u0641\u0648\u0639\u0629',
    'search.fill_commandement': '\u062a\u0644\u0642\u064a\u062a \u0623\u0645\u0631 \u062f\u0641\u0639',
    'search.fill_pension': '\u0637\u0644\u064a\u0642\u064a \u0644\u0627 \u064a\u062f\u0641\u0639 \u0627\u0644\u0646\u0641\u0642\u0629',

    // -- Homepage: Premium CTA --
    'premiumcta.title': '\u062a\u062d\u0644\u064a\u0644 \u0645\u0639\u0645\u0651\u0642',
    'premiumcta.text': '\u0630\u0643\u0627\u0624\u0646\u0627 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u064a\u062d\u0644\u0644 \u0645\u0644\u0641\u0643 \u0628\u0639\u0645\u0642: \u062d\u062c\u062c \u0645\u062a\u0636\u0627\u0631\u0628\u0629\u060c \u0634\u0647\u0627\u062f\u0629 \u062a\u063a\u0637\u064a\u0629\u060c \u0625\u0646\u0634\u0627\u0621 \u0631\u0633\u0627\u0626\u0644 \u0648\u0645\u0633\u062a\u0646\u062f\u0627\u062a Word \u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0625\u0631\u0633\u0627\u0644.',
    'premiumcta.button': '\u0627\u0643\u062a\u0634\u0641 \u0627\u0644\u0645\u0645\u064a\u0632',
    'premiumcta.feature1_title': '\u0623\u0633\u0626\u0644\u0629 \u0645\u0648\u062c\u0651\u0647\u0629',
    'premiumcta.feature1_text': '\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u064a\u0637\u0631\u062d \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0635\u062d\u064a\u062d\u0629 \u0644\u062a\u062d\u0633\u064a\u0646 \u0645\u0644\u0641\u0643',
    'premiumcta.feature2_title': '\u062d\u062c\u062c \u0645\u0648\u062b\u0642\u0629',
    'premiumcta.feature2_text': '\u0644\u0635\u0627\u0644\u062d\u0643 \u0648\u0636\u062f\u0643\u060c \u0645\u0639 \u0645\u0635\u0627\u062f\u0631 \u0642\u0627\u0646\u0648\u0646\u064a\u0629',
    'premiumcta.feature3_title': '\u0631\u0633\u0627\u0626\u0644 .docx',
    'premiumcta.feature3_text': '\u0625\u0646\u0630\u0627\u0631\u060c \u0627\u0639\u062a\u0631\u0627\u0636\u060c \u0637\u0639\u0646 \u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u062a\u0648\u0642\u064a\u0639',

    // -- Homepage: Trust band --
    'trust.anonymous_title': '\u0628\u064a\u0627\u0646\u0627\u062a \u0645\u062d\u062f\u0648\u062f\u0629',
    'trust.anonymous_text': '\u0628\u062f\u0648\u0646 \u062a\u062a\u0628\u0639 \u0623\u0648 \u062a\u0648\u0635\u064a\u0641',
    'trust.sources_title': '\u0645\u0635\u0627\u062f\u0631 \u0645\u0648\u062b\u0642\u0629',
    'trust.sources_text': 'Fedlex\u060c \u0627\u062c\u062a\u0647\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u062d\u0643\u0645\u0629 \u0627\u0644\u0641\u062f\u0631\u0627\u0644\u064a\u0629',
    'trust.law_title': '\u0627\u0644\u0642\u0627\u0646\u0648\u0646 \u0627\u0644\u0633\u0648\u064a\u0633\u0631\u064a',
    'trust.law_text': '\u0641\u062f\u0631\u0627\u0644\u064a \u0648\u0643\u0627\u0646\u062a\u0648\u0646\u064a',
    'trust.free_title': '\u0645\u062c\u0627\u0646\u064a',
    'trust.free_text': '\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0645\u0641\u062a\u0648\u062d\u0629',

    // -- Homepage: Stat --
    'stat.text': '\u0645\u0646 \u0627\u0644\u0633\u0648\u064a\u0633\u0631\u064a\u064a\u0646 \u064a\u062a\u062e\u0644\u0648\u0646 \u0639\u0646 \u0627\u0644\u0645\u0637\u0627\u0644\u0628\u0629 \u0628\u062d\u0642\u0648\u0642\u0647\u0645 \u0628\u0633\u0628\u0628 \u0627\u0644\u062a\u0643\u0644\u0641\u0629.',
    'stat.source': '\u0627\u0633\u062a\u0637\u0644\u0627\u0639 gfs.bern\u060c 2023',

    // -- Results page --
    'result.title': '\u0646\u062a\u064a\u062c\u0629 \u0627\u0633\u062a\u0634\u0627\u0631\u062a\u0643',
    'result.refine_aria': '\u062a\u062d\u0633\u064a\u0646 \u0628\u062d\u062b\u0643',
    'result.refine_submit': '\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0628\u062d\u062b',
    'result.your_situation': '\u0648\u0636\u0639\u0643',
    'result.your_search': '\u0628\u062d\u062b\u0643',
    'result.juridical_qualification': '\u0627\u0644\u062a\u0643\u064a\u064a\u0641 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a',
    'result.qualification': '\u0627\u0644\u062a\u0643\u064a\u064a\u0641',
    'result.articles_title': '\u0627\u0644\u0645\u0648\u0627\u062f \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0627\u0644\u0645\u0639\u0645\u0648\u0644 \u0628\u0647\u0627',
    'result.jurisprudence_title': '\u0627\u062c\u062a\u0647\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u062d\u0643\u0645\u0629 \u0627\u0644\u0641\u062f\u0631\u0627\u0644\u064a\u0629',
    'result.templates_title': '\u0646\u0645\u0627\u0630\u062c \u0631\u0633\u0627\u0626\u0644',
    'result.services_title': '\u0627\u0644\u062c\u0647\u0627\u062a \u0627\u0644\u0645\u062e\u062a\u0635\u0629',
    'result.delais_title': '\u0627\u0644\u0645\u0647\u0644 \u0627\u0644\u0648\u0627\u062c\u0628 \u0645\u0639\u0631\u0641\u062a\u0647\u0627',
    'result.anti_erreurs_title': '\u0623\u062e\u0637\u0627\u0621 \u064a\u062c\u0628 \u062a\u062c\u0646\u0628\u0647\u0627',
    'result.lacunes_title': '\u0645\u0627 \u0644\u0627 \u0646\u0639\u0631\u0641\u0647 \u0628\u0639\u062f',
    'result.lacune_type_default': '\u0645\u0639\u0644\u0648\u0645\u0629 \u0646\u0627\u0642\u0635\u0629',
    'result.alternatives_title': '\u062d\u0627\u0644\u0627\u062a \u0645\u0634\u0627\u0628\u0647\u0629',
    'result.normative_rules_title': '\u0627\u0644\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0627\u0644\u0645\u0639\u0645\u0648\u0644 \u0628\u0647\u0627',
    'result.vulg_title': '\u0623\u0633\u0626\u0644\u0629 \u0634\u0627\u0626\u0639\u0629',
    'result.baremes_title': '\u0645\u0639\u062f\u0644\u0627\u062a \u0645\u0631\u062c\u0639\u064a\u0629',
    'result.baremes_label': '\u0645\u0639\u062f\u0644 \u0627\u0644\u0631\u0647\u0646 \u0627\u0644\u0645\u0631\u062c\u0639\u064a OFL',
    'result.baremes_consequence': '\u0623\u0633\u0627\u0633 \u0644\u0644\u0637\u0639\u0646 \u0641\u064a \u0632\u064a\u0627\u062f\u0629 \u0627\u0644\u0625\u064a\u062c\u0627\u0631 (CO 269a). \u0646\u064f\u0634\u0631 \u0641\u064a {{date}}',
    'result.source_footer': '\u0627\u0644\u0645\u0635\u0627\u062f\u0631: {{articles}} \u0645\u0627\u062f\u0629\u060c {{arrets}} \u0642\u0631\u0627\u0631',
    'result.source_rules': '{{count}} \u0642\u0627\u0639\u062f\u0629',
    'suggested.title': '\u0644\u0644\u062a\u0639\u0645\u0642 \u0623\u0643\u062b\u0631',
    'suggested.intro': '\u0647\u0630\u0647 \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u064a\u0645\u0643\u0646 \u0623\u0646 \u062a\u0633\u0627\u0639\u062f\u0643 \u0641\u064a \u062a\u0639\u0645\u064a\u0642 \u0641\u0647\u0645 \u0648\u0636\u0639\u0643:',
    'result.no_result': '\u0644\u0627 \u0646\u062a\u0627\u0626\u062c. \u062a\u062d\u0642\u0642 \u0645\u0646 \u0648\u0635\u0641\u0643.',
    'result.error_fiche': '\u0627\u0644\u0628\u0637\u0627\u0642\u0629 \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f\u0629.',
    'result.error_connection': '\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0627\u062a\u0635\u0627\u0644.',
    'result.error_no_query': '\u0644\u0645 \u064a\u062a\u0645 \u062a\u062d\u062f\u064a\u062f \u0628\u062d\u062b.',
    'result.back_home': '\u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629',
    'result.model_letter': '\u0646\u0645\u0648\u0630\u062c \u0631\u0633\u0627\u0644\u0629',

    // -- Results: Jurisprudence roles --
    'role.favorable': '\u0645\u0624\u064a\u062f',
    'role.defavorable': '\u063a\u064a\u0631 \u0645\u0624\u064a\u062f',
    'role.neutre': '\u0645\u062d\u0627\u064a\u062f',

    // -- Results: Confidence levels --
    'confidence.certain': '\u0645\u0624\u0643\u062f',
    'confidence.probable': '\u0645\u0631\u062c\u062d',
    'confidence.variable': '\u0645\u062a\u063a\u064a\u0631',
    'confidence.incertain': '\u063a\u064a\u0631 \u0645\u0624\u0643\u062f',

    // -- Results: Tier badges --
    'tier.1': '\u0642\u0627\u0646\u0648\u0646',
    'tier.2': '\u0645.\u0641.',
    'tier.3': '\u0645\u0645\u0627\u0631\u0633\u0629',

    // -- Results: Premium CTA (in-results) --
    'premiumcta_result.title': '\u0627\u0630\u0647\u0628 \u0623\u0628\u0639\u062f \u0645\u0639 \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u0645\u064a\u0632',
    'premiumcta_result.badge': '\u0627\u0628\u062a\u062f\u0627\u0621\u064b \u0645\u0646 CHF 0.15',
    'premiumcta_result.intro': '\u0647\u0630\u0627 \u0627\u0644\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u0623\u0648\u0644\u064a \u064a\u0639\u0637\u064a\u0643 \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0627\u062a. \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u0645\u064a\u0632 \u064a\u0630\u0647\u0628 \u0623\u0628\u0639\u062f \u0628\u0643\u062b\u064a\u0631:',
    'premiumcta_result.q_title': '\u0623\u0633\u0626\u0644\u0629 \u0645\u062e\u0635\u0635\u0629',
    'premiumcta_result.q_text': '\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u064a\u0637\u0631\u062d \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u062a\u064a \u062a\u063a\u064a\u0631 \u0627\u0644\u062a\u0634\u062e\u064a\u0635 \u2014 \u0644\u064a\u0633\u062a \u0623\u0633\u0626\u0644\u0629 \u0639\u0627\u0645\u0629',
    'premiumcta_result.arg_title': '\u062d\u062c\u062c \u0645\u062a\u0636\u0627\u0631\u0628\u0629',
    'premiumcta_result.arg_text': '\u062d\u062c\u062c \u0644\u0635\u0627\u0644\u062d\u0643 \u0648\u0636\u062f\u0643\u060c \u0645\u0639 \u0645\u0648\u0627\u062f \u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0648\u0627\u062c\u062a\u0647\u0627\u062f\u0627\u062a',
    'premiumcta_result.cert_title': '\u0634\u0647\u0627\u062f\u0629 \u062a\u063a\u0637\u064a\u0629',
    'premiumcta_result.cert_text': '\u0646\u062a\u062d\u0642\u0642 \u0623\u0646\u0647 \u0644\u0627 \u064a\u0646\u0642\u0635 \u0634\u064a\u0621 \u0641\u064a \u0645\u0644\u0641\u0643 \u0642\u0628\u0644 \u0627\u0644\u062a\u0635\u0631\u0641',
    'premiumcta_result.letter_title': '\u0631\u0633\u0627\u0626\u0644 \u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0625\u0631\u0633\u0627\u0644',
    'premiumcta_result.letter_text': '\u0625\u0646\u0630\u0627\u0631\u060c \u0627\u0639\u062a\u0631\u0627\u0636\u060c \u0637\u0639\u0646 \u2014 \u0628\u0635\u064a\u063a\u0629 .docx \u0645\u0639 \u0628\u064a\u0627\u0646\u0627\u062a\u0643',
    'premiumcta_result.button': '\u0628\u062f\u0621 \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0645\u0645\u064a\u0632',

    // -- Results: Upsell --
    'upsell.title': '\u0647\u0644 \u062a\u062d\u062a\u0627\u062c \u062a\u062d\u0644\u064a\u0644\u0627\u064b \u0645\u062e\u0635\u0635\u0627\u064b\u061f',
    'upsell.text': '\u0630\u0643\u0627\u0624\u0646\u0627 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u064a\u062d\u0644\u0644 \u0648\u0636\u0639\u0643 \u0628\u0627\u0644\u062a\u0641\u0635\u064a\u0644 \u0645\u0642\u0627\u0628\u0644 CHF 0.08 \u0625\u0644\u0649 0.10 \u0644\u0643\u0644 \u0633\u0624\u0627\u0644.',
    'upsell.button': '\u0627\u0644\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0645\u0645\u064a\u0632\u0629',

    // -- Common actions --
    'action.analyser': '\u062a\u062d\u0644\u064a\u0644',
    'action.imprimer': '\u0637\u0628\u0627\u0639\u0629 / \u062d\u0641\u0638 PDF',
    'action.imprimer_short': '\u0637\u0628\u0627\u0639\u0629 / PDF',
    'action.copier': '\u0646\u0633\u062e',
    'action.copier_texte': '\u0646\u0633\u062e \u0627\u0644\u0646\u0635',
    'action.copie': '\u062a\u0645 \u0627\u0644\u0646\u0633\u062e!',
    'action.telecharger_docx': '\u062a\u062d\u0645\u064a\u0644 .docx',
    'action.nouvelle_consultation': '\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u062c\u062f\u064a\u062f\u0629',
    'action.nouvelle_recherche': '\u0628\u062d\u062b \u062c\u062f\u064a\u062f',
    'action.afficher': '\u0639\u0631\u0636',
    'action.masquer': '\u0625\u062e\u0641\u0627\u0621',
    'action.suivant': '\u0627\u0644\u062a\u0627\u0644\u064a',
    'action.precedent': '\u0627\u0644\u0633\u0627\u0628\u0642',
    'action.voir_droits': '\u0639\u0631\u0636 \u062d\u0642\u0648\u0642\u064a',
    'action.site_web': '\u0645\u0648\u0642\u0639 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
    'action.trouver_avocat': '\u0625\u064a\u062c\u0627\u062f \u0645\u062d\u0627\u0645\u064d',
    'action.activer': '\u062a\u0641\u0639\u064a\u0644',
    'action.affiner': '\u062a\u062d\u0633\u064a\u0646 \u0627\u0644\u062a\u062d\u0644\u064a\u0644',

    // -- Feedback --
    'feedback.question': '\u0647\u0644 \u0643\u0627\u0646\u062a \u0647\u0630\u0647 \u0627\u0644\u0625\u062c\u0627\u0628\u0629 \u0645\u0641\u064a\u062f\u0629\u061f',
    'feedback.yes': '\ud83d\udc4d \u0646\u0639\u0645',
    'feedback.no': '\ud83d\udc4e \u0644\u0627',
    'feedback.thanks': '\u0634\u0643\u0631\u0627 \u0639\u0644\u0649 \u0645\u0644\u0627\u062d\u0638\u0627\u062a\u0643!',

    // -- Consultation --
    'consult.title': '\u0627\u0633\u062a\u0634\u0627\u0631\u0629',
    'consult.question_n': '\u0627\u0644\u0633\u0624\u0627\u0644 {{n}} \u0645\u0646 {{total}}',
    'consult.loading': '\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
    'consult.analysis_loading': '\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u062c\u0627\u0631\u064d',
    'consult.canton_select': '-- \u0643\u0627\u0646\u062a\u0648\u0646 --',
    'consult.error': '\u062d\u062f\u062b \u062e\u0637\u0623.',

    // -- Premium page --
    'premium.eyebrow': '\u0627\u0644\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0645\u0645\u064a\u0632\u0629',
    'premium.title': '\u062a\u062d\u0644\u064a\u0644 \u0642\u0627\u0646\u0648\u0646\u064a \u0645\u062e\u0635\u0635',
    'premium.subtitle': '\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0641\u064a \u062e\u062f\u0645\u0629 \u0648\u0636\u0639\u0643 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a.',
    'premium.offer_title': '\u062a\u062d\u0644\u064a\u0644 \u0642\u0627\u0646\u0648\u0646\u064a \u0645\u062e\u0635\u0635 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a',
    'premium.offer_features': '\u0623\u0633\u0626\u0644\u0629 \u0645\u0648\u062c\u0651\u0647\u0629\u060c \u062d\u062c\u062c \u0645\u062a\u0636\u0627\u0631\u0628\u0629\u060c \u0634\u0647\u0627\u062f\u0629 \u062a\u063a\u0637\u064a\u0629\u060c \u0631\u0633\u0627\u0626\u0644 \u062c\u0627\u0647\u0632\u0629 \u0644\u0644\u0625\u0631\u0633\u0627\u0644 \u0628\u0635\u064a\u063a\u0629 .docx.',
    'premium.pricing_one_label': '\u0645\u0634\u0643\u0644\u0629 \u0648\u0627\u062d\u062f\u0629',
    'premium.pricing_one_detail': '\u0643\u0627\u0641\u064d \u0644\u0645\u0644\u0641 \u0628\u0633\u064a\u0637 \u0648\u0627\u062d\u062f \u0645\u0639 \u062a\u062d\u0644\u064a\u0644 + \u0631\u0633\u0627\u0644\u0629',
    'premium.pricing_one_btn': '\u0634\u062d\u0646 CHF 5',
    'premium.pricing_rec_label': '\u0645\u0648\u0635\u0649 \u0628\u0647',
    'premium.pricing_rec_detail': '\u064a\u063a\u0637\u064a 1 \u0625\u0644\u0649 3 \u0645\u0644\u0641\u0627\u062a \u2014 \u0627\u0644\u062e\u064a\u0627\u0631 \u0627\u0644\u0623\u0643\u062b\u0631 \u0634\u064a\u0648\u0639\u0627\u064b',
    'premium.pricing_rec_btn': '\u0634\u062d\u0646 CHF 10',
    'premium.pricing_complex_label': '\u0645\u0644\u0641 \u0645\u0639\u0642\u062f',
    'premium.pricing_complex_detail': '\u0644\u0644\u062d\u0627\u0644\u0627\u062a \u0645\u062a\u0639\u062f\u062f\u0629 \u0627\u0644\u0645\u062c\u0627\u0644\u0627\u062a \u0623\u0648 \u0627\u0644\u062a\u064a \u062a\u062a\u0637\u0644\u0628 \u0639\u062f\u0629 \u0631\u0633\u0627\u0626\u0644',
    'premium.pricing_complex_btn': '\u0634\u062d\u0646 CHF 20',
    'premium.cost_table_title': '\u0627\u0644\u062a\u0643\u0644\u0641\u0629 \u0627\u0644\u062a\u0642\u062f\u064a\u0631\u064a\u0629 \u0644\u0643\u0644 \u0639\u0645\u0644\u064a\u0629',
    'premium.cost_simple': '\u062a\u062d\u0644\u064a\u0644 \u0628\u0633\u064a\u0637',
    'premium.cost_simple_range': 'CHF 0.15 \u2013 0.25',
    'premium.cost_questions': '\u062a\u062d\u0644\u064a\u0644 + \u0623\u0633\u0626\u0644\u0629 + \u062a\u062d\u0633\u064a\u0646',
    'premium.cost_questions_range': 'CHF 0.30 \u2013 0.50',
    'premium.cost_dossier': '\u0645\u0644\u0641 \u0643\u0627\u0645\u0644 \u0645\u0639 \u0631\u0633\u0627\u0644\u0629',
    'premium.cost_dossier_range': 'CHF 0.50 \u2013 1.00',
    'premium.cost_complex': '\u0645\u0644\u0641 \u0645\u0639\u0642\u062f (\u0639\u062f\u0629 \u0645\u062c\u0627\u0644\u0627\u062a\u060c \u0639\u062f\u0629 \u0631\u0633\u0627\u0626\u0644)',
    'premium.cost_complex_range': 'CHF 1.00 \u2013 3.00',
    'premium.cost_letter': '\u0631\u0633\u0627\u0644\u0629 \u0625\u0636\u0627\u0641\u064a\u0629 (.docx)',
    'premium.cost_letter_range': 'CHF 0.05 \u2013 0.10',
    'premium.cost_note': '\u064a\u062a\u0645 \u0639\u0631\u0636 \u0627\u0644\u062a\u0643\u0644\u0641\u0629 \u0627\u0644\u062f\u0642\u064a\u0642\u0629 \u0628\u0639\u062f \u0643\u0644 \u0639\u0645\u0644\u064a\u0629. \u064a\u0645\u0643\u0646 \u0625\u0639\u0627\u062f\u0629 \u0634\u062d\u0646 \u0631\u0635\u064a\u062f\u0643 \u0641\u064a \u0623\u064a \u0648\u0642\u062a.',
    'premium.code_label': '\u0647\u0644 \u0644\u062f\u064a\u0643 \u0631\u0645\u0632 \u062f\u062e\u0648\u0644\u061f',
    'premium.code_placeholder': '\u0623\u062f\u062e\u0644 \u0627\u0644\u0631\u0645\u0632',
    'premium.wallet_label': '\u0627\u0644\u0631\u0635\u064a\u062f \u0627\u0644\u0645\u062a\u0628\u0642\u064a',
    'premium.analyze_title': '\u062a\u062d\u0644\u064a\u0644 \u0648\u0636\u0639\u0643',
    'premium.analyze_cost_hint': '\u0627\u0644\u062a\u0643\u0644\u0641\u0629 \u0627\u0644\u062a\u0642\u062f\u064a\u0631\u064a\u0629: CHF 0.08 \u0625\u0644\u0649 0.10 \u0644\u0643\u0644 \u062a\u062d\u0644\u064a\u0644',
    'premium.analyze_placeholder': '\u0635\u0650\u0641 \u0648\u0636\u0639\u0643 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a \u0628\u0627\u0644\u062a\u0641\u0635\u064a\u0644...',
    'premium.analyze_submit': '\u062a\u062d\u0644\u064a\u0644 \u0648\u0636\u0639\u064a',
    'premium.upload_label': '\u0625\u0631\u0641\u0627\u0642 \u0645\u0633\u062a\u0646\u062f (PDF\u060c \u0635\u0648\u0631\u0629)',
    'premium.upload_change': '\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0645\u0633\u062a\u0646\u062f',
    'premium.analysis_label': '\u0627\u0644\u062a\u062d\u0644\u064a\u0644',
    'premium.letter_generated': '\u0631\u0633\u0627\u0644\u0629 \u0645\u064f\u0646\u0634\u0623\u0629',
    'premium.history_title': '\u0627\u0644\u0633\u062c\u0644',
    'premium.history_empty': '\u0644\u0627 \u0625\u062c\u0631\u0627\u0621\u0627\u062a',
    'premium.generate_letter': '\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0631\u0633\u0627\u0644\u0629',
    'premium.print': '\u0637\u0628\u0627\u0639\u0629',

    // -- Premium: Letter types --
    'letter.mise_en_demeure': '\u0625\u0646\u0630\u0627\u0631',
    'letter.contestation': '\u0637\u0639\u0646',
    'letter.opposition': '\u0627\u0639\u062a\u0631\u0627\u0636',
    'letter.resiliation': '\u0625\u0646\u0647\u0627\u0621 \u0639\u0642\u062f',
    'letter.plainte': '\u0634\u0643\u0648\u0649 \u062c\u0632\u0627\u0626\u064a\u0629',

    // -- Premium: V4 response --
    'v4.questions_title': '\u0623\u0633\u0626\u0644\u0629 \u0644\u062a\u062d\u0633\u064a\u0646 \u0627\u0644\u062a\u062d\u0644\u064a\u0644',
    'v4.critique': '\u062d\u0631\u062c',
    'v4.resume': '\u0645\u0644\u062e\u0635',
    'v4.arguments_title': '\u062d\u062c\u062c \u0645\u0648\u062b\u0642\u0629',
    'v4.objections_title': '\u0627\u0639\u062a\u0631\u0627\u0636\u0627\u062a \u0645\u062d\u062a\u0645\u0644\u0629',
    'v4.deadlines_title': '\u0645\u0647\u0644 \u062d\u0631\u062c\u0629',
    'v4.fatal_errors_title': '\u0623\u062e\u0637\u0627\u0621 \u064a\u062c\u0628 \u062a\u062c\u0646\u0628\u0647\u0627 \u0645\u0637\u0644\u0642\u0627\u064b',
    'v4.action_plan': '\u062e\u0637\u0629 \u0639\u0645\u0644',
    'v4.certificate_title': '\u0634\u0647\u0627\u062f\u0629 \u062a\u063a\u0637\u064a\u0629',
    'v4.certificate_score': '\u0627\u0644\u062f\u0631\u062c\u0629',
    'v4.lawyer_recommended': '\u064a\u064f\u0646\u0635\u062d \u0628\u0645\u062d\u0627\u0645\u064d',
    'v4.sources_count': '\u062a\u062d\u0644\u064a\u0644 \u0645\u0628\u0646\u064a \u0639\u0644\u0649 {{count}} \u0645\u0635\u062f\u0631',
    'v4.cost_receipt': '\u062a\u0643\u0644\u0641\u0629 \u0647\u0630\u0627 \u0627\u0644\u062a\u062d\u0644\u064a\u0644: CHF {{cost}} \u2014 \u0627\u0644\u0631\u0635\u064a\u062f \u0627\u0644\u0645\u062a\u0628\u0642\u064a: CHF {{remaining}}',
    'v4.no_result': '\u0644\u0627 \u0646\u062a\u0627\u0626\u062c. \u062a\u062d\u0642\u0642 \u0645\u0646 \u0648\u0635\u0641\u0643.',
    'v4.no_text': '\u0644\u0627 \u064a\u0648\u062c\u062f \u0646\u0635 \u0644\u0644\u062a\u062d\u0644\u064a\u0644.',
    'v4.refine_loading': '\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u062d\u0633\u064a\u0646...',

    // -- Premium: Loading messages --
    'loading.sub': '\u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0643\u0627\u0645\u0644 \u064a\u0633\u062a\u063a\u0631\u0642 10 \u0625\u0644\u0649 30 \u062b\u0627\u0646\u064a\u0629',
    'loading.msg_01': '\u0641\u0647\u0645 \u0648\u0636\u0639\u0643...',
    'loading.msg_02': '\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0633\u0627\u0626\u0644 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629...',
    'loading.msg_03': '\u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0645\u062a\u0636\u0627\u0631\u0628...',
    'loading.msg_04': '\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0645\u0648\u0627\u062f \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0627\u0644\u0645\u0639\u0645\u0648\u0644 \u0628\u0647\u0627...',
    'loading.msg_05': '\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0627\u062c\u062a\u0647\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u062d\u0643\u0645\u0629 \u0627\u0644\u0641\u062f\u0631\u0627\u0644\u064a\u0629...',
    'loading.msg_06': '\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u062d\u062c\u062c \u0644\u0635\u0627\u0644\u062d\u0643 \u0648\u0636\u062f\u0643...',
    'loading.msg_07': '\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0634\u0647\u0627\u062f\u0629 \u0627\u0644\u062a\u063a\u0637\u064a\u0629...',
    'loading.msg_08': '\u062a\u0642\u064a\u064a\u0645 \u0644\u062c\u0646\u0629 \u0627\u0644\u062e\u0628\u0631\u0627\u0621...',
    'loading.msg_09': '\u062a\u062c\u0645\u064a\u0639 \u0627\u0644\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0645\u0639\u064a\u0627\u0631\u064a\u0629...',
    'loading.msg_10': '\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0647\u0644 \u0627\u0644\u062d\u0631\u062c\u0629...',
    'loading.msg_11': '\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0623\u062e\u0637\u0627\u0621 \u0627\u0644\u0641\u0627\u062f\u062d\u0629...',
    'loading.msg_12': '\u062d\u0633\u0627\u0628 \u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u0628\u0644\u063a...',
    'loading.msg_13': '\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0645\u0635\u0627\u062f\u0631 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629...',
    'loading.msg_14': '\u0625\u0646\u0634\u0627\u0621 \u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629...',
    'loading.msg_15': '\u062a\u062d\u0636\u064a\u0631 \u0627\u0644\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0643\u0627\u0645\u0644...',
    'loading.msg_16': '\u0645\u0642\u0627\u0631\u0646\u0629 \u0645\u0639 \u0627\u0644\u0645\u0639\u0627\u064a\u064a\u0631 \u0627\u0644\u0643\u0627\u0646\u062a\u0648\u0646\u064a\u0629...',
    'loading.msg_17': '\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0642\u0628\u0648\u0644...',
    'loading.msg_18': '\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0623\u062f\u0644\u0629 \u0627\u0644\u0648\u0627\u062c\u0628 \u062c\u0645\u0639\u0647\u0627...',
    'loading.msg_19': '\u062a\u062d\u062f\u064a\u062f \u062c\u0647\u0627\u062a \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0627\u0644\u0645\u062e\u062a\u0635\u0629...',
    'loading.msg_20': '\u0625\u0646\u0647\u0627\u0621 \u0627\u0644\u062a\u0642\u0631\u064a\u0631...',

    // -- Search result loading messages --
    'loading_search.sub': '\u064a\u0633\u062a\u063a\u0631\u0642 \u0639\u0627\u062f\u0629\u064b 5 \u0625\u0644\u0649 15 \u062b\u0627\u0646\u064a\u0629',
    'loading_search.msg_01': '\u0642\u0631\u0627\u0621\u0629 \u0648\u0636\u0639\u0643...',
    'loading_search.msg_02': '\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u062c\u0627\u0644 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a...',
    'loading_search.msg_03': '\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0645\u0648\u0627\u062f \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629 \u0627\u0644\u0645\u0639\u0645\u0648\u0644 \u0628\u0647\u0627...',
    'loading_search.msg_04': '\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0627\u062c\u062a\u0647\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u062d\u0643\u0645\u0629 \u0627\u0644\u0641\u062f\u0631\u0627\u0644\u064a\u0629...',
    'loading_search.msg_05': '\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0645\u0647\u0644 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629...',
    'loading_search.msg_06': '\u062a\u062d\u0644\u064a\u0644 \u0634\u0631\u0648\u0637 \u0627\u0644\u0642\u0628\u0648\u0644...',
    'loading_search.msg_07': '\u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0627\u0644\u0648\u0642\u0627\u0626\u0639 \u0630\u0627\u062a \u0627\u0644\u0635\u0644\u0629...',
    'loading_search.msg_08': '\u0645\u0642\u0627\u0631\u0646\u0629 \u0645\u0639 \u0627\u0644\u0628\u0637\u0627\u0642\u0627\u062a \u0627\u0644\u0645\u0648\u062b\u0642\u0629...',
    'loading_search.msg_09': '\u062a\u0642\u064a\u064a\u0645 \u0627\u0644\u062a\u0639\u0642\u064a\u062f \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a...',
    'loading_search.msg_10': '\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0645\u062e\u062a\u0635\u0629 \u0641\u064a \u0643\u0627\u0646\u062a\u0648\u0646\u0643...',
    'loading_search.msg_11': '\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0646\u0645\u0627\u0630\u062c \u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0645\u062a\u0648\u0641\u0631\u0629...',
    'loading_search.msg_12': '\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0623\u062e\u0637\u0627\u0621 \u0627\u0644\u0634\u0627\u0626\u0639\u0629...',
    'loading_search.msg_13': '\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0627\u0644\u0645\u0639\u0627\u064a\u064a\u0631 \u0648\u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0645\u0631\u062c\u0639\u064a\u0629...',
    'loading_search.msg_14': '\u062a\u062c\u0645\u064a\u0639 \u0627\u0644\u0642\u0648\u0627\u0639\u062f \u0627\u0644\u0645\u0639\u064a\u0627\u0631\u064a\u0629 \u0627\u0644\u0645\u0639\u0645\u0648\u0644 \u0628\u0647\u0627...',
    'loading_search.msg_15': '\u0628\u0646\u0627\u0621 \u062e\u0637\u0629 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0645\u062e\u0635\u0635\u0629...',
    'loading_search.msg_16': '\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0645\u0635\u0627\u062f\u0631 \u0648\u0627\u0644\u0645\u0631\u0627\u062c\u0639...',
    'loading_search.msg_17': '\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0627\u062c\u062a\u0647\u0627\u062f\u0627\u062a \u0645\u062a\u0639\u0627\u0631\u0636\u0629...',
    'loading_search.msg_18': '\u062a\u0642\u064a\u064a\u0645 \u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u062b\u0642\u0629...',
    'loading_search.msg_19': '\u062a\u062d\u062f\u064a\u062f \u0627\u0644\u062b\u063a\u0631\u0627\u062a \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a\u064a\u0629...',
    'loading_search.msg_20': '\u062a\u062d\u0636\u064a\u0631 \u0645\u0644\u0641\u0643...',

    // -- Annuaire page --
    'annuaire.eyebrow': '\u0645\u0648\u0627\u0631\u062f',
    'annuaire.title': '\u062f\u0644\u064a\u0644 \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629',
    'annuaire.subtitle': '\u0627\u0639\u062b\u0631 \u0639\u0644\u0649 \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0645\u062e\u062a\u0635\u0629 \u0641\u064a \u0643\u0627\u0646\u062a\u0648\u0646\u0643.',
    'annuaire.canton_label': '\u0643\u0627\u0646\u062a\u0648\u0646',
    'annuaire.canton_select': '-- \u0627\u062e\u062a\u0631 \u0643\u0627\u0646\u062a\u0648\u0646 --',
    'annuaire.filter_all': '\u0627\u0644\u0643\u0644',
    'annuaire.filter_asloca': '\u062c\u0645\u0639\u064a\u0629 \u0627\u0644\u0645\u0633\u062a\u0623\u062c\u0631\u064a\u0646',
    'annuaire.filter_csp': 'CSP',
    'annuaire.filter_syndicat': '\u0646\u0642\u0627\u0628\u0629',
    'annuaire.filter_conciliation': '\u0648\u0633\u0627\u0637\u0629',
    'annuaire.filter_aide': '\u0645\u0633\u0627\u0639\u062f\u0629 \u0642\u0636\u0627\u0626\u064a\u0629',
    'annuaire.services_count': '\u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0645\u062a\u0648\u0641\u0631\u0629 ({{count}})',
    'annuaire.no_services': '\u0644\u0627 \u062e\u062f\u0645\u0627\u062a \u0645\u0633\u062c\u0644\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0643\u0627\u0646\u062a\u0648\u0646.',
    'annuaire.no_services_type': '\u0644\u0627 \u062e\u062f\u0645\u0627\u062a \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0646\u0648\u0639 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0643\u0627\u0646\u062a\u0648\u0646.',
    'annuaire.error_load': '\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062e\u062f\u0645\u0627\u062a. \u062a\u062d\u0642\u0642 \u0645\u0646 \u0623\u0646 \u0627\u0644\u062e\u0627\u062f\u0645 \u064a\u0639\u0645\u0644.',

    // -- Methodologie page --
    'methodo.eyebrow': '\u0634\u0641\u0627\u0641\u064a\u0629',
    'methodo.title': '\u0643\u064a\u0641 \u064a\u0639\u0645\u0644 JusticePourtous',

    // -- Errors / alerts --
    'error.payment_create': '\u062a\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u062c\u0644\u0633\u0629 \u0627\u0644\u062f\u0641\u0639',
    'error.payment_connection': '\u062e\u0637\u0623 \u0641\u064a \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u062e\u062f\u0645\u0629 \u0627\u0644\u062f\u0641\u0639.',
    'error.payment_cancelled': '\u062a\u0645 \u0625\u0644\u063a\u0627\u0621 \u0627\u0644\u062f\u0641\u0639. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u062c\u062f\u062f\u0627\u064b.',
    'error.payment_processing': '\u0627\u0644\u062f\u0641\u0639 \u0642\u064a\u062f \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629. \u0623\u0639\u062f \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0635\u0641\u062d\u0629 \u0628\u0639\u062f \u0644\u062d\u0638\u0627\u062a.',
    'error.charge_failed': '\u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u0634\u062d\u0646. \u062d\u0627\u0648\u0644 \u0645\u062c\u062f\u062f\u0627\u064b.',
    'error.analysis_failed': '\u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062a\u062d\u0644\u064a\u0644. \u062d\u0627\u0648\u0644 \u0645\u062c\u062f\u062f\u0627\u064b.',
    'error.refine_failed': '\u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062a\u062d\u0633\u064a\u0646.',
    'error.generation_failed': '\u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u0625\u0646\u0634\u0627\u0621.',
    'error.docx_failed': '\u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0645\u0633\u062a\u0646\u062f.',
    'error.download_failed': '\u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0627\u0644\u062a\u062d\u0645\u064a\u0644.',
    'error.file_too_large': '\u0627\u0644\u0645\u0644\u0641 \u0643\u0628\u064a\u0631 \u062c\u062f\u0627\u064b (\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 10 MB)',
    'error.extraction': '\u0627\u0633\u062a\u062e\u0631\u0627\u062c \u0627\u0644\u0645\u0633\u062a\u0646\u062f...',
    'error.no_letter': '\u0644\u0645 \u064a\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0631\u0633\u0627\u0644\u0629',

    // -- Language switcher --
    'lang.fr': 'FR',
    'lang.de': 'DE',
    'lang.it': 'IT',
    'lang.en': 'EN',
    'lang.pt': 'PT',
    'lang.ar': 'AR',
    'lang.tr': 'TR',
    'lang.sq': 'SQ',
    'lang.hr': 'HR',
    'lang.switch_label': '\u0627\u0644\u0644\u063a\u0629',
    // NOTE: Arabic is RTL. RTL partially implemented via CSS (html[lang="ar"] { direction: rtl }).
  },

  // ---------------------------------------------------------------------------
  // Turkish
  // ---------------------------------------------------------------------------
  tr: {
    // -- Navigation --
    'nav.annuaire': 'Rehber',
    'nav.methodologie': 'Y\u00f6ntem',
    'nav.premium': 'Premium',
    'nav.accueil': 'Ana Sayfa',
    'nav.nouvelle_recherche': 'Yeni arama',

    // -- Quick exit --
    'quickexit.label': '\u00c7\u0131k\u0131\u015f',
    'quickexit.sublabel': '\u2014 h\u0131zl\u0131 \u00e7\u0131k\u0131\u015f',
    'quickexit.title': 'Bu siteyi h\u0131zla terk edin \u2014 MeteoSwiss\'e y\u00f6nlendirilir',

    // -- Disclaimer --
    'disclaimer.title': 'Genel hukuki bilgi',
    'disclaimer.text': 'JusticePourtous, bir avukattan al\u0131nacak ki\u015fisel hukuki dan\u0131\u015fmanl\u0131\u011f\u0131n yerini almaz. Bilgiler yaln\u0131zca genel y\u00f6nlendirme ama\u00e7l\u0131 olup, eksiksizlik garantisi verilmez.',
    'disclaimer.text_full': 'JusticePourtous, bir avukattan al\u0131nacak ki\u015fisel hukuki dan\u0131\u015fmanl\u0131\u011f\u0131n yerini almaz. Bilgiler yaln\u0131zca genel y\u00f6nlendirme ama\u00e7l\u0131 olup, eksiksizlik garantisi verilmez. \u015e\u00fcphe durumunda bir hukuk uzman\u0131na dan\u0131\u015f\u0131n.',

    // -- Footer --
    'footer.legal': 'JusticePourtous, y\u00fcr\u00fcrl\u00fckteki \u0130svi\u00e7re hukukuna dayal\u0131 genel hukuki bilgiler sunar. Bu hizmet ki\u015fisel hukuki dan\u0131\u015fmanl\u0131\u011f\u0131n yerini almaz.',
    'footer.legal_full': 'JusticePourtous, y\u00fcr\u00fcrl\u00fckteki \u0130svi\u00e7re hukukuna dayal\u0131 genel hukuki bilgiler sunar. Bu hizmet ki\u015fisel hukuki dan\u0131\u015fmanl\u0131\u011f\u0131n yerini almaz. \u015e\u00fcphe durumunda bir hukuk uzman\u0131na dan\u0131\u015f\u0131n.',
    'footer.copy': '\u00a9 2026 JusticePourtous',

    // -- Homepage: Hero --
    'hero.eyebrow': 'Pratik \u0130svi\u00e7re hukuku',
    'hero.title_line1': '\u0130svi\u00e7re hukuku,',
    'hero.title_accent': 'herkes i\u00e7in eri\u015filebilir.',
    'hero.subtitle': 'JusticePourtous hukuki durumunuzu belirler, ne yapman\u0131z gerekti\u011fini, hangi s\u00fcrede ve kime ba\u015fvurman\u0131z gerekti\u011fini s\u00f6yler \u2014 \u00fccretsiz ve anonim.',

    // -- Homepage: Process --
    'process.eyebrow': 'Nas\u0131l \u00e7al\u0131\u015f\u0131r',
    'process.step1_title': 'Tan\u0131mlay\u0131n',
    'process.step1_text': 'Durumunuzu birka\u00e7 kelimeyle a\u00e7\u0131klay\u0131n, bir arkada\u015f\u0131n\u0131za anlat\u0131r gibi.',
    'process.step2_title': 'Anlay\u0131n',
    'process.step2_text': 'Hukuki durumunuzu, ge\u00e7erli yasalar\u0131 ve i\u00e7tihatlar\u0131 belirleriz.',
    'process.step3_title': 'Harekete ge\u00e7in',
    'process.step3_text': 'S\u00fcreler, belgeler, yetkili makam, mektup \u015fablonu ve \u00fccretsiz ileti\u015fim bilgileri.',

    // -- Homepage: Domains --
    'domains.eyebrow': 'Hukuk alan\u0131na g\u00f6re g\u00f6zat',

    // -- Homepage: Search --
    'search.eyebrow': 'Durumumu analiz et',
    'search.subtitle': 'Sorununuzu tan\u0131mlay\u0131n, yapay zek\u00e2m\u0131z haklar\u0131n\u0131z\u0131, s\u00fcreleri ve izlenecek ad\u0131mlar\u0131 belirlesin.',
    'search.placeholder': 'Ev sahibim depozitomi iade etmeyi reddediyor...',
    'search.aria_label': 'Hukuki sorununuzu tan\u0131mlay\u0131n',
    'search.submit': 'Analiz et',
    'search.suggestion_caution': '\u0130ade edilmeyen depozito',
    'search.suggestion_licenciement': '\u0130\u015ften \u00e7\u0131karma ve hastal\u0131k',
    'search.suggestion_heures': '\u00d6denmeyen fazla mesai',
    'search.suggestion_commandement': '\u00d6deme emri',
    'search.suggestion_pension': '\u00d6denmeyen nafaka',
    'search.fill_caution': 'ev sahibim depozitomi iade etmeyi reddediyor',
    'search.fill_licenciement': 'hastal\u0131k izni s\u0131ras\u0131nda i\u015ften \u00e7\u0131karma',
    'search.fill_heures': '\u00f6denmeyen fazla mesai',
    'search.fill_commandement': 'bir \u00f6deme emri ald\u0131m',
    'search.fill_pension': 'eski e\u015fim nafaka \u00f6demiyor',

    // -- Homepage: Premium CTA --
    'premiumcta.title': 'Derinlemesine analiz',
    'premiumcta.text': 'Yapay zek\u00e2m\u0131z dosyan\u0131z\u0131 derinlemesine analiz eder: \u00e7eli\u015fkili arg\u00fcmanlar, kapsam sertifikas\u0131, mektup olu\u015fturma ve g\u00f6nderime haz\u0131r Word belgeleri.',
    'premiumcta.button': 'Premium\'u ke\u015ffedin',
    'premiumcta.feature1_title': 'Hedefe y\u00f6nelik sorular',
    'premiumcta.feature1_text': 'Yapay zek\u00e2 dosyan\u0131z\u0131 iyile\u015ftirmek i\u00e7in do\u011fru sorular\u0131 sorar',
    'premiumcta.feature2_title': 'Do\u011frulanm\u0131\u015f arg\u00fcmanlar',
    'premiumcta.feature2_text': 'Lehte ve aleyhte, hukuki kaynaklarla',
    'premiumcta.feature3_title': '.docx mektuplar',
    'premiumcta.feature3_text': '\u0130htar, itiraz, itirazname imzaya haz\u0131r',

    // -- Homepage: Trust band --
    'trust.anonymous_title': 'Minimum veri',
    'trust.anonymous_text': 'Takip veya profilleme yok',
    'trust.sources_title': 'Do\u011frulanm\u0131\u015f kaynaklar',
    'trust.sources_text': 'Fedlex, Federal Mahkeme i\u00e7tihatlar\u0131',
    'trust.law_title': '\u0130svi\u00e7re hukuku',
    'trust.law_text': 'Federal ve kantonal',
    'trust.free_title': '\u00dccretsiz',
    'trust.free_text': 'Serbest dan\u0131\u015fma',

    // -- Homepage: Stat --
    'stat.text': '\u0130svi\u00e7re sakinlerinin maliyet nedeniyle haklar\u0131n\u0131 aramaktan vazge\u00e7ti\u011fi oran.',
    'stat.source': 'gfs.bern anketi, 2023',

    // -- Results page --
    'result.title': 'Dan\u0131\u015fma sonucunuz',
    'result.refine_aria': 'Araman\u0131z\u0131 iyile\u015ftirin',
    'result.refine_submit': 'Tekrar ara',
    'result.your_situation': 'Durumunuz',
    'result.your_search': 'Araman\u0131z',
    'result.juridical_qualification': 'Hukuki nitelendirme',
    'result.qualification': 'Nitelendirme',
    'result.articles_title': 'Uygulanabilir yasa maddeleri',
    'result.jurisprudence_title': 'Federal Mahkeme i\u00e7tihatlar\u0131',
    'result.templates_title': 'Mektup \u015fablonlar\u0131',
    'result.services_title': 'Yetkili hizmetler',
    'result.delais_title': 'Bilinmesi gereken s\u00fcreler',
    'result.anti_erreurs_title': 'Ka\u00e7\u0131n\u0131lmas\u0131 gereken hatalar',
    'result.lacunes_title': 'Hen\u00fcz bilmedi\u011fimiz hususlar',
    'result.lacune_type_default': 'Eksik bilgi',
    'result.alternatives_title': 'Benzer durumlar',
    'result.normative_rules_title': 'Uygulanabilir hukuk kurallar\u0131',
    'result.vulg_title': 'S\u0131k sorulan sorular',
    'result.baremes_title': 'Referans oranlar\u0131',
    'result.baremes_label': 'OFL ipotek referans oran\u0131',
    'result.baremes_consequence': 'Kira art\u0131\u015f\u0131na itiraz i\u00e7in temel (CO 269a). {{date}} tarihinde yay\u0131nland\u0131',
    'result.source_footer': 'Kaynaklar: {{articles}} madde, {{arrets}} karar',
    'result.source_rules': '{{count}} kural',
    'suggested.title': 'Daha fazla bilgi',
    'suggested.intro': 'Bu sorular durumunuzu daha iyi anlaman\u0131za yard\u0131mc\u0131 olabilir:',
    'result.no_result': 'Sonu\u00e7 bulunamad\u0131. A\u00e7\u0131klaman\u0131z\u0131 kontrol edin.',
    'result.error_fiche': 'Bilgi fi\u015fi bulunamad\u0131.',
    'result.error_connection': 'Ba\u011flant\u0131 hatas\u0131.',
    'result.error_no_query': 'Arama belirtilmedi.',
    'result.back_home': 'Ana sayfaya d\u00f6n',
    'result.model_letter': 'Mektup \u015fablonu',

    // -- Results: Jurisprudence roles --
    'role.favorable': 'Lehte',
    'role.defavorable': 'Aleyhte',
    'role.neutre': 'Tarafs\u0131z',

    // -- Results: Confidence levels --
    'confidence.certain': 'Kesin',
    'confidence.probable': 'Muhtemel',
    'confidence.variable': 'De\u011fi\u015fken',
    'confidence.incertain': 'Belirsiz',

    // -- Results: Tier badges --
    'tier.1': 'YASA',
    'tier.2': 'FM',
    'tier.3': 'UYGULAMA',

    // -- Results: Premium CTA (in-results) --
    'premiumcta_result.title': 'Premium analizle daha ileriye gidin',
    'premiumcta_result.badge': 'CHF 0.15\'ten itibaren',
    'premiumcta_result.intro': 'Bu ilk de\u011ferlendirme size temelleri verir. Premium analiz \u00e7ok daha ileriye gider:',
    'premiumcta_result.q_title': 'Ki\u015fisel sorular',
    'premiumcta_result.q_text': 'Yapay zek\u00e2 tan\u0131y\u0131 de\u011fi\u015ftiren sorular\u0131 sorar \u2014 genel sorular de\u011fil',
    'premiumcta_result.arg_title': '\u00c7eli\u015fkili arg\u00fcmanlar',
    'premiumcta_result.arg_text': 'Lehte VE aleyhte arg\u00fcmanlar, yasa maddeleri ve i\u00e7tihatlarla',
    'premiumcta_result.cert_title': 'Kapsam sertifikas\u0131',
    'premiumcta_result.cert_text': 'Harekete ge\u00e7meden \u00f6nce dosyan\u0131zda eksik olmad\u0131\u011f\u0131n\u0131 kontrol ederiz',
    'premiumcta_result.letter_title': 'G\u00f6nderime haz\u0131r mektuplar',
    'premiumcta_result.letter_text': '\u0130htar, itiraz, itirazname \u2014 bilgilerinizle .docx olarak',
    'premiumcta_result.button': 'Premium analizi ba\u015flat',

    // -- Results: Upsell --
    'upsell.title': 'Ki\u015fisel bir analize ihtiyac\u0131n\u0131z var m\u0131?',
    'upsell.text': 'Yapay zek\u00e2m\u0131z durumunuzu soru ba\u015f\u0131na CHF 0.08 ile 0.25 aras\u0131nda ayr\u0131nt\u0131l\u0131 analiz eder.',
    'upsell.button': 'Premium alan',

    // -- Common actions --
    'action.analyser': 'Analiz et',
    'action.imprimer': 'Yazd\u0131r / PDF olarak kaydet',
    'action.imprimer_short': 'Yazd\u0131r / PDF',
    'action.copier': 'Kopyala',
    'action.copier_texte': 'Metni kopyala',
    'action.copie': 'Kopyaland\u0131!',
    'action.telecharger_docx': '.docx indir',
    'action.nouvelle_consultation': 'Yeni dan\u0131\u015fma',
    'action.nouvelle_recherche': 'Yeni arama',
    'action.afficher': 'G\u00f6ster',
    'action.masquer': 'Gizle',
    'action.suivant': 'Sonraki',
    'action.precedent': '\u00d6nceki',
    'action.voir_droits': 'Haklar\u0131m\u0131 g\u00f6r',
    'action.site_web': 'Web sitesi',
    'action.trouver_avocat': 'Avukat bul',
    'action.activer': 'Etkinle\u015ftir',
    'action.affiner': 'Analizi iyile\u015ftir',

    // -- Feedback --
    'feedback.question': 'Bu cevap faydal\u0131 oldu mu?',
    'feedback.yes': '\ud83d\udc4d Evet',
    'feedback.no': '\ud83d\udc4e Hay\u0131r',
    'feedback.thanks': 'Geri bildiriminiz i\u00e7in te\u015fekk\u00fcrler!',

    // -- Consultation --
    'consult.title': 'Dan\u0131\u015fma',
    'consult.question_n': 'Soru {{n}} / {{total}}',
    'consult.loading': 'Y\u00fckleniyor...',
    'consult.analysis_loading': 'Analiz devam ediyor',
    'consult.canton_select': '-- Kanton --',
    'consult.error': 'Bir hata olu\u015ftu.',

    // -- Premium page --
    'premium.eyebrow': 'Premium alan',
    'premium.title': 'Ki\u015fiye \u00f6zel hukuki analiz',
    'premium.subtitle': 'Hukuki durumunuz i\u00e7in yapay zek\u00e2 hizmetinizde.',
    'premium.offer_title': 'Yapay zek\u00e2 ile ki\u015fiye \u00f6zel hukuki analiz',
    'premium.offer_features': 'Hedefe y\u00f6nelik sorular, \u00e7eli\u015fkili arg\u00fcmanlar, kapsam sertifikas\u0131, g\u00f6nderime haz\u0131r .docx mektuplar.',
    'premium.pricing_one_label': 'Bir sorun',
    'premium.pricing_one_detail': 'Analiz + mektup i\u00e7eren 1 basit dosya i\u00e7in yeterli',
    'premium.pricing_one_btn': 'CHF 5 y\u00fckle',
    'premium.pricing_rec_label': '\u00d6nerilen',
    'premium.pricing_rec_detail': '1 ile 3 dosyay\u0131 kapsar \u2014 en yayg\u0131n tercih',
    'premium.pricing_rec_btn': 'CHF 10 y\u00fckle',
    'premium.pricing_complex_label': 'Karma\u015f\u0131k dosya',
    'premium.pricing_complex_detail': '\u00c7oklu alan veya birden fazla mektup gerektiren durumlar i\u00e7in',
    'premium.pricing_complex_btn': 'CHF 20 y\u00fckle',
    'premium.cost_table_title': '\u0130\u015flem ba\u015f\u0131na tahmini maliyet',
    'premium.cost_simple': 'Basit analiz',
    'premium.cost_simple_range': 'CHF 0.15 \u2013 0.25',
    'premium.cost_questions': 'Analiz + sorular + iyile\u015ftirme',
    'premium.cost_questions_range': 'CHF 0.30 \u2013 0.50',
    'premium.cost_dossier': 'Mektuplu tam dosya',
    'premium.cost_dossier_range': 'CHF 0.50 \u2013 1.00',
    'premium.cost_complex': 'Karma\u015f\u0131k dosya (birden fazla alan, birden fazla mektup)',
    'premium.cost_complex_range': 'CHF 1.00 \u2013 3.00',
    'premium.cost_letter': 'Ek mektup (.docx)',
    'premium.cost_letter_range': 'CHF 0.05 \u2013 0.10',
    'premium.cost_note': 'Kesin maliyet her i\u015flemden sonra g\u00f6sterilir. Bakiyeniz istedi\u011finiz zaman y\u00fcklenebilir.',
    'premium.code_label': 'Eri\u015fim kodunuz var m\u0131?',
    'premium.code_placeholder': 'Kodunuzu girin',
    'premium.wallet_label': 'Kalan bakiye',
    'premium.analyze_title': 'Durumunuzu analiz edin',
    'premium.analyze_cost_hint': 'Tahmini maliyet: Analiz ba\u015f\u0131na CHF 0.08 ile 0.25',
    'premium.analyze_placeholder': 'Hukuki durumunuzu ayr\u0131nt\u0131l\u0131 olarak tan\u0131mlay\u0131n...',
    'premium.analyze_submit': 'Durumumu analiz et',
    'premium.upload_label': 'Belge ekleyin (PDF, g\u00f6rsel)',
    'premium.upload_change': 'Belgeyi de\u011fi\u015ftir',
    'premium.analysis_label': 'Analiz',
    'premium.letter_generated': 'Olu\u015fturulan mektup',
    'premium.history_title': 'Ge\u00e7mi\u015f',
    'premium.history_empty': '\u0130\u015flem yok',
    'premium.generate_letter': 'Mektup olu\u015ftur',
    'premium.print': 'Yazd\u0131r',

    // -- Premium: Letter types --
    'letter.mise_en_demeure': '\u0130htar',
    'letter.contestation': '\u0130tirazname',
    'letter.opposition': '\u0130tiraz',
    'letter.resiliation': 'Fesih',
    'letter.plainte': 'Su\u00e7 duyurusu',

    // -- Premium: V4 response --
    'v4.questions_title': 'Analizi iyile\u015ftirmek i\u00e7in sorular',
    'v4.critique': 'Kritik',
    'v4.resume': '\u00d6zet',
    'v4.arguments_title': 'Do\u011frulanm\u0131\u015f arg\u00fcmanlar',
    'v4.objections_title': 'Olas\u0131 itirazlar',
    'v4.deadlines_title': 'Kritik s\u00fcreler',
    'v4.fatal_errors_title': 'Mutlaka ka\u00e7\u0131n\u0131lmas\u0131 gereken hatalar',
    'v4.action_plan': 'Eylem plan\u0131',
    'v4.certificate_title': 'Kapsam sertifikas\u0131',
    'v4.certificate_score': 'Puan',
    'v4.lawyer_recommended': 'Avukat \u00f6nerilir',
    'v4.sources_count': '{{count}} kayna\u011fa dayal\u0131 analiz',
    'v4.cost_receipt': 'Bu analizin maliyeti: CHF {{cost}} \u2014 Kalan bakiye: CHF {{remaining}}',
    'v4.no_result': 'Sonu\u00e7 yok. A\u00e7\u0131klaman\u0131z\u0131 kontrol edin.',
    'v4.no_text': 'Analiz edilecek metin yok.',
    'v4.refine_loading': '\u0130yile\u015ftirme devam ediyor...',

    // -- Premium: Loading messages --
    'loading.sub': 'Tam analiz 10 ile 30 saniye s\u00fcrer',
    'loading.msg_01': 'Durumunuz anla\u015f\u0131l\u0131yor...',
    'loading.msg_02': 'Hukuki sorunlar belirleniyor...',
    'loading.msg_03': '\u00c7eli\u015fkili dosya olu\u015fturuluyor...',
    'loading.msg_04': 'Uygulanabilir yasa maddeleri aran\u0131yor...',
    'loading.msg_05': 'Federal Mahkeme i\u00e7tihatlar\u0131na dan\u0131\u015f\u0131l\u0131yor...',
    'loading.msg_06': 'Lehte ve aleyhte arg\u00fcmanlar analiz ediliyor...',
    'loading.msg_07': 'Kapsam sertifikas\u0131 kontrol ediliyor...',
    'loading.msg_08': 'Uzman komitesi de\u011ferlendirmesi...',
    'loading.msg_09': 'Normatif kurallar derleniyor...',
    'loading.msg_10': 'Kritik s\u00fcreler belirleniyor...',
    'loading.msg_11': '\u00d6l\u00fcmc\u00fcl hatalar aran\u0131yor...',
    'loading.msg_12': 'Tutar aral\u0131\u011f\u0131 hesaplan\u0131yor...',
    'loading.msg_13': 'Hukuki kaynaklar do\u011frulan\u0131yor...',
    'loading.msg_14': 'Takip sorular\u0131 olu\u015fturuluyor...',
    'loading.msg_15': 'Tam analiz haz\u0131rlan\u0131yor...',
    'loading.msg_16': 'Kantonal \u00f6l\u00e7\u00fctlerle kar\u015f\u0131la\u015ft\u0131r\u0131l\u0131yor...',
    'loading.msg_17': 'Kabul edilebilirlik kontrol ediliyor...',
    'loading.msg_18': 'Toplanacak kan\u0131tlar analiz ediliyor...',
    'loading.msg_19': 'Yetkili ileti\u015fim noktalar\u0131 belirleniyor...',
    'loading.msg_20': 'Rapor tamamlan\u0131yor...',

    // -- Search result loading messages --
    'loading_search.sub': 'Bu genellikle 5 ile 15 saniye s\u00fcrer',
    'loading_search.msg_01': 'Durumunuz okunuyor...',
    'loading_search.msg_02': 'Hukuk alan\u0131 belirleniyor...',
    'loading_search.msg_03': 'Uygulanabilir yasa maddeleri aran\u0131yor...',
    'loading_search.msg_04': 'Federal Mahkeme i\u00e7tihatlar\u0131na dan\u0131\u015f\u0131l\u0131yor...',
    'loading_search.msg_05': 'Yasal s\u00fcreler kontrol ediliyor...',
    'loading_search.msg_06': 'Kabul ko\u015fullar\u0131 analiz ediliyor...',
    'loading_search.msg_07': '\u0130lgili olgular \u00e7\u0131kar\u0131l\u0131yor...',
    'loading_search.msg_08': 'Do\u011frulanm\u0131\u015f bilgi fi\u015fleriyle kar\u015f\u0131la\u015ft\u0131r\u0131l\u0131yor...',
    'loading_search.msg_09': 'Hukuki karma\u015f\u0131kl\u0131k de\u011ferlendiriliyor...',
    'loading_search.msg_10': 'Kantonunuzdaki yetkili hizmetler aran\u0131yor...',
    'loading_search.msg_11': 'Mevcut mektup \u015fablonlar\u0131 kontrol ediliyor...',
    'loading_search.msg_12': 'Yayg\u0131n hatalar analiz ediliyor...',
    'loading_search.msg_13': '\u00d6l\u00e7\u00fctler ve referans oranlar\u0131na dan\u0131\u015f\u0131l\u0131yor...',
    'loading_search.msg_14': 'Uygulanabilir hukuk kurallar\u0131 derleniyor...',
    'loading_search.msg_15': 'Ki\u015fisel eylem plan\u0131n\u0131z olu\u015fturuluyor...',
    'loading_search.msg_16': 'Kaynaklar ve referanslar do\u011frulan\u0131yor...',
    'loading_search.msg_17': 'Z\u0131t i\u00e7tihatlar aran\u0131yor...',
    'loading_search.msg_18': 'G\u00fcven d\u00fczeyi de\u011ferlendiriliyor...',
    'loading_search.msg_19': 'Bilgi bo\u015fluklar\u0131 belirleniyor...',
    'loading_search.msg_20': 'Dosyan\u0131z haz\u0131rlan\u0131yor...',

    // -- Annuaire page --
    'annuaire.eyebrow': 'Kaynaklar',
    'annuaire.title': 'Hukuki hizmetler rehberi',
    'annuaire.subtitle': 'Kantonunuzdaki yetkili hizmetleri bulun.',
    'annuaire.canton_label': 'Kanton',
    'annuaire.canton_select': '-- Kanton se\u00e7in --',
    'annuaire.filter_all': 'T\u00fcm\u00fc',
    'annuaire.filter_asloca': 'Kirac\u0131 derne\u011fi',
    'annuaire.filter_csp': 'CSP',
    'annuaire.filter_syndicat': 'Sendika',
    'annuaire.filter_conciliation': 'Uzla\u015fma',
    'annuaire.filter_aide': 'Adli yard\u0131m',
    'annuaire.services_count': 'Mevcut hizmetler ({{count}})',
    'annuaire.no_services': 'Bu kanton i\u00e7in kay\u0131tl\u0131 hizmet yok.',
    'annuaire.no_services_type': 'Bu kantonda bu t\u00fcrde hizmet yok.',
    'annuaire.error_load': 'Hizmetler y\u00fcklenemedi. Sunucunun \u00e7al\u0131\u015ft\u0131\u011f\u0131n\u0131 kontrol edin.',

    // -- Methodologie page --
    'methodo.eyebrow': '\u015eeffafl\u0131k',
    'methodo.title': 'JusticePourtous nas\u0131l \u00e7al\u0131\u015f\u0131r',

    // -- Errors / alerts --
    'error.payment_create': '\u00d6deme oturumu olu\u015fturulamad\u0131',
    'error.payment_connection': '\u00d6deme hizmetine ba\u011flant\u0131 hatas\u0131.',
    'error.payment_cancelled': '\u00d6deme iptal edildi. Tekrar deneyebilirsiniz.',
    'error.payment_processing': '\u00d6deme i\u015fleniyor. Birka\u00e7 dakika sonra sayfay\u0131 yenileyin.',
    'error.charge_failed': 'Y\u00fckleme hatas\u0131. Tekrar deneyin.',
    'error.analysis_failed': 'Analiz hatas\u0131. Tekrar deneyin.',
    'error.refine_failed': '\u0130yile\u015ftirme hatas\u0131.',
    'error.generation_failed': 'Olu\u015fturma hatas\u0131.',
    'error.docx_failed': 'Belge olu\u015fturma hatas\u0131.',
    'error.download_failed': '\u0130ndirme hatas\u0131.',
    'error.file_too_large': 'Dosya \u00e7ok b\u00fcy\u00fck (maks. 10 MB)',
    'error.extraction': 'Belge \u00e7\u0131kar\u0131l\u0131yor...',
    'error.no_letter': 'Mektup olu\u015fturulmad\u0131',

    // -- Language switcher --
    'lang.fr': 'FR',
    'lang.de': 'DE',
    'lang.it': 'IT',
    'lang.en': 'EN',
    'lang.pt': 'PT',
    'lang.ar': 'AR',
    'lang.tr': 'TR',
    'lang.sq': 'SQ',
    'lang.hr': 'HR',
    'lang.switch_label': 'Dil',
  },

  // ---------------------------------------------------------------------------
  // Albanian (standard)
  // ---------------------------------------------------------------------------
  sq: {
    // -- Navigation --
    'nav.annuaire': 'Drejtori',
    'nav.methodologie': 'Metodologjia',
    'nav.premium': 'Premium',
    'nav.accueil': 'Faqja kryesore',
    'nav.nouvelle_recherche': 'K\u00ebrkim i ri',

    // -- Quick exit --
    'quickexit.label': 'Dil',
    'quickexit.sublabel': '\u2014 dalje e shpejt\u00eb',
    'quickexit.title': 'Lini k\u00ebt\u00eb faqe shpejt \u2014 ridrejtoheni n\u00eb MeteoSwiss',

    // -- Disclaimer --
    'disclaimer.title': 'Informacion i p\u00ebrgjithsh\u00ebm juridik',
    'disclaimer.text': 'JusticePourtous nuk z\u00ebvend\u00ebson k\u00ebshillimin juridik personal nga nj\u00eb avokat. Informacionet jepen vet\u00ebm p\u00ebr orientim t\u00eb p\u00ebrgjithsh\u00ebm, pa garanci plot\u00ebsie.',
    'disclaimer.text_full': 'JusticePourtous nuk z\u00ebvend\u00ebson k\u00ebshillimin juridik personal nga nj\u00eb avokat. Informacionet jepen vet\u00ebm p\u00ebr orientim t\u00eb p\u00ebrgjithsh\u00ebm, pa garanci plot\u00ebsie. N\u00eb rast dyshimi, konsultohuni me nj\u00eb profesionist t\u00eb s\u00eb drejt\u00ebs.',

    // -- Footer --
    'footer.legal': 'JusticePourtous ofron informacione juridike t\u00eb p\u00ebrgjithshme bazuar n\u00eb t\u00eb drejt\u00ebn zvicerane n\u00eb fuqi. Ky sh\u00ebrbim nuk z\u00ebvend\u00ebson k\u00ebshillimin juridik personal.',
    'footer.legal_full': 'JusticePourtous ofron informacione juridike t\u00eb p\u00ebrgjithshme bazuar n\u00eb t\u00eb drejt\u00ebn zvicerane n\u00eb fuqi. Ky sh\u00ebrbim nuk z\u00ebvend\u00ebson k\u00ebshillimin juridik personal. N\u00eb rast dyshimi, konsultohuni me nj\u00eb profesionist t\u00eb s\u00eb drejt\u00ebs.',
    'footer.copy': '\u00a9 2026 JusticePourtous',

    // -- Homepage: Hero --
    'hero.eyebrow': 'E drejta zvicerane praktike',
    'hero.title_line1': 'E drejta zvicerane,',
    'hero.title_accent': 'e arritshme p\u00ebr t\u00eb gjith\u00eb.',
    'hero.subtitle': 'JusticePourtous identifikon situtat\u00ebn tuaj juridike, ju tregon \u00e7far\u00eb t\u00eb b\u00ebni, brenda cilit afat dhe kujt t\'i drejtoheni \u2014 falas dhe n\u00eb m\u00ebnyr\u00eb anonime.',

    // -- Homepage: Process --
    'process.eyebrow': 'Si funksionon',
    'process.step1_title': 'P\u00ebrshkruani',
    'process.step1_text': 'Shpjegoni situtat\u00ebn tuaj me pak fjal\u00eb, si t\'ia tregonit nj\u00eb shoku.',
    'process.step2_title': 'Kuptoni',
    'process.step2_text': 'Identifikojm\u00eb situtat\u00ebn tuaj juridike, ligjet e zbatueshme dhe jurisprudenc\u00ebn.',
    'process.step3_title': 'Veproni',
    'process.step3_text': 'Afatet, dokumentet, autoriteti kompetent, modeli i letr\u00ebs dhe kontaktet falas.',

    // -- Homepage: Domains --
    'domains.eyebrow': 'Shfletoni sipas fush\u00ebs juridike',

    // -- Homepage: Search --
    'search.eyebrow': 'Analizo situtat\u00ebn time',
    'search.subtitle': 'P\u00ebrshkruani problemin tuaj dhe IA jon\u00eb identifikon t\u00eb drejtat tuaja, afatet dhe hapat q\u00eb duhet ndjekur.',
    'search.placeholder': 'Pronari im refuzon t\u00eb kthej\u00eb kaucionin...',
    'search.aria_label': 'P\u00ebrshkruani problemin tuaj juridik',
    'search.submit': 'Analizo',
    'search.suggestion_caution': 'Kaucion i pakthyer',
    'search.suggestion_licenciement': 'Largim dhe s\u00ebmundje',
    'search.suggestion_heures': 'Or\u00eb shtes\u00eb t\u00eb papaguara',
    'search.suggestion_commandement': 'Urdh\u00ebr pagese',
    'search.suggestion_pension': 'Alimentacion i papaguar',
    'search.fill_caution': 'pronari im refuzon t\u00eb kthej\u00eb kaucionin',
    'search.fill_licenciement': 'largim gjat\u00eb pushimit mjek\u00ebsor',
    'search.fill_heures': 'or\u00eb shtes\u00eb t\u00eb papaguara',
    'search.fill_commandement': 'kam marr\u00eb nj\u00eb urdh\u00ebr pagese',
    'search.fill_pension': 'ish-partneri im nuk paguan alimentacionin',

    // -- Homepage: Premium CTA --
    'premiumcta.title': 'Analiz\u00eb e thelluar',
    'premiumcta.text': 'IA jon\u00eb analizon dosjen tuaj n\u00eb thell\u00ebsi: argumentim kontradiktor, certifikat\u00eb mbulimi, gjenerim letrash dhe dokumente Word gati p\u00ebr d\u00ebrg\u00ebs.',
    'premiumcta.button': 'Zbuloni Premium',
    'premiumcta.feature1_title': 'Pyetje t\u00eb synuara',
    'premiumcta.feature1_text': 'IA b\u00ebn pyetjet e duhura p\u00ebr t\u00eb p\u00ebrmir\u00ebsuar dosjen tuaj',
    'premiumcta.feature2_title': 'Argumente t\u00eb verifikuara',
    'premiumcta.feature2_text': 'P\u00ebr dhe kund\u00ebr, me burime juridike',
    'premiumcta.feature3_title': 'Letra .docx',
    'premiumcta.feature3_text': 'Paralajm\u00ebrim, kund\u00ebrshtim, ankim gati p\u00ebr n\u00ebnshkrim',

    // -- Homepage: Trust band --
    'trust.anonymous_title': 'T\u00eb dh\u00ebna minimale',
    'trust.anonymous_text': 'Pa gjurmim dhe pa profilizim',
    'trust.sources_title': 'Burime t\u00eb verifikuara',
    'trust.sources_text': 'Fedlex, jurisprudenc\u00eb e Gjykat\u00ebs Federale',
    'trust.law_title': 'E drejta zvicerane',
    'trust.law_text': 'Federale dhe kantonale',
    'trust.free_title': 'Falas',
    'trust.free_text': 'Konsultim i lir\u00eb',

    // -- Homepage: Stat --
    'stat.text': 'e banor\u00ebve zviceran\u00eb heqin dor\u00eb nga k\u00ebrkimi i t\u00eb drejtave p\u00ebr shkak t\u00eb kostos.',
    'stat.source': 'sondazhi gfs.bern, 2023',

    // -- Results page --
    'result.title': 'Rezultati i konsultimit tuaj',
    'result.refine_aria': 'P\u00ebrmir\u00ebsoni k\u00ebrkimin tuaj',
    'result.refine_submit': 'K\u00ebrko p\u00ebrs\u00ebri',
    'result.your_situation': 'Situata juaj',
    'result.your_search': 'K\u00ebrkimi juaj',
    'result.juridical_qualification': 'Kualifikimi juridik',
    'result.qualification': 'Kualifikimi',
    'result.articles_title': 'Nenet e ligjit t\u00eb zbatueshme',
    'result.jurisprudence_title': 'Jurisprudenca e Gjykat\u00ebs Federale',
    'result.templates_title': 'Modele letrash',
    'result.services_title': 'Sh\u00ebrbimet kompetente',
    'result.delais_title': 'Afatet q\u00eb duhet ditur',
    'result.anti_erreurs_title': 'Gabime q\u00eb duhen shmangur',
    'result.lacunes_title': '\u00c7far\u00eb nuk dim\u00eb ende',
    'result.lacune_type_default': 'Informacion q\u00eb mungon',
    'result.alternatives_title': 'Situata t\u00eb ngjashme',
    'result.normative_rules_title': 'Rregullat juridike t\u00eb zbatueshme',
    'result.vulg_title': 'Pyetje t\u00eb shpeshta t\u00eb qytetar\u00ebve',
    'result.baremes_title': 'Normat e referenc\u00ebs',
    'result.baremes_label': 'Norma hipotekare e referenc\u00ebs OFL',
    'result.baremes_consequence': 'Baz\u00eb p\u00ebr t\u00eb kund\u00ebrshtuar nj\u00eb rritje qiraje (CO 269a). Publikuar m\u00eb {{date}}',
    'result.source_footer': 'Burimet: {{articles}} nene, {{arrets}} vendime',
    'result.source_rules': '{{count}} rregulla',
    'suggested.title': 'P\u00ebr t\u00eb shkuar m\u00eb thell\u00eb',
    'suggested.intro': 'K\u00ebto pyetje mund t\u2019ju ndihmojn\u00eb t\u00eb thelloni situtat\u00ebn tuaj:',
    'result.no_result': 'Asnj\u00eb rezultat. Kontrolloni p\u00ebrshkrimin tuaj.',
    'result.error_fiche': 'Flet\u00eb informacioni nuk u gjet.',
    'result.error_connection': 'Gabim lidhjeje.',
    'result.error_no_query': 'Asnj\u00eb k\u00ebrkim i specifikuar.',
    'result.back_home': 'Kthehu n\u00eb faqen kryesore',
    'result.model_letter': 'Model letre',

    // -- Results: Jurisprudence roles --
    'role.favorable': 'N\u00eb favor',
    'role.defavorable': 'N\u00eb disfavor',
    'role.neutre': 'Neutral',

    // -- Results: Confidence levels --
    'confidence.certain': 'I sigurt\u00eb',
    'confidence.probable': 'I mundsh\u00ebm',
    'confidence.variable': 'I ndryshuesh\u00ebm',
    'confidence.incertain': 'I pasigurt\u00eb',

    // -- Results: Tier badges --
    'tier.1': 'LIGJ',
    'tier.2': 'GjF',
    'tier.3': 'PRAKTIK\u00cb',

    // -- Results: Premium CTA (in-results) --
    'premiumcta_result.title': 'Shkoni m\u00eb larg me analizin premium',
    'premiumcta_result.badge': 'Nga CHF 0.15',
    'premiumcta_result.intro': 'Ky vler\u00ebsim fillestar ju jep bazat. Analiza premium shkon shum\u00eb m\u00eb larg:',
    'premiumcta_result.q_title': 'Pyetje t\u00eb personalizuara',
    'premiumcta_result.q_text': 'IA b\u00ebn pyetjet q\u00eb ndryshojn\u00eb diagnoz\u00ebn \u2014 jo pyetje t\u00eb p\u00ebrgjithshme',
    'premiumcta_result.arg_title': 'Argumentim kontradiktor',
    'premiumcta_result.arg_text': 'Argumente p\u00ebr DHE kund\u00ebr pozicionit tuaj, me nene ligji dhe jurisprudenc\u00eb',
    'premiumcta_result.cert_title': 'Certifikat\u00eb mbulimi',
    'premiumcta_result.cert_text': 'Kontrollojm\u00eb q\u00eb asgj\u00eb nuk mungon n\u00eb dosjen tuaj para se t\u00eb veproni',
    'premiumcta_result.letter_title': 'Letra gati p\u00ebr d\u00ebrg\u00ebs',
    'premiumcta_result.letter_text': 'Paralajm\u00ebrim, kund\u00ebrshtim, ankim \u2014 n\u00eb .docx me informacionet tuaja',
    'premiumcta_result.button': 'Nis analizin premium',

    // -- Results: Upsell --
    'upsell.title': 'Keni nevoj\u00eb p\u00ebr nj\u00eb analiz\u00eb t\u00eb personalizuar?',
    'upsell.text': 'IA jon\u00eb analizon situtat\u00ebn tuaj n\u00eb detaje p\u00ebr CHF 0.08 deri n\u00eb 0.10 p\u00ebr pyetje.',
    'upsell.button': 'Zona Premium',

    // -- Common actions --
    'action.analyser': 'Analizo',
    'action.imprimer': 'Printo / Ruaj PDF',
    'action.imprimer_short': 'Printo / PDF',
    'action.copier': 'Kopjo',
    'action.copier_texte': 'Kopjo tekstin',
    'action.copie': 'U kopjua!',
    'action.telecharger_docx': 'Shkarko .docx',
    'action.nouvelle_consultation': 'Konsultim i ri',
    'action.nouvelle_recherche': 'K\u00ebrkim i ri',
    'action.afficher': 'Shfaq',
    'action.masquer': 'Fshih',
    'action.suivant': 'Tjet\u00ebr',
    'action.precedent': 'M\u00ebparsh\u00ebm',
    'action.voir_droits': 'Shih t\u00eb drejtat e mia',
    'action.site_web': 'Faqja e internetit',
    'action.trouver_avocat': 'Gjej nj\u00eb avokat',
    'action.activer': 'Aktivizo',
    'action.affiner': 'P\u00ebrmir\u00ebso analizin',

    // -- Feedback --
    'feedback.question': 'A ishte e dobishme kjo p\u00ebrgjigje?',
    'feedback.yes': '\ud83d\udc4d Po',
    'feedback.no': '\ud83d\udc4e Jo',
    'feedback.thanks': 'Faleminderit p\u00ebr mendimin tuaj!',

    // -- Consultation --
    'consult.title': 'Konsultim',
    'consult.question_n': 'Pyetja {{n}} nga {{total}}',
    'consult.loading': 'Duke u ngarkuar...',
    'consult.analysis_loading': 'Analiza n\u00eb vazhdim',
    'consult.canton_select': '-- Kantoni --',
    'consult.error': 'Ndodhi nj\u00eb gabim.',

    // -- Premium page --
    'premium.eyebrow': 'Zona Premium',
    'premium.title': 'Analiz\u00eb juridike e personalizuar',
    'premium.subtitle': 'Inteligjenca artificiale n\u00eb sh\u00ebrbim t\u00eb situtat\u00ebs suaj juridike.',
    'premium.offer_title': 'Analiz\u00eb juridike e personalizuar me IA',
    'premium.offer_features': 'Pyetje t\u00eb synuara, argumentim kontradiktor, certifikat\u00eb mbulimi, letra gati p\u00ebr d\u00ebrg\u00ebs n\u00eb .docx.',
    'premium.pricing_one_label': 'Nj\u00eb problem',
    'premium.pricing_one_detail': 'E mjaftueshme p\u00ebr 1 dosje t\u00eb thjesht\u00eb me analiz\u00eb + let\u00ebr',
    'premium.pricing_one_btn': 'Ngarko CHF 5',
    'premium.pricing_rec_label': 'E rekomanduar',
    'premium.pricing_rec_detail': 'Mbulon 1 deri n\u00eb 3 dosje \u2014 zgjedhja m\u00eb e zakonshme',
    'premium.pricing_rec_btn': 'Ngarko CHF 10',
    'premium.pricing_complex_label': 'Dosje komplekse',
    'premium.pricing_complex_detail': 'P\u00ebr situata me shum\u00eb fusha ose q\u00eb k\u00ebrkojn\u00eb disa letra',
    'premium.pricing_complex_btn': 'Ngarko CHF 20',
    'premium.cost_table_title': 'Kosto orientuese p\u00ebr operacion',
    'premium.cost_simple': 'Analiz\u00eb e thjesht\u00eb',
    'premium.cost_simple_range': 'CHF 0.15 \u2013 0.25',
    'premium.cost_questions': 'Analiz\u00eb + pyetje + p\u00ebrmir\u00ebsim',
    'premium.cost_questions_range': 'CHF 0.30 \u2013 0.50',
    'premium.cost_dossier': 'Dosje e plot\u00eb me let\u00ebr',
    'premium.cost_dossier_range': 'CHF 0.50 \u2013 1.00',
    'premium.cost_complex': 'Dosje komplekse (shum\u00eb fusha, shum\u00eb letra)',
    'premium.cost_complex_range': 'CHF 1.00 \u2013 3.00',
    'premium.cost_letter': 'Let\u00ebr shtes\u00eb (.docx)',
    'premium.cost_letter_range': 'CHF 0.05 \u2013 0.10',
    'premium.cost_note': 'Kostoja e sakt\u00eb tregohet pas \u00e7do operacioni. Balanca juaj mund t\u00eb ringarkkohet n\u00eb \u00e7do koh\u00eb.',
    'premium.code_label': 'Keni nj\u00eb kod aksesi?',
    'premium.code_placeholder': 'Fusni kodin',
    'premium.wallet_label': 'Balanca e mbetur',
    'premium.analyze_title': 'Analizoni situtat\u00ebn tuaj',
    'premium.analyze_cost_hint': 'Kosto e vler\u00ebsuar: CHF 0.08 deri n\u00eb 0.10 p\u00ebr analiz\u00eb',
    'premium.analyze_placeholder': 'P\u00ebrshkruani situtat\u00ebn tuaj juridike n\u00eb detaje...',
    'premium.analyze_submit': 'Analizo situtat\u00ebn time',
    'premium.upload_label': 'Bashk\u00ebngjitni nj\u00eb dokument (PDF, imazh)',
    'premium.upload_change': 'Ndrysho dokumentin',
    'premium.analysis_label': 'Analiza',
    'premium.letter_generated': 'Letra e gjeneruar',
    'premium.history_title': 'Historiku',
    'premium.history_empty': 'Asnj\u00eb veprim',
    'premium.generate_letter': 'Gjeneraani letr\u00ebn',
    'premium.print': 'Printo',

    // -- Premium: Letter types --
    'letter.mise_en_demeure': 'Paralajm\u00ebrim',
    'letter.contestation': 'Ankim',
    'letter.opposition': 'Kund\u00ebrshtim',
    'letter.resiliation': 'Nd\u00ebrprerje',
    'letter.plainte': 'Padi penale',

    // -- Premium: V4 response --
    'v4.questions_title': 'Pyetje p\u00ebr t\u00eb p\u00ebrmir\u00ebsuar analizin',
    'v4.critique': 'Kritike',
    'v4.resume': 'P\u00ebrmbledhje',
    'v4.arguments_title': 'Argumente t\u00eb verifikuara',
    'v4.objections_title': 'Kund\u00ebrshtime t\u00eb mundshme',
    'v4.deadlines_title': 'Afate kritike',
    'v4.fatal_errors_title': 'Gabime q\u00eb duhen shmangur absolutisht',
    'v4.action_plan': 'Plan veprimi',
    'v4.certificate_title': 'Certifikat\u00eb mbulimi',
    'v4.certificate_score': 'Pik\u00ebt',
    'v4.lawyer_recommended': 'Rekomandohet nj\u00eb avokat',
    'v4.sources_count': 'Analiz\u00eb e bazuar n\u00eb {{count}} burime',
    'v4.cost_receipt': 'Kostoja e k\u00ebsaj analize: CHF {{cost}} \u2014 Balanca e mbetur: CHF {{remaining}}',
    'v4.no_result': 'Asnj\u00eb rezultat. Kontrolloni p\u00ebrshkrimin tuaj.',
    'v4.no_text': 'Asnj\u00eb tekst p\u00ebr t\u00eb analizuar.',
    'v4.refine_loading': 'P\u00ebrmir\u00ebsimi n\u00eb vazhdim...',

    // -- Premium: Loading messages --
    'loading.sub': 'Analiza e plot\u00eb merr 10 deri n\u00eb 30 sekonda',
    'loading.msg_01': 'Kuptimi i situtat\u00ebs suaj...',
    'loading.msg_02': 'Identifikimi i \u00e7\u00ebshtjeve juridike...',
    'loading.msg_03': 'Nd\u00ebrtimi i dosjes kontradiktore...',
    'loading.msg_04': 'K\u00ebrkimi i neneve t\u00eb zbatueshme t\u00eb ligjit...',
    'loading.msg_05': 'Konsultimi i jurisprudenc\u00ebs s\u00eb Gjykat\u00ebs Federale...',
    'loading.msg_06': 'Analiza e argumenteve p\u00ebr dhe kund\u00ebr...',
    'loading.msg_07': 'Kontrolli i certifikat\u00ebs s\u00eb mbulimit...',
    'loading.msg_08': 'Vler\u00ebsimi i komitetit t\u00eb ekspert\u00ebve...',
    'loading.msg_09': 'P\u00ebrpilimi i rregullave normative...',
    'loading.msg_10': 'Identifikimi i afateve kritike...',
    'loading.msg_11': 'K\u00ebrkimi i gabimeve fatale...',
    'loading.msg_12': 'Llogaritja e gamm\u00ebs s\u00eb shum\u00ebs...',
    'loading.msg_13': 'Verifikimi i burimeve juridike...',
    'loading.msg_14': 'Gjenerimi i pyetjeve t\u00eb m\u00ebtejshme...',
    'loading.msg_15': 'P\u00ebrgatitja e analiz\u00ebs s\u00eb plot\u00eb...',
    'loading.msg_16': 'Kryq\u00ebzimi me standardet kantonale...',
    'loading.msg_17': 'Kontrolli i pranueshmris\u00eb...',
    'loading.msg_18': 'Analiza e provave p\u00ebr t\'u mbledhur...',
    'loading.msg_19': 'Identifikimi i kontakteve kompetente...',
    'loading.msg_20': 'Finalizimi i raportit...',

    // -- Search result loading messages --
    'loading_search.sub': 'Zakonisht merr 5 deri n\u00eb 15 sekonda',
    'loading_search.msg_01': 'Leximi i situtat\u00ebs suaj...',
    'loading_search.msg_02': 'Identifikimi i fush\u00ebs juridike...',
    'loading_search.msg_03': 'K\u00ebrkimi i neneve t\u00eb zbatueshme t\u00eb ligjit...',
    'loading_search.msg_04': 'Konsultimi i jurisprudenc\u00ebs s\u00eb Gjykat\u00ebs Federale...',
    'loading_search.msg_05': 'Kontrolli i afateve ligjore...',
    'loading_search.msg_06': 'Analiza e kushteve t\u00eb pranueshmris\u00eb...',
    'loading_search.msg_07': 'Nxjerrja e fakteve relevante...',
    'loading_search.msg_08': 'Kryq\u00ebzimi me flet\u00ebt e verifikuara...',
    'loading_search.msg_09': 'Vler\u00ebsimi i kompleksitetit juridik...',
    'loading_search.msg_10': 'K\u00ebrkimi i sh\u00ebrbimeve kompetente n\u00eb kantonin tuaj...',
    'loading_search.msg_11': 'Kontrolli i modeleve t\u00eb letrave t\u00eb disponueshme...',
    'loading_search.msg_12': 'Analiza e gabimeve t\u00eb shpeshta...',
    'loading_search.msg_13': 'Konsultimi i standardeve dhe normave t\u00eb referenc\u00ebs...',
    'loading_search.msg_14': 'P\u00ebrpilimi i rregullave juridike t\u00eb zbatueshme...',
    'loading_search.msg_15': 'Nd\u00ebrtimi i planit tuaj t\u00eb veprimit...',
    'loading_search.msg_16': 'Verifikimi i burimeve dhe referancave...',
    'loading_search.msg_17': 'K\u00ebrkimi i jurisprudenc\u00ebs kund\u00ebrshtuese...',
    'loading_search.msg_18': 'Vler\u00ebsimi i nivelit t\u00eb besueshmris\u00eb...',
    'loading_search.msg_19': 'Identifikimi i boshll\u00ebqeve t\u00eb informacionit...',
    'loading_search.msg_20': 'P\u00ebrgatitja e dosjes suaj...',

    // -- Annuaire page --
    'annuaire.eyebrow': 'Burime',
    'annuaire.title': 'Drejtoria e sh\u00ebrbimeve juridike',
    'annuaire.subtitle': 'Gjeni sh\u00ebrbimet kompetente n\u00eb kantonin tuaj.',
    'annuaire.canton_label': 'Kantoni',
    'annuaire.canton_select': '-- Zgjidhni nj\u00eb kanton --',
    'annuaire.filter_all': 'T\u00eb gjitha',
    'annuaire.filter_asloca': 'Shoqata e qiramarr\u00ebsve',
    'annuaire.filter_csp': 'CSP',
    'annuaire.filter_syndicat': 'Sindikat\u00eb',
    'annuaire.filter_conciliation': 'Paqtim',
    'annuaire.filter_aide': 'Ndihm\u00eb juridike',
    'annuaire.services_count': 'Sh\u00ebrbimet e disponueshme ({{count}})',
    'annuaire.no_services': 'Asnj\u00eb sh\u00ebrbim i regjistruar p\u00ebr k\u00ebt\u00eb kanton.',
    'annuaire.no_services_type': 'Asnj\u00eb sh\u00ebrbim i k\u00ebtij lloji n\u00eb k\u00ebt\u00eb kanton.',
    'annuaire.error_load': 'Nuk mund\u00ebn t\u00eb ngarkohen sh\u00ebrbimet. Kontrolloni q\u00eb serveri \u00ebsht\u00eb duke punuar.',

    // -- Methodologie page --
    'methodo.eyebrow': 'Transparenc\u00eb',
    'methodo.title': 'Si funksionon JusticePourtous',

    // -- Errors / alerts --
    'error.payment_create': 'Nuk mund t\u00eb krijohet sesioni i pages\u00ebs',
    'error.payment_connection': 'Gabim lidhjeje me sh\u00ebrbimin e pages\u00ebs.',
    'error.payment_cancelled': 'Pagesa u anulua. Mund t\u00eb provoni p\u00ebs\u00ebri.',
    'error.payment_processing': 'Pagesa po p\u00ebrpunohet. Ringarkoni faqen pas disa \u00e7asteve.',
    'error.charge_failed': 'Gabim gjat\u00eb ngarkimit. Provoni p\u00ebs\u00ebri.',
    'error.analysis_failed': 'Gabim gjat\u00eb analiz\u00ebs. Provoni p\u00ebs\u00ebri.',
    'error.refine_failed': 'Gabim gjat\u00eb p\u00ebrmir\u00ebsimit.',
    'error.generation_failed': 'Gabim gjat\u00eb gjenerimit.',
    'error.docx_failed': 'Gabim gjat\u00eb gjenerimit t\u00eb dokumentit.',
    'error.download_failed': 'Gabim gjat\u00eb shkarkimit.',
    'error.file_too_large': 'Skedari \u00ebsht\u00eb shum\u00eb i madh (maks. 10 MB)',
    'error.extraction': 'Nxjerrja e dokumentit...',
    'error.no_letter': 'Asnj\u00eb let\u00ebr e gjeneruar',

    // -- Language switcher --
    'lang.fr': 'FR',
    'lang.de': 'DE',
    'lang.it': 'IT',
    'lang.en': 'EN',
    'lang.pt': 'PT',
    'lang.ar': 'AR',
    'lang.tr': 'TR',
    'lang.sq': 'SQ',
    'lang.hr': 'HR',
    'lang.switch_label': 'Gjuha',
  },

  // ---------------------------------------------------------------------------
  // Serbo-Croatian (Latin script)
  // ---------------------------------------------------------------------------
  hr: {
    // -- Navigation --
    'nav.annuaire': 'Imenik',
    'nav.methodologie': 'Metodologija',
    'nav.premium': 'Premium',
    'nav.accueil': 'Po\u010detna',
    'nav.nouvelle_recherche': 'Nova pretraga',

    // -- Quick exit --
    'quickexit.label': 'Iza\u0111i',
    'quickexit.sublabel': '\u2014 brzi izlaz',
    'quickexit.title': 'Brzo napustite ovu stranicu \u2014 preusmjeravanje na MeteoSwiss',

    // -- Disclaimer --
    'disclaimer.title': 'Op\u0107e pravne informacije',
    'disclaimer.text': 'JusticePourtous ne zamjenjuje osobni pravni savjet odvjetnika. Informacije su dane samo u op\u0107e smjernice, bez jamstva potpunosti.',
    'disclaimer.text_full': 'JusticePourtous ne zamjenjuje osobni pravni savjet odvjetnika. Informacije su dane samo u op\u0107e smjernice, bez jamstva potpunosti. U slu\u010daju sumnje, obratite se pravnom stru\u010dnjaku.',

    // -- Footer --
    'footer.legal': 'JusticePourtous pru\u017ea op\u0107e pravne informacije na temelju va\u017ee\u0107eg \u0161vicarskog prava. Ova usluga ne zamjenjuje osobni pravni savjet.',
    'footer.legal_full': 'JusticePourtous pru\u017ea op\u0107e pravne informacije na temelju va\u017ee\u0107eg \u0161vicarskog prava. Ova usluga ne zamjenjuje osobni pravni savjet. U slu\u010daju sumnje, obratite se pravnom stru\u010dnjaku.',
    'footer.copy': '\u00a9 2026 JusticePourtous',

    // -- Homepage: Hero --
    'hero.eyebrow': 'Prakti\u010dno \u0161vicarsko pravo',
    'hero.title_line1': '\u0160vicarsko pravo,',
    'hero.title_accent': 'dostupno svima.',
    'hero.subtitle': 'JusticePourtous identificira va\u0161u pravnu situaciju, ka\u017ee vam \u0161to u\u010diniti, u kojem roku i kome se obratiti \u2014 besplatno i anonimno.',

    // -- Homepage: Process --
    'process.eyebrow': 'Kako funkcionira',
    'process.step1_title': 'Opi\u0161ite',
    'process.step1_text': 'Objasnite svoju situaciju u nekoliko rije\u010di, kao \u0161to biste to rekli prijatelju.',
    'process.step2_title': 'Razumijte',
    'process.step2_text': 'Identificiramo va\u0161u pravnu situaciju, primjenjive zakone i sudsku praksu.',
    'process.step3_title': 'Djelujte',
    'process.step3_text': 'Rokovi, dokumenti, nadle\u017eno tijelo, predlo\u017eak pisma i besplatni kontakti.',

    // -- Homepage: Domains --
    'domains.eyebrow': 'Pregledajte po pravnom podru\u010dju',

    // -- Homepage: Search --
    'search.eyebrow': 'Analiziraj moju situaciju',
    'search.subtitle': 'Opi\u0161ite svoj problem, a na\u0161a AI identificira va\u0161a prava, rokove i korake koje trebate poduzeti.',
    'search.placeholder': 'Moj stanodavac odbija vratiti jamevinu...',
    'search.aria_label': 'Opi\u0161ite svoj pravni problem',
    'search.submit': 'Analiziraj',
    'search.suggestion_caution': 'Nevra\u0107ena jam\u010devina',
    'search.suggestion_licenciement': 'Otkaz i bolest',
    'search.suggestion_heures': 'Nepla\u0107eni prekovremeni rad',
    'search.suggestion_commandement': 'Nalog za pla\u0107anje',
    'search.suggestion_pension': 'Nepla\u0107eno uzdr\u017eavanje',
    'search.fill_caution': 'moj stanodavac odbija vratiti jam\u010devinu',
    'search.fill_licenciement': 'otkaz za vrijeme bolovanja',
    'search.fill_heures': 'nepla\u0107eni prekovremeni rad',
    'search.fill_commandement': 'dobio sam nalog za pla\u0107anje',
    'search.fill_pension': 'moj biv\u0161i partner ne pla\u0107a uzdr\u017eavanje',

    // -- Homepage: Premium CTA --
    'premiumcta.title': 'Dubinska analiza',
    'premiumcta.text': 'Na\u0161a AI analizira va\u0161 dosje u dubinu: protuarumentacija, certifikat pokrivenosti, generiranje pisama i Word dokumenti spremni za slanje.',
    'premiumcta.button': 'Otkrijte Premium',
    'premiumcta.feature1_title': 'Ciljana pitanja',
    'premiumcta.feature1_text': 'AI postavlja prava pitanja za pobolj\u0161anje va\u0161eg dosjea',
    'premiumcta.feature2_title': 'Verificirani argumenti',
    'premiumcta.feature2_text': 'Za i protiv, s pravnim izvorima',
    'premiumcta.feature3_title': 'Pisma .docx',
    'premiumcta.feature3_text': 'Opomena, prigovor, \u017ealba spremni za potpis',

    // -- Homepage: Trust band --
    'trust.anonymous_title': 'Minimalni podaci',
    'trust.anonymous_text': 'Bez pra\u0107enja i profiliranja',
    'trust.sources_title': 'Verificirani izvori',
    'trust.sources_text': 'Fedlex, sudska praksa Saveznog suda',
    'trust.law_title': '\u0160vicarsko pravo',
    'trust.law_text': 'Savezno i kantonalno',
    'trust.free_title': 'Besplatno',
    'trust.free_text': 'Slobodan pristup',

    // -- Homepage: Stat --
    'stat.text': '\u0161vicarskih stanovnika odustaje od ostvarivanja svojih prava zbog tro\u0161kova.',
    'stat.source': 'anketa gfs.bern, 2023',

    // -- Results page --
    'result.title': 'Rezultat va\u0161e konzultacije',
    'result.refine_aria': 'Pobolj\u0161ajte pretragu',
    'result.refine_submit': 'Pretra\u017ei ponovo',
    'result.your_situation': 'Va\u0161a situacija',
    'result.your_search': 'Va\u0161a pretraga',
    'result.juridical_qualification': 'Pravna kvalifikacija',
    'result.qualification': 'Kvalifikacija',
    'result.articles_title': 'Primjenjivi zakonski \u010dlanci',
    'result.jurisprudence_title': 'Sudska praksa Saveznog suda',
    'result.templates_title': 'Predlo\u0161ci pisama',
    'result.services_title': 'Nadle\u017ene slu\u017ebe',
    'result.delais_title': 'Rokovi koje trebate znati',
    'result.anti_erreurs_title': 'Pogre\u0161ke koje treba izbjegavati',
    'result.lacunes_title': '\u0160to jo\u0161 ne znamo',
    'result.lacune_type_default': 'Nedostaju\u0107a informacija',
    'result.alternatives_title': 'Sli\u010dne situacije',
    'result.normative_rules_title': 'Primjenjiva pravna pravila',
    'result.vulg_title': '\u010cesto postavljana pitanja',
    'result.baremes_title': 'Referentne stope',
    'result.baremes_label': 'OFL referentna hipotekarna stopa',
    'result.baremes_consequence': 'Osnova za osporavanje povi\u0161enja najamnine (CO 269a). Objavljeno {{date}}',
    'result.source_footer': 'Izvori: {{articles}} \u010dlanaka, {{arrets}} presuda',
    'result.source_rules': '{{count}} pravila',
    'suggested.title': 'Za dublju analizu',
    'suggested.intro': 'Ova pitanja vam mogu pomo\u0107i da bolje razumijete svoju situaciju:',
    'result.no_result': 'Nema rezultata. Provjerite svoj opis.',
    'result.error_fiche': 'Informativni list nije prona\u0111en.',
    'result.error_connection': 'Gre\u0161ka pri povezivanju.',
    'result.error_no_query': 'Nije navedena pretraga.',
    'result.back_home': 'Natrag na po\u010detnu',
    'result.model_letter': 'Predlo\u017eak pisma',

    // -- Results: Jurisprudence roles --
    'role.favorable': 'Povoljan',
    'role.defavorable': 'Nepovoljan',
    'role.neutre': 'Neutralan',

    // -- Results: Confidence levels --
    'confidence.certain': 'Sigurno',
    'confidence.probable': 'Vjerojatno',
    'confidence.variable': 'Promjenjivo',
    'confidence.incertain': 'Nesigurno',

    // -- Results: Tier badges --
    'tier.1': 'ZAKON',
    'tier.2': 'SS',
    'tier.3': 'PRAKSA',

    // -- Results: Premium CTA (in-results) --
    'premiumcta_result.title': 'Idite dalje s premium analizom',
    'premiumcta_result.badge': 'Od CHF 0.15',
    'premiumcta_result.intro': 'Ova po\u010detna procjena daje vam osnove. Premium analiza ide mnogo dalje:',
    'premiumcta_result.q_title': 'Personalizirana pitanja',
    'premiumcta_result.q_text': 'AI postavlja pitanja koja mijenjaju dijagnozu \u2014 ne op\u0107enita pitanja',
    'premiumcta_result.arg_title': 'Kontradiktorna argumentacija',
    'premiumcta_result.arg_text': 'Argumenti za I protiv va\u0161eg polo\u017eaja, sa zakonskim \u010dlancima i sudskom praksom',
    'premiumcta_result.cert_title': 'Certifikat pokrivenosti',
    'premiumcta_result.cert_text': 'Provjeravamo da ni\u0161ta ne nedostaje u va\u0161em dosjeu prije nego djelujete',
    'premiumcta_result.letter_title': 'Pisma spremna za slanje',
    'premiumcta_result.letter_text': 'Opomena, prigovor, \u017ealba \u2014 kao .docx s va\u0161im podacima',
    'premiumcta_result.button': 'Pokrenite premium analizu',

    // -- Results: Upsell --
    'upsell.title': 'Trebate personaliziranu analizu?',
    'upsell.text': 'Na\u0161a AI analizira va\u0161u situaciju detaljno za CHF 0.08 do 0.25 po pitanju.',
    'upsell.button': 'Premium zona',

    // -- Common actions --
    'action.analyser': 'Analiziraj',
    'action.imprimer': 'Ispi\u0161i / Spremi PDF',
    'action.imprimer_short': 'Ispi\u0161i / PDF',
    'action.copier': 'Kopiraj',
    'action.copier_texte': 'Kopiraj tekst',
    'action.copie': 'Kopirano!',
    'action.telecharger_docx': 'Preuzmi .docx',
    'action.nouvelle_consultation': 'Nova konzultacija',
    'action.nouvelle_recherche': 'Nova pretraga',
    'action.afficher': 'Prika\u017ei',
    'action.masquer': 'Sakrij',
    'action.suivant': 'Sljede\u0107e',
    'action.precedent': 'Prethodno',
    'action.voir_droits': 'Pogledaj moja prava',
    'action.site_web': 'Web stranica',
    'action.trouver_avocat': 'Prona\u0111i odvjetnika',
    'action.activer': 'Aktiviraj',
    'action.affiner': 'Pobolj\u0161aj analizu',

    // -- Feedback --
    'feedback.question': 'Je li vam ovaj odgovor bio koristan?',
    'feedback.yes': '\ud83d\udc4d Da',
    'feedback.no': '\ud83d\udc4e Ne',
    'feedback.thanks': 'Hvala na povratnoj informaciji!',

    // -- Consultation --
    'consult.title': 'Konzultacija',
    'consult.question_n': 'Pitanje {{n}} od {{total}}',
    'consult.loading': 'U\u010ditavanje...',
    'consult.analysis_loading': 'Analiza u tijeku',
    'consult.canton_select': '-- Kanton --',
    'consult.error': 'Do\u0161lo je do pogre\u0161ke.',

    // -- Premium page --
    'premium.eyebrow': 'Premium zona',
    'premium.title': 'Personalizirana pravna analiza',
    'premium.subtitle': 'Umjetna inteligencija u slu\u017ebi va\u0161e pravne situacije.',
    'premium.offer_title': 'Personalizirana pravna analiza putem AI',
    'premium.offer_features': 'Ciljana pitanja, kontradiktorna argumentacija, certifikat pokrivenosti, pisma spremna za slanje u .docx formatu.',
    'premium.pricing_one_label': 'Jedan problem',
    'premium.pricing_one_detail': 'Dovoljno za 1 jednostavan dosje s analizom + pismo',
    'premium.pricing_one_btn': 'Napuni CHF 5',
    'premium.pricing_rec_label': 'Preporu\u010deno',
    'premium.pricing_rec_detail': 'Pokriva 1 do 3 dosjea \u2014 naj\u010de\u0161\u0107i izbor',
    'premium.pricing_rec_btn': 'Napuni CHF 10',
    'premium.pricing_complex_label': 'Slo\u017een dosje',
    'premium.pricing_complex_detail': 'Za situacije s vi\u0161e podru\u010dja ili koje zahtijevaju vi\u0161e pisama',
    'premium.pricing_complex_btn': 'Napuni CHF 20',
    'premium.cost_table_title': 'Okvirna cijena po operaciji',
    'premium.cost_simple': 'Jednostavna analiza',
    'premium.cost_simple_range': 'CHF 0.15 \u2013 0.25',
    'premium.cost_questions': 'Analiza + pitanja + pobolj\u0161anje',
    'premium.cost_questions_range': 'CHF 0.30 \u2013 0.50',
    'premium.cost_dossier': 'Potpun dosje s pismom',
    'premium.cost_dossier_range': 'CHF 0.50 \u2013 1.00',
    'premium.cost_complex': 'Slo\u017een dosje (vi\u0161e podru\u010dja, vi\u0161e pisama)',
    'premium.cost_complex_range': 'CHF 1.00 \u2013 3.00',
    'premium.cost_letter': 'Dodatno pismo (.docx)',
    'premium.cost_letter_range': 'CHF 0.05 \u2013 0.10',
    'premium.cost_note': 'To\u010dna cijena prikazana je nakon svake operacije. Va\u0161 saldo mo\u017eete nadopuniti u bilo kojem trenutku.',
    'premium.code_label': 'Imate pristupni kod?',
    'premium.code_placeholder': 'Unesite kod',
    'premium.wallet_label': 'Preostali saldo',
    'premium.analyze_title': 'Analizirajte svoju situaciju',
    'premium.analyze_cost_hint': 'Procijenjena cijena: CHF 0.08 do 0.25 po analizi',
    'premium.analyze_placeholder': 'Detaljno opi\u0161ite svoju pravnu situaciju...',
    'premium.analyze_submit': 'Analiziraj moju situaciju',
    'premium.upload_label': 'Prilo\u017eite dokument (PDF, sliku)',
    'premium.upload_change': 'Promijeni dokument',
    'premium.analysis_label': 'Analiza',
    'premium.letter_generated': 'Generirano pismo',
    'premium.history_title': 'Povijest',
    'premium.history_empty': 'Nema radnji',
    'premium.generate_letter': 'Generiraj pismo',
    'premium.print': 'Ispi\u0161i',

    // -- Premium: Letter types --
    'letter.mise_en_demeure': 'Opomena',
    'letter.contestation': '\u017dalba',
    'letter.opposition': 'Prigovor',
    'letter.resiliation': 'Raskid',
    'letter.plainte': 'Kaznena prijava',

    // -- Premium: V4 response --
    'v4.questions_title': 'Pitanja za pobolj\u0161anje analize',
    'v4.critique': 'Kriti\u010dno',
    'v4.resume': 'Sa\u017eetak',
    'v4.arguments_title': 'Verificirani argumenti',
    'v4.objections_title': 'Mogu\u0107i prigovori',
    'v4.deadlines_title': 'Kriti\u010dni rokovi',
    'v4.fatal_errors_title': 'Pogre\u0161ke koje svakako treba izbjegavati',
    'v4.action_plan': 'Plan djelovanja',
    'v4.certificate_title': 'Certifikat pokrivenosti',
    'v4.certificate_score': 'Rezultat',
    'v4.lawyer_recommended': 'Preporu\u010duje se odvjetnik',
    'v4.sources_count': 'Analiza temeljena na {{count}} izvora',
    'v4.cost_receipt': 'Cijena ove analize: CHF {{cost}} \u2014 Preostali saldo: CHF {{remaining}}',
    'v4.no_result': 'Nema rezultata. Provjerite svoj opis.',
    'v4.no_text': 'Nema teksta za analizu.',
    'v4.refine_loading': 'Pobolj\u0161anje u tijeku...',

    // -- Premium: Loading messages --
    'loading.sub': 'Potpuna analiza traje 10 do 30 sekundi',
    'loading.msg_01': 'Razumijevanje va\u0161e situacije...',
    'loading.msg_02': 'Identificiranje pravnih pitanja...',
    'loading.msg_03': 'Izgradnja kontradiktornog dosjea...',
    'loading.msg_04': 'Pretra\u017eivanje primjenjivih zakonskih \u010dlanaka...',
    'loading.msg_05': 'Konzultiranje sudske prakse Saveznog suda...',
    'loading.msg_06': 'Analiza argumenata za i protiv...',
    'loading.msg_07': 'Provjera certifikata pokrivenosti...',
    'loading.msg_08': 'Procjena stru\u010dnog odbora...',
    'loading.msg_09': 'Kompilacija normativnih pravila...',
    'loading.msg_10': 'Identificiranje kriti\u010dnih rokova...',
    'loading.msg_11': 'Tra\u017eenje fatalnih pogre\u0161aka...',
    'loading.msg_12': 'Ra\u010dunanje raspona iznosa...',
    'loading.msg_13': 'Provjera pravnih izvora...',
    'loading.msg_14': 'Generiranje dodatnih pitanja...',
    'loading.msg_15': 'Priprema potpune analize...',
    'loading.msg_16': 'Uspore\u0111ivanje s kantonalnim mjerilima...',
    'loading.msg_17': 'Provjera dopu\u0161tenosti...',
    'loading.msg_18': 'Analiza dokaza za prikupljanje...',
    'loading.msg_19': 'Identificiranje nadle\u017enih kontakata...',
    'loading.msg_20': 'Zavr\u0161avanje izvje\u0161\u0107a...',

    // -- Search result loading messages --
    'loading_search.sub': 'Obi\u010dno traje 5 do 15 sekundi',
    'loading_search.msg_01': '\u010citanje va\u0161e situacije...',
    'loading_search.msg_02': 'Identificiranje pravnog podru\u010dja...',
    'loading_search.msg_03': 'Pretra\u017eivanje primjenjivih zakonskih \u010dlanaka...',
    'loading_search.msg_04': 'Konzultiranje sudske prakse Saveznog suda...',
    'loading_search.msg_05': 'Provjera zakonskih rokova...',
    'loading_search.msg_06': 'Analiza uvjeta dopu\u0161tenosti...',
    'loading_search.msg_07': 'Izvla\u010denje relevantnih \u010dinjenica...',
    'loading_search.msg_08': 'Uspore\u0111ivanje s verificiranim informativnim listovima...',
    'loading_search.msg_09': 'Procjena pravne slo\u017eenosti...',
    'loading_search.msg_10': 'Pretra\u017eivanje nadle\u017enih slu\u017ebi u va\u0161em kantonu...',
    'loading_search.msg_11': 'Provjera dostupnih predlo\u017eaka pisama...',
    'loading_search.msg_12': 'Analiza \u010destih pogre\u0161aka...',
    'loading_search.msg_13': 'Konzultiranje mjerila i referentnih stopa...',
    'loading_search.msg_14': 'Kompilacija primjenjivih pravnih pravila...',
    'loading_search.msg_15': 'Izgradnja va\u0161eg personaliziranog plana djelovanja...',
    'loading_search.msg_16': 'Provjera izvora i referenci...',
    'loading_search.msg_17': 'Pretra\u017eivanje suprotne sudske prakse...',
    'loading_search.msg_18': 'Procjena razine povjerenja...',
    'loading_search.msg_19': 'Identificiranje informacijskih praznina...',
    'loading_search.msg_20': 'Priprema va\u0161eg dosjea...',

    // -- Annuaire page --
    'annuaire.eyebrow': 'Resursi',
    'annuaire.title': 'Imenik pravnih usluga',
    'annuaire.subtitle': 'Prona\u0111ite nadle\u017ene slu\u017ebe u va\u0161em kantonu.',
    'annuaire.canton_label': 'Kanton',
    'annuaire.canton_select': '-- Odaberite kanton --',
    'annuaire.filter_all': 'Sve',
    'annuaire.filter_asloca': 'Udruga stanara',
    'annuaire.filter_csp': 'CSP',
    'annuaire.filter_syndicat': 'Sindikat',
    'annuaire.filter_conciliation': 'Mirenje',
    'annuaire.filter_aide': 'Pravna pomo\u0107',
    'annuaire.services_count': 'Dostupne slu\u017ebe ({{count}})',
    'annuaire.no_services': 'Nema registriranih slu\u017ebi za ovaj kanton.',
    'annuaire.no_services_type': 'Nema slu\u017ebi ove vrste u ovom kantonu.',
    'annuaire.error_load': 'Nije mogu\u0107e u\u010ditati slu\u017ebe. Provjerite radi li poslu\u017eitelj.',

    // -- Methodologie page --
    'methodo.eyebrow': 'Transparentnost',
    'methodo.title': 'Kako funkcionira JusticePourtous',

    // -- Errors / alerts --
    'error.payment_create': 'Nije mogu\u0107e stvoriti sesiju pla\u0107anja',
    'error.payment_connection': 'Gre\u0161ka pri povezivanju s uslugom pla\u0107anja.',
    'error.payment_cancelled': 'Pla\u0107anje otkazano. Mo\u017eete poku\u0161ati ponovo.',
    'error.payment_processing': 'Pla\u0107anje se obra\u0111uje. Osvje\u017eite stranicu za nekoliko trenutaka.',
    'error.charge_failed': 'Gre\u0161ka pri punjenju. Poku\u0161ajte ponovo.',
    'error.analysis_failed': 'Gre\u0161ka pri analizi. Poku\u0161ajte ponovo.',
    'error.refine_failed': 'Gre\u0161ka pri pobolj\u0161anju.',
    'error.generation_failed': 'Gre\u0161ka pri generiranju.',
    'error.docx_failed': 'Gre\u0161ka pri generiranju dokumenta.',
    'error.download_failed': 'Gre\u0161ka pri preuzimanju.',
    'error.file_too_large': 'Datoteka prevelika (maks. 10 MB)',
    'error.extraction': 'Izdvajanje dokumenta...',
    'error.no_letter': 'Pismo nije generirano',

    // -- Language switcher --
    'lang.fr': 'FR',
    'lang.de': 'DE',
    'lang.it': 'IT',
    'lang.en': 'EN',
    'lang.pt': 'PT',
    'lang.ar': 'AR',
    'lang.tr': 'TR',
    'lang.sq': 'SQ',
    'lang.hr': 'HR',
    'lang.switch_label': 'Jezik',
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
 * @param {string} lang - 'fr', 'de', 'it', 'en', 'pt', 'ar', 'tr', 'sq' or 'hr'
 */
function setLang(lang) {
  if (!I18N[lang]) return;
  _currentLang = lang;
  try { localStorage.setItem('jb_lang', lang); } catch (e) { /* silent */ }
  // Update html[lang] attribute for CSS selectors (e.g. RTL for Arabic)
  document.documentElement.lang = lang;
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
 * Language metadata. Names shown in the dropdown in their own language.
 * AR is marked as RTL. RTL partially implemented via CSS (html[lang="ar"] { direction: rtl }).
 */
var LANG_META = {
  fr: { label: 'FR', name: 'Fran\u00e7ais' },
  de: { label: 'DE', name: 'Deutsch' },
  it: { label: 'IT', name: 'Italiano' },
  en: { label: 'EN', name: 'English' },
  pt: { label: 'PT', name: 'Portugu\u00eas' },
  ar: { label: 'AR', name: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629', rtl: true },
  tr: { label: 'TR', name: 'T\u00fcrk\u00e7e' },
  sq: { label: 'SQ', name: 'Shqip' },
  hr: { label: 'HR', name: 'Hrvatski' }
};

/**
 * Create a language switcher DOM element.
 * With 9 languages, renders a compact <select> dropdown instead of individual buttons.
 * Each option shows the language code and native name (e.g. "FR — Fran\u00e7ais").
 * Active language is pre-selected.
 *
 * @returns {HTMLElement}
 */
function createLangSwitcher() {
  var container = document.createElement('div');
  container.className = 'lang-switcher';

  var langs = ['fr', 'de', 'it', 'en', 'pt', 'ar', 'tr', 'sq', 'hr'];
  var current = getLang();

  var label = document.createElement('label');
  label.className = 'lang-switcher-label';
  label.setAttribute('for', 'jb-lang-select');
  label.textContent = t('lang.switch_label');
  container.appendChild(label);

  var select = document.createElement('select');
  select.id = 'jb-lang-select';
  select.className = 'lang-select';
  select.setAttribute('aria-label', t('lang.switch_label'));

  langs.forEach(function(lang) {
    var meta = LANG_META[lang] || { label: lang.toUpperCase(), name: lang };
    var option = document.createElement('option');
    option.value = lang;
    option.textContent = meta.label + ' \u2014 ' + meta.name;
    if (lang === current) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', function() {
    setLang(select.value);
    // Reload page to apply translations
    window.location.reload();
  });

  container.appendChild(select);

  return container;
}
