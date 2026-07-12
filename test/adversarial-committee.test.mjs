/**
 * ⚠ CE QUI NE DOIT JAMAIS DISPARAÎTRE DU COMITÉ
 *
 * POURQUOI CE FICHIER EXISTE (2026-07-12)
 *
 * Le comité d'origine (committee-engine.mjs) avait 4 rôles avec de vrais prompts et des
 * votes ÉCRITS EN DUR : l'avocat adverse concédait systématiquement. Personne ne s'en est
 * aperçu pendant des mois, parce qu'aucun test ne vérifiait que la contradiction avait
 * lieu — les tests vérifiaient la FORME de la sortie, pas qu'elle voulait dire quelque chose.
 *
 * Ces tests-ci ne testent pas du code. Ils testent que les GARDE-FOUS sont encore là.
 * Un prompt, ça se réécrit en trois secondes ; une clause de sécurité, ça se supprime en
 * une. Ce fichier est le cliquet.
 *
 * Ils tournent hors-ligne (aucun appel API) : ce sont des invariants de structure.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COMITE, redigerDossier, lireDerogation, trouverDerogations, estEcarteeParDerogation, _internals } from '../src/services/adversarial-committee.mjs';

describe('Le comité adverse — les garde-fous', () => {
  it('LA RÈGLE DE FER est dans TOUS les rôles : ne jamais dire « trop tard »', () => {
    // La règle la plus importante du produit, et la plus facile à perdre.
    // En droit suisse, agir est presque toujours gratuit et sans risque ; c'est le SILENCE
    // qui est irréversible. L'ancien calculateur de délais ignorait les féries — il pouvait
    // annoncer « trop tard » sur un droit encore ouvert. Un conseil qui décourage produit
    // exactement l'inégalité que ce projet combat : celui qui a un ami juriste, lui, y va.
    for (const role of COMITE) {
      assert.match(role.prompt, /trop tard/i,
        `${role.label} n'a plus l'interdiction de dire « trop tard » — un droit encore ouvert peut être abandonné`);
      assert.match(role.prompt, /silence/i,
        `${role.label} ne rappelle plus que c'est le SILENCE qui est irréversible`);
    }
  });

  it('AUCUN rôle n’a le droit d’inventer une coordonnée', () => {
    // Trois récidives en une seule journée : le numéro d'ASLOCA inventé, une URL Caritas
    // en 404, une table de codes postaux écrite de mémoire — DANS le test censé attraper
    // les données inventées. Le réflexe d'écrire une donnée plausible est plus fort que la
    // conscience du problème. Seule une interdiction explicite, dans chaque prompt, tient.
    for (const role of COMITE) {
      assert.match(role.prompt, /(fabrique|invente)/i,
        `${role.label} n'a plus l'interdiction de fabriquer une adresse / un numéro / une URL`);
    }
  });

  it('AUCUN rôle ne fait confiance à notre propre corpus', () => {
    // 24 % seulement des affirmations des 314 fiches sont correctes (audit contre Fedlex).
    // Un comité qui les recopie ne produit pas la vérité : il produit une erreur mieux
    // argumentée. Chaque rôle doit savoir que le dossier qu'on lui donne peut être faux.
    for (const role of COMITE) {
      assert.match(role.prompt, /(peut être faux|non validé|vérifie-les)/i,
        `${role.label} ne sait plus que le dossier fourni peut être FAUX`);
    }
  });

  it('LA CONTRADICTION A UNE CIBLE : le réfutateur attaque la thèse ET les pièges', () => {
    // C'est le cœur de la thèse de Robin. Un « comité » où chacun parle dans le vide n'est
    // pas adverse — c'est ce qu'était l'ancien : l'avocat adverse concédait toujours,
    // parce qu'il n'avait rien devant lui.
    const r = _internals.REFUTATEUR;
    assert.equal(r.tour, 2, 'le réfutateur doit passer APRÈS ceux qu\'il attaque — sinon il n\'a pas de cible');
    assert.match(r.prompt, /détruire|démolir|attaque/i, 'le réfutateur n\'attaque plus rien');
    assert.match(r.prompt, /piège/i,
      'le réfutateur n\'attaque plus les PIÈGES — un piège halluciné fait agir la personne à tort, c\'est pire qu\'un piège manqué');
    assert.match(r.prompt, /(survit|concède)/i,
      'le réfutateur ne peut plus CONCÉDER — un réfutateur qui attaque tout par principe n\'apporte aucune information, exactement comme un avocat qui concède tout');
  });

  it('le chasseur de pièges doit sourcer chaque piège (sinon il fait agir à tort)', () => {
    const c = _internals.CHASSEUR_DE_PIEGES;
    assert.match(c.prompt, /"preuve"/,
      'un piège sans article cité ferait courir la personne au mauvais guichet');
    assert.match(c.prompt, /a_verifier/,
      'le chasseur ne peut plus dire « je ne suis pas sûr » — une fausse certitude coûte un droit');
  });

  it('ON NE DEMANDE À PERSONNE DE RÉCITER LA LOI — on va la lire', () => {
    // La leçon la plus chère de la journée. Première version : on exigeait de chaque agent
    // qu'il RECOPIE le texte de l'article invoqué, et on écartait ce qu'on ne pouvait pas
    // vérifier. Résultat mesuré le soir même, sur le cas de la rente AI :
    //   · le CHASSEUR, qui avait RAISON, a répondu honnêtement « je sais que l'art. 69 LAI
    //     dit ça, mais je ne peux pas le citer mot à mot » → écarté ;
    //   · le RÉFUTATEUR, qui avait TORT, se souvenait par cœur de l'art. 52 LPGA (court et
    //     célèbre) → admis.
    // Exiger la récitation fabrique une prime à l'aplomb. Le filtre punissait l'honnête.
    for (const role of COMITE) {
      if (role.tour === 3) continue; // le juge, lui, LIT le tableau : il ne cite pas
      assert.match(role.prompt, /Tu n'as PAS à réciter la loi de mémoire/,
        `${role.label} : on lui redemande de citer la loi de mémoire. C'est le piège qui a coûté la rente.`);
    }
  });

  it('LA CHARGE DE LA PREUVE EST ASYMÉTRIQUE : on ne détruit pas un texte de loi avec un souvenir', () => {
    // Une citation vraie est contrainte : elle ne peut dire que ce que le texte dit.
    // Une citation inventée n'est contrainte par rien — elle peut être exactement l'argument
    // qui manquait. C'est pour ça qu'elle gagne, si personne n'ouvre le code de loi.
    const r = _internals.REFUTATEUR;
    assert.match(r.prompt, /(jurisprudence|pratique constante)/i,
      'le réfutateur peut de nouveau détruire une vérité avec une jurisprudence invoquée de mémoire');
    assert.match(r.prompt, /130 V 388/,
      'la trace de l\'arrêt fabriqué a disparu du prompt — c\'est la seule chose qui empêche de refaire la même erreur');
  });

  it('le juge lit la LOI, pas les avocats — et son habitude n’est pas une source du droit', () => {
    const j = _internals.JUGE;
    assert.match(j.prompt, /TU LIS LA LOI, PAS LES AVOCATS/,
      'le juge est retombé à lire des plaidoiries — c\'est ainsi qu\'il a couronné le mensonge le mieux habillé');
    assert.match(j.prompt, /écart[ée]/i,
      'le juge ne sait plus que la loi elle-même peut écarter un article : c\'est CE point (art. 69 LAI vs art. 52 LPGA) qui décidait de la rente');
    assert.match(j.prompt, /habitude n'est pas une source du droit/i,
      '⚠ On a mesuré que MONTRER la loi au juge ne suffit pas : il a lu « en dérogation aux art. 52 et 58 LPGA » et a quand même conseillé une opposition fondée sur l\'art. 52 LPGA, parce que « en assurance sociale, on fait opposition » est un réflexe plus fort que la lecture. Cet avertissement est ce qui reste quand la lecture ne suffit pas.');
  });
});

describe('La dérogation — le conflit de normes tranché par du code, pas par le juge', () => {
  // ⚠ LE MÉCANISME QUI SAUVE LA RENTE, et qui n'est PAS un prompt.
  //
  // On a essayé de montrer la loi au juge. Il l'a lue, et il a quand même conseillé
  // l'opposition à l'office AI. Le réflexe du modèle bat le texte qu'il vient de lire.
  // Alors on ne lui montre plus le conflit : on le TRANCHE avant lui, et on retire l'option.
  // Quand l'art. 69 LAI dit « en dérogation aux art. 52 et 58 LPGA », toute affirmation
  // fondée sur l'art. 52 LPGA sort du dossier. Le juge ne peut plus choisir la mauvaise porte,
  // parce qu'elle n'est plus là.

  it('LE CAS QUI A TOUT DÉCLENCHÉ : art. 69 LAI écarte les art. 52 et 58 LPGA', () => {
    const r = lireDerogation('En dérogation aux art. 52 et 58 LPGA', 'LAI');
    assert.deepEqual(r, [
      { loi: 'LPGA', article: '52', qualifie: false },
      { loi: 'LPGA', article: '58', qualifie: false },
    ], 'la dérogation qui supprime l\'opposition en assurance-invalidité n\'est plus lue — une personne peut de nouveau perdre sa rente');
  });

  it('un ALINÉA n’est pas un article (sinon on écarte des articles applicables)', () => {
    // Sur-écarter est aussi grave que sous-écarter : dans les deux cas, quelqu'un perd un droit.
    // Version naïve : « attrape tous les nombres ». Sur l'art. 68bis LAI, elle écartait les
    // art. 1, 2 et 3 LPGA — lus dans « al. 1 » et « au sens des al. 2 et 3 ».
    const r = lireDerogation("En dérogation à l’art. 32 LPGA et à l’art. 50 a , al. 1, LAVS , l’échange de données au sens des al. 2 et 3 peut aussi se faire oralement", 'LAI');
    const lpga = r.filter(x => x.loi === 'LPGA').map(x => x.article);
    assert.deepEqual(lpga, ['32'], `les alinéas sont relus comme des articles : on écarterait ${lpga.join(', ')} de la LPGA`);
  });

  it('chaque article est rattaché à SA loi, jamais à la première venue', () => {
    const r = lireDerogation("En dérogation à l’art. 32 LPGA et à l’art. 50 a , al. 1, LAVS", 'LAI');
    assert.ok(r.some(x => x.loi === 'LPGA' && x.article === '32'));
    assert.ok(!r.some(x => x.loi === 'LPGA' && x.article === '50'),
      'l\'art. 50 de la LAVS a été attribué à la LPGA — on écarterait un article qui s\'applique');
  });

  it('l’élision de la loi (« à l’art. 16 LPGA ») ne fait pas rater la dérogation', () => {
    const r = lireDerogation("en dérogation à l’art. 16 LPGA, en fonction de son incapacité", 'LAI');
    assert.deepEqual(r, [{ loi: 'LPGA', article: '16', qualifie: false }],
      'le token « l’art. » n\'est plus reconnu : la dérogation passe inaperçue et l\'article écarté revient dans le dossier');
  });

  /* ─────────────────────────────────────────────────────────────────────────────
   * LES TROIS PIÈGES TROUVÉS EN CONFRONTANT LE PARSEUR AUX 73 DÉROGATIONS RÉELLES
   * DU DROIT FÉDÉRAL (LAI, LPGA, CO, LP, CPC, LAA, LACI, LAMal — lues sur Fedlex).
   * Aucun n'avait été imaginé : il a fallu aller lire.
   * ───────────────────────────────────────────────────────────────────────────── */

  it('⚠ SUR-ÉCARTEMENT : un article simplement CITÉ après la dérogation n’est pas dérogé', () => {
    // Art. 58 LAI, texte réel : « en dérogation à l'art. 49, al. 1, LPGA, que la procédure
    // simplifiée prévue à l'art. 51 LPGA n'est pas applicable ».
    // L'art. 51 LPGA n'est PAS dérogé — il est mentionné dans la phrase. Le parseur naïf
    // l'écartait quand même, retirant du dossier un article parfaitement applicable.
    const r = lireDerogation("en dérogation à l’art. 49, al. 1, LPGA, que la procédure simplifiée prévue à l’art. 51 LPGA n’est pas applicable", 'LAI');
    assert.ok(!r.some(c => c.article === '51'),
      'l\'art. 51 LPGA est écarté alors qu\'il est seulement CITÉ — on retire à quelqu\'un un article qui s\'applique');
  });

  it('⚠ LES FÉRIES : « art. 63 du code des obligations » ne doit JAMAIS devenir l’art. 63 LP', () => {
    // Art. 86 LP, texte réel : « En dérogation à l'art. 63 du code des obligations (CO), la
    // preuve que la somme n'était pas due est la seule qui incombe au demandeur. »
    // Le nom de la loi est écrit en toutes lettres. Si on rattachait par défaut à la loi citante
    // (LP), on écarterait l'art. 63 LP — c'est-à-dire LES FÉRIES DE POURSUITE. On retirerait à
    // quelqu'un le report de son délai en croyant appliquer la loi. Le piège se referme au
    // millimètre.
    const r = lireDerogation("En dérogation à l’art. 63 du code des obligations (CO) , la preuve que la somme n’était pas due", 'LP');
    assert.deepEqual(r, [{ loi: 'CO', article: '63', qualifie: false }],
      '⚠ on écarte l\'art. 63 LP (les féries !) au lieu de l\'art. 63 CO — un délai encore ouvert serait déclaré mort');
  });

  it('une dérogation à un ALINÉA ne fait pas tomber l’article entier', () => {
    // Art. 34 LAI : « en dérogation à l'art. 28, al. 1, let. b ». Seul l'al. 1 let. b est écarté.
    // Retirer tout l'art. 28 LAI priverait la personne de ses autres alinéas, qui s'appliquent.
    // Sur les 73 dérogations réelles, 40 sont ainsi QUALIFIÉES : les écarter en bloc aurait
    // transformé le mécanisme qui sauve un droit en machine à en détruire.
    const r = lireDerogation("en dérogation à l’art. 28, al. 1, let. b, si le taux d’invalidité donne à nouveau droit", 'LAI');
    assert.equal(r.length, 1);
    assert.equal(r[0].qualifie, true,
      'la dérogation partielle (al. 1 let. b) est traitée comme totale : on écarterait tout l\'art. 28 LAI');
  });

  it('une dérogation à un simple alinéa du MÊME article n’écarte rien du tout', () => {
    // Art. 42 LAMal : « en dérogation à l'al. 1, est le débiteur de sa part de rémunération ».
    // Aucun article n'est visé : ne rien écarter est le comportement correct.
    assert.deepEqual(lireDerogation("en dérogation à l’al. 1, est le débiteur de sa part de rémunération", 'LAMal'), []);
  });

  it('LE CAS QUI COMPTE SURVIT À TOUS CES DURCISSEMENTS : art. 69 LAI écarte toujours', () => {
    // Le risque, en durcissant : casser le seul mécanisme qui ait jamais sauvé un droit.
    const r = lireDerogation("En dérogation aux art. 52 et 58 LPGA", 'LAI');
    assert.deepEqual(r, [
      { loi: 'LPGA', article: '52', qualifie: false },
      { loi: 'LPGA', article: '58', qualifie: false },
    ], 'la dérogation qui supprime l\'opposition en AI ne fonctionne plus — la rente est de nouveau perdue');
  });

  it('dossier à régime unique (AI seul) : la dérogation écarte pour de bon', () => {
    const registre = [
      { preuve: { loi: 'LAI', article: '69', regime: 'LAI' }, lecture: { lisible: true, derogation: 'En dérogation aux art. 52 et 58 LPGA' } },
      { preuve: { loi: 'LPGA', article: '52', regime: 'LAI' }, lecture: { lisible: true, derogation: null } },
    ];
    const d = trouverDerogations(registre);
    assert.deepEqual(d[0].ecarte.map(e => `${e.article} ${e.loi}`), ['52 LPGA', '58 LPGA'],
      'la dérogation n\'écarte plus rien sur un dossier purement AI : on a durci jusqu\'à casser ce qui marchait');
  });

  it('⚠⚠ DOSSIER MIXTE (AI + LAMal) : chaque droit est jugé DANS SON RÉGIME', () => {
    // LE TROU LE PLUS VICIEUX — et j'ai commis LES DEUX erreurs symétriques dans la même heure.
    //
    // L'art. 69 LAI supprime l'opposition POUR LES DÉCISIONS DES OFFICES AI. Pas en
    // assurance-maladie, où l'opposition (art. 52 LPGA) existe bel et bien. Or une personne
    // malade depuis trois ans peut très bien avoir un refus de rente AI ET un litige LAMal.
    //
    //   · Si j'écarte l'art. 52 LPGA GLOBALEMENT → je lui dis « il n'y a pas d'opposition », y
    //     compris pour son affaire LAMal. ELLE PERD CE DROIT-LÀ.
    //   · Si je n'écarte RIEN dès qu'il y a deux régimes (mon premier « garde-fou ») → le juge
    //     revoit l'art. 52 LPGA, suit son réflexe, et reconseille l'opposition à l'office AI.
    //     ELLE PERD SA RENTE. C'est Codex qui l'a vu : ma prudence recréait la faille qu'elle
    //     prétendait fermer.
    //
    // La seule sortie : SCOPER PAR AFFIRMATION. Chaque affirmation dit de quel régime elle relève.
    const registre = [
      { role: 'chasseur', texte: 'pas d\'opposition en AI', preuve: { loi: 'LAI', article: '69', regime: 'LAI' },
        lecture: { lisible: true, derogation: 'En dérogation aux art. 52 et 58 LPGA' } },
      { role: 'avocat', texte: 'faites opposition à l\'office AI', preuve: { loi: 'LPGA', article: '52', regime: 'LAI' },
        lecture: { lisible: true, derogation: null } },
      { role: 'avocat', texte: 'faites opposition à votre caisse-maladie', preuve: { loi: 'LPGA', article: '52', regime: 'LAMal' },
        lecture: { lisible: true, derogation: null } },
    ];
    const d = trouverDerogations(registre);
    const estEcartee = (r) => Boolean(estEcarteeParDerogation(r, d));
    const ecartees = registre.filter(estEcartee);

    assert.equal(ecartees.length, 1, 'exactement UNE affirmation doit tomber');
    assert.equal(ecartees[0].preuve.regime, 'LAI',
      '⚠ on a écarté l\'opposition LAMal : cette personne perd son droit d\'opposition en assurance-maladie');
    assert.ok(registre.some(r => r.preuve.regime === 'LAMal' && !estEcartee(r)),
      'l\'opposition LAMal a disparu du dossier — elle EXISTE pourtant, et c\'est un droit');
    assert.ok(registre.some(r => r.preuve.regime === 'LAI' && r.preuve.article === '52' && estEcartee(r)),
      '⚠ l\'opposition à l\'office AI est TOUJOURS dans le dossier : le juge va la reconseiller, et la rente est perdue');
  });

  it('L’IRRÉVERSIBLE EST INTERDIT SANS PREUVE : en cas de doute, l’acte conservatoire', () => {
    // Les deux erreurs ne coûtent pas la même chose : un acte inutile, c'est de la paperasse ;
    // le mauvais acte pendant que le vrai délai court, c'est le droit qui s'éteint.
    // Le triage n'a donc pas besoin d'avoir raison sur la doctrine — seulement sur ce qui se périme.
    const j = _internals.JUGE;
    assert.match(j.prompt, /IRRÉVERSIBLE/,
      'le juge ne distingue plus le rattrapable de l\'irréversible');
    assert.match(j.prompt, /CONSERVATOIRE/,
      'le juge ne recommande plus l\'acte conservatoire en cas de doute — il tranche, donc il peut se tromper de façon définitive');
  });

  it('le juge ne retient que ce qui a SURVÉCU, et n’efface pas les désaccords', () => {
    const j = _internals.JUGE;
    assert.equal(j.tour, 3);
    assert.match(j.prompt, /survécu/i, 'le juge ne trie plus par la survie à la réfutation');
    assert.match(j.prompt, /désaccord/i,
      'le juge peut de nouveau lisser les désaccords — or un désaccord honnête est exactement le moment où il faut un humain');
  });

  it('le juge tranche sur le modèle le plus fort (c’est là que l’erreur coûte un droit)', () => {
    assert.match(_internals.MODELE_JUGE, /opus/,
      'le juge est retombé sur un modèle plus faible — on économise sur la seule étape qu\'on ne peut pas rattraper');
  });

  it('le dossier annonce nos données comme SUSPECTES, et les autorités comme fiables', () => {
    const d = redigerDossier({
      texte_citoyen: 'Mon propriétaire ne me rend pas la garantie.',
      canton: 'Vaud',
      articles: [{ ref: 'art. 257e CO', texte: 'garantie…' }],
      autorites: [{ canton: 'Vaud', autorite: 'Commission de conciliation', npa: '1005', localite: 'Lausanne', champs_manquants: ['telephone'] }],
    });
    assert.match(d, /À VÉRIFIER, PAS À RECOPIER/,
      'les articles de notre corpus sont de nouveau présentés comme fiables — ils ne le sont pas');
    assert.match(d, /source officielle/i,
      'les autorités ne sont plus distinguées comme la seule donnée sûre');
    assert.match(d, /introuvable à la source/,
      'un champ manquant doit être DIT — un trou déclaré est une information, un trou comblé est un piège');
  });

  it('le récit du citoyen passe AVANT nos données (il est la seule source non polluée)', () => {
    const d = redigerDossier({
      texte_citoyen: 'PAROLE DU CITOYEN',
      articles: [{ ref: 'art. 1', texte: 'x' }],
    });
    assert.ok(d.indexOf('PAROLE DU CITOYEN') < d.indexOf('art. 1'),
      'nos données passent avant son récit — c\'est ainsi qu\'on répond à côté de la question');
  });
});
