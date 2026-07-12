/**
 * ⚠ COUPE-CIRCUIT JURIDIQUE — safe-mode.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE FICHIER EXISTE (2026-07-11)
 *
 * Un audit a prouvé que le triage personnalisé et la génération de lettres
 * pouvaient produire du FAUX droit avec l'aplomb du vrai :
 *   - lettre d'« opposition AI » (art. 52 LPGA) alors que la voie en
 *     assurance-invalidité est le recours au tribunal cantonal des assurances
 *     (art. 69 LAI, 30 jours) → un citoyen qui l'envoie perd son délai ;
 *   - lettre affirmant « je fais opposition dans le délai légal de 10 jours »
 *     alors que le moteur avait lui-même détecté le délai comme dépassé ;
 *   - délai « 7 jours » sur la fiche moisissure (l'art. 257g CO dit « sans
 *     retard ») ;
 *   - badge « Vérification juridique critique » affiché sur 314 fiches dont
 *     ZÉRO n'a été relue par un juriste humain.
 *
 * Décision du propriétaire (Robin, 2026-07-11) : le site reste EN LIGNE mais on
 * NEUTRALISE tout ce qui affirme un délai, un acte ou génère une lettre, le
 * temps qu'un juriste humain valide le contenu. On ne supprime AUCUN code : tout
 * est derrière cet interrupteur, réversible en une variable d'environnement.
 *
 * FAIL-SAFE : LEGAL_SAFE_MODE vaut "1" (mode sûr ACTIF) par défaut. Si personne
 * ne définit la variable, on est en SÉCURITÉ, pas en danger. Seule la valeur
 * exacte "0" rallume les fonctions dangereuses.
 *
 * CONSOMMÉ PAR : src/server.mjs (interception des routes triage / premium /
 * lettres / paiement, et exposition de l'état via GET /api/config).
 *
 * NE COUPE PAS : la consultation (fiches, recherche, domaines, annuaire, i18n,
 * santé) ni la détection de détresse (safety_stop), qui doit TOUJOURS passer
 * avant le coupe-circuit — c'est la seule chose qui n'a jamais menti et qui
 * sauve des gens.
 */

const CONTACT_PAGE = '/annuaire.html';

/**
 * Ressources humaines réelles — un citoyen qui tombe sur le coupe-circuit doit
 * repartir avec un vrai numéro, pas avec une page d'erreur.
 * Même forme que les ressources de safety-classifier.mjs ({name, phone, tel,
 * url, note}) pour que le frontend puisse les rendre avec le même composant.
 */
const EMERGENCY = [
  { name: 'Police (danger immédiat)', phone: '117', tel: 'tel:117', note: '24h/24' },
  { name: 'Urgences médicales', phone: '144', tel: 'tel:144', note: '24h/24' },
  { name: 'La Main Tendue (écoute, détresse)', phone: '143', tel: 'tel:143', url: 'https://www.143.ch', note: '24h/24, anonyme, gratuit' },
  { name: 'Aide aux victimes (LAVI)', phone: '0848 28 28 28', tel: 'tel:+41848282828', url: 'https://www.aide-aux-victimes.ch', note: 'confidentiel, frais juridiques pris en charge' }
];

const RESOURCES = [
  { name: 'ASLOCA (locataires)', phone: '021 617 10 07', tel: 'tel:+41216171007', url: 'https://www.asloca.ch', note: 'bail, loyer, résiliation, caution — permanence par canton' },
  { name: 'Caritas Suisse', url: 'https://www.caritas.ch', note: 'consultation sociale et juridique, dettes, précarité' },
  { name: 'Centre social protestant (CSP)', url: 'https://www.csp.ch', note: 'consultation juridique gratuite ou à prix libre' },
  { name: 'Unia (travail)', url: 'https://www.unia.ch', note: 'licenciement, salaire impayé, contrat de travail' },
  { name: 'Permanences juridiques gratuites', url: CONTACT_PAGE, note: 'annuaire des autorités et permanences par canton — toujours en ligne sur ce site' }
];

const MESSAGES = {
  fr: {
    title: 'Analyse juridique personnalisée suspendue',
    message: "Nous avons suspendu l'analyse juridique personnalisée (triage, délais, lettres) le temps qu'un juriste humain valide notre contenu. Un audit interne a montré que certaines réponses pouvaient citer une mauvaise procédure ou un mauvais délai — dans le droit, une erreur de délai peut faire perdre un droit définitivement.",
    why: "Nous préférons ne rien dire plutôt que de dire faux.",
    what_still_works: [
      'Les guides et fiches d\'information restent consultables (contenu en cours de revalidation, non validé par un juriste).',
      'L\'annuaire des autorités et des permanences juridiques reste ouvert.',
      'La détection des situations d\'urgence (violence, détresse) reste active.'
    ],
    what_to_do: "Contactez une permanence juridique : c'est gratuit ou à prix libre, et un humain répond de ce qu'il dit.",
    emergency_intro: "Si vous êtes en danger immédiat, n'attendez pas :"
  },
  de: {
    title: 'Personalisierte juristische Analyse ausgesetzt',
    message: 'Wir haben die personalisierte juristische Analyse (Triage, Fristen, Briefe) ausgesetzt, bis eine juristische Fachperson unsere Inhalte geprüft hat. Eine interne Prüfung hat gezeigt, dass einzelne Antworten ein falsches Verfahren oder eine falsche Frist nennen konnten — im Recht kann eine falsche Frist ein Recht endgültig zunichtemachen.',
    why: 'Lieber nichts sagen als etwas Falsches sagen.',
    what_still_works: [
      'Die Informationsseiten bleiben abrufbar (Inhalt in Überprüfung, nicht von einer juristischen Fachperson validiert).',
      'Das Verzeichnis der Behörden und Rechtsberatungsstellen bleibt offen.',
      'Die Erkennung von Notsituationen (Gewalt, Suizidalität) bleibt aktiv.'
    ],
    what_to_do: 'Wenden Sie sich an eine Rechtsberatungsstelle: kostenlos oder gegen geringes Entgelt, und ein Mensch steht für seine Aussage ein.',
    emergency_intro: 'Bei unmittelbarer Gefahr warten Sie nicht:'
  },
  it: {
    title: 'Analisi giuridica personalizzata sospesa',
    message: "Abbiamo sospeso l'analisi giuridica personalizzata (triage, termini, lettere) finché un giurista non avrà convalidato i nostri contenuti. Un audit interno ha mostrato che alcune risposte potevano indicare una procedura o un termine sbagliati — in diritto, un termine sbagliato può far perdere un diritto in modo definitivo.",
    why: 'Preferiamo non dire nulla piuttosto che dire il falso.',
    what_still_works: [
      'Le schede informative restano consultabili (contenuto in fase di riconvalida, non validato da un giurista).',
      "L'elenco delle autorità e dei servizi di consulenza giuridica resta aperto.",
      'Il rilevamento delle situazioni di emergenza (violenza, disagio grave) resta attivo.'
    ],
    what_to_do: 'Contatti un servizio di consulenza giuridica: è gratuito o a prezzo modico, e risponde un essere umano.',
    emergency_intro: 'Se è in pericolo immediato, non aspetti:'
  },
  en: {
    title: 'Personalised legal analysis suspended',
    message: 'We have suspended personalised legal analysis (triage, deadlines, letters) until a human lawyer has validated our content. An internal audit showed that some answers could cite the wrong procedure or the wrong deadline — in law, a wrong deadline can permanently destroy a right.',
    why: 'We would rather say nothing than say something false.',
    what_still_works: [
      'Information sheets and guides remain available (content under revalidation, not validated by a lawyer).',
      'The directory of authorities and free legal help desks remains open.',
      'Emergency detection (violence, distress) remains active.'
    ],
    what_to_do: 'Contact a legal help desk: it is free or low-cost, and a human being stands behind what they tell you.',
    emergency_intro: 'If you are in immediate danger, do not wait:'
  }
};

/**
 * Mode sûr actif ?
 * Défaut = ACTIF. Seule la valeur exacte "0" le désactive (fail-safe).
 * @returns {boolean}
 */
export function isSafeMode() {
  const raw = process.env.LEGAL_SAFE_MODE;
  if (raw === undefined || raw === null) return true;
  return String(raw).trim() !== '0';
}

/**
 * Payload renvoyé (HTTP 200) quand une route dangereuse est coupée.
 * Ce n'est pas une erreur technique : c'est un choix éditorial assumé.
 * @param {string} [lang] — 'fr' | 'de' | 'it' | 'en' (fallback fr)
 */
export function safeModeNotice(lang) {
  const code = String(lang || 'fr').slice(0, 2).toLowerCase();
  const t = MESSAGES[code] || MESSAGES.fr;
  return {
    legal_safe_mode: true,
    lang: MESSAGES[code] ? code : 'fr',
    title: t.title,
    message: t.message,
    why: t.why,
    what_still_works: t.what_still_works,
    what_to_do: t.what_to_do,
    resources: RESOURCES,
    emergency_intro: t.emergency_intro,
    emergency: EMERGENCY,
    contact_page: CONTACT_PAGE,
    since: '2026-07-11',
    content_status: 'en_revalidation_non_valide_par_un_juriste'
  };
}

// ─── Filtre de sortie : aucune LETTRE ne sort du serveur en mode sûr ──────────
//
// La première version du coupe-circuit énumérait les routes dangereuses. La revue
// adversariale en a trouvé cinq qu'elle avait manquées (/api/action-plan, les 50
// lettres de /api/templates, les rappels par mail, le compilateur brut…), et les
// routes de consultation servaient encore le corps de lettre nu — le frontend le
// masquait, l'API le livrait.
//
// LEÇON : énumérer les chemins dangereux, c'est en oublier. On filtre donc à la
// SORTIE, dans le passage obligé de toute réponse JSON (lib/http-helpers.js). Une
// route oubliée, ou une route écrite demain, ne peut plus livrer de lettre.
//
// Une lettre est un ACTE : le citoyen la poste à une autorité. Tant qu'aucun juriste
// n'a validé le contenu, on n'en fournit aucune. L'INFORMATION, elle, reste servie.

const LETTER_BEARING_KEYS = new Set([
  'modeleLettre', 'modele_lettre', 'modelesLettres', 'modeles_lettres',
  'lettresDisponibles', 'lettres_disponibles', 'letters', 'lettres',
  'templates', 'modeles'
]);

const WITHHELD_NOTICE = "Modèle de lettre retiré : une lettre est un acte, et une erreur de procédure peut faire perdre un droit. Le contenu est en cours de validation par un juriste.";

/**
 * Retire récursivement tout corps de lettre d'un payload sortant.
 * Ne touche à rien d'autre : l'information reste intacte.
 * @param {*} value
 * @returns {*} une copie filtrée (l'entrée n'est jamais mutée)
 */
export function stripLetters(value) {
  if (Array.isArray(value)) return value.map(stripLetters);
  if (value && typeof value === 'object') {
    const out = {};
    let removed = false;
    for (const [k, v] of Object.entries(value)) {
      if (LETTER_BEARING_KEYS.has(k)) { removed = true; continue; }
      out[k] = stripLetters(v);
    }
    if (removed) out.letters_withheld = WITHHELD_NOTICE;
    return out;
  }
  return value;
}

/**
 * Filtre appliqué à TOUTE réponse JSON quand le mode sûr est actif.
 * No-op quand LEGAL_SAFE_MODE=0.
 */
export function filterOutgoingPayload(data) {
  if (!isSafeMode()) return data;
  return stripLetters(data);
}

export const _internals = { MESSAGES, RESOURCES, EMERGENCY, LETTER_BEARING_KEYS };
