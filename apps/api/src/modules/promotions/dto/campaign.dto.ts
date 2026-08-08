import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  PROMO_CAMPAIGN_STATUSES,
  PROMO_CAMPAIGN_TYPES,
  PROMO_DISCOUNT_TYPES,
  type PromoCampaignStatus,
  type PromoCampaignType,
  type PromoDiscountType,
} from '../constants/promotion.constants';

export class CreateCampaignDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(150) name!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
  @ApiProperty({ enum: PROMO_CAMPAIGN_TYPES })
  @IsIn(PROMO_CAMPAIGN_TYPES)
  type!: PromoCampaignType;
  @ApiPropertyOptional({ enum: PROMO_CAMPAIGN_STATUSES })
  @IsOptional()
  @IsIn(PROMO_CAMPAIGN_STATUSES)
  status?: PromoCampaignStatus;
  @ApiProperty({ enum: PROMO_DISCOUNT_TYPES })
  @IsIn(PROMO_DISCOUNT_TYPES)
  discountType!: PromoDiscountType;
  @ApiProperty() @IsNumber() @Min(0) @Max(1_000_000) discountValue!: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumPurchaseAmount?: number;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAutomatic?: boolean;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  priority?: number;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() startsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() endsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxRedemptions?: number;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptionsPerUser?: number;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsIn(['STUDENT', 'ADMINISTRATOR'], { each: true })
  allowedRoles?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  allowedCountries?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  allowedEmailDomains?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  allowedPaymentMethods?: string[];
  @ApiPropertyOptional({
    type: [Number],
    description: '0=Sunday..6=Saturday (UTC)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  allowedDaysOfWeek?: number[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  allowedHourStart?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  allowedHourEnd?: number;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  newStudentsOnly?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  restrictToInstructorId?: string;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) totalSeats?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sponsorName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sponsorNotes?: string;
  @ApiPropertyOptional({ enum: PROMO_DISCOUNT_TYPES })
  @IsOptional()
  @IsIn(PROMO_DISCOUNT_TYPES)
  referrerRewardType?: PromoDiscountType;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  referrerRewardValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() affiliateId?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: Record<
    string,
    unknown
  >;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  courseIds?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  categoryIds?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  userIds?: string[];
}

export class UpdateCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  name?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
  @ApiPropertyOptional({ enum: PROMO_CAMPAIGN_STATUSES })
  @IsOptional()
  @IsIn(PROMO_CAMPAIGN_STATUSES)
  status?: PromoCampaignStatus;
  @ApiPropertyOptional({ enum: PROMO_DISCOUNT_TYPES })
  @IsOptional()
  @IsIn(PROMO_DISCOUNT_TYPES)
  discountType?: PromoDiscountType;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  discountValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) maxDiscountAmount?:
    number | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumPurchaseAmount?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAutomatic?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  priority?: number;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() startsAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() endsAt?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) maxRedemptions?:
    number | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptionsPerUser?: number;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsIn(['STUDENT', 'ADMINISTRATOR'], { each: true })
  allowedRoles?: string[] | null;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  allowedCountries?: string[] | null;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  allowedEmailDomains?: string[] | null;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  allowedPaymentMethods?: string[] | null;
  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  allowedDaysOfWeek?: number[] | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  allowedHourStart?: number | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  allowedHourEnd?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() newStudentsOnly?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsUUID() restrictToInstructorId?:
    string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requiresApproval?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) totalSeats?:
    number | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sponsorName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sponsorNotes?: string;
  @ApiPropertyOptional({ enum: PROMO_DISCOUNT_TYPES })
  @IsOptional()
  @IsIn(PROMO_DISCOUNT_TYPES)
  referrerRewardType?: PromoDiscountType | null;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  referrerRewardValue?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsUUID() affiliateId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: Record<
    string,
    unknown
  >;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true })
  courseIds?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  categoryIds?: string[];
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  userIds?: string[];
}

export class ListCampaignsDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
  @ApiPropertyOptional({ enum: PROMO_CAMPAIGN_STATUSES })
  @IsOptional()
  @IsIn(PROMO_CAMPAIGN_STATUSES)
  status?: PromoCampaignStatus;
  @ApiPropertyOptional({ enum: PROMO_CAMPAIGN_TYPES })
  @IsOptional()
  @IsIn(PROMO_CAMPAIGN_TYPES)
  type?: PromoCampaignType;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAutomatic?: boolean;
}
