import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ManagerService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get salon ID for a manager user
     */
    async getManagerSalonId(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { staff: true },
        });

        if (!user || user.role !== Role.MANAGER || !user.staff) {
            throw new ForbiddenException('User is not a manager or not assigned to a salon');
        }

        return user.staff.salonId;
    }

    /**
     * Get dashboard stats for manager's salon
     */
    async getDashboardStats(userId: string) {
        const salonId = await this.getManagerSalonId(userId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfToday = new Date(today);
        endOfToday.setHours(23, 59, 59, 999);

        const [
            revenueToday,
            bookingsToday,
            activeBarbers,
            newCustomers,
            revenueStats,
            serviceStats,
            topBarbers
        ] = await Promise.all([
            // Revenue today
            this.prisma.booking.aggregate({
                where: { salonId, date: today, status: 'COMPLETED' },
                _sum: { totalAmount: true }
            }),
            // Bookings today
            this.prisma.booking.count({
                where: { salonId, date: today }
            }),
            // Active barbers (staff with shifts today)
            this.prisma.staffShift.count({
                where: { salonId, date: today }
            }),
            // New customers in this salon (first booking today)
            this.prisma.booking.count({
                where: { salonId, date: today, status: 'COMPLETED' } // Simplified
            }),
            // Revenue trend (last 7 days)
            this.prisma.booking.groupBy({
                by: ['date'],
                where: {
                    salonId,
                    date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    status: 'COMPLETED'
                },
                _sum: { totalAmount: true },
                orderBy: { date: 'asc' }
            }),
            // Booking by service category
            this.prisma.bookingService.groupBy({
                by: ['serviceId'],
                where: { booking: { salonId } },
                _count: { id: true }
            }),
            // Top barbers in salon
            this.prisma.staff.findMany({
                where: { salonId },
                take: 5,
                orderBy: { rating: 'desc' },
                include: { user: { select: { name: true, avatar: true } } }
            })
        ]);

        return {
            overview: {
                revenueToday: revenueToday._sum.totalAmount || 0,
                bookingsToday,
                activeBarbers,
                newCustomers
            },
            revenueTrend: revenueStats.map(s => ({
                date: s.date,
                amount: Number(s._sum.totalAmount || 0)
            })),
            topBarbers: (topBarbers as any[]).map((b: any) => ({
                id: b.id,
                name: b.user.name,
                avatar: b.user.avatar,
                rating: b.rating
            }))
        };
    }

    /**
     * Shift Management
     */
    async getStaffShifts(userId: string, date?: string) {
        const salonId = await this.getManagerSalonId(userId);
        const where: any = { salonId };

        if (date) {
            where.date = new Date(date);
        }

        return this.prisma.staffShift.findMany({
            where,
            include: {
                staff: {
                    include: {
                        user: {
                            select: { name: true, avatar: true }
                        }
                    }
                }
            },
            orderBy: { shiftStart: 'asc' }
        });
    }

    async createShift(userId: string, dto: CreateShiftDto) {
        const salonId = await this.getManagerSalonId(userId);

        // Verify staff belongs to this salon
        const staff = await this.prisma.staff.findUnique({
            where: { id: dto.staffId }
        });

        if (!staff || staff.salonId !== salonId) {
            throw new ForbiddenException('Staff does not belong to your salon');
        }

        return this.prisma.staffShift.create({
            data: {
                staffId: dto.staffId,
                salonId,
                date: new Date(dto.date),
                shiftStart: new Date(dto.shiftStart),
                shiftEnd: new Date(dto.shiftEnd)
            }
        });
    }

    async updateShift(userId: string, shiftId: string, dto: UpdateShiftDto) {
        const salonId = await this.getManagerSalonId(userId);
        const shift = await this.prisma.staffShift.findUnique({
            where: { id: shiftId }
        });

        if (!shift || shift.salonId !== salonId) {
            throw new ForbiddenException('Shift not found or access denied');
        }

        const updateData: any = {};
        if (dto.date) updateData.date = new Date(dto.date);
        if (dto.shiftStart) updateData.shiftStart = new Date(dto.shiftStart);
        if (dto.shiftEnd) updateData.shiftEnd = new Date(dto.shiftEnd);

        return this.prisma.staffShift.update({
            where: { id: shiftId },
            data: updateData
        });
    }

    async deleteShift(userId: string, shiftId: string) {
        const salonId = await this.getManagerSalonId(userId);
        const shift = await this.prisma.staffShift.findUnique({
            where: { id: shiftId }
        });

        if (!shift || shift.salonId !== salonId) {
            throw new ForbiddenException('Shift not found or access denied');
        }

        return this.prisma.staffShift.delete({
            where: { id: shiftId }
        });
    }

    async getSalonStaff(userId: string) {
        const salonId = await this.getManagerSalonId(userId);
        return this.prisma.staff.findMany({
            where: { salonId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true, avatar: true }
                },
                _count: {
                    select: { bookings: true }
                }
            }
        });
    }
}
