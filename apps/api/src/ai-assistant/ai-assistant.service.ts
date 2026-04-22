import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Groq } from 'groq-sdk';
import { PrismaService } from '../database/prisma.service';
import { AIToolsService } from './ai-tools.service';
import { systemPrompt } from './prompts/system.prompt';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import * as salonKnowledge from './data/salon_knowledge.json';

dayjs.extend(utc);
dayjs.extend(timezone);

// ═══ OpenAI/Groq Tool Definitions ═══
const GROQ_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_services',
      description: 'Lấy danh sách các dịch vụ của salon.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_barbers',
      description: 'Lấy danh sách thợ cắt tóc.',
      parameters: { type: 'object', properties: {} },
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
      description: 'Lưu hoặc cập nhật thông tin khách hàng cung cấp (Tên, SĐT, Dịch vụ, Thợ, Ngày, Giờ) để duy trì ngữ cảnh.',
      parameters: {
        type: 'object',
        properties: {
          customer_name: { type: ['string', 'null'] },
          phone: { type: ['string', 'null'] },
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

// ═══ Vietnamese day of week map ═══
const VIET_DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

// ═══ FAQ Router ═══
const FAQ_PATTERNS: { keywords: string[]; response: string | (() => string) }[] = [
  // Dynamic: date/time questions
  {
    keywords: ['hôm nay là thứ', 'thứ mấy', 'ngày mấy', 'hôm nay là ngày', 'ngày bao nhiêu', 'today'],
    response: () => {
      const now = dayjs().tz('Asia/Ho_Chi_Minh');
      const day = VIET_DAYS[now.day()];
      return `📅 Hôm nay là **${day}, ngày ${now.format('DD/MM/YYYY')}**.\n\nBây giờ là **${now.format('HH:mm')}**.\n\nAnh muốn đặt lịch hôm nay không ạ? Em hỗ trợ ngay! ✂️`;
    },
  },
  {
    keywords: ['mấy giờ rồi', 'bây giờ là', 'giờ bao nhiêu', 'what time'],
    response: () => {
      const now = dayjs().tz('Asia/Ho_Chi_Minh');
      return `🕐 Bây giờ là **${now.format('HH:mm')}** (${VIET_DAYS[now.day()]}, ${now.format('DD/MM/YYYY')}).\n\nAnh cần đặt lịch không ạ? 😊`;
    },
  },
  // Static FAQs
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

// ═══ Tool declarations (shared between models) ═══
const TOOL_DECLARATIONS = [
  {
    functionDeclarations: [
      {
        name: 'get_services',
        description: 'Lấy danh sách các dịch vụ của salon.',
      },
      {
        name: 'get_barbers',
        description: 'Lấy danh sách thợ cắt tóc.',
      },
      {
        name: 'get_available_slots',
        description: 'Kiểm tra khung giờ còn trống của thợ vào một ngày.',
        parameters: {
          type: 'object',
          properties: {
            barber_id: { type: 'string' },
            date: { type: 'string', description: 'YYYY-MM-DD' },
          },
          required: ['barber_id', 'date'],
        },
      },
      {
        name: 'create_booking',
        description: 'Tạo lịch hẹn mới.',
        parameters: {
          type: 'object',
          properties: {
            customer_name: { type: 'string' },
            phone: { type: 'string' },
            service_id: { type: 'string' },
            barber_id: { type: 'string' },
            date: { type: 'string' },
            time: { type: 'string' },
          },
          required: ['customer_name', 'phone', 'service_id', 'barber_id', 'date', 'time'],
        },
      },
      {
        name: 'update_booking_state',
        description: 'Lưu hoặc cập nhật thông tin khách hàng cung cấp (Tên, SĐT, Dịch vụ, Thợ, Ngày, Giờ) để duy trì ngữ cảnh.',
        parameters: {
          type: 'object',
          properties: {
            customer_name: { type: 'string' },
            phone: { type: 'string' },
            service_id: { type: 'string' },
            barber_id: { type: 'string' },
            date: { type: 'string', description: 'YYYY-MM-DD' },
            time: { type: 'string', description: 'HH:mm' },
          },
        },
      },
      {
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
    ],
  },
] as any;

// ═══ Models to try in order ═══
const MODEL_PRIORITY = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-8b'];

@Injectable()
export class AIAssistantService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private groq: Groq;
  private models: Map<string, any> = new Map();
  private activeModelName: string = MODEL_PRIORITY[0];
  private readonly logger = new Logger(AIAssistantService.name);
  private responseCache = new Map<string, CachedResponse>();

  // Rate limit tracking
  private requestTimestamps: number[] = [];
  private readonly MAX_RPM = 14;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private toolsService: AIToolsService,
  ) {
    // ═══ Gemini Setup ═══
    const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
    }

    // ═══ Groq Setup ═══
    const groqKey = this.configService.get<string>('GROQ_API_KEY');
    if (groqKey) {
      this.groq = new Groq({ apiKey: groqKey });
      this.logger.log('✅ Groq client initialized');
    } else {
      this.logger.warn('⚠️ GROQ_API_KEY is missing! Falling back to Gemini.');
    }
  }

  async onModuleInit() {
    // Initialize ALL models (no ping, just create instances)
    if (this.genAI) {
      for (const modelName of MODEL_PRIORITY) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelName,
            tools: TOOL_DECLARATIONS,
          });
          this.models.set(modelName, model);
          this.logger.log(`✅ Model ${modelName} initialized`);
        } catch (error: any) {
          this.logger.error(`❌ Failed to init ${modelName}: ${error.message}`);
        }
      }
    }

    if (this.models.size === 0 && !this.groq) {
      this.logger.error('❌ No AI models (Gemini or Groq) could be initialized!');
    }

    // Clean cache every 10 min
    setInterval(() => this.cleanCache(), 10 * 60 * 1000);
  }

  private getModel(): any {
    return this.models.get(this.activeModelName) || this.models.values().next().value;
  }

  // ═══ FAQ Router ═══
  private matchFAQ(message: string): string | null {
    // Pad with spaces and remove punctuation for safe exact-word matching
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

  // ═══ Rate Limiter ═══
  private canMakeRequest(): boolean {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(t => now - t < 60_000);
    return this.requestTimestamps.length < this.MAX_RPM;
  }

  private recordRequest() {
    this.requestTimestamps.push(Date.now());
  }

  // ═══ Call Gemini with Retry + Model Fallback ═══
  private async callWithRetry<T>(fn: (model: any) => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;

    // Try each model
    for (const modelName of MODEL_PRIORITY) {
      const model = this.models.get(modelName);
      if (!model) continue;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // Check internal rate limit
          if (!this.canMakeRequest()) {
            const waitMs = Math.min(3000 * Math.pow(2, attempt), 15000);
            this.logger.warn(`[Rate Limit] Waiting ${waitMs}ms (attempt ${attempt + 1})`);
            await new Promise(resolve => setTimeout(resolve, waitMs));
            if (!this.canMakeRequest()) continue;
          }

          this.recordRequest();
          const result = await fn(model);
          this.activeModelName = modelName;
          return result;
        } catch (error: any) {
          lastError = error;
          const errMsg = error?.message || '';
          const errStatus = error?.status || error?.response?.status || error?.errorDetails?.[0]?.reason;

          this.logger.error(`[Gemini Error] model=${modelName} attempt=${attempt + 1} status=${errStatus} msg=${errMsg.substring(0, 150)}`);

          const isRateLimit = errStatus === 429
            || errMsg.includes('429')
            || errMsg.includes('RESOURCE_EXHAUSTED')
            || errMsg.includes('Too Many Requests')
            || errMsg.includes('quota');

          if (isRateLimit) {
            const backoffMs = Math.min(2000 * Math.pow(2, attempt), 15000);
            this.logger.warn(`[429] model=${modelName} backoff=${backoffMs}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          } else {
            // Non-rate-limit error → try next model
            this.logger.warn(`[Non-429 Error] model=${modelName}: ${errMsg.substring(0, 100)}`);
            break;
          }
        }
      }

      this.logger.warn(`[Model Exhausted] ${modelName}, trying next model...`);
    }

    throw lastError;
  }

  // ═══ Main Chat Method ═══
  async chat(message: string, sessionId: string, userId?: string) {
    const startTime = Date.now();

    // ── Step 1: FAQ (0 API calls) ──
    const faqResponse = this.matchFAQ(message);
    if (faqResponse) {
      this.logger.log(`[FAQ HIT] "${message.substring(0, 50)}"`);
      await this.storeConversation(sessionId, userId, message, faqResponse, startTime, false);
      return { response: faqResponse, source: 'faq' };
    }

    // ── Step 2: Cache (0 API calls) ──
    // Skip cache for booking-intent messages to avoid stale booking responses
    const isBookingIntent = /(đặt lịch|\bbook\b|cắt tóc|dịch vụ|thợ|barber|xác nhận|\bok\b|\byes\b|được|đúng|rồi)/i.test(message);
    if (!isBookingIntent) {
      const cachedResponse = this.getCachedResponse(message);
      if (cachedResponse) {
        await this.storeConversation(sessionId, userId, message, cachedResponse, startTime, false);
        return { response: cachedResponse, source: 'cache' };
      }
    }

    try {
      this.logger.log(`[Chat] session=${sessionId} msg="${message.substring(0, 60)}"`);

      // ── Step 3: Call AI (Groq First, then Gemini) ──
      const useGroq = !!this.groq && this.configService.get('AI_PROVIDER') !== 'GEMINI';
      
      if (useGroq) {
        try {
          const result = await this.chatWithGroq(message, sessionId, userId, startTime);
          return { ...result, source: 'groq' };
        } catch (error: any) {
          this.logger.error(`[Groq FAIL] All models exhausted... Error: ${error.message}`);
          throw error; // Ném lỗi để return errorMessage thay vì gọi Gemini
        }
      }

      // ── Gemini Fallback (Tạm tắt theo yêu cầu) ──
      return await this.chatWithGemini(message, sessionId, userId, startTime);

    } catch (error: any) {
      const errMsg = error?.message || 'Unknown';
      this.logger.error(`[Chat FAIL] session=${sessionId} error=${errMsg}`);

      let errorMessage: string;
      if (errMsg === 'TIMEOUT') {
        errorMessage = "Xin lỗi, em đang xử lý hơi chậm. Anh thử gửi lại nhé! ⏱️";
      } else if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota')) {
        errorMessage = "⏳ Hệ thống AI đang quá tải. Anh vui lòng thử lại sau 1 phút nhé!";
      } else {
        errorMessage = `Xin lỗi, em gặp sự cố. Anh thử lại sau nhé! 🙏`;
      }

      return { response: errorMessage, error: true };
    }
  }

  // ═══ Groq Implementation ═══
  private async chatWithGroq(message: string, sessionId: string, userId: string | undefined, startTime: number) {
    let conversation = await this.prisma.chatConversation.findUnique({
      where: { sessionId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 6 } },
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
          status: 'PENDING', customerName: null, phone: null,
          serviceId: null, barberId: null, date: null, time: null,
        }
      });
    }

    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    const sysInstruction = systemPrompt(now.format('dddd, DD/MM/YYYY HH:mm'), salonKnowledge, bookingRequest);

    const messages: any[] = [
      { role: 'system', content: sysInstruction },
      ...conversation.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message }
    ];

    await this.prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: message },
    });

    let bookingCreated = false;
    let toolCallsLog: any[] = [];
    let finalResponse = '';

    const groqModels = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant'
    ];

    let lastError: any;
    let isSuccess = false;

    for (const modelName of groqModels) {
      try {
        this.logger.log(`[Groq] Trying model: ${modelName}`);
        let localMessages = [...messages];
        bookingCreated = false;
        toolCallsLog = [];
        const loopDeadline = Date.now() + 30_000; // 30s hard cap
        
        while (true) {
          if (Date.now() > loopDeadline) {
            throw new Error('TIMEOUT');
          }

          const completion = await Promise.race([
            this.groq.chat.completions.create({
              model: modelName,
              messages: localMessages,
              tools: GROQ_TOOLS as any,
              tool_choice: 'auto',
              max_tokens: 1024,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('TIMEOUT')), 25_000)
            ),
          ]);

          const responseMessage = completion.choices[0].message;
          localMessages.push(responseMessage);

          let extractedToolCalls: any[] = [];
          
          if (responseMessage.tool_calls) {
            for (const toolCall of responseMessage.tool_calls) {
              extractedToolCalls.push({
                id: toolCall.id,
                name: toolCall.function.name,
                args: toolCall.function.arguments || '{}',
              });
            }
          }

          if (responseMessage.content) {
            const regex1 = /<function[:\s\/](?:name=")?([^>"]+)"?>([\s\S]*?)<\/function(?::\1)?>/gi;
            const regex2 = /<function[:\s\/](?:name=")?([^>"]+)"?>([\s\S]*?)<\/function>/gi;
            let match;
            while ((match = regex1.exec(responseMessage.content)) !== null) {
              extractedToolCalls.push({ name: match[1].trim(), args: match[2].trim() || '{}', id: `call_${Date.now()}_${Math.random()}` });
            }
            if (extractedToolCalls.length === 0) {
              while ((match = regex2.exec(responseMessage.content)) !== null) {
                extractedToolCalls.push({ name: match[1].trim(), args: match[2].trim() || '{}', id: `call_${Date.now()}_${Math.random()}` });
              }
            }
          }

          if (extractedToolCalls.length > 0) {
            for (const toolCall of extractedToolCalls) {
              const functionName = toolCall.name;
              let functionArgs = {};
              try {
                functionArgs = JSON.parse(toolCall.args);
              } catch (e) {
                this.logger.warn(`Could not parse JSON args for ${functionName}: ${toolCall.args}`);
              }
              
              const toolResult = await this.toolsService.handleToolCall(functionName, functionArgs, sessionId);
              if ((toolResult as any).isBooking) bookingCreated = true;
              
              toolCallsLog.push({ name: functionName, args: functionArgs, output: toolResult.content });
              
              localMessages.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: functionName,
                content: toolResult.content,
              });
            }
            continue;
          }

          finalResponse = responseMessage.content || '';
          finalResponse = finalResponse.replace(/<function[^>]*>[\s\S]*?<\/function(?::[^>]+)?>/gi, '').trim();
          isSuccess = true;
          break; // Thoát khỏi vòng lặp tool
        }
      } catch (error: any) {
        const errStatus = error?.status || error?.response?.status;
        if (!lastError || errStatus === 429 || lastError?.status !== 429) {
          lastError = error;
        }
        this.logger.warn(`[Groq Error] model=${modelName} status=${errStatus} msg=${error.message.substring(0, 150)}`);
      }

      if (isSuccess) break; // Thoát khỏi vòng lặp model nếu đã thành công
    }

    if (!isSuccess) {
      throw lastError; // Ném lỗi cuối cùng ra nếu tất cả model đều fail
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

  // ═══ Gemini Implementation ═══
  private async chatWithGemini(message: string, sessionId: string, userId: string | undefined, startTime: number) {
    let conversation = await this.prisma.chatConversation.findUnique({
      where: { sessionId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 6 } },
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
          status: 'PENDING', customerName: null, phone: null,
          serviceId: null, barberId: null, date: null, time: null,
        }
      });
    }

    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    const sysInstruction = systemPrompt(now.format('dddd, DD/MM/YYYY HH:mm'), salonKnowledge, bookingRequest);

    const history = [
      { role: 'user', parts: [{ text: sysInstruction }] },
      { role: 'model', parts: [{ text: "Tôi là trợ lý ảo của Reetro Barber Shop, rất vui được hỗ trợ bạn!" }] },
      ...conversation.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    ];

    await this.prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: message },
    });

    const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms));
    let responseText = '';
    let bookingCreated = false;
    let toolCallsLog: any[] = [];

    let currentResult: any = await this.callWithRetry(
      (model) => {
        const chatSession = model.startChat({ history });
        return Promise.race([chatSession.sendMessage(message), timeout(20000)]) as Promise<any>;
      },
    );

    // Tool-calling loop
    while (true) {
      const calls = currentResult.response.functionCalls();
      if (!calls || calls.length === 0) {
        responseText = currentResult.response.text();
        break;
      }

      const toolResponses: any[] = [];
      for (const call of calls) {
        const result = await this.toolsService.handleToolCall(call.name, call.args, sessionId);
        if ((result as any).isBooking) bookingCreated = true;

        toolCallsLog.push({ name: call.name, args: call.args, output: result.content });
        toolResponses.push({
          functionResponse: { name: call.name, response: { content: result.content } },
        });
      }

      const activeModel = this.getModel();
      const continueSession = activeModel.startChat({
        history: [
          ...history,
          { role: 'user', parts: [{ text: message }] },
          { role: 'model', parts: currentResult.response.candidates[0].content.parts },
        ],
      });

      currentResult = await Promise.race([
        continueSession.sendMessage(toolResponses),
        timeout(20000),
      ]);
    }

    this.setCachedResponse(message, responseText);
    await this.prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: 'assistant', content: responseText },
    });
    await this.prisma.aiLog.create({
      data: {
        sessionId, userMessage: message, aiResponse: responseText,
        toolCalls: toolCallsLog as any, bookingCreated, latency: Date.now() - startTime,
      },
    });

    return { response: responseText, source: 'gemini' };
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
}
