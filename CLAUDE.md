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

### Erreurs passées (pitfalls)
- Ne pas construire un "OS d'attention" ou un "gouverneur cognitif" — c'est de l'abstraction élégante qui ne livre rien. Attendre les meilleurs modèles.
- Ne pas faire la course aux données vs Swisslex. On gagne sur l'intelligence du triage, pas le volume.
- Ne pas lancer de chatbot IA conversationnel. Le triage structuré est plus fiable.
- Ne pas paralléliser des agents sur les mêmes fichiers. Pipeline séquentiel.
- Un agent avec un brief chirurgical (fichiers + critères + contre-exemples) est 3-5x plus rapide qu'un agent qui explore.

## Mode actif (éphémère — contexte de la session en cours)

### État actuel
- 180 tests verts, score couverture 90%
- Triage engine v3 (LLM navigator + fallback semantic), routes API en place
- Paperclip configuré : 5 agents, tickets #1-#2 done, #3 frontend done par agents
- Prochaine action : vérifier le frontend fait par les agents, tester end-to-end

### Blockers
- Pas de clé ANTHROPIC_API_KEY en production → triage en mode fallback (basique)
- Frontend fait par Paperclip → qualité à vérifier
- Zéro utilisateur réel

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
