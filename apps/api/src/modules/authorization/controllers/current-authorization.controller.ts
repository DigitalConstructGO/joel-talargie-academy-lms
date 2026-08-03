import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { AuthorizationContextService } from '../services/authorization-context.service';
@ApiTags('Authorization')
@ApiBearerAuth()
@Controller('auth/authorization')
export class CurrentAuthorizationController {
  constructor(private readonly contexts: AuthorizationContextService) {}
  @Get()
  @ApiOkResponse({ description: 'Current roles and live database permissions' })
  async current(@CurrentUser() user: AuthUser) {
    const context = await this.contexts.resolve(user.id);
    return {
      roles: context?.roles ?? [],
      permissions: context?.permissions ?? [],
    };
  }
}
