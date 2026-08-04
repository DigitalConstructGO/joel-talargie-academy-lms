# Database indexes

Unique constraints cover normalized identity and relationship rules: normalized email; profile user; role code/name; permission code; category/course slugs; course lesson slug; user-role and role-permission pairs; student-course enrollment; enrollment-lesson progress; enrollment payment attempt; template name/version; certificate number/token; and platform-setting key. No duplicate B-tree index is added for these constraints.

| Table           | Columns / predicate                                      | Type           | Query supported and column-order reason              |
| --------------- | -------------------------------------------------------- | -------------- | ---------------------------------------------------- |
| courses         | status, visibility, published_at DESC, id                | B-tree         | Equality filters followed by stable catalog ordering |
| courses         | category_id/access_type/featured then publication fields | B-tree         | Filtered catalog variants                            |
| courses         | published_at DESC, id; published/public/not archived     | Partial B-tree | Small hot public-catalog index                       |
| courses         | search_vector                                            | GIN            | Ranked full-text search                              |
| enrollments     | student_id, status, updated_at DESC, id                  | B-tree         | Stable My Courses cursor pages                       |
| enrollments     | course_id, status                                        | B-tree         | Roster and reporting filters                         |
| lesson_progress | enrollment_id, status/recent timestamp                   | B-tree         | Completion summary and recent learning               |
| payments        | submitted_at, id; pending only                           | Partial B-tree | FIFO administrator queue                             |
| payments        | reviewer/date and transaction_id                         | B-tree         | Review history and exact lookup                      |
| certificates    | enrollment_id, status                                    | B-tree         | Enrollment certificate state                         |
| certificates    | issued_at DESC, id; generated/not revoked                | Partial B-tree | Active certificate administration                    |
| notifications   | user_id, read/status, created_at DESC, id                | B-tree         | Stable user notification pages                       |
| notifications   | user_id, created_at DESC, id; unread in-app              | Partial B-tree | Unread feed                                          |
| activity_logs   | entity/actor/action, created_at DESC, id                 | B-tree         | Cursor-paginated audit filters                       |
| background_jobs | scheduled_at, priority, id; pending                      | Partial B-tree | Deterministic job claims                             |
| background_jobs | status/locked_at and type/status/schedule                | B-tree         | Recovery and operational filtering                   |

Remaining indexes support documented foreign-key joins and deletion checks. Composite unique indexes are reused when their leading column satisfies a lookup. Index value must be confirmed with `EXPLAIN ANALYZE` on representative data before removal or expansion.
Phase 11 adds requester/created, status/created, status/expiry, and active deduplication indexes to `report_exports`.
