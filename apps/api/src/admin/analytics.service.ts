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

    async getServicePerformance(salonId?: string) {
        const where: any = {};
        if (salonId) where.booking = { salonId };

        // Group by serviceId and sum the occurrences & prices in completed bookings
        const serviceStats = await this.prisma.bookingService.groupBy({
            by: ['serviceId'],
            where: {
                booking: {
                    status: 'COMPLETED',
                    ...(salonId ? { salonId } : {})
                }
            },
            _count: {
                bookingId: true,
            },
            _sum: {
                price: true,
            }
        });

        // Populate service names
        const enrichedStats = await Promise.all(
            serviceStats.map(async (stat) => {
                const service = await this.prisma.service.findUnique({
                    where: { id: stat.serviceId },
                    select: { name: true, category: true }
                });

                return {
                    id: stat.serviceId,
                    name: service?.name || 'Unknown',
                    category: service?.category,
                    timesBooked: stat._count.bookingId,
                    totalRevenue: Number(stat._sum.price || 0),
                };
            })
        );

        return enrichedStats.sort((a, b) => b.timesBooked - a.timesBooked);
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
