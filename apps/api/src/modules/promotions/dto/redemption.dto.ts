import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { COUPON_CODE_MAX_LENGTH } from '../constants/promotion.constants';

export class ValidateCouponDto {
  @ApiProperty() @IsUUID() courseId!: string;
  @ApiPropertyOptional({
    description:
      'Omit to let the engine auto-discover an applicable automatic promotion.',
  })
  @IsOptional()
  @IsString()
  @Length(1, COUPON_CODE_MAX_LENGTH)
  code?: string;
  @ApiPropertyOptional({
    description: 'ISO 3166-1 alpha-2 country code, client-supplied.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  paymentMethod?: string;
}

export class RedeemCouponDto extends ValidateCouponDto {}

export class ListRedemptionsDto extends PaginationDto {}

export class RejectRedemptionDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}
