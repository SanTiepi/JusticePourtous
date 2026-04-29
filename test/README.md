# Tests — JusticePourtous

## Vue d'ensemble

- **80 fichiers** test (`test/*.test.mjs`)
- **1582 tests** au total (état 2026-04-29)
- Runner : `node --test` (natif Node 22+)
- Mode mock LLM : `LLM_MOCK=1` (déterministe via `src/services/llm-mock.mjs`)
- Mode mock i18n : `JB_TRANSLATION_FAKE=1` (translator stub qui prefix `[[lang]]`)

## Commandes

```bash
# Suite complète (locale, peut nécessiter API LLM)
npm test

# Suite i18n uniquement
npm run test:i18n

# Subset CI (exclut tests qui requièrent vraie API LLM)
TEST_FILES=$(ls test/*.test.mjs | grep -v -E '(e2e|llm-nav|letter-gen|deep-analysis|premium|stress|adversarial-eval)')
NODE_ENV=test ADMIN_TOKEN=ci-admin-token LLM_MOCK=1 node --test --test-timeout=30000 $TEST_FILES
```

## Tests exclus du CI

Les fichiers suivants requièrent une vraie clé `ANTHROPIC_API_KEY` ou des dépendances externes lentes — exclus du subset déterministe :

| Fichier | Raison |
|---|---|
| `e2e-frontend.test.mjs` | Lance un browser, demande LLM réel, latence variable |
| `llm-nav-*.test.mjs` | Stress test du navigator LLM |
| `letter-gen.test.mjs` | Génération de lettres via LLM Anthropic |
| `deep-analysis.test.mjs` | Pipeline multi-tour LLM |
| `premium.test.mjs` | Pipeline premium V3 (LLM + Stripe sandbox) |
| `stress.test.mjs` | Stress 100+ requêtes |
| `adversarial-eval.test.mjs` | Eval adversarial avec LLM judge |

Ces tests passent localement quand `ANTHROPIC_API_KEY` est définie (vault).

## Tests structurels (toujours exécutés)

- **Schema fiches** (`phase-cortex-fiche-schema.test.mjs`) : 31 tests sur la validation des 314 fiches
- **Source registry** (`phase-cortex-source-registry-coverage.test.mjs`) : 47 tests sur la résolution source_id
- **Normative compiler** (`normative-compiler.test.mjs`) : 36 tests sur les 76 règles
- **Régression invariants** (`phase-cortex-regression-juridique.test.mjs`) : 282 invariants hash-lock
- **i18n fallback** (`i18n-fallback-llm-down.test.mjs`, `i18n-translation.test.mjs`) : tests bullet-proof provider down

## Hooks de test

- `JB_TRANSLATION_FAKE=1` — active fake translator (suffix `[[lang]]`)
- `JB_TRANSLATION_FAKE_THROW=1` — fake translator throw (test fallback)
- `JB_TRANSLATION_FAKE_DELAY_MS=N` — simule latence (test parallélisme)
- `JB_TRANSLATION_MAX_CONCURRENCY=N` — borne la parallélisation
- `LLM_MOCK=1` — utilise mock LLM déterministe au lieu d'Anthropic
- `ADMIN_TOKEN` — pour `/api/admin/*` (sans token = 403)

## Flakes connus (Windows local seulement, CI Linux stable)

- **`object-registry.test.mjs`** — fail silencieux ~1/10 runs sur Windows. Cause probable : race condition file système ou port. Pas reproduit en isolation. Pas vu en CI Linux.
- **`deadline-reminders.test.mjs`** — était flake EPERM Windows (race atomic-write), fixé en commit [118f663](../src/services/atomic-write.mjs) (retry borné).

## Convention

- Chaque fichier déclare son `PORT` (range 9881-9890 pour les tests qui montent un serveur HTTP)
- Tests qui touchent le case-store écrivent dans `os.tmpdir()` pour éviter de polluer la prod
- `_resetStoreForTests({ path: TEST_STORE_PATH })` est appelé en `before()` pour isolation

## Coverage informelle

- 1582 tests au runner
- Couvre : schema, validators, source-registry, intent-catalog, dashboard-metrics, freshness, normative compiler, argumentation, committee, deadline-reminders, citizen account, outcomes, payload-shaper, language-router, escalation, source-frontier, donnees-juridiques, semantic-search, vulgarisation, anti-erreurs, i18n, fallback gracieux, healthcheck, fedlex-diff, regression-invariants
- Pas couvert structurellement : frontend JS (`src/public/*.js` — manuel via tests E2E exclus du CI)
