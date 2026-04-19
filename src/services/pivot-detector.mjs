/**
 * Pivot Detector — détecte si les nouvelles réponses constituent un pivot
 * (règle freeze #10).
 *
 * Pivot = le cas a fondamentalement changé entre rounds :
 *   - domaine principal différent
 *   - fiche primaire différente ET divergence de situation
 *   - contradictions centrales non réconciliables
 *
 * Réponse ≠ pivot : ajout d'infos complémentaires qui n'invalident pas
 * le cadre du round précédent.
 *
 * En cas de pivot, le case-store reset l'analyse (nav, enriched) — il faut
 * reconstruire le dossier depuis les nouvelles données. Le case_id et le
 * payment_gate restent (pas de double-facturation).
 */

/**
 * @param {object} before - snapshot avant (navigation + enriched_primary + facts extraits)
 * @param {object} after  - snapshot après
 * @returns {{is_pivot: boolean, reasons: string[], severity: number}}
 */
export function detectPivot(before = {}, after = {}) {
  const reasons = [];
  let severity = 0;

  const bDom = before?.navigation?.fiches_pertinentes?.[0]
    ? inferDomain(before.navigation.fiches_pertinentes[0])
    : before?.enriched_primary?.fiche?.domaine;
  const aDom = after?.navigation?.fiches_pertinentes?.[0]
    ? inferDomain(after.navigation.fiches_pertinentes[0])
    : after?.enriched_primary?.fiche?.domaine;

  if (bDom && aDom && bDom !== aDom) {
    reasons.push(`domain_change:${bDom}→${aDom}`);
    severity += 3;
  }

  const bFiche = before?.enriched_primary?.fiche?.id;
  const aFiche = after?.enriched_primary?.fiche?.id;
  if (bFiche && aFiche && bFiche !== aFiche && bDom === aDom) {
    // Changement de fiche dans même domaine = pas forcément pivot, juste affinage
    // Sauf si la situation (extrait LLM) a changé substantiellement
    const bSit = (before?.navigation?.resume_situation || '').slice(0, 80);
    const aSit = (after?.navigation?.resume_situation || '').slice(0, 80);
    if (bSit && aSit && !sharesCore(bSit, aSit)) {
      reasons.push(`fiche_change_with_situation_shift:${bFiche}→${aFiche}`);
      severity += 2;
    }
  }

  // Contradictions centrales non résolues
  const centralConflicts = (after?.unresolved_contradictions || [])
    .filter(c => c.severity >= 3);
  if (centralConflicts.length) {
    reasons.push(`central_contradictions:${centralConflicts.length}`);
    severity += 3;
  }

  return {
    is_pivot: severity >= 3,
    reasons,
    severity
  };
}

/** Heuristique fallback : première partie du fiche_id = domaine. */
function inferDomain(ficheId) {
  if (!ficheId || typeof ficheId !== 'string') return null;
  const first = ficheId.split(/[-_]/)[0];
  return first.toLowerCase();
}

/** Deux résumés partagent un noyau sémantique simple ? */
function sharesCore(a, b) {
  const toks = s => new Set(
    s.toLowerCase().split(/[^a-zà-ÿ]+/).filter(w => w.length >= 4)
  );
  const ta = toks(a);
  const tb = toks(b);
  if (!ta.size || !tb.size) return true; // trop court pour décider → pas pivot
  let inter = 0;
  for (const w of ta) if (tb.has(w)) inter++;
  const jaccard = inter / (ta.size + tb.size - inter);
  return jaccard >= 0.25;
}
