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
import { Role, User, ServiceCategory } from '@prisma/client';

import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service' })
  create(@Body() dto: CreateServiceDto, @CurrentUser() user: User) {
    return this.servicesService.create(dto, user);
  }

  @Get('salon/:salonId')
  @Public()
  @ApiOperation({ summary: 'Get all services for a salon' })
  @ApiQuery({ name: 'category', required: false, enum: ServiceCategory })
  findAllBySalon(
    @Param('salonId') salonId: string,
    @Query('category') category?: ServiceCategory,
  ) {
    return this.servicesService.findAllBySalon(salonId, { category });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get service by ID' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: User,
  ) {
    return this.servicesService.update(id, dto, user);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle service active status' })
  toggleActive(@Param('id') id: string, @CurrentUser() user: User) {
    return this.servicesService.toggleActive(id, user);
  }

  @Post('salon/:salonId/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder services' })
  reorder(
    @Param('salonId') salonId: string,
    @Body('serviceIds') serviceIds: string[],
    @CurrentUser() user: User,
  ) {
    return this.servicesService.reorder(salonId, serviceIds, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete service' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.servicesService.delete(id, user);
  }
}
