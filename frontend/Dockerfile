
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
# Copy monorepo root files and the frontend package file
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

# Use npm ci for deterministic installs and cache mounts to speed up repeated builds
# We use --workspace to only install frontend dependencies
# npm's workspace hoisting can nest a package under frontend/node_modules
# instead of the shared root node_modules — this build only copies
# frontend/package.json (not backend's), which is enough to trip that for
# any dependency both workspaces share (e.g. sharp). mkdir guarantees a
# (possibly empty) frontend/node_modules always exists for the builder
# stage's second COPY below to succeed, whichever way npm placed things.
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --workspace=frontend --legacy-peer-deps && \
    mkdir -p frontend/node_modules

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Re-declare build arg for this stage (ARGs don't carry across stages)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY . .

WORKDIR /app/frontend
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Recreate the folder structure for standalone mode to ensure correct paths
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public

USER nextjs

EXPOSE 8081

ENV PORT=8081
ENV HOSTNAME="0.0.0.0"

CMD ["node", "frontend/server.js"]
