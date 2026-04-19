/**
 * Escalation Pack — bouton universel "ce cas me dépasse → trouver un humain".
 *
 * Mission Cortex (livrable 30 jours) : quand un citoyen doit passer la main
 * à un humain (avocat, permanence, ONG), notre valeur = un pack structuré
 * prêt à être transmis, pas juste un "appelez un avocat".
 *
 * Entrée : caseRec = résultat de `getCase(case_id)` (case-store).
 * Sortie : objet pack sérialisable JSON (résumé + chronologie + pièces +
 *          points litigieux + questions + redirections filtrées par canton
 *          + disclaimer).
 *
 * Principes :
 *  - Aucun contenu juridique généré. On réutilise strictement les données
 *    déjà présentes dans le case (navigation LLM, enriched_primary, audit).
 *  - Pas de numéro de téléphone inventé. Placeholders clairs ("voir site
 *    officiel du canton") si on n'a pas la donnée réelle.
 *  - Sources génériques supplémentaires (CSP, Caritas, LAVI) ajoutées
 *    uniquement si elles ont du sens pour le domaine / la situation.
 */

import { buildDisclaimer } from './triage-engine.mjs';

// ============================================================
// Pièces à joindre par domaine — liste maintenue en dur,
// alignée sur ce qu'un avocat/permanence demande réellement.
// ============================================================

const PIECES_PAR_DOMAINE = Object.freeze({
  bail: [
    'Contrat de bail',
    'État des lieux d\'entrée et de sortie (si disponibles)',
    'Dernier avis de loyer / décompte de charges',
    'Courriers échangés avec la régie ou le bailleur',
    'Photos datées du défaut/problème (si applicable)',
    'Formulaire officiel de notification du vice (si déjà envoyé)'
  ],
  travail: [
    'Contrat de travail (CDD/CDI, CCT applicable)',
    'Fiches de salaire des 6 derniers mois',
    'Certificat médical (si arrêt maladie ou accident)',
    'Lettre de licenciement / avertissement(s) reçus',
    'Échanges écrits avec l\'employeur (emails, SMS, courriers)',
    'Décompte des heures supplémentaires et vacances non prises'
  ],
  famille: [
    'Livret de famille / acte de mariage / acte de naissance des enfants',
    'Convention / jugement de divorce ou de séparation existant',
    'Preuves de revenus des deux parties (fiches de salaire, déclaration d\'impôts)',
    'Justificatifs des charges mensuelles (loyer, assurances, frais enfants)',
    'Échanges écrits avec l\'ex-conjoint(e) concernant enfants, pension, partage'
  ],
  dettes: [
    'Commandement de payer reçu (avec date de notification)',
    'Extrait du registre des poursuites',
    'Budget mensuel détaillé (revenus / charges)',
    'Liste des créanciers et montants dus',
    'Courriers d\'huissier / d\'office des poursuites'
  ],
  etrangers: [
    'Titre de séjour / permis B, C, L ou F',
    'Passeport',
    'Décision contestée (révocation, refus, renvoi) avec date de notification',
    'Justificatifs d\'intégration (travail, cotisations, formations, langue)',
    'Preuves de la situation familiale (mariage, enfants, partenariat)'
  ],
  assurances: [
    'Police d\'assurance concernée (LAA, LAMal, LPP, AI)',
    'Décision contestée (refus de prestation, diminution) avec date',
    'Rapports médicaux et certificats',
    'Correspondance avec l\'assurance',
    'Justificatifs d\'incapacité de travail / de gain'
  ],
  social: [
    'Décision d\'aide sociale / RI / PC contestée',
    'Budget mensuel détaillé',
    'Dernière déclaration d\'impôts',
    'Justificatifs de recherches d\'emploi (si ORP)',
    'Bail et avis de loyer'
  ],
  violence: [
    'Plainte pénale déposée (copie avec numéro de procédure si connue)',
    'Certificats médicaux (lésions, suivi psy)',
    'Photos des lésions / des lieux',
    'SMS / emails / messages vocaux de l\'auteur',
    'Témoignages écrits (proches, voisins)',
    'Ordonnance de protection / de mesures superprovisionnelles (si déjà obtenue)'
  ],
  accident: [
    'Constat d\'accident (police, Europe Accident)',
    'Rapports médicaux et factures de soins',
    'Police d\'assurance RC / LAA',
    'Correspondance avec l\'assurance adverse',
    'Photos des dégâts, témoignages, plan des lieux'
  ],
  entreprise: [
    'Extrait du registre du commerce',
    'Statuts de la société',
    'Contrats commerciaux concernés',
    'Correspondance avec la partie adverse',
    'Comptes annuels / bilans récents'
  ]
});

const PIECES_DEFAUT = [
  'Toute décision écrite reçue (avec date de notification)',
  'Échanges écrits (courriers, emails, SMS) avec la partie adverse',
  'Documents contractuels liés à la situation',
  'Justificatifs de dates et de montants'
];

// ============================================================
// Redirections génériques (fallback si escalade fiche vide).
// Aucune invention de numéro — placeholders si canton inconnu.
// ============================================================

const REDIRECTIONS_GENERIQUES = Object.freeze([
  {
    nom: 'Ordre des avocats du canton',
    type: 'avocat',
    gratuit: false,
    contact: 'Voir sav-fsa.ch (Fédération Suisse des Avocats) pour l\'ordre cantonal',
    conditions: 'Premier entretien souvent à prix réduit, varie selon canton. Assistance judiciaire possible si revenus modestes.',
    cantons: ['tous'],
    domaines: ['tous']
  },
  {
    nom: 'CSP — Centre Social Protestant',
    type: 'ong',
    gratuit: true,
    contact: 'https://www.csp.ch',
    conditions: 'Gratuit, toutes confessions. Sur rendez-vous. Couvre bail, dettes, famille, étrangers.',
    cantons: ['VD', 'GE', 'NE', 'BE'],
    domaines: ['bail', 'dettes', 'famille', 'etrangers', 'social']
  },
  {
    nom: 'Caritas — Service de désendettement',
    type: 'ong',
    gratuit: true,
    contact: 'https://www.caritas.ch',
    conditions: 'Gratuit, sur rendez-vous. Priorité aux situations de surendettement avéré.',
    cantons: ['VD', 'GE', 'VS', 'NE', 'FR', 'BE', 'ZH', 'BS', 'LU', 'SG', 'TI'],
    domaines: ['dettes']
  },
  {
    nom: 'LAVI — Centre d\'aide aux victimes',
    type: 'lavi',
    gratuit: true,
    contact: 'https://www.aide-aux-victimes.ch',
    conditions: 'Gratuit et confidentiel. Pour toute victime d\'une infraction (violence, accident, abus).',
    cantons: ['tous'],
    domaines: ['violence', 'accident']
  },
  {
    nom: 'Permanence juridique cantonale',
    type: 'permanence',
    gratuit: false,
    contact: 'Voir site officiel du canton ("permanence juridique" + nom du canton)',
    conditions: 'Consultation courte (20-30 min) à tarif réduit. Premier aiguillage.',
    cantons: ['tous'],
    domaines: ['tous']
  }
]);

// ============================================================
// Construction du pack
// ============================================================

/**
 * @param {object} caseRec - résultat getCase(case_id)
 * @returns {object|null} pack (null si caseRec invalide)
 */
export function buildEscalationPack(caseRec) {
  if (!caseRec || !caseRec.state) return null;

  const state = caseRec.state || {};
  const audit = caseRec.audit || { rounds: [] };
  const nav = state.navigation || {};
  const primary = state.enriched_primary || null;
  const canton = state.canton || nav.infos_extraites?.canton || null;
  const domaine = primary?.fiche?.domaine || nav.infos_extraites?.domaine || null;

  return {
    summary: buildSummary(state, nav, primary, canton, domaine),
    chronologie: buildChronologie(state, audit),
    pieces_jointes_suggerees: buildPieces(domaine),
    // Finding 5 review : audit rounds vivent sur caseRec.audit, pas state.audit
    points_litigieux: buildPointsLitigieux(state, primary, audit),
    questions_a_poser_au_professionnel: buildQuestionsPro(state, primary, domaine),
    redirections_par_canton: buildRedirections(primary, canton, domaine),
    disclaimer: buildDisclaimer().full,
    generated_at: new Date().toISOString(),
    case_id: caseRec.case_id || null
  };
}

// --- summary ---

const DOMAIN_LABELS = Object.freeze({
  bail: 'droit du bail',
  travail: 'droit du travail',
  famille: 'droit de la famille',
  dettes: 'poursuites et faillites',
  etrangers: 'droit des étrangers',
  assurances: 'assurances sociales',
  social: 'aide sociale',
  violence: 'violence et protection',
  accident: 'responsabilité civile',
  entreprise: 'droit commercial'
});

function buildSummary(state, nav, primary, canton, domaine) {
  const parts = [];

  if (nav.resume_situation) {
    parts.push(nav.resume_situation.trim());
  } else if (state.texte_initial) {
    parts.push(`Situation initiale : ${state.texte_initial.trim().slice(0, 240)}`);
  } else {
    parts.push('Situation non renseignée.');
  }

  if (domaine) {
    parts.push(`Domaine juridique identifié : ${DOMAIN_LABELS[domaine] || domaine}.`);
  }

  if (canton) {
    parts.push(`Canton concerné : ${String(canton).toUpperCase()}.`);
  }

  const roundsDone = state.rounds_done || 0;
  if (roundsDone > 0) {
    parts.push(`${roundsDone} tour(s) de questions complétés dans l'analyse JusticePourtous.`);
  }

  if (primary?.fiche?.id) {
    parts.push(`Fiche de référence consultée : ${primary.fiche.id}.`);
  }

  return parts.join(' ');
}

// --- chronologie ---

function buildChronologie(state, audit) {
  const events = [];

  // Point de départ : texte initial
  if (state.texte_initial) {
    events.push({
      date: null,
      ordre: 0,
      event: `Saisie initiale : ${state.texte_initial.slice(0, 200)}`,
      source: 'triage_initial'
    });
  }

  // Rounds de questions/réponses
  const rounds = Array.isArray(audit?.rounds) ? audit.rounds : [];
  rounds.forEach((r, idx) => {
    const ts = r.at ? new Date(r.at).toISOString() : null;
    const questions = Array.isArray(r.questions) ? r.questions : [];
    const answers = r.answers || {};

    questions.forEach((q) => {
      const qid = q.id || q.kind || null;
      const answer = qid && Object.prototype.hasOwnProperty.call(answers, qid) ? answers[qid] : null;
      if (answer === null || answer === undefined || answer === '') return;
      events.push({
        date: ts,
        ordre: idx + 1,
        event: `Q&R (round ${r.n || idx + 1}) — ${q.question || q.text || qid} → ${String(answer).slice(0, 200)}`,
        source: `round_${r.n || idx + 1}`
      });
    });

    // Fallback si q/a non alignés par id (champ libre)
    if (!questions.length && Object.keys(answers).length) {
      Object.entries(answers).forEach(([k, v]) => {
        if (v === null || v === undefined || v === '') return;
        events.push({
          date: ts,
          ordre: idx + 1,
          event: `Précision (round ${r.n || idx + 1}) — ${k} : ${String(v).slice(0, 200)}`,
          source: `round_${r.n || idx + 1}`
        });
      });
    }
  });

  // Tri : par date ISO si disponible, sinon par ordre
  events.sort((a, b) => {
    if (a.date && b.date) return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    if (a.date && !b.date) return 1;
    if (!a.date && b.date) return -1;
    return (a.ordre || 0) - (b.ordre || 0);
  });

  // On retire le champ `ordre` interne avant export
  return events.map(({ date, event, source }) => ({ date, event, source }));
}

// --- pieces ---

function buildPieces(domaine) {
  if (!domaine) return [...PIECES_DEFAUT];
  return [...(PIECES_PAR_DOMAINE[domaine] || PIECES_DEFAUT)];
}

// --- points litigieux ---

function buildPointsLitigieux(state, primary, audit) {
  const points = [];

  // Uncertainties depuis last_eval (complexity router)
  const uncertainties = state.last_eval?.uncertainties || [];
  const uncertaintyLabels = {
    faits_critiques: 'Des faits critiques restent à établir précisément (dates, montants, acteurs).',
    confiance_faible: 'La qualification juridique dépend de jurisprudence variable — nécessite une analyse cas par cas.',
    montant_inconnu: 'Montant en jeu non déterminé — à chiffrer pour évaluer la stratégie.'
  };
  uncertainties.forEach((u) => {
    const label = uncertaintyLabels[u.kind] || u.kind;
    if (label) points.push(label);
  });

  // Lacunes de la fiche primaire
  const lacunes = primary?.lacunes || [];
  lacunes.forEach((l) => {
    const txt = typeof l === 'string' ? l : l?.message;
    if (txt) points.push(txt);
  });

  // Contradictions éventuelles relevées dans audit (si présentes)
  // Finding 5 review : audit vient de caseRec.audit (passé en 3ème param), pas state.audit
  const rounds = audit?.rounds || [];
  rounds.forEach((r) => {
    if (r.contradiction_detected) {
      points.push(`Contradiction relevée au round ${r.n} : ${r.contradiction_detected}`);
    }
  });

  // Dédupe
  return [...new Set(points)];
}

// --- questions au professionnel ---

function buildQuestionsPro(state, primary, domaine) {
  const questions = [];
  const uncertainties = state.last_eval?.uncertainties || [];

  // Top-3 uncertainties → questions reformulées
  const templates = {
    faits_critiques: 'Demandez au professionnel : quels faits devez-vous prouver en priorité pour asseoir votre position, et avec quelles pièces ?',
    confiance_faible: 'Demandez au professionnel : quelle est la jurisprudence récente sur votre situation exacte, et comment l\'orienter en votre faveur ?',
    montant_inconnu: 'Demandez au professionnel : comment chiffrer précisément le préjudice / la créance, et sous quelle forme l\'articuler ?'
  };
  uncertainties.slice(0, 3).forEach((u) => {
    if (templates[u.kind]) questions.push(templates[u.kind]);
  });

  // Questions génériques par domaine (si peu d'uncertainties)
  const genericsParDomaine = {
    bail: [
      'Demandez à l\'avocat : quel est le délai pour saisir l\'autorité de conciliation dans mon canton ?',
      'Demandez à l\'avocat : mes pièces suffisent-elles à prouver le défaut / le vice ?'
    ],
    travail: [
      'Demandez à l\'avocat : le licenciement est-il abusif au sens de l\'art. 336 CO ?',
      'Demandez à l\'avocat : ai-je droit à des heures supplémentaires, vacances non prises, 13e salaire prorata ?'
    ],
    famille: [
      'Demandez à l\'avocat : quelles mesures provisoires demander en urgence (autorité parentale, garde, pension) ?',
      'Demandez à l\'avocat : puis-je demander une avance de contributions d\'entretien par le canton ?'
    ],
    dettes: [
      'Demandez au conseiller : dois-je faire opposition dans les 10 jours, et sur quels motifs ?',
      'Demandez au conseiller : suis-je éligible à un désendettement concordataire ou à une faillite personnelle ?'
    ],
    etrangers: [
      'Demandez à l\'avocat : dans quel délai puis-je recourir contre la décision, et devant quelle autorité ?',
      'Demandez à l\'avocat : quels éléments d\'intégration appuyer en priorité ?'
    ],
    assurances: [
      'Demandez à l\'avocat : dois-je faire opposition formelle dans les 30 jours ?',
      'Demandez à l\'avocat : quelles expertises médicales indépendantes demander ?'
    ],
    social: [
      'Demandez au conseiller : dans quel délai recourir contre la décision, et auprès de qui ?',
      'Demandez au conseiller : quels revenus et charges doivent figurer dans mon budget ?'
    ],
    violence: [
      'Demandez au centre LAVI : puis-je obtenir des mesures d\'éloignement immédiates ?',
      'Demandez au centre LAVI : ai-je droit à une indemnisation LAVI ? Dans quels délais ?'
    ],
    accident: [
      'Demandez à l\'avocat : quelle est l\'étendue des prestations LAA/RC à réclamer ?',
      'Demandez à l\'avocat : quelle stratégie pour chiffrer la perte de gain et le tort moral ?'
    ],
    entreprise: [
      'Demandez à l\'avocat : quelle voie procédurale (commerciale, civile, arbitrage) est la plus adaptée ?',
      'Demandez à l\'avocat : quels risques financiers et de réputation dois-je anticiper ?'
    ]
  };

  if (domaine && genericsParDomaine[domaine]) {
    for (const q of genericsParDomaine[domaine]) {
      if (questions.length >= 5) break;
      questions.push(q);
    }
  }

  // Fallback si rien
  if (!questions.length) {
    questions.push(
      'Demandez au professionnel : quels sont les délais à respecter dans ma situation ?',
      'Demandez au professionnel : quelles sont mes chances réalistes et les risques financiers ?',
      'Demandez au professionnel : quelles pièces ou preuves me manquent pour avancer ?'
    );
  }

  // Cap 5 max
  return questions.slice(0, 5);
}

// --- redirections ---

function buildRedirections(primary, canton, domaine) {
  const redirs = [];
  const cantonUpper = canton ? String(canton).toUpperCase() : null;

  // 1) Escalade fournie par la fiche primaire — filtrée par canton
  const escaladeFromFiche = Array.isArray(primary?.escalade) ? primary.escalade : [];
  for (const e of escaladeFromFiche) {
    if (!e || !e.nom) continue;
    const cantons = Array.isArray(e.cantons) && e.cantons.length ? e.cantons : null;
    if (cantonUpper && cantons && !cantons.includes(cantonUpper)) continue;
    redirs.push({
      canton: cantonUpper || (cantons ? cantons.join(',') : 'tous'),
      nom: e.nom,
      type: normalizeType(e.type),
      gratuit: !!e.gratuit,
      contact: e.contact || null,
      conditions: e.conditions || null
    });
  }

  // 2) Génériques — ajoutés si pertinents (canton match + domaine match)
  for (const g of REDIRECTIONS_GENERIQUES) {
    const cantonOk = !cantonUpper || g.cantons.includes('tous') || g.cantons.includes(cantonUpper);
    const domaineOk = !domaine || g.domaines.includes('tous') || g.domaines.includes(domaine);
    if (!cantonOk || !domaineOk) continue;
    // Dédupe par nom
    if (redirs.some(r => r.nom.toLowerCase() === g.nom.toLowerCase())) continue;
    redirs.push({
      canton: cantonUpper || 'tous',
      nom: g.nom,
      type: g.type,
      gratuit: g.gratuit,
      contact: g.contact,
      conditions: g.conditions
    });
  }

  // Cap raisonnable
  return redirs.slice(0, 8);
}

function normalizeType(t) {
  if (!t) return 'autorite';
  const s = String(t).toLowerCase();
  if (['avocat', 'permanence', 'ong', 'autorite', 'lavi', 'ombudsman'].includes(s)) return s;
  if (s === 'association') return 'ong';
  if (s === 'autorité') return 'autorite';
  if (s.includes('ombud')) return 'ombudsman';
  if (s.includes('lavi')) return 'lavi';
  if (s.includes('avocat')) return 'avocat';
  return 'autorite';
}

// Exposés pour tests
export const _internals = {
  PIECES_PAR_DOMAINE,
  PIECES_DEFAUT,
  REDIRECTIONS_GENERIQUES,
  buildSummary,
  buildChronologie,
  buildPieces,
  buildPointsLitigieux,
  buildQuestionsPro,
  buildRedirections
};
