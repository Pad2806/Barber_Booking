import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  Matches,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, AuthProvider, StaffPosition } from '@prisma/client';

export class CreateStaffDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '0901234567' })
  @Matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, {
    message: 'Invalid Vietnamese phone number',
  })
  phone: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ enum: StaffPosition })
  @IsEnum(StaffPosition)
  position: StaffPosition;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  salonId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bio?: string;
}
