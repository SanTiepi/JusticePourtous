// claimback.mjs — Moteur d'éligibilité "argent réclamable" (vertical Justice économique).
// MVP : réduction individuelle des primes LAMal (subside) — canton de Vaud, paramètres
// officiels 2026 (arrêté CE VD du 17.12.2025). Voir src/data/meta/subside-lamal-vd-2026.json.
//
// PRINCIPE : estimation INDICATIVE. Le "revenu déterminant" OVAM n'est pas le salaire brut
// (déductions enfants, rachats 2e pilier…), et le "subside spécifique" (taux d'effort >10%)
// peut étendre le droit au-delà des seuils ordinaires. On ne tranche jamais à la place de
// l'OVAM : on détecte un droit PROBABLE et on renvoie au calculateur/formulaire officiel.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', 'data', 'meta', 'subside-lamal-vd-2026.json');
const ALLOC_PATH = join(__dirname, '..', 'data', 'meta', 'allocations-familiales-vd-2026.json');

let _data = null;
function data() {
  if (!_data) _data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  return _data;
}

let _alloc = null;
function allocData() {
  if (!_alloc) _alloc = JSON.parse(readFileSync(ALLOC_PATH, 'utf-8'));
  return _alloc;
}

// Aides disponibles dans le vertical Justice économique (pour le hub).
export function listAides() {
  return [
    { id: 'subside', titre: "Subside d'assurance-maladie", canton: 'VD', statut: 'live' },
    { id: 'allocations', titre: 'Allocations familiales', canton: 'VD', statut: 'live' },
    { id: 'pc', titre: 'Prestations complémentaires (AVS/AI)', canton: 'CH', statut: 'signal' }
  ];
}

export function listCategories() {
  const d = data();
  return Object.entries(d.categories).map(([id, c]) => ({ id, label: c.label }));
}

export function subsideMeta() {
  return data()._meta;
}

function round(n) { return Math.round(n); }

/**
 * Estime l'éligibilité au subside LAMal vaudois 2026.
 * @param {{categorie:string, revenu_net:number, nb_enfants?:number}} input
 * revenu_net = revenu net annuel approximatif du ménage (CHF).
 */
export function estimateSubsideVD(input) {
  const d = data();
  const meta = d._meta;
  const categorie = input && input.categorie;
  const cat = categorie && d.categories[categorie];
  const out = {
    canton: 'VD',
    annee: meta.annee,
    indicatif: true,
    source: meta.source,
    source_url: meta.source_url,
    calculateur_officiel: meta.calculateur_officiel,
    avertissement: meta.avertissement
  };

  if (!cat) {
    return { ...out, error: 'categorie_invalide', categories: listCategories() };
  }
  const revenu = Number(input.revenu_net);
  if (!Number.isFinite(revenu) || revenu < 0) {
    return { ...out, error: 'revenu_invalide' };
  }

  // Déductions enfants (art. 4 arrêté) : -6'000 1er enfant, -7'000 par enfant suppl.
  const nbEnfants = Math.max(0, Math.floor(Number(input.nb_enfants) || 0));
  let deductionEnfants = 0;
  if (nbEnfants > 0) deductionEnfants = meta.deductions_enfant.premier + (nbEnfants - 1) * meta.deductions_enfant.par_enfant_supplementaire;
  const revenuDeterminant = Math.max(0, revenu - deductionEnfants);

  out.categorie = categorie;
  out.categorie_label = cat.label;
  out.revenu_net_saisi = round(revenu);
  out.deduction_enfants = deductionEnfants;
  out.revenu_determinant_estime = round(revenuDeterminant);
  out.plafond_eligibilite = cat.limite_eligibilite;

  let niveau, eligible, minMois, maxMois;
  if (revenuDeterminant <= cat.limite_max_subside) {
    eligible = true; niveau = 'maximum';
    minMois = cat.subside_max_mois; maxMois = cat.subside_max_mois;
  } else if (revenuDeterminant <= cat.limite_subside_min) {
    eligible = true; niveau = 'degressif';
    minMois = cat.subside_min_mois; maxMois = cat.subside_max_mois;
  } else if (revenuDeterminant <= cat.limite_eligibilite) {
    eligible = true; niveau = 'minimum';
    minMois = cat.subside_min_mois; maxMois = cat.subside_min_mois;
  } else {
    eligible = false; niveau = 'au_dela_seuil_ordinaire';
    minMois = 0; maxMois = 0;
  }

  out.eligible = eligible;
  out.niveau = niveau;
  out.subside_min_mois = minMois;
  out.subside_max_mois = maxMois;
  out.estimation_annuelle_min = minMois * 12;
  out.estimation_annuelle_max = maxMois * 12;

  if (eligible) {
    const montant = niveau === 'degressif'
      ? `entre ~${minMois} et ~${maxMois} CHF/mois`
      : `~${minMois} CHF/mois`;
    out.message = `Sur la base de vos indications (revenu déterminant estimé ~${out.revenu_determinant_estime} CHF), vous êtes probablement éligible au subside LAMal vaudois : ${montant} (estimation indicative, soit ~${out.estimation_annuelle_min}-${out.estimation_annuelle_max} CHF/an). Le montant exact dépend du calcul officiel de l'OVAM (revenu déterminant unifié, prime de référence, région).`;
  } else {
    out.message = `Votre revenu déterminant estimé (~${out.revenu_determinant_estime} CHF) dépasse le plafond ordinaire du subside (${cat.limite_eligibilite} CHF pour votre situation). MAIS vous pourriez tout de même avoir droit à un "subside spécifique" si vos primes dépassent 10% de votre revenu déterminant — cela vaut la peine de vérifier auprès de l'OVAM, surtout en cas de primes élevées ou de famille.`;
  }

  out.demarches = [
    'Vérifiez le montant exact avec le calculateur officiel de l\'État de Vaud (lien ci-dessous).',
    'Si vous touchez des prestations complémentaires (PC) ou l\'aide sociale, le subside est accordé d\'office — signalez-le.',
    'Déposez votre demande auprès de l\'OVAM (Office vaudois de l\'assurance-maladie) ; un refus se conteste par opposition dans les 30 jours.'
  ];
  return out;
}

/**
 * Estime les allocations familiales vaudoises (montants exacts, non testés au revenu
 * pour les actifs). enfants_moins16 + enfants_formation (jusqu'à 25 ans).
 */
export function estimateAllocationsVD(input) {
  const d = allocData();
  const meta = d._meta;
  const out = {
    canton: 'VD', annee: meta.annee, indicatif: true,
    source: meta.source, source_url: meta.source_url,
    calculateur_officiel: meta.source_url, avertissement: meta.avertissement
  };
  const m16 = Math.max(0, Math.floor(Number(input && input.enfants_moins16) || 0));
  const form = Math.max(0, Math.floor(Number(input && input.enfants_formation) || 0));
  const total = m16 + form;
  if (total <= 0) return { ...out, error: 'aucun_enfant', message: 'Indiquez au moins un enfant à charge.' };

  const tarif = d.montants_mensuels;
  let mensuel = 0, rang = 0;
  for (let i = 0; i < m16; i++) { rang++; mensuel += rang <= 2 ? tarif.enfant_moins_16.rang_1_2 : tarif.enfant_moins_16.rang_3_plus; }
  for (let i = 0; i < form; i++) { rang++; mensuel += rang <= 2 ? tarif.formation_jusqu_25.rang_1_2 : tarif.formation_jusqu_25.rang_3_plus; }

  out.enfants_moins_16 = m16;
  out.enfants_formation = form;
  out.total_mensuel = mensuel;
  out.total_annuel = mensuel * 12;
  out.eligible = true;
  out.message = `Pour ${total} enfant(s) à charge, le droit aux allocations familiales vaudoises est d'environ ${mensuel} CHF/mois (~${mensuel * 12} CHF/an). Si vous êtes salarié·e, c'est versé via votre employeur. Si vous êtes indépendant·e ou sans activité lucrative, ce droit doit être DEMANDÉ à la caisse — il est fréquemment oublié.`;
  out.demarches = [
    'Salarié·e : vérifiez que les allocations figurent bien sur vos fiches de salaire.',
    'Indépendant·e / sans activité : demandez-les à la Caisse cantonale d\'allocations familiales (un seul parent peut les toucher par enfant).',
    'Sans activité lucrative : droit possible si revenu imposable ≤ 60\'480 CHF/an.'
  ];
  return out;
}

/**
 * Signal indicatif (SANS montant) pour les prestations complémentaires (PC).
 * Le montant PC = différence entre dépenses reconnues et revenus ; seul l'organe PC
 * le calcule. On se limite à détecter un droit PROBABLE et à renvoyer à l'autorité.
 */
export function pcSignal(input) {
  const renteAVSAI = !!(input && input.rente_avs_ai);
  const revenusInsuffisants = !!(input && input.revenus_insuffisants);
  const probable = renteAVSAI && revenusInsuffisants;
  let message;
  if (probable) {
    message = "Vous remplissez les deux conditions clés des prestations complémentaires (PC) : une rente AVS/AI et des revenus qui ne couvrent pas vos dépenses reconnues. Les PC sont un droit massivement sous-utilisé — déposez une demande auprès de votre caisse de compensation cantonale.";
  } else if (renteAVSAI) {
    message = "Vous touchez une rente AVS/AI : si vos revenus ne couvrent pas vos dépenses de base (loyer, primes LAMal, entretien), vérifiez votre droit aux PC — c'est souvent oublié.";
  } else {
    message = "Les PC complètent uniquement les rentes AVS, AI ou survivants lorsqu'elles ne suffisent pas à couvrir le minimum vital.";
  }
  return {
    aide: 'PC', indicatif: true, signal: true, probable,
    message,
    conditions: [
      'Toucher (ou avoir droit à) une rente AVS, AI ou de survivants',
      'Être domicilié·e et résider habituellement en Suisse',
      'Avoir des dépenses reconnues (loyer plafonné, forfait entretien, primes LAMal) supérieures aux revenus déterminants'
    ],
    base_legale: 'LPC (RS 831.30)',
    calculateur_officiel: 'https://www.ahv-iv.ch/fr/Prestations/Prestations-compl%C3%A9mentaires-PC',
    avertissement: 'Signal indicatif, sans montant. Le montant des PC correspond à la différence entre vos dépenses reconnues et vos revenus ; seul l\'organe PC cantonal le détermine.'
  };
}

export const _internals = { round };
