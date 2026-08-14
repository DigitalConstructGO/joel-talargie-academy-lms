import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export enum CourseAccessType {
  FREE = 'FREE',
  PAID = 'PAID',
}
export enum CourseVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  UNLISTED = 'UNLISTED',
}
export enum CourseDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ALL_LEVELS = 'ALL_LEVELS',
}
export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}
export enum LessonType {
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
  DOCUMENT = 'DOCUMENT',
  DOWNLOAD = 'DOWNLOAD',
  EXTERNAL_LINK = 'EXTERNAL_LINK',
}
export enum ResourceVisibility {
  PUBLIC = 'PUBLIC',
  ENROLLED_STUDENTS = 'ENROLLED_STUDENTS',
  ADMIN_ONLY = 'ADMIN_ONLY',
}

export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}
export class CreateCategoryDto {
  @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @Matches(slugPattern) @MaxLength(140) slug?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsUUID() parentId?: string;
  @IsOptional() @IsString() @MaxLength(500) imageKey?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
export class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsUUID() parentId?: string | null;
  @IsOptional() @IsString() @MaxLength(500) imageKey?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class CategoryOrderItemDto {
  @IsUUID() categoryId!: string;
  @IsOptional() @IsUUID() parentId?: string | null;
  @IsInt() @Min(0) sortOrder!: number;
}
export class ReorderCategoriesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderItemDto)
  items!: CategoryOrderItemDto[];
}
export class ListCategoriesDto extends PaginationDto {
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeArchived = false;
  @IsOptional() @IsUUID() parentId?: string;
  @IsOptional() @IsIn(['flat', 'tree']) mode: 'flat' | 'tree' = 'flat';
}
export class StringItemsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  items!: string[];
}
export class CreateCourseDto {
  @IsUUID() categoryId!: string;
  @IsString() @MinLength(3) @MaxLength(180) title!: string;
  @IsOptional() @Matches(slugPattern) @MaxLength(200) slug?: string;
  @IsString() @MinLength(10) @MaxLength(500) shortDescription!: string;
  @IsString() @MinLength(10) @MaxLength(100000) description!: string;
  @IsEnum(CourseAccessType) accessType!: CourseAccessType;
  @IsEnum(CourseDifficulty) difficulty!: CourseDifficulty;
  @IsOptional() @IsString() @MaxLength(500) thumbnailKey?: string;
  @IsOptional() @IsString() @MaxLength(180) presenterName?: string;
  @IsOptional() @IsNumberString() price?: string;
  @IsOptional() @IsNumberString() discountPrice?: string;
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/)
  currency?: string;
  @IsOptional() @IsInt() @Min(0) estimatedDurationMinutes?: number;
  @IsOptional() @IsEnum(CourseVisibility) visibility?: CourseVisibility;
  @IsOptional() @IsBoolean() certificateEnabled?: boolean;
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsDateString() enrollmentOpenAt?: string;
  @IsOptional() @IsDateString() enrollmentCloseAt?: string;
  @IsOptional() @IsInt() @Min(1) capacity?: number;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  outcomes?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  requirements?: string[];
}
export class UpdateCourseDto {
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(180) title?: string;
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  shortDescription?: string;
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(100000)
  description?: string;
  @IsOptional() @IsString() @MaxLength(500) thumbnailKey?: string | null;
  @IsOptional() @IsString() @MaxLength(180) presenterName?: string;
  @IsOptional() @IsEnum(CourseDifficulty) difficulty?: CourseDifficulty;
  @IsOptional() @IsInt() @Min(0) estimatedDurationMinutes?: number | null;
}
export class PricingDto {
  @IsEnum(CourseAccessType) accessType!: CourseAccessType;
  @IsNumberString() price!: string;
  @IsOptional() @IsNumberString() discountPrice?: string | null;
  @IsString() @Length(3, 3) @Matches(/^[A-Z]{3}$/) currency!: string;
}
export class VisibilityDto {
  @IsEnum(CourseVisibility) visibility!: CourseVisibility;
  @IsOptional() @IsBoolean() featured?: boolean;
}
export class SettingsDto {
  @IsOptional() @IsBoolean() certificateEnabled?: boolean;
  @IsOptional() @IsDateString() enrollmentOpenAt?: string | null;
  @IsOptional() @IsDateString() enrollmentCloseAt?: string | null;
  @IsOptional() @IsInt() @Min(1) capacity?: number | null;
}
export class DuplicateCourseDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(180) title?: string;
  @IsOptional() @Matches(slugPattern) @MaxLength(200) slug?: string;
}
export class ListCoursesDto extends PaginationDto {
  @IsOptional() @IsString() @MaxLength(100) search?: string;
  @IsOptional() @IsEnum(CourseStatus) status?: CourseStatus;
  @IsOptional() @IsEnum(CourseAccessType) accessType?: CourseAccessType;
  @IsOptional() @IsEnum(CourseVisibility) visibility?: CourseVisibility;
  @IsOptional() @IsEnum(CourseDifficulty) difficulty?: CourseDifficulty;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  featured?: boolean;
  @IsOptional() @IsUUID() createdBy?: string;
  @IsOptional()
  @IsIn([
    'newest',
    'oldest',
    'title_asc',
    'title_desc',
    'price_asc',
    'price_desc',
    'featured',
  ])
  sort = 'newest';
}
export class CreateSectionDto {
  @IsString() @MinLength(2) @MaxLength(180) title!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
export class UpdateSectionDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) title?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string | null;
}
export class OrderItemDto {
  @IsUUID() id!: string;
  @IsInt() @Min(0) sortOrder!: number;
}
export class ReorderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
export class CreateLessonDto {
  @IsString() @MinLength(2) @MaxLength(180) title!: string;
  @IsOptional() @Matches(slugPattern) @MaxLength(200) slug?: string;
  @IsEnum(LessonType) lessonType!: LessonType;
  @IsOptional() @IsString() @MaxLength(100000) content?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  videoUrl?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  externalUrl?: string;
  @IsOptional() @IsInt() @Min(0) durationSeconds?: number;
  @IsOptional() @IsBoolean() isMandatory?: boolean;
  @IsOptional() @IsBoolean() isPreview?: boolean;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
export class UpdateLessonDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(180) title?: string;
  @IsOptional() @IsEnum(LessonType) lessonType?: LessonType;
  @IsOptional() @IsString() @MaxLength(100000) content?: string | null;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  videoUrl?: string | null;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  externalUrl?: string | null;
  @IsOptional() @IsInt() @Min(0) durationSeconds?: number | null;
  @IsOptional() @IsBoolean() isMandatory?: boolean;
}
export class MoveLessonDto {
  @IsUUID() sectionId!: string;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
export class PreviewDto {
  @IsBoolean() isPreview!: boolean;
}
export class CreateResourceDto {
  @IsString() @MinLength(1) @MaxLength(180) title!: string;
  @IsOptional() @IsString() @MaxLength(500) storageKey?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  externalUrl?: string;
  @IsOptional() @IsString() @MaxLength(255) originalFileName?: string;
  @IsOptional() @IsString() @MaxLength(120) mimeType?: string;
  @IsOptional() @IsInt() @Min(0) @Max(524288000) fileSize?: number;
  @IsEnum(ResourceVisibility) visibility!: ResourceVisibility;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
export class UpdateResourceDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(180) title?: string;
  @IsOptional() @IsString() @MaxLength(500) storageKey?: string | null;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  externalUrl?: string | null;
  @IsOptional() @IsString() @MaxLength(255) originalFileName?: string | null;
  @IsOptional() @IsString() @MaxLength(120) mimeType?: string | null;
  @IsOptional() @IsInt() @Min(0) @Max(524288000) fileSize?: number | null;
  @IsOptional() @IsEnum(ResourceVisibility) visibility?: ResourceVisibility;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
