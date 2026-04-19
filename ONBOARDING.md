# Welcome to JusticePourtous

**Mission** : triage juridique citoyen suisse — réduire le besoin de consulter un avocat payant sur les cas citoyens standardisés. Pas une base documentaire, un connecteur intelligent entre citoyens et ressources juridiques.

## Positionnement verrouillé (CONSTITUTION.md)

**Formulation autorisée** :
> "JusticePourtous réduit le besoin de consulter un avocat payant sur les cas citoyens standardisés."

**INTERDIT** :
> "Nous sommes meilleurs qu'un avocat" (globalement).

Supérieur à l'avocat uniquement sur 5 tâches bornées : triage standardisé, exhaustivité contradictoire des sources, traçabilité, coût, suivi opérationnel.
Inférieur à l'avocat sur : représentation, stratégie fine, négociation complexe, plaidoirie.

## État actuel (snapshot)

- **15 domaines** : bail, travail, famille, dettes, etrangers, assurances, social, violence, accident, entreprise, consommation, voisinage, circulation, successions, sante
- **284 fiches** (234 production + 50 beta des 5 domaines Phase 4)
- **100 règles normatives exécutables** (compile par domaine + exceptions + source_ids Fedlex)
- **274 invariants régression juridique** (verrouille délais/articles/autorités critiques)
- **376 intents catalogués** (catalogue `src/data/meta/intents-catalog.json`)
- **2521 arrêts TF indexés** + corpus cantonal entscheidsuche en ingestion
- **6 cantons prioritaires** : VD, GE, ZH, BE, BS, TI avec autorités + formulaires
- **100% fiches reviewed_by_claude** (gate structurel) / 0% reviewed_by_legal_expert (gate humain, réservé avocat)

## Architecture

```
src/
├── services/           — pipeline triage + modules Cortex
│   ├── triage-engine.mjs         # entrée LLM-navigué
│   ├── triage-orchestration.mjs  # flux HTTP (safety → scope → gate → triage)
│   ├── case-store.mjs            # persistance 72h (12 mois si citoyen connecté)
│   ├── citizen-account.mjs       # compte longitudinal (magic link, k-anon)
│   ├── coverage-certificate.mjs  # gate bloquant avant diffusion
│   ├── complexity-router.mjs     # 7 dimensions + hard rules
│   ├── escalation-pack.mjs       # pack transmissible vers avocat humain
│   ├── outcomes-tracker.mjs      # data moat anonymisé (consent strict)
│   ├── normative-compiler.mjs    # règles juridiques en code exécutable
│   ├── source-registry.mjs       # résolution source_id (Fedlex + fallback RS)
│   ├── cantons-matrix.mjs        # autorités/formulaires 6 cantons
│   ├── freshness-badge.mjs       # fraîcheur par fiche
│   ├── cantonal-juris-matcher.mjs # match entscheidsuche → fiches
│   └── ...
├── data/
│   ├── fiches/*.json             # 284 fiches par domaine
│   ├── loi/                       # 4459 articles harvestés
│   ├── jurisprudence/*.json       # corpus TF (2521 arrêts)
│   ├── jurisprudence-cantonale/   # corpus entscheidsuche ingesté
│   ├── meta/                      # intents-catalog, regression-invariants, etc.
│   └── schemas/fiche.schema.json  # schéma canonique formel
├── public/                        # front vanilla HTML/JS/CSS
│   ├── index.html, resultat.html, dashboard.html, guides/*.html (253)
│   ├── app.js, citizen-ui.js, degraded-mode-banner.js
│   └── style.css
└── server.mjs                     # routes HTTP

test/                              # tests node:test, ~1000+ tests
scripts/                           # harvesters, audits, benchmarks
docs/                              # CONSTITUTION, brainstorm, roadmap
```

## Commandes utiles

```bash
npm test                                   # suite complète
npm start                                  # serveur local
node scripts/build-intent-catalog.mjs      # regen catalogue intents
node scripts/claude-legal-review.mjs       # review structural Claude
node scripts/audit-source-id-coverage.mjs  # verifie 100% source_id résolus
node scripts/benchmark-vs-llm-brut.mjs     # score vs LLM brut
node scripts/ingest-entscheidsuche.mjs --mock  # ingest juris cantonale
node scripts/fedlex-daily-diff.mjs --mock      # diff Fedlex quotidien
node src/services/graph-builder.mjs        # regen index graph.json
node scripts/generate-seo-pages.mjs        # regen 253 pages guides SEO
node scripts/generate-sitemap.mjs          # regen sitemap.xml
```

## Gates de sortie (roadmap durcie)

- **Gate Domaine** : top intents couverts + 0 erreur critique délais/montants + review humaine terminée + badge freshness actif
- **Gate Canton** : autorités + formulaires + délais + liens officiels complets
- **Gate Action (workflow sortant)** : coverage certificate sans fail critique + audit trail exportable + fallback avocat visible
- **Gate Go-Live** : LLM-judge sur 100% sorties + monitoring continu + rollback possible

Dashboard metrics live : `GET /api/dashboard/metrics` (admin en prod).

## Chantiers hors portage technique (décisions humaines/partenariats)

1. **Reviewers juridiques humains** — contacter profils alignés (ONG, émérites, doctorants, permanences publiques — cf. `docs/brainstorm-strategique.md`). Cible #1 : ASLOCA + permanence cantonale VD.
2. **Cron production Fedlex + entscheidsuche** — nécessite serveur cron OS (systemd timer / cron job)
3. **Partenariat La Poste e-lettres** — pour action sortante payante (lettres envoyées réellement)
4. **Mandat cantonal** — VD ou GE finance l'intégration à leur portail citoyen

## Principes non-négociables

1. Jamais prétendre être meilleur qu'un avocat globalement
2. Jamais usurper `reviewed_by_legal_expert` sans humain
3. Jamais inventer de contenu juridique (toujours citer sources vérifiées)
4. Disclaimer LLCA obligatoire sur chaque sortie
5. Gate-based strict (pas d'expansion sans gates validés)
6. Outcomes anonymisés seulement avec consent explicite (LPD)
7. k=5 anonymisation (aucune stat retournée si échantillon < 5)

## Pour commencer

1. Lire `CONSTITUTION.md` (doctrine immuable)
2. Lire `docs/brainstorm-strategique.md` (plan Q2 2026+)
3. Lancer `npm test` (baseline tests verts)
4. Ouvrir le dashboard dev : `npm start` puis `http://localhost:PORT/dashboard.html`
5. Faire un triage test : `http://localhost:PORT/?q=moisissure+dans+mon+appartement+à+Lausanne`
