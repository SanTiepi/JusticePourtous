/**
 * Investigation Checklist — Règles procédurales en code exécutable
 *
 * Réutilise le pattern du normative-compiler.mjs mais pour les
 * obligations d'enquête pénale en droit suisse.
 *
 * Chaque règle : condition → obligation → vérification → source
 * Le code VÉRIFIE si l'obligation a été remplie dans le dossier.
 */

// ============================================================
// RULE ENGINE (copié du normative-compiler)
// ============================================================

function execCheck(check, dossierFacts) {
  const result = {
    check_id: check.id,
    label: check.label,
    obligation: check.obligation,
    applicable: false,
    satisfied: false,
    severity: check.severity, // critique | haute | moyenne
    source_legale: check.source_legale,
    detail: null,
  };

  if (!check.condition(dossierFacts)) return result;
  result.applicable = true;
  result.satisfied = check.verify(dossierFacts);
  result.detail = check.detail(dossierFacts);

  return result;
}

// ============================================================
// DEATH INVESTIGATION CHECKLIST
// ============================================================

const DEATH_INVESTIGATION_CHECKS = [
  // --- PHASE 1: IMMEDIATE (0-24h) ---
  {
    id: 'alerte_police_immediate',
    label: 'Alerte police dans un délai raisonnable',
    obligation: 'La police doit être alertée immédiatement en cas de mort suspecte',
    severity: 'critique',
    source_legale: 'CPP 302 (obligation de dénoncer)',
    condition: (f) => f.type_deces === 'suspect' || f.type_deces === 'violent',
    verify: (f) => {
      if (!f.heure_decouverte || !f.heure_alerte_police) return false;
      const diff = timeDiffHours(f.heure_decouverte, f.heure_alerte_police);
      return diff !== null && diff <= 2;
    },
    detail: (f) => {
      if (!f.heure_decouverte || !f.heure_alerte_police) return 'Heures non documentées';
      const diff = timeDiffHours(f.heure_decouverte, f.heure_alerte_police);
      return `Découverte: ${f.heure_decouverte}, Alerte police: ${f.heure_alerte_police} (${diff}h de délai)`;
    },
  },
  {
    id: 'preservation_scene',
    label: 'Préservation de la scène',
    obligation: 'La scène doit être sécurisée et préservée avant intervention',
    severity: 'critique',
    source_legale: 'CPP 306 al. 1 (constatations)',
    condition: () => true,
    verify: (f) => f.scene_preservee === true,
    detail: (f) => f.scene_preservee ? 'Scène préservée' : (f.scene_nettoyee ? 'Scène nettoyée avant arrivée police' : 'Non documenté'),
  },
  {
    id: 'fixation_photographique',
    label: 'Documentation photographique des lieux',
    obligation: 'Les lieux doivent être photographiés et documentés',
    severity: 'haute',
    source_legale: 'CPP 306 al. 2 let. a',
    condition: () => true,
    verify: (f) => f.photos_scene === true,
    detail: (f) => f.photos_scene ? 'Photos au dossier' : 'Aucune photo des lieux au dossier',
  },
  {
    id: 'prelevements_scene',
    label: 'Prélèvements sur la scène (ADN, empreintes, traces)',
    obligation: 'Des prélèvements doivent être effectués sur les lieux',
    severity: 'haute',
    source_legale: 'CPP 306 al. 2 let. b',
    condition: (f) => f.type_deces === 'suspect',
    verify: (f) => f.prelevements_scene === true,
    detail: (f) => f.prelevements_scene ? 'Prélèvements effectués' : 'Aucun prélèvement sur la scène',
  },

  // --- PHASE 2: INVESTIGATION (24h-7j) ---
  {
    id: 'autopsie_ordonnee',
    label: 'Autopsie médico-légale ordonnée',
    obligation: 'Une autopsie doit être ordonnée en cas de mort suspecte',
    severity: 'critique',
    source_legale: 'CPP 253 al. 1',
    condition: (f) => f.type_deces === 'suspect' || f.type_deces === 'violent',
    verify: (f) => f.autopsie_ordonnee === true,
    detail: (f) => f.autopsie_ordonnee ? `Autopsie le ${f.date_autopsie || '?'}` : 'Autopsie non ordonnée',
  },
  {
    id: 'audition_temoin_cle',
    label: 'Audition du/des témoin(s) clé(s)',
    obligation: 'Toute personne ayant été en contact avec la victime avant le décès doit être auditionnée',
    severity: 'critique',
    source_legale: 'CPP 178 (personne appelée à donner des renseignements)',
    condition: (f) => f.dernier_contact_connu != null,
    verify: (f) => f.temoin_cle_auditionne === true,
    detail: (f) => {
      if (!f.temoin_cle_auditionne) return 'Témoin clé non auditionné';
      return `Auditionné: ${f.nb_auditions_temoin || '?'} fois`;
    },
  },
  {
    id: 'verification_declarations_temoin',
    label: 'Vérification objective des déclarations du témoin clé',
    obligation: 'Les déclarations doivent être vérifiées par des éléments objectifs (téléphone, GPS, caméras, tiers)',
    severity: 'critique',
    source_legale: 'CPP 6 (maxime de l\'instruction)',
    condition: (f) => f.temoin_cle_auditionne === true,
    verify: (f) => f.declarations_verifiees === true,
    detail: (f) => f.declarations_verifiees ? 'Déclarations vérifiées' : 'Déclarations non vérifiées objectivement',
  },
  {
    id: 'extraction_telephone_suspect',
    label: 'Extraction forensique du téléphone du suspect/témoin clé',
    obligation: 'Les données du téléphone doivent être extraites pour vérifier l\'emploi du temps',
    severity: 'haute',
    source_legale: 'CPP 263 al. 1 let. a (séquestre)',
    condition: (f) => f.dernier_contact_connu != null,
    verify: (f) => f.telephone_suspect_extrait === true,
    detail: (f) => f.telephone_suspect_extrait ? 'Extraction effectuée' : 'Téléphone du témoin clé jamais extrait',
  },
  {
    id: 'enquete_voisinage',
    label: 'Enquête de voisinage',
    obligation: 'Les voisins doivent être interrogés (véhicules, bruits, personnes vues)',
    severity: 'moyenne',
    source_legale: 'CPP 306 al. 1',
    condition: (f) => f.lieu_deces === 'domicile',
    verify: (f) => f.enquete_voisinage === true,
    detail: (f) => f.enquete_voisinage ? 'Voisins interrogés' : 'Aucune enquête de voisinage',
  },
  {
    id: 'audition_decouverte',
    label: 'Audition formelle de la personne ayant découvert le corps',
    obligation: 'La personne qui a découvert le corps doit être formellement auditionnée (PV)',
    severity: 'haute',
    source_legale: 'CPP 178',
    condition: () => true,
    verify: (f) => f.decouvreur_auditionne === true,
    detail: (f) => f.decouvreur_auditionne ? 'Audition formelle effectuée' : 'Aucun PV d\'audition formelle',
  },

  // --- PHASE 3: EXPERTISE (7j-3mois) ---
  {
    id: 'toxicologie_complete',
    label: 'Analyse toxicologique complète',
    obligation: 'Recherche de substances dans le sang et les urines',
    severity: 'haute',
    source_legale: 'CPP 253',
    condition: () => true,
    verify: (f) => f.toxicologie_faite === true,
    detail: (f) => f.toxicologie_faite ? 'Toxicologie effectuée' : 'Non documentée',
  },
  {
    id: 'resultats_prelevements_communiques',
    label: 'Résultats de tous les prélèvements communiqués',
    obligation: 'Les résultats de chaque prélèvement effectué doivent figurer au rapport',
    severity: 'haute',
    source_legale: 'CPP 6 (maxime de l\'instruction)',
    condition: (f) => f.prelevements_effectues?.length > 0,
    verify: (f) => {
      if (!f.prelevements_effectues || !f.prelevements_avec_resultats) return false;
      return f.prelevements_avec_resultats >= f.prelevements_effectues.length;
    },
    detail: (f) => {
      const total = f.prelevements_effectues?.length || 0;
      const avec = f.prelevements_avec_resultats || 0;
      return `${avec}/${total} prélèvements avec résultats communiqués`;
    },
  },

  // --- PHASE 4: DECISION (3-12 mois) ---
  {
    id: 'instruction_bidirectionnelle',
    label: 'Investigation des deux hypothèses (accident ET tiers)',
    obligation: 'La maxime de l\'instruction exige d\'investiguer à charge ET à décharge',
    severity: 'critique',
    source_legale: 'CPP 6 al. 2 + CEDH art. 2',
    condition: (f) => f.rapport_autopsie_ne_peut_exclure_tiers === true,
    verify: (f) => f.hypothese_tiers_investiguee === true,
    detail: (f) => f.hypothese_tiers_investiguee
      ? 'Les deux hypothèses ont été investiguées'
      : 'Seule l\'hypothèse accidentelle a été instruite',
  },
  {
    id: 'in_dubio_pro_duriore',
    label: 'Respect du principe in dubio pro duriore',
    obligation: 'En cas de doute, le classement est exclu — l\'affaire doit aller au juge',
    severity: 'critique',
    source_legale: 'ATF 143 IV 241 consid. 2.3.2',
    condition: (f) => f.rapport_autopsie_ne_peut_exclure_tiers === true,
    verify: (f) => f.classement === false || f.classement === undefined,
    detail: (f) => f.classement
      ? 'Classé malgré l\'impossibilité d\'exclure un tiers'
      : 'Non classé (principe respecté)',
  },
  {
    id: 'droits_famille_respectes',
    label: 'Droits de la famille (parties civiles) respectés',
    obligation: 'La famille doit être informée de ses droits, pouvoir consulter le dossier, et être entendue',
    severity: 'haute',
    source_legale: 'CPP 107, 117-121',
    condition: () => true,
    verify: (f) => f.famille_informee_droits === true,
    detail: (f) => f.famille_informee_droits
      ? 'Famille informée de ses droits'
      : 'Famille non informée de ses droits procéduraux',
  },
  {
    id: 'celerite',
    label: 'Respect du principe de célérité',
    obligation: 'L\'instruction doit être menée sans retard injustifié',
    severity: 'moyenne',
    source_legale: 'CPP 5',
    condition: () => true,
    verify: (f) => {
      if (!f.date_deces || !f.date_classement) return false;
      const diff = monthsDiff(f.date_deces, f.date_classement);
      return diff !== null && diff <= 18;
    },
    detail: (f) => {
      if (!f.date_deces || !f.date_classement) return 'Dates non disponibles';
      const diff = monthsDiff(f.date_deces, f.date_classement);
      return `${diff} mois entre le décès et le classement`;
    },
  },
  {
    id: 'verification_acces_domicile',
    label: 'Vérification de tous les accès au domicile',
    obligation: 'Tous les points d\'entrée/sortie doivent être documentés et vérifiés',
    severity: 'haute',
    source_legale: 'CPP 306 al. 1',
    condition: (f) => f.lieu_deces === 'domicile',
    verify: (f) => f.tous_acces_verifies === true,
    detail: (f) => f.tous_acces_verifies
      ? 'Tous les accès vérifiés'
      : `${f.nb_acces_verifies || 0}/${f.nb_acces_total || '?'} accès vérifiés`,
  },
];

// ============================================================
// HELPERS
// ============================================================

function timeDiffHours(h1, h2) {
  const parse = (s) => {
    const m = s.match(/(\d{1,2})[h:](\d{2})/);
    return m ? +m[1] * 60 + +m[2] : null;
  };
  const a = parse(h1);
  const b = parse(h2);
  if (a === null || b === null) return null;
  return Math.abs(b - a) / 60;
}

function monthsDiff(d1, d2) {
  const a = parseDate(d1);
  const b = parseDate(d2);
  if (!a || !b) return null;
  return Math.round((b - a) / (30 * 24 * 60 * 60 * 1000));
}

function parseDate(str) {
  if (!str) return null;
  const m = str.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  return null;
}

// ============================================================
// MAIN CHECKER
// ============================================================

/**
 * Run all investigation checks against dossier facts
 * @param {object} dossierFacts - Extracted facts about the investigation
 * @returns {object} Checklist results with score
 */
export function checkInvestigation(dossierFacts) {
  const results = DEATH_INVESTIGATION_CHECKS.map(check => execCheck(check, dossierFacts));
  const applicable = results.filter(r => r.applicable);
  const satisfied = applicable.filter(r => r.satisfied);
  const failures = applicable.filter(r => !r.satisfied);

  const criticalFailures = failures.filter(r => r.severity === 'critique');
  const highFailures = failures.filter(r => r.severity === 'haute');

  const score = applicable.length > 0
    ? Math.round(satisfied.length / applicable.length * 100)
    : 0;

  return {
    score,
    total_checks: applicable.length,
    passed: satisfied.length,
    failed: failures.length,
    critical_failures: criticalFailures.length,
    high_failures: highFailures.length,
    status: criticalFailures.length > 0 ? 'insuffisant'
      : highFailures.length > 2 ? 'lacunaire'
      : score >= 80 ? 'suffisant'
      : 'partiel',
    results,
    summary: {
      critique: criticalFailures.map(r => ({ id: r.check_id, label: r.label, detail: r.detail })),
      haute: highFailures.map(r => ({ id: r.check_id, label: r.label, detail: r.detail })),
    },
  };
}

/**
 * Extract investigation facts from enriched dossier (bridge between ingester and checker)
 * This converts the raw extracted data into the format expected by checkInvestigation
 */
export function extractInvestigationFacts(dossier) {
  const docs = dossier.documents.filter(d => d.llm_extraction);
  const allFacts = docs.flatMap(d => d.llm_extraction?.faits || []);
  const allClaims = docs.flatMap(d => d.llm_extraction?.claims || []);
  const allMesuresRefusees = docs.flatMap(d => d.llm_extraction?.mesures_refusees || []);

  // Detect key investigation characteristics from extracted data
  const facts = {
    type_deces: 'suspect', // Default for this type of analysis
    lieu_deces: 'domicile',

    // Phase 1
    heure_decouverte: findFact(allFacts, /découv|retrouv|trouvé/i)?.heure,
    heure_alerte_police: findFact(allFacts, /police.*alert|alert.*police|police.*inform/i)?.heure,
    scene_preservee: !hasClaim(allClaims, /nettoy|rang|lavé/i),
    scene_nettoyee: hasClaim(allClaims, /nettoy|rang/i),
    photos_scene: hasClaim(allClaims, /photo.*lieu|fixation.*photograph/i) && !hasClaim(allClaims, /aucune photo|pas de photo/i),
    prelevements_scene: hasClaim(allClaims, /prélèvement|prelevem.*scene|ADN.*lieu/i),

    // Phase 2
    autopsie_ordonnee: docs.some(d => d.type === 'rapport_autopsie'),
    date_autopsie: docs.find(d => d.type === 'rapport_autopsie')?.llm_extraction?.date_document,
    dernier_contact_connu: true, // Elia Papa
    temoin_cle_auditionne: docs.some(d => d.type === 'pv_audition'),
    nb_auditions_temoin: docs.filter(d => d.type === 'pv_audition').length,
    declarations_verifiees: !hasClaim(allClaims, /non vérifi|pas vérifi|déclarations.*seul/i),
    telephone_suspect_extrait: hasClaim(allClaims, /extraction.*téléphone.*papa|téléphone.*papa.*extrait/i),
    enquete_voisinage: hasClaim(allClaims, /voisin.*interrogé|enquête.*voisin/i),
    decouvreur_auditionne: hasClaim(allClaims, /audition.*soeur|soeur.*auditionn|PV.*soeur/i),

    // Phase 3
    toxicologie_faite: hasClaim(allClaims, /toxicolog|dépistage|THC|benzodiazépine|cannabis/i),
    prelevements_effectues: ['frottis sous-ungueaux', 'frottis génitaux', 'cheveux', 'contenu gastrique', 'sang', 'urine'],
    prelevements_avec_resultats: hasClaim(allClaims, /toxicolog|THC|cannabis/i) ? 2 : 0, // Only blood/urine had results

    // Phase 4
    rapport_autopsie_ne_peut_exclure_tiers: hasClaim(allClaims, /ne peut.*exclure|pas possible.*exclure|ne pouvons pas exclure/i),
    hypothese_tiers_investiguee: !hasClaim(allClaims, /seule.*hypothèse|uniquement.*accident/i) && allMesuresRefusees.length === 0,
    classement: docs.some(d => d.type === 'ordonnance_classement'),
    date_deces: findFact(allFacts, /décès|décédé|mort/i)?.date,
    date_classement: docs.find(d => d.type === 'ordonnance_classement')?.llm_extraction?.date_document,
    famille_informee_droits: hasClaim(allClaims, /informé.*droits|droits.*partie.*civile/i),
    tous_acces_verifies: hasClaim(allClaims, /porte.*jardin.*vérif|tous.*accès.*vérif/i),
    nb_acces_verifies: hasClaim(allClaims, /porte.*entrée.*verrouill/i) ? 1 : 0,
    nb_acces_total: 2, // porte entrée + porte jardin
  };

  return facts;
}

// Helpers for extractInvestigationFacts
function findFact(facts, pattern) {
  return facts.find(f => pattern.test(f.action));
}

function hasClaim(claims, pattern) {
  return claims.some(c => pattern.test(c.texte));
}

export default { checkInvestigation, extractInvestigationFacts, DEATH_INVESTIGATION_CHECKS };
