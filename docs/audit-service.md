# Audit service

`AuditService` exposes `logCreate`, `logUpdate`, `logDelete`, `logLogin`, `logLogout`, and `logCustom`. It delegates persistence to `AuditRepository`, which alone uses Drizzle and `activity_logs`. Records include actor, action, entity type/ID, sanitized previous/new JSON, IP address, user agent, and UTC timestamp.

Password, password-hash, token, refresh-token, and database-URL fields are stripped before persistence. Controllers must call application services; they must not write audit rows directly.
