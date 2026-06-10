# ===== Build stage =====
FROM node:22-alpine AS build
WORKDIR /app
# toolchain per compilare better-sqlite3 (modulo nativo) su musl/alpine
RUN apk add --no-cache python3 make g++
# npm install fresco: niente lockfile committato (regola Coolify)
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build && npm prune --omit=dev

# ===== Runtime stage =====
FROM node:22-alpine AS runtime
WORKDIR /app
# libstdc++ richiesta a runtime dal binario nativo di better-sqlite3
RUN apk add --no-cache libstdc++
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321 \
    DATABASE_PATH=/data/artigiani.db \
    UPLOAD_DIR=/data/uploads
# node_modules già compilati e potati dei dev (stessa base musl → compatibili)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
# volume persistente: database SQLite + PDF caricati
VOLUME /data
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
