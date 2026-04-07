import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

import { getAllFiches, getFicheById } from './services/fiches.mjs';
import { consulter, getQuestionsForDomaine } from './services/consultation.mjs';
import { getServicesByCanton } from './services/annuaire.mjs';
import { acheterWallet, getCredits, analyser, genererLettre, ocrDocument } from './services/premium.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, 'public');

// Load domaines
const domainesData = JSON.parse(readFileSync(join(__dirname, 'data', 'domaines.json'), 'utf-8'));

const DISCLAIMER = "VosDroits fournit des informations juridiques generales basees sur le droit suisse en vigueur. Il ne remplace pas un conseil d'avocat personnalise. Les informations sont donnees a titre indicatif et sans garantie d'exhaustivite. En cas de doute, consultez un professionnel du droit ou contactez les services listes.";

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:");
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

    // Premium routes
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
    console.log(`VosDroits running on http://localhost:${PORT}`);
  });
}

export { server };
export default server;
