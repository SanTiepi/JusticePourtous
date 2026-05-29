/**
 * Régression du FORMAT des lettres (fixes 2026-05-29) — verrouille les 2 helpers
 * de buildSwissLetterFormat :
 *  - stripTrailingSalutation : retire la salutation finale du corps (le path LLM
 *    en ajoute une malgré la consigne, et buildSwissLetterFormat en ajoute une
 *    standard → sans strip, double salutation sur la lettre).
 *  - deriveLieu : déduit la localité depuis une adresse suisse "NPA Localité"
 *    (le formulaire front ne collecte pas le lieu → évitait un "[Localité]" non rempli).
 *
 * Régression GROUNDING (2026-05-29) — verrouille que les faits du cas fournis par
 * l'utilisateur (nom, adresse, description) apparaissent dans la lettre générée
 * et qu'aucun placeholder ne reste en mode template (sans API key).
 *
 * Tests unitaires directs sur les helpers = déterministes, sans appel LLM.
 * Nom de fichier sans "letter-gen" pour être inclus dans le subset CI/gate.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { _stripTrailingSalutation, _deriveLieu, generateLetter } from '../src/services/letter-generator.mjs';

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

// Grounding tests — force template mode (pas d'API key)
describe('generateLetter — grounding des faits du cas (mode template)', () => {
  let savedApiKey;

  before(() => {
    savedApiKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  after(() => {
    if (savedApiKey !== undefined) process.env.ANTHROPIC_API_KEY = savedApiKey;
  });

  it('nom fourni → apparaît dans l\'en-tête et la signature', async () => {
    const { lettre } = await generateLetter({
      ficheId: 'accident_circulation_roles_assurances',
      type: 'mise_en_demeure',
      userContext: { nom: 'Sophie Favre', adresse: 'Rue du Lac 1, 1400 Yverdon' }
    });
    const count = (lettre.match(/Sophie Favre/g) || []).length;
    assert.ok(count >= 2, `"Sophie Favre" doit apparaître ≥2× (en-tête + signature) — trouvé ${count}×`);
    assert.ok(!/\[Votre nom\]/i.test(lettre), 'aucun placeholder [Votre nom] ne doit rester');
  });

  it('adresse fournie → apparaît dans l\'en-tête', async () => {
    const { lettre } = await generateLetter({
      ficheId: 'accident_circulation_roles_assurances',
      type: 'mise_en_demeure',
      userContext: { nom: 'Test', adresse: 'Avenue de la Gare 42, 2000 Neuchâtel' }
    });
    assert.ok(lettre.includes('Avenue de la Gare 42'), 'adresse complète doit être dans la lettre');
  });

  it('description fournie (chemin générique, sans template fiche) → apparaît dans le corps', async () => {
    const desc = 'Mon véhicule a été percuté par arrière le 10 mai 2026 à Sion.';
    const { lettre } = await generateLetter({
      ficheId: 'accident_circulation_roles_assurances',
      type: 'mise_en_demeure',
      userContext: { nom: 'Test', description: desc }
    });
    assert.ok(lettre.includes(desc), 'la description doit apparaître mot pour mot dans le corps');
    assert.ok(!lettre.includes('[Description de votre situation]'), 'le placeholder générique ne doit pas rester');
  });

  it('description fournie (fiche avec placeholder [description]) → injectée dans le template', async () => {
    const desc = 'Je me suis blessé à l\'épaule en tombant d\'une échelle le 3 avril 2026.';
    const { lettre } = await generateLetter({
      ficheId: 'assurance_laa_employeur_declaration',
      type: 'mise_en_demeure',
      userContext: { nom: 'Marc Lebrun', description: desc }
    });
    assert.ok(lettre.includes(desc), 'la description doit remplacer le placeholder [description]');
    assert.ok(!lettre.includes('[description]'), 'le placeholder [description] ne doit plus être présent');
  });

  it('userContext vide → pas de crash, placeholders gracieux', async () => {
    const { lettre, mode } = await generateLetter({
      ficheId: 'accident_circulation_roles_assurances',
      type: 'mise_en_demeure',
      userContext: {}
    });
    assert.equal(mode, 'template', 'doit rester en mode template');
    assert.ok(typeof lettre === 'string' && lettre.length > 100, 'doit retourner une lettre non vide');
  });

  it('lieu déduit du NPA si non fourni → apparaît dans la ligne date', async () => {
    const { lettre } = await generateLetter({
      ficheId: 'accident_circulation_roles_assurances',
      type: 'mise_en_demeure',
      userContext: { nom: 'Test', adresse: 'Chemin du Moulin 7, 1680 Romont' }
    });
    assert.ok(/Romont, le \d+/.test(lettre), 'la localité Romont doit être déduite du NPA et figurer dans la ligne date');
  });
});
