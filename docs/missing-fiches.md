# Fiches manquantes (identifiées par l'éval adversarial)

Cette liste est maintenue par le runner `scripts/run-adversarial-eval-llm.mjs`.
Chaque entrée correspond à un cas adversarial pour lequel le LLM navigator a
trouvé le bon domaine mais s'est rabattu sur une fiche voisine faute de
correspondance exacte.

Ces fiches sont à créer après validation juridique humaine.

## État actuel : aucune fiche en attente (mis à jour 2026-04-28)

Les deux gaps historiquement identifiés ont été comblés :

- ✅ `bail_restitution_anticipee` (CO 264) — créée + `claude_review_date: 2026-04-19`
- ✅ `travail_discrimination_salariale` (LEg 3 / LEg 5 / Cst 8 al. 3) — créée + `claude_review_date: 2026-04-19`

Pour rouvrir cette liste, relancer l'éval adversariale et capturer les nouveaux
cas où le navigator se rabat sur une fiche voisine :

```bash
node scripts/run-adversarial-eval-llm.mjs
```

## Process d'ajout (quand de nouveaux gaps émergent)

1. Validation juridique par un juriste (ou à défaut, recherche de la fiche équivalente chez ASLOCA / guidesocial.ch / ch.ch).
2. Créer la fiche dans `src/data/fiches/<domaine>.json` avec le schema strict (cf. `validateFiche` dans `src/services/fiche-schema.mjs`).
3. Lier les articles via `src/data/articles/*.json` (ajouter au mapping graph).
4. Marquer `claude_review_date: <ISO date>` une fois la checklist structurelle passée (cf. `audit-fiches-schema.mjs`).
5. Rerun `node scripts/run-adversarial-eval-llm.mjs` pour confirmer score à 100%.
6. Le cas adversarial devient alors non-discriminant — ajouter un nouveau cas à sa place dans `test/adversarial-cases.mjs` pour maintenir la pression.
