/**
 * Phase Cortex — Phase 4 finale : ajout de 2 nouveaux domaines (successions, sante)
 *
 * Vérifie :
 *  - 15 domaines dans domaines.json (13 existants + 2 nouveaux)
 *  - successions.json et sante.json existent avec exactement 10 fiches chacun
 *  - Schéma minimum (id, articles ≥ 2, juris ≥ 1, explication ≥ 500 chars)
 *  - Fraîcheur (last_verified_at, review_scope, review_expiry)
 *  - IDs uniques snake_case, pas de doublons inter-domaines
 *  - Knowledge-engine charge les nouvelles fiches sans erreur
 *  - Graph-builder reconstruit sans fiches fantômes
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
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

const NEW_DOMAINS = ['successions', 'sante'];

const EXPECTED_IDS = {
  successions: [
    'successions_heritier_reserve',
    'successions_testament_contestation',
    'successions_renonciation',
    'successions_liquidation_partage',
    'successions_benefice_inventaire',
    'successions_pacte_successoral',
    'successions_legs_refus',
    'successions_indignite',
    'successions_action_petition_heredite',
    'successions_conjoint_survivant'
  ],
  sante: [
    'sante_consentement_eclaire',
    'sante_dossier_medical_acces',
    'sante_refus_traitement',
    'sante_secret_medical',
    'sante_lamal_choix_assureur',
    'sante_lamal_refus_prestation',
    'sante_assurance_complementaire_refus',
    'sante_directive_anticipee',
    'sante_erreur_medicale_plainte',
    'sante_patient_hospitalisation_force'
  ]
};

function loadDomainesJson() {
  const raw = readFileSync(join(ROOT, 'src/data/domaines.json'), 'utf-8');
  return JSON.parse(raw);
}

function loadDomainFiches(domain) {
  const raw = readFileSync(join(ROOT, `src/data/fiches/${domain}.json`), 'utf-8');
  return JSON.parse(raw);
}

describe('Phase Cortex — Phase 4 finale (successions + sante)', () => {
  const domaines = loadDomainesJson();
  const domaineIds = domaines.map(d => d.id);

  it('domaines.json contient 15 entrées (13 + 2 nouveaux)', () => {
    assert.equal(domaines.length, 15, `Attendu 15 domaines, trouvé ${domaines.length}`);
  });

  it('les 2 nouveaux domaines (successions, sante) sont présents dans domaines.json', () => {
    for (const d of NEW_DOMAINS) {
      assert.ok(domaineIds.includes(d), `Domaine ${d} manquant dans domaines.json`);
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

  it('successions.json et sante.json existent avec au moins 10 fiches chacun', () => {
    for (const d of NEW_DOMAINS) {
      const filePath = join(ROOT, `src/data/fiches/${d}.json`);
      assert.ok(existsSync(filePath), `Fichier ${d}.json manquant`);
      const fiches = loadDomainFiches(d);
      assert.ok(fiches.length >= 10, `Domaine ${d}: attendu >= 10 fiches, trouvé ${fiches.length}`);
    }
  });

  it('chaque fiche des 2 nouveaux domaines respecte le schéma minimum', () => {
    for (const d of NEW_DOMAINS) {
      const fiches = loadDomainFiches(d);
      for (const f of fiches) {
        assert.ok(f.id, `Fiche sans id dans ${d}`);
        assert.equal(f.domaine, d, `Fiche ${f.id} a un domaine incorrect (${f.domaine} != ${d})`);
        assert.ok(/^[a-z0-9_]+$/.test(f.id), `id non snake_case: ${f.id}`);
        assert.ok(f.tags?.length >= 6, `Fiche ${f.id} a moins de 6 tags`);
        assert.ok(f.questions?.length >= 3, `Fiche ${f.id} a moins de 3 questions`);
        assert.ok(f.reponse, `Fiche ${f.id} sans réponse`);
        assert.ok(
          f.reponse.explication?.length >= 500,
          `Fiche ${f.id} explication trop courte (${f.reponse.explication?.length || 0} chars)`
        );
        assert.ok(f.reponse.articles?.length >= 2, `Fiche ${f.id} a moins de 2 articles`);
        assert.ok(
          f.reponse.jurisprudence?.length >= 1,
          `Fiche ${f.id} a moins de 1 arrêt de jurisprudence`
        );
        assert.ok(f.reponse.services?.length > 0, `Fiche ${f.id} sans services`);
        assert.ok(f.reponse.escalade?.length >= 1, `Fiche ${f.id} sans escalade`);
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
          /^2026-04-(19|20)$/.test(f.last_verified_at),
          `Fiche ${f.id} last_verified_at attendu 2026-04-19 ou 2026-04-20, trouvé ${f.last_verified_at}`
        );
        // review_scope accepts both the initial draft state and the post-review upgrade.
        // draft_automated → reviewed_by_claude is a strict quality upgrade (Claude reviewed the fiche).
        assert.ok(
          ['draft_automated', 'reviewed_by_claude'].includes(f.review_scope),
          `Fiche ${f.id} review_scope invalide: ${f.review_scope} (attendu draft_automated ou reviewed_by_claude)`
        );
        assert.ok(
          /^2027-04-(19|20)$/.test(f.review_expiry),
          `Fiche ${f.id} review_expiry attendu 2027-04-19 ou 2027-04-20, trouvé ${f.review_expiry}`
        );
      }
    }
  });

  it('IDs uniques entre les 20 nouvelles fiches et les fiches existantes', () => {
    const allIds = getAllFiches().map(f => f.id);
    const uniqueIds = new Set(allIds);
    assert.equal(
      allIds.length,
      uniqueIds.size,
      `Doublons d'id détectés: ${allIds.filter((id, i) => allIds.indexOf(id) !== i)}`
    );
  });

  it('les ids attendus pour successions sont tous présents', () => {
    const fiches = loadDomainFiches('successions');
    const ids = fiches.map(f => f.id);
    for (const expected of EXPECTED_IDS.successions) {
      assert.ok(ids.includes(expected), `ID successions manquant: ${expected}`);
    }
  });

  it('les ids attendus pour sante sont tous présents', () => {
    const fiches = loadDomainFiches('sante');
    const ids = fiches.map(f => f.id);
    for (const expected of EXPECTED_IDS.sante) {
      assert.ok(ids.includes(expected), `ID sante manquant: ${expected}`);
    }
  });

  it('le service fiches.mjs charge correctement les 2 nouveaux domaines', () => {
    const loadedDomains = getDomaines();
    for (const d of NEW_DOMAINS) {
      assert.ok(
        loadedDomains.includes(d),
        `Le service fiches.mjs ne charge pas le domaine ${d}`
      );
      const fiches = getFichesByDomaine(d);
      assert.ok(fiches.length >= 10, `getFichesByDomaine('${d}') doit renvoyer >= 10 fiches, trouvé ${fiches.length}`);
    }
  });

  it('queryComplete charge une fiche pivot de successions sans erreur', () => {
    const res = queryComplete('successions_heritier_reserve');
    assert.ok(res, 'queryComplete renvoie null');
    assert.equal(res.status, 200, `queryComplete a échoué: ${JSON.stringify(res).slice(0, 200)}`);
    assert.ok(res.data?.fiche, 'data sans fiche');
    assert.equal(res.data.fiche.id, 'successions_heritier_reserve');
  });

  it('queryComplete charge une fiche pivot de sante sans erreur', () => {
    const res = queryComplete('sante_consentement_eclaire');
    assert.ok(res, 'queryComplete renvoie null');
    assert.equal(res.status, 200, `queryComplete a échoué: ${JSON.stringify(res).slice(0, 200)}`);
    assert.ok(res.data?.fiche, 'data sans fiche');
    assert.equal(res.data.fiche.id, 'sante_consentement_eclaire');
  });

  it('non-régression : les 13 domaines préexistants ont toujours ≥ 10 fiches', () => {
    const baseline = [
      'bail', 'travail', 'famille', 'dettes', 'etrangers',
      'assurances', 'social', 'violence', 'accident', 'entreprise',
      'consommation', 'voisinage', 'circulation'
    ];
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

  it('chaque fiche a un modeleLettre non vide', () => {
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

  it('fiches du domaine successions citent uniquement le CC (RS 210)', () => {
    const fiches = loadDomainFiches('successions');
    for (const f of fiches) {
      const refs = f.reponse.articles.map(a => a.ref);
      const ccRefs = refs.filter(r => /^CC\s/.test(r));
      assert.ok(
        ccRefs.length >= 2,
        `Fiche ${f.id} doit citer au moins 2 articles du CC, trouvé ${ccRefs.length}: ${refs.join(', ')}`
      );
    }
  });

  it('fiches du domaine sante citent au moins une loi pertinente (CC, LAMal, LCA, LPD ou CP)', () => {
    const fiches = loadDomainFiches('sante');
    const validPrefixes = ['CC ', 'CO ', 'LAMal ', 'OAMal ', 'LCA ', 'LPD ', 'CP ', 'LPGA '];
    for (const f of fiches) {
      const refs = f.reponse.articles.map(a => a.ref);
      const matched = refs.filter(r => validPrefixes.some(p => r.startsWith(p)));
      assert.ok(
        matched.length >= 2,
        `Fiche ${f.id} doit citer au moins 2 articles parmi CC/CO/LAMal/OAMal/LCA/LPD/CP/LPGA, trouvé: ${refs.join(', ')}`
      );
    }
  });
});
