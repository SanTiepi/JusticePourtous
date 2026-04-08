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

### État actuel (mis à jour 2026-04-08)
- 180 tests verts, 4448 articles, 2487 arrêts TF, 182 fiches enrichies
- Pipeline V3 implémenté (pipeline-v3.mjs) avec CLI fallback
- CONSTITUTION.md créée — document canonique
- Golden cases : 100% claim grounding rate sur 2 cas complets
- Site live https://justicepourtous.ch avec design system premium
- Endpoint premium /api/premium/analyze-v3 déployé

### Prochaine action (séquence constitution)
1. Source registry (formaliser les 3 tiers)
2. Objectification (structurer les objets gelés)
3. Retrieval hybride (lexical + sémantique + RRF)
4. Page résultat refaite avec design system V3

### Blockers
- API Anthropic sans crédits → CLI fallback local OK, prod non
- Page résultat encore en ancien format
- LEI Fedlex harvest 0 articles (URL ELI à corriger)

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
