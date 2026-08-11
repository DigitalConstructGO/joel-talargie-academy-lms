import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ActivityQueryDto,
  ListUsersQueryDto,
  RevokeSessionsDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
  UserActionReasonDto,
  UserStatusFilter,
} from '../users.dto';

describe('users DTOs', () => {
  describe('UpdateProfileDto', () => {
    it('accepts an empty payload', async () => {
      expect(
        await validate(plainToInstance(UpdateProfileDto, {})),
      ).toHaveLength(0);
    });

    it('rejects a fullName shorter than the minimum length', async () => {
      const errors = await validate(
        plainToInstance(UpdateProfileDto, { fullName: 'A' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a full valid payload', async () => {
      const errors = await validate(
        plainToInstance(UpdateProfileDto, {
          fullName: 'Ada Lovelace',
          phone: '+251911223344',
          bio: 'Student',
        }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  it('UpdatePreferencesDto accepts a partial boolean payload', async () => {
    const errors = await validate(
      plainToInstance(UpdatePreferencesDto, { emailLearning: false }),
    );
    expect(errors).toHaveLength(0);
  });

  it('RevokeSessionsDto defaults includeCurrentSession to false', () => {
    const instance = plainToInstance(RevokeSessionsDto, {});
    expect(instance.includeCurrentSession).toBe(false);
  });

  describe('UserActionReasonDto', () => {
    it('requires a reason with a minimum length', async () => {
      const errors = await validate(
        plainToInstance(UserActionReasonDto, { reason: 'ab' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a valid reason', async () => {
      const errors = await validate(
        plainToInstance(UserActionReasonDto, { reason: 'Policy violation' }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe('ListUsersQueryDto', () => {
    it('applies defaults and accepts an empty query', async () => {
      const instance = plainToInstance(ListUsersQueryDto, {});
      expect(instance.page).toBe(1);
      expect(instance.pageSize).toBe(20);
      expect(instance.includeArchived).toBe(false);
      expect(await validate(instance)).toHaveLength(0);
    });

    it('rejects an unrecognized status filter', async () => {
      const errors = await validate(
        plainToInstance(ListUsersQueryDto, { status: 'NOT_A_STATUS' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a known status and provider, coercing string booleans', async () => {
      const instance = plainToInstance(ListUsersQueryDto, {
        status: UserStatusFilter.ACTIVE,
        provider: 'GOOGLE',
        emailVerified: 'true',
        includeArchived: 'true',
      });
      expect(instance.emailVerified).toBe(true);
      expect(instance.includeArchived).toBe(true);
      expect(await validate(instance)).toHaveLength(0);
    });

    it('rejects an unrecognized provider', async () => {
      const errors = await validate(
        plainToInstance(ListUsersQueryDto, { provider: 'FACEBOOK' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a pageSize above the maximum', async () => {
      const errors = await validate(
        plainToInstance(ListUsersQueryDto, { pageSize: 500 }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ActivityQueryDto', () => {
    it('applies page/pageSize defaults', () => {
      const instance = plainToInstance(ActivityQueryDto, {});
      expect(instance.page).toBe(1);
      expect(instance.pageSize).toBe(20);
    });

    it('accepts an action filter', async () => {
      const errors = await validate(
        plainToInstance(ActivityQueryDto, { action: 'user.login' }),
      );
      expect(errors).toHaveLength(0);
    });
  });
});
