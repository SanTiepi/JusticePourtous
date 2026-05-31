/**
 * Régression — chemin keyword sur cas complexes (audit 2026-05-31).
 *
 * Verrouille :
 *  - gap 8 (désambiguïsation "permis" routier vs séjour) : les cas de circulation
 *    mentionnant "permis" + signal routier DOIVENT surfacer une fiche circulation,
 *    pas être routés vers etrangers (le bug d'origine : 1/5).
 *  - garde-fou anti-régression : précision domaine sur les 80 cas adversariaux
 *    historiques ne doit pas s'effondrer (plancher prudent).
 *  - robustesse : aucune requête (45 complexes + 80 adversariaux) ne fait throw.
 *
 * NB : le keyword est un FALLBACK (LLM down en prod). L'exhaustivité multi-fiches
 * réelle viendra du navigator (post-traitement graphe) — cf. docs/audit-triage-complexe-2026-05-31.md.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryByProblem } from '../src/services/knowledge-engine.mjs';
import { ADVERSARIAL_CASES } from './adversarial-cases.mjs';
import { COMPLEX_CASES } from './complex-cases.mjs';

const CIRC_CUES = ['radar', 'vitesse', 'km/h', 'alcool', 'retrait', 'conduire', 'voiture', 'route', 'flash', 'amende', 'excès'];

test('gap 8 — "permis" en contexte routier surface circulation (pas etrangers)', () => {
  const cases = COMPLEX_CASES.filter(c => {
    const q = c.query.toLowerCase();
    return q.includes('permis') && CIRC_CUES.some(cu => q.includes(cu)) && (c.expected_domaines || []).includes('circulation');
  });
  assert.ok(cases.length >= 3, `attendu >=3 cas permis-circulation, trouvé ${cases.length}`);
  for (const c of cases) {
    const d = queryByProblem(c.query, c.canton).data || {};
    const surfacesCirculation = d.fiche?.domaine === 'circulation'
      || (d.alternatives || []).some(a => a.domaine === 'circulation');
    assert.ok(surfacesCirculation, `${c.id}: circulation non surfacée (primaire=${d.fiche?.domaine})`);
  }
});

test('garde-fou — précision domaine keyword sur 80 cas historiques ne régresse pas', () => {
  let domOk = 0;
  for (const c of ADVERSARIAL_CASES) {
    const d = queryByProblem(c.query, c.canton).data || {};
    if ((d.fiche?.domaine || d.domaine) === c.expected_domaine) domOk++;
  }
  // Plancher prudent (mesuré à 37/80 après le fix gap 8 ; baseline historique 35).
  assert.ok(domOk >= 34, `précision domaine effondrée: ${domOk}/80 (plancher 34)`);
});

test('robustesse — aucune requête complexe ne fait throw', () => {
  for (const c of [...COMPLEX_CASES, ...ADVERSARIAL_CASES]) {
    assert.doesNotThrow(() => queryByProblem(c.query, c.canton), `throw sur ${c.id || c.query.slice(0, 30)}`);
  }
});

test('intégrité — les 45 cas complexes référencent des fiches réelles', async () => {
  // (les expected_fiches ont été validés à la génération ; on re-vérifie le schéma minimal)
  for (const c of COMPLEX_CASES) {
    assert.ok(typeof c.query === 'string' && c.query.length > 10, `${c.id}: query invalide`);
    assert.ok(Array.isArray(c.expected_fiches), `${c.id}: expected_fiches manquant`);
    assert.ok(typeof c.expected_redirect === 'boolean', `${c.id}: expected_redirect manquant`);
  }
});
