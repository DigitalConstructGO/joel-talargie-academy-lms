import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
}

export class SubmitPaymentDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[A-Za-z0-9][A-Za-z0-9 ._\-/:#]*$/)
  transactionId!: string;

  @IsString()
  @Matches(/^(0|[1-9]\d{0,9})(\.\d{1,2})?$/)
  submittedAmount!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency!: string;

  @IsOptional() @IsDateString() paymentDate?: string;
  @IsOptional() @IsString() @MaxLength(500) studentNote?: string;
  @IsOptional() @IsUUID() paymentMethodId?: string;
}

export class PaymentListQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsEnum(PaymentStatus) status?: PaymentStatus;
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsUUID() paymentMethodId?: string;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsDateString() submittedFrom?: string;
  @IsOptional() @IsDateString() submittedTo?: string;
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  amountMismatch?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  duplicateOnly?: boolean;
}

export class ApprovePaymentDto {
  @IsOptional() @IsString() @MaxLength(500) reviewNote?: string;
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  mismatchApprovalReason?: string;
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  acknowledgeDuplicate?: boolean;
}

export class DeclinePaymentDto {
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
  @IsOptional() @IsString() @MaxLength(500) reviewNote?: string;
}

export class PaymentActivityQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsString() @MaxLength(100) action?: string;
}
