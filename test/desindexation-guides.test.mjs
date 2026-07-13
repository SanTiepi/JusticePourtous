/**
 * ⚠ LES 912 GUIDES NE DOIVENT PLUS ÊTRE TROUVÉS SUR GOOGLE — 2026-07-13
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Le 12 juillet, on a coupé le triage, les lettres, le paiement — parce que le corpus servait des
 * conseils qui font perdre des droits. Un audit de 986 affirmations juridiques des 314 fiches,
 * vérifiées une par une contre Fedlex, a établi :
 *
 *     238 correctes (24 %) · 365 fausses · 383 imprécises · 399 pouvaient FAIRE PERDRE UN DROIT
 *
 * Mais on a oublié une porte. **912 pages de guides, générées depuis ce même corpus, restaient
 * servies par Google.** À des gens qui cherchaient. En ce moment même. Le même contenu faux,
 * par un autre chemin — avec un simple avertissement en tête de page, qui n'a jamais empêché
 * personne de croire ce qui est écrit dessous.
 *
 * Ce test est le cliquet. Il devient rouge si quelqu'un remet ces pages dans l'index sans qu'un
 * juriste humain les ait validées.
 *
 * ⚠ ET IL Y A UNE SECONDE RAISON, PLUS PROSAÏQUE.
 * On tente une seule expérience, pendant 60 jours : deux pages vérifiées (« commandement de
 * payer » FR/DE), dont chaque phrase est une citation littérale du droit fédéral, doivent être
 * trouvées par quelqu'un qui cherche déjà — seul, la nuit, sur son téléphone, avec la lettre sur
 * la table. Noyées parmi 912 pages douteuses, elles ne le seront jamais, et le site entier sera
 * jugé sur les autres. Le sitemap ne contient donc plus qu'elles.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'src', 'public');

const SITEMAP = readFileSync(join(PUBLIC, 'sitemap.xml'), 'utf8');
const SERVER = readFileSync(join(__dirname, '..', 'src', 'server.mjs'), 'utf8');
const RENDERER = readFileSync(join(__dirname, '..', 'src', 'services', 'guide-renderer.mjs'), 'utf8');
const ROBOTS = readFileSync(join(PUBLIC, 'robots.txt'), 'utf8');

describe('Désindexation des 912 guides — la porte qu’on avait oubliée de fermer', () => {
  it('AUCUN guide n’est dans le sitemap', () => {
    const dedans = [...SITEMAP.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map(m => m[1])
      .filter(u => u.includes('/guides'));
    assert.deepEqual(dedans, [],
      `⚠⚠ ${dedans.length} guide(s) sont de retour dans le sitemap. Ils sont générés depuis un corpus dont 76 % des affirmations sont fausses ou dangereusement incomplètes, et dont 399 peuvent faire perdre un droit. On ne les remet PAS avant qu'un juriste humain les ait validées.`);
  });

  it('LE SERVEUR pose un noindex sur TOUT ce qui sort de /guides/', () => {
    // Pourquoi au niveau du serveur, et pas dans les fichiers : le générateur ne sait plus produire
    // que les 314 pages FR. Les 598 pages DE/IT/EN sont ORPHELINES (leur pipeline de traduction ne
    // tourne plus), et on ne bricole pas un fichier généré. Un en-tête HTTP les couvre TOUTES.
    assert.match(SERVER, /X-Robots-Tag/,
      '⚠ le serveur ne pose plus de X-Robots-Tag — les 598 pages orphelines DE/IT/EN redeviennent indexables');
    assert.match(SERVER, /guides[\s\S]{0,200}noindex, nofollow/,
      '⚠ le noindex sur /guides/ a disparu du serveur');
  });

  it('LE GÉNÉRATEUR pose aussi le noindex dans le HTML (ceinture et bretelles)', () => {
    assert.match(RENDERER, /noindex, nofollow/,
      '⚠ le générateur remet « index, follow » dans les guides — à la prochaine régénération, les 314 pages FR redeviennent trouvables');
    assert.doesNotMatch(RENDERER, /content="index, follow"/,
      '⚠ le générateur contient encore « index, follow »');
  });

  it('⚠ LE PIÈGE : robots.txt NE DOIT PAS bloquer /guides/', () => {
    // Contre-intuitif, et c'est l'erreur classique. Un `Disallow` empêche Google de CRAWLER la
    // page — donc de LIRE le `noindex` qu'elle contient. Les 912 pages déjà indexées resteraient
    // alors dans les résultats POUR TOUJOURS, sans qu'on puisse les en sortir.
    //
    // Pour désindexer, il faut au contraire LAISSER Google les visiter, y lire le noindex, et les
    // retirer lui-même. On bloquera le crawl plus tard, quand elles auront disparu.
    assert.doesNotMatch(ROBOTS, /Disallow:\s*\/guides/,
      '⚠⚠ robots.txt bloque /guides/ : Google ne pourra plus lire le noindex, et les 912 pages resteront dans l\'index POUR TOUJOURS. C\'est l\'inverse de ce qu\'on veut.');
  });

  it('le sitemap ne contient QUE des pages défendables ligne par ligne', () => {
    const urls = [...SITEMAP.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    assert.ok(urls.length > 0 && urls.length <= 12,
      `le sitemap contient ${urls.length} pages. Il en contenait 921. S'il regonfle, c'est qu'on a remis du contenu non vérifié.`);

    // Les deux pages de l'expérience DOIVENT y être : sans elles, personne ne les trouve, et
    // l'expérience ne mesure rien.
    assert.ok(urls.some(u => u.endsWith('/commandement-de-payer.html')),
      '⚠ la page FR a disparu du sitemap — l\'expérience SEO ne peut plus rien mesurer');
    assert.ok(urls.some(u => u.endsWith('/zahlungsbefehl.html')),
      '⚠ la page DE a disparu du sitemap');
  });

  it('les fichiers ne sont PAS supprimés — on les remettra quand un juriste les aura validées', () => {
    // On ne détruit rien. On arrête de servir. La nuance est tout le sujet : trois ans de travail
    // ne se jettent pas, ils se mettent en quarantaine jusqu'à ce qu'un humain compétent les relise.
    const guides = join(PUBLIC, 'guides');
    assert.ok(existsSync(guides), 'le dossier des guides a été supprimé — ce n\'était pas la décision');
    const n = readdirSync(guides).filter(f => f.endsWith('.html')).length;
    assert.ok(n > 100, `il ne reste que ${n} guides sur le disque — quelqu'un les a effacés au lieu de les désindexer`);
  });
});
