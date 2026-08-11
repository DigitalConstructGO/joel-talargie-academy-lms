import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum NotificationPriorityDto {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
export enum DeliveryStatusDto {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  SENT = 'SENT',
  RETRY_SCHEDULED = 'RETRY_SCHEDULED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  SUPPRESSED = 'SUPPRESSED',
}
export class PageDto {
  @IsOptional() @Transform(({ value }) => Number(value)) @IsInt() @Min(1) page =
    1;
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}
export class NotificationListDto extends PageDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  unread?: boolean;
  @IsOptional() @IsString() @MaxLength(80) type?: string;
  @IsOptional()
  @IsEnum(NotificationPriorityDto)
  priority?: NotificationPriorityDto;
  /** Matched against title and body (case-insensitive substring). */
  @IsOptional() @IsString() @MaxLength(200) search?: string;
}
export class MarkNotificationsReadDto {
  @IsArray() @IsUUID('4', { each: true }) notificationIds!: string[];
}
export class DeliveryListDto extends PageDto {
  @IsOptional() @IsEnum(DeliveryStatusDto) status?: DeliveryStatusDto;
  @IsOptional() @IsString() @MaxLength(80) templateCode?: string;
  @IsOptional() @IsString() @MaxLength(200) search?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}
export class NotificationReasonDto {
  @IsString() @Length(3, 500) reason!: string;
}
export class TemplatePreviewDto {
  @IsOptional() variables: Record<string, string> = {};
}
