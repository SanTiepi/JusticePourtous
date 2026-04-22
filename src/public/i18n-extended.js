/**
 * i18n-extended — Compléments UI multilingues
 *
 * Ajoute les clés UI manquantes sur les 4 langues supportées (FR/DE/IT/EN) :
 *   - paywall (continuer 2 CHF)
 *   - bouton "Ce cas me dépasse"
 *   - statuts de round (R1, R2, R3, synthèse)
 *   - certificate warnings
 *   - degraded mode banner strings
 *
 * IMPORTANT : ce fichier complète l'interface (chrome) uniquement.
 * Le contenu juridique structuré reste géré par l'orchestrateur de traduction.
 *
 * Doit être chargé APRÈS i18n.js. Augmente la variable globale `I18N`.
 */

(function () {
  'use strict';

  if (typeof I18N === 'undefined' || !I18N) {
    console.warn('[i18n-extended] I18N global non disponible — chargez i18n.js avant');
    return;
  }

  // -------------------------------------------------------------------------
  // FR — clés ajoutées (référence canonique)
  // -------------------------------------------------------------------------

  var FR = {
    // -- Paywall (continuation 2 CHF) --
    'paywall.title': 'Continuer l\'analyse',
    'paywall.price_chf': '2 CHF',
    'paywall.cta_continue': 'Continuer l\'analyse — 2 CHF',
    'paywall.cta_topup': 'Recharger mon portefeuille',
    'paywall.explainer': 'Le premier tour est gratuit. Pour aller plus loin (questions ciblées, plan d\'action, lettres), comptez 2 CHF.',
    'paywall.no_subscription': 'Pas d\'abonnement, paiement à l\'usage.',
    'premium.cost_translation': 'Traduction (3 langues)',
    'premium.login_title': 'Déjà client ?',
    'premium.login_intro': 'Connectez-vous avec votre email pour retrouver votre solde.',
    'premium.login_email_placeholder': 'Votre email',
    'premium.login_send_code': 'Recevoir un code',
    'premium.login_code_placeholder': 'Code à 6 chiffres',
    'premium.login_verify': 'Vérifier',
    'premium.login_resend_code': 'Renvoyer un code',
    'premium.login_email_sent': 'Code envoyé à {{email}}',
    'premium.translate_select': 'Traduire en...',
    'premium.translate_button': 'Traduire (~CHF 0.10)',
    'premium.translate_choose_lang': 'Choisissez une langue.',
    'premium.translate_title': 'Traduction',
    'premium.translate_cost_receipt': 'Coût traduction : <strong>CHF {{cost}}</strong> — Solde : CHF {{remaining}}',
    'premium.payment_processing_title': 'Paiement reçu — activation en cours',
    'premium.payment_processing_text': 'Votre compte premium est en cours d\'activation. Cela prend généralement quelques secondes.',
    'premium.payment_processing_warning': 'Votre paiement a été reçu. L\'activation prend plus de temps que prévu. Rechargez cette page dans quelques instants. Si le problème persiste, contactez-nous.',
    'premium.back_to_premium': 'Retour',

    // -- Over-my-head escape --
    'overmyhead.button': 'Ce cas me dépasse',
    'overmyhead.title': 'Trouver un humain',
    'overmyhead.text': 'On vous redirige vers un service compétent (annuaire gratuit cantonal, association, avocat de garde).',

    // -- Round labels --
    'round.r1': 'R1 — Je comprends votre situation',
    'round.r2': 'R2 — J\'affine les points clés',
    'round.r3': 'R3 — Je valide les détails',
    'round.synthesis': 'Synthèse — Je rédige votre plan d\'action',
    'round.contradiction': 'Analyse — Je consulte lois et jurisprudence',

    // -- Certificate warnings --
    'cert.sufficient': 'Analyse complète — sources vérifiées',
    'cert.limited': 'Analyse fournie avec réserves',
    'cert.insufficient': 'Lacunes importantes — voir détails',
    'cert.warning_label': 'Élément(s) à vérifier',
    'result.caselaw_canon': 'Jurisprudence canonique',
    'result.leading_cases': '📌 Décisions déterminantes',
    'result.nuances': '⚖️ Nuances et contre-cas',
    'result.cantonal_practice': '🏛️ Pratique cantonale',
    'result.similar_cases_count': '{{count}} cas similaires (exploration)',
    'result.median_label': 'médian',
    'result.articles_label': 'Articles',
    'result.source_label': 'Source',
    'result.source_asloca_kit': 'Source : ASLOCA Kit {{number}}',
    'result.source_asloca_ref': 'Source : ASLOCA {{ref}}',
    'result.source_asloca_short': 'ASLOCA Kit',
    'role.leading': 'Clé',
    'role.nuance': 'Nuance',
    'role.cantonal': 'Cantonal',
    'role.similar': 'Comparable',

    // -- Degraded mode banner --
    'degraded.title': 'Mode dégradé',
    'degraded.body_de': 'Votre question était en allemand. Notre analyse juridique est en français (mode dégradé). La terminologie juridique suisse est multilingue mais les fiches détaillées sont actuellement en français.',
    'degraded.body_it': 'Votre question était en italien. Notre analyse juridique est en français (mode dégradé). La terminologie juridique suisse est multilingue mais les fiches détaillées sont actuellement en français.',
    'degraded.action_de': 'Pour une consultation en allemand, consultez le Mieterverband ou unia.ch selon le domaine.',
    'degraded.action_it': 'Per una consulenza in italiano, contatti ASLOCA Ticino o unia.ch secondo l\'ambito.'
  };

  // -------------------------------------------------------------------------
  // DE — Allemand suisse
  // -------------------------------------------------------------------------

  var DE = {
    // Paywall
    'paywall.title': 'Analyse fortsetzen',
    'paywall.price_chf': '2 CHF',
    'paywall.cta_continue': 'Analyse fortsetzen — 2 CHF',
    'paywall.cta_topup': 'Guthaben aufladen',
    'paywall.explainer': 'Die erste Runde ist kostenlos. Für weitere Schritte (gezielte Fragen, Aktionsplan, Briefe) fallen 2 CHF an.',
    'paywall.no_subscription': 'Kein Abonnement, Bezahlung pro Nutzung.',
    'premium.cost_translation': 'Übersetzung (3 Sprachen)',
    'premium.login_title': 'Bereits Kunde?',
    'premium.login_intro': 'Melden Sie sich mit Ihrer E-Mail-Adresse an, um Ihr Guthaben wiederzufinden.',
    'premium.login_email_placeholder': 'Ihre E-Mail',
    'premium.login_send_code': 'Code erhalten',
    'premium.login_code_placeholder': '6-stelliger Code',
    'premium.login_verify': 'Bestätigen',
    'premium.login_resend_code': 'Code erneut senden',
    'premium.login_email_sent': 'Code an {{email}} gesendet',
    'premium.translate_select': 'Übersetzen in...',
    'premium.translate_button': 'Übersetzen (~CHF 0.10)',
    'premium.translate_choose_lang': 'Bitte wählen Sie eine Sprache.',
    'premium.translate_title': 'Übersetzung',
    'premium.translate_cost_receipt': 'Übersetzungskosten: <strong>CHF {{cost}}</strong> — Guthaben: CHF {{remaining}}',
    'premium.payment_processing_title': 'Zahlung erhalten — Aktivierung läuft',
    'premium.payment_processing_text': 'Ihr Premium-Konto wird gerade aktiviert. Das dauert in der Regel nur wenige Sekunden.',
    'premium.payment_processing_warning': 'Ihre Zahlung wurde erhalten. Die Aktivierung dauert länger als erwartet. Laden Sie diese Seite in wenigen Augenblicken neu. Wenn das Problem weiterhin besteht, kontaktieren Sie uns.',
    'premium.back_to_premium': 'Zurück',

    // Over-my-head
    'overmyhead.button': 'Dieser Fall überfordert mich',
    'overmyhead.title': 'Eine Fachperson finden',
    'overmyhead.text': 'Wir leiten Sie an eine zuständige Stelle weiter (kantonales Verzeichnis, Verein, Pikett-Anwalt).',

    // Round labels
    'round.r1': 'R1 — Ich erfasse Ihre Situation',
    'round.r2': 'R2 — Ich präzisiere die Schlüsselpunkte',
    'round.r3': 'R3 — Ich prüfe die Details',
    'round.synthesis': 'Synthese — Ich erstelle Ihren Aktionsplan',
    'round.contradiction': 'Analyse — Ich konsultiere Gesetze und Rechtsprechung',

    // Certificate
    'cert.sufficient': 'Vollständige Analyse — geprüfte Quellen',
    'cert.limited': 'Analyse mit Vorbehalten',
    'cert.insufficient': 'Wesentliche Lücken — siehe Details',
    'cert.warning_label': 'Zu überprüfende(s) Element(e)',
    'result.caselaw_canon': 'Leitrechtsprechung',
    'result.leading_cases': '📌 Massgebende Entscheide',
    'result.nuances': '⚖️ Nuancen und Gegenfälle',
    'result.cantonal_practice': '🏛️ Kantonale Praxis',
    'result.similar_cases_count': '{{count}} ähnliche Fälle (Vertiefung)',
    'result.median_label': 'Median',
    'result.articles_label': 'Artikel',
    'result.source_label': 'Quelle',
    'result.source_asloca_kit': 'Quelle: ASLOCA-Kit {{number}}',
    'result.source_asloca_ref': 'Quelle: ASLOCA {{ref}}',
    'result.source_asloca_short': 'ASLOCA-Kit',
    'role.leading': 'Leitfall',
    'role.nuance': 'Nuance',
    'role.cantonal': 'Kantonal',
    'role.similar': 'Vergleichbar',

    // Degraded banner
    'degraded.title': 'Degradierter Modus',
    'degraded.body_de': 'Ihre Frage war auf Deutsch. Unsere juristische Analyse erfolgt auf Französisch (degradierter Modus). Die Schweizer Rechtsterminologie ist mehrsprachig, doch die ausführlichen Karteikarten sind derzeit nur auf Französisch verfügbar.',
    'degraded.body_it': 'Ihre Frage war auf Italienisch. Unsere juristische Analyse erfolgt auf Französisch (degradierter Modus).',
    'degraded.action_de': 'Für eine Beratung auf Deutsch wenden Sie sich an den Mieterverband oder unia.ch je nach Rechtsgebiet.',
    'degraded.action_it': 'Per una consulenza in italiano, contatti ASLOCA Ticino o unia.ch.'
  };

  // -------------------------------------------------------------------------
  // IT — Italien suisse
  // -------------------------------------------------------------------------

  var IT = {
    // Paywall
    'paywall.title': 'Continuare l\'analisi',
    'paywall.price_chf': '2 CHF',
    'paywall.cta_continue': 'Continuare l\'analisi — 2 CHF',
    'paywall.cta_topup': 'Ricaricare il portafoglio',
    'paywall.explainer': 'Il primo turno è gratuito. Per andare oltre (domande mirate, piano d\'azione, lettere), il costo è di 2 CHF.',
    'paywall.no_subscription': 'Nessun abbonamento, pagamento per utilizzo.',
    'premium.cost_translation': 'Traduzione (3 lingue)',
    'premium.login_title': 'Già cliente?',
    'premium.login_intro': 'Acceda con la sua email per ritrovare il suo saldo.',
    'premium.login_email_placeholder': 'La sua email',
    'premium.login_send_code': 'Ricevere un codice',
    'premium.login_code_placeholder': 'Codice a 6 cifre',
    'premium.login_verify': 'Verificare',
    'premium.login_resend_code': 'Inviare di nuovo il codice',
    'premium.login_email_sent': 'Codice inviato a {{email}}',
    'premium.translate_select': 'Tradurre in...',
    'premium.translate_button': 'Tradurre (~CHF 0.10)',
    'premium.translate_choose_lang': 'Selezioni una lingua.',
    'premium.translate_title': 'Traduzione',
    'premium.translate_cost_receipt': 'Costo traduzione: <strong>CHF {{cost}}</strong> — Saldo: CHF {{remaining}}',
    'premium.payment_processing_title': 'Pagamento ricevuto — attivazione in corso',
    'premium.payment_processing_text': 'Il suo account premium è in fase di attivazione. Di solito richiede solo pochi secondi.',
    'premium.payment_processing_warning': 'Il suo pagamento è stato ricevuto. L\'attivazione richiede più tempo del previsto. Ricarichi questa pagina tra qualche istante. Se il problema persiste, ci contatti.',
    'premium.back_to_premium': 'Indietro',

    // Over-my-head
    'overmyhead.button': 'Questo caso mi supera',
    'overmyhead.title': 'Trovare un professionista',
    'overmyhead.text': 'La indirizziamo verso un servizio competente (elenco cantonale gratuito, associazione, avvocato di turno).',

    // Round labels
    'round.r1': 'R1 — Comprendo la sua situazione',
    'round.r2': 'R2 — Affino i punti chiave',
    'round.r3': 'R3 — Verifico i dettagli',
    'round.synthesis': 'Sintesi — Redigo il suo piano d\'azione',
    'round.contradiction': 'Analisi — Consulto leggi e giurisprudenza',

    // Certificate
    'cert.sufficient': 'Analisi completa — fonti verificate',
    'cert.limited': 'Analisi fornita con riserva',
    'cert.insufficient': 'Lacune importanti — vedere dettagli',
    'cert.warning_label': 'Elemento/i da verificare',
    'result.caselaw_canon': 'Giurisprudenza canonica',
    'result.leading_cases': '📌 Decisioni determinanti',
    'result.nuances': '⚖️ Sfumature e controcasi',
    'result.cantonal_practice': '🏛️ Pratica cantonale',
    'result.similar_cases_count': '{{count}} casi simili (esplorazione)',
    'result.median_label': 'mediana',
    'result.articles_label': 'Articoli',
    'result.source_label': 'Fonte',
    'result.source_asloca_kit': 'Fonte: ASLOCA Kit {{number}}',
    'result.source_asloca_ref': 'Fonte: ASLOCA {{ref}}',
    'result.source_asloca_short': 'ASLOCA Kit',
    'role.leading': 'Chiave',
    'role.nuance': 'Sfumatura',
    'role.cantonal': 'Cantonale',
    'role.similar': 'Simile',

    // Degraded banner
    'degraded.title': 'Modalità degradata',
    'degraded.body_de': 'La sua domanda era in tedesco. La nostra analisi giuridica è in francese (modalità degradata).',
    'degraded.body_it': 'La sua domanda era in italiano. La nostra analisi giuridica è in francese (modalità degradata). La terminologia giuridica svizzera è plurilingue, ma le schede dettagliate sono attualmente solo in francese.',
    'degraded.action_de': 'Per una consulenza in tedesco contatti il Mieterverband o unia.ch secondo l\'ambito.',
    'degraded.action_it': 'Per una consulenza in italiano contatti ASLOCA Ticino o unia.ch secondo l\'ambito.'
  };

  // -------------------------------------------------------------------------
  // EN
  // -------------------------------------------------------------------------

  var EN = {
    'paywall.title': 'Continue the analysis',
    'paywall.price_chf': '2 CHF',
    'paywall.cta_continue': 'Continue the analysis — 2 CHF',
    'paywall.cta_topup': 'Top up my wallet',
    'paywall.explainer': 'The first round is free. To go further (targeted questions, action plan, letters), the price is 2 CHF.',
    'paywall.no_subscription': 'No subscription, pay only when you use it.',
    'premium.cost_translation': 'Translation (3 languages)',
    'premium.login_title': 'Already a customer?',
    'premium.login_intro': 'Sign in with your email to recover your balance.',
    'premium.login_email_placeholder': 'Your email',
    'premium.login_send_code': 'Receive a code',
    'premium.login_code_placeholder': '6-digit code',
    'premium.login_verify': 'Verify',
    'premium.login_resend_code': 'Send another code',
    'premium.login_email_sent': 'Code sent to {{email}}',
    'premium.translate_select': 'Translate into...',
    'premium.translate_button': 'Translate (~CHF 0.10)',
    'premium.translate_choose_lang': 'Choose a language.',
    'premium.translate_title': 'Translation',
    'premium.translate_cost_receipt': 'Translation cost: <strong>CHF {{cost}}</strong> — Balance: CHF {{remaining}}',
    'premium.payment_processing_title': 'Payment received — activation in progress',
    'premium.payment_processing_text': 'Your premium account is being activated. This usually takes only a few seconds.',
    'premium.payment_processing_warning': 'Your payment has been received. Activation is taking longer than expected. Reload this page in a few moments. If the problem persists, contact us.',
    'premium.back_to_premium': 'Back',
    'overmyhead.button': 'This case is beyond me',
    'overmyhead.title': 'Find a human expert',
    'overmyhead.text': 'We redirect you to a suitable service (free cantonal directory, association, duty lawyer).',
    'round.r1': 'R1 — I understand your situation',
    'round.r2': 'R2 — I refine the key points',
    'round.r3': 'R3 — I validate the details',
    'round.synthesis': 'Summary — I draft your action plan',
    'round.contradiction': 'Analysis — I consult laws and case law',
    'cert.sufficient': 'Complete analysis — verified sources',
    'cert.limited': 'Analysis provided with reservations',
    'cert.insufficient': 'Important gaps — see details',
    'cert.warning_label': 'Item(s) to verify',
    'result.caselaw_canon': 'Canonical case law',
    'result.leading_cases': '📌 Leading cases',
    'result.nuances': '⚖️ Nuances and counter-cases',
    'result.cantonal_practice': '🏛️ Cantonal practice',
    'result.similar_cases_count': '{{count}} similar cases (exploration)',
    'result.median_label': 'median',
    'result.articles_label': 'Articles',
    'result.source_label': 'Source',
    'result.source_asloca_kit': 'Source: ASLOCA Kit {{number}}',
    'result.source_asloca_ref': 'Source: ASLOCA {{ref}}',
    'result.source_asloca_short': 'ASLOCA Kit',
    'role.leading': 'Key',
    'role.nuance': 'Nuance',
    'role.cantonal': 'Cantonal',
    'role.similar': 'Similar',
    'degraded.title': 'Limited mode',
    'degraded.body_de': 'Your question was in German. Our legal analysis is shown in French (limited mode).',
    'degraded.body_it': 'Your question was in Italian. Our legal analysis is shown in French (limited mode).',
    'degraded.action_de': 'For advice in German, contact the Mieterverband or unia.ch depending on the area.',
    'degraded.action_it': 'For advice in Italian, contact ASLOCA Ticino or unia.ch depending on the area.'
  };

  // -------------------------------------------------------------------------
  // Augmentation des dictionnaires existants (pas de remplacement)
  // -------------------------------------------------------------------------

  function extend(target, additions) {
    if (!target) return;
    Object.keys(additions).forEach(function (k) {
      if (target[k] === undefined) {
        target[k] = additions[k];
      }
    });
  }

  if (I18N.fr) extend(I18N.fr, FR);
  if (I18N.de) extend(I18N.de, DE);
  if (I18N.it) extend(I18N.it, IT);
  if (I18N.en) extend(I18N.en, EN);

  // Expose pour debug
  window.__JB_I18N_EXTENDED__ = { FR: FR, DE: DE, IT: IT, EN: EN };
})();
