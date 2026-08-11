import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationRepository } from '../repositories/authorization.repository';
import { AuthorizationContextService } from './authorization-context.service';
@Injectable()
export class UserRolesService {
  constructor(
    private readonly repository: AuthorizationRepository,
    private readonly contexts: AuthorizationContextService,
  ) {}
  list(userId: string) {
    return this.repository.userRoles(userId);
  }
  async assign(actorId: string, userId: string, roleId: string) {
    const [actor, role] = await Promise.all([
      this.contexts.resolve(actorId),
      this.repository.role(roleId),
    ]);
    if (!actor || !role) throw new NotFoundException('User or role not found');
    if (role.archivedAt)
      throw new ConflictException('Archived roles cannot be assigned');
    if (role.code === 'ADMINISTRATOR' && !actor.isAdministrator)
      throw new ForbiddenException(
        'Only a system Administrator may assign Administrator access',
      );
    if (
      !actor.isAdministrator &&
      role.permissions.some(
        (permission) => !actor.permissions.includes(permission.code),
      )
    )
      throw new ForbiddenException({
        code: 'PRIVILEGE_ESCALATION_BLOCKED',
        message:
          'You cannot assign a role containing permissions you do not possess.',
      });
    try {
      return await this.repository.assign({ actorId, userId, roleId });
    } catch (error) {
      this.map(error);
    }
  }
  async remove(actorId: string, userId: string, roleId: string) {
    try {
      return await this.repository.remove({ actorId, userId, roleId });
    } catch (error) {
      this.map(error);
    }
  }
  private map(error: unknown): never {
    const value = String(error);
    if (
      value.includes('USER_NOT_FOUND') ||
      value.includes('ROLE_NOT_FOUND') ||
      value.includes('ASSIGNMENT_NOT_FOUND')
    )
      throw new NotFoundException('User, role, or assignment not found');
    if (value.includes('ROLE_ALREADY_ASSIGNED'))
      throw new ConflictException('Role is already assigned');
    if (value.includes('LAST_ADMINISTRATOR'))
      throw new ConflictException(
        'The last active Administrator cannot be removed',
      );
    if (value.includes('STUDENT_ROLE_REQUIRED'))
      throw new ForbiddenException('The Student system role cannot be removed');
    if (value.includes('PRIVILEGE_ESCALATION'))
      throw new ForbiddenException({
        code: 'PRIVILEGE_ESCALATION_BLOCKED',
        message: 'You cannot assign this role.',
      });
    throw error;
  }
}
