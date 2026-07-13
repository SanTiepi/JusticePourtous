/**
 * ⚠ LES COORDONNÉES QU'ON DONNE AUX GENS EXISTENT-ELLES VRAIMENT ?
 *
 * POURQUOI CE FICHIER EXISTE (2026-07-12)
 *
 * Le 11 juillet, on a neutralisé le site parce qu'il servait des données inventées :
 * une voie de recours qui n'existe pas, un délai qui n'existe pas, des adresses
 * d'autorités hallucinées (« Bäumleingasse 5 » au lieu de « Bäumleingasse 1 »).
 *
 * Le soir même, en écrivant le message qui remplace le triage — celui que voit la
 * personne à qui on dit « allez plutôt voir un humain » — j'ai donné le numéro
 * « ASLOCA 021 617 10 07 ». Ce numéro n'existe pas. Je l'ai inventé.
 * L'annuaire du repo en contenait un autre (021 617 11 37), faux aussi. Le vrai est
 * le 021 617 16 17. Puis, en corrigeant, j'ai écrit une URL Caritas qui renvoie 404.
 * En dix minutes. Après avoir rédigé vingt lignes de commentaire sur ce piège exact.
 *
 * LA LEÇON : le réflexe d'écrire une donnée plausible est plus fort que la conscience
 * du problème. La vigilance ne suffit pas. Il faut une MACHINE qui vérifie.
 *
 * CE TEST EST CETTE MACHINE. Il appelle réellement chaque lien qu'on met sous les yeux
 * d'une personne en détresse. Si un jour l'un d'eux meurt, ce test devient rouge — et
 * personne n'enverra plus quelqu'un dans le vide.
 *
 * Réseau requis : ne tourne PAS dans la suite par défaut (elle doit rester hors-ligne).
 *   npm run test:ressources
 * À lancer avant chaque déploiement, et une fois par mois.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { _internals, safeModeNotice } from '../src/services/safe-mode.mjs';

const TIMEOUT_MS = 15000;

async function estVivant(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // redirect: 'follow' — une redirection est légitime (www, /fr, etc.).
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal });
    return { ok: res.status >= 200 && res.status < 400, status: res.status };
  } catch (err) {
    return { ok: false, status: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(t);
  }
}

describe('Les ressources qu’on donne à un citoyen en détresse', () => {
  it('chaque lien d’aide répond réellement (aucune URL inventée)', { timeout: 90000, skip: !process.env.TEST_SOURCES }, async () => {
    // Les liens internes (/annuaire.html) sont servis par le site lui-même : couverts
    // par la suite HTTP. Ici on ne teste que ce qui pointe vers le MONDE EXTÉRIEUR —
    // c'est là qu'on invente, et c'est là que les choses meurent sans prévenir.
    const externes = _internals.RESOURCES.map(r => r.url).filter(u => u?.startsWith('http'));
    assert.ok(externes.length >= 4, 'on doit proposer plusieurs portes de sortie');

    const morts = [];
    for (const url of externes) {
      const r = await estVivant(url);
      if (!r.ok) morts.push(`${url} → ${r.status}`);
    }

    assert.deepEqual(morts, [],
      'Un lien mort envoie quelqu’un dans le vide au pire moment de sa vie :\n  ' + morts.join('\n  '));
  });

  it('on ne publie QUE des numéros courts nationaux (117 / 142 / 143 / 144 / 147)', () => {
    // Ces numéros-là sont immuables, gratuits et valables dans toute la Suisse.
    // Tout autre numéro est une coordonnée locale : elle a des antennes régionales,
    // elle change, et on l'a déjà inventée deux fois (ASLOCA) ou laissée périmer
    // (le LAVI 0848, remplacé par le 142 le 1er mai 2026 sans que personne ne le voie).
    // Pour tout le reste : le LIEN officiel, qui route vers la bonne permanence.
    const NATIONAUX = new Set(['117', '118', '142', '143', '144', '145', '147']);

    for (const r of [..._internals.EMERGENCY, ..._internals.RESOURCES]) {
      if (!r.phone) continue;
      const brut = r.phone.replace(/[^\d]/g, '');
      assert.ok(NATIONAUX.has(brut),
        `« ${r.name} » publie le numéro ${r.phone}, qui n'est pas un numéro court national. ` +
        `On ne code en dur que 117/142/143/144/147. Pour le reste, donne l'URL officielle.`);
    }
  });

  it('le 142 — ligne nationale d’aide aux victimes — est bien donné (ouvert le 1er mai 2026)', () => {
    const urgences = JSON.stringify(_internals.EMERGENCY);
    assert.match(urgences, /"142"/,
      'Le 142 remplace les anciens numéros LAVI/VIVAVA depuis le 1er mai 2026. ' +
      'Le site a servi les anciens pendant deux mois et demi sans que personne ne le remarque.');
  });

  it('aucune ressource ne publie un numéro local codé en dur', () => {
    for (const r of _internals.RESOURCES) {
      assert.equal(r.phone, undefined,
        `« ${r.name} » publie un numéro en dur. Les organisations ont des antennes régionales : ` +
        `un numéro unique est déjà une simplification fausse. Donne l'URL officielle, elle route ` +
        `vers la bonne permanence.`);
    }
  });

  it('le citoyen coupé repart toujours avec une porte de sortie', () => {
    for (const lang of ['fr', 'de', 'it', 'en']) {
      const n = safeModeNotice(lang);
      assert.ok(n.resources?.length > 0, `aucune ressource en ${lang}`);
      assert.ok(n.emergency?.length > 0, `aucun numéro d'urgence en ${lang}`);
      assert.match(JSON.stringify(n.emergency), /117/, `le 117 doit être donné en ${lang}`);
    }
  });
});
