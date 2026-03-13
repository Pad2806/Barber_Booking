import { IsNotEmpty, IsDateString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShiftType } from '@prisma/client';

export class AssignShiftDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    staffId: string;

    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    salonId: string;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    date: string;

    @ApiProperty({ enum: ShiftType })
    @IsEnum(ShiftType)
    @IsOptional()
    type?: ShiftType;

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    shiftStart?: string;

    @ApiProperty({ required: false })
    @IsDateString()
    @IsOptional()
    shiftEnd?: string;
}
