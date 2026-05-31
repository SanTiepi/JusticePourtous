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
  // FR
  janvier: 0, février: 1, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5,
  juillet: 6, août: 7, aout: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11, decembre: 11,
  // DE
  januar: 0, februar: 1, märz: 2, maerz: 2, april: 3, mai_de: 4, juni: 5, juli: 6,
  august: 7, oktober: 9, dezember: 11,
  // IT
  gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5, luglio: 6,
  agosto: 7, settembre: 8, ottobre: 9, dicembre: 11,
  // EN
  january: 0, february: 1, march: 2, may: 4, june: 5, july: 6,
  september: 8, october: 9, november: 10, december: 11
};
const NOMBRES = {
  // FR
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8,
  neuf: 9, dix: 10, onze: 11, douze: 12, quinze: 15, vingt: 20,
  // DE
  ein: 1, eine: 1, einem: 1, einer: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, fuenf: 5,
  sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10, zwölf: 12, zwoelf: 12,
  // IT
  uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10,
  // EN
  one: 1, two: 2, three: 3, four: 4, five: 5, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12
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

  const ago = (n, unit) => { const d = new Date(today); d.setDate(d.getDate() - n * unit); return d; };
  const num = (s) => /^\d+$/.test(s) ? parseInt(s, 10) : (NOMBRES[s] || 0);
  const unitDays = (w) => /^(jour|tag|giorn|day)/.test(w) ? 1 : /^(semaine|woche|settiman|week)/.test(w) ? 7 : 30; // mois/monat/mese/month

  // 1) Relatif "N <unité>" — FR "il y a N", DE "vor N", IT "N … fa", EN "N … ago"
  let m = t.match(/il y a\s+(\d{1,3}|[a-zà-ÿ]+)\s+(jours?|semaines?|mois)\b/)
       || t.match(/vor\s+(\d{1,3}|[a-zä-ü]+)\s+(tagen?|tage|wochen?|monaten?)\b/);
  if (m) { const n = num(m[1]); if (n > 0) return { date: ago(n, unitDays(m[2])), raw: m[0], kind: 'relatif' }; }
  m = t.match(/(\d{1,3}|[a-zà-ÿ]+)\s+(giorni?|settimane?|mesi?)\s+fa\b/)
   || t.match(/(\d{1,3}|[a-z]+)\s+(days?|weeks?|months?)\s+ago\b/);
  if (m) { const n = num(m[1]); if (n > 0) return { date: ago(n, unitDays(m[2])), raw: m[0], kind: 'relatif' }; }

  // 2) Mots relatifs simples (FR/DE/IT/EN)
  if (/\b(avant-hier|vorgestern|ieri l'altro|l'altro ieri|day before yesterday)\b/.test(t)) return { date: ago(2, 1), raw: 'avant-hier', kind: 'relatif' };
  if (/\b(hier|gestern|ieri|yesterday)\b/.test(t)) return { date: ago(1, 1), raw: 'hier', kind: 'relatif' };
  if (/\b(la semaine dernière|la semaine passée|semaine dernière|letzte[nr]? woche|settimana scorsa|last week)\b/.test(t)) return { date: ago(1, 7), raw: 'semaine dernière', kind: 'relatif' };
  if (/\b(le mois dernier|le mois passé|letzte[nr]? monat|mese scorso|last month)\b/.test(t)) return { date: ago(1, 30), raw: 'mois dernier', kind: 'relatif' };

  // 3) Date absolue numérique : "18.05.2026", "18/05/26", "18-05-2026"
  m = t.match(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})\b/);
  if (m) {
    let [, dd, mm, yy] = m;
    dd = parseInt(dd, 10); mm = parseInt(mm, 10) - 1; yy = parseInt(yy, 10);
    if (yy < 100) yy += 2000;
    const d = new Date(yy, mm, dd);
    if (!isNaN(d.getTime()) && d <= today) return { date: d, raw: m[0], kind: 'absolu' };
  }

  // 4) Date absolue littérale multilingue : "le 18 mai", "am 18. Mai", "18 maggio", "May 18"
  const moisAlt = Object.keys(MOIS).filter(k => k !== 'mai_de').join('|');
  m = t.match(new RegExp('\\b(\\d{1,2})\\.?\\s+(' + moisAlt + ')\\b'))
   || t.match(new RegExp('\\b(' + moisAlt + ')\\s+(\\d{1,2})\\b'));
  if (m) {
    const dd = /^\d/.test(m[1]) ? parseInt(m[1], 10) : parseInt(m[2], 10);
    const mois = /^\d/.test(m[1]) ? MOIS[m[2]] : MOIS[m[1]];
    if (mois != null && dd >= 1 && dd <= 31) {
      let d = new Date(today.getFullYear(), mois, dd);
      if (d > today) d = new Date(today.getFullYear() - 1, mois, dd);
      if (!isNaN(d.getTime())) return { date: d, raw: m[0], kind: 'absolu' };
    }
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
