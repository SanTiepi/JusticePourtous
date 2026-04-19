/**
 * Safety Classifier — détecte les signaux critiques nécessitant un court-circuit
 * du pipeline juridique (freeze D #28-32).
 *
 * Signaux détectés :
 *   - detresse             → 143 La Main Tendue, 144, 147
 *   - violence_domestique  → LAVI, 117, AVP, protocole discret
 *   - menace_tiers         → 117 si danger imminent, refus
 *   - mineur               → 147 Pro Juventute, ton adapté, tuteur
 *   - illegal_intent       → refus + redirection constructive vers alternative légale
 *
 * Classifier hybride :
 *   - Phase 1 (code) : patterns + keywords robustes (approximation)
 *   - Phase 2 (LLM)  : à venir — appel LLM dédié safety pour les cas ambigus
 *
 * Sortie alignée sur la whitelist logs safety (freeze) :
 *   signal_type, language, action_taken, round_number
 *   (aucun verbatim, aucune PII)
 */

export const SIGNAL_TYPES = Object.freeze({
  DETRESSE: 'detresse',
  VIOLENCE: 'violence_domestique',
  MENACE: 'menace_tiers',
  MINEUR: 'mineur',
  ILLEGAL_INTENT: 'illegal_intent'
});

export const ACTIONS = Object.freeze({
  URGENCE_143: '143',
  URGENCE_144: '144',
  URGENCE_147: '147',
  LAVI: 'LAVI',
  REFUS: 'refus',
  REDIRECTION_HUMAINE: 'redirection_humaine'
});

/**
 * Classe la gravité des patterns — TRIÉS par priorité décroissante de severity.
 * L'ordre compte : detresse > violence > menace > mineur > illegal.
 */
const PATTERNS = [
  {
    signal: SIGNAL_TYPES.DETRESSE,
    severity: 10,
    patterns: [
      /\bsuicid(e|er|aire)/i,
      /me tuer\b/i,
      /\ben finir\b/i,
      /\bplus (envie|la force) de vivre\b/i,
      /\bj'ai plus rien\b/i,
      /\bme jeter\b/i,
      /\bpas la force de continuer\b/i
    ],
    actions: [ACTIONS.URGENCE_143, ACTIONS.URGENCE_144]
  },
  {
    signal: SIGNAL_TYPES.VIOLENCE,
    severity: 9,
    patterns: [
      /\bil (me )?(frappe|bat|tape|cogne)/i,
      /\belle (me )?(frappe|bat|tape|cogne)/i,
      /\bm'a (frapp|batt|tap|cogn)/i,
      /\bviolence (domestique|conjugale)/i,
      /\bpeur de rentrer (chez|à la maison)/i,
      /\bil me menace\b/i,
      /\bje crains pour ma (vie|sécurité)/i
    ],
    actions: [ACTIONS.LAVI, ACTIONS.URGENCE_144]
  },
  {
    signal: SIGNAL_TYPES.MENACE,
    severity: 8,
    patterns: [
      /\bje vais (le|la|les) (tuer|buter|dégommer|descendre)\b/i,
      /\bje vais (tuer|buter|dégommer)/i,
      /\bj'vais (le|la|les)? ?(tuer|buter|niquer)/i,
      /\bje vais faire mal/i,
      /\bje vais me venger\b.*(violent|violence|tuer)/i
    ],
    actions: [ACTIONS.REFUS]
  },
  {
    signal: SIGNAL_TYPES.MINEUR,
    severity: 4,
    patterns: [
      /\bj'ai (\d+) ans\b/i, // extrait l'âge et vérifié < 18
      /\bje suis mineur/i,
      /\b(à|a) l'école\b.*\bmes parents\b/i,
      /\bmes parents m'empêch/i
    ],
    actions: [ACTIONS.URGENCE_147, ACTIONS.REDIRECTION_HUMAINE],
    extraCheck: (text, match) => {
      const ageMatch = text.match(/\bj'ai (\d+) ans\b/i);
      if (ageMatch) {
        const age = parseInt(ageMatch[1], 10);
        return age < 18;
      }
      return true;
    }
  },
  {
    signal: SIGNAL_TYPES.ILLEGAL_INTENT,
    severity: 3,
    patterns: [
      /\bje veux (pas|plus) payer.*me venger/i,
      /\bfrauder\b/i,
      /\barnaquer\b/i,
      /\bje (veux|compte) (arnaquer|escroquer|voler)/i,
      /\bfaire croire que/i
    ],
    actions: [ACTIONS.REFUS, ACTIONS.REDIRECTION_HUMAINE]
  }
];

/**
 * @param {string} text — texte libre du citoyen
 * @param {object} [context] — { language?: 'fr'|'de'|'it', round_number?: number }
 * @returns {{ triggered: boolean, signal_type?: string, severity?: number, actions?: string[], log_entry?: object }}
 */
export function classifySafety(text, { language = 'fr', round_number = 1 } = {}) {
  if (!text || typeof text !== 'string') return { triggered: false };

  for (const pat of PATTERNS) {
    for (const re of pat.patterns) {
      const m = text.match(re);
      if (!m) continue;
      if (pat.extraCheck && !pat.extraCheck(text, m)) continue;

      return {
        triggered: true,
        signal_type: pat.signal,
        severity: pat.severity,
        actions: [...pat.actions],
        log_entry: buildLogEntry({
          signal_type: pat.signal,
          language,
          action_taken: pat.actions[0],
          round_number
        })
      };
    }
  }

  return { triggered: false };
}

/**
 * Construit un log safety conforme à la whitelist du freeze.
 * AUCUN texte libre, AUCUNE PII.
 */
export function buildLogEntry({ signal_type, language, action_taken, round_number }) {
  return {
    timestamp: roundToHour(Date.now()),
    signal_type,
    language,
    action_taken,
    round_number
  };
}

function roundToHour(ms) {
  const d = new Date(ms);
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

/**
 * Construit la réponse de redirection pour un signal détecté.
 * Court-circuite le pipeline juridique.
 */
export function buildSafetyResponse(signal_type) {
  switch (signal_type) {
    case SIGNAL_TYPES.DETRESSE:
      return {
        type: 'safety_redirect',
        signal: signal_type,
        message: 'Votre situation nécessite une écoute immédiate. Voici des ressources disponibles :',
        resources: [
          { name: 'La Main Tendue', phone: '143', note: '24h/24, anonyme, gratuit' },
          { name: 'Urgences médicales', phone: '144', note: '24h/24' },
          { name: 'Pro Juventute (jeunes)', phone: '147', note: 'si moins de 25 ans' }
        ],
        can_continue_later: true,
        priority: 'critical'
      };
    case SIGNAL_TYPES.VIOLENCE:
      return {
        type: 'safety_redirect',
        signal: signal_type,
        message: 'Votre sécurité passe avant tout. Si vous êtes en danger immédiat, appelez le 117.',
        resources: [
          { name: 'Police (urgence)', phone: '117', note: 'en cas de danger immédiat' },
          { name: 'LAVI (aide aux victimes)', phone: '0848 28 28 28', note: 'soutien confidentiel' },
          { name: 'Urgences médicales', phone: '144', note: 'blessures' }
        ],
        discreet_mode: true,
        clear_history_available: true,
        priority: 'critical'
      };
    case SIGNAL_TYPES.MENACE:
      return {
        type: 'safety_refusal',
        signal: signal_type,
        message: 'Je ne peux pas vous accompagner dans cette démarche. Si une personne est en danger, appelez le 117.',
        priority: 'high'
      };
    case SIGNAL_TYPES.MINEUR:
      return {
        type: 'minor_redirect',
        signal: signal_type,
        message: 'Pour t\'accompagner au mieux, voici des ressources adaptées :',
        resources: [
          { name: 'Pro Juventute', phone: '147', note: 'gratuit, confidentiel, 24h/24' },
          { name: 'TPAE (protection)', note: 'autorité de protection de l\'enfant et de l\'adulte' }
        ],
        adapted_language: true,
        priority: 'high'
      };
    case SIGNAL_TYPES.ILLEGAL_INTENT:
      return {
        type: 'constructive_refusal',
        signal: signal_type,
        message: 'Je ne peux pas vous aider sur cette voie, mais voici les démarches légales qui peuvent atteindre un résultat similaire.',
        priority: 'medium'
      };
    default:
      return null;
  }
}
