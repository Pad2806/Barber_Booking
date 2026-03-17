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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ManagerService } from './manager.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { CreateStaffDto } from '../users/dto/create-staff.dto';
import { UpdateStaffDto } from '../users/dto/update-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, User, BookingStatus } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Manager')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.SALON_OWNER, Role.SUPER_ADMIN)
@Controller('manager')
export class ManagerController {
    constructor(private readonly managerService: ManagerService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get manager dashboard stats' })
    getDashboardStats(@CurrentUser('id') userId: string) {
        return this.managerService.getDashboardStats(userId);
    }

    @Get('staff')
    @ApiOperation({ summary: 'Get staff belonging to manager salon' })
    getSalonStaff(
        @CurrentUser('id') userId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
        @Query('search') search?: string,
        @Query('minRating') minRating?: number,
        @Query('sortBy') sortBy?: string,
        @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    ) {
        return this.managerService.getSalonStaff(userId, { page, limit, search, minRating, sortBy, sortOrder });
    }

    @Get('staff/:id/performance')
    @ApiOperation({ summary: 'Get detailed performance for a staff member' })
    getStaffPerformance(@CurrentUser('id') userId: string, @Param('id') staffId: string) {
        return this.managerService.getStaffPerformance(userId, staffId);
    }

    @Get('staff/:id')
    @ApiOperation({ summary: 'Get detailed info for a staff member' })
    getStaffDetail(@CurrentUser('id') userId: string, @Param('id') staffId: string) {
        return this.managerService.getStaffDetail(userId, staffId);
    }

    @Post('staff/:id/performance')
    @ApiOperation({ summary: 'Rate a staff member performance' })
    rateStaffPerformance(
        @CurrentUser('id') userId: string,
        @Param('id') staffId: string,
        @Body() dto: { serviceQuality: number; punctuality: number; customerSatisfaction: number; comment?: string }
    ) {
        return this.managerService.rateStaffPerformance(userId, staffId, dto);
    }

    @Post('staff')
    @ApiOperation({ summary: 'Add a new staff member to the branch' })
    createStaff(@CurrentUser('id') userId: string, @Body() dto: CreateStaffDto) {
        return this.managerService.createStaff(userId, dto);
    }

    @Patch('staff/:id')
    @ApiOperation({ summary: 'Update branch staff member' })
    updateStaff(
        @CurrentUser('id') userId: string,
        @Param('id') staffUserId: string,
        @Body() dto: UpdateStaffDto
    ) {
        return this.managerService.updateStaff(userId, staffUserId, dto);
    }

    @Delete('staff/:id')
    @ApiOperation({ summary: 'Remove staff from the branch' })
    deleteStaff(@CurrentUser('id') userId: string, @Param('id') staffUserId: string) {
        return this.managerService.deleteStaff(userId, staffUserId);
    }

    @Get('leave-requests')
    @ApiOperation({ summary: 'Get all leave/day off requests for the branch' })
    getLeaveRequests(@CurrentUser('id') userId: string) {
        return this.managerService.getLeaveRequests(userId);
    }

    @Patch('leave-requests/:id/status')
    @ApiOperation({ summary: 'Approve or reject a leave request' })
    approveLeaveRequest(
        @CurrentUser('id') userId: string,
        @Param('id') leaveId: string,
        @Body() dto: { status: 'APPROVED' | 'REJECTED'; reason?: string }
    ) {
        return this.managerService.approveLeaveRequest(userId, leaveId, dto.status, dto.reason);
    }

    @Get('bookings')
    @ApiOperation({ summary: 'Get all bookings for the branch with filters' })
    getSalonBookings(
        @CurrentUser('id') userId: string,
        @Query('dateFrom') dateFrom?: string,
        @Query('dateTo') dateTo?: string,
        @Query('staffId') staffId?: string,
        @Query('status') status?: BookingStatus,
        @Query('search') search?: string
    ) {
        return this.managerService.getSalonBookings(userId, { dateFrom, dateTo, staffId, status, search });
    }

    @Patch('bookings/:id/reschedule')
    @ApiOperation({ summary: 'Reschedule an appointment' })
    rescheduleBooking(
        @CurrentUser('id') userId: string,
        @Param('id') bookingId: string,
        @Body() dto: { date: string; timeSlot: string; staffId?: string }
    ) {
        return this.managerService.rescheduleBooking(userId, bookingId, dto);
    }

    @Patch('bookings/bulk-status')
    @ApiOperation({ summary: 'Bulk update booking status' })
    bulkUpdateStatus(
        @CurrentUser('id') userId: string,
        @Body('ids') ids: string[],
        @Body('status') status: BookingStatus,
    ) {
        return this.managerService.bulkUpdateBookingStatus(userId, ids, status);
    }

    @Patch('bookings/:id/status')
    @ApiOperation({ summary: 'Update booking status' })
    updateStatus(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Body('status') status: BookingStatus,
    ) {
        return this.managerService.updateBookingStatus(userId, id, status);
    }

    @Get('reports/revenue')
    @ApiOperation({ summary: 'Get revenue report for the branch' })
    getRevenueReport(
        @CurrentUser('id') userId: string,
        @Query('period') period: 'day' | 'week' | 'month' = 'month'
    ) {
        return this.managerService.getRevenueReport(userId, period);
    }

    @Get('reviews')
    @ApiOperation({ summary: 'Get all reviews for the branch' })
    getSalonReviews(@CurrentUser('id') userId: string) {
        return this.managerService.getSalonReviews(userId);
    }

    @Post('reviews/:id/reply')
    @ApiOperation({ summary: 'Reply to a customer review' })
    replyToReview(
        @CurrentUser('id') userId: string,
        @Param('id') reviewId: string,
        @Body() dto: { reply: string }
    ) {
        return this.managerService.replyToReview(userId, reviewId, dto.reply);
    }

    @Get('schedules')
    @ApiOperation({ summary: 'Get staff shifts/schedules' })
    getStaffShifts(
        @CurrentUser() user: User,
        @Query('date') date?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.managerService.getStaffShifts(user.id, date, startDate, endDate);
    }

    @Post('schedules')
    @ApiOperation({ summary: 'Create a new staff shift' })
    createShift(@CurrentUser('id') userId: string, @Body() dto: CreateShiftDto) {
        return this.managerService.createShift(userId, dto);
    }

    @Patch('schedules/:id')
    @ApiOperation({ summary: 'Update a staff shift' })
    updateShift(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Body() dto: UpdateShiftDto,
    ) {
        return this.managerService.updateShift(userId, id, dto);
    }

    @Delete('schedules/:id')
    @ApiOperation({ summary: 'Delete a staff shift' })
    deleteShift(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.managerService.deleteShift(userId, id);
    }
}
