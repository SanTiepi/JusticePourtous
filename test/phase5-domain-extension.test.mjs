import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  compile,
  getRulesForDomain,
  FAMILLE_RULES,
  ETRANGERS_RULES,
  SOCIAL_RULES,
  VIOLENCE_RULES,
  ACCIDENT_RULES,
  ENTREPRISE_RULES
} from '../src/services/normative-compiler.mjs';

// ============================================================
// Structure — chaque domaine étendu a ≥ 2 règles bien formées
// ============================================================

describe('Phase 5 — structure règles étendues', () => {
  const groups = [
    { name: 'famille', rules: FAMILLE_RULES },
    { name: 'etrangers', rules: ETRANGERS_RULES },
    { name: 'social', rules: SOCIAL_RULES },
    { name: 'violence', rules: VIOLENCE_RULES },
    { name: 'accident', rules: ACCIDENT_RULES },
    { name: 'entreprise', rules: ENTREPRISE_RULES }
  ];

  for (const { name, rules } of groups) {
    it(`${name} : ≥ 2 règles définies`, () => {
      assert.ok(rules.length >= 2, `${name} a ${rules.length} règles, attendu ≥ 2`);
    });

    it(`${name} : chaque règle a id, label, base_legale, source_ids non-vides`, () => {
      for (const r of rules) {
        assert.ok(r.id, `règle sans id : ${JSON.stringify(r).slice(0, 80)}`);
        assert.ok(r.label);
        assert.ok(r.base_legale);
        assert.ok(Array.isArray(r.source_ids) && r.source_ids.length > 0, `${r.id} : source_ids vide`);
      }
    });

    it(`${name} : chaque règle a condition (fn) et consequence (fn)`, () => {
      for (const r of rules) {
        assert.equal(typeof r.condition, 'function', `${r.id} : condition absente`);
        assert.equal(typeof r.consequence, 'function', `${r.id} : consequence absente`);
      }
    });
  }
});

// ============================================================
// Famille
// ============================================================

describe('Phase 5 — famille', () => {
  it('pension enfant : applicable, fourchette présente', () => {
    const r = compile({ domaine: 'famille', type_pension: 'enfant', enfants_a_charge: 2 });
    const pension = r.results.find(x => x.rule_id === 'famille_pension_enfant');
    assert.ok(pension);
    assert.equal(pension.applicable, true);
    assert.ok(pension.consequence.fourchette_mensuelle_chf);
    assert.ok(pension.consequence.fourchette_mensuelle_chf.mediane > 0);
  });

  it('pension enfant : exception minimum vital', () => {
    const r = compile({ domaine: 'famille', type_pension: 'enfant', minimum_vital_respecte: false });
    const pension = r.results.find(x => x.rule_id === 'famille_pension_enfant');
    assert.ok(pension.exceptions.some(e => e.id === 'famille_pension_capacite_insuffisante'));
  });

  it('autorité parentale : conjointe par défaut CC 296', () => {
    const r = compile({ domaine: 'famille', type_question: 'autorite_parentale' });
    const auth = r.results.find(x => x.rule_id === 'famille_autorite_parentale_conjointe');
    assert.ok(auth);
    assert.equal(auth.applicable, true);
    assert.match(auth.base_legale, /CC 296/);
  });
});

// ============================================================
// Étrangers
// ============================================================

describe('Phase 5 — etrangers', () => {
  it('permis B renouvellement : délai 3 mois avant expiration', () => {
    const r = compile({ domaine: 'etrangers', type_permis: 'B', renouvellement: true, canton: 'VD' });
    const rule = r.results.find(x => x.rule_id === 'etrangers_permis_renouvellement_delai');
    assert.ok(rule);
    assert.equal(rule.applicable, true);
    assert.match(rule.consequence.delai_recommande, /3 mois/);
    assert.match(rule.consequence.autorite_competente, /VD/);
  });

  it('recours asile étendu : 30 jours', () => {
    const r = compile({ domaine: 'etrangers', type_procedure: 'asile', decision_sem: true });
    const rule = r.results.find(x => x.rule_id === 'etrangers_asile_recours_delai');
    assert.equal(rule.consequence.delai_jours, 30);
  });

  it('recours asile accéléré : 7 jours', () => {
    const r = compile({ domaine: 'etrangers', type_procedure: 'asile', procedure_acceleree: true });
    const rule = r.results.find(x => x.rule_id === 'etrangers_asile_recours_delai');
    assert.equal(rule.consequence.delai_jours, 7);
  });

  it('Dublin : exception 5 jours', () => {
    const r = compile({ domaine: 'etrangers', type_procedure: 'asile', procedure_dublin: true });
    const rule = r.results.find(x => x.rule_id === 'etrangers_asile_recours_delai');
    assert.ok(rule.exceptions.some(e => e.id === 'etrangers_asile_cas_dublin'));
  });
});

// ============================================================
// Social
// ============================================================

describe('Phase 5 — social', () => {
  it('forfait CSIAS personne seule : 1031 CHF', () => {
    const r = compile({ domaine: 'social', type_aide: 'aide_sociale', taille_menage: 1 });
    const rule = r.results.find(x => x.rule_id === 'social_forfait_base_csias');
    assert.equal(rule.consequence.forfait_chf, 1031);
  });

  it('forfait CSIAS ménage 4 personnes : 2207 CHF', () => {
    const r = compile({ domaine: 'social', type_aide: 'aide_sociale', taille_menage: 4 });
    const rule = r.results.find(x => x.rule_id === 'social_forfait_base_csias');
    assert.equal(rule.consequence.forfait_chf, 2207);
  });

  it('recours décision : 30 jours typique', () => {
    const r = compile({ domaine: 'social', decision_aide: true });
    const rule = r.results.find(x => x.rule_id === 'social_recours_decision_delai');
    assert.equal(rule.consequence.delai_jours_typique, 30);
  });
});

// ============================================================
// Violence
// ============================================================

describe('Phase 5 — violence', () => {
  it('plainte pénale : 3 mois CP 31', () => {
    const r = compile({ domaine: 'violence', infraction_plainte: true });
    const rule = r.results.find(x => x.rule_id === 'violence_plainte_penale_delai');
    assert.equal(rule.consequence.delai_mois, 3);
    assert.match(rule.base_legale, /CP 31/);
  });

  it('infraction poursuivie d\'office : exception bloque', () => {
    const r = compile({ domaine: 'violence', infraction_plainte: true, poursuite_office: true });
    const rule = r.results.find(x => x.rule_id === 'violence_plainte_penale_delai');
    assert.ok(rule.exceptions.some(e => e.id === 'violence_infraction_office'));
  });

  it('LAVI : aide immédiate sans conditions financières', () => {
    const r = compile({ domaine: 'violence', victime: true });
    const rule = r.results.find(x => x.rule_id === 'violence_lavi_aide_immediate');
    assert.equal(rule.consequence.sans_conditions_financieres, true);
  });
});

// ============================================================
// Accident
// ============================================================

describe('Phase 5 — accident', () => {
  it('déclaration employeur LAA 45 : sans retard', () => {
    const r = compile({ domaine: 'accident', accident_travail: true });
    const rule = r.results.find(x => x.rule_id === 'accident_declaration_employeur');
    assert.match(rule.base_legale, /LAA 45/);
    assert.equal(rule.consequence.qui_annonce.toLowerCase().includes('employeur'), true);
  });

  it('prescription RC : 3 ans / 10 ans CO 60', () => {
    const r = compile({ domaine: 'accident', responsabilite_civile: true });
    const rule = r.results.find(x => x.rule_id === 'accident_rc_prescription');
    assert.match(rule.consequence.delai_relatif, /3 ans/);
    assert.match(rule.consequence.delai_absolu, /10 ans/);
  });

  it('dommage corporel : exception 20 ans absolu', () => {
    const r = compile({ domaine: 'accident', responsabilite_civile: true, dommage_corporel: true });
    const rule = r.results.find(x => x.rule_id === 'accident_rc_prescription');
    assert.ok(rule.exceptions.some(e => e.id === 'accident_dommage_corporel'));
  });
});

// ============================================================
// Entreprise
// ============================================================

describe('Phase 5 — entreprise', () => {
  it('opposition faillite : 10 jours LP 174', () => {
    const r = compile({ domaine: 'entreprise', commination_faillite: true });
    const rule = r.results.find(x => x.rule_id === 'entreprise_faillite_opposition_delai');
    assert.equal(rule.consequence.delai_jours, 10);
    assert.match(rule.base_legale, /LP/);
  });

  it('SARL : capital minimum 20\'000 CHF CO 773', () => {
    const r = compile({ domaine: 'entreprise', forme_juridique: 'sarl' });
    const rule = r.results.find(x => x.rule_id === 'entreprise_sarl_capital_minimum');
    assert.equal(rule.consequence.capital_minimum_chf, 20000);
    assert.match(rule.base_legale, /CO 773/);
  });
});

// ============================================================
// Registry integrity
// ============================================================

describe('Phase 5 — chaque domaine a au moins 1 règle activable', () => {
  // Faits minimaux qui activent ≥ 1 règle par domaine
  const probes = [
    { dom: 'bail', facts: { domaine: 'bail' } },
    { dom: 'travail', facts: { domaine: 'travail', anciennete_annees: 5 } },
    { dom: 'dettes', facts: { domaine: 'dettes' } },
    { dom: 'famille', facts: { domaine: 'famille', enfants_a_charge: 1, type_pension: 'enfant' } },
    { dom: 'etrangers', facts: { domaine: 'etrangers', type_permis: 'B', renouvellement: true } },
    { dom: 'assurances', facts: { domaine: 'assurances', difficulte_primes_lamal: true } },
    { dom: 'social', facts: { domaine: 'social', type_aide: 'aide_sociale' } },
    { dom: 'violence', facts: { domaine: 'violence', victime: true } },
    { dom: 'accident', facts: { domaine: 'accident', accident_travail: true } },
    { dom: 'entreprise', facts: { domaine: 'entreprise', commination_faillite: true } }
  ];

  for (const { dom, facts } of probes) {
    it(`${dom} : ≥ 1 règle applicable avec faits minimaux`, () => {
      const r = compile(facts);
      assert.ok(r.rules_applicable >= 1, `${dom} : aucune règle applicable — extension V3 incomplète`);
    });
  }
});

describe('Phase 5 — source_ids format', () => {
  const allExtended = [
    ...FAMILLE_RULES, ...ETRANGERS_RULES, ...SOCIAL_RULES,
    ...VIOLENCE_RULES, ...ACCIDENT_RULES, ...ENTREPRISE_RULES
  ];

  it('source_ids suivent le format <scheme>:<ref>', () => {
    for (const r of allExtended) {
      for (const sid of r.source_ids) {
        assert.match(sid, /^[a-z]+:[a-z0-9.\-:]+$/i, `source_id invalide: ${sid} (règle ${r.id})`);
      }
    }
  });
});
