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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Role, User, BookingStatus } from '@prisma/client';

import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  create(@Body() dto: CreateBookingDto, @CurrentUser('id') customerId: string) {
    return this.bookingsService.create(dto, customerId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF)
  @ApiOperation({ summary: 'Get all bookings (Staff+)' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'salonId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('salonId') salonId?: string,
    @Query('status') status?: BookingStatus,
    @Query('date') date?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.bookingsService.findAll({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      salonId,
      status,
      date: date ? new Date(date) : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  getMyBookings(
    @CurrentUser('id') customerId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: BookingStatus,
  ) {
    return this.bookingsService.findAll({
      customerId,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      status,
    });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming bookings for current user' })
  getUpcoming(@CurrentUser('id') customerId: string) {
    return this.bookingsService.getUpcoming(customerId);
  }

  @Get('today/:salonId')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF)
  @ApiOperation({ summary: "Get today's bookings for salon" })
  getTodayBookings(@Param('salonId') salonId: string) {
    return this.bookingsService.getTodayBookings(salonId);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get booking by code' })
  findByCode(@Param('code') code: string) {
    return this.bookingsService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF)
  @ApiOperation({ summary: 'Update booking status' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.updateStatus(id, dto, user);
  }

  @Patch(':id/assign-staff')
  @UseGuards(RolesGuard)
  @Roles(Role.STAFF)
  @ApiOperation({ summary: 'Assign staff to booking' })
  assignStaff(
    @Param('id') id: string,
    @Body('staffId') staffId: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.assignStaff(id, staffId, user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking' })
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: User,
  ) {
    return this.bookingsService.cancel(id, reason, user);
  }
}
