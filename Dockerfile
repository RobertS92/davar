# Repo-root Dockerfile so Railway works even when Root Directory is the repo root.
FROM node:20-bookworm-slim

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev

COPY backend/server.js backend/db.js backend/admin.html ./

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/scripture.db

EXPOSE 3000

CMD ["node", "server.js"]
