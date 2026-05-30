/**
 * Régression 2026-05-31 : serveStatic sur un chemin de RÉPERTOIRE faisait
 * writeHead(200) puis readFileSync(dir) → EISDIR APRÈS headers → le catch
 * appelant re-json() → ERR_HTTP_HEADERS_SENT NON catchée → crash-loop process
 * → 502 sur tout le site. Déclenché par les liens vers /guides/ (P4 SEO).
 *
 * Verrou : serveStatic n'accepte QUE des fichiers ; un répertoire → 404 propre,
 * sans throw, sans envoyer puis re-envoyer des headers.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { serveStatic } from '../src/lib/http-helpers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'src', 'public');

function mockRes() {
  return {
    statusCode: 0,
    headersSent: false,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    writeHead(code, h) { this.statusCode = code; this.headersSent = true; if (h) Object.assign(this.headers, h); },
    end(body) { this.ended = true; this.body = body; },
  };
}

describe('serveStatic — robustesse répertoire (anti crash-loop)', () => {
  it('un chemin de répertoire → 404 sans throw', () => {
    const res = mockRes();
    assert.doesNotThrow(() => serveStatic({}, res, join(PUBLIC_DIR, 'guides'), PUBLIC_DIR));
    assert.equal(res.statusCode, 404, 'un répertoire doit donner 404, pas 200');
  });

  it('un chemin inexistant → 404 sans throw', () => {
    const res = mockRes();
    assert.doesNotThrow(() => serveStatic({}, res, join(PUBLIC_DIR, 'nope-xyz.html'), PUBLIC_DIR));
    assert.equal(res.statusCode, 404);
  });

  it('un vrai fichier → 200', () => {
    const res = mockRes();
    assert.doesNotThrow(() => serveStatic({}, res, join(PUBLIC_DIR, 'index.html'), PUBLIC_DIR));
    assert.equal(res.statusCode, 200);
    assert.ok(res.ended, 'la réponse doit être terminée');
  });

  it('le hub /guides/index.html existe et est un fichier servable', () => {
    const res = mockRes();
    serveStatic({}, res, join(PUBLIC_DIR, 'guides', 'index.html'), PUBLIC_DIR);
    assert.equal(res.statusCode, 200);
  });
});
