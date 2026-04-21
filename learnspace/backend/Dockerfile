# ============================================================
# LearnSpace Backend - Dockerfile
# ============================================================
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .

# Production stage
FROM base AS runner
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY package.json ./

RUN mkdir -p logs && chown expressjs:nodejs logs

USER expressjs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]
