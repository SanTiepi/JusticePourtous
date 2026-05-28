# Fiches manquantes (identifiées par l'éval adversarial)

Cette liste est maintenue par le runner `scripts/run-adversarial-eval-llm.mjs`.
Chaque entrée correspond à un cas adversarial pour lequel le LLM navigator a
trouvé le bon domaine mais s'est rabattu sur une fiche voisine faute de
correspondance exacte.

Ces fiches sont à créer après validation juridique humaine.

## État actuel : 2 gaps identifiés via le harness 30-cas (mis à jour 2026-05-28)

Les deux gaps historiques sont comblés :

- ✅ `bail_restitution_anticipee` (CO 264) — créée + `claude_review_date: 2026-04-19`
- ✅ `travail_discrimination_salariale` (LEg 3 / LEg 5 / Cst 8 al. 3) — créée + `claude_review_date: 2026-04-19`

### Gaps détectés par l'éval CLI 2026-05-28 (extension 20→30 cas)

- ⛔ `dettes_cautionnement_personnel`
  - **base juridique** : CO 492 (cautionnement), CO 493 (forme), CO 509 (durée), LP 38 (recouvrement)
  - **pourquoi manquante** : `adv_dettes_06` (signature comme garant pour un prêt voiture, débiteur disparu) — le navigator ne retourne aucune fiche pertinente. Aucune fiche couvrant les obligations du caution personnel.
  - **priorité** : moyenne. Le cautionnement personnel est un piège fréquent (garantie souscrite pour un proche).

- ⛔ `bail_trouble_voisinage_locataire`
  - **base juridique** : CO 257f (usage de la chose conformément au contrat), CO 259a/d (défauts imputables au bailleur), éventuellement CC 684 (troubles de voisinage côté civil)
  - **pourquoi manquante** : `adv_bail_07` (voisin bruyant, régie inactive) — le navigator retourne `voisinage_bruit_nuisances` (droit du voisinage côté civil) au lieu d'une fiche bail expliquant les droits du locataire contre la régie inactive (réduction de loyer, congé extraordinaire).
  - **priorité** : haute. Cas fréquent où le locataire ne sait pas qu'il a un recours contre le bailleur (et pas seulement contre le voisin direct).

Pour rouvrir cette liste, relancer l'éval adversariale et capturer les nouveaux
cas où le navigator se rabat sur une fiche voisine :

```bash
node scripts/run-adversarial-eval-llm.mjs
```

## Process d'ajout (quand de nouveaux gaps émergent)

1. Validation juridique par un juriste (ou à défaut, recherche de la fiche équivalente chez ASLOCA / guidesocial.ch / ch.ch).
2. Créer la fiche dans `src/data/fiches/<domaine>.json` avec le schema strict (cf. `validateFiche` dans `src/services/fiche-schema.mjs`).
3. Lier les articles via `src/data/articles/*.json` (ajouter au mapping graph).
4. Marquer `claude_review_date: <ISO date>` une fois la checklist structurelle passée (cf. `audit-fiches-schema.mjs`).
5. Rerun `node scripts/run-adversarial-eval-llm.mjs` pour confirmer score à 100%.
6. Le cas adversarial devient alors non-discriminant — ajouter un nouveau cas à sa place dans `test/adversarial-cases.mjs` pour maintenir la pression.
