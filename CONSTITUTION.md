# CONSTITUTION — JusticePourtous

Document canonique. Prime sur tous les autres docs du repo.
Relu avant chaque gros chantier. Tranche les désaccords.

## Doctrine

**On n'optimise pas pour "tout indexer". On optimise pour produire des claims vérifiés, traçables, prudents et opérables.**

Le moteur doit ressembler à un BMJ du droit suisse pratique, pas à un chatbot juridique.

## Décisions non négociables

### Unité d'inférence
L'unité est le `verified_claim`, pas la fiche. Un claim sans `source_id` valide est rejeté.

### Runtime principal
3 étapes : Comprendre (LLM) → Dossier (code) → Raisonner+Vérifier (LLM).
Le pipeline 8 étapes est la doctrine qualité/audit, pas le chemin par défaut.

### Mode par défaut = prudent
Si contradiction, manque de source, ou doute sérieux → `limited`, `conflicted`, ou `insufficient`. Jamais une phrase ferme sur un point disputé.

### Domaines V1
Bail, travail, dettes. Pas les 10. Faire 3 domaines parfaitement.

### Sortie V1
Réponse + preuves. Pas le dossier brut complet.

### Eval avant volume
Interdiction d'ajouter du contenu tant que les métriques de qualité ne sont pas mesurées. La bonne séquence :
1. Eval et groundedness
2. Source registry
3. Objectification
4. Retrieval hybride
5. Freshness / impact analysis
6. Extension de couverture

## Sources — 3 tiers

| Tier | Type | Exemples | Force |
|------|------|----------|-------|
| 1 | Officiel contraignant | Fedlex (lois), ATF publiés, ordonnances | Décisif |
| 2 | Quasi-officiel | Arrêts TF non publiés, directives OFAS/SEM, messages CF | Analogique |
| 3 | Pratique structurée | Patterns praticien, anti-erreurs, cas anonymisés, barèmes SVIT | Indicatif |

Chaque source a : `source_id`, `tier`, `date`, `périmètre`, `statut_validité`.

## Objets gelés

### Données structurées (le moat)
- `norm_fragment` — article de loi avec texte, refs, validité
- `decision_holding` — arrêt avec principe, fourchette, rôle (favorable/défavorable)
- `proof_requirement` — preuves par procédure + charge de la preuve
- `procedure_deadline` — délai + computation + féries + conséquence
- `amount_range` — fourchette sourcée
- `anti_error` — erreur + gravité + conséquence + correction
- `practitioner_pattern` — stratégie + signaux faibles + neJamaisFaire
- `authority_contact` — autorité + canton + coordonnées
- `coverage_gap` — ce qu'on ne couvre pas explicitement
- `verified_claim` — affirmation + source_ids + statut + conditions

### Grammaire d'évidence
- `binding_strength` : decisif / analogique / indicatif / obsolete
- `certainty` : certain / probable / variable / incertain / insufficient
- `verification_status` : verified / degraded / insufficient
- `freshness_status` : current / stale / unknown

## Checklist dossier-builder (obligatoire par issue)

Chaque issue dans le dossier DOIT vérifier :
- [ ] Base légale
- [ ] Jurisprudence utile (pro ET contra)
- [ ] Contradiction connue
- [ ] Recevabilité
- [ ] Délai
- [ ] Preuve requise
- [ ] Autorité compétente
- [ ] Formulaire
- [ ] Coût / fourchette
- [ ] Anti-erreur
- [ ] Pattern praticien
- [ ] Contact local
- [ ] Cas pratique
- [ ] Fraîcheur des sources

## Contrat réponses premium V3

- Chaque claim affiché porte au moins un `source_id` valide
- Délais, montants, autorités, pièces, contacts = déterministes (code, pas LLM)
- Toute inconnue décisive est affichée
- Toute contradiction significative → `limited` / `conflicted` / `insufficient`

## Protocole de désaccord Codex ↔ Claude

1. Divergence stratégie → ce document tranche
2. Divergence réponse → qualité de l'évidence tranche
3. Divergence données → source la plus contraignante et récente
4. Non résolu → afficher l'incertitude, ne pas choisir arbitrairement

## Métriques de validation (avant tout enrichissement)

| Métrique | Seuil |
|----------|-------|
| `claim_grounding_rate` | > 90% |
| `valid_citation_rate` | > 95% |
| `unsupported_assertion_rate` | < 5% |
| `contradiction_hit_rate` | > 80% (contradictions détectées) |
| `deterministic_deadline_rate` | 100% sur tout domaine V3 complet |

## Positionnement produit — formulation verrouillée

**Formulation autorisée** : "JusticePourtous réduit le besoin de consulter un avocat payant sur les cas citoyens standardisés."

**Formulation INTERDITE** : "Nous sommes meilleurs qu'un avocat" (globalement). Le produit est supérieur sur 5 tâches bornées seulement (triage, exhaustivité contradictoire, traçabilité, coût, suivi opérationnel). Il reste inférieur sur représentation, stratégie fine, négociation complexe, plaidoirie.

## Scorecard hebdomadaire (roadmap durcie)

Piloter les 5 axes suivants chaque semaine. Aucun chantier nouveau tant que les seuils du domaine ne sont pas atteints.

### Coverage
- `% top intents couverts par domaine` (mesuré via `intents-catalog.json` `etat_couverture`)
- `% fiches avec cascade structurée`
- `% domaines × cantons prioritaires avec autorités + formulaires`

### Correctness
- `claim_grounding_rate > 95%` (cible durcie)
- `unsupported_assertion_rate < 2%`
- `deadline_accuracy = 100%` sur golden cases + invariants régression
- `contradiction_hit_rate > 85%`
- `% réponses downgradées correctement` en `limited/conflicted/insufficient`

### Freshness
- `Tier 1 freshness SLA < 7 jours` (via fedlex-diff cron)
- `% fiches avec last_verified_at affiché`
- `% fiches impactées revues < 72h après diff Fedlex`

### Operability
- `temps vers première action < 60s`
- `% cas avec next step exécutable` (cascade OR template)
- `% escalades humaines pertinentes`

### Trust
- `% réponses avec audit trail téléchargeable`
- `safety recall` sur signaux critiques (detresse/violence/menace)
- `% sorties avec disclaimer + limites visibles`

## Gates de sortie (gate-based, non calendrier)

### Gate Domaine (avant toute annonce publique du domaine)
- [ ] Top intents du domaine couverts (état ≥ partial sur tous les `must_have`)
- [ ] 0 erreur critique sur délais/montants du golden set
- [ ] Review humaine juridique terminée sur flows principaux
- [ ] Badge freshness actif

### Gate Canton
- [ ] Autorités + formulaires + délais + liens officiels complets

### Gate Action (workflow sortant)
- [ ] `coverage certificate` sans fail critique
- [ ] Audit trail exportable
- [ ] Fallback avocat/permanence visible

### Gate Go-Live
- [ ] LLM-judge sur 100% des sorties publiques
- [ ] Monitoring continu + rollback possible

**Règle d'or** : aucun nouveau domaine, canton ou workflow sortant n'est annoncé tant que les gates ci-dessus ne sont pas explicitement validés par un commit de constat.

## Références architecturales

- [Anthropic Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)
- [Microsoft GraphRAG](https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/)
- [BMJ Best Practice — evidence process](https://bestpractice.bmj.com/info/us/evidence-based-2/)
- [OpenAI custom LLM-as-judge](https://developers.openai.com/cookbook/examples/custom-llm-as-a-judge)
