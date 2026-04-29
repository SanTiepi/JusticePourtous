#!/usr/bin/env node
/**
 * regen-polluted-guides.mjs — Régénère les fiches qui avaient été supprimées
 * suite à une pollution QA Anthropic (cycle 37+ session 2026-04-29).
 *
 * Liste hardcodée : les 30 fichiers identifiés via grep pollution patterns.
 * Le filtre anti-pollution dans providers.mjs (callAnthropicTranslation)
 * empêche maintenant la fuite — fallback sur texte source si détecté.
 *
 * Usage : node scripts/regen-polluted-guides.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderGuideForLocale } from '../src/services/guide-renderer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GUIDES_DIR = path.join(ROOT, 'src/public/guides');

// Liste exacte des 30 fichiers supprimés en cycle de cleanup
const TARGETS = [
  ['de', 'bail_restitution_anticipee'],
  ['de', 'consommation_achat_occasion_caches'],
  ['de', 'consommation_livraison_retard'],
  ['de', 'etranger_aide_sociale_permis'],
  ['de', 'etranger_recours_renvoi'],
  ['de', 'etranger_sans_papiers_droits'],
  ['de', 'famille_certificat_heritier'],
  ['de', 'famille_testament_olographe'],
  ['de', 'sante_assistance_suicide_fin_vie'],
  ['de', 'sante_changement_assureur_lamal'],
  ['de', 'sante_facture_medicale_contestation'],
  ['de', 'sante_franchise_quote_part'],
  ['de', 'sante_hospitalisation_privee_semi_privee'],
  ['de', 'sante_medecin_traitant_continuite'],
  ['de', 'sante_refus_nouveau_patient'],
  ['de', 'sante_refus_vaccination_enfant'],
  ['de', 'sante_responsabilite_professionnel'],
  ['de', 'successions_benefice_inventaire'],
  ['de', 'successions_testament_olographe_forme'],
  ['de', 'travail_13e_salaire'],
  ['de', 'travail_gratification'],
  ['de', 'travail_secret_professionnel'],
  ['de', 'violence_stalking_harcelement'],
  ['de', 'voisinage_arbres_limites'],
  ['de', 'voisinage_murs_mitoyens'],
  ['de', 'voisinage_servitudes_passage'],
  ['it', 'dettes_budget_conseil'],
  ['it', 'dettes_opposition'],
  ['it', 'successions_liquidation_partage'],
  ['it', 'travail_licenciement_maladie'],
];

async function main() {
  let generated = 0;
  let skipped = 0;
  for (const [locale, slug] of TARGETS) {
    const outPath = path.join(GUIDES_DIR, locale, `${slug}.html`);
    if (fs.existsSync(outPath)) {
      console.log(`skip (déjà régénéré) ${locale}/${slug}`);
      skipped += 1;
      continue;
    }
    try {
      const rendered = await renderGuideForLocale(slug, locale);
      if (!rendered || !rendered.html) {
        console.warn(`skip (rendering vide) ${locale}/${slug}`);
        skipped += 1;
        continue;
      }
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, rendered.html, 'utf-8');
      console.log(`✓ ${locale}/${slug}`);
      generated += 1;
    } catch (err) {
      console.warn(`fail ${locale}/${slug}: ${err.message}`);
      skipped += 1;
    }
  }
  console.log(`\nRégénérés : ${generated} / ${TARGETS.length} (${skipped} skipped)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
