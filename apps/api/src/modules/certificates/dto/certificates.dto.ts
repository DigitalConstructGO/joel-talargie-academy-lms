import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export enum CertificateStatus {
  PENDING = 'PENDING',
  GENERATED = 'GENERATED',
  FAILED = 'FAILED',
  REVOKED = 'REVOKED',
}

export class CertificateListDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsEnum(CertificateStatus) status?: CertificateStatus;
  @IsOptional() @IsUUID() courseId?: string;
  @IsOptional() @IsString() @MaxLength(100) search?: string;
}

export class GenerateCertificateDto {
  @IsOptional() @IsUUID() templateId?: string;
}

export class ReasonDto {
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class RegenerateCertificateDto extends ReasonDto {
  @IsOptional() @IsUUID() templateId?: string;
}

export class CreateCertificateTemplateDto {
  @IsString() @MinLength(3) @MaxLength(120) name!: string;
  @Type(() => Number) @IsInt() @Min(1) version!: number;
  @IsObject() configuration!: Record<string, unknown>;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateCertificateTemplateDto {
  @IsOptional() @IsObject() configuration?: Record<string, unknown>;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class VerificationTokenDto {
  @Matches(/^[A-Za-z0-9_-]{43,128}$/) token!: string;
}
