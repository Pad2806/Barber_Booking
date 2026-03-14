import { Module } from '@nestjs/common';
import { AIAssistantController } from './ai-assistant.controller';
import { AIAssistantService } from './ai-assistant.service';
import { AIToolsService } from './ai-tools.service';
import { ServicesModule } from '../services/services.module';
import { StaffModule } from '../staff/staff.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    ServicesModule,
    StaffModule,
    BookingsModule,
  ],
  controllers: [AIAssistantController],
  providers: [AIAssistantService, AIToolsService],
  exports: [AIAssistantService],
})
export class AIAssistantModule {}
