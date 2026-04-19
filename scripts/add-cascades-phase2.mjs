#!/usr/bin/env node
/**
 * Phase Cortex 2 — Extension des cascades aux 8 domaines restants
 *
 * Ajoute des cascades structurées sur ≥24 fiches couvrant les 8 domaines
 * qui n'en avaient pas : consommation, voisinage, circulation, assurances,
 * accident, social, violence, entreprise.
 *
 * Pattern : constat → notification → délai → escalade officielle
 * NE TOUCHE PAS aux 47 cascades existantes (hash lock).
 */

import fs from 'node:fs';
import path from 'node:path';

const FICHES_DIR = 'src/data/fiches';

const CASCADES = {

  // ============= CONSOMMATION (3 nouvelles) =============
  consommation_defaut_produit_garantie: [{
    titre: "Mise en œuvre de la garantie pour défaut",
    domaine: "consommation",
    etapes: [
      { numero: 1, action: "Constat du défaut et preuve d'achat", description: "Photographier le défaut, conserver l'emballage d'origine et retrouver la facture ou ticket de caisse.", delai: "immédiat dès découverte", preuve_generee: "Photos datées + facture" },
      { numero: 2, action: "Avis des défauts au vendeur", description: "Lettre recommandée au vendeur détaillant le défaut et indiquant l'option choisie (réparation, remplacement, réduction de prix ou résolution).", delai: "immédiatement après découverte", base_legale: "CO 201 / CO 205", preuve_generee: "Accusé de réception postal" },
      { numero: 3, action: "Délai de réponse du vendeur", description: "Le vendeur doit prendre position sur la garantie (réparation, remplacement ou refus motivé).", delai: "14 à 30 jours", branches: [ { si: "réparation ou remplacement accepté", alors: "fin du processus" }, { si: "refus ou silence", alors: "etape 4" } ] },
      { numero: 4, action: "Saisine du juge civil ou conciliateur", description: "Requête en conciliation puis action au tribunal pour exiger l'exécution de la garantie (prescription 2 ans dès livraison).", delai: "avant prescription (2 ans)", base_legale: "CO 210 / CPC 197", cout: "conciliation gratuite" }
    ]
  }],

  consommation_annulation_commande_en_ligne: [{
    titre: "Annulation d'une commande en ligne",
    domaine: "consommation",
    etapes: [
      { numero: 1, action: "Vérification du droit d'annulation", description: "Relire les CGV du site : en Suisse, pas de droit de rétractation légal général, sauf démarchage à domicile ou par téléphone (CO 40a).", delai: "immédiat", preuve_generee: "Capture d'écran des CGV + confirmation de commande" },
      { numero: 2, action: "Notification écrite d'annulation", description: "E-mail ou courrier recommandé au vendeur demandant l'annulation et le remboursement (préciser motifs et délai si applicable).", delai: "dans les 14 jours si démarchage (CO 40e), sinon selon CGV", base_legale: "CO 40a ss", preuve_generee: "Preuve d'envoi + accusé de lecture" },
      { numero: 3, action: "Attente de la réponse du vendeur", description: "Le vendeur doit confirmer l'annulation et rembourser selon les CGV ou la loi.", delai: "14 à 30 jours", branches: [ { si: "remboursement reçu", alors: "fin du processus" }, { si: "refus ou silence", alors: "etape 4" } ] },
      { numero: 4, action: "Signalement et action civile", description: "Signalement à la Fédération romande des consommateurs (FRC) et/ou SECO, puis requête de conciliation devant l'autorité cantonale.", delai: "dans les meilleurs délais", base_legale: "CPC 197 / LCD 2", cout: "signalement gratuit" }
    ]
  }],

  consommation_livraison_retard: [{
    titre: "Livraison en retard — mise en demeure",
    domaine: "consommation",
    etapes: [
      { numero: 1, action: "Constat du retard", description: "Vérifier la date de livraison convenue (CGV, bon de commande, e-mail de confirmation) et documenter l'absence de livraison.", delai: "immédiat", preuve_generee: "Confirmation de commande + absence de livraison" },
      { numero: 2, action: "Mise en demeure écrite", description: "Lettre recommandée au vendeur fixant un dernier délai raisonnable pour livrer (sommation de s'exécuter).", delai: "dès le retard constaté", base_legale: "CO 102 / CO 107", preuve_generee: "Accusé de réception postal" },
      { numero: 3, action: "Délai supplémentaire accordé", description: "Attendre l'expiration du délai accordé dans la mise en demeure.", delai: "7 à 30 jours selon nature du bien", branches: [ { si: "livraison effectuée", alors: "fin du processus" }, { si: "nouveau défaut de livraison", alors: "etape 4" } ] },
      { numero: 4, action: "Résolution du contrat et remboursement", description: "Déclaration écrite de résolution du contrat (CO 107 al. 2), exigence du remboursement intégral et éventuels dommages-intérêts.", delai: "immédiat après échec du délai", base_legale: "CO 107 / CO 109", cout: "gratuit" }
    ]
  }],

  // ============= VOISINAGE (3 nouvelles) =============
  voisinage_bruit_nuisances: [{
    titre: "Gestion des nuisances sonores du voisinage",
    domaine: "voisinage",
    etapes: [
      { numero: 1, action: "Documentation des nuisances", description: "Journal daté (heure, durée, type de bruit), enregistrements audio horodatés, témoignages d'autres voisins.", delai: "immédiat et continu", preuve_generee: "Journal + témoignages" },
      { numero: 2, action: "Contact direct puis notification écrite", description: "D'abord tentative de dialogue amiable. Si échec, lettre recommandée au voisin (et bailleur si locataire) exigeant la cessation des nuisances.", delai: "dans les 14 jours", base_legale: "CC 684 (immissions excessives)", preuve_generee: "Accusé de réception postal" },
      { numero: 3, action: "Délai d'observation", description: "Laisser au voisin le temps de modifier son comportement et continuer à documenter.", delai: "14 à 30 jours", branches: [ { si: "nuisances cessent", alors: "fin du processus" }, { si: "persistance", alors: "etape 4" } ] },
      { numero: 4, action: "Plainte police et/ou action civile", description: "Plainte à la police pour tapage (règlements cantonaux) ET/OU action en cessation de l'immission devant le juge civil.", delai: "à tout moment après constat répété", base_legale: "CC 679 / CC 684", cout: "plainte police gratuite" }
    ]
  }],

  voisinage_arbres_limites: [{
    titre: "Arbres en limite de propriété",
    domaine: "voisinage",
    etapes: [
      { numero: 1, action: "Mesure des distances et dommages", description: "Mesurer la distance de l'arbre par rapport à la limite, photographier les branches ou racines qui empiètent, documenter les dommages.", delai: "immédiat", preuve_generee: "Photos + relevé cadastral" },
      { numero: 2, action: "Notification écrite au voisin", description: "Courrier recommandé demandant l'élagage ou l'enlèvement selon les distances cantonales et le droit cantonal de voisinage.", delai: "dans les 30 jours", base_legale: "CC 687 / droit cantonal (ex. LaCC)", preuve_generee: "Accusé de réception postal" },
      { numero: 3, action: "Délai d'exécution du voisin", description: "Délai raisonnable pour couper, élaguer ou replanter conformément aux distances légales.", delai: "30 à 90 jours selon saison", branches: [ { si: "travaux effectués", alors: "fin du processus" }, { si: "refus ou silence", alors: "etape 4" } ] },
      { numero: 4, action: "Droit d'élagage propre ou action judiciaire", description: "Droit de couper soi-même branches/racines empiétantes (CC 687) OU action judiciaire devant le juge civil pour exiger le respect des distances.", delai: "immédiat après échec du délai", base_legale: "CC 687 / CC 688", cout: "action civile : selon tarif cantonal" }
    ]
  }],

  voisinage_fumee_odeurs: [{
    titre: "Fumées et odeurs excessives du voisinage",
    domaine: "voisinage",
    etapes: [
      { numero: 1, action: "Constat et documentation", description: "Dater les épisodes (heure, vent, intensité), photographier/filmer, tenir un journal et recueillir témoignages.", delai: "immédiat et répété", preuve_generee: "Journal daté + photos/vidéos" },
      { numero: 2, action: "Notification écrite au voisin", description: "Lettre recommandée exigeant la cessation des immissions excessives (fumée barbecue, cheminée, odeurs agricoles, etc.).", delai: "dans les 14 jours", base_legale: "CC 684 (immissions excessives)", preuve_generee: "Accusé de réception postal" },
      { numero: 3, action: "Délai d'amélioration", description: "Laisser au voisin un délai raisonnable pour modifier ses installations ou pratiques.", delai: "30 jours", branches: [ { si: "immissions réduites à niveau tolérable", alors: "fin du processus" }, { si: "persistance", alors: "etape 4" } ] },
      { numero: 4, action: "Signalement autorité communale ou action civile", description: "Signalement à la police/police des constructions de la commune (règlements OPB / OPair) ou action en cessation devant juge civil.", delai: "immédiat après échec du délai", base_legale: "CC 679 / CC 684 / OPair / OPB", cout: "signalement communal gratuit" }
    ]
  }],

  // ============= CIRCULATION (3 nouvelles) =============
  circulation_amende_ordre: [{
    titre: "Contestation d'une amende d'ordre",
    domaine: "circulation",
    etapes: [
      { numero: 1, action: "Vérification du bordereau", description: "Contrôler les détails de l'amende (lieu, date, infraction, identification du véhicule), conserver l'avis reçu.", delai: "immédiat dès réception", preuve_generee: "Avis d'amende + photos/preuves éventuelles" },
      { numero: 2, action: "Refus de paiement et opposition", description: "Ne pas payer dans le délai de 30 jours si contestation : faute de paiement, la cause est transmise à la procédure pénale ordinaire.", delai: "délai de paiement 30 jours", base_legale: "LAO 6 / LAO 10", preuve_generee: "Preuve de non-paiement volontaire et motivé" },
      { numero: 3, action: "Procédure pénale ordinaire déclenchée", description: "Réception d'une ordonnance pénale ou d'un mandat de répression : vérifier les charges et le montant éventuel majoré.", delai: "sous 30 jours dès réception", branches: [ { si: "décision acceptée", alors: "paiement ou amende définitive" }, { si: "contestation maintenue", alors: "etape 4" } ] },
      { numero: 4, action: "Opposition à l'ordonnance pénale", description: "Opposition écrite dans les 10 jours au ministère public, motifs détaillés, éventuellement avec preuves (photos, témoins).", delai: "10 jours dès notification de l'ordonnance", base_legale: "CPP 354", cout: "gratuit (risque de frais si échec)" }
    ]
  }],

  circulation_accident_responsabilite_civile: [{
    titre: "Responsabilité civile après accident de circulation",
    domaine: "circulation",
    etapes: [
      { numero: 1, action: "Sécurisation et constat", description: "Sécuriser les lieux, appeler police si blessés ou désaccord, remplir le constat amiable européen avec toutes les coordonnées et le croquis.", delai: "immédiat sur les lieux", base_legale: "LCR 51", preuve_generee: "Constat amiable + photos + coordonnées témoins" },
      { numero: 2, action: "Annonce à l'assurance RC du détenteur responsable", description: "Déclaration écrite à l'assurance RC (la sienne ou celle de l'autre conducteur) avec constat, photos et éventuels témoignages.", delai: "dans les meilleurs délais (généralement 14 jours)", base_legale: "LCR 58 / LCR 65", preuve_generee: "Accusé de réception assureur" },
      { numero: 3, action: "Expertise et proposition d'indemnisation", description: "L'assureur mandate un expert pour évaluer les dégâts, puis propose une indemnisation (frais de réparation, perte d'usage, dommages corporels).", delai: "30 à 90 jours", branches: [ { si: "proposition acceptée", alors: "fin du processus après paiement" }, { si: "désaccord", alors: "etape 4" } ] },
      { numero: 4, action: "Contestation : contre-expertise ou action civile", description: "Demande de contre-expertise puis, si échec, action civile devant le tribunal (prescription 3 ans dès connaissance du dommage).", delai: "avant prescription (3 ans)", base_legale: "LCR 83 / CO 60", cout: "tarif cantonal" }
    ]
  }],

  circulation_retrait_permis_exces_vitesse: [{
    titre: "Contestation d'un retrait de permis pour excès de vitesse",
    domaine: "circulation",
    etapes: [
      { numero: 1, action: "Vérification de la mesure et du relevé", description: "Demander copie du rapport de police et du protocole de mesure (radar, homologation, marge de tolérance). Vérifier identité du conducteur.", delai: "immédiat dès réception de la décision", preuve_generee: "Dossier de mesure + rapport police" },
      { numero: 2, action: "Droit d'être entendu avant décision finale", description: "Exercer le droit d'être entendu auprès du Service des automobiles (SAN) : lettre motivée avec preuves (usage professionnel du permis, besoins familiaux, premier retrait, etc.).", delai: "selon notification (typiquement 10-20 jours)", base_legale: "LCR 16 / LCR 17 / Cst 29", preuve_generee: "Lettre motivée + pièces justificatives" },
      { numero: 3, action: "Décision finale de retrait", description: "Réception de la décision finale du SAN (durée du retrait, date d'effet).", delai: "variable selon canton", branches: [ { si: "retrait accepté", alors: "exécution du retrait" }, { si: "contestation", alors: "etape 4" } ] },
      { numero: 4, action: "Recours au tribunal administratif cantonal", description: "Recours écrit motivé dans les 30 jours devant le tribunal administratif cantonal, puis éventuellement recours en matière de droit public au TF.", delai: "30 jours dès notification", base_legale: "LCR 24 / LTF 82", cout: "avance de frais selon tarif cantonal" }
    ]
  }],

  // ============= ASSURANCES (3 nouvelles) =============
  assurance_ai_opposition: [{
    titre: "Opposition à une décision AI",
    domaine: "assurances",
    etapes: [
      { numero: 1, action: "Analyse de la décision et des pièces", description: "Lire la décision AI, les rapports médicaux et les expertises. Identifier les points contestables (degré d'invalidité, capacité de gain, expertise insuffisante).", delai: "immédiat dès réception", preuve_generee: "Dossier complet AI + rapports médicaux" },
      { numero: 2, action: "Dépôt de l'opposition écrite", description: "Opposition écrite et motivée à l'office AI cantonal, accompagnée des pièces nouvelles (rapports médicaux supplémentaires, attestations).", delai: "30 jours dès notification de la décision", base_legale: "LPGA 52 / LAI 69", preuve_generee: "Opposition recommandée + accusé de réception" },
      { numero: 3, action: "Instruction et décision sur opposition", description: "L'office AI instruit (éventuelle nouvelle expertise) et rend une décision sur opposition.", delai: "généralement 3 à 12 mois", branches: [ { si: "décision favorable", alors: "fin du processus" }, { si: "maintien ou rejet", alors: "etape 4" } ] },
      { numero: 4, action: "Recours au tribunal cantonal des assurances", description: "Recours écrit motivé devant le tribunal cantonal des assurances dans les 30 jours, puis TF si nécessaire.", delai: "30 jours dès décision sur opposition", base_legale: "LPGA 56 / LTF 82", cout: "procédure gratuite en 1re instance (LPGA 61)" }
    ]
  }],

  assurance_chomage_inscription: [{
    titre: "Inscription au chômage et demande d'indemnités",
    domaine: "assurances",
    etapes: [
      { numero: 1, action: "Inscription à l'ORP et annonce à la caisse", description: "S'inscrire à l'Office régional de placement (ORP) dès le 1er jour de chômage et s'annoncer auprès d'une caisse de chômage (publique ou syndicale).", delai: "dès le 1er jour (inscription conseillée avant fin du contrat)", base_legale: "LACI 8 / LACI 10", preuve_generee: "Confirmation d'inscription ORP + formulaire d'annonce caisse" },
      { numero: 2, action: "Remise des documents à la caisse", description: "Transmettre contrat de travail, lettre de résiliation, attestations de l'employeur, preuves de recherches d'emploi, pièces d'identité.", delai: "dans les 3 mois suivant le 1er jour de contrôle", base_legale: "LACI 20", preuve_generee: "Dossier complet avec accusé de réception" },
      { numero: 3, action: "Décision de la caisse sur le droit aux indemnités", description: "La caisse vérifie la période de cotisation (12 mois sur 2 ans), l'aptitude au placement, et rend une décision.", delai: "variable (généralement 1 à 3 mois)", branches: [ { si: "droit accepté", alors: "versement des indemnités" }, { si: "rejet ou réduction", alors: "etape 4" } ] },
      { numero: 4, action: "Opposition puis recours", description: "Opposition écrite motivée dans les 30 jours à la caisse, puis recours au tribunal cantonal des assurances si rejet.", delai: "30 jours dès décision", base_legale: "LPGA 52 / LPGA 56", cout: "gratuit en 1re instance" }
    ]
  }],

  assurance_lamal_subsides_refus: [{
    titre: "Refus de subside LAMal — contestation",
    domaine: "assurances",
    etapes: [
      { numero: 1, action: "Analyse de la décision et du calcul", description: "Vérifier le calcul du revenu déterminant (RDU / revenu fiscal), les membres du ménage pris en compte, le barème cantonal applicable.", delai: "immédiat dès réception", preuve_generee: "Décision + taxation fiscale + pièces de ménage" },
      { numero: 2, action: "Demande de reconsidération ou opposition", description: "Lettre motivée à l'autorité cantonale (Service des subsides / caisse cantonale) avec pièces justificatives (changement de situation, erreur de calcul).", delai: "30 jours dès notification (délai d'opposition cantonal)", base_legale: "LAMal 65 / LPGA 52 / lois cantonales", preuve_generee: "Opposition recommandée + accusé de réception" },
      { numero: 3, action: "Décision sur opposition", description: "L'autorité cantonale réexamine et rend une nouvelle décision motivée.", delai: "variable (30 à 90 jours)", branches: [ { si: "subside accordé", alors: "fin du processus" }, { si: "maintien du refus", alors: "etape 4" } ] },
      { numero: 4, action: "Recours au tribunal cantonal des assurances", description: "Recours écrit motivé dans les 30 jours, gratuit en 1re instance.", delai: "30 jours dès décision sur opposition", base_legale: "LPGA 56 / LAMal 91", cout: "gratuit en 1re instance" }
    ]
  }],

  // ============= ACCIDENT (3 nouvelles) =============
  accident_circulation_roles_assurances: [{
    titre: "Clarification des rôles des assurances après accident",
    domaine: "accident",
    etapes: [
      { numero: 1, action: "Identification des assurances concernées", description: "Lister les assurances en jeu : RC auto du responsable, casco propre, LAA (si accident du travail / trajet), LAMal (si aucune autre), AI (cas graves).", delai: "immédiat après accident", preuve_generee: "Tableau récapitulatif assurances + police RC du responsable" },
      { numero: 2, action: "Déclaration à chaque assureur concerné", description: "Déclarations parallèles : RC au assureur responsable, LAA via employeur si trajet, casco propre pour réparations immédiates.", delai: "dans les 14 jours selon polices", base_legale: "LCA 38 / LAA 45 / LCR 65", preuve_generee: "Accusés de réception de chaque assureur" },
      { numero: 3, action: "Coordination et avances", description: "Vérifier les avances (p. ex. LAA avance pour frais médicaux) et les recours entre assureurs (subrogation).", delai: "30 à 90 jours", branches: [ { si: "prise en charge coordonnée OK", alors: "indemnisation complète" }, { si: "conflit entre assureurs ou refus", alors: "etape 4" } ] },
      { numero: 4, action: "Saisine du tribunal ou intervention d'un juriste", description: "Si un assureur refuse sa part, action devant le tribunal des assurances (LAA/AI) ou civil (RC). Prescription 3 ans (RC) / LPGA.", delai: "avant prescription", base_legale: "LPGA 56 / CO 60 / LCR 83", cout: "gratuit assurances sociales / tarif cantonal RC" }
    ]
  }],

  accident_travail_prestations_laa: [{
    titre: "Prestations LAA après accident du travail",
    domaine: "accident",
    etapes: [
      { numero: 1, action: "Déclaration à l'employeur", description: "Informer immédiatement l'employeur de l'accident (date, lieu, circonstances, blessures) pour qu'il remplisse la déclaration à la SUVA/assureur LAA.", delai: "immédiat", base_legale: "LAA 45 / OLAA 53", preuve_generee: "Déclaration d'accident signée par employeur" },
      { numero: 2, action: "Prise en charge médicale et certificats", description: "Consultation médicale, conservation de tous les certificats d'incapacité de travail et factures médicales.", delai: "dès que possible", base_legale: "LAA 10 / LAA 16", preuve_generee: "Certificats médicaux + factures" },
      { numero: 3, action: "Décision de l'assureur LAA", description: "L'assureur évalue causalité, incapacité, indemnités journalières (80% du salaire dès le 3e jour), rente invalidité éventuelle.", delai: "30 à 180 jours", branches: [ { si: "prestations accordées", alors: "versement régulier" }, { si: "refus ou réduction", alors: "etape 4" } ] },
      { numero: 4, action: "Opposition puis recours", description: "Opposition dans les 30 jours à l'assureur LAA, puis recours au tribunal cantonal des assurances si rejet.", delai: "30 jours dès décision", base_legale: "LPGA 52 / LPGA 56", cout: "gratuit en 1re instance" }
    ]
  }],

  accident_constat_amiable: [{
    titre: "Remplissage du constat amiable après accident",
    domaine: "accident",
    etapes: [
      { numero: 1, action: "Sécuriser les lieux et témoins", description: "Couper moteurs, sortir triangle et gilet, relever coordonnées des témoins, appeler police si blessés ou désaccord.", delai: "immédiat", preuve_generee: "Coordonnées témoins + photos des lieux" },
      { numero: 2, action: "Remplissage commun du constat", description: "Remplir constat amiable européen à deux : identités, assurances, croquis, circonstances cochées, signatures des deux conducteurs.", delai: "sur place", base_legale: "LCR 51 / LCR 92", preuve_generee: "Constat amiable signé + photos dégâts" },
      { numero: 3, action: "Transmission aux assureurs", description: "Envoyer le constat à son propre assureur RC/casco dans les 14 jours (selon police) avec photos et rapport personnel.", delai: "dans les 14 jours", base_legale: "LCA 38", branches: [ { si: "accord entre assureurs", alors: "indemnisation selon responsabilités établies" }, { si: "contestation", alors: "etape 4" } ] },
      { numero: 4, action: "Complément avec police ou expertise", description: "Si désaccord ou constat contesté, demander rapport de police, expertise indépendante, puis éventuelle action civile.", delai: "avant prescription (3 ans RC)", base_legale: "LCR 58 / CO 60", cout: "expertise : selon mandat" }
    ]
  }],

  // ============= SOCIAL (3 nouvelles) =============
  social_refus_aide_recours: [{
    titre: "Recours contre un refus d'aide sociale",
    domaine: "social",
    etapes: [
      { numero: 1, action: "Analyse de la décision et du barème", description: "Lire la décision motivée du Service social, vérifier le calcul du budget (forfait CSIAS, loyer maximal cantonal, charges reconnues).", delai: "immédiat dès réception", preuve_generee: "Décision + budget détaillé + barème cantonal" },
      { numero: 2, action: "Opposition ou recours interne", description: "Selon le canton, opposition au Service social ou recours hiérarchique (lettre motivée + pièces justificatives).", delai: "30 jours dès notification (variable selon canton)", base_legale: "lois cantonales d'aide sociale + LPGA par analogie", preuve_generee: "Recours recommandé + accusé de réception" },
      { numero: 3, action: "Décision sur opposition / recours interne", description: "Autorité supérieure cantonale réexamine et rend une nouvelle décision motivée.", delai: "variable (30 à 120 jours)", branches: [ { si: "aide accordée", alors: "fin du processus" }, { si: "maintien du refus", alors: "etape 4" } ] },
      { numero: 4, action: "Recours au tribunal cantonal administratif", description: "Recours écrit motivé devant le tribunal administratif cantonal dans les 30 jours. Demande d'assistance judiciaire possible.", delai: "30 jours dès décision sur opposition", base_legale: "Cst 12 / Cst 29 / lois cantonales", cout: "assistance judiciaire gratuite si conditions remplies" }
    ]
  }],

  social_hebergement_urgence_procedure: [{
    titre: "Hébergement d'urgence — procédure d'accès",
    domaine: "social",
    etapes: [
      { numero: 1, action: "Évaluation de la situation", description: "Documenter la situation (sans-abri, expulsion imminente, violence domestique, rupture familiale) et identifier le service social communal/cantonal compétent.", delai: "immédiat", preuve_generee: "Note de situation + pièces d'identité" },
      { numero: 2, action: "Demande écrite ou orale d'hébergement", description: "S'adresser au service social (Hospice général GE, EVAM/CSR VD, Sozialhilfe BE/ZH, Caritas ou Armée du Salut) avec pièce d'identité et bref exposé.", delai: "immédiat (urgence)", base_legale: "Cst 12 (droit à l'aide d'urgence)", preuve_generee: "Accusé de dépôt de la demande" },
      { numero: 3, action: "Décision et placement", description: "Le service évalue l'urgence et propose un placement (foyer, hôtel social, abri PC).", delai: "24 à 72 heures", branches: [ { si: "placement proposé", alors: "entrée au foyer" }, { si: "refus ou absence de place", alors: "etape 4" } ] },
      { numero: 4, action: "Recours et urgence absolue", description: "Recours pour violation du droit à l'aide d'urgence (Cst 12) ou saisine d'une association (Caritas, CSP) pour solution immédiate.", delai: "immédiat", base_legale: "Cst 12 / lois cantonales", cout: "recours gratuit" }
    ]
  }],

  social_sanction_reduction: [{
    titre: "Contestation d'une sanction / réduction de prestations",
    domaine: "social",
    etapes: [
      { numero: 1, action: "Analyse des motifs de sanction", description: "Lire la décision de sanction (non-respect d'une obligation : recherche d'emploi, rendez-vous manqué, dissimulation), vérifier les motifs et proportionnalité.", delai: "immédiat dès réception", preuve_generee: "Décision + historique des échanges avec le service" },
      { numero: 2, action: "Droit d'être entendu et opposition", description: "Exercer le droit d'être entendu, puis déposer une opposition écrite motivée au Service social (expliquer le contexte, fournir preuves : certificats médicaux, justificatifs).", delai: "droit d'être entendu immédiat ; opposition 30 jours", base_legale: "Cst 29 / lois cantonales d'aide sociale", preuve_generee: "Opposition recommandée + pièces" },
      { numero: 3, action: "Décision sur opposition", description: "Le Service social réexamine la sanction (levée totale, partielle ou maintien).", delai: "30 à 90 jours", branches: [ { si: "sanction levée ou réduite", alors: "fin du processus" }, { si: "maintien", alors: "etape 4" } ] },
      { numero: 4, action: "Recours au tribunal administratif cantonal", description: "Recours écrit motivé dans les 30 jours, avec demande d'effet suspensif pour éviter la réduction pendant la procédure.", delai: "30 jours dès décision sur opposition", base_legale: "Cst 12 / Cst 29 / lois cantonales", cout: "assistance judiciaire possible" }
    ]
  }],

  // ============= VIOLENCE (3 nouvelles) =============
  violence_ordonnance_protection: [{
    titre: "Obtention d'une ordonnance de protection",
    domaine: "violence",
    etapes: [
      { numero: 1, action: "Documentation des violences", description: "Rassembler preuves : certificats médicaux, messages/SMS, photos de blessures, témoignages, rapports de police antérieurs.", delai: "immédiat", preuve_generee: "Dossier de preuves daté" },
      { numero: 2, action: "Requête au juge civil (mesures de protection)", description: "Requête écrite au tribunal civil pour mesures protectrices (interdiction d'approche, d'entrer au domicile, de contacter) — art. 28b CC.", delai: "sans délai (urgence possible)", base_legale: "CC 28b / CPC 261-269", preuve_generee: "Requête déposée + accusé de réception tribunal" },
      { numero: 3, action: "Décision provisionnelle et audience", description: "Le juge peut prononcer des mesures superprovisionnelles (immédiates) puis confirmer en procédure provisionnelle après audition des parties.", delai: "quelques heures à 10 jours (super-provisionnel) / 30 à 60 jours (provisionnel)", branches: [ { si: "ordonnance accordée", alors: "exécution des mesures" }, { si: "rejet ou insuffisance", alors: "etape 4" } ] },
      { numero: 4, action: "Recours ou procédure pénale parallèle", description: "Appel au tribunal cantonal ET/OU dépôt de plainte pénale (violence conjugale poursuivie d'office dès juillet 2020).", delai: "10 jours (appel) / sans délai (plainte)", base_legale: "CC 28b / CP 123 / CP 126", cout: "assistance judiciaire possible + LAVI" }
    ]
  }],

  violence_plainte_conjugale: [{
    titre: "Dépôt d'une plainte pour violence conjugale",
    domaine: "violence",
    etapes: [
      { numero: 1, action: "Mise en sécurité et certificat médical", description: "Se mettre en sécurité (foyer, proche), consulter un médecin pour certificat médical détaillé des blessures, conserver SMS/photos.", delai: "immédiat", preuve_generee: "Certificat médical + preuves numériques" },
      { numero: 2, action: "Dépôt de plainte à la police", description: "Plainte au poste de police : audition, procès-verbal, photos des blessures par la police. Depuis 2020, les violences conjugales sont poursuivies d'office.", delai: "sans délai (prescription variable selon infraction)", base_legale: "CP 55a / CP 123 / CP 126 / CPP 301", preuve_generee: "Procès-verbal de plainte" },
      { numero: 3, action: "Instruction par le ministère public", description: "Le ministère public ouvre une instruction (auditions, expertise médicale, éventuelle détention provisoire ou éloignement). Possibilité d'expulsion du domicile (CP 28b par police).", delai: "variable (3 à 12 mois)", branches: [ { si: "ordonnance pénale ou renvoi en jugement", alors: "procédure judiciaire" }, { si: "classement", alors: "etape 4" } ] },
      { numero: 4, action: "Recours contre classement et LAVI", description: "Recours contre le classement devant l'instance de recours pénale dans les 10 jours. Dépôt de demande LAVI en parallèle pour aide et indemnisation.", delai: "10 jours (recours) / 5 ans (LAVI)", base_legale: "CPP 322 / LAVI", cout: "LAVI : aide gratuite" }
    ]
  }],

  violence_lavi_indemnisation: [{
    titre: "Demande d'indemnisation LAVI",
    domaine: "violence",
    etapes: [
      { numero: 1, action: "Contact avec un centre de consultation LAVI", description: "Prendre rendez-vous avec un centre LAVI cantonal (consultation gratuite et confidentielle) pour analyse de la situation et aide immédiate.", delai: "sans délai (idéalement rapidement)", base_legale: "LAVI 9 / LAVI 13", preuve_generee: "Attestation de consultation LAVI" },
      { numero: 2, action: "Dépôt de la demande d'indemnisation", description: "Formulaire écrit à l'autorité cantonale LAVI avec pièces : plainte/jugement pénal, certificats médicaux, factures, justificatifs de dommages.", delai: "5 ans dès commission de l'infraction", base_legale: "LAVI 25 / LAVI 26", preuve_generee: "Dossier LAVI déposé + accusé de réception" },
      { numero: 3, action: "Instruction et décision de l'autorité LAVI", description: "L'autorité cantonale instruit la demande (éventuelle audition, complément de pièces) puis rend une décision (indemnité jusqu'à 120'000 CHF, réparation morale jusqu'à 70'000 CHF).", delai: "6 à 18 mois", branches: [ { si: "indemnisation accordée", alors: "versement" }, { si: "refus ou montant insuffisant", alors: "etape 4" } ] },
      { numero: 4, action: "Recours au tribunal cantonal", description: "Recours écrit motivé au tribunal cantonal administratif dans les 30 jours (procédure gratuite).", delai: "30 jours dès notification", base_legale: "LAVI 29 / LPGA 56 par analogie", cout: "gratuit" }
    ]
  }],

  // ============= ENTREPRISE (3 nouvelles) =============
  entreprise_faillite_personnelle: [{
    titre: "Faillite personnelle (indépendant) — démarches",
    domaine: "entreprise",
    etapes: [
      { numero: 1, action: "Bilan de situation et inventaire", description: "Établir bilan complet : actifs (biens, créances), passifs (dettes, poursuites en cours), revenus, charges. Consulter un conseiller dettes (Caritas, CSP).", delai: "immédiat", preuve_generee: "Bilan détaillé + état des poursuites" },
      { numero: 2, action: "Tentative d'accord amiable ou sursis", description: "Avant faillite, proposer un concordat amiable aux créanciers OU demander un sursis concordataire au tribunal.", delai: "avant poursuites en voie de faillite", base_legale: "LP 293 ss", preuve_generee: "Propositions écrites aux créanciers + réponses" },
      { numero: 3, action: "Déclaration d'insolvabilité ou faillite sur requête", description: "Indépendant peut déclarer son insolvabilité au tribunal (LP 191) OU subir la faillite sur requête d'un créancier poursuivant.", delai: "dès insolvabilité manifeste", base_legale: "LP 190 / LP 191", branches: [ { si: "concordat homologué", alors: "plan de remboursement" }, { si: "faillite prononcée", alors: "etape 4" } ] },
      { numero: 4, action: "Procédure de faillite par l'office", description: "L'office des faillites inventorie les biens, réalise les actifs, distribue aux créanciers. Actes de défaut de biens pour le solde. Réhabilitation possible après.", delai: "6 à 24 mois", base_legale: "LP 197 ss / LP 265 / LP 265a", cout: "frais de faillite prélevés sur l'actif" }
    ]
  }],

  entreprise_commandement_payer_societe: [{
    titre: "Commandement de payer reçu par une société",
    domaine: "entreprise",
    etapes: [
      { numero: 1, action: "Analyse du commandement et de la créance", description: "Vérifier identité du créancier, montant, cause, échéances, éventuelles prescriptions. Consulter le dossier comptable de la société.", delai: "immédiat dès notification", preuve_generee: "Copie du commandement + dossier créance" },
      { numero: 2, action: "Faire opposition dans les 10 jours", description: "Déclaration d'opposition (totale ou partielle) à l'office des poursuites OU directement sur le commandement. L'opposition suspend la poursuite.", delai: "10 jours dès notification", base_legale: "LP 74 / LP 75", preuve_generee: "Formulaire d'opposition déposé + timbre office" },
      { numero: 3, action: "Réaction du créancier : mainlevée ou action civile", description: "Le créancier doit agir pour lever l'opposition : requête de mainlevée (provisoire/définitive) si titre, ou action civile au fond si contestation.", delai: "variable (pas de délai impératif, mais prescription)", branches: [ { si: "pas d'action du créancier", alors: "poursuite prescrite après 1 an" }, { si: "mainlevée ou action", alors: "etape 4" } ] },
      { numero: 4, action: "Défense en mainlevée ou procès au fond", description: "Audience de mainlevée (15-30 jours) ou procès civil. Conseil : mandater un juriste/avocat pour personnes morales (société = représentation obligatoire en certains cas).", delai: "selon convocation", base_legale: "LP 80-82 / LP 83 / CPC", cout: "frais de justice selon tarif" }
    ]
  }],

  entreprise_creances_impayees_recouvrement: [{
    titre: "Recouvrement de créances impayées",
    domaine: "entreprise",
    etapes: [
      { numero: 1, action: "Rappel et mise en demeure", description: "Envoyer un 1er rappel amiable, puis une mise en demeure formelle par recommandé (fixant un dernier délai de 10-14 jours).", delai: "dès l'échéance + 10 jours", base_legale: "CO 102", preuve_generee: "Rappels datés + mise en demeure recommandée" },
      { numero: 2, action: "Réquisition de poursuite à l'office", description: "Si aucun paiement, déposer une réquisition de poursuite à l'office des poursuites du domicile/siège du débiteur.", delai: "dès expiration de la mise en demeure", base_legale: "LP 67 / LP 68", preuve_generee: "Accusé de réception de l'office" },
      { numero: 3, action: "Commandement de payer et opposition éventuelle", description: "L'office notifie le commandement. Le débiteur a 10 jours pour faire opposition. Si pas d'opposition, continuation possible.", delai: "10 jours pour opposition", branches: [ { si: "pas d'opposition", alors: "requête de continuation de la poursuite" }, { si: "opposition", alors: "etape 4" } ] },
      { numero: 4, action: "Mainlevée (provisoire/définitive) ou action au fond", description: "Si titre authentique / reconnaissance écrite : mainlevée provisoire. Si jugement : mainlevée définitive. Sinon, action civile au fond.", delai: "audience de mainlevée dans 15-30 jours", base_legale: "LP 80-82 / LP 83 / CPC 250", cout: "frais de justice selon tarif cantonal" }
    ]
  }]
};

// ============================================================================
// APPLICATION
// ============================================================================

function applyCascades() {
  const byDomain = {};

  for (const [id, cascades] of Object.entries(CASCADES)) {
    // Identifier domaine : accident_* → accident, assurance_* → assurances, etc.
    let domaine = id.split('_')[0];
    if (domaine === 'assurance') domaine = 'assurances';
    if (domaine === 'etranger') domaine = 'etrangers';
    if (!byDomain[domaine]) byDomain[domaine] = [];
    byDomain[domaine].push({ id, cascades });
  }

  let totalAdded = 0;
  const report = {};

  for (const [domaine, items] of Object.entries(byDomain)) {
    const file = path.join(FICHES_DIR, `${domaine}.json`);
    if (!fs.existsSync(file)) {
      console.error(`[ERR] fichier inexistant: ${file}`);
      continue;
    }
    const fiches = JSON.parse(fs.readFileSync(file, 'utf8'));
    let addedHere = 0;

    for (const { id, cascades } of items) {
      const fiche = fiches.find(f => f.id === id);
      if (!fiche) {
        console.error(`[ERR] fiche introuvable: ${id} dans ${domaine}`);
        continue;
      }
      if (Array.isArray(fiche.cascades) && fiche.cascades.length > 0) {
        console.error(`[SKIP] ${id} a déjà une cascade — non modifiée`);
        continue;
      }
      fiche.cascades = cascades;
      addedHere++;
    }

    fs.writeFileSync(file, JSON.stringify(fiches, null, 2) + '\n', 'utf8');
    report[domaine] = addedHere;
    totalAdded += addedHere;
    console.log(`[OK] ${domaine}: +${addedHere} cascades`);
  }

  console.log(`\nTOTAL: +${totalAdded} cascades ajoutées.`);
  return { totalAdded, report };
}

applyCascades();
