# Development setup

Install Node 24 and npm 11, run `npm install`, and copy the example environment files. Obtain the pooled and direct Neon connection strings from the project owner; never commit them.

Normal startup does not require local PostgreSQL or Docker:

```text
npm install
npm run db:migrate
npm run db:seed
npm run db:check
npm run dev
```

Before any schema command, confirm the intended Neon project, database, branch, and environment. Prefer an isolated Neon development branch. Never run a development reset against production; no `db:reset` command exists. A local PostgreSQL container is permitted only as an optional isolated test fallback.

Use `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before review. Playwright browsers are optional initially; install later with `npx playwright install`.
