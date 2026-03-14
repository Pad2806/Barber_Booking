import { Module } from '@nestjs/common';
import { AIChatService } from './ai-chat.service';
import { AIChatController } from './ai-chat.controller';
import { ServicesModule } from '../services/services.module';
import { StaffModule } from '../staff/staff.module';
import { BookingsModule } from '../bookings/bookings.module';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ServicesModule,
    StaffModule,
    BookingsModule,
  ],
  controllers: [AIChatController],
  providers: [AIChatService],
  exports: [AIChatService],
})
export class AIChatModule {}
