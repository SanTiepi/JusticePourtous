// JusticeBot Frontend Logic

let currentQuestions = [];
let currentAnswers = [];
let currentStep = 0;
let currentDomaine = '';

async function initConsultation(domaine) {
  currentDomaine = domaine;
  currentAnswers = [];
  currentStep = 0;

  const res = await fetch(`/api/domaines/${domaine}/questions`);
  const data = await res.json();
  currentQuestions = data.questions || [];
  showQuestion();
}

function showQuestion() {
  if (currentStep >= currentQuestions.length) {
    submitConsultation();
    return;
  }

  const q = currentQuestions[currentStep];
  const progress = ((currentStep + 1) / currentQuestions.length) * 100;

  document.getElementById('progress').style.width = progress + '%';
  document.getElementById('questionText').textContent = q.text;
  document.getElementById('prevBtn').disabled = currentStep === 0;
  document.getElementById('nextBtn').disabled = !currentAnswers[currentStep];

  const optionsDiv = document.getElementById('options');

  if (q.type === 'canton') {
    const cantons = ['VD', 'GE', 'VS', 'FR', 'NE', 'JU', 'BE', 'ZH', 'TI', 'AG', 'AI', 'AR', 'BL', 'BS', 'GL', 'GR', 'LU', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'UR', 'ZG'];
    optionsDiv.innerHTML = `<select onchange="selectCanton(this.value)" style="font-size:1rem">
      <option value="">-- Canton --</option>
      ${cantons.map(c => `<option value="${c}" ${currentAnswers[currentStep] === c ? 'selected' : ''}>${c}</option>`).join('')}
    </select>`;
  } else {
    optionsDiv.innerHTML = q.options.map(opt =>
      `<button class="option ${currentAnswers[currentStep] === opt ? 'selected' : ''}" onclick="selectOption('${opt.replace(/'/g, "\\'")}')">${opt}</button>`
    ).join('');
  }
}

function selectOption(value) {
  currentAnswers[currentStep] = value;
  document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
  event.target.classList.add('selected');
  document.getElementById('nextBtn').disabled = false;
}

function selectCanton(value) {
  if (value) {
    currentAnswers[currentStep] = value;
    document.getElementById('nextBtn').disabled = false;
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
  const canton = currentAnswers.find(a => a && a.length === 2 && a === a.toUpperCase()) || 'VD';

  const res = await fetch('/api/consulter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domaine: currentDomaine,
      reponses: currentAnswers,
      canton: canton
    })
  });

  const data = await res.json();
  if (data.fiche) {
    sessionStorage.setItem('jb_result', JSON.stringify(data));
    window.location.href = `/resultat.html?fiche=${data.fiche.id}`;
  }
}

async function loadResultat(ficheId) {
  let data = null;
  const cached = sessionStorage.getItem('jb_result');
  if (cached) {
    const parsed = JSON.parse(cached);
    if (parsed.fiche && parsed.fiche.id === ficheId) data = parsed;
  }

  if (!data) {
    const res = await fetch(`/api/fiches/${ficheId}`);
    data = await res.json();
  }

  const fiche = data.fiche;
  if (!fiche) {
    document.getElementById('resultat').innerHTML = '<p>Fiche non trouvee.</p>';
    return;
  }

  const r = fiche.reponse;
  let html = '';

  // Explication
  html += `<div class="card"><h3>Votre situation</h3><p>${r.explication}</p></div>`;

  // Articles
  if (r.articles && r.articles.length) {
    html += '<div class="card"><h3>Articles de loi</h3>';
    for (const a of r.articles) {
      html += `<a href="${a.lien}" target="_blank" class="article-link"><span class="ref">${a.ref}</span> <span class="titre">— ${a.titre}</span></a>`;
    }
    html += '</div>';
  }

  // Jurisprudence
  if (r.jurisprudence && r.jurisprudence.length) {
    html += '<div class="card"><h3>Jurisprudence</h3>';
    for (const j of r.jurisprudence) {
      html += `<div class="jurisprudence"><div class="ref">${j.ref}</div><div class="resume">${j.resume}</div></div>`;
    }
    html += '</div>';
  }

  // Modele lettre
  if (r.modeleLettre) {
    html += `<div class="card"><h3>Modele de lettre</h3><div class="lettre-box"><button class="copy-btn" onclick="copyLettre()">Copier</button><pre id="lettreText">${r.modeleLettre}</pre></div></div>`;
  }

  // Services
  if (r.services && r.services.length) {
    html += '<div class="card"><h3>Services competents</h3>';
    for (const s of r.services) {
      html += `<div class="service-item"><div class="nom">${s.nom}</div><div>`;
      if (s.tel) html += `<a href="tel:${s.tel}" class="tel">${s.tel}</a> `;
      if (s.url) html += `<a href="${s.url}" target="_blank">Site</a>`;
      html += '</div></div>';
    }
    html += '</div>';
  }

  // Upsell
  html += `<div class="upsell"><h3>Besoin d'une analyse personnalisee ?</h3><p>Notre IA analyse votre situation en detail — des CHF 0.03</p><a href="/premium.html" class="btn">Espace Premium</a></div>`;

  // Routage ecosysteme
  if (r.routageEcosysteme && Object.keys(r.routageEcosysteme).length) {
    html += '<div class="card"><h3>Vous pourriez aussi etre interesse par</h3>';
    for (const [key, val] of Object.entries(r.routageEcosysteme)) {
      html += `<p><a href="https://${val.url}" target="_blank">${key}</a> — ${val.condition}</p>`;
    }
    html += '</div>';
  }

  document.getElementById('resultat').innerHTML = html;
}

function copyLettre() {
  const text = document.getElementById('lettreText').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'Copie !';
    setTimeout(() => btn.textContent = 'Copier', 2000);
  });
}
