import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;
}

export class SubscribeNewsletterDto {
  @IsString()
  @MaxLength(255)
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;
}

export class ListSubscribersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'UNSUBSCRIBED'])
  status?: 'ACTIVE' | 'UNSUBSCRIBED';
}

export class UpdateSubscriberStatusDto {
  @IsIn(['ACTIVE', 'UNSUBSCRIBED'])
  status!: 'ACTIVE' | 'UNSUBSCRIBED';
}
