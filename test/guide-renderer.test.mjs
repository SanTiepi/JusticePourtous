/**
 * Tests unitaires + intégration pour guide-renderer.mjs
 *
 * Couvre :
 *  - escapeHtml : prévention XSS (sécurité critique)
 *  - truncate : coupure mot/caractère, normalisation espaces
 *  - extractDelais : extraction depuis cascades imbriquées, cap 6
 *  - extractArticles : extraction depuis reponse.articles, cap 8
 *  - renderGuideForLocale : slug invalide → null, fr → html + model + fresh
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderGuideForLocale, _internals } from '../src/services/guide-renderer.mjs';

const { escapeHtml, truncate, extractDelais, extractArticles } = _internals;

// ============================================================
// escapeHtml — prévention XSS
// ============================================================

describe('escapeHtml — prévention XSS', () => {
  it('null → chaîne vide', () => {
    assert.equal(escapeHtml(null), '');
  });

  it('undefined → chaîne vide', () => {
    assert.equal(escapeHtml(undefined), '');
  });

  it('chaîne vide → chaîne vide', () => {
    assert.equal(escapeHtml(''), '');
  });

  it('échappe < et >', () => {
    assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
  });

  it('échappe une balise script complète', () => {
    const input = "<script>alert('xss')</script>";
    const out = escapeHtml(input);
    assert.ok(!out.includes('<script>'), 'pas de <script> brut');
    assert.ok(!out.includes('</script>'), 'pas de </script> brut');
    assert.ok(out.includes('&lt;script&gt;'));
  });

  it('échappe &', () => {
    assert.equal(escapeHtml('A&B'), 'A&amp;B');
  });

  it('échappe les guillemets doubles', () => {
    assert.equal(escapeHtml('"test"'), '&quot;test&quot;');
  });

  it('échappe les guillemets simples', () => {
    assert.equal(escapeHtml("it's"), "it&#39;s");
  });

  it('coerce un nombre en string (pas de crash)', () => {
    assert.equal(escapeHtml(42), '42');
  });

  it('chaîne sans caractère spécial → inchangée', () => {
    assert.equal(escapeHtml('bonjour monde'), 'bonjour monde');
  });

  it('combinaison : attribut HTML dangereux', () => {
    const input = '" onmouseover="alert(1)"';
    const out = escapeHtml(input);
    assert.ok(!out.includes('"'), 'pas de guillemet double brut (sauf entités)');
    assert.ok(out.includes('&quot;'));
  });
});

// ============================================================
// truncate — découpe propre à la limite
// ============================================================

describe('truncate — découpe propre', () => {
  it('null → chaîne vide', () => {
    assert.equal(truncate(null, 50), '');
  });

  it('undefined → chaîne vide', () => {
    assert.equal(truncate(undefined, 50), '');
  });

  it('chaîne plus courte que max → inchangée', () => {
    assert.equal(truncate('court', 50), 'court');
  });

  it('chaîne exactement égale à max → inchangée', () => {
    const s = 'a'.repeat(10);
    assert.equal(truncate(s, 10), s);
  });

  it('chaîne plus longue → coupe au dernier espace si possible', () => {
    const input = 'Un exemple assez long pour être tronqué ici correctement';
    const out = truncate(input, 20);
    assert.ok(out.length <= 20, `longueur ${out.length} > 20`);
    assert.ok(out.endsWith('…'), 'doit finir par …');
    assert.ok(!out.includes('\n'), 'pas de saut de ligne');
  });

  it('chaîne sans espace → tronquée brutalement', () => {
    const input = 'a'.repeat(30);
    const out = truncate(input, 10);
    assert.ok(out.endsWith('…'));
    assert.ok(out.length <= 10);
  });

  it('espaces multiples normalisés avant truncation', () => {
    const input = 'mot1   mot2   mot3';
    const out = truncate(input, 50);
    assert.ok(!out.includes('   '), 'pas de triple espace résiduel');
  });

  it('chaîne de 1 caractère < max → retournée telle quelle', () => {
    assert.equal(truncate('x', 5), 'x');
  });
});

// ============================================================
// extractDelais — extraction depuis fiche.cascades
// ============================================================

describe('extractDelais — extraction cascades', () => {
  it('fiche null → tableau vide', () => {
    assert.deepEqual(extractDelais(null), []);
  });

  it('fiche sans cascades → tableau vide', () => {
    assert.deepEqual(extractDelais({}), []);
  });

  it('fiche avec cascades sans delai → tableau vide', () => {
    const fiche = {
      cascades: [{ etapes: [{ action: 'faire X', base_legale: 'CO 1' }] }]
    };
    assert.deepEqual(extractDelais(fiche), []);
  });

  it('extrait délais des étapes correctement', () => {
    const fiche = {
      cascades: [{
        etapes: [
          { action: 'Envoyer courrier', delai: '10 jours', base_legale: 'CO 259d' },
          { action: 'Saisir autorité', delai: '30 jours' }
        ]
      }]
    };
    const out = extractDelais(fiche);
    assert.equal(out.length, 2);
    assert.equal(out[0].action, 'Envoyer courrier');
    assert.equal(out[0].delai, '10 jours');
    assert.equal(out[0].base_legale, 'CO 259d');
    assert.equal(out[1].base_legale, null);
  });

  it('cap à 6 éléments même si plus de 6 étapes', () => {
    const etapes = Array.from({ length: 10 }, (_, i) => ({
      action: `action ${i}`,
      delai: `${i + 1} jours`
    }));
    const fiche = { cascades: [{ etapes }] };
    assert.equal(extractDelais(fiche).length, 6);
  });

  it('plusieurs cascades → étapes agrégées dans l\'ordre', () => {
    const fiche = {
      cascades: [
        { etapes: [{ action: 'A', delai: '5 jours' }] },
        { etapes: [{ action: 'B', delai: '10 jours' }] }
      ]
    };
    const out = extractDelais(fiche);
    assert.equal(out.length, 2);
    assert.equal(out[0].action, 'A');
    assert.equal(out[1].action, 'B');
  });
});

// ============================================================
// extractArticles — extraction depuis fiche.reponse.articles
// ============================================================

describe('extractArticles — extraction articles', () => {
  it('fiche null → tableau vide', () => {
    assert.deepEqual(extractArticles(null), []);
  });

  it('fiche sans reponse → tableau vide', () => {
    assert.deepEqual(extractArticles({}), []);
  });

  it('fiche sans articles → tableau vide', () => {
    assert.deepEqual(extractArticles({ reponse: {} }), []);
  });

  it('extrait ref, titre, lien correctement', () => {
    const fiche = {
      reponse: {
        articles: [
          { ref: 'CO 259d', titre: 'Défauts', lien: 'https://fedlex.ch/123' },
          { ref: 'CC 641', titre: 'Propriété' }
        ]
      }
    };
    const out = extractArticles(fiche);
    assert.equal(out.length, 2);
    assert.equal(out[0].ref, 'CO 259d');
    assert.equal(out[0].titre, 'Défauts');
    assert.equal(out[0].lien, 'https://fedlex.ch/123');
    assert.equal(out[1].lien, null);
  });

  it('cap à 8 articles', () => {
    const articles = Array.from({ length: 12 }, (_, i) => ({ ref: `CO ${i}`, titre: `Art ${i}` }));
    const fiche = { reponse: { articles } };
    assert.equal(extractArticles(fiche).length, 8);
  });

  it('article sans ref ni titre → champs vides (pas de crash)', () => {
    const fiche = { reponse: { articles: [{}] } };
    const out = extractArticles(fiche);
    assert.equal(out.length, 1);
    assert.equal(out[0].ref, '');
    assert.equal(out[0].titre, '');
    assert.equal(out[0].lien, null);
  });
});

// ============================================================
// renderGuideForLocale — intégration
// ============================================================

describe('renderGuideForLocale — intégration FR', () => {
  it('slug invalide → null', async () => {
    const result = await renderGuideForLocale('slug_qui_nexiste_pas_du_tout', 'fr');
    assert.equal(result, null);
  });

  it('slug valide + locale fr → { html, model, translation_status: fresh }', async () => {
    const result = await renderGuideForLocale('accident_casco_refus', 'fr');
    assert.ok(result !== null, 'résultat non null');
    assert.ok(typeof result.html === 'string', 'html est une string');
    assert.ok(result.html.length > 100, 'html non vide');
    assert.equal(result.translation_status, 'fresh');
    assert.ok(result.model && typeof result.model === 'object', 'model présent');
  });

  it('HTML contient DOCTYPE, lang="fr", meta charset UTF-8', async () => {
    const result = await renderGuideForLocale('accident_casco_refus', 'fr');
    const html = result.html;
    assert.ok(html.startsWith('<!DOCTYPE html>'), 'doit commencer par DOCTYPE');
    assert.ok(html.includes('lang="fr"'), 'doit avoir lang="fr"');
    assert.ok(html.includes('charset="UTF-8"'), 'charset UTF-8 requis');
  });

  it('HTML contient un lien canonique absolu', async () => {
    const result = await renderGuideForLocale('accident_casco_refus', 'fr');
    assert.ok(result.html.includes('<link rel="canonical"'), 'lien canonique présent');
    assert.ok(result.html.includes('https://justicepourtous.ch'), 'URL de base présente');
  });

  it('HTML contient une balise <h1>', async () => {
    const result = await renderGuideForLocale('accident_casco_refus', 'fr');
    assert.ok(result.html.includes('<h1'), 'doit contenir un h1');
  });

  it('HTML contient meta description non vide', async () => {
    const result = await renderGuideForLocale('accident_casco_refus', 'fr');
    const match = result.html.match(/<meta name="description" content="([^"]+)"/);
    assert.ok(match, 'meta description présente');
    assert.ok(match[1].length > 5, 'description non vide');
  });

  it('HTML est XSS-safe : pas de balise <script> exécutable (JSON-LD autorisé)', async () => {
    const result = await renderGuideForLocale('accident_casco_refus', 'fr');
    const scriptTags = (result.html.match(/<script[^>]*>/gi) || []);
    // JSON-LD (application/ld+json) est inerte (non exécuté par le navigateur) et
    // standard pour les données structurées SEO : on l'autorise, on interdit le reste.
    const execScripts = scriptTags.filter((t) => !/application\/ld\+json/i.test(t));
    assert.equal(execScripts.length, 0, 'aucune balise <script> exécutable dans le HTML généré');
  });

  it('model contient slug, locale, canonical, title', async () => {
    const result = await renderGuideForLocale('accident_casco_refus', 'fr');
    const m = result.model;
    assert.equal(m.locale, 'fr');
    assert.equal(m.slug, 'accident_casco_refus');
    assert.ok(typeof m.canonical === 'string' && m.canonical.startsWith('https://'));
    assert.ok(typeof m.title === 'string' && m.title.includes('JusticePourtous'));
  });
});
