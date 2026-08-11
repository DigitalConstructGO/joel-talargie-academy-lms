import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequirePermissions } from '../decorators/require-permissions.decorator';
import { ListPermissionsQueryDto } from '../dto/role.dto';
import { PermissionsService } from '../services/permissions.service';
@ApiTags('Permissions')
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
@Controller('admin/permissions')
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}
  @Get()
  @RequirePermissions('permissions.read')
  @ApiOkResponse({
    description: 'System-managed permission catalog grouped by module',
  })
  list(@Query() query: ListPermissionsQueryDto) {
    return this.permissions.list(query.search);
  }
}
