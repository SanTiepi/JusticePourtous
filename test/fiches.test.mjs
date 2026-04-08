import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAllFiches, getFichesByDomaine } from '../src/services/fiches.mjs';

const allFiches = getAllFiches();
const domaines = ['bail', 'travail', 'famille', 'dettes', 'etrangers'];

describe('Fiches juridiques', () => {
  it('chaque domaine a au moins 10 fiches', () => {
    for (const d of domaines) {
      const fiches = getFichesByDomaine(d);
      assert.ok(fiches.length >= 10, `Domaine ${d} a ${fiches.length} fiches, attendu >= 10`);
    }
  });

  it('chaque fiche a les champs requis (id, articles, explication, services)', () => {
    for (const f of allFiches) {
      assert.ok(f.id, `Fiche sans id`);
      assert.ok(f.reponse, `Fiche ${f.id} sans reponse`);
      assert.ok(f.reponse.explication, `Fiche ${f.id} sans explication`);
      assert.ok(f.reponse.articles && f.reponse.articles.length > 0, `Fiche ${f.id} sans articles`);
      assert.ok(f.reponse.services && f.reponse.services.length > 0, `Fiche ${f.id} sans services`);
    }
  });

  it('liens fedlex valides (format URL correct)', () => {
    for (const f of allFiches) {
      for (const a of f.reponse.articles) {
        assert.ok(a.lien, `Article ${a.ref} dans ${f.id} sans lien`);
        const validPrefixes = [
          'https://www.fedlex.admin.ch/eli/',
          'https://www.echr.coe.int/',          // CEDH
          'https://eur-lex.europa.eu/',          // EU law (Schengen, Dublin)
          'https://www.unhcr.org/',              // UNHCR conventions
          'https://www.ohchr.org/',              // UN human rights
          'https://www.hcch.net/',               // Hague conventions
          'https://www.lexfind.ch/',             // Lois cantonales
          'https://www.bger.ch/',                // Tribunal fédéral
          'https://www.suva.ch/',                // SUVA (assurance accidents)
          'https://www.ahv-iv.ch/',              // AVS/AI
          'https://www.arbeit.swiss/',            // ORP/chômage
        ];
        assert.ok(validPrefixes.some(p => a.lien.startsWith(p)), `Lien invalide pour ${a.ref}: ${a.lien}`);
      }
    }
  });

  it('pas de doublons d\'id', () => {
    const ids = allFiches.map(f => f.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, `Doublons trouves: ${ids.filter((id, i) => ids.indexOf(id) !== i)}`);
  });

  it('tags non vides', () => {
    for (const f of allFiches) {
      assert.ok(f.tags && f.tags.length > 0, `Fiche ${f.id} sans tags`);
      for (const t of f.tags) {
        assert.ok(t.length > 0, `Tag vide dans fiche ${f.id}`);
      }
    }
  });

  it('questions valides', () => {
    for (const f of allFiches) {
      assert.ok(f.questions && f.questions.length > 0, `Fiche ${f.id} sans questions`);
      for (const q of f.questions) {
        assert.ok(q.id, `Question sans id dans fiche ${f.id}`);
        assert.ok(q.text, `Question sans text dans fiche ${f.id}`);
        assert.ok(q.options || q.type, `Question ${q.id} sans options ni type dans fiche ${f.id}`);
      }
    }
  });

  it('modele lettre non vide pour fiches avec action', () => {
    const fichesAvecAction = allFiches.filter(f =>
      f.tags.some(t => ['defaut', 'licenciement', 'impaye', 'contestation', 'resiliation', 'harcelement', 'saisie', 'opposition', 'commandement'].includes(t))
    );
    // At least some fiches with action should have a model letter
    const fichesAvecLettre = fichesAvecAction.filter(f => f.reponse.modeleLettre && f.reponse.modeleLettre.length > 0);
    assert.ok(fichesAvecLettre.length > 0, 'Aucune fiche avec action n\'a de modele de lettre');
  });

  it('services par canton (VD, GE minimum)', () => {
    let vdFound = false;
    let geFound = false;
    for (const f of allFiches) {
      for (const s of f.reponse.services) {
        if (s.canton === 'VD') vdFound = true;
        if (s.canton === 'GE') geFound = true;
      }
    }
    assert.ok(vdFound, 'Aucun service VD trouve dans les fiches');
    assert.ok(geFound, 'Aucun service GE trouve dans les fiches');
  });

  it('disclaimer present sur chaque fiche', () => {
    for (const f of allFiches) {
      assert.ok(f.reponse.disclaimer, `Fiche ${f.id} sans disclaimer`);
      assert.ok(f.reponse.disclaimer.length > 50, `Disclaimer trop court pour fiche ${f.id}`);
    }
  });

  it('routageEcosysteme valide si present', () => {
    for (const f of allFiches) {
      if (f.reponse.routageEcosysteme && Object.keys(f.reponse.routageEcosysteme).length > 0) {
        for (const [key, val] of Object.entries(f.reponse.routageEcosysteme)) {
          assert.ok(val.condition, `Routage ${key} sans condition dans fiche ${f.id}`);
          assert.ok(val.url, `Routage ${key} sans url dans fiche ${f.id}`);
        }
      }
    }
  });
});
