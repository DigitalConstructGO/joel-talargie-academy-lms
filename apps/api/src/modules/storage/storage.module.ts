import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../common/database/database.module';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { PublicStorageFilesController } from './public-storage-files.controller';
import { StorageRepository } from './repositories/storage.repository';
import { StorageController } from './storage.controller';
import { STORAGE_SERVICE } from './storage.interface';
import { StorageService } from './storage.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PublicStorageFilesController, StorageController],
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    StorageRepository,
    StorageService,
    {
      provide: STORAGE_SERVICE,
      useFactory: (
        config: ConfigService,
        local: LocalStorageProvider,
        s3: S3StorageProvider,
      ) => (config.get<string>('STORAGE_DRIVER') === 's3' ? s3 : local),
      inject: [ConfigService, LocalStorageProvider, S3StorageProvider],
    },
  ],
  exports: [STORAGE_SERVICE, StorageService, LocalStorageProvider],
})
export class StorageModule {}
