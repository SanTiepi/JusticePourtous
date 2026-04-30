# Scripts — JusticePourtous

51 scripts (.mjs / .sh). La plupart sont exposés via `npm run`. Pour les autres, lancer directement avec `node scripts/<nom>.mjs`.

## 🚀 Deploy

| Script | Usage | Description |
|---|---|---|
| `deploy.sh` | `bash scripts/deploy.sh` | Build → push → SSH VPS → docker rebuild → health check. Voir `SKIP_TESTS=1` pour hotfix. |

## 🧪 Tests E2E + monitoring

| Script | npm run | Description |
|---|---|---|
| `e2e-triage-funnel.mjs` | `e2e:triage` | Test 8 cas types triage prod (multi-rounds, safety_stop). |
| `probe-sitemap-urls.mjs` | `probe:sitemap` (80) / `probe:sitemap:all` | Échantillonne URLs sitemap, détecte 5xx. |
| `verify-sitemap-integrity.mjs` | `audit:sitemap` | Détecte 404 SEO + orphelins HTML. |
| `send-daily-metrics.mjs` | `metrics:daily` | Email quotidien metrics prod (cron VPS). |

## 📋 Audits qualité

| Script | npm run | Description |
|---|---|---|
| `audit-fiches-schema.mjs` | `audit:fiches` | Validation schema des 314 fiches (strict + tolerant). |
| `audit-source-id-coverage.mjs` | `audit:source-id` | Résolution source_id (cible 100%). |
| `audit-i18n-coverage.mjs` | `audit:i18n` | Cohérence keys i18n FR/DE/IT/EN. |
| `legal-review-summary.mjs` | `audit:legal-review` | État du legal review (verified / fixed / minor / info_only). |
| `coverage-audit.mjs` | — | Audit couverture domaines + intents. |
| `evaluate-canon-completeness.mjs` | — | Couverture canon caselaw par domaine. |
| `freshness-check.mjs` | — | Vérifie URLs Fedlex + dates articles. |
| `intent-coverage-report.mjs` | — | Rapport intents (total / complete / partial / stub / missing). |
| `outcomes-stats-report.mjs` | — | Stats outcomes citoyens (k-anon). |
| `audit:all` | `audit:all` | Lance schema + source-id + legal + sitemap. |

## 📊 Build & génération

| Script | npm run | Description |
|---|---|---|
| `build-locale-bundles.mjs` | `build:locales` | Bundle les fichiers locales/*.json. |
| `generate-seo-pages.mjs` | `build:guides` | Génère `/guides/<slug>.html` + versions DE/IT/EN via API LLM. |
| `generate-sitemap.mjs` | — | Regen sitemap.xml (10 principales + 314 FR + 872 multilang). |
| `build-intent-catalog.mjs` | — | Compile intents-catalog.json depuis fiches + missing intents. |

## 📥 Ingestion / harvesting

| Script | Description |
|---|---|
| `fedlex-harvester.mjs` | Récupère articles Fedlex. |
| `fedlex-daily-diff.mjs` | Détection changements RS quotidien. |
| `jurisprudence-harvester.mjs` | Récupère arrêts TF. |
| `jurisprudence-batch-import.mjs` | Import en batch. |
| `ingest-entscheidsuche.mjs` | Corpus jurisprudence cantonale (entscheidsuche.ch). |
| `seed-cantonal-corpus.mjs` | Seed initial corpus cantonal. |
| `seed-freshness.mjs` | Backfill last_verified_at. |
| `seed-regression-invariants.mjs` | Génère 282 invariants régression. |

## 📝 Enrichissement (touche au contenu — manuel)

⚠️ Ces scripts modifient les fiches. **Ne pas exécuter sans validation humaine.**

| Script | Description |
|---|---|
| `enrich-fiches-for-review.mjs` | Marque les fiches pour review humain. |
| `enrich-with-corpus-jurisprudence.mjs` | Lie fiches ↔ arrêts pertinents. |
| `add-cascades-phase1.mjs` / `phase2.mjs` / `phase4.mjs` | Ajoute cascades structurées (par batches historiques). |
| `add-confiance-cascades.mjs` | Ajoute niveau confiance par cascade. |
| `final-fix-24-draft-fiches.mjs` | Fix historique de 24 fiches draft. |
| `fix-template-quality.mjs` | Améliore qualité modèles de lettres. |
| `mark-information-only.mjs` | Marque les fiches info-only. |
| `claude-legal-review.mjs` | Review juridique via LLM (génère claude_legal_review_date). |

## 🛠 Utilitaires (one-shot ou ponctuel)

| Script | Description |
|---|---|
| `extend-cantons-matrix.mjs` | Étend cantons-matrix.json 6 → 26 cantons. |
| `export-fiche-for-review.mjs` | Exporte fiches gold en MD pour avocats. |
| `regen-polluted-guides.mjs` | Régénère 30 fichiers DE/IT/EN polluqs (one-shot historique). |
| `verify-fedlex-top50.mjs` | Cross-check articles top 50 + ajoute dateVerification. |
| `send-due-reminders.mjs` | Envoi rappels délais aux comptes citoyens (cron VPS). |
| `send-proactive-alerts.mjs` | Alertes proactives (changements légaux). |
| `fix-accents.mjs` / `fix-all-accents.mjs` | Normalise accents (one-shot historique). |

## 📦 Benchmark / éval

| Script | Description |
|---|---|
| `benchmark-vs-llm-brut.mjs` | Benchmark structurel vs LLM brut (objectif ×6.4). |
| `run-eval-report.mjs` | Génère rapport éval golden cases. |
| `run-adversarial-eval.mjs` | Éval adversariale (catalogue 47 cas). |
| `run-adversarial-eval-llm.mjs` | Éval adversariale via LLM judge. |

---

## Conventions

- Tous les scripts sont en ESM (`type: module`).
- Scripts qui écrivent dans `src/data/meta/` produisent du JSON déterministe (pas de timestamp non-stable).
- Scripts cron (`send-due-reminders`, `send-daily-metrics`, `fedlex-daily-diff`) sont à activer manuellement via crontab VPS.
- Hooks env : voir `test/README.md` pour `JB_TRANSLATION_FAKE`, `LLM_MOCK`, `ADMIN_TOKEN`.
