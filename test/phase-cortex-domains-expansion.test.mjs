/**
 * Phase Cortex — Expansion à 3 nouveaux domaines (consommation, voisinage, circulation)
 *
 * Vérifie :
 *  - 13 domaines dans domaines.json (10 baseline + 3 nouveaux)
 *  - Chaque nouveau domaine a exactement 10 fiches
 *  - Schéma minimum (id, articles ≥ 2, juris ≥ 1, explication ≥ 500 chars)
 *  - Fraîcheur (last_verified_at, review_scope, review_expiry)
 *  - Knowledge-engine charge correctement les nouvelles fiches
 *  - enrichFiche() renvoie un payload complet pour une fiche pivot
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  getAllFiches,
  getFichesByDomaine,
  getFicheById,
  getDomaines
} from '../src/services/fiches.mjs';
import { queryComplete } from '../src/services/knowledge-engine.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const NEW_DOMAINS = ['consommation', 'voisinage', 'circulation'];

function loadDomainesJson() {
  const raw = readFileSync(join(ROOT, 'src/data/domaines.json'), 'utf-8');
  return JSON.parse(raw);
}

function loadDomainFiches(domain) {
  const raw = readFileSync(join(ROOT, `src/data/fiches/${domain}.json`), 'utf-8');
  return JSON.parse(raw);
}

describe('Phase Cortex — Expansion 3 nouveaux domaines (consommation, voisinage, circulation)', () => {
  const domaines = loadDomainesJson();
  const domaineIds = domaines.map(d => d.id);

  it('domaines.json contient au moins 13 domaines (10 baseline + 3 Phase 3)', () => {
    assert.ok(domaines.length >= 13, `Attendu >= 13 domaines, trouvé ${domaines.length}`);
  });

  it('les 3 nouveaux domaines (consommation, voisinage, circulation) sont présents dans domaines.json', () => {
    for (const d of NEW_DOMAINS) {
      assert.ok(
        domaineIds.includes(d),
        `Domaine ${d} manquant dans domaines.json`
      );
    }
  });

  it('chaque nouveau domaine dispose de métadonnées complètes (nom, description, icone, couleur)', () => {
    for (const d of NEW_DOMAINS) {
      const meta = domaines.find(x => x.id === d);
      assert.ok(meta, `Méta manquante pour ${d}`);
      assert.ok(meta.nom?.length > 0, `nom manquant pour ${d}`);
      assert.ok(meta.description?.length > 0, `description manquante pour ${d}`);
      assert.ok(meta.icone?.length > 0, `icone manquante pour ${d}`);
      assert.ok(/^#[0-9a-fA-F]{6}$/.test(meta.couleur || ''), `couleur invalide pour ${d}`);
    }
  });

  it('chaque nouveau domaine a AU MOINS 10 fiches (élargi depuis 2026-04 — enrichissement circulation à 20+)', () => {
    for (const d of NEW_DOMAINS) {
      const fiches = loadDomainFiches(d);
      assert.ok(
        fiches.length >= 10,
        `Domaine ${d}: attendu >= 10 fiches, trouvé ${fiches.length}`
      );
    }
  });

  it('chaque fiche des 3 nouveaux domaines respecte le schéma minimum', () => {
    for (const d of NEW_DOMAINS) {
      const fiches = loadDomainFiches(d);
      for (const f of fiches) {
        assert.ok(f.id, `Fiche sans id dans ${d}`);
        assert.equal(f.domaine, d, `Fiche ${f.id} a un domaine incorrect (${f.domaine} != ${d})`);
        assert.ok(f.tags?.length > 0, `Fiche ${f.id} sans tags`);
        assert.ok(f.questions?.length >= 3, `Fiche ${f.id} a moins de 3 questions`);
        assert.ok(f.reponse, `Fiche ${f.id} sans réponse`);
        assert.ok(
          f.reponse.explication?.length >= 500,
          `Fiche ${f.id} explication trop courte (${f.reponse.explication?.length || 0} chars)`
        );
        assert.ok(
          f.reponse.articles?.length >= 2,
          `Fiche ${f.id} a moins de 2 articles`
        );
        assert.ok(
          f.reponse.jurisprudence?.length >= 1,
          `Fiche ${f.id} a moins de 1 arrêt de jurisprudence`
        );
        assert.ok(f.reponse.services?.length > 0, `Fiche ${f.id} sans services`);
        assert.ok(
          f.reponse.disclaimer?.length > 50,
          `Fiche ${f.id} disclaimer manquant ou trop court`
        );
      }
    }
  });

  it('toutes les références d\'articles ont des liens Fedlex valides', () => {
    for (const d of NEW_DOMAINS) {
      const fiches = loadDomainFiches(d);
      for (const f of fiches) {
        for (const a of f.reponse.articles) {
          assert.ok(a.ref, `Article sans ref dans ${f.id}`);
          assert.ok(a.titre, `Article sans titre dans ${f.id}`);
          assert.ok(
            a.lien?.startsWith('https://www.fedlex.admin.ch/eli/'),
            `Lien invalide pour article ${a.ref} dans ${f.id}: ${a.lien}`
          );
        }
      }
    }
  });

  it('toutes les fiches ont confiance, last_verified_at, review_scope, review_expiry', () => {
    for (const d of NEW_DOMAINS) {
      const fiches = loadDomainFiches(d);
      for (const f of fiches) {
        assert.ok(
          ['probable', 'variable', 'incertain'].includes(f.confiance),
          `Fiche ${f.id} a une confiance invalide: ${f.confiance}`
        );
        assert.ok(
          /^\d{4}-\d{2}-\d{2}$/.test(f.last_verified_at || ''),
          `Fiche ${f.id} last_verified_at invalide`
        );
        assert.ok(f.review_scope, `Fiche ${f.id} sans review_scope`);
        assert.ok(
          /^\d{4}-\d{2}-\d{2}$/.test(f.review_expiry || ''),
          `Fiche ${f.id} review_expiry invalide`
        );
      }
    }
  });

  it('aucun doublon d\'id entre les 30 nouvelles fiches et les fiches existantes', () => {
    const allIds = getAllFiches().map(f => f.id);
    const uniqueIds = new Set(allIds);
    assert.equal(
      allIds.length,
      uniqueIds.size,
      `Doublons d'id détectés: ${allIds.filter((id, i) => allIds.indexOf(id) !== i)}`
    );
  });

  it('le service fiches.mjs charge correctement les 3 nouveaux domaines', () => {
    const loadedDomains = getDomaines();
    for (const d of NEW_DOMAINS) {
      assert.ok(
        loadedDomains.includes(d),
        `Le service fiches.mjs ne charge pas le domaine ${d}`
      );
      const fiches = getFichesByDomaine(d);
      assert.ok(fiches.length >= 10, `getFichesByDomaine('${d}') doit renvoyer >= 10 fiches`);
    }
  });

  it('les ids attendus sont présents (sample par domaine)', () => {
    const expectedSamples = {
      consommation: ['consommation_defaut_produit_garantie', 'consommation_pratiques_deloyales'],
      voisinage: ['voisinage_bruit_nuisances', 'voisinage_arbres_limites'],
      circulation: ['circulation_amende_ordre', 'circulation_accident_responsabilite_civile']
    };
    for (const [d, ids] of Object.entries(expectedSamples)) {
      for (const id of ids) {
        const f = getFicheById(id);
        assert.ok(f, `Fiche pivot manquante: ${id}`);
        assert.equal(f.domaine, d, `Fiche ${id} mal rattachée au domaine`);
      }
    }
  });

  it('queryComplete(consommation_defaut_produit_garantie) retourne un payload enrichi', () => {
    const res = queryComplete('consommation_defaut_produit_garantie');
    assert.ok(res, 'queryComplete renvoie null');
    assert.equal(res.status, 200, `queryComplete a échoué: ${JSON.stringify(res)}`);
    const data = res.data;
    assert.ok(data?.fiche, 'data sans fiche');
    assert.equal(data.fiche.id, 'consommation_defaut_produit_garantie');
    assert.ok(Array.isArray(data.articles), 'data.articles doit être un tableau');
    assert.ok(Array.isArray(data.jurisprudence), 'data.jurisprudence doit être un tableau');
  });

  it('non-régression : les 10 domaines existants sont toujours présents et inchangés en nombre minimum de fiches', () => {
    const baseline = ['bail', 'travail', 'famille', 'dettes', 'etrangers', 'assurances', 'social', 'violence', 'accident', 'entreprise'];
    for (const d of baseline) {
      assert.ok(domaineIds.includes(d), `Domaine baseline ${d} a disparu de domaines.json`);
      const fiches = getFichesByDomaine(d);
      assert.ok(fiches.length >= 10, `Domaine ${d} a ${fiches.length} fiches (régression)`);
    }
  });

  it('toutes les fiches des nouveaux domaines ont au moins 1 service avec canton défini', () => {
    for (const d of NEW_DOMAINS) {
      const fiches = loadDomainFiches(d);
      for (const f of fiches) {
        const withCanton = f.reponse.services.filter(s => s.canton);
        assert.ok(
          withCanton.length >= 1,
          `Fiche ${f.id} n'a aucun service avec canton défini`
        );
      }
    }
  });

  it('chaque fiche des nouveaux domaines a un modeleLettre non vide', () => {
    for (const d of NEW_DOMAINS) {
      const fiches = loadDomainFiches(d);
      for (const f of fiches) {
        assert.ok(
          f.reponse.modeleLettre && f.reponse.modeleLettre.length > 100,
          `Fiche ${f.id} sans modeleLettre exploitable`
        );
      }
    }
  });
});
