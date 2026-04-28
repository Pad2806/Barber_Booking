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
- Số "1","2","3" → lựa chọn STT (salon/service/barber tùy bước)
- "ai cũng được"/"thợ nào cũng được"/"chọn giúp" → barber:"any"
- "được"/"ok"/"đúng rồi"/"xác nhận" → confirmed:true
- "không"/"sai"/"đổi"/"thay" → confirmed:false
- SĐT: 10 số bắt đầu 0
- Tên: bỏ "anh"/"chị" → lấy tên ("Anh Hoàng" → "Hoàng")
- cat toc=cắt tóc, nhuom=nhuộm, uon=uốn, hot toc=hớt tóc, goi=gội

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
