import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '../../common/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CurrentAuthorizationController } from './controllers/current-authorization.controller';
import { PermissionsController } from './controllers/permissions.controller';
import { RolesController } from './controllers/roles.controller';
import { UserRolesController } from './controllers/user-roles.controller';
import { PermissionsGuard } from './guards/permissions.guard';
import { AuthorizationRepository } from './repositories/authorization.repository';
import { AuthorizationContextService } from './services/authorization-context.service';
import { PermissionsService } from './services/permissions.service';
import { RolesService } from './services/roles.service';
import { UserRolesService } from './services/user-roles.service';
@Module({
  imports: [DatabaseModule, AuditModule, NotificationsModule],
  controllers: [
    PermissionsController,
    RolesController,
    UserRolesController,
    CurrentAuthorizationController,
  ],
  providers: [
    AuthorizationRepository,
    AuthorizationContextService,
    PermissionsService,
    RolesService,
    UserRolesService,
    PermissionsGuard,
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthorizationContextService, PermissionsGuard],
})
export class AuthorizationModule {}
