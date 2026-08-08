# Backend dynamic RBAC

Authorization is enforced after JWT authentication. `PermissionsGuard` reads `@RequirePermissions()` metadata and resolves the account status, active roles, and current permission assignments directly from PostgreSQL for every protected request. Permission mode defaults to `ALL`; `@PermissionMode(PermissionMode.ANY)` opts into `ANY` explicitly.

Permission definitions are system-managed in `packages/database/src/permission-catalog.ts`. The idempotent database seed maintains `ADMINISTRATOR` and `STUDENT`, assigns the complete catalog to Administrator, and removes administrative permissions from Student. There is intentionally no permission-creation API.

Administrators can create, update, and archive custom roles, replace their permission sets, and assign or remove user roles. System roles are immutable. Delegated managers may grant only permissions they currently possess. Only a current system Administrator may assign the Administrator role, and the final active Administrator assignment cannot be removed.

Critical changes are transactionally recorded in `activity_logs`; Administrator assignment and removal also create security notifications. Passwords, JWTs, OAuth tokens, refresh-token hashes, and infrastructure credentials are never included in audit metadata.

## Endpoints

- `GET /api/v1/admin/permissions`
- `GET|POST /api/v1/admin/roles`
- `GET|PATCH|DELETE /api/v1/admin/roles/:roleId`
- `PUT /api/v1/admin/roles/:roleId/permissions`
- `GET|POST /api/v1/admin/users/:userId/roles`
- `DELETE /api/v1/admin/users/:userId/roles/:roleId`
- `GET /api/v1/auth/authorization`

Apply migrations and seed before using the endpoints:

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
```
