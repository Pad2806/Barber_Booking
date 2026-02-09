import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { PaymentsService } from './payments.service';

/**
 * Sepay Webhook Controller
 * 
 * Sepay sends transaction data to this webhook when a bank transfer is received.
 * This allows automatic payment confirmation without manual intervention.
 * 
 * Webhook URL: POST /api/v1/payments/webhook/sepay
 * 
 * You need to configure this URL in your Sepay dashboard.
 */
@ApiTags('Webhooks')
@Controller('payments/webhook')
export class SepayWebhookController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('sepay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sepay webhook endpoint' })
  @ApiExcludeEndpoint() // Hide from Swagger docs for security
  async handleSepayWebhook(
    @Body() body: SepayWebhookPayload,
    @Headers('authorization') authHeader: string,
  ) {
    // Verify webhook secret
    const webhookSecret = this.configService.get<string>('payment.sepay.webhookSecret');

    if (webhookSecret) {
      const expectedAuth = `Bearer ${webhookSecret}`;
      if (authHeader !== expectedAuth) {
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    // Process the webhook
    const result = await this.paymentsService.processSepayWebhook(body);

    // Sepay expects a response with success status
    return {
      success: result.success,
      message: result.message,
    };
  }
}

/**
 * Sepay Webhook Payload Structure
 * 
 * Example payload:
 * {
 *   "id": 93860,
 *   "gateway": "MBBank",
 *   "transactionDate": "2024-03-12 13:14:21",
 *   "accountNumber": "0359123456789",
 *   "subAccount": null,
 *   "transferType": "in",
 *   "transferAmount": 150000,
 *   "accumulated": 150000,
 *   "code": null,
 *   "content": "RB7ABC1234XY thanh toan",
 *   "referenceCode": "FT24072123456",
 *   "description": "MBVCB.1234567890.RB7ABC1234XY thanh toan.CT tu 0901234567 toi 0359123456789"
 * }
 */
interface SepayWebhookPayload {
  id: string;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount?: string | null;
  transferType: 'in' | 'out';
  transferAmount: number;
  accumulated: number;
  code: string | null;
  content: string;
  referenceCode: string;
  description: string;
}
