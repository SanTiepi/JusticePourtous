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
import { CAS } from '../eval/cas-pieges.mjs';
import { classer, juger } from '../eval/scoreur.mjs';
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
/**
 * Quand le comité REFUSE de conseiller parce qu'il lui manque un fait décisif, c'est une
 * réponse à part entière — et c'est la moitié de la vision de Robin (« on récolte les infos
 * via des questions à l'utilisateur »). Il faut la rendre lisible, pas la traiter comme un échec.
 */
function rendreQuestions(r) {
  const l = [];
  l.push('AVANT DE VOUS RÉPONDRE, IL ME MANQUE QUELQUE CHOSE');
  l.push('Je ne veux pas vous donner un conseil qui a l\'air juste mais que j\'aurais inventé.');

  // ⚠ L'acte sûr passe AVANT les questions. Un délai ne s'arrête pas pour attendre une réponse.
  if (r.acte_sur_immediat?.acte) {
    l.push(`\n⚠ MAIS IL Y A UNE CHOSE À FAIRE DÈS AUJOURD'HUI, QUELLE QUE SOIT LA RÉPONSE :`);
    l.push(`• ${r.acte_sur_immediat.acte}`);
    if (r.acte_sur_immediat.pourquoi) l.push(`  Pourquoi : ${r.acte_sur_immediat.pourquoi}`);
  }

  if (r.ce_qu_on_sait_deja?.length) {
    l.push(`\nCE QUE J'AI DÉJÀ COMPRIS (je ne vous le redemande pas)`);
    for (const x of r.ce_qu_on_sait_deja) l.push(`• ${x}`);
  }

  l.push('\nMES QUESTIONS');
  for (const q of r.questions || []) {
    l.push(`• ${q.question}`);
    if (q.ca_change_tout_parce_que) l.push(`  (ça change tout : ${q.ca_change_tout_parce_que})`);
  }
  return l.join('\n');
}

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
  //
  // Et refuser de conseiller EST une réponse — la bonne, quand répondre voudrait dire inventer.
  return {
    texte: r.statut === 'questions' ? rendreQuestions(r) : rendreEnFrancais(r.decision),
    statut: r.statut,
    questions: r.questions,
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

// ─── LE VERDICT ───────────────────────────────────────────────────────────────
//
// ⚠ Ce n'est plus un tas d'expressions régulières. L'ancien scoreur a menti TROIS FOIS en une
// journée : il a puni le comité à tort (il sanctionnait la présence du texte « 336b » alors
// que le juge menait correctement avec la nullité), absous le modèle gratuit à tort (son regex
// cherchait « envoyez » là où le texte disait « envoyer »), et crié « hameçon mordu » sur la
// phrase « lettre de RECOURS (pas une opposition) » — c'est-à-dire sur la seule bonne réponse
// que le comité ait produite. Un regex ne voit pas une négation.
//
// Désormais : LE MODÈLE RANGE, LE CODE TRANCHE. Un agent classe la réponse dans une liste
// fermée d'actes (une transcription, pas un jugement), et le verdict est calculé par du code
// contre l'oracle. Voir eval/scoreur.mjs.

async function scorer(cas, texte) {
  const classement = await classer(texte, cas, API_KEY);
  return { ...juger(classement, cas), classement };
}

// ─── LE JURY — RÉTROGRADÉ ─────────────────────────────────────────────────────
//
// ⚠ IL NE NOTE PLUS LE DROIT. IL N'EN A PLUS LE DROIT.
//
// On lui a d'abord demandé de juger si la réponse sauvait le droit de la personne. Il a voté
// 4 contre 1 pour le comité qui conseillait une opposition à l'office AI — c'est-à-dire pour
// la réponse qui fait perdre la rente. Il a même écrit, à propos des deux réponses : « elles
// identifient correctement la voie d'opposition (art. 52 LPGA) ». Il est tombé dans le piège
// exactement comme les agents qu'il jugeait, et pour la même raison : le réflexe « en assurance
// sociale, on fait opposition » écrase la lecture.
//
// Il ne mesurait pas la justesse. Il mesurait « quelle réponse RESSEMBLE le plus à du bon
// travail ». C'est précisément l'instrument qui ne peut pas annoncer une mauvaise nouvelle —
// ce projet en a déjà eu trois.
//
// Il garde donc la seule chose qu'un lecteur peut honnêtement juger sans connaître le droit :
// EST-CE QUE JE COMPRENDS CE QUE JE DOIS FAIRE DEMAIN MATIN ? La justesse juridique, elle, est
// tranchée par le code contre l'oracle. Jamais par un vote.

async function jurer(cas, texteA, texteB, ordreInverse) {
  const [r1, r2] = ordreInverse ? [texteB, texteA] : [texteA, texteB];
  const system = `Tu n'es PAS juriste, et surtout : ON NE TE DEMANDE PAS SI LA RÉPONSE EST JURIDIQUEMENT JUSTE. Quelqu'un d'autre s'en charge, avec le texte de loi sous les yeux. Toi, tu n'as pas le droit de trancher ça — et si tu essaies, tu te tromperas : un jury comme toi a déjà voté pour la réponse qui faisait perdre une rente, parce qu'elle avait l'air plus professionnelle.

Tu es une personne ordinaire, en difficulté, qui vient de recevoir ces deux réponses. Tu paniques un peu. Tu n'as pas d'avocat.

UNE SEULE QUESTION : avec laquelle des deux sais-tu QUOI FAIRE DEMAIN MATIN ?

Ce qui compte pour toi :
- Est-ce que je sais quel geste poser, et où aller ?
- Est-ce que je comprends les mots ? (« péremption », « mainlevée », « nullité relative » ne veulent rien dire pour moi)
- Est-ce que je sais combien ça coûte, et si j'ai le temps ?
- Est-ce que je me sens capable de le faire, ou est-ce que je me sens noyé ?
- Est-ce qu'on m'a donné une adresse ou un numéro sur lequel je peux compter ?

Ce qui NE compte PAS : la longueur, l'élégance, le nombre d'articles cités, l'air savant. Un texte long et impressionnant qui me laisse paralysé ne vaut rien.

Réponds en JSON : { "gagnant": "1" | "2" | "egalite", "pourquoi": "en 2 phrases, du point de vue de cette personne", "erreur_grave_1": "ce qui me perd le plus dans la réponse 1, ou null", "erreur_grave_2": "idem pour la 2, ou null" }`;

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

const args = process.argv.slice(2);
const filtre = args.find(a => !a.startsWith('-'));
// ⚠ LES RÉPÉTITIONS NE SONT PAS UN LUXE — C'EST LA MESURE QUI COMPTE.
//
// Sur le cas vague, le modèle gratuit a INVENTÉ un délai à un tour, puis POSÉ LES BONNES
// QUESTIONS au tour suivant. Même prompt, même cas, deux comportements opposés. Un seul
// échantillon ne prouve donc rien — ni pour lui, ni pour nous.
//
// Et c'est exactement ce qu'un citoyen achète : pas « avoir raison une fois », mais POUVOIR
// COMPTER DESSUS. Personne ne joue sa rente à pile ou face. La fiabilité EST le produit.
const REPETITIONS = Number(args.find(a => a.startsWith('--x'))?.slice(3) || 1);

const cas_a_jouer = filtre ? CAS.filter(c => c.id === filtre) : CAS;
if (!cas_a_jouer.length) {
  console.error(`Cas inconnu : ${filtre}. Cas disponibles : ${CAS.map(c => c.id).join(', ')}`);
  process.exit(1);
}

const resultats = [];

/** Ce que la personne repart faire — dit en une ligne, sans jargon. */
function ligne(score) {
  if (score.droit_sauve) return `✓ elle fait le bon geste (${score.acte_conseille})`;
  if (score.decourage) return `✗ ON LA DÉCOURAGE — « ${String(score.preuve || '').slice(0, 60)}… »`;
  if (score.acte_fatal_conseille) return `✗ ELLE PERD SON DROIT — on lui dit de faire : ${score.acte_conseille} (au lieu de ${score.acte_attendu})`;
  return `✗ elle ne fait pas le bon geste : ${score.acte_conseille} (attendu : ${score.acte_attendu})`;
}

for (const [i, cas] of cas_a_jouer.entries()) {
  console.log(`\n${'═'.repeat(72)}`);
  console.log(`CAS ${i + 1}/${cas_a_jouer.length} — ${cas.titre}${REPETITIONS > 1 ? ` (×${REPETITIONS})` : ''}`);
  console.log(`  Le bon geste : ${cas.acte_correct}`);
  console.log(`  Ce qui la tue : ${(cas.actes_fatals || []).join(', ') || '(rien de fatal)'}`);
  console.log('─'.repeat(72));

  for (let essai = 1; essai <= REPETITIONS; essai++) {
    if (REPETITIONS > 1) console.log(`\n  ── essai ${essai}/${REPETITIONS}`);

    console.log('  BRAS A — modèle gratuit, un passage');
    const a = await brasGratuit(cas);
    const scoreA = await scorer(cas, a.texte);
    console.log(`    ${ligne(scoreA)}  ·  ${a.cout_chf} CHF`);

    console.log('  BRAS B — le comité (enquêteur → 3 voix → réfutateur → greffe → juge)');
    const b = await brasComite(cas);
    const scoreB = await scorer(cas, b.texte);
    if (b.statut === 'questions') console.log(`    (le comité REFUSE de conseiller : il pose ${b.questions?.length || 0} question(s) — il ne devine pas)`);
    console.log(`    ${ligne(scoreB)}  ·  ${b.cout_chf} CHF · ${b.appels} appels`);
    if (b.greffe?.articles_lus?.length) console.log(`    lois lues : ${b.greffe.articles_lus.join(' · ')}`);
    if (b.greffe?.ecartees_par_la_loi?.length) console.log(`    écartées par la loi elle-même : ${b.greffe.ecartees_par_la_loi.length} affirmation(s)`);
    if (b.echecs.length) console.log(`    ⚠ rôles muets : ${b.echecs.join(' | ')}`);

    // L'ordre alterne : un jury LLM a un biais de position, et on ne veut pas le mesurer.
    // Rappel : ce jury ne note QUE la lisibilité. Il n'a plus le droit de juger le droit.
    const jury = await jurer(cas, a.texte, b.texte, (i + essai) % 2 === 1);
    console.log(`    LISIBILITÉ (aveugle) → ${jury.gagnant}`);

    resultats.push({
      cas: cas.id, titre: cas.titre, essai, acte_correct: cas.acte_correct,
      gratuit: { ...a, score: scoreA }, comite: { ...b, score: scoreB }, jury,
    });
  }
}

// ─── Le bilan ─────────────────────────────────────────────────────────────────

const n = resultats.length;
const compte = (bras, f) => resultats.filter(r => f(r[bras].score)).length;
const somme = (bras) => Number(resultats.reduce((s, r) => s + r[bras].cout_chf, 0).toFixed(3));

const cote = (bras) => ({
  droits_sauves: compte(bras, s => s.droit_sauve),
  // Les deux façons de perdre un droit — et il faut les compter séparément, parce qu'elles
  // n'appellent pas la même correction.
  acte_fatal_conseille: compte(bras, s => s.acte_fatal_conseille),   // on l'envoie se pendre
  a_decourage: compte(bras, s => s.decourage),                       // on lui dit « c'est foutu »
  bon_acte_manque: compte(bras, s => !s.conseille_le_bon_acte && !s.acte_fatal_conseille),
  cout_total_chf: somme(bras),
  cout_moyen_chf: Number((somme(bras) / n).toFixed(3)),
});

const bilan = {
  date: '2026-07-12',
  cas: n,
  gratuit: cote('gratuit'),
  comite: cote('comite'),
  lisibilite: {
    gratuit: resultats.filter(r => r.jury.gagnant === 'gratuit').length,
    comite: resultats.filter(r => r.jury.gagnant === 'comite').length,
    egalite: resultats.filter(r => r.jury.gagnant === 'egalite').length,
  },
};

const col = (x) => String(x).padEnd(6);
console.log(`\n${'═'.repeat(72)}`);
console.log('BILAN — la seule question : cette personne repart-elle avec son droit ?\n');
console.log(`                              gratuit        comité`);
console.log(`                              (1 passage)    (5 agents + greffe)`);
console.log(`  ✓ DROITS SAUVÉS             ${col(`${bilan.gratuit.droits_sauves}/${n}`)}         ${bilan.comite.droits_sauves}/${n}`);
console.log(`  ✗ acte FATAL conseillé      ${col(`${bilan.gratuit.acte_fatal_conseille}/${n}`)}         ${bilan.comite.acte_fatal_conseille}/${n}   ← on la fait perdre`);
console.log(`  ✗ a découragé (« trop tard »)${col(`${bilan.gratuit.a_decourage}/${n}`)}        ${bilan.comite.a_decourage}/${n}   ← le silence est irréversible`);
console.log(`  ✗ bon geste manqué          ${col(`${bilan.gratuit.bon_acte_manque}/${n}`)}         ${bilan.comite.bon_acte_manque}/${n}`);
console.log(`  · lisibilité (aveugle)      ${col(bilan.lisibilite.gratuit)}         ${bilan.lisibilite.comite}     (égalité : ${bilan.lisibilite.egalite})`);
console.log(`  · coût                      ${col(bilan.gratuit.cout_total_chf + ' CHF')}      ${bilan.comite.cout_total_chf} CHF  (${bilan.comite.cout_moyen_chf}/cas)`);

// Le verdict est écrit D'AVANCE, et il a le droit de dire non. C'est toute la différence avec
// le benchmark « ×6.4 » de ce projet, dont le score du concurrent était écrit en dur.
const rapport = Math.round(bilan.comite.cout_total_chf / Math.max(bilan.gratuit.cout_total_chf, 0.001));
const verdict = bilan.comite.droits_sauves > bilan.gratuit.droits_sauves
  ? `✓ LE COMITÉ GAGNE : ${bilan.comite.droits_sauves} droits sauvés contre ${bilan.gratuit.droits_sauves}, à ${bilan.comite.cout_moyen_chf} CHF le dossier.
   La thèse de Robin tient : la puissance de calcul, DÉPENSÉE À ALLER VÉRIFIER, sauve des droits
   qu'un passage unique perd. Reste à tenir ça sur bien plus que ${n} cas.`
  : bilan.comite.droits_sauves === bilan.gratuit.droits_sauves
    ? `✗ ÉGALITÉ : ${bilan.comite.droits_sauves}/${n} des deux côtés, et le comité coûte ${rapport}× plus cher.
   On ne peut pas facturer 5 francs une délibération qui ne sauve pas un droit de plus qu'un
   passage gratuit. Soit on trouve les cas où elle fait la différence, soit on ne la vend pas.`
    : `✗ LE COMITÉ PERD : ${bilan.comite.droits_sauves} contre ${bilan.gratuit.droits_sauves}, pour ${rapport}× le prix.
   La contradiction n'ajoute rien ici — pire, elle détruit. Il faut le dire à Robin tel quel.`;
console.log(`\n${verdict}\n`);

// ⚠ Le chiffre qui compte plus que le score : combien de fois envoie-t-on quelqu'un
// faire l'acte qui lui coûte son droit ? Un système qui hallucine avec zèle est PIRE qu'un
// système muet — et ça, aucune moyenne ne le montre.
const fatals = resultats.filter(r => r.comite.score.acte_fatal_conseille || r.comite.score.decourage);
if (fatals.length) {
  console.log('⚠⚠ LE COMITÉ A FAIT PERDRE UN DROIT DANS CES CAS — à corriger avant toute autre chose :');
  for (const f of fatals) console.log(`   · ${f.titre}${f.essai ? ` (essai ${f.essai})` : ''} → ${f.comite.score.acte_conseille} (il fallait : ${f.acte_correct})`);
  console.log('');
}

// ═══ LA FIABILITÉ — et c'est ELLE qu'on vend ═══════════════════════════════════
//
// Personne ne joue sa rente à pile ou face. « Avoir raison une fois sur deux » n'est pas un
// produit : c'est un piège, parce que la personne ne sait pas dans quelle moitié elle est.
// Sur le cas vague, le modèle gratuit a inventé un délai à un tour, puis posé les bonnes
// questions au tour suivant — même prompt, même cas. Cette instabilité EST le problème que
// notre argent achète : un garde-fou structurel ne dépend pas de l'humeur du modèle.
if (REPETITIONS > 1) {
  console.log('═'.repeat(72));
  console.log(`FIABILITÉ — sur ${REPETITIONS} essais par cas. C'est ÇA qu'un citoyen achète :\n`);
  console.log('  cas                                    gratuit      comité');
  for (const cas of cas_a_jouer) {
    const essais = resultats.filter(r => r.cas === cas.id);
    const okG = essais.filter(r => r.gratuit.score.droit_sauve).length;
    const okC = essais.filter(r => r.comite.score.droit_sauve).length;
    const marque = (ok) => {
      if (ok === REPETITIONS) return `${ok}/${REPETITIONS} ✓ fiable`;
      if (ok === 0) return `${ok}/${REPETITIONS} ✗ toujours faux`;
      return `${ok}/${REPETITIONS} ⚠ PILE OU FACE`;   // le pire des trois : indétectable de l'intérieur
    };
    console.log(`  ${cas.titre.slice(0, 36).padEnd(38)} ${marque(okG).padEnd(12)} ${marque(okC)}`);
  }
  const fiablesG = cas_a_jouer.filter(c => resultats.filter(r => r.cas === c.id).every(r => r.gratuit.score.droit_sauve)).length;
  const fiablesC = cas_a_jouer.filter(c => resultats.filter(r => r.cas === c.id).every(r => r.comite.score.droit_sauve)).length;
  console.log(`\n  CAS SAUVÉS À TOUS LES COUPS :          ${fiablesG}/${cas_a_jouer.length}          ${fiablesC}/${cas_a_jouer.length}`);
  console.log('  (un cas « pile ou face » ne compte pas : on ne peut pas le vendre.)\n');
}

mkdirSync(join(RACINE, 'eval'), { recursive: true });
const sortie = join(RACINE, 'eval', 'duel-resultats.json');
writeFileSync(sortie, JSON.stringify({ bilan, verdict, resultats }, null, 2));
console.log(`Détail complet (avec chaque délibération) : ${sortie}`);
