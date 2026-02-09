import { Controller, Get, Query, Patch, Param, UseGuards, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { Role, BookingStatus } from '@prisma/client';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users/stats')
  @ApiOperation({ summary: 'Get user statistics' })
  getUserStats() {
    return this.adminService.getUserStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'search', required: false })
  getAllUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('role') role?: Role,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      role,
      search,
    });
  }

  @Get('salons/stats')
  @ApiOperation({ summary: 'Get salon statistics' })
  getSalonStats() {
    return this.adminService.getSalonStats();
  }

  @Get('salons')
  @ApiOperation({ summary: 'Get all salons (paginated)' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  getAllSalons(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('city') city?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.adminService.getAllSalons({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      city,
      isActive: isActive ? isActive === 'true' : undefined,
    });
  }

  @Get('bookings/stats')
  @ApiOperation({ summary: 'Get booking statistics' })
  @ApiQuery({ name: 'period', enum: ['week', 'month', 'year'] })
  getBookingStats(@Query('period') period: 'week' | 'month' | 'year' = 'month') {
    return this.adminService.getBookingStats(period);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get all bookings (paginated)' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiQuery({ name: 'salonId', required: false })
  getAllBookings(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: BookingStatus,
    @Query('salonId') salonId?: string,
  ) {
    return this.adminService.getAllBookings({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      status,
      salonId,
    });
  }

  @Patch('bookings/:id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiBody({ schema: { properties: { status: { enum: Object.values(BookingStatus) } } } })
  updateBookingStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.adminService.updateBookingStatus(id, status);
  }

  @Get('revenue/stats')
  @ApiOperation({ summary: 'Get revenue statistics' })
  @ApiQuery({ name: 'period', enum: ['week', 'month', 'year'] })
  getRevenueStats(@Query('period') period: 'week' | 'month' | 'year' = 'month') {
    return this.adminService.getRevenueStats(period);
  }

  @Get('staff')
  @ApiOperation({ summary: 'Get all staff (paginated)' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'salonId', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAllStaff(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('salonId') salonId?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllStaff({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      salonId,
      search,
    });
  }

  @Get('services')
  @ApiOperation({ summary: 'Get all services (paginated)' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'salonId', required: false })
  @ApiQuery({ name: 'category', required: false })
  getAllServices(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('salonId') salonId?: string,
    @Query('category') category?: string,
  ) {
    return this.adminService.getAllServices({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      salonId,
      category,
    });
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Get all reviews (paginated)' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'salonId', required: false })
  @ApiQuery({ name: 'rating', required: false })
  getAllReviews(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('salonId') salonId?: string,
    @Query('rating') rating?: string,
  ) {
    return this.adminService.getAllReviews({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      salonId,
      rating: rating ? parseInt(rating) : undefined,
    });
  }
}
