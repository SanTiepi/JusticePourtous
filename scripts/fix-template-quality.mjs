#!/usr/bin/env node
/**
 * fix-template-quality.mjs
 *
 * Fixes template quality issues across all fiche JSON files:
 * 1. Fix missing accents in modeleLettre and other string fields
 * 2. Convert [lowercase] placeholders to [UPPERCASE] in modeleLettre
 * 3. Rewrite 3 worst templates (famille_testament_olographe, travail_grossesse, accident_travail)
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const FICHES_DIR = join(import.meta.dirname, '..', 'src', 'data', 'fiches');

// ============================================================
// PART 1: Accent fixes — applied to ALL string values in JSON
// ============================================================

// Map of unaccented words → accented corrections
// These are applied contextually to avoid false positives
const accentFixes = [
  // Common patterns in legal French templates
  [/\bsoussigne\(e\)/g, 'soussigné(e)'],
  [/\bdomicilie\(e\)/g, 'domicilié(e)'],
  [/\bemploye\(e\)/g, 'employé(e)'],
  [/\bsalarie\(e\)/g, 'salarié(e)'],
  [/\bdesigne\(e\)/g, 'désigné(e)'],
  [/\bne\(e\)/g, 'né(e)'],
  [/\bsain\(e\)/g, 'sain(e)'], // no accent needed

  // Recommandé
  [/\bRecommande\b/g, 'Recommandé'],
  [/\brecommande\b/g, 'recommandé'],
  [/\brecommandee\b/g, 'recommandée'],

  // Past participles commonly missing accents
  [/\bsoussigne\b/g, 'soussigné'],
  [/\bdomicilie\b/g, 'domicilié'],
  [/\bDeclare\b/g, 'Déclare'],
  [/\bdeclare\b/g, 'déclaré'],
  [/\bDeclare avoir\b/g, 'Déclare avoir'],
  [/\bemploye\b(?!\(|s\b|ur)/g, 'employé'],
  [/\bemployes\b/g, 'employés'],
  [/\bsalarie\b/g, 'salarié'],
  [/\bsalaries\b/g, 'salariés'],
  [/\blicencie\b/g, 'licencié'],
  [/\blicenciee\b/g, 'licenciée'],
  [/\bsigne\b/g, 'signé'],
  [/\bsignee\b/g, 'signée'],
  [/\bdesigne\b/g, 'désigné'],
  [/\bdesignee\b/g, 'désignée'],
  [/\blegue\b/g, 'lègue'],
  [/\brevoque\b/g, 'révoqué'],
  [/\bannonce\b/g, 'annoncé'],
  [/\bprocede\b/g, 'procédé'],
  [/\bproceder\b/g, 'procéder'],
  [/\bnotifie\b/g, 'notifié'],
  [/\bnotifiee\b/g, 'notifiée'],
  [/\bconsulte\b/g, 'consulté'],
  [/\batteste\b/g, 'attesté'],
  [/\bconstate\b/g, 'constaté'],
  [/\bconteste\b/g, 'contesté'],
  [/\binforme\b/g, 'informé'],
  [/\bresilie\b/g, 'résilié'],
  [/\bresiliee\b/g, 'résiliée'],
  [/\bverifie\b/g, 'vérifié'],
  [/\bverifié\b/g, 'vérifié'],
  [/\brevise\b/g, 'révisé'],
  [/\benonce\b/g, 'énoncé'],
  [/\benoncee\b/g, 'énoncée'],
  [/\bdetaille\b/g, 'détaillé'],
  [/\bdetaillee\b/g, 'détaillée'],
  [/\bdeterminer\b/g, 'déterminer'],
  [/\bdetermine\b/g, 'déterminé'],
  [/\bdeterminee\b/g, 'déterminée'],
  [/\bexpire\b/g, 'expiré'],
  [/\bconfirme\b/g, 'confirmé'],

  // Common verbs / adjectives
  [/\bete\b/g, 'été'],
  [/\bretabli\b/g, 'rétabli'],

  // Preposition "à"
  [/\b(?<![àÀ]) a l'/g, ' à l\''],
  [/\b a \[/g, ' à ['],
  [/ a la /g, ' à la '],
  [/ a le /g, ' au '],  // just in case
  [/ a mon /g, ' à mon '],
  [/ a ma /g, ' à ma '],
  [/ a mes /g, ' à mes '],
  [/ a votre /g, ' à votre '],
  [/ a vos /g, ' à vos '],
  [/ a des /g, ' à des '],
  [/ a une /g, ' à une '],
  [/ a un /g, ' à un '],
  [/ a titre /g, ' à titre '],
  [/ a tout /g, ' à tout '],
  [/ a ce /g, ' à ce '],
  [/ a cette /g, ' à cette '],

  // Common nouns missing accents
  [/\bmedecin\b/g, 'médecin'],
  [/\bmedecins\b/g, 'médecins'],
  [/\bmedical\b/g, 'médical'],
  [/\bmedicale\b/g, 'médicale'],
  [/\bmedicales\b/g, 'médicales'],
  [/\bmedicaux\b/g, 'médicaux'],
  [/\bdelai\b/g, 'délai'],
  [/\bdelais\b/g, 'délais'],
  [/\bdeces\b/g, 'décès'],
  [/\bdegats\b/g, 'dégâts'],
  [/\bdefaut\b/g, 'défaut'],
  [/\bdesaccord\b/g, 'désaccord'],
  [/\begalite\b/g, 'égalité'],
  [/\bequite\b/g, 'équité'],
  [/\bintegrite\b/g, 'intégrité'],
  [/\bintegrale\b/g, 'intégrale'],
  [/\bindemnitee?\b/g, (m) => m.endsWith('e') ? 'indemnité' : 'indemnité'],
  [/\bindemnites\b/g, 'indemnités'],
  [/\breserve\b/g, 'réserve'],
  [/\breserves\b/g, 'réserves'],
  [/\bhereditaires\b/g, 'héréditaires'],
  [/\bheritier\b/g, 'héritier'],
  [/\bheritiers\b/g, 'héritiers'],
  [/\bexecuteur\b/g, 'exécuteur'],
  [/\blegalite\b/g, 'légalité'],
  [/\bvalidite\b/g, 'validité'],
  [/\bbénéficie\b/g, 'bénéficie'], // already correct
  [/\bbeneficie\b/g, 'bénéficie'],
  [/\bbeneficiaire\b/g, 'bénéficiaire'],
  [/\binterets\b/g, 'intérêts'],
  [/\bpretentions\b/g, 'prétentions'],
  [/\blethargie\b/g, 'léthargie'],
  [/\breferencee?\b/g, (m) => m.endsWith('e') ? 'référencée' : 'référence'],
  [/\breference\b(?!s)/g, 'référence'],
  [/\breferences\b/g, 'références'],
  [/\bmateriels\b/g, 'matériels'],
  [/\bmateriel\b/g, 'matériel'],
  [/\bmaternite\b/g, 'maternité'],
  [/\bpaternite\b/g, 'paternité'],
  [/\bsecurite\b/g, 'sécurité'],
  [/\bsociete\b/g, 'société'],
  [/\bproprietaire\b/g, 'propriétaire'],
  [/\bproprietaires\b/g, 'propriétaires'],
  [/\bsupplementaires?\b/g, (m) => m.endsWith('s') ? 'supplémentaires' : 'supplémentaire'],
  [/\btemoin\b/g, 'témoin'],
  [/\btemoins\b/g, 'témoins'],
  [/\bgenerale\b/g, 'générale'],
  [/\bgenerales\b/g, 'générales'],
  [/\bgeneraux\b/g, 'généraux'],
  [/\bbasees\b/g, 'basées'],
  [/\bdonnees\b/g, 'données'],
  [/\bpersonnalise\b/g, 'personnalisé'],
  [/\bpersonnalisee\b/g, 'personnalisée'],
  [/\bexhaustivite\b/g, 'exhaustivité'],
  [/\blistes\b(?=\.")/g, 'listés'],
  [/\bprocedure\b/g, 'procédure'],
  [/\bprocedures\b/g, 'procédures'],
  [/\bdecision\b/g, 'décision'],
  [/\bdecisions\b/g, 'décisions'],
  [/\bdefini\b/g, 'défini'],
  [/\bdefinition\b/g, 'définition'],
  [/\bcreance\b/g, 'créance'],
  [/\bcreances\b/g, 'créances'],
  [/\bcreancier\b/g, 'créancier'],
  [/\bcreanciers\b/g, 'créanciers'],
  [/\bremunerations?\b/g, (m) => m.endsWith('s') ? 'rémunérations' : 'rémunération'],
  [/\bpreavis\b/g, 'préavis'],
  [/\bperiode\b/g, 'période'],
  [/\bperiodes\b/g, 'périodes'],
  [/\bretablir\b/g, 'rétablir'],
  [/\brepond\b/g, 'répond'],
  [/\brepondre\b/g, 'répondre'],
  [/\breponse\b/g, 'réponse'],
  [/\breponses\b/g, 'réponses'],
  [/\breduite\b/g, 'réduite'],
  [/\breduites\b/g, 'réduites'],
  [/\breduit\b/g, 'réduit'],
  [/\breduits\b/g, 'réduits'],
  [/\breparer\b/g, 'réparer'],
  [/\breparation\b/g, 'réparation'],
  [/\bprotegee?\b/g, (m) => m.endsWith('e') ? 'protégée' : 'protégé'],
  [/\bproteger\b/g, 'protéger'],
  [/\binteressee?\b/g, (m) => m.endsWith('e') ? 'intéressée' : 'intéressé'],
  [/\bpresente\b/g, 'présente'],
  [/\bprejudice\b/g, 'préjudice'],
  [/\bprecis\b/g, 'précis'],
  [/\bprecise\b/g, 'précis'],
  [/\bveuillez\b/gi, 'Veuillez'], // capitalize
  [/\bexterieur\b/g, 'extérieur'],
  [/\bexterieure\b/g, 'extérieure'],
  [/\bdetour\b/g, 'détour'],
  [/\brevenu\b/g, 'revenu'],
  [/\brevenus\b/g, 'revenus'],
  [/\bdefinitivement\b/g, 'définitivement'],
  [/\bdemande\b/g, 'demande'], // no accent needed on "demande"

  // Fix "exécutéur" typo → "exécuteur"
  [/exécutéur/g, 'exécuteur'],

  // Fix "vehicule" patterns
  [/\bvehicule\b/g, 'véhicule'],
  [/\bvehicules\b/g, 'véhicules'],

  // Common patterns in disclaimers
  [/informations juridiques generales basees/g, 'informations juridiques générales basées'],
  [/donnees a titre indicatif/g, 'données à titre indicatif'],
  [/sans garantie d'exhaustivite/g, 'sans garantie d\'exhaustivité'],
  [/les services listes/g, 'les services listés'],
];

function fixAccents(str) {
  let result = str;
  for (const [pattern, replacement] of accentFixes) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ============================================================
// PART 2: Convert [lowercase] → [UPPERCASE] in modeleLettre
// ============================================================

function uppercasePlaceholders(str) {
  return str.replace(/\[([^\]]+)\]/g, (match, inner) => {
    // Don't uppercase if it's already all uppercase
    if (inner === inner.toUpperCase()) return match;
    // Don't uppercase article references like [art. 336c]
    if (/^art\./i.test(inner)) return match;
    // Don't uppercase service names or URLs
    if (inner.includes('http') || inner.includes('.ch') || inner.includes('.com')) return match;
    // Don't uppercase if it looks like a proper name placeholder already
    // Convert to uppercase
    return '[' + inner.toUpperCase() + ']';
  });
}

// ============================================================
// PART 3: Rewrite 3 worst templates
// ============================================================

const TEMPLATE_TESTAMENT = `Objet : Dépôt d'un testament olographe

Recommandé

Maître,

Je soussigné(e) [PRÉNOM NOM], né(e) le [DATE DE NAISSANCE], domicilié(e) à [ADRESSE COMPLÈTE],

Par la présente, je vous remets en dépôt mon testament olographe daté du [DATE DU TESTAMENT], rédigé conformément à l'art. 505 CC (entièrement manuscrit, daté et signé).

Ce testament respecte les réserves héréditaires prévues à l'art. 471 CC et contient les dispositions suivantes :
- Legs en faveur de : [BÉNÉFICIAIRE(S) ET BIENS/MONTANTS]
- Désignation d'un exécuteur testamentaire : [NOM DE L'EXÉCUTEUR] (art. 517 CC)
- Clause de révocation de toute disposition antérieure (art. 509 CC)

Je vous prie de bien vouloir :
1. Accuser réception du testament
2. Assurer sa conservation conformément au droit cantonal
3. Me confirmer les modalités de dépôt et les frais y relatifs

Pièces jointes : testament olographe original sous enveloppe scellée, copie de ma pièce d'identité.

Veuillez agréer, Maître, mes salutations distinguées.

[LIEU], le [DATE]

[SIGNATURE]`;

const TEMPLATE_GROSSESSE = `Objet : Contestation du licenciement — protection de la maternité (art. 336c al. 1 let. c CO)

Recommandé

[NOM DE L'EMPLOYEUR]
[ADRESSE DE L'EMPLOYEUR]

Madame, Monsieur,

Je soussigné(e) [PRÉNOM NOM], employée au sein de votre entreprise depuis le [DATE DE DÉBUT DU CONTRAT], en qualité de [FONCTION],

Par la présente, je conteste formellement le licenciement qui m'a été notifié le [DATE DU LICENCIEMENT].

En effet, j'ai annoncé ma grossesse à mon employeur le [DATE D'ANNONCE DE LA GROSSESSE], comme l'atteste [MOYEN DE PREUVE : certificat médical / courriel / témoin]. À la date de notification du congé, j'étais enceinte de [NOMBRE] semaines.

Or, conformément à l'art. 336c al. 1 let. c CO, le licenciement est nul lorsqu'il est notifié pendant la grossesse et les 16 semaines suivant l'accouchement. Cette protection s'applique indépendamment du fait que l'employeur ait eu connaissance ou non de la grossesse au moment du licenciement (TF 4A_400/2019).

La durée de mes rapports de travail étant de [DURÉE D'EMPLOI], le délai de congé applicable est de [DÉLAI DE CONGÉ] pour la fin d'un mois.

En conséquence, je vous demande de :
1. Confirmer par écrit la nullité de ce licenciement
2. Poursuivre l'exécution de mon contrat de travail aux conditions inchangées
3. Verser l'intégralité de mon salaire pour la période écoulée depuis la notification du congé

À défaut de réponse dans un délai de 10 jours, je me réserve le droit de saisir l'autorité de conciliation compétente.

Pièces jointes : certificat médical confirmant la grossesse et la date présumée d'accouchement, copie de la lettre de licenciement.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.

[LIEU], le [DATE]

[SIGNATURE]`;

const TEMPLATE_ACCIDENT_TRAVAIL = `Objet : Déclaration d'accident professionnel et demande de prestations LAA

Recommandé

[NOM DE L'EMPLOYEUR OU ASSUREUR LAA]
[ADRESSE]

Madame, Monsieur,

Je soussigné(e) [PRÉNOM NOM], employé(e) au sein de [NOM DE L'ENTREPRISE], en qualité de [FONCTION], numéro AVS [NUMÉRO AVS],

Déclare avoir été victime d'un accident professionnel au sens de l'art. 6 LAA, survenu le [DATE DE L'ACCIDENT] à [HEURE] sur le lieu de travail sis [ADRESSE / LIEU PRÉCIS DE L'ACCIDENT].

Circonstances de l'accident :
[DESCRIPTION DÉTAILLÉE ET FACTUELLE DE L'ACCIDENT]

Blessures subies :
[DESCRIPTION DES BLESSURES : nature, localisation, gravité]

L'accident constitue une atteinte dommageable, soudaine et involontaire, portée au corps humain par une cause extérieure extraordinaire au sens de l'art. 4 LPGA.

Traitement médical reçu :
- Médecin / hôpital consulté : Dr [NOM DU MÉDECIN] / [NOM DE L'HÔPITAL], le [DATE DE CONSULTATION]
- Diagnostic : [DIAGNOSTIC MÉDICAL]
- Arrêt de travail prescrit du [DATE DÉBUT] au [DATE FIN]

Conformément à la LAA, je demande :
1. La prise en charge intégrale des frais de traitement médical (art. 10 LAA)
2. Le versement d'indemnités journalières de 80% du salaire assuré dès le 3e jour d'incapacité (art. 16 LAA)
3. Le cas échéant, l'examen de mon droit à une rente d'invalidité (art. 18 LAA) et/ou à une indemnité pour atteinte à l'intégrité (art. 24 LAA)

Témoins de l'accident : [NOMS ET COORDONNÉES DES TÉMOINS]

Pièces jointes : certificat médical, rapport d'urgence, attestation de l'employeur.

Veuillez agréer, Madame, Monsieur, mes salutations distinguées.

[LIEU], le [DATE]

[SIGNATURE]`;


// ============================================================
// MAIN
// ============================================================

function processFile(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`  ERROR parsing ${filePath}: ${e.message}`);
    return false;
  }

  let changed = false;

  for (const fiche of data) {
    // --- Part 3: Replace specific templates ---
    if (fiche.id === 'famille_testament_olographe' && fiche.reponse?.modeleLettre) {
      fiche.reponse.modeleLettre = TEMPLATE_TESTAMENT;
      changed = true;
      console.log(`  REWRITTEN: ${fiche.id} template`);
    }
    if (fiche.id === 'travail_grossesse' && fiche.reponse?.modeleLettre) {
      fiche.reponse.modeleLettre = TEMPLATE_GROSSESSE;
      changed = true;
      console.log(`  REWRITTEN: ${fiche.id} template`);
    }
    if (fiche.id === 'accident_travail' && fiche.reponse?.modeleLettre) {
      fiche.reponse.modeleLettre = TEMPLATE_ACCIDENT_TRAVAIL;
      changed = true;
      console.log(`  REWRITTEN: ${fiche.id} template`);
    }

    // --- Part 1 & 2: Fix accents + uppercase placeholders in all string fields ---
    changed = walkAndFix(fiche, fiche.id) || changed;
  }

  if (changed) {
    const output = JSON.stringify(data, null, 2);
    // Validate JSON roundtrip
    try {
      JSON.parse(output);
    } catch (e) {
      console.error(`  ERROR: output JSON invalid for ${filePath}: ${e.message}`);
      return false;
    }
    writeFileSync(filePath, output + '\n', 'utf-8');
    console.log(`  SAVED: ${filePath}`);
  }
  return changed;
}

function walkAndFix(obj, ficheId, key = '') {
  if (typeof obj === 'string') {
    return false; // strings are handled by their parent
  }

  let changed = false;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        let fixed = fixAccents(obj[i]);
        // Only uppercase placeholders in modeleLettre fields
        if (key === 'modeleLettre') {
          fixed = uppercasePlaceholders(fixed);
        }
        if (fixed !== obj[i]) {
          obj[i] = fixed;
          changed = true;
        }
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        changed = walkAndFix(obj[i], ficheId, key) || changed;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'string') {
        let fixed = fixAccents(obj[k]);
        // Only uppercase placeholders in modeleLettre
        if (k === 'modeleLettre') {
          fixed = uppercasePlaceholders(fixed);
        }
        if (fixed !== obj[k]) {
          obj[k] = fixed;
          changed = true;
        }
      } else if (typeof obj[k] === 'object' && obj[k] !== null) {
        changed = walkAndFix(obj[k], ficheId, k) || changed;
      }
    }
  }

  return changed;
}

// Run
console.log('=== Fix Template Quality ===\n');

const files = readdirSync(FICHES_DIR).filter(f => f.endsWith('.json'));
let totalChanged = 0;

for (const file of files) {
  const filePath = join(FICHES_DIR, file);
  console.log(`Processing: ${file}`);
  if (processFile(filePath)) {
    totalChanged++;
  } else {
    console.log('  (no changes)');
  }
}

console.log(`\nDone. ${totalChanged}/${files.length} files modified.`);
