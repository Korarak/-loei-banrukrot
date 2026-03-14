
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
    npm ci --workspace=backend --legacy-peer-deps

# Create final production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY . .

WORKDIR /app/backend

EXPOSE 8080

CMD ["npm", "start"]
