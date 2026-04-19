import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ============================================================================
// Phase Cortex 1 — Extension des cascades structurées
//
// Baseline : 12 fiches avaient déjà une cascade (agent précédent).
// Cible    : ≥30 nouvelles fiches enrichies (total ≥42).
// ============================================================================

const FICHES_DIR = 'src/data/fiches';
const DOMAINS = ['bail', 'travail', 'dettes', 'etrangers', 'famille', 'accident', 'assurances', 'social', 'violence', 'entreprise'];

// Baseline : hashes SHA-256 des cascades pré-existantes (agent précédent).
// Ces valeurs garantissent qu'aucune modification n'a été apportée
// aux 12 fiches qui avaient déjà une cascade avant la Phase Cortex 1.
const PRE_EXISTING_CASCADES = {
  bail_defaut_moisissure: '9ac1f073ee0bcda50c471e9a06c8477d61f8d0fadb2c604e0e6a490c75400480',
  bail_resiliation_conteste: '0797400aa2ed25bbae603ee2cad7f934e1098e0ca81ddfc33ff39924d4428544',
  bail_depot_garantie: 'da5334b4c8a7df110c4717c07e095c08b61a80120239ee31aa4e91e303507451',
  bail_augmentation_loyer: '196763c716531dab9d52d97a24c49a21175063e993b4b6b1dadaa88f7fe881ce',
  travail_licenciement_maladie: '283c52798872801ce1353253c941ab3e0ef440eef62b3bbb84e63805d5539fac',
  travail_salaire_impaye: 'db2a0c4b89c2ee5271e378418fa18a002e63a01baac2a2216efd0f14a4697b08',
  travail_harcelement: '56e5af2747ed64770cb1c1e89f7db05dd15cbeec1013270f5b9bfe8980eed2a6',
  travail_licenciement_abusif: '4245caf6f4ae1288ffd823092c79e7c61e0d6aa0188573d43734148c37920dd2',
  dettes_commandement_payer: '0575d37208074e668df9173a9958321bbb845f85d6dee34f788620b64afbb3fb',
  dettes_saisie_salaire: 'c949a23be8541d41cd0471e14c78e2fd4f32252582850101901d1d6f7fc09fe4',
  etranger_permis_b_renouvellement: 'fcf6447e6e1d461d7ecf891e03a10c2d4b3ca2f16b7eadaa63bb6ce846ad8e05',
  famille_pension_impayee: '81e9eebac2be9354cdc2bd86f22b58e3142561f868a6d44560b4cf284f92c544'
};

function loadAllFiches() {
  const all = [];
  for (const d of DOMAINS) {
    const file = path.join(FICHES_DIR, `${d}.json`);
    if (!fs.existsSync(file)) continue;
    const fiches = JSON.parse(fs.readFileSync(file, 'utf8'));
    all.push(...fiches);
  }
  return all;
}

function hashCascades(cascades) {
  return crypto.createHash('sha256').update(JSON.stringify(cascades)).digest('hex');
}

describe('Phase Cortex 1 — Extension des cascades', () => {
  const allFiches = loadAllFiches();
  const fichesWithCascades = allFiches.filter(f => Array.isArray(f.cascades) && f.cascades.length > 0);

  it('au moins 42 fiches ont une cascade (12 baseline + ≥30 nouvelles)', () => {
    assert.ok(
      fichesWithCascades.length >= 42,
      `Attendu ≥42 fiches avec cascades, trouvé ${fichesWithCascades.length}`
    );
  });

  it('au moins 30 nouvelles cascades ajoutées par rapport à la baseline', () => {
    const newCount = fichesWithCascades.length - Object.keys(PRE_EXISTING_CASCADES).length;
    assert.ok(
      newCount >= 30,
      `Attendu ≥30 nouvelles cascades, trouvé ${newCount}`
    );
  });

  it('chaque cascade a ≥3 étapes numérotées séquentiellement', () => {
    for (const f of fichesWithCascades) {
      for (const cascade of f.cascades) {
        assert.ok(
          Array.isArray(cascade.etapes),
          `Cascade de ${f.id} sans tableau d'étapes`
        );
        assert.ok(
          cascade.etapes.length >= 3,
          `Cascade de ${f.id} n'a que ${cascade.etapes.length} étapes (attendu ≥3)`
        );
        // Vérifier numérotation séquentielle
        cascade.etapes.forEach((etape, idx) => {
          assert.equal(
            etape.numero,
            idx + 1,
            `Étape ${idx} de ${f.id} a numero=${etape.numero}, attendu ${idx + 1}`
          );
        });
      }
    }
  });

  it("chaque étape a au moins 'action' et 'description' (ou branches pour étapes de décision)", () => {
    for (const f of fichesWithCascades) {
      for (const cascade of f.cascades) {
        for (const etape of cascade.etapes) {
          assert.ok(
            typeof etape.action === 'string' && etape.action.length > 0,
            `Étape ${etape.numero} de ${f.id} sans action`
          );
          // Une étape valide doit avoir soit une description, soit des branches (étape pivot)
          const hasDescription = typeof etape.description === 'string' && etape.description.length > 0;
          const hasBranches = Array.isArray(etape.branches) && etape.branches.length > 0;
          assert.ok(
            hasDescription || hasBranches,
            `Étape ${etape.numero} de ${f.id} sans description ni branches`
          );
        }
      }
    }
  });

  it('chaque cascade déclare un titre et un domaine', () => {
    for (const f of fichesWithCascades) {
      for (const cascade of f.cascades) {
        assert.ok(
          typeof cascade.titre === 'string' && cascade.titre.length > 0,
          `Cascade de ${f.id} sans titre`
        );
        assert.ok(
          typeof cascade.domaine === 'string' && cascade.domaine.length > 0,
          `Cascade de ${f.id} sans domaine`
        );
      }
    }
  });

  it('les 12 cascades pré-existantes n\'ont pas été altérées (hash check)', () => {
    for (const [id, expectedHash] of Object.entries(PRE_EXISTING_CASCADES)) {
      const fiche = allFiches.find(f => f.id === id);
      assert.ok(fiche, `Fiche pré-existante ${id} introuvable`);
      assert.ok(Array.isArray(fiche.cascades), `Fiche ${id} a perdu son champ cascades`);
      const actualHash = hashCascades(fiche.cascades);
      assert.equal(
        actualHash,
        expectedHash,
        `Cascade de ${id} a été modifiée (hash mismatch) — ne pas toucher aux fiches pré-existantes`
      );
    }
  });

  it('distribution : chaque domaine prioritaire a au moins 5 fiches avec cascades', () => {
    const priorityDomains = ['bail', 'travail', 'dettes', 'etrangers', 'famille'];
    for (const d of priorityDomains) {
      const file = path.join(FICHES_DIR, `${d}.json`);
      const fiches = JSON.parse(fs.readFileSync(file, 'utf8'));
      const withCascades = fiches.filter(f => Array.isArray(f.cascades) && f.cascades.length > 0);
      assert.ok(
        withCascades.length >= 5,
        `Domaine ${d} : ${withCascades.length} fiches avec cascades, attendu ≥5`
      );
    }
  });

  it('aucun JSON corrompu — tous les fichiers de fiches chargent correctement', () => {
    for (const d of DOMAINS) {
      const file = path.join(FICHES_DIR, `${d}.json`);
      if (!fs.existsSync(file)) continue;
      assert.doesNotThrow(
        () => JSON.parse(fs.readFileSync(file, 'utf8')),
        `JSON invalide dans ${file}`
      );
    }
  });
});
