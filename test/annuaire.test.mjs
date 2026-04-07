import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getServicesByCanton } from '../src/services/annuaire.mjs';

describe('Annuaire', () => {
  it('VD a au moins 3 services', () => {
    const services = getServicesByCanton('VD');
    assert.ok(services.length >= 3, `VD a ${services.length} services`);
  });

  it('GE a au moins 3 services', () => {
    const services = getServicesByCanton('GE');
    assert.ok(services.length >= 3, `GE a ${services.length} services`);
  });

  it('VS a au moins 1 service', () => {
    const services = getServicesByCanton('VS');
    assert.ok(services.length >= 1, `VS a ${services.length} services`);
  });

  it('canton inconnu retourne liste vide (pas erreur)', () => {
    const services = getServicesByCanton('XX');
    assert.ok(Array.isArray(services));
    assert.equal(services.length, 0);
  });

  it('chaque service a nom + (tel ou url)', () => {
    const cantons = ['VD', 'GE', 'VS', 'FR', 'NE'];
    for (const canton of cantons) {
      const services = getServicesByCanton(canton);
      for (const s of services) {
        assert.ok(s.nom, `Service sans nom dans canton ${canton}`);
        assert.ok(s.tel || s.url, `Service ${s.nom} sans tel ni url dans canton ${canton}`);
      }
    }
  });

  it('types de services varies (asloca, csp, syndicat, conciliation)', () => {
    const allServices = [...getServicesByCanton('VD'), ...getServicesByCanton('GE')];
    const types = new Set(allServices.map(s => s.type));
    assert.ok(types.has('asloca'), 'Pas de service type asloca');
    assert.ok(types.has('csp'), 'Pas de service type csp');
    assert.ok(types.has('syndicat'), 'Pas de service type syndicat');
    assert.ok(types.has('conciliation'), 'Pas de service type conciliation');
  });
});
