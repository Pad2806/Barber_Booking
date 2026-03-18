import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../database/prisma.service';
import { AIToolsService } from './ai-tools.service';
import { systemPrompt } from './prompts/system.prompt';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import * as salonKnowledge from './data/salon_knowledge.json';

dayjs.extend(utc);
dayjs.extend(timezone);

// ═══ FAQ Router ═══
// Maps common keywords to instant responses (no API call needed)
const FAQ_PATTERNS: { keywords: string[]; response: string }[] = [
  {
    keywords: ['giờ mở cửa', 'mấy giờ mở', 'mấy giờ đóng', 'mở cửa lúc', 'đóng cửa'],
    response: `🕐 **Giờ hoạt động của Reetro Barber:**\n\n• Thứ 2 - Thứ 7: 8:00 - 20:00\n• Chủ nhật: 9:00 - 18:00\n\nAnh muốn đặt lịch không ạ? Em hỗ trợ ngay! ✂️`,
  },
  {
    keywords: ['ở đâu', 'địa chỉ', 'chỗ nào', 'đường nào'],
    response: `📍 **Địa chỉ Reetro Barber:**\n\nAnh có thể xem danh sách các chi nhánh trên trang Hệ thống Salon nhé!\n\nAnh cần đặt lịch tại chi nhánh nào ạ? 😊`,
  },
  {
    keywords: ['giá', 'bao nhiêu', 'phí', 'cost', 'price', 'bảng giá'],
    response: `💰 **Bảng giá dịch vụ Reetro Barber:**\n\nEm có thể tra cứu giá chính xác cho anh! Anh muốn hỏi về dịch vụ nào ạ?\n\n• Cắt tóc\n• Gội đầu\n• Nhuộm tóc\n• Combo\n\nHoặc anh gõ "xem dịch vụ" để em liệt kê tất cả nhé! ✂️`,
  },
  {
    keywords: ['hủy lịch', 'hủy đặt', 'cancel', 'bỏ lịch'],
    response: `❌ **Hủy lịch hẹn:**\n\nAnh có thể hủy lịch hẹn tại mục **"Lịch hẹn của tôi"** trên trang web.\n\n⚠️ Lưu ý: Vui lòng hủy trước **2 giờ** so với giờ hẹn để nhường chỗ cho khách khác nhé!\n\nAnh cần em hỗ trợ gì thêm không ạ? 😊`,
  },
  {
    keywords: ['cảm ơn', 'thank', 'thanks', 'ok ạ', 'ok em'],
    response: `Dạ không có gì ạ! 😊 Reetro Barber luôn sẵn sàng phục vụ anh.\n\nNếu cần gì thêm, cứ nhắn em nhé! ✂️💈`,
  },
  {
    keywords: ['xin chào', 'hello', 'hi', 'hey', 'chào'],
    response: `Chào anh! 👋 Em là trợ lý ảo của **Reetro Barber**.\n\nEm có thể giúp anh:\n• 📋 Xem dịch vụ & giá\n• 👨‍🦱 Chọn thợ yêu thích\n• 📅 Đặt lịch nhanh\n• ❓ Giải đáp thắc mắc\n\nAnh cần gì ạ? 😊`,
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
  private genAI: GoogleGenerativeAI;
  private model: any;
  private readonly logger = new Logger(AIAssistantService.name);
  private responseCache = new Map<string, CachedResponse>();

  // Rate limit tracking
  private requestTimestamps: number[] = [];
  private readonly MAX_RPM = 14; // Stay under 15 RPM free tier limit

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private toolsService: AIToolsService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async onModuleInit() {
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools: [
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
      ] as any,
    });

    try {
      await this.model.generateContent('ping');
      this.logger.log('✅ Gemini-2.0-Flash Assistant initialized successfully');
    } catch (error: any) {
      this.logger.error('❌ Gemini-2.0-Flash connection failed:', error.message);
    }

    // Clean cache every 10 min
    setInterval(() => this.cleanCache(), 10 * 60 * 1000);
  }

  // ═══ FAQ Router: Check if message matches a pre-built FAQ ═══
  private matchFAQ(message: string): string | null {
    const normalized = message.toLowerCase().trim();
    for (const faq of FAQ_PATTERNS) {
      if (faq.keywords.some(kw => normalized.includes(kw))) {
        return faq.response;
      }
    }
    return null;
  }

  // ═══ Cache: hash-based lookup ═══
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

  // ═══ Rate Limiter: Track requests per minute ═══
  private canMakeRequest(): boolean {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(t => now - t < 60_000);
    return this.requestTimestamps.length < this.MAX_RPM;
  }

  private recordRequest() {
    this.requestTimestamps.push(Date.now());
  }

  // ═══ Retry with Exponential Backoff ═══
  private async callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait for rate limit window if needed
        if (!this.canMakeRequest()) {
          const waitMs = Math.min(2000 * Math.pow(2, attempt), 8000);
          this.logger.warn(`[Rate Limit] Waiting ${waitMs}ms before retry (attempt ${attempt + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, waitMs));

          if (!this.canMakeRequest()) continue;
        }

        this.recordRequest();
        return await fn();
      } catch (error: any) {
        lastError = error;
        const status = error?.status || error?.response?.status;

        if (status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000);
          this.logger.warn(`[429 Retry] Attempt ${attempt + 1}/${maxRetries + 1}, backoff ${backoffMs}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        } else {
          throw error; // Non-rate-limit errors should fail fast
        }
      }
    }
    throw lastError;
  }

  // ═══ Main Chat Method ═══
  async chat(message: string, sessionId: string, userId?: string) {
    const startTime = Date.now();
    let bookingCreated = false;
    const toolCallsLog = [];

    // ── Step 1: Check FAQ first (0 API calls) ──
    const faqResponse = this.matchFAQ(message);
    if (faqResponse) {
      this.logger.log(`[FAQ HIT] "${message.substring(0, 50)}"`);

      // Still store the message for conversation history
      let conversation = await this.prisma.chatConversation.findUnique({
        where: { sessionId },
      });
      if (!conversation) {
        conversation = await this.prisma.chatConversation.create({
          data: { sessionId, userId },
        });
      }
      await this.prisma.chatMessage.create({
        data: { conversationId: conversation.id, role: 'user', content: message },
      });
      await this.prisma.chatMessage.create({
        data: { conversationId: conversation.id, role: 'assistant', content: faqResponse },
      });

      await this.prisma.aiLog.create({
        data: {
          sessionId,
          userMessage: message,
          aiResponse: faqResponse,
          toolCalls: [] as any,
          bookingCreated: false,
          latency: Date.now() - startTime,
        },
      });

      return { response: faqResponse, source: 'faq' };
    }

    // ── Step 2: Check Cache (0 API calls) ──
    const cachedResponse = this.getCachedResponse(message);
    if (cachedResponse) {
      let conversation = await this.prisma.chatConversation.findUnique({
        where: { sessionId },
      });
      if (!conversation) {
        conversation = await this.prisma.chatConversation.create({
          data: { sessionId, userId },
        });
      }
      await this.prisma.chatMessage.create({
        data: { conversationId: conversation.id, role: 'user', content: message },
      });
      await this.prisma.chatMessage.create({
        data: { conversationId: conversation.id, role: 'assistant', content: cachedResponse },
      });

      return { response: cachedResponse, source: 'cache' };
    }

    // ── Step 3: Call Gemini with Retry ──
    let conversation = await this.prisma.chatConversation.findUnique({
      where: { sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
    });

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
          status: 'PENDING',
          customerName: null,
          phone: null,
          serviceId: null,
          barberId: null,
          date: null,
          time: null,
        }
      });
    }

    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    const systemInstruction = systemPrompt(now.format('dddd, DD/MM/YYYY HH:mm'), salonKnowledge, bookingRequest);

    const history = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      { role: 'model', parts: [{ text: "Tôi là trợ lý ảo của Reetro Barber Shop, rất vui được hỗ trợ bạn!" }] },
      ...conversation.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      })),
    ];

    const chatSession = this.model.startChat({ history });

    try {
      this.logger.log(`AI Assistant Request [${sessionId}]: ${message}`);

      await this.prisma.chatMessage.create({
        data: { conversationId: conversation.id, role: 'user', content: message },
      });

      const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms));

      let responseText = '';

      // ── Use retry wrapper for Gemini call ──
      let currentResult: any = await this.callWithRetry(
        () => Promise.race([chatSession.sendMessage(message), timeout(15000)]) as Promise<any>,
      );

      // Tool-calling Loop
      while (true) {
        const calls = currentResult.response.functionCalls();
        if (!calls || calls.length === 0) {
          responseText = currentResult.response.text();
          break;
        }

        const toolResponses: any[] = [];
        for (const call of calls) {
          const result = await this.toolsService.handleToolCall(call.name, call.args, sessionId);
          if (result.isBooking) bookingCreated = true;

          toolCallsLog.push({ name: call.name, args: call.args, output: result.content });
          toolResponses.push({
            functionResponse: { name: call.name, response: { content: result.content } },
          });
        }

        currentResult = await this.callWithRetry(
          () => Promise.race([chatSession.sendMessage(toolResponses as any), timeout(15000)]) as Promise<any>,
        );
      }

      this.logger.log(`AI Assistant Response [${sessionId}]: ${responseText.substring(0, 100)}...`);

      // Cache the response
      this.setCachedResponse(message, responseText);

      await this.prisma.chatMessage.create({
        data: { conversationId: conversation.id, role: 'assistant', content: responseText },
      });

      const latency = Date.now() - startTime;
      await this.prisma.aiLog.create({
        data: {
          sessionId,
          userMessage: message,
          aiResponse: responseText,
          toolCalls: toolCallsLog as any,
          bookingCreated,
          latency,
        },
      });

      return { response: responseText, source: 'gemini' };

    } catch (error: any) {
      this.logger.error(`AI Assistant Error [${sessionId}]: ${error.message}`);

      let errorMessage: string;
      if (error.message === 'TIMEOUT') {
        errorMessage = "Xin lỗi, em đang xử lý hơi chậm. Anh thử gửi lại nhé! 🙏";
      } else if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = "Hệ thống đang bận, anh vui lòng thử lại sau 30 giây nhé! ⏳";
      } else {
        errorMessage = "Xin lỗi, em đang gặp sự cố kết nối. Vui lòng thử lại sau.";
      }

      return { response: errorMessage, error: true };
    }
  }
}
