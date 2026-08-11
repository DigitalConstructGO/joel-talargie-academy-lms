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
  CreateCategoryDto,
  ListCategoriesDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from '../dto/catalog.dto';
import { CatalogService } from '../services/catalog.service';

@ApiTags('Administrator Categories')
@ApiBearerAuth()
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly catalog: CatalogService) {}
  @Get() @RequirePermissions('categories.read') list(
    @Query() query: ListCategoriesDto,
  ) {
    return this.catalog.listCategories(query);
  }
  @Post() @RequirePermissions('categories.create') create(
    @CurrentUser() actor: AuthUser,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.catalog.createCategory(actor, dto);
  }
  @Put('reorder') @RequirePermissions('categories.reorder') reorder(
    @CurrentUser() actor: AuthUser,
    @Body() dto: ReorderCategoriesDto,
  ) {
    return this.catalog.reorderCategories(actor, dto);
  }
  @Get(':id') @RequirePermissions('categories.read') detail(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.category(id);
  }
  @Patch(':id') @RequirePermissions('categories.update') update(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.catalog.updateCategory(actor, id, dto);
  }
  @Delete(':id') @RequirePermissions('categories.archive') archive(
    @CurrentUser() actor: AuthUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.catalog.archiveCategory(actor, id);
  }
}
