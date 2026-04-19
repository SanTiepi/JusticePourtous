/**
 * Degraded Mode Banner — Phase Cortex 4
 *
 * Quand l'API renvoie payload.degraded_mode === true (cas DE/IT),
 * on injecte un bandeau honnête en haut du résultat AVANT que le contenu
 * français ne s'affiche.
 *
 * Hook : on observe le DOM via MutationObserver sur #resultat. Dès qu'un nœud
 * apparait, on lit le payload depuis window.__JB_LAST_TRIAGE_PAYLOAD si exposé,
 * sinon on monkey-patch fetch pour intercepter /api/triage et /api/triage/next.
 *
 * Stratégie : monkey-patch fetch → on stocke le dernier payload triage dans
 * window.__JB_LAST_TRIAGE_PAYLOAD, puis on observe #resultat et on injecte
 * le bandeau dès qu'on détecte qu'il a été (re-)rendu.
 *
 * Ne dépend pas de app.js → ne casse rien si chargé seul.
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Monkey-patch fetch pour capturer les réponses /api/triage*
  // ---------------------------------------------------------------------------

  if (window.fetch && !window.__JB_FETCH_PATCHED__) {
    var originalFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      var p = originalFetch(input, init);
      if (typeof url === 'string' && /\/api\/triage(\/next)?$/.test(url)) {
        return p.then(function (resp) {
          // Clone pour ne pas consommer le body
          try {
            var clone = resp.clone();
            clone.json().then(function (data) {
              window.__JB_LAST_TRIAGE_PAYLOAD = data;
              maybeRenderBanner(data);
            }).catch(function () { /* not JSON */ });
          } catch (e) { /* clone failed */ }
          return resp;
        });
      }
      return p;
    };
    window.__JB_FETCH_PATCHED__ = true;
  }

  // ---------------------------------------------------------------------------
  // 2. MutationObserver sur #resultat — re-render si le contenu change
  // ---------------------------------------------------------------------------

  function setupObserver() {
    var target = document.getElementById('resultat');
    if (!target) return;
    var observer = new MutationObserver(function () {
      if (window.__JB_LAST_TRIAGE_PAYLOAD) {
        maybeRenderBanner(window.__JB_LAST_TRIAGE_PAYLOAD);
      }
    });
    observer.observe(target, { childList: true, subtree: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupObserver);
  } else {
    setupObserver();
  }

  // ---------------------------------------------------------------------------
  // 3. Render du bandeau
  // ---------------------------------------------------------------------------

  function maybeRenderBanner(payload) {
    if (!payload) return;
    if (payload.degraded_mode !== true) return;
    if (!payload.translation_disclaimer) return;

    var resultat = document.getElementById('resultat');
    if (!resultat) return;

    // Évite double injection
    if (resultat.querySelector('.degraded-mode-banner')) return;

    var disc = payload.translation_disclaimer;
    var sourceLang = (payload.source_language || disc.source_lang || '').toUpperCase();

    var langLabel = sourceLang === 'DE' ? 'allemand'
                  : sourceLang === 'IT' ? 'italien'
                  : 'autre langue';

    var banner = document.createElement('div');
    banner.className = 'degraded-mode-banner';
    banner.setAttribute('role', 'note');
    banner.setAttribute('aria-label', 'Mode dégradé');

    // Style inline minimal (le CSS du site peut surcharger via .degraded-mode-banner)
    banner.style.cssText = [
      'border: 1px solid #d97706',
      'background: #fffbeb',
      'color: #78350f',
      'padding: 14px 18px',
      'border-radius: 8px',
      'margin: 12px 0 18px 0',
      'font-size: 14px',
      'line-height: 1.5'
    ].join(';');

    var html = '';
    html += '<div style="font-weight:600;margin-bottom:6px;">';
    html += '⚠ Votre question était en ' + escapeHtml(langLabel) + '. ';
    html += 'Notre analyse juridique est en français (mode dégradé).';
    html += '</div>';
    html += '<div style="margin-bottom:8px;">';
    html += escapeHtml(disc.long || disc.short || '');
    html += '</div>';
    if (disc.action_suggested) {
      html += '<div style="font-style:italic;font-size:13px;">';
      html += escapeHtml(disc.action_suggested);
      html += '</div>';
    }
    // Version dans la langue source pour la rassurance citoyenne
    if (disc.short && sourceLang) {
      html += '<details style="margin-top:8px;font-size:13px;">';
      html += '<summary style="cursor:pointer;">Version ' + escapeHtml(sourceLang) + '</summary>';
      html += '<div style="margin-top:6px;">' + escapeHtml(disc.short) + '</div>';
      html += '</details>';
    }
    banner.innerHTML = html;

    // Insère en tête du conteneur résultat
    if (resultat.firstChild) {
      resultat.insertBefore(banner, resultat.firstChild);
    } else {
      resultat.appendChild(banner);
    }
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Expose pour debug et tests
  window.__JB_renderDegradedBanner = maybeRenderBanner;
})();
