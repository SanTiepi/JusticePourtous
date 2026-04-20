/**
 * Scope Refuser — détecte les demandes hors scope et génère un refus propre
 * avec redirection (freeze C #26, #27).
 *
 * Liste blanche = 10 domaines officiels (src/data/domaines.json).
 * Hors liste → refus clair, pas de pseudo-triage.
 *
 * Tier humain séparé : TF, pénal grave, constitutionnel → redirection humaine
 * (avocat, permanence, ombudsman), pas de triage automatisé.
 */

const ALLOWED_DOMAINS = new Set([
  'bail', 'travail', 'famille', 'dettes', 'etrangers',
  'assurances', 'social', 'violence', 'accident', 'entreprise'
]);

const HUMAN_TIER_PATTERNS = [
  { key: 'recours_tf', patterns: [/\brecours (au )?tribunal f[eé]d[eé]ral/i, /\btf\b/i, /\brecours en mati[eè]re/i] },
  { key: 'penal_grave', patterns: [/\bmeurtre\b/i, /\bassassinat\b/i, /\bviol(?!e|ation|er)/i, /\bs[eé]questration\b/i, /\bhomicide\b/i, /\bgrave pénal/i] },
  { key: 'constitutionnel', patterns: [/\bconstitutionnalit[eé]/i, /\brecours constitutionnel/i, /\bdroit[s]? fondamenta(l|ux)/i] }
];

const OUT_OF_SCOPE_DOMAINS = [
  { key: 'succession', label: 'successions et héritage', patterns: [/\bsuccession\b/i, /\bh[eé]rit(e|é|er|age|ier)/i, /\btestament\b/i, /\blegs\b/i] },
  { key: 'propriete_intellectuelle', label: 'propriété intellectuelle', patterns: [/\bbrevet\b/i, /\bmarque (d[eé]pos|enregistr)/i, /\bcontrefa[çc]on/i] },
  { key: 'fiscal', label: 'fiscalité personnelle', patterns: [/\bimp[ôo]ts? (directs?|cantonal|f[eé]d[eé]ral)/i, /\bd[eé]claration d'imp[ôo]ts/i, /\btaxation\b/i] }
];

/**
 * @param {string} text
 * @param {string} [primaryDomain]
 * @returns {{ is_out_of_scope: boolean, is_human_tier: boolean, reason?: string, label?: string, response?: object }}
 */
export function analyzeScope(text, primaryDomain = null) {
  const lower = (text || '').toLowerCase();

  // 1. Tier humain : TF, pénal grave, constitutionnel
  for (const ht of HUMAN_TIER_PATTERNS) {
    if (ht.patterns.some(p => p.test(text))) {
      return {
        is_out_of_scope: false,
        is_human_tier: true,
        reason: ht.key,
        response: buildHumanTierResponse(ht.key)
      };
    }
  }

  // 2. Out-of-scope explicite (par patterns)
  for (const oos of OUT_OF_SCOPE_DOMAINS) {
    if (oos.patterns.some(p => p.test(text))) {
      return {
        is_out_of_scope: true,
        is_human_tier: false,
        reason: oos.key,
        label: oos.label,
        response: buildOutOfScopeResponse(oos.key, oos.label)
      };
    }
  }

  // 3. Si on a un primaryDomain et il n'est pas dans la liste blanche
  if (primaryDomain && !ALLOWED_DOMAINS.has(primaryDomain)) {
    return {
      is_out_of_scope: true,
      is_human_tier: false,
      reason: `domain_not_allowed:${primaryDomain}`,
      response: buildOutOfScopeResponse(primaryDomain, primaryDomain)
    };
  }

  return { is_out_of_scope: false, is_human_tier: false };
}

/**
 * Catalogue citoyen des 15 domaines couverts (10 core + 5 beta).
 * Exposé au frontend pour que le out_of_scope rappelle ce qu'on sait faire.
 */
export const COVERED_DOMAINS_CITIZEN = Object.freeze([
  { key: 'bail', label: 'Bail / logement', icon: 'home' },
  { key: 'travail', label: 'Travail / licenciement / salaire', icon: 'briefcase' },
  { key: 'famille', label: 'Famille / divorce / garde', icon: 'users' },
  { key: 'dettes', label: 'Dettes / poursuites', icon: 'alert' },
  { key: 'etrangers', label: 'Permis de séjour / étrangers', icon: 'globe' },
  { key: 'assurances', label: 'Assurances (LAMal, LCA, LAA)', icon: 'shield' },
  { key: 'social', label: 'Aide sociale / AVS / AI', icon: 'heart' },
  { key: 'violence', label: 'Violence / LAVI', icon: 'shield-alert' },
  { key: 'accident', label: 'Accidents / responsabilité civile', icon: 'car' },
  { key: 'entreprise', label: 'Entreprise / société', icon: 'building' },
  { key: 'consommation', label: 'Consommation (beta)', icon: 'shopping' },
  { key: 'voisinage', label: 'Voisinage (beta)', icon: 'home-group' },
  { key: 'circulation', label: 'Circulation routière (beta)', icon: 'traffic' },
  { key: 'successions', label: 'Successions (beta, limité)', icon: 'scroll' },
  { key: 'sante', label: 'Santé / droits patients (beta)', icon: 'medical' }
]);

/**
 * Construit la réponse human_tier (2026-04-19 citizen UX).
 * Ajoute des raisons explicites + liens concrets (Ordre des avocats cantonal,
 * permanences juridiques, escalation pack).
 */
function buildHumanTierResponse(reason) {
  const reasonExplanations = {
    recours_tf: 'Un recours au Tribunal fédéral nécessite une argumentation juridique complexe et le respect de délais stricts (30 jours). Seul un avocat peut vous représenter utilement.',
    penal_grave: 'Les affaires pénales graves (meurtre, viol, séquestration) nécessitent immédiatement un avocat de la défense. La permanence pénale de votre canton peut en désigner un.',
    constitutionnel: 'Les recours constitutionnels et questions de droits fondamentaux dépassent le cadre du triage automatisé et nécessitent un avocat spécialisé en droit public.'
  };

  return {
    type: 'human_tier_redirect',
    reason,
    preamble: 'Votre situation nécessite l\'expertise d\'un avocat. Voici pourquoi :',
    why: reasonExplanations[reason] || 'Ce type de situation dépasse le cadre du triage automatisé.',
    message: 'Ce type de situation dépasse le cadre du triage automatisé. Voici des ressources humaines à contacter :',
    detected_reasons: [reason],
    resources: [
      {
        name: 'Ordre des avocats cantonal',
        note: 'annuaire officiel — premier rendez-vous souvent gratuit ou à tarif réduit',
        lookup_hint: 'Ordre cantonal des avocats',
        url: 'https://www.sav-fsa.ch/fr/reperer-un-avocat.html'
      },
      {
        name: 'Permanence juridique cantonale (SPJ / SAJE)',
        note: 'consultation gratuite sur rendez-vous dans la plupart des cantons',
        lookup_hint: 'Service des prestations juridiques de votre canton'
      },
      {
        name: 'Centre Social Protestant / Caritas',
        note: 'consultation juridique gratuite sous conditions de revenu',
        url: 'https://www.csp.ch'
      }
    ],
    escalation_available: {
      label: 'Soumettre une demande à un avocat via JusticePourtous',
      action: 'escalation_pack',
      note: 'nous transmettons votre dossier anonymisé à un avocat partenaire'
    },
    disclaimer: 'JusticePourtous ne remplace pas un avocat pour les situations complexes. Nous vous orientons vers la bonne ressource.',
    priority: 'high'
  };
}

/**
 * Redirections citoyennes par domaine hors scope (2026-04-19).
 * Objectif : ne PAS laisser l'utilisateur sans piste. Rediriger vers
 * comparis.ch (assurances/comparatif), bonprix (consommation), IPI,
 * notaires, autorités fiscales, etc.
 */
function buildOutOfScopeResponse(key, label) {
  const redirections = {
    succession: {
      message: `Les questions de ${label} ne sont pas entièrement couvertes par notre triage (beta). Pour un conseil fiable, contactez un notaire ou l'office des successions de votre canton.`,
      redirect_to: ['notaire', 'office des successions cantonal'],
      external_services: [
        { name: 'Chambre des notaires de votre canton', note: 'premier RDV généralement gratuit' },
        { name: 'Office des successions cantonal', note: 'procédure officielle' }
      ]
    },
    propriete_intellectuelle: {
      message: `La ${label} n'est pas couverte par JusticePourtous. Consultez l'IPI (Institut fédéral de la propriété intellectuelle) ou un avocat spécialisé.`,
      redirect_to: ['IPI — ige.ch', 'avocat en PI'],
      external_services: [
        { name: 'IPI — Institut fédéral de la propriété intellectuelle', url: 'https://www.ige.ch', note: 'dépôts, recherches, litiges PI' },
        { name: 'Avocat spécialisé PI', lookup_hint: 'Ordre des avocats — filtre propriété intellectuelle' }
      ]
    },
    fiscal: {
      message: `La ${label} n'est pas couverte. Contactez votre administration fiscale cantonale ou un fiduciaire pour un conseil chiffré.`,
      redirect_to: ['administration fiscale cantonale', 'fiduciaire'],
      external_services: [
        { name: 'Administration fiscale cantonale', note: 'renseignement gratuit sur demande' },
        { name: 'Comparis — comparateur fiduciaires', url: 'https://www.comparis.ch', note: 'comparer les prix des fiduciaires' }
      ]
    }
  };

  const entry = redirections[key] || {};
  return {
    type: 'out_of_scope',
    label,
    preamble: 'JusticePourtous couvre 15 domaines juridiques suisses. Votre situation ne rentre pas dans notre périmètre, mais voici où trouver de l\'aide.',
    message: entry.message || `Ce domaine (${label}) n'est pas dans notre périmètre. Consultez une ressource juridique cantonale.`,
    covered_domains: COVERED_DOMAINS_CITIZEN,
    redirect_to: entry.redirect_to || ['ordre des avocats cantonal'],
    external_services: entry.external_services || [
      { name: 'Ordre des avocats cantonal', url: 'https://www.sav-fsa.ch/fr/reperer-un-avocat.html', note: 'annuaire officiel' }
    ],
    escalation_available: {
      label: 'Soumettre quand même votre situation à un avocat',
      action: 'escalation_pack',
      note: 'nous pouvons transmettre votre demande à un avocat partenaire si vous le souhaitez'
    },
    disclaimer: 'Nous préférons vous rediriger plutôt que de vous donner une réponse hors de notre expertise.',
    priority: 'normal'
  };
}

export { ALLOWED_DOMAINS };
