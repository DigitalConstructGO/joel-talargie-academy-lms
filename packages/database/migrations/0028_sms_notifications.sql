CREATE TYPE "public"."sms_delivery_status" AS ENUM('QUEUED', 'PROCESSING', 'SUCCEEDED', 'RETRY_SCHEDULED', 'FAILED', 'CANCELLED', 'SUPPRESSED');--> statement-breakpoint
CREATE TYPE "public"."sms_attempt_status" AS ENUM('PROCESSING', 'SUCCEEDED', 'TEMPORARY_FAILURE', 'PERMANENT_FAILURE');--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "sms_security" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "sms_learning" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "sms_payments" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "sms_certificates" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sms_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"recipient_phone" text NOT NULL,
	"message_text" text NOT NULL,
	"template_code" text NOT NULL,
	"status" "sms_delivery_status" DEFAULT 'QUEUED' NOT NULL,
	"priority" "notification_priority" DEFAULT 'NORMAL' NOT NULL,
	"deduplication_key" text,
	"related_entity_type" text,
	"related_entity_id" uuid,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"maximum_attempts" integer DEFAULT 3 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"next_attempt_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"provider_message_id" text,
	"provider_log_id" text,
	"failure_code" text,
	"failure_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sms_deliveries_attempts_check" CHECK ("sms_deliveries"."maximum_attempts" > 0)
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sms_delivery_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"worker_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" "sms_attempt_status" DEFAULT 'PROCESSING' NOT NULL,
	"provider_response_code" text,
	"provider_message_id" text,
	"failure_code" text,
	"failure_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sms_delivery_attempts_delivery_number_uq" UNIQUE("delivery_id","attempt_number")
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sms_deliveries" ADD CONSTRAINT "sms_deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sms_delivery_attempts" ADD CONSTRAINT "sms_delivery_attempts_delivery_id_sms_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."sms_deliveries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sms_deliveries_deduplication_key_uq" ON "sms_deliveries" USING btree ("deduplication_key") WHERE "sms_deliveries"."deduplication_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sms_deliveries_claim_idx" ON "sms_deliveries" USING btree ("priority" DESC,"scheduled_at","id") WHERE "sms_deliveries"."status" IN ('QUEUED', 'RETRY_SCHEDULED');--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sms_deliveries_user_created_idx" ON "sms_deliveries" USING btree ("user_id","created_at" DESC,"id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sms_deliveries_status_created_idx" ON "sms_deliveries" USING btree ("status","created_at" DESC,"id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sms_delivery_attempts_delivery_created_idx" ON "sms_delivery_attempts" USING btree ("delivery_id","created_at" DESC,"id");
