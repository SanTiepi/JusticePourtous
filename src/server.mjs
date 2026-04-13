import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

import { getAllFiches, getFicheById } from './services/fiches.mjs';
import { consulter, getQuestionsForDomaine } from './services/consultation.mjs';
import { getServicesByCanton } from './services/annuaire.mjs';
import {
  acheterWallet, getCredits, analyser, genererLettre, ocrDocument,
  analyserAI, ocrDocumentAI, genererLettreAI, estimerCout, getHistorique
} from './services/premium.mjs';
import { getAllStatistiques, getStatistiquesByDomaine } from './services/statistiques.mjs';
import { CALCULATEURS } from './services/calculateurs.mjs';
import {
  queryByProblem, queryByArticle, queryByDecision,
  queryByDomain, queryComplete, getTableDesMatieres, getCompleteness
} from './services/knowledge-engine.mjs';
import { generateActionPlan } from './services/action-planner.mjs';
import { triage, estimateCost } from './services/triage-engine.mjs';
import { analyserCas } from './services/pipeline-v3.mjs';
import { getRegistryStats, getSourceById, getSourcesByDomain, getSourcesByTier, validateClaimSources } from './services/source-registry.mjs';
import { getObjectStats, getObjectsByType, getObjectById, getObjectsByDomain, getDossierObjects, VERIFIED_CLAIM_SCHEMA } from './services/object-registry.mjs';
import { getChecklistDefinition } from './services/coverage-certificate.mjs';
import { GOLDEN_CASES, RUBRICS } from './services/eval-harness.mjs';
import { analyzeIssue } from './services/argumentation-engine.mjs';
import { analyzeFrontier, getNextIngestionPriorities, getSourceCatalog } from './services/source-frontier.mjs';
import { compile as compileNormative, getRuleDefinitions } from './services/normative-compiler.mjs';
import { deepAnalysis } from './services/deep-analysis.mjs';
import { getVulgarisationForFiche, getVulgarisationStats } from './services/vulgarisation-loader.mjs';
import {
  getAllArticles, searchArticles,
  getAllArrets, searchArrets,
  getNiveauxConfiance,
  getRecevabilite, getRecevabiliteByProcedure,
  getDelais, getDelaisByDomaine,
  getPreuves,
  getTaxonomie, searchTaxonomie,
  getAntiErreurs, getAntiErreursByDomaine,
  getPatterns, getPatternsByDomaine,
  getCasPratiques, getCasByDomaine,
  getEscalade, getEscaladeByDomaine,
  getAnnuaireComplet, getAnnuaireByCanton,
  getCantons, getCantonByCode,
  getCouts,
  getTemplates, getTemplateById,
  getCouverture
} from './services/donnees-juridiques.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, 'public');

// Load domaines
const domainesData = JSON.parse(readFileSync(join(__dirname, 'data', 'domaines.json'), 'utf-8'));

// Load workflows & cascades
const workflowsData = JSON.parse(readFileSync(join(__dirname, 'data', 'workflows', 'moments-de-vie.json'), 'utf-8'));
const cascadesData = JSON.parse(readFileSync(join(__dirname, 'data', 'cascades', 'cascades.json'), 'utf-8'));

const DISCLAIMER = "JusticePourtous fournit des informations juridiques generales basees sur le droit suisse en vigueur. Il ne remplace pas un conseil d'avocat personnalise. Les informations sont donnees a titre indicatif et sans garantie d'exhaustivite. En cas de doute, consultez un professionnel du droit ou contactez les services listes.";

// In-memory feedback store
const feedbackStore = [];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function json(res, statusCode, data) {
  setSecurityHeaders(res);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function parseRawBody(req, maxSize) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxSize) {
        tooLarge = true;
        // Stop collecting but don't destroy — let the request drain
        chunks.length = 0;
      }
      if (!tooLarge) chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) return reject(new Error('BODY_TOO_LARGE'));
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, filePath) {
  if (!existsSync(filePath)) {
    json(res, 404, { error: 'Not found' });
    return;
  }
  const ext = extname(filePath);
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  setSecurityHeaders(res);
  res.writeHead(200, { 'Content-Type': mime });
  res.end(readFileSync(filePath));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // API routes
    if (path === '/api/health' && method === 'GET') {
      return json(res, 200, { status: 'ok', timestamp: new Date().toISOString(), disclaimer: DISCLAIMER });
    }

    if (path === '/api/domaines' && method === 'GET') {
      return json(res, 200, { domaines: domainesData, disclaimer: DISCLAIMER });
    }

    if (path.match(/^\/api\/domaines\/([^/]+)\/questions$/) && method === 'GET') {
      const domaineId = path.match(/^\/api\/domaines\/([^/]+)\/questions$/)[1];
      const result = getQuestionsForDomaine(domaineId);
      return json(res, result.status, result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path === '/api/consulter' && method === 'POST') {
      const body = await parseBody(req);
      const result = consulter(body);
      return json(res, result.status, result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path.match(/^\/api\/fiches\/([^/]+)$/) && method === 'GET') {
      const ficheId = path.match(/^\/api\/fiches\/([^/]+)$/)[1];
      const fiche = getFicheById(ficheId);
      if (!fiche) return json(res, 404, { error: 'Fiche non trouvee', disclaimer: DISCLAIMER });
      return json(res, 200, { fiche, disclaimer: DISCLAIMER });
    }

    if (path.match(/^\/api\/services\/([^/]+)$/) && method === 'GET') {
      const canton = path.match(/^\/api\/services\/([^/]+)$/)[1];
      const services = getServicesByCanton(canton);
      return json(res, 200, { services, canton: canton.toUpperCase(), disclaimer: DISCLAIMER });
    }

    // Legacy premium routes (kept for backward compat)
    if (path === '/api/premium/acheter' && method === 'POST') {
      const result = acheterWallet();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path === '/api/premium/credits' && method === 'GET') {
      const sessionCode = url.searchParams.get('session') || req.headers['x-session'];
      const result = getCredits(sessionCode);
      return json(res, result.status, result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path === '/api/premium/analyser' && method === 'POST') {
      const body = await parseBody(req);
      const sessionCode = body.session || req.headers['x-session'];
      const result = analyser(sessionCode, body.question);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER, ...(result.data || {}) }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path === '/api/premium/lettre' && method === 'POST') {
      const body = await parseBody(req);
      const sessionCode = body.session || req.headers['x-session'];
      const result = genererLettre(sessionCode, body);
      return json(res, result.status, result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path === '/api/premium/ocr' && method === 'POST') {
      const body = await parseBody(req);
      const sessionCode = body.session || req.headers['x-session'];
      const result = ocrDocument(sessionCode);
      return json(res, result.status, result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- New AI-powered premium routes ---

    if (path === '/api/premium/analyze' && method === 'POST') {
      const body = await parseBody(req);
      const sessionCode = body.session || req.headers['x-session'];
      const result = await analyserAI(sessionCode, {
        ficheId: body.ficheId,
        userContext: body.userContext,
        question: body.question
      });
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER, ...(result.data || {}) }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path === '/api/premium/analyze-ocr' && method === 'POST') {
      // Accept raw body for file upload
      let buffer;
      try {
        buffer = await parseRawBody(req, MAX_UPLOAD_SIZE);
      } catch (err) {
        if (err.message === 'BODY_TOO_LARGE') {
          return json(res, 413, { error: 'Document trop volumineux (max 10MB)', disclaimer: DISCLAIMER });
        }
        throw err;
      }
      const sessionCode = req.headers['x-session'];
      const filename = req.headers['x-filename'] || 'document.pdf';
      const result = await ocrDocumentAI(sessionCode, buffer, filename);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path === '/api/premium/generate-letter' && method === 'POST') {
      const body = await parseBody(req);
      const sessionCode = body.session || req.headers['x-session'];
      const result = await genererLettreAI(sessionCode, {
        ficheId: body.ficheId,
        userContext: body.userContext,
        type: body.type
      });
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path === '/api/premium/estimate' && method === 'GET') {
      const action = url.searchParams.get('action');
      const ficheId = url.searchParams.get('ficheId');
      const result = estimerCout(action, { ficheId });
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path === '/api/premium/history' && method === 'GET') {
      const sessionCode = url.searchParams.get('session') || req.headers['x-session'];
      const result = getHistorique(sessionCode);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Statistiques routes ---

    if (path === '/api/statistiques' && method === 'GET') {
      const result = getAllStatistiques();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path.match(/^\/api\/statistiques\/([^/]+)$/) && method === 'GET') {
      const domaine = decodeURIComponent(path.match(/^\/api\/statistiques\/([^/]+)$/)[1]);
      const result = getStatistiquesByDomaine(domaine);
      return json(res, result.status, result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Calculateurs routes ---

    if (path === '/api/calculateurs' && method === 'GET') {
      const liste = Object.values(CALCULATEURS).map(({ id, nom, description, parametres }) => ({ id, nom, description, parametres }));
      return json(res, 200, { calculateurs: liste, disclaimer: DISCLAIMER });
    }

    if (path.match(/^\/api\/calculateurs\/([^/]+)$/) && method === 'POST') {
      const calcId = decodeURIComponent(path.match(/^\/api\/calculateurs\/([^/]+)$/)[1]);
      const calc = CALCULATEURS[calcId];
      if (!calc) return json(res, 404, { error: `Calculateur '${calcId}' non trouvé`, disclaimer: DISCLAIMER });
      const body = await parseBody(req);
      const result = calc.fn(body);
      if (result.erreur) return json(res, 400, { error: result.erreur, disclaimer: DISCLAIMER });
      return json(res, 200, { ...result, disclaimer: DISCLAIMER });
    }

    // --- Workflows routes ---

    if (path === '/api/workflows' && method === 'GET') {
      const liste = workflowsData.map(({ id, titre, description, dureeEstimee }) => ({ id, titre, description, dureeEstimee }));
      return json(res, 200, { workflows: liste, disclaimer: DISCLAIMER });
    }

    if (path.match(/^\/api\/workflows\/([^/]+)$/) && method === 'GET') {
      const wfId = decodeURIComponent(path.match(/^\/api\/workflows\/([^/]+)$/)[1]);
      const wf = workflowsData.find(w => w.id === wfId);
      if (!wf) return json(res, 404, { error: `Workflow '${wfId}' non trouvé`, disclaimer: DISCLAIMER });
      return json(res, 200, { workflow: wf, disclaimer: DISCLAIMER });
    }

    // --- Cascades routes ---

    if (path === '/api/cascades' && method === 'GET') {
      const liste = cascadesData.map(({ id, depart, prevention }) => ({ id, depart, prevention }));
      return json(res, 200, { cascades: liste, disclaimer: DISCLAIMER });
    }

    if (path.match(/^\/api\/cascades\/([^/]+)$/) && method === 'GET') {
      const cascId = decodeURIComponent(path.match(/^\/api\/cascades\/([^/]+)$/)[1]);
      const cascade = cascadesData.find(c => c.id === cascId);
      if (!cascade) return json(res, 404, { error: `Cascade '${cascId}' non trouvée`, disclaimer: DISCLAIMER });
      return json(res, 200, { cascade, disclaimer: DISCLAIMER });
    }

    // === KNOWLEDGE ENGINE — Moteur de décision traçable ===

    // === TRIAGE — Le produit principal ===

    if (path === '/api/triage' && method === 'POST') {
      const body = await parseBody(req);
      const result = await triage(body.texte, body.canton, body.sessionId, body.reponses);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data });
    }

    if (path === '/api/triage' && method === 'GET') {
      const q = url.searchParams.get('q');
      const canton = url.searchParams.get('canton');
      const result = await triage(q, canton);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data });
    }

    if (path === '/api/triage/refine' && method === 'POST') {
      const body = await parseBody(req);
      const result = await triage(null, null, body.sessionId, body.reponses);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data });
    }

    if (path === '/api/triage/cost' && method === 'GET') {
      const type = url.searchParams.get('type') || 'triage';
      const cost = estimateCost(type);
      return json(res, cost ? 200 : 404, cost
        ? { ...cost, disclaimer: DISCLAIMER }
        : { error: 'Type inconnu', disclaimer: DISCLAIMER });
    }

    // Recherche — LLM-first, keyword fallback
    if (path === '/api/search' && method === 'GET') {
      const q = url.searchParams.get('q');
      const canton = url.searchParams.get('canton');
      if (!q) return json(res, 400, { error: 'Paramètre q requis', disclaimer: DISCLAIMER });

      // V4 enrichment: add vulgarisation + normative compiler data
      function enrichV4(data) {
        if (!data || data.error) return data;
        const ficheId = data.fiche?.id;
        if (ficheId) {
          // Vulgarisation: citizen Q&As, anti-erreurs, deadlines from ASLOCA etc.
          const vulg = getVulgarisationForFiche(ficheId);
          if (vulg) data.vulgarisation = vulg;

          // Normative compiler: applicable rules for this domain
          const domaine = data.fiche?.domaine;
          if (domaine) {
            try {
              const compiled = compileNormative({ domaine });
              if (compiled.rules_applicable > 0) {
                data.normative_rules = compiled.results
                  .filter(r => r.applicable)
                  .map(r => ({ rule_id: r.rule_id, label: r.label, base_legale: r.base_legale, consequence_text: r.consequence?.text }));
              }
            } catch { /* normative compiler is optional */ }
          }
        }
        return data;
      }

      // LLM-first: use triage engine which calls LLM navigator
      const triageResult = await triage(q, canton);
      if (triageResult.status === 200 && triageResult.data?.trouve) {
        // LLM understood the query — enrich the primary fiche
        const ficheId = triageResult.data.ficheId;
        const enriched = queryByProblem(q, canton);
        // Merge LLM intelligence with enriched data
        return json(res, 200, enrichV4({
          ...(enriched.status === 200 ? enriched.data : {}),
          // Override with LLM-identified fiche if different
          llm_triage: {
            ficheId: triageResult.data.ficheId,
            domaine: triageResult.data.domaine,
            resume: triageResult.data.resumeSituation,
            confiance: triageResult.data.confiance,
            questions: triageResult.data.questionsManquantes,
            complet: triageResult.data.complet,
          },
          triage_method: 'llm',
          disclaimer: DISCLAIMER,
        }));
      }

      // Fallback: keyword search (degraded mode)
      const result = queryByProblem(q, canton);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : enrichV4({ ...result.data, triage_method: 'keyword_fallback', disclaimer: DISCLAIMER }));
    }

    // Citoyen: cherche par problème
    if (path === '/api/query/problem' && method === 'GET') {
      const q = url.searchParams.get('q');
      const canton = url.searchParams.get('canton');
      const result = queryByProblem(q, canton);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    // Avocat: cherche par article de loi
    if (path === '/api/query/article' && method === 'GET') {
      const ref = url.searchParams.get('ref');
      const result = queryByArticle(ref);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    // Juge: cherche par décision
    if (path === '/api/query/decision' && method === 'GET') {
      const sig = url.searchParams.get('signature');
      const result = queryByDecision(sig);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    // Association: cherche par domaine
    if (path === '/api/query/domain' && method === 'GET') {
      const domain = url.searchParams.get('domaine');
      const canton = url.searchParams.get('canton');
      const result = queryByDomain(domain, { canton });
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    // Enrichir une fiche avec TOUT le contexte
    if (path.match(/^\/api\/query\/fiche\/([^/]+)$/) && method === 'GET') {
      const ficheId = decodeURIComponent(path.match(/^\/api\/query\/fiche\/([^/]+)$/)[1]);
      const result = queryComplete(ficheId);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    // Tables des matières des codes
    if (path === '/api/tdm' && method === 'GET') {
      const code = url.searchParams.get('code');
      const result = getTableDesMatieres(code);
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data, disclaimer: DISCLAIMER });
    }

    // Plan d'action (le killer feature)
    if (path === '/api/action-plan' && method === 'GET') {
      const q = url.searchParams.get('q');
      const ficheId = url.searchParams.get('fiche');
      const canton = url.searchParams.get('canton');

      let enriched;
      if (ficheId) {
        const result = queryComplete(ficheId);
        if (result.error) return json(res, result.status, { error: result.error, disclaimer: DISCLAIMER });
        enriched = result.data;
      } else if (q) {
        const result = queryByProblem(q, canton);
        if (result.error) return json(res, result.status, { error: result.error, disclaimer: DISCLAIMER });
        enriched = result.data;
      } else {
        return json(res, 400, { error: 'Paramètre q ou fiche requis', disclaimer: DISCLAIMER });
      }

      const plan = generateActionPlan(enriched, canton);
      if (!plan) return json(res, 404, { error: 'Impossible de générer un plan', disclaimer: DISCLAIMER });
      return json(res, 200, { ...plan, disclaimer: DISCLAIMER });
    }

    // Dashboard complétude (admin)
    if (path === '/api/admin/completeness' && method === 'GET') {
      const result = getCompleteness();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Loi (articles) ---
    if (path === '/api/loi' && method === 'GET') {
      const query = url.searchParams.get('q');
      const result = query ? searchArticles(query) : getAllArticles();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Jurisprudence (arrêts) ---
    if (path === '/api/jurisprudence' && method === 'GET') {
      const query = url.searchParams.get('q');
      const result = query ? searchArrets(query) : getAllArrets();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Confiance ---
    if (path === '/api/confiance' && method === 'GET') {
      const result = getNiveauxConfiance();
      return json(res, result.status, result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Recevabilité ---
    if (path === '/api/recevabilite' && method === 'GET') {
      const result = getRecevabilite();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path.match(/^\/api\/recevabilite\/([^/]+)$/) && method === 'GET') {
      const proc = decodeURIComponent(path.match(/^\/api\/recevabilite\/([^/]+)$/)[1]);
      const result = getRecevabiliteByProcedure(proc);
      return json(res, result.status, result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Délais ---
    if (path === '/api/delais' && method === 'GET') {
      const domaine = url.searchParams.get('domaine');
      const result = domaine ? getDelaisByDomaine(domaine) : getDelais();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Preuves ---
    if (path === '/api/preuves' && method === 'GET') {
      const result = getPreuves();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Taxonomie ---
    if (path === '/api/taxonomie' && method === 'GET') {
      const query = url.searchParams.get('q');
      const result = query ? searchTaxonomie(query) : getTaxonomie();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Anti-erreurs ---
    if (path === '/api/anti-erreurs' && method === 'GET') {
      const domaine = url.searchParams.get('domaine');
      const result = domaine ? getAntiErreursByDomaine(domaine) : getAntiErreurs();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Patterns praticien ---
    if (path === '/api/patterns' && method === 'GET') {
      const domaine = url.searchParams.get('domaine');
      const result = domaine ? getPatternsByDomaine(domaine) : getPatterns();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Cas pratiques ---
    if (path === '/api/cas-pratiques' && method === 'GET') {
      const domaine = url.searchParams.get('domaine');
      const result = domaine ? getCasByDomaine(domaine) : getCasPratiques();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Escalade (réseau relais) ---
    if (path === '/api/escalade' && method === 'GET') {
      const domaine = url.searchParams.get('domaine');
      const result = domaine ? getEscaladeByDomaine(domaine) : getEscalade();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Annuaire complet ---
    if (path === '/api/annuaire' && method === 'GET') {
      const canton = url.searchParams.get('canton');
      const result = canton ? getAnnuaireByCanton(canton) : getAnnuaireComplet();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Cantons ---
    if (path === '/api/cantons' && method === 'GET') {
      const result = getCantons();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path.match(/^\/api\/cantons\/([^/]+)$/) && method === 'GET') {
      const code = path.match(/^\/api\/cantons\/([^/]+)$/)[1];
      const result = getCantonByCode(code);
      return json(res, result.status, result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Coûts ---
    if (path === '/api/couts' && method === 'GET') {
      const result = getCouts();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Templates ---
    if (path === '/api/templates' && method === 'GET') {
      const result = getTemplates();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    if (path.match(/^\/api\/templates\/([^/]+)$/) && method === 'GET') {
      const id = decodeURIComponent(path.match(/^\/api\/templates\/([^/]+)$/)[1]);
      const result = getTemplateById(id);
      return json(res, result.status, result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER });
    }

    // --- Couverture (meta) ---
    if (path === '/api/couverture' && method === 'GET') {
      const result = getCouverture();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // === SOURCE REGISTRY ===

    if (path === '/api/sources/stats' && method === 'GET') {
      return json(res, 200, { ...getRegistryStats(), disclaimer: DISCLAIMER });
    }

    if (path === '/api/sources/tier' && method === 'GET') {
      const tier = parseInt(url.searchParams.get('tier'));
      if (!tier || tier < 1 || tier > 3) return json(res, 400, { error: 'tier requis (1, 2 ou 3)', disclaimer: DISCLAIMER });
      const sources = getSourcesByTier(tier);
      return json(res, 200, { tier, count: sources.length, sources: sources.slice(0, 100), disclaimer: DISCLAIMER });
    }

    if (path === '/api/sources/domain' && method === 'GET') {
      const domaine = url.searchParams.get('domaine');
      if (!domaine) return json(res, 400, { error: 'domaine requis', disclaimer: DISCLAIMER });
      const sources = getSourcesByDomain(domaine);
      return json(res, 200, { domaine, count: sources.length, sources, disclaimer: DISCLAIMER });
    }

    if (path.match(/^\/api\/sources\/([^/]+)$/) && method === 'GET') {
      const sourceId = decodeURIComponent(path.match(/^\/api\/sources\/([^/]+)$/)[1]);
      const source = getSourceById(sourceId);
      if (!source) return json(res, 404, { error: `Source '${sourceId}' non trouvée`, disclaimer: DISCLAIMER });
      return json(res, 200, { ...source, disclaimer: DISCLAIMER });
    }

    if (path === '/api/sources/validate' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.source_ids || !Array.isArray(body.source_ids)) {
        return json(res, 400, { error: 'source_ids (array) requis', disclaimer: DISCLAIMER });
      }
      const result = validateClaimSources(body.source_ids);
      return json(res, 200, { ...result, disclaimer: DISCLAIMER });
    }

    // === OBJECT REGISTRY (Constitution frozen objects) ===

    if (path === '/api/objects/stats' && method === 'GET') {
      return json(res, 200, { ...getObjectStats(), disclaimer: DISCLAIMER });
    }

    if (path === '/api/objects/types' && method === 'GET') {
      const type = url.searchParams.get('type');
      if (!type) return json(res, 400, { error: 'type requis (norm_fragment, decision_holding, ...)', disclaimer: DISCLAIMER });
      const objects = getObjectsByType(type);
      return json(res, 200, { type, count: objects.length, objects: objects.slice(0, 100), disclaimer: DISCLAIMER });
    }

    if (path === '/api/objects/domain' && method === 'GET') {
      const type = url.searchParams.get('type');
      const domaine = url.searchParams.get('domaine');
      if (!type || !domaine) return json(res, 400, { error: 'type et domaine requis', disclaimer: DISCLAIMER });
      const objects = getObjectsByDomain(type, domaine);
      return json(res, 200, { type, domaine, count: objects.length, objects, disclaimer: DISCLAIMER });
    }

    if (path === '/api/objects/dossier' && method === 'GET') {
      const domaine = url.searchParams.get('domaine');
      if (!domaine) return json(res, 400, { error: 'domaine requis', disclaimer: DISCLAIMER });
      const dossier = getDossierObjects(domaine);
      const counts = {};
      for (const [k, v] of Object.entries(dossier)) counts[k] = v.length;
      return json(res, 200, { domaine, counts, dossier, disclaimer: DISCLAIMER });
    }

    if (path === '/api/objects/claim-schema' && method === 'GET') {
      return json(res, 200, { ...VERIFIED_CLAIM_SCHEMA, disclaimer: DISCLAIMER });
    }

    // === COVERAGE CERTIFICATE & EVAL ===

    if (path === '/api/certificate/checklist' && method === 'GET') {
      return json(res, 200, { checklist: getChecklistDefinition(), disclaimer: DISCLAIMER });
    }

    if (path === '/api/eval/golden-cases' && method === 'GET') {
      return json(res, 200, {
        cases: GOLDEN_CASES.map(gc => ({ id: gc.id, domaine: gc.domaine, description: gc.description, query: gc.query })),
        rubrics: RUBRICS.map(r => ({ id: r.id, label: r.label, weight: r.weight })),
        total: GOLDEN_CASES.length,
        disclaimer: DISCLAIMER
      });
    }

    // === DEEP ANALYSIS (multi-tour, qualité max) ===

    if (path === '/api/deep-analysis' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.texte) return json(res, 400, { error: 'texte requis', disclaimer: DISCLAIMER });
      try {
        const result = await deepAnalysis(body.texte, body.canton, body.reponses);
        return json(res, 200, { ...result, disclaimer: DISCLAIMER });
      } catch (err) {
        return json(res, 503, { error: 'Analyse indisponible: ' + err.message, disclaimer: DISCLAIMER });
      }
    }

    // === NORMATIVE COMPILER ===

    if (path === '/api/compiler/rules' && method === 'GET') {
      return json(res, 200, { rules: getRuleDefinitions(), total: getRuleDefinitions().length, disclaimer: DISCLAIMER });
    }

    if (path === '/api/compiler/execute' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.facts) return json(res, 400, { error: 'facts requis', disclaimer: DISCLAIMER });
      const result = compileNormative(body.facts);
      return json(res, 200, { ...result, disclaimer: DISCLAIMER });
    }

    // === BARÈMES & RÉFÉRENCES ===

    if (path === '/api/baremes' && method === 'GET') {
      const { readFileSync } = await import('node:fs');
      const { join } = await import('node:path');
      try {
        const baremes = JSON.parse(readFileSync(join(__dirname, 'data', 'baremes', 'references-nationales.json'), 'utf-8'));
        return json(res, 200, { ...baremes, disclaimer: DISCLAIMER });
      } catch {
        return json(res, 404, { error: 'Barèmes non disponibles', disclaimer: DISCLAIMER });
      }
    }

    if (path === '/api/baremes/taux-hypothecaire' && method === 'GET') {
      const { readFileSync } = await import('node:fs');
      const { join } = await import('node:path');
      try {
        const baremes = JSON.parse(readFileSync(join(__dirname, 'data', 'baremes', 'references-nationales.json'), 'utf-8'));
        return json(res, 200, { ...baremes.taux_hypothecaire_reference, disclaimer: DISCLAIMER });
      } catch {
        return json(res, 404, { error: 'Taux non disponible', disclaimer: DISCLAIMER });
      }
    }

    // === SOURCE FRONTIER ===

    if (path === '/api/frontier/analysis' && method === 'GET') {
      return json(res, 200, { ...analyzeFrontier(), disclaimer: DISCLAIMER });
    }

    if (path === '/api/frontier/priorities' && method === 'GET') {
      const n = parseInt(url.searchParams.get('n')) || 10;
      const priorities = getNextIngestionPriorities(n);
      return json(res, 200, { count: priorities.length, priorities, disclaimer: DISCLAIMER });
    }

    if (path === '/api/frontier/catalog' && method === 'GET') {
      const catalog = getSourceCatalog();
      return json(res, 200, { count: catalog.length, sources: catalog, disclaimer: DISCLAIMER });
    }

    // === PREMIUM V3 — Analyse contradictoire ===

    if (path === '/api/premium/analyze-v3' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.texte) return json(res, 400, { error: 'texte requis', disclaimer: DISCLAIMER });

      // Scope V1: bail, travail, dettes uniquement
      const SUPPORTED_V3 = ['bail', 'travail', 'dettes'];

      try {
        const result = await analyserCas(body.texte, body.canton, body.reponses);
        if (!result) {
          return json(res, 503, { error: 'Service IA indisponible', verification_status: 'insufficient', disclaimer: DISCLAIMER });
        }

        // Mode crise
        if (result.mode_crise) {
          return json(res, 200, {
            mode_crise: true,
            resume: result.resume,
            verification_status: 'not_applicable',
            disclaimer: DISCLAIMER
          });
        }

        // Check scope
        const domaines = result.dossier_summary?.domaines || [];
        const outOfScope = domaines.filter(d => !SUPPORTED_V3.includes(d));

        // Determine verification status
        let verification_status = 'verified';
        if (!result.analysis) verification_status = 'degraded';
        else if (!result.analysis.claims?.length) verification_status = 'insufficient';

        return json(res, 200, {
          mode_crise: false,
          complet: result.complet,
          verification_status,
          scope_warning: outOfScope.length > 0 ? `Domaines hors perimetre V1: ${outOfScope.join(', ')}. Analyse partielle.` : null,
          resume: result.resume,
          questions: result.questions,
          issues: result.comprehension?.issues,
          claims: result.analysis?.claims || [],
          objections_summary: result.analysis?.objections || [],
          next_actions: result.analysis?.plan_action || null,
          critical_deadlines: result.compiled?.delais_critiques || [],
          documents_required: result.compiled?.documents_requis || [],
          fatal_errors: result.compiled?.erreurs_fatales || [],
          contacts: result.compiled?.contacts || [],
          amount_range: result.compiled?.fourchette_montant || null,
          unknowns: result.analysis?.ce_quon_ne_sait_pas || [],
          need_lawyer: result.analysis?.besoin_avocat || false,
          need_lawyer_reason: result.analysis?.besoin_avocat_raison || null,
          sources_count: result.dossier_summary?.sources_count || 0,
          usage: result.usage,
          disclaimer: DISCLAIMER
        });
      } catch (err) {
        console.error('V3 analysis error:', err.message);
        return json(res, 500, { error: 'Erreur analyse', verification_status: 'insufficient', disclaimer: DISCLAIMER });
      }
    }

    if (path === '/api/premium/analyze-v3/refine' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.texte || !body.reponses) {
        return json(res, 400, { error: 'texte et reponses requis', disclaimer: DISCLAIMER });
      }
      // Re-run with answers
      try {
        const result = await analyserCas(body.texte, body.canton, body.reponses);
        if (!result) return json(res, 503, { error: 'Service IA indisponible', disclaimer: DISCLAIMER });

        let verification_status = 'verified';
        if (!result.analysis) verification_status = 'degraded';

        return json(res, 200, {
          complet: true,
          verification_status,
          resume: result.resume,
          questions: [],
          claims: result.analysis?.claims || [],
          next_actions: result.analysis?.plan_action || null,
          critical_deadlines: result.compiled?.delais_critiques || [],
          documents_required: result.compiled?.documents_requis || [],
          fatal_errors: result.compiled?.erreurs_fatales || [],
          contacts: result.compiled?.contacts || [],
          unknowns: result.analysis?.ce_quon_ne_sait_pas || [],
          need_lawyer: result.analysis?.besoin_avocat || false,
          usage: result.usage,
          disclaimer: DISCLAIMER
        });
      } catch (err) {
        return json(res, 500, { error: 'Erreur analyse', verification_status: 'insufficient', disclaimer: DISCLAIMER });
      }
    }

    if (path === '/api/premium/estimate' && method === 'GET') {
      const action = url.searchParams.get('action');
      if (action === 'analyze_v3') {
        return json(res, 200, {
          action: 'analyze_v3',
          description: 'Analyse contradictoire verifiee — dossier complet avec claims, objections, plan action',
          cost_min_chf: 5,
          cost_max_chf: 10,
          cost_api_estimate_chf: 0.50,
          includes: ['Qualification juridique', 'Dossier avec articles + jurisprudence', 'Verification multi-modele', 'Plan action + delais + contacts', 'Erreurs a eviter'],
          scope: 'bail, travail, dettes (V1)',
          disclaimer: DISCLAIMER
        });
      }
      // Fall through to existing estimate handler
    }

    // --- Feedback ---

    if (path === '/api/feedback' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.ficheId || !body.rating) {
        return json(res, 400, { error: 'ficheId et rating requis', disclaimer: DISCLAIMER });
      }
      if (!['oui', 'non', 'partiel'].includes(body.rating)) {
        return json(res, 400, { error: 'rating: oui, non, ou partiel', disclaimer: DISCLAIMER });
      }
      feedbackStore.push({
        ficheId: body.ficheId,
        rating: body.rating,
        comment: body.comment || null,
        timestamp: new Date().toISOString()
      });
      return json(res, 200, { ok: true, disclaimer: DISCLAIMER });
    }

    if (path === '/api/admin/feedback' && method === 'GET') {
      const stats = { oui: 0, non: 0, partiel: 0, total: feedbackStore.length };
      for (const f of feedbackStore) stats[f.rating]++;
      return json(res, 200, { stats, recent: feedbackStore.slice(-20), disclaimer: DISCLAIMER });
    }

    // Static files
    if (path === '/' || path === '/index.html') {
      return serveStatic(req, res, join(publicDir, 'index.html'));
    }

    const staticPath = join(publicDir, path);
    if (existsSync(staticPath) && !staticPath.includes('..')) {
      return serveStatic(req, res, staticPath);
    }

    // 404
    json(res, 404, { error: 'Route non trouvee', disclaimer: DISCLAIMER });
  } catch (err) {
    json(res, 500, { error: 'Erreur interne', disclaimer: DISCLAIMER });
  }
});

const PORT = process.env.PORT || 3000;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(PORT, () => {
    console.log(`JusticePourtous running on http://localhost:${PORT}`);
  });
}

export { server };
export default server;
