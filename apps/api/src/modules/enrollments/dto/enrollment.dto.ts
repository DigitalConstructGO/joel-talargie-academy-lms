import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum EnrollmentStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  ENROLLED = 'ENROLLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ACCESS_REVOKED = 'ACCESS_REVOKED',
}
export class CreateEnrollmentDto {
  @IsUUID() courseId!: string;
}
export class EnrollmentPaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
export class ListMyEnrollmentsDto extends EnrollmentPaginationDto {
  @IsOptional() @IsEnum(EnrollmentStatus) status?: EnrollmentStatus;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsUUID() categoryId?: string;
}
export class ListAdminEnrollmentsDto extends ListMyEnrollmentsDto {
  @IsOptional() @IsUUID() studentId?: string;
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsDateString() createdFrom?: string;
  @IsOptional() @IsDateString() createdTo?: string;
}
export class EnrollmentReasonDto {
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}
export class EnrollmentActivityQueryDto extends EnrollmentPaginationDto {
  @IsOptional() @IsString() @MaxLength(100) action?: string;
  @IsOptional() @IsDateString() createdFrom?: string;
  @IsOptional() @IsDateString() createdTo?: string;
}
