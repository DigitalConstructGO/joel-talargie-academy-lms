import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  Matches,
} from 'class-validator';

export enum PaymentMethodType {
  MOBILE_MONEY = 'MOBILE_MONEY',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  OTHER = 'OTHER',
}

export class CreatePaymentMethodDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toUpperCase().replace(/\s+/g, '_')
      : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  code!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional() @IsEnum(PaymentMethodType) type: PaymentMethodType =
    PaymentMethodType.OTHER;

  @IsOptional() @IsObject() instructions?: Record<string, unknown>;

  @IsOptional() @IsObject() config?: Record<string, unknown>;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive = true;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10000) sortOrder = 0;
}

export class UpdatePaymentMethodDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional() @IsEnum(PaymentMethodType) type?: PaymentMethodType;

  @IsOptional() @IsObject() instructions?: Record<string, unknown>;

  @IsOptional() @IsObject() config?: Record<string, unknown>;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  sortOrder?: number;
}

export class SetPaymentMethodStatusDto {
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive!: boolean;
}

export class ListPaymentMethodsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsEnum(PaymentMethodType) type?: PaymentMethodType;
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
  @IsOptional()
  @IsString()
  @Matches(/^(name|sortOrder|createdAt):(asc|desc)$/)
  sort?: string;
}
