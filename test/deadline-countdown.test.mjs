/**
 * Régression — compte-à-rebours des délais péremptoires (2026-05-31).
 * 100% déterministe : extraction de date depuis le texte brut + calcul vs délai de fiche.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractEventDate, parseDelaiJours, buildCountdown } from '../src/services/deadline-countdown.mjs';

const TODAY = new Date(2026, 4, 20); // 20 mai 2026 (mois 0-indexé)
const days = (n) => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return d; };

test('extractEventDate — relatif "il y a N jours/semaines"', () => {
  assert.equal(extractEventDate('reçu il y a 3 jours', TODAY).date.toDateString(), days(3).toDateString());
  assert.equal(extractEventDate('le congé il y a une semaine', TODAY).date.toDateString(), days(7).toDateString());
  assert.equal(extractEventDate('il y a deux semaines', TODAY).date.toDateString(), days(14).toDateString());
});

test('extractEventDate — hier / avant-hier', () => {
  assert.equal(extractEventDate('reçu hier', TODAY).date.toDateString(), days(1).toDateString());
  assert.equal(extractEventDate('avant-hier la régie', TODAY).date.toDateString(), days(2).toDateString());
});

test('extractEventDate — date absolue "le 18 mai" et "18.05.2026"', () => {
  assert.equal(extractEventDate('commandement reçu le 18 mai', TODAY).date.toDateString(), new Date(2026, 4, 18).toDateString());
  assert.equal(extractEventDate('notifié le 18.05.2026', TODAY).date.toDateString(), new Date(2026, 4, 18).toDateString());
});

test('extractEventDate — rien d\'extractible → null', () => {
  assert.equal(extractEventDate('mon propriétaire veut augmenter le loyer', TODAY), null);
  assert.equal(extractEventDate('', TODAY), null);
});

test('parseDelaiJours', () => {
  assert.equal(parseDelaiJours('10 jours dès notification'), 10);
  assert.equal(parseDelaiJours('dans les 30 jours'), 30);
  assert.equal(parseDelaiJours('immédiat à réception'), null);
  assert.equal(parseDelaiJours('3 mois'), 90);
});

const DELAIS = [
  { procedure: 'Opposition au commandement', delai: '10 jours dès notification', peremptoire: true, base_legale: 'LP 74 al. 1' },
  { procedure: 'Conservation des preuves', delai: 'immédiat', peremptoire: false },
];

test('buildCountdown — il reste X jours (délai péremptoire 10j, événement il y a 3j)', () => {
  const c = buildCountdown(DELAIS, 'commandement reçu il y a 3 jours', TODAY);
  assert.ok(c, 'countdown attendu');
  assert.equal(c.jours_restants, 7);
  assert.equal(c.delai_total, 10);
  assert.equal(c.depasse, false);
  assert.equal(c.urgence, 'haute');
});

test('buildCountdown — URGENT (<=3 jours restants)', () => {
  const c = buildCountdown(DELAIS, 'reçu il y a 8 jours', TODAY);
  assert.equal(c.jours_restants, 2);
  assert.equal(c.urgence, 'critique');
});

test('buildCountdown — DÉPASSÉ', () => {
  const c = buildCountdown(DELAIS, 'reçu il y a 40 jours', TODAY);
  assert.equal(c.depasse, true);
  assert.equal(c.urgence, 'depasse');
});

test('buildCountdown — pas de date → null ; pas de délai péremptoire → null', () => {
  assert.equal(buildCountdown(DELAIS, 'mon loyer est trop cher', TODAY), null);
  assert.equal(buildCountdown([{ procedure: 'x', delai: '30 jours', peremptoire: false }], 'reçu il y a 3 jours', TODAY), null);
  assert.equal(buildCountdown([], 'reçu il y a 3 jours', TODAY), null);
});
