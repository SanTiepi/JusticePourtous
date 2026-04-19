# Brainstorm stratégique — JusticePourtous 2026+

Document de travail. À relire trimestriellement. Tranche les orientations produit.

## Constat de départ honnête (2026-04-19)

Le produit a le **substrat technique complet** :
- 15 domaines, 284 fiches, 100 règles normatives, 2521 arrêts TF indexés
- Pipeline triage multi-round + compte citoyen 12 mois + lettres DOCX/PDF
- Dashboard live 8 axes + benchmark ×5.4 vs LLM brut structurel
- 100% `reviewed_by_claude`, 0% `reviewed_by_legal_expert`

Ce qui **bloque l'ambition "leader citoyen"** n'est plus technique :
1. Pas d'utilisateurs réels → pas de priorisation par trafic
2. Pas de reviewer humain → manque crédibilité auprès de certaines cibles
3. Pas de données outcomes → pas de prédiction "12 citoyens similaires ont obtenu X"
4. Fragmentation jurisprudence cantonale → invisible pour le citoyen

## Axe 1 — Data moat cantonal (nouveau)

**Opportunité** : la jurisprudence cantonale et de 1ère instance est une lacune démocratique (Cst art. 30 al. 3 vs réalité fragmentée). Entscheidsuche.ch agrège 800'000+ décisions en libre. Nous ingérons, matchons aux fiches, exposons au citoyen.

**Différenciateur** : aucun concurrent n'expose "5 décisions VD 1ère instance similaires à votre cas". Swisslex monétise, Weblaw aussi. Nous ouvrons gratuitement.

**Actions concrètes** :
- `scripts/ingest-entscheidsuche.mjs` (livré, mode mock + live)
- `src/services/cantonal-juris-matcher.mjs` (livré, matching par score)
- Brancher dans `enrichFiche` pour afficher sous chaque réponse
- Partenariat entscheidsuche : contribuer (signaler, anonymiser, OCR retour)

**Moat défensif** : positionnement civique — un avocat commercial ne peut pas critiquer publiquement "accès libre au droit".

## Axe 2 — Flywheel outcomes anonymisés

Le **data moat ultime** est unique à nous : aucun concurrent n'a ces données.

**Flywheel** :
1. Citoyen fait un triage
2. 30 jours après, prompt "comment ça s'est passé ?" (consent strict)
3. Donnée anonymisée stockée (k=5 anonymisation)
4. À 500+ outcomes : prédiction par similarité
5. Plus les users → plus de data → meilleure prédiction → plus de users

**Non-réplicable** par LLM ou Swisslex car ils n'ont pas la relation directe citoyen.

**Actions** :
- `outcomes-tracker.mjs` livré (base technique prête)
- Brancher prompt front à J+30 post-triage (citizen-ui.js a renderOutcomesPrompt)
- Seuil k=5 attendu : ~500 users/mois pendant 3 mois = 1500 outcomes → stats utiles
- **Bloqué par acquisition users**

## Axe 3 — Acquisition citoyenne sans budget

Le vrai goulot. **3 leviers asymétriques** :

### 3.1 SEO intent-first (déjà livré)
253 pages guides + sitemap 262 URLs + robots.txt. Chaque intent fréquent = page optimisée avec CTA vers triage. Une fois indexé : trafic organique long-terme sans budget.

### 3.2 Partenariat ONG (alignement parfait)
ASLOCA, LAVI, CSP, Caritas, Pro Senectute. Leurs juristes sont débordés par cas simples. Nous absorbons → ils se concentrent sur complexes. Co-branding fiches + orientation mutuelle. Coût : 0.

### 3.3 Médias et presse
Angle fort : "Pourquoi la Suisse ne publie pas ses arrêts cantonaux ?" + "JusticePourtous donne accès gratuit à ce que les avocats paient". Le Temps, RTS, 24Heures, Blick adorent ce genre de story. Coût : rédaction 1 op-ed + ciblage journalistes.

## Axe 4 — Ce que les avocats savent et pas nous

5 gaps structurels :
1. **Pratiques cantonales non-écrites** — Comment se comporte la commission de conciliation VD vs GE
2. **Jurisprudence cantonale / 1ère instance** — Partiellement résolu par entscheidsuche
3. **Données qui changent en continu** — Minimum vital, taux OFL, barèmes
4. **Doctrine académique récente** — BSK, Stämpfli
5. **Savoir performatif / relationnel** — Comment plaider, quand céder

**Compensations techniques** :
- (1) Interviews anonymisées 20 avocats par domaine × 2h → corpus "pratiques terrain" indexé
- (2) Scraper entscheidsuche ✅
- (3) Cron hebdomadaire des chiffres mis à jour (déjà pour Fedlex diff, étendre aux barèmes)
- (4) Partenariat universités (citer doctrine contre crédit académique)
- (5) Non-compensable — positionner comme "complémentaire avocat", jamais substitut

## Axe 5 — Reviewers humains : qui vraiment

(cf. discussion précédente) 6 profils sans conflit d'intérêt :
1. **ONG juridiques** (alignement parfait — ASLOCA, LAVI, CSP)
2. **Avocats émérites / retraités** (narcissisme légitime + légacy)
3. **Professeurs de droit** (marketing académique)
4. **Doctorants** (crédit CV + revenu)
5. **Permanences cantonales publiques** (mission d'accès au droit)
6. **Juristes d'entreprise retraités** (savoir opérationnel pointu)

**Cible #1 immédiate** : ASLOCA Vaud + permanence juridique cantonale VD. Alignement parfait, coût politique minimal, effet de crédibilité maximum.

## Axe 6 — Modèle économique repensé

### Actuel
- Gratuit : round 1 + consultation fiches
- Payant : 2 CHF pour continuation triage
- Premium : 30 CHF wallet pour analyses pipeline V3 + lettres

### Alternatives à envisager
- **Abonnement citoyen** : 5 CHF/mois illimité = tranquillité pour gens avec dossiers en cours longs
- **Tarif associatif** : ONG partenaires paient un forfait pour accès priorité + marque blanche
- **Pro bono croisé** : abonnement cabinet d'avocats → leur donne notre outil pour première rencontre clients (ils nous délèguent le triage initial, gagnent du temps)
- **Revenus publics** : certains cantons financent l'accès au droit. VD/GE pourraient subventionner notre outil via mandat "orientation citoyenne"
- **Freemium strict** : tout gratuit sauf outputs actionnables (lettre PDF, envoi recommandé).
- **Lettres envoyées** : partenariat La Poste e-lettre → 5 CHF par courrier recommandé envoyé. Valeur concrète, facile à valider.

### Mon analyse
**L'abonnement citoyen individuel ne marche pas** : fréquence d'usage trop faible. Les gens oublient.

**Le plus prometteur** : **mandat cantonal** (VD ou GE finance 30'000 CHF/an pour intégration officielle dans leur portail citoyen) + **e-lettres La Poste** (pay-per-use, valeur concrète, scale naturellement).

## Axe 7 — Risques et menaces

1. **OpenAI / Anthropic pushent un "LLM juridique suisse"** → leur contenu serait brut, sans fiches vérifiées ni cantonal. Notre moat = données cantonales + cascades + outcomes. Mais si ils partenarissent Swisslex → dangereux.
2. **Swisslex lance un front-end citoyen** → ils ont déjà la data. Très possible menace à 18 mois.
3. **Incident LLCA** : un avocat porte plainte pour "conseil juridique illégal" → risque LLCA art. 12. **Mitigation actuelle** : disclaimer + `reviewed_by_legal_expert` réservé humain + positionnement "réduit le besoin d'avocat".
4. **Hallucination médiatisée** : un cas où JPT donne un mauvais conseil est repris par la presse → crédibilité effondrée. **Mitigation** : coverage certificate bloquant + audit trail + outcomes statistics.
5. **Surcharge rituelle** : cron Fedlex tombe en panne, fiches deviennent obsolètes silencieusement. **Mitigation** : freshness badge + dashboard monitoring + alerte 72h.

## Axe 8 — Gates vs calendrier

Roadmap durcie = **gate-based**. Règle d'or à maintenir :
- Pas de nouveau domaine sans top intents du domaine couverts
- Pas de workflow sortant sans coverage certificate sans fail critique
- Pas de "production" sans monitoring actif

**Violation actuelle à assumer** : 5 domaines en `readiness: beta` car Phase 4 ouverte avant gate Phase 2 (expert humain). OK tant que le label beta est visible UI.

## Actions concrètes — trimestre Q2 2026

### Immédiat (< 2 semaines)
1. [x] Ingest entscheidsuche mode mock → prêt pour live dès credentials
2. [ ] Brancher `cantonal-juris-matcher.findCantonalMatches` dans `knowledge-engine.enrichFiche`
3. [ ] Email ASLOCA Vaud (Carlo Sommaruga ou équivalent) : proposition 2 fiches pilotes co-révisées
4. [ ] Tester entscheidsuche API réelle avec leur équipe (`contact@entscheidsuche.ch`)
5. [ ] Rédiger op-ed "Transparence judiciaire en Suisse" pour Le Temps

### 1-2 mois
6. [ ] Cron Fedlex production réelle (pas mock) + alerte diff sur fiches impactées
7. [ ] Partenariat Open Justice Switzerland
8. [ ] Interviews 3 avocats émérites (LAVI, ASLOCA, CSP) → corpus "pratiques terrain" v1
9. [ ] Lancement public soft : 500 premiers users via partenariat ASLOCA → premier échantillon outcomes

### 3-6 mois
10. [ ] Mandat cantonal VD ou GE (co-financement access au droit)
11. [ ] E-lettres La Poste partnership → premiers envois réels
12. [ ] Dashboard public (non-admin) : scorecard Coverage/Correctness/Freshness transparents
13. [ ] Publication rapport annuel "État de l'accès au droit en Suisse" avec nos stats

## Principes non-négociables

1. **Jamais prétendre être meilleur qu'un avocat** globalement. Formulation verrouillée dans CONSTITUTION.md.
2. **Jamais usurper `reviewed_by_legal_expert`** sans humain réel.
3. **Jamais générer de contenu juridique nouveau** (risque hallucination). Toujours citer sources vérifiées.
4. **Disclaimer LLCA obligatoire sur chaque réponse** — jamais discutable.
5. **Gate-based strict** : pas d'expansion tant que gates non validés par commit.
6. **Outcomes anonymisés seulement avec consent explicite** (LPD).
7. **k=5 anonymization** : aucune stat retournée si échantillon < 5 citoyens.
