# Database package

This workspace owns the shared Drizzle schema, migration configuration, and controlled Neon PostgreSQL commands. Normal development uses a Neon pooled URL at runtime and a direct Neon URL for schema operations. Local PostgreSQL is optional and should only be used as an isolated test fallback.

Copy `.env.example` to `.env`, supply project-owner credentials, and confirm the intended Neon project/database or branch before running `db:migrate`, `db:seed`, or `db:check`. Commands sanitize failures and never print connection strings. There is deliberately no remote database reset command.
