# REETRO BARBER SHOP — Hệ Thống Đặt Lịch

> Hệ thống đặt lịch & quản lý chuỗi barbershop hiện đại 

[![Build Status](https://github.com/Pad2806/Barber_Booking/actions/workflows/deploy.yml/badge.svg)](https://github.com/Pad2806/Barber_Booking/actions)

---

## Tài liệu chi tiết

| Tài liệu | Mô tả |
|----------|-------|
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hướng dẫn triển khai, CI/CD, Dokploy, cấu hình server |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | Hướng dẫn sử dụng cho từng vai trò (Khách hàng, Thu ngân, Quản lý, Admin) |
| [PRICING.md](docs/PRICING.md) | Chi phí vận hành, bảng giá giải pháp, so sánh đối thủ |

---

## Tính năng chính

### Khách hàng
- Đặt lịch online qua Website & Zalo Mini App
- Chọn salon, dịch vụ, stylist yêu thích
- Thanh toán QR (VietQR + SePay webhook tự động xác nhận)
- Đánh giá & bình luận sau khi sử dụng dịch vụ
- AI Chatbot hỗ trợ tư vấn 24/7

### Quản lý & Nhân viên
- Dashboard doanh thu, lịch hẹn, hiệu suất
- Quản lý nhân viên, ca làm việc, nghỉ phép
- Tiếp nhận khách walk-in + hàng đợi real-time
- Thanh toán tại quầy (tiền mặt / QR)
- Thông báo lịch hẹn real-time cho tất cả nhân viên

### Admin
- Quản lý toàn bộ chi nhánh, dịch vụ, nhân viên
- Phân tích & báo cáo toàn hệ thống
- Cài đặt hệ thống, API keys, thanh toán

---

## Kiến trúc hệ thống

```
reetro-booking/              (Turborepo + pnpm monorepo)
│
├── apps/
│   ├── api/                 NestJS 10 — Backend API
│   ├── web/                 Next.js 14 (App Router) — Website
│   └── zalo/                Zalo Mini App (ZMP v4 + React)
│
├── packages/
│   ├── shared/              Types, constants, utilities dùng chung
│   └── brand/               Cấu hình white-label branding
│
├── docs/                    Tài liệu (Deployment, Pricing, User Guide)
└── docker-compose.yml
```

### Công nghệ sử dụng

| Tầng | Công nghệ |
|------|-----------|
| **Monorepo** | Turborepo + pnpm |
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, shadcn/ui |
| **Backend** | NestJS 10, Prisma ORM |
| **Cơ sở dữ liệu** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Xác thực** | Passport.js (Google, Facebook, Zalo, Local) |
| **Thanh toán** | VietQR + SePay Webhook |
| **AI** | Google Gemini |
| **Email** | Resend |
| **Lưu trữ media** | Cloudinary |
| **Mini App** | Zalo Mini Program (ZMP v4) |
| **Triển khai** | GitHub Actions → GHCR → Dokploy (DigitalOcean) |

---

## Bắt đầu nhanh

### Yêu cầu

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 16 (hoặc dùng Docker)

### Cài đặt

```bash
# 1. Clone repo
git clone <repo-url>
cd Booking_Barber

# 2. Cài dependencies
pnpm install

# 3. Cấu hình environment
cp .env.example .env
# Chỉnh sửa .env theo hướng dẫn trong DEPLOYMENT.md

# 4. Khởi động database
docker-compose up -d

# 5. Migration + Seed
cd apps/api
pnpm prisma migrate dev
pnpm prisma generate
pnpm prisma db seed    # (tùy chọn)

# 6. Chạy development
cd ../..
pnpm dev
```

### Các lệnh thường dùng

```bash
pnpm dev              # Chạy tất cả apps (API + Web)
pnpm dev:api          # Chỉ chạy API (port 3001)
pnpm dev:web          # Chỉ chạy Web (port 3000)
pnpm build            # Build tất cả
pnpm lint             # Kiểm tra code
pnpm test             # Chạy tests

# Cơ sở dữ liệu
cd apps/api
pnpm prisma studio    # Mở Prisma Studio (xem data)
pnpm prisma migrate dev
```

---

## API Documentation

Khi chạy development, Swagger docs tại: **http://localhost:3001/docs**

---

## Thanh toán

- **VietQR**: Tạo mã QR chuyển khoản tự động
- **SePay Webhook**: Tự động xác nhận khi nhận chuyển khoản
- **Webhook URL**: `POST /api/v1/payments/webhook/sepay`
- Chi tiết cấu hình: xem [DEPLOYMENT.md](docs/DEPLOYMENT.md#phase-11-cấu-hình-sepay-webhook)

---

## Triển khai Production

Hệ thống sử dụng **GitHub Actions** → **GHCR** → **Dokploy** (DigitalOcean):

```
git push origin main
    │
    ▼
GitHub Actions: Lint → Test → Build Docker Images → Push GHCR
    │
    ▼
Dokploy Webhooks: Pull image mới → Restart services
    │
    ▼
Hoàn tất (~3-5 phút)
```

> Chi tiết đầy đủ: [DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## White-Label

Hệ thống hỗ trợ re-branding để bán:

1. Chỉnh sửa `packages/brand/src/config.ts` (tên, logo, màu sắc, liên hệ)
2. Build & deploy lại

> Chi tiết bảng giá: [PRICING.md](docs/PRICING.md)

---

## Hỗ trợ

| Kênh | Liên hệ |
|------|---------|
| Email | support@reetro.vn |
| Hotline | 1900-xxxx |
| Chat | AI Chatbot trong ứng dụng |

> Hướng dẫn sử dụng chi tiết: [USER_GUIDE.md](docs/USER_GUIDE.md)

---

## License

Private — All rights reserved

---

Built with ❤️ by ReetroBarberShop Team (Pad2806)
