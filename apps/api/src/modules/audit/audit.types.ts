export interface AuditContext {
  actorId?: string;
  ipAddress?: string;
  userAgent?: string;
}
export interface AuditInput extends AuditContext {
  action: string;
  entityType: string;
  entityId?: string;
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
}
