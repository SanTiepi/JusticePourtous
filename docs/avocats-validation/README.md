# Validation juridique gratuite — plan d'action Robin

**Objectif** : faire valider 5 fiches gold par 1+ vrais avocats avant de contacter les associations.
**Coût visé** : CHF 0 (pro bono, étudiants, assos qui valident leur propre domaine).
**Date** : 2026-04-30
**Durée estimée** : 2-4 semaines pour avoir au moins 2 retours.

---

## 5 fiches gold prioritaires

| Fiche | Domaine | Cible naturelle | Pourquoi |
|---|---|---|---|
| `bail_defaut_moisissure` | Bail | **ASLOCA Vaud** | Leur cœur de métier, ils ont des juristes salariés |
| `bail_resiliation_conteste` | Bail | **ASLOCA Vaud** ou Genève | Délai 30j péremptoire, enjeu fort |
| `dettes_commandement_payer` | Dettes | **Caritas Vaud** ou **CSP Vaud** | Service de désendettement = juristes spécialisés LP |
| `etranger_renvoi` | Étrangers | **CSP Vaud** ou **Centre social protestant Genève** | Ils ont des juristes spécialisés droit des étrangers |
| `travail_licenciement_abusif` | Travail | **Syndicat Unia VD** ou **Bureau de l'égalité VD** | Délai 180j, juristes accessibles |

---

## 7 canaux de validation gratuite à activer en parallèle

### A) Associations spécialisées (le plus prometteur)
Elles valident **leur** domaine — c'est leur intérêt direct (tu deviens un canal qui dirige vers elles).

1. **ASLOCA Vaud** (Lausanne) — Rue Jean-Jacques-Cart 8, **021 617 11 37**, formulaire : https://vaud.asloca.ch/contact (pas d'email public)
   - Cible : 2 fiches bail
   - Argument : "Je dirige des locataires vers vous depuis JusticePourtous, je veux m'assurer que mes fiches bail sont juridiquement irréprochables avant d'augmenter le trafic vers ASLOCA"

2. **Caritas Vaud — Service désendettement** — **021 317 59 80**, **info@caritas-vaud.ch**
   - Cible : fiche dettes_commandement_payer
   - Argument similaire

3. **CSP Vaud (Centre social protestant)** — **021 560 60 60**, **info@csp-vd.ch**
   - Cible : etranger_renvoi (ils ont la consultation juridique pour étrangers à Vevey)

4. **Unia VD (syndicat)** — **0848 606 606**, **vaud@unia.ch**
   - Cible : travail_licenciement_abusif

### B) Universités — Cliniques juridiques étudiantes
Étudiants en master + supervision prof. C'est leur exercice pédagogique.

5. **UNIL Law Clinic** (Lausanne) — Faculté de droit, dirigée par 6 professeurs
   - Site : https://www.unil.ch/ecolededroit/fr/home/ressources/espaces/etudiantes/clinique.html
   - **Pas d'email générique**. Cibler directement :
     - **Prof. Evelyne Schmid** (droit international public — projets droits humains/migration) : **evelyne.schmid@unil.ch**
     - Prof. Audrey Lebret (vulnérabilité)
     - Prof. Véronique Boillet (droit suisse public)
   - Encadrée par professeurs, étudiants en master font des avis juridiques pour ONG/projets sociaux GRATUITEMENT (juin-décembre)
   - **Le plus prometteur pour validation systématique**

6. **UNIGE — Centre Suisse de Compétence pour les Droits Humains** ou **Pôle pratique du droit**
   - Email : droits-humains@unige.ch

### C) LinkedIn / réseaux pro
Post visible appelant au pro bono review.

7. **LinkedIn Swiss Legal Community** — post personnel
   - Tag : #DroitSuisse #LegalTech #ProBono
   - Argument : "Open access, hors marché avocats, projet citoyen Swiss-only"

### D) Réseau personnel
Avocats que tu connais (Morges, Vaud) — 1 café = 30 min de review sur 1 fiche.

---

## Process de validation

Pour chaque fiche, le validateur reçoit :

1. **PDF / MD** (`docs/avocats-validation/<fiche>.md`) :
   - L'explication telle qu'elle apparaît au citoyen
   - Articles cités + jurisprudence
   - Cascade d'actions
   - Modèle de lettre
   - Anti-erreurs

2. **Grille de review** (`docs/avocats-validation/grille-review.md`) :
   - 6 questions courtes (5 min/fiche)

3. **Promesse de retour** : "Si tu valides, on ajoute le label `reviewed_by_<ton_nom>` sur la fiche en prod, visible aux citoyens. Tu peux poser la condition (anonyme / nom complet / asso)."

---

## Template d'email (à adapter par cible — voir `email-template.md`)

Personnalisé pour chaque destinataire. Privilégier :
- Email court (5 lignes max + lien vers le dossier de review)
- Approche "vérification croisée" plutôt que "validation par expert"
- Disclaimer fort que c'est volontaire et que leur retour n'engage pas leur responsabilité

---

## Contre-arguments aux objections probables

| Objection | Réponse |
|---|---|
| "Je n'ai pas le temps" | "5 minutes par fiche, juste cocher OK / pas OK / commentaire optionnel" |
| "Ça engage ma responsabilité" | "Disclaimer explicite : votre retour est consultatif, ne crée aucune obligation, anonymisable" |
| "C'est de l'IA, c'est dangereux" | "Précisément — c'est pourquoi on demande votre regard. Sans vous, on déploie aveuglément" |
| "Pourquoi gratuit ?" | "Projet citoyen Swiss, modèle freemium 2 CHF/triage. Pas de fonds pour CHF 500-1500/fiche actuellement. Nous sommes 1 personne." |
| "Je veux être listé comme reviewer" | "Avec plaisir — labels reviewed_by_<nom> visible sur la fiche en prod" |

---

## Plan d'action concret (à exécuter cette semaine)

**Lundi-Mardi** :
- Envoyer email à ASLOCA Vaud (1 fiche) — `email-asloca.md`
- Envoyer email à UNIL Law Clinic — `email-unil-law-clinic.md` (canal le plus structuré)

**Mercredi** :
- Post LinkedIn — `post-linkedin.md`

**Jeudi-Vendredi** :
- Suivi téléphonique ASLOCA (les emails restent souvent sans réponse)
- Email à Caritas Vaud + Unia + CSP

**Semaine suivante** :
- Suivre retours, traiter feedbacks
- Si retour positif d'1 reviewer, marquer `reviewed_by_legal_expert: <nom>` dans la fiche
- Si seuil 5 fiches reviewées atteint → contact ASLOCA/Caritas pour partenariat
