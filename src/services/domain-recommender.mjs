/**
 * Domain Recommender — propose un ordre de traitement pour les cas multi-domaines.
 *
 * Règle freeze #22 : en multi-domaines, demander le choix utilisateur MAIS
 * afficher une recommandation système fondée sur délai/risque.
 * Jamais d'auto-priorité silencieuse.
 *
 * Sortie : un ordre suggéré des domaines avec un score de priorité et
 * la raison (délai court / risque élevé / enjeu financier).
 */

/**
 * @param {Array<{fiche, delais, cascades, confiance}>} enrichedAll
 * @returns {Array<{domaine, priority_score, reasons}>}
 */
export function recommendDomainOrder(enrichedAll = []) {
  const byDomain = new Map();

  for (const e of enrichedAll) {
    const dom = e?.fiche?.domaine;
    if (!dom) continue;
    if (!byDomain.has(dom)) byDomain.set(dom, []);
    byDomain.get(dom).push(e);
  }

  const recos = [];
  for (const [domaine, fiches] of byDomain) {
    const reasons = [];
    let score = 0;

    // Délai le plus court trouvé
    const delaiMin = minDelaiJours(fiches);
    if (delaiMin != null) {
      if (delaiMin <= 3) { score += 40; reasons.push(`délai critique ≤ 3j`); }
      else if (delaiMin <= 14) { score += 25; reasons.push(`délai court ≤ 14j`); }
      else if (delaiMin <= 30) { score += 10; reasons.push(`délai ≤ 30j`); }
    }

    // Cascades (effet domino) = risque élevé
    const cascadeSteps = fiches.reduce(
      (sum, f) => sum + (f.cascades?.reduce((s, c) => s + (c.etapes?.length || 0), 0) || 0),
      0
    );
    if (cascadeSteps >= 3) { score += 15; reasons.push('effet cascade possible'); }

    // Faible confiance → priorité plus basse (on traitera quand on saura plus)
    const conf = fiches[0]?.confiance;
    if (conf === 'incertain') { score -= 10; reasons.push('faible confiance — clarifier d\'abord'); }

    // Montant en jeu : on ne l'a pas par défaut, mais si délai critique sur bail/dettes
    // c'est souvent financier direct
    if (['bail', 'dettes', 'travail'].includes(domaine) && delaiMin != null && delaiMin <= 14) {
      score += 5;
      reasons.push('enjeu financier direct');
    }

    recos.push({
      domaine,
      priority_score: score,
      reasons,
      delai_min_jours: delaiMin
    });
  }

  return recos.sort((a, b) => b.priority_score - a.priority_score);
}

function minDelaiJours(fiches) {
  const vals = [];
  for (const f of fiches) {
    for (const d of (f.delais || [])) {
      const s = (d.delai || '').toLowerCase();
      if (s.includes('immédiat') || s.includes('24h')) vals.push(1);
      if (s.includes('48h')) vals.push(2);
      const m = s.match(/(\d+)\s*jours?/);
      if (m) vals.push(parseInt(m[1], 10));
    }
    for (const c of (f.cascades || [])) {
      const s = (c.etapes?.[0]?.delai || '').toLowerCase();
      const m = s.match(/(\d+)\s*jours?/);
      if (m) vals.push(parseInt(m[1], 10));
    }
  }
  return vals.length ? Math.min(...vals) : null;
}
