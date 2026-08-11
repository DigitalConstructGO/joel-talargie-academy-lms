import { Injectable } from '@nestjs/common';
import { AuthorizationRepository } from '../repositories/authorization.repository';
@Injectable()
export class PermissionsService {
  constructor(private readonly repository: AuthorizationRepository) {}
  async list(search?: string) {
    const permissions = await this.repository.permissions(search);
    const groups = [...new Set(permissions.map((item) => item.module))].map(
      (module) => ({
        module,
        permissions: permissions.filter((item) => item.module === module),
      }),
    );
    return { groups };
  }
}
