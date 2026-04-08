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

| Métrique | Seuil V1 |
|----------|----------|
| `claim_grounding_rate` | > 90% |
| `valid_citation_rate` | > 95% |
| `unsupported_assertion_rate` | < 5% |
| `contradiction_hit_rate` | > 80% (contradictions détectées) |
| `deterministic_deadline_rate` | 100% sur bail/travail/dettes |

## Références architecturales

- [Anthropic Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval)
- [Microsoft GraphRAG](https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/)
- [BMJ Best Practice — evidence process](https://bestpractice.bmj.com/info/us/evidence-based-2/)
- [OpenAI custom LLM-as-judge](https://developers.openai.com/cookbook/examples/custom-llm-as-a-judge)
