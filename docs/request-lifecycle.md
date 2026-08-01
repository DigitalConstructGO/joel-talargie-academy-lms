# Request lifecycle

1. Helmet, body-size limits, compression, cookies, CORS, and trusted-proxy configuration process the request.
2. Correlation middleware preserves a supplied `X-Correlation-ID` or creates a UUID and returns it in the response.
3. Request logging captures safe method/path/IP/timing/status metadata after response completion.
4. Global throttling applies unless a reviewed skip decorator is used.
5. DTO validation transforms and rejects invalid or unknown input.
6. Controller calls an application service; service calls a repository; repository uses Drizzle.
7. Serialization and the response interceptor produce the standard response envelope.
8. Exceptions flow through the sanitized global filter.

Logging deliberately excludes bodies, query strings, authorization headers, tokens, passwords, and database configuration.
