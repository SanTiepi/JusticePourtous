import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  compile, getRulesForDomain, getRuleDefinitions, execRule,
  ALL_RULES, BAIL_RULES, TRAVAIL_RULES, DETTES_RULES,
  CONSOMMATION_RULES, ASSURANCES_RULES, VOISINAGE_RULES
} from '../src/services/normative-compiler.mjs';
import { server } from '../src/server.mjs';

const PORT = 9886;
const BASE = `http://localhost:${PORT}`;

async function httpGet(path) {
  const http = await import('node:http');
  return new Promise((resolve, reject) => {
    http.default.get(`${BASE}${path}`, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    }).on('error', reject);
  });
}

async function httpPost(path, data) {
  const http = await import('node:http');
  const payload = JSON.stringify(data);
  return new Promise((resolve, reject) => {
    const req = http.default.request(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

describe('Normative Compiler', () => {

  describe('rule definitions', () => {
    it('has at least 10 rules total', () => {
      assert.ok(ALL_RULES.length >= 10, `Only ${ALL_RULES.length} rules`);
    });

    it('covers bail, travail, dettes', () => {
      assert.ok(BAIL_RULES.length >= 4, 'bail needs 4+ rules');
      assert.ok(TRAVAIL_RULES.length >= 3, 'travail needs 3+ rules');
      assert.ok(DETTES_RULES.length >= 3, 'dettes needs 3+ rules');
    });

    it('each rule has id, label, base_legale, source_ids', () => {
      for (const r of ALL_RULES) {
        assert.ok(r.id, 'missing id');
        assert.ok(r.label, `${r.id} missing label`);
        assert.ok(r.base_legale, `${r.id} missing base_legale`);
        assert.ok(r.source_ids?.length > 0, `${r.id} missing source_ids`);
        assert.ok(typeof r.condition === 'function', `${r.id} condition not function`);
        assert.ok(typeof r.consequence === 'function', `${r.id} consequence not function`);
      }
    });
  });

  describe('bail compilation', () => {
    it('caution max = 3 mois de loyer', () => {
      const result = compile({ domaine: 'bail', loyer_mensuel: 1500 });
      const caution = result.results.find(r => r.rule_id === 'bail_caution_max');
      assert.ok(caution?.applicable);
      assert.equal(caution.consequence.montant_max, 4500);
    });

    it('caution commercial = pas de limite', () => {
      const result = compile({ domaine: 'bail', type_bail: 'commercial', loyer_mensuel: 5000 });
      const caution = result.results.find(r => r.rule_id === 'bail_caution_max');
      assert.ok(!caution?.applicable, 'Commercial bail should trigger exception');
      assert.ok(caution?.exceptions.some(e => e.triggered));
    });

    it('contestation congé = 30 jours', () => {
      const result = compile({ domaine: 'bail', conge_recu: true });
      const conge = result.results.find(r => r.rule_id === 'bail_contestation_conge');
      assert.ok(conge?.applicable);
      assert.equal(conge.consequence.delai_jours, 30);
      assert.equal(conge.consequence.gratuit, true);
    });

    it('défaut grave = réduction 30-100%', () => {
      const result = compile({ domaine: 'bail', defaut_signale: true, gravite_defaut: 'grave' });
      const defaut = result.results.find(r => r.rule_id === 'bail_reduction_defaut');
      assert.ok(defaut?.applicable);
      assert.equal(defaut.consequence.reduction_min, 30);
      assert.equal(defaut.consequence.reduction_max, 100);
    });

    it('défaut par faute du locataire = bloqué', () => {
      const result = compile({ domaine: 'bail', defaut_signale: true, defaut_faute_locataire: true });
      const defaut = result.results.find(r => r.rule_id === 'bail_reduction_defaut');
      assert.ok(!defaut?.applicable, 'Should be blocked by exception');
    });
  });

  describe('travail compilation', () => {
    it('délai congé: 2 mois pour 5 ans ancienneté', () => {
      const result = compile({ domaine: 'travail', anciennete_annees: 5 });
      const conge = result.results.find(r => r.rule_id === 'travail_delai_conge');
      assert.ok(conge?.applicable);
      assert.equal(conge.consequence.delai_jours, 60);
    });

    it('protection maladie: 90 jours pour 3 ans', () => {
      const result = compile({ domaine: 'travail', en_arret_maladie: true, anciennete_annees: 3 });
      const prot = result.results.find(r => r.rule_id === 'travail_protection_maladie');
      assert.ok(prot?.applicable);
      assert.equal(prot.consequence.duree_protection, 90);
    });

    it('protection maladie: bloquée pendant période essai', () => {
      const result = compile({ domaine: 'travail', en_arret_maladie: true, periode_essai: true });
      const prot = result.results.find(r => r.rule_id === 'travail_protection_maladie');
      assert.ok(!prot?.applicable);
    });
  });

  describe('dettes compilation', () => {
    it('opposition = 10 jours', () => {
      const result = compile({ domaine: 'dettes', commandement_recu: true });
      const opp = result.results.find(r => r.rule_id === 'dettes_opposition_commandement');
      assert.ok(opp?.applicable);
      assert.equal(opp.consequence.delai_jours, 10);
      assert.equal(opp.consequence.gratuit, true);
    });

    it('minimum vital GE = 1350 (plus élevé)', () => {
      const result = compile({ domaine: 'dettes', saisie_salaire: true, canton: 'GE', nombre_enfants: 2 });
      const mv = result.results.find(r => r.rule_id === 'dettes_minimum_vital');
      assert.ok(mv?.applicable);
      assert.equal(mv.consequence.base, 1350);
      assert.equal(mv.consequence.minimum_vital, 1350 + 800); // 1350 + 2*400
    });

    it('prescription loyer = 5 ans', () => {
      const result = compile({ domaine: 'dettes', type_dette: 'loyer' });
      const presc = result.results.find(r => r.rule_id === 'dettes_prescription');
      assert.ok(presc?.applicable);
      assert.equal(presc.consequence.delai, '5 ans');
    });
  });

  describe('transversal', () => {
    it('assistance judiciaire: éligible si revenu faible', () => {
      const result = compile({ demande_assistance_judiciaire: true, revenu_mensuel: 2500, charges_mensuelles: 2000, fortune: 5000 });
      const aj = result.results.find(r => r.rule_id === 'assistance_judiciaire');
      assert.ok(aj?.applicable);
      assert.equal(aj.consequence.eligible_probable, true);
    });
  });

  describe('edge cases', () => {
    it('empty facts = no applicable rules, no crash', () => {
      const result = compile({});
      assert.ok(result.rules_evaluated > 0);
      assert.equal(result.rules_applicable, 0);
    });

    it('unknown domain = minimal results', () => {
      const result = compile({ domaine: 'fake' });
      assert.ok(result.rules_evaluated > 0);
    });

    it('all source_ids are non-empty strings', () => {
      for (const rule of ALL_RULES) {
        for (const sid of rule.source_ids) {
          assert.ok(sid && typeof sid === 'string' && sid.length > 5, `${rule.id} has bad source_id: ${sid}`);
        }
      }
    });
  });

  describe('API', () => {
    before(() => new Promise(resolve => server.listen(PORT, resolve)));
    after(() => new Promise(resolve => server.close(resolve)));

    it('GET /api/compiler/rules returns rule definitions', async () => {
      const res = await httpGet('/api/compiler/rules');
      assert.equal(res.status, 200);
      assert.ok(res.data.rules.length >= 10);
      assert.ok(res.data.disclaimer);
    });

    it('POST /api/compiler/execute compiles bail facts', async () => {
      const res = await httpPost('/api/compiler/execute', {
        facts: { domaine: 'bail', loyer_mensuel: 1800, conge_recu: true }
      });
      assert.equal(res.status, 200);
      assert.ok(res.data.rules_applicable >= 2);
    });

    it('POST /api/compiler/execute without facts returns 400', async () => {
      const res = await httpPost('/api/compiler/execute', {});
      assert.equal(res.status, 400);
    });
  });

  describe('consommation rules', () => {
    it('has at least 3 rules', () => {
      assert.ok(CONSOMMATION_RULES.length >= 3, `Only ${CONSOMMATION_RULES.length} consommation rules`);
    });

    it('garantie défaut: 2 ans pour achat neuf', () => {
      const result = compile({ domaine: 'consommation', achat_defectueux: true, achat_neuf: true, prix_achat: 500 });
      const garantie = result.results.find(r => r.rule_id === 'consommation_garantie_legale');
      assert.ok(garantie?.applicable);
      assert.equal(garantie.consequence.prescription, '2 ans');
    });

    it('garantie exclue si défaut connu', () => {
      const result = compile({ domaine: 'consommation', achat_defectueux: true, defaut_connu_achat: true });
      const garantie = result.results.find(r => r.rule_id === 'consommation_garantie_legale');
      assert.ok(!garantie?.applicable);
    });

    it('révocation démarchage = 14 jours', () => {
      const result = compile({ domaine: 'consommation', demarchage_domicile: true, prix_achat: 500 });
      const revo = result.results.find(r => r.rule_id === 'consommation_droit_revocation_demarchage');
      assert.ok(revo?.applicable);
      assert.equal(revo.consequence.delai_jours, 14);
    });

    it('révocation bloquée sous CHF 100', () => {
      const result = compile({ domaine: 'consommation', demarchage_domicile: true, prix_achat: 50 });
      const revo = result.results.find(r => r.rule_id === 'consommation_droit_revocation_demarchage');
      assert.ok(!revo?.applicable);
    });
  });

  describe('assurances rules', () => {
    it('has at least 3 rules', () => {
      assert.ok(ASSURANCES_RULES.length >= 3, `Only ${ASSURANCES_RULES.length} assurances rules`);
    });

    it('contestation décision = 30 jours', () => {
      const result = compile({ domaine: 'assurances', decision_assurance_contestee: true });
      const contest = result.results.find(r => r.rule_id === 'assurance_contestation_decision');
      assert.ok(contest?.applicable);
      assert.equal(contest.consequence.delai_jours, 30);
      assert.equal(contest.consequence.gratuit, true);
    });

    it('accident professionnel: annonce 3 jours', () => {
      const result = compile({ domaine: 'assurances', accident_professionnel: true });
      const accident = result.results.find(r => r.rule_id === 'assurance_accident_delai_annonce');
      assert.ok(accident?.applicable);
      assert.ok(accident.consequence.prestations.includes('frais médicaux 100%'));
    });
  });

  describe('voisinage rules', () => {
    it('has at least 3 rules', () => {
      assert.ok(VOISINAGE_RULES.length >= 3, `Only ${VOISINAGE_RULES.length} voisinage rules`);
    });

    it('immissions excessives: applicable si nuisance voisin en bail', () => {
      const result = compile({ domaine: 'bail', nuisance_voisin: true });
      const immissions = result.results.find(r => r.rule_id === 'voisinage_immissions_excessives');
      assert.ok(immissions?.applicable, 'immissions should apply to bail+nuisance_voisin');
    });

    it('arbres distance: 5m haute tige', () => {
      const result = compile({ domaine: 'voisinage', probleme_plantations: true, canton: 'VD' });
      const arbres = result.results.find(r => r.rule_id === 'voisinage_arbres_distance');
      assert.ok(arbres?.applicable);
      assert.equal(arbres.consequence.distance_haute_tige, '5 mètres (à défaut de droit cantonal)');
    });

    it('droit de passage: applicable si enclave', () => {
      const result = compile({ domaine: 'voisinage', enclave: true });
      const passage = result.results.find(r => r.rule_id === 'voisinage_droit_passage');
      assert.ok(passage?.applicable);
    });

    it('zone industrielle = tolérance plus élevée (non bloquant)', () => {
      const result = compile({ domaine: 'voisinage', nuisance_voisin: true, zone_industrielle: true });
      const immissions = result.results.find(r => r.rule_id === 'voisinage_immissions_excessives');
      assert.ok(immissions?.applicable, 'should still be applicable');
      assert.ok(immissions.exceptions.some(e => e.triggered), 'zone industrielle exception should trigger');
    });
  });

  describe('cross-domain rule count', () => {
    it('total rules >= 22 (13 original + 9 new)', () => {
      assert.ok(ALL_RULES.length >= 22, `Only ${ALL_RULES.length} rules, expected >=22`);
    });

    it('rule IDs are all unique', () => {
      const ids = ALL_RULES.map(r => r.id);
      const unique = new Set(ids);
      assert.equal(ids.length, unique.size, 'duplicate rule IDs');
    });
  });
});
