# Report retention

Completed exports receive an expiry timestamp from `REPORT_EXPORT_RETENTION_DAYS`. Cleanup removes the private object, clears its key, sets EXPIRED, and retains row count, checksum, request metadata, and audit history.
