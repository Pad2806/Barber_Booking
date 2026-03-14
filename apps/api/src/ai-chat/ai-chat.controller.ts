import { Controller, Post, Body, Req } from '@nestjs/common';
import { AIChatService } from './ai-chat.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('ai-chat')
@Controller('ai-chat')
export class AIChatController {
  constructor(private readonly aiChatService: AIChatService) {}

  @Post()
  @ApiOperation({ summary: 'Gửi tin nhắn cho AI Chatbot' })
  async chat(
    @Body('message') message: string,
    @Body('session_id') sessionId: string,
    @Req() req: any
  ) {
    const userId = req.user?.id; // Nếu khách đã đăng nhập
    return this.aiChatService.chat(message, sessionId, userId);
  }
}
