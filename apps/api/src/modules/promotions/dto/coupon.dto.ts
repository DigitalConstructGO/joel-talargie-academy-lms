import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  COUPON_BULK_GENERATE_MAX,
  COUPON_CODE_MAX_LENGTH,
  COUPON_CODE_MIN_LENGTH,
  PROMO_CODE_STATUSES,
  PROMO_CODE_TYPES,
  type PromoCodeStatus,
  type PromoCodeType,
} from '../constants/promotion.constants';

const CODE_PATTERN = /^[A-Za-z0-9-]+$/;

export class CreateCouponDto {
  @ApiProperty() @IsUUID() campaignId!: string;
  @ApiPropertyOptional({
    description: 'Manual code. Omit to auto-generate a secure random code.',
  })
  @IsOptional()
  @IsString()
  @MinLength(COUPON_CODE_MIN_LENGTH)
  @MaxLength(COUPON_CODE_MAX_LENGTH)
  @Matches(CODE_PATTERN, {
    message: 'code may only contain letters, digits, and hyphens',
  })
  code?: string;
  @ApiPropertyOptional({ enum: PROMO_CODE_TYPES })
  @IsOptional()
  @IsIn(PROMO_CODE_TYPES)
  codeType?: PromoCodeType;
  @ApiPropertyOptional() @IsOptional() @IsUUID() ownerUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() affiliateId?: string;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSingleUse?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxRedemptions?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptionsPerUser?: number;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() validFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() validUntil?: string;
}

export class GenerateCouponsDto {
  @ApiProperty() @IsUUID() campaignId!: string;
  @ApiProperty({ default: 10, maximum: COUPON_BULK_GENERATE_MAX })
  @IsInt()
  @Min(1)
  @Max(COUPON_BULK_GENERATE_MAX)
  count!: number;
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(COUPON_CODE_MIN_LENGTH)
  @Max(COUPON_CODE_MAX_LENGTH)
  length?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(CODE_PATTERN)
  prefix?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(CODE_PATTERN)
  suffix?: string;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  excludeAmbiguousCharacters?: boolean;
  @ApiPropertyOptional({ enum: PROMO_CODE_TYPES })
  @IsOptional()
  @IsIn(PROMO_CODE_TYPES)
  codeType?: PromoCodeType;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSingleUse?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxRedemptions?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptionsPerUser?: number;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() validFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() validUntil?: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ enum: PROMO_CODE_STATUSES })
  @IsOptional()
  @IsIn(PROMO_CODE_STATUSES)
  status?: PromoCodeStatus;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxRedemptions?:
    number | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxRedemptionsPerUser?:
    number | null;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() validFrom?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() validUntil?: string | null;
}

export class ListCouponsDto extends PaginationDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() campaignId?: string;
  @ApiPropertyOptional({ enum: PROMO_CODE_STATUSES })
  @IsOptional()
  @IsIn(PROMO_CODE_STATUSES)
  status?: PromoCodeStatus;
  @ApiPropertyOptional({ enum: PROMO_CODE_TYPES })
  @IsOptional()
  @IsIn(PROMO_CODE_TYPES)
  codeType?: PromoCodeType;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(COUPON_CODE_MAX_LENGTH)
  search?: string;
}
