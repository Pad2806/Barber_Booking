import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StaffPosition } from '@prisma/client';

export class UpdateStaffDto {
  @ApiPropertyOptional({ enum: StaffPosition })
  @IsOptional()
  @IsEnum(StaffPosition)
  position?: StaffPosition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
