# ARCHITECTURE — JusticePourtous.ch

## Principe fondateur
JusticePourtous n'est PAS une base documentaire. C'est un **moteur de décision traçable**.

Chaque affirmation est traçable. Chaque calcul est expliqué. Chaque limite est déclarée.

## Les 35 exigences (source: Codex, validé Robin 2026-04-07)

### Déjà couvert par les agents en cours
- [x] 1. Hiérarchie des sources (couche 1-2: Constitution > loi > ordonnance > TF > cantonal)
- [x] 3. Moteur d'applicabilité canton/situation (couche 3-8-10: données cantonales)
- [x] 7. Procédures comme machines d'état (couche 6-7-9: workflows moments de vie)
- [x] 11. Données manquantes (couche 6-7-9: calculateurs retournent "info manquante")
- [x] 13. Cartographie autorités (couche 3-8-10: annuaire complet)
- [x] 14. Jurisprudence en objets (jurisprudence-engine: 360 arrêts indexés)
- [x] 17. Prochain meilleur pas (couche 6-7-9: workflows avec étapes ordonnées)
- [x] 18. Sorties non contentieuses (couche 4-11: médiation, négociation, syndicat)
- [x] 19. Interactions entre domaines (couche 6-7-9: cascades)
- [x] 20. Publics vulnérables (tout le studio: Refugio, Habiter, DroitsRadar, Boussole)
- [x] 21. Modèles documentaires paramétriques (couche 4-11: templates avec placeholders)
- [x] 24. Calculateurs spécifiés et testés (couche 6-7-9: 10 calculateurs)
- [x] 32. Veille Fedlex (prévu dans CLAUDE.md: cron hebdomadaire SPARQL)

### À construire maintenant
- [ ] 2. Versionnage des règles (date entrée vigueur, modification, vérification)
- [ ] 4. Séparation contenu/logique/calculs/procédure/présentation
- [ ] 5. Traçabilité phrase par phrase avec source exacte
- [ ] 6. Niveaux de confiance : certain, probable, variable, incertain, non vérifié
- [ ] 8. Conditions de recevabilité encodées
- [ ] 9. Délais complets (computation, féries, suspension)
- [ ] 10. Exigences de preuve par procédure
- [ ] 12. Taxonomie unique (problème → autorité → acte → délai → risque → issue)
- [ ] 15. Patterns d'expérience praticien (stratégie, erreurs, signaux faibles)
- [ ] 16. Anti-erreurs fréquentes par domaine
- [ ] 22. Réseau relais humains avec escalade
- [ ] 23. Couche "ce qu'on ne sait pas"
- [ ] 25. Base de cas pratiques anonymisés
- [ ] 26. Recherche sémantique profane → qualification juridique
- [ ] 27. Validation multi-source structurée
- [ ] 28. Tests de non-régression juridiques
- [ ] 29. Benchmarks adversariaux
- [ ] 30. File d'incidents juridiques
- [ ] 31. Couverture mesurée par domaine/canton/langue
- [ ] 33. Journal d'explication interne
- [ ] 34. Policy refus/prudence/redirection
- [ ] 35. Définition "fiable" = traçable + auditable + borné + mis à jour + prudent

## Priorité d'implémentation

### Vague 1 (maintenant — agents en cours)
Couches 1-12 + moteur jurisprudence = la donnée brute

### Vague 2 (immédiat après)
- Niveaux de confiance (6)
- Traçabilité (5)
- Conditions recevabilité (8)
- Délais complets (9)
- Exigences preuve (10)
- Anti-erreurs (16)
- Taxonomie (12)

### Vague 3 (semaine prochaine)
- Patterns praticien (15)
- Cas pratiques (25)
- Recherche sémantique (26)
- Journal explication (33)
- Policy refus (34)

### Vague 4 (continu)
- Tests non-régression (28)
- Benchmarks adversariaux (29)
- Couverture mesurée (31)
- Veille industrialisée (32)
- Incidents (30)
