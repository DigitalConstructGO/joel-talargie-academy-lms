CREATE TYPE "public"."promo_affiliate_status" AS ENUM('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED');--> statement-breakpoint
CREATE TYPE "public"."promo_campaign_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."promo_campaign_type" AS ENUM('PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'FREE_COURSE', 'SCHOLARSHIP', 'BUNDLE_DISCOUNT', 'REFERRAL_REWARD', 'AFFILIATE_DISCOUNT', 'CORPORATE_DISCOUNT', 'PARTNER_DISCOUNT', 'EVENT_PROMOTION', 'FLASH_SALE', 'SEASONAL_PROMOTION', 'FIRST_STUDENT_DISCOUNT', 'BIRTHDAY_COUPON', 'MANUAL_COUPON', 'AUTOMATIC_PROMOTION');--> statement-breakpoint
CREATE TYPE "public"."promo_code_status" AS ENUM('ACTIVE', 'PAUSED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."promo_code_type" AS ENUM('MANUAL', 'REFERRAL', 'AFFILIATE', 'CORPORATE', 'UNIVERSITY_PARTNER', 'SYSTEM_GENERATED');--> statement-breakpoint
CREATE TYPE "public"."promo_discount_type" AS ENUM('PERCENTAGE', 'FIXED', 'FREE');--> statement-breakpoint
CREATE TYPE "public"."promo_redemption_status" AS ENUM('RESERVED', 'CONFIRMED', 'CANCELLED', 'FAILED');--> statement-breakpoint
CREATE TABLE "promo_affiliates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"status" "promo_affiliate_status" DEFAULT 'PENDING' NOT NULL,
	"commission_type" "promo_discount_type" DEFAULT 'PERCENTAGE' NOT NULL,
	"commission_rate" numeric(5, 2),
	"commission_fixed_amount" numeric(12, 2),
	"total_clicks" integer DEFAULT 0 NOT NULL,
	"total_enrollments" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total_commission" numeric(14, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_affiliates_commission_rate_check" CHECK ("promo_affiliates"."commission_rate" IS NULL OR ("promo_affiliates"."commission_rate" >= 0 AND "promo_affiliates"."commission_rate" <= 100)),
	CONSTRAINT "promo_affiliates_commission_fixed_check" CHECK ("promo_affiliates"."commission_fixed_amount" IS NULL OR "promo_affiliates"."commission_fixed_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "promo_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "promo_campaign_type" NOT NULL,
	"status" "promo_campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"discount_type" "promo_discount_type" NOT NULL,
	"discount_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"max_discount_amount" numeric(12, 2),
	"minimum_purchase_amount" numeric(12, 2),
	"is_automatic" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone,
	"max_redemptions" integer,
	"max_redemptions_per_user" integer DEFAULT 1 NOT NULL,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"allowed_roles" text[],
	"allowed_countries" text[],
	"allowed_email_domains" text[],
	"allowed_payment_methods" text[],
	"allowed_days_of_week" integer[],
	"allowed_hour_start" integer,
	"allowed_hour_end" integer,
	"new_students_only" boolean DEFAULT false NOT NULL,
	"restrict_to_instructor_id" uuid,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"total_seats" integer,
	"seats_used" integer DEFAULT 0 NOT NULL,
	"sponsor_name" text,
	"sponsor_notes" text,
	"referrer_reward_type" "promo_discount_type",
	"referrer_reward_value" numeric(12, 2),
	"affiliate_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_campaigns_discount_value_check" CHECK ("promo_campaigns"."discount_value" >= 0),
	CONSTRAINT "promo_campaigns_percentage_bounds_check" CHECK ("promo_campaigns"."discount_type" <> 'PERCENTAGE' OR "promo_campaigns"."discount_value" <= 100),
	CONSTRAINT "promo_campaigns_window_check" CHECK ("promo_campaigns"."ends_at" IS NULL OR "promo_campaigns"."ends_at" > "promo_campaigns"."starts_at"),
	CONSTRAINT "promo_campaigns_seats_check" CHECK ("promo_campaigns"."total_seats" IS NULL OR "promo_campaigns"."seats_used" <= "promo_campaigns"."total_seats"),
	CONSTRAINT "promo_campaigns_hour_bounds_check" CHECK (("promo_campaigns"."allowed_hour_start" IS NULL AND "promo_campaigns"."allowed_hour_end" IS NULL) OR ("promo_campaigns"."allowed_hour_start" BETWEEN 0 AND 23 AND "promo_campaigns"."allowed_hour_end" BETWEEN 0 AND 23))
);
--> statement-breakpoint
CREATE TABLE "promo_category_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_category_rules_campaign_category_uq" UNIQUE("campaign_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"code" text NOT NULL,
	"code_type" "promo_code_type" DEFAULT 'MANUAL' NOT NULL,
	"status" "promo_code_status" DEFAULT 'ACTIVE' NOT NULL,
	"owner_user_id" uuid,
	"affiliate_id" uuid,
	"is_single_use" boolean DEFAULT false NOT NULL,
	"max_redemptions" integer,
	"max_redemptions_per_user" integer,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_single_use_check" CHECK (NOT "promo_codes"."is_single_use" OR "promo_codes"."max_redemptions" = 1),
	CONSTRAINT "promo_codes_window_check" CHECK ("promo_codes"."valid_from" IS NULL OR "promo_codes"."valid_until" IS NULL OR "promo_codes"."valid_until" > "promo_codes"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "promo_course_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_course_rules_campaign_course_uq" UNIQUE("campaign_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "promo_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"code_id" uuid,
	"student_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"enrollment_id" uuid,
	"payment_id" uuid,
	"status" "promo_redemption_status" DEFAULT 'RESERVED' NOT NULL,
	"original_price" numeric(12, 2) NOT NULL,
	"discount_amount" numeric(12, 2) NOT NULL,
	"final_price" numeric(12, 2) NOT NULL,
	"currency" text NOT NULL,
	"referral_owner_id" uuid,
	"referrer_reward_amount" numeric(12, 2),
	"affiliate_id" uuid,
	"ip_address" text,
	"user_agent" text,
	"device_type" text,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_redemptions_discount_check" CHECK ("promo_redemptions"."discount_amount" >= 0),
	CONSTRAINT "promo_redemptions_final_price_check" CHECK ("promo_redemptions"."final_price" >= 0),
	CONSTRAINT "promo_redemptions_final_price_bounds_check" CHECK ("promo_redemptions"."final_price" <= "promo_redemptions"."original_price")
);
--> statement-breakpoint
CREATE TABLE "promo_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"code_id" uuid,
	"actor_id" uuid,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_user_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_user_rules_campaign_user_uq" UNIQUE("campaign_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "promo_affiliates" ADD CONSTRAINT "promo_affiliates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_affiliates" ADD CONSTRAINT "promo_affiliates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_campaigns" ADD CONSTRAINT "promo_campaigns_restrict_to_instructor_id_users_id_fk" FOREIGN KEY ("restrict_to_instructor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_campaigns" ADD CONSTRAINT "promo_campaigns_affiliate_id_promo_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."promo_affiliates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_campaigns" ADD CONSTRAINT "promo_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_category_rules" ADD CONSTRAINT "promo_category_rules_campaign_id_promo_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."promo_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_category_rules" ADD CONSTRAINT "promo_category_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_campaign_id_promo_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."promo_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_affiliate_id_promo_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."promo_affiliates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_course_rules" ADD CONSTRAINT "promo_course_rules_campaign_id_promo_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."promo_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_course_rules" ADD CONSTRAINT "promo_course_rules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_campaign_id_promo_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."promo_campaigns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_code_id_promo_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."promo_codes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_referral_owner_id_users_id_fk" FOREIGN KEY ("referral_owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_affiliate_id_promo_affiliates_id_fk" FOREIGN KEY ("affiliate_id") REFERENCES "public"."promo_affiliates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_usage_logs" ADD CONSTRAINT "promo_usage_logs_campaign_id_promo_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."promo_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_usage_logs" ADD CONSTRAINT "promo_usage_logs_code_id_promo_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."promo_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_usage_logs" ADD CONSTRAINT "promo_usage_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_user_rules" ADD CONSTRAINT "promo_user_rules_campaign_id_promo_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."promo_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_user_rules" ADD CONSTRAINT "promo_user_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "promo_affiliates_user_idx" ON "promo_affiliates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "promo_affiliates_status_idx" ON "promo_affiliates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "promo_campaigns_status_idx" ON "promo_campaigns" USING btree ("status","starts_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "promo_campaigns_automatic_idx" ON "promo_campaigns" USING btree ("is_automatic","status","priority" DESC NULLS LAST) WHERE "promo_campaigns"."is_automatic" = true AND "promo_campaigns"."archived_at" IS NULL;--> statement-breakpoint
CREATE INDEX "promo_campaigns_type_idx" ON "promo_campaigns" USING btree ("type");--> statement-breakpoint
CREATE INDEX "promo_campaigns_window_idx" ON "promo_campaigns" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "promo_campaigns_affiliate_idx" ON "promo_campaigns" USING btree ("affiliate_id");--> statement-breakpoint
CREATE INDEX "promo_category_rules_category_idx" ON "promo_category_rules" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_codes_code_uq" ON "promo_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "promo_codes_campaign_idx" ON "promo_codes" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "promo_codes_owner_idx" ON "promo_codes" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "promo_codes_affiliate_idx" ON "promo_codes" USING btree ("affiliate_id");--> statement-breakpoint
CREATE INDEX "promo_codes_status_idx" ON "promo_codes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "promo_course_rules_course_idx" ON "promo_course_rules" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "promo_redemptions_campaign_idx" ON "promo_redemptions" USING btree ("campaign_id","redeemed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "promo_redemptions_code_idx" ON "promo_redemptions" USING btree ("code_id");--> statement-breakpoint
CREATE INDEX "promo_redemptions_student_idx" ON "promo_redemptions" USING btree ("student_id","redeemed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "promo_redemptions_course_idx" ON "promo_redemptions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "promo_redemptions_referral_owner_idx" ON "promo_redemptions" USING btree ("referral_owner_id");--> statement-breakpoint
CREATE INDEX "promo_redemptions_affiliate_idx" ON "promo_redemptions" USING btree ("affiliate_id");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_redemptions_active_code_student_uq" ON "promo_redemptions" USING btree ("code_id","student_id") WHERE "promo_redemptions"."status" IN ('RESERVED', 'CONFIRMED') AND "promo_redemptions"."code_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "promo_usage_logs_campaign_idx" ON "promo_usage_logs" USING btree ("campaign_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "promo_usage_logs_code_idx" ON "promo_usage_logs" USING btree ("code_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "promo_usage_logs_action_idx" ON "promo_usage_logs" USING btree ("action","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "promo_user_rules_user_idx" ON "promo_user_rules" USING btree ("user_id");