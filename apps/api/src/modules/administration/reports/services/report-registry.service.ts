import { BadRequestException, Injectable } from '@nestjs/common';
import { REPORT_TYPES, ReportType } from '../report.types';
const columns = [
  'id',
  'name',
  'email',
  'status',
  'createdAt',
  'course',
  'student',
  'progress',
  'amount',
  'currency',
  'reviewedAt',
  'completedAt',
  'certificateNumber',
  'action',
  'entityType',
];
const sensitiveColumns = new Set(['email']);
@Injectable()
export class ReportRegistryService {
  readonly types = REPORT_TYPES;
  assertType(value: string): asserts value is ReportType {
    if (!REPORT_TYPES.includes(value as ReportType))
      throw new BadRequestException('Unsupported report type');
  }
  validateColumns(selected?: string[]) {
    if (selected?.some((c) => !columns.includes(c)))
      throw new BadRequestException('Unsupported report column');
  }
  hasSensitiveColumns(selected?: string[]) {
    return selected?.some((column) => sensitiveColumns.has(column)) ?? false;
  }
  requiresAuditExport(type: ReportType) {
    return (
      type === 'ADMINISTRATOR_ACTIVITY' ||
      type === 'AUTHENTICATION_SECURITY_EVENTS'
    );
  }
}
