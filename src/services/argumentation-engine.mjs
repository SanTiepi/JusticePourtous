/**
 * Argumentation Engine — Moteur d'arguments réfutables compilé
 *
 * Innovation V4 #1: Graphe Dung/Toulmin résolu par CODE, pas LLM.
 *
 * Structure d'un argument (Toulmin):
 *   claim     — l'affirmation ("Le locataire a droit à une réduction")
 *   warrant   — la règle d'inférence ("Si défaut → réduction")
 *   backing   — la source autoritaire (CO 259a, tier 1)
 *   rebuttal  — l'exception ou contre-argument
 *   qualifier — le degré de certitude
 *
 * Le LLM propose les nœuds. Le code tranche les statuts.
 * Seuls les arguments gagnants deviennent des verified_claims.
 */

// ─── Argument statuses (Dung semantics) ─────────────────────────

const STATUS = {
  IN: 'in',           // Accepted — no undefeated attacker
  OUT: 'out',         // Defeated — has an undefeated attacker
  UNDECIDED: 'undecided', // In a cycle or mutual attack
};

// ─── Argument node ──────────────────────────────────────────────

/**
 * Create an argument node.
 */
function createArgument({
  id,
  type = 'claim', // claim | rebuttal | exception | support
  text,
  source_ids = [],
  tier = 3,
  binding_strength = 'indicatif',
  issue_id = null,
}) {
  return {
    id,
    type,
    text,
    source_ids,
    tier,
    binding_strength,
    issue_id,
    status: STATUS.UNDECIDED,
    attackers: [],   // IDs of arguments that attack this one
    supporters: [],  // IDs of arguments that support this one
    attacks: [],     // IDs of arguments this one attacks
  };
}

// ─── Attack relation ────────────────────────────────────────────

/**
 * Register an attack: attacker attacks target.
 */
function addAttack(graph, attackerId, targetId) {
  const attacker = graph.get(attackerId);
  const target = graph.get(targetId);
  if (!attacker || !target) return;
  if (!target.attackers.includes(attackerId)) target.attackers.push(attackerId);
  if (!attacker.attacks.includes(targetId)) attacker.attacks.push(targetId);
}

/**
 * Register a support relation.
 */
function addSupport(graph, supporterId, targetId) {
  const supporter = graph.get(supporterId);
  const target = graph.get(targetId);
  if (!supporter || !target) return;
  if (!target.supporters.includes(supporterId)) target.supporters.push(supporterId);
}

// ─── Grounded semantics solver ──────────────────────────────────

/**
 * Compute the grounded extension (most skeptical, unique).
 * Algorithm: iterative labeling.
 *
 * 1. All unattacked arguments → IN
 * 2. All arguments attacked by an IN argument → OUT
 * 3. Repeat until stable
 * 4. Remaining = UNDECIDED
 */
function solveGrounded(graph) {
  const args = [...graph.values()];

  // Reset all to undecided
  for (const arg of args) arg.status = STATUS.UNDECIDED;

  let changed = true;
  let iterations = 0;
  const MAX_ITER = args.length + 1; // prevent infinite loops

  while (changed && iterations < MAX_ITER) {
    changed = false;
    iterations++;

    for (const arg of args) {
      if (arg.status !== STATUS.UNDECIDED) continue;

      // Check if all attackers are OUT → this arg is IN
      const allAttackersOut = arg.attackers.length === 0 ||
        arg.attackers.every(aid => graph.get(aid)?.status === STATUS.OUT);

      if (allAttackersOut) {
        arg.status = STATUS.IN;
        changed = true;

        // All arguments attacked by this IN arg become OUT
        for (const targetId of arg.attacks) {
          const target = graph.get(targetId);
          if (target && target.status === STATUS.UNDECIDED) {
            target.status = STATUS.OUT;
            changed = true;
          }
        }
      }
    }
  }

  return { iterations, args };
}

// ─── Tier-aware resolution ──────────────────────────────────────

/**
 * When two arguments are in mutual attack (cycle), resolve by tier priority.
 * Higher tier (lower number) wins. Equal tier = both stay UNDECIDED.
 */
function resolveTierConflicts(graph) {
  const args = [...graph.values()];
  const undecided = args.filter(a => a.status === STATUS.UNDECIDED);

  for (const arg of undecided) {
    const undecidedAttackers = arg.attackers
      .map(id => graph.get(id))
      .filter(a => a && a.status === STATUS.UNDECIDED);

    for (const attacker of undecidedAttackers) {
      // If tiers differ, higher tier wins
      if (arg.tier < attacker.tier) {
        // arg is stronger source → arg wins
        arg.status = STATUS.IN;
        attacker.status = STATUS.OUT;
      } else if (attacker.tier < arg.tier) {
        attacker.status = STATUS.IN;
        arg.status = STATUS.OUT;
      }
      // Equal tier → stay UNDECIDED (genuine conflict)
    }
  }
}

// ─── Build argumentation graph from dossier ─────────────────────

/**
 * Build an argumentation graph from a pipeline V3 dossier issue.
 * @param {object} issue — from dossier.issues[]
 * @returns {Map} argumentation graph
 */
export function buildFromIssue(issue) {
  const graph = new Map();
  let argCount = 0;

  function nextId(prefix) {
    return `${prefix}_${++argCount}`;
  }

  // 1. Claims from articles (positive legal basis)
  for (const art of (issue.articles || [])) {
    const id = nextId('art');
    graph.set(id, createArgument({
      id,
      type: 'claim',
      text: `Base légale: ${art.ref} — ${art.titre || art.texteSimple?.slice(0, 100) || ''}`,
      source_ids: [art.source_id].filter(Boolean),
      tier: art.lienFedlex ? 1 : 3,
      binding_strength: art.lienFedlex ? 'decisif' : 'indicatif',
      issue_id: issue.issue_id,
    }));
  }

  // 2. Favorable jurisprudence → supports claims
  for (const arret of (issue.arrets || []).filter(a => a.role === 'favorable')) {
    const id = nextId('fav');
    graph.set(id, createArgument({
      id,
      type: 'support',
      text: `Juris favorable: ${arret.signature} — ${arret.resume?.slice(0, 100) || arret.principeCle || ''}`,
      source_ids: [arret.source_id].filter(Boolean),
      tier: 2,
      binding_strength: 'analogique',
      issue_id: issue.issue_id,
    }));
    // Supports all article claims
    for (const [claimId, claim] of graph) {
      if (claim.type === 'claim') addSupport(graph, id, claimId);
    }
  }

  // 3. Defavorable jurisprudence → mutual attack with claims (contradictoire)
  for (const arret of (issue.arrets || []).filter(a => a.role === 'defavorable')) {
    const id = nextId('contra');
    graph.set(id, createArgument({
      id,
      type: 'rebuttal',
      text: `Juris contra: ${arret.signature} — ${arret.resume?.slice(0, 100) || arret.principeCle || ''}`,
      source_ids: [arret.source_id].filter(Boolean),
      tier: 2,
      binding_strength: 'analogique',
      issue_id: issue.issue_id,
    }));
    // Mutual attack: contra attacks claims, claims counter-attack contra
    // This models the contradictoire: both sides challenge each other
    // Tier resolution decides the winner (law > jurisprudence)
    for (const [claimId, claim] of graph) {
      if (claim.type === 'claim') {
        addAttack(graph, id, claimId);
        addAttack(graph, claimId, id); // counter-attack
      }
    }
  }

  // 4. Anti-erreurs → attack claims with warnings
  for (const ae of (issue.anti_erreurs || [])) {
    const id = nextId('ae');
    graph.set(id, createArgument({
      id,
      type: 'exception',
      text: `Anti-erreur: ${ae.erreur} → ${ae.consequence || ''}`,
      source_ids: [ae.source_id].filter(Boolean),
      tier: 3,
      binding_strength: 'indicatif',
      issue_id: issue.issue_id,
    }));
    // Anti-erreurs don't defeat claims, they warn — so we add as support to rebuttals
    // (they weaken claims indirectly)
  }

  // 5. Neutral jurisprudence → undecided
  for (const arret of (issue.arrets || []).filter(a => a.role === 'neutre')) {
    const id = nextId('neu');
    graph.set(id, createArgument({
      id,
      type: 'claim',
      text: `Juris neutre: ${arret.signature} — ${arret.resume?.slice(0, 100) || ''}`,
      source_ids: [arret.source_id].filter(Boolean),
      tier: 2,
      binding_strength: 'analogique',
      issue_id: issue.issue_id,
    }));
  }

  return graph;
}

// ─── Resolve and extract verified claims ────────────────────────

/**
 * Resolve an argumentation graph and extract verified claims.
 * @param {Map} graph — from buildFromIssue
 * @returns {object} resolution with claims, rebuttals, conflicts
 */
export function resolve(graph) {
  // Step 1: Grounded semantics
  const { iterations } = solveGrounded(graph);

  // Step 2: Tier-based conflict resolution for remaining undecided
  resolveTierConflicts(graph);

  const args = [...graph.values()];

  // Extract results
  const accepted = args.filter(a => a.status === STATUS.IN);
  const defeated = args.filter(a => a.status === STATUS.OUT);
  const undecided = args.filter(a => a.status === STATUS.UNDECIDED);

  // Verified claims = accepted claims/supports
  const verifiedClaims = accepted
    .filter(a => a.type === 'claim' || a.type === 'support')
    .map(a => ({
      id: a.id,
      text: a.text,
      source_ids: a.source_ids,
      tier: a.tier,
      binding_strength: a.binding_strength,
      verification_status: 'verified',
      certainty: a.tier === 1 ? 'certain' : a.tier === 2 ? 'probable' : 'variable',
    }));

  // Active rebuttals = accepted rebuttals (counter-arguments that won)
  const activeRebuttals = accepted
    .filter(a => a.type === 'rebuttal' || a.type === 'exception')
    .map(a => ({
      id: a.id,
      text: a.text,
      source_ids: a.source_ids,
      severity: a.tier <= 2 ? 'high' : 'medium',
    }));

  // Unresolved conflicts
  const conflicts = undecided.map(a => ({
    id: a.id,
    text: a.text,
    reason: 'mutual_attack_same_tier',
    recommendation: 'Consulter un professionnel — point juridiquement disputé',
  }));

  return {
    total_arguments: args.length,
    accepted: accepted.length,
    defeated: defeated.length,
    undecided: undecided.length,
    iterations,
    verified_claims: verifiedClaims,
    active_rebuttals: activeRebuttals,
    conflicts,
    // Certitude globale
    overall_certainty: conflicts.length > 0 ? 'incertain'
      : activeRebuttals.length > 0 ? 'limited'
      : verifiedClaims.length > 0 ? 'confirmed'
      : 'insufficient',
  };
}

/**
 * Full pipeline: issue → graph → resolution.
 */
export function analyzeIssue(issue) {
  const graph = buildFromIssue(issue);
  return resolve(graph);
}

/**
 * Analyze all issues in a dossier.
 */
export function analyzeDossier(dossier) {
  if (!dossier?.issues?.length) {
    return { issues: [], overall: 'insufficient' };
  }

  const results = dossier.issues.map(issue => ({
    issue_id: issue.issue_id,
    domaine: issue.domaine,
    qualification: issue.qualification,
    ...analyzeIssue(issue),
  }));

  // Overall = worst issue certainty
  const certainties = results.map(r => r.overall_certainty);
  let overall = 'confirmed';
  if (certainties.includes('insufficient')) overall = 'insufficient';
  else if (certainties.includes('incertain')) overall = 'incertain';
  else if (certainties.includes('limited')) overall = 'limited';

  return { issues: results, overall };
}

export { createArgument, addAttack, addSupport, solveGrounded, resolveTierConflicts, STATUS };
