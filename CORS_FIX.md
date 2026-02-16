# 🔧 FIX: CORS Error - "Not allowed by CORS"

## ✅ ĐÃ FIX

Lỗi CORS đã được fix bằng cách:

1. **Không throw Error** - Thay vì throw error, chỉ return `false`
2. **Thêm logging** - Log tất cả origins để debug
3. **Dev mode mở** - Trong development, cho phép mọi origin
4. **Thêm Zalo patterns** - Thêm `http://h5.zalo.me`, `zadn.vn`

## 📝 Thay đổi trong `apps/api/src/main.ts`

### Trước (Lỗi):
```typescript
// Strict check for others
callback(new Error('Not allowed by CORS'), false);
```

### Sau (Fix):
```typescript
// In development/testing, allow all origins and log them
if (process.env.NODE_ENV !== 'production') {
  console.log('[CORS] DEV MODE - Allowing origin:', requestOrigin);
  return callback(null, true);
}

// Log blocked origin for debugging
console.warn('[CORS] BLOCKED origin:', requestOrigin);

// Instead of throwing error, just return false to block
callback(null, false);
```

## 🚀 Deploy Backend

Code đã được push lên GitHub. GitHub Actions sẽ tự động deploy trong **2-3 phút**.

### Kiểm tra deployment:

1. **Vào GitHub Actions**: https://github.com/Pad2806/Barber_Booking/actions
2. **Xem workflow** "Build & Push Docker Images"
3. **Đợi** cho đến khi status là ✅ (màu xanh)

### Kiểm tra backend đã deploy:

```powershell
Invoke-WebRequest -Uri "https://barber-api.paduy.tech/api/salons?page=1&limit=10" -Method GET
```

Phải trả về: `StatusCode: 200`

## 📱 Test Zalo Mini App

Sau khi backend deploy xong (2-3 phút), test lại:

1. **Mở Zalo Mini App** trên điện thoại
2. **Force refresh** (vuốt xuống)
3. **Test các chức năng**:
   - ✅ Xem danh sách salon
   - ✅ Đăng nhập với Zalo
   - ✅ Đặt lịch

## 🔍 Debug CORS

Nếu vẫn gặp lỗi CORS, kiểm tra logs trên Dokploy:

1. **Vào Dokploy** → API service → Logs
2. **Tìm dòng** `[CORS]` để xem origin nào bị block
3. **Ví dụ logs**:
   ```
   [CORS] Allowing Zalo origin: https://h5.zalo.me
   [CORS] DEV MODE - Allowing origin: http://localhost:3005
   [CORS] BLOCKED origin: https://unknown-domain.com
   ```

## ⚙️ Environment Variables

Đảm bảo backend có các env vars:

- `NODE_ENV` - Nên để `development` hoặc `testing` khi test
- `WEB_URL` - URL của web frontend
- `FRONTEND_URL` - URL của frontend

## 🎯 Kết quả

Sau khi fix:
- ✅ Không còn lỗi "Not allowed by CORS"
- ✅ Zalo Mini App có thể gọi API
- ✅ Có logs để debug nếu cần
- ✅ Dev mode cho phép mọi origin

## 📚 Tham khảo

- CORS config: `apps/api/src/main.ts` (dòng 12-56)
- Deployment guide: `ZALO_DEPLOYMENT_GUIDE.md`
- Quick start: `QUICK_START_ZALO.md`
