/**
 * Round Contradiction Detector — détecte les contradictions de faits entre
 * deux extractions successives au sein d'un même triage (round N vs N-1).
 *
 * À ne PAS confondre avec contradiction-detector.mjs qui détecte les
 * contradictions inter-documents pour le dossier-analyzer.
 *
 * Règle freeze #15 : dès qu'une contradiction apparaît, un round dédié
 * mono-question doit lever avant de poursuivre.
 *
 * On compare des FAITS ATOMIQUES, pas le texte libre. Les faits sont extraits
 * de navigation.infos_extraites et de l'objet facts normalisé.
 */

const COMPARABLE_KEYS = [
  'canton',
  'date',
  'date_debut',
  'date_fin',
  'domaine',
  'statut_employeur',
  'statut_locataire',
  'adversaire',
  'montant_chf',
  'delai_jours',
  'nombre_enfants',
  'situation_personnelle'
];

function normalize(v) {
  if (v == null) return null;
  if (typeof v === 'string') return v.trim().toLowerCase();
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v;
  return JSON.stringify(v);
}

/**
 * Compare deux snapshots de faits.
 *
 * @param {object} before - faits extraits au round précédent
 * @param {object} after  - faits extraits au round courant
 * @returns {Array<{key, before, after, severity}>} triées par sévérité décroissante
 */
export function detectRoundContradictions(before = {}, after = {}) {
  if (!before || !after) return [];
  const contradictions = [];

  for (const key of COMPARABLE_KEYS) {
    const b = normalize(before[key]);
    const a = normalize(after[key]);
    if (b == null || a == null) continue; // info absente d'un côté = ajout, pas contradiction
    if (b === a) continue;

    contradictions.push({
      key,
      before: before[key],
      after: after[key],
      severity: severityFor(key)
    });
  }

  return contradictions.sort((x, y) => y.severity - x.severity);
}

function severityFor(key) {
  const HIGH = new Set(['canton', 'domaine', 'date', 'statut_employeur', 'statut_locataire', 'adversaire']);
  const MED = new Set(['date_debut', 'date_fin', 'delai_jours', 'montant_chf']);
  if (HIGH.has(key)) return 3;
  if (MED.has(key)) return 2;
  return 1;
}

/** Doit-on bloquer et poser une question de levée ? severity ≥ 2 bloque. */
export function shouldBlockForContradiction(contradictions) {
  return contradictions.some(c => c.severity >= 2);
}

/** Génère la question mono-levée pour la contradiction la plus sévère. */
export function buildContradictionQuestion(contradictions) {
  if (!contradictions.length) return null;
  const top = contradictions[0];
  return {
    id: `contradiction_${top.key}`,
    question: `Vous aviez indiqué « ${top.before} » pour ${humanKey(top.key)}, puis « ${top.after} ». Laquelle est correcte ?`,
    choix: [
      { id: 'before', label: String(top.before) },
      { id: 'after', label: String(top.after) }
    ],
    importance: 'critique',
    kind: 'contradiction_resolution'
  };
}

function humanKey(key) {
  const map = {
    canton: 'le canton',
    date: 'la date',
    date_debut: 'la date de début',
    date_fin: 'la date de fin',
    domaine: 'le domaine',
    statut_employeur: 'le statut employeur',
    statut_locataire: 'le statut locataire',
    adversaire: 'l\'adversaire',
    montant_chf: 'le montant',
    delai_jours: 'le délai',
    nombre_enfants: 'le nombre d\'enfants',
    situation_personnelle: 'la situation personnelle'
  };
  return map[key] || key;
}

export { COMPARABLE_KEYS };
