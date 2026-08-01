# Backend architecture

The NestJS API is a modular monolith. Requests flow from controllers to application services to repositories, then through Drizzle ORM and the single Neon PostgreSQL pool. Controllers parse transport input and return results; they never import Drizzle, execute SQL, or own business rules. Services validate and orchestrate use cases. Repositories own queries, locks, transactions, persistence pagination, and soft deletion.

Nest dependency injection supplies configuration, database, mail, audit, jobs, and storage boundaries. Shared infrastructure lives under `src/common`; reusable feature foundations live under `src/modules`. Authentication, courses, payments, certificates, notifications, and other business behavior remain Phase 3 work.
