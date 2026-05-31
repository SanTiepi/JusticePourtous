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

let _data = null;
function data() {
  if (!_data) _data = JSON.parse(readFileSync(DATA_PATH, 'utf-8'));
  return _data;
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

export const _internals = { round };
