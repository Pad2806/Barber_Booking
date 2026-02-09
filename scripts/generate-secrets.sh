#!/bin/bash
# ===========================================
# ReetroBarberShop - Generate Secrets Script
# ===========================================
# Run this script to generate secure random secrets
# Usage: bash scripts/generate-secrets.sh

echo "🔐 Generating secure secrets for ReetroBarberShop..."
echo ""

# Generate JWT Secret
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
echo "JWT_SECRET=${JWT_SECRET}"

# Generate JWT Refresh Secret
JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '\n')
echo "JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}"

# Generate Database Password
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '\n' | tr -d '/' | tr -d '+')
echo "DB_PASSWORD=${DB_PASSWORD}"

# Generate Redis Password
REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d '\n' | tr -d '/' | tr -d '+')
echo "REDIS_PASSWORD=${REDIS_PASSWORD}"

# Generate NextAuth Secret
NEXTAUTH_SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}"

# Generate Webhook Secret
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "SEPAY_WEBHOOK_SECRET=${WEBHOOK_SECRET}"

echo ""
echo "✅ Copy these values to your .env.production file"
echo "⚠️  Keep these secrets safe and never commit them to git!"
