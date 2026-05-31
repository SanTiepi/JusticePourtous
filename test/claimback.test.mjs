/**
 * Tests — claimback.mjs (éligibilité subside LAMal Vaud 2026).
 * Paramètres officiels (arrêté CE VD 17.12.2025). Logique d'estimation INDICATIVE.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimateSubsideVD, listCategories, estimateAllocationsVD, estimatePC, listAides, buildBilan, listCantons, estimateAllocationsNational, subsideNational } from '../src/services/claimback.mjs';

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

  // ── Familles : dégression des besoins vitaux par rang, DIFFÉRENTE selon l'âge (LPC art. 10
  // al. 1 let. a ch. 3/4, vérifiée sur PDF Fedlex). Base couple 31005.
  // Enfants <11 (ch. 4) : 7590/6325/5270/4390/3660 (réduction d'1/6 par enfant, plafond au 5e).
  // Enfants ≥11 (ch. 3) : 10815/10815/7210/7210/3605 (paliers entier/entier/2-tiers/2-tiers/tiers).
  const pcFam = (inp) => estimatePC({ rente_type: 'avs', couple: true, rente_mensuelle: 2000, loyer_mensuel: 1500, prime_lamal_mensuelle: 400, fortune: 0, region: 1, ...inp }).breakdown.besoins_vitaux;
  it('PC famille <11 : 1 enfant au montant plein', () => {
    assert.equal(pcFam({ enfants_moins11: 1 }), 38595); // 31005 + 7590
  });
  it('PC famille <11 : 2e enfant réduit d\'1/6 (6325, pas 7590)', () => {
    assert.equal(pcFam({ enfants_moins11: 2 }), 44920); // 31005 + 7590 + 6325
  });
  it('PC famille <11 : 3 enfants (dégression géométrique ×5/6)', () => {
    assert.equal(pcFam({ enfants_moins11: 3 }), 50190); // 31005 + 7590+6325+5270
  });
  it('PC famille <11 : 4 enfants = 54580 (barème officiel CCVD 2026, pas la règle des paliers)', () => {
    const total = pcFam({ enfants_moins11: 4 }); // 31005 + 7590+6325+5270+4390
    assert.equal(total, 54580);
    assert.ok(total < 31005 + 7590 * 4, 'la dégression doit réduire vs somme plate (61365)');
    assert.ok(total < 56305, 'ne doit PAS appliquer la règle des paliers ≥11 ans (qui donnait 56305)');
  });
  it('PC famille <11 : dès le 5e enfant, montant plafonné au 5e rang (3660)', () => {
    assert.equal(pcFam({ enfants_moins11: 5 }), 58240); // +3660
    assert.equal(pcFam({ enfants_moins11: 6 }), 58240 + 3660); // 6e = montant du 5e
  });
  it('PC famille ≥11 : paliers entier/entier/2-tiers/2-tiers (4 enfants = 36050)', () => {
    assert.equal(pcFam({ enfants_des11: 4 }), 31005 + 36050); // 10815*2 + 7210*2
  });
  it('PC famille mixte : tranches d\'âge rangées séparément', () => {
    // 2 enfants ≥11 (10815+10815) + 2 enfants <11 (7590+6325) = 35545
    assert.equal(pcFam({ enfants_des11: 2, enfants_moins11: 2 }), 31005 + 35545);
  });
  it('PC : flags honnêteté présents (estimation simplifiée + prime non plafonnée)', () => {
    const r = estimatePC({ rente_type: 'avs', couple: false, rente_mensuelle: 1500, loyer_mensuel: 1200, prime_lamal_mensuelle: 400, fortune: 0, region: 1 });
    assert.equal(r.estimation_simplifiee, true);
    assert.equal(r.breakdown.prime_plafonnee, false);
    assert.match(r.message, /SIMPLIFIÉE/);
    assert.match(r.message, /sans plafond/); // caveat prime LAMal affiché
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

describe('claimback — bilan consolidé', () => {
  it('adulte seul faible revenu, sans enfant, sans rente → seul le subside', () => {
    const b = buildBilan({ menage: 'seul', age_groupe: 'adulte', revenu_net_annuel: 20000, region: 1, rente: 'none' });
    const ids = b.aides.map((a) => a.id);
    assert.deepEqual(ids, ['subside']);
    assert.equal(b.eligibles_count, 1);
    assert.equal(b.total_annuel_estime, b.aides[0].montant_annuel);
  });

  it('famille avec 2 enfants → subside + allocations, total = somme', () => {
    const b = buildBilan({ menage: 'couple', age_groupe: 'adulte', nb_enfants_moins16: 2, revenu_net_annuel: 40000, region: 1, rente: 'none' });
    const ids = b.aides.map((a) => a.id).sort();
    assert.deepEqual(ids, ['allocations', 'subside']);
    const somme = b.aides.filter((a) => a.montant_annuel > 0).reduce((s, a) => s + a.montant_annuel, 0);
    assert.equal(b.total_annuel_estime, somme);
    assert.ok(b.total_annuel_estime > 0);
  });

  it('rentier AVS seul à faibles revenus → subside + PC détectés', () => {
    const b = buildBilan({
      menage: 'seul', age_groupe: 'adulte', revenu_net_annuel: 18000, region: 1,
      rente: 'avs', rente_mensuelle: 1500, loyer_mensuel: 1400, prime_lamal_mensuelle: 400, fortune: 0
    });
    const ids = b.aides.map((a) => a.id);
    assert.ok(ids.includes('pc'));
    assert.ok(ids.includes('subside'));
    const pc = b.aides.find((a) => a.id === 'pc');
    assert.equal(pc.montant_annuel, 24270);
    assert.ok(b.total_annuel_estime >= 24270);
  });

  it('total mensuel = total annuel / 12 (arrondi) + indicatif', () => {
    const b = buildBilan({ menage: 'seul', age_groupe: 'adulte', revenu_net_annuel: 20000, region: 1, rente: 'none' });
    assert.equal(b.total_mensuel_estime, Math.round(b.total_annuel_estime / 12));
    assert.equal(b.indicatif, true);
    assert.ok(b.avertissement && b.message);
  });
});

describe('claimback — couverture nationale (26 cantons)', () => {
  it('listCantons : 26 cantons, VD en tête, {code,nom}', () => {
    const c = listCantons();
    assert.equal(c.length, 26);
    assert.equal(c[0].code, 'VD');
    assert.ok(c.every((x) => x.code && x.code.length === 2 && x.nom));
  });

  it('allocations VD = barème cantonal détaillé (322), montants vérifiés', () => {
    const r = estimateAllocationsNational('VD', { enfants_moins16: 1, enfants_formation: 0 });
    assert.equal(r.total_mensuel, 322);
    assert.equal(r.montants_verifies, true);
  });

  it('allocations GE = barème officiel BSV 2026 vérifié (311)', () => {
    const r = estimateAllocationsNational('GE', { enfants_moins16: 1, enfants_formation: 0 });
    assert.equal(r.total_mensuel, 311);
    assert.equal(r.montants_verifies, true); // tous les cantons vérifiés via la table officielle BSV 2026
    assert.match(r.message, /Genève/i);
  });

  // Cantons à logique d'âge (ZH/LU dès 12 ans, ZG formation dès 18 ans) : on signale la
  // dépendance à l'âge plutôt que de prétendre une valeur "exacte" sans l'âge (correction Codex).
  it('allocations ZH/LU/ZG : caveat d\'âge surfacé (depend_age + age_note)', () => {
    for (const c of ['ZH', 'LU', 'ZG']) {
      const r = estimateAllocationsNational(c, { enfants_moins16: 1, enfants_formation: 0 });
      assert.equal(r.depend_age, true, c + ' devrait signaler la dépendance à l\'âge');
      assert.ok(r.age_note && r.age_note.length > 0, c + ' age_note manquante');
      assert.match(r.message, /âge|ans/i, c + ' message sans mention d\'âge');
    }
  });
  it('allocations sans logique d\'âge : pas de faux caveat (GE)', () => {
    const r = estimateAllocationsNational('GE', { enfants_moins16: 1, enfants_formation: 0 });
    assert.ok(!r.depend_age);
  });

  it('allocations : valeurs officielles BSV exactes (UR 240/290, SZ 230/280, GR 240/290)', () => {
    const exp = { UR: [240, 290], SZ: [230, 280], GR: [240, 290], OW: [220, 270], TG: [215, 280] };
    for (const [c, [enf, form]] of Object.entries(exp)) {
      assert.equal(estimateAllocationsNational(c, { enfants_moins16: 1 }).total_mensuel, enf, c + ' enfant');
      assert.equal(estimateAllocationsNational(c, { enfants_formation: 1 }).total_mensuel, form, c + ' formation');
    }
  });

  it('allocations : plancher fédéral garanti pour un canton au minimum (ZH formation = 268)', () => {
    const r = estimateAllocationsNational('ZH', { enfants_moins16: 0, enfants_formation: 2 });
    assert.equal(r.total_mensuel, 536); // 2 × 268 (minimum fédéral LAFam 2026, vérifié SVA ZH)
  });

  it('allocations : jamais en dessous du minimum fédéral (215/268)', () => {
    // minimum fédéral LAFam dès 2025 : 215 CHF/enfant, 268 CHF/formation.
    for (const c of listCantons()) {
      const e = estimateAllocationsNational(c.code, { enfants_moins16: 1, enfants_formation: 0 });
      assert.ok(e.total_mensuel >= 215, c.code + ' enfant < 215');
      const f = estimateAllocationsNational(c.code, { enfants_moins16: 0, enfants_formation: 1 });
      assert.ok(f.total_mensuel >= 268, c.code + ' formation < 268');
    }
  });

  it('subside VD = estimation basée sur barèmes officiels (pas "calcul exact")', () => {
    const r = subsideNational('VD', { categorie: 'adulte_seul', revenu_net: 20000 });
    assert.equal(r.mode, 'estimation_officielle'); // honnêteté Codex : interpolation, pas le calcul exact de l'autorité
    assert.equal(r.eligible, true);
  });

  it('subside autre canton = signal + lien calculateur officiel', () => {
    const r = subsideNational('GE', { categorie: 'adulte_seul', revenu_net: 20000 });
    assert.match(r.mode, /^signal/); // 'signal' ou 'signal_enrichi' (GE/ZH/BE sourcés) — jamais estimation_officielle
    assert.ok(r.calculateur_officiel);
    assert.ok(!('subside_estime_mois' in r)); // pas de fausse précision
  });

  it('canton inconnu = signal générique (fallback)', () => {
    const r = subsideNational('XX', { categorie: 'adulte_seul', revenu_net: 20000 });
    assert.equal(r.mode, 'signal');
    assert.ok(r.calculateur_officiel);
  });

  it('bilan canton non-VD : allocations au minimum fédéral + subside à vérifier', () => {
    const b = buildBilan({ canton: 'GE', menage: 'seul', age_groupe: 'adulte', nb_enfants_moins16: 2, revenu_net_annuel: 30000, region: 1, rente: 'none' });
    assert.equal(b.canton, 'GE');
    const alloc = b.aides.find((a) => a.id === 'allocations');
    assert.equal(alloc.montant_mensuel, 622); // 2 × 311 (barème GE indicatif)
    const sub = b.aides.find((a) => a.id === 'subside');
    assert.equal(sub.a_verifier, true);
    assert.equal(sub.montant_annuel, 0);
    assert.equal(b.total_annuel_estime, 622 * 12); // seules les allocations chiffrées
  });

  it('PC reste fédéral (valable tous cantons) — calcul identique', () => {
    const r = estimatePC({ rente_type: 'avs', couple: false, region: 1, rente_mensuelle: 1500, loyer_mensuel: 1400, prime_lamal_mensuelle: 400, fortune: 0 });
    assert.equal(r.pc_annuelle, 24270);
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
