CREATE INDEX "roles_active_code_idx" ON "roles" USING btree ("archived_at","code");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");