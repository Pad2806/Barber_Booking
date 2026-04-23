import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Role, BookingStatus, PaymentStatus, User, ShiftType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';
import { BookingsService } from '../bookings/bookings.service';
import { BookingQueryDto } from '../bookings/dto/booking-query.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

import { BaseQueryService } from '../common/services/base-query.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AdminService extends BaseQueryService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
    private readonly settingsService: SettingsService,
  ) {
    super();
  }


  async getAllBookings(query: BookingQueryDto) {
    return this.bookingsService.findAll(query);
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus, user: User) {
    return this.bookingsService.updateStatus(bookingId, { status }, user);
  }

  async bulkUpdateBookingStatus(ids: string[], status: BookingStatus, user: User) {
    return this.bookingsService.bulkUpdateStatus(ids, status, user);
  }

  async exportBookings(query: BookingQueryDto) {
    return this.bookingsService.exportToExcel(query);
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalCustomers,
      lastMonthCustomers,
      totalStaff,
      totalSalons,
      totalBookings,
      todayBookings,
      yesterdayBookings,
      monthBookings,
      lastMonthBookings,
      monthRevenue,
      lastMonthRevenue,
      todayRevenue,
      yesterdayRevenue,
      pendingBookings,
      recentBookings,
      topServices,
      activityFeed,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.CUSTOMER } }),
      this.prisma.user.count({
        where: {
          role: Role.CUSTOMER,
          createdAt: { lt: startOfMonth }
        }
      }),
      this.prisma.staff.count({ where: { isActive: true } }),
      this.prisma.salon.count({ where: { isActive: true } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: {
          date: today,
          status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
        },
      }),
      this.prisma.booking.count({
        where: {
          date: yesterday,
          status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
        },
      }),
      this.prisma.booking.count({
        where: {
          createdAt: { gte: startOfMonth },
          status: { notIn: [BookingStatus.CANCELLED] },
        },
      }),
      this.prisma.booking.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
          status: { notIn: [BookingStatus.CANCELLED] },
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paidAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paidAt: { gte: today },
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paidAt: {
            gte: yesterday,
            lt: today,
          },
        },
        _sum: { amount: true },
      }),
      this.prisma.booking.count({
        where: { status: BookingStatus.PENDING },
      }),
      this.prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, avatar: true } },
          salon: { select: { name: true } },
        },
      }),
      this.getTopServicesInternal(5),
      this.getActivityFeedInternal(15),
    ]);

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const monthRevenueNum = Number(monthRevenue._sum.amount || 0);
    const lastMonthRevenueNum = Number(lastMonthRevenue._sum.amount || 0);
    const todayRevenueNum = Number(todayRevenue._sum.amount || 0);
    const yesterdayRevenueNum = Number(yesterdayRevenue._sum.amount || 0);

    return {
      // Main Stats
      todayBookings,
      todayBookingsGrowth: calculateGrowth(todayBookings, yesterdayBookings),
      todayRevenue: todayRevenueNum,
      todayRevenueGrowth: calculateGrowth(todayRevenueNum, yesterdayRevenueNum),
      monthRevenue: monthRevenueNum,
      monthRevenueGrowth: calculateGrowth(monthRevenueNum, lastMonthRevenueNum),
      totalCustomers,
      customerGrowth: calculateGrowth(totalCustomers, lastMonthCustomers),
      totalStaff,
      totalSalons,

      // Additional Info
      totalBookings,
      pendingBookings,
      monthBookings,
      bookingGrowth: calculateGrowth(monthBookings, lastMonthBookings),

      // Charts & Feeds
      recentBookings: recentBookings.map(b => ({
        ...b,
        totalAmount: Number(b.totalAmount),
      })),
      topServices,
      activityFeed,
    };
  }

  private async getTopServicesInternal(limit: number = 5) {
    const services = await this.prisma.bookingService.groupBy({
      by: ['serviceId'],
      _count: { serviceId: true },
      orderBy: { _count: { serviceId: 'desc' } },
      take: limit,
    });

    const serviceDetails = await Promise.all(
      services.map(async (s) => {
        const detail = await this.prisma.service.findUnique({
          where: { id: s.serviceId },
          select: { name: true, category: true },
        });
        return {
          name: detail?.name || 'Unknown',
          category: detail?.category || 'General',
          count: s._count.serviceId,
        };
      }),
    );

    return serviceDetails;
  }

  private async getActivityFeedInternal(limit: number = 15) {
    const [bookings, reviews, users] = await Promise.all([
      this.prisma.booking.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
          salon: { select: { name: true } },
        },
      }),
      this.prisma.review.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true } },
        },
      }),
      this.prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        where: { role: Role.CUSTOMER },
      }),
    ]);

    const feed = [
      ...bookings.map(b => ({
        type: 'BOOKING',
        title: 'Đặt lịch mới',
        description: `${b.customer?.name} đã đặt lịch tại ${b.salon?.name}`,
        time: b.createdAt,
        status: b.status,
      })),
      ...reviews.map(r => ({
        type: 'REVIEW',
        title: 'Đánh giá mới',
        description: `${r.customer?.name} đã để lại đánh giá ${r.rating} sao`,
        time: r.createdAt,
        rating: r.rating,
      })),
      ...users.map(u => ({
        type: 'USER',
        title: 'Khách hàng mới',
        description: `${u.name} vừa tham gia hệ thống`,
        time: u.createdAt,
      })),
    ];

    return feed.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, limit);
  }

  async getUserStats() {
    const [byRole, newUsersThisMonth, activeUsers] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      this.prisma.user.count({
        where: { isActive: true },
      }),
    ]);

    return {
      byRole: byRole.reduce(
        (acc, r) => {
          acc[r.role] = r._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      newUsersThisMonth,
      activeUsers,
    };
  }

  async getSalonStats() {
    const [activeSalons, topSalons, salonsByCity] = await Promise.all([
      this.prisma.salon.count({ where: { isActive: true } }),
      this.prisma.salon.findMany({
        take: 10,
        include: {
          _count: {
            select: {
              bookings: {
                where: {
                  status: BookingStatus.COMPLETED,
                },
              },
            },
          },
        },
        orderBy: {
          bookings: {
            _count: 'desc',
          },
        },
      }),
      this.prisma.salon.groupBy({
        by: ['city'],
        _count: true,
        orderBy: {
          _count: {
            city: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      activeSalons,
      topSalons: topSalons.map(s => ({
        id: s.id,
        name: s.name,
        bookings: s._count.bookings,
      })),
      salonsByCity: salonsByCity.map(c => ({
        city: c.city,
        count: c._count,
      })),
    };
  }

  async getLeaveRequests(filters: { status?: 'PENDING' | 'APPROVED' | 'REJECTED'; search?: string; salonId?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.salonId) where.staff = { salonId: filters.salonId };
    if (filters.search) {
      where.staff = {
        ...where.staff,
        user: { name: { contains: filters.search, mode: 'insensitive' } }
      };
    }

    return (this.prisma as any).staffLeave.findMany({
      where,
      include: {
        staff: {
          include: {
            user: { select: { name: true, avatar: true } },
            salon: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveLeaveRequest(leaveId: string, status: 'APPROVED' | 'REJECTED', reason?: string) {
    const leave = await (this.prisma as any).staffLeave.findUnique({
      where: { id: leaveId },
      include: { staff: true }
    });

    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (status === 'APPROVED') {
      // Rule: Cannot approve if barber has confirmed bookings on those days
      const conflictCount = await this.prisma.booking.count({
        where: {
          staffId: leave.staffId,
          status: BookingStatus.CONFIRMED,
          date: {
            gte: leave.startDate,
            lte: leave.endDate
          }
        }
      });

      if (conflictCount > 0) {
        throw new Error(`Nhân viên này có ${conflictCount} lịch hẹn đã xác nhận trong thời gian xin nghỉ. Hãy dời lịch trước.`);
      }

      // Auto-create OFF shifts for the period
      let current = dayjs.utc(leave.startDate).startOf('day');
      const end = dayjs.utc(leave.endDate).startOf('day');

      while (current.isBefore(end) || current.isSame(end, 'day')) {
        const date = current.toDate();

        // Delete existing shifts for this day
        await (this.prisma as any).staffShift.deleteMany({
          where: { staffId: leave.staffId, date }
        });

        // Create OFF shift
        await (this.prisma as any).staffShift.create({
          data: {
            staffId: leave.staffId,
            salonId: leave.staff.salonId,
            date,
            type: ShiftType.OFF,
            shiftStart: current.toDate(),
            shiftEnd: current.set('hour', 23).set('minute', 59).toDate(),
          }
        });

        current = current.add(1, 'day');
      }
    } else if (status === 'REJECTED' && leave.status === 'APPROVED') {
      // If we are cancelling an already approved leave, remove the OFF shifts
      await (this.prisma as any).staffShift.deleteMany({
        where: {
          staffId: leave.staffId,
          type: ShiftType.OFF,
          date: {
            gte: dayjs.utc(leave.startDate).startOf('day').toDate(),
            lte: dayjs.utc(leave.endDate).startOf('day').toDate()
          }
        }
      });
    }

    return (this.prisma as any).staffLeave.update({
      where: { id: leaveId },
      data: { status, updatedAt: new Date() }
    });
  }

  async getBookingStats(period: 'week' | 'month' | 'year') {
    const now = new Date();
    let startDate: Date;
    let groupBy: 'day' | 'week' | 'month';

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        groupBy = 'day';
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        groupBy = 'day';
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        groupBy = 'month';
        break;
    }

    const [byStatus, timeline] = await Promise.all([
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      this.getBookingTimeline(startDate, groupBy),
    ]);

    return {
      byStatus: byStatus.reduce(
        (acc, s) => {
          acc[s.status] = s._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      timeline,
    };
  }

  private async getBookingTimeline(
    startDate: Date,
    _groupBy: 'day' | 'week' | 'month',
  ) {
    // This is a simplified version - in production, you'd use raw SQL for better grouping
    const bookings = await this.prisma.booking.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const grouped = bookings.reduce(
      (acc, b) => {
        const dateKey = b.createdAt.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, count: 0, completed: 0, cancelled: 0 };
        }
        acc[dateKey].count++;
        if (b.status === BookingStatus.COMPLETED) acc[dateKey].completed++;
        if (b.status === BookingStatus.CANCELLED) acc[dateKey].cancelled++;
        return acc;
      },
      {} as Record<string, { date: string; count: number; completed: number; cancelled: number }>,
    );

    return Object.values(grouped);
  }

  async getRevenueStats(period: 'week' | 'month' | 'year') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    const [total, byMethod, timeline] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paidAt: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.groupBy({
        by: ['method'],
        where: {
          status: PaymentStatus.PAID,
          paidAt: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.getRevenueTimeline(startDate),
    ]);

    const totalRevenue = Number(total._sum.amount || 0);

    return {
      totalRevenue,
      transactionCount: total._count,
      averageOrderValue: total._count > 0 ? totalRevenue / total._count : 0,
      dailyRevenue: timeline,
      byMethod: byMethod.map(m => ({
        method: m.method,
        amount: Number(m._sum.amount || 0),
        count: m._count,
      })),
      timeline,
    };
  }

  async getAdminRevenueDashboard(params: {
    dateFrom?: string;
    dateTo?: string;
    salonId?: string;
    granularity: 'day' | 'week' | 'month';
    method?: string;
    page: number;
    limit: number;
  }) {
    const { dateFrom, dateTo, salonId, granularity, method, page, limit } = params;
    const VN_TZ = 'Asia/Ho_Chi_Minh';
    const now = dayjs().tz(VN_TZ);

    // Resolve date range
    const endDate = dateTo ? dayjs(dateTo).tz(VN_TZ).endOf('day').toDate()
      : now.endOf('day').toDate();
    const startDate = dateFrom ? dayjs(dateFrom).tz(VN_TZ).startOf('day').toDate()
      : now.subtract(29, 'day').startOf('day').toDate();

    // Compute previous period (same length) for % comparison
    const periodMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(startDate.getTime() - periodMs);

    // Build WHERE for payments
    const paymentWhere: any = {
      status: 'PAID',
      paidAt: { gte: startDate, lte: endDate },
    };
    if (salonId) paymentWhere.booking = { salonId };
    if (method) paymentWhere.method = method;

    const prevPaymentWhere: any = {
      status: 'PAID',
      paidAt: { gte: prevStart, lte: prevEnd },
      ...(salonId ? { booking: { salonId } } : {}),
    };

    // KPI queries
    const [currentAgg, prevAgg, txCount, prevTxCount] = await Promise.all([
      this.prisma.payment.aggregate({ where: paymentWhere, _sum: { amount: true }, _count: true }),
      this.prisma.payment.aggregate({ where: prevPaymentWhere, _sum: { amount: true }, _count: true }),
      this.prisma.payment.count({ where: paymentWhere }),
      this.prisma.payment.count({ where: prevPaymentWhere }),
    ]);

    const totalRevenue = Number(currentAgg._sum.amount || 0);
    const prevRevenue = Number(prevAgg._sum.amount || 0);
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
    const txGrowth = prevTxCount > 0 ? ((txCount - prevTxCount) / prevTxCount) * 100 : null;
    const avgOrder = txCount > 0 ? totalRevenue / txCount : 0;
    const prevAvgOrder = prevTxCount > 0 ? Number(prevAgg._sum.amount || 0) / prevTxCount : 0;
    const avgOrderGrowth = prevAvgOrder > 0 ? ((avgOrder - prevAvgOrder) / prevAvgOrder) * 100 : null;

    // Chart — timeline grouped by granularity
    const allPayments = await this.prisma.payment.findMany({
      where: paymentWhere,
      select: { paidAt: true, amount: true },
      orderBy: { paidAt: 'asc' },
    });

    const chartMap: Record<string, { date: string; amount: number; count: number }> = {};
    for (const p of allPayments) {
      if (!p.paidAt) continue;
      const d = dayjs(p.paidAt).tz(VN_TZ);
      let key: string;
      if (granularity === 'month') key = d.format('YYYY-MM');
      else if (granularity === 'week') {
        const startOfYear = dayjs(p.paidAt).tz(VN_TZ).startOf('year');
        const weekNum = Math.ceil(d.diff(startOfYear, 'day') / 7) + 1;
        key = `${d.year()}-W${String(weekNum).padStart(2, '0')}`;
      }
      else key = d.format('YYYY-MM-DD');

      if (!chartMap[key]) chartMap[key] = { date: key, amount: 0, count: 0 };
      chartMap[key].amount += Number(p.amount);
      chartMap[key].count++;
    }
    const chart = Object.values(chartMap);

    // Breakdown by method
    const byMethod = await this.prisma.payment.groupBy({
      by: ['method'],
      where: paymentWhere,
      _sum: { amount: true },
      _count: { _all: true },
    });

    // Breakdown by salon
    const bySalonRaw = await this.prisma.payment.findMany({
      where: paymentWhere,
      select: {
        amount: true,
        booking: { select: { salonId: true, salon: { select: { name: true, city: true } } } }
      },
    });
    const salonMap: Record<string, { salonId: string; name: string; city?: string; revenue: number; count: number }> = {};
    for (const p of bySalonRaw) {
      const b = (p.booking as any);
      if (!b?.salonId) continue;
      if (!salonMap[b.salonId]) salonMap[b.salonId] = { salonId: b.salonId, name: b.salon?.name || 'N/A', city: b.salon?.city, revenue: 0, count: 0 };
      salonMap[b.salonId].revenue += Number(p.amount);
      salonMap[b.salonId].count++;
    }

    // Breakdown by staff
    const byStaffRaw = await this.prisma.payment.findMany({
      where: paymentWhere,
      select: {
        amount: true,
        booking: { select: { staffId: true, staff: { select: { user: { select: { name: true, avatar: true } } } } } }
      },
    });
    const staffMap: Record<string, { staffId: string; name: string; avatar?: string; revenue: number; count: number }> = {};
    for (const p of byStaffRaw) {
      const b = (p.booking as any);
      if (!b?.staffId) continue;
      if (!staffMap[b.staffId]) staffMap[b.staffId] = { staffId: b.staffId, name: b.staff?.user?.name || 'N/A', avatar: b.staff?.user?.avatar, revenue: 0, count: 0 };
      staffMap[b.staffId].revenue += Number(p.amount);
      staffMap[b.staffId].count++;
    }

    // Breakdown by service
    const byServiceRaw = await this.prisma.bookingService.findMany({
      where: { booking: { payments: { some: { ...paymentWhere } } } },
      select: { serviceId: true, price: true, service: { select: { name: true, category: true } } },
    });
    const serviceMap: Record<string, { serviceId: string; name: string; category?: string; revenue: number; count: number }> = {};
    for (const bs of byServiceRaw) {
      if (!serviceMap[bs.serviceId]) serviceMap[bs.serviceId] = { serviceId: bs.serviceId, name: (bs as any).service?.name || 'N/A', category: (bs as any).service?.category, revenue: 0, count: 0 };
      serviceMap[bs.serviceId].revenue += Number(bs.price);
      serviceMap[bs.serviceId].count++;
    }

    // Paginated transactions
    const skip = (page - 1) * limit;
    const txWhere = { ...paymentWhere };
    const [transactions, totalTx] = await Promise.all([
      this.prisma.payment.findMany({
        where: txWhere,
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        select: {
          id: true,
          amount: true,
          method: true,
          type: true,
          paidAt: true,
          booking: {
            select: {
              id: true,
              timeSlot: true,
              customer: { select: { name: true, phone: true } },
              staff: { select: { user: { select: { name: true } } } },
              salon: { select: { name: true } },
              services: { select: { service: { select: { name: true } } } },
            }
          }
        }
      }),
      this.prisma.payment.count({ where: txWhere }),
    ]);

    return {
      kpi: {
        totalRevenue,
        revenueGrowth,
        transactionCount: txCount,
        txGrowth,
        avgOrderValue: avgOrder,
        avgOrderGrowth,
        period: { from: startDate.toISOString(), to: endDate.toISOString() },
      },
      chart,
      breakdown: {
        byMethod: byMethod.map((m: any) => ({ method: m.method, revenue: Number(m._sum?.amount || 0), count: m._count?._all ?? 0 })),
        bySalon: Object.values(salonMap).sort((a, b) => b.revenue - a.revenue),
        byStaff: Object.values(staffMap).sort((a, b) => b.revenue - a.revenue),
        byService: Object.values(serviceMap).sort((a, b) => b.revenue - a.revenue),
      },
      transactions: {
        data: transactions.map(tx => ({
          id: tx.id,
          amount: Number(tx.amount),
          method: tx.method,
          type: tx.type,
          paidAt: tx.paidAt,
          customerName: (tx.booking as any)?.customer?.name,
          customerPhone: (tx.booking as any)?.customer?.phone,
          staffName: (tx.booking as any)?.staff?.user?.name,
          salonName: (tx.booking as any)?.salon?.name,
          services: (tx.booking as any)?.services?.map((s: any) => s.service?.name).join(', '),
          bookingTime: (tx.booking as any)?.timeSlot,
        })),
        meta: { total: totalTx, page, lastPage: Math.ceil(totalTx / limit), limit },
      },
    };
  }


  private async getRevenueTimeline(startDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: startDate },
      },
      select: {
        paidAt: true,
        amount: true,
      },
      orderBy: { paidAt: 'asc' },
    });

    const grouped = payments.reduce(
      (acc, p) => {
        if (!p.paidAt) return acc;
        const dateKey = p.paidAt.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = { date: dateKey, amount: 0, count: 0 };
        }
        acc[dateKey].amount += Number(p.amount);
        acc[dateKey].count++;
        return acc;
      },
      {} as Record<string, { date: string; amount: number; count: number }>,
    );

    return Object.values(grouped);
  }

  async getAllUsers(params: {
    page?: number;
    limit?: number;
    role?: Role;
    search?: string;
  }) {
    const { role, search } = params;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      Object.assign(where, this.buildSearchWhere(search, ['name', 'email', 'phone']));
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        ...this.getPaginationOptions(params),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          isVerified: true,
          authProvider: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              bookings: true,
              ownedSalons: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: this.getPaginationMeta(total, params),
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        isVerified: true,
        authProvider: true,
        createdAt: true,
        lastLoginAt: true,
        bookings: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            bookingCode: true,
            date: true,
            timeSlot: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            salon: { select: { id: true, name: true } },
            services: {
              select: {
                service: { select: { id: true, name: true } },
                price: true,
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      ...user,
      bookings: user.bookings.map((b) => ({
        ...b,
        totalAmount: Number(b.totalAmount),
        services: b.services.map((s) => ({
          ...s,
          price: Number(s.price),
        })),
      })),
    };
  }

  async getAllSalons(params: {
    page?: number;
    limit?: number;
    city?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const { city, isActive, search } = params;

    const where: any = {};
    if (city) where.city = city;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      Object.assign(where, this.buildSearchWhere(search, ['name', 'address']));
    }

    const [salons, total, averages] = await Promise.all([
      this.prisma.salon.findMany({
        where,
        ...this.getPaginationOptions(params),
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { name: true, email: true },
          },
          _count: {
            select: {
              staff: true,
              services: true,
              bookings: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.salon.count({ where }),
      this.prisma.review.groupBy({
        by: ['salonId'],
        where: { isVisible: true },
        _avg: { rating: true },
      }),
    ]);

    const data = salons.map((salon) => {
      const avg = averages.find((a) => a.salonId === salon.id);
      const rating = Number(avg?._avg?.rating || 0);
      return {
        ...salon,
        averageRating: rating,
        rating: rating,
        totalReviews: salon._count?.reviews || 0,
      };
    });

    return {
      data,
      meta: this.getPaginationMeta(total, params),
    };
  }


  async getStaffById(staffId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true, avatar: true },
        },
        salon: {
          select: { id: true, name: true, address: true },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!staff) {
      throw new Error('Staff not found');
    }

    return staff;
  }

  async getAllStaff(params: {
    page?: number;
    limit?: number;
    salonId?: string;
    minRating?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }) {
    const { salonId, search, minRating, sortBy, sortOrder = 'desc' } = params;

    const where: any = {};
    if (salonId) where.salonId = salonId;
    if (minRating) where.rating = { gte: minRating };
    if (search) {
      Object.assign(where, this.buildSearchWhere(search, ['user.name', 'user.phone', 'user.email']));
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'rating') {
      orderBy = { rating: sortOrder };
    } else if (sortBy === 'bookings') {
      orderBy = { bookings: { _count: sortOrder } };
    } else if (sortBy === 'name') {
      orderBy = { user: { name: sortOrder } };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    }

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        ...this.getPaginationOptions(params),
        orderBy,
        include: {
          user: {
            select: { id: true, name: true, phone: true, email: true, avatar: true },
          },
          salon: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      }),
      this.prisma.staff.count({ where }),
    ]);

    return {
      data: staff,
      meta: this.getPaginationMeta(total, params),
    };
  }

  async getAllServices(params: {
    page?: number;
    limit?: number;
    salonId?: string;
    category?: string;
    search?: string;
  }) {
    const { salonId, category, search } = params;

    const where: any = {};
    if (salonId) where.salonId = salonId;
    if (category) where.category = category;
    if (search) {
      Object.assign(where, this.buildSearchWhere(search, ['name', 'category']));
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        ...this.getPaginationOptions(params),
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        include: {
          salon: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              bookingServices: true,
            },
          },
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: services.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: Number(s.price),
        duration: s.duration,
        category: s.category,
        image: s.image,
        videoUrl: s.videoUrl,
        gallery: s.gallery,
        isActive: s.isActive,
        order: s.order,
        totalBookings: s._count.bookingServices,
        salon: s.salon,
        createdAt: s.createdAt,
      })),
      meta: this.getPaginationMeta(total, params),
    };
  }

  async getAllReviews(params: {
    page?: number;
    limit?: number;
    salonId?: string;
    rating?: number;
    search?: string;
  }) {
    const { salonId, rating, search } = params;

    const where: any = {};
    if (salonId) where.salonId = salonId;
    if (rating) where.rating = rating;
    if (search) {
      Object.assign(where, this.buildSearchWhere(search, ['comment', 'customer.name']));
    }

    const [reviews, total, avgRating, distribution] = await Promise.all([
      this.prisma.review.findMany({
        where,
        ...this.getPaginationOptions(params),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, avatar: true },
          },
          salon: {
            select: { id: true, name: true },
          },
          booking: {
            include: {
              staff: {
                include: {
                  user: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where,
        _count: { _all: true },
      }),
    ]);

    return {
      data: reviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        images: r.images,
        reply: r.reply,
        repliedAt: r.repliedAt,
        isVisible: r.isVisible,
        createdAt: r.createdAt,
        customer: r.customer,
        salon: r.salon,
        staff: r.booking.staff
          ? { id: r.booking.staff.id, name: r.booking.staff.user.name }
          : null,
      })),
      meta: {
        ...this.getPaginationMeta(total, params),
        averageRating: Number(avgRating._avg.rating || 0),
        distribution: (distribution as any[]).reduce(
          (acc, d) => {
            acc[d.rating] = d._count._all;
            return acc;
          },
          {} as Record<number, number>,
        ),
      },
    };
  }

  async getSettings() {
    return this.settingsService.getAll();
  }

  async updateSettings(data: Record<string, any>) {
    return this.settingsService.updateAll(data);
  }

  async resetPassword(userId: string, dto: ResetPasswordDto, admin: User) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Admin ${admin.id} reset password for user ${userId}`);

    return { message: 'Password updated successfully' };
  }

  // ============== BRANCH REVENUE ==============

  async getBranchRevenue(params: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    search?: string;
  }) {
    const now = dayjs().tz(VIETNAM_TZ);
    let startDate: Date;

    switch (params.period || 'month') {
      case 'week':
        startDate = now.subtract(7, 'day').startOf('day').toDate();
        break;
      case 'month':
        startDate = now.startOf('month').toDate();
        break;
      case 'quarter':
        startDate = now.subtract(3, 'month').startOf('month').toDate();
        break;
      case 'year':
        startDate = now.startOf('year').toDate();
        break;
    }

    // Get all active salons
    const salonWhere: any = { isActive: true };
    if (params.search) {
      salonWhere.name = { contains: params.search, mode: 'insensitive' };
    }

    const salons = await this.prisma.salon.findMany({
      where: salonWhere,
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        district: true,
        revenueTarget: true,
        transferTemplate: true,
      },
    });

    // Get paid payments grouped by salon
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: startDate },
        booking: {
          salonId: { in: salons.map(s => s.id) },
        },
      },
      select: {
        amount: true,
        method: true,
        paidAt: true,
        booking: {
          select: { salonId: true },
        },
      },
    });

    // Aggregate per salon
    const revenueMap = new Map<string, {
      totalRevenue: number;
      bookingCount: number;
      cashCount: number;
      transferCount: number;
    }>();

    for (const p of payments) {
      const salonId = p.booking.salonId;
      const existing = revenueMap.get(salonId) || {
        totalRevenue: 0,
        bookingCount: 0,
        cashCount: 0,
        transferCount: 0,
      };
      existing.totalRevenue += Number(p.amount);
      existing.bookingCount++;
      if (p.method === 'CASH') existing.cashCount++;
      else existing.transferCount++;
      revenueMap.set(salonId, existing);
    }

    const totalSystemRevenue = Array.from(revenueMap.values())
      .reduce((sum, r) => sum + r.totalRevenue, 0);

    const branches = salons.map(salon => {
      const rev = revenueMap.get(salon.id) || {
        totalRevenue: 0,
        bookingCount: 0,
        cashCount: 0,
        transferCount: 0,
      };
      const target = salon.revenueTarget ? Number(salon.revenueTarget) : null;
      const percentage = target ? Math.round((rev.totalRevenue / target) * 100) : null;

      return {
        salonId: salon.id,
        salonName: salon.name,
        slug: salon.slug,
        city: salon.city,
        district: salon.district,
        totalRevenue: rev.totalRevenue,
        bookingCount: rev.bookingCount,
        cashCount: rev.cashCount,
        transferCount: rev.transferCount,
        revenueTarget: target,
        percentage,
        transferTemplate: salon.transferTemplate,
      };
    });

    // Sort by revenue descending
    branches.sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      totalSystemRevenue,
      branchCount: salons.length,
      period: params.period || 'month',
      branches,
    };
  }

  async getBranchRevenueDetail(salonId: string, params: {
    period?: 'week' | 'month' | 'quarter' | 'year';
  }) {
    const now = dayjs().tz(VIETNAM_TZ);
    let startDate: Date;

    switch (params.period || 'month') {
      case 'week':
        startDate = now.subtract(7, 'day').startOf('day').toDate();
        break;
      case 'month':
        startDate = now.startOf('month').toDate();
        break;
      case 'quarter':
        startDate = now.subtract(3, 'month').startOf('month').toDate();
        break;
      case 'year':
        startDate = now.startOf('year').toDate();
        break;
    }

    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
      select: { id: true, name: true, revenueTarget: true },
    });

    if (!salon) throw new Error('Salon not found');

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        paidAt: { gte: startDate },
        booking: { salonId },
      },
      select: {
        amount: true,
        method: true,
        paidAt: true,
        transferContent: true,
        booking: {
          select: {
            bookingCode: true,
            customer: { select: { name: true } },
            services: {
              select: { service: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });

    // Daily breakdown
    const dailyMap = new Map<string, { date: string; revenue: number; count: number }>();
    for (const p of payments) {
      if (!p.paidAt) continue;
      const dateKey = dayjs(p.paidAt).tz(VIETNAM_TZ).format('YYYY-MM-DD');
      const existing = dailyMap.get(dateKey) || { date: dateKey, revenue: 0, count: 0 };
      existing.revenue += Number(p.amount);
      existing.count++;
      dailyMap.set(dateKey, existing);
    }

    // Payment method breakdown
    let cashTotal = 0, transferTotal = 0;
    for (const p of payments) {
      if (p.method === 'CASH') cashTotal += Number(p.amount);
      else transferTotal += Number(p.amount);
    }

    return {
      salon: {
        id: salon.id,
        name: salon.name,
        revenueTarget: salon.revenueTarget ? Number(salon.revenueTarget) : null,
      },
      totalRevenue: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      transactionCount: payments.length,
      dailyBreakdown: Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      byMethod: {
        cash: cashTotal,
        transfer: transferTotal,
      },
      transactions: payments.slice(0, 50).map(p => ({
        bookingCode: p.booking.bookingCode,
        customerName: p.booking.customer?.name || 'N/A',
        services: p.booking.services.map(s => s.service.name).join(', '),
        amount: Number(p.amount),
        method: p.method,
        paidAt: p.paidAt,
        transferContent: p.transferContent,
      })),
    };
  }

  // ============== USER ROLES (RBAC) ==============

  async getUserRoles(userId: string) {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        salon: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return roles;
  }

  async updateUserRoles(
    userId: string,
    newRoles: { role: string; salonId?: string | null }[],
  ) {
    // Role priority for determining primary role
    const ROLE_PRIORITY: Record<string, number> = {
      SUPER_ADMIN: 100, SALON_OWNER: 50, MANAGER: 40,
      CASHIER: 25, BARBER: 25, SKINNER: 25, STAFF: 25,
      CUSTOMER: 10,
    };

    // Sanitize: remove legacy STAFF role + deduplicate by role name
    const ALLOWED_ROLES = new Set(['SUPER_ADMIN', 'SALON_OWNER', 'MANAGER', 'CASHIER', 'BARBER', 'SKINNER', 'CUSTOMER']);
    const seen = new Set<string>();
    const sanitizedRoles = newRoles.filter(r => {
      if (!ALLOWED_ROLES.has(r.role)) return false; // block STAFF and unknown roles
      if (seen.has(r.role)) return false;           // deduplicate
      seen.add(r.role);
      return true;
    });

    return this.prisma.$transaction(async (tx) => {
      // Delete all existing roles
      await tx.userRole.deleteMany({ where: { userId } });

      // Create new sanitized roles
      if (sanitizedRoles.length > 0) {
        await tx.userRole.createMany({
          data: sanitizedRoles.map(r => ({
            userId,
            role: r.role as any,
            salonId: r.salonId || null,
          })),
        });
      }

      // Update user.role to highest-priority role (backward compat)
      const primaryRole = sanitizedRoles.length > 0
        ? sanitizedRoles.reduce((best, r) =>
          (ROLE_PRIORITY[r.role] || 0) > (ROLE_PRIORITY[best.role] || 0) ? r : best
        ).role
        : 'CUSTOMER';

      await tx.user.update({
        where: { id: userId },
        data: { role: primaryRole as any },
      });

      return tx.userRole.findMany({
        where: { userId },
        include: { salon: { select: { id: true, name: true, slug: true } } },
      });
    });
  }
}
