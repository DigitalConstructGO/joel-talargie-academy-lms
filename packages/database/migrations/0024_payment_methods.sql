-- Add a DB-backed payment-methods catalog so checkout and admin surfaces stop
-- relying on hardcoded frontend constants. Each method carries public display
-- info (`instructions`) and private admin-only configuration (`config`) which is
-- never exposed to students. Payments now record which method was used.

CREATE TYPE "payment_method_type" AS ENUM ('MOBILE_MONEY','BANK_TRANSFER','CARD','OTHER');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "payment_method_type" DEFAULT 'OTHER' NOT NULL,
	"instructions" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_method_id" uuid;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_methods_code_uq" ON "payment_methods" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_methods_active_sort_idx" ON "payment_methods" USING btree ("is_active","sort_order","name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_methods_type_idx" ON "payment_methods" USING btree ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_payment_method_idx" ON "payments" USING btree ("payment_method_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE restrict;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null;--> statement-breakpoint
INSERT INTO "payment_methods" ("code","name","description","type","sort_order","is_active","created_at","updated_at") VALUES
('TELEBIRR','Telebirr','Pay instantly using the Telebirr mobile money app.','MOBILE_MONEY',1,true,now(),now()),
('CBE_BIRR','CBE Birr','Transfer directly from your Commercial Bank of Ethiopia account.','MOBILE_MONEY',2,true,now(),now()),
('CHAPA','Chapa','Card, mobile money, and bank payments through one secure checkout.','CARD',3,true,now(),now()),
('BANK_TRANSFER','Bank Transfer','Transfer from any bank via mobile banking, internet banking, or a branch visit.','BANK_TRANSFER',4,true,now(),now())
ON CONFLICT ("code") DO NOTHING;
