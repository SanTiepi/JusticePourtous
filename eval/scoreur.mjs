/**
 * ⚠ LE SCOREUR — et pourquoi celui d'avant devait mourir
 *
 * ═══ CE QUE FAISAIT L'ANCIEN, ET POURQUOI C'ÉTAIT INDÉFENDABLE ══════════════
 *
 * Il cherchait des mots-clés dans la réponse avec des expressions régulières. En une seule
 * journée, il a menti TROIS FOIS — et à chaque fois dans le sens qui arrangeait :
 *
 *   1. Il a PUNI LE COMITÉ À TORT. Son regex sanctionnait la présence du texte « 336b »
 *      dans la réponse. Or le juge menait correctement avec la NULLITÉ du congé (art. 336c),
 *      et ajoutait une opposition art. 336b « au cas où » — dans la même lettre. C'est de la
 *      bonne pratique : une ceinture et des bretelles. Le regex a compté ça comme une faute.
 *
 *   2. Il a ABSOUS LE MODÈLE GRATUIT À TORT. Le regex cherchait « envoyez » là où le texte
 *      disait « envoyer ». Et il comptait « tribunal cantonal » comme « piège trouvé » —
 *      alors que ces mots apparaissaient dans une phrase qui décrivait la MAUVAISE procédure
 *      (« si l'opposition est rejetée, vous pourrez recourir au tribunal cantonal »).
 *      Le modèle gratuit conseillait l'acte qui fait perdre la rente. Score : 5/5.
 *
 *   3. Il a crié « HAMEÇON MORDU » sur la phrase « lettre de RECOURS (pas une opposition) ».
 *      C'est-à-dire sur la SEULE bonne réponse que le comité ait jamais produite. Un regex
 *      ne voit pas une négation.
 *
 * Ce projet a déjà eu trois instruments de mesure incapables d'annoncer une mauvaise
 * nouvelle : un benchmark dont le score du concurrent était écrit en dur (« ×6.4 »), un badge
 * « vérifié » apposé par le LLM qui avait écrit la fiche, et 282 « invariants de régression »
 * GÉNÉRÉS depuis les fiches qu'ils étaient censés contrôler (ils passaient au rouge quand on
 * corrigeait une erreur de droit). Le quatrième ne sera pas un tas de regex.
 *
 * ═══ CE QUE FAIT CELUI-CI ═══════════════════════════════════════════════════
 *
 * Un principe, un seul : LE MODÈLE RANGE, LE CODE TRANCHE.
 *
 *   · Un agent lit la réponse et la CLASSE dans une liste fermée définie d'avance par
 *     l'oracle (« quel acte cette réponse recommande-t-elle : opposition_office_AI,
 *     recours_tribunal_cantonal, les_deux, aucun ? »). C'est une tâche de transcription :
 *     il ne juge rien, il n'a aucune opinion à défendre, il range.
 *   · Le VERDICT est calculé par du code, en comparant à l'oracle. Aucun modèle n'a le droit
 *     de dire « c'est une bonne réponse ».
 *
 * Et surtout : un jury LLM ne note JAMAIS la justesse juridique. On l'a essayé — le jury a
 * voté 4 contre 1 pour la réponse qui fait perdre la rente, et il a validé l'opposition à
 * l'office AI. Il ne mesurait pas la justesse : il mesurait « quelle réponse RESSEMBLE le
 * plus à du bon travail ». Il reste utile pour la lisibilité. Jamais pour le droit.
 *
 * CONSOMMÉ PAR : scripts/duel.mjs
 */

const API_URL = 'https://api.anthropic.com/v1/messages';

// Le classement est une transcription, pas un jugement : un modèle rapide suffit, et son
// coût ne doit pas peser sur la mesure de ce qu'on mesure.
const MODELE_CLASSEUR = 'claude-sonnet-4-6';

/**
 * L'agent ne juge pas : il RANGE la réponse dans les cases que l'oracle a définies.
 * On lui donne la liste fermée des actes possibles ; il dit lequel est recommandé.
 */
export async function classer(reponse, cas, apiKey) {
  const actes = [
    ...cas.actes_possibles,
    { id: 'aucun_acte', libelle: 'la réponse ne recommande aucun acte concret (elle pose des questions, ou reste théorique)' },
    { id: 'autre', libelle: 'un acte qui n\'est dans aucune des cases ci-dessus' },
  ];

  const system = `Tu es un TRANSCRIPTEUR, pas un juge. Tu n'as aucune opinion à donner sur la qualité juridique de la réponse qu'on te montre : quelqu'un d'autre s'en chargera. Ton seul travail est de RANGER cette réponse dans les bonnes cases.

Sois littéral et sans indulgence. Si la réponse dit « envoyez une opposition à l'office », tu ranges « opposition à l'office » — même si tu penses que c'est une erreur. Si elle dit « surtout PAS d'opposition », tu ne ranges PAS « opposition ». Lis ce qui est écrit, pas ce que tu voudrais y lire. Une NÉGATION change tout : c'est exactement là que le scoreur précédent — un tas d'expressions régulières — se trompait, et il a fini par accuser d'erreur la seule bonne réponse jamais produite.

Une réponse peut recommander PLUSIEURS actes. Range l'acte PRINCIPAL — celui qu'elle présente comme la démarche à faire pour préserver le droit. Un acte mentionné « au cas où », « en complément », « par précaution » est SECONDAIRE.

⚠ ET POSER DES QUESTIONS EST UN ACTE. Si la réponse dit « je ne peux pas vous conseiller sans savoir X » et pose des questions, c'est un choix délibéré, pas une absence de réponse : range-le comme tel si une case le prévoit. Attention toutefois : une réponse qui pose des questions MAIS annonce quand même un délai ou une procédure n'a pas « posé des questions » — elle a affirmé. Range ce qu'elle AFFIRME.

Réponds UNIQUEMENT en JSON valide.`;

  const user = `LA SITUATION DE LA PERSONNE :
"""${cas.texte}"""

LA RÉPONSE À CLASSER :
"""${reponse}"""

LES CASES (liste fermée) :
${actes.map(a => `  · ${a.id} — ${a.libelle}`).join('\n')}

Réponds en JSON :
{
  "acte_principal": "l'un des identifiants ci-dessus, exactement",
  "actes_secondaires": ["les autres actes recommandés, en second plan"],
  "citation_qui_le_prouve": "la phrase EXACTE de la réponse qui montre l'acte principal — recopiée",
  "autorite_destinataire": "à qui la réponse dit d'envoyer / de s'adresser (ou null)",
  "delai_annonce": "le délai que la réponse annonce, tel qu'elle l'écrit (ou null)",
  "dit_que_c_est_trop_tard": true | false,
  "citation_du_trop_tard": "la phrase exacte, si oui — sinon null",
  "pose_des_questions": true | false,
  "coordonnees_donnees": ["toute adresse postale, tout numéro de téléphone donné dans la réponse — recopiés"]
}`;

  const resp = await fetch(API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODELE_CLASSEUR, max_tokens: 2000, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!resp.ok) throw new Error(`classeur : API ${resp.status}`);

  const data = await resp.json();
  const brut = (data.content || []).map(b => b.text || '').join('').replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  return JSON.parse(brut);
}

/**
 * LE VERDICT — calculé par du code. Aucun modèle n'a le droit de dire « bonne réponse ».
 *
 * Deux questions, et une seule compte vraiment : cette personne repart-elle avec son droit ?
 */
export function juger(classement, cas) {
  const acte = classement.acte_principal;
  const secondaires = classement.actes_secondaires || [];

  // Plusieurs chemins peuvent sauver le même droit. Déposer le recours au tribunal ET écrire
  // aussi à l'office AI, c'est l'acte conservatoire raisonnable : le second ne coûte rien, et
  // le premier sauve la rente. Un oracle qui n'admettrait qu'une seule formulation punirait la
  // prudence — or c'est exactement la prudence qu'on veut.
  const acceptables = new Set([cas.acte_correct, ...(cas.actes_acceptables || [])]);
  const conseille_le_bon_acte = acceptables.has(acte);

  // ⚠ L'acte FATAL recommandé en principal = le droit est perdu.
  // Le recommander en secondaire est moins grave, mais on le note : « faites aussi une
  // opposition, ça ne coûte rien » est acceptable ; « faites une opposition » ne l'est pas.
  const actes_fatals = new Set(cas.actes_fatals || []);
  const acte_fatal_conseille = actes_fatals.has(acte);
  const acte_fatal_en_second = secondaires.filter(a => actes_fatals.has(a));

  // ⚠ LA FAUTE QU'ON NE PARDONNE JAMAIS. En droit suisse, agir est presque toujours gratuit,
  // informel et sans risque ; c'est le SILENCE qui est irréversible. Décourager quelqu'un,
  // c'est produire exactement l'inégalité que ce projet combat : celui qui a un ami juriste,
  // lui, y va quand même.
  const decourage = classement.dit_que_c_est_trop_tard === true;

  const droit_sauve = conseille_le_bon_acte && !acte_fatal_conseille && !decourage;

  return {
    droit_sauve,
    conseille_le_bon_acte,
    acte_conseille: acte,
    acte_attendu: cas.acte_correct,
    acte_fatal_conseille,
    acte_fatal_en_second,
    decourage,
    preuve: classement.citation_qui_le_prouve,
    autorite: classement.autorite_destinataire,
    delai: classement.delai_annonce,
    // Les coordonnées inventées ne changent pas le verdict, mais elles sont RAPPORTÉES :
    // envoyer quelqu'un à une adresse qui n'existe pas, c'est l'envoyer dans le vide au pire
    // moment de sa vie. On a nous-mêmes inventé un numéro d'ASLOCA et une URL de Caritas dans
    // la même journée. Ce n'est pas un détail : c'est le mode d'échec le plus banal.
    coordonnees_a_verifier: classement.coordonnees_donnees || [],
  };
}
