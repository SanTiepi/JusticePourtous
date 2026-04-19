/**
 * Urgency Marker — marqueur visuel d'urgence pour l'UI.
 *
 * Règle freeze #23 (reformulée sans express mode) :
 *   Urgence = marqueur visuel dans la réponse. Le pipeline ne change PAS.
 *   Qualité > rapidité. Aucun shortcut.
 *
 * Sortie consommable par le front : niveau, texte court, délai affichable,
 * couleur sémantique. Pas de logique de pipeline.
 */

/**
 * @param {object} params
 * @param {number|null} params.delaiJours — délai le plus court détecté
 * @param {string}      [params.procedure] — libellé de la procédure concernée
 * @returns {{level, label, delai_jours, color, action_hint}|null}
 */
export function buildUrgencyMarker({ delaiJours, procedure = null } = {}) {
  if (delaiJours == null) return null;

  if (delaiJours <= 3) {
    return {
      level: 'critical',
      label: 'Délai critique',
      delai_jours: delaiJours,
      color: 'red',
      action_hint: procedure
        ? `${procedure} : ${delaiJours} jour${delaiJours > 1 ? 's' : ''} avant échéance — agir immédiatement`
        : `${delaiJours} jour${delaiJours > 1 ? 's' : ''} avant échéance — agir immédiatement`
    };
  }

  if (delaiJours <= 14) {
    return {
      level: 'high',
      label: 'Délai court',
      delai_jours: delaiJours,
      color: 'orange',
      action_hint: procedure
        ? `${procedure} : ${delaiJours} jours pour agir`
        : `${delaiJours} jours pour agir`
    };
  }

  if (delaiJours <= 30) {
    return {
      level: 'moderate',
      label: 'Délai à surveiller',
      delai_jours: delaiJours,
      color: 'yellow',
      action_hint: procedure
        ? `${procedure} : ${delaiJours} jours`
        : `${delaiJours} jours`
    };
  }

  return {
    level: 'normal',
    label: 'Pas de délai imminent',
    delai_jours: delaiJours,
    color: 'gray',
    action_hint: null
  };
}
