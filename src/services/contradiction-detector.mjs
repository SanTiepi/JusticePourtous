/**
 * Contradiction Detector — Croisement systématique entre documents
 *
 * Pas de LLM ici — c'est du code déterministe.
 * C'est exactement ce qu'un prompt brut ne sait PAS faire :
 * comparer systématiquement N documents entre eux.
 *
 * Détecte :
 *   1. Incohérences temporelles (même événement, heures différentes)
 *   2. Contradictions factuelles (versions différentes du même fait)
 *   3. Éléments mentionnés dans un doc mais absents d'un autre
 *   4. Conclusions divergentes entre sources
 */

// ============================================================
// TIMELINE BUILDER
// ============================================================

/**
 * Build a unified timeline from all documents
 * @param {object[]} documents - Enriched documents from ingester
 * @returns {object[]} Sorted timeline entries with source tracking
 */
export function buildTimeline(documents) {
  const events = [];

  for (const doc of documents) {
    if (!doc.llm_extraction?.faits) continue;

    for (const fait of doc.llm_extraction.faits) {
      events.push({
        date: fait.date || null,
        heure: fait.heure || null,
        acteur: fait.acteur || 'inconnu',
        action: fait.action,
        lieu: fait.lieu || null,
        source_doc: doc.filename,
        source_type: doc.type,
        doc_id: doc.id,
      });
    }
  }

  // Sort by date then hour
  events.sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    if (dateA && dateB && dateA.getTime() !== dateB.getTime()) return dateA - dateB;
    if (a.heure && b.heure) return a.heure.localeCompare(b.heure);
    return 0;
  });

  return events;
}

function parseDate(str) {
  if (!str) return null;
  // DD.MM.YYYY
  const m = str.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  // YYYY-MM-DD
  const m2 = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return new Date(+m2[1], +m2[2] - 1, +m2[3]);
  return null;
}

// ============================================================
// ACTOR GRAPH
// ============================================================

/**
 * Build a graph of who said what to whom
 */
export function buildActorGraph(documents) {
  const actors = new Map(); // name → { roles, documents, claims }

  for (const doc of documents) {
    const ext = doc.llm_extraction;
    if (!ext) continue;

    // Track sender/receiver
    if (ext.expediteur) {
      if (!actors.has(ext.expediteur)) actors.set(ext.expediteur, { roles: new Set(), docs: [], claims: [] });
      actors.get(ext.expediteur).roles.add('expediteur');
      actors.get(ext.expediteur).docs.push(doc.filename);
    }
    if (ext.destinataire) {
      if (!actors.has(ext.destinataire)) actors.set(ext.destinataire, { roles: new Set(), docs: [], claims: [] });
      actors.get(ext.destinataire).roles.add('destinataire');
    }

    // Track claims per actor
    for (const claim of (ext.claims || [])) {
      if (claim.source && actors.has(claim.source)) {
        actors.get(claim.source).claims.push({
          texte: claim.texte,
          certitude: claim.certitude,
          doc: doc.filename,
        });
      }
    }
  }

  // Convert to serializable
  const result = {};
  for (const [name, data] of actors) {
    result[name] = {
      roles: [...data.roles],
      docs_count: data.docs.length,
      claims_count: data.claims.length,
      claims: data.claims,
    };
  }
  return result;
}

// ============================================================
// CONTRADICTION DETECTION
// ============================================================

/**
 * Detect contradictions across documents
 * @param {object[]} documents - Enriched documents
 * @returns {object[]} List of detected contradictions
 */
export function detectContradictions(documents) {
  const contradictions = [];

  // 1. Collect all contradictions flagged by LLM extraction
  for (const doc of documents) {
    for (const c of (doc.llm_extraction?.contradictions || [])) {
      contradictions.push({
        type: 'intra_document',
        severity: 'moyenne',
        element: c.element,
        version_a: c.version_a,
        version_b: c.version_b,
        source: doc.filename,
      });
    }
  }

  // 2. Cross-document: same event, different times
  const timelineEvents = buildTimeline(documents);
  const eventsByAction = groupByAction(timelineEvents);

  for (const [actionKey, events] of Object.entries(eventsByAction)) {
    if (events.length < 2) continue;
    const times = events.filter(e => e.heure).map(e => ({ heure: e.heure, source: e.source_doc }));
    if (times.length < 2) continue;

    const uniqueTimes = [...new Set(times.map(t => t.heure))];
    if (uniqueTimes.length > 1) {
      contradictions.push({
        type: 'temporelle',
        severity: 'haute',
        element: actionKey,
        versions: times.map(t => `${t.heure} (${t.source})`),
        description: `Même événement, heures différentes: ${uniqueTimes.join(' vs ')}`,
      });
    }
  }

  // 3. Cross-document: divergent conclusions
  const conclusions = [];
  for (const doc of documents) {
    if (['arret_tribunal', 'ordonnance_classement', 'rapport_autopsie', 'rapport_investigation'].includes(doc.type)) {
      const claims = (doc.llm_extraction?.claims || []).filter(c => c.certitude === 'etabli');
      for (const claim of claims) {
        conclusions.push({ texte: claim.texte, source: doc.filename, type: doc.type });
      }
    }
  }

  // Simple keyword contradiction detection
  const excludePatterns = findExclusionContradictions(conclusions);
  contradictions.push(...excludePatterns);

  // 4. Missing elements: mentioned in one doc, absent from investigation
  const questionsTotal = [];
  for (const doc of documents) {
    for (const q of (doc.llm_extraction?.questions_sans_reponse || [])) {
      questionsTotal.push({ question: q, source: doc.filename });
    }
  }

  // Deduplicate similar questions
  const uniqueQuestions = deduplicateQuestions(questionsTotal);

  return {
    contradictions,
    unresolved_questions: uniqueQuestions,
    timeline: timelineEvents,
  };
}

// ============================================================
// HELPERS
// ============================================================

function groupByAction(events) {
  const groups = {};
  for (const e of events) {
    // Normalize action for grouping
    const key = normalizeAction(e.action);
    if (!key) continue;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return groups;
}

function normalizeAction(action) {
  if (!action) return null;
  return action.toLowerCase()
    .replace(/[^\w\sàâéèêëïôùûü]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

function findExclusionContradictions(conclusions) {
  const contradictions = [];

  // Look for pairs where one says "peut être écarté" and another says "ne peut pas exclure"
  const exclusionPairs = [
    { affirm: /peut être écart|peut etre ecart|intervention.*écartée/i, deny: /ne peut.*exclure|pas possible.*exclure|ne pouvons pas exclure/i, label: 'intervention tiers' },
    { affirm: /accident|chute|cas maladie/i, deny: /coup|agression|intervention|ne peut.*exclure/i, label: 'cause du décès' },
  ];

  for (const pair of exclusionPairs) {
    const affirms = conclusions.filter(c => pair.affirm.test(c.texte));
    const denies = conclusions.filter(c => pair.deny.test(c.texte));

    if (affirms.length > 0 && denies.length > 0) {
      contradictions.push({
        type: 'conclusion_divergente',
        severity: 'critique',
        element: pair.label,
        version_a: affirms.map(a => `"${a.texte.slice(0, 100)}" (${a.source})`),
        version_b: denies.map(d => `"${d.texte.slice(0, 100)}" (${d.source})`),
        description: `Conclusions divergentes sur: ${pair.label}`,
      });
    }
  }

  return contradictions;
}

function deduplicateQuestions(questions) {
  const seen = new Set();
  const unique = [];
  for (const q of questions) {
    const norm = q.question.toLowerCase().slice(0, 50);
    if (!seen.has(norm)) {
      seen.add(norm);
      unique.push(q);
    }
  }
  return unique;
}

// ============================================================
// GAP DETECTION — What's missing from the investigation
// ============================================================

/**
 * Detect gaps: measures requested but refused, measures never taken
 */
export function detectGaps(documents) {
  const requested = [];
  const refused = [];
  const taken = [];

  for (const doc of documents) {
    const ext = doc.llm_extraction;
    if (!ext) continue;
    for (const m of (ext.mesures_demandees || [])) {
      requested.push({ mesure: m, source: doc.filename });
    }
    for (const m of (ext.mesures_refusees || [])) {
      refused.push({ mesure: m, source: doc.filename });
    }
  }

  return {
    total_requested: requested.length,
    total_refused: refused.length,
    requested,
    refused,
    acceptance_rate: requested.length > 0
      ? ((requested.length - refused.length) / requested.length * 100).toFixed(1) + '%'
      : 'N/A',
  };
}

export default { buildTimeline, buildActorGraph, detectContradictions, detectGaps };
