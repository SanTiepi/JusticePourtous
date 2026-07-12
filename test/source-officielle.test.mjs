/**
 * ⚠ LA MACHINE QUI VA LIRE LA LOI — et ce qu'elle ne doit jamais cesser de faire
 *
 * POURQUOI CE FICHIER EXISTE (2026-07-12)
 *
 * Un comité de cinq agents adverses a conseillé à une personne d'écrire une « opposition »
 * à l'office AI, alors qu'il n'existe PAS d'opposition en assurance-invalidité (art. 69
 * al. 1 let. a LAI, qui déroge expressément aux art. 52 et 58 LPGA). Elle aurait attendu une
 * réponse qui ne viendrait jamais, pendant que ses 30 jours de recours s'éteignaient.
 *
 * Le chasseur de pièges avait pourtant trouvé la vérité. Le réfutateur l'a détruite en
 * invoquant l'ATF 130 V 388 — un arrêt qui parle d'une caisse de chômage et ne dit rien de
 * tel. Le juge l'a cru : il n'avait aucun moyen d'ouvrir le code de loi.
 *
 * LA LEÇON, qui est contre-intuitive : dans un débat sans accès aux pièces, l'hallucination
 * part GAGNANTE. Une citation vraie est contrainte par le texte ; une citation inventée ne
 * l'est par rien — elle peut être exactement l'argument qui manquait, avec l'autorité qui
 * manquait. Ajouter de la contradiction sans ajouter d'accès au réel rend le système MOINS
 * fiable, pas plus.
 *
 * Ce module est l'accès au réel. Ces tests protègent ce qui, dedans, ne doit jamais casser.
 *
 * Les tests réseau ne tournent PAS dans la suite par défaut (elle doit rester hors-ligne) :
 *   npm run test:sources
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOIS, lireArticle, citationEstDansLeTexte } from '../src/services/source-officielle.mjs';

const AVEC_RESEAU = process.env.TEST_SOURCES === '1';
const AUJ = { dateDuJour: '2026-07-12' };

describe('Le lecteur de loi — hors ligne', () => {
  it('une jurisprudence n’est JAMAIS vérifiable, donc elle ne pèse rien', async () => {
    // C'est LE verrou. L'ATF inventé doit rester irrecevable pour toujours : un agent ne
    // pourra plus jamais détruire un texte de loi avec un arrêt qu'il croit se rappeler.
    const r = await lireArticle({ loi: 'ATF', article: '130 V 388' }, AUJ);
    assert.equal(r.lisible, false);
    assert.equal(r.statut, 'source_non_verifiable');
    assert.match(r.pourquoi, /rente/,
      'le module a oublié POURQUOI il refuse la jurisprudence — la raison doit rester dans le message, sinon quelqu\'un la « corrigera » un jour');
  });

  it('on ne prétend jamais avoir vérifié une loi qu’on ne sait pas lire', async () => {
    for (const loi of ['LDIP', 'OBLF', 'CEDH', 'doctrine']) {
      const r = await lireArticle({ loi, article: '1' }, AUJ);
      assert.equal(r.lisible, false, `« ${loi} » est traitée comme vérifiable alors qu'elle n'est pas dans LOIS`);
    }
  });

  it('les lois du quotidien juridique suisse sont toutes déclarées', () => {
    // Une loi absente d'ici rend TOUTES ses citations invérifiables — donc sans poids dans
    // le comité. Un trou ici est un trou dans la capacité du produit à défendre quelqu'un.
    for (const loi of ['CO', 'CC', 'CPC', 'LP', 'LPGA', 'LAI', 'LAA', 'LAMal', 'LACI', 'LEI']) {
      assert.ok(LOIS[loi], `${loi} n'est plus déclarée : toutes ses citations deviendraient irrecevables`);
    }
  });

  it('la comparaison de citation tolère la forme, jamais le sens', () => {
    const officiel = "En dérogation aux art. 52 et 58 LPGA : a. les décisions des offices AI cantonaux peuvent directement faire l'objet d'un recours devant le tribunal des assurances du domicile de l'office concerné";

    // Les agents reformulent, changent la ponctuation, les apostrophes. Ce n'est pas mentir.
    assert.ok(citationEstDansLeTexte(
      "en dérogation aux art. 52 et 58 LPGA, les décisions des offices AI cantonaux peuvent directement faire l'objet d'un recours devant le tribunal des assurances",
      officiel).ok, 'une reformulation fidèle est rejetée — le filtre deviendrait une machine à tout écarter');

    // Mais inventer un contenu qui n'y est pas, ça, ça doit tomber.
    assert.ok(!citationEstDansLeTexte(
      "les décisions de l'office AI doivent d'abord faire l'objet d'une opposition auprès de l'office qui rend ensuite une décision sur opposition",
      officiel).ok, 'une citation FABRIQUÉE passe le filtre — c\'est exactement ce qui a coûté la rente');
  });
});

describe('Le lecteur de loi — contre la source réelle (Fedlex)', { skip: !AVEC_RESEAU }, () => {
  it('art. 69 LAI : la dérogation qui décide de la rente est TOUJOURS là', async () => {
    const r = await lireArticle({ loi: 'LAI', article: '69' }, AUJ);
    assert.ok(r.lisible, `art. 69 LAI illisible (${r.statut}) — le comité redevient aveugle sur le cas qui a tout déclenché`);

    assert.match(r.texte, /en dérogation aux art\.?\s*52 et 58 LPGA/i,
      '⚠ L\'ART. 69 LAI NE CONTIENT PLUS SA DÉROGATION. Soit la loi a changé (et alors le conseil « pas d\'opposition en AI » doit être revu de toute urgence), soit notre lecture est cassée. Dans les deux cas : NE PAS IGNORER.');
    assert.match(r.texte, /recours/i, 'l\'art. 69 LAI ne parle plus de recours');

    // Le détecteur de dérogation est ce qui permet au juge de trancher un conflit de normes.
    // Sans lui, l'art. 52 LPGA (règle générale) l'emporte sur l'art. 69 LAI (règle spéciale),
    // et la rente est perdue.
    assert.ok(r.derogation, 'le détecteur de dérogation ne repère plus l\'art. 69 LAI');

    // ⚠ ET IL DOIT NOMMER LES ARTICLES ÉCARTÉS. Une première version du détecteur coupait sur
    // le premier point — or « art. » contient un point. Le juge recevait « En dérogation aux
    // art » et n'apprenait JAMAIS qu'il s'agissait des art. 52 et 58 LPGA. Il a reconseillé
    // l'opposition. Une bannière tronquée est pire qu'une bannière absente : elle a l'air
    // d'avoir informé.
    assert.match(r.derogation, /52/,
      'la dérogation ne nomme plus l\'art. 52 LPGA (l\'opposition) : le juge ne peut plus savoir QUOI écarter, et il reconseillera l\'acte qui fait perdre la rente');
    assert.match(r.derogation, /58/,
      'la dérogation ne nomme plus l\'art. 58 LPGA');
  });

  it('art. 52 LPGA : l’opposition EXISTE bien — la règle générale est vraie, c’est son application à l’AI qui est fausse', async () => {
    // Nuance vitale : le réfutateur n'avait pas inventé l'art. 52 LPGA. Il existe, et il dit
    // bien ce qu'il disait. Son erreur était de l'appliquer à un domaine qui y déroge.
    // Un filtre qui rejetterait l'art. 52 LPGA serait faux lui aussi.
    const r = await lireArticle({ loi: 'LPGA', article: '52' }, AUJ);
    assert.ok(r.lisible);
    assert.match(r.texte, /opposition/i);
    assert.match(r.texte, /trente jours/i);
  });

  it('art. 88 LP : sans opposition, le créancier continue SANS juge (le filet que j’avais inventé n’existe pas)', async () => {
    // Mon propre oracle promettait qu'après le délai d'opposition, « le créancier devra de
    // toute façon obtenir la mainlevée devant un juge, où le débiteur peut se défendre ».
    // C'est FAUX, et c'est une fausse bonne nouvelle — le pire genre : elle endort quelqu'un
    // pendant que la saisie arrive.
    const r = await lireArticle({ loi: 'LP', article: '88' }, AUJ);
    assert.ok(r.lisible);
    assert.match(r.texte, /(continuation|continuer)/i,
      'l\'art. 88 LP ne dit plus que la poursuite se continue sans opposition — vérifier avant de re-promettre un filet');
  });

  it('art. 336c CO : la protection contre le congé pendant la maladie tient toujours', async () => {
    const r = await lireArticle({ loi: 'CO', article: '336c' }, AUJ);
    assert.ok(r.lisible);
    assert.match(r.texte, /(incapacité de travail|maladie)/i);
    assert.match(r.texte, /90 jours/,
      '⚠ la période de protection de 90 jours (2e à 5e année de service) a disparu du texte — la loi a-t-elle changé ?');
  });

  it('on lit la version EN VIGUEUR, jamais la dernière publiée', async () => {
    // Fedlex publie les révisions EN AVANCE : au 12.07.2026, la LAI a déjà une consolidation
    // applicable au 01.01.2027. Servir un droit qui n'existe pas encore est une faute
    // exactement aussi grave que d'en servir un périmé.
    const r = await lireArticle({ loi: 'LAI', article: '69' }, AUJ);
    assert.ok(r.en_vigueur_depuis <= '2026-07-12',
      `on sert une version applicable au ${r.en_vigueur_depuis} — un droit qui n'existe pas encore`);
  });

  it('⚠ VEILLE — la date de comparaison doit rester du TEXTE, jamais du xsd:date', async () => {
    // Piège découvert le 12.07.2026 : avec un filtre de date TYPÉ, l'endpoint SPARQL écarte
    // SILENCIEUSEMENT la consolidation 2024 de la LPGA et remonte celle de 2022 — on servirait
    // un texte vieux de deux ans en croyant lire le droit en vigueur, sans le moindre message
    // d'erreur. Ce test attrape la régression si quelqu'un « corrige » la requête un jour.
    const r = await lireArticle({ loi: 'LPGA', article: '52' }, AUJ);
    assert.ok(r.en_vigueur_depuis >= '2024-01-01',
      `LPGA servie dans sa version du ${r.en_vigueur_depuis} : c'est la régression du filtre de date typé. La comparaison doit se faire sur str().`);
  });
});
