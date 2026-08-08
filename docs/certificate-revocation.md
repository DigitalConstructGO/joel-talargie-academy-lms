# Certificate revocation

Only generated certificates can be revoked. Revocation requires `certificates.revoke` and a reason, preserves identity and every file version, immediately changes public verification to `REVOKED`, and denies Student downloads. There is intentionally no unrevoke or delete endpoint.
