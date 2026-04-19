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

function buildHumanTierResponse(reason) {
  return {
    type: 'human_tier_redirect',
    message: 'Ce type de situation dépasse le cadre du triage automatisé. Voici des ressources humaines à contacter :',
    reason,
    resources: [
      {
        name: 'Permanence avocats cantonale',
        note: 'premier rendez-vous généralement gratuit ou à tarif réduit',
        lookup_hint: 'Ordre cantonal des avocats'
      },
      {
        name: 'Centre Social Protestant / Caritas',
        note: 'consultation juridique gratuite sous conditions'
      },
      {
        name: 'Ombudsman cantonal',
        note: 'si litige avec l\'administration'
      }
    ],
    priority: 'high'
  };
}

function buildOutOfScopeResponse(key, label) {
  const redirections = {
    succession: {
      message: `Les questions de ${label} ne sont pas couvertes par notre triage. Contactez un notaire ou consultez l'office des successions de votre canton.`,
      redirect_to: ['notaire', 'office des successions cantonal']
    },
    propriete_intellectuelle: {
      message: `La ${label} n'est pas couverte. Consultez l'IPI (Institut fédéral de la propriété intellectuelle) ou un avocat spécialisé.`,
      redirect_to: ['IPI — ige.ch', 'avocat en PI']
    },
    fiscal: {
      message: `La ${label} n'est pas couverte. Contactez votre administration fiscale cantonale ou un fiduciaire.`,
      redirect_to: ['administration fiscale cantonale', 'fiduciaire']
    }
  };

  const entry = redirections[key];
  return {
    type: 'out_of_scope',
    label,
    message: entry?.message || `Ce domaine (${label}) n'est pas dans notre périmètre. Consultez une ressource juridique cantonale.`,
    redirect_to: entry?.redirect_to || ['ordre des avocats cantonal'],
    priority: 'normal'
  };
}

export { ALLOWED_DOMAINS };
