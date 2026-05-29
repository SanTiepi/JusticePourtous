/**
 * Edge-case hardening tests for action-planner.mjs
 *
 * Probes degenerate inputs on the only export `generateActionPlan(enriched, canton)`.
 * Pure function (no LLM/network).
 *
 * Bugs trouvés par ce harness le 2026-05-29 et CORRIGÉS côté source :
 *   - fiche enrichie partielle (sans patterns/jurisprudence/etc.) → crashait
 *     (`patterns[0]`, `.slice` sur undefined). Fix : défauts `= []` dans la
 *     déstructuration. Désormais → objet gracieux.
 *   - canton non-string truthy (number, array) → `canton.toUpperCase is not a
 *     function`. Fix : `String(canton).toUpperCase()` dans buildContacts.
 * Les tests ci-dessous verrouillent le comportement GRACIEUX post-fix.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateActionPlan } from '../src/services/action-planner.mjs';

// Helper: a "complete" enriched object with all arrays present (happy-ish path).
function fullEnriched() {
  return {
    fiche: { id: 'x', domaine: 'bail', reponse: { explication: 'test', articles: [] } },
    articles: [],
    jurisprudence: [],
    templates: [],
    delais: [],
    antiErreurs: [],
    patterns: [],
    preuves: [],
    escalade: [],
    cascades: [],
    confiance: 'haut',
    lacunes: [],
  };
}

// --- 1. Inputs that are gracefully rejected at the `!enriched?.fiche` guard ---

test('enriched = null -> returns null (no throw)', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan(null, 'VD'); });
  assert.equal(result, null);
});

test('enriched = undefined -> returns null (no throw)', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan(undefined); });
  assert.equal(result, null);
});

test('enriched = {} (empty object, no fiche) -> returns null', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan({}, 'VD'); });
  assert.equal(result, null);
});

test('enriched without fiche key -> returns null', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan({ articles: [] }, 'VD'); });
  assert.equal(result, null);
});

test('enriched = number (unexpected type) -> returns null', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan(42, 'VD'); });
  assert.equal(result, null);
});

test('enriched = array (unexpected type) -> returns null', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan([], 'VD'); });
  assert.equal(result, null);
});

test('enriched = string (unexpected type) -> returns null', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan('whatever', 'VD'); });
  assert.equal(result, null);
});

// --- 2. Complete enriched object: valid / degenerate canton values ---

test('full enriched + valid canton -> returns a structured object', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan(fullEnriched(), 'VD'); });
  assert.equal(typeof result, 'object');
  assert.notEqual(result, null);
  // Stable shape contract
  assert.ok(Array.isArray(result.etapes));
  assert.ok(Array.isArray(result.documents));
  assert.ok(Array.isArray(result.contacts));
  assert.ok(Array.isArray(result.limites));
  assert.equal(result.canton, 'VD');
  assert.equal(result.domaine, 'bail');
});

test('full enriched + invalid canton "XX" -> graceful (object, canton echoed)', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan(fullEnriched(), 'XX'); });
  assert.equal(typeof result, 'object');
  assert.equal(result.canton, 'XX');
  assert.deepEqual(result.contacts, []); // no escalade contacts available
});

test('full enriched + canton null -> graceful (canton normalized to null)', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan(fullEnriched(), null); });
  assert.equal(typeof result, 'object');
  assert.equal(result.canton, null);
});

test('full enriched + canton "" (empty string) -> graceful (canton null via ||)', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan(fullEnriched(), ''); });
  assert.equal(typeof result, 'object');
  assert.equal(result.canton, null); // `canton || null` collapses '' to null
});

test('full enriched + canton undefined -> graceful', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan(fullEnriched(), undefined); });
  assert.equal(typeof result, 'object');
  assert.equal(result.canton, null);
});

// --- 3. Cas auparavant crashants, désormais GRACIEUX (fix 2026-05-29) ---

test('fiche partielle {fiche:{}} → objet gracieux (défauts [], plus de crash patterns[0])', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan({ fiche: {} }, 'VD'); });
  assert.equal(typeof result, 'object');
  assert.notEqual(result, null);
});

test('fiche présente sans tableaux → objet gracieux (plus de .slice sur undefined)', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan({ fiche: { domaine: 'bail' } }, 'VD'); });
  assert.equal(typeof result, 'object');
  assert.equal(result.domaine, 'bail');
});

test('canton number → objet gracieux (String(canton), plus de toUpperCase crash)', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan(fullEnriched(), 42); });
  assert.equal(typeof result, 'object');
  assert.notEqual(result, null);
});

test('canton array → objet gracieux (String(canton), plus de toUpperCase crash)', () => {
  let result;
  assert.doesNotThrow(() => { result = generateActionPlan(fullEnriched(), ['VD']); });
  assert.equal(typeof result, 'object');
  assert.notEqual(result, null);
});

// --- 4. Contenu SPÉCIFIQUE de la fiche prioritaire sur le générique de domaine ---
// Régression 2026-05-29 : une fiche caution affichait les étapes/délais GÉNÉRIQUES
// du domaine bail (moisissure/consignation, congé/prolongation) au lieu de son
// contenu spécifique → "infos rien à voir". Le plan doit privilégier la cascade
// de la fiche (étapes) et ses délais propres.
test('étapes + délais viennent de la cascade SPÉCIFIQUE de la fiche, pas du pattern domaine', () => {
  const enriched = {
    fiche: {
      id: 'bail_x_specifique', domaine: 'bail', sousDomaine: 'caution',
      reponse: {
        explication: 'situation spécifique',
        articles: [{ ref: 'CO 257e', titre: 'Garantie' }],
        delais: [{ procedure: 'Libération de la garantie', delai: 'sous 30 jours', consequence: null }]
      },
      cascades: [{
        titre: 'Récupération garantie',
        etapes: [
          { numero: 1, action: 'État des lieux de sortie', description: 'décompte final' },
          { numero: 2, action: 'Courrier de demande de libération', description: 'recommandé' }
        ]
      }]
    },
    patterns: [{ strategieOptimale: ['ÉTAPE GÉNÉRIQUE DOMAINE (ne doit PAS apparaître)'], neJamaisFaire: ['warning domaine'] }],
    delais: [{ domaine: 'bail', procedure: 'Contestation du congé (générique)', delai: '30 jours' }],
    articles: [], jurisprudence: [], templates: [], antiErreurs: [],
    preuves: [], escalade: [], cascades: [], confiance: 'haut', lacunes: []
  };
  const plan = generateActionPlan(enriched, 'VD');
  // étapes = cascade de la fiche
  const actions = plan.etapes.map(e => e.action).join(' | ');
  assert.ok(/État des lieux de sortie/.test(actions), 'étape spécifique fiche attendue');
  assert.ok(!/GÉNÉRIQUE DOMAINE/.test(actions), 'le pattern générique de domaine ne doit PAS être utilisé');
  assert.ok(!/warning domaine/.test(actions), 'le neJamaisFaire de domaine ne doit pas s\'afficher quand la cascade fiche est utilisée');
  // délais = ceux de la fiche
  const procedures = plan.delaisCritiques.map(d => d.procedure).join(' | ');
  assert.ok(/Libération de la garantie/.test(procedures), 'délai spécifique fiche attendu');
  assert.ok(!/Contestation du congé/.test(procedures), 'les délais génériques de domaine ne doivent pas apparaître');
});

test('fiche SANS cascade → fallback sur le pattern de domaine (pas de régression)', () => {
  const enriched = {
    fiche: { id: 'x', domaine: 'bail', reponse: { explication: 'x', articles: [] } },
    patterns: [{ strategieOptimale: ['Étape pattern domaine'] }],
    delais: [{ domaine: 'bail', procedure: 'Délai domaine', delai: '30 jours' }],
    articles: [], jurisprudence: [], templates: [], antiErreurs: [],
    preuves: [], escalade: [], cascades: [], confiance: 'haut', lacunes: []
  };
  const plan = generateActionPlan(enriched, 'VD');
  assert.ok(plan.etapes.some(e => /Étape pattern domaine/.test(e.action)), 'fallback pattern attendu sans cascade fiche');
});
