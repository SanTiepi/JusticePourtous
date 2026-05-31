/**
 * Régression — résolution tolérante d'ID de fiche (audit 2026-05-31, gap 14).
 *
 * Le corpus est incohérent sur le préfixe singulier/pluriel (succession_/successions_,
 * etranger_/etrangers_). Le navigator émettait parfois le mauvais préfixe → fiche DROPPÉE.
 * resolveFicheId doit récupérer l'ID via swap de préfixe, sans jamais inventer de fiche.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveFicheId, CATALOG_TEXT } from '../src/services/llm-navigator.mjs';

const validIds = new Set(CATALOG_TEXT.split('\n').map(l => l.split(' ')[0]).filter(Boolean));

test('ID exact valide → renvoyé tel quel', () => {
  const real = [...validIds][0];
  assert.equal(resolveFicheId(real, validIds), real);
});

test('alias singulier↔pluriel résout vers l\'ID réel existant', () => {
  // On choisit dynamiquement un ID réel d'un namespace concerné et on teste le swap inverse.
  const succPlural = [...validIds].find(id => id.startsWith('successions_'));
  const succSingular = [...validIds].find(id => id.startsWith('succession_'));
  if (succPlural) {
    const wrong = succPlural.replace(/^successions_/, 'succession_');
    if (!validIds.has(wrong)) assert.equal(resolveFicheId(wrong, validIds), succPlural);
  }
  if (succSingular) {
    const wrong = succSingular.replace(/^succession_/, 'successions_');
    if (!validIds.has(wrong)) assert.equal(resolveFicheId(wrong, validIds), succSingular);
  }
  const etrSingular = [...validIds].find(id => id.startsWith('etranger_'));
  if (etrSingular) {
    const wrong = etrSingular.replace(/^etranger_/, 'etrangers_');
    if (!validIds.has(wrong)) assert.equal(resolveFicheId(wrong, validIds), etrSingular);
  }
});

test('ID totalement inexistant → null (jamais inventer)', () => {
  assert.equal(resolveFicheId('fiche_qui_nexiste_pas_du_tout', validIds), null);
  assert.equal(resolveFicheId('successions_invente_xyz', validIds), null);
  assert.equal(resolveFicheId(null, validIds), null);
  assert.equal(resolveFicheId(42, validIds), null);
});
