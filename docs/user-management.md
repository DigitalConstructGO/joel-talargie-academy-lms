# Backend user management

The API provides authenticated self-service profile, account, session, authentication-provider,
and notification-preference endpoints under `/me`. Administrator operations are available under
`/admin/users` and require the matching granular permission from the RBAC catalog.

Supported account states are `PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, and `ARCHIVED`.
Transitions are validated server-side. Suspending or archiving an account requires a reason and
revokes its active refresh sessions. Administrators cannot change their own status, and the last
active Administrator account cannot be suspended or archived.

Session responses expose masked IP addresses and derived device labels. Refresh tokens are never
returned by user-management endpoints. The current session is identified by the signed `sid` JWT
claim. Security notification preferences remain permanently enabled.

Profile updates, preference updates, session revocations, and administrator status changes create
activity records. Administrative security actions also create in-app notifications for the target
user.

Swagger documents these routes at `/api/docs` while the API is running.
