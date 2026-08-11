import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  CreateLessonDto,
  CreateResourceDto,
  CreateSectionDto,
  MoveLessonDto,
  PreviewDto,
  ReorderDto,
  UpdateLessonDto,
  UpdateResourceDto,
  UpdateSectionDto,
} from '../dto/catalog.dto';
import { CatalogService } from '../services/catalog.service';

@ApiBearerAuth()
@Controller('admin')
export class AdminCurriculumController {
  constructor(private readonly catalog: CatalogService) {}
  @ApiTags('Curriculum Sections')
  @Post('courses/:courseId/sections')
  @RequirePermissions('sections.create')
  createSection(
    @CurrentUser() a: AuthUser,
    @Param('courseId', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.catalog.createSection(a, id, dto);
  }
  @ApiTags('Curriculum Sections')
  @Put('courses/:courseId/sections/reorder')
  @RequirePermissions('sections.reorder')
  reorderSections(
    @CurrentUser() a: AuthUser,
    @Param('courseId', new ParseUUIDPipe()) id: string,
    @Body() dto: ReorderDto,
  ) {
    return this.catalog.reorderSections(a, id, dto);
  }
  @ApiTags('Curriculum Sections')
  @Patch('sections/:id')
  @RequirePermissions('sections.update')
  updateSection(
    @CurrentUser() a: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.catalog.updateSection(a, id, dto);
  }
  @ApiTags('Curriculum Sections')
  @Delete('sections/:id')
  @RequirePermissions('sections.archive')
  archiveSection(
    @CurrentUser() a: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.archiveSection(a, id);
  }
  @ApiTags('Lessons')
  @Post('sections/:sectionId/lessons')
  @RequirePermissions('lessons.create')
  createLesson(
    @CurrentUser() a: AuthUser,
    @Param('sectionId', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateLessonDto,
  ) {
    return this.catalog.createLesson(a, id, dto);
  }
  @ApiTags('Lessons')
  @Put('sections/:sectionId/lessons/reorder')
  @RequirePermissions('lessons.reorder')
  reorderLessons(
    @CurrentUser() a: AuthUser,
    @Param('sectionId', new ParseUUIDPipe()) id: string,
    @Body() dto: ReorderDto,
  ) {
    return this.catalog.reorderLessons(a, id, dto);
  }
  @ApiTags('Lessons')
  @Patch('lessons/:id')
  @RequirePermissions('lessons.update')
  updateLesson(
    @CurrentUser() a: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.catalog.updateLesson(a, id, dto);
  }
  @ApiTags('Lessons')
  @Post('lessons/:id/move')
  @RequirePermissions('lessons.update')
  moveLesson(
    @CurrentUser() a: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: MoveLessonDto,
  ) {
    return this.catalog.moveLesson(a, id, dto);
  }
  @ApiTags('Lessons')
  @Post('lessons/:id/publish')
  @RequirePermissions('lessons.publish')
  publishLesson(
    @CurrentUser() a: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.publishLesson(a, id);
  }
  @ApiTags('Lessons')
  @Post('lessons/:id/unpublish')
  @RequirePermissions('lessons.unpublish')
  unpublishLesson(
    @CurrentUser() a: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.unpublishLesson(a, id);
  }
  @ApiTags('Lessons')
  @Put('lessons/:id/preview')
  @RequirePermissions('lessons.manage_preview')
  previewLesson(
    @CurrentUser() a: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PreviewDto,
  ) {
    return this.catalog.previewLesson(a, id, dto.isPreview);
  }
  @ApiTags('Lessons')
  @Delete('lessons/:id')
  @RequirePermissions('lessons.archive')
  archiveLesson(
    @CurrentUser() a: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.archiveLesson(a, id);
  }
  @ApiTags('Lesson Resources')
  @Post('lessons/:lessonId/resources')
  @RequirePermissions('lessons.manage_resources')
  createResource(
    @CurrentUser() a: AuthUser,
    @Param('lessonId', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateResourceDto,
  ) {
    return this.catalog.createResource(a, id, dto);
  }
  @ApiTags('Lesson Resources')
  @Patch('lesson-resources/:id')
  @RequirePermissions('lessons.manage_resources')
  updateResource(
    @CurrentUser() a: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.catalog.updateResource(a, id, dto);
  }
  @ApiTags('Lesson Resources')
  @Delete('lesson-resources/:id')
  @RequirePermissions('lessons.manage_resources')
  deleteResource(
    @CurrentUser() a: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.deleteResource(a, id);
  }
}
