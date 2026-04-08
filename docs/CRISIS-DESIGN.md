# Crisis Design — Cas sensibles et situations d'urgence

## Principe fondamental

L'urgence HUMAINE passe toujours avant l'urgence JURIDIQUE.
"Allez en sécurité d'abord. Les démarches juridiques peuvent attendre."

## 10 angles critiques

### 1. Sécurité physique de l'utilisateur
Si quelqu'un cherche "violence domestique", le conjoint violent peut surveiller le navigateur.
- Bouton d'évasion rapide : 1 clic → redirige vers meteosuisse.admin.ch
- Utiliser window.location.replace() (pas assign()) pour ne pas garder l'historique
- Raccourci clavier : double ESC
- Bouton présent sur TOUTES les pages, pas seulement en mode crise

### 2. Mode discret
Un adolescent qui cherche de l'aide pour abus ne veut pas que ça apparaisse.
- Titre de l'onglet neutre en mode crise (pas "JusticePourtous — Violence")
- Pas de logo ou texte identifiable dans la barre de tâches
- Inspiré de : BrightSky (UK) se déguise en app météo

### 3. Multilinguisme d'urgence
Un réfugié victime de violence parle peut-être arabe, tigrinya, dari.
- Numéros d'urgence affichés en : FR, DE, IT, EN, ES, AR minimum
- Icônes universelles (téléphone, ambulance, police) en plus du texte
- Pas besoin de traduire les fiches juridiques — juste les numéros et l'écran de crise

### 4. Accessibilité cognitive
Quelqu'un en état de choc ne peut pas lire 3 paragraphes.
- Gros texte, peu de mots, icônes claires
- 1 action par écran
- Contraste maximal (blanc sur rouge foncé ou noir)
- Pas d'animation, pas de scroll nécessaire
- Le numéro le plus important est cliquable (appel direct sur mobile)

### 5. "Je ne suis pas la victime"
"Mon voisin bat sa femme" ou "ma collègue est harcelée" = TÉMOIN, pas victime.
- Option claire : "C'est pour moi" / "C'est pour quelqu'un d'autre"
- Le parcours témoin est différent : signalement, pas protection personnelle
- Ressources différentes : police, APEA (mineurs), droit de signalement

### 6. Les mineurs
Un enfant de 14 ans a des droits et interlocuteurs différents.
- Pro Juventute 147 = la ligne dédiée, en premier
- APEA (autorité de protection de l'enfant), pas la police en premier
- Langage adapté à l'âge
- Pas de jargon juridique
- Option "un adulte de confiance peut m'aider"

### 7. Priorité humaine > juridique
Un viol a des délais de prescription pour la plainte pénale.
Mais les soins médicaux et la sécurité passent AVANT.
- JAMAIS afficher "vous avez X jours pour porter plainte" avant "allez aux urgences"
- Ordre : 1) Sécurité immédiate 2) Soins médicaux 3) Constat (preuves) 4) Démarches juridiques
- Le constat médico-légal doit se faire VITE — le mentionner mais sans pression

### 8. Faux positifs dangereux
"Violence administrative" ≠ violence physique.
- Le LLM doit distinguer violence figurée vs physique
- En cas de doute : afficher les numéros quand même (mieux par excès)
- Mais permettre de dire "non, ce n'est pas une urgence" pour continuer vers le triage normal

### 9. Suivi post-crise
Après un appel au 117, quelles démarches ?
- Constat médical (où, comment, dans quel délai)
- Plainte pénale (procédure, ce qu'il faut savoir)
- Aide LAVI (centres cantonaux, droits des victimes)
- Mesures d'éloignement (art. 28b CC)
- Indemnisation (LAVI prévoit une indemnisation)
- Le système accompagne la SUITE, pas la crise elle-même

### 10. Responsabilité légale
Si notre système ne détecte PAS un cas de danger imminent.
- Disclaimer spécifique pour les cas de crise
- Seuil de détection très bas : vaut mieux afficher les numéros par excès
- Log des détections de crise (pour améliorer le système)
- Aucune donnée personnelle stockée (surtout pas en cas de violence)

## Numéros d'urgence suisses

| Service | Numéro | Horaire |
|---------|--------|---------|
| Police | 117 | 24/7 |
| Ambulance | 144 | 24/7 |
| Main tendue (adultes) | 143 | 24/7 |
| Pro Juventute (jeunes) | 147 | 24/7 |
| Violence domestique | 0800 110 110 | 24/7 |
| Aide aux victimes LAVI | Cantonal | Heures bureau |
| Traite des êtres humains | 0800 799 997 | 24/7 |

### Centres LAVI par canton (romands)
- VD : Centre LAVI Lausanne — 021 631 03 00
- GE : Centre LAVI Genève — 022 320 01 02
- VS : Centre LAVI Sion — 027 322 11 44
- NE : Centre LAVI Neuchâtel — 032 889 66 46
- FR : Centre LAVI Fribourg — 026 305 15 80
- JU : Centre LAVI Delémont — 032 420 81 90

## Corrections après review Codex (2026-04-08)

### Erreurs dans le design initial
- ~~APEA pas la police pour mineurs~~ → FAUX. Si danger immédiat : 117/144, TOUJOURS. APEA = suivi, pas urgence.
- ~~Écran rouge contraste maximal~~ → Un bon écran de crise CALME. Tons bleu foncé/blanc, sobre, pas agressif. Inspiré RAINN.
- ~~Log des détections + aucune donnée stockée~~ → Contradiction retirée. ZÉRO log en mode crise, même pas les métadonnées.

### Angles loupés ajoutés
- **Violence numérique** : spyware, AirTag, sextortion, revenge porn, deepfakes, contrôle bancaire/téléphone. En 2026, c'est aussi fréquent que la violence physique. Ajouter des ressources NCSC et prévention.
- **"Il est à côté / je ne peux pas parler"** : le design ne peut pas reposer uniquement sur des numéros de téléphone. Proposer : chat silencieux, SMS au 143, formulaire web LAVI, code discret.
- **Populations invisibilisées** : hommes victimes, personnes LGBTQ+, personnes handicapées, personnes âgées. Les ressources et le langage doivent être inclusifs (pas "femme battue" mais "personne victime de violence").
- **Cas extrêmes** : strangulation (urgence vitale immédiate → 144), sidération/suicidalité (143), soumission chimique (urgences + constat), dépendance permis de séjour (violence + perte du droit de rester → double piège).

### Flow crise inspiré Crisis Text Line
```
Étape 1: "Êtes-vous en sécurité en ce moment ?"
  → Non → 117 (police) + 144 (ambulance) + "allez dans un lieu sûr"
  → Oui → continue

Étape 2: "Pouvez-vous parler librement ?"
  → Non → options silencieuses : chat 143, SMS, formulaire web
  → Oui → numéros d'appel + consignes incognito/historique

Étape 3: "C'est pour vous ou pour quelqu'un d'autre ?"
  → Moi → ressources victimes
  → Quelqu'un d'autre → ressources témoins/signalement
```

### Message d'entrée (inspiré RAINN)
"Ce service est anonyme et confidentiel. Nous ne vous demanderons pas votre nom. Nous ne stockons aucune donnée."

## Ce que le système NE FAIT PAS en mode crise

- Ne pose PAS de questions détaillées sur les faits
- Ne calcule PAS de "complexité" ou "besoin d'avocat"
- Ne propose PAS de "plan d'action" juridique
- Ne demande PAS d'informations personnelles
- Ne stocke PAS les requêtes de crise
- Ne donne PAS de délais de prescription en premier
