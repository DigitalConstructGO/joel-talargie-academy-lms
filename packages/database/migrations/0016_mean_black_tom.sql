CREATE TYPE "public"."upload_category" AS ENUM('AVATAR', 'COURSE_THUMBNAIL', 'LESSON_RESOURCE');--> statement-breakpoint
CREATE TABLE "uploaded_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "upload_category" NOT NULL,
	"storage_key" text NOT NULL,
	"variant_storage_key" text,
	"original_file_name" text NOT NULL,
	"stored_file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"checksum" text NOT NULL,
	"width" integer,
	"height" integer,
	"related_user_id" uuid,
	"created_by" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uploaded_files_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "uploaded_files_size_check" CHECK ("uploaded_files"."file_size" > 0)
);
--> statement-breakpoint
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_related_user_id_users_id_fk" FOREIGN KEY ("related_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploaded_files" ADD CONSTRAINT "uploaded_files_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "uploaded_files_category_idx" ON "uploaded_files" USING btree ("category","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "uploaded_files_created_by_idx" ON "uploaded_files" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "uploaded_files_active_avatar_uq" ON "uploaded_files" USING btree ("related_user_id") WHERE "uploaded_files"."category" = 'AVATAR' AND "uploaded_files"."deleted_at" IS NULL;