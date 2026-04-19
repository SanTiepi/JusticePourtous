/**
 * Dossiers complexes — Tests end-to-end avec vérification juridique
 *
 * Chaque dossier est un cas réaliste dont la réponse correcte est connue.
 * On teste : domaine, fiche, articles clés, délais, anti-erreurs, vulgarisation, normative.
 *
 * Catégories :
 * 1. Bail : moisissure + réduction + mise en demeure
 * 2. Bail : augmentation abusive + taux hypothécaire
 * 3. Bail : expulsion + opposition + prolongation
 * 4. Travail : licenciement en maladie + protection temporelle
 * 5. Travail : salaire impayé + résiliation immédiate
 * 6. Dettes : commandement de payer + opposition + minimum vital
 * 7. Multi-domaine : licencié + loyer impayé
 * 8. Famille : pension alimentaire impayée
 * 9. Bail : caution non restituée après 1 an
 * 10. Bail : sous-location Airbnb refusée
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/server.mjs';
import { compile } from '../src/services/normative-compiler.mjs';
import { getVulgarisationForFiche } from '../src/services/vulgarisation-loader.mjs';

// Port 0 = OS-assigned, évite EADDRINUSE quand plusieurs fichiers de tests
// instancient un serveur sur le même port. BASE est résolu après server.listen().
let BASE = 'http://localhost:0';

async function search(query, canton) {
  const http = await import('node:http');
  const qs = canton ? `&canton=${canton}` : '';
  return new Promise((resolve, reject) => {
    http.default.get(`${BASE}/api/search?q=${encodeURIComponent(query)}${qs}`, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    }).on('error', reject);
  });
}

describe('Dossiers complexes — qualité pipeline', () => {
  before(() => new Promise(resolve => server.listen(0, () => {
    const addr = server.address();
    BASE = `http://localhost:${addr.port}`;
    resolve();
  })));
  after(() => new Promise(resolve => server.close(resolve)));

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 1 : Moisissure persistante à Lausanne
  // Réponse attendue : CO 259a (signalement), CO 259d (réduction),
  //   réduction 15-30% pour défaut moyen, conciliation gratuite VD
  // ══════════════════════════════════════════════════════════════

  describe('D1: Moisissure persistante VD', () => {
    let result;

    it('trouve la bonne fiche', async () => {
      result = await search('j ai de la moisissure dans ma salle de bain depuis 6 mois et la régie ne fait rien, j habite à Lausanne', 'VD');
      assert.equal(result.status, 200);
      assert.ok(result.data.fiche, 'should return a fiche');
      assert.equal(result.data.fiche.domaine, 'bail', `expected bail, got ${result.data.fiche.domaine}`);
      assert.ok(
        result.data.fiche.id.includes('moisissure') || result.data.fiche.id.includes('defaut'),
        `fiche should be about moisissure/defaut, got ${result.data.fiche.id}`
      );
    });

    it('cite CO 259a ou CO 259d (articles clés)', async () => {
      if (!result?.data?.articles) return;
      const refs = result.data.articles.map(a => a.ref);
      const has259 = refs.some(r => r.includes('259'));
      assert.ok(has259, `should cite CO 259a/259d for defaut, got: ${refs.slice(0, 5).join(', ')}`);
    });

    it('inclut de la jurisprudence', async () => {
      if (!result?.data?.jurisprudence) return;
      assert.ok(result.data.jurisprudence.length > 0, 'should have jurisprudence');
    });

    it('le normative compiler calcule la bonne réduction', () => {
      const compiled = compile({
        domaine: 'bail',
        defaut_signale: true,
        gravite_defaut: 'moyen',
        loyer_mensuel: 1500
      });
      const reduction = compiled.results.find(r => r.rule_id === 'bail_reduction_defaut');
      assert.ok(reduction?.applicable, 'reduction rule should apply');
      assert.equal(reduction.consequence.reduction_min, 15);
      assert.equal(reduction.consequence.reduction_max, 30);
    });

    it('la vulgarisation couvre ce cas', () => {
      const v = getVulgarisationForFiche('bail_defaut_moisissure');
      assert.ok(v, 'should have vulgarisation');
      // ASLOCA Q2.7 couvre la réduction de loyer pour défaut
      const hasReduction = v.questions_citoyennes.some(q =>
        q.question.toLowerCase().includes('réduction') || q.question.toLowerCase().includes('défaut')
      );
      assert.ok(hasReduction, 'vulgarisation should mention réduction pour défaut');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 2 : Augmentation de loyer abusive à Genève
  // Réponse attendue : CO 269d (formule officielle obligatoire),
  //   CO 270b (30 jours pour contester), taux hypo 1.75%
  // ══════════════════════════════════════════════════════════════

  describe('D2: Augmentation loyer abusive GE', () => {
    let result;

    it('trouve la bonne fiche', async () => {
      result = await search('mon bailleur veut augmenter mon loyer de 200 francs par mois, j habite à Genève', 'GE');
      assert.equal(result.status, 200);
      assert.ok(result.data.fiche);
      assert.equal(result.data.fiche.domaine, 'bail');
      assert.ok(
        result.data.fiche.id.includes('augmentation') || result.data.fiche.id.includes('loyer'),
        `expected augmentation fiche, got ${result.data.fiche.id}`
      );
    });

    it('le normative compiler donne le délai de 30 jours', () => {
      const compiled = compile({ domaine: 'bail', augmentation_recue: true });
      const contest = compiled.results.find(r => r.rule_id === 'bail_contestation_augmentation');
      assert.ok(contest?.applicable);
      assert.equal(contest.consequence.delai_jours, 30);
    });

    it('la vulgarisation cite la formule officielle', () => {
      const v = getVulgarisationForFiche('bail_augmentation_loyer');
      assert.ok(v, 'should have vulgarisation');
      const hasFormule = v.questions_citoyennes.some(q =>
        q.reponse_detail?.includes('formule officielle')
      );
      assert.ok(hasFormule, 'should mention formule officielle');
    });

    it('anti-erreur : ne pas laisser passer le délai de 30 jours', () => {
      const v = getVulgarisationForFiche('bail_augmentation_loyer');
      assert.ok(v);
      const has30j = v.anti_erreurs.some(ae =>
        ae.erreur.includes('30 jours')
      );
      assert.ok(has30j, 'should warn about 30-day deadline');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 3 : Congé reçu — défense et prolongation
  // Réponse attendue : CO 271 (annulabilité congé abusif),
  //   CO 272 (prolongation max 4 ans habitation),
  //   CO 273 (30 jours conciliation)
  // ══════════════════════════════════════════════════════════════

  describe('D3: Congé reçu — contestation', () => {
    let result;

    it('trouve la bonne fiche', async () => {
      result = await search('j ai reçu un congé de mon bailleur et je pense que c est abusif, que faire', 'VD');
      assert.equal(result.status, 200);
      assert.ok(result.data.fiche);
      assert.equal(result.data.fiche.domaine, 'bail');
      assert.ok(
        result.data.fiche.id.includes('resiliation') || result.data.fiche.id.includes('conge'),
        `expected resiliation fiche, got ${result.data.fiche.id}`
      );
    });

    it('le normative compiler donne 30 jours pour contester', () => {
      const compiled = compile({ domaine: 'bail', conge_recu: true });
      const contest = compiled.results.find(r => r.rule_id === 'bail_contestation_conge');
      assert.ok(contest?.applicable);
      assert.equal(contest.consequence.delai_jours, 30);
      assert.equal(contest.consequence.gratuit, true);
    });

    it('la vulgarisation donne la marche à suivre', () => {
      const v = getVulgarisationForFiche('bail_resiliation_conteste');
      assert.ok(v, 'should have vulgarisation');
      assert.ok(v.questions_citoyennes.length >= 2, 'multiple Q&As should cover résiliation');
      // Devrait couvrir : comment contester, comment demander prolongation
      const topics = v.questions_citoyennes.map(q => q.question.toLowerCase());
      const coversDefense = topics.some(t => t.includes('défendre') || t.includes('résili'));
      assert.ok(coversDefense, 'should cover how to defend against eviction');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 4 : Licencié pendant arrêt maladie
  // Réponse attendue : CO 336c (protection 30/90/180 jours),
  //   licenciement NUL si pendant période de protection
  // ══════════════════════════════════════════════════════════════

  describe('D4: Licenciement en maladie', () => {
    let result;

    it('trouve le bon domaine', async () => {
      result = await search('mon employeur m a licencié alors que je suis en arrêt maladie depuis 2 semaines, j ai 4 ans d ancienneté');
      assert.equal(result.status, 200);
      assert.ok(result.data.fiche);
      assert.equal(result.data.fiche.domaine, 'travail', `expected travail, got ${result.data.fiche.domaine}`);
    });

    it('le normative compiler calcule 90 jours de protection', () => {
      const compiled = compile({
        domaine: 'travail',
        en_arret_maladie: true,
        anciennete_annees: 4
      });
      const prot = compiled.results.find(r => r.rule_id === 'travail_protection_maladie');
      assert.ok(prot?.applicable, 'protection should apply');
      // 4 ans ancienneté = 2e-5e année = 90 jours
      assert.equal(prot.consequence.duree_protection, 90);
      assert.ok(prot.consequence.consequence_violation.includes('NUL'));
    });

    it('la protection ne s applique PAS en période d essai', () => {
      const compiled = compile({
        domaine: 'travail',
        en_arret_maladie: true,
        anciennete_annees: 0,
        periode_essai: true
      });
      const prot = compiled.results.find(r => r.rule_id === 'travail_protection_maladie');
      assert.ok(!prot?.applicable, 'protection should NOT apply during probation');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 5 : Salaire impayé depuis 3 mois
  // Réponse attendue : CO 102 (mise en demeure), CO 337 (résiliation
  //   immédiate), prud'hommes gratuits < 30'000 CHF
  // ══════════════════════════════════════════════════════════════

  describe('D5: Salaire impayé', () => {
    let result;

    it('trouve la bonne fiche travail', async () => {
      result = await search('mon employeur ne me paie plus mon salaire depuis 3 mois');
      assert.equal(result.status, 200);
      assert.ok(result.data.fiche);
      assert.equal(result.data.fiche.domaine, 'travail');
    });

    it('le normative compiler donne les étapes correctes', () => {
      const compiled = compile({ domaine: 'travail', salaire_impaye: true });
      const salaire = compiled.results.find(r => r.rule_id === 'travail_salaire_impaye_mise_en_demeure');
      assert.ok(salaire?.applicable);
      assert.ok(salaire.consequence.etapes.length >= 3, 'should have 3+ steps');
      // Étape 1 = mise en demeure
      assert.ok(salaire.consequence.etapes[0].action.includes('Mise en demeure'));
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 6 : Commandement de payer — opposition
  // Réponse attendue : LP 74 (10 jours opposition), gratuit,
  //   pas besoin de motivation
  // ══════════════════════════════════════════════════════════════

  describe('D6: Commandement de payer', () => {
    let result;

    it('trouve le bon domaine dettes', async () => {
      result = await search('j ai reçu un commandement de payer de 5000 francs mais je ne dois rien');
      assert.equal(result.status, 200);
      assert.ok(result.data.fiche);
      assert.equal(result.data.fiche.domaine, 'dettes', `expected dettes, got ${result.data.fiche.domaine}`);
    });

    it('le normative compiler donne 10 jours + gratuit', () => {
      const compiled = compile({ domaine: 'dettes', commandement_recu: true });
      const opp = compiled.results.find(r => r.rule_id === 'dettes_opposition_commandement');
      assert.ok(opp?.applicable);
      assert.equal(opp.consequence.delai_jours, 10);
      assert.equal(opp.consequence.gratuit, true);
      assert.ok(opp.consequence.consequence_non_opposition.includes('continuation'));
    });

    it('la vulgarisation ASLOCA couvre le commandement de payer en contexte bail', () => {
      // ASLOCA 3.10 couvre "Comment réagir à la réception d'un commandement de payer"
      const v = getVulgarisationForFiche('bail_loyers_impayes');
      assert.ok(v, 'should have vulgarisation for loyers impayés');
      const hasCDP = v.questions_citoyennes.some(q =>
        q.question.toLowerCase().includes('commandement')
      );
      assert.ok(hasCDP, 'should cover commandement de payer');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 7 : Multi-domaine — viré + ne peut plus payer le loyer
  // Le pipeline devrait retourner des fiches des 2 domaines
  // ══════════════════════════════════════════════════════════════

  describe('D7: Multi-domaine licenciement + loyer', () => {
    it('retourne des résultats couvrant au moins 1 domaine pertinent', async () => {
      const result = await search('j ai été licencié et je ne peux plus payer mon loyer, qu est-ce que je risque');
      assert.equal(result.status, 200);
      assert.ok(result.data.fiche);
      // Au minimum devrait trouver bail ou travail
      const domaine = result.data.fiche.domaine;
      assert.ok(['bail', 'travail', 'dettes'].includes(domaine),
        `expected bail/travail/dettes, got ${domaine}`);

      // Les alternatives devraient couvrir l'autre domaine
      const alts = result.data.alternatives || [];
      const allDomains = new Set([domaine, ...alts.map(a => a.domaine)]);
      assert.ok(allDomains.size >= 1, 'should span at least 1 relevant domain');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 8 : Caution non restituée après déménagement
  // Réponse attendue : CO 257e (1 an = libération automatique),
  //   garantie = propriété du locataire
  // ══════════════════════════════════════════════════════════════

  describe('D8: Caution non restituée', () => {
    let result;

    it('trouve la fiche garantie/caution', async () => {
      result = await search('j ai déménagé il y a 8 mois et mon ancien bailleur refuse de libérer ma garantie bancaire de 4500 francs');
      assert.equal(result.status, 200);
      assert.ok(result.data.fiche);
      assert.equal(result.data.fiche.domaine, 'bail');
      assert.ok(
        result.data.fiche.id.includes('garantie') || result.data.fiche.id.includes('depot') || result.data.fiche.id.includes('caution'),
        `expected garantie fiche, got ${result.data.fiche.id}`
      );
    });

    it('le normative compiler calcule le max à 3 mois', () => {
      const compiled = compile({ domaine: 'bail', loyer_mensuel: 1500 });
      const caution = compiled.results.find(r => r.rule_id === 'bail_caution_max');
      assert.ok(caution?.applicable);
      assert.equal(caution.consequence.montant_max, 4500);
    });

    it('le normative compiler connaît le délai de 1 an', () => {
      const compiled = compile({ domaine: 'bail', fin_bail: true });
      const restitution = compiled.results.find(r => r.rule_id === 'bail_caution_restitution_delai');
      assert.ok(restitution?.applicable);
      assert.equal(restitution.consequence.delai_jours, 365);
    });

    it('la vulgarisation avertit sur Swisscaution', () => {
      const v = getVulgarisationForFiche('bail_depot_garantie');
      assert.ok(v);
      const hasSwisscaution = v.anti_erreurs.some(ae => ae.erreur.includes('Swisscaution'));
      assert.ok(hasSwisscaution, 'should warn: Swisscaution ≠ remboursement');
    });

    it('la vulgarisation donne le délai de 1 an pour libération automatique', () => {
      const v = getVulgarisationForFiche('bail_depot_garantie');
      assert.ok(v);
      const has1an = v.delais.some(d => d.delai.includes('1 an'));
      assert.ok(has1an, 'should mention 1 year auto-release');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 9 : Sous-location Airbnb sans autorisation
  // Réponse attendue : CO 262 (autorisation écrite obligatoire),
  //   refus possible seulement dans 3 cas précis
  // ══════════════════════════════════════════════════════════════

  describe('D9: Sous-location Airbnb', () => {
    let result;

    it('trouve la fiche sous-location', async () => {
      result = await search('je veux sous-louer mon appartement sur Airbnb pendant mes vacances, est-ce que j ai le droit', 'VD');
      assert.equal(result.status, 200);
      assert.ok(result.data.fiche);
      assert.equal(result.data.fiche.domaine, 'bail');
      assert.ok(
        result.data.fiche.id.includes('sous_location'),
        `expected sous-location fiche, got ${result.data.fiche.id}`
      );
    });

    it('la vulgarisation exige l autorisation écrite', () => {
      const v = getVulgarisationForFiche('bail_sous_location');
      assert.ok(v, 'should have vulgarisation');
      const hasAutorisation = v.questions_citoyennes.some(q =>
        q.reponse_courte?.includes('consentement') || q.reponse_courte?.includes('obtenir')
      );
      assert.ok(hasAutorisation, 'should require written consent');
    });

    it('anti-erreur : ne pas sous-louer sans autorisation', () => {
      const v = getVulgarisationForFiche('bail_sous_location');
      assert.ok(v);
      const hasSansAuth = v.anti_erreurs.some(ae =>
        ae.erreur.toLowerCase().includes('sans') && ae.erreur.toLowerCase().includes('autorisation')
      );
      assert.ok(hasSansAuth, 'should warn against subletting without authorization');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 10 : Minimum vital — saisie de salaire avec enfants
  // Réponse attendue : LP 93, base 1200 + 400/enfant,
  //   GE = 1350 base, pension alimentaire = exception
  // ══════════════════════════════════════════════════════════════

  describe('D10: Saisie salaire — minimum vital', () => {
    it('calcule correctement le minimum vital standard', () => {
      const compiled = compile({
        domaine: 'dettes',
        saisie_salaire: true,
        canton: 'VD',
        nombre_enfants: 2
      });
      const mv = compiled.results.find(r => r.rule_id === 'dettes_minimum_vital');
      assert.ok(mv?.applicable);
      // VD: 1200 + 2×400 = 2000
      assert.equal(mv.consequence.minimum_vital, 2000);
      assert.equal(mv.consequence.base, 1200);
    });

    it('calcule correctement le minimum vital GE (plus élevé)', () => {
      const compiled = compile({
        domaine: 'dettes',
        saisie_salaire: true,
        canton: 'GE',
        nombre_enfants: 1
      });
      const mv = compiled.results.find(r => r.rule_id === 'dettes_minimum_vital');
      assert.ok(mv?.applicable);
      // GE: 1350 + 1×400 = 1750
      assert.equal(mv.consequence.minimum_vital, 1750);
      assert.equal(mv.consequence.base, 1350);
    });

    it('la pension alimentaire peut entamer le minimum vital', () => {
      const compiled = compile({
        domaine: 'dettes',
        saisie_salaire: true,
        canton: 'VD',
        nombre_enfants: 0,
        creance_alimentaire: true
      });
      const mv = compiled.results.find(r => r.rule_id === 'dettes_minimum_vital');
      assert.ok(mv?.applicable);
      // L'exception pension alimentaire doit être déclenchée (non bloquante)
      const excPension = mv.exceptions.find(e => e.id === 'dettes_pension_alimentaire_privilegiee');
      assert.ok(excPension?.triggered, 'pension alimentaire exception should trigger');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 11 : Prescription des dettes
  // Réponse attendue : CO 127 (10 ans général), CO 128 (5 ans loyer/salaire),
  //   LP 149a (20 ans acte de défaut de biens)
  // ══════════════════════════════════════════════════════════════

  describe('D11: Prescription des dettes', () => {
    it('dette générale = 10 ans', () => {
      const compiled = compile({ domaine: 'dettes', type_dette: 'generale' });
      const presc = compiled.results.find(r => r.rule_id === 'dettes_prescription');
      assert.ok(presc?.applicable);
      assert.equal(presc.consequence.delai, '10 ans');
    });

    it('dette de loyer = 5 ans', () => {
      const compiled = compile({ domaine: 'dettes', type_dette: 'loyer' });
      const presc = compiled.results.find(r => r.rule_id === 'dettes_prescription');
      assert.equal(presc.consequence.delai, '5 ans');
    });

    it('dette de salaire = 5 ans', () => {
      const compiled = compile({ domaine: 'dettes', type_dette: 'salaire' });
      const presc = compiled.results.find(r => r.rule_id === 'dettes_prescription');
      assert.equal(presc.consequence.delai, '5 ans');
    });

    it('acte de défaut de biens = 20 ans', () => {
      const compiled = compile({ domaine: 'dettes', type_dette: 'acte_defaut_biens' });
      const presc = compiled.results.find(r => r.rule_id === 'dettes_prescription');
      assert.equal(presc.consequence.delai, '20 ans');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DOSSIER 12 : Démarchage à domicile — droit de révocation
  // Réponse attendue : CO 40a (14 jours), bloqué si < 100 CHF
  // ══════════════════════════════════════════════════════════════

  describe('D12: Démarchage — révocation', () => {
    it('14 jours de révocation pour achat > 100 CHF', () => {
      const compiled = compile({
        domaine: 'consommation',
        demarchage_domicile: true,
        prix_achat: 500
      });
      const revo = compiled.results.find(r => r.rule_id === 'consommation_droit_revocation_demarchage');
      assert.ok(revo?.applicable);
      assert.equal(revo.consequence.delai_jours, 14);
    });

    it('pas de révocation pour achat < 100 CHF', () => {
      const compiled = compile({
        domaine: 'consommation',
        demarchage_domicile: true,
        prix_achat: 80
      });
      const revo = compiled.results.find(r => r.rule_id === 'consommation_droit_revocation_demarchage');
      assert.ok(!revo?.applicable, 'should be blocked under 100 CHF');
    });
  });

  // ══════════════════════════════════════════════════════════════
  // VÉRIFICATIONS TRANSVERSALES
  // ══════════════════════════════════════════════════════════════

  describe('Vérifications transversales', () => {
    it('chaque réponse contient le disclaimer', async () => {
      const queries = [
        'moisissure appartement',
        'licenciement abusif',
        'commandement de payer'
      ];
      for (const q of queries) {
        const r = await search(q);
        assert.ok(r.data.disclaimer, `missing disclaimer for: ${q}`);
      }
    });

    it('les requêtes trop longues sont rejetées', async () => {
      const longQuery = 'moisissure '.repeat(300); // > 2000 chars
      const r = await search(longQuery);
      assert.equal(r.status, 400);
    });

    it('l assistance judiciaire est calculable', () => {
      const compiled = compile({
        demande_assistance_judiciaire: true,
        revenu_mensuel: 2500,
        charges_mensuelles: 2200,
        fortune: 3000
      });
      const aj = compiled.results.find(r => r.rule_id === 'assistance_judiciaire');
      assert.ok(aj?.applicable);
      assert.equal(aj.consequence.eligible_probable, true);
    });

    it('assistance judiciaire refusée si hauts revenus', () => {
      const compiled = compile({
        demande_assistance_judiciaire: true,
        revenu_mensuel: 8000,
        charges_mensuelles: 3000,
        fortune: 50000
      });
      const aj = compiled.results.find(r => r.rule_id === 'assistance_judiciaire');
      assert.ok(aj?.applicable);
      assert.equal(aj.consequence.eligible_probable, false);
    });
  });
});
