/**
 * Tests directs pour src/services/contradiction-detector.mjs
 *
 * 4 fonctions pures déterministes : buildTimeline, buildActorGraph,
 * detectContradictions, detectGaps. Zéro LLM, zéro réseau.
 *
 * La couverture existante dans dossier-analyzer.test.mjs ne teste que
 * des happy paths sur des mockDocs réalistes (cas Fragnière). Ces tests
 * couvrent les entrées dégénérées, les guards optionnels, et les
 * comportements de chaque branche de logique.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTimeline,
  buildActorGraph,
  detectContradictions,
  detectGaps,
} from '../src/services/contradiction-detector.mjs';

// ─── buildTimeline ────────────────────────────────────────────────────────────

describe('buildTimeline — entrées dégénérées', () => {
  it('tableau vide → tableau vide', () => {
    assert.deepEqual(buildTimeline([]), []);
  });

  it('doc sans llm_extraction → ignoré', () => {
    const result = buildTimeline([{ id: 'x', filename: 'test.pdf' }]);
    assert.deepEqual(result, []);
  });

  it('doc avec llm_extraction.faits null → ignoré', () => {
    const result = buildTimeline([{ id: 'x', filename: 'test.pdf', llm_extraction: { faits: null } }]);
    assert.deepEqual(result, []);
  });

  it('doc avec llm_extraction.faits vide → aucun événement', () => {
    const result = buildTimeline([{ id: 'x', filename: 'test.pdf', llm_extraction: { faits: [] } }]);
    assert.deepEqual(result, []);
  });
});

describe('buildTimeline — champs extraits', () => {
  it('extrait source_doc, doc_id, acteur, action, lieu, heure', () => {
    const docs = [{
      id: 'doc1',
      filename: 'rapport.pdf',
      type: 'rapport_investigation',
      llm_extraction: {
        faits: [{ date: '01.01.2025', heure: '10:00', acteur: 'Police', action: 'Constat', lieu: 'Genève' }],
      },
    }];
    const timeline = buildTimeline(docs);
    assert.equal(timeline.length, 1);
    assert.equal(timeline[0].source_doc, 'rapport.pdf');
    assert.equal(timeline[0].doc_id, 'doc1');
    assert.equal(timeline[0].acteur, 'Police');
    assert.equal(timeline[0].action, 'Constat');
    assert.equal(timeline[0].lieu, 'Genève');
    assert.equal(timeline[0].heure, '10:00');
  });

  it('acteur absent → "inconnu" par défaut', () => {
    const docs = [{
      id: 'd1', filename: 'a.pdf', type: 'x',
      llm_extraction: { faits: [{ action: 'Intervention' }] },
    }];
    const timeline = buildTimeline(docs);
    assert.equal(timeline[0].acteur, 'inconnu');
  });
});

describe('buildTimeline — tri', () => {
  it('trie par date DD.MM.YYYY croissant', () => {
    const docs = [
      { id: 'd1', filename: 'a.pdf', type: 'x', llm_extraction: { faits: [{ date: '15.06.2025', action: 'B' }] } },
      { id: 'd2', filename: 'b.pdf', type: 'x', llm_extraction: { faits: [{ date: '01.03.2025', action: 'A' }] } },
    ];
    const timeline = buildTimeline(docs);
    assert.equal(timeline[0].action, 'A');
    assert.equal(timeline[1].action, 'B');
  });

  it('trie par date YYYY-MM-DD croissant', () => {
    const docs = [
      { id: 'd1', filename: 'a.pdf', type: 'x', llm_extraction: { faits: [{ date: '2025-06-15', action: 'B' }] } },
      { id: 'd2', filename: 'b.pdf', type: 'x', llm_extraction: { faits: [{ date: '2025-03-01', action: 'A' }] } },
    ];
    const timeline = buildTimeline(docs);
    assert.equal(timeline[0].action, 'A');
    assert.equal(timeline[1].action, 'B');
  });

  it('trie par heure quand même date', () => {
    const docs = [
      { id: 'd1', filename: 'a.pdf', type: 'x', llm_extraction: { faits: [{ date: '01.01.2025', heure: '14:00', action: 'B' }] } },
      { id: 'd2', filename: 'b.pdf', type: 'x', llm_extraction: { faits: [{ date: '01.01.2025', heure: '09:30', action: 'A' }] } },
    ];
    const timeline = buildTimeline(docs);
    assert.equal(timeline[0].action, 'A');
    assert.equal(timeline[1].action, 'B');
  });
});

// ─── buildActorGraph ──────────────────────────────────────────────────────────

describe('buildActorGraph — entrées dégénérées', () => {
  it('tableau vide → objet vide', () => {
    assert.deepEqual(buildActorGraph([]), {});
  });

  it('doc sans llm_extraction → ignoré', () => {
    const graph = buildActorGraph([{ id: 'x', filename: 'test.pdf' }]);
    assert.deepEqual(graph, {});
  });

  it('llm_extraction sans expediteur/destinataire → aucun acteur', () => {
    const graph = buildActorGraph([{ id: 'x', filename: 'test.pdf', llm_extraction: {} }]);
    assert.deepEqual(graph, {});
  });
});

describe('buildActorGraph — tracking acteurs', () => {
  it('expediteur → role expediteur, docs_count=1, claims_count=0', () => {
    const docs = [{
      id: 'd1', filename: 'lettre.pdf', type: 'x',
      llm_extraction: { expediteur: 'Police', claims: [] },
    }];
    const graph = buildActorGraph(docs);
    assert.ok(graph['Police'], 'Police doit être un acteur');
    assert.ok(graph['Police'].roles.includes('expediteur'));
    assert.equal(graph['Police'].docs_count, 1);
    assert.equal(graph['Police'].claims_count, 0);
  });

  it('destinataire → role destinataire', () => {
    const docs = [{
      id: 'd1', filename: 'lettre.pdf', type: 'x',
      llm_extraction: { destinataire: 'Ministere', claims: [] },
    }];
    const graph = buildActorGraph(docs);
    assert.ok(graph['Ministere'].roles.includes('destinataire'));
  });

  it('claim pour acteur connu (expediteur) → claims_count++', () => {
    const docs = [{
      id: 'd1', filename: 'rapport.pdf', type: 'x',
      llm_extraction: {
        expediteur: 'Expert',
        claims: [{ source: 'Expert', texte: 'La victime est tombée', certitude: 'etabli' }],
      },
    }];
    const graph = buildActorGraph(docs);
    assert.equal(graph['Expert'].claims_count, 1);
    assert.equal(graph['Expert'].claims[0].texte, 'La victime est tombée');
  });

  it('claim pour acteur inconnu (source absent) → ignoré sans crash', () => {
    const docs = [{
      id: 'd1', filename: 'rapport.pdf', type: 'x',
      llm_extraction: { claims: [{ source: 'Fantome', texte: 'test', certitude: 'probable' }] },
    }];
    assert.doesNotThrow(() => buildActorGraph(docs));
    const graph = buildActorGraph(docs);
    assert.equal(Object.keys(graph).length, 0);
  });
});

// ─── detectGaps ───────────────────────────────────────────────────────────────

describe('detectGaps — entrées dégénérées', () => {
  it('tableau vide → 0 mesures, acceptance_rate N/A', () => {
    const result = detectGaps([]);
    assert.equal(result.total_requested, 0);
    assert.equal(result.total_refused, 0);
    assert.equal(result.acceptance_rate, 'N/A');
  });

  it('doc sans llm_extraction → ignoré', () => {
    const result = detectGaps([{ id: 'x', filename: 'test.pdf' }]);
    assert.equal(result.total_requested, 0);
  });
});

describe('detectGaps — calculs', () => {
  it('mesures_demandees uniquement → total_refused=0, acceptance_rate=100%', () => {
    const docs = [{
      id: 'd1', filename: 'a.pdf', type: 'x',
      llm_extraction: { mesures_demandees: ['autopsie', 'prélèvements'] },
    }];
    const result = detectGaps(docs);
    assert.equal(result.total_requested, 2);
    assert.equal(result.total_refused, 0);
    assert.equal(result.acceptance_rate, '100.0%');
  });

  it('toutes les mesures refusées → acceptance_rate=0%', () => {
    const docs = [{
      id: 'd1', filename: 'a.pdf', type: 'x',
      llm_extraction: {
        mesures_demandees: ['autopsie', 'scène de crime'],
        mesures_refusees: ['autopsie', 'scène de crime'],
      },
    }];
    const result = detectGaps(docs);
    assert.equal(result.total_requested, 2);
    assert.equal(result.total_refused, 2);
    assert.equal(result.acceptance_rate, '0.0%');
  });

  it('tableau requested contient {mesure, source}', () => {
    const docs = [{
      id: 'd1', filename: 'demande.pdf', type: 'x',
      llm_extraction: { mesures_demandees: ['analyse toxicologie'], mesures_refusees: [] },
    }];
    const result = detectGaps(docs);
    assert.ok(Array.isArray(result.requested));
    assert.equal(result.requested[0].mesure, 'analyse toxicologie');
    assert.equal(result.requested[0].source, 'demande.pdf');
  });
});

// ─── detectContradictions ─────────────────────────────────────────────────────

describe('detectContradictions — entrées dégénérées', () => {
  it('tableau vide → tout vide', () => {
    const result = detectContradictions([]);
    assert.deepEqual(result.contradictions, []);
    assert.deepEqual(result.unresolved_questions, []);
    assert.deepEqual(result.timeline, []);
  });

  it('doc sans llm_extraction → aucune contradiction', () => {
    const result = detectContradictions([{ id: 'x', filename: 'test.pdf' }]);
    assert.deepEqual(result.contradictions, []);
  });
});

describe('detectContradictions — intra_document', () => {
  it('contradiction dans llm_extraction → type intra_document, severity moyenne', () => {
    const docs = [{
      id: 'd1', filename: 'rapport.pdf', type: 'rapport_investigation',
      llm_extraction: {
        contradictions: [{ element: 'heure décès', version_a: '10h00', version_b: '14h00' }],
      },
    }];
    const result = detectContradictions(docs);
    const intra = result.contradictions.filter(c => c.type === 'intra_document');
    assert.equal(intra.length, 1);
    assert.equal(intra[0].severity, 'moyenne');
    assert.equal(intra[0].element, 'heure décès');
    assert.equal(intra[0].source, 'rapport.pdf');
  });
});

describe('detectContradictions — temporelle', () => {
  it('même action dans 2 docs, heures différentes → contradiction temporelle severity haute', () => {
    const action = 'constat sur place';
    const docs = [
      { id: 'd1', filename: 'doc1.pdf', type: 'x', llm_extraction: { faits: [{ date: '01.01.2025', heure: '08:00', action }] } },
      { id: 'd2', filename: 'doc2.pdf', type: 'x', llm_extraction: { faits: [{ date: '01.01.2025', heure: '10:00', action }] } },
    ];
    const result = detectContradictions(docs);
    const temporal = result.contradictions.filter(c => c.type === 'temporelle');
    assert.ok(temporal.length >= 1, 'doit détecter une contradiction temporelle');
    assert.equal(temporal[0].severity, 'haute');
    assert.ok(temporal[0].description.includes('08:00') || temporal[0].description.includes('10:00'));
  });

  it('même action dans 2 docs, même heure → pas de contradiction temporelle', () => {
    const action = 'arrivée sur place';
    const docs = [
      { id: 'd1', filename: 'doc1.pdf', type: 'x', llm_extraction: { faits: [{ date: '01.01.2025', heure: '08:00', action }] } },
      { id: 'd2', filename: 'doc2.pdf', type: 'x', llm_extraction: { faits: [{ date: '01.01.2025', heure: '08:00', action }] } },
    ];
    const result = detectContradictions(docs);
    const temporal = result.contradictions.filter(c => c.type === 'temporelle');
    assert.equal(temporal.length, 0, 'pas de contradiction si mêmes heures');
  });
});

describe('detectContradictions — questions sans réponse', () => {
  it('questions collectées depuis plusieurs docs, dédupliquées sur 50 chars', () => {
    const docs = [
      {
        id: 'd1', filename: 'doc1.pdf', type: 'x',
        llm_extraction: { questions_sans_reponse: ['Qui était présent au moment des faits ?', 'Quelle était la cause exacte ?'] },
      },
      {
        id: 'd2', filename: 'doc2.pdf', type: 'x',
        llm_extraction: { questions_sans_reponse: ['Qui était présent au moment des faits ?', 'Quand précisément est-ce arrivé ?'] },
      },
    ];
    const result = detectContradictions(docs);
    // 'Qui était présent au moment des faits ?' dédupliqué → 3 questions uniques
    assert.equal(result.unresolved_questions.length, 3);
  });

  it('une seule doc avec questions → toutes conservées, non dédupliquées entre elles', () => {
    const docs = [{
      id: 'd1', filename: 'doc1.pdf', type: 'x',
      llm_extraction: { questions_sans_reponse: ['Question A ?', 'Question B ?'] },
    }];
    const result = detectContradictions(docs);
    assert.equal(result.unresolved_questions.length, 2);
  });
});
