# Cập nhật điều hướng & Chức năng Lịch hẹn

## Lĩnh vực (Domain)
- Dự án: **WEB** (Next.js)
- Agent chính: `frontend-specialist`, `backend-specialist`

## Mục tiêu (Goal)
Khắc phục lỗi điều hướng trang (Back button) sau khi thanh toán và xây dựng màn hình Danh sách lịch hẹn chi tiết cho Khách hàng.

## Tiêu chuẩn thành công (Success Criteria)
- [ ] User sau khi ở trang Payment -> Ấn "Xem chi tiết" -> Ở trang chi tiết ấn Back -> Về trang "Danh sách lịch hẹn" (Không về lại Payment).
- [ ] Ở màn hình trình duyệt ấn nút mũi tên quay lại (Browser Back) -> Về trang Lịch hẹn, hoàn toàn không dính líu đến Payment hay Confirm cũ.
- [ ] Xây dựng hoàn chỉnh UI trang `/my-bookings` danh sách lịch hẹn có các Tab phân loại (Sắp tới, Đã qua, Đã hủy).

## Hệ thống file dự kiến bổ sung / sửa đổi
1. `apps/web/src/app/(customer)/payment/[bookingId]/page.tsx` (Sửa logic Link -> `router.replace`)
2. `apps/web/src/app/(customer)/my-bookings/page.tsx` (Tạo mới: Danh sách lịch hẹn tổng quát)
3. `apps/web/src/app/(customer)/my-bookings/[id]/page.tsx` (Thêm nút Back tùy chỉnh ghi đè hành vi mặc định)
4. Tích hợp `bookingApi.getAll()` hoặc `bookingApi.getMyBookings()` từ lib/api để gọi data lên UI.

## Chi tiết kế hoạch nhiệm vụ (Task Breakdown)

- [ ] **Task 1: Cập nhật thư viện API Frontend phục vụ Lịch hẹn của tôi**
  - Update `api.ts` để gọi endpoint `/bookings/my-bookings` (để lấy danh sách lịch hẹn của current User).
  - Verify: Test hàm API trả về mảng danh sách bookings ok chưa.

- [ ] **Task 2: Sửa lại điều hướng trang Payment (Next.js Routing)**
  - Thay thẻ `<Link href="/my-bookings/id">` bằng `router.replace("/my-bookings/id")`.
  - Verify: Chạy thử luồng, ở trang my-bookings/[id] ấn Browser Back xem có về payment không bị rác history. 

- [ ] **Task 3: Thiết kế và Xây dựng trang Danh sách lịch hẹn (`/my-bookings/page.tsx`)**
  - Làm Header có tiêu đề "Lịch hẹn của tôi".
  - Chèn hệ thống Tab (Trạng thái: PENDING/CONFIRMED -> Sắp tới, COMPLETED -> Hoàn thành, CANCELLED -> Đã hủy).
  - List ra UI Card cho từng lịch hẹn (Bảo gồm Tên Salon, Ngày giờ, Styling, Tổng tiền).
  - Verify: Giao diện load lên mượt mà theo đúng Style guide và Tailwind CSS mới.

- [ ] **Task 4: Chỉnh sửa giao diện Chi tiết Lịch hẹn (`/my-bookings/[id]/page.tsx`)**
  - Cập nhật Nút `< Quay lại` góc trái trên cùng để bắt buộc đẩy hướng về `/my-bookings` (chặn quay lưng về payment).
  - Bổ sung nút "Hủy lịch hẹn" nếu trạng thái đang là PENDING.
  - Verify: Thử ấn các nút điều hướng nội bộ.

## ✅ PHASE X: VERIFICATION (Điều kiện hoàn tất)
- [ ] Không có mã màu `purple/violet`.
- [ ] ESLint không báo lỗi.
- [ ] Thiết kế chạy mượt mà trên chuẩn Responsive (Mobile first).
- [ ] Luồng UX đạt chuẩn y chang Zalo Mini App. 
