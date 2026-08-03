import { Injectable } from '@nestjs/common';
import {
  archiveCustomRole,
  assignRoleToUser,
  createRoleWithPermissions,
  getRoleDetails,
  listPermissionCatalog,
  listRoles,
  listUserRoles,
  removeRoleFromUser,
  replaceCustomRolePermissions,
  updateCustomRole,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
@Injectable()
export class AuthorizationRepository {
  constructor(private readonly database: DatabaseService) {}
  permissions(search?: string) {
    return listPermissionCatalog(this.database.client, search);
  }
  roles(input: Parameters<typeof listRoles>[1]) {
    return listRoles(this.database.client, input);
  }
  role(id: string) {
    return getRoleDetails(this.database.client, id);
  }
  create(input: Parameters<typeof createRoleWithPermissions>[1]) {
    return createRoleWithPermissions(this.database.client, input);
  }
  update(input: Parameters<typeof updateCustomRole>[1]) {
    return updateCustomRole(this.database.client, input);
  }
  replacePermissions(
    input: Parameters<typeof replaceCustomRolePermissions>[1],
  ) {
    return replaceCustomRolePermissions(this.database.client, input);
  }
  archive(actorId: string, roleId: string) {
    return archiveCustomRole(this.database.client, actorId, roleId);
  }
  userRoles(userId: string) {
    return listUserRoles(this.database.client, userId);
  }
  assign(input: Parameters<typeof assignRoleToUser>[1]) {
    return assignRoleToUser(this.database.client, input);
  }
  remove(input: Parameters<typeof removeRoleFromUser>[1]) {
    return removeRoleFromUser(this.database.client, input);
  }
}
