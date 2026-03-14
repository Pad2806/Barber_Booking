import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AIAssistantService } from './ai-assistant.service';

@Controller('ai-assistant')
export class AIAssistantController {
  private readonly logger = new Logger(AIAssistantController.name);

  constructor(private readonly assistantService: AIAssistantService) {}

  @Post('chat')
  async chat(
    @Body() body: { message: string; sessionId: string; userId?: string },
  ) {
    try {
      if (!body.message || !body.sessionId) {
        return { response: 'Thiếu thông tin tin nhắn hoặc Session ID.' };
      }

      return await this.assistantService.chat(
        body.message,
        body.sessionId,
        body.userId,
      );
    } catch (error: any) {
      this.logger.error('Controller Chat Error:', error.message);
      return {
        response: 'Rất tiếc, hệ thống chatbot đang gặp sự cố kỹ thuật.',
        error: true,
      };
    }
  }
}
