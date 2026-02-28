# Kế hoạch sửa đổi phương thức thanh toán giống Zalo Mini App

## Mục tiêu
Điều chỉnh luồng thanh toán (Payment) của hệ thống booking website để có trải nghiệm và quy trình giống hệt với Zalo Mini App hiện tại.

## Thông tin cần làm rõ (Socratic Questions)
Trước khi đưa ra giải pháp kỹ thuật cụ thể, hãy xác nhận các luồng nghiệp vụ sau đây:

1. **Luồng thanh toán ở Zalo Mini App hiện tại hoạt động như thế nào?**
   - Người dùng có bắt buộc phải thanh toán cọc 50% ngay lúc đặt lịch không? Hay chỉ thanh toán sau khi làm xong?
   - Zalo Mini App có tích hợp cổng thanh toán trực tiếp qua ví ZaloPay không, hay vẫn chuyển khoản quét mã VietQR truyền thống?
2. **Quy trình xử lý giao diện (UX/UI)**
   - Ở Zalo, khi chuyển sang màn hình thanh toán, có đếm ngược thời gian không? Nếu hết thời gian thì đơn bị hủy hay vẫn giữ trạng thái PENDING?
   - Cần bổ sung Modal hoặc Bottom Sheet (như Zalo) hay giữ nguyên trang `/payment/[bookingId]` như hiện tại?
3. **Mức độ tích hợp**
   - Web app có cần tích hợp liên kết Deep Link để mở App Ngân Hàng / ZaloPay lên tự động không?

## Nhiệm vụ (Sau khi làm rõ yêu cầu)
- [ ] Phân tích các hàm Payment trên Frontend và Backend.
- [ ] So sánh luồng Component UI của Website so với Zalo MiniApp.
- [ ] Viết lại UI/UX thanh toán (nếu khác biệt).
- [ ] Cập nhật kết nối API (nếu luồng Zalo yêu cầu gọi webhook/websocket theo thời gian thực thay vì polling).

## Điều kiện hoàn thành (Done When)
- [ ] Người dùng trải qua bài test thử luồng thanh toán từ đầu chí cuối và công nhận giống Zalo Mini App.
