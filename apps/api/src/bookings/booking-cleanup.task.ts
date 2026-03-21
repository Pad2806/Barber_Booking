import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingsService } from './bookings.service';

@Injectable()
export class BookingCleanupTask {
  private readonly logger = new Logger(BookingCleanupTask.name);

  constructor(private readonly bookingsService: BookingsService) {}

  /**
   * Run every 5 minutes: cancel PENDING bookings that exceeded the
   * payment window (15 min) to release time slots.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredBookings() {
    try {
      const count = await this.bookingsService.cancelExpiredBookings();
      if (count > 0) {
        this.logger.log(`[CRON] Auto-cancelled ${count} expired unpaid booking(s)`);
      }
    } catch (error) {
      this.logger.error('[CRON] Failed to clean up expired bookings:', error);
    }
  }
}
