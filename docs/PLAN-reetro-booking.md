# 📋 Project Plan: ReetroBarberShop Booking System

> **Created:** February 4, 2026  
> **Status:** Planning  
> **Version:** 1.0

---

## 📌 Executive Summary

Clone hệ thống đặt lịch cắt tóc tham khảo từ 30shine.com với các tính năng booking, quản lý salon, thanh toán QR tự động. Thiết kế white-label để dễ dàng re-brand cho các salon khác.

### Key Objectives

- ✅ Hệ thống booking cho khách hàng (Web, Zalo Mini App)
- ✅ Admin panel với phân quyền đa cấp
- ✅ Thanh toán QR tự động (VietQR + Sepay)
- ✅ White-label architecture

---

## 🛠 Tech Stack

| Layer                | Technology                 | Version |
| -------------------- | -------------------------- | ------- |
| **Frontend Web**     | Next.js (App Router)       | 14.x    |
| **Backend API**      | NestJS                     | 10.x    |
| **Database**         | PostgreSQL                 | 16.x    |
| **ORM**              | Prisma                     | 5.x     |
| **Zalo Mini App**    | Native Zalo Framework      | Latest  |
| **Monorepo**         | Turborepo                  | 1.x     |
| **Styling**          | Tailwind CSS               | 3.x     |
| **UI Components**    | shadcn/ui                  | Latest  |
| **State Management** | Zustand + React Query      | Latest  |
| **Auth**             | Passport.js + JWT          | Latest  |
| **Payment**          | VietQR API + Sepay Webhook | -       |
| **Storage**          | Cloudinary / AWS S3        | -       |
| **Cache**            | Redis                      | 7.x     |
| **Containerization** | Docker                     | Latest  |

---

## 🏗 Project Structure

```
reetro-barbershop/
├── apps/
│   ├── web/                    # Next.js 14 (User + Admin)
│   ├── api/                    # NestJS Backend
│   └── zalo-mini/              # Native Zalo Mini App
│
├── packages/
│   ├── ui/                     # Shared React components
│   ├── shared/                 # Types, utils, constants
│   ├── api-client/             # API SDK + React Query hooks
│   └── brand/                  # White-label config
│
├── prisma/                     # Database schema
├── docker/                     # Docker configs
└── docs/                       # Documentation
```

---

## 👥 User Roles & Permissions

### Role Hierarchy

```
SUPER_ADMIN
    │
    ├── SALON_OWNER (multiple)
    │       │
    │       └── STAFF (multiple per salon)
    │
    └── CUSTOMER (end users)
```

### Permission Matrix

| Permission            | SUPER_ADMIN | SALON_OWNER |  STAFF   | CUSTOMER |
| --------------------- | :---------: | :---------: | :------: | :------: |
| Manage all salons     |     ✅      |     ❌      |    ❌    |    ❌    |
| Manage own salon      |     ✅      |     ✅      |    ❌    |    ❌    |
| Assign staff to salon |     ✅      |     ✅      |    ❌    |    ❌    |
| View all bookings     |     ✅      |  Own salon  | Own only | Own only |
| Manage services       |     ✅      |     ✅      |    ❌    |    ❌    |
| Manage staff schedule |     ✅      |     ✅      |    ❌    |    ❌    |
| View reports          |     ✅      |  Own salon  |    ❌    |    ❌    |
| Create booking        |     ✅      |     ✅      |    ✅    |    ✅    |
| Cancel booking        |     ✅      |     ✅      | Own only | Own only |
| View own schedule     |     ✅      |     ✅      |    ✅    |    ❌    |
| Rate & review         |     ❌      |     ❌      |    ❌    |    ✅    |

---

## 🔐 Authentication Strategy

### By Platform

| Platform          | Methods                                      |
| ----------------- | -------------------------------------------- |
| **Web (Next.js)** | Google OAuth, Facebook OAuth, Email/Password |
| **Zalo Mini App** | Zalo OAuth (native)                          |

### Token Strategy

| Token         | Expiry     | Storage                                             |
| ------------- | ---------- | --------------------------------------------------- |
| Access Token  | 15 minutes | Memory (Web), LocalStorage (Zalo Mini App)          |
| Refresh Token | 7 days     | HttpOnly Cookie (Web), LocalStorage (Zalo Mini App) |

### Account Linking

- Users có thể link nhiều auth providers vào 1 account
- Primary identifier: Email hoặc Phone

---

## 📊 Database Schema

### Core Entities

#### Users

```prisma
model User {
  id            String        @id @default(uuid())
  email         String?       @unique
  phone         String?       @unique
  password      String?       // Hashed, nullable for OAuth
  name          String?
  avatar        String?

  // OAuth IDs
  googleId      String?       @unique
  facebookId    String?       @unique
  zaloId        String?       @unique

  authProvider  AuthProvider  @default(LOCAL)
  role          Role          @default(CUSTOMER)
  isVerified    Boolean       @default(false)
  isActive      Boolean       @default(true)

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  lastLoginAt   DateTime?

  // Relations
  staff         Staff?
  bookings      Booking[]
  reviews       Review[]
  ownedSalons   Salon[]       @relation("SalonOwner")
  refreshTokens RefreshToken[]
}

enum AuthProvider {
  LOCAL
  GOOGLE
  FACEBOOK
  ZALO
}

enum Role {
  CUSTOMER
  STAFF
  SALON_OWNER
  SUPER_ADMIN
}
```

#### Salons

```prisma
model Salon {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  address     String
  city        String
  district    String
  ward        String?
  latitude    Float?
  longitude   Float?
  phone       String
  email       String?

  // Business hours
  openTime    String    @default("08:30")
  closeTime   String    @default("20:30")
  workingDays String[]  @default(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"])

  // Media
  logo        String?
  coverImage  String?
  images      String[]

  // Settings
  isActive    Boolean   @default(true)

  // Relations
  ownerId     String
  owner       User      @relation("SalonOwner", fields: [ownerId], references: [id])
  staff       Staff[]
  services    Service[]
  bookings    Booking[]
  reviews     Review[]

  // Payment settings
  bankCode    String?
  bankAccount String?
  bankName    String?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

#### Services

```prisma
model Service {
  id          String    @id @default(uuid())
  name        String
  description String?
  price       Decimal   @db.Decimal(10, 0)
  duration    Int       // Minutes
  category    ServiceCategory
  image       String?
  isActive    Boolean   @default(true)
  order       Int       @default(0)

  salonId     String
  salon       Salon     @relation(fields: [salonId], references: [id])

  bookingServices BookingService[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum ServiceCategory {
  HAIRCUT         // Cắt tóc
  HAIR_STYLING    // Uốn/Duỗi
  HAIR_COLORING   // Nhuộm
  HAIR_TREATMENT  // Dưỡng tóc
  SHAVE           // Cạo râu
  FACIAL          // Chăm sóc da
  COMBO           // Combo
  OTHER
}
```

#### Staff

```prisma
model Staff {
  id          String    @id @default(uuid())
  position    StaffPosition
  bio         String?
  rating      Float     @default(5.0)
  totalReviews Int      @default(0)
  isActive    Boolean   @default(true)

  userId      String    @unique
  user        User      @relation(fields: [userId], references: [id])

  salonId     String
  salon       Salon     @relation(fields: [salonId], references: [id])

  // Working schedule
  schedules   StaffSchedule[]
  bookings    Booking[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum StaffPosition {
  STYLIST
  SENIOR_STYLIST
  MASTER_STYLIST
  SKINNER
  MANAGER
}

model StaffSchedule {
  id          String    @id @default(uuid())
  staffId     String
  staff       Staff     @relation(fields: [staffId], references: [id])

  dayOfWeek   Int       // 0-6 (Sunday-Saturday)
  startTime   String    // "08:30"
  endTime     String    // "20:30"
  isOff       Boolean   @default(false)
}
```

#### Bookings

```prisma
model Booking {
  id              String        @id @default(uuid())
  bookingCode     String        @unique // RB-YYYYMMDD-XXXX

  customerId      String
  customer        User          @relation(fields: [customerId], references: [id])

  salonId         String
  salon           Salon         @relation(fields: [salonId], references: [id])

  staffId         String?
  staff           Staff?        @relation(fields: [staffId], references: [id])

  // Booking time
  date            DateTime      @db.Date
  timeSlot        String        // "09:00"
  endTime         String        // "09:45" (calculated)

  // Services
  services        BookingService[]
  totalDuration   Int           // Total minutes
  totalAmount     Decimal       @db.Decimal(10, 0)

  // Status
  status          BookingStatus @default(PENDING)

  // Payment
  paymentStatus   PaymentStatus @default(UNPAID)
  paymentMethod   PaymentMethod?
  payment         Payment?

  // Customer notes
  note            String?

  // Cancellation
  cancelReason    String?
  cancelledAt     DateTime?
  cancelledBy     String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  review          Review?
}

model BookingService {
  id          String    @id @default(uuid())
  bookingId   String
  booking     Booking   @relation(fields: [bookingId], references: [id])

  serviceId   String
  service     Service   @relation(fields: [serviceId], references: [id])

  price       Decimal   @db.Decimal(10, 0) // Price at booking time
  duration    Int
}

enum BookingStatus {
  PENDING     // Chờ xác nhận
  CONFIRMED   // Đã xác nhận
  IN_PROGRESS // Đang thực hiện
  COMPLETED   // Hoàn thành
  CANCELLED   // Đã hủy
  NO_SHOW     // Khách không đến
}

enum PaymentStatus {
  UNPAID
  PENDING     // QR generated, waiting
  PAID
  REFUNDED
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  VIETQR
}
```

#### Payments

```prisma
model Payment {
  id              String        @id @default(uuid())

  bookingId       String        @unique
  booking         Booking       @relation(fields: [bookingId], references: [id])

  amount          Decimal       @db.Decimal(10, 0)
  method          PaymentMethod

  // VietQR specific
  qrCode          String?       // QR code URL/data
  qrContent       String?       // QR content string
  bankCode        String?
  bankAccount     String?

  // Sepay webhook data
  sepayTransId    String?       @unique
  sepayRef        String?

  status          PaymentStatus @default(PENDING)

  paidAt          DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

#### Reviews

```prisma
model Review {
  id          String    @id @default(uuid())

  bookingId   String    @unique
  booking     Booking   @relation(fields: [bookingId], references: [id])

  customerId  String
  customer    User      @relation(fields: [customerId], references: [id])

  salonId     String
  salon       Salon     @relation(fields: [salonId], references: [id])

  rating      Int       // 1-5
  comment     String?
  images      String[]

  // Response from salon
  reply       String?
  repliedAt   DateTime?

  isVisible   Boolean   @default(true)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

#### Notifications

```prisma
model Notification {
  id          String    @id @default(uuid())

  userId      String

  type        NotificationType
  title       String
  message     String
  data        Json?     // Additional data

  isRead      Boolean   @default(false)
  readAt      DateTime?

  createdAt   DateTime  @default(now())
}

enum NotificationType {
  BOOKING_CREATED
  BOOKING_CONFIRMED
  BOOKING_CANCELLED
  BOOKING_REMINDER
  PAYMENT_RECEIVED
  REVIEW_RECEIVED
  PROMOTION
  SYSTEM
}
```

---

## 💳 Payment Integration

### VietQR + Sepay Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │     │  NestJS  │     │  VietQR  │     │  Sepay   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ 1. Confirm     │                │                │
     │    Booking     │                │                │
     │───────────────▶│                │                │
     │                │                │                │
     │                │ 2. Generate QR │                │
     │                │   (with unique │                │
     │                │    content)    │                │
     │                │───────────────▶│                │
     │                │                │                │
     │                │◀───────────────│                │
     │ 3. Show QR     │   QR Image     │                │
     │◀───────────────│                │                │
     │                │                │                │
     │ 4. User scans  │                │                │
     │    & transfers │                │                │
     │                │                │                │
     │                │                │ 5. Webhook     │
     │                │                │    callback    │
     │                │◀───────────────┼────────────────│
     │                │                │                │
     │                │ 6. Verify &    │                │
     │                │    update      │                │
     │                │    booking     │                │
     │ 7. Confirm     │                │                │
     │◀───────────────│                │                │
     │   (Realtime)   │                │                │
```

### QR Content Format

```
Bank: [BANK_CODE]
Account: [ACCOUNT_NUMBER]
Amount: [AMOUNT]
Content: RB-20260204-0001 [CUSTOMER_PHONE]
```

### Sepay Webhook Handler

- Endpoint: `POST /api/webhooks/sepay`
- Verify signature
- Match transaction with booking code
- Update payment status
- Send notification to user

---

## 📱 Feature Breakdown

### Phase 1: Foundation (Week 1-2)

#### 1.1 Project Setup

- [ ] Initialize Turborepo monorepo
- [ ] Setup Next.js app with App Router
- [ ] Setup NestJS API with modular architecture
- [ ] Configure PostgreSQL + Prisma
- [ ] Setup Docker development environment
- [ ] Configure ESLint, Prettier, TypeScript
- [ ] Setup shared packages (ui, shared, api-client, brand)

#### 1.2 Authentication Module

- [ ] **NestJS**: Auth module with Passport.js
  - [ ] Local strategy (email/password)
  - [ ] Google OAuth strategy
  - [ ] Facebook OAuth strategy
  - [ ] Zalo OAuth strategy
  - [ ] JWT strategy + Refresh token
  - [ ] Guards & Decorators
- [ ] **Next.js**: Auth pages
  - [ ] Login page with social buttons
  - [ ] Register page
  - [ ] Forgot/Reset password
  - [ ] Protected route middleware
- [ ] **Shared**: API client hooks

#### 1.3 Database & Core Entities

- [ ] Prisma schema setup
- [ ] Migrations
- [ ] Seed data (test salons, services)

---

### Phase 2: Zalo Mini App + API Core (Week 3-5)

#### 2.1 Zalo Mini App Setup

- [ ] Initialize Zalo Mini App project
- [ ] Configure Zalo App ID
- [ ] Setup API client for Zalo
- [ ] Zalo OAuth integration
- [ ] User profile sync

#### 2.2 Salon Module (API + Zalo)

- [ ] **API**: CRUD salons
- [ ] **API**: Search salons (by location, name)
- [ ] **API**: Get salon details with services & staff
- [ ] **Zalo**: Home page với salon listing
- [ ] **Zalo**: Salon detail page

#### 2.3 Service Module (API + Zalo)

- [ ] **API**: CRUD services (per salon)
- [ ] **API**: Service categories
- [ ] **Zalo**: Service selection component

#### 2.4 Staff Module (API + Zalo)

- [ ] **API**: CRUD staff (per salon)
- [ ] **API**: Staff schedule management
- [ ] **API**: Get available slots for staff
- [ ] **Zalo**: Staff selection component

#### 2.5 Booking Flow (API + Zalo)

- [ ] **API**: Create booking
- [ ] **API**: Get available time slots
- [ ] **API**: Cancel/Reschedule booking
- [ ] **API**: Booking history
- [ ] **Zalo**: Multi-step booking wizard
  - [ ] Step 1: Select salon (if not pre-selected)
  - [ ] Step 2: Select services
  - [ ] Step 3: Select stylist (optional)
  - [ ] Step 4: Select date & time
  - [ ] Step 5: Confirm & Payment
- [ ] **Zalo**: Booking confirmation page
- [ ] **Zalo**: Booking history page
- [ ] **Zalo**: Profile page

---

### Phase 3: Payment Integration (Week 6-7)

#### 3.1 VietQR Integration

- [ ] **API**: Generate QR code
- [ ] **API**: QR content builder
- [ ] **Zalo**: QR display component
- [ ] **Zalo**: Payment status polling/websocket
- [ ] **Zalo**: Redirect to banking app

#### 3.2 Sepay Webhook

- [ ] **API**: Webhook endpoint
- [ ] **API**: Signature verification
- [ ] **API**: Transaction matching
- [ ] **API**: Payment status update

#### 3.3 Zalo Payment UI

- [ ] **Zalo**: Payment page with QR
- [ ] **Zalo**: Payment success/failure pages
- [ ] **Zalo**: Payment countdown timer

#### 3.4 Zalo Features

- [ ] **Zalo**: Zalo notification integration
- [ ] **Zalo**: Share booking to Zalo

---

### Phase 4: Web Customer App (Week 8-9)

#### 4.1 Web Setup

- [ ] Setup Next.js app structure
- [ ] Configure shared UI components
- [ ] Implement responsive mobile-first design

#### 4.2 Auth Pages

- [ ] **Web**: Login page with social buttons (Google, Facebook)
- [ ] **Web**: Register page
- [ ] **Web**: Forgot/Reset password
- [ ] **Web**: Protected route middleware

#### 4.3 Booking Flow (Web)

- [ ] **Web**: Salon listing page
- [ ] **Web**: Salon detail page
- [ ] **Web**: Multi-step booking wizard
- [ ] **Web**: Service selection component
- [ ] **Web**: Staff selection component
- [ ] **Web**: Payment page with QR
- [ ] **Web**: Booking confirmation page
- [ ] **Web**: Booking history page
- [ ] **Web**: Profile page

---

### Phase 5: Admin Panel (Week 10-11)

#### 5.1 Dashboard

- [ ] **API**: Dashboard statistics
  - [ ] Today's bookings
  - [ ] Revenue (daily/weekly/monthly)
  - [ ] Popular services
  - [ ] Staff performance
- [ ] **Web**: Dashboard page with charts

#### 5.2 Booking Management

- [ ] **Web**: Booking list with filters
- [ ] **Web**: Booking calendar view
- [ ] **Web**: Booking detail modal
- [ ] **Web**: Update booking status

#### 5.3 Staff Management

- [ ] **Web**: Staff list
- [ ] **Web**: Add/Edit staff
- [ ] **Web**: Assign staff to salon
- [ ] **Web**: Staff schedule editor

#### 5.4 Service Management

- [ ] **Web**: Service list
- [ ] **Web**: Add/Edit service
- [ ] **Web**: Service ordering

#### 5.5 Salon Settings

- [ ] **Web**: Salon profile edit
- [ ] **Web**: Business hours
- [ ] **Web**: Payment settings

---

### Phase 6: Polish & Deploy (Week 12)

#### 6.1 Testing

- [ ] Unit tests (Jest)
- [ ] E2E tests (Playwright)
- [ ] API tests

#### 6.2 Performance

- [ ] Image optimization
- [ ] Code splitting
- [ ] Caching strategy (Redis)

#### 6.3 Deployment

- [ ] Setup CI/CD (GitHub Actions)
- [ ] Deploy API (Railway/Render/VPS)
- [ ] Deploy Web (Vercel)
- [ ] Submit Zalo Mini App

#### 6.4 Documentation

- [ ] API documentation (Swagger)
- [ ] Deployment guide
- [ ] White-label guide

---

## 🎨 White-Label Architecture

### Brand Configuration

```typescript
// packages/brand/src/config.ts
export interface BrandConfig {
  // Identity
  name: string;
  slug: string;
  tagline: string;

  // Visual
  logo: {
    light: string;
    dark: string;
    icon: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };

  // Contact
  contact: {
    phone: string;
    email: string;
    address: string;
  };

  // Social
  social: {
    facebook?: string;
    instagram?: string;
    zalo?: string;
    tiktok?: string;
  };

  // Business
  defaultCurrency: string;
  defaultLocale: string;

  // Features
  features: {
    enableReviews: boolean;
    enableLoyalty: boolean;
    enableMultiSalon: boolean;
  };
}

// Example: ReetroBarberShop
export const reetroConfig: BrandConfig = {
  name: "ReetroBarberShop",
  slug: "reetro",
  tagline: "Phong cách - Đẳng cấp - Chất lượng",
  logo: {
    light: "/logos/reetro-light.svg",
    dark: "/logos/reetro-dark.svg",
    icon: "/logos/reetro-icon.svg",
  },
  colors: {
    primary: "#1a1a2e",
    secondary: "#16213e",
    accent: "#e94560",
    background: "#ffffff",
    text: "#1a1a2e",
  },
  fonts: {
    heading: "Playfair Display",
    body: "Inter",
  },
  contact: {
    phone: "1900 xxxx xx",
    email: "contact@reetro.vn",
    address: "Hà Nội, Việt Nam",
  },
  social: {
    facebook: "https://facebook.com/reetrobarbershop",
    zalo: "https://zalo.me/reetrobarbershop",
  },
  defaultCurrency: "VND",
  defaultLocale: "vi",
  features: {
    enableReviews: true,
    enableLoyalty: false,
    enableMultiSalon: true,
  },
};
```

### Usage in Apps

```typescript
// apps/web/app/layout.tsx
import { getBrandConfig } from '@reetro/brand';

export default function RootLayout({ children }) {
  const brand = getBrandConfig();

  return (
    <html style={{ '--color-primary': brand.colors.primary }}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 📁 File Structure Details

### Apps

#### apps/web (Next.js)

```
apps/web/
├── app/
│   ├── (marketing)/          # Public pages
│   │   ├── page.tsx          # Landing page
│   │   ├── about/
│   │   └── contact/
│   │
│   ├── (customer)/           # Customer routes
│   │   ├── layout.tsx        # Customer layout
│   │   ├── booking/
│   │   │   ├── page.tsx      # Booking wizard
│   │   │   ├── [salonId]/
│   │   │   └── confirm/
│   │   ├── salons/
│   │   │   ├── page.tsx      # Salon list
│   │   │   └── [slug]/       # Salon detail
│   │   ├── my-bookings/
│   │   │   ├── page.tsx      # Booking history
│   │   │   └── [id]/         # Booking detail
│   │   └── profile/
│   │
│   ├── (admin)/              # Admin routes (protected)
│   │   ├── layout.tsx        # Admin layout + sidebar
│   │   ├── dashboard/
│   │   ├── bookings/
│   │   ├── staff/
│   │   ├── services/
│   │   ├── salons/           # Super admin only
│   │   ├── users/            # Super admin only
│   │   └── settings/
│   │
│   ├── (auth)/               # Auth routes
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   │
│   └── api/                  # API routes (BFF)
│       ├── auth/
│       │   └── [...nextauth]/
│       └── webhooks/
│           └── sepay/
│
├── components/
│   ├── booking/
│   ├── salon/
│   ├── admin/
│   └── shared/
│
├── lib/
│   ├── auth.ts
│   ├── api.ts
│   └── utils.ts
│
├── hooks/
├── styles/
└── public/
```

#### apps/api (NestJS)

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/
│   │   │   ├── strategies/
│   │   │   ├── guards/
│   │   │   └── decorators/
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   │
│   │   ├── salons/
│   │   ├── services/
│   │   ├── staff/
│   │   ├── bookings/
│   │   ├── payments/
│   │   ├── reviews/
│   │   └── notifications/
│   │
│   ├── common/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── pipes/
│   │   └── decorators/
│   │
│   ├── database/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   │
│   └── config/
│       ├── configuration.ts
│       └── validation.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── test/
└── Dockerfile
```

#### apps/zalo-mini (Zalo Mini App)

```
apps/zalo-mini/
├── src/
│   ├── pages/
│   │   ├── index/
│   │   ├── salon/
│   │   ├── booking/
│   │   └── profile/
│   │
│   ├── components/
│   ├── services/
│   └── utils/
│
├── app.json
└── package.json
```

---

## 🔌 API Endpoints

### Auth

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/google
GET    /api/auth/google/callback
GET    /api/auth/facebook
GET    /api/auth/facebook/callback
POST   /api/auth/zalo
GET    /api/auth/me
PUT    /api/auth/me
POST   /api/auth/change-password
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Salons

```
GET    /api/salons                    # List salons (with filters)
GET    /api/salons/:slug              # Get salon detail
POST   /api/salons                    # Create salon (admin)
PUT    /api/salons/:id                # Update salon (owner)
DELETE /api/salons/:id                # Delete salon (admin)
GET    /api/salons/:id/services       # Get salon services
GET    /api/salons/:id/staff          # Get salon staff
GET    /api/salons/:id/reviews        # Get salon reviews
```

### Services

```
GET    /api/services                  # List all services
GET    /api/services/:id              # Get service detail
POST   /api/services                  # Create service (owner)
PUT    /api/services/:id              # Update service (owner)
DELETE /api/services/:id              # Delete service (owner)
```

### Staff

```
GET    /api/staff                     # List staff (by salon)
GET    /api/staff/:id                 # Get staff detail
POST   /api/staff                     # Add staff (owner)
PUT    /api/staff/:id                 # Update staff (owner)
DELETE /api/staff/:id                 # Remove staff (owner)
GET    /api/staff/:id/schedule        # Get staff schedule
PUT    /api/staff/:id/schedule        # Update staff schedule
GET    /api/staff/:id/available-slots # Get available time slots
```

### Bookings

```
GET    /api/bookings                  # List bookings (filtered by role)
GET    /api/bookings/:id              # Get booking detail
POST   /api/bookings                  # Create booking
PUT    /api/bookings/:id              # Update booking
DELETE /api/bookings/:id              # Cancel booking
POST   /api/bookings/:id/confirm      # Confirm booking (staff)
POST   /api/bookings/:id/complete     # Mark as completed (staff)
GET    /api/bookings/available-slots  # Get available slots
```

### Payments

```
POST   /api/payments/create-qr        # Generate QR code
GET    /api/payments/:id              # Get payment detail
GET    /api/payments/:id/status       # Check payment status
POST   /api/webhooks/sepay            # Sepay webhook
```

### Reviews

```
GET    /api/reviews                   # List reviews
POST   /api/reviews                   # Create review
PUT    /api/reviews/:id               # Update review
DELETE /api/reviews/:id               # Delete review
POST   /api/reviews/:id/reply         # Reply to review (owner)
```

### Admin

```
GET    /api/admin/dashboard           # Dashboard stats
GET    /api/admin/reports/revenue     # Revenue report
GET    /api/admin/reports/bookings    # Booking report
GET    /api/admin/users               # List all users
PUT    /api/admin/users/:id/role      # Update user role
```

---

## ✅ Verification Checklist

### Phase 1 Complete When:

- [ ] Monorepo setup with all apps running
- [ ] User can register/login via email
- [ ] User can login via Google/Facebook
- [ ] Admin can access protected routes
- [ ] Database migrations successful

### Phase 2 Complete When:

- [ ] Zalo Mini App running locally
- [ ] Zalo OAuth works
- [ ] User can view salon list in Zalo
- [ ] User can view salon detail with services
- [ ] User can complete booking flow in Zalo
- [ ] Booking saved to database
- [ ] User can view booking history

### Phase 3 Complete When:

- [ ] QR code generated for payment
- [ ] Sepay webhook received and processed
- [ ] Payment status updates in realtime
- [ ] Booking confirmed after payment
- [ ] Zalo notification working

### Phase 4 Complete When:

- [ ] Web app running with responsive design
- [ ] User can login via Google/Facebook
- [ ] Booking flow complete on Web
- [ ] Payment QR works on Web

### Phase 5 Complete When:

- [ ] Admin dashboard shows statistics
- [ ] Admin can manage bookings
- [ ] Salon owner can manage staff
- [ ] Salon owner can manage services

### Phase 6 Complete When:

- [ ] All apps deployed
- [ ] CI/CD pipeline working
- [ ] Documentation complete
- [ ] Performance optimized

---

## 🚀 Next Steps

1. **Review this plan** - Xác nhận các features và timeline
2. **Run `/create`** - Bắt đầu setup project
3. **Modify manually** - Điều chỉnh plan nếu cần

---

## 📝 Notes

- **Ưu tiên Zalo Mini App trước**, sau đó mới tới Web
- Payment integration cần có tài khoản Sepay thật để test webhook
- Zalo Mini App cần đăng ký Zalo App và submit review
- White-label: Chỉ cần thay đổi `packages/brand/config.ts` để đổi brand

---

_Plan created by GitHub Copilot - February 4, 2026_
