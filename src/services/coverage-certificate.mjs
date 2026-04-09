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
      // Contradictoire = at least both sides OR only one side but flagged
      return hasFavorable && hasContra;
    },
  },
];

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
      passed,
    };
  });

  const criticalFails = checks.filter(c => c.critical && !c.passed);
  const totalPassed = checks.filter(c => c.passed).length;
  const totalChecks = checks.length;
  const score = Math.round((totalPassed / totalChecks) * 100);

  // Status determination
  let status;
  if (criticalFails.length > 0) {
    status = 'insufficient';
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
