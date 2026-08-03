DROP INDEX "payment_receipts_payment_idx";--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD COLUMN "original_file_name" text DEFAULT 'receipt' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD COLUMN "detected_mime_type" text;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD COLUMN "file_extension" text;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD COLUMN "file_size" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD COLUMN "checksum" text;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD COLUMN "storage_provider" text;--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD COLUMN "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "transaction_id_normalized" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "expected_amount_snapshot" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
UPDATE "payments" AS p
SET "expected_amount_snapshot" = CASE
  WHEN e."discount_at_enrollment" > 0 THEN e."discount_at_enrollment"
  ELSE e."price_at_enrollment"
END
FROM "enrollments" AS e
WHERE e."id" = p."enrollment_id";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "student_note" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "amount_mismatch" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "mismatch_approval_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "decline_reason" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "duplicate_transaction_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "payments_transaction_normalized_idx" ON "payments" USING btree ("transaction_id_normalized");--> statement-breakpoint
CREATE INDEX "payments_enrollment_submitted_idx" ON "payments" USING btree ("enrollment_id","submitted_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE INDEX "payments_status_submitted_idx" ON "payments" USING btree ("status","submitted_at" DESC NULLS LAST,"id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_pending_per_enrollment_uq" ON "payments" USING btree ("enrollment_id") WHERE "payments"."status" = 'PENDING';--> statement-breakpoint
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_payment_uq" UNIQUE("payment_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_positive_check" CHECK ("payments"."amount" > 0);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_expected_amount_nonnegative_check" CHECK ("payments"."expected_amount_snapshot" >= 0);
