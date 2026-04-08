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

const SYSTEM_PROMPT = `Tu es le système de navigation de JusticePourtous, une plateforme de triage juridique suisse.

TON RÔLE : identifier la situation juridique de l'utilisateur et déterminer les questions à poser. Tu ne donnes JAMAIS de conseil juridique. Tu identifies, tu extrais, tu questionnes.

CATALOGUE DES FICHES DISPONIBLES (id [domaine] tags) :
${CATALOG_TEXT}

INSTRUCTIONS :
1. Identifie les 1-3 fiches les plus pertinentes parmi le catalogue ci-dessus
2. Extrais toute information déjà présente dans le texte (canton, durée, montant, actions déjà entreprises)
3. Identifie les informations MANQUANTES qui changeraient le diagnostic
4. Propose des questions avec choix cliquables pour obtenir ces infos

RÈGLES STRICTES :
- Retourne UNIQUEMENT des IDs de fiches qui existent dans le catalogue
- N'invente AUCUN conseil juridique
- Si tu ne trouves aucune fiche pertinente, dis-le honnêtement
- Les questions doivent avoir des choix concrets (pas de texte libre)
- Maximum 4 questions
- Extrais le canton si mentionné (codes CH : VD, GE, VS, NE, FR, BE, ZH, BS, etc.)

RÉPONDS UNIQUEMENT EN JSON VALIDE, sans markdown ni commentaires.`;

const RESPONSE_SCHEMA = `{
  "fiches_pertinentes": ["id1", "id2"],
  "confiance": "haute" | "moyenne" | "basse",
  "infos_extraites": {
    "canton": "XX" | null,
    "duree": "..." | null,
    "montant": "..." | null,
    "deja_fait": ["..."] | [],
    "adversaire": "..." | null
  },
  "questions_manquantes": [
    {
      "id": "q1",
      "question": "...",
      "choix": ["A", "B", "C"],
      "importance": "critique" | "utile"
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
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }]
  });

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API error ${resp.status}: ${err.slice(0, 200)}`);
  }

  const data = await resp.json();
  const text = data.content[0].text;

  // Parse JSON response
  let parsed;
  try {
    // Remove markdown code fences if present
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(clean);
  } catch (e) {
    throw new Error(`LLM returned invalid JSON: ${text.slice(0, 200)}`);
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
