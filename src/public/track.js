/**
 * track.js — Funnel analytics beacon, first-party, zéro dépendance.
 *
 * window.jbTrack(event, caseId) envoie { event, caseId } à POST /api/track via
 * navigator.sendBeacon (fallback fetch keepalive). Best-effort : toute erreur
 * est avalée silencieusement, jamais bloquant pour l'UX.
 *
 * Events haut-funnel (2a) : home_view, input_focus, triage_submit,
 * triage_result_rendered, triage_error.
 * Events profondeur (2b)  : plan_viewed, step_expanded, letter_clicked,
 * contact_clicked, feedback_submitted.
 *
 * Vanilla JS, compatible sans transpilation (var, no arrow).
 */
(function () {
  if (window.jbTrack) return;
  window.jbTrack = function (event, caseId) {
    try {
      var payload = JSON.stringify({ event: event, caseId: caseId || null });
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/track', blob);
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(function () {});
      }
    } catch (e) { /* best-effort */ }
  };
})();
