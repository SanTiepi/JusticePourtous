FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY src/ ./src/

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

USER node

CMD ["node", "src/server.mjs"]
