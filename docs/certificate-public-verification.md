# Public certificate verification

`GET /api/v1/certificates/verify/:verificationToken` is rate-limited and accepts only high-entropy URL-safe tokens. It returns `VALID`, `REVOKED`, or generic `INVALID` with safe snapshots. It exposes no internal IDs, email, payment data, progress detail, storage keys, or revocation reason.
