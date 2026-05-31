# Kit recrutement testeurs réels — passer de 0 à ≥5 outcomes mesurés

> **Pourquoi ce kit** : en prod, on a des vues mais **0 outcome mesuré** → on ne sait PAS si les
> triages aident vraiment. C'est, avec la validation juriste, le vrai blocker de confiance
> (arbitrage Codex + Robin, 2026-05-31). Objectif : **5-10 testeurs réels du réseau Morges/Batiscan →
> ≥5 outcomes mesurables**. Pas un panel d'UX pro : des gens qui ont eu un vrai pépin juridique.

## Pourquoi ça a échoué jusqu'ici (et ce qu'on change)

- 466 vues, 0 outcome : le formulaire long (5 champs) faisait fuir. → Le **widget feedback 1-clic**
  (pouce 👍/👎 sur la page résultat → `POST /api/outcome`) est en place pour ça. On s'appuie dessus.
- Personne ne teste « pour de faux ». → On vise des gens avec une **vraie situation** (bail, travail,
  dettes, voisinage, assurance, séparation) — passée ou en cours. Le réel révèle ce que 45 cas
  synthétiques ne montrent pas (notamment les **omissions dangereuses** identifiées dans l'audit).

## Profil cible (5-10 personnes)

Dans le réseau de Robin (Morges/Batiscan, clients, proches) — quelqu'un qui a vécu, récemment :
- un litige de **bail** (résiliation, moisissure, hausse de loyer, caution) ;
- un souci **travail** (licenciement, salaire impayé, arrêt maladie) ;
- une **poursuite / dette** (commandement de payer) ;
- un conflit de **voisinage**, un refus d'**assurance**, une **séparation**.

Inutile que ce soit "en cours" : un cas passé qu'on connaît bien permet de juger si le triage **aurait
aidé** (et de repérer une omission dangereuse — délai raté, mauvaise autorité).

## Le protocole (10-15 min par testeur)

1. Le testeur va sur **justicepourtous.ch**, décrit sa situation **en ses mots** (comme à un ami).
2. Il suit le triage jusqu'au bout (questions → résultat).
3. Sur la page résultat, il clique **👍 / 👎** (c'est l'outcome mesuré, anonyme, sans PII).
4. Débrief en 3 questions à Robin (WhatsApp / café — voir ci-dessous). C'est là qu'on attrape l'OR :
   le ressenti + les **omissions** (« il aurait dû me parler du délai de X jours »).

### Les 3 questions de débrief (à renvoyer à Robin)

1. **Est-ce que ça t'a aidé à savoir quoi faire ?** (oui clairement / un peu / pas vraiment)
2. **Est-ce qu'il manquait quelque chose d'important ?** (un délai, une démarche, une autorité, un droit)
   — *question critique : c'est elle qui révèle les omissions dangereuses.*
3. **Est-ce que tu aurais payé 2 CHF pour ce triage ?** (oui / non / peut-être)

## Ce qu'on mesure (et où ça atterrit)

- **Outcomes** : 👍/👎 via le widget → `POST /api/outcome` → `outcomes-tracker` (k-anonymisé, k=5, PII strippée).
  Agrégat consultable via `GET /api/admin/outcomes` (admin). Cible : **≥5 outcomes** pour sortir du « 0 ».
- **Omissions réelles** : les réponses à la Q2 du débrief → si une omission est **dangereuse** (délai
  péremptoire, recours, séjour, poursuite, sécurité), elle rouvre le sprint technique ciblé (cf.
  `docs/audit-triage-complexe-2026-05-31.md` — c'est exactement le risque qu'on a documenté).
- **Signal prix** : Q3 → valide (ou non) le palier 2 CHF.

## Critère de succès du sprint testeurs

- ≥ 5 outcomes mesurés (on sort du 0 aveugle).
- ≥ 1 débrief qualitatif par testeur (les 3 questions).
- Toute omission **dangereuse** remontée est consignée comme cas de régression dans `test/complex-cases.mjs`.

## À envoyer

Message prêt à copier : [`message-recrutement.md`](message-recrutement.md) (WhatsApp / email / café).

> Lien avec l'autre levier : la **validation juriste** (`docs/avocats-validation/`, stratégie AMORCE
> 1 fiche payée). Les deux tournent en parallèle — l'un dit *si* ça aide, l'autre *si* c'est juste.
