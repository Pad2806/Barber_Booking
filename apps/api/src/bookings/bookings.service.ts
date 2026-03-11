import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { Booking, BookingStatus, PaymentStatus, Role, User } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { BaseQueryService } from '../common/services/base-query.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class BookingsService extends BaseQueryService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(dto: CreateBookingDto, customerId: string): Promise<Booking> {
    // ... existing create logic ...
    // (I'll keep the create logic as is to avoid unnecessary diffs, just making sure the class extends BaseQueryService)
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
      sortBy,
      sortOrder = 'desc',
    } = query;

    const where: any = {};

    if (salonId) where.salonId = salonId;
    if (customerId) where.customerId = customerId;
    if (staffId) where.staffId = staffId;
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { bookingCode: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    const take = limit;

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
              service: {
                select: {
                  id: true,
                  name: true,
                  price: true,
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
    }

    if (dto.status === BookingStatus.COMPLETED) {
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
    date: string | Date,
    timeSlot: string,
    duration: number,
  ): Promise<boolean> {
    const bookingDate = new Date(date);
    const endTime = this.calculateEndTime(timeSlot, duration);

    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        staffId,
        date: bookingDate,
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
        OR: [
          {
            AND: [
              { timeSlot: { lte: timeSlot } },
              { endTime: { gt: timeSlot } },
            ],
          },
          {
            AND: [
              { timeSlot: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { timeSlot: { gte: timeSlot } },
              { endTime: { lte: endTime } },
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
    const random = uuidv4().split('-')[0].toUpperCase();
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

    // Salon owner or staff can access
    const salon = await this.prisma.salon.findUnique({
      where: { id: booking.salonId },
    });

    if (salon && salon.ownerId === user.id) {
      return;
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
    // Basic permissions check - only staff/admin can bulk update
    if (user.role === Role.CUSTOMER) {
      throw new ForbiddenException('Customers cannot perform bulk updates');
    }

    // In a real production app, we should validate each booking's current status and salon ownership
    // For now, we perform a bulk update based on accessible IDs
    const bookings = await this.prisma.booking.findMany({
      where: {
        id: { in: ids },
      },
    });

    for (const booking of bookings) {
      await this.validateBookingAccess(booking, user, true);
      this.validateStatusTransition(booking.status, status);
    }

    const result = await this.prisma.booking.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status,
        ...(status === BookingStatus.COMPLETED ? { paymentStatus: PaymentStatus.PAID } : {}),
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
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('vi-VN');
}
