ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
DROP INDEX "users_active_idx";--> statement-breakpoint
DROP INDEX "users_status_idx";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" TYPE text USING "status"::text;--> statement-breakpoint
DROP TYPE "public"."user_status";--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'SUSPENDED', 'PENDING', 'PENDING_VERIFICATION', 'ARCHIVED');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" TYPE "public"."user_status" USING "status"::"public"."user_status";--> statement-breakpoint
CREATE INDEX users_status_idx ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX users_active_idx ON "users" USING btree ("id") WHERE "users"."status" = 'ACTIVE' AND "users"."archived_at" IS NULL;--> statement-breakpoint
UPDATE "users" SET "status" = 'PENDING_VERIFICATION' WHERE "status" = 'PENDING';--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "auth_provider" NOT NULL,
	"provider_account_id" text NOT NULL,
	"provider_email" text,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "oauth_accounts_provider_account_uq" UNIQUE("provider","provider_account_id"),
	CONSTRAINT "oauth_accounts_user_provider_uq" UNIQUE("user_id","provider")
);
--> statement-breakpoint
CREATE TABLE "user_notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_security" boolean DEFAULT true NOT NULL,
	"email_learning" boolean DEFAULT true NOT NULL,
	"email_payments" boolean DEFAULT true NOT NULL,
	"email_certificates" boolean DEFAULT true NOT NULL,
	"in_app_learning" boolean DEFAULT true NOT NULL,
	"in_app_payments" boolean DEFAULT true NOT NULL,
	"in_app_certificates" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';--> statement-breakpoint
ALTER TABLE "refresh_sessions" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "refresh_sessions" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "refresh_sessions" ADD COLUMN "last_used_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "oauth_accounts_user_idx" ON "oauth_accounts" USING btree ("user_id");
--> statement-breakpoint
INSERT INTO "oauth_accounts" ("user_id", "provider", "provider_account_id", "provider_email")
SELECT "id", 'GOOGLE', "google_id", "email"
FROM "users"
WHERE "google_id" IS NOT NULL
ON CONFLICT DO NOTHING;
