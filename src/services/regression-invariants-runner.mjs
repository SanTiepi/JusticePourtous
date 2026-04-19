/**
 * regression-invariants-runner.mjs — Runner du pack de régression juridique
 *
 * Prend un tableau de définitions d'invariants (voir src/data/meta/regression-invariants.json)
 * + une Map<fiche_id, fiche> et vérifie chaque invariant contre la fiche actuelle.
 *
 * Retourne { passes, failures, total_count, pass_count } :
 *   - failures : [{ intent_id, invariant, reason }]
 *   - pass_count / total_count : agrégats pour reporting
 *
 * Types d'invariants supportés :
 *   - article_present          : { value }          → article cité exactement
 *   - article_with_source_id   : { ref_regex }      → au moins un article match et a source_id
 *   - delai_exists             : { match }          → un délai/procédure matche la string
 *   - escalade_type_present    : { value }          → un service dont type inféré contient value
 *   - confiance_at_least       : { value }          → confiance ≥ niveau
 *   - jurisprudence_min_count  : { value }          → au moins N arrêts
 *   - tag_present              : { value }          → au moins ce tag (case-insensitive)
 *   - template_exists          : { }                → modèle de lettre présent
 */

import { getSourceByRef } from './source-registry.mjs';

// Ordre strict des niveaux de confiance
const CONFIANCE_ORDER = ['incertain', 'variable', 'probable', 'certain'];

// Patterns pour inférer le type d'un service (mirror de seed-regression-invariants.mjs)
const ESCALADE_TYPE_PATTERNS = [
  { type: 'asloca', re: /asloca/i },
  { type: 'syndicat', re: /syndicat|unia|sit\b/i },
  { type: 'tribunal', re: /tribunal|prud'?hommes/i },
  { type: 'conciliation', re: /conciliation|autorit[ée]/i },
  { type: 'lavi', re: /lavi/i },
  { type: 'caritas', re: /caritas/i },
  { type: 'csp', re: /centre social|csp\b/i },
  { type: 'office_poursuites', re: /office des poursuites|office.*faillite/i },
  { type: 'egalite', re: /bureau de l.?[ée]galit[ée]/i },
  { type: 'avocat', re: /ordre des avocats|barreau|avocat/i },
];

function detectServiceType(name) {
  if (!name) return null;
  for (const p of ESCALADE_TYPE_PATTERNS) if (p.re.test(name)) return p.type;
  return null;
}

// ── Vérifications par type d'invariant ──────────────────────────────

function checkArticlePresent(fiche, inv) {
  const want = inv.value;
  const refs = (fiche.reponse?.articles || []).map(a => a.ref);
  if (refs.includes(want)) return { ok: true };
  return { ok: false, reason: `article "${want}" manquant (articles présents: ${refs.join(', ') || '∅'})` };
}

function checkArticleWithSourceId(fiche, inv) {
  const re = new RegExp(inv.ref_regex);
  const arts = (fiche.reponse?.articles || []).filter(a => re.test(a.ref || ''));
  if (!arts.length) {
    return { ok: false, reason: `aucun article ne match /${inv.ref_regex}/` };
  }
  // Chercher au moins un article qui résout dans le source registry
  for (const a of arts) {
    // Si la fiche embarque déjà un source_id non-null
    if (a.source_id) return { ok: true };
    // Sinon, essayer de résoudre via le registry
    try {
      const src = getSourceByRef(a.ref);
      if (src?.source_id) return { ok: true };
    } catch (_) { /* ignore registry failure */ }
  }
  return { ok: false, reason: `article(s) matchant /${inv.ref_regex}/ sans source_id résolu` };
}

function checkDelaiExists(fiche, inv) {
  const match = String(inv.match || '').toLowerCase();
  if (!match) return { ok: false, reason: 'match vide' };
  const tokens = match.split('|').map(t => t.trim()).filter(Boolean);

  const etapes = (fiche.cascades || []).flatMap(c => c.etapes || []);
  for (const e of etapes) {
    const delai = String(e.delai || '').toLowerCase();
    const action = String(e.action || '').toLowerCase();
    const proc = String(e.procedure || '').toLowerCase();
    const haystack = `${delai} ${action} ${proc}`;
    if (tokens.every(t => haystack.includes(t))) return { ok: true };
    // Fallback : au moins un token match
    if (tokens.length > 1 && tokens.some(t => haystack.includes(t))) {
      // On accepte si au moins un token clé est trouvé ET un autre indicateur (le mot "jour"/"mois" etc)
      const numToken = tokens.find(t => /^\d+$/.test(t));
      const unitToken = tokens.find(t => /^(jour|mois|semaine|an)/.test(t));
      if (numToken && haystack.includes(numToken) && unitToken && haystack.includes(unitToken)) {
        return { ok: true };
      }
    }
  }
  return { ok: false, reason: `aucun délai matchant "${inv.match}" dans les cascades` };
}

function checkEscaladeTypePresent(fiche, inv) {
  const want = String(inv.value || '').toLowerCase();
  const services = fiche.reponse?.services || [];
  for (const s of services) {
    // Si le service expose un champ "type" explicite
    if (s.type && String(s.type).toLowerCase().includes(want)) return { ok: true };
    // Sinon, déduction via nom
    const t = detectServiceType(s.nom);
    if (t && t.includes(want)) return { ok: true };
    // Fallback : substring dans le nom directement
    if (s.nom && s.nom.toLowerCase().includes(want)) return { ok: true };
  }
  return { ok: false, reason: `aucun service d'escalade type "${want}"` };
}

function checkConfianceAtLeast(fiche, inv) {
  const want = String(inv.value || '').toLowerCase();
  const actual = String(fiche.confiance || '').toLowerCase();
  const wantIdx = CONFIANCE_ORDER.indexOf(want);
  const actIdx = CONFIANCE_ORDER.indexOf(actual);
  if (wantIdx < 0) return { ok: false, reason: `niveau "${want}" inconnu` };
  if (actIdx < 0) return { ok: false, reason: `confiance fiche "${actual}" inconnue` };
  if (actIdx >= wantIdx) return { ok: true };
  return { ok: false, reason: `confiance "${actual}" < "${want}"` };
}

function checkJurisprudenceMinCount(fiche, inv) {
  const want = Number(inv.value || 0);
  const count = (fiche.reponse?.jurisprudence || []).length;
  if (count >= want) return { ok: true };
  return { ok: false, reason: `${count} arrêt(s) < ${want} requis` };
}

function checkTagPresent(fiche, inv) {
  const want = String(inv.value || '').toLowerCase();
  const tags = (fiche.tags || []).map(t => String(t).toLowerCase());
  if (tags.includes(want)) return { ok: true };
  // Fallback : match partiel (tolère variantes accents)
  if (tags.some(t => t.includes(want) || want.includes(t))) return { ok: true };
  return { ok: false, reason: `tag "${want}" absent (tags: ${tags.join(', ') || '∅'})` };
}

function checkTemplateExists(fiche, _inv) {
  const tpl = fiche.reponse?.modeleLettre;
  if (typeof tpl === 'string' && tpl.trim().length > 50) return { ok: true };
  return { ok: false, reason: 'reponse.modeleLettre absent ou trop court' };
}

const CHECKS = {
  article_present: checkArticlePresent,
  article_with_source_id: checkArticleWithSourceId,
  delai_exists: checkDelaiExists,
  escalade_type_present: checkEscaladeTypePresent,
  confiance_at_least: checkConfianceAtLeast,
  jurisprudence_min_count: checkJurisprudenceMinCount,
  tag_present: checkTagPresent,
  template_exists: checkTemplateExists,
};

// ── API publique ────────────────────────────────────────────────────

export function runInvariants(invariantsDef, fichesById) {
  const failures = [];
  let total = 0;
  let pass = 0;

  for (const def of invariantsDef) {
    const fiche = fichesById.get(def.fiche_id) || fichesById.get(def.intent_id);
    for (const inv of (def.invariants || [])) {
      total++;
      if (!fiche) {
        failures.push({
          intent_id: def.intent_id,
          invariant: inv,
          reason: `fiche "${def.fiche_id || def.intent_id}" introuvable`,
        });
        continue;
      }
      const check = CHECKS[inv.type];
      if (!check) {
        failures.push({
          intent_id: def.intent_id,
          invariant: inv,
          reason: `type d'invariant inconnu: "${inv.type}"`,
        });
        continue;
      }
      let res;
      try {
        res = check(fiche, inv);
      } catch (err) {
        res = { ok: false, reason: `exception: ${err?.message || err}` };
      }
      if (res?.ok) {
        pass++;
      } else {
        failures.push({
          intent_id: def.intent_id,
          invariant: inv,
          reason: res?.reason || 'échec',
        });
      }
    }
  }

  return {
    passes: pass === total,
    failures,
    total_count: total,
    pass_count: pass,
  };
}

export const _internals = {
  detectServiceType,
  CONFIANCE_ORDER,
  CHECKS,
};
