ALTER TABLE "promo_redemptions" ADD COLUMN "affiliate_commission_amount" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD COLUMN "approved_by" uuid;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD COLUMN "approval_decision_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;