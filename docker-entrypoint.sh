#!/bin/sh
# Seed les fichiers meta statiques dans le volume runtime au boot.
#
# Contexte : docker-compose.yml monte un volume nommé sur /app/src/data/meta
# pour persister wallets/users/cases/stripe-sessions entre deploys.
# Conséquence : les fichiers statiques (intents-catalog.json, cantons-matrix.json,
# *-report.json, *-audit.json, schemas) livrés dans l'image sont masqués
# par le volume et ne sont JAMAIS mis à jour entre deploys.
#
# Ce script tourne en ROOT (via ENTRYPOINT), copie les statiques depuis
# /app/meta-seed (non-monté) vers le volume, chown le résultat à node,
# puis drop les privilèges via su-exec avant d'exécuter le CMD.

set -eu

SEED=/app/meta-seed
TARGET=/app/src/data/meta

# Fichiers runtime à NE JAMAIS écraser (persistance utilisateur)
RUNTIME_FILES="wallets.json users.json cases.json stripe-sessions.json"

if [ -d "$SEED" ] && [ -d "$TARGET" ]; then
  for src in "$SEED"/*; do
    fname=$(basename "$src")
    # Skip si c'est un fichier runtime
    is_runtime=0
    for r in $RUNTIME_FILES; do
      [ "$fname" = "$r" ] && is_runtime=1 && break
    done
    [ "$is_runtime" = "1" ] && continue

    # Copie (écrase) les statiques — les nouvelles versions du build gagnent
    cp -r "$src" "$TARGET/"
  done
  # Le volume est root-owned par défaut — repasse-le à node
  chown -R node:node "$TARGET"
fi

# Drop les privilèges root → node et exécute le CMD (node src/server.mjs)
exec su-exec node:node "$@"
