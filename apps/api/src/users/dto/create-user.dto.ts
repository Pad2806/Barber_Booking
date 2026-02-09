import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, AuthProvider } from '@prisma/client';

export class CreateUserDto {
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

  @ApiPropertyOptional({ enum: Role, default: Role.CUSTOMER })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: AuthProvider, default: AuthProvider.LOCAL })
  @IsOptional()
  @IsEnum(AuthProvider)
  authProvider?: AuthProvider;
}
