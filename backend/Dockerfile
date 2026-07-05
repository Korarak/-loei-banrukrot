
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy monorepo root files and the backend package file
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

# Use npm ci for deterministic installs and cache mounts
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --workspace=backend --legacy-peer-deps

# Create final production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only what the backend needs — not frontend source files
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node backend/ ./backend/

WORKDIR /app/backend

# Run as non-root. The uploads bind mount on the host must be writable by
# uid 1000 (chown -R 1000:1000 ./backend/public/uploads on the VPS).
USER node

EXPOSE 8080

CMD ["node", "server.js"]
