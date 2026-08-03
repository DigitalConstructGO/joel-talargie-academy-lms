import { Module } from '@nestjs/common';
import { resolve } from 'node:path';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnvironment } from './config/environment';
import { HealthModule } from './health/health.module';
import { SecurityModule } from './common/security/security.module';
import { MailModule } from './common/mail/mail.module';
import { DatabaseModule } from './common/database/database.module';
import { AuditModule } from './modules/audit/audit.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { StorageModule } from './modules/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AuthorizationModule } from './modules/authorization/authorization.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { LearningModule } from './modules/learning/learning.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      envFilePath: [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), '../../.env'),
      ],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    HealthModule,
    SecurityModule,
    MailModule,
    DatabaseModule,
    AuditModule,
    JobsModule,
    StorageModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuthorizationModule,
    CatalogModule,
    EnrollmentsModule,
    LearningModule,
    PaymentsModule,
    CertificatesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
