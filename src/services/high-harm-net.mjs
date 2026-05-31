/**
 * high-harm-net.mjs — Filet de sécurité déterministe pour les OMISSIONS DANGEREUSES.
 *
 * Audit triage cas complexes (2026-05-31, angle « 0 omission dangereuse ») : le navigator
 * surface ~2,7 fiches/cas et rate ~40 % du set complet. Parmi les fiches manquées, ~21 portent
 * un délai PÉREMPTOIRE (perte de droit si raté). L'expansion par graphe a été rejetée (bruit
 * 74-94 %) ; un prompt de décomposition aussi (régression 21→27). Cet angle-ci est différent :
 * un filet TRÈS étroit, déterministe, qui ne se déclenche que sur un trigger FORT et SPÉCIFIQUE
 * d'une procédure à délai péremptoire haute-harm, et garantit alors que la fiche correspondante
 * est surfacée — même si le navigator l'a ratée.
 *
 * Mesuré sur les 45 cas (snapshot navigator) : 21 → 17 omissions critiques (+4 récupérées :
 * recours renvoi ×2, opposition 10 jours ×2), **0 faux positif**, ≥1 fiche pertinente maintenu
 * 31/31. Précision > rappel : mieux vaut NE PAS se déclencher que polluer (on a justement rejeté
 * l'expansion pour son bruit). ⚠️ NE PAS élargir les triggers sans re-mesurer (cf. score-complex-eval) :
 * un trigger « congé » a faussement matché « congé de mon employeur » (licenciement) → bail ; un
 * trigger « excès de vitesse » a matché un accident. Étroitesse = sûreté.
 *
 * Extensions TESTÉES puis REJETÉES sur le snapshot (2026-05-31) — ne pas re-tenter naïvement :
 * - travail_chomage (180j, pourtant catastrophique) : trigger large /chômage/ = 2 faux positifs
 *   (dont un cas succession) ; trigger serré (contexte d'inscription) = 0 faux positif MAIS 0 récup
 *   (le cas réel dit juste « chômage », trop ambigu pour déclencher sans risque). Non ajouté.
 * - bail_resiliation_conteste (30j) : 0 récup (le navigator le couvre déjà), 0 FP → aucune valeur.
 * → Pour rattraper le chômage et les omissions diffuses, le levier n'est PAS un trigger mais la
 *   sélection du navigator (modèle) ou un signal de vrai usager indiquant l'omission à corriger.
 */

// Chaque entrée : un trigger textuel non ambigu → la fiche à délai péremptoire à garantir.
export const HIGH_HARM_TRIGGERS = [
  {
    fiche: 'dettes_opposition',
    enjeu: 'opposition au commandement de payer — 10 jours, art. 74 LP (perte de droit si raté)',
    re: /commandement de payer|office des poursuites/i,
  },
  {
    fiche: 'etranger_recours_renvoi',
    enjeu: 'recours contre une décision de renvoi (délai de recours péremptoire)',
    re: /(décision de )?renvoi|ne renouvel\w+ (pas )?(mon |le |la )?(permis|autorisation|séjour)|service de la population|quitter la suisse/i,
  },
];

/**
 * Renvoie les fiches à délai péremptoire dont le trigger explicite est présent dans le texte.
 * Déterministe, sans effet de bord. À fusionner avec la sélection du navigator (en PLUS, jamais
 * en remplacement de la primaire).
 * @param {string} texte  description libre du citoyen
 * @returns {Array<{fiche:string, enjeu:string}>}
 */
export function highHarmDeadlineHits(texte) {
  const q = typeof texte === 'string' ? texte : '';
  if (!q) return [];
  return HIGH_HARM_TRIGGERS.filter(t => t.re.test(q)).map(t => ({ fiche: t.fiche, enjeu: t.enjeu }));
}
