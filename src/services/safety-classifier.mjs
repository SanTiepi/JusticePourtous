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
      // "me tuer" EN PREMIÈRE PERSONNE uniquement (suicide). Sinon "il va me tuer"
      // (menace d'un tiers) était capté ici (sévérité 10) et routé vers le 143 suicide
      // au lieu du 117 police — bug détecté au smoke test 2026-05-31. La menace tierce
      // est désormais captée par le signal VIOLENCE (→ 117).
      /\bje\s+(?:[a-zà-ÿ']+\s+){1,2}me\s+tuer\b/i,
      /\bje\s+(?:vais|veux|voudrais|voudrai)\s+me\s+tuer\b/i,
      /\bme\s+suicider\b/i,
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
      // Agresseur nommé par pronom (il/elle) ou terme de relation
      // (conjoint, mari, femme, partenaire, compagnon, compagne, époux,
      // épouse, copain, copine, père, mère, frère, fils, ex, etc.)
      // — nécessaire car "Mon conjoint me frappe" était laissé passer.
      /\b(il|elle|mon (conjoint|mari|partenaire|compagnon|copain|père|frère|fils|ex|beau-p[èe]re)|ma (femme|partenaire|compagne|copine|mère|sœur|fille|ex|belle-m[èe]re)|mes parents) (me |nous )?(frappe|bat|tape|cogne|tabasse|maltraite|agresse|menace|viole|violent|brutalise)/i,
      /\bm'a (frapp|batt|tap|cogn|maltrait|agress|menac)/i,
      /\bviolence (domestique|conjugale|familiale|sur enfant)/i,
      /\bpeur de rentrer (chez|à la maison)/i,
      /\bje crains pour ma (vie|sécurité|intégrité)/i,
      /\bil (me|nous) tabasse/i,
      /\bje suis (battu|battue|maltrait[ée])/i,
      // Danger imminent par un tiers (audit 2026-05-31, gap 4) : menace de mort à la
      // 3e personne / arme. "il va nous tuer", "il a un couteau" n'étaient PAS captés
      // (les patterns ci-dessus exigent un verbe de coups, ceux de MENACE sont en 1re
      // personne). Une victime barricadée face à une arme recevait une fiche, pas le 117.
      /\b(va|vont|veut|veulent|menace de|menacent de|va finir par)\s+(me\s|nous\s|te\s|la\s|le\s|les\s|m'|s')?\s*(tuer|buter|égorger|poignarder|massacrer|descendre|achever|étrangler|saigner)\b/i,
      /\b(il|elle|ils|elles|mon (mari|ex|conjoint|compagnon|copain|voisin|p[èe]re|fils|fr[èe]re)|ma (femme|compagne|copine|voisine|m[èe]re)|quelqu'un)\b[^.!?]{0,45}\b(couteau|fusil|pistolet|revolver|machette|flingue|arme (?:à feu|blanche))\b/i,
      /\b(menace|pointe|braque|brandit|sorti|tient)\b[^.!?]{0,15}\b(?:un |une |son |sa )?(couteau|fusil|pistolet|revolver|machette|hache)\b/i
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
 * Préambule empathique commun à tous les signaux détresse/violence/mineur.
 * Explicite au citoyen que l'humain vient avant le dossier.
 */
const EMPATHIC_PREAMBLE_DETRESSE =
  'Nous avons détecté que vous vivez une situation de détresse. Avant toute démarche juridique, nous vous invitons à parler à une personne qui peut vous écouter maintenant.';
const EMPATHIC_PREAMBLE_VIOLENCE =
  'Nous avons détecté des signaux indiquant que vous vivez une situation de violence. Votre sécurité immédiate passe avant toute procédure juridique.';
const EMPATHIC_PREAMBLE_MINEUR =
  'Nous voyons que tu es jeune. Tu n\'es pas seul·e, et il y a des personnes formées pour t\'écouter en toute confidentialité.';

const DISCLAIMER_HUMAN_FIRST =
  'Votre santé compte plus qu\'un dossier juridique. Prenez soin de vous.';

const CONTINUE_BUTTON = {
  label: 'Continuer le triage juridique quand même',
  action: 'continue_anyway',
  note: 'Vous pouvez choisir de poursuivre l\'analyse juridique. Nous garderons les numéros d\'urgence affichés en bas de page.'
};

/**
 * Construit la réponse de redirection pour un signal détecté.
 * Court-circuite le pipeline juridique.
 *
 * Enrichissements (2026-04-19 citizen UX) :
 *  - preamble empathique explicite
 *  - ressources élargies (La Main Tendue 143, Pro Mente Sana, VIVAVA, SOS Femmes)
 *  - liens cliquables (url + tel:)
 *  - bouton explicite "continuer le triage juridique quand même"
 *  - disclaimer humain-first
 *
 * Contrat stable : tous les anciens champs (type, signal, message, resources,
 * priority, can_continue_later, discreet_mode, clear_history_available,
 * adapted_language) sont préservés. Nouveaux champs optionnels ajoutés.
 */
export function buildSafetyResponse(signal_type) {
  switch (signal_type) {
    case SIGNAL_TYPES.DETRESSE:
      return {
        type: 'safety_redirect',
        signal: signal_type,
        preamble: EMPATHIC_PREAMBLE_DETRESSE,
        message: 'Votre situation nécessite une écoute immédiate. Voici des ressources disponibles :',
        resources: [
          { name: 'La Main Tendue', phone: '143', tel: 'tel:143', url: 'https://www.143.ch', note: '24h/24, anonyme, gratuit' },
          { name: 'Pro Mente Sana', phone: '0848 800 858', tel: 'tel:+41848800858', url: 'https://www.promentesana.ch', note: 'conseil en santé psychique' },
          { name: 'Urgences médicales', phone: '144', tel: 'tel:144', note: '24h/24' },
          { name: 'Pro Juventute (jeunes)', phone: '147', tel: 'tel:147', url: 'https://www.147.ch', note: 'si moins de 25 ans' }
        ],
        continue_anyway: CONTINUE_BUTTON,
        disclaimer: DISCLAIMER_HUMAN_FIRST,
        can_continue_later: true,
        priority: 'critical'
      };
    case SIGNAL_TYPES.VIOLENCE:
      return {
        type: 'safety_redirect',
        signal: signal_type,
        preamble: EMPATHIC_PREAMBLE_VIOLENCE,
        message: 'Votre sécurité passe avant tout. Si vous êtes en danger immédiat, appelez le 117.',
        resources: [
          { name: 'Police (urgence)', phone: '117', tel: 'tel:117', note: 'en cas de danger immédiat' },
          { name: 'VIVAVA (violence conjugale)', phone: '0800 800 300', tel: 'tel:+41800800300', url: 'https://www.aide-aux-victimes.ch', note: 'écoute 24h/24, confidentiel' },
          { name: 'SOS Femmes', phone: '0848 800 300', tel: 'tel:+41848800300', note: 'soutien aux femmes' },
          { name: 'LAVI (aide aux victimes)', phone: '0848 28 28 28', tel: 'tel:+41848282828', url: 'https://www.aide-aux-victimes.ch', note: 'soutien confidentiel, frais juridiques pris en charge' },
          { name: 'La Main Tendue', phone: '143', tel: 'tel:143', url: 'https://www.143.ch', note: 'écoute 24h/24' },
          { name: 'Urgences médicales', phone: '144', tel: 'tel:144', note: 'blessures' }
        ],
        continue_anyway: CONTINUE_BUTTON,
        disclaimer: DISCLAIMER_HUMAN_FIRST,
        discreet_mode: true,
        clear_history_available: true,
        priority: 'critical'
      };
    case SIGNAL_TYPES.MENACE:
      return {
        type: 'safety_refusal',
        signal: signal_type,
        message: 'Je ne peux pas vous accompagner dans cette démarche. Si une personne est en danger, appelez le 117.',
        resources: [
          { name: 'Police (urgence)', phone: '117', tel: 'tel:117', note: 'en cas de danger immédiat' },
          { name: 'La Main Tendue', phone: '143', tel: 'tel:143', url: 'https://www.143.ch', note: 'si vous voulez parler à quelqu\'un' }
        ],
        disclaimer: 'Nous ne pouvons pas vous aider à commettre un acte violent. Mais nous pouvons vous aider à trouver une voie légale. Décrivez votre situation sans menace.',
        priority: 'high'
      };
    case SIGNAL_TYPES.MINEUR:
      return {
        type: 'minor_redirect',
        signal: signal_type,
        preamble: EMPATHIC_PREAMBLE_MINEUR,
        message: 'Pour t\'accompagner au mieux, voici des ressources adaptées :',
        resources: [
          { name: 'Pro Juventute', phone: '147', tel: 'tel:147', url: 'https://www.147.ch', note: 'gratuit, confidentiel, 24h/24' },
          { name: 'La Main Tendue', phone: '143', tel: 'tel:143', url: 'https://www.143.ch', note: '24h/24, anonyme' },
          { name: 'TPAE (protection)', note: 'autorité de protection de l\'enfant et de l\'adulte' }
        ],
        continue_anyway: CONTINUE_BUTTON,
        disclaimer: 'Tu peux toujours appeler ces numéros, ils sont gratuits et confidentiels.',
        adapted_language: true,
        priority: 'high'
      };
    case SIGNAL_TYPES.ILLEGAL_INTENT:
      return {
        type: 'constructive_refusal',
        signal: signal_type,
        message: 'Je ne peux pas vous aider sur cette voie, mais voici les démarches légales qui peuvent atteindre un résultat similaire.',
        disclaimer: 'Reformulez votre situation sans mention d\'acte illégal et nous pourrons vous orienter vers les recours légaux disponibles.',
        priority: 'medium'
      };
    default:
      return null;
  }
}
