import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
import { AdminModule } from './admin/admin.module';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // When running via Turborepo from repo root, process.cwd() is the repo root.
      // When running directly inside apps/api, process.cwd() is apps/api.
      // Support both so PORT/DATABASE_URL/etc are loaded consistently.
      envFilePath: [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), 'apps/api/.env'),
        resolve(__dirname, '..', '.env'),
      ],
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SalonsModule,
    ServicesModule,
    StaffModule,
    BookingsModule,
    PaymentsModule,
    ReviewsModule,
    NotificationsModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
