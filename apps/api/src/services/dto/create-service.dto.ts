import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty({ example: 'Classic Haircut' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Professional haircut with styling' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 150000, description: 'Price in VND' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiProperty({ example: 30, description: 'Duration in minutes' })
  @IsNumber()
  @Type(() => Number)
  @Min(5)
  duration: number;

  @ApiProperty({ enum: ServiceCategory, example: ServiceCategory.HAIRCUT })
  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  order?: number;

  @ApiProperty({ description: 'Salon ID' })
  @IsUUID()
  salonId: string;
}
