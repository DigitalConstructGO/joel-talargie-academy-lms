-- Promo codes gain an optional cap on the number of distinct students who can
-- redeem them ("first N users" promotions, e.g. limited to the first 50 users).

ALTER TABLE "promo_codes" ADD COLUMN "max_users" integer;--> statement-breakpoint
ALTER TABLE "promo_codes" ADD CONSTRAINT "promo_codes_max_users_check" CHECK ("promo_codes"."max_users" IS NULL OR "promo_codes"."max_users" >= 1);
