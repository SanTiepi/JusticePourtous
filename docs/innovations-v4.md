# Innovations V4 - 5 paris concrets pour dépasser l'état de l'art

Ces 5 idées ne remplacent pas le pipeline V3. Elles le rendent plus difficile à copier en transformant JusticePourtous d'un "RAG juridique prudent" en moteur contradictoire exécutable, auditable et opérable.

## 1. Moteur d'arguments réfutables compilé

Le dossier n'est plus seulement une liste de sources: il est compilé en graphe `claim -> warrant -> backing -> rebuttal -> exception` à partir de `object-registry` et `source-registry`.
Le LLM propose les noeuds et les arêtes, mais le statut final (`in`, `out`, `undecided`) est calculé par code avec priorités par `tier`, fraîcheur, spécificité et périmètre cantonal.
La réponse citoyenne ne peut verbaliser que des `verified_claims` gagnants dans le graphe; tout le reste devient soit objection explicite, soit question, soit escalade.

**Effort estimé:** 4 à 6 semaines
**Impact:** Très élevé - meilleure gestion des exceptions, des conflits de sources et de l'incertitude réelle
**Pourquoi personne ne le fait encore:** il faut déjà posséder des objets juridiques structurés, des `source_id` stables et accepter un coût d'ontologie que la plupart des produits legal tech évitent.

## 2. Questionneur à valeur juridique marginale

Pour chaque fait manquant, le système simule plusieurs mondes possibles (`oui/non/inconnu`) et relance le graphe d'argumentation plus les compilateurs déterministes pour mesurer ce que ce fait change vraiment.
On n'optimise plus les questions pour "mieux comprendre", mais pour maximiser la variation de statut d'un claim, d'un délai, d'une autorité compétente ou d'une fourchette de montant.
Le chatbot pose donc moins de questions, mais ce sont les 2 ou 3 questions qui ont la plus forte valeur décisionnelle et la plus forte réduction de risque.

**Effort estimé:** 3 à 4 semaines après le graphe réfutable
**Impact:** Très élevé - intake plus court, meilleure précision, meilleur passage à l'action
**Pourquoi personne ne le fait encore:** cela exige un pipeline contrefactuel mesurable; la plupart des assistants posent des questions conversationnelles, pas des questions optimisées par valeur juridique.

## 3. Compilateur normatif suisse Catala-Prolog-JS

Les règles stables sont encodées dans un mini DSL inspiré de Catala, compilé vers JS pour délais/montants et vers logique type Prolog pour conditions, exceptions, recevabilité et charge de la preuve.
Le LLM ne "dit plus le droit": il mappe les faits vers des prédicats et propose des hypothèses sourcées quand une exception ou un fait manque, puis le code tranche ce qui est exécutable.
La mise en oeuvre peut commencer sur 4 slices étroites à fort volume: dépôt de garantie, congé, salaire impayé, poursuite/mainlevée, avec versionnage par canton et `source_id`.

**Effort estimé:** 8 à 12 semaines pour les premiers domaines, puis coût marginal faible par nouvelle règle
**Impact:** Extrêmement élevé - baisse structurelle des hallucinations et création d'un actif logiciel durable
**Pourquoi personne ne le fait encore:** le coût initial de modélisation est élevé, les juristes codent rarement, et le marché préfère encore les démos LLM générales aux compilateurs juridiques.

## 4. Certificat de suffisance contradictoire

Avant toute réponse, le système doit remplir une matrice minimale de couverture: base légale applicable, jurisprudence favorable, jurisprudence contraire, preuve requise, délai, variation cantonale, anti-erreur.
Si une case critique manque, si une source est trop faible, ou si un contre-argument fort n'est pas neutralisé, le claim passe automatiquement en `insufficient` ou retourne en question/escalade.
Chaque analyse produit un `coverage_certificate.json` exploitable en QA, en tests de non-régression et en monitoring de production.

**Effort estimé:** 2 à 3 semaines
**Impact:** Élevé - empêche les réponses "complètes en apparence" mais juridiquement insuffisantes
**Pourquoi personne ne le fait encore:** les benchmarks du secteur mesurent surtout la pertinence du retrieval et la fluidité de la réponse, pas la suffisance probatoire et contradictoire.

## 5. Comité institutionnel à désaccord contrôlé

Au lieu d'un simple self-consistency par vote de texte, on fait tourner un comité de rôles fixes: avocat du citoyen, avocat adverse, greffier, juge de tri, chacun avec un budget de sources et une mission différente.
Ils votent sur des objets normalisés (`claims`, `exceptions`, `preuves manquantes`, `objections`) et non sur la prose finale; seuls les éléments invariants traversent vers `validated_claims`.
Le désaccord devient un signal produit: le citoyen voit précisément quel point est litigieux, quelle preuve le ferait basculer et pourquoi le système reste prudent.

**Effort estimé:** 3 à 5 semaines
**Impact:** Élevé à très élevé - forte robustesse sur cas limites et amélioration visible de la confiance utilisateur
**Pourquoi personne ne le fait encore:** les systèmes multi-agents restent souvent démonstratifs; les rendre auditables, normalisés et compatibles avec des contraintes juridiques demande beaucoup de discipline de schéma.

## Ordre de mise en oeuvre recommandé

1. Moteur d'arguments réfutables compilé
2. Certificat de suffisance contradictoire
3. Questionneur à valeur juridique marginale
4. Comité institutionnel à désaccord contrôlé
5. Compilateur normatif suisse Catala-Prolog-JS

La logique est simple: on commence par la couche qui permet de représenter proprement les conflits, on ajoute ensuite les garde-fous, puis on optimise l'intake et la robustesse, et enfin on industrialise les pans de droit les plus stables en code exécutable.
