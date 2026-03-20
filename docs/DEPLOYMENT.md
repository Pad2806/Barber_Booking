#  Triển khai & Đào tạo — REETRO Barber Booking System

> Phiên bản: 1.0 | Cập nhật: 20/03/2026

---

## Mục lục

1. [Tổng quan triển khai](#1-tổng-quan-triển-khai)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
3. [Quy trình triển khai](#3-quy-trình-triển-khai)
4. [Timeline triển khai](#4-timeline-triển-khai)
5. [Kế hoạch đào tạo](#5-kế-hoạch-đào-tạo)
6. [Bàn giao & Nghiệm thu](#6-bàn-giao--nghiệm-thu)
7. [Hỗ trợ sau triển khai](#7-hỗ-trợ-sau-triển-khai)

---

## 1. Tổng quan triển khai

### Kiến trúc hệ thống

Toàn bộ hệ thống được build trên **GitHub Actions**, push Docker image lên **GHCR (GitHub Container Registry)**, sau đó **Dokploy** trên DigitalOcean Droplet pull image về và chạy.

```
  ┌────────────────────────────────────────────────┐
  │              CI/CD Pipeline                    │
  │                                                │
  │  GitHub Repo ──► GitHub Actions ──► GHCR       │
  │  (source)       (build Docker)    (image store)│
  └───────────────────────┬────────────────────────┘
                          │ docker pull
                 ┌────────▼──────────┐
                 │  Cloudflare (DNS) │
                 └────────┬──────────┘
                          │
         ┌────────────────▼───────────────────┐
         │     DigitalOcean Droplet           │
         │   ┌────────────────────────────┐   │
         │   │  DOKPLOY (pull GHCR)       │   │
         │   ├────────────┬───────────────┤   │
         │   │  Next.js   │  NestJS       │   │
         │   │ (Frontend) │ (Backend API) │   │
         │   ├────────────┴───────────────┤   │
         │   │ PostgreSQL │ Redis         │   │
         │   │   :5434    │  :6379        │   │
         │   └────────────────────────────┘   │
         └────────────────────────────────────┘
                          │
           ┌──────────────┼─────────────┐
           │              │             │
     ┌─────▼─────┐  ┌─────▼─────┐  ┌────▼────┐
     │Cloudinary │  │ Gemini AI │  │ Resend  │
     │ (Media)   │  │ (Chatbot) │  │ (Email) │
     └───────────┘  └───────────┘  └─────────┘
```

### Nền tảng triển khai

| Thành phần             | Nơi chạy                 | Ghi chú                     |
|------------------------|--------------------------|---------------------------- |
|**Build & CI/CD**       |GitHub Actions            |Tự động build khi push code  |
|**Docker Image**        |GHCR (ghcr.io)            |Lưu trữ image, Dokploy pullvề|
|**Next.js (Frontend)**  |Dokploy → Docker          |Pull từ GHCR                 |
|**NestJS (Backend API)**|Dokploy → Docker          |Pull từ GHCR                 |
|**PostgreSQL**          |Dokploy Database          |Docker container             |
|**Redis**               |Dokploy Database          |Docker container             |
|**Reverse Proxy + SSL** |Traefik (Dokploy built-in)|Tự động                      |

---

## 2. Yêu cầu hệ thống

### Server (Backend)

|      Tier      |    CPU    |    RAM    |  Storage  | Phù hợp         |
|----------------|:---------:|:---------:|:---------:|-----------------|
|  **Minimum**   |  1 vCPU   |   2GB     |  25GB SSD | Dev/Test        |
|  **Starter**   |  2 vCPU   |   4GB     |  50GB SSD | 1-3 chi nhánh   |
| **Production** |  4 vCPU   |   8GB     | 100GB SSD | 5-10 chi nhánh  |
|   **Scale**    |  8 vCPU   |   16GB    | 200GB SSD | 10-50 chi nhánh |

### Phần mềm & dịch vụ cần thiết

| Phần mềm   | Version | Mục đích              | Ghi chú                  |
|------------|---------|-----------------------|--------------------------|
| GitHub     | —       | Source code + CI/CD   | GitHub Actions workflow  |
| GHCR       | —       | Docker image registry | ghcr.io/<org>/<repo>     |
| Docker     | ≥ 24.x  | Container runtime     | Dokploy tự cài           |
| Dokploy    | Latest  | PaaS management       | Pull image từ GHCR       |
| Node.js    | ≥ 18.x  | Runtime (trong Docker)| Dockerfile               |
| pnpm       | ≥ 8.x   | Package manager       | Dockerfile               |
| PostgreSQL | ≥ 15.x  | Database              | Dokploy Database service |
| Redis      | ≥ 7.x   | Cache & session       | Dokploy Database service |
| Traefik    | Latest  | Reverse proxy + SSL   | Dokploy built-in         |

### Dịch vụ bên thứ 3 (cần đăng ký)

| Dịch vụ               | Bắt buộc | Mục đích            |
|-----------------------|:--------:|---------------------|
| Cloudinary            | Bắt buộc | Upload ảnh & video  |
| Google Cloud (Gemini) | Bắt buộc | AI Chatbot          |
| Resend                | Bắt buộc | Gửi email thông báo |
| SePay                 | Tùy chọn | QR thanh toán       |
| Google OAuth          | Tùy chọn | Đăng nhập Google    |
| Facebook OAuth        | Tùy chọn | Đăng nhập Facebook  |
| Zalo OAuth            | Tùy chọn | Đăng nhập Zalo      |

---

## 3. Quy trình triển khai (Dokploy + GHCR)

### Phase 1: Chuẩn bị GitHub Repository

#### 1.1 Push code lên GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/Booking_Barber.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

#### 1.2 Cấu hình GitHub Settings

1. **Settings** → **Actions** → **General**
2. **Workflow permissions**: Chọn **Read and write permissions**
3. Check: **Allow GitHub Actions to create and approve pull requests**

#### 1.3 Cấu hình GitHub Variables

Vào **Settings** → **Secrets and variables** → **Actions** → **Variables**:

| Variable Name                  | Value (example)                         |
|--------------------------------|-----------------------------------------|
| `NEXT_PUBLIC_API_URL`          | `https://api.yourdomain.com`            |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `363394779808-...googleusercontent.com` |

#### 1.4 Enable GitHub Packages (GHCR)

Images sẽ ở:
```
ghcr.io/YOUR_USERNAME/booking_barber/api:latest
ghcr.io/YOUR_USERNAME/booking_barber/web:latest
```

---

### Phase 2: Chuẩn bị Server & Cài Dokploy

#### 2.1 Yêu cầu Server

- VPS/Cloud Server (khuyến nghị: 4GB RAM, 2 vCPU, 50GB SSD trở lên)
- Ubuntu 22.04 LTS hoặc Debian 12
- Public IP với ports: 80, 443, 22 mở
- Domain đã trỏ về server

#### 2.2 Cài đặt Dokploy

```bash
ssh root@your-server-ip
curl -sSL https://dokploy.com/install.sh | sh
```

#### 2.3 Truy cập Dokploy Dashboard

- URL: `https://your-server-ip:3000`
- Tạo admin account
- Setup domain chính: **Settings** → **Server** → **Domains**

---

### Phase 3: Kết nối Dokploy với GHCR

#### 3.1 Tạo GitHub Personal Access Token (PAT)

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. **Generate new token** với scopes:
   - `read:packages` (pull images)
   - `write:packages` (optional)
3. Lưu token lại

#### 3.2 Thêm Registry trong Dokploy

1. Dokploy → **Settings** → **Docker Registry** → **Add Registry**

```yaml
Name: GitHub Container Registry
Registry URL: ghcr.io
Username: YOUR_GITHUB_USERNAME
Password: YOUR_GITHUB_PAT_TOKEN
```

2. **Test Connection** → Save

---

### Phase 4: Deploy Database & Cache

#### 4.1 Tạo Project

- **Projects** → **Create Project**
- Name: `reetro-barbershop`

#### 4.2 Deploy PostgreSQL

1. **Add Service** → **Database** → **PostgreSQL**

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

2. **Deploy** → chờ service healthy

#### 4.3 Deploy Redis

1. **Add Service** → **Database** → **Redis**

```yaml
Name: reetro-redis
Image: redis:7-alpine
Command: redis-server --appendonly yes --requirepass <REDIS_PASSWORD>
Volumes:
  - redis_data:/data
```

2. **Deploy** → chờ service healthy

---

### Phase 5: Deploy API từ GHCR

#### 5.1 Tạo Application cho API

1. **Add Service** → **Application**
2. Source: **Docker Image** (KHÔNG phải Git Repository)

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

# Database (internal network - lấy Internal URL từ Dokploy PostgreSQL service)
DATABASE_URL=postgresql://reetro_user:<DB_PASSWORD>@reetro-postgres:5432/reetro_booking?schema=public

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
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_GOOGLE_SECRET>

# OAuth - Facebook
FACEBOOK_CLIENT_ID=<YOUR_FACEBOOK_CLIENT_ID>
FACEBOOK_CLIENT_SECRET=<YOUR_FACEBOOK_SECRET>

# OAuth - Zalo
ZALO_APP_ID=<YOUR_ZALO_APP_ID>
ZALO_APP_SECRET=<YOUR_ZALO_SECRET>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<YOUR_CLOUD_NAME>
CLOUDINARY_API_KEY=<YOUR_API_KEY>
CLOUDINARY_API_SECRET=<YOUR_API_SECRET>

# Gemini AI
GEMINI_API_KEY=<YOUR_GEMINI_KEY>

# Resend
RESEND_API_KEY=<YOUR_RESEND_KEY>
RESEND_FROM=ReetroBarberShop <noreply@yourdomain.com>

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
  Path: /api/health
  Interval: 30s
  Timeout: 10s
```

#### 5.4 Lấy Webhook URL để Auto Deploy

1. Service **reetro-api** → **Settings** → **Webhooks** → **Enable**
2. Copy Webhook URL → lưu lại cho Phase 7

---

### Phase 6: Deploy Web từ GHCR

#### 6.1 Tạo Application cho Web

1. **Add Service** → **Application** → Source: **Docker Image**

```yaml
Name: reetro-web
Image: ghcr.io/YOUR_USERNAME/booking_barber/web:latest
Registry: GitHub Container Registry
```

#### 6.2 Environment Variables

```bash
NODE_ENV=production
```

> `NEXT_PUBLIC_*` đã được build vào image từ GitHub Actions

#### 6.3 Cấu hình Domain

```yaml
Domain: yourdomain.com
Port: 3000
SSL: Enable (Let's Encrypt)
```

#### 6.4 Lấy Webhook URL → lưu lại cho Phase 7

---

### Phase 7: Cấu hình GitHub Secrets cho Auto-Deploy

Vào GitHub → **Settings** → **Secrets and variables** → **Actions** → **Secrets**:

| Secret Name           | Value                                              |
|-----------------------|----------------------------------------------------|
| `DOKPLOY_WEBHOOK_API` | `https://dokploy.yourdomain.com/api/webhook/xxxxx` |
| `DOKPLOY_WEBHOOK_WEB` | `https://dokploy.yourdomain.com/api/webhook/yyyyy` |

Khi push code lên `main`:
1. GitHub Actions build images → Push GHCR
2. Gọi webhooks → Dokploy pull image mới → restart services

---

### Phase 8: Cấu hình DNS

| Type | Name    | Value           | TTL  |
|------|---------|-----------------|------|
| A    | @       | `<SERVER_IP>`   | 3600 |
| A    | api     | `<SERVER_IP>`   | 3600 |
| A    | www     | `<SERVER_IP>`   | 3600 |
| A    | dokploy | `<SERVER_IP>`   | 3600 |

---

### Phase 9: Database Migration & Seed

Dockerfile API đã có auto migrate:

```bash
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

Seed dữ liệu (nếu cần) qua Dokploy → Service **reetro-api** → **Terminal**:

```bash
npx prisma db seed
```

---

### Phase 10: Cập nhật OAuth Callback URLs

#### Google OAuth (console.cloud.google.com)
```
Authorized redirect URIs:
- https://api.yourdomain.com/api/auth/google/callback
```

#### Facebook OAuth (developers.facebook.com)
```
Valid OAuth Redirect URIs:
- https://api.yourdomain.com/api/auth/facebook/callback
```

#### Zalo OAuth (developers.zalo.me)
```
Callback URL:
- https://api.yourdomain.com/api/auth/zalo/callback
```

---

### Phase 11: Cấu hình Sepay Webhook

```
URL: https://api.yourdomain.com/api/payments/webhook
Method: POST
```

Cập nhật `SEPAY_WEBHOOK_SECRET` trong Dokploy env vars

---

### Phase 12: Nhập dữ liệu & Testing

#### Nhập dữ liệu

- Tạo tài khoản Admin
- Tạo chi nhánh (salon) + cấu hình giờ hoạt động
- Tạo danh mục dịch vụ + upload ảnh/video
- Tạo tài khoản nhân viên (barber, cashier, manager)
- Thiết lập lịch làm việc

#### Testing

- Test đặt lịch online (customer flow)
- Test walk-in + checkout (cashier flow)
- Test quản lý (manager flow)
- Test admin panel
- Test thanh toán QR
- Test AI chatbot
- Test email notification

---

## Deployment Checklist

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

### Applications

- [ ] GHCR registry đã kết nối trong Dokploy
- [ ] API image pulled thành công
- [ ] Web image pulled thành công
- [ ] Environment variables đã set
- [ ] Domains + SSL configured
- [ ] Webhooks configured

### CI/CD Integration

- [ ] `DOKPLOY_WEBHOOK_API` secret added
- [ ] `DOKPLOY_WEBHOOK_WEB` secret added
- [ ] Test push → auto deploy works

### Post-Deployment

- [ ] OAuth callback URLs updated
- [ ] Sepay webhook registered
- [ ] Test booking flow hoàn chỉnh
- [ ] Test payment flow

---

## CI/CD Flow (sau khi setup xong)

```
1. git push origin main
       │
       ▼
2. GitHub Actions triggered
       │
       ├── Lint & Test
       ├── Build API Image ──▶ Push to GHCR
       ├── Build Web Image ──▶ Push to GHCR
       │
       ▼
3. Trigger Dokploy Webhooks
       │
       ├── API Webhook ──▶ Pull new image ──▶ Restart
       └── Web Webhook ──▶ Pull new image ──▶ Restart

4. ✅ Deployment Complete (~3-5 phút)
```

---

## Troubleshooting

| Vấn đề | Kiểm tra |
|--------|----------|
| Image pull failed | GHCR credentials trong Dokploy, image path, GitHub PAT hạn |
| Webhook không trigger | Webhook URL, GitHub Secrets, Dokploy logs |
| API không kết nối DB | Internal DNS (`reetro-postgres`), password, cùng network |
| SSL không cấp | DNS đã trỏ đúng IP, port 80/443 mở |

---

## Rollback

Nếu cần rollback về version cũ:

1. Dokploy → Service → **Settings**
2. Đổi image tag từ `latest` sang version cũ: `ghcr.io/YOUR_USERNAME/booking_barber/api:sha-abc1234`
3. **Redeploy**

---

## Quick Reference

| Item | Value |
|------|-------|
| API Image | `ghcr.io/YOUR_USERNAME/booking_barber/api:latest` |
| Web Image | `ghcr.io/YOUR_USERNAME/booking_barber/web:latest` |
| Internal PostgreSQL | `reetro-postgres:5432` |
| Internal Redis | `reetro-redis:6379` |
| GitHub Secrets | `DOKPLOY_WEBHOOK_API`, `DOKPLOY_WEBHOOK_WEB` |
| GitHub Variables | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |

---

## 4. Timeline triển khai

### Gói Basic (1 chi nhánh)

```
Tuần 1  ████████████████████████  Cài đặt + Data Entry + Testing
Tuần 2  ██████████░░░░░░░░░░░░░░  Đào tạo + Go-live
────────────────────────────────────────────────────
                                  Tổng: 7-10 ngày làm việc
```

### Gói Professional (3-5 chi nhánh)

```
Tuần 1  ████████████████████████  Cài đặt hạ tầng + Config
Tuần 2  ████████████████████████  Data Entry + Customize
Tuần 3  ████████████░░░░░░░░░░░░  Testing + Đào tạo
Tuần 4  ██████░░░░░░░░░░░░░░░░░░  Go-live + Support
────────────────────────────────────────────────────
                                  Tổng: 15-20 ngày làm việc
```

### Gói Enterprise (10+ chi nhánh)

```
Tuần 1-2  ████████████████████████  Hạ tầng + Custom Development
Tuần 3-4  ████████████████████████  Data Migration + Integration
Tuần 5    ████████████████████████  UAT Testing
Tuần 6    ████████████████████████  Đào tạo ToT
Tuần 7-8  ████████████░░░░░░░░░░░░  Triển khai cuốn chiếu + Go-live
────────────────────────────────────────────────────
                                  Tổng: 30-45 ngày làm việc
```

### Tổng kết timeline

| Gói          | Thời gian       | Nhân sự triển khai |
|--------------|:---------------:|:------------------:|
| Basic        | **7-10 ngày**   | 1 người            |
| Professional | **15-20 ngày**  | 1-2 người          |
| Enterprise   | **30-45 ngày**  | 2-3 người          |

---

## 5. Kế hoạch đào tạo

### 5.1 Đào tạo theo vai trò

#### Admin hệ thống (4 giờ)

| Buổi | Nội dung                                         | Thời lượng |
|:----:|:------------------------------------------------:|:----------:|
|  1   | Tổng quan hệ thống, Dashboard, Quản lý chi nhánh | 2h         |
|  2   | Quản lý dịch vụ, nhân viên, cài đặt hệ thống     | 2h         |

#### Quản lý chi nhánh - Manager (3 giờ)

| Buổi | Nội dung                                     | Thời lượng |
|:----:|:--------------------------------------------:|:----------:|
|  1   | Dashboard, Quản lý nhân viên & lịch làm      | 1.5h       |
|  2   | Duyệt nghỉ phép, Booking, Đánh giá, Doanh thu| 1.5h       |

#### Thu ngân - Cashier (2 giờ)

| Buổi | Nội dung                                | Thời lượng |
|:----:|:---------------------------------------:|:----------:|
|  1   | Walk-in, Hàng đợi, Thanh toán, Doanh thu| 2h         |

#### Nhân viên - Barber (1 giờ)

| Buổi | Nội dung                                     | Thời lượng |
|:----:|:--------------------------------------------:|:----------:|
| 1    | Xem lịch, Cập nhật hồ sơ, Xin nghỉ phép      | 1h         |

### 5.2 Tài liệu đào tạo

| Loại                 | Định dạng      | Mô tả                              |
|:--------------------:|:--------------:|:----------------------------------:|
| User Guide           | Markdown (.md) | Hướng dẫn chi tiết từng tính năng  |
| Video hướng dẫn      | MP4/YouTube    | Quay màn hình thao tác             |
| FAQ                  | Trong ứng dụng | AI chatbot trả lời tự động         |
| Poster thao tác nhanh| PDF/A4         | Dán tại quầy thu ngân              |

### 5.3 Phương pháp đào tạo

| Phương pháp                 | Mô tả                     | Phù hợp              |
|:---------------------------:|:-------------------------:|:--------------------:|
| **On-site**                 | Đến tận nơi đào tạo       | Enterprise           |
| **Online (Zoom/Meet)**      | Đào tạo từ xa             | Professional         |
| **Video + Docs**            | Tự học qua tài liệu       | Basic                |
| **ToT (Train-the-Trainer)** | Đào tạo 1 người đại diện → họ tự đào tạo team | Enterprise chuỗi lớn |

### 5.4 Hỗ trợ sau đào tạo

| Giai đoạn            | Hỗ trợ                               |
|----------------------|--------------------------------------|
| Tuần 1-2 sau go-live | Hỗ trợ trực tiếp (chat/call) 24/7    |
| Tháng 1-3            | Hỗ trợ trong giờ hành chính (8h-18h) |
| Sau 3 tháng          | Theo gói bảo trì đã mua              |

---

## 6. Bàn giao & Nghiệm thu

### Checklist bàn giao

| # | Hạng mục        | Mô tả                                   |
|:-:|-----------------|-----------------------------------------|
| 1 | **Source code** | Toàn bộ mã nguồn trên Git repository    |
| 2 | **Database**    | Schema + seed data + backup script      |
| 3 | **Tài liệu**    | User Guide, API docs, kiến trúc         |
| 4 | **Tài khoản**   | Admin account + tất cả service accounts |
| 5 | **Environment** | .env template + hướng dẫn cấu hình      |
| 6 | **Backup**      | Script backup tự động (daily)           |
| 7 | **Monitoring**  | Hướng dẫn theo dõi health check         |

### Tiêu chí nghiệm thu

| # | Tiêu chí                                  | Kiểm tra         |
|:-:|-------------------------------------------|------------------|
| 1 | Tất cả tính năng hoạt động đúng           | Test thủ công    |
| 2 | Hiệu suất: trang load < 3 giây            | Lighthouse       |
| 3 | Bảo mật: không lỗ hổng critical           | Security scan    |
| 4 | Data: nhập đủ dữ liệu thực                | Kiểm tra data    |
| 5 | Đào tạo: tất cả vai trò đã được hướng dẫn | Sign-off         |
| 6 | Backup: chạy backup thành công 1 lần      | Restore test     |

---

## 7. Hỗ trợ sau triển khai

### SLA (Service Level Agreement)

| Mức độ                         | Thời gian phản hồi  | Thời gian xử lý |
|--------------------------------|:-------------------:|:---------------:|
| **Critical** (hệ thống down)   | 30 phút             | 4 giờ           |
| **High** (tính năng chính lỗi) | 2 giờ               | 8 giờ           |
| **Medium** (lỗi nhỏ)           | 4 giờ               | 24 giờ          |
| **Low** (yêu cầu cải tiến)     | 24 giờ              | Theo thỏa thuận |

### Bảo trì định kỳ

| Tần suất        | Công việc                             |
|-----------------|---------------------------------------|
| **Hàng ngày**   | Backup database tự động               |
| **Hàng tuần**   | Kiểm tra logs, disk space             |
| **Hàng tháng**  | Update dependencies, security patches |
| **Hàng quý**    | Review performance, optimize DB       |

### Kênh hỗ trợ

| Kênh                 | Thời gian        | Phù hợp          |
|----------------------|------------------|------------------|
| Chat (Zalo/Telegram) | 8h-22h           | Câu hỏi nhanh    |
| Email                | 24h phản hồi     | Yêu cầu chi tiết |
| Hotline              | 8h-18h (T2-T7)   | Khẩn cấp         |
| Ticket system        | Mọi lúc          | Theo dõi tiến độ |

---

> **Liên hệ triển khai:** Vui lòng liên hệ team phát triển để được tư vấn gói phù hợp và bắt đầu triển khai. 
(Pad2806)
