#!/usr/bin/env node
/**
 * build-intent-catalog.mjs — Catalogue d'intents citoyens
 *
 * Objectif Cortex Phase 1 :
 *   Cesser de raisonner en "fiches" et commencer à raisonner en "intents"
 *   (situations citoyennes). Un intent = une situation type qu'un citoyen
 *   exprime. Un intent peut mapper à 1-N fiches selon canton/procédure.
 *
 * Ce script :
 *   1. Lit toutes les fiches src/data/fiches/*.json
 *   2. Dérive un intent par fiche (label citoyen + label juridique)
 *   3. Ajoute les intents archétypiques manquants par domaine
 *   4. Écrit src/data/meta/intents-catalog.json
 *
 * Règles `etat_couverture` :
 *   - complete  : fiche ≥ 600 chars + ≥ 2 articles + ≥ 1 arrêt + template + cascade
 *   - partial   : fiche ≥ 400 chars + ≥ 2 articles
 *   - stub      : fiche < 400 chars OU < 2 articles
 *   - missing   : intent identifié sans fiche correspondante
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const FICHES_DIR = path.join(ROOT, 'src/data/fiches');
// Finding 4 review : support `--output <path>` pour que les tests puissent
// écrire dans tmpdir sans polluer le fichier versionné.
function resolveOutFile() {
  const argv = process.argv.slice(2);
  const flagIdx = argv.findIndex(a => a === '--output' || a === '-o');
  if (flagIdx >= 0 && argv[flagIdx + 1]) {
    return path.resolve(argv[flagIdx + 1]);
  }
  const equals = argv.find(a => a.startsWith('--output='));
  if (equals) return path.resolve(equals.slice('--output='.length));
  return path.join(ROOT, 'src/data/meta/intents-catalog.json');
}
const OUT_FILE = resolveOutFile();

// --------------------------------------------------------------------------
// 1. Labellisation citoyenne à partir d'un id fiche
// --------------------------------------------------------------------------
// Mappe chaque id fiche connu vers un label citoyen (langue naturelle,
// première personne) et un label juridique (formel). Les ids non listés
// utilisent une heuristique de fallback à partir de l'id.

const FICHE_LABELS = {
  // --- BAIL (33) ---
  bail_defaut_moisissure:       { c: "Mon appartement a de la moisissure",                j: "Défaut de la chose louée — moisissure" },
  bail_defaut_bruit:            { c: "Je subis du bruit dans mon logement",                j: "Défaut de la chose louée — bruit" },
  bail_resiliation_conteste:    { c: "J'ai reçu une résiliation de bail que je conteste",  j: "Contestation d'une résiliation de bail" },
  bail_loyer_abusif:            { c: "Je pense que mon loyer est abusif",                  j: "Contestation de loyer abusif" },
  bail_depot_garantie:          { c: "Ma régie ne veut pas me rendre ma caution",          j: "Restitution de la garantie de loyer" },
  bail_charges_contestees:      { c: "Mon décompte de charges me paraît faux",             j: "Contestation du décompte de charges" },
  bail_sous_location:           { c: "Je veux sous-louer mon appartement",                 j: "Droit à la sous-location" },
  bail_travaux_non_faits:       { c: "Ma régie ne fait pas les travaux nécessaires",       j: "Exécution forcée de l'entretien par le bailleur" },
  bail_augmentation_loyer:      { c: "J'ai reçu une augmentation de loyer",                j: "Contestation d'une hausse de loyer" },
  bail_etat_des_lieux:          { c: "L'état des lieux de sortie me pose problème",        j: "Contestation de l'état des lieux" },
  bail_sous_location_refusee:   { c: "Ma régie refuse ma demande de sous-location",        j: "Refus abusif de sous-location" },
  bail_animaux:                 { c: "Ma régie m'interdit d'avoir un animal",              j: "Droit à la détention d'animaux en bail" },
  bail_nuisances_voisins:       { c: "Mes voisins font trop de bruit",                     j: "Nuisances sonores du voisinage" },
  bail_renovation_forcee:       { c: "Ma régie veut rénover et me met dehors",             j: "Résiliation pour travaux / rénovation" },
  bail_loyer_initial_abusif:    { c: "Mon loyer d'entrée me paraît trop élevé",            j: "Contestation du loyer initial" },
  bail_frais_chauffage:         { c: "Mes frais de chauffage semblent excessifs",          j: "Contestation des frais de chauffage" },
  bail_parking:                 { c: "J'ai un problème avec ma place de parc",             j: "Litige sur place de parc louée" },
  bail_cave_grenier:            { c: "Ma cave ou mon grenier est inutilisable",            j: "Litige sur locaux accessoires" },
  bail_colocation:              { c: "J'ai un problème dans ma colocation",                j: "Rapports entre colocataires" },
  bail_deces_locataire:         { c: "Un proche locataire est décédé",                     j: "Transfert/fin de bail au décès du locataire" },
  bail_faillite_locataire:      { c: "Je suis en faillite et j'ai un bail",                j: "Faillite du locataire et bail" },
  bail_changement_proprietaire: { c: "Mon immeuble a été vendu",                           j: "Changement de propriétaire et bail" },
  bail_droit_preemption:        { c: "Mon propriétaire vend et je veux acheter",           j: "Droit de préemption du locataire" },
  bail_prolongation:            { c: "Je veux rester plus longtemps dans mon logement",    j: "Demande de prolongation du bail" },
  bail_expulsion:               { c: "Je suis menacé(e) d'expulsion de mon logement",      j: "Procédure d'expulsion" },
  bail_etat_lieux_conteste:     { c: "Je conteste l'état des lieux dressé",                j: "Contestation de l'état des lieux" },
  bail_reparations_locataire:   { c: "Ma régie me facture des réparations",                j: "Réparations à charge du locataire" },
  bail_modification_contrat:    { c: "Ma régie veut modifier mon contrat",                 j: "Modification unilatérale du bail" },
  bail_droit_retractation:      { c: "Je veux annuler un contrat de bail signé",           j: "Rétractation d'un contrat de bail" },
  bail_logement_insalubre:      { c: "Mon logement est insalubre",                         j: "Logement insalubre — défaut grave" },
  bail_recherche_logement:      { c: "Je cherche un logement et j'ai besoin d'aide",       j: "Aide à la recherche de logement" },
  bail_loyers_impayes:          { c: "Je n'arrive plus à payer mon loyer",                 j: "Loyers impayés — risque de résiliation" },
  bail_restitution_anticipee:   { c: "Je veux rendre mon appartement avant la fin du bail", j: "Restitution anticipée du bail" },

  // --- TRAVAIL (34) ---
  travail_licenciement_maladie:  { c: "J'ai été licencié(e) pendant ma maladie",           j: "Licenciement en temps inopportun (maladie)" },
  travail_salaire_impaye:        { c: "Mon employeur ne me paie pas mon salaire",          j: "Créance de salaire impayé" },
  travail_heures_sup:            { c: "Mes heures supplémentaires ne sont pas payées",     j: "Paiement des heures supplémentaires" },
  travail_harcelement:           { c: "Je subis du harcèlement au travail",                j: "Harcèlement psychologique ou sexuel au travail" },
  travail_licenciement_abusif:   { c: "Je pense avoir été licencié(e) abusivement",        j: "Contestation d'un congé abusif" },
  travail_certificat:            { c: "Mon certificat de travail n'est pas correct",       j: "Contenu et rectification du certificat de travail" },
  travail_vacances:              { c: "On me refuse mes vacances ou leur paiement",        j: "Droit aux vacances et paiement" },
  travail_grossesse:             { c: "Je suis enceinte et je crains pour mon emploi",     j: "Protection de la travailleuse enceinte" },
  travail_accident:              { c: "J'ai eu un accident au travail",                    j: "Accident professionnel et LAA" },
  travail_contrat_oral:          { c: "Je n'ai pas de contrat écrit",                      j: "Contrat de travail oral" },
  travail_periode_essai:         { c: "J'ai été licencié(e) en période d'essai",           j: "Résiliation en période d'essai" },
  travail_non_concurrence:       { c: "On m'impose une clause de non-concurrence",         j: "Validité de la clause de non-concurrence" },
  travail_secret_professionnel:  { c: "On m'accuse de violation du secret professionnel",  j: "Devoir de fidélité et secret professionnel" },
  travail_temps_partiel:         { c: "Je travaille à temps partiel et j'ai un litige",    j: "Droits du travailleur à temps partiel" },
  travail_teletravail:           { c: "J'ai un différend sur mon télétravail",             j: "Télétravail et obligations de l'employeur" },
  travail_burnout:               { c: "Je fais un burnout à cause du travail",             j: "Burnout — protection de la santé" },
  travail_assurance_chomage:     { c: "J'ai des questions sur le chômage",                 j: "Droit aux prestations de l'AC" },
  travail_orp_inscription:       { c: "Je dois m'inscrire à l'ORP",                        j: "Inscription à l'Office régional de placement" },
  travail_delai_conge:           { c: "Je me demande quel est mon délai de congé",         j: "Délais de résiliation du contrat de travail" },
  travail_indemnite_depart:      { c: "Ai-je droit à une indemnité de départ ?",           j: "Indemnité de départ et longs rapports de travail" },
  travail_convention_collective: { c: "Je suis soumis à une convention collective",        j: "Application d'une CCT" },
  travail_temporaire:            { c: "Je travaille via une agence de placement",          j: "Travail temporaire / intérim" },
  travail_stagiaire:             { c: "Je suis stagiaire et je veux connaître mes droits", j: "Droits du stagiaire" },
  travail_apprenti:              { c: "J'ai un problème en tant qu'apprenti(e)",           j: "Droits de l'apprenti et contrat d'apprentissage" },
  travail_13e_salaire:           { c: "On me refuse mon 13e salaire",                      j: "Droit au 13e salaire" },
  travail_gratification:         { c: "Ma gratification / bonus n'est pas versée",         j: "Droit à la gratification / bonus" },
  travail_frais_professionnels:  { c: "Mes frais professionnels ne sont pas remboursés",   j: "Remboursement des frais professionnels" },
  travail_protection_donnees:    { c: "Mon employeur traite mal mes données",              j: "Protection des données du travailleur" },
  travail_surveillance:          { c: "Je suis surveillé(e) au travail",                   j: "Surveillance du travailleur — limites" },
  travail_reference_negative:    { c: "On me donne de mauvaises références",               j: "Références orales / réputation post-emploi" },
  travail_chomage:               { c: "Je viens de perdre mon emploi",                     j: "Indemnités de chômage" },
  travail_maladie:               { c: "Je suis en arrêt maladie",                          j: "Arrêt maladie et maintien du salaire" },
  travail_saisie_salaire:        { c: "Mon salaire est saisi",                             j: "Saisie sur salaire" },
  travail_discrimination_salariale: { c: "Je suis moins payé(e) qu'un collègue",           j: "Discrimination salariale (LEg)" },

  // --- FAMILLE (37) ---
  famille_pension_impayee:       { c: "La pension alimentaire n'est pas versée",           j: "Recouvrement de pension alimentaire" },
  famille_divorce_procedure:     { c: "Je veux divorcer",                                  j: "Procédure de divorce" },
  famille_garde_modification:    { c: "Je veux modifier la garde des enfants",             j: "Modification de la garde des enfants" },
  famille_pension_montant:       { c: "Je conteste le montant de la pension",              j: "Fixation du montant de la pension alimentaire" },
  famille_violence_conjugale:    { c: "Je subis des violences conjugales",                 j: "Violence conjugale — mesures de protection" },
  famille_succession_reserve:    { c: "Je pense avoir été lésé(e) dans une succession",    j: "Réserve héréditaire" },
  famille_reconnaissance_paternite: { c: "Je veux reconnaître ou établir la paternité",    j: "Reconnaissance de paternité" },
  famille_mesures_provisionnelles: { c: "Il me faut des mesures urgentes avant le divorce", j: "Mesures provisionnelles / protectrices" },
  famille_droit_visite:          { c: "Je n'ai plus accès à mes enfants",                  j: "Droit de visite et relations personnelles" },
  famille_curatelle:             { c: "Un proche a besoin d'une curatelle",                j: "Mesures de protection de l'adulte (curatelle)" },
  famille_mariage_etranger:      { c: "Je veux me marier avec un(e) étranger(e)",          j: "Mariage avec un(e) ressortissant(e) étranger(e)" },
  famille_partenariat_enregistre: { c: "J'ai des questions sur le partenariat enregistré", j: "Partenariat enregistré" },
  famille_adoption:              { c: "Je veux adopter un enfant",                         j: "Procédure d'adoption" },
  famille_autorite_parentale_conjointe: { c: "Je veux l'autorité parentale conjointe",     j: "Autorité parentale conjointe" },
  famille_enlevement_international: { c: "Mon enfant a été emmené à l'étranger",           j: "Enlèvement international d'enfant" },
  famille_reconnaissance_paternite_procedure: { c: "La procédure de reconnaissance de paternité m'échappe", j: "Action en constatation de paternité" },
  famille_contestation_paternite:{ c: "Je conteste la paternité",                          j: "Action en désaveu de paternité" },
  famille_nom_famille:           { c: "Je veux changer mon nom de famille",                j: "Changement de nom" },
  famille_regime_matrimonial:    { c: "Je m'interroge sur mon régime matrimonial",         j: "Régime matrimonial" },
  famille_liquidation_regime:    { c: "On liquide notre régime matrimonial",               j: "Liquidation du régime matrimonial" },
  famille_succession_ab_intestat:{ c: "Un proche est décédé sans testament",               j: "Succession ab intestat" },
  famille_testament_olographe:   { c: "Je veux rédiger un testament",                      j: "Testament olographe" },
  famille_pacte_successoral:     { c: "Je veux faire un pacte successoral",                j: "Pacte successoral" },
  famille_reserve_hereditaire:   { c: "Je pense que ma réserve héréditaire n'a pas été respectée", j: "Action en réduction / réserve héréditaire" },
  famille_indignite_successorale:{ c: "Un héritier est indigne de succéder",               j: "Indignité successorale" },
  famille_executeur_testamentaire: { c: "J'ai un problème avec un exécuteur testamentaire",j: "Exécuteur testamentaire" },
  famille_certificat_heritier:   { c: "Je dois obtenir un certificat d'héritier",          j: "Certificat d'héritier" },
  famille_dette_successorale:    { c: "J'hérite de dettes",                                j: "Dettes successorales" },
  famille_usufruit_conjoint:     { c: "Je veux comprendre l'usufruit du conjoint",         j: "Usufruit successoral du conjoint" },
  famille_droit_retour:          { c: "Un bien donné doit revenir au donateur",            j: "Droit de retour" },
  famille_pension:               { c: "Je veux fixer une pension alimentaire",             j: "Fixation de pension alimentaire" },
  famille_garde:                 { c: "Je veux fixer la garde des enfants",                j: "Fixation de la garde des enfants" },
  famille_divorce:               { c: "Je veux divorcer (informations générales)",         j: "Divorce — informations générales" },
  famille_mesures_protection:    { c: "J'ai besoin de mesures de protection en couple",    j: "Mesures protectrices de l'union conjugale" },
  famille_protection_enfant:     { c: "Je crains pour la sécurité d'un enfant",            j: "Protection de l'enfant (APEA)" },
  succession_reserves:           { c: "Je veux comprendre les réserves en succession",     j: "Réserves héréditaires — informations générales" },
  succession_repudiation:        { c: "Je veux répudier une succession",                   j: "Répudiation de succession" },

  // --- DETTES (31) ---
  dettes_commandement_payer:     { c: "J'ai reçu un commandement de payer",                j: "Commandement de payer — LP" },
  dettes_opposition:             { c: "Je veux faire opposition à une poursuite",          j: "Opposition au commandement de payer" },
  dettes_minimum_vital:          { c: "J'ai droit à un minimum vital",                     j: "Minimum vital en matière de saisie" },
  dettes_acte_defaut_biens:      { c: "J'ai un acte de défaut de biens",                   j: "Acte de défaut de biens" },
  dettes_faillite_personnelle:   { c: "Je veux faire faillite personnelle",                j: "Faillite personnelle (déclaration d'insolvabilité)" },
  dettes_saisie_salaire:         { c: "Mon salaire est saisi",                             j: "Saisie sur salaire (LP)" },
  dettes_arrangement_amiable:    { c: "Je veux négocier avec mes créanciers",              j: "Arrangement amiable avec créanciers" },
  dettes_primes_maladie:         { c: "Je n'arrive pas à payer mes primes LAMal",          j: "Primes d'assurance-maladie impayées" },
  dettes_impots_arrieres:        { c: "J'ai des arriérés d'impôts",                        j: "Arriérés d'impôts" },
  dettes_creancier_abusif:       { c: "Un créancier me harcèle",                           j: "Pratiques abusives de créanciers" },
  dettes_commandement_contestation: { c: "Je conteste la dette figurant au CdP",           j: "Contestation de la dette au fond" },
  dettes_mainlevee_provisoire:   { c: "J'ai une demande de mainlevée provisoire",          j: "Mainlevée provisoire d'opposition" },
  dettes_mainlevee_definitive:   { c: "J'ai une demande de mainlevée définitive",          j: "Mainlevée définitive d'opposition" },
  dettes_saisie_salaire_quotite: { c: "Je conteste la quotité saisie sur mon salaire",     j: "Quotité saisissable — calcul" },
  dettes_minimum_vital_lp:       { c: "Je conteste le calcul du minimum vital LP",         j: "Calcul du minimum vital selon les directives LP" },
  dettes_acte_defaut_biens_effets: { c: "Quels sont les effets de l'acte de défaut de biens ?", j: "Effets juridiques de l'ADB" },
  dettes_faillite_personnelle_procedure: { c: "Comment se déroule une faillite personnelle ?", j: "Procédure de faillite personnelle" },
  dettes_concordat:              { c: "Je veux un concordat avec mes créanciers",          j: "Concordat judiciaire" },
  dettes_sursis_concordataire:   { c: "Je demande un sursis concordataire",                j: "Sursis concordataire" },
  dettes_sequestre:              { c: "On m'a signifié un séquestre",                      j: "Séquestre — LP" },
  dettes_poursuite_effets_change:{ c: "Je suis poursuivi pour une lettre de change",       j: "Poursuite pour effets de change" },
  dettes_revendication:          { c: "Mes biens saisis ne m'appartiennent pas",           j: "Procédure de revendication (LP)" },
  dettes_plainte_lp:             { c: "Je veux porter plainte contre l'office des poursuites", j: "Plainte LP contre l'office" },
  dettes_for_poursuite:          { c: "Je me demande où la poursuite doit être introduite",j: "For de la poursuite" },
  dettes_prescription:           { c: "Ma dette est peut-être prescrite",                  j: "Prescription des créances" },
  dettes_remise_dette:           { c: "Je veux négocier une remise de dette",              j: "Remise de dette" },
  dettes_arrangement_amiable_negociation: { c: "Comment négocier avec un créancier ?",     j: "Négociation amiable avec créanciers" },
  dettes_mediation_dettes:       { c: "Je cherche une médiation de dettes",                j: "Médiation en matière de dettes" },
  dettes_budget_conseil:         { c: "J'ai besoin d'un conseil budgétaire",               j: "Conseil budgétaire / désendettement" },
  dettes_assainissement_financier: { c: "Je veux m'assainir financièrement",               j: "Plan d'assainissement financier" },
  dettes_faillite:               { c: "J'ai des questions générales sur la faillite",     j: "Faillite — informations générales" },

  // --- ETRANGERS (33) ---
  etranger_permis_b_c:           { c: "J'ai un permis B ou C",                             j: "Permis B / permis C — droits" },
  etranger_naturalisation:       { c: "Je veux me naturaliser suisse",                     j: "Naturalisation ordinaire" },
  etranger_regroupement:         { c: "Je veux faire venir ma famille",                    j: "Regroupement familial" },
  etranger_renvoi:               { c: "On veut me renvoyer de Suisse",                     j: "Décision de renvoi" },
  etranger_permis_travail:       { c: "Je cherche un permis de travail",                   j: "Permis de travail pour étrangers" },
  etranger_asile_procedure:      { c: "Je demande l'asile en Suisse",                      j: "Procédure d'asile" },
  etranger_sans_papiers_droits:  { c: "Je suis sans-papiers",                              j: "Droits des sans-papiers" },
  etranger_violence_permis:      { c: "Je subis des violences et mon permis en dépend",    j: "Permis indépendant après violence conjugale" },
  etranger_aide_urgence:         { c: "Je ne reçois plus que l'aide d'urgence",            j: "Aide d'urgence aux étrangers" },
  etranger_recours_renvoi:       { c: "Je veux recourir contre un renvoi",                 j: "Recours contre une décision de renvoi" },
  etranger_permis_b_renouvellement: { c: "Je dois renouveler mon permis B",                j: "Renouvellement du permis B" },
  etranger_permis_c_conditions: { c: "Je veux obtenir un permis C",                        j: "Conditions d'octroi du permis C" },
  etranger_naturalisation_facilitee: { c: "Je veux la naturalisation facilitée",           j: "Naturalisation facilitée (conjoint/enfant)" },
  etranger_regroupement_familial:{ c: "Ma famille veut me rejoindre en Suisse",            j: "Regroupement familial — procédure" },
  etranger_renvoi_recours:       { c: "Je veux attaquer une décision de renvoi",           j: "Recours contre décision de renvoi" },
  etranger_admission_provisoire_f: { c: "J'ai un permis F",                                j: "Admission provisoire (permis F)" },
  etranger_cas_rigueur:          { c: "Je demande une régularisation cas de rigueur",     j: "Cas de rigueur (Härtefall)" },
  etranger_integration_criteres: { c: "On me demande des critères d'intégration",          j: "Critères d'intégration LEI" },
  etranger_cours_langue_obligatoires: { c: "On m'impose des cours de langue",              j: "Cours de langue obligatoires — conventions d'intégration" },
  etranger_aide_sociale_permis:  { c: "Je touche l'aide sociale et j'ai peur pour mon permis", j: "Aide sociale et impact sur le permis" },
  etranger_travail_asile:        { c: "Puis-je travailler comme requérant d'asile ?",      j: "Droit au travail des requérants d'asile" },
  etranger_permis_frontalier_g:  { c: "Je suis frontalier",                                j: "Permis G — frontalier" },
  etranger_detachement_travailleurs: { c: "Je viens travailler en Suisse pour un employeur étranger", j: "Détachement de travailleurs" },
  etranger_reconnaissance_diplomes: { c: "Je veux faire reconnaître mon diplôme",          j: "Reconnaissance de diplômes étrangers" },
  etranger_assurances_sociales:  { c: "J'ai des questions sur les assurances sociales comme étranger", j: "Assurances sociales et étrangers" },
  etranger_double_nationalite:   { c: "Je veux garder deux nationalités",                  j: "Double nationalité" },
  etranger_apatridie:            { c: "Je suis apatride",                                  j: "Statut d'apatride" },
  etranger_mna_mineurs:          { c: "Je suis mineur non accompagné",                     j: "Requérants d'asile mineurs non accompagnés" },
  etranger_dublin_transfert:     { c: "On veut me transférer dans un autre pays Dublin",   j: "Transfert Dublin" },
  etranger_visa_schengen_refus:  { c: "Mon visa Schengen a été refusé",                    j: "Refus de visa Schengen" },
  etrangers_renvoi:              { c: "Décision de renvoi — infos générales",              j: "Renvoi — informations générales" },
  etrangers_recours:             { c: "Je cherche un recours en droit des étrangers",      j: "Recours en droit des étrangers" },
  etrangers_regroupement:        { c: "Regroupement familial — infos générales",           j: "Regroupement familial — informations générales" },

  // --- ASSURANCES (5) ---
  assurance_ijm:                 { c: "J'ai un litige avec mon IJM",                       j: "Indemnité journalière maladie (IJM)" },
  assurance_ai_rente:            { c: "J'ai une question sur ma rente AI",                 j: "Rente AI — octroi / révision" },
  assurance_prestations_complementaires: { c: "Je veux des prestations complémentaires (PC)", j: "Prestations complémentaires AVS/AI" },
  assurance_laa:                 { c: "J'ai un problème avec la LAA",                      j: "Prestations LAA" },
  assurance_laa_contestation:    { c: "Je conteste une décision LAA",                      j: "Contestation d'une décision LAA" },

  // --- SOCIAL (3) ---
  social_hebergement_urgence:    { c: "Je n'ai pas de logement cette nuit",                j: "Hébergement d'urgence" },
  social_aide_sociale:           { c: "Je demande l'aide sociale",                         j: "Aide sociale cantonale" },
  social_aide_urgence:           { c: "J'ai besoin d'aide d'urgence",                      j: "Aide d'urgence — filet social" },

  // --- VIOLENCE (3) ---
  violence_domestique:           { c: "Je subis des violences domestiques",                j: "Violence domestique — protection" },
  violence_foyer_accueil:        { c: "Je cherche un foyer d'accueil",                     j: "Foyers d'accueil pour victimes" },
  violence_plainte:              { c: "Je veux porter plainte pénale",                     j: "Plainte pénale — procédure" },

  // --- ACCIDENT (3) ---
  accident_travail:              { c: "J'ai eu un accident au travail",                    j: "Accident professionnel" },
  accident_circulation:          { c: "J'ai eu un accident de circulation",                j: "Accident de la circulation" },
  accident_responsabilite_civile:{ c: "J'ai été victime d'un accident",                    j: "Responsabilité civile — accidents" },

  // --- ENTREPRISE (2) ---
  entreprise_difficultes_paiement: { c: "Mon entreprise a des problèmes de paiement",      j: "Difficultés de paiement de l'entreprise" },
  entreprise_surendettement:     { c: "Mon entreprise est surendettée",                    j: "Surendettement de l'entreprise (avis au juge)" },
};

function humanizeId(id) {
  return id
    .replace(/^[a-z]+_/, '')
    .replace(/_/g, ' ')
    .replace(/^./, c => c.toUpperCase());
}

function labelsForFiche(fiche) {
  const known = FICHE_LABELS[fiche.id];
  if (known) return { citoyen: known.c, juridique: known.j };
  const label = humanizeId(fiche.id);
  return {
    citoyen: `J'ai une situation liée à : ${label}`,
    juridique: label,
  };
}

// --------------------------------------------------------------------------
// 2. Détermination de l'état de couverture
// --------------------------------------------------------------------------

function coverageState(fiche) {
  const r = fiche.reponse || {};
  const chars = (r.explication || '').length;
  const nArt = (r.articles || []).length;
  const nJur = (r.jurisprudence || []).length;
  const hasTemplate = !!r.modeleLettre;
  const hasCascade = Array.isArray(fiche.cascades) && fiche.cascades.length > 0;

  const isComplete = chars >= 600 && nArt >= 2 && nJur >= 1 && hasTemplate && hasCascade;
  if (isComplete) return 'complete';

  const isPartial = chars >= 400 && nArt >= 2;
  if (isPartial) return 'partial';

  return 'stub';
}

// --------------------------------------------------------------------------
// 3. Identifiant d'intent à partir d'une fiche
// --------------------------------------------------------------------------
// Par convention, l'intent dérivé d'une fiche a le même id que la fiche,
// ce qui simplifie le mapping et l'audit.

function ficheToIntent(fiche) {
  const labels = labelsForFiche(fiche);
  const r = fiche.reponse || {};
  const hasSourceIds = Array.isArray(r.articles) && r.articles.some(a => a && (a.ref || a.source_id));

  return {
    id: fiche.id,
    label_citoyen: labels.citoyen,
    label_juridique: labels.juridique,
    domaines: [fiche.domaine],
    fiches_associees: [fiche.id],
    sousDomaine: fiche.sousDomaine || null,
    tags: Array.isArray(fiche.tags) ? [...fiche.tags] : [],
    cantons_specifiques: [],
    volume_estime: null,
    etat_couverture: coverageState(fiche),
    has_cascade: Array.isArray(fiche.cascades) && fiche.cascades.length > 0,
    has_template: !!r.modeleLettre,
    has_jurisprudence: Array.isArray(r.jurisprudence) && r.jurisprudence.length > 0,
    has_source_ids: hasSourceIds,
    last_verified_at: fiche.dateVerification || null,
  };
}

// --------------------------------------------------------------------------
// 4. Intents archétypiques "manquants" par domaine
// --------------------------------------------------------------------------
// Situations que le catalogue doit couvrir même si aucune fiche n'existe
// encore. Chaque entrée = intent avec etat_couverture=missing.

const MISSING_INTENTS = [
  // ======================== BAIL (compléments) ========================
  { id: "bail_humidite_cave",               label_citoyen: "Ma cave est humide / inondée",                       label_juridique: "Défaut — humidité dans locaux accessoires", domaines: ["bail"], sousDomaine: "défaut", tags: ["humidité", "cave", "défaut"] },
  { id: "bail_punaises_lit",                label_citoyen: "J'ai des punaises de lit",                           label_juridique: "Défaut — infestation de nuisibles",          domaines: ["bail"], sousDomaine: "défaut", tags: ["punaises", "nuisibles", "défaut"] },
  { id: "bail_ascenseur_panne",             label_citoyen: "L'ascenseur de l'immeuble est toujours en panne",    label_juridique: "Défaut — équipement commun défectueux",       domaines: ["bail"], sousDomaine: "défaut", tags: ["ascenseur", "parties communes", "défaut"] },
  { id: "bail_fuite_eau",                   label_citoyen: "Il y a une fuite d'eau chez moi",                    label_juridique: "Défaut — fuite d'eau",                        domaines: ["bail"], sousDomaine: "défaut", tags: ["eau", "fuite", "défaut"] },
  { id: "bail_consignation_loyer",          label_citoyen: "Je veux consigner mon loyer",                        label_juridique: "Consignation du loyer (art. 259g CO)",       domaines: ["bail"], sousDomaine: "défaut", tags: ["consignation", "loyer", "défaut"] },
  { id: "bail_baisse_loyer",                label_citoyen: "Je veux demander une baisse de loyer",               label_juridique: "Demande de baisse de loyer (taux hypothécaire)", domaines: ["bail"], sousDomaine: "loyer", tags: ["baisse", "loyer", "taux"] },
  { id: "bail_conciliation_procedure",      label_citoyen: "Je veux saisir l'autorité de conciliation",          label_juridique: "Saisine de l'autorité de conciliation en matière de bail", domaines: ["bail"], sousDomaine: "procédure", tags: ["conciliation", "procédure"] },
  { id: "bail_discrimination_location",     label_citoyen: "On a refusé de me louer pour mon origine / religion", label_juridique: "Discrimination dans l'accès au logement",   domaines: ["bail"], sousDomaine: "recherche", tags: ["discrimination", "recherche"] },
  { id: "bail_reglement_immeuble",          label_citoyen: "Je ne respecte pas un règlement d'immeuble",          label_juridique: "Règlement d'immeuble et obligations du locataire", domaines: ["bail"], sousDomaine: "usage", tags: ["règlement", "usage"] },
  { id: "bail_baby_sitting_resiliation",    label_citoyen: "On me résilie pour un enfant ou des bruits de bébé",  label_juridique: "Résiliation pour motifs liés à la famille",   domaines: ["bail"], sousDomaine: "résiliation", tags: ["famille", "résiliation"] },

  // ======================== TRAVAIL (compléments) ========================
  { id: "travail_demission",                label_citoyen: "Je veux démissionner",                                label_juridique: "Démission — forme et délais",                 domaines: ["travail"], sousDomaine: "résiliation", tags: ["démission", "résiliation"] },
  { id: "travail_licenciement_immediat",    label_citoyen: "Je me suis fait licencier sur le champ",              label_juridique: "Résiliation immédiate pour justes motifs",    domaines: ["travail"], sousDomaine: "licenciement", tags: ["licenciement", "juste motif"] },
  { id: "travail_mobbing",                  label_citoyen: "Je subis du mobbing",                                 label_juridique: "Mobbing au travail — atteinte à la personnalité", domaines: ["travail"], sousDomaine: "protection", tags: ["mobbing", "personnalité"] },
  { id: "travail_maternite_conge",          label_citoyen: "Je veux prendre mon congé maternité",                 label_juridique: "Congé maternité — 14 semaines",              domaines: ["travail"], sousDomaine: "protection", tags: ["maternité", "congé"] },
  { id: "travail_paternite_conge",          label_citoyen: "Je veux prendre mon congé paternité",                 label_juridique: "Congé paternité — 2 semaines",               domaines: ["travail"], sousDomaine: "protection", tags: ["paternité", "congé"] },
  { id: "travail_accident_non_professionnel", label_citoyen: "J'ai eu un accident hors travail",                  label_juridique: "Accident non-professionnel et LAA",           domaines: ["travail", "accident"], sousDomaine: "accident", tags: ["accident", "laa"] },
  { id: "travail_egalite_homme_femme",      label_citoyen: "Je subis une inégalité homme-femme au travail",       label_juridique: "Loi sur l'égalité (LEg)",                     domaines: ["travail"], sousDomaine: "égalité", tags: ["égalité", "genre"] },
  { id: "travail_deuxieme_emploi",          label_citoyen: "Mon employeur m'interdit un 2e emploi",               label_juridique: "Pluralité d'emplois — limites",               domaines: ["travail"], sousDomaine: "obligations", tags: ["emploi", "cumul"] },
  { id: "travail_horaires_pauses",          label_citoyen: "Mes horaires et pauses ne sont pas respectés",        label_juridique: "Durée du travail et pauses (LTr)",            domaines: ["travail"], sousDomaine: "conditions", tags: ["horaires", "pauses", "ltr"] },
  { id: "travail_travail_nuit_dimanche",    label_citoyen: "On me fait travailler la nuit ou le dimanche",        label_juridique: "Travail de nuit et du dimanche (LTr)",        domaines: ["travail"], sousDomaine: "conditions", tags: ["nuit", "dimanche", "ltr"] },
  { id: "travail_proces_verbal",            label_citoyen: "J'ai reçu un avertissement écrit",                    label_juridique: "Avertissement au travail",                    domaines: ["travail"], sousDomaine: "discipline", tags: ["avertissement", "discipline"] },

  // ======================== FAMILLE (compléments) ========================
  { id: "famille_separation_concubinage",   label_citoyen: "Je me sépare de mon concubin / partenaire non marié", label_juridique: "Rupture de concubinage",                     domaines: ["famille"], sousDomaine: "séparation", tags: ["concubinage", "séparation"] },
  { id: "famille_pension_enfant_majeur",    label_citoyen: "Je dois payer une pension à un enfant majeur en études", label_juridique: "Pension pour enfant majeur (art. 277 CC)",  domaines: ["famille"], sousDomaine: "pension", tags: ["pension", "majeur"] },
  { id: "famille_pacs_rupture",             label_citoyen: "Je veux dissoudre mon partenariat",                   label_juridique: "Dissolution du partenariat enregistré",       domaines: ["famille"], sousDomaine: "partenariat", tags: ["partenariat", "dissolution"] },
  { id: "famille_avance_pensions",          label_citoyen: "Je veux une avance sur pension alimentaire",          label_juridique: "Avance de pensions alimentaires (BRAPA / cantonale)", domaines: ["famille"], sousDomaine: "pension", tags: ["avance", "pension", "cantonal"] },
  { id: "famille_placement_enfant",         label_citoyen: "Mon enfant a été placé",                              label_juridique: "Placement d'enfant — APEA",                   domaines: ["famille"], sousDomaine: "protection_enfant", tags: ["placement", "apea"] },

  // ======================== DETTES (compléments) ========================
  { id: "dettes_credit_abusif",             label_citoyen: "J'ai signé un crédit que je ne comprends pas",        label_juridique: "Crédit à la consommation (LCC) — nullité",    domaines: ["dettes"], sousDomaine: "crédit", tags: ["lcc", "crédit"] },
  { id: "dettes_leasing_probleme",          label_citoyen: "J'ai un problème avec mon leasing",                   label_juridique: "Litige sur contrat de leasing",               domaines: ["dettes"], sousDomaine: "crédit", tags: ["leasing"] },
  { id: "dettes_recouvrement_harcelement",  label_citoyen: "Une société de recouvrement me harcèle",              label_juridique: "Sociétés de recouvrement — pratiques abusives", domaines: ["dettes"], sousDomaine: "abus", tags: ["recouvrement", "harcèlement"] },
  { id: "dettes_rectification_poursuites",  label_citoyen: "Je veux faire retirer une poursuite injustifiée",     label_juridique: "Radiation / non-communication d'une poursuite", domaines: ["dettes"], sousDomaine: "poursuite", tags: ["radiation", "extrait"] },
  { id: "dettes_extrait_poursuites",        label_citoyen: "Je veux mon extrait des poursuites",                  label_juridique: "Extrait des poursuites — obtention",           domaines: ["dettes"], sousDomaine: "poursuite", tags: ["extrait", "registre"] },

  // ======================== ETRANGERS (compléments) ========================
  { id: "etranger_mariage_blanc_suspicion", label_citoyen: "On me soupçonne de mariage de complaisance",          label_juridique: "Mariage blanc — enquête et conséquences",     domaines: ["etrangers", "famille"], sousDomaine: "mariage", tags: ["mariage", "complaisance"] },
  { id: "etranger_revocation_permis",       label_citoyen: "On veut révoquer mon permis",                         label_juridique: "Révocation du permis de séjour",              domaines: ["etrangers"], sousDomaine: "permis", tags: ["révocation", "permis"] },
  { id: "etranger_interdiction_entree",     label_citoyen: "J'ai une interdiction d'entrée en Suisse",            label_juridique: "Interdiction d'entrée (IE) et recours",       domaines: ["etrangers"], sousDomaine: "renvoi", tags: ["ie", "interdiction"] },
  { id: "etranger_retour_volontaire",       label_citoyen: "Je veux un retour volontaire",                        label_juridique: "Aide au retour volontaire",                   domaines: ["etrangers"], sousDomaine: "renvoi", tags: ["retour"] },
  { id: "etranger_detention_administrative",label_citoyen: "Je suis / un proche est en détention administrative", label_juridique: "Détention administrative en droit des étrangers", domaines: ["etrangers"], sousDomaine: "renvoi", tags: ["détention", "administratif"] },

  // ======================== ASSURANCES (compléments) ========================
  { id: "assurance_lamal_refus",            label_citoyen: "Mon assurance maladie refuse une prestation",         label_juridique: "Refus de prestation LAMal",                   domaines: ["assurances"], sousDomaine: "lamal", tags: ["lamal", "refus"] },
  { id: "assurance_lamal_changement",       label_citoyen: "Je veux changer d'assurance maladie",                 label_juridique: "Changement de caisse-maladie",                domaines: ["assurances"], sousDomaine: "lamal", tags: ["lamal", "changement"] },
  { id: "assurance_rc_menage",              label_citoyen: "Mon assurance RC refuse d'indemniser",                label_juridique: "Responsabilité civile privée — litige",       domaines: ["assurances"], sousDomaine: "rc", tags: ["rc", "ménage"] },
  { id: "assurance_vehicule_sinistre",      label_citoyen: "Mon assurance auto refuse mon sinistre",              label_juridique: "Assurance véhicules à moteur — refus",         domaines: ["assurances"], sousDomaine: "auto", tags: ["auto", "sinistre"] },
  { id: "assurance_vie_litige",             label_citoyen: "J'ai un litige avec mon assurance-vie / 3e pilier",   label_juridique: "Assurance-vie / 3e pilier — litige",           domaines: ["assurances"], sousDomaine: "prévoyance", tags: ["vie", "3e pilier"] },
  { id: "assurance_chomage_contestation",   label_citoyen: "Je conteste une décision de la caisse chômage",       label_juridique: "Contestation d'une décision LACI",             domaines: ["assurances", "travail"], sousDomaine: "chomage", tags: ["laci", "chômage"] },
  { id: "assurance_ai_contestation",        label_citoyen: "Je conteste une décision AI",                         label_juridique: "Contestation d'une décision AI",               domaines: ["assurances"], sousDomaine: "ai", tags: ["ai", "contestation"] },
  { id: "assurance_avs_calcul",             label_citoyen: "Je conteste le calcul de ma rente AVS",               label_juridique: "Rente AVS — calcul et contestation",           domaines: ["assurances"], sousDomaine: "avs", tags: ["avs", "rente"] },
  { id: "assurance_lpp_litige",             label_citoyen: "J'ai un litige avec ma caisse de pension (LPP)",      label_juridique: "Prévoyance professionnelle (LPP) — litige",    domaines: ["assurances"], sousDomaine: "lpp", tags: ["lpp", "prévoyance"] },
  { id: "assurance_complementaire_refus",   label_citoyen: "Ma complémentaire refuse mes soins",                  label_juridique: "Assurance complémentaire — refus",             domaines: ["assurances"], sousDomaine: "complémentaire", tags: ["lca", "complémentaire"] },
  { id: "assurance_accident_ijp",           label_citoyen: "J'ai un litige sur les indemnités journalières accident", label_juridique: "IJP LAA — litige",                          domaines: ["assurances", "accident"], sousDomaine: "laa", tags: ["laa", "ijp"] },
  { id: "assurance_invalidite_reclassement",label_citoyen: "On me propose un reclassement AI",                    label_juridique: "Mesures de réadaptation AI",                   domaines: ["assurances"], sousDomaine: "ai", tags: ["ai", "réadaptation"] },
  { id: "assurance_perte_gain_maladie",     label_citoyen: "Mon assurance perte de gain maladie refuse",          label_juridique: "Assurance perte de gain maladie (APGM)",       domaines: ["assurances", "travail"], sousDomaine: "apgm", tags: ["apgm", "maladie"] },
  { id: "assurance_rente_survivant",        label_citoyen: "Je demande une rente de survivant",                   label_juridique: "Rentes de survivants AVS / LPP",               domaines: ["assurances"], sousDomaine: "survivants", tags: ["survivants", "rente"] },
  { id: "assurance_franchise_refus",        label_citoyen: "On me reproche de ne pas avoir payé ma franchise",    label_juridique: "Franchise et participation — LAMal",           domaines: ["assurances"], sousDomaine: "lamal", tags: ["franchise", "lamal"] },

  // ======================== SOCIAL (compléments) ========================
  { id: "social_logement_social",           label_citoyen: "Je cherche un logement social",                       label_juridique: "Logement à loyer modéré / subventionné",      domaines: ["social", "bail"], sousDomaine: "logement", tags: ["logement", "social"] },
  { id: "social_subsides_assurance",        label_citoyen: "Je demande des subsides d'assurance maladie",         label_juridique: "Subsides LAMal cantonaux",                    domaines: ["social", "assurances"], sousDomaine: "subsides", tags: ["subsides", "lamal"] },
  { id: "social_bourses_etudes",            label_citoyen: "Je veux une bourse d'études",                         label_juridique: "Bourses d'études cantonales",                 domaines: ["social"], sousDomaine: "bourses", tags: ["bourses", "étudiant"] },
  { id: "social_allocations_familiales",    label_citoyen: "Je demande des allocations familiales",               label_juridique: "Allocations familiales cantonales",           domaines: ["social", "famille"], sousDomaine: "allocations", tags: ["allocations", "famille"] },
  { id: "social_aide_sociale_contestation", label_citoyen: "Je conteste une décision d'aide sociale",             label_juridique: "Recours en matière d'aide sociale",           domaines: ["social"], sousDomaine: "aide_sociale", tags: ["aide_sociale", "recours"] },
  { id: "social_aide_sociale_remboursement",label_citoyen: "L'aide sociale me demande un remboursement",          label_juridique: "Remboursement de l'aide sociale",              domaines: ["social"], sousDomaine: "aide_sociale", tags: ["remboursement", "aide_sociale"] },
  { id: "social_revenu_insertion",          label_citoyen: "Je veux un revenu d'insertion / RI",                  label_juridique: "Revenu d'insertion (dispositifs cantonaux)",   domaines: ["social"], sousDomaine: "ri", tags: ["ri", "insertion"] },
  { id: "social_allocations_logement",      label_citoyen: "Je demande une allocation logement",                  label_juridique: "Allocation logement cantonale",                domaines: ["social", "bail"], sousDomaine: "logement", tags: ["allocation", "logement"] },
  { id: "social_curatelle_volontaire",      label_citoyen: "Je veux demander une curatelle pour moi-même",        label_juridique: "Curatelle volontaire",                         domaines: ["social", "famille"], sousDomaine: "protection", tags: ["curatelle", "volontaire"] },
  { id: "social_mandats_futur",             label_citoyen: "Je veux faire un mandat pour cause d'inaptitude",     label_juridique: "Mandat pour cause d'inaptitude",               domaines: ["social", "famille"], sousDomaine: "protection", tags: ["mandat", "inaptitude"] },
  { id: "social_directives_anticipees",     label_citoyen: "Je veux rédiger des directives anticipées",           label_juridique: "Directives anticipées du patient",             domaines: ["social", "famille"], sousDomaine: "santé", tags: ["directives", "santé"] },
  { id: "social_aide_victime_lavi",         label_citoyen: "Je suis victime et je cherche un soutien LAVI",       label_juridique: "Aide aux victimes (LAVI)",                    domaines: ["social", "violence"], sousDomaine: "lavi", tags: ["lavi", "victime"] },

  // ======================== VIOLENCE (compléments) ========================
  { id: "violence_enfant_maltraitance",     label_citoyen: "Je soupçonne la maltraitance d'un enfant",            label_juridique: "Signalement de maltraitance d'enfant",         domaines: ["violence", "famille"], sousDomaine: "enfant", tags: ["enfant", "signalement"] },
  { id: "violence_proteger_soi_urgence",    label_citoyen: "Je suis en danger immédiat",                          label_juridique: "Mesures d'éloignement immédiates (code pénal cantonal)", domaines: ["violence"], sousDomaine: "urgence", tags: ["urgence", "éloignement"] },
  { id: "violence_harcelement_rue",         label_citoyen: "Je subis du harcèlement de rue",                      label_juridique: "Harcèlement sur la voie publique",             domaines: ["violence"], sousDomaine: "harcèlement", tags: ["rue", "harcèlement"] },
  { id: "violence_cyberharcelement",        label_citoyen: "Je subis du cyberharcèlement",                        label_juridique: "Cyberharcèlement — plaintes possibles",        domaines: ["violence"], sousDomaine: "cyber", tags: ["cyber", "harcèlement"] },
  { id: "violence_stalking",                label_citoyen: "Quelqu'un me suit / me traque",                        label_juridique: "Stalking — protection de la personnalité",     domaines: ["violence"], sousDomaine: "stalking", tags: ["stalking"] },
  { id: "violence_menace_mort",             label_citoyen: "J'ai reçu des menaces de mort",                        label_juridique: "Menaces (art. 180 CP)",                        domaines: ["violence"], sousDomaine: "menace", tags: ["menaces"] },
  { id: "violence_ordonnance_eloignement",  label_citoyen: "Je veux obtenir une ordonnance d'éloignement civile", label_juridique: "Mesures civiles d'éloignement (art. 28b CC)",  domaines: ["violence", "famille"], sousDomaine: "éloignement", tags: ["éloignement", "civil"] },
  { id: "violence_viol_plainte",            label_citoyen: "J'ai été victime de viol",                             label_juridique: "Infractions sexuelles — plainte et LAVI",      domaines: ["violence"], sousDomaine: "sexuel", tags: ["viol", "sexuel"] },
  { id: "violence_retrait_plainte",         label_citoyen: "Je veux retirer ma plainte",                           label_juridique: "Retrait de plainte — infractions poursuivies sur plainte", domaines: ["violence"], sousDomaine: "plainte", tags: ["plainte", "retrait"] },
  { id: "violence_victime_indemnisation",   label_citoyen: "Je veux être indemnisé(e) comme victime",              label_juridique: "Indemnisation LAVI",                           domaines: ["violence", "social"], sousDomaine: "lavi", tags: ["lavi", "indemnisation"] },
  { id: "violence_mesures_coercitives",     label_citoyen: "On m'a placé en détention provisoire",                 label_juridique: "Détention provisoire et droits du prévenu",    domaines: ["violence"], sousDomaine: "pénal", tags: ["détention", "pénal"] },
  { id: "violence_constitution_partie_civile", label_citoyen: "Je veux me constituer partie civile",              label_juridique: "Partie plaignante — constitution",             domaines: ["violence"], sousDomaine: "procédure", tags: ["partie civile", "procédure"] },

  // ======================== ACCIDENT (compléments) ========================
  { id: "accident_tort_moral",              label_citoyen: "Je veux un tort moral après un accident",             label_juridique: "Tort moral (art. 47/49 CO)",                   domaines: ["accident"], sousDomaine: "tort_moral", tags: ["tort moral"] },
  { id: "accident_expertise_medicale",      label_citoyen: "On me convoque à une expertise médicale",             label_juridique: "Expertise médicale en assurance sociale",      domaines: ["accident", "assurances"], sousDomaine: "expertise", tags: ["expertise"] },
  { id: "accident_perte_gain_durable",      label_citoyen: "J'ai une perte de gain durable après accident",       label_juridique: "Rente d'invalidité après accident",           domaines: ["accident", "assurances"], sousDomaine: "invalidité", tags: ["invalidité", "rente"] },
  { id: "accident_subrogation_assureur",    label_citoyen: "Mon assureur se retourne contre le responsable",      label_juridique: "Subrogation de l'assureur (LCA / LAA)",        domaines: ["accident", "assurances"], sousDomaine: "subrogation", tags: ["subrogation"] },
  { id: "accident_medical",                 label_citoyen: "J'ai eu un accident médical (erreur médicale)",       label_juridique: "Responsabilité médicale",                      domaines: ["accident"], sousDomaine: "médical", tags: ["médical", "responsabilité"] },
  { id: "accident_retrait_permis",          label_citoyen: "On m'a retiré le permis après un accident",           label_juridique: "Retrait du permis de conduire",                domaines: ["accident"], sousDomaine: "circulation", tags: ["permis", "conduire"] },
  { id: "accident_lca_defaut",              label_citoyen: "Mon assurance refuse un accident pour faute",         label_juridique: "Refus pour faute grave en assurance",          domaines: ["accident", "assurances"], sousDomaine: "laa", tags: ["faute grave"] },
  { id: "accident_voies_de_fait",           label_citoyen: "J'ai été blessé(e) dans une bagarre",                 label_juridique: "Lésions corporelles — responsabilité civile", domaines: ["accident", "violence"], sousDomaine: "lésions", tags: ["lésions"] },
  { id: "accident_domicile_assurance",      label_citoyen: "Un accident est arrivé chez moi, qui est responsable ?", label_juridique: "Accident domestique et RC privée",          domaines: ["accident", "assurances"], sousDomaine: "rc", tags: ["domestique", "rc"] },

  // ======================== ENTREPRISE (compléments) ========================
  { id: "entreprise_creation_statuts",      label_citoyen: "Je veux créer une entreprise",                         label_juridique: "Création d'entreprise — forme juridique",     domaines: ["entreprise"], sousDomaine: "création", tags: ["création", "statuts"] },
  { id: "entreprise_licenciement_collectif",label_citoyen: "Mon entreprise prépare un licenciement collectif",    label_juridique: "Licenciement collectif (art. 335d CO)",       domaines: ["entreprise", "travail"], sousDomaine: "licenciement", tags: ["collectif", "consultation"] },
  { id: "entreprise_faillite",              label_citoyen: "Mon entreprise va faire faillite",                     label_juridique: "Faillite de l'entreprise — procédure",        domaines: ["entreprise", "dettes"], sousDomaine: "faillite", tags: ["faillite"] },
  { id: "entreprise_litige_fournisseur",    label_citoyen: "J'ai un litige avec un fournisseur / client",          label_juridique: "Litige commercial B2B",                       domaines: ["entreprise"], sousDomaine: "commercial", tags: ["b2b", "contrat"] },
  { id: "entreprise_administrateur_responsabilite", label_citoyen: "Je suis administrateur et on me recherche",    label_juridique: "Responsabilité des administrateurs (art. 754 CO)", domaines: ["entreprise"], sousDomaine: "gouvernance", tags: ["administrateur", "responsabilité"] },
  { id: "entreprise_tva_amende",            label_citoyen: "J'ai une amende TVA",                                  label_juridique: "Procédure fiscale TVA",                       domaines: ["entreprise"], sousDomaine: "fiscal", tags: ["tva"] },
  { id: "entreprise_locaux_commerciaux",    label_citoyen: "J'ai un litige sur mon bail commercial",               label_juridique: "Bail commercial — litige",                    domaines: ["entreprise", "bail"], sousDomaine: "bail_commercial", tags: ["commercial", "bail"] },
  { id: "entreprise_cessation_activite",    label_citoyen: "Je veux cesser mon activité indépendante",             label_juridique: "Cessation d'activité indépendante",           domaines: ["entreprise"], sousDomaine: "cessation", tags: ["cessation"] },
];

// --------------------------------------------------------------------------
// 5. Build & write
// --------------------------------------------------------------------------

function buildCatalog() {
  const files = fs.readdirSync(FICHES_DIR).filter(f => f.endsWith('.json'));
  const intents = [];
  const seenIds = new Set();

  let totalFiches = 0;
  for (const file of files) {
    const arr = JSON.parse(fs.readFileSync(path.join(FICHES_DIR, file), 'utf8'));
    totalFiches += arr.length;
    for (const fiche of arr) {
      if (seenIds.has(fiche.id)) continue;
      seenIds.add(fiche.id);
      intents.push(ficheToIntent(fiche));
    }
  }

  // Ajoute les intents manquants, dédupliqués par id
  for (const mi of MISSING_INTENTS) {
    if (seenIds.has(mi.id)) continue;
    seenIds.add(mi.id);
    intents.push({
      id: mi.id,
      label_citoyen: mi.label_citoyen,
      label_juridique: mi.label_juridique,
      domaines: mi.domaines,
      fiches_associees: [],
      sousDomaine: mi.sousDomaine || null,
      tags: mi.tags || [],
      cantons_specifiques: mi.cantons_specifiques || [],
      volume_estime: null,
      etat_couverture: 'missing',
      has_cascade: false,
      has_template: false,
      has_jurisprudence: false,
      has_source_ids: false,
      last_verified_at: null,
    });
  }

  return { intents, totalFiches };
}

function main() {
  const { intents, totalFiches } = buildCatalog();

  // Tri déterministe : domaine puis id
  intents.sort((a, b) => {
    const da = (a.domaines[0] || '');
    const db = (b.domaines[0] || '');
    if (da !== db) return da.localeCompare(db);
    return a.id.localeCompare(b.id);
  });

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(intents, null, 2) + '\n', 'utf8');

  // Statistiques pour l'utilisateur
  const byDomain = {};
  const byState = { complete: 0, partial: 0, stub: 0, missing: 0 };
  for (const i of intents) {
    const d = i.domaines[0] || 'autre';
    byDomain[d] = byDomain[d] || { total: 0, complete: 0, partial: 0, stub: 0, missing: 0 };
    byDomain[d].total += 1;
    byDomain[d][i.etat_couverture] += 1;
    byState[i.etat_couverture] += 1;
  }

  console.log(`[build-intent-catalog] ${intents.length} intents générés à partir de ${totalFiches} fiches`);
  console.log(`  complete=${byState.complete}  partial=${byState.partial}  stub=${byState.stub}  missing=${byState.missing}`);
  for (const [d, s] of Object.entries(byDomain)) {
    console.log(`  ${d.padEnd(12)} total=${s.total}  complete=${s.complete}  partial=${s.partial}  stub=${s.stub}  missing=${s.missing}`);
  }
  console.log(`\n→ ${path.relative(ROOT, OUT_FILE)}`);
}

main();
