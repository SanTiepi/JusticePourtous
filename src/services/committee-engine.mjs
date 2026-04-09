/**
 * Committee Engine — Comité institutionnel à désaccord contrôlé
 *
 * Innovation V4 #4: Multi-rôles votant sur objets normalisés, pas prose.
 *
 * 4 rôles fixes:
 *   - Avocat du citoyen: maximise les droits du demandeur
 *   - Avocat adverse: cherche les failles et contre-arguments
 *   - Greffier: vérifie recevabilité, délais, formalités
 *   - Juge de tri: tranche les divergences, qualifie l'incertitude
 *
 * Chaque rôle vote sur des objets normalisés (claims, exceptions, preuves manquantes).
 * Seuls les éléments INVARIANTS (unanimes ou 3/4) deviennent verified_claims.
 * Le désaccord est un signal produit visible au citoyen.
 */

// ─── Role definitions ───────────────────────────────────────────

export const ROLES = {
  citizen_counsel: {
    id: 'citizen_counsel',
    label: 'Avocat du citoyen',
    mission: 'Maximiser les droits et protections du demandeur. Chercher tous les arguments favorables.',
    bias: 'favorable',
    system_prompt: `Tu es l'avocat du citoyen. Ta mission: trouver TOUS les arguments juridiques qui soutiennent sa position.
Pour chaque claim du dossier:
- VOTE "soutien" si le claim renforce la position du citoyen
- VOTE "objection" si le claim est trop faible ou mal sourcé — propose une meilleure formulation
- Signale tout droit oublié, toute protection non invoquée
Réponds en JSON: { votes: [{ claim_id, vote: "soutien"|"objection", raison, suggestion? }], droits_oublies: [] }`,
  },
  adverse_counsel: {
    id: 'adverse_counsel',
    label: 'Avocat adverse',
    mission: 'Chercher les failles, exceptions, et contre-arguments. Attaquer chaque claim.',
    bias: 'defavorable',
    system_prompt: `Tu es l'avocat de la partie adverse. Ta mission: attaquer CHAQUE claim et trouver les failles.
Pour chaque claim du dossier:
- VOTE "attaque" avec la meilleure objection juridique sourcée
- VOTE "concede" UNIQUEMENT si le claim est inattaquable (loi fédérale claire, pas d'exception)
- Signale toute exception non considérée, toute condition manquante
Réponds en JSON: { votes: [{ claim_id, vote: "attaque"|"concede", objection?, source_id? }], exceptions_oubliees: [] }`,
  },
  clerk: {
    id: 'clerk',
    label: 'Greffier',
    mission: 'Vérifier recevabilité, délais, formalités, compétence territoriale.',
    bias: 'neutre',
    system_prompt: `Tu es le greffier du tribunal. Ta mission: vérifier les aspects FORMELS de chaque claim.
Pour chaque claim:
- VOTE "recevable" si les conditions formelles sont remplies
- VOTE "irrecevable" si un délai est dépassé, une formalité manque, ou le tribunal est incompétent
- Signale tout délai critique, toute pièce manquante, toute question de compétence
Réponds en JSON: { votes: [{ claim_id, vote: "recevable"|"irrecevable", raison, delai_critique? }], formalites_manquantes: [] }`,
  },
  judge: {
    id: 'judge',
    label: 'Juge de tri',
    mission: 'Trancher les divergences entre rôles. Qualifier l\'incertitude.',
    bias: 'neutre',
    system_prompt: `Tu es le juge de tri. Tu reçois les votes des 3 autres rôles et tu tranches.
Pour chaque claim:
- Si 3/3 soutiennent → "confirmed"
- Si l'adverse attaque sans concession → "limited" + affiche l'objection
- Si le greffier dit irrecevable → "insufficient" + affiche la raison
- Si désaccord fort → "conflicted" + affiche les deux positions
Réponds en JSON: { decisions: [{ claim_id, statut: "confirmed"|"limited"|"conflicted"|"insufficient", raison, objection_visible? }] }`,
  },
};

// ─── Committee voting (code-based, no LLM needed for V1) ────────

/**
 * Simulate committee votes on an argumentation result.
 * V1: pure code — uses argumentation engine output + certificate.
 * V2 (future): each role = separate LLM call with role system prompt.
 *
 * @param {object} argResult — from analyzeIssue()
 * @param {object} certificate — from certifyIssue()
 * @returns {object} committee decision with votes and final statuts
 */
export function runCommittee(argResult, certificate) {
  const decisions = [];

  for (const claim of (argResult.verified_claims || [])) {
    const votes = {
      citizen_counsel: 'soutien',   // verified claim = favorable by definition
      adverse_counsel: 'concede',    // verified = survived attacks
      clerk: certificate?.status !== 'insufficient' ? 'recevable' : 'irrecevable',
      judge: null, // decided below
    };

    // Check if any rebuttal targets this claim's sources
    const hasActiveRebuttal = (argResult.active_rebuttals || []).some(r =>
      r.source_ids?.some(sid => claim.source_ids?.includes(sid))
    );

    // Check if there's a conflict involving this claim
    const hasConflict = (argResult.conflicts || []).length > 0;

    // Judge decides
    if (votes.clerk === 'irrecevable') {
      votes.judge = 'insufficient';
    } else if (hasConflict) {
      votes.judge = 'conflicted';
    } else if (hasActiveRebuttal) {
      votes.judge = 'limited';
    } else {
      votes.judge = 'confirmed';
    }

    decisions.push({
      claim_id: claim.id,
      claim_text: claim.text,
      source_ids: claim.source_ids,
      votes,
      final_statut: votes.judge,
      unanime: Object.values(votes).every(v => v === 'soutien' || v === 'concede' || v === 'recevable' || v === 'confirmed'),
    });
  }

  // Handle conflicts as visible disagreements
  const disagreements = (argResult.conflicts || []).map(c => ({
    argument: c.text,
    reason: c.reason,
    citizen_view: 'Ce point est juridiquement disputé',
    adverse_view: 'L\'autre partie pourrait contester',
    recommendation: c.recommendation || 'Consulter un professionnel',
  }));

  // Handle active rebuttals as warnings
  const warnings = (argResult.active_rebuttals || []).map(r => ({
    rebuttal: r.text,
    severity: r.severity,
    action: 'Préparer une réponse à cette objection',
  }));

  // Aggregate
  const confirmed = decisions.filter(d => d.final_statut === 'confirmed').length;
  const limited = decisions.filter(d => d.final_statut === 'limited').length;
  const conflicted = decisions.filter(d => d.final_statut === 'conflicted').length;
  const insufficient = decisions.filter(d => d.final_statut === 'insufficient').length;

  return {
    decisions,
    disagreements,
    warnings,
    summary: {
      total_claims: decisions.length,
      confirmed,
      limited,
      conflicted,
      insufficient,
      unanimity_rate: decisions.length > 0
        ? Math.round((decisions.filter(d => d.unanime).length / decisions.length) * 100)
        : 0,
    },
    besoin_avocat: conflicted > 0 || insufficient > 0,
    besoin_avocat_raison: conflicted > 0
      ? `${conflicted} point(s) juridiquement disputé(s) nécessitent un avis professionnel`
      : insufficient > 0
        ? `${insufficient} point(s) formellement irrecevable(s)`
        : null,
  };
}

/**
 * Full committee analysis for a dossier issue.
 */
export function analyzeWithCommittee(argResult, certificate) {
  return runCommittee(argResult, certificate);
}
