import { IsString, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    shiftStart: string;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    shiftEnd: string;
}
