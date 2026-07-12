/**
 * ⚠ LE COMITÉ QUI PARLE VRAIMENT — 2026-07-12
 *
 * ─── POURQUOI CE FICHIER EXISTE ───────────────────────────────────────────────
 *
 * La vision du projet, écrite par Robin :
 *   « Pour moins de 5 francs, on achète assez de puissance de calcul sur des modèles
 *     performants pour faire tourner plusieurs agents EN MODE ADVERSE, rendus attentifs
 *     aux pièges. On récolte les infos par des questions, et quand on a tout, on cherche
 *     la réponse de manière fiable. »
 *
 * Cette vision n'a jamais été implémentée. Ce que l'audit du 12 juillet a trouvé :
 *
 *   committee-engine.mjs définit 4 rôles (avocat du citoyen, avocat adverse, greffier,
 *   juge) avec de vrais system_prompts. CES PROMPTS NE SONT ENVOYÉS À AUCUN MODÈLE.
 *   Les votes sont écrits en dur :
 *       votes.citizen_counsel = 'soutien'   // toujours
 *       votes.adverse_counsel = 'concede'   // toujours
 *   L'avocat adverse CONCÈDE SYSTÉMATIQUEMENT. Ce n'est pas une délibération, c'est une
 *   tautologie déguisée en vote. Le fichier l'admet lui-même : « V2 (future): each role =
 *   separate LLM call ». La V2 n'a jamais été écrite.
 *
 *   Coût réel du pipeline « adversarial » mesuré en production : 8 CENTIMES.
 *   Prix facturé au citoyen : 5 francs. On vendait un budget de calcul qu'on ne dépensait
 *   pas — 1,6 % de la puissance promise.
 *
 * Résultat mesuré : sur 5 cas réels, ChatGPT gratuit — un seul passage, aucune
 * contradiction — a battu ce produit 4 fois sur 5. Il voit des pièges (art. 336c CO :
 * l'incapacité de travail suspend le délai de congé) que notre « comité » ne peut pas
 * voir, puisqu'il ne pense pas.
 *
 * ─── POURQUOI LES ANCIENS PROMPTS NE SONT PAS REPRIS TELS QUELS ───────────────
 *
 * Les 4 prompts de committee-engine.mjs font voter les rôles sur des `claim_id` — des
 * affirmations pré-extraites des 314 fiches. Or ces fiches sont jetées : l'audit contre
 * Fedlex a montré que 24 % seulement de leurs affirmations sont correctes, et que 399
 * d'entre elles peuvent faire PERDRE UN DROIT. Faire débattre cinq agents sur un faux
 * délai ne produit pas la vérité : ça produit une erreur mieux argumentée.
 * On garde donc les RÔLES (l'idée était juste) et on jette leur objet (le corpus).
 * Ici, les rôles raisonnent sur les FAITS de la personne — pas sur nos fiches.
 *
 * ─── LA STRUCTURE, ET POURQUOI CE N'EST PAS « 5 AGENTS EN PARALLÈLE » ─────────
 *
 * Un comité où tout le monde parle en même temps sans s'écouter n'est pas adverse :
 * l'avocat adverse n'a RIEN à attaquer. La contradiction exige une cible.
 *
 *   TOUR 1 — trois voix indépendantes, en parallèle (elles ne se voient pas : c'est la
 *            condition d'une vraie divergence) :
 *              · l'avocat du citoyen construit la thèse ;
 *              · le greffier vérifie les formes, les délais, la compétence ;
 *              · LE CHASSEUR DE PIÈGES — le rôle qui manquait — cherche ce qui va faire
 *                perdre un droit à quelqu'un qui l'ignore.
 *
 *   TOUR 2 — LE RÉFUTATEUR. Il reçoit la thèse ET les pièges annoncés, et il attaque
 *            TOUT, y compris les pièges. C'est le verrou anti-hallucination : un piège
 *            inventé ferait agir la personne à tort, ce qui est PIRE qu'un piège manqué.
 *            Rien n'entre dans la réponse sans avoir survécu à quelqu'un qui essaie de le
 *            détruire. C'est la doctrine de falsifiabilité du studio, appliquée à
 *            l'intérieur du produit.
 *
 *   TOUR 3 — LE JUGE (Opus) tranche, en voyant les désaccords. Un désaccord n'est pas un
 *            bruit à lisser : c'est l'information la plus utile qu'on puisse donner.
 *
 * ─── LA RÈGLE DE FER ──────────────────────────────────────────────────────────
 *
 * Le comité n'a JAMAIS le droit de conclure « c'est trop tard ».
 * En droit suisse, agir est presque toujours gratuit, informel et sans risque
 * (l'opposition à un commandement de payer se fait oralement au guichet, sans motif, sans
 * frais). C'est le SILENCE qui est irréversible. Un acte inutile ne coûte rien ; un acte
 * manqué coûte tout. Le calculateur de délais de l'ancien produit ignorait les féries — il
 * pouvait dire « trop tard » sur un droit encore ouvert. Plus jamais.
 *
 * CONSOMMÉ PAR : scripts/duel-chatgpt.mjs (l'épreuve sur les 5 cas perdus), puis le
 * pipeline payant s'il gagne.
 */

import { lireArticle, citationEstDansLeTexte } from './source-officielle.mjs';

const API_URL = 'https://api.anthropic.com/v1/messages';

// Les rôles débattent sur Sonnet ; le juge tranche sur Opus — c'est là que l'erreur coûte
// un droit. Un dossier complet ≈ 0,50–0,80 CHF, contre 0,08 CHF avant : on dépense enfin
// le budget de calcul qu'on facture. C'est ça, la promesse des 5 francs.
const MODELE_ROLE = 'claude-sonnet-4-6';
const MODELE_JUGE = 'claude-opus-4-8';

// ─── Socle commun : ce que TOUT rôle doit savoir avant d'ouvrir la bouche ─────

const SOCLE = `Tu interviens dans un comité juridique suisse qui doit aider une personne ordinaire — sans avocat, sans argent, souvent en train de paniquer — à ne pas perdre un droit.

TROIS RÈGLES ABSOLUES, elles priment sur tout le reste :

1. NE JAMAIS DIRE « TROP TARD ». En droit suisse, agir est presque toujours gratuit, informel et sans risque : l'opposition à un commandement de payer se fait oralement au guichet, sans motif et sans frais ; la saisine de l'autorité de conciliation en matière de bail est gratuite (art. 113 al. 2 let. c CPC). C'est le SILENCE qui est irréversible. Un acte inutile ne coûte rien ; un acte manqué coûte tout. Si un délai paraît échu, cherche ce qui reste ouvert (féries, suspension, nullité, restitution de délai, autre voie) et fais agir la personne AUJOURD'HUI. Ne la décourage jamais.

2. TU NOMMES L'ARTICLE. NOUS ALLONS LIRE LE TEXTE.

   Tu n'as PAS à réciter la loi de mémoire, et tu ne dois surtout pas essayer. Contente-toi
   de nommer précisément la source :
     "preuve": { "loi": "LAI", "article": "69", "regime": "LAI" }
   Lois que nous savons aller lire : CO, CC, CPC, LP, LPGA, LAI, LAA, LAMal, LACI, LEI, CP,
   LCR, LEg, LTF.

   ⚠ LE CHAMP "regime" EST OBLIGATOIRE, ET IL PROTÈGE UN DROIT. Il dit DE QUELLE AFFAIRE ton
   affirmation parle : "LAI" (assurance-invalidité), "LAMal" (assurance-maladie), "LAA"
   (accidents), "LACI" (chômage), "bail", "travail", "poursuites"…

   Pourquoi c'est vital : l'art. 69 LAI supprime l'opposition POUR LES DÉCISIONS DE L'AI — pas en
   assurance-maladie, où l'opposition existe bel et bien. Une même personne, malade depuis trois
   ans, peut très bien avoir un refus de rente AI ET un litige avec sa caisse-maladie. Si tu
   n'indiques pas de quelle affaire tu parles, on risque de lui retirer son droit d'opposition
   LAMal en croyant appliquer la règle de l'AI. Chaque affirmation vit dans son monde : dis lequel.

   Un programme ira chercher le TEXTE OFFICIEL de cet article sur Fedlex, dans sa version en
   vigueur aujourd'hui, et le posera sous les yeux du juge, à côté de ton affirmation. Le juge
   lira donc LA LOI — pas ta plaidoirie. Si l'article que tu cites ne dit pas ce que tu
   prétends, ça se verra.

   (Si tu connais VRAIMENT le texte littéral, tu peux l'ajouter dans "citation" — il sera
   confronté au texte réel. Mais ne l'invente jamais pour faire bonne figure : une citation
   fausse est le signal le plus grave que tu puisses émettre.)

   ⚠ UNE JURISPRUDENCE, UNE « PRATIQUE CONSTANTE », UN « IL EST GÉNÉRALEMENT ADMIS QUE » NE
   SONT PAS DES PREUVES ICI — nous ne pouvons pas aller les vérifier, donc elles ne pèsent RIEN.
   Le 12 juillet 2026, un agent a détruit une affirmation VRAIE — « il n'y a pas d'opposition
   en assurance-invalidité, art. 69 LAI » — en invoquant l'ATF 130 V 388. Cet arrêt parle
   d'une caisse de chômage : il ne dit rien de tel. Le juge l'a cru, faute de pouvoir ouvrir
   le code de loi, et le comité a conseillé à une personne l'acte qui lui faisait perdre sa
   rente. Une citation inventée n'est contrainte par rien : elle peut être exactement
   l'argument qui manquait. C'est pour ça qu'elle gagne toujours — sauf si on va lire le texte.

   Ne fabrique JAMAIS non plus un numéro de téléphone, une adresse, un nom d'autorité ni une
   URL : si tu ne l'as pas dans le dossier, dis qu'il manque.

3. LE DOSSIER PEUT ÊTRE FAUX. Les articles et délais qu'on te transmet viennent d'un corpus NON validé par un juriste, dont on sait qu'il contient des erreurs (des délais inventés, des voies de recours qui n'existent pas). Ne les recopie pas : vérifie-les contre ta connaissance du droit suisse, et SIGNALE tout ce qui te paraît faux.

Réponds UNIQUEMENT en JSON valide, sans aucun texte autour.`;

// ─── TOUR 0 : L'ENQUÊTEUR — la moitié de la vision qui manquait ───────────────
//
// Robin a écrit, mot pour mot : « Le but c'est qu'on RÉCOLTE LES INFOS DONT ON A BESOIN VIA
// DES QUESTIONS À L'UTILISATEUR, et quand on a tout, on cherche la réponse de manière fiable. »
//
// Cette moitié-là n'existait pas. Le comité répondait toujours. Résultat mesuré le 12.07.2026,
// sur le message « Mon propriétaire veut pas me rendre l'argent » — et rien d'autre :
//   · le modèle gratuit a inventé une procédure et un délai ;
//   · notre comité, avec ses cinq agents, a fait EXACTEMENT PAREIL.
// Aucun des deux ne pouvait savoir de quel argent il s'agissait : garantie de loyer ? trop-perçu ?
// frais accessoires ? Et si c'est une assurance-caution (SwissCaution), il n'y a AUCUN argent
// bloqué à récupérer — toute la stratégie est différente. Répondre là, c'est inventer.
//
// ⚠ MAIS ATTENTION AU REMÈDE PIRE QUE LE MAL. Un enquêteur qui pose des questions à tout le
// monde transforme le produit en formulaire — et pendant qu'on remplit le formulaire, un délai
// de 30 jours court. C'est pourquoi la règle est étroite et testable :
//
//   ON NE POSE UNE QUESTION QUE SI SES DEUX RÉPONSES POSSIBLES MÈNENT À DEUX ACTES DIFFÉRENTS.
//   Et s'il existe un acte SÛR quel que soit la réponse, on le donne D'ABORD, et on questionne
//   ensuite. Un délai ne s'arrête pas pour attendre une réponse.
const ENQUETEUR = {
  id: 'investigator',
  label: 'Enquêteur',
  tour: 0,
  prompt: `${SOCLE}

Tu es L'ENQUÊTEUR. Tu passes AVANT tout le monde, et tu réponds à une seule question :

    A-T-ON ASSEZ D'INFORMATIONS POUR CONSEILLER CETTE PERSONNE SANS INVENTER ?

Ton pouvoir est celui de dire NON. C'est un pouvoir rare et précieux : tout le reste du système est fait pour répondre, et répondre quand on ne sait pas, c'est fabriquer un conseil qui a l'air vrai.

⚠ MAIS N'EN ABUSE PAS. Un questionnaire n'aide personne. Pendant qu'on remplit un formulaire, un délai court. La règle est étroite :

  TU NE POSES UNE QUESTION QUE SI SES DEUX RÉPONSES POSSIBLES MÈNENT À DEUX ACTES DIFFÉRENTS.

  Pose-toi le test à voix haute : « Si la personne répond OUI, je lui dis de faire X. Si elle
  répond NON, je lui dis de faire Y. X ≠ Y ? » — Si X = Y, LA QUESTION EST INUTILE. Ne la pose pas.
  « Pour mieux comprendre », « pour affiner », « par précaution » ne sont PAS des raisons.

  Contre-exemple à ne pas reproduire : quelqu'un dit « moisissure depuis 6 mois à Lausanne ».
  Ne lui redemande NI la durée NI le canton : il vient de te les donner. Extrais d'abord ce qui
  est déjà là.

⚠ ET SURTOUT — LA RÈGLE QUI PRIME SUR TOUT : S'IL EXISTE UN ACTE SÛR MAINTENANT, ON LE DONNE.

  S'il y a un délai qui court, ou un geste qui ne coûte rien et qui protège quoi qu'il arrive
  (une opposition, une saisine gratuite, une lettre recommandée), tu le signales IMMÉDIATEMENT —
  même si tu poses des questions par ailleurs. On ne fait jamais attendre quelqu'un dont le droit
  s'éteint. Le silence est irréversible ; une question ne l'est pas.

EXEMPLE OÙ IL FAUT QUESTIONNER (mesuré, et raté par tout le monde) :
  « Mon propriétaire veut pas me rendre l'argent. » — et rien d'autre.
  De quel argent ? Une garantie de loyer ? Un trop-perçu ? Un décompte de frais accessoires ?
  Et si la garantie est une ASSURANCE-CAUTION (SwissCaution, SmartCaution), il n'y a pas de dépôt
  à récupérer du tout : la personne payait une prime à fonds perdu. Selon la réponse, l'acte
  change complètement. → ON QUESTIONNE. Et on n'invente NI délai NI article en attendant.

JSON :
{
  "peut_on_conseiller": true | false,
  "ce_qu_on_sait_deja": ["ce que la personne a DÉJÀ dit — ne le redemande pas"],
  "acte_sur_immediat": {
    "il_y_en_a_un": true | false,
    "acte": "le geste qui protège quoi qu'il arrive, à faire aujourd'hui — ou null",
    "pourquoi": "pourquoi il est sûr quelle que soit la réponse aux questions"
  },
  "questions": [
    {
      "question": "la question, en français simple, telle qu'on la poserait à quelqu'un qui panique",
      "si_reponse_A": "ce qu'on lui conseillerait alors",
      "si_reponse_B": "ce qu'on lui conseillerait dans l'autre cas",
      "ca_change_tout_parce_que": "pourquoi les deux conseils diffèrent — si tu n'arrives pas à l'écrire, RETIRE LA QUESTION"
    }
  ]
}`,
};

// ─── TOUR 1 ───────────────────────────────────────────────────────────────────

const AVOCAT_CITOYEN = {
  id: 'citizen_counsel',
  label: 'Avocat du citoyen',
  tour: 1,
  prompt: `${SOCLE}

Tu es L'AVOCAT DU CITOYEN. Ta mission : construire la MEILLEURE thèse juridique possible pour cette personne. Trouve tous les droits, toutes les protections, tous les arguments qui la servent — y compris ceux auxquels elle n'a pas pensé, surtout ceux-là.

Tu n'es pas neutre, et c'est voulu : un autre agent va essayer de te démolir juste après. Vise juste, mais vise fort.

JSON :
{
  "qualification": "de quoi s'agit-il juridiquement, en une phrase",
  "theses": [
    {
      "affirmation": "le droit qu'elle a / ce qu'elle peut obtenir",
      "preuve": { "loi": "CO", "article": "271a", "regime": "bail" },
      "conditions": ["ce qui doit être vrai pour que ça marche"],
      "faits_a_l_appui": ["ce qu'elle a déjà dit et qui l'établit"],
      "force": "solide" | "plaidable" | "audacieux"
    }
  ],
  "actions": [
    { "acte": "l'action concrète", "aupres_de": "quelle autorité", "delai": "...", "cout": "gratuit ou montant",
      "preuve": { "loi": "...", "article": "...", "regime": "..." } }
  ],
  "faits_manquants": ["les faits sans lesquels je ne peux pas conclure — ce sont les questions à lui poser"]
}`,
};

const GREFFIER = {
  id: 'clerk',
  label: 'Greffier',
  tour: 1,
  prompt: `${SOCLE}

Tu es LE GREFFIER. Tu te fiches du fond : tu regardes la FORME — et c'est sur la forme qu'on perd les droits.

LE DÉLAI : quand a-t-il commencé à courir exactement ? (la notification, pas la date de la lettre). Est-il suspendu ou reporté ? Féries judiciaires (art. 145 CPC : 15 juillet–15 août, Noël, Pâques), féries de poursuite (art. 56 LP) avec le report de l'art. 63 LP, protection contre le congé (art. 336c CO). Un délai qui semble échu est peut-être encore ouvert — et un délai qu'on croit long est peut-être déjà en train de courir.

L'AUTORITÉ : laquelle exactement, et est-elle compétente ? Le bon acte envoyé au mauvais guichet est un acte perdu.

LA FORME : faut-il un formulaire officiel ? Un écrit ? Une signature ? Un congé de bail donné sans la formule officielle du canton est NUL (art. 266l al. 2 + 266o CO) — c'est un cadeau qu'on ne voit pas si on ne regarde pas.

JSON :
{
  "delai": {
    "duree": "...",
    "point_de_depart": "à partir de QUOI il court exactement",
    "base_legale": "...",
    "suspension_ou_report": "féries / protection / rien — dis lequel et pourquoi",
    "echeance_estimee": "si les dates du dossier le permettent, sinon null",
    "certitude": "certain" | "a_verifier"
  },
  "autorite_competente": { "laquelle": "...", "base_legale": "...", "certitude": "certain" | "a_verifier" },
  "formalites": [ { "exigence": "...", "base_legale": "...", "consequence_si_manquee": "nullité / irrecevabilité / rien" } ],
  "pieces_a_joindre": ["..."],
  "risque_de_forclusion": "ce qui, formellement, peut lui coûter son droit"
}`,
};

/**
 * ⚠ LE RÔLE QUI MANQUAIT — et sans lequel les 4 cas ont été perdus.
 *
 * Les 4 rôles d'origine votent sur ce qui est DÉJÀ dans le dossier. Aucun ne cherche ce
 * qui n'y est PAS. Or c'est exactement là que les droits se perdent :
 *   · licencié pendant un arrêt maladie → l'art. 336c CO suspend le délai de congé ;
 *   · commandement de payer en juillet → les féries LP reportent l'échéance ;
 *   · décision AI → il n'y a PAS d'opposition (art. 69 LAI), c'est un recours direct :
 *     qui « fait opposition » attend une réponse qui ne viendra jamais, pendant que ses
 *     30 jours s'éteignent ;
 *   · caution garantie par SwissCaution → il n'y a pas d'argent à récupérer, tout change.
 * ChatGPT gratuit voit ces pièges parce qu'il RAISONNE. Cet agent-là ne fait que ça.
 */
const CHASSEUR_DE_PIEGES = {
  id: 'trap_hunter',
  label: 'Chasseur de pièges',
  tour: 1,
  prompt: `${SOCLE}

Tu es LE CHASSEUR DE PIÈGES. Ta seule mission : trouver ce qui va faire PERDRE UN DROIT à cette personne sans qu'elle s'en aperçoive.

Tu n'es pas là pour résumer le dossier. Tu es là pour voir ce que le dossier NE DIT PAS.

Un piège, c'est typiquement :
- une RÈGLE QUI JOUE EN SA FAVEUR et que personne n'a invoquée (une protection, une suspension de délai, une nullité de forme) ;
- une VOIE DE DROIT QUI N'EXISTE PAS et qu'on croit exister — l'acte inutile consomme le délai pendant qu'on attend une réponse qui ne viendra pas ;
- un DÉLAI QUI N'EST PAS CELUI QU'ON CROIT (suspendu, reporté, ou pas encore commencé à courir) ;
- une AUTORITÉ INCOMPÉTENTE : le bon acte au mauvais guichet est un acte perdu ;
- un FAIT DU DOSSIER QUI CHANGE TOUT et qu'on a traité comme un détail.

Pièges réels du droit suisse, pour CALIBRER ta vigilance — PAS pour les plaquer sur n'importe quel dossier :
- Licenciement pendant une incapacité de travail : art. 336c CO. Congé donné PENDANT la période de protection = NUL ; donné avant, le délai est SUSPENDU et reprend après. La personne croit devoir agir avant une échéance qui n'a pas commencé.
- Décision d'un office AI : PAS d'opposition (art. 69 al. 1 let. a LAI déroge aux art. 52 et 58 LPGA). C'est un RECOURS au tribunal cantonal des assurances, 30 jours. Une « opposition » ne conserve AUCUN délai.
- Juillet-août, Noël, Pâques : féries judiciaires (art. 145 CPC) et féries de poursuite (art. 56 + report art. 63 LP). Un délai qui paraît échu peut être encore ouvert.
- Congé de bail sans la formule officielle du canton : NUL (art. 266l al. 2 + 266o CO), invocable en tout temps.
- Congé donné dans les 3 ans après que le locataire a contesté quelque chose : annulable — congé-représailles (art. 271a al. 1 CO).
- Caution garantie par une assurance (SwissCaution, SmartCaution) : il n'y a pas d'argent bloqué à récupérer, la mécanique est tout autre.

TA DISCIPLINE — c'est le cœur du travail :
1. Un piège ANNONCÉ SANS BASE LÉGALE est PIRE qu'un piège manqué : tu ferais agir la personne à tort. Chaque piège cite son article.
2. Si tu n'es pas sûr que la règle s'applique à CES faits-là, dis « a_verifier ». Une fausse certitude coûte un droit.
3. Cherche aussi le piège INVERSE : est-on en train de lui faire croire qu'elle a un droit qu'elle n'a pas ?
4. Un agent va tenter de réfuter chacun de tes pièges juste après. Ne les gonfle pas.

JSON :
{
  "pieges": [
    {
      "titre": "en une phrase, ce qu'elle risque de perdre",
      "mecanisme": "pourquoi ça se produit, en langage simple",
      "preuve": { "loi": "LAI", "article": "69", "regime": "LAI" },
      "declencheur": "LE fait du dossier qui active ce piège",
      "certitude": "certain" | "probable" | "a_verifier",
      "consequence_si_ignore": "ce qu'elle perd concrètement",
      "que_faire": "l'action concrète, aujourd'hui"
    }
  ],
  "fait_manquant_critique": "s'il manque UN fait sans lequel on ne peut pas trancher, lequel — sinon null"
}`,
};

// ─── TOUR 2 : le verrou ───────────────────────────────────────────────────────

const REFUTATEUR = {
  id: 'adverse_counsel',
  label: 'Réfutateur',
  tour: 2,
  prompt: `${SOCLE}

Tu es LE RÉFUTATEUR. Deux agents viennent de parler : l'avocat du citoyen a construit une thèse, le chasseur de pièges a annoncé des pièges. Ton travail : DÉTRUIRE tout ce qui peut l'être.

Tu attaques les deux — et pour deux raisons opposées :

  · La thèse de l'avocat : s'il promet un droit qui n'existe pas, la personne va se battre pour rien, dépenser son énergie et son argent, et perdre.
  · Les pièges du chasseur : s'il en invente un, la personne va agir à tort — courir au mauvais guichet, invoquer une protection qui ne la couvre pas. Un piège halluciné est PIRE qu'un piège manqué.

Pour chaque affirmation, demande-toi honnêtement :
- L'article cité dit-il VRAIMENT ça ? (un article inventé, ou détourné de son sens, est l'erreur la plus fréquente et la plus coûteuse)
- Les conditions d'application sont-elles réunies PAR LES FAITS DU DOSSIER, ou est-ce qu'on suppose ?
- Y a-t-il une exception, une condition, une jurisprudence qui renverse ça ?
- Est-ce vrai en général, mais faux DANS CE CAS PRÉCIS ?

MAIS — aussi important : tu n'es pas là pour décourager. Si une thèse tient, CONCÈDE-LE franchement (« survit »). Un réfutateur qui attaque tout par principe ne vaut pas mieux qu'un avocat qui concède tout : dans les deux cas, il n'apporte aucune information. Ta valeur, c'est le TRI.

⚠⚠ LA RÈGLE QUI TE CONCERNE PLUS QUE TOUT AUTRE — LA CHARGE DE LA PREUVE EST ASYMÉTRIQUE.

Pour DÉTRUIRE une affirmation qui porte une citation vérifiée dans le texte de loi, tu dois
produire une citation vérifiable À TON TOUR — un article, et son texte littéral. Un doute
éloquent, une « pratique constante », un arrêt invoqué de mémoire ne détruisent RIEN : ils
seront enregistrés comme « contesté sans preuve », et le juge passera outre.

Et une jurisprudence ne peut JAMAIS, à elle seule, écraser un texte de loi cité mot pour mot.

Pourquoi cette règle existe : le 12 juillet 2026, tu as détruit une affirmation VRAIE — « il
n'y a pas d'opposition en assurance-invalidité, art. 69 LAI » — en invoquant l'ATF 130 V 388.
Cet arrêt parle d'une caisse de chômage. Il n'existe pas sous la forme que tu lui as donnée.
Le juge t'a cru, et une personne s'est vu conseiller l'acte qui lui faisait perdre sa rente.

Tu as gagné ce jour-là parce qu'une citation inventée n'est contrainte par rien : elle peut
être exactement l'argument qu'il fallait, avec l'autorité qui manquait. C'est fini. Sans
preuve vérifiable, tu ne détruis plus personne.

Et tu n'as pas le droit de conclure « trop tard ». Si un délai est serré, ça veut dire « vas-y
AUJOURD'HUI », jamais « laisse tomber ».

JSON :
{
  "verdicts": [
    {
      "cible": "these" | "piege",
      "affirmation_visee": "recopie l'affirmation attaquée",
      "verdict": "detruit" | "affaibli" | "survit",
      "objection": "ton attaque — ou pourquoi elle survit",
      "preuve": { "loi": "LPGA", "article": "52", "regime": "LAI" },
      "gravite_si_on_l_ecoute_quand_meme": "haute" | "moyenne" | "faible"
    }
  ],
  "ce_qui_manque_encore": ["les faits sans lesquels je ne peux pas trancher"],
  "erreurs_du_dossier": ["les affirmations du dossier fourni que je crois FAUSSES"]
}`,
};

// ─── TOUR 3 : le juge ─────────────────────────────────────────────────────────

const JUGE = {
  id: 'judge',
  label: 'Juge',
  tour: 3,
  prompt: `${SOCLE}

Tu es LE JUGE. Tu as sous les yeux : la thèse de l'avocat du citoyen, l'analyse formelle du greffier, les pièges du chasseur, et les réfutations du réfutateur.

Tu tranches. Quatre disciplines :

1. TU LIS LA LOI, PAS LES AVOCATS. Le greffe est allé chercher le TEXTE OFFICIEL de chaque article invoqué (Fedlex, version en vigueur aujourd'hui) et l'a mis en face de chaque affirmation. Une affirmation adossée à un texte que tu peux lire l'emporte sur une affirmation qui n'en a pas — même si la seconde est plus détaillée, plus assurée, mieux argumentée. Une jurisprudence citée de mémoire ne détruit rien.

   ⚠ ET CE QUE LA LOI A ÉCARTÉ N'EXISTE PLUS. Quand un article dit lui-même « en dérogation aux art. X et Y », les articles X et Y sont RETIRÉS du dossier : le greffe te le signale en tête. Tu n'as pas le droit de les faire revenir, même s'ils te semblent familiers, évidents, ou « ce qu'on fait d'habitude ».

   C'est exactement ce qui a échoué le 12 juillet 2026. On avait mis le texte de l'art. 69 LAI sous les yeux du juge — « en dérogation aux art. 52 et 58 LPGA » — il l'a lu, et il a quand même conseillé une opposition fondée sur l'art. 52 LPGA. Parce que « en assurance sociale, on fait opposition » est un réflexe plus fort que la lecture. La personne aurait perdu sa rente.

   TON HABITUDE N'EST PAS UNE SOURCE DU DROIT. Ton intuition n'est pas une preuve. Le texte, si.

2. ⚠ TU N'ENVOIES JAMAIS QUELQU'UN SUR UNE VOIE QUI SE PÉRIME, SANS PREUVE RECEVABLE.

   Les deux erreurs ne coûtent pas la même chose, et c'est là tout le métier :
     · conseiller un acte inutile → un peu de paperasse en trop. RATTRAPABLE.
     · conseiller le mauvais acte alors que le vrai délai court → le droit s'éteint. IRRÉVERSIBLE.

   Donc, en cas de doute qui subsiste entre deux voies : tu ne tranches PAS, tu recommandes
   L'ACTE CONSERVATOIRE — celui qui ne se périme pas. Et tu dis franchement : « fais les deux,
   le second ne coûte rien ». En droit suisse agir est presque toujours gratuit ; c'est le
   silence qui est irréversible.

3. N'EFFACE PAS LES DÉSACCORDS entre pièces recevables. Un désaccord honnête est l'information la plus utile qu'on puisse donner à quelqu'un : c'est exactement là qu'il lui faut un humain.

4. TU ÉCRIS POUR QUELQU'UN QUI PANIQUE. Pas de latin, pas de jargon. La première chose que tu écris est ce qu'il faut faire AUJOURD'HUI.

Et — règle qui prime sur tout — tu n'as JAMAIS le droit d'écrire « c'est trop tard » ou « le délai est dépassé, il n'y a plus rien à faire ». Si le délai paraît échu, tu dis ce qui reste possible (féries, suspension, nullité, restitution, autre voie) et tu l'envoies agir aujourd'hui. Agir est gratuit ; le silence est irréversible.

JSON :
{
  "situation": "ce qui lui arrive, en une phrase, dans ses mots à elle",
  "a_faire_aujourdhui": [
    { "acte": "l'action concrète", "aupres_de": "l'autorité exacte", "cout": "gratuit ou montant", "base_legale": "...", "pourquoi_maintenant": "..." }
  ],
  "delai": {
    "duree": "...", "point_de_depart": "...", "base_legale": "...",
    "suspendu_ou_reporte": "si des féries ou une protection s'appliquent, dis-le",
    "certitude": "certain" | "a_verifier"
  },
  "pieges_retenus": [ { "titre": "...", "base_legale": "...", "pourquoi_il_tient": "il a survécu à la réfutation parce que…" } ],
  "pieges_ecartes": [ { "titre": "...", "pourquoi_ecarte": "détruit par la réfutation parce que…" } ],
  "desaccords": ["les points où le comité ne s'accorde pas — ne les cache pas"],
  "erreurs_du_dossier_a_signaler": ["ce que notre propre corpus dit et qui est faux"],
  "questions_a_lui_poser": ["les faits manquants, formulés comme des questions simples"],
  "ce_que_je_ne_sais_pas": ["sois explicite : c'est ce qui la protège"],
  "voir_un_humain": true,
  "pourquoi_un_humain": "..."
}`,
};

export const COMITE = [ENQUETEUR, AVOCAT_CITOYEN, GREFFIER, CHASSEUR_DE_PIEGES, REFUTATEUR, JUGE];

// ─── Mécanique ────────────────────────────────────────────────────────────────

// ⚠ 8000, pas 3000. Au premier duel, le réfutateur et le juge ont été COUPÉS en plein
// milieu d'une phrase : leur JSON était invalide, le comité a « perdu » le cas, et le
// diagnostic affiché disait « réponse hors-schéma » — ce qui accusait le modèle alors que
// la faute était au budget de sortie. Une panne mal nommée envoie chercher au mauvais
// endroit ; c'est exactement l'erreur que ce produit est censé empêcher chez les autres.
async function appeler({ system, user, model, apiKey, maxTokens = 8000, timeoutMs = 180000 }) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: ctrl.signal,
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        // Le dossier est mis en cache : chaque rôle le relit à 10 % du prix.
        // C'est CE mécanisme qui rend cinq agents abordables à 5 francs.
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!resp.ok) {
      throw new Error(`API ${resp.status}: ${(await resp.text().catch(() => '')).slice(0, 200)}`);
    }

    const data = await resp.json();
    const brut = (data.content || []).map(b => b.text || '').join('');
    const propre = brut.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(propre);
    } catch {
      // Une panne est DITE, jamais avalée — et NOMMÉE JUSTE. « Tronqué » (on a coupé le
      // rôle au milieu d'une phrase) et « hors-schéma » (le modèle a mal répondu) appellent
      // deux corrections opposées : la première fois, avoir confondu les deux m'a fait
      // accuser le modèle d'une faute qui était la mienne.
      const tronque = data.stop_reason === 'max_tokens';
      parsed = {
        _panne: tronque ? 'tronque' : 'hors_schema',
        _detail: tronque
          ? `coupé à ${maxTokens} tokens de sortie — augmenter le budget, ce n'est pas la faute du modèle`
          : 'le modèle n\'a pas rendu de JSON valide',
        _brut: propre.slice(0, 3000),
      };
    }
    return { parsed, usage: data.usage || null };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Le dossier : ce que tous les rôles voient. Formaté une seule fois → mis en cache une
 * seule fois. Les faits de la personne d'abord ; nos données ensuite, et marquées comme
 * suspectes — parce qu'elles le sont.
 */
export function redigerDossier(d) {
  const l = [];
  l.push('══ CE QUE LA PERSONNE RACONTE ══');
  l.push(`"""${d.texte_citoyen}"""`);

  if (d.canton) l.push(`\nCanton : ${d.canton}`);
  if (d.date_du_jour) l.push(`Date du jour : ${d.date_du_jour}`);

  const faits = Object.entries(d.faits || {}).filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (faits.length) {
    l.push('\n══ FAITS ÉTABLIS (son récit + ses réponses à nos questions) ══');
    for (const [k, v] of faits) l.push(`  · ${k} : ${v}`);
  }

  if (d.articles?.length) {
    l.push('\n══ ARTICLES AU DOSSIER — À VÉRIFIER, PAS À RECOPIER ══');
    for (const a of d.articles.slice(0, 25)) {
      l.push(`  · ${a.ref || a.id} : ${(a.texte || a.titre || '').slice(0, 400)}`);
    }
  }

  // ⚠ La SEULE donnée dont on soit sûr : lue dans la liste officielle de l'Office fédéral
  // du logement (8 juillet 2026), jamais générée. Tout le reste du dossier vient d'un
  // corpus dont 76 % des affirmations sont fausses ou trompeuses.
  if (d.autorites?.length) {
    l.push('\n══ AUTORITÉS COMPÉTENTES (source officielle OFL — fiable) ══');
    for (const a of d.autorites.slice(0, 6)) {
      const adr = [a.adresse, a.npa && `${a.npa} ${a.localite}`].filter(Boolean).join(', ');
      l.push(`  · ${a.autorite || '(nom manquant)'} — ${adr || 'adresse manquante'}${a.telephone ? ` — ${a.telephone}` : ''}`);
      if (a.champs_manquants?.length) l.push(`      (introuvable à la source : ${a.champs_manquants.join(', ')})`);
    }
  }

  return l.join('\n');
}

// ═══ LE GREFFE : on va LIRE la loi, on ne la fait pas réciter ════════════════
//
// C'est ici que le comité cesse d'être un concours d'éloquence. Aucun agent n'intervient :
// du code va chercher, sur Fedlex, le texte OFFICIEL de chaque article invoqué — dans sa
// version en vigueur aujourd'hui — et le pose sous les yeux du juge, à côté de l'affirmation
// qu'il est censé fonder. Le juge lit LA LOI, pas les avocats.
//
// ⚠ POURQUOI PAS « L'AGENT RECOPIE, ON VÉRIFIE ». On a essayé. Ça a échoué, et l'échec est
// instructif : le CHASSEUR (qui avait raison) a répondu honnêtement « je sais que l'art. 69
// LAI dit ça mais je ne peux pas le citer mot à mot » → écarté. Le RÉFUTATEUR (qui avait tort)
// se souvenait par cœur de l'art. 52 LPGA, article court et célèbre → admis.
// Le filtre punissait l'honnête et récompensait l'assuré. Exiger la récitation, c'est fabriquer
// une prime à l'aplomb. Il fallait aller chercher le texte.

/** Récupère toutes les affirmations sourçables d'un rôle, quel que soit son schéma. */
function extraireAffirmations(avis, role) {
  if (!avis || avis._panne) return [];
  const out = [];
  const pousser = (texte, preuve, meta = {}) => {
    if (texte) out.push({ role, texte: String(texte), preuve: preuve || null, ...meta });
  };
  for (const t of avis.theses || []) pousser(t.affirmation, t.preuve, { force: t.force });
  for (const a of avis.actions || []) pousser(a.acte, a.preuve, { acte: true });
  for (const p of avis.pieges || []) pousser(p.titre, p.preuve, { piege: true, certitude: p.certitude, que_faire: p.que_faire });
  for (const v of avis.verdicts || []) pousser(v.objection, v.preuve, { verdict: v.verdict, vise: v.affirmation_visee });
  return out;
}

/**
 * ⚠ LA RÈGLE SPÉCIALE ÉCARTE LA RÈGLE GÉNÉRALE — ET C'EST DU CODE QUI L'APPLIQUE.
 *
 * Ceci est le cœur du module, et il a fallu trois échecs pour y arriver.
 *
 * On a d'abord cru qu'il suffisait de mettre la loi sous les yeux du juge. On lui a donc posé
 * le texte officiel de l'art. 69 LAI en face de l'affirmation, avec la bannière :
 *     « art. 69 LAI : En dérogation aux art. 52 et 58 LPGA »
 * Il l'a lue. Et il a quand même écrit : « Je m'oppose à la décision… (art. 52 LPGA) », en
 * envoyant la lettre à l'office AI. C'est-à-dire l'acte exact qui fait perdre la rente.
 *
 * LA LEÇON, et elle est brutale : LE RÉFLEXE DU MODÈLE BAT LE TEXTE QU'IL VIENT DE LIRE.
 * « En assurance sociale, on fait opposition » est un a priori si écrasant qu'aucune consigne
 * de prompt ne le déloge. Montrer la loi ne suffit pas. Il faut RETIRER l'option.
 *
 * Alors le conflit de normes n'est plus arbitré : il est TRANCHÉ PAR DU CODE, avant que le
 * juge ne voie quoi que ce soit. Quand un article invoqué dit lui-même « en dérogation aux
 * art. 52 et 58 LPGA », toute affirmation adossée aux art. 52 ou 58 LPGA est ÉCARTÉE. Le juge
 * ne peut plus la choisir, parce qu'elle n'est plus devant lui.
 *
 * Ce n'est pas une opinion sur le droit : c'est le texte de loi qui le déclare, en toutes
 * lettres, et la règle la plus élémentaire de la hiérarchie des normes (lex specialis).
 */
/**
 * Lit « En dérogation aux art. 52 et 58 LPGA » → [{ loi: 'LPGA', article: '52' }, { … '58' }]
 *
 * ⚠ CE PARSEUR DOIT ÊTRE TIMIDE, PAS MALIN. Écarter à tort un article parfaitement applicable
 * est aussi grave que de laisser passer le mauvais : dans les deux cas, quelqu'un perd un droit.
 *
 * Première version, naïve : « attrape tous les nombres, colle-les à la première loi vue ».
 * Sur l'art. 68bis LAI — « en dérogation à l'art. 32 LPGA ET À L'ART. 50a, AL. 1, LAVS,
 * l'échange de données au sens DES AL. 2 ET 3 » — elle écartait les art. 1, 2, 3 et 50 de la
 * LPGA. Elle confondait les ALINÉAS avec des articles, et attribuait à la LPGA un article de
 * la LAVS.
 *
 * D'où cette petite machine à états, qui lit comme on lit : « art. » ouvre une liste de
 * numéros, « al. » la ferme (un alinéa n'est pas un article), et le nom d'une loi solde la
 * liste en cours. Rien n'est écarté sans être rattaché explicitement à sa loi.
 */
const LOIS_CONNUES = /^(LPGA|LAVS|LAI|LAA|LAMal|LACI|LPP|LEI|LEg|CO|CC|CPC|CPP|LP|CP|LCR|LTF)$/i;

// Après le nom de la loi, la liste d'articles est CLOSE. On ne la rouvre que si la phrase
// enchaîne explicitement sur une seconde dérogation (« … LPGA ET À L'ART. 50a LAVS »).
// Sans ça, on avale les articles simplement CITÉS dans la suite de la phrase.
const CONNECTEURS = /^(et|ou|ainsi|,|à|aux?|l['’]|de|des|du)$/i;

/**
 * ⚠ CE PARSEUR SUPPRIME DES ARGUMENTS JURIDIQUES. Il doit être TIMIDE, pas malin.
 *
 * Deux erreurs, et elles ne se valent pas :
 *   · SOUS-ÉCARTER → le juge voit les deux articles et peut se tromper. C'est le bug d'origine
 *     (la rente AI). Mauvais, mais le chasseur de pièges signale encore le piège.
 *   · SUR-ÉCARTER → on retire du dossier un article qui S'APPLIQUE. La personne perd un droit,
 *     silencieusement, et plus personne ne peut le rattraper. C'est pire.
 * → EN CAS DE DOUTE, ON N'ÉCARTE PAS.
 *
 * Confronté aux 73 dérogations RÉELLES du droit fédéral (LAI, LPGA, CO, LP, CPC, LAA, LACI,
 * LAMal — extraites du texte officiel, pas imaginées), le parseur naïf se plantait de trois
 * façons :
 *
 *   1. IL SUR-ÉCARTAIT. Art. 58 LAI : « en dérogation à l'art. 49, al. 1, LPGA, que la procédure
 *      simplifiée prévue à l'art. 51 [LPGA] n'est pas applicable ». Il écartait AUSSI l'art. 51
 *      LPGA — qui n'est pas dérogé, seulement CITÉ. → d'où la règle : le nom de la loi CLÔT la
 *      liste ; on ne la rouvre que sur un connecteur explicite.
 *
 *   2. IL RATAIT « (CO) ». Art. 86 LP : « En dérogation à l'art. 63 du code des obligations
 *      (CO) ». Le token lu était « (CO) », pas « CO ». → on dépouille la ponctuation, et on
 *      reconnaît les noms longs.
 *
 *   3. IL RATAIT LES DÉROGATIONS INTERNES. Art. 34 LAI : « en dérogation à l'art. 28, al. 1,
 *      let. b » — sans nom de loi, parce que c'est la MÊME loi. → on rattache à la loi de
 *      l'article citant… mais UNIQUEMENT si aucun nom de loi n'apparaît dans la clause. Sinon on
 *      écarterait l'art. 63 LP en lisant l'art. 86 LP (« en dérogation à l'art. 63 CO ») — et
 *      l'art. 63 LP, ce sont justement les FÉRIES. On aurait retiré à quelqu'un le report de son
 *      délai. Le piège se referme au millimètre.
 */
const NOMS_LONGS = [
  [/code des obligations/i, 'CO'],
  [/code civil/i, 'CC'],
  [/code de procédure civile/i, 'CPC'],
  [/code de procédure pénale/i, 'CPP'],
  [/code pénal/i, 'CP'],
  [/loi (fédérale )?sur la poursuite pour dettes/i, 'LP'],
];

export function lireDerogation(texte, loiParDefaut = null) {
  const clause = String(texte);

  // La clause s'arrête à la fin de la PHRASE. Sans ça, « … LPGA . Les rentes sont perçues … »
  // laisse le parseur courir dans la phrase suivante et ramasser n'importe quoi.
  // (On ne coupe pas sur tout point : « art. » en contient un. On coupe sur « . » suivi d'une
  //  majuscule — une vraie fin de phrase.)
  const fin = clause.search(/\.\s+[A-ZÀ-Ü]/);
  const utile = fin > 0 ? clause.slice(0, fin) : clause;

  const cibles = [];
  let mode = null;        // 'art' → les nombres qui suivent sont des articles ; 'al'/'let' → non
  let enAttente = [];     // [{ num, qualifie }] — articles lus, pas encore rattachés à une loi
  let close = false;      // une loi a soldé la liste : on n'accepte plus rien sans connecteur

  const solder = (sigle) => {
    for (const a of enAttente) cibles.push({ loi: sigle.toUpperCase(), article: a.num.toLowerCase(), qualifie: a.qualifie });
    enAttente = [];
  };

  for (const brut of utile.split(/\s+/)) {
    // La loi élide (« à l'art. 32 LPGA ») et parenthèse (« (CO) »). Sans dépouiller ça, la
    // dérogation passe inaperçue et l'article écarté revient dans le dossier.
    const t = brut.replace(/^[«»(\[]+/, '').replace(/[»)\],.;:]+$/, '').replace(/^[ldn][''’]/i, '');
    if (!t) continue;

    if (/^art(icle)?s?\.?$/i.test(t)) { mode = 'art'; enAttente = []; close = false; continue; }

    // ⚠ « al. » et « let. » ne sont pas des articles — ET ILS QUALIFIENT la dérogation.
    // Art. 34 LAI : « en dérogation à l'art. 28, AL. 1, LET. B ». La dérogation ne vise PAS tout
    // l'art. 28 : seulement son al. 1 let. b. Écarter l'article entier serait retirer du dossier
    // des droits parfaitement applicables. On le marque, et on ne l'écartera pas.
    if (/^al(inéa)?s?\.?$/i.test(t) || /^let(tre)?s?\.?$/i.test(t)) {
      if (enAttente.length) enAttente[enAttente.length - 1].qualifie = true;
      mode = 'qualif';
      continue;
    }

    const loi = t.match(LOIS_CONNUES)?.[1];
    if (loi) {
      solder(loi);
      mode = null;
      close = true;   // ⚠ la liste est CLOSE : ce qui suit n'est plus dérogé, seulement cité
      continue;
    }

    if (close) {
      // On ne rouvre que sur un connecteur explicite (« … LPGA ET À L'ART. 50a LAVS »).
      // « … LPGA, QUE la procédure prévue à l'art. 51 » → « que » n'est pas un connecteur : STOP.
      if (CONNECTEURS.test(t)) continue;
      break;
    }

    if (mode === 'art') {
      const num = t.match(/^(\d+[a-z]?(?:bis|ter|quater)?)$/i)?.[1];
      if (num) enAttente.push({ num, qualifie: false });
      else if (!CONNECTEURS.test(t)) mode = null;   // on est sorti de la liste
    }
  }

  if (!cibles.length && enAttente.length) {
    // Un nom de loi écrit en toutes lettres : « en dérogation à l'art. 63 DU CODE DES
    // OBLIGATIONS (CO) » (art. 86 LP).
    const long = NOMS_LONGS.find(([re]) => re.test(utile));
    if (long) {
      solder(long[1]);
    } else if (loiParDefaut) {
      // Aucun nom de loi nulle part → dérogation INTERNE (« en dérogation à l'art. 28, al. 1 »
      // dans la LAI = art. 28 LAI). On rattache à la loi citante.
      // ⚠ SEULEMENT dans ce cas. Sinon, en lisant l'art. 86 LP (« en dérogation à l'art. 63 du
      // code des obligations »), on écarterait l'art. 63 LP — c'est-à-dire les FÉRIES. On aurait
      // retiré à quelqu'un le report de son délai en croyant appliquer la loi. Le piège se
      // referme au millimètre.
      solder(loiParDefaut);
    }
  }

  return cibles;
}

/**
 * ⚠ UNE DÉROGATION EST LIÉE À UN RÉGIME — PAS AU DOSSIER ENTIER.
 *
 * L'art. 69 LAI supprime l'opposition POUR LES DÉCISIONS DES OFFICES AI. Il ne la supprime pas en
 * assurance-maladie, où l'art. 52 LPGA s'applique pleinement.
 *
 * Or une même personne peut très bien avoir les deux : un refus de rente AI ET un litige avec sa
 * caisse-maladie. C'est même fréquent — quelqu'un de malade depuis trois ans. Deux erreurs
 * symétriques nous guettent, et j'ai commis les deux dans la même heure :
 *
 *   · ÉCARTER GLOBALEMENT l'art. 52 LPGA parce que l'art. 69 LAI est invoqué → on dit à cette
 *     personne « il n'y a pas d'opposition », Y COMPRIS pour son affaire LAMal, où l'opposition
 *     existe. Elle perd ce droit-là, à cause du mécanisme censé la protéger.
 *
 *   · N'ÉCARTER RIEN dès qu'il y a deux régimes (mon premier « garde-fou ») → on rouvre le bug de
 *     la rente : le juge revoit l'art. 52 LPGA, suit son réflexe, conseille l'opposition à
 *     l'office AI. C'est Codex qui l'a vu. Ma prudence recréait exactement la faille qu'elle
 *     prétendait fermer.
 *
 * LA SEULE SORTIE EST DE SCOPER PAR AFFIRMATION. Chaque affirmation porte le RÉGIME dont elle
 * relève. Une dérogation issue de la LAI n'écarte que les affirmations qui parlent d'AI. L'affaire
 * LAMal de la même personne garde son opposition. Chaque droit est jugé dans son monde.
 */
const FAMILLE_LPGA = new Set(['LAI', 'LAA', 'LAMAL', 'LACI', 'LAVS', 'LPP']);

/** Le régime dont relève une affirmation : ce que l'agent a déclaré, sinon la loi qu'il cite. */
function regimeDe(affirmation) {
  const r = affirmation.preuve?.regime || affirmation.regime;
  if (r) return String(r).toUpperCase();
  const loi = String(affirmation.preuve?.loi || '').toUpperCase();
  // Une affirmation fondée sur la LPGA (loi-cadre) ne dit pas d'elle-même de quel régime elle
  // relève : c'est précisément l'ambiguïté qui a coûté la rente. On ne devine pas.
  return FAMILLE_LPGA.has(loi) ? loi : null;
}

export function trouverDerogations(registre) {
  const derogations = [];
  const vues = new Set();

  // Combien de régimes d'assurance sociale ce dossier met-il en jeu ? (sert à dire au juge
  // quand il doit se méfier, plus à décider s'il faut écarter)
  const regimes = new Set(registre.map(regimeDe).filter(x => x && FAMILLE_LPGA.has(x)));
  const domaineAmbigu = regimes.size > 1;

  for (const r of registre) {
    if (!r.preuve) continue;

    // ⚠ UN ARTICLE PEUT CONTENIR PLUSIEURS DÉROGATIONS. L'art. 97 LAA en a SIX, l'art. 84a LAMal
    // cinq, l'art. 47 LAI trois. Ma première version n'en lisait qu'UNE (la première du texte) —
    // et pouvait donc manquer exactement celle qui décide du cas. Trouvé par Codex en relecture ;
    // je ne l'avais pas vu, et aucun de mes tests ne le couvrait.
    const clauses = r.lecture?.derogations?.length
      ? r.lecture.derogations
      : (r.lecture?.derogation ? [r.lecture.derogation] : []);
    if (!clauses.length) continue;

    const par = `art. ${r.preuve.article} ${r.preuve.loi}`;
    if (vues.has(par)) continue;      // le même article invoqué dix fois ne déroge qu'une
    vues.add(par);

    const cibles = clauses.flatMap(c => lireDerogation(c, r.preuve.loi));
    if (!cibles.length) continue;

    // ⚠ ON N'ÉCARTE QUE LES DÉROGATIONS QUI VISENT L'ARTICLE ENTIER.
    //
    // « En dérogation aux art. 52 et 58 LPGA » (art. 69 LAI) → l'opposition n'existe pas, point.
    // On écarte : c'est ce qui sauve la rente.
    //
    // « En dérogation à l'art. 19, AL. 3, LPGA » (art. 47 LAI) → seul l'al. 3 est écarté. Retirer
    // tout l'art. 19 LPGA du dossier reviendrait à priver la personne de ses alinéas 1 et 2, qui
    // s'appliquent parfaitement. Ce serait un droit perdu, silencieusement.
    //
    // Sur les 73 dérogations réelles du droit fédéral, la grande majorité sont QUALIFIÉES. Les
    // écarter en bloc aurait transformé le mécanisme qui sauve un droit en machine à en détruire.
    // On les signale au juge — on ne les supprime pas. En cas de doute : on n'écarte pas.
    const ecarte = cibles.filter(c => !c.qualifie);
    const signale = cibles.filter(c => c.qualifie);

    if (ecarte.length || signale.length) {
      derogations.push({
        par,
        texte: clauses.join(' | '),
        ecarte,
        signale,
        // ⚠ LE RÉGIME DE LA DÉROGATION. C'est lui qui décide QUI elle écarte : une dérogation
        // issue de la LAI ne touche que les affirmations qui parlent d'AI. Sans ce champ, on
        // retirerait à quelqu'un son opposition en assurance-maladie parce qu'il a aussi un
        // dossier AI.
        regime: String(r.preuve.loi).toUpperCase(),
        // Sert à avertir le juge que le dossier est mixte — pas à renoncer à écarter.
        domaine_ambigu: domaineAmbigu ? [...regimes].join(' + ') : null,
      });
    }
  }
  return derogations;
}

/**
 * Une affirmation s'appuie-t-elle sur un article que la loi elle-même a écarté — DANS SON RÉGIME ?
 *
 * ⚠ « Dans son régime » est le mot qui compte. L'art. 69 LAI supprime l'opposition pour les
 * décisions des offices AI, pas pour l'assurance-maladie. Une personne malade depuis trois ans
 * peut avoir les deux. Si on écarte l'art. 52 LPGA globalement, on lui retire son droit
 * d'opposition LAMal — silencieusement, avec le mécanisme censé la protéger.
 */
export function estEcarteeParDerogation(affirmation, derogations) {
  if (!affirmation.preuve?.loi || !affirmation.preuve?.article) return null;
  const loi = String(affirmation.preuve.loi).toUpperCase();
  const art = String(affirmation.preuve.article).replace(/^art\.?\s*/i, '').match(/^(\d+[a-z]?)/i)?.[1]?.toLowerCase();
  if (!art) return null;

  const regimeAffirmation = regimeDe(affirmation);

  for (const d of derogations) {
    // Une dérogation ne s'écarte pas elle-même (l'art. 69 LAI ne s'auto-annule pas).
    if (d.par === `art. ${affirmation.preuve.article} ${affirmation.preuve.loi}`) continue;
    if (!d.ecarte.some(e => e.loi === loi && e.article === art)) continue;

    // Le régime décide. Si l'affirmation ne déclare aucun régime, on n'écarte QUE si le dossier
    // n'en connaît qu'un seul — sinon on ne peut pas savoir de quelle affaire elle parle, et
    // écarter au hasard reviendrait à tirer à pile ou face sur un droit.
    if (regimeAffirmation && regimeAffirmation !== d.regime) continue;
    if (!regimeAffirmation && d.domaine_ambigu) continue;

    return d;
  }
  return null;
}

/** Va lire chaque article invoqué. Une lecture par article, même s'il est cité dix fois. */
async function tenirLeGreffe(affirmations, { dateDuJour }) {
  const cache = new Map();
  const lire = async (p) => {
    const cle = `${p.loi}|${p.article}`;
    if (!cache.has(cle)) cache.set(cle, lireArticle(p, { dateDuJour }).catch(err => ({
      lisible: false, statut: 'source_indisponible', pourquoi: err.message,
    })));
    return cache.get(cle);
  };

  return Promise.all(affirmations.map(async (a) => {
    if (!a.preuve?.loi || !a.preuve?.article) {
      // Pas de source citée : ce n'est pas forcément une faute (ça peut être une question de
      // fait, pas de droit) — mais ça ne pèse rien face à un texte de loi.
      return { ...a, lecture: { lisible: false, statut: 'aucune_source_citee' } };
    }
    const lecture = await lire(a.preuve);

    // Bonus : si l'agent a ajouté une citation littérale, on la confronte au texte réel.
    // Une citation qui ne colle pas au texte officiel est le signal le plus grave qu'un
    // agent puisse émettre — c'est la signature d'une fabrication.
    let citation_exacte = null;
    if (lecture.lisible && a.preuve.citation && a.preuve.citation.length > 25) {
      citation_exacte = citationEstDansLeTexte(a.preuve.citation, lecture.texte).ok;
    }
    return { ...a, lecture, citation_exacte };
  }));
}

/**
 * Ce que le juge lit : chaque affirmation, avec LE TEXTE DE LOI en face.
 * Le style, l'assurance, l'abondance de détail — les trois armes qui ont fait gagner le
 * mensonge le 12 juillet — n'ont plus de surface où s'exprimer : à côté de chaque phrase, il
 * y a la loi.
 */
function dresserLeTableau(registre, derogations) {
  const l = [];
  const ecartees = registre.filter(r => r.ecartee_par);
  const restant = registre.filter(r => !r.ecartee_par);
  const sourcees = restant.filter(r => r.lecture.lisible);
  const sans = restant.filter(r => !r.lecture.lisible);

  // ── Ce que la LOI ELLE-MÊME a exclu. Annoncé en premier, avant tout le reste : le juge
  //    doit savoir qu'une porte est fermée avant de commencer à chercher son chemin.
  if (derogations.length) {
    l.push('══ ⚠ CE QUE LA LOI DIT D\'ELLE-MÊME SUR SES PROPRES EXCEPTIONS ══\n');
    for (const d of derogations) {
      l.push(`  ${d.par} dit, dans son propre texte : « ${d.texte} »`);

      if (d.ecarte.length) {
        l.push(`  → Dans ce dossier, ${d.ecarte.map(e => `l'art. ${e.article} ${e.loi}`).join(' et ')} NE S'APPLIQUE PAS.`);
        l.push(`     La règle spéciale écarte la règle générale. Le législateur l'a écrit noir sur blanc.`);
      }

      // Une dérogation qui ne vise qu'un alinéa ne fait PAS tomber l'article entier : ses autres
      // alinéas s'appliquent toujours. On le dit, on ne le tranche pas.
      if (d.signale.length && !d.domaine_ambigu) {
        l.push(`  → ⚠ Attention : ${d.signale.map(e => `l'art. ${e.article} ${e.loi}`).join(', ')} n'est dérogé QUE PARTIELLEMENT`);
        l.push(`     (un alinéa, une lettre — pas l'article entier). Ses autres dispositions s'appliquent.`);
      }

      // ⚠ Et quand le dossier mêle plusieurs régimes, on refuse de trancher — et on le DIT.
      // Se taire ici reviendrait à laisser le juge croire que l'article est valable partout.
      if (d.domaine_ambigu) {
        l.push(`  → ⚠⚠ CE DOSSIER MÊLE PLUSIEURS RÉGIMES (${d.domaine_ambigu}). Cette dérogation ne vaut QUE`);
        l.push(`     pour le domaine de ${d.par} — pas pour les autres. Je n'ai donc RIEN écarté : à toi de`);
        l.push(`     vérifier, pour CHAQUE démarche, de quel régime elle relève. Ne transpose pas.`);
      }
      l.push('');
    }
    if (ecartees.length) {
      l.push('  Les affirmations suivantes reposaient sur ces articles écartés. ELLES ONT ÉTÉ RETIRÉES');
      l.push('  DU DOSSIER — tu ne peux pas les retenir, même si elles te paraissent évidentes :');
      for (const r of ecartees) {
        l.push(`    ✗ [${r.role}] ${String(r.texte).slice(0, 120)}`);
        l.push(`        (s'appuyait sur art. ${r.preuve.article} ${r.preuve.loi}, écarté par ${r.ecartee_par.par})`);
      }
      l.push('');
    }
  }

  l.push('══ CE QUI EST AFFIRMÉ, ET CE QUE LA LOI DIT VRAIMENT ══');
  l.push('(le texte ci-dessous est le texte OFFICIEL, lu sur Fedlex, en vigueur aujourd\'hui —');
  l.push(' ce n\'est pas ce qu\'un agent a écrit : c\'est la loi elle-même)');

  if (!sourcees.length) l.push('\n  (personne n\'a cité un article que nous puissions aller lire)');

  for (const r of sourcees) {
    l.push(`\n  ┌─ [${r.role}] ${r.texte}`);
    if (r.verdict) l.push(`  │  (attaque « ${r.verdict} » contre : ${String(r.vise || '').slice(0, 110)})`);
    l.push(`  │  invoque : art. ${r.preuve.article} ${r.preuve.loi}`);
    l.push(`  │  TEXTE OFFICIEL (${r.lecture.en_vigueur_depuis}) : « ${r.lecture.texte.replace(/^id="art_[^"]*">\s*/, '').slice(0, 420)} »`);
    if (r.lecture.derogation) {
      l.push(`  │  ⚠⚠ CET ARTICLE EST UNE DÉROGATION : « ${r.lecture.derogation} »`);
      l.push(`  │      C'est LUI qui s'applique. Les articles auxquels il déroge ont été retirés ci-dessus.`);
    }
    if (r.citation_exacte === false) {
      l.push(`  │  ⚠ SIGNAL GRAVE : cet intervenant a « cité » ce texte, et sa citation NE CORRESPOND PAS.`);
      l.push(`  │      Il a fabriqué. Traite le reste de ses affirmations avec la plus grande méfiance.`);
    }
    if (r.que_faire) l.push(`  │  à faire : ${r.que_faire}`);
    l.push('  └─');
  }

  if (sans.length) {
    l.push('\n\n══ AFFIRMATIONS SANS SOURCE VÉRIFIABLE — elles ne pèsent RIEN contre un texte de loi ══');
    for (const r of sans) {
      const motif = {
        source_non_verifiable: 'jurisprudence / pratique / doctrine — invérifiable, donc sans poids',
        article_introuvable: 'CET ARTICLE N\'EXISTE PAS',
        aucune_source_citee: 'aucun article cité',
        source_indisponible: 'texte officiel injoignable — non vérifié, donc non retenu',
      }[r.lecture.statut] || r.lecture.statut;
      l.push(`  ✗ [${r.role}] ${String(r.texte).slice(0, 130)}`);
      l.push(`      → ${motif}${r.preuve ? ` (invoquait : ${r.preuve.article} ${r.preuve.loi})` : ''}`);
    }
  }

  l.push(`

⚠ LA RÈGLE QUI PRIME SUR TON JUGEMENT :

Une affirmation appuyée sur un TEXTE DE LOI que tu peux lire ci-dessus l'emporte sur une
affirmation qui n'en a pas — même si la seconde est mieux argumentée, plus détaillée, plus sûre
d'elle. Une jurisprudence citée de mémoire ne détruit RIEN.

Et ce qui a été ÉCARTÉ PAR LA LOI n'existe pas. Ne le fais pas revenir par la fenêtre parce
qu'il te semble familier ou évident. C'est exactement ce qui s'est produit le 12 juillet 2026 :
on avait mis sous les yeux du juge le texte de l'art. 69 LAI (« en dérogation aux art. 52 et 58
LPGA »), il l'a lu — et il a quand même conseillé une opposition fondée sur l'art. 52 LPGA,
parce que « en assurance sociale, on fait opposition » est un réflexe plus fort que la lecture.
Cette personne aurait perdu sa rente.

Ton habitude n'est pas une source du droit.`);

  return l.join('\n');
}

/**
 * Réunit le comité. 3 voix en parallèle → 1 réfutateur qui les attaque → le GREFFE vérifie
 * chaque preuve contre le texte officiel → 1 juge qui tranche sur les seules pièces
 * recevables. Retourne la décision ET tout ce qui s'est dit : un citoyen qui paie a le droit
 * de voir la délibération qu'il a achetée — y compris ce qui a été écarté, et pourquoi.
 */
export async function reunirComite(dossier, { apiKey = process.env.ANTHROPIC_API_KEY, onEtape = () => {} } = {}) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante — le comité ne peut pas délibérer sans budget de calcul');

  const texte = redigerDossier(dossier);
  const t0 = Date.now();
  const usages = [];
  const echecs = [];

  const jouer = async (role, contenu, model = MODELE_ROLE) => {
    onEtape(role.label);
    try {
      const { parsed, usage } = await appeler({ system: role.prompt, user: contenu, model, apiKey });
      if (usage) usages.push(usage);
      if (parsed._panne) echecs.push(`${role.label} : ${parsed._detail}`);
      return parsed;
    } catch (err) {
      // Un rôle muet est DIT. Si le réfutateur tombe, la contradiction n'a pas eu lieu —
      // et le citoyen a le droit de savoir qu'il n'a pas reçu ce qu'il a payé.
      echecs.push(`${role.label} : ${err.message}`);
      return null;
    }
  };

  // ── TOUR 0 : peut-on seulement conseiller cette personne sans inventer ?
  //
  // C'est la moitié de la vision de Robin qui n'existait pas : « on récolte les infos dont on a
  // besoin VIA DES QUESTIONS, et quand on a tout, on cherche la réponse ». Sans ce garde-fou,
  // le comité répond TOUJOURS — et sur « mon propriétaire veut pas me rendre l'argent », il
  // invente une procédure et un délai, exactement comme le modèle gratuit.
  //
  // Et on ne dépense pas cinq agents à deviner : si on ne peut pas savoir, on demande. C'est
  // moins cher ET plus honnête.
  const enquete = await jouer(ENQUETEUR, texte);

  if (enquete && !enquete._panne && enquete.peut_on_conseiller === false && enquete.questions?.length) {
    const usagesE = usages.slice();
    return {
      statut: 'questions',
      // ⚠ L'acte sûr est donné MÊME quand on questionne. Un délai ne s'arrête pas pour attendre
      // une réponse : faire patienter quelqu'un dont le droit s'éteint serait la pire des
      // prudences.
      acte_sur_immediat: enquete.acte_sur_immediat?.il_y_en_a_un ? enquete.acte_sur_immediat : null,
      questions: enquete.questions,
      ce_qu_on_sait_deja: enquete.ce_qu_on_sait_deja || [],
      decision: null,
      deliberation: { enquete },
      greffe: null,
      echecs,
      contradiction_a_eu_lieu: false,
      cout: {
        appels_llm: usagesE.length,
        tokens_entree: usagesE.reduce((n, u) => n + (u.input_tokens || 0), 0),
        tokens_sortie: usagesE.reduce((n, u) => n + (u.output_tokens || 0), 0),
        cout_estime_chf: Number(((usagesE.reduce((n, u) => n + (u.input_tokens || 0), 0) / 1e6) * 3
          + (usagesE.reduce((n, u) => n + (u.output_tokens || 0), 0) / 1e6) * 15).toFixed(3)),
        duree_ms: Date.now() - t0,
      },
    };
  }

  // TOUR 1 — trois voix qui ne s'entendent pas (c'est la condition de la divergence).
  const [these, formes, pieges] = await Promise.all([
    jouer(AVOCAT_CITOYEN, texte),
    jouer(GREFFIER, texte),
    jouer(CHASSEUR_DE_PIEGES, texte),
  ]);

  // TOUR 2 — le réfutateur reçoit une CIBLE. Sans cible, pas de contradiction.
  const cible = `${texte}

══ LA THÈSE DE L'AVOCAT DU CITOYEN — attaque-la ══
${JSON.stringify(these, null, 1)}

══ LES PIÈGES ANNONCÉS PAR LE CHASSEUR — attaque-les aussi ══
${JSON.stringify(pieges, null, 1)}

Un piège inventé fera agir cette personne à tort. Sois impitoyable — mais concède ce qui tient.`;
  const refutation = await jouer(REFUTATEUR, cible);

  // ── LE GREFFE — le contrôle de recevabilité, par du code, contre le texte officiel.
  onEtape('Greffe (vérification des preuves sur Fedlex)');
  const affirmations = [
    ...extraireAffirmations(these, 'avocat du citoyen'),
    ...extraireAffirmations(pieges, 'chasseur de pièges'),
    ...extraireAffirmations(refutation, 'réfutateur'),
  ];
  const registre = await tenirLeGreffe(affirmations, { dateDuJour: dossier.date_du_jour });

  // La loi tranche le conflit de normes AVANT le juge. Pas de discrétion : quand l'art. 69
  // LAI dit « en dérogation aux art. 52 et 58 LPGA », les affirmations fondées sur l'art. 52
  // LPGA sortent du dossier. Le juge ne peut plus choisir la mauvaise porte, parce qu'elle
  // n'est plus là.
  const derogations = trouverDerogations(registre);
  for (const r of registre) {
    const d = estEcarteeParDerogation(r, derogations);
    if (d) r.ecartee_par = d;
  }

  const tableau = dresserLeTableau(registre, derogations);

  // TOUR 3 — le juge ne lit plus de plaidoiries. Il lit un tableau de pièces vérifiées.
  const pourLeJuge = `${texte}

${tableau}

══ ANALYSE FORMELLE DU GREFFIER (délais, compétence, formes) ══
${JSON.stringify(formes, null, 1)}

Tranche en lisant les textes de loi ci-dessus. Ne te laisse pas emporter par ce qui est bien dit : regarde ce qui est écrit dans la loi.`;
  const decision = await jouer(JUGE, pourLeJuge, MODELE_JUGE);

  const tokensIn = usages.reduce((n, u) => n + (u.input_tokens || 0), 0);
  const tokensCache = usages.reduce((n, u) => n + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0), 0);
  const tokensOut = usages.reduce((n, u) => n + (u.output_tokens || 0), 0);

  const sourcees = registre.filter(r => r.lecture.lisible);

  return {
    statut: 'decision',
    decision,
    deliberation: { enquete, these, formes, pieges, refutation },
    // Le greffe est rendu au citoyen : il a le droit de voir quels textes de loi ont été
    // réellement lus pour lui, et lesquelles des affirmations n'en avaient aucun. C'est la
    // partie la plus honnête de ce qu'il achète.
    greffe: {
      registre,
      articles_lus: [...new Set(sourcees.map(r => `art. ${r.preuve.article} ${r.preuve.loi}`))],
      affirmations_sourcees: sourcees.length,
      affirmations_sans_source: registre.length - sourcees.length,
      // Une citation qui ne colle pas au texte officiel : la signature d'une fabrication.
      // On ne l'enterre pas — on la remonte.
      citations_fabriquees: registre.filter(r => r.citation_exacte === false)
        .map(r => ({ role: r.role, invoquait: `art. ${r.preuve.article} ${r.preuve.loi}` })),
      derogations,
      // Les affirmations que LA LOI ELLE-MÊME a exclues du débat. C'est le mécanisme qui
      // sauve la rente : le juge ne les voit pas, donc il ne peut plus les choisir.
      ecartees_par_la_loi: registre.filter(r => r.ecartee_par).map(r => ({
        role: r.role,
        affirmait: String(r.texte).slice(0, 120),
        sur_la_base_de: `art. ${r.preuve.article} ${r.preuve.loi}`,
        ecarte_par: r.ecartee_par.par,
      })),
    },
    // On n'avale jamais une panne : si un rôle s'est tu, la personne doit le savoir.
    echecs,
    contradiction_a_eu_lieu: Boolean(refutation && !refutation._panne),
    cout: {
      appels_llm: usages.length,
      tokens_entree: tokensIn,
      tokens_cache: tokensCache,
      tokens_sortie: tokensOut,
      // Sonnet 3/15 $ par MTok, Opus 5/25 — ordre de grandeur, pas une facture.
      cout_estime_chf: Number(((tokensIn / 1e6) * 3 + (tokensCache / 1e6) * 0.3 + (tokensOut / 1e6) * 18).toFixed(3)),
      duree_ms: Date.now() - t0,
    },
  };
}

export const _internals = { SOCLE, AVOCAT_CITOYEN, GREFFIER, CHASSEUR_DE_PIEGES, REFUTATEUR, JUGE, MODELE_ROLE, MODELE_JUGE };
