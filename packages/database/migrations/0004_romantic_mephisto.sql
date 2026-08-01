CREATE TYPE "public"."auth_provider" AS ENUM('LOCAL', 'GOOGLE');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider" "auth_provider" DEFAULT 'LOCAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "users" SET "email_verified" = true WHERE "status" = 'ACTIVE';--> statement-breakpoint
CREATE UNIQUE INDEX "users_google_id_uidx" ON "users" USING btree ("google_id");
