# VosDroits — Vision

## Problème
72% des Suisses citent le coût comme barrière principale à la justice. Un avocat coûte 300-500 CHF/h. Les permanences juridiques gratuites (ordre des avocats) ont des semaines d'attente. Résultat : les gens renoncent à exercer leurs droits. Les plus touchés : locataires, travailleurs précaires, personnes endettées, migrants.

## Solution
Chatbot juridique gratuit. L'utilisateur décrit son problème en langage courant → VosDroits identifie le domaine juridique, explique les droits en langage clair, cite les articles de loi, oriente vers les services compétents, et génère des courriers types si applicable.

## Ce qui existe ailleurs
- Portugal : GPJ (chatbot gouvernemental)
- UK : Legaltrek, Citizens Advice
- USA : DoNotPay (sanctionné FTC), LexiAI (gratuit)
- Suisse : RIEN. Le système juridique suisse reste très analogique.

## MVP (1 semaine)
1. Chat simple (texte → réponse)
2. 50 questions juridiques fréquentes pré-codées (10 par domaine × 5 domaines)
3. Matching par mots-clés + IA simple
4. Pour chaque réponse : explication claire + article de loi + lien fedlex + service compétent + courrier type si applicable
5. 5 domaines : bail, travail, famille, poursuites, étrangers
6. Annuaire services juridiques par canton

## Synergie écosystème
VosDroits EST le hub central qui connecte tous les autres projets :
- Question sur le bail → oriente vers Habiter + GarantieCheck
- Question sur le travail → oriente vers Refugio
- Question sur les dettes → oriente vers Boussole
- Question sur les permis → oriente vers PermisGuide
- Question sur les droits aidants → oriente vers DroitsRadar

## Scoring tendance
| Critère | Score |
|---------|-------|
| Marché | 5/5 — 8.9M habitants, 72% ont un problème d'accès |
| Faisabilité MVP | 3/5 — le RAG juridique est faisable, la qualité est le défi |
| Trouvabilité porteur | 4/5 — juristes pro bono, facultés de droit (UNIL, UNIGE) |
| Timing | 5/5 — IA mature, blue ocean en CH, pression européenne |
| **Total** | **17/20** |

## Risques
- Précédent FTC/DoNotPay : ne jamais prétendre être un "avocat robot"
- Qualité des réponses : erreur juridique = responsabilité
- Disclaimer permanent obligatoire
- Validation par juriste avant lancement
