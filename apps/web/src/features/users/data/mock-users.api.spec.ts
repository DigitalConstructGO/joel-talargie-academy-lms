import { describe, expect, it } from 'vitest';
import { mockUsersApi } from './mock-users.api';

describe('mockUsersApi.list filtering', () => {
  it('excludes archived users by default', async () => {
    const result = await mockUsersApi.list({});
    expect(result.items.every((user) => user.status !== 'ARCHIVED')).toBe(true);
  });

  it('includes archived users when includeArchived is set', async () => {
    const archived = await mockUsersApi.archive('user-4', 'test cleanup');
    expect(archived.status).toBe('ARCHIVED');
    const withArchived = await mockUsersApi.list({ includeArchived: true });
    expect(withArchived.items.some((user) => user.id === 'user-4')).toBe(true);
    const withoutArchived = await mockUsersApi.list({});
    expect(withoutArchived.items.some((user) => user.id === 'user-4')).toBe(false);
  });

  it('filters by status', async () => {
    const result = await mockUsersApi.list({ status: 'PENDING_VERIFICATION' });
    expect(result.items.every((user) => user.status === 'PENDING_VERIFICATION')).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('filters by search across email and name', async () => {
    const result = await mockUsersApi.list({ search: 'sara' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.email).toContain('sara');
  });

  it('paginates results', async () => {
    const page1 = await mockUsersApi.list({ page: 1, pageSize: 2 });
    const page2 = await mockUsersApi.list({ page: 2, pageSize: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.items[0]?.id).not.toBe(page2.items[0]?.id);
    expect(page1.total).toBe(page2.total);
  });
});

describe('mockUsersApi status transitions', () => {
  it('activate/suspend/restore round-trip a user through the real status enum', async () => {
    const suspended = await mockUsersApi.suspend('user-1', 'policy violation');
    expect(suspended.status).toBe('SUSPENDED');
    const activated = await mockUsersApi.activate('user-1');
    expect(activated.status).toBe('ACTIVE');
  });
});
