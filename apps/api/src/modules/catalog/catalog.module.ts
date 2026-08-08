import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AdminCategoriesController } from './controllers/admin-categories.controller';
import { AdminCoursesController } from './controllers/admin-courses.controller';
import { AdminCurriculumController } from './controllers/admin-curriculum.controller';
import { PublicCatalogController } from './controllers/public-catalog.controller';
import { CatalogRepository } from './repositories/catalog.repository';
import { CatalogService } from './services/catalog.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    PublicCatalogController,
    AdminCategoriesController,
    AdminCoursesController,
    AdminCurriculumController,
  ],
  providers: [CatalogRepository, CatalogService],
})
export class CatalogModule {}
