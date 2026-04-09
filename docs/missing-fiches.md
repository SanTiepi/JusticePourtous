# Fiches manquantes (identifiées par l'éval adversarial)

Cette liste est maintenue par le runner `scripts/run-adversarial-eval-llm.mjs`.
Chaque entrée correspond à un cas adversarial pour lequel le LLM navigator a
trouvé le bon domaine mais s'est rabattu sur une fiche voisine faute de
correspondance exacte.

Ces fiches sont à créer après validation juridique humaine.

## bail

### `bail_restitution_anticipee`

- **Base légale clé** : CO 264
- **Situation** : Le locataire doit partir avant la fin du bail (job, maladie, divorce). Il peut se libérer de son obligation de payer le loyer s'il propose un locataire de remplacement solvable, acceptable et prêt à reprendre le bail aux mêmes conditions.
- **Points juridiques à couvrir** :
  - Conditions CO 264 al. 1 (solvabilité, acceptabilité, mêmes conditions)
  - Délai raisonnable de réponse du bailleur
  - Refus abusif du bailleur
  - Charge de la preuve
  - Alternative : résiliation ordinaire avec respect des délais
- **Cas adversarial associé** : `adv_bail_04`
- **Impact sur l'éval** : -3% global

## travail

### `travail_discrimination_salariale`

- **Base légale clé** : LEg 3, LEg 5, Cst 8 al. 3
- **Situation** : Un-e employé-e constate un écart salarial avec un-e collègue de l'autre sexe pour un travail de valeur égale.
- **Points juridiques à couvrir** :
  - Interdiction de la discrimination directe/indirecte (LEg 3)
  - Procédures et fardeau de la preuve allégé (LEg 6)
  - Action du tribunal des prud'hommes (LEg 5)
  - Analyse salariale obligatoire employeurs 100+ (LEg 13a ss)
  - Protection contre le congé de représailles
  - Délais de prescription
- **Cas adversarial associé** : `adv_travail_04`
- **Impact sur l'éval** : -3% global

---

## Process d'ajout

1. Validation juridique par un juriste (ou à défaut, recherche de la fiche équivalente chez ASLOCA / guidesocial.ch / ch.ch).
2. Créer la fiche dans `src/data/fiches/<domaine>.json`.
3. Lier les articles via `src/data/articles/*.json` (ajouter au mapping graph).
4. Rerun `node scripts/run-adversarial-eval-llm.mjs` pour confirmer score à 100%.
5. Le cas adversarial devient alors non-discriminant — ajouter un nouveau cas à sa place dans `test/adversarial-cases.mjs` pour maintenir la pression.
