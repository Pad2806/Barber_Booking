import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { Salon, Role, User } from '@prisma/client';

@Injectable()
export class SalonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSalonDto, ownerId: string): Promise<Salon> {
    // Check if slug already exists
    const existingSlug = await this.prisma.salon.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('Salon slug already exists');
    }

    return this.prisma.salon.create({
      data: {
        ...dto,
        ownerId,
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    city?: string;
    district?: string;
    search?: string;
    isActive?: boolean;
  }) {
    const { skip = 0, take = 20, city, district, search, isActive = true } = params;

    const where: any = { isActive };

    if (city) {
      where.city = city;
    }

    if (district) {
      where.district = district;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [salons, total] = await Promise.all([
      this.prisma.salon.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              staff: true,
              services: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.salon.count({ where }),
    ]);

    // Calculate average rating for each salon
    const salonsWithRating = await Promise.all(
      salons.map(async salon => {
        const avgRating = await this.prisma.review.aggregate({
          where: { salonId: salon.id, isVisible: true },
          _avg: { rating: true },
        });

        return {
          ...salon,
          averageRating: avgRating._avg.rating || 0,
        };
      }),
    );

    return {
      data: salonsWithRating,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
      },
    };
  }

  async findOne(id: string): Promise<Salon & { averageRating: number }> {
    const salon = await this.prisma.salon.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        staff: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
            schedules: true,
          },
        },
        services: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            reviews: true,
            bookings: true,
          },
        },
      },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with ID ${id} not found`);
    }

    const avgRating = await this.prisma.review.aggregate({
      where: { salonId: id, isVisible: true },
      _avg: { rating: true },
    });

    return {
      ...salon,
      averageRating: avgRating._avg.rating || 0,
    };
  }

  async findBySlug(slug: string): Promise<Salon & { averageRating: number }> {
    const salon = await this.prisma.salon.findUnique({
      where: { slug },
      include: {
        staff: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        services: {
          where: { isActive: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!salon) {
      throw new NotFoundException(`Salon with slug ${slug} not found`);
    }

    const avgRating = await this.prisma.review.aggregate({
      where: { salonId: salon.id, isVisible: true },
      _avg: { rating: true },
    });

    return {
      ...salon,
      averageRating: avgRating._avg.rating || 0,
    };
  }

  async update(id: string, dto: UpdateSalonDto, user: User): Promise<Salon> {
    const salon = await this.prisma.salon.findUnique({ where: { id } });

    if (!salon) {
      throw new NotFoundException(`Salon with ID ${id} not found`);
    }

    // Check permissions
    if (user.role !== Role.SUPER_ADMIN && salon.ownerId !== user.id) {
      throw new ForbiddenException('You can only update your own salon');
    }

    // Check slug uniqueness if changing
    if (dto.slug && dto.slug !== salon.slug) {
      const existingSlug = await this.prisma.salon.findUnique({
        where: { slug: dto.slug },
      });
      if (existingSlug) {
        throw new ConflictException('Salon slug already exists');
      }
    }

    return this.prisma.salon.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, user: User): Promise<void> {
    const salon = await this.prisma.salon.findUnique({ where: { id } });

    if (!salon) {
      throw new NotFoundException(`Salon with ID ${id} not found`);
    }

    // Only owner or super admin can delete
    if (user.role !== Role.SUPER_ADMIN && salon.ownerId !== user.id) {
      throw new ForbiddenException('You can only delete your own salon');
    }

    await this.prisma.salon.delete({ where: { id } });
  }

  async getOwnerSalons(ownerId: string) {
    return this.prisma.salon.findMany({
      where: { ownerId },
      include: {
        _count: {
          select: {
            staff: true,
            services: true,
            bookings: true,
          },
        },
      },
    });
  }

  async getSalonStats(salonId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const [
      todayBookings,
      monthBookings,
      lastMonthBookings,
      totalRevenue,
      monthRevenue,
      avgRating,
      totalReviews,
    ] = await Promise.all([
      this.prisma.booking.count({
        where: {
          salonId,
          date: today,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        },
      }),
      this.prisma.booking.count({
        where: {
          salonId,
          date: { gte: startOfMonth },
          status: 'COMPLETED',
        },
      }),
      this.prisma.booking.count({
        where: {
          salonId,
          date: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
          status: 'COMPLETED',
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          booking: { salonId },
          status: 'PAID',
        },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          booking: { salonId },
          status: 'PAID',
          paidAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.review.aggregate({
        where: { salonId, isVisible: true },
        _avg: { rating: true },
      }),
      this.prisma.review.count({
        where: { salonId, isVisible: true },
      }),
    ]);

    return {
      todayBookings,
      monthBookings,
      lastMonthBookings,
      bookingGrowth:
        lastMonthBookings > 0
          ? ((monthBookings - lastMonthBookings) / lastMonthBookings) * 100
          : 100,
      totalRevenue: totalRevenue._sum.amount || 0,
      monthRevenue: monthRevenue._sum.amount || 0,
      averageRating: avgRating._avg.rating || 0,
      totalReviews,
    };
  }
}
