# /closed-world-opinion — Analyse juridique en univers fermé

## Principe
Charger TOUT le contexte pertinent dans le prompt, puis raisonner UNIQUEMENT dessus.
Aucune connaissance externe. Si le dossier est insuffisant → INSUFFICIENT.

## Déclenchement
Appelé par le pipeline V3 premium, ou manuellement pour tester une analyse.

## Input
- texte: description du problème par le citoyen
- canton: code canton (VD, GE, etc.)
- reponses: réponses aux questions préalables (optionnel)

## Protocole

### 1. Assembler le dossier (code, pas LLM)
Pour chaque issue identifiée, charger :
- A. Faits bruts extraits du texte
- B. Articles de loi complets (pas juste la ref — le TEXTE)
- C. Arrêts TF FAVORABLES à la thèse du citoyen
- D. Arrêts TF DÉFAVORABLES (contraires, exceptions)
- E. Anti-erreurs du domaine
- F. Patterns praticien (stratégie optimale, signaux faibles)
- G. Délais avec computation et conséquences
- H. Preuves requises et charge de la preuve
- I. Contacts cantonaux
- J. Cas pratiques similaires avec résultats
- K. Incertitudes connues

### 2. Raisonner (LLM, prompt 7 blocs)
```
[ROLE] Juriste senior suisse. Univers fermé: UNIQUEMENT le dossier.
[MISSION] Opinion exploitable: conclusion + base légale + contre-arguments + risques + prochaines actions.
[DOSSIER] Sections A-K ci-dessus.
[PROTOCOLE]
  1. Construis la carte des questions juridiques
  2. Matrice faits → règles → preuves
  3. Forme 2 THÈSES RIVALES plausibles
  4. Cherche exceptions, conflits, limites, délais, recevabilité
  5. Tente de DÉTRUIRE ta conclusion provisoire
  6. Rédige SEULEMENT après ce test hostile
[GARDE-FOUS]
  - Sépare: fait prouvé / hypothèse / inférence
  - Cite chaque affirmation avec source_id exact
  - Si 2 sources se contredisent → explicite la hiérarchie
  - N'invente aucun fait ni aucune pièce
  - Signale les zones dangereusement simplificatrices
[FORMAT]
  A. Réponse courte citoyen (5 lignes max)
  B. Opinion détaillée
  C. Tableau: affirmation | source | force | contre-source | preuve manquante
  D. 5 questions à poser
  E. 3 attaques d'un avocat adverse
  F. Confiance par bloc
[CRITÈRE] Acceptable seulement si résiste à la meilleure objection du dossier.
```

### 3. Vérifier (second modèle)
Le second modèle reçoit le dossier + l'opinion et agit en PROCUREUR:
- Attaque chaque claim
- Cherche les sources contraires DANS le dossier
- Identifie les conditions oubliées
- Flag les variations cantonales

### 4. Compiler (code, pas LLM)
- Délais exacts depuis tables
- Autorité compétente depuis annuaire cantonal
- Documents requis depuis preuves
- Fourchettes depuis jurisprudence
- Contacts depuis escalade

## Output
```json
{
  "verification_status": "verified|degraded|insufficient",
  "reponse_citoyen": "5 lignes max",
  "opinion": { "issues": [...], "claims": [...] },
  "tableau_sources": [...],
  "questions_client": [...],
  "attaques_adverses": [...],
  "confiance_par_bloc": {...},
  "delais_critiques": [...],
  "documents_requis": [...],
  "contacts": [...],
  "erreurs_fatales": [...],
  "ce_quon_ne_sait_pas": [...]
}
```
