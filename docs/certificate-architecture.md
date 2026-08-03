# Certificate architecture

Phase 9 creates an immutable certificate identity in a short transaction, queues `GENERATE_CERTIFICATE` in PostgreSQL, and renders PDF/QR output outside database locks. A second transaction records the private file version and marks the certificate generated. Redis, BullMQ, and application caches are not used.
