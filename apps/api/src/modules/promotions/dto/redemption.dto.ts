import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  COUPON_CODE_MAX_LENGTH,
  PROMO_REDEMPTION_STATUSES,
  type PromoRedemptionStatus,
} from '../constants/promotion.constants';

export class ValidateCouponDto {
  @ApiProperty() @IsUUID() courseId!: string;
  @ApiPropertyOptional({
    description:
      'The promo code to check. Omitted when the checkout is code-free.',
  })
  @IsOptional()
  @IsString()
  @Length(1, COUPON_CODE_MAX_LENGTH)
  code?: string;
}

export class RedeemCouponDto extends ValidateCouponDto {}

export class ListRedemptionsDto extends PaginationDto {}

export class ListCodeRedemptionsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: PROMO_REDEMPTION_STATUSES })
  @IsOptional()
  @IsIn(PROMO_REDEMPTION_STATUSES)
  status?: PromoRedemptionStatus;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  courseId?: string;
  @ApiPropertyOptional({
    description: 'Matches student name/email, course title, or transaction id.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
  @ApiPropertyOptional({ description: 'ISO-8601 inclusive lower bound.' })
  @IsOptional()
  @IsISO8601()
  from?: string;
  @ApiPropertyOptional({ description: 'ISO-8601 inclusive upper bound.' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}
