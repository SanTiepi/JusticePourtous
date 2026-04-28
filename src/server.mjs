import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { atomicWriteSync, safeLoadJSON } from './services/atomic-write.mjs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

import { createLogger } from './services/logger.mjs';
import { validateEnv } from './services/env-check.mjs';
import { recordHttp, snapshot as metricsSnapshot } from './services/metrics.mjs';
const log = createLogger('server');

// ─── HTTP helpers (extracted to reduce server.mjs size) ─────────
import {
  json, parseBody, parseRawBody, serveStatic as serveStaticFile,
  setSecurityHeaders, sanitizeUserInput, rateLimit, rateLimitFor, logTriage, getTriageLog,
  checkAdmin, getFeedbackStore,
  MAX_UPLOAD_SIZE, MAX_QUERY_LENGTH, MAX_BODY_SIZE
} from './lib/http-helpers.mjs';

// ─── Service imports ────────────────────────────────────────────
import { getAllFiches, getFicheById } from './services/fiches.mjs';
import { consulter, getQuestionsForDomaine } from './services/consultation.mjs';
import { getServicesByCanton } from './services/annuaire.mjs';
import {
  acheterWallet, getCredits, debitSession, creditSession, analyser, genererLettre, ocrDocument,
  analyserAI, ocrDocumentAI, genererLettreAI, estimerCout, getHistorique
} from './services/premium.mjs';
import { getAllStatistiques, getStatistiquesByDomaine } from './services/statistiques.mjs';
import { CALCULATEURS } from './services/calculateurs.mjs';
import {
  queryByProblem, queryByArticle, queryByDecision,
  queryByDomain, queryComplete, getTableDesMatieres, getCompleteness,
  generateSuggestedQuestions
} from './services/knowledge-engine.mjs';
import { generateActionPlan } from './services/action-planner.mjs';
import { triage, estimateCost } from './services/triage-engine.mjs';
import { handleTriageStart, handleTriageNext } from './services/triage-orchestration.mjs';
import { buildEscalationPack } from './services/escalation-pack.mjs';
import { getCase, startCompactionLoop, stopCompactionLoop, _flushCases } from './services/case-store.mjs';
import {
  createAccount, verifyMagicToken, getAccount, linkCaseToAccount,
  getUpcomingDeadlines, closeAccount
} from './services/citizen-account.mjs';
import { generateLetterPDF } from './services/letter-pdf-generator.mjs';
import { recordOutcome, recordSimpleOutcome, getAggregateStats as getOutcomesAggregateStats } from './services/outcomes-tracker.mjs';
import { extractDeadlinesFromCase, scheduleReminders, listRemindersForCase, _listRemindersForTests, maskAccountId } from './services/deadline-reminders.mjs';
import { computeDashboardMetrics } from './services/dashboard-metrics.mjs';
import { analyserCas } from './services/pipeline-v3.mjs';
import { getRegistryStats, getSourceById, getSourcesByDomain, getSourcesByTier, validateClaimSources } from './services/source-registry.mjs';
import { getObjectStats, getObjectsByType, getObjectById, getObjectsByDomain, getDossierObjects, VERIFIED_CLAIM_SCHEMA } from './services/object-registry.mjs';
import { getChecklistDefinition } from './services/coverage-certificate.mjs';
import { GOLDEN_CASES, RUBRICS } from './services/eval-harness.mjs';
import { analyzeIssue } from './services/argumentation-engine.mjs';
import { analyzeFrontier, getNextIngestionPriorities, getSourceCatalog } from './services/source-frontier.mjs';
import { compile as compileNormative, getRuleDefinitions } from './services/normative-compiler.mjs';
import { deepAnalysis } from './services/deep-analysis.mjs';
import { generateDocx } from './services/docx-generator.mjs';
import { sendCode, verifyCode, linkWalletToEmail, getWalletsByEmail } from './services/auth.mjs';
import { getVulgarisationForFiche, getVulgarisationStats } from './services/vulgarisation-loader.mjs';
import { trackPageView, trackSearch, trackPremiumAnalysis, trackLanguage, getStats as getAnalyticsStats } from './services/analytics.mjs';
import { translateStructuredContent, translateTextContent, TRANSLATION_PIPELINE_VERSION } from './services/i18n/translation-orchestrator.mjs';
import { resolveRequestLocale } from './services/i18n/http-locale.mjs';
import { normalizeLocale, DEFAULT_LOCALE, isOfferedLocale } from './services/i18n/locale-registry.mjs';
import { renderGuideForLocale } from './services/guide-renderer.mjs';
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

const DISCLAIMER = "JusticePourtous fournit des informations juridiques générales basées sur le droit suisse en vigueur. Il ne remplace pas un conseil d'avocat personnalisé. Les informations sont données à titre indicatif et sans garantie d'exhaustivité. En cas de doute, consultez un professionnel du droit ou contactez les services listés.";

// Aliases: feedbackStore and triageLog now live in http-helpers.mjs
const feedbackStore = getFeedbackStore();

// Local wrapper: serveStatic needs publicDir
function serveStatic(req, res, filePath) {
  serveStaticFile(req, res, filePath, publicDir);
}

function pickDomainHint(payload) {
  return payload?.domaine
    || payload?.fiche?.domaine
    || payload?.workflow?.depart
    || payload?.analysis?.domaine
    || null;
}

function pickLastVerifiedHint(payload) {
  return payload?.last_verified_at
    || payload?.fiche?.last_verified_at
    || payload?.resume_expires_at_iso
    || null;
}

// Bulletproof : un appel à maybeTranslatePayload ne doit JAMAIS faire 5xx un endpoint.
// Si translateStructuredContent (qui catch déjà ses translateNode internes) échoue
// au niveau cache/buildKey/withMeta, on renvoie le payload source intact avec un
// translation_status: 'failed_internal' pour signaler la dégradation au caller.
async function maybeTranslatePayload(req, url, body, payload, options = {}) {
  const lang = normalizeLocale(resolveRequestLocale(req, url, body));
  try {
    return await translateStructuredContent(payload, {
      targetLang: lang,
      sourceLang: DEFAULT_LOCALE,
      contentType: options.contentType || 'structured_legal_content',
      domain: options.domain || pickDomainHint(payload),
      sourceLastVerified: options.sourceLastVerified || pickLastVerifiedHint(payload)
    });
  } catch (err) {
    log.warn('translate_payload_failed_fallback_source', { lang, err: err.message });
    return {
      ...payload,
      display_lang: lang,
      source_lang: DEFAULT_LOCALE,
      translation_status: 'failed_internal',
      translation_error: err.message
    };
  }
}

async function maybeTranslateText(req, url, body, text, options = {}) {
  const lang = normalizeLocale(resolveRequestLocale(req, url, body));
  try {
    return await translateTextContent(text, {
      targetLang: lang,
      sourceLang: DEFAULT_LOCALE,
      contentType: options.contentType || 'text',
      domain: options.domain || null,
      sourceLastVerified: options.sourceLastVerified || null
    });
  } catch (err) {
    log.warn('translate_text_failed_fallback_source', { lang, err: err.message });
    return {
      translated: text,
      display_lang: lang,
      source_lang: DEFAULT_LOCALE,
      translation_status: 'failed_internal',
      translation_error: err.message
    };
  }
}

function limitItems(list, limit) {
  return Array.isArray(list) ? list.slice(0, limit) : [];
}

function truncateText(value, maxLength = 800) {
  if (typeof value !== 'string') return value;
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}…`;
}

function pickSearchJurisprudence(list) {
  if (!Array.isArray(list) || !list.length) return [];
  const favorable = list.filter((item) => item?.role === 'favorable').slice(0, 3);
  const defavorable = list.filter((item) => item?.role === 'defavorable').slice(0, 2);
  const neutre = list.filter((item) => !item?.role || item.role === 'neutre').slice(0, 2);
  const picked = [...favorable, ...defavorable, ...neutre];
  if (picked.length) return picked;
  return list.slice(0, 5);
}

function shapeSearchPayload(payload) {
  if (!payload || typeof payload !== 'object' || payload.type === 'taxonomie' || payload.type === 'unclear') {
    return payload;
  }

  const fiche = payload.fiche || {};
  const reponse = fiche.reponse || {};
  const vulgarisation = payload.vulgarisation || null;
  const canon = payload.caselaw_canon || null;
  const articles = Array.isArray(payload.articles) ? payload.articles : [];
  const jurisprudence = Array.isArray(payload.jurisprudence) ? payload.jurisprudence : [];
  const templates = Array.isArray(payload.templates) ? payload.templates : [];
  const delais = Array.isArray(payload.delais) ? payload.delais : [];
  const antiErreurs = Array.isArray(payload.antiErreurs) ? payload.antiErreurs : [];
  const escalade = Array.isArray(payload.escalade) ? payload.escalade : [];
  const suggestions = Array.isArray(payload.suggested_questions) ? payload.suggested_questions : [];
  const normativeRules = Array.isArray(payload.normative_rules) ? payload.normative_rules : [];

  return {
    fiche: {
      id: fiche.id,
      domaine: fiche.domaine,
      sousDomaine: fiche.sousDomaine,
      tags: limitItems(fiche.tags, 10),
      confiance: fiche.confiance,
      description: fiche.description,
      last_verified_at: fiche.last_verified_at,
      freshness: fiche.freshness,
      review_scope: fiche.review_scope,
      review_expiry: fiche.review_expiry,
      reponse: {
        explication: reponse.explication || '',
        actions: limitItems(reponse.actions, 5)
      }
    },
    confiance: payload.confiance,
    lacunes: limitItems(payload.lacunes, 6),
    articles: limitItems(articles, 5),
    delais: limitItems(delais, 5),
    antiErreurs: limitItems(antiErreurs, 4),
    escalade: limitItems(escalade, 5),
    templates: limitItems(templates, 3).map((template) => ({
      ...template,
      contenu: truncateText(template?.contenu, 800),
      template: truncateText(template?.template, 800),
      texte: truncateText(template?.texte, 800)
    })),
    jurisprudence: pickSearchJurisprudence(jurisprudence),
    caselaw_canon: canon ? {
      leading_cases: limitItems(canon.leading_cases, 3),
      nuances: limitItems(canon.nuances, 2),
      cantonal_practice: limitItems(canon.cantonal_practice, 3),
      similar_cases: limitItems(canon.similar_cases, 10)
    } : null,
    vulgarisation: vulgarisation ? {
      questions_citoyennes: limitItems(vulgarisation.questions_citoyennes, 5),
      anti_erreurs: limitItems(vulgarisation.anti_erreurs, 4),
      delais: limitItems(vulgarisation.delais, 5)
    } : null,
    normative_rules: limitItems(normativeRules, 5),
    suggested_questions: limitItems(suggestions, 5),
    alternatives: limitItems(payload.alternatives || payload.related, 5),
    llm_triage: payload.llm_triage ? {
      ficheId: payload.llm_triage.ficheId,
      domaine: payload.llm_triage.domaine,
      resume: payload.llm_triage.resume,
      confiance: payload.llm_triage.confiance,
      questions: limitItems(payload.llm_triage.questions, 5),
      complet: payload.llm_triage.complet
    } : null,
    triage_method: payload.triage_method,
    disclaimer: payload.disclaimer,
    _meta: {
      ...(payload._meta || {}),
      articlesCount: payload._meta?.articlesCount || articles.length,
      jurisprudenceCount: payload._meta?.jurisprudenceCount || jurisprudence.length,
      templatesCount: payload._meta?.templatesCount || templates.length,
      escaladeCount: payload._meta?.escaladeCount || escalade.length
    }
  };
}

// ─── Stripe (optional — graceful if no keys) ───────────────────
let stripe = null;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
const SITE_URL = process.env.SITE_URL || 'https://justicepourtous.ch';

// ─── Stripe session map (persisted to avoid double wallet creation on restart) ──
const STRIPE_MAP_FILE = join(__dirname, 'data', 'meta', 'stripe-sessions.json');
const stripeSessionMap = new Map(); // stripeSessionId → walletSessionCode

// Load persisted stripe sessions
{
  const data = safeLoadJSON(STRIPE_MAP_FILE);
  if (Array.isArray(data)) {
    for (const [k, v] of data) stripeSessionMap.set(k, v);
  }
}

let stripeMapSaveTimer = null;
function persistStripeSessionMap() {
  if (stripeMapSaveTimer) return;
  stripeMapSaveTimer = setTimeout(() => {
    stripeMapSaveTimer = null;
    try {
      const entries = [...stripeSessionMap];
      const trimmed = entries.slice(-1000);
      atomicWriteSync(STRIPE_MAP_FILE, JSON.stringify(trimmed, null, 2));
    } catch (err) {
      log.error('stripe_persist_failed', { err: err.message });
    }
  }, 2000);
}

const STRIPE_ACCOUNT = process.env.STRIPE_ACCOUNT_ID;

if (STRIPE_SECRET) {
  const Stripe = (await import('stripe')).default;
  const stripeOpts = {};
  if (STRIPE_ACCOUNT) stripeOpts.stripeAccount = STRIPE_ACCOUNT;
  stripe = new Stripe(STRIPE_SECRET, stripeOpts);
  log.info('stripe_enabled', { mode: 'card', account: STRIPE_ACCOUNT || null });
} else {
  log.info('stripe_demo_mode');
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // Request ID for correlation — honor upstream X-Request-Id, else generate.
  const reqId = req.headers['x-request-id']
    ? String(req.headers['x-request-id']).slice(0, 64)
    : Math.random().toString(36).slice(2, 10);
  req.reqId = reqId;
  res.setHeader('X-Request-Id', reqId);

  // Request logging for API routes
  const reqStart = Date.now();
  if (path.startsWith('/api/')) {
    const origEnd = res.end.bind(res);
    res.end = function(...args) {
      const duration = Date.now() - reqStart;
      const search = url.search || '';
      log.info('http_request', { req_id: reqId, method, path: path + search, status: res.statusCode, duration_ms: duration });
      recordHttp({ path, status: res.statusCode, duration_ms: duration });
      return origEnd(...args);
    };
  }

  try {
    // Rate limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    // Differentiated rate-limit per bucket (premium_llm, letter_generation,
    // validation_heavy). Le bucket 'default' reprend la limite historique 60/min.
    if (path.startsWith('/api/')) {
      const rl = rateLimitFor(path, clientIp);
      if (!rl.allowed) {
        res.setHeader('Retry-After', String(rl.retry_after_seconds || 60));
        return json(res, 429, {
          error: 'Trop de requêtes. Réessayez dans une minute.',
          bucket: rl.bucket,
          retry_after_seconds: rl.retry_after_seconds || 60,
          disclaimer: DISCLAIMER
        });
      }
    }

    // Input length validation for query params
    const q = url.searchParams.get('q');
    if (q && q.length > MAX_QUERY_LENGTH) {
      return json(res, 400, { error: `Requête trop longue (max ${MAX_QUERY_LENGTH} caractères)`, disclaimer: DISCLAIMER });
    }

    // ─── Stripe routes (must be before parseBody for webhook) ───
    if (path === '/api/stripe/webhook' && method === 'POST' && stripe) {
      try {
        const rawBody = await parseRawBody(req, MAX_BODY_SIZE);
        const sig = req.headers['stripe-signature'];

        let event;
        if (STRIPE_WEBHOOK_SECRET && sig) {
          try {
            event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
          } catch (sigErr) {
            // Signature failed — verify via Stripe API instead of accepting blindly
            log.warn('stripe_webhook_sig_failed', { sig_err_type: sigErr.type || 'unknown' });
            const payload = JSON.parse(rawBody.toString());
            if (payload.id && payload.type) {
              try {
                // Verify the event exists in Stripe (prevents forgery)
                const verified = await stripe.events.retrieve(payload.id);
                event = verified;
                log.info('stripe_webhook_api_fallback_ok', { event_id: payload.id });
              } catch {
                throw new Error('Event verification failed');
              }
            } else {
              throw new Error('Invalid webhook payload');
            }
          }
        } else if (!STRIPE_WEBHOOK_SECRET) {
          // No webhook secret configured — reject in production
          throw new Error('Webhook secret not configured');
        } else {
          throw new Error('Missing stripe-signature header');
        }

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          // Idempotence: check if wallet was already created (by polling or previous webhook)
          if (stripeSessionMap.has(session.id)) {
            log.debug('stripe_webhook_skipped', { session_id: session.id, reason: 'wallet_exists' });
          } else {
            const montant = parseInt(session.metadata?.montant_centimes || '1000', 10);
            const result = acheterWallet(montant);
            if (result.data?.sessionCode) {
              stripeSessionMap.set(session.id, result.data.sessionCode);
              persistStripeSessionMap();
              const customerEmail = session.customer_details?.email || session.customer_email;
              if (customerEmail) linkWalletToEmail(customerEmail, result.data.sessionCode);
              log.info('wallet_created', { source: 'webhook', session_id: session.id, has_email: !!customerEmail });
            }
          }
        }
        return json(res, 200, { received: true });
      } catch (err) {
        log.error('stripe_webhook_error', { err: err.message });
        return json(res, 400, { error: 'Webhook error' });
      }
    }

    if (path === '/api/stripe/create-checkout-session' && method === 'POST' && stripe) {
      const body = await parseBody(req);
      const montant = body.montant;
      const ALLOWED = [500, 1000, 2000];
      if (!ALLOWED.includes(montant)) return json(res, 400, { error: 'Montant invalide' });

      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          currency: 'chf',
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'chf',
              unit_amount: montant,
              product_data: {
                name: `JusticePourtous — Crédits CHF ${(montant / 100).toFixed(0)}`,
                description: 'Crédits pour analyses juridiques premium',
              },
            },
            quantity: 1,
          }],
          metadata: { montant_centimes: String(montant) },
          success_url: `${SITE_URL}/premium.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${SITE_URL}/premium.html?payment=cancelled`,
        });
        return json(res, 200, { url: session.url });
      } catch (err) {
        log.error('stripe_session_error', { err: err.message });
        return json(res, 500, { error: 'Erreur paiement' });
      }
    }

    if (path === '/api/stripe/session-status' && method === 'GET') {
      const sessionId = url.searchParams.get('session_id');

      // Check if we already created the wallet (from webhook or previous poll)
      const existingWallet = stripeSessionMap.get(sessionId);
      if (existingWallet) {
        return json(res, 200, { sessionCode: existingWallet, ready: true });
      }

      // Webhook hasn't arrived yet — check Stripe directly
      if (stripe && sessionId) {
        try {
          const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
          if (stripeSession.payment_status === 'paid') {
            // Payment confirmed — create wallet now
            const montant = parseInt(stripeSession.metadata?.montant_centimes || '1000', 10);
            const result = acheterWallet(montant);
            if (result.data?.sessionCode) {
              stripeSessionMap.set(sessionId, result.data.sessionCode);
              persistStripeSessionMap();
              // Link email to wallet if available
              const customerEmail = stripeSession.customer_details?.email || stripeSession.customer_email;
              if (customerEmail) {
                linkWalletToEmail(customerEmail, result.data.sessionCode);
              }
              log.info('wallet_created', { source: 'direct_check', session_id: sessionId, amount_chf: montant / 100, has_email: !!customerEmail });
              return json(res, 200, { sessionCode: result.data.sessionCode, ready: true });
            }
          }
        } catch (err) {
          log.warn('stripe_session_check_error', { err: err.message });
        }
      }

      return json(res, 200, { ready: false, pending: true });
    }

    // ─── Auth routes ─────────────────────────────────────────────
    if (path === '/api/auth/send-code' && method === 'POST') {
      const body = await parseBody(req);
      const result = await sendCode(body.email);
      return json(res, result.status, result.error ? { error: result.error } : result.data);
    }

    if (path === '/api/auth/verify-code' && method === 'POST') {
      const body = await parseBody(req);
      const result = verifyCode(body.email, body.code);
      return json(res, result.status, result.error ? { error: result.error } : result.data);
    }

    // REMOVED: /api/auth/wallets — was leaking sessionCodes to anyone who knows an email.
    // Wallets are now returned ONLY via /api/auth/verify-code after successful code verification.
    if (path === '/api/auth/wallets' && method === 'POST') {
      return json(res, 410, { error: 'Endpoint supprimé. Utilisez /api/auth/verify-code pour récupérer vos wallets.' });
    }

    if (path === '/api/stripe/config' && method === 'GET') {
      return json(res, 200, {
        enabled: !!stripe,
        publishableKey: STRIPE_PUBLIC_KEY || null,
      });
    }

    // API routes
    if (path === '/api/health' && method === 'GET') {
      return json(res, 200, { status: 'ok', timestamp: new Date().toISOString(), disclaimer: DISCLAIMER });
    }

    // Health check approfondi (10 modules critiques)
    // Retourne 200 si `ok`, 200 si `degraded`, 503 si `failing`.
    if (path === '/api/health/deep' && method === 'GET') {
      try {
        const { runHealthChecks } = await import('./services/health-check.mjs');
        const report = await runHealthChecks();
        const httpStatus = report.global_status === 'failing' ? 503 : 200;
        return json(res, httpStatus, { ...report, disclaimer: DISCLAIMER });
      } catch (err) {
        return json(res, 503, { global_status: 'failing', error: err.message, disclaimer: DISCLAIMER });
      }
    }

    // Triage audit log endpoint
    if (path === '/api/admin/triage-log' && method === 'GET') {
      if (!checkAdmin(req, res)) return;
      const triageLog = getTriageLog();
      return json(res, 200, { entries: triageLog.slice(-50), total: triageLog.length });
    }

    if (path === '/api/domaines' && method === 'GET') {
      const payload = await maybeTranslatePayload(req, url, null, { domaines: domainesData, disclaimer: DISCLAIMER }, { contentType: 'chrome/ui' });
      return json(res, 200, payload);
    }

    if (path.match(/^\/api\/domaines\/([^/]+)\/questions$/) && method === 'GET') {
      const domaineId = path.match(/^\/api\/domaines\/([^/]+)\/questions$/)[1];
      const result = getQuestionsForDomaine(domaineId);
      const payload = result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER };
      return json(res, result.status, await maybeTranslatePayload(req, url, null, payload, { contentType: 'structured_legal_content', domain: domaineId }));
    }

    if (path === '/api/consulter' && method === 'POST') {
      const body = await parseBody(req);
      const result = consulter(body);
      const payload = result.error ? { error: result.error, disclaimer: DISCLAIMER } : { ...result.data, disclaimer: DISCLAIMER };
      return json(res, result.status, await maybeTranslatePayload(req, url, body, payload, { contentType: 'structured_legal_content', domain: body?.domaine }));
    }

    if (path.match(/^\/api\/fiches\/([^/]+)$/) && method === 'GET') {
      const ficheId = path.match(/^\/api\/fiches\/([^/]+)$/)[1];
      const fiche = getFicheById(ficheId);
      if (!fiche) return json(res, 404, { error: 'Fiche non trouvee', disclaimer: DISCLAIMER });
      return json(res, 200, await maybeTranslatePayload(req, url, null, { fiche, disclaimer: DISCLAIMER }, {
        contentType: 'structured_legal_content',
        domain: fiche?.domaine,
        sourceLastVerified: fiche?.last_verified_at
      }));
    }

    if (path.match(/^\/api\/services\/([^/]+)$/) && method === 'GET') {
      const canton = path.match(/^\/api\/services\/([^/]+)$/)[1];
      const services = getServicesByCanton(canton);
      return json(res, 200, await maybeTranslatePayload(req, url, null, {
        services,
        canton: canton.toUpperCase(),
        disclaimer: DISCLAIMER
      }, { contentType: 'structured_legal_content' }));
    }

    // Legacy premium routes (kept for backward compat)
    if (path === '/api/premium/acheter' && method === 'POST') {
      const body = await parseBody(req);
      const result = acheterWallet(body.montant);
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

    // DOCX generation — returns binary .docx file
    if (path === '/api/premium/generate-docx' && method === 'POST') {
      const body = await parseBody(req);
      const sessionCode = body.session || req.headers['x-session'];
      try {
        const letterResult = await genererLettreAI(sessionCode, {
          ficheId: body.ficheId,
          userContext: body.userContext,
          type: body.type || 'mise_en_demeure'
        });
        if (letterResult.error) return json(res, letterResult.status, { error: letterResult.error });

        let letterText = letterResult.data?.lettre || letterResult.lettre;
        if (!letterText) return json(res, 500, { error: 'Pas de lettre générée' });

        const docxLang = normalizeLocale(body.lang || resolveRequestLocale(req, url, body));
        if (docxLang !== 'fr') {
          const translated = await maybeTranslateText(req, url, body, letterText, {
            contentType: 'structured_legal_content',
            domain: body?.domaine || null
          });
          if (translated.translation_status === 'failed') {
            return json(res, 503, {
              error: 'Traduction indisponible pour la langue demandée',
              display_lang: docxLang,
              source_lang: 'fr',
              translation_status: 'failed',
              translation_pipeline_version: TRANSLATION_PIPELINE_VERSION
            });
          }
          letterText = translated.translated;
          if (translated.translation_status === 'fresh') {
            debitSession(sessionCode, 4, 'traduction_docx');
          }
        }

        const docxBuffer = await generateDocx(letterText, { type: body.type, ficheId: body.ficheId });
        res.writeHead(200, {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="lettre-${body.type || 'juridique'}${body.lang && body.lang !== 'fr' ? '-' + body.lang : ''}.docx"`,
          'Content-Length': docxBuffer.length,
        });
        res.end(docxBuffer);
        return;
      } catch (err) {
        log.error('docx_generation_error', { err: err.message });
        return json(res, 500, { error: 'Erreur génération DOCX' });
      }
    }

    // ─── Translation endpoint (premium) ───────────────────────────
    if (path === '/api/premium/translate' && method === 'POST') {
      const body = await parseBody(req);
      const sessionCode = body.session || req.headers['x-session'];
      if (!body.text) return json(res, 400, { error: 'text requis', disclaimer: DISCLAIMER });
      const safeText = sanitizeUserInput(body.text, 25000); // translations can be long

      if (!body.targetLang || !isOfferedLocale(body.targetLang)) {
        return json(res, 400, { error: 'Langue non supportée', disclaimer: DISCLAIMER });
      }
      const targetLang = normalizeLocale(body.targetLang);
      if (targetLang === 'fr') {
        return json(res, 200, {
          translated: safeText,
          display_lang: 'fr',
          source_lang: 'fr',
          translation_status: 'fresh',
          translation_pipeline_version: TRANSLATION_PIPELINE_VERSION,
          translated_at: new Date().toISOString(),
          disclaimer: DISCLAIMER
        });
      }

      // Session check
      const walletCheck = getCredits(sessionCode);
      if (walletCheck.error) return json(res, walletCheck.status || 403, { error: walletCheck.error, disclaimer: DISCLAIMER });
      if (walletCheck.data.solde < 3) return json(res, 402, { error: 'Solde insuffisant', solde: walletCheck.data.solde, disclaimer: DISCLAIMER });

      try {
        const translated = await translateTextContent(safeText, {
          targetLang,
          sourceLang: 'fr',
          contentType: body.context === 'legal' ? 'structured_legal_content' : 'text'
        });
        if (translated.translation_status === 'failed') {
          return json(res, 503, {
            error: 'Service de traduction indisponible',
            display_lang: targetLang,
            source_lang: 'fr',
            translation_status: 'failed',
            translation_pipeline_version: TRANSLATION_PIPELINE_VERSION,
            disclaimer: DISCLAIMER
          });
        }
        const charged = translated.translation_status === 'fresh' ? debitSession(sessionCode, 4, 'traduction') : { charged: 0, solde: walletCheck.data.solde };

        return json(res, 200, {
          translated: translated.translated,
          lang: targetLang,
          display_lang: translated.display_lang,
          source_lang: translated.source_lang,
          translation_status: translated.translation_status,
          translation_pipeline_version: translated.translation_pipeline_version,
          translated_at: translated.translated_at,
          cost: {
            charged_centimes: charged.charged || 0,
            solde_restant: charged.solde ?? walletCheck.data.solde
          },
          disclaimer: DISCLAIMER
        });
      } catch (err) {
        log.error('translation_error', { err: err.message });
        return json(res, 500, { error: 'Erreur de traduction', disclaimer: DISCLAIMER });
      }
    }

    if (path === '/api/i18n/html' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.html || typeof body.html !== 'string') {
        return json(res, 400, { error: 'html requis', disclaimer: DISCLAIMER });
      }
      if (body.html.length > 50000) {
        return json(res, 413, { error: 'Fragment trop volumineux', disclaimer: DISCLAIMER });
      }
      // Bulletproof : maybeTranslateText ne throw plus jamais (catch interne →
      // renvoie le texte source avec translation_status='failed' ou 'failed_internal').
      // On répond TOUJOURS 200 avec le HTML le mieux disponible. Le frontend
      // lit translation_status pour afficher éventuellement un avertissement
      // discret ("traduction indisponible — texte affiché en langue source").
      // Évite la cascade 503 observée en prod quand l'API LLM est down (~108
      // erreurs sur 9 jours, toutes par grappes de ~9 fragments simultanés).
      const translated = await maybeTranslateText(req, url, body, body.html, {
        contentType: 'html'
      });
      return json(res, 200, {
        html: translated.translated || body.html,
        display_lang: translated.display_lang,
        source_lang: translated.source_lang,
        translation_status: translated.translation_status,
        translation_pipeline_version: translated.translation_pipeline_version,
        translated_at: translated.translated_at,
        translation_error: translated.translation_error || undefined,
        disclaimer: DISCLAIMER
      });
    }

    // NOTE: first /api/premium/estimate handler removed (duplicate — caught all requests).
    // The complete handler is below, after analyze-v3/refine.

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
      const result = await handleTriageStart({ texte: body.texte, canton: body.canton });
      const httpStatus = result.http_status
        || (result.status === 'error' ? 500
          : result.status === 'safety_stop' ? 200
          : result.status === 'human_tier' ? 200
          : result.status === 'out_of_scope' ? 200
          : 200);
      // Inclure `status` dans le payload d'erreur pour que le front puisse
      // distinguer error/safety_stop/payment_required sans parser le code HTTP.
      const payload = result.error
        ? { status: result.status || 'error', error: result.error, disclaimer: DISCLAIMER }
        : { ...result, disclaimer: DISCLAIMER };
      return json(res, httpStatus, await maybeTranslatePayload(req, url, body, payload, { contentType: 'structured_legal_content' }));
    }

    if (path === '/api/triage' && method === 'GET') {
      const q = url.searchParams.get('q');
      const canton = url.searchParams.get('canton');
      const result = await handleTriageStart({ texte: q, canton });
      const httpStatus = result.http_status
        || (result.status === 'error' ? 500 : 200);
      const payload = result.error
        ? { status: result.status || 'error', error: result.error, disclaimer: DISCLAIMER }
        : { ...result, disclaimer: DISCLAIMER };
      return json(res, httpStatus, await maybeTranslatePayload(req, url, null, payload, { contentType: 'structured_legal_content' }));
    }

    if (path === '/api/triage/refine' && method === 'POST') {
      const body = await parseBody(req);
      const result = await handleTriageNext({
        case_id: body.sessionId,
        action: 'answer',
        answers: body.reponses,
        wallet_session: body.wallet_session
      });
      const httpStatus = result.http_status
        || (result.status === 'payment_required' ? 402
          : result.status === 'error' ? 500
          : 200);
      return json(res, httpStatus, await maybeTranslatePayload(req, url, body, { ...result, disclaimer: DISCLAIMER }, {
        contentType: 'structured_legal_content'
      }));
    }

    if (path === '/api/triage/cost' && method === 'GET') {
      const type = url.searchParams.get('type') || 'triage';
      const cost = estimateCost(type);
      return json(res, cost ? 200 : 404, cost
        ? { ...cost, disclaimer: DISCLAIMER }
        : { error: 'Type inconnu', disclaimer: DISCLAIMER });
    }

    // ─── Triage orchestration (Phase 6 / Cortex) ───────────────────

    if (path === '/api/triage/next' && method === 'POST') {
      const body = await parseBody(req);
      const result = await handleTriageNext({
        case_id: body.case_id,
        action: body.action,
        answers: body.answers,
        wallet_session: body.wallet_session
      });
      const httpStatus = result.http_status
        || (result.status === 'error' ? 400
          : 200);
      return json(res, httpStatus, await maybeTranslatePayload(req, url, body, { ...result, disclaimer: DISCLAIMER }, {
        contentType: 'structured_legal_content'
      }));
    }

    // ─── Escalation pack — "ce cas me dépasse" ────────────────────

    if (path === '/api/triage/escalation' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.case_id) {
        return json(res, 400, { error: 'case_id requis', disclaimer: DISCLAIMER });
      }
      const caseRec = getCase(body.case_id);
      if (!caseRec) {
        return json(res, 404, { error: 'Case introuvable ou expiré', disclaimer: DISCLAIMER });
      }
      const pack = buildEscalationPack(caseRec);
      if (!pack) {
        return json(res, 500, { error: 'Impossible de construire le pack d\'escalade', disclaimer: DISCLAIMER });
      }
      return json(res, 200, {
        escalation_pack: pack,
        download_url: `/api/triage/escalation/${body.case_id}/download.json`,
        disclaimer: DISCLAIMER
      });
    }

    {
      const downloadMatch = path.match(/^\/api\/triage\/escalation\/([^/]+)\/download\.json$/);
      if (downloadMatch && method === 'GET') {
        const caseId = decodeURIComponent(downloadMatch[1]);
        const caseRec = getCase(caseId);
        if (!caseRec) {
          return json(res, 404, { error: 'Case introuvable ou expiré', disclaimer: DISCLAIMER });
        }
        const pack = buildEscalationPack(caseRec);
        if (!pack) {
          return json(res, 500, { error: 'Impossible de construire le pack d\'escalade', disclaimer: DISCLAIMER });
        }
        setSecurityHeaders(res);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="escalation-${caseId}.json"`
        });
        return res.end(JSON.stringify(pack, null, 2));
      }
    }

    // ─── Citizen account (90j session, 12mo account) ──────────────

    if (path === '/api/citizen/register' && method === 'POST') {
      const body = await parseBody(req);
      const result = createAccount({ email: body.email, canton: body.canton });
      if (result.error) return json(res, 400, { error: result.error, disclaimer: DISCLAIMER });
      // Expose magic_token_dev en non-prod (front l'utilise directement, sinon email)
      const isDev = process.env.NODE_ENV !== 'production';
      const payload = { ...result, disclaimer: DISCLAIMER };
      if (isDev && result.magic_token) payload.magic_token_dev = result.magic_token;
      return json(res, 200, payload);
    }

    if (path === '/api/citizen/verify' && method === 'POST') {
      const body = await parseBody(req);
      const result = verifyMagicToken(body.token);
      if (result.error) return json(res, 400, { error: result.error, disclaimer: DISCLAIMER });
      return json(res, 200, { ...result, disclaimer: DISCLAIMER });
    }

    if (path === '/api/citizen/me' && method === 'GET') {
      const session = req.headers['x-citizen-session'];
      if (!session) return json(res, 401, { error: 'Session requise', disclaimer: DISCLAIMER });
      const account = getAccount(session);
      if (!account) return json(res, 401, { error: 'Session invalide ou expirée', disclaimer: DISCLAIMER });
      return json(res, 200, {
        account,
        cases: account.cases || [],
        alerts: account.alerts || [],
        disclaimer: DISCLAIMER
      });
    }

    if (path === '/api/citizen/cases/link' && method === 'POST') {
      const session = req.headers['x-citizen-session'];
      if (!session) return json(res, 401, { error: 'Session requise', disclaimer: DISCLAIMER });
      const body = await parseBody(req);
      if (!body.case_id) return json(res, 400, { error: 'case_id requis', disclaimer: DISCLAIMER });
      const result = linkCaseToAccount(session, body.case_id);
      if (result.error) return json(res, result.status || 400, { error: result.error, disclaimer: DISCLAIMER });
      return json(res, 200, { ...result, disclaimer: DISCLAIMER });
    }

    if (path === '/api/citizen/upcoming' && method === 'GET') {
      const session = req.headers['x-citizen-session'];
      if (!session) return json(res, 401, { error: 'Session requise', disclaimer: DISCLAIMER });
      const account = getAccount(session);
      if (!account) return json(res, 401, { error: 'Session invalide', disclaimer: DISCLAIMER });
      const upcoming = getUpcomingDeadlines(account.account_id, 30);
      return json(res, 200, { upcoming, disclaimer: DISCLAIMER });
    }

    if (path === '/api/citizen/me' && method === 'DELETE') {
      const session = req.headers['x-citizen-session'];
      if (!session) return json(res, 401, { error: 'Session requise', disclaimer: DISCLAIMER });
      const result = closeAccount(session);
      return json(res, result.error ? 400 : 200,
        result.error ? { error: result.error, disclaimer: DISCLAIMER }
                     : { ...result, disclaimer: DISCLAIMER });
    }

    // ─── Outcomes feedback ────────────────────────────────────────

    if (path === '/api/outcomes/record' && method === 'POST') {
      const body = await parseBody(req);
      const result = recordOutcome(body || {});
      const ok = result.status === 'recorded' || result.status === 'updated';
      // Normalise status pour le front (back émet 'recorded', le front attend 'stored')
      const normalized = ok
        ? { ...result, status: result.status === 'updated' ? 'updated' : 'stored' }
        : result;
      return json(res, ok ? 200 : 400, { ...normalized, disclaimer: DISCLAIMER });
    }

    // Simplified citizen feedback: "Did this help?" widget ─────────
    if (path === '/api/outcome' && method === 'POST') {
      const body = (await parseBody(req)) || {};
      // Pull context (domaine / fiche_id / canton) from the case if available
      let context = {};
      if (body.case_id) {
        const caseRec = getCase(body.case_id);
        if (caseRec) {
          const primary = caseRec.state?.enriched_primary;
          context = {
            fiche_id: primary?.fiche?.id || primary?.id || null,
            domaine: primary?.fiche?.domaine || primary?.domaine || null,
            canton: caseRec.state?.canton || null
          };
        }
      }
      const result = recordSimpleOutcome({
        case_id: body.case_id,
        helpful: body.helpful,
        free_text: body.free_text || '',
        consent: body.consent_anon_aggregate === true,
        context
      });
      const status = result.recorded
        ? 200
        : (result.reason === 'consent_required' ? 403 : 400);
      return json(res, status, { ...result, disclaimer: DISCLAIMER });
    }

    // Admin: outcomes aggregate stats (k-anon enforced) ────────────
    if (path === '/api/admin/outcomes' && method === 'GET') {
      if (!checkAdmin(req, res)) return;
      const since = url.searchParams.get('since');
      const stats = getOutcomesAggregateStats({ since });
      return json(res, 200, { ...stats, disclaimer: DISCLAIMER });
    }

    // ─── Case lettre (PDF generation) ─────────────────────────────

    {
      const letterMatch = path.match(/^\/api\/case\/([^/]+)\/letter$/);
      if (letterMatch && method === 'POST') {
        const caseId = decodeURIComponent(letterMatch[1]);
        const caseRec = getCase(caseId);
        if (!caseRec) {
          return json(res, 404, { error: 'Case introuvable ou expiré', disclaimer: DISCLAIMER });
        }
        const body = await parseBody(req);
        // Validation : type requis (mise_en_demeure | contestation | opposition | etc.)
        if (!body.type) {
          return json(res, 400, { error: 'type requis (mise_en_demeure, contestation, opposition, resiliation, plainte)', disclaimer: DISCLAIMER });
        }
        if (!body.ficheId) {
          return json(res, 400, { error: 'ficheId requis', disclaimer: DISCLAIMER });
        }
        try {
          const result = await generateLetterPDF({
            ficheId: body.ficheId,
            userContext: body.userContext || caseRec.state || {},
            type: body.type,
            lang: body.lang || 'fr',
            format: body.format || 'auto'
          });
          if (result?.error) {
            return json(res, 400, { error: result.error, disclaimer: DISCLAIMER });
          }
          return json(res, 200, {
            ...result,
            download_url: `/api/case/${caseId}/letter/${result.letter_id}/download`,
            disclaimer: DISCLAIMER
          });
        } catch (err) {
          return json(res, 500, { error: err.message, disclaimer: DISCLAIMER });
        }
      }
    }

    {
      const letterDlMatch = path.match(/^\/api\/case\/([^/]+)\/letter\/([^/]+)\/download$/);
      if (letterDlMatch && method === 'GET') {
        const caseId = decodeURIComponent(letterDlMatch[1]);
        const letterId = decodeURIComponent(letterDlMatch[2]);
        try {
          const { _getOutputDir } = await import('./services/letter-pdf-generator.mjs');
          const dir = _getOutputDir();
          const filePath = join(dir, `${letterId}.pdf`);
          if (!existsSync(filePath)) {
            return json(res, 404, { error: 'Lettre introuvable', disclaimer: DISCLAIMER });
          }
          setSecurityHeaders(res);
          res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="letter-${letterId}.pdf"`
          });
          return res.end(readFileSync(filePath));
        } catch (err) {
          return json(res, 500, { error: err.message, disclaimer: DISCLAIMER });
        }
      }
    }

    // ─── Case reminders (extraction + scheduling) ─────────────────

    {
      const remindersMatch = path.match(/^\/api\/case\/([^/]+)\/reminders$/);
      if (remindersMatch && method === 'GET') {
        const caseId = decodeURIComponent(remindersMatch[1]);
        const caseRec = getCase(caseId);
        if (!caseRec) {
          return json(res, 404, { error: 'Case introuvable ou expiré', disclaimer: DISCLAIMER });
        }
        const deadlines = extractDeadlinesFromCase(caseRec);
        const scheduled_reminders = listRemindersForCase(caseId);
        return json(res, 200, {
          case_id: caseId,
          deadlines,
          scheduled_reminders,
          disclaimer: DISCLAIMER
        });
      }

      const scheduleMatch = path.match(/^\/api\/case\/([^/]+)\/reminders\/schedule$/);
      if (scheduleMatch && method === 'POST') {
        const caseId = decodeURIComponent(scheduleMatch[1]);
        const caseRec = getCase(caseId);
        if (!caseRec) {
          return json(res, 404, { error: 'Case introuvable ou expiré', disclaimer: DISCLAIMER });
        }
        const body = await parseBody(req);
        const result = scheduleReminders(caseRec, body.contact_email || body.contact || null);
        return json(res, 200, { ...result, disclaimer: DISCLAIMER });
      }
    }

    // ─── Dashboard metrics (admin) ────────────────────────────────

    if (path === '/api/dashboard/metrics' && method === 'GET') {
      if (process.env.NODE_ENV === 'production') {
        if (!checkAdmin(req, res)) return;
      }
      const metrics = computeDashboardMetrics();
      return json(res, 200, { ...metrics, disclaimer: DISCLAIMER });
    }

    // Recherche — LLM-first, keyword fallback
    if (path === '/api/search' && method === 'GET') {
      const q = sanitizeUserInput(url.searchParams.get('q'), MAX_QUERY_LENGTH);
      const canton = url.searchParams.get('canton');
      if (!q) return json(res, 400, { error: 'Paramètre q requis', disclaimer: DISCLAIMER });

      trackSearch();

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
      const triageStart = Date.now();
      const triageResult = await triage(q, canton);
      if (triageResult.status === 200 && triageResult.data?.trouve) {
        // LLM understood the query — use LLM's ficheId, NOT keyword search
        const ficheId = triageResult.data.ficheId;
        // First try: load the fiche the LLM identified
        let enriched = queryComplete(ficheId);
        if (!enriched || enriched.status !== 200) {
          // Fallback: keyword search (but LLM fiche should exist)
          enriched = queryByProblem(q, canton);
        }
        // Merge LLM intelligence with enriched data
        const responseData = enrichV4({
          ...(enriched.status === 200 ? enriched.data : {}),
          llm_triage: {
            ficheId: triageResult.data.ficheId,
            domaine: triageResult.data.domaine,
            resume: triageResult.data.resumeSituation,
            confiance: triageResult.data.confiance,
            questions: triageResult.data.questionsManquantes,
            complet: triageResult.data.complet,
          },
          alternatives: (triageResult.data.fichesSecondaires || []).slice(0, 3),
          triage_method: 'llm',
          disclaimer: DISCLAIMER,
        });
        // Generate suggested follow-up questions
        responseData.suggested_questions = generateSuggestedQuestions(
          ficheId,
          enriched.status === 200 ? enriched.data : null,
          triageResult.data
        );

        const shapedResponse = shapeSearchPayload(responseData);
        logTriage(q, triageResult.data, 'llm', Date.now() - triageStart);
        return json(res, 200, await maybeTranslatePayload(req, url, null, shapedResponse, {
          contentType: 'structured_legal_content',
          domain: shapedResponse?.fiche?.domaine || triageResult.data?.domaine
        }));
      }

      // Fallback: keyword search (degraded mode)
      const result = queryByProblem(q, canton);
      if (result.error) return json(res, result.status, { error: result.error, disclaimer: DISCLAIMER });

      // If semantic search returned "unclear" (no confident match), return helpful guidance
      if (result.data?.type === 'unclear') {
        logTriage(q, result.data, 'keyword_fallback_unclear', Date.now() - triageStart);
        return json(res, 200, await maybeTranslatePayload(req, url, null, {
          ...result.data,
          triage_method: 'keyword_fallback',
          disclaimer: DISCLAIMER
        }, { contentType: 'structured_legal_content' }));
      }

      const fallbackData = enrichV4({ ...result.data, triage_method: 'keyword_fallback', disclaimer: DISCLAIMER });
      // Add suggested questions for keyword fallback too
      if (fallbackData.fiche?.id) {
        fallbackData.suggested_questions = generateSuggestedQuestions(fallbackData.fiche.id, fallbackData, null);
      }
      const shapedFallback = shapeSearchPayload(fallbackData);
      logTriage(q, result.data, 'keyword_fallback', Date.now() - triageStart);
      return json(res, result.status, await maybeTranslatePayload(req, url, null, shapedFallback, {
        contentType: 'structured_legal_content',
        domain: shapedFallback?.fiche?.domaine
      }));
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
      if (!checkAdmin(req, res)) return;
      const result = getCompleteness();
      return json(res, result.status, { ...result.data, disclaimer: DISCLAIMER });
    }

    // Metrics snapshot (admin)
    if (path === '/api/admin/metrics' && method === 'GET') {
      if (!checkAdmin(req, res)) return;
      const { getRateLimitStats } = await import('./lib/http-helpers.mjs');
      return json(res, 200, {
        ...metricsSnapshot(),
        rate_limit: getRateLimitStats(),
        disclaimer: DISCLAIMER
      });
    }

    // Audit env vars (admin)
    if (path === '/api/admin/env' && method === 'GET') {
      if (!checkAdmin(req, res)) return;
      const { getEnvSpecs } = await import('./services/env-check.mjs');
      const specs = getEnvSpecs();
      return json(res, 200, {
        env: process.env.NODE_ENV || 'development',
        specs: specs.map(s => ({
          name: s.name,
          category: s.category,
          required_in_prod: s.required_in_prod,
          present: s.present,
          hint: s.hint,
        })),
        disclaimer: DISCLAIMER
      });
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
      const MAX_SOURCE_IDS = 200;
      const body = await parseBody(req);
      if (!body.source_ids || !Array.isArray(body.source_ids)) {
        return json(res, 400, { error: 'source_ids (array) requis', disclaimer: DISCLAIMER });
      }
      if (body.source_ids.length > MAX_SOURCE_IDS) {
        return json(res, 413, {
          error: `Trop de source_ids (max ${MAX_SOURCE_IDS})`,
          received: body.source_ids.length,
          max: MAX_SOURCE_IDS,
          disclaimer: DISCLAIMER
        });
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

      // Session check — require valid wallet
      const sessionCode = body.session || req.headers['x-session'];
      const walletCheck = getCredits(sessionCode);
      if (walletCheck.error) return json(res, walletCheck.status || 403, { error: walletCheck.error, disclaimer: DISCLAIMER });

      // Check minimum balance before running analysis (don't debit yet)
      const MIN_BALANCE_CENTIMES = 5;
      if (walletCheck.data.solde < MIN_BALANCE_CENTIMES) {
        return json(res, 402, { error: 'Solde insuffisant', solde: walletCheck.data.solde, minimum: MIN_BALANCE_CENTIMES, disclaimer: DISCLAIMER });
      }

      try {
        trackPremiumAnalysis();
        const safeTexte = sanitizeUserInput(body.texte, 5000);
        const result = await analyserCas(safeTexte, body.canton, body.reponses);
        if (!result) {
          // No charge — analysis failed to produce a result
          return json(res, 503, { error: 'Service IA indisponible', verification_status: 'insufficient', disclaimer: DISCLAIMER });
        }

        // Mode crise — no longer short-circuits. Analysis continues with urgency info added.

        // Determine verification status
        let verification_status = 'verified';
        if (!result.analysis) verification_status = 'degraded';
        else if (!result.analysis.claims?.length) verification_status = 'insufficient';

        // V4: include full pipeline outputs (certificate, argumentation, committee, normative)
        const ficheId = result.comprehension?.ficheId || result.comprehension?.fiches_pertinentes?.[0];
        const vulg = ficheId ? getVulgarisationForFiche(ficheId) : null;

        // Debit wallet AFTER successful analysis, based on actual token usage
        const usage = result.usage || {};
        const totalTokens = (usage.total_input || 0) + (usage.total_output || 0);
        // Approximate cost: Sonnet rates ~3$/1M input + 15$/1M output ≈ avg 9$/1M → ~0.8 CHF/1M → 0.08 ct/1K
        const apiCostCentimes = Math.max(3, Math.ceil(totalTokens / 1000 * 0.08));
        const debitResult = debitSession(sessionCode, apiCostCentimes, 'analyse_v3');
        // Don't block on insufficient funds for test accounts — just log
        if (debitResult.error && !debitResult.error.includes('test')) {
          log.warn('debit_warning', { err: debitResult.error, session: sessionCode });
        }

        // Generate premium suggested next steps
        const suggestedNextSteps = [];
        const claims = result.analysis?.claims || [];
        const cert = result.certificate || {};
        // Claim-based suggestions
        for (const claim of claims.slice(0, 2)) {
          if (claim.text && claim.confiance !== 'faible') {
            suggestedNextSteps.push({
              text: `Approfondir : ${(claim.text || '').slice(0, 80)}`,
              query: (claim.text || '').slice(0, 60),
              type: 'claim'
            });
          }
        }
        // Certificate gaps
        if (cert.checks) {
          const failed = (Array.isArray(cert.checks) ? cert.checks : []).filter(c => !c.passed);
          for (const f of failed.slice(0, 1)) {
            suggestedNextSteps.push({
              text: `Information manquante : ${f.label || f.id || ''}`,
              query: f.label || '',
              type: 'gap'
            });
          }
        }
        // Letter generation suggestion
        if (ficheId) {
          suggestedNextSteps.push({
            text: 'Générer une lettre de mise en demeure',
            action: 'generate_letter',
            ficheId,
            type: 'letter'
          });
        }
        // Fiche-level suggested questions
        const ficheQuestions = generateSuggestedQuestions(ficheId, null, { questions: result.questions });

        const payload = {
          mode_crise: result.mode_crise || false,
          urgence_contacts: result.urgence_contacts || null,
          complet: result.complet,
          verification_status,
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
          // V4 pipeline outputs
          certificate: result.certificate || null,
          argumentation: result.argumentation || null,
          committee: result.committee || null,
          normative: result.normative || null,
          vulgarisation: vulg,
          // V5: suggested next steps
          suggested_next_steps: suggestedNextSteps,
          suggested_questions: ficheQuestions,
          usage: result.usage,
          cost: debitResult.charged ? { charged_centimes: debitResult.charged, solde_restant: debitResult.solde } : null,
          disclaimer: DISCLAIMER
        };
        return json(res, 200, await maybeTranslatePayload(req, url, body, payload, {
          contentType: 'structured_legal_content',
          domain: ficheId ? (result.comprehension?.domaine || null) : null
        }));
      } catch (err) {
        // No charge on error — user is not debited
        log.error('v3_analysis_error', { err: err.message });
        return json(res, 500, { error: 'Erreur analyse', verification_status: 'insufficient', disclaimer: DISCLAIMER });
      }
    }

    if (path === '/api/premium/analyze-v3/refine' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.texte || !body.reponses) {
        return json(res, 400, { error: 'texte et reponses requis', disclaimer: DISCLAIMER });
      }

      // Session check — require valid wallet (same as main analyze-v3)
      const sessionCode = body.session || req.headers['x-session'];
      const walletCheck = getCredits(sessionCode);
      if (walletCheck.error) return json(res, walletCheck.status || 403, { error: walletCheck.error, disclaimer: DISCLAIMER });

      const MIN_BALANCE_CENTIMES = 5;
      if (walletCheck.data.solde < MIN_BALANCE_CENTIMES) {
        return json(res, 402, { error: 'Solde insuffisant', solde: walletCheck.data.solde, minimum: MIN_BALANCE_CENTIMES, disclaimer: DISCLAIMER });
      }

      // Re-run with answers
      try {
        const safeTexte = sanitizeUserInput(body.texte, 5000);
        const result = await analyserCas(safeTexte, body.canton, body.reponses);
        if (!result) return json(res, 503, { error: 'Service IA indisponible', disclaimer: DISCLAIMER });

        let verification_status = 'verified';
        if (!result.analysis) verification_status = 'degraded';

        // Debit wallet AFTER successful analysis
        const usage = result.usage || {};
        const totalTokens = (usage.total_input || 0) + (usage.total_output || 0);
        const apiCostCentimes = Math.max(3, Math.ceil(totalTokens / 1000 * 0.08));
        const debitResult = debitSession(sessionCode, apiCostCentimes, 'analyse_v3_refine');
        if (debitResult.error && !debitResult.error.includes('test')) {
          log.warn('debit_warning_refine', { err: debitResult.error, session: sessionCode });
        }

        const payload = {
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
          cost: debitResult.charged ? { charged_centimes: debitResult.charged, solde_restant: debitResult.solde } : null,
          disclaimer: DISCLAIMER
        };
        return json(res, 200, await maybeTranslatePayload(req, url, body, payload, {
          contentType: 'structured_legal_content'
        }));
      } catch (err) {
        // No charge on error
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
      // Generic estimate handler for analyse/lettre/ocr
      const result = estimerCout(action, {
        ficheId: url.searchParams.get('ficheId'),
        userContext: url.searchParams.get('userContext'),
        question: url.searchParams.get('question'),
      });
      return json(res, result.status, result.error
        ? { error: result.error, disclaimer: DISCLAIMER }
        : { ...result.data, disclaimer: DISCLAIMER });
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
      if (!checkAdmin(req, res)) return;
      const stats = { oui: 0, non: 0, partiel: 0, total: feedbackStore.length };
      for (const f of feedbackStore) stats[f.rating]++;
      return json(res, 200, { stats, recent: feedbackStore.slice(-20), disclaimer: DISCLAIMER });
    }

    if (path === '/api/admin/analytics' && method === 'GET') {
      if (!checkAdmin(req, res)) return;
      return json(res, 200, { ...getAnalyticsStats(), disclaimer: DISCLAIMER });
    }

    // ─── Admin : liste des deadline reminders (account_ids masqués) ─
    if (path === '/api/admin/reminders' && method === 'GET') {
      if (!checkAdmin(req, res)) return;
      const status = url.searchParams.get('status'); // 'pending' | 'sent' | null
      const limit = Math.min(200, parseInt(url.searchParams.get('limit') || '50', 10) || 50);
      const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);

      const all = _listRemindersForTests();
      let filtered = all;
      if (status === 'pending') filtered = all.filter(r => !r.sent);
      else if (status === 'sent') filtered = all.filter(r => r.sent);

      filtered.sort((a, b) => {
        const am = a.due_date_ms || a.reminder_at_ms || 0;
        const bm = b.due_date_ms || b.reminder_at_ms || 0;
        return am - bm;
      });

      const paged = filtered.slice(offset, offset + limit).map(r => ({
        reminder_id: r.reminder_id,
        account_id_masked: maskAccountId(r.account_id || ''),
        has_account: !!r.account_id,
        case_id: r.case_id,
        titre: r.titre || r.procedure,
        due_date_iso: r.due_date_iso || r.delai_date_iso,
        severity: r.severity,
        sent: !!r.sent,
        sent_at_iso: r.sent_at_iso,
        created_at_iso: r.created_at_iso,
        send_result: r.send_result
      }));

      return json(res, 200, {
        total: filtered.length,
        limit,
        offset,
        reminders: paged,
        disclaimer: DISCLAIMER
      });
    }

    // Static files
    if (path === '/' || path === '/index.html') {
      trackPageView('/');
      const lang = resolveRequestLocale(req, url);
      if (lang) trackLanguage(lang);
      return serveStatic(req, res, join(publicDir, 'index.html'));
    }

    if (method === 'GET' && /^\/guides\/(fr|de|it|en|pt|ar|tr|sq|hr)\/[a-z0-9_]+\.html$/.test(path)) {
      const match = path.match(/^\/guides\/(fr|de|it|en|pt|ar|tr|sq|hr)\/([a-z0-9_]+)\.html$/);
      const locale = match[1];
      const slug = match[2];
      const localizedStaticPath = join(publicDir, 'guides', locale, `${slug}.html`);
      if (existsSync(localizedStaticPath)) {
        trackPageView(path);
        trackLanguage(locale);
        return serveStatic(req, res, localizedStaticPath);
      }
      const rendered = await renderGuideForLocale(slug, locale);
      if (!rendered) {
        return json(res, 404, { error: 'Guide introuvable', disclaimer: DISCLAIMER });
      }
      if (!rendered.html) {
        return json(res, 503, {
          error: 'Guide indisponible dans la langue demandée',
          display_lang: locale,
          source_lang: 'fr',
          translation_status: rendered.translation_status || 'failed',
          translation_pipeline_version: TRANSLATION_PIPELINE_VERSION,
          disclaimer: DISCLAIMER
        });
      }
      setSecurityHeaders(res);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(rendered.html);
    }

    // SEO guides (Phase Cortex §8) — pages statiques par intent.
    // Si le fichier existe → serve. Sinon → redirige vers /resultat.html
    // avec un slug humanisé (underscores → espaces).
    if (method === 'GET' && /^\/guides\/[a-z0-9_]+\.html$/.test(path)) {
      const slug = path.slice('/guides/'.length, -'.html'.length);
      const guidePath = join(publicDir, 'guides', `${slug}.html`);
      if (existsSync(guidePath)) {
        trackPageView(path);
        const lang = resolveRequestLocale(req, url);
        if (lang) trackLanguage(lang);
        return serveStatic(req, res, guidePath);
      }
      const q = slug.replace(/_/g, ' ');
      setSecurityHeaders(res);
      res.writeHead(302, { Location: `/resultat.html?q=${encodeURIComponent(q)}` });
      return res.end();
    }

    const staticPath = join(publicDir, path);
    if (existsSync(staticPath) && !staticPath.includes('..')) {
      if (path.endsWith('.html')) {
        trackPageView(path);
        const lang = resolveRequestLocale(req, url);
        if (lang) trackLanguage(lang);
      }
      return serveStatic(req, res, staticPath);
    }

    // 404
    const notFoundPage = join(publicDir, '404.html');
    if (existsSync(notFoundPage) && !path.startsWith('/api/')) {
      setSecurityHeaders(res);
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(readFileSync(notFoundPage));
    }
    json(res, 404, { error: 'Route non trouvée', disclaimer: DISCLAIMER });
  } catch (err) {
    if (err.message === 'Invalid JSON' || err.message === 'Body too large') {
      json(res, 400, { error: err.message, disclaimer: DISCLAIMER });
    } else {
      json(res, 500, { error: 'Erreur interne', disclaimer: DISCLAIMER });
    }
  }
});

const PORT = process.env.PORT || 3000;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Fail-fast en prod si des env vars critiques manquent.
  validateEnv();

  server.listen(PORT, () => {
    log.info('server_boot', { port: PORT });
    startCompactionLoop();
  });

  // Graceful shutdown
  function gracefulShutdown(signal) {
    log.info('shutdown_start', { signal });
    stopCompactionLoop();
    // Flush la debounce 1s du case-store pour éviter la perte de cases
    // modifiés juste avant SIGTERM.
    try { _flushCases(); } catch (err) { log.error('shutdown_flush_failed', { err: err.message }); }
    server.close(() => {
      log.info('shutdown_complete');
      process.exit(0);
    });
    // Force exit after 10s if connections don't close
    setTimeout(() => {
      log.warn('shutdown_force_exit', { timeout_ms: 10000 });
      process.exit(1);
    }, 10000).unref();
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export { server };
export default server;
