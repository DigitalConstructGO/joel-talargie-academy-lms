# Report export system

Export requests are validated against the report and column registries, deduplicated per requester, and inserted with one PostgreSQL job. CSV, XLSX, and PDF are supported. PDF documents contain no scripts, forms, attachments, or external links. Metadata is preserved after cancellation, failure, and expiry; exported rows are never stored in PostgreSQL.
