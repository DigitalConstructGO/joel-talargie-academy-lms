import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateRoleDto,
  ListRolesQueryDto,
  UpdateRoleDto,
} from '../dto/role.dto';
import { AuthorizationRepository } from '../repositories/authorization.repository';
import { AuthorizationContextService } from './authorization-context.service';
@Injectable()
export class RolesService {
  constructor(
    private readonly repository: AuthorizationRepository,
    private readonly contexts: AuthorizationContextService,
  ) {}
  list(query: ListRolesQueryDto) {
    return this.repository.roles({
      search: query.search,
      isSystem: query.isSystem,
      archived: query.archived,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }
  async details(id: string) {
    const role = await this.repository.role(id);
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }
  private async assertAssignable(actorId: string, permissionIds: string[]) {
    const context = await this.contexts.resolve(actorId);
    if (!context || context.status !== 'ACTIVE') throw new ForbiddenException();
    if (context.isAdministrator) return;
    const requested = await this.repository.permissions();
    const codes = requested
      .filter((permission) => permissionIds.includes(permission.id))
      .map((permission) => permission.code);
    if (
      codes.length !== permissionIds.length ||
      codes.some((code) => !context.permissions.includes(code))
    )
      throw new ForbiddenException({
        code: 'PRIVILEGE_ESCALATION_BLOCKED',
        message: 'You cannot assign permissions you do not possess.',
      });
  }
  async create(actorId: string, dto: CreateRoleDto) {
    await this.assertAssignable(actorId, dto.permissionIds);
    try {
      return await this.repository.create({
        actorId,
        name: dto.name.trim(),
        code: dto.code,
        description: dto.description?.trim(),
        permissionIds: dto.permissionIds,
      });
    } catch (error) {
      if (String(error).includes('INVALID_PERMISSION'))
        throw new BadRequestException('One or more permission IDs are invalid');
      if (String(error).includes('PRIVILEGE_ESCALATION'))
        throw new ForbiddenException({
          code: 'PRIVILEGE_ESCALATION_BLOCKED',
          message: 'You cannot assign permissions you do not possess.',
        });
      if (/unique|duplicate/i.test(String(error)))
        throw new ConflictException('Role name or code already exists');
      throw error;
    }
  }
  async update(actorId: string, id: string, dto: UpdateRoleDto) {
    try {
      return await this.repository.update({
        actorId,
        roleId: id,
        name: dto.name?.trim(),
        description: dto.description?.trim(),
      });
    } catch (error) {
      this.map(error);
    }
  }
  async replacePermissions(
    actorId: string,
    id: string,
    permissionIds: string[],
  ) {
    await this.assertAssignable(actorId, permissionIds);
    try {
      return await this.repository.replacePermissions({
        actorId,
        roleId: id,
        permissionIds,
      });
    } catch (error) {
      this.map(error);
    }
  }
  async archive(actorId: string, id: string) {
    try {
      return await this.repository.archive(actorId, id);
    } catch (error) {
      this.map(error);
    }
  }
  private map(error: unknown): never {
    const value = String(error);
    if (value.includes('ROLE_NOT_FOUND'))
      throw new NotFoundException('Role not found');
    if (value.includes('SYSTEM_ROLE'))
      throw new ForbiddenException('System roles cannot be modified');
    if (value.includes('PRIVILEGE_ESCALATION'))
      throw new ForbiddenException({
        code: 'PRIVILEGE_ESCALATION_BLOCKED',
        message: 'You cannot assign permissions you do not possess.',
      });
    if (/unique|duplicate/i.test(value))
      throw new ConflictException('Role name already exists');
    throw error;
  }
}
