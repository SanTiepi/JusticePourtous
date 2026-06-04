# DEPLOYMENT — JusticePourtous

Dernière mise à jour : 2026-06-04. EN PRODUCTION sur https://justicepourtous.ch.

## Architecture de production

```
Internet
  └── Caddy (container batiscan_caddy, VPS 83.228.221.188, TLS + headers sécurité)
        └── reverse_proxy justicepourtous:3000
              └── Container Docker "justicepourtous" (node:22-alpine, port 3000 interne / 3001 hôte)
                    ├── Volume "wallets-data" → /app/src/data/meta
                    │     (persiste wallets/users/cases/stripe-sessions entre déploiements)
                    └── Réseau : batiscan-v4_batiscan-network (externe, partagé avec Batiscan-V4)
```

- **Repo VPS** : `/home/ubuntu/JusticePourtous` (clone git, branche `master` — contrairement au studio-portfolio, ici le VPS **est** un repo git, `git pull`).
- **Caddyfile** : `/home/ubuntu/Batiscan-V4/Caddyfile`. Snippet dans `caddy-vosdroits.txt` (à ajouter une seule fois).

## Première installation

```bash
git clone https://github.com/SanTiepi/JusticePourtous.git /home/ubuntu/JusticePourtous
cd /home/ubuntu/JusticePourtous
cp .env.example .env          # puis remplir (secrets via bws)
cat caddy-vosdroits.txt >> /home/ubuntu/Batiscan-V4/Caddyfile
docker exec batiscan_caddy caddy reload --config /etc/caddy/Caddyfile
docker compose build && docker compose up -d
```

## Déploiement courant (depuis le poste local)

```bash
bash scripts/deploy.sh
```

Étapes auto : gate tests locaux (`LLM_MOCK=1`) → `git push origin master` → SSH VPS `git pull` → `docker compose build -q && docker compose up -d` → health check `http://localhost:3000/api/health`. Clé SSH : `~/.ssh/id_ed25519_batiscan_vps`. Bypass gate (hotfix) : `SKIP_TESTS=1 bash scripts/deploy.sh`.

## Vérification post-déploiement

```bash
curl https://justicepourtous.ch/api/health          # status ok
curl -I https://justicepourtous.ch                  # HTTP 200 + HSTS/X-Frame-Options
ssh -i ~/.ssh/id_ed25519_batiscan_vps ubuntu@83.228.221.188 "docker logs justicepourtous --tail 20"
# Attendu : pas de "[env-check] ... missing in production"
```

## Rollback

> Si un déploiement casse justicepourtous.ch, revenir à la version précédente.
> Le volume `wallets-data` (utilisateurs/cas/paiements) **est conservé** dans tous les cas ci-dessous — pas de perte de données. Le `.env` du VPS n'est pas dans git, il persiste.

### Via git (le plus simple)

```bash
ssh -i ~/.ssh/id_ed25519_batiscan_vps ubuntu@83.228.221.188
cd /home/ubuntu/JusticePourtous
git log --oneline -10              # identifier le dernier commit stable
git checkout <COMMIT_SHA>
docker compose build -q && docker compose up -d
docker exec justicepourtous wget -qO- http://localhost:3000/api/health
# Retour à la branche : git checkout master puis rebuild quand le fix est prêt.
```

### Via image Docker précédente

```bash
docker images | grep justicepourtous     # l'image précédente est encore présente
# repointer docker-compose.yml sur l'IMAGE ID antérieur, puis : docker compose up -d
```

### Points d'attention

- Le volume `wallets-data` n'est jamais touché par un rollback de code. Ne JAMAIS `docker compose down -v` (le `-v` détruit les volumes).
- Si le deploy fautif introduisait une migration de schéma de données, un rollback git peut créer une incompatibilité avec les données du volume — `TODO:` évaluer au cas par cas selon les changelogs de migration.
- `TODO:` vérifier si l'hébergeur a des snapshots disque automatiques (dernier recours).

## Variables d'environnement

Voir `.env.example` (liste complète + commentaires). Secrets de prod dans **bws** (project `studio-robin`) — `TODO:` confirmer le nommage exact des clés (`bws-auto get JUSTICE_*` ?). Aucun `.env` n'est tracké dans git (vérifié — `.gitignore` couvre `.env`).

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) sur chaque push `master` : tests non-LLM (`LLM_MOCK=1`), smoke health, validation schéma des fiches, benchmark structurel (gate ≥ 60). La CI **ne déploie pas** — le deploy reste manuel via `scripts/deploy.sh`.
