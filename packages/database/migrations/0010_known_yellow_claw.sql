ALTER TABLE "background_jobs" ADD COLUMN "deduplication_key" text;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN "last_position_seconds" integer;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD COLUMN "first_opened_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "background_jobs_deduplication_key_uq" ON "background_jobs" USING btree ("deduplication_key") WHERE "background_jobs"."deduplication_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "lesson_progress_completed_idx" ON "lesson_progress" USING btree ("completed_at" DESC NULLS LAST,"id") WHERE "lesson_progress"."status" = 'COMPLETED';--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_position_check" CHECK ("lesson_progress"."last_position_seconds" IS NULL OR "lesson_progress"."last_position_seconds" >= 0);--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_percent_check" CHECK ("lesson_progress"."progress_percent" BETWEEN 0 AND 100);