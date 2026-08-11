CREATE INDEX "email_verification_tokens_user_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "login_attempts_user_idx" ON "login_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "promo_redemptions_enrollment_idx" ON "promo_redemptions" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "promo_redemptions_payment_idx" ON "promo_redemptions" USING btree ("payment_id");