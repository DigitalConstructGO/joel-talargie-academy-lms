import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Options,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { AiChatService } from './ai-chat.service';
import { SendAiChatMessageDto } from './dto/ai-chat-message.dto';

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Public()
  @Options('message')
  @HttpCode(HttpStatus.NO_CONTENT)
  optionsMessage() {
    return;
  }

  /**
   * AI Chat Assistant endpoint.
   * Rate-limited to MAXIMUM 30 requests per IP address per 15 minutes window (900,000ms).
   */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 900_000 } })
  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(@Body() dto: SendAiChatMessageDto) {
    return this.aiChatService.generateResponse(dto);
  }
}
