import { Injectable, Logger } from '@nestjs/common';
import { ServicesService } from '../services/services.service';
import { StaffService } from '../staff/staff.service';
import { PrismaService } from '../database/prisma.service';
import * as crypto from 'crypto';
import dayjs from 'dayjs';

// ═══ Booking State Machine — Required Fields ═══
const BOOKING_FIELDS = ['salonId', 'serviceId', 'barberId', 'date', 'time', 'customerName', 'phone'] as const;
type BookingField = typeof BOOKING_FIELDS[number];

const FIELD_LABELS: Record<BookingField, string> = {
  salonId: 'cơ sở',
  serviceId: 'dịch vụ',
  barberId: 'thợ cắt tóc',
  date: 'ngày',
  time: 'giờ',
  customerName: 'tên',
  phone: 'số điện thoại',
};

const BOOKING_STEPS: BookingField[] = ['salonId', 'serviceId', 'barberId', 'date', 'time', 'customerName', 'phone'];

interface BookingProgress {
  filled: Record<string, string>;
  missing: string[];
  nextField: BookingField | null;
  isComplete: boolean;
  currentStep: string;
}

@Injectable()
export class AIToolsService {
  private readonly logger = new Logger(AIToolsService.name);

  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
    private staffService: StaffService,
  ) { }

  // ═══ State Machine: Compute Booking Progress ═══
  private getBookingProgress(state: any): BookingProgress {
    const filled: Record<string, string> = {};
    const missing: string[] = [];

    for (const field of BOOKING_FIELDS) {
      if (state[field]) {
        filled[field] = state[field];
      } else {
        missing.push(field);
      }
    }

    const nextField = missing.length > 0 ? (missing[0] as BookingField) : null;

    const stepMap: Record<BookingField, string> = {
      salonId: 'SELECT_SALON',
      serviceId: 'SELECT_SERVICE',
      barberId: 'SELECT_STAFF',
      date: 'SELECT_DATE',
      time: 'SELECT_TIME',
      customerName: 'COLLECT_NAME',
      phone: 'COLLECT_PHONE',
    };

    const currentStep = nextField ? stepMap[nextField] : 'READY_TO_BOOK';

    return {
      filled,
      missing,
      nextField,
      isComplete: missing.length === 0,
      currentStep,
    };
  }

  // ═══ State Machine: Format Structured Response for update_booking_state ═══
  private formatStateResponse(state: any): { content: string } {
    const progress = this.getBookingProgress(state);

    const response: Record<string, any> = {
      success: true,
      booking_complete: progress.isComplete,
      current_step: progress.currentStep,
      filled_fields: progress.filled,
      missing_fields: progress.missing.map(f => FIELD_LABELS[f as BookingField]),
    };

    if (progress.isComplete) {
      response.next_action = 'Tóm tắt thông tin và hỏi khách xác nhận. Nếu đồng ý → gọi create_booking.';
      response.message = 'Đã đủ thông tin. Hãy tóm tắt và hỏi khách xác nhận.';
    } else if (progress.nextField) {
      response.next_required_field = progress.nextField;
      response.need_user_input = true;

      const promptMap: Record<BookingField, string> = {
        salonId: 'Hãy gọi get_salons để lấy danh sách cơ sở, sau đó hiển thị và hỏi khách chọn.',
        serviceId: 'Hãy gọi get_services để lấy danh sách dịch vụ, sau đó hiển thị và hỏi khách chọn.',
        barberId: 'Hãy gọi get_barbers để lấy danh sách thợ, sau đó hiển thị và hỏi khách chọn.',
        date: 'Hãy hỏi khách muốn đặt lịch vào ngày nào.',
        time: 'Hãy gọi get_available_slots để kiểm tra khung giờ trống, sau đó hiển thị và hỏi khách chọn.',
        customerName: 'Hãy hỏi tên khách hàng.',
        phone: 'Hãy hỏi số điện thoại khách hàng.',
      };

      response.message = promptMap[progress.nextField];
    }

    return { content: JSON.stringify(response) };
  }

  // ═══ Update Booking State — Core State Machine ═══
  async updateBookingState(sessionId: string, data: {
    customer_name?: string;
    phone?: string;
    service_id?: string;
    barber_id?: string;
    salon_id?: string;
    date?: string;
    time?: string;
  }) {
    this.logger.log(`[State] Updating session ${sessionId}: ${JSON.stringify(data)}`);

    const prismaData: any = {};
    if (data.customer_name) prismaData.customerName = data.customer_name;
    if (data.phone) prismaData.phone = data.phone;
    if (data.service_id) prismaData.serviceId = data.service_id;
    if (data.barber_id) prismaData.barberId = data.barber_id;
    if (data.salon_id) prismaData.salonId = data.salon_id;
    if (data.date) prismaData.date = data.date;
    if (data.time) prismaData.time = data.time;

    // No actual data to update → reject empty calls
    if (Object.keys(prismaData).length === 0) {
      this.logger.warn(`[State] Empty update rejected for session ${sessionId}`);
      const existing = await (this.prisma.bookingRequest as any).findUnique({ where: { sessionId } });
      return this.formatStateResponse(existing || {});
    }

    const updated = await (this.prisma.bookingRequest as any).upsert({
      where: { sessionId },
      create: { sessionId, ...prismaData },
      update: prismaData,
    });

    return this.formatStateResponse(updated);
  }

  // ═══ Main Tool Router ═══
  async handleToolCall(name: string, args: any, sessionId: string) {
    this.logger.log(`[Tool] ${name} args=${JSON.stringify(args)}`);

    try {
      switch (name) {
        case 'get_salons':
          return await this.handleGetSalons(sessionId);

        case 'get_services':
          return await this.handleGetServices(args, sessionId);

        case 'get_barbers':
          return await this.handleGetBarbers(args, sessionId);

        case 'get_available_slots':
          return this.handleGetAvailableSlots(args);

        case 'update_booking_state':
          return await this.handleUpdateBookingState(args, sessionId);

        case 'cancel_booking':
          return await this.handleCancelBooking(args);

        case 'create_booking':
          return await this.handleCreateBooking(args, sessionId);

        default:
          return { content: JSON.stringify({ error: true, message: 'Tool không được hỗ trợ.' }) };
      }
    } catch (error: any) {
      this.logger.error(`[Tool Error] ${name}: ${error.message}`);
      return { content: JSON.stringify({ error: true, message: `Lỗi: ${error.message}` }) };
    }
  }

  // ═══ Tool: get_salons ═══
  private async handleGetSalons(sessionId: string) {
    const salons = await this.prisma.salon.findMany({
      where: { isActive: true },
      select: { id: true, name: true, address: true, city: true, district: true, phone: true },
      orderBy: { name: 'asc' },
    });

    if (salons.length === 0) {
      return { content: 'Hiện tại chưa có cơ sở nào đang hoạt động.' };
    }

    // Auto-select if only one salon
    if (salons.length === 1) {
      const s = salons[0];
      await this.updateBookingState(sessionId, { salon_id: s.id });
      const addr = [s.address, s.district, s.city].filter(Boolean).join(', ');
      return { content: `Cơ sở duy nhất: ID: ${s.id} | Tên: ${s.name} | Địa chỉ: ${addr}. Đã tự động chọn cơ sở này.` };
    }

    const list = salons
      .map((s, i) => {
        const addr = [s.address, s.district, s.city].filter(Boolean).join(', ');
        return `${i + 1}. ID: ${s.id} | Tên: ${s.name} | Địa chỉ: ${addr || 'Chưa cập nhật'} | SĐT: ${s.phone || 'N/A'}`;
      })
      .join('\n');

    return { content: `Danh sách cơ sở Reetro Barber:\n${list}\n\n⚠️ HIỂN THỊ danh sách này cho khách và HỎI khách chọn. DỪNG lại chờ khách trả lời.` };
  }

  // ═══ Tool: get_services ═══
  private async handleGetServices(args: any, sessionId: string) {
    const session = await (this.prisma.bookingRequest as any).findUnique({ where: { sessionId } });
    let salonId = args.salon_id || session?.salonId;
    salonId = await this.resolveSalonId(salonId, sessionId);

    let services: any[];
    if (salonId) {
      services = await this.prisma.service.findMany({
        where: { salonId, isActive: true },
        select: { id: true, name: true, price: true, duration: true },
        orderBy: { order: 'asc' },
      });
    } else {
      const result = await this.servicesService.findAll({ limit: 50 } as any);
      services = result.data;
    }

    if (services.length === 0) {
      return { content: 'Cơ sở này chưa có dịch vụ nào được kích hoạt.' };
    }

    return {
      content: services
        .map((s: any) => `ID: ${s.id}, Tên: ${s.name}, Giá: ${s.price}đ, Thời gian: ${s.duration} phút`)
        .join('\n') + '\n\n⚠️ HIỂN THỊ danh sách này cho khách và HỎI khách chọn dịch vụ. DỪNG lại chờ khách trả lời.',
    };
  }

  // ═══ Tool: get_barbers ═══
  private async handleGetBarbers(args: any, sessionId: string) {
    const session = await (this.prisma.bookingRequest as any).findUnique({ where: { sessionId } });
    let salonId = args.salon_id || session?.salonId;
    salonId = await this.resolveSalonId(salonId, sessionId);

    const BARBER_POSITIONS = ['BARBER', 'STYLIST', 'SENIOR_STYLIST', 'MASTER_STYLIST'];
    const where: any = { isActive: true, position: { in: BARBER_POSITIONS } };
    if (salonId) where.salonId = salonId;

    const barbers = await this.prisma.staff.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { rating: 'desc' },
    });

    if (barbers.length === 0) {
      return {
        content: salonId
          ? 'Cơ sở này hiện chưa có thợ cắt tóc nào. Anh vui lòng chọn cơ sở khác hoặc thử lại sau nhé!'
          : 'Hiện chưa có thợ cắt tóc nào trong hệ thống.',
      };
    }

    return {
      content: barbers
        .map(b => `ID: ${b.id}, Tên: ${b.user.name}, Đánh giá: ${b.rating} sao`)
        .join('\n') + '\n\n⚠️ HIỂN THỊ danh sách này cho khách và HỎI khách chọn thợ. DỪNG lại chờ khách trả lời.',
    };
  }

  // ═══ Tool: get_available_slots ═══
  private async handleGetAvailableSlots(args: any) {
    if (!args.barber_id || !args.date) {
      return { content: JSON.stringify({ error: true, message: 'Thiếu barber_id hoặc date.' }) };
    }
    const slots = await this.staffService.getAvailableSlots(args.barber_id, args.date);
    return {
      content: slots.length > 0
        ? `Các khung giờ còn trống ngày ${args.date}: ${slots.join(', ')}\n\n⚠️ HIỂN THỊ các khung giờ cho khách và HỎI khách chọn. DỪNG lại chờ khách trả lời.`
        : `Rất tiếc, ngày ${args.date} hiện đã hết chỗ trống cho thợ này. Anh chọn ngày khác nhé!`,
    };
  }

  // ═══ Tool: update_booking_state — Structured State Machine Response ═══
  private async handleUpdateBookingState(args: any, sessionId: string) {
    if (args.salon_id) {
      args.salon_id = await this.resolveSalonId(args.salon_id, sessionId);
    }

    const result = await this.updateBookingState(sessionId, args);
    return result;
  }

  // ═══ Tool: cancel_booking ═══
  private async handleCancelBooking(args: any) {
    if (!args.booking_id) {
      return { content: JSON.stringify({ error: true, message: 'Thiếu booking_id.' }) };
    }
    await (this.prisma.booking as any).update({
      where: { id: args.booking_id },
      data: { status: 'CANCELLED', cancelReason: 'Hủy qua Trợ lý AI', cancelledAt: new Date() },
    });
    return { content: `Đã hủy lịch hẹn ${args.booking_id} thành công.` };
  }

  // ═══ Resolve salon selection to UUID ═══
  private async resolveSalonId(
    value: string | null | undefined,
    sessionId: string,
  ): Promise<string | null | undefined> {
    if (!value) return value;
    const str = value.toString().trim();

    // Case 1: Already a UUID
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
      return str;
    }

    // Case 2: Number or Vietnamese ordinal
    const numMatch = str.match(/(?:thứ|số|cơ\s*sở|chi\s*nhánh)?\s*(\d+)$/i) || str.match(/^(\d+)$/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0) {
        const salons = await this.prisma.salon.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        });
        if (salons[idx]) {
          const resolvedId = salons[idx].id;
          this.logger.log(`[Resolve] "${str}" → salon UUID: ${resolvedId} (${salons[idx].name})`);
          await this.updateBookingState(sessionId, { salon_id: resolvedId });
          return resolvedId;
        }
        this.logger.warn(`[Resolve] "${str}" out of range`);
      }
    }

    // Case 3: Name-based match
    const salonByName = await this.prisma.salon.findFirst({
      where: { isActive: true, name: { contains: str, mode: 'insensitive' } },
      select: { id: true, name: true },
    });
    if (salonByName) {
      this.logger.log(`[Resolve] Name "${str}" → UUID: ${salonByName.id} (${salonByName.name})`);
      await this.updateBookingState(sessionId, { salon_id: salonByName.id });
      return salonByName.id;
    }

    return str;
  }

  // ═══ Tool: create_booking ═══
  private async handleCreateBooking(args: any, sessionId: string) {
    const required = ['customer_name', 'phone', 'service_id', 'barber_id', 'date', 'time'];
    for (const field of required) {
      if (!args[field]) return { content: `Lỗi: Thiếu thông tin ${field}.` };
    }

    const barber = await this.prisma.staff.findUnique({
      where: { id: args.barber_id },
      include: { user: true },
    });
    if (!barber) return { content: 'Lỗi: Không tìm thấy thợ cắt tóc này.' };

    // Cross-branch service resolution + name-based fallback
    let finalServiceId: string = args.service_id;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalServiceId);
    let svc: any = null;

    if (isUUID) {
      svc = await this.prisma.service.findFirst({
        where: { id: finalServiceId, salonId: barber.salonId },
      });
      if (!svc) {
        const originalSvc = await this.prisma.service.findUnique({ where: { id: finalServiceId } });
        if (originalSvc) {
          svc = await this.prisma.service.findFirst({
            where: { salonId: barber.salonId, name: { contains: originalSvc.name, mode: 'insensitive' }, isActive: true },
          });
        }
      }
    } else {
      svc = await this.prisma.service.findFirst({
        where: { salonId: barber.salonId, name: { contains: finalServiceId, mode: 'insensitive' }, isActive: true },
      });
    }

    if (!svc) {
      return { content: `Lỗi: Dịch vụ bạn chọn không có sẵn tại chi nhánh của thợ ${barber.user.name}.` };
    }

    finalServiceId = svc.id;

    const totalDuration: number = svc.duration;
    const totalAmount: number = Number(svc.price);
    const [h, m] = args.time.split(':').map(Number);
    const endMinutes = h * 60 + m + totalDuration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
    const bookingCode = `RB${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().split('-')[0].toUpperCase()}`.substring(0, 12);
    const dateObj = new Date(args.date + 'T00:00:00.000Z');

    const booking = await (this.prisma.booking as any).create({
      data: {
        bookingCode,
        customerName: args.customer_name,
        customerPhone: args.phone,
        salonId: barber.salonId,
        staffId: args.barber_id,
        date: dateObj,
        timeSlot: args.time,
        endTime,
        totalDuration,
        totalAmount,
        note: 'Đặt lịch qua Trợ lý AI',
        services: {
          create: [{ serviceId: finalServiceId, price: svc.price, duration: svc.duration }],
        },
      },
    });

    await (this.prisma.bookingRequest as any).update({
      where: { sessionId },
      data: { status: 'COMPLETED' },
    }).catch(() => null);

    return {
      content: `ĐẶT LỊCH THÀNH CÔNG! Mã đặt lịch: **${booking.bookingCode}**. Khách hàng: ${args.customer_name} (${args.phone}), Thợ: ${barber.user.name}, Dịch vụ: ${svc.name}, Lúc: ${args.time} ngày ${dayjs(dateObj).format('DD/MM/YYYY')}.`,
      isBooking: true,
    };
  }
}
