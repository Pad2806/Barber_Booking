# 📖 Hướng dẫn sử dụng — REETRO Barber Booking System

> Phiên bản: 2.0 | Cập nhật: 22/03/2026

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Dành cho Khách hàng (Customer)](#2-dành-cho-khách-hàng)
3. [Dành cho Thu ngân (Cashier)](#3-dành-cho-thu-ngân)
4. [Dành cho Thợ cắt tóc (Barber)](#4-dành-cho-thợ-cắt-tóc)
5. [Dành cho Quản lý chi nhánh (Manager)](#5-dành-cho-quản-lý-chi-nhánh)
6. [Dành cho Admin hệ thống](#6-dành-cho-admin-hệ-thống)
7. [AI Chatbot](#7-ai-chatbot)
8. [Zalo Mini App](#8-zalo-mini-app)
9. [Hệ thống thông báo](#9-hệ-thống-thông-báo)

---

## 1. Tổng quan hệ thống

REETRO là phần mềm quản lý chuỗi tiệm cắt tóc (Barber) toàn diện, hỗ trợ:
- Đặt lịch online & walk-in
- Quản lý nhân viên, ca làm việc, nghỉ phép
- Thanh toán (tiền mặt + QR chuyển khoản tự động)
- Đánh giá & feedback
- AI Chatbot hỗ trợ khách hàng
- Thông báo real-time cho tất cả vai trò
- Zalo Mini App cho khách hàng

### Các vai trò (Roles)

| Vai trò | Quyền hạn chính |
|---------|-----------------|
| **Customer (Khách hàng)** | Đặt lịch, xem dịch vụ, thanh toán cọc, đánh giá, chat AI |
| **Cashier (Thu ngân)** | Tiếp nhận khách walk-in, duyệt đơn online, thanh toán, quản lý hàng đợi |
| **Barber (Thợ cắt)** | Xem lịch được phân công, xem lịch làm việc, quản lý hồ sơ |
| **Manager (Quản lý)** | Quản lý chi nhánh, nhân viên, lịch làm việc, nghỉ phép, doanh thu |
| **Admin** | Quản lý toàn hệ thống, cấu hình, dịch vụ, tất cả chi nhánh |

### Onboarding tự động

Khi lần đầu đăng nhập vào hệ thống, mỗi vai trò sẽ nhận được một **tour hướng dẫn tương tác** giới thiệu từng chức năng trên giao diện thật. Bạn có thể xem lại bất kỳ lúc nào bằng cách nhấn nút **"?"** trên thanh header.

---

## 2. Dành cho Khách hàng

### 2.1 Đăng ký / Đăng nhập

- **Email + Mật khẩu**: Đăng ký tài khoản mới hoặc đăng nhập
- **Đăng nhập xã hội**: Google, Facebook, Zalo (1 chạm)
- Sau khi đăng nhập, hệ thống tự động chuyển về trang bạn đang xem trước đó

### 2.2 Tìm & chọn chi nhánh

1. Vào trang **Salon** → Xem danh sách chi nhánh
2. Xem chi tiết: địa chỉ, giờ mở cửa, đánh giá, đội ngũ barber
3. Xem **hồ sơ barber**: năm kinh nghiệm, chuyên môn, gallery tác phẩm, thành tích
4. Lưu salon yêu thích để truy cập nhanh lần sau

### 2.3 Đặt lịch (4 bước)

1. **Chọn dịch vụ**: Chọn 1 hoặc nhiều dịch vụ (cắt, gội, nhuộm, combo...)
2. **Chọn stylist**: Chọn barber yêu thích hoặc để hệ thống tự phân công
3. **Chọn ngày & giờ**: Chọn ngày trong vòng 30 ngày tới → Chọn khung giờ trống
4. **Xác nhận**: Kiểm tra thông tin, thêm ghi chú → Xác nhận đặt lịch

> **Lưu ý**: Khung giờ được **giữ chỗ** trong thời gian bạn thanh toán. Nếu không thanh toán trong thời gian quy định, lịch hẹn sẽ tự động bị hủy và giải phóng slot cho người khác.

### 2.4 Thanh toán đặt cọc

- Sau khi đặt lịch, bạn cần thanh toán **đặt cọc 25%** tổng giá trị dịch vụ
- Hệ thống tạo **mã QR chuyển khoản** (VietQR)
- Mở ứng dụng ngân hàng → Quét mã QR → Hệ thống **tự động xác nhận** trong vài giây
- Có đồng hồ đếm ngược thời gian thanh toán (khoảng 10 phút)
- Nếu hết thời gian mà chưa thanh toán → Booking tự động bị hủy
- Phần còn lại (**75%**) thanh toán tại salon sau khi hoàn thành dịch vụ

### 2.5 Quản lý lịch hẹn (My Bookings)

- Xem tất cả lịch hẹn: Đang chờ, Đã xác nhận, Đã hoàn thành, Đã hủy
- **Hủy lịch hẹn** trước giờ hẹn (nếu salon cho phép)
- Xem chi tiết: dịch vụ, barber, ngày giờ, trạng thái thanh toán
- Truy cập trang thanh toán nếu chưa cọc

### 2.6 Đánh giá

- Sau khi cắt xong → Đánh giá sao (1-5) + bình luận
- Quản lý chi nhánh có thể phản hồi đánh giá của bạn

### 2.7 Tính năng khác

- **Yêu thích**: Lưu chi nhánh/barber yêu thích
- **Hồ sơ**: Cập nhật thông tin cá nhân, avatar
- **AI Chat**: Hỏi đáp tự động về dịch vụ, giá, giờ mở cửa (xem mục 7)
- **Trang tĩnh**: Giới thiệu, Tuyển dụng, Nhượng quyền, Điều khoản, Chính sách

---

## 3. Dành cho Thu ngân (Cashier)

### 3.1 Dashboard (Tổng quan)

- Tổng quan hôm nay: lịch hẹn, doanh thu, khách chờ
- Thống kê nhanh theo ngày
- Có **tour onboarding** khi lần đầu sử dụng

### 3.2 Duyệt đơn Online

- Xem tất cả lịch hẹn đặt online chờ duyệt
- Xác nhận hoặc từ chối đơn từ đây
- Lọc theo ngày, trạng thái

### 3.3 Tiếp nhận Walk-in (Khách vãng lai)

1. Chọn **Khách vãng lai** → Nhập tên khách (hoặc tìm khách cũ)
2. Chọn dịch vụ → Gán barber
3. Khách tự động vào hàng đợi

### 3.4 Quản lý lịch hẹn

- Xem tất cả booking của chi nhánh hôm nay
- Lọc theo ngày, barber, trạng thái
- Chuyển trạng thái: Chờ → Đang phục vụ → Hoàn thành

### 3.5 Thanh toán (Checkout)

1. Chọn booking hoàn thành → Xác nhận dịch vụ & giá
2. Hệ thống tự trừ phần đã đặt cọc (25%)
3. Chọn phương thức thanh toán phần còn lại: **Tiền mặt** hoặc **QR chuyển khoản**
4. Xác nhận thanh toán

### 3.6 Báo cáo doanh thu

- Xem doanh thu theo ngày/tuần/tháng
- Chi tiết từng giao dịch
- Phân loại: tiền mặt vs chuyển khoản

### 3.7 Thông báo

- Biểu tượng **chuông thông báo** trên header
- Badge đỏ hiển thị số thông báo chưa đọc
- Nhận thông báo khi: có đơn online mới, thanh toán thành công, đánh giá mới

---

## 4. Dành cho Thợ cắt tóc (Barber)

### 4.1 Dashboard

- Xem tổng quan: lịch hẹn hôm nay, đánh giá trung bình
- Hiển thị rating cá nhân trên header

### 4.2 Booking phân công

- Xem tất cả lịch hẹn được phân công cho mình
- Lọc theo ngày, trạng thái
- Xem chi tiết: khách hàng, dịch vụ, thời gian

### 4.3 Lịch của tôi

- Xem lịch làm việc theo tuần
- Biết được ca nào cần đi làm
- Xem ngày nghỉ đã được duyệt

### 4.4 Thông báo

- Biểu tượng **chuông thông báo** trên header
- Nhận thông báo khi: có booking mới được phân công, lịch hẹn bị hủy

---

## 5. Dành cho Quản lý chi nhánh (Manager)

### 5.1 Dashboard

- Tổng quan chi nhánh: doanh thu, lịch hẹn hôm nay, nhân viên đang làm
- Biểu đồ xu hướng doanh thu
- Có **tour onboarding** khi lần đầu sử dụng

### 5.2 Quản lý nhân viên

- Xem danh sách nhân viên chi nhánh
- Xem/sửa hồ sơ: bio, ảnh, chuyên môn, thành tích
- Tạo trang hồ sơ chuyên nghiệp cho barber

### 5.3 Lịch làm việc (Schedule)

- Thiết lập ca làm cho từng nhân viên
- Xem lịch tổng quan theo tuần
- Kéo thả để sắp xếp ca

### 5.4 Quản lý nghỉ phép

- Duyệt/từ chối đơn xin nghỉ phép
- Xem lịch sử nghỉ phép
- Kiểm tra xung đột lịch trước khi duyệt

### 5.5 Lịch hẹn

- Xem tất cả booking của chi nhánh
- Lọc theo ngày, barber, trạng thái

### 5.6 Đánh giá & Phản hồi

- Xem đánh giá từ khách hàng cho chi nhánh
- Phản hồi đánh giá

### 5.7 Báo cáo doanh thu

- Báo cáo chi tiết theo ngày/tuần/tháng
- So sánh hiệu suất nhân viên
- Lọc theo khoảng thời gian

### 5.8 Thông báo

- Biểu tượng **chuông thông báo** trên header
- Nhận thông báo khi: có booking mới, thanh toán, đánh giá mới, yêu cầu nghỉ phép

---

## 6. Dành cho Admin hệ thống

### 6.1 Dashboard

- Tổng quan toàn hệ thống: tổng doanh thu, tổng booking, tổng khách hàng
- Biểu đồ phân tích

### 6.2 Quản lý chi nhánh (Salons)

- Tạo/sửa/xóa chi nhánh
- Cấu hình giờ hoạt động, địa chỉ, hình ảnh
- Upload nhiều ảnh & video giới thiệu

### 6.3 Quản lý dịch vụ (Services)

- Tạo/sửa/xóa dịch vụ
- **Tạo dịch vụ cho nhiều chi nhánh cùng lúc** (bulk create)
- Upload ảnh & video cho dịch vụ
- Phân loại dịch vụ (cắt, nhuộm, gội, combo, v.v.)
- Cấu hình giá, thời gian thực hiện
- Sắp xếp thứ tự hiển thị

### 6.4 Quản lý nhân viên

- Tạo/sửa nhân viên cho tất cả chi nhánh
- Quản lý hồ sơ barber chuyên nghiệp
- Gán nhân viên vào chi nhánh
- Phân quyền: Barber, Skinner, Cashier, Manager

### 6.5 Quản lý lịch hẹn

- Xem toàn bộ bookings hệ thống
- Lọc theo chi nhánh, trạng thái, ngày
- Booking hết hạn thanh toán sẽ tự động bị hủy sau 15 phút

### 6.6 Quản lý khách hàng

- Xem danh sách khách hàng toàn hệ thống
- Xem lịch sử đặt lịch của từng khách

### 6.7 Đánh giá toàn hệ thống

- Xem tất cả đánh giá từ mọi chi nhánh
- Phản hồi đánh giá

### 6.8 Quản lý nghỉ phép

- Duyệt/từ chối nghỉ phép cho toàn hệ thống

### 6.9 Lịch làm việc

- Xem lịch tổng quan tất cả chi nhánh

### 6.10 Cài đặt hệ thống

- Cấu hình thông tin ngân hàng (cho thanh toán QR)
- Bật/tắt thông báo theo loại sự kiện
- Quản lý API keys
- Cấu hình chung của hệ thống

### 6.11 Thông báo

- Biểu tượng **chuông thông báo** trên header
- Admin & Salon Owner nhận được tất cả thông báo: booking mới, thanh toán, đánh giá, hệ thống

---

## 7. AI Chatbot

### Tính năng

- Trả lời tự động: dịch vụ, giá, giờ mở cửa, địa chỉ
- Hỗ trợ đặt lịch qua chat
- FAQ tự động (không gọi AI) cho câu hỏi phổ biến
- Hỗ trợ trả lời ngày/giờ hiện tại
- Sử dụng Google Gemini AI

### Câu hỏi gợi ý

- "Xem dịch vụ & giá"
- "Giờ mở cửa hôm nay"
- "Cách đặt lịch"
- "Địa chỉ chi nhánh"
- "Tôi muốn đặt lịch cắt tóc"

---

## 8. Zalo Mini App

Khách hàng có thể sử dụng REETRO trực tiếp trong ứng dụng **Zalo** mà không cần cài thêm app:

### Tính năng có sẵn

- Đặt lịch online (chọn salon → dịch vụ → stylist → ngày giờ)
- Thanh toán QR trong app
- Xem lịch hẹn của tôi
- Quản lý hồ sơ cá nhân
- Xem danh sách salon & chi tiết
- Yêu thích salon
- Xem thông báo
- Đăng nhập bằng tài khoản Zalo (1 chạm)

### Truy cập

Tìm kiếm **"ReetroBarberShop"** trên Zalo → Mở Mini App

---

## 9. Hệ thống thông báo

### Ai nhận thông báo gì?

| Sự kiện | Khách hàng | Thu ngân | Barber | Quản lý | Admin |
|---------|:----------:|:--------:|:------:|:-------:|:-----:|
| Đặt lịch mới | ✅ | ✅ | ✅ | ✅ | ✅ |
| Thanh toán thành công | ✅ | ✅ | — | ✅ | ✅ |
| Booking bị hủy | ✅ | ✅ | ✅ | ✅ | ✅ |
| Đánh giá mới | — | — | — | ✅ | ✅ |
| Yêu cầu nghỉ phép | — | — | — | ✅ | ✅ |

### Cách xem thông báo

- **Website**: Click vào biểu tượng 🔔 trên header → Dropdown hiển thị danh sách thông báo
- **Zalo Mini App**: Vào trang Thông báo từ menu Profile
- Badge đỏ với số đếm hiển thị khi có thông báo chưa đọc
- Có thể đánh dấu đã đọc từng thông báo hoặc đọc tất cả

---

## Hỗ trợ kỹ thuật

| Kênh | Liên hệ |
|------|---------|
| Email | support@reetro.vn |
| Hotline | 1900-xxxx |
| Chat | AI Chatbot trong ứng dụng |

> **Xem thêm:**
> - [Hướng dẫn triển khai](DEPLOYMENT.md)
> - [Bảng giá & chi phí](PRICING.md)
> - [README](../README.md)
