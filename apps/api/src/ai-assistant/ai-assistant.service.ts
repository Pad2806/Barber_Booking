import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';
import { PrismaService } from '../database/prisma.service';
import { AIToolsService, BookingState, BookingStep, SalonItem, ServiceItem, BarberItem } from './ai-tools.service';
import { intentExtractionPrompt, responseGenerationPrompt } from './prompts/system.prompt';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

// ═══ Models — only confirmed active models ═══
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

// ═══ Intent Types ═══
interface ExtractedIntent {
  intent: string;
  salon?: string | null;
  service?: string | null;
  barber?: string | null;
  date?: string | null;
  time?: string | null;
  name?: string | null;
  phone?: string | null;
  confirmed?: boolean | null;
}

// ═══ Vietnamese day of week ═══
const VIET_DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// ═══ Booking-intent keywords ═══
const BOOKING_INTENT_RE = /(\d{10}|\d{4}[\s-]?\d{3}[\s-]?\d{3}|\d+h|sáng|chiều|trưa|tối|hôm nay|ngày mai|cắt tóc|nhuộm|uốn|gội|combo|cat toc|nhuom|uon|goi|hot toc|hớt|cơ sở|chi nhánh|quận|cs[0-9]|số [0-9])/i;

// ═══ Out-of-domain detection ═══
const OUT_OF_DOMAIN_TOPICS = [
  'thời tiết', 'nhiệt độ', 'dự báo thời tiết', 'trời mưa', 'trời nắng', 'bão lũ',
  'nấu ăn', 'công thức nấu', 'món ăn', 'nhà hàng', 'quán ăn', 'đặt đồ ăn',
  'bóng đá', 'xem phim', 'âm nhạc', 'youtube', 'tiktok', 'chơi game',
  'du lịch', 'vé máy bay', 'khách sạn', 'đặt phòng khách sạn',
  'cổ phiếu', 'crypto', 'bitcoin', 'ngân hàng', 'vay tiền', 'chứng khoán',
  'tin tức', 'chính trị', 'bầu cử', 'chiến tranh',
  'bệnh viện', 'bác sĩ', 'covid', 'vaccine',
  'bài tập toán', 'giải phương trình', 'lịch sử', 'địa lý', 'vật lý',
  'chatgpt', 'gemini', 'claude ai', 'lập trình', 'viết code',
  'mua điện thoại', 'mua laptop', 'shopping', 'lazada', 'shopee',
];

const OUT_OF_DOMAIN_RE = new RegExp(
  OUT_OF_DOMAIN_TOPICS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i',
);
const BARBER_DOMAIN_RE = /tóc|cắt|hớt|gội|nhuộm|uốn|duỗi|barber|thợ|salon|cơ sở|chi nhánh|dịch vụ|đặt lịch|lịch hẹn|booking|combo|stylist|reetro/i;
const OUT_OF_DOMAIN_RESPONSE = 'Xin lỗi anh, em chỉ hỗ trợ các vấn đề liên quan đến **dịch vụ hớt tóc và đặt lịch** tại **Reetro Barber** thôi ạ! 💈\n\nAnh có muốn em hỗ trợ:\n• ✂️ Đặt lịch cắt tóc\n• 💰 Xem giá dịch vụ\n• 📍 Xem địa chỉ các salon\n\nEm sẵn sàng giúp ngay! 😊';

// ═══ FAQ Patterns ═══
const FAQ_PATTERNS: { keywords: string[]; response: string | (() => string) }[] = [
  {
    keywords: ['hôm nay là thứ', 'thứ mấy', 'ngày mấy', 'hôm nay là ngày', 'today'],
    response: () => {
      const now = dayjs().tz('Asia/Ho_Chi_Minh');
      return `📅 Hôm nay là **${VIET_DAYS[now.day()]}, ngày ${now.format('DD/MM/YYYY')}**.\n\nAnh muốn đặt lịch hôm nay không ạ? Em hỗ trợ ngay! ✂️`;
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
    keywords: ['giờ mở cửa', 'mấy giờ mở', 'mấy giờ đóng', 'đóng cửa', 'giờ làm việc'],
    response: '🕐 **Giờ hoạt động của Reetro Barber:**\n\n• Thứ 2 - Thứ 7: 8:00 - 20:00\n• Chủ nhật: 9:00 - 18:00\n\nAnh muốn đặt lịch không ạ? ✂️',
  },
  {
    keywords: ['ở đâu', 'địa chỉ', 'chỗ nào', 'đường nào'],
    response: '📍 Anh có thể xem danh sách các chi nhánh trên trang **Hệ thống Salon** nhé!\n\nAnh cần đặt lịch tại chi nhánh nào ạ? 😊',
  },
  {
    keywords: ['hủy lịch', 'hủy đặt', 'cancel', 'bỏ lịch'],
    response: '❌ Anh có thể hủy lịch hẹn tại mục **"Lịch hẹn của tôi"** trên trang web.\n\n⚠️ Vui lòng hủy trước **2 giờ** so với giờ hẹn nhé!',
  },
  {
    keywords: ['cảm ơn', 'thank', 'thanks', 'ok ạ', 'ok em', 'cám ơn'],
    response: 'Dạ không có gì ạ! 😊 Reetro Barber luôn sẵn sàng phục vụ anh.\n\nNếu cần gì thêm, cứ nhắn em nhé! ✂️💈',
  },
  {
    keywords: ['xin chào', 'hello', 'hi', 'hey', 'chào'],
    response: 'Chào anh! 👋 Em là trợ lý ảo của **Reetro Barber**.\n\nEm có thể giúp anh:\n• 📋 Xem dịch vụ & giá\n• 👨‍🦱 Chọn thợ yêu thích\n• 📅 Đặt lịch nhanh\n\nAnh cần gì ạ? 😊',
  },
];

// ═══ Cache ═══
interface CachedResponse { response: string; timestamp: number; }
const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class AIAssistantService implements OnModuleInit {
  private groq: Groq;
  private readonly logger = new Logger(AIAssistantService.name);
  private responseCache = new Map<string, CachedResponse>();
  private rateLimitedUntil = new Map<string, number>();

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private dataService: AIToolsService,
  ) {
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (groqKey) {
      this.groq = new Groq({ apiKey: groqKey });
      this.logger.log('✅ Groq client initialized');
    } else {
      this.logger.error('❌ GROQ_API_KEY missing!');
    }
  }

  async onModuleInit() {
    if (!this.groq) this.logger.error('❌ Groq not initialized.');
    setInterval(() => this.cleanCache(), 10 * 60 * 1000);
  }

  // ═══════════════════════════════════════════
  // MAIN ENTRY POINT
  // ═══════════════════════════════════════════
  async chat(message: string, sessionId: string, userId?: string) {
    const startTime = Date.now();

    // Pre-flight: Out-of-domain
    if (this.isOutOfDomain(message)) {
      await this.storeConversation(sessionId, userId, message, OUT_OF_DOMAIN_RESPONSE, startTime);
      return { response: OUT_OF_DOMAIN_RESPONSE, source: 'ood_guard' };
    }

    // Pre-flight: FAQ
    const faq = this.matchFAQ(message);
    if (faq) {
      await this.storeConversation(sessionId, userId, message, faq, startTime);
      return { response: faq, source: 'faq' };
    }

    // Pre-flight: Cache (skip for booking intents)
    const isBooking = BOOKING_INTENT_RE.test(message) ||
      /(đặt lịch|\bbook\b|dịch vụ|thợ|barber|xác nhận|\bok\b|\byes\b|được|đúng|rồi)/i.test(message);
    if (!isBooking) {
      const cached = this.getCachedResponse(message);
      if (cached) {
        await this.storeConversation(sessionId, userId, message, cached, startTime);
        return { response: cached, source: 'cache' };
      }
    }

    if (!this.groq) {
      return { response: 'Xin lỗi, hệ thống AI đang bảo trì. Anh vui lòng thử lại sau! 🙏', error: true };
    }

    try {
      this.logger.log(`[Chat] session=${sessionId} msg="${message.substring(0, 60)}"`);
      const result = await this.processBookingFlow(message, sessionId, userId);
      const response = result.response;

      this.setCachedResponse(message, response);
      await this.storeConversation(sessionId, userId, message, response, startTime, result.bookingCreated);
      return { response, source: 'orchestrator' };
    } catch (error: any) {
      this.logger.error(`[Chat FAIL] session=${sessionId} error=${error?.message}`);
      const errResp = error?.message === 'TIMEOUT'
        ? '⏱️ Hệ thống hơi chậm, anh thử gửi lại nhé!'
        : 'Xin lỗi, em gặp sự cố. Anh thử lại sau nhé! 🙏';
      return { response: errResp, error: true };
    }
  }

  // ═══════════════════════════════════════════
  // AUTH-REQUIRED STEPS (need login to proceed)
  // ═══════════════════════════════════════════
  private static readonly AUTH_REQUIRED_STEPS: Set<BookingStep> = new Set([
    'SELECT_BARBER', 'SELECT_DATE_TIME', 'COLLECT_INFO', 'CONFIRM_BOOKING',
  ]);

  private static readonly AUTH_REQUIRED_RESPONSE =
    '🔒 Anh/chị vui lòng **đăng nhập** để tiếp tục chọn thợ và đặt lịch nhé! 😊\n\n' +
    'Sau khi đăng nhập, anh/chị có thể:\n' +
    '• 👨‍🦱 Chọn thợ yêu thích\n' +
    '• 📅 Xem lịch trống\n' +
    '• ✅ Đặt lịch nhanh\n\n' +
    '👉 Nhấn vào nút **Đăng nhập** ở góc trên để bắt đầu ạ!';

  // ═══════════════════════════════════════════
  // DETERMINISTIC BOOKING FLOW ORCHESTRATOR
  // No LLM tool calling. Backend controls everything.
  // ═══════════════════════════════════════════
  private async processBookingFlow(
    message: string, sessionId: string, userId?: string,
  ): Promise<{ response: string; bookingCreated: boolean }> {
    // 1. Load state
    const state = await this.dataService.loadState(sessionId, userId);
    const stepBefore = this.dataService.computeStep(state);
    this.logger.log(`[Flow] step=${stepBefore} userId=${userId || 'GUEST'} state=${this.dataService.getStateDescription(state)}`);

    // ══ AUTH GUARD: Block protected steps for unauthenticated users ══
    if (!userId && AIAssistantService.AUTH_REQUIRED_STEPS.has(stepBefore)) {
      this.logger.warn(`[Auth] Blocked guest at step=${stepBefore}`);
      return { response: AIAssistantService.AUTH_REQUIRED_RESPONSE, bookingCreated: false };
    }

    // 2. Load conversation history (last 2 messages for context)
    const history = await this.getRecentHistory(sessionId);

    // 3. Extract intent from user message (single LLM call, NO tools)
    const intent = await this.extractIntent(message, state, stepBefore, history);
    this.logger.log(`[Intent] ${JSON.stringify(intent)}`);

    // 4. Apply extracted entities to state (backend-only, no LLM)
    const applyResult = await this.applyEntities(intent, state);

    // 5. Generate response based on updated state (deterministic, backend-controlled)
    const stepAfter = this.dataService.computeStep(state);
    this.logger.log(`[Flow] step ${stepBefore} → ${stepAfter}`);

    // ══ AUTH GUARD: Check again after entity application ══
    if (!userId && AIAssistantService.AUTH_REQUIRED_STEPS.has(stepAfter)) {
      this.logger.warn(`[Auth] Blocking guest after entity application, step would be=${stepAfter}`);
      // Persist partial state (salon + service only) so progress isn't lost after login
      await this.dataService.saveState(sessionId, state);
      const parts: string[] = [];
      if (applyResult.acknowledgments.length > 0) {
        parts.push(applyResult.acknowledgments.join('\n'));
      }
      parts.push(AIAssistantService.AUTH_REQUIRED_RESPONSE);
      return { response: parts.join('\n\n'), bookingCreated: false };
    }

    const response = await this.generateStepResponse(state, stepAfter, intent, applyResult.acknowledgments, userId);
    const bookingCreated = state.status === 'COMPLETED';

    // 6. Persist state
    await this.dataService.saveState(sessionId, state);

    return { response, bookingCreated };
  }

  // ═══════════════════════════════════════════
  // INTENT EXTRACTION (single LLM call, no tools)
  // ═══════════════════════════════════════════
  private async extractIntent(
    message: string,
    state: BookingState,
    step: BookingStep,
    history: Array<{ role: string; content: string }>,
  ): Promise<ExtractedIntent> {
    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    const today = now.format('YYYY-MM-DD');
    const tomorrow = now.add(1, 'day').format('YYYY-MM-DD');

    const stateDesc = this.dataService.getStateDescription(state);
    const prompt = intentExtractionPrompt(step, stateDesc, today, tomorrow);

    const messages: any[] = [
      { role: 'system', content: prompt },
      // Include last 2 conversation turns for context
      ...history.slice(-4).map(m => ({
        role: m.role,
        content: m.content.substring(0, 200),
      })),
      { role: 'user', content: message },
    ];

    // Try LLM extraction with model fallback
    for (const model of GROQ_MODELS) {
      const blockedUntil = this.rateLimitedUntil.get(model) ?? 0;
      if (blockedUntil > Date.now()) continue;

      try {
        this.logger.log(`[Extract] model=${model}`);
        const completion = await Promise.race([
          this.groq.chat.completions.create({
            model,
            messages,
            max_tokens: 150,
            temperature: 0.1,
          }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), 12_000)),
        ]) as any;

        if (completion.usage) {
          this.logger.log(`[Token] ${model} prompt=${completion.usage.prompt_tokens} comp=${completion.usage.completion_tokens}`);
        }

        const text = completion.choices[0]?.message?.content || '{}';
        return this.parseExtractedJSON(text);
      } catch (e: any) {
        if (e?.status === 429 || e?.message?.includes('429')) {
          this.rateLimitedUntil.set(model, Date.now() + 90_000);
        }
        this.logger.warn(`[Extract FAIL] model=${model} err=${(e?.message || '').substring(0, 100)}`);
      }
    }

    // Fallback: regex-based extraction
    this.logger.warn('[Extract] All models failed — using regex fallback');
    return this.fallbackExtract(message, step);
  }

  // ═══ Parse LLM JSON response ═══
  private parseExtractedJSON(text: string): ExtractedIntent {
    try {
      // Find JSON in response (LLM might add extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          intent: parsed.intent || 'other',
          salon: parsed.salon || null,
          service: parsed.service || null,
          barber: parsed.barber || null,
          date: parsed.date || null,
          time: parsed.time || null,
          name: parsed.name || null,
          phone: parsed.phone || null,
          confirmed: parsed.confirmed ?? null,
        };
      }
    } catch (e) {
      this.logger.warn(`[Parse] Bad JSON: ${text.substring(0, 100)}`);
    }
    return { intent: 'other' };
  }

  // ═══ Regex Fallback Extraction (when LLM fails) ═══
  private fallbackExtract(message: string, step: BookingStep): ExtractedIntent {
    const result: ExtractedIntent = { intent: 'other' };
    const msg = message.trim();
    const lower = msg.toLowerCase();

    // Pure number → selection based on step
    const numMatch = msg.match(/^(\d+)$/);
    if (numMatch) {
      result.intent = 'select';
      if (step === 'SELECT_SALON') result.salon = numMatch[1];
      else if (step === 'SELECT_SERVICE') result.service = numMatch[1];
      else if (step === 'SELECT_BARBER') result.barber = numMatch[1];
      return result;
    }

    // Confirmation
    if (/^(ok|được|đúng|rồi|yes|có|xác nhận|oke)/i.test(lower)) {
      return { intent: 'confirm', confirmed: true };
    }

    // Rejection/change
    if (/^(không|sai|chưa|đổi|thay)/i.test(lower)) {
      return { intent: 'change', confirmed: false };
    }

    // Phone
    const phoneMatch = msg.match(/(0\d{9})/);
    if (phoneMatch) {
      result.phone = phoneMatch[1];
      result.intent = 'select';
    }

    // Time patterns
    const timePatterns = [
      { re: /(\d{1,2})h(\d{2})/i, parse: (m: RegExpMatchArray) => ({ h: parseInt(m[1]), m: parseInt(m[2]) }) },
      { re: /(\d{1,2})\s*rưỡi/i, parse: (m: RegExpMatchArray) => ({ h: parseInt(m[1]), m: 30 }) },
      { re: /(\d{1,2})\s*(?:giờ|h)\b/i, parse: (m: RegExpMatchArray) => ({ h: parseInt(m[1]), m: 0 }) },
      { re: /(\d{1,2}):(\d{2})/i, parse: (m: RegExpMatchArray) => ({ h: parseInt(m[1]), m: parseInt(m[2]) }) },
    ];
    for (const { re, parse } of timePatterns) {
      const m = msg.match(re);
      if (m) {
        let { h, m: min } = parse(m);
        if (/(chiều|tối)/i.test(msg) && h < 12) h += 12;
        result.time = `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        result.intent = 'select';
        break;
      }
    }

    // Date
    if (/(ngày\s*mai|mai\b|tomorrow)/i.test(msg)) {
      const d = dayjs().tz('Asia/Ho_Chi_Minh').add(1, 'day');
      result.date = d.format('YYYY-MM-DD');
      result.intent = result.intent === 'other' ? 'ask_slots' : result.intent;
    } else if (/(hôm\s*nay|today)/i.test(msg)) {
      result.date = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD');
      result.intent = result.intent === 'other' ? 'ask_slots' : result.intent;
    }

    // Booking intent
    if (/(đặt\s*lịch|book|cắt\s*tóc|cat\s*toc|hot\s*toc|hớt|nhuộm|uốn|combo|gội|dịch\s*vụ)/i.test(msg)) {
      result.intent = 'book';
    }

    // "Any barber"
    if (/(ai\s*cũng|thợ\s*nào\s*cũng|chọn\s*giúp|bất\s*kỳ)/i.test(msg)) {
      result.barber = 'any';
      result.intent = 'select';
    }

    // Salon extraction: "quận 1", "q1", "cơ sở quận 1", "Nguyễn Văn Linh"
    const salonPatterns = [
      /(?:cơ\s*sở|salon|chi\s*nhánh)\s+(.+?)(?:\s+(?:vào|lúc|ngày|hôm|ở|tại)|$)/i,
      /(quận\s*\d+)/i,
      /(q\.?\d+)/i,
    ];
    for (const re of salonPatterns) {
      const m = msg.match(re);
      if (m && !result.salon) {
        result.salon = m[1].trim();
        result.intent = result.intent === 'other' ? 'book' : result.intent;
        break;
      }
    }

    return result;
  }

  // ═══════════════════════════════════════════
  // ENTITY APPLICATION (backend-only, no LLM)
  // Resolves user text → real DB IDs
  // ═══════════════════════════════════════════
  private async applyEntities(
    intent: ExtractedIntent, state: BookingState,
  ): Promise<{ acknowledgments: string[] }> {
    const acks: string[] = [];

    // Handle change intent — reset dependent fields
    if (intent.intent === 'change') {
      if (intent.confirmed === false && this.dataService.computeStep(state) === 'CONFIRM_BOOKING') {
        // User says "no" at confirmation — ask what to change
        return { acknowledgments: ['Anh/chị muốn thay đổi thông tin nào ạ?'] };
      }
      // If user specifies what to change, reset from that field down
      if (intent.salon) { state.salonId = null; state.serviceId = null; state.barberId = null; state.date = null; state.time = null; }
      else if (intent.service) { state.serviceId = null; state.barberId = null; }
      else if (intent.barber) { state.barberId = null; state.date = null; state.time = null; }
      else if (intent.date || intent.time) { state.date = null; state.time = null; }
    }

    // Apply salon
    if (intent.salon && !state.salonId) {
      const salons = await this.dataService.getSalons();
      const salon = await this.dataService.resolveSalon(intent.salon, salons);
      if (salon) {
        state.salonId = salon.id;
        acks.push(`✅ Cơ sở: **${salon.name}**`);
      } else if (salons.length > 1) {
        // Resolution failed → show list for user to pick
        const list = salons.map((s, i) => `${i + 1}. **${s.name}** — ${s.address}`).join('\n');
        acks.push(`Em không tìm thấy cơ sở "${intent.salon}". Anh/chị vui lòng chọn:\n\n${list}`);
      }
    }

    // Apply service (only if salon exists)
    if (intent.service && state.salonId && !state.serviceId) {
      const services = await this.dataService.getServices(state.salonId);
      const svc = await this.dataService.resolveService(intent.service, services);
      if (svc) {
        state.serviceId = svc.id;
        acks.push(`✅ Dịch vụ: **${svc.name}** (${svc.price.toLocaleString()}đ)`);
      }
    }

    // Apply barber (only if salon exists)
    if (intent.barber && state.salonId && !state.barberId) {
      const barbers = await this.dataService.getBarbers(state.salonId);
      const barber = await this.dataService.resolveBarber(intent.barber, barbers);
      if (barber) {
        state.barberId = barber.id;
        acks.push(`✅ Thợ: **${barber.name}** (⭐ ${barber.rating}/5)`);
      }
    }

    // Apply date
    if (intent.date && !state.date) {
      state.date = intent.date;
      acks.push(`✅ Ngày: **${dayjs(intent.date).format('DD/MM/YYYY')}**`);
    }

    // Apply time
    if (intent.time && !state.time) {
      state.time = intent.time;
      acks.push(`✅ Giờ: **${intent.time}**`);
    }

    // Apply customer info
    if (intent.name && !state.customerName) {
      state.customerName = intent.name;
      acks.push(`✅ Tên: **${intent.name}**`);
    }
    if (intent.phone && !state.phone) {
      state.phone = intent.phone;
      acks.push(`✅ SĐT: **${intent.phone}**`);
    }

    // Handle booking confirmation
    if (intent.intent === 'confirm' && intent.confirmed === true) {
      // Will be handled in generateStepResponse
    }

    return { acknowledgments: acks };
  }

  // ═══════════════════════════════════════════
  // RESPONSE GENERATION (deterministic, template-based)
  // Backend decides what to show. No LLM tool calling.
  // ═══════════════════════════════════════════
  private async generateStepResponse(
    state: BookingState,
    step: BookingStep,
    intent: ExtractedIntent,
    acks: string[],
    userId?: string,
  ): Promise<string> {
    const parts: string[] = [];

    // Add acknowledgments
    if (acks.length > 0) {
      parts.push(acks.join('\n'));
    }

    switch (step) {
      case 'SELECT_SALON': {
        const salons = await this.dataService.getSalons();
        if (salons.length === 0) {
          parts.push('Hiện tại chưa có cơ sở nào đang hoạt động. Anh vui lòng thử lại sau! 🙏');
          break;
        }
        if (salons.length === 1) {
          // Auto-select
          state.salonId = salons[0].id;
          parts.push(`📍 Đã tự động chọn cơ sở **${salons[0].name}** (${salons[0].address}).`);
          // Cascade to next step
          return this.generateStepResponse(state, this.dataService.computeStep(state), intent, parts, userId);
        }
        parts.push(this.formatSalonList(salons));
        parts.push('Anh/chị muốn đặt lịch tại cơ sở nào ạ? 😊');
        break;
      }

      case 'SELECT_SERVICE': {
        const services = await this.dataService.getServices(state.salonId!);
        if (services.length === 0) {
          parts.push('Cơ sở này chưa có dịch vụ nào. Anh vui lòng chọn cơ sở khác.');
          state.salonId = null;
          break;
        }
        // Try to auto-resolve pending service from intent
        if (intent.service && !state.serviceId) {
          const svc = await this.dataService.resolveService(intent.service, services);
          if (svc) {
            state.serviceId = svc.id;
            parts.push(`✅ Dịch vụ: **${svc.name}** (${svc.price.toLocaleString()}đ)`);
            return this.generateStepResponse(state, this.dataService.computeStep(state), intent, parts, userId);
          }
        }
        parts.push(this.formatServiceList(services));
        parts.push('Anh/chị muốn chọn dịch vụ nào ạ? ✂️');
        break;
      }

      case 'SELECT_BARBER': {
        const barbers = await this.dataService.getBarbers(state.salonId!);
        if (barbers.length === 0) {
          parts.push('Cơ sở này chưa có thợ nào. Anh vui lòng chọn cơ sở khác.');
          state.salonId = null;
          state.serviceId = null;
          break;
        }
        // Auto-resolve pending barber
        if (intent.barber && !state.barberId) {
          const barber = await this.dataService.resolveBarber(intent.barber, barbers);
          if (barber) {
            state.barberId = barber.id;
            parts.push(`✅ Thợ: **${barber.name}** (⭐ ${barber.rating}/5)`);
            return this.generateStepResponse(state, this.dataService.computeStep(state), intent, parts, userId);
          }
        }
        parts.push(this.formatBarberList(barbers));
        parts.push('Anh/chị muốn chọn thợ nào ạ? 😊');
        break;
      }

      case 'SELECT_DATE_TIME': {
        // If date exists but no time → show slots
        if (state.date && !state.time && state.barberId) {
          const slots = await this.dataService.getAvailableSlots(state.barberId, state.date);
          if (slots.length > 0) {
            // Auto-resolve pending time
            if (intent.time) {
              if (slots.includes(intent.time)) {
                state.time = intent.time;
                parts.push(`✅ Giờ: **${intent.time}**`);
                return this.generateStepResponse(state, this.dataService.computeStep(state), intent, parts, userId);
              } else {
                parts.push(`⚠️ Khung giờ **${intent.time}** đã hết.`);
              }
            }
            parts.push(`📅 Khung giờ trống ngày **${dayjs(state.date).format('DD/MM/YYYY')}**:\n${slots.map((s, i) => `${i + 1}. **${s}**`).join('\n')}`);
            parts.push('Anh/chị muốn chọn giờ nào ạ? ⏰');
          } else {
            parts.push(`Rất tiếc, ngày **${dayjs(state.date).format('DD/MM/YYYY')}** đã hết chỗ. Anh chọn ngày khác nhé!`);
            state.date = null;
          }
          break;
        }

        // If we have time from intent but no date yet
        if (!state.date) {
          parts.push('Anh/chị muốn đặt lịch vào ngày nào ạ? 📅\n\n(VD: "ngày mai", "hôm nay", "2026-05-01")');
        } else if (!state.time) {
          // Have date, need to show slots
          const slots = await this.dataService.getAvailableSlots(state.barberId!, state.date);
          if (slots.length > 0) {
            parts.push(`📅 Khung giờ trống ngày **${dayjs(state.date).format('DD/MM/YYYY')}**:\n${slots.map((s, i) => `${i + 1}. **${s}**`).join('\n')}`);
            parts.push('Anh/chị muốn chọn giờ nào ạ? ⏰');
          } else {
            parts.push(`Ngày **${dayjs(state.date).format('DD/MM/YYYY')}** đã hết chỗ. Anh chọn ngày khác nhé!`);
            state.date = null;
          }
        }
        break;
      }

      case 'COLLECT_INFO': {
        if (!state.customerName && !state.phone) {
          parts.push('Anh/chị cho em xin **tên** và **số điện thoại** để em đặt lịch nhé! 📝');
        } else if (!state.customerName) {
          parts.push('Anh/chị cho em xin **tên** nhé! 📝');
        } else if (!state.phone) {
          parts.push('Anh/chị cho em xin **số điện thoại** (10 số) nhé! 📱');
        }
        break;
      }

      case 'CONFIRM_BOOKING': {
        // If user confirmed → create booking
        if (intent.intent === 'confirm' && intent.confirmed === true) {
          const result = await this.dataService.createBooking(state, userId);
          if (result.success) {
            state.status = 'COMPLETED';
            return result.message;
          } else {
            parts.push(`⚠️ ${result.message}`);
            parts.push('Anh/chị muốn thay đổi gì không ạ?');
            break;
          }
        }

        // Show confirmation summary
        const summary = await this.buildSummary(state);
        parts.push('📋 **Xác nhận đặt lịch:**\n');
        parts.push(summary);
        parts.push('\nThông tin chính xác không ạ? Anh/chị nhắn **"ok"** để em đặt lịch ngay! 😊');
        break;
      }

      case 'COMPLETED': {
        parts.push('Anh/chị đã có lịch hẹn rồi ạ! 🎉\n\nAnh/chị muốn đặt lịch mới không? Cứ nhắn "đặt lịch" nhé! ✂️');
        break;
      }
    }

    return parts.join('\n\n');
  }

  // ═══════════════════════════════════════════
  // FORMATTING HELPERS
  // ═══════════════════════════════════════════
  private formatSalonList(salons: SalonItem[]): string {
    const list = salons
      .map((s, i) => `${i + 1}. **${s.name}** — ${s.address}`)
      .join('\n');
    return `📍 **Danh sách cơ sở Reetro Barber:**\n${list}`;
  }

  private formatServiceList(services: ServiceItem[]): string {
    const list = services
      .map((s, i) => `${i + 1}. **${s.name}** — ${s.price.toLocaleString()}đ (${s.duration} phút)`)
      .join('\n');
    return `💈 **Dịch vụ:**\n${list}`;
  }

  private formatBarberList(barbers: BarberItem[]): string {
    const list = barbers
      .map((b, i) => `${i + 1}. **${b.name}** — ⭐ ${b.rating}/5`)
      .join('\n');
    return `✂️ **Danh sách thợ:**\n${list}`;
  }

  private async buildSummary(state: BookingState): Promise<string> {
    const salonName = state.salonId ? await this.dataService.getSalonName(state.salonId) : '—';
    const serviceName = state.serviceId ? await this.dataService.getServiceName(state.serviceId) : '—';
    const barberName = state.barberId ? await this.dataService.getBarberName(state.barberId) : '—';
    const dateStr = state.date ? dayjs(state.date).format('DD/MM/YYYY') : '—';

    return [
      `📍 Cơ sở: **${salonName}**`,
      `✂️ Dịch vụ: **${serviceName}**`,
      `💇 Thợ: **${barberName}**`,
      `📅 Ngày: **${dateStr}**`,
      `⏰ Giờ: **${state.time || '—'}**`,
      `👤 Tên: **${state.customerName || '—'}**`,
      `📱 SĐT: **${state.phone || '—'}**`,
    ].join('\n');
  }

  // ═══════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════
  private isOutOfDomain(message: string): boolean {
    if (BARBER_DOMAIN_RE.test(message)) return false;
    if (BOOKING_INTENT_RE.test(message)) return false;
    return OUT_OF_DOMAIN_RE.test(message);
  }

  private matchFAQ(message: string): string | null {
    if (BOOKING_INTENT_RE.test(message)) return null;
    const normalized = ' ' + message.toLowerCase().trim().replace(/[.,!?;()]/g, '') + ' ';
    for (const faq of FAQ_PATTERNS) {
      if (faq.keywords.some(kw => normalized.includes(' ' + kw + ' '))) {
        return typeof faq.response === 'function' ? faq.response() : faq.response;
      }
    }
    return null;
  }

  private getCachedResponse(message: string): string | null {
    const key = message.toLowerCase().trim().replace(/\s+/g, ' ');
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) return cached.response;
    if (cached) this.responseCache.delete(key);
    return null;
  }

  private setCachedResponse(message: string, response: string) {
    const key = message.toLowerCase().trim().replace(/\s+/g, ' ');
    this.responseCache.set(key, { response, timestamp: Date.now() });
  }

  private cleanCache() {
    const now = Date.now();
    for (const [key, val] of this.responseCache) {
      if (now - val.timestamp > CACHE_TTL_MS) this.responseCache.delete(key);
    }
  }

  private async getRecentHistory(sessionId: string): Promise<Array<{ role: string; content: string }>> {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { sessionId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 4 } },
    });
    if (!conversation?.messages) return [];
    return conversation.messages.reverse().map(m => ({
      role: m.role,
      content: m.content,
    }));
  }

  private async storeConversation(
    sessionId: string, userId: string | undefined,
    userMsg: string, assistantMsg: string,
    startTime: number, bookingCreated = false,
  ) {
    let conversation = await this.prisma.chatConversation.findUnique({ where: { sessionId } });
    if (!conversation) {
      conversation = await this.prisma.chatConversation.create({ data: { sessionId, userId } });
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
        toolCalls: [] as any, bookingCreated, latency: Date.now() - startTime,
      },
    });
  }
}
