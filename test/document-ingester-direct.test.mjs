/**
 * Tests directs sur les helpers purs de document-ingester.mjs :
 *   - detectDocumentType : 12 patterns × body / filename hints
 *   - extractMetadata    : dates, acteurs, refs légales, montants
 *   - parseJSON          : robustesse extraction JSON depuis texte brut
 *
 * Zéro LLM, zéro réseau, zéro FS (hors ingestDocument non testé ici).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { _internals } from '../src/services/document-ingester.mjs';

const { detectDocumentType, extractMetadata, parseJSON } = _internals;

// ============================================================
// detectDocumentType — patterns dans le body
// ============================================================

describe('detectDocumentType — patterns body', () => {
  it('texte arrêt tribunal → arret_tribunal', () => {
    const text = 'Le tribunal cantonal, chambre des recours, rend l\'arrêt suivant. Considérant ce qui précède, par ces motifs :';
    assert.equal(detectDocumentType(text, 'doc.pdf'), 'arret_tribunal');
  });

  it('texte ordonnance de classement → ordonnance_classement', () => {
    const text = 'Ordonnance de classement. Le Ministère public ordonne le classement de la procédure pénale. Art. 319 CPP.';
    assert.equal(detectDocumentType(text, 'doc.pdf'), 'ordonnance_classement');
  });

  it('texte rapport autopsie → rapport_autopsie', () => {
    const text = 'CURML — Centre universitaire romand de médecine légale. Rapport d\'autopsie. Examen externe. Examen interne. Toxicolog.';
    assert.equal(detectDocumentType(text, 'doc.pdf'), 'rapport_autopsie');
  });

  it('texte PV audition → pv_audition', () => {
    const text = 'Procès-verbal d\'audition. La personne appelée à titre de prévenu, M. Dupont, déclare ce qui suit.';
    assert.equal(detectDocumentType(text, 'doc.pdf'), 'pv_audition');
  });

  it('texte recours → recours', () => {
    const text = 'Recours. Le recourant conclut à l\'annulation de la décision attaquée. Intimé : canton de Vaud. Il est conclu à.';
    assert.equal(detectDocumentType(text, 'doc.pdf'), 'recours');
  });

  it('texte plainte pénale → plainte', () => {
    const text = 'Je soussigné dépose plainte pénale contre X. Dépôt de plainte formelle.';
    assert.equal(detectDocumentType(text, 'doc.pdf'), 'plainte');
  });

  it('texte rapport investigation → rapport_investigation', () => {
    const text = 'Rapport d\'investigation. Brigade criminelle. Enquête de police menée sur les lieux.';
    assert.equal(detectDocumentType(text, 'doc.pdf'), 'rapport_investigation');
  });

  it('texte vide → inconnu', () => {
    assert.equal(detectDocumentType('', 'doc.pdf'), 'inconnu');
  });

  it('texte sans pattern connu → inconnu', () => {
    assert.equal(detectDocumentType('Lorem ipsum dolor sit amet.', 'doc.pdf'), 'inconnu');
  });
});

// ============================================================
// detectDocumentType — hints par nom de fichier
// ============================================================

describe('detectDocumentType — hints filename (priorité sur score body)', () => {
  it('filename "autopsie_rapport.pdf" → rapport_autopsie même si body neutre', () => {
    assert.equal(detectDocumentType('texte neutre', 'autopsie_rapport.pdf'), 'rapport_autopsie');
  });

  it('filename "ordonnance_classement_2024.pdf" → ordonnance_classement', () => {
    assert.equal(detectDocumentType('texte neutre', 'ordonnance_classement_2024.pdf'), 'ordonnance_classement');
  });

  it('filename "arret_cantonal.pdf" → arret_tribunal', () => {
    assert.equal(detectDocumentType('texte neutre', 'arret_cantonal.pdf'), 'arret_tribunal');
  });

  it('filename "pv_audition_dupont.pdf" → pv_audition', () => {
    assert.equal(detectDocumentType('texte neutre', 'pv_audition_dupont.pdf'), 'pv_audition');
  });

  it('filename "recours_TF.pdf" → recours', () => {
    assert.equal(detectDocumentType('texte neutre', 'recours_TF.pdf'), 'recours');
  });

  it('filename "plainte_2024.pdf" → plainte', () => {
    assert.equal(detectDocumentType('texte neutre', 'plainte_2024.pdf'), 'plainte');
  });
});

// ============================================================
// extractMetadata — dates
// ============================================================

describe('extractMetadata — extraction des dates', () => {
  it('format DD.MM.YYYY extrait correctement', () => {
    const m = extractMetadata('Le 15.03.2023, l\'événement a eu lieu.', 'doc.pdf');
    assert.ok(m.dates.includes('15.03.2023'), `dates: ${m.dates}`);
  });

  it('format YYYY-MM-DD extrait correctement', () => {
    const m = extractMetadata('Date : 2023-03-15.', 'doc.pdf');
    assert.ok(m.dates.includes('2023-03-15'), `dates: ${m.dates}`);
  });

  it('format DD/MM/YYYY extrait correctement', () => {
    const m = extractMetadata('Date : 15/03/2023.', 'doc.pdf');
    assert.ok(m.dates.includes('15/03/2023'), `dates: ${m.dates}`);
  });

  it('filename YYMMDD_ → date déduite en tête de liste', () => {
    const m = extractMetadata('aucune date dans le texte', '231015_rapport.pdf');
    assert.equal(m.dates[0], '15.10.2023', `dates[0]: ${m.dates[0]}`);
  });

  it('texte sans date → dates = []', () => {
    const m = extractMetadata('Aucune information temporelle.', 'doc.pdf');
    assert.deepEqual(m.dates, []);
  });
});

// ============================================================
// extractMetadata — références légales
// ============================================================

describe('extractMetadata — références légales', () => {
  it('référence CO 259a extraite', () => {
    const m = extractMetadata('Selon CO 259a, le bailleur est responsable.', 'doc.pdf');
    const hasRef = m.legal_refs.some(r => /CO\s*259a/i.test(r));
    assert.ok(hasRef, `legal_refs: ${m.legal_refs}`);
  });

  it('référence CP 123 extraite', () => {
    const m = extractMetadata('Infraction à CP 123.', 'doc.pdf');
    const hasRef = m.legal_refs.some(r => /CP\s*123/i.test(r));
    assert.ok(hasRef, `legal_refs: ${m.legal_refs}`);
  });

  it('référence CC 684 extraite', () => {
    const m = extractMetadata('Application de CC 684 sur les troubles de voisinage.', 'doc.pdf');
    const hasRef = m.legal_refs.some(r => /CC\s*684/i.test(r));
    assert.ok(hasRef, `legal_refs: ${m.legal_refs}`);
  });

  it('texte sans référence légale → legal_refs = []', () => {
    const m = extractMetadata('Il pleuvait ce matin-là.', 'doc.pdf');
    assert.deepEqual(m.legal_refs, []);
  });

  it('plusieurs références dans un même texte → toutes extraites', () => {
    const m = extractMetadata('CO 259a et CPP 319 et CC 684.', 'doc.pdf');
    assert.ok(m.legal_refs.length >= 3, `legal_refs count: ${m.legal_refs.length}`);
  });
});

// ============================================================
// extractMetadata — montants
// ============================================================

describe('extractMetadata — montants CHF', () => {
  it('montant "CHF 5\'000" extrait', () => {
    const m = extractMetadata('Le montant de CHF 5\'000 est dû.', 'doc.pdf');
    assert.ok(m.amounts.length > 0, 'amounts non vide');
  });

  it('montant "Fr. 500" extrait', () => {
    const m = extractMetadata('Indemnité de Fr. 500.', 'doc.pdf');
    assert.ok(m.amounts.length > 0, 'amounts non vide');
  });

  it('texte sans montant → amounts = []', () => {
    const m = extractMetadata('Aucun montant mentionné ici.', 'doc.pdf');
    assert.deepEqual(m.amounts, []);
  });
});

// ============================================================
// parseJSON — robustesse extraction
// ============================================================

describe('parseJSON — extraction JSON depuis texte brut', () => {
  it('JSON propre → parsé', () => {
    const r = parseJSON('{"foo":"bar","n":42}');
    assert.deepEqual(r, { foo: 'bar', n: 42 });
  });

  it('JSON dans balises ```json...``` → parsé', () => {
    const r = parseJSON('```json\n{"foo":"bar"}\n```');
    assert.deepEqual(r, { foo: 'bar' });
  });

  it('JSON précédé de texte introductif → parsé (trouve le {)', () => {
    const r = parseJSON('Voici le résultat JSON : {"ok":true}');
    assert.deepEqual(r, { ok: true });
  });

  it('texte sans accolade → null', () => {
    const r = parseJSON('pas de JSON ici');
    assert.equal(r, null);
  });

  it('chaîne vide → null', () => {
    const r = parseJSON('');
    assert.equal(r, null);
  });

  it('JSON malformé (virgule finale) → null', () => {
    const r = parseJSON('{"foo":"bar",}');
    assert.equal(r, null);
  });

  it('JSON imbriqué → parsé correctement', () => {
    const r = parseJSON('{"a":{"b":1},"c":[2,3]}');
    assert.deepEqual(r, { a: { b: 1 }, c: [2, 3] });
  });
});
