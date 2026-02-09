import { PartialType } from '@nestjs/swagger';
import { CreateSalonDto } from './create-salon.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSalonDto extends PartialType(CreateSalonDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
