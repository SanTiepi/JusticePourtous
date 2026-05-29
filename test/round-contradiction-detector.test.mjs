/**
 * Régression round-contradiction-detector — verrouille le fix "boucle texte libre"
 * (2026-05-29) : adversaire/situation_personnelle étaient dans COMPARABLE_KEYS avec
 * severity 3 (bloquant). Le LLM ré-extrait ces champs texte libre avec un wording
 * légèrement différent à chaque round ("régie" → "Régie immobilier"), ce que la
 * comparaison stricte prenait pour une contradiction → question posée en boucle
 * jusqu'à MAX_ROUNDS, funnel bloqué (détecté en test live 2026-05-29).
 *
 * Fix : ces champs ont été retirés de COMPARABLE_KEYS. Ce fichier verrouille le fix.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectRoundContradictions,
  shouldBlockForContradiction,
  buildContradictionQuestion,
  COMPARABLE_KEYS
} from '../src/services/round-contradiction-detector.mjs';

// ============================================================
// Régression : champs texte libre exclus de COMPARABLE_KEYS
// ============================================================

describe('COMPARABLE_KEYS — champs texte libre exclus (régression boucle)', () => {
  it('adversaire absent de COMPARABLE_KEYS', () => {
    assert.ok(!COMPARABLE_KEYS.includes('adversaire'),
      '"adversaire" ne doit pas être dans COMPARABLE_KEYS (boucle texte libre)');
  });

  it('situation_personnelle absent de COMPARABLE_KEYS', () => {
    assert.ok(!COMPARABLE_KEYS.includes('situation_personnelle'),
      '"situation_personnelle" ne doit pas être dans COMPARABLE_KEYS (boucle texte libre)');
  });

  it('adversaire reformulé entre rounds → aucune contradiction détectée', () => {
    const before = { canton: 'VD', adversaire: 'régie' };
    const after  = { canton: 'VD', adversaire: 'Régie immobilier SA' };
    const contras = detectRoundContradictions(before, after);
    assert.equal(contras.length, 0,
      'reformulation adversaire ne doit pas déclencher de contradiction');
  });

  it('situation_personnelle reformulée entre rounds → aucune contradiction', () => {
    const before = { canton: 'GE', situation_personnelle: 'locataire depuis 3 ans' };
    const after  = { canton: 'GE', situation_personnelle: 'Je suis locataire depuis environ 3 ans' };
    const contras = detectRoundContradictions(before, after);
    assert.equal(contras.length, 0,
      'reformulation situation_personnelle ne doit pas déclencher de contradiction');
  });
});

// ============================================================
// Détection normale sur COMPARABLE_KEYS
// ============================================================

describe('detectRoundContradictions — détection sur champs structurés', () => {
  it('canton changé entre rounds → contradiction severity 3', () => {
    const before = { canton: 'VD' };
    const after  = { canton: 'GE' };
    const contras = detectRoundContradictions(before, after);
    assert.equal(contras.length, 1);
    assert.equal(contras[0].key, 'canton');
    assert.equal(contras[0].severity, 3);
  });

  it('montant_chf changé → contradiction severity 2', () => {
    const before = { montant_chf: 1000 };
    const after  = { montant_chf: 2000 };
    const contras = detectRoundContradictions(before, after);
    assert.equal(contras.length, 1);
    assert.equal(contras[0].key, 'montant_chf');
    assert.equal(contras[0].severity, 2);
  });

  it('nombre_enfants changé → contradiction severity 1', () => {
    const before = { nombre_enfants: 2 };
    const after  = { nombre_enfants: 3 };
    const contras = detectRoundContradictions(before, after);
    assert.equal(contras.length, 1);
    assert.equal(contras[0].key, 'nombre_enfants');
    assert.equal(contras[0].severity, 1);
  });

  it('même valeur (insensible à la casse) → pas de contradiction', () => {
    const before = { canton: 'vd' };
    const after  = { canton: 'VD' };
    const contras = detectRoundContradictions(before, after);
    assert.equal(contras.length, 0, 'même canton en casse différente = pas de contradiction');
  });

  it('valeur absent dans "before" → ajout d\'info, pas contradiction', () => {
    const before = { canton: 'VD' };
    const after  = { canton: 'VD', montant_chf: 500 };
    const contras = detectRoundContradictions(before, after);
    assert.equal(contras.length, 0, 'info nouvelle = pas de contradiction');
  });

  it('valeur absent dans "after" → info supprimée, pas contradiction', () => {
    const before = { canton: 'VD', montant_chf: 500 };
    const after  = { canton: 'VD' };
    const contras = detectRoundContradictions(before, after);
    assert.equal(contras.length, 0, 'info absente après = pas de contradiction');
  });

  it('before null → retourne tableau vide', () => {
    assert.deepEqual(detectRoundContradictions(null, { canton: 'VD' }), []);
  });

  it('after null → retourne tableau vide', () => {
    assert.deepEqual(detectRoundContradictions({ canton: 'VD' }, null), []);
  });

  it('before et after vides → retourne tableau vide', () => {
    assert.deepEqual(detectRoundContradictions({}, {}), []);
  });

  it('contradictions triées par sévérité décroissante', () => {
    const before = { canton: 'VD', montant_chf: 100, nombre_enfants: 1 };
    const after  = { canton: 'GE', montant_chf: 200, nombre_enfants: 2 };
    const contras = detectRoundContradictions(before, after);
    assert.equal(contras.length, 3);
    assert.ok(contras[0].severity >= contras[1].severity,
      'premier = sévérité la plus haute');
    assert.ok(contras[1].severity >= contras[2].severity,
      'ordre sévérité respecté');
  });
});

// ============================================================
// shouldBlockForContradiction — seuil severity >= 2
// ============================================================

describe('shouldBlockForContradiction', () => {
  it('severity 3 → bloque', () => {
    assert.equal(shouldBlockForContradiction([{ severity: 3 }]), true);
  });

  it('severity 2 → bloque', () => {
    assert.equal(shouldBlockForContradiction([{ severity: 2 }]), true);
  });

  it('severity 1 → ne bloque pas', () => {
    assert.equal(shouldBlockForContradiction([{ severity: 1 }]), false);
  });

  it('tableau vide → ne bloque pas', () => {
    assert.equal(shouldBlockForContradiction([]), false);
  });

  it('mix severity 1 et 2 → bloque (severity 2 présente)', () => {
    assert.equal(shouldBlockForContradiction([{ severity: 1 }, { severity: 2 }]), true);
  });
});

// ============================================================
// buildContradictionQuestion — format de la question mono-levée
// ============================================================

describe('buildContradictionQuestion', () => {
  it('génère une question avec id, choix, kind', () => {
    const contras = [{ key: 'canton', before: 'VD', after: 'GE', severity: 3 }];
    const q = buildContradictionQuestion(contras);
    assert.ok(q, 'question non null');
    assert.equal(q.id, 'contradiction_canton');
    assert.equal(q.kind, 'contradiction_resolution');
    assert.equal(q.choix.length, 2);
    assert.equal(q.choix[0].id, 'before');
    assert.equal(q.choix[0].label, 'VD');
    assert.equal(q.choix[1].id, 'after');
    assert.equal(q.choix[1].label, 'GE');
  });

  it('utilise la contradiction de plus haute sévérité (premier dans le tableau)', () => {
    const contras = [
      { key: 'canton',      before: 'VD', after: 'GE', severity: 3 },
      { key: 'montant_chf', before: 100,  after: 200,  severity: 2 }
    ];
    const q = buildContradictionQuestion(contras);
    assert.equal(q.id, 'contradiction_canton', 'question sur le champ le plus sévère');
  });

  it('tableau vide → retourne null', () => {
    assert.equal(buildContradictionQuestion([]), null);
  });

  it('question mentionne les deux valeurs dans le texte', () => {
    const contras = [{ key: 'canton', before: 'VD', after: 'GE', severity: 3 }];
    const q = buildContradictionQuestion(contras);
    assert.ok(q.question.includes('VD'), 'valeur before dans la question');
    assert.ok(q.question.includes('GE'), 'valeur after dans la question');
  });
});
