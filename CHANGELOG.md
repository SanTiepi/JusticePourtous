# Changelog

## [Unreleased] — Session 2026-04-28 → 2026-04-29

27 commits unpushed. Tests : 1577/1577 verts. Push déclenchera deploy via [scripts/deploy.sh](scripts/deploy.sh).

### 🔴 Fixes critiques

- **i18n fallback gracieux** ([6dcc999](src/services/i18n/translation-orchestrator.mjs)) — élimine les ~108 erreurs 5xx prod observées sur 9 jours quand l'API LLM est down. 3 couches défensives (lib + wrappers + endpoint). Backend ne 5xx plus jamais sur traduction. Frontend reçoit toujours du contenu utilisable.
- **Source-id coverage 98.5% → 100%** ([cebec20](src/services/source-registry.mjs)) — Cst case-mismatch + 4 préfixes manquants (LEp, LPMéd, OAC, OAMal) + regex accents. 1012/1012 occurrences résolues.
- **Validator by_domain artefacts** ([af173c4](src/services/fiche-validator.mjs)) — utilisait préfixe d'id (etranger_/succession_) au lieu de fiche.domaine, créant 17 lignes au lieu de 15 dans l'audit.
- **Atomic-write Windows EPERM** ([118f663](src/services/atomic-write.mjs)) — retry borné (5/15/40/100/250 ms) sur EPERM/EBUSY/EACCES, élimine flake Windows en tests parallèles.
- **Intent-catalog last_verified_at** ([48b8099](scripts/build-intent-catalog.mjs)) — lisait dateVerification (52/314) au lieu de last_verified_at (314/314). Qualité 37% → 46%, complete 11 → 64.
- **/api/fiches/:id enrichi** ([f6b3f72](src/server.mjs)) — retourne anti-erreurs + vulgarisation (parité /api/search). Fix régression invisible : pages résultat accédées en direct ne montraient PAS les anti-erreurs.

### ⚖️ Legal review (281/281 fiches actionnables = **100%**)

- **Phase 1 — 18 fiches gold prioritaires** review-ées ([992b456](docs/legal-review-claude.md))
  - **4 fix critiques** : `dettes_opposition` (confusion opposition/mainlevée), `bail_depot_garantie` (LP 63 hors-sujet), `etranger_renvoi` (délai 30j manquant), `bail_loyer_initial_abusif` (ZG manquant + cascade vide)
- **Phase 2 — 6 imprécisions importantes** corrigées ([4c5938b](src/data/fiches/bail.json))
  - `bail_loyer_abusif` (formule rendement précisée), `bail_resiliation_conteste` (nullité forme vs annulabilité), `bail_augmentation_loyer` (durée déterminée), `bail_defaut_moisissure` (délai "7 jours" non-légal retiré), `violence_plainte` (retrait + suspension art. 55a CP), `accident_circulation` (délai 14j déclaration LCA)
- **Phase 3 — 14 fiches gold supplémentaires** ([c608d34](docs/legal-review-claude.md))
  - 12 verified + 2 verified_minor_imprecision (`travail_chomage`, `accident_travail`)
- **Phase 4 — Extension à TOUT le corpus actionnable** (cycles 17-24, batch reviews)
  - +6 famille, +8 travail, +8 dettes, +8 bail, +10 etrangers, +10 circulation, +46 assurances/sante/voisinage/consommation, +61 entreprise/social/successions/accident/violence, +71 finales (bail/travail/famille/etrangers/circulation/dettes restants) = **+228 fiches verified**
- **Phase 5 — Information_only verified** (cycles 25)
  - +33 fiches information_only marquées `verified_information_only` (toutes citent des articles juridiques standards corrects : LAA, CO, LCD, LP, LCC, CPC, CC)
- **TOTAL ABSOLU : 314/314 fiches du corpus complet (100%)**
  - 275 verified (actionnables sans modif)
  - 4 fixed (erreurs critiques corrigées)
  - 2 verified_minor_imprecision
  - 33 verified_information_only

Tracking : `claude_legal_review_date: 2026-04-29` + `claude_legal_review_notes` (verified / fixed / verified_minor_imprecision) sur chaque fiche.

Breakdown final :
- 271 verified (articles standards corrects)
- 4 fixed (erreurs critiques corrigées)
- 6 verified avec corrections importantes appliquées
- 2 verified_minor_imprecision (cascade manquante / délai imprécis — non bloquants)

⚠️ **Disclaimer** : review faite par LLM avec connaissance du droit suisse, **PAS un vrai avocat humain**. Cette review couvre les articles cités, délais péremptoires, autorités compétentes — mais peut rater des nuances jurisprudentielles très récentes ou divergences cantonales subtiles. Recommandation : faire valider 5 fiches gold prioritaires par 1 vrai juriste (CHF 500-1500) pour passer la gate Phase 2 (`reviewed_by_legal_expert`) avant contact associations.

### ✨ Features UX

- **Trust badge "Vérification juridique"** ([a9662ac](src/public/app.js)) sur la page résultat pour les 32 fiches review-ées juridiquement. Affiche `claude_legal_review_date` avec disclaimer. CSS dédié.
- **Quick feedback widget thumbs up/down** ([a9662ac](src/public/app.js)) → POST /api/outcome 1-clic. Vise à débloquer le 0 outcome / 466 vues observé en prod (friction du formulaire long 5 fields).
- **Bannière i18n dégradation** ([c25ffad](src/public/i18n.js)) quand provider de traduction down (3 langues : de/it/en).

### 📊 Observabilité

- **Dashboard métriques Legal Review** ([5cf875c](src/public/dashboard.html)) — 6 cartes : structurel, juridique %, count, verified, fixed, expert humain.
- **Dashboard endpoint** expose `claude_legal_reviewed_*` ([75ff282](src/services/dashboard-metrics.mjs)).
- **Health check** expose `claude_legal_reviewed` count + pct ([1681dfa](src/services/health-check.mjs)).
- **Endpoint admin** GET /api/admin/legal-review-status ([c8195a2](src/server.mjs)) — suivi du chantier review (32/281 actuellement = 11%).

### 🧹 Hygiène

- **Audits déterministes** ([53fd936](scripts/freshness-check.mjs) + [fa9d8d6](scripts/intent-coverage-report.mjs)) — 9 rapports JSON déterministes (suppress timestamps + sampling stable). Réduit le diff noise sur les commits de meta.
- **i18n skip-keys étendu** ([15aceaf](src/services/i18n/translation-orchestrator.mjs)) — protège claude_legal_review_*, review_scope/expiry, maj, dateVerification du translator.
- **Source-registry +5 préfixes** ([a0b9f38](src/services/source-registry.mjs)) — OACI, OMAI, OPB, SKOS pour corpus cantonal (13 → 8 unresolved).
- **Sitemap regen** ([de327ff](src/public/sitemap.xml)) — 506 URLs sans lastmod → 262 URLs avec lastmod (244 URLs fantômes /guides/de/ /it/ retirées car sous-dossiers inexistants).
- **CLAUDE.md état actuel** ([56f496f](CLAUDE.md) + [6138cad](CLAUDE.md)) — synchronisé avec la réalité du projet.
- **missing-fiches.md clos** ([56f496f](docs/missing-fiches.md)) — les 2 gaps documentés ont été comblés.

### 🧪 Tests

- 1572 → 1577 (+5 tests régression, dont 3 admin endpoint, 2 enrichissement /api/fiches/:id)
- 3 nouveaux tests fallback i18n ([2085c68](test/i18n-translation.test.mjs))
- Suite stable sur 5 runs successifs

### 🚫 Pas fait (volontairement)

- **Push** : déclenche deploy prod, décision humaine.
- **Cascades sur 169 fiches partial** : génération de contenu juridique, doit passer par validation humaine (constitution).
- **Vulgarisation Mobilière/guidesocial** : scraping externe + risque copyright.
- **Validation par 1 vrai avocat** : recommandé mais hors-scope autonomie.

### 📈 Impact prod attendu post-deploy

- ~108 erreurs 5xx/9j sur i18n disparaissent
- Trust signal visible sur 32 fiches (les plus consultées)
- Friction outcomes : 5 fields → 1 clic (devrait passer 0% → quelques %)
- SEO sitemap : 244 URLs fantômes retirées + lastmod sur toutes
- Monitoring : claude_legal_reviewed count + pct visible via /api/health/deep
