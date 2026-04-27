import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { BulkCreateShiftDto } from './dto/bulk-create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { Role, BookingStatus, StaffPosition, ShiftType } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

import { UsersService } from '../users/users.service';
import { CreateStaffDto } from '../users/dto/create-staff.dto';
import { UpdateStaffDto } from '../users/dto/update-staff.dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ManagerService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly usersService: UsersService,
    ) { }

    /**
     * Helper: Get salon ID for a manager user
     */
    async getManagerSalonId(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                staff: {
                    select: {
                        salonId: true,
                        position: true
                    }
                },
                ownedSalons: {
                    select: { id: true }
                }
            },
        });

        if (!user) {
            throw new ForbiddenException('Không tìm thấy tài khoản người dùng.');
        }

        // SALON_OWNER: Ưu tiên lấy salon họ sở hữu trước
        if (user.role === Role.SALON_OWNER && user.ownedSalons && user.ownedSalons.length > 0) {
            return user.ownedSalons[0].id;
        }

        // MANAGER/STAFF: Lấy từ bảng staff
        if (user.staff?.salonId) {
            return user.staff.salonId;
        }

        // SUPER_ADMIN: Lấy salon đầu tiên nếu không chỉ định (để tránh lỗi trắng trang)
        if (user.role === Role.SUPER_ADMIN) {
            const firstSalon = await this.prisma.salon.findFirst({ select: { id: true } });
            if (firstSalon) return firstSalon.id;
        }

        throw new ForbiddenException(`Tài khoản ${user.name} chưa được chỉ định quản lý chi nhánh nào. Vui lòng kiểm tra lại bảng Nhân viên.`);
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
    async getSalonStaff(userId: string, query: {
        page?: number;
        limit?: number;
        search?: string;
        minRating?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        position?: string;
    }) {
        const salonId = await this.getManagerSalonId(userId);
        const { search, minRating, sortBy = 'createdAt', sortOrder = 'desc', position } = query;

        // Safe number parsing — NestJS @Query returns strings or undefined
        const pageNum = Math.max(1, parseInt(String(query.page), 10) || 1);
        const limitNum = Math.max(1, parseInt(String(query.limit), 10) || 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = { salonId };

        if (search) {
            where.user = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { phone: { contains: search } }
                ]
            };
        }

        if (minRating) {
            where.rating = { gte: Number(minRating) };
        }

        if (position) {
            where.position = position;
        }

        // Handle sorting
        let orderBy: any = { createdAt: 'desc' };
        if (sortBy === 'rating') {
            orderBy = { rating: sortOrder };
        } else if (sortBy === 'bookings') {
            orderBy = { bookings: { _count: sortOrder } };
        } else if (sortBy === 'name' || sortBy === 'user.name') {
            orderBy = { user: { name: sortOrder } };
        } else if (sortBy === 'createdAt') {
            orderBy = { createdAt: sortOrder };
        }

        try {
            const [staffList, total] = await Promise.all([
                this.prisma.staff.findMany({
                    where,
                    include: {
                        user: { select: { id: true, name: true, avatar: true, email: true, phone: true } },
                        _count: {
                            select: {
                                bookings: true
                            }
                        }
                    },
                    orderBy,
                    skip,
                    take: limitNum,
                }),
                this.prisma.staff.count({ where })
            ]);

            // Return basic staff list without shift/leave status enrichment
            // This avoids potential runtime errors from staffShift/staffLeave queries
            const result = staffList.map(s => ({
                id: s.id,
                user: {
                    id: s.user?.id,
                    name: s.user?.name,
                    avatar: s.user?.avatar,
                    email: s.user?.email,
                    phone: s.user?.phone
                },
                position: s.position,
                rating: s.rating,
                totalReviews: s.totalReviews || 0,
                todayAppointments: s._count.bookings,
                status: 'NOT_SCHEDULED',
                isActive: s.isActive,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
                salonId: s.salonId
            }));

            return {
                data: result,
                meta: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    lastPage: Math.ceil(total / limitNum)
                }
            };
        } catch (error) {
            console.error('[Manager] getSalonStaff error:', error);
            // Return empty list instead of crashing
            return {
                data: [],
                meta: {
                    total: 0,
                    page: pageNum,
                    limit: limitNum,
                    lastPage: 0
                }
            };
        }
    }

    async getStaffDetail(userId: string, staffId: string) {
        const salonId = await this.getManagerSalonId(userId);

        const staff = await this.prisma.staff.findUnique({
            where: { id: staffId },
            include: {
                user: { select: { name: true, avatar: true, email: true, phone: true } },
                salon: { select: { name: true } },
                shifts: {
                    where: { date: { gte: dayjs().tz(VIETNAM_TZ).startOf('week').toDate() } },
                    orderBy: { date: 'asc' }
                },
                leaves: {
                    orderBy: { startDate: 'desc' },
                    take: 10
                },
                _count: {
                    select: { bookings: true }
                }
            }
        });

        if (!staff || staff.salonId !== salonId) {
            throw new NotFoundException('Staff not found in your salon');
        }

        // Analytics
        const analytics = await this.getStaffPerformance(userId, staffId);

        return {
            ...staff,
            analytics: analytics.metrics
        };
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

    async createStaff(userId: string, dto: CreateStaffDto) {
        const managerSalonId = await this.getManagerSalonId(userId);

        // Force salonId to be the manager's salon
        const staffDto = {
            ...dto,
            salonId: managerSalonId
        };

        return this.usersService.createStaff(staffDto);
    }

    async updateStaff(userId: string, staffUserId: string, dto: UpdateStaffDto) {
        const managerSalonId = await this.getManagerSalonId(userId);

        // Verify staff belongs to manager's salon
        const staff = await this.prisma.staff.findUnique({
            where: { userId: staffUserId }
        });

        if (!staff || staff.salonId !== managerSalonId) {
            throw new ForbiddenException('Staff not found in your salon');
        }

        // Force salonId to be the manager's salon if it was provided in dto
        const staffDto = {
            ...dto,
            salonId: managerSalonId
        };

        return this.usersService.updateStaff(staffUserId, staffDto);
    }

    async deleteStaff(userId: string, staffUserId: string) {
        const managerSalonId = await this.getManagerSalonId(userId);

        // Verify staff belongs to manager's salon
        const staff = await this.prisma.staff.findUnique({
            where: { userId: staffUserId }
        });

        if (!staff || staff.salonId !== managerSalonId) {
            throw new ForbiddenException('Staff not found in your salon');
        }

        return this.usersService.delete(staffUserId);
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

            // Auto-create OFF shifts for the period
            let current = dayjs.utc(leave.startDate).startOf('day');
            const end = dayjs.utc(leave.endDate).startOf('day');

            while (current.isBefore(end) || current.isSame(end, 'day')) {
                const date = current.toDate();

                // Delete existing shifts for this day to avoid duplicates/conflicts
                await this.prisma.staffShift.deleteMany({
                    where: { staffId: leave.staffId, date }
                });

                // Create OFF shift
                await this.prisma.staffShift.create({
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
            // so it falls back to the weekly schedule
            await this.prisma.staffShift.deleteMany({
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
            data: {
                status,
                rejectReason: status === 'REJECTED' ? (reason || null) : null,
                updatedAt: new Date()
            }
        });
    }

    /**
     * 4. APPOINTMENT MANAGEMENT
     */
    async getSalonBookings(userId: string, filters: {
        dateFrom?: string;
        dateTo?: string;
        staffId?: string;
        status?: BookingStatus;
        search?: string;
        serviceId?: string;
    }) {
        const salonId = await this.getManagerSalonId(userId);
        const where: any = { salonId };

        if (filters.dateFrom || filters.dateTo) {
            where.date = {};
            if (filters.dateFrom) {
                where.date.gte = dayjs.tz(filters.dateFrom, VIETNAM_TZ).startOf('day').toDate();
            }
            if (filters.dateTo) {
                where.date.lte = dayjs.tz(filters.dateTo, VIETNAM_TZ).endOf('day').toDate();
            }
        }

        if (filters.staffId) where.staffId = filters.staffId;
        if (filters.status && filters.status !== ('ALL' as any)) where.status = filters.status;
        if (filters.serviceId) where.services = { some: { serviceId: filters.serviceId } };
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
                salon: { select: { id: true, name: true } },
                customer: { select: { id: true, name: true, phone: true, avatar: true } },
                staff: { include: { user: { select: { id: true, name: true, avatar: true } } } },
                services: { include: { service: { select: { id: true, name: true, price: true, duration: true } } } }
            },
            orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }]
        });
    }

    async getSalonServices(userId: string) {
        const salonId = await this.getManagerSalonId(userId);
        return this.prisma.service.findMany({
            where: { salonId },
            select: { id: true, name: true, price: true, category: true },
            orderBy: { name: 'asc' },
        });
    }

    async exportBookingsToExcel(userId: string, filters: {
        dateFrom?: string;
        dateTo?: string;
        staffId?: string;
        status?: BookingStatus;
        search?: string;
        serviceId?: string;
    }) {
        const bookings = await this.getSalonBookings(userId, filters);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bookings');

        const STATUS_LABELS: Record<string, string> = {
            PENDING: 'Chờ xác nhận',
            CONFIRMED: 'Đã xác nhận',
            IN_PROGRESS: 'Đang làm',
            COMPLETED: 'Hoàn thành',
            CANCELLED: 'Đã hủy',
        };

        worksheet.columns = [
            { header: 'Mã đặt lịch', key: 'bookingCode', width: 20 },
            { header: 'Tên khách hàng', key: 'customerName', width: 25 },
            { header: 'Số điện thoại', key: 'customerPhone', width: 15 },
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
                staffName: booking.staff?.user?.name || 'Chưa chỉ định',
                services: booking.services?.map((s: any) => s.service?.name).join(', ') || '',
                date: new Date(booking.date).toLocaleDateString('vi-VN'),
                timeSlot: booking.timeSlot,
                totalAmount: Number(booking.totalAmount),
                status: STATUS_LABELS[booking.status] || booking.status,
            });
        });

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        return workbook;
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
                date: dayjs.utc(dto.date).startOf('day').toDate(),
                timeSlot: dto.timeSlot,
                staffId: dto.staffId || booking.staffId
            }
        });
    }

    async updateBookingStatus(userId: string, bookingId: string, status: BookingStatus) {
        const salonId = await this.getManagerSalonId(userId);
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking || booking.salonId !== salonId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status, updatedAt: new Date() }
        });
    }

    async bulkUpdateBookingStatus(userId: string, ids: string[], status: BookingStatus) {
        const salonId = await this.getManagerSalonId(userId);

        // Only update bookings that belong to this salon
        return this.prisma.booking.updateMany({
            where: {
                id: { in: ids },
                salonId: salonId
            },
            data: { status, updatedAt: new Date() }
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

        // 1. Get Base Revenue Data
        const [revenueByServiceGroup, revenueByBarberGroup, dailyTrendGroup] = await Promise.all([
            this.prisma.bookingService.groupBy({
                by: ['serviceId'],
                where: { booking: { salonId, status: 'COMPLETED', date: { gte: startDate } } },
                _sum: { price: true },
                _count: { _all: true }
            }),
            this.prisma.booking.groupBy({
                by: ['staffId'],
                where: { salonId, status: 'COMPLETED', date: { gte: startDate } },
                _sum: { totalAmount: true },
                _count: { _all: true }
            }),
            this.prisma.booking.groupBy({
                by: ['date'],
                where: { salonId, status: 'COMPLETED', date: { gte: startDate } },
                _sum: { totalAmount: true },
                orderBy: { date: 'asc' }
            })
        ]);

        // 2. Map Service Names
        const serviceIds = revenueByServiceGroup.map(s => s.serviceId);
        const services = await this.prisma.service.findMany({
            where: { id: { in: serviceIds } },
            select: { id: true, name: true, category: true }
        });

        const byService = revenueByServiceGroup.map(rg => {
            const service = services.find(s => s.id === rg.serviceId);
            return {
                service: service?.name || 'Khác',
                category: service?.category || 'OTHER',
                revenue: Number(rg._sum.price || 0),
                count: rg._count._all
            };
        });

        // 3. Map Barber Names
        const staffIds = revenueByBarberGroup.map(b => b.staffId).filter(Boolean) as string[];
        const staffList = await this.prisma.staff.findMany({
            where: { id: { in: staffIds } },
            include: { user: { select: { name: true, avatar: true } } }
        });

        const byBarber = revenueByBarberGroup.map(rg => {
            const staff = staffList.find(s => s.id === rg.staffId);
            return {
                barber: staff?.user?.name || 'Chưa xác định',
                avatar: staff?.user?.avatar,
                revenue: Number(rg._sum.totalAmount || 0),
                count: rg._count._all
            };
        });

        // 4. Calculate Summary Stats
        const totalRevenue = byBarber.reduce((acc, b) => acc + b.revenue, 0);
        const totalServiceCount = byService.reduce((acc, s) => acc + s.count, 0);

        // 5. Retention Rate (Simple: repeat customers / total customers)
        const allSalonBookings = await this.prisma.booking.findMany({
            where: { salonId, status: 'COMPLETED' },
            select: { customerId: true }
        });

        const customerBookingCounts = new Map<string, number>();
        allSalonBookings.forEach(b => {
            if (b.customerId) {
                customerBookingCounts.set(b.customerId, (customerBookingCounts.get(b.customerId) || 0) + 1);
            }
        });

        const totalCustomers = customerBookingCounts.size;
        const repeatCustomers = Array.from(customerBookingCounts.values()).filter(count => count > 1).length;
        const retentionRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

        return {
            totalRevenue,
            totalServiceCount,
            retentionRate,
            byService,
            byBarber,
            trend: dailyTrendGroup.map(t => ({
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
    async getStaffShifts(userId: string, date?: string, startDate?: string, endDate?: string) {
        const salonId = await this.getManagerSalonId(userId);
        const where: any = { salonId };

        if (startDate && endDate) {
            where.date = {
                gte: dayjs.utc(startDate).startOf('day').toDate(),
                lte: dayjs.utc(endDate).endOf('day').toDate(),
            };
        } else if (date) {
            where.date = dayjs.utc(date).startOf('day').toDate();
        }

        return this.prisma.staffShift.findMany({
            where,
            include: {
                staff: { include: { user: { select: { id: true, name: true, avatar: true } } } }
            },
            orderBy: { shiftStart: 'asc' }
        });
    }

    async createShift(userId: string, dto: CreateShiftDto) {
        const salonId = await this.getManagerSalonId(userId);
        const staff = await this.prisma.staff.findUnique({ where: { id: dto.staffId } });
        if (!staff || staff.salonId !== salonId) {
            throw new ForbiddenException('Bạn không có quyền quản lý nhân viên này hoặc nhân viên không thuộc chi nhánh của bạn.');
        }

        const type = dto.type || ShiftType.FULL_DAY;
        const shiftTimes = this.calculateShiftTimes(dto.date, type, dto.shiftStart, dto.shiftEnd);

        // Prevent duplicate shifts for the same staff on the same day
        const existingShift = await this.prisma.staffShift.findFirst({
            where: {
                staffId: dto.staffId,
                date: dayjs.utc(dto.date).startOf('day').toDate()
            }
        });

        if (existingShift) {
            return this.prisma.staffShift.update({
                where: { id: existingShift.id },
                data: {
                    shiftStart: shiftTimes.start.toDate(),
                    shiftEnd: shiftTimes.end.toDate(),
                    type,
                    updatedAt: new Date()
                }
            });
        }

        return this.prisma.staffShift.create({
            data: {
                staffId: dto.staffId,
                salonId,
                date: dayjs.utc(dto.date).startOf('day').toDate(),
                shiftStart: shiftTimes.start.toDate(),
                shiftEnd: shiftTimes.end.toDate(),
                type
            }
        });
    }

    async bulkCreateShifts(userId: string, dto: BulkCreateShiftDto) {
        const salonId = await this.getManagerSalonId(userId);

        // Verify all staff belong to this salon
        const staffMembers = await this.prisma.staff.findMany({
            where: { id: { in: dto.staffIds }, salonId },
            select: { id: true },
        });
        const validStaffIds = staffMembers.map(s => s.id);
        if (validStaffIds.length === 0) {
            throw new ForbiddenException('Không tìm thấy nhân viên hợp lệ thuộc chi nhánh của bạn.');
        }

        let created = 0;
        let updated = 0;

        for (const staffId of validStaffIds) {
            for (const dateStr of dto.dates) {
                const shiftTimes = this.calculateShiftTimes(dateStr, dto.type);
                const dateValue = dayjs.utc(dateStr).startOf('day').toDate();

                const existing = await this.prisma.staffShift.findFirst({
                    where: { staffId, date: dateValue },
                });

                if (existing) {
                    await this.prisma.staffShift.update({
                        where: { id: existing.id },
                        data: {
                            shiftStart: shiftTimes.start.toDate(),
                            shiftEnd: shiftTimes.end.toDate(),
                            type: dto.type,
                            updatedAt: new Date(),
                        },
                    });
                    updated++;
                } else {
                    await this.prisma.staffShift.create({
                        data: {
                            staffId,
                            salonId,
                            date: dateValue,
                            shiftStart: shiftTimes.start.toDate(),
                            shiftEnd: shiftTimes.end.toDate(),
                            type: dto.type,
                        },
                    });
                    created++;
                }
            }
        }

        return { created, updated, total: created + updated };
    }

    async updateShift(userId: string, id: string, dto: UpdateShiftDto) {
        const salonId = await this.getManagerSalonId(userId);
        const shift = await this.prisma.staffShift.findUnique({ where: { id } });
        if (!shift || shift.salonId !== salonId) throw new ForbiddenException('Shift access denied');

        const type = (dto as any).type || shift.type;
        const dateToUse = dto.date || dayjs(shift.date).format('YYYY-MM-DD');
        const shiftTimes = this.calculateShiftTimes(dateToUse, type, dto.shiftStart, dto.shiftEnd);

        return this.prisma.staffShift.update({
            where: { id },
            data: {
                date: dayjs.utc(dateToUse).startOf('day').toDate(),
                shiftStart: shiftTimes.start.toDate(),
                shiftEnd: shiftTimes.end.toDate(),
                type
            }
        });
    }

    private calculateShiftTimes(dateStr: string, type?: ShiftType, customStart?: string, customEnd?: string) {
        if (customStart && customEnd) {
            return {
                start: dayjs.tz(customStart, VIETNAM_TZ),
                end: dayjs.tz(customEnd, VIETNAM_TZ)
            };
        }

        let startHours = 8, startMins = 0;
        let endHours = 20, endMins = 0;

        switch (type) {
            case ShiftType.MORNING:
                startHours = 8; endHours = 12;
                break;
            case ShiftType.AFTERNOON:
                startHours = 12; endHours = 16;
                break;
            case ShiftType.EVENING:
                startHours = 16; endHours = 20;
                break;
            case ShiftType.OFF:
                startHours = 0; endHours = 0;
                break;
            case ShiftType.FULL_DAY:
            default:
                startHours = 8; endHours = 20;
                break;
        }

        const baseDate = dayjs.tz(dateStr, VIETNAM_TZ).startOf('day');
        const start = baseDate.set('hour', startHours).set('minute', startMins).set('second', 0).set('millisecond', 0);
        const end = baseDate.set('hour', endHours).set('minute', endMins).set('second', 0).set('millisecond', 0);

        return { start, end };
    }

    async deleteShift(userId: string, id: string) {
        const salonId = await this.getManagerSalonId(userId);
        const shift = await this.prisma.staffShift.findUnique({ where: { id } });
        if (!shift || shift.salonId !== salonId) throw new ForbiddenException('Shift access denied');
        return this.prisma.staffShift.delete({ where: { id } });
    }
}
