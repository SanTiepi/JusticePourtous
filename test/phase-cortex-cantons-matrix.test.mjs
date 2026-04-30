/**
 * Phase Cortex — tests Cantons Matrix.
 *
 * Couvre :
 *  - structure du fichier src/data/meta/cantons-matrix.json
 *  - 6 cantons supportés (VD, GE, ZH, BE, BS, TI)
 *  - 10 domaines couverts par canton
 *  - getCantonsMatrix / getAutoritesByCantonDomaine / getFormulairesCantonaux
 *  - getContactsByCanton / listCantonsSupported / fallbackFederal
 *  - intégration knowledge-engine : queryByProblem(canton VD) ramène des
 *    contacts cantonaux dans escalade.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getCantonsMatrix,
  getAutoritesByCantonDomaine,
  getFormulairesCantonaux,
  getContactsByCanton,
  listCantonsSupported,
  fallbackFederal,
  enrichEscaladeWithMatrix
} from '../src/services/cantons-matrix.mjs';

import { queryByProblem } from '../src/services/knowledge-engine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MATRIX_PATH = join(__dirname, '..', 'src', 'data', 'meta', 'cantons-matrix.json');

const EXPECTED_CANTONS = ['VD', 'GE', 'ZH', 'BE', 'BS', 'TI'];
const EXPECTED_DOMAINES = [
  'bail', 'travail', 'dettes', 'etrangers', 'famille',
  'social', 'violence', 'accident', 'assurances', 'entreprise'
];

describe('Cantons Matrix — fichier de données', () => {
  it('JSON valide et chargeable', () => {
    const raw = readFileSync(MATRIX_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    assert.ok(parsed.version, 'version requise');
    assert.ok(parsed.generated_at, 'generated_at requis');
    assert.ok(parsed.cantons, 'cantons requis');
    assert.ok(parsed.fallback_federal, 'fallback_federal requis');
  });

  it('contient au moins les 6 cantons core supportés', () => {
    // Originellement 6 cantons curés humainement (VD/GE/ZH/BE/BS/TI).
    // Étendu à 26 le 2026-04-30 via scripts/extend-cantons-matrix.mjs (auto-
    // généré depuis donnees-cantonales.json). Les 6 core gardent la richesse
    // des 10 domaines ; les 20 nouveaux ont des données partielles marquées
    // _source: 'donnees-cantonales-auto'.
    const m = getCantonsMatrix();
    const keys = Object.keys(m.cantons);
    for (const c of EXPECTED_CANTONS) {
      assert.ok(keys.includes(c), `Canton core ${c} manquant`);
    }
    assert.ok(keys.length >= 6, `attendu au moins 6 cantons, reçu ${keys.length}`);
  });

  it('chaque canton a les 10 domaines couverts', () => {
    const m = getCantonsMatrix();
    for (const c of EXPECTED_CANTONS) {
      const data = m.cantons[c];
      assert.ok(data, `Canton ${c} manquant`);
      assert.ok(data.nom, `Canton ${c} sans nom`);
      assert.ok(data.langue, `Canton ${c} sans langue`);
      const domaines = Object.keys(data.autorites || {});
      for (const d of EXPECTED_DOMAINES) {
        assert.ok(domaines.includes(d), `Canton ${c} : domaine ${d} manquant`);
      }
    }
  });

  it('chaque autorité a au minimum nom + site OU adresse', () => {
    const m = getCantonsMatrix();
    let totalChecked = 0;
    for (const c of EXPECTED_CANTONS) {
      for (const d of EXPECTED_DOMAINES) {
        const autorites = m.cantons[c].autorites[d];
        for (const [key, value] of Object.entries(autorites)) {
          assert.ok(value.nom, `${c}/${d}/${key} sans nom`);
          assert.ok(
            value.site || value.adresse,
            `${c}/${d}/${key} sans site ni adresse`
          );
          totalChecked++;
        }
      }
    }
    assert.ok(totalChecked >= 60, `Doit avoir au moins 60 entrées, trouvé ${totalChecked}`);
  });
});

describe('Cantons Matrix — API', () => {
  it('listCantonsSupported() inclut les 6 cantons core (étendu à 26 depuis 2026-04-30)', () => {
    const supported = listCantonsSupported();
    assert.ok(supported.length >= 6, `attendu au moins 6, reçu ${supported.length}`);
    for (const c of EXPECTED_CANTONS) {
      assert.ok(supported.includes(c), `Canton core ${c} manquant`);
    }
  });

  it('getAutoritesByCantonDomaine(VD, bail) retourne >= 2 entrées', () => {
    const autorites = getAutoritesByCantonDomaine('VD', 'bail');
    assert.ok(Array.isArray(autorites));
    assert.ok(autorites.length >= 2, `Attendu >= 2, trouvé ${autorites.length}`);
    for (const a of autorites) {
      assert.ok(a.nom, 'autorité sans nom');
      assert.ok(a.canton === 'VD');
      assert.ok(a.domaine === 'bail');
    }
  });

  it('getAutoritesByCantonDomaine est case-insensitive sur canton', () => {
    const a1 = getAutoritesByCantonDomaine('vd', 'bail');
    const a2 = getAutoritesByCantonDomaine('VD', 'bail');
    assert.equal(a1.length, a2.length);
  });

  it('getAutoritesByCantonDomaine retourne [] pour canton inconnu', () => {
    const r = getAutoritesByCantonDomaine('XX', 'bail');
    assert.deepEqual(r, []);
  });

  it('getFormulairesCantonaux(VD) retourne au moins 1 formulaire', () => {
    const forms = getFormulairesCantonaux('VD');
    assert.ok(Array.isArray(forms));
    assert.ok(forms.length >= 1);
    for (const f of forms) {
      assert.ok(f.nom);
      assert.ok(f.url_ou_emplacement || f.support);
    }
  });

  it('getFormulairesCantonaux(VD, "bail") filtre par domaine', () => {
    const all = getFormulairesCantonaux('VD');
    const bail = getFormulairesCantonaux('VD', 'bail');
    assert.ok(bail.length >= 1);
    assert.ok(bail.length <= all.length);
    for (const f of bail) {
      assert.ok(f.key.startsWith('bail'), `formulaire ${f.key} ne commence pas par 'bail'`);
    }
  });

  it('getContactsByCanton(GE) retourne tous les contacts du canton, à plat', () => {
    const contacts = getContactsByCanton('GE');
    assert.ok(Array.isArray(contacts));
    // Au moins 2 par domaine en moyenne sur 10 domaines = ~20+
    assert.ok(contacts.length >= 15, `Attendu >= 15 contacts, trouvé ${contacts.length}`);
    const domaines = new Set(contacts.map(c => c.domaine));
    assert.ok(domaines.size >= 8, `Doit couvrir >= 8 domaines distincts`);
  });

  it('fallbackFederal(bail) retourne au moins 1 contact fédéral (OFL ou TF)', () => {
    const fb = fallbackFederal('bail');
    assert.ok(Array.isArray(fb));
    assert.ok(fb.length >= 1);
    for (const f of fb) {
      assert.ok(f.nom);
      assert.ok(f.federal === true);
      assert.ok(f.site || f.tel);
    }
  });

  it('fallbackFederal couvre les 10 domaines', () => {
    for (const d of EXPECTED_DOMAINES) {
      const fb = fallbackFederal(d);
      assert.ok(fb.length >= 1, `Domaine ${d} sans fallback fédéral`);
    }
  });

  it('enrichEscaladeWithMatrix ajoute des entrées matrix sans muter la base', () => {
    const baseEscalade = [
      { id: 'asloca', nom: 'ASLOCA', cantons: ['VD'], type: 'association' }
    ];
    const enriched = enrichEscaladeWithMatrix(baseEscalade, 'VD', 'bail');
    assert.ok(enriched.length > baseEscalade.length, 'doit avoir ajouté des entrées');
    assert.equal(baseEscalade.length, 1, 'base ne doit pas être mutée');
    // L'entrée d'origine reste en tête (priorité aux escalades existantes)
    assert.equal(enriched[0].id, 'asloca');
    // Les nouvelles entrées portent source = cantons-matrix
    const matrixEntries = enriched.filter(e => e.source === 'cantons-matrix');
    assert.ok(matrixEntries.length >= 2);
  });

  it('enrichEscaladeWithMatrix sur canton non supporté retombe sur fédéral', () => {
    const enriched = enrichEscaladeWithMatrix([], 'XX', 'bail');
    assert.ok(enriched.length >= 1);
    for (const e of enriched) {
      assert.equal(e.type, 'autorite_federale');
    }
  });
});

describe('Cantons Matrix — intégration knowledge-engine', () => {
  it('queryByProblem(canton VD) enrichit escalade avec autorités cantonales', () => {
    const res = queryByProblem('moisissure logement', 'VD');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data?.escalade), 'escalade doit être un tableau');
    // Au moins une entrée doit venir de la matrice cantonale
    const fromMatrix = res.data.escalade.filter(e => e.source === 'cantons-matrix');
    assert.ok(
      fromMatrix.length >= 1,
      `attendu >= 1 entrée 'cantons-matrix', trouvé ${fromMatrix.length}`
    );
    // Au moins une entrée doit avoir le canton VD
    const vdEntries = fromMatrix.filter(e => e.cantons?.includes('VD'));
    assert.ok(vdEntries.length >= 1);
  });

  it('queryByProblem ne casse pas pour canton inconnu (XX)', () => {
    const res = queryByProblem('moisissure logement', 'XX');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data?.escalade));
    // Doit retomber sur fédéral
    const federal = res.data.escalade.filter(e =>
      e.source === 'cantons-matrix-federal' || e.type === 'autorite_federale'
    );
    assert.ok(federal.length >= 1, 'doit avoir un fallback fédéral');
  });

  it('queryByProblem sans canton fonctionne et ramène fallback fédéral', () => {
    const res = queryByProblem('moisissure logement');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data?.escalade));
  });
});
