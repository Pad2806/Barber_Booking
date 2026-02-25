import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role, PaymentMethod } from '@prisma/client';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post()
  @ApiOperation({ summary: 'Create deposit payment for booking' })
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(dto);
  }

  @Get('booking/:bookingId')
  @ApiOperation({ summary: 'Get all payments for a booking' })
  getPaymentsByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentsByBooking(bookingId);
  }

  @Get('booking/:bookingId/summary')
  @ApiOperation({ summary: 'Get payment summary (deposit, remaining, total)' })
  getBookingPaymentSummary(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getBookingPaymentSummary(bookingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  getPayment(@Param('id') id: string) {
    return this.paymentsService.getPayment(id);
  }

  @Post(':id/confirm')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF)
  @ApiOperation({ summary: 'Manually confirm payment (Staff+)' })
  confirmPayment(
    @Param('id') id: string,
    @Body('transactionId') transactionId?: string,
  ) {
    return this.paymentsService.confirmPayment(id, transactionId);
  }

  @Post('booking/:bookingId/checkout')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF)
  @ApiOperation({ summary: 'Checkout: collect remaining payment at counter (Receptionist/Manager)' })
  checkout(
    @Param('bookingId') bookingId: string,
    @Body('method') method: PaymentMethod,
  ) {
    return this.paymentsService.checkout(bookingId, method);
  }

  @Get('stats/:salonId')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF)
  @ApiOperation({ summary: 'Get payment statistics for salon' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month'] })
  getStats(
    @Param('salonId') salonId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.paymentsService.getPaymentStats(salonId, period);
  }
}
