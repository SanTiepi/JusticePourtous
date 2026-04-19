#!/bin/sh
# Seed les fichiers meta statiques dans le volume runtime au boot.
#
# Contexte : docker-compose.yml monte un volume nommé sur /app/src/data/meta
# pour persister wallets/users/cases/stripe-sessions entre deploys.
# Conséquence : les fichiers statiques (intents-catalog.json, cantons-matrix.json,
# *-report.json, *-audit.json, schemas) livrés dans l'image sont masqués
# par le volume et ne sont JAMAIS mis à jour entre deploys.
#
# Ce script copie les statiques depuis une copie non-montée dans l'image
# (/app/meta-seed/) vers le volume. Écrase à chaque boot pour garantir
# que les données statiques du nouveau build sont actives. Les fichiers
# runtime (wallets.json, users.json, cases.json, stripe-sessions.json)
# sont explicitement préservés.

set -eu

SEED=/app/meta-seed
TARGET=/app/src/data/meta

# Fichiers runtime à NE JAMAIS écraser (persistance utilisateur)
RUNTIME_FILES="wallets.json users.json cases.json stripe-sessions.json"

if [ -d "$SEED" ]; then
  for src in "$SEED"/*; do
    fname=$(basename "$src")
    # Skip si c'est un fichier runtime
    is_runtime=0
    for r in $RUNTIME_FILES; do
      [ "$fname" = "$r" ] && is_runtime=1 && break
    done
    [ "$is_runtime" = "1" ] && continue

    # Copie (écrase) les statiques — les nouvelles versions du build gagnent
    cp -r "$src" "$TARGET/" 2>/dev/null || true
  done
fi

exec "$@"
