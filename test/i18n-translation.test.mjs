import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { protectText, restoreProtectedTokens, validateProtectedTokens } from '../src/services/i18n/token-protector.mjs';
import { getCacheEntry } from '../src/services/i18n/translation-cache.mjs';
import {
  computeStringTranslationCacheKey,
  shouldRunQa,
  translateStructuredContent,
  translateTextContent,
  localizeLegalRefs,
  _getPeakTranslationConcurrency,
  _resetPeakTranslationConcurrency
} from '../src/services/i18n/translation-orchestrator.mjs';

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
    // En allemand, la citation "CO 271" est localisée en "OR 271" (Obligationenrecht).
    assert.match(first.fiche.reponse.explication, /OR 271/);
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

  it('ne traduit JAMAIS les champs structurels (icone, couleur) ni les codes hex', async () => {
    // Régression : /api/domaines?lang=de renvoyait icone="Startseite" (au lieu de
    // "home") et, en EN, couleur contenait la prose du LLM ("I cannot translate
    // this input... #f39c12"). Les champs structurels doivent ressortir verbatim.
    const suffix = `chrome-${Date.now()}`;
    const payload = {
      domaines: [
        { id: 'bail', nom: `Logement ${suffix}`, icone: 'home', couleur: '#2ecc71' }
      ]
    };
    const out = await translateStructuredContent(payload, {
      targetLang: 'de',
      sourceLang: 'fr',
      contentType: 'chrome/ui'
    });
    const d = out.domaines[0];
    assert.equal(d.icone, 'home', `icone doit rester verbatim, reçu "${d.icone}"`);
    assert.equal(d.couleur, '#2ecc71', `couleur (hex) doit rester verbatim, reçu "${d.couleur}"`);
    // Contrôle : un champ texte réel EST bien traduit (marqueur [[de]] du fake provider).
    assert.match(d.nom, /\[\[de\]\]/, 'le libellé texte doit, lui, être traduit');
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

  it('localise les durées et applique le glossaire juridique au lieu de laisser du français mêlé', async () => {
    const result = await translateTextContent('Après mise en demeure, vous avez 3 mois et 10 jours.', {
      targetLang: 'en',
      sourceLang: 'fr',
      contentType: 'text',
      domain: 'bail'
    });
    assert.equal(result.display_lang, 'en');
    assert.match(result.translated, /formal notice/);
    assert.match(result.translated, /3 months/);
    assert.match(result.translated, /10 days/);
  });

  it('alimente un cache dédié par chaîne traduite pour le contenu structuré', async () => {
    const suffix = `string-cache-${Date.now()}`;
    const text = `Mon bail ${suffix} reste litigieux.`;
    await translateStructuredContent({
      fiche: {
        reponse: {
          explication: text
        }
      }
    }, {
      targetLang: 'en',
      sourceLang: 'fr',
      contentType: 'structured_legal_content',
      domain: 'bail',
      sourceLastVerified: '2026-04-20'
    });

    const cacheKey = computeStringTranslationCacheKey(text, {
      targetLang: 'en',
      sourceLang: 'fr',
      contentType: 'structured_legal_content',
      domain: 'bail',
      sourceLastVerified: '2026-04-20'
    });
    const entry = getCacheEntry(cacheKey);
    assert.ok(entry);
    assert.match(entry.translated_text, /\[\[en\]\]/);
  });

  it('traduit les payloads structurés avec concurrence bornée au lieu d\'un parcours séquentiel', async () => {
    const previousDelay = process.env.JB_TRANSLATION_FAKE_DELAY_MS;
    const previousConcurrency = process.env.JB_TRANSLATION_MAX_CONCURRENCY;
    process.env.JB_TRANSLATION_FAKE_DELAY_MS = '80';
    process.env.JB_TRANSLATION_MAX_CONCURRENCY = '2';

    try {
      const suffix = `parallel-${Date.now()}`;
      const payload = {
        fiche: {
          reponse: {
            blocs: [
              { texte: `Bloc A ${suffix}` },
              { texte: `Bloc B ${suffix}` },
              { texte: `Bloc C ${suffix}` },
              { texte: `Bloc D ${suffix}` }
            ]
          }
        }
      };

      // Assertion STRUCTURELLE (pas wall-clock) : on mesure le pic de concurrence
      // réellement atteint. 4 blocs avec concurrence max 2 → pic = 2 de façon
      // déterministe (les 2 premiers démarrent, les 2 autres sont mis en queue),
      // quel que soit le timing/charge machine. L'ancienne assertion sur
      // `elapsed < 1800ms` flakait sous charge (faux échec ~1987ms).
      _resetPeakTranslationConcurrency();
      await translateStructuredContent(payload, {
        targetLang: 'de',
        sourceLang: 'fr',
        contentType: 'structured_legal_content',
        domain: 'bail',
        sourceLastVerified: suffix
      });
      const peak = _getPeakTranslationConcurrency();
      // peak ≥ 2 prouve le parallélisme (un parcours séquentiel donnerait peak = 1).
      assert.ok(peak >= 2, `attendu parallélisme (pic ≥ 2), got ${peak} → parcours séquentiel ?`);
      // peak ≤ 2 prouve que la concurrence est bien bornée à JB_TRANSLATION_MAX_CONCURRENCY.
      assert.ok(peak <= 2, `attendu concurrence bornée à 2, pic observé = ${peak}`);
    } finally {
      if (previousDelay === undefined) delete process.env.JB_TRANSLATION_FAKE_DELAY_MS;
      else process.env.JB_TRANSLATION_FAKE_DELAY_MS = previousDelay;
      if (previousConcurrency === undefined) delete process.env.JB_TRANSLATION_MAX_CONCURRENCY;
      else process.env.JB_TRANSLATION_MAX_CONCURRENCY = previousConcurrency;
    }
  });
});

describe('translation orchestrator — fallback provider down', () => {
  // Simule LLM/DeepL indisponible (panne, quota, timeout) via le hook test
  // JB_TRANSLATION_FAKE_THROW. Vérifie que les fonctions ne throw jamais
  // et retournent le contenu source avec translation_status='failed'.

  it('translateTextContent retourne text source + status=failed quand provider throw', async () => {
    process.env.JB_TRANSLATION_FAKE_THROW = '1';
    try {
      // ID unique pour éviter les collisions cache avec d'autres tests
      const sourceText = `Texte source provider-down ${Date.now()}`;
      const result = await translateTextContent(sourceText, {
        targetLang: 'de',
        sourceLang: 'fr',
        contentType: 'text'
      });
      assert.equal(result.translation_status, 'failed',
        `attendu 'failed', reçu '${result.translation_status}'`);
      assert.equal(result.translated, sourceText, 'le texte source doit être renvoyé intact');
      assert.equal(result.display_lang, 'de');
      assert.equal(result.source_lang, 'fr');
      assert.ok(result.translation_error, 'translation_error attendu');
      assert.equal(result.qa_failed, true);
      assert.equal(result.needs_regen, true);
    } finally {
      delete process.env.JB_TRANSLATION_FAKE_THROW;
    }
  });

  it('translateStructuredContent retourne contenu source + status=failed quand provider throw', async () => {
    process.env.JB_TRANSLATION_FAKE_THROW = '1';
    try {
      const suffix = `provider-down-${Date.now()}`;
      const payload = {
        fiche: {
          id: 'test_fallback',
          domaine: 'bail',
          reponse: { explication: `Texte structuré source ${suffix}` }
        }
      };
      const result = await translateStructuredContent(payload, {
        targetLang: 'it',
        sourceLang: 'fr',
        contentType: 'structured_legal_content',
        domain: 'bail'
      });
      assert.equal(result.translation_status, 'failed',
        `attendu 'failed', reçu '${result.translation_status}'`);
      // Le contenu source doit être présent (intact)
      assert.equal(result.fiche.reponse.explication, `Texte structuré source ${suffix}`);
      assert.equal(result.display_lang, 'it');
      assert.equal(result.source_lang, 'fr');
      assert.ok(result.translation_error, 'translation_error attendu');
    } finally {
      delete process.env.JB_TRANSLATION_FAKE_THROW;
    }
  });

  it('court-circuit lang=source : pas d\'appel provider, status=fresh même si THROW activé', async () => {
    process.env.JB_TRANSLATION_FAKE_THROW = '1';
    try {
      const result = await translateTextContent('Hello world', {
        targetLang: 'fr',
        sourceLang: 'fr',
        contentType: 'text'
      });
      // targetLang === sourceLang → pas d'appel provider, doit toujours réussir
      assert.equal(result.translation_status, 'fresh');
      assert.equal(result.translated, 'Hello world');
    } finally {
      delete process.env.JB_TRANSLATION_FAKE_THROW;
    }
  });
});

describe('localizeLegalRefs — abréviations de codes par langue', () => {
  it('DE : art./al. + codes fédéraux localisés dans une citation', () => {
    assert.equal(localizeLegalRefs('art. 256 al. 1 CO', 'de'), 'Art. 256 Abs. 1 OR');
    assert.equal(localizeLegalRefs('CO 271', 'de'), 'OR 271');
    assert.equal(localizeLegalRefs('art. 641 CC', 'de'), 'Art. 641 ZGB');
    assert.equal(localizeLegalRefs('LP 74', 'de'), 'SchKG 74');
  });
  it('IT : LP→LEF, al→cpv, CO reste CO', () => {
    assert.equal(localizeLegalRefs('art. 256 al. 1 CO', 'it'), 'art. 256 cpv. 1 CO');
    assert.equal(localizeLegalRefs('LP 74', 'it'), 'LEF 74');
  });
  it('CPC/CPP ne sont pas cassés par la règle CP', () => {
    assert.equal(localizeLegalRefs('art. 55 CPC', 'de'), 'Art. 55 ZPO');
    assert.equal(localizeLegalRefs('art. 10 CPP', 'de'), 'Art. 10 StPO');
  });
  it('ne touche PAS un texte hors citation ni le français', () => {
    assert.equal(localizeLegalRefs('CO 271', 'fr'), 'CO 271');
    assert.equal(localizeLegalRefs('La société CO2 émet trop', 'de'), 'La société CO2 émet trop');
    assert.equal(localizeLegalRefs('normal alinéa sans code', 'de'), 'normal alinéa sans code');
  });
});

describe('translation QA heuristics', () => {
  it('saute la QA sur les libellés courts mais la garde pour les phrases juridiques', () => {
    assert.equal(shouldRunQa('Source', { contentType: 'chrome/ui' }), false);
    assert.equal(
      shouldRunQa('Le bail peut être résilié selon CO 271 dans un délai de 30 jours.', {
        contentType: 'structured_legal_content',
        keyHint: 'explication'
      }),
      true
    );
  });
});
