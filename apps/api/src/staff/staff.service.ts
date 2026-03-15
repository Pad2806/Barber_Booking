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
import { Staff, Role, User, ShiftType } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

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
          status: 'PENDING',
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

  async getAvailableSlots(staffId: string, date: Date | string, salonId?: string): Promise<string[]> {
    const staff = await this.prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      throw new NotFoundException('Không tìm thấy nhân viên');
    }

    // 1. Get Shifts or Fallback to Weekly
    const dateStr = typeof date === 'string' ? date : dayjs(date).format('YYYY-MM-DD');
    const searchDate = dayjs.utc(dateStr).toDate();

    const shifts = await (this.prisma as any).staffShift.findMany({
      where: {
        staffId,
        date: searchDate,
      },
    });

    let activeSlots: { start: dayjs.Dayjs, end: dayjs.Dayjs }[] = [];

    if (shifts.length > 0) {
      // If any shift is explicitly marked as OFF, return no slots
      if (shifts.some((s: any) => s.type === ShiftType.OFF)) {
        return [];
      }

      // Use specific assigned shifts
      activeSlots = shifts.map((s: any) => ({
        start: dayjs.tz(s.shiftStart, VIETNAM_TZ),
        end: dayjs.tz(s.shiftEnd, VIETNAM_TZ),
      }));
    } else {
      // Fallback to weekly schedule
      const vDate = dayjs.tz(dateStr, VIETNAM_TZ);
      const dayOfWeek = vDate.day();
      const weekly = await (this.prisma as any).staffWeeklySchedule.findFirst({
        where: { staffId, dayOfWeek, isOff: false },
      });

      if (weekly) {
        const [startH, startM] = weekly.startTime.split(':').map(Number);
        const [endH, endM] = weekly.endTime.split(':').map(Number);
        activeSlots = [{
          start: vDate.startOf('day').set('hour', startH).set('minute', startM).set('second', 0).set('millisecond', 0),
          end: vDate.startOf('day').set('hour', endH).set('minute', endM).set('second', 0).set('millisecond', 0),
        }];
      }
    }

    if (activeSlots.length === 0) {
      return [];
    }

    // 2. Get existing bookings to filter
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

    // 3. Generate 30-min slots
    const finalSlots: string[] = [];
    for (const slotRange of activeSlots) {
      let current = slotRange.start;
      while (current.isBefore(slotRange.end)) {
        const timeStr = current.format('HH:mm');
        const isOverlap = bookings.some(b => timeStr >= b.timeSlot && timeStr < b.endTime);
        
        if (!isOverlap) {
          finalSlots.push(timeStr);
        }
        current = current.add(30, 'minute');
      }
    }

    return [...new Set(finalSlots)].sort();
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
      where.date = dayjs.utc(date).toDate();
    }

    return (this.prisma as any).staffShift.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  async getSalonSchedules(salonId: string, date: string | undefined, user: User, startDate?: string, endDate?: string) {
    await this.verifySalonOwnership(salonId, user);

    const where: any = { salonId };
    if (startDate && endDate) {
      where.date = {
        gte: dayjs.utc(startDate).toDate(),
        lte: dayjs.utc(endDate).toDate(),
      };
    } else if (date) {
      where.date = dayjs.utc(date).toDate();
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

    const searchDate = dayjs.utc(dto.date).toDate();
    const shiftTimes = this.calculateShiftTimes(dto.date, dto.type, dto.shiftStart, dto.shiftEnd);

    const existingShifts = await (this.prisma as any).staffShift.findMany({
      where: {
        staffId: dto.staffId,
        date: searchDate,
      },
    });

    const hasConflict = existingShifts.some((shift: any) => {
      const sStart = dayjs(shift.shiftStart);
      const sEnd = dayjs(shift.shiftEnd);
      return (shiftTimes.start.isBefore(sEnd) && shiftTimes.end.isAfter(sStart));
    });

    if (hasConflict) {
      throw new ConflictException('Nhân viên đã có ca làm việc trùng lặp trong thời gian này');
    }

    return (this.prisma as any).staffShift.create({
      data: {
        staffId: dto.staffId,
        salonId: dto.salonId,
        date: searchDate,
        type: dto.type || ShiftType.FULL_DAY,
        shiftStart: shiftTimes.start.toDate(),
        shiftEnd: shiftTimes.end.toDate(),
      },
    });
  }

  async updateShift(shiftId: string, dto: any, user: User) {
    const shift = await (this.prisma as any).staffShift.findUnique({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException('Không tìm thấy ca làm việc');
    }

    await this.verifySalonOwnership(shift.salonId, user);

    const dateToUse = dto.date || dayjs(shift.date).format('YYYY-MM-DD');
    const shiftTimes = this.calculateShiftTimes(
      dateToUse, 
      dto.type || shift.type, 
      dto.shiftStart, 
      dto.shiftEnd
    );

    // Check conflict (excluding current shift)
    const searchDate = dayjs.utc(dateToUse).toDate();
    const existingShifts = await (this.prisma as any).staffShift.findMany({
      where: {
        staffId: dto.staffId || shift.staffId,
        date: searchDate,
        id: { not: shiftId }
      },
    });

    const hasConflict = existingShifts.some((s: any) => {
      const sStart = dayjs(s.shiftStart);
      const sEnd = dayjs(s.shiftEnd);
      return (shiftTimes.start.isBefore(sEnd) && shiftTimes.end.isAfter(sStart));
    });

    if (hasConflict) {
      throw new ConflictException('Nhân viên đã có ca làm việc trùng lặp trong thời gian này');
    }

    return (this.prisma as any).staffShift.update({
      where: { id: shiftId },
      data: {
        date: searchDate,
        type: dto.type,
        shiftStart: shiftTimes.start.toDate(),
        shiftEnd: shiftTimes.end.toDate(),
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

  // --- STAFF DASHBOARD METHODS ---

  async getStaffByUserId(userId: string) {
    const staff = await this.prisma.staff.findUnique({
      where: { userId },
      include: {
        user: true,
        salon: true,
      },
    });
    if (!staff) throw new NotFoundException('Không tìm thấy thông tin nhân viên');
    return staff;
  }

  async getDashboardStats(staffId: string) {
    const nowVietnam = dayjs().tz(VIETNAM_TZ);
    const startOfToday = nowVietnam.startOf('day').toDate();

    const [todayBookings, completedToday, totalRevenueToday, staff] = await Promise.all([
      this.prisma.booking.count({
        where: {
          staffId,
          date: startOfToday,
          status: { not: 'CANCELLED' },
        },
      }),
      this.prisma.booking.count({
        where: {
          staffId,
          date: startOfToday,
          status: 'COMPLETED',
        },
      }),
      this.prisma.booking.aggregate({
        where: {
          staffId,
          date: startOfToday,
          status: 'COMPLETED',
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.staff.findUnique({
        where: { id: staffId },
        select: { rating: true },
      }),
    ]);

    // Next customer alert logic
    const nextBooking = await this.prisma.booking.findFirst({
      where: {
        staffId,
        date: startOfToday,
        status: 'CONFIRMED',
        timeSlot: { gte: nowVietnam.format('HH:mm') },
      },
      orderBy: { timeSlot: 'asc' },
      include: { customer: { select: { name: true } } },
    });

    let nextCustomerAlert = null;
    if (nextBooking) {
      const [h, m] = nextBooking.timeSlot.split(':').map(Number);
      const bookingTime = nowVietnam.hour(h).minute(m);
      const diffMins = bookingTime.diff(nowVietnam, 'minute');
      if (diffMins > 0 && diffMins <= 60) {
        nextCustomerAlert = `Khách tiếp theo (${nextBooking.customer.name}) sẽ đến trong ${diffMins} phút nữa.`;
      }
    }

    return {
      todayAppointments: todayBookings,
      completedToday,
      todayRevenue: Number(totalRevenueToday._sum.totalAmount || 0),
      averageRating: staff?.rating || 5.0,
      nextCustomerAlert,
    };
  }

  async getStaffSchedule(staffId: string, date: string) {
    const targetDate = dayjs.tz(date, VIETNAM_TZ).startOf('day').toDate();
    await this.autoUpdateBookingsStatus(staffId);

    return this.prisma.booking.findMany({
      where: { staffId, date: targetDate },
      include: {
        customer: { select: { id: true, name: true, phone: true, avatar: true } },
        services: { include: { service: true } },
      },
      orderBy: { timeSlot: 'asc' },
    });
  }

  async getWeeklyCustomers(staffId: string) {
    const now = dayjs().tz(VIETNAM_TZ);
    const startOfWeek = now.startOf('week').add(1, 'day'); // Monday
    const endOfWeek = now.add(7, 'day').endOf('week').add(1, 'day'); // Next Sunday

    return this.prisma.booking.findMany({
      where: {
        staffId,
        date: { gte: startOfWeek.toDate(), lte: endOfWeek.toDate() },
        status: { not: 'CANCELLED' },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        services: { include: { service: true } },
      },
      orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
    });
  }

  async updateBookingStatus(bookingId: string, status: any, staffId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.staffId !== staffId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật lịch hẹn này');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status,
        ...(status === 'COMPLETED' ? { paymentStatus: 'PAID' } : {}),
      },
      include: { services: { include: { service: true } }, customer: true },
    });
  }

  async addCustomerNote(staffId: string, customerId: string, content: string) {
    return (this.prisma as any).customerNote.create({
      data: { staffId, customerId, content },
    });
  }

  async getCustomerHistory(customerId: string) {
    const [pastBookings, notes] = await Promise.all([
      this.prisma.booking.findMany({
        where: { customerId, status: 'COMPLETED' },
        include: {
          staff: { include: { user: { select: { name: true } } } },
          services: { include: { service: true } },
        },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      (this.prisma as any).customerNote.findMany({
        where: { customerId },
        include: { staff: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const bookingsByBarber = await this.prisma.booking.groupBy({
      by: ['staffId'],
      where: { customerId, status: 'COMPLETED', staffId: { not: null } },
      _count: { staffId: true },
    });

    let preferredBarber = 'Chưa rõ';
    if (bookingsByBarber.length > 0) {
      const topBarberId = bookingsByBarber.sort((a, b) => b._count.staffId - a._count.staffId)[0].staffId;
      const staff = await this.prisma.staff.findUnique({
        where: { id: topBarberId as string },
        include: { user: { select: { name: true } } },
      });
      preferredBarber = staff?.user?.name || 'Chưa rõ';
    }

    return {
      pastBookings,
      notes,
      preferredBarber,
      lastVisit: pastBookings[0]?.date || null,
    };
  }

  private async autoUpdateBookingsStatus(staffId: string) {
    const now = dayjs().tz(VIETNAM_TZ);
    const today = now.startOf('day').toDate();

    const pendingInProgress = await this.prisma.booking.findMany({
      where: {
        staffId,
        date: today,
        status: { in: ['IN_PROGRESS', 'CONFIRMED'] },
      },
    });

    for (const b of pendingInProgress) {
      const [h, m] = b.endTime.split(':').map(Number);
      const endDateTime = dayjs(b.date).hour(h).minute(m);
      if (now.isAfter(endDateTime.add(15, 'minute'))) {
        await this.prisma.booking.update({
          where: { id: b.id },
          data: { status: 'COMPLETED', paymentStatus: 'PAID' },
        });
      }
    }
  }

  async registerDayOffImproved(staffId: string, date: string, reason?: string) {
    const targetDate = dayjs.tz(date, VIETNAM_TZ).startOf('day');
    if (targetDate.isBefore(dayjs().tz(VIETNAM_TZ).startOf('day'))) {
      throw new ConflictException('Không thể đăng ký nghỉ cho ngày đã qua');
    }

    const confirmedBookings = await this.prisma.booking.count({
      where: { staffId, date: targetDate.toDate(), status: 'CONFIRMED' },
    });

    if (confirmedBookings > 0) {
      throw new ConflictException(`Bạn đã có ${confirmedBookings} lịch hẹn đã xác nhận vào ngày này. Vui lòng xử lý trước khi nghỉ.`);
    }

    return (this.prisma as any).staffLeave.create({
      data: {
        staffId,
        startDate: targetDate.toDate(),
        endDate: targetDate.toDate(),
        reason: reason || '',
        status: 'PENDING',
      },
    });
  }

  private async verifySalonOwnership(salonId: string, user: User): Promise<void> {
    if (user.role === Role.SUPER_ADMIN) return;

    const salon = await this.prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) throw new NotFoundException(`Salon with ID ${salonId} not found`);

    const isOwner = salon.ownerId === user.id;
    const isManager = user.role === Role.MANAGER;

    if (!isOwner && !isManager) {
      const staff = await this.prisma.staff.findFirst({ where: { userId: user.id } });
      if (!staff || staff.userId !== user.id) {
        throw new ForbiddenException('You do not have permission to manage this salon');
      }
    }

    if (isManager) {
      const staff = await this.prisma.staff.findFirst({ where: { userId: user.id, salonId } });
      if (!staff) throw new ForbiddenException('You can only manage your assigned salon');
    }
  }

  private calculateShiftTimes(dateStr: string, type?: ShiftType, customStart?: string, customEnd?: string) {
    if (customStart && customEnd) {
      return { start: dayjs.tz(customStart, VIETNAM_TZ), end: dayjs.tz(customEnd, VIETNAM_TZ) };
    }

    let startHours = 8, startMins = 0;
    let endHours = 18, endMins = 0;

    switch (type) {
      case ShiftType.MORNING:
        startHours = 8; endHours = 12;
        break;
      case ShiftType.AFTERNOON:
        startHours = 13; endHours = 18;
        break;
      case ShiftType.FULL_DAY:
        startHours = 8; endHours = 18;
        break;
      case ShiftType.OFF:
        startHours = 0; startMins = 0;
        endHours = 23; endMins = 59;
        break;
      default:
        startHours = 8; endHours = 18;
        break;
    }

    const baseDate = dayjs.tz(dateStr, VIETNAM_TZ).startOf('day');
    const start = baseDate.set('hour', startHours).set('minute', startMins).set('second', 0).set('millisecond', 0);
    const end = baseDate.set('hour', endHours).set('minute', endMins).set('second', 0).set('millisecond', 0);

    return { start, end };
  }
}
