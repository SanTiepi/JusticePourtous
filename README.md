# JusticePourtous

**Triage juridique citoyen suisse** — un connecteur intelligent entre les citoyens et
les ressources juridiques vérifiées. En production sur **[justicepourtous.ch](https://justicepourtous.ch)**.

> Ce n'est pas une base documentaire de plus. Le LLM **navigue** sur des données juridiques
> vérifiées (fiches, articles, jurisprudence) — il **identifie, extrait et questionne**, mais
> ne **rédige jamais** de contenu juridique lui-même. Le contenu vient toujours des fiches sourcées.

## Principe

- **Pour les citoyens**, pas les avocats. Remplacer l'avocat quand c'est possible, rediriger quand c'est nécessaire.
- **Traçabilité** : chaque réponse pointe vers ses sources (articles de loi, arrêts). Disclaimer sur chaque réponse ; jamais « avocat IA ».
- **Triage > génération** : on évalue la complexité par dimensions structurées (cascades, confiance, jurisprudence), pas par mots-clés.

## Données

182 fiches · 622 articles · 217 arrêts · 10 domaines juridiques · graphe bidirectionnel.

## Stack

Node.js ESM, **zéro dépendance**, `http` natif. Pipeline de triage contradictoire multi-étapes.

```
src/server.mjs                  serveur HTTP
src/services/
  knowledge-engine.mjs          graphe de connaissances (fiches ↔ articles ↔ arrêts)
  llm-navigator.mjs             navigation LLM sur les données vérifiées
  triage-engine.mjs             orchestration du triage
  action-planner.mjs            plans d'action citoyens
  semantic-search.mjs           fallback recherche sémantique
```

## Démarrage

```bash
npm start     # node src/server.mjs
npm test      # node --test test/*.test.mjs
```

Variables d'env documentées dans `src/services/env-check.mjs` (ex. `ANTHROPIC_API_KEY`,
`ADMIN_TOKEN`, `RESEND_API_KEY`, `CITIZEN_EMAIL_ENC_KEY`, Stripe). Copier `.env.example`
(placeholders) puis remplir — **ne jamais committer le `.env`**.

## Docs

- **[ONBOARDING.md](ONBOARDING.md)** — prise en main
- **[ARCHITECTURE.md](ARCHITECTURE.md)** — architecture technique détaillée
- **[VISION.md](VISION.md)** — positionnement & stratégie
- **[CLAUDE.md](CLAUDE.md)** — conventions agent + décisions verrouillées

## Cadre légal

La LLCA ne réserve pas le conseil juridique aux avocats. Disclaimer obligatoire sur chaque
réponse. L'outil oriente et informe à partir de sources vérifiées — il ne remplace pas un
conseil juridique personnalisé lorsque la situation l'exige.
