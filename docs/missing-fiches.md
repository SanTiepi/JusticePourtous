# Fiches manquantes (identifiées par l'éval adversarial)

Cette liste est maintenue par le runner `scripts/run-adversarial-eval-llm.mjs`.
Chaque entrée correspond à un cas adversarial pour lequel le LLM navigator a
trouvé le bon domaine mais s'est rabattu sur une fiche voisine faute de
correspondance exacte.

Ces fiches sont à créer après validation juridique humaine.

## État actuel : 11 gaps identifiés (mis à jour 2026-06-09)

Les deux gaps historiques sont comblés :

- ✅ `bail_restitution_anticipee` (CO 264) — créée + `claude_review_date: 2026-04-19`
- ✅ `travail_discrimination_salariale` (LEg 3 / LEg 5 / Cst 8 al. 3) — créée + `claude_review_date: 2026-04-19`

### Gap détecté par l'éval CLI 2026-05-29 (mesure 40 cas — score global 98%)

- ⛔ `circulation_retrait_permis`
  - **base juridique** : LCR 16, LCR 16b (infraction légère), LCR 16c (infraction grave — récidive), LCR 16a (retrait d'emblée)
  - **pourquoi manquante** : `adv_circulation_01` (feu rouge, récidive, office des automobiles) — le navigator trouve `circulation_amende_ordre` (LCR 6 / LAO 1 / LCR 90) au lieu d'une fiche dédiée au **retrait administratif de permis** (LCR 16/16b/16c). La fiche amende d'ordre traite les amendes pénales, pas le retrait administratif par l'office des automobiles.
  - **priorité** : haute. La distinction amende pénale / retrait administratif est fondamentale (procédures, délais, instances totalement différents). Cas fréquent chez les citoyens récidivistes.

### Gaps détectés par l'éval CLI 2026-05-28 (extension 20→30 cas)

- ⛔ `dettes_cautionnement_personnel`
  - **base juridique** : CO 492 (cautionnement), CO 493 (forme), CO 509 (durée), LP 38 (recouvrement)
  - **pourquoi manquante** : `adv_dettes_06` (signature comme garant pour un prêt voiture, débiteur disparu) — le navigator ne retourne aucune fiche pertinente. Aucune fiche couvrant les obligations du caution personnel.
  - **priorité** : moyenne. Le cautionnement personnel est un piège fréquent (garantie souscrite pour un proche).

- ⛔ `bail_trouble_voisinage_locataire`
  - **base juridique** : CO 257f (usage de la chose conformément au contrat), CO 259a/d (défauts imputables au bailleur), éventuellement CC 684 (troubles de voisinage côté civil)
  - **pourquoi manquante** : `adv_bail_07` (voisin bruyant, régie inactive) — le navigator retourne `voisinage_bruit_nuisances` (droit du voisinage côté civil) au lieu d'une fiche bail expliquant les droits du locataire contre la régie inactive (réduction de loyer, congé extraordinaire).
  - **priorité** : haute. Cas fréquent où le locataire ne sait pas qu'il a un recours contre le bailleur (et pas seulement contre le voisin direct).

### Gap détecté par l'éval adversariale 2026-05-30 (wave 4 — 40→50 cas)

- ⛔ `assurance_chomage_demission_juste_motif`
  - **base juridique** : LACI 30 (suspension pour abandon d'emploi sans juste motif — avec exception si juste motif documenté), LACI 17 (obligations du chômeur)
  - **pourquoi manquante** : `adv_social_02` (démission pour harcèlement documenté, suspension chômage 5 semaines) — le navigator route vers `travail_harcelement` + `assurance_chomage_indemnites_conditions` + `travail_assurance_chomage` mais **aucune fiche ne couvre l'exception "juste motif" à la suspension LACI 30**. Les fiches existantes couvrent les conditions générales (LACI 8/13/27) mais pas la procédure de contestation de la suspension pour démission motivée. La distinction est fondamentale : une démission pour harcèlement documenté peut être défendue via l'exception LACI 30 al. 1 lit. a.
  - **observation taxonomique** : JusticePourtous classe chômage/AI dans domaine `assurances` (pas `social`). Cas `adv_social_01/02/03` et `adv_assurances_01` corrects après correction `expected_domaine` (ground-truth fixes).
  - **priorité** : haute. Cas fréquent (burn-out, harcèlement → démission → suspension chômage injuste). Sans fiche dédiée, le citoyen n'apprend pas qu'il peut contester la suspension.

### Gap détecté par la batterie de tests live 2026-05-29 (couverture 15 domaines)

- ⛔ `assurance_privee_refus_prestation` (assurance ménage / RC privée / casco hors circulation)
  - **base juridique (indicative, à valider par un juriste)** : LCA (loi sur le contrat d'assurance) — notamment avis de sinistre, obligation de réduire le dommage, prescription 2 ans ; conditions générales d'assurance (CGA).
  - **pourquoi manquante** : test live « mon assurance refuse de payer après un dégât des eaux qui a ruiné mon salon » → le navigator route vers `consommation_remboursement_refuse` (remboursement générique). Le domaine `assurances` ne contient que de l'**assurance sociale** (LAA/AI/AVS/LAMal/chômage) ; aucune fiche pour l'**assurance privée de chose/responsabilité** (ménage, RC, dégâts des eaux). Le fallback conso est raisonnable faute de mieux, mais sous-optimal pour l'usager.
  - **priorité** : moyenne-haute. Sinistre ménage/RC refusé = situation courante chez les particuliers ; aucune couverture actuelle.

### Gap (routing) détecté par l'éval adversariale 2026-05-30 (wave 5 — 50→60 cas)

- ⛔ `successions_famille_recomposee_routing`
  - **type** : routing gap (pas de fiche manquante — fiches successions existent)
  - **base juridique** : CC 457 (ordre succession légale), CC 462 (quote-part légale conjoint), CC 471 (réserve héréditaire descendants)
  - **pourquoi manquant** : `adv_successions_02` (père décédé remarié, partage entre enfants 1er mariage + veuve) — le navigator inclut `famille_regime_matrimonial` (CC 196/215 régime biens) dans les fiches retournées, à cause du contexte "remariage". Le domaine inféré devient `famille` au lieu de `successions`. Les fiches successions pertinentes (`successions_conjoint_survivant`, `successions_heritier_reserve`) sont bien identifiées mais avec des IDs légèrement incorrects (haiku génère `succession_reserve_conjoint_vs_enfants` sans le préfixe `successions_`).
  - **impact** : un citoyen qui pose une question de succession en mentionnant "il était remarié" risque d'obtenir des informations sur les régimes matrimoniaux plutôt que sur le partage successoral. La distinction est importante : le régime matrimonial détermine la masse successorale, la succession détermine le partage.
  - **solution recommandée** : ajout de tokens discriminants dans le prompt du navigator pour prioriser `successions` dès que les mots "décédé/décès/héritage/partage" sont présents, même en contexte famille recomposée.
  - **priorité** : moyenne. Les fiches successions existent et sont identifiées partiellement. Le routing est améliorable sans créer de nouvelle fiche.

### Gap détecté par l'éval adversariale 2026-05-30 (wave 6 éval — 70 cas, score 96%)

- ⛔ `fiscal_taxation_office`
  - **base juridique** : LIFD 130 (taxation ordinaire), LIFD 132 (réclamation — délai 30 jours péremptoire dès notification), LIFD 133 (retrait de réclamation), LIFD 147/148 (recours)
  - **pourquoi manquante** : `adv_fiscal_01` (taxation d'office impôts 2024 montant 3× trop élevé, délai 30 jours) — le navigator retourne `domaines=[]` `fiches=[]` : **le domaine `fiscal` n'est pas reconnu du tout** pour ce vocabulaire citoyen. Mots-clés "taxation d'office", "impôts", "montant 3 fois supérieur" ne déclenchent aucun routing vers le domaine `fiscal`. Le score est 0% (domaine, articles et fiches tous manquants).
  - **observation** : le domaine `fiscal` est en `readiness: beta` avec 0 fiche dans le corpus courant (ou fiches non indexées). C'est un blind spot complet : la taxation d'office est une situation critique avec un délai de réclamation péremptoire de 30 jours (LIFD 132). Un citoyen qui rate ce délai perd définitivement son droit de contester.
  - **priorité** : **critique**. Délai péremptoire 30 jours. Situation fréquente (déclaration non déposée ou tardive). Domaine fiscal entier non reconnu = fail systématique sur tous les cas fiscaux.

### Gaps persistants identifiés par analyse 60 cas (2026-05-30)

- ⛔ `successions_ab_intestat`
  - **base juridique** : CC 457 (ordre de succession légale : descendants → ascendants → collatéraux), CC 458 (substitution par stirpes), CC 462 (quote-part légale du conjoint survivant)
  - **pourquoi manquante** : `adv_famille_04` (père décédé sans testament, belle-mère prétend avoir droit à tout) — fail persistant 63% sur rubric `article_required`. Aucune des 20 fiches successions ne cite CC 457 ni CC 458 (vérification machine : 2026-05-30). Les fiches existantes couvrent les réserves (CC 470/471), le conjoint survivant (CC 462), les testaments (CC 467/477/479) — mais pas le régime général de **succession ab intestat** (qui hérite quoi en l'absence de testament). Le LLM génère systématiquement des IDs fictifs (`successions_ab_intestat`, `successions_ordre_legal`) absents du ficheIndex → lookup échoue → zéro article cité → article_required = false.
  - **priorité** : haute. Situation extrêmement courante (majorité des successions en Suisse sont ab intestat). Sans cette fiche, le citoyen qui demande "mon parent est mort sans testament, comment ça se répartit ?" n'obtient pas de réponse sur l'ordre légal CC 457.

- ⛔ `etranger_permis_b_perte_emploi`
  - **base juridique** : LEI 61 (extinction du titre de séjour : non-renouvellement, départ définitif), LEI 33 (conditions de renouvellement liées à l'activité lucrative), OASA 77a/77b (tolérance pendant période de recherche d'emploi, délai 6 mois), LEI 62 (retrait du titre de séjour)
  - **pourquoi manquante** : `adv_etrangers_01` (permis B depuis 11 ans, boîte fermée, peut-il rester ?) — fail persistant 63% sur rubric `article_required`. La fiche `etranger_permis_b_renouvellement` cite bien LEI 33 et LEI 62, mais ses tags (`renouvellement`, `refus`, `conditions`) ne signalent pas le scénario "licenciement / fermeture d'entreprise". LEI 61 (extinction automatique du titre par non-renouvellement) n'est citée par aucune fiche (vérification machine : 2026-05-30). Le LLM génère des IDs fictifs (`etranger_permis_b_chomage`, `etranger_sejour_perte_emploi`) → lookup échoue. La fiche manquante devrait couvrir : quand le permis B est-il en danger après perte d'emploi ? (LEI 61 + délai OASA 77b + exception 10 ans de séjour menant au permis C LEI 43).
  - **priorité** : haute. Licenciement économique / fermeture d'entreprise = enjeu majeur (perte potentielle de séjour). Situation cross-domaine travail + étrangers fréquemment mal comprise.

### Gaps identifiés par l'éval adversariale 2026-06-09 (wave 8 — 90 cas, score 91% brut → ~95% après corrections specs)

- ⛔ `sante_urgence_libre_choix`
  - **base juridique** : LAMal 41 al. 3 (en urgence, l'assuré peut se faire soigner par tout fournisseur, peu importe son assureur), OAMal 29 (prestations d'urgence), LPMéd 40 (obligation de traiter)
  - **pourquoi manquante** : `adv_sante_03` (urgences hôpital refusent de soigner car assureur non partenaire, dimanche soir) — le navigator route vers `sante_refus_nouveau_patient` (refus d'accepter un nouveau patient en médecine de cabinet) + `social_aide_urgence`. Articles retournés : CO 394, CP 128, Cst 10 al. 2 — aucun ne couvre **LAMal 41 al. 3 (libre choix du fournisseur en urgence)**. La distinction est fondamentale : le médecin de cabinet peut refuser un nouveau patient (sauf urgence), mais un hôpital cantonal ne peut pas refuser une urgence réelle.
  - **priorité** : haute. Situation vécue fréquemment les week-ends et nuits. Un citoyen à qui l'hôpital refuse les soins doit savoir qu'il a un droit légal immédiat (LAMal 41 al. 3) et un recours contre l'hôpital. Délai implicite = immédiat.

- ⛔ `entreprise_gerant_responsabilite_penale`
  - **base juridique** : CP 138 (abus de confiance), CO 827 (responsabilité du gérant SARL par renvoi à CO 717 — diligence du mandataire), CO 803 (obligations des associés SARL), LP 38 (recouvrement de la créance)
  - **pourquoi manquante** : `adv_entreprise_04` (co-fondateur SARL découvre associé-gérant qui se verse 40k CHF d'avances fictives depuis 2 ans) — le navigator route vers `entreprise_conflit_associes_sarl` + `entreprise_creances_impayees_recouvrement`. Articles retournés : CO 798, CO 808, CO 822, CO 823 (droit des associés SARL) — aucun ne couvre CP 138 (abus de confiance, voie pénale) ni CO 827/717 (responsabilité civile du gérant). La fiche existante `entreprise_conflit_associes_sarl` couvre les conflits de gouvernance interne mais pas le **volet pénal (dépôt de plainte CP 138) ni la responsabilité civile du gérant** (distinct de la responsabilité de l'associé).
  - **priorité** : haute. Le scénario "associé/gérant qui se sert dans la caisse" est un cas de justice d'entreprise fréquent. L'absence de voie pénale dans la réponse peut faire perdre un droit important (dépôt de plainte dans le délai de prescription CP 97).

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
