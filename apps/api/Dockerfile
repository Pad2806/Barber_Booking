# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/brand/package.json ./packages/brand/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY packages/brand ./packages/brand
COPY tsconfig.base.json ./

# Generate Prisma client
RUN cd apps/api && pnpm prisma generate

# Build the API
RUN pnpm turbo run build --filter=api

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built files and prisma schema
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/prisma ./prisma

# Install production dependencies with npm (flat node_modules, no symlinks)
RUN npm install --omit=dev && npm install prisma && npx prisma generate

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

# Run Prisma migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
