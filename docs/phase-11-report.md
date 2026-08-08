# Backend Phase 11

Phase 11 adds filter-driven administrative reports, private CSV/XLSX/PDF exports, PostgreSQL job processing, audit exploration, and registry-controlled platform settings. It reuses Drizzle, dynamic RBAC, `activity_logs`, `background_jobs`, and private S3 storage. No dashboard or frontend API was added.

Revenue is the PostgreSQL sum of `payments.amount` only where status is `APPROVED`, grouped by currency. Enrollment and certificate reports use their immutable snapshot columns. Screen queries are bounded and stably ordered by timestamp and ID.

Exports move through QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED, and EXPIRED. Workers claim with `FOR UPDATE SKIP LOCKED`; generation happens after claiming. Files use random private keys and five-minute signed downloads. CSV and XLSX cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return receive a leading apostrophe. PDF exports contain plain text only and no active content.

Audit metadata is recursively sanitized at read time. Settings can only use the backend registry, require reasons, validate types and environment hard limits, and record changes atomically in `activity_logs`.

Phase 12 remains responsible for dashboard KPIs, charts, previews, and widgets.
