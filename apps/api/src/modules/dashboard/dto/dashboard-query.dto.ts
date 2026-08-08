import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const DASHBOARD_RANGES = [
  'TODAY',
  'LAST_7_DAYS',
  'LAST_30_DAYS',
  'LAST_90_DAYS',
  'THIS_MONTH',
  'LAST_MONTH',
  'THIS_YEAR',
  'CUSTOM',
] as const;
export const DASHBOARD_GRANULARITIES = ['DAY', 'WEEK', 'MONTH'] as const;

export class DashboardQueryDto {
  @ApiPropertyOptional({ enum: DASHBOARD_RANGES, default: 'LAST_30_DAYS' })
  @IsOptional()
  @IsIn(DASHBOARD_RANGES)
  range: (typeof DASHBOARD_RANGES)[number] = 'LAST_30_DAYS';
  @ApiPropertyOptional() @IsOptional() @IsISO8601() from?: string;
  @ApiPropertyOptional() @IsOptional() @IsISO8601() to?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  comparison = true;
  @ApiPropertyOptional({ default: 5, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  previewLimit = 5;
}
export class DashboardTrendQueryDto extends DashboardQueryDto {
  @ApiPropertyOptional({ enum: DASHBOARD_GRANULARITIES, default: 'DAY' })
  @IsOptional()
  @IsIn(DASHBOARD_GRANULARITIES)
  granularity: (typeof DASHBOARD_GRANULARITIES)[number] = 'DAY';
}
export class DashboardLimitQueryDto {
  @ApiPropertyOptional({ default: 5, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit = 5;
}
export class CoursePerformanceQueryDto extends DashboardQueryDto {
  @ApiPropertyOptional({
    enum: [
      'ENROLLMENTS',
      'COMPLETIONS',
      'COMPLETION_RATE',
      'AVERAGE_PROGRESS',
      'REVENUE',
    ],
    default: 'ENROLLMENTS',
  })
  @IsOptional()
  @IsIn([
    'ENROLLMENTS',
    'COMPLETIONS',
    'COMPLETION_RATE',
    'AVERAGE_PROGRESS',
    'REVENUE',
  ])
  sort:
    | 'ENROLLMENTS'
    | 'COMPLETIONS'
    | 'COMPLETION_RATE'
    | 'AVERAGE_PROGRESS'
    | 'REVENUE' = 'ENROLLMENTS';
  @ApiPropertyOptional({ default: 10, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit = 10;
}
