/**
 * ⚠ LA RECEVABILITÉ — le contrôle qui manquait, et qui a coûté une rente
 *
 * ═══ POURQUOI CE FICHIER EXISTE (2026-07-12) ═══════════════════════════════
 *
 * Le 12 juillet, on a fait délibérer cinq agents adverses sur le cas d'une personne à qui
 * l'office AI refuse sa rente. Voici ce qui s'est passé, exactement :
 *
 *   · LE CHASSEUR DE PIÈGES a trouvé la vérité : « Il n'y a PAS d'opposition en AI.
 *     L'art. 69 al. 1 let. a LAI déroge aux art. 52 et 58 LPGA. C'est un recours DIRECT au
 *     tribunal cantonal, 30 jours. Envoyer une opposition à l'office ne conserve aucun
 *     délai. » Certitude : « certain ». Il avait raison.
 *
 *   · LE RÉFUTATEUR l'a DÉTRUIT : « Faux. L'opposition de l'art. 52 LPGA reste obligatoire.
 *     Confirmé par l'ATF 130 V 388 et la pratique constante des offices AI. »
 *     Cet arrêt N'EXISTE PAS sous cette forme : le 130 V 388 est une affaire de caisse de
 *     chômage, sans aucun rapport avec l'AI. La citation était fabriquée.
 *
 *   · LE JUGE a suivi le réfutateur, et a conseillé à cette personne d'écrire une
 *     opposition à l'office AI. Elle aurait attendu une décision qui n'existe pas, pendant
 *     que ses 30 jours de recours s'éteignaient. Elle aurait perdu sa rente.
 *
 * Le juge n'avait AUCUN moyen de savoir lequel des deux textes reposait sur du réel. Il a
 * donc arbitré sur ce qu'il pouvait observer : l'assurance, le détail, l'apparence de savoir.
 * Il a couronné le mensonge, parce que le mensonge était mieux habillé.
 *
 * ═══ LA LEÇON, QUI EST CONTRE-INTUITIVE ═══════════════════════════════════
 *
 * Dans un débat sans accès aux pièces, L'HALLUCINATION PART GAGNANTE.
 * Une citation vraie est contrainte : elle ne peut dire que ce que le texte dit.
 * Une citation inventée n'est contrainte par rien : elle peut être exactement l'argument
 * qu'il fallait, avec l'autorité qui manquait. Un arrêt du Tribunal fédéral fabriqué est
 * PLUS persuasif qu'un article de loi authentique.
 *
 *   → Ajouter de la contradiction sans ajouter d'accès au réel ne rend pas le système plus
 *     fiable : ça le rend MOINS fiable. Un modèle seul n'a aucun mécanisme pour se
 *     convaincre d'abandonner la bonne réponse. Notre comité en avait un.
 *
 * Le débat ne produit pas de vérité. Il produit de la VARIANCE, et il amplifie ce que
 * l'arbitre récompense. Si l'arbitre récompense la rhétorique, il amplifie l'hallucination.
 * Si l'arbitre récompense la citation vérifiée, il amplifie la vérité.
 *
 * ═══ CE QUE FAIT CE MODULE ════════════════════════════════════════════════
 *
 * Il donne au comité l'accès aux pièces. Aucun agent n'écrit ici : c'est du code qui va
 * chercher le texte de loi OFFICIEL, en vigueur AUJOURD'HUI, et qui vérifie qu'une citation
 * s'y trouve vraiment.
 *
 *   verifierCitation({ loi: 'LAI', article: '69', citation: 'En dérogation aux art. 52…' })
 *     → { statut: 'verifie' | 'article_introuvable' | 'ne_dit_pas_ca' | 'source_indisponible' }
 *
 * RÈGLE : une affirmation dont la citation n'est pas vérifiée est RETIRÉE du dossier —
 * pas « pondérée à la baisse », retirée. Le juge ne la voit jamais.
 * Sur le cas AI, l'ATF inventé du réfutateur ne passe pas ce filtre ; il se retrouve avec
 * zéro pièce recevable ; le piège du chasseur, adossé au texte littéral de l'art. 69, reste
 * debout SANS OPPOSITION. Le juge n'a même plus de dilemme. Le pire conseil du système
 * disparaît par construction — pas par chance.
 *
 * ═══ POURQUOI ON NE PEUT PAS UTILISER NOTRE PROPRE CORPUS ═════════════════
 *
 * src/data/loi/ contient 4459 « articles ». Ce ne sont PAS des textes de loi : le champ
 * s'appelle `texteSimple` et contient une paraphrase écrite par un LLM. L'art. 69 LAI —
 * celui qui décide de cette rente — n'y figure même pas. On ne peut vérifier une citation
 * contre une paraphrase : c'est vérifier une hallucination avec une autre.
 *
 * ═══ LA SOURCE ════════════════════════════════════════════════════════════
 *
 * Fedlex, le droit fédéral publié par la Confédération. Le site est une application
 * JavaScript (donc illisible par un programme — c'est probablement pour ça que ce projet a
 * fini par faire écrire ses « articles » par un LLM), MAIS il expose un point SPARQL
 * officiel, gratuit, dont la réutilisation commerciale est autorisée. On y demande la
 * consolidation EN VIGUEUR À LA DATE DU JOUR — pas la dernière publiée : la LAI a déjà
 * une version applicable au 1er janvier 2027, et servir un droit qui n'existe pas encore
 * est une faute exactement aussi grave que d'en servir un périmé.
 *
 * CONSOMMÉ PAR : adversarial-committee.mjs (le filtre de recevabilité)
 *                test/source-officielle.test.mjs (dont la veille réseau)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', 'data', 'sources-officielles');
const SPARQL = 'https://fedlex.data.admin.ch/sparqlendpoint';

/**
 * Les numéros RS des lois qu'on cite. Une loi absente d'ici ne peut PAS être vérifiée —
 * et une citation invérifiable est irrecevable. C'est volontaire : on préfère un trou
 * déclaré à une vérification de façade.
 */
export const LOIS = {
  CO: '220',          // Code des obligations (bail, travail)
  CC: '210',          // Code civil
  CPC: '272',         // Procédure civile (dont art. 145 : féries judiciaires)
  LP: '281.1',        // Poursuite pour dettes et faillite
  LPGA: '830.1',      // Partie générale du droit des assurances sociales
  LAI: '831.20',      // Assurance-invalidité  ← l'art. 69 qui a tout déclenché
  LAA: '832.20',      // Assurance-accidents
  LAMal: '832.10',    // Assurance-maladie
  LACI: '837.0',      // Assurance-chômage
  LEI: '142.20',      // Étrangers et intégration
  CP: '311.0',        // Code pénal
  LCR: '741.01',      // Circulation routière
  LEg: '151.1',       // Égalité entre femmes et hommes
  LTF: '173.110',     // Tribunal fédéral
};

// ─── Aller chercher le texte officiel ────────────────────────────────────────

async function sparql(query, timeoutMs = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(`${SPARQL}?query=${encodeURIComponent(query)}`, {
      headers: { accept: 'application/sparql-results+json' },
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`SPARQL ${r.status}`);
    return (await r.json()).results.bindings;
  } finally {
    clearTimeout(t);
  }
}

/**
 * L'URL du texte consolidé EN VIGUEUR À CETTE DATE.
 *
 * ⚠ Ne jamais prendre « la dernière version publiée ». Fedlex publie les révisions en
 * avance : au moment d'écrire, la LAI a déjà une consolidation applicable au 01.01.2027.
 * La servir à quelqu'un aujourd'hui, c'est lui donner un droit qui n'existe pas encore.
 */
export async function trouverTexteEnVigueur(rs, dateDuJour) {
  // ⚠ Le numéro RS n'est PAS un littéral simple : Fedlex le type
  // (`^^…/notation-type/id-systematique`). Comparer avec "831.20" tout court ne renvoie
  // RIEN — silencieusement. On compare donc sur str(), après avoir sondé le graphe plutôt
  // que deviné sa forme : c'est la même discipline que pour le droit lui-même.
  // ⚠ DEUX PIÈGES ICI, et les deux échouent en SILENCE (zéro résultat, aucune erreur) :
  //
  // 1. Le numéro RS n'est pas un littéral simple : Fedlex le type
  //    (`^^…/notation-type/id-systematique`). Chercher "831.20" tout court ne renvoie rien.
  //    → on compare sur str().
  // 2. Ce numéro est porté par DIX œuvres : la loi consolidée, mais aussi tous les actes
  //    qui l'ont modifiée au fil des ans (les `eli/oc/...`). Prendre la première venue,
  //    c'est servir un texte de 1998.
  //    → on exige le recueil systématique consolidé (`/eli/cc/`, type ConsolidationAbstract),
  //      celui qui fait foi aujourd'hui.
  //
  // Sondé dans le graphe, pas déduit — et même là je me suis fait avoir : ma première sonde
  // affichait le type tronqué à 80 caractères (« ConsolidationAbs »), j'ai recopié ce que je
  // croyais lire, et la requête est revenue vide. Le vrai nom est `ConsolidationAbstract`.
  // Le réflexe de compléter ce qu'on croit avoir vu ne s'éteint jamais ; seule la machine
  // qui vérifie tient.
  const eli = await sparql(`
    PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    SELECT DISTINCT ?work WHERE {
      ?work a jolux:ConsolidationAbstract ;
            jolux:classifiedByTaxonomyEntry ?entry .
      ?entry skos:notation ?n .
      FILTER(str(?n) = "${rs}")
      FILTER(CONTAINS(STR(?work), "/eli/cc/"))
    } LIMIT 1`);

  const workUri = eli[0]?.work?.value;
  if (!workUri) throw new Error(`RS ${rs} introuvable dans le registre Fedlex`);

  // ⚠ LES DATES SE COMPARENT EN TEXTE, PAS EN xsd:date. Ce n'est pas une coquetterie.
  //
  // Avec le filtre TYPÉ (`?date <= "2026-07-12"^^xsd:date`), l'endpoint écarte
  // SILENCIEUSEMENT la consolidation de la LPGA du 1er janvier 2024 et remonte celle de
  // 2022 : on servirait un texte vieux de deux ans, sans le moindre avertissement, en
  // croyant lire le droit en vigueur. (Constaté le 12.07.2026 : filtre typé → 2022-01-01 ;
  // filtre str() → 2024-01-01, la bonne.)
  // Les dates ISO se trient correctement comme du texte, et str() ne perd rien en route.
  const b = await sparql(`
    PREFIX jolux: <http://data.legilux.public.lu/resource/ontology/jolux#>
    SELECT ?date ?fin ?file WHERE {
      ?cons jolux:isMemberOf <${workUri}> ;
            jolux:dateApplicability ?date ;
            jolux:isRealizedBy ?expr .
      OPTIONAL { ?cons jolux:dateEndApplicability ?fin }
      ?expr jolux:isEmbodiedBy ?manif .
      ?manif jolux:isExemplifiedBy ?file .
      FILTER(CONTAINS(STR(?expr), "/fr"))
      FILTER(CONTAINS(STR(?file), "html"))
      FILTER(STR(?date) <= "${dateDuJour}")
      FILTER(!BOUND(?fin) || STR(?fin) >= "${dateDuJour}")
    }
    ORDER BY DESC(?date) LIMIT 1`);

  if (!b.length) throw new Error(`aucune version de RS ${rs} en vigueur le ${dateDuJour}`);
  return {
    url: b[0].file.value,
    en_vigueur_depuis: b[0].date.value,
    en_vigueur_jusqu_a: b[0].fin?.value || null,
  };
}

/** Le HTML de Fedlex → texte lisible, en gardant les ancres d'articles. */
function nettoyer(html) {
  return html
    .replace(/<sup[^>]*>.*?<\/sup>/gs, ' ')   // les appels de note (« LPGA 421 ») polluent la citation
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Charge une loi (réseau + cache disque). Le cache porte sa date de lecture et son URL :
 * une donnée sans provenance est une donnée qu'on finira par croire sans savoir pourquoi.
 */
export async function chargerLoi(nom, { dateDuJour = new Date().toISOString().slice(0, 10), forcerReseau = false } = {}) {
  const rs = LOIS[nom];
  if (!rs) throw new Error(`Loi inconnue : ${nom}. Ajoute son numéro RS dans LOIS — ne devine pas.`);

  mkdirSync(CACHE_DIR, { recursive: true });
  const fichier = join(CACHE_DIR, `${nom}.json`);

  if (!forcerReseau && existsSync(fichier)) {
    const c = JSON.parse(readFileSync(fichier, 'utf8'));
    // Le cache n'est valable que pour la période de validité de la consolidation qu'il
    // contient. Une loi révisée le 1er janvier ne doit pas être servie le 2.
    const encoreValide = (!c.en_vigueur_jusqu_a || c.en_vigueur_jusqu_a >= dateDuJour)
      && c.en_vigueur_depuis <= dateDuJour;
    if (encoreValide) return c;
  }

  const meta = await trouverTexteEnVigueur(rs, dateDuJour);
  const html = await fetch(meta.url).then(r => {
    if (!r.ok) throw new Error(`téléchargement de ${nom} : HTTP ${r.status}`);
    return r.text();
  });

  // Découpage par ancre d'article : c'est Fedlex qui les pose, on ne les devine pas.
  const articles = {};
  const re = /id="art_([0-9a-z_]+)"/g;
  const positions = [];
  let m;
  while ((m = re.exec(html)) !== null) positions.push({ num: m[1].replace(/_/g, ''), i: m.index });

  for (let k = 0; k < positions.length; k++) {
    const debut = positions[k].i;
    const fin = k + 1 < positions.length ? positions[k + 1].i : Math.min(debut + 12000, html.length);
    articles[positions[k].num] = nettoyer(html.slice(debut, fin));
  }

  const loi = {
    loi: nom,
    rs,
    source: meta.url,
    en_vigueur_depuis: meta.en_vigueur_depuis,
    en_vigueur_jusqu_a: meta.en_vigueur_jusqu_a,
    lu_le: dateDuJour,
    articles,
  };
  writeFileSync(fichier, JSON.stringify(loi, null, 1));
  return loi;
}

// ─── Le contrôle de recevabilité ─────────────────────────────────────────────

/** Comparaison tolérante à la ponctuation et aux apostrophes — pas au sens. */
function normaliser(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[«»"“”]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?()[\]]/g, '')
    .trim();
}

/**
 * L'agent affirme quelque chose en citant un article. Ce texte existe-t-il vraiment ?
 *
 * On ne demande pas une identité mot pour mot (les agents reformulent, et l'exiger
 * transformerait le filtre en machine à tout rejeter). On demande que les mots PORTEURS de
 * la citation se retrouvent dans l'article officiel. Le seuil est haut : c'est le point où
 * une citation fabriquée s'écroule, parce qu'elle invente un sens qui n'est nulle part.
 */
export function citationEstDansLeTexte(citation, texteOfficiel, seuil = 0.72) {
  const c = normaliser(citation);
  const t = normaliser(texteOfficiel);
  if (!c || !t) return { ok: false, score: 0 };

  // Une citation littérale exacte : le cas facile, et le cas honnête.
  if (t.includes(c)) return { ok: true, score: 1, litterale: true };

  // Sinon : les mots porteurs (on ignore les outils grammaticaux, qui matchent partout).
  const VIDES = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'a',
    'au', 'aux', 'en', 'dans', 'par', 'pour', 'sur', 'que', 'qui', 'est', 'sont', 'ce',
    'cette', 'ces', 'il', 'elle', 'se', 'son', 'sa', 'ses', 'leur', 'd', 'l', 'n', 's', 'y']);
  const mots = [...new Set(c.split(' ').filter(w => w.length > 2 && !VIDES.has(w)))];
  if (!mots.length) return { ok: false, score: 0 };

  const trouves = mots.filter(w => t.includes(w));
  const score = trouves.length / mots.length;
  return { ok: score >= seuil, score: Number(score.toFixed(2)), manquants: mots.filter(w => !t.includes(w)) };
}

/**
 * ⚠ LA FONCTION QUI CHANGE TOUT : on VA CHERCHER le texte, on ne le fait pas réciter.
 *
 * Première version de ce module : on exigeait de chaque agent qu'il RECOPIE le texte de
 * l'article qu'il invoque, et on rejetait ce qu'on ne pouvait pas vérifier.
 * Résultat, mesuré le soir même :
 *
 *   · Le CHASSEUR DE PIÈGES, qui avait raison, a répondu honnêtement « je sais que
 *     l'art. 69 LAI dit ça, mais je ne peux pas le citer mot à mot » → IRRECEVABLE.
 *   · Le RÉFUTATEUR, qui avait tort, se souvenait par cœur de l'art. 52 LPGA (article court
 *     et célèbre) → RECEVABLE.
 *
 * Le filtre punissait l'agent honnête et récompensait l'agent sûr de lui. La même défaite,
 * un cran plus profond.
 *
 * D'où la règle : ON NE DEMANDE PLUS À PERSONNE DE RÉCITER LA LOI. L'agent nomme l'article ;
 * le code va lire le texte officiel ; le juge lit LA LOI, pas les avocats.
 */
export async function lireArticle({ loi, article }, opts = {}) {
  if (!LOIS[loi]) {
    return {
      lisible: false,
      statut: 'source_non_verifiable',
      pourquoi: `« ${loi} » n'est pas une loi fédérale qu'on sait aller lire. Une jurisprudence, une pratique ou une doctrine invoquée de mémoire n'est pas une preuve : c'est par là qu'un ATF inventé a fait perdre une rente le 12 juillet 2026.`,
    };
  }

  let texteLoi;
  try {
    texteLoi = await chargerLoi(loi, opts);
  } catch (err) {
    // On ne bluffe pas : si Fedlex ne répond pas, on n'a pas vérifié, et on le dit.
    return { lisible: false, statut: 'source_indisponible', pourquoi: `Fedlex injoignable : ${err.message}` };
  }

  const num = String(article).replace(/^art\.?\s*/i, '').replace(/\s+/g, '').toLowerCase();
  const base = num.match(/^([0-9]+[a-z]*)/)?.[1];
  const texte = base ? texteLoi.articles[base] : null;

  if (!texte) {
    return {
      lisible: false,
      statut: 'article_introuvable',
      pourquoi: `L'art. ${base || article} n'existe pas dans la ${loi} en vigueur (version du ${texteLoi.en_vigueur_depuis}).`,
      source: texteLoi.source,
    };
  }

  return {
    lisible: true,
    statut: 'lu',
    loi,
    article: base,
    texte,
    source: texteLoi.source,
    en_vigueur_depuis: texteLoi.en_vigueur_depuis,
    // ⚠ LE DÉTAIL QUI DÉCIDE. Quand un article commence par « En dérogation aux art. 52 et
    // 58 LPGA… », le texte RÉSOUT LUI-MÊME le conflit de normes : la règle spéciale écarte
    // la règle générale. C'est exactement ce qui départage l'art. 69 LAI (« pas d'opposition
    // en AI ») de l'art. 52 LPGA (« l'opposition est la règle ») — et c'est ce que le juge
    // n'avait aucun moyen de voir, parce que personne ne lui montrait le texte.
    // On le remonte à la surface : une dérogation n'est pas un détail de rédaction, c'est la
    // clé de la porte.
    //
    // ⚠ NE PAS S'ARRÊTER AU PREMIER POINT : « art. » CONTIENT un point. Mon premier regex
    // coupait sur `[^,;.]` et livrait au juge la bannière « En dérogation aux art » — sans
    // jamais lui dire À QUELS ARTICLES il était dérogé. L'information décisive était tranchée
    // juste avant le mot qui décide, et le juge a de nouveau conseillé l'opposition.
    // Une donnée tronquée est pire qu'une donnée absente : elle a l'air d'avoir été fournie.
    //
    // La loi suisse rédige ses dérogations « En dérogation aux art. X et Y LOI : … ». On lit
    // donc jusqu'aux deux-points. Testé sur le texte réel, pas déduit de sa forme supposée —
    // deux tentatives « malignes » avant celle-ci coupaient encore au mauvais endroit.
    derogation: texte.match(/en dérogation[^:;]{5,150}/i)?.[0]?.trim() || null,
  };
}

/**
 * LE FILTRE. Une affirmation d'agent entre ; un verdict sort.
 *
 * Statuts, et ce qu'ils veulent dire pour le citoyen :
 *   · verifie              → le texte officiel dit bien ça. L'argument est recevable.
 *   · ne_dit_pas_ca        → l'article existe, mais il ne dit PAS ce qu'on lui fait dire.
 *                            C'est le cas le plus dangereux : la référence est vraie, donc
 *                            elle rassure, et le contenu est faux.
 *   · article_introuvable  → l'article n'existe pas dans la loi citée.
 *   · loi_inconnue         → on ne sait pas vérifier cette source (jurisprudence, doctrine,
 *                            droit cantonal). On ne peut PAS la traiter comme vérifiée —
 *                            c'est exactement par là qu'est passé l'ATF inventé.
 *   · source_indisponible  → Fedlex n'a pas répondu. On ne bluffe pas : on le dit.
 */
export async function verifierCitation({ loi, article, citation }, opts = {}) {
  if (!LOIS[loi]) {
    return {
      statut: 'loi_inconnue',
      recevable: false,
      pourquoi: `« ${loi} » n'est pas une loi fédérale qu'on sait vérifier. Une jurisprudence ou une pratique invoquée de mémoire n'est PAS une preuve : c'est par là qu'un ATF inventé a fait perdre une rente le 12 juillet 2026.`,
    };
  }

  let texteLoi;
  try {
    texteLoi = await chargerLoi(loi, opts);
  } catch (err) {
    return { statut: 'source_indisponible', recevable: false, pourquoi: `Fedlex injoignable : ${err.message}` };
  }

  const num = String(article).replace(/^art\.?\s*/i, '').replace(/\s+/g, '').toLowerCase();
  // « 69 al. 1 let. a » → l'article est 69 ; les alinéas vivent dans son texte.
  const base = num.match(/^([0-9]+[a-z]*)/)?.[1];
  const texteArticle = texteLoi.articles[base];

  if (!texteArticle) {
    return {
      statut: 'article_introuvable',
      recevable: false,
      pourquoi: `L'art. ${base} n'existe pas dans la ${loi} en vigueur (version du ${texteLoi.en_vigueur_depuis}).`,
      source: texteLoi.source,
    };
  }

  const v = citationEstDansLeTexte(citation, texteArticle);
  return {
    statut: v.ok ? 'verifie' : 'ne_dit_pas_ca',
    recevable: v.ok,
    score: v.score,
    litterale: v.litterale || false,
    mots_absents: v.manquants,
    texte_officiel: texteArticle.slice(0, 800),
    source: texteLoi.source,
    en_vigueur_depuis: texteLoi.en_vigueur_depuis,
    pourquoi: v.ok
      ? `Vérifié dans le texte officiel de la ${loi} (en vigueur depuis le ${texteLoi.en_vigueur_depuis}).`
      : `L'art. ${base} ${loi} EXISTE, mais son texte ne dit pas ça (${Math.round((v.score || 0) * 100)} % des mots porteurs seulement). Une référence exacte qui rassure, un contenu qui ne s'y trouve pas : c'est la forme la plus dangereuse d'erreur.`,
  };
}

export const _internals = { normaliser, nettoyer, CACHE_DIR };
