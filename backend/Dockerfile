# Default to a writable path inside the container.
# Override with DATABASE_PATH=/data/scripture.db when a volume is mounted at /data.
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY server.js db.js admin.html ./

ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/scripture.db

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
