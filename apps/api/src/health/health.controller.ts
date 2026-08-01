import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '../common/decorators/public.decorator';
@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}
  @Get()
  @ApiOkResponse({
    description: 'Service health in the standard API response envelope',
  })
  getHealth() {
    return this.health.getHealth();
  }
  @Get('database')
  @ApiOkResponse({ description: 'Sanitized database connectivity status' })
  getDatabaseHealth() {
    return this.health.getDatabaseHealth();
  }
}
