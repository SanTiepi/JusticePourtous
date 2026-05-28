# SPRINT-LOG — JusticePourtous

Sprint autonome démarré **2026-05-28 00:42 UTC** (routine créée), premier run prévu **2026-05-28 02:04 UTC** (≈ 04:04 Europe/Zurich).
Goal : **Étendre adversarial harness de 20 → 40 cas, maintenir LLM-first ≥95%, identifier fiches manquantes pour les fails (sans créer les vraies fiches — validation juridique humaine requise).**

Durée cible : 24h initial, prolonger si goal pas atteint.
Cron : `0 */2 * * *` UTC (toutes les 2h, 12 runs/jour — agressif pour test rapide).
Modèle : claude-opus-4-7.
Mode safety : push master direct, mais CI gates protègent (tests subset core, validation fiches errors-bloquantes, benchmark JPT score >= 60). Pas d'auto-deploy VPS (deploy manuel).
Mesure adversarial : via `claude -p` CLI (abonnement Max), PAS via ANTHROPIC_API_KEY. Si CLI absent du sandbox, skip + log.

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

### Setup — 2026-05-28 00:42 UTC
- **Routine ID** : `trig_01Mw2ic9bMScNXbSa8Wq11TY`
- **Cron** : `0 */2 * * *` UTC (12 runs/jour, intervalle 2h)
- **Modèle** : claude-opus-4-7
- **Premier run prévu** : 2026-05-28 02:04 UTC (≈ 04:04 Europe/Zurich)
- **Lien admin** : https://claude.ai/code/routines/trig_01Mw2ic9bMScNXbSa8Wq11TY
- **Mode** : push master direct, CI gates = filet (pas d'auto-deploy VPS)
- **Mesure adversarial** : `claude -p` CLI subscription Max (pas API key)
- **⚠ Pré-requis avant run 1** : `/web-setup` côté Robin pour connecter Claude GitHub App au repo SanTiepi/JusticePourtous (sans ça, le `git push master` du run 1 échoue)
- **Kill switch** : `/schedule update trig_01Mw2ic9bMScNXbSa8Wq11TY --enabled false` ou UI

### Attente premier run
Points à surveiller au run 1 :
- ✓ ou ✗ : Le clone GitHub fonctionne (dépend de /web-setup)
- ✓ ou ✗ : `claude -p` CLI dispo dans le sandbox CCR — chercher la ligne "adversarial CLI eval skipped: claude CLI not in PATH" dans le SPRINT-LOG.md post-run
- Probable focus run 1 : créer `scripts/adversarial-eval-cli.mjs` (l'infra eval) plutôt que ajouter des cas. C'est OK — l'infra est prérequis pour mesurer la suite.
