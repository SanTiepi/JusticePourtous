# Audit du processus de triage — cas juridiques complexes (2026-05-31)

Tests « hyper poussés » auto-générés + jugés par jury LLM, pour voir et affiner le
processus de triage. Artefacts : `test/complex-cases.mjs` (45 cas), `scripts/run-complex-eval.mjs`
(runner 2 chemins), `test/complex-cases-keyword.test.mjs` (régression).

## Méthodologie

1. **Génération** (workflow 9 agents) — 45 cas complexes sur 9 catégories, ancrés sur le
   catalogue RÉEL (0 fiche inventée vérifié) : multi-domaine, cascade temporelle, délai
   péremptoire caché, piège de fabrication, info-déjà-donnée, hors-scope/redirection,
   question marginale unique, for inter-cantonal, faux-amis de complexité.
2. **Exécution 2 chemins** — chaque cas passé dans (a) le **navigator LLM** (vrai SYSTEM_PROMPT
   de `llm-navigator.mjs`, modèle haiku = modèle de prod, via `claude -p`) et (b) le **keyword
   fallback** (`queryByProblem`, = chemin de PROD ACTUELLE car API LLM down).
3. **Jugement** (workflow 72 agents) — un juriste suisse (Opus) par cas, rubrique riche
   (exhaustivité multi-fiches, extract-first, question pivot, fabrication, redirection,
   gravité), puis **contre-expertise adversariale** de chaque échec (réfutation).

## Résultats agrégés (45 cas)

| Métrique | Navigator LLM (futur) | Keyword (prod actuelle) |
|---|---|---|
| pass | 19 | 9 |
| partial | 22 | 12 |
| **fail** | **4** | **24 (53 %)** |
| meilleur chemin | **33** | 5 |

- **Le chemin keyword échoue sur 53 % des cas complexes** — c'est ce qui tourne en prod (LLM down).
- Navigator nettement meilleur (41/45 pass+partial) MAIS 4 failles touchant la Constitution
  (fabrication d'articles, délais non chiffrés, exhaustivité, sur-confiance).
- 5 fabrications navigator, 4 questions redondantes, 28 « critical » (ramenés par contre-expertise).
- Redirect (hors-scope) : navigator signale l'incertitude 5/5 ; keyword force une fiche 5/5.

## 15 failles systémiques (toutes `fixable_now`)

| # | Faille | Gravité × fréq | Chemin |
|---|---|---|---|
| 1 | Keyword aveugle au multi-domaine (`detectDomainBoost` mono-dominant) | critical ×22 | keyword (PROD) |
| 2 | Aucun détecteur de délai péremptoire ancré sur la date extraite (countdown) | critical ×18 | both |
| 3 | Navigator fabrique bases légales/autorités/for dans le champ libre « pourquoi » | critical ×11 | navigator |
| 4 | Aucun filet de sécurité si le navigator crash (silence sur urgence vitale) | critical ×4 | both |
| 5 | Exhaustivité multi-fiches non garantie (`slice(0,3)`, pas de post-traitement graphe) | high ×16 | navigator |
| 6 | Keyword sans seuil de score minimal ni garde-fou de cohérence domaine | high ×9 | keyword |
| 7 | Questionneur marginal pose du raffinement, rate la question dispositive (pivot) | high ×8 | navigator |
| 8 | Pas de désambiguïsation du token « permis » (conduire vs séjour) | high ×6 | keyword |
| 9 | Aucune gate anti-redondance (redemande des faits déjà extraits) | high ×5 | navigator |
| 10 | Ancrage de cascade procédurale : choisit l'étape voisine, pas celle de l'usager | high ×5 | both |
| 11 | Confiance non calibrée sur les incertitudes à fort enjeu (sur-confiance) | medium ×5 | navigator |
| 12 | Sur-association lexicale / escalade prématurée (fiches annexes non justifiées) | medium ×5 | navigator |
| 13 | Fausses prémisses juridiques non débunkées (se laisse cadrer par le mythe) | high ×4 | navigator |
| 14 | IDs de fiche forgés silencieusement supprimés au lieu d'être corrigés (alias) | medium ×3 | navigator |
| 15 | Procédures parallèles pénale/administrative fusionnées (circulation) | high ×2 | navigator |

## Corrigé + mesuré + verrouillé cette session

**Gap 8 — désambiguïsation « permis » (keyword, PROD)** dans `semantic-search.mjs` :
ajout du domaine `circulation` (absent) à `DOMAIN_AFFINITY_WORDS` + override d'expansion :
« permis » + signal routier (radar/vitesse/alcool/retrait…) sans signal migratoire → permis
de CONDUIRE (circulation), pas permis de séjour.

| Mesure (chemin keyword) | Avant | Après |
|---|---|---|
| permis-circulation surfacé | 1/5 | **5/5** |
| domaine correct (80 cas historiques) | 35/80 | **37/80** (+2, pas de régression) |

Verrouillé par `test/complex-cases-keyword.test.mjs`. Gate complète verte.

## Différé — et POURQUOI (pas par paresse, par discipline)

- **Failles navigator (3, 5, 7, 9, 11, 12, 13, 15)** : le navigator LLM **n'est pas en prod**
  (API Anthropic sans crédits → fallback keyword). Les correctifs sont du **prompt engineering**
  dont l'amélioration ne peut pas être re-vérifiée à bas coût sans crédits API. Les implémenter
  à l'aveugle risquerait de régresser les 80 cas adversariaux existants. → **À faire quand l'API
  est financée**, avec re-run de l'éval pour mesurer.
- **Override d'articles dans le normative-compiler (volet de gap 2 et 3)** : la synthèse propose
  des corrections d'articles (CO 270b vs 273, CPC 23 al.1 for divorce, LCR 65…). Ce sont des
  **affirmations juridiques** ; la Constitution du projet impose qu'elles soient **validées par
  un humain** avant d'être traitées comme vérité. → bloqué sur la même gate que les 5 fiches gold
  (validation juriste payé CHF 300-500).
- **Réécriture architecturale du keyword (gap 1, slots réservés par domaine)** : testée en patch
  fin (boost ×1.2 secondaire) = **aucun gain** sur l'exhaustivité (top-5 saturé par le dominant)
  + régression de 1 cas → **retiré**. L'audit conclut lui-même « pas réparable en patch fin ».
  Le vrai gain multi-fiches viendra du navigator + post-traitement graphe.

## Roadmap priorisée (quand l'API LLM sera financée)

1. **deadline-detector.mjs** (gap 2, critical) — convertit toute date extraite + trigger en
   compte-à-rebours chiffré, dies a quo correct (connaissance du décès pour successions). Délais
   sourcés depuis les fiches/normative-compiler, jamais inventés.
2. **Couper le canal de fabrication** (gap 3) — champ « pourquoi » → énuméré fermé ; toute base
   légale affichée vient de la fiche/normative-compiler, jamais du LLM.
3. **Filet de sécurité crash navigator** (gap 4) — re-passer `safety-classifier` dans le catch +
   élargir patterns DÉTRESSE / créer DANGER_IMMINENT_TIERS → 117/144 inconditionnel.
4. **Post-traitement graphe** (gap 5) — clusters de fiches (régimes alternatifs / cascade procédurale).
5. **Gate anti-redondance + recalcul déterministe de la confiance** (gaps 9, 11).
6. **Question dispositive par situation** (gap 7) + ancrage de cascade (gap 10).
7. **Résolution tolérante d'IDs** (gap 14, alias `succession_*`/`successions_*`, `etranger_*`/`etrangers_*`).

Tous les cas sont intégrés en régression permanente — ces corrections seront mesurables.
