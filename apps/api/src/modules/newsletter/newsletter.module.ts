import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { NewsletterController } from './controllers/newsletter.controller';
import { NewsletterService } from './services/newsletter.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
