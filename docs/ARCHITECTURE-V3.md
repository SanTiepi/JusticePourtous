# Architecture V3 — Dossier contradictoire vérifié

## Pivot fondamental

L'unité d'inférence n'est plus la FICHE. C'est le CLAIM VÉRIFIÉ.
La fiche devient un bloc de contexte parmi d'autres dans un dossier.

## Pipeline en 8 étapes

### 1. Fact Parser (GPT-mini, rapide, ~0.01 CHF)
Input: texte profane + canton éventuel
Output: case_facts.json {faits[], timeline[], acteurs[], montants[], dates[], documents[], inconnues_decisives[], questions_critiques[]}
Règle: aucune qualification juridique, seulement des faits

### 2. Issue Qualifier (GPT-5.4, ~0.05 CHF)
Input: case_facts.json
Output: issues[] — pas des fiches, des HYPOTHÈSES JURIDIQUES
Chaque issue: qualification, conditions_remplies, conditions_manquantes, procedure_probable, urgence, retrieval_queries
Règle: si condition clé manque → issue reste "provisional", on pose la question

### 3. Dossier Builder (CODE, pas LLM, 0 CHF)
Input: issues[] + retrieval_queries
Output: case_dossier.json — TOUT le contexte pertinent assemblé
Pour chaque issue: articles complets, arrêts pro/contra, variantes cantonales, délais, preuves requises, fourchettes montants, patterns praticien, anti-erreurs, contacts locaux, templates, cas pratiques
Règle: chaque source a un source_id + date + périmètre + statut validité

### 4. Primary Counsel (GPT-5.4, ~0.10 CHF)
Input: case_dossier.json
Output: claim_matrix.json — pour chaque issue: claims, contre-arguments, faits manquants, preuves nécessaires, délais, actions possibles
Règle: un claim sans source_id valide est REJETÉ. Interdit d'utiliser des connaissances hors dossier.

### 5. Adversarial Review (Claude Sonnet, ~0.08 CHF)
Input: case_dossier.json + claim_matrix.json
Output: objections.json — pour chaque claim: erreur possible, source contraire, condition oubliée, variation cantonale, délai oublié
Règle: chaque objection doit attaquer un claim_id précis et citer une source du dossier

### 6. Arbiter (GPT-5.4 ou Opus si conflit, ~0.05-0.20 CHF)
Input: dossier + claims + objections
Output: validated_claims.json — statuts: confirmed, limited, conflicted, insufficient
Règle: conflit non résolu → "incertain" + escalade humaine. Jamais d'affirmation sur un point disputé.

### 7. Deterministic Compilers (CODE, pas LLM, 0 CHF)
Input: validated_claims.json
Output: délais exacts, prochaines dates, autorité compétente, pièces à joindre, montant/range, contacts cantonaux, arbre "si refus alors..."
Règle: TOUS les délais et montants viennent de tables structurées, JAMAIS d'un LLM

### 8. Citizen Answer Generator (GPT ou template, ~0.03 CHF)
Input: validated_claims.json + sorties déterministes
Output: réponse citoyen finale
Règle: toute phrase affichée reliée à un claim_id validé

## Coût total: ~0.30-0.50 CHF par analyse complète
Prix utilisateur: 5-10 CHF (marge saine)
Pipeline simple (cas clair, pas d'adversarial): 4 appels, ~0.20 CHF

## Notre moat (objets structurés)

Ce que le LLM ne sait PAS et qu'on stocke en objets:
- canton_rule — spécificités cantonales par procédure
- amount_range — fourchettes jurisprudentielles sourcées
- proof_requirement — preuves à réunir par procédure
- anti_error — erreurs fatales avec conséquences
- practitioner_pattern — stratégies + signaux faibles
- authority_contact — autorité compétente + coordonnées par canton
- procedure_state — machine d'état de la procédure
- case_pattern — cas réels anonymisés avec résultats

## Vérification croisée

Un claim n'est "correct" que si:
- base légale applicable identifiée
- pas de contre-source non traitée
- conditions d'application marquées remplies ou manquantes
- délai et montant viennent de tables déterministes
- portée cantonale vérifiée
- inconnues décisives affichées

## Pourquoi un citoyen paie

Pas pour une réponse sourcée (ChatGPT fait ça gratuitement).
Pour un dossier contradictoire vérifié + un plan opérable lundi matin:
- le bon chemin procédural
- le vrai délai qui le menace
- le bon interlocuteur local
- la liste exacte des pièces
- la fourchette réaliste
- les erreurs à ne surtout pas faire
- ce qu'on ne sait pas encore
