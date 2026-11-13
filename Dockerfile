# syntax=docker/dockerfile:1

# Bun instala y construye; Node ejecuta React Router (ver ADR 0001).
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g bun@1.4.2

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000

# Dependencias completas a propósito: drizzle-kit debe poder correr
# `bun run db:migrate` como comando de pre-despliegue.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/app ./app
COPY package.json bun.lock drizzle.config.ts ./
COPY drizzle ./drizzle

RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT ?? 3000) + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "start"]
