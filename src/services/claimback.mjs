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

const PC_PATH = join(__dirname, '..', 'data', 'meta', 'pc-avs-ai-2026.json');
let _pc = null;
function pcData() {
  if (!_pc) _pc = JSON.parse(readFileSync(PC_PATH, 'utf-8'));
  return _pc;
}

const CANTONS_PATH = join(__dirname, '..', 'data', 'meta', 'cantons-aides.json');
let _cantons = null;
function cantonsData() {
  if (!_cantons) _cantons = JSON.parse(readFileSync(CANTONS_PATH, 'utf-8'));
  return _cantons;
}

// Liste des 26 cantons pour les sélecteurs (VD en tête).
export function listCantons() {
  const c = cantonsData().cantons;
  const arr = Object.keys(c).map((code) => ({ code, nom: c[code].nom }));
  arr.sort((a, b) => (a.code === 'VD' ? -1 : b.code === 'VD' ? 1 : a.nom.localeCompare(b.nom, 'fr')));
  return arr;
}

function cantonEntry(code) {
  const c = cantonsData().cantons;
  return (code && c[code]) ? { code, ...c[code] } : null;
}

/**
 * Allocations familiales — couverture nationale. VD : barème cantonal détaillé (rangs).
 * Autres cantons : minimum fédéral garanti 2026 (240 enfant / 290 formation), libellé
 * comme plancher (le canton paie peut-être plus).
 */
export function estimateAllocationsNational(canton, input) {
  const meta = cantonsData()._meta;
  const ce = cantonEntry(canton);
  const min = meta.allocations_minimum_federal;
  const verifie = !!(ce && ce.allocations_verifie);
  const m16 = Math.max(0, Math.floor(Number(input && input.enfants_moins16) || 0));
  const form = Math.max(0, Math.floor(Number(input && input.enfants_formation) || 0));
  const total = m16 + form;
  const out = {
    canton, canton_nom: ce ? ce.nom : null, annee: meta.annee, indicatif: true,
    montants_verifies: verifie,
    source: verifie ? 'État de Vaud (barème vérifié)' : meta.source_allocations,
    source_url: 'https://www.bsv.admin.ch/bsv/fr/home/assurances-sociales/famz/grundlagen-und-gesetze/ansaetze.html',
    calculateur_officiel: 'https://www.bsv.admin.ch/bsv/fr/home/assurances-sociales/famz/grundlagen-und-gesetze/ansaetze.html',
    avertissement: meta.allocations_note
  };
  if (total <= 0) return { ...out, error: 'aucun_enfant', message: 'Indiquez au moins un enfant à charge.' };

  // Barème cantonal par rang, plancher minimum fédéral 2026 appliqué (sécurité légale).
  const a = (ce && ce.alloc) || { e12: min.enfant, e3: min.enfant, f12: min.formation, f3: min.formation };
  const e12 = Math.max(a.e12, min.enfant), e3 = Math.max(a.e3, min.enfant);
  const f12 = Math.max(a.f12, min.formation), f3 = Math.max(a.f3, min.formation);
  let mensuel = 0, rang = 0;
  for (let i = 0; i < m16; i++) { rang++; mensuel += rang <= 2 ? e12 : e3; }
  for (let i = 0; i < form; i++) { rang++; mensuel += rang <= 2 ? f12 : f3; }

  out.enfants_moins_16 = m16; out.enfants_formation = form;
  out.total_mensuel = mensuel; out.total_annuel = mensuel * 12; out.eligible = true;
  const nomC = ce ? ce.nom : 'votre canton';
  const base = `Pour ${total} enfant(s) à charge, allocations familiales (${nomC}) : ~${mensuel} CHF/mois (~${mensuel * 12} CHF/an).`;
  const suffix = ` Salarié·e : versé par l'employeur. Indépendant·e / sans activité : à demander à votre caisse (souvent oublié).`;
  out.message = verifie
    ? base + suffix
    : base + ` Barème cantonal indicatif (minimum fédéral 2026 garanti) — confirmez auprès de votre caisse.` + suffix;
  out.demarches = [
    'Salarié·e : vérifiez que les allocations figurent sur vos fiches de salaire.',
    'Indépendant·e / sans activité : demandez-les à votre caisse cantonale de compensation (souvent oublié).'
  ];
  return out;
}

/**
 * Subside d'assurance-maladie — VD : calcul exact (estimateSubsideVD). Autres cantons :
 * signal d'éligibilité (principe fédéral) + lien vers le calculateur/l'autorité officielle.
 */
export function subsideNational(canton, input) {
  const meta = cantonsData()._meta;
  const ce = cantonEntry(canton);
  if (ce && ce.subside_calcul_exact) {
    const r = estimateSubsideVD(input);
    return { ...r, canton, canton_nom: ce.nom, mode: 'calcul_exact', subside_url: ce.subside_url };
  }
  // Signal ENRICHI : canton avec barèmes officiels sourcés (GE/ZH/BE…). Orientation
  // indicative (base de revenu + seuils) SANS prétendre à un calcul exact — chaque
  // canton a sa propre base de revenu et sa formule → renvoi au calculateur officiel.
  if (ce && ce.subside) {
    const s = ce.subside;
    return {
      canton, canton_nom: ce.nom, mode: 'signal_enrichi', indicatif: true,
      message: `Subside d'assurance-maladie à ${ce.nom} (réduction des primes LAMal). ${s.seuils_indicatifs}`,
      base_revenu: s.base_revenu,
      note: s.note || null,
      avertissement: `Estimation INDICATIVE (barèmes ${s.annee || ''}) — votre droit exact dépend de votre situation. La base de revenu cantonale (${s.base_revenu}) n'est PAS le salaire brut. Vérifiez sur le calculateur officiel.`.replace(/\s+/g, ' ').trim(),
      calculateur_officiel: s.url,
      source: s.source
    };
  }
  return {
    canton, canton_nom: ce ? ce.nom : null, mode: 'signal', indicatif: true,
    message: `Le barème du subside d'assurance-maladie est propre à chaque canton. Son but : réduire les primes des personnes à revenu modeste (souvent quand la prime dépasse ~8 à 10% du revenu déterminant). ${ce ? ce.nom : 'Votre canton'} dispose d'un calculateur officiel — vérifiez-y votre droit, beaucoup de personnes éligibles ne le réclament pas.`,
    avertissement: meta.subside_note,
    calculateur_officiel: (ce && ce.subside_url) || meta.subside_url_federal,
    source: 'Principe LAMal art. 65 ; barèmes cantonaux'
  };
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

  let niveau, eligible, minMois, maxMois, estimeMois;
  const F = cat.subside_max_mois, E = cat.subside_min_mois;
  const C = cat.limite_max_subside, A = cat.limite_subside_min;
  if (revenuDeterminant <= C) {
    eligible = true; niveau = 'maximum';
    minMois = F; maxMois = F; estimeMois = F;
  } else if (revenuDeterminant <= A) {
    eligible = true; niveau = 'degressif';
    minMois = E; maxMois = F;
    // Interpolation linéaire entre le subside max (au seuil C) et min (au seuil A).
    // Approximation transparente : la courbe officielle (coefficient de progressivité
    // RLVLAMal) est non linéaire ; le montant exact vient du calculateur OVAM.
    estimeMois = Math.round(F - (F - E) * ((revenuDeterminant - C) / (A - C)));
  } else if (revenuDeterminant <= cat.limite_eligibilite) {
    eligible = true; niveau = 'minimum';
    minMois = E; maxMois = E; estimeMois = E;
  } else {
    eligible = false; niveau = 'au_dela_seuil_ordinaire';
    minMois = 0; maxMois = 0; estimeMois = 0;
  }

  out.eligible = eligible;
  out.niveau = niveau;
  out.subside_estime_mois = estimeMois;
  out.subside_min_mois = minMois;
  out.subside_max_mois = maxMois;
  out.estimation_annuelle = estimeMois * 12;
  out.estimation_annuelle_min = minMois * 12;
  out.estimation_annuelle_max = maxMois * 12;

  if (eligible) {
    out.message = `Sur la base de vos indications (revenu déterminant estimé ~${out.revenu_determinant_estime} CHF), vous êtes probablement éligible au subside LAMal vaudois : environ ${estimeMois} CHF/mois (~${out.estimation_annuelle} CHF/an). Estimation indicative — le montant exact (courbe progressive, prime de référence, région) est calculé par l'OVAM.`;
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
 * Vrai calculateur de prestations complémentaires (PC) AVS/AI — Vaud, paramètres 2026.
 * PC annuelle = dépenses reconnues − revenus déterminants. Calcul SIMPLIFIÉ mais réel,
 * avec décomposition transparente. Couvre les cas standards (à domicile, seul ou couple,
 * avec enfants). Renvoie toujours à l'organe PC officiel.
 *
 * input: { rente_type:'avs'|'ai', couple:bool, enfants_moins11:int, enfants_des11:int,
 *          rente_mensuelle:CHF, autres_revenus_annuels:CHF, revenu_activite_annuel:CHF,
 *          loyer_mensuel:CHF, prime_lamal_mensuelle:CHF, fortune:CHF, region:1|2|3 }
 */
export function estimatePC(input) {
  const d = pcData();
  const meta = d._meta;
  const out = {
    aide: 'PC', annee: meta.annee, indicatif: true,
    base_legale: meta.base_legale,
    source: meta.source_federal + ' ; ' + meta.source_loyer,
    calculateur_officiel: meta.calculateur_officiel,
    avertissement: meta.avertissement
  };
  const i = input || {};
  const couple = !!i.couple;
  const renteType = i.rente_type === 'ai' ? 'ai' : 'avs';
  const region = [1, 2, 3].includes(Number(i.region)) ? Number(i.region) : 1;
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0);
  const enf11 = Math.max(0, Math.floor(num(i.enfants_des11)));
  const enfMoins11 = Math.max(0, Math.floor(num(i.enfants_moins11)));
  const nbEnfants = enf11 + enfMoins11;

  const fortune = num(i.fortune);
  const plafondFortune = couple ? d.plafond_fortune.couple : d.plafond_fortune.personne_seule;
  if (fortune > plafondFortune) {
    return { ...out, eligible: false, raison: 'fortune_trop_elevee',
      message: `Votre fortune (~${round(fortune)} CHF) dépasse le plafond d'accès aux PC (${plafondFortune} CHF pour votre situation). Les PC ne sont alors pas ouvertes — mais d'autres aides peuvent l'être.` };
  }

  // ── Dépenses reconnues ──
  let besoinsVitaux = couple ? d.besoins_vitaux_annuel.couple : d.besoins_vitaux_annuel.personne_seule;
  besoinsVitaux += enf11 * d.besoins_vitaux_annuel.enfant_des_11 + enfMoins11 * d.besoins_vitaux_annuel.enfant_moins_11;

  const taille = Math.min(4, (couple ? 2 : 1) + nbEnfants);
  const plafondLoyerMensuel = d.loyer_max_mensuel_vd[String(taille)]['r' + region];
  const loyerAnnuelReel = num(i.loyer_mensuel) * 12;
  const loyerReconnu = Math.min(loyerAnnuelReel, plafondLoyerMensuel * 12);
  const primeAnnuelle = num(i.prime_lamal_mensuelle) * 12;
  const depenses = besoinsVitaux + loyerReconnu + primeAnnuelle;

  // ── Revenus déterminants ──
  const renteAnnuelle = num(i.rente_mensuelle) * 12;
  const autresRevenus = num(i.autres_revenus_annuels);
  const franchiseActivite = couple ? d.franchise_revenu_activite_annuel.couple : d.franchise_revenu_activite_annuel.personne_seule;
  const revActivitePris = Math.round(d.part_revenu_activite_comptee * Math.max(0, num(i.revenu_activite_annuel) - franchiseActivite));
  const franchiseFortune = couple ? d.franchise_fortune.couple : d.franchise_fortune.personne_seule;
  const denomFortune = renteType === 'ai' ? d.taux_fortune_denominateur.ai : d.taux_fortune_denominateur.avs;
  const partFortune = Math.round(Math.max(0, fortune - franchiseFortune) / denomFortune);
  const revenus = renteAnnuelle + autresRevenus + revActivitePris + partFortune;

  const pcAnnuelle = Math.max(0, Math.round(depenses - revenus));
  const eligible = pcAnnuelle > 0;

  out.eligible = eligible;
  out.pc_annuelle = pcAnnuelle;
  out.pc_mensuelle = Math.round(pcAnnuelle / 12);
  out.breakdown = {
    depenses_reconnues: Math.round(depenses),
    besoins_vitaux: besoinsVitaux,
    loyer_reconnu: loyerReconnu,
    loyer_plafond_annuel: plafondLoyerMensuel * 12,
    prime_lamal: primeAnnuelle,
    revenus_determinants: Math.round(revenus),
    rentes: renteAnnuelle,
    autres_revenus: autresRevenus,
    revenu_activite_compte: revActivitePris,
    part_fortune_comptee: partFortune
  };
  out.message = eligible
    ? `Estimation : vous pourriez avoir droit à environ ${out.pc_mensuelle} CHF/mois de prestations complémentaires (~${pcAnnuelle} CHF/an). Ce montant = vos dépenses reconnues (~${out.breakdown.depenses_reconnues} CHF) moins vos revenus déterminants (~${out.breakdown.revenus_determinants} CHF). Les PC sont un droit massivement sous-utilisé — déposez une demande à votre caisse de compensation.`
    : `Selon cette estimation, vos revenus déterminants (~${out.breakdown.revenus_determinants} CHF) couvrent vos dépenses reconnues (~${out.breakdown.depenses_reconnues} CHF) : pas de PC ordinaire. Mais le calcul officiel intègre d'autres éléments — en cas de doute ou de frais médicaux élevés, vérifiez auprès de votre caisse.`;
  out.demarches = [
    'Déposez une demande PC auprès de la caisse de compensation cantonale (le droit naît au plus tôt 6 mois avant la demande — ne tardez pas).',
    'Munissez-vous de : décision de rente, bail/loyer, prime LAMal, relevés de fortune et de revenus.',
    'Les bénéficiaires de PC ont aussi droit au subside LAMal d\'office et au remboursement de certains frais médicaux.'
  ];
  return out;
}

/**
 * BILAN DE DROITS — orchestre toutes les aides à partir d'UN seul profil ménage et
 * renvoie le total potentiellement récupérable + le détail par aide. C'est le cœur
 * "find money" du vertical : une seule saisie, un screening complet.
 *
 * profil: { menage:'seul'|'couple', age_groupe:'jeune'|'adulte',
 *           nb_enfants_moins16:int, nb_enfants_formation:int,
 *           revenu_net_annuel:CHF, region:1|2|3,
 *           rente:'none'|'avs'|'ai', rente_mensuelle:CHF, loyer_mensuel:CHF,
 *           prime_lamal_mensuelle:CHF, fortune:CHF }
 */
export function buildBilan(profil) {
  const p = profil || {};
  const canton = (typeof p.canton === 'string' && p.canton.length === 2) ? p.canton.toUpperCase() : 'VD';
  const cInfo = cantonEntry(canton);
  const menage = p.menage === 'couple' ? 'couple' : 'seul';
  const jeune = p.age_groupe === 'jeune';
  const nbM16 = Math.max(0, Math.floor(Number(p.nb_enfants_moins16) || 0));
  const nbForm = Math.max(0, Math.floor(Number(p.nb_enfants_formation) || 0));
  const nbEnfants = nbM16 + nbForm;
  const rente = (p.rente === 'avs' || p.rente === 'ai') ? p.rente : 'none';

  const aides = [];

  // 1) Subside LAMal — calcul exact (VD) ou signal + lien officiel (autres cantons)
  let cat;
  if (jeune) cat = (menage === 'couple' || nbEnfants > 0) ? 'jeune_adulte_famille' : 'jeune_adulte_seul';
  else cat = nbEnfants > 0 ? 'adulte_famille_enfant' : (menage === 'couple' ? 'couple_sans_enfant' : 'adulte_seul');
  const sub = subsideNational(canton, { categorie: cat, revenu_net: p.revenu_net_annuel, nb_enfants: nbEnfants });
  if (sub.mode === 'calcul_exact') {
    aides.push({
      id: 'subside', titre: "Subside d'assurance-maladie",
      eligible: !!sub.eligible,
      montant_mensuel: sub.eligible ? sub.subside_estime_mois : 0,
      montant_annuel: sub.eligible ? sub.estimation_annuelle : 0,
      message: sub.message, lien: sub.calculateur_officiel
    });
  } else {
    aides.push({
      id: 'subside', titre: "Subside d'assurance-maladie",
      eligible: false, a_verifier: true, montant_mensuel: 0, montant_annuel: 0,
      message: sub.message, lien: sub.calculateur_officiel
    });
  }

  // 2) Allocations familiales — si enfants (barème VD détaillé, sinon minimum fédéral garanti)
  if (nbEnfants > 0) {
    const al = estimateAllocationsNational(canton, { enfants_moins16: nbM16, enfants_formation: nbForm });
    if (!al.error) aides.push({
      id: 'allocations',
      titre: al.montants_verifies ? 'Allocations familiales' : 'Allocations familiales (minimum garanti)',
      eligible: true, montant_mensuel: al.total_mensuel, montant_annuel: al.total_annuel,
      message: al.message, lien: al.calculateur_officiel
    });
  }

  // 3) Prestations complémentaires — si rente AVS/AI
  if (rente !== 'none') {
    const pc = estimatePC({
      rente_type: rente, couple: menage === 'couple',
      enfants_moins11: nbM16, enfants_des11: nbForm,
      rente_mensuelle: p.rente_mensuelle, loyer_mensuel: p.loyer_mensuel,
      prime_lamal_mensuelle: p.prime_lamal_mensuelle, fortune: p.fortune, region: p.region
    });
    aides.push({
      id: 'pc', titre: 'Prestations complémentaires (AVS/AI)',
      eligible: !!pc.eligible,
      montant_mensuel: pc.eligible ? pc.pc_mensuelle : 0,
      montant_annuel: pc.eligible ? pc.pc_annuelle : 0,
      message: pc.message, lien: pc.calculateur_officiel
    });
  }

  const eligibles = aides.filter((a) => a.montant_annuel > 0);
  const aVerifier = aides.filter((a) => a.a_verifier);
  const totalAnnuel = eligibles.reduce((s, a) => s + a.montant_annuel, 0);
  const cantonNom = cInfo ? cInfo.nom : canton;
  const suffixVerifier = aVerifier.length ? ` À cela peut s'ajouter le subside d'assurance-maladie de votre canton (à vérifier sur le calculateur officiel).` : '';

  return {
    canton, canton_nom: cantonNom, indicatif: true,
    aides,
    eligibles_count: eligibles.length,
    a_verifier_count: aVerifier.length,
    total_annuel_estime: totalAnnuel,
    total_mensuel_estime: Math.round(totalAnnuel / 12),
    message: eligibles.length
      ? `D'après ce bilan, vous pourriez récupérer environ ${totalAnnuel} CHF par an (~${Math.round(totalAnnuel / 12)} CHF/mois) au total sur ${eligibles.length} aide(s).${suffixVerifier} Estimations indicatives — vérifiez chaque montant auprès de l'autorité compétente.`
      : `Ce bilan ne détecte pas de montant chiffrable sur la base de vos indications (canton de ${cantonNom}).${suffixVerifier} Les barèmes officiels intègrent d'autres éléments : en cas de doute, vérifiez auprès des autorités.`,
    avertissement: `Estimations indicatives 2026. Subside : calcul exact pour Vaud, signal + calculateur officiel pour les autres cantons. Allocations : barème vérifié pour Vaud, minimum fédéral garanti ailleurs. PC : calcul fédéral (valable tous cantons). Ne remplace pas une décision des autorités.`,
    extracted_year: 2026
  };
}

export const _internals = { round };
