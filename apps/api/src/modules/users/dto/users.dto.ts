import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
export class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() emailLearning?: boolean;
  @IsOptional() @IsBoolean() emailPayments?: boolean;
  @IsOptional() @IsBoolean() emailCertificates?: boolean;
  @IsOptional() @IsBoolean() inAppLearning?: boolean;
  @IsOptional() @IsBoolean() inAppPayments?: boolean;
  @IsOptional() @IsBoolean() inAppCertificates?: boolean;
}
export class RevokeSessionsDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  includeCurrentSession = false;
}
export class ReasonDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}
export enum UserStatusFilter {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
}
export class ListUsersQueryDto {
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsEnum(UserStatusFilter) status?: UserStatusFilter;
  @IsOptional() @IsString() @MaxLength(64) role?: string;
  @IsOptional() @IsIn(['LOCAL', 'GOOGLE']) provider?: 'LOCAL' | 'GOOGLE';
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  emailVerified?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeArchived = false;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
export class ActivityQueryDto {
  @IsOptional() @IsString() @MaxLength(100) action?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
