import { Injectable } from '@nestjs/common';
import {
  getSafeUser,
  getUserPreferences,
  getUserRecordSummary,
  listActiveSessions,
  listManagedUsers,
  listUserActivity,
  permanentlyDeleteUser,
  revokeOwnedSession,
  revokeSessionsExcept,
  transitionUserStatus,
  updateSafeProfile,
  updateUserPreferences,
} from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
@Injectable()
export class UsersRepository {
  constructor(private readonly database: DatabaseService) {}
  safe(id: string) {
    return getSafeUser(this.database.client, id);
  }
  preferences(id: string) {
    return getUserPreferences(this.database.client, id);
  }
  updatePreferences(
    id: string,
    values: Parameters<typeof updateUserPreferences>[2],
  ) {
    return updateUserPreferences(this.database.client, id, values);
  }
  profile(input: Parameters<typeof updateSafeProfile>[1]) {
    return updateSafeProfile(this.database.client, input);
  }
  sessions(id: string) {
    return listActiveSessions(this.database.client, id);
  }
  revoke(input: Parameters<typeof revokeOwnedSession>[1]) {
    return revokeOwnedSession(this.database.client, input);
  }
  revokeAll(input: Parameters<typeof revokeSessionsExcept>[1]) {
    return revokeSessionsExcept(this.database.client, input);
  }
  list(input: Parameters<typeof listManagedUsers>[1]) {
    return listManagedUsers(this.database.client, input);
  }
  summary(id: string) {
    return getUserRecordSummary(this.database.client, id);
  }
  transition(input: Parameters<typeof transitionUserStatus>[1]) {
    return transitionUserStatus(this.database.client, input);
  }
  permanentlyDelete(input: Parameters<typeof permanentlyDeleteUser>[1]) {
    return permanentlyDeleteUser(this.database.client, input);
  }
  activity(input: Parameters<typeof listUserActivity>[1]) {
    return listUserActivity(this.database.client, input);
  }
}
