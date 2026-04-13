/**
 * Pipeline V3 — Dossier contradictoire en 3 étapes
 *
 * Étape 1: COMPRENDRE (Claude) — faits + qualification + questions
 * Étape 2: DOSSIER (code) — assembler tout le contexte pertinent
 * Étape 3: RAISONNER + VÉRIFIER (GPT via Codex) — analyse + objections
 *
 * 2 appels LLM. 3-5 secondes. Un dossier vérifié, pas une fiche matchée.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';
import https from 'node:https';
import { getSourceByRef, getSourceBySignature, articleSourceId, arretSourceId } from './source-registry.mjs';
import { certifyDossier } from './coverage-certificate.mjs';
import { analyzeDossier } from './argumentation-engine.mjs';
import { generateDossierQuestions } from './marginal-questioner.mjs';
import { analyzeWithCommittee } from './committee-engine.mjs';
import { compile as compileNormative } from './normative-compiler.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

// ============================================================
// RELEVANCE SCORING — filtre par pertinence, pas par domaine seul
// ============================================================

function scoreRelevance(text, queryWords) {
  if (!text || !queryWords.length) return 0;
  const lower = text.toLowerCase();
  return queryWords.filter(w => w.length > 3 && lower.includes(w)).length;
}

// ============================================================
// DATA LOADING — nos objets structurés (le moat)
// ============================================================

function loadJSON(relativePath) {
  const fullPath = join(dataDir, relativePath);
  if (!existsSync(fullPath)) return null;
  return JSON.parse(readFileSync(fullPath, 'utf-8'));
}

function loadAllInDir(dir) {
  const fullDir = join(dataDir, dir);
  if (!existsSync(fullDir)) return [];
  const all = [];
  for (const f of readdirSync(fullDir).filter(f => f.endsWith('.json'))) {
    const data = loadJSON(`${dir}/${f}`);
    if (Array.isArray(data)) all.push(...data);
  }
  return all;
}

// Load all structured objects at startup
const ALL_FICHES = loadAllInDir('fiches');
const ALL_ARTICLES = loadAllInDir('loi');
const ALL_ARRETS = loadAllInDir('jurisprudence');
const ALL_DELAIS = loadAllInDir('delais');
const ALL_ANTI_ERREURS = loadAllInDir('anti-erreurs');
const ALL_PATTERNS = loadAllInDir('patterns');
const ALL_CAS_PRATIQUES = loadAllInDir('cas-pratiques');
const ALL_PREUVES = loadAllInDir('preuves');
const ALL_ESCALADE = loadAllInDir('escalade');
const ALL_TEMPLATES = loadAllInDir('templates');
const ALL_RECEVABILITE = loadAllInDir('recevabilite');

// Build fiche catalog for step 1
const FICHE_CATALOG = ALL_FICHES.map(f => ({
  id: f.id,
  domaine: f.domaine,
  match_description: f.match_description || '',
  profane_aliases: f.profane_aliases || [],
  negative_signals: f.negative_signals || [],
  required_facts: f.required_facts || []
}));

// ============================================================
// ÉTAPE 1: COMPRENDRE (Claude API)
// ============================================================

const STEP1_SYSTEM = `Tu es un juriste suisse qui fait le PREMIER TRI d'un dossier citoyen.

MISSION: Extraire les faits, qualifier les problèmes juridiques, identifier les questions critiques.

CATALOGUE DES SITUATIONS CONNUES (utilise match_description pour identifier):
${FICHE_CATALOG.map(f => `${f.id}: ${f.match_description}`).filter(l => l.includes(': ')).join('\n')}

INSTRUCTIONS:
1. Extrais TOUS les faits du texte (dates, montants, acteurs, actions, documents mentionnés)
2. Identifie 1-3 problèmes juridiques (issues) avec leur qualification
3. Pour chaque issue, indique les conditions REMPLIES et MANQUANTES
4. Pose les questions dont la réponse CHANGE le diagnostic (max 4)
5. Si le citoyen mentionne violence, danger, urgence vitale → flag mode_crise=true

RÉPONDS EN JSON:
{
  "faits": {"acteurs":[], "dates":[], "montants":[], "actions_faites":[], "documents":[]},
  "canton": "XX" ou null,
  "issues": [
    {
      "issue_id": "issue_1",
      "qualification": "Restitution du dépôt de garantie",
      "fiche_ids": ["bail_depot_garantie"],
      "domaine": "bail",
      "conditions_remplies": ["bail terminé", "clés rendues"],
      "conditions_manquantes": ["état des lieux signé?", "retenues justifiées?"],
      "urgence": "ce_mois",
      "base_legale_probable": ["CO 257e"]
    }
  ],
  "questions_critiques": [
    {
      "question": "Y a-t-il eu un état des lieux de sortie signé par les deux parties?",
      "choix": ["Oui, signé", "Oui mais je n'ai pas signé", "Non, pas d'état des lieux"],
      "pourquoi": "Détermine si la régie peut invoquer des dommages",
      "impact": "change_strategy"
    }
  ],
  "mode_crise": false,
  "resume": "Phrase résumant la compréhension de la situation"
}`;

// CLI fallback — uses Claude CLI (subscription) instead of API (paid credits)
function callClaudeCLI(systemPrompt, userPrompt) {
  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  // Always use stdin — command line args have length limits
  const result = execSync('claude --print', {
    input: fullPrompt,
    timeout: 120000,
    encoding: 'utf-8',
    maxBuffer: 2 * 1024 * 1024
  });
  return result.trim();
}

function parseJSONResponse(text) {
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  // Try to find JSON in the response
  const jsonStart = clean.indexOf('{');
  const jsonEnd = clean.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON found in response');
  return JSON.parse(clean.slice(jsonStart, jsonEnd + 1));
}

async function step1_comprendre(texte, canton, reponsesPrec) {
  let userPrompt = `SITUATION DU CITOYEN:\n${texte}`;
  if (canton) userPrompt += `\nCanton: ${canton}`;
  if (reponsesPrec && Object.keys(reponsesPrec).length > 0) {
    userPrompt += '\n\nRÉPONSES AUX QUESTIONS PRÉCÉDENTES:\n';
    for (const [q, a] of Object.entries(reponsesPrec)) {
      userPrompt += `- ${q}: ${a}\n`;
    }
  }

  let text;
  let usage = { input: 0, output: 0 };

  // Try API first, fall back to CLI
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const body = JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: STEP1_SYSTEM,
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

      if (resp.ok) {
        const data = await resp.json();
        text = data.content[0].text;
        usage = { input: data.usage?.input_tokens || 0, output: data.usage?.output_tokens || 0 };
      } else {
        console.log(`API error ${resp.status}, falling back to CLI...`);
        text = callClaudeCLI(STEP1_SYSTEM, userPrompt);
        usage = { input: 0, output: 0, mode: 'cli' };
      }
    } catch (e) {
      console.log(`API exception, falling back to CLI: ${e.message}`);
      text = callClaudeCLI(STEP1_SYSTEM, userPrompt);
      usage = { input: 0, output: 0, mode: 'cli' };
    }
  } else {
    // No API key — use CLI directly
    text = callClaudeCLI(STEP1_SYSTEM, userPrompt);
    usage = { input: 0, output: 0, mode: 'cli' };
  }

  // Parse JSON response
  const parsed = parseJSONResponse(text);

  // Validate fiche_ids exist
  const validIds = new Set(ALL_FICHES.map(f => f.id));
  for (const issue of (parsed.issues || [])) {
    issue.fiche_ids = (issue.fiche_ids || []).filter(id => validIds.has(id));
  }

  return {
    comprehension: parsed,
    usage
  };
}

// ============================================================
// ÉTAPE 2: CONSTRUIRE LE DOSSIER (code pur, pas de LLM)
// ============================================================

function step2_dossier(comprehension, canton) {
  const dossier = {
    faits: comprehension.faits,
    canton: canton || comprehension.canton,
    issues: [],
    sources_count: 0
  };

  for (const issue of (comprehension.issues || [])) {
    const issueDossier = {
      issue_id: issue.issue_id,
      qualification: issue.qualification,
      domaine: issue.domaine,
      conditions_remplies: issue.conditions_remplies,
      conditions_manquantes: issue.conditions_manquantes,
      urgence: issue.urgence,

      // Articles de loi complets
      articles: [],
      // Arrêts TF pertinents
      arrets: [],
      // Délais applicables
      delais: [],
      // Anti-erreurs du domaine
      anti_erreurs: [],
      // Patterns praticien
      patterns: [],
      // Preuves à réunir
      preuves: [],
      // Cas pratiques similaires
      cas_pratiques: [],
      // Templates de lettres
      templates: [],
      // Contacts cantonaux
      contacts: [],
      // Recevabilité
      recevabilite: [],
      // Fiche enrichie
      fiche: null
    };

    const domaine = issue.domaine;

    // Charger la fiche principale
    for (const ficheId of (issue.fiche_ids || [])) {
      const fiche = ALL_FICHES.find(f => f.id === ficheId);
      if (fiche && !issueDossier.fiche) {
        issueDossier.fiche = {
          id: fiche.id,
          explication: fiche.reponse?.explication,
          articles: fiche.reponse?.articles,
          jurisprudence: fiche.reponse?.jurisprudence,
          modeleLettre: fiche.reponse?.modeleLettre
        };
      }
    }

    // Articles de loi — texte complet + articles connexes
    const articleRefs = new Set(issue.base_legale_probable || []);
    // Also add articles from the fiche
    if (issueDossier.fiche?.articles) {
      for (const a of issueDossier.fiche.articles) articleRefs.add(a.ref);
    }
    for (const ref of articleRefs) {
      const article = ALL_ARTICLES.find(a => a.ref === ref);
      if (article) {
        issueDossier.articles.push({
          ref: article.ref,
          titre: article.titre,
          texteSimple: article.texteSimple || article.texte || '',
          exemplesConcrets: article.exemplesConcrets,
          lienFedlex: article.lienFedlex,
          articlesLies: article.articlesLies,
          source_id: getSourceByRef(article.ref)?.source_id || `art_${article.ref.replace(/\s/g, '_')}`
        });
        // Load linked articles too (1 level deep)
        for (const linked of (article.articlesLies || []).slice(0, 3)) {
          if (!articleRefs.has(linked)) {
            articleRefs.add(linked);
            const linkedArt = ALL_ARTICLES.find(a => a.ref === linked);
            if (linkedArt) {
              issueDossier.articles.push({
                ref: linkedArt.ref,
                titre: linkedArt.titre,
                texteSimple: linkedArt.texteSimple || linkedArt.texte || '',
                lienFedlex: linkedArt.lienFedlex,
                source_id: getSourceByRef(linkedArt.ref)?.source_id || `art_${linkedArt.ref.replace(/\s/g, '_')}`,
                role: 'connexe'
              });
            }
          }
        }
      }
    }

    // Arrêts TF — séparés en FAVORABLES et DÉFAVORABLES
    // Score pertinence par mots-clés de la qualification
    const qualWords = (issue.qualification || '').toLowerCase().split(/\s+/);
    const scoredArrets = ALL_ARRETS
      .filter(a => {
        const text = [a.resume, a.theme, a.principeCle, ...(a.articlesAppliques || [])].join(' ').toLowerCase();
        // Must match at least 1 article ref OR 2 keywords
        const matchesArticle = (issue.base_legale_probable || []).some(ref => text.includes(ref.toLowerCase()));
        const matchesKeywords = qualWords.filter(w => w.length > 3 && text.includes(w)).length;
        return matchesArticle || matchesKeywords >= 2;
      })
      .map(a => {
        const text = [a.resume, a.theme, a.principeCle].join(' ').toLowerCase();
        const relevance = qualWords.filter(w => w.length > 3 && text.includes(w)).length;
        return { ...a, relevance };
      })
      .sort((a, b) => b.relevance - a.relevance);

    // Citizen-perspective role classification
    const CITIZEN = new Set(['locataire','employe','debiteur','etranger','enfant','epouse','mere','pere','heritier']);
    const AUTHORITY = new Set(['bailleur','employeur','creancier','autorite']);
    function classifyResultat(r) {
      if (!r) return 'neutre';
      const n = r.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (n.includes('rejete') || n.includes('rejet')) return 'defavorable';
      if (n.startsWith('partiellement')) return 'neutre';
      if (n.startsWith('favorable_')) {
        const actor = n.replace('favorable_', '');
        if (CITIZEN.has(actor)) return 'favorable';
        if (AUTHORITY.has(actor)) return 'defavorable';
        return 'favorable';
      }
      if (n.includes('favorable')) return 'favorable';
      return 'neutre';
    }

    const favorables = scoredArrets.filter(a =>
      classifyResultat(a.resultat) === 'favorable'
    ).slice(0, 3);

    const defavorables = scoredArrets.filter(a =>
      classifyResultat(a.resultat) === 'defavorable'
    ).slice(0, 2);

    const neutres = scoredArrets.filter(a =>
      !favorables.includes(a) && !defavorables.includes(a)
    ).slice(0, 2);

    const formatArret = (a, role) => ({
      signature: a.signature,
      date: a.date,
      resume: a.resume,
      principeCle: a.principeCle,
      resultat: a.resultat,
      montant: a.montant,
      fourchetteMontant: a.fourchetteMontant,
      articlesAppliques: a.articlesAppliques,
      source_id: getSourceBySignature(a.signature)?.source_id || `arret_${a.signature?.replace(/[\/\s]/g, '_')}`,
      role // 'favorable', 'defavorable', 'neutre'
    });

    issueDossier.arrets = [
      ...favorables.map(a => formatArret(a, 'favorable')),
      ...defavorables.map(a => formatArret(a, 'defavorable')),
      ...neutres.map(a => formatArret(a, 'neutre'))
    ];

    // Délais du domaine
    issueDossier.delais = ALL_DELAIS
      .filter(d => d.domaine === domaine)
      .map(d => ({
        procedure: d.procedure,
        delai: d.delai,
        computation: d.computation,
        feries: d.feries,
        consequence: d.consequence,
        base_legale: d.base_legale,
        source_id: `delai_${d.procedure?.replace(/\s/g, '_')}`
      }));

    // Anti-erreurs du domaine — filtrées par pertinence
    issueDossier.anti_erreurs = ALL_ANTI_ERREURS
      .filter(ae => ae.domaine === domaine)
      .map(ae => ({
        erreur: ae.erreur,
        gravite: ae.gravite,
        consequence: ae.consequence,
        correction: ae.correction,
        base_legale: ae.base_legale,
        source_id: `ae_${ae.erreur?.slice(0, 30).replace(/\s/g, '_')}`,
        _relevance: scoreRelevance(
          [ae.erreur, ae.consequence, ae.correction].join(' '),
          qualWords
        )
      }))
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, 5);

    // Patterns praticien — filtrés par pertinence
    issueDossier.patterns = ALL_PATTERNS
      .filter(p => p.domaine === domaine)
      .map(p => ({
        situation: p.situation,
        strategieOptimale: p.strategieOptimale,
        neJamaisFaire: p.neJamaisFaire,
        signauxFaibles: p.signauxFaibles,
        tempsTypique: p.tempsTypique,
        source_id: `pattern_${p.situation?.slice(0, 30).replace(/\s/g, '_')}`,
        _relevance: scoreRelevance(
          [p.situation, ...(p.signauxFaibles || [])].join(' '),
          qualWords
        )
      }))
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, 3);

    // Preuves — filtrées par pertinence
    issueDossier.preuves = ALL_PREUVES
      .filter(p => p.domaine === domaine)
      .map(p => ({
        procedure: p.procedure,
        preuves_necessaires: p.preuves_necessaires,
        preuves_utiles: p.preuves_utiles,
        charge_de_la_preuve: p.charge_de_la_preuve,
        source_id: `preuve_${p.procedure?.replace(/\s/g, '_')}`,
        _relevance: scoreRelevance(
          [p.procedure, ...(p.preuves_necessaires || [])].join(' '),
          qualWords
        )
      }))
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, 3);

    // Cas pratiques — filtrés par pertinence
    issueDossier.cas_pratiques = ALL_CAS_PRATIQUES
      .filter(c => c.domaine === domaine)
      .map(c => ({
        titre: c.titre,
        situation: c.situation,
        resultat: c.resultat,
        lecons: c.lecons,
        source_id: `cas_${c.id}`,
        _relevance: scoreRelevance(
          [c.titre, c.situation, c.resultat].join(' '),
          qualWords
        )
      }))
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, 3);

    // Templates
    issueDossier.templates = ALL_TEMPLATES
      .filter(t => t.domaine === domaine)
      .slice(0, 2)
      .map(t => ({
        id: t.id,
        titre: t.titre,
        type: t.type,
        source_id: `tpl_${t.id}`
      }));

    // Contacts filtrés par canton
    const c = (canton || comprehension.canton || '').toUpperCase();
    issueDossier.contacts = ALL_ESCALADE
      .filter(e => e.domaines?.includes(domaine))
      .filter(e => !c || e.cantons?.includes(c) || !e.cantons?.length)
      .slice(0, 5)
      .map(e => ({
        nom: e.nom,
        type: e.type,
        gratuit: e.gratuit,
        contact: e.contact,
        conditions: e.conditions,
        source_id: `contact_${e.id}`
      }));

    // Count sources
    const srcCount = issueDossier.articles.length + issueDossier.arrets.length +
      issueDossier.delais.length + issueDossier.anti_erreurs.length +
      issueDossier.patterns.length + issueDossier.cas_pratiques.length;
    dossier.sources_count += srcCount;

    dossier.issues.push(issueDossier);
  }

  return dossier;
}

// ============================================================
// ÉTAPE 3: RAISONNER + VÉRIFIER (second modèle)
// ============================================================

const STEP3_SYSTEM = `Tu es un second juriste suisse qui vérifie et complète l'analyse d'un collègue.

Tu reçois un DOSSIER COMPLET avec tous les articles, arrêts, délais et contacts.

MISSION:
1. Pour chaque issue, produis des CLAIMS vérifiés (ce qu'on peut affirmer)
2. Cherche ce que le premier juriste a OUBLIÉ: exceptions, conditions, variations cantonales
3. Flag les CONTRADICTIONS entre les sources
4. Calcule un niveau de confiance par claim

RÈGLES:
- Chaque claim DOIT citer au moins un source_id du dossier
- Si tu ne trouves pas de source dans le dossier → le claim est "insufficient"
- Les délais et montants doivent venir des tables du dossier, pas de ta mémoire
- Si une condition manquante change tout → flag "provisional"

RÉPONDS EN JSON:
{
  "claims": [
    {
      "claim_id": "C1",
      "issue_id": "issue_1",
      "affirmation": "Le bailleur doit restituer la caution dans un délai d'un an",
      "statut": "confirmed",
      "source_ids": ["art_CO_257e", "arret_4A_32_2018"],
      "conditions": ["si pas de créance du bailleur"],
      "exceptions": ["retenue possible pour dommages prouvés"],
      "variation_cantonale": null,
      "confiance": "haute"
    }
  ],
  "objections": [
    {
      "claim_id": "C1",
      "objection": "Le délai d'un an ne court qu'après restitution de la chose",
      "source_id": "art_CO_257e",
      "severite": "important"
    }
  ],
  "plan_action": {
    "etapes": [
      {"numero": 1, "action": "...", "delai": "...", "source_id": "..."},
    ],
    "erreurs_a_eviter": ["..."],
    "documents_a_reunir": ["..."],
    "si_refus": "..."
  },
  "ce_quon_ne_sait_pas": ["..."],
  "besoin_avocat": false,
  "besoin_avocat_raison": null
}`;

async function step3_raisonner(dossier) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Compact dossier — limit size for token efficiency
  const compactDossier = {
    faits: dossier.faits,
    canton: dossier.canton,
    issues: dossier.issues.map(iss => ({
      issue_id: iss.issue_id,
      qualification: iss.qualification,
      domaine: iss.domaine,
      conditions_remplies: iss.conditions_remplies,
      conditions_manquantes: iss.conditions_manquantes,
      articles: iss.articles.slice(0, 3),
      arrets: iss.arrets.slice(0, 3).map(a => ({ signature: a.signature, resume: a.resume, resultat: a.resultat, montant: a.montant, source_id: a.source_id })),
      delais: iss.delais,
      anti_erreurs: iss.anti_erreurs,
      patterns: iss.patterns.slice(0, 2),
      cas_pratiques: iss.cas_pratiques.slice(0, 2),
      contacts: iss.contacts.slice(0, 3)
    }))
  };
  const dossierStr = JSON.stringify(compactDossier, null, 0);
  const userMsg = `DOSSIER:\n${dossierStr}\n\nAnalyse et vérifie.`;

  // Try OpenAI API first (cross-model check)
  if (openaiKey) {
    try {
      return await callOpenAI(STEP3_SYSTEM, userMsg, openaiKey);
    } catch (e) {
      console.log(`OpenAI error, trying Claude API: ${e.message}`);
    }
  }

  // Try Claude API
  if (anthropicKey) {
    try {
      return await callClaude(STEP3_SYSTEM, userMsg, anthropicKey);
    } catch (e) {
      console.log(`Claude API error, falling back to CLI: ${e.message}`);
    }
  }

  // Fallback: Claude CLI (subscription, free)
  try {
    const text = callClaudeCLI(STEP3_SYSTEM, userMsg);
    const parsed = parseJSONResponse(text);
    return { analysis: parsed, usage: { input: 0, output: 0, mode: 'cli' }, model: 'claude-cli' };
  } catch (e) {
    console.error(`CLI fallback also failed: ${e.message}`);
    return null;
  }
}

async function callClaude(system, user, apiKey) {
  const body = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system,
    messages: [{ role: 'user', content: user }]
  });

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body
  });

  if (!resp.ok) throw new Error(`Claude error ${resp.status}`);
  const data = await resp.json();
  const text = data.content[0].text;
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return {
    analysis: JSON.parse(clean),
    usage: { input: data.usage?.input_tokens || 0, output: data.usage?.output_tokens || 0 },
    model: 'claude'
  };
}

async function callOpenAI(system, user, apiKey) {
  const body = JSON.stringify({
    model: 'gpt-4o',
    max_tokens: 2000,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    response_format: { type: 'json_object' }
  });

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body
  });

  if (!resp.ok) throw new Error(`OpenAI error ${resp.status}`);
  const data = await resp.json();
  const text = data.choices[0].message.content;
  return {
    analysis: JSON.parse(text),
    usage: { input: data.usage?.prompt_tokens || 0, output: data.usage?.completion_tokens || 0 },
    model: 'gpt'
  };
}

// ============================================================
// COMPILATEUR DÉTERMINISTE (code, jamais LLM)
// ============================================================

function step_compile(dossier, analysis) {
  const compiled = {
    delais_critiques: [],
    autorite_competente: null,
    documents_requis: [],
    fourchette_montant: null,
    contacts: [],
    erreurs_fatales: []
  };

  for (const issue of dossier.issues) {
    // Délais — viennent des TABLES, pas du LLM
    for (const d of issue.delais) {
      compiled.delais_critiques.push({
        procedure: d.procedure,
        delai: d.delai,
        consequence: d.consequence,
        source: d.source_id
      });
    }

    // Contacts cantonaux
    compiled.contacts = issue.contacts;

    // Anti-erreurs critiques
    for (const ae of issue.anti_erreurs.filter(ae => ae.gravite === 'critique')) {
      compiled.erreurs_fatales.push({
        erreur: ae.erreur,
        consequence: ae.consequence,
        source: ae.source_id
      });
    }

    // Fourchettes de montant depuis la jurisprudence
    for (const a of issue.arrets) {
      if (a.fourchetteMontant) {
        compiled.fourchette_montant = a.fourchetteMontant;
        break;
      }
    }

    // Documents à réunir depuis preuves
    for (const p of issue.preuves) {
      compiled.documents_requis.push(...(p.preuves_necessaires || []));
    }
  }

  // Dedupe documents
  compiled.documents_requis = [...new Set(compiled.documents_requis)];

  return compiled;
}

// ============================================================
// ─── Build questions: LLM-first, marginal questioner as supplement ──

function buildQuestions(comprehension, dossier, certificate) {
  const questions = [];
  const seenIds = new Set();

  // 1. LLM questions (specific to this case — highest priority)
  const llmQuestions = comprehension.questions_critiques || [];
  for (const q of llmQuestions) {
    const id = q.id || ('llm_' + questions.length);
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    questions.push({
      id,
      question: q.question,
      choix: q.choix || [],
      importance: q.impact === 'change_strategy' ? 'critique' : 'utile',
      pourquoi: q.pourquoi || '',
      source: 'llm',
    });
  }

  // 2. Marginal questioner (generic but scored by impact — fill gaps)
  if (questions.length < 5) {
    const marginalQs = generateDossierQuestions(comprehension, dossier, certificate, 5 - questions.length);
    for (const mq of marginalQs) {
      // Skip if similar question already exists from LLM
      const isDuplicate = questions.some(q =>
        q.question.toLowerCase().includes(mq.id) ||
        mq.question.toLowerCase().includes(q.id)
      );
      if (isDuplicate) continue;
      questions.push({
        id: mq.id,
        question: mq.question,
        choix: [], // marginal questioner doesn't provide choices
        importance: mq.score >= 6 ? 'critique' : 'utile',
        pourquoi: mq.why || '',
        source: 'marginal',
      });
    }
  }

  return questions;
}

// EXPORT — Pipeline complet
// ============================================================

export async function analyserCas(texte, canton, reponsesPrec) {
  // Étape 1: Comprendre
  const step1 = await step1_comprendre(texte, canton, reponsesPrec);
  if (!step1) return null;

  const comprehension = step1.comprehension;

  // Mode crise — court-circuit
  if (comprehension.mode_crise) {
    return {
      mode_crise: true,
      resume: comprehension.resume,
      canton: comprehension.canton || canton
    };
  }

  // Questions critiques — retourner si besoin d'infos
  const hasQuestions = (comprehension.questions_critiques || []).length > 0 && !reponsesPrec;

  // Étape 2: Construire le dossier
  const dossier = step2_dossier(comprehension, canton);

  // Étape 2.5: Certificat de suffisance contradictoire
  const certificate = certifyDossier(dossier);

  // Étape 2.6: Argumentation graph (Dung/Toulmin resolved by code)
  const argumentation = analyzeDossier(dossier);

  // Étape 2.7: Committee vote on argumentation results
  const committeeResults = argumentation.issues.map((argIssue, i) => {
    const issueCert = certificate.issues?.[i] || null;
    return analyzeWithCommittee(argIssue, issueCert);
  });

  // Étape 3: Raisonner + Vérifier
  // Gate: if certificate is insufficient, skip step 3 and return degraded
  let analysis = null;
  let step3Usage = { input: 0, output: 0 };
  if (certificate.status === 'insufficient') {
    // Don't waste LLM tokens on an insufficient dossier
    analysis = {
      claims: [],
      objections: [],
      plan_action: null,
      ce_quon_ne_sait_pas: certificate.issues
        .flatMap(i => i.missing.filter(m => m.critical).map(m => m.label)),
      besoin_avocat: true,
      besoin_avocat_raison: `Dossier insuffisant: ${certificate.issues.flatMap(i => i.critical_fails).join(', ')}`,
      _degraded: true,
      _certificate_status: 'insufficient',
    };
  } else {
    try {
      const step3 = await step3_raisonner(dossier);
      if (step3) {
        analysis = step3.analysis;
        step3Usage = step3.usage;
      }
    } catch (err) {
      console.error('Step 3 error:', err.message);
      // Continue without verification — degraded mode
    }
  }

  // Compilateur déterministe (legacy)
  const compiled = step_compile(dossier, analysis);

  // Compilateur normatif V4 — règles juridiques en code exécutable
  const normativeFacts = {
    domaine: dossier.issues?.[0]?.domaine,
    canton: dossier.canton || comprehension.canton,
    ...(comprehension.extractions || {}),
  };
  const normative = compileNormative(normativeFacts);

  return {
    mode_crise: false,
    complet: !hasQuestions,
    comprehension,
    dossier_summary: {
      issues_count: dossier.issues.length,
      sources_count: dossier.sources_count,
      domaines: [...new Set(dossier.issues.map(i => i.domaine))]
    },
    certificate,
    argumentation,
    committee: committeeResults,
    analysis,
    compiled,
    normative,
    questions: buildQuestions(comprehension, dossier, certificate),
    resume: comprehension.resume,
    usage: {
      step1: step1.usage,
      step3: step3Usage,
      total_input: step1.usage.input + step3Usage.input,
      total_output: step1.usage.output + step3Usage.output
    }
  };
}

export { step1_comprendre, step2_dossier, step3_raisonner, step_compile, FICHE_CATALOG };
