/**
 * Filet de sécurité high-harm (omissions dangereuses — audit triage 2026-05-31).
 *
 * Garantit qu'une fiche à délai PÉREMPTOIRE à trigger explicite est captée, et — tout aussi
 * important — qu'on ne se déclenche PAS sur des cas de contrôle (précision > rappel : un faux
 * positif = du bruit, et on a justement rejeté l'expansion par graphe pour son bruit).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { highHarmDeadlineHits, HIGH_HARM_TRIGGERS } from '../src/services/high-harm-net.mjs';
import { queryComplete } from '../src/services/knowledge-engine.mjs';

test('les fiches cibles du filet existent réellement', () => {
  for (const t of HIGH_HARM_TRIGGERS) {
    assert.equal(queryComplete(t.fiche).status, 200, `fiche cible introuvable : ${t.fiche}`);
  }
});

test('commandement de payer → garantit dettes_opposition (10j, art. 74 LP)', () => {
  const hits = highHarmDeadlineHits("J'ai reçu un commandement de payer pour une facture déjà réglée.");
  assert.ok(hits.some(h => h.fiche === 'dettes_opposition'));
});

test('décision de renvoi / non-renouvellement de permis → garantit etranger_recours_renvoi', () => {
  assert.ok(highHarmDeadlineHits("Le service de la population m'a envoyé une décision de renvoi.").some(h => h.fiche === 'etranger_recours_renvoi'));
  assert.ok(highHarmDeadlineHits("Ils ne renouvellent pas mon permis B, je dois quitter la Suisse.").some(h => h.fiche === 'etranger_recours_renvoi'));
});

test('PRÉCISION — pas de faux positif sur cas de contrôle', () => {
  // « excès de vitesse » allégué dans un accident ≠ amende radar → ne doit RIEN déclencher.
  assert.equal(highHarmDeadlineHits("J'ai eu un accident de voiture, l'assurance refuse car elle dit que j'ai fait un excès de vitesse.").length, 0);
  // « congé de mon employeur » = licenciement, PAS une résiliation de bail → rien.
  assert.equal(highHarmDeadlineHits("Je viens de recevoir mon congé de mon employeur.").length, 0);
  // Bail générique : aucun trigger péremptoire haute-harm.
  assert.equal(highHarmDeadlineHits("Mon propriétaire ne me rend pas ma garantie de loyer.").length, 0);
  // Vide / non-string → []
  assert.deepEqual(highHarmDeadlineHits(''), []);
  assert.deepEqual(highHarmDeadlineHits(null), []);
  assert.deepEqual(highHarmDeadlineHits(undefined), []);
});

test('multi-problème : « licencié ET commandement de payer » capte l\'opposition', () => {
  const hits = highHarmDeadlineHits("Je viens d'être licencié et en plus j'ai reçu un commandement de payer.");
  assert.ok(hits.some(h => h.fiche === 'dettes_opposition'), 'le 2e problème péremptoire ne doit pas être raté');
});
