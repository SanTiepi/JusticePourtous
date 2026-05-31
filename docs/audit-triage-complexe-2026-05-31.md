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

## CORRECTION — le navigator LLM tourne EN PROD (haiku-4-5)

Vérifié le 2026-05-31 : `/api/triage` renvoie le chemin navigator (clé API présente, ~$26 crédits).
Le blocker « Anthropic sans crédits » était PÉRIMÉ. **Le chemin de prod = le navigator** (le bon),
pas le keyword. Mon harnais `claude -p` (abonnement, haiku = modèle prod) vérifie les fixes navigator
SANS consommer les crédits API. Les failles navigator sont donc prioritaires ET vérifiables.

## Navigator — corrigé + mesuré + déployé + vérifié live (2026-05-31, commits fa7488c + 8da32fc)

| Fix | Mesure (éval claude -p haiku, 45 cas) | Live |
|---|---|---|
| **gap 3A** — interdiction de citer articles/délais/autorités dans la sortie (resume/pourquoi/questions) ; le droit vient des fiches | fabrication d'articles **6/42 → 0/43** ; sélection 38→**40/40** (0 régression) | ✅ `travail_licenciement_maladie`, resume sans article |
| **gap 9** — filtre anti-redondance canton (le navigator redemandait le canton déjà passé) | — | ✅ canton plus redemandé |
| **gap 14** — `resolveFicheId` : alias singulier/pluriel au lieu de drop silencieux | récupère les fiches perdues, ne renvoie que des IDs réels | déployé |
| **gap 5a** — `slice(0,3)→slice(0,5)` (cascades) | exhaustivité non tronquée | déployé |
| **perf** — prompt caching du SYSTEM_PROMPT 35KB (cache_control) | ~10× moins cher sur rounds de session | déployé |

## Différé — et POURQUOI

- **Override d'articles dans le normative-compiler (volet de gap 2 et 3)** : corrections d'articles
  (CO 270b vs 273, CPC 23 al.1 for divorce, LCR 65…) = **affirmations juridiques** ; la Constitution
  impose qu'elles soient **validées par un humain**. → bloqué sur la gate des 5 fiches gold (juriste
  payé CHF 300-500). NB : gap 3A (couper la fabrication) est FAIT et suffit à empêcher le LLM
  d'afficher des articles ; reste à ENRICHIR les fiches avec les bons articles (côté données, validé).
- **Réécriture du keyword multi-domaine (gap 1)** : testée en patch fin = aucun gain + régression
  → retirée. Le keyword n'est qu'un fallback (le navigator est le chemin de prod). Non prioritaire.

## Roadmap restante (vérifiable maintenant via `claude -p`, sans coût API)

1. **deadline-detector.mjs** (gap 2, critical) — convertit toute date extraite + trigger en
   compte-à-rebours ; valeurs sourcées depuis fiches/normative-compiler, jamais inventées. Le framing
   « péremptoire » est la pièce manquante (en live, délais affichés mais `consequence: null`).
2. **Filet de sécurité crash navigator** (gap 4) — re-passer `safety-classifier` dans le catch +
   élargir DÉTRESSE / créer DANGER_IMMINENT_TIERS → 117/144 inconditionnel.
3. **Post-traitement graphe** (gap 5b) — clusters de fiches (régimes alternatifs / cascade).
4. **Recalcul déterministe de la confiance** (gap 11) — downgrade si question critique ouverte.
5. **Question dispositive par situation** (gap 7) + ancrage de cascade (gap 10) — prompt.
6. **Anti sur-association** (gap 12) + débunk fausses prémisses (gap 13) + double-voie pénal/admin (gap 15) — prompt.

### FAIT cette session (2026-05-31)
gap 3A (anti-fabrication, 6→0), gap 9 (redondance canton), gap 14 (alias IDs), gap 5a (slice 3→5),
gap 8 (permis keyword), gap 2 (délais péremptoires : conséquence + flag, données curatées),
prompt caching. Tous déployés + vérifiés live.

### Testé puis REJETÉ / clos par analyse
- **gap 11 (confiance)** = NON-PROBLÈME : `nav.confiance` (auto-éval LLM) est calculé mais JETÉ par
  le pipeline (qui utilise `primary.confiance` de la fiche + complexité structurée). Aucune surface
  de préjudice. Pas de fix.
- **Lot prompt 7/10/12/13/15** = testé en un bloc (5 règles d'ancrage/pivot/anti-sur-association/
  fausses-prémisses/double-voie), éval claude -p : maintient 0 fabrication MAIS métriques de sélection
  en léger recul (multi 9→6, any 40→39) et spot-check mitigé (chien retiré ✓ mais insalubre ajouté ✗ ;
  salaire-entry ancré ✓ mais delai_02 régressé ✗). Bruit ≈ bénéfice → **reverté** (non déployé). Ces
  gaps demandent un traitement CHIRURGICAL individuel + cycle de juge complet par règle, pas un lot.
- **gap 5b (clusters graphe)** : `ficheToFiches` (312 liens) existe, mais expansion naïve ajoute du
  bruit cross-domaine (precision↓, cf. gap 12). À faire avec filtrage de pertinence, pas naïvement.

Tous les cas sont intégrés en régression permanente — ces corrections seront mesurables.
