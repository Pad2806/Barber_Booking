import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../database/prisma.service';
import { ServicesService } from '../services/services.service';
import { StaffService } from '../staff/staff.service';
import { BookingsService } from '../bookings/bookings.service';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { systemPrompt } from './prompts/system-prompt';
import * as salonKnowledge from './data/salon_knowledge.json';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AIChatService implements OnModuleInit {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private readonly logger = new Logger(AIChatService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private servicesService: ServicesService,
    private staffService: StaffService,
    private bookingsService: BookingsService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async onModuleInit() {
    this.initializeModel('gemini-1.5-flash-latest');
    await this.checkGeminiConnection();
  }

  private initializeModel(modelName: string) {
    try {
      this.logger.log(`Initializing Gemini model: ${modelName}`);
      this.model = this.genAI.getGenerativeModel({
        model: modelName,
        tools: [
          {
            functionDeclarations: [
              {
                name: 'get_services',
                description: 'Lấy danh sách các dịch vụ cắt tóc và làm đẹp của salon.',
              },
              {
                name: 'get_barbers',
                description: 'Lấy danh sách các thợ cắt tóc (barber) đang làm việc.',
              },
              {
                name: 'get_available_slots',
                description: 'Kiểm tra các khung giờ còn trống (HH:mm) của một thợ cắt tóc vào một ngày cụ thể.',
                parameters: {
                  type: 'object',
                  properties: {
                    barber_id: { type: 'string', description: 'ID của thợ cắt tóc' },
                    date: { type: 'string', description: 'Ngày cần kiểm tra (YYYY-MM-DD)' },
                  },
                  required: ['barber_id', 'date'],
                },
              },
              {
                name: 'create_booking',
                description: 'Tạo một lịch hẹn đặt chỗ mới.',
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
                  required: ['customer_name', 'phone', 'service_id', 'barber_id', 'date', 'time'],
                },
              },
              {
                name: 'cancel_booking',
                description: 'Hủy một lịch hẹn đã đặt dựa trên mã booking.',
                parameters: {
                  type: 'object',
                  properties: {
                    booking_id: { type: 'string', description: 'Mã đặt lịch (booking code hoặc ID)' },
                  },
                  required: ['booking_id'],
                },
              },
            ],
          },
        ] as any,
      });
    } catch (error) {
      this.logger.error(`Failed to initialize model ${modelName}`, error);
      if (modelName !== 'gemini-1.5-pro-latest') {
        this.initializeModel('gemini-1.5-pro-latest');
      }
    }
  }

  private async checkGeminiConnection() {
    try {
      const result = await this.model.generateContent('ping');
      if (result) {
        this.logger.log('✅ Gemini connection OK');
      }
    } catch (error: any) {
      this.logger.error('❌ Gemini connection failed', error.message);
      // Fallback check
      if (this.model.model === 'gemini-1.5-flash-latest') {
        this.logger.log('🔄 Attempting fallback to gemini-1.5-pro-latest');
        this.initializeModel('gemini-1.5-pro-latest');
        await this.checkGeminiConnection();
      }
    }
  }

  async chat(message: string, sessionId: string, userId?: string) {
    const startTime = Date.now();
    let bookingCreated = false;
    let toolCallsLog = [];

    // 1. Quản lý hội thoại
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

    // 2. Setup AI
    const now = dayjs().tz('Asia/Ho_Chi_Minh');
    const prompt = systemPrompt(now.format('dddd, DD/MM/YYYY HH:mm'), salonKnowledge);

    const chatSession = this.model.startChat({
      history: [
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'model', parts: [{ text: "Tôi là trợ lý Reetro, tôi đã sẵn sàng!" }] },
        ...conversation.messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        })),
      ],
    });

    // 3. Xử lý tin nhắn
    try {
      this.logger.log(`AI Request (Session: ${sessionId}): ${message}`);

      // Save user message
      await this.prisma.chatMessage.create({
        data: { conversationId: conversation.id, role: 'user', content: message },
      });

      let result = await chatSession.sendMessage(message);
      let responseText = result.response.text();

      // 4. Loop xử lý Function Calling (hỗ trợ nhiều call cùng lúc)
      let calls = result.response.functionCalls();
      while (calls && calls.length > 0) {
        const toolOutputs = [];
        for (const call of calls) {
          const { output, isBooking } = await this.handleFunctionCall(call, sessionId);
          if (isBooking) bookingCreated = true;
          
          toolCallsLog.push({ name: call.name, args: call.args, output });
          
          toolOutputs.push({
            functionResponse: { name: call.name, response: { content: output } },
          });
        }

        const nextStep = await chatSession.sendMessage(toolOutputs as any);
        responseText = nextStep.response.text();
        calls = nextStep.response.functionCalls();
      }

      this.logger.log(`AI Response (Session: ${sessionId}): ${responseText.substring(0, 100)}...`);

      // 5. Lưu phản hồi và Log
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

      return { response: responseText };
    } catch (error: any) {
      this.logger.error(`AI CHAT ERROR (Session: ${sessionId}):`, error.stack || error.message);
      
      return { 
        response: "Xin lỗi, hệ thống AI đang tạm thời gặp lỗi. Vui lòng thử lại sau.",
        error: true 
      };
    }
  }

  private async handleFunctionCall(call: any, sessionId: string) {
    const { name, args } = call;
    let isBooking = false;

    try {
      switch (name) {
        case 'get_services':
          const services = await this.servicesService.findAll({} as any);
          return { output: services.data.map(s => `ID: ${s.id}, Name: ${s.name}, Price: ${s.price}đ`).join('\n') };

        case 'get_barbers':
          const barbers = await this.staffService.findAll({} as any);
          return { output: barbers.data.map(b => `ID: ${b.id}, Name: ${b.user.name}, Rating: ${b.rating}`).join('\n') };

        case 'get_available_slots':
          const slots = await this.staffService.getAvailableSlots(args.barber_id, args.date);
          return { output: slots.length > 0 ? `Các giờ còn trống: ${slots.join(', ')}` : "Ngày này đã hết chỗ." };

        case 'create_booking':
          // Cập nhật booking_requests table để track
          await this.prisma.bookingRequest.upsert({
            where: { sessionId: sessionId } as any,
            update: { ...args },
            create: { sessionId, ...args },
          });

          // Thực hiện đặt lịch thật
          // Lấy thông tin thợ kèm theo thông tin User
          const barber = await this.prisma.staff.findUnique({
            where: { id: args.barber_id },
            include: { user: true }
          });
          
          if (!barber) {
             throw new Error('Không tìm thấy thợ cắt tóc này.');
          }

          const booking = await this.bookingsService.create({
            salonId: barber.salonId,
            staffId: args.barber_id,
            date: args.date,
            timeSlot: args.time,
            serviceIds: [args.service_id],
            customerName: args.customer_name,
            customerPhone: args.phone,
            note: 'AI Chatbot Booking',
          } as any, { role: 'CUSTOMER' } as any);

          isBooking = true;
          return { 
            output: `THÀNH CÔNG! Mã đặt lịch: ${booking.bookingCode}. Khách: ${args.customer_name}, Dịch vụ ID: ${args.service_id}, Thợ: ${barber.user?.name || 'N/A'}, Lúc: ${args.time} ngày ${args.date}.`,
            isBooking: true 
          };

        case 'cancel_booking':
          await this.bookingsService.cancel(args.booking_id, 'Hủy qua AI Chatbot', { role: 'CUSTOMER' } as any);
          return { output: `Đã hủy lịch hẹn ${args.booking_id} thành công.` };

        default:
          return { output: 'Công cụ không hỗ trợ.' };
      }
    } catch (error) {
      return { output: `Lỗi: ${error.message}` };
    }
  }
}
