#!/usr/bin/env node
/**
 * Phase Cortex 1 — Ajout de cascades structurées sur les fiches core
 *
 * Ajoute des cascades (plan d'étapes numérotées avec délais) sur ≥30 fiches
 * couvrant les 5 domaines solides : bail, travail, dettes, etrangers, famille.
 *
 * Règle fondamentale : constat → notification → délai d'attente → escalade officielle
 * Ne touche PAS aux 12 fiches qui ont déjà une cascade.
 */

import fs from 'node:fs';
import path from 'node:path';

const FICHES_DIR = 'src/data/fiches';

// ============================================================================
// CATALOGUE DES CASCADES À AJOUTER (35 fiches)
// ============================================================================

const CASCADES = {

  // ============= BAIL (7 nouvelles) =============
  bail_defaut_bruit: [{
    titre: "Résolution de nuisances sonores",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Constat des nuisances", description: "Tenir un journal daté des bruits (heure, durée, type). Si possible, enregistrements audio horodatés et témoignages de voisins.", delai: "immédiat", preuve_generee: "Journal des nuisances + enregistrements" },
      { numero: 2, action: "Notification écrite au bailleur", description: "Courrier recommandé à la régie/bailleur détaillant les nuisances et mise en demeure d'agir (bail = fournir chose dans état convenu).", delai: "dans les 7 jours", base_legale: "CO 259a", preuve_generee: "Accusé de réception postal" },
      { numero: 3, action: "Délai d'intervention du bailleur", description: "Laisser au bailleur un délai raisonnable pour intervenir auprès de l'auteur des nuisances.", delai: "30 jours", branches: [ { si: "bruit cesse", alors: "fin du processus" }, { si: "bruit persiste", alors: "etape 4" } ] },
      { numero: 4, action: "Saisine autorité de conciliation en matière de baux", description: "Requête gratuite en réduction de loyer et/ou consignation pour défaut non réparé.", delai: "immédiat après échec du délai", base_legale: "CO 259g / CPC 197", cout: "Gratuit" },
      { numero: 5, action: "Plainte police si nuisance grave", description: "En parallèle, dépôt plainte (tapage nocturne / troubles du voisinage) auprès de la police cantonale si les nuisances sont illicites.", delai: "à tout moment", base_legale: "règlements cantonaux de police" }
    ]
  }],

  bail_loyer_abusif: [{
    titre: "Contestation d'un loyer abusif",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Collecte des indices d'abus", description: "Relever le loyer payé, le loyer précédent (si disponible via formulaire officiel), les rendements du bailleur, les loyers comparatifs du quartier.", delai: "immédiat", preuve_generee: "Dossier chiffré comparatif" },
      { numero: 2, action: "Demande du formulaire officiel", description: "Demander par écrit au bailleur le formulaire officiel indiquant le loyer précédent (obligatoire dans 15 cantons).", delai: "dans les 30 jours de la conclusion", base_legale: "CO 270 / CO 269d", preuve_generee: "Formulaire officiel daté" },
      { numero: 3, action: "Saisine autorité de conciliation", description: "Requête en contestation du loyer initial (ou réduction) devant l'autorité paritaire.", delai: "30 jours dès réception formulaire ou emménagement", base_legale: "CO 270 / CPC 197", cout: "Gratuit" },
      { numero: 4, action: "Audience de conciliation", description: "Présenter les indices (rendement excessif, comparaisons, loyer précédent abusif). Possibilité d'accord transactionnel.", delai: "sous 60 jours", branches: [ { si: "accord trouvé", alors: "fin du processus avec nouveau loyer" }, { si: "échec", alors: "etape 5" } ] },
      { numero: 5, action: "Action au tribunal des baux", description: "Action judiciaire dans les 30 jours suivant délivrance autorisation de procéder.", delai: "30 jours après échec conciliation", base_legale: "CO 270 / CPC 209" }
    ]
  }],

  bail_charges_contestees: [{
    titre: "Contestation des charges accessoires",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Demande de consultation du décompte", description: "Demander par écrit à la régie le décompte détaillé des charges et les pièces justificatives.", delai: "dans les 30 jours de réception du décompte", base_legale: "CO 257b", preuve_generee: "Copie du décompte + justificatifs" },
      { numero: 2, action: "Consultation sur place des justificatifs", description: "Rendez-vous en régie pour vérifier factures, relevés de consommation, clés de répartition.", delai: "sous 30 jours", preuve_generee: "Notes de consultation" },
      { numero: 3, action: "Contestation écrite motivée", description: "Courrier recommandé listant les postes contestés, les montants et les motifs (charges non prévues au bail, clé de répartition erronée, doubles facturations).", delai: "dans les 30 jours suivant consultation", base_legale: "CO 257a / CO 257b", preuve_generee: "Accusé de réception" },
      { numero: 4, action: "Saisine autorité de conciliation", description: "Si la régie ne corrige pas, requête gratuite en restitution de charges indues.", delai: "immédiat après refus", base_legale: "CO 257b / CPC 197", cout: "Gratuit" }
    ]
  }],

  bail_etat_des_lieux: [{
    titre: "Contestation ou sécurisation d'un état des lieux",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Préparation de l'EDL", description: "Visite préalable de l'appartement avec liste exhaustive des défauts préexistants. Prendre photos horodatées de chaque pièce.", delai: "avant l'EDL officiel", preuve_generee: "Photos + check-list" },
      { numero: 2, action: "EDL contradictoire signé", description: "Lors de l'EDL, exiger inscription de TOUS les défauts visibles. Ne pas signer si des défauts sont omis — demander annexe manuscrite.", delai: "jour de l'EDL", base_legale: "CO 267 / CO 267a", preuve_generee: "Protocole EDL signé par les deux parties" },
      { numero: 3, action: "Notification défauts cachés", description: "Défauts découverts après l'EDL : courrier recommandé sous 2-3 jours pour défauts non décelables à l'EDL.", delai: "immédiatement après découverte", base_legale: "CO 267a al. 2", preuve_generee: "Accusé de réception" },
      { numero: 4, action: "Contestation des dégâts imputés", description: "Si la régie impute des dégâts au locataire à la restitution, contester par écrit en invoquant usure normale et défauts préexistants.", delai: "dans les 30 jours", base_legale: "CO 267 / usure normale" },
      { numero: 5, action: "Saisine autorité de conciliation", description: "Requête gratuite pour trancher la prise en charge des dégâts et restitution de la caution.", delai: "immédiat après échec négociation", base_legale: "CO 274 / CPC 197", cout: "Gratuit" }
    ]
  }],

  bail_expulsion: [{
    titre: "Défense face à une procédure d'expulsion",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Analyse du motif d'expulsion", description: "Identifier le motif (loyer impayé CO 257d, défaut grave, fin de bail). Vérifier le respect des délais et formes de résiliation.", delai: "immédiat", preuve_generee: "Analyse écrite du cas" },
      { numero: 2, action: "Régularisation si possible", description: "Si loyer impayé : payer l'intégralité dans le délai comminatoire de 30 jours pour éviter la résiliation. Conserver preuve de paiement.", delai: "dans les 30 jours de la sommation", base_legale: "CO 257d", preuve_generee: "Reçu de paiement" },
      { numero: 3, action: "Contestation de la résiliation", description: "Requête à l'autorité de conciliation en contestation de congé dans les 30 jours, ou demande de prolongation de bail (CO 272).", delai: "dans les 30 jours dès réception du congé", base_legale: "CO 271 / CO 271a / CO 272", cout: "Gratuit" },
      { numero: 4, action: "Audience conciliation / tribunal", description: "Présenter les arguments : congé abusif, absence de motif, prolongation pour chercher un autre logement.", delai: "selon convocation", branches: [ { si: "accord / prolongation", alors: "fin du processus avec délai supplémentaire" }, { si: "refus", alors: "etape 5" } ] },
      { numero: 5, action: "Procédure judiciaire d'expulsion", description: "Face à une requête d'expulsion (protection judiciaire / cas clair), se défendre avec avocat ou permanence ASLOCA. Demander sursis humanitaire si situation extrême.", delai: "respecter les délais du tribunal", base_legale: "CPC 257 / LP 283" }
    ]
  }],

  bail_loyers_impayes: [{
    titre: "Gestion d'un arriéré de loyers (côté locataire)",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Diagnostic financier immédiat", description: "Lister les loyers impayés et le montant total. Identifier la cause (perte emploi, maladie, surendettement).", delai: "immédiat", preuve_generee: "État récapitulatif" },
      { numero: 2, action: "Contact avec la régie", description: "Courrier ou entretien pour proposer un plan de paiement. Ne pas ignorer — la bonne foi compte.", delai: "dans les 7 jours", preuve_generee: "Proposition écrite de plan" },
      { numero: 3, action: "Réponse à la sommation comminatoire", description: "Dès réception d'une sommation CO 257d (30 jours de délai), payer l'intégralité pour éviter la résiliation extraordinaire.", delai: "dans les 30 jours de la sommation", base_legale: "CO 257d", preuve_generee: "Preuve de paiement intégral" },
      { numero: 4, action: "Recours aides sociales / associations", description: "Saisir le service social communal, Caritas ou le Fonds d'aide au logement pour avance de loyers.", delai: "en parallèle, immédiat", cout: "Gratuit" },
      { numero: 5, action: "Contestation résiliation si déjà notifiée", description: "Si résiliation notifiée malgré paiement ou motif non valable : saisine conciliation dans 30 jours.", delai: "30 jours dès congé", base_legale: "CO 271 / CO 273" }
    ]
  }],

  bail_logement_insalubre: [{
    titre: "Traitement d'un logement insalubre",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Documenter l'insalubrité", description: "Photos, dates, relevés (humidité, température, vermine, installations électriques défaillantes). Rapport médical si problèmes de santé liés.", delai: "immédiat", preuve_generee: "Dossier photo + certificats médicaux" },
      { numero: 2, action: "Mise en demeure du bailleur", description: "Courrier recommandé exigeant remise en état dans un délai raisonnable, avec menace de consignation du loyer.", delai: "dans les 7 jours du constat", base_legale: "CO 259a / CO 259b", preuve_generee: "Accusé de réception" },
      { numero: 3, action: "Signalement service communal hygiène/logement", description: "Saisir l'office cantonal du logement ou le service hygiène de la commune pour inspection officielle.", delai: "en parallèle, immédiat", preuve_generee: "Rapport d'inspection communale" },
      { numero: 4, action: "Consignation du loyer", description: "Si bailleur inactif, consigner le loyer auprès de l'office désigné dans le canton (préavis obligatoire).", delai: "après préavis écrit", base_legale: "CO 259g", preuve_generee: "Récépissé de consignation" },
      { numero: 5, action: "Saisine autorité de conciliation", description: "Requête en réduction de loyer + exécution des travaux + dommages-intérêts éventuels.", delai: "immédiat après consignation", base_legale: "CO 259d / CO 259e / CPC 197", cout: "Gratuit" }
    ]
  }],

  // ============= TRAVAIL (7 nouvelles) =============
  travail_heures_sup: [{
    titre: "Récupération des heures supplémentaires",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Documentation des heures", description: "Tenir un journal précis des heures effectuées (début, fin, pauses). Conserver e-mails, badgeages, plannings.", delai: "en continu", preuve_generee: "Relevé d'heures détaillé" },
      { numero: 2, action: "Demande écrite de compensation", description: "Courrier ou e-mail à l'employeur demandant compensation (repos ou paiement) avec décompte chiffré. Majoration 25% due (sauf dérogation écrite conforme).", delai: "avant la fin des rapports de travail de préférence", base_legale: "CO 321c", preuve_generee: "Courrier daté + accusé" },
      { numero: 3, action: "Rappel formel et mise en demeure", description: "Si pas de réponse sous 14 jours, mise en demeure recommandée avec délai de paiement de 10 jours.", delai: "après 14 jours sans réponse", preuve_generee: "Mise en demeure recommandée" },
      { numero: 4, action: "Saisine tribunal des prud'hommes", description: "Procédure simplifiée gratuite jusqu'à 30'000 CHF (procédure simplifiée CPC 243). Pas de frais de justice pour le salarié.", delai: "dans les 5 ans (prescription)", base_legale: "CO 321c / CPC 243 / CO 128 ch.3", cout: "Gratuit jusqu'à 30'000 CHF" }
    ]
  }],

  travail_certificat: [{
    titre: "Obtention ou rectification du certificat de travail",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Demande écrite du certificat", description: "Courrier ou e-mail demandant formellement un certificat de travail complet (fonctions, qualité, durée) ou qualifié.", delai: "à tout moment pendant/après emploi", base_legale: "CO 330a", preuve_generee: "Demande écrite datée" },
      { numero: 2, action: "Analyse du certificat reçu", description: "Vérifier véracité, exhaustivité, bienveillance. Repérer formules codées dommageables ou omissions importantes.", delai: "dans les 14 jours de réception", preuve_generee: "Analyse écrite du certificat" },
      { numero: 3, action: "Demande de rectification motivée", description: "Courrier recommandé listant les corrections demandées, faits précis à l'appui (évaluations, e-mails positifs).", delai: "dans les 30 jours de réception", base_legale: "CO 330a", preuve_generee: "Accusé de réception" },
      { numero: 4, action: "Procédure prud'homale", description: "En cas de refus, action au tribunal des prud'hommes — procédure simplifiée gratuite jusqu'à 30'000 CHF.", delai: "dans les 10 ans (prescription)", base_legale: "CO 330a / CO 127 / CPC 243", cout: "Gratuit jusqu'à 30'000 CHF" }
    ]
  }],

  travail_vacances: [{
    titre: "Réclamation de solde de vacances",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Décompte du solde", description: "Calculer les jours acquis (min. 4 semaines CO 329a, 5 semaines pour <20 ans) vs pris. Vérifier fiches de paie et certificats.", delai: "immédiat", preuve_generee: "Décompte chiffré" },
      { numero: 2, action: "Demande écrite à l'employeur", description: "Courrier ou e-mail demandant paiement du solde (si fin des rapports) ou prise effective (si rapports en cours).", delai: "avant fin des rapports", base_legale: "CO 329a / CO 329d", preuve_generee: "Demande écrite" },
      { numero: 3, action: "Mise en demeure", description: "Courrier recommandé exigeant paiement dans 10 jours, intérêts moratoires 5%.", delai: "après 14 jours sans réponse", base_legale: "CO 104", preuve_generee: "Accusé de réception" },
      { numero: 4, action: "Action au tribunal des prud'hommes", description: "Procédure simplifiée gratuite jusqu'à 30'000 CHF. Prescription 5 ans.", delai: "dans les 5 ans", base_legale: "CO 329d / CO 128 ch.3 / CPC 243", cout: "Gratuit jusqu'à 30'000 CHF" }
    ]
  }],

  travail_grossesse: [{
    titre: "Protection pendant la grossesse et maternité",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Annonce à l'employeur", description: "Informer (de préférence par écrit) l'employeur de la grossesse. Remettre certificat médical. La protection s'active dès l'annonce.", delai: "dès connaissance", base_legale: "CO 336c al. 1 let. c", preuve_generee: "Courrier + certificat médical" },
      { numero: 2, action: "Adaptation du poste", description: "Demander adaptations (pas de travail de nuit après 8e mois, pas de charges lourdes, pauses supplémentaires). Certificat médical à l'appui si nécessaire.", delai: "progressivement selon stade", base_legale: "LTr 35 / OLT 1 art. 60-64" },
      { numero: 3, action: "Contestation d'un licenciement pendant la grossesse", description: "Licenciement nul pendant grossesse + 16 semaines après accouchement. Courrier recommandé immédiat pour rappeler la nullité.", delai: "immédiat si licenciement", base_legale: "CO 336c al. 1 let. c / CO 336c al. 2", preuve_generee: "Courrier recommandé" },
      { numero: 4, action: "Allocation maternité APG", description: "Demande d'allocation maternité (14 semaines, 80% du salaire) via la caisse de compensation AVS.", delai: "après accouchement, dans les 5 ans", base_legale: "LAPG 16b-16h", cout: "Gratuit" },
      { numero: 5, action: "Action prud'homale si violation", description: "Si l'employeur ne respecte pas la protection ou refuse le poste : action au tribunal des prud'hommes.", delai: "selon délai prescription (5-10 ans)", base_legale: "CO 328 / CO 336c / CPC 243", cout: "Gratuit jusqu'à 30'000 CHF" }
    ]
  }],

  travail_maladie: [{
    titre: "Arrêt maladie et protection de l'emploi",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Annonce immédiate à l'employeur", description: "Informer l'employeur dès le premier jour d'absence. Certificat médical si durée >3 jours ou selon règlement interne.", delai: "premier jour d'absence", base_legale: "CO 324a", preuve_generee: "Certificat médical" },
      { numero: 2, action: "Vérification de la couverture", description: "Identifier la source du salaire pendant maladie : échelle bernoise/zurichoise (CO 324a) ou assurance perte de gain collective.", delai: "sous 7 jours", base_legale: "CO 324a / CCT applicable", preuve_generee: "Analyse du contrat et CCT" },
      { numero: 3, action: "Protection contre le licenciement", description: "Délai de protection dès l'incapacité : 30 jours (1ère année), 90 jours (2e-5e année), 180 jours (dès 6e année). Licenciement notifié pendant = nul.", delai: "tout au long de l'arrêt", base_legale: "CO 336c al. 1 let. b", preuve_generee: "Rappel écrit de la protection si licenciement" },
      { numero: 4, action: "Contestation d'un licenciement abusif", description: "Si l'employeur licencie pendant la période protégée ou utilise la maladie comme motif : courrier immédiat rappelant la nullité.", delai: "immédiat dès réception congé", base_legale: "CO 336c / CO 336", preuve_generee: "Courrier recommandé" },
      { numero: 5, action: "Action prud'homale", description: "Action devant le tribunal des prud'hommes pour nullité du congé ou indemnité (jusqu'à 6 mois de salaire).", delai: "délai constitution au tribunal", base_legale: "CO 336a / CPC 243", cout: "Gratuit jusqu'à 30'000 CHF" }
    ]
  }],

  travail_delai_conge: [{
    titre: "Vérification et contestation d'un délai de congé",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Calcul du délai applicable", description: "Délais légaux CO 335c : 7 jours période d'essai, 1 mois (1ère année), 2 mois (2e-9e année), 3 mois (dès 10e année). Vérifier si le contrat prévoit plus.", delai: "immédiat dès réception", base_legale: "CO 335b / CO 335c", preuve_generee: "Décompte daté" },
      { numero: 2, action: "Vérification de la forme", description: "Contrôler forme écrite requise par contrat/CCT, mention des motifs si demandée (CO 335 al. 2), respect du terme mensuel.", delai: "sous 7 jours", base_legale: "CO 335 / CO 335c al. 1", preuve_generee: "Analyse du courrier de congé" },
      { numero: 3, action: "Demande écrite de motifs", description: "Si motifs non communiqués, demande écrite à l'employeur — obligation de les indiquer par écrit.", delai: "dans les 30 jours", base_legale: "CO 335 al. 2", preuve_generee: "Accusé de réception" },
      { numero: 4, action: "Contestation si congé abusif ou en temps inopportun", description: "Opposition par écrit au plus tard à la fin du délai de congé. Saisine tribunal des prud'hommes dans les 180 jours après fin des rapports.", delai: "avant fin délai congé (opposition) + 180 jours (action)", base_legale: "CO 336b / CO 336c", preuve_generee: "Opposition recommandée" }
    ]
  }],

  travail_assurance_chomage: [{
    titre: "Inscription et droits au chômage",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Inscription à l'ORP dès notification du congé", description: "S'inscrire à l'office régional de placement avant le dernier jour de travail pour éviter suspension.", delai: "avant fin des rapports", base_legale: "LACI 8 / LACI 10", preuve_generee: "Attestation d'inscription" },
      { numero: 2, action: "Dépôt dossier à la caisse de chômage", description: "Choisir la caisse (syndicale ou publique) et déposer demande d'indemnités avec : certificat de travail, décompte salaire 12 derniers mois, lettre de congé, attestations employeur.", delai: "sous 3 mois après fin emploi (sinon perte partielle)", base_legale: "LACI 20 / OACI 29", preuve_generee: "Confirmation réception dossier" },
      { numero: 3, action: "Recherches d'emploi documentées", description: "Effectuer en moyenne 10-12 recherches/mois dès préavis. Conserver toutes preuves (e-mails, candidatures, refus).", delai: "dès préavis et chaque mois", base_legale: "LACI 17 / OACI 26", preuve_generee: "Journal de recherches" },
      { numero: 4, action: "Contestation d'une décision de suspension/refus", description: "Opposition écrite auprès de la caisse dans les 30 jours. Pas de frais.", delai: "30 jours dès décision", base_legale: "LPGA 52 / LACI 100", cout: "Gratuit" },
      { numero: 5, action: "Recours au tribunal cantonal", description: "Si opposition rejetée, recours au tribunal cantonal des assurances dans les 30 jours. Gratuit en 1ère instance.", delai: "30 jours dès décision sur opposition", base_legale: "LPGA 56 / LPGA 61", cout: "Gratuit" }
    ]
  }],

  // ============= DETTES (7 nouvelles) =============
  dettes_opposition: [{
    titre: "Former opposition à un commandement de payer",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Analyse du commandement reçu", description: "Vérifier le créancier, le montant, le motif, la date de notification. Noter le délai de 10 jours dès notification.", delai: "immédiat dès réception", base_legale: "LP 69 / LP 74", preuve_generee: "Copie annotée du commandement" },
      { numero: 2, action: "Former opposition totale ou partielle", description: "Au choix : (a) oralement lors de la notification auprès de l'huissier, (b) par écrit à l'office des poursuites du canton. Opposition gratuite, sans motif requis.", delai: "dans les 10 jours dès notification", base_legale: "LP 74 / LP 75", cout: "Gratuit", preuve_generee: "Accusé de réception de l'opposition" },
      { numero: 3, action: "Conservation de toutes les preuves", description: "Garder copie du commandement, de l'opposition, du récépissé. Suspension automatique de la poursuite.", delai: "immédiat après opposition", preuve_generee: "Dossier complet horodaté" },
      { numero: 4, action: "Anticipation de la mainlevée", description: "Le créancier peut demander la mainlevée (provisoire si titre, définitive si jugement). Préparer les preuves de l'inexistence/paiement de la dette.", delai: "selon action créancier", base_legale: "LP 80 / LP 82 / LP 83", preuve_generee: "Dossier de défense" }
    ]
  }],

  dettes_mainlevee_provisoire: [{
    titre: "Défense en procédure de mainlevée provisoire",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Analyse du titre invoqué", description: "Vérifier si le créancier présente un titre à la mainlevée provisoire (reconnaissance de dette signée, contrat avec reconnaissance, acte authentique).", delai: "dès convocation tribunal", base_legale: "LP 82", preuve_generee: "Analyse écrite du titre" },
      { numero: 2, action: "Identification des moyens libératoires", description: "Rassembler toute preuve rendant vraisemblable la libération : paiement, compensation, remise, prescription, vice du consentement.", delai: "sous 10 jours", base_legale: "LP 82 al. 2", preuve_generee: "Dossier de moyens libératoires" },
      { numero: 3, action: "Dépôt de la réponse écrite", description: "Déposer la réponse au tribunal dans le délai imparti (généralement 10-20 jours) avec toutes preuves. Procédure sommaire.", delai: "dans le délai du tribunal", base_legale: "CPC 251 / LP 84", preuve_generee: "Copie horodatée de la réponse" },
      { numero: 4, action: "Audience et décision", description: "Audience sommaire. Le juge statue sur la mainlevée uniquement. Décision notifiée par écrit.", delai: "selon tribunal", branches: [ { si: "mainlevée prononcée", alors: "etape 5 — action en libération" }, { si: "mainlevée refusée", alors: "fin / poursuite arrêtée" } ] },
      { numero: 5, action: "Action en libération de dette", description: "Si mainlevée accordée : action en libération de dette dans les 20 jours (procédure ordinaire au fond).", delai: "20 jours dès décision mainlevée", base_legale: "LP 83 al. 2" }
    ]
  }],

  dettes_arrangement_amiable: [{
    titre: "Négociation d'un arrangement amiable",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Inventaire complet des dettes", description: "Lister tous créanciers, montants, intérêts, frais de poursuite. Classer par priorité (urgentes = loyer, primes maladie, pensions).", delai: "immédiat", preuve_generee: "Tableau récapitulatif" },
      { numero: 2, action: "Budget mensuel réaliste", description: "Calcul du minimum vital LP + charges courantes + capacité de remboursement mensuelle.", delai: "sous 7 jours", base_legale: "Directives SCDP / LP 93", preuve_generee: "Budget détaillé" },
      { numero: 3, action: "Proposition écrite aux créanciers", description: "Courrier individuel à chaque créancier proposant un plan (paiement échelonné ou remise partielle). Conserver preuve d'envoi.", delai: "sous 14 jours", preuve_generee: "Courriers recommandés + accusés" },
      { numero: 4, action: "Formalisation des accords", description: "Dès acceptation, obtenir confirmation écrite signée (suspension poursuites, délais, montants, conséquences en cas de défaut).", delai: "dès accord", preuve_generee: "Conventions signées" },
      { numero: 5, action: "Escalade vers médiation de dettes", description: "Si créanciers refusent : saisir une structure de médiation cantonale (Caritas, Centre social protestant) gratuite.", delai: "après échec négociation", cout: "Gratuit" }
    ]
  }],

  dettes_minimum_vital: [{
    titre: "Vérification et contestation de la quotité saisissable",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Calcul du minimum vital LP", description: "Base mensuelle (personne seule ~1'200 CHF, couple ~1'700 CHF, +400/600 par enfant) + loyer effectif + primes LAMal + frais professionnels + pensions dues.", delai: "dès annonce de saisie", base_legale: "LP 93 / Directives SCDP", preuve_generee: "Calcul écrit détaillé" },
      { numero: 2, action: "Production des justificatifs", description: "Envoyer à l'office des poursuites : contrat de bail, décomptes LAMal, justificatifs enfants, frais médicaux, pensions versées, frais transport travail.", delai: "sous 10 jours dès demande office", base_legale: "LP 91", preuve_generee: "Dossier complet daté" },
      { numero: 3, action: "Demande de révision", description: "Si situation change (nouveau loyer, enfant, perte travail) : courrier à l'office demandant recalcul immédiat.", delai: "immédiat en cas de changement", base_legale: "LP 93 al. 3", preuve_generee: "Accusé de réception" },
      { numero: 4, action: "Plainte LP contre calcul erroné", description: "Plainte écrite à l'autorité cantonale de surveillance LP dans les 10 jours dès notification du calcul.", delai: "10 jours dès décision", base_legale: "LP 17", cout: "Gratuit", preuve_generee: "Plainte motivée horodatée" }
    ]
  }],

  dettes_impots_arrieres: [{
    titre: "Régularisation d'impôts arriérés",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Demande de relevé complet", description: "Contacter l'administration fiscale cantonale pour obtenir le détail des périodes impayées, montants, intérêts, amendes.", delai: "immédiat", preuve_generee: "Relevé officiel" },
      { numero: 2, action: "Vérification du bien-fondé", description: "Contrôler les taxations (erreurs, revenus effectifs, déductions oubliées). Demander rectification si erreur matérielle.", delai: "sous 30 jours", base_legale: "LIFD 147 / LHID 51", preuve_generee: "Analyse écrite" },
      { numero: 3, action: "Demande de plan de paiement", description: "Courrier formel à l'administration fiscale demandant échelonnement (jusqu'à 24 mois possibles). Joindre budget.", delai: "avant exigibilité / avant poursuite", preuve_generee: "Décision d'échelonnement" },
      { numero: 4, action: "Demande de remise (situation de détresse)", description: "Si impossible à payer : requête formelle en remise d'impôt (critères : détresse prouvée, bonne foi, absence de négligence grave).", delai: "avant prescription", base_legale: "LIFD 167 / LHID 39a", preuve_generee: "Décision de remise" },
      { numero: 5, action: "Opposition si poursuite", description: "Si commandement de payer fiscal reçu : opposition possible seulement sur la quotité saisissable, pas sur la dette elle-même (titre exécutoire).", delai: "10 jours dès commandement", base_legale: "LP 74 / LP 80" }
    ]
  }],

  dettes_prescription: [{
    titre: "Invocation de la prescription d'une dette",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Identification du type de créance", description: "Délais standards : 10 ans (créances ordinaires, CO 127), 5 ans (loyers, salaires, intérêts, pensions, CO 128), 2 ans (certaines créances, vente consommateur LDIP).", delai: "immédiat", base_legale: "CO 127 / CO 128 / CO 129", preuve_generee: "Analyse du délai applicable" },
      { numero: 2, action: "Vérification des actes interruptifs", description: "Contrôler si la prescription a été interrompue par poursuite, reconnaissance de dette, action en justice. Chaque interruption fait courir un nouveau délai.", delai: "sous 14 jours", base_legale: "CO 135 / CO 137", preuve_generee: "Chronologie des actes" },
      { numero: 3, action: "Invocation écrite de la prescription", description: "La prescription doit être invoquée (pas automatique). Courrier recommandé au créancier ou opposition au commandement de payer mentionnant explicitement la prescription.", delai: "dès que le délai est échu", base_legale: "CO 142", preuve_generee: "Courrier recommandé" },
      { numero: 4, action: "Défense en mainlevée ou au fond", description: "Si le créancier agit : opposer la prescription en mainlevée (titre insuffisant) ou en action au fond (moyen libératoire).", delai: "selon procédure en cours", base_legale: "LP 82 / LP 83 / CO 142" }
    ]
  }],

  dettes_faillite_personnelle: [{
    titre: "Procédure de faillite personnelle volontaire",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Évaluation de l'insolvabilité", description: "État des dettes total / revenus / actifs. La faillite personnelle est possible en cas d'insolvabilité manifeste et durable.", delai: "immédiat", base_legale: "LP 191", preuve_generee: "Dossier financier complet" },
      { numero: 2, action: "Exploration préalable des alternatives", description: "Consulter un service de désendettement (Caritas, CSP) pour évaluer si arrangement amiable ou assainissement financier est possible (faillite = dernier recours).", delai: "avant dépôt demande", cout: "Gratuit", preuve_generee: "Attestation de consultation" },
      { numero: 3, action: "Déclaration d'insolvabilité au juge", description: "Requête écrite au juge de la faillite (tribunal cantonal) déclarant l'insolvabilité. Joindre inventaire des biens, liste des créanciers, revenus.", delai: "quand décision prise", base_legale: "LP 191", preuve_generee: "Acte de dépôt horodaté" },
      { numero: 4, action: "Procédure de faillite", description: "L'office des faillites réalise les biens, distribue le produit. Résultat : acte de défaut de biens pour chaque créancier non payé.", delai: "quelques mois", base_legale: "LP 197-270", preuve_generee: "Actes de défaut de biens" },
      { numero: 5, action: "Nouveau départ avec précautions", description: "Dettes non couvertes restent dues (prescrites 20 ans après ADB, LP 149a) mais non exécutables sauf nouveaux biens. Restriction d'inscription registre + risques éthiques.", delai: "après clôture", base_legale: "LP 149a / LP 265a" }
    ]
  }],

  // ============= ETRANGERS (7 nouvelles) =============
  etranger_naturalisation: [{
    titre: "Procédure de naturalisation ordinaire",
    domaine: "etrangers",
    etapes: [
      { numero: 1, action: "Vérification des conditions fédérales", description: "Permis C + 10 ans de résidence en CH (dont 3 des 5 dernières années) + intégration + connaissance langue B1 oral / A2 écrit + absence condamnation.", delai: "avant dépôt", base_legale: "LN 9 / LN 11 / LN 12", preuve_generee: "Dossier de vérification" },
      { numero: 2, action: "Vérification des conditions cantonales/communales", description: "Chaque canton/commune fixe des exigences supplémentaires (durée résidence cantonale/communale, test civisme, audition).", delai: "selon canton", preuve_generee: "Conditions cantonales écrites" },
      { numero: 3, action: "Dépôt de la demande à la commune", description: "Formulaire + justificatifs (attestations, extraits registres, certificats langue, déclaration intégration). Émoluments variables.", delai: "quand prêt", base_legale: "LN 13 / OLN", cout: "Variable (500-2500 CHF)", preuve_generee: "Accusé de dépôt" },
      { numero: 4, action: "Audition et décisions cantonales/communales", description: "Audition d'intégration (commune ou canton). Décision municipale puis cantonale.", delai: "6-24 mois selon canton", branches: [ { si: "décisions positives", alors: "etape 5" }, { si: "refus", alors: "etape 6" } ] },
      { numero: 5, action: "Décision fédérale SEM", description: "Le SEM accorde l'autorisation fédérale. Prestation de serment/promesse civique selon canton.", delai: "3-12 mois", base_legale: "LN 13 al. 3" },
      { numero: 6, action: "Recours contre refus", description: "Recours au tribunal cantonal (30 jours) puis TAF (30 jours). Procédure coûteuse, examen limité de l'intégration.", delai: "30 jours dès décision", base_legale: "LN 46 / LTAF 31" }
    ]
  }],

  etranger_regroupement_familial: [{
    titre: "Demande de regroupement familial",
    domaine: "etrangers",
    etapes: [
      { numero: 1, action: "Vérification des conditions", description: "Titulaire : permis C (ou B sous conditions) / Suisse / UE-AELE. Logement suffisant, ressources sans aide sociale, pas de dépendance durable.", delai: "avant dépôt", base_legale: "LEI 42-44 / ALCP annexe I art. 3", preuve_generee: "Dossier de vérification" },
      { numero: 2, action: "Respect du délai de regroupement", description: "Délais : 5 ans dès autorisation / regroupement, 1 an pour enfants >12 ans. Hors délai = motif familial majeur requis.", delai: "dans les 5 ans / 1 an", base_legale: "LEI 47", preuve_generee: "Chronologie documentée" },
      { numero: 3, action: "Constitution du dossier", description: "Actes d'état civil (mariage, naissance), passeport, preuves logement (contrat bail), revenus (fiches salaire 6 mois), attestation non-aide sociale.", delai: "sous 30 jours", preuve_generee: "Dossier complet" },
      { numero: 4, action: "Dépôt auprès du service cantonal migration", description: "Dépôt formulaire + dossier au SEM cantonal. Émoluments variables (80-150 CHF par personne).", delai: "quand prêt", base_legale: "OASA 73", cout: "80-150 CHF", preuve_generee: "Accusé de dépôt" },
      { numero: 5, action: "Décision et entrée en Suisse", description: "Visa D délivré après autorisation d'entrée. Permis remis en CH dans 14 jours.", delai: "3-12 mois", branches: [ { si: "accord", alors: "entrée en Suisse" }, { si: "refus", alors: "etape 6" } ] },
      { numero: 6, action: "Recours contre refus", description: "Recours au tribunal cantonal dans 30 jours, puis TAF. Gratuit si assistance judiciaire accordée.", delai: "30 jours dès décision", base_legale: "LEI 112 / LTAF 31" }
    ]
  }],

  etranger_renvoi_recours: [{
    titre: "Recours contre une décision de renvoi",
    domaine: "etrangers",
    etapes: [
      { numero: 1, action: "Analyse de la décision notifiée", description: "Identifier l'autorité (SEM, canton), la base légale invoquée (LEI 64, révocation permis, refus prolongation), le délai de recours, l'effet suspensif.", delai: "immédiat dès réception", base_legale: "LEI 64 / LEI 83", preuve_generee: "Analyse annotée" },
      { numero: 2, action: "Consultation d'un mandataire qualifié", description: "Consulter immédiatement un centre juridique migration (CSP, Caritas, Centre social protestant) ou avocat spécialisé. Assistance judiciaire possible.", delai: "sous 7 jours", cout: "Variable (gratuit avec AJ)" },
      { numero: 3, action: "Dépôt du recours avec demande d'effet suspensif", description: "Recours écrit motivé dans le délai (souvent 30 jours, parfois 5 ou 10 pour asile). Demander explicitement la restitution de l'effet suspensif si non accordé d'office.", delai: "30 jours (ou délai notifié)", base_legale: "LEI 112 / LAsi 108 / PA 55", preuve_generee: "Acte de recours déposé" },
      { numero: 4, action: "Production des preuves d'intégration / risques", description: "Rassembler : années résidence, emploi, liens familiaux CH, attestations intégration, preuves risques pays d'origine (art. 3 CEDH, non-refoulement).", delai: "pendant l'instruction", base_legale: "CEDH 3 / LEI 83 / LAsi 5" },
      { numero: 5, action: "Décision de recours", description: "Décision sur recours. Ensuite : TAF dans 30 jours (gratuit si AJ). Cas extrême : CEDH après épuisement voies internes.", delai: "selon instance", base_legale: "LTAF 31 / CEDH 34" }
    ]
  }],

  etranger_violence_permis: [{
    titre: "Protection du permis en cas de violence conjugale",
    domaine: "etrangers",
    etapes: [
      { numero: 1, action: "Mise en sécurité immédiate", description: "Contacter la police (117), un centre d'accueil LAVI, une maison d'accueil pour femmes. Certificat médical immédiat pour toute blessure.", delai: "immédiat", base_legale: "LAVI 1 / CEDH 3", preuve_generee: "Constat médical + rapport police" },
      { numero: 2, action: "Documentation complète des violences", description: "Rassembler tout : certificats médicaux, plaintes, témoignages, messages, photos, rapports associations (LAVI, centres spécialisés).", delai: "dans les 30 jours", preuve_generee: "Dossier horodaté complet" },
      { numero: 3, action: "Annonce au service cantonal migration", description: "Avant toute séparation, courrier recommandé au service cantonal demandant maintien du permis sur base LEI 50 al. 2 (raisons personnelles majeures).", delai: "dès séparation envisagée", base_legale: "LEI 50 al. 1 let. b / LEI 50 al. 2 / OASA 77", preuve_generee: "Accusé de réception" },
      { numero: 4, action: "Constitution du dossier de maintien", description: "Démontrer : (a) violence conjugale / réintégration sociale dans le pays d'origine compromise, (b) intégration en CH. Soutien mandataire migration crucial.", delai: "selon échanges avec SPOP/SEM", base_legale: "LEI 50 al. 2" },
      { numero: 5, action: "Recours contre refus", description: "Si le service cantonal refuse le maintien : recours cantonal (30 jours) puis TAF. Jurisprudence ATF 136 II 1 protège les victimes.", delai: "30 jours dès décision", base_legale: "LEI 112 / ATF 136 II 1" }
    ]
  }],

  etranger_permis_c_conditions: [{
    titre: "Demande d'obtention du permis C",
    domaine: "etrangers",
    etapes: [
      { numero: 1, action: "Vérification du délai de résidence", description: "Permis C standard : 10 ans de résidence en CH (5 ans pour États à accord de réciprocité : UE-AELE, USA, Canada). Permis C anticipé : 5 ans si intégration très poussée.", delai: "vérifier anticipation", base_legale: "LEI 34 / OIE 60", preuve_generee: "Décompte temporel" },
      { numero: 2, action: "Preuves d'intégration", description: "Rassembler : niveau langue (A2 oral / A1 écrit standard, B1/A2 pour anticipé), absence aide sociale/dettes, respect sécurité publique, participation vie économique.", delai: "sous 60 jours", base_legale: "LEI 58a / OIE 77a-77f", preuve_generee: "Dossier d'intégration" },
      { numero: 3, action: "Dépôt de la demande", description: "Formulaire au service cantonal migration avec : passeport, permis B actuel, attestations intégration, extraits poursuites/casier, contrat travail.", delai: "quand prêt", cout: "Variable 160-180 CHF", preuve_generee: "Accusé de dépôt" },
      { numero: 4, action: "Décision cantonale et fédérale", description: "Service cantonal décide, SEM approuve. Délai 3-12 mois. Permis C délivré sans durée, contrôle périodique.", delai: "3-12 mois", branches: [ { si: "accord", alors: "fin du processus" }, { si: "refus", alors: "etape 5" } ] },
      { numero: 5, action: "Recours contre refus", description: "Recours cantonal 30 jours puis TAF. Examen du caractère discrétionnaire mais intégration contrôlée.", delai: "30 jours dès décision", base_legale: "LEI 112" }
    ]
  }],

  etranger_visa_schengen_refus: [{
    titre: "Recours contre un refus de visa Schengen",
    domaine: "etrangers",
    etapes: [
      { numero: 1, action: "Analyse du refus notifié", description: "Identifier le motif (A-H selon Code des visas UE) : doc manquants, doute sur volonté retour, ressources insuffisantes, risque immigration illégale.", delai: "immédiat dès notification", base_legale: "Code visa 810/2009 art. 32", preuve_generee: "Analyse du formulaire type" },
      { numero: 2, action: "Constitution du dossier de recours", description: "Rassembler : attestation d'emploi/études, ressources (relevés 3 mois), liens pays origine (famille, propriété), invitation détaillée, historique voyages.", delai: "sous 14 jours", preuve_generee: "Dossier complet de preuves" },
      { numero: 3, action: "Recours écrit au SEM", description: "Recours au SEM dans les 30 jours dès notification. Émoluments 150 CHF (remboursés si succès). Bonne structuration essentielle.", delai: "30 jours dès refus", base_legale: "LEI 6 / PA 50", cout: "150 CHF", preuve_generee: "Recours déposé horodaté" },
      { numero: 4, action: "Recours TAF si échec SEM", description: "Si décision SEM négative : recours TAF dans 30 jours. Émoluments 1'500-3'000 CHF (assistance judiciaire possible).", delai: "30 jours dès décision SEM", base_legale: "LTAF 31 / PA 50" },
      { numero: 5, action: "Nouvelle demande bonifiée", description: "En parallèle ou après échec recours : nouvelle demande avec dossier renforcé (liens pays, preuves financières, lettre hôte officielle).", delai: "à tout moment", cout: "80 CHF émolument visa" }
    ]
  }],

  etranger_aide_urgence: [{
    titre: "Demande d'aide d'urgence pour NEM / personne à l'aide d'urgence",
    domaine: "etrangers",
    etapes: [
      { numero: 1, action: "Vérification des conditions constitutionnelles", description: "Droit fondamental à l'aide d'urgence pour tous en Suisse (logement minimal, nourriture, soins médicaux urgents), même en cas de NEM ou renvoi.", delai: "immédiat", base_legale: "Cst. 12 / LAsi 82", preuve_generee: "Situation documentée" },
      { numero: 2, action: "Saisine du service cantonal compétent", description: "Selon canton : service social, bureau aide d'urgence, centre d'hébergement spécifique. Se présenter en personne avec pièce d'identité et décision NEM/renvoi.", delai: "immédiat dès besoin", base_legale: "LAsi 82 / législation cantonale", preuve_generee: "Attestation d'entrée dans dispositif" },
      { numero: 3, action: "Accompagnement associatif", description: "Contacter immédiatement : OSAR, Caritas, SOS Asile, centres sociaux protestants. Appui pour accès aux prestations et défense des droits.", delai: "dans les 7 jours", cout: "Gratuit" },
      { numero: 4, action: "Recours contre décision défavorable", description: "En cas de refus ou de conditions contraires à la dignité : plainte/recours aux autorités cantonales (30 jours) puis tribunal cantonal.", delai: "30 jours dès décision", base_legale: "Cst. 12 / CEDH 3" },
      { numero: 5, action: "Accès aux soins médicaux", description: "Urgences médicales toujours accessibles (serment hippocratique + droit fondamental). Structures spécialisées : Point d'eau, USMi, permanences sans-papiers.", delai: "à tout moment", cout: "Gratuit en urgence" }
    ]
  }],

  // ============= FAMILLE (7 nouvelles) =============
  famille_divorce_procedure: [{
    titre: "Procédure de divorce (consentement mutuel ou contentieux)",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Choix du type de procédure", description: "Consentement mutuel (requête commune CC 111) ou unilatéral après 2 ans séparation (CC 114) ou rupture du lien conjugal (CC 115).", delai: "préparation", base_legale: "CC 111 / CC 114 / CC 115", preuve_generee: "Analyse de la voie appropriée" },
      { numero: 2, action: "Préparation convention sur effets accessoires", description: "Convention écrite : autorité parentale, garde, relations personnelles, pensions enfants (tables Zurich/Bern), pension époux, liquidation régime, prévoyance 2e pilier.", delai: "sous 60 jours", base_legale: "CC 111 / CC 140 / CC 285 / CC 122", preuve_generee: "Convention signée" },
      { numero: 3, action: "Dépôt requête au tribunal", description: "Dépôt requête commune (si consensus) ou demande (si contentieux) au tribunal civil du canton de domicile. Joindre extrait mariage, convention, situations financières.", delai: "quand prêt", base_legale: "CPC 285 / CPC 290", cout: "Émoluments variables 1'000-5'000 CHF", preuve_generee: "Accusé de dépôt" },
      { numero: 4, action: "Audience(s) au tribunal", description: "Audition des époux (convention ratifiée ou contestée). En contentieux : mesures provisionnelles possibles (CC 276 CPC), échange d'écritures.", delai: "3-12 mois selon canton", branches: [ { si: "convention ratifiée", alors: "etape 5" }, { si: "contestation", alors: "procédure probatoire prolongée" } ] },
      { numero: 5, action: "Jugement et inscription", description: "Jugement de divorce rendu, force de chose jugée après 30 jours (délai d'appel). Transmission d'office à l'office d'état civil.", delai: "30 jours délai appel", base_legale: "CC 119 / CC 122" }
    ]
  }],

  famille_pension_montant: [{
    titre: "Calcul ou révision d'une pension alimentaire",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Collecte des situations financières", description: "Revenus nets des deux parents (salaires, bonus, revenus locatifs), charges (loyer, primes LAMal, impôts), dettes. Budget détaillé obligatoire.", delai: "sous 30 jours", base_legale: "CC 285 / CC 125", preuve_generee: "Budgets annotés" },
      { numero: 2, action: "Calcul selon méthode applicable", description: "Méthode en 2 étapes (nouveau droit depuis 2017) : minimum vital LP + répartition excédent. Pour enfants : table zurichoise/bernoise indicative.", delai: "sous 14 jours", base_legale: "CC 276 / CC 285 / ATF 147 III 265", preuve_generee: "Calcul détaillé écrit" },
      { numero: 3, action: "Proposition écrite et négociation", description: "Proposition chiffrée à l'autre parent (idéalement via médiation familiale ou conseils juridiques respectifs).", delai: "sous 30 jours", cout: "Médiation variable", preuve_generee: "Proposition datée" },
      { numero: 4, action: "Ratification judiciaire ou requête", description: "Si accord : convention ratifiée par le juge (divorce, mesures protectrices). Si contentieux : requête en fixation/modification de pension.", delai: "selon procédure", base_legale: "CC 176 / CC 179 / CC 286", preuve_generee: "Jugement ou convention ratifiée" },
      { numero: 5, action: "Révision si changement notable", description: "En cas de changement significatif (perte emploi, nouvelle naissance, revenus augmentés de +20%) : action en modification de la contribution d'entretien.", delai: "dès changement", base_legale: "CC 286 / CC 129" }
    ]
  }],

  famille_garde_modification: [{
    titre: "Modification de la garde ou de l'autorité parentale",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Évaluation de la situation de l'enfant", description: "Documenter le changement justifiant une modification : nouveau domicile, difficultés scolaires, conflit grave, mise en danger, évolution des besoins de l'enfant.", delai: "immédiat", base_legale: "CC 301a / CC 134", preuve_generee: "Dossier contextualisé" },
      { numero: 2, action: "Tentative de conciliation parentale", description: "Médiation familiale ou discussion structurée entre parents. Un accord écrit signé puis ratifié simplifie grandement la suite.", delai: "sous 60 jours", cout: "Médiation 100-200 CHF/h (souvent subventionnée)", preuve_generee: "PV médiation ou convention" },
      { numero: 3, action: "Saisine autorité (APEA ou tribunal)", description: "Hors divorce : APEA cantonale. En cours/après divorce : tribunal civil. Requête écrite motivée documentant le changement significatif.", delai: "dès échec médiation", base_legale: "CC 134 / CC 314 / CC 275a", preuve_generee: "Requête déposée" },
      { numero: 4, action: "Audition de l'enfant (≥6 ans)", description: "Droit de l'enfant d'être entendu (art. 298 CPC, ATF 131 III 553). L'avis de l'enfant est pris en compte selon son âge et sa maturité.", delai: "pendant instruction", base_legale: "CPC 298 / CC 314a", preuve_generee: "PV d'audition" },
      { numero: 5, action: "Décision et exécution", description: "Décision APEA/tribunal. Appel dans 30 jours. Décision exécutoire incluant modalités pratiques (prise en charge, transport).", delai: "selon procédure", base_legale: "CC 450 / CPC 311" }
    ]
  }],

  famille_violence_conjugale: [{
    titre: "Protection face à la violence conjugale",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Mise en sécurité immédiate", description: "Contacter 117 (police), 143 (aide), 147 (enfants). Centre LAVI cantonal / maison d'accueil. Certificat médical pour toute blessure — essentiel pour la suite.", delai: "immédiat", base_legale: "CP 180 / LAVI 1", preuve_generee: "Rapport police + certificat médical" },
      { numero: 2, action: "Expulsion de l'auteur du logement", description: "Sur plainte ou d'office, la police peut expulser l'auteur pour 10-14 jours (mesures cantonales de protection). Prolongation par le tribunal possible.", delai: "immédiat", base_legale: "lois cantonales protection / CC 28b", preuve_generee: "Décision d'expulsion" },
      { numero: 3, action: "Dépôt de plainte pénale", description: "Plainte formelle pour lésions corporelles (CP 123), menaces (CP 180), contrainte (CP 181), violence conjugale (CP 55a). Certains délits poursuivis d'office.", delai: "dans les 3 mois dès connaissance", base_legale: "CPP 301 / CP 123 / CP 55a", preuve_generee: "PV de plainte" },
      { numero: 4, action: "Mesures civiles de protection", description: "Requête au tribunal civil : interdiction d'approche, interdiction de contact, attribution exclusive du logement. Procédure sommaire rapide.", delai: "urgence", base_legale: "CC 28b", cout: "Frais réduits (aide judiciaire possible)", preuve_generee: "Décision de protection" },
      { numero: 5, action: "Accompagnement LAVI et suivi", description: "Aide immédiate LAVI (psychologique, juridique, financière). Consultation gratuite, indemnisations possibles pour préjudice. Suivi long terme assuré.", delai: "à tout moment", base_legale: "LAVI", cout: "Gratuit" }
    ]
  }],

  famille_mesures_provisionnelles: [{
    titre: "Requête en mesures protectrices / provisionnelles",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Identification du besoin urgent", description: "Situation justifiant urgence : séparation, conflit sur garde, besoin d'attribution logement, pension urgente, protection contre violence.", delai: "immédiat", base_legale: "CC 172 / CC 176 / CPC 261", preuve_generee: "Analyse de l'urgence" },
      { numero: 2, action: "Choix de la procédure", description: "Couple marié non divorcé : mesures protectrices de l'union conjugale (CC 172). En instance de divorce : mesures provisionnelles (CC 276 CPC). Partenariat enregistré : équivalent.", delai: "sous 7 jours", base_legale: "CC 172-176 / CPC 276", preuve_generee: "Choix motivé" },
      { numero: 3, action: "Dépôt requête au tribunal civil", description: "Requête écrite avec conclusions chiffrées (pension, garde, logement), faits, preuves. Procédure sommaire.", delai: "quand prêt", base_legale: "CPC 271-276", cout: "Émoluments modestes (aide judiciaire possible)", preuve_generee: "Accusé de dépôt" },
      { numero: 4, action: "Audience sommaire", description: "Audience de conciliation puis jugement. Décision exécutoire immédiatement (sauf effet suspensif).", delai: "4-8 semaines selon canton", base_legale: "CPC 273", branches: [ { si: "accord trouvé", alors: "convention ratifiée" }, { si: "contestation", alors: "décision au fond" } ] },
      { numero: 5, action: "Appel si nécessaire", description: "Appel dans les 10 jours (procédure sommaire). Effet suspensif à demander expressément. Décision d'appel rapide.", delai: "10 jours", base_legale: "CPC 314" }
    ]
  }],

  famille_reconnaissance_paternite: [{
    titre: "Reconnaissance de paternité (acte volontaire)",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Vérification de la situation", description: "Reconnaissance possible par le père biologique non marié avec la mère, avant ou après la naissance. Mineur dès 16 ans avec consentement représentant légal.", delai: "avant ou après naissance", base_legale: "CC 260 / CC 260a", preuve_generee: "Données personnelles mère + père + enfant" },
      { numero: 2, action: "Déclaration à l'office d'état civil", description: "Se présenter à l'office d'état civil (lieu naissance ou domicile) avec pièces d'identité. Déclaration personnelle du père, inscription immédiate dans les registres.", delai: "à tout moment", base_legale: "CC 260 / OEC 11", cout: "~70 CHF", preuve_generee: "Acte de reconnaissance" },
      { numero: 3, action: "Convention d'autorité parentale conjointe (optionnel)", description: "Parents non mariés : autorité parentale conjointe nécessite déclaration commune à l'APEA ou à l'état civil. Sans déclaration : autorité à la mère.", delai: "à tout moment", base_legale: "CC 298a / OEC 11a", preuve_generee: "Convention signée" },
      { numero: 4, action: "Fixation contribution d'entretien", description: "Obligation d'entretien du père automatique dès reconnaissance. Convention amiable ratifiée par APEA ou jugement si désaccord.", delai: "dès reconnaissance", base_legale: "CC 276 / CC 285 / CC 287", preuve_generee: "Convention ratifiée ou jugement" },
      { numero: 5, action: "Contestation si vices", description: "Reconnaissance peut être contestée par l'enfant, la mère ou le père en cas de vice de consentement (dans les 5 ans, ou 1 an dès connaissance).", delai: "5 ans", base_legale: "CC 260a / CC 260b / CC 260c" }
    ]
  }],

  famille_succession_reserve: [{
    titre: "Protection de la réserve héréditaire",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Identification des héritiers réservataires", description: "Depuis 2023 : descendants (1/2 de leur part), conjoint/partenaire (1/2). Parents ne sont plus réservataires.", delai: "dès ouverture succession", base_legale: "CC 471 / CC 470", preuve_generee: "Dossier d'hoirie" },
      { numero: 2, action: "Demande du certificat d'héritier et inventaire", description: "Certificat d'héritier auprès de la justice de paix/notaire. Inventaire des biens successoraux (comptes, immobilier, dettes) pour établir la masse.", delai: "dans les 6 mois", base_legale: "CC 551 / CC 581", cout: "Émoluments variables", preuve_generee: "Certificat + inventaire" },
      { numero: 3, action: "Analyse des libéralités de son vivant", description: "Relever donations et libéralités (contrat d'assurance-vie, donations immobilières, avantages déguisés) susceptibles d'être rapportées à la masse.", delai: "sous 30 jours", base_legale: "CC 475 / CC 626-633", preuve_generee: "Liste des libéralités" },
      { numero: 4, action: "Action en réduction", description: "Action en réduction contre bénéficiaires et légataires pour récupérer la part réservataire violée. Délai : 1 an dès connaissance de la violation, maximum 10 ans.", delai: "1 an dès connaissance", base_legale: "CC 522 / CC 533", preuve_generee: "Action déposée au tribunal" },
      { numero: 5, action: "Action en rapport entre cohéritiers", description: "Si libéralités avantagent un héritier : action en rapport pour rétablir l'égalité entre héritiers (sauf dispense expresse).", delai: "jusqu'au partage", base_legale: "CC 626 / CC 634" }
    ]
  }]
};

// ============================================================================
// INJECTION DES CASCADES
// ============================================================================

function main() {
  const targetsByFile = {};
  for (const [id, cascades] of Object.entries(CASCADES)) {
    const domain = id.startsWith('bail_') ? 'bail' :
                   id.startsWith('travail_') ? 'travail' :
                   id.startsWith('dettes_') ? 'dettes' :
                   id.startsWith('etranger_') ? 'etrangers' :
                   id.startsWith('famille_') ? 'famille' : null;
    if (!domain) { console.error('Unknown domain for', id); continue; }
    const file = path.join(FICHES_DIR, `${domain}.json`);
    if (!targetsByFile[file]) targetsByFile[file] = [];
    targetsByFile[file].push({ id, cascades });
  }

  let totalAdded = 0;
  const perDomain = {};
  const added = [];
  const skipped = [];
  const notFound = [];

  for (const [file, targets] of Object.entries(targetsByFile)) {
    const fiches = JSON.parse(fs.readFileSync(file, 'utf8'));
    let changed = false;
    for (const t of targets) {
      const fiche = fiches.find(f => f.id === t.id);
      if (!fiche) { notFound.push(t.id); continue; }
      if (Array.isArray(fiche.cascades) && fiche.cascades.length > 0) { skipped.push(t.id); continue; }
      fiche.cascades = t.cascades;
      totalAdded++;
      const d = path.basename(file, '.json');
      perDomain[d] = (perDomain[d] || 0) + 1;
      added.push(t.id);
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(file, JSON.stringify(fiches, null, 2) + '\n', 'utf8');
      console.log('Updated:', file);
    }
  }

  console.log('\n=== BILAN ===');
  console.log('Cascades ajoutées:', totalAdded);
  console.log('Par domaine:', perDomain);
  if (notFound.length) console.log('Fiches introuvables:', notFound);
  if (skipped.length) console.log('Fiches déjà avec cascade (non touchées):', skipped);
  console.log('\nFiches enrichies:');
  added.forEach(a => console.log('  -', a));
}

main();
