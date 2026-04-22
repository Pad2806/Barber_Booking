import { Injectable, Logger } from '@nestjs/common';
import { ServicesService } from '../services/services.service';
import { StaffService } from '../staff/staff.service';
import { PrismaService } from '../database/prisma.service';
import * as crypto from 'crypto';
import dayjs from 'dayjs';

@Injectable()
export class AIToolsService {
  private readonly logger = new Logger(AIToolsService.name);

  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
    private staffService: StaffService,
  ) {}

  async update_booking_state(sessionId: string, data: {
    customer_name?: string;
    phone?: string;
    service_id?: string;
    barber_id?: string;
    date?: string;
    time?: string;
  }) {
    this.logger.log(`[AIToolsService] Updating booking state for session ${sessionId}: ${JSON.stringify(data)}`);
    const prismaData = {
      customerName: data.customer_name,
      phone: data.phone,
      serviceId: data.service_id,
      barberId: data.barber_id,
      date: data.date,
      time: data.time,
    };
    return await (this.prisma.bookingRequest as any).upsert({
      where: { sessionId },
      create: { sessionId, ...prismaData },
      update: prismaData,
    });
  }

  async handleToolCall(name: string, args: any, sessionId: string) {
    this.logger.log(`Executing tool: ${name} with args: ${JSON.stringify(args)}`);

    try {
      if (name === 'get_services') {
        const result = await this.servicesService.findAll({ limit: 50 } as any);
        return {
          content: result.data
            .map((s: any) => `ID: ${s.id}, Tên: ${s.name}, Giá: ${s.price}đ, Thời gian: ${s.duration} phút`)
            .join('\n'),
        };
      }

      if (name === 'get_barbers') {
        const result = await this.staffService.findAll({} as any);
        return {
          content: result.data
            .map((b: any) => `ID: ${b.id}, Tên: ${b.user.name}, Đánh giá: ${b.rating} sao`)
            .join('\n'),
        };
      }

      if (name === 'get_available_slots') {
        if (!args.barber_id || !args.date) {
          return { content: 'Lỗi: Thiếu thông tin Barber ID hoặc Ngày.' };
        }
        const slots = await this.staffService.getAvailableSlots(args.barber_id, args.date);
        return {
          content:
            slots.length > 0
              ? `Các khung giờ còn trống ngày ${args.date}: ${slots.join(', ')}`
              : `Rất tiếc, ngày ${args.date} hiện đã hết chỗ trống cho thợ này.`,
        };
      }

      if (name === 'update_booking_state') {
        await this.update_booking_state(sessionId, args);
        return { content: 'Đã cập nhật trạng thái đặt lịch thành công.' };
      }

      if (name === 'cancel_booking') {
        if (!args.booking_id) return { content: 'Lỗi: Thiếu mã đặt lịch (Booking ID).' };
        await (this.prisma.booking as any).update({
          where: { id: args.booking_id },
          data: { status: 'CANCELLED', cancelReason: 'Hủy qua Trợ lý AI', cancelledAt: new Date() },
        });
        return { content: `Đã hủy lịch hẹn ${args.booking_id} thành công.` };
      }

      if (name === 'create_booking') {
        return await this.handleCreateBooking(args, sessionId);
      }

      return { content: 'Lỗi: Công cụ không được hỗ trợ.' };
    } catch (error: any) {
      this.logger.error(`Tool error (${name}): ${error.message}`);
      return { content: `Có lỗi xảy ra khi thực hiện tác vụ: ${error.message}` };
    }
  }

  private async handleCreateBooking(args: any, sessionId: string) {
    // Validate required fields
    const required = ['customer_name', 'phone', 'service_id', 'barber_id', 'date', 'time'];
    for (const field of required) {
      if (!args[field]) return { content: `Lỗi: Thiếu thông tin ${field}.` };
    }

    // Validate barber exists
    const barber = await this.prisma.staff.findUnique({
      where: { id: args.barber_id },
      include: { user: true },
    });
    if (!barber) return { content: 'Lỗi: Không tìm thấy thợ cắt tóc này.' };

    // --- Cross-branch service resolution + name-based fallback ---
    let finalServiceId: string = args.service_id;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(finalServiceId);

    let svc: any = null;

    if (isUUID) {
      // Try exact ID match in barber's salon first
      svc = await this.prisma.service.findFirst({
        where: { id: finalServiceId, salonId: barber.salonId },
      });

      // If not found in this salon, resolve by name from original service
      if (!svc) {
        const originalSvc = await this.prisma.service.findUnique({ where: { id: finalServiceId } });
        if (originalSvc) {
          svc = await this.prisma.service.findFirst({
            where: { salonId: barber.salonId, name: { contains: originalSvc.name, mode: 'insensitive' }, isActive: true },
          });
        }
      }
    } else {
      // service_id is a name — find by name in barber's salon
      svc = await this.prisma.service.findFirst({
        where: { salonId: barber.salonId, name: { contains: finalServiceId, mode: 'insensitive' }, isActive: true },
      });
    }

    if (!svc) {
      return { content: `Lỗi: Dịch vụ bạn chọn không có sẵn tại chi nhánh của thợ ${barber.user.name}.` };
    }

    finalServiceId = svc.id;
    // ------------------------------------------------------------

    // Calculate booking totals
    const totalDuration: number = svc.duration;
    const totalAmount: number = Number(svc.price);
    const [h, m] = args.time.split(':').map(Number);
    const endMinutes = h * 60 + m + totalDuration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
    const bookingCode = `RB${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().split('-')[0].toUpperCase()}`.substring(0, 12);
    const dateObj = new Date(args.date + 'T00:00:00.000Z');

    // Direct Prisma create — AI bookings have no authenticated user, customerId=undefined
    const booking = await (this.prisma.booking as any).create({
      data: {
        bookingCode,
        // customerId is intentionally omitted — AI-assisted walk-in booking
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

    // Update booking request status (non-fatal)
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
