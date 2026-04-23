import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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

  // ─── DASHBOARD ───────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get cashier dashboard stats + upcoming bookings' })
  getDashboardStats(@CurrentUser('id') userId: string) {
    return this.cashierService.getDashboardStats(userId);
  }

  // ─── ONLINE BOOKINGS ────────────────────────────────────

  @Get('bookings/pending')
  @ApiOperation({ summary: 'Get pending online bookings for approval' })
  getPendingBookings(@CurrentUser('id') userId: string) {
    return this.cashierService.getPendingBookings(userId);
  }

  @Patch('bookings/:id/approve')
  @ApiOperation({ summary: 'Approve a pending booking' })
  approveBooking(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
    @Body() body: { staffId?: string; timeSlot?: string; date?: string },
  ) {
    return this.cashierService.approveBooking(userId, bookingId, body);
  }

  @Patch('bookings/:id/reject')
  @ApiOperation({ summary: 'Reject a pending booking' })
  rejectBooking(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
    @Body() body: { reason: string },
  ) {
    return this.cashierService.rejectBooking(userId, bookingId, body.reason);
  }

  // ─── BOOKINGS LIST ──────────────────────────────────────

  @Get('bookings/checkout-eligible')
  @ApiOperation({ summary: 'Get bookings ready for checkout today' })
  getCheckoutEligibleBookings(@CurrentUser('id') userId: string) {
    return this.cashierService.getCheckoutEligibleBookings(userId);
  }

  @Get('bookings/:id')
  @ApiOperation({ summary: 'Get booking detail' })
  getBookingDetail(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
  ) {
    return this.cashierService.getBookingDetail(userId, bookingId);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get all bookings with filters' })
  getAllBookings(
    @CurrentUser('id') userId: string,
    @Query('date') date?: string,
    @Query('status') status?: BookingStatus,
    @Query('search') search?: string,
  ) {
    return this.cashierService.getBookings(userId, { date, status, search });
  }

  // ─── WALK-IN ────────────────────────────────────────────

  @Post('bookings/walk-in')
  @ApiOperation({ summary: 'Create a walk-in booking' })
  createWalkinBooking(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      customerName: string;
      phone?: string;
      serviceIds: string[];
      staffId?: string;
      note?: string;
    },
  ) {
    return this.cashierService.createWalkinBooking(userId, body);
  }

  // ─── SERVICE MANAGEMENT ─────────────────────────────────

  @Patch('bookings/:id/add-services')
  @ApiOperation({ summary: 'Add services to an active booking' })
  addServicesToBooking(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
    @Body() body: { serviceIds: string[] },
  ) {
    return this.cashierService.addServicesToBooking(
      userId,
      bookingId,
      body.serviceIds,
    );
  }

  // ─── CHECKOUT ───────────────────────────────────────────

  @Post('bookings/:id/checkout')
  @ApiOperation({ summary: 'Checkout and process payment' })
  checkoutBooking(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
    @Body() body: { method: PaymentMethod },
  ) {
    return this.cashierService.checkoutBooking(userId, bookingId, body);
  }

  // ─── STATUS ─────────────────────────────────────────────

  @Patch('bookings/:id/status')
  @ApiOperation({ summary: 'Update booking status' })
  updateBookingStatus(
    @CurrentUser('id') userId: string,
    @Param('id') bookingId: string,
    @Body() body: { status: BookingStatus },
  ) {
    return this.cashierService.updateBookingStatus(
      userId,
      bookingId,
      body.status,
    );
  }

  // ─── PAYMENT HISTORY ─────────────────────────────────────

  @Get('payment-history')
  @ApiOperation({ summary: 'Get payment history for shift reconciliation' })
  getPaymentHistory(
    @CurrentUser('id') userId: string,
    @Query('date') date?: string,
  ) {
    return this.cashierService.getPaymentHistory(userId, { date });
  }

  // ─── REVENUE ────────────────────────────────────────────

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue stats with trends' })
  getRevenue(
    @CurrentUser('id') userId: string,
    @Query('salonId') salonId?: string,
  ) {
    return this.cashierService.getRevenue(userId, salonId);
  }

  // ─── QUEUE ──────────────────────────────────────────────

  @Get('queue')
  @ApiOperation({ summary: 'Get waiting queue' })
  getQueue(@CurrentUser('id') userId: string) {
    return this.cashierService.getQueue(userId);
  }

  @Post('queue')
  @ApiOperation({ summary: 'Add customer to waiting queue' })
  addToQueue(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      customerName: string;
      phone?: string;
      serviceId?: string;
      staffId?: string;
    },
  ) {
    return this.cashierService.addToQueue(userId, body);
  }

  @Patch('queue/:id/status')
  @ApiOperation({ summary: 'Update queue item status' })
  updateQueueStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { status: string; staffId?: string },
  ) {
    return this.cashierService.updateQueueStatus(
      userId,
      id,
      body.status,
      body.staffId,
    );
  }

  // ─── BARBERS ────────────────────────────────────────────

  @Get('barbers/available')
  @ApiOperation({ summary: 'Get available barbers for a date/time' })
  getAvailableBarbers(
    @CurrentUser('id') userId: string,
    @Query('date') date: string,
    @Query('timeSlot') timeSlot: string,
  ) {
    return this.cashierService.getAvailableBarbers(userId, date, timeSlot);
  }

  // ─── CUSTOMERS ──────────────────────────────────────────

  @Get('customers/search')
  @ApiOperation({ summary: 'Search customers by name or phone' })
  searchCustomers(
    @CurrentUser('id') userId: string,
    @Query('q') query: string,
  ) {
    return this.cashierService.searchCustomers(userId, query);
  }
}
