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

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReviewDto, customerId: string): Promise<Review> {
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

    const review = await this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        customerId,
        salonId: booking.salonId,
        rating: dto.rating,
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

  async findAllBySalon(
    salonId: string,
    params: {
      skip?: number;
      take?: number;
      minRating?: number;
    } = {},
  ) {
    const { skip = 0, take = 20, minRating } = params;

    const where: any = { salonId, isVisible: true };

    if (minRating) {
      where.rating = { gte: minRating };
    }

    const [reviews, total, avgRating] = await Promise.all([
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
        where: { salonId, isVisible: true },
        _avg: { rating: true },
      }),
    ]);

    // Rating distribution
    const distribution = await this.prisma.review.groupBy({
      by: ['rating'],
      where: { salonId, isVisible: true },
      _count: true,
    });

    return {
      data: reviews,
      meta: {
        total,
        skip,
        take,
        hasMore: skip + take < total,
        averageRating: avgRating._avg.rating || 0,
        distribution: distribution.reduce(
          (acc, d) => {
            acc[d.rating] = d._count;
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
      reviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / reviews.length;

    await this.prisma.staff.update({
      where: { id: staffId },
      data: {
        rating: avgRating,
        totalReviews: reviews.length,
      },
    });
  }
}
