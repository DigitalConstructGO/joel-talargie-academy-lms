import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { ListCategoriesDto, ListCoursesDto } from '../dto/catalog.dto';
import { CatalogService } from '../services/catalog.service';

@Public()
@ApiTags('Public Catalog')
@Controller('catalog')
export class PublicCatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get('categories')
  @ApiOperation({ summary: 'List active public categories' })
  categories(@Query() query: ListCategoriesDto) {
    return this.catalog.listCategories(query, true);
  }
  @Get('categories/:slug')
  @ApiOperation({ summary: 'Get a public category and its published courses' })
  category(@Param('slug') slug: string, @Query() query: ListCoursesDto) {
    return this.catalog.publicCategory(slug, query);
  }
  @Get('courses')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Search and list published public courses' })
  courses(@Query() query: ListCoursesDto) {
    return this.catalog.publicCourses(query);
  }
  @Get('courses/featured')
  @ApiOperation({ summary: 'List featured published courses' })
  featured(@Query() query: ListCoursesDto) {
    query.featured = true;
    query.pageSize = Math.min(query.pageSize, 20);
    return this.catalog.publicCourses(query);
  }
  @Get('courses/:slug')
  @ApiOperation({ summary: 'Get published course details with safe previews' })
  course(@Param('slug') slug: string) {
    return this.catalog.publicCourse(slug);
  }
}
