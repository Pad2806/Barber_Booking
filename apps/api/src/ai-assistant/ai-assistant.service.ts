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

@Injectable()
export class AIAssistantService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private readonly logger = new Logger(AIAssistantService.name);

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
      model: 'gemini-3-flash-preview',
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
              name: 'cancel_booking',
              description: 'Hủy lịch hẹn.',
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
      this.logger.log('✅ Gemini-3-Flash Assistant initialized successfully');
    } catch (error: any) {
      this.logger.error('❌ Gemini-3-Flash connection failed:', error.message);
    }
  }

  async chat(message: string, sessionId: string, userId?: string) {
    const startTime = Date.now();
    let bookingCreated = false;
    const toolCallsLog = [];

    // 1. Get or create conversation
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

    // 2. Build history
    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    const systemInstruction = systemPrompt(now.format('dddd, DD/MM/YYYY HH:mm'), salonKnowledge);

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

      // Store user message
      await this.prisma.chatMessage.create({
        data: { conversationId: conversation.id, role: 'user', content: message },
      });

      const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms));

      // Tool-calling Loop
      let responseText = '';
      let currentResult: any = await Promise.race([
        chatSession.sendMessage(message),
        timeout(10000)
      ]);

      while (true) {
        const calls = currentResult.response.functionCalls();
        if (!calls || calls.length === 0) {
          responseText = currentResult.response.text();
          break;
        }

        const toolResponses = [];
        for (const call of calls) {
          const result = await this.toolsService.handleToolCall(call.name, call.args, sessionId);
          if (result.isBooking) bookingCreated = true;
          
          toolCallsLog.push({ name: call.name, args: call.args, output: result.content });
          toolResponses.push({
            functionResponse: { name: call.name, response: { content: result.content } },
          });
        }

        currentResult = await Promise.race([
          chatSession.sendMessage(toolResponses as any),
          timeout(10000)
        ]);
      }

      this.logger.log(`AI Assistant Response [${sessionId}]: ${responseText.substring(0, 100)}...`);

      // Store model response
      await this.prisma.chatMessage.create({
        data: { conversationId: conversation.id, role: 'assistant', content: responseText },
      });

      // Log to AiLog table
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

      return { response: responseText };

    } catch (error: any) {
      this.logger.error(`AI Assistant Error [${sessionId}]: ${error.message}`);
      
      const errorMessage = error.message === 'TIMEOUT' 
        ? "Xin lỗi, em đang xử lý hơi chậm một chút. Anh thử gửi lại tin nhắn nhé! 🙏"
        : "Xin lỗi, em đang gặp sự cố kết nối. Vui lòng thử lại sau.";

      return { response: errorMessage, error: true };
    }
  }
}
