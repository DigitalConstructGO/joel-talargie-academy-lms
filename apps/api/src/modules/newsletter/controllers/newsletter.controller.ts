import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import {
  ListSubscribersDto,
  SubscribeNewsletterDto,
  UpdateSubscriberStatusDto,
} from '../dto/newsletter.dto';
import { NewsletterService } from '../services/newsletter.service';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe an email address to the newsletter' })
  async subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.newsletterService.subscribe(dto);
  }

  @Get('subscribers')
  @ApiBearerAuth()
  @Roles('ADMINISTRATOR')
  @ApiOperation({ summary: 'List newsletter subscribers (Admin only)' })
  async listSubscribers(@Query() query: ListSubscribersDto) {
    return this.newsletterService.listSubscribers(query);
  }

  @Patch('subscribers/:id/status')
  @ApiBearerAuth()
  @Roles('ADMINISTRATOR')
  @ApiOperation({ summary: 'Update subscriber status (Admin only)' })
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSubscriberStatusDto,
  ) {
    return this.newsletterService.updateStatus(id, dto.status);
  }
}
