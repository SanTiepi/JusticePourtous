---
name: Project — état produit JusticePourtous
description: Doctrine produit, vision, business rules, roadmap actif, tâches ouvertes
type: project
scope: projet
status: active
review_after: 2026-12-31
---
# PROJECT — JusticePourtous

> Source détaillée = `CLAUDE.md` du repo (constitution + stratégie). Ce fichier en est la synthèse mémoire vivante. Chiffres vérifiés sur le corpus le 2026-05-28.

## Doctrine produit

### Slogan / promesse
« Vos droits en 5 clics. Gratuit. Anonyme. » — Triage juridique citoyen suisse.

### Ce que le produit EST
- Un **connecteur intelligent** entre citoyens et ressources juridiques vérifiées.
- Un **triage structuré** : le LLM navigue sur nos données vérifiées, identifie, extrait, questionne.
- Cible le **CITOYEN** (remplacer l'avocat quand c'est possible, rediriger quand c'est nécessaire).

### Ce que le produit N'EST PAS (plus important)
- ❌ Pas une base documentaire — un connecteur.
- ❌ Le LLM ne **rédige JAMAIS** de contenu juridique. Le contenu vient des fiches.
- ❌ Jamais « avocat IA » (cadre LLCA + crédibilité).
- ❌ Pas un chatbot conversationnel — le triage structuré est plus fiable.
- ❌ Pas une course aux données vs Swisslex — on gagne sur l'intelligence du triage, pas le volume.
- ❌ Pas d'« OS d'attention » / « gouverneur cognitif » — abstraction élégante qui ne livre rien.

### How to apply
Avant chaque feature : sert-elle le scope citoyen + triage tracé ? Si elle sert le hors-scope → refuser ou questionner.

## Vision écosystème
Partie du **Studio Robin**. Prod publique sur `justicepourtous.ch`. Remote git = `SanTiepi/JusticePourtous`. Tier 2 de l'écosystème (déployé, public).

## Business rules / workflow
- **Disclaimer obligatoire sur CHAQUE réponse.** La LLCA ne réserve PAS le conseil juridique aux avocats.
- **Modèle** : payant dès le triage (2 CHF) ; gratuit = consultation fiches seulement.
- **Moat** = traçabilité + triage citoyen + données cantonales (pas le volume de données).
- **Décisions verrouillées** :
  1. Naviguer vers la bonne fiche et afficher SON contenu — ne jamais générer le contenu juridique soi-même.
  2. Évaluer la complexité par **dimensions structurées** (cascades, confiance, templates, jurisprudence), jamais par mots-clés.
  3. Extraire D'ABORD ce qui est déjà dans le texte — ne pas reposer ce que l'utilisateur a déjà dit.
  4. Si une situation touche plusieurs fiches, les identifier TOUTES.
- **Pipeline agents (D005) = séquentiel**, jamais parallèle (CTO → DataEngineer → FrontendDev → CodexReviewer). Paralléliser = conflits git.

## État produit (vérifié 2026-05-28)
- **314 fiches / 15 domaines** (JSON par domaine dans `src/data/fiches/`).
- **314/314 fiches** ont `claude_review_date` + `claude_legal_review_date` + `claude_legal_review_notes` → **review juridique LLM complète sur tout le corpus** (étendue depuis les 281 actionnables du 2026-04-29). ⚠️ Review par LLM, **PAS par un avocat humain**.
- **0 `reviewed_by_legal_expert` humain** → bloque `gate_phase2` (voir Tâches ouvertes).
- Stack : Node.js ESM, zero deps runtime (docx/resend/stripe seules deps), native http.
- Services clés : `triage-engine`, `knowledge-engine`, `llm-navigator`, `action-planner`, `semantic-search`. Innovations V4 (argumentation Dung/Toulmin, certificat de suffisance, questionneur marginal, comité, compilateur normatif) toutes livrées.
- En prod, dashboard live avec gates (`structurally_validated_passed: true`, `gate_phase2_passed: false` = attend humain).

## Roadmap actif
1. **CRITIQUE** — faire valider 5 fiches gold par 1 vrai avocat (CHF 500-1500) avant de contacter ASLOCA/Caritas. Cibles : `bail_defaut_moisissure`, `bail_resiliation_conteste`, `dettes_commandement_payer`, `etranger_renvoi`, `travail_licenciement_abusif`. Kit pro bono déjà construit (page + 5 dossiers + 5 emails).
2. Recruter 5-10 testeurs réels (réseau Morges/Batiscan) → passer de 0 à ≥5 outcomes mesurables.
3. Sprint adversarial : parké à **30/40 cas** (infra eval CLI + 30 cas + 2 gaps livrés). Reprendre les +10 cas si besoin.

## Tâches ouvertes / blockers
- **0 review humaine** → bloque `gate_phase2` + crédibilité associations. Le plus gros goulot.
- **0 outcomes en prod** → on ne sait PAS si les triages aident réellement les citoyens.
- 2 gaps fiches identifiés par l'éval adversariale (`dettes_cautionnement_personnel`, `bail_trouble_voisinage_locataire`) — à créer **après** validation juridique humaine (cf. `docs/missing-fiches.md`).

## Patterns techniques
- **LLM navigue, ne rédige pas** — toute réponse pointe vers une fiche existante et affiche son contenu.
- **Fiches = données figées** : `src/data/fiches/*.json`, schéma strict (`fiche-schema.mjs`), validées par `audit-fiches-schema.mjs`. Ne jamais modifier le contenu juridique sans validation humaine.
- **LLM-first triage** : Haiku identifie la situation, keyword = fallback only.
- Fallback i18n gracieux à 3 couches (jamais de 5xx sur traduction quand provider LLM down).

## Données legacy
- Champ review = `claude_review_date` / `claude_legal_review_date` (PAS `reviewed_by_claude`, qui n'existe pas — c'était un libellé prose dans l'ancien CLAUDE.md).
- Langues i18n limitées à FR/DE/IT/EN (3 nationales + anglais), pas de PT/AR/SQ/TR/HR en v1.
