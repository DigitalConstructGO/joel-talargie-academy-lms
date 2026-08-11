CREATE TYPE "public"."report_export_format" AS ENUM('CSV', 'XLSX');--> statement-breakpoint
CREATE TYPE "public"."report_export_status" AS ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "report_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requested_by" uuid NOT NULL,
	"report_type" text NOT NULL,
	"format" "report_export_format" NOT NULL,
	"status" "report_export_status" DEFAULT 'QUEUED' NOT NULL,
	"filters_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"selected_columns_json" jsonb,
	"sort_json" jsonb,
	"locale" text DEFAULT 'en' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"row_count" integer,
	"file_storage_key" text,
	"original_file_name" text,
	"mime_type" text,
	"file_size" integer,
	"checksum" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"maximum_attempts" integer DEFAULT 3 NOT NULL,
	"failure_code" text,
	"failure_message" text,
	"deduplication_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "report_exports_attempts_check" CHECK ("report_exports"."maximum_attempts" > 0 AND "report_exports"."attempt_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "report_exports_requester_created_idx" ON "report_exports" USING btree ("requested_by","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "report_exports_status_created_idx" ON "report_exports" USING btree ("status","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "report_exports_expiry_idx" ON "report_exports" USING btree ("status","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "report_exports_active_dedup_uq" ON "report_exports" USING btree ("deduplication_key") WHERE "report_exports"."deduplication_key" IS NOT NULL AND "report_exports"."status" IN ('QUEUED','PROCESSING');