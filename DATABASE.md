# Database Architecture & Schema Documentation (`packages/database`)

This document provides a comprehensive specification of the database layer for the Joel Talargie Academy LMS. The database tier uses **Neon PostgreSQL** managed via **Drizzle ORM** type-safe schema definitions, SQL migration pipelines, and automated seeding scripts.

---

## Table of Contents

- [1. Architecture & Driver Setup](#1-architecture--driver-setup)
- [2. Schema Entity-Relationship Map](#2-schema-entity-relationship-map)
- [3. Complete Table Specifications](#3-complete-table-specifications)
- [4. Currency & Pricing Standards](#4-currency--pricing-standards)
- [5. Drizzle Migration Workflow](#5-drizzle-migration-workflow)
- [6. Database Seeding & Testing](#6-database-seeding--testing)
- [7. Drizzle Studio & Utilities](#7-drizzle-studio--utilities)

---

## 1. Architecture & Driver Setup

The database package is located in `packages/database`. It connects to Neon PostgreSQL using dual connection strings tailored for production:

```typescript
// 1. Connection Pooling URL (Runtime execution & API server queries)
DATABASE_URL=postgresql://neondb_owner:...@ep-delicate-bonus-...pooler.us-east-2.aws.neon.tech/neondb?sslmode=verify-full

// 2. Direct Connection URL (Migration runner & Drizzle DDL commands)
DATABASE_DIRECT_URL=postgresql://neondb_owner:...@ep-delicate-bonus-....us-east-2.aws.neon.tech/neondb?sslmode=verify-full
```

---

## 2. Schema Entity-Relationship Map

```mermaid
erDiagram
    users ||--o| user_profiles : "has profile"
    users ||--o{ user_sessions : "maintains sessions"
    roles ||--o{ role_permissions : "contains"
    permissions ||--o{ role_permissions : "assigned to"
    categories ||--o{ categories : "parent of"
    categories ||--o{ courses : "groups"
    courses ||--o{ course_sections : "contains"
    course_sections ||--o{ lessons : "contains"
    lessons ||--o{ lesson_resources : "attaches"
    users ||--o{ enrollments : "enrolls in"
    courses ||--o{ enrollments : "has enrolled"
    enrollments ||--o{ lesson_progress : "tracks progress"
    enrollments ||--o{ payments : "paid via"
    enrollments ||--o| certificates : "earns certificate"
```

---

## 3. Complete Table Specifications

### User & Security Domain

| Table Name         | Primary Key | Key Columns                                                  | Purpose                                                 |
| ------------------ | ----------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| `users`            | `id` (UUID) | `email`, `emailNormalized`, `passwordHash`, `status`         | Core user identity & authentication credentials         |
| `user_profiles`    | `id` (UUID) | `userId` (FK), `firstName`, `lastName`, `avatarUrl`, `phone` | Extended student/instructor profile details             |
| `user_sessions`    | `id` (UUID) | `userId` (FK), `tokenHash`, `ipAddress`, `expiresAt`         | Active refresh token session tracking                   |
| `roles`            | `id` (UUID) | `code`, `name`, `description`, `isSystem`                    | System roles (`ADMINISTRATOR`, `INSTRUCTOR`, `STUDENT`) |
| `permissions`      | `id` (UUID) | `code`, `module`, `name`, `description`                      | Fine-grained permission codes (e.g. `courses.create`)   |
| `role_permissions` | Composite   | `roleId` (FK), `permissionId` (FK)                           | Many-to-many role to permission assignment              |

### Academic & Catalog Domain

| Table Name         | Primary Key | Key Columns                                                                       | Purpose                                            |
| ------------------ | ----------- | --------------------------------------------------------------------------------- | -------------------------------------------------- |
| `categories`       | `id` (UUID) | `name`, `slug`, `parentId` (FK), `isActive`, `sortOrder`                          | Category tree hierarchy for course organization    |
| `courses`          | `id` (UUID) | `title`, `slug`, `price`, `currency`, `accessType`, `status`, `visibility`        | Main course catalog records and pricing details    |
| `course_sections`  | `id` (UUID) | `courseId` (FK), `title`, `sortOrder`                                             | Curriculum section modules                         |
| `lessons`          | `id` (UUID) | `sectionId` (FK), `courseId` (FK), `title`, `slug`, `videoUrl`, `durationSeconds` | Individual lesson content items and video metadata |
| `lesson_resources` | `id` (UUID) | `lessonId` (FK), `title`, `fileKey`, `fileSizeBytes`                              | Downloadable lesson attachments (PDFs, ZIPs)       |

### Enrollment, Payment & Learning Domain

| Table Name        | Primary Key | Key Columns                                                                                     | Purpose                                               |
| ----------------- | ----------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `enrollments`     | `id` (UUID) | `studentId` (FK), `courseId` (FK), `status`, `priceAtEnrollment`                                | Student course enrollment state (`ACTIVE`, `PENDING`) |
| `lesson_progress` | `id` (UUID) | `enrollmentId` (FK), `lessonId` (FK), `status`, `progressPercent`                               | Student lesson completion & viewing activity          |
| `payment_methods` | `id` (UUID) | `name`, `code`, `type`, `accountDetails`, `isActive`                                            | Bank transfer & mobile money account configurations   |
| `payments`        | `id` (UUID) | `enrollmentId` (FK), `studentId` (FK), `transactionId`, `submittedAmount`, `currency`, `status` | Manual bank payment receipt verification records      |
| `certificates`    | `id` (UUID) | `enrollmentId` (FK), `studentId` (FK), `certificateNumber`, `verificationToken`, `pdfUrl`       | Verified course completion certificate records        |

### System & Audit Domain

| Table Name          | Primary Key     | Key Columns                                                           | Purpose                                         |
| ------------------- | --------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| `platform_settings` | `key` (varchar) | `value` (JSONB), `updatedBy` (FK), `updatedAt`                        | Dynamic key-value configuration and Landing CMS |
| `activity_logs`     | `id` (UUID)     | `actorId` (FK), `action`, `entityType`, `entityId`, `before`, `after` | Administrative action audit logging             |

---

## 4. Currency & Pricing Standards

- **Primary Currency Default**: All course pricing, payment submissions, and revenue reports default to **ETB** (Ethiopian Birr).
- **Exact Decimal Storage**: Currency amounts (`price`, `discountPrice`, `submittedAmount`) are stored using PostgreSQL `numeric(10, 2)` or `text` to eliminate floating-point rounding errors.

---

## 5. Drizzle Migration Workflow

Database schema definitions are located in `packages/database/src/schema/index.ts`.

### Migration Commands

```bash
# 1. Generate SQL migration files after schema edits
npm run db:generate

# 2. Apply pending migration files to the database
npm run db:migrate

# 3. Check migration integrity and database status
npm run db:check
```

Migration SQL files are stored chronologically under `packages/database/migrations/`.

---

## 6. Database Seeding & Testing

The database package provides automated seed scripts to initialize fresh database instances:

```bash
# Standard DB Seed (Populates roles, permissions, admin account, categories, published courses)
npm run db:seed

# Performance Benchmark Seed (Populates thousands of load-test student records & enrollments)
npm run db:seed:performance
```

---

## 7. Drizzle Studio & Utilities

To visually inspect tables, execute custom queries, or inspect database records via GUI:

```bash
npm run db:studio
```

_Drizzle Studio opens an interactive web GUI at `http://localhost:4983`._
