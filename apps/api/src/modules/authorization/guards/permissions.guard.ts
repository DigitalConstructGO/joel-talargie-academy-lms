import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from '../../audit/audit.service';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PERMISSION_MODE_KEY } from '../decorators/permission-mode.decorator';
import { PermissionMode } from '../enums/permission-mode.enum';
import type { PermissionCode } from '../constants/permissions.constants';
import type { AuthorizedRequest } from '../interfaces/authorization-context.interface';
import { AuthorizationContextService } from '../services/authorization-context.service';
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly contexts: AuthorizationContextService,
    private readonly audit: AuditService,
  ) {}
  async canActivate(execution: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<PermissionCode[]>(
      REQUIRED_PERMISSIONS_KEY,
      [execution.getHandler(), execution.getClass()],
    );
    if (!required?.length) return true;
    const request = execution.switchToHttp().getRequest<AuthorizedRequest>();
    if (!request.user?.id) throw new UnauthorizedException();
    const context = await this.contexts.resolve(request.user.id);
    if (!context || context.status !== 'ACTIVE')
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to perform this action.',
      });
    request.authorization = context;
    const mode =
      this.reflector.getAllAndOverride<PermissionMode>(PERMISSION_MODE_KEY, [
        execution.getHandler(),
        execution.getClass(),
      ]) ?? PermissionMode.ALL;
    const allowed =
      context.isAdministrator ||
      (mode === PermissionMode.ALL
        ? required.every((permission) =>
            context.permissions.includes(permission),
          )
        : required.some((permission) =>
            context.permissions.includes(permission),
          ));
    if (!allowed) {
      await this.audit.logCustom({
        actorId: context.userId,
        action: 'authorization.denied',
        entityType: 'authorization',
        newData: { required, mode },
      });
      throw new ForbiddenException({
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'You do not have permission to perform this action.',
      });
    }
    return true;
  }
}
