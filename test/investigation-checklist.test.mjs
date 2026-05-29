/**
 * Tests directs — investigation-checklist.mjs
 *
 * 9 suites / 28 tests zéro-LLM zéro-réseau.
 * Cible :
 *  - structure de retour (score, status, summary, results)
 *  - checks conditionnels (type_deces, lieu_deces, rapport_autopsie)
 *  - helper timeDiffHours via alerte_police_immediate (format NhMM)
 *  - helper monthsDiff via celerite (format dd.mm.yyyy)
 *  - calcul des 4 statuts : insuffisant / lacunaire / partiel / suffisant
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkInvestigation } from '../src/services/investigation-checklist.mjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Dossier parfait — tous les 17 checks applicables et satisfaits. */
function perfectDossier() {
  return {
    type_deces: 'suspect',
    lieu_deces: 'domicile',
    heure_decouverte: '18h30',
    heure_alerte_police: '18h45',
    scene_preservee: true,
    scene_nettoyee: false,
    photos_scene: true,
    prelevements_scene: true,
    autopsie_ordonnee: true,
    date_autopsie: '17.07.2022',
    dernier_contact_connu: true,
    temoin_cle_auditionne: true,
    nb_auditions_temoin: 3,
    declarations_verifiees: true,
    telephone_suspect_extrait: true,
    enquete_voisinage: true,
    decouvreur_auditionne: true,
    toxicologie_faite: true,
    prelevements_effectues: ['sang', 'urine', 'cheveux'],
    prelevements_avec_resultats: 3,
    rapport_autopsie_ne_peut_exclure_tiers: true,
    hypothese_tiers_investiguee: true,
    classement: false,
    date_deces: '16.07.2022',
    date_classement: '16.01.2024',
    famille_informee_droits: true,
    tous_acces_verifies: true,
    nb_acces_verifies: 2,
    nb_acces_total: 2,
  };
}

/** Trouve un résultat de check par son ID dans le tableau results. */
function findCheck(r, id) {
  return r.results.find(c => c.check_id === id);
}

// ---------------------------------------------------------------------------
// Suite 1 : structure de retour
// ---------------------------------------------------------------------------

describe('investigation-checklist — structure de retour', () => {
  it('retourne les champs attendus sur dossier vide', () => {
    const r = checkInvestigation({});
    assert.ok(typeof r.score === 'number', 'score manquant');
    assert.ok(typeof r.total_checks === 'number', 'total_checks manquant');
    assert.ok(typeof r.passed === 'number', 'passed manquant');
    assert.ok(typeof r.failed === 'number', 'failed manquant');
    assert.ok(typeof r.critical_failures === 'number', 'critical_failures manquant');
    assert.ok(typeof r.high_failures === 'number', 'high_failures manquant');
    assert.ok(typeof r.status === 'string', 'status manquant');
    assert.ok(Array.isArray(r.results), 'results doit être un tableau');
    assert.ok(r.summary && Array.isArray(r.summary.critique) && Array.isArray(r.summary.haute), 'summary malformé');
  });

  it('dossier vide → status insuffisant (preservation_scene critique toujours applicable)', () => {
    const r = checkInvestigation({});
    assert.equal(r.status, 'insuffisant');
    assert.ok(r.critical_failures >= 1);
    assert.ok(r.summary.critique.some(c => c.id === 'preservation_scene'));
  });

  it('dossier vide → total_checks >= 5 (checks toujours applicables)', () => {
    const r = checkInvestigation({});
    // preservation_scene, fixation_photographique, audition_decouverte,
    // toxicologie_complete, droits_famille_respectes, celerite = 6
    assert.ok(r.total_checks >= 5, `total_checks=${r.total_checks}`);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 : dossier parfait (100%)
// ---------------------------------------------------------------------------

describe('investigation-checklist — dossier parfait', () => {
  it('score = 100 et status = suffisant', () => {
    const r = checkInvestigation(perfectDossier());
    assert.equal(r.score, 100);
    assert.equal(r.status, 'suffisant');
  });

  it('17 checks applicables et satisfaits', () => {
    const r = checkInvestigation(perfectDossier());
    assert.equal(r.total_checks, 17);
    assert.equal(r.passed, 17);
    assert.equal(r.failed, 0);
    assert.equal(r.critical_failures, 0);
  });

  it('summary vide sur dossier parfait', () => {
    const r = checkInvestigation(perfectDossier());
    assert.deepEqual(r.summary.critique, []);
    assert.deepEqual(r.summary.haute, []);
  });
});

// ---------------------------------------------------------------------------
// Suite 3 : checks conditionnels — type_deces
// ---------------------------------------------------------------------------

describe('investigation-checklist — conditionnels type_deces', () => {
  it('type_deces=accidentel → alerte_police_immediate non applicable', () => {
    const r = checkInvestigation({ type_deces: 'accidentel', scene_preservee: true });
    const chk = findCheck(r, 'alerte_police_immediate');
    assert.equal(chk.applicable, false);
  });

  it('type_deces=suspect → alerte_police_immediate applicable', () => {
    const r = checkInvestigation({ type_deces: 'suspect', scene_preservee: true });
    const chk = findCheck(r, 'alerte_police_immediate');
    assert.equal(chk.applicable, true);
  });

  it('type_deces=violent → autopsie_ordonnee applicable', () => {
    const r = checkInvestigation({ type_deces: 'violent', scene_preservee: true });
    const chk = findCheck(r, 'autopsie_ordonnee');
    assert.equal(chk.applicable, true);
  });

  it('type_deces=accidentel → prelevements_scene non applicable', () => {
    const r = checkInvestigation({ type_deces: 'accidentel', scene_preservee: true });
    const chk = findCheck(r, 'prelevements_scene');
    assert.equal(chk.applicable, false);
  });
});

// ---------------------------------------------------------------------------
// Suite 4 : alerte police — timeDiffHours
// ---------------------------------------------------------------------------

describe('investigation-checklist — alerte police délai (timeDiffHours)', () => {
  const base = { type_deces: 'suspect', scene_preservee: true };

  it('délai 15 min → alerte satisfaite', () => {
    const r = checkInvestigation({ ...base, heure_decouverte: '18h30', heure_alerte_police: '18h45' });
    const chk = findCheck(r, 'alerte_police_immediate');
    assert.equal(chk.satisfied, true);
  });

  it('délai exactement 2h → alerte satisfaite (borne ≤ 2)', () => {
    const r = checkInvestigation({ ...base, heure_decouverte: '18h00', heure_alerte_police: '20h00' });
    const chk = findCheck(r, 'alerte_police_immediate');
    assert.equal(chk.satisfied, true);
  });

  it('délai 3h → alerte non satisfaite (critique)', () => {
    const r = checkInvestigation({ ...base, heure_decouverte: '18h00', heure_alerte_police: '21h00' });
    const chk = findCheck(r, 'alerte_police_immediate');
    assert.equal(chk.applicable, true);
    assert.equal(chk.satisfied, false);
    assert.equal(chk.severity, 'critique');
  });

  it('heures manquantes → alerte non satisfaite', () => {
    const r = checkInvestigation({ type_deces: 'suspect', scene_preservee: true });
    const chk = findCheck(r, 'alerte_police_immediate');
    assert.equal(chk.applicable, true);
    assert.equal(chk.satisfied, false);
  });
});

// ---------------------------------------------------------------------------
// Suite 5 : checks domicile conditionnels
// ---------------------------------------------------------------------------

describe('investigation-checklist — conditionnels lieu_deces', () => {
  it('lieu_deces=domicile → enquete_voisinage applicable', () => {
    const r = checkInvestigation({ lieu_deces: 'domicile', scene_preservee: true });
    const chk = findCheck(r, 'enquete_voisinage');
    assert.equal(chk.applicable, true);
  });

  it('lieu_deces=hopital → enquete_voisinage non applicable', () => {
    const r = checkInvestigation({ lieu_deces: 'hopital', scene_preservee: true });
    const chk = findCheck(r, 'enquete_voisinage');
    assert.equal(chk.applicable, false);
  });

  it('lieu_deces=domicile → verification_acces_domicile applicable', () => {
    const r = checkInvestigation({ lieu_deces: 'domicile', scene_preservee: true });
    const chk = findCheck(r, 'verification_acces_domicile');
    assert.equal(chk.applicable, true);
  });
});

// ---------------------------------------------------------------------------
// Suite 6 : prélèvements — résultats communiqués
// ---------------------------------------------------------------------------

describe('investigation-checklist — resultats_prelevements_communiques', () => {
  it('prelevements_effectues absent → check non applicable', () => {
    const r = checkInvestigation({ scene_preservee: true });
    const chk = findCheck(r, 'resultats_prelevements_communiques');
    assert.equal(chk.applicable, false);
  });

  it('3 prélèvements, 3 résultats → check satisfait', () => {
    const r = checkInvestigation({
      scene_preservee: true,
      prelevements_effectues: ['sang', 'urine', 'cheveux'],
      prelevements_avec_resultats: 3,
    });
    const chk = findCheck(r, 'resultats_prelevements_communiques');
    assert.equal(chk.applicable, true);
    assert.equal(chk.satisfied, true);
  });

  it('3 prélèvements, 1 résultat → check non satisfait (haute)', () => {
    const r = checkInvestigation({
      scene_preservee: true,
      prelevements_effectues: ['sang', 'urine', 'cheveux'],
      prelevements_avec_resultats: 1,
    });
    const chk = findCheck(r, 'resultats_prelevements_communiques');
    assert.equal(chk.applicable, true);
    assert.equal(chk.satisfied, false);
    assert.equal(chk.severity, 'haute');
  });
});

// ---------------------------------------------------------------------------
// Suite 7 : instruction bidirectionnelle + in dubio pro duriore
// ---------------------------------------------------------------------------

describe('investigation-checklist — instruction bidirectionnelle + in dubio', () => {
  it('rapport_ne_peut_exclure_tiers=false → les deux checks non applicables', () => {
    const r = checkInvestigation({ scene_preservee: true, rapport_autopsie_ne_peut_exclure_tiers: false });
    assert.equal(findCheck(r, 'instruction_bidirectionnelle').applicable, false);
    assert.equal(findCheck(r, 'in_dubio_pro_duriore').applicable, false);
  });

  it('rapport=true + hypothese_investiguee=true + classement=false → les deux satisfaits', () => {
    const r = checkInvestigation({
      scene_preservee: true,
      rapport_autopsie_ne_peut_exclure_tiers: true,
      hypothese_tiers_investiguee: true,
      classement: false,
    });
    assert.equal(findCheck(r, 'instruction_bidirectionnelle').satisfied, true);
    assert.equal(findCheck(r, 'in_dubio_pro_duriore').satisfied, true);
  });

  it('rapport=true + hypothese_investiguee=false → instruction_bidirectionnelle fail (critique)', () => {
    const r = checkInvestigation({
      scene_preservee: true,
      rapport_autopsie_ne_peut_exclure_tiers: true,
      hypothese_tiers_investiguee: false,
      classement: false,
    });
    const chk = findCheck(r, 'instruction_bidirectionnelle');
    assert.equal(chk.satisfied, false);
    assert.equal(chk.severity, 'critique');
    assert.equal(r.status, 'insuffisant');
  });

  it('rapport=true + classement=true → in_dubio fail (principe violé) → status insuffisant', () => {
    const r = checkInvestigation({
      scene_preservee: true,
      rapport_autopsie_ne_peut_exclure_tiers: true,
      hypothese_tiers_investiguee: true,
      classement: true,
    });
    const chk = findCheck(r, 'in_dubio_pro_duriore');
    assert.equal(chk.satisfied, false);
    assert.equal(chk.severity, 'critique');
    assert.equal(r.status, 'insuffisant');
  });
});

// ---------------------------------------------------------------------------
// Suite 8 : célérité — monthsDiff
// ---------------------------------------------------------------------------

describe('investigation-checklist — celerite (monthsDiff)', () => {
  it('~18 mois (jul 2022 → jan 2024) → celerite satisfaite', () => {
    const r = checkInvestigation({
      scene_preservee: true,
      date_deces: '16.07.2022',
      date_classement: '16.01.2024',
    });
    const chk = findCheck(r, 'celerite');
    assert.equal(chk.applicable, true);
    assert.equal(chk.satisfied, true);
  });

  it('~26 mois (jul 2022 → sep 2024) → celerite non satisfaite', () => {
    const r = checkInvestigation({
      scene_preservee: true,
      date_deces: '16.07.2022',
      date_classement: '16.09.2024',
    });
    const chk = findCheck(r, 'celerite');
    assert.equal(chk.satisfied, false);
  });

  it('dates manquantes → celerite applicable mais non satisfaite', () => {
    const r = checkInvestigation({ scene_preservee: true });
    const chk = findCheck(r, 'celerite');
    assert.equal(chk.applicable, true);
    assert.equal(chk.satisfied, false);
  });
});

// ---------------------------------------------------------------------------
// Suite 9 : calcul du status (insuffisant / lacunaire / partiel / suffisant)
// ---------------------------------------------------------------------------

describe('investigation-checklist — calcul status', () => {
  it('status=lacunaire : pas de critique, > 2 hautes non satisfaites', () => {
    // Satisfait preservation_scene (critique) pour éviter 'insuffisant'
    // type_deces=accidentel → pas de checks suspect/violent → pas de critiques supplémentaires
    // photos_scene, audition_decouverte, toxicologie, droits_famille non satisfaits → 4 hautes
    const r = checkInvestigation({ type_deces: 'accidentel', scene_preservee: true });
    assert.equal(r.critical_failures, 0);
    assert.ok(r.high_failures > 2, `high_failures=${r.high_failures}`);
    assert.equal(r.status, 'lacunaire');
  });

  it('status=partiel : pas de critique, <= 2 hautes non satisfaites, score < 80', () => {
    // Satisfait 4/6 always-applicable → score 66% < 80 ; 2 hautes fail
    const r = checkInvestigation({
      scene_preservee: true,
      toxicologie_faite: true,
      famille_informee_droits: true,
      date_deces: '16.07.2022',
      date_classement: '16.01.2024', // celerite OK
      // photos_scene non satisfait (haute)
      // audition_decouverte non satisfait (haute)
    });
    assert.equal(r.critical_failures, 0);
    assert.ok(r.high_failures <= 2, `high_failures=${r.high_failures}`);
    assert.ok(r.score < 80, `score=${r.score}`);
    assert.equal(r.status, 'partiel');
  });

  it('status=suffisant : score >= 80, pas de critique, <= 2 hautes', () => {
    const r = checkInvestigation(perfectDossier());
    assert.equal(r.score, 100);
    assert.equal(r.critical_failures, 0);
    assert.equal(r.status, 'suffisant');
  });

  it('status=insuffisant : au moins 1 critique non satisfaite', () => {
    // preservation_scene = critique, toujours applicable, vérification scene_preservee=true
    // si scene_preservee n'est pas true → critique fail → insuffisant
    const r = checkInvestigation({ scene_preservee: false });
    assert.ok(r.critical_failures >= 1);
    assert.equal(r.status, 'insuffisant');
  });
});
