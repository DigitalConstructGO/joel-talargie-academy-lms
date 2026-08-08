import { Injectable } from '@nestjs/common';
import { insertActivityLog } from '@joel-academy/database';
import { DatabaseService } from '../../common/database/database.service';
import type { AuditInput } from './audit.types';

@Injectable()
export class AuditRepository {
  constructor(private readonly database: DatabaseService) {}
  async create(input: AuditInput): Promise<void> {
    await insertActivityLog(this.database.client, {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.previousData,
      after: input.newData,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }
}
