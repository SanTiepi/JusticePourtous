/**
 * Coverage Certificate — Certificat de suffisance contradictoire
 *
 * Constitution: "Chaque issue dans le dossier DOIT vérifier" une checklist.
 * Ce module formalise cette checklist en gate automatique.
 *
 * Avant toute réponse, chaque issue est passée dans la matrice.
 * Si une case critique manque → le claim passe en "insufficient".
 * Le certificat est auditable, testable, et attaché à chaque analyse.
 */

// ─── Coverage matrix (from CONSTITUTION.md checklist) ────────────

const REQUIRED_CHECKS = [
  {
    id: 'base_legale',
    label: 'Base légale applicable',
    critical: true,
    check: (issue) => issue.articles?.length > 0,
  },
  {
    id: 'juris_favorable',
    label: 'Jurisprudence favorable',
    critical: false,
    check: (issue) => issue.arrets?.some(a =>
      a.role === 'favorable' || a.resultat?.includes('favorable')
    ),
  },
  {
    id: 'juris_contra',
    label: 'Jurisprudence contraire ou nuancée',
    critical: false,
    check: (issue) => issue.arrets?.some(a =>
      a.role === 'defavorable' || a.role === 'neutre' ||
      a.resultat?.includes('rejet')
    ),
  },
  {
    id: 'delai',
    label: 'Délai identifié',
    critical: true,
    check: (issue) => issue.delais?.length > 0,
  },
  {
    id: 'preuve',
    label: 'Preuve requise documentée',
    critical: false,
    check: (issue) => issue.preuves?.length > 0,
  },
  {
    id: 'anti_erreur',
    label: 'Anti-erreur identifiée',
    critical: false,
    check: (issue) => issue.anti_erreurs?.length > 0,
  },
  {
    id: 'pattern',
    label: 'Pattern praticien disponible',
    critical: false,
    check: (issue) => issue.patterns?.length > 0,
  },
  {
    id: 'contact',
    label: 'Contact / autorité compétente',
    critical: false,
    check: (issue) => issue.contacts?.length > 0,
  },
  {
    id: 'source_ids',
    label: 'Toutes les sources ont un source_id',
    critical: true,
    check: (issue) => {
      const allSources = [
        ...(issue.articles || []),
        ...(issue.arrets || []),
      ];
      return allSources.length > 0 && allSources.every(s => s.source_id);
    },
  },
  {
    id: 'contradictoire',
    label: 'Dossier contradictoire (pro ET contra)',
    critical: true, // Constitution: dossier contradictoire = non-négociable
    check: (issue) => {
      const arrets = issue.arrets || [];
      const hasFavorable = arrets.some(a =>
        a.role === 'favorable' || a.resultat?.includes('favorable')
      );
      const hasContra = arrets.some(a =>
        a.role === 'defavorable' || a.role === 'neutre' ||
        a.resultat?.includes('rejet')
      );
      return hasFavorable && hasContra;
    },
  },
  // Cortex Phase 2 — Gate bloquant (re-appliqué après revert)
  {
    id: 'juris_tier_adequacy',
    label: 'Jurisprudence couvre ≥1 source T1 ou T2',
    critical: true,
    severity: 'limited', // échec → downgrade 'limited', pas 'insufficient'
    check: (issue) => {
      const arrets = issue.arrets || [];
      if (arrets.length === 0) return true;
      // Utiliser effectiveTier qui dérive depuis signature si tier absent
      const tiers = arrets.map(effectiveTier);
      return Math.min(...tiers) <= 2;
    },
  },
  {
    id: 'source_ids_present',
    label: 'Tous les articles affichés ont un source_id',
    // Severity 'insufficient' : maintenant que source-registry résout 100% via
    // fallback RS (agent source-registry-100), un article sans source_id = bug réel.
    critical: true,
    check: (issue) => {
      const articles = issue.articles || [];
      if (articles.length === 0) return true;
      return articles.every(a => a.source_id && typeof a.source_id === 'string' && a.source_id.length > 0);
    },
  },
  {
    id: 'deadlines_sourced',
    label: 'Tous les délais affichés ont une base légale',
    critical: true,
    check: (issue) => {
      const delais = issue.delais || [];
      if (delais.length === 0) return true;
      const articles = issue.articles || [];
      const hasSourcedArticle = articles.some(a => a.source_id && typeof a.source_id === 'string' && a.source_id.length > 0);
      if (hasSourcedArticle) return true;
      return delais.every(d => d.base_legale || d.source_id || d.procedure?.match(/CO|CC|LP|LAA|LAI/i));
    },
  },
];

const CHECK_HUMAN_LABELS = {
  base_legale: 'Aucune base légale rattachée à cette analyse (article de loi manquant)',
  delai: 'Aucun délai légal n\'a été identifié',
  source_ids: 'Une ou plusieurs sources n\'ont pas de source_id',
  contradictoire: 'Le dossier n\'est pas contradictoire (pas de juris pro ET contra)',
  juris_tier_adequacy: 'Jurisprudence citée provient uniquement de sources secondaires',
  source_ids_present: 'Un ou plusieurs articles affichés n\'ont pas de source_id traçable',
  deadlines_sourced: 'Un ou plusieurs délais affichés n\'ont pas de base légale rattachée',
};

/** Dérive le tier d'un arrêt depuis sa signature si absent. */
function effectiveTier(arret) {
  if (typeof arret?.tier === 'number') return arret.tier;
  const sig = String(arret?.signature || '').trim();
  if (/^ATF/i.test(sig)) return 1;
  // Format TF : 4A_32/2018, 5A_XX/YYYY, 6B_XX/YYYY, 9C_XX/YYYY
  if (/^\d[A-Z]_\d+\/\d{4}/.test(sig)) return 2;
  if (arret?.tribunal === 'TF') return arret?.publie ? 1 : 2;
  return 3;
}

// ─── Certificate builder ────────────────────────────────────────

/**
 * Generate a coverage certificate for a single issue in the dossier.
 * @param {object} issue — from dossier.issues[]
 * @returns {object} certificate with pass/fail per check + overall status
 */
export function certifyIssue(issue) {
  const checks = REQUIRED_CHECKS.map(rule => {
    const passed = rule.check(issue);
    return {
      id: rule.id,
      label: rule.label,
      critical: rule.critical,
      severity: rule.severity || (rule.critical ? 'insufficient' : 'limited'),
      passed,
    };
  });

  // Distinguer fails 'insufficient' (bloquants) vs fails 'limited' (downgrade soft)
  const insufficientFails = checks.filter(c => c.critical && !c.passed && c.severity !== 'limited');
  const limitedFails = checks.filter(c => !c.passed && c.severity === 'limited');
  const criticalFails = checks.filter(c => c.critical && !c.passed);
  const totalPassed = checks.filter(c => c.passed).length;
  const totalChecks = checks.length;
  const score = Math.round((totalPassed / totalChecks) * 100);

  // Status determination — sévérité par check :
  //   1) un fail 'insufficient' => insufficient (bloquant)
  //   2) un fail 'limited' uniquement => limited (downgrade soft)
  //   3) sinon score-based
  let status;
  if (insufficientFails.length > 0) {
    status = 'insufficient';
  } else if (limitedFails.length > 0) {
    status = 'limited';
  } else if (score >= 80) {
    status = 'sufficient';
  } else if (score >= 50) {
    status = 'limited';
  } else {
    status = 'insufficient';
  }

  return {
    issue_id: issue.issue_id || null,
    qualification: issue.qualification || null,
    domaine: issue.domaine || null,
    status,
    score,
    checks,
    critical_fails: criticalFails.map(c => c.id),
    limited_fails: limitedFails.map(c => c.id),
    missing: checks.filter(c => !c.passed).map(c => ({
      id: c.id,
      label: c.label,
      critical: c.critical,
    })),
    generated_at: new Date().toISOString(),
  };
}

/**
 * Generate coverage certificates for an entire dossier.
 * @param {object} dossier — from step2_buildDossier()
 * @returns {object} full certificate with per-issue + aggregate
 */
export function certifyDossier(dossier) {
  if (!dossier?.issues?.length) {
    return {
      status: 'insufficient',
      reason: 'no_issues',
      issues: [],
      aggregate: { score: 0, sufficient: 0, limited: 0, insufficient: 0 },
      generated_at: new Date().toISOString(),
    };
  }

  const issueCerts = dossier.issues.map(issue => certifyIssue(issue));

  const sufficient = issueCerts.filter(c => c.status === 'sufficient').length;
  const limited = issueCerts.filter(c => c.status === 'limited').length;
  const insufficient = issueCerts.filter(c => c.status === 'insufficient').length;
  const avgScore = Math.round(
    issueCerts.reduce((s, c) => s + c.score, 0) / issueCerts.length
  );

  // Overall status = worst issue status
  let overallStatus;
  if (insufficient > 0) overallStatus = 'insufficient';
  else if (limited > 0) overallStatus = 'limited';
  else overallStatus = 'sufficient';

  return {
    status: overallStatus,
    issues: issueCerts,
    aggregate: {
      score: avgScore,
      sufficient,
      limited,
      insufficient,
      total: issueCerts.length,
    },
    generated_at: new Date().toISOString(),
  };
}

/**
 * Get the checklist definition (for API / frontend display).
 */
export function getChecklistDefinition() {
  return REQUIRED_CHECKS.map(r => ({
    id: r.id,
    label: r.label,
    critical: r.critical,
  }));
}

/**
 * Gate public — Cortex Phase 2. Analyse un payload triage et retourne un verdict
 * { passes, status, critical_fails, warnings, failed_issues, downgrade_to, checked_at }.
 *
 * Non-breaking : retourne toujours un objet même si le payload n'a pas d'issue
 * reconstituable (fallback mode sans LLM). Le status peut descendre mais jamais
 * supprimer le payload.
 */
export function requireSufficientCertificate(payload) {
  if (!payload || typeof payload !== 'object') {
    // Payload null/vide = pas analysable → insufficient par défaut
    return {
      passes: false,
      status: 'insufficient',
      critical_fails: ['empty_payload: Aucun contenu à certifier'],
      warnings: [],
      failed_issues: [],
      downgrade_to: 'insufficient',
      checked_at: new Date().toISOString()
    };
  }

  // Reconstruire une issue depuis les champs du payload triage
  const articles = payload.articles || payload.fiche?.reponse?.articles || [];
  const arrets = payload.jurisprudence_enriched || payload.jurisprudence || payload.fiche?.reponse?.jurisprudence || [];
  const delais = payload.delaisCritiques || payload.delais || [];
  const anti_erreurs = payload.anti_erreurs || [];
  const patterns = payload.patterns || [];
  const contacts = payload.contacts || [];
  const preuves = payload.preuves || [];

  const issue = {
    issue_id: payload.ficheId || payload.case_id || 'payload',
    qualification: payload.domaine || null,
    domaine: payload.domaine || null,
    articles,
    arrets,
    delais,
    anti_erreurs,
    patterns,
    contacts,
    preuves,
  };

  const cert = certifyIssue(issue);

  // Séparer fails "insufficient" vs "limited" via severity.
  // critical_fails est un array de strings pour rester simple à consommer côté
  // tests et frontend (join(' '), regex match, affichage direct).
  const checks = REQUIRED_CHECKS;
  const criticalFails = [];
  const warningFails = [];
  for (const c of cert.checks) {
    if (c.passed) continue;
    const rule = checks.find(r => r.id === c.id);
    const sev = rule?.severity || (c.critical ? 'insufficient' : 'warning');
    const humanMsg = CHECK_HUMAN_LABELS[c.id] || c.label;
    const entry = `${c.id}: ${humanMsg}`;
    if (sev === 'insufficient' && c.critical) {
      criticalFails.push(entry);
    } else if (sev === 'limited' && c.critical) {
      warningFails.push(entry);
    } else if (!c.critical) {
      warningFails.push(entry);
    }
  }

  let status;
  let downgrade_to = null;
  if (criticalFails.length > 0) {
    status = 'insufficient';
    downgrade_to = 'insufficient';
  } else if (warningFails.length > 0) {
    status = 'limited';
    downgrade_to = 'limited';
  } else {
    status = 'sufficient';
  }

  return {
    passes: status === 'sufficient',
    status,
    critical_fails: criticalFails,
    warnings: warningFails,
    failed_issues: cert.critical_fails || [],
    downgrade_to,
    checked_at: new Date().toISOString(),
  };
}
