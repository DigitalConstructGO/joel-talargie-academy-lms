ALTER TABLE "permissions" ADD COLUMN "module" text;--> statement-breakpoint
UPDATE "permissions" SET "module" = split_part("code", '.', 1);--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "module" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "permissions" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD COLUMN "assigned_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "is_system" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "roles" SET "is_system" = true WHERE "code" IN ('ADMINISTRATOR', 'STUDENT');--> statement-breakpoint
ALTER TABLE "user_roles" ADD COLUMN "assigned_by" uuid;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
