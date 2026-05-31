/**
 * Tests — claimback.mjs (éligibilité subside LAMal Vaud 2026).
 * Paramètres officiels (arrêté CE VD 17.12.2025). Logique d'estimation INDICATIVE.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimateSubsideVD, listCategories, estimateAllocationsVD, estimatePC, listAides } from '../src/services/claimback.mjs';

describe('claimback — estimateSubsideVD (adulte seul)', () => {
  it('revenu bas → éligible, niveau maximum (~331/mois)', () => {
    const r = estimateSubsideVD({ categorie: 'adulte_seul', revenu_net: 15000 });
    assert.equal(r.eligible, true);
    assert.equal(r.niveau, 'maximum');
    assert.equal(r.subside_max_mois, 331);
    assert.equal(r.estimation_annuelle_max, 331 * 12);
  });

  it('revenu intermédiaire → éligible, dégressif', () => {
    const r = estimateSubsideVD({ categorie: 'adulte_seul', revenu_net: 30000 });
    assert.equal(r.eligible, true);
    assert.equal(r.niveau, 'degressif');
  });

  it('revenu proche du plafond → éligible, minimum', () => {
    const r = estimateSubsideVD({ categorie: 'adulte_seul', revenu_net: 45000 });
    assert.equal(r.eligible, true);
    assert.equal(r.niveau, 'minimum');
    assert.equal(r.subside_min_mois, 30);
  });

  it('revenu au-dessus du plafond (50k) → non éligible ordinaire, mais message subside spécifique', () => {
    const r = estimateSubsideVD({ categorie: 'adulte_seul', revenu_net: 60000 });
    assert.equal(r.eligible, false);
    assert.equal(r.niveau, 'au_dela_seuil_ordinaire');
    assert.match(r.message, /subside spécifique/);
  });
});

describe('claimback — déductions enfants', () => {
  it('1 enfant déduit 6000 du revenu déterminant → bascule en maximum', () => {
    // famille avec enfant : limite_max_subside = 24200
    // revenu 30000 - 6000 (1 enfant) = 24000 <= 24200 → maximum
    const r = estimateSubsideVD({ categorie: 'adulte_famille_enfant', revenu_net: 30000, nb_enfants: 1 });
    assert.equal(r.deduction_enfants, 6000);
    assert.equal(r.revenu_determinant_estime, 24000);
    assert.equal(r.niveau, 'maximum');
  });

  it('2 enfants déduisent 6000+7000=13000', () => {
    const r = estimateSubsideVD({ categorie: 'adulte_famille_enfant', revenu_net: 40000, nb_enfants: 2 });
    assert.equal(r.deduction_enfants, 13000);
    assert.equal(r.revenu_determinant_estime, 27000);
  });
});

describe('claimback — garde-fous & robustesse', () => {
  it('catégorie invalide → error + liste des catégories', () => {
    const r = estimateSubsideVD({ categorie: 'xxx', revenu_net: 20000 });
    assert.equal(r.error, 'categorie_invalide');
    assert.ok(Array.isArray(r.categories) && r.categories.length > 0);
  });

  it('revenu invalide → error', () => {
    const r = estimateSubsideVD({ categorie: 'adulte_seul', revenu_net: -5 });
    assert.equal(r.error, 'revenu_invalide');
  });

  it('toujours indicatif + source + calculateur officiel', () => {
    const r = estimateSubsideVD({ categorie: 'adulte_seul', revenu_net: 20000 });
    assert.equal(r.indicatif, true);
    assert.ok(r.source && r.source_url && r.calculateur_officiel);
    assert.ok(Array.isArray(r.demarches) && r.demarches.length >= 2);
  });

  it('listCategories expose les catégories citoyennes', () => {
    const cats = listCategories();
    assert.ok(cats.find((c) => c.id === 'adulte_seul'));
    assert.ok(cats.every((c) => c.id && c.label));
  });
});

describe('claimback — allocations familiales VD', () => {
  it('1 enfant <16 → 322 CHF/mois', () => {
    const r = estimateAllocationsVD({ enfants_moins16: 1, enfants_formation: 0 });
    assert.equal(r.total_mensuel, 322);
    assert.equal(r.total_annuel, 322 * 12);
    assert.equal(r.eligible, true);
  });

  it('3 enfants <16 → 322+322+365 = 1009 (tarif dès le 3e)', () => {
    const r = estimateAllocationsVD({ enfants_moins16: 3, enfants_formation: 0 });
    assert.equal(r.total_mensuel, 1009);
  });

  it('1 enfant en formation → 425 CHF/mois', () => {
    const r = estimateAllocationsVD({ enfants_moins16: 0, enfants_formation: 1 });
    assert.equal(r.total_mensuel, 425);
  });

  it('mix 2 <16 + 1 formation → rang 3 = tarif formation 3e (468)', () => {
    // rang 1,2 = enfants <16 (322+322), rang 3 = formation 3e+ (468)
    const r = estimateAllocationsVD({ enfants_moins16: 2, enfants_formation: 1 });
    assert.equal(r.total_mensuel, 322 + 322 + 468);
  });

  it('aucun enfant → error', () => {
    const r = estimateAllocationsVD({ enfants_moins16: 0, enfants_formation: 0 });
    assert.equal(r.error, 'aucun_enfant');
  });

  it('toujours indicatif + source', () => {
    const r = estimateAllocationsVD({ enfants_moins16: 1 });
    assert.equal(r.indicatif, true);
    assert.ok(r.source && r.source_url);
  });
});

describe('claimback — calculateur PC (gap dépenses-revenus)', () => {
  it('rentier AVS seul, faible revenu → PC calculée + décomposition', () => {
    // besoins 20670 + loyer 16800 (cap R1 18900) + prime 4800 = 42270 dépenses
    // revenus = rente 18000 (fortune 0) → PC = 24270/an
    const r = estimatePC({
      rente_type: 'avs', couple: false, region: 1,
      rente_mensuelle: 1500, loyer_mensuel: 1400, prime_lamal_mensuelle: 400, fortune: 0
    });
    assert.equal(r.eligible, true);
    assert.equal(r.breakdown.depenses_reconnues, 42270);
    assert.equal(r.breakdown.revenus_determinants, 18000);
    assert.equal(r.pc_annuelle, 24270);
  });

  it('fortune au-dessus de la franchise → comptée 1/10 (AVS)', () => {
    // fortune 80000 → (80000-30000)/10 = 5000 ajouté aux revenus
    const r = estimatePC({
      rente_type: 'avs', couple: false, region: 1,
      rente_mensuelle: 1500, loyer_mensuel: 1400, prime_lamal_mensuelle: 400, fortune: 80000
    });
    assert.equal(r.breakdown.part_fortune_comptee, 5000);
    assert.equal(r.pc_annuelle, 24270 - 5000);
  });

  it('AI : fortune comptée 1/15 (plus favorable)', () => {
    const r = estimatePC({
      rente_type: 'ai', couple: false, region: 1,
      rente_mensuelle: 1500, loyer_mensuel: 1400, prime_lamal_mensuelle: 400, fortune: 80000
    });
    assert.equal(r.breakdown.part_fortune_comptee, Math.round(50000 / 15));
  });

  it('fortune > plafond (100k seul) → pas de PC', () => {
    const r = estimatePC({ rente_type: 'avs', couple: false, fortune: 150000, rente_mensuelle: 1500 });
    assert.equal(r.eligible, false);
    assert.equal(r.raison, 'fortune_trop_elevee');
  });

  it('revenus élevés couvrant les dépenses → pas de PC (mais pas de raison fortune)', () => {
    const r = estimatePC({
      rente_type: 'avs', couple: false, region: 1,
      rente_mensuelle: 5000, loyer_mensuel: 1000, prime_lamal_mensuelle: 400, fortune: 0
    });
    assert.equal(r.eligible, false);
    assert.ok(!r.raison);
  });

  it('couple : besoins vitaux 31005 + plafond loyer 2 personnes', () => {
    const r = estimatePC({
      rente_type: 'avs', couple: true, region: 1,
      rente_mensuelle: 2500, loyer_mensuel: 1800, prime_lamal_mensuelle: 800, fortune: 0
    });
    assert.equal(r.breakdown.besoins_vitaux, 31005);
    assert.equal(r.breakdown.loyer_plafond_annuel, 1860 * 12);
    assert.ok(r.indicatif);
  });

  it('loyer plafonné quand supérieur au maximum régional', () => {
    const r = estimatePC({
      rente_type: 'avs', couple: false, region: 1,
      rente_mensuelle: 1500, loyer_mensuel: 2500, prime_lamal_mensuelle: 400, fortune: 0
    });
    // loyer réel 30000 > plafond 18900 → reconnu 18900
    assert.equal(r.breakdown.loyer_reconnu, 18900);
  });
});

describe('claimback — listAides', () => {
  it('expose les 3 portes (subside, allocations, pc)', () => {
    const aides = listAides();
    assert.equal(aides.length, 3);
    assert.ok(aides.find((a) => a.id === 'subside' && a.statut === 'live'));
    assert.ok(aides.find((a) => a.id === 'allocations' && a.statut === 'live'));
    assert.ok(aides.find((a) => a.id === 'pc'));
  });
});

describe('claimback — subside estimation ponctuelle', () => {
  it('niveau dégressif → estimation ponctuelle entre min et max', () => {
    const r = estimateSubsideVD({ categorie: 'adulte_seul', revenu_net: 30000 });
    assert.equal(r.niveau, 'degressif');
    assert.ok(r.subside_estime_mois >= r.subside_min_mois && r.subside_estime_mois <= r.subside_max_mois);
    assert.equal(r.estimation_annuelle, r.subside_estime_mois * 12);
  });

  it('au seuil bas → estimation = subside max', () => {
    const r = estimateSubsideVD({ categorie: 'adulte_seul', revenu_net: 15000 });
    assert.equal(r.subside_estime_mois, 331);
  });
});
