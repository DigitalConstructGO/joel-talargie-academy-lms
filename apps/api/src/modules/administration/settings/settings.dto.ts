import {
  IsArray,
  IsDefined,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class UpdateSettingDto {
  @ApiProperty() @IsDefined() value!: unknown;
  @ApiProperty() @IsString() @Length(5, 500) reason!: string;
}
export class SettingItemDto {
  @ApiProperty() @IsString() key!: string;
  @ApiProperty() @IsDefined() value!: unknown;
}
export class UpdateSettingsBatchDto {
  @ApiProperty() @IsString() @Length(5, 500) reason!: string;
  @ApiProperty({ type: [SettingItemDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  items!: SettingItemDto[];
}
export class SettingsQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
}
