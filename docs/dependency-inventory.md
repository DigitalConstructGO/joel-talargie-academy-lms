# Dependency inventory

- Root development tooling: TypeScript, ESLint, Prettier, Husky, lint-staged, concurrently, cross-env, rimraf, tsx, and Playwright.
- `apps/web` runtime: Next.js/React, Zod/forms, Lucide and UI utilities, Sonner, date-fns, TanStack Table, Recharts, DOMPurify, and **Zustand**. Zustand is lightweight UI-state management only; it does not cache APIs or permanently store business data. Development: TypeScript, ESLint, Vitest, jsdom, Testing Library.
- `apps/api` runtime: NestJS modules, validation/configuration, Passport/JWT foundations, bcrypt, HTTP security, upload/storage/certificate/report packages, and **Nodemailer** for the SMTP transactional-email foundation. Development: Nest tooling, TypeScript, Jest, Supertest, and **@types/nodemailer** for Nodemailer TypeScript definitions.
- `packages/contracts`: runtime Zod; Vitest and TypeScript development tooling.
- `packages/database`, `packages/ui`: TypeScript only; no runtime dependencies.
- `packages/config`: no dependencies.

Future-facing API packages are installed but have no business implementation in Phase 1.

| Package             | Workspace  | Type        | Purpose                                                                   |
| ------------------- | ---------- | ----------- | ------------------------------------------------------------------------- |
| `zustand`           | `apps/web` | Runtime     | Lightweight frontend UI state; not API caching or permanent business data |
| `nodemailer`        | `apps/api` | Runtime     | SMTP transactional-email foundation                                       |
| `@types/nodemailer` | `apps/api` | Development | TypeScript definitions for Nodemailer                                     |
