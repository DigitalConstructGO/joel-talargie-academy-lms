import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  COUPON_CODE_MAX_LENGTH,
  COUPON_CODE_MIN_LENGTH,
  PROMO_CODE_STATUSES,
  PROMO_CODE_TYPES,
  PROMO_DISCOUNT_TYPES,
  type PromoCodeStatus,
  type PromoCodeType,
  type PromoDiscountType,
} from '../constants/promotion.constants';

const CODE_PATTERN = /^[A-Za-z0-9-]+$/;

export class CreateCouponDto {
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
  @ApiPropertyOptional({ enum: PROMO_CODE_STATUSES })
  @IsOptional()
  @IsIn(PROMO_CODE_STATUSES)
  status?: PromoCodeStatus;
  @ApiPropertyOptional({ enum: PROMO_DISCOUNT_TYPES, default: 'PERCENTAGE' })
  @IsOptional()
  @IsIn(PROMO_DISCOUNT_TYPES)
  discountType?: PromoDiscountType;
  @ApiPropertyOptional({
    description:
      'Discount value (percentage points for PERCENTAGE, amount for FIXED).',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() ownerUserId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() affiliateId?: string;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSingleUse?: boolean;
  @ApiPropertyOptional({
    description:
      'Cap on the number of distinct students who can redeem this code.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() validFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() validUntil?: string;
  @ApiPropertyOptional({
    type: [String],
    description: 'Course IDs this code applies to.',
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  courseIds?: string[];
  @ApiPropertyOptional({
    type: [String],
    description: 'Category IDs whose courses this code applies to.',
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
  @ApiPropertyOptional({
    type: [String],
    description: 'Student user IDs this code applies to.',
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  userIds?: string[];
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ enum: PROMO_CODE_STATUSES })
  @IsOptional()
  @IsIn(PROMO_CODE_STATUSES)
  status?: PromoCodeStatus;
  @ApiPropertyOptional({ enum: PROMO_DISCOUNT_TYPES })
  @IsOptional()
  @IsIn(PROMO_DISCOUNT_TYPES)
  discountType?: PromoDiscountType;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountValue?: number;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSingleUse?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxUsers?:
    number | null;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() validFrom?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() validUntil?: string | null;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  courseIds?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  userIds?: string[];
}

export class ListCouponsDto extends PaginationDto {
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
