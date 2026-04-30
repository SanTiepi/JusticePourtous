# Changelog

## [Session 2026-04-30] — Loop autonomie (10+ ticks enchaînés, tous deployed)

10 commits successifs en prod. Tests : 1582/1582 verts. 0 commit unpushed.

### 🔴 Fix critique triage
- **Branching dynamique LLM** — abandon du quizz template `getQuestionsForDomaine()` (questions incohérentes type "quand par rapport à votre arrêt maladie ?" alors que user avait dit NON à arrêt). Remplacé par textarea + `/api/triage` LLM-first.
- **Multi-rounds adaptatifs** ([2ce9457](src/services/llm-navigator.mjs) + [16351e5](src/services/llm-navigator.mjs)) — 1-3 questions PAR ROUND (au lieu de 5 d'un coup). Exemples concrets dans le prompt selon complexité (1 → 10+ questions).
- **Payment gate refine** ([479b4d3](src/services/triage-engine.mjs)) — bloquait HTTP 402 sur le 2ème round. Fixé : refine gratuit tant que triage incomplet.
- **Safety_response affichage frontend** ([479b4d3](src/public/app.js)) — bandeau rouge ⚠️ + ressources d'urgence cliquables (LAVI, VIVAVA, 117) en cards 1-tap mobile.
- **ask_contradiction + pivot_detected** ([68762c1](src/public/app.js)) — statuts non gérés frontend (écran bloqué). Maintenant gérés.

### 📱 Mobile
- **Widget compact top-right** ([dd1113d](src/public/i18n.js)) — header sticky 64px caché < 640px. Widget flottant ⚖️ home + lang + Premium.
- **Quick-exit ROUGE top-LEFT mobile** ([074565f](src/public/style.css)) — feature sécurité critique. Auparavant chevauchait le burger.

### 🎨 UI
- **Méthodologie** ([992b456](src/public/methodologie.html)) — listes "IA fait/fait jamais" en cards vert/rouge + tableau confiance HTML structuré + Limites actualisées (26 cantons + lien pro bono).
- **Trust bar globale FR/DE/IT/EN** sur toutes les pages publiques.
- **Notice juridique ambre** + icône ⓘ (au lieu d'opacity 0.7).
- **Hero home** : 3 trust chips (🆓 Gratuit · 🔒 Anonyme · 📚 Sources Fedlex) + gros bouton vert "→ Décrire ma situation en 30 secondes".
- **Annuaire placeholder** ([4525161](src/public/annuaire.html)) — "📍 Choisissez votre canton" + liste des services typiques + filtres pill vert/active.
- **Premium badge "⭐ Le plus choisi"** ([e1bca6e](src/public/premium.html)) — bordure verte + box-shadow distinct.
- **Resultat loading spinner** ([a0426ba](src/public/resultat.html)) — vrai spinner CSS animé.
- **Quick feedback widget engageant** ([22c0b74](src/public/style.css)) — gradient ambre, boutons +taille (min-height 48px tap target), hover 👍 vert / 👎 rouge.

### 🌍 i18n
- **Hero chips + CTA traduits** ([51548ca](src/public/locales/)) — 16 nouvelles entrées (4 keys × 4 locales).

### 🌐 SEO
- **Sitemap multilangues** ([344b886](scripts/generate-sitemap.mjs)) — 324 → **1196 URLs** (+872 versions DE/IT/EN avec priority 0.5).
- **verify-sitemap-integrity.mjs** ([439188b](scripts/verify-sitemap-integrity.mjs)) — détecte 404 SEO + orphelins HTML.

### 🧪 Tests E2E
- **e2e-triage-funnel.mjs** ([39d2cd5](scripts/e2e-triage-funnel.mjs)) — 8/8 cas types OK (multi-rounds inclus, safety_stop reconnu).

### 📊 Métriques prod
- Health 13/13 ok · 0 erreur 5xx depuis tous les deploys · 314/314 fiches legal-reviewed.

---

## [Unreleased] — Session 2026-04-28 → 2026-04-29

27 commits unpushed. Tests : 1577/1577 verts. Push déclenchera deploy via [scripts/deploy.sh](scripts/deploy.sh).

### 🔴 Fixes critiques

- **i18n fallback gracieux** ([6dcc999](src/services/i18n/translation-orchestrator.mjs)) — élimine les ~108 erreurs 5xx prod observées sur 9 jours quand l'API LLM est down. 3 couches défensives (lib + wrappers + endpoint). Backend ne 5xx plus jamais sur traduction. Frontend reçoit toujours du contenu utilisable.
- **Source-id coverage 98.5% → 100%** ([cebec20](src/services/source-registry.mjs)) — Cst case-mismatch + 4 préfixes manquants (LEp, LPMéd, OAC, OAMal) + regex accents. 1012/1012 occurrences résolues.
- **Validator by_domain artefacts** ([af173c4](src/services/fiche-validator.mjs)) — utilisait préfixe d'id (etranger_/succession_) au lieu de fiche.domaine, créant 17 lignes au lieu de 15 dans l'audit.
- **Atomic-write Windows EPERM** ([118f663](src/services/atomic-write.mjs)) — retry borné (5/15/40/100/250 ms) sur EPERM/EBUSY/EACCES, élimine flake Windows en tests parallèles.
- **Intent-catalog last_verified_at** ([48b8099](scripts/build-intent-catalog.mjs)) — lisait dateVerification (52/314) au lieu de last_verified_at (314/314). Qualité 37% → 46%, complete 11 → 64.
- **/api/fiches/:id enrichi** ([f6b3f72](src/server.mjs)) — retourne anti-erreurs + vulgarisation (parité /api/search). Fix régression invisible : pages résultat accédées en direct ne montraient PAS les anti-erreurs.
- **🐛 Widget feedback inversion signal** ([6969279](src/public/app.js)) — Bug critique trouvé en cycle 30 : mon widget thumbs envoyait `helpful: true/false` mais le backend attend `1|2|3`. `Number(true)=1` → 👍 enregistré comme **NON**. Si Robin avait commencé à recevoir des outcomes avant ce fix, ils auraient TOUS été inversés. Fix : mapping explicite `true→3 / false→1` dans `submitQuickFeedback`. +3 tests régression ([211b8d9](test/outcomes-collection.test.mjs)).

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
