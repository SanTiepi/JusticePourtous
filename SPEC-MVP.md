# VosDroits — Spec MVP complète

## Architecture 2 tiers

### Tier Gratuit (500 fiches, zéro API)
- Arbre de décision : domaine → sous-domaine → 5 questions filtres → fiche juridique
- 500 fiches pré-rédigées (5 domaines × 100 combinaisons)
- Chaque fiche : explication claire + articles de loi + lien fedlex + jurisprudence TF + modèle lettre + service compétent
- Coût : CHF 0.00/requête

### Tier Premium CHF 50 (wallet CHF 30)
- Requête 1 : ciblage local (gratuit) → identifie les articles pertinents
- Requête 2 : analyse IA Claude Sonnet (CHF 0.03-0.10/requête)
- OCR documents : Mistral OCR ($0.002/page) si upload
- ~200-1100 requêtes par wallet selon complexité
- Coût réel moyen : CHF 8-10, marge 80%

## Stack technique
- Node.js ESM, native http
- Tests : node:test
- Données : JSON/fichiers statiques pour les fiches
- API externes (premium uniquement) : Claude Sonnet API, Mistral OCR API
- Sources : Fedlex SPARQL (gratuit), entscheidsuche.ch API REST (gratuit)

## 5 domaines × fiches MVP

Pour le MVP : 10 fiches par domaine = 50 fiches (pas 500). On scale après.

### Domaine 1 : Bail / Logement (10 fiches)
1. bail_defaut_moisissure — CO 259a (réduction loyer), CO 259g (consignation)
2. bail_defaut_bruit — CO 259a, art. 684 CC (immissions)
3. bail_resiliation_conteste — CO 271, CO 271a (protection contre congé abusif)
4. bail_loyer_abusif — CO 269, CO 269a (loyers abusifs)
5. bail_depot_garantie — CO 257e (restitution), barème SVIT → GarantieCheck
6. bail_charges_contestees — CO 257a-257b (frais accessoires)
7. bail_sous_location — CO 262 (sous-location)
8. bail_travaux_non_faits — CO 256 (obligation d'entretien bailleur)
9. bail_augmentation_loyer — CO 269d (hausse abusive)
10. bail_etat_des_lieux — CO 267-267a (restitution de la chose)

### Domaine 2 : Travail (10 fiches)
1. travail_licenciement_maladie — CO 336c (période protection 30/90/180j)
2. travail_salaire_impaye — CO 322-323 (obligation payer)
3. travail_heures_sup — CO 321c, LTr 12-13 (supplément 25%)
4. travail_harcelement — CO 328 (protection personnalité), LEg 4
5. travail_licenciement_abusif — CO 336-336a (indemnité max 6 mois)
6. travail_certificat — CO 330a (droit au certificat de travail)
7. travail_vacances — CO 329a-329d (droit aux vacances)
8. travail_grossesse — CO 336c, LEg 3 (protection grossesse)
9. travail_accident — LAA 6, LAA 45 (déclaration obligatoire)
10. travail_contrat_oral — CO 320 (contrat valable même oral)

### Domaine 3 : Famille (10 fiches)
1. famille_pension_impayee — CO 217 CP (violation obligation entretien)
2. famille_divorce_procedure — CPC 274ss (procédure simplifiée)
3. famille_garde_modification — CC 134 (modification attribution)
4. famille_pension_montant — CC 285 (calcul contribution entretien)
5. famille_violence_conjugale — CC 28b (mesures protection), CP 126 (voies de fait)
6. famille_succession_reserve — CC 470-471 (réserves héréditaires)
7. famille_reconnaissance_paternite — CC 260-263
8. famille_mesures_provisionnelles — CPC 261-269
9. famille_droit_visite — CC 273 (relations personnelles)
10. famille_curatelle — CC 390-398 (mesures de protection adultes)

### Domaine 4 : Poursuites / Dettes (10 fiches)
1. dettes_commandement_payer — LP 69 (réquisition de poursuite)
2. dettes_opposition — LP 74-75 (opposition, main levée)
3. dettes_minimum_vital — LP 93 (insaisissabilité) → Boussole
4. dettes_acte_defaut_biens — LP 149a (prescription 20 ans)
5. dettes_faillite_personnelle — LP 191 (déclaration insolvabilité)
6. dettes_saisie_salaire — LP 93 (calcul saisie)
7. dettes_arrangement_amiable — pas d'article spécifique, orientation Caritas/CSP
8. dettes_primes_maladie — LAMal 64a (réduction primes)
9. dettes_impots_arrieres — LIFD 167-168 (remise d'impôt)
10. dettes_creancier_abusif — LP 20a (plainte contre office)

### Domaine 5 : Droit des étrangers (10 fiches)
1. etranger_permis_b_c — LEI 34 (conditions permis C)
2. etranger_naturalisation — LN 9-12 (conditions naturalisation) → PermisGuide
3. etranger_regroupement — LEI 42-45 (regroupement familial)
4. etranger_renvoi — LEI 64-64a (renvoi, mesures de contrainte)
5. etranger_permis_travail — LEI 18-25 (conditions admission marché travail)
6. etranger_asile_procedure — LAsi 26-45 (procédure)
7. etranger_sans_papiers_droits — CO 320 al.2 (contrat travail valable) → Refugio
8. etranger_violence_permis — LEI 50 (poursuite séjour après dissolution)
9. etranger_aide_urgence — Cst 12 (droit à l'aide d'urgence)
10. etranger_recours_renvoi — LEI 64 + LTAF (recours au TAF)

## Structure d'une fiche

```json
{
  "id": "bail_defaut_moisissure",
  "domaine": "bail",
  "sousDomaine": "defaut",
  "tags": ["moisissure", "humidité", "défaut", "régie", "réduction", "loyer"],
  "questions": [
    { "id": "q1", "text": "Quel type de défaut ?", "options": ["moisissure", "bruit", "chauffage", "eau", "autre"] },
    { "id": "q2", "text": "Depuis combien de temps ?", "options": ["<1 mois", "1-6 mois", ">6 mois"] },
    { "id": "q3", "text": "Avez-vous signalé le problème ?", "options": ["oui écrit", "oui oral", "non"] },
    { "id": "q4", "text": "La régie a-t-elle répondu ?", "options": ["oui action", "oui sans action", "non"] },
    { "id": "q5", "text": "Votre canton ?", "type": "canton" }
  ],
  "reponse": {
    "explication": "En droit suisse, le bailleur a l'obligation de maintenir le logement en état...",
    "articles": [
      { "ref": "CO 259a", "titre": "Droits du locataire en cas de défaut", "lien": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_259_a" },
      { "ref": "CO 259g", "titre": "Consignation du loyer", "lien": "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_259_g" }
    ],
    "jurisprudence": [
      { "ref": "TF 4A_32/2018", "resume": "Réduction de 20% accordée pour moisissure salle de bain persistante" }
    ],
    "modeleLettre": "Madame, Monsieur,\n\nPar la présente, je vous informe que...",
    "services": [
      { "nom": "ASLOCA Vaud", "tel": "021 617 11 37", "url": "https://vaud.asloca.ch" },
      { "nom": "Commission conciliation", "url": "https://www.vd.ch/..." }
    ],
    "routageEcosysteme": { "habiter": { "condition": "defaut_physique", "url": "habiter.app" } },
    "disclaimer": "Information juridique générale. Ne remplace pas un conseil d'avocat personnalisé."
  },
  "maj": "2026-04-07",
  "sourceLoi": "CO état 2025-01-01"
}
```

## API Endpoints

| Méthode | Path | Description | Tier |
|---------|------|-------------|------|
| GET | `/` | Landing page | Gratuit |
| GET | `/api/health` | Health check | Gratuit |
| GET | `/api/domaines` | Liste 5 domaines | Gratuit |
| GET | `/api/domaines/:id/questions` | Questions du domaine | Gratuit |
| POST | `/api/consulter` | Soumet réponses → fiche juridique | Gratuit |
| GET | `/api/fiches/:id` | Détail d'une fiche | Gratuit |
| GET | `/api/services/:canton` | Annuaire services par canton | Gratuit |
| POST | `/api/premium/analyser` | Analyse IA personnalisée | Premium |
| POST | `/api/premium/lettre` | Génère lettre personnalisée | Premium |
| POST | `/api/premium/ocr` | Upload + OCR document | Premium |
| GET | `/api/premium/credits` | Solde crédits restants | Premium |
| POST | `/api/premium/acheter` | Achat wallet CHF 50 | Premium |

## Frontend — 5 pages

### index.html (landing)
"Vos droits en 5 clics. Gratuit. Anonyme."
5 grandes tuiles : Logement, Travail, Famille, Dettes, Étrangers.
Chiffre choc : "72% des Suisses ne font pas valoir leurs droits à cause du coût."

### consulter.html (arbre de décision)
1 question par écran, barre progression, bouton précédent/suivant.
5 questions max → résultat.

### resultat.html (fiche juridique)
Card structurée : explication + articles (liens fedlex cliquables) + jurisprudence + modèle lettre (copier/coller) + services (numéros cliquables).
Upsell discret : "Analyser votre situation en détail → CHF X estimé"
Routage écosystème : "Vous pourriez aussi être intéressé par [Habiter/Boussole/etc.]"

### premium.html (espace premium)
Login par code session (pas de compte, anonyme).
Solde crédits, historique actions, upload documents.
Estimation coût AVANT chaque action.

### annuaire.html (services par canton)
Select canton → liste services juridiques (permanences, ASLOCA, CSP, syndicats, aide juridictionnelle).

## UI/UX
- Dark mode (#1a1a2e fond, #16213e cartes, #e0e0e0 texte)
- Accent : #2ecc71 (vert justice)
- Mobile-first, max-width 700px
- Font : Inter (Google Fonts)
- Gros boutons tactiles
- Disclaimer permanent en footer
- CSS print-friendly (@media print)

## Tests (40 minimum)

### test/fiches.test.mjs (10)
- Chaque domaine a au moins 10 fiches
- Chaque fiche a les champs requis (id, articles, explication, services)
- Liens fedlex valides (format URL correct)
- Pas de doublons d'id
- Tags non vides
- Questions valides
- Modèle lettre non vide pour fiches avec action
- Services par canton (VD, GE minimum)
- Disclaimer présent sur chaque fiche
- routageEcosysteme valide si présent

### test/consultation.test.mjs (8)
- Domaine bail + moisissure → fiche bail_defaut_moisissure
- Domaine travail + licenciement maladie → bonne fiche
- Domaine inconnu → erreur 400
- Réponses incomplètes → erreur 400
- Canton invalide → erreur 400
- Matching multi-tags fonctionne
- Retourne le bon nombre d'articles
- Retourne les services du bon canton

### test/annuaire.test.mjs (6)
- VD ≥ 3 services
- GE ≥ 3 services
- VS ≥ 1 service
- Canton inconnu → liste vide (pas erreur)
- Chaque service a nom + (tel ou url)
- Types de services variés (asloca, csp, syndicat, conciliation)

### test/premium.test.mjs (8)
- POST /api/premium/acheter → crée wallet avec solde 3000 (centimes)
- POST /api/premium/analyser avec wallet valide → réponse + débit
- POST /api/premium/analyser sans wallet → 403
- POST /api/premium/analyser wallet vide → 402
- GET /api/premium/credits → solde correct
- Estimation coût affichée avant action
- Session anonyme (pas de login, code session)
- Wallet expire après 90 jours

### test/server.test.mjs (8)
- GET / → 200 HTML
- GET /api/health → 200
- GET /api/domaines → 5 domaines
- POST /api/consulter valide → fiche
- GET /api/services/VD → services
- GET /api/fiches/bail_defaut_moisissure → fiche complète
- 404 sur route inconnue
- Headers sécurité (CSP, X-Content-Type-Options)

## Arborescence

```
package.json
src/server.mjs
src/services/consultation.mjs
src/services/fiches.mjs
src/services/annuaire.mjs
src/services/premium.mjs
src/data/fiches/bail.json
src/data/fiches/travail.json
src/data/fiches/famille.json
src/data/fiches/dettes.json
src/data/fiches/etrangers.json
src/data/annuaire.json
src/data/domaines.json
src/public/index.html
src/public/consulter.html
src/public/resultat.html
src/public/premium.html
src/public/annuaire.html
src/public/style.css
src/public/app.js
test/fiches.test.mjs
test/consultation.test.mjs
test/annuaire.test.mjs
test/premium.test.mjs
test/server.test.mjs
```

## Disclaimer (obligatoire sur CHAQUE page et CHAQUE réponse API)

"VosDroits fournit des informations juridiques générales basées sur le droit suisse en vigueur. Il ne remplace pas un conseil d'avocat personnalisé. Les informations sont données à titre indicatif et sans garantie d'exhaustivité. En cas de doute, consultez un professionnel du droit ou contactez les services listés."

## Notes importantes

- Le tier premium est simulé au MVP (pas de vrai Stripe, pas de vraie API Claude). On simule le wallet et les débits pour tester le flow.
- Les 50 fiches doivent contenir du VRAI contenu juridique suisse, pas du placeholder.
- Les liens fedlex doivent pointer vers les VRAIS articles.
- Le concurrent principal est lex4youGPT (TCS) — notre avantage : actionnable (lettres, documents, jurisprudence).
- La LLCA autorise le conseil juridique par des non-avocats — seule la représentation en justice est réservée.
