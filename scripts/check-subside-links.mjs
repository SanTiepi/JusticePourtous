/**
 * check-subside-links.mjs — Vérifie que les liens "calculateur officiel de subside"
 * des 26 cantons répondent (2xx ou 3xx). À lancer manuellement :
 *
 *     node scripts/check-subside-links.mjs
 *
 * NB : volontairement HORS du gate de déploiement (`npm test`) — ce script tape le
 * réseau et dépend de la disponibilité des sites cantonaux, ce qui rendrait le gate
 * flaky. C'est un contrôle d'hygiène à passer périodiquement (correction Codex P0 #4).
 *
 * Exit code 1 si ≥1 lien renvoie 4xx/5xx ou échoue (utile en cron de surveillance).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'src', 'data', 'meta', 'cantons-aides.json');

const d = JSON.parse(readFileSync(DATA, 'utf8'));

function urlFor(canton) {
  if (canton.subside && canton.subside.url) return canton.subside.url;
  if (canton.subside_url) return canton.subside_url;
  return null;
}

async function probe(url) {
  const t0 = Date.now();
  try {
    // GET (certains serveurs cantonaux refusent HEAD). On suit les redirections :
    // un 3xx final 2xx est accepté (Codex : canonicaliser, mais 3xx reste valide).
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'user-agent': 'JusticePourtous-LinkCheck/1.0 (+https://justicepourtous.ch)' },
      signal: AbortSignal.timeout(15000)
    });
    return { status: res.status, finalUrl: res.url, ms: Date.now() - t0, redirected: res.redirected };
  } catch (err) {
    return { status: 0, error: err.name === 'TimeoutError' ? 'timeout' : err.message, ms: Date.now() - t0 };
  }
}

const entries = Object.entries(d.cantons);
console.log(`Vérification des liens subside de ${entries.length} cantons…\n`);

const results = [];
for (const [code, canton] of entries) {
  const url = urlFor(canton);
  if (!url) { results.push({ code, url: '(aucune)', status: -1 }); continue; }
  const r = await probe(url);
  results.push({ code, url, ...r });
  const ok = r.status >= 200 && r.status < 400;
  const flag = r.status === -1 ? '∅ ' : ok ? '✓ ' : '✗ ';
  const extra = r.redirected ? ` → ${r.finalUrl}` : r.error ? ` (${r.error})` : '';
  console.log(`${flag}${code}  [${r.status || 'ERR'}]  ${url}${extra}`);
}

const broken = results.filter((r) => r.status === 0 || (r.status >= 400));
const missing = results.filter((r) => r.status === -1);
const redirs = results.filter((r) => r.redirected);

console.log(`\nRésumé : ${results.length} liens — ${results.length - broken.length - missing.length} OK, ${redirs.length} via redirection, ${broken.length} cassés, ${missing.length} absents.`);
if (redirs.length) {
  console.log('\nRedirections (à canonicaliser si possible) :');
  redirs.forEach((r) => console.log(`  ${r.code} : ${r.url}  →  ${r.finalUrl}`));
}
if (broken.length) {
  console.log('\n⚠ Liens cassés :');
  broken.forEach((r) => console.log(`  ${r.code} [${r.status || 'ERR'}] ${r.url} ${r.error ? '(' + r.error + ')' : ''}`));
  process.exitCode = 1;
}
