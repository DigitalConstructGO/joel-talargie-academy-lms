# Joel Talargie Academy LMS

The backend includes certificate eligibility, PostgreSQL-backed generation jobs, private versioned PDF storage, secure downloads, and rate-limited public verification. See [certificate architecture](docs/certificate-architecture.md).

An npm-workspace modular monolith for Digital Construct, with a Next.js frontend, NestJS REST API, and Neon PostgreSQL/Drizzle database foundation.

## Prerequisites and setup

Use Node 24 and npm 11. Run `npm install`, copy `.env.example` values into local application environment files, obtain Neon pooled/direct URLs from the project owner, then run `npm run db:migrate`, `npm run db:seed`, `npm run db:check`, and `npm run dev`. The web app uses port 3000; the API uses port 4000.

## Workspaces

- `apps/web`: Next.js App Router, Tailwind CSS, Shadcn-style UI, Vitest
- `apps/api`: NestJS REST API, Jest, bcrypt
- `packages/contracts`: shared Zod schemas and API types
- `packages/database`: Neon PostgreSQL, Drizzle schema, and controlled database tooling
- `packages/ui`: future cross-app UI boundary
- `packages/config`: minimal shared TypeScript configuration

Common commands: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Run `npx playwright install` before the future browser smoke test.

Development occurs on `develop`; releasable work merges to `main`. Passwords are one-way hashed with `bcrypt.hash()` and checked with `bcrypt.compare()`. They cannot be decrypted and must never be logged. Database credentials are server-only and must never be logged or committed.
