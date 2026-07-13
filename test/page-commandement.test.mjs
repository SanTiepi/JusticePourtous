/**
 * ⚠ LA PREMIÈRE CHOSE MONTRABLE — et ce qui ne doit jamais en disparaître
 *
 * POURQUOI CETTE PAGE EXISTE (2026-07-13)
 *
 * Robin, après avoir découvert que trois ans de travail servaient de faux conseils :
 *   « j'ai honte de montrer un truc pas abouti »
 *   « dire y'a un pb mais on a pas la solution ça aide personne »
 *
 * Il a raison sur les deux. Alors on ne montre pas le produit : on montre UNE PAGE, sans IA,
 * sans triage, sans paiement — et la SOLUTION EST DEDANS.
 *
 * Elle ne donne aucun conseil juridique. Elle CITE la loi. Trois phrases, littérales, vérifiables
 * par n'importe qui sur Fedlex :
 *
 *   · art. 18 OELP — « Les opérations relatives à l'opposition sont GRATUITES. »
 *   · art. 75 LP   — « Il n'est pas nécessaire de MOTIVER l'opposition. »
 *   · art. 74 LP   — « […] VERBALEMENT ou par écrit […] dans les DIX JOURS. »
 *
 * Des gens paient chaque année des dettes qu'ils ne doivent pas, parce que personne ne leur a dit
 * ces trois phrases. C'est le piège le plus courant du droit suisse, et le seul qu'on puisse
 * énoncer sans juriste — parce qu'on ne fait que lire à voix haute ce que l'État a écrit.
 *
 * ⚠ CES TESTS NE TESTENT PAS DU CODE. Ils testent que la page ne peut pas se mettre à nuire.
 * Une page HTML se réécrit en trois minutes ; une clause de sécurité se supprime en trente
 * secondes. Ce fichier est le cliquet.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE = readFileSync(join(__dirname, '..', 'src', 'public', 'commandement-de-payer.html'), 'utf8');

/**
 * ⚠ CE QUE LA PERSONNE VOIT — pas ce que le fichier contient.
 *
 * Première version de ce test : il lisait le fichier BRUT. Il est passé au rouge sur « c'est trop
 * tard »… trouvé dans MES PROPRES COMMENTAIRES — ceux qui expliquent qu'il ne faut jamais l'écrire.
 *
 * Le test attrapait le commentaire qui interdit la faute, au lieu de la faute. Il vérifiait le code
 * source ; il aurait dû vérifier la PAGE. Un garde-fou qui ne regarde pas au bon endroit ne garde
 * rien — il donne juste l'illusion de garder.
 */
const sansCommentaires = (html) => html
  .replace(/<!--[\s\S]*?-->/g, ' ')     // les commentaires HTML
  .replace(/\/\/[^\n]*/g, ' ')          // les commentaires JS
  .replace(/\/\*[\s\S]*?\*\//g, ' ');   // les blocs JS

const VU_PAR_LE_CITOYEN = sansCommentaires(PAGE);

const PAGE_DE = readFileSync(join(__dirname, '..', 'src', 'public', 'zahlungsbefehl.html'), 'utf8');
const VU_EN_ALLEMAND = sansCommentaires(PAGE_DE);

describe('La page « commandement de payer » — ce qui ne doit jamais en disparaître', () => {
  it('LES TROIS FAITS SONT CITÉS, PAS RÉSUMÉS — c’est toute sa raison d’être', () => {
    // Une paraphrase engage celui qui l'écrit. Une citation engage la Confédération.
    // C'est la différence entre du conseil juridique (interdit à Robin) et de la lecture
    // à voix haute (que personne ne peut lui reprocher).
    assert.match(PAGE, /Les opérations relatives à l'opposition sont <b>gratuites<\/b>/,
      '⚠ la citation littérale de l\'art. 18 OELP a disparu — sans elle, « c\'est gratuit » redevient une affirmation de Robin, et non celle de la loi');
    assert.match(PAGE, /pas nécessaire de motiver<\/b> l'opposition/,
      '⚠ la citation littérale de l\'art. 75 LP a disparu');
    assert.match(PAGE, /<b>verbalement<\/b> ou par écrit/,
      '⚠ la citation littérale de l\'art. 74 LP a disparu — c\'est CE mot qui dit aux gens qu\'ils peuvent simplement entrer et parler');
    assert.match(PAGE, /<b>dans les dix jours<\/b>/, 'le délai de dix jours a disparu du texte cité');
  });

  it('CHAQUE SOURCE EST VÉRIFIABLE PAR LE LECTEUR LUI-MÊME', () => {
    // « Vérifiez-moi » est la seule promesse qu'on puisse tenir. Le lien doit mener au texte,
    // pas à une page « à propos ».
    for (const art of ['art_74', 'art_75', 'art_88', 'art_89']) {
      assert.match(PAGE, new RegExp(`fedlex\\.admin\\.ch[^"]*#${art}`),
        `le lien direct vers ${art} LP sur Fedlex a disparu — le lecteur ne peut plus vérifier`);
    }
    assert.match(PAGE, /fedlex\.admin\.ch[^"]*#art_18/, 'le lien vers l\'art. 18 OELP a disparu');
  });

  it('⚠ LA RÈGLE DE FER : la page ne dit JAMAIS « c’est trop tard »', () => {
    // En droit suisse, agir est presque toujours gratuit, informel et sans risque. C'est le
    // SILENCE qui est irréversible. Décourager quelqu'un produit exactement l'inégalité que ce
    // site combat : celui qui a un ami juriste, lui, y va quand même.
    //
    // Et ici le calcul de délai est le seul endroit où la tentation existe : quand le compteur
    // passe sous zéro, il serait « logique » d'écrire « trop tard ». On ne l'écrit pas.
    assert.doesNotMatch(VU_PAR_LE_CITOYEN, /(c'est (trop tard|foutu|fini)|il n'y a plus rien à faire|vous avez perdu)/i,
      '⚠⚠ LA PAGE DÉCOURAGE QUELQU\'UN. C\'est la seule chose qu\'elle n\'a pas le droit de faire : ne rien faire est irréversible, y aller ne coûte rien.');

    // Et quand le délai paraît échu, elle doit ENVOYER LA PERSONNE quand même.
    assert.match(PAGE, /Allez à l'office des poursuites quand même/,
      '⚠ quand le délai paraît dépassé, la page n\'envoie plus la personne à l\'office. Elle la laisse chez elle à croire que c\'est fichu.');
    assert.match(PAGE, /restitution de délai/i,
      'la page ne mentionne plus la restitution du délai (art. 33 al. 4 LP) — la seule porte qui reste');
  });

  it('ELLE DIT CE QU’ELLE NE SAIT PAS — c’est ce qui la rend inoffensive', () => {
    assert.match(PAGE, /je ne suis pas juriste/i,
      '⚠ la page ne dit plus que Robin n\'est pas juriste. Elle devient du conseil juridique, et il n\'a ni société ni assurance.');
    assert.match(PAGE, /ne vous dit pas si vous devez cet argent/i,
      'la page ne dit plus qu\'elle ignore si la dette est due — or c\'est justement ce qu\'elle ne peut pas savoir');
    assert.match(PAGE, /si quelque chose est faux ici/i,
      'le « dites-moi où c\'est faux » a disparu — c\'est la seule chose qui transforme une page en boucle de correction');
  });

  it('LE FAIT QUE PERSONNE NE CONNAÎT : sans opposition, aucun juge ne vérifie la dette', () => {
    // C'est le cœur. J'avais moi-même inventé le contraire ce matin (« le créancier devra de
    // toute façon obtenir la mainlevée devant un juge ») — une fausse bonne nouvelle qui endort
    // quelqu'un pendant que la saisie arrive. Les art. 88 et 89 LP disent l'inverse.
    assert.match(PAGE, /Lorsque la poursuite n'est pas suspendue par l'opposition/,
      '⚠ la citation de l\'art. 88 al. 1 LP a disparu');
    assert.match(PAGE, /sans retard à la saisie/,
      '⚠ la citation de l\'art. 89 LP a disparu — c\'est ELLE qui dit que personne ne viendra vérifier');
    assert.match(PAGE, /aucun juge\s*<\/strong>?\s*ne viendra vérifier|aucun juge/i,
      'la conséquence n\'est plus dite en clair au lecteur');
  });

  it('AUCUNE COORDONNÉE INVENTÉE — pas un numéro, pas une adresse', () => {
    // Trois récidives en une journée : le numéro d'ASLOCA, une URL Caritas en 404, une table de
    // codes postaux écrite de mémoire DANS le test censé attraper les données inventées.
    // Cette page ne donne AUCUN contact : l'adresse de l'office figure sur le commandement de
    // payer que la personne a dans les mains. C'est la seule source qu'on ne peut pas halluciner.
    const numeros = PAGE.match(/\b0\d{2}[\s.]?\d{3}[\s.]?\d{2}[\s.]?\d{2}\b/g) || [];
    assert.deepEqual(numeros, [],
      `⚠ la page publie un numéro de téléphone (${numeros.join(', ')}). On en a déjà inventé un. Aucun contact en dur.`);

    assert.match(PAGE, /elle figure sur le commandement de payer/i,
      'la page n\'indique plus que l\'adresse de l\'office est SUR le document — elle va donc être tentée de l\'inventer');
  });

  it('LE TITRE EST CE QUE LA PERSONNE TAPE — pas ce qu’on voudrait dire', () => {
    // C'est le SEUL canal qui n'exige de Robin aucun coup de téléphone, aucune confiance à
    // construire, aucune honte à surmonter : la page se fait trouver par quelqu'un qui cherche
    // DÉJÀ. À 23h, seul, avec la lettre sur la table. Un titre qui ne contient pas ses mots à lui
    // rend la page invisible — et une page invisible n'aide personne, exactement comme le site.
    assert.match(PAGE, /<title>[^<]*commandement de payer[^<]*que faire/i,
      '⚠ le titre ne contient plus « commandement de payer » ET « que faire ». C\'est ce que la personne tape. Sans ça, la page n\'existe pas.');
    assert.match(PAGE_DE, /<title>[^<]*Zahlungsbefehl[^<]*was tun/i,
      '⚠ le titre allemand ne contient plus « Zahlungsbefehl » ET « was tun »');
  });

  it('ELLE NE FAIT PAS SEMBLANT D’ÊTRE PLUS QU’ELLE N’EST', () => {
    assert.match(PAGE, /que le commandement de payer/i,
      'la page ne borne plus son périmètre — elle va se mettre à conseiller sur la mainlevée, la faillite, la suite');
    assert.doesNotMatch(VU_PAR_LE_CITOYEN, /\b(IA|intelligence artificielle|chatbot|triage)\b/i,
      '⚠ la page parle d\'IA. Elle ne doit RIEN promettre d\'autre que trois citations de la loi — c\'est exactement ce qui la rend montrable sans honte.');
  });
});

describe('La page allemande — le texte est LU, jamais traduit', () => {
  // ⚠ ON NE TRADUIT PAS UNE LOI. On va chercher la version allemande sur Fedlex, qui fait foi au
  // même titre que la française. Traduire un texte de loi, c'est le RÉÉCRIRE — et c'est très
  // exactement le geste qui a produit les 314 fiches hallucinées de ce projet.
  // Les mots ci-dessous sont ceux de la Confédération, pas les miens.

  it('les trois faits sont dans le texte ALLEMAND OFFICIEL, mot pour mot', () => {
    assert.match(PAGE_DE, /Die mit dem Rechtsvorschlag verbundenen Verrichtungen sind <b>gebührenfrei<\/b>/,
      '⚠ la citation littérale de l\'art. 18 GebV SchKG a disparu (« gebührenfrei »)');
    assert.match(PAGE_DE, /<b>Der Rechtsvorschlag bedarf keiner Begründung\.<\/b>/,
      '⚠ la citation littérale de l\'art. 75 SchKG a disparu');
    assert.match(PAGE_DE, /<b>mündlich<\/b> oder schriftlich/,
      '⚠ « mündlich » a disparu — c\'est CE mot qui dit aux gens qu\'ils peuvent simplement entrer et parler');
    assert.match(PAGE_DE, /<b>innert zehn Tagen<\/b>/, 'le délai de dix jours a disparu du texte allemand');
    assert.match(PAGE_DE, /<b>unverzüglich die Pfändung zu vollziehen<\/b>/,
      '⚠ l\'art. 89 SchKG a disparu — c\'est lui qui dit que personne ne viendra vérifier la dette');
  });

  it('⚠ LA RÈGLE DE FER TIENT AUSSI EN ALLEMAND : jamais « zu spät »', () => {
    assert.doesNotMatch(VU_EN_ALLEMAND, /(es ist zu spät|nichts mehr zu machen|Sie haben verloren)/i,
      '⚠⚠ LA PAGE ALLEMANDE DÉCOURAGE QUELQU\'UN. Ne rien faire est irréversible ; y aller ne coûte rien.');
    assert.match(PAGE_DE, /Gehen Sie trotzdem heute zum Betreibungsamt/,
      '⚠ quand la frist paraît écoulée, la page allemande n\'envoie plus la personne au guichet');
    assert.match(PAGE_DE, /Wiederherstellung der Frist/,
      'la restitution du délai (art. 33 al. 4 SchKG) a disparu — c\'est la seule porte qui reste');
  });

  it('elle avoue les mêmes limites, en allemand', () => {
    assert.match(PAGE_DE, /Ich bin kein Jurist/i,
      '⚠ la page allemande ne dit plus que Robin n\'est pas juriste — elle devient du conseil juridique');
    assert.match(PAGE_DE, /Wenn hier etwas falsch ist, sagen Sie es mir/i,
      'le « dites-moi où c\'est faux » a disparu de la version allemande');
  });

  it('les liens Fedlex pointent vers la version ALLEMANDE (/de), pas la française', () => {
    // Envoyer un lecteur germanophone vérifier dans un texte français, c'est lui dire
    // « fais-moi confiance ». C'est exactement ce qu'on ne veut plus jamais demander à personne.
    for (const art of ['art_74', 'art_75', 'art_88', 'art_89']) {
      assert.match(PAGE_DE, new RegExp(`fedlex\\.admin\\.ch[^"]*/de#${art}`),
        `le lien allemand vers ${art} SchKG a disparu (ou pointe vers le français)`);
    }
    assert.match(PAGE_DE, /fedlex\.admin\.ch[^"]*\/de#art_18/, 'le lien allemand vers l\'art. 18 GebV SchKG a disparu');
  });

  it('les deux pages se connaissent (hreflang) — sinon Google les traite comme des doublons', () => {
    assert.match(PAGE, /hreflang="de"[^>]*zahlungsbefehl\.html/, 'la page FR ne déclare plus sa jumelle allemande');
    assert.match(PAGE_DE, /hreflang="fr"[^>]*commandement-de-payer\.html/, 'la page DE ne déclare plus sa jumelle française');
  });

  it('aucune coordonnée inventée non plus en allemand', () => {
    const numeros = VU_EN_ALLEMAND.match(/\b0\d{2}[\s.]?\d{3}[\s.]?\d{2}[\s.]?\d{2}\b/g) || [];
    assert.deepEqual(numeros, [], `⚠ la page allemande publie un numéro (${numeros.join(', ')})`);
    assert.match(PAGE_DE, /sie steht auf dem Zahlungsbefehl/i,
      'la page allemande n\'indique plus que l\'adresse du Betreibungsamt est SUR le document');
  });
});
