# Environment variables

The API validates its environment with Zod at startup. Salt rounds must be an integer from 10 through 14. The browser reads only `NEXT_PUBLIC_API_URL`; no SMTP variable is public.

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
