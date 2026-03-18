import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StaffPosition } from '@prisma/client';
import { Type } from 'class-transformer';

export class UpdateStaffDto {
  @ApiPropertyOptional({ enum: StaffPosition })
  @IsOptional()
  @IsEnum(StaffPosition)
  position?: StaffPosition;

  @ApiPropertyOptional({ description: 'Short bio' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Long description about the staff member' })
  @IsOptional()
  @IsString()
  longDescription?: string;

  @ApiPropertyOptional({ description: 'Specialties list', example: ['Fade', 'Pompadour'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ description: 'Years of experience', example: 5 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  experience?: number;

  @ApiPropertyOptional({ description: 'Gallery of work photos', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  gallery?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
