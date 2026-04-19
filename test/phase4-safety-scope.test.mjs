import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  classifySafety,
  buildSafetyResponse,
  buildLogEntry,
  SIGNAL_TYPES,
  ACTIONS
} from '../src/services/safety-classifier.mjs';

import { analyzeScope, ALLOWED_DOMAINS } from '../src/services/scope-refuser.mjs';

// ============================================================
// safety-classifier
// ============================================================

describe('safety-classifier — détection signaux', () => {
  it('détresse : "je veux en finir" → detresse + actions 143/144', () => {
    const r = classifySafety('je veux en finir, j\'ai plus la force');
    assert.equal(r.triggered, true);
    assert.equal(r.signal_type, SIGNAL_TYPES.DETRESSE);
    assert.ok(r.actions.includes(ACTIONS.URGENCE_143));
  });

  it('détresse : "me tuer" → detresse', () => {
    const r = classifySafety('je pense à me tuer');
    assert.equal(r.signal_type, SIGNAL_TYPES.DETRESSE);
  });

  it('violence : "il me frappe" → violence_domestique + LAVI', () => {
    const r = classifySafety('mon mari il me frappe depuis des mois');
    assert.equal(r.signal_type, SIGNAL_TYPES.VIOLENCE);
    assert.ok(r.actions.includes(ACTIONS.LAVI));
  });

  it('violence : "peur de rentrer chez moi" → violence', () => {
    const r = classifySafety('j\'ai peur de rentrer chez moi le soir');
    assert.equal(r.signal_type, SIGNAL_TYPES.VIOLENCE);
  });

  it('menace : "je vais le tuer" → menace_tiers + refus', () => {
    const r = classifySafety('mon voisin me rend fou, je vais le tuer');
    assert.equal(r.signal_type, SIGNAL_TYPES.MENACE);
    assert.ok(r.actions.includes(ACTIONS.REFUS));
  });

  it('mineur : "j\'ai 14 ans" → mineur', () => {
    const r = classifySafety('j\'ai 14 ans et mon père m\'empêche de voir ma mère');
    assert.equal(r.signal_type, SIGNAL_TYPES.MINEUR);
  });

  it('mineur : "j\'ai 25 ans" → PAS déclenché (age check)', () => {
    const r = classifySafety('j\'ai 25 ans et j\'ai un souci avec mon bail');
    assert.equal(r.triggered, false);
  });

  it('illegal_intent : "fraude" → illegal + refus', () => {
    const r = classifySafety('je veux frauder mes impôts');
    assert.equal(r.signal_type, SIGNAL_TYPES.ILLEGAL_INTENT);
  });

  it('texte normal = pas de trigger', () => {
    const r = classifySafety('j\'ai un problème de bail avec mon propriétaire');
    assert.equal(r.triggered, false);
  });

  it('priorité : détresse > violence si les deux signaux présents', () => {
    const r = classifySafety('il me frappe et je veux en finir');
    assert.equal(r.signal_type, SIGNAL_TYPES.DETRESSE);
  });
});

describe('safety-classifier — log entries whitelist-only', () => {
  it('log ne contient QUE les 5 champs autorisés', () => {
    const r = classifySafety('je veux en finir');
    const log = r.log_entry;
    const allowedKeys = new Set(['timestamp', 'signal_type', 'language', 'action_taken', 'round_number']);
    for (const k of Object.keys(log)) {
      assert.ok(allowedKeys.has(k), `clé ${k} non autorisée dans whitelist safety`);
    }
    assert.equal(Object.keys(log).length, 5);
  });

  it('log ne contient AUCUN verbatim utilisateur', () => {
    const text = 'je veux en finir, mon nom est Jean Dupont à Lausanne';
    const r = classifySafety(text);
    const logStr = JSON.stringify(r.log_entry);
    assert.ok(!logStr.includes('Jean'));
    assert.ok(!logStr.includes('Dupont'));
    assert.ok(!logStr.includes('Lausanne'));
    assert.ok(!logStr.includes('finir'));
  });

  it('timestamp arrondi à l\'heure (minutes/secondes = 0)', () => {
    const r = classifySafety('je veux en finir');
    const d = new Date(r.log_entry.timestamp);
    assert.equal(d.getMinutes(), 0);
    assert.equal(d.getSeconds(), 0);
  });

  it('buildLogEntry construit le même shape', () => {
    const log = buildLogEntry({
      signal_type: SIGNAL_TYPES.VIOLENCE,
      language: 'fr',
      action_taken: ACTIONS.LAVI,
      round_number: 1
    });
    assert.equal(log.signal_type, SIGNAL_TYPES.VIOLENCE);
    assert.equal(log.language, 'fr');
    assert.equal(log.action_taken, ACTIONS.LAVI);
    assert.equal(log.round_number, 1);
  });
});

describe('safety-classifier — réponses', () => {
  it('détresse : resources 143/144/147 + can_continue_later', () => {
    const r = buildSafetyResponse(SIGNAL_TYPES.DETRESSE);
    assert.equal(r.priority, 'critical');
    assert.ok(r.resources.some(x => x.phone === '143'));
    assert.equal(r.can_continue_later, true);
  });

  it('violence : discreet_mode + clear_history_available', () => {
    const r = buildSafetyResponse(SIGNAL_TYPES.VIOLENCE);
    assert.equal(r.discreet_mode, true);
    assert.equal(r.clear_history_available, true);
    assert.ok(r.resources.some(x => x.phone === '117'));
  });

  it('mineur : adapted_language', () => {
    const r = buildSafetyResponse(SIGNAL_TYPES.MINEUR);
    assert.equal(r.adapted_language, true);
    assert.ok(r.resources.some(x => x.phone === '147'));
  });

  it('menace : refus net sans resources', () => {
    const r = buildSafetyResponse(SIGNAL_TYPES.MENACE);
    assert.equal(r.type, 'safety_refusal');
    assert.match(r.message, /117/);
  });

  it('illegal_intent : refus constructif', () => {
    const r = buildSafetyResponse(SIGNAL_TYPES.ILLEGAL_INTENT);
    assert.equal(r.type, 'constructive_refusal');
    assert.match(r.message, /légal/);
  });
});

// ============================================================
// scope-refuser
// ============================================================

describe('scope-refuser — tier humain', () => {
  it('recours TF → human_tier_redirect', () => {
    const r = analyzeScope('je veux faire un recours au tribunal fédéral');
    assert.equal(r.is_human_tier, true);
    assert.equal(r.reason, 'recours_tf');
    assert.equal(r.response.type, 'human_tier_redirect');
  });

  it('pénal grave (meurtre) → human_tier', () => {
    const r = analyzeScope('mon frère est accusé de meurtre');
    assert.equal(r.is_human_tier, true);
    assert.equal(r.reason, 'penal_grave');
  });

  it('constitutionnel → human_tier', () => {
    const r = analyzeScope('je veux contester la constitutionnalité d\'une loi');
    assert.equal(r.is_human_tier, true);
    assert.equal(r.reason, 'constitutionnel');
  });

  it('réponse tier humain inclut 3 ressources', () => {
    const r = analyzeScope('recours au tribunal fédéral');
    assert.equal(r.response.resources.length, 3);
    assert.ok(r.response.resources.some(x => x.name.includes('avocat')));
  });
});

describe('scope-refuser — hors scope', () => {
  it('succession (pattern héritage) → out_of_scope', () => {
    const r = analyzeScope('j\'ai hérité d\'une maison de ma grand-mère');
    assert.equal(r.is_out_of_scope, true);
    assert.equal(r.reason, 'succession');
  });

  it('testament → out_of_scope succession', () => {
    const r = analyzeScope('comment contester un testament ?');
    assert.equal(r.is_out_of_scope, true);
  });

  it('brevet → out_of_scope propriete_intellectuelle', () => {
    const r = analyzeScope('on a copié mon brevet');
    assert.equal(r.is_out_of_scope, true);
    assert.equal(r.reason, 'propriete_intellectuelle');
  });

  it('déclaration impôts → out_of_scope fiscal', () => {
    const r = analyzeScope('je comprends pas ma déclaration d\'impôts');
    assert.equal(r.is_out_of_scope, true);
    assert.equal(r.reason, 'fiscal');
  });

  it('bail (dans scope) → pas out_of_scope', () => {
    const r = analyzeScope('mon bail a de la moisissure');
    assert.equal(r.is_out_of_scope, false);
    assert.equal(r.is_human_tier, false);
  });

  it('domaine non whitelist fourni en primary → out_of_scope', () => {
    const r = analyzeScope('quelque chose', 'adoption');
    assert.equal(r.is_out_of_scope, true);
    assert.match(r.reason, /domain_not_allowed/);
  });

  it('domaine whitelist fourni en primary → pas out_of_scope', () => {
    const r = analyzeScope('quelque chose', 'bail');
    assert.equal(r.is_out_of_scope, false);
  });

  it('réponse out_of_scope inclut redirect_to et priorité normale', () => {
    const r = analyzeScope('succession de mon père');
    assert.equal(r.response.priority, 'normal');
    assert.ok(Array.isArray(r.response.redirect_to));
    assert.ok(r.response.redirect_to.length >= 1);
  });
});

describe('scope-refuser — whitelist 10 domaines', () => {
  it('liste les 10 domaines officiels exactement', () => {
    const expected = new Set([
      'bail', 'travail', 'famille', 'dettes', 'etrangers',
      'assurances', 'social', 'violence', 'accident', 'entreprise'
    ]);
    assert.equal(ALLOWED_DOMAINS.size, 10);
    for (const d of expected) assert.ok(ALLOWED_DOMAINS.has(d), `${d} manquant`);
  });
});
