import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// Phase Cortex 4 — Cascades sur les 74 fiches NOT_ACTIONABLE
//
// Baseline (phases 1+2) : 71 fiches avec cascade.
// Cible Phase 4         : +≥50 nouvelles cascades couvrant les fiches
//                         identifiées par audit-fiches-schema.mjs --strict
//                         comme STRICT_NOT_ACTIONABLE.
// Résultat attendu      : ≥121 fiches avec cascade, 100% des fiches
//                         famille/social/violence/entreprise/travail couvertes
//                         sauf celles déjà hors-scope (INVALID_ENUM côté sante/succession).
// ============================================================================

const FICHES_DIR = 'src/data/fiches';
const ALL_DOMAINS = [
  'bail', 'travail', 'dettes', 'etrangers', 'famille',
  'accident', 'assurances', 'social', 'violence', 'entreprise',
  'consommation', 'voisinage', 'circulation'
];

// 74 IDs nouvellement enrichies lors de la phase 4
const PHASE4_NEW_CASCADE_IDS = [
  // famille (14)
  'famille_mariage_etranger', 'famille_partenariat_enregistre', 'famille_enlevement_international',
  'famille_reconnaissance_paternite_procedure', 'famille_nom_famille', 'famille_regime_matrimonial',
  'famille_liquidation_regime', 'famille_succession_ab_intestat', 'famille_pacte_successoral',
  'famille_reserve_hereditaire', 'famille_indignite_successorale', 'famille_executeur_testamentaire',
  'famille_usufruit_conjoint', 'famille_droit_retour',
  // violence (7)
  'violence_foyer_accueil', 'violence_eloignement_domicile_penal', 'violence_mariage_force',
  'violence_stalking_harcelement', 'violence_foyer_refuge', 'violence_psychologique_preuves',
  'violence_garde_enfants',
  // social (7)
  'social_remboursement_aide', 'social_sanspapiers_aide_urgence', 'social_csias_forfait',
  'social_personne_agee_prestations', 'social_dettes_coexistence', 'social_dignite_minimale',
  'social_reinsertion_professionnelle',
  // entreprise (6)
  'entreprise_sursis_concordataire', 'entreprise_creation_sarl', 'entreprise_creation_sa',
  'entreprise_conflit_associes_sarl', 'entreprise_dissolution_societe',
  'entreprise_surendettement_personne_morale',
  // travail (8)
  'travail_secret_professionnel', 'travail_orp_inscription', 'travail_convention_collective',
  'travail_temporaire', 'travail_stagiaire', 'travail_apprenti', 'travail_gratification',
  'travail_surveillance',
  // etrangers (14)
  'etranger_permis_travail', 'etranger_naturalisation_facilitee', 'etranger_integration_criteres',
  'etranger_cours_langue_obligatoires', 'etranger_aide_sociale_permis', 'etranger_travail_asile',
  'etranger_permis_frontalier_g', 'etranger_detachement_travailleurs', 'etranger_reconnaissance_diplomes',
  'etranger_assurances_sociales', 'etranger_double_nationalite', 'etranger_apatridie',
  'etranger_mna_mineurs', 'etranger_dublin_transfert',
  // accident (4)
  'accident_invalidite_suite', 'accident_faute_concomitante', 'accident_prescription_rc',
  'accident_domestique_responsabilite',
  // assurances (4)
  'assurance_chomage_indemnites_conditions', 'assurance_allocations_familiales',
  'assurance_maternite_apg', 'assurance_avs_rente_vieillesse',
  // bail (5)
  'bail_parking', 'bail_cave_grenier', 'bail_faillite_locataire', 'bail_droit_preemption',
  'bail_droit_retractation',
  // dettes (5)
  'dettes_acte_defaut_biens_effets', 'dettes_poursuite_effets_change', 'dettes_for_poursuite',
  'dettes_budget_conseil', 'dettes_assainissement_financier'
];

function loadAllFiches() {
  const all = [];
  for (const d of ALL_DOMAINS) {
    const file = path.join(FICHES_DIR, `${d}.json`);
    if (!fs.existsSync(file)) continue;
    const fiches = JSON.parse(fs.readFileSync(file, 'utf8'));
    all.push(...fiches);
  }
  return all;
}

describe('Phase Cortex 4 — Cascades sur fiches NOT_ACTIONABLE', () => {
  const allFiches = loadAllFiches();
  const fichesWithCascades = allFiches.filter(f => Array.isArray(f.cascades) && f.cascades.length > 0);

  it('≥121 fiches ont une cascade (baseline phases 1+2: 71, plus ≥50 phase 4)', () => {
    assert.ok(
      fichesWithCascades.length >= 121,
      `Attendu ≥121 fiches avec cascade, trouvé ${fichesWithCascades.length}`
    );
  });

  it('≥50 nouvelles cascades ajoutées par la phase 4', () => {
    let count = 0;
    for (const id of PHASE4_NEW_CASCADE_IDS) {
      const fiche = allFiches.find(f => f.id === id);
      if (fiche && Array.isArray(fiche.cascades) && fiche.cascades.length > 0) count++;
    }
    assert.ok(
      count >= 50,
      `Attendu ≥50 nouvelles cascades phase 4, trouvé ${count}`
    );
  });

  it('les 74 fiches NOT_ACTIONABLE de la phase 4 ont toutes une cascade', () => {
    const missing = [];
    for (const id of PHASE4_NEW_CASCADE_IDS) {
      const fiche = allFiches.find(f => f.id === id);
      if (!fiche) { missing.push(`${id} (introuvable)`); continue; }
      if (!Array.isArray(fiche.cascades) || fiche.cascades.length === 0) {
        missing.push(id);
      }
    }
    assert.equal(missing.length, 0, `Fiches phase 4 sans cascade: ${missing.join(', ')}`);
  });

  it('chaque nouvelle cascade phase 4 a ≥3 étapes numérotées séquentiellement', () => {
    for (const id of PHASE4_NEW_CASCADE_IDS) {
      const fiche = allFiches.find(f => f.id === id);
      for (const cascade of fiche.cascades) {
        assert.ok(
          Array.isArray(cascade.etapes) && cascade.etapes.length >= 3,
          `Cascade de ${id} a ${cascade.etapes?.length || 0} étapes (attendu ≥3)`
        );
        cascade.etapes.forEach((etape, idx) => {
          assert.equal(
            etape.numero,
            idx + 1,
            `Étape ${idx} de ${id} a numero=${etape.numero}, attendu ${idx + 1}`
          );
        });
      }
    }
  });

  it('chaque étape a action + (description ou branches)', () => {
    for (const id of PHASE4_NEW_CASCADE_IDS) {
      const fiche = allFiches.find(f => f.id === id);
      for (const cascade of fiche.cascades) {
        for (const etape of cascade.etapes) {
          assert.ok(
            typeof etape.action === 'string' && etape.action.length > 0,
            `Étape ${etape.numero} de ${id} sans action`
          );
          const hasDescription = typeof etape.description === 'string' && etape.description.length > 0;
          const hasBranches = Array.isArray(etape.branches) && etape.branches.length > 0;
          assert.ok(
            hasDescription || hasBranches,
            `Étape ${etape.numero} de ${id} sans description ni branches`
          );
        }
      }
    }
  });

  it('chaque cascade phase 4 a un titre et un domaine', () => {
    for (const id of PHASE4_NEW_CASCADE_IDS) {
      const fiche = allFiches.find(f => f.id === id);
      for (const cascade of fiche.cascades) {
        assert.ok(
          typeof cascade.titre === 'string' && cascade.titre.length > 0,
          `Cascade de ${id} sans titre`
        );
        assert.ok(
          typeof cascade.domaine === 'string' && cascade.domaine.length > 0,
          `Cascade de ${id} sans domaine`
        );
      }
    }
  });

  it('100% des fiches famille/social/violence/entreprise sont actionnables (cascade ou modèle)', () => {
    const priorityFiles = { 'famille.json': [], 'social.json': [], 'violence.json': [], 'entreprise.json': [] };
    for (const fname of Object.keys(priorityFiles)) {
      const fiches = JSON.parse(fs.readFileSync(path.join(FICHES_DIR, fname), 'utf8'));
      const notActionable = fiches.filter(f => {
        const hasCascade = Array.isArray(f.cascades) && f.cascades.length > 0;
        const hasModele = f.reponse && typeof f.reponse.modeleLettre === 'string' && f.reponse.modeleLettre.length > 0;
        return !hasCascade && !hasModele;
      });
      priorityFiles[fname] = notActionable.map(f => f.id);
    }
    const problems = Object.entries(priorityFiles)
      .filter(([, ids]) => ids.length > 0)
      .map(([f, ids]) => `${f}: ${ids.join(', ')}`);
    assert.equal(
      problems.length,
      0,
      `Fiches prioritaires non actionnables: ${problems.join(' | ')}`
    );
  });

  it('pattern constat → notification → délai → escalade respecté dans ≥80% des phase 4', () => {
    let withPattern = 0;
    for (const id of PHASE4_NEW_CASCADE_IDS) {
      const fiche = allFiches.find(f => f.id === id);
      for (const cascade of fiche.cascades) {
        const joined = cascade.etapes.map(e => (e.action || '') + ' ' + (e.description || '')).join(' ').toLowerCase();
        const hasConstat = /constat|document|analyse|vérif|sécur|bilan|évaluation|identification|inscription|inventaire|préparation|mise en sécurité|mesure|réunion|rassembl|examen|anticipation|auto-|élaboration/.test(joined);
        const hasNotification = /notification|recommandé|lettre|déclaration|opposition|demande|dépôt|mise en demeure|avis|requête|plainte|rappel|annonce|signalement|communiqu|affiliation|inscription|transmettr/.test(joined);
        const hasEscalade = /tribunal|recours|juge|conciliation|action|plainte|lavi|mainlevée|faillite|autorité|ministère|police|taf|prud'homm|arbitrage|tf|dissolution|radiation|destitut|révision|reconsidérat|commission paritaire|sanction/.test(joined);
        if (hasConstat && hasNotification && hasEscalade) withPattern++;
      }
    }
    const ratio = withPattern / PHASE4_NEW_CASCADE_IDS.length;
    assert.ok(
      ratio >= 0.8,
      `Pattern constat→notification→escalade dans ${withPattern}/${PHASE4_NEW_CASCADE_IDS.length} (${(ratio*100).toFixed(0)}%), attendu ≥80%`
    );
  });

  it('aucun JSON corrompu après ajouts', () => {
    for (const d of ALL_DOMAINS) {
      const file = path.join(FICHES_DIR, `${d}.json`);
      if (!fs.existsSync(file)) continue;
      assert.doesNotThrow(
        () => JSON.parse(fs.readFileSync(file, 'utf8')),
        `JSON invalide dans ${file}`
      );
    }
  });

  it('distribution : chaque domaine prioritaire a ≥8 fiches avec cascades', () => {
    const priorityDomains = ['bail', 'travail', 'famille', 'etrangers', 'dettes', 'social', 'violence', 'entreprise'];
    for (const d of priorityDomains) {
      const file = path.join(FICHES_DIR, `${d}.json`);
      const fiches = JSON.parse(fs.readFileSync(file, 'utf8'));
      const withCascades = fiches.filter(f => Array.isArray(f.cascades) && f.cascades.length > 0);
      assert.ok(
        withCascades.length >= 8,
        `Domaine ${d} : ${withCascades.length} fiches avec cascades, attendu ≥8`
      );
    }
  });
});
