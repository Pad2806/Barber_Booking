# 📖 Hướng dẫn sử dụng — REETRO Barber Booking System

> Phiên bản: 1.0 | Cập nhật: 20/03/2026

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Dành cho Khách hàng (Customer)](#2-dành-cho-khách-hàng)
3. [Dành cho Thu ngân (Cashier)](#3-dành-cho-thu-ngân)
4. [Dành cho Quản lý chi nhánh (Manager)](#4-dành-cho-quản-lý-chi-nhánh)
5. [Dành cho Admin hệ thống](#5-dành-cho-admin-hệ-thống)
6. [AI Chatbot](#6-ai-chatbot)

---

## 1. Tổng quan hệ thống

REETRO là phần mềm quản lý chuỗi tiệm cắt tóc (Barber) toàn diện, hỗ trợ:
- Đặt lịch online & walk-in
- Quản lý nhân viên, ca làm, nghỉ phép
- Thanh toán (tiền mặt + QR chuyển khoản)
- Đánh giá & feedback
- AI Chatbot hỗ trợ khách hàng

### Các vai trò (Roles)

| Vai trò | Quyền hạn chính |
|---------|-----------------|
| **Customer** | Đặt lịch, xem dịch vụ, đánh giá, chat AI |
| **Cashier** | Tiếp nhận khách walk-in, thanh toán, quản lý hàng đợi |
| **Manager** | Quản lý chi nhánh, nhân viên, lịch làm việc, doanh thu |
| **Admin** | Quản lý toàn hệ thống, tất cả chi nhánh, cấu hình |

---

## 2. Dành cho Khách hàng

### 2.1 Đăng ký / Đăng nhập

- **Email + Mật khẩu**
- **Đăng nhập xã hội**: Google, Facebook, Zalo
- Hệ thống onboarding tự động hướng dẫn lần đầu sử dụng

### 2.2 Tìm & chọn chi nhánh

1. Vào trang **Salons** → Xem danh sách chi nhánh
2. Xem chi tiết: địa chỉ, giờ mở cửa, đánh giá, đội ngũ barber
3. Xem **hồ sơ barber**: năm kinh nghiệm, chuyên môn, gallery tác phẩm, thành tích

### 2.3 Đặt lịch

1. Chọn chi nhánh → Chọn dịch vụ (hỗ trợ chọn nhiều dịch vụ)
2. Chọn barber yêu thích (hoặc để hệ thống tự phân)
3. Chọn ngày & khung giờ trống
4. Xác nhận → Nhận thông báo qua email
5. Có thể **hủy lịch** trước giờ hẹn

### 2.4 Thanh toán

- Thanh toán tại quầy: tiền mặt hoặc QR chuyển khoản (SePay)
- Xem lịch sử thanh toán trong **My Bookings**

### 2.5 Đánh giá

- Sau khi cắt xong → đánh giá sao (1-5) + bình luận
- Quản lý có thể phản hồi đánh giá

### 2.6 Tính năng khác

- **Yêu thích**: Lưu chi nhánh/barber yêu thích
- **Hồ sơ**: Cập nhật thông tin cá nhân, avatar
- **AI Chat**: Hỏi đáp tự động về dịch vụ, giá, giờ mở cửa

---

## 3. Dành cho Thu ngân (Cashier)

### 3.1 Dashboard

- Tổng quan: lịch hẹn hôm nay, doanh thu, khách chờ
- Thống kê nhanh theo ngày

### 3.2 Quản lý hàng đợi (Queue)

- Xem hàng đợi real-time
- Thêm khách walk-in vào hàng đợi
- Chuyển trạng thái: Chờ → Đang phục vụ → Hoàn thành

### 3.3 Tiếp nhận Walk-in

1. Chọn **Walk-in** → Nhập tên khách
2. Chọn dịch vụ → Gán barber
3. Khách tự động vào hàng đợi

### 3.4 Đặt lịch Online

- Xem & xác nhận lịch hẹn đặt online
- Gọi khách khi đến lượt

### 3.5 Thanh toán (Checkout)

1. Chọn booking hoàn thành → Xác nhận dịch vụ & giá
2. Chọn phương thức: **Tiền mặt** hoặc **QR chuyển khoản**
3. Xác nhận thanh toán → In/gửi hóa đơn

### 3.6 Báo cáo doanh thu

- Xem doanh thu theo ngày/tuần/tháng
- Chi tiết từng giao dịch

---

## 4. Dành cho Quản lý chi nhánh (Manager)

### 4.1 Dashboard

- Tổng quan chi nhánh: doanh thu, lịch hẹn, nhân viên online
- Biểu đồ xu hướng

### 4.2 Quản lý nhân viên

- Xem danh sách nhân viên chi nhánh
- Xem/sửa hồ sơ: bio, ảnh, chuyên môn, thành tích
- Tạo trang hồ sơ chuyên nghiệp cho barber

### 4.3 Lịch làm việc (Schedule)

- Thiết lập ca làm cho từng nhân viên
- Xem lịch tổng quan theo tuần

### 4.4 Quản lý nghỉ phép

- Duyệt/từ chối đơn xin nghỉ phép
- Xem lịch sử nghỉ phép

### 4.5 Lịch hẹn

- Xem tất cả booking của chi nhánh
- Lọc theo ngày, barber, trạng thái

### 4.6 Đánh giá & Phản hồi

- Xem đánh giá từ khách hàng
- Phản hồi đánh giá

### 4.7 Báo cáo doanh thu

- Báo cáo chi tiết theo ngày/tuần/tháng
- So sánh hiệu suất nhân viên

---

## 5. Dành cho Admin hệ thống

### 5.1 Quản lý chi nhánh (Salons)

- Tạo/sửa/xóa chi nhánh
- Cấu hình giờ hoạt động, địa chỉ, hình ảnh

### 5.2 Quản lý dịch vụ (Services)

- Tạo/sửa/xóa dịch vụ
- **Tạo dịch vụ cho nhiều chi nhánh cùng lúc** (bulk create)
- Upload ảnh & video cho dịch vụ
- Phân loại dịch vụ (cắt, nhuộm, gội, combo, v.v.)
- Sắp xếp thứ tự hiển thị

### 5.3 Quản lý nhân viên

- Tạo/sửa nhân viên cho tất cả chi nhánh
- Quản lý hồ sơ barber
- Gán nhân viên vào chi nhánh

### 5.4 Quản lý lịch hẹn

- Xem toàn bộ bookings hệ thống
- Lọc theo chi nhánh, trạng thái, ngày

### 5.5 Quản lý khách hàng

- Xem danh sách khách hàng
- Xem lịch sử đặt lịch của từng khách

### 5.6 Đánh giá toàn hệ thống

- Xem tất cả đánh giá
- Phản hồi đánh giá

### 5.7 Quản lý nghỉ phép

- Duyệt/từ chối nghỉ phép cho toàn hệ thống

### 5.8 Cài đặt hệ thống

- Cấu hình chung
- Quản lý API keys

### 5.9 Lịch làm việc

- Xem lịch tổng quan tất cả chi nhánh

---

## 6. AI Chatbot

### Tính năng

- Trả lời tự động: dịch vụ, giá, giờ mở cửa, địa chỉ
- Hỗ trợ đặt lịch qua chat
- FAQ tự động (không gọi AI) cho câu hỏi phổ biến
- Hỗ trợ trả lời ngày/giờ hiện tại

### Câu hỏi gợi ý

- "Xem dịch vụ & giá"
- "Giờ mở cửa hôm nay"
- "Cách đặt lịch"
- "Địa chỉ chi nhánh"

---

## Hỗ trợ kỹ thuật

| Kênh    | Liên hệ                   |
|---------|---------------------------|
| Email   | support@reetro.vn         |
| Hotline | 1900-xxxx                 |
| Chat    | AI Chatbot trong ứng dụng |
