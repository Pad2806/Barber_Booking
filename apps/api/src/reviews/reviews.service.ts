import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { Review, BookingStatus, Role, User } from '@prisma/client';

import { BaseQueryService } from '../common/services/base-query.service';
import { ReviewQueryDto } from './dto/review-query.dto';

@Injectable()
export class ReviewsService extends BaseQueryService {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(dto: CreateReviewDto, customerId: string): Promise<Review> {
    // ... existing logic ...
    // Check booking exists and belongs to customer
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { review: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed bookings');
    }

    if (booking.review) {
      throw new BadRequestException('Booking already has a review');
    }

    // Check if more than 3 days have passed since completion
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    const completionDate = booking.updatedAt; // Assuming updatedAt is when it was marked COMPLETED
    if (Date.now() - completionDate.getTime() > threeDaysInMs) {
      throw new BadRequestException('Review period (3 days) has expired');
    }

    const review = await this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        customerId,
        salonId: booking.salonId,
        staffId: booking.staffId,
        rating: dto.rating,
        staffRating: dto.staffRating,
        comment: dto.comment,
        images: dto.images || [],
      },
      include: {
        customer: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Update staff rating if there was a staff assigned
    if (booking.staffId) {
      await this.updateStaffRating(booking.staffId);
    }

    return review;
  }

  async findAll(query: ReviewQueryDto) {
    const {
      salonId,
      minRating,
      rating,
      dateFrom,
      dateTo,
      isVisible,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const limit = query.limit || 10;
    const page = query.page || 1;
    const skip = (page - 1) * limit;
    const take = limit;

    const where: any = {};
    if (salonId) {
      where.salonId = salonId;
    }
    if (minRating) {
      where.rating = { gte: minRating };
    }
    if (rating) {
      where.rating = rating;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }
    if (isVisible !== undefined) {
      where.isVisible = isVisible;
    }
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' };

    const [reviews, total, avgRating, distribution] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          customer: {
            select: {
              name: true,
              avatar: true,
            },
          },
          salon: {
            select: {
              name: true,
            },
          },
          booking: {
            select: {
              date: true,
              services: {
                select: {
                  service: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where,
        _count: { _all: true },
      }),
    ]);

    const meta = this.getPaginationMeta(total, query);
    return {
      data: reviews,
      meta: {
        ...meta,
        averageRating: avgRating._avg.rating || 0,
        distribution: (distribution as any[]).reduce(
          (acc, d) => {
            acc[d.rating] = d._count._all;
            return acc;
          },
          {} as Record<number, number>,
        ),
      },
    };
  }

  async findAllBySalon(
    salonId: string,
    params: {
      skip?: number;
      take?: number;
      minRating?: number;
      rating?: number;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ) {
    const { skip = 0, take = 20, minRating, rating, dateFrom, dateTo } = params;

    const where: any = { salonId, isVisible: true };

    if (minRating) {
      where.rating = { gte: minRating };
    }

    if (rating) {
      where.rating = rating;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const [reviews, total, avgRating, distribution] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              name: true,
              avatar: true,
            },
          },
          booking: {
            select: {
              services: {
                select: {
                  service: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['rating'],
        where,
        _count: { _all: true },
      }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
        averageRating: Number(avgRating._avg.rating || 0),
        distribution: (distribution as any[]).reduce(
          (acc, d) => {
            acc[d.rating] = d._count._all;
            return acc;
          },
          {} as Record<number, number>,
        ),
      },
    };
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            name: true,
            avatar: true,
          },
        },
        booking: {
          include: {
            services: {
              select: {
                service: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async reply(id: string, dto: ReplyReviewDto, user: User): Promise<Review> {
    const review = await this.findOne(id);

    // Check salon ownership
    const salon = await this.prisma.salon.findUnique({
      where: { id: review.salonId },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    if (user.role !== Role.SUPER_ADMIN && salon.ownerId !== user.id) {
      throw new ForbiddenException('Only salon owner can reply to reviews');
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        reply: dto.reply,
        repliedAt: new Date(),
      },
    });
  }

  async toggleVisibility(id: string, user: User): Promise<Review> {
    const review = await this.findOne(id);

    // Check salon ownership or super admin
    const salon = await this.prisma.salon.findUnique({
      where: { id: review.salonId },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    if (user.role !== Role.SUPER_ADMIN && salon.ownerId !== user.id) {
      throw new ForbiddenException('Only salon owner can manage review visibility');
    }

    return this.prisma.review.update({
      where: { id },
      data: { isVisible: !review.isVisible },
    });
  }

  async delete(id: string, user: User): Promise<void> {
    const review = await this.findOne(id);

    // Check salon ownership or super admin
    const salon = await this.prisma.salon.findUnique({
      where: { id: review.salonId },
    });

    if (!salon) {
      throw new NotFoundException('Salon not found');
    }

    if (user.role !== Role.SUPER_ADMIN && salon.ownerId !== user.id) {
      throw new ForbiddenException('Only salon owner can delete reviews');
    }

    await this.prisma.review.delete({
      where: { id },
    });
  }

  private async updateStaffRating(staffId: string): Promise<void> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        staffId,
        review: { isNot: null },
      },
      include: { review: true },
    });

    const reviews = bookings.map(b => b.review).filter(r => r && r.isVisible);

    if (reviews.length === 0) return;

    const avgRating =
      reviews.reduce((sum, r) => sum + (r?.staffRating || r?.rating || 0), 0) / reviews.length;

    await this.prisma.staff.update({
      where: { id: staffId },
      data: {
        rating: avgRating,
        totalReviews: reviews.length,
      },
    });
  }
}
