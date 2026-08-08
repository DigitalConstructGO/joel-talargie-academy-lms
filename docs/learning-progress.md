# Learning and progress tracking

Phase 7 provides backend-only learning access and progress tracking. Students may learn only through an owned `ENROLLED`, `IN_PROGRESS`, or `COMPLETED` enrollment. Pending payment, pending review, cancelled, and revoked enrollments have no learning access. Completed enrollments retain review access.

Archived courses do not automatically revoke existing access, but unpublished or archived lessons and archived sections are excluded. Any accessible published lesson may be opened; curriculum order is a recommendation and is not forced locking.

## Progress policy

Opening a lesson creates or updates one `(enrollment_id, lesson_id)` progress row and never regresses `COMPLETED`. Video positions are non-negative integer seconds bounded by the configured video duration. Private storage keys and `ADMIN_ONLY` resources are never returned; external URLs must use HTTPS and text lesson HTML is sanitized.

Course progress is `floor(completed mandatory published lessons × 100 / mandatory published lessons)`. Optional lessons are tracked separately and never reduce required progress. A course with zero mandatory lessons remains incomplete. Completion locks the enrollment, upserts lesson progress, recalculates progress, and creates the course event and notification once.

For certificate-enabled courses, completion inserts one deduplicated `CERTIFICATE_GENERATION_REQUESTED` background-job handoff. Phase 7 does not run a worker, create a certificate record, generate a PDF, or generate a QR code.

## Endpoints

- `POST /api/v1/me/learning/enrollments/:enrollmentId/start`
- `GET /api/v1/me/learning/enrollments/:enrollmentId`
- `GET /api/v1/me/learning/enrollments/:enrollmentId/resume`
- `POST /api/v1/me/learning/enrollments/:enrollmentId/lessons/:lessonId/open`
- `GET /api/v1/me/learning/enrollments/:enrollmentId/lessons/:lessonId`
- `PATCH /api/v1/me/learning/enrollments/:enrollmentId/lessons/:lessonId/position`
- `POST /api/v1/me/learning/enrollments/:enrollmentId/lessons/:lessonId/complete`
- `GET /api/v1/admin/enrollments/:enrollmentId/progress`
- `GET /api/v1/admin/enrollments/:enrollmentId/progress/activity`
