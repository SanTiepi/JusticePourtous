import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { protectText, restoreProtectedTokens, validateProtectedTokens } from '../src/services/i18n/token-protector.mjs';
import { translateStructuredContent, translateTextContent } from '../src/services/i18n/translation-orchestrator.mjs';

process.env.JB_TRANSLATION_FAKE = '1';

describe('i18n token protector', () => {
  it('protège et restaure articles, montants, dates et placeholders', () => {
    const original = 'CO 271, CHF 1\'200, 2026-04-19 et [DATE] restent intacts.';
    const protectedValue = protectText(original);
    assert.notEqual(protectedValue.text, original);
    const restored = restoreProtectedTokens(protectedValue.text, protectedValue.tokens);
    assert.equal(restored, original);
    const validation = validateProtectedTokens(original, restored, protectedValue.tokens);
    assert.equal(validation.ok, true);
  });
});

describe('translation orchestrator', () => {
  it('traduit un payload structuré et expose les métadonnées attendues', async () => {
    const suffix = `unit-${Date.now()}`;
    const payload = {
      fiche: {
        id: 'bail_defaut_moisissure',
        domaine: 'bail',
        last_verified_at: '2026-04-19',
        reponse: {
          explication: `Mon bail est touché par la moisissure ${suffix}. CO 271 et CHF 100 restent exacts.`,
          articles: [{ ref: 'CO 271', titre: 'Protection contre les résiliations abusives', lien: 'https://www.fedlex.admin.ch' }]
        }
      }
    };

    const first = await translateStructuredContent(payload, {
      targetLang: 'de',
      sourceLang: 'fr',
      contentType: 'structured_legal_content',
      domain: 'bail',
      sourceLastVerified: '2026-04-19'
    });
    assert.equal(first.display_lang, 'de');
    assert.equal(first.source_lang, 'fr');
    assert.ok(['fresh', 'cached'].includes(first.translation_status));
    assert.ok(first.translation_pipeline_version);
    assert.match(first.fiche.reponse.explication, /\[\[de\]\]/);
    assert.match(first.fiche.reponse.explication, /CO 271/);
    assert.match(first.fiche.reponse.explication, /CHF 100/);

    const second = await translateStructuredContent(payload, {
      targetLang: 'de',
      sourceLang: 'fr',
      contentType: 'structured_legal_content',
      domain: 'bail',
      sourceLastVerified: '2026-04-19'
    });
    assert.equal(second.display_lang, 'de');
    assert.equal(second.source_lang, 'fr');
    assert.equal(second.translation_status, 'cached');
  });

  it('traduit un fragment HTML sans perdre les tokens protégés', async () => {
    const result = await translateTextContent('<p>CO 271 [DATE] CHF 200</p>', {
      targetLang: 'it',
      sourceLang: 'fr',
      contentType: 'html'
    });
    assert.equal(result.display_lang, 'it');
    assert.ok(['fresh', 'cached'].includes(result.translation_status));
    assert.match(result.translated, /CO 271/);
    assert.match(result.translated, /\[DATE\]/);
    assert.match(result.translated, /CHF 200/);
  });
});
