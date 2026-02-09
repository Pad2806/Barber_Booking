import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { VietQRService } from './vietqr.service';
import { SepayWebhookController } from './sepay-webhook.controller';

@Module({
  controllers: [PaymentsController, SepayWebhookController],
  providers: [PaymentsService, VietQRService],
  exports: [PaymentsService, VietQRService],
})
export class PaymentsModule {}
