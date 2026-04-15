/**
 * JusticePourtous — 10 calculateurs juridiques suisses
 * Fonctions pures, résultat structuré avec source légale et disclaimer.
 */

const DISCLAIMER = "Résultat indicatif basé sur le droit suisse en vigueur. Ne remplace pas un conseil juridique personnalisé.";

// Taux de référence hypothécaire (OFL/BWO, mis à jour périodiquement)
const TAUX_REFERENCE_HYPOTHECAIRE = 1.25;

// ─── 1. Loyer abusif (rendement admissible) ───

export function calculRendementAdmissible({ prixAchat, tauxHypothequeReference, fraisEntretien = 0, chargesAnnuelles = 0 }) {
  if (!prixAchat || prixAchat <= 0) return erreur("prixAchat doit être positif");
  const taux = tauxHypothequeReference ?? TAUX_REFERENCE_HYPOTHECAIRE;
  // Formule TF : (prix achat × (taux ref + 0.5%)) + frais entretien + charges
  const rendement = prixAchat * ((taux + 0.5) / 100);
  const loyerAdmissibleAnnuel = rendement + fraisEntretien + chargesAnnuelles;
  const loyerAdmissibleMensuel = loyerAdmissibleAnnuel / 12;

  return {
    resultat: { loyerAdmissibleMensuel: arrondir(loyerAdmissibleMensuel), loyerAdmissibleAnnuel: arrondir(loyerAdmissibleAnnuel) },
    detail: {
      prixAchat,
      tauxReference: taux,
      tauxMajore: taux + 0.5,
      rendementBrut: arrondir(rendement),
      fraisEntretien,
      chargesAnnuelles
    },
    sourceLegale: "CO 269, 269a; OBLF art. 10-16; Jurisprudence TF sur le rendement admissible",
    disclaimer: DISCLAIMER
  };
}

// ─── 2. Amortissement garantie (barème SVIT) ───

const DUREE_VIE_SVIT = {
  peinture: 8,
  papier_peint: 8,
  moquette: 10,
  parquet: 25,
  lino: 15,
  cuisine: 25,
  sanitaire: 30,
  stores: 15,
  electromenager: 15,
  serrure: 20
};

export function calculAmortissementGarantie({ items }) {
  if (!items || !Array.isArray(items) || items.length === 0) return erreur("items doit être un tableau non vide");

  const details = items.map(item => {
    const dureeVie = item.dureeVie || DUREE_VIE_SVIT[item.nom] || 10;
    const age = item.age || 0;
    if (age >= dureeVie) {
      return { nom: item.nom, montantFacture: item.montantFacture, dureeVie, age, amortissement: 100, montantDu: 0 };
    }
    const amortissement = (age / dureeVie) * 100;
    const montantDu = item.montantFacture * (1 - age / dureeVie);
    return { nom: item.nom, montantFacture: item.montantFacture, dureeVie, age, amortissement: arrondir(amortissement), montantDu: arrondir(montantDu) };
  });

  const totalDu = arrondir(details.reduce((s, d) => s + d.montantDu, 0));

  return {
    resultat: { totalDu, items: details },
    detail: { methode: "Amortissement linéaire selon barème SVIT/paritaire" },
    sourceLegale: "CO 267a; Barème paritaire romand / SVIT des amortissements",
    disclaimer: DISCLAIMER
  };
}

// ─── 3. Saisie sur salaire ───

const MINIMUM_VITAL_BASE = {
  debiteur_seul: 1200,
  couple: 1700,
  enfant_moins_10: 400,
  enfant_plus_10: 600
};

export function calculSaisieSalaire({ canton, situationFamiliale = "debiteur_seul", nbEnfantsMoins10 = 0, nbEnfantsPlus10 = 0, revenuMensuelNet, loyer = 0, primeLAMal = 0, fraisTransport = 0 }) {
  if (!revenuMensuelNet || revenuMensuelNet <= 0) return erreur("revenuMensuelNet doit être positif");

  const base = MINIMUM_VITAL_BASE[situationFamiliale] || MINIMUM_VITAL_BASE.debiteur_seul;
  const supEnfants = (nbEnfantsMoins10 * MINIMUM_VITAL_BASE.enfant_moins_10) + (nbEnfantsPlus10 * MINIMUM_VITAL_BASE.enfant_plus_10);
  const minimumVital = base + supEnfants + loyer + primeLAMal + fraisTransport;
  const montantSaisissable = Math.max(0, revenuMensuelNet - minimumVital);

  return {
    resultat: { montantSaisissable: arrondir(montantSaisissable), minimumVital: arrondir(minimumVital), estProtege: montantSaisissable === 0 },
    detail: {
      baseMinimumVital: base,
      supplementEnfants: supEnfants,
      loyer, primeLAMal, fraisTransport,
      revenuMensuelNet,
      canton: canton || "CH"
    },
    sourceLegale: "LP art. 93; Lignes directrices cantonales sur le minimum vital",
    disclaimer: DISCLAIMER
  };
}

// ─── 4. Délai de congé travail ───

export function calculDelaiConge({ anciennete, periodeEssai = false, cct = null }) {
  if (anciennete == null || anciennete < 0) return erreur("anciennete doit être >= 0");

  let delaiJours, delaiTexte;

  if (periodeEssai) {
    delaiJours = 7;
    delaiTexte = "7 jours (période d'essai)";
  } else if (anciennete < 1) {
    delaiJours = 30;
    delaiTexte = "1 mois pour la fin d'un mois (1re année de service)";
  } else if (anciennete < 10) {
    delaiJours = 60;
    delaiTexte = "2 mois pour la fin d'un mois (2e à 9e année de service)";
  } else {
    delaiJours = 90;
    delaiTexte = "3 mois pour la fin d'un mois (dès la 10e année de service)";
  }

  return {
    resultat: { delaiJours, delaiTexte },
    detail: { anciennete, periodeEssai, cct: cct || "Pas de CCT spécifique" },
    sourceLegale: "CO art. 335a-335c",
    disclaimer: DISCLAIMER
  };
}

// ─── 5. Indemnité licenciement abusif ───

export function calculIndemniteLicenciement({ salaireMensuel, anciennete, circonstances = "standard" }) {
  if (!salaireMensuel || salaireMensuel <= 0) return erreur("salaireMensuel doit être positif");
  if (anciennete == null || anciennete < 0) return erreur("anciennete doit être >= 0");

  // CO 336a : indemnité max 6 mois. Estimation selon ancienneté et circonstances.
  let facteur;
  if (circonstances === "grave") {
    facteur = Math.min(6, Math.max(2, anciennete * 0.6));
  } else {
    facteur = Math.min(6, Math.max(1, anciennete * 0.4));
  }
  facteur = arrondir(facteur, 1);
  const indemniteMax = salaireMensuel * 6;
  const indemniteEstimee = arrondir(salaireMensuel * facteur);

  return {
    resultat: { indemniteEstimee, indemniteMax, facteurMois: facteur },
    detail: { salaireMensuel, anciennete, circonstances },
    sourceLegale: "CO art. 336a (indemnité max 6 mois de salaire)",
    disclaimer: DISCLAIMER
  };
}

// ─── 6. Période de protection maladie ───

export function calculProtectionMaladie({ anciennete }) {
  if (anciennete == null || anciennete < 0) return erreur("anciennete doit être >= 0");

  let joursProtection, texte;
  if (anciennete < 1) {
    // Pas de protection pendant la période d'essai (CO 336c al. 1)
    // Après l'essai mais dans la 1re année: 30 jours
    joursProtection = 30;
    texte = "30 jours (1re année de service)";
  } else if (anciennete < 6) {
    joursProtection = 90;
    texte = "90 jours (2e à 5e année de service)";
  } else {
    joursProtection = 180;
    texte = "180 jours (dès la 6e année de service)";
  }

  return {
    resultat: { joursProtection, texte },
    detail: { anciennete },
    sourceLegale: "CO art. 336c al. 1 let. b",
    disclaimer: DISCLAIMER
  };
}

// ─── 7. Pension alimentaire indicative ───

const MONTANT_BASE_ENFANT = {
  "0-5": 400,
  "6-12": 600,
  "13-18": 800,
  "18+": 950
};

function trancheAge(age) {
  if (age <= 5) return "0-5";
  if (age <= 12) return "6-12";
  if (age <= 18) return "13-18";
  return "18+";
}

export function calculPensionIndicative({ revenuDebiteur, chargesDebiteur = 0, nbEnfants, agesEnfants = [] }) {
  if (!revenuDebiteur || revenuDebiteur <= 0) return erreur("revenuDebiteur doit être positif");
  if (!nbEnfants || nbEnfants <= 0) return erreur("nbEnfants doit être >= 1");

  const disponible = revenuDebiteur - chargesDebiteur;
  const detailEnfants = agesEnfants.map((age, i) => {
    const tranche = trancheAge(age);
    return { enfant: i + 1, age, tranche, montantBase: MONTANT_BASE_ENFANT[tranche] };
  });

  // Si agesEnfants pas fournis, utiliser moyenne 6-12
  const totalBase = detailEnfants.length > 0
    ? detailEnfants.reduce((s, e) => s + e.montantBase, 0)
    : nbEnfants * MONTANT_BASE_ENFANT["6-12"];

  // Ajuster si le disponible ne suffit pas
  const pensionTotale = Math.min(totalBase, disponible * 0.6);
  const pensionParEnfant = arrondir(pensionTotale / nbEnfants);

  return {
    resultat: { pensionMensuelleTotale: arrondir(pensionTotale), pensionParEnfant, nbEnfants },
    detail: { revenuDebiteur, chargesDebiteur, disponible, detailEnfants, methode: "Tabelles zurichoises simplifiées" },
    sourceLegale: "CC art. 276, 285; Tabelles zurichoises; Méthode du minimum vital avec répartition de l'excédent",
    disclaimer: DISCLAIMER
  };
}

// ─── 8. Prescription des dettes ───

const DELAIS_PRESCRIPTION = {
  general: { annees: 10, texte: "10 ans (prescription ordinaire)" },
  loyer: { annees: 5, texte: "5 ans (loyers, fermages)" },
  salaire: { annees: 5, texte: "5 ans (salaires, pensions)" },
  delictuel: { annees: 3, texte: "3 ans (responsabilité délictuelle, 1 an dès connaissance)" },
  assurance: { annees: 5, texte: "5 ans (créances d'assurance)" },
  impot: { annees: 5, texte: "5 ans (créances fiscales, variable selon canton)" },
  acte_de_defaut_de_biens: { annees: 20, texte: "20 ans (acte de défaut de biens)" },
  hypothecaire: { annees: 10, texte: "10 ans (créances hypothécaires)" }
};

export function calculPrescription({ typeDette, dateNaissance }) {
  if (!typeDette) return erreur("typeDette est requis");
  const delai = DELAIS_PRESCRIPTION[typeDette];
  if (!delai) return erreur(`Type de dette inconnu: ${typeDette}. Types valides: ${Object.keys(DELAIS_PRESCRIPTION).join(", ")}`);

  let datePrescription = null;
  let estPrescrit = null;
  if (dateNaissance) {
    const d = new Date(dateNaissance);
    datePrescription = new Date(d);
    datePrescription.setFullYear(datePrescription.getFullYear() + delai.annees);
    estPrescrit = datePrescription < new Date();
  }

  return {
    resultat: {
      delaiAnnees: delai.annees,
      delaiTexte: delai.texte,
      datePrescription: datePrescription ? datePrescription.toISOString().split("T")[0] : null,
      estPrescrit
    },
    detail: { typeDette, dateNaissance: dateNaissance || null },
    sourceLegale: "CO art. 127-142; LP art. 149a (ADB)",
    disclaimer: DISCLAIMER
  };
}

// ─── 9. Coût de la procédure ───

const BAREME_EMOLUMENTS = [
  { max: 10000, emolument: 800, avocatMin: 1500, avocatMax: 3000 },
  { max: 30000, emolument: 2000, avocatMin: 3000, avocatMax: 8000 },
  { max: 100000, emolument: 4000, avocatMin: 5000, avocatMax: 15000 },
  { max: 250000, emolument: 8000, avocatMin: 10000, avocatMax: 30000 },
  { max: Infinity, emolument: 15000, avocatMin: 20000, avocatMax: 60000 }
];

const FACTEURS_PROCEDURE = {
  conciliation: 0.3,
  premiere_instance: 1.0,
  appel: 1.2,
  federal: 1.5,
  sommaire: 0.5
};

export function calculCoutProcedure({ typeProcedure = "premiere_instance", valeurLitigieuse, canton }) {
  if (!valeurLitigieuse || valeurLitigieuse <= 0) return erreur("valeurLitigieuse doit être positive");

  const facteur = FACTEURS_PROCEDURE[typeProcedure] || 1.0;
  const bareme = BAREME_EMOLUMENTS.find(b => valeurLitigieuse <= b.max);
  const emolument = arrondir(bareme.emolument * facteur);
  const avocatMin = arrondir(bareme.avocatMin * facteur);
  const avocatMax = arrondir(bareme.avocatMax * facteur);
  const coutTotalMin = emolument + avocatMin;
  const coutTotalMax = emolument + avocatMax;

  return {
    resultat: { emolumentTribunal: emolument, fraisAvocatMin: avocatMin, fraisAvocatMax: avocatMax, coutTotalMin, coutTotalMax },
    detail: { typeProcedure, valeurLitigieuse, canton: canton || "CH", facteur },
    sourceLegale: "CPC art. 95-96; Règlements cantonaux sur les frais judiciaires; LLCA art. 12",
    disclaimer: DISCLAIMER
  };
}

// ─── 10. Éligibilité aide juridictionnelle ───

const AJ_MINIMUM_VITAL = {
  personne_seule: 1200,
  couple: 1700,
  enfant: 400
};

export function calculEligibiliteAJ({ canton, revenuMensuel, fortune = 0, charges = 0, situationFamiliale = "personne_seule", nbEnfants = 0 }) {
  if (!revenuMensuel && revenuMensuel !== 0) return erreur("revenuMensuel est requis");

  const base = AJ_MINIMUM_VITAL[situationFamiliale] || AJ_MINIMUM_VITAL.personne_seule;
  const supEnfants = nbEnfants * AJ_MINIMUM_VITAL.enfant;
  const minimumVitalElargi = base + supEnfants + charges;
  // Fortune : seuil indicatif 4000 CHF personne seule + 2000 par enfant
  const seuilFortune = 4000 + nbEnfants * 2000 + (situationFamiliale === "couple" ? 4000 : 0);
  const disponible = revenuMensuel - minimumVitalElargi;
  const fortuneExcedentaire = Math.max(0, fortune - seuilFortune);
  const eligible = disponible <= 0 && fortuneExcedentaire === 0;
  const eligiblePartiel = !eligible && disponible < 500 && fortuneExcedentaire < 10000;

  return {
    resultat: { eligible, eligiblePartiel, disponibleMensuel: arrondir(disponible), fortuneExcedentaire },
    detail: {
      revenuMensuel, fortune, charges,
      minimumVitalElargi: arrondir(minimumVitalElargi),
      seuilFortune,
      situationFamiliale, nbEnfants,
      canton: canton || "CH"
    },
    sourceLegale: "CPC art. 117-123; Cst. art. 29 al. 3 (droit à l'assistance judiciaire gratuite)",
    disclaimer: DISCLAIMER
  };
}

// ─── Helpers ───

function arrondir(n, decimales = 2) {
  const f = Math.pow(10, decimales);
  return Math.round(n * f) / f;
}

function erreur(message) {
  return { erreur: message, disclaimer: DISCLAIMER };
}

// ─── Liste des calculateurs (pour l'API) ───

export const CALCULATEURS = {
  calculRendementAdmissible: {
    id: "calculRendementAdmissible",
    nom: "Rendement admissible (loyer abusif)",
    description: "Calcule le loyer maximal admissible selon la méthode du rendement net",
    parametres: ["prixAchat", "tauxHypothequeReference?", "fraisEntretien?", "chargesAnnuelles?"],
    fn: calculRendementAdmissible
  },
  calculAmortissementGarantie: {
    id: "calculAmortissementGarantie",
    nom: "Amortissement garantie (barème SVIT)",
    description: "Calcule le montant dû sur la garantie de loyer selon l'amortissement des éléments",
    parametres: ["items: [{nom, dureeVie?, age, montantFacture}]"],
    fn: calculAmortissementGarantie
  },
  calculSaisieSalaire: {
    id: "calculSaisieSalaire",
    nom: "Saisie sur salaire",
    description: "Calcule le montant saisissable en fonction du minimum vital LP",
    parametres: ["canton?", "situationFamiliale?", "nbEnfantsMoins10?", "nbEnfantsPlus10?", "revenuMensuelNet", "loyer?", "primeLAMal?", "fraisTransport?"],
    fn: calculSaisieSalaire
  },
  calculDelaiConge: {
    id: "calculDelaiConge",
    nom: "Délai de congé (travail)",
    description: "Détermine le délai de résiliation légal selon l'ancienneté",
    parametres: ["anciennete", "periodeEssai?", "cct?"],
    fn: calculDelaiConge
  },
  calculIndemniteLicenciement: {
    id: "calculIndemniteLicenciement",
    nom: "Indemnité licenciement abusif",
    description: "Estime l'indemnité pour licenciement abusif (max 6 mois)",
    parametres: ["salaireMensuel", "anciennete", "circonstances?"],
    fn: calculIndemniteLicenciement
  },
  calculProtectionMaladie: {
    id: "calculProtectionMaladie",
    nom: "Période de protection maladie",
    description: "Détermine la durée de protection contre le licenciement en cas de maladie",
    parametres: ["anciennete"],
    fn: calculProtectionMaladie
  },
  calculPensionIndicative: {
    id: "calculPensionIndicative",
    nom: "Pension alimentaire indicative",
    description: "Estime la pension alimentaire selon la méthode du minimum vital",
    parametres: ["revenuDebiteur", "chargesDebiteur?", "nbEnfants", "agesEnfants?"],
    fn: calculPensionIndicative
  },
  calculPrescription: {
    id: "calculPrescription",
    nom: "Prescription des dettes",
    description: "Détermine le délai de prescription selon le type de dette",
    parametres: ["typeDette", "dateNaissance?"],
    fn: calculPrescription
  },
  calculCoutProcedure: {
    id: "calculCoutProcedure",
    nom: "Coût de la procédure",
    description: "Estime les frais de justice et d'avocat selon la valeur litigieuse",
    parametres: ["typeProcedure?", "valeurLitigieuse", "canton?"],
    fn: calculCoutProcedure
  },
  calculEligibiliteAJ: {
    id: "calculEligibiliteAJ",
    nom: "Éligibilité aide juridictionnelle",
    description: "Évalue l'éligibilité à l'assistance judiciaire gratuite",
    parametres: ["canton?", "revenuMensuel", "fortune?", "charges?", "situationFamiliale?", "nbEnfants?"],
    fn: calculEligibiliteAJ
  }
};
