/**
 * Phase Cortex 2 — Source Registry Coverage
 *
 * Vérifie que le source-registry résout ≥ 95% des refs d'articles
 * présentes dans les fiches, et que le fallback par préfixe RS Fedlex
 * fonctionne pour les refs courantes du droit suisse.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSourceByRef,
  buildSourceRegistry,
  resolveByPrefix,
  extractPrefix,
  RS_BY_PREFIX,
} from '../src/services/source-registry.mjs';
import { auditCoverage } from '../scripts/audit-source-id-coverage.mjs';

const SOURCE_ID_REGEX = /^fedlex:rs[a-z0-9.\-]+:[a-z0-9.\-]+$/;

describe('Phase Cortex — Source Registry Coverage', () => {

  describe('Coverage threshold', () => {
    it('resolves ≥ 95% of unique refs in fiches', () => {
      const report = auditCoverage();
      assert.ok(
        report.coverage.uniquePercent >= 95,
        `Coverage is ${report.coverage.uniquePercent}% — expected ≥ 95%`
      );
    });

    it('resolves ≥ 95% of ref occurrences in fiches', () => {
      const report = auditCoverage();
      assert.ok(
        report.coverage.occurrencesPercent >= 95,
        `Occurrences coverage is ${report.coverage.occurrencesPercent}% — expected ≥ 95%`
      );
    });
  });

  describe('Common Swiss law refs must resolve', () => {
    // Top refs across the 14 prefixes listed in the task spec
    const commonRefs = [
      'CO 259a', 'CO 716b', 'CO 336c', 'CO 335',
      'CC 28', 'CC 125',
      'LP 82', 'LP 333a',
      'LAA 6', 'LAA 36', 'LAA 17',
      'LAI 29', 'LAI 4',
      'LAMal 25', 'LAMal 64',
      'LAsi 17', 'LAsi 44',
      'LEI 30', 'LEI 42', 'LEI 62',
      'LN 9', 'LN 21',
      'LAVS 21', 'LAVS 29',
      'LACI 8', 'LACI 17',
      'LAFam 3',
      'LPGA 52', 'LPGA 60',
      'LAVI 13', 'LAVI 19',
    ];

    for (const ref of commonRefs) {
      it(`resolves "${ref}"`, () => {
        const src = getSourceByRef(ref);
        assert.ok(src, `${ref} should resolve`);
        assert.ok(src.source_id, `${ref} must have source_id`);
        assert.ok(src.tier >= 1 && src.tier <= 3, `${ref} tier must be 1..3`);
      });
    }
  });

  describe('source_id format validation', () => {
    it('fallback source_ids match the fedlex regex', () => {
      const refs = ['LAA 36', 'LAI 29', 'CO 716b', 'LEI 62'];
      for (const ref of refs) {
        const src = getSourceByRef(ref);
        assert.ok(src, `${ref} should resolve`);
        assert.match(src.source_id, SOURCE_ID_REGEX, `${ref} source_id format invalid: ${src.source_id}`);
      }
    });

    it('all fallback entries have a valid tier ∈ {1,2,3}', () => {
      const refs = ['CO 259a', 'LAA 36', 'LAI 29', 'LEI 62', 'LAVI 13', 'LASV (VD)', 'CSIAS C.1'];
      for (const ref of refs) {
        const src = getSourceByRef(ref);
        if (src) assert.ok([1, 2, 3].includes(src.tier), `${ref} tier invalid: ${src.tier}`);
      }
    });
  });

  describe('No regression: existing resolutions preserved', () => {
    it('CO 259a still resolves as tier 1 article (registry-direct)', () => {
      buildSourceRegistry();
      const src = getSourceByRef('CO 259a');
      assert.ok(src);
      assert.equal(src.type, 'article');
      assert.equal(src.tier, 1);
      assert.equal(src.binding_strength, 'decisif');
    });

    it('registry-direct refs take precedence over fallback', () => {
      // CO 259a exists in Fedlex data → must resolve via direct lookup, not fallback
      const src = getSourceByRef('CO 259a');
      assert.ok(src);
      // Direct registry entry will not carry resolvedBy flag
      assert.notEqual(src.resolvedBy, 'prefix_fallback',
        'CO 259a should resolve from registry, not fallback');
    });
  });

  describe('Prefix table structure', () => {
    it('RS_BY_PREFIX covers the 14+ priority Swiss laws', () => {
      const required = ['CO', 'CC', 'LP', 'LAA', 'LAI', 'LAMal', 'LAsi', 'LEI', 'LN', 'LAVS', 'LACI', 'LAFam', 'LPGA', 'LAVI'];
      for (const p of required) {
        // case-insensitive search
        const found = Object.keys(RS_BY_PREFIX).find(k => k.toUpperCase() === p.toUpperCase());
        assert.ok(found, `Prefix "${p}" missing from RS_BY_PREFIX`);
      }
    });

    it('each prefix entry has rs, titre, tier, scope', () => {
      for (const [k, v] of Object.entries(RS_BY_PREFIX)) {
        assert.ok(v.rs, `${k} missing rs`);
        assert.ok(v.titre, `${k} missing titre`);
        assert.ok([1, 2, 3].includes(v.tier), `${k} invalid tier`);
        assert.ok(v.scope, `${k} missing scope`);
      }
    });

    it('RS numbers correspond to canonical Fedlex codes', () => {
      assert.equal(RS_BY_PREFIX['CO'].rs, '220');
      assert.equal(RS_BY_PREFIX['CC'].rs, '210');
      assert.equal(RS_BY_PREFIX['LP'].rs, '281.1');
      assert.equal(RS_BY_PREFIX['LAA'].rs, '832.20');
      assert.equal(RS_BY_PREFIX['LAI'].rs, '831.20');
    });
  });

  describe('extractPrefix / resolveByPrefix helpers', () => {
    it('extractPrefix parses "CO 716b" → "CO"', () => {
      assert.equal(extractPrefix('CO 716b'), 'CO');
    });

    it('extractPrefix parses "LAFam 3" → "LAFam"', () => {
      assert.equal(extractPrefix('LAFam 3'), 'LAFam');
    });

    it('resolveByPrefix builds a source_id for unknown-but-valid refs', () => {
      const src = resolveByPrefix('LAA 36');
      assert.ok(src);
      assert.equal(src.tier, 1);
      assert.match(src.source_id, SOURCE_ID_REGEX);
      assert.equal(src.resolvedBy, 'prefix_fallback');
    });

    it('resolveByPrefix returns null for an unknown prefix', () => {
      const src = resolveByPrefix('FOOBAR 42');
      assert.equal(src, null);
    });
  });

  describe('Cantonal and practice refs', () => {
    it('resolves LASV (VD) as tier 1 VD scope', () => {
      const src = getSourceByRef('LASV (VD)');
      assert.ok(src, 'LASV (VD) must resolve');
      assert.equal(src.scope, 'VD');
    });

    it('resolves LIASI (GE) as tier 1 GE scope', () => {
      const src = getSourceByRef('LIASI (GE)');
      assert.ok(src, 'LIASI (GE) must resolve');
      assert.equal(src.scope, 'GE');
    });

    it('resolves CSIAS C.1 as tier 3 practice', () => {
      const src = getSourceByRef('CSIAS C.1');
      assert.ok(src, 'CSIAS C.1 must resolve');
      assert.equal(src.tier, 3);
    });
  });

});
