import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { Booking, BookingStatus, NotificationType, PaymentStatus, Role, User } from '@prisma/client';
import * as crypto from 'crypto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';


import { BaseQueryService } from '../common/services/base-query.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class BookingsService extends BaseQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async create(dto: CreateBookingDto, customerId: string): Promise<Booking> {
    // Validate salon exists
    const salon = await this.prisma.salon.findUnique({
      where: { id: dto.salonId },
    });

    if (!salon || !salon.isActive) {
      throw new NotFoundException('Salon not found or inactive');
    }

    // Validate services exist and belong to salon
    const services = await this.prisma.service.findMany({
      where: {
        id: { in: dto.serviceIds },
        salonId: dto.salonId,
        isActive: true,
      },
    });

    if (services.length !== dto.serviceIds.length) {
      throw new BadRequestException('Some services are invalid or inactive');
    }

    // Validate staff if provided
    if (dto.staffId) {
      const staff = await this.prisma.staff.findFirst({
        where: {
          id: dto.staffId,
          salonId: dto.salonId,
          isActive: true,
        },
      });

      if (!staff) {
        throw new BadRequestException('Staff not found or inactive');
      }

      // Check if staff is available at this time
      const isAvailable = await this.checkStaffAvailability(
        dto.staffId,
        dto.date,
        dto.timeSlot,
        this.calculateTotalDuration(services),
      );

      if (!isAvailable) {
        throw new BadRequestException('Staff is not available at this time');
      }
    }

    // Calculate totals
    const totalDuration = this.calculateTotalDuration(services);
    const totalAmount = this.calculateTotalAmount(services);
    const endTime = this.calculateEndTime(dto.timeSlot, totalDuration);

    // Generate booking code
    const bookingCode = this.generateBookingCode();

    // Create booking with services
    const booking = await this.prisma.booking.create({
      data: {
        bookingCode,
        customerId,
        salonId: dto.salonId,
        staffId: dto.staffId,
        date: new Date(dto.date),
        timeSlot: dto.timeSlot,
        endTime,
        totalDuration,
        totalAmount,
        note: dto.note,
        services: {
          create: services.map(service => ({
            serviceId: service.id,
            price: service.price,
            duration: service.duration,
          })),
        },
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        salon: true,
        staff: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Notify staff about new booking (fire-and-forget)
    this.notificationsService.notifyStaffBySalon(
      dto.salonId,
      'new_booking',
      {
        title: 'Đặt lịch mới',
        message: `Đơn mới ${booking.bookingCode} - ${booking.salon?.name || 'Salon'} lúc ${dto.timeSlot}`,
        type: NotificationType.BOOKING_CREATED,
        data: { bookingId: booking.id, bookingCode: booking.bookingCode },
        specificStaffId: dto.staffId,
      },
    ).catch(err => console.error('Failed to notify staff about new booking:', err));

    return booking;
  }

  async findAll(query: BookingQueryDto) {
    const {
      salonId,
      customerId,
      staffId,
      status,
      dateFrom,
      dateTo,
      search,
      serviceId,
      sortBy,
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (salonId) where.salonId = salonId;
    if (customerId) where.customerId = customerId;
    if (staffId) where.staffId = staffId;
    if (status) where.status = status;
    if (serviceId) where.services = { some: { serviceId } };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (search) {
      Object.assign(where, this.buildSearchWhere(search, ['bookingCode', 'customer.name', 'customer.phone']));
    }

    const { skip, take } = this.getPaginationOptions(query);

    const orderBy: any = sortBy ? { [sortBy]: sortOrder } : [{ date: 'desc' }, { timeSlot: 'desc' }];

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy,
        select: {
          id: true,
          bookingCode: true,
          date: true,
          timeSlot: true,
          endTime: true,
          totalDuration: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          note: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatar: true,
            },
          },
          salon: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          staff: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  avatar: true,
                },
              },
            },
          },
          services: {
            select: {
              serviceId: true,
              price: true,
              duration: true,
              service: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  duration: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: this.getPaginationMeta(total, query),
    };
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        salon: true,
        staff: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        services: {
          include: {
            service: true,
          },
        },
        payments: true,
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async findByCode(code: string): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode: code },
      include: {
        salon: true,
        services: {
          include: {
            service: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with code ${code} not found`);
    }

    return booking;
  }

  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
    user: User,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    // Validate permission
    await this.validateBookingAccess(booking, user);

    // Validate status transition
    this.validateStatusTransition(booking.status, dto.status);

    const updateData: any = { status: dto.status };

    if (dto.status === BookingStatus.CANCELLED) {
      updateData.cancelReason = dto.cancelReason;
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = user.id;

      // Notify staff about cancellation
      this.notificationsService.notifyStaffBySalon(
        booking.salonId,
        'cancel',
        {
          title: 'Đơn bị hủy',
          message: `Đơn ${(booking as any).bookingCode} đã bị hủy${dto.cancelReason ? '. Lý do: ' + dto.cancelReason : ''}`,
          type: NotificationType.BOOKING_CANCELLED,
          data: { bookingId: id, bookingCode: (booking as any).bookingCode },
          specificStaffId: booking.staffId || undefined,
        },
      ).catch(err => console.error('Failed to notify staff about cancellation:', err));
    }

    // Only auto-set paymentStatus=PAID for walk-in (UNPAID) bookings.
    // Online bookings with DEPOSIT_PAID need cashier to handle final payment.
    if (dto.status === BookingStatus.COMPLETED && (booking as any).paymentStatus === PaymentStatus.UNPAID) {
      updateData.paymentStatus = PaymentStatus.PAID;
    }

    return this.prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        services: {
          include: {
            service: true,
          },
        },
        salon: true,
        staff: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        payments: true,
      },
    });
  }

  async assignStaff(id: string, staffId: string, user: User): Promise<Booking> {
    const booking = await this.findOne(id);

    // Validate permission
    await this.validateBookingAccess(booking, user, true);

    // Validate staff belongs to salon
    const staff = await this.prisma.staff.findFirst({
      where: {
        id: staffId,
        salonId: booking.salonId,
        isActive: true,
      },
    });

    if (!staff) {
      throw new BadRequestException('Staff not found or does not belong to this salon');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { staffId },
      include: {
        staff: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async cancel(id: string, reason: string, user: User): Promise<Booking> {
    return this.updateStatus(
      id,
      {
        status: BookingStatus.CANCELLED,
        cancelReason: reason,
      },
      user,
    );
  }

  async getTodayBookings(salonId: string) {
    // Use Vietnam timezone to get today's date, then create UTC midnight for @db.Date
    const todayStr = dayjs().tz(VIETNAM_TZ).format('YYYY-MM-DD');
    const today = new Date(todayStr + 'T00:00:00.000Z');

    return this.prisma.booking.findMany({
      where: {
        salonId,
        date: today,
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
      },
      orderBy: { timeSlot: 'asc' },
      include: {
        customer: {
          select: {
            name: true,
            phone: true,
          },
        },
        staff: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        services: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async getUpcoming(customerId: string) {
    const todayStr = dayjs().tz(VIETNAM_TZ).format('YYYY-MM-DD');
    const today = new Date(todayStr + 'T00:00:00.000Z');

    return this.prisma.booking.findMany({
      where: {
        customerId,
        date: { gte: today },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            logo: true,
          },
        },
        services: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
        staff: {
          include: {
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Add extra service(s) to an active booking (Receptionist upsell).
   */
  async addServiceToBooking(
    bookingId: string,
    serviceIds: string[],
    user: User,
  ): Promise<Booking> {
    const booking = await this.findOne(bookingId);

    await this.validateBookingAccess(booking, user, true);

    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        'Can only add services to CONFIRMED or IN_PROGRESS bookings',
      );
    }

    const services = await this.prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        salonId: booking.salonId,
        isActive: true,
      },
    });

    if (services.length !== serviceIds.length) {
      throw new BadRequestException('Some services are invalid or inactive');
    }

    const addedDuration = this.calculateTotalDuration(services);
    const addedAmount = this.calculateTotalAmount(services);

    // Create booking-service records and update totals
    await this.prisma.$transaction([
      ...services.map(service =>
        this.prisma.bookingService.create({
          data: {
            bookingId,
            serviceId: service.id,
            price: service.price,
            duration: service.duration,
          },
        }),
      ),
      this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          totalDuration: { increment: addedDuration },
          totalAmount: { increment: addedAmount },
        },
      }),
    ]);

    return this.findOne(bookingId);
  }

  private async checkStaffAvailability(
    staffId: string,
    date: Date | string,
    timeSlot: string,
    duration: number,
  ): Promise<boolean> {
    const dateStr = typeof date === 'string' ? date : dayjs(date).format('YYYY-MM-DD');
    const searchDate = dayjs.utc(dateStr).toDate();
    const vDate = dayjs.tz(dateStr, VIETNAM_TZ).startOf('day');
    
    const [startH, startM] = timeSlot.split(':').map(Number);
    const requestStart = vDate.set('hour', startH).set('minute', startM).set('second', 0).set('millisecond', 0);
    const requestEnd = requestStart.add(duration, 'minute');
    const endTimeStr = requestEnd.format('HH:mm');

    // 1. Check if staff has a shift covering this time
    const shift = await (this.prisma as any).staffShift.findFirst({
      where: {
        staffId,
        date: searchDate,
        shiftStart: { lte: requestStart.toDate() },
        shiftEnd: { gte: requestEnd.toDate() },
      },
    });

    if (!shift) {
      // Fallback to weekly schedule if no specific shift
      const dayOfWeek = vDate.day();
      const weekly = await (this.prisma as any).staffWeeklySchedule.findFirst({
        where: { staffId, dayOfWeek, isOff: false },
      });

      if (!weekly) return false;

      const [wStartH, wStartM] = weekly.startTime.split(':').map(Number);
      const [wEndH, wEndM] = weekly.endTime.split(':').map(Number);
      const weeklyStart = vDate.set('hour', wStartH).set('minute', wStartM);
      const weeklyEnd = vDate.set('hour', wEndH).set('minute', wEndM);

      if (requestStart.isBefore(weeklyStart) || requestEnd.isAfter(weeklyEnd)) {
        return false;
      }
    }

    // 2. Check for conflicting bookings
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        staffId,
        date: searchDate,
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
        OR: [
          {
            AND: [
              { timeSlot: { lt: endTimeStr } },
              { endTime: { gt: timeSlot } },
            ],
          },
        ],
      },
    });

    return !conflictingBooking;
  }

  private calculateTotalDuration(services: { duration: number }[]): number {
    return services.reduce((sum, s) => sum + s.duration, 0);
  }

  private calculateTotalAmount(services: { price: any }[]): number {
    return services.reduce((sum, s) => sum + Number(s.price), 0);
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }

  private generateBookingCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomUUID().split('-')[0].toUpperCase();
    return `RB${timestamp}${random}`.substring(0, 12);
  }

  private validateStatusTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
  ): void {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [
        BookingStatus.IN_PROGRESS,
        BookingStatus.CANCELLED,
        BookingStatus.NO_SHOW,
      ],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
      [BookingStatus.NO_SHOW]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot change status from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private async validateBookingAccess(
    booking: any,
    user: User,
    salonOnly = false,
  ): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return;
    }

    // Salon owner or MANAGER or staff can access
    const salon = await this.prisma.salon.findUnique({
      where: { id: booking.salonId },
    });

    if (salon && salon.ownerId === user.id) {
      return;
    }

    if (user.role === (Role as any).MANAGER) {
      const staff = await this.prisma.staff.findFirst({
        where: { userId: user.id, salonId: booking.salonId }
      });
      if (staff) return;
    }

    // Staff of this salon can access
    const staff = await this.prisma.staff.findFirst({
      where: {
        userId: user.id,
        salonId: booking.salonId,
      },
    });

    if (staff) {
      return;
    }

    // Customer can only access their own bookings (if not salon-only)
    if (!salonOnly && booking.customerId === user.id) {
      return;
    }

    throw new ForbiddenException('You do not have access to this booking');
  }
  async bulkUpdateStatus(
    ids: string[],
    status: BookingStatus,
    user: User,
  ): Promise<{ count: number }> {
    if (user.role === Role.CUSTOMER) {
      throw new ForbiddenException('Customers cannot perform bulk updates');
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        id: { in: ids },
      },
    });

    const validIds: string[] = [];

    for (const booking of bookings) {
      try {
        await this.validateBookingAccess(booking, user, true);
        this.validateStatusTransition(booking.status, status);
        validIds.push(booking.id);
      } catch (err) {
        // Skip bookings that we can't update or have invalid transitions
        console.warn(`Skipping bulk update for booking ${booking.id}: ${err.message}`);
      }
    }

    if (validIds.length === 0) {
      return { count: 0 };
    }

    const result = await this.prisma.booking.updateMany({
      where: {
        id: { in: validIds },
      },
      data: {
        status,
        // Note: bulkUpdateStatus cannot conditionally check each booking's paymentStatus
        // with updateMany, so we skip auto-setting paymentStatus here.
        // Cashier should handle final payment for each booking individually.
      },
    });

    return { count: result.count };
  }

  async exportToExcel(query: BookingQueryDto) {
    const { data: bookings } = await this.findAll({ ...query, limit: 10000, page: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bookings');

    worksheet.columns = [
      { header: 'Mã đặt lịch', key: 'bookingCode', width: 20 },
      { header: 'Tên khách hàng', key: 'customerName', width: 25 },
      { header: 'Số điện thoại', key: 'customerPhone', width: 15 },
      { header: 'Chi nhánh', key: 'salonName', width: 25 },
      { header: 'Nhân viên', key: 'staffName', width: 20 },
      { header: 'Dịch vụ', key: 'services', width: 35 },
      { header: 'Ngày', key: 'date', width: 15 },
      { header: 'Giờ', key: 'timeSlot', width: 10 },
      { header: 'Tổng tiền', key: 'totalAmount', width: 15 },
      { header: 'Trạng thái', key: 'status', width: 15 },
    ];

    bookings.forEach((booking: any) => {
      worksheet.addRow({
        bookingCode: booking.bookingCode,
        customerName: booking.customer?.name || 'N/A',
        customerPhone: booking.customer?.phone || 'N/A',
        salonName: booking.salon?.name || 'N/A',
        staffName: booking.staff?.user?.name || 'Chưa chỉ định',
        services: booking.services.map((s: any) => s.service.name).join(', '),
        date: formatDate(booking.date),
        timeSlot: booking.timeSlot,
        totalAmount: Number(booking.totalAmount),
        status: booking.status,
      });
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return workbook;
  }

  /**
   * Auto-cancel PENDING bookings that exceeded the payment window (15 min).
   * Called by cron job to release reserved time slots.
   */
  async cancelExpiredBookings(): Promise<number> {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000); // 15 min ago

    const expired = await this.prisma.booking.findMany({
      where: {
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        createdAt: { lt: cutoff },
      },
      select: { id: true, bookingCode: true, salonId: true, staffId: true },
    });

    if (expired.length === 0) return 0;

    await this.prisma.booking.updateMany({
      where: {
        id: { in: expired.map(b => b.id) },
      },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: 'Hết thời gian thanh toán cọc (tự động hủy)',
        cancelledAt: new Date(),
      },
    });

    // Notify staff about each auto-cancelled booking
    for (const b of expired) {
      this.notificationsService.notifyStaffBySalon(
        b.salonId,
        'cancel',
        {
          title: 'Đơn tự động hủy',
          message: `Đơn ${b.bookingCode} đã tự động hủy do hết thời gian thanh toán cọc`,
          type: NotificationType.BOOKING_CANCELLED,
          data: { bookingId: b.id, bookingCode: b.bookingCode },
          specificStaffId: b.staffId || undefined,
        },
      ).catch(err => console.error('Failed to notify expired booking:', err));
    }

    return expired.length;
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('vi-VN');
}
