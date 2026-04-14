// JusticePourtous Frontend Logic
// Vanilla JS — zero framework, zero deps

var currentQuestions = [];
var currentAnswers = [];
var currentStep = 0;
var currentDomaine = '';

// ===== Consultation flow =====

async function initConsultation(domaine) {
  currentDomaine = domaine;
  currentAnswers = [];
  currentStep = 0;

  try {
    var res = await fetch('/api/domaines/' + domaine + '/questions');
    if (!res.ok) throw new Error('Erreur ' + res.status);
    var data = await res.json();
    currentQuestions = data.questions || [];
    if (currentQuestions.length === 0) throw new Error('Aucune question');
    showQuestion();
  } catch (e) {
    var card = document.getElementById('questionCard');
    if (card) card.classList.add('hidden');
    var errBox = document.getElementById('errorBox');
    if (errBox) {
      errBox.textContent = t('error.charge_failed') + ' ';
      var link = document.createElement('a');
      link.href = '/';
      link.textContent = t('result.back_home');
      errBox.appendChild(link);
      errBox.classList.remove('hidden');
    }
  }
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
        canton: canton
      })
    });

    if (!res.ok) throw new Error('Erreur ' + res.status);

    var data = await res.json();
    if (data.fiche) {
      sessionStorage.setItem('jb_result', JSON.stringify(data));
      window.location.href = '/resultat.html?fiche=' + data.fiche.id;
    } else {
      throw new Error('Aucune fiche trouvée');
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
      var res = await fetch('/api/fiches/' + ficheId);
      if (!res.ok) throw new Error('Fiche non trouvée');
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

  document.getElementById('resultat').innerHTML = html;
}

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
    var res = await fetch('/api/search?q=' + encodeURIComponent(query));
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
  var explication = fiche.explication || fiche.description || (data.fiche && data.fiche.tags ? data.fiche.tags.join(', ') : '');
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

  // Jurisprudence — V3 card design with role badges
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
        html += '<div class="juris-range">' + escHtml(fm.min || '') + ' &mdash; ' + escHtml(fm.max || '') + (fm.median ? ' (médian: ' + escHtml(fm.median) + ')' : '') + '</div>';
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
      html += '<div class="vulg-source">Source: ASLOCA Kit ' + escHtml(q.numero || '') + '</div>';
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
      html += '<div class="ae-source">Source: ASLOCA ' + escHtml(ae.question_ref || '') + '</div>';
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
  if (vulg) html += ', <span class="source-count">ASLOCA Kit</span>';
  if (normRules.length) html += ', <span class="source-count">' + t('result.source_rules').replace('{{count}}', normRules.length) + '</span>';
  html += '</span></div>';

  // Bottom actions
  html += renderSearchActions(query, true);

  // Bottom CTA is already in renderPremiumCTA above

  container.innerHTML = html;
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
