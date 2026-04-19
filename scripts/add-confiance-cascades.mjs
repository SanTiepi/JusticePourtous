#!/usr/bin/env node
// Applique TÂCHE 1 (confiance sur toutes fiches) et TÂCHE 2 (cascades sur 12 fiches clés)
// - TÂCHE 1 : ajoute `confiance` à la racine de chaque fiche sans toucher à l'existant
// - TÂCHE 2 : ajoute `cascades` (1 cascade structurée) aux fiches golden

import fs from 'node:fs';
import path from 'node:path';

const FICHES_DIR = path.resolve('src/data/fiches');
const DOMAINES = [
  'accident','assurances','bail','dettes','entreprise',
  'etrangers','famille','social','travail','violence'
];

// ---------- Règles de confiance ----------
function isJurisprudenceTF(j) {
  if (!j || !j.ref) return false;
  const ref = String(j.ref).trim();
  // TF, ATF, Bger, BGer, ainsi que numéros TF "4A_..." sont fédéraux
  return /^(TF|ATF|BGE|BGer|Bger)\b/i.test(ref) || /^\d[A-Z]_\d+\/\d{4}/i.test(ref);
}

function computeConfiance(fiche) {
  const articles = (fiche.reponse && Array.isArray(fiche.reponse.articles))
    ? fiche.reponse.articles : [];
  const juris = (fiche.reponse && Array.isArray(fiche.reponse.jurisprudence))
    ? fiche.reponse.jurisprudence : [];
  const nbArticles = articles.length;
  const nbJurisTF = juris.filter(isJurisprudenceTF).length;

  const expl1 = (fiche.explication || '').length;
  const expl2 = (fiche.reponse && fiche.reponse.explication) ? fiche.reponse.explication.length : 0;
  const totalExpl = expl1 + expl2;

  // Contenu indigent → variable
  if (totalExpl < 500) return 'variable';

  // >=2 articles ET >=1 TF → probable
  if (nbArticles >= 2 && nbJurisTF >= 1) return 'probable';

  // >=1 article mais pas de TF → variable
  if (nbArticles >= 1 && nbJurisTF === 0) return 'variable';

  // Défaut raisonnable
  return 'probable';
}

// ---------- Cascades (12 fiches clés) ----------
const CASCADES = {
  // BAIL
  'bail_defaut_moisissure': [{
    titre: 'Résolution du défaut moisissure',
    domaine: 'bail',
    etapes: [
      { numero: 1, action: 'Constat du défaut', description: 'Photographier la moisissure, dater les clichés, noter l\'étendue (m²), pièces touchées, signes associés (odeur, condensation).', delai: 'immédiat', preuve_generee: 'Photos horodatées + constat écrit daté' },
      { numero: 2, action: 'Notification écrite au bailleur', description: 'Courrier recommandé au bailleur/régie avec photos jointes et mise en demeure de réparer (art. 259a CO).', delai: 'dans les 7 jours', base_legale: 'CO 259a', preuve_generee: 'Accusé de réception postal' },
      { numero: 3, action: 'Délai de réparation', description: 'Laisser un délai raisonnable au bailleur pour intervenir (typiquement 30 jours selon gravité).', delai: '30 jours', branches: [ { si: 'travaux effectués', alors: 'fin du processus' }, { si: 'pas d\'action', alors: 'etape 4 (consignation et/ou conciliation)' } ] },
      { numero: 4, action: 'Saisine de l\'autorité de conciliation en matière de baux', description: 'Requête gratuite à l\'autorité paritaire cantonale pour demander réduction de loyer et/ou consignation (art. 259g CO).', delai: 'immédiat après défaut du bailleur', base_legale: 'CO 259g / CO 274 / CPC 197', cout: 'Gratuit' }
    ]
  }],

  'bail_resiliation_conteste': [{
    titre: 'Contestation d\'une résiliation de bail',
    domaine: 'bail',
    etapes: [
      { numero: 1, action: 'Vérification de la forme de la résiliation', description: 'Contrôler formule officielle cantonale, signature du bailleur, respect du délai et terme de congé, motif.', delai: 'immédiat à réception', preuve_generee: 'Copie du congé et enveloppe datée' },
      { numero: 2, action: 'Collecte des éléments de contestation', description: 'Rassembler preuves (échanges, travaux, hausses de loyer récentes, motif réel soupçonné) pour établir le caractère abusif ou formel.', delai: 'sous 15 jours', base_legale: 'CO 271 / CO 271a' },
      { numero: 3, action: 'Dépôt de la requête en contestation', description: 'Déposer la contestation auprès de l\'autorité de conciliation en matière de baux du canton par courrier recommandé.', delai: '30 jours dès réception du congé', base_legale: 'CO 273 al. 1', preuve_generee: 'Récépissé de dépôt', cout: 'Gratuit' },
      { numero: 4, action: 'Audience de conciliation', description: 'Comparution devant l\'autorité. En cas d\'échec, demander la prolongation du bail (art. 272) ou obtenir une autorisation de procéder au tribunal des baux.', delai: '~2 mois après dépôt', branches: [ { si: 'accord trouvé', alors: 'PV de conciliation exécutoire' }, { si: 'échec', alors: 'saisine du tribunal des baux dans 30 jours' } ] }
    ]
  }],

  'bail_augmentation_loyer': [{
    titre: 'Contestation d\'une hausse de loyer',
    domaine: 'bail',
    etapes: [
      { numero: 1, action: 'Vérification formelle de la hausse', description: 'Contrôler formule officielle cantonale, motivation écrite, respect du délai de préavis (au minimum délai de congé + 10 jours).', delai: 'immédiat à réception', base_legale: 'CO 269d', preuve_generee: 'Copie de la formule officielle' },
      { numero: 2, action: 'Calcul du loyer admissible', description: 'Vérifier taux hypothécaire de référence OFL, IPC, hausses de charges invoquées et comparaison statistique. Identifier d\'éventuels rendements excessifs.', delai: 'sous 15 jours', base_legale: 'CO 269 / CO 269a' },
      { numero: 3, action: 'Dépôt de la contestation', description: 'Requête auprès de l\'autorité de conciliation en matière de baux du canton, par recommandé.', delai: '30 jours dès réception de la hausse', base_legale: 'CO 270b', preuve_generee: 'Accusé de dépôt', cout: 'Gratuit' },
      { numero: 4, action: 'Audience de conciliation', description: 'Négociation devant l\'autorité paritaire. Accord ou échec conditionnant la suite.', delai: '~2 mois après dépôt', branches: [ { si: 'accord', alors: 'PV exécutoire, hausse ajustée ou annulée' }, { si: 'échec', alors: 'saisine du tribunal des baux dans 30 jours' } ] }
    ]
  }],

  'bail_depot_garantie': [{
    titre: 'Récupération d\'une garantie de loyer non restituée',
    domaine: 'bail',
    etapes: [
      { numero: 1, action: 'État des lieux de sortie et décompte final', description: 'Exiger un état des lieux contradictoire signé et demander le décompte écrit des retenues éventuelles invoquées par le bailleur.', delai: 'le jour de la restitution des clés', base_legale: 'CO 267a', preuve_generee: 'Procès-verbal d\'état des lieux signé' },
      { numero: 2, action: 'Courrier recommandé de demande de libération', description: 'Écrire au bailleur et à la banque détenant la garantie pour demander la libération ; joindre PV et décompte contesté.', delai: 'sous 30 jours après sortie', base_legale: 'CO 257e', preuve_generee: 'Copie + accusé de réception' },
      { numero: 3, action: 'Délai d\'action du bailleur', description: 'La banque libère automatiquement la garantie si le bailleur n\'a pas fait valoir de prétention en justice dans l\'année suivant la fin du bail.', delai: '1 an après fin du bail', base_legale: 'CO 257e al. 3', branches: [ { si: 'aucune action du bailleur', alors: 'libération automatique par la banque' }, { si: 'bailleur introduit une action', alors: 'etape 4' } ] },
      { numero: 4, action: 'Saisine de l\'autorité de conciliation', description: 'En cas de refus ou de retenue injustifiée, déposer une requête gratuite auprès de l\'autorité de conciliation en matière de baux.', delai: 'immédiat après refus', base_legale: 'CPC 197 / CO 274', cout: 'Gratuit' }
    ]
  }],

  // TRAVAIL
  'travail_licenciement_maladie': [{
    titre: 'Contestation d\'un licenciement en période de maladie',
    domaine: 'travail',
    etapes: [
      { numero: 1, action: 'Documenter l\'incapacité et la date du congé', description: 'Réunir certificats médicaux couvrant la période, copie du congé, calendrier précis (date de réception du congé vs début/durée de la protection CO 336c).', delai: 'immédiat', base_legale: 'CO 336c', preuve_generee: 'Dossier médical + copie du congé daté' },
      { numero: 2, action: 'Opposition écrite à l\'employeur', description: 'Courrier recommandé invoquant la nullité du congé donné en temps inopportun, ou le caractère abusif, et maintien à disposition.', delai: 'sans délai, au plus vite après réception', base_legale: 'CO 336c / CO 336', preuve_generee: 'Accusé de réception' },
      { numero: 3, action: 'Tentative de conciliation', description: 'Saisir l\'autorité de conciliation compétente en matière de droit du travail du canton (gratuit jusqu\'à 30 000 CHF de valeur litigieuse).', delai: 'sans attendre', base_legale: 'CPC 197 / LTr', cout: 'Gratuit jusqu\'à 30\'000 CHF' },
      { numero: 4, action: 'Action devant le Tribunal des prud\'hommes', description: 'Si pas d\'accord, saisir le tribunal pour faire constater la nullité (réintégration et salaire) ou obtenir l\'indemnité pour congé abusif (max 6 mois de salaire).', delai: 'selon délais fixés par l\'autorité de conciliation', base_legale: 'CO 336a', preuve_generee: 'Jugement' }
    ]
  }],

  'travail_licenciement_abusif': [{
    titre: 'Action en indemnité pour licenciement abusif',
    domaine: 'travail',
    etapes: [
      { numero: 1, action: 'Analyse du motif du congé', description: 'Identifier les indices de congé abusif : représailles, motif discriminatoire, atteinte à la personnalité, dénonciation de bonne foi.', delai: 'immédiat à réception', base_legale: 'CO 336' },
      { numero: 2, action: 'Opposition écrite au licenciement', description: 'Faire opposition par courrier recommandé AVANT l\'échéance du délai de congé. Sans opposition, le droit à l\'indemnité est perdu.', delai: 'avant la fin du délai de congé', base_legale: 'CO 336b al. 1', preuve_generee: 'Copie + accusé de réception' },
      { numero: 3, action: 'Saisine de l\'autorité de conciliation', description: 'Après la fin des rapports de travail, déposer la requête en paiement de l\'indemnité auprès de l\'autorité cantonale.', delai: '180 jours après la fin des rapports de travail', base_legale: 'CO 336b al. 2', cout: 'Gratuit jusqu\'à 30\'000 CHF' },
      { numero: 4, action: 'Action au tribunal des prud\'hommes', description: 'Si échec conciliation, saisine du tribunal. Indemnité jusqu\'à 6 mois de salaire selon gravité.', delai: '30 jours dès autorisation de procéder', base_legale: 'CO 336a', branches: [ { si: 'transaction', alors: 'fin' }, { si: 'jugement favorable', alors: 'exécution forcée si refus employeur' } ] }
    ]
  }],

  'travail_salaire_impaye': [{
    titre: 'Recouvrement d\'un salaire impayé',
    domaine: 'travail',
    etapes: [
      { numero: 1, action: 'Calcul et constat du salaire dû', description: 'Établir le décompte précis (brut, net, heures supplémentaires, vacances, 13e, indemnités) et conserver contrats, fiches de paie et communications.', delai: 'immédiat', base_legale: 'CO 322 ss', preuve_generee: 'Décompte écrit + pièces justificatives' },
      { numero: 2, action: 'Mise en demeure écrite', description: 'Courrier recommandé à l\'employeur fixant un délai de paiement (10 à 30 jours) avec menace de poursuite.', delai: 'sans délai, au plus 30 jours après échéance', base_legale: 'CO 102 / CO 323', preuve_generee: 'Accusé de réception postal' },
      { numero: 3, action: 'Conciliation et/ou poursuite', description: 'Au choix : requête de conciliation gratuite (prud\'hommes) ou réquisition de poursuite à l\'Office des poursuites.', delai: 'dès l\'expiration de la mise en demeure', base_legale: 'CPC 197 / LP 38 ss', branches: [ { si: 'pas d\'opposition du débiteur', alors: 'continuation de la poursuite' }, { si: 'opposition', alors: 'mainlevée ou action au fond' } ] },
      { numero: 4, action: 'Jugement et exécution forcée', description: 'Obtenir un jugement du tribunal des prud\'hommes ou une mainlevée, puis requérir saisie de salaire/biens.', delai: 'selon procédure', base_legale: 'LP 88 ss', cout: 'Gratuit jusqu\'à 30\'000 CHF au fond' }
    ]
  }],

  'travail_harcelement': [{
    titre: 'Action contre un harcèlement au travail',
    domaine: 'travail',
    etapes: [
      { numero: 1, action: 'Documenter les faits', description: 'Tenir un journal détaillé (dates, lieux, témoins, captures, messages), conserver toute preuve médicale (arrêts, consultations) et témoignages.', delai: 'immédiat et continu', base_legale: 'CO 328 / LTr 6 / OLT3 2', preuve_generee: 'Journal + pièces médicales + témoignages écrits' },
      { numero: 2, action: 'Signalement interne à l\'employeur', description: 'Alerter par écrit (RH, supérieur hiérarchique, personne de confiance) en demandant des mesures de protection concrètes.', delai: 'dès les premiers faits', base_legale: 'CO 328', preuve_generee: 'Copie + accusé de réception' },
      { numero: 3, action: 'Recours aux autorités compétentes', description: 'Si inaction : saisir l\'inspection du travail cantonale, le Bureau de l\'égalité (si harcèlement sexuel, LEg), ou le médecin du travail.', delai: 'après échec du signalement interne', base_legale: 'LEg 4 / LTr 54', cout: 'Gratuit' },
      { numero: 4, action: 'Actions civiles et pénales', description: 'Selon gravité : action civile en protection de la personnalité et indemnité (CO 328, LEg 5), plainte pénale (CP 177, 180, 181, 193), résiliation avec justes motifs (CO 337) si situation intenable.', delai: 'selon prescription (3 mois plainte pénale pour la plupart des faits)', base_legale: 'CO 328 / CO 337 / CP 177 ss / LEg 5', branches: [ { si: 'harcèlement sexuel prouvé', alors: 'indemnité LEg jusqu\'à 6 mois de salaire' }, { si: 'atteinte grave à la santé', alors: 'démission justes motifs + dommages-intérêts' } ] }
    ]
  }],

  // DETTES
  'dettes_commandement_payer': [{
    titre: 'Réponse à un commandement de payer',
    domaine: 'dettes',
    etapes: [
      { numero: 1, action: 'Lecture immédiate et vérification du titre', description: 'Contrôler créancier, montant, cause de l\'obligation, date de notification. Conserver l\'enveloppe et l\'acte original.', delai: 'immédiat à notification', base_legale: 'LP 69', preuve_generee: 'Copie du commandement + enveloppe' },
      { numero: 2, action: 'Former opposition totale', description: 'Au guichet de l\'Office des poursuites ou par écrit recommandé à celui-ci. Aucune motivation n\'est requise, c\'est gratuit.', delai: '10 jours dès notification', base_legale: 'LP 74', preuve_generee: 'Récépissé d\'opposition', cout: 'Gratuit' },
      { numero: 3, action: 'Attente de la réaction du créancier', description: 'Le créancier a 1 an pour demander la mainlevée (provisoire/définitive) ou ouvrir action au fond, sinon la poursuite tombe.', delai: 'jusqu\'à 1 an', base_legale: 'LP 88', branches: [ { si: 'créancier inactif', alors: 'poursuite périmée' }, { si: 'requête en mainlevée', alors: 'etape 4' } ] },
      { numero: 4, action: 'Audience de mainlevée ou procès au fond', description: 'Se défendre devant le juge : contester le titre, invoquer prescription, paiement, compensation. Si mainlevée, possibilité d\'action en libération de dette (LP 83).', delai: 'selon citation', base_legale: 'LP 80 ss / LP 83', cout: 'Frais de justice selon canton' }
    ]
  }],

  'dettes_saisie_salaire': [{
    titre: 'Contestation du minimum vital dans une saisie de salaire',
    domaine: 'dettes',
    etapes: [
      { numero: 1, action: 'Réunir les justificatifs de charges', description: 'Rassembler loyer, assurance-maladie, frais de transport, pension alimentaire, frais médicaux, garde d\'enfants, frais professionnels.', delai: 'dès convocation par l\'OP', base_legale: 'LP 93', preuve_generee: 'Pièces justificatives classées' },
      { numero: 2, action: 'Audition devant l\'Office des poursuites', description: 'Se présenter avec tous justificatifs, demander le calcul détaillé du minimum vital selon les normes cantonales en vigueur.', delai: 'à la date fixée par l\'OP', base_legale: 'LP 91 / LP 93', preuve_generee: 'Procès-verbal de saisie' },
      { numero: 3, action: 'Plainte contre le procès-verbal de saisie', description: 'Si le minimum vital est sous-évalué : plainte à l\'autorité de surveillance des poursuites.', delai: '10 jours dès communication', base_legale: 'LP 17', cout: 'Gratuit' },
      { numero: 4, action: 'Demande de révision', description: 'Si la situation change (perte d\'emploi, maladie, nouvelle charge), demander à l\'OP de recalculer la saisie.', delai: 'en tout temps pendant la saisie', base_legale: 'LP 93 al. 3', branches: [ { si: 'charges nouvelles reconnues', alors: 'quotité saisissable réduite' }, { si: 'refus', alors: 'nouvelle plainte LP 17' } ] }
    ]
  }],

  // FAMILLE
  'famille_pension_impayee': [{
    titre: 'Recouvrement d\'une pension alimentaire impayée',
    domaine: 'famille',
    etapes: [
      { numero: 1, action: 'Mise en demeure du débiteur', description: 'Courrier recommandé réclamant les arriérés avec décompte précis et délai de paiement (typiquement 10 jours).', delai: 'dès 1er impayé', base_legale: 'CC 289', preuve_generee: 'Copie + accusé de réception' },
      { numero: 2, action: 'Saisine du BRAPA (bureau de recouvrement cantonal)', description: 'Demander l\'avance et/ou le recouvrement de la pension auprès du service cantonal compétent. Conditions variables selon canton.', delai: 'dès 1-3 mois d\'impayé selon canton', base_legale: 'OAiR / LAVI cantonale', cout: 'Gratuit' },
      { numero: 3, action: 'Poursuite pour dettes', description: 'Réquisition de poursuite à l\'Office des poursuites du domicile du débiteur (la pension bénéficie d\'un rang privilégié en cas de faillite).', delai: 'dès exigibilité', base_legale: 'LP 38 / LP 219', preuve_generee: 'Commandement de payer' },
      { numero: 4, action: 'Plainte pénale pour violation d\'une obligation d\'entretien', description: 'Si le débiteur a les moyens et refuse : plainte pénale dans les 3 mois dès connaissance de l\'acte et de l\'auteur.', delai: '3 mois dès connaissance', base_legale: 'CP 217', branches: [ { si: 'débiteur solvable mais de mauvaise foi', alors: 'condamnation pénale possible' }, { si: 'débiteur insolvable', alors: 'avances cantonales uniquement' } ] }
    ]
  }],

  // ETRANGERS
  'etranger_permis_b_renouvellement': [{
    titre: 'Renouvellement ou recours concernant un permis B',
    domaine: 'etrangers',
    etapes: [
      { numero: 1, action: 'Dépôt de la demande de renouvellement', description: 'Déposer le formulaire cantonal complet (pièces d\'identité, contrat de travail, attestation de non-poursuite, justificatifs de revenus et de logement) au moins 3 mois avant l\'échéance.', delai: 'au moins 3 mois avant échéance du permis', base_legale: 'LEI 33 / OASA 59', preuve_generee: 'Quittance de dépôt' },
      { numero: 2, action: 'Suivi et fourniture de pièces complémentaires', description: 'Répondre rapidement aux demandes de l\'autorité migratoire cantonale (SPOP/OCPM…) ; conserver copies et accusés.', delai: 'dans le délai imparti par l\'autorité (typiquement 10-30 jours)', base_legale: 'PA 13 / LEI 90' },
      { numero: 3, action: 'Droit d\'être entendu avant décision négative', description: 'En cas de refus envisagé, l\'autorité doit permettre de se déterminer par écrit. Utiliser ce droit pour produire tous les éléments favorables (intégration, famille, emploi).', delai: 'dans le délai fixé par l\'autorité', base_legale: 'Cst 29 al. 2 / PA 30', preuve_generee: 'Prise de position écrite' },
      { numero: 4, action: 'Recours contre la décision de refus', description: 'Recours auprès de l\'autorité cantonale supérieure, puis éventuellement Tribunal administratif cantonal et TAF. Effet suspensif en général.', delai: '30 jours dès notification', base_legale: 'LEI 64 ss / LTAF / PA 50', cout: 'Avance de frais selon canton', branches: [ { si: 'recours admis', alors: 'renouvellement accordé' }, { si: 'recours rejeté', alors: 'recours au TAF puis TF' } ] }
    ]
  }]
};

// ---------- Application ----------
const STATS = { perDomaine: {}, cascadesAdded: [], cascadesMissing: [] };

for (const dom of DOMAINES) {
  const fp = path.join(FICHES_DIR, dom + '.json');
  const raw = fs.readFileSync(fp, 'utf8');
  const fiches = JSON.parse(raw);
  if (!Array.isArray(fiches)) {
    console.error('UNEXPECTED FORMAT for', dom);
    continue;
  }
  let modified = 0;
  let addedConfiance = 0;
  let addedCascades = 0;

  for (const fiche of fiches) {
    if (!fiche || typeof fiche !== 'object') continue;

    // TÂCHE 1 : confiance
    if (!('confiance' in fiche)) {
      const conf = computeConfiance(fiche);
      // Insérer confiance juste après `tags` (ou après `domaine`) pour cohérence
      // On reconstruit un nouvel objet avec l'ordre voulu
      const keys = Object.keys(fiche);
      const newObj = {};
      let inserted = false;
      for (const k of keys) {
        newObj[k] = fiche[k];
        if (!inserted && (k === 'tags' || (k === 'domaine' && !keys.includes('tags')))) {
          newObj.confiance = conf;
          inserted = true;
        }
      }
      if (!inserted) newObj.confiance = conf;
      // Muter la référence en place : on remplace les propriétés
      for (const k of Object.keys(fiche)) delete fiche[k];
      for (const k of Object.keys(newObj)) fiche[k] = newObj[k];
      addedConfiance++;
      modified++;
    }

    // TÂCHE 2 : cascades
    if (CASCADES[fiche.id] && !fiche.cascades) {
      fiche.cascades = CASCADES[fiche.id];
      STATS.cascadesAdded.push(fiche.id);
      addedCascades++;
      modified++;
    }
  }

  STATS.perDomaine[dom] = { total: fiches.length, modified, addedConfiance, addedCascades };

  // Écriture
  fs.writeFileSync(fp, JSON.stringify(fiches, null, 2) + '\n', 'utf8');
}

// Vérifier fiches cascade attendues mais non trouvées
const expectedCascades = Object.keys(CASCADES);
for (const id of expectedCascades) {
  if (!STATS.cascadesAdded.includes(id)) STATS.cascadesMissing.push(id);
}

console.log(JSON.stringify(STATS, null, 2));
