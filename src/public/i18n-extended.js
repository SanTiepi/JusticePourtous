/**
 * i18n-extended — Phase Cortex 4 (mode dégradé DE/IT)
 *
 * Ajoute les clés CRITIQUES manquantes pour DE et IT :
 *   - paywall (continuer 2 CHF)
 *   - bouton "Ce cas me dépasse"
 *   - statuts de round (R1, R2, R3, synthèse)
 *   - certificate warnings
 *   - degraded mode banner strings
 *   - LLCA disclaimer (déjà présent mais on assure la cohérence avec le bandeau)
 *
 * IMPORTANT : on ne traduit JAMAIS le contenu juridique des fiches.
 * Seule l'interface de pilotage (chrome) est traduite.
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
    'premium.cost_translation': 'Traduction (8 langues)',
    'premium.login_title': 'Déjà client ?',
    'premium.login_intro': 'Connectez-vous avec votre email pour retrouver votre solde.',
    'premium.login_email_placeholder': 'Votre email',
    'premium.login_send_code': 'Recevoir un code',
    'premium.login_code_placeholder': 'Code à 6 chiffres',
    'premium.login_verify': 'Vérifier',
    'premium.login_resend_code': 'Renvoyer un code',
    'premium.login_email_sent': 'Code envoyé à {{email}}',

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
    'premium.cost_translation': 'Übersetzung (8 Sprachen)',
    'premium.login_title': 'Bereits Kunde?',
    'premium.login_intro': 'Melden Sie sich mit Ihrer E-Mail-Adresse an, um Ihr Guthaben wiederzufinden.',
    'premium.login_email_placeholder': 'Ihre E-Mail',
    'premium.login_send_code': 'Code erhalten',
    'premium.login_code_placeholder': '6-stelliger Code',
    'premium.login_verify': 'Bestätigen',
    'premium.login_resend_code': 'Code erneut senden',
    'premium.login_email_sent': 'Code an {{email}} gesendet',

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
    'premium.cost_translation': 'Traduzione (8 lingue)',
    'premium.login_title': 'Già cliente?',
    'premium.login_intro': 'Acceda con la sua email per ritrovare il suo saldo.',
    'premium.login_email_placeholder': 'La sua email',
    'premium.login_send_code': 'Ricevere un codice',
    'premium.login_code_placeholder': 'Codice a 6 cifre',
    'premium.login_verify': 'Verificare',
    'premium.login_resend_code': 'Inviare di nuovo il codice',
    'premium.login_email_sent': 'Codice inviato a {{email}}',

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
    'premium.cost_translation': 'Translation (8 languages)',
    'premium.login_title': 'Already a customer?',
    'premium.login_intro': 'Sign in with your email to recover your balance.',
    'premium.login_email_placeholder': 'Your email',
    'premium.login_send_code': 'Receive a code',
    'premium.login_code_placeholder': '6-digit code',
    'premium.login_verify': 'Verify',
    'premium.login_resend_code': 'Send another code',
    'premium.login_email_sent': 'Code sent to {{email}}',
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
    'degraded.title': 'Limited mode',
    'degraded.body_de': 'Your question was in German. Our legal analysis is shown in French (limited mode).',
    'degraded.body_it': 'Your question was in Italian. Our legal analysis is shown in French (limited mode).',
    'degraded.action_de': 'For advice in German, contact the Mieterverband or unia.ch depending on the area.',
    'degraded.action_it': 'For advice in Italian, contact ASLOCA Ticino or unia.ch depending on the area.'
  };

  // -------------------------------------------------------------------------
  // PT
  // -------------------------------------------------------------------------

  var PT = {
    'paywall.title': 'Continuar a análise',
    'paywall.price_chf': '2 CHF',
    'paywall.cta_continue': 'Continuar a análise — 2 CHF',
    'paywall.cta_topup': 'Recarregar a minha carteira',
    'paywall.explainer': 'A primeira ronda é gratuita. Para ir mais longe (perguntas direcionadas, plano de ação, cartas), o preço é 2 CHF.',
    'paywall.no_subscription': 'Sem subscrição, pagamento por utilização.',
    'premium.cost_translation': 'Tradução (8 línguas)',
    'premium.login_title': 'Já é cliente?',
    'premium.login_intro': 'Entre com o seu email para recuperar o seu saldo.',
    'premium.login_email_placeholder': 'Seu email',
    'premium.login_send_code': 'Receber um código',
    'premium.login_code_placeholder': 'Código de 6 dígitos',
    'premium.login_verify': 'Verificar',
    'premium.login_resend_code': 'Reenviar um código',
    'premium.login_email_sent': 'Código enviado para {{email}}',
    'overmyhead.button': 'Este caso ultrapassa-me',
    'overmyhead.title': 'Encontrar um profissional',
    'overmyhead.text': 'Redirecionamos para um serviço competente (diretório cantonal gratuito, associação, advogado de prevenção).',
    'round.r1': 'R1 — Compreendo a sua situação',
    'round.r2': 'R2 — Aprofundo os pontos-chave',
    'round.r3': 'R3 — Valido os detalhes',
    'round.synthesis': 'Síntese — Redijo o seu plano de ação',
    'round.contradiction': 'Análise — Consulto leis e jurisprudência',
    'cert.sufficient': 'Análise completa — fontes verificadas',
    'cert.limited': 'Análise fornecida com reservas',
    'cert.insufficient': 'Lacunas importantes — ver detalhes',
    'cert.warning_label': 'Elemento(s) a verificar',
    'degraded.title': 'Modo limitado',
    'degraded.body_de': 'A sua pergunta foi em alemão. A nossa análise jurídica é mostrada em francês (modo limitado).',
    'degraded.body_it': 'A sua pergunta foi em italiano. A nossa análise jurídica é mostrada em francês (modo limitado).',
    'degraded.action_de': 'Para aconselhamento em alemão, contacte o Mieterverband ou o unia.ch conforme a área.',
    'degraded.action_it': 'Para aconselhamento em italiano, contacte a ASLOCA Ticino ou o unia.ch conforme a área.'
  };

  // -------------------------------------------------------------------------
  // AR
  // -------------------------------------------------------------------------

  var AR = {
    'paywall.title': 'متابعة التحليل',
    'paywall.price_chf': '2 CHF',
    'paywall.cta_continue': 'متابعة التحليل — 2 CHF',
    'paywall.cta_topup': 'إعادة شحن المحفظة',
    'paywall.explainer': 'الجولة الأولى مجانية. للمتابعة أكثر (أسئلة موجّهة، خطة عمل، رسائل)، السعر هو 2 CHF.',
    'paywall.no_subscription': 'لا يوجد اشتراك، الدفع حسب الاستخدام.',
    'premium.cost_translation': 'الترجمة (8 لغات)',
    'premium.login_title': 'عميل بالفعل؟',
    'premium.login_intro': 'سجّل الدخول ببريدك الإلكتروني لاستعادة رصيدك.',
    'premium.login_email_placeholder': 'بريدك الإلكتروني',
    'premium.login_send_code': 'الحصول على رمز',
    'premium.login_code_placeholder': 'رمز من 6 أرقام',
    'premium.login_verify': 'تحقّق',
    'premium.login_resend_code': 'إرسال رمز جديد',
    'premium.login_email_sent': 'تم إرسال الرمز إلى {{email}}',
    'overmyhead.button': 'هذه القضية تتجاوزني',
    'overmyhead.title': 'العثور على مختص بشري',
    'overmyhead.text': 'نوجّهك إلى خدمة مناسبة: دليل كانتوني مجاني أو جمعية أو محامٍ مناوب.',
    'round.r1': 'R1 — أفهم وضعك',
    'round.r2': 'R2 — أُدقّق النقاط الأساسية',
    'round.r3': 'R3 — أتحقق من التفاصيل',
    'round.synthesis': 'الخلاصة — أكتب خطة العمل',
    'round.contradiction': 'التحليل — أراجع القوانين والاجتهادات',
    'cert.sufficient': 'تحليل كامل — مصادر موثقة',
    'cert.limited': 'تحليل مع تحفظات',
    'cert.insufficient': 'نواقص مهمة — راجع التفاصيل',
    'cert.warning_label': 'عنصر / عناصر يجب التحقق منها',
    'degraded.title': 'وضع محدود',
    'degraded.body_de': 'تم طرح سؤالك بالألمانية. نعرض التحليل القانوني بالفرنسية حالياً (وضع محدود).',
    'degraded.body_it': 'تم طرح سؤالك بالإيطالية. نعرض التحليل القانوني بالفرنسية حالياً (وضع محدود).',
    'degraded.action_de': 'للاستشارة بالألمانية، يمكنك التواصل مع Mieterverband أو unia.ch بحسب المجال.',
    'degraded.action_it': 'للاستشارة بالإيطالية، يمكنك التواصل مع ASLOCA Ticino أو unia.ch بحسب المجال.'
  };

  // -------------------------------------------------------------------------
  // TR
  // -------------------------------------------------------------------------

  var TR = {
    'paywall.title': 'Analizi sürdür',
    'paywall.price_chf': '2 CHF',
    'paywall.cta_continue': 'Analizi sürdür — 2 CHF',
    'paywall.cta_topup': 'Cüzdanımı yükle',
    'paywall.explainer': 'İlk tur ücretsizdir. Daha ileri gitmek için (hedefe yönelik sorular, eylem planı, mektuplar) ücret 2 CHF\'dir.',
    'paywall.no_subscription': 'Abonelik yok, kullanım başına ödeme.',
    'premium.cost_translation': 'Çeviri (8 dil)',
    'premium.login_title': 'Zaten müşteri misiniz?',
    'premium.login_intro': 'Bakiyenizi görmek için e-posta adresinizle giriş yapın.',
    'premium.login_email_placeholder': 'E-posta adresiniz',
    'premium.login_send_code': 'Bir kod al',
    'premium.login_code_placeholder': '6 haneli kod',
    'premium.login_verify': 'Doğrula',
    'premium.login_resend_code': 'Kodu yeniden gönder',
    'premium.login_email_sent': 'Kod {{email}} adresine gönderildi',
    'overmyhead.button': 'Bu dosya beni aşıyor',
    'overmyhead.title': 'Bir uzmana yönel',
    'overmyhead.text': 'Sizi uygun bir hizmete yönlendiriyoruz: ücretsiz kanton rehberi, dernek veya nöbetçi avukat.',
    'round.r1': 'R1 — Durumunuzu anlıyorum',
    'round.r2': 'R2 — Ana noktaları netleştiriyorum',
    'round.r3': 'R3 — Ayrıntıları doğruluyorum',
    'round.synthesis': 'Özet — Eylem planınızı hazırlıyorum',
    'round.contradiction': 'Analiz — Kanunları ve içtihadı inceliyorum',
    'cert.sufficient': 'Tam analiz — doğrulanmış kaynaklar',
    'cert.limited': 'Çekincelerle sunulan analiz',
    'cert.insufficient': 'Önemli eksikler — ayrıntılara bakın',
    'cert.warning_label': 'Doğrulanması gereken unsur(lar)',
    'degraded.title': 'Sınırlı mod',
    'degraded.body_de': 'Sorunuz Almanca yazıldı. Hukuki analizimiz şu anda Fransızca gösteriliyor (sınırlı mod).',
    'degraded.body_it': 'Sorunuz İtalyanca yazıldı. Hukuki analizimiz şu anda Fransızca gösteriliyor (sınırlı mod).',
    'degraded.action_de': 'Almanca danışmanlık için alana göre Mieterverband veya unia.ch ile iletişime geçin.',
    'degraded.action_it': 'İtalyanca danışmanlık için alana göre ASLOCA Ticino veya unia.ch ile iletişime geçin.'
  };

  // -------------------------------------------------------------------------
  // SQ
  // -------------------------------------------------------------------------

  var SQ = {
    'paywall.title': 'Vazhdo analizën',
    'paywall.price_chf': '2 CHF',
    'paywall.cta_continue': 'Vazhdo analizën — 2 CHF',
    'paywall.cta_topup': 'Rimbush portofolin tim',
    'paywall.explainer': 'Raundi i parë është falas. Për të vazhduar më tej (pyetje të synuara, plan veprimi, letra), çmimi është 2 CHF.',
    'paywall.no_subscription': 'Pa abonim, pagesë sipas përdorimit.',
    'premium.cost_translation': 'Përkthim (8 gjuhë)',
    'premium.login_title': 'Jeni tashmë klient?',
    'premium.login_intro': 'Hyni me emailin tuaj për të gjetur sërish balancën tuaj.',
    'premium.login_email_placeholder': 'Emaili juaj',
    'premium.login_send_code': 'Merr një kod',
    'premium.login_code_placeholder': 'Kod 6-shifror',
    'premium.login_verify': 'Verifiko',
    'premium.login_resend_code': 'Dërgo sërish kodin',
    'premium.login_email_sent': 'Kodi u dërgua te {{email}}',
    'overmyhead.button': 'Ky rast më tejkalon',
    'overmyhead.title': 'Gjej një profesionist',
    'overmyhead.text': 'Ju drejtojmë te një shërbim i përshtatshëm: drejtori kantonale falas, shoqatë ose avokat kujdestar.',
    'round.r1': 'R1 — E kuptoj situatën tuaj',
    'round.r2': 'R2 — Sqaroj pikat kyçe',
    'round.r3': 'R3 — Verifikoj hollësitë',
    'round.synthesis': 'Përmbledhje — Hartoj planin tuaj të veprimit',
    'round.contradiction': 'Analizë — Konsultoj ligjet dhe jurisprudencën',
    'cert.sufficient': 'Analizë e plotë — burime të verifikuara',
    'cert.limited': 'Analizë me rezerva',
    'cert.insufficient': 'Mungesa të rëndësishme — shihni hollësitë',
    'cert.warning_label': 'Element(et) për t’u verifikuar',
    'degraded.title': 'Modalitet i kufizuar',
    'degraded.body_de': 'Pyetja juaj ishte në gjermanisht. Analiza jonë juridike shfaqet tani në frëngjisht (modalitet i kufizuar).',
    'degraded.body_it': 'Pyetja juaj ishte në italisht. Analiza jonë juridike shfaqet tani në frëngjisht (modalitet i kufizuar).',
    'degraded.action_de': 'Për këshillim në gjermanisht, kontaktoni Mieterverband ose unia.ch sipas fushës.',
    'degraded.action_it': 'Për këshillim në italisht, kontaktoni ASLOCA Ticino ose unia.ch sipas fushës.'
  };

  // -------------------------------------------------------------------------
  // HR
  // -------------------------------------------------------------------------

  var HR = {
    'paywall.title': 'Nastavi analizu',
    'paywall.price_chf': '2 CHF',
    'paywall.cta_continue': 'Nastavi analizu — 2 CHF',
    'paywall.cta_topup': 'Nadoplati moj novčanik',
    'paywall.explainer': 'Prvi krug je besplatan. Za nastavak (ciljana pitanja, plan djelovanja, pisma) cijena je 2 CHF.',
    'paywall.no_subscription': 'Nema pretplate, plaćanje po korištenju.',
    'premium.cost_translation': 'Prijevod (8 jezika)',
    'premium.login_title': 'Već ste klijent?',
    'premium.login_intro': 'Prijavite se svojim e-mailom kako biste ponovno pronašli svoj saldo.',
    'premium.login_email_placeholder': 'Vaš e-mail',
    'premium.login_send_code': 'Primite kod',
    'premium.login_code_placeholder': '6-znamenkasti kod',
    'premium.login_verify': 'Potvrdi',
    'premium.login_resend_code': 'Ponovno pošalji kod',
    'premium.login_email_sent': 'Kod je poslan na {{email}}',
    'overmyhead.button': 'Ovaj slučaj me nadilazi',
    'overmyhead.title': 'Pronađi stručnu osobu',
    'overmyhead.text': 'Usmjeravamo vas prema odgovarajućoj službi: besplatan kantonalni imenik, udruga ili dežurni odvjetnik.',
    'round.r1': 'R1 — Razumijem vašu situaciju',
    'round.r2': 'R2 — Pojašnjavam ključne točke',
    'round.r3': 'R3 — Provjeravam detalje',
    'round.synthesis': 'Sažetak — Sastavljam vaš plan djelovanja',
    'round.contradiction': 'Analiza — Provjeravam zakone i sudsku praksu',
    'cert.sufficient': 'Potpuna analiza — provjereni izvori',
    'cert.limited': 'Analiza uz ograničenja',
    'cert.insufficient': 'Važni nedostaci — pogledajte detalje',
    'cert.warning_label': 'Element(i) koje treba provjeriti',
    'degraded.title': 'Ograničeni način rada',
    'degraded.body_de': 'Vaše pitanje bilo je na njemačkom. Naša pravna analiza trenutačno se prikazuje na francuskom (ograničeni način rada).',
    'degraded.body_it': 'Vaše pitanje bilo je na talijanskom. Naša pravna analiza trenutačno se prikazuje na francuskom (ograničeni način rada).',
    'degraded.action_de': 'Za savjetovanje na njemačkom obratite se Mieterverbandu ili unia.ch, ovisno o području.',
    'degraded.action_it': 'Za savjetovanje na talijanskom obratite se ASLOCA Ticino ili unia.ch, ovisno o području.'
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
  if (I18N.pt) extend(I18N.pt, PT);
  if (I18N.ar) extend(I18N.ar, AR);
  if (I18N.tr) extend(I18N.tr, TR);
  if (I18N.sq) extend(I18N.sq, SQ);
  if (I18N.hr) extend(I18N.hr, HR);

  // Expose pour debug
  window.__JB_I18N_EXTENDED__ = { FR: FR, DE: DE, IT: IT };
})();
