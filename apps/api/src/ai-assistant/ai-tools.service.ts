import { Injectable, Logger } from '@nestjs/common';
import { ServicesService } from '../services/services.service';
import { StaffService } from '../staff/staff.service';
import { BookingsService } from '../bookings/bookings.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AIToolsService {
  private readonly logger = new Logger(AIToolsService.name);

  constructor(
    private prisma: PrismaService,
    private servicesService: ServicesService,
    private staffService: StaffService,
    private bookingsService: BookingsService,
  ) {}

  async handleToolCall(name: string, args: any, sessionId: string) {
    this.logger.log(`Executing tool: ${name} with args: ${JSON.stringify(args)}`);
    
    try {
      switch (name) {
        case 'get_services':
          const services = await this.servicesService.findAll({ limit: 50 } as any);
          return {
            content: services.data.map(s => `ID: ${s.id}, Tên: ${s.name}, Giá: ${s.price}đ, Thời gian: ${s.duration} phút`).join('\n')
          };

        case 'get_barbers':
          const barbers = await this.staffService.findAll({} as any);
          return {
            content: barbers.data.map(b => `ID: ${b.id}, Tên: ${b.user.name}, Đánh giá: ${b.rating} sao`).join('\n')
          };

        case 'get_available_slots':
          if (!args.barber_id || !args.date) {
            return { content: 'Lỗi: Thiếu thông tin Barber ID hoặc Ngày.' };
          }
          const slots = await this.staffService.getAvailableSlots(args.barber_id, args.date);
          return {
            content: slots.length > 0 
              ? `Các khung giờ còn trống ngày ${args.date}: ${slots.join(', ')}`
              : `Rất tiếc, ngày ${args.date} hiện đã hết chỗ trống cho thợ này.`
          };

        case 'create_booking':
          // Verify arguments
          const required = ['customer_name', 'phone', 'service_id', 'barber_id', 'date', 'time'];
          for (const field of required) {
            if (!args[field]) return { content: `Lỗi: Thiếu thông tin ${field}.` };
          }

          const barber = await this.prisma.staff.findUnique({
            where: { id: args.barber_id },
            include: { user: true }
          });

          if (!barber) return { content: 'Lỗi: Không tìm thấy thợ cắt tóc này.' };

          const booking = await this.bookingsService.create({
            salonId: barber.salonId,
            staffId: args.barber_id,
            date: args.date,
            timeSlot: args.time,
            serviceIds: [args.service_id],
            customerName: args.customer_name,
            customerPhone: args.phone,
            note: 'Đặt lịch qua Trợ lý AI',
          } as any, { role: 'CUSTOMER' } as any);

          return {
            content: `ĐẶT LỊCH THÀNH CÔNG! Mã đặt lịch: ${booking.bookingCode}. Khách hàng: ${args.customer_name}, Thợ: ${barber.user.name}, Lúc: ${args.time} ngày ${args.date}.`,
            isBooking: true
          };

        case 'cancel_booking':
          if (!args.booking_id) return { content: 'Lỗi: Thiếu mã đặt lịch (Booking ID).' };
          await this.bookingsService.cancel(args.booking_id, 'Hủy qua Trợ lý AI', { role: 'CUSTOMER' } as any);
          return { content: `Đã hủy lịch hẹn ${args.booking_id} thành công.` };

        default:
          return { content: 'Lỗi: Công cụ không được hỗ trợ.' };
      }
    } catch (error: any) {
      this.logger.error(`Tool error (${name}): ${error.message}`);
      return { content: `Có lỗi xảy ra khi thực hiện tác vụ: ${error.message}` };
    }
  }
}
