# CLAUDE.md — VosDroits.ch

## Projet
- Nom : VosDroits
- Domaine : vosdroits.ch
- Description : La base de données ultime du droit suisse. Pré-conseil juridique gratuit + assistance à la rédaction avancée. Plus besoin d'avocat pour les affaires simples.
- Stack : Node.js ESM, zero deps, native http
- Marché : 8.9M habitants, 72% citent le coût comme barrière #1 à la justice
- Score tendance : 5/5 (blue ocean total en Suisse)

## Vision

VosDroits.ch est la couche d'accès intelligente entre le droit suisse et les citoyens. Un avocat coûte 300 CHF/h. Un LLM coûte 0.03 CHF/requête. Le gap est de 10'000x — mais le citoyen ne sait pas écrire un prompt juridique. VosDroits est le traducteur.

**3 niveaux :**
1. **Gratuit** — Base de données juridique exhaustive. 500+ fiches avec articles de loi, jurisprudence TF, modèles de lettres, annuaire services. Le Wikipedia du droit suisse pratique.
2. **Premium (CHF 50)** — Analyse personnalisée par IA. Upload de documents, OCR, génération de courriers sur mesure, estimation des chances. Wallet transparent (coût affiché AVANT chaque action).
3. **Pro (futur)** — API pour associations, assurances PJ, services sociaux. Intégration écosystème.

## Positionnement
- PAS un "avocat robot" (leçon DoNotPay)
- PAS juste un FAQ (différence avec lex4youGPT du TCS)
- C'est un **outil d'action** : chaque fiche mène à un geste concret (lettre, formulaire, numéro, démarche)

## Le moat
1. **L'index juridique suisse** — 500+ fiches pré-rédigées avec articles exacts, jurisprudence TF, barèmes. Le LLM est interchangeable. L'index ne l'est pas.
2. **La traduction problème → prompt** — arbre de décision qui cible AVANT que l'IA analyse
3. **La traduction réponse → action** — pas "voici l'article 259a CO" mais "voici la lettre à envoyer lundi"
4. **Connaissance locale** — CO 259a, barème SVIT, commissions de conciliation vaudoises, BRAPA vs SCARPA. Aucun LLM généraliste ne connaît ça.

## Sources de données
- Fedlex SPARQL API (gratuit, legislation fédérale)
- entscheidsuche.ch API REST (gratuit, jurisprudence fédérale + cantonale)
- LexFind (lois cantonales)
- HuggingFace dataset 116k+ arrêts TF

## Cadre juridique
- La LLCA ne réserve PAS le conseil juridique aux avocats. Seule la représentation en justice est réservée.
- Disclaimer obligatoire sur CHAQUE réponse
- Ne jamais dire "avocat IA" ou "remplace un avocat"
- Assurance RC pro à prévoir
- Suivre le projet de loi IA du Conseil fédéral (fin 2026)

## Hub écosystème
VosDroits connecte tous les projets du studio :
- Bail → Habiter + GarantieCheck
- Travail → Refugio
- Dettes → Boussole
- Permis → PermisGuide
- Droits sociaux → DroitsRadar
- Anti-scam → Trankill

## Commandes
```bash
npm test
npm start
```

## Structure
```
src/           — API + services
src/services/  — consultation, fiches, annuaire, premium
src/data/      — fiches JSON (5 domaines), annuaire, domaines
src/public/    — frontend (5 pages HTML + CSS + JS)
test/          — tests (node:test)
```
