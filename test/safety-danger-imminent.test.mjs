/**
 * Régression sécurité — danger imminent par un tiers (audit 2026-05-31, gap 4).
 *
 * Une menace de mort à la 3e personne ("il va nous tuer") ou une arme aux mains d'un
 * agresseur ("il a un couteau") DOIT déclencher le court-circuit safety (→ 117), pas
 * router vers une fiche. Cas réel constaté en prod avant le fix.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySafety, SIGNAL_TYPES } from '../src/services/safety-classifier.mjs';

const DOIT_DECLENCHER = [
  'Mon mari devient fou il a un couteau il dit qu il va nous tuer moi et les enfants j ai verrouillé la porte',
  'Il va me tuer je suis sûre il me l a dit',
  'Mon ex menace de me tuer si je porte plainte',
  'Mon voisin a sorti un fusil et le pointe sur moi',
  'Il me menace avec un couteau',
  'Quelqu un veut nous égorger',
];

const NE_DOIT_PAS_DECLENCHER = [
  'Mon propriétaire veut augmenter mon loyer de 200 francs',
  'Mon patron va me licencier la semaine prochaine',
  'J ai un permis pour mon arme à feu de chasse, comment le renouveler ?',
  'Mon employeur menace de ne pas me payer mon salaire',
  'Je veux contester une amende de vitesse',
];

test('danger imminent par un tiers → safety déclenché (violence/détresse)', () => {
  for (const txt of DOIT_DECLENCHER) {
    const r = classifySafety(txt);
    assert.ok(r.triggered, `NON déclenché (DANGER manqué) : "${txt.slice(0, 50)}…"`);
    assert.ok(
      [SIGNAL_TYPES.VIOLENCE, SIGNAL_TYPES.DETRESSE, SIGNAL_TYPES.MENACE].includes(r.signal_type),
      `signal inattendu (${r.signal_type}) pour "${txt.slice(0, 40)}…"`
    );
  }
});

test('faux positifs évités (loyer, licenciement, arme de chasse légale, salaire, amende)', () => {
  for (const txt of NE_DOIT_PAS_DECLENCHER) {
    const r = classifySafety(txt);
    assert.equal(r.triggered, false, `FAUX POSITIF safety : "${txt.slice(0, 50)}…" (signal ${r.signal_type})`);
  }
});
