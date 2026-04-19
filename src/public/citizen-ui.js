/**
 * citizen-ui.js — Client-side helpers for the citizen account API.
 *
 * Exposes a single `window.Citizen` namespace with:
 *   - register(email, canton)   → POST /api/citizen/register
 *   - verify(token)             → POST /api/citizen/verify  (stocke session dans localStorage)
 *   - me()                      → GET  /api/citizen/me      (header x-citizen-session)
 *   - linkCase(case_id)         → POST /api/citizen/cases/link
 *   - getUpcoming()             → GET  /api/citizen/upcoming
 *   - close()                   → DELETE /api/citizen/me   (clear localStorage)
 *   - isLoggedIn()              → bool
 *
 * Stocke la session dans localStorage.jb_citizen_session.
 *
 * Vanilla JS, zero deps. Compatible IE11 sans transpilation (var, no arrow shorthand).
 */
(function () {
  'use strict';

  var SESSION_KEY = 'jb_citizen_session';

  function getSession() {
    try { return localStorage.getItem(SESSION_KEY) || null; } catch (e) { return null; }
  }

  function setSession(token) {
    try { localStorage.setItem(SESSION_KEY, token); } catch (e) { /* ignore */ }
  }

  function clearSession() {
    try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  function authHeaders() {
    var s = getSession();
    var h = { 'Content-Type': 'application/json' };
    if (s) h['x-citizen-session'] = s;
    return h;
  }

  async function jsonFetch(url, opts) {
    var res = await fetch(url, opts || {});
    var data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    return { ok: res.ok, status: res.status, data: data || {} };
  }

  var Citizen = {
    SESSION_KEY: SESSION_KEY,

    isLoggedIn: function () {
      return !!getSession();
    },

    getSessionToken: function () {
      return getSession();
    },

    register: async function (email, canton) {
      return jsonFetch('/api/citizen/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, canton: canton || null })
      });
    },

    verify: async function (token) {
      var r = await jsonFetch('/api/citizen/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token })
      });
      if (r.ok && r.data && r.data.session_token) {
        setSession(r.data.session_token);
      }
      return r;
    },

    me: async function () {
      if (!getSession()) return { ok: false, status: 401, data: { error: 'no_session' } };
      return jsonFetch('/api/citizen/me', { headers: authHeaders() });
    },

    linkCase: async function (case_id) {
      return jsonFetch('/api/citizen/cases/link', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ case_id: case_id })
      });
    },

    getUpcoming: async function () {
      if (!getSession()) return { ok: false, status: 401, data: { error: 'no_session' } };
      return jsonFetch('/api/citizen/upcoming', { headers: authHeaders() });
    },

    close: async function () {
      var r = await jsonFetch('/api/citizen/me', {
        method: 'DELETE',
        headers: authHeaders()
      });
      if (r.ok) clearSession();
      return r;
    },

    logout: function () {
      clearSession();
    }
  };

  // ───────────────────────────────────────────────────────────────
  // UI : modal "Mon compte"
  //
  // Attaché à un bouton `[data-citizen-trigger]`. Crée la modal au clic.
  // Style discret, réutilise les classes `.btn`, `.card`, `.notice-juridique`.
  // ───────────────────────────────────────────────────────────────

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'style' && typeof attrs[k] === 'object') {
          Object.assign(node.style, attrs[k]);
        } else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (k === 'html') {
          node.innerHTML = attrs[k];
        } else {
          node.setAttribute(k, attrs[k]);
        }
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function escHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function currentLang() {
    try { return (typeof getLang === 'function' ? getLang() : 'fr') || 'fr'; } catch (e) { return 'fr'; }
  }

  function shouldTranslateUi() {
    return currentLang() !== 'fr' && typeof translateHtmlFragment === 'function';
  }

  function applyDynamicHtml(node, html, pagePath, bindFn) {
    node.innerHTML = html;
    if (typeof bindFn === 'function') bindFn();
    if (!shouldTranslateUi()) return;
    translateHtmlFragment(html, {
      lang: currentLang(),
      content_type: 'chrome/ui',
      page_path: pagePath || '/citizen-ui'
    }).then(function (payload) {
      if (!payload || !payload.html) return;
      node.innerHTML = payload.html;
      if (typeof bindFn === 'function') bindFn();
    }).catch(function () { /* noop */ });
  }

  function setUiMessage(node, text, pagePath) {
    if (!node) return;
    node.textContent = text;
    if (currentLang() === 'fr' || typeof translatePlainText !== 'function') return;
    translatePlainText(text, {
      lang: currentLang(),
      content_type: 'chrome/ui',
      page_path: pagePath || '/citizen-ui'
    }).then(function (translated) {
      node.textContent = translated;
    }).catch(function () { /* noop */ });
  }

  async function uiAlert(text, pagePath) {
    if (currentLang() !== 'fr' && typeof translatePlainText === 'function') {
      try {
        text = await translatePlainText(text, {
          lang: currentLang(),
          content_type: 'chrome/ui',
          page_path: pagePath || '/citizen-ui'
        });
      } catch (e) { /* noop */ }
    }
    alert(text);
  }

  function closeModal() {
    var existing = document.getElementById('citizenModal');
    if (existing) existing.remove();
  }

  function openModal(contentNode) {
    closeModal();
    var overlay = el('div', {
      id: 'citizenModal',
      role: 'dialog',
      'aria-modal': 'true',
      style: {
        position: 'fixed', inset: '0', background: 'rgba(0,0,0,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '9999', padding: '20px', overflowY: 'auto'
      }
    });
    var box = el('div', {
      style: {
        background: '#fff', borderRadius: '12px', maxWidth: '480px', width: '100%',
        padding: '28px 26px', boxShadow: '0 20px 50px rgba(0,0,0,.25)',
        maxHeight: '90vh', overflowY: 'auto', position: 'relative'
      }
    });
    var closeBtn = el('button', {
      type: 'button',
      'aria-label': 'Fermer',
      style: {
        position: 'absolute', top: '12px', right: '14px', background: 'transparent',
        border: 'none', fontSize: '22px', cursor: 'pointer', color: '#666'
      },
      onclick: closeModal
    }, ['×']);
    box.appendChild(closeBtn);
    box.appendChild(contentNode);
    overlay.appendChild(box);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
  }

  function renderRegisterForm() {
    var content = el('div');
    var html =
      '<h3 style="margin:0 0 8px;font-size:20px">Mon compte JusticePourtous</h3>' +
      '<p style="margin:0 0 16px;color:#555;font-size:14px">Créez un compte gratuit pour suivre vos dossiers et recevoir vos échéances. Aucun mot de passe — un lien magique par email.</p>' +
      '<form id="citizenRegisterForm" style="display:flex;flex-direction:column;gap:12px">' +
      '  <label style="font-size:13px;color:#444">Email' +
      '    <input type="email" name="email" required autocomplete="email" ' +
      '      style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;margin-top:4px;font-size:14px">' +
      '  </label>' +
      '  <label style="font-size:13px;color:#444">Canton (optionnel)' +
      '    <select name="canton" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;margin-top:4px;font-size:14px">' +
      '      <option value="">— Sélectionner —</option>' +
      '      <option>VD</option><option>GE</option><option>VS</option><option>FR</option>' +
      '      <option>NE</option><option>JU</option><option>BE</option><option>ZH</option>' +
      '      <option>BS</option><option>BL</option><option>SO</option><option>AG</option>' +
      '      <option>LU</option><option>TI</option>' +
      '    </select>' +
      '  </label>' +
      '  <button type="submit" class="btn btn-primary" style="margin-top:8px">Créer mon compte</button>' +
      '  <div id="citizenRegisterMsg" style="font-size:13px;color:#555;min-height:18px"></div>' +
      '  <div id="citizenTokenStep" style="display:none;border-top:1px solid #eee;padding-top:14px;margin-top:6px">' +
      '    <p style="font-size:13px;color:#444;margin:0 0 8px">Un lien vous a été envoyé. Collez votre code ci-dessous :</p>' +
      '    <input id="citizenTokenInput" type="text" placeholder="Code reçu" ' +
      '      style="width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:13px;font-family:monospace">' +
      '    <button type="button" id="citizenVerifyBtn" class="btn btn-sm btn-primary" style="margin-top:10px">Confirmer</button>' +
      '  </div>' +
      '</form>';

    function bindRegisterHandlers() {
      var form = content.querySelector('#citizenRegisterForm');
      var msg = content.querySelector('#citizenRegisterMsg');
      var tokenStep = content.querySelector('#citizenTokenStep');
      var tokenInput = content.querySelector('#citizenTokenInput');
      var verifyBtn = content.querySelector('#citizenVerifyBtn');
      if (!form || form.dataset.bound === '1') return;
      form.dataset.bound = '1';

      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var email = form.email.value.trim();
        var canton = form.canton.value || null;
        setUiMessage(msg, 'Création du compte…', '/citizen/register');
        var r = await Citizen.register(email, canton);
        if (!r.ok) {
          setUiMessage(msg, (r.data && r.data.error) || 'Erreur création compte', '/citizen/register');
          return;
        }
        setUiMessage(msg, 'Compte créé. Vérifiez votre email (ou collez le code dev ci-dessous).', '/citizen/register');
        tokenStep.style.display = 'block';
        if (r.data && r.data.magic_token_dev) tokenInput.value = r.data.magic_token_dev;
      });

      verifyBtn.addEventListener('click', async function () {
        var t = tokenInput.value.trim();
        if (!t) { setUiMessage(msg, 'Code requis', '/citizen/verify'); return; }
        setUiMessage(msg, 'Vérification…', '/citizen/verify');
        var r = await Citizen.verify(t);
        if (!r.ok) {
          setUiMessage(msg, (r.data && r.data.error) || 'Code invalide ou expiré', '/citizen/verify');
          return;
        }
        setUiMessage(msg, 'Connexion réussie', '/citizen/verify');
        setTimeout(function () { openAccountModal(); }, 400);
      });
    }

    applyDynamicHtml(content, html, '/citizen/register', bindRegisterHandlers);

    return content;
  }

  function renderLoggedInView(account, upcoming) {
    var cases = (account && account.cases) || [];
    var upc = (upcoming && upcoming.upcoming) || [];
    var content = el('div');
    var html = '';
    html += '<h3 style="margin:0 0 4px;font-size:20px">Mon compte</h3>';
    html += '<p style="margin:0 0 14px;color:#666;font-size:13px">' + escHtml(account.email || '') +
            (account.canton ? ' · ' + escHtml(account.canton) : '') + '</p>';

    html += '<div style="margin:14px 0">';
    html += '<strong style="font-size:14px">Mes dossiers (' + cases.length + ')</strong>';
    if (cases.length === 0) {
      html += '<p style="color:#888;font-size:13px;margin:6px 0 0">Aucun dossier lié pour l\'instant. Vos analyses pourront être enregistrées ici.</p>';
    } else {
      html += '<ul style="margin:8px 0 0;padding-left:18px;font-size:13px">';
      cases.forEach(function (c) {
        html += '<li>' + escHtml(c.case_id || c) + (c.linked_at ? ' <span style="color:#999">(' + escHtml(c.linked_at.slice(0, 10)) + ')</span>' : '') + '</li>';
      });
      html += '</ul>';
    }
    html += '</div>';

    html += '<div style="margin:14px 0">';
    html += '<strong style="font-size:14px">Échéances à venir (30 j)</strong>';
    if (upc.length === 0) {
      html += '<p style="color:#888;font-size:13px;margin:6px 0 0">Aucune échéance enregistrée.</p>';
    } else {
      html += '<ul style="margin:8px 0 0;padding-left:18px;font-size:13px">';
      upc.forEach(function (d) {
        html += '<li>' + escHtml(d.label || d.title || 'Échéance') +
                ' — <span style="color:#a04">' + escHtml(d.due_date || d.date || '') + '</span></li>';
      });
      html += '</ul>';
    }
    html += '</div>';

    html += '<div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap">';
    html += '<button type="button" id="citizenLogoutBtn" class="btn btn-sm btn-outline">Se déconnecter</button>';
    html += '<button type="button" id="citizenCloseBtn" class="btn btn-sm" style="background:#fee;color:#a00;border:1px solid #d99">Fermer mon compte</button>';
    html += '</div>';
    html += '<div id="citizenAccMsg" style="font-size:12px;color:#666;margin-top:10px;min-height:16px"></div>';

    function bindLoggedInHandlers() {
      var logoutBtn = content.querySelector('#citizenLogoutBtn');
      var closeBtn = content.querySelector('#citizenCloseBtn');
      var msgEl = content.querySelector('#citizenAccMsg');
      if (!logoutBtn || logoutBtn.dataset.bound === '1') return;
      logoutBtn.dataset.bound = '1';
      logoutBtn.addEventListener('click', function () {
        Citizen.logout();
        closeModal();
        refreshNavTrigger();
      });
      closeBtn.addEventListener('click', async function () {
        var confirmText = 'Fermer définitivement votre compte ? Cette action est irréversible.';
        if (currentLang() !== 'fr' && typeof translatePlainText === 'function') {
          try {
            confirmText = await translatePlainText(confirmText, { lang: currentLang(), content_type: 'chrome/ui', page_path: '/citizen/account' });
          } catch (e) { /* noop */ }
        }
        if (!confirm(confirmText)) return;
        setUiMessage(msgEl, 'Fermeture en cours…', '/citizen/account');
        var r = await Citizen.close();
        if (r.ok) {
          setUiMessage(msgEl, 'Compte fermé.', '/citizen/account');
          setTimeout(function () { closeModal(); refreshNavTrigger(); }, 600);
        } else {
          setUiMessage(msgEl, (r.data && r.data.error) || 'Erreur fermeture compte', '/citizen/account');
        }
      });
    }
    applyDynamicHtml(content, html, '/citizen/account', bindLoggedInHandlers);
    return content;
  }

  async function openAccountModal() {
    if (!Citizen.isLoggedIn()) {
      openModal(renderRegisterForm());
      return;
    }
    // Connecté : charge data
    var loading = el('div');
    loading.innerHTML = '<p style="text-align:center;color:#666;padding:40px 0">Chargement…</p>';
    openModal(loading);
    var meR = await Citizen.me();
    if (!meR.ok) {
      // session invalide — on bascule sur register
      Citizen.logout();
      openModal(renderRegisterForm());
      refreshNavTrigger();
      return;
    }
    var upR = await Citizen.getUpcoming();
    var account = (meR.data && meR.data.account) || meR.data || {};
    var upcoming = upR.ok ? upR.data : { upcoming: [] };
    openModal(renderLoggedInView(account, upcoming));
  }

  function refreshNavTrigger() {
    var trigger = document.querySelector('[data-citizen-trigger]');
    if (!trigger) return;
    setUiMessage(trigger, 'Mon compte', '/citizen/nav');
    trigger.classList.toggle('citizen-logged-in', Citizen.isLoggedIn());
  }

  function attachNavTrigger() {
    var trigger = document.querySelector('[data-citizen-trigger]');
    if (!trigger) return;
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      openAccountModal();
    });
    refreshNavTrigger();
  }

  // Auto-attach quand DOM prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachNavTrigger);
  } else {
    attachNavTrigger();
  }

  Citizen.openModal = openAccountModal;
  Citizen.closeModal = closeModal;
  window.Citizen = Citizen;

  // ═══════════════════════════════════════════════════════════════
  // Outcomes prompt (opt-in feedback 30j après triage)
  // ═══════════════════════════════════════════════════════════════

  var OUTCOME_SUBMITTED_PREFIX = 'jb_outcome_submitted_';

  function hasSubmittedOutcome(case_id) {
    try { return !!localStorage.getItem(OUTCOME_SUBMITTED_PREFIX + case_id); } catch (e) { return false; }
  }
  function markOutcomeSubmitted(case_id) {
    try { localStorage.setItem(OUTCOME_SUBMITTED_PREFIX + case_id, String(Date.now())); } catch (e) { /* noop */ }
  }

  async function submitOutcome(payload) {
    var res = await fetch('/api/outcomes/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    var data = await res.json().catch(function () { return {}; });
    return { status: res.status, data: data };
  }

  function renderOutcomesPrompt(case_id, fiche_id, domaine, opts) {
    if (!case_id || hasSubmittedOutcome(case_id)) return;
    var host = (opts && opts.container) ? document.querySelector(opts.container) : null;
    host = host || document.querySelector('main') || document.body;
    var banner = document.createElement('div');
    banner.className = 'outcomes-banner';
    banner.innerHTML =
      '<div class="outcomes-banner-inner">' +
        '<strong>Comment s\'est passé votre cas ?</strong>' +
        '<p>Votre retour, anonymisé, aidera les futurs citoyens avec une situation similaire.</p>' +
        '<form id="outcomeForm">' +
          '<label>Action entreprise' +
            '<select name="action_taken" required>' +
              '<option value="">--</option>' +
              '<option value="negotiated">Négocié à l\'amiable</option>' +
              '<option value="went_court">Tribunal / conciliation</option>' +
              '<option value="abandoned">Abandonné</option>' +
              '<option value="awaiting">En attente</option>' +
            '</select>' +
          '</label>' +
          '<label>Résultat' +
            '<select name="result" required>' +
              '<option value="">--</option>' +
              '<option value="won">Gagné</option>' +
              '<option value="partially_won">Partiellement gagné</option>' +
              '<option value="lost">Perdu</option>' +
              '<option value="settled">Arrangement</option>' +
              '<option value="pending">En cours</option>' +
            '</select>' +
          '</label>' +
          '<label>Durée (semaines) <input name="duration_weeks" type="number" min="0" max="520"></label>' +
          '<label>Coût (CHF) <input name="cost_chf" type="number" min="0" max="500000"></label>' +
          '<label>Satisfaction' +
            '<select name="satisfaction">' +
              '<option value="">--</option>' +
              '<option value="1">1 · très mauvais</option>' +
              '<option value="2">2</option>' +
              '<option value="3">3 · neutre</option>' +
              '<option value="4">4</option>' +
              '<option value="5">5 · excellent</option>' +
            '</select>' +
          '</label>' +
          '<label>Notes (anonymisé, max 200 chars) <textarea name="notes_anonymized" maxlength="200"></textarea></label>' +
          '<label class="outcomes-consent">' +
            '<input type="checkbox" name="consent_given" required>' +
            'J\'accepte le partage anonymisé (hash du case_id, pas de PII) pour aider les futurs citoyens.' +
          '</label>' +
          '<div class="outcomes-actions">' +
            '<button type="submit" class="btn-primary">Envoyer</button>' +
            '<button type="button" id="outcomeLaterBtn">Plus tard</button>' +
          '</div>' +
        '</form>' +
      '</div>';
    host.appendChild(banner);
    if (shouldTranslateUi()) {
      translateFragmentInPlace('.outcomes-banner', { content_type: 'chrome/ui', page_path: '/citizen/outcomes' });
    }
    banner.querySelector('#outcomeLaterBtn').onclick = function () { banner.remove(); };
    banner.querySelector('#outcomeForm').onsubmit = async function (e) {
      e.preventDefault();
      var f = e.target;
      var payload = {
        case_id: case_id,
        fiche_id: fiche_id || null,
        domaine: domaine || null,
        consent_given: f.consent_given.checked,
        action_taken: f.action_taken.value,
        result: f.result.value,
        duration_weeks: f.duration_weeks.value ? Number(f.duration_weeks.value) : null,
        cost_chf: f.cost_chf.value ? Number(f.cost_chf.value) : null,
        satisfaction: f.satisfaction.value ? Number(f.satisfaction.value) : null,
        notes_anonymized: f.notes_anonymized.value || ''
      };
      var r = await submitOutcome(payload);
      if (r.status === 200) {
        banner.innerHTML = '<div class="outcomes-banner-inner"><strong>Merci.</strong> Votre retour aide les futurs citoyens.</div>';
        markOutcomeSubmitted(case_id);
        if (shouldTranslateUi()) {
          translateFragmentInPlace('.outcomes-banner', { content_type: 'chrome/ui', page_path: '/citizen/outcomes' });
        }
        setTimeout(function () { banner.remove(); }, 4000);
      } else {
        uiAlert('Erreur : ' + (r.data.error || r.status), '/citizen/outcomes');
      }
    };
  }

  window.renderOutcomesPrompt = renderOutcomesPrompt;

  // ═══════════════════════════════════════════════════════════════
  // Bouton "Générer une lettre"
  // ═══════════════════════════════════════════════════════════════

  async function requestLetter(case_id, body) {
    var r = await fetch('/api/case/' + encodeURIComponent(case_id) + '/letter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    var data = await r.json().catch(function () { return {}; });
    return { status: r.status, data: data };
  }

  function renderLetterButton(opts) {
    if (!opts || !opts.case_id || !opts.ficheId) return;
    var parent = document.querySelector(opts.parentSelector || 'main') || document.body;
    if (parent.querySelector('.letter-generate-btn')) return;
    var btn = document.createElement('button');
    btn.className = 'letter-generate-btn btn-primary';
    btn.type = 'button';
    btn.textContent = '📄 Générer une lettre';
    btn.onclick = function () { openLetterModal(opts.case_id, opts.ficheId); };
    parent.appendChild(btn);
  }

  function openLetterModal(case_id, ficheId) {
    // Réutilise le pattern modal de Citizen
    var existing = document.querySelector('.letter-modal');
    if (existing) existing.remove();
    var modal = document.createElement('div');
    modal.className = 'letter-modal citizen-modal';
    modal.innerHTML =
      '<div class="citizen-modal-content">' +
        '<button class="citizen-modal-close" type="button" aria-label="Fermer">&times;</button>' +
        '<h2>Générer une lettre</h2>' +
        '<form id="letterForm">' +
          '<label>Type de lettre' +
            '<select name="type" required>' +
              '<option value="mise_en_demeure">Mise en demeure</option>' +
              '<option value="contestation">Contestation</option>' +
              '<option value="opposition">Opposition</option>' +
              '<option value="resiliation">Résiliation</option>' +
              '<option value="plainte">Plainte</option>' +
            '</select>' +
          '</label>' +
          '<label>Votre nom <input name="nom" type="text" autocomplete="name"></label>' +
          '<label>Votre adresse <input name="adresse" type="text" autocomplete="street-address"></label>' +
          '<label>Destinataire <input name="destinataire" type="text"></label>' +
          '<label>Format' +
            '<select name="format">' +
              '<option value="auto">Auto (DOCX si possible)</option>' +
              '<option value="pdf">PDF</option>' +
              '<option value="txt">Texte</option>' +
            '</select>' +
          '</label>' +
          '<button type="submit" class="btn-primary">Générer</button>' +
        '</form>' +
        '<div id="letterResult"></div>' +
      '</div>';
    document.body.appendChild(modal);
    if (shouldTranslateUi()) {
      translateFragmentInPlace('.letter-modal .citizen-modal-content', { content_type: 'chrome/ui', page_path: '/citizen/letter' });
    }
    modal.querySelector('.citizen-modal-close').onclick = function () { modal.remove(); };
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
    modal.querySelector('#letterForm').onsubmit = async function (e) {
      e.preventDefault();
      var f = e.target;
      var r = await requestLetter(case_id, {
        ficheId: ficheId,
        type: f.type.value,
        format: f.format.value,
        userContext: {
          nom: f.nom.value,
          adresse: f.adresse.value,
          destinataire: f.destinataire.value
        }
      });
      if (r.status === 200 && r.data.download_url) {
        modal.querySelector('#letterResult').innerHTML =
          '<p><a href="' + r.data.download_url + '" class="btn-primary" download>📥 Télécharger ma lettre</a></p>';
      } else {
        modal.querySelector('#letterResult').innerHTML =
          '<p style="color:#b00">Erreur : ' + (r.data.error || r.status) + '</p>';
        if (shouldTranslateUi()) {
          translateFragmentInPlace('.letter-modal #letterResult', { content_type: 'chrome/ui', page_path: '/citizen/letter' });
        }
      }
    };
  }

  window.renderLetterButton = renderLetterButton;
})();
