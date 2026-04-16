/**
 * Tests — Dossier Analyzer
 *
 * Teste les composants déterministes (pas de LLM nécessaire).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, buildActorGraph, detectContradictions, detectGaps } from '../src/services/contradiction-detector.mjs';
import { checkInvestigation } from '../src/services/investigation-checklist.mjs';

// ============================================================
// MOCK DATA
// ============================================================

const mockDocs = [
  {
    id: 'doc1',
    filename: 'rapport_autopsie.pdf',
    type: 'rapport_autopsie',
    llm_extraction: {
      resume: 'Rapport autopsie Benoit Fragniere',
      date_document: '10.05.2023',
      expediteur: 'CURML',
      destinataire: 'Ministère public',
      faits: [
        { date: '25.07.2022', heure: '09:20', acteur: 'CURML', action: 'Examen externe du corps', lieu: 'CURML Lausanne' },
        { date: '25.07.2022', heure: '11:00', acteur: 'CURML', action: 'Autopsie médico-légale', lieu: 'CURML Lausanne' },
        { date: '21.07.2022', heure: '15:13', acteur: 'Benoit', action: 'Décès constaté au CHUV', lieu: 'CHUV' },
      ],
      claims: [
        { texte: 'Le décès est consécutif à des lésions traumatiques crânio-cérébrales sévères', source: 'CURML', certitude: 'etabli' },
        { texte: 'Nous ne pouvons pas exclure formellement l\'intervention d\'un tiers', source: 'CURML', certitude: 'etabli' },
        { texte: 'Une chute de sa hauteur peut être à l\'origine des lésions', source: 'CURML', certitude: 'etabli' },
      ],
      contradictions: [],
      questions_sans_reponse: ['Circonstances exactes de la chute', 'Datation précise des ecchymoses corporelles'],
      mesures_demandees: [],
      mesures_refusees: [],
      base_legale: ['CPP 253'],
    },
  },
  {
    id: 'doc2',
    filename: 'rapport_investigation.pdf',
    type: 'rapport_investigation',
    llm_extraction: {
      resume: 'Rapport investigation police',
      date_document: '06.06.2023',
      expediteur: 'Insp. WORROD',
      destinataire: 'Procureure MAY',
      faits: [
        { date: '16.07.2022', heure: '14:21', acteur: 'PAPA', action: 'Arrivée au domicile de Benoit', lieu: 'Echichens' },
        { date: '16.07.2022', heure: '15:27', acteur: 'PAPA', action: 'Paiement au Landi Bussy-Chardonney', lieu: 'Landi' },
        { date: '16.07.2022', heure: '18:30', acteur: 'Elisa', action: 'Découverte de Benoit inconscient', lieu: 'Echichens' },
        { date: '16.07.2022', heure: '22:39', acteur: 'CHUV', action: 'Police alertée par médecin', lieu: 'CHUV' },
      ],
      claims: [
        { texte: 'Il apparaît que l\'intervention d\'un tiers peut être écartée', source: 'Police', certitude: 'etabli' },
        { texte: 'Le logement a été retrouvé verrouillé', source: 'Police', certitude: 'etabli' },
        { texte: 'La scène a été nettoyée et rangée par la famille avant l\'arrivée de la police', source: 'Police', certitude: 'etabli' },
      ],
      contradictions: [
        { element: 'Heure de départ de Papa', version_a: '16:25 (1ère audition)', version_b: '~15:10 (calcul police via Landi)' },
      ],
      questions_sans_reponse: ['Emploi du temps de Papa entre 15h et 18h30'],
      mesures_demandees: [],
      mesures_refusees: [],
      base_legale: [],
    },
  },
  {
    id: 'doc3',
    filename: 'recours_19.09.23.pdf',
    type: 'recours',
    llm_extraction: {
      resume: 'Recours contre ordonnance de classement',
      date_document: '19.09.2023',
      expediteur: 'Me Jacques MICHOD',
      destinataire: 'Chambre des recours pénale',
      faits: [],
      claims: [
        { texte: 'Les déclarations d\'Elia Papa n\'ont jamais été vérifiées objectivement', source: 'Me Michod', certitude: 'etabli' },
        { texte: 'Aucune enquête de voisinage n\'a été menée', source: 'Me Michod', certitude: 'etabli' },
      ],
      contradictions: [],
      questions_sans_reponse: [],
      mesures_demandees: [
        'Identifier le titulaire de la carte Landi',
        'Audition Isabel Candeias',
        'Extraction téléphones Papa',
        'Avis médical lésion cou',
      ],
      mesures_refusees: [
        'Identifier le titulaire de la carte Landi',
        'Audition Isabel Candeias',
        'Extraction téléphones Papa',
        'Avis médical lésion cou',
      ],
      base_legale: ['CPP 6', 'CPP 319', 'CEDH 2'],
    },
  },
];

// ============================================================
// TESTS: TIMELINE
// ============================================================

describe('Timeline Builder', () => {
  it('builds sorted timeline from multiple documents', () => {
    const timeline = buildTimeline(mockDocs);
    assert.ok(timeline.length > 0, 'Timeline should have events');

    // Check sorting
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].date && timeline[i - 1].date) {
        assert.ok(timeline[i].date >= timeline[i - 1].date || timeline[i].heure >= timeline[i - 1].heure,
          `Timeline should be sorted: ${timeline[i - 1].date} ${timeline[i - 1].heure} before ${timeline[i].date} ${timeline[i].heure}`);
      }
    }
  });

  it('tracks source document for each event', () => {
    const timeline = buildTimeline(mockDocs);
    for (const e of timeline) {
      assert.ok(e.source_doc, 'Each event should have a source document');
      assert.ok(e.doc_id, 'Each event should have a document ID');
    }
  });
});

// ============================================================
// TESTS: CONTRADICTION DETECTION
// ============================================================

describe('Contradiction Detector', () => {
  it('detects intra-document contradictions', () => {
    const result = detectContradictions(mockDocs);
    const intra = result.contradictions.filter(c => c.type === 'intra_document');
    assert.ok(intra.length >= 1, 'Should detect Papa time contradiction from investigation report');
  });

  it('detects divergent conclusions (CURML vs Police)', () => {
    const result = detectContradictions(mockDocs);
    const divergent = result.contradictions.filter(c => c.type === 'conclusion_divergente');
    assert.ok(divergent.length >= 1, 'Should detect CURML vs Police divergence');
  });

  it('collects unresolved questions across documents', () => {
    const result = detectContradictions(mockDocs);
    assert.ok(result.unresolved_questions.length >= 2, 'Should collect questions from multiple docs');
  });
});

// ============================================================
// TESTS: GAP DETECTION
// ============================================================

describe('Gap Detection', () => {
  it('counts requested vs refused measures', () => {
    const result = detectGaps(mockDocs);
    assert.equal(result.total_requested, 4, 'Should find 4 requested measures');
    assert.equal(result.total_refused, 4, 'Should find 4 refused measures');
  });
});

// ============================================================
// TESTS: ACTOR GRAPH
// ============================================================

describe('Actor Graph', () => {
  it('identifies actors from documents', () => {
    const graph = buildActorGraph(mockDocs);
    assert.ok(Object.keys(graph).length >= 2, 'Should identify at least 2 actors');
  });

  it('tracks roles per actor', () => {
    const graph = buildActorGraph(mockDocs);
    const curml = graph['CURML'];
    if (curml) {
      assert.ok(curml.roles.includes('expediteur'), 'CURML should be expediteur');
    }
  });
});

// ============================================================
// TESTS: INVESTIGATION CHECKLIST
// ============================================================

describe('Investigation Checklist', () => {
  it('fails on missing police alert delay', () => {
    const facts = {
      type_deces: 'suspect',
      lieu_deces: 'domicile',
      heure_decouverte: '18:30',
      heure_alerte_police: '22:39',
      scene_preservee: false,
      scene_nettoyee: true,
      photos_scene: false,
      prelevements_scene: false,
      autopsie_ordonnee: true,
      date_autopsie: '25.07.2022',
      dernier_contact_connu: true,
      temoin_cle_auditionne: true,
      nb_auditions_temoin: 2,
      declarations_verifiees: false,
      telephone_suspect_extrait: false,
      enquete_voisinage: false,
      decouvreur_auditionne: false,
      toxicologie_faite: true,
      prelevements_effectues: ['sang', 'urine', 'frottis', 'cheveux'],
      prelevements_avec_resultats: 2,
      rapport_autopsie_ne_peut_exclure_tiers: true,
      hypothese_tiers_investiguee: false,
      classement: true,
      date_deces: '21.07.2022',
      date_classement: '01.09.2023',
      famille_informee_droits: false,
      tous_acces_verifies: false,
      nb_acces_verifies: 1,
      nb_acces_total: 2,
    };

    const result = checkInvestigation(facts);

    // Score should be low
    assert.ok(result.score < 50, `Score should be low for Benoit case: got ${result.score}%`);
    assert.equal(result.status, 'insuffisant', 'Status should be insuffisant');
    assert.ok(result.critical_failures >= 3, `Should have multiple critical failures: got ${result.critical_failures}`);
  });

  it('passes on well-conducted investigation', () => {
    const goodFacts = {
      type_deces: 'suspect',
      lieu_deces: 'domicile',
      heure_decouverte: '18:30',
      heure_alerte_police: '18:45',
      scene_preservee: true,
      scene_nettoyee: false,
      photos_scene: true,
      prelevements_scene: true,
      autopsie_ordonnee: true,
      date_autopsie: '18.07.2022',
      dernier_contact_connu: true,
      temoin_cle_auditionne: true,
      nb_auditions_temoin: 3,
      declarations_verifiees: true,
      telephone_suspect_extrait: true,
      enquete_voisinage: true,
      decouvreur_auditionne: true,
      toxicologie_faite: true,
      prelevements_effectues: ['sang', 'urine'],
      prelevements_avec_resultats: 2,
      rapport_autopsie_ne_peut_exclure_tiers: false,
      hypothese_tiers_investiguee: true,
      classement: false,
      date_deces: '21.07.2022',
      date_classement: null,
      famille_informee_droits: true,
      tous_acces_verifies: true,
      nb_acces_verifies: 2,
      nb_acces_total: 2,
    };

    const result = checkInvestigation(goodFacts);
    assert.ok(result.score >= 80, `Good investigation should score high: got ${result.score}%`);
    assert.equal(result.critical_failures, 0, 'No critical failures for good investigation');
  });
});

// ============================================================
// TESTS: DOSSIER BENOIT (integration — no LLM)
// ============================================================

describe('Dossier Benoit — Checklist Simulation', () => {
  it('reproduces known failures from the Benoit case', () => {
    // These are the KNOWN facts from our manual analysis
    const benoitFacts = {
      type_deces: 'suspect',
      lieu_deces: 'domicile',
      heure_decouverte: '18:30',
      heure_alerte_police: '22:39', // 4h de retard
      scene_preservee: false,
      scene_nettoyee: true,
      photos_scene: false, // Photos mentionnées mais absentes du dossier
      prelevements_scene: false,
      autopsie_ordonnee: true,
      date_autopsie: '25.07.2022',
      dernier_contact_connu: true,
      temoin_cle_auditionne: true,
      nb_auditions_temoin: 2,
      declarations_verifiees: false, // Jamais vérifié objectivement
      telephone_suspect_extrait: false,
      enquete_voisinage: false,
      decouvreur_auditionne: false, // Elisa jamais formellement auditionnée
      toxicologie_faite: true,
      prelevements_effectues: ['frottis sous-ungueaux', 'frottis génitaux', 'cheveux', 'contenu gastrique', 'sang', 'urine'],
      prelevements_avec_resultats: 2, // Seuls sang et urine ont des résultats
      rapport_autopsie_ne_peut_exclure_tiers: true,
      hypothese_tiers_investiguee: false,
      classement: true,
      date_deces: '21.07.2022',
      date_classement: '01.09.2023',
      famille_informee_droits: false,
      tous_acces_verifies: false,
      nb_acces_verifies: 1,
      nb_acces_total: 2,
    };

    const result = checkInvestigation(benoitFacts);

    // Specific failures we expect
    const failedIds = result.results.filter(r => r.applicable && !r.satisfied).map(r => r.check_id);

    assert.ok(failedIds.includes('alerte_police_immediate'), 'Should fail: 4h delay to alert police');
    assert.ok(failedIds.includes('preservation_scene'), 'Should fail: scene was cleaned');
    assert.ok(failedIds.includes('verification_declarations_temoin'), 'Should fail: Papa declarations never verified');
    assert.ok(failedIds.includes('extraction_telephone_suspect'), 'Should fail: Papa phone never extracted');
    assert.ok(failedIds.includes('instruction_bidirectionnelle'), 'Should fail: only accident hypothesis investigated');
    assert.ok(failedIds.includes('in_dubio_pro_duriore'), 'Should fail: classified despite impossibility to exclude third party');
    assert.ok(failedIds.includes('verification_acces_domicile'), 'Should fail: garden door never checked');

    console.log(`\n  Dossier Benoit: ${result.score}% — ${failedIds.length} obligations non remplies`);
    console.log(`  Manquements critiques: ${result.critical_failures}`);
  });
});
