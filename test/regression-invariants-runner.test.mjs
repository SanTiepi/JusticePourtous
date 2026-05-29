/**
 * Tests directs — regression-invariants-runner.mjs
 *
 * Couvre :
 *   - detectServiceType : 10 patterns + null guard
 *   - CHECKS.*          : 8 types de check individuels (pass + fail + edge cases)
 *   - runInvariants     : API publique, null guards, fiche introuvable, type inconnu, agrégats
 *
 * Zéro LLM, zéro réseau, zéro disque.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { runInvariants, _internals } from '../src/services/regression-invariants-runner.mjs';

const { detectServiceType, CONFIANCE_ORDER, CHECKS } = _internals;

// ── Helpers ──────────────────────────────────────────────────────────────────

function ficheMock(overrides = {}) {
  return {
    id: 'bail_test',
    domaine: 'bail',
    confiance: 'probable',
    tags: ['moisissure', 'humidité'],
    cascades: [],
    reponse: {
      explication: 'A'.repeat(250),
      articles: [{ ref: 'CO 256', source_id: 'ch/co/256' }],
      jurisprudence: [
        { ref: 'TF 4A_1/2020', resume: 'Résumé' },
        { ref: 'TF 4A_2/2021', resume: 'Résumé 2' }
      ],
      services: [],
      modeleLettre: 'Madame, Monsieur, je vous écris concernant le défaut constaté dans l\'appartement.'
    },
    ...overrides
  };
}

// ── detectServiceType ─────────────────────────────────────────────────────────

describe('detectServiceType', () => {
  it('null → null', () => assert.equal(detectServiceType(null), null));
  it('chaîne vide → null', () => assert.equal(detectServiceType(''), null));
  it('asloca', () => assert.equal(detectServiceType('Section ASLOCA Vaud'), 'asloca'));
  it('syndicat (unia)', () => assert.equal(detectServiceType('Unia — syndicat'), 'syndicat'));
  it('syndicat (SIT)', () => assert.equal(detectServiceType('SIT Genève'), 'syndicat'));
  it('tribunal/prud\'hommes', () => assert.equal(detectServiceType('Tribunal des prud\'hommes'), 'tribunal'));
  it('conciliation', () => assert.equal(detectServiceType('Autorité de conciliation'), 'conciliation'));
  it('lavi', () => assert.equal(detectServiceType('Centre LAVI'), 'lavi'));
  it('caritas', () => assert.equal(detectServiceType('Caritas Suisse'), 'caritas'));
  it('csp', () => assert.equal(detectServiceType('Centre social CSP'), 'csp'));
  it('office des poursuites', () => assert.equal(detectServiceType('Office des poursuites du canton'), 'office_poursuites'));
  it('bureau égalité', () => assert.equal(detectServiceType("Bureau de l'égalité"), 'egalite'));
  it('avocat/barreau', () => assert.equal(detectServiceType('Ordre des avocats VD'), 'avocat'));
  it('nom inconnu → null', () => assert.equal(detectServiceType('Mairie de Lausanne'), null));
});

// ── CONFIANCE_ORDER ───────────────────────────────────────────────────────────

describe('CONFIANCE_ORDER', () => {
  it('contient les 4 niveaux dans le bon ordre', () => {
    assert.deepEqual(CONFIANCE_ORDER, ['incertain', 'variable', 'probable', 'certain']);
  });
});

// ── CHECKS.article_present ───────────────────────────────────────────────────

describe('check article_present', () => {
  const check = CHECKS.article_present;

  it('article présent → ok', () => {
    assert.ok(check(ficheMock(), { type: 'article_present', value: 'CO 256' }).ok);
  });

  it('article absent → fail avec raison', () => {
    const r = check(ficheMock(), { type: 'article_present', value: 'CC 271' });
    assert.ok(!r.ok);
    assert.match(r.reason, /CC 271/);
  });

  it('fiche sans reponse.articles → fail', () => {
    const f = ficheMock({ reponse: { articles: [] } });
    assert.ok(!check(f, { value: 'CO 256' }).ok);
  });

  it('articles null → fail gracieux', () => {
    const f = ficheMock({ reponse: {} });
    assert.ok(!check(f, { value: 'CO 256' }).ok);
  });
});

// ── CHECKS.article_with_source_id ────────────────────────────────────────────

describe('check article_with_source_id', () => {
  const check = CHECKS.article_with_source_id;

  it('article avec source_id inline → ok', () => {
    const f = ficheMock();
    // CO 256 a source_id 'ch/co/256' dans la fixture
    assert.ok(check(f, { ref_regex: 'CO 256' }).ok);
  });

  it('regex sans match → fail', () => {
    const r = check(ficheMock(), { ref_regex: 'LP 271' });
    assert.ok(!r.ok);
    assert.match(r.reason, /LP 271/);
  });

  it('article match regex mais sans source_id → fail (source-registry non trouvé)', () => {
    const f = ficheMock({ reponse: { articles: [{ ref: 'FAKE 999' }] } });
    const r = check(f, { ref_regex: 'FAKE 999' });
    // Pas de source_id inline et le source-registry ne connaît pas FAKE 999
    assert.ok(!r.ok);
  });
});

// ── CHECKS.delai_exists ──────────────────────────────────────────────────────

describe('check delai_exists', () => {
  const check = CHECKS.delai_exists;

  function ficheAvecDelai(delai, action = 'envoyer mise en demeure') {
    return ficheMock({
      cascades: [{ titre: 'Procédure', etapes: [{ delai, action, procedure: '' }] }]
    });
  }

  it('délai trouvé par tokens → ok', () => {
    const f = ficheAvecDelai('30 jours');
    assert.ok(check(f, { match: '30|jours' }).ok);
  });

  it('match simple texte exact → ok', () => {
    const f = ficheAvecDelai('immédiatement');
    assert.ok(check(f, { match: 'immédiatement' }).ok);
  });

  it('délai absent → fail', () => {
    const r = check(ficheMock({ cascades: [] }), { match: '30 jours' });
    assert.ok(!r.ok);
  });

  it('match vide → fail', () => {
    const r = check(ficheAvecDelai('30 jours'), { match: '' });
    assert.ok(!r.ok);
    assert.match(r.reason, /match vide/);
  });

  it('cascades nulles → fail gracieux', () => {
    const f = ficheMock({ cascades: null });
    assert.ok(!check(f, { match: '30 jours' }).ok);
  });
});

// ── CHECKS.escalade_type_present ─────────────────────────────────────────────

describe('check escalade_type_present', () => {
  const check = CHECKS.escalade_type_present;

  it('type explicite présent → ok', () => {
    const f = ficheMock({ reponse: { services: [{ type: 'asloca', nom: 'ASLOCA' }] } });
    assert.ok(check(f, { value: 'asloca' }).ok);
  });

  it('type déduit du nom → ok', () => {
    const f = ficheMock({ reponse: { services: [{ nom: 'Tribunal des prud\'hommes VD' }] } });
    assert.ok(check(f, { value: 'tribunal' }).ok);
  });

  it('substring dans le nom (fallback) → ok', () => {
    const f = ficheMock({ reponse: { services: [{ nom: 'Centre LAVI Vaud' }] } });
    assert.ok(check(f, { value: 'lavi' }).ok);
  });

  it('service absent → fail', () => {
    const r = check(ficheMock({ reponse: { services: [] } }), { value: 'asloca' });
    assert.ok(!r.ok);
    assert.match(r.reason, /asloca/);
  });

  it('services null → fail gracieux', () => {
    const f = ficheMock({ reponse: {} });
    assert.ok(!check(f, { value: 'asloca' }).ok);
  });
});

// ── CHECKS.confiance_at_least ────────────────────────────────────────────────

describe('check confiance_at_least', () => {
  const check = CHECKS.confiance_at_least;

  it('même niveau → ok', () => {
    assert.ok(check(ficheMock({ confiance: 'probable' }), { value: 'probable' }).ok);
  });

  it('niveau supérieur → ok', () => {
    assert.ok(check(ficheMock({ confiance: 'certain' }), { value: 'probable' }).ok);
  });

  it('niveau inférieur → fail', () => {
    const r = check(ficheMock({ confiance: 'incertain' }), { value: 'probable' });
    assert.ok(!r.ok);
    assert.match(r.reason, /incertain/);
  });

  it('niveau inconnu dans l\'invariant → fail', () => {
    const r = check(ficheMock(), { value: 'absolument_certain' });
    assert.ok(!r.ok);
    assert.match(r.reason, /inconnu/);
  });

  it('confiance fiche inconnue → fail gracieux', () => {
    const r = check(ficheMock({ confiance: 'foo' }), { value: 'probable' });
    assert.ok(!r.ok);
  });
});

// ── CHECKS.jurisprudence_min_count ───────────────────────────────────────────

describe('check jurisprudence_min_count', () => {
  const check = CHECKS.jurisprudence_min_count;

  it('exactement N → ok', () => {
    assert.ok(check(ficheMock(), { value: 2 }).ok);
  });

  it('plus que N → ok', () => {
    assert.ok(check(ficheMock(), { value: 1 }).ok);
  });

  it('moins que N → fail', () => {
    const r = check(ficheMock(), { value: 5 });
    assert.ok(!r.ok);
    assert.match(r.reason, /2 arrêt/);
  });

  it('jurisprudence absente (0 arrêts) → fail', () => {
    const f = ficheMock({ reponse: { articles: [], jurisprudence: [] } });
    assert.ok(!check(f, { value: 1 }).ok);
  });
});

// ── CHECKS.tag_present ───────────────────────────────────────────────────────

describe('check tag_present', () => {
  const check = CHECKS.tag_present;

  it('tag exact → ok', () => {
    assert.ok(check(ficheMock(), { value: 'moisissure' }).ok);
  });

  it('tag insensible à la casse → ok', () => {
    assert.ok(check(ficheMock(), { value: 'MOISISSURE' }).ok);
  });

  it('tag absent → fail', () => {
    const r = check(ficheMock({ tags: ['bail'] }), { value: 'moisissure' });
    assert.ok(!r.ok);
    assert.match(r.reason, /moisissure/);
  });

  it('match partiel accepté (sous-chaîne) → ok', () => {
    // "humidité" contient "humid" partiellement
    assert.ok(check(ficheMock(), { value: 'humid' }).ok);
  });

  it('tags null → fail gracieux', () => {
    const f = ficheMock({ tags: null });
    assert.ok(!check(f, { value: 'moisissure' }).ok);
  });
});

// ── CHECKS.template_exists ───────────────────────────────────────────────────

describe('check template_exists', () => {
  const check = CHECKS.template_exists;

  it('modèle de lettre présent (>50 chars) → ok', () => {
    assert.ok(check(ficheMock(), {}).ok);
  });

  it('modèle absent → fail', () => {
    const f = ficheMock({ reponse: { modeleLettre: undefined } });
    assert.ok(!check(f, {}).ok);
  });

  it('modèle trop court (≤50 chars) → fail', () => {
    const f = ficheMock({ reponse: { modeleLettre: 'Court' } });
    assert.ok(!check(f, {}).ok);
  });

  it('reponse null → fail gracieux', () => {
    const f = { ...ficheMock(), reponse: null };
    assert.ok(!check(f, {}).ok);
  });
});

// ── runInvariants — API publique ──────────────────────────────────────────────

describe('runInvariants — guards entrées dégénérées', () => {
  it('invariantsDef vide → passes=true, total=0', () => {
    const r = runInvariants([], new Map());
    assert.equal(r.passes, true);
    assert.equal(r.total_count, 0);
    assert.equal(r.pass_count, 0);
    assert.deepEqual(r.failures, []);
  });

  it('fiche introuvable → failure avec raison', () => {
    const defs = [{ intent_id: 'bail_test', fiche_id: 'bail_introuvable', invariants: [{ type: 'article_present', value: 'CO 256' }] }];
    const r = runInvariants(defs, new Map());
    assert.equal(r.passes, false);
    assert.equal(r.failures.length, 1);
    assert.match(r.failures[0].reason, /introuvable/);
  });

  it('type d\'invariant inconnu → failure', () => {
    const fiche = ficheMock();
    const defs = [{ intent_id: 'bail_test', fiche_id: 'bail_test', invariants: [{ type: 'type_inexistant', value: 'x' }] }];
    const r = runInvariants(defs, new Map([['bail_test', fiche]]));
    assert.equal(r.passes, false);
    assert.match(r.failures[0].reason, /inconnu/);
  });
});

describe('runInvariants — agrégats pass/fail', () => {
  it('3 invariants : 2 passes + 1 fail → passes=false, pass_count=2', () => {
    const fiche = ficheMock();
    const defs = [{
      intent_id: 'bail_test',
      fiche_id: 'bail_test',
      invariants: [
        { type: 'article_present', value: 'CO 256' },     // pass
        { type: 'tag_present', value: 'moisissure' },     // pass
        { type: 'article_present', value: 'CC 999' }      // fail
      ]
    }];
    const r = runInvariants(defs, new Map([['bail_test', fiche]]));
    assert.equal(r.total_count, 3);
    assert.equal(r.pass_count, 2);
    assert.equal(r.failures.length, 1);
    assert.equal(r.passes, false);
  });

  it('tous passants → passes=true, failures=[]', () => {
    const fiche = ficheMock();
    const defs = [{
      intent_id: 'bail_test',
      fiche_id: 'bail_test',
      invariants: [
        { type: 'article_present', value: 'CO 256' },
        { type: 'tag_present', value: 'moisissure' },
        { type: 'confiance_at_least', value: 'incertain' }
      ]
    }];
    const r = runInvariants(defs, new Map([['bail_test', fiche]]));
    assert.equal(r.passes, true);
    assert.equal(r.failures.length, 0);
    assert.equal(r.pass_count, 3);
  });

  it('lookup par intent_id (fallback si fiche_id absent)', () => {
    const fiche = ficheMock();
    const defs = [{
      intent_id: 'bail_test',
      // pas de fiche_id : lookup par intent_id
      invariants: [{ type: 'tag_present', value: 'moisissure' }]
    }];
    const r = runInvariants(defs, new Map([['bail_test', fiche]]));
    assert.equal(r.passes, true);
  });

  it('exception dans un check → failure gracieuse', () => {
    const fiche = ficheMock();
    // Injecter un check qui lève une exception
    const badDefs = [{
      intent_id: 'bail_test',
      fiche_id: 'bail_test',
      invariants: [{ type: 'article_with_source_id', ref_regex: '[invalid(regex' }]
    }];
    const r = runInvariants(badDefs, new Map([['bail_test', fiche]]));
    assert.equal(r.passes, false);
    assert.match(r.failures[0].reason, /exception/);
  });
});
