CREATE TYPE "public"."course_difficulty" AS ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS');--> statement-breakpoint
CREATE TYPE "public"."lesson_type" AS ENUM('VIDEO', 'TEXT', 'DOCUMENT', 'DOWNLOAD', 'EXTERNAL_LINK');--> statement-breakpoint
CREATE TYPE "public"."resource_visibility" AS ENUM('PUBLIC', 'ENROLLED_STUDENTS', 'ADMIN_ONLY');--> statement-breakpoint
ALTER TYPE "public"."course_visibility" ADD VALUE 'UNLISTED';--> statement-breakpoint
CREATE TABLE "course_outcomes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"outcome" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_outcomes_order_uq" UNIQUE("course_id","sort_order")
);
--> statement-breakpoint
CREATE TABLE "course_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"requirement" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_requirements_order_uq" UNIQUE("course_id","sort_order")
);
--> statement-breakpoint
DROP INDEX "categories_active_idx";--> statement-breakpoint
ALTER TABLE "lesson_resources" ALTER COLUMN "storage_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "image_key" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "course_sections" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "course_sections" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "thumbnail_key" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "discount_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "difficulty" "course_difficulty" DEFAULT 'ALL_LEVELS' NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "estimated_duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "certificate_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "enrollment_open_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "enrollment_close_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "capacity" integer;--> statement-breakpoint
ALTER TABLE "lesson_resources" ADD COLUMN "external_url" text;--> statement-breakpoint
ALTER TABLE "lesson_resources" ADD COLUMN "original_file_name" text;--> statement-breakpoint
ALTER TABLE "lesson_resources" ADD COLUMN "mime_type" text;--> statement-breakpoint
ALTER TABLE "lesson_resources" ADD COLUMN "file_size" integer;--> statement-breakpoint
ALTER TABLE "lesson_resources" ADD COLUMN "visibility" "resource_visibility" DEFAULT 'ENROLLED_STUDENTS' NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "lesson_type" "lesson_type" DEFAULT 'TEXT' NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "external_url" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "duration_seconds" integer;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "is_preview" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "course_outcomes" ADD CONSTRAINT "course_outcomes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_requirements" ADD CONSTRAINT "course_requirements_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_parent_sort_idx" ON "categories" USING btree ("parent_id","sort_order","id");--> statement-breakpoint
CREATE INDEX "courses_difficulty_catalog_idx" ON "courses" USING btree ("difficulty","status","visibility");--> statement-breakpoint
CREATE INDEX "lessons_published_idx" ON "lessons" USING btree ("course_id","position","id") WHERE "lessons"."is_published" = true AND "lessons"."archived_at" IS NULL;--> statement-breakpoint
CREATE INDEX categories_active_idx ON "categories" USING btree ("name") WHERE "categories"."is_active" = true AND "categories"."archived_at" IS NULL;
