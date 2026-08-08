import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class SortingDto {
  @IsOptional() @IsString() @MaxLength(64) sortBy?: string;
  @IsOptional() @IsIn(['asc', 'desc']) sortOrder: 'asc' | 'desc' = 'asc';
}
