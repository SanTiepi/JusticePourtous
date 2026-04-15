/**
 * LLM Navigator — Le cerveau de navigation de JusticePourtous
 *
 * Le LLM ne RÉDIGE RIEN. Il :
 * 1. Identifie quelles fiches correspondent au problème
 * 2. Extrait les infos déjà présentes dans le texte (canton, durée, etc.)
 * 3. Détermine quelles questions poser pour affiner
 *
 * Le contenu juridique vient TOUJOURS de nos fiches vérifiées.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fichesDir = join(__dirname, '..', 'data', 'fiches');

// Build compact catalog at startup (~4K tokens)
const ficheCatalog = [];
const ficheQuestions = new Map();

for (const f of readdirSync(fichesDir).filter(f => f.endsWith('.json'))) {
  const fiches = JSON.parse(readFileSync(join(fichesDir, f), 'utf-8'));
  for (const fiche of fiches) {
    ficheCatalog.push(`${fiche.id} [${fiche.domaine}] ${(fiche.tags || []).join(',')}`);
    if (fiche.questions?.length) {
      ficheQuestions.set(fiche.id, fiche.questions);
    }
  }
}

const CATALOG_TEXT = ficheCatalog.join('\n');

// ─── Structured knowledge for augmented LLM ────────────────────

const AUGMENTED_KNOWLEDGE = `
RÈGLES DÉTERMINISTES (le code calcule, pas toi) :
BAIL:
- Caution max = 3 mois loyer net (CO 257e). Commercial = pas de limite.
- Contestation congé = 30 jours dès réception (CO 273). Formule officielle obligatoire (CO 266l).
- Contestation augmentation = 30 jours (CO 270b). Taux hypo référence OFL = 1.25% (2026).
- Réduction défaut: léger 5-15%, moyen 15-30%, grave 30-100% (CO 259d). Sauf faute locataire.
- Restitution caution = 1 an après fin bail (CO 257e al. 3).
TRAVAIL:
- Délai congé: essai 7j, <1an 1 mois, 2-9ans 2 mois, 10+ans 3 mois (CO 335c).
- Protection maladie: <1an 30j, 1-5ans 90j, 6+ans 180j (CO 336c). Licenciement pendant = NUL. Pas pendant essai.
- Salaire impayé: mise en demeure écrite → délai 7-14j → résiliation immédiate possible (CO 337).
DETTES:
- Opposition commandement = 10 JOURS, gratuit, sans motivation (LP 74).
- Minimum vital insaisissable: base 1200 CHF/mois (GE: 1350), +400/enfant (LP 93).
- Prescription: générale 10 ans, loyer/salaire/pension 5 ans, acte défaut biens 20 ans (CO 127-128).

FAITS CRITIQUES À EXTRAIRE (changent le résultat juridique) :
- Canton (autorité compétente, contacts, barèmes cantonaux)
- Durée de la situation (prescription, ancienneté, protection)
- Montant en jeu (procédure simplifiée vs ordinaire, coûts)
- Actions déjà entreprises (mise en demeure, opposition, plainte)
- Type de contrat (écrit/oral, durée déterminée/indéterminée)
- Ancienneté dans la relation (bail: durée, travail: années de service)
- Urgence (délai qui court, expulsion prévue, fin de délai)

QUESTIONS À PLUS HAUTE VALEUR (pose en priorité celles qui changent le plus le résultat) :
- Si bail: canton? durée du problème? mise en demeure envoyée? montant du loyer?
- Si travail: ancienneté? en arrêt maladie? période d'essai? mise en demeure?
- Si dettes: montant? opposition faite? délai depuis commandement? type de dette?
`;

const SYSTEM_PROMPT = `Tu es le système de navigation de JusticePourtous, une plateforme de triage juridique suisse.

TON RÔLE : identifier la situation juridique de l'utilisateur, extraire les faits, et poser les 2-5 questions à plus haute valeur décisionnelle. Chaque question DOIT changer le résultat juridique. Tu ne donnes JAMAIS de conseil juridique. Tu identifies, tu extrais, tu questionnes.

CATALOGUE DES FICHES DISPONIBLES (id [domaine] tags) :
${CATALOG_TEXT}

CONNAISSANCES STRUCTURÉES (règles, délais, seuils) :
${AUGMENTED_KNOWLEDGE}

INSTRUCTIONS :
1. Identifie les 1-3 fiches les plus pertinentes parmi le catalogue ci-dessus
2. Extrais TOUS les faits déjà présents dans le texte (canton, durée, montant, actions, adversaire, contrat, urgence)
3. Identifie les faits MANQUANTS qui changeraient le résultat (utilise les règles déterministes ci-dessus)
4. Pose les 2-5 questions à plus haute valeur décisionnelle — celles dont la réponse change un délai, un montant, une procédure, ou une autorité compétente. Chaque question DOIT changer le résultat juridique.

RÈGLES STRICTES :
- Retourne UNIQUEMENT des IDs de fiches qui existent dans le catalogue
- N'invente AUCUN conseil juridique — le contenu vient de nos données vérifiées
- Si tu ne trouves aucune fiche pertinente, dis-le honnêtement
- Les questions doivent avoir des choix concrets (pas de texte libre)
- Pose 2-5 questions à plus haute valeur décisionnelle
- Chaque question DOIT changer quelque chose dans le résultat juridique
- Le temps n'est pas un souci — la PRÉCISION prime sur la rapidité
- Extrais le canton si mentionné (codes CH : VD, GE, VS, NE, FR, BE, ZH, BS, LU, SG, AG, TI, SO, etc.)
- Indique pour chaque question POURQUOI elle est importante ("change le délai", "change l'autorité", etc.)

RÉPONDS UNIQUEMENT EN JSON VALIDE, sans markdown ni commentaires.`;

const RESPONSE_SCHEMA = `{
  "fiches_pertinentes": ["id1", "id2"],
  "confiance": "haute" | "moyenne" | "basse",
  "infos_extraites": {
    "canton": "XX" | null,
    "duree": "..." | null,
    "montant": "..." | null,
    "anciennete": "..." | null,
    "deja_fait": ["..."] | [],
    "adversaire": "..." | null,
    "urgence": true | false,
    "contrat_ecrit": true | false | null
  },
  "questions_manquantes": [
    {
      "id": "q1",
      "question": "...",
      "choix": ["A", "B", "C"],
      "importance": "critique" | "utile",
      "pourquoi": "Change le délai de X à Y" | "Détermine l'autorité compétente" | ...
    }
  ],
  "multi_fiches": false,
  "resume_situation": "Une phrase résumant la compréhension"
}`;

/**
 * Call Claude API to navigate the user's problem
 */
async function callNavigator(userText, previousAnswers) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null; // Fallback to semantic search

  let userPrompt = `SITUATION DE L'UTILISATEUR :\n${userText}`;

  if (previousAnswers && Object.keys(previousAnswers).length > 0) {
    userPrompt += '\n\nRÉPONSES AUX QUESTIONS PRÉCÉDENTES :\n';
    for (const [qId, answer] of Object.entries(previousAnswers)) {
      userPrompt += `- ${qId}: ${answer}\n`;
    }
    userPrompt += '\nAffine ton analyse avec ces nouvelles informations. Pose de nouvelles questions UNIQUEMENT si nécessaire.';
  }

  userPrompt += `\n\nRéponds en JSON selon ce schéma :\n${RESPONSE_SCHEMA}`;

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3500,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body,
    signal: controller.signal
  });
  clearTimeout(timeout);

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API error ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = data.content[0].text;

  // Parse JSON response (tolerant to truncation)
  let parsed;
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    // Truncation recovery: try to extract at least fiches_pertinentes so
    // we don't lose the whole navigation over a missing closing brace.
    const recovered = recoverPartialNavigation(clean);
    if (recovered) {
      parsed = recovered;
    } else {
      throw new Error(`LLM returned invalid JSON: ${text.slice(0, 200)}`);
    }
  }

  // Validate: all fiche IDs must exist in our catalog
  const validIds = new Set(ficheCatalog.map(line => line.split(' ')[0]));
  parsed.fiches_pertinentes = (parsed.fiches_pertinentes || []).filter(id => validIds.has(id));

  // Usage info for cost tracking
  const usage = {
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
    costCentimes: Math.ceil(
      ((data.usage?.input_tokens || 0) / 1000 * 0.3) +
      ((data.usage?.output_tokens || 0) / 1000 * 1.5)
    )
  };

  return { navigation: parsed, usage };
}

/**
 * Attempt to recover a partial navigation object from a truncated JSON string.
 * Returns null if nothing usable can be extracted.
 *
 * Strategy: extract the fiches_pertinentes array (the most critical field)
 * and the resume_situation via surgical regex. If we can rescue fiches_pertinentes,
 * downstream code can still enrich + answer. Better than a hard crash.
 */
function recoverPartialNavigation(text) {
  // Find "fiches_pertinentes": [ ... ]
  const fichesMatch = text.match(/"fiches_pertinentes"\s*:\s*\[([^\]]*)\]/);
  if (!fichesMatch) return null;

  const fichesRaw = fichesMatch[1];
  const ids = [...fichesRaw.matchAll(/"([^"]+)"/g)].map(m => m[1]);
  if (ids.length === 0) return null;

  // Optional fields — extract if present, defaults otherwise
  const confianceMatch = text.match(/"confiance"\s*:\s*"([^"]+)"/);
  const resumeMatch = text.match(/"resume_situation"\s*:\s*"([^"]+)"/);
  const cantonMatch = text.match(/"canton"\s*:\s*"([A-Z]{2,3})"/);

  return {
    fiches_pertinentes: ids,
    confiance: confianceMatch ? confianceMatch[1] : 'basse',
    infos_extraites: {
      canton: cantonMatch ? cantonMatch[1] : null,
      duree: null, montant: null, anciennete: null,
      deja_fait: [], adversaire: null, urgence: false, contrat_ecrit: null,
    },
    questions_manquantes: [],
    multi_fiches: ids.length > 1,
    resume_situation: resumeMatch ? resumeMatch[1] : null,
    _recovered_from_partial: true,
  };
}

/**
 * Get questions for a specific fiche (for follow-up)
 */
function getQuestionsForFiche(ficheId) {
  return ficheQuestions.get(ficheId) || [];
}

/**
 * Check if API key is available
 */
function isAvailable() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export { callNavigator, getQuestionsForFiche, isAvailable, CATALOG_TEXT };
