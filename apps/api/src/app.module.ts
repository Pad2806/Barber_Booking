import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { resolve } from 'node:path';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SalonsModule } from './salons/salons.module';
import { ServicesModule } from './services/services.module';
import { StaffModule } from './staff/staff.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AdminModule } from './admin/admin.module';
import { ManagerModule } from './manager/manager.module';
import { CashierModule } from './cashier/cashier.module';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { StorageModule } from './storage/storage.module';
import { AIAssistantModule } from './ai-assistant/ai-assistant.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), 'apps/api/.env'),
        resolve(__dirname, '..', '.env'),
      ],
      load: [configuration],
    }),
    // Global rate limiting: 300 requests per 60 seconds per IP
    // Admin dashboard fires 10+ queries on mount; 100 was too restrictive
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 300,
    }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    SalonsModule,
    ServicesModule,
    StaffModule,
    BookingsModule,
    PaymentsModule,
    CashierModule,
    ReviewsModule,
    NotificationsModule,
    FavoritesModule,
    AdminModule,
    ManagerModule,
    HealthModule,
    StorageModule,
    AIAssistantModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
