#!/usr/bin/env node
/**
 * export-fiche-for-review.mjs — Exporte une fiche en Markdown lisible pour
 * envoi à un avocat reviewer. Sortie : docs/avocats-validation/<id>.md.
 *
 * Usage : node scripts/export-fiche-for-review.mjs <fiche_id>
 *         node scripts/export-fiche-for-review.mjs --gold  (les 5 fiches gold)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FICHES_DIR = path.join(ROOT, 'src/data/fiches');
const OUT_DIR = path.join(ROOT, 'docs/avocats-validation');

const GOLD_FICHES = [
  'bail_defaut_moisissure',
  'bail_resiliation_conteste',
  'dettes_commandement_payer',
  'etranger_renvoi',
  'travail_licenciement_abusif'
];

function loadAllFiches() {
  const all = new Map();
  for (const f of fs.readdirSync(FICHES_DIR).filter(x => x.endsWith('.json'))) {
    const arr = JSON.parse(fs.readFileSync(path.join(FICHES_DIR, f), 'utf8'));
    for (const fiche of arr) all.set(fiche.id, fiche);
  }
  return all;
}

function ficheToMarkdown(fiche) {
  const r = fiche.reponse || {};
  const lines = [];
  lines.push(`# Review juridique — ${fiche.id}`);
  lines.push('');
  lines.push(`**Domaine** : ${fiche.domaine}${fiche.sousDomaine ? ' / ' + fiche.sousDomaine : ''}`);
  lines.push(`**Description** : ${fiche.match_description || '(absent)'}`);
  lines.push(`**Confiance affichée au citoyen** : ${fiche.confiance || '(absent)'}`);
  lines.push(`**Date de revue Claude (legal)** : ${fiche.claude_legal_review_date || '(non review)'} — ${fiche.claude_legal_review_notes || ''}`);
  lines.push(`**Tags** : ${(fiche.tags || []).join(', ')}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`## 📖 Explication affichée au citoyen`);
  lines.push('');
  lines.push(r.explication || '(absent)');
  lines.push('');
  lines.push(`## 📜 Articles cités (${(r.articles || []).length})`);
  lines.push('');
  for (const a of (r.articles || [])) {
    lines.push(`- **${a.ref}** — ${a.titre || ''}` + (a.lien ? ` ([Fedlex](${a.lien}))` : ''));
  }
  lines.push('');
  lines.push(`## ⚖️ Jurisprudence (${(r.jurisprudence || []).length})`);
  lines.push('');
  for (const j of (r.jurisprudence || [])) {
    lines.push(`- **${j.ref}** : ${j.resume || ''}`);
  }
  lines.push('');
  if (Array.isArray(fiche.cascades) && fiche.cascades.length > 0) {
    lines.push(`## 🪜 Cascade d'actions`);
    lines.push('');
    for (const c of fiche.cascades) {
      lines.push(`### ${c.titre || '(sans titre)'}`);
      lines.push('');
      for (const e of (c.etapes || [])) {
        lines.push(`**Étape ${e.numero} — ${e.action}**`);
        if (e.description) lines.push(e.description);
        if (e.delai) lines.push(`- ⏱️ Délai : *${e.delai}*`);
        if (e.base_legale) lines.push(`- 📜 Base légale : *${e.base_legale}*`);
        if (e.preuve_generee) lines.push(`- 📎 Preuve générée : *${e.preuve_generee}*`);
        if (e.cout) lines.push(`- 💰 Coût : *${e.cout}*`);
        if (Array.isArray(e.branches)) {
          for (const b of e.branches) lines.push(`  - Si **${b.si}** → ${b.alors}`);
        }
        lines.push('');
      }
    }
  }
  if (r.modeleLettre) {
    lines.push(`## ✉️ Modèle de lettre`);
    lines.push('');
    lines.push('```');
    lines.push(r.modeleLettre);
    lines.push('```');
    lines.push('');
  }
  if (Array.isArray(r.services) && r.services.length > 0) {
    lines.push(`## 🤝 Services orientés (${r.services.length})`);
    lines.push('');
    for (const s of r.services.slice(0, 5)) {
      lines.push(`- **${s.nom}**${s.canton ? ' (' + s.canton + ')' : ''}${s.tel ? ' — ☎ ' + s.tel : ''}${s.url ? ' — [site](' + s.url + ')' : ''}`);
    }
    lines.push('');
  }
  if (Array.isArray(fiche.required_facts)) {
    lines.push(`## ❓ Faits requis pour le triage`);
    lines.push('');
    for (const f of fiche.required_facts) lines.push(`- ${f}`);
    lines.push('');
  }
  lines.push('---');
  lines.push('');
  lines.push('## 📋 Grille de review (à remplir et renvoyer)');
  lines.push('');
  lines.push('Voir [grille-review.md](./grille-review.md). Format suggéré : 5 minutes, 6 questions.');
  lines.push('');
  lines.push('## ⚠️ Disclaimer');
  lines.push('');
  lines.push('Cette review est **volontaire** et **n\'engage pas votre responsabilité**.');
  lines.push('Votre retour est consultatif. Si vous identifiez une erreur, JusticePourtous corrige avant déploiement public ou ajoute le label `reviewed_by_legal_expert: <votre_nom>` (anonymisable).');
  lines.push('');
  lines.push(`Contact : robin@batiscan.ch — Fiche en prod : https://justicepourtous.ch/api/fiches/${fiche.id}`);
  return lines.join('\n');
}

function main() {
  const arg = process.argv[2];
  const all = loadAllFiches();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let targets;
  if (arg === '--gold' || !arg) {
    targets = GOLD_FICHES;
  } else {
    targets = [arg];
  }

  for (const id of targets) {
    const fiche = all.get(id);
    if (!fiche) {
      console.warn(`[skip] fiche ${id} non trouvée`);
      continue;
    }
    const md = ficheToMarkdown(fiche);
    const out = path.join(OUT_DIR, `${id}.md`);
    fs.writeFileSync(out, md, 'utf8');
    console.log(`✓ ${id} → ${out} (${md.length} chars)`);
  }
}

main();
