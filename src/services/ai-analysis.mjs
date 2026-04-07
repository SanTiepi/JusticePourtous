import { getFicheById } from './fiches.mjs';

const DISCLAIMER = "AVERTISSEMENT : Cette analyse est generee par intelligence artificielle a titre informatif uniquement. Elle ne constitue PAS un avis juridique. Consultez un avocat ou un service d'aide juridique pour toute decision importante. JusticePourtous decline toute responsabilite quant aux consequences de l'utilisation de cette analyse.";

const COST_PER_1K_INPUT = 0.3;  // cents CHF per 1K input tokens (claude-sonnet-4-20250514)
const COST_PER_1K_OUTPUT = 1.5; // cents CHF per 1K output tokens

function buildSystemPrompt(fiche) {
  let prompt = `Tu es un assistant juridique specialise en droit suisse. Tu analyses des situations juridiques concretes et fournis des recommandations structurees.

REGLES STRICTES :
- Base tes reponses UNIQUEMENT sur le droit suisse en vigueur
- Cite toujours les articles de loi pertinents
- Ne donne JAMAIS de certitude absolue — utilise des formulations prudentes
- Rappelle toujours qu'un avocat doit etre consulte pour un avis definitif
- Reponds en francais

FICHE JURIDIQUE DE REFERENCE :
Domaine: ${fiche.domaine}
Sous-domaine: ${fiche.sousDomaine}

EXPLICATION JURIDIQUE :
${fiche.reponse.explication}

ARTICLES DE LOI APPLICABLES :
${fiche.reponse.articles.map(a => `- ${a.ref}: ${a.titre}`).join('\n')}

JURISPRUDENCE :
${fiche.reponse.jurisprudence.map(j => `- ${j.ref}: ${j.resume}`).join('\n')}`;

  return prompt;
}

function buildUserPrompt(userContext, question) {
  return `CONTEXTE DE L'UTILISATEUR :
${userContext}

QUESTION :
${question}

Reponds avec la structure suivante :
1. ANALYSE PERSONNALISEE (applique le droit a la situation concrete)
2. RECOMMANDATIONS (actions concretes a entreprendre, dans l'ordre)
3. ESTIMATION DES CHANCES (prudente, avec reserves)
4. PROCHAINES ETAPES (delais, demarches, contacts)`;
}

function estimateTokens(text) {
  // Rough estimate: ~4 chars per token for French text
  return Math.ceil(text.length / 4);
}

function calculateCost(inputTokens, outputTokens) {
  const inputCost = (inputTokens / 1000) * COST_PER_1K_INPUT;
  const outputCost = (outputTokens / 1000) * COST_PER_1K_OUTPUT;
  return Math.ceil(inputCost + outputCost); // in centimes
}

function simulatedResponse(fiche, userContext, question) {
  return {
    analyse: `[Mode simulation] Basee sur la fiche "${fiche.id}" et votre contexte, voici l'analyse : ${fiche.reponse.explication.substring(0, 300)}... Cette analyse serait personnalisee avec l'API Claude en production.`,
    recommandations: [
      'Rassembler tous les documents pertinents (contrat, correspondances, preuves)',
      'Envoyer une mise en demeure par courrier recommande',
      'Contacter un service d\'aide juridique gratuit de votre canton',
      'Si pas de reponse sous 30 jours, saisir l\'autorite competente'
    ],
    estimationChances: 'Moderees a bonnes — la jurisprudence est generalement favorable dans ce type de situation, mais chaque cas est unique. Consultez un professionnel.',
    prochainesEtapes: [
      { etape: 'Mise en demeure ecrite', delai: 'Immediatement' },
      { etape: 'Attendre reponse', delai: '30 jours' },
      { etape: 'Saisir autorite competente', delai: 'Si pas de reponse' }
    ],
    disclaimer: DISCLAIMER,
    mode: 'simulation'
  };
}

async function callClaudeAPI(systemPrompt, userPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const body = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
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
    throw new Error(`Anthropic API error ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  const text = data.content[0].text;
  const inputTokens = data.usage?.input_tokens || estimateTokens(systemPrompt + userPrompt);
  const outputTokens = data.usage?.output_tokens || estimateTokens(text);

  return { text, inputTokens, outputTokens };
}

function parseStructuredResponse(text) {
  // Try to parse sections from Claude's response
  const sections = {
    analyse: '',
    recommandations: [],
    estimationChances: '',
    prochainesEtapes: []
  };

  const lines = text.split('\n');
  let currentSection = 'analyse';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('analyse personnalisee') || lower.includes('1.')) {
      currentSection = 'analyse';
      continue;
    }
    if (lower.includes('recommandation') || lower.includes('2.')) {
      currentSection = 'recommandations';
      continue;
    }
    if (lower.includes('estimation') || lower.includes('chances') || lower.includes('3.')) {
      currentSection = 'estimationChances';
      continue;
    }
    if (lower.includes('prochaines') || lower.includes('etapes') || lower.includes('4.')) {
      currentSection = 'prochainesEtapes';
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;

    if (currentSection === 'recommandations' || currentSection === 'prochainesEtapes') {
      const cleaned = trimmed.replace(/^[-*\d.)\s]+/, '').trim();
      if (cleaned) {
        if (currentSection === 'prochainesEtapes') {
          sections.prochainesEtapes.push({ etape: cleaned, delai: '' });
        } else {
          sections.recommandations.push(cleaned);
        }
      }
    } else {
      sections[currentSection] += (sections[currentSection] ? ' ' : '') + trimmed;
    }
  }

  return sections;
}

/**
 * Analyze a legal case using Claude API or simulation mode.
 * @param {Object} params
 * @param {string} params.ficheId - The fiche ID to base analysis on
 * @param {string} params.userContext - User's specific situation description
 * @param {string} params.question - User's specific question
 * @returns {Promise<{response: Object, cost: number}>}
 */
export async function analyzeCase({ ficheId, userContext, question }) {
  if (!ficheId) throw new Error('ficheId requis');
  if (!userContext) throw new Error('userContext requis');
  if (!question) throw new Error('question requise');

  const fiche = getFicheById(ficheId);
  if (!fiche) throw new Error(`Fiche "${ficheId}" introuvable`);

  const fallbackToSimulation = () => {
    const response = simulatedResponse(fiche, userContext, question);
    const estimatedInput = estimateTokens(buildSystemPrompt(fiche) + buildUserPrompt(userContext, question));
    const estimatedOutput = estimateTokens(JSON.stringify(response));
    const cost = calculateCost(estimatedInput, estimatedOutput);
    return { response, cost: Math.max(cost, 3) }; // min 3 centimes
  };

  // No API key → simulation mode
  if (!process.env.ANTHROPIC_API_KEY) {
    return fallbackToSimulation();
  }

  // Real API call with fallback to simulation on error
  try {
    const systemPrompt = buildSystemPrompt(fiche);
    const userPrompt = buildUserPrompt(userContext, question);
    const { text, inputTokens, outputTokens } = await callClaudeAPI(systemPrompt, userPrompt);
    const parsed = parseStructuredResponse(text);
    const cost = calculateCost(inputTokens, outputTokens);

    return {
      response: {
        ...parsed,
        disclaimer: DISCLAIMER,
        mode: 'api'
      },
      cost: Math.max(cost, 3) // min 3 centimes
    };
  } catch {
    return fallbackToSimulation();
  }
}

/**
 * Estimate the cost of an analysis without performing it.
 */
export function estimateAnalysisCost(ficheId, userContext, question) {
  const fiche = getFicheById(ficheId);
  if (!fiche) return { min: 3, max: 10 };

  const systemPrompt = buildSystemPrompt(fiche);
  const userPrompt = buildUserPrompt(userContext || '', question || '');
  const inputTokens = estimateTokens(systemPrompt + userPrompt);
  const estimatedOutputTokens = 1500; // average response
  const cost = calculateCost(inputTokens, estimatedOutputTokens);
  return { min: Math.max(cost, 3), max: Math.max(cost * 2, 10) };
}

export { DISCLAIMER };
