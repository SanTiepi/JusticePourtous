# CLAUDE.md — JusticeBot

## Projet
- Nom : JusticeBot
- Description : Chatbot juridique gratuit pour la Suisse — accès à la justice pour tous
- Stack : Node.js ESM, zero deps, native http
- Marché : 8.9M habitants, 72% citent le coût comme barrière #1 à la justice
- Score tendance : 5/5 (blue ocean total en Suisse)

## Vision
72% des Suisses citent le coût comme barrière principale à la justice. Les consultations juridiques coûtent 300-500 CHF/h. Les permanences gratuites ont des semaines d'attente. JusticeBot = chatbot qui répond aux questions juridiques courantes en langage clair, oriente vers les bons services, et génère des courriers types.

## Le contraire vrai
Le problème n'est pas l'absence de droit. Le problème est que personne ne peut se permettre de l'exercer. JusticeBot ne remplace pas un avocat — il rend l'information juridique accessible AVANT que le problème devienne un litige.

## Modèles inspirés
- GPJ (Portugal) — chatbot gouvernemental guide pratique de la justice
- DoNotPay (USA) — robot juridique (mais sanctionné par FTC pour claims excessifs → on reste modeste)
- LexiAI — chatbots juridiques gratuits multilingues

## Business model
- B2C : 100% gratuit (chatbot + courriers types)
- B2B : cabinets d'avocats (pré-triage clients), assurances protection juridique
- B2G : cantons, communes (outil d'accès à la justice)
- Fondations : Gebert Rüf, Drosos (financement mission)

## Domaines couverts (MVP)
1. Droit du bail (litiges locataires — synergie Habiter/GarantieCheck)
2. Droit du travail (salaire, licenciement — synergie Refugio)
3. Droit de la famille (pension, garde — synergie PensionTrack future)
4. Poursuites et faillites (LP — synergie Boussole)
5. Droit des étrangers (permis, naturalisation — synergie PermisGuide)

## Commandes
```bash
npm test
npm start
```

## Principes
- INFORMER, ORIENTER — jamais conseiller
- Disclaimer sur CHAQUE réponse
- Sources fedlex.admin.ch obligatoires
- Multilingue (FR, DE, IT, EN)
- 100% gratuit, toujours
- Attention au précédent FTC/DoNotPay : NE JAMAIS prétendre être un "avocat robot"
