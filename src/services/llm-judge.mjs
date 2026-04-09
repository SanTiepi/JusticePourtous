/**
 * LLM-as-Judge — Évaluation qualitative des réponses par LLM
 *
 * Inspiré de LRAGE + Stanford "22 criteria" + OpenAI custom judge.
 * Utilise Haiku pour évaluer si une réponse est juridiquement correcte,
 * complète, et actionnable — pas juste si les mots-clés sont présents.
 */

const JUDGE_SYSTEM = `Tu es un évaluateur juridique suisse strict. Tu évalues la QUALITÉ d'une réponse de triage juridique.

Pour chaque critère, note de 0 à 2:
- 0 = absent ou incorrect
- 1 = partiellement correct ou incomplet
- 2 = correct et complet

CRITÈRES:
1. IDENTIFICATION: La situation juridique est-elle correctement identifiée? (domaine, type de problème)
2. BASE_LEGALE: Les articles de loi cités sont-ils les bons pour cette situation?
3. COMPLETUDE: Les informations essentielles sont-elles toutes présentes? (délais, montants, autorités, preuves)
4. CONTRADICTOIRE: Les arguments CONTRE la position du citoyen sont-ils mentionnés?
5. ACTIONNABLE: Le citoyen sait-il exactement QUOI FAIRE lundi matin? (étapes concrètes, contacts, formulaires)
6. PRUDENCE: Les limites et incertitudes sont-elles honnêtement signalées?
7. QUESTIONS: Les questions posées sont-elles les bonnes (changent le résultat) ou génériques?

Réponds UNIQUEMENT en JSON: { "scores": { "identification": 0-2, "base_legale": 0-2, "completude": 0-2, "contradictoire": 0-2, "actionnable": 0-2, "prudence": 0-2, "questions": 0-2 }, "total": 0-14, "verdict": "excellent|bon|insuffisant", "critique": "1 phrase sur la plus grosse faiblesse" }`;

/**
 * Evaluate a search result using LLM-as-judge.
 * @param {string} query — the citizen's original question
 * @param {object} result — the system's response
 * @returns {object|null} evaluation or null if API unavailable
 */
export async function judgeResult(query, result) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const resultSummary = {
    domaine: result.fiche?.domaine || result.llm_triage?.domaine,
    fiche: result.fiche?.id || result.llm_triage?.ficheId,
    articles: (result.articles || []).slice(0, 5).map(a => a.ref),
    juris_count: (result.jurisprudence || []).length,
    juris_roles: countRoles(result.jurisprudence || []),
    delais: (result.delais || []).slice(0, 3).map(d => d.delai || d.procedure),
    confiance: result.confiance,
    lacunes: (result.lacunes || []).map(l => l.message || l),
    questions: result.llm_triage?.questions?.map(q => q.question) || [],
    contacts: (result.escalade || []).length,
    triage_method: result.triage_method,
  };

  const userPrompt = `QUESTION DU CITOYEN: "${query}"

RÉPONSE DU SYSTÈME:
${JSON.stringify(resultSummary, null, 2)}

Évalue cette réponse.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: JUDGE_SYSTEM,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    const text = data.content[0].text;
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

/**
 * Run LLM judge on all golden cases.
 */
export async function runJudgeEval(searchFn, goldenCases) {
  const results = [];

  for (const gc of goldenCases) {
    const searchResult = await searchFn(gc.query, gc.canton);
    const judgment = await judgeResult(gc.query, searchResult);

    results.push({
      case_id: gc.id,
      domaine: gc.domaine,
      judgment,
      score: judgment?.total || 0,
      max_score: 14,
      verdict: judgment?.verdict || 'unavailable',
      critique: judgment?.critique || null,
    });
  }

  const avgScore = results.reduce((s, r) => s + r.score, 0) / results.length;
  const excellent = results.filter(r => r.verdict === 'excellent').length;
  const bon = results.filter(r => r.verdict === 'bon').length;
  const insuffisant = results.filter(r => r.verdict === 'insuffisant').length;

  return {
    avg_score: Math.round(avgScore * 10) / 10,
    max_score: 14,
    pct: Math.round((avgScore / 14) * 100),
    excellent,
    bon,
    insuffisant,
    results,
    generated_at: new Date().toISOString(),
  };
}

function countRoles(juris) {
  const roles = {};
  for (const j of juris) {
    const r = j.role || 'unknown';
    roles[r] = (roles[r] || 0) + 1;
  }
  return roles;
}
