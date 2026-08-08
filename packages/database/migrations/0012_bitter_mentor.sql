ALTER TABLE "certificates" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP INDEX "certificates_enrollment_status_idx";--> statement-breakpoint
DROP INDEX "certificates_generated_idx";--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "status" TYPE text USING "status"::text;--> statement-breakpoint
DROP TYPE "public"."certificate_status";--> statement-breakpoint
CREATE TYPE "public"."certificate_status" AS ENUM('PENDING', 'GENERATED', 'FAILED', 'REVOKED');--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "status" TYPE "public"."certificate_status" USING "status"::"public"."certificate_status";--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."certificate_status";--> statement-breakpoint
CREATE INDEX certificates_enrollment_status_idx ON "certificates" USING btree ("enrollment_id", "status");--> statement-breakpoint
CREATE INDEX certificates_generated_idx ON "certificates" USING btree ("issued_at" DESC NULLS LAST, "id") WHERE "certificates"."status" = 'GENERATED' AND "certificates"."revoked_at" IS NULL;--> statement-breakpoint
CREATE TABLE "certificate_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"storage_key" text NOT NULL,
	"original_file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"checksum" text NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"generated_by" uuid,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificate_files_certificate_version_uq" UNIQUE("certificate_id","version"),
	CONSTRAINT "certificate_files_version_check" CHECK ("certificate_files"."version" > 0),
	CONSTRAINT "certificate_files_size_check" CHECK ("certificate_files"."file_size" > 0)
);
--> statement-breakpoint
ALTER TABLE "background_jobs" ADD COLUMN "locked_by" text;--> statement-breakpoint
ALTER TABLE "background_jobs" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "certificate_events" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "certificate_events" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "certificate_templates" ADD COLUMN "template_storage_key" text;--> statement-breakpoint
ALTER TABLE "certificate_templates" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "certificate_templates" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "certificate_templates" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "completion_date_snapshot" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "template_name_snapshot" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "template_version_snapshot" integer;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "pdf_storage_key" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "generated_by" uuid;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "generation_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "pdf_checksum" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "pdf_file_size" integer;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "pdf_mime_type" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "failure_code" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "failure_message" text;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "last_generation_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "revocation_reason" text;--> statement-breakpoint
UPDATE "certificates" AS certificate
SET "completion_date_snapshot" = enrollment."completed_at",
    "template_name_snapshot" = template."name",
    "template_version_snapshot" = template."version",
    "generated_at" = certificate."issued_at",
    "pdf_mime_type" = CASE WHEN certificate."issued_at" IS NOT NULL THEN 'application/pdf' ELSE NULL END
FROM "enrollments" AS enrollment, "certificate_templates" AS template
WHERE enrollment."id" = certificate."enrollment_id"
  AND template."id" = certificate."template_id";--> statement-breakpoint
ALTER TABLE "certificate_files" ADD CONSTRAINT "certificate_files_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_files" ADD CONSTRAINT "certificate_files_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificate_files_one_current_uq" ON "certificate_files" USING btree ("certificate_id") WHERE "certificate_files"."is_current" = true;--> statement-breakpoint
CREATE INDEX "certificate_files_certificate_generated_idx" ON "certificate_files" USING btree ("certificate_id","generated_at" DESC NULLS LAST,"id");--> statement-breakpoint
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "certificate_templates_one_default_uq" ON "certificate_templates" USING btree ("is_default") WHERE "certificate_templates"."is_default" = true AND "certificate_templates"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "certificates_active_enrollment_uq" ON "certificates" USING btree ("enrollment_id") WHERE "certificates"."status" <> 'REVOKED';--> statement-breakpoint
CREATE INDEX "certificates_status_updated_idx" ON "certificates" USING btree ("status","updated_at" DESC NULLS LAST,"id");
