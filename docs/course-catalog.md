# Backend course catalog and content management

Phase 5 adds versioned public catalog routes under `/api/v1/catalog` and permission-protected management routes under `/api/v1/admin`.

Courses begin as drafts. Publication requires complete descriptive fields, at least one active section, at least one published lesson, at least one outcome, and valid paid-course pricing. Restored courses return to draft. Duplication copies normalized outcomes, requirements, sections, lessons, and resource metadata while leaving enrollment, payment, progress, and certificate records untouched.

Public lists use PostgreSQL pagination, stable ID tie-breakers, and the existing generated `tsvector` GIN index. Lists expose only published, public, non-archived courses in active categories. Unlisted courses are excluded from lists but may be retrieved by their exact slug. Public details expose content and public resource metadata only for published preview lessons; storage keys are never presented.

Rich course and lesson text is allow-list sanitized. External URLs require HTTPS. Prices use decimal strings backed by PostgreSQL `numeric(12,2)`. Category hierarchy changes are cycle checked, destructive catalog operations are archival, and critical mutations create activity-log records.
