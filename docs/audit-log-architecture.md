# Audit-log architecture

`activity_logs` is append-only through the administration API: list and detail routes exist, but update and delete routes do not. Reports, downloads, retries, cancellations, and settings changes emit audit events.
