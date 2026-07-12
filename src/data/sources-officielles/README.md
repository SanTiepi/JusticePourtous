# ⚠ Le droit fédéral, lu à la source — pas écrit par un LLM

**Créé le 2026-07-12. Ne pas éditer à la main. Ne pas confondre avec `src/data/loi/`.**

## Ce que c'est

Le texte **officiel** des lois fédérales suisses, téléchargé depuis **Fedlex** (la
publication de la Confédération), dans la version **en vigueur à la date de lecture**.

Chaque fichier porte sa provenance : `source` (l'URL Fedlex exacte),
`en_vigueur_depuis`, `en_vigueur_jusqu_a`, `lu_le`.

Généré et rafraîchi automatiquement par [`src/services/source-officielle.mjs`](../../services/source-officielle.mjs).
Le cache se ré-télécharge tout seul dès que la consolidation qu'il contient cesse d'être en
vigueur — une loi révisée le 1er janvier ne sera pas servie le 2.

## Pourquoi ça existe

Le 12 juillet 2026, un comité de cinq agents adverses a conseillé à une personne d'écrire une
« opposition » à l'office AI pour contester un refus de rente.

**Il n'existe pas d'opposition en assurance-invalidité.** L'art. 69 al. 1 let. a LAI déroge
expressément aux art. 52 et 58 LPGA : c'est un recours *direct* au tribunal cantonal des
assurances, 30 jours. Cette personne aurait attendu une réponse qui ne serait jamais venue,
pendant que son délai de recours s'éteignait. Elle aurait perdu sa rente.

Le chasseur de pièges avait pourtant trouvé la vérité, avec le bon article. Le réfutateur l'a
détruite en invoquant l'**ATF 130 V 388** — un arrêt qui traite d'une caisse de chômage et ne
dit rien de tel. Le juge l'a cru : **il n'avait aucun moyen d'ouvrir le code de loi.**

> Dans un débat sans accès aux pièces, l'hallucination part gagnante. Une citation vraie est
> contrainte : elle ne peut dire que ce que le texte dit. Une citation inventée n'est
> contrainte par rien — elle peut être exactement l'argument qui manquait, avec l'autorité qui
> manquait. **Ajouter de la contradiction sans ajouter d'accès au réel rend le système moins
> fiable, pas plus.**

Ce dossier est cet accès au réel.

## Ne pas confondre avec `src/data/loi/`

`src/data/loi/` contient 4459 entrées appelées « articles ». Ce **ne sont pas** des textes de
loi : le champ s'appelle `texteSimple` et contient une **paraphrase écrite par un LLM**.
L'art. 69 LAI — celui qui décidait de cette rente — n'y figure même pas.

On ne peut pas vérifier une citation contre une paraphrase : c'est vérifier une hallucination
avec une autre.

## Qui le consomme

- [`src/services/source-officielle.mjs`](../../services/source-officielle.mjs) — le lecteur (SPARQL Fedlex → HTML consolidé → articles)
- [`src/services/adversarial-committee.mjs`](../../services/adversarial-committee.mjs) — le greffe : il pose le texte officiel sous les yeux du juge, en face de chaque affirmation
- [`test/source-officielle.test.mjs`](../../../test/source-officielle.test.mjs) — la veille : `npm run test:sources` devient rouge si l'art. 69 LAI perd sa dérogation, si l'art. 336c CO perd ses 90 jours, ou si l'on se remet à servir une version périmée

## Le piège à ne jamais réintroduire

Le point SPARQL de Fedlex compare **mal les dates typées** : avec un filtre
`?date <= "2026-07-12"^^xsd:date`, il écarte **silencieusement** la consolidation 2024 de la
LPGA et remonte celle de **2022**. On servirait un texte vieux de deux ans en croyant lire le
droit en vigueur — sans le moindre message d'erreur.

La comparaison doit se faire sur `STR(?date)`. Un test le verrouille.
