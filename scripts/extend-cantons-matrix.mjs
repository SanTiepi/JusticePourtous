#!/usr/bin/env node
/**
 * extend-cantons-matrix.mjs — Étend cantons-matrix.json des 6 cantons populés
 * (VD/GE/ZH/BE/BS/TI) aux 26 cantons en utilisant les données de
 * src/data/cantons/donnees-cantonales.json.
 *
 * Ne modifie PAS les 6 cantons existants (préserve la richesse des données
 * curées humainement). Ajoute uniquement les 20 cantons manquants avec les
 * domaines mappables depuis donnees-cantonales :
 *   - bail        ← conciliationBail
 *   - dettes      ← officeDesPoursuite
 *   - travail     ← prudhommes
 *   - famille     ← APEA
 *   - violence    ← centreLAVI
 *   - social      ← subsidesLAMal
 *   - etrangers   ← naturalisationOrdinaire (partiel)
 *
 * Marque les cantons étendus avec `source: 'donnees-cantonales-auto'`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MATRIX_PATH = path.join(ROOT, 'src/data/meta/cantons-matrix.json');
const DC_PATH = path.join(ROOT, 'src/data/cantons/donnees-cantonales.json');

const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
const donneesCantonales = JSON.parse(fs.readFileSync(DC_PATH, 'utf8'));

const LANGUE_BY_CANTON = {
  VD: 'fr', GE: 'fr', VS: 'fr', FR: 'fr-de', NE: 'fr', JU: 'fr',
  TI: 'it', GR: 'de-it-rm',
  ZH: 'de', BE: 'de-fr', BS: 'de', LU: 'de', SG: 'de', AG: 'de',
  SO: 'de', BL: 'de', SH: 'de', AR: 'de', AI: 'de', TG: 'de',
  UR: 'de', SZ: 'de', OW: 'de', NW: 'de', GL: 'de', ZG: 'de'
};

const NOM_BY_CANTON = {
  VD: 'Vaud', GE: 'Genève', VS: 'Valais', FR: 'Fribourg', NE: 'Neuchâtel',
  JU: 'Jura', TI: 'Tessin', GR: 'Grisons', ZH: 'Zurich', BE: 'Berne',
  BS: 'Bâle-Ville', LU: 'Lucerne', SG: 'Saint-Gall', AG: 'Argovie',
  SO: 'Soleure', BL: 'Bâle-Campagne', SH: 'Schaffhouse', AR: 'Appenzell Rhodes-Extérieures',
  AI: 'Appenzell Rhodes-Intérieures', TG: 'Thurgovie', UR: 'Uri', SZ: 'Schwytz',
  OW: 'Obwald', NW: 'Nidwald', GL: 'Glaris', ZG: 'Zoug'
};

function buildAutorites(dc) {
  const autorites = {};

  if (dc.conciliationBail) {
    autorites.bail = {
      conciliation: {
        nom: dc.conciliationBail.autorite || `Commission de conciliation en matière de baux ${NOM_BY_CANTON[dc.code]}`,
        adresse: dc.conciliationBail.adresse || null,
        site: dc.conciliationBail.formulaire || null,
        cout: dc.conciliationBail.cout || 'Gratuit (CPC art. 113)',
        delai_reaction: dc.conciliationBail.delai || '30 jours dès notification du congé (CO 273)',
        source: 'donnees-cantonales-auto'
      }
    };
  }

  if (dc.officeDesPoursuite) {
    autorites.dettes = {
      office_poursuites: {
        nom: dc.officeDesPoursuite.nom,
        adresse: dc.officeDesPoursuite.adresse || null,
        telephone: dc.officeDesPoursuite.telephone || null,
        site: dc.officeDesPoursuite.url || null,
        delai_reaction: '10 jours dès notification du commandement de payer (LP 74)',
        source: 'donnees-cantonales-auto'
      }
    };
  }

  if (dc.prudhommes) {
    autorites.travail = {
      tribunal_prudhommes: {
        nom: dc.prudhommes.nom || `Tribunal des prud'hommes ${NOM_BY_CANTON[dc.code]}`,
        adresse: dc.prudhommes.adresse || null,
        site: dc.prudhommes.url || null,
        cout: dc.prudhommes.cout || 'Gratuit jusqu\'à CHF 30\'000 (CPC art. 114)',
        source: 'donnees-cantonales-auto'
      }
    };
  }

  if (dc.APEA) {
    autorites.famille = {
      apea: {
        nom: dc.APEA.nom || `Autorité de protection de l'enfant et de l'adulte (APEA) ${NOM_BY_CANTON[dc.code]}`,
        adresse: dc.APEA.adresse || null,
        site: dc.APEA.url || null,
        source: 'donnees-cantonales-auto'
      }
    };
  }

  if (dc.centreLAVI) {
    autorites.violence = {
      lavi: {
        nom: dc.centreLAVI.nom || `Centre LAVI ${NOM_BY_CANTON[dc.code]}`,
        adresse: dc.centreLAVI.adresse || null,
        telephone: dc.centreLAVI.telephone || null,
        site: dc.centreLAVI.url || null,
        cout: 'Gratuit',
        source: 'donnees-cantonales-auto'
      }
    };
  }

  if (dc.subsidesLAMal) {
    autorites.social = {
      subsides_lamal: {
        nom: dc.subsidesLAMal.organisme || `Service des subsides LAMal ${NOM_BY_CANTON[dc.code]}`,
        adresse: dc.subsidesLAMal.adresse || null,
        site: dc.subsidesLAMal.url || null,
        source: 'donnees-cantonales-auto'
      }
    };
  }

  if (dc.naturalisationOrdinaire) {
    autorites.etrangers = {
      naturalisation: {
        nom: `Service des naturalisations ${NOM_BY_CANTON[dc.code]}`,
        site: dc.naturalisationOrdinaire.url || null,
        delai: dc.naturalisationOrdinaire.delai || null,
        source: 'donnees-cantonales-auto'
      }
    };
  }

  if (dc.aideJuridictionnelle) {
    autorites.transversal = {
      assistance_judiciaire: {
        nom: dc.aideJuridictionnelle.tribunal || `Service de l'assistance judiciaire ${NOM_BY_CANTON[dc.code]}`,
        site: dc.aideJuridictionnelle.formulaire || null,
        telephone: dc.aideJuridictionnelle.telephone || null,
        seuil: dc.aideJuridictionnelle.seuilRevenu || null,
        source: 'donnees-cantonales-auto'
      }
    };
  }

  return autorites;
}

function main() {
  const existing = new Set(Object.keys(matrix.cantons || {}));
  let added = 0;

  for (const dc of donneesCantonales) {
    if (existing.has(dc.code)) continue;
    const autorites = buildAutorites(dc);
    if (Object.keys(autorites).length === 0) {
      console.warn(`skip ${dc.code} (pas de données mappables)`);
      continue;
    }
    matrix.cantons[dc.code] = {
      nom: NOM_BY_CANTON[dc.code] || dc.nom || dc.code,
      langue: LANGUE_BY_CANTON[dc.code] || 'de',
      population_citoyenne: null,
      site_officiel: `https://www.${dc.code.toLowerCase()}.ch`,
      autorites,
      _source: 'donnees-cantonales-auto-2026-04-30',
      _note: 'Données partielles auto-générées depuis donnees-cantonales.json. Pour enrichissement curé (formulaires, ASLOCA local, etc.), voir VD/GE/ZH/BE/BS/TI.'
    };
    added++;
    console.log(`✓ ${dc.code} (${NOM_BY_CANTON[dc.code]}) — ${Object.keys(autorites).length} domaines`);
  }

  // Mise à jour metadata
  matrix.cantons_couverts = Object.keys(matrix.cantons).length;
  matrix.last_extension = '2026-04-30';

  fs.writeFileSync(MATRIX_PATH, JSON.stringify(matrix, null, 2) + '\n', 'utf8');
  console.log(`\n${added} cantons ajoutés. Total : ${Object.keys(matrix.cantons).length}/26.`);
}

main();
