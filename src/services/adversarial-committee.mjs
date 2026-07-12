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
     "preuve": { "loi": "LAI", "article": "69" }
   Lois que nous savons aller lire : CO, CC, CPC, LP, LPGA, LAI, LAA, LAMal, LACI, LEI, CP,
   LCR, LEg, LTF.

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
      "preuve": { "loi": "CO", "article": "271a" },
      "conditions": ["ce qui doit être vrai pour que ça marche"],
      "faits_a_l_appui": ["ce qu'elle a déjà dit et qui l'établit"],
      "force": "solide" | "plaidable" | "audacieux"
    }
  ],
  "actions": [
    { "acte": "l'action concrète", "aupres_de": "quelle autorité", "delai": "...", "cout": "gratuit ou montant",
      "preuve": { "loi": "...", "article": "..." } }
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
      "preuve": { "loi": "LAI", "article": "69" },
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
      "preuve": { "loi": "LPGA", "article": "52" },
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

export const COMITE = [AVOCAT_CITOYEN, GREFFIER, CHASSEUR_DE_PIEGES, REFUTATEUR, JUGE];

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
const LOIS_CONNUES = /^(LPGA|LAVS|LAI|LAA|LAMal|LACI|LPP|LEI|LEg|CO|CC|CPC|CPP|LP|CP|LCR|LTF)[,.;:]?$/i;

export function lireDerogation(texte) {
  const cibles = [];
  let mode = null;          // 'art' → les nombres qui suivent sont des articles ; 'al' → ce sont des alinéas
  let enAttente = [];       // les numéros d'articles lus, pas encore rattachés à une loi

  for (const brut of String(texte).split(/[\s]+/)) {
    // La loi élide : « à l'art. 32 LPGA ». Sans dépouiller le « l’ », le token « l’art. » n'est
    // pas reconnu, la dérogation passe inaperçue, et l'article écarté revient dans le dossier.
    const t = brut.replace(/^[«»(]+/, '').replace(/^[ldn][''’]/i, '');

    if (/^art(icle)?s?\.?$/i.test(t)) { mode = 'art'; enAttente = []; continue; }
    if (/^al(inéa)?s?\.?$/i.test(t)) { mode = 'al'; continue; }   // un alinéa n'est PAS un article

    const loi = t.match(LOIS_CONNUES)?.[1];
    if (loi) {
      // Le nom de la loi solde les articles lus juste avant : c'est là qu'ils appartiennent.
      for (const a of enAttente) cibles.push({ loi: loi.toUpperCase(), article: a.toLowerCase() });
      enAttente = [];
      mode = null;
      continue;
    }

    if (mode === 'art') {
      const num = t.match(/^(\d+[a-z]?(?:bis|ter|quater)?)[,;.]?$/i)?.[1];
      if (num) enAttente.push(num);
      else if (!/^(et|,|ou|à|aux?|l['’]|de|des|du)$/i.test(t)) mode = null; // on est sorti de la liste
    }
  }
  return cibles;
}

export function trouverDerogations(registre) {
  const derogations = [];
  const vues = new Set();

  for (const r of registre) {
    if (!r.lecture?.derogation || !r.preuve) continue;

    const par = `art. ${r.preuve.article} ${r.preuve.loi}`;
    if (vues.has(par)) continue;      // le même article invoqué dix fois ne déroge qu'une
    vues.add(par);

    const ecarte = lireDerogation(r.lecture.derogation);
    if (!ecarte.length) continue;

    derogations.push({ par, texte: r.lecture.derogation, ecarte });
  }
  return derogations;
}

/** Une affirmation s'appuie-t-elle sur un article que la loi elle-même a écarté ? */
function estEcarteeParDerogation(affirmation, derogations) {
  if (!affirmation.preuve?.loi || !affirmation.preuve?.article) return null;
  const loi = String(affirmation.preuve.loi).toUpperCase();
  const art = String(affirmation.preuve.article).replace(/^art\.?\s*/i, '').match(/^(\d+[a-z]?)/i)?.[1]?.toLowerCase();
  if (!art) return null;

  for (const d of derogations) {
    // Une dérogation ne s'écarte pas elle-même (art. 69 LAI ne s'auto-annule pas).
    if (d.par === `art. ${affirmation.preuve.article} ${affirmation.preuve.loi}`) continue;
    if (d.ecarte.some(e => e.loi === loi && e.article === art)) return d;
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
    l.push('══ ⚠ LA LOI ÉCARTE ELLE-MÊME CERTAINS ARTICLES — CE N\'EST PAS NÉGOCIABLE ══\n');
    for (const d of derogations) {
      l.push(`  ${d.par} dit, dans son propre texte : « ${d.texte} »`);
      l.push(`  → Dans ce dossier, ${d.ecarte.map(e => `l'art. ${e.article} ${e.loi}`).join(' et ')} NE S'APPLIQUE PAS.`);
      l.push(`     La règle spéciale écarte la règle générale. Le législateur l'a écrit noir sur blanc.\n`);
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
    decision,
    deliberation: { these, formes, pieges, refutation },
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
