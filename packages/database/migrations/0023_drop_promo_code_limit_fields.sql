-- Simplify promo codes by removing the four per-code limit fields. The only
-- remaining cap is the optional distinct-student limit (max_users). The
-- single_use_check constraint referenced max_redemptions, so it is dropped
-- along with the columns.

ALTER TABLE "promo_codes" DROP CONSTRAINT "promo_codes_single_use_check";--> statement-breakpoint
ALTER TABLE "promo_codes" DROP COLUMN "max_discount_amount";--> statement-breakpoint
ALTER TABLE "promo_codes" DROP COLUMN "minimum_purchase_amount";--> statement-breakpoint
ALTER TABLE "promo_codes" DROP COLUMN "max_redemptions";--> statement-breakpoint
ALTER TABLE "promo_codes" DROP COLUMN "max_redemptions_per_user";
