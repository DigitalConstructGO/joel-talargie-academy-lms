import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  @Get('storage')
  @ApiOkResponse({ description: 'Storage backend accessibility status' })
  getStorageHealth() {
    return this.health.getStorageHealth();
  }
  @Get('live')
  @ApiOkResponse({
    description:
      'Liveness probe - process is alive. Never checks dependencies.',
  })
  getLiveness() {
    return this.health.getLiveness();
  }
  @Get('ready')
  @ApiOkResponse({
    description: 'Readiness probe - database and storage are both reachable',
  })
  @ApiServiceUnavailableResponse({
    description: 'One or more dependencies are unavailable',
  })
  getReadiness() {
    return this.health.getReadiness();
  }
}
