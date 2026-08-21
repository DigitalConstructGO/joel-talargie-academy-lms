import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../authorization/decorators/require-permissions.decorator';
import { MAX_UPLOAD_BYTES } from './constants/storage.constants';
import {
  AvatarUploadResponseDto,
  CourseThumbnailUploadResponseDto,
  LessonResourceUploadResponseDto,
} from './dto/storage-response.dto';
import { StorageService } from './storage.service';
import { lessonResourceDiskStorage } from './utils/temp-storage.multer';
import { writeFileResponse } from './utils/http-file-response.util';

const FILE_UPLOAD_BODY = {
  schema: {
    type: 'object' as const,
    required: ['file'],
    properties: { file: { type: 'string' as const, format: 'binary' } },
  },
};

@Controller('storage')
@ApiBearerAuth()
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Post('avatar')
  @ApiTags('My Avatar')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES.AVATAR, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_BODY)
  @ApiOperation({ summary: 'Upload or replace the authenticated user avatar' })
  @ApiResponse({ status: 201, type: AvatarUploadResponseDto })
  uploadAvatar(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.storage.uploadAvatar(user, file);
  }

  @Delete('avatar')
  @ApiTags('My Avatar')
  @ApiOperation({ summary: 'Delete the authenticated user avatar' })
  deleteAvatar(@CurrentUser() user: AuthUser) {
    return this.storage.deleteAvatar(user);
  }

  @Public()
  @Get('avatar/:userId')
  @ApiTags('My Avatar')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Stream a public user avatar image',
  })
  async streamAvatar(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Res() response: Response,
    @CurrentUser() user?: AuthUser,
  ) {
    const descriptor = await this.storage.streamAvatar(userId, user);
    writeFileResponse(response, descriptor, 'inline');
  }

  @Post('course-thumbnails')
  @ApiTags('Administrator Storage')
  @RequirePermissions('courses.update')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_BYTES.COURSE_THUMBNAIL, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_BODY)
  @ApiOperation({
    summary:
      'Upload a course thumbnail image and receive a storage key to attach to a course',
  })
  @ApiResponse({ status: 201, type: CourseThumbnailUploadResponseDto })
  uploadCourseThumbnail(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.storage.registerCourseThumbnail(user, file);
  }

  @Post('lesson-resources')
  @ApiTags('Administrator Storage')
  @RequirePermissions('lessons.manage_resources')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: lessonResourceDiskStorage,
      limits: { fileSize: MAX_UPLOAD_BYTES.LESSON_RESOURCE, files: 1 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_UPLOAD_BODY)
  @ApiOperation({
    summary:
      'Upload a lesson resource file (PDF/Word/Excel/PowerPoint/ZIP/MP4/MP3) and receive a storage key to attach to a lesson',
  })
  @ApiResponse({ status: 201, type: LessonResourceUploadResponseDto })
  uploadLessonResource(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.storage.registerLessonResource(user, file);
  }
}
