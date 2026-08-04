# Environment variables

The API validates its environment with Zod at startup. Salt rounds must be an integer from 10 through 14. The browser reads only `NEXT_PUBLIC_API_URL`; no SMTP variable is public.

## Neon PostgreSQL

| Variable                         | Purpose                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                   | Neon pooled (`-pooler`) connection used by the running NestJS application and `pg.Pool`. Required in production. |
| `DATABASE_DIRECT_URL`            | Neon direct connection used only by Drizzle Kit, migrations, checks, and controlled seed operations.             |
| `DATABASE_TEST_URL`              | Isolated Neon branch/database or local PostgreSQL test target. It must not equal either primary URL.             |
| `DATABASE_POOL_MAX`              | Maximum runtime pool size; defaults to `10`.                                                                     |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Runtime pool connection timeout; defaults to `10000`.                                                            |
| `DATABASE_IDLE_TIMEOUT_MS`       | Runtime pool idle timeout; defaults to `30000`.                                                                  |

Both primary URLs must use PostgreSQL connection-string format, include a database, and retain Neon-provided SSL settings such as `sslmode=require`. `DATABASE_URL` normally contains `-pooler`; `DATABASE_DIRECT_URL` does not. URLs are server-only, never use `NEXT_PUBLIC_`, and validation errors never echo credentials or connection details. Migration commands fail with a sanitized message when the direct URL is absent or invalid.

## Mail

| Variable                     | Default                 | Notes                                                    |
| ---------------------------- | ----------------------- | -------------------------------------------------------- |
| `MAIL_ENABLED`               | `false`                 | Boolean. Disabled mode does not contact SMTP.            |
| `SMTP_HOST`                  | empty                   | Required when mail is enabled.                           |
| `SMTP_PORT`                  | `587`                   | Integer from 1 through 65535.                            |
| `SMTP_SECURE`                | `false`                 | Boolean; normally `true` for implicit TLS on port 465.   |
| `SMTP_USER`                  | empty                   | Set when the SMTP server requires authentication.        |
| `SMTP_PASSWORD`              | empty                   | Server-only secret; never included in validation output. |
| `SMTP_FROM_NAME`             | `Joel Talargie Academy` | Display name for outgoing mail.                          |
| `SMTP_FROM_EMAIL`            | empty                   | Valid email required when mail is enabled.               |
| `SMTP_CONNECTION_TIMEOUT_MS` | `10000`                 | Positive integer.                                        |
| `SMTP_GREETING_TIMEOUT_MS`   | `10000`                 | Positive integer.                                        |
| `SMTP_SOCKET_TIMEOUT_MS`     | `15000`                 | Positive integer.                                        |

For optional local testing, a later infrastructure phase can point these values at Mailpit and expose its development-only inbox UI. It is not required for Phase 1 tests. Never use personal Gmail passwords, commit `.env` files, JWT secrets, SMTP credentials, or storage keys. Production rejects obvious placeholder SMTP credentials.

## Phase 11 reporting

- `REPORT_EXPORTS_ENABLED`: deployment hard switch for report exports.
- `REPORT_EXPORT_MAX_ROWS`: hard upper row limit; database settings cannot exceed it.
- `REPORT_EXPORT_RETENTION_DAYS`: private-file retention period.
