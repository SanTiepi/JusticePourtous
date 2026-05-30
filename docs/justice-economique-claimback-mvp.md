# MVP — Justice économique / ClaimBack Vaud (subside LAMal)

> **Statut** : spécification (design à valider avant implémentation). 2026-05-31.
> **Principe** : flipper le corpus de « voici l'info sur les subsides » → « est-ce que TOI tu y as
> droit, et combien ». Première brique d'un vertical « Justice économique » de JusticePourtous.
> **Périmètre MVP volontairement étroit** : 1 canton (Vaud), 1 aide (réduction individuelle de
> primes LAMal = « subside »). Pas « toutes les aides partout » — on amorce, on mesure, on étend.

## 1. Pourquoi cette brique d'abord
- **Non-recours massif et documenté** (OFS, Caritas) : des milliers de Vaudois·es éligibles au subside ne le demandent pas.
- **Outcome concret = règle le vrai blocker** (0 outcome en prod) : « vous avez potentiellement droit à ~CHF X/an, voici comment » est mesurable et motive le retour.
- **Réutilise le moteur** : la fiche `assurance_lamal_subsides_refus` (art. 65 LAMal) existe déjà, `cantons-matrix.json` a VD, et le `normative-compiler` sait DÉJÀ calculer un montant à partir de faits (cf. règle `dettes_saisie_revenu_csias` qui calcule le minimum vital). Pas de greenfield.
- **Défendable** : on aide à réclamer ce que la loi accorde déjà. Zéro risque diffamation, positif-somme.

## 2. Parcours utilisateur (`/justice-economique` → ClaimBack)
1. Entrée : page hub `Justice économique` (1 porte active au MVP : « Vérifier mes droits au subside LAMal — Vaud »).
2. Mini-questionnaire (4-5 champs, pas de compte) :
   - Canton (MVP : verrouillé VD ; les autres → « bientôt »).
   - Revenu net annuel du ménage (fourchette ou montant).
   - Taille du ménage (adultes / enfants).
   - (option) Fortune approximative (le RDU vaudois en tient compte).
3. Résultat : verdict d'éligibilité **indicatif** + estimation de fourchette + **3 démarches concrètes** (où/comment déposer, délai, lien formulaire officiel OVAM) + lien vers la fiche pour le détail légal + bouton « contester un refus » (réutilise la fiche existante).

## 3. Règle d'éligibilité (format normative-compiler)
Nouvelle règle `claimback_subside_lamal_vd` (module `claimback`), même forme que les 76 règles existantes :
```js
{
  id: 'claimback_subside_lamal_vd',
  label: 'Éligibilité indicative au subside LAMal (Vaud)',
  domaine: 'assurances',
  condition: (f) => f.canton === 'VD' && Number.isFinite(f.revenu_determinant) && Number.isFinite(f.taille_menage),
  consequence: (f) => {
    const seuil = SEUILS_SUBSIDE_VD[f.categorie_menage]; // ← DONNÉE OFFICIELLE À SOURCER
    const eligible = f.revenu_determinant <= seuil.plafond;
    return {
      text: eligible
        ? `Sur la base de votre revenu déterminant (~${f.revenu_determinant} CHF), vous êtes probablement éligible au subside LAMal vaudois. Estimation indicative — à confirmer avec le calculateur officiel.`
        : `Votre revenu dépasse le plafond indicatif du subside (~${seuil.plafond} CHF pour votre situation). Vérifiez tout de même : le calcul officiel (RDU) peut différer.`,
      eligible,
      plafond_indicatif: seuil.plafond,
      estimation_chf_annuel: eligible ? seuil.estimation : 0
    };
  },
  source_id: 'fedlex:rs832.10:lamal-65', // + source cantonale OVAM
  exceptions: [/* bénéficiaires PC/aide sociale = subside automatique, etc. */]
}
```

## 4. Dépendance données + VERROU (critique)
- Les **seuils de revenu (RDU) et montants du subside vaudois** sont publiés par l'OVAM (Office vaudois de l'assurance-maladie), **cantonaux et révisés chaque année**. → `SEUILS_SUBSIDE_VD` doit être **sourcé officiellement** (pas inventé) et daté.
- **Couplage validation humaine** : annoncer un montant faux = faux espoir = dégât réel + exactement le risque de « confiance inversée ». Donc, tant que les seuils ne sont pas **vérifiés par un humain** :
  - MVP en mode **« estimation indicative »** : fourchette, jamais un montant précis affiché comme certain, disclaimer fort, et **redirection systématique vers le calculateur/ formulaire officiel OVAM** comme source de vérité.
  - C'est la fiche idéale à inclure dans l'amorce de validation payante (`docs/avocats-validation/AMORCE-juriste-paye.md`) — ClaimBack **justifie** la dépense de review.

## 5. Pages / routes
- `/justice-economique.html` — hub du vertical (1 porte au MVP).
- Flux ClaimBack : réutiliser `consulter.html`/`app.js` avec un mode dédié, OU une page `/claimback.html` légère. (Préférence : un mode du flux existant pour réutiliser le tracking + le rendu.)
- Lien d'entrée : carte dans la grille domaines + prompt doux du chatbot quand le triage détecte pauvreté/dettes/subsides/aide sociale.

## 6. Mesure (réutilise le funnel P1)
- Events dédiés : `claimback_started`, `claimback_eligibility_shown` (avec `eligible` true/false), `claimback_official_link_clicked`.
- KPI : nb d'éligibilités positives détectées, taux de clic vers le formulaire officiel = proxy d'outcome réel.

## 7. Garde-fous
- Disclaimer : « estimation indicative, non contractuelle ; seul l'OVAM décide ». Lien officiel toujours visible.
- Aucune donnée perso stockée (cohérent avec la privacy-by-design actuelle : calcul en RAM).
- Jamais d'individu nommé, aucune dimension militante dans cette brique (réservée à un éventuel observatoire séparé, hors marque triage).

## 8. Hors-scope MVP (explicite)
- Autres aides (PC, allocations, bourses, aides communales) → phase 2, une par une.
- Autres cantons → après le rodage VD.
- **Matching fondations privées** → phase 2 de ClaimBack (quand pas d'aide publique), PAS un pilier.
- **Observatoire / TaxPrivilege / scoring fondations** → produit séparé, hors JusticePourtous (risque marque/légal).

## 9. Découpage de livraison
- **Buildable maintenant sans risque** : page hub `/justice-economique`, flux + questionnaire, squelette de la règle `claimback_subside_lamal_vd` dans le compiler, events de mesure, disclaimers + lien OVAM. Mode « indicatif » avec fourchettes larges.
- **Bloqué tant que data non sourcée+vérifiée** : les seuils/montants exacts en dur. Avant ça : fourchette prudente + renvoi calculateur officiel.
- **Étape suivante** : sourcer les seuils OVAM 2026 + les faire valider (amorce juriste) → activer les montants précis.
