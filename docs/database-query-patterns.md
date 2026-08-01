# Database query patterns

All list queries run inside PostgreSQL, select explicit required columns, validate a maximum page size, and use a unique tie-breaker.

- Public catalog: published, public, unarchived courses ordered by `published_at DESC, id DESC`; category/access/featured filters use matching indexes.
- Course details: unique slug lookup, category join, and ordered curriculum batches. Private content/storage keys are excluded from catalog projections.
- Student dashboard and My Courses: student/status filter ordered by `updated_at DESC, id DESC`; grouped progress aggregates prevent N+1 queries.
- Learning progress: upsert one enrollment/lesson record inside a short transaction and derive completion with grouped queries.
- Payment queue: pending partial index ordered by `submitted_at ASC, id ASC`; receipt metadata loads only on detail. Approval locks the payment row, validates state, updates payment/enrollment, and writes audit/notification records before commit.
- Certificate verification: unique token lookup selecting only safe public snapshot/status/date fields.
- Notifications and audit logs: cursor pagination by `created_at DESC, id DESC`.
- Background jobs: claim due jobs by `scheduled_at, priority, id` with `FOR UPDATE SKIP LOCKED`.

Small administrator grids may use bounded offset pages. Large operational histories use cursors. External email, uploads, PDFs, and network calls occur after transaction commit. Large offsets, JavaScript pagination, `SELECT *`, and row-by-row query loops are prohibited.
