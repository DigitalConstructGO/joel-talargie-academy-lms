import { and, asc, count, eq, ilike, inArray, isNotNull, isNull, or } from 'drizzle-orm';
import { schema } from './schema/index.ts';
import type { AcademyDatabase } from './queries.ts';
export interface AuthorizationContext {
  userId: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  roles: string[];
  permissions: string[];
  isAdministrator: boolean;
}
export const getAuthorizationContext = async (
  db: AcademyDatabase,
  userId: string,
): Promise<AuthorizationContext | null> => {
  const user = await db.query.users.findFirst({
    columns: { id: true, status: true },
    where: and(eq(schema.users.id, userId), isNull(schema.users.archivedAt)),
  });
  if (!user) return null;
  const rows = await db
    .select({ role: schema.roles.code, permission: schema.permissions.code })
    .from(schema.userRoles)
    .innerJoin(
      schema.roles,
      and(eq(schema.userRoles.roleId, schema.roles.id), isNull(schema.roles.archivedAt)),
    )
    .leftJoin(schema.rolePermissions, eq(schema.rolePermissions.roleId, schema.roles.id))
    .leftJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(eq(schema.userRoles.userId, userId));
  const roles = [...new Set(rows.map((row) => row.role))];
  const permissions = [...new Set(rows.flatMap((row) => (row.permission ? [row.permission] : [])))];
  return {
    userId,
    status: user.status,
    roles,
    permissions,
    isAdministrator: roles.includes('ADMINISTRATOR'),
  };
};
export const listPermissionCatalog = async (db: AcademyDatabase, search?: string) =>
  db
    .select({
      id: schema.permissions.id,
      code: schema.permissions.code,
      module: schema.permissions.module,
      description: schema.permissions.description,
    })
    .from(schema.permissions)
    .where(
      search
        ? or(
            ilike(schema.permissions.code, `%${search}%`),
            ilike(schema.permissions.description, `%${search}%`),
          )
        : undefined,
    )
    .orderBy(asc(schema.permissions.module), asc(schema.permissions.code));
export const getPermissionsByIds = async (
  db: AcademyDatabase,
  ids: string[],
): Promise<Array<{ id: string; code: string }>> => {
  if (!ids.length) return [];
  return db
    .select({ id: schema.permissions.id, code: schema.permissions.code })
    .from(schema.permissions)
    .where(inArray(schema.permissions.id, ids));
};
export const listRoles = async (
  db: AcademyDatabase,
  input: { search?: string; isSystem?: boolean; archived?: boolean; limit: number; offset: number },
) => {
  const conditions = [
    input.search
      ? or(
          ilike(schema.roles.name, `%${input.search}%`),
          ilike(schema.roles.code, `%${input.search}%`),
        )
      : undefined,
    input.isSystem === undefined ? undefined : eq(schema.roles.isSystem, input.isSystem),
    input.archived === undefined
      ? undefined
      : input.archived
        ? isNotNull(schema.roles.archivedAt)
        : isNull(schema.roles.archivedAt),
  ].filter(Boolean);
  const where = conditions.length ? and(...conditions) : undefined;
  const items = await db
    .select()
    .from(schema.roles)
    .where(where)
    .orderBy(asc(schema.roles.code))
    .limit(input.limit)
    .offset(input.offset);
  const [{ total = 0 } = {}] = await db.select({ total: count() }).from(schema.roles).where(where);
  const ids = items.map((role) => role.id);
  if (!ids.length) return { items: [], total };
  const permissionCounts = await db
    .select({ roleId: schema.rolePermissions.roleId, value: count() })
    .from(schema.rolePermissions)
    .where(inArray(schema.rolePermissions.roleId, ids))
    .groupBy(schema.rolePermissions.roleId);
  const userCounts = await db
    .select({ roleId: schema.userRoles.roleId, value: count() })
    .from(schema.userRoles)
    .where(inArray(schema.userRoles.roleId, ids))
    .groupBy(schema.userRoles.roleId);
  return {
    items: items.map((role) => ({
      ...role,
      permissionCount: Number(permissionCounts.find((x) => x.roleId === role.id)?.value ?? 0),
      userCount: Number(userCounts.find((x) => x.roleId === role.id)?.value ?? 0),
    })),
    total: Number(total),
  };
};
export const getRoleDetails = async (db: AcademyDatabase, id: string) => {
  const role = await db.query.roles.findFirst({ where: eq(schema.roles.id, id) });
  if (!role) return null;
  const permissions = await db
    .select({
      id: schema.permissions.id,
      code: schema.permissions.code,
      module: schema.permissions.module,
      description: schema.permissions.description,
    })
    .from(schema.rolePermissions)
    .innerJoin(schema.permissions, eq(schema.rolePermissions.permissionId, schema.permissions.id))
    .where(eq(schema.rolePermissions.roleId, id))
    .orderBy(asc(schema.permissions.module), asc(schema.permissions.code));
  const [{ users = 0 } = {}] = await db
    .select({ users: count() })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.roleId, id));
  return { ...role, permissions, userCount: Number(users) };
};
const log = (
  tx: AcademyDatabase,
  input: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  },
) => tx.insert(schema.activityLogs).values(input);
export const createRoleWithPermissions = async (
  db: AcademyDatabase,
  input: {
    actorId: string;
    name: string;
    code: string;
    description?: string;
    permissionIds: string[];
  },
) =>
  db.transaction(async (tx) => {
    const permissions = await getPermissionsByIds(tx as AcademyDatabase, input.permissionIds);
    if (permissions.length !== input.permissionIds.length) throw new Error('INVALID_PERMISSION');
    const actor = await getAuthorizationContext(tx as AcademyDatabase, input.actorId);
    if (
      !actor ||
      actor.status !== 'ACTIVE' ||
      (!actor.isAdministrator &&
        permissions.some((permission) => !actor.permissions.includes(permission.code)))
    )
      throw new Error('PRIVILEGE_ESCALATION');
    const [role] = await tx
      .insert(schema.roles)
      .values({
        name: input.name,
        code: input.code,
        description: input.description,
        isSystem: false,
      })
      .returning();
    if (!role) throw new Error('ROLE_CREATE_FAILED');
    if (input.permissionIds.length)
      await tx
        .insert(schema.rolePermissions)
        .values(input.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })));
    await log(tx as AcademyDatabase, {
      actorId: input.actorId,
      action: 'role.created',
      entityType: 'role',
      entityId: role.id,
      after: { name: role.name, code: role.code, permissions: permissions.map((x) => x.code) },
    });
    return role;
  });
export const updateCustomRole = async (
  db: AcademyDatabase,
  input: { actorId: string; roleId: string; name?: string; description?: string },
) =>
  db.transaction(async (tx) => {
    const role = await tx.query.roles.findFirst({ where: eq(schema.roles.id, input.roleId) });
    if (!role) throw new Error('ROLE_NOT_FOUND');
    if (role.isSystem) throw new Error('SYSTEM_ROLE');
    const [updated] = await tx
      .update(schema.roles)
      .set({
        name: input.name ?? role.name,
        description: input.description ?? role.description,
        updatedAt: new Date(),
      })
      .where(eq(schema.roles.id, role.id))
      .returning();
    await log(tx as AcademyDatabase, {
      actorId: input.actorId,
      action: 'role.updated',
      entityType: 'role',
      entityId: role.id,
      before: { name: role.name, description: role.description },
      after: { name: updated?.name, description: updated?.description },
    });
    return updated;
  });
export const replaceCustomRolePermissions = async (
  db: AcademyDatabase,
  input: { actorId: string; roleId: string; permissionIds: string[] },
) =>
  db.transaction(async (tx) => {
    const role = await tx.query.roles.findFirst({ where: eq(schema.roles.id, input.roleId) });
    if (!role) throw new Error('ROLE_NOT_FOUND');
    if (role.isSystem) throw new Error('SYSTEM_ROLE');
    const before = await getRoleDetails(tx as AcademyDatabase, role.id);
    const permissions = await getPermissionsByIds(tx as AcademyDatabase, input.permissionIds);
    if (permissions.length !== input.permissionIds.length) throw new Error('INVALID_PERMISSION');
    const actor = await getAuthorizationContext(tx as AcademyDatabase, input.actorId);
    if (
      !actor ||
      actor.status !== 'ACTIVE' ||
      (!actor.isAdministrator &&
        permissions.some((permission) => !actor.permissions.includes(permission.code)))
    )
      throw new Error('PRIVILEGE_ESCALATION');
    await tx.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, role.id));
    if (input.permissionIds.length)
      await tx
        .insert(schema.rolePermissions)
        .values(input.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })));
    await log(tx as AcademyDatabase, {
      actorId: input.actorId,
      action: 'role.permissions.updated',
      entityType: 'role',
      entityId: role.id,
      before: { permissions: before?.permissions.map((x) => x.code) },
      after: { permissions: permissions.map((x) => x.code) },
    });
    return permissions;
  });
export const archiveCustomRole = async (db: AcademyDatabase, actorId: string, roleId: string) =>
  db.transaction(async (tx) => {
    const role = await tx.query.roles.findFirst({ where: eq(schema.roles.id, roleId) });
    if (!role) throw new Error('ROLE_NOT_FOUND');
    if (role.isSystem) throw new Error('SYSTEM_ROLE');
    if (role.archivedAt) return role;
    const [updated] = await tx
      .update(schema.roles)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.roles.id, roleId))
      .returning();
    await log(tx as AcademyDatabase, {
      actorId,
      action: 'role.archived',
      entityType: 'role',
      entityId: roleId,
      before: { archivedAt: null },
      after: { archivedAt: updated?.archivedAt?.toISOString() },
    });
    return updated;
  });
export const listUserRoles = async (db: AcademyDatabase, userId: string) =>
  db
    .select({
      id: schema.roles.id,
      code: schema.roles.code,
      name: schema.roles.name,
      isSystem: schema.roles.isSystem,
      assignedAt: schema.userRoles.assignedAt,
    })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .where(eq(schema.userRoles.userId, userId))
    .orderBy(asc(schema.roles.code));
export const assignRoleToUser = async (
  db: AcademyDatabase,
  input: { actorId: string; userId: string; roleId: string },
) =>
  db.transaction(async (tx) => {
    const [user, role] = await Promise.all([
      tx.query.users.findFirst({
        where: and(eq(schema.users.id, input.userId), isNull(schema.users.archivedAt)),
      }),
      tx.query.roles.findFirst({
        where: and(eq(schema.roles.id, input.roleId), isNull(schema.roles.archivedAt)),
      }),
    ]);
    if (!user) throw new Error('USER_NOT_FOUND');
    if (!role) throw new Error('ROLE_NOT_FOUND');
    const actor = await getAuthorizationContext(tx as AcademyDatabase, input.actorId);
    const target = await getRoleDetails(tx as AcademyDatabase, role.id);
    if (
      !actor ||
      actor.status !== 'ACTIVE' ||
      (role.code === 'ADMINISTRATOR' && !actor.isAdministrator) ||
      (!actor.isAdministrator &&
        target?.permissions.some((permission) => !actor.permissions.includes(permission.code)))
    )
      throw new Error('PRIVILEGE_ESCALATION');
    const existing = await tx.query.userRoles.findFirst({
      where: and(
        eq(schema.userRoles.userId, input.userId),
        eq(schema.userRoles.roleId, input.roleId),
      ),
    });
    if (existing) throw new Error('ROLE_ALREADY_ASSIGNED');
    await tx
      .insert(schema.userRoles)
      .values({ userId: input.userId, roleId: input.roleId, assignedBy: input.actorId });
    const action =
      role.code === 'ADMINISTRATOR' ? 'administrator.role.assigned' : 'user.role.assigned';
    await log(tx as AcademyDatabase, {
      actorId: input.actorId,
      action,
      entityType: 'user',
      entityId: input.userId,
      after: { role: role.code },
    });
    if (role.code === 'ADMINISTRATOR')
      await tx.insert(schema.notifications).values({
        userId: input.userId,
        channel: 'IN_APP',
        title: 'Administrator access assigned',
        body: 'Your account was granted administrator access.',
      });
    return role;
  });
export const removeRoleFromUser = async (
  db: AcademyDatabase,
  input: { actorId: string; userId: string; roleId: string },
) =>
  db.transaction(async (tx) => {
    const role = await tx.query.roles.findFirst({ where: eq(schema.roles.id, input.roleId) });
    if (!role) throw new Error('ROLE_NOT_FOUND');
    const assignment = await tx.query.userRoles.findFirst({
      where: and(
        eq(schema.userRoles.userId, input.userId),
        eq(schema.userRoles.roleId, input.roleId),
      ),
    });
    if (!assignment) throw new Error('ASSIGNMENT_NOT_FOUND');
    if (role.code === 'STUDENT') throw new Error('STUDENT_ROLE_REQUIRED');
    if (role.code === 'ADMINISTRATOR') {
      const [{ administrators = 0 } = {}] = await tx
        .select({ administrators: count() })
        .from(schema.userRoles)
        .innerJoin(
          schema.users,
          and(
            eq(schema.userRoles.userId, schema.users.id),
            eq(schema.users.status, 'ACTIVE'),
            isNull(schema.users.archivedAt),
          ),
        )
        .where(eq(schema.userRoles.roleId, role.id));
      if (Number(administrators) <= 1) throw new Error('LAST_ADMINISTRATOR');
    }
    await tx
      .delete(schema.userRoles)
      .where(
        and(eq(schema.userRoles.userId, input.userId), eq(schema.userRoles.roleId, input.roleId)),
      );
    const action =
      role.code === 'ADMINISTRATOR' ? 'administrator.role.removed' : 'user.role.removed';
    await log(tx as AcademyDatabase, {
      actorId: input.actorId,
      action,
      entityType: 'user',
      entityId: input.userId,
      before: { role: role.code },
    });
    if (role.code === 'ADMINISTRATOR')
      await tx.insert(schema.notifications).values({
        userId: input.userId,
        channel: 'IN_APP',
        title: 'Administrator access removed',
        body: 'Administrator access was removed from your account.',
      });
    return role;
  });
