import {
    IsEmail,
    IsString,
    IsOptional,
    MinLength,
    Matches,
    IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role, AuthProvider } from '@prisma/client';

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @Matches(/^(0[3|5|7|8|9])+([0-9]{8})$/, {
        message: 'Invalid Vietnamese phone number',
    })
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    avatar?: string;

    @ApiPropertyOptional({ enum: Role })
    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @ApiPropertyOptional({ enum: AuthProvider })
    @IsOptional()
    @IsEnum(AuthProvider)
    authProvider?: AuthProvider;
}
