import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { ServiceCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ServiceQueryDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    salonId?: string;

    @IsOptional()
    @IsEnum(ServiceCategory)
    category?: ServiceCategory;

    @IsOptional()
    @Type(() => Boolean)
    @IsBoolean()
    isActive?: boolean;
}
