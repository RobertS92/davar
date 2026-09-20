# Pure JS deps — no native toolchain required
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.js db.js admin.html ./

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/data/scripture.db

EXPOSE 3000

CMD ["node", "server.js"]
