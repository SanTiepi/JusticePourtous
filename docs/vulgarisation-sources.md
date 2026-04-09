# Sources de vulgarisation juridique suisse à exploiter

## Objectif
JusticePourtous a déjà la loi brute via Fedlex. Le manque n'est pas la norme, c'est la traduction de la norme en parcours compréhensibles pour des non-juristes.

Le bon angle n'est donc pas de "scraper tout le droit suisse", mais d'identifier les acteurs qui font déjà bien au moins une des choses suivantes :
- découper un problème juridique en étapes concrètes;
- simplifier le vocabulaire;
- expliciter les delais, formulaires, exceptions et acteurs;
- relier droit + action pratique + service d'aide.

## Lecture rapide

### Top 5 à exploiter en priorité
1. `ch.ch` pour la structure citoyenne federale, les FAQ courtes, les parcours par situation et le multilingue.
2. `Guide Social Romand` pour les fiches sociojuridiques reliees au terrain romand et les annuaires d'acteurs.
3. `lex4you` pour ses parcours hyper actionnables, checklists, phases, formulaires et cas d'usage.
4. `ASLOCA / Mieterverband` pour le bail, les motifs concrets de contestation, les lettres types et les cas pratiques.
5. `Caritas / Parlons Cash / Dettes conseils` pour la dette, le budget et l'orientation vers l'aide adaptee.

### A ne pas confondre
- `Source de contenu`: utile pour enrichir le copilote.
- `Source de patterns editoriaux`: utile pour apprendre a mieux expliquer.
- `Source d'escalade`: utile pour orienter l'utilisateur vers un humain, mais pas comme corpus principal.

## Sources par categorie

### 1. Portails publics de vulgarisation

#### 1) ch.ch
- URL: https://www.ch.ch/fr/
- Pages representatives:
  - https://www.ch.ch/fr/loyers-droits-et-obligations-du-locataire
  - https://www.ch.ch/fr/travail/chomage--demission--licenciement/demission-et-licenciement
  - https://www.ch.ch/fr/impots-et-finances/dettes--poursuites-et-faillites/poursuites
  - https://www.ch.ch/fr/impots-et-finances/dettes--poursuites-et-faillites/dettes
- Ce qu'ils font bien:
  - Langage tres simple, centré "ce que vous devez faire".
  - Structure recurrente avec blocs ouvrables, FAQ, "Bon a savoir", contacts utiles.
  - Couvre tres bien les situations du quotidien en langage citoyen.
  - Multilingue, avec certains contenus relayes en video.
- Ce qu'on pourrait en tirer:
  - Des patrons de reponse du type `situation -> regle -> exception -> prochaine etape`.
  - Des intitulés de questions que se pose vraiment un citoyen.
  - Des liens normalises vers services et autorites.
  - Des brochures utiles comme "Le logement en Suisse" mentionnee sur les pages logement.
- Strategie d'integration:
  - En faire une source `P1` pour le ton, les FAQ et la detection d'intention utilisateur.
  - Indexer page par page en conservant la hiérarchie des sections.
  - Utiliser les titres des FAQ comme graines pour les intents et les reformulations de requetes.
  - Toujours relier chaque fiche derivee aux articles de loi Fedlex et aux autorites competentes.

#### 2) SECO - Conditions de travail et brochures
- URL: https://www.seco.admin.ch/seco/fr/home/Arbeit.html
- Pages representatives:
  - https://www.seco.admin.ch/seco/fr/home/Arbeit/Arbeitsbedingungen/Arbeitnehmerschutz/Arbeits-und-Ruhezeiten.html
  - https://www.seco.admin.ch/depliant-duree-du-travail-et-du-repos
- Ce qu'ils font bien:
  - Excellent niveau d'exactitude sur le droit du travail applique.
  - Tres bons supports de type brochure/depliant "l'essentiel en bref".
  - Bonne granularite sur temps de travail, repos, travail de nuit, protection de la sante.
- Ce qu'on pourrait en tirer:
  - Des regles fiabilisées pour le domaine travail.
  - Des snippets structurés du type `regle chiffrée + exception + autorisation`.
  - Un format de micro-fiche tres utile pour reponses courtes.
- Strategie d'integration:
  - Source `P1` pour les reponses normatives sur le travail.
  - Parser les pages thematiques + les PDF en fiches atomiques.
  - Faire remonter explicitement les seuils, durees, delais et autorisations dans des champs structures.
  - Ne pas se limiter au HTML: les brochures PDF sont probablement les meilleurs resumes.

#### 3) ge.ch - guides thematiques cantonaux
- URL: https://www.ge.ch/
- Page representative:
  - https://www.ge.ch/respecter-temps-travail-repos-ses-employes/enregistrement-du-temps-travail
- Ce qu'ils font bien:
  - Navigation procedurale tres claire avec "L'essentiel en bref" puis sous-parties.
  - Contenu recent et explicitement maintenu.
  - Bon compromis entre vulgarisation et precision administrative.
- Ce qu'on pourrait en tirer:
  - Un pattern editorial tres fort pour les parcours cantonaux.
  - Des blocs `essentiel / details / sanctions / contact professionnel`.
  - Des variations cantonales ou pratiques d'execution utiles a signaler au bon moment.
- Strategie d'integration:
  - Utiliser `ge.ch` comme modele de pages "guide procedural".
  - Ne pas le generaliser a toute la Suisse sans taguer `canton=GE`.
  - Dans le produit, afficher les variantes cantonales uniquement quand le canton est connu ou demande.

#### 4) Etat de Vaud / Parlons Cash
- URL: https://www.vd.ch/aides-financieres-et-soutien-social/2023-parlons-cash-dettes-et-surendettement
- Site associe: https://www.parlons-cash.ch/
- Ce qu'ils font bien:
  - Approche ultra citoyenne, sans jargon, orientee prevention et reprise en main.
  - Tres bonne articulation entre telephone, accompagnement, cours, temoignages, videos et ressources.
  - Excellent exemple de vulgarisation dettes/budget non culpabilisante.
- Ce qu'on pourrait en tirer:
  - Le vocabulaire utilisateur reel autour de l'endettement.
  - Des scripts de triage et d'orientation.
  - Des formats pedagogiques courts, y compris video.
- Strategie d'integration:
  - Source `P1` pour le ton et les parcours d'accompagnement dette.
  - Ne pas seulement indexer le texte: extraire aussi les `ressources utiles`, `types d'aide` et `criteres d'orientation`.
  - Reproduire leur style de guidance en 2 temps: `on vous ecoute -> on agit avec vous`.

#### 5) Portail des poursuites
- URL: https://online-services.admin.ch/fr/service/le-portail-des-poursuites-prestations-pour-les-creanciers/
- Ce qu'ils font bien:
  - Traduit une procedure abstraite en service concret.
  - Tres utile pour relier information juridique et action operationnelle.
- Ce qu'on pourrait en tirer:
  - Les points d'entree concrets pour "que faire maintenant".
  - Des liens service/formulaire a injecter en fin de reponse.
- Strategie d'integration:
  - Source `P2`, pas pour la vulgarisation pure mais pour l'atterrissage operationnel.
  - Brancher ces services comme CTA contextuels apres explication de la procedure LP.

### 2. Associations et aides juridiques / sociales

#### 6) ASLOCA Suisse romande
- URL: https://www.asloca.ch/
- Ce qu'ils font bien:
  - Forte expertise terrain sur le bail.
  - Sait expliquer les conflits concrets des locataires: hausse de loyer, resiliation, defauts, contestation.
  - Bon niveau de concretude militante: on comprend vite ce qui est attaquable et comment reagir.
- Ce qu'on pourrait en tirer:
  - Les cas d'usage les plus frequents des locataires.
  - Les arguments pratiques et points de vigilance avant procedure.
  - Des signaux pour classer une situation comme `contestation probable`.
- Strategie d'integration:
  - Source `P1` sur le bail, surtout comme `surcouche pratique` au-dessus du CO.
  - A utiliser en parallele de sources plus neutres pour eviter un biais univoque.
  - Tres utile pour generer checklists et warnings.

#### 7) Mieterverband (Suisse alemanique)
- URL: https://www.mieterverband.ch/
- Page representative:
  - https://www.mieterverband.ch/mv/mietrecht-beratung/ratgeber-mietrecht/.html
- Ce qu'ils font bien:
  - Ratgeber tres bien structure avec top themes, cas concrets, checklists, modeles et lettres types.
  - Formulation simple, souvent precedee par "Das Wichtigste in Kürze".
  - Couverture large des situations de location et forte densite de contenu pratique.
- Ce qu'on pourrait en tirer:
  - Une base germanophone de grande valeur pour le bail.
  - Des patrons de resume courts suivis de details.
  - Des lettres types et checklists tres facilement transformables en composants produit.
- Strategie d'integration:
  - Source `P1` sur le bail en allemand.
  - Faire un alignement FR/DE des themes pour identifier les invariants nationaux et les differences cantonales.
  - Utiliser le corpus surtout pour extraire `actions`, `preuves a reunir`, `delais`, `modele de courrier`.

#### 8) Caritas Suisse - Service Dettes conseils
- URL: https://www.caritas.ch/fr/service-dettes-conseils/
- Ce qu'ils font bien:
  - Tres bonne articulation entre prevention, conseils, hotline, guide pratique et accompagnement.
  - Vocabulaire accessible pour les personnes en fragilite.
  - Ancre les dettes dans la vraie vie: sante, famille, emploi, pauvreté.
- Ce qu'on pourrait en tirer:
  - Une taxonomie "probleme d'argent" plus humaine que purement juridique.
  - Des parcours d'orientation, pas seulement des explications de la LP.
  - Des objets de contenu du type `premiers gestes`, `quand demander de l'aide`, `vers qui aller`.
- Strategie d'integration:
  - Source `P1` pour les cas dettes/surendettement.
  - Utiliser Caritas pour la couche `accompagnement et prevention`, Fedlex/ch.ch pour la couche `procedure`.
  - Connecter automatiquement vers les aides humaines quand la situation semble trop degradee.

#### 9) CSP Geneve - Questions d'argent
- URL: https://csp.ch/geneve/services/questions-dargent/
- Ce qu'ils font bien:
  - Tres concret sur les formes de soutien reel.
  - Bon point d'entree pour les personnes qui ne savent pas si elles ont un "probleme juridique" ou juste une situation qui derape.
- Ce qu'on pourrait en tirer:
  - Des patterns de triage vers budget, assainissement, demarches administratives et soutien psychosocial.
  - Une vision terrain des besoins qui precede souvent la question juridique explicite.
- Strategie d'integration:
  - Source `P2`, surtout pour l'escalade humaine et les parcours de soutien.
  - A utiliser comme repertoire de referral plutot que comme corpus doctrinal.

### 3. Vulgarisation / editeurs specialises

#### 10) Guide Social Romand
- URL: https://www.guidesocial.ch/
- Page cle:
  - https://www.guidesocial.ch/contenu-et-avertissement
- Ce qu'ils font bien:
  - Excellente promesse editoriale: information synthétique, pratique, actuelle.
  - Couvre bail, travail, dettes, assurances, famille.
  - Relie contenu legal + renvois legislatifs + annuaire d'institutions.
  - Tres bonne pertinence romande pour citoyens et travailleurs sociaux.
- Ce qu'on pourrait en tirer:
  - Des fiches sociojuridiques proches des besoins quotidiens.
  - Une mine pour le graphe `probleme -> droit -> organisme competent`.
  - Des entites "acteur/institution" tres utiles pour l'orientation locale.
- Strategie d'integration:
  - Source `P1` pour le corpus explicatif romand.
  - Crawler les fiches et separer distinctement `contenu juridique` et `adresses`.
  - Faire de GSR la colonne vertebrale des recommandations d'organismes.

#### 11) lex4you
- URL: https://www.lex4you.ch/
- Ce qu'ils font bien:
  - Sans doute l'un des meilleurs decoupages en `phases`, `checklists`, `adresses & anlaufstellen`, `rechtsweg`.
  - Contenu tres actionnable, presque "copilote" avant l'heure.
  - Excellent usage des delais, formes, chiffres et documents.
  - Associe reponses, downloads PDF, checklists et questions concretes.
  - Le site expose aussi `lexTalk` et renvoie vers YouTube et Spotify.
- Ce qu'on pourrait en tirer:
  - Le meilleur pattern d'orchestration conversationnelle.
  - Une structure quasi native pour un agent: `Phase 1`, `Phase 2`, `Phase 3`, `Rechtsweg`.
  - Des listes de preuves, documents, courriers, timing.
- Strategie d'integration:
  - Source `P1` pour les flows et non seulement pour le texte.
  - Transformer leurs "phases" en etats de dossier dans JusticePourtous.
  - Utiliser les checklists comme sorties generees dynamiquement.
  - Surveiller la question des droits/licences avant ingestion massive.

#### 12) Beobachter - Rechtsratgeber
- URL: https://www.beobachter.ch/
- Page representative:
  - https://www.beobachter.ch/beratung/rechtsratgeber/konsum/schulden-betreibung-und-konkurs/schuldenberatung-sanierung-und-konkurs
- Ce qu'ils font bien:
  - Grande maturite editoriale sur les situations juridiques du quotidien.
  - Tres bons formats `Merkblatt`, `Checkliste`, `Grundlage`, `Adressen und Links`.
  - Fort ancrage dans les cas concrets de consommateurs.
- Ce qu'on pourrait en tirer:
  - Des patterns editoriaux premium tres solides.
  - Des schemas de classement des contenus par niveau d'action.
- Strategie d'integration:
  - Source `P2` comme benchmark editorial.
  - A priori plutot pour inspiration produit que pour ingestion primaire, a cause de l'acces et des droits.
  - Tres utile pour valider si vos sorties "sonnent comme un vrai guide grand public".

#### 13) droit-bilingue.ch
- URL: https://www.droit-bilingue.ch/fr-it/index.html
- Ce qu'ils font bien:
  - Donne un pont terminologique entre langues juridiques suisses.
  - Utile pour des correspondances lexicales FR/IT, et selon les sections pour la navigation par domaines.
- Ce qu'on pourrait en tirer:
  - Un mini-lexique multilingue pour les termes juridiques et administratifs.
  - Des aides a la reformulation et a la recherche cross-lingue.
- Strategie d'integration:
  - Source `P3`, pas une vraie source de vulgarisation citoyenne.
  - A utiliser comme couche de normalisation terminologique, pas comme corpus de reponses.

### 4. Formats media et guides pratiques

#### 14) Brochures et PDF officiels a forte valeur
- Exemples:
  - `ch.ch` mentionne la brochure "Le logement en Suisse" en 19 langues.
  - `SECO` publie des depliants "l'essentiel en bref" sur les horaires, le repos, etc.
  - `lex4you` et `Mieterverband` proposent checklists, modeles et PDF telechargeables.
- Ce qu'ils font bien:
  - Compression maximale de l'information.
  - Tres bon support pour extraction de listes, delais, documents et sequences d'action.
- Ce qu'on pourrait en tirer:
  - Des micro-fiches tres robustes.
  - Des checklists natives plutot que des paragraphes.
- Strategie d'integration:
  - Prioriser l'extraction structuree des PDF avant OCR brut.
  - Sauvegarder les assets comme `template`, `checklist`, `modele`, `brochure`.

#### 15) Videos et contenus media utiles
- Exemples verifies:
  - `ch.ch` embarque des videos sur certaines pages travail/chomage.
  - `Parlons Cash` publie des videos sur la dette et l'accompagnement.
  - `lex4you` propose `lexTalk` et renvoie vers YouTube/Spotify depuis son site.
- Ce qu'ils font bien:
  - Ils montrent comment parler du droit sans tone professoral.
  - Tres utiles pour repérer les formulations les moins intimidantes.
- Ce qu'on pourrait en tirer:
  - Scripts, transcriptions, FAQ orales, signaux de langage naturel.
- Strategie d'integration:
  - Ne pas en faire une source principale de droit.
  - Les utiliser pour enrichir le ton, les reformulations et les explications pas a pas.

## Recommandation d'integration pour JusticePourtous

### Couche 1 - Base de vulgarisation generaliste
- `ch.ch`
- `Guide Social Romand`
- `SECO`

Usage:
- RAG principal pour expliquer simplement la loi.
- Construction d'intents citoyens.
- Generation de fiches "en bref".

### Couche 2 - Verticales fortes
- `ASLOCA`
- `Mieterverband`
- `lex4you`
- `Caritas`
- `Parlons Cash`

Usage:
- Surcouche expertise bail / dettes / parcours.
- Extraction de checklists, courriers, documents, delais, preuves, etapes.
- Generation d'arbres de decision.

### Couche 3 - Orientation humaine et locale
- `Guide Social Romand` annuaire
- `CSP`
- `Caritas`
- services cantonaux
- `Portail des poursuites`

Usage:
- Quand il faut envoyer vers un service, une permanence, une autorite ou un formulaire.
- Quand la situation depasse le simple conseil informationnel.

### Couche 4 - Inspiration produit
- `Beobachter`
- certains PDF SECO
- certaines brochures logement

Usage:
- Benchmark de ton, structure, niveau de concretude.
- Pas forcement corpus principal.

## Patterns editoriaux a copier
- `L'essentiel en bref` avant les details.
- `Questions citoyennes` comme titres, pas `articles juridiques`.
- `Que faire maintenant ?` en fin de reponse.
- `Delais / pieces / autorite / cout / risque` dans des champs visibles.
- `Bon a savoir` pour les exceptions.
- `Parcours par phases` plutot qu'un bloc de texte.
- `Contacts utiles` et `escalade humaine` en fin de flow.
- `Version cantonale` lorsque la pratique varie.

## Plan d'exploitation concret

### P1 - A faire tout de suite
- Crawler `ch.ch`, `Guide Social Romand`, `SECO`, `lex4you`, `ASLOCA/Mieterverband`, `Caritas`, `Parlons Cash`.
- Normaliser chaque page en:
  - `domaine`
  - `theme`
  - `question citoyenne`
  - `reponse breve`
  - `etapes`
  - `delais`
  - `documents`
  - `autorites`
  - `contacts`
  - `canton`
  - `source_url`
- Relier chaque fiche a un ou plusieurs articles Fedlex.

### P2 - A faire ensuite
- Extraire les PDF, checklists et modeles.
- Construire un classifieur `situation -> parcours`.
- Ajouter un router `information -> action -> escalade`.

### P3 - A surveiller
- Conditions d'utilisation et droits de reutilisation.
- Date de mise a jour des contenus.
- Biais institutionnel ou militant de certaines sources.
- Variantes cantonales a ne pas sur-generaliser.

## Conclusion
Si l'objectif est de "ne pas reinventer la vulgarisation", le meilleur montage n'est pas une seule source miracle.

Le bon mix semble etre:
- `ch.ch + SECO` pour la colonne vertebrale institutionnelle;
- `Guide Social Romand + Caritas + Parlons Cash` pour parler comme les gens et orienter dans la vraie vie;
- `ASLOCA/Mieterverband + lex4you` pour transformer des regles abstraites en checklists, courriers et etapes concretes.

Autrement dit: Fedlex donne la verite juridique, mais ces sources donnent la forme intelligible.
