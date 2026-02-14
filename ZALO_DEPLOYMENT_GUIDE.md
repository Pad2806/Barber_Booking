# Zalo Mini App Deployment Guide

## Các lỗi đã fix

### 1. Lỗi -1401 "Zalo app has not been activated"
**Nguyên nhân**: 
- App ID chưa được cấu hình đầy đủ trong các file config
- Zalo SDK không thể lấy access token khi app ở chế độ Testing

**Giải pháp đã áp dụng**:
- ✅ Thêm `appId: "2917748007370695388"` vào tất cả config files:
  - `app.json`
  - `app-config.json`
  - `zmp.json`
  - `zmp.config.cjs`
- ✅ Cập nhật `auth.service.ts` để xử lý trường hợp không có access token
- ✅ Cập nhật `zalo.strategy.ts` (backend) để cho phép login chỉ với zaloId

### 2. Lỗi Network Error
**Nguyên nhân**:
- CORS chặn request từ Zalo Mini App
- API URL không đúng (localhost thay vì production URL)

**Giải pháp đã áp dụng**:
- ✅ Cập nhật CORS trong `apps/api/src/main.ts` để cho phép các domain Zalo
- ✅ Hardcode API URL thành `https://barber-api.paduy.tech/api` trong `constants.ts`
- ✅ Đổi `base: '/'` thành `base: './'` trong `vite.config.mjs`

### 3. Lỗi Routing (màn hình trắng)
**Nguyên nhân**: 
- BrowserRouter không hoạt động trong Zalo Mini App environment

**Giải pháp đã áp dụng**:
- ✅ Đổi từ `BrowserRouter` sang `HashRouter` trong `app.tsx`

### 4. Lỗi Deploy Script
**Nguyên nhân**: 
- `npx zmp` không tìm thấy executable trên Windows

**Giải pháp đã áp dụng**:
- ✅ Đổi `npx zmp deploy` thành `npx zmp-cli deploy` trong `deploy.cjs`

## Các bước deploy

### Bước 1: Commit và Push code
```bash
git add .
git commit -m "fix: zalo mini app authentication and network errors"
git push origin main
```

**Chờ 2-3 phút** để GitHub Actions build và deploy backend lên Dokploy.

### Bước 2: Deploy Zalo Mini App
```bash
cd apps/zalo
npm run zmp:deploy
```

Hoặc deploy vào Development:
```bash
npm run zmp:deploy:dev
```

### Bước 3: Test trên điện thoại
1. **Xóa cache**: Xóa Mini App khỏi danh sách "Gần đây" trên Zalo
2. **Quét QR mới**: Quét mã QR từ terminal sau khi deploy
3. **Test các chức năng**:
   - Xem danh sách salon (không cần đăng nhập)
   - Đăng nhập với Zalo
   - Đặt lịch (cần đăng nhập)
   - Xem lịch hẹn

## Lưu ý quan trọng

### Về lỗi -1401
Nếu vẫn gặp lỗi này sau khi deploy, có thể do:

1. **App chưa được kích hoạt trên Zalo Developer Console**:
   - Vào https://developers.zalo.me/
   - Chọn app "ReetroBarberShop" (ID: 2917748007370695388)
   - Kiểm tra tab "Phiên bản" → Đảm bảo phiên bản Testing đã được submit
   - Thêm tài khoản test vào danh sách "Người dùng thử nghiệm"

2. **Tài khoản Zalo chưa được thêm vào danh sách test**:
   - Vào "Cài đặt" → "Người dùng thử nghiệm"
   - Thêm số điện thoại/Zalo ID của người test

### Về Network Error
Nếu vẫn gặp lỗi này:

1. **Kiểm tra backend đã deploy chưa**:
   ```bash
   curl https://barber-api.paduy.tech/api/salons?page=1&limit=10
   ```
   Phải trả về status 200 và có data

2. **Kiểm tra CORS logs** trên Dokploy:
   - Vào Dokploy → API service → Logs
   - Tìm dòng "Blocked Origin" nếu có

3. **Test API từ Zalo Mini App Simulator**:
   - Mở DevTools trong simulator
   - Kiểm tra Network tab xem request có đi đến backend không

## Troubleshooting

### Lỗi "Cannot determine executable to run"
```bash
# Fix: Cài lại zmp-cli
cd apps/zalo
npm install zmp-cli@latest --save-dev
```

### Lỗi "pages: []" trong app-config.json
Đã được fix bởi `injectPages()` plugin trong `vite.config.mjs`. Nếu vẫn gặp:
```bash
# Xóa thư mục www và build lại
rm -rf www
npm run build
```

### App không load sau khi deploy
1. Xóa cache Zalo Mini App trên điện thoại
2. Force refresh: Vuốt xuống ở trang chủ
3. Kiểm tra version number đã tăng chưa (trong terminal sau khi deploy)

## Kiểm tra sau khi deploy

- [ ] Backend API trả về 200 khi gọi `/api/salons`
- [ ] Zalo Mini App hiển thị danh sách salon (không cần login)
- [ ] Có thể đăng nhập với Zalo (có thể thấy user info)
- [ ] Có thể đặt lịch (sau khi login)
- [ ] Có thể xem lịch hẹn của mình

## Liên hệ hỗ trợ

Nếu vẫn gặp vấn đề, cung cấp thông tin sau:
1. Screenshot console errors
2. Zalo Mini App version number
3. Backend deployment status (từ Dokploy)
4. Tài khoản test đã được thêm vào danh sách chưa
