import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../common/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AdminUserSessionsController } from './controllers/admin-user-sessions.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { MeController } from './controllers/me.controller';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    MeController,
    AdminUsersController,
    AdminUserSessionsController,
  ],
  providers: [UsersRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
