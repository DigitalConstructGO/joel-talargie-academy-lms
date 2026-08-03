CREATE TYPE "public"."email_attempt_status" AS ENUM('PROCESSING', 'SUCCEEDED', 'TEMPORARY_FAILURE', 'PERMANENT_FAILURE');--> statement-breakpoint
CREATE TYPE "public"."email_delivery_status" AS ENUM('QUEUED', 'PROCESSING', 'SENT', 'RETRY_SCHEDULED', 'FAILED', 'CANCELLED', 'SUPPRESSED');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TABLE "email_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"template_code" text NOT NULL,
	"template_version" integer NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"subject_snapshot" text NOT NULL,
	"text_body_snapshot" text NOT NULL,
	"html_body_snapshot" text NOT NULL,
	"status" "email_delivery_status" DEFAULT 'QUEUED' NOT NULL,
	"priority" "notification_priority" DEFAULT 'NORMAL' NOT NULL,
	"deduplication_key" text,
	"related_entity_type" text,
	"related_entity_id" uuid,
	"scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"maximum_attempts" integer DEFAULT 5 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"next_attempt_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"locked_by" text,
	"provider_message_id" text,
	"failure_code" text,
	"failure_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_deliveries_attempts_check" CHECK ("email_deliveries"."maximum_attempts" > 0)
);
--> statement-breakpoint
CREATE TABLE "email_delivery_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"worker_id" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"status" "email_attempt_status" DEFAULT 'PROCESSING' NOT NULL,
	"provider_response_code" text,
	"provider_message_id" text,
	"failure_code" text,
	"failure_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_delivery_attempts_delivery_number_uq" UNIQUE("delivery_id","attempt_number")
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"subject_template" text NOT NULL,
	"html_template" text NOT NULL,
	"text_template" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_system" boolean DEFAULT true NOT NULL,
	"description" text,
	"created_by" uuid,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_code_version_locale_uq" UNIQUE("code","version","locale"),
	CONSTRAINT "email_templates_version_check" CHECK ("email_templates"."version" > 0),
	CONSTRAINT "email_templates_code_check" CHECK ("email_templates"."code" ~ '^[A-Z][A-Z0-9_]{2,79}$'),
	CONSTRAINT "email_templates_locale_check" CHECK ("email_templates"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$')
);
--> statement-breakpoint
CREATE TABLE "notification_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_id" uuid,
	"email_delivery_id" uuid,
	"event_type" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"related_entity_type" text,
	"related_entity_id" uuid,
	"safe_metadata_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "notifications_unread_in_app_idx";--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "type" text DEFAULT 'GENERAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "action_url" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "related_entity_type" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "related_entity_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "priority" "notification_priority" DEFAULT 'NORMAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "deduplication_key" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "email_deliveries" ADD CONSTRAINT "email_deliveries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_delivery_attempts" ADD CONSTRAINT "email_delivery_attempts_delivery_id_email_deliveries_id_fk" FOREIGN KEY ("delivery_id") REFERENCES "public"."email_deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_email_delivery_id_email_deliveries_id_fk" FOREIGN KEY ("email_delivery_id") REFERENCES "public"."email_deliveries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "email_deliveries_deduplication_key_uq" ON "email_deliveries" USING btree ("deduplication_key") WHERE "email_deliveries"."deduplication_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "email_deliveries_claim_idx" ON "email_deliveries" USING btree ("priority" DESC NULLS LAST,"scheduled_at","id") WHERE "email_deliveries"."status" IN ('QUEUED', 'RETRY_SCHEDULED');--> statement-breakpoint
CREATE INDEX "email_deliveries_user_created_idx" ON "email_deliveries" USING btree ("user_id","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "email_deliveries_status_created_idx" ON "email_deliveries" USING btree ("status","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "email_deliveries_template_created_idx" ON "email_deliveries" USING btree ("template_code","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "email_delivery_attempts_delivery_created_idx" ON "email_delivery_attempts" USING btree ("delivery_id","created_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_templates_active_code_locale_uq" ON "email_templates" USING btree ("code","locale") WHERE "email_templates"."is_active" = true AND "email_templates"."archived_at" IS NULL;--> statement-breakpoint
CREATE INDEX "email_templates_catalog_idx" ON "email_templates" USING btree ("code","locale","version" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notification_events_user_created_idx" ON "notification_events" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notification_events_delivery_created_idx" ON "notification_events" USING btree ("email_delivery_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_deduplication_key_uq" ON "notifications" USING btree ("deduplication_key") WHERE "notifications"."deduplication_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "notifications_user_type_priority_idx" ON "notifications" USING btree ("user_id","type","priority","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_unread_active_in_app_idx" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST,"id") WHERE "notifications"."read_at" IS NULL AND "notifications"."archived_at" IS NULL AND "notifications"."channel" = 'IN_APP';
