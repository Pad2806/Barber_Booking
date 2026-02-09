import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';

import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a booking' })
  create(@Body() dto: CreateReviewDto, @CurrentUser('id') customerId: string) {
    return this.reviewsService.create(dto, customerId);
  }

  @Get('salon/:salonId')
  @Public()
  @ApiOperation({ summary: 'Get all reviews for a salon' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  findAllBySalon(
    @Param('salonId') salonId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('minRating') minRating?: string,
  ) {
    return this.reviewsService.findAllBySalon(salonId, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      minRating: minRating ? parseInt(minRating) : undefined,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get review by ID' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a review' })
  reply(
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.reviewsService.reply(id, dto, user);
  }

  @Patch(':id/toggle-visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle review visibility' })
  toggleVisibility(@Param('id') id: string, @CurrentUser() user: User) {
    return this.reviewsService.toggleVisibility(id, user);
  }
}
