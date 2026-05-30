import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Active le fake translator AVANT d'importer l'orchestrateur : le hook de panne
// (JB_TRANSLATION_FAKE_THROW) vit dans le provider FAKE, qui n'est sélectionné que
// si JB_TRANSLATION_FAKE='1' (cf. providers.mjs translateWithPrimaryProviders).
// Sans cette ligne, FAKE_THROW seul est inerte → le provider réel renvoie 'fresh'
// et le test croit à tort que la dégradation ne marche pas (régression 2026-05-30).
process.env.JB_TRANSLATION_FAKE = '1';

import {
  translateStructuredContent,
  translateTextContent
} from '../src/services/i18n/translation-orchestrator.mjs';

// Verrou de robustesse i18n : quand le provider de traduction est indisponible
// (panne / quota / timeout, simulé via le hook JB_TRANSLATION_FAKE_THROW dans
// providers.mjs), les fonctions de traduction ne doivent JAMAIS throw. Elles
// retournent le contenu SOURCE intact avec translation_status='failed'.
// Garantie produit : "i18n bulletproof — jamais de 5xx sur traduction".

describe('i18n fallback robustness — provider down', () => {
  it('translateTextContent (string simple) ne throw pas et renvoie la source + status=failed', async () => {
    const previousThrow = process.env.JB_TRANSLATION_FAKE_THROW;
    process.env.JB_TRANSLATION_FAKE_THROW = '1';
    try {
      const sourceText = `Chaîne source robustesse ${Date.now()}`;
      let result;
      await assert.doesNotReject(async () => {
        result = await translateTextContent(sourceText, {
          targetLang: 'de',
          sourceLang: 'fr',
          contentType: 'text'
        });
      }, 'translateTextContent ne doit jamais rejeter quand le provider est down');

      assert.equal(result.translation_status, 'failed',
        `attendu 'failed', reçu '${result.translation_status}'`);
      assert.equal(result.translated, sourceText, 'le texte source doit être renvoyé intact');
      assert.equal(result.display_lang, 'de');
      assert.equal(result.source_lang, 'fr');
      assert.ok(result.translation_error, 'translation_error attendu comme indicateur de dégradation');
    } finally {
      if (previousThrow === undefined) delete process.env.JB_TRANSLATION_FAKE_THROW;
      else process.env.JB_TRANSLATION_FAKE_THROW = previousThrow;
    }
  });

  it('translateStructuredContent (payload structuré) ne throw pas et renvoie la source + status=failed', async () => {
    const previousThrow = process.env.JB_TRANSLATION_FAKE_THROW;
    process.env.JB_TRANSLATION_FAKE_THROW = '1';
    try {
      const suffix = `robustesse-struct-${Date.now()}`;
      const explication = `Explication source structurée ${suffix}`;
      const payload = {
        fiche: {
          id: 'test_robustness',
          domaine: 'bail',
          reponse: { explication }
        }
      };
      let result;
      await assert.doesNotReject(async () => {
        result = await translateStructuredContent(payload, {
          targetLang: 'it',
          sourceLang: 'fr',
          contentType: 'structured_legal_content',
          domain: 'bail'
        });
      }, 'translateStructuredContent ne doit jamais rejeter quand le provider est down');

      assert.equal(result.translation_status, 'failed',
        `attendu 'failed', reçu '${result.translation_status}'`);
      assert.equal(result.fiche.reponse.explication, explication,
        'le contenu source structuré doit rester intact en fallback');
      assert.equal(result.display_lang, 'it');
      assert.equal(result.source_lang, 'fr');
      assert.ok(result.translation_error, 'translation_error attendu comme indicateur de dégradation');
    } finally {
      if (previousThrow === undefined) delete process.env.JB_TRANSLATION_FAKE_THROW;
      else process.env.JB_TRANSLATION_FAKE_THROW = previousThrow;
    }
  });

  it('translateTextContent (fragment HTML) ne throw pas et renvoie la source + status=failed', async () => {
    const previousThrow = process.env.JB_TRANSLATION_FAKE_THROW;
    process.env.JB_TRANSLATION_FAKE_THROW = '1';
    try {
      const sourceHtml = `<p>Fragment HTML source ${Date.now()} — CO 271 reste exact.</p>`;
      let result;
      await assert.doesNotReject(async () => {
        result = await translateTextContent(sourceHtml, {
          targetLang: 'en',
          sourceLang: 'fr',
          contentType: 'html'
        });
      }, 'translateTextContent (html) ne doit jamais rejeter quand le provider est down');

      assert.equal(result.translation_status, 'failed',
        `attendu 'failed', reçu '${result.translation_status}'`);
      assert.equal(result.translated, sourceHtml, 'le HTML source doit être renvoyé intact');
      assert.equal(result.display_lang, 'en');
      assert.equal(result.source_lang, 'fr');
      assert.ok(result.translation_error, 'translation_error attendu comme indicateur de dégradation');
    } finally {
      if (previousThrow === undefined) delete process.env.JB_TRANSLATION_FAKE_THROW;
      else process.env.JB_TRANSLATION_FAKE_THROW = previousThrow;
    }
  });
});
