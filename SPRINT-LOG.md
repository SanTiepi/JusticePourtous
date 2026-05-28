# SPRINT-LOG — JusticePourtous

Sprint autonome démarré 2026-05-28 (heure à confirmer au moment du /schedule create).
Goal : **Étendre adversarial harness de 20 → 40 cas, maintenir LLM-first ≥95%, identifier fiches manquantes pour les fails (sans créer les vraies fiches — validation juridique humaine requise).**

Durée cible : 24h initial, prolonger si goal pas atteint.
Cron : toutes les 6h (4 runs/jour).
Mode safety : push master direct, mais CI gates protègent (tests subset core, validation fiches errors-bloquantes, benchmark JPT score >= 60). Pas d'auto-deploy VPS (deploy manuel).

## Definition of done

- [ ] `test/adversarial-cases.mjs` : 40 cas (20 existants + 20 nouveaux, écrits **sans consulter** le dictionnaire de synonymes du retriever — sinon les cas testeraient le dico contre lui-même cf. session 2026-04-09)
- [ ] Métrique LLM-first adversarial maintenue à >= 95% sur les 40 cas (avant le sprint : 97% sur 20 cas)
- [ ] Pour chaque nouveau cas qui fail : entry dans `docs/missing-fiches.md` avec : `id`, `base_juridique`, `pourquoi_manquante`, `priorité`. **PAS de création de fiche réelle** (`src/data/fiches/*.md`) — validation juridique humaine requise, hors scope autonomous.
- [ ] Benchmark JPT (`node scripts/benchmark-vs-llm-brut.mjs`) score >= 60 (CI gate non régressé)
- [ ] Cette SPRINT-LOG.md mis à jour à chaque run

## Garde-fous spécifiques JusticePourtous

- ❌ JAMAIS modifier `src/data/fiches/*.md` (contenu juridique = validation humaine obligatoire)
- ❌ JAMAIS modifier `src/services/llm-navigator.mjs` sans rerun complet adversarial harness avant push (c'est le chemin prod, régression silencieuse = boîte noire)
- ❌ JAMAIS modifier les golden cases — ils saturent volontairement, on étend l'adversarial à la place
- ❌ JAMAIS commit/push si `node scripts/benchmark-vs-llm-brut.mjs` retourne score < 60
- ✓ Toujours run subset CI local avant push : `LLM_MOCK=1 node --test $(ls test/*.test.mjs | grep -v -E '(e2e|llm-nav|letter-gen|deep-analysis|premium|stress|adversarial-eval)')` doit être vert
- ✓ Run validation fiches : `node -e "import('./src/services/fiche-validator.mjs').then(m => { const r = m.validateAllFiches(); const s = m.countFicheSchemaIssues(r); if (s.error_count > 0) process.exit(1); })"` doit être vert

## Why ce goal

Cf. `.claude/memory/PROJECT.md` consolidé et l'auto-memory `project_justicepourtous.md`. Découverte session 2026-04-09 : les 10 golden cases saturaient à 100% car écrits main dans la main avec le dictionnaire de synonymes. L'adversarial harness (20 cas écrits sans regarder le dico) a révélé la vraie métrique = 97% LLM-first.

Pour identifier les vrais trous (fiches manquantes, retriever blind spots), **plus de cas adversariaux** = plus de signal. 40 cas = couverture plus large des 5 domaines (bail, travail, dettes, famille, étrangers) + cross-domain.

Les 2 fiches manquantes connues (`bail_restitution_anticipee` CO 264, `travail_discrimination_salariale` LEg 3/5 Cst 8) couvraient les 2 fails du harness 20. Le sprint en révélera probablement 4-8 supplémentaires.

## Pourquoi pas autre chose

- **Innovation #2 (certificat de suffisance)** = besoin architectural input Robin, pas pure autonomous
- **Création vraies fiches** = validation juridique humaine obligatoire
- **Refacto llm-navigator** = trop risqué pour autonomous (chemin prod critique)

L'adversarial harness extension = pur algorithmique, bordé, mesurable, safe.

## Runs

<!-- Chaque run de la routine append ici. Format :
### YYYY-MM-DD HH:MM UTC — run #N
- Tenté : <ce que Claude a essayé>
- Résultat : passed / failed / blocked / no-op
- Commits : `abc1234`, `def5678`
- Métriques : adversarial X%, JPT score Y, CI Z
- Prochaine action : <ou stop si goal atteint>
-->

### Setup — 2026-05-28 (heure à confirmer)
- Routine ID : (à remplir après /schedule create)
- Cron : `15 */6 * * *` UTC (toutes les 6h, à H+15min)
- Lien admin : https://claude.ai/code/routines
- Mode : push master direct, CI gates = filet
