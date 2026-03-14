import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { Role, BookingStatus, StaffPosition, ShiftType } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

@Injectable()
export class ManagerService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Helper: Get salon ID for a manager user
     */
    async getManagerSalonId(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { 
                staff: true,
                ownedSalons: true 
            },
        });

        if (!user) {
            throw new ForbiddenException('User not found');
        }

        // Check if user has manager privileges
        const isManager = 
            user.role === Role.MANAGER || 
            user.role === Role.SALON_OWNER || 
            user.role === Role.SUPER_ADMIN ||
            (user.role === Role.STAFF && user.staff?.position === StaffPosition.MANAGER);

        if (!isManager) {
            throw new ForbiddenException('User is not authorized as a manager');
        }

        // For individuals who belong to a specific salon via Staff record
        if (user.staff?.salonId) {
            return user.staff.salonId;
        }

        // For SALON_OWNER who might not be in the staff table, pick their first salon
        if (user.role === Role.SALON_OWNER && user.ownedSalons && user.ownedSalons.length > 0) {
            return user.ownedSalons[0].id;
        }

        // Fallback for SUPER_ADMIN or MANAGER without assigned salon
        throw new ForbiddenException('User is not assigned to any salon. Please ensure the user is added to the Staff table for a specific salon.');
    }

    /**
     * 1. BRANCH STATISTICS (Real-time)
     */
    async getDashboardStats(userId: string) {
        const salonId = await this.getManagerSalonId(userId);
        const now = dayjs().tz(VIETNAM_TZ);
        const today = now.startOf('day').toDate();
        const startOfMonth = now.startOf('month').toDate();

        const [
            todayAppointments,
            completedToday,
            cancelledToday,
            todayRevenue,
            monthlyRevenue,
            salonReviews,
            activeStaffCount,
            totalCustomers
        ] = await Promise.all([
            // Today Appointments
            this.prisma.booking.count({ where: { salonId, date: today } }),
            // Completed Today
            this.prisma.booking.count({ where: { salonId, date: today, status: 'COMPLETED' } }),
            // Cancelled Today
            this.prisma.booking.count({ where: { salonId, date: today, status: 'CANCELLED' } }),
            // Today's Revenue
            this.prisma.booking.aggregate({
                where: { salonId, date: today, status: 'COMPLETED' },
                _sum: { totalAmount: true }
            }),
            // Monthly Revenue
            this.prisma.booking.aggregate({
                where: { salonId, date: { gte: startOfMonth }, status: 'COMPLETED' },
                _sum: { totalAmount: true }
            }),
            // Average Rating
            this.prisma.review.aggregate({
                where: { salonId },
                _avg: { rating: true }
            }),
            // Staff count
            this.prisma.staff.count({ where: { salonId, isActive: true } }),
            // Unique customers
            this.prisma.booking.groupBy({
                by: ['customerId'],
                where: { salonId }
            })
        ]);

        return {
            today: {
                total: todayAppointments,
                completed: completedToday,
                cancelled: cancelledToday,
                revenue: Number(todayRevenue._sum.totalAmount || 0)
            },
            monthly: {
                revenue: Number(monthlyRevenue._sum.totalAmount || 0)
            },
            performance: {
                averageRating: salonReviews._avg.rating || 5.0,
                activeStaff: activeStaffCount,
                totalCustomers: totalCustomers.length
            }
        };
    }

    /**
     * 2. STAFF MANAGEMENT
     */
    async getSalonStaff(userId: string) {
        const salonId = await this.getManagerSalonId(userId);
        const today = dayjs().tz(VIETNAM_TZ).startOf('day').toDate();

        const staffList = await this.prisma.staff.findMany({
            where: { salonId },
            include: {
                user: { select: { name: true, avatar: true, email: true, phone: true } },
                shifts: { where: { date: today } },
                leaves: { 
                    where: { 
                        startDate: { lte: today }, 
                        endDate: { gte: today },
                        status: 'APPROVED'
                    } 
                },
                _count: {
                    select: { 
                        bookings: { where: { date: today } }
                    }
                }
            }
        });

        return staffList.map(s => ({
            id: s.id,
            name: s.user.name,
            avatar: s.user.avatar,
            role: s.position,
            rating: s.rating,
            todayAppointments: s._count.bookings,
            status: s.leaves.length > 0 ? 'DAY_OFF' : (s.shifts.length > 0 ? 'WORKING' : 'NOT_SCHEDULED'),
            performance: null // Added in detailed view
        }));
    }

    async getStaffPerformance(userId: string, staffId: string) {
        const salonId = await this.getManagerSalonId(userId);
        
        const staff = await this.prisma.staff.findUnique({
            where: { id: staffId },
            include: {
                user: { select: { name: true } },
                performanceLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 6
                },
                _count: {
                    select: { bookings: { where: { status: 'COMPLETED' } } }
                }
            } as any
        });

        if (!staff || staff.salonId !== salonId) {
            throw new NotFoundException('Staff not found in your salon');
        }

        // Calculate some basic metrics
        const completedBookings = await this.prisma.booking.aggregate({
            where: { staffId, status: 'COMPLETED' },
            _sum: { totalAmount: true },
            _count: true
        });

        return {
            staffName: (staff as any).user.name,
            metrics: {
                totalCustomers: completedBookings._count,
                totalRevenue: Number(completedBookings._sum.totalAmount || 0),
                averageRating: staff.rating,
                history: (staff as any).performanceLogs
            }
        };
    }

    async rateStaffPerformance(userId: string, staffId: string, dto: {
        serviceQuality: number;
        punctuality: number;
        customerSatisfaction: number;
        comment?: string;
    }) {
        const salonId = await this.getManagerSalonId(userId);
        const staff = await this.prisma.staff.findUnique({ where: { id: staffId } });

        if (!staff || staff.salonId !== salonId) {
            throw new ForbiddenException('Access denied to this staff');
        }

        const now = dayjs().tz(VIETNAM_TZ);
        return (this.prisma as any).staffPerformance.upsert({
            where: {
                staffId_month_year: {
                    staffId,
                    month: now.month() + 1,
                    year: now.year()
                }
            },
            update: {
                serviceQuality: dto.serviceQuality,
                punctuality: dto.punctuality,
                customerSatisfaction: dto.customerSatisfaction,
                comment: dto.comment,
                managerId: userId
            },
            create: {
                staffId,
                managerId: userId,
                serviceQuality: dto.serviceQuality,
                punctuality: dto.punctuality,
                customerSatisfaction: dto.customerSatisfaction,
                comment: dto.comment,
                month: now.month() + 1,
                year: now.year()
            }
        });
    }

    /**
     * 3. DAY OFF MANAGEMENT
     */
    async getLeaveRequests(userId: string) {
        const salonId = await this.getManagerSalonId(userId);
        return (this.prisma as any).staffLeave.findMany({
            where: { staff: { salonId } },
            include: {
                staff: {
                    include: { user: { select: { name: true, avatar: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async approveLeaveRequest(userId: string, leaveId: string, status: 'APPROVED' | 'REJECTED', reason?: string) {
        const salonId = await this.getManagerSalonId(userId);
        const leave = await (this.prisma as any).staffLeave.findUnique({
            where: { id: leaveId },
            include: { staff: true }
        });

        if (!leave || leave.staff.salonId !== salonId) {
            throw new ForbiddenException('Access denied');
        }

        if (status === 'APPROVED') {
            // Rule: Cannot approve if barber has confirmed bookings on those days
            const conflictCount = await this.prisma.booking.count({
                where: {
                    staffId: leave.staffId,
                    status: 'CONFIRMED',
                    date: {
                        gte: leave.startDate,
                        lte: leave.endDate
                    }
                }
            });

            if (conflictCount > 0) {
                throw new ConflictException(`Nhân viên này có ${conflictCount} lịch hẹn đã xác nhận trong thời gian xin nghỉ. Hãy dời lịch trước.`);
            }
        }

        return (this.prisma as any).staffLeave.update({
            where: { id: leaveId },
            data: { status, updatedAt: new Date() }
        });
    }

    /**
     * 4. APPOINTMENT MANAGEMENT
     */
    async getSalonBookings(userId: string, filters: {
        date?: string;
        staffId?: string;
        status?: BookingStatus;
        search?: string;
    }) {
        const salonId = await this.getManagerSalonId(userId);
        const where: any = { salonId };

        if (filters.date) where.date = dayjs.tz(filters.date, VIETNAM_TZ).startOf('day').toDate();
        if (filters.staffId) where.staffId = filters.staffId;
        if (filters.status) where.status = filters.status;
        if (filters.search) {
            where.OR = [
                { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
                { bookingCode: { contains: filters.search, mode: 'insensitive' } },
                { customer: { phone: { contains: filters.search } } }
            ];
        }

        return this.prisma.booking.findMany({
            where,
            include: {
                customer: { select: { name: true, phone: true } },
                staff: { include: { user: { select: { name: true } } } },
                services: { include: { service: { select: { name: true } } } }
            },
            orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }]
        });
    }

    async rescheduleBooking(userId: string, bookingId: string, dto: {
        date: string;
        timeSlot: string;
        staffId?: string;
    }) {
        const salonId = await this.getManagerSalonId(userId);
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking || booking.salonId !== salonId) {
            throw new ForbiddenException('Access denied');
        }

        // Logic check: verify new staff availability if needed
        // (Simplified for now)

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                date: dayjs.tz(dto.date, VIETNAM_TZ).startOf('day').toDate(),
                timeSlot: dto.timeSlot,
                staffId: dto.staffId || booking.staffId
            }
        });
    }

    /**
     * 5. REVENUE & ANALYTICS
     */
    async getRevenueReport(userId: string, period: 'day' | 'week' | 'month' = 'month') {
        const salonId = await this.getManagerSalonId(userId);
        const now = dayjs().tz(VIETNAM_TZ);
        let startDate = now.startOf('month').toDate();

        if (period === 'day') startDate = now.startOf('day').toDate();
        if (period === 'week') startDate = now.startOf('week').toDate();

        const [revenueByService, revenueByBarber, dailyTrend] = await Promise.all([
            // Revenue by Service Category
            this.prisma.bookingService.groupBy({
                by: ['serviceId'],
                where: { booking: { salonId, status: 'COMPLETED', date: { gte: startDate } } },
                _sum: { price: true }
            }),
            // Revenue by Barber
            this.prisma.booking.groupBy({
                by: ['staffId'],
                where: { salonId, status: 'COMPLETED', date: { gte: startDate } },
                _sum: { totalAmount: true }
            }),
            // Daily Trend
            this.prisma.booking.groupBy({
                by: ['date'],
                where: { salonId, status: 'COMPLETED', date: { gte: startDate } },
                _sum: { totalAmount: true },
                orderBy: { date: 'asc' }
            })
        ]);

        return {
            byService: revenueByService,
            byBarber: revenueByBarber,
            trend: dailyTrend.map(t => ({
                date: dayjs(t.date).format('YYYY-MM-DD'),
                amount: Number(t._sum.totalAmount || 0)
            }))
        };
    }

    /**
     * 6. REVIEWS
     */
    async getSalonReviews(userId: string) {
        const salonId = await this.getManagerSalonId(userId);
        return this.prisma.review.findMany({
            where: { salonId },
            include: {
                customer: { select: { name: true, avatar: true } },
                staff: { include: { user: { select: { name: true } } } },
                booking: { select: { date: true, bookingCode: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async replyToReview(userId: string, reviewId: string, reply: string) {
        const salonId = await this.getManagerSalonId(userId);
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId }
        });

        if (!review || review.salonId !== salonId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.review.update({
            where: { id: reviewId },
            data: {
                reply,
                repliedAt: new Date()
            }
        });
    }

    /**
     * Legacy & Helpers
     */
    async getStaffShifts(userId: string, date?: string) {
        const salonId = await this.getManagerSalonId(userId);
        const where: any = { salonId };
        if (date) where.date = dayjs.tz(date, VIETNAM_TZ).startOf('day').toDate();

        return this.prisma.staffShift.findMany({
            where,
            include: {
                staff: { include: { user: { select: { name: true, avatar: true } } } }
            },
            orderBy: { shiftStart: 'asc' }
        });
    }

    async createShift(userId: string, dto: CreateShiftDto) {
        const salonId = await this.getManagerSalonId(userId);
        const staff = await this.prisma.staff.findUnique({ where: { id: dto.staffId } });
        if (!staff || staff.salonId !== salonId) throw new ForbiddenException('Staff access denied');

        return this.prisma.staffShift.create({
            data: {
                staffId: dto.staffId,
                salonId,
                date: dayjs.tz(dto.date, VIETNAM_TZ).startOf('day').toDate(),
                shiftStart: dayjs.tz(dto.shiftStart, VIETNAM_TZ).toDate(),
                shiftEnd: dayjs.tz(dto.shiftEnd, VIETNAM_TZ).toDate(),
                type: (dto as any).type || ShiftType.FULL_DAY
            }
        });
    }

    async updateShift(userId: string, id: string, dto: UpdateShiftDto) {
        const salonId = await this.getManagerSalonId(userId);
        const shift = await this.prisma.staffShift.findUnique({ where: { id } });
        if (!shift || shift.salonId !== salonId) throw new ForbiddenException('Shift access denied');

        return this.prisma.staffShift.update({
            where: { id },
            data: {
                date: dto.date ? dayjs.tz(dto.date, VIETNAM_TZ).startOf('day').toDate() : undefined,
                shiftStart: dto.shiftStart ? dayjs.tz(dto.shiftStart, VIETNAM_TZ).toDate() : undefined,
                shiftEnd: dto.shiftEnd ? dayjs.tz(dto.shiftEnd, VIETNAM_TZ).toDate() : undefined
            }
        });
    }

    async deleteShift(userId: string, id: string) {
        const salonId = await this.getManagerSalonId(userId);
        const shift = await this.prisma.staffShift.findUnique({ where: { id } });
        if (!shift || shift.salonId !== salonId) throw new ForbiddenException('Shift access denied');
        return this.prisma.staffShift.delete({ where: { id } });
    }
}
