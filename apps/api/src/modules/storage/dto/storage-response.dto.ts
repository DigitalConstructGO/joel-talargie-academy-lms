import { ApiProperty } from '@nestjs/swagger';

export class AvatarUploadResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() originalFileName!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() fileSize!: number;
  @ApiProperty() checksum!: string;
  @ApiProperty() width!: number;
  @ApiProperty() height!: number;
  @ApiProperty({
    description: 'JWT-protected streaming endpoint for this avatar',
  })
  downloadUrl!: string;
}

export class CourseThumbnailUploadResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({
    description: 'Paste into CreateCourseDto/UpdateCourseDto.thumbnailKey',
  })
  thumbnailKey!: string;
  @ApiProperty({ description: 'Optimized WebP variant of the same image' })
  variantKey!: string;
  @ApiProperty() originalFileName!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() fileSize!: number;
  @ApiProperty() checksum!: string;
  @ApiProperty() width!: number;
  @ApiProperty() height!: number;
}

export class LessonResourceUploadResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({
    description: 'Paste into CreateResourceDto/UpdateResourceDto.storageKey',
  })
  storageKey!: string;
  @ApiProperty() originalFileName!: string;
  @ApiProperty() mimeType!: string;
  @ApiProperty() fileSize!: number;
  @ApiProperty() checksum!: string;
}
