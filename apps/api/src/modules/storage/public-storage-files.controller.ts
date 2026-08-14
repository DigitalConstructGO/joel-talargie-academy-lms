import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { StorageService } from './storage.service';
import { writeFileResponse } from './utils/http-file-response.util';

/**
 * Backs every `getSignedUrl()` result handed out by certificates, payment
 * receipts, and report exports. The token embeds the storage key and an
 * expiry, HMAC-signed with STORAGE_SIGNING_SECRET - it IS the credential,
 * so this route intentionally accepts no bearer token.
 */
@Public()
@Controller('storage')
@ApiTags('Signed File Downloads')
export class PublicStorageFilesController {
  constructor(private readonly storage: StorageService) {}

  @Public()
  @Get('files/:token')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Stream a file via a short-lived signed download token',
    description:
      'The token is minted by StorageService.getSignedUrl() and expires after its configured TTL (15 minutes by default). An expired or tampered token returns 401 Unauthorized.',
  })
  async streamByToken(
    @Param('token') token: string,
    @Res() response: Response,
  ) {
    const descriptor = await this.storage.streamByToken(token);
    writeFileResponse(response, descriptor, descriptor.disposition);
  }

  @Public()
  @Get('course-thumbnails/:filename')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Stream a public course thumbnail image',
  })
  async streamThumbnail(
    @Param('filename') filename: string,
    @Res() response: Response,
  ) {
    const descriptor = await this.storage.streamCourseThumbnail(filename);
    writeFileResponse(response, descriptor, 'inline');
  }
}
