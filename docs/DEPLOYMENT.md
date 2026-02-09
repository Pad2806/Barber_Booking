# Deployment Guide - ReetroBarberShop

This guide covers deploying the ReetroBarberShop booking system to production.

## Prerequisites

- Node.js 20.x
- pnpm 8.x
- Docker & Docker Compose
- PostgreSQL 16+
- Redis 7+

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel/CDN    │     │   Railway/VPS   │     │   Supabase/     │
│   (Web App)     │────▶│   (API Server)  │────▶│   PostgreSQL    │
│   Next.js       │     │   NestJS        │     │   + Redis       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Environment Variables

### API (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/reetro_booking

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Cloudinary (Image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment
SEPAY_API_KEY=your-sepay-api-key

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Misc
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### Web (.env.local)

```bash
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-nextauth-secret
```

## Local Development

1. **Clone and install dependencies:**

```bash
git clone https://github.com/your-repo/reetro-booking.git
cd reetro-booking
pnpm install
```

2. **Start infrastructure:**

```bash
docker-compose up -d
```

3. **Setup database:**

```bash
cd apps/api
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
```

4. **Start development servers:**

```bash
# Terminal 1 - API
pnpm --filter api dev

# Terminal 2 - Web
pnpm --filter web dev
```

## Docker Deployment

### Build and run with Docker Compose:

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Run containers
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Docker build:

```bash
# Build API
docker build -f apps/api/Dockerfile -t reetro-api .

# Build Web
docker build -f apps/web/Dockerfile -t reetro-web .

# Run API
docker run -d -p 4000:4000 --env-file apps/api/.env reetro-api

# Run Web
docker run -d -p 3000:3000 --env-file apps/web/.env.local reetro-web
```

## Cloud Deployment

### Option 1: Railway (API) + Vercel (Web)

#### Deploy API to Railway:

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Select the `apps/api` directory
4. Add environment variables
5. Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd apps/api
railway up
```

#### Deploy Web to Vercel:

1. Import project to [Vercel](https://vercel.com)
2. Set root directory to `apps/web`
3. Add environment variables
4. Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/web
vercel --prod
```

### Option 2: DigitalOcean App Platform

1. Create a new app on DigitalOcean
2. Connect GitHub repository
3. Configure services:
   - API: Docker, port 4000
   - Web: Docker, port 3000
   - Database: PostgreSQL managed
4. Deploy

### Option 3: Self-hosted VPS

1. **Setup server (Ubuntu 22.04):**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Install Nginx
sudo apt install nginx
```

2. **Configure Nginx reverse proxy:**

```nginx
# /etc/nginx/sites-available/reetro
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Setup SSL with Certbot:**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d api.your-domain.com
```

4. **Deploy with Docker Compose:**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Database Management

### Run migrations:

```bash
cd apps/api
pnpm prisma migrate deploy
```

### Backup database:

```bash
pg_dump -h localhost -U reetro -d reetro_booking > backup.sql
```

### Restore database:

```bash
psql -h localhost -U reetro -d reetro_booking < backup.sql
```

## Monitoring

### Health check endpoints:

- API: `GET /api/health`
- Docs: `GET /docs` (Swagger UI)

### Recommended monitoring tools:

- **Logs**: Railway/Vercel logs, or Papertrail
- **Metrics**: Datadog, New Relic, or Prometheus
- **Error tracking**: Sentry
- **Uptime**: UptimeRobot, Pingdom

## CI/CD

GitHub Actions workflow is configured in `.github/workflows/ci.yml`:

1. **On push/PR**: Lint → Test → Build
2. **On main branch merge**: Deploy to production

### Required secrets:

- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token
- `RAILWAY_TOKEN` - Railway API token
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Troubleshooting

### Database connection issues:

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection
psql -h localhost -U reetro -d reetro_booking
```

### Build failures:

```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

### Docker issues:

```bash
# View logs
docker-compose logs -f api

# Restart containers
docker-compose restart

# Rebuild
docker-compose up -d --build
```

## Support

For issues and questions:

- GitHub Issues: [Link to issues]
- Email: support@reetro.vn
