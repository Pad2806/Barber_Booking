import { IsArray, IsNotEmpty, IsEnum, IsUUID, ArrayMinSize, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShiftType } from '@prisma/client';

export class BulkCreateShiftDto {
    @ApiProperty({ example: ['staff-uuid-1', 'staff-uuid-2'], description: 'Staff IDs to apply shifts to' })
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    staffIds: string[];

    @ApiProperty({ example: ['2024-03-20', '2024-03-21'], description: 'Dates to create shifts for' })
    @IsArray()
    @ArrayMinSize(1)
    @IsDateString({}, { each: true })
    dates: string[];

    @ApiProperty({ enum: ShiftType, example: ShiftType.FULL_DAY })
    @IsEnum(ShiftType)
    @IsNotEmpty()
    type: ShiftType;
}
