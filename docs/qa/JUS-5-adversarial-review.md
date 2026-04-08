# JUS-5 - Adversarial triage review

Date: 2026-04-08  
Scope: 20 profane scenarios on semantic triage (`semanticSearch`)

## Method

- Loaded all fiches via `getAllFiches()` (182 fiches)
- Ran each scenario with `semanticSearch(query, fiches, 3)`
- Evaluated:
  - top-1 domain precision
  - top-3 domain recall
  - latency distribution over 8,000 searches (20 scenarios x 400 loops)

## Results

- Top-1 precision: 15/20 (75%)
- Top-3 recall: 20/20 (100%)
- Complexity:
  - average: 1.8651 ms
  - p50: 1.7631 ms
  - p95: 2.9421 ms
  - p99: 3.3434 ms
  - max: 4.1941 ms

## False positives (top-1)

1. `Mon employeur ne me paie pas mon salaire` -> `dettes_saisie_salaire` (expected `travail`)
2. `Mon conjoint est violent et me menace` -> `etranger_violence_permis` (expected `famille`)
3. `J ai recu un commandement de payer mais je ne dois rien` -> `bail_loyers_impayes` (expected `dettes`)
4. `Mon permis de sejour a ete refuse` -> `bail_sous_location_refusee` (expected `etrangers`)
5. `Mon ex veut partir a l etranger avec notre enfant` -> `etranger_regroupement_familial` (expected `famille`)

## Notes for engineering follow-up

- Conflicts are mostly cross-domain collisions caused by shared lexical terms (`payer`, `refuse`, `etranger`, `enfant`).
- Current ranker is fast enough for MVP, but domain disambiguation needs a tie-break layer.
- Added executable guardrails in `test/triage-adversarial.test.mjs`:
  - top-3 recall must stay 100% on this batch
  - top-1 false positives must stay <= 5
  - p95 latency must stay < 12 ms
