# CLAUDE.md — JusticePourtous

## Constitution (immuable)

- **Mission** : Triage juridique citoyen suisse. Pas une base documentaire — un connecteur intelligent entre citoyens et ressources juridiques.
- **Principe** : Le LLM navigue sur nos données vérifiées. Il ne rédige JAMAIS de contenu juridique. Il identifie, extrait, questionne. Le contenu vient de nos fiches.
- **Cadre légal** : La LLCA ne réserve PAS le conseil juridique aux avocats. Disclaimer obligatoire sur CHAQUE réponse. Ne jamais dire "avocat IA".

## Stratégie (mutable — dernière mise à jour 2026-04-08)

### Positionnement
- Tous les concurrents (Silex, SwissLegalAI, Omnilex, Weblaw) visent les AVOCATS
- Nous visons les CITOYENS — remplacer l'avocat quand c'est possible, rediriger quand c'est nécessaire
- Modèle : payant dès le triage (2 CHF), gratuit = consultation fiches seulement
- Notre moat = traçabilité + triage citoyen + données cantonales. Pas le volume de données.

### Décisions verrouillées
- Quand tu génères une réponse juridique, ne rédige JAMAIS le contenu toi-même. Navigue vers la bonne fiche et affiche SON contenu. Contre-exemple : la v1 générait des keywords → fragile, inutile.
- Quand tu évalues la complexité, utilise les DIMENSIONS STRUCTURÉES (cascades, confiance, templates, jurisprudence). Jamais des mots-clés. Contre-exemple : la v1 matchait "international" → complexe. Un loyer "international" n'est pas complexe.
- Quand tu poses des questions à l'utilisateur, extrais D'ABORD ce qui est déjà dans le texte. Ne repose pas ce que l'utilisateur a déjà dit. Contre-exemple : "moisissure depuis 6 mois à Lausanne" → ne pas redemander durée ni canton.
- Quand une situation touche plusieurs fiches, identifie-les TOUTES. Contre-exemple : "expulsé ET moisissure" = 2 fiches, pas 1.

### Architecture technique
- Stack : Node.js ESM, zero deps, native http
- Services clés : knowledge-engine.mjs (graphe), llm-navigator.mjs (cerveau), triage-engine.mjs (orchestration), action-planner.mjs (plans), semantic-search.mjs (fallback)
- Données : 182 fiches, 622 articles, 217 arrêts, 10 domaines, graphe bidirectionnel
- Orchestration : Paperclip (http://localhost:3100), 5 agents GStack model

### Pipeline agents (D005 — séquentiel)
| Agent | Trigger | Mécanisme |
|---|---|---|
| CTO-Claude | 1x/jour 9h | heartbeatCron: "0 9 * * *" sur agent |
| DataEngineer | Après brief CTO | `POST /api/routines/c74f66e5-35de-49a5-8b99-1a6dcb5fa85a/run` |
| FrontendDev | Après changement API | `POST /api/routines/4390f2b5-2236-4b69-991b-2d8318c96558/run` |
| CodexReviewer | Après commit | Webhook: `POST /api/routine-triggers/public/f6128f8bf46a0157d3c86f79/fire` (Bearer secret dans .env) |

**Règle** : CTO crée brief → POST routine Engineer. Engineer merge → POST routine Frontend. Engineer ou Frontend commit → webhook Reviewer (git post-commit hook).
**Contre-exemple** : ne pas paralléliser — 4 agents en parallèle = conflits git (D005).

### Erreurs passées (pitfalls)
- Ne pas construire un "OS d'attention" ou un "gouverneur cognitif" — c'est de l'abstraction élégante qui ne livre rien. Attendre les meilleurs modèles.
- Ne pas faire la course aux données vs Swisslex. On gagne sur l'intelligence du triage, pas le volume.
- Ne pas lancer de chatbot IA conversationnel. Le triage structuré est plus fiable.
- Ne pas paralléliser des agents sur les mêmes fichiers. Pipeline séquentiel.
- Un agent avec un brief chirurgical (fichiers + critères + contre-exemples) est 3-5x plus rapide qu'un agent qui explore.

## Mode actif (éphémère — contexte de la session en cours)

### État actuel (mis à jour 2026-04-19)
- **15 domaines couverts** (10 core + consommation/voisinage/circulation/successions/sante en `readiness: beta`)
- **284 fiches** dont **100% `reviewed_by_claude`** (checklist structurelle stricte) + 29 `information_only`
- **145/284 avec cascades structurées** (actionabilité)
- **34 règles normatives exécutables** sur **13 domaines** (bail/travail/dettes/transversal/consommation/assurances/voisinage + famille/etrangers/social/violence/accident/entreprise — +12 règles ajoutées 2026-04-19 via phase5-domain-extension fix)
- **282 invariants régression juridique** (hash-lock sur délais/articles, recalculés 2026-04-19 avec les +12 règles)
- **376 intents catalogués**, pages SEO guides = 253
- **Source-registry 100% résolution** (fallback RS Fedlex — CC/CO/LP/LAA/LAI/LAMal/LCR/LAO/...)
- **Corpus jurisprudence cantonale** en ingestion via `scripts/ingest-entscheidsuche.mjs` (lacune démocratique comblée)
- **Compte citoyen longitudinal 12 mois** (magic link, k-anonymization)
- **Outcomes tracker** (consent strict, PII stripping, k=5)
- **Dashboard live** avec gates : `structurally_validated_passed: true` (100%), `gate_phase2_passed: false` (attend humain)
- **Benchmark** vs LLM brut structurel : **×6.4** (avantage +54.2 points / 100, score 64.2 — recalculé 2026-04-20 avec les 34 règles + fondations)
- 101+/101 tests critiques verts sur suite ciblée

### Fondations qualité (2026-04-19 — 13 chantiers + bugs + tests + logger migration tous clos)

**Infrastructure prod-ready** :
- **Health check `/api/health/deep`** (`services/health-check.mjs`) — 12 checks, 12/12 ok en prod
- **Cache read-through `enrichFiche`** avec shallow clone sur return (bug mutation fixé)
- **Logger centralisé** (`services/logger.mjs`) — JSON prod, pretty dev, silent test, hook auto vers metrics. **100% migré** : `server.mjs` + 12 services, 82 console.* éradiqués
- **Case-store compaction** toutes 10min + flush graceful shutdown
- **Env-check fail-fast** au boot (`services/env-check.mjs`) + `GET /api/admin/env`
- **Metrics** (`services/metrics.mjs`) — HTTP counters, errors, rate-limit buckets, exposés via `GET /api/admin/metrics`
- **Request ID correlation** via `X-Request-Id` (entrée ou généré)
- **Docker entrypoint seed** : le volume runtime n'écrase plus les fichiers meta statiques (intents-catalog.json, cantons-matrix.json, reports). Entrypoint tourne en root → seed + chown → drop vers node via su-exec

**Bugs corrigés (tous pre-existing)** :
- `queryByProblem` n'appelait jamais `enrichEscaladeWithMatrix`
- `queryComplete` n'injectait pas `fiche.freshness`
- Cache enrichFiche leak (mes propres commits, fixé)
- `checkAdmin` 403 en tests (tests ne passaient pas Bearer)
- Language router pollait FR avec source_language, DE/IT manquaient degraded_mode
- Semantic routing "récupérer la garde" → violence au lieu de famille (DOMAIN_REQUIRED_TRIGGERS pour violence)
- Phase4 scope test assertait draft_automated alors que fiches legitimes en reviewed_by_claude

**Normative compiler** : 22 → 34 règles (+12 FAMILLE/ETRANGERS/SOCIAL/VIOLENCE/ACCIDENT/ENTREPRISE). **282 invariants** régression juridique (recalculés).

**Deploy live** : 12/12 ok sur https://justicepourtous.ch. Secrets CITIZEN_EMAIL_SALT + OUTCOMES_HASH_SALT générés + vault. Image repo nettoyée (cases.json 200MB retiré de l'historique via filter-branch).

### Archive historique
- 368 tests verts, 4448 articles, 2487 arrêts TF, 182 fiches enrichies, 14 cantons
- Pipeline V3 implémenté (pipeline-v3.mjs) avec CLI fallback
- CONSTITUTION.md créée — document canonique
- Golden cases : 100% claim grounding rate sur 2 cas complets
- Site live https://justicepourtous.ch avec design system premium
- Endpoint premium /api/premium/analyze-v3 déployé
- **Source registry** (source-registry.mjs) — 3 tiers, source_id universel, validation claims
- **Object registry** (object-registry.mjs) — 10 objets gelés structurés avec evidence metadata
- **Retrieval optimisé** — 100% top-1, relevance scoring dans dossier builder, vrais source_ids
- **Page résultat V3** — confidence badges, tier indicators, role badges juris, délais visuels, lacunes, anti-erreurs avec gravité
- **Coverage certificate** (coverage-certificate.mjs) — gate contradictoire avant toute réponse, 10 checks dont 3 critiques
- **Eval harness** (eval-harness.mjs) — 10 golden cases × 10 rubrics, mesure reproductible par domaine
- **389 tests** dont 47 adversariaux, 16 argumentation, 21 compiler, 10 questioner, 8 committee, 14 frontier, 11 baremes, 7 freshness
- **Argumentation engine** (argumentation-engine.mjs) — graphe Dung/Toulmin résolu par code, tier-aware
- **Marginal questioner** (marginal-questioner.mjs) — questions à plus haute valeur décisionnelle
- **Committee engine** (committee-engine.mjs) — 4 rôles votant sur objets normalisés
- **Freshness check** (scripts/freshness-check.mjs) — 86% fresh, 0 stale, 622 sans date
- **Source Frontier** (source-frontier.mjs) — 23 sources cartographiées (dont 6 vulgarisation), 22% ingérées
- **Normative compiler** (normative-compiler.mjs) — 14 règles juridiques en code exécutable (bail/travail/dettes/transversal)
- **Barèmes nationaux** — taux hypothécaire OFL 1.75%, minimum vital 26 cantons, 5 CCT principales
- **26 cantons** enrichis (couverture nationale complète)
- **Vulgarisation** — ASLOCA Kit ingéré (30 Q&A citoyennes bail), vulgarisation-loader.mjs
- **Deep analysis** (deep-analysis.mjs) — multi-tour adaptatif: comprendre → approfondir → conclure
- **LLM-as-judge** (llm-judge.mjs) — évaluation qualitative par LLM
- **LLM-first triage** — Haiku identifie la situation, keyword = fallback only
- **LLM augmenté** — navigator reçoit règles normatives, barèmes, délais en contexte
- Pipeline complet : LLM comprendre → dossier → certificat → argumentation → comité → LLM approfondir → LLM conclure → compiler

### Séquence constitution — TERMINÉE
1. ~~Source registry~~ ✓
2. ~~Objectification~~ ✓
3. ~~Retrieval~~ ✓ (audit: déjà 100% top-1, optimisé dossier builder)
4. ~~Page résultat V3~~ ✓

### Innovations V4 (docs/innovations-v4.md) — 5/5 TERMINÉES
1. ~~Moteur d'arguments réfutables~~ ✓ Dung/Toulmin grounded semantics + tier resolution
2. ~~Certificat de suffisance~~ ✓ Gate actif (contradictoire = critique, bloque si insufficient)
3. ~~Questionneur marginal~~ ✓ Questions par valeur décisionnelle, pas conversationnelle
4. ~~Comité à désaccord contrôlé~~ ✓ 4 rôles, votes sur objets normalisés, désaccord = signal
5. ~~Compilateur normatif~~ ✓ 14 règles JS exécutables (bail/travail/dettes) avec exceptions et source_ids

### Source Frontier — Top 5 priorités ingestion
1. Autorités conciliation bail (tous cantons) — impacte moisissure + caution
2. Formulaires officiels bail cantonaux — impacte augmentation + expulsion  
3. Taux hypothécaire de référence OFL — impacte augmentation loyer
4. Jurisprudence cantonale (entscheidsuche) — couvre les gaps contradictoire
5. CCT/CCNT (conventions collectives) — impacte salaire impayé

### Prochaine action
- Ingérer les sources de vulgarisation (Mobilière, droitpourlapratique, guidesocial, ASLOCA kit)
- Deploy site avec toutes les nouvelles features
- Feedback utilisateurs réels sur bail/travail/dettes

### Blockers
- API Anthropic sans crédits → CLI fallback local OK, prod non
- Page résultat encore en ancien format
- ~~LEI Fedlex harvest~~ RÉSOLU — 294 articles (LEI 123, LAsi 119, LN 52)

## Commandes
```bash
npm test
npm start
node src/services/graph-builder.mjs
node scripts/coverage-audit.mjs
```

## Structure
```
src/services/     — triage-engine, knowledge-engine, llm-navigator, action-planner, semantic-search
src/data/         — fiches (10 domaines), loi (622), jurisprudence (217), index/graph.json
src/public/       — frontend (HTML/CSS/JS vanilla)
test/             — 180 tests (node:test)
scripts/          — harvesters, coverage audit
```
