import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculRendementAdmissible,
  calculAmortissementGarantie,
  calculSaisieSalaire,
  calculDelaiConge,
  calculIndemniteLicenciement,
  calculProtectionMaladie,
  calculPensionIndicative,
  calculPrescription,
  calculCoutProcedure,
  calculEligibiliteAJ,
  CALCULATEURS
} from '../src/services/calculateurs.mjs';

describe('Calculateurs', () => {

  // ─── 1. Rendement admissible ───

  describe('calculRendementAdmissible', () => {
    it('calcule le loyer admissible avec valeurs par défaut', () => {
      const r = calculRendementAdmissible({ prixAchat: 500000 });
      assert.ok(r.resultat);
      assert.ok(r.resultat.loyerAdmissibleMensuel > 0);
      assert.ok(r.sourceLegale.includes('CO 269'));
      assert.ok(r.disclaimer);
    });

    it('inclut frais entretien et charges', () => {
      const r = calculRendementAdmissible({ prixAchat: 500000, fraisEntretien: 5000, chargesAnnuelles: 3000 });
      const rSans = calculRendementAdmissible({ prixAchat: 500000 });
      assert.ok(r.resultat.loyerAdmissibleMensuel > rSans.resultat.loyerAdmissibleMensuel);
    });

    it('retourne erreur si prixAchat invalide', () => {
      const r = calculRendementAdmissible({ prixAchat: -1 });
      assert.ok(r.erreur);
    });
  });

  // ─── 2. Amortissement garantie SVIT ───

  describe('calculAmortissementGarantie', () => {
    it('peinture 6 ans sur 8 = 25% dû', () => {
      const r = calculAmortissementGarantie({
        items: [{ nom: 'peinture', age: 6, montantFacture: 2000 }]
      });
      assert.ok(r.resultat);
      const item = r.resultat.items[0];
      // 6/8 = 75% amorti → 25% dû → 500 CHF
      assert.equal(item.montantDu, 500);
      assert.equal(item.amortissement, 75);
    });

    it('objet totalement amorti → 0 CHF dû', () => {
      const r = calculAmortissementGarantie({
        items: [{ nom: 'peinture', age: 10, montantFacture: 2000 }]
      });
      assert.equal(r.resultat.items[0].montantDu, 0);
    });

    it('calcule le total de plusieurs items', () => {
      const r = calculAmortissementGarantie({
        items: [
          { nom: 'peinture', age: 4, montantFacture: 1600 },
          { nom: 'moquette', age: 5, montantFacture: 3000 }
        ]
      });
      assert.equal(r.resultat.items.length, 2);
      assert.ok(r.resultat.totalDu > 0);
    });

    it('retourne erreur si items vide', () => {
      const r = calculAmortissementGarantie({ items: [] });
      assert.ok(r.erreur);
    });
  });

  // ─── 3. Saisie sur salaire ───

  describe('calculSaisieSalaire', () => {
    it('cas protégé : revenu < minimum vital', () => {
      const r = calculSaisieSalaire({
        revenuMensuelNet: 1000,
        loyer: 800,
        primeLAMal: 300
      });
      assert.ok(r.resultat);
      assert.equal(r.resultat.montantSaisissable, 0);
      assert.equal(r.resultat.estProtege, true);
    });

    it('calcule le montant saisissable pour revenu élevé', () => {
      const r = calculSaisieSalaire({
        revenuMensuelNet: 8000,
        loyer: 1200,
        primeLAMal: 350
      });
      assert.ok(r.resultat.montantSaisissable > 0);
      assert.equal(r.resultat.estProtege, false);
    });

    it('prend en compte les enfants', () => {
      const rSans = calculSaisieSalaire({ revenuMensuelNet: 5000, loyer: 1000 });
      const rAvec = calculSaisieSalaire({ revenuMensuelNet: 5000, loyer: 1000, nbEnfantsMoins10: 2 });
      assert.ok(rAvec.resultat.montantSaisissable < rSans.resultat.montantSaisissable);
    });
  });

  // ─── 4. Délai de congé ───

  describe('calculDelaiConge', () => {
    it('7 jours pendant période essai', () => {
      const r = calculDelaiConge({ anciennete: 0.2, periodeEssai: true });
      assert.equal(r.resultat.delaiJours, 7);
    });

    it('1 mois pour 1re année', () => {
      const r = calculDelaiConge({ anciennete: 0.5 });
      assert.equal(r.resultat.delaiJours, 30);
    });

    it('2 mois pour 2-9 ans', () => {
      const r = calculDelaiConge({ anciennete: 5 });
      assert.equal(r.resultat.delaiJours, 60);
    });

    it('3 mois pour 10+ ans ancienneté', () => {
      const r = calculDelaiConge({ anciennete: 15 });
      assert.equal(r.resultat.delaiJours, 90);
    });

    it('retourne source légale CO 335', () => {
      const r = calculDelaiConge({ anciennete: 3 });
      assert.ok(r.sourceLegale.includes('CO'));
    });
  });

  // ─── 5. Indemnité licenciement ───

  describe('calculIndemniteLicenciement', () => {
    it('indemnité max = 6 mois de salaire', () => {
      const r = calculIndemniteLicenciement({ salaireMensuel: 6000, anciennete: 20 });
      assert.equal(r.resultat.indemniteMax, 36000);
    });

    it('circonstances graves → facteur plus élevé', () => {
      const rStd = calculIndemniteLicenciement({ salaireMensuel: 6000, anciennete: 10, circonstances: 'standard' });
      const rGrv = calculIndemniteLicenciement({ salaireMensuel: 6000, anciennete: 10, circonstances: 'grave' });
      assert.ok(rGrv.resultat.indemniteEstimee >= rStd.resultat.indemniteEstimee);
    });
  });

  // ─── 6. Protection maladie ───

  describe('calculProtectionMaladie', () => {
    it('30 jours pour 1re année', () => {
      const r = calculProtectionMaladie({ anciennete: 0.5 });
      assert.equal(r.resultat.joursProtection, 30);
    });

    it('90 jours pour 2-5 ans', () => {
      const r = calculProtectionMaladie({ anciennete: 3 });
      assert.equal(r.resultat.joursProtection, 90);
    });

    it('180 jours pour 6+ ans', () => {
      const r = calculProtectionMaladie({ anciennete: 6 });
      assert.equal(r.resultat.joursProtection, 180);
    });

    it('180 jours pour 15 ans', () => {
      const r = calculProtectionMaladie({ anciennete: 15 });
      assert.equal(r.resultat.joursProtection, 180);
    });
  });

  // ─── 7. Pension indicative ───

  describe('calculPensionIndicative', () => {
    it('calcule pension pour 2 enfants', () => {
      const r = calculPensionIndicative({ revenuDebiteur: 8000, chargesDebiteur: 2000, nbEnfants: 2, agesEnfants: [5, 12] });
      assert.ok(r.resultat);
      assert.ok(r.resultat.pensionMensuelleTotale > 0);
      assert.equal(r.resultat.nbEnfants, 2);
    });

    it('retourne erreur si nbEnfants manquant', () => {
      const r = calculPensionIndicative({ revenuDebiteur: 8000 });
      assert.ok(r.erreur);
    });
  });

  // ─── 8. Prescription ───

  describe('calculPrescription', () => {
    it('10 ans pour dette générale', () => {
      const r = calculPrescription({ typeDette: 'general' });
      assert.equal(r.resultat.delaiAnnees, 10);
    });

    it('5 ans pour loyer', () => {
      const r = calculPrescription({ typeDette: 'loyer' });
      assert.equal(r.resultat.delaiAnnees, 5);
    });

    it('20 ans pour acte de défaut de biens', () => {
      const r = calculPrescription({ typeDette: 'acte_de_defaut_de_biens' });
      assert.equal(r.resultat.delaiAnnees, 20);
    });

    it('calcule la date de prescription si dateNaissance fournie', () => {
      const r = calculPrescription({ typeDette: 'general', dateNaissance: '2020-01-01' });
      assert.equal(r.resultat.datePrescription, '2030-01-01');
      assert.equal(r.resultat.estPrescrit, false);
    });

    it('détecte une dette prescrite', () => {
      const r = calculPrescription({ typeDette: 'loyer', dateNaissance: '2015-01-01' });
      assert.equal(r.resultat.estPrescrit, true);
    });

    it('retourne erreur pour type inconnu', () => {
      const r = calculPrescription({ typeDette: 'inconnu' });
      assert.ok(r.erreur);
    });
  });

  // ─── 9. Coût procédure ───

  describe('calculCoutProcedure', () => {
    it('retourne émolument et frais avocat', () => {
      const r = calculCoutProcedure({ valeurLitigieuse: 15000 });
      assert.ok(r.resultat);
      assert.ok(r.resultat.emolumentTribunal > 0);
      assert.ok(r.resultat.fraisAvocatMin > 0);
      assert.ok(r.resultat.coutTotalMin > 0);
    });

    it('conciliation coûte moins que première instance', () => {
      const rConc = calculCoutProcedure({ typeProcedure: 'conciliation', valeurLitigieuse: 20000 });
      const rPI = calculCoutProcedure({ typeProcedure: 'premiere_instance', valeurLitigieuse: 20000 });
      assert.ok(rConc.resultat.emolumentTribunal < rPI.resultat.emolumentTribunal);
    });
  });

  // ─── 10. Éligibilité aide juridictionnelle ───

  describe('calculEligibiliteAJ', () => {
    it('éligible si revenu sous le minimum vital', () => {
      const r = calculEligibiliteAJ({ revenuMensuel: 1000, fortune: 0, charges: 800 });
      assert.equal(r.resultat.eligible, true);
    });

    it('non éligible si revenu confortable', () => {
      const r = calculEligibiliteAJ({ revenuMensuel: 8000, fortune: 0 });
      assert.equal(r.resultat.eligible, false);
    });

    it('fortune excédentaire empêche éligibilité', () => {
      const r = calculEligibiliteAJ({ revenuMensuel: 1000, fortune: 50000, charges: 800 });
      assert.equal(r.resultat.eligible, false);
    });
  });

  // ─── Registre des calculateurs ───

  describe('CALCULATEURS registre', () => {
    it('contient 10 calculateurs', () => {
      assert.equal(Object.keys(CALCULATEURS).length, 10);
    });

    it('chaque calculateur a id, nom, description, fn', () => {
      for (const [key, calc] of Object.entries(CALCULATEURS)) {
        assert.ok(calc.id, `${key} manque id`);
        assert.ok(calc.nom, `${key} manque nom`);
        assert.ok(calc.description, `${key} manque description`);
        assert.equal(typeof calc.fn, 'function', `${key} fn n'est pas une fonction`);
      }
    });
  });
});
