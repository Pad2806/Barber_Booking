import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Role, BookingStatus, StaffPosition, PaymentStatus, PaymentMethod, PaymentType } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

@Injectable()
export class CashierService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Helper: Get salon ID for a cashier user
     */
    async getCashierSalonId(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { staff: true },
        });

        const allowedRoles: Role[] = [Role.CASHIER, Role.MANAGER, Role.SALON_OWNER, Role.SUPER_ADMIN];
        
        const isAuthorized = user && (
            allowedRoles.includes(user.role) || 
            (user.role === Role.STAFF && user.staff?.position === StaffPosition.CASHIER)
        );

        if (!user || !isAuthorized || !user.staff) {
            throw new ForbiddenException('User is not authorized or not assigned to a salon');
        }

        return user.staff.salonId;
    }

    /**
     * 1. DASHBOARD OVERVIEW
     */
    async getDashboardStats(userId: string) {
        const salonId = await this.getCashierSalonId(userId);
        const today = dayjs().tz(VIETNAM_TZ).startOf('day').toDate();

        const [
            todayAppointments,
            waitingCustomers,
            completedToday,
            todayRevenue
        ] = await Promise.all([
            // Total appointments today
            this.prisma.booking.count({ where: { salonId, date: today } }),
            // Waiting Queue count
            (this.prisma as any).waitingQueue.count({ where: { salonId, status: 'WAITING' } }),
            // Completed today
            this.prisma.booking.count({ where: { salonId, date: today, status: 'COMPLETED' } }),
            // Revenue today
            this.prisma.booking.aggregate({
                where: { salonId, date: today, status: 'COMPLETED' },
                _sum: { totalAmount: true }
            })
        ]);

        return {
            todayAppointments,
            waitingCustomers,
            completedServices: completedToday,
            todayRevenue: Number(todayRevenue._sum.totalAmount || 0)
        };
    }

    /**
     * 2. ONLINE BOOKING APPROVAL
     */
    async getPendingBookings(userId: string) {
        const salonId = await this.getCashierSalonId(userId);
        return this.prisma.booking.findMany({
            where: { salonId, status: 'PENDING' },
            include: {
                customer: { select: { id: true, name: true, phone: true } },
                services: { include: { service: { select: { name: true, price: true } } } },
                staff: { include: { user: { select: { name: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async approveBooking(userId: string, bookingId: string, data: { staffId?: string, timeSlot?: string, date?: string }) {
        const salonId = await this.getCashierSalonId(userId);
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

        if (!booking || booking.salonId !== salonId) {
            throw new NotFoundException('Booking not found');
        }

        const updateData: any = { status: 'CONFIRMED' };
        if (data.staffId) updateData.staffId = data.staffId;
        if (data.timeSlot) updateData.timeSlot = data.timeSlot;
        if (data.date) updateData.date = dayjs.tz(data.date, VIETNAM_TZ).startOf('day').toDate();

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: updateData
        });
    }

    async rejectBooking(userId: string, bookingId: string, reason: string) {
        const salonId = await this.getCashierSalonId(userId);
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

        if (!booking || booking.salonId !== salonId) {
            throw new NotFoundException('Booking not found');
        }

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED', cancelReason: reason, cancelledBy: 'CASHIER', cancelledAt: new Date() }
        });
    }

    /**
     * 3. WALK-IN BOOKINGS
     */
    async createWalkinBooking(userId: string, data: {
        customerName: string;
        phone?: string;
        serviceIds: string[];
        staffId?: string;
        note?: string;
    }) {
        const salonId = await this.getCashierSalonId(userId);
        
        // Find or create customer
        let customer;
        if (data.phone) {
            customer = await this.prisma.user.findUnique({ where: { phone: data.phone } });
            if (!customer) {
                customer = await this.prisma.user.create({
                    data: {
                        phone: data.phone,
                        name: data.customerName,
                        role: Role.CUSTOMER,
                        isActive: true
                    }
                });
            }
        } else {
            // Guest customer without phone
            customer = await this.prisma.user.create({
                data: {
                    name: data.customerName,
                    role: Role.CUSTOMER,
                    isActive: true
                }
            });
        }

        const services = await this.prisma.service.findMany({
            where: { id: { in: data.serviceIds } }
        });

        const totalAmount = services.reduce((acc, s) => acc + Number(s.price), 0);
        const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);

        const now = dayjs().tz(VIETNAM_TZ);
        const endTime = now.add(totalDuration, 'minute');

        return this.prisma.booking.create({
            data: {
                bookingCode: `WLK-${now.format('YYMMDD')}-${Math.floor(Math.random() * 10000)}`,
                customerId: customer.id,
                salonId,
                staffId: data.staffId,
                date: now.startOf('day').toDate(),
                timeSlot: now.format('HH:mm'),
                endTime: endTime.format('HH:mm'),
                status: 'CONFIRMED',
                totalAmount,
                totalDuration,
                note: data.note,
                services: {
                    create: services.map(s => ({
                        serviceId: s.id,
                        price: s.price,
                        duration: s.duration
                    }))
                }
            }
        });
    }

    /**
     * 4. AT-VISIT SERVICE MANAGEMENT
     */
    async addServicesToBooking(userId: string, bookingId: string, serviceIds: string[]) {
        const salonId = await this.getCashierSalonId(userId);
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { services: true }
        });

        if (!booking || booking.salonId !== salonId) {
            throw new NotFoundException('Booking not found');
        }

        const services = await this.prisma.service.findMany({
            where: { id: { in: serviceIds } }
        });

        // Add new services
        await this.prisma.bookingService.createMany({
            data: services.map(s => ({
                bookingId,
                serviceId: s.id,
                price: s.price,
                duration: s.duration
            }))
        });

        // Recalculate total
        const allServices = await this.prisma.bookingService.findMany({ where: { bookingId } });
        const newTotal = allServices.reduce((acc, s) => acc + Number(s.price), 0);
        const newDuration = allServices.reduce((acc, s) => acc + s.duration, 0);

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { totalAmount: newTotal, totalDuration: newDuration }
        });
    }

    /**
     * 5. CHECKOUT & PAYMENT
     */
    async checkoutBooking(userId: string, bookingId: string, data: { method: PaymentMethod }) {
        const salonId = await this.getCashierSalonId(userId);
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking || booking.salonId !== salonId) {
            throw new NotFoundException('Booking not found');
        }

        // 1. Mark as completed
        // 2. Create payment record
        // 3. Mark payment as paid
        return this.prisma.$transaction(async (tx) => {
            const updatedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'COMPLETED',
                    paymentStatus: 'PAID',
                    paymentMethod: data.method
                },
                include: {
                    customer: { select: { name: true } },
                    services: { include: { service: { select: { name: true } } } },
                    staff: { include: { user: { select: { name: true } } } }
                }
            });

            await tx.payment.create({
                data: {
                    bookingId,
                    amount: updatedBooking.totalAmount,
                    method: data.method,
                    type: 'FULL',
                    status: 'PAID',
                    paidAt: new Date()
                }
            });

            return updatedBooking;
        });
    }

    /**
     * 6. DAILY REVENUE
     */
    async getDetailedRevenue(userId: string) {
        const salonId = await this.getCashierSalonId(userId);
        const now = dayjs().tz(VIETNAM_TZ);
        const today = now.startOf('day').toDate();
        const startOfWeek = now.startOf('week').toDate();
        const startOfMonth = now.startOf('month').toDate();

        const [todayRev, weekRev, monthRev, byService, byStaff] = await Promise.all([
            this.prisma.booking.aggregate({ where: { salonId, status: 'COMPLETED', date: today }, _sum: { totalAmount: true } }),
            this.prisma.booking.aggregate({ where: { salonId, status: 'COMPLETED', date: { gte: startOfWeek } }, _sum: { totalAmount: true } }),
            this.prisma.booking.aggregate({ where: { salonId, status: 'COMPLETED', date: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
            this.prisma.bookingService.groupBy({
                by: ['serviceId'],
                where: { booking: { salonId, status: 'COMPLETED', date: today } },
                _sum: { price: true }
            }),
            this.prisma.booking.groupBy({
                by: ['staffId'],
                where: { salonId, status: 'COMPLETED', date: today },
                _sum: { totalAmount: true }
            })
        ]);

        return {
            stats: {
                today: Number(todayRev._sum.totalAmount || 0),
                week: Number(weekRev._sum.totalAmount || 0),
                month: Number(monthRev._sum.totalAmount || 0)
            },
            byService,
            byStaff
        };
    }

    /**
     * 7. CUSTOMER SEARCH
     */
    async searchCustomers(userId: string, query: string) {
        const salonId = await this.getCashierSalonId(userId);
        return this.prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query } }
                ],
                bookings: { some: { salonId } }
            },
            include: {
                bookings: {
                    where: { salonId, status: 'COMPLETED' },
                    orderBy: { date: 'desc' },
                    take: 5,
                    include: { staff: { include: { user: { select: { name: true } } } }, services: { include: { service: { select: { name: true } } } } }
                }
            }
        });
    }

    /**
     * 8. WAITING QUEUE
     */
    async getQueue(userId: string) {
        const salonId = await this.getCashierSalonId(userId);
        return (this.prisma as any).waitingQueue.findMany({
            where: { salonId, status: { in: ['WAITING', 'SERVING'] } },
            include: {
                service: { select: { name: true } },
                staff: { include: { user: { select: { name: true, avatar: true } } } }
            },
            orderBy: { arrivalTime: 'asc' }
        });
    }

    async addToQueue(userId: string, data: { customerName: string, serviceId?: string, staffId?: string }) {
        const salonId = await this.getCashierSalonId(userId);
        return (this.prisma as any).waitingQueue.create({
            data: {
                salonId,
                customerName: data.customerName,
                serviceId: data.serviceId,
                staffId: data.staffId,
                status: 'WAITING'
            }
        });
    }

    async updateQueueStatus(userId: string, id: string, status: string, staffId?: string) {
        const salonId = await this.getCashierSalonId(userId);
        return (this.prisma as any).waitingQueue.update({
            where: { id, salonId },
            data: { status, staffId }
        });
    }

    /**
     * 9. STATUS CONTROL
     */
    async updateBookingStatus(userId: string, bookingId: string, status: BookingStatus) {
        const salonId = await this.getCashierSalonId(userId);
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });

        if (!booking || booking.salonId !== salonId) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status }
        });
    }

    /**
     * 10. BARBER AVAILABILITY CHECK
     */
    async getAvailableBarbers(userId: string, date: string, timeSlot: string) {
        const salonId = await this.getCashierSalonId(userId);
        const targetDate = dayjs.tz(date, VIETNAM_TZ).startOf('day').toDate();
        
        // Find staff scheduled but not having bookings
        const staffList = await this.prisma.staff.findMany({
            where: { 
                salonId, 
                isActive: true,
                position: { in: [StaffPosition.BARBER, StaffPosition.SKINNER] }
            },
            include: {
                user: { select: { name: true, avatar: true } },
                shifts: { where: { date: targetDate } },
                leaves: { 
                    where: { 
                        startDate: { lte: targetDate }, 
                        endDate: { gte: targetDate },
                        status: 'APPROVED'
                    } 
                },
                bookings: { 
                    where: { 
                        date: targetDate, 
                        timeSlot,
                        status: { in: ['CONFIRMED', 'IN_PROGRESS'] }
                    } 
                }
            }
        });

        return staffList.map(s => ({
            id: s.id,
            name: s.user.name,
            avatar: s.user.avatar,
            position: s.position,
            isAvailable: s.shifts.length > 0 && s.leaves.length === 0 && s.bookings.length === 0,
            reason: s.leaves.length > 0 ? 'On Break' : (s.shifts.length === 0 ? 'Not Scheduled' : (s.bookings.length > 0 ? 'Busy' : 'Available'))
        }));
    }
}
