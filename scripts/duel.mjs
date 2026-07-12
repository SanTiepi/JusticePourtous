/**
 * ⚠ LE DUEL — le comité adverse contre un passage unique de modèle gratuit
 *
 * POURQUOI CE SCRIPT EXISTE (2026-07-12)
 *
 * Robin a écrit : « Pour moins de 5 francs, on obtient assez de puissance de calcul pour
 * faire tourner plusieurs agents en mode adverse. C'est ça, la vraie magie du truc. »
 *
 * C'est une hypothèse. Elle n'a jamais été testée — le pipeline dit « adversarial »
 * dépensait 8 centimes et faisait concéder son avocat adverse en dur. Sur 5 cas réels,
 * ChatGPT gratuit a battu le produit 4 fois sur 5.
 *
 * Ce script met les deux face à face :
 *
 *   BRAS A — « le gratuit » : UN seul appel, prompt simple, aucun corpus, aucune
 *            contradiction. C'est ce qu'un citoyen obtient gratuitement aujourd'hui.
 *            (Le modèle n'est pas littéralement ChatGPT — on n'a pas de clé OpenAI ici.
 *            C'est un passage unique d'un bon modèle, ce qui est le bon étalon : si notre
 *            comité ne bat pas UN passage, il ne vaut pas 5 francs. Cette substitution est
 *            dite, pas cachée.)
 *
 *   BRAS B — « le comité » : 5 agents, 3 tours, une vraie réfutation. ~0,60 CHF.
 *
 * ─── COMMENT LE SCORE EST CALCULÉ, ET POURQUOI PAS PAR UN JURY ───────────────
 *
 * Le benchmark « ×6.4 » de ce projet avait le score du concurrent ÉCRIT EN DUR. Le badge
 * « vérifié » faisait relire la fiche par le LLM qui l'avait écrite. On ne refait pas ça.
 *
 * Le score principal est MÉCANIQUE : le piège de chaque cas est connu d'avance, tiré de
 * la loi vérifiée sur Fedlex (eval/cas-pieges.mjs). Une réponse cite l'article qui sauve
 * le droit, ou elle ne le cite pas. Aucun jury ne peut repeindre ça.
 *
 * Deux mesures, symétriques, parce que les deux font perdre des droits :
 *   · PIÈGE TROUVÉ — la règle qui sauve le droit est-elle citée ?
 *   · HAMEÇON MORDU — la réponse affirme-t-elle la chose dangereuse ? (« faites
 *     opposition à l'office AI », « c'est trop tard ») Un système qui hallucine avec zèle
 *     est pire qu'un système muet.
 *
 * Un jury en aveugle passe ensuite pour la qualité d'ensemble — mais il arrive APRÈS le
 * verdict mécanique, et ne peut pas le contredire.
 *
 * ⚠ CE SCRIPT DOIT POUVOIR ANNONCER UNE DÉFAITE. Si le comité perd, il l'écrit.
 *
 * USAGE : node scripts/duel.mjs            (les 5 cas)
 *         node scripts/duel.mjs ai_refus_recours   (un seul)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAS, toucheLaCible } from '../eval/cas-pieges.mjs';
import { reunirComite } from '../src/services/adversarial-committee.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RACINE = join(__dirname, '..');

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY manquante. Le comité ne peut pas délibérer sans budget de calcul.');
  process.exit(1);
}

const AUTORITES = JSON.parse(
  readFileSync(join(RACINE, 'src/data/routes/conciliation-bail.json'), 'utf8')
);

// ─── BRAS A : le gratuit ──────────────────────────────────────────────────────

// Volontairement générique et bienveillant : c'est un prompt honnête, pas un homme de
// paille. Si on truquait ce prompt pour le faire perdre, on refabriquerait le « ×6.4 ».
const PROMPT_GRATUIT = `Tu es un assistant juridique. Tu aides une personne en Suisse qui te décrit sa situation. Réponds de manière utile, concrète et bienveillante : explique ce qu'elle peut faire, dans quel délai, auprès de qui, et sur quelle base légale. Cite les articles de loi suisses pertinents.`;

async function brasGratuit(cas) {
  const t0 = Date.now();
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: PROMPT_GRATUIT,
      messages: [{ role: 'user', content: cas.texte }],
    }),
  });
  if (!resp.ok) throw new Error(`bras gratuit : API ${resp.status}`);
  const data = await resp.json();
  const texte = (data.content || []).map(b => b.text || '').join('');
  const u = data.usage || {};
  return {
    texte,
    cout_chf: Number((((u.input_tokens || 0) / 1e6) * 3 + ((u.output_tokens || 0) / 1e6) * 15).toFixed(3)),
    duree_ms: Date.now() - t0,
    appels: 1,
  };
}

// ─── BRAS B : le comité ───────────────────────────────────────────────────────

function autoritesDuCanton(canton) {
  if (!canton) return [];
  return AUTORITES.filter(a => a.canton === canton);
}

/**
 * ⚠ Le juge rend du JSON. Un citoyen lit du français.
 *
 * Au premier duel, je donnais au jury le JSON brut, échappé, du comité — face à la prose
 * propre du bras gratuit. Le jury a noté la MISE EN FORME (« tronqué, non lisible ») et pas
 * le droit. Un banc d'essai qui compare une structure de données à un texte ne mesure rien.
 * Cette fonction est la couche que le produit aurait de toute façon : ce que la personne lit.
 */
function rendreEnFrancais(d) {
  if (!d || d._panne) return `[le comité n'a rien pu rendre : ${d?._detail || 'panne'}]\n${d?._brut || ''}`;
  const l = [];
  if (d.situation) l.push(`VOTRE SITUATION\n${d.situation}`);

  if (d.a_faire_aujourdhui?.length) {
    l.push('\nÀ FAIRE AUJOURD\'HUI');
    for (const a of d.a_faire_aujourdhui) {
      l.push(`• ${a.acte}`);
      if (a.aupres_de) l.push(`  Auprès de : ${a.aupres_de}`);
      if (a.cout) l.push(`  Coût : ${a.cout}`);
      if (a.base_legale) l.push(`  Base légale : ${a.base_legale}`);
      if (a.pourquoi_maintenant) l.push(`  Pourquoi maintenant : ${a.pourquoi_maintenant}`);
    }
  }

  if (d.delai) {
    const x = d.delai;
    l.push(`\nLE DÉLAI\n${x.duree || '?'} — à partir de : ${x.point_de_depart || '?'}`);
    if (x.base_legale) l.push(`Base légale : ${x.base_legale}`);
    if (x.suspendu_ou_reporte) l.push(`Suspension / report : ${x.suspendu_ou_reporte}`);
    if (x.certitude) l.push(`Certitude : ${x.certitude}`);
  }

  if (d.pieges_retenus?.length) {
    l.push('\nCE QUI POURRAIT VOUS FAIRE PERDRE VOTRE DROIT');
    for (const p of d.pieges_retenus) l.push(`• ${p.titre} (${p.base_legale || 'base légale à confirmer'})`);
  }
  // Les pièges ÉCARTÉS sont montrés aussi : c'est la preuve que la contradiction a eu lieu,
  // et c'est précisément ce que le citoyen a payé.
  if (d.pieges_ecartes?.length) {
    l.push('\nCE QU\'ON A EXAMINÉ PUIS ÉCARTÉ (après contradiction)');
    for (const p of d.pieges_ecartes) l.push(`• ${p.titre} — écarté : ${p.pourquoi_ecarte}`);
  }
  if (d.desaccords?.length) l.push(`\nLÀ OÙ NOTRE COMITÉ N'EST PAS D'ACCORD\n${d.desaccords.map(x => `• ${x}`).join('\n')}`);
  if (d.questions_a_lui_poser?.length) l.push(`\nCE QU'IL NOUS MANQUE POUR ÊTRE SÛRS\n${d.questions_a_lui_poser.map(x => `• ${x}`).join('\n')}`);
  if (d.ce_que_je_ne_sais_pas?.length) l.push(`\nCE QU'ON NE SAIT PAS\n${d.ce_que_je_ne_sais_pas.map(x => `• ${x}`).join('\n')}`);
  if (d.pourquoi_un_humain) l.push(`\nVOIR UN HUMAIN : ${d.pourquoi_un_humain}`);
  return l.join('\n');
}

async function brasComite(cas) {
  const dossier = {
    texte_citoyen: cas.texte,
    canton: cas.canton,
    date_du_jour: cas.date_du_jour || '2026-07-12',
    faits: {},
    // ⚠ On ne fournit AUCUNE fiche du corpus : l'audit a montré que 24 % seulement de ses
    // affirmations sont correctes. Le comité raisonne sur les faits + le droit, et sur la
    // seule donnée dont on soit sûr : les autorités lues à la source officielle (OFL).
    // Si le comité gagne sans le corpus, c'est la preuve que le corpus n'était pas le produit.
    autorites: autoritesDuCanton(cas.canton),
  };

  const r = await reunirComite(dossier, {
    apiKey: API_KEY,
    onEtape: (label) => process.stdout.write(`    · ${label}\n`),
  });

  // Le texte à scorer = ce que le comité RESTITUE au citoyen, dans la langue où il le lit.
  // Pas la délibération interne : un piège trouvé par le chasseur mais écarté par le juge
  // n'a pas aidé la personne. On score ce qu'elle lit, pas ce qu'on a pensé.
  return {
    texte: rendreEnFrancais(r.decision),
    decision: r.decision,
    deliberation: r.deliberation,
    greffe: r.greffe,
    echecs: r.echecs,
    contradiction_a_eu_lieu: r.contradiction_a_eu_lieu,
    cout_chf: r.cout.cout_estime_chf,
    duree_ms: r.cout.duree_ms,
    appels: r.cout.appels_llm,
  };
}

// ─── LE VERDICT MÉCANIQUE ─────────────────────────────────────────────────────

function scorer(cas, texte) {
  const piege_trouve = toucheLaCible(texte, cas.piege);
  const secondaires = (cas.aussi_attendu || []).map(c => ({ quoi: c.quoi, trouve: toucheLaCible(texte, c) }));
  const hamecons_mordus = (cas.hamecons || []).filter(h => toucheLaCible(texte, h)).map(h => h.quoi);
  return {
    piege_trouve,
    secondaires,
    hamecons_mordus,
    // Le seul résultat qui compte vraiment : elle repart avec son droit, ou pas.
    droit_sauve: piege_trouve && hamecons_mordus.length === 0,
  };
}

// ─── LE JURY (en aveugle, et APRÈS le mécanique) ──────────────────────────────

async function jurer(cas, texteA, texteB, ordreInverse) {
  const [r1, r2] = ordreInverse ? [texteB, texteA] : [texteA, texteB];
  const system = `Tu es juge dans un concours de conseil juridique suisse. Tu ne sais pas qui a écrit quoi, et tu ne dois pas chercher à le deviner.

Une seule question compte : SI CETTE PERSONNE SUIT CETTE RÉPONSE, EST-CE QU'ELLE GARDE SON DROIT, OU EST-CE QU'ELLE LE PERD ?

Ce qui fait perdre un droit, par ordre de gravité :
1. Affirmer une chose fausse qui la fait agir à tort (l'envoyer au mauvais guichet, lui faire faire un acte qui ne conserve aucun délai).
2. La décourager — dire « c'est trop tard », « il n'y a plus rien à faire ». En droit suisse, agir est presque toujours gratuit ; le silence est irréversible.
3. Manquer la règle qui la sauvait.
4. Être si vague ou si jargonneuse qu'elle ne sait pas quoi faire demain matin.

Ne récompense PAS la longueur, l'élégance ni l'abondance d'articles cités. Un texte long et faux est pire qu'un texte court et juste.

Réponds en JSON : { "gagnant": "1" | "2" | "egalite", "pourquoi": "en 2 phrases", "erreur_grave_1": "la pire erreur de la réponse 1, ou null", "erreur_grave_2": "la pire erreur de la réponse 2, ou null" }`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 1200,
      system,
      messages: [{ role: 'user', content: `SITUATION :\n"""${cas.texte}"""\n\n═══ RÉPONSE 1 ═══\n${r1}\n\n═══ RÉPONSE 2 ═══\n${r2}` }],
    }),
  });
  if (!resp.ok) return { gagnant: 'erreur', pourquoi: `jury indisponible (API ${resp.status})` };
  const data = await resp.json();
  const brut = (data.content || []).map(b => b.text || '').join('').replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  let j;
  try { j = JSON.parse(brut); } catch { return { gagnant: 'erreur', pourquoi: 'jury hors-schéma' }; }

  // Dé-anonymisation : « 1 » et « 2 » redeviennent « gratuit » et « comité ».
  const map = ordreInverse ? { '1': 'comite', '2': 'gratuit' } : { '1': 'gratuit', '2': 'comite' };
  return {
    gagnant: map[j.gagnant] || j.gagnant,
    pourquoi: j.pourquoi,
    erreur_gratuit: ordreInverse ? j.erreur_grave_2 : j.erreur_grave_1,
    erreur_comite: ordreInverse ? j.erreur_grave_1 : j.erreur_grave_2,
  };
}

// ─── Le duel ──────────────────────────────────────────────────────────────────

const filtre = process.argv[2];
const cas_a_jouer = filtre ? CAS.filter(c => c.id === filtre) : CAS;
if (!cas_a_jouer.length) {
  console.error(`Cas inconnu : ${filtre}. Cas disponibles : ${CAS.map(c => c.id).join(', ')}`);
  process.exit(1);
}

const resultats = [];

for (const [i, cas] of cas_a_jouer.entries()) {
  console.log(`\n${'═'.repeat(72)}`);
  console.log(`CAS ${i + 1}/${cas_a_jouer.length} — ${cas.titre}`);
  console.log(`  Piège attendu : ${cas.piege.titre}`);
  console.log('─'.repeat(72));

  console.log('  BRAS A — modèle gratuit, un passage');
  const a = await brasGratuit(cas);
  const scoreA = scorer(cas, a.texte);
  console.log(`    piège ${scoreA.piege_trouve ? 'TROUVÉ ✓' : 'MANQUÉ ✗'}` +
    (scoreA.hamecons_mordus.length ? ` · hameçon MORDU ⚠ : ${scoreA.hamecons_mordus.join(' / ')}` : '') +
    ` · ${a.cout_chf} CHF`);

  console.log('  BRAS B — le comité (5 agents, 3 tours)');
  const b = await brasComite(cas);
  const scoreB = scorer(cas, b.texte);
  console.log(`    piège ${scoreB.piege_trouve ? 'TROUVÉ ✓' : 'MANQUÉ ✗'}` +
    (scoreB.hamecons_mordus.length ? ` · hameçon MORDU ⚠ : ${scoreB.hamecons_mordus.join(' / ')}` : '') +
    ` · ${b.cout_chf} CHF · ${b.appels} appels`);
  if (b.echecs.length) console.log(`    ⚠ rôles muets : ${b.echecs.join(' | ')}`);
  if (!b.contradiction_a_eu_lieu) console.log('    ⚠ LA CONTRADICTION N\'A PAS EU LIEU (le réfutateur est tombé) — le résultat ne prouve rien');

  // L'ordre alterne : un jury LLM a un biais de position, et on ne veut pas le mesurer.
  const jury = await jurer(cas, a.texte, b.texte, i % 2 === 1);
  console.log(`  JURY (aveugle) → ${jury.gagnant} : ${jury.pourquoi}`);

  resultats.push({ cas: cas.id, titre: cas.titre, piege: cas.piege.titre, gratuit: { ...a, score: scoreA }, comite: { ...b, score: scoreB }, jury });
}

// ─── Le bilan ─────────────────────────────────────────────────────────────────

const n = resultats.length;
const bilan = {
  date: '2026-07-12',
  cas: n,
  gratuit: {
    pieges_trouves: resultats.filter(r => r.gratuit.score.piege_trouve).length,
    hamecons_mordus: resultats.filter(r => r.gratuit.score.hamecons_mordus.length).length,
    droits_sauves: resultats.filter(r => r.gratuit.score.droit_sauve).length,
    cout_total_chf: Number(resultats.reduce((s, r) => s + r.gratuit.cout_chf, 0).toFixed(3)),
  },
  comite: {
    pieges_trouves: resultats.filter(r => r.comite.score.piege_trouve).length,
    hamecons_mordus: resultats.filter(r => r.comite.score.hamecons_mordus.length).length,
    droits_sauves: resultats.filter(r => r.comite.score.droit_sauve).length,
    cout_total_chf: Number(resultats.reduce((s, r) => s + r.comite.cout_chf, 0).toFixed(3)),
    cout_moyen_chf: Number((resultats.reduce((s, r) => s + r.comite.cout_chf, 0) / n).toFixed(3)),
  },
  jury: {
    gratuit: resultats.filter(r => r.jury.gagnant === 'gratuit').length,
    comite: resultats.filter(r => r.jury.gagnant === 'comite').length,
    egalite: resultats.filter(r => r.jury.gagnant === 'egalite').length,
  },
};

console.log(`\n${'═'.repeat(72)}`);
console.log('BILAN — la seule question : le citoyen repart-il avec son droit ?\n');
console.log(`                        gratuit (1 passage)   comité (5 agents)`);
console.log(`  pièges trouvés            ${bilan.gratuit.pieges_trouves}/${n}                  ${bilan.comite.pieges_trouves}/${n}`);
console.log(`  hameçons mordus ⚠         ${bilan.gratuit.hamecons_mordus}/${n}                  ${bilan.comite.hamecons_mordus}/${n}`);
console.log(`  DROITS SAUVÉS             ${bilan.gratuit.droits_sauves}/${n}                  ${bilan.comite.droits_sauves}/${n}`);
console.log(`  jury en aveugle           ${bilan.jury.gratuit}                    ${bilan.jury.comite}   (égalité : ${bilan.jury.egalite})`);
console.log(`  coût                      ${bilan.gratuit.cout_total_chf} CHF              ${bilan.comite.cout_total_chf} CHF  (${bilan.comite.cout_moyen_chf}/cas)`);

// Le verdict, écrit d'avance, qui a le droit de dire non.
const verdict = bilan.comite.droits_sauves > bilan.gratuit.droits_sauves
  ? `✓ LE COMITÉ GAGNE (${bilan.comite.droits_sauves} droits sauvés contre ${bilan.gratuit.droits_sauves}) — à ${bilan.comite.cout_moyen_chf} CHF le dossier, la thèse des 5 francs tient.`
  : bilan.comite.droits_sauves === bilan.gratuit.droits_sauves
    ? `✗ ÉGALITÉ (${bilan.comite.droits_sauves}/${n} des deux côtés). Le comité coûte ${Math.round(bilan.comite.cout_total_chf / Math.max(bilan.gratuit.cout_total_chf, 0.001))}× plus cher SANS sauver un droit de plus. On ne peut pas facturer ça.`
    : `✗ LE COMITÉ PERD (${bilan.comite.droits_sauves} contre ${bilan.gratuit.droits_sauves}). La contradiction n'apporte rien ici. La thèse est fausse — il faut le dire.`;
console.log(`\n${verdict}\n`);

mkdirSync(join(RACINE, 'eval'), { recursive: true });
const sortie = join(RACINE, 'eval', 'duel-resultats.json');
writeFileSync(sortie, JSON.stringify({ bilan, verdict, resultats }, null, 2));
console.log(`Détail complet (avec chaque délibération) : ${sortie}`);
