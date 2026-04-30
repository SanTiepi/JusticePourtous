// JusticePourtous Frontend Logic
// Vanilla JS — zero framework, zero deps

var currentQuestions = [];
var currentAnswers = [];
var currentStep = 0;
var currentDomaine = '';

// ===== Consultation flow =====

// Refactor 2026-04-30 : abandon du quizz rigide template-de-fiche-1 (causait
// des questions incohérentes type "quand par rapport à votre arrêt maladie ?"
// après que l'user ait répondu NON à "êtes-vous en arrêt maladie ?").
// Remplacé par textarea + POST /api/triage (LLM-first navigator, robuste).
var DOMAIN_PLACEHOLDERS = {
  bail: 'Mon propriétaire refuse de rembourser ma caution / Moisissure dans mon appartement / J\'ai reçu un congé...',
  travail: 'Mon employeur refuse de me payer mes heures sup / J\'ai été licencié pendant un arrêt / Mon certificat de travail est négatif...',
  dettes: 'J\'ai reçu un commandement de payer / Je n\'arrive plus à payer mes factures / On me menace de saisie...',
  famille: 'Mon ex ne paie plus la pension / Je veux divorcer / Question de garde des enfants...',
  etrangers: 'Décision de renvoi / Mon permis B n\'est pas renouvelé / Refus de regroupement familial...',
  social: 'Refus d\'aide sociale / Réduction de prestations / Problème avec l\'ORP...',
  violence: 'Je suis victime de violence / Je veux porter plainte / Mesures de protection...',
  accident: 'Accident de la circulation / Accident professionnel / Refus d\'assurance...',
  assurances: 'Refus de prestations LAA/AI/LAMal / Litige avec mon assurance...',
  entreprise: 'Difficultés financières de ma société / Conflit entre associés / Recouvrement clients...',
  consommation: 'Produit défectueux / Livraison non reçue / Garantie refusée...',
  voisinage: 'Bruit du voisin / Conflit de servitude / Arbres trop proches...',
  successions: 'Question sur héritage / Réserve héréditaire / Renonciation succession...',
  sante: 'Refus de soins / Litige médical / Question sur LAMal...',
  circulation: 'Retrait de permis / Amende d\'ordre / Accident sans police...'
};

async function initConsultation(domaine) {
  currentDomaine = domaine;
  var card = document.getElementById('questionCard');
  if (!card) return;

  // Cacher la barre de progression
  var progress = document.querySelector('.consult-progress');
  if (progress) progress.style.display = 'none';

  var placeholder = DOMAIN_PLACEHOLDERS[domaine] || 'Décrivez votre situation en quelques mots, comme à un ami...';
  var domaineLabel = domaine.charAt(0).toUpperCase() + domaine.slice(1);

  card.innerHTML =
    '<h2 style="margin:0 0 0.5rem;">Votre situation — ' + domaineLabel + '</h2>' +
    '<p style="color:#4a5b6e;margin:0 0 1.25rem;line-height:1.5;">Décrivez votre cas en quelques mots, dans vos mots à vous. Notre IA identifie ensuite la situation juridique précise et vous oriente.</p>' +
    '<textarea id="consultText" rows="5" maxlength="800" placeholder="' + placeholder.replace(/"/g, '&quot;') + '" style="width:100%;padding:0.85rem 1rem;font-size:1rem;line-height:1.55;border:1.5px solid #c9d4df;border-radius:8px;font-family:inherit;resize:vertical;min-height:120px;"></textarea>' +
    '<div style="display:flex;gap:0.75rem;margin-top:1rem;flex-wrap:wrap;">' +
      '<button class="btn btn-primary" onclick="submitConsultText()" style="flex:1;min-width:200px;padding:0.85rem 1.5rem;font-size:1rem;font-weight:600;background:#1d7042;color:#fff;border:none;border-radius:999px;cursor:pointer;">Analyser ma situation</button>' +
      '<a href="/" class="btn btn-secondary" style="padding:0.85rem 1.25rem;font-size:0.95rem;color:#4a5b6e;text-decoration:none;border:1px solid #c9d4df;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;">Retour</a>' +
    '</div>' +
    '<p style="color:#6a7787;font-size:0.82rem;margin-top:1rem;">🔒 Anonyme · Aucun compte requis · Gratuit</p>';

  // Auto-focus la textarea
  setTimeout(function() {
    var ta = document.getElementById('consultText');
    if (ta) ta.focus();
  }, 100);
}

// Variables d'état pour le flow conversationnel
var jbCaseId = null;
var jbCurrentQuestions = [];
var jbAnswersGiven = {};

// Soumet le texte au triage LLM-first puis affiche les questions follow-up
// pertinentes (générées par le LLM en fonction du texte initial). Branching
// vrai : chaque réponse re-triage le contexte via /api/triage/refine.
async function submitConsultText() {
  var ta = document.getElementById('consultText');
  if (!ta) return;
  var texte = (ta.value || '').trim();
  if (texte.length < 10) {
    alert('Décrivez votre situation en au moins quelques mots.');
    ta.focus();
    return;
  }
  var lang = typeof getLang === 'function' ? getLang() : 'fr';
  var card = document.getElementById('questionCard');
  if (card) card.innerHTML = '<div class="loading" style="text-align:center;padding:3rem 1rem;color:#4a5b6e;font-size:1.1rem;">⚖️ Analyse en cours...</div>';

  try {
    var res = await fetch('/api/triage?lang=' + encodeURIComponent(lang), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texte: texte, canton: null, lang: lang })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur ' + res.status);
    handleTriageResponse(data);
  } catch (e) {
    showTriageError(e.message);
  }
}
window.submitConsultText = submitConsultText;

// Aiguillage selon la réponse triage : questions à poser OU résultat OU erreur
function handleTriageResponse(data) {
  jbCaseId = data.case_id || data.sessionId || jbCaseId;

  // 1) Le triage a besoin de plus d'info → afficher les questions LLM
  if (data.status === 'ask_questions' && Array.isArray(data.questionsManquantes) && data.questionsManquantes.length > 0) {
    jbCurrentQuestions = data.questionsManquantes;
    renderTriageQuestions(data);
    return;
  }
  // 2) Safety stop — afficher TOUTES les ressources d'urgence (LAVI, 117, etc.)
  //    Le backend retourne un safety_response riche avec preamble + resources.
  //    UX critique : présenter les téléphones d'urgence en gros, cliquables.
  if (data.status === 'safety_stop') {
    var card = document.getElementById('questionCard');
    if (!card) return;
    var sr = data.safety_response || {};
    var resources = sr.resources || [];
    var resourcesHtml = resources.map(function(r) {
      return '<a href="' + (r.tel || '#') + '" style="display:block;padding:1rem;margin-bottom:0.5rem;background:#fff;border:2px solid #c92a2a;border-radius:8px;text-decoration:none;color:#1f2a36;">' +
        '<div style="display:flex;align-items:center;gap:0.75rem;">' +
          '<div style="font-size:1.5rem;">📞</div>' +
          '<div style="flex:1;">' +
            '<div style="font-weight:700;color:#c92a2a;font-size:1.1rem;">' + escHtmlSafe(r.name) + ' · ' + escHtmlSafe(r.phone) + '</div>' +
            (r.note ? '<div style="font-size:0.85rem;color:#4a5b6e;margin-top:0.2rem;">' + escHtmlSafe(r.note) + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</a>';
    }).join('');
    card.innerHTML =
      '<div style="background:#fff5f5;border:2px solid #c92a2a;border-radius:12px;padding:1.5rem;">' +
        '<h2 style="color:#c92a2a;margin:0 0 0.75rem;font-size:1.4rem;">⚠️ Votre sécurité d\'abord</h2>' +
        (sr.preamble ? '<p style="font-size:1rem;line-height:1.55;margin:0 0 1rem;color:#1f2a36;">' + escHtmlSafe(sr.preamble) + '</p>' : '') +
        (sr.message ? '<p style="font-weight:600;margin:0 0 1rem;color:#1f2a36;">' + escHtmlSafe(sr.message) + '</p>' : '') +
        '<div style="margin:1rem 0;">' + resourcesHtml + '</div>' +
        (sr.disclaimer ? '<p style="font-size:0.82rem;color:#6a7787;margin:1rem 0 0;font-style:italic;">' + escHtmlSafe(sr.disclaimer) + '</p>' : '') +
        '<div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #fecaca;text-align:center;">' +
          '<a href="/" style="display:inline-block;padding:0.75rem 1.5rem;background:#fff;border:1px solid #c9d4df;border-radius:999px;color:#4a5b6e;text-decoration:none;font-size:0.9rem;">← Retour à l\'accueil</a>' +
        '</div>' +
      '</div>';
    return;
  }
  // 3) Out of scope / human tier — orientation simple
  if (data.status === 'out_of_scope' || data.status === 'human_tier') {
    var card2 = document.getElementById('questionCard');
    var resp = data.out_of_scope_response || data.human_tier_response || {};
    if (card2) card2.innerHTML =
      '<div class="error-box"><strong>Orientation vers un service spécialisé</strong><p style="margin:0.75rem 0;">' +
      escHtmlSafe(resp.message || data.error || 'Pour cette situation, nous vous recommandons de contacter directement un service spécialisé.') +
      '</p><a href="/annuaire.html" class="btn btn-primary" style="display:inline-block;margin-top:0.5rem;padding:0.75rem 1.5rem;background:#1d7042;color:#fff;border-radius:999px;text-decoration:none;">Voir l\'annuaire des services</a></div>';
    return;
  }
  // 3) Résultat prêt → rediriger vers /resultat.html
  var ficheId = data.ficheId || data.fiche?.id;
  if (ficheId) {
    sessionStorage.setItem('jb_result', JSON.stringify(data));
    window.location.href = '/resultat.html?fiche=' + ficheId;
    return;
  }
  showTriageError('Pas de résultat — réessayez avec plus de détails.');
}

// Affiche les questions follow-up générées par le LLM, en flow étape par étape
function renderTriageQuestions(triageData) {
  jbAnswersGiven = {};
  var card = document.getElementById('questionCard');
  if (!card) return;

  // Affiche la 1ère question — les autres viennent par /api/triage/refine
  showNextQuestion(0);
}

function showNextQuestion(idx) {
  var card = document.getElementById('questionCard');
  if (!card) return;
  if (idx >= jbCurrentQuestions.length) {
    // Toutes les questions ont été répondues — soumettre les réponses
    submitTriageAnswers();
    return;
  }
  var q = jbCurrentQuestions[idx];
  var total = jbCurrentQuestions.length;
  var progressPct = Math.round(((idx + 1) / total) * 100);
  var importanceBadge = q.importance === 'critique'
    ? '<span style="display:inline-block;padding:2px 8px;background:#fef2f2;color:#991b1b;border-radius:999px;font-size:0.72rem;font-weight:600;margin-left:0.5rem;">Critique</span>'
    : '';

  card.innerHTML =
    '<div style="margin-bottom:1.5rem;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;font-size:0.82rem;color:#6a7787;">' +
        '<span>Question ' + (idx + 1) + ' / ' + total + '</span>' +
        '<span>' + progressPct + '%</span>' +
      '</div>' +
      '<div style="height:6px;background:#eef2f5;border-radius:999px;overflow:hidden;">' +
        '<div style="width:' + progressPct + '%;height:100%;background:#1d7042;transition:width 0.25s ease;"></div>' +
      '</div>' +
    '</div>' +
    '<h2 style="margin:0 0 1rem;font-size:1.25rem;line-height:1.4;">' + escHtmlSafe(q.question) + importanceBadge + '</h2>' +
    '<div id="qOptions" style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.25rem;">' +
      (q.choix || []).map(function(c, i) {
        return '<button class="qb-option" data-val="' + escHtmlAttr(c) + '" style="padding:0.85rem 1rem;text-align:left;background:#fff;border:1.5px solid #c9d4df;border-radius:8px;cursor:pointer;font-size:0.95rem;line-height:1.4;color:#1f2a36;transition:all 0.15s;min-height:48px;">' + escHtmlSafe(c) + '</button>';
      }).join('') +
    '</div>' +
    '<div style="display:flex;gap:0.75rem;flex-wrap:wrap;">' +
      (idx > 0 ? '<button class="btn btn-secondary" onclick="showNextQuestion(' + (idx - 1) + ')" style="padding:0.7rem 1.25rem;font-size:0.92rem;border:1px solid #c9d4df;border-radius:999px;background:#fff;cursor:pointer;">← Précédent</button>' : '') +
      '<button class="btn btn-secondary" onclick="skipTriageQuestions()" style="padding:0.7rem 1.25rem;font-size:0.85rem;color:#6a7787;border:none;background:transparent;cursor:pointer;text-decoration:underline;">Passer les questions</button>' +
    '</div>';

  // Bind des clics options
  var opts = card.querySelectorAll('.qb-option');
  opts.forEach(function(btn) {
    btn.addEventListener('mouseenter', function() {
      btn.style.borderColor = '#1d7042';
      btn.style.background = '#f0f9f4';
    });
    btn.addEventListener('mouseleave', function() {
      btn.style.borderColor = '#c9d4df';
      btn.style.background = '#fff';
    });
    btn.addEventListener('click', function() {
      var val = btn.getAttribute('data-val');
      jbAnswersGiven[q.id || ('q' + idx)] = val;
      // Auto-avance
      showNextQuestion(idx + 1);
    });
  });
}
window.showNextQuestion = showNextQuestion;

// Soumet toutes les réponses au backend pour affiner le triage
async function submitTriageAnswers() {
  var card = document.getElementById('questionCard');
  if (card) card.innerHTML = '<div class="loading" style="text-align:center;padding:3rem 1rem;color:#4a5b6e;font-size:1.1rem;">⚖️ Affinage du triage...</div>';
  var lang = typeof getLang === 'function' ? getLang() : 'fr';
  try {
    var res = await fetch('/api/triage/refine?lang=' + encodeURIComponent(lang), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: jbCaseId, reponses: jbAnswersGiven, lang: lang })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erreur ' + res.status);
    handleTriageResponse(data);
  } catch (e) {
    showTriageError(e.message);
  }
}

// Permet de sauter les questions et voir le résultat avec ce qu'on a
function skipTriageQuestions() {
  if (Object.keys(jbAnswersGiven).length === 0) {
    // Aucune réponse — rediriger directement avec la fiche initiale
    var stored = sessionStorage.getItem('jb_result');
    if (stored) {
      try {
        var d = JSON.parse(stored);
        var fid = d.ficheId || d.fiche?.id;
        if (fid) { window.location.href = '/resultat.html?fiche=' + fid; return; }
      } catch (e) { /* noop */ }
    }
  }
  submitTriageAnswers();
}
window.skipTriageQuestions = skipTriageQuestions;

function showTriageError(msg) {
  var card = document.getElementById('questionCard');
  if (!card) return;
  card.innerHTML =
    '<div class="error-box"><strong>Une erreur est survenue.</strong>' +
    '<p style="margin:0.5rem 0 1rem;">' + escHtmlSafe(msg || 'Réessayez plus tard.') + '</p>' +
    '<button class="btn btn-secondary" onclick="initConsultation(currentDomaine)" style="padding:0.7rem 1.25rem;border:1px solid #c9d4df;border-radius:999px;background:#fff;cursor:pointer;">Réessayer</button></div>';
}

function escHtmlSafe(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escHtmlAttr(s) {
  return escHtmlSafe(s).replace(/'/g, '&#39;');
}

function showQuestion() {
  if (currentStep >= currentQuestions.length) {
    submitConsultation();
    return;
  }

  var q = currentQuestions[currentStep];
  var total = currentQuestions.length;
  var progress = ((currentStep + 1) / total) * 100;

  // Update progress bar
  var progressFill = document.getElementById('progress');
  if (progressFill) progressFill.style.width = progress + '%';

  // Update progress labels
  var progressText = document.getElementById('progressText');
  if (progressText) progressText.textContent = t('consult.question_n').replace('{{n}}', currentStep + 1).replace('{{total}}', total);

  var progressCount = document.getElementById('progressCount');
  if (progressCount) progressCount.textContent = Math.round(progress) + '%';

  // Update question text
  document.getElementById('questionText').textContent = q.text;

  // Update buttons
  var prevBtn = document.getElementById('prevBtn');
  if (prevBtn) prevBtn.disabled = currentStep === 0;

  var nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    nextBtn.disabled = !currentAnswers[currentStep];
    // Change text on last question
    nextBtn.textContent = (currentStep === total - 1) ? t('action.voir_droits') : t('action.suivant');
  }

  // Render options
  var optionsDiv = document.getElementById('options');

  if (q.type === 'canton') {
    var cantons = ['AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH'];
    var sel = '<select class="select w-full" onchange="selectCanton(this.value)">';
    sel += '<option value="">' + t('consult.canton_select') + '</option>';
    cantons.forEach(function(c) {
      sel += '<option value="' + c + '"' + (currentAnswers[currentStep] === c ? ' selected' : '') + '>' + c + '</option>';
    });
    sel += '</select>';
    optionsDiv.innerHTML = sel;
  } else {
    optionsDiv.innerHTML = q.options.map(function(opt) {
      var isSelected = currentAnswers[currentStep] === opt ? ' selected' : '';
      return '<button class="option' + isSelected + '" onclick="selectOption(this, \'' + opt.replace(/'/g, "\\'") + '\')">' + opt + '</button>';
    }).join('');
  }

  // Animate question card
  var card = document.getElementById('questionCard');
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(8px)';
    requestAnimationFrame(function() {
      card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
  }
}

function selectOption(el, value) {
  currentAnswers[currentStep] = value;
  document.querySelectorAll('.option').forEach(function(btn) { btn.classList.remove('selected'); });
  el.classList.add('selected');
  var nextBtn = document.getElementById('nextBtn');
  if (nextBtn) nextBtn.disabled = false;
}

function selectCanton(value) {
  if (value) {
    currentAnswers[currentStep] = value;
    var nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.disabled = false;
  }
}

function nextQuestion() {
  if (currentAnswers[currentStep]) {
    currentStep++;
    showQuestion();
  }
}

function prevQuestion() {
  if (currentStep > 0) {
    currentStep--;
    showQuestion();
  }
}

async function submitConsultation() {
  var canton = currentAnswers.find(function(a) { return a && a.length === 2 && a === a.toUpperCase(); }) || 'VD';
  var lang = typeof getLang === 'function' ? getLang() : 'fr';

  // Show loading state
  var card = document.getElementById('questionCard');
  if (card) card.innerHTML = '<div class="loading">' + t('consult.analysis_loading') + '</div>';

  try {
    var res = await fetch('/api/consulter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domaine: currentDomaine,
        reponses: currentAnswers,
        canton: canton,
        lang: lang
      })
    });

    if (!res.ok) throw new Error('Erreur ' + res.status);

    var data = await res.json();
    if (data.fiche) {
      sessionStorage.setItem('jb_result', JSON.stringify(data));
      window.location.href = '/resultat.html?fiche=' + data.fiche.id;
    } else {
      throw new Error(t('result.no_result'));
    }
  } catch (e) {
    if (card) {
      card.innerHTML = '<div class="error-box">' + t('error.analysis_failed') + ' <a href="/">' + t('result.back_home') + '</a></div>';
    }
  }
}

// ===== Result page =====

async function loadResultat(ficheId) {
  var data = null;
  var cached = sessionStorage.getItem('jb_result');
  if (cached) {
    try {
      var parsed = JSON.parse(cached);
      if (parsed.fiche && parsed.fiche.id === ficheId) data = parsed;
    } catch (e) { /* ignore parse errors */ }
  }

  if (!data) {
    try {
      var lang = typeof getLang === 'function' ? getLang() : 'fr';
      var res = await fetch('/api/fiches/' + ficheId + '?lang=' + encodeURIComponent(lang));
      if (!res.ok) throw new Error(t('result.error_fiche'));
      data = await res.json();
    } catch (e) {
      document.getElementById('resultat').innerHTML = '<div class="error-box">' + t('result.error_fiche') + ' <a href="/">' + t('result.back_home') + '</a></div>';
      return;
    }
  }

  var fiche = data.fiche;
  if (!fiche) {
    document.getElementById('resultat').innerHTML = '<div class="error-box">' + t('result.error_fiche') + ' <a href="/">' + t('result.back_home') + '</a></div>';
    return;
  }

  var r = fiche.reponse;
  var html = '';
  var delay = 0;

  function stagger() {
    delay += 0.1;
    return ' style="animation-delay:' + delay + 's"';
  }

  // Summary card
  html += '<div class="card-highlight">';
  html += '<h3>' + t('result.your_situation') + '</h3>';
  html += '<p>' + r.explication + '</p>';
  html += '</div>';

  // Trust badge — review juridique critique (si applicable)
  if (fiche.claude_legal_review_date) {
    var reviewDate = String(fiche.claude_legal_review_date);
    var reviewNote = fiche.claude_legal_review_notes || 'verified';
    var reviewLabel;
    if (reviewNote === 'fixed') {
      reviewLabel = 'Articles, délais et autorités relus et corrigés le ' + reviewDate;
    } else if (reviewNote === 'verified_minor_imprecision') {
      reviewLabel = 'Articles, délais et autorités relus le ' + reviewDate + ' (imprécisions mineures connues)';
    } else if (reviewNote === 'verified_information_only') {
      // Fiches purement informationnelles — pas de cascade ni délai péremptoire
      reviewLabel = 'Références juridiques relues le ' + reviewDate + ' (fiche informationnelle)';
    } else {
      reviewLabel = 'Articles, délais et autorités relus le ' + reviewDate;
    }
    html += '<div class="legal-review-badge" role="status" aria-label="Vérification juridique"' + stagger() + '>';
    html += '<span class="badge-icon" aria-hidden="true">⚖️</span>';
    html += '<div class="badge-text">';
    html += '<strong>Vérification juridique critique</strong>';
    html += '<span class="badge-detail">' + reviewLabel + '</span>';
    html += '<span class="badge-disclaimer">Relecture par IA — ne remplace pas un conseil d\'avocat humain.</span>';
    html += '</div>';
    html += '</div>';
  }

  // Premium CTA
  html += renderPremiumCTA();

  // Articles de loi
  if (r.articles && r.articles.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.articles_title') + '</h3>';
    r.articles.forEach(function(a) {
      html += '<a href="' + a.lien + '" target="_blank" rel="noopener" class="article-link">';
      html += '<span class="ref">' + a.ref + '</span> ';
      html += '<span class="titre">&mdash; ' + a.titre + '</span>';
      html += '</a>';
    });
    html += '</div>';
  }

  // Jurisprudence
  if (r.jurisprudence && r.jurisprudence.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.jurisprudence_title') + '</h3>';
    r.jurisprudence.forEach(function(j) {
      html += '<div class="jurisprudence">';
      html += '<div class="ref">' + j.ref + '</div>';
      html += '<div class="resume">' + j.resume + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Modele lettre
  if (r.modeleLettre) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.model_letter') + '</h3>';
    html += '<div class="lettre-box">';
    html += '<button class="copy-btn" onclick="copyLettre()">' + t('action.copier') + '</button>';
    html += '<pre id="lettreText">' + r.modeleLettre + '</pre>';
    html += '</div>';
    html += '</div>';
  }

  // Services
  if (r.services && r.services.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.services_title') + '</h3>';
    r.services.forEach(function(s) {
      html += '<div class="service-item">';
      html += '<div><div class="nom">' + s.nom + '</div>';
      if (s.type) html += '<span class="type-tag">' + s.type + '</span>';
      if (s.adresse) html += '<div class="adresse">' + s.adresse + '</div>';
      html += '</div>';
      html += '<div class="service-item-right">';
      if (s.tel) html += '<a href="tel:' + s.tel + '" class="tel">' + s.tel + '</a><br>';
      if (s.url) html += '<a href="' + s.url + '" target="_blank" rel="noopener" class="service-web-link">' + t('action.site_web') + '</a>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  // Action buttons
  html += '<div class="result-actions">';
  html += '<button class="btn btn-print" onclick="window.print()">' + t('action.imprimer') + '</button>';
  html += '<a href="/" class="btn btn-outline">' + t('action.nouvelle_consultation') + '</a>';
  html += '</div>';

  // Upsell premium (discret)
  html += '<div class="upsell">';
  html += '<h3>' + t('upsell.title') + '</h3>';
  html += '<p>' + t('upsell.text') + '</p>';
  html += '<a href="/premium.html" class="btn btn-sm">' + t('upsell.button') + '</a>';
  html += '</div>';

  // Quick feedback widget (1-clic, anonyme, opt-in agrégat) — funnel simple
  // pour augmenter le taux d'outcomes (0 en 9 jours sur la prod). Le formulaire
  // long renderOutcomesPrompt reste disponible plus loin pour les users motivés.
  var caseIdForFeedback = (data.case_id || data.caseId || '');
  if (caseIdForFeedback) {
    html += '<div class="quick-feedback" id="quickFeedback" data-case-id="' + caseIdForFeedback + '">';
    html += '<p class="qf-question">Cette réponse vous a-t-elle aidé ?</p>';
    html += '<div class="qf-buttons">';
    html += '<button type="button" class="qf-btn" data-helpful="true" onclick="submitQuickFeedback(true)">👍 Oui</button>';
    html += '<button type="button" class="qf-btn" data-helpful="false" onclick="submitQuickFeedback(false)">👎 Non</button>';
    html += '</div>';
    html += '<p class="qf-disclaimer">Anonyme. Agrégé pour améliorer les futurs triages.</p>';
    html += '</div>';
  }

  document.getElementById('resultat').innerHTML = html;
}

// Envoie le feedback rapide thumbs up/down (POST /api/outcome — endpoint simple
// existant). Auto-désactive le widget après envoi pour éviter les doubles clics.
//
// IMPORTANT : le backend attend helpful sur l'échelle 1 (non) / 2 (neutre) /
// 3 (oui), pas un booléen. Voir src/services/outcomes-tracker.mjs:465.
// Le mapping ici : true → 3 (👍 oui), false → 1 (👎 non).
function submitQuickFeedback(helpful) {
  var widget = document.getElementById('quickFeedback');
  if (!widget || widget.dataset.submitted === '1') return;
  widget.dataset.submitted = '1';
  var caseId = widget.dataset.caseId;
  var buttons = widget.querySelectorAll('.qf-btn');
  buttons.forEach(function(b) { b.disabled = true; });
  var helpfulScore = helpful ? 3 : 1;
  fetch('/api/outcome', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      case_id: caseId,
      helpful: helpfulScore,
      consent_anon_aggregate: true
    })
  }).then(function(res) {
    var msg = res.ok ? 'Merci pour votre retour.' : 'Retour enregistré localement.';
    widget.innerHTML = '<p class="qf-thanks">✓ ' + msg + '</p>';
  }).catch(function() {
    widget.innerHTML = '<p class="qf-thanks">✓ Merci.</p>';
  });
}
window.submitQuickFeedback = submitQuickFeedback;

function copyLettre() {
  var text = document.getElementById('lettreText').textContent;
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.querySelector('.copy-btn');
    btn.textContent = t('action.copie');
    btn.classList.add('copied');
    setTimeout(function() {
      btn.textContent = t('action.copier');
      btn.classList.remove('copied');
    }, 2000);
  }).catch(function() {
    // Fallback: select text
    var range = document.createRange();
    range.selectNode(document.getElementById('lettreText'));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  });
}

// ===== Loading indicator with rotating messages =====

function getLoadingMessages() {
  if (typeof tLoadingMessages === 'function') return tLoadingMessages('loading_search');
  return [
    t('loading_search.msg_01'), t('loading_search.msg_02'), t('loading_search.msg_03'),
    t('loading_search.msg_04'), t('loading_search.msg_05'), t('loading_search.msg_06'),
    t('loading_search.msg_07'), t('loading_search.msg_08'), t('loading_search.msg_09'),
    t('loading_search.msg_10'), t('loading_search.msg_11'), t('loading_search.msg_12'),
    t('loading_search.msg_13'), t('loading_search.msg_14'), t('loading_search.msg_15'),
    t('loading_search.msg_16'), t('loading_search.msg_17'), t('loading_search.msg_18'),
    t('loading_search.msg_19'), t('loading_search.msg_20')
  ];
}

var loadingInterval = null;

function startLoadingIndicator(container) {
  var msgs = getLoadingMessages();
  var idx = 0;
  container.innerHTML = '<div class="loading-indicator">' +
    '<div class="loading-spinner"></div>' +
    '<div class="loading-message" id="loadingMsg">' + msgs[0] + '</div>' +
    '<div class="loading-sub">' + t('loading_search.sub') + '</div>' +
    '</div>';
  loadingInterval = setInterval(function() {
    idx = (idx + 1) % msgs.length;
    var el = document.getElementById('loadingMsg');
    if (el) {
      el.style.opacity = '0';
      setTimeout(function() {
        if (el) {
          el.textContent = msgs[idx];
          el.style.opacity = '1';
        }
      }, 200);
    }
  }, 2500);
}

function stopLoadingIndicator() {
  if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
}

// ===== Search result page =====

async function loadSearchResultat(query) {
  var container = document.getElementById('resultat');
  startLoadingIndicator(container);

  try {
    var lang = typeof getLang === 'function' ? getLang() : 'fr';
    var res = await fetch('/api/search?q=' + encodeURIComponent(query) + '&lang=' + encodeURIComponent(lang));
    var data = await res.json();
    stopLoadingIndicator();

    if (!res.ok || data.error) {
      container.innerHTML =
        '<div class="error-box">' + (data.error || t('result.no_result')) + '<br><a href="/">' + t('result.back_home') + '</a></div>';
      return;
    }

    if (data.type === 'taxonomie') {
      renderTaxonomieResult(data, query, container);
    } else {
      renderEnrichedResult(data, query, container);
    }
  } catch (e) {
    stopLoadingIndicator();
    container.innerHTML = '<div class="error-box">' + t('result.error_connection') + ' <a href="/">' + t('result.back_home') + '</a></div>';
  }
}

function renderTaxonomieResult(data, query, container) {
  var q = data.qualification || {};
  var html = '';

  html += '<div class="result-query-echo"><span class="result-query-label">' + t('result.your_search') + '</span> ' + escHtml(query) + '</div>';

  html += '<div class="card-highlight">';
  html += '<h3>' + t('result.juridical_qualification') + '</h3>';
  html += '<p>' + escHtml(data.suggestion || t('result.juridical_qualification')) + '</p>';
  if (q.domaine) html += '<p class="result-domaine-tag">' + escHtml(q.domaine) + '</p>';
  html += '</div>';

  // Premium CTA
  html += renderPremiumCTA();

  if (q.qualification_juridique) {
    html += '<div class="card">';
    html += '<h3>' + t('result.qualification') + '</h3>';
    html += '<p>' + escHtml(q.qualification_juridique) + '</p>';
    html += '</div>';
  }

  html += renderSearchActions(query);
  container.innerHTML = html;
}

function renderEnrichedResult(data, query, container) {
  var html = '';
  var delay = 0;

  function stagger() {
    delay += 0.07;
    return ' style="animation-delay:' + delay.toFixed(2) + 's"';
  }

  // Confidence badge helper
  function confidenceBadge(level) {
    var label = t('confidence.' + (level || 'incertain')) || level || t('confidence.incertain');
    var cls = 'confidence-' + (level || 'incertain');
    return '<span class="confidence-badge ' + cls + '"><span class="confidence-dot"></span>' + label + '</span>';
  }

  // Tier badge helper
  function tierBadge(tier) {
    if (!tier) return '';
    var label = t('tier.' + tier) || ('T' + tier);
    return '<span class="tier-badge tier-' + tier + '">' + label + '</span>';
  }

  // Query echo
  html += '<div class="result-query-echo"><span class="result-query-label">' + t('result.your_search') + '</span> ' + escHtml(query) + '</div>';

  // Main fiche summary + confidence
  var fiche = data.fiche || {};
  var confiance = data.confiance || 'incertain';
  var explication = fiche.explication || (fiche.reponse && fiche.reponse.explication) || fiche.description || (data.llm_triage && data.llm_triage.resume) || (data.fiche && data.fiche.tags ? data.fiche.tags.join(', ') : '');
  if (explication) {
    html += '<div class="card-highlight"' + stagger() + '>';
    html += '<div class="result-header">';
    html += '<h3>' + t('result.your_situation') + '</h3>';
    html += confidenceBadge(confiance);
    html += '</div>';
    html += '<p>' + escHtml(explication) + '</p>';
    if (fiche.domaine) html += '<p class="result-domaine-tag">' + escHtml(fiche.domaine) + '</p>';
    html += '</div>';
  }

  // Lacunes (coverage gaps) — show what we DON'T know
  var lacunes = data.lacunes || [];
  if (lacunes.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.lacunes_title') + '</h3>';
    lacunes.forEach(function(l) {
      html += '<div class="lacune-box">';
      html += '<div class="lacune-type">' + escHtml(l.type || t('result.lacune_type_default')) + '</div>';
      html += '<p>' + escHtml(l.message || '') + '</p>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Premium CTA
  html += renderPremiumCTA();

  // Quick actions
  html += '<div class="result-actions"' + stagger() + '>';
  html += '<button class="btn btn-sm btn-print" onclick="window.print()">' + t('action.imprimer_short') + '</button>';
  html += '<a href="/" class="btn btn-sm btn-outline">' + t('action.nouvelle_recherche') + '</a>';
  html += '<a href="/annuaire.html" class="btn btn-sm btn-secondary">' + t('nav.annuaire') + '</a>';
  html += '</div>';

  // Delais — V3 card design (show ALL, not just urgent)
  var delais = data.delais || [];
  if (delais.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.delais_title') + '</h3>';
    delais.slice(0, 5).forEach(function(d) {
      html += '<div class="delai-card">';
      html += '<div class="delai-value">' + escHtml(d.duree || d.delai || '?') + '</div>';
      html += '<div class="delai-info">';
      html += '<div class="delai-procedure">' + escHtml(d.procedure || d.nom || d.label || '') + '</div>';
      if (d.consequence) html += '<div class="delai-consequence">' + escHtml(d.consequence) + '</div>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  // Articles de loi — with tier badges
  var articles = data.articles || [];
  if (articles.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.articles_title') + '</h3>';
    articles.forEach(function(a) {
      var lien = a.lienFedlex || a.lien || ('https://www.fedlex.admin.ch/search?q=' + encodeURIComponent(a.ref || ''));
      html += '<a href="' + escAttr(lien) + '" target="_blank" rel="noopener" class="article-link">';
      html += '<span class="ref">' + escHtml(a.ref || '') + '</span>';
      html += tierBadge(a.lienFedlex ? 1 : 3);
      if (a.titre) html += ' <span class="titre">&mdash; ' + escHtml(a.titre) + '</span>';
      html += '</a>';
    });
    html += '</div>';
  }

  // Barèmes de référence (loaded async for bail domain)
  var ficheDomaine = (data.fiche || {}).domaine;
  if (ficheDomaine === 'bail') {
    html += '<div class="card" id="baremes-card" style="display:none"' + stagger() + '>';
    html += '<h3>' + t('result.baremes_title') + '</h3>';
    html += '<div id="baremes-content"></div>';
    html += '</div>';
    // Async load
    fetch('/api/baremes/taux-hypothecaire').then(function(r) { return r.json(); }).then(function(b) {
      if (b.valeur_actuelle) {
        var el = document.getElementById('baremes-content');
        var card = document.getElementById('baremes-card');
        if (el && card) {
          card.style.display = '';
          el.innerHTML = '<div class="delai-card">' +
            '<div class="delai-value">' + b.valeur_actuelle.taux + '%</div>' +
            '<div class="delai-info">' +
            '<div class="delai-procedure">' + t('result.baremes_label') + '</div>' +
            '<div class="delai-consequence">' + t('result.baremes_consequence').replace('{{date}}', b.valeur_actuelle.date_publication || '') + '</div>' +
            '</div></div>';
        }
      }
    }).catch(function() {});
  }

  // Caselaw canon 2.0 — priorité au rendu hiérarchique si disponible
  var canon = data.caselaw_canon;
  if (canon && (canon.leading_cases?.length || canon.nuances?.length || canon.cantonal_practice?.length)) {
    html += '<div class="card caselaw-canon"' + stagger() + '>';
    html += '<h3>' + t('result.caselaw_canon') + '</h3>';

    if (canon.leading_cases && canon.leading_cases.length) {
      html += '<h4 class="canon-section">' + t('result.leading_cases') + '</h4>';
      canon.leading_cases.slice(0, 3).forEach(function(lc) {
        html += renderCanonCase(lc, 'leading');
      });
    }
    if (canon.nuances && canon.nuances.length) {
      html += '<h4 class="canon-section">' + t('result.nuances') + '</h4>';
      canon.nuances.slice(0, 2).forEach(function(nc) {
        html += renderCanonCase(nc, 'nuance');
      });
    }
    if (canon.cantonal_practice && canon.cantonal_practice.length) {
      html += '<h4 class="canon-section">' + t('result.cantonal_practice') + '</h4>';
      canon.cantonal_practice.slice(0, 3).forEach(function(cp) {
        html += renderCanonCase(cp, 'cantonal');
      });
    }
    if (canon.similar_cases && canon.similar_cases.length) {
      html += '<details class="canon-similar">';
      html += '<summary>' + t('result.similar_cases_count', { count: canon.similar_cases.length }) + '</summary>';
      canon.similar_cases.slice(0, 10).forEach(function(sc) {
        html += renderCanonCase(sc, 'similar');
      });
      html += '</details>';
    }
    html += '</div>';
  }

  // Jurisprudence — V3 card design with role badges (legacy / compat)
  var juris = data.jurisprudence || data.jurisprudenceElargie || [];
  if (juris.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.jurisprudence_title') + '</h3>';
    // Show up to 3 favorable + 2 défavorable for contradictoire
    var favJuris = juris.filter(function(j) { return j.role === 'favorable'; }).slice(0, 3);
    var contraJuris = juris.filter(function(j) { return j.role === 'defavorable'; }).slice(0, 2);
    var neutreJuris = juris.filter(function(j) { return j.role === 'neutre' || !j.role; }).slice(0, 2);
    var displayJuris = favJuris.concat(contraJuris).concat(neutreJuris);

    displayJuris.forEach(function(j) {
      var roleCls = j.role || 'neutre';
      var roleLabel = t('role.' + roleCls);

      html += '<div class="juris-card">';
      html += '<div class="juris-header">';
      html += '<span class="role-badge role-' + roleCls + '">' + roleLabel + '</span>';
      html += '<span class="ref">' + escHtml(j.signature || j.ref || '') + '</span>';
      html += tierBadge(2);
      if (j.date) html += '<span class="juris-date">' + escHtml(j.date) + '</span>';
      html += '</div>';
      html += '<div class="resume">' + escHtml(j.resume || j.description || '') + '</div>';
      if (j.principeCle) html += '<div class="juris-principle">' + escHtml(j.principeCle) + '</div>';
      if (j.fourchetteMontant) {
        var fm = j.fourchetteMontant;
        html += '<div class="juris-range">' + escHtml(fm.min || '') + ' &mdash; ' + escHtml(fm.max || '') + (fm.median ? ' (' + t('result.median_label') + ': ' + escHtml(fm.median) + ')' : '') + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // Templates (modeles de lettres)
  var templates = data.templates || [];
  if (templates.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.templates_title') + '</h3>';
    templates.forEach(function(tpl, i) {
      var tplId = 'tpl-' + i;
      html += '<div class="template-item">';
      html += '<div class="template-header" onclick="toggleTemplate(\'' + tplId + '\')">';
      html += '<span class="template-title">' + escHtml(tpl.nom || tpl.titre || tpl.type || t('result.model_letter')) + '</span>';
      html += '<span class="template-toggle" id="toggle-' + tplId + '">' + t('action.afficher') + '</span>';
      html += '</div>';
      html += '<div class="lettre-box hidden" id="' + tplId + '">';
      html += '<button class="copy-btn" onclick="copyTemplate(\'' + tplId + '\')">' + t('action.copier') + '</button>';
      html += '<pre id="text-' + tplId + '">' + escHtml(tpl.contenu || tpl.template || tpl.texte || '') + '</pre>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Anti-erreurs — V3 card design with severity
  var antiErreurs = data.antiErreurs || [];
  if (antiErreurs.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.anti_erreurs_title') + '</h3>';
    antiErreurs.slice(0, 4).forEach(function(ae) {
      var gravite = (ae.gravite || 'moyenne').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var icon = gravite === 'critique' ? '!' : gravite === 'elevee' ? '!' : '!';
      html += '<div class="ae-card">';
      html += '<div class="ae-icon ' + escAttr(gravite) + '">' + icon + '</div>';
      html += '<div class="ae-content">';
      html += '<div class="ae-title">' + escHtml(ae.erreur || ae.titre || '') + '</div>';
      if (ae.consequence) html += '<div class="ae-consequence">' + escHtml(ae.consequence) + '</div>';
      if (ae.correction || ae.correctif || ae.conseil) html += '<div class="ae-correction">' + escHtml(ae.correction || ae.correctif || ae.conseil) + '</div>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  // Services / escalade
  var escalade = data.escalade || [];
  if (escalade.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.services_title') + '</h3>';
    escalade.slice(0, 5).forEach(function(s) {
      html += '<div class="service-item">';
      html += '<div><div class="nom">' + escHtml(s.nom || s.service || '') + '</div>';
      if (s.type) html += '<span class="type-tag">' + escHtml(s.type) + '</span>';
      if (s.description) html += '<div class="adresse">' + escHtml(s.description) + '</div>';
      html += '</div>';
      html += '<div class="service-item-right">';
      if (s.tel) html += '<a href="tel:' + escAttr(s.tel) + '" class="tel">' + escHtml(s.tel) + '</a><br>';
      if (s.url) html += '<a href="' + escAttr(s.url) + '" target="_blank" rel="noopener" class="service-web-link">' + t('action.site_web') + '</a>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  // Alternatives
  var alts = data.alternatives || [];
  if (alts.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.alternatives_title') + '</h3>';
    alts.forEach(function(a) {
      html += '<a href="/resultat.html?fiche=' + escAttr(a.id) + '" class="alt-link">';
      html += escHtml(a.id.replace(/_/g, ' '));
      html += '<span class="alt-arrow">&rarr;</span></a>';
    });
    html += '</div>';
  }

  // V4: Vulgarisation — citizen-friendly Q&As
  var vulg = data.vulgarisation || null;
  if (vulg && vulg.questions_citoyennes && vulg.questions_citoyennes.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.vulg_title') + '</h3>';
    vulg.questions_citoyennes.slice(0, 5).forEach(function(q, i) {
      var qId = 'vulg-' + i;
      html += '<div class="vulg-qa">';
      html += '<div class="vulg-question" onclick="toggleTemplate(\'' + qId + '\')">';
      html += '<span class="vulg-q-mark">?</span>';
      html += '<span>' + escHtml(q.question) + '</span>';
      html += '<span class="template-toggle" id="toggle-' + qId + '">+</span>';
      html += '</div>';
      html += '<div class="hidden vulg-answer" id="' + qId + '">';
      html += '<div class="vulg-short"><strong>' + escHtml(q.reponse_courte) + '</strong></div>';
      html += '<div class="vulg-detail">' + escHtml(q.reponse_detail) + '</div>';
      html += '<div class="vulg-source">' + t('result.source_asloca_kit', { number: q.numero || '' }) + '</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // V4: Vulgarisation anti-erreurs (supplement existing)
  if (vulg && vulg.anti_erreurs && vulg.anti_erreurs.length && (!antiErreurs || antiErreurs.length === 0)) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.anti_erreurs_title') + '</h3>';
    vulg.anti_erreurs.slice(0, 4).forEach(function(ae) {
      html += '<div class="ae-card">';
      html += '<div class="ae-icon elevee">!</div>';
      html += '<div class="ae-content">';
      html += '<div class="ae-title">' + escHtml(ae.erreur) + '</div>';
      html += '<div class="ae-source">' + t('result.source_asloca_ref', { ref: ae.question_ref || '' }) + '</div>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  // V4: Vulgarisation deadlines (supplement existing)
  if (vulg && vulg.delais && vulg.delais.length && (!delais || delais.length === 0)) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.delais_title') + '</h3>';
    vulg.delais.forEach(function(d) {
      html += '<div class="delai-card">';
      html += '<div class="delai-value">' + escHtml(d.delai) + '</div>';
      html += '<div class="delai-info">';
      html += '<div class="delai-procedure">' + escHtml(d.contexte) + '</div>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  // V4: Normative rules — applicable legal rules
  var normRules = data.normative_rules || [];
  if (normRules.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>' + t('result.normative_rules_title') + '</h3>';
    normRules.slice(0, 5).forEach(function(r) {
      html += '<div class="norm-rule">';
      html += '<div class="norm-rule-header">';
      html += '<span class="norm-rule-label">' + escHtml(r.label) + '</span>';
      html += '<span class="tier-badge tier-1">' + escHtml(r.base_legale) + '</span>';
      html += '</div>';
      if (r.consequence_text) html += '<div class="norm-rule-text">' + escHtml(r.consequence_text) + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Source footer — meta stats
  var meta = data._meta || {};
  html += '<div class="source-footer">';
  var footerText = t('result.source_footer')
    .replace('{{articles}}', meta.articlesCount || articles.length || 0)
    .replace('{{arrets}}', meta.jurisprudenceCount || juris.length || 0);
  html += '<span>' + footerText;
  if (vulg) html += ', <span class="source-count">' + t('result.source_asloca_short') + '</span>';
  if (normRules.length) html += ', <span class="source-count">' + t('result.source_rules').replace('{{count}}', normRules.length) + '</span>';
  html += '</span></div>';

  // Suggested follow-up questions
  var suggestions = data.suggested_questions || [];
  if (suggestions.length) {
    html += '<div class="suggested-questions"' + stagger() + '>';
    html += '<h3>' + t('suggested.title') + '</h3>';
    html += '<p class="suggested-intro">' + t('suggested.intro') + '</p>';
    html += '<div class="suggestion-list">';
    suggestions.forEach(function(s) {
      var encodedQuery = encodeURIComponent(s.query || s.text);
      html += '<a href="/resultat.html?q=' + encodedQuery + '" class="suggestion-card">';
      html += '<span class="suggestion-text">' + escHtml(s.text) + '</span>';
      html += '<span class="suggestion-arrow">&rarr;</span>';
      html += '</a>';
    });
    html += '</div>';
    html += '</div>';
  }

  // Feedback widget
  var feedbackFicheId = (data.fiche || {}).id || 'unknown';
  html += '<div class="feedback-widget" id="feedback-widget" data-fiche="' + escAttr(feedbackFicheId) + '">';
  html += '<p>' + t('feedback.question') + '</p>';
  html += '<button class="btn btn-sm btn-feedback-yes" onclick="sendFeedback(\'oui\')">' + t('feedback.yes') + '</button>';
  html += '<button class="btn btn-sm btn-feedback-no" onclick="sendFeedback(\'non\')">' + t('feedback.no') + '</button>';
  html += '</div>';

  // Bottom actions
  html += renderSearchActions(query, true);

  // Bottom CTA is already in renderPremiumCTA above

  container.innerHTML = html;

  // Hook citizen-ui.js : bouton "Générer une lettre" + outcomes prompt
  // Non-intrusif : no-op si citizen-ui.js pas chargé ou données manquantes.
  try {
    var caseId = data.case_id || data.sessionId;
    var ficheIdForLetter = (data.fiche && data.fiche.id) || data.ficheId;
    if (caseId && ficheIdForLetter && typeof window.renderLetterButton === 'function') {
      window.renderLetterButton({
        case_id: caseId,
        ficheId: ficheIdForLetter,
        parentSelector: '.result-page-inner'
      });
    }
    // Outcomes prompt : seulement sur triage final complet (pas lors d'un refine intermédiaire)
    if (caseId && data.complet !== false && typeof window.renderOutcomesPrompt === 'function') {
      window.renderOutcomesPrompt(caseId, ficheIdForLetter, data.domaine, {
        container: '.result-page-inner'
      });
    }
  } catch (_) { /* silent */ }
}

// Rendu d'un cas canon (leading / nuance / cantonal / similar)
function renderCanonCase(c, kind) {
  var roleCls = c.role_citizen || 'neutre';
  var roleLabel = t('role.' + roleCls);
  if (!roleLabel || roleLabel === ('role.' + roleCls)) roleLabel = roleCls;
  var tierLabel = c.tier_label || ('Tier ' + (c.tier || '?'));
  var html = '<div class="canon-card canon-' + kind + '">';
  html += '<div class="canon-header">';
  if (c.signature) html += '<span class="canon-sig">' + escHtml(c.signature) + '</span>';
  html += '<span class="canon-tier tier-' + (c.tier || 4) + '">' + escHtml(tierLabel) + '</span>';
  if (c.canton) html += '<span class="canon-canton">' + escHtml(c.canton) + '</span>';
  if (c.date) html += '<span class="canon-date">' + escHtml(c.date) + '</span>';
  html += '<span class="canon-role role-' + roleCls + '">' + escHtml(roleLabel) + '</span>';
  html += '</div>';
  if (c.citizen_summary) {
    html += '<div class="canon-summary">' + escHtml(c.citizen_summary) + '</div>';
  }
  if (c.court) html += '<div class="canon-court">' + escHtml(c.court) + '</div>';
  if (c.article_refs_resolved && c.article_refs_resolved.length) {
    var refs = c.article_refs_resolved.filter(function(r) { return r.resolved; }).slice(0, 3).map(function(r) { return r.ref; });
    if (refs.length) html += '<div class="canon-refs">' + t('result.articles_label') + ' : ' + escHtml(refs.join(', ')) + '</div>';
  }
  if (c.url) html += '<a href="' + escHtml(c.url) + '" target="_blank" rel="noopener" class="canon-source">' + t('result.source_label') + '</a>';
  html += '</div>';
  return html;
}

function renderPremiumCTA() {
  return '<div class="premium-cta-result">' +
    '<div class="premium-cta-result-header">' +
    '<strong>' + t('premiumcta_result.title') + '</strong>' +
    '<span class="badge badge-info">' + t('premiumcta_result.badge') + '</span>' +
    '</div>' +
    '<p>' + t('premiumcta_result.intro') + '</p>' +
    '<div class="premium-cta-result-grid">' +
    '<div class="premium-cta-result-item">' +
    '<strong>' + t('premiumcta_result.q_title') + '</strong>' +
    '<span>' + t('premiumcta_result.q_text') + '</span>' +
    '</div>' +
    '<div class="premium-cta-result-item">' +
    '<strong>' + t('premiumcta_result.arg_title') + '</strong>' +
    '<span>' + t('premiumcta_result.arg_text') + '</span>' +
    '</div>' +
    '<div class="premium-cta-result-item">' +
    '<strong>' + t('premiumcta_result.cert_title') + '</strong>' +
    '<span>' + t('premiumcta_result.cert_text') + '</span>' +
    '</div>' +
    '<div class="premium-cta-result-item">' +
    '<strong>' + t('premiumcta_result.letter_title') + '</strong>' +
    '<span>' + t('premiumcta_result.letter_text') + '</span>' +
    '</div>' +
    '</div>' +
    '<a href="/premium.html" class="btn btn-primary btn-lg">' + t('premiumcta_result.button') + '</a>' +
    '</div>';
}

function renderSearchActions(query, isBottom) {
  var cls = isBottom ? 'result-actions result-actions-bottom' : 'result-actions';
  var html = '<div class="' + cls + '">';
  html += '<button class="btn btn-sm btn-print" onclick="window.print()">' + t('action.imprimer_short') + '</button>';
  html += '<a href="/" class="btn btn-sm btn-outline">' + t('action.nouvelle_recherche') + '</a>';
  html += '<a href="/annuaire.html" class="btn btn-sm btn-secondary">' + t('nav.annuaire') + '</a>';
  html += '</div>';
  return html;
}

function sendFeedback(rating) {
  var widget = document.getElementById('feedback-widget');
  if (!widget) return;
  var ficheId = widget.getAttribute('data-fiche') || 'unknown';
  fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ficheId: ficheId, rating: rating })
  }).catch(function() {});
  widget.innerHTML = '<p class="feedback-thanks">' + t('feedback.thanks') + '</p>';
}

function toggleTemplate(id) {
  var box = document.getElementById(id);
  var toggle = document.getElementById('toggle-' + id);
  if (!box) return;
  if (box.classList.contains('hidden')) {
    box.classList.remove('hidden');
    if (toggle) toggle.textContent = t('action.masquer');
  } else {
    box.classList.add('hidden');
    if (toggle) toggle.textContent = t('action.afficher');
  }
}

function copyTemplate(id) {
  var el = document.getElementById('text-' + id);
  if (!el) return;
  var text = el.textContent;
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.querySelector('#' + id + ' .copy-btn');
    if (btn) {
      btn.textContent = t('action.copie');
      btn.classList.add('copied');
      setTimeout(function() { btn.textContent = t('action.copier'); btn.classList.remove('copied'); }, 2000);
    }
  }).catch(function() {
    var range = document.createRange();
    range.selectNode(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  });
}

function escHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(s) {
  if (!s) return '';
  return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
