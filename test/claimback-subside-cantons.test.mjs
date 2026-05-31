/**
 * Régression — subside d'assurance-maladie enrichi par canton (GE/ZH/BE), 2026.
 *
 * VD = calcul exact (arrêté officiel). GE/ZH/BE = signal ENRICHI : base de revenu
 * cantonale explicite + seuils indicatifs sourcés + calculateur officiel. Jamais de
 * fausse précision (chaque canton a sa propre base de revenu et sa formule).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { subsideNational, buildBilan, listCantons } from '../src/services/claimback.mjs';

test('couverture nationale : les 26 cantons ont calcul_exact ou signal_enrichi sourcé', () => {
  for (const { code } of listCantons()) {
    const r = subsideNational(code, {});
    assert.ok(['calcul_exact', 'signal_enrichi'].includes(r.mode), `${code}: mode ${r.mode} (attendu calcul_exact/signal_enrichi)`);
    assert.ok(r.calculateur_officiel || r.subside_url, `${code}: lien officiel manquant`);
  }
});

test('VD reste en calcul exact', () => {
  assert.equal(subsideNational('VD', { categorie: 'adulte_seul', revenu_net: 40000 }).mode, 'calcul_exact');
});

test('GE/ZH/BE → signal enrichi sourcé (base de revenu + calculateur officiel)', () => {
  const expected = {
    GE: { host: 'ge.ch', base: /RDU/i },
    ZH: { host: 'svazurich.ch', base: /Einkommen|déterminant ajusté/i },
    BE: { host: 'asv.dij.be.ch', base: /imposable|steuerbares/i },
    VS: { host: 'vs.ch', base: /déterminant/i },
    FR: { host: 'fr.ch', base: /déterminant/i },
    NE: { host: 'ne.ch', base: /déterminant|fiscal/i },
    JU: { host: 'jura.ch', base: /RDU|déterminant/i },
  };
  for (const [canton, exp] of Object.entries(expected)) {
    const r = subsideNational(canton, {});
    assert.equal(r.mode, 'signal_enrichi', `${canton}: pas signal_enrichi`);
    assert.equal(r.indicatif, true, `${canton}: doit être indicatif`);
    assert.ok(r.calculateur_officiel?.includes(exp.host), `${canton}: lien officiel attendu (${exp.host}), reçu ${r.calculateur_officiel}`);
    assert.match(r.base_revenu || '', exp.base, `${canton}: base de revenu incorrecte`);
    assert.match(r.avertissement || '', /indicative/i, `${canton}: doit afficher le caractère indicatif`);
    assert.match(r.message || '', /2026/, `${canton}: doit citer l'année du barème`);
  }
});

test('canton inconnu → signal générique (fallback robuste, pas de fausse précision)', () => {
  // Les 26 cantons réels sont désormais tous couverts (calcul_exact ou signal_enrichi) ;
  // le signal générique ne sert plus que de garde-fou pour un code de canton inconnu.
  const r = subsideNational('XX', {});
  assert.equal(r.mode, 'signal');
  assert.ok(r.calculateur_officiel);
});

test('bilan GE inclut le subside en "à vérifier" avec lien officiel GE', () => {
  const b = buildBilan({ canton: 'GE', menage: 'seul', revenu_net_annuel: 45000 });
  const sub = b.aides.find(a => a.id === 'subside');
  assert.ok(sub, 'aide subside absente du bilan');
  assert.ok(sub.lien?.includes('ge.ch'), 'lien officiel GE manquant');
  assert.ok(/RDU|revenus modestes/i.test(sub.message || ''), 'message indicatif manquant');
});
