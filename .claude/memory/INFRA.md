---
name: Infra — VPS, deploy, credentials JusticePourtous
description: Tout ce qui concerne l'infrastructure du projet — VPS, deploy, firewall, Docker, disques, backup, credentials
type: reference
scope: projet
status: active
review_after: 2026-12-31
---
# INFRA — JusticePourtous

> **Règle credentials** : valeurs JAMAIS ici en clair. Cette mémoire est versionnée dans git. Les credentials vivent dans Bitwarden (`bw-auto` pour user passwords, `bws-auto` pour secrets app) — voir `~/.claude/CLAUDE.md` § Credentials. Ici on stocke uniquement les **références** (nom du secret, où le trouver).

## VPS

<!-- IP, hostname, VPS provider, ID instance. PAS de credentials. -->
- IP :
- Provider :
- ID instance :
- OS :

## Deploy

<!-- Procédure deploy. URL, commandes, scripts. -->
- URL prod :
- Script deploy :
- Smoke test post-deploy :

## Docker

<!-- Containers, compose files, ports. -->

## Backup

<!-- Stratégie backup, fréquence, vérification. -->

## Credentials (références Bitwarden)

<!-- Noms des entrées Bitwarden, PAS les valeurs. -->
- Admin app : `bw-auto get <name>`
- DB : `bws-auto get <NAME>`
- SMTP : `bws-auto get <NAME>`

## Mail / Calendar

<!-- Si applicable : IMAP/SMTP/CalDAV providers et configs. -->

## API keys externes

<!-- OpenAI, autres APIs. Références Bitwarden. -->
