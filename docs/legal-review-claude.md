# Review juridique critique — perspective avocat

**Date** : 2026-04-29
**Scope** : 18 fiches prioritaires (délais péremptoires, autorités compétentes, articles précis)
**Reviewer** : Claude (avec disclaimer : pas un vrai avocat — review structurel + connaissance du droit suisse, ne remplace pas une validation par un juriste)
**Méthode** : pour chaque fiche, vérification des articles cités (existence + portée), des délais (péremptoires vs ordinatoires), des autorités compétentes, du modèle de lettre (destinataire + base légale), des anti-erreurs.

## Résumé exécutif

| Sévérité | Nombre | Action |
|---|---|---|
| 🔴 **Critique** (peut faire perdre un droit) | 4 | À fixer immédiatement |
| 🟠 **Important** (imprécision juridique) | 6 | Fix recommandé |
| 🟡 **Mineur** (typo, formulation) | 5 | Cosmétique |
| ✅ **Correct** (validé) | 12 fiches sur 18 | OK pour citoyens |

**Verdict global** : la base juridique est **majoritairement solide** (articles corrects, délais corrects, jurisprudence pertinente). 4 erreurs critiques à corriger avant de présenter à des juristes.

---

## 🔴 Erreurs critiques (4)

### 1. `dettes_opposition` — confusion opposition/mainlevée

**Problème** : Le titre de la fiche et son `match_description` parlent d'**opposition** au commandement de payer. Mais le contenu (`reponse.explication`) traite uniquement de la **mainlevée** (étape suivante quand le créancier requiert la mainlevée APRÈS opposition). Le modèle de lettre est adressé "Tribunal" — correct pour la mainlevée, mais incohérent avec le titre.

**Impact citoyen** : Un user qui cherche "comment faire opposition" tombe sur une fiche qui parle de mainlevée. S'il suit le modèle de lettre tel quel, il l'envoie au tribunal au lieu de l'**Office des poursuites** → il rate le délai de 10 jours (LP 74 al. 1) → **opposition perdue, dette devient exécutoire**.

**À fixer** :
- Soit renommer la fiche `dettes_opposition` → `dettes_mainlevee_contestation` et clarifier scope
- Soit refondre le contenu pour traiter vraiment de l'opposition (mais doublonne avec `dettes_commandement_payer`)
- Recommandation : clarifier `match_description` + en-tête explication ("Cette fiche couvre la phase de mainlevée APRÈS votre opposition. Pour faire l'opposition elle-même, voir `dettes_commandement_payer`")

### 2. `bail_depot_garantie` — article LP 63 non-pertinent

**Problème** : Cite **`LP 63`** dans `articles` — l'art. 63 LP traite de "Suspension de la poursuite — décès du débiteur", aucun rapport avec les garanties de loyer.

**Note d'auto-correction (2026-04-29)** : Mon analyse initiale signalait aussi CO 267a comme inexistant. **Erreur de ma part** — CO 267a existe bien : "Vérification de la chose et avis au locataire" (réforme du droit du bail de 1990). Référence à conserver.

**Impact citoyen** : Référence à un article hors-sujet (LP 63). Si un user vérifie sur Fedlex, il sera désorienté. Si un avocat ou juriste contrôle la fiche, il voit immédiatement l'erreur → perte de crédibilité.

**À fixer** : Remplacer LP 63 par CO 267 (restitution de la chose) qui est la base correcte avec art. 257e CO (caution).

### 3. `etranger_renvoi` — délai péremptoire de recours absent

**Problème** : La fiche explique le renvoi (art. 64 LEI) mais ne mentionne pas explicitement le **délai de recours** (30 jours, art. 50 al. 1 LTAF pour TAF, ou 30 jours selon canton pour 1ère instance). Pas de cascade non plus.

**Impact citoyen** : Le délai de recours en matière d'asile/migration est péremptoire. Un user qui ne connaît pas le délai et s'oriente vers cette fiche peut perdre sa possibilité de recours en quelques jours. Pour un sujet où l'enjeu est la **présence en Suisse**, c'est l'erreur la plus grave possible.

**À fixer** : Ajouter explicitement le délai 30j recours TAF (art. 50 LTAF) dans `explication` ET créer une cascade.

### 4. `bail_loyer_initial_abusif` — cantons à formule officielle incomplets

**Problème** : Liste les cantons avec formule officielle obligatoire = "VD, GE, FR, ZH, NE". Manque **ZG** (Zoug) qui exige aussi le formulaire officiel pour le loyer initial (selon art. 270 al. 2 CO + arrêté cantonal). Et la cascade est vide (pas de délai, pas de base légale).

**Impact citoyen** : Un user à Zoug pense que la formule n'est pas obligatoire chez lui, ne conteste pas, perd ses 30 jours.

**À fixer** : Ajouter ZG à la liste. Compléter la cascade avec délai 30j (art. 270 al. 1 CO) + autorité (commission de conciliation).

---

## 🟠 Imprécisions importantes (6)

### 5. `bail_loyer_abusif` — formulation taux hypothécaire trop simple

**Problème** : "Le rendement admissible est de 0,5% au-dessus du taux hypothécaire de référence". C'est imprécis. La règle exacte (art. 269a let. b CO + ATF 122 III 257) : rendement net admissible = taux hypothécaire de référence + 0,5% **uniquement sur les fonds propres rentables**, eux-mêmes capés à 40% de la valeur d'investissement (jurisprudence évolutive récente).

**Impact citoyen** : Un user calcule mal son loyer abusif et peut conclure à tort qu'il est ou n'est pas abusif.

**À fixer** : Reformuler avec mention que le calcul de rendement admissible est complexe et nécessite consultation (sans changer la portée).

### 6. `bail_resiliation_conteste` — forme du congé (nullité vs annulabilité)

**Problème** : La fiche traite l'annulabilité (art. 271-271a CO) mais ne mentionne pas la **nullité** d'un congé non donné sur formulaire officiel (art. 266l al. 2 CO + art. 9 OBLF). Différence juridique importante : nullité = pas de délai, annulabilité = 30 jours.

**Impact citoyen** : Un user qui a reçu un congé sur papier libre peut croire qu'il a 30 jours pour contester (annulabilité), alors qu'il pourrait simplement faire constater la nullité (sans délai).

**À fixer** : Ajouter paragraphe "Nullité de forme" distinct de l'annulabilité.

### 7. `bail_augmentation_loyer` — précision article OBLF manquante

**Problème** : "10 jours avant le début du délai de résiliation" est correct, mais manque la précision que cela vaut pour les baux à durée indéterminée. Pour les baux à durée déterminée, la hausse n'est en principe pas possible avant l'échéance.

**À fixer** : Préciser le cas du bail à durée déterminée.

### 8. `bail_defaut_moisissure` — délai "7 jours" non-légal

**Problème** : Cascade étape 2 mentionne "dans les 7 jours" pour aviser le bailleur du défaut. Aucun délai légal de 7 jours n'existe. L'art. 257g CO impose seulement un avis "sans retard" (= immédiat dès découverte). Mettre 7 jours pourrait faire croire au user qu'il a une marge.

**À fixer** : Remplacer "7 jours" par "sans retard (immédiat dès découverte) — art. 257g CO".

### 9. `violence_plainte` — retrait de plainte non mentionné

**Problème** : La fiche couvre le dépôt mais pas le **retrait** de plainte (art. 33 CP). Pour les violences conjugales (art. 55a CP : suspension), c'est un mécanisme central dans la pratique.

**À fixer** : Ajouter section "Retrait de plainte et suspension art. 55a CP".

### 10. `accident_circulation` — déclaration assurance dans 14 jours absente

**Problème** : Pas de mention du délai usuel de **déclaration à l'assurance** (généralement 14 jours selon CGA — pas un délai légal mais critique pratique). En cas de retard, l'assurance peut réduire les prestations (art. 38 LCA + art. 21 LCA si dol).

**À fixer** : Ajouter recommandation "déclarer dans les 14 jours à votre assurance" + mention art. 38 LCA.

---

## 🟡 Mineur (typos, formulations)

| # | Fiche | Problème | Fix |
|---|---|---|---|
| 11 | `dettes_opposition` (modèle lettre) | "Je contesté" | "Je conteste" |
| 12 | `bail_loyer_initial_abusif` | "marche" | "marché" |
| 13 | `bail_loyer_abusif` | "référencée" (typo) | "référence" |
| 14 | `dettes_opposition` | "mainlevee" sans accent | "mainlevée" (cohérence accent) |
| 15 | Plusieurs (dettes_*, bail_*) | accents manquants ("debiteur", "creancier", "echu") | uniformiser |

---

## ✅ Fiches validées (correct juridiquement, prêtes citoyens)

| # | Fiche | Notes |
|---|---|---|
| 1 | `bail_resiliation_conteste` | Articles + délais corrects (sauf manque nullité — voir #6) |
| 2 | `bail_expulsion` | Justice privée interdite bien capturée, articles corrects |
| 3 | `bail_augmentation_loyer` | Formule officielle + nullité OK |
| 4 | `bail_defaut_moisissure` | Articles 256-259g corrects (sauf délai 7j — voir #8) |
| 5 | `travail_licenciement_abusif` | CO 336/336a/336b corrects, délai 180j correct |
| 6 | `travail_salaire_impaye` | CO 322/323/337 + intérêts moratoires corrects |
| 7 | `travail_certificat` | CO 330a + bienveillance correct |
| 8 | `dettes_commandement_payer` | LP 69/74/75 corrects, modèle lettre **bien adressé Office des poursuites** |
| 9 | `dettes_mainlevee_provisoire` | LP 82/83 corrects, libération de dette 20j correct |
| 10 | `famille_divorce` | CC 111/114/122/125 corrects |
| 11 | `famille_garde` | Autorité parentale conjointe correcte (réforme 2014) |
| 12 | `accident_circulation` | LCR 58/63/83 corrects (sauf manque LCA — voir #10) |

---

## Recommandations méta

### Pour passer la gate juriste

1. **Fix les 4 erreurs critiques** avant toute présentation à associations.
2. **Fix les 6 imprécisions importantes** dans la foulée — peu d'effort, gain de crédibilité.
3. **Faire valider 5 fiches gold par 1 vrai avocat** (CHF 500-1500) : `bail_defaut_moisissure`, `bail_resiliation_conteste`, `dettes_commandement_payer`, `travail_licenciement_abusif`, `etranger_renvoi`. Ces 5 couvrent 80% des cas citoyens fréquents.
4. **Compléter cascades** sur `famille_divorce`, `famille_garde`, `etranger_renvoi`, `accident_circulation`, `violence_plainte` (sans cascade actuellement = `partial`).
5. **Marquer `claude_legal_review_date`** sur les fiches review-ées pour traçabilité.

### Pour la qualité globale

- **Anti-erreurs absent** sur `dettes_opposition` (et probablement d'autres) — à compléter systématiquement.
- **Cascades base_legale = "?"** sur plusieurs étapes — à attribuer.
- **Uniformiser les accents** dans tout le corpus (debiteur → débiteur, etc.).

### Limites de cette review

Cette review est faite par un LLM, pas un avocat. Elle peut :
- **Détecter** : articles inexistants, délais évidents, incohérences de procédure, typos
- **Ne pas détecter** : nuances jurisprudentielles très récentes, divergences cantonales subtiles, applications doctrinales contestées

Cette review **complète** mais **ne remplace pas** une validation juridique humaine pour les fiches de production.

---

## Addendum 2026-04-29 — Extension à 14 fiches gold supplémentaires

Suite à la review initiale de 18 fiches, 14 fiches additionnelles ont été review-ées (focus sur les sujets à enjeu critique : minimum vital, protection grossesse, aide d'urgence, accident travail).

### Liste

| Fiche | Note | Commentaire |
|---|---|---|
| `bail_loyers_impayes` | ✅ verified | Procédure 257d correcte (mise en demeure 30j puis résiliation 30j) |
| `bail_charges_contestees` | ✅ verified | CO 257a/b corrects, droit consultation justifié |
| `bail_etat_des_lieux` | ✅ verified | CO 267/267a, défauts non signalés présumés acceptés correct |
| `bail_droit_retractation` | ✅ verified | Important : pas de droit de rétractation pour les baux. Bien capturé |
| `travail_grossesse` | ✅ verified | Protection 16 sem post-partum (336c CO), APG 14 sem corrects |
| `travail_chomage` | 🟡 verified_minor_imprecision | Manque cascade + clarification délai inscription ORP |
| `travail_periode_essai` | ✅ verified | 1 mois extensible 3 max, délai 7j, suspension maladie OK |
| `travail_maladie` | ✅ verified | Échelles bernoise/zurichoise/bâloise correctes |
| `dettes_saisie_salaire` | ✅ verified | Minimum vital LP, traitement 13e salaire et bonus |
| `dettes_minimum_vital_lp` | ✅ verified | Normes Conférence préposés correctes (CHF 1200/1700) |
| `dettes_acte_defaut_biens` | ✅ verified | LP 149 + 149a (prescription 20 ans) corrects |
| `famille_pension_impayee` | ✅ verified | Art. 217 CP + Bureau cantonal recouvrement |
| `etranger_aide_urgence` | ✅ verified | Cst 12 + ATF 131 I 166 — droit absolu indépendant statut |
| `accident_travail` | 🟡 verified_minor_imprecision | Délai annonce LAA imprécis ("dans les jours suivant" — voir art. 45 LPGA + 53 OLAA) |

### Bilan global après les 2 sessions de review

- **32 fiches gold review-ées** (18 + 14) sur les domaines bail, travail, dettes, famille, etranger, accident, violence
- **4 fix critiques appliqués** (peuvent faire perdre un droit)
- **6 imprécisions importantes corrigées**
- **2 imprécisions mineures restantes** (cascade manquante + délai imprécis — non critiques)
- **20 fiches validées 100% correctes** sans modification nécessaire
- **`claude_legal_review_date: 2026-04-29`** + `claude_legal_review_notes` (verified / verified_minor_imprecision / fixed) sur les 32 fiches

### Recommandation finale

Sur ces 32 fiches gold, **5 sont prioritaires pour validation par 1 vrai avocat** avant contact associations :
1. `bail_defaut_moisissure` — la plus consultée (3 vues prod)
2. `bail_resiliation_conteste` — délai péremptoire 30j
3. `dettes_commandement_payer` — délai péremptoire 10j (le plus court)
4. `etranger_renvoi` — enjeu = présence en Suisse
5. `travail_licenciement_abusif` — délai 180j

Coût estimé : CHF 500-1500 pour 1 avocat spécialisé droit suisse contemporain.
