# JusticePourtous — Memory (index)

> **Source de vérité** : ce répertoire `.claude/memory/` du repo GitHub. Versionné via git, sync multi-poste via `/salut` (pull) et `/bye` (commit + push).
>
> **Cap dur 8 fichiers max** — au-delà, consolider thématiquement (pas un fichier par session).

## Fichiers

- **[RULES.md](RULES.md)** — Style de travail Robin + règles techniques persistantes du projet
- **[PROJECT.md](PROJECT.md)** — État produit : doctrine, vision, business rules, roadmap actif, tâches ouvertes
- **[HISTORY.md](HISTORY.md)** — Synthèse ultra-condensée des sessions historiques (jalons décisionnels uniquement)
- **[INFRA.md](INFRA.md)** — VPS, deploy, credentials (références Bitwarden)

## Frontmatter schema obligatoire

Chaque `.md` (sauf `MEMORY.md` qui est l'index) doit commencer par :

```yaml
---
name: <titre court>
description: <1 ligne, sera lue en quick lookup>
type: <user|feedback|project|reference>
scope: <projet|global>
status: <active|deprecated|superseded>
supersedes: [<liste de fichiers remplacés, optionnel>]
review_after: <YYYY-MM-DD, date de revue obligatoire>
---
```

## Règle critique : pas d'auto-narration

Toute modif d'un fichier mémoire **doit être validée par Robin via `/bye` avant commit**. Le risque sinon : Claude commit librement ses propres conclusions, elles deviennent vérité officielle git, Robin (non-dev) ne lit pas chaque diff, et dans 6 mois la mémoire raconte une histoire fictive avec autorité.

→ La mémoire reflète ce que **Robin a approuvé**, pas ce que **Claude croit**.

## Quick lookups

<!-- À compléter au fur et à mesure : raccourcis vers les sections les plus consultées -->
- Credentials → `INFRA.md` (si présent)
- Robin préférences (style, autonomie) → `RULES.md` § Style de travail
- Règles techniques projet → `RULES.md` § Règles techniques
- Doctrine produit → `PROJECT.md` § Doctrine
- Roadmap actif → `PROJECT.md` § Roadmap
- Sessions historiques avec jalons → `HISTORY.md`

## Sync multi-poste — discipline

- `/salut` au début → git pull + canary check
- `/bye` à la fin → handoff + diffs mémoire validés + commit + push
- Hooks SessionStart/Stop dans `.claude/settings.json` = filet auto si oubli

## Sessions historiques

Voir `git log .claude/memory/` pour l'historique des modifications mémoire (toutes validées par Robin via `/bye`).
