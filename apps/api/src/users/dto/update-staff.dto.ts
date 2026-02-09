import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  Matches,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StaffPosition } from '@prisma/client';

export class UpdateStaffDto {
  // User fields
  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @Matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, {
    message: 'Invalid Vietnamese phone number',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'password123', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  // Staff fields
  @ApiPropertyOptional({ enum: StaffPosition })
  @IsOptional()
  @IsEnum(StaffPosition)
  position?: StaffPosition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  salonId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;
}
