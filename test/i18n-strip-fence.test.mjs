/**
 * Régression — strip des fences markdown dans la traduction (2026-05-31).
 * Le LLM enrobait parfois sa sortie HTML dans ```html ... ``` → le fence fuyait
 * dans la page traduite. stripCodeFence doit le retirer, sans abîmer le contenu sain.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripCodeFence } from '../src/services/i18n/providers.mjs';

test('retire un fence ```html englobant', () => {
  assert.equal(stripCodeFence('```html\n<p>Hallo Welt</p>\n```'), '<p>Hallo Welt</p>');
  assert.equal(stripCodeFence('```\n<p>Test</p>\n```'), '<p>Test</p>');
});

test('retire un fence orphelin (sortie tronquée)', () => {
  assert.equal(stripCodeFence('```html\n<p>Anfang'), '<p>Anfang');
  assert.equal(stripCodeFence('<p>Ende</p>\n```'), '<p>Ende</p>');
});

test('laisse intact un contenu sans fence', () => {
  assert.equal(stripCodeFence('<p>Sie haben ein Problem.</p>'), '<p>Sie haben ein Problem.</p>');
  assert.equal(stripCodeFence('Texte simple sans balise'), 'Texte simple sans balise');
});

test('robuste sur entrée non-string', () => {
  assert.equal(stripCodeFence(null), null);
  assert.equal(stripCodeFence(undefined), undefined);
});
