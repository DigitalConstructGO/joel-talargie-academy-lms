ALTER TABLE "enrollments" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP INDEX "enrollments_student_status_updated_idx";--> statement-breakpoint
DROP INDEX "enrollments_course_status_idx";--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "enrolled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrollments" ALTER COLUMN "status" SET DATA TYPE text USING "status"::text;--> statement-breakpoint
UPDATE "enrollments" SET "status" = 'PENDING_PAYMENT' WHERE "status" = 'PENDING';--> statement-breakpoint
UPDATE "enrollments" SET "status" = 'ENROLLED', "enrolled_at" = COALESCE("completed_at", "created_at") WHERE "status" = 'ACTIVE';--> statement-breakpoint
DROP TYPE "public"."enrollment_status";--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('PENDING_PAYMENT', 'WAITING_APPROVAL', 'ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ACCESS_REVOKED');--> statement-breakpoint
ALTER TABLE "enrollments" ALTER COLUMN "status" SET DATA TYPE "public"."enrollment_status" USING "status"::"public"."enrollment_status";--> statement-breakpoint
ALTER TABLE "enrollments" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'::"public"."enrollment_status";--> statement-breakpoint
CREATE INDEX enrollments_student_status_updated_idx ON "enrollments" USING btree ("student_id", "status", "updated_at" DESC NULLS LAST, "id");--> statement-breakpoint
CREATE INDEX enrollments_course_status_idx ON "enrollments" USING btree ("course_id", "status");--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "progress_percentage" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "cancelled_by" uuid;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "access_revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "access_revocation_reason" text;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollments_student_created_idx" ON "enrollments" USING btree ("student_id","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "enrollments_course_created_idx" ON "enrollments" USING btree ("course_id","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "enrollments_status_created_idx" ON "enrollments" USING btree ("status","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "enrollments_status_updated_idx" ON "enrollments" USING btree ("status","updated_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "enrollments_capacity_idx" ON "enrollments" USING btree ("course_id","status") WHERE "enrollments"."status" IN ('PENDING_PAYMENT', 'WAITING_APPROVAL', 'ENROLLED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE INDEX "enrollments_cancelled_by_idx" ON "enrollments" USING btree ("cancelled_by");--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_progress_percentage_check" CHECK ("enrollments"."progress_percentage" BETWEEN 0 AND 100);--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_price_snapshot_check" CHECK ("enrollments"."price_at_enrollment" >= 0);--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_discount_snapshot_check" CHECK ("enrollments"."discount_at_enrollment" >= 0);
