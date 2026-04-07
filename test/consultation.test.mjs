import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { consulter } from '../src/services/consultation.mjs';

describe('Consultation', () => {
  it('domaine bail + moisissure retourne fiche bail_defaut_moisissure', () => {
    const result = consulter({
      domaine: 'bail',
      reponses: ['moisissure', '1-6 mois', 'oui ecrit', 'non'],
      canton: 'VD'
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.fiche.id, 'bail_defaut_moisissure');
  });

  it('domaine travail + licenciement maladie retourne bonne fiche', () => {
    const result = consulter({
      domaine: 'travail',
      reponses: ['licenciement', 'maladie', 'incapacite', 'protection'],
      canton: 'GE'
    });
    assert.equal(result.status, 200);
    assert.ok(result.data.fiche.id.startsWith('travail_'));
  });

  it('domaine inconnu retourne erreur 400', () => {
    const result = consulter({
      domaine: 'inexistant',
      reponses: ['test'],
      canton: 'VD'
    });
    assert.equal(result.status, 400);
    assert.ok(result.error);
  });

  it('reponses incompletes retourne erreur 400', () => {
    const result = consulter({
      domaine: 'bail',
      reponses: [],
      canton: 'VD'
    });
    assert.equal(result.status, 400);
    assert.ok(result.error);
  });

  it('canton invalide retourne erreur 400', () => {
    const result = consulter({
      domaine: 'bail',
      reponses: ['moisissure'],
      canton: 'XX'
    });
    assert.equal(result.status, 400);
    assert.ok(result.error);
  });

  it('matching multi-tags fonctionne', () => {
    const result = consulter({
      domaine: 'bail',
      reponses: ['loyer', 'abusif', 'excessif'],
      canton: 'VD'
    });
    assert.equal(result.status, 200);
    assert.equal(result.data.fiche.id, 'bail_loyer_abusif');
  });

  it('retourne le bon nombre d\'articles', () => {
    const result = consulter({
      domaine: 'bail',
      reponses: ['moisissure'],
      canton: 'VD'
    });
    assert.equal(result.status, 200);
    assert.ok(result.data.fiche.reponse.articles.length >= 1);
  });

  it('retourne les services du bon canton', () => {
    const result = consulter({
      domaine: 'bail',
      reponses: ['moisissure'],
      canton: 'VD'
    });
    assert.equal(result.status, 200);
    const services = result.data.fiche.reponse.services;
    assert.ok(services.length > 0);
    assert.ok(services.every(s => s.canton === 'VD'), 'Tous les services doivent etre du canton VD');
  });
});
