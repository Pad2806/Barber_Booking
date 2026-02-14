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

# Install OpenSSL (required by Prisma engine on Alpine)
RUN apk add --no-cache openssl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built files and prisma schema
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Install prisma CLI globally and pre-download engines (as root)
RUN npm install -g prisma@5 \
    && prisma generate --schema=./prisma/schema.prisma || true \
    && chmod -R 755 /usr/local/lib/node_modules/prisma/ 2>/dev/null || true

# Set ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3001

# Run Prisma migrations and start the app
CMD ["sh", "-c", "prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]
