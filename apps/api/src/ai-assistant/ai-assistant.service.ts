import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';
import { PrismaService } from '../database/prisma.service';
import { AIToolsService } from './ai-tools.service';
import { systemPrompt } from './prompts/system.prompt';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

// ═══ Groq Tool Definitions ═══
const GROQ_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_salons',
      description: 'Lấy danh sách tất cả cơ sở / chi nhánh Reetro Barber đang hoạt động, kèm tên và địa chỉ. Gọi TRƯỚC KHI hỏi chọn thợ.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_services',
      description: 'Lấy danh sách các dịch vụ của salon.',
      parameters: {
        type: 'object',
        properties: {
          salon_id: { type: 'string', description: 'UUID của cơ sở (tuỳ chọn). Nếu có sẽ lọc theo cơ sở đó.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_barbers',
      description: 'Lấy danh sách thợ cắt tóc (BARBER/STYLIST) của một cơ sở cụ thể. Phải gọi get_salons và khách chọn cơ sở TRƯỚC khi gọi tool này.',
      parameters: {
        type: 'object',
        properties: {
          salon_id: { type: 'string', description: 'UUID của cơ sở mà khách đã chọn. BẮT BUỘC để lọc đúng thợ.' },
        },
        required: ['salon_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_slots',
      description: 'Kiểm tra khung giờ còn trống của thợ vào một ngày.',
      parameters: {
        type: 'object',
        properties: {
          barber_id: { type: 'string', description: 'MÃ UUID dài của thợ. TUYỆT ĐỐI KHÔNG TRUYỀN TÊN.' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['barber_id', 'date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_booking',
      description: 'Tạo lịch hẹn mới.',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: 'string' },
          phone: { type: 'string' },
          service_id: { type: 'string', description: 'MÃ UUID dài của dịch vụ. KHÔNG TRUYỀN TÊN.' },
          barber_id: { type: 'string', description: 'MÃ UUID dài của thợ. KHÔNG TRUYỀN TÊN.' },
          date: { type: 'string' },
          time: { type: 'string' },
        },
        required: ['customer_name', 'phone', 'service_id', 'barber_id', 'date', 'time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_booking_state',
      description: 'Lưu hoặc cập nhật thông tin khách hàng cung cấp (Tên, SĐT, Cơ sở, Dịch vụ, Thợ, Ngày, Giờ) để duy trì ngữ cảnh.',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: ['string', 'null'] },
          phone: { type: ['string', 'null'] },
          salon_id: { type: ['string', 'null'], description: 'MÃ UUID của cơ sở khách đã chọn' },
          service_id: { type: ['string', 'null'], description: 'MÃ UUID/Tên của dịch vụ' },
          barber_id: { type: ['string', 'null'], description: 'MÃ UUID của thợ' },
          date: { type: ['string', 'null'], description: 'YYYY-MM-DD' },
          time: { type: ['string', 'null'], description: 'HH:mm' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cancel_booking',
      description: 'Hủy lịch hẹn đã có.',
      parameters: {
        type: 'object',
        properties: {
          booking_id: { type: 'string' },
        },
        required: ['booking_id'],
      },
    },
  },
];

// Valid tool names for sanitization
const VALID_TOOL_NAMES = new Set(GROQ_TOOLS.map(t => t.function.name));

// ═══ Groq model fallback chain ═══
// NOTE: llama3-groq-8b-8192-tool-use-preview was DECOMMISSIONED by Groq (April 2026)
// PRIMARY:   llama-3.3-70b-versatile  — most capable, stable tool-calling (confirmed 2026)
// FALLBACK1: llama-3.1-8b-instant     — faster, backup for quota exhaustion
// FALLBACK2: mixtral-8x7b-32768       — alternative with tool support
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
];

// ═══ Vietnamese day of week map ═══
const VIET_DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// ═══ Booking-intent keywords — if message contains ANY of these, skip FAQ ═══
const BOOKING_INTENT_RE = /(\d{10}|\d{4}[\s-]?\d{3}[\s-]?\d{3}|\d+h|sáng|chiều|trưa|tối|hôm nay|ngày mai|cắt tóc|nhuộm|uốn|gội|combo|cat toc|nhuom|uon|goi|hot toc|hớt|cơ sở|chi nhánh|quận|cs[0-9]|số [0-9])/i;

// ═══ Out-of-domain detection ═══
// Topics clearly outside barber/booking domain — checked BEFORE any Groq call
const OUT_OF_DOMAIN_TOPICS = [
  // Thời tiết
  'thời tiết', 'nhiệt độ', 'dự báo thời tiết', 'trời mưa', 'trời nắng', 'bão lũ',
  // Ăn uống
  'nấu ăn', 'công thức nấu', 'món ăn', 'nhà hàng', 'quán ăn', 'đặt đồ ăn', 'goi mon',
  // Giải trí
  'bóng đá', 'xem phim', 'âm nhạc', 'youtube', 'tiktok', 'chơi game', 'truyện tranh',
  // Du lịch / giao thông
  'du lịch', 'vé máy bay', 'vé tàu', 'vé xe', 'khách sạn', 'đặt phòng khách sạn',
  // Tài chính
  'cổ phiếu', 'crypto', 'bitcoin', 'ngân hàng', 'vay tiền', 'lãi suất', 'chứng khoán',
  // Tin tức / chính trị
  'tin tức', 'chính trị', 'bầu cử', 'chiến tranh', 'quân sự',
  // Y tế
  'bệnh viện', 'bác sĩ', 'uống thuốc', 'covid', 'vaccine', 'chữa bệnh', 'triệu chứng',
  // Học thuật
  'bài tập toán', 'giải phương trình', 'lịch sử thế giới', 'địa lý', 'vật lý', 'hóa học',
  // AI / tech khác
  'chatgpt', 'gemini', 'claude ai', 'lập trình python', 'viết code',
  // Mua sắm khác
  'mua điện thoại', 'mua laptop', 'mua quần áo', 'shopping', 'lazada', 'shopee',
];

// Build regex from topic list (escaped)
const OUT_OF_DOMAIN_RE = new RegExp(
  OUT_OF_DOMAIN_TOPICS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
  'i',
);

// Barber-domain whitelist — if message matches these, ALWAYS treat as in-domain
const BARBER_DOMAIN_RE = /tóc|cắt|hớt|gội|nhuộm|uốn|duỗi|barber|thợ|salon|cơ sở|chi nhánh|dịch vụ|đặt lịch|lịch hẹn|booking|combo|stylist|reetro|hớt tóc|cat toc|hot toc/i;

// Out-of-domain response (Option C: từ chối + redirect)
const OUT_OF_DOMAIN_RESPONSE =
  'Xin lỗi anh, em chỉ hỗ trợ các vấn đề liên quan đến **dịch vụ hớt tóc và đặt lịch** tại **Reetro Barber** thôi ạ! 💈\n\n' +
  'Anh có muốn em hỗ trợ:\n• ✂️ Đặt lịch cắt tóc\n• 💰 Xem giá dịch vụ\n• 📍 Xem địa chỉ các salon\n\n' +
  'Em sẵn sàng giúp ngay! 😊';

// ═══ FAQ Router ═══
const FAQ_PATTERNS: { keywords: string[]; response: string | (() => string) }[] = [
  {
    keywords: ['hôm nay là thứ', 'thứ mấy', 'ngày mấy', 'hôm nay là ngày', 'ngày bao nhiêu', 'today'],
    response: () => {
      const now = dayjs().tz('Asia/Ho_Chi_Minh');
      return `📅 Hôm nay là **${VIET_DAYS[now.day()]}, ngày ${now.format('DD/MM/YYYY')}**.\n\nBây giờ là **${now.format('HH:mm')}**.\n\nAnh muốn đặt lịch hôm nay không ạ? Em hỗ trợ ngay! ✂️`;
    },
  },
  {
    keywords: ['mấy giờ rồi', 'bây giờ là', 'giờ bao nhiêu', 'what time'],
    response: () => {
      const now = dayjs().tz('Asia/Ho_Chi_Minh');
      return `🕐 Bây giờ là **${now.format('HH:mm')}** (${VIET_DAYS[now.day()]}, ${now.format('DD/MM/YYYY')}).\n\nAnh cần đặt lịch không ạ? 😊`;
    },
  },
  {
    keywords: ['giờ mở cửa', 'mấy giờ mở', 'mấy giờ đóng', 'mở cửa lúc', 'đóng cửa', 'giờ làm việc', 'giờ hoạt động'],
    response: '🕐 **Giờ hoạt động của Reetro Barber:**\n\n• Thứ 2 - Thứ 7: 8:00 - 20:00\n• Chủ nhật: 9:00 - 18:00\n\nAnh muốn đặt lịch không ạ? Em hỗ trợ ngay! ✂️',
  },
  {
    keywords: ['ở đâu', 'địa chỉ', 'chỗ nào', 'đường nào', 'chi nhánh'],
    response: '📍 **Địa chỉ Reetro Barber:**\n\nAnh có thể xem danh sách các chi nhánh trên trang **Hệ thống Salon** nhé!\n\nAnh cần đặt lịch tại chi nhánh nào ạ? 😊',
  },
  {
    keywords: ['giá', 'bao nhiêu', 'phí', 'cost', 'price', 'bảng giá'],
    response: '💰 **Bảng giá dịch vụ Reetro Barber:**\n\nEm có thể tra cứu giá chính xác cho anh! Anh muốn hỏi về dịch vụ nào ạ?\n\n• Cắt tóc\n• Gội đầu\n• Nhuộm tóc\n• Combo\n\nHoặc anh gõ "xem dịch vụ" để em liệt kê tất cả nhé! ✂️',
  },
  {
    keywords: ['hủy lịch', 'hủy đặt', 'cancel', 'bỏ lịch'],
    response: '❌ **Hủy lịch hẹn:**\n\nAnh có thể hủy lịch hẹn tại mục **"Lịch hẹn của tôi"** trên trang web.\n\n⚠️ Lưu ý: Vui lòng hủy trước **2 giờ** so với giờ hẹn để nhường chỗ cho khách khác nhé!\n\nAnh cần em hỗ trợ gì thêm không ạ? 😊',
  },
  {
    keywords: ['cảm ơn', 'thank', 'thanks', 'ok ạ', 'ok em', 'cám ơn'],
    response: 'Dạ không có gì ạ! 😊 Reetro Barber luôn sẵn sàng phục vụ anh.\n\nNếu cần gì thêm, cứ nhắn em nhé! ✂️💈',
  },
  {
    keywords: ['xin chào', 'hello', 'hi', 'hey', 'chào'],
    response: 'Chào anh! 👋 Em là trợ lý ảo của **Reetro Barber**.\n\nEm có thể giúp anh:\n• 📋 Xem dịch vụ & giá\n• 👨‍🦱 Chọn thợ yêu thích\n• 📅 Đặt lịch nhanh\n• ❓ Giải đáp thắc mắc\n\nAnh cần gì ạ? 😊',
  },
  {
    keywords: ['có dịch vụ gì', 'dịch vụ nào', 'xem dịch vụ', 'menu', 'danh sách dịch vụ'],
    response: '✂️ **Dịch vụ tại Reetro Barber:**\n\nAnh có thể xem đầy đủ bảng dịch vụ và giá trên trang **Hệ thống Salon** → chọn chi nhánh → tab **Dịch vụ** nhé!\n\nHoặc anh cho em biết muốn cắt kiểu gì, em tra cứu giá luôn ạ! 💈',
  },
  {
    keywords: ['đặt lịch', 'book', 'booking', 'đặt hẹn', 'lịch hẹn'],
    response: '📅 **Đặt lịch tại Reetro Barber:**\n\nAnh có thể đặt lịch bằng 2 cách:\n\n1️⃣ **Trên trang web:** Nhấn **"Đặt lịch ngay"** → Chọn salon → Chọn dịch vụ → Chọn thợ → Chọn ngày giờ\n\n2️⃣ **Qua em:** Cho em biết:\n• Tên anh\n• Số điện thoại\n• Dịch vụ muốn làm\n• Ngày & giờ\n\nEm sẽ đặt cho anh ngay! 😊',
  },
];

// ═══ Response Cache ═══
interface CachedResponse {
  response: string;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class AIAssistantService implements OnModuleInit {
  private groq: Groq;
  private readonly logger = new Logger(AIAssistantService.name);
  private responseCache = new Map<string, CachedResponse>();
  // Rate limit tracker: model → timestamp until which it is blocked
  private rateLimitedUntil = new Map<string, number>();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private toolsService: AIToolsService,
  ) {
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (groqKey) {
      this.groq = new Groq({ apiKey: groqKey });
      this.logger.log('✅ Groq client initialized');
    } else {
      this.logger.error('❌ GROQ_API_KEY is missing! AI Assistant will not work.');
    }
  }

  async onModuleInit() {
    if (!this.groq) {
      this.logger.error('❌ Groq not initialized. AI chat disabled.');
    }
    setInterval(() => this.cleanCache(), 10 * 60 * 1000);
  }

  // ═══ Out-of-domain guard ═══
  private isOutOfDomain(message: string): boolean {
    // Always in-domain if message contains barber/tóc keywords
    if (BARBER_DOMAIN_RE.test(message)) return false;
    // Always in-domain if booking-intent
    if (BOOKING_INTENT_RE.test(message)) return false;
    // Out-of-domain if matches off-topic patterns
    return OUT_OF_DOMAIN_RE.test(message);
  }

  // ═══ FAQ Router ═══
  private matchFAQ(message: string): string | null {
    // If message contains booking-actionable info (phone, time, service), skip FAQ entirely
    if (BOOKING_INTENT_RE.test(message)) {
      return null;
    }

    const normalizedBytes = ' ' + message.toLowerCase().trim().replace(/[.,!?;()]/g, '') + ' ';
    for (const faq of FAQ_PATTERNS) {
      if (faq.keywords.some(kw => normalizedBytes.includes(' ' + kw + ' '))) {
        return typeof faq.response === 'function' ? faq.response() : faq.response;
      }
    }
    return null;
  }

  // ═══ Cache ═══
  private getCacheKey(message: string): string {
    return message.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private getCachedResponse(message: string): string | null {
    const key = this.getCacheKey(message);
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      this.logger.log(`[Cache HIT] "${message.substring(0, 50)}"`);
      return cached.response;
    }
    if (cached) this.responseCache.delete(key);
    return null;
  }

  private setCachedResponse(message: string, response: string) {
    const key = this.getCacheKey(message);
    this.responseCache.set(key, { response, timestamp: Date.now() });
  }

  private cleanCache() {
    const now = Date.now();
    for (const [key, val] of this.responseCache) {
      if (now - val.timestamp > CACHE_TTL_MS) {
        this.responseCache.delete(key);
      }
    }
  }

  // ═══ Sanitize tool name (strip trailing slashes and whitespace from Llama hallucinations) ═══
  private sanitizeToolName(name: string): string {
    const cleaned = name.replace(/[\s\/]+$/g, '').trim();
    if (VALID_TOOL_NAMES.has(cleaned)) return cleaned;
    // Fuzzy match: try stripping common suffixes
    for (const valid of VALID_TOOL_NAMES) {
      if (cleaned.startsWith(valid)) return valid;
    }
    return cleaned;
  }

  // ═══ Main Chat Method ═══
  async chat(message: string, sessionId: string, userId?: string) {
    const startTime = Date.now();

    // ── Step 0: Out-of-domain guard (0 API calls) ──
    if (this.isOutOfDomain(message)) {
      this.logger.log(`[OOD Guard] "${message.substring(0, 60)}"`);
      await this.storeConversation(sessionId, userId, message, OUT_OF_DOMAIN_RESPONSE, startTime, false);
      return { response: OUT_OF_DOMAIN_RESPONSE, source: 'ood_guard' };
    }

    // ── Step 1: FAQ (0 API calls) — skipped if message has booking-actionable data ──
    const faqResponse = this.matchFAQ(message);
    if (faqResponse) {
      this.logger.log(`[FAQ HIT] "${message.substring(0, 50)}"`);
      await this.storeConversation(sessionId, userId, message, faqResponse, startTime, false);
      return { response: faqResponse, source: 'faq' };
    }

    // ── Step 2: Cache (0 API calls) ──
    const isBookingIntent = BOOKING_INTENT_RE.test(message)
      || /(đặt lịch|\bbook\b|dịch vụ|thợ|barber|xác nhận|\bok\b|\byes\b|được|đúng|rồi)/i.test(message);
    if (!isBookingIntent) {
      const cachedResponse = this.getCachedResponse(message);
      if (cachedResponse) {
        await this.storeConversation(sessionId, userId, message, cachedResponse, startTime, false);
        return { response: cachedResponse, source: 'cache' };
      }
    }

    // ── Step 3: Groq AI ──
    if (!this.groq) {
      return { response: 'Xin lỗi, hệ thống AI đang bảo trì. Anh vui lòng thử lại sau! 🙏', error: true };
    }

    try {
      this.logger.log(`[Chat] session=${sessionId} msg="${message.substring(0, 60)}"`);
      const result = await this.chatWithGroq(message, sessionId, userId, startTime);
      return { ...result, source: 'groq' };
    } catch (error: any) {
      const errMsg = error?.message || 'Unknown';
      this.logger.error(`[Chat FAIL] session=${sessionId} error=${errMsg}`);

      let errorMessage: string;
      if (errMsg === 'TIMEOUT') {
        errorMessage = '⏱️ Hệ thống hơi chậm, anh thử gửi lại tin nhắn vừa rồi được không ạ?';
      } else if (errMsg.includes('429') || errMsg.includes('rate_limit') || errMsg.includes('quota')) {
        errorMessage = '⏳ Em đang xử lý nhiều yêu cầu quá, anh vui lòng thử lại sau 1-2 phút nhé! 😊';
      } else {
        errorMessage = 'Xin lỗi, em gặp sự cố. Anh thử lại sau nhé! 🙏';
      }

      return { response: errorMessage, error: true };
    }
  }

  // ═══ Validate tool args — reject garbage from dumb models ═══
  private isGarbageArgs(functionName: string, args: Record<string, any>): boolean {
    // P0 FIX: Guard for tools with no params (get_salons) or null args from model
    if (!args || typeof args !== 'object' || Array.isArray(args)) return false;

    const values = Object.values(args);
    // All values are "Unknown" or empty → garbage
    if (values.length > 0 && values.every(v => v === 'Unknown' || v === 'unknown' || v === '' || v === null)) {
      return true;
    }
    // create_booking with any "Unknown" field → block
    if (functionName === 'create_booking') {
      const required = ['customer_name', 'phone', 'service_id', 'barber_id', 'date', 'time'];
      for (const field of required) {
        const val = args[field];
        if (!val || val === 'Unknown' || val === 'unknown') {
          return true;
        }
      }
    }
    return false;
  }

  // ═══ Groq Implementation ═══
  private async chatWithGroq(message: string, sessionId: string, userId: string | undefined, startTime: number) {
    // ══ Guardrail constants ══
    const MAX_TOOL_LOOPS = 4;         // Max tool call iterations per response
    const MAX_TOOLS_PER_RESPONSE = 3; // Max parallel tools per model response
    const API_TIMEOUT_MS = 15_000;    // 15s per API call — balanced for all 3 models
    const LOOP_DEADLINE_MS = 40_000;  // 40s total — covers full booking flow (4+ tool calls)

    let conversation = await this.prisma.chatConversation.findUnique({
      where: { sessionId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 6 } }, // P2: reduced from 10 to 6
    });
    if (conversation && conversation.messages) {
      conversation.messages.reverse();
    }

    if (!conversation) {
      conversation = await this.prisma.chatConversation.create({
        data: { sessionId, userId },
        include: { messages: true },
      });
    }

    let bookingRequest = await (this.prisma.bookingRequest as any).findUnique({
      where: { sessionId },
    });

    if (!bookingRequest || bookingRequest.status === 'COMPLETED') {
      bookingRequest = await (this.prisma.bookingRequest as any).upsert({
        where: { sessionId },
        create: { sessionId },
        update: {
          // P4: Also reset salonId when starting a new booking session
          status: 'PENDING', customerName: null, phone: null,
          salonId: null, serviceId: null, barberId: null, date: null, time: null,
        },
      });
    }

    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    // P2: No longer pass salonKnowledge JSON — AI uses get_salons tool instead (saves ~600 tokens)
    const sysInstruction = systemPrompt(now.format('dddd, DD/MM/YYYY HH:mm'), bookingRequest);

    const messages: any[] = [
      { role: 'system', content: sysInstruction },
      ...conversation.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ];

    await this.prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: message },
    });

    let bookingCreated = false;
    let toolCallsLog: any[] = [];
    let finalResponse = '';
    let lastError: any;
    let isSuccess = false;

    for (const modelName of GROQ_MODELS) {
      // P3: Skip models that are currently rate-limited
      const blockedUntil = this.rateLimitedUntil.get(modelName) ?? 0;
      if (blockedUntil > Date.now()) {
        this.logger.warn(`[Groq] Skipping ${modelName} — rate-limited for ${Math.ceil((blockedUntil - Date.now()) / 1000)}s more`);
        continue;
      }

      try {
        this.logger.log(`[Groq] Trying model: ${modelName}`);
        let localMessages = [...messages];
        bookingCreated = false;
        toolCallsLog = [];
        const loopDeadline = Date.now() + LOOP_DEADLINE_MS;
        let toolLoopCount = 0;

        // ══ Option A: Composition context — stores structured list data from DB tools ══
        const compositionCtx: {
          salons: Array<{ name: string; addr: string }> | null;
          barbers: Array<{ name: string; rating: string }> | null;
          lastListTool: 'salons' | 'barbers' | null;
        } = { salons: null, barbers: null, lastListTool: null };

        while (true) {
          if (Date.now() > loopDeadline) {
            throw new Error('TIMEOUT');
          }

          // ── GUARDRAIL 1: Max tool call loop iterations ──
          if (toolLoopCount >= MAX_TOOL_LOOPS) {
            this.logger.warn(`[Groq] Hit MAX_TOOL_LOOPS (${MAX_TOOL_LOOPS}) — forcing text response`);
            // Force the model to respond with text only by removing tools
            const noToolCompletion = await Promise.race([
              this.groq.chat.completions.create({
                model: modelName,
                messages: localMessages,
                max_tokens: 380,
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), API_TIMEOUT_MS),
              ),
            ]) as any;
            finalResponse = noToolCompletion.choices[0].message.content || '';
            finalResponse = this.sanitizeResponse(finalResponse);
            finalResponse = this.composeAndGuard(finalResponse, compositionCtx);
            isSuccess = true;
            break;
          }

          let completion: any;
          try {
            completion = await Promise.race([
              this.groq.chat.completions.create({
                model: modelName,
                messages: localMessages,
                tools: GROQ_TOOLS as any,
                tool_choice: 'auto',
                max_tokens: 380, // P2: reduced from 1024 — sufficient for booking flow
              }),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), API_TIMEOUT_MS),
              ),
            ]);
          } catch (apiError: any) {
            const status = apiError?.status || apiError?.error?.code;
            if (status === 429 || apiError?.message?.includes('429')) {
              // P3: Block this model for 90 seconds instead of just waiting 2s
              this.rateLimitedUntil.set(modelName, Date.now() + 90_000);
              this.logger.warn(`[Groq 429] model=${modelName} — blocked for 90s, trying next model`);
            }
            throw apiError;
          }

          const responseMessage = completion.choices[0].message;
          // P5: Log token usage for monitoring
          if (completion.usage) {
            this.logger.log(`[Token] model=${modelName} prompt=${completion.usage.prompt_tokens} completion=${completion.usage.completion_tokens} total=${completion.usage.total_tokens}`);
          }
          localMessages.push(responseMessage);

          let extractedToolCalls: any[] = [];

          // ── Structured tool_calls from Groq API ──
          if (responseMessage.tool_calls) {
            for (const toolCall of responseMessage.tool_calls) {
              extractedToolCalls.push({
                id: toolCall.id,
                name: this.sanitizeToolName(toolCall.function.name),
                args: toolCall.function.arguments || '{}',
              });
            }
          }

          // ── Extract tool calls from text content (Llama hallucination formats) ──
          if (responseMessage.content && extractedToolCalls.length === 0) {
            const contentText = responseMessage.content;
            const textToolCalls: any[] = [];

            const reA = /<function[:\s](\w+)\s+"((?:[^"\\]|\\.)*)"\s*<\/function>/gi;
            const reB = /<function[:\s](\w+)>([\s\S]*?)<\/function(?::\w+)?>/gi;
            const reC = /<function\s+name="(\w+)">([\s\S]*?)<\/function>/gi;

            let match;
            for (const re of [reA, reB, reC]) {
              while ((match = re.exec(contentText)) !== null) {
                const name = this.sanitizeToolName(match[1]);
                let args = match[2].trim();
                if (args.startsWith('"') && args.endsWith('"')) {
                  args = args.slice(1, -1);
                }
                args = args.replace(/\\"/g, '"');
                textToolCalls.push({
                  name,
                  args: args || '{}',
                  id: `call_${Date.now()}_${Math.random()}`,
                });
              }
              if (textToolCalls.length > 0) break;
            }

            extractedToolCalls.push(...textToolCalls);
          }

          if (extractedToolCalls.length > 0) {
            toolLoopCount++;

            // ── GUARDRAIL 2: Cap tool calls per response ──
            if (extractedToolCalls.length > MAX_TOOLS_PER_RESPONSE) {
              this.logger.warn(`[Groq] Model returned ${extractedToolCalls.length} tool calls, capping at ${MAX_TOOLS_PER_RESPONSE}`);
              extractedToolCalls = extractedToolCalls.slice(0, MAX_TOOLS_PER_RESPONSE);
            }

            // ── GUARDRAIL 3: Dedup same tool name within one response ──
            const seenTools = new Set<string>();
            const dedupedToolCalls: any[] = [];
            for (const tc of extractedToolCalls) {
              const dedupeKey = tc.name; // dedup by tool name only (same tool called 5x = execute once)
              if (!seenTools.has(dedupeKey)) {
                seenTools.add(dedupeKey);
                dedupedToolCalls.push(tc);
              }
            }
            extractedToolCalls = dedupedToolCalls;

            let anyExecuted = false;
            for (const toolCall of extractedToolCalls) {
              const functionName = toolCall.name;

              if (!VALID_TOOL_NAMES.has(functionName)) {
                this.logger.warn(`[Groq] Skipping unknown tool: ${functionName}`);
                localMessages.push({
                  tool_call_id: toolCall.id, role: 'tool', name: functionName,
                  content: JSON.stringify({ error: 'Unknown tool' }),
                });
                continue;
              }

              let functionArgs: Record<string, any> = {};
              try {
                // P1 FIX: Robust args parsing — handle null, empty string, 'null' string
                const raw = (typeof toolCall.args === 'string' ? toolCall.args : '{}').trim();
                const parsed = raw && raw !== 'null' ? JSON.parse(raw) : {};
                functionArgs = (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
              } catch (e) {
                this.logger.warn(`Could not parse JSON args for ${functionName}: ${toolCall.args}`);
                functionArgs = {};
              }

              // ── GUARDRAIL 4: Validate args — reject garbage ──
              if (this.isGarbageArgs(functionName, functionArgs)) {
                this.logger.warn(`[Groq] Rejecting garbage args for ${functionName}: ${JSON.stringify(functionArgs)}`);
                localMessages.push({
                  tool_call_id: toolCall.id, role: 'tool', name: functionName,
                  content: JSON.stringify({ error: 'Dữ liệu không hợp lệ. Hãy hỏi khách hàng cung cấp thông tin thật trước khi gọi tool.' }),
                });
                continue;
              }

              const toolResult = await this.toolsService.handleToolCall(functionName, functionArgs, sessionId);
              if ((toolResult as any).isBooking) bookingCreated = true;
              anyExecuted = true;

              toolCallsLog.push({ name: functionName, args: functionArgs, output: toolResult.content });

              // ══ Option A: Populate compositionCtx from list tools ══
              if (functionName === 'get_salons') {
                compositionCtx.salons = this.parseSalonList(toolResult.content);
                compositionCtx.lastListTool = 'salons';
              } else if (functionName === 'get_barbers') {
                compositionCtx.barbers = this.parseBarberList(toolResult.content);
                compositionCtx.lastListTool = 'barbers';
              }

              localMessages.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: functionName,
                content: toolResult.content,
              });
            }

            if (!anyExecuted) {
              // All tool calls were garbage — force text response
              this.logger.warn(`[Groq] All tool calls rejected as garbage — forcing text`);
              toolLoopCount = MAX_TOOL_LOOPS; // trigger forced text on next iteration
            }

            continue;
          }

          finalResponse = responseMessage.content || '';
          finalResponse = this.sanitizeResponse(finalResponse);
          finalResponse = this.composeAndGuard(finalResponse, compositionCtx);
          isSuccess = true;
          break;
        }
      } catch (error: any) {
        const errStatus = error?.status || error?.response?.status;
        if (!lastError || errStatus === 429 || lastError?.status !== 429) {
          lastError = error;
        }
        this.logger.warn(`[Groq Error] model=${modelName} status=${errStatus} msg=${(error.message || '').substring(0, 150)}`);
      }

      if (isSuccess) break;
    }

    if (!isSuccess) {
      throw lastError;
    }

    this.setCachedResponse(message, finalResponse);
    await this.prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: 'assistant', content: finalResponse },
    });
    await this.prisma.aiLog.create({
      data: {
        sessionId, userMessage: message, aiResponse: finalResponse,
        toolCalls: toolCallsLog as any, bookingCreated, latency: Date.now() - startTime,
      },
    });

    return { response: finalResponse };
  }

  // ═══ Sanitize AI response — strip leaked function tags + CJK hallucinations ═══
  private sanitizeResponse(text: string): string {
    return text
      .replace(/<function[\s\S]*?<\/function[^>]*>/gi, '')
      .replace(/<function[:\s]\w+\s+"[^"]*"<\/function>/gi, '')
      .replace(/<\/?function[^>]*>/gi, '')
      // Strip "function=name..." format without opening ‘<’ (llama-3.1-8b hallucination)
      .replace(/^function=[\w]+[^\n]*/gim, '')
      // Strip CJK characters (Chinese/Japanese/Korean) — model hallucinations
      .replace(/[\u4E00-\u9FFF\u3400-\u4DBF\u3000-\u303F\uFF00-\uFFEF\u2E80-\u2EFF]/g, '')
      // Clean up extra whitespace left by stripped chars
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // ═══ Helper: Store conversation messages ═══
  private async storeConversation(
    sessionId: string, userId: string | undefined,
    userMsg: string, assistantMsg: string,
    startTime: number, booking: boolean,
  ) {
    let conversation = await this.prisma.chatConversation.findUnique({
      where: { sessionId },
    });
    if (!conversation) {
      conversation = await this.prisma.chatConversation.create({
        data: { sessionId, userId },
      });
    }
    await this.prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: userMsg },
    });
    await this.prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: 'assistant', content: assistantMsg },
    });
    await this.prisma.aiLog.create({
      data: {
        sessionId, userMessage: userMsg, aiResponse: assistantMsg,
        toolCalls: [] as any, bookingCreated: booking, latency: Date.now() - startTime,
      },
    });
  }

  // ═══ Option A: Parse salon list from get_salons tool output ═══
  private parseSalonList(content: string): Array<{ name: string; addr: string }> {
    return content
      .split('\n')
      .filter(l => l.includes('Tên:'))
      .map(line => ({
        name: line.match(/Tên:\s*([^|]+)/)?.[1]?.trim() || '',
        addr: line.match(/Địa chỉ:\s*([^|]+)/)?.[1]?.trim() || '',
      }))
      .filter(s => s.name.length > 0);
  }

  // ═══ Option A: Parse barber list from get_barbers tool output ═══
  private parseBarberList(content: string): Array<{ name: string; rating: string }> {
    return content
      .split('\n')
      .filter(l => l.includes('Tên:') && l.includes('ID:'))
      .map(line => ({
        name: line.match(/Tên:\s*([^,]+)/)?.[1]?.trim() || '',
        rating: line.match(/(\d+\.?\d*)\s*sao/)?.[1] || '',
      }))
      .filter(b => b.name.length > 0);
  }

  // ═══ Option A + B: Compose response with service-layer data & hallucination guard ═══
  private composeAndGuard(
    response: string,
    ctx: {
      salons: Array<{ name: string; addr: string }> | null;
      barbers: Array<{ name: string; rating: string }> | null;
      lastListTool: 'salons' | 'barbers' | null;
    },
  ): string {
    // ── Option B: Hallucination guard — detect fake “Thợ A”, “Thợ B”, “Barber 1” ──
    const HALLUCINATION_RE = /\b(Thợ|Barber|Staff)\s+[A-Z\d]\b/gi;
    if (ctx.barbers?.length && HALLUCINATION_RE.test(response)) {
      this.logger.warn('[Guard] Hallucinated barber names detected — injecting real DB data');
      const cleanedLines = response.split('\n').filter(l => !HALLUCINATION_RE.test(l));
      const followUp = cleanedLines.join('\n').trim() || 'Anh/chị muốn chọn thợ nào ạ? 😊';
      const barberList = ctx.barbers
        .map((b, i) => `${i + 1}. **${b.name}**${b.rating ? ` — ⭐ ${b.rating}/5` : ''}`)
        .join('\n');
      return `✂️ **Danh sách thợ cắt tóc:**\n${barberList}\n\n${followUp}`;
    }

    // ── Option A: Inject salon list if model didn’t display the names ──
    if (ctx.lastListTool === 'salons' && ctx.salons?.length) {
      const displayedAny = ctx.salons.some(s =>
        response.toLowerCase().includes(s.name.toLowerCase().substring(0, 8))
      );
      if (!displayedAny) {
        this.logger.log('[Compose] Injecting salon list — model skipped display');
        const salonList = ctx.salons
          .map((s, i) => `${i + 1}. **${s.name}**${s.addr ? ` - ${s.addr}` : ''}`)
          .join('\n');
        const followUp = this.extractQuestion(response, 'cơ sở');
        return `📍 **Danh sách cơ sở Reetro Barber:**\n${salonList}\n\n${followUp}`;
      }
    }

    // ── Option A: Inject barber list if model didn’t display the names ──
    if (ctx.lastListTool === 'barbers' && ctx.barbers?.length) {
      const displayedAny = ctx.barbers.some(b =>
        response.toLowerCase().includes(b.name.toLowerCase().substring(0, 5))
      );
      if (!displayedAny) {
        this.logger.log('[Compose] Injecting barber list — model skipped display');
        const barberList = ctx.barbers
          .map((b, i) => `${i + 1}. **${b.name}**${b.rating ? ` — ⭐ ${b.rating}/5` : ''}`)
          .join('\n');
        const followUp = this.extractQuestion(response, 'thợ');
        return `✂️ **Danh sách thợ cắt tóc:**\n${barberList}\n\n${followUp}`;
      }
    }

    return response;
  }

  // ═══ Extract follow-up question, stripping hallucinated numbered list lines ═══
  private extractQuestion(response: string, context: string): string {
    const FAKE_LIST_LINE_RE = /^\s*\d+\.\s*(Thợ|Barber|Cơ sở|Salon|Reetro|Chi nhánh|Staff).*$/gim;
    const cleaned = response.replace(FAKE_LIST_LINE_RE, '').replace(/\n{3,}/g, '\n\n').trim();
    const firstLine = cleaned.split('\n').find(l => l.trim().length > 5) || '';
    return firstLine.trim() || `Anh/chị muốn chọn ${context} nào ạ? 😊`;
  }
}
