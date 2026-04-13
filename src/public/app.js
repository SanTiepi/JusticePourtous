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
      errBox.textContent = 'Impossible de charger les questions. ';
      var link = document.createElement('a');
      link.href = '/';
      link.textContent = "Retour à l'accueil";
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
  if (progressText) progressText.textContent = 'Question ' + (currentStep + 1) + ' sur ' + total;

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
    nextBtn.textContent = (currentStep === total - 1) ? 'Voir mes droits' : 'Suivant';
  }

  // Render options
  var optionsDiv = document.getElementById('options');

  if (q.type === 'canton') {
    var cantons = ['AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH'];
    var sel = '<select class="select w-full" onchange="selectCanton(this.value)">';
    sel += '<option value="">-- Canton --</option>';
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
  if (card) card.innerHTML = '<div class="loading">Analyse en cours</div>';

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
      card.innerHTML = '<div class="error-box">Erreur lors de l\'analyse. <a href="/">Retour à l\'accueil</a></div>';
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
      document.getElementById('resultat').innerHTML = '<div class="error-box">Fiche non trouvée. <a href="/">Retour à l\'accueil</a></div>';
      return;
    }
  }

  var fiche = data.fiche;
  if (!fiche) {
    document.getElementById('resultat').innerHTML = '<div class="error-box">Fiche non trouvée. <a href="/">Retour à l\'accueil</a></div>';
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
  html += '<h3>Votre situation</h3>';
  html += '<p>' + r.explication + '</p>';
  html += '</div>';

  // Avocat CTA — toujours visible apres le resume
  html += '<div class="avocat-cta">';
  html += '<div class="avocat-cta-text">';
  html += '<strong>Situation complexe ou urgente ?</strong>';
  html += '<p>Trouvez un service juridique gratuit ou un avocat dans votre canton.</p>';
  html += '</div>';
  html += '<a href="/annuaire.html" class="btn btn-red">J\'ai besoin d\'un avocat</a>';
  html += '</div>';

  // Articles de loi
  if (r.articles && r.articles.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>Articles de loi applicables</h3>';
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
    html += '<h3>Jurisprudence du Tribunal fédéral</h3>';
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
    html += '<h3>Modèle de lettre</h3>';
    html += '<div class="lettre-box">';
    html += '<button class="copy-btn" onclick="copyLettre()">Copier</button>';
    html += '<pre id="lettreText">' + r.modeleLettre + '</pre>';
    html += '</div>';
    html += '</div>';
  }

  // Services
  if (r.services && r.services.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>Services compétents</h3>';
    r.services.forEach(function(s) {
      html += '<div class="service-item">';
      html += '<div><div class="nom">' + s.nom + '</div>';
      if (s.type) html += '<span class="type-tag">' + s.type + '</span>';
      if (s.adresse) html += '<div class="adresse">' + s.adresse + '</div>';
      html += '</div>';
      html += '<div class="service-item-right">';
      if (s.tel) html += '<a href="tel:' + s.tel + '" class="tel">' + s.tel + '</a><br>';
      if (s.url) html += '<a href="' + s.url + '" target="_blank" rel="noopener" class="service-web-link">Site web</a>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  // Action buttons
  html += '<div class="result-actions">';
  html += '<button class="btn btn-print" onclick="window.print()">Imprimer / Sauvegarder PDF</button>';
  html += '<a href="/" class="btn btn-outline">Nouvelle consultation</a>';
  html += '</div>';

  // Upsell premium (discret)
  html += '<div class="upsell">';
  html += '<h3>Besoin d\'une analyse personnalisée ?</h3>';
  html += '<p>Notre IA analyse votre situation en détail pour CHF 0.03 à 0.10 par question.</p>';
  html += '<a href="/premium.html" class="btn btn-sm">Espace Premium</a>';
  html += '</div>';

  // Routage ecosysteme
  if (r.routageEcosysteme && Object.keys(r.routageEcosysteme).length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>Vous pourriez aussi être intéressé par</h3>';
    Object.entries(r.routageEcosysteme).forEach(function(entry) {
      var key = entry[0], val = entry[1];
      html += '<p><a href="https://' + val.url + '" target="_blank" rel="noopener">' + key + '</a> &mdash; ' + val.condition + '</p>';
    });
    html += '</div>';
  }

  document.getElementById('resultat').innerHTML = html;
}

function copyLettre() {
  var text = document.getElementById('lettreText').textContent;
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.querySelector('.copy-btn');
    btn.textContent = 'Copie !';
    btn.classList.add('copied');
    setTimeout(function() {
      btn.textContent = 'Copier';
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

// ===== Search result page =====

async function loadSearchResultat(query) {
  var container = document.getElementById('resultat');
  container.innerHTML = '<div class="loading">Analyse en cours</div>';

  try {
    var res = await fetch('/api/search?q=' + encodeURIComponent(query));
    var data = await res.json();

    if (!res.ok || data.error) {
      container.innerHTML =
        '<div class="error-box">' + (data.error || 'Aucun résultat') + '<br><a href="/">Retour à l\'accueil</a></div>';
      return;
    }

    if (data.type === 'taxonomie') {
      renderTaxonomieResult(data, query, container);
    } else {
      renderEnrichedResult(data, query, container);
    }
  } catch (e) {
    container.innerHTML = '<div class="error-box">Erreur de connexion. <a href="/">Retour à l\'accueil</a></div>';
  }
}

function renderTaxonomieResult(data, query, container) {
  var q = data.qualification || {};
  var html = '';

  html += '<div class="result-query-echo"><span class="result-query-label">Votre recherche</span> ' + escHtml(query) + '</div>';

  html += '<div class="card-highlight">';
  html += '<h3>Qualification juridique</h3>';
  html += '<p>' + escHtml(data.suggestion || 'Votre problème relève du domaine juridique suivant.') + '</p>';
  if (q.domaine) html += '<p class="result-domaine-tag">' + escHtml(q.domaine) + '</p>';
  html += '</div>';

  // Avocat CTA
  html += '<div class="avocat-cta">';
  html += '<div class="avocat-cta-text">';
  html += '<strong>Situation complexe ou urgente ?</strong>';
  html += '<p>Trouvez un service juridique gratuit ou un avocat dans votre canton.</p>';
  html += '</div>';
  html += '<a href="/annuaire.html" class="btn btn-red">J\'ai besoin d\'un avocat</a>';
  html += '</div>';

  if (q.qualification_juridique) {
    html += '<div class="card">';
    html += '<h3>Qualification</h3>';
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
    var labels = { certain: 'Certain', probable: 'Probable', variable: 'Variable', incertain: 'Incertain' };
    var label = labels[level] || level || 'Inconnu';
    var cls = 'confidence-' + (level || 'incertain');
    return '<span class="confidence-badge ' + cls + '"><span class="confidence-dot"></span>' + label + '</span>';
  }

  // Tier badge helper
  function tierBadge(tier) {
    if (!tier) return '';
    var labels = { 1: 'LOI', 2: 'TF', 3: 'PRATIQUE' };
    return '<span class="tier-badge tier-' + tier + '">' + (labels[tier] || 'T' + tier) + '</span>';
  }

  // Query echo
  html += '<div class="result-query-echo"><span class="result-query-label">Votre recherche</span> ' + escHtml(query) + '</div>';

  // Main fiche summary + confidence
  var fiche = data.fiche || {};
  var confiance = data.confiance || 'incertain';
  var explication = fiche.explication || fiche.description || (data.fiche && data.fiche.tags ? data.fiche.tags.join(', ') : '');
  if (explication) {
    html += '<div class="card-highlight"' + stagger() + '>';
    html += '<div class="result-header">';
    html += '<h3>Votre situation</h3>';
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
    html += '<h3>Ce que nous ne savons pas encore</h3>';
    lacunes.forEach(function(l) {
      html += '<div class="lacune-box">';
      html += '<div class="lacune-type">' + escHtml(l.type || 'Information manquante') + '</div>';
      html += '<p>' + escHtml(l.message || '') + '</p>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Avocat CTA
  html += '<div class="avocat-cta"' + stagger() + '>';
  html += '<div class="avocat-cta-text">';
  html += '<strong>Situation complexe ou urgente ?</strong>';
  html += '<p>Trouvez un service juridique gratuit ou un avocat dans votre canton.</p>';
  html += '</div>';
  html += '<a href="/annuaire.html" class="btn btn-red">J\'ai besoin d\'un avocat</a>';
  html += '</div>';

  // Quick actions
  html += '<div class="result-actions"' + stagger() + '>';
  html += '<button class="btn btn-sm btn-print" onclick="window.print()">Imprimer / PDF</button>';
  html += '<a href="/" class="btn btn-sm btn-outline">Nouvelle recherche</a>';
  html += '<a href="/annuaire.html" class="btn btn-sm btn-secondary">Annuaire</a>';
  html += '</div>';

  // Delais — V3 card design (show ALL, not just urgent)
  var delais = data.delais || [];
  if (delais.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>Délais à connaître</h3>';
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
    html += '<h3>Articles de loi applicables</h3>';
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
    html += '<h3>Taux de référence</h3>';
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
            '<div class="delai-procedure">Taux hypothécaire de référence OFL</div>' +
            '<div class="delai-consequence">Base pour contester une augmentation de loyer (CO 269a). Publié le ' + (b.valeur_actuelle.date_publication || '') + '</div>' +
            '</div></div>';
        }
      }
    }).catch(function() {});
  }

  // Jurisprudence — V3 card design with role badges
  var juris = data.jurisprudence || data.jurisprudenceElargie || [];
  if (juris.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>Jurisprudence du Tribunal fédéral</h3>';
    // Show up to 3 favorable + 2 défavorable for contradictoire
    var favJuris = juris.filter(function(j) { return j.role === 'favorable'; }).slice(0, 3);
    var contraJuris = juris.filter(function(j) { return j.role === 'defavorable'; }).slice(0, 2);
    var neutreJuris = juris.filter(function(j) { return j.role === 'neutre' || !j.role; }).slice(0, 2);
    var displayJuris = favJuris.concat(contraJuris).concat(neutreJuris);

    displayJuris.forEach(function(j) {
      var roleCls = j.role || 'neutre';
      var roleLabel = roleCls === 'favorable' ? 'Favorable' : roleCls === 'defavorable' ? 'Défavorable' : 'Neutre';

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
    html += '<h3>Modèles de lettres</h3>';
    templates.forEach(function(t, i) {
      var tplId = 'tpl-' + i;
      html += '<div class="template-item">';
      html += '<div class="template-header" onclick="toggleTemplate(\'' + tplId + '\')">';
      html += '<span class="template-title">' + escHtml(t.nom || t.titre || t.type || 'Modèle') + '</span>';
      html += '<span class="template-toggle" id="toggle-' + tplId + '">Afficher</span>';
      html += '</div>';
      html += '<div class="lettre-box hidden" id="' + tplId + '">';
      html += '<button class="copy-btn" onclick="copyTemplate(\'' + tplId + '\')">Copier</button>';
      html += '<pre id="text-' + tplId + '">' + escHtml(t.contenu || t.template || t.texte || '') + '</pre>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Anti-erreurs — V3 card design with severity
  var antiErreurs = data.antiErreurs || [];
  if (antiErreurs.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>Erreurs à éviter</h3>';
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
    html += '<h3>Services compétents</h3>';
    escalade.slice(0, 5).forEach(function(s) {
      html += '<div class="service-item">';
      html += '<div><div class="nom">' + escHtml(s.nom || s.service || '') + '</div>';
      if (s.type) html += '<span class="type-tag">' + escHtml(s.type) + '</span>';
      if (s.description) html += '<div class="adresse">' + escHtml(s.description) + '</div>';
      html += '</div>';
      html += '<div class="service-item-right">';
      if (s.tel) html += '<a href="tel:' + escAttr(s.tel) + '" class="tel">' + escHtml(s.tel) + '</a><br>';
      if (s.url) html += '<a href="' + escAttr(s.url) + '" target="_blank" rel="noopener" class="service-web-link">Site web</a>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  // Alternatives
  var alts = data.alternatives || [];
  if (alts.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>Situations similaires</h3>';
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
    html += '<h3>Questions fréquentes des citoyens</h3>';
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
    html += '<h3>Erreurs à éviter</h3>';
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
    html += '<h3>Délais à connaître</h3>';
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
    html += '<h3>Règles juridiques applicables</h3>';
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
  html += '<span>Sources : <span class="source-count">' + (meta.articlesCount || articles.length || 0) + ' articles</span>, ';
  html += '<span class="source-count">' + (meta.jurisprudenceCount || juris.length || 0) + ' arrêts</span>';
  if (vulg) html += ', <span class="source-count">ASLOCA Kit</span>';
  if (normRules.length) html += ', <span class="source-count">' + normRules.length + ' règles</span>';
  html += '</span></div>';

  // Bottom actions
  html += renderSearchActions(query, true);

  // Upsell premium — show clear value
  html += '<div class="upsell-v4">';
  html += '<div class="upsell-v4-header">';
  html += '<h3>Analyse approfondie disponible</h3>';
  html += '<span class="badge badge-info">Premium</span>';
  html += '</div>';
  html += '<p>L\'analyse ci-dessus est un premier triage. L\'analyse premium ajoute :</p>';
  html += '<ul class="upsell-v4-list">';
  html += '<li><strong>Questions ciblées</strong> — on affine votre dossier avec les bonnes questions</li>';
  html += '<li><strong>Argumentation contradictoire</strong> — arguments pour ET contre, avec sources</li>';
  html += '<li><strong>Certificat de couverture</strong> — on vérifie que rien ne manque</li>';
  html += '<li><strong>Génération de lettres</strong> — mise en demeure personnalisée</li>';
  html += '<li><strong>Analyse de documents</strong> — joignez votre contrat ou courrier</li>';
  html += '</ul>';
  html += '<a href="/premium.html" class="btn btn-primary">Analyse approfondie — dès CHF 0.03</a>';
  html += '</div>';

  container.innerHTML = html;
}

function renderSearchActions(query, isBottom) {
  var cls = isBottom ? 'result-actions result-actions-bottom' : 'result-actions';
  var html = '<div class="' + cls + '">';
  html += '<button class="btn btn-sm btn-print" onclick="window.print()">Imprimer / PDF</button>';
  html += '<a href="/" class="btn btn-sm btn-outline">Nouvelle recherche</a>';
  html += '<a href="/annuaire.html" class="btn btn-sm btn-secondary">Annuaire</a>';
  html += '</div>';
  return html;
}

function toggleTemplate(id) {
  var box = document.getElementById(id);
  var toggle = document.getElementById('toggle-' + id);
  if (!box) return;
  if (box.classList.contains('hidden')) {
    box.classList.remove('hidden');
    if (toggle) toggle.textContent = 'Masquer';
  } else {
    box.classList.add('hidden');
    if (toggle) toggle.textContent = 'Afficher';
  }
}

function copyTemplate(id) {
  var el = document.getElementById('text-' + id);
  if (!el) return;
  var text = el.textContent;
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.querySelector('#' + id + ' .copy-btn');
    if (btn) {
      btn.textContent = 'Copie !';
      btn.classList.add('copied');
      setTimeout(function() { btn.textContent = 'Copier'; btn.classList.remove('copied'); }, 2000);
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
