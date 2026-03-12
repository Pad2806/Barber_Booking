import { IsString, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShiftDto {
    @ApiProperty({ example: 'staff-uuid-here' })
    @IsUUID()
    @IsNotEmpty()
    staffId: string;

    @ApiProperty({ example: '2024-03-20', description: 'Date of the shift' })
    @IsDateString()
    @IsNotEmpty()
    date: string;

    @ApiProperty({ example: '2024-03-20T08:00:00Z', description: 'Shift start time' })
    @IsDateString()
    @IsNotEmpty()
    shiftStart: string;

    @ApiProperty({ example: '2024-03-20T12:00:00Z', description: 'Shift end time' })
    @IsDateString()
    @IsNotEmpty()
    shiftEnd: string;
}
