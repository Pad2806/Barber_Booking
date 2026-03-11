import { Controller, Get, Query, Patch, Param, UseGuards, Body, Res, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { BookingStatus, User } from '@prisma/client';
import { Permission } from '@reetro/shared';
import { Response } from 'express';

import { AdminService } from './admin.service';
import { AnalyticsService } from './analytics.service';
import { StaffService } from '../staff/staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { BookingQueryDto } from '../bookings/dto/booking-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly analyticsService: AnalyticsService,
    private readonly staffService: StaffService,
  ) { }

  @Get('analytics/branches')
  @RequirePermissions(Permission.VIEW_REVENUE)
  @ApiOperation({ summary: 'Get branch performance analytics' })
  getBranchPerformance() {
    return this.analyticsService.getBranchPerformance();
  }

  @Get('analytics/services')
  @RequirePermissions(Permission.VIEW_REVENUE)
  @ApiOperation({ summary: 'Get service performance analytics' })
  getServicePerformance(@Query('salonId') salonId?: string) {
    return this.analyticsService.getServicePerformance(salonId);
  }

  @Get('analytics/ratings/distribution')
  @RequirePermissions(Permission.VIEW_REVIEWS)
  @ApiOperation({ summary: 'Get overall rating distribution' })
  getRatingDistribution() {
    return this.analyticsService.getRatingDistribution();
  }

  @Get('analytics/barbers/averages')
  @RequirePermissions(Permission.VIEW_STAFF)
  @ApiOperation({ summary: 'Get average ratings per barber' })
  getBarberAverages() {
    return this.analyticsService.getBarberAverageRatings();
  }

  @Get('analytics/barbers/ranking')
  @RequirePermissions(Permission.VIEW_STAFF)
  @ApiOperation({ summary: 'Get barber ranking based on score' })
  getBarberRanking(@Query('limit') limit?: string) {
    return this.staffService.getTopBarbers(limit ? parseInt(limit) : 10);
  }

  @Get('analytics/barbers/of-the-month')
  @RequirePermissions(Permission.VIEW_STAFF)
  @ApiOperation({ summary: 'Get barber of the month' })
  getBarberOfTheMonth() {
    return this.staffService.getBarberOfTheMonth();
  }

  @Get('analytics/barbers/history')
  @RequirePermissions(Permission.VIEW_STAFF)
  @ApiOperation({ summary: 'Get barber of the month history' })
  getBarberHistory(@Query('limit') limit?: string) {
    return this.staffService.getBarberHistory(limit ? parseInt(limit) : 6);
  }

  @Get('staff/:id/analytics')
  @RequirePermissions(Permission.VIEW_STAFF)
  @ApiOperation({ summary: 'Get specific staff performance analytics' })
  getStaffAnalytics(@Param('id') id: string) {
    return this.staffService.getStaffAnalytics(id);
  }

  @Post('staff/:id/leaves')
  @RequirePermissions(Permission.MANAGE_STAFF)
  @ApiOperation({ summary: 'Register leave for staff' })
  registerLeave(
    @Param('id') id: string,
    @Body() dto: { startDate: Date; endDate: Date; reason?: string },
    @CurrentUser() user: User,
  ) {
    return this.staffService.registerLeave(id, dto, user);
  }

  @Get('staff/:id/leaves')
  @RequirePermissions(Permission.VIEW_STAFF)
  @ApiOperation({ summary: 'Get staff leaves' })
  getLeaves(@Param('id') id: string) {
    return this.staffService.getLeaves(id);
  }

  @Get('dashboard')
  @RequirePermissions(Permission.VIEW_DASHBOARD)
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Get all users (paginated)' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAllUsers(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('role') role?: any,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      role,
      search,
    });
  }

  @Get('users/:id')
  @RequirePermissions(Permission.VIEW_USERS)
  @ApiOperation({ summary: 'Get user detail with booking history' })
  @ApiParam({ name: 'id', description: 'User ID' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }
  @Get('salons')
  @RequirePermissions(Permission.VIEW_SALONS)
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
  @RequirePermissions(Permission.VIEW_ALL_BOOKINGS)
  @ApiOperation({ summary: 'Get booking statistics' })
  @ApiQuery({ name: 'period', enum: ['week', 'month', 'year'] })
  getBookingStats(@Query('period') period: 'week' | 'month' | 'year' = 'month') {
    return this.adminService.getBookingStats(period);
  }

  @Get('bookings')
  @RequirePermissions(Permission.VIEW_ALL_BOOKINGS)
  @ApiOperation({ summary: 'Get all bookings (paginated with filters)' })
  getAllBookings(@Query() query: BookingQueryDto) {
    return this.adminService.getAllBookings(query);
  }

  @Get('bookings/export')
  @RequirePermissions(Permission.VIEW_ALL_BOOKINGS)
  @ApiOperation({ summary: 'Export bookings to Excel' })
  async exportBookings(@Query() query: BookingQueryDto, @Res() res: Response) {
    const workbook = await this.adminService.exportBookings(query);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + `bookings-${Date.now()}.xlsx`,
    );

    return workbook.xlsx.write(res).then(() => {
      res.status(200).end();
    });
  }

  @Patch('bookings/bulk-status')
  @RequirePermissions(Permission.MANAGE_BOOKINGS)
  @ApiOperation({ summary: 'Bulk update booking status' })
  bulkUpdateStatus(
    @Body('ids') ids: string[],
    @Body('status') status: BookingStatus,
    @CurrentUser() user: User,
  ) {
    return this.adminService.bulkUpdateBookingStatus(ids, status, user);
  }

  @Patch('bookings/:id/status')
  @RequirePermissions(Permission.MANAGE_BOOKINGS)
  @ApiOperation({ summary: 'Update booking status' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiBody({ schema: { properties: { status: { enum: Object.values(BookingStatus) } } } })
  updateBookingStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
    @CurrentUser() user: User,
  ) {
    return this.adminService.updateBookingStatus(id, status, user);
  }

  @Get('revenue/stats')
  @RequirePermissions(Permission.VIEW_REVENUE)
  @ApiOperation({ summary: 'Get revenue statistics' })
  @ApiQuery({ name: 'period', enum: ['week', 'month', 'year'] })
  getRevenueStats(@Query('period') period: 'week' | 'month' | 'year' = 'month') {
    return this.adminService.getRevenueStats(period);
  }

  @Get('staff')
  @RequirePermissions(Permission.VIEW_STAFF)
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
  @RequirePermissions(Permission.VIEW_SERVICES)
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
  @RequirePermissions(Permission.VIEW_REVIEWS)
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

  @Get('settings')
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Get system settings' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @RequirePermissions(Permission.MANAGE_SETTINGS)
  @ApiOperation({ summary: 'Update system settings' })
  updateSettings(@Body() data: Record<string, any>) {
    return this.adminService.updateSettings(data);
  }
}
