# Architecture overview

The system is a TypeScript npm-workspace modular monolith. Next.js owns the browser interface, NestJS exposes a versioned REST API, and `@joel-academy/contracts` is the single source for wire contracts. Feature-based Nest modules will preserve clean boundaries. Phase 1 has no persistence layer.

## Frontend state

Zustand manages limited, non-persisted client-side interface state. Native `fetch` communicates with the REST API and health requests retain `cache: "no-store"`; Zustand does not cache server responses. PostgreSQL remains the future source of truth for business data. Passwords, refresh tokens, payment details, and other sensitive authentication information are never stored in Zustand.

The Phase 1 frontend stack is Next.js, React, TypeScript, Tailwind CSS, Shadcn UI, Zustand, React Hook Form, Zod, TanStack React Table, Recharts, Lucide React, Sonner, and native fetch.

## Backend email

Nodemailer provides server-only SMTP delivery through one reusable transporter owned by the NestJS `MailModule`. Future authentication, payment, notification, and certificate modules will call its exported `MailService`. SMTP configuration is never exposed through the API or browser environment. Failed-email retries will use a future PostgreSQL-backed job system; Redis and BullMQ are not used.

The Phase 1 backend stack is Node.js, NestJS, TypeScript, REST, Swagger/OpenAPI, bcrypt, Nodemailer, Passport/JWT foundations, Class Validator, Class Transformer, Zod, Helmet, Multer, AWS S3 SDK, PDFKit, QRCode, and ExcelJS.
