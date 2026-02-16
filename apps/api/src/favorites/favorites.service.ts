import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class FavoritesService {
    constructor(private readonly prisma: PrismaService) { }

    async addToFavorites(userId: string, salonId: string) {
        const salon = await this.prisma.salon.findUnique({ where: { id: salonId } });
        if (!salon) {
            throw new NotFoundException('Salon not found');
        }

        // Check if already favorited
        const existing = await this.prisma.userFavoriteSalon.findUnique({
            where: {
                userId_salonId: {
                    userId,
                    salonId,
                },
            },
        });

        if (existing) {
            return existing;
        }

        return this.prisma.userFavoriteSalon.create({
            data: {
                userId,
                salonId,
            },
        });
    }

    async removeFromFavorites(userId: string, salonId: string) {
        // Check if favorited first
        const existing = await this.prisma.userFavoriteSalon.findUnique({
            where: {
                userId_salonId: {
                    userId,
                    salonId,
                },
            },
        });

        if (!existing) {
            return { success: true, message: 'Not favorited' };
        }

        await this.prisma.userFavoriteSalon.delete({
            where: {
                userId_salonId: {
                    userId,
                    salonId,
                },
            },
        });

        return { success: true };
    }

    async isFavorite(userId: string, salonId: string) {
        const fav = await this.prisma.userFavoriteSalon.findUnique({
            where: {
                userId_salonId: {
                    userId,
                    salonId,
                },
            },
        });
        return !!fav;
    }

    async getUserFavorites(userId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [favorites, total] = await Promise.all([
            this.prisma.userFavoriteSalon.findMany({
                where: { userId },
                skip,
                take: limit,
                include: {
                    salon: {
                        select: {
                            id: true,
                            name: true,
                            address: true,
                            coverImage: true,
                            images: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.userFavoriteSalon.count({
                where: { userId },
            }),
        ]);

        return {
            data: favorites.map((f) => f.salon),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
}
