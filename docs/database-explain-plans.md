# Database EXPLAIN plans

Run each query only on an isolated performance database with `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`. Never record credentials or complete host details.

Required reviews: published catalog; ranked search; course curriculum summary; active student enrollments; grouped progress; pending-payment queue; transaction-ID lookup; certificate verification; unread notifications; audit filters; and job claim with `FOR UPDATE SKIP LOCKED`.

For every plan record environment/data volume, planning/execution time, rows scanned/returned, buffers, sort/join strategy, index used, rows removed by filter, and optimization outcome. Sequential scans are acceptable only for small tables or queries returning a demonstrably large share. Exact cost estimates are not test assertions.

Status: not executed because an isolated Neon performance database and credentials were not supplied.
