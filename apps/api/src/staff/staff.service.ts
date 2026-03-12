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

    await (this.prisma as any).staffWeeklySchedule.createMany({
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

    const { skip, take } = this.getPaginationOptions(query);

    const where: any = { isActive };

    if (salonId) where.salonId = salonId;
    if (minRating) where.rating = { gte: minRating };

    if (search) {
      Object.assign(where, this.buildSearchWhere(search, [
        'position',
        'bio',
        'user.name',
        'user.email',
        'user.phone'
      ]));
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
        weeklySchedules: {
          orderBy: { dayOfWeek: 'asc' },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      } as any,
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
        weeklySchedules: {
          orderBy: { dayOfWeek: 'asc' },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      } as any,
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
        (this.prisma as any).staffWeeklySchedule.upsert({
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
    try {
      const [bookingsCount, completedStats, reviews] = await Promise.all([
        this.prisma.booking.count({ where: { staffId } }),
        this.prisma.booking.aggregate({
          where: { staffId, status: 'COMPLETED' },
          _count: { _all: true },
          _sum: { totalAmount: true },
        }),
        this.prisma.review.aggregate({
          where: { staffId },
          _avg: { rating: true },
          _count: { _all: true },
        }),
      ]);

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const revenueTrend = await this.prisma.booking.groupBy({
        by: ['date'],
        where: {
          staffId,
          status: 'COMPLETED',
          date: { gte: sixMonthsAgo },
        },
        _sum: { totalAmount: true },
        orderBy: { date: 'asc' },
      });

      return {
        stats: {
          totalBookings: bookingsCount || 0,
          completedBookings: completedStats?._count?._all || 0,
          totalRevenue: completedStats?._sum?.totalAmount ? Number(completedStats._sum.totalAmount) : 0,
          avgRating: reviews?._avg?.rating ? Number(reviews._avg.rating).toFixed(1) : "5.0",
          totalReviews: reviews?._count?._all || 0,
        },
        monthlyRevenue: (revenueTrend || []).map(item => ({
          date: item.date,
          revenue: item._sum?.totalAmount ? Number(item._sum.totalAmount) : 0,
        })),
      };
    } catch (error) {
      console.error(`[StaffAnalytics] Error for staff ${staffId}:`, error);
      return {
        stats: {
          totalBookings: 0,
          completedBookings: 0,
          totalRevenue: 0,
          avgRating: "5.0",
          totalReviews: 0,
        },
        monthlyRevenue: [],
      };
    }
  }

  async registerLeave(staffId: string, dto: { startDate: string | Date; endDate: string | Date; reason?: string }, user: User) {
    try {
      const staff = await this.findOne(staffId);
      await this.verifySalonOwnership(staff.salonId, user);

      // Ensure we have valid Date objects for Prisma
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);

      // Simple validation
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new ConflictException('Ngày bắt đầu hoặc ngày kết thúc không hợp lệ');
      }

      const staffLeaveModel = (this.prisma as any).staffLeave;
      if (!staffLeaveModel) {
        throw new Error('Hệ thống chưa hỗ trợ ghi nhận lịch nghỉ. Vui lòng liên hệ kỹ thuật.');
      }

      return await staffLeaveModel.create({
        data: {
          staffId,
          startDate,
          endDate,
          reason: dto.reason || '',
          status: 'APPROVED',
        },
      });
    } catch (error) {
      console.error('Error registering staff leave:', error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Không thể đăng ký nghỉ: ${error.message || 'Lỗi hệ thống'}`);
    }
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

    // 1. Check if staff has any shifts assigned for this date
    const shifts = await (this.prisma as any).staffShift.findMany({
      where: {
        staffId,
        date: searchDate,
      },
    });

    if (shifts.length === 0) {
      return [];
    }

    // Get existing bookings
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

    // Generate slots based on shifts
    const slots: string[] = [];

    for (const shift of shifts) {
      const start = new Date(shift.shiftStart);
      const end = new Date(shift.shiftEnd);

      let current = new Date(start);
      while (current < end) {
        const timeStr = `${current.getUTCHours().toString().padStart(2, '0')}:${current.getUTCMinutes().toString().padStart(2, '0')}`;

        // Check if slot overlaps with any booking
        const isOverlap = bookings.some(b => {
          const bStart = b.timeSlot;
          const bEnd = b.endTime;
          return timeStr >= bStart && timeStr < bEnd;
        });

        if (!isOverlap) {
          slots.push(timeStr);
        }

        current.setMinutes(current.getMinutes() + 30); // 30 min slots
      }
    }

    return [...new Set(slots)].sort();
  }

  async getMySchedules(userId: string, date?: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { userId },
    });

    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    const where: any = { staffId: staff.id };
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      where.date = searchDate;
    }

    return (this.prisma as any).staffShift.findMany({
      where,
      orderBy: { shiftStart: 'asc' },
    });
  }

  async getSalonSchedules(salonId: string, date: string | undefined, user: User) {
    await this.verifySalonOwnership(salonId, user);

    const where: any = { salonId };
    if (date) {
      const searchDate = new Date(date);
      searchDate.setHours(0, 0, 0, 0);
      where.date = searchDate;
    }

    return (this.prisma as any).staffShift.findMany({
      where,
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
      orderBy: { shiftStart: 'asc' },
    });
  }

  async assignShift(dto: any, user: User) {
    await this.verifySalonOwnership(dto.salonId, user);

    // Check for existing shifts that might overlap
    const existingShifts = await (this.prisma as any).staffShift.findMany({
      where: {
        staffId: dto.staffId,
        date: new Date(dto.date),
      },
    });

    const newStart = new Date(dto.shiftStart);
    const newEnd = new Date(dto.shiftEnd);

    const hasConflict = existingShifts.some((shift: any) => {
      const sStart = new Date(shift.shiftStart);
      const sEnd = new Date(shift.shiftEnd);
      return (newStart >= sStart && newStart < sEnd) || (newEnd > sStart && newEnd <= sEnd);
    });

    if (hasConflict) {
      throw new ConflictException('Staff already has a shift that overlaps with this time');
    }

    return (this.prisma as any).staffShift.create({
      data: {
        staffId: dto.staffId,
        salonId: dto.salonId,
        date: new Date(dto.date),
        shiftStart: newStart,
        shiftEnd: newEnd,
      },
    });
  }

  async removeShift(shiftId: string, user: User) {
    const shift = await (this.prisma as any).staffShift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    await this.verifySalonOwnership(shift.salonId, user);

    return (this.prisma as any).staffShift.delete({
      where: { id: shiftId },
    });
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

    // MANAGER can manage their own salon too
    const isManager = user.role === (Role as any).MANAGER;
    const isOwner = salon.ownerId === user.id;

    if (!isOwner && !isManager) {
      throw new ForbiddenException('You do not have permission to manage this salon');
    }

    if (isManager) {
      // Check if manager belongs to this salon
      const staff = await this.prisma.staff.findFirst({
        where: { userId: user.id, salonId }
      });
      if (!staff) {
        throw new ForbiddenException('You can only manage your assigned salon');
      }
    }
  }
}
