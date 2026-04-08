# Stratégie d'enrichissement — JusticePourtous

## Objectif
Tout savoir. Tout indexer. Tout retrouver au moment utile. Rien louper.
Cible : que les avocats eux-mêmes utilisent la plateforme.

## Principe : le graphe juridique suisse

Chaque entité est un nœud. Chaque relation est un lien typé. Le graphe permet de répondre à :
- "Quelles sont TOUTES les conséquences juridiques de X ?"
- "Quel article a été modifié par quelle révision ?"
- "Quel arrêt contredit quel autre ?"
- "Quelles procédures expirent dans les 10 prochains jours pour le canton Y ?"

### Entités (nœuds)
| Type | Source | Volume estimé | Priorité |
|------|--------|---------------|----------|
| Article de loi fédérale | Fedlex SPARQL | ~3000 articles pratiques | P1 |
| Article de loi cantonale | LexFind | ~5000 articles (26 cantons) | P2 |
| Arrêt TF | entscheidsuche.ch + HuggingFace | 116k+ arrêts | P1 |
| Arrêt cantonal | entscheidsuche.ch | ~500k arrêts | P3 |
| Fiche pratique | Rédaction interne | 500+ | P1 |
| Formulaire officiel | Sites cantonaux | ~200 | P2 |
| Barème/table | SVIT, OFS, OFAS, etc. | ~50 | P1 |
| Autorité/service | Annuaire fédéral + cantons | ~500 | P1 |
| Délai procédural | Extraction des lois | ~100 | P1 |
| Modèle de document | Rédaction interne | ~100 | P1 |

### Relations (liens)
- `article → arrêt` : "interprété par"
- `arrêt → arrêt` : "confirme / infirme / nuance"
- `article → article` : "modifié par / remplace / complète"
- `fiche → article` : "se fonde sur"
- `fiche → arrêt` : "illustré par"
- `procédure → délai` : "soumis à"
- `procédure → autorité` : "traitée par"
- `domaine → barème` : "chiffré par"

## Pipeline d'enrichissement

### Phase 1 : Ingestion automatique (semaine 1-2)

#### 1.1 Fedlex Harvester
```
Cron: 1x/semaine
Source: Fedlex SPARQL API
Action: 
  - Requête tous les RS (recueils systématiques) modifiés depuis dernier run
  - Parse XML → JSON structuré
  - Extrait: ref, titre, texte, date_entree_vigueur, date_modification
  - Index dans src/data/loi/
  - Détecte les CHANGEMENTS (diff avec version précédente)
  - Si changement → flag les fiches impactées pour review
```

#### 1.2 Jurisprudence Harvester  
```
Cron: 1x/semaine
Source: entscheidsuche.ch REST API
Action:
  - Fetch nouveaux arrêts TF depuis dernier run
  - Parse: signature, date, matière, résumé, principe
  - Lie automatiquement aux articles cités (regex sur "art. XX CO/LP/CC/etc.")
  - Index dans src/data/jurisprudence/
  - Si arrêt contredit jurisprudence existante → flag pour review humaine
```

#### 1.3 Barèmes & Tables Harvester
```
Cron: 1x/mois
Sources: OFS, SVIT, OFAS, SEM
Action:
  - Scrape les barèmes publics (loyers de référence, minimum vital, etc.)
  - Compare avec version en cache
  - Si changement → update + flag fiches impactées
```

### Phase 2 : Qualification automatique (semaine 3-4)

#### 2.1 Extraction de relations
Pour chaque arrêt TF indexé :
- Extraire tous les articles de loi cités (regex + NLP)
- Extraire les arrêts cités (regex sur "ATF xxx" et "arrêt xX_xxx/xxxx")
- Classer la relation : confirme / infirme / nuance / applique
- Stocker dans un index de relations

#### 2.2 Scoring de pertinence
Chaque arrêt reçoit un score basé sur :
- Nombre de citations par d'autres arrêts (PageRank juridique)
- Récence (arrêts récents > anciens pour même question)
- Publication au recueil officiel ATF (> non publié)
- Nombre de fois cité dans nos fiches

#### 2.3 Détection de lacunes
Script automatique qui vérifie :
- [ ] Chaque article cité dans une fiche → existe dans notre base loi
- [ ] Chaque arrêt cité → existe dans notre base jurisprudence
- [ ] Chaque canton mentionné → a des données dans notre annuaire
- [ ] Chaque procédure → a un délai documenté
- [ ] Chaque fiche → a au moins 1 cas pratique lié
- [ ] Chaque domaine × canton → couverture minimale

Output : rapport de couverture avec % par domaine/canton/type.

### Phase 3 : Enrichissement intelligent (continu)

#### 3.1 IA-assistée pour les fiches
Pour chaque nouvelle fiche ou fiche à mettre à jour :
1. LLM analyse le sujet
2. Fetch automatique des articles pertinents (Fedlex)
3. Fetch automatique de la jurisprudence pertinente (entscheidsuche)
4. Proposition de contenu avec sources tracées
5. **Review humaine obligatoire** avant publication
6. Niveau de confiance assigné

#### 3.2 Veille législative
- Fedlex RSS/SPARQL : détecter les nouvelles lois et modifications
- Chaque modification → impact analysis automatique sur nos fiches
- Notification si une fiche utilise un article modifié/abrogé
- Gestion des versions : chaque fiche conserve l'historique de ses sources

#### 3.3 Veille jurisprudentielle
- Nouveaux arrêts TF triés par domaine
- Si un arrêt touche un sujet couvert → proposition de mise à jour
- Si un arrêt CONTREDIT notre position → alerte critique

### Phase 4 : Qualité professionnelle (ce qui fait la différence)

#### 4.1 Système de confiance à 5 niveaux
| Niveau | Signification | Quand |
|--------|--------------|-------|
| Certain | Article de loi + jurisprudence constante | Base légale claire, TF s'est prononcé |
| Probable | Jurisprudence majoritaire ou doctrine | Tendance claire mais pas unanime |
| Variable | Dépend du canton/juge/circonstances | Marge d'appréciation importante |
| Incertain | Peu de jurisprudence, question ouverte | Sujet nouveau ou controversé |
| Non vérifié | Source unique ou non validée | À confirmer par un professionnel |

#### 4.2 Traçabilité totale
Chaque affirmation dans une fiche est liée à :
- L'article de loi source (avec lien Fedlex)
- L'arrêt TF source (avec lien entscheidsuche)
- La date de dernière vérification
- Le niveau de confiance

Format : `"Le délai est de 30 jours [CO 273 al. 1, ATF 142 III 91]" {confiance: certain, vérifié: 2026-04-07}`

#### 4.3 Ce qu'on ne sait pas
Pour chaque fiche, section explicite :
- "Cette fiche ne couvre PAS : [X, Y, Z]"
- "Les cantons suivants ont des règles spécifiques non encore documentées : [...]"
- "La jurisprudence est contradictoire sur : [...]"
- "Un projet de loi en cours pourrait modifier : [...]"

#### 4.4 Tests de non-régression juridique
```
Pour chaque domaine :
  - 10 cas test avec résultat attendu connu
  - Si une mise à jour change le résultat → alerte
  - Review obligatoire avant déploiement
```

## Métriques de couverture

Dashboard temps réel :
```
Bail:       ████████████████████ 95% (28/30 sous-thèmes, 9/9 cantons rom.)
Travail:    ██████████████████░░ 90% (27/30 sous-thèmes)
Famille:    ████████████████░░░░ 80% (24/30 sous-thèmes)
Dettes:     ██████████████████░░ 90% (27/30 sous-thèmes)
Étrangers:  ██████████████░░░░░░ 70% (21/30 sous-thèmes)

Articles indexés:  170/3000 (6%) → objectif 80% à 3 mois
Arrêts indexés:    360/116k (0.3%) → objectif 5000 à 3 mois
Cantons couverts:  9/26 → objectif 13 (romands + ZH/BE/BS) à 1 mois
Templates:         50 → objectif 200 à 2 mois
```

## Ce qui nous différencie des outils d'avocats

| Aspect | Outils avocats (Swisslex, Lawsearch) | JusticePourtous |
|--------|--------------------------------------|-----------------|
| Cible | Professionnels du droit | Citoyens + professionnels |
| Langue | Jargon juridique | Langage clair + jargon disponible |
| Action | "Voici l'article" | "Voici quoi faire lundi" |
| Confiance | Implicite (l'avocat évalue) | Explicite (5 niveaux affichés) |
| Anti-erreurs | Aucun | "Ne faites surtout PAS ça" |
| Coût | 200-500 CHF/mois | Gratuit (base) / 50 CHF (premium) |
| Patterns | Non structurés | "Un bon avocat ferait ça" |
| Cas pratiques | Non (secret professionnel) | Anonymisés et structurés |
| API | Non | Oui (pour associations, assurances PJ) |

## Prochaines actions

1. **Maintenant** : Finir les 35 exigences Codex (24/35 en cours)
2. **Cette semaine** : Fedlex Harvester + entscheidsuche Harvester
3. **Semaine prochaine** : Détection de lacunes + rapport couverture
4. **Mois 1** : 500 fiches, 5000 arrêts, 13 cantons
5. **Mois 2** : API pro, tests non-régression, veille automatisée
6. **Mois 3** : Pilote avec 3 études d'avocats romands
