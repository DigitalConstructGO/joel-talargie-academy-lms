import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { PlatformSettingsService } from './platform-settings.service';

@Public()
@Controller('public')
@ApiTags('Public Landing & Academy Info')
export class PublicLandingController {
  constructor(private readonly service: PlatformSettingsService) {}

  @Get('landing')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Get dynamic public landing page content, active sections, real live statistics, featured courses, and categories',
  })
  getLandingData() {
    return this.service.getLandingPageData();
  }

  @Get('academy-info')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Get public academy branding, contact, and social links',
  })
  async getAcademyInfo() {
    const data = await this.service.getStructuredAcademySettings();
    return {
      general: data.general,
      branding: data.branding,
      publicSettings: data.publicSettings,
    };
  }
}
