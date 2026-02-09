import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplyReviewDto {
  @ApiProperty({ example: 'Thank you for your feedback!' })
  @IsString()
  reply: string;
}
