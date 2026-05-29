/**
 * Tests directs des exports de donnees-juridiques.mjs.
 *
 * Ces fonctions sont testées ailleurs via HTTP uniquement — ce fichier
 * régression-locke les invariants de chargement + recherche sans
 * démarrer de serveur (0 réseau, ~100ms).
 *
 * Invariants vérifiés :
 *  - status 200 sur les getters de corpus
 *  - total === longueur du tableau retourné
 *  - recherche vide = tout, terme nonsense = rien, terme connu = sous-ensemble
 *  - lookups par ID/code : 200 si trouvé, 404 sinon
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getAllArticles, searchArticles,
  getAllArrets, searchArrets,
  getNiveauxConfiance,
  getRecevabilite, getRecevabiliteByProcedure,
  getDelais, getDelaisByDomaine,
  getAntiErreurs, getAntiErreursByDomaine,
  getPatterns, getPatternsByDomaine,
  getCasPratiques, getCasByDomaine,
  getEscalade, getEscaladeByDomaine,
  getAnnuaireComplet, getAnnuaireByCanton,
  getCantons, getCantonByCode,
  getTemplates, getTemplateById,
  getCouverture,
} from '../src/services/donnees-juridiques.mjs';

// ─── Articles ─────────────────────────────────────────────────

describe('getAllArticles', () => {
  it('retourne status 200 et un tableau non vide', () => {
    const r = getAllArticles();
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.data.articles));
    assert.ok(r.data.total > 0, 'corpus articles vide');
  });

  it('total == longueur du tableau', () => {
    const r = getAllArticles();
    assert.equal(r.data.total, r.data.articles.length);
  });
});

describe('searchArticles', () => {
  it('terme vide retourne tous les articles', () => {
    const all = getAllArticles().data.total;
    const r = searchArticles('');
    assert.equal(r.data.total, all);
  });

  it('terme connu "CC" retourne un sous-ensemble non vide', () => {
    const r = searchArticles('CC');
    assert.ok(r.data.total > 0, 'aucun article contenant "CC"');
    assert.ok(r.data.total < getAllArticles().data.total, 'devrait filtrer');
  });

  it('terme absolu nonsense retourne 0 résultat', () => {
    const r = searchArticles('XXXXXXXXNOTFOUND_XYZ');
    assert.equal(r.data.total, 0);
    assert.deepEqual(r.data.articles, []);
  });

  it('total == longueur du tableau sur résultat filtré', () => {
    const r = searchArticles('CC');
    assert.equal(r.data.total, r.data.articles.length);
  });
});

// ─── Arrêts TF ────────────────────────────────────────────────

describe('getAllArrets', () => {
  it('retourne status 200 et un tableau non vide', () => {
    const r = getAllArrets();
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0, 'corpus arrêts vide');
    assert.equal(r.data.total, r.data.arrets.length);
  });
});

describe('searchArrets', () => {
  it('terme vide retourne tous les arrêts', () => {
    const all = getAllArrets().data.total;
    const r = searchArrets('');
    assert.equal(r.data.total, all);
  });

  it('terme nonsense retourne 0', () => {
    const r = searchArrets('XXXXXXXXNOTFOUND_XYZ');
    assert.equal(r.data.total, 0);
  });
});

// ─── Recevabilité ─────────────────────────────────────────────

describe('getRecevabilite', () => {
  it('status 200, tableau non vide', () => {
    const r = getRecevabilite();
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
    assert.equal(r.data.total, r.data.conditions.length);
  });
});

describe('getRecevabiliteByProcedure', () => {
  it('procédure "bail" → status 200', () => {
    const r = getRecevabiliteByProcedure('bail');
    assert.equal(r.status, 200);
    assert.ok(r.data != null);
  });

  it('procédure inconnue → status 404', () => {
    const r = getRecevabiliteByProcedure('FAKE_XYZ_123');
    assert.equal(r.status, 404);
  });
});

// ─── Délais ───────────────────────────────────────────────────

describe('getDelais', () => {
  it('status 200, au moins 1 délai', () => {
    const r = getDelais();
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
    assert.equal(r.data.total, r.data.delais.length);
  });
});

describe('getDelaisByDomaine', () => {
  it('domaine "bail" → au moins 1 délai', () => {
    const r = getDelaisByDomaine('bail');
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0, 'aucun délai pour bail');
  });

  it('domaine insensible à la casse', () => {
    const lower = getDelaisByDomaine('bail').data.total;
    const upper = getDelaisByDomaine('BAIL').data.total;
    assert.equal(lower, upper);
  });

  it('domaine inexistant → tableau vide, status 200', () => {
    const r = getDelaisByDomaine('FAKE_XYZ');
    assert.equal(r.status, 200);
    assert.equal(r.data.total, 0);
  });
});

// ─── Anti-erreurs ─────────────────────────────────────────────

describe('getAntiErreurs', () => {
  it('status 200, au moins 1 règle', () => {
    const r = getAntiErreurs();
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
    assert.equal(r.data.total, r.data.erreurs.length);
  });
});

describe('getAntiErreursByDomaine', () => {
  it('"bail" → sous-ensemble non vide', () => {
    const r = getAntiErreursByDomaine('bail');
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
    assert.ok(r.data.total < getAntiErreurs().data.total, 'devrait filtrer');
  });

  it('domaine inconnu → tableau vide, status 200', () => {
    const r = getAntiErreursByDomaine('FAKE_XYZ');
    assert.equal(r.status, 200);
    assert.equal(r.data.total, 0);
  });
});

// ─── Patterns ─────────────────────────────────────────────────

describe('getPatterns', () => {
  it('status 200, total > 0, total == longueur', () => {
    const r = getPatterns();
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
    assert.equal(r.data.total, r.data.patterns.length);
  });
});

describe('getPatternsByDomaine', () => {
  it('"bail" → sous-ensemble non vide', () => {
    const r = getPatternsByDomaine('bail');
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
  });

  it('domaine inconnu → vide, status 200', () => {
    const r = getPatternsByDomaine('FAKE_XYZ');
    assert.equal(r.status, 200);
    assert.equal(r.data.total, 0);
  });
});

// ─── Cas pratiques ────────────────────────────────────────────

describe('getCasPratiques', () => {
  it('status 200, total > 0', () => {
    const r = getCasPratiques();
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
    assert.equal(r.data.total, r.data.cas.length);
  });
});

describe('getCasByDomaine', () => {
  it('"bail" → sous-ensemble', () => {
    const r = getCasByDomaine('bail');
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
  });
});

// ─── Escalade ─────────────────────────────────────────────────

describe('getEscalade', () => {
  it('status 200, total > 0', () => {
    const r = getEscalade();
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
    assert.equal(r.data.total, r.data.relais.length);
  });
});

describe('getEscaladeByDomaine', () => {
  it('"bail" → sous-ensemble non vide', () => {
    const r = getEscaladeByDomaine('bail');
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
  });

  it('domaine inconnu → vide', () => {
    const r = getEscaladeByDomaine('FAKE_XYZ');
    assert.equal(r.status, 200);
    assert.equal(r.data.total, 0);
  });
});

// ─── Annuaire ─────────────────────────────────────────────────

describe('getAnnuaireComplet', () => {
  it('status 200, services non vide', () => {
    const r = getAnnuaireComplet();
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
    assert.equal(r.data.total, r.data.services.length);
  });
});

describe('getAnnuaireByCanton', () => {
  it('"VD" → résultats non vides', () => {
    const r = getAnnuaireByCanton('VD');
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
  });

  it('normalise en majuscules (vd → VD)', () => {
    const lower = getAnnuaireByCanton('vd').data.total;
    const upper = getAnnuaireByCanton('VD').data.total;
    assert.equal(lower, upper);
  });
});

// ─── Cantons ──────────────────────────────────────────────────

describe('getCantons', () => {
  it('status 200, exactement 26 cantons suisses', () => {
    const r = getCantons();
    assert.equal(r.status, 200);
    assert.equal(r.data.total, 26, 'la Suisse a 26 cantons');
    assert.equal(r.data.total, r.data.cantons.length);
  });
});

describe('getCantonByCode', () => {
  it('"VD" → status 200 avec données', () => {
    const r = getCantonByCode('VD');
    assert.equal(r.status, 200);
    assert.ok(r.data != null);
  });

  it('"GE" → status 200', () => {
    const r = getCantonByCode('GE');
    assert.equal(r.status, 200);
  });

  it('normalise en majuscules ("vd" → trouve "VD")', () => {
    const r = getCantonByCode('vd');
    assert.equal(r.status, 200);
  });

  it('code inconnu "ZZ" → status 404', () => {
    const r = getCantonByCode('ZZ');
    assert.equal(r.status, 404);
    assert.ok(r.error, 'message d\'erreur attendu');
  });
});

// ─── Templates ────────────────────────────────────────────────

describe('getTemplates', () => {
  it('status 200, templates non vides', () => {
    const r = getTemplates();
    assert.equal(r.status, 200);
    assert.ok(r.data.total > 0);
    assert.equal(r.data.total, r.data.templates.length);
  });
});

describe('getTemplateById', () => {
  it('premier template existant → status 200', () => {
    const firstId = getTemplates().data.templates[0].id;
    const r = getTemplateById(firstId);
    assert.equal(r.status, 200);
    assert.equal(r.data.id, firstId);
  });

  it('id inconnu → status 404 avec message', () => {
    const r = getTemplateById('FAKE_TPL_XYZ_000');
    assert.equal(r.status, 404);
    assert.ok(r.error, 'message d\'erreur attendu');
  });
});

// ─── Couverture ───────────────────────────────────────────────

describe('getCouverture', () => {
  it('status 200', () => {
    const r = getCouverture();
    assert.equal(r.status, 200);
  });

  it('data est un objet non null', () => {
    const r = getCouverture();
    assert.ok(r.data != null && typeof r.data === 'object');
  });
});

// ─── getNiveauxConfiance ──────────────────────────────────────

describe('getNiveauxConfiance', () => {
  it('retourne status 200 ou 404 (selon présence du fichier)', () => {
    const r = getNiveauxConfiance();
    assert.ok(r.status === 200 || r.status === 404, `status inattendu: ${r.status}`);
  });
});
