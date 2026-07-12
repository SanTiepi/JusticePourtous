/**
 * ⚠ LA MACHINE QUI SURVEILLE — le mécanisme qui manquait depuis trois ans
 *
 * POURQUOI CE FICHIER EXISTE (2026-07-12)
 *
 * Ce projet n'a jamais eu de veille. Conséquences mesurées :
 *   - le numéro national d'aide aux victimes a changé le 1er mai 2026 (c'est le 142) :
 *     le site a servi l'ancien pendant deux mois et demi ;
 *   - le taux hypothécaire de référence est à 1,25 % depuis le 2 septembre 2025 :
 *     le projet affirmait 1,75 %, soit ~5,8 % de baisse de loyer qu'un locataire ne
 *     demandait pas (≈1 250 CHF/an sur un loyer de 1 800 CHF) ;
 *   - les adresses d'autorités étaient inventées (Bâle : « Bäumleingasse 5, 4001 » ;
 *     la vraie, publiée par la Confédération, est « Grenzacherstrasse 62, 4005 »).
 *
 * Le monde bouge. Une donnée juste pourrit en silence. La vigilance humaine n'y suffit
 * pas — on l'a prouvé le soir même de l'audit, en inventant un numéro de téléphone
 * dans le correctif censé réparer les données inventées.
 *
 * CE TEST EST LA MACHINE :
 *   1. il verrouille la STRUCTURE de la donnée (rien ne doit y entrer sans source) ;
 *   2. il vérifie la COHÉRENCE (un code postal suisse, un canton réel) ;
 *   3. et, en mode réseau, il va voir si la Confédération a publié une NOUVELLE version
 *      de la liste — auquel cas il devient rouge, et quelqu'un doit la ré-extraire.
 *
 * Le test réseau ne tourne pas dans la suite par défaut (elle doit rester hors-ligne) :
 *   npm run test:sources
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROUTES = JSON.parse(
  readFileSync(join(__dirname, '..', 'src', 'data', 'routes', 'conciliation-bail.json'), 'utf8')
);

// Les 26 cantons, tels que la Confédération les nomme dans le document.
const CANTONS_SUISSES = new Set([
  'Aargau', 'Appenzell Ausserrhoden', 'Appenzell Innerrhoden', 'Basel-Landschaft',
  'Basel-Stadt', 'Bern / Berne', 'Freiburg / Fribourg', 'Genève', 'Glarus', 'Graubünden',
  'Jura', 'Luzern', 'Neuchâtel', 'Nidwalden', 'Obwalden', 'Schaffhausen', 'Schwyz',
  'Solothurn', 'St. Gallen', 'Thurgau', 'Ticino', 'Uri', 'Vaud', 'Wallis / Valais',
  'Zug', 'Zürich'
]);

describe('Routes d’action — autorités de conciliation en matière de bail', () => {
  it('couvre les 26 cantons (sinon un citoyen tombe dans un trou)', () => {
    const couverts = new Set(ROUTES.map(r => r.canton));
    const manquants = [...CANTONS_SUISSES].filter(c => !couverts.has(c));
    assert.deepEqual(manquants, [], `cantons sans aucune autorité : ${manquants.join(', ')}`);
  });

  it('AUCUNE donnée sans source : chaque entrée dit d’où elle vient et quand', () => {
    for (const r of ROUTES) {
      assert.ok(r.source?.startsWith('https://www.bwo.admin.ch/'),
        `${r.autorite} : pas de source officielle`);
      assert.match(r.verifie_le, /^\d{4}-\d{2}-\d{2}$/,
        `${r.autorite} : pas de date de vérification`);
      assert.ok(r.statut?.startsWith('lu_source_officielle'),
        `${r.autorite} : statut suspect (${r.statut}) — une donnée non lue à la source n'a rien à faire ici`);
    }
  });

  it('CE QUI MANQUE EST DIT — un champ absent vaut null, jamais une supposition', () => {
    for (const r of ROUTES) {
      // C'est la règle qui a manqué pendant trois ans : plutôt que d'écrire une valeur
      // plausible, on déclare le trou. Un trou déclaré est une information ; une valeur
      // inventée est un piège.
      const trous = ['adresse', 'npa', 'localite', 'telephone', 'email'].filter(k => !r[k]);
      if (trous.length) {
        assert.deepEqual(r.champs_manquants?.sort(), trous.sort(),
          `${r.autorite} : des champs sont vides sans être déclarés manquants`);
        assert.equal(r.statut, 'lu_source_officielle_incomplet',
          `${r.autorite} : une entrée incomplète doit le dire dans son statut`);
      }
    }
  });

  it('la donnée est cohérente (code postal suisse, canton réel, e-mail bien formé)', () => {
    for (const r of ROUTES) {
      assert.ok(CANTONS_SUISSES.has(r.canton), `canton inconnu : ${r.canton}`);

      const npa = Number(r.npa);
      assert.ok(Number.isInteger(npa) && npa >= 1000 && npa <= 9999,
        `${r.autorite} : « ${r.npa} » n'est pas un code postal suisse`);

      if (r.email) {
        assert.match(r.email, /^[\w.\-+]+@[\w.\-]+\.\w+$/, `${r.autorite} : e-mail mal formé`);
      }
      // Une autorité sans nom est TOLÉRÉE si — et seulement si — elle le DÉCLARE.
      // Le trou déclaré est une information honnête ; le trou silencieux est un piège.
      if (!r.autorite) {
        assert.ok(r.champs_manquants?.includes('autorite'),
          `entrée sans nom qui ne le déclare pas : ${r.npa} ${r.localite}`);
      } else {
        assert.ok(r.autorite.length > 3, `nom d'autorité suspect : « ${r.autorite} »`);
      }
    }
  });

  /* ⚠ LE TEST « LE CODE POSTAL APPARTIENT AU CANTON » N'EXISTE PAS ENCORE — ET VOICI POURQUOI.
   *
   * Il DOIT exister : sans lui, une autorité de ZOUG (Baarerstrasse 131, 6300 Zug) s'était
   * retrouvée rattachée au VALAIS, et tous les tests étaient verts. (Bug corrigé : le
   * regroupement des lignes du PDF par arrondi coupait une ligne en deux.)
   *
   * J'ai donc écrit ce test avec une table « plages de codes postaux par canton »… que j'ai
   * remplie DE MÉMOIRE. Elle était fausse : elle accusait Zofingen (4800, Argovie), Le
   * Noirmont (2340, Jura) et La Chaux-de-Fonds (2300, Neuchâtel) d'être dans le mauvais
   * canton. Toutes ces adresses sont justes ; c'est ma table qui était inventée.
   *
   * Autrement dit : j'ai inventé une table de référence à l'intérieur du test dont la
   * fonction est d'attraper les données inventées. TROISIÈME récidive dans la même journée,
   * après le numéro d'ASLOCA et l'URL de Caritas. La leçon ne se laisse pas apprendre par
   * la volonté — seulement par le mécanisme.
   *
   * CE QU'IL FAUT FAIRE (et surtout pas bricoler à 2h du matin) :
   * charger le RÉPERTOIRE OFFICIEL DES LOCALITÉS (swisstopo, gratuit, mis à jour
   * mensuellement, ~4100 localités avec code postal) :
   *   https://opendata.swiss/fr/dataset/amtliches-ortschaftenverzeichnis-mit-postleitzahl-und-perimeter
   * et vérifier chaque couple (code postal, canton) contre lui.
   *
   * En attendant, ce trou est DÉCLARÉ plutôt que comblé par une supposition — c'est
   * exactement la règle qu'on applique aux données elles-mêmes.
   */

  it('la saisine reste annoncée comme GRATUITE (art. 113 al. 2 let. c CPC)', () => {
    // Le fait le plus utile de tout le droit du bail suisse, et le plus ignoré : saisir
    // l'autorité de conciliation ne coûte rien. Quelqu'un qui l'ignore renonce à son
    // droit en croyant qu'il n'a pas les moyens. Ça ne doit jamais disparaître d'ici.
    for (const r of ROUTES) {
      assert.match(r.cout, /gratuit/i, `${r.autorite} : le coût doit être annoncé`);
    }
  });
});

describe('Veille — la Confédération a-t-elle publié une nouvelle version ?', () => {
  // Ce test SORT sur le réseau : il ne tourne que via `npm run test:sources`.
  // Il est la réponse directe au 142 (changé sans qu'on le voie) et au taux de
  // référence (périmé de deux paliers). Une source qui bouge doit nous réveiller.
  const AVEC_RESEAU = process.env.TEST_SOURCES === '1';

  it('la page officielle de l’OFL est toujours en ligne et pointe vers une liste', { skip: !AVEC_RESEAU }, async () => {
    const res = await fetch('https://www.bwo.admin.ch/fr/procedure-de-conciliation', { redirect: 'follow' });
    assert.ok(res.ok, `la source officielle ne répond plus (HTTP ${res.status}) — la donnée est orpheline`);

    const html = await res.text();
    const lien = html.match(/href="([^"]*Schlichtungsbeh[^"]*\.pdf)"/i);
    assert.ok(lien, 'la page ne propose plus de liste PDF — le format a changé, il faut ré-adapter l’extraction');

    // Le nom du fichier porte sa date : 20260708_Schlichtungsbehörden.pdf
    const dateFichier = lien[1].match(/(\d{8})_/);
    assert.ok(dateFichier, 'impossible de dater la liste publiée');

    const publiee = dateFichier[1];                       // AAAAMMJJ
    const extraite = (ROUTES[0]?.source_document || '').match(/(\d{8})_/)?.[1];

    assert.equal(publiee, extraite,
      `⚠ LA CONFÉDÉRATION A PUBLIÉ UNE NOUVELLE LISTE (${publiee}, la nôtre date du ${extraite}). ` +
      `Des adresses ont peut-être changé. Relancer : python scripts/extract-autorites-conciliation.py`);
  });
});
