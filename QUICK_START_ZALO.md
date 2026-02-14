# 🎯 HƯỚNG DẪN NHANH - DEPLOY ZALO MINI APP

## ✅ TẤT CẢ CÁC LỖI ĐÃ ĐƯỢC FIX

- ✅ Lỗi -1401 "Zalo app has not been activated"
- ✅ Network Error khi gọi API
- ✅ Màn hình trắng khi deploy
- ✅ Deploy script lỗi trên Windows

## 🚀 CÁCH DEPLOY (SIÊU ĐƠN GIẢN)

### Cách 1: Tự động (Khuyến nghị)

```bash
npm run zalo:deploy
```

Script sẽ tự động:
1. ✅ Kiểm tra tất cả config
2. ✅ Hỏi bạn có muốn commit/push không
3. ✅ Chờ backend deploy
4. ✅ Deploy Zalo Mini App
5. ✅ Hiển thị QR code để test

### Cách 2: Thủ công (3 bước)

#### Bước 1: Kiểm tra config
```bash
npm run zalo:validate
```

Phải thấy: **✅ All critical checks passed!**

#### Bước 2: Push code
```bash
git add .
git commit -m "fix: zalo mini app issues"
git push origin main
```

Chờ 2-3 phút để backend deploy.

#### Bước 3: Deploy Zalo
```bash
cd apps/zalo
npm run zmp:deploy
```

## 📱 TEST TRÊN ĐIỆN THOẠI

1. **Xóa cache**: Xóa app khỏi danh sách "Gần đây"
2. **Quét QR**: Quét mã QR từ terminal
3. **Test**:
   - ✅ Xem danh sách salon
   - ✅ Đăng nhập với Zalo
   - ✅ Đặt lịch
   - ✅ Xem lịch hẹn

## ⚠️ NẾU VẪN GẶP LỖI

### Lỗi -1401?
→ Vào https://developers.zalo.me/ và thêm tài khoản test vào "Người dùng thử nghiệm"

### Network Error?
→ Kiểm tra backend đã deploy chưa:
```powershell
Invoke-WebRequest -Uri "https://barber-api.paduy.tech/api/salons?page=1&limit=10" -Method GET
```

### Deploy script lỗi?
```bash
cd apps/zalo
npm install zmp-cli@latest --save-dev
```

## 📚 TÀI LIỆU CHI TIẾT

- `README_ZALO_FIX.md` - Tổng hợp tất cả fixes (Tiếng Việt)
- `ZALO_DEPLOYMENT_GUIDE.md` - Hướng dẫn chi tiết (English)
- `CHANGES_SUMMARY.md` - Danh sách file đã sửa

## 🛠️ SCRIPTS HỮU ÍCH

```bash
# Kiểm tra config
npm run zalo:validate

# Deploy tự động
npm run zalo:deploy

# Deploy thủ công
cd apps/zalo
npm run zmp:deploy          # Testing
npm run zmp:deploy:dev      # Development

# Dev mode
npm run dev:zalo
```

## ✨ DONE!

Bây giờ bạn có thể deploy và test app trên điện thoại!

Nếu có vấn đề, đọc `README_ZALO_FIX.md` để biết thêm chi tiết.
