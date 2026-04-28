import { Injectable, Logger } from '@nestjs/common';
import { ServicesService } from '../services/services.service';
import { StaffService } from '../staff/staff.service';
import { PrismaService } from '../database/prisma.service';
import * as crypto from 'crypto';
import dayjs from 'dayjs';

// ═══ Types ═══
export interface BookingState {
  sessionId: string;
  salonId: string | null;
  serviceId: string | null;
  barberId: string | null;
  date: string | null;
  time: string | null;
  customerName: string | null;
  phone: string | null;
  status: string;
}

export type BookingStep =
  | 'SELECT_SALON'
  | 'SELECT_SERVICE'
  | 'SELECT_BARBER'
  | 'SELECT_DATE_TIME'
  | 'COLLECT_INFO'
  | 'CONFIRM_BOOKING'
  | 'COMPLETED';

export interface SalonItem {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  duration: number;
}

export interface BarberItem {
  id: string;
  name: string;
  rating: number;
}

@Injectable()
export class AIToolsService {
  private readonly logger = new Logger(AIToolsService.name);

  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
    private staffService: StaffService,
  ) { }

  // ═══ Compute Step Deterministically ═══
  computeStep(state: BookingState): BookingStep {
    if (!state.salonId) return 'SELECT_SALON';
    if (!state.serviceId) return 'SELECT_SERVICE';
    if (!state.barberId) return 'SELECT_BARBER';
    if (!state.date || !state.time) return 'SELECT_DATE_TIME';
    if (!state.customerName || !state.phone) return 'COLLECT_INFO';
    if (state.status !== 'COMPLETED') return 'CONFIRM_BOOKING';
    return 'COMPLETED';
  }

  // ═══ State Description for LLM Context ═══
  getStateDescription(state: BookingState): string {
    const parts: string[] = [];
    if (state.salonId) parts.push('salon=✅');
    if (state.serviceId) parts.push('service=✅');
    if (state.barberId) parts.push('barber=✅');
    if (state.date) parts.push(`date=${state.date}`);
    if (state.time) parts.push(`time=${state.time}`);
    if (state.customerName) parts.push(`name=${state.customerName}`);
    if (state.phone) parts.push(`phone=${state.phone}`);
    return parts.length > 0 ? parts.join(', ') : 'empty';
  }

  // ═══ Load Booking State ═══
  async loadState(sessionId: string, userId?: string): Promise<BookingState> {
    let request = await (this.prisma.bookingRequest as any).findUnique({
      where: { sessionId },
    });

    if (!request || request.status === 'COMPLETED') {
      request = await (this.prisma.bookingRequest as any).upsert({
        where: { sessionId },
        create: { sessionId },
        update: {
          status: 'PENDING', customerName: null, phone: null,
          salonId: null, serviceId: null, barberId: null, date: null, time: null,
        },
      });
    }

    return {
      sessionId,
      salonId: request.salonId,
      serviceId: request.serviceId,
      barberId: request.barberId,
      date: request.date,
      time: request.time,
      customerName: request.customerName,
      phone: request.phone,
      status: request.status || 'PENDING',
    };
  }

  // ═══ Save Booking State ═══
  async saveState(sessionId: string, state: BookingState): Promise<void> {
    await (this.prisma.bookingRequest as any).upsert({
      where: { sessionId },
      create: {
        sessionId,
        salonId: state.salonId,
        serviceId: state.serviceId,
        barberId: state.barberId,
        date: state.date,
        time: state.time,
        customerName: state.customerName,
        phone: state.phone,
        status: state.status,
      },
      update: {
        salonId: state.salonId,
        serviceId: state.serviceId,
        barberId: state.barberId,
        date: state.date,
        time: state.time,
        customerName: state.customerName,
        phone: state.phone,
        status: state.status,
      },
    });
  }

  // ═══ Data: Get Salons ═══
  async getSalons(): Promise<SalonItem[]> {
    const salons = await this.prisma.salon.findMany({
      where: { isActive: true },
      select: { id: true, name: true, address: true, city: true, district: true, phone: true },
      orderBy: { name: 'asc' },
    });

    return salons.map(s => ({
      id: s.id,
      name: s.name,
      address: [s.address, s.district, s.city].filter(Boolean).join(', '),
      phone: s.phone || 'N/A',
    }));
  }

  // ═══ Data: Get Services ═══
  async getServices(salonId: string): Promise<ServiceItem[]> {
    const services = await this.prisma.service.findMany({
      where: { salonId, isActive: true },
      select: { id: true, name: true, price: true, duration: true },
      orderBy: { order: 'asc' },
    });

    return services.map(s => ({
      id: s.id,
      name: s.name,
      price: Number(s.price),
      duration: s.duration,
    }));
  }

  // ═══ Data: Get Barbers ═══
  async getBarbers(salonId: string): Promise<BarberItem[]> {
    const BARBER_POSITIONS = ['BARBER', 'STYLIST', 'SENIOR_STYLIST', 'MASTER_STYLIST'] as any;
    const barbers = await this.prisma.staff.findMany({
      where: { isActive: true, position: { in: BARBER_POSITIONS }, salonId },
      include: { user: { select: { name: true } } },
      orderBy: { rating: 'desc' },
    });

    return barbers.map(b => ({
      id: b.id,
      name: (b as any).user?.name || 'Thợ',
      rating: b.rating,
    }));
  }

  // ═══ Data: Get Available Slots ═══
  async getAvailableSlots(barberId: string, date: string): Promise<string[]> {
    return this.staffService.getAvailableSlots(barberId, date);
  }

  // ═══ Resolve: Match user text to salon ═══
  async resolveSalon(input: string, salons: SalonItem[]): Promise<SalonItem | null> {
    const str = input.trim();

    // Number selection: "1", "2"
    const numMatch = str.match(/(?:thứ|số|cơ\s*sở|chi\s*nhánh)?\s*(\d+)$/i) || str.match(/^(\d+)$/);
    if (numMatch) {
      const idx = parseInt(numMatch[1], 10) - 1;
      if (idx >= 0 && idx < salons.length) {
        this.logger.log(`[Resolve] Salon "${str}" → #${idx + 1}: ${salons[idx].name}`);
        return salons[idx];
      }
    }

    // Name match
    const match = salons.find(s =>
      s.name.toLowerCase().includes(str.toLowerCase()) ||
      str.toLowerCase().includes(s.name.toLowerCase().substring(0, 8))
    );
    if (match) {
      this.logger.log(`[Resolve] Salon "${str}" → ${match.name}`);
      return match;
    }

    return null;
  }

  // ═══ Resolve: Match user text to service ═══
  async resolveService(input: string, services: ServiceItem[]): Promise<ServiceItem | null> {
    const str = input.trim();

    // Number selection
    const num = parseInt(str, 10);
    if (!isNaN(num) && num >= 1 && num <= services.length) {
      return services[num - 1];
    }

    // Fuzzy name match
    const lower = str.toLowerCase()
      .replace('cat toc', 'cắt tóc')
      .replace('nhuom', 'nhuộm')
      .replace('uon', 'uốn')
      .replace('goi', 'gội')
      .replace('hot toc', 'hớt tóc');

    const match = services.find(s => {
      const sName = s.name.toLowerCase();
      return sName.includes(lower) || lower.includes(sName.substring(0, 5));
    });
    if (match) return match;

    // Partial keyword match
    const keywords = lower.split(/\s+/);
    return services.find(s =>
      keywords.some(kw => kw.length >= 3 && s.name.toLowerCase().includes(kw))
    ) || null;
  }

  // ═══ Resolve: Match user text to barber ═══
  async resolveBarber(input: string, barbers: BarberItem[]): Promise<BarberItem | null> {
    if (barbers.length === 0) return null;
    const str = input.trim();

    // "any" / "ai cũng được"
    if (/^(any|ai|bất\s*kỳ|nào\s*cũng)/i.test(str)) {
      return barbers[0]; // Highest rating (already sorted)
    }

    // Number selection
    const num = parseInt(str, 10);
    if (!isNaN(num) && num >= 1 && num <= barbers.length) {
      return barbers[num - 1];
    }

    // Name match
    const lower = str.toLowerCase();
    return barbers.find(b => b.name.toLowerCase().includes(lower)) || null;
  }

  // ═══ Create Booking ═══
  async createBooking(state: BookingState, userId?: string): Promise<{ success: boolean; message: string; bookingCode?: string }> {
    // ══ AUTH GUARD: Reject guest bookings ══
    if (!userId) {
      this.logger.warn('[CreateBooking] Blocked — no userId');
      return { success: false, message: 'Vui lòng đăng nhập để đặt lịch.' };
    }

    // Validate all fields
    if (!state.salonId || !state.serviceId || !state.barberId || !state.date || !state.time || !state.customerName || !state.phone) {
      return { success: false, message: 'Thiếu thông tin đặt lịch.' };
    }

    // Validate barber exists
    const barber = await this.prisma.staff.findUnique({
      where: { id: state.barberId },
      include: { user: true },
    });
    if (!barber) return { success: false, message: 'Không tìm thấy thợ cắt tóc này.' };

    // Validate service exists at barber's salon
    let svc = await this.prisma.service.findFirst({
      where: { id: state.serviceId, salonId: barber.salonId },
    });

    // Cross-branch resolution
    if (!svc) {
      const original = await this.prisma.service.findUnique({ where: { id: state.serviceId } });
      if (original) {
        svc = await this.prisma.service.findFirst({
          where: { salonId: barber.salonId, name: { contains: original.name, mode: 'insensitive' }, isActive: true },
        });
      }
    }

    if (!svc) {
      return { success: false, message: `Dịch vụ không có sẵn tại chi nhánh của thợ ${barber.user.name}.` };
    }

    // Validate time slot
    const slots = await this.getAvailableSlots(state.barberId, state.date);
    if (slots.length > 0 && !slots.includes(state.time)) {
      return {
        success: false,
        message: `Khung giờ ${state.time} đã hết. Khung giờ còn trống: ${slots.join(', ')}`,
      };
    }

    const totalDuration = svc.duration;
    const totalAmount = Number(svc.price);
    const [h, m] = state.time.split(':').map(Number);
    const endMinutes = h * 60 + m + totalDuration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;
    const bookingCode = `RB${Date.now().toString(36).toUpperCase()}${crypto.randomUUID().split('-')[0].toUpperCase()}`.substring(0, 12);
    const dateObj = new Date(state.date + 'T00:00:00.000Z');

    const booking = await (this.prisma.booking as any).create({
      data: {
        bookingCode,
        customerId: userId,
        customerName: state.customerName,
        customerPhone: state.phone,
        salonId: barber.salonId,
        staffId: state.barberId,
        date: dateObj,
        timeSlot: state.time,
        endTime,
        totalDuration,
        totalAmount,
        note: 'Đặt lịch qua Trợ lý AI',
        services: {
          create: [{ serviceId: svc.id, price: svc.price, duration: svc.duration }],
        },
      },
    });

    // Mark booking request as completed
    await (this.prisma.bookingRequest as any).update({
      where: { sessionId: state.sessionId },
      data: { status: 'COMPLETED' },
    }).catch(() => null);

    return {
      success: true,
      bookingCode: booking.bookingCode,
      message: `✅ **ĐẶT LỊCH THÀNH CÔNG!**\n\n` +
        `📋 Mã đặt lịch: **${booking.bookingCode}**\n` +
        `👤 Khách hàng: ${state.customerName} (${state.phone})\n` +
        `✂️ Dịch vụ: ${svc.name}\n` +
        `💇 Thợ: ${barber.user.name}\n` +
        `📅 Lúc: ${state.time} ngày ${dayjs(dateObj).format('DD/MM/YYYY')}\n\n` +
        `Em cảm ơn anh/chị đã đặt lịch! Hẹn gặp ạ! 💈😊`,
    };
  }

  // ═══ Look up names for display ═══
  async getSalonName(salonId: string): Promise<string> {
    const salon = await this.prisma.salon.findUnique({ where: { id: salonId }, select: { name: true } });
    return salon?.name || 'Cơ sở';
  }

  async getServiceName(serviceId: string): Promise<string> {
    const svc = await this.prisma.service.findUnique({ where: { id: serviceId }, select: { name: true, price: true } });
    return svc ? `${svc.name} (${svc.price}đ)` : 'Dịch vụ';
  }

  async getBarberName(barberId: string): Promise<string> {
    const staff = await this.prisma.staff.findUnique({ where: { id: barberId }, include: { user: { select: { name: true } } } });
    return staff?.user?.name || 'Thợ';
  }
}
