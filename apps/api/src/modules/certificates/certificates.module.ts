import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { StorageModule } from '../storage/storage.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  AdminCertificatesController,
  CertificateTemplatesController,
  PublicCertificatesController,
  StudentCertificatesController,
} from './controllers/certificates.controllers';
import { CertificatesRepository } from './repositories/certificates.repository';
import { CertificatesService } from './services/certificates.service';
import { CertificateWorkerService } from './workers/certificate-worker.service';

@Module({
  imports: [DatabaseModule, StorageModule, NotificationsModule],
  controllers: [
    StudentCertificatesController,
    PublicCertificatesController,
    AdminCertificatesController,
    CertificateTemplatesController,
  ],
  providers: [
    CertificatesRepository,
    CertificatesService,
    CertificateWorkerService,
  ],
  exports: [CertificateWorkerService],
})
export class CertificatesModule {}
