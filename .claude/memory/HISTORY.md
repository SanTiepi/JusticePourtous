---
name: History — jalons décisionnels sessions historiques JusticePourtous
description: Synthèse ultra-condensée des sessions importantes. Détails complets dans git log + tags.
type: project
scope: projet
status: active
review_after: 2026-12-31
---
# HISTORY — JusticePourtous

> **Règle** : 1 ligne par session/sprint majeur. Jalons décisionnels uniquement (les détails sont dans `git log`). Si une entrée dépasse ~5 lignes, en faire un doc dans `docs/`.

## Avant 2026-04 — Constitution & innovations V4
Séquence constitution livrée (source registry 3-tiers, objectification, retrieval 100% top-1, page résultat V3). 5 innovations V4 livrées : argumentation réfutable (Dung/Toulmin), certificat de suffisance (gate contradictoire), questionneur marginal, comité à désaccord contrôlé, compilateur normatif. CONSTITUTION.md = document canonique.

## 2026-04-19 — Fondations qualité prod-ready
13 chantiers : logger centralisé (82 console.* éradiqués), `/api/health/deep` (12 checks), metrics, env-check fail-fast, request-id correlation, docker entrypoint seed (volume n'écrase plus les meta statiques). Normative compiler 22 → 76 règles, 282 invariants régression. Deploy 12/12 ok.

## 2026-04-29 — Legal review LLM + UX trust
Review juridique LLM (PAS humaine) appliquée aux 281 fiches actionnables. Trust badge frontend (`claude_legal_review_date`), quick feedback widget (thumbs 1-clic → POST /api/outcome), `/api/fiches/:id` enrichi (parité avec /api/search), i18n bulletproof (0 5xx sur traduction).

## 2026-04-30 — Gros loop autonome (10+ ticks)
Refonte triage : **branching dynamique LLM**, abandon du quizz template incohérent (questions adaptatives 0-10+, multi-rounds). UX safety mobile (quick-exit rouge), i18n FR/DE/IT/EN (hero/CTA), SEO sitemap multilangue 324 → 1196 URLs, premium UI, **cantons 6 → 26**, kit pro bono validation avocats (page + 5 dossiers + 5 emails), dashboard section Outcomes. Legal review LLM étendue à **314/314** fiches.

## 2026-05-28/29 — Memory pattern + sprint adversarial mort + reprise manuelle
Pattern `.claude/memory/` appliqué (`1465d10`). Sprint autonome adversarial lancé (routine `trig_01Mw2ic9bMScNXbSa8Wq11TY`, cron 2h) : 1 seul run (`cc6c6b9`) → infra eval CLI via `claude -p` + cas 20→30 + 2 gaps. **Routine morte ensuite (404)**, ne reprend pas seule. Reprise manuelle (Robin + Claude) : retry-on-parse-fail + fix label `adv_famille_04` (famille → successions), commit `f95eae1`. Décision : ne PAS ressusciter de routine autonome (flaky). +10 cas (→40) parkés. PROJECT.md/HISTORY.md remplis.
