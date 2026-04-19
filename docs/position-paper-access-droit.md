# Position paper — Accès citoyen à la jurisprudence suisse

**Date** : 2026-04-19
**Auteur** : équipe JusticePourtous
**Statut** : draft pour partenariats / presse / autorités

---

## TL;DR

La Constitution suisse (art. 30 al. 3) garantit la publicité du prononcé des jugements. Dans les faits, la jurisprudence cantonale et de première instance reste **fragmentée, peu indexée, et difficilement exploitable sans outils professionnels payants**. Nous rendons cette jurisprudence déjà publiée utilisable pour les citoyens — en synergie avec les acteurs open justice existants, pas contre eux.

## 1. Constat

### 1.1 Ce qui est aujourd'hui accessible
- **Tribunal fédéral** : intégralement publié sur `tf.ch` + `bger.ch`. Accès libre et structuré.
- **Cantons romands** : variable. VD (`findinfo-vd.ch`), GE (`ge.ch/justice/decisions`), NE, FR publient **une partie** de leur jurisprudence cantonale supérieure.
- **Cantons alémaniques / italiens** : variable. Certains (ZH, BE) sont relativement ouverts, d'autres beaucoup moins.

### 1.2 Ce qui est techniquement public mais pratiquement invisible
- **Décisions de première instance** : quasi jamais indexées.
- **Décisions APEA, offices des poursuites, autorités administratives** : souvent opaques.
- **Décisions cantonales en PDF scanné non OCR** : présentes mais non-recherchables.

### 1.3 Le vrai problème n'est plus le volume brut
Des projets open source ont considérablement avancé :
- **[entscheidsuche.ch](https://entscheidsuche.ch)** — association à but non lucratif, agrège plus de 800'000 décisions.
- **[opencaselaw.ch](https://opencaselaw.ch)** — revendique 965'000+ décisions, 26 cantons, mises à jour quotidiennes, API REST/MCP.
- **[Justitia.swiss](https://justitia.swiss)** et la transition numérique cantonale (notamment [Genève justice numérique](https://justice.ge.ch//en/content/digital-transition-justice-system)) progressent.

**Le goulot est désormais l'exploitabilité citoyenne**, pas l'agrégation brute :
- peu d'arrêts sont bien reliés aux articles de loi
- peu sont classés selon leur utilité pour un justiciable non-juriste
- peu ont un résumé compréhensible sans formation juridique

## 2. Notre positionnement

### 2.1 Ce que nous faisons
- Ingérer la jurisprudence déjà publiée (TF + cantons + entscheidsuche + OpenCaseLaw) via une couche d'abstraction providers.
- Normaliser vers un schéma canonique (tier dérivé du tribunal et de l'instance, pas de l'agrégateur).
- Résoudre les articles cités vers des identifiants Fedlex stables.
- Classer chaque décision selon son rôle citoyen (favorable / nuance / défavorable / neutre).
- Extraire le holding utilisable pour une consultation simple.
- Ranker les leading cases par tier, récence, résolution d'articles, pertinence intent.
- Exposer par fiche : `leading_cases[3-5]` + `nuances[1-2]` + `cantonal_practice[1-3]` + `similar_cases[]` (secondaire).

### 2.2 Ce que nous ne faisons pas
- Prétendre remplacer un avocat pour représentation, plaidoirie, négociation fine.
- Affirmer que notre jurisprudence est exhaustive — nous sommes exhaustifs sur la jurisprudence **déjà publiée et utile à une consultation simple**, pas sur les décisions non-publiées de première instance ou administratives opaques.
- Contourner les sources commerciales par simple copie — nous contribuons upstream aux projets open source existants.

### 2.3 Formulation publique
> JusticePourtous rend utilisable pour les citoyens la jurisprudence suisse déjà publiée, aujourd'hui fragmentée et difficilement exploitable sans outils professionnels. Nous contribuons à l'écosystème open justice suisse plutôt que de le concurrencer.

## 3. Pourquoi c'est aligné avec l'intérêt public

- **Cst art. 30 al. 3** exige la publicité du prononcé des jugements. Son effectivité pour le citoyen sans avocat reste limitée.
- **Cst art. 29a** : garantie de l'accès au juge. L'accès effectif à l'information juridique en est un pré-requis.
- **Principe d'égalité** : les justiciables représentés par avocat ont un accès de facto à la jurisprudence par leur réseau et leurs abonnements. Le justiciable seul, non. Cette asymétrie d'information crée une asymétrie d'accès au droit.

## 4. Ce que nous demandons aux partenaires

### Aux projets open justice (entscheidsuche, OpenCaseLaw, Open Justice Switzerland)
- Accès à votre API (gratuit ou tarifé selon votre modèle).
- Concertation sur les schémas de métadonnées.
- Possibilité de contribuer upstream (signalements de décisions manquantes, OCR retour, anonymisations).

### Aux cantons (prioritairement VD, GE, ZH, BE, BS, TI)
- Publication systématique des arrêts cantonaux supérieurs dans un format structuré.
- Partenariat dans la transition numérique (justitia.swiss) pour indexer la jurisprudence dès sa génération.
- Éventuel mandat cantonal d'accès citoyen au droit (cf. portails citoyens VD/GE existants).

### Aux tribunaux
- Anonymisation systématique des arrêts à la publication (le vrai goulot technique).
- Métadonnées structurées attachées (domaine, articles cités, issue).

### À la communauté juridique
- Reviewers juridiques humains (avocats émérites, professeurs, doctorants, ONG juridiques) pour passer les fiches en `reviewed_by_legal_expert` et apporter le savoir des pratiques cantonales non-écrites.

## 5. Garanties techniques

- **Traçabilité** : chaque claim affiché → source exacte (article de loi + arrêt + date).
- **Audit trail** : chaque analyse citoyen peut être téléchargée avec ses sources.
- **Gate qualité** : pas d'affichage "leading case" si l'arrêt n'a pas de holding validé et d'article résolu.
- **Badge de fraîcheur** : chaque fiche expose `last_verified_at` et `review_expiry` visibles.
- **Canon completeness métrique publique** : pour chaque intent, nous exposons objectivement si nous avons (base TF + contra/nuance + pratique cantonale + résumé citoyen validé).
- **Disclaimer LLCA sur chaque sortie** : nous ne donnons pas de conseil juridique personnalisé.

## 6. Gouvernance et ouverture

- **Open source des fiches** : les fiches citoyennes peuvent être ouvertes (CC-BY-SA) pour que la communauté puisse les enrichir.
- **Contributions upstream** : nos améliorations de normalisation / classification peuvent être reversées aux projets partenaires.
- **Transparence des métriques** : le dashboard `GET /api/dashboard/metrics` expose publiquement (en mode lecture) les gates passés ou non.

## 7. Ce qui reste à faire

- [ ] Discussion formelle avec Daniel Hürlimann (UNISG, entscheidsuche.ch)
- [ ] Discussion formelle avec l'équipe OpenCaseLaw
- [ ] Contact Open Justice Switzerland
- [ ] Position avec les chancelleries cantonales VD / GE
- [ ] Rédaction op-ed public (Le Temps, RTS, SRF)
- [ ] Éventuelle motion parlementaire (via relais associatifs, FRC, ASLOCA)

---

## Annexes

### A.1 Références
- [Cst 30 al. 3 — Publicité des débats](https://www.fedlex.admin.ch/eli/cc/1999/404/fr#art_30)
- [entscheidsuche.ch API](https://entscheidsuche.ch/pdf/EntscheidsucheAPI.pdf)
- [OpenCaseLaw homepage](https://opencaselaw.ch/)
- [OpenCaseLaw GitHub](https://github.com/jonashertner/caselaw-repo-1)
- [Justitia.swiss — programme national](https://justitia.swiss)
- [Genève — transition numérique de la justice](https://justice.ge.ch//en/content/digital-transition-justice-system)

### A.2 Métrique canon_completeness
Pour qu'un intent citoyen soit considéré `canon_complete`, il doit présenter au minimum :
- **≥ 1 base TF forte** (tier 1 ou 2) avec holding validé
- **≥ 1 contre-cas ou nuance** (role `nuance` OU contra_strength ≥ 3)
- **≥ 1 pratique cantonale** (si variations connues) **— facultatif**
- **≥ 1 résumé citoyen validé** (holding_text non-vide, citizen_summary ≤ 180 chars)

Cible produit : ≥ 80% des fiches des 5 domaines core (bail, travail, dettes, famille, etrangers) en `canon_complete`.
Mesure automatisée via `scripts/evaluate-canon-completeness.mjs`.
