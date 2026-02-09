# 🚀 Dokploy Deployment Plan - ReetroBarberShop

## 📋 Tổng quan Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT FLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌─────────────┐    ┌──────────┐    ┌──────────┐   │
│  │  GitHub  │───▶│   GitHub    │───▶│   GHCR   │───▶│ Dokploy  │   │
│  │   Push   │    │   Actions   │    │ Registry │    │  Server  │   │
│  └──────────┘    │ Build Image │    │          │    │          │   │
│                  └─────────────┘    └──────────┘    └──────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Services cần deploy:

| Service        | Loại        | Image Source                    | Port |
| -------------- | ----------- | ------------------------------- | ---- |
| **PostgreSQL** | Database    | Docker Hub (postgres:16-alpine) | 5432 |
| **Redis**      | Cache       | Docker Hub (redis:7-alpine)     | 6379 |
| **API**        | Application | GHCR (pre-built from GitHub)    | 3001 |
| **Web**        | Application | GHCR (pre-built from GitHub)    | 3000 |

---

## 🔄 Deployment Flow

### Flow hoạt động:

1. **Developer push code** lên GitHub (branch `main`)
2. **GitHub Actions** tự động:
   - Chạy lint & test
   - Build Docker images (API + Web)
   - Push images lên GitHub Container Registry (GHCR)
   - Trigger webhook đến Dokploy
3. **Dokploy** nhận webhook và:
   - Pull images mới từ GHCR
   - Restart services với image mới

### Ưu điểm của flow này:

- ✅ Build một lần trên CI/CD, không cần build trên server
- ✅ Faster deployment (chỉ pull image, không cần build)
- ✅ Consistent builds (image giống nhau ở mọi nơi)
- ✅ Dễ rollback (chỉ cần đổi image tag)
- ✅ Tiết kiệm resource server

---

## 📋 Chi Tiết Từng Phase

### Phase 1: Chuẩn bị GitHub Repository

#### 1.1 Push code lên GitHub

```bash
# Nếu chưa có remote
git remote add origin https://github.com/YOUR_USERNAME/Booking_Barber.git

# Push code
git add .
git commit -m "Initial commit"
git push -u origin main
```

#### 1.2 Cấu hình GitHub Repository Settings

1. Vào **Settings** → **Actions** → **General**
2. **Workflow permissions**: Chọn **Read and write permissions**
3. Check: **Allow GitHub Actions to create and approve pull requests**

#### 1.3 Cấu hình GitHub Variables (cho Build Args)

Vào **Settings** → **Secrets and variables** → **Actions** → **Variables**:

| Variable Name                  | Value (example)                         |
| ------------------------------ | --------------------------------------- |
| `NEXT_PUBLIC_API_URL`          | `https://api.yourdomain.com/api/v1`     |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `363394779808-...googleusercontent.com` |

#### 1.4 Enable GitHub Packages

GitHub Container Registry (GHCR) được enable mặc định. Images sẽ ở:

```
ghcr.io/YOUR_USERNAME/booking_barber/api:latest
ghcr.io/YOUR_USERNAME/booking_barber/web:latest
```

---

### Phase 2: Chuẩn bị Server & Cài Dokploy

#### 2.1 Yêu cầu Server

```
- VPS/Cloud Server (Recommend: 4GB RAM, 2 vCPU, 50GB SSD)
- Ubuntu 22.04 LTS hoặc Debian 12
- Public IP với ports: 80, 443, 22 mở
- Domain đã trỏ về server
```

#### 2.2 Cài đặt Dokploy

```bash
# SSH vào server
ssh root@your-server-ip

# Cài đặt Dokploy (1 lệnh duy nhất)
curl -sSL https://dokploy.com/install.sh | sh
```

#### 2.3 Truy cập Dokploy Dashboard

- URL: `https://your-server-ip:3000`
- Tạo admin account
- Setup domain chính: **Settings** → **Server** → **Domains**

---

### Phase 3: Kết nối Dokploy với GitHub Container Registry

#### 3.1 Tạo GitHub Personal Access Token (PAT)

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token** với scopes:
   - `read:packages` (để pull images)
   - `write:packages` (optional, nếu cần push từ Dokploy)
3. Lưu token lại

#### 3.2 Thêm Registry trong Dokploy

1. Dokploy Dashboard → **Settings** → **Docker Registry**
2. **Add Registry**:

```yaml
Name: GitHub Container Registry
Registry URL: ghcr.io
Username: YOUR_GITHUB_USERNAME
Password: YOUR_GITHUB_PAT_TOKEN
```

3. **Test Connection** → Save

---

### Phase 4: Tạo Project & Deploy Database

#### 4.1 Tạo Project

1. **Projects** → **Create Project**
2. Name: `reetro-barbershop`
3. Description: `Booking system for barber shop`

#### 4.2 Deploy PostgreSQL

1. **Add Service** → **Database** → **PostgreSQL**
2. Cấu hình:

```yaml
Name: reetro-postgres
Image: postgres:16-alpine
Environment Variables:
  POSTGRES_USER: reetro_user
  POSTGRES_PASSWORD: <STRONG_PASSWORD_32_CHARS>
  POSTGRES_DB: reetro_booking
Volumes:
  - postgres_data:/var/lib/postgresql/data
```

3. **Deploy** và chờ service healthy

#### 4.3 Deploy Redis

1. **Add Service** → **Database** → **Redis**
2. Cấu hình:

```yaml
Name: reetro-redis
Image: redis:7-alpine
Command: redis-server --appendonly yes --requirepass <REDIS_PASSWORD>
Volumes:
  - redis_data:/data
```

3. **Deploy** và chờ service healthy

---

### Phase 5: Deploy API từ Pre-built Image

#### 5.1 Tạo Application Service cho API

1. **Add Service** → **Application**
2. Source: **Docker Image** (KHÔNG phải Git Repository)
3. Cấu hình:

```yaml
Name: reetro-api
Image: ghcr.io/YOUR_USERNAME/booking_barber/api:latest
Registry: GitHub Container Registry (đã thêm ở Phase 3)
```

#### 5.2 Environment Variables cho API

```bash
# Core
NODE_ENV=production
PORT=3001

# Database (internal network)
DATABASE_URL=postgresql://reetro_user:<DB_PASSWORD>@reetro-postgres:5432/reetro_booking

# Redis (internal network)
REDIS_URL=redis://:<REDIS_PASSWORD>@reetro-redis:6379

# JWT
JWT_SECRET=<GENERATE_64_CHAR_SECRET>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<GENERATE_64_CHAR_SECRET>
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# OAuth - Google
GOOGLE_CLIENT_ID=363394779808-vsflh1el8cfa63ndloqkbntijapaact7.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_SECRET>

# OAuth - Facebook
FACEBOOK_CLIENT_ID=1232558755737904
FACEBOOK_CLIENT_SECRET=<YOUR_FACEBOOK_SECRET>

# OAuth - Zalo
ZALO_APP_ID=2823189561399347240
ZALO_APP_SECRET=<YOUR_ZALO_SECRET>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<YOUR_CLOUD_NAME>
CLOUDINARY_API_KEY=<YOUR_API_KEY>
CLOUDINARY_API_SECRET=<YOUR_API_SECRET>

# Sepay
SEPAY_API_KEY=<YOUR_SEPAY_API_KEY>
SEPAY_WEBHOOK_SECRET=<GENERATE_WEBHOOK_SECRET>
```

#### 5.3 Cấu hình Domain & Health Check

```yaml
Domain: api.yourdomain.com
Port: 3001
SSL: Enable (Let's Encrypt)
Health Check:
  Path: /api/v1/health
  Interval: 30s
  Timeout: 10s
```

#### 5.4 Lấy Webhook URL để Auto Deploy

1. Service **reetro-api** → **Settings** → **Webhooks**
2. **Enable Webhook**
3. Copy **Webhook URL** (dạng: `https://dokploy.yourdomain.com/api/webhook/xxxxx`)
4. Lưu lại để thêm vào GitHub Secrets

---

### Phase 6: Deploy Web từ Pre-built Image

#### 6.1 Tạo Application Service cho Web

1. **Add Service** → **Application**
2. Source: **Docker Image**
3. Cấu hình:

```yaml
Name: reetro-web
Image: ghcr.io/YOUR_USERNAME/booking_barber/web:latest
Registry: GitHub Container Registry
```

#### 6.2 Environment Variables cho Web

```bash
NODE_ENV=production
```

> **Note**: `NEXT_PUBLIC_*` variables đã được build vào image từ GitHub Actions

#### 6.3 Cấu hình Domain

```yaml
Domain: yourdomain.com (hoặc www.yourdomain.com)
Port: 3000
SSL: Enable (Let's Encrypt)
```

#### 6.4 Lấy Webhook URL

Tương tự như API, lấy webhook URL cho Web service.

---

### Phase 7: Cấu hình GitHub Secrets cho Webhook

#### 7.1 Thêm Dokploy Webhooks vào GitHub Secrets

Vào GitHub → **Settings** → **Secrets and variables** → **Actions** → **Secrets**:

| Secret Name           | Value                                              |
| --------------------- | -------------------------------------------------- |
| `DOKPLOY_WEBHOOK_API` | `https://dokploy.yourdomain.com/api/webhook/xxxxx` |
| `DOKPLOY_WEBHOOK_WEB` | `https://dokploy.yourdomain.com/api/webhook/yyyyy` |

#### 7.2 Workflow sẽ tự động trigger deploy

Khi push code lên `main`:

1. GitHub Actions build images
2. Push lên GHCR
3. Gọi webhooks đến Dokploy
4. Dokploy pull image mới và restart services

---

### Phase 8: Cấu hình DNS

#### 8.1 DNS Records cần tạo

| Type | Name    | Value         | TTL  |
| ---- | ------- | ------------- | ---- |
| A    | @       | `<SERVER_IP>` | 3600 |
| A    | api     | `<SERVER_IP>` | 3600 |
| A    | www     | `<SERVER_IP>` | 3600 |
| A    | dokploy | `<SERVER_IP>` | 3600 |

---

### Phase 9: Database Migration & Seed

#### 9.1 Migration tự động

Dockerfile API đã có lệnh auto migrate:

```bash
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

#### 9.2 Seed dữ liệu (nếu cần)

Truy cập Dokploy → Service **reetro-api** → **Terminal**:

```bash
npx prisma db seed
```

---

### Phase 10: Cập nhật OAuth Callback URLs

#### 10.1 Google OAuth

Console: https://console.cloud.google.com/apis/credentials

```
Authorized redirect URIs:
- https://api.yourdomain.com/api/v1/auth/google/callback
- https://yourdomain.com/api/auth/callback/google
```

#### 10.2 Facebook OAuth

Console: https://developers.facebook.com/apps

```
Valid OAuth Redirect URIs:
- https://api.yourdomain.com/api/v1/auth/facebook/callback
```

#### 10.3 Zalo OAuth

Console: https://developers.zalo.me/app

```
Callback URL:
- https://api.yourdomain.com/api/v1/auth/zalo/callback
```

---

### Phase 11: Cấu hình Sepay Webhook

1. Đăng ký webhook với Sepay:

```
URL: https://api.yourdomain.com/api/v1/payments/webhook
Method: POST
```

2. Cập nhật `SEPAY_WEBHOOK_SECRET` trong Dokploy

---

## 📊 Deployment Checklist

### Pre-Deployment

- [ ] Code đã push lên GitHub
- [ ] GitHub Actions workflow hoạt động
- [ ] Server đã cài Dokploy
- [ ] Domain đã trỏ về server
- [ ] GitHub PAT đã tạo

### Database & Cache

- [ ] PostgreSQL service running
- [ ] Redis service running
- [ ] Connection strings đã lưu

### Applications (Pre-built Images)

- [ ] GHCR registry đã kết nối
- [ ] API image pulled thành công
- [ ] Web image pulled thành công
- [ ] Environment variables đã set
- [ ] Domains + SSL configured
- [ ] Webhooks configured

### CI/CD Integration

- [ ] DOKPLOY_WEBHOOK_API secret added
- [ ] DOKPLOY_WEBHOOK_WEB secret added
- [ ] Test push → auto deploy works

### Post-Deployment

- [ ] OAuth callback URLs updated
- [ ] Sepay webhook registered
- [ ] Test booking flow
- [ ] Test payment flow

---

## 🔄 Continuous Deployment Flow

Sau khi setup xong, flow sẽ hoạt động như sau:

```
1. git push origin main
       │
       ▼
2. GitHub Actions triggered
       │
       ├── Lint & Test
       │
       ├── Build API Image ──▶ Push to GHCR
       │
       ├── Build Web Image ──▶ Push to GHCR
       │
       ▼
3. Trigger Dokploy Webhooks
       │
       ├── API Webhook ──▶ Pull new image ──▶ Restart
       │
       └── Web Webhook ──▶ Pull new image ──▶ Restart

4. ✅ Deployment Complete (~3-5 minutes)
```

---

## 🔧 Troubleshooting

### Image pull failed

```bash
# Kiểm tra GHCR credentials trong Dokploy
# Kiểm tra image path có đúng không
# Kiểm tra GitHub PAT còn hạn không
```

### Webhook không trigger

```bash
# Kiểm tra webhook URL đúng chưa
# Kiểm tra GitHub Secrets có đúng không
# Kiểm tra Dokploy logs
```

### API không kết nối được Database

```bash
# Kiểm tra internal DNS: reetro-postgres
# Kiểm tra password không có ký tự đặc biệt
# Kiểm tra cả 2 services cùng network
```

---

## 📈 Rollback

Nếu cần rollback về version cũ:

1. Vào Dokploy → Service → Settings
2. Đổi image tag từ `latest` sang version cũ:
   ```
   ghcr.io/YOUR_USERNAME/booking_barber/api:sha-abc1234
   ```
3. Redeploy

---

## 💰 Chi phí ước tính

| Item                | Chi phí                |
| ------------------- | ---------------------- |
| VPS Server          | $20-40/tháng           |
| Domain              | ~$10/năm               |
| GitHub Actions      | Free (2000 mins/month) |
| GHCR Storage        | Free (500MB)           |
| SSL (Let's Encrypt) | Free                   |

---

## ⏱️ Timeline

| Phase                   | Thời gian  |
| ----------------------- | ---------- |
| Setup GitHub & Workflow | 15 phút    |
| Setup Server & Dokploy  | 30 phút    |
| Connect GHCR Registry   | 10 phút    |
| Deploy DB + Redis       | 15 phút    |
| Deploy API (from image) | 10 phút    |
| Deploy Web (from image) | 10 phút    |
| Configure Webhooks      | 15 phút    |
| DNS + SSL               | 15 phút    |
| OAuth + Sepay           | 30 phút    |
| Testing                 | 30 phút    |
| **Tổng**                | **~3 giờ** |

---

## 📞 Quick Reference

### Image URLs

```
API: ghcr.io/YOUR_USERNAME/booking_barber/api:latest
Web: ghcr.io/YOUR_USERNAME/booking_barber/web:latest
```

### Internal Service URLs (trong Dokploy)

```
PostgreSQL: reetro-postgres:5432
Redis: reetro-redis:6379
API: reetro-api:3001
```

### GitHub Secrets cần thiết

```
DOKPLOY_WEBHOOK_API
DOKPLOY_WEBHOOK_WEB
```

### GitHub Variables cần thiết

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_GOOGLE_CLIENT_ID
```

---

_Cập nhật lần cuối: 2026-02-06_
