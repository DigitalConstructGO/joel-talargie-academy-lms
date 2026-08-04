import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNumber,
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
  PROMO_AFFILIATE_STATUSES,
  PROMO_DISCOUNT_TYPES,
  type PromoAffiliateStatus,
  type PromoDiscountType,
} from '../constants/promotion.constants';

export class CreateAffiliateDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() userId?: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(200) name!: string;
  @ApiProperty() @IsEmail() email!: string;
  @ApiPropertyOptional({ enum: PROMO_DISCOUNT_TYPES })
  @IsOptional()
  @IsIn(PROMO_DISCOUNT_TYPES)
  commissionType?: PromoDiscountType;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionFixedAmount?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateAffiliateDto {
  @ApiPropertyOptional({ enum: PROMO_AFFILIATE_STATUSES })
  @IsOptional()
  @IsIn(PROMO_AFFILIATE_STATUSES)
  status?: PromoAffiliateStatus;
  @ApiPropertyOptional({ enum: PROMO_DISCOUNT_TYPES })
  @IsOptional()
  @IsIn(PROMO_DISCOUNT_TYPES)
  commissionType?: PromoDiscountType;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionFixedAmount?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ListAffiliatesDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
  @ApiPropertyOptional({ enum: PROMO_AFFILIATE_STATUSES })
  @IsOptional()
  @IsIn(PROMO_AFFILIATE_STATUSES)
  status?: PromoAffiliateStatus;
}
