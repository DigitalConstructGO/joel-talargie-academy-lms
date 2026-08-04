# Audit-log privacy

Historical before/after values are recursively sanitized during presentation. Keys resembling passwords, tokens, authorization, cookies, database URLs, SMTP secrets, and storage keys are replaced with `[REDACTED]`. IP addresses and user agents are reduced without `audit.read_sensitive`.
