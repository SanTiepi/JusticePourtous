// JusticeBot Frontend Logic
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
      link.textContent = "Retour a l'accueil";
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
    var sel = '<select onchange="selectCanton(this.value)" style="font-size:1rem">';
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
      throw new Error('Aucune fiche trouvee');
    }
  } catch (e) {
    if (card) {
      card.innerHTML = '<div class="error-box">Erreur lors de l\'analyse. <a href="/">Retour a l\'accueil</a></div>';
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
      if (!res.ok) throw new Error('Fiche non trouvee');
      data = await res.json();
    } catch (e) {
      document.getElementById('resultat').innerHTML = '<div class="error-box">Fiche non trouvee. <a href="/">Retour a l\'accueil</a></div>';
      return;
    }
  }

  var fiche = data.fiche;
  if (!fiche) {
    document.getElementById('resultat').innerHTML = '<div class="error-box">Fiche non trouvee. <a href="/">Retour a l\'accueil</a></div>';
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
    html += '<h3>Jurisprudence du Tribunal federal</h3>';
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
    html += '<h3>Modele de lettre</h3>';
    html += '<div class="lettre-box">';
    html += '<button class="copy-btn" onclick="copyLettre()">Copier</button>';
    html += '<pre id="lettreText">' + r.modeleLettre + '</pre>';
    html += '</div>';
    html += '</div>';
  }

  // Services
  if (r.services && r.services.length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>Services competents</h3>';
    r.services.forEach(function(s) {
      html += '<div class="service-item">';
      html += '<div><div class="nom">' + s.nom + '</div>';
      if (s.type) html += '<span class="type-tag">' + s.type + '</span>';
      if (s.adresse) html += '<div class="adresse">' + s.adresse + '</div>';
      html += '</div>';
      html += '<div style="text-align:right">';
      if (s.tel) html += '<a href="tel:' + s.tel + '" class="tel">' + s.tel + '</a><br>';
      if (s.url) html += '<a href="' + s.url + '" target="_blank" rel="noopener" style="font-size:0.85rem">Site web</a>';
      html += '</div></div>';
    });
    html += '</div>';
  }

  // Action buttons
  html += '<div style="display:flex;gap:1rem;margin:1.5rem 0;flex-wrap:wrap">';
  html += '<button class="btn btn-print" onclick="window.print()">Imprimer / Sauvegarder PDF</button>';
  html += '<a href="/" class="btn btn-outline">Nouvelle consultation</a>';
  html += '</div>';

  // Upsell premium (discret)
  html += '<div class="upsell">';
  html += '<h3>Besoin d\'une analyse personnalisee ?</h3>';
  html += '<p>Notre IA analyse votre situation en detail pour CHF 0.03 a 0.10 par question.</p>';
  html += '<a href="/premium.html" class="btn btn-sm">Espace Premium</a>';
  html += '</div>';

  // Routage ecosysteme
  if (r.routageEcosysteme && Object.keys(r.routageEcosysteme).length) {
    html += '<div class="card"' + stagger() + '>';
    html += '<h3>Vous pourriez aussi etre interesse par</h3>';
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
