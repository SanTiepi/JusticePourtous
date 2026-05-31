/**
 * Compte-à-rebours des délais péremptoires (2026-05-31).
 *
 * Rater un délai péremptoire = perdre un droit. Cette protection extrait, de façon
 * 100% DÉTERMINISTE, la date de l'événement déclencheur depuis le TEXTE BRUT du citoyen
 * (ex « reçu le congé il y a une semaine », « commandement reçu le 18 mai »), et la croise
 * avec le délai péremptoire de la fiche pour afficher « il vous reste X jours ».
 *
 * Choix qualité : aucun appel LLM, aucune modification du prompt du navigator (chemin de
 * prod vérifié). Le navigator n'invente rien (gap 3A) ; ici c'est du calcul sur des faits
 * (date donnée par l'usager) + un délai VÉRIFIÉ issu de la fiche. Si la date n'est pas
 * extractible, pas de compte-à-rebours (dégradation gracieuse — on affiche le délai sans le
 * compteur, comme avant).
 */

const MOIS = {
  janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11, decembre: 11
};
const NOMBRES = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8,
  neuf: 9, dix: 10, onze: 11, douze: 12, quinze: 15, vingt: 20
};

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/**
 * Extrait la date de l'événement déclencheur depuis le texte brut.
 * @returns {{ date: Date, raw: string, kind: string } | null}
 */
export function extractEventDate(texte, today = new Date()) {
  if (!texte || typeof texte !== 'string') return null;
  const t = texte.toLowerCase().replace(/['']/g, "'");

  // 1) Relatif explicite : "il y a N jours/semaines/mois" (N chiffre ou en lettres)
  let m = t.match(/il y a\s+(\d{1,3}|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|quinze)\s+(jours?|semaines?|mois)/);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : (NOMBRES[m[1]] || 0);
    if (n > 0) {
      const unit = m[2].startsWith('jour') ? 1 : m[2].startsWith('semaine') ? 7 : 30;
      const d = new Date(today); d.setDate(d.getDate() - n * unit);
      return { date: d, raw: m[0], kind: 'relatif' };
    }
  }

  // 2) Mots relatifs simples
  if (/\bavant-hier\b/.test(t)) { const d = new Date(today); d.setDate(d.getDate() - 2); return { date: d, raw: 'avant-hier', kind: 'relatif' }; }
  if (/\bhier\b/.test(t)) { const d = new Date(today); d.setDate(d.getDate() - 1); return { date: d, raw: 'hier', kind: 'relatif' }; }
  if (/\b(la semaine dernière|la semaine passée|semaine dernière)\b/.test(t)) { const d = new Date(today); d.setDate(d.getDate() - 7); return { date: d, raw: 'la semaine dernière', kind: 'relatif' }; }
  if (/\b(le mois dernier|le mois passé)\b/.test(t)) { const d = new Date(today); d.setDate(d.getDate() - 30); return { date: d, raw: 'le mois dernier', kind: 'relatif' }; }

  // 3) Date absolue numérique : "18.05.2026", "18/05/26", "18-05-2026"
  m = t.match(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})\b/);
  if (m) {
    let [, dd, mm, yy] = m;
    dd = parseInt(dd, 10); mm = parseInt(mm, 10) - 1; yy = parseInt(yy, 10);
    if (yy < 100) yy += 2000;
    const d = new Date(yy, mm, dd);
    if (!isNaN(d.getTime()) && d <= today) return { date: d, raw: m[0], kind: 'absolu' };
  }

  // 4) Date absolue littérale : "le 18 mai" (année courante, ou précédente si dans le futur)
  m = t.match(/\b(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\b/);
  if (m) {
    const dd = parseInt(m[1], 10);
    const mois = MOIS[m[2]];
    let d = new Date(today.getFullYear(), mois, dd);
    if (d > today) d = new Date(today.getFullYear() - 1, mois, dd); // déjà passé
    if (!isNaN(d.getTime())) return { date: d, raw: m[0], kind: 'absolu' };
  }

  return null;
}

/** Extrait le nombre de jours d'un libellé de délai ("10 jours dès notification" → 10). */
export function parseDelaiJours(delai) {
  if (!delai || typeof delai !== 'string') return null;
  const m = delai.toLowerCase().match(/(\d{1,3})\s*jours?/);
  if (m) return parseInt(m[1], 10);
  // mois → jours (approx 30)
  const mm = delai.toLowerCase().match(/(\d{1,2})\s*mois/);
  if (mm) return parseInt(mm[1], 10) * 30;
  return null;
}

/**
 * Construit l'alerte de compte-à-rebours pour un délai péremptoire.
 * @param {Array} delais - sortie de topDelaisCritiques (avec {delai, peremptoire})
 * @param {string} texte - texte brut du citoyen
 * @param {Date} today
 * @returns {{ jours_restants, delai_total, procedure, base_legale, urgence, depasse, date_evenement, message } | null}
 */
export function buildCountdown(delais, texte, today = new Date()) {
  if (!Array.isArray(delais) || !delais.length) return null;
  // On cible le délai péremptoire le plus court (le plus à risque).
  const perempts = delais
    .filter(d => d && d.peremptoire)
    .map(d => ({ ...d, jours: parseDelaiJours(d.delai) }))
    .filter(d => d.jours != null)
    .sort((a, b) => a.jours - b.jours);
  if (!perempts.length) return null;

  const ev = extractEventDate(texte, today);
  if (!ev) return null; // pas de date → pas de compte-à-rebours (gracieux)

  const cible = perempts[0];
  const ecoule = daysBetween(ev.date, today);
  if (ecoule < 0 || ecoule > 366) return null; // date incohérente
  const restant = cible.jours - ecoule;
  const depasse = restant < 0;

  let message;
  if (depasse) {
    message = `Le délai de ${cible.jours} jours pour « ${cible.procedure} » est probablement DÉPASSÉ (événement il y a ~${ecoule} jours). Un délai péremptoire dépassé peut faire perdre le droit — faites vérifier d'urgence par un professionnel, parfois une restitution de délai reste possible.`;
  } else if (restant <= 3) {
    message = `⚠️ URGENT : il ne reste qu'environ ${restant} jour${restant > 1 ? 's' : ''} pour « ${cible.procedure} » (délai péremptoire de ${cible.jours} jours). Agissez immédiatement.`;
  } else {
    message = `Il reste environ ${restant} jours pour « ${cible.procedure} » (délai péremptoire de ${cible.jours} jours, dès l'événement). Ne tardez pas.`;
  }

  return {
    jours_restants: restant,
    delai_total: cible.jours,
    procedure: cible.procedure,
    base_legale: cible.base_legale || null,
    urgence: depasse ? 'depasse' : restant <= 3 ? 'critique' : restant <= 10 ? 'haute' : 'moyenne',
    depasse,
    date_evenement_estimee: ev.date.toISOString().slice(0, 10),
    date_evenement_raw: ev.raw,
    message
  };
}
