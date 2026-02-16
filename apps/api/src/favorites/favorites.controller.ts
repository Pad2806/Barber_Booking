import { Controller, Get, Post, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    @Get()
    @ApiOperation({ summary: 'Get user favorite salons' })
    async getUserFavorites(
        @CurrentUser() user: User,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        return this.favoritesService.getUserFavorites(user.id, pageNum, limitNum);
    }

    @Post(':salonId')
    @ApiOperation({ summary: 'Add salon to favorites' })
    async addToFavorites(
        @CurrentUser() user: User,
        @Param('salonId') salonId: string,
    ) {
        return this.favoritesService.addToFavorites(user.id, salonId);
    }

    @Delete(':salonId')
    @ApiOperation({ summary: 'Remove salon from favorites' })
    async removeFromFavorites(
        @CurrentUser() user: User,
        @Param('salonId') salonId: string,
    ) {
        return this.favoritesService.removeFromFavorites(user.id, salonId);
    }

    @Get('check/:salonId')
    @ApiOperation({ summary: 'Check if salon is favorited' })
    async checkIsFavorite(
        @CurrentUser() user: User,
        @Param('salonId') salonId: string,
    ) {
        const result = await this.favoritesService.isFavorite(user.id, salonId);
        return { isFavorite: result };
    }
}
