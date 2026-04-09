FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

USER node

CMD ["node", "src/server.mjs"]
