import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsDateString,
  Matches,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'Salon ID' })
  @IsUUID()
  salonId: string;

  @ApiProperty({ description: 'Array of service IDs', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  serviceIds: string[];

  @ApiPropertyOptional({ description: 'Staff ID (optional - can be assigned later)' })
  @IsOptional()
  @IsUUID()
  staffId?: string;

  @ApiProperty({ example: '2024-12-25', description: 'Booking date' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '09:00', description: 'Start time slot' })
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time slot must be in HH:mm format',
  })
  timeSlot: string;

  @ApiPropertyOptional({ example: 'Please prepare for skin fade haircut' })
  @IsOptional()
  @IsString()
  note?: string;
}
