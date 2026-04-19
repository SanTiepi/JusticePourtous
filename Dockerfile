FROM node:22-alpine

# su-exec permet à l'entrypoint de dropper root → node après seed du volume
RUN apk add --no-cache su-exec

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src/ ./src/
COPY scripts/ ./scripts/

# Backup des fichiers meta statiques hors de src/data/meta pour survivre
# au mount du volume docker. Le docker-entrypoint les re-seed au boot.
RUN cp -r /app/src/data/meta /app/meta-seed

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Entrypoint tourne en root pour pouvoir écrire dans le volume, puis drop
# vers node:node via su-exec avant d'exécuter le CMD.
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "src/server.mjs"]
