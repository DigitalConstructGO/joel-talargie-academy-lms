import { Injectable } from '@nestjs/common';
import { AuditRepository } from './audit.repository';
import type { AuditContext, AuditInput } from './audit.types';

const sensitiveKeys = new Set([
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'databaseUrl',
]);
const sanitize = (
  value?: Record<string, unknown>,
): Record<string, unknown> | undefined =>
  value
    ? Object.fromEntries(
        Object.entries(value).filter(([key]) => !sensitiveKeys.has(key)),
      )
    : undefined;

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}
  logCreate(
    entityType: string,
    entityId: string,
    data: Record<string, unknown>,
    context: AuditContext = {},
  ) {
    return this.logCustom({
      ...context,
      action: 'CREATE',
      entityType,
      entityId,
      newData: data,
    });
  }
  logUpdate(
    entityType: string,
    entityId: string,
    previousData: Record<string, unknown>,
    newData: Record<string, unknown>,
    context: AuditContext = {},
  ) {
    return this.logCustom({
      ...context,
      action: 'UPDATE',
      entityType,
      entityId,
      previousData,
      newData,
    });
  }
  logDelete(
    entityType: string,
    entityId: string,
    previousData: Record<string, unknown>,
    context: AuditContext = {},
  ) {
    return this.logCustom({
      ...context,
      action: 'DELETE',
      entityType,
      entityId,
      previousData,
    });
  }
  logLogin(actorId: string, context: AuditContext = {}) {
    return this.logCustom({
      ...context,
      actorId,
      action: 'LOGIN',
      entityType: 'user',
      entityId: actorId,
    });
  }
  logLogout(actorId: string, context: AuditContext = {}) {
    return this.logCustom({
      ...context,
      actorId,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: actorId,
    });
  }
  logCustom(input: AuditInput): Promise<void> {
    return this.repository.create({
      ...input,
      previousData: sanitize(input.previousData),
      newData: sanitize(input.newData),
    });
  }
}
