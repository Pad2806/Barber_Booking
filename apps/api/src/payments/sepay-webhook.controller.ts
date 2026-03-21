import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
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
 * Webhook URL: POST /api/payments/webhook/sepay
 * 
 * You need to configure this URL in your Sepay dashboard.
 */
@ApiTags('Webhooks')
@Controller('payments/webhook')
export class SepayWebhookController {
  private readonly logger = new Logger(SepayWebhookController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) { }

  @Post('sepay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sepay webhook endpoint' })
  @ApiExcludeEndpoint() // Hide from Swagger docs for security
  async handleSepayWebhook(
    @Body() body: SepayWebhookPayload,
    @Headers('authorization') authHeader: string,
  ) {
    this.logger.log(`[SEPAY WEBHOOK] Received: content="${body.content}", amount=${body.transferAmount}, gateway=${body.gateway}`);

    // Verify webhook secret (SePay sends: "Apikey <key>" or "Bearer <key>")
    const webhookSecret = this.configService.get<string>('payment.sepay.webhookSecret');

    if (webhookSecret) {
      // SePay may send auth as "Apikey <secret>" or "Bearer <secret>"
      const token = authHeader
        ? authHeader.replace(/^(Bearer|Apikey)\s+/i, '').trim()
        : '';

      if (token !== webhookSecret) {
        this.logger.warn(`[SEPAY WEBHOOK] Auth FAILED. Expected: ${webhookSecret.substring(0, 8)}..., Got: ${token.substring(0, 8)}...`);
        throw new UnauthorizedException('Invalid webhook signature');
      }
      this.logger.log('[SEPAY WEBHOOK] Auth OK');
    } else {
      this.logger.log('[SEPAY WEBHOOK] No webhookSecret configured, skipping auth check');
    }

    // Process the webhook
    const result = await this.paymentsService.processSepayWebhook(body);

    this.logger.log(`[SEPAY WEBHOOK] Result: success=${result.success}, message=${result.message}`);

    // Sepay expects a response with success status
    return {
      success: result.success,
      message: result.message,
    };
  }
}

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
