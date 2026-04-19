/**
 * phase-quality-disclaimer.test.mjs — LLCA art. 12
 *
 * Vérifie que le disclaimer durci est bien une structure { short, full, llca_note }
 * et que chaque champ contient les mentions constitutionnelles.
 *
 * Décision : le disclaimer ne peut pas être en JSON seulement. Ces tests
 * protègent la structure côté back-end ; la visibilité UI est vérifiée
 * séparément (e2e-frontend + inspection manuelle du bandeau sticky).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDisclaimer } from '../src/services/triage-engine.mjs';

describe('Disclaimer LLCA — structure durcie', () => {
  it('buildDisclaimer() retourne un objet avec { short, full, llca_note }', () => {
    const d = buildDisclaimer();
    assert.equal(typeof d, 'object', 'disclaimer doit être un objet');
    assert.ok(d !== null, 'disclaimer ne doit pas être null');
    assert.equal(typeof d.short, 'string', 'short doit être une string');
    assert.equal(typeof d.full, 'string', 'full doit être une string');
    assert.equal(typeof d.llca_note, 'string', 'llca_note doit être une string');
  });

  it("disclaimer.short inclut \"n'est pas un avocat\"", () => {
    const d = buildDisclaimer();
    assert.ok(
      d.short.includes("n'est pas un avocat"),
      `short doit mentionner "n'est pas un avocat", reçu : ${d.short}`
    );
  });

  it('disclaimer.full mentionne les sources vérifiées (Fedlex ou "sources vérifiées")', () => {
    const d = buildDisclaimer();
    const full = d.full.toLowerCase();
    assert.ok(
      full.includes('fedlex') || full.includes('sources vérifiées'),
      `full doit mentionner "Fedlex" ou "sources vérifiées", reçu : ${d.full}`
    );
  });

  it('disclaimer.llca_note mentionne LLCA ou art. 12', () => {
    const d = buildDisclaimer();
    assert.ok(
      d.llca_note.includes('LLCA') || d.llca_note.includes('art. 12'),
      `llca_note doit mentionner "LLCA" ou "art. 12", reçu : ${d.llca_note}`
    );
  });

  it('disclaimer.full recommande de consulter un professionnel du droit', () => {
    const d = buildDisclaimer();
    const full = d.full.toLowerCase();
    assert.ok(
      full.includes('professionnel du droit') || full.includes('avocat'),
      `full doit recommander un professionnel, reçu : ${d.full}`
    );
  });
});
