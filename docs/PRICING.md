# Chi phí vận hành & Bảng giá — REETRO Barber Booking System

> Phiên bản: 1.0 | Cập nhật: 20/03/2026  
> Tất cả giá tính theo VNĐ, tỷ giá USD ≈ 27,000 VNĐ

---

## Mục lục

1. [Chi phí hạ tầng (Infrastructure)](#1-chi-phí-hạ-tầng)
2. [Chi phí dịch vụ bên thứ 3](#2-chi-phí-dịch-vụ-bên-thứ-3)
3. [Tổng chi phí vận hành](#3-tổng-chi-phí-vận-hành)
4. [Bảng giá bán giải pháp](#4-bảng-giá-bán-giải-pháp)
5. [So sánh với đối thủ](#5-so-sánh-với-đối-thủ)

---

## 1. Chi phí hạ tầng

> Tất cả services (API, Web, DB, Redis) được deploy trên **Dokploy** (PaaS self-hosted) chạy trên **DigitalOcean Droplet**.

### 1.1 DigitalOcean Droplet + Dokploy

| Gói Droplet         | Cấu hình           | Giá/tháng  | Giá/năm       | Phù hợp         |
|---------------------|--------------------|------------|:-------------:|-----------------|
|**Basic**            |2vCPU/4GB/80GB SSD  |$24 (~650K) |$288 (~7.8M)   | 1-3 chi nhánh   |
|**General Purpose**  |4vCPU/8GB/160GB SSD |$48 (~1.3M) |$576 (~15.6M)  | 5-10 chi nhánh  |
|**CPU-Optimized**    |8vCPU/16GB/320GB SSD|$96 (~2.6M) |$1,152 (~31.2M)| 10-50 chi nhánh |

> **Dokploy**: Miễn phí (open-source), chạy Docker containers cho tất cả services. Bao gồm Traefik reverse proxy + SSL tự động.

### 1.2 Khác

| Dịch vụ             | Giá       | Ghi chú                          |
|---------------------|:---------:|----------------------------------|
| **Domain (.vn)**    | ~350K/năm | Mua riêng                        |
| **SSL Certificate** | 0đ        | Traefik/Let's Encrypt auto-renew |
| **Dokploy**         | 0đ        | Open-source, self-hosted         |

---

## 2. Chi phí dịch vụ bên thứ 3

### 2.1 Cloudinary (Quản lý hình ảnh & video)

| Plan         | Giá       | Bao gồm                                 | Phù hợp         |
|--------------|:---------:|-----------------------------------------|-----------------|
| **Free**     | 0đ        | 25GB storage, 25GB bandwidth/tháng      | 1-3 chi nhánh   |
| **Plus**     | $99/tháng | 225GB storage, 225GB bandwidth          | 5-10 chi nhánh  |
| **Advanced** | $249/tháng| Unlimited                               | 10+ chi nhánh   |

**Ước tính sử dụng:**
- 1 chi nhánh ~ 500 ảnh dịch vụ + nhân viên = ~2GB
- 10 chi nhánh = ~20GB → Free plan đủ dùng ban đầu

### 2.2 Google Gemini AI (Chatbot)
 
| Plan              | Giá               | Rate Limit             | Phù hợp         |
|-------------------|:-----------------:|:----------------------:|-----------------|
| **Free**          | 0đ                | 15 RPM, 1M tokens/phút | 1-5 chi nhánh   |
| **Pay-as-you-go** | ~$0.075/1M tokens | 2,000 RPM              | 5-50 chi nhánh  |

**Ước tính chi phí:**
- 100 cuộc chat/ngày × 30 ngày = 3,000 cuộc chat/tháng
- Mỗi cuộc chat ~ 500 tokens → 1.5M tokens/tháng
- Chi phí: ~$0.11/tháng (~2,800đ) — **gần như miễn phí**
- FAQ cache giảm ~50% API calls → thực tế thấp hơn

### 2.3 Resend (Email)

| Plan     | Giá               | Bao gồm             | Phù hợp         |
|----------|:-----------------:|:-------------------:|-----------------|
| **Free** | 0đ                | 3,000 emails/tháng  | 1-5 chi nhánh   |
| **Pro**  | $20/tháng (~500K) | 50,000 emails/tháng | 5-20 chi nhánh  |

### 2.4 SePay (Thanh toán QR)

| Metric            | Chi tiết                         |
|-------------------|----------------------------------|
| **Phí giao dịch** | 0đ (nhận QR qua ngân hàng)       |
| **API**           | Webhook miễn phí                 |

---

## 3. Tổng chi phí vận hành

### Kịch bản A: 1-3 chi nhánh (Starter)

| Hạng mục                                   | Tháng        | Năm            |
|--------------------------------------------|--------------|----------------|
| Droplet 2vCPU/4GB (API + Web + DB + Redis) | 650,000      | 7,800,000      |
| Domain .vn                                 | 30,000       | 350,000        |
| Cloudinary                                 | 0            | 0              |
| Gemini AI                                  | 0            | 0              |
| Resend Email                               | 0            | 0              |
| **Tổng**                                   | **~680,000** | **~8,150,000** |

### Kịch bản B: 5-10 chi nhánh (Growth)

| Hạng mục                        | Tháng          | Năm             |
|---------------------------------|----------------|-----------------|
| Droplet 4vCPU/8GB (full stack)  | 1,300,000      | 15,600,000      |
| Domain .vn                      | 30,000         | 350,000         |
| Cloudinary Plus ($99)           | 2,700,000      | 32,400,000      |
| Gemini AI Pay-per-use           | 50,000         | 600,000         |
| Resend Pro                      | 500,000        | 6,000,000       |
| **Tổng**                        | **~4,580,000** | **~54,950,000** |

### Kịch bản C: 10-50 chi nhánh (Scale)

| Hạng mục                        | Tháng           | Năm              |
|---------------------------------|-----------------|------------------|
| Droplet 8vCPU/16GB (full stack) | 2,600,000       | 31,200,000       |
| Droplet backup thêm (standby)   | 1,300,000       | 15,600,000       |
| Domain .vn                      | 30,000          | 350,000          |
| Cloudinary Advanced ($249)      | 6,700,000       | 80,400,000       |
| Gemini AI                       | 200,000         | 2,400,000        |
| Resend Business                 | 1,250,000       | 15,000,000       |
| **Tổng**                        | **~12,080,000** | **~144,950,000** |

---

## 4. Bảng giá bán giải pháp

### 4.1 Gói sản phẩm

| Gói            | Giá bán      | Bao gồm                                                          | Đối tượng           |
|----------------|--------------|------------------------------------------------------------------|---------------------|
|**Basic**       |**15,000,000**|1 chi nhánh, đầy đủ tính năng, 3 tháng hỗ trợ                     | Tiệm nhỏ, 1 cơ sở   |
|**Professional**|**35,000,000**| Tối đa 5 chi nhánh, AI chatbot, 6 tháng hỗ trợ                   | Chuỗi vừa           |
|**Enterprise**  |**80,000,000**| Không giới hạn chi nhánh, tùy chỉnh theo yêu cầu, 12 tháng hỗ trợ| Chuỗi lớn, franchise|

### 4.2 Phí duy trì & hỗ trợ (sau thời gian miễn phí)

| Gói              | Phí/tháng | Bao gồm                                       |
|------------------|----------:|-----------------------------------------------|
| **Basic**        | 500,000   | Hosting, backup, hotfix                       |
| **Professional** | 1,500,000 | Hosting, backup, hotfix, priority support     |
| **Enterprise**   | 3,000,000 | Dedicated support, SLA 99.9%, custom features |

### 4.3 Add-on (Tính năng bổ sung)

| Add-on                               | Giá                     |
|--------------------------------------|------------------------:|
| Tùy chỉnh giao diện theo thương hiệu | 5,000,000               |
| Tích hợp POS (máy in bill, QR)       | 3,000,000               |
| App di động iOS/Android              | 30,000,000 - 50,000,000 |
| Tính năng loyalty/tích điểm          | 8,000,000               |
| Multi-language (EN/VN/KR...)         | 5,000,000               |
| Dashboard phân tích nâng cao (BI)    | 10,000,000              |

### 4.4 Mô hình SaaS (thuê bao tháng) — Thay thế

| Gói                       | Giá/tháng | Giá/năm (giảm 20%) |
|---------------------------|----------:|-------------------:|
| **Starter** (1 chi nhánh) | 990,000   | 9,500,000          |
| **Growth** (tối đa 5)     | 2,490,000 | 24,000,000         |
| **Scale** (tối đa 20)     | 4,990,000 | 48,000,000         |
| **Unlimited**             | Liên hệ   | Liên hệ            |

> **Bao gồm:** Hosting, bảo trì, cập nhật, backup hàng ngày, hỗ trợ kỹ thuật

---

## 5. So sánh với đối thủ

| Tiêu chí           | **REETRO** | Barberly | KiotViet | Fresha   |
|--------------------|:----------:|:--------:|:--------:|:--------:|
| Đặt lịch online    | Có         | Có       | Không    | Có       |
| Quản lý chuỗi      | Có         | Không    | Có       | Có       |
| AI Chatbot         | Có         | Không    | Không    | Không    |
| QR thanh toán      | Có         | Không    | Không    | Không    |
| Hồ sơ barber       | Có         | Không    | Không    | Có       |
| Walk-in + Queue    | Có         | Không    | Không    | Có       |
| Onboarding tự động | Có         | Không    | Không    | Không    |
| Giá/tháng          | **990K**   | 500K     | 300K     | Free-$49 |
| Tùy chỉnh          | Có Full    | Không    | Không    | Không    |
| Self-hosted        | Có         | Không    | Không    | Không    |

**Lợi thế cạnh tranh:**
- AI Chatbot tích hợp sẵn
- Walk-in + Online booking kết hợp
- Hồ sơ barber chuyên nghiệp
- Self-hosted = toàn quyền kiểm soát data
- Tùy chỉnh không giới hạn

---

> **Lưu ý:** Tất cả chi phí là ước tính, có thể thay đổi tùy theo nhà cung cấp và thời điểm. Free tier có giới hạn, phù hợp giai đoạn đầu.

(Pad2806)