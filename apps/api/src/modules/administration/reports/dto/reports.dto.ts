import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsISO8601,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { REPORT_TYPES } from '../report.types';

export class ReportQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsISO8601() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() to?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() courseId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() studentId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() actorId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: ['day', 'week', 'month'] })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  groupBy?: string;
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;
  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;
  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'desc';
}

export class CreateReportExportDto {
  @ApiProperty({ enum: REPORT_TYPES })
  @IsIn(REPORT_TYPES)
  reportType!: (typeof REPORT_TYPES)[number];
  @ApiProperty({ enum: ['CSV', 'PDF'] })
  @IsIn(['CSV', 'PDF'])
  format!: 'CSV' | 'PDF';
  @ApiPropertyOptional() @IsOptional() @IsObject() filters: Record<
    string,
    unknown
  > = {};
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedColumns?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() locale = 'en';
  @ApiPropertyOptional() @IsOptional() @IsString() timezone = 'UTC';
}
export class ExportListQueryDto extends ReportQueryDto {
  @ApiPropertyOptional({ enum: REPORT_TYPES })
  @IsOptional()
  @IsIn(REPORT_TYPES)
  reportType?: string;
  @ApiPropertyOptional({ enum: ['CSV', 'PDF'] })
  @IsOptional()
  @IsIn(['CSV', 'PDF'])
  format?: string;
}
export class ReportExportReasonDto {
  @ApiProperty() @IsString() @Length(5, 500) reason!: string;
}
