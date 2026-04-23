import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  Role,
  BookingStatus,
  StaffPosition,
  PaymentMethod,
} from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

@Injectable()
export class CashierService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── AUTH HELPER ────────────────────────────────────────────

  private async getSalonId(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        staff: true,
        userRoles: { select: { role: true } },
      },
    });

    if (!user) throw new ForbiddenException('User not found');

    // Build effective roles list (multi-role RBAC + legacy single role)
    const userRolesArr: Role[] = (user as any).userRoles?.length
      ? (user as any).userRoles.map((ur: any) => ur.role as Role)
      : [user.role as Role];

    const allowed: Role[] = [
      Role.CASHIER,
      Role.MANAGER,
      Role.SALON_OWNER,
      Role.SUPER_ADMIN,
    ];

    // UserRole table is the single source of truth — no staff.position fallback needed
    const isAllowedRole = userRolesArr.some(r => allowed.includes(r));

    if (!isAllowedRole) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    // SUPER_ADMIN / SALON_OWNER may not have a staff record — use first salon
    if (!user.staff) {
      const isSuperAdmin = userRolesArr.includes(Role.SUPER_ADMIN);
      const isSalonOwner = userRolesArr.includes(Role.SALON_OWNER);
      if (isSuperAdmin || isSalonOwner) {
        const firstSalon = await this.prisma.salon.findFirst({ select: { id: true } });
        if (!firstSalon) throw new ForbiddenException('Không có chi nhánh nào trong hệ thống');
        return firstSalon.id;
      }
      throw new ForbiddenException('Nhân viên chưa được gán chi nhánh');
    }

    return user.staff.salonId;
  }

  /**
   * Convert a date string (YYYY-MM-DD) to a UTC midnight Date for @db.Date comparison.
   * PostgreSQL DATE stores date-only. Prisma sends JS Date, so we must use UTC midnight
   * to avoid timezone offset causing off-by-one day errors.
   */
  private toDateOnly(dateStr: string): Date {
    return new Date(dateStr + 'T00:00:00.000Z');
  }

  private todayDate() {
    const todayStr = dayjs().tz(VIETNAM_TZ).format('YYYY-MM-DD');
    return this.toDateOnly(todayStr);
  }

  // ─── 1. DASHBOARD ──────────────────────────────────────────

  async getDashboardStats(userId: string) {
    const salonId = await this.getSalonId(userId);
    const today = this.todayDate();

    const [todayBookings, pendingCount, waitingCount, completedCount, revenue] =
      await Promise.all([
        this.prisma.booking.count({ where: { salonId, date: today } }),
        this.prisma.booking.count({
          where: { salonId, status: 'PENDING' },
        }),
        (this.prisma as any).waitingQueue.count({
          where: { salonId, status: 'WAITING' },
        }),
        this.prisma.booking.count({
          where: { salonId, date: today, status: 'COMPLETED' },
        }),
        this.prisma.booking.aggregate({
          where: { salonId, date: today, status: 'COMPLETED' },
          _sum: { totalAmount: true },
        }),
      ]);

    // Upcoming bookings today (CONFIRMED / IN_PROGRESS)
    const upcoming = await this.prisma.booking.findMany({
      where: {
        salonId,
        date: today,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
        services: { include: { service: { select: { name: true, price: true } } } },
        staff: { include: { user: { select: { name: true, avatar: true } } } },
      },
      orderBy: { timeSlot: 'asc' },
      take: 8,
    });

    return {
      todayBookings,
      pendingOnline: pendingCount,
      waitingQueue: waitingCount,
      completedToday: completedCount,
      todayRevenue: Number(revenue._sum.totalAmount || 0),
      upcoming,
    };
  }

  // ─── 2. ONLINE BOOKING APPROVAL ────────────────────────────

  async getPendingBookings(userId: string) {
    const salonId = await this.getSalonId(userId);
    return this.prisma.booking.findMany({
      where: { salonId, status: 'PENDING' },
      include: {
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
        services: { include: { service: { select: { id: true, name: true, price: true, duration: true } } } },
        staff: { include: { user: { select: { name: true, avatar: true } } } },
        payments: { select: { id: true, amount: true, type: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveBooking(
    userId: string,
    bookingId: string,
    data: { staffId?: string; timeSlot?: string; date?: string },
  ) {
    const salonId = await this.getSalonId(userId);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.salonId !== salonId) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }
    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Chỉ duyệt được lịch ở trạng thái chờ');
    }

    const hasBarber = !!booking.staffId;
    const hasDeposit = booking.paymentStatus === 'DEPOSIT_PAID';

    // If customer hasn't chosen a barber, cashier MUST assign one
    if (!hasBarber && !data.staffId) {
      throw new BadRequestException(
        'Khách hàng chưa chọn thợ, vui lòng chọn thợ trước khi duyệt',
      );
    }

    const updateData: any = { status: 'CONFIRMED' };

    // Only allow cashier to change staffId if customer hasn't chosen one yet
    if (!hasBarber && data.staffId) {
      updateData.staffId = data.staffId;
    }
    // If customer already chose barber, keep their choice (ignore data.staffId)

    if (data.timeSlot) updateData.timeSlot = data.timeSlot;
    if (data.date)
      updateData.date = this.toDateOnly(data.date);

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        customer: { select: { name: true } },
        staff: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async rejectBooking(userId: string, bookingId: string, reason: string) {
    const salonId = await this.getSalonId(userId);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.salonId !== salonId) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
        cancelledBy: 'CASHIER',
        cancelledAt: new Date(),
      },
    });
  }

  // ─── 3. BOOKINGS LIST ──────────────────────────────────────

  async getBookings(
    userId: string,
    filters: {
      date?: string;
      status?: BookingStatus;
      search?: string;
    },
  ) {
    const salonId = await this.getSalonId(userId);

    const where: any = { salonId };
    if (filters.date) {
      where.date = this.toDateOnly(filters.date);
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.search) {
      where.OR = [
        {
          customer: {
            name: { contains: filters.search, mode: 'insensitive' },
          },
        },
        { customer: { phone: { contains: filters.search } } },
        {
          bookingCode: { contains: filters.search, mode: 'insensitive' },
        },
      ];
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
        services: { include: { service: { select: { id: true, name: true, price: true, duration: true } } } },
        staff: { include: { user: { select: { name: true, avatar: true } } } },
        payments: { select: { id: true, method: true, amount: true, status: true, paidAt: true } },
      },
      orderBy: [{ timeSlot: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getBookingDetail(userId: string, bookingId: string) {
    const salonId = await this.getSalonId(userId);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { id: true, name: true, phone: true, avatar: true, email: true } },
        services: { include: { service: { select: { id: true, name: true, price: true, duration: true, category: true } } } },
        staff: { include: { user: { select: { name: true, avatar: true } } } },
        payments: true,
        review: { select: { rating: true, comment: true } },
      },
    });

    if (!booking || booking.salonId !== salonId) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    return booking;
  }

  // ─── 4. WALK-IN BOOKING ────────────────────────────────────

  async createWalkinBooking(
    userId: string,
    data: {
      customerName: string;
      phone?: string;
      serviceIds: string[];
      staffId?: string;
      note?: string;
    },
  ) {
    const salonId = await this.getSalonId(userId);

    if (!data.serviceIds?.length) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 dịch vụ');
    }

    // ── 1. Find or upsert customer ──────────────────────────────
    let customer;
    if (data.phone) {
      // Find by phone first
      customer = await this.prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (customer) {
        // Update name if it differs (e.g. cashier corrected the name)
        if (customer.name !== data.customerName) {
          customer = await this.prisma.user.update({
            where: { id: customer.id },
            data: { name: data.customerName },
          });
        }
      } else {
        // New customer with phone
        customer = await this.prisma.user.create({
          data: {
            phone: data.phone,
            name: data.customerName,
            role: Role.CUSTOMER,
            isActive: true,
          },
        });
      }
    } else {
      // Guest without phone — create anonymous customer
      customer = await this.prisma.user.create({
        data: {
          name: data.customerName,
          role: Role.CUSTOMER,
          isActive: true,
        },
      });
    }

    // ── 2. Validate services ────────────────────────────────────
    const services = await this.prisma.service.findMany({
      where: { id: { in: data.serviceIds }, salonId },
    });

    if (services.length === 0) {
      throw new BadRequestException('Không tìm thấy dịch vụ hợp lệ');
    }

    const totalAmount = services.reduce((acc, s) => acc + Number(s.price), 0);
    const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);

    const now = dayjs().tz(VIETNAM_TZ);
    const todayDate = this.toDateOnly(now.format('YYYY-MM-DD'));
    const currentTimeSlot = now.format('HH:mm');

    // ── 3. Auto-assign available barber if none selected ────────
    let resolvedStaffId: string | null = data.staffId || null;
    let autoAssigned = false;

    if (!resolvedStaffId) {
      const barberPositions = [
        StaffPosition.BARBER,
        StaffPosition.STYLIST,
        StaffPosition.SENIOR_STYLIST,
        StaffPosition.MASTER_STYLIST,
      ];

      // Get all active barbers with their today's load
      const candidates = await this.prisma.staff.findMany({
        where: {
          salonId,
          isActive: true,
          position: { in: barberPositions as any },
        },
        include: {
          shifts: { where: { date: todayDate } },
          leaves: {
            where: {
              startDate: { lte: todayDate },
              endDate: { gte: todayDate },
              status: 'APPROVED',
            },
          },
          // Check bookings at current time slot to determine availability
          bookings: {
            where: {
              date: todayDate,
              timeSlot: currentTimeSlot,
              status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
            },
          },
        },
      });

      // Filter to only truly available barbers (has shift, no leave, not busy at slot)
      const available = candidates.filter(
        (s) => s.shifts.length > 0 && s.leaves.length === 0 && s.bookings.length === 0,
      );

      if (available.length > 0) {
        // Pick the one with fewest CONFIRMED/IN_PROGRESS bookings today (least loaded)
        const withLoad = await Promise.all(
          available.map(async (s) => {
            const todayLoad = await this.prisma.booking.count({
              where: {
                staffId: s.id,
                date: todayDate,
                status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
              },
            });
            return { ...s, todayLoad };
          }),
        );

        const leastLoaded = withLoad.sort((a, b) => a.todayLoad - b.todayLoad)[0];
        resolvedStaffId = leastLoaded.id;
        autoAssigned = true;
      }
      // If no available barber found → proceed with null (cashier will assign later)
    }

    // ── 4. Create booking ───────────────────────────────────────
    const endTime = now.add(totalDuration, 'minute');

    const booking = await this.prisma.booking.create({
      data: {
        bookingCode: `WLK-${now.format('YYMMDD')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        customerId: customer.id,
        // Denormalize for quick display without join
        customerName: data.customerName,
        customerPhone: data.phone || null,
        salonId,
        staffId: resolvedStaffId,
        date: todayDate,
        timeSlot: currentTimeSlot,
        endTime: endTime.format('HH:mm'),
        status: 'CONFIRMED',
        totalAmount,
        totalDuration,
        note: data.note || null,
        services: {
          create: services.map((s) => ({
            serviceId: s.id,
            price: s.price,
            duration: s.duration,
          })),
        },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        services: { include: { service: { select: { name: true } } } },
        staff: { include: { user: { select: { name: true } } } },
      },
    });


    return {
      ...booking,
      autoAssigned,
      assignedStaffName: booking.staff?.user?.name || null,
    };
  }

  // ─── 5. ADD SERVICES TO BOOKING ────────────────────────────

  async addServicesToBooking(
    userId: string,
    bookingId: string,
    serviceIds: string[],
  ) {
    const salonId = await this.getSalonId(userId);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.salonId !== salonId) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      throw new BadRequestException('Không thể thêm dịch vụ cho booking đã hoàn thành/hủy');
    }

    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds }, salonId },
    });

    if (services.length === 0) {
      throw new BadRequestException('Không tìm thấy dịch vụ hợp lệ');
    }

    await this.prisma.bookingService.createMany({
      data: services.map((s) => ({
        bookingId,
        serviceId: s.id,
        price: s.price,
        duration: s.duration,
      })),
    });

    // Recalculate totals
    const allServices = await this.prisma.bookingService.findMany({
      where: { bookingId },
    });
    const newTotal = allServices.reduce((acc, s) => acc + Number(s.price), 0);
    const newDuration = allServices.reduce((acc, s) => acc + s.duration, 0);

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { totalAmount: newTotal, totalDuration: newDuration },
      include: {
        services: { include: { service: { select: { name: true, price: true } } } },
      },
    });
  }

  // ─── 6. CHECKOUT ───────────────────────────────────────────

  async getCheckoutEligibleBookings(userId: string) {
    const salonId = await this.getSalonId(userId);
    // Show bookings from today and recent days (up to 7 days) that still need payment
    const sevenDaysAgo = this.toDateOnly(dayjs().tz(VIETNAM_TZ).subtract(7, 'day').format('YYYY-MM-DD'));

    return this.prisma.booking.findMany({
      where: {
        salonId,
        date: { gte: sevenDaysAgo },
        OR: [
          // Walk-in or bookings in progress/done (not yet paid)
          {
            status: { in: ['CONFIRMED', 'IN_PROGRESS', 'DONE'] },
            paymentStatus: { in: ['UNPAID', 'PENDING'] },
          },
          // Online bookings: only deposit paid
          {
            status: { in: ['CONFIRMED', 'IN_PROGRESS', 'DONE', 'COMPLETED'] },
            paymentStatus: 'DEPOSIT_PAID',
          },
        ],
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
        services: { include: { service: { select: { id: true, name: true, price: true, duration: true } } } },
        staff: { include: { user: { select: { name: true, avatar: true } } } },
        payments: { select: { id: true, amount: true, type: true, status: true } },
      },
      orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }],
    });
  }

  async checkoutBooking(
    userId: string,
    bookingId: string,
    data: { method: PaymentMethod },
  ) {
    const salonId = await this.getSalonId(userId);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payments: true },
    });

    if (!booking || booking.salonId !== salonId) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    // Block only fully-paid COMPLETED or CANCELLED bookings
    if (booking.status === 'COMPLETED' && booking.paymentStatus === 'PAID') {
      throw new BadRequestException('Booking đã được thanh toán đầy đủ');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Không thể thanh toán booking đã hủy');
    }

    // Calculate how much has already been paid (deposits)
    const totalPaid = booking.payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAmount = Number(booking.totalAmount);
    const remainingAmount = totalAmount - totalPaid;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          paymentMethod: data.method,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          services: { include: { service: { select: { name: true, price: true } } } },
          staff: { include: { user: { select: { name: true } } } },
        },
      });

      // Create payment record for the remaining amount (or full if nothing was paid)
      await tx.payment.create({
        data: {
          bookingId,
          amount: remainingAmount > 0 ? remainingAmount : totalAmount,
          method: data.method,
          type: totalPaid > 0 ? 'FINAL' : 'FULL',
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      return updated;
    });
  }

  // ─── 6B. PAYMENT HISTORY ────────────────────────────────────

  async getPaymentHistory(
    userId: string,
    filters: { date?: string },
  ) {
    const salonId = await this.getSalonId(userId);
    const targetDate = filters.date
      ? this.toDateOnly(filters.date)
      : this.todayDate();

    const bookings = await this.prisma.booking.findMany({
      where: {
        salonId,
        date: targetDate,
        paymentStatus: { in: ['PAID', 'DEPOSIT_PAID'] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
        staff: { include: { user: { select: { name: true } } } },
        services: { include: { service: { select: { name: true, price: true } } } },
        payments: {
          where: { status: 'PAID' },
          orderBy: { paidAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Summary stats
    const allPayments = bookings.flatMap(b => b.payments);
    const totalCash = allPayments
      .filter(p => p.method === 'CASH')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalTransfer = allPayments
      .filter(p => p.method === 'VIETQR' || p.method === 'BANK_TRANSFER')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAmount = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      bookings,
      summary: {
        totalTransactions: bookings.length,
        totalAmount,
        totalCash,
        totalTransfer,
        totalPayments: allPayments.length,
      },
    };
  }

  // ─── 7. REVENUE ────────────────────────────────────────────

  async getRevenue(userId: string) {
    const salonId = await this.getSalonId(userId);
    const now = dayjs().tz(VIETNAM_TZ);
    const today = this.toDateOnly(now.format('YYYY-MM-DD'));
    const startOfWeek = this.toDateOnly(now.startOf('week').format('YYYY-MM-DD'));
    const startOfMonth = this.toDateOnly(now.startOf('month').format('YYYY-MM-DD'));

    const completedWhere = { salonId, status: BookingStatus.COMPLETED };

    const [todayRev, weekRev, monthRev, todayCount, byMethod] =
      await Promise.all([
        this.prisma.booking.aggregate({
          where: { ...completedWhere, date: today },
          _sum: { totalAmount: true },
        }),
        this.prisma.booking.aggregate({
          where: { ...completedWhere, date: { gte: startOfWeek } },
          _sum: { totalAmount: true },
        }),
        this.prisma.booking.aggregate({
          where: { ...completedWhere, date: { gte: startOfMonth } },
          _sum: { totalAmount: true },
        }),
        this.prisma.booking.count({
          where: { ...completedWhere, date: today },
        }),
        this.prisma.payment.groupBy({
          by: ['method'],
          where: {
            booking: { salonId, status: 'COMPLETED', date: today },
            status: 'PAID',
          },
          _sum: { amount: true },
          _count: { _all: true },
        }),
      ]);

    // Revenue by service (today)
    const byService = await this.prisma.bookingService.findMany({
      where: {
        booking: { salonId, status: 'COMPLETED', date: today },
      },
      include: { service: { select: { name: true } } },
    });

    const serviceMap: Record<string, { name: string; revenue: number; count: number }> = {};
    for (const bs of byService) {
      const key = bs.serviceId;
      if (!serviceMap[key]) {
        serviceMap[key] = { name: bs.service.name, revenue: 0, count: 0 };
      }
      serviceMap[key].revenue += Number(bs.price);
      serviceMap[key].count += 1;
    }

    // Revenue by staff (today)
    const byStaff = await this.prisma.booking.findMany({
      where: { ...completedWhere, date: today, staffId: { not: null } },
      select: {
        staffId: true,
        totalAmount: true,
        staff: { select: { id: true, user: { select: { name: true, avatar: true } } } },
      },
    });

    const staffMap: Record<string, { name: string; avatar: string | null; revenue: number; count: number }> = {};
    for (const b of byStaff) {
      const s = b as any;
      if (!s.staffId || !s.staff) continue;
      if (!staffMap[s.staffId]) {
        staffMap[s.staffId] = {
          name: s.staff.user?.name || 'N/A',
          avatar: s.staff.user?.avatar || null,
          revenue: 0,
          count: 0,
        };
      }
      staffMap[s.staffId].revenue += Number(s.totalAmount);
      staffMap[s.staffId].count += 1;
    }

    // 7-day trend
    const trend: { date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = this.toDateOnly(now.subtract(i, 'day').format('YYYY-MM-DD'));
      const rev = await this.prisma.booking.aggregate({
        where: { ...completedWhere, date: d },
        _sum: { totalAmount: true },
      });
      trend.push({
        date: dayjs(d).format('YYYY-MM-DD'),
        amount: Number(rev._sum.totalAmount || 0),
      });
    }

    return {
      stats: {
        today: Number(todayRev._sum.totalAmount || 0),
        week: Number(weekRev._sum.totalAmount || 0),
        month: Number(monthRev._sum.totalAmount || 0),
        todayTransactions: todayCount,
      },
      byMethod: byMethod.map((m) => ({
        method: m.method,
        amount: Number(m._sum.amount || 0),
        count: m._count._all,
      })),
      byService: Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue),
      byStaff: Object.values(staffMap).sort((a, b) => b.revenue - a.revenue),
      trend,
    };
  }

  // ─── 8. QUEUE ──────────────────────────────────────────────

  async getQueue(userId: string) {
    const salonId = await this.getSalonId(userId);
    return (this.prisma as any).waitingQueue.findMany({
      where: { salonId, status: { in: ['WAITING', 'SERVING'] } },
      include: {
        service: { select: { id: true, name: true, duration: true } },
        staff: { include: { user: { select: { name: true, avatar: true } } } },
      },
      orderBy: { arrivalTime: 'asc' },
    });
  }

  async addToQueue(
    userId: string,
    data: { customerName: string; phone?: string; serviceId?: string; staffId?: string },
  ) {
    const salonId = await this.getSalonId(userId);
    return (this.prisma as any).waitingQueue.create({
      data: {
        salonId,
        customerName: data.customerName,
        phone: data.phone || null,
        serviceId: data.serviceId || null,
        staffId: data.staffId || null,
        status: 'WAITING',
      },
      include: {
        service: { select: { name: true } },
        staff: { include: { user: { select: { name: true } } } },
      },
    });
  }

  async updateQueueStatus(
    userId: string,
    id: string,
    status: string,
    staffId?: string,
  ) {
    const salonId = await this.getSalonId(userId);
    const item = await (this.prisma as any).waitingQueue.findUnique({ where: { id } });

    if (!item || item.salonId !== salonId) {
      throw new NotFoundException('Không tìm thấy mục trong hàng chờ');
    }

    return (this.prisma as any).waitingQueue.update({
      where: { id },
      data: { status, ...(staffId ? { staffId } : {}) },
    });
  }

  // ─── 9. STATUS CONTROL ─────────────────────────────────────

  async updateBookingStatus(
    userId: string,
    bookingId: string,
    status: BookingStatus,
  ) {
    const salonId = await this.getSalonId(userId);
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.salonId !== salonId) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    const data: any = { status };
    if (status === 'CANCELLED') {
      data.cancelledBy = 'CASHIER';
      data.cancelledAt = new Date();
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data,
      include: {
        customer: { select: { name: true } },
      },
    });
  }

  // ─── 10. AVAILABLE BARBERS ─────────────────────────────────

  async getAvailableBarbers(userId: string, date: string, timeSlot: string) {
    const salonId = await this.getSalonId(userId);
    const targetDate = this.toDateOnly(date);

    const barberPositions = [
      StaffPosition.BARBER,
      StaffPosition.STYLIST,
      StaffPosition.SENIOR_STYLIST,
      StaffPosition.MASTER_STYLIST,
    ];

    const staffList = await this.prisma.staff.findMany({
      where: {
        salonId,
        isActive: true,
        position: { in: barberPositions as any },
      },
      include: {
        user: { select: { name: true, avatar: true } },
        shifts: { where: { date: targetDate } },
        leaves: {
          where: {
            startDate: { lte: targetDate },
            endDate: { gte: targetDate },
            status: 'APPROVED',
          },
        },
        bookings: {
          where: {
            date: targetDate,
            timeSlot,
            status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          },
        },
      },
    });

    return staffList.map((s) => ({
      id: s.id,
      name: s.user.name,
      avatar: s.user.avatar,
      position: s.position,
      rating: s.rating,
      isAvailable:
        s.shifts.length > 0 && s.leaves.length === 0 && s.bookings.length === 0,
      reason:
        s.leaves.length > 0
          ? 'Nghỉ phép'
          : s.shifts.length === 0
            ? 'Không có ca'
            : s.bookings.length > 0
              ? 'Đang bận'
              : 'Rảnh',
    }));
  }

  // ─── 11. CUSTOMER SEARCH ───────────────────────────────────

  async searchCustomers(userId: string, query: string) {
    const salonId = await this.getSalonId(userId);
    if (!query || query.length < 2) return [];

    return this.prisma.user.findMany({
      where: {
        role: Role.CUSTOMER,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        avatar: true,
      },
      take: 10,
    });
  }
}
