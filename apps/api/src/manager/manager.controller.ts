import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ManagerService } from './manager.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Manager')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.SALON_OWNER, Role.SUPER_ADMIN)
@Controller('manager')
export class ManagerController {
    constructor(private readonly managerService: ManagerService) { }

    @Get('dashboard')
    @ApiOperation({ summary: 'Get manager dashboard stats' })
    getDashboardStats(@CurrentUser('id') userId: string) {
        return this.managerService.getDashboardStats(userId);
    }

    @Get('staff')
    @ApiOperation({ summary: 'Get staff belonging to manager salon' })
    getSalonStaff(@CurrentUser('id') userId: string) {
        return this.managerService.getSalonStaff(userId);
    }

    @Get('schedules')
    @ApiOperation({ summary: 'Get staff shifts/schedules' })
    getStaffShifts(
        @CurrentUser('id') userId: string,
        @Query('date') date?: string,
    ) {
        return this.managerService.getStaffShifts(userId, date);
    }

    @Post('schedules')
    @ApiOperation({ summary: 'Create a new staff shift' })
    createShift(@CurrentUser('id') userId: string, @Body() dto: CreateShiftDto) {
        return this.managerService.createShift(userId, dto);
    }

    @Patch('schedules/:id')
    @ApiOperation({ summary: 'Update a staff shift' })
    updateShift(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Body() dto: UpdateShiftDto,
    ) {
        return this.managerService.updateShift(userId, id, dto);
    }

    @Delete('schedules/:id')
    @ApiOperation({ summary: 'Delete a staff shift' })
    deleteShift(@CurrentUser('id') userId: string, @Param('id') id: string) {
        return this.managerService.deleteShift(userId, id);
    }
}
