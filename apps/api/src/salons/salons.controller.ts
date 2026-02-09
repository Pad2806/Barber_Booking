import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';

import { SalonsService } from './salons.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Salons')
@Controller('salons')
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new salon' })
  create(@Body() dto: CreateSalonDto, @CurrentUser('id') userId: string) {
    return this.salonsService.create(dto, userId);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all salons (public)' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('city') city?: string,
    @Query('district') district?: string,
    @Query('search') search?: string,
  ) {
    return this.salonsService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      city,
      district,
      search,
    });
  }

  @Get('my-salons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get salons owned by current user' })
  getMySlons(@CurrentUser('id') userId: string) {
    return this.salonsService.getOwnerSalons(userId);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get salon by slug (public)' })
  findBySlug(@Param('slug') slug: string) {
    return this.salonsService.findBySlug(slug);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get salon by ID (public)' })
  findOne(@Param('id') id: string) {
    return this.salonsService.findOne(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get salon statistics' })
  getStats(@Param('id') id: string) {
    return this.salonsService.getSalonStats(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update salon' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSalonDto,
    @CurrentUser() user: User,
  ) {
    return this.salonsService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete salon' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.salonsService.delete(id, user);
  }
}
