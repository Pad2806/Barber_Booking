import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { Salon, Role, User, Service } from '@prisma/client';

import { BaseQueryService } from '../common/services/base-query.service';
import { SalonQueryDto } from './dto/salon-query.dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TZ = 'Asia/Ho_Chi_Minh';

@Injectable()
export class SalonsService extends BaseQueryService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

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

  async findAll(query: SalonQueryDto) {
    const {
      city,
      district,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const { skip, take } = this.getPaginationOptions(query);

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (city) {
      where.city = city;
    }

    if (district) {
      where.district = district;
    }

    if (search) {
      Object.assign(where, this.buildSearchWhere(search, ['name', 'address', 'city', 'district']));
    }

    const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' };

    const [salons, total, averages] = await Promise.all([
      this.prisma.salon.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: {
              staff: true,
              services: true,
              reviews: true,
              bookings: true,
            },
          },
        },
      }),
      this.prisma.salon.count({ where }),
      this.prisma.review.groupBy({
        by: ['salonId'],
        where: { isVisible: true },
        _avg: { rating: true },
      }),
    ]);

    const data = salons.map((salon) => {
      const avg = averages.find((a) => a.salonId === salon.id);
      const rating = Number(avg?._avg?.rating || 0);
      return {
        ...salon,
        averageRating: rating,
        rating: rating,
        totalReviews: salon._count?.reviews || 0,
      };
    });

    return {
      data,
      meta: this.getPaginationMeta(total, query),
    };
  }

  async findOne(id: string) {
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
            weeklySchedules: true,
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
      } as any,
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
      services: (salon as any).services.map((s: any) => ({
        ...s,
        price: Number(s.price),
      })),
      averageRating: Number(avgRating._avg.rating || 0),
    };
  }

  async findBySlug(slug: string) {
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
            weeklySchedules: true,
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
      } as any,
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
      services: (salon as any).services.map((s: any) => ({
        ...s,
        price: Number(s.price),
      })),
      averageRating: Number(avgRating._avg.rating || 0),
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
    const nowInVN = dayjs.tz(undefined, VIETNAM_TZ);
    const today = dayjs.utc(nowInVN.format('YYYY-MM-DD')).toDate();

    const startOfMonth = dayjs.utc(nowInVN.startOf('month').format('YYYY-MM-DD')).toDate();
    const startOfLastMonth = dayjs.utc(nowInVN.subtract(1, 'month').startOf('month').format('YYYY-MM-DD')).toDate();
    const endOfLastMonth = dayjs.utc(nowInVN.subtract(1, 'month').endOf('month').format('YYYY-MM-DD')).toDate();

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
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      monthRevenue: Number(monthRevenue._sum.amount || 0),
      averageRating: avgRating._avg.rating || 0,
      totalReviews,
    };
  }
}
