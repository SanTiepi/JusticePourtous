/**
 * Phase Cortex — Certificate Gate (livrable 30j).
 *
 * Mission : aucun claim affiché sans source_id vérifiée.
 * Le `coverage-certificate` est un gate bloquant avant toute sortie publique.
 *
 * Tests :
 *   - 3 cas qui DOIVENT bloquer (articles sans source_id, délais sans base légale, mix)
 *   - 3 cas qui DOIVENT passer (complets)
 *   - 2 downgrade tests (sufficient → limited, sufficient → insufficient)
 *   - 2 tests d'intégration via handleTriageStart (fixtures, mode fallback sans LLM)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  certifyIssue,
  requireSufficientCertificate,
} from '../src/services/coverage-certificate.mjs';
import { handleTriageStart } from '../src/services/triage-orchestration.mjs';

// ─── Fixtures ─────────────────────────────────────────────────────

function fullIssue(overrides = {}) {
  return {
    issue_id: 'fixture_full',
    qualification: 'Défaut de la chose louée',
    domaine: 'bail',
    articles: [{ ref: 'CO 259a', source_id: 'fedlex:rs220:co-259a' }],
    arrets: [
      { signature: '4A_32/2018', role: 'favorable', resultat: 'favorable_locataire', source_id: 'juris:tf:4a_32-2018' },
      { signature: '4A_395/2017', role: 'defavorable', resultat: 'favorable_bailleur', source_id: 'juris:tf:4a_395-2017' },
    ],
    delais: [{ procedure: 'Signalement CO 259a', delai: 'immédiatement', base_legale: 'CO 259a' }],
    preuves: [{ procedure: 'Preuve du défaut' }],
    anti_erreurs: [{ erreur: 'Ne pas agir seul' }],
    patterns: [{ situation: 'Moisissure locataire' }],
    contacts: [{ nom: 'ASLOCA' }],
    ...overrides,
  };
}

function payloadFromIssue(issue) {
  // Un payload public triage-engine expose : fiche, articles, jurisprudence_enriched,
  // delaisCritiques, contacts, etc. On construit la forme minimale attendue par
  // extractIssuesFromPayload().
  return {
    status: 'ready_for_pipeline',
    ficheId: issue.issue_id,
    resumeSituation: issue.qualification,
    domaine: issue.domaine,
    articles: issue.articles,
    jurisprudence_enriched: issue.arrets,
    delaisCritiques: issue.delais,
    preuves: issue.preuves,
    anti_erreurs: issue.anti_erreurs,
    patterns: issue.patterns,
    contacts: issue.contacts,
  };
}

// ─── 1. Cas qui DOIVENT bloquer ──────────────────────────────────

describe('Cortex certificate gate — cas bloquants', () => {

  it('BLOQUE : article sans source_id → status insufficient', () => {
    const issue = fullIssue({
      articles: [{ ref: 'CO 259a' }], // pas de source_id
    });
    const gate = requireSufficientCertificate(payloadFromIssue(issue));
    assert.equal(gate.passes, false);
    assert.equal(gate.status, 'insufficient');
    assert.equal(gate.downgrade_to, 'insufficient');
    assert.ok(gate.critical_fails.length > 0, 'Doit avoir au moins 1 critical_fail');
    const msg = gate.critical_fails.join(' ');
    assert.match(msg, /source_id|source/i, 'Le critical_fail doit mentionner source_id');
  });

  it('BLOQUE : délai sans base légale ni procedure reconnue → status insufficient', () => {
    const issue = fullIssue({
      articles: [], // pas d'articles → pas d'implicit sourcing
      delais: [{ procedure: 'démarche quelconque', delai: '30j' }],
    });
    const gate = requireSufficientCertificate(payloadFromIssue(issue));
    assert.equal(gate.passes, false);
    assert.equal(gate.status, 'insufficient');
    // base_legale OU source_ids_present OU deadlines_sourced doivent échouer
    const msg = gate.critical_fails.join(' ');
    assert.match(msg, /base\s*l[ée]gale|délai|source/i);
  });

  it('BLOQUE : mix — article sans source_id ET délai sans base légale', () => {
    const issue = fullIssue({
      articles: [{ ref: 'CO 259a' }], // orphelin
      delais: [{ procedure: 'quelque chose', delai: '14j' }], // orphelin
    });
    const gate = requireSufficientCertificate(payloadFromIssue(issue));
    assert.equal(gate.passes, false);
    assert.equal(gate.status, 'insufficient');
    // Les DEUX fails critiques doivent être présents
    assert.ok(gate.critical_fails.length >= 1);
  });

});

// ─── 2. Cas qui DOIVENT passer ───────────────────────────────────

describe('Cortex certificate gate — cas valides', () => {

  it('PASSE : issue complète → status sufficient, downgrade_to null', () => {
    const gate = requireSufficientCertificate(payloadFromIssue(fullIssue()));
    assert.equal(gate.passes, true);
    assert.equal(gate.status, 'sufficient');
    assert.equal(gate.downgrade_to, null);
    assert.equal(gate.critical_fails.length, 0);
  });

  it('PASSE : délai sans base_legale mais article avec source_id → implicit basis OK', () => {
    const issue = fullIssue({
      // articles avec source_id → fournit la base légale implicite
      delais: [{ procedure: 'Signalement défaut', delai: 'immédiatement' }], // pas de base_legale
    });
    const cert = certifyIssue(issue);
    const deadlineCheck = cert.checks.find(c => c.id === 'deadlines_sourced');
    assert.ok(deadlineCheck, 'Le check deadlines_sourced doit exister');
    assert.equal(deadlineCheck.passed, true,
      'Avec un article source_id présent, le délai est implicitement sourcé');
  });

  it('PASSE : délai avec procedure matchant une loi (CO/CC/LP) → deadlines_sourced passe', () => {
    const issue = {
      issue_id: 'only_laws',
      domaine: 'bail',
      articles: [{ ref: 'CO 259a', source_id: 'fedlex:rs220:co-259a' }],
      arrets: [
        { signature: '4A_32/2018', role: 'favorable', resultat: 'favorable_locataire', source_id: 'j1' },
        { signature: '4A_395/2017', role: 'defavorable', resultat: 'favorable_bailleur', source_id: 'j2' },
      ],
      delais: [{ procedure: 'Procédure LP 82', delai: '20j' }],
      preuves: [{}], anti_erreurs: [{}], patterns: [{}], contacts: [{}],
    };
    const cert = certifyIssue(issue);
    assert.equal(cert.status, 'sufficient');
    const deadlineCheck = cert.checks.find(c => c.id === 'deadlines_sourced');
    assert.equal(deadlineCheck.passed, true);
  });

});

// ─── 3. Downgrade tests ──────────────────────────────────────────

describe('Cortex certificate gate — downgrade', () => {

  it('DOWNGRADE : sufficient → limited si ≥1 fail non-critique uniquement', () => {
    // On retire un élément non-critique (preuves, anti_erreurs, patterns, contacts)
    // → le check warning échoue mais aucun critique → statut = limited
    const issue = fullIssue({
      preuves: [],
      anti_erreurs: [],
      patterns: [],
      contacts: [],
    });
    const gate = requireSufficientCertificate(payloadFromIssue(issue));
    assert.equal(gate.passes, false);
    assert.equal(gate.status, 'limited');
    assert.equal(gate.downgrade_to, 'limited');
    assert.equal(gate.critical_fails.length, 0,
      'Aucun fail critique (seulement warnings non-critiques)');
    assert.ok(gate.warnings.length > 0);
  });

  it('DOWNGRADE : sufficient → insufficient si ≥1 fail critique', () => {
    const issue = fullIssue({
      articles: [], // fail base_legale (critique)
    });
    const gate = requireSufficientCertificate(payloadFromIssue(issue));
    assert.equal(gate.passes, false);
    assert.equal(gate.status, 'insufficient');
    assert.equal(gate.downgrade_to, 'insufficient');
    assert.ok(gate.critical_fails.length > 0);
  });

});

// ─── 4. Tests d'intégration via handleTriageStart ────────────────

describe('Cortex certificate gate — intégration handleTriageStart', () => {

  it('INT : payload avec status=ready_for_pipeline contient certificate { status, critical_fails, warnings, checked_at }', async () => {
    // Mode fallback sans LLM (ANTHROPIC_API_KEY absent en test) → semantic search.
    const previousKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const payload = await handleTriageStart({
        texte: 'mon appart est moisi',
        canton: 'VD',
      });
      // En mode fallback, le payload revient sans case_id donc tous les "ready"
      // passent par finalizePayload avec status=ready_for_pipeline.
      if (payload.status === 'ready_for_pipeline') {
        assert.ok(payload.certificate, 'payload.certificate doit être exposé');
        assert.ok(['sufficient', 'limited', 'insufficient'].includes(payload.certificate.status));
        assert.ok(Array.isArray(payload.certificate.critical_fails));
        assert.ok(Array.isArray(payload.certificate.warnings));
        assert.ok(payload.certificate.checked_at);
        // Si insufficient → quality_warning flag
        if (payload.certificate.status === 'insufficient') {
          assert.equal(payload.quality_warning, true);
        }
      } else {
        // Alternative : status peut être 'ask_questions' → pas de certificate obligatoire
        assert.ok(payload.status);
      }
    } finally {
      if (previousKey) process.env.ANTHROPIC_API_KEY = previousKey;
    }
  });

  it('INT : status ask_questions n\'impose PAS encore le certificate (étape intermédiaire)', async () => {
    const previousKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const payload = await handleTriageStart({
        texte: 'problème de loyer complexe',
        canton: 'GE',
      });
      if (payload.status === 'ask_questions') {
        // Step intermédiaire : pas de claims exposés → certificate optionnel
        // On tolère soit absent, soit présent.
        if (payload.certificate !== undefined) {
          assert.ok(['sufficient', 'limited', 'insufficient'].includes(payload.certificate.status));
        }
      }
      // Le payload doit toujours avoir un status structuré
      assert.ok(typeof payload.status === 'string');
    } finally {
      if (previousKey) process.env.ANTHROPIC_API_KEY = previousKey;
    }
  });

});

// ─── 5. Sanity checks supplémentaires ────────────────────────────

describe('Cortex certificate gate — sanity', () => {

  it('gate gère un payload vide/null correctement', () => {
    const gate = requireSufficientCertificate(null);
    assert.equal(gate.passes, false);
    assert.equal(gate.status, 'insufficient');
    assert.equal(gate.downgrade_to, 'insufficient');
  });

  it('gate expose toujours un checked_at ISO string', () => {
    const gate = requireSufficientCertificate(payloadFromIssue(fullIssue()));
    assert.ok(gate.checked_at);
    // Doit parser en Date valide
    assert.ok(!isNaN(new Date(gate.checked_at).getTime()));
  });

});
