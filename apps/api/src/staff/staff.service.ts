import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Staff, Role, User } from '@prisma/client';

import { BaseQueryService } from '../common/services/base-query.service';
import { StaffQueryDto } from './dto/staff-query.dto';

@Injectable()
export class StaffService extends BaseQueryService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(dto: CreateStaffDto, currentUser: User): Promise<Staff> {
    // Verify salon ownership
    await this.verifySalonOwnership(dto.salonId, currentUser);

    // Check if user is already staff somewhere
    const existingStaff = await this.prisma.staff.findUnique({
      where: { userId: dto.userId },
    });

    if (existingStaff) {
      throw new ConflictException('User is already staff at another salon');
    }

    // Update user role to STAFF
    await this.prisma.user.update({
      where: { id: dto.userId },
      data: { role: Role.STAFF },
    });

    // Create staff record
    const staff = await this.prisma.staff.create({
      data: {
        userId: dto.userId,
        salonId: dto.salonId,
        position: dto.position,
        bio: dto.bio,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    // Create default schedule (all days working)
    const defaultSchedule = [0, 1, 2, 3, 4, 5, 6].map(dayOfWeek => ({
      staffId: staff.id,
      dayOfWeek,
      startTime: '08:30',
      endTime: '20:30',
      isOff: dayOfWeek === 0, // Sunday off by default
    }));

    await this.prisma.staffSchedule.createMany({
      data: defaultSchedule,
    });

    return staff;
  }

  async findAll(query: StaffQueryDto) {
    const {
      salonId,
      isActive = true,
      minRating,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = { isActive };

    if (salonId) where.salonId = salonId;
    if (minRating) where.rating = { gte: minRating };

    if (search) {
      where.OR = [
        { position: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' };

    const [staff, total] = await Promise.all([
      this.prisma.staff.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          salon: {
            select: {
              id: true,
              name: true,
            },
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
      meta: this.getPaginationMeta(total, query),
    };
  }

  async getTopBarbers(limit: number = 10) {
    const staff = await this.prisma.staff.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { name: true, avatar: true }
        },
        _count: {
          select: {
            bookings: {
              where: { status: 'COMPLETED' }
            }
          }
        }
      }
    });

    const ranking = staff.map(barber => {
      const avgRating = barber.rating || 0;
      const totalReviews = barber.totalReviews || 0;
      const totalBookings = barber._count.bookings;

      // rankingScore = (averageRating * 0.6) + (log(totalReviews + 1) * 0.2) + (log(totalBookings + 1) * 0.2)
      const rankingScore = (avgRating * 0.6) +
        (Math.log(totalReviews + 1) * 0.2) +
        (Math.log(totalBookings + 1) * 0.2);

      return {
        id: barber.id,
        name: barber.user.name,
        avatar: barber.user.avatar,
        averageRating: avgRating,
        totalReviews,
        totalBookings,
        rankingScore
      };
    });

    return ranking.sort((a, b) => b.rankingScore - a.rankingScore).slice(0, limit);
  }

  async getBarberOfTheMonth() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyBookings = await this.prisma.booking.groupBy({
      by: ['staffId'],
      _count: { id: true },
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
        status: 'COMPLETED',
        staffId: { not: null }
      }
    });

    const monthlyReviews = await this.prisma.review.groupBy({
      by: ['staffId'],
      _count: { id: true },
      _avg: { rating: true },
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
        isVisible: true,
        staffId: { not: null }
      }
    });

    const staff = await this.prisma.staff.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, avatar: true } }
      }
    });

    const monthlyRanking = staff.map(barber => {
      const bStat = monthlyBookings.find(b => b.staffId === barber.id);
      const rStat = monthlyReviews.find(r => r.staffId === barber.id);

      const totalMonthlyBookings = bStat?._count.id || 0;
      const totalMonthlyReviews = rStat?._count.id || 0;
      const avgMonthlyRating = rStat?._avg.rating || 0;

      const rankingScore = (avgMonthlyRating * 0.6) +
        (Math.log(totalMonthlyReviews + 1) * 0.2) +
        (Math.log(totalMonthlyBookings + 1) * 0.2);

      return {
        id: barber.id,
        name: barber.user.name,
        avatar: barber.user.avatar,
        averageRating: avgMonthlyRating,
        totalReviews: totalMonthlyReviews,
        totalBookings: totalMonthlyBookings,
        rankingScore,
        month: now.getMonth() + 1,
        year: now.getFullYear()
      };
    });

    const winner = monthlyRanking.sort((a, b) => b.rankingScore - a.rankingScore)[0];
    return winner || null;
  }

  async getBarberHistory(limit: number = 6) {
    const history = [];
    const now = new Date();

    for (let i = 1; i <= limit; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);

      const monthlyBookings = await this.prisma.booking.groupBy({
        by: ['staffId'],
        _count: { id: true },
        where: {
          date: { gte: startOfMonth, lte: endOfMonth },
          status: 'COMPLETED',
          staffId: { not: null }
        }
      });

      const monthlyReviews = await this.prisma.review.groupBy({
        by: ['staffId'],
        _count: { id: true },
        _avg: { rating: true },
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          isVisible: true,
          staffId: { not: null }
        }
      });

      const staff = await this.prisma.staff.findMany({
        where: { isActive: true },
        include: {
          user: { select: { name: true, avatar: true } }
        }
      });

      const monthlyRanking = staff.map(barber => {
        const bStat = monthlyBookings.find(b => b.staffId === barber.id);
        const rStat = monthlyReviews.find(r => r.staffId === barber.id);

        const totalMonthlyBookings = bStat?._count.id || 0;
        const totalMonthlyReviews = rStat?._count.id || 0;
        const avgMonthlyRating = rStat?._avg.rating || 0;

        const rankingScore = (avgMonthlyRating * 0.6) +
          (Math.log(totalMonthlyReviews + 1) * 0.2) +
          (Math.log(totalMonthlyBookings + 1) * 0.2);

        return {
          id: barber.id,
          name: barber.user.name,
          avatar: barber.user.avatar,
          averageRating: avgMonthlyRating,
          totalReviews: totalMonthlyReviews,
          totalBookings: totalMonthlyBookings,
          rankingScore,
          month,
          year
        };
      });

      const winner = monthlyRanking.sort((a, b) => b.rankingScore - a.rankingScore)[0];
      if (winner && winner.rankingScore > 0) {
        history.push(winner);
      }
    }

    return history;
  }

  async findAllBySalon(salonId: string, includeInactive = false) {
    const where: any = { salonId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.staff.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        schedules: {
          orderBy: { dayOfWeek: 'asc' },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<Staff> {
    const staff = await this.prisma.staff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
        schedules: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException(`Staff with ID ${id} not found`);
    }

    return staff;
  }

  async update(id: string, dto: UpdateStaffDto, currentUser: User): Promise<Staff> {
    const staff = await this.findOne(id);

    // Verify salon ownership
    await this.verifySalonOwnership(staff.salonId, currentUser);

    return this.prisma.staff.update({
      where: { id },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updateSchedule(
    staffId: string,
    schedules: UpdateScheduleDto[],
    currentUser: User
  ): Promise<void> {
    const staff = await this.findOne(staffId);

    // Verify salon ownership
    await this.verifySalonOwnership(staff.salonId, currentUser);

    // Update each schedule
    await Promise.all(
      schedules.map(schedule =>
        this.prisma.staffSchedule.upsert({
          where: {
            staffId_dayOfWeek: {
              staffId,
              dayOfWeek: schedule.dayOfWeek,
            },
          },
          update: {
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isOff: schedule.isOff,
          },
          create: {
            staffId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isOff: schedule.isOff,
          },
        })
      )
    );
  }

  async toggleActive(id: string, currentUser: User): Promise<Staff> {
    const staff = await this.findOne(id);

    // Verify salon ownership
    await this.verifySalonOwnership(staff.salonId, currentUser);

    return this.prisma.staff.update({
      where: { id },
      data: { isActive: !staff.isActive },
    });
  }

  async delete(id: string, currentUser: User): Promise<void> {
    const staff = await this.findOne(id);

    // Verify salon ownership
    await this.verifySalonOwnership(staff.salonId, currentUser);

    // Update user role back to CUSTOMER
    await this.prisma.user.update({
      where: { id: staff.userId },
      data: { role: Role.CUSTOMER },
    });

    await this.prisma.staff.delete({ where: { id } });
  }

  async getStaffAnalytics(staffId: string) {
    const staff = await this.findOne(staffId);

    const [bookingsCount, completedBookings, totalRevenue, reviews] = await Promise.all([
      this.prisma.booking.count({ where: { staffId } }),
      this.prisma.booking.findMany({
        where: { staffId, status: 'COMPLETED' },
        select: { totalAmount: true },
      }),
      this.prisma.booking.aggregate({
        where: { staffId, status: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
      this.prisma.review.aggregate({
        where: { staffId } as any,
        _avg: { rating: true },
        _count: { rating: true } as any,
      }),
    ]);

    // Monthly revenue logic (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await this.prisma.booking.groupBy({
      by: ['date'],
      where: {
        staffId,
        status: 'COMPLETED',
        date: { gte: sixMonthsAgo },
      },
      _sum: { totalAmount: true },
    });

    return {
      stats: {
        totalBookings: bookingsCount,
        completedBookings: completedBookings.length,
        totalRevenue: Number(totalRevenue._sum?.totalAmount || 0),
        avgRating: Number(reviews._avg?.rating || 0).toFixed(1),
        totalReviews: (reviews._count as any)?.rating || 0,
      },
      monthlyRevenue: monthlyRevenue.map(item => ({
        date: item.date,
        revenue: Number(item._sum?.totalAmount || 0),
      })),
    };
  }

  async registerLeave(staffId: string, dto: { startDate: Date; endDate: Date; reason?: string }, user: User) {
    const staff = await this.findOne(staffId);
    await this.verifySalonOwnership(staff.salonId, user);

    return (this.prisma as any).staffLeave.create({
      data: {
        staffId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        reason: dto.reason,
        status: 'APPROVED', // Auto-approved if salon owner/admin creates it
      },
    });
  }

  async getLeaves(staffId: string) {
    return (this.prisma as any).staffLeave.findMany({
      where: { staffId },
      orderBy: { startDate: 'desc' },
    });
  }

  async getAvailableSlots(staffId: string, date: Date): Promise<string[]> {
    const staff = await this.findOne(staffId);

    // Check if staff has leave on this date
    // Zero out time for date comparison with @db.Date
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    const onLeave = await (this.prisma as any).staffLeave.findFirst({
      where: {
        staffId,
        startDate: { lte: searchDate },
        endDate: { gte: searchDate },
        status: 'APPROVED',
      },
    });

    if (onLeave) return [];

    const salon = await this.prisma.salon.findUnique({
      where: { id: staff.salonId },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    const dayOfWeek = searchDate.getDay();
    const schedule = await this.prisma.staffSchedule.findUnique({
      where: {
        staffId_dayOfWeek: {
          staffId,
          dayOfWeek,
        },
      },
    });

    // Staff is off this day
    if (!schedule || schedule.isOff) {
      return [];
    }

    // Get existing bookings for this staff on this date
    const bookings = await this.prisma.booking.findMany({
      where: {
        staffId,
        date: searchDate,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: {
        timeSlot: true,
        endTime: true,
      },
    });

    const slots = this.generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      30 // 30-minute intervals
    );

    // Filter out booked slots
    const availableSlots = slots.filter(slot => {
      return !bookings.some(booking => {
        const slotTime = this.timeToMinutes(slot);
        const bookingStart = this.timeToMinutes(booking.timeSlot);
        const bookingEnd = this.timeToMinutes(booking.endTime);
        return slotTime >= bookingStart && slotTime < bookingEnd;
      });
    });

    return availableSlots;
  }

  private generateTimeSlots(startTime: string, endTime: string, intervalMinutes: number): string[] {
    const slots: string[] = [];
    let current = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    while (current < end) {
      slots.push(this.minutesToTime(current));
      current += intervalMinutes;
    }

    return slots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private async verifySalonOwnership(salonId: string, user: User): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) {
      return;
    }

    const salon = await this.prisma.salon.findUnique({
      where: { id: salonId },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID ${salonId} not found`);
    }

    if (salon.ownerId !== user.id) {
      throw new ForbiddenException('You can only manage staff for your own salon');
    }
  }
}
