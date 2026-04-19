/**
 * Freshness Badge — Évaluation de la fraîcheur d'une fiche
 *
 * Le citoyen doit voir, à chaque réponse, à quelle date la fiche a été
 * vérifiée et si elle est encore fiable. Ce module calcule le statut
 * en se basant sur `last_verified_at` et `review_expiry`.
 *
 * Statuts :
 *   - fresh    (vert)    : vérifié < 6 mois et pas expiré
 *   - aging    (jaune)   : 6 à 12 mois, revue à programmer
 *   - stale    (orange)  : > 12 mois OU passé review_expiry
 *   - expired  (rouge)   : 6+ mois après review_expiry (obsolète)
 *   - unknown  (gris)    : pas de last_verified_at
 *
 * Convention : pas de dépendances externes, pas de mutation des fiches
 * en entrée (sauf enrichFreshnessOnFiche qui ajoute un champ `freshness`).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_6_MONTHS = 183;   // ≈ 6 mois
const DAYS_12_MONTHS = 365;  // ≈ 12 mois

const SCOPE_LABELS = {
  draft_automated: 'Généré automatiquement, non revu par un juriste',
  reviewed_by_claude: "Revu par l'IA Claude",
  reviewed_by_legal_expert: 'Revu par un juriste'
};

/** Parse a YYYY-MM-DD date into a UTC timestamp (ms). Returns null if invalid. */
function parseDate(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return null;
  return Date.UTC(y, mo - 1, d);
}

function daysBetween(a, b) {
  return Math.floor((b - a) / MS_PER_DAY);
}

/**
 * Map a review_scope value to a human-readable label.
 * Falls back to a neutral label for unknown scopes.
 */
export function scopeHumanLabel(scope) {
  if (!scope) return 'Scope de revue inconnu';
  return SCOPE_LABELS[scope] || `Scope : ${scope}`;
}

/**
 * Compute the freshness status of a fiche.
 *
 * @param {object} fiche  Fiche object (must have last_verified_at, review_scope, review_expiry)
 * @param {number} [now=Date.now()]  Reference timestamp (ms)
 * @returns {object} Freshness descriptor : { status, label, color, age_days,
 *                   days_until_expiry, expired, last_verified_at, review_scope,
 *                   review_expiry, scope_human_label }
 */
export function computeFreshness(fiche, now = Date.now()) {
  const last = parseDate(fiche?.last_verified_at);
  const expiry = parseDate(fiche?.review_expiry);
  const scope = fiche?.review_scope || null;

  if (last === null) {
    return {
      status: 'unknown',
      label: 'Fraîcheur inconnue',
      color: 'gray',
      age_days: null,
      days_until_expiry: null,
      expired: false,
      last_verified_at: fiche?.last_verified_at || null,
      review_scope: scope,
      review_expiry: fiche?.review_expiry || null,
      scope_human_label: scopeHumanLabel(scope)
    };
  }

  const age = daysBetween(last, now);
  const daysUntilExpiry = expiry !== null ? daysBetween(now, expiry) : null;
  const pastExpiry = expiry !== null && now > expiry;
  // Days elapsed since expiry (negative if not yet expired)
  const daysSinceExpiry = expiry !== null ? daysBetween(expiry, now) : null;

  let status;
  let label;
  let color;
  let expired = false;

  // 1. Expired (red) : plus de 6 mois après review_expiry
  if (pastExpiry && daysSinceExpiry !== null && daysSinceExpiry >= DAYS_6_MONTHS) {
    status = 'expired';
    label = 'Obsolète — à réviser';
    color = 'red';
    expired = true;
  }
  // 2. Stale (orange) : passé expiry (< 6 mois) OU âge > 12 mois
  else if (pastExpiry || age > DAYS_12_MONTHS) {
    status = 'stale';
    label = 'Vérification dépassée';
    color = 'orange';
    expired = pastExpiry;
  }
  // 3. Aging (yellow) : entre 6 et 12 mois
  else if (age >= DAYS_6_MONTHS) {
    status = 'aging';
    label = 'Revue à programmer';
    color = 'yellow';
  }
  // 4. Fresh (green) : < 6 mois et pas expiré
  else {
    status = 'fresh';
    label = 'Vérifié récemment';
    color = 'green';
  }

  return {
    status,
    label,
    color,
    age_days: age,
    days_until_expiry: daysUntilExpiry,
    expired,
    last_verified_at: fiche.last_verified_at,
    review_scope: scope,
    review_expiry: fiche.review_expiry || null,
    scope_human_label: scopeHumanLabel(scope)
  };
}

/**
 * Return a new fiche object with a `freshness` field added.
 * Does NOT mutate the input fiche — returns a shallow clone.
 *
 * @param {object} fiche
 * @param {number} [now=Date.now()]
 * @returns {object} Cloned fiche with `freshness` field
 */
export function enrichFreshnessOnFiche(fiche, now = Date.now()) {
  if (!fiche || typeof fiche !== 'object') return fiche;
  const freshness = computeFreshness(fiche, now);
  return { ...fiche, freshness };
}
