-- Course pricing is presented in Ethiopian Birr across the whole platform.
-- Normalize stored course currency to ETB and lock the column default so any
-- future insert that omits `currency` is ETB by default.
ALTER TABLE "courses" ALTER COLUMN "currency" SET DEFAULT 'ETB';--> statement-breakpoint
UPDATE "courses" SET "currency" = 'ETB' WHERE "currency" IS NOT NULL AND "currency" <> 'ETB';--> statement-breakpoint
-- Course ownership: a non-admin may manage (update/publish/delete/restore)
-- only the courses they created. Give the instructor role the delete/restore
-- permissions so instructors can remove their own courses.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r
JOIN "permissions" p ON p."code" IN ('courses.archive', 'courses.restore')
WHERE r."code" = 'INSTRUCTOR'
ON CONFLICT DO NOTHING;--> statement-breakpoint
-- Grant the content-manager role explicit global course-management authority
-- so catalog managers keep managing every course now that ownership checks
-- are enforced for non-admins.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r
JOIN "permissions" p ON p."code" = 'courses.manage_all'
WHERE r."code" = 'CONTENT_MANAGER'
ON CONFLICT DO NOTHING;
