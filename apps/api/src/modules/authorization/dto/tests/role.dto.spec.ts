import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  AssignRolePermissionsDto,
  AssignUserRoleDto,
  CreateRoleDto,
  ListPermissionsQueryDto,
  ListRolesQueryDto,
  UpdateRoleDto,
} from '../role.dto';

describe('role DTOs', () => {
  describe('CreateRoleDto', () => {
    const valid = {
      name: 'Course Reviewer',
      code: 'COURSE_REVIEWER',
      permissionIds: ['3cf4bc56-c5ed-4e46-8558-822bcde19501'],
    };

    it('accepts a minimal valid payload', async () => {
      const errors = await validate(plainToInstance(CreateRoleDto, valid));
      expect(errors).toHaveLength(0);
    });

    it('rejects a lowercase or malformed code', async () => {
      const errors = await validate(
        plainToInstance(CreateRoleDto, { ...valid, code: 'course-reviewer' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a duplicate permission id', async () => {
      const errors = await validate(
        plainToInstance(CreateRoleDto, {
          ...valid,
          permissionIds: [
            '3cf4bc56-c5ed-4e46-8558-822bcde19501',
            '3cf4bc56-c5ed-4e46-8558-822bcde19501',
          ],
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a non-UUID permission id', async () => {
      const errors = await validate(
        plainToInstance(CreateRoleDto, {
          ...valid,
          permissionIds: ['not-a-uuid'],
        }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  it('UpdateRoleDto accepts an empty payload', async () => {
    expect(await validate(plainToInstance(UpdateRoleDto, {}))).toHaveLength(0);
  });

  describe('AssignRolePermissionsDto', () => {
    it('requires a permissionIds array', async () => {
      const errors = await validate(
        plainToInstance(AssignRolePermissionsDto, {}),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a valid list of unique UUIDs', async () => {
      const errors = await validate(
        plainToInstance(AssignRolePermissionsDto, {
          permissionIds: ['3cf4bc56-c5ed-4e46-8558-822bcde19501'],
        }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe('AssignUserRoleDto', () => {
    it('requires a valid roleId', async () => {
      const errors = await validate(
        plainToInstance(AssignUserRoleDto, { roleId: 'not-a-uuid' }),
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('accepts a valid roleId', async () => {
      const errors = await validate(
        plainToInstance(AssignUserRoleDto, {
          roleId: '3cf4bc56-c5ed-4e46-8558-822bcde19501',
        }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe('ListRolesQueryDto', () => {
    it('applies page/pageSize defaults and coerces boolean filters', async () => {
      const instance = plainToInstance(ListRolesQueryDto, {
        isSystem: 'true',
        archived: 'true',
      });
      expect(instance.page).toBe(1);
      expect(instance.pageSize).toBe(20);
      expect(instance.isSystem).toBe(true);
      expect(instance.archived).toBe(true);
      expect(await validate(instance)).toHaveLength(0);
    });
  });

  it('ListPermissionsQueryDto accepts an empty query', async () => {
    expect(
      await validate(plainToInstance(ListPermissionsQueryDto, {})),
    ).toHaveLength(0);
  });
});
