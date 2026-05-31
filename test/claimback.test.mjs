/**
 * Tests — claimback.mjs (éligibilité subside LAMal Vaud 2026).
 * Paramètres officiels (arrêté CE VD 17.12.2025). Logique d'estimation INDICATIVE.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimateSubsideVD, listCategories, estimateAllocationsVD, pcSignal, listAides } from '../src/services/claimback.mjs';

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

describe('claimback — signal PC + listAides', () => {
  it('rente AVS/AI + revenus insuffisants → droit probable', () => {
    const r = pcSignal({ rente_avs_ai: true, revenus_insuffisants: true });
    assert.equal(r.probable, true);
    assert.equal(r.signal, true);
    assert.ok(!('montant' in r), 'le signal PC ne donne aucun montant');
    assert.ok(Array.isArray(r.conditions) && r.conditions.length === 3);
  });

  it('rente seule → pas "probable" mais message ciblé', () => {
    const r = pcSignal({ rente_avs_ai: true, revenus_insuffisants: false });
    assert.equal(r.probable, false);
    assert.match(r.message, /rente AVS\/AI/);
  });

  it('sans rente → message général (PC réservées aux rentiers)', () => {
    const r = pcSignal({ rente_avs_ai: false });
    assert.equal(r.probable, false);
  });

  it('listAides expose les 3 portes (subside, allocations, pc)', () => {
    const aides = listAides();
    assert.equal(aides.length, 3);
    assert.ok(aides.find((a) => a.id === 'subside' && a.statut === 'live'));
    assert.ok(aides.find((a) => a.id === 'allocations' && a.statut === 'live'));
    assert.ok(aides.find((a) => a.id === 'pc'));
  });
});
