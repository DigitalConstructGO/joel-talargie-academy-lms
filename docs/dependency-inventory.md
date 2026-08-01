# Dependency inventory

- Root development tooling: TypeScript, ESLint, Prettier, Husky, lint-staged, concurrently, cross-env, rimraf, tsx, and Playwright.
- `apps/web` runtime: Next.js/React, Zod/forms, Lucide and UI utilities, Sonner, date-fns, TanStack Table, Recharts, DOMPurify. Development: TypeScript, ESLint, Vitest, jsdom, Testing Library.
- `apps/api` runtime: NestJS modules, validation/configuration, Passport/JWT foundations, bcrypt, HTTP security, mail/upload/storage/certificate/report packages. Development: Nest tooling, TypeScript, Jest, Supertest and type packages.
- `packages/contracts`: runtime Zod; Vitest and TypeScript development tooling.
- `packages/database`, `packages/ui`: TypeScript only; no runtime dependencies.
- `packages/config`: no dependencies.

Future-facing API packages are installed but have no business implementation in Phase 1.
