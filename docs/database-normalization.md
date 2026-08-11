# Database normalization

The transactional schema is designed to Third Normal Form where practical. In 1NF, values are atomic and repeating roles, permissions, sections, lessons, resources, receipts, and progress records use child or junction tables. In 2NF, junction metadata describes the complete relationship: `user_roles.assigned_at` belongs to the user-role assignment, while role names and user data remain in their owner tables. In 3NF, categories, course details, students, roles, payments, lessons, and certificates are referenced by keys rather than copied into transactional rows.

## Approved immutable snapshots

- `enrollments.price_at_enrollment`, `currency_at_enrollment`, and `discount_at_enrollment` preserve accepted commercial terms. They remain linked to the normalized course and are immutable after enrollment.
- `certificates.student_name_at_issue` and `course_title_at_issue` preserve the public wording on an issued certificate. They remain linked through enrollment/template relationships and are immutable after issue.
- `activity_logs.before` and `after` preserve historical audit evidence rather than current entity state.

JSONB is limited to flexible certificate-template configuration, notification metadata, audit payloads, platform-setting values, and background-job payloads. Roles, permissions, curriculum, enrollments, payments, receipts, progress, and certificates use typed relational columns. No JSONB field currently has a query-driven GIN requirement.

Archived users, categories, courses, and lessons remain historical records. Normal repositories must explicitly filter `archived_at IS NULL`; administrator history queries must opt into archived rows.
