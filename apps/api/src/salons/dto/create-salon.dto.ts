import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalonDto {
  @ApiProperty({ example: 'Reetro Barber District 1' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'reetro-barber-district-1' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase and contain only letters, numbers, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({ example: 'Premium barbershop experience' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '123 Nguyen Hue Street' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Ho Chi Minh' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'District 1' })
  @IsString()
  district: string;

  @ApiPropertyOptional({ example: 'Ben Nghe' })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ example: 10.7769 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 106.7009 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'salon@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '08:30' })
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Open time must be in HH:mm format',
  })
  openTime?: string;

  @ApiPropertyOptional({ example: '20:30' })
  @IsOptional()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Close time must be in HH:mm format',
  })
  closeTime?: string;

  @ApiPropertyOptional({ example: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workingDays?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  // Payment settings
  @ApiPropertyOptional({ example: 'VCB' })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional({ example: 'NGUYEN VAN A' })
  @IsOptional()
  @IsString()
  bankName?: string;
}
