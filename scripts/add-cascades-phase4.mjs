#!/usr/bin/env node
/**
 * Phase Cortex 4 — Ajout de cascades aux fiches NOT_ACTIONABLE
 *
 * Ajoute un champ `cascades` aux 74 fiches identifiées par audit-fiches-schema.mjs
 * (code STRICT_NOT_ACTIONABLE). Ne modifie aucune fiche ayant déjà une cascade.
 *
 * Pattern : constat → notification → délai → escalade.
 */

import fs from 'node:fs';
import path from 'node:path';

const FICHES_DIR = path.resolve('src/data/fiches');

// ============================================================================
// Définitions des cascades par fiche (74 entrées)
// ============================================================================

const CASCADES = {
  // ─── FAMILLE (14) ──────────────────────────────────────────────────────────
  famille_mariage_etranger: [{
    titre: "Reconnaissance d'un mariage célébré à l'étranger",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Constitution du dossier", description: "Rassembler l'acte de mariage étranger (apostille ou légalisé), traduction par traducteur juré, pièces d'identité des époux, justificatif de domicile suisse.", delai: "immédiat", preuve_generee: "Dossier complet horodaté" },
      { numero: 2, action: "Dépôt à l'office de l'état civil", description: "Déposer la demande de transcription auprès de l'office de l'état civil du domicile suisse (art. 45 LDIP).", delai: "dans les 30 jours suivant la constitution du dossier", base_legale: "LDIP 45", preuve_generee: "Quittance de dépôt" },
      { numero: 3, action: "Délai d'instruction cantonal", delai: "4 à 12 semaines", branches: [{ si: "transcription acceptée", alors: "fin du processus (mariage reconnu)" }, { si: "refus pour motif d'ordre public (CC 105)", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours auprès de l'autorité cantonale de surveillance", description: "Déposer un recours motivé dans le délai indiqué dans la décision (généralement 30 jours).", delai: "30 jours dès notification du refus", base_legale: "CC 90 al. 3 / droit cantonal de procédure" }
    ]
  }],
  famille_partenariat_enregistre: [{
    titre: "Enregistrement d'un partenariat",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Préparation des documents", description: "Réunir pièces d'identité, attestations de domicile, certificats individuels d'état civil, déclarations de capacité à conclure un partenariat.", delai: "immédiat", preuve_generee: "Dossier complet" },
      { numero: 2, action: "Dépôt de la requête à l'office de l'état civil", description: "Soumettre la requête commune des deux partenaires (LPart 5).", delai: "dans les 14 jours", base_legale: "LPart 5", preuve_generee: "Accusé de réception de l'office" },
      { numero: 3, action: "Délai d'examen et célébration", delai: "selon disponibilités cantonales (généralement 1 à 3 mois)", branches: [{ si: "conditions remplies", alors: "célébration et enregistrement" }, { si: "refus", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours administratif", description: "Recours auprès de l'autorité cantonale de surveillance de l'état civil.", delai: "30 jours dès notification", base_legale: "LPart / droit cantonal" }
    ]
  }],
  famille_enlevement_international: [{
    titre: "Demande de retour d'enfant enlevé internationalement",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Constat de l'enlèvement", description: "Documenter le déplacement illicite : copies du passeport de l'enfant, jugements relatifs à la garde, communications avec l'autre parent, billets de transport.", delai: "immédiat", preuve_generee: "Dossier de preuves daté" },
      { numero: 2, action: "Dépôt de la demande à l'autorité centrale (OFJ)", description: "Saisir l'Office fédéral de la justice (Autorité centrale Convention de La Haye 1980) pour demander le retour de l'enfant.", delai: "le plus tôt possible — délai d'1 an pour bénéficier du retour automatique (art. 12 CLaH80)", base_legale: "CLaH80 art. 3 et 12 / LF-EEA 5", preuve_generee: "Accusé de réception OFJ" },
      { numero: 3, action: "Procédure devant le tribunal cantonal compétent", delai: "6 semaines (objectif CLaH80)", branches: [{ si: "retour ordonné", alors: "exécution du retour" }, { si: "refus (intégration, risque grave)", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours au Tribunal fédéral", description: "Recours en matière civile contre la décision cantonale.", delai: "10 jours dès notification (matière urgente)", base_legale: "LTF 100 al. 2 let. c" }
    ]
  }],
  famille_reconnaissance_paternite_procedure: [{
    titre: "Reconnaissance ou action en paternité",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Préparation du dossier filiation", description: "Rassembler acte de naissance de l'enfant, déclaration éventuelle d'accord de la mère, pièces d'identité.", delai: "immédiat", preuve_generee: "Dossier filiation" },
      { numero: 2, action: "Reconnaissance volontaire à l'état civil", description: "Le père déclare sa paternité auprès de l'office de l'état civil (CC 260).", delai: "à tout moment dès la conception", base_legale: "CC 260", preuve_generee: "Acte de reconnaissance" },
      { numero: 3, action: "Si reconnaissance refusée ou contestée", delai: "1 an dès la naissance pour la mère, 1 an dès découverte des faits pour l'enfant", branches: [{ si: "accord trouvé", alors: "fin (reconnaissance enregistrée)" }, { si: "désaccord persistant", alors: "etape 4 (action judiciaire)" }] },
      { numero: 4, action: "Action en paternité au tribunal", description: "Saisir le tribunal civil du domicile de l'enfant, demander une expertise ADN.", delai: "imprescriptible pour l'enfant; 1 an pour la mère dès la naissance", base_legale: "CC 261 / CC 263" }
    ]
  }],
  famille_nom_famille: [{
    titre: "Changement de nom de famille",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Identification du motif", description: "Préciser le motif (mariage, divorce, motifs sérieux). Réunir pièces d'identité, état civil, justificatifs.", delai: "immédiat", preuve_generee: "Dossier motivé" },
      { numero: 2, action: "Demande à l'autorité cantonale de surveillance de l'état civil", description: "Déposer une requête écrite et motivée (CC 30).", delai: "dans le mois suivant la constitution du dossier", base_legale: "CC 30 / CC 270 / CC 160", preuve_generee: "Accusé de réception" },
      { numero: 3, action: "Décision cantonale", delai: "2 à 6 mois selon canton", branches: [{ si: "changement accordé", alors: "inscription à l'état civil (fin)" }, { si: "refus", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours cantonal puis fédéral", description: "Recours à l'autorité cantonale supérieure puis, si nécessaire, au TF.", delai: "30 jours dès notification", base_legale: "LTF 72 ss" }
    ]
  }],
  famille_regime_matrimonial: [{
    titre: "Choix ou modification du régime matrimonial",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Inventaire patrimonial", description: "Lister biens propres, biens communs, dettes, donations, héritages reçus avant et pendant le mariage.", delai: "immédiat", preuve_generee: "Inventaire patrimonial daté" },
      { numero: 2, action: "Rédaction du contrat de mariage", description: "Faire rédiger un contrat de mariage par un notaire (séparation de biens, communauté de biens, ou modification).", delai: "à convenir avec le notaire", base_legale: "CC 182 / CC 184", preuve_generee: "Contrat de mariage notarié" },
      { numero: 3, action: "Exécution du contrat", delai: "dès signature notariée", branches: [{ si: "régime accepté par les deux époux", alors: "régime opposable aux tiers" }, { si: "désaccord ou contestation", alors: "etape 4 (action judiciaire)" }] },
      { numero: 4, action: "Action en modification ou liquidation devant le tribunal", description: "Saisir le tribunal civil compétent (juge de paix puis tribunal cantonal).", delai: "selon procédure cantonale", base_legale: "CC 185 / CC 196 ss" }
    ]
  }],
  famille_liquidation_regime: [{
    titre: "Liquidation du régime matrimonial",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Inventaire des biens à liquider", description: "Établir liste exhaustive des biens propres, acquêts, dettes, à la date de dissolution.", delai: "immédiat après dissolution (divorce, décès, contrat)", preuve_generee: "Inventaire signé des deux époux" },
      { numero: 2, action: "Évaluation et partage amiable", description: "Estimer les valeurs (biens immobiliers, comptes, véhicules) et proposer un partage écrit (CC 197 ss).", delai: "30 à 90 jours selon complexité", base_legale: "CC 197 / CC 209 / CC 215", preuve_generee: "Convention de liquidation signée" },
      { numero: 3, action: "Phase de négociation", delai: "60 jours", branches: [{ si: "accord trouvé", alors: "ratification éventuelle par le tribunal (fin)" }, { si: "désaccord persistant", alors: "etape 4 (action judiciaire)" }] },
      { numero: 4, action: "Action en liquidation devant le juge", description: "Saisir le tribunal civil pour qu'il prononce la liquidation.", delai: "imprescriptible mais à formuler dans le cadre du divorce ou succession", base_legale: "CC 204 / CPC 198 let. c" }
    ]
  }],
  famille_succession_ab_intestat: [{
    titre: "Règlement d'une succession sans testament (ab intestat)",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Constat du décès et inventaire", description: "Obtenir l'acte de décès, identifier les héritiers légaux (CC 457 ss), inventorier biens et dettes.", delai: "dans les 30 jours suivant le décès", preuve_generee: "Acte de décès + inventaire provisoire" },
      { numero: 2, action: "Demande de certificat d'héritier", description: "Solliciter le certificat d'héritier auprès de la justice de paix ou autorité cantonale compétente.", delai: "dans les 90 jours", base_legale: "CC 559 / droit cantonal", preuve_generee: "Certificat d'héritier officiel" },
      { numero: 3, action: "Délai pour répudier", delai: "3 mois dès connaissance du décès (CC 567)", branches: [{ si: "succession acceptée", alors: "partage entre héritiers (etape 4)" }, { si: "succession répudiée", alors: "fin (succession dévolue à l'autorité)" }] },
      { numero: 4, action: "Partage et clôture", description: "Procéder au partage amiable ou requérir un partage judiciaire si désaccord.", delai: "selon complexité", base_legale: "CC 602 ss / CC 604" }
    ]
  }],
  famille_pacte_successoral: [{
    titre: "Conclusion d'un pacte successoral",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Définition du contenu", description: "Identifier les parties, biens, libéralités, renonciations envisagées; vérifier compatibilité avec réserves héréditaires.", delai: "immédiat", preuve_generee: "Projet de pacte écrit" },
      { numero: 2, action: "Rédaction et signature notariée", description: "Le pacte doit être en la forme authentique devant notaire avec deux témoins (CC 512).", delai: "à fixer avec le notaire", base_legale: "CC 494 / CC 512", preuve_generee: "Pacte notarié original" },
      { numero: 3, action: "Conservation et information", delai: "à vie", branches: [{ si: "pacte exécuté à l'ouverture de la succession", alors: "respect des dispositions" }, { si: "demande de modification ou résiliation", alors: "etape 4 (avenant ou action)" }] },
      { numero: 4, action: "Modification, résiliation ou contestation judiciaire", description: "Modification : nouvel acte authentique. Contestation : action en nullité au tribunal civil.", delai: "1 an dès découverte du vice (CC 521)", base_legale: "CC 513 / CC 521" }
    ]
  }],
  famille_reserve_hereditaire: [{
    titre: "Action en réduction pour atteinte à la réserve héréditaire",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Calcul de la réserve", description: "Identifier les héritiers réservataires (descendants, conjoint), calculer la masse successorale et la réserve due (CC 471).", delai: "immédiat dès ouverture de la succession", preuve_generee: "Calcul détaillé daté" },
      { numero: 2, action: "Mise en demeure des bénéficiaires", description: "Notifier par écrit aux héritiers ou légataires gratifiés au-delà de la quotité disponible la demande de réduction.", delai: "dans les 6 mois suivant la connaissance de l'atteinte", base_legale: "CC 522 ss", preuve_generee: "Lettre recommandée + AR" },
      { numero: 3, action: "Délai de réponse", delai: "30 jours", branches: [{ si: "accord amiable de réduction", alors: "rééquilibrage (fin)" }, { si: "refus ou silence", alors: "etape 4 (action judiciaire)" }] },
      { numero: 4, action: "Action en réduction devant le tribunal", description: "Ouvrir action devant le tribunal civil du dernier domicile du défunt.", delai: "1 an dès connaissance de l'atteinte, 10 ans au plus dès l'ouverture (CC 533)", base_legale: "CC 522 / CC 533" }
    ]
  }],
  famille_indignite_successorale: [{
    titre: "Action en constatation d'indignité successorale",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Documentation des faits", description: "Rassembler preuves (jugement pénal, témoignages) établissant l'un des motifs d'indignité (CC 540).", delai: "immédiat dès découverte des faits", preuve_generee: "Dossier de preuves daté" },
      { numero: 2, action: "Notification aux cohéritiers", description: "Informer les autres héritiers et l'autorité de protection ou notaire chargé de la succession.", delai: "dans les 30 jours", base_legale: "CC 540", preuve_generee: "Courriers recommandés + AR" },
      { numero: 3, action: "Délai pour résolution amiable", delai: "60 jours", branches: [{ si: "indignité reconnue par tous", alors: "exclusion automatique (fin)" }, { si: "contestation", alors: "etape 4 (action judiciaire)" }] },
      { numero: 4, action: "Action judiciaire en constatation d'indignité", description: "Ouvrir action devant le tribunal civil du dernier domicile du défunt.", delai: "1 an dès connaissance du motif (CC 541)", base_legale: "CC 540 / CC 541" }
    ]
  }],
  famille_executeur_testamentaire: [{
    titre: "Désignation et exécution par un exécuteur testamentaire",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Acceptation du mandat", description: "L'exécuteur désigné accepte ou refuse formellement la mission auprès de l'autorité (CC 517).", delai: "14 jours dès notification de la désignation", base_legale: "CC 517", preuve_generee: "Déclaration d'acceptation écrite" },
      { numero: 2, action: "Inventaire et notification aux héritiers", description: "Établir l'inventaire de la succession et notifier aux héritiers son mandat.", delai: "dans les 60 jours", base_legale: "CC 518", preuve_generee: "Inventaire signé + courriers AR" },
      { numero: 3, action: "Administration et liquidation", delai: "selon complexité (généralement 6 à 24 mois)", branches: [{ si: "exécution conforme acceptée par les héritiers", alors: "clôture et reddition de comptes (fin)" }, { si: "contestation par un héritier", alors: "etape 4 (action en destitution ou en reddition)" }] },
      { numero: 4, action: "Recours à l'autorité de surveillance", description: "Plainte à l'autorité cantonale de surveillance des successions ou action devant le juge.", delai: "à tout moment du mandat", base_legale: "CC 518 / CC 595" }
    ]
  }],
  famille_usufruit_conjoint: [{
    titre: "Constitution et exercice de l'usufruit du conjoint survivant",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Identification de l'option", description: "Vérifier les conditions (présence d'enfants communs, choix entre quote-part en propriété ou usufruit) selon CC 473.", delai: "immédiat dès ouverture de la succession", preuve_generee: "Note d'option signée du conjoint" },
      { numero: 2, action: "Déclaration d'option", description: "Le conjoint survivant communique son choix par écrit aux autres héritiers et au notaire chargé de la succession.", delai: "dans les 3 mois dès l'ouverture", base_legale: "CC 473", preuve_generee: "Déclaration AR" },
      { numero: 3, action: "Mise en place de l'usufruit", delai: "60 jours", branches: [{ si: "accord des cohéritiers et inscription au registre foncier (si immeuble)", alors: "usufruit constitué (fin)" }, { si: "désaccord (remariage, contestation)", alors: "etape 4 (action judiciaire)" }] },
      { numero: 4, action: "Action en partage ou en commutation", description: "Saisir le tribunal civil pour faire trancher la portée de l'usufruit ou demander sa commutation en rente.", delai: "selon procédure cantonale", base_legale: "CC 473 al. 3 / CC 612a" }
    ]
  }],
  famille_droit_retour: [{
    titre: "Exercice du droit de retour sur biens donnés",
    domaine: "famille",
    etapes: [
      { numero: 1, action: "Documentation de la donation", description: "Réunir l'acte de donation, identifier la clause de retour expresse ou légale (CC 626 / CO 249).", delai: "immédiat dès ouverture de la succession ou prédécès du donataire", preuve_generee: "Dossier donation daté" },
      { numero: 2, action: "Notification aux héritiers du donataire", description: "Faire valoir par écrit le droit de retour auprès des héritiers (lettre recommandée).", delai: "dans les 90 jours dès connaissance des faits", base_legale: "CO 249 / CC 626 / CC 636", preuve_generee: "Lettre AR" },
      { numero: 3, action: "Délai de réponse amiable", delai: "30 jours", branches: [{ si: "restitution acceptée", alors: "transfert de propriété (fin)" }, { si: "refus", alors: "etape 4 (action judiciaire)" }] },
      { numero: 4, action: "Action en restitution devant le tribunal", description: "Saisir le tribunal civil compétent pour ordonner la restitution du bien.", delai: "1 an dès connaissance des faits (analogie CO 67)", base_legale: "CO 249 / CC 626" }
    ]
  }],

  // ─── VIOLENCE (7) ──────────────────────────────────────────────────────────
  violence_foyer_accueil: [{
    titre: "Mise à l'abri en foyer d'accueil pour victimes",
    domaine: "violence",
    etapes: [
      { numero: 1, action: "Mise en sécurité immédiate", description: "Quitter le domicile dangereux, prendre papiers d'identité, médicaments, effets personnels essentiels.", delai: "immédiat", preuve_generee: "Note du moment de mise à l'abri" },
      { numero: 2, action: "Contact avec le centre LAVI ou la police", description: "Appeler le 117 ou le centre LAVI cantonal pour orientation vers un foyer agréé (LAVI 12).", delai: "dans les heures suivant la mise à l'abri", base_legale: "LAVI 12 / LAVI 14", preuve_generee: "Procès-verbal d'orientation LAVI" },
      { numero: 3, action: "Hébergement en foyer", delai: "durée selon situation (généralement 7 à 90 jours)", branches: [{ si: "stabilisation et solution de relogement", alors: "sortie du foyer (fin de la mise à l'abri)" }, { si: "danger persistant", alors: "etape 4 (mesures de protection complémentaires)" }] },
      { numero: 4, action: "Demande d'éloignement et plainte pénale", description: "Saisir l'APEA, le tribunal civil (CC 28b) ou déposer plainte pénale auprès du Ministère public.", delai: "dès stabilisation, dans les 90 jours", base_legale: "CC 28b" }
    ]
  }],
  violence_eloignement_domicile_penal: [{
    titre: "Éloignement du conjoint violent (procédure pénale)",
    domaine: "violence",
    etapes: [
      { numero: 1, action: "Documentation des actes de violence", description: "Photos des blessures, certificats médicaux, témoignages, copies de SMS/messages, journal des incidents.", delai: "immédiat dès l'incident", preuve_generee: "Dossier de preuves daté" },
      { numero: 2, action: "Plainte à la police et demande de mesure d'éloignement", description: "Déposer plainte (CP 123 ss) et demander expulsion immédiate du conjoint (CPP 216 / CC 28b).", delai: "dans les 48 heures suivant l'incident", base_legale: "CPP 216 / CC 28b", preuve_generee: "Procès-verbal de plainte" },
      { numero: 3, action: "Décision de la police ou du Ministère public", delai: "10 jours (mesure d'éloignement initiale)", branches: [{ si: "éloignement ordonné", alors: "demande de prolongation par le juge civil (etape 4)" }, { si: "éloignement refusé", alors: "etape 4 (saisine directe du juge civil)" }] },
      { numero: 4, action: "Requête au tribunal civil pour mesures protectrices", description: "Saisir le tribunal civil compétent pour prolongation/protection (CC 28b) — interdiction de périmètre, de contact.", delai: "à tout moment, urgence possible", base_legale: "CC 28b / CP 292" }
    ]
  }],
  violence_mariage_force: [{
    titre: "Action contre un mariage forcé",
    domaine: "violence",
    etapes: [
      { numero: 1, action: "Mise en sécurité de la victime", description: "Évaluer la dangerosité, contacter le centre LAVI ou un foyer si nécessaire, conserver les preuves de pression.", delai: "immédiat", preuve_generee: "Note de mise à l'abri" },
      { numero: 2, action: "Plainte pénale et signalement", description: "Déposer plainte pour mariage forcé (CP 181a) auprès de la police ou du Ministère public.", delai: "dès la mise en sécurité", base_legale: "CP 181a", preuve_generee: "Procès-verbal de plainte" },
      { numero: 3, action: "Procédure pénale et action en annulation civile", delai: "varie selon enquête", branches: [{ si: "annulation civile possible", alors: "etape 4 (action civile)" }, { si: "uniquement procédure pénale", alors: "suivi par le Ministère public (fin civile)" }] },
      { numero: 4, action: "Action en annulation du mariage", description: "Saisir le tribunal civil du domicile pour faire annuler le mariage forcé.", delai: "imprescriptible (CC 105 ch. 5)", base_legale: "CC 105 ch. 5 / CC 28b" }
    ]
  }],
  violence_stalking_harcelement: [{
    titre: "Procédure contre le harcèlement obsessionnel (stalking)",
    domaine: "violence",
    etapes: [
      { numero: 1, action: "Documentation des faits de harcèlement", description: "Tenir un journal détaillé : dates, heures, lieux, contenu des messages, témoins, captures d'écran.", delai: "immédiat et continu", preuve_generee: "Journal de stalking horodaté" },
      { numero: 2, action: "Plainte pénale", description: "Déposer plainte pour harcèlement (CP 179septies, 180, 181) auprès de la police ou du Ministère public.", delai: "dans les 3 mois dès le dernier acte (délai de plainte)", base_legale: "CP 179septies / CP 180 / CP 181", preuve_generee: "Procès-verbal de plainte + numéro de cause" },
      { numero: 3, action: "Phase d'enquête pénale", delai: "selon canton (3 à 12 mois)", branches: [{ si: "ordonnance pénale ou condamnation", alors: "exécution + mesures civiles (etape 4)" }, { si: "classement", alors: "etape 4 (action civile autonome)" }] },
      { numero: 4, action: "Requête civile en protection", description: "Saisir le tribunal civil pour interdiction de contact, de périmètre, mesures provisionnelles (CC 28b).", delai: "à tout moment", base_legale: "CC 28b" }
    ]
  }],
  violence_foyer_refuge: [{
    titre: "Accès à un refuge pour victimes de violence",
    domaine: "violence",
    etapes: [
      { numero: 1, action: "Évaluation du danger immédiat", description: "Identifier le niveau de danger, prévoir un sac d'urgence (papiers, médicaments, vêtements).", delai: "immédiat", preuve_generee: "Plan de sécurité" },
      { numero: 2, action: "Contact d'un refuge LAVI", description: "Appeler le numéro d'urgence LAVI cantonal (24/7) pour orientation vers un refuge.", delai: "dans les heures suivant l'évaluation", base_legale: "LAVI 12 / LAVI 14", preuve_generee: "Confirmation d'admission" },
      { numero: 3, action: "Séjour au refuge", delai: "généralement 2 semaines à 3 mois", branches: [{ si: "stabilisation et relogement trouvé", alors: "sortie accompagnée (fin)" }, { si: "danger persistant", alors: "etape 4 (mesures judiciaires)" }] },
      { numero: 4, action: "Saisine du tribunal civil ou plainte pénale", description: "Demander des mesures protectrices urgentes (CC 28b) ou déposer plainte pénale.", delai: "dès que possible", base_legale: "CC 28b" }
    ]
  }],
  violence_psychologique_preuves: [{
    titre: "Constitution de preuves de violence psychologique",
    domaine: "violence",
    etapes: [
      { numero: 1, action: "Documentation systématique", description: "Journal détaillé des incidents (date, heure, contexte), captures de messages, courriels, témoignages écrits.", delai: "immédiat et continu", preuve_generee: "Dossier de preuves chronologique" },
      { numero: 2, action: "Consultation médicale et psychologique", description: "Faire établir des certificats médicaux et psychologiques attestant l'impact des violences.", delai: "dans les 14 jours suivant le début de la documentation", base_legale: "CP 123 / CP 180", preuve_generee: "Certificats médicaux datés" },
      { numero: 3, action: "Évaluation par centre LAVI", delai: "30 jours", branches: [{ si: "constitution suffisante du dossier", alors: "etape 4 (action judiciaire)" }, { si: "preuves insuffisantes", alors: "poursuite de la documentation" }] },
      { numero: 4, action: "Plainte pénale ou action civile", description: "Déposer plainte (CP 180/181) ou requête civile (CC 28b) selon stratégie.", delai: "3 mois dès le dernier acte (délai de plainte CP 180)", base_legale: "CP 180 / CP 181 / CC 28b" }
    ]
  }],
  violence_garde_enfants: [{
    titre: "Protection des enfants exposés à la violence conjugale",
    domaine: "violence",
    etapes: [
      { numero: 1, action: "Mise en sécurité des enfants", description: "Sécuriser physiquement les enfants, documenter leur exposition (témoignages, certificats médicaux pédiatriques).", delai: "immédiat", preuve_generee: "Plan de sécurité enfants" },
      { numero: 2, action: "Signalement à l'APEA", description: "Saisir l'autorité de protection de l'enfant et de l'adulte (APEA) du domicile (CC 307 ss).", delai: "dans les 48 heures suivant la mise en sécurité", base_legale: "CC 307", preuve_generee: "Accusé de réception APEA" },
      { numero: 3, action: "Évaluation de l'APEA et mesures provisoires", delai: "30 jours (mesures urgentes)", branches: [{ si: "mesures de protection ordonnées", alors: "suivi APEA (fin courante)" }, { si: "mesures insuffisantes ou refus", alors: "etape 4 (recours/tribunal)" }] },
      { numero: 4, action: "Action devant le tribunal de protection", description: "Recours contre la décision APEA ou requête de modification de la garde (CC 298 / CC 301a).", delai: "30 jours dès notification (recours APEA)", base_legale: "CC 273 / CC 298 / CC 301a / CC 307" }
    ]
  }],

  // ─── SOCIAL (7) ────────────────────────────────────────────────────────────
  social_remboursement_aide: [{
    titre: "Contestation d'une décision de remboursement de l'aide sociale",
    domaine: "social",
    etapes: [
      { numero: 1, action: "Examen détaillé de la décision", description: "Lire la décision, identifier le motif de remboursement (revenus dissimulés, héritage, retour à meilleure fortune), rassembler tous les justificatifs.", delai: "immédiat dès réception", preuve_generee: "Dossier annoté de la décision" },
      { numero: 2, action: "Opposition écrite au service social", description: "Déposer une opposition motivée auprès du service social (LASV/LIASI cantonale), avec pièces justificatives.", delai: "30 jours dès notification (délai cantonal)", base_legale: "LASV (VD) / LIASI (GE) / CC 328", preuve_generee: "Lettre d'opposition AR" },
      { numero: 3, action: "Décision sur opposition", delai: "60 à 90 jours selon canton", branches: [{ si: "opposition admise", alors: "annulation ou réduction (fin)" }, { si: "opposition rejetée", alors: "etape 4 (recours juridictionnel)" }] },
      { numero: 4, action: "Recours au tribunal cantonal des assurances ou administratif", description: "Saisir l'autorité de recours cantonale dans les 30 jours dès notification.", delai: "30 jours dès notification de la décision sur opposition", base_legale: "loi cantonale de procédure administrative" }
    ]
  }],
  social_sanspapiers_aide_urgence: [{
    titre: "Demande d'aide d'urgence pour sans-papiers",
    domaine: "social",
    etapes: [
      { numero: 1, action: "Constitution du dossier minimal", description: "Réunir pièces d'identité (même périmées), preuve de présence en Suisse, témoignages, état de santé/besoin urgent.", delai: "immédiat", preuve_generee: "Dossier minimal d'urgence" },
      { numero: 2, action: "Demande à l'autorité cantonale d'aide d'urgence", description: "Solliciter l'aide d'urgence prévue par Cst 12 auprès du service social cantonal ou bureau d'aide d'urgence.", delai: "dans les 24 à 72 heures", base_legale: "Cst 12 / LASV (VD) / LIASI (GE)", preuve_generee: "Accusé de réception" },
      { numero: 3, action: "Évaluation et décision", delai: "généralement quelques jours à 30 jours", branches: [{ si: "aide d'urgence accordée (hébergement, nourriture, soins)", alors: "suivi (fin)" }, { si: "refus ou aide insuffisante", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours administratif et appui d'une œuvre d'entraide", description: "Recours dans les 30 jours auprès de l'autorité cantonale de recours; accompagnement par Caritas, Centre social protestant, etc.", delai: "30 jours dès notification", base_legale: "Cst 12 / loi cantonale de procédure" }
    ]
  }],
  social_csias_forfait: [{
    titre: "Contestation du calcul du forfait CSIAS",
    domaine: "social",
    etapes: [
      { numero: 1, action: "Vérification du calcul", description: "Comparer la décision avec les normes CSIAS C.1 actuelles (forfait entretien) et la composition du ménage déclarée.", delai: "immédiat dès réception de la décision", preuve_generee: "Tableau comparatif annoté" },
      { numero: 2, action: "Opposition au service social", description: "Déposer opposition écrite motivée auprès du service social cantonal (LASV/LIASI).", delai: "30 jours dès notification", base_legale: "LASV (VD) / LIASI (GE) / CSIAS C.1", preuve_generee: "Lettre AR + tableau de calcul" },
      { numero: 3, action: "Décision sur opposition", delai: "60 jours", branches: [{ si: "rectification accordée", alors: "ajustement du forfait (fin)" }, { si: "refus", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours juridictionnel cantonal", description: "Recours auprès du tribunal cantonal des assurances ou administratif.", delai: "30 jours dès notification", base_legale: "loi cantonale de procédure administrative" }
    ]
  }],
  social_personne_agee_prestations: [{
    titre: "Demande de prestations complémentaires AVS pour personne âgée",
    domaine: "social",
    etapes: [
      { numero: 1, action: "Bilan ressources/dépenses", description: "Calculer revenus AVS + autres + fortune et confronter aux besoins reconnus selon LPC 10.", delai: "immédiat", preuve_generee: "Bilan financier daté" },
      { numero: 2, action: "Dépôt de la demande à la caisse cantonale de compensation", description: "Remplir le formulaire de demande PC et joindre justificatifs (impôts, baux, factures de soins).", delai: "dans les 30 jours suivant le bilan", base_legale: "LPC 4 / LPC 10 / LAVS 21", preuve_generee: "Accusé de réception caisse" },
      { numero: 3, action: "Décision de la caisse", delai: "60 à 120 jours", branches: [{ si: "PC accordées", alors: "versement mensuel (fin)" }, { si: "refus ou montant insuffisant", alors: "etape 4 (opposition/recours)" }] },
      { numero: 4, action: "Opposition puis recours au tribunal cantonal des assurances", description: "Opposition dans les 30 jours puis recours au tribunal des assurances en cas de rejet.", delai: "30 jours dès notification de la décision", base_legale: "LPGA 52 / LPGA 56" }
    ]
  }],
  social_dettes_coexistence: [{
    titre: "Coexistence aide sociale et procédure de poursuites",
    domaine: "social",
    etapes: [
      { numero: 1, action: "Inventaire des dettes et de l'aide reçue", description: "Lister actes de défaut de biens, commandements de payer en cours, et établir la part insaisissable conformément à LP 92/93.", delai: "immédiat", preuve_generee: "Tableau dettes/aide social daté" },
      { numero: 2, action: "Information du service social et de l'office des poursuites", description: "Notifier par écrit la situation à l'office des poursuites (minimum vital LP 93) et au service social (LASV/LIASI).", delai: "dans les 14 jours", base_legale: "LP 92 / LP 333a / LASV (VD) / LIASI (GE)", preuve_generee: "Courriers AR aux deux autorités" },
      { numero: 3, action: "Réévaluation de la saisie", delai: "30 jours", branches: [{ si: "minimum vital respecté", alors: "stabilisation (fin)" }, { si: "saisie excessive maintenue", alors: "etape 4 (plainte LP 17)" }] },
      { numero: 4, action: "Plainte à l'autorité de surveillance LP", description: "Plainte écrite à l'autorité cantonale de surveillance des offices de poursuite (art. 17 LP).", delai: "10 jours dès la mesure contestée", base_legale: "LP 17" }
    ]
  }],
  social_dignite_minimale: [{
    titre: "Action pour garantie du minimum vital (Cst 12)",
    domaine: "social",
    etapes: [
      { numero: 1, action: "Évaluation de la situation de détresse", description: "Documenter l'absence de moyens (compte bancaire, hébergement, nourriture) et l'incapacité à subvenir.", delai: "immédiat", preuve_generee: "Bilan de situation daté" },
      { numero: 2, action: "Demande d'aide d'urgence Cst 12", description: "Soumettre une demande écrite au service social cantonal compétent en invoquant Cst 12 (droit fondamental).", delai: "immédiat (urgence)", base_legale: "Cst 12 / Cst 7 / LASV (VD) / LIASI (GE)", preuve_generee: "Accusé de réception" },
      { numero: 3, action: "Décision et octroi", delai: "généralement quelques jours", branches: [{ si: "aide d'urgence accordée", alors: "suivi régulier (fin)" }, { si: "refus ou aide insuffisante", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours et action en justice", description: "Recours administratif cantonal puis, le cas échéant, action en constatation du droit fondamental.", delai: "30 jours dès notification", base_legale: "Cst 12 / loi cantonale de procédure / LTF 113" }
    ]
  }],
  social_reinsertion_professionnelle: [{
    titre: "Mise en place d'une mesure de réinsertion professionnelle",
    domaine: "social",
    etapes: [
      { numero: 1, action: "Bilan de compétences et besoins", description: "Établir avec le conseiller social ou ORP un bilan : formation, expériences, freins à l'emploi.", delai: "dans les 30 jours suivant la première convocation", preuve_generee: "Bilan signé" },
      { numero: 2, action: "Demande de mesure", description: "Demander officiellement la mesure (formation LACI 59, mesure de réadaptation LAI 17, programme cantonal LASV/LIASI).", delai: "dans les 14 jours suivant le bilan", base_legale: "LACI 59 / LAI 15 / LAI 17 / LASV (VD) / LIASI (GE)", preuve_generee: "Demande écrite + accusé de réception" },
      { numero: 3, action: "Décision sur la mesure", delai: "30 à 90 jours", branches: [{ si: "mesure accordée", alors: "engagement et participation (fin)" }, { si: "refus", alors: "etape 4 (opposition / recours)" }] },
      { numero: 4, action: "Opposition puis recours juridictionnel", description: "Opposition à l'autorité, puis recours au tribunal cantonal des assurances.", delai: "30 jours dès notification", base_legale: "LPGA 52 / LPGA 56" }
    ]
  }],

  // ─── ENTREPRISE (6) ────────────────────────────────────────────────────────
  entreprise_sursis_concordataire: [{
    titre: "Demande de sursis concordataire",
    domaine: "entreprise",
    etapes: [
      { numero: 1, action: "Inventaire et bilan d'assainissement", description: "Établir bilan, plan de trésorerie, liste des créanciers, projet de concordat.", delai: "immédiat dès constat de surendettement (CO 725b)", preuve_generee: "Bilan + projet de concordat" },
      { numero: 2, action: "Requête au juge du concordat", description: "Déposer la requête de sursis concordataire avec pièces auprès du tribunal compétent (LP 293).", delai: "dans les 30 jours suivant le diagnostic", base_legale: "LP 293 / CO 725b", preuve_generee: "Quittance de dépôt + numéro de procédure" },
      { numero: 3, action: "Sursis provisoire et nomination du commissaire", delai: "4 mois (sursis provisoire), prolongeable", branches: [{ si: "sursis définitif accordé (LP 296)", alors: "exécution du concordat" }, { si: "rejet", alors: "etape 4 (faillite)" }] },
      { numero: 4, action: "Ouverture de la faillite ou homologation", description: "Selon issue : homologation du concordat (LP 306) ou ouverture de la faillite par le juge.", delai: "selon décision judiciaire", base_legale: "LP 296 / LP 306" }
    ]
  }],
  entreprise_creation_sarl: [{
    titre: "Création d'une Sàrl",
    domaine: "entreprise",
    etapes: [
      { numero: 1, action: "Élaboration des statuts et libération du capital", description: "Rédiger les statuts (objet social, siège, capital min CHF 20'000 entièrement libéré), ouvrir un compte de consignation.", delai: "immédiat", preuve_generee: "Projet de statuts + attestation bancaire de consignation" },
      { numero: 2, action: "Acte authentique devant notaire", description: "Faire constater la fondation par acte authentique (CO 777). Désignation des organes (gérants, organe de révision si nécessaire CO 727a).", delai: "dans les 30 jours", base_legale: "CO 773 / CO 777 / CO 779", preuve_generee: "Acte de fondation notarié" },
      { numero: 3, action: "Inscription au registre du commerce", delai: "généralement 5 à 15 jours ouvrables", branches: [{ si: "inscription validée", alors: "personnalité juridique acquise (fin)" }, { si: "refus motivé du préposé", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours contre le refus d'inscription", description: "Recours auprès de l'autorité cantonale de surveillance du registre du commerce.", delai: "30 jours dès notification", base_legale: "ORC 165 / loi cantonale de procédure" }
    ]
  }],
  entreprise_creation_sa: [{
    titre: "Création d'une société anonyme (SA)",
    domaine: "entreprise",
    etapes: [
      { numero: 1, action: "Préparation des statuts et capital", description: "Rédiger statuts, libérer au moins CHF 50'000 (sur capital min CHF 100'000), désigner le conseil d'administration et l'organe de révision (CO 727a).", delai: "immédiat", preuve_generee: "Projet de statuts + attestation de consignation" },
      { numero: 2, action: "Acte authentique de fondation", description: "Faire constater la fondation par acte authentique notarié (CO 632 ss). Acceptation par les organes désignés.", delai: "dans les 30 jours", base_legale: "CO 620 / CO 632 / CO 718", preuve_generee: "Acte de fondation notarié" },
      { numero: 3, action: "Inscription au registre du commerce", delai: "5 à 15 jours ouvrables", branches: [{ si: "inscription effectuée", alors: "SA constituée (fin)" }, { si: "refus", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours contre la décision de l'office du registre", description: "Recours auprès de l'autorité cantonale de surveillance du registre du commerce.", delai: "30 jours dès notification", base_legale: "ORC 165" }
    ]
  }],
  entreprise_conflit_associes_sarl: [{
    titre: "Résolution d'un conflit entre associés Sàrl",
    domaine: "entreprise",
    etapes: [
      { numero: 1, action: "Documentation du conflit", description: "Rassembler statuts, procès-verbaux d'assemblée, échanges écrits, comptes annuels, identifier les violations alléguées.", delai: "immédiat", preuve_generee: "Dossier de conflit horodaté" },
      { numero: 2, action: "Tentative de résolution interne et mise en demeure", description: "Convoquer une assemblée, proposer médiation; si échec, mise en demeure formelle de l'associé fautif (CO 808).", delai: "dans les 30 jours", base_legale: "CO 798 / CO 808", preuve_generee: "PV d'assemblée + lettre AR" },
      { numero: 3, action: "Délai de négociation", delai: "30 à 60 jours", branches: [{ si: "accord trouvé (modification statutaire, rachat de parts)", alors: "fin (exécution)" }, { si: "blocage persistant", alors: "etape 4 (action judiciaire)" }] },
      { numero: 4, action: "Action en exclusion ou en dissolution pour justes motifs", description: "Saisir le tribunal civil compétent pour exclure l'associé (CO 823) ou requérir la dissolution (CO 821).", delai: "selon procédure", base_legale: "CO 821 / CO 822 / CO 823" }
    ]
  }],
  entreprise_dissolution_societe: [{
    titre: "Dissolution d'une société (SA ou Sàrl)",
    domaine: "entreprise",
    etapes: [
      { numero: 1, action: "Décision de dissolution", description: "Convoquer l'assemblée générale, voter la dissolution avec quorum requis, désigner les liquidateurs (CO 736 / CO 821).", delai: "selon convocation statutaire (au moins 20 jours)", base_legale: "CO 736 / CO 821", preuve_generee: "PV d'assemblée notarié si requis" },
      { numero: 2, action: "Inscription de la dissolution au registre du commerce", description: "Annoncer la dissolution et la mise en liquidation auprès du registre du commerce.", delai: "dans les 30 jours suivant la décision", base_legale: "CO 738 / ORC", preuve_generee: "Extrait RC mentionnant la liquidation" },
      { numero: 3, action: "Liquidation et appel aux créanciers", delai: "1 an au moins après le 3e appel aux créanciers (CO 745)", branches: [{ si: "actif positif après paiement des créanciers", alors: "répartition entre actionnaires (etape 4)" }, { si: "surendettement", alors: "ouverture de la faillite" }] },
      { numero: 4, action: "Radiation finale au registre du commerce", description: "Rapport final des liquidateurs et requête de radiation auprès du registre du commerce.", delai: "après clôture des comptes de liquidation", base_legale: "CO 745 / CO 746" }
    ]
  }],
  entreprise_surendettement_personne_morale: [{
    titre: "Gestion du surendettement d'une personne morale",
    domaine: "entreprise",
    etapes: [
      { numero: 1, action: "Constat du surendettement", description: "Établir un bilan intermédiaire aux valeurs d'exploitation et de liquidation; identifier le surendettement au sens de CO 725a.", delai: "immédiat dès indices sérieux", base_legale: "CO 725 / CO 725a", preuve_generee: "Bilan intermédiaire signé par l'organe de révision" },
      { numero: 2, action: "Avis au juge ou plan d'assainissement", description: "Si surendettement confirmé : avis obligatoire au juge (CO 725b), à moins qu'un plan d'assainissement crédible ne soit présenté dans un délai approprié.", delai: "sans retard (immédiat)", base_legale: "CO 725b", preuve_generee: "Notification au juge ou plan d'assainissement documenté" },
      { numero: 3, action: "Décision du juge", delai: "selon urgence (généralement quelques semaines)", branches: [{ si: "ajournement de la faillite (sursis)", alors: "exécution du plan d'assainissement" }, { si: "ouverture de la faillite", alors: "etape 4 (procédure de faillite)" }] },
      { numero: 4, action: "Procédure de faillite et responsabilité des organes", description: "Office des faillites prend en charge; en parallèle, examen de la responsabilité des administrateurs (CO 754).", delai: "selon procédure LP", base_legale: "CO 754 / LP 192 ss" }
    ]
  }],

  // ─── TRAVAIL (8) ───────────────────────────────────────────────────────────
  travail_secret_professionnel: [{
    titre: "Protection ou violation du secret professionnel",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Identification des informations couvertes", description: "Lister précisément les données confidentielles (clients, brevets, méthodes), vérifier les clauses contractuelles applicables.", delai: "immédiat", preuve_generee: "Note interne d'identification" },
      { numero: 2, action: "Mise en demeure de cesser ou de respecter", description: "Notifier par écrit (recommandé) à l'employé/ex-employé l'obligation de respecter le secret (CO 321a).", delai: "dans les 14 jours suivant la découverte", base_legale: "CO 321a / CO 321e", preuve_generee: "Lettre AR" },
      { numero: 3, action: "Délai pour cesser/réparer", delai: "30 jours", branches: [{ si: "cessation et accord", alors: "fin (engagement écrit)" }, { si: "violation persistante", alors: "etape 4 (action civile et/ou pénale)" }] },
      { numero: 4, action: "Action civile et plainte pénale", description: "Action en dommages-intérêts (CO 321e) et plainte pénale pour violation du secret commercial (CP 162).", delai: "3 ans pour action civile (CO 60); 3 mois pour plainte pénale", base_legale: "CO 321e / CP 162" }
    ]
  }],
  travail_orp_inscription: [{
    titre: "Inscription à l'ORP et demande d'indemnités chômage",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Réunion des documents", description: "Rassembler contrat de travail, lettre de licenciement, certificat de travail, preuves de recherches d'emploi.", delai: "dès réception du licenciement", preuve_generee: "Dossier complet" },
      { numero: 2, action: "Inscription à l'ORP du domicile", description: "Se présenter à l'ORP au plus tard le 1er jour de chômage et remplir la demande d'indemnités auprès de la caisse choisie.", delai: "1er jour de chômage (rétroactivité limitée)", base_legale: "LACI 17", preuve_generee: "Confirmation d'inscription ORP" },
      { numero: 3, action: "Examen du droit aux indemnités", delai: "30 à 60 jours", branches: [{ si: "indemnités accordées", alors: "versements mensuels (fin courante)" }, { si: "refus ou pénalité (LACI 30)", alors: "etape 4 (opposition/recours)" }] },
      { numero: 4, action: "Opposition puis recours au tribunal cantonal des assurances", description: "Opposition à la caisse de chômage dans 30 jours, puis recours au tribunal des assurances.", delai: "30 jours dès notification", base_legale: "LACI 30 / LPGA 52 / LPGA 56" }
    ]
  }],
  travail_convention_collective: [{
    titre: "Application d'une convention collective de travail (CCT)",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Identification de la CCT applicable", description: "Vérifier la branche, le canton, l'extension éventuelle (force obligatoire), les conditions personnelles.", delai: "immédiat", preuve_generee: "Note d'analyse + texte de la CCT" },
      { numero: 2, action: "Demande d'application à l'employeur", description: "Notifier par écrit (recommandé) à l'employeur la non-conformité du contrat à la CCT (salaire, horaire, vacances).", delai: "dans les 30 jours suivant l'identification", base_legale: "CO 356 / CO 357", preuve_generee: "Lettre AR + relevé des écarts" },
      { numero: 3, action: "Délai de mise en conformité", delai: "30 jours", branches: [{ si: "mise en conformité par l'employeur", alors: "fin" }, { si: "refus ou silence", alors: "etape 4 (saisine de la commission paritaire ou du tribunal)" }] },
      { numero: 4, action: "Saisine de la commission paritaire ou du tribunal des prud'hommes", description: "Plainte à la commission paritaire CCT, ou requête de conciliation puis action devant le tribunal des prud'hommes.", delai: "5 ans (prescription créances de salaire CO 128)", base_legale: "CO 357 / CO 128 / CPC 197 ss" }
    ]
  }],
  travail_temporaire: [{
    titre: "Litige avec une agence de travail temporaire",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Vérification du contrat et missions", description: "Lire le contrat-cadre et le contrat de mission, vérifier la conformité aux CCT-Location de services et aux fiches de salaire.", delai: "immédiat", preuve_generee: "Tableau écarts contrat/loi" },
      { numero: 2, action: "Mise en demeure de l'agence", description: "Adresser une mise en demeure recommandée (salaire, certificat de travail, indemnités).", delai: "dans les 30 jours", base_legale: "LSE 12 / LSE 19 / LSE 20", preuve_generee: "Lettre AR" },
      { numero: 3, action: "Délai de réponse", delai: "30 jours", branches: [{ si: "régularisation", alors: "fin" }, { si: "refus ou silence", alors: "etape 4 (saisine SECO ou tribunal)" }] },
      { numero: 4, action: "Plainte au SECO/SCAV et/ou tribunal des prud'hommes", description: "Signaler à l'autorité cantonale de surveillance du marché du travail (SECO/SCAV); ouvrir action prud'homale.", delai: "5 ans (CO 128) pour les créances", base_legale: "LSE 19 / LSE 20 / CPC 197" }
    ]
  }],
  travail_stagiaire: [{
    titre: "Reconnaissance et conditions d'un stage",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Qualification du stage", description: "Vérifier si le stage est réellement formatif (objectif pédagogique, encadrement) ou s'il dissimule un emploi (CO 319).", delai: "immédiat", preuve_generee: "Convention de stage + fiche d'analyse" },
      { numero: 2, action: "Demande de reconnaissance comme contrat de travail", description: "Si le stage est en réalité un emploi, mettre l'employeur en demeure de régulariser (salaire conforme, contrat).", delai: "30 jours suivant la qualification", base_legale: "CO 319 / CO 344", preuve_generee: "Lettre AR" },
      { numero: 3, action: "Délai de réponse", delai: "30 jours", branches: [{ si: "requalification acceptée", alors: "régularisation (fin)" }, { si: "refus", alors: "etape 4 (action prud'homale)" }] },
      { numero: 4, action: "Action devant le tribunal des prud'hommes", description: "Requête de conciliation puis action en paiement du salaire dû et requalification.", delai: "5 ans dès chaque échéance de salaire (CO 128)", base_legale: "CO 319 / CO 128 / CPC 197" }
    ]
  }],
  travail_apprenti: [{
    titre: "Litige relatif à un contrat d'apprentissage",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Vérification du contrat d'apprentissage", description: "S'assurer du respect des éléments légaux (forme écrite, plan de formation, salaire min, vacances).", delai: "immédiat", preuve_generee: "Analyse du contrat datée" },
      { numero: 2, action: "Saisine de l'autorité cantonale de la formation professionnelle", description: "Signaler à l'office cantonal compétent en formation professionnelle toute violation, puis mettre en demeure l'employeur.", delai: "dans les 30 jours", base_legale: "CO 344 / CO 345a", preuve_generee: "Lettre AR + signalement" },
      { numero: 3, action: "Médiation cantonale", delai: "30 à 60 jours", branches: [{ si: "accord trouvé", alors: "fin (régularisation)" }, { si: "désaccord persistant ou rupture du contrat", alors: "etape 4 (action prud'homale)" }] },
      { numero: 4, action: "Action prud'homale ou résiliation", description: "Saisir le tribunal des prud'hommes (litige) ou prononcer la résiliation pour justes motifs (CO 346).", delai: "5 ans pour créances salariales (CO 128)", base_legale: "CO 344 / CO 344a / CO 346" }
    ]
  }],
  travail_gratification: [{
    titre: "Réclamation d'une gratification ou bonus",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Analyse du fondement de la gratification", description: "Vérifier si la gratification est convenue (contrat, usage répété de 3+ années) ou laissée à l'appréciation (CO 322d).", delai: "immédiat", preuve_generee: "Analyse contractuelle" },
      { numero: 2, action: "Mise en demeure de l'employeur", description: "Réclamer par lettre recommandée le versement de la gratification due, en motivant juridiquement.", delai: "dans les 30 jours suivant l'échéance", base_legale: "CO 322d", preuve_generee: "Lettre AR" },
      { numero: 3, action: "Délai de réponse", delai: "30 jours", branches: [{ si: "versement", alors: "fin" }, { si: "refus", alors: "etape 4 (procédure prud'homale)" }] },
      { numero: 4, action: "Action devant le tribunal des prud'hommes", description: "Saisir l'autorité de conciliation puis le tribunal des prud'hommes en cas d'échec.", delai: "5 ans dès l'échéance (CO 128)", base_legale: "CO 322d / CO 128 / CPC 197" }
    ]
  }],
  travail_surveillance: [{
    titre: "Contestation de la surveillance des employés",
    domaine: "travail",
    etapes: [
      { numero: 1, action: "Documentation de la surveillance", description: "Identifier les moyens utilisés (caméras, logiciels, géolocalisation), leur but et leur proportionnalité (CO 328b).", delai: "immédiat dès découverte", preuve_generee: "Inventaire détaillé daté" },
      { numero: 2, action: "Demande d'information et opposition", description: "Demander par écrit à l'employeur la finalité de la surveillance et exiger sa cessation/limitation si excessive.", delai: "dans les 30 jours", base_legale: "CO 328 / CO 328b", preuve_generee: "Lettre AR" },
      { numero: 3, action: "Délai de réponse", delai: "30 jours", branches: [{ si: "cessation/conformité", alors: "fin" }, { si: "refus ou silence", alors: "etape 4 (saisine PFPDT/SECO ou tribunal)" }] },
      { numero: 4, action: "Plainte au PFPDT, SECO et/ou action civile", description: "Plainte au Préposé fédéral à la protection des données et/ou inspection du travail; action prud'homale en réparation.", delai: "selon procédure (action civile : 1 an dès connaissance du dommage)", base_legale: "CO 328 / CO 328b / LPD 32" }
    ]
  }],

  // ─── ETRANGERS (14) ────────────────────────────────────────────────────────
  etranger_permis_travail: [{
    titre: "Demande de permis de travail (LEI)",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Constitution du dossier employeur", description: "L'employeur prépare contrat, justification du besoin, preuve de recherches préalables (priorité indigène).", delai: "immédiat", preuve_generee: "Dossier complet d'admission" },
      { numero: 2, action: "Dépôt de la demande au SEM via service cantonal", description: "L'employeur dépose la demande auprès de l'office cantonal de la population/migration, qui transmet au SEM si compétence fédérale.", delai: "dans les 30 jours suivant la signature du contrat", base_legale: "LEI 18 / LEI 21 / LEI 22", preuve_generee: "Quittance de dépôt" },
      { numero: 3, action: "Décision combinée canton/SEM", delai: "1 à 4 mois selon nationalité (UE/AELE vs État tiers)", branches: [{ si: "autorisation accordée", alors: "délivrance du permis (fin)" }, { si: "refus", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours au tribunal cantonal puis au TAF", description: "Recours dans les délais légaux contre la décision de refus (autorité cantonale puis Tribunal administratif fédéral).", delai: "30 jours dès notification", base_legale: "LEI 64 / PA 50" }
    ]
  }],
  etranger_naturalisation_facilitee: [{
    titre: "Demande de naturalisation facilitée",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Vérification des conditions", description: "Confirmer le motif (mariage avec Suisse depuis 3 ans, communauté conjugale, intégration, séjour 5 ans en Suisse).", delai: "immédiat", preuve_generee: "Liste justificatifs (acte mariage, attestations séjour, intégration)" },
      { numero: 2, action: "Dépôt de la demande au SEM", description: "Envoyer le formulaire et les pièces au Secrétariat d'État aux migrations (LN 21 / LN 24a).", delai: "dans les 30 jours", base_legale: "LN 21 / LN 24a", preuve_generee: "Accusé de réception SEM" },
      { numero: 3, action: "Enquête et décision", delai: "12 à 24 mois", branches: [{ si: "naturalisation accordée", alors: "octroi de la nationalité (fin)" }, { si: "refus", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours au Tribunal administratif fédéral (TAF)", description: "Recours dans les 30 jours contre la décision du SEM.", delai: "30 jours dès notification", base_legale: "LN 36 / LTAF 31 ss" }
    ]
  }],
  etranger_integration_criteres: [{
    titre: "Évaluation et mise à jour des critères d'intégration",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Auto-évaluation", description: "Comparer sa situation aux 4 critères LEI 58a (respect ordre juridique, valeurs Cst., compétences linguistiques, participation économique/formation).", delai: "immédiat", preuve_generee: "Tableau d'auto-évaluation" },
      { numero: 2, action: "Demande de reconnaissance ou de plan d'intégration", description: "Adresser au service cantonal des migrations une demande d'attestation ou de mise en place d'une convention d'intégration.", delai: "dans les 30 jours", base_legale: "LEI 58a / LEI 58b / OASA 77a-77g", preuve_generee: "Accusé de réception" },
      { numero: 3, action: "Évaluation cantonale", delai: "30 à 90 jours", branches: [{ si: "critères jugés remplis", alors: "attestation délivrée (fin)" }, { si: "manques identifiés", alors: "convention d'intégration ou etape 4 (recours en cas de décision défavorable)" }] },
      { numero: 4, action: "Recours contre la décision cantonale", description: "Recours auprès du tribunal cantonal puis du TAF.", delai: "30 jours dès notification", base_legale: "LEI 58a / loi cantonale de procédure" }
    ]
  }],
  etranger_cours_langue_obligatoires: [{
    titre: "Cours de langue obligatoires (convention d'intégration)",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Notification de la convention", description: "Examiner la convention d'intégration imposée par l'autorité cantonale (objectifs linguistiques, calendrier).", delai: "immédiat dès réception", preuve_generee: "Convention signée" },
      { numero: 2, action: "Inscription aux cours", description: "S'inscrire à un cours certifié (FIDE) auprès d'un prestataire reconnu et débuter dans le délai imparti.", delai: "dans les 30 jours suivant la signature", base_legale: "LEI 58a / LEI 58b", preuve_generee: "Confirmation d'inscription" },
      { numero: 3, action: "Atteinte des objectifs linguistiques", delai: "selon convention (généralement 12 à 24 mois)", branches: [{ si: "objectifs atteints (test FIDE/téléRSI/etc.)", alors: "décharge de la convention (fin)" }, { si: "objectifs non atteints sans excuse", alors: "etape 4 (sanctions et recours)" }] },
      { numero: 4, action: "Recours contre les sanctions", description: "Recours administratif cantonal contre toute sanction (non-renouvellement, rétrogradation du permis).", delai: "30 jours dès notification", base_legale: "LEI 58a / loi cantonale de procédure" }
    ]
  }],
  etranger_aide_sociale_permis: [{
    titre: "Conséquences sur le permis du recours à l'aide sociale",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Évaluation de la situation", description: "Lister montants d'aide reçus, période, motifs (perte d'emploi, maladie), incidence sur le permis (LEI 62 / LEI 63).", delai: "immédiat", preuve_generee: "Bilan d'aide sociale daté" },
      { numero: 2, action: "Information préventive de l'autorité cantonale", description: "Si convocation reçue, fournir explications écrites et justificatifs (effort de réinsertion, recherches d'emploi).", delai: "dans les 14 jours suivant la convocation", base_legale: "LEI 62 / LEI 63 / LEI 29", preuve_generee: "Mémoire écrit + AR" },
      { numero: 3, action: "Décision de l'office cantonal", delai: "30 à 90 jours", branches: [{ si: "permis maintenu / avertissement", alors: "suivi (fin courante)" }, { si: "révocation/non-renouvellement", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours juridictionnel", description: "Recours auprès du tribunal cantonal puis, le cas échéant, au TAF.", delai: "30 jours dès notification", base_legale: "LEI 64 / LEI 65" }
    ]
  }],
  etranger_travail_asile: [{
    titre: "Autorisation de travailler pour personne en procédure d'asile",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Vérification de l'éligibilité", description: "Confirmer le statut (livret N, F), l'absence d'interdiction de travail durant les 3 premiers mois, le canton attribué.", delai: "immédiat", preuve_generee: "Note d'éligibilité" },
      { numero: 2, action: "Demande d'autorisation par l'employeur", description: "L'employeur dépose la demande au service cantonal de l'emploi/migration avec contrat et description du poste.", delai: "dans les 30 jours suivant l'offre", base_legale: "LAsi 43 / LAsi 86 / LEI 85a", preuve_generee: "Quittance de dépôt" },
      { numero: 3, action: "Décision cantonale", delai: "30 à 60 jours", branches: [{ si: "autorisation accordée", alors: "début de l'activité (fin)" }, { si: "refus", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours administratif", description: "Recours contre la décision cantonale auprès du tribunal cantonal compétent.", delai: "30 jours dès notification", base_legale: "loi cantonale de procédure / LAsi 108" }
    ]
  }],
  etranger_permis_frontalier_g: [{
    titre: "Demande ou renouvellement de permis frontalier (G)",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Vérification des conditions", description: "Domicile dans une zone frontalière voisine, employeur en Suisse, retour hebdomadaire au domicile (LEI 35 / ALCP 7).", delai: "immédiat", preuve_generee: "Justificatif de domicile + contrat de travail" },
      { numero: 2, action: "Dépôt de la demande au canton de travail", description: "L'employeur ou le travailleur dépose le formulaire au service cantonal des migrations.", delai: "dans les 30 jours suivant la prise d'emploi", base_legale: "LEI 35 / ALCP 7", preuve_generee: "Accusé de réception" },
      { numero: 3, action: "Décision cantonale", delai: "30 à 90 jours", branches: [{ si: "permis G délivré (5 ans renouvelable UE/AELE)", alors: "exercice de l'activité (fin)" }, { si: "refus ou non-renouvellement", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours auprès du tribunal cantonal", description: "Recours administratif dans le délai légal.", delai: "30 jours dès notification", base_legale: "LEI 64 / loi cantonale de procédure" }
    ]
  }],
  etranger_detachement_travailleurs: [{
    titre: "Détachement de travailleurs en Suisse",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Préparation de la déclaration", description: "Identifier la mission, lister les employés détachés, vérifier conditions minimales suisses (salaire, horaire, sécurité).", delai: "au moins 8 jours avant le début de la mission", preuve_generee: "Dossier d'annonce" },
      { numero: 2, action: "Annonce électronique au SECO", description: "Soumettre l'annonce via la plateforme officielle 8 jours avant la mission (LDet 6).", delai: "8 jours avant le début", base_legale: "LDet 2 / LDet 6", preuve_generee: "Confirmation électronique" },
      { numero: 3, action: "Contrôle SECO/commissions paritaires", delai: "pendant et après la mission", branches: [{ si: "conformité aux conditions minimales", alors: "fin de la mission" }, { si: "violations constatées", alors: "etape 4 (sanctions et recours)" }] },
      { numero: 4, action: "Sanctions administratives et recours", description: "Le SECO peut prononcer amende, interdiction; recours auprès du TAF.", delai: "30 jours dès notification", base_legale: "LDet 9 / PA 50" }
    ]
  }],
  etranger_reconnaissance_diplomes: [{
    titre: "Reconnaissance d'un diplôme étranger",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Identification de l'autorité compétente", description: "Selon profession : SEFRI (formations professionnelles), CDIP (enseignement), MEBEKO (médecine), CRS (santé non médicale).", delai: "immédiat", preuve_generee: "Note d'orientation" },
      { numero: 2, action: "Dépôt du dossier de reconnaissance", description: "Soumettre diplôme légalisé/apostille, traduit, descriptif des cours, et payer les émoluments.", delai: "dans les 30 jours après identification", base_legale: "ALCP Annexe III / loi sur la formation professionnelle", preuve_generee: "Quittance d'enregistrement" },
      { numero: 3, action: "Évaluation de l'autorité", delai: "généralement 4 à 12 mois", branches: [{ si: "reconnaissance complète", alors: "exercice autorisé (fin)" }, { si: "mesures de compensation (stage, examen)", alors: "réalisation puis revérification" }, { si: "refus", alors: "etape 4 (recours)" }] },
      { numero: 4, action: "Recours au Tribunal administratif fédéral", description: "Recours contre la décision dans les 30 jours.", delai: "30 jours dès notification", base_legale: "LTAF 31 ss / PA 50" }
    ]
  }],
  etranger_assurances_sociales: [{
    titre: "Affiliation aux assurances sociales pour étrangers",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Identification du statut et des conventions", description: "Clarifier la nationalité, le permis, l'employeur, vérifier les conventions bilatérales/UE applicables (AVS, LPP).", delai: "immédiat dès l'arrivée ou la prise d'emploi", preuve_generee: "Note d'analyse" },
      { numero: 2, action: "Affiliation auprès des caisses compétentes", description: "L'employeur affilie aux assurances sociales (AVS, LPP, LAA); l'assuré s'affilie à l'AOS LAMal dans les 3 mois.", delai: "3 mois pour LAMal, immédiat pour AVS/LAA via employeur", base_legale: "LAVS 1a / LPP 25f / LAMal 3", preuve_generee: "Confirmations d'affiliation" },
      { numero: 3, action: "Vérification annuelle et mises à jour", delai: "annuellement", branches: [{ si: "situation conforme", alors: "suivi (fin courante)" }, { si: "refus d'affiliation ou litige", alors: "etape 4 (opposition/recours)" }] },
      { numero: 4, action: "Opposition puis recours au tribunal cantonal des assurances", description: "Opposition à la décision, puis recours dans les 30 jours.", delai: "30 jours dès notification", base_legale: "LPGA 52 / LPGA 56" }
    ]
  }],
  etranger_double_nationalite: [{
    titre: "Reconnaissance et exercice de la double nationalité",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Vérification des règles dans les deux États", description: "Confirmer que l'État d'origine permet la double nationalité (la Suisse l'admet — LN 7).", delai: "immédiat", preuve_generee: "Note de droit comparé" },
      { numero: 2, action: "Annonce à l'office de l'état civil", description: "Communiquer l'acquisition de la nouvelle nationalité à l'office de l'état civil suisse pour mise à jour des données.", delai: "dans les 30 jours", base_legale: "LN 7 / Cst. 37", preuve_generee: "Confirmation d'enregistrement" },
      { numero: 3, action: "Mise à jour des documents", delai: "60 à 90 jours", branches: [{ si: "double nationalité reconnue par les deux États", alors: "passeports actifs des deux États (fin)" }, { si: "perte automatique d'une nationalité", alors: "etape 4 (recours éventuel dans l'État concerné)" }] },
      { numero: 4, action: "Recours auprès de l'autorité concernée", description: "Recours selon la procédure de l'État ayant prononcé la perte ou refus.", delai: "selon droit national applicable", base_legale: "Cst. 37 / convention bilatérale éventuelle" }
    ]
  }],
  etranger_apatridie: [{
    titre: "Reconnaissance du statut d'apatride",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Constitution du dossier de preuves", description: "Réunir tout élément établissant l'absence de nationalité (refus officiels, ancien passeport invalidé, attestations consulaires).", delai: "immédiat", preuve_generee: "Dossier d'apatridie" },
      { numero: 2, action: "Demande de reconnaissance au SEM", description: "Déposer une demande de reconnaissance du statut d'apatride auprès du SEM (Convention de New York 1954).", delai: "dans les 60 jours", base_legale: "Convention apatrides 1954 / CC 30 al. 1 let. b", preuve_generee: "Accusé de réception SEM" },
      { numero: 3, action: "Décision du SEM", delai: "6 à 18 mois", branches: [{ si: "statut reconnu", alors: "octroi du permis B (fin)" }, { si: "refus", alors: "etape 4 (recours TAF)" }] },
      { numero: 4, action: "Recours au TAF", description: "Recours au Tribunal administratif fédéral dans les 30 jours.", delai: "30 jours dès notification", base_legale: "LTAF 31 ss / PA 50" }
    ]
  }],
  etranger_mna_mineurs: [{
    titre: "Protection des mineurs non accompagnés (MNA)",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Identification et signalement", description: "L'autorité (police, SEM, ONG) identifie le mineur, fait procéder à un examen d'âge si doute.", delai: "immédiat à l'arrivée", base_legale: "LAsi 17 / CDE 3", preuve_generee: "Procès-verbal d'identification" },
      { numero: 2, action: "Désignation d'un tuteur ou personne de confiance", description: "L'autorité cantonale (APEA) désigne un représentant légal ou personne de confiance pour la procédure.", delai: "sans délai (immédiat)", base_legale: "LAsi 17 al. 3 / CC 327a", preuve_generee: "Décision de désignation" },
      { numero: 3, action: "Procédure d'asile et hébergement adapté", delai: "selon procédure d'asile", branches: [{ si: "asile/protection accordés", alors: "intégration et formation (fin)" }, { si: "refus", alors: "etape 4 (recours TAF)" }] },
      { numero: 4, action: "Recours au TAF", description: "Recours dans les délais réduits (5 ou 30 jours selon procédure).", delai: "5 ou 30 jours dès notification", base_legale: "LAsi 108 / LTAF 31 ss" }
    ]
  }],
  etranger_dublin_transfert: [{
    titre: "Recours contre une décision de transfert Dublin",
    domaine: "etranger",
    etapes: [
      { numero: 1, action: "Réception et analyse de la décision", description: "Lire la décision de transfert (État responsable, motifs Dublin III art. 3), identifier risques et clauses de souveraineté possibles.", delai: "immédiat", preuve_generee: "Décision annotée" },
      { numero: 2, action: "Préparation du recours et effet suspensif", description: "Rédiger un recours motivé invoquant l'art. 3(2) ou la clause discrétionnaire (art. 17), demander expressément l'effet suspensif.", delai: "5 jours dès notification (délai LAsi 108 al. 2)", base_legale: "Dublin III art. 3 / Dublin III art. 17 / LAsi 108 al. 2", preuve_generee: "Mémoire de recours déposé au TAF" },
      { numero: 3, action: "Décision du TAF", delai: "souvent 5 à 15 jours pour effet suspensif, fond plus long", branches: [{ si: "effet suspensif accordé puis fond admis", alors: "annulation du transfert (fin)" }, { si: "rejet", alors: "etape 4 (transfert ou demande de reconsidération)" }] },
      { numero: 4, action: "Demande de reconsidération ou recours en révision", description: "En présence de faits nouveaux, déposer une demande de reconsidération au SEM ou de révision au TAF.", delai: "sans délai si faits nouveaux", base_legale: "PA 66 / LAsi 111b" }
    ]
  }],

  // ─── ACCIDENT (4) ──────────────────────────────────────────────────────────
  accident_invalidite_suite: [{
    titre: "Demande de rente d'invalidité suite à un accident",
    domaine: "accident",
    etapes: [
      { numero: 1, action: "Annonce et constitution du dossier", description: "Rassembler certificats médicaux, rapport d'accident, fiches de salaire, expertises éventuelles.", delai: "immédiat dès stabilisation", preuve_generee: "Dossier médical et professionnel" },
      { numero: 2, action: "Demande à la SUVA/assurance-accidents et à l'AI", description: "Déposer la demande de rente LAA auprès de l'assureur-accidents et la demande AI auprès de l'office cantonal AI.", delai: "dès stabilisation, au plus tard 5 ans après l'accident", base_legale: "LAA 18 / LAA 20 / LAI 28", preuve_generee: "Accusés de réception des deux assureurs" },
      { numero: 3, action: "Évaluation médicale et économique", delai: "généralement 6 à 18 mois", branches: [{ si: "rente accordée (LAA et/ou AI)", alors: "versements (fin courante)" }, { si: "refus ou rente jugée insuffisante", alors: "etape 4 (opposition/recours)" }] },
      { numero: 4, action: "Opposition puis recours au tribunal cantonal des assurances", description: "Opposition dans 30 jours puis recours juridictionnel.", delai: "30 jours dès notification", base_legale: "LPGA 52 / LPGA 56" }
    ]
  }],
  accident_faute_concomitante: [{
    titre: "Réduction d'indemnité pour faute concomitante",
    domaine: "accident",
    etapes: [
      { numero: 1, action: "Documentation des circonstances", description: "Rassembler rapport de police, photos, témoignages, expertises (vitesse, alcool, ceinture, comportement victime).", delai: "immédiat", preuve_generee: "Dossier circonstanciel" },
      { numero: 2, action: "Échange contradictoire avec l'assureur RC", description: "Discuter par écrit la quote-part de réduction proposée (CO 44, LCR 59) et fournir les éléments à décharge.", delai: "dans les 60 jours suivant la proposition de l'assureur", base_legale: "CO 43 / CO 44 / LCR 59", preuve_generee: "Lettre AR + dossier complet" },
      { numero: 3, action: "Délai de négociation", delai: "60 à 90 jours", branches: [{ si: "accord transactionnel", alors: "indemnisation (fin)" }, { si: "désaccord", alors: "etape 4 (action judiciaire)" }] },
      { numero: 4, action: "Action en responsabilité civile au tribunal", description: "Saisir le tribunal civil pour faire trancher la quote-part de faute et le dommage indemnisable.", delai: "3 ans dès connaissance du dommage et de l'auteur (CO 60)", base_legale: "CO 41 / CO 60 / LCR 65" }
    ]
  }],
  accident_prescription_rc: [{
    titre: "Sauvegarde des droits avant prescription RC",
    domaine: "accident",
    etapes: [
      { numero: 1, action: "Identification du délai applicable", description: "Calculer le délai relatif (3 ans dès connaissance) et absolu (10 ans depuis le fait, exceptions LCR/LAA).", delai: "immédiat", preuve_generee: "Note de calcul" },
      { numero: 2, action: "Mise en demeure et acte interruptif", description: "Lettre recommandée à l'auteur/assureur RC, ou réquisition de poursuite à l'office des poursuites pour interrompre la prescription.", delai: "avant l'échéance du délai", base_legale: "CO 60 / CO 135 / LCR 83", preuve_generee: "AR ou réquisition de poursuite" },
      { numero: 3, action: "Délai de négociation post-interruption", delai: "nouveau délai (3 ans dès interruption)", branches: [{ si: "accord amiable", alors: "indemnisation (fin)" }, { si: "blocage", alors: "etape 4 (procédure judiciaire)" }] },
      { numero: 4, action: "Action civile devant le tribunal", description: "Conciliation puis action devant le tribunal civil compétent.", delai: "avant nouvelle prescription", base_legale: "CO 60 / CPC 197" }
    ]
  }],
  accident_domestique_responsabilite: [{
    titre: "Responsabilité civile pour accident domestique",
    domaine: "accident",
    etapes: [
      { numero: 1, action: "Constat et conservation des preuves", description: "Photographier les lieux, conserver l'objet en cause, recueillir témoignages, certificat médical.", delai: "immédiat", preuve_generee: "Dossier de preuves" },
      { numero: 2, action: "Notification à l'assureur RC privé du responsable", description: "Annoncer le sinistre à l'assurance RC privée du responsable (ou du propriétaire si défaut d'ouvrage CO 58).", delai: "dans les 14 jours suivant l'accident", base_legale: "CO 41 / CO 56 / CO 58", preuve_generee: "Déclaration de sinistre + AR" },
      { numero: 3, action: "Évaluation et négociation", delai: "60 à 180 jours", branches: [{ si: "indemnisation acceptée", alors: "versement (fin)" }, { si: "refus ou montant insuffisant", alors: "etape 4 (action civile)" }] },
      { numero: 4, action: "Action en responsabilité au tribunal civil", description: "Conciliation puis action devant le tribunal civil compétent.", delai: "3 ans dès connaissance du dommage et de l'auteur (CO 60)", base_legale: "CO 41 / CO 56 / CO 58 / CO 60" }
    ]
  }],

  // ─── ASSURANCES (4) ────────────────────────────────────────────────────────
  assurance_chomage_indemnites_conditions: [{
    titre: "Vérification des conditions du droit aux indemnités chômage",
    domaine: "assurance",
    etapes: [
      { numero: 1, action: "Examen des conditions LACI 8", description: "Vérifier période de cotisation (12 mois sur 2 ans), aptitude au placement, perte de travail à prendre en compte.", delai: "immédiat", preuve_generee: "Auto-évaluation détaillée" },
      { numero: 2, action: "Inscription à l'ORP et dépôt à la caisse de chômage", description: "S'inscrire à l'ORP au 1er jour de chômage, déposer la demande à la caisse choisie avec attestation employeur.", delai: "1er jour de chômage", base_legale: "LACI 8 / LACI 13 / LACI 17", preuve_generee: "Confirmation d'inscription + accusé de réception caisse" },
      { numero: 3, action: "Décision sur le droit", delai: "30 à 60 jours", branches: [{ si: "droit reconnu", alors: "versements mensuels (fin courante)" }, { si: "refus", alors: "etape 4 (opposition/recours)" }] },
      { numero: 4, action: "Opposition puis recours au tribunal cantonal des assurances", description: "Opposition dans 30 jours puis recours juridictionnel.", delai: "30 jours dès notification", base_legale: "LPGA 52 / LPGA 56" }
    ]
  }],
  assurance_allocations_familiales: [{
    titre: "Demande d'allocations familiales",
    domaine: "assurance",
    etapes: [
      { numero: 1, action: "Identification de la caisse compétente", description: "Identifier la caisse d'allocations familiales liée à l'employeur ou à l'activité indépendante du parent demandeur.", delai: "immédiat", preuve_generee: "Note d'identification" },
      { numero: 2, action: "Dépôt de la demande", description: "Compléter le formulaire LAFam et fournir actes de naissance, attestations de scolarité ou de formation des enfants.", delai: "dans les 30 jours suivant la naissance ou la prise d'emploi", base_legale: "LAFam 3 / LAFam 7 / LAFam 13", preuve_generee: "Accusé de réception caisse" },
      { numero: 3, action: "Décision de la caisse", delai: "30 à 90 jours", branches: [{ si: "allocations accordées rétroactivement (max 5 ans)", alors: "versements mensuels (fin)" }, { si: "refus ou montant contesté", alors: "etape 4 (opposition/recours)" }] },
      { numero: 4, action: "Opposition puis recours au tribunal cantonal des assurances", description: "Opposition dans 30 jours puis recours juridictionnel.", delai: "30 jours dès notification", base_legale: "LPGA 52 / LPGA 56" }
    ]
  }],
  assurance_maternite_apg: [{
    titre: "Demande d'allocation de maternité (APG)",
    domaine: "assurance",
    etapes: [
      { numero: 1, action: "Vérification des conditions", description: "Confirmer 9 mois d'AVS avant accouchement et 5 mois d'activité lucrative durant cette période (LAPG 16b).", delai: "avant ou immédiatement après l'accouchement", preuve_generee: "Auto-évaluation et attestation employeur" },
      { numero: 2, action: "Dépôt de la demande à la caisse de compensation", description: "Soumettre formulaire APG et acte de naissance auprès de la caisse de compensation de l'employeur (ou indépendante).", delai: "dans les 5 ans dès l'accouchement (prescription)", base_legale: "LAPG 16b / LAPG 16e", preuve_generee: "Accusé de réception" },
      { numero: 3, action: "Décision et versement", delai: "30 à 60 jours", branches: [{ si: "allocation accordée (98 jours, 80% du gain)", alors: "versement (fin)" }, { si: "refus", alors: "etape 4 (opposition/recours)" }] },
      { numero: 4, action: "Opposition puis recours au tribunal cantonal des assurances", description: "Opposition dans 30 jours puis recours juridictionnel.", delai: "30 jours dès notification", base_legale: "LPGA 52 / LPGA 56" }
    ]
  }],
  assurance_avs_rente_vieillesse: [{
    titre: "Demande de rente de vieillesse AVS",
    domaine: "assurance",
    etapes: [
      { numero: 1, action: "Anticipation du dossier", description: "Demander un extrait du compte individuel AVS, vérifier les années de cotisation, identifier d'éventuelles lacunes.", delai: "6 mois avant l'âge légal de la retraite", preuve_generee: "Extrait CI + projection de rente" },
      { numero: 2, action: "Dépôt de la demande à la caisse de compensation", description: "Adresser le formulaire de demande de rente à la dernière caisse de compensation, joindre justificatifs.", delai: "3 à 4 mois avant le 1er versement souhaité", base_legale: "LAVS 21 / LAVS 29 / LAVS 40", preuve_generee: "Accusé de réception" },
      { numero: 3, action: "Décision de rente", delai: "60 à 120 jours", branches: [{ si: "rente accordée au montant attendu", alors: "versement mensuel (fin courante)" }, { si: "rente inférieure ou refus", alors: "etape 4 (opposition/recours)" }] },
      { numero: 4, action: "Opposition puis recours au tribunal cantonal des assurances", description: "Opposition dans 30 jours puis recours juridictionnel.", delai: "30 jours dès notification", base_legale: "LPGA 52 / LPGA 56 / LAVS 35" }
    ]
  }],

  // ─── BAIL (5) ──────────────────────────────────────────────────────────────
  bail_parking: [{
    titre: "Litige sur la location d'une place de parc",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Vérification du contrat", description: "Identifier si la place est louée séparément (CO 253a) ou liée au logement principal; rassembler le contrat et les factures.", delai: "immédiat", preuve_generee: "Contrat + analyse" },
      { numero: 2, action: "Notification écrite au bailleur", description: "Adresser une lettre recommandée précisant le grief (loyer abusif, résiliation, défaut) et les attentes.", delai: "dans les 30 jours", base_legale: "CO 253a / CO 266c", preuve_generee: "Lettre AR" },
      { numero: 3, action: "Délai de réponse", delai: "30 jours", branches: [{ si: "accord trouvé", alors: "fin (régularisation)" }, { si: "refus", alors: "etape 4 (autorité de conciliation)" }] },
      { numero: 4, action: "Saisine de l'autorité paritaire de conciliation des baux", description: "Requête gratuite à l'autorité paritaire cantonale (CPC 197 ss).", delai: "30 jours pour contestation de résiliation; 5 ans pour créances", base_legale: "CO 274 / CPC 197" }
    ]
  }],
  bail_cave_grenier: [{
    titre: "Litige sur cave, grenier ou local accessoire",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Constat de l'usage et défauts", description: "Documenter l'utilisation du local accessoire (cave, grenier), photographier d'éventuels défauts (humidité, accès).", delai: "immédiat", preuve_generee: "Photos horodatées + inventaire" },
      { numero: 2, action: "Notification écrite au bailleur", description: "Lettre recommandée précisant le défaut ou le différend, demande de réparation ou de mise en jouissance (CO 256/259a).", delai: "dans les 14 jours", base_legale: "CO 253a / CO 256 / CO 259a", preuve_generee: "Lettre AR + photos" },
      { numero: 3, action: "Délai de réparation/réponse", delai: "30 jours", branches: [{ si: "réparation effectuée", alors: "fin" }, { si: "absence de réaction", alors: "etape 4 (conciliation)" }] },
      { numero: 4, action: "Saisine de l'autorité paritaire de conciliation des baux", description: "Requête gratuite pour faire trancher (réduction de loyer, exécution).", delai: "à tout moment selon objet", base_legale: "CO 259g / CPC 197" }
    ]
  }],
  bail_faillite_locataire: [{
    titre: "Conséquences de la faillite du locataire sur le bail",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Information de la masse en faillite et du bailleur", description: "Communiquer l'ouverture de faillite à l'office des faillites et au bailleur; rassembler le contrat et les arriérés.", delai: "dès l'ouverture de la faillite", preuve_generee: "Notification écrite + extrait OFF" },
      { numero: 2, action: "Demande de sûretés au locataire failli", description: "Le bailleur peut, en cours de bail, exiger des sûretés pour les loyers à venir (CO 266h); à défaut, résilier de manière anticipée.", delai: "sans délai dès connaissance de la faillite", base_legale: "CO 266h / CO 257d / CO 257e", preuve_generee: "Lettre AR exigeant sûretés" },
      { numero: 3, action: "Délai pour fournir les sûretés", delai: "30 jours (raisonnable)", branches: [{ si: "sûretés fournies par la masse", alors: "continuation du bail" }, { si: "absence de sûretés", alors: "etape 4 (résiliation extraordinaire)" }] },
      { numero: 4, action: "Résiliation extraordinaire et restitution", description: "Résilier le bail avec effet immédiat (CO 266h) puis demander restitution; produire la créance dans la faillite.", delai: "immédiat après échéance des 30 jours", base_legale: "CO 266h / LP 211" }
    ]
  }],
  bail_droit_preemption: [{
    titre: "Exercice du droit de préemption du locataire",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Vérification de l'existence du droit", description: "Lire le contrat de bail / acte notarié pour identifier la clause de préemption (CO 216) ou le droit légal applicable.", delai: "immédiat dès information de la vente", preuve_generee: "Note d'analyse contractuelle" },
      { numero: 2, action: "Notification de l'intention d'exercer le droit", description: "Adresser une déclaration formelle (recommandée) au vendeur dans le délai prévu (souvent 3 mois dès notification de la vente).", delai: "3 mois dès notification (sauf clause spéciale)", base_legale: "CO 216 / CC 681", preuve_generee: "Lettre AR" },
      { numero: 3, action: "Conclusion de la vente aux conditions notifiées", delai: "selon convention", branches: [{ si: "vente conclue avec le préemptaire", alors: "transfert de propriété (fin)" }, { si: "refus du vendeur ou contestation", alors: "etape 4 (action judiciaire)" }] },
      { numero: 4, action: "Action judiciaire en exécution du droit", description: "Saisir le tribunal civil pour faire exécuter le droit de préemption.", delai: "selon procédure", base_legale: "CO 216 / CC 681" }
    ]
  }],
  bail_droit_retractation: [{
    titre: "Rétractation/annulation d'un bail conclu sous pression",
    domaine: "bail",
    etapes: [
      { numero: 1, action: "Identification du vice du consentement", description: "Préciser le vice (erreur, dol, crainte fondée — CO 23 ss) et rassembler les preuves (échanges, témoignages).", delai: "immédiat dès découverte du vice", preuve_generee: "Note de motivation + dossier de preuves" },
      { numero: 2, action: "Notification écrite d'invalidation", description: "Notifier au bailleur, par lettre recommandée, l'invalidation du contrat dans le délai d'un an (CO 31).", delai: "dans l'année dès découverte du vice", base_legale: "CO 23 / CO 31 / CO 264", preuve_generee: "Lettre AR" },
      { numero: 3, action: "Délai de réaction du bailleur", delai: "30 jours", branches: [{ si: "acceptation de l'invalidation", alors: "résolution (fin)" }, { si: "refus", alors: "etape 4 (action judiciaire)" }] },
      { numero: 4, action: "Action en constatation de l'invalidité", description: "Saisir le tribunal civil pour faire constater l'invalidité et obtenir restitution.", delai: "1 an dès découverte (CO 31)", base_legale: "CO 23 / CO 31 / CPC 197" }
    ]
  }],

  // ─── DETTES (5) ────────────────────────────────────────────────────────────
  dettes_acte_defaut_biens_effets: [{
    titre: "Effets et gestion d'un acte de défaut de biens",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Réception et lecture de l'acte", description: "Examiner l'acte (montant, créancier, date, type définitif/après saisie) et conserver l'original.", delai: "immédiat", preuve_generee: "Copie annotée de l'ADB" },
      { numero: 2, action: "Information du débiteur et négociation éventuelle", description: "Le débiteur peut entrer en pourparlers avec le créancier pour proposer un plan de remboursement (LP 149a).", delai: "dans les 30 jours", base_legale: "LP 149 / LP 149a", preuve_generee: "Lettre AR ou accord écrit" },
      { numero: 3, action: "Suivi de la prescription et du retour à meilleure fortune", delai: "20 ans (prescription) / vérification au cas par cas", branches: [{ si: "remboursement intégral ou prescription atteinte", alors: "extinction (fin)" }, { si: "nouvelle poursuite par le créancier", alors: "etape 4 (opposition selon situation)" }] },
      { numero: 4, action: "Opposition et exception de non-retour à meilleure fortune", description: "En cas de nouvelle poursuite, faire opposition et invoquer l'exception devant le juge.", delai: "10 jours pour l'opposition", base_legale: "LP 149a / LP 265a" }
    ]
  }],
  dettes_poursuite_effets_change: [{
    titre: "Procédure de poursuite par voie de change",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Vérification de la créance cambiaire", description: "Examiner la lettre de change ou le billet à ordre (forme, signature, échéance) et préparer la requête.", delai: "immédiat dès l'échéance", preuve_generee: "Original ou copie certifiée du titre" },
      { numero: 2, action: "Réquisition de poursuite par voie de change", description: "Déposer la réquisition à l'office des poursuites compétent et obtenir un commandement de payer spécifique (LP 177).", delai: "dans le délai de prescription cambiaire (généralement 3 ans)", base_legale: "LP 177 / LP 182", preuve_generee: "Copie de la réquisition + commandement" },
      { numero: 3, action: "Délai d'opposition raccourci (5 jours)", delai: "5 jours dès notification du commandement", branches: [{ si: "opposition formée", alors: "etape 4 (procédure de mainlevée)" }, { si: "absence d'opposition", alors: "saisie immédiate (fin)" }] },
      { numero: 4, action: "Procédure de mainlevée provisoire devant le juge", description: "Le créancier requiert mainlevée provisoire au juge avec le titre cambiaire.", delai: "selon procédure cantonale (souvent quelques semaines)", base_legale: "LP 182 / LP 84" }
    ]
  }],
  dettes_for_poursuite: [{
    titre: "Détermination du for de la poursuite",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Identification du for applicable", description: "Vérifier le domicile du débiteur (LP 46), siège pour personne morale, exceptions (immeuble LP 51, séquestre LP 52).", delai: "immédiat", preuve_generee: "Note d'identification du for" },
      { numero: 2, action: "Réquisition de poursuite à l'office compétent", description: "Adresser la réquisition à l'office des poursuites du domicile/siège correct.", delai: "dans les 30 jours", base_legale: "LP 46 / LP 48 / LP 51", preuve_generee: "Quittance de l'office" },
      { numero: 3, action: "Commandement de payer", delai: "10 jours pour faire opposition", branches: [{ si: "opposition", alors: "procédure de mainlevée" }, { si: "for contesté par le débiteur", alors: "etape 4 (plainte LP 17)" }] },
      { numero: 4, action: "Plainte à l'autorité de surveillance LP", description: "Plainte écrite à l'autorité cantonale de surveillance pour incompétence territoriale.", delai: "10 jours dès la notification de la mesure contestée", base_legale: "LP 17" }
    ]
  }],
  dettes_budget_conseil: [{
    titre: "Recours à un conseil en désendettement",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Auto-bilan financier", description: "Lister revenus, dépenses fixes, dettes, poursuites en cours; rassembler relevés bancaires des 6 derniers mois.", delai: "immédiat", preuve_generee: "Bilan personnel" },
      { numero: 2, action: "Prise de contact avec un service spécialisé", description: "Contacter Caritas, Centre social protestant, Dettes Conseils Suisse — service souvent gratuit.", delai: "dans les 14 jours", base_legale: "LCC 28 / LCC 3", preuve_generee: "Confirmation de rendez-vous" },
      { numero: 3, action: "Élaboration du plan de désendettement", delai: "1 à 3 mois", branches: [{ si: "plan accepté par les créanciers", alors: "exécution (fin)" }, { si: "refus de certains créanciers", alors: "etape 4 (saisine de l'autorité ou procédure formelle)" }] },
      { numero: 4, action: "Procédure de concordat extrajudiciaire ou faillite personnelle", description: "Selon situation : assainissement personnel via art. 333 ss LP ou ouverture d'une faillite à demande du débiteur.", delai: "selon procédure", base_legale: "LP 333 ss / LP 191" }
    ]
  }],
  dettes_assainissement_financier: [{
    titre: "Assainissement financier personnel",
    domaine: "dettes",
    etapes: [
      { numero: 1, action: "Bilan exhaustif et minimum vital", description: "Établir bilan complet et calculer le minimum vital (LP 93) en respectant les normes cantonales.", delai: "immédiat", preuve_generee: "Bilan + calcul du minimum vital" },
      { numero: 2, action: "Négociation avec les créanciers", description: "Adresser à chaque créancier une proposition de plan d'assainissement (rééchelonnement, remise partielle).", delai: "dans les 60 jours suivant le bilan", base_legale: "LP 93 / LP 149a", preuve_generee: "Plan écrit + lettres AR" },
      { numero: 3, action: "Délai de réponse des créanciers", delai: "60 jours", branches: [{ si: "majorité des créanciers acceptent", alors: "exécution du plan (fin)" }, { si: "blocage", alors: "etape 4 (concordat extrajudiciaire)" }] },
      { numero: 4, action: "Concordat extrajudiciaire ou autre procédure formelle", description: "Saisir le juge d'un concordat (LP 333 ss) ou d'une faillite à la demande du débiteur (LP 191).", delai: "selon situation", base_legale: "LP 333 ss / LP 191" }
    ]
  }]
};

// ============================================================================
// Application
// ============================================================================

const FILES_BY_DOMAIN = {
  accident: 'accident.json',
  assurance: 'assurances.json',
  bail: 'bail.json',
  dettes: 'dettes.json',
  entreprise: 'entreprise.json',
  etranger: 'etrangers.json',
  famille: 'famille.json',
  social: 'social.json',
  travail: 'travail.json',
  violence: 'violence.json'
};

// Liste des fiches à traiter par fichier
const TARGETS = {
  'accident.json': ['accident_invalidite_suite', 'accident_faute_concomitante', 'accident_prescription_rc', 'accident_domestique_responsabilite'],
  'assurances.json': ['assurance_chomage_indemnites_conditions', 'assurance_allocations_familiales', 'assurance_maternite_apg', 'assurance_avs_rente_vieillesse'],
  'bail.json': ['bail_parking', 'bail_cave_grenier', 'bail_faillite_locataire', 'bail_droit_preemption', 'bail_droit_retractation'],
  'dettes.json': ['dettes_acte_defaut_biens_effets', 'dettes_poursuite_effets_change', 'dettes_for_poursuite', 'dettes_budget_conseil', 'dettes_assainissement_financier'],
  'entreprise.json': ['entreprise_sursis_concordataire', 'entreprise_creation_sarl', 'entreprise_creation_sa', 'entreprise_conflit_associes_sarl', 'entreprise_dissolution_societe', 'entreprise_surendettement_personne_morale'],
  'etrangers.json': ['etranger_permis_travail', 'etranger_naturalisation_facilitee', 'etranger_integration_criteres', 'etranger_cours_langue_obligatoires', 'etranger_aide_sociale_permis', 'etranger_travail_asile', 'etranger_permis_frontalier_g', 'etranger_detachement_travailleurs', 'etranger_reconnaissance_diplomes', 'etranger_assurances_sociales', 'etranger_double_nationalite', 'etranger_apatridie', 'etranger_mna_mineurs', 'etranger_dublin_transfert'],
  'famille.json': ['famille_mariage_etranger', 'famille_partenariat_enregistre', 'famille_enlevement_international', 'famille_reconnaissance_paternite_procedure', 'famille_nom_famille', 'famille_regime_matrimonial', 'famille_liquidation_regime', 'famille_succession_ab_intestat', 'famille_pacte_successoral', 'famille_reserve_hereditaire', 'famille_indignite_successorale', 'famille_executeur_testamentaire', 'famille_usufruit_conjoint', 'famille_droit_retour'],
  'social.json': ['social_remboursement_aide', 'social_sanspapiers_aide_urgence', 'social_csias_forfait', 'social_personne_agee_prestations', 'social_dettes_coexistence', 'social_dignite_minimale', 'social_reinsertion_professionnelle'],
  'travail.json': ['travail_secret_professionnel', 'travail_orp_inscription', 'travail_convention_collective', 'travail_temporaire', 'travail_stagiaire', 'travail_apprenti', 'travail_gratification', 'travail_surveillance'],
  'violence.json': ['violence_foyer_accueil', 'violence_eloignement_domicile_penal', 'violence_mariage_force', 'violence_stalking_harcelement', 'violence_foyer_refuge', 'violence_psychologique_preuves', 'violence_garde_enfants']
};

let totalAdded = 0, totalSkipped = 0, missing = [];

for (const [filename, ids] of Object.entries(TARGETS)) {
  const filePath = path.join(FICHES_DIR, filename);
  const fiches = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let mutated = false;
  for (const id of ids) {
    const fiche = fiches.find(f => f.id === id);
    if (!fiche) {
      missing.push(`${filename}:${id}`);
      continue;
    }
    if (Array.isArray(fiche.cascades) && fiche.cascades.length > 0) {
      totalSkipped++;
      continue;
    }
    const cascade = CASCADES[id];
    if (!cascade) {
      missing.push(`No cascade defined for ${id}`);
      continue;
    }
    fiche.cascades = cascade;
    totalAdded++;
    mutated = true;
  }
  if (mutated) {
    fs.writeFileSync(filePath, JSON.stringify(fiches, null, 2) + '\n', 'utf8');
    console.log(`✓ Updated ${filename}`);
  }
}

console.log(`\n=== Phase Cortex 4 Summary ===`);
console.log(`Cascades ajoutées : ${totalAdded}`);
console.log(`Fiches déjà avec cascade (skip) : ${totalSkipped}`);
if (missing.length) {
  console.log(`\nManquants :`);
  missing.forEach(m => console.log(`  - ${m}`));
}
