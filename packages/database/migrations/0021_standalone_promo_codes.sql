-- Promo codes become a standalone discount entity. Promo campaigns are removed.
-- Discount/eligibility fields move from promo_campaigns onto promo_codes, and the
-- per-campaign rule tables are replaced by per-code rule tables. The referral and
-- approval flows on promo_redemptions are removed.

ALTER TABLE "promo_codes" ADD COLUMN "discount_type" "promo_discount_type" DEFAULT 'PERCENTAGE';--> statement-breakpoint
ALTER TABLE "promo_codes" ADD COLUMN "discount_value" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "promo_codes" ADD COLUMN "max_discount_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "promo_codes" ADD COLUMN "minimum_purchase_amount" numeric(12, 2);--> statement-breakpoint
UPDATE "promo_codes" AS c
SET
	"discount_type" = cam."discount_type",
	"discount_value" = cam."discount_value",
	"max_discount_amount" = cam."max_discount_amount",
	"minimum_purchase_amount" = cam."minimum_purchase_amount"
FROM "promo_campaigns" AS cam
WHERE c."campaign_id" = cam."id";--> statement-breakpoint
UPDATE "promo_codes" AS c
SET
	"valid_from" = cam."starts_at",
	"valid_until" = cam."ends_at"
FROM "promo_campaigns" AS cam
WHERE c."campaign_id" = cam."id"
	AND c."valid_from" IS NULL
	AND c."valid_until" IS NULL;--> statement-breakpoint
ALTER TABLE "promo_codes" ALTER COLUMN "discount_type" SET DEFAULT 'PERCENTAGE';--> statement-breakpoint
ALTER TABLE "promo_codes" ALTER COLUMN "discount_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "promo_codes" ALTER COLUMN "discount_value" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "promo_codes" ALTER COLUMN "discount_value" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_discount_value_check" CHECK ("promo_codes"."discount_value" >= 0);--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_percentage_bounds_check" CHECK ("promo_codes"."discount_type" <> 'PERCENTAGE' OR "promo_codes"."discount_value" <= 100);--> statement-breakpoint
CREATE INDEX "promo_codes_valid_window_idx" ON "promo_codes" USING btree ("valid_from","valid_until");--> statement-breakpoint
CREATE TABLE "promo_code_course_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "promo_code_category_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "promo_code_user_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
INSERT INTO "promo_code_course_rules" ("code_id", "course_id", "created_at")
SELECT DISTINCT c."id", r."course_id", r."created_at"
FROM "promo_course_rules" r
JOIN "promo_codes" c ON c."campaign_id" = r."campaign_id";--> statement-breakpoint
INSERT INTO "promo_code_category_rules" ("code_id", "category_id", "created_at")
SELECT DISTINCT c."id", r."category_id", r."created_at"
FROM "promo_category_rules" r
JOIN "promo_codes" c ON c."campaign_id" = r."campaign_id";--> statement-breakpoint
INSERT INTO "promo_code_user_rules" ("code_id", "user_id", "created_at")
SELECT DISTINCT c."id", r."user_id", r."created_at"
FROM "promo_user_rules" r
JOIN "promo_codes" c ON c."campaign_id" = r."campaign_id";--> statement-breakpoint
ALTER TABLE "promo_code_course_rules" ADD CONSTRAINT "promo_code_course_rules_code_id_promo_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_course_rules" ADD CONSTRAINT "promo_code_course_rules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_category_rules" ADD CONSTRAINT "promo_code_category_rules_code_id_promo_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_category_rules" ADD CONSTRAINT "promo_code_category_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_user_rules" ADD CONSTRAINT "promo_code_user_rules_code_id_promo_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_user_rules" ADD CONSTRAINT "promo_code_user_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "promo_code_course_rules_code_course_uq" ON "promo_code_course_rules" USING btree ("code_id","course_id");--> statement-breakpoint
CREATE INDEX "promo_code_course_rules_course_idx" ON "promo_code_course_rules" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_code_category_rules_code_category_uq" ON "promo_code_category_rules" USING btree ("code_id","category_id");--> statement-breakpoint
CREATE INDEX "promo_code_category_rules_category_idx" ON "promo_code_category_rules" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_code_user_rules_code_user_uq" ON "promo_code_user_rules" USING btree ("code_id","user_id");--> statement-breakpoint
CREATE INDEX "promo_code_user_rules_user_idx" ON "promo_code_user_rules" USING btree ("user_id");--> statement-breakpoint
DELETE FROM "promo_redemptions" WHERE "code_id" IS NULL;--> statement-breakpoint
DELETE FROM "promo_usage_logs" WHERE "code_id" IS NULL;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ALTER COLUMN "code_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';--> statement-breakpoint
DROP INDEX IF EXISTS "promo_redemptions_referral_owner_idx";--> statement-breakpoint
ALTER TABLE "promo_redemptions" DROP CONSTRAINT IF EXISTS "promo_redemptions_referral_owner_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "promo_redemptions" DROP COLUMN "referral_owner_id";--> statement-breakpoint
ALTER TABLE "promo_redemptions" DROP COLUMN "referrer_reward_amount";--> statement-breakpoint
ALTER TABLE "promo_redemptions" DROP CONSTRAINT IF EXISTS "promo_redemptions_approved_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "promo_redemptions" DROP COLUMN "approved_by";--> statement-breakpoint
ALTER TABLE "promo_redemptions" DROP COLUMN "approval_decision_at";--> statement-breakpoint
ALTER TABLE "promo_redemptions" DROP COLUMN "rejection_reason";--> statement-breakpoint
DROP INDEX IF EXISTS "promo_redemptions_campaign_idx";--> statement-breakpoint
ALTER TABLE "promo_redemptions" DROP CONSTRAINT IF EXISTS "promo_redemptions_campaign_id_promo_campaigns_id_fk";--> statement-breakpoint
ALTER TABLE "promo_redemptions" DROP COLUMN "campaign_id";--> statement-breakpoint
DROP INDEX IF EXISTS "promo_usage_logs_campaign_idx";--> statement-breakpoint
ALTER TABLE "promo_usage_logs" DROP CONSTRAINT IF EXISTS "promo_usage_logs_campaign_id_promo_campaigns_id_fk";--> statement-breakpoint
ALTER TABLE "promo_usage_logs" DROP COLUMN "campaign_id";--> statement-breakpoint
DROP INDEX IF EXISTS "promo_codes_campaign_idx";--> statement-breakpoint
ALTER TABLE "promo_codes" DROP CONSTRAINT IF EXISTS "promo_codes_campaign_id_promo_campaigns_id_fk";--> statement-breakpoint
ALTER TABLE "promo_codes" DROP COLUMN "campaign_id";--> statement-breakpoint
DROP TABLE "promo_user_rules";--> statement-breakpoint
DROP TABLE "promo_course_rules";--> statement-breakpoint
DROP TABLE "promo_category_rules";--> statement-breakpoint
DROP TABLE "promo_campaigns";--> statement-breakpoint
DROP TYPE IF EXISTS "promo_campaign_type";--> statement-breakpoint
DROP TYPE IF EXISTS "promo_campaign_status";
