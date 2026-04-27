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
  ) { }

  async update_booking_state(sessionId: string, data: {
    customer_name?: string;
    phone?: string;
    service_id?: string;
    barber_id?: string;
    salon_id?: string;
    date?: string;
    time?: string;
  }) {
    this.logger.log(`[AIToolsService] Updating booking state for session ${sessionId}: ${JSON.stringify(data)}`);
    const prismaData: any = {};
    if (data.customer_name !== undefined) prismaData.customerName = data.customer_name;
    if (data.phone !== undefined) prismaData.phone = data.phone;
    if (data.service_id !== undefined) prismaData.serviceId = data.service_id;
    if (data.barber_id !== undefined) prismaData.barberId = data.barber_id;
    if (data.salon_id !== undefined) prismaData.salonId = data.salon_id;
    if (data.date !== undefined) prismaData.date = data.date;
    if (data.time !== undefined) prismaData.time = data.time;

    return await (this.prisma.bookingRequest as any).upsert({
      where: { sessionId },
      create: { sessionId, ...prismaData },
      update: prismaData,
    });
  }

  async handleToolCall(name: string, args: any, sessionId: string) {
    this.logger.log(`Executing tool: ${name} with args: ${JSON.stringify(args)}`);

    try {
      // ── get_salons: Trả về danh sách cơ sở đang hoạt động ──
      if (name === 'get_salons') {
        const salons = await this.prisma.salon.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            district: true,
            phone: true,
          },
          orderBy: { name: 'asc' },
        });

        if (salons.length === 0) {
          return { content: 'Hiện tại chưa có cơ sở nào đang hoạt động.' };
        }

        // P4 Task 4.1: Auto-select if only one salon
        if (salons.length === 1) {
          const s = salons[0];
          await this.update_booking_state(sessionId, { salon_id: s.id });
          const addr = [s.address, s.district, s.city].filter(Boolean).join(', ');
          return { content: `Cơ sở duy nhất: ID: ${s.id} | Tên: ${s.name} | Địa chỉ: ${addr}. Đã tự động chọn cơ sở này.` };
        }

        const list = salons
          .map((s, i) => {
            const addr = [s.address, s.district, s.city].filter(Boolean).join(', ');
            return `${i + 1}. ID: ${s.id} | Tên: ${s.name} | Địa chỉ: ${addr || 'Chưa cập nhật'} | SĐT: ${s.phone || 'N/A'}`;
          })
          .join('\n');

        return { content: `Danh sách cơ sở Reetro Barber:\n${list}` };
      }

      // ── get_services: Lấy dịch vụ theo salon ──
      if (name === 'get_services') {
        const session = await (this.prisma.bookingRequest as any).findUnique({ where: { sessionId } });
        let salonId = args.salon_id || session?.salonId;

        // Fix: resolve numeric selection ("2", "3") to actual salon UUID
        salonId = await this.resolveNumericSalonId(salonId, sessionId);

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
            .join('\n'),
        };
      }

      // ── get_barbers: Lấy thợ theo salon_id từ args hoặc session ──
      if (name === 'get_barbers') {
        const session = await (this.prisma.bookingRequest as any).findUnique({ where: { sessionId } });
        let salonId = args.salon_id || session?.salonId;

        // Fix: resolve numeric selection ("2", "3") to actual salon UUID
        salonId = await this.resolveNumericSalonId(salonId, sessionId);

        const BARBER_POSITIONS = ['BARBER', 'STYLIST', 'SENIOR_STYLIST', 'MASTER_STYLIST'];

        const where: any = {
          isActive: true,
          position: { in: BARBER_POSITIONS },
        };
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

  // ═══ Resolve numeric salon selection ("2") to actual UUID from DB ═══
  // Fixes: model passes salon_id="2" when user typed a number instead of UUID
  private async resolveNumericSalonId(
    value: string | null | undefined,
    sessionId: string,
  ): Promise<string | null | undefined> {
    if (!value) return value;
    const isNumeric = /^\d+$/.test(value.toString().trim());
    if (!isNumeric) return value; // already a UUID or valid string

    const idx = parseInt(value.trim(), 10) - 1;
    if (idx < 0) return value;

    const salons = await this.prisma.salon.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    if (salons[idx]) {
      const resolvedId = salons[idx].id;
      this.logger.log(`[Resolve] Numeric "${value}" → salon UUID: ${resolvedId} (${salons[idx].name})`);
      await this.update_booking_state(sessionId, { salon_id: resolvedId });
      return resolvedId;
    }

    this.logger.warn(`[Resolve] Numeric "${value}" out of range (${salons.length} salons total)`);
    return value;
  }

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

    // --- Cross-branch service resolution + name-based fallback ---
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
