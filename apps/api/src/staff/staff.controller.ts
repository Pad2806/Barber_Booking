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

import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add staff to salon' })
  create(@Body() dto: CreateStaffDto, @CurrentUser() user: User) {
    return this.staffService.create(dto, user);
  }

  @Get('salon/:salonId')
  @Public()
  @ApiOperation({ summary: 'Get all staff for a salon' })
  @ApiQuery({ name: 'includeInactive', required: false })
  findAllBySalon(
    @Param('salonId') salonId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.staffService.findAllBySalon(salonId, includeInactive === 'true');
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get staff by ID' })
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Get(':id/available-slots')
  @Public()
  @ApiOperation({ summary: 'Get available time slots for staff' })
  @ApiQuery({ name: 'date', required: true, description: 'Date in YYYY-MM-DD format' })
  getAvailableSlots(@Param('id') id: string, @Query('date') dateStr: string) {
    const date = new Date(dateStr);
    return this.staffService.getAvailableSlots(id, date);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update staff' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: User,
  ) {
    return this.staffService.update(id, dto, user);
  }

  @Patch(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update staff schedule' })
  updateSchedule(
    @Param('id') id: string,
    @Body() schedules: UpdateScheduleDto[],
    @CurrentUser() user: User,
  ) {
    return this.staffService.updateSchedule(id, schedules, user);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle staff active status' })
  toggleActive(@Param('id') id: string, @CurrentUser() user: User) {
    return this.staffService.toggleActive(id, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove staff from salon' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.staffService.delete(id, user);
  }
}
