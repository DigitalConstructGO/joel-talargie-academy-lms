import { Injectable } from '@nestjs/common';
import { getAuthorizationContext } from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
@Injectable()
export class AuthorizationContextService {
  constructor(private readonly database: DatabaseService) {}
  resolve(userId: string) {
    return getAuthorizationContext(this.database.client, userId);
  }
}
