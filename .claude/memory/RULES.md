---
name: Rules — style Robin + règles techniques persistantes JusticePourtous
description: Comportement attendu de Claude (autonomie, pace, anti-bloat) + règles techniques spécifiques au projet
type: feedback
scope: projet
status: active
review_after: 2026-12-31
---
# RULES — JusticePourtous

## Style de travail

### Mode autonome
Robin veut que Claude continue de manière autonome tant qu'il y a du travail pertinent. Pas de pauses "on continue ?". S'arrêter uniquement si une décision métier structurante est nécessaire.
**Why:** Robin fait confiance au jugement de Claude et utilise ses propres agents en parallèle.
**How to apply:** Après chaque commit, enchaîner directement sur le prochain lot. Ne pas demander confirmation pour avancer.

### Style dynamique — toujours motivé
Ne jamais dire "il est tard", "on continue demain ?", ou suggérer d'arrêter. Robin décide seul quand il s'arrête.
**Why:** Robin l'a explicitement demandé — suggérer une pause = condescendant et inutile.
**How to apply:** Ne jamais proposer d'arrêter ou reporter. Toujours proposer la suite / prochaine action.

### Rythme — réfléchir avant d'agir
Avant chaque action : analyser l'état complet → identifier problèmes vs symptômes → plan cohérent → exécuter.
**How to apply:** Diagnostic complet AVANT action. Ne pas relancer une opération qui a échoué sans comprendre POURQUOI. Pas de sleep/attendre en boucle.

### Token efficiency
Pas de gaspillage — Robin paie les tokens et voit quand le travail tourne en rond.
**How to apply:**
- Lire UNE FOIS, pas chercher à chaque fois.
- Pas de verbose inutile — résultat direct, pas de narration.
- Pas de redécouverte — déjà investigué = directement au fix.
- 3e fois qu'on check la même chose = red flag.

### No polling avec sleep
Ne jamais faire `sleep N && check output` pour surveiller un batch background. Le système notifie quand la tâche se termine.

### Organisation mémoire — pas de fichiers éparpillés
Regrouper par THEME, pas par date. Un fichier par domaine. Avant de créer : chercher si un fichier existant peut accueillir l'info. Voir [[feedback_memory_hygiene]] dans l'auto-memory pour les règles d'archivage.

## Règles techniques

<!-- À compléter par session-après-session. Sections typiques :
### Backend
### Frontend
### Données / Schema
### Tests & CI
-->

## Sécurité opérationnelle

<!-- À compléter selon le contexte. Sections typiques :
### Deploy
### SSH safety (si VPS)
### Secrets management
-->

## Anti-patterns

<!-- À compléter au fur et à mesure que des erreurs sont identifiées. -->
