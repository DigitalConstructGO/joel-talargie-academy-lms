DROP INDEX IF EXISTS "promo_redemptions_active_code_student_uq";--> statement-breakpoint
CREATE INDEX "promo_redemptions_active_code_student_idx" ON "promo_redemptions" USING btree ("code_id", "student_id") WHERE "promo_redemptions"."status" IN ('RESERVED', 'CONFIRMED') AND "promo_redemptions"."code_id" IS NOT NULL;
