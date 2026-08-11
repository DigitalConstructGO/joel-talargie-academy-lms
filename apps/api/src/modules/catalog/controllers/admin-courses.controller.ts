import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { RequirePermissions } from '../../authorization/decorators/require-permissions.decorator';
import {
  CreateCourseDto,
  DuplicateCourseDto,
  ListCoursesDto,
  PricingDto,
  SettingsDto,
  StringItemsDto,
  UpdateCourseDto,
  VisibilityDto,
} from '../dto/catalog.dto';
import { CatalogService } from '../services/catalog.service';

@ApiTags('Administrator Courses')
@ApiBearerAuth()
@Controller('admin/courses')
export class AdminCoursesController {
  constructor(private readonly catalog: CatalogService) {}
  @Get() @RequirePermissions('courses.read') list(
    @Query() query: ListCoursesDto,
  ) {
    return this.catalog.adminCourses(query);
  }
  @Post() @RequirePermissions('courses.create') create(
    @CurrentUser() actor: AuthUser,
    @Body() dto: CreateCourseDto,
  ) {
    return this.catalog.createCourse(actor, dto);
  }
  @Get(':id') @RequirePermissions('courses.read') detail(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.adminCourse(id);
  }
  @Patch(':id') @RequirePermissions('courses.update') update(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.catalog.updateCourse(actor, id, dto);
  }
  @Put(':id/pricing') @RequirePermissions('courses.manage_pricing') pricing(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PricingDto,
  ) {
    return this.catalog.pricing(actor, id, dto);
  }
  @Put(':id/visibility')
  @RequirePermissions('courses.manage_visibility')
  visibility(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: VisibilityDto,
  ) {
    return this.catalog.visibility(actor, id, dto);
  }
  @Put(':id/settings')
  @RequirePermissions('courses.manage_certificate_settings')
  settings(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SettingsDto,
  ) {
    return this.catalog.settings(actor, id, dto);
  }
  @Put(':id/outcomes') @RequirePermissions('courses.update') outcomes(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: StringItemsDto,
  ) {
    return this.catalog.items(actor, id, 'outcomes', dto);
  }
  @Put(':id/requirements') @RequirePermissions('courses.update') requirements(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: StringItemsDto,
  ) {
    return this.catalog.items(actor, id, 'requirements', dto);
  }
  @Post(':id/publish') @RequirePermissions('courses.publish') publish(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.publish(actor, id);
  }
  @Post(':id/unpublish') @RequirePermissions('courses.unpublish') unpublish(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.unpublish(actor, id);
  }
  @Delete(':id') @RequirePermissions('courses.archive') archive(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.archiveCourse(actor, id);
  }
  @Post(':id/restore') @RequirePermissions('courses.restore') restore(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.restoreCourse(actor, id);
  }
  @Post(':id/duplicate') @RequirePermissions('courses.duplicate') duplicate(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DuplicateCourseDto,
  ) {
    return this.catalog.duplicateCourse(actor, id, dto);
  }
}
