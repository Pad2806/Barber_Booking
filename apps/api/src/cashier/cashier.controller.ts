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
import { CashierService } from './cashier.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, BookingStatus, PaymentMethod } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Cashier')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CASHIER, Role.MANAGER, Role.SALON_OWNER, Role.SUPER_ADMIN)
@Controller('cashier')
export class CashierController {
    constructor(private readonly cashierService: CashierService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get cashier dashboard stats' })
    getDashboardStats(@CurrentUser('id') userId: string) {
        return this.cashierService.getDashboardStats(userId);
    }

    @Get('bookings/pending')
    @ApiOperation({ summary: 'Get pending online bookings' })
    getPendingBookings(@CurrentUser('id') userId: string) {
        return this.cashierService.getPendingBookings(userId);
    }

    @Patch('bookings/:id/approve')
    @ApiOperation({ summary: 'Approve a booking' })
    approveBooking(
        @CurrentUser('id') userId: string,
        @Param('id') bookingId: string,
        @Body() body: { staffId?: string, timeSlot?: string, date?: string }
    ) {
        return this.cashierService.approveBooking(userId, bookingId, body);
    }

    @Patch('bookings/:id/reject')
    @ApiOperation({ summary: 'Reject a booking' })
    rejectBooking(
        @CurrentUser('id') userId: string,
        @Param('id') bookingId: string,
        @Body() body: { reason: string }
    ) {
        return this.cashierService.rejectBooking(userId, bookingId, body.reason);
    }

    @Post('bookings/walk-in')
    @ApiOperation({ summary: 'Create a walk-in booking' })
    createWalkinBooking(
        @CurrentUser('id') userId: string,
        @Body() body: {
            customerName: string;
            phone?: string;
            serviceIds: string[];
            staffId?: string;
            note?: string;
        }
    ) {
        return this.cashierService.createWalkinBooking(userId, body);
    }

    @Patch('bookings/:id/add-services')
    @ApiOperation({ summary: 'Add services to an active booking' })
    addServicesToBooking(
        @CurrentUser('id') userId: string,
        @Param('id') bookingId: string,
        @Body() body: { serviceIds: string[] }
    ) {
        return this.cashierService.addServicesToBooking(userId, bookingId, body.serviceIds);
    }

    @Post('bookings/:id/checkout')
    @ApiOperation({ summary: 'Checkout and payment' })
    checkoutBooking(
        @CurrentUser('id') userId: string,
        @Param('id') bookingId: string,
        @Body() body: { method: PaymentMethod }
    ) {
        return this.cashierService.checkoutBooking(userId, bookingId, body);
    }

    @Get('revenue/today')
    @ApiOperation({ summary: 'Get today detailed revenue stats' })
    getDetailedRevenue(@CurrentUser('id') userId: string) {
        return this.cashierService.getDetailedRevenue(userId);
    }

    @Get('customers/search')
    @ApiOperation({ summary: 'Search customers by name or phone' })
    searchCustomers(@CurrentUser('id') userId: string, @Query('q') query: string) {
        return this.cashierService.searchCustomers(userId, query);
    }

    @Get('queue')
    @ApiOperation({ summary: 'Get waiting queue' })
    getQueue(@CurrentUser('id') userId: string) {
        return this.cashierService.getQueue(userId);
    }

    @Post('queue')
    @ApiOperation({ summary: 'Add to waiting queue' })
    addToQueue(
        @CurrentUser('id') userId: string,
        @Body() body: { customerName: string, serviceId?: string, staffId?: string }
    ) {
        return this.cashierService.addToQueue(userId, body);
    }

    @Patch('queue/:id/status')
    @ApiOperation({ summary: 'Update queue item status' })
    updateQueueStatus(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Body() body: { status: string, staffId?: string }
    ) {
        return this.cashierService.updateQueueStatus(userId, id, body.status, body.staffId);
    }

    @Patch('bookings/:id/status')
    @ApiOperation({ summary: 'Update booking status' })
    updateBookingStatus(
        @CurrentUser('id') userId: string,
        @Param('id') bookingId: string,
        @Body() body: { status: BookingStatus }
    ) {
        return this.cashierService.updateBookingStatus(userId, bookingId, body.status);
    }

    @Get('bookings')
    @ApiOperation({ summary: 'Get all bookings for the salon' })
    getAllBookings(
        @CurrentUser('id') userId: string,
        @Query('date') date?: string,
        @Query('status') status?: BookingStatus,
        @Query('search') search?: string,
    ) {
        return this.cashierService.getAllBookings(userId, { date, status, search });
    }

    @Get('barbers/available')
    @ApiOperation({ summary: 'Check available barbers' })
    getAvailableBarbers(
        @CurrentUser('id') userId: string,
        @Query('date') date: string,
        @Query('timeSlot') timeSlot: string
    ) {
        return this.cashierService.getAvailableBarbers(userId, date, timeSlot);
    }
}
