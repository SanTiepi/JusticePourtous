/**
 * ⚠ LE COUPE-CIRCUIT JURIDIQUE — le test qui le verrouille (2026-07-11)
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Un audit a prouvé que le triage produisait du faux droit avec l'aplomb du vrai
 * (lettre d'« opposition AI » inexistante, lettre affirmant être dans un délai
 * que le moteur savait dépassé, délai « 7 jours » inventé sur la moisissure),
 * pendant que 2646 tests restaient verts. Les tests vérifiaient la FORME, jamais
 * le FOND — c'est très exactement ce qui a permis au désastre de durer.
 *
 * Ce fichier ne mesure donc pas du code : il verrouille une PROMESSE faite à des
 * citoyens. Tant qu'aucun juriste humain n'a validé le contenu, le site n'a pas
 * le droit d'affirmer un délai, un acte, ni de générer une lettre.
 *
 * LES DEUX INVARIANTS, dans l'ordre d'importance :
 *   1. La détection de détresse (violence, suicide) passe TOUJOURS, coupe-circuit
 *      ou pas. C'est la seule chose du triage qui n'a jamais menti, et elle donne
 *      le 117 et le 143. La couper tuerait le seul usage qui sauve.
 *   2. Rien d'autre ne doit pouvoir affirmer du droit personnalisé.
 *
 * Si un jour quelqu'un rallume le triage, ces tests doivent tomber en rouge et
 * le forcer à se poser la question : « un juriste a-t-il validé, oui ou non ? »
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

const PORT = 9893;
const BASE = `http://localhost:${PORT}`;

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  let json = null;
  try { json = await res.json(); } catch { /* réponse non-JSON : json reste null */ }
  return { status: res.status, json };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  let json = null;
  try { json = await res.json(); } catch { /* pages HTML : json reste null */ }
  return { status: res.status, json };
}

describe('Coupe-circuit juridique — isSafeMode (fail-safe)', () => {
  it('est ACTIF par défaut : une variable absente laisse le site en sécurité, pas en danger', async () => {
    const saved = process.env.LEGAL_SAFE_MODE;
    delete process.env.LEGAL_SAFE_MODE;
    const { isSafeMode } = await import('../src/services/safe-mode.mjs?fresh=1');
    assert.equal(isSafeMode(), true, 'sans variable définie, le mode sûr DOIT être actif');
    if (saved !== undefined) process.env.LEGAL_SAFE_MODE = saved;
  });

  it("ne se désactive QUE sur la valeur exacte « 0 » (une faute de frappe ne rallume pas le danger)", async () => {
    const saved = process.env.LEGAL_SAFE_MODE;
    const { isSafeMode } = await import('../src/services/safe-mode.mjs?fresh=2');

    for (const valeurQuiNeDoitPasRallumer of ['1', 'true', 'false', 'off', 'no', '', 'O', 'oui']) {
      process.env.LEGAL_SAFE_MODE = valeurQuiNeDoitPasRallumer;
      assert.equal(isSafeMode(), true, `« ${valeurQuiNeDoitPasRallumer} » ne doit PAS désactiver le mode sûr`);
    }
    process.env.LEGAL_SAFE_MODE = '0';
    assert.equal(isSafeMode(), false, '« 0 » est la seule valeur qui rallume les fonctions dangereuses');

    if (saved === undefined) delete process.env.LEGAL_SAFE_MODE;
    else process.env.LEGAL_SAFE_MODE = saved;
  });

  it('oriente vers de vraies ressources humaines, jamais vers une page vide', async () => {
    const { safeModeNotice } = await import('../src/services/safe-mode.mjs?fresh=3');
    const notice = safeModeNotice('fr');

    assert.ok(notice.resources?.length > 0, 'un citoyen coupé doit repartir avec des contacts');
    assert.ok(notice.emergency?.length > 0, "et avec les numéros d'urgence");
    const urgences = JSON.stringify(notice.emergency);
    assert.match(urgences, /117/, 'la police doit être joignable');
    assert.match(urgences, /143/, 'La Main Tendue doit être joignable');
    assert.equal(notice.content_status, 'en_revalidation_non_valide_par_un_juriste',
      "le site doit dire la vérité sur l'état de son contenu");

    for (const lang of ['fr', 'de', 'it', 'en']) {
      assert.ok(safeModeNotice(lang).message?.length > 40, `message manquant en ${lang}`);
    }
  });
});

describe('Coupe-circuit juridique — routes (mode sûr ACTIF)', () => {
  let server;

  before(async () => {
    process.env.LEGAL_SAFE_MODE = '1';
    process.env.LLM_MOCK = '1';
    process.env.ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'test-token';
    process.env.CITIZEN_EMAIL_SALT = process.env.CITIZEN_EMAIL_SALT || 'test-salt';
    process.env.OUTCOMES_HASH_SALT = process.env.OUTCOMES_HASH_SALT || 'test-salt';
    ({ server } = await import('../src/server.mjs'));
    await new Promise((resolve) => server.listen(PORT, resolve));
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  // ─── INVARIANT 1 — LE PLUS IMPORTANT ────────────────────────────────────────
  it('LA DÉTRESSE PASSE TOUJOURS : un cas de violence reçoit les numéros d\'urgence, coupe-circuit ou pas', async () => {
    const { status, json } = await post('/api/triage', {
      texte: "Mon mari me frappe et j'ai peur pour mes enfants"
    });

    assert.equal(status, 200);
    assert.equal(json.status, 'safety_stop',
      'le coupe-circuit NE DOIT JAMAIS avaler un appel à l\'aide — safety_stop passe avant lui');

    const rendu = JSON.stringify(json);
    assert.match(rendu, /117/, 'la police doit être donnée');
    assert.match(rendu, /143|aide-aux-victimes|LAVI/i, "une ligne d'écoute doit être donnée");
  });

  // ─── INVARIANT 2 — plus aucune affirmation juridique personnalisée ───────────
  it('le triage juridique est coupé — et il oriente au lieu de planter', async () => {
    const { status, json } = await post('/api/triage', {
      texte: 'Mon bailleur veut résilier mon bail sans motif, à Lausanne'
    });

    assert.equal(status, 200, "ce n'est pas une panne : c'est un choix éditorial, donc 200");
    assert.equal(json.status, 'legal_safe_mode');
    assert.ok(json.resources?.length > 0, 'le citoyen doit repartir avec de vrais contacts');

    // Le cœur du problème : plus AUCUNE affirmation de délai, d'acte ou d'article.
    assert.equal(json.ficheId, undefined, 'aucune fiche ne doit être affirmée');
    assert.equal(json.planAction, undefined, "aucun plan d'action ne doit être affirmé");
    assert.equal(json.questionsManquantes, undefined, 'aucune question de triage ne doit être posée');
    assert.equal(json.countdown, undefined, 'aucun compte-à-rebours de délai ne doit être affirmé');
  });

  it('les autres portes du triage sont fermées aussi (refine, next)', async () => {
    for (const route of ['/api/triage/refine', '/api/triage/next']) {
      const { status, json } = await post(route, { case_id: 'x', reponses: {} });
      assert.equal(status, 200, `${route} doit répondre proprement`);
      assert.equal(json.status, 'legal_safe_mode', `${route} doit être coupée`);
    }
  });

  // ─── LES PORTES DÉROBÉES ────────────────────────────────────────────────────
  // Chacune de ces routes a été trouvée OUVERTE par la revue adversariale du
  // 2026-07-11, alors que la première version du coupe-circuit se croyait complète.
  // Elles sont ici une par une : c'est le seul moyen qu'elles ne se rouvrent pas.
  it('la porte dérobée /api/action-plan est fermée (c\'était un triage public, sans détection de détresse)', async () => {
    const { status, json } = await get('/api/action-plan?q=' + encodeURIComponent('commandement de payer'));
    assert.equal(status, 200);
    assert.equal(json.status, 'legal_safe_mode',
      "/api/action-plan renvoyait diagnostic + délais + lettres, sans auth et sans safety_stop");
    assert.equal(json.etapes, undefined, 'aucune étape ne doit être affirmée');
    assert.equal(json.delaisCritiques, undefined, 'aucun délai ne doit être affirmé');
  });

  // ⚠ CELUI-CI EST VITAL. Codex l'a attrapé : /api/action-plan était bien COUPÉ, mais
  // pas SCANNÉ. Un « mon mari me frappe » y recevait « analyse suspendue » — un message
  // administratif poli — au lieu du 117. Couper une route ne suffit pas : il faut
  // regarder ce que la personne a écrit AVANT de lui fermer la porte.
  it('LA DÉTRESSE PASSE AUSSI PAR LA PORTE DÉROBÉE : action-plan renvoie les urgences, pas un message de service', async () => {
    const { status, json } = await get('/api/action-plan?q=' + encodeURIComponent("mon mari me frappe et j'ai peur"));
    assert.equal(status, 200);
    assert.equal(json.status, 'safety_stop',
      "un appel à l'aide ne doit JAMAIS recevoir « analyse suspendue » — il doit recevoir des secours");
    assert.match(JSON.stringify(json), /117/, 'la police doit être donnée');
  });

  it("/api/consulter est fermé (il choisissait une fiche selon les réponses = du triage)", async () => {
    const { json } = await post('/api/consulter', { domaine: 'dettes', reponses: {}, canton: 'VD' });
    assert.equal(json.status, 'legal_safe_mode');
  });

  it('LE FILET UNIVERSEL : la détresse est entendue sur TOUT endpoint public à texte libre', async () => {
    // On ne veut plus dépendre d'une liste tenue à la main : /api/search était protégé,
    // /api/action-plan ne l'était pas et répondait par un plan de bail à « mon mari me
    // frappe ». Ici on prend une route documentaire quelconque — elle doit entendre.
    const { json } = await get('/api/loi?q=' + encodeURIComponent('mon mari me frappe, je veux mourir'));
    assert.equal(json.status, 'safety_stop',
      "aucun endroit du site ne doit avaler un appel à l'aide");
    assert.match(JSON.stringify(json), /117|143/);
  });

  it("/api/query/problem est fermé (c'était encore du triage : texte libre → délais)", async () => {
    const { json } = await get('/api/query/problem?q=' + encodeURIComponent('mon bailleur me résilie'));
    assert.equal(json.status, 'legal_safe_mode');
  });

  it('et la détresse y passe aussi', async () => {
    const { json } = await get('/api/query/problem?q=' + encodeURIComponent('mon mari me frappe'));
    assert.equal(json.status, 'safety_stop');
    assert.match(JSON.stringify(json), /117/);
  });

  it('les calculateurs sont coupés (ils sortent un délai daté — et ils ignorent les féries)', async () => {
    const { json } = await post('/api/calculateurs/delai-conge', { anciennete_annees: 3 });
    assert.equal(json.status, 'legal_safe_mode',
      'un calculateur qui ignore les féries judiciaires peut annoncer « dépassé » un délai encore ouvert');
  });

  it("les échéances du compte citoyen sont coupées (elles rejouaient les délais calculés AVANT la coupure)", async () => {
    const { json: up } = await get('/api/citizen/upcoming');
    assert.equal(up.status, 'legal_safe_mode');
    const { json: link } = await post('/api/citizen/cases/link', { case_id: 'x' });
    assert.equal(link.status, 'legal_safe_mode',
      'lier un dossier déclenchait la planification automatique de rappels sur de faux délais');
  });

  it("la bibliothèque de lettres pré-écrites est fermée (50 lettres, 33 avec un délai en dur)", async () => {
    for (const route of ['/api/templates', '/api/templates/dettes_opposition_commandement_payer']) {
      const { json } = await get(route);
      assert.equal(json.status, 'legal_safe_mode', `${route} servait des lettres prêtes à poster`);
    }
  });

  it('les rappels par mail sont coupés (ils rejouaient les faux délais des anciens dossiers)', async () => {
    const { json: g } = await get('/api/case/abc123/reminders');
    assert.equal(g.status, 'legal_safe_mode');
    const { json: p } = await post('/api/case/abc123/reminders/schedule', {});
    assert.equal(p.status, 'legal_safe_mode',
      'un citoyen gardant son case_id recevait encore un faux délai PAR MAIL');
  });

  it("le moteur de règles brut est coupé (il affirme des délais en une requête)", async () => {
    const { json } = await post('/api/compiler/execute', { domaine: 'dettes', faits: {} });
    assert.equal(json.status, 'legal_safe_mode');
  });

  it("on n'affiche plus le prix d'un service qu'on ne vend plus", async () => {
    const { json } = await get('/api/triage/cost');
    assert.equal(json.status, 'legal_safe_mode');
    assert.equal(json.min, undefined);
  });

  // ─── LE FILET DE SORTIE ─────────────────────────────────────────────────────
  // La leçon des cinq portes manquées : énumérer les routes dangereuses, c'est en
  // oublier. Toute réponse JSON passe donc par un filtre. Ce test vérifie le FILET,
  // pas les routes — il tiendra même pour une route écrite demain.
  it('AUCUNE réponse ne peut livrer un modèle de lettre, même par une route restée ouverte', async () => {
    const { stripLetters } = await import('../src/services/safe-mode.mjs?fresh=4');

    const payloadPiege = {
      fiche: {
        titre: 'Commandement de payer',
        explication: 'information générale',           // ← doit SURVIVRE
        modeleLettre: 'Objet : Opposition au commandement de payer…',  // ← doit DISPARAÎTRE
        cascades: [{ etape: 1, templates: ['lettre_opposition'] }]     // ← imbriqué, doit disparaître
      },
      lettresDisponibles: ['opposition.docx']
    };

    const filtre = stripLetters(payloadPiege);

    assert.equal(filtre.fiche.modeleLettre, undefined, 'le corps de lettre doit être retiré');
    assert.equal(filtre.lettresDisponibles, undefined, 'la liste de lettres doit être retirée');
    assert.equal(filtre.fiche.cascades[0].templates, undefined,
      'le filtre doit descendre dans les objets imbriqués');
    assert.equal(filtre.fiche.explication, 'information générale',
      "l'INFORMATION doit rester : on se tait sur les actes, pas sur les droits");
    assert.ok(filtre.letters_withheld, 'et on dit au citoyen POURQUOI la lettre a été retirée');
  });

  it("la consultation informe encore, mais ne met plus de lettre dans les mains du citoyen", async () => {
    const { status, json } = await get('/api/fiches/dettes_commandement_payer');
    assert.equal(status, 200, 'la fiche reste consultable — on continue d\'informer');
    const brut = JSON.stringify(json);
    assert.ok(!/Objet\s*:\s*Opposition/i.test(brut),
      "l'API servait le corps de la lettre nu, alors que le frontend le masquait");
  });

  it('on ne vend plus rien : le paiement est refusé', async () => {
    const { status, json } = await post('/api/stripe/create-checkout-session', { montant: 500 });
    assert.equal(status, 200);
    assert.equal(json.payment_disabled, true, 'facturer une analyse suspendue serait indéfendable');
    assert.equal(json.url, undefined, 'aucune session de paiement ne doit être créée');
  });

  // ─── Ce qui doit RESTER debout ──────────────────────────────────────────────
  it('la consultation reste ouverte : le site informe et oriente encore', async () => {
    for (const route of ['/api/domaines', '/api/health']) {
      const { status } = await get(route);
      assert.equal(status, 200, `${route} ne doit pas être coupée : elle ne personnalise rien`);
    }
  });

  it("le site annonce son propre état au frontend (pour qu'il puisse le dire à l'utilisateur)", async () => {
    const { json } = await get('/api/config');
    assert.equal(json.legal_safe_mode, true,
      'le frontend doit savoir qu\'il est en mode sûr, sinon il affichera des boutons qui mentent');
  });
});

// ─── HORS DU SERVEUR ──────────────────────────────────────────────────────────
// Le coupe-circuit vit dans le processus HTTP. Les crons, eux, tournent à part — ils
// échappaient donc entièrement à la neutralisation, et postaient à de vrais citoyens
// une échéance, une base légale et la conséquence d'un délai manqué. Un rappel fondé
// sur un faux délai est PIRE qu'un silence : il fait agir au mauvais moment, avec
// l'autorité d'une notification. (Trouvé par la revue Codex du 2026-07-11.)
describe('Coupe-circuit juridique — les envois automatiques (crons)', () => {
  // On appelle la fonction exportée plutôt que le script en ligne de commande : sa garde
  // « suis-je lancé directement ? » compare une URL encodée (PROJET%20IA) à un chemin brut
  // et ne matche donc pas sous Windows. Le test doit valider le GARDE-FOU, pas l'encodage
  // des chemins de la machine de dev.
  it("aucun mail de rappel ne part tant que les délais ne sont pas validés par un juriste", async () => {
    process.env.LEGAL_SAFE_MODE = '1';
    process.env.REMINDERS_DRY_RUN = '1';   // ceinture : même si le garde sautait, aucun envoi réel
    delete process.env.RESEND_API_KEY;     // bretelles : sans clé, Resend ne peut rien poster

    const logs = [];
    const vraiLog = console.log;
    console.log = (...a) => logs.push(a.join(' '));

    try {
      const { runSendDueReminders } = await import('../../scripts/send-due-reminders.mjs?safe=1')
        .catch(() => import('../scripts/send-due-reminders.mjs?safe=1'));
      await runSendDueReminders();
    } finally {
      console.log = vraiLog;
    }

    const sortie = JSON.parse(logs[logs.length - 1]);
    assert.equal(sortie.aborted, 'legal_safe_mode',
      "le cron doit s'arrêter net : il tourne HORS du serveur, rien d'autre ne l'arrête");
    assert.equal(sortie.sent, 0, 'aucun mail ne doit partir');
  });

  it("aucune alerte proactive ne part non plus", async () => {
    process.env.LEGAL_SAFE_MODE = '1';
    delete process.env.RESEND_API_KEY;

    const logs = [];
    const vraiLog = console.log;
    console.log = (...a) => logs.push(a.join(' '));

    try {
      const { runProactiveAlerts } = await import('../scripts/send-proactive-alerts.mjs?safe=1');
      await runProactiveAlerts();
    } finally {
      console.log = vraiLog;
    }

    const sortie = JSON.parse(logs[logs.length - 1]);
    assert.equal(sortie.aborted, 'legal_safe_mode');
    assert.equal(sortie.sent, 0);
  });
});
