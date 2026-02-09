import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Role, BookingStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      totalUsers,
      totalSalons,
      totalBookings,
      todayBookings,
      monthBookings,
      lastMonthBookings,
      monthRevenue,
      lastMonthRevenue,
      pendingBookings,
      recentBookings,
    ] = await Promise.all([
      this.prisma.user.count(),
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
      this.prisma.booking.count({
        where: { status: BookingStatus.PENDING },
      }),
      this.prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true },
          },
          salon: {
            select: { name: true },
          },
        },
      }),
    ]);

    const bookingGrowth =
      lastMonthBookings > 0
        ? ((monthBookings - lastMonthBookings) / lastMonthBookings) * 100
        : 100;

    const lastMonthRevenueNum = Number(lastMonthRevenue._sum.amount || 0);
    const monthRevenueNum = Number(monthRevenue._sum.amount || 0);
    const revenueGrowth =
      lastMonthRevenueNum > 0
        ? ((monthRevenueNum - lastMonthRevenueNum) / lastMonthRevenueNum) * 100
        : 100;

    return {
      totalUsers,
      totalSalons,
      totalBookings,
      todayBookings,
      monthBookings,
      bookingGrowth: Math.round(bookingGrowth * 100) / 100,
      monthRevenue: monthRevenueNum,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
      pendingBookings,
      recentBookings,
    };
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

    return {
      total: total._sum.amount || 0,
      transactionCount: total._count,
      byMethod: byMethod.map(m => ({
        method: m.method,
        amount: m._sum.amount || 0,
        count: m._count,
      })),
      timeline,
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
    skip?: number;
    take?: number;
    role?: Role;
    search?: string;
  }) {
    const { skip = 0, take = 20, role, search } = params;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
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
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async getAllSalons(params: {
    skip?: number;
    take?: number;
    city?: string;
    isActive?: boolean;
  }) {
    const { skip = 0, take = 20, city, isActive } = params;

    const where: any = {};
    if (city) where.city = city;
    if (isActive !== undefined) where.isActive = isActive;

    const [salons, total] = await Promise.all([
      this.prisma.salon.findMany({
        where,
        skip,
        take,
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
            },
          },
        },
      }),
      this.prisma.salon.count({ where }),
    ]);

    return {
      data: salons,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async getAllBookings(params: {
    skip?: number;
    take?: number;
    status?: BookingStatus;
    salonId?: string;
  }) {
    const { skip = 0, take = 20, status, salonId } = params;

    const where: any = {};
    if (status) where.status = status;
    if (salonId) where.salonId = salonId;

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { name: true, phone: true, email: true },
          },
          salon: {
            select: { id: true, name: true },
          },
          staff: {
            select: { id: true, user: { select: { name: true } } },
          },
          services: {
            include: {
              service: {
                select: { name: true, price: true },
              },
            },
          },
          payment: {
            select: { status: true, method: true, amount: true },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      bookings: bookings.map(b => ({
        ...b,
        staff: b.staff ? { id: b.staff.id, name: b.staff.user?.name || 'N/A' } : null,
        services: b.services.map(s => ({
          name: s.service.name,
          price: s.service.price,
        })),
      })),
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async updateBookingStatus(bookingId: string, status: BookingStatus) {
    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        customer: {
          select: { name: true, email: true, phone: true },
        },
        salon: {
          select: { name: true },
        },
      },
    });

    return booking;
  }

  async getAllStaff(params: {
    skip?: number;
    take?: number;
    salonId?: string;
    search?: string;
  }) {
    const { skip = 0, take = 20, salonId, search } = params;

    const where: any = {};
    if (salonId) where.salonId = salonId;
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
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
      data: staff.map(s => ({
        id: s.id,
        name: s.user.name,
        phone: s.user.phone,
        email: s.user.email,
        avatar: s.user.avatar,
        position: s.position,
        bio: s.bio,
        rating: s.rating,
        totalReviews: s.totalReviews,
        totalBookings: s._count.bookings,
        isActive: s.isActive,
        salon: s.salon,
        createdAt: s.createdAt,
      })),
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async getAllServices(params: {
    skip?: number;
    take?: number;
    salonId?: string;
    category?: string;
  }) {
    const { skip = 0, take = 20, salonId, category } = params;

    const where: any = {};
    if (salonId) where.salonId = salonId;
    if (category) where.category = category;

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take,
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
        price: s.price,
        duration: s.duration,
        category: s.category,
        image: s.image,
        isActive: s.isActive,
        order: s.order,
        totalBookings: s._count.bookingServices,
        salon: s.salon,
        createdAt: s.createdAt,
      })),
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async getAllReviews(params: {
    skip?: number;
    take?: number;
    salonId?: string;
    rating?: number;
  }) {
    const { skip = 0, take = 20, salonId, rating } = params;

    const where: any = {};
    if (salonId) where.salonId = salonId;
    if (rating) where.rating = rating;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take,
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
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }
}
