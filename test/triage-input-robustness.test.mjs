/**
 * Triage input robustness — verrou anti-5xx sur entrées limites.
 *
 * Objectif : prouver que `triage()` (src/services/triage-engine.mjs) gère
 * GRACIEUSEMENT les entrées hostiles ou dégénérées — jamais de throw, jamais
 * de crash équivalent à un 500. Chaque cas doit renvoyer un objet structuré
 * portant un champ `status` non vide.
 *
 * Mode déterministe : LLM_MOCK=1 (voir src/services/llm-mock.mjs) — posé en
 * tête de fichier AVANT tout import qui touche le navigator. isAvailable()
 * renvoie alors true → on exerce le vrai chemin triageLLM (avec fallback
 * semantic-search quand aucune fiche ne matche).
 *
 * NB sur le champ `status` : l'engine renvoie un `status` NUMÉRIQUE (200/400/
 * 404/500), pas une string — contrairement à la couche HTTP /api/triage qui
 * expose un status string ('ask_questions', 'error', ...). On assert donc que
 * `status` est présent, truthy, et se coerce en string non vide : ça couvre la
 * garantie « réponse structurée, pas de 5xx » quelle que soit la forme.
 */

process.env.LLM_MOCK = '1';

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { triage } from '../src/services/triage-engine.mjs';

/**
 * Exécute un triage et vérifie l'invariant de robustesse :
 *  - n'a pas throw
 *  - renvoie un objet
 *  - porte un `status` non vide (string ou number coercible en string non vide)
 */
async function assertGraceful(label, texte, canton) {
  let result;
  await assert.doesNotReject(
    async () => { result = await triage(texte, canton); },
    `triage ne doit JAMAIS throw — cas: ${label}`
  );
  assert.ok(result && typeof result === 'object',
    `triage doit renvoyer un objet — cas: ${label}`);
  assert.ok('status' in result,
    `le résultat doit porter un champ status — cas: ${label}`);
  const statusStr = String(result.status);
  assert.ok(statusStr.length > 0,
    `status doit être non vide — cas: ${label} (reçu: ${JSON.stringify(result.status)})`);
  assert.ok(result.status,
    `status doit être truthy (jamais 0/'' /null) — cas: ${label}`);
  return result;
}

describe('Triage input robustness — gestion gracieuse des entrées limites', () => {
  it('chaîne vide → réponse structurée, pas de crash', async () => {
    await assertGraceful('chaîne vide', '', 'VD');
  });

  it('espaces seulement → réponse structurée, pas de crash', async () => {
    await assertGraceful('espaces seulement', '   ', 'VD');
  });

  it('très longue chaîne (5000+ caractères) → réponse structurée, pas de crash', async () => {
    const long = 'mon propriétaire refuse de réparer la moisissure. '.repeat(120);
    assert.ok(long.length >= 5000, `fixture trop courte (${long.length})`);
    await assertGraceful('très longue chaîne', long, 'VD');
  });

  it('caractères spéciaux / injection → réponse structurée, pas de crash', async () => {
    const hostile = '<script>alert(1)</script> & {{7*7}} ' + ' ';
    await assertGraceful('injection / caractères spéciaux', hostile, 'VD');
  });

  it('texte non français (anglais) → réponse structurée, pas de crash', async () => {
    await assertGraceful('texte anglais', 'my landlord refuses to fix the mold', 'VD');
  });

  // Régression 2026-05-29 : un `canton` non-string venu d'un body API malformé
  // ({canton:[]}, number, objet) faisait crasher filterContacts → canton.toUpperCase
  // = 500 en prod. Le triage assainit désormais canton à l'entrée (→ null).
  for (const canton of [[], 42, { x: 1 }, '']) {
    it(`canton non-string (${JSON.stringify(canton)}) → gracieux, pas de 500`, async () => {
      const res = await assertGraceful(`canton ${JSON.stringify(canton)}`, 'moisissure à Lausanne depuis 3 mois', canton);
      assert.notEqual(Number(res.status), 500, 'ne doit jamais être un 500');
    });
  }
});
