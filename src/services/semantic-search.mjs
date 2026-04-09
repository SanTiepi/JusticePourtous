/**
 * Semantic Search — Recherche intelligente profane → juridique
 *
 * Un citoyen ne connaît pas les termes juridiques. Il dit :
 * - "mon patron me harcèle" → doit trouver mobbing, CO 328
 * - "je peux plus payer mon loyer" → doit trouver consignation, aide sociale, LP
 * - "on veut me virer de chez moi" → doit trouver résiliation, expulsion, prolongation
 *
 * Ce module fait la traduction profane → juridique sans LLM,
 * via un dictionnaire de synonymes pondérés + expansion de requête.
 */

// Dictionnaire profane → termes juridiques + tags
// Chaque entrée : terme profane → [{ terme juridique, poids, domaines }]
const SYNONYMES = {
  // --- BAIL ---
  'virer': [{ terme: 'résiliation', poids: 3 }, { terme: 'expulsion', poids: 2 }, { terme: 'congé', poids: 2 }],
  'viré': [{ terme: 'résiliation', poids: 3 }, { terme: 'expulsion', poids: 2 }],
  'dehors': [{ terme: 'expulsion', poids: 3 }, { terme: 'résiliation', poids: 2 }],
  'expulser': [{ terme: 'expulsion', poids: 3 }, { terme: 'résiliation', poids: 2 }],
  'foutre': [{ terme: 'résiliation', poids: 2 }, { terme: 'expulsion', poids: 2 }],
  'dégager': [{ terme: 'expulsion', poids: 3 }],
  'moisissure': [{ terme: 'défaut', poids: 3 }, { terme: 'moisissure', poids: 5 }, { terme: 'humidité', poids: 2 }],
  'moisi': [{ terme: 'moisissure', poids: 5 }, { terme: 'défaut', poids: 3 }],
  'humide': [{ terme: 'humidité', poids: 4 }, { terme: 'moisissure', poids: 2 }, { terme: 'défaut', poids: 2 }],
  'trop cher': [{ terme: 'loyer abusif', poids: 4 }, { terme: 'augmentation', poids: 2 }],
  'augmenté': [{ terme: 'augmentation', poids: 4 }, { terme: 'hausse', poids: 3 }, { terme: 'loyer abusif', poids: 3 }],
  'augmente': [{ terme: 'augmentation', poids: 5 }, { terme: 'loyer abusif', poids: 4 }, { terme: 'hausse', poids: 3 }],
  'augmentation': [{ terme: 'augmentation', poids: 5 }, { terme: 'loyer abusif', poids: 4 }, { terme: 'hausse', poids: 3 }],
  'justification': [{ terme: 'loyer abusif', poids: 3 }, { terme: 'augmentation', poids: 2 }],
  'bruit': [{ terme: 'nuisances', poids: 3 }, { terme: 'bruit', poids: 5 }, { terme: 'voisin', poids: 2 }],
  'voisin': [{ terme: 'nuisances', poids: 3 }, { terme: 'voisin', poids: 5 }],
  'proprio': [{ terme: 'bailleur', poids: 3 }, { terme: 'propriétaire', poids: 3 }],
  'propriétaire': [{ terme: 'bailleur', poids: 3 }, { terme: 'propriétaire', poids: 3 }],
  'régie': [{ terme: 'régie', poids: 5 }, { terme: 'bailleur', poids: 2 }],
  'caution': [{ terme: 'garantie', poids: 4 }, { terme: 'dépôt', poids: 3 }],
  'payer': [{ terme: 'paiement', poids: 2 }],  // "loyer" removed — caused cross-domain FPs (bail bleeding into dettes queries)
  'charges': [{ terme: 'charges', poids: 5 }, { terme: 'frais accessoires', poids: 3 }],
  'chauffage': [{ terme: 'chauffage', poids: 5 }, { terme: 'charges', poids: 2 }],
  'travaux': [{ terme: 'réparation', poids: 3 }, { terme: 'travaux', poids: 5 }, { terme: 'rénovation', poids: 2 }],
  'réparer': [{ terme: 'réparation', poids: 4 }, { terme: 'défaut', poids: 2 }],
  'animal': [{ terme: 'animaux', poids: 5 }],
  'chien': [{ terme: 'animaux', poids: 5 }],
  'chat': [{ terme: 'animaux', poids: 4 }],
  'sous-louer': [{ terme: 'sous-location', poids: 5 }],
  'coloc': [{ terme: 'colocation', poids: 5 }],

  // --- TRAVAIL ---
  'licencié': [{ terme: 'licenciement', poids: 5 }, { terme: 'résiliation', poids: 2 }],
  'licencier': [{ terme: 'licenciement', poids: 5 }],
  'viré du travail': [{ terme: 'licenciement', poids: 5 }, { terme: 'abusif', poids: 2 }],
  'harcèle': [{ terme: 'harcèlement', poids: 5 }, { terme: 'mobbing', poids: 5 }],
  'harcèlement': [{ terme: 'harcèlement', poids: 5 }, { terme: 'mobbing', poids: 5 }],
  'mobbing': [{ terme: 'mobbing', poids: 5 }, { terme: 'harcèlement', poids: 3 }],
  'patron': [{ terme: 'employeur', poids: 3 }],
  'boss': [{ terme: 'employeur', poids: 3 }],
  'salaire': [{ terme: 'salaire', poids: 5 }, { terme: 'rémunération', poids: 2 }],
  'payé': [{ terme: 'salaire', poids: 3 }, { terme: 'paiement', poids: 2 }],
  'pas payé': [{ terme: 'salaire impayé', poids: 5 }, { terme: 'impayé', poids: 4 }, { terme: 'retard', poids: 2 }],
  'impayé': [{ terme: 'salaire impayé', poids: 5 }, { terme: 'impayé', poids: 4 }],
  'impayés': [{ terme: 'salaire impayé', poids: 5 }, { terme: 'impayé', poids: 4 }],
  'plus payé': [{ terme: 'salaire impayé', poids: 5 }, { terme: 'impayé', poids: 4 }],
  'paie plus': [{ terme: 'salaire impayé', poids: 5 }, { terme: 'impayé', poids: 4 }],
  'heures sup': [{ terme: 'heures supplémentaires', poids: 5 }],
  'burn-out': [{ terme: 'burn-out', poids: 5 }, { terme: 'maladie professionnelle', poids: 3 }],
  'burnout': [{ terme: 'burn-out', poids: 5 }, { terme: 'maladie professionnelle', poids: 3 }],
  'malade': [{ terme: 'maladie', poids: 4 }, { terme: 'incapacité', poids: 2 }],
  'enceinte': [{ terme: 'grossesse', poids: 5 }, { terme: 'maternité', poids: 3 }],
  'certificat': [{ terme: 'certificat de travail', poids: 4 }],
  'chômage': [{ terme: 'chômage', poids: 5 }, { terme: 'ORP', poids: 3 }],
  'ORP': [{ terme: 'ORP', poids: 5 }, { terme: 'chômage', poids: 3 }],
  'stage': [{ terme: 'stagiaire', poids: 5 }, { terme: 'apprenti', poids: 2 }],
  'apprenti': [{ terme: 'apprenti', poids: 5 }, { terme: 'formation', poids: 2 }],

  // --- FAMILLE ---
  'divorce': [{ terme: 'divorce', poids: 5 }, { terme: 'séparation', poids: 3 }],
  'séparation': [{ terme: 'séparation', poids: 5 }, { terme: 'divorce', poids: 3 }],
  'séparé': [{ terme: 'séparation', poids: 5 }, { terme: 'divorce', poids: 2 }],
  'pension': [{ terme: 'pension alimentaire', poids: 5 }, { terme: 'pension', poids: 4 }, { terme: 'entretien', poids: 3 }],
  'alimentaire': [{ terme: 'pension alimentaire', poids: 5 }, { terme: 'pension', poids: 3 }],
  'garde': [{ terme: 'garde', poids: 5 }, { terme: 'autorité parentale', poids: 3 }],
  'enfant': [{ terme: 'enfant', poids: 3 }, { terme: 'mineur', poids: 2 }],
  'enfants': [{ terme: 'enfant', poids: 3 }, { terme: 'garde', poids: 2 }],
  'héritage': [{ terme: 'succession', poids: 5 }, { terme: 'héritage', poids: 5 }],
  'testament': [{ terme: 'testament', poids: 5 }, { terme: 'succession', poids: 3 }],
  'déshérité': [{ terme: 'exhérédation', poids: 5 }, { terme: 'réserve', poids: 3 }],
  'adoption': [{ terme: 'adoption', poids: 5 }],
  // Domestic violence — explicit famille signals to prevent cross-domain collision with etrangers
  'conjoint': [{ terme: 'violence conjugale', poids: 5 }, { terme: 'séparation', poids: 4 }, { terme: 'divorce', poids: 2 }],
  'violent': [{ terme: 'violence domestique', poids: 5 }, { terme: 'violence conjugale', poids: 4 }],
  'violente': [{ terme: 'violence domestique', poids: 5 }, { terme: 'violence conjugale', poids: 4 }],
  'violences': [{ terme: 'violence domestique', poids: 5 }, { terme: 'LAVI', poids: 3 }],
  'frappe': [{ terme: 'violence', poids: 5 }, { terme: 'agression', poids: 3 }],
  'frappé': [{ terme: 'violence', poids: 5 }],
  'battu': [{ terme: 'violence domestique', poids: 5 }],
  'menace': [{ terme: 'menace', poids: 5 }, { terme: 'violence', poids: 2 }],
  // Ex-partner — signals famille via séparation/divorce (not garde, to avoid colliding with pension queries)
  'ex': [{ terme: 'séparation', poids: 4 }, { terme: 'divorce', poids: 3 }],

  // --- DETTES ---
  'dette': [{ terme: 'dette', poids: 5 }, { terme: 'poursuite', poids: 3 }],
  'dettes': [{ terme: 'dette', poids: 5 }, { terme: 'poursuite', poids: 3 }, { terme: 'surendettement', poids: 2 }],
  'poursuite': [{ terme: 'poursuite', poids: 5 }, { terme: 'commandement', poids: 3 }],
  // Include raw "commandement" term so it matches the tag directly on dettes fiches
  'commandement': [{ terme: 'commandement de payer', poids: 5 }, { terme: 'commandement', poids: 4 }, { terme: 'poursuite', poids: 2 }],
  'saisie': [{ terme: 'saisie', poids: 5 }, { terme: 'minimum vital', poids: 2 }],
  'faillite': [{ terme: 'faillite', poids: 5 }],
  'huissier': [{ terme: 'office des poursuites', poids: 4 }, { terme: 'poursuite', poids: 3 }],
  'surendetté': [{ terme: 'surendettement', poids: 5 }, { terme: 'dette', poids: 3 }],

  // --- ÉTRANGERS ---
  // "permis" + "séjour" expanded together so etrangers fiches win on permis-de-séjour queries
  'permis': [{ terme: 'permis de séjour', poids: 4 }, { terme: 'permis', poids: 4 }, { terme: 'séjour', poids: 2 }],
  'sejour': [{ terme: 'permis de séjour', poids: 5 }, { terme: 'séjour', poids: 4 }],
  'séjour': [{ terme: 'permis de séjour', poids: 5 }, { terme: 'séjour', poids: 4 }],
  'papiers': [{ terme: 'permis de séjour', poids: 3 }, { terme: 'sans-papiers', poids: 3 }],
  'sans-papiers': [{ terme: 'sans-papiers', poids: 5 }, { terme: 'clandestin', poids: 3 }],
  'expulsion pays': [{ terme: 'renvoi', poids: 5 }, { terme: 'expulsion', poids: 3 }],
  'renvoyé': [{ terme: 'renvoi', poids: 5 }],
  'asile': [{ terme: 'asile', poids: 5 }, { terme: 'réfugié', poids: 3 }],
  'réfugié': [{ terme: 'asile', poids: 5 }, { terme: 'réfugié', poids: 5 }],
  'naturalisation': [{ terme: 'naturalisation', poids: 5 }, { terme: 'nationalité', poids: 3 }],
  'passeport': [{ terme: 'nationalité', poids: 3 }, { terme: 'naturalisation', poids: 2 }],
  'regroupement': [{ terme: 'regroupement familial', poids: 5 }],
  'famille venir': [{ terme: 'regroupement familial', poids: 5 }],

  // --- GÉNÉRAL ---
  'avocat': [{ terme: 'aide juridique', poids: 3 }, { terme: 'assistance judiciaire', poids: 3 }],
  'gratuit': [{ terme: 'aide juridique', poids: 3 }, { terme: 'gratuit', poids: 3 }],
  'aide': [{ terme: 'aide sociale', poids: 2 }, { terme: 'aide juridique', poids: 2 }],
  'tribunal': [{ terme: 'procédure', poids: 3 }, { terme: 'tribunal', poids: 3 }],
  'recours': [{ terme: 'recours', poids: 5 }, { terme: 'appel', poids: 3 }],
  'délai': [{ terme: 'délai', poids: 5 }, { terme: 'prescription', poids: 2 }],
  'prescription': [{ terme: 'prescription', poids: 5 }, { terme: 'prescrit', poids: 5 }, { terme: 'délai', poids: 2 }],
  'prescrit': [{ terme: 'prescription', poids: 5 }, { terme: 'prescrit', poids: 5 }],
  'prescrite': [{ terme: 'prescription', poids: 5 }, { terme: 'prescrit', poids: 5 }],
  'réclame': [{ terme: 'poursuite', poids: 2 }, { terme: 'dette', poids: 3 }],
  'vieille dette': [{ terme: 'prescription', poids: 5 }, { terme: 'dette', poids: 3 }],
  'urgent': [{ terme: 'mesures provisionnelles', poids: 3 }, { terme: 'urgence', poids: 3 }],
  'arnaque': [{ terme: 'escroquerie', poids: 4 }, { terme: 'fraude', poids: 3 }],
  'arnaqué': [{ terme: 'escroquerie', poids: 5 }, { terme: 'fraude', poids: 3 }],
  'discriminé': [{ terme: 'discrimination', poids: 5 }],
  'discrimination': [{ terme: 'discrimination', poids: 5 }, { terme: 'égalité', poids: 3 }],
};

// Stems: common French word endings to strip for matching
function stem(word) {
  return word
    .replace(/ée?s?$/i, 'é')
    .replace(/ées$/i, 'é')
    .replace(/tion$/i, 'tion')
    .replace(/ment$/i, '')
    .replace(/eur$/i, '')
    .replace(/euse$/i, '')
    .replace(/ique$/i, '')
    .toLowerCase();
}

/**
 * Expand a profane query into weighted juridical terms
 * @param {string} text - User's plain language query
 * @returns {{ terms: Map<string, number>, originalWords: string[] }}
 */
export function expandQuery(text) {
  const words = text.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^\wàâäéèêëïîôùûüçœæ\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  const terms = new Map();
  const matched = new Set();

  // Check multi-word phrases first (e.g., "pas payé", "heures sup")
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (SYNONYMES[bigram]) {
      for (const { terme, poids } of SYNONYMES[bigram]) {
        terms.set(terme, (terms.get(terme) || 0) + poids);
      }
      matched.add(i);
      matched.add(i + 1);
    }
  }

  // Then single words
  for (let i = 0; i < words.length; i++) {
    if (matched.has(i)) continue;
    const word = words[i];

    // Direct match
    if (SYNONYMES[word]) {
      for (const { terme, poids } of SYNONYMES[word]) {
        terms.set(terme, (terms.get(terme) || 0) + poids);
      }
      continue;
    }

    // Stemmed match
    const stemmed = stem(word);
    for (const [key, expansions] of Object.entries(SYNONYMES)) {
      if (stem(key) === stemmed) {
        for (const { terme, poids } of expansions) {
          terms.set(terme, (terms.get(terme) || 0) + poids * 0.7); // slightly lower weight for stem match
        }
        break;
      }
    }

    // Pass through as-is (the original word is still useful)
    terms.set(word, (terms.get(word) || 0) + 1);
  }

  return { terms, originalWords: words };
}

/**
 * Score a fiche against expanded query terms
 * @param {object} fiche
 * @param {Map<string, number>} terms - weighted terms from expandQuery
 * @returns {number} relevance score
 */
export function scoreFiche(fiche, terms) {
  let score = 0;
  const searchable = [
    fiche.id,
    fiche.domaine,
    fiche.sousDomaine || '',
    ...(fiche.tags || []),
    fiche.reponse?.explication || ''
  ].join(' ').toLowerCase();

  for (const [term, weight] of terms) {
    const t = term.toLowerCase();

    // Exact tag match = highest value
    if (fiche.tags?.some(tag => tag.toLowerCase() === t)) {
      score += weight * 5;
      continue;
    }

    // Tag contains term
    if (fiche.tags?.some(tag => tag.toLowerCase().includes(t))) {
      score += weight * 3;
      continue;
    }

    // ID contains term
    if (fiche.id.toLowerCase().includes(t.replace(/\s+/g, '_'))) {
      score += weight * 4;
      continue;
    }

    // In explanation text
    if (searchable.includes(t)) {
      score += weight * 1;
    }
  }

  return score;
}

// Raw query words that strongly signal a specific legal domain.
// Used for tie-breaking when synonym scores are ambiguous across domains.
const DOMAIN_AFFINITY_WORDS = {
  travail: new Set(['employeur', 'patron', 'boss', 'salaire', 'travail', 'licencie', 'licencier', 'mobbing', 'harcelement', 'harcel', 'chomage', 'enceinte', 'stage', 'apprenti', 'burn-out', 'burnout', 'heures', 'certificat', 'conge', 'arret', 'maladie', 'conges', 'licenciement', 'convention']),
  famille: new Set(['conjoint', 'ex', 'epoux', 'epouse', 'mari', 'femme', 'divorce', 'separation', 'separe', 'garde', 'pension', 'enfant', 'enfants', 'adoption', 'violent', 'violente', 'violence', 'violences', 'menace', 'heritage', 'succession', 'testament', 'parentale', 'enlevement']),
  dettes: new Set(['dette', 'dettes', 'commandement', 'huissier', 'saisie', 'faillite', 'poursuite', 'surendette', 'surendettement', 'impaye', 'poursuites', 'mainlevee', 'concordat', 'sequestre']),
  bail: new Set(['loyer', 'proprietaire', 'proprio', 'regie', 'locataire', 'bail', 'appartement', 'appart', 'logement', 'bailleur', 'moisissure', 'charges', 'resiliation', 'coloc', 'voisin', 'locaux']),
  etrangers: new Set(['permis', 'sejour', 'asile', 'naturalisation', 'refugie', 'sans-papiers', 'renvoye', 'renvoi', 'visa', 'nationalite', 'papiers', 'immigration', 'frontalier', 'expulsion'])
};

function detectDomainBoost(originalWords) {
  const scores = { travail: 0, famille: 0, dettes: 0, bail: 0, etrangers: 0 };
  for (const word of originalWords) {
    for (const [domain, wordSet] of Object.entries(DOMAIN_AFFINITY_WORDS)) {
      if (wordSet.has(word)) scores[domain]++;
    }
  }
  const entries = Object.entries(scores);
  const max = Math.max(...entries.map(([, v]) => v));
  if (max < 1) return null;
  const topDomains = entries.filter(([, v]) => v === max);
  return topDomains.length === 1 ? topDomains[0][0] : null;
}

/**
 * Smart search: profane text → ranked fiches
 */
export function semanticSearch(text, fiches, limit = 5) {
  const { terms, originalWords } = expandQuery(text);
  const boostedDomain = detectDomainBoost(originalWords);

  const scored = fiches.map(fiche => {
    let score = scoreFiche(fiche, terms);
    if (boostedDomain && fiche.domaine === boostedDomain) score *= 1.5;
    return { fiche, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, limit);
}

export { SYNONYMES };
