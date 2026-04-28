import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Intent extraction prompt — LLM chỉ parse entity, KHÔNG quyết định flow.
 */
export function intentExtractionPrompt(
  currentStep: string,
  stateDesc: string,
  today: string,
  tomorrow: string,
): string {
  return `Phân tích tin nhắn đặt lịch salon tóc. Trả về JSON duy nhất, KHÔNG giải thích.

BƯỚC: ${currentStep}
STATE: ${stateDesc}
Hôm nay: ${today} | Ngày mai: ${tomorrow}

PARSE RULES:
- "ngày mai"/"mai" → date:"${tomorrow}"
- "hôm nay" → date:"${today}"
- "2h chiều"/"14h" → time:"14:00"
- "9 rưỡi"/"9h30" → time:"09:30"
- "8h30" → time:"08:30"
- "9h sáng"/"9 giờ sáng" → time:"09:00"
- Số "1","2","3" → lựa chọn STT (salon/service/barber tùy bước)
- "ai cũng được"/"thợ nào cũng được"/"chọn giúp" → barber:"any"
- "được"/"ok"/"đúng rồi"/"xác nhận" → confirmed:true
- "không"/"sai" (đơn lẻ, không kèm lựa chọn mới) → confirmed:false
- SĐT: 10 số bắt đầu 0

🔴 CHANGE RULE (BẮT BUỘC):
- "đổi thành quận 1" → intent:"change", salon:"quận 1"
- "chuyển qua quận 3" → intent:"change", salon:"quận 3"
- "đổi sang cơ sở Nguyễn Văn Linh" → intent:"change", salon:"Nguyễn Văn Linh"
- "đặt ở quận 1" → intent:"change", salon:"quận 1"
- "đổi thợ khác" → intent:"change", barber:"any"
- "đổi ngày mai" → intent:"change", date tương ứng
- Khi intent="change" + có salon/service/barber → PHẢI đặt cả intent VÀ entity.
- Tên: bỏ "anh"/"chị" → lấy tên ("Anh Hoàng" → "Hoàng")
- cat toc=cắt tóc, nhuom=nhuộm, uon=uốn, hot toc=hớt tóc, goi=gội

🔴 SALON RULE (BẮT BUỘC):
- Trường "salon" phải là NGUYÊN VĂN text user nhập về địa điểm/chi nhánh.
- KHÔNG được tự suy đoán hoặc dịch sang tên salon khác.
- VD: "quận 1" → salon:"quận 1" (ĐÚNG), KHÔNG phải salon:"Nguyễn Văn Linh" (SAI)
- VD: "q1" → salon:"q1"
- VD: "cơ sở quận 1" → salon:"quận 1"  
- VD: "Nguyễn Văn Linh" → salon:"Nguyễn Văn Linh"
- Backend sẽ tự match — LLM KHÔNG được đoán.

JSON:
{"intent":"book|select|confirm|change|cancel|greet|ask_slots|other","salon":null,"service":null,"barber":null,"date":null,"time":null,"name":null,"phone":null,"confirmed":null}`;
}

/**
 * Builds a short response generation prompt (no tools, text only).
 */
export function responseGenerationPrompt(): string {
  return `Trợ lý đặt lịch Reetro Barber. Tiếng Việt. Xưng "em", gọi "anh/chị".
Ngắn gọn, thân thiện, dùng emoji.
KHÔNG bịa thông tin. KHÔNG hiện UUID. KHÔNG nói về hệ thống nội bộ.
Chỉ trả lời về dịch vụ cắt tóc và đặt lịch.`;
}
