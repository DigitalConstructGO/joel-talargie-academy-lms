# Joel Talargie Academy LMS

An npm-workspace modular monolith for Digital Construct, with a Next.js frontend and NestJS REST API. Phase 1 supplies repository tooling, shared contracts, validated configuration, health connectivity, Swagger, and a bcrypt password-hashing foundation. It intentionally contains no database or authentication workflow.

## Prerequisites and setup

Use Node 24 and npm 11. Run `npm install`, copy `.env.example` values into local application environment files, then run `npm run dev`. The web app uses port 3000; the API uses port 4000. Swagger is at `/api/docs` and health at `/api/v1/health`.

## Workspaces

- `apps/web`: Next.js App Router, Tailwind CSS, Shadcn-style UI, Vitest
- `apps/api`: NestJS REST API, Jest, bcrypt
- `packages/contracts`: shared Zod schemas and API types
- `packages/database`: deliberately empty Phase 2 placeholder
- `packages/ui`: future cross-app UI boundary
- `packages/config`: minimal shared TypeScript configuration

Common commands: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. Run `npx playwright install` before the future browser smoke test.

Development occurs on `develop`; releasable work merges to `main`. Passwords are one-way hashed with `bcrypt.hash()` and checked with `bcrypt.compare()`. They cannot be decrypted and must never be logged. Phase 2 will add PostgreSQL, Drizzle ORM, migrations, and schemas; it has not started.
