import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StaffPosition } from '@prisma/client';

export class CreateStaffDto {
  @ApiProperty({ description: 'User ID to make staff' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Salon ID' })
  @IsUUID()
  salonId: string;

  @ApiProperty({ enum: StaffPosition, example: StaffPosition.STYLIST })
  @IsEnum(StaffPosition)
  position: StaffPosition;

  @ApiPropertyOptional({ example: 'Professional stylist with 5 years experience' })
  @IsOptional()
  @IsString()
  bio?: string;
}
