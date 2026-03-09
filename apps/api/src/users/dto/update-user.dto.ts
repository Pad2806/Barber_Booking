import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import '@nestjs/common';

export class UpdateUserDto extends PartialType(CreateUserDto) { }
