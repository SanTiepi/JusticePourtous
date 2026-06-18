# Fiches manquantes (identifiées par l'éval adversarial)

Cette liste est maintenue par le runner `scripts/run-adversarial-eval-llm.mjs`.
Chaque entrée correspond à un cas adversarial pour lequel le LLM navigator a
trouvé le bon domaine mais s'est rabattu sur une fiche voisine faute de
correspondance exacte.

Ces fiches sont à créer après validation juridique humaine.

## État actuel : 24 gaps identifiés (mis à jour 2026-06-18)

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

### Gaps identifiés par l'éval adversariale 2026-06-10 (wave 9 — 90→100 cas, score 93%)

- ⛔ `famille_pension_enfant_majeur`
  - **base juridique** : CC 277 al. 2 (obligation d'entretien de l'enfant majeur encore en formation), CC 285 (étendue de la contribution d'entretien)
  - **pourquoi manquante** : `adv_famille_06` (ex-conjoint arrête de payer la pension à la majorité de la fille, qui est en 2ème année d'apprentissage) — le navigator route vers `famille_pension_impayee` (CC 276 + CP 217) mais aucun article ne couvre CC 277 al. 2. La fiche existante `famille_pension_impayee` traite l'exécution de la pension déjà due, pas le fondement légal (obligation d'entretien persistante malgré la majorité si formation non terminée). La distinction est cruciale : l'obligation d'entretien ne s'arrête pas automatiquement à 18 ans (CC 277 al. 2), mais la procédure est différente selon que le jugement de divorce contient ou non une clause explicite.
  - **priorité** : haute. Croyance très répandue que la pension s'arrête à 18 ans — des milliers de jeunes adultes en formation perdent leur droit faute d'information. La fiche ciblerait spécifiquement CC 277 al. 2 + procédure si l'autre parent refuse.

- ⛔ `dettes_concordat_ordinaire`
  - **base juridique** : LP 293 (homologation du concordat par le juge), LP 295 (sursis concordataire, 4-6 mois), LP 310 (concordat par abandon d'actifs), LP 306 (concordat ordinaire — dividende)
  - **pourquoi manquante** : `adv_dettes_07` (particulier surendetté à 60k CHF, veut éviter la faillite, parle de "concordat") — le navigator route vers `dettes_faillite_personnelle_procedure` + `dettes_arrangement_amiable_negociation`. Articles retournés : LP 191, LP 39, LP 265, CO 19, CO 75, LP 93, LP 149a — aucun ne couvre LP 293 (homologation) ni LP 295 (sursis). La fiche `dettes_arrangement_amiable` couvre la négociation privée, mais pas la procédure formelle de concordat (sursis concordataire → plan de remboursement homologué par le juge). Le concordat est radicalement différent de la faillite (LP 191) : il permet au débiteur de rester actif, de proposer un dividende aux créanciers, et d'éviter la radiation du RC.
  - **priorité** : moyenne. Le concordat ordinaire est sous-utilisé car méconnu des particuliers-commerçants. Une fiche dédiée LP 293/295 permettrait d'orienter vers cette alternative à la faillite.

### Gap identifié par l'éval adversariale 2026-06-13 (wave 10 — 100→110 cas, score 93% brut → ~95% après corrections)

- ⛔ `circulation_retrait_permis_medical`
  - **base juridique** : LCR 14 (aptitude à la conduite : conditions physiques et psychiques requises), LCR 16 al. 1 (retrait du permis si condition non remplie), OAC 27 (contrôle périodique des conducteurs — aptitude médicale), Directives OFROU sur les maladies invalidantes (épilepsie, diabète, troubles visuels)
  - **pourquoi manquante** : `adv_circulation_04` (première crise d'épilepsie → retrait préventif → neurologue dit OK → office dit attendre 6 mois) — le navigator retourne `domaines=[]` `fiches=[]` : **aucune fiche ne couvre le retrait médical du permis**. La fiche existante `circulation_retrait_permis` (documentée comme gap dans `circulation_retrait_permis` — LCR 16a/16b/16c) traite le retrait PÉNAL (suite à infractions routières). Le retrait MÉDICAL (LCR 14 — inaptitude physique) est un domaine entièrement distinct : procédures différentes (médecin traitant → autorité cantonale de la circulation → OFROU), délais différents (pas péremptoire mais lié aux directives médicales), recours différents (administratif + médical).
  - **distinction critique** : retrait pénal = sanction après infraction (LCR 16a-16c, durée fixe, récidive aggrave). Retrait médical = mesure de sécurité publique (LCR 14, durée jusqu'à rétablissement médical confirmé). Un citoyen souffrant d'épilepsie ne sait pas à qui s'adresser ni comment obtenir la restitution.
  - **priorité** : haute. Situation vécue régulièrement (épilepsie, AVC, troubles visuels sévères, diabète insulino-dépendant). Le retrait médical peut durer des années sans recours clair. La distinction avec le retrait pénal est fondamentale mais inconnue des citoyens.

### Gaps identifiés par l'éval adversariale 2026-06-14 (wave 11 — 110→120 cas, score 94% global)

- ⛔ `travail_modification_contrat_unilateral`
  - **base juridique** : CO 319 al. 2 (les conventions contraires à ce qui est convenu doivent être acceptées), CO 320 (présomption de contrat si le travailleur continue), CO 335 (résiliation-modification comme seule voie légale pour imposer une modification substantielle)
  - **pourquoi manquante** : `adv_travail_15` (patron annonce réduction de salaire de 800 CHF par email, travailleur n'a rien signé) — le navigator route vers `travail_licenciement_abusif` avec articles CO 336/336a/336b (résiliation abusive). Articles CO 319/320/335 entièrement absents. La fiche existante traite le cas où l'employeur résilie (CO 336), mais pas le cas où il tente de modifier unilatéralement une condition essentielle sans résiliation formelle. La distinction est cruciale : la réduction unilatérale de salaire est nulle de plein droit, le travailleur peut continuer à travailler au salaire initial, et l'employeur doit passer par la résiliation-modification s'il veut réduire le salaire.
  - **priorité** : haute. Cas fréquent (crise économique, restructuration). Un travailleur qui "accepte" une réduction par email sans protestation risque de perdre ses droits (CO 320 — présomption tacite). L'information sur la résiliation-modification est absente du corpus.

- ⛔ `violence_diffusion_images_intimes`
  - **base juridique** : CP 197 al. 4 (diffusion de représentations sexuelles non consenties = crime, peine privative de liberté jusqu'à 3 ans), CC 28 (atteinte à la personnalité : image, honneur, sphère privée), CC 28a (action en cessation + réparation), CP 179quater (captation d'images non autorisée dans le domaine secret)
  - **pourquoi manquante** : `adv_violence_05` (ex-copain publie des photos intimes sur des sites pornographiques sans consentement) — le navigator route vers `violence_stalking_harcelement` + `violence_psychologique_preuves`. Articles retournés : CP 179septies (cyberharcèlement), CP 180 (menaces), CP 181 (contrainte), CC 28b (protection contre les violences) — aucun ne couvre CP 197 (diffusion d'images sexuelles non consenties, le seul fondement pénal spécifique au "revenge porn"). La fiche stalking traite la persécution persistante, pas la diffusion unique et irréversible d'images. La procédure est différente : plainte pénale (CP 197) + signalement plateformes + action civile en cessation (CC 28a) + possible LEI 80 pour LSCPT (conservation des données pour identifier le contrevenant si anonyme).
  - **priorité** : haute. Phénomène en augmentation (réseaux sociaux, deepfakes). Le délai pour déposer plainte est de 3 mois dès connaissance (CP 31). Un citoyen qui ne connaît pas CP 197 croit souvent ne rien pouvoir faire, surtout si son ex est hors contact.

- ⛔ `entreprise_sa_nullite_decisions_ag`
  - **base juridique** : CO 697 al. 1 (convocation AG : délai de 20 jours, tous les actionnaires nominatifs inscrits), CO 706 al. 1 et 2 (action en annulation dans les 2 mois dès connaissance — motifs : défaut de convocation, ordre du jour non annoncé, participation irrégulière, intérêt propre non divulgué), CO 706b (nullité absolue, imprescriptible), CO 704 al. 1 ch. 1 (augmentation du capital social : majorité qualifiée 2/3 des voix représentées)
  - **pourquoi manquante** : `adv_entreprise_05` (actionnaire SA, AG non convoqué, les 2 autres votent augmentation de leurs salaires + émission actions dilutive) — le navigator route vers `entreprise_conflit_associes_sarl`. Articles retournés : CO 798/808/822/823 (droit des associés **SARL**) — aucun ne couvre CO 706 ni CO 704 (droit des actionnaires **SA**). La fiche `entreprise_conflit_associes_sarl` est spécifique à la SARL ; la SA a un régime distinct (CO 620 et ss. vs CO 772 et ss.). La distinction est fondamentale : dans une SA, l'action en annulation d'une décision AG prise sans convocation régulière est un droit intangible des actionnaires (CO 706), avec un délai de 2 mois dès connaissance.
  - **priorité** : haute. Le délai de 2 mois pour agir (CO 706) est péremptoire — un actionnaire SA non convoqué qui ne réagit pas perd son recours. La confusion SA/SARL dans les fiches existantes rend cette situation invisible pour les citoyens concernés.

### Gap identifié par l'éval adversariale 2026-06-16 (wave 13 mesurée — 140 cas, score 91% brut → ~94% après corrections specs)

- ⛔ `assurance_aanp_taux_indemnite`
  - **base juridique** : LAA 17 (indemnité journalière AANP = 80% du salaire assuré), LAA 6 al. 2 (couverture AANP si taux d'occupation ≥ 8h/sem), LAA 13 (base de calcul du gain assuré), OLAA 23 (assiette de la cotisation AANP)
  - **pourquoi manquante** : `adv_assurances_06` (employé 100%, ski week-end, LAA paye 80% au lieu de 100%, employeur dit "c'est la loi") — le navigator route vers `assurance_ijm` (assurance d'indemnité journalière maladie LCA) + `assurance_lamal_refus_prestation`. Articles retournés : LCA 67, LCA 46, LAMal 67-77, CO 324a — aucun ne couvre **LAA 17** (taux légal AANP 80%). La fiche `assurance_ijm` traite la garantie perte de gain privée (LCA), qui est distincte de l'assurance-accidents obligatoire (LAA). La confusion est fréquente : certains employeurs ou CCT prévoient 100% via une assurance complémentaire, mais la LAA seule garantit 80% pour l'AANP. Un citoyen qui ne comprend pas cette distinction ne sait pas s'il peut réclamer davantage (assurance complémentaire manquante ou CCT non appliquée).
  - **distinction avec `assurance_aanp_lamal_sport`** : LAA 8 (AANP, liste des activités dangereuses exclues : parachutisme, arts martiaux...) est couverte par `adv_accident_03` qui passe à 100%. Le gap ici est sur le **taux** (80% LAA vs 100% attendu par l'employé) et la confusion LAA/IJM.
  - **priorité** : haute. La distinction LAA (obligatoire, 80% AANP) vs assurance complémentaire (volontaire, 100%) est une source majeure de malentendus lors d'accidents non-professionnels. Plusieurs milliers d'accidents de ski/sport par an.

### Gaps identifiés par l'éval adversariale 2026-06-15 (wave 12 mesurée — 130 cas, score 91% brut → ~94% après corrections specs)

- ⛔ `bail_commercial`
  - **base juridique** : CO 253a (bail commercial — locaux à usage commercial, régime moins protecteur que l'habitation), CO 272a (prolongation limitée : 1 seule prolongation max de 6 ans, uniquement si besoins clairement prépondérants du locataire — CO 272), CO 268 (délai de préavis 6 mois pour bail commercial > 1 an), CO 260a (indemnité pour aménagements si bailleur en profite)
  - **pourquoi manquante** : `adv_bail_15` (magasin de fleurs, bail commercial 8 ans, investissement 60k CHF, congé 3 mois pour reprise, confusion avec bail d'habitation) — le navigator retourne `domaines=[]` `fiches=[]` : **aucun routing pour le bail commercial**. Les fiches bail existantes traitent exclusivement le bail d'habitation (CO 269 et ss., CO 271a — protection maximale). Le bail commercial (CO 253a) a un régime radicalement différent : pas de liste exhaustive de congés abusifs (CO 271a ne s'applique pas), délai de préavis 6 mois, prolongation plus difficile. Un commerçant qui croit bénéficier de la même protection qu'un locataire résidentiel commet une erreur critique.
  - **priorité** : haute. Nombreux petits commerçants (artisans, restaurants, boutiques) en bail commercial. La confusion avec le bail résidentiel peut leur faire rater le délai de contestation (30 jours pour saisir la commission de conciliation). Délai court + erreur de droit = droits perdus.

- ⛔ `voisinage_camera_surveillance`
  - **base juridique** : LPD 25 (droit d'accès aux données personnelles pour les traitements privés), LPD 30 (obligations du responsable du traitement : information, minimisation, finalité), LPD 5 lit. a (données personnelles = images permettant l'identification), CC 28 (atteinte à la personnalité, droit à l'image), CC 28a (action en cessation + dommages-intérêts), CC 684 (immissions immatérielles excessives)
  - **pourquoi manquante** : `adv_voisinage_07` (caméra voisin orientée vers cour privée + fenêtre chambre, refus de donner accès aux images) — le navigator retourne `domaines=[]` `fiches=[]` : **aucune fiche pour la vidéosurveillance entre voisins**. Les fiches voisinage couvrent le bruit, les arbres, les constructions — pas le domaine LPD appliqué aux rapports de voisinage. La caméra qui filme la propriété d'un voisin constitue un traitement de données personnelles soumis à la nLPD (en vigueur depuis sept. 2023) : obligation d'information (panneau), minimisation (angle couvrant seulement la propriété du filmant), et droit d'accès (art. 25 nLPD). Un voisin peut exiger la cessation + l'effacement des images.
  - **priorité** : haute. Prolifération des caméras de surveillance résidentielles. Confusion fréquente : le propriétaire croit que "sa caméra sur sa façade = son droit". La nLPD 2023 a renforcé les obligations de minimisation et d'information. Situation sans fiche = 0% au navigator, citoyen sans ressource.

### Gaps identifiés par l'éval adversariale 2026-06-18 (160 cas, score 83% brut → ~91% hors timeouts)

Note : 13/160 cas ont terminé avec exit 143 (SIGTERM — timeout 120s). Le score corrigé hors timeouts est ~91%, cohérent avec les runs précédents. Les 4 gaps ci-dessous proviennent des fails persistants (non-timeout).

- ⛔ `entreprise_concurrence_deloyale`
  - **base juridique** : LCD 4 ch. b (exploitation des résultats du travail d'autrui), LCD 5 al. 1 ch. a (reproduction sans autorisation), LCD 9 (actions civiles — cessation, dommages-intérêts, mesures provisionnelles), CO 321a al. 4 (devoir de fidélité post-contrat)
  - **pourquoi manquante** : `adv_entreprise_07` (ex-directeur commercial contacte clients avec tarifs confidentiels, sans clause NC) — navigator route vers `travail_secret_professionnel` + `travail_non_concurrence` + `consommation_pratiques_deloyales`. Articles retournés : CO 321a/321e/CP 162/CO 340/340a/340c/LCD 2/LCD 3 — jamais LCD 4 ni LCD 5. La fiche `travail_non_concurrence` couvre la clause de non-concurrence (CO 340 — qui n'existe pas ici), pas la concurrence déloyale au sens de la LCD. La distinction est fondamentale : LCD 4/5 s'appliquent SANS clause de non-concurrence, dès que les secrets ont été acquis pendant l'emploi et sont utilisés contre l'ancien employeur. Un employeur sans clause NC croit souvent ne rien pouvoir faire.
  - **priorité** : haute. Scénario fréquent lors de départs en entreprise. La LCD offre une protection forte même sans clause NC. Délai pour action en cessation : mesures provisionnelles sans délai, action en dommages-intérêts prescription 3 ans (LCD 9).

- ⛔ `entreprise_confusion_patrimoine_sarl`
  - **base juridique** : CO 794 al. 1 (responsabilité limitée SARL, mais exception jurisprudentielle), CO 828 (responsabilité du gérant : renvoi CO 717), CO 803 (fidélité et diligence des associés SARL), LP 46 (non-extinction responsabilité personnelle par faillite de la société)
  - **pourquoi manquante** : `adv_entreprise_06` (associé unique SARL a utilisé le compte social pour 35k CHF d'achats privés, créanciers l'attaquent personnellement post-faillite) — navigator route vers `entreprise_dissolution_societe` + `dettes_commandement_payer`. Articles retournés : CO 736/821/742/745 (dissolution) + LP 69/74/75 (poursuites) — aucun ne couvre CO 794 ni la théorie du percement du voile corporatif. La fiche dissolution traite la liquidation normale, pas le cas où la protection de la personnalité juridique est écartée (jurisprudence TF : confusion intentionnelle de patrimoines). La distinction est critique : normalement un associé SARL n'est pas personnellement responsable des dettes sociales — mais cette protection tombe en cas de confusion intentionnelle prouvée.
  - **priorité** : haute. Erreur d'appréciation fréquente chez les petits entrepreneurs pensant que la SARL est un bouclier absolu. Délai de prescription de l'action en responsabilité (LP 46 + CO 828) : 10 ans (CO 127).

- ⛔ `assurance_laa_maladie_professionnelle`
  - **base juridique** : LAA 9 al. 1 (maladie professionnelle = maladie causée par des nuisances listées à l'OLAA 1), OLAA 1 (liste des maladies professionnelles — dont surdité, atteintes respiratoires, dermatoses), LAA 49 (prescription : 5 ans dès connaissance du dommage, pas dès la fin de l'exposition), LAA 77 (SUVA reprend les prestations si l'assureur n'existe plus)
  - **pourquoi manquante** : `adv_accident_05` (ex-menuisier 66 ans, surdité professionnelle post-retraite, ancien employeur en faillite) — navigator route vers `assurances` (correct) avec fiches `assurance_laa_contestation` + `assurance_laa`. Articles retournés : LPGA 52/56/61, LAA 18/6/16/24 — jamais LAA 9 ni OLAA 1. Les fiches LAA existantes traitent l'accident professionnel (LAA 6) et les contestations générales (LPGA 52), mais pas la maladie professionnelle comme catégorie distincte. La distinction est fondamentale : l'accident (LAA 6) est un événement soudain ; la maladie professionnelle (LAA 9) est progressive et reconnue uniquement si sur la liste OLAA 1. Délai de prescription LAA 49 ne court pas dès la retraite mais dès le diagnostic.
  - **priorité** : haute. Des milliers de retraités ignorent qu'ils ont un droit à prestation LAA pour des maladies professionnelles développées pendant leur carrière. La croyance que "la retraite ferme les droits" et que "la faillite de l'employeur empêche toute action" est très répandue et fausse dans les deux cas.

- ⛔ `sante_libre_choix_specialiste`
  - **base juridique** : LAMal 41 al. 1 (libre choix parmi les fournisseurs de prestations admis — pas d'obligation de référence en modèle standard), OAMal 36 (conditions de remboursement des spécialistes admis), exception : modèles alternatifs (HMO, médecin de famille contractuel, TelFirst) où la référence est obligatoire
  - **pourquoi manquante** : `adv_sante_07` (8 mois de douleurs, généraliste refuse de référer un rhumatologue, citoyen veut consulter directement) — navigator route vers `sante` (correct) avec fiches `sante_medecin_traitant_continuite` + `sante_lamal_refus_prestation`. Articles retournés : CO 394/398/404 (contrat médecin-patient), LPMéd 40 (devoirs du médecin), LAMal 25/32/LPGA 49 — jamais LAMal 41 al. 1 (libre choix). La fiche `sante_medecin_traitant_continuite` couvre la continuité des soins et le refus de prendre un nouveau patient, pas le droit au libre choix en modèle standard. `sante_urgence_libre_choix` (déjà documenté) couvre LAMal 41 al. 3 (urgences) — scénario distinct. Le libre choix en consultation standard (non urgente) est la situation la plus fréquente en médecine de ville.
  - **note taxonomique** : distinct de `sante_urgence_libre_choix` (déjà documenté — concerne les urgences hospitalières + LAMal 41 al. 3). Ce gap cible le modèle standard + consultation élective + droit de consulter directement un spécialiste sans référence du généraliste (LAMal 41 al. 1).
  - **priorité** : haute. Croyance très répandue que le médecin de famille est un "gatekeeper" obligatoire pour tous les spécialistes (vrai en modèle alternatif seulement). Des millions d'assurés en modèle standard ignorent leur droit de consulter directement.

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
