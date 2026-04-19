/**
 * Language Router — Phase Cortex 4
 *
 * Détection de langue heuristique (no LLM, no deps) pour routing honnête.
 *
 * La Suisse a 4 langues nationales : FR, DE, IT, RM.
 * JusticePourtous supporte désormais les locales offertes côté produit.
 * Le routeur sert surtout à :
 *   - détecter la langue source pour enrichissement / analytics
 *   - isoler RM (romanche), qui reste hors couverture honnête
 *
 * Détection : dictionnaire de mots-fonctionnels les plus discriminants par langue.
 * Score = ratio de mots du texte présents dans le dictionnaire de chaque langue.
 * Confidence = proportionnelle à la longueur du texte et à la marge entre les
 * deux meilleures langues.
 *
 * Bornes :
 *  - Texte < 8 mots → confidence ≤ 0.5
 *  - Margin (top - second) < 0.05 → 'unknown'
 *  - Aucune correspondance → 'unknown'
 *
 * Important :
 *  - Aucun appel LLM ici. C'est un classifieur déterministe.
 *  - Le RM est volontairement traité à part : pas de couverture satisfaisante
 *    tant qu'on n'a pas de fiches RM.
 */

// ---------------------------------------------------------------------------
// Dictionnaires de mots fonctionnels
// ---------------------------------------------------------------------------

const FR_WORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'avec', 'sans', 'pour',
  'dans', 'sur', 'sous', 'entre', 'mon', 'ma', 'mes', 'ton', 'ta', 'ses',
  'son', 'notre', 'votre', 'leur', 'leurs', 'je', 'tu', 'il', 'elle', 'nous',
  'vous', 'ils', 'elles', 'mais', 'aussi', 'plus', 'moins', 'très', 'tres',
  'pas', 'ne', 'que', 'qui', 'quoi', 'dont', 'où', 'ou', 'est', 'sont',
  'était', 'etait', 'a', 'ai', 'avons', 'avez', 'ont', 'fait', 'faire',
  'cette', 'ces', 'celui', 'celle', 'depuis', 'parce', 'car', 'donc',
  'alors', 'quand', 'comment', 'pourquoi', 'voici', 'voilà', 'voila',
  'propriétaire', 'proprietaire', 'locataire', 'loyer', 'travail', 'salaire',
  'congé', 'conge', 'licenciement', 'patron', 'bail', 'appartement', 'logement'
]);

const DE_WORDS = new Set([
  'der', 'die', 'das', 'den', 'dem', 'des', 'und', 'oder', 'aber', 'ist',
  'sind', 'war', 'waren', 'mit', 'auf', 'in', 'an', 'bei', 'von', 'vom',
  'zu', 'zum', 'zur', 'für', 'fuer', 'gegen', 'ohne', 'um', 'nach', 'aus',
  'hat', 'habe', 'hast', 'haben', 'hatte', 'ich', 'du', 'er', 'sie', 'es',
  'wir', 'ihr', 'mich', 'mir', 'dich', 'dir', 'uns', 'euch', 'ihm', 'ihn',
  'mein', 'meine', 'meinen', 'meiner', 'dein', 'deine', 'sein', 'seine',
  'unser', 'euer', 'nicht', 'kein', 'keine', 'wird', 'werden', 'wurde',
  'kann', 'könnte', 'koennte', 'muss', 'müssen', 'muessen', 'soll', 'sollte',
  'will', 'wollen', 'darf', 'dürfen', 'duerfen', 'ein', 'eine', 'einen',
  'einer', 'auch', 'noch', 'schon', 'sehr', 'viel', 'mehr', 'weniger',
  'wenn', 'dass', 'weil', 'als', 'ob', 'damit', 'sodass', 'jedoch',
  'vermieter', 'mieter', 'miete', 'wohnung', 'arbeit', 'lohn', 'kündigung',
  'kuendigung', 'kuendigen', 'kündigen', 'arbeitgeber', 'arbeitnehmer',
  'vertrag', 'gericht', 'recht', 'klage', 'einsprache', 'frist', 'monat'
]);

const IT_WORDS = new Set([
  'il', 'lo', 'la', 'i', 'gli', 'le', 'di', 'del', 'della', 'dello', 'dei',
  'degli', 'delle', 'da', 'dal', 'dalla', 'dallo', 'in', 'nel', 'nella',
  'nello', 'su', 'sul', 'sulla', 'con', 'per', 'tra', 'fra', 'a', 'al',
  'alla', 'allo', 'ai', 'agli', 'alle', 'e', 'ed', 'o', 'che', 'chi', 'cui',
  'non', 'più', 'piu', 'meno', 'molto', 'poco', 'mi', 'ti', 'si', 'ci', 'vi',
  'mio', 'mia', 'tuo', 'tua', 'suo', 'sua', 'nostro', 'vostro', 'loro',
  'sono', 'sei', 'è', 'siamo', 'siete', 'era', 'erano', 'ho', 'hai', 'ha',
  'abbiamo', 'avete', 'hanno', 'aveva', 'questo', 'questa', 'quello',
  'quella', 'questi', 'queste', 'quelli', 'quelle', 'come', 'quando',
  'perché', 'perche', 'allora', 'anche', 'ancora', 'già', 'gia', 'sempre',
  'mai', 'ogni', 'tutto', 'tutti', 'niente', 'qualcosa', 'fa', 'fare',
  'padrone', 'inquilino', 'affitto', 'casa', 'lavoro', 'stipendio',
  'licenziamento', 'datore', 'contratto', 'tribunale', 'diritto', 'mese'
]);

// Romanche — vallader/sursilvan/rumantsch grischun mots fréquents.
// Volontairement plus court : on cherche des marqueurs forts.
const RM_WORDS = new Set([
  'cha', 'che', 'cun', 'sin', 'sper', 'tras', 'mo', 'vus', 'ins', 'ils',
  'nus', 'ti', 'jeu', 'jau', 'el', 'ella', 'els', 'ellas', 'ün', 'ina',
  'üna', 'in', 'ina', 'ils', 'las', 'da', 'dal', 'dals', 'dalla',
  'pertge', 'perquai', 'cura', 'co', 'tge', 'savair', 'esser',
  'ais', 'sun', 'è', 'avair', 'fa', 'far', 'avair', 'pussaivel',
  'arrenda', 'paclà', 'lavur', 'glieud', 'tudestg', 'rumantsch',
  // marqueurs fortement RM (combinaisons rares en FR/DE/IT)
  'eir', 'gnir', 'vegnir', 'tuts', 'auters', 'puspè', 'puspe', 'damaun',
  'fatschenta', 'patrun', 'inquilin', 'paruler', 'nuot', 'avunda'
]);

// Mots qui apparaissent à la fois dans plusieurs langues — exclus du score
// ou pondérés selon le contexte. On garde la liste minimale pour rester
// déterministe et lisible.
const AMBIGUOUS = new Set([
  // 'a' existe en FR (a/à) et IT
  // 'in' existe en DE et IT
  // 'la' existe en FR/IT/RM
  // → on les laisse dans tous les sets, le score reste comparable
]);

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  // Garde les lettres accentuées Unicode + apostrophe interne basique
  // \p{L} = toute lettre Unicode (avec flag u)
  const cleaned = text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\s'’-]/gu, ' ')
    .replace(/['’]/g, ' '); // sépare l'apostrophe (l'eau → l, eau)
  return cleaned
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 1);
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreLanguage(tokens, dictionary) {
  if (!tokens.length) return 0;
  let hits = 0;
  for (const tok of tokens) {
    if (dictionary.has(tok)) hits++;
  }
  return hits / tokens.length;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Détecte la langue d'un texte donné.
 *
 * @param {string} text
 * @returns {{lang: 'fr'|'de'|'it'|'rm'|'unknown', confidence: number, reasoning: string, scores?: object}}
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      lang: 'unknown',
      confidence: 0,
      reasoning: 'Texte vide ou invalide.'
    };
  }

  const tokens = tokenize(text);
  if (tokens.length === 0) {
    return {
      lang: 'unknown',
      confidence: 0,
      reasoning: 'Aucun token après nettoyage.'
    };
  }

  const scores = {
    fr: scoreLanguage(tokens, FR_WORDS),
    de: scoreLanguage(tokens, DE_WORDS),
    it: scoreLanguage(tokens, IT_WORDS),
    rm: scoreLanguage(tokens, RM_WORDS)
  };

  // Trouve la langue dominante
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topLang, topScore] = ranked[0];
  const [secondLang, secondScore] = ranked[1];
  const margin = topScore - secondScore;

  // Aucune correspondance crédible
  if (topScore === 0) {
    return {
      lang: 'unknown',
      confidence: 0,
      reasoning: 'Aucun mot fonctionnel reconnu dans aucune des 4 langues nationales.',
      scores
    };
  }

  // Margin trop faible → ambiguïté entre 2 langues
  if (margin < 0.05 && topScore < 0.25) {
    return {
      lang: 'unknown',
      confidence: 0.2,
      reasoning: `Texte mixte ou trop court : top=${topLang}(${topScore.toFixed(2)}) vs ${secondLang}(${secondScore.toFixed(2)}), marge insuffisante.`,
      scores
    };
  }

  // Confidence : combinaison du score absolu, de la marge et de la longueur
  // - score absolu : 0..1, on le ramène à 0..1 via min
  // - marge : 0..1 (différence entre top et 2e)
  // - longueur : sature à 30 tokens
  const lengthFactor = Math.min(tokens.length / 30, 1);
  const baseConfidence = Math.min(topScore * 2.5, 1); // un score de 0.4 → 1.0
  const marginBonus = Math.min(margin * 2, 0.3);
  const rawConfidence = baseConfidence * 0.5 + marginBonus + lengthFactor * 0.3;
  let confidence = Math.max(0, Math.min(1, rawConfidence));

  // Plafond pour textes très courts
  if (tokens.length < 4) confidence = Math.min(confidence, 0.45);
  else if (tokens.length < 8) confidence = Math.min(confidence, 0.65);

  return {
    lang: topLang,
    confidence: Number(confidence.toFixed(3)),
    reasoning: `Top=${topLang}(${topScore.toFixed(2)}), 2e=${secondLang}(${secondScore.toFixed(2)}), tokens=${tokens.length}.`,
    scores
  };
}

/**
 * Construit un disclaimer de mode dégradé pour DE/IT.
 *
 * @param {'de'|'it'} sourceLang
 * @returns {{short: string, long: string, action_suggested: string, source_lang: string}}
 */
export function translationDisclaimer(sourceLang) {
  const lang = (sourceLang || '').toLowerCase();

  if (lang === 'de') {
    return {
      source_lang: 'de',
      short: 'Ihre Anfrage ist auf Deutsch — unsere Analyse erfolgt auf Französisch (degradierter Modus).',
      long: 'Ihre Frage wurde auf Deutsch gestellt. JusticePourtous deckt den deutschsprachigen Raum derzeit nicht vollständig ab : die juristischen Erläuterungen werden auf Französisch angezeigt. Die Schweizer Rechtsterminologie ist mehrsprachig, doch die ausführlichen Karteikarten sind aktuell nur auf Französisch verfügbar.',
      action_suggested: 'Für eine Beratung auf Deutsch empfehlen wir den Mieterinnen- und Mieterverband (MV) oder unia.ch je nach Rechtsbereich. Eine vollständige deutschsprachige Version ist in Vorbereitung.'
    };
  }

  if (lang === 'it') {
    return {
      source_lang: 'it',
      short: 'La sua richiesta è in italiano — la nostra analisi è in francese (modalità degradata).',
      long: 'La sua domanda è stata posta in italiano. JusticePourtous non copre ancora completamente la Svizzera italiana : la spiegazione giuridica appare in francese. La terminologia giuridica svizzera è plurilingue, ma le schede dettagliate sono attualmente disponibili solo in francese.',
      action_suggested: 'Per una consulenza in italiano consigliamo l\'ASLOCA Ticino (locazione) o unia.ch (lavoro) secondo l\'ambito. Una versione completa in italiano è in preparazione.'
    };
  }

  return {
    source_lang: lang || 'unknown',
    short: 'Mode dégradé : analyse en français.',
    long: 'Le service est actuellement disponible uniquement en français.',
    action_suggested: 'Consultez l\'annuaire pour un service local.'
  };
}

/**
 * Vrai si la détection romanche est suffisamment forte pour court-circuiter
 * vers le tier humain (pas de mode dégradé acceptable pour RM).
 *
 * On reste prudent : exige un seuil minimum pour éviter les faux positifs
 * (le RM partage du vocabulaire avec FR/IT).
 *
 * @param {string} text
 * @returns {boolean}
 */
export function shouldRouteToRhetoroman(text) {
  const detection = detectLanguage(text);
  if (detection.lang !== 'rm') return false;
  // Un faux positif RM serait pire qu'un faux négatif (router à tort en humain)
  // → on exige une confiance ≥ 0.4
  return detection.confidence >= 0.4;
}

// ---------------------------------------------------------------------------
// Exports internes (tests)
// ---------------------------------------------------------------------------

export const _internal = {
  tokenize,
  scoreLanguage,
  FR_WORDS,
  DE_WORDS,
  IT_WORDS,
  RM_WORDS
};
