/**
 * holding-extractor.mjs — Extrait le holding utilisable citoyen d'une décision.
 *
 * Holding = principe juridique tranché, réutilisable dans une consultation.
 * Pas un résumé de la décision, mais la règle/nuance qu'elle établit.
 *
 * Stratégie (sans LLM en passe 1, avec LLM en passe 2 plus tard) :
 *   1. Chercher phrases-marqueurs : "le tribunal retient", "considérant que",
 *      "principe fondamental", "il faut retenir"
 *   2. Extraire la phrase-clé qui suit
 *   3. Valider : longueur ≥ 50 chars, ≤ 400 chars, citoyennement compréhensible
 *   4. Générer un `citizen_summary` court (≤ 180 chars) pour affichage
 *
 * Types de holding :
 *   - 'regle' : "Le bailleur doit supporter les défauts structurels..."
 *   - 'exception' : "Sauf si le défaut est causé par..."
 *   - 'nuance' : "À condition que..."
 *   - 'rejet' : "La demande est rejetée faute de..."
 */

const HOLDING_MARKERS = [
  /(?:le|la|les)\s+tribunal(?:e)?\s+(?:fédéral|cantonal)?\s*(?:retient|considère|admet|rejette|précise|confirme)\s+que\s+([^.]+)\./i,
  /considérant\s+(?:que\s+)?([^.]+)\./i,
  /principe\s+(?:fondamental|directeur)\s*:?\s*([^.]+)\./i,
  /il\s+faut\s+(?:retenir|admettre|considérer)\s+que\s+([^.]+)\./i,
  /selon\s+(?:la jurisprudence|le TF|l'art[a-z.]*\s*\d+),?\s+([^.]+)\./i
];

const MIN_HOLDING_LENGTH = 50;
const MAX_HOLDING_LENGTH = 400;
const MAX_SUMMARY_LENGTH = 180;

function classifyHoldingType(text, role) {
  const lower = (text || '').toLowerCase();
  // Ordre important. `\b` ne fonctionne pas avec 'à' non-ASCII en regex JS,
  // on utilise donc des patterns plus simples.
  if (/à condition|pourvu que|pour autant/i.test(lower)) return 'nuance';
  if (/\bsauf\b|\bexception\b/i.test(lower)) return 'exception';
  if (/\brejet|\birrecev/i.test(lower) || role === 'defavorable') return 'rejet';
  return 'regle';
}

function extractHolding(decision) {
  const blob = [decision.abstract, decision.text_excerpt].filter(Boolean).join(' ');
  if (!blob) return null;
  for (const re of HOLDING_MARKERS) {
    const m = blob.match(re);
    if (!m || !m[1]) continue;
    let candidate = m[1].trim();
    // Clean
    candidate = candidate.replace(/\s+/g, ' ').replace(/^[,:-]\s*/, '');
    if (candidate.length < MIN_HOLDING_LENGTH) continue;
    if (candidate.length > MAX_HOLDING_LENGTH) {
      candidate = candidate.slice(0, MAX_HOLDING_LENGTH - 1).replace(/\s+\S*$/, '') + '…';
    }
    return candidate;
  }
  // Fallback : première phrase significative de l'abstract
  if (decision.abstract && decision.abstract.length >= MIN_HOLDING_LENGTH) {
    const firstSentence = decision.abstract.split(/\.\s+/)[0];
    if (firstSentence && firstSentence.length >= MIN_HOLDING_LENGTH) {
      return firstSentence.slice(0, MAX_HOLDING_LENGTH);
    }
  }
  return null;
}

function makeCitizenSummary(holding, decision) {
  if (holding && holding.length <= MAX_SUMMARY_LENGTH) return holding;
  if (holding) return holding.slice(0, MAX_SUMMARY_LENGTH - 1).replace(/\s+\S*$/, '') + '…';
  // Fallback sans holding : construire depuis title + role
  const bits = [];
  if (decision.title) bits.push(decision.title.slice(0, 100));
  if (decision.role_citizen && decision.role_citizen !== 'neutre') bits.push(`— ${decision.role_citizen}`);
  const summary = bits.join(' ').trim();
  return summary || null;
}

/**
 * Enrichit une décision avec `holding_type`, `holding_text`, `citizen_summary`.
 * Gate : si aucun holding extractible, marque `holding_validated: false`.
 */
export function extractHoldingForDecision(decision) {
  const text = extractHolding(decision);
  const type = text ? classifyHoldingType(text, decision.role_citizen) : null;
  const summary = makeCitizenSummary(text, decision);
  return {
    ...decision,
    holding_type: type,
    holding_text: text,
    citizen_summary: summary,
    holding_validated: !!text && text.length >= MIN_HOLDING_LENGTH
  };
}

export { extractHolding, classifyHoldingType, makeCitizenSummary };
