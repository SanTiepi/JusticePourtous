/**
 * Régression du FORMAT des lettres (fixes 2026-05-29) — verrouille les 2 helpers
 * de buildSwissLetterFormat :
 *  - stripTrailingSalutation : retire la salutation finale du corps (le path LLM
 *    en ajoute une malgré la consigne, et buildSwissLetterFormat en ajoute une
 *    standard → sans strip, double salutation sur la lettre).
 *  - deriveLieu : déduit la localité depuis une adresse suisse "NPA Localité"
 *    (le formulaire front ne collecte pas le lieu → évitait un "[Localité]" non rempli).
 *
 * Tests unitaires directs sur les helpers = déterministes, sans appel LLM.
 * Nom de fichier sans "letter-gen" pour être inclus dans le subset CI/gate.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { _stripTrailingSalutation, _deriveLieu } from '../src/services/letter-generator.mjs';

describe('letter format helpers — régression (fixes 2026-05-29)', () => {
  it('stripTrailingSalutation retire une salutation finale', () => {
    const corps = 'Madame, Monsieur,\n\nJe forme opposition.\n\nVeuillez agréer, Madame, Monsieur, mes salutations distinguées.';
    const out = _stripTrailingSalutation(corps);
    assert.ok(!/salutations distingu/i.test(out), 'la salutation finale doit être retirée');
    assert.match(out, /Je forme opposition\.$/, 'le corps utile est conservé');
  });

  it('stripTrailingSalutation retire aussi "Dans l\'attente ..." final', () => {
    const corps = 'Texte utile.\n\nDans l\'attente de votre réponse, je vous prie d\'agréer mes salutations distinguées.';
    assert.match(_stripTrailingSalutation(corps), /Texte utile\.$/);
  });

  it('stripTrailingSalutation ne touche pas un corps sans salutation', () => {
    const corps = 'Première ligne.\n\nDernière ligne utile.';
    assert.equal(_stripTrailingSalutation(corps), corps.trim());
  });

  it('deriveLieu extrait la ville d\'une adresse suisse "NPA Localité"', () => {
    assert.equal(_deriveLieu('Avenue de la Gare 12, 1003 Lausanne'), 'Lausanne');
    assert.equal(_deriveLieu('Rue du Centre 5\n1227 Carouge'), 'Carouge');
  });

  it('deriveLieu retourne null si pas de NPA déductible', () => {
    assert.equal(_deriveLieu('sans code postal ni ville'), null);
    assert.equal(_deriveLieu(''), null);
    assert.equal(_deriveLieu(undefined), null);
  });
});
