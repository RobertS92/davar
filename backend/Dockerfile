# Use the Debian slim image so better-sqlite3 native bindings build cleanly.
FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js admin.html ./

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/scripture.db

EXPOSE 3000

CMD ["node", "server.js"]
