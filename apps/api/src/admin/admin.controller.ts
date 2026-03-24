import { Controller, Get, Query, Patch, Param, UseGuards, Body, Res, Post, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { BookingStatus, User, Role } from '@prisma/client';
import { Permission } from '@reetro/shared';
import { Response } from 'express';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HttpException, HttpStatus } from '@nestjs/common';

import { AdminService } from './admin.service';
import { AnalyticsService } from './analytics.service';
import { StaffService } from '../staff/staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { BookingQueryDto } from '../bookings/dto/booking-query.dto';
import { AssignShiftDto } from '../staff/dto/assign-shift.dto';
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
    return this.analyticsService.getServiceAnalytics(salonId);
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
    @Body() dto: { startDate: string; endDate: string; reason?: string },
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
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: any,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
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

  @Patch('users/:id/reset-password')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Reset a user password' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() admin: User,
  ) {
    try {
      return await this.adminService.resetPassword(id, dto, admin);
    } catch (error: any) {
      if (error.message === 'User not found') {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Unexpected server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  @Get('salons')
  @RequirePermissions(Permission.VIEW_SALONS)
  @ApiOperation({ summary: 'Get all salons (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAllSalons(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('city') city?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllSalons({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      city,
      isActive: isActive ? isActive === 'true' : undefined,
      search,
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

  @Get('staff/:id')
  @RequirePermissions(Permission.VIEW_STAFF)
  @ApiOperation({ summary: 'Get staff detail' })
  @ApiParam({ name: 'id', description: 'Staff ID' })
  getStaffById(@Param('id') id: string) {
    return this.adminService.getStaffById(id);
  }

  @Get('staff')
  @RequirePermissions(Permission.VIEW_STAFF)
  @ApiOperation({ summary: 'Get all staff (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'salonId', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAllStaff(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('salonId') salonId?: string,
    @Query('minRating') minRating?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllStaff({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      salonId,
      minRating: minRating ? parseFloat(minRating) : undefined,
      sortBy,
      sortOrder,
      search,
    });
  }

  @Get('services')
  @RequirePermissions(Permission.VIEW_SERVICES)
  @ApiOperation({ summary: 'Get all services (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'salonId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAllServices(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('salonId') salonId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllServices({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      salonId,
      category,
      search,
    });
  }

  @Get('reviews')
  @RequirePermissions(Permission.VIEW_REVIEWS)
  @ApiOperation({ summary: 'Get all reviews (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'salonId', required: false })
  @ApiQuery({ name: 'rating', required: false })
  @ApiQuery({ name: 'search', required: false })
  getAllReviews(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('salonId') salonId?: string,
    @Query('rating') rating?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllReviews({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      salonId,
      rating: rating ? parseInt(rating) : undefined,
      search,
    });
  }

  @Get('leave-requests')
  @RequirePermissions(Permission.VIEW_STAFF)
  @ApiOperation({ summary: 'Get all staff leave requests' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  @ApiQuery({ name: 'salonId', required: false })
  @ApiQuery({ name: 'search', required: false })
  getLeaveRequests(
    @Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED',
    @Query('salonId') salonId?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getLeaveRequests({ status, salonId, search });
  }

  @Patch('leave-requests/:id/status')
  @RequirePermissions(Permission.MANAGE_STAFF)
  @ApiOperation({ summary: 'Update leave request status' })
  @ApiParam({ name: 'id', description: 'Leave request ID' })
  @ApiBody({ schema: { properties: { status: { enum: ['APPROVED', 'REJECTED'] }, reason: { type: 'string' } } } })
  approveLeaveRequest(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Body('reason') reason?: string,
  ) {
    return this.adminService.approveLeaveRequest(id, status, reason);
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

  @Get('schedules')
  @RequirePermissions(Permission.VIEW_STAFF)
  @ApiOperation({ summary: 'Get all staff schedules' })
  getSchedules(
    @CurrentUser() user: User, 
    @Query('salonId') salonId: string, 
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.staffService.getSalonSchedules(salonId, date, user, startDate, endDate);
  }

  @Post('schedules')
  @RequirePermissions(Permission.MANAGE_STAFF)
  @ApiOperation({ summary: 'Create staff shift' })
  createSchedule(@Body() dto: AssignShiftDto, @CurrentUser() user: User) {
    return this.staffService.assignShift(dto, user);
  }

  @Post('schedules/bulk')
  @RequirePermissions(Permission.MANAGE_STAFF)
  @ApiOperation({ summary: 'Bulk create shifts for multiple staff × multiple days' })
  bulkCreateSchedules(@Body() dto: any, @CurrentUser() user: User) {
    return this.staffService.bulkAssignShifts(dto, user);
  }

  @Patch('schedules/:id')
  @RequirePermissions(Permission.MANAGE_STAFF)
  @ApiOperation({ summary: 'Update staff shift' })
  updateScheduleShift(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: User) {
    return this.staffService.updateShift(id, dto, user);
  }

  @Delete('schedules/:id')
  @RequirePermissions(Permission.MANAGE_STAFF)
  @ApiOperation({ summary: 'Delete staff shift' })
  deleteShift(@Param('id') id: string, @CurrentUser() user: User) {
    return this.staffService.removeShift(id, user);
  }

  // ============== BRANCH REVENUE ==============

  @Get('branch-revenue')
  @RequirePermissions(Permission.VIEW_REVENUE)
  @ApiOperation({ summary: 'Get revenue by branch' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
  @ApiQuery({ name: 'search', required: false })
  getBranchRevenue(
    @Query('period') period?: 'week' | 'month' | 'quarter' | 'year',
    @Query('search') search?: string,
  ) {
    return this.adminService.getBranchRevenue({ period, search });
  }

  @Get('branch-revenue/:salonId')
  @RequirePermissions(Permission.VIEW_REVENUE)
  @ApiOperation({ summary: 'Get revenue detail for a branch' })
  @ApiParam({ name: 'salonId', description: 'Salon ID' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'quarter', 'year'] })
  getBranchRevenueDetail(
    @Param('salonId') salonId: string,
    @Query('period') period?: 'week' | 'month' | 'quarter' | 'year',
  ) {
    return this.adminService.getBranchRevenueDetail(salonId, { period });
  }
}
