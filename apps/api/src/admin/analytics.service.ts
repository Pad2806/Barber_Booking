import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private readonly prisma: PrismaService) { }

    async getBranchPerformance() {
        // Get all salons and aggregate their revenue from completed bookings
        const salons = await this.prisma.salon.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: { bookings: true }
                }
            }
        });

        const performance = await Promise.all(
            salons.map(async (salon) => {
                const stats = await this.prisma.booking.aggregate({
                    where: {
                        salonId: salon.id,
                        status: 'COMPLETED',
                    },
                    _sum: { totalAmount: true },
                });

                const staffCount = await this.prisma.staff.count({
                    where: { salonId: salon.id }
                });

                return {
                    id: salon.id,
                    name: salon.name,
                    totalBookings: salon._count.bookings,
                    totalRevenue: Number(stats._sum.totalAmount || 0),
                    staffCount,
                };
            })
        );

        return performance.sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    async getServiceAnalytics(salonId?: string) {
        const where: any = {};
        if (salonId) where.service = { salonId };

        // Group by serviceId and sum the occurrences & prices
        const serviceStats = await this.prisma.bookingService.groupBy({
            by: ['serviceId'],
            where: {
                booking: {
                    status: 'COMPLETED',
                    ...(salonId ? { salonId } : {})
                }
            },
            _count: {
                _all: true,
            },
            _sum: {
                price: true,
            }
        });

        // Most booked
        const sortedByBooked = [...serviceStats].sort((a, b) => b._count._all - a._count._all);
        const mostBooked = sortedByBooked[0];
        
        // Top revenue
        const sortedByRevenue = [...serviceStats].sort((a, b) => Number(b._sum.price || 0) - Number(a._sum.price || 0));
        const topRevenue = sortedByRevenue[0];

        const [mostBookedService, topRevenueService] = await Promise.all([
            mostBooked ? this.prisma.service.findUnique({ where: { id: mostBooked.serviceId }, select: { name: true } }) : null,
            topRevenue ? this.prisma.service.findUnique({ where: { id: topRevenue.serviceId }, select: { name: true } }) : null
        ]);

        // Support both old and new format for compatibility if needed, but primary focus is current request
        return {
            mostBookedService: mostBookedService ? {
                name: mostBookedService.name,
                totalBookings: mostBooked._count._all
            } : { name: "N/A", totalBookings: 0 },
            topRevenueService: topRevenueService ? {
                name: topRevenueService.name,
                revenue: Number(topRevenue?._sum.price || 0)
            } : { name: "N/A", revenue: 0 },
            // Keeping arrays for the current UI's .map loops if possible, or I'll update the UI
            topBooked: await Promise.all(sortedByBooked.slice(0, 5).map(async s => {
                const svc = await this.prisma.service.findUnique({ where: { id: s.serviceId }, select: { name: true } });
                return { name: svc?.name, _count: { bookings: s._count._all } };
            })),
            topRevenue: await Promise.all(sortedByRevenue.slice(0, 5).map(async s => {
                const svc = await this.prisma.service.findUnique({ where: { id: s.serviceId }, select: { name: true } });
                return { name: svc?.name, revenue: Number(s._sum.price || 0) };
            }))
        };
    }

    async getRatingDistribution() {
        const distribution = await this.prisma.review.groupBy({
            by: ['rating'],
            _count: {
                id: true,
            },
            where: { isVisible: true }
        });

        // Ensure all stars 1-5 are present
        const result = [1, 2, 3, 4, 5].map(star => {
            const found = distribution.find(d => d.rating === star);
            return {
                star,
                count: found ? found._count.id : 0,
            };
        });

        return result;
    }

    async getBarberAverageRatings() {
        const staff = await this.prisma.staff.findMany({
            where: { isActive: true },
            select: {
                id: true,
                rating: true,
                user: {
                    select: { name: true }
                }
            }
        });

        return staff.map(s => ({
            id: s.id,
            name: s.user.name,
            averageRating: s.rating
        })).sort((a, b) => b.averageRating - a.averageRating);
    }
}
