import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { PrismaModule } from '../database/prisma.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [PrismaModule, UsersModule],
    controllers: [ManagerController],
    providers: [ManagerService],
    exports: [ManagerService],
})
export class ManagerModule { }
