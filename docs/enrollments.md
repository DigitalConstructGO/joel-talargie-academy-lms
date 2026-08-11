# Enrollment management

Phase 6 provides authenticated Student self-enrollment and permission-protected Administrator management. It does not implement payment submission or approval, lesson progress, completion, or certificates.

## Student API

- `POST /api/v1/enrollments` creates or safely returns the authenticated Student's enrollment.
- `GET /api/v1/me/enrollments` supports bounded pagination, status, category, and course search.
- `GET /api/v1/me/enrollments/:enrollmentId` returns only an owned enrollment.
- `GET /api/v1/me/enrollments/course/:courseId` checks the authenticated Student's state for a course.

Free courses begin as `ENROLLED` and grant access. Paid courses begin as `PENDING_PAYMENT` and do not grant access. The API derives the Student from the JWT and accepts only `courseId`; client-supplied identity, status, money, and progress fields are rejected by DTO validation.

Price and currency are immutable snapshots. `priceSnapshot` is the original price. `discountSnapshot` is the discounted final price when configured; the existing non-null database convention stores `0.00` when absent. Money remains an exact decimal string and is never calculated through JavaScript floating point.

## Administrator API

- `GET /api/v1/admin/enrollments`
- `GET /api/v1/admin/enrollments/:enrollmentId`
- `POST /api/v1/admin/enrollments/:enrollmentId/cancel`
- `POST /api/v1/admin/enrollments/:enrollmentId/revoke-access`
- `GET /api/v1/admin/enrollments/:enrollmentId/activity`

The endpoints require their matching dynamic permissions. Cancellation accepts only `PENDING_PAYMENT`, `WAITING_APPROVAL`, and `ENROLLED`. Revocation accepts only `ENROLLED` and `IN_PROGRESS`. Both require a reason, lock the enrollment row, preserve history, write an audit event, and create an in-app notification.

## Capacity and concurrency

Creation runs in one database transaction and locks the course row before revalidation, capacity counting, and insertion. The unique Student/course constraint prevents duplicates. Capacity counts `PENDING_PAYMENT`, `WAITING_APPROVAL`, `ENROLLED`, `IN_PROGRESS`, and `COMPLETED`; cancelled and revoked records release their seats. A partial `(course_id, status)` index supports this count.

Next actions are `SUBMIT_PAYMENT`, `WAIT_FOR_PAYMENT_REVIEW`, `START_COURSE`, `CONTINUE_COURSE`, `VIEW_COMPLETION`, or `CONTACT_SUPPORT`. Learning access is allowed only for `ENROLLED`, `IN_PROGRESS`, and retained review access for `COMPLETED`.
