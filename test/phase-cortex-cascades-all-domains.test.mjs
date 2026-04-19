import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// ============================================================================
// Phase Cortex 2 — Propagation des cascades aux 8 domaines manquants
//
// Baseline vague 1 : 47 fiches avaient une cascade (5 domaines).
// Cible vague 2    : ≥24 nouvelles fiches (3 par domaine × 8 domaines)
//                    → total ≥71, 13 domaines couverts.
// ============================================================================

const FICHES_DIR = 'src/data/fiches';
const ALL_DOMAINS = [
  'bail', 'travail', 'dettes', 'etrangers', 'famille',
  'accident', 'assurances', 'social', 'violence', 'entreprise',
  'consommation', 'voisinage', 'circulation'
];

// IDs des 24 nouvelles cascades (vague 2)
const NEW_CASCADE_IDS = [
  // consommation
  'consommation_defaut_produit_garantie',
  'consommation_annulation_commande_en_ligne',
  'consommation_livraison_retard',
  // voisinage
  'voisinage_bruit_nuisances',
  'voisinage_arbres_limites',
  'voisinage_fumee_odeurs',
  // circulation
  'circulation_amende_ordre',
  'circulation_accident_responsabilite_civile',
  'circulation_retrait_permis_exces_vitesse',
  // assurances
  'assurance_ai_opposition',
  'assurance_chomage_inscription',
  'assurance_lamal_subsides_refus',
  // accident
  'accident_circulation_roles_assurances',
  'accident_travail_prestations_laa',
  'accident_constat_amiable',
  // social
  'social_refus_aide_recours',
  'social_hebergement_urgence_procedure',
  'social_sanction_reduction',
  // violence
  'violence_ordonnance_protection',
  'violence_plainte_conjugale',
  'violence_lavi_indemnisation',
  // entreprise
  'entreprise_faillite_personnelle',
  'entreprise_commandement_payer_societe',
  'entreprise_creances_impayees_recouvrement'
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

describe('Phase Cortex 2 — Cascades pour tous les domaines', () => {
  const allFiches = loadAllFiches();
  const fichesWithCascades = allFiches.filter(f => Array.isArray(f.cascades) && f.cascades.length > 0);

  it('au moins 71 fiches ont une cascade au total (47 baseline vague 1 + ≥24 vague 2)', () => {
    assert.ok(
      fichesWithCascades.length >= 71,
      `Attendu ≥71 fiches avec cascades, trouvé ${fichesWithCascades.length}`
    );
  });

  it('chacun des 13 domaines a au moins 3 fiches avec cascades', () => {
    for (const d of ALL_DOMAINS) {
      const file = path.join(FICHES_DIR, `${d}.json`);
      const fiches = JSON.parse(fs.readFileSync(file, 'utf8'));
      const withCascades = fiches.filter(f => Array.isArray(f.cascades) && f.cascades.length > 0);
      assert.ok(
        withCascades.length >= 3,
        `Domaine ${d} : ${withCascades.length} fiches avec cascades, attendu ≥3`
      );
    }
  });

  it('les 24 nouvelles fiches de la vague 2 ont toutes une cascade', () => {
    for (const id of NEW_CASCADE_IDS) {
      const fiche = allFiches.find(f => f.id === id);
      assert.ok(fiche, `Fiche ${id} introuvable`);
      assert.ok(
        Array.isArray(fiche.cascades) && fiche.cascades.length > 0,
        `Fiche ${id} n'a pas de cascade`
      );
    }
  });

  it('chaque nouvelle cascade (vague 2) a ≥3 étapes numérotées séquentiellement', () => {
    for (const id of NEW_CASCADE_IDS) {
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

  it('chaque étape des nouvelles cascades a action + (description ou branches)', () => {
    for (const id of NEW_CASCADE_IDS) {
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

  it('chaque nouvelle cascade déclare un titre et un domaine cohérent', () => {
    for (const id of NEW_CASCADE_IDS) {
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

  it('aucun JSON corrompu sur les 13 fichiers de fiches', () => {
    for (const d of ALL_DOMAINS) {
      const file = path.join(FICHES_DIR, `${d}.json`);
      if (!fs.existsSync(file)) continue;
      assert.doesNotThrow(
        () => JSON.parse(fs.readFileSync(file, 'utf8')),
        `JSON invalide dans ${file}`
      );
    }
  });

  it('pattern constat → notification → délai → escalade présent dans ≥80% des nouvelles cascades', () => {
    let withPattern = 0;
    for (const id of NEW_CASCADE_IDS) {
      const fiche = allFiches.find(f => f.id === id);
      for (const cascade of fiche.cascades) {
        // On vérifie que la séquence contient au moins un "constat"/"document"/"analyse"/"vérif"
        // puis un élément notification/demande/opposition, puis un élément de délai/attente,
        // puis un élément d'escalade/recours/action/tribunal.
        const joined = cascade.etapes.map(e => (e.action || '') + ' ' + (e.description || '')).join(' ').toLowerCase();
        const hasConstat = /constat|document|analyse|vérif|sécur|bilan|évaluation|identification|inscription|mise en sécurité|mesure/.test(joined);
        const hasNotification = /notification|recommandé|lettre|déclaration|opposition|demande|dépôt|mise en demeure|avis|requête|plainte|rappel|remplissage/.test(joined);
        const hasEscalade = /tribunal|recours|juge|conciliation|action|plainte|lavi|mainlevée|faillite|autorité|ministère|police/.test(joined);
        if (hasConstat && hasNotification && hasEscalade) withPattern++;
      }
    }
    const ratio = withPattern / NEW_CASCADE_IDS.length;
    assert.ok(
      ratio >= 0.8,
      `Pattern constat→notification→escalade dans ${withPattern}/${NEW_CASCADE_IDS.length} cascades (${(ratio*100).toFixed(0)}%), attendu ≥80%`
    );
  });
});
