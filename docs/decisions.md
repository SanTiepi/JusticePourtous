# Decisions — JusticePourtous

Frontières de décision avec contre-exemples. Format LLM-native.

## D001 — LLM = navigateur, pas rédacteur
Quand tu génères une réponse juridique, navigue vers la bonne fiche et affiche SON contenu vérifié.
Ne rédige JAMAIS de prose juridique toi-même.
**Contre-exemple** : ChatGPT dit "en vertu de l'article 259a CO, vous avez droit à..." → hallucination possible.
**Nous** : on affiche le contenu de bail_defaut_moisissure.reponse.explication → vérifié, tracé.

## D002 — Payant dès le triage, pas freemium
Le triage IA coûte 2 CHF. La consultation des fiches est gratuite.
**Pourquoi** : le gratuit nous forçait à du keyword matching médiocre. Le LLM dans la boucle change tout.
**Contre-exemple** : v1 gratuite avec synonymes → "mon chef est toxique" ne matchait rien.

## D003 — Pas de chatbot
Le triage est structuré : identification → questions ciblées → résultat. Max 2-3 tours.
**Pourquoi** : un chatbot juridique hallucine. Un triage structuré sur données vérifiées ne peut pas.
**Contre-exemple** : DoNotPay = chatbot → amende FTC $193K.

## D004 — Citoyen d'abord, avocat ensuite
On ne concurrence pas Swisslex/Omnilex (outils pour avocats). On remplace l'avocat quand c'est possible.
**Contre-exemple** : tous les concurrents suisses visent les avocats → marché saturé.
**Nous** : 8.9M citoyens dont 72% citent le coût comme barrière #1.

## D005 — Pipeline séquentiel agents
CTO planifie → Engineer code → Codex review. Pas de parallélisme sur mêmes fichiers.
**Contre-exemple** : 4 agents en parallèle = conflits git + code incohérent.

## D006 — Brief chirurgical obligatoire
Chaque ticket agent contient : fichiers exacts, patterns à réutiliser, critères done, contre-exemples.
**Pourquoi** : un brief complet = 3-5x plus rapide qu'un agent qui explore (benchmark dev-runner v2).
