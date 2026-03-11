import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { BookingsModule } from '../bookings/bookings.module';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [BookingsModule],
  controllers: [AdminController],
  providers: [AdminService, AnalyticsService],
  exports: [AdminService],
})
export class AdminModule { }
