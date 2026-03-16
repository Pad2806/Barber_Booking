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
import { AssignShiftDto } from './dto/assign-shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

import { StaffQueryDto } from './dto/staff-query.dto';

@ApiTags('Staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add staff to salon' })
  create(@Body() dto: CreateStaffDto, @CurrentUser() user: User) {
    return this.staffService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.SALON_OWNER, Role.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all staff (admin)' })
  findAll(@Query() query: StaffQueryDto) {
    return this.staffService.findAll(query);
  }

  @Get('top')
  @Public()
  @ApiOperation({ summary: 'Get top rated staff' })
  @ApiQuery({ name: 'limit', required: false })
  getTopBarbers(@Query('limit') limit?: string) {
    return this.staffService.getTopBarbers(limit ? parseInt(limit) : 10);
  }

  @Get('my-schedules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current staff work schedule' })
  getMySchedules(@CurrentUser() user: User, @Query('date') date?: string) {
    return this.staffService.getMySchedules(user.id, date);
  }

  @Get('salon-schedules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all staff schedules for a salon' })
  getSalonSchedules(
    @CurrentUser() user: User, 
    @Query('salonId') salonId: string, 
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.staffService.getSalonSchedules(salonId, date, user, startDate, endDate);
  }

  @Post('assign-shift')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a shift to a staff member' })
  assignShift(@Body() dto: AssignShiftDto, @CurrentUser() user: User) {
    return this.staffService.assignShift(dto, user);
  }

  @Delete('remove-shift/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a shift' })
  removeShift(@Param('id') id: string, @CurrentUser() user: User) {
    return this.staffService.removeShift(id, user);
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

  @Patch(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.SALON_OWNER)
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
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle staff active status' })
  toggleActive(@Param('id') id: string, @CurrentUser() user: User) {
    return this.staffService.toggleActive(id, user);
  }

  @Get(':id/available-slots')
  @Public()
  @ApiOperation({ summary: 'Get available time slots for staff' })
  @ApiQuery({ name: 'date', required: true, description: 'Date in YYYY-MM-DD format' })
  @ApiQuery({ name: 'salonId', required: false, description: 'Optional salon ID filter' })
  getAvailableSlots(
    @Param('id') id: string, 
    @Query('date') dateStr: string,
    @Query('salonId') salonId?: string,
    @Query('duration') duration?: string,
  ) {
    return this.staffService.getAvailableSlots(id, dateStr, salonId, duration ? parseInt(duration) : 30);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get staff by ID' })
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update staff' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: User,
  ) {
    return this.staffService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.SALON_OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove staff from salon' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.staffService.delete(id, user);
  }

  // --- STAFF DASHBOARD ENDPOINTS ---

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BARBER, Role.SKINNER, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current staff dashboard stats' })
  async getMyDashboard(@CurrentUser() user: User) {
    const staff = await this.staffService.getStaffByUserId(user.id);
    return this.staffService.getDashboardStats(staff.id);
  }

  @Get('me/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BARBER, Role.SKINNER, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current staff daily schedule' })
  async getMySchedule(@CurrentUser() user: User, @Query('date') date: string) {
    const staff = await this.staffService.getStaffByUserId(user.id);
    return this.staffService.getStaffSchedule(staff.id, date);
  }

  @Get('me/weekly-customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BARBER, Role.SKINNER, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customers for current week' })
  async getMyWeeklyCustomers(@CurrentUser() user: User) {
    const staff = await this.staffService.getStaffByUserId(user.id);
    return this.staffService.getWeeklyCustomers(staff.id);
  }

  @Patch('me/bookings/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BARBER, Role.SKINNER, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status (Staff)' })
  async updateMyBookingStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: User
  ) {
    const staff = await this.staffService.getStaffByUserId(user.id);
    return this.staffService.updateBookingStatus(id, status, staff.id);
  }

  @Post('me/customers/:customerId/notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BARBER, Role.SKINNER, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add note for a customer' })
  async addCustomerNote(
    @Param('customerId') customerId: string,
    @Body('content') content: string,
    @CurrentUser() user: User
  ) {
    const staff = await this.staffService.getStaffByUserId(user.id);
    return this.staffService.addCustomerNote(staff.id, customerId, content);
  }

  @Get('me/customers/:customerId/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BARBER, Role.SKINNER, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer history and preferences' })
  async getCustomerHistory(@Param('customerId') customerId: string) {
    return this.staffService.getCustomerHistory(customerId);
  }

  @Post('me/day-off')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.BARBER, Role.SKINNER, Role.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a day off' })
  async registerDayOff(
    @Body() dto: { date: string, reason?: string },
    @CurrentUser() user: User
  ) {
    const staff = await this.staffService.getStaffByUserId(user.id);
    return this.staffService.registerDayOffImproved(staff.id, dto.date, dto.reason);
  }

}
