import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  compile,
  ALL_RULES,
  BAIL_RULES,
  TRAVAIL_RULES,
  DETTES_RULES,
  TRANSVERSAL_RULES,
  CONSOMMATION_RULES,
  ASSURANCES_RULES,
  VOISINAGE_RULES,
} from '../src/services/normative-compiler.mjs';

// ============================================================
// Phase Cortex — règles normatives exécutables
// ------------------------------------------------------------
// Réalité du commit (cf. CLAUDE.md) : 22 règles dans 7 domaines.
// L'objectif initial annoncé dans la roadmap (~100 règles, 11
// domaines : famille, etrangers, social, violence, accident,
// entreprise) n'a jamais été commité dans normative-compiler.mjs.
// Les seuils ci-dessous reflètent l'état réel exporté par le module
// pour qu'ils soient une régression utile (et non une aspiration).
// Si de nouvelles règles arrivent, on remontera les seuils.
// ============================================================

describe('Phase Cortex — règles normatives (réalité du commit)', () => {
  describe('Compte total et distribution par domaine commité', () => {
    it('ALL_RULES >= 20 (réel ≈ 22, seuil ajusté à la réalité)', () => {
      assert.ok(
        ALL_RULES.length >= 20,
        `Seulement ${ALL_RULES.length} règles, attendu >= 20`,
      );
    });

    it('bail: >= 6 règles', () => {
      assert.ok(BAIL_RULES.length >= 6, `bail: ${BAIL_RULES.length} règles`);
    });

    it('travail: >= 3 règles', () => {
      assert.ok(TRAVAIL_RULES.length >= 3, `travail: ${TRAVAIL_RULES.length} règles`);
    });

    it('dettes: >= 3 règles', () => {
      assert.ok(DETTES_RULES.length >= 3, `dettes: ${DETTES_RULES.length} règles`);
    });

    it('transversal: >= 1 règle', () => {
      assert.ok(TRANSVERSAL_RULES.length >= 1, `transversal: ${TRANSVERSAL_RULES.length} règles`);
    });

    it('consommation: >= 3 règles', () => {
      assert.ok(CONSOMMATION_RULES.length >= 3, `consommation: ${CONSOMMATION_RULES.length} règles`);
    });

    it('assurances: >= 3 règles', () => {
      assert.ok(ASSURANCES_RULES.length >= 3, `assurances: ${ASSURANCES_RULES.length} règles`);
    });

    it('voisinage: >= 3 règles', () => {
      assert.ok(VOISINAGE_RULES.length >= 3, `voisinage: ${VOISINAGE_RULES.length} règles`);
    });
  });

  describe('Intégrité structurelle', () => {
    it('IDs uniques sur ALL_RULES', () => {
      const ids = ALL_RULES.map(r => r.id);
      const unique = new Set(ids);
      assert.equal(ids.length, unique.size, 'IDs dupliqués détectés');
    });

    it('chaque règle : id, label, base_legale, source_ids, condition (fn), consequence (fn)', () => {
      for (const r of ALL_RULES) {
        assert.ok(r.id, `règle sans id`);
        assert.ok(r.label, `${r.id} sans label`);
        assert.ok(r.base_legale, `${r.id} sans base_legale`);
        assert.ok(Array.isArray(r.source_ids) && r.source_ids.length > 0, `${r.id} source_ids vide`);
        assert.equal(typeof r.condition, 'function', `${r.id} condition absente`);
        assert.equal(typeof r.consequence, 'function', `${r.id} consequence absente`);
      }
    });

    it('source_ids format valide (fedlex: | canton: | csias:)', () => {
      const pattern = /^(fedlex:|canton:|csias:)/;
      for (const r of ALL_RULES) {
        for (const sid of r.source_ids) {
          assert.ok(pattern.test(sid), `${r.id} source_id invalide: ${sid}`);
        }
      }
    });
  });

  // ============================================================
  // Activations — chaque règle commitée doit être déclenchable
  // avec des faits minimaux représentatifs.
  // ============================================================

  describe('BAIL — règles existantes activables', () => {
    it('caution max applicable', () => {
      const r = compile({ domaine: 'bail', loyer_mensuel: 1500 });
      const rule = r.results.find(x => x.rule_id === 'bail_caution_max');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.montant_max, 4500);
    });

    it('caution restitution délai applicable', () => {
      const r = compile({ domaine: 'bail', fin_bail: true });
      const rule = r.results.find(x => x.rule_id === 'bail_caution_restitution_delai');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.delai_jours, 365);
    });

    it('délai congé applicable', () => {
      const r = compile({ domaine: 'bail' });
      assert.ok(r.results.find(x => x.rule_id === 'bail_delai_conge')?.applicable);
    });

    it('contestation congé — 30 jours', () => {
      const r = compile({ domaine: 'bail', conge_recu: true });
      const rule = r.results.find(x => x.rule_id === 'bail_contestation_conge');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.delai_jours, 30);
    });

    it('contestation augmentation — 30 jours', () => {
      const r = compile({ domaine: 'bail', augmentation_recue: true });
      const rule = r.results.find(x => x.rule_id === 'bail_contestation_augmentation');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.delai_jours, 30);
    });

    it('réduction défaut applicable', () => {
      const r = compile({ domaine: 'bail', defaut_signale: true, gravite_defaut: 'moyen' });
      const rule = r.results.find(x => x.rule_id === 'bail_reduction_defaut');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.reduction_min, 15);
    });
  });

  describe('TRAVAIL — règles existantes activables', () => {
    it('délai congé selon ancienneté', () => {
      const r = compile({ domaine: 'travail', anciennete_annees: 5 });
      const rule = r.results.find(x => x.rule_id === 'travail_delai_conge');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.delai_jours, 60);
    });

    it('protection maladie applicable', () => {
      const r = compile({ domaine: 'travail', en_arret_maladie: true, anciennete_annees: 3 });
      const rule = r.results.find(x => x.rule_id === 'travail_protection_maladie');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.duree_protection, 90);
    });

    it('protection maladie bloquée pendant période essai', () => {
      const r = compile({ domaine: 'travail', en_arret_maladie: true, periode_essai: true });
      const rule = r.results.find(x => x.rule_id === 'travail_protection_maladie');
      assert.ok(!rule?.applicable, 'période essai doit bloquer');
    });

    it('salaire impayé — mise en demeure', () => {
      const r = compile({ domaine: 'travail', salaire_impaye: true });
      assert.ok(r.results.find(x => x.rule_id === 'travail_salaire_impaye_mise_en_demeure')?.applicable);
    });
  });

  describe('DETTES — règles existantes activables', () => {
    it('opposition commandement — 10 jours', () => {
      const r = compile({ domaine: 'dettes', commandement_recu: true });
      const rule = r.results.find(x => x.rule_id === 'dettes_opposition_commandement');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.delai_jours, 10);
    });

    it('minimum vital applicable', () => {
      const r = compile({ domaine: 'dettes', saisie_salaire: true, canton: 'VD', nombre_enfants: 2 });
      const rule = r.results.find(x => x.rule_id === 'dettes_minimum_vital');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.minimum_vital, 1200 + 2 * 400);
    });

    it('prescription applicable', () => {
      const r = compile({ domaine: 'dettes', type_dette: 'loyer' });
      assert.ok(r.results.find(x => x.rule_id === 'dettes_prescription')?.applicable);
    });
  });

  describe('CONSOMMATION — règles existantes activables', () => {
    it('garantie légale applicable', () => {
      const r = compile({ domaine: 'consommation', achat_defectueux: true, achat_neuf: true });
      assert.ok(r.results.find(x => x.rule_id === 'consommation_garantie_legale')?.applicable);
    });

    it('droit révocation démarchage — 14 jours', () => {
      const r = compile({ domaine: 'consommation', demarchage_domicile: true, prix_achat: 500 });
      const rule = r.results.find(x => x.rule_id === 'consommation_droit_revocation_demarchage');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.delai_jours, 14);
    });

    it('retard livraison applicable', () => {
      const r = compile({ domaine: 'consommation', retard_livraison: true });
      assert.ok(r.results.find(x => x.rule_id === 'consommation_retard_livraison')?.applicable);
    });
  });

  describe('ASSURANCES — règles existantes activables', () => {
    it('LAMal subsides applicable', () => {
      const r = compile({ domaine: 'assurances', difficulte_primes_lamal: true, canton: 'VD' });
      assert.ok(r.results.find(x => x.rule_id === 'assurance_lamal_subsides')?.applicable);
    });

    it('contestation décision — 30 jours', () => {
      const r = compile({ domaine: 'assurances', decision_assurance_contestee: true });
      const rule = r.results.find(x => x.rule_id === 'assurance_contestation_decision');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.delai_jours, 30);
    });

    it('accident professionnel — délai annonce', () => {
      const r = compile({ domaine: 'assurances', accident_professionnel: true });
      assert.ok(r.results.find(x => x.rule_id === 'assurance_accident_delai_annonce')?.applicable);
    });
  });

  describe('VOISINAGE — règles existantes activables', () => {
    it('immissions excessives applicable', () => {
      const r = compile({ domaine: 'voisinage' });
      assert.ok(r.results.find(x => x.rule_id === 'voisinage_immissions_excessives')?.applicable);
    });

    it('arbres distance applicable', () => {
      const r = compile({ domaine: 'voisinage', probleme_plantations: true, canton: 'VD' });
      assert.ok(r.results.find(x => x.rule_id === 'voisinage_arbres_distance')?.applicable);
    });

    it('droit passage applicable', () => {
      const r = compile({ domaine: 'voisinage', enclave: true });
      assert.ok(r.results.find(x => x.rule_id === 'voisinage_droit_passage')?.applicable);
    });
  });

  describe('TRANSVERSAL — règles existantes activables', () => {
    it('assistance judiciaire applicable', () => {
      const r = compile({ revenu_mensuel: 3000, charges_mensuelles: 2500, fortune: 5000, canton: 'VD' });
      const rule = r.results.find(x => x.rule_id === 'assistance_judiciaire');
      assert.ok(rule?.applicable);
      assert.equal(rule.consequence.eligible_probable, true);
    });
  });
});
