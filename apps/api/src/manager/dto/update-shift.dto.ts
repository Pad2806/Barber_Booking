import { IsOptional, IsDateString, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShiftType } from '@prisma/client';

export class UpdateShiftDto {
    @ApiProperty({ example: 'staff-uuid-here', required: false })
    @IsUUID()
    @IsOptional()
    staffId?: string;

    @ApiProperty({ example: '2024-03-20', description: 'Date of the shift', required: false })
    @IsDateString()
    @IsOptional()
    date?: string;

    @ApiProperty({ example: '2024-03-20T08:00:00Z', description: 'Shift start time', required: false })
    @IsDateString()
    @IsOptional()
    shiftStart?: string;

    @ApiProperty({ example: '2024-03-20T12:00:00Z', description: 'Shift end time', required: false })
    @IsDateString()
    @IsOptional()
    shiftEnd?: string;

    @ApiProperty({ enum: ShiftType, example: ShiftType.FULL_DAY, required: false })
    @IsEnum(ShiftType)
    @IsOptional()
    type?: ShiftType;
}
