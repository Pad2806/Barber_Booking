import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsUUID()
  bookingId: string;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.VIETQR })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}
