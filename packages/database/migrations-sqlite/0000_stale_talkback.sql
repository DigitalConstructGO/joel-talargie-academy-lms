CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`before` text,
	`after` text,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `activity_logs_entity_created_idx` ON `activity_logs` (`entity_type`,`entity_id`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `activity_logs_actor_created_idx` ON `activity_logs` (`actor_id`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `activity_logs_action_created_idx` ON `activity_logs` (`action`,"created_at" desc,`id`);--> statement-breakpoint
CREATE TABLE `background_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`job_type` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`payload` text NOT NULL,
	`deduplication_key` text,
	`priority` integer DEFAULT 100 NOT NULL,
	`scheduled_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`locked_at` integer,
	`locked_by` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`completed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `background_jobs_pending_claim_idx` ON `background_jobs` (`scheduled_at`,`priority`,`id`) WHERE "background_jobs"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX `background_jobs_locked_idx` ON `background_jobs` (`status`,`locked_at`);--> statement-breakpoint
CREATE INDEX `background_jobs_type_schedule_idx` ON `background_jobs` (`job_type`,`status`,`scheduled_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `background_jobs_deduplication_key_uq` ON `background_jobs` (`deduplication_key`) WHERE "background_jobs"."deduplication_key" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`image_key` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `categories_parent_idx` ON `categories` (`parent_id`);--> statement-breakpoint
CREATE INDEX `categories_parent_sort_idx` ON `categories` (`parent_id`,`sort_order`,`id`);--> statement-breakpoint
CREATE INDEX `categories_active_idx` ON `categories` (`name`) WHERE "categories"."is_active" = 1 AND "categories"."archived_at" IS NULL;--> statement-breakpoint
CREATE TABLE `certificate_events` (
	`id` text PRIMARY KEY NOT NULL,
	`certificate_id` text NOT NULL,
	`actor_id` text,
	`action` text NOT NULL,
	`reason` text,
	`metadata` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`certificate_id`) REFERENCES `certificates`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `certificate_events_certificate_created_idx` ON `certificate_events` (`certificate_id`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `certificate_events_actor_idx` ON `certificate_events` (`actor_id`);--> statement-breakpoint
CREATE TABLE `certificate_files` (
	`id` text PRIMARY KEY NOT NULL,
	`certificate_id` text NOT NULL,
	`version` integer NOT NULL,
	`storage_key` text NOT NULL,
	`original_file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`checksum` text NOT NULL,
	`is_current` integer DEFAULT true NOT NULL,
	`generated_by` text,
	`generated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`certificate_id`) REFERENCES `certificates`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "certificate_files_version_check" CHECK("certificate_files"."version" > 0),
	CONSTRAINT "certificate_files_size_check" CHECK("certificate_files"."file_size" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificate_files_one_current_uq` ON `certificate_files` (`certificate_id`) WHERE "certificate_files"."is_current" = true;--> statement-breakpoint
CREATE INDEX `certificate_files_certificate_generated_idx` ON `certificate_files` (`certificate_id`,"generated_at" desc,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `certificate_files_certificate_version_uq` ON `certificate_files` (`certificate_id`,`version`);--> statement-breakpoint
CREATE TABLE `certificate_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`version` integer NOT NULL,
	`configuration` text NOT NULL,
	`template_storage_key` text,
	`is_active` integer DEFAULT true NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificate_templates_one_default_uq` ON `certificate_templates` (`is_default`) WHERE "certificate_templates"."is_default" = 1 AND "certificate_templates"."is_active" = true;--> statement-breakpoint
CREATE UNIQUE INDEX `certificate_templates_name_version_uq` ON `certificate_templates` (`name`,`version`);--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollment_id` text NOT NULL,
	`template_id` text NOT NULL,
	`certificate_number` text NOT NULL,
	`verification_token` text NOT NULL,
	`student_name_at_issue` text NOT NULL,
	`course_title_at_issue` text NOT NULL,
	`completion_date_snapshot` integer,
	`template_name_snapshot` text,
	`template_version_snapshot` integer,
	`pdf_storage_key` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`issued_at` integer,
	`generated_at` integer,
	`generated_by` text,
	`generation_version` integer DEFAULT 1 NOT NULL,
	`pdf_checksum` text,
	`pdf_file_size` integer,
	`pdf_mime_type` text,
	`failure_code` text,
	`failure_message` text,
	`last_generation_attempt_at` integer,
	`revoked_at` integer,
	`revocation_reason` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`template_id`) REFERENCES `certificate_templates`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_certificate_number_unique` ON `certificates` (`certificate_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_verification_token_unique` ON `certificates` (`verification_token`);--> statement-breakpoint
CREATE INDEX `certificates_enrollment_status_idx` ON `certificates` (`enrollment_id`,`status`);--> statement-breakpoint
CREATE INDEX `certificates_generated_idx` ON `certificates` ("issued_at" desc,`id`) WHERE "certificates"."status" = 'GENERATED' AND "certificates"."revoked_at" IS NULL;--> statement-breakpoint
CREATE INDEX `certificates_template_idx` ON `certificates` (`template_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_active_enrollment_uq` ON `certificates` (`enrollment_id`) WHERE "certificates"."status" <> 'REVOKED';--> statement-breakpoint
CREATE INDEX `certificates_status_updated_idx` ON `certificates` (`status`,"updated_at" desc,`id`);--> statement-breakpoint
CREATE TABLE `course_outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`outcome` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_outcomes_order_uq` ON `course_outcomes` (`course_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `course_requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`requirement` text NOT NULL,
	`sort_order` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_requirements_order_uq` ON `course_requirements` (`course_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `course_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`position` integer NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_sections_position_uq` ON `course_sections` (`course_id`,`position`);--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`created_by` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`short_description` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`thumbnail_key` text,
	`presenter_name` text NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`visibility` text DEFAULT 'PRIVATE' NOT NULL,
	`access_type` text DEFAULT 'FREE' NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`price` text DEFAULT '0' NOT NULL,
	`discount_price` text,
	`currency` text DEFAULT 'ETB' NOT NULL,
	`difficulty` text DEFAULT 'ALL_LEVELS' NOT NULL,
	`estimated_duration_minutes` integer,
	`certificate_enabled` integer DEFAULT false NOT NULL,
	`enrollment_open_at` integer,
	`enrollment_close_at` integer,
	`capacity` integer,
	`published_at` integer,
	`archived_at` integer,
	`search_vector` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `courses_slug_unique` ON `courses` (`slug`);--> statement-breakpoint
CREATE INDEX `courses_created_by_idx` ON `courses` (`created_by`);--> statement-breakpoint
CREATE INDEX `courses_catalog_idx` ON `courses` (`status`,`visibility`,"published_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `courses_category_catalog_idx` ON `courses` (`category_id`,`status`,`visibility`);--> statement-breakpoint
CREATE INDEX `courses_access_catalog_idx` ON `courses` (`access_type`,`status`,`visibility`);--> statement-breakpoint
CREATE INDEX `courses_difficulty_catalog_idx` ON `courses` (`difficulty`,`status`,`visibility`);--> statement-breakpoint
CREATE INDEX `courses_featured_catalog_idx` ON `courses` (`featured`,`status`,"published_at" desc);--> statement-breakpoint
CREATE INDEX `courses_published_public_idx` ON `courses` ("published_at" desc,`id`) WHERE "courses"."status" = 'PUBLISHED' AND "courses"."visibility" = 'PUBLIC' AND "courses"."archived_at" IS NULL;--> statement-breakpoint
CREATE INDEX `courses_search_gin_idx` ON `courses` (`search_vector`);--> statement-breakpoint
CREATE TABLE `email_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`recipient_email` text NOT NULL,
	`recipient_name` text,
	`template_code` text NOT NULL,
	`template_version` integer NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`subject_snapshot` text NOT NULL,
	`text_body_snapshot` text NOT NULL,
	`html_body_snapshot` text NOT NULL,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`priority` text DEFAULT 'NORMAL' NOT NULL,
	`deduplication_key` text,
	`related_entity_type` text,
	`related_entity_id` text,
	`scheduled_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`sent_at` integer,
	`failed_at` integer,
	`cancelled_at` integer,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`maximum_attempts` integer DEFAULT 5 NOT NULL,
	`last_attempt_at` integer,
	`next_attempt_at` integer,
	`locked_at` integer,
	`locked_by` text,
	`provider_message_id` text,
	`failure_code` text,
	`failure_message` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "email_deliveries_attempts_check" CHECK("email_deliveries"."maximum_attempts" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_deliveries_deduplication_key_uq` ON `email_deliveries` (`deduplication_key`) WHERE "email_deliveries"."deduplication_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `email_deliveries_claim_idx` ON `email_deliveries` ("priority" desc,`scheduled_at`,`id`) WHERE "email_deliveries"."status" IN ('QUEUED', 'RETRY_SCHEDULED');--> statement-breakpoint
CREATE INDEX `email_deliveries_user_created_idx` ON `email_deliveries` (`user_id`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `email_deliveries_status_created_idx` ON `email_deliveries` (`status`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `email_deliveries_template_created_idx` ON `email_deliveries` (`template_code`,"created_at" desc);--> statement-breakpoint
CREATE TABLE `email_delivery_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`delivery_id` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`worker_id` text,
	`started_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`completed_at` integer,
	`status` text DEFAULT 'PROCESSING' NOT NULL,
	`provider_response_code` text,
	`provider_message_id` text,
	`failure_code` text,
	`failure_message` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`delivery_id`) REFERENCES `email_deliveries`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `email_delivery_attempts_delivery_created_idx` ON `email_delivery_attempts` (`delivery_id`,"created_at" desc,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `email_delivery_attempts_delivery_number_uq` ON `email_delivery_attempts` (`delivery_id`,`attempt_number`);--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`subject_template` text NOT NULL,
	`html_template` text NOT NULL,
	`text_template` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`locale` text DEFAULT 'en' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_system` integer DEFAULT true NOT NULL,
	`description` text,
	`created_by` text,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "email_templates_version_check" CHECK("email_templates"."version" > 0),
	CONSTRAINT "email_templates_code_check" CHECK("email_templates"."code" ~ '^[A-Z][A-Z0-9_]{2,79}$'),
	CONSTRAINT "email_templates_locale_check" CHECK("email_templates"."locale" ~ '^[a-z]{2}(-[A-Z]{2})?$')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_templates_active_code_locale_uq` ON `email_templates` (`code`,`locale`) WHERE "email_templates"."is_active" = 1 AND "email_templates"."archived_at" IS NULL;--> statement-breakpoint
CREATE INDEX `email_templates_catalog_idx` ON `email_templates` (`code`,`locale`,"version" desc);--> statement-breakpoint
CREATE UNIQUE INDEX `email_templates_code_version_locale_uq` ON `email_templates` (`code`,`version`,`locale`);--> statement-breakpoint
CREATE TABLE `email_verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_verification_tokens_token_hash_unique` ON `email_verification_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `email_verification_tokens_user_idx` ON `email_verification_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`course_id` text NOT NULL,
	`last_lesson_id` text,
	`status` text DEFAULT 'PENDING_PAYMENT' NOT NULL,
	`price_at_enrollment` text NOT NULL,
	`currency_at_enrollment` text NOT NULL,
	`discount_at_enrollment` text DEFAULT '0' NOT NULL,
	`progress_percentage` integer DEFAULT 0 NOT NULL,
	`enrolled_at` integer,
	`started_at` integer,
	`completed_at` integer,
	`cancelled_at` integer,
	`cancelled_by` text,
	`cancellation_reason` text,
	`access_revoked_at` integer,
	`access_revocation_reason` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`last_lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "enrollments_progress_percentage_check" CHECK("enrollments"."progress_percentage" BETWEEN 0 AND 100),
	CONSTRAINT "enrollments_price_snapshot_check" CHECK("enrollments"."price_at_enrollment" >= 0),
	CONSTRAINT "enrollments_discount_snapshot_check" CHECK("enrollments"."discount_at_enrollment" >= 0)
);
--> statement-breakpoint
CREATE INDEX `enrollments_student_status_updated_idx` ON `enrollments` (`student_id`,`status`,"updated_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `enrollments_course_status_idx` ON `enrollments` (`course_id`,`status`);--> statement-breakpoint
CREATE INDEX `enrollments_student_created_idx` ON `enrollments` (`student_id`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `enrollments_course_created_idx` ON `enrollments` (`course_id`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `enrollments_status_created_idx` ON `enrollments` (`status`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `enrollments_status_updated_idx` ON `enrollments` (`status`,"updated_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `enrollments_capacity_idx` ON `enrollments` (`course_id`,`status`) WHERE "enrollments"."status" IN ('PENDING_PAYMENT', 'WAITING_APPROVAL', 'ENROLLED', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE INDEX `enrollments_cancelled_by_idx` ON `enrollments` (`cancelled_by`);--> statement-breakpoint
CREATE INDEX `enrollments_last_lesson_idx` ON `enrollments` (`last_lesson_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `enrollments_student_course_uq` ON `enrollments` (`student_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `lesson_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollment_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`status` text DEFAULT 'NOT_STARTED' NOT NULL,
	`progress_percent` integer DEFAULT 0 NOT NULL,
	`last_position_seconds` integer,
	`first_opened_at` integer,
	`last_viewed_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "lesson_progress_position_check" CHECK("lesson_progress"."last_position_seconds" IS NULL OR "lesson_progress"."last_position_seconds" >= 0),
	CONSTRAINT "lesson_progress_percent_check" CHECK("lesson_progress"."progress_percent" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_progress_enrollment_lesson_uq` ON `lesson_progress` (`enrollment_id`,`lesson_id`);--> statement-breakpoint
CREATE INDEX `lesson_progress_lesson_idx` ON `lesson_progress` (`lesson_id`);--> statement-breakpoint
CREATE INDEX `lesson_progress_enrollment_status_idx` ON `lesson_progress` (`enrollment_id`,`status`);--> statement-breakpoint
CREATE INDEX `lesson_progress_recent_idx` ON `lesson_progress` (`enrollment_id`,"last_viewed_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `lesson_progress_completed_idx` ON `lesson_progress` ("completed_at" desc,`id`) WHERE "lesson_progress"."status" = 'COMPLETED';--> statement-breakpoint
CREATE TABLE `lesson_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`label` text NOT NULL,
	`resource_type` text NOT NULL,
	`storage_key` text,
	`external_url` text,
	`original_file_name` text,
	`mime_type` text,
	`file_size` integer,
	`visibility` text DEFAULT 'ENROLLED_STUDENTS' NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_resources_lesson_position_idx` ON `lesson_resources` (`lesson_id`,`position`);--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`course_id` text NOT NULL,
	`section_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text,
	`lesson_type` text DEFAULT 'TEXT' NOT NULL,
	`video_url` text,
	`external_url` text,
	`duration_seconds` integer,
	`position` integer NOT NULL,
	`is_mandatory` integer DEFAULT true NOT NULL,
	`is_preview` integer DEFAULT false NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`section_id`) REFERENCES `course_sections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lessons_section_position_idx` ON `lessons` (`section_id`,`position`);--> statement-breakpoint
CREATE INDEX `lessons_active_course_idx` ON `lessons` (`course_id`,`position`) WHERE "lessons"."archived_at" IS NULL;--> statement-breakpoint
CREATE INDEX `lessons_published_idx` ON `lessons` (`course_id`,`position`,`id`) WHERE "lessons"."is_published" = 1 AND "lessons"."archived_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `lessons_course_slug_uq` ON `lessons` (`course_id`,`slug`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`email_normalized` text NOT NULL,
	`successful` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `login_attempts_user_idx` ON `login_attempts` (`user_id`);--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`subscribed_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`unsubscribed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_subscribers_email_unique` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_email_idx` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_status_idx` ON `newsletter_subscribers` (`status`);--> statement-breakpoint
CREATE INDEX `newsletter_subscribers_subscribed_at_idx` ON `newsletter_subscribers` ("subscribed_at" desc);--> statement-breakpoint
CREATE TABLE `notification_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`notification_id` text,
	`email_delivery_id` text,
	`event_type` text NOT NULL,
	`channel` text NOT NULL,
	`related_entity_type` text,
	`related_entity_id` text,
	`safe_metadata_json` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`email_delivery_id`) REFERENCES `email_deliveries`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `notification_events_user_created_idx` ON `notification_events` (`user_id`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `notification_events_delivery_created_idx` ON `notification_events` (`email_delivery_id`,"created_at" desc);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`channel` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`type` text DEFAULT 'GENERAL' NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`action_url` text,
	`related_entity_type` text,
	`related_entity_id` text,
	`priority` text DEFAULT 'NORMAL' NOT NULL,
	`deduplication_key` text,
	`metadata` text,
	`read_at` integer,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_read_created_idx` ON `notifications` (`user_id`,`read_at`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `notifications_user_status_created_idx` ON `notifications` (`user_id`,`status`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `notifications_unread_active_in_app_idx` ON `notifications` (`user_id`,"created_at" desc,`id`) WHERE "notifications"."read_at" IS NULL AND "notifications"."archived_at" IS NULL AND "notifications"."channel" = 'IN_APP';--> statement-breakpoint
CREATE UNIQUE INDEX `notifications_deduplication_key_uq` ON `notifications` (`deduplication_key`) WHERE "notifications"."deduplication_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `notifications_user_type_priority_idx` ON `notifications` (`user_id`,`type`,`priority`,"created_at" desc);--> statement-breakpoint
CREATE TABLE `oauth_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`provider_email` text,
	`linked_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`last_login_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_accounts_provider_account_uq` ON `oauth_accounts` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_accounts_user_provider_uq` ON `oauth_accounts` (`user_id`,`provider`);--> statement-breakpoint
CREATE INDEX `oauth_accounts_user_idx` ON `oauth_accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_hash_unique` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `password_reset_tokens_user_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'OTHER' NOT NULL,
	`instructions` text DEFAULT '{}' NOT NULL,
	`config` text DEFAULT '{}' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_methods_code_unique` ON `payment_methods` (`code`);--> statement-breakpoint
CREATE INDEX `payment_methods_active_sort_idx` ON `payment_methods` (`is_active`,`sort_order`,`name`);--> statement-breakpoint
CREATE INDEX `payment_methods_type_idx` ON `payment_methods` (`type`);--> statement-breakpoint
CREATE TABLE `payment_receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`storage_key` text NOT NULL,
	`original_file_name` text DEFAULT 'receipt' NOT NULL,
	`mime_type` text NOT NULL,
	`detected_mime_type` text,
	`file_extension` text,
	`file_size` integer DEFAULT 0 NOT NULL,
	`checksum` text,
	`storage_provider` text,
	`uploaded_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_receipts_payment_uq` ON `payment_receipts` (`payment_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`enrollment_id` text NOT NULL,
	`payment_method_id` text,
	`reviewer_id` text,
	`attempt_number` integer NOT NULL,
	`transaction_id` text,
	`transaction_id_normalized` text,
	`amount` text NOT NULL,
	`expected_amount_snapshot` text DEFAULT '0' NOT NULL,
	`currency` text NOT NULL,
	`payment_date` integer,
	`student_note` text,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`amount_mismatch` integer DEFAULT false NOT NULL,
	`mismatch_approval_reason` text,
	`review_note` text,
	`decline_reason` text,
	`duplicate_transaction_count` integer DEFAULT 0 NOT NULL,
	`submitted_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`reviewed_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "payments_amount_positive_check" CHECK("payments"."amount" > 0),
	CONSTRAINT "payments_expected_amount_nonnegative_check" CHECK("payments"."expected_amount_snapshot" >= 0)
);
--> statement-breakpoint
CREATE INDEX `payments_pending_queue_idx` ON `payments` (`submitted_at`,`id`) WHERE "payments"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX `payments_reviewer_reviewed_idx` ON `payments` (`reviewer_id`,"reviewed_at" desc);--> statement-breakpoint
CREATE INDEX `payments_transaction_idx` ON `payments` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `payments_transaction_normalized_idx` ON `payments` (`transaction_id_normalized`);--> statement-breakpoint
CREATE INDEX `payments_enrollment_submitted_idx` ON `payments` (`enrollment_id`,"submitted_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `payments_status_submitted_idx` ON `payments` (`status`,"submitted_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `payments_payment_method_idx` ON `payments` (`payment_method_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_one_pending_per_enrollment_uq` ON `payments` (`enrollment_id`) WHERE "payments"."status" = 'PENDING';--> statement-breakpoint
CREATE UNIQUE INDEX `payments_enrollment_attempt_uq` ON `payments` (`enrollment_id`,`attempt_number`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`module` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_code_unique` ON `permissions` (`code`);--> statement-breakpoint
CREATE TABLE `platform_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_by` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `platform_settings_key_unique` ON `platform_settings` (`key`);--> statement-breakpoint
CREATE INDEX `platform_settings_updated_by_idx` ON `platform_settings` (`updated_by`);--> statement-breakpoint
CREATE TABLE `promo_affiliates` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`commission_type` text DEFAULT 'PERCENTAGE' NOT NULL,
	`commission_rate` text,
	`commission_fixed_amount` text,
	`total_clicks` integer DEFAULT 0 NOT NULL,
	`total_enrollments` integer DEFAULT 0 NOT NULL,
	`total_revenue` text DEFAULT '0' NOT NULL,
	`total_commission` text DEFAULT '0' NOT NULL,
	`notes` text,
	`created_by` text NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "promo_affiliates_commission_rate_check" CHECK("promo_affiliates"."commission_rate" IS NULL OR ("promo_affiliates"."commission_rate" >= 0 AND "promo_affiliates"."commission_rate" <= 100)),
	CONSTRAINT "promo_affiliates_commission_fixed_check" CHECK("promo_affiliates"."commission_fixed_amount" IS NULL OR "promo_affiliates"."commission_fixed_amount" >= 0)
);
--> statement-breakpoint
CREATE INDEX `promo_affiliates_user_idx` ON `promo_affiliates` (`user_id`);--> statement-breakpoint
CREATE INDEX `promo_affiliates_status_idx` ON `promo_affiliates` (`status`);--> statement-breakpoint
CREATE TABLE `promo_code_category_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`code_id` text NOT NULL,
	`category_id` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`code_id`) REFERENCES `promo_codes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `promo_code_category_rules_category_idx` ON `promo_code_category_rules` (`category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `promo_code_category_rules_code_category_uq` ON `promo_code_category_rules` (`code_id`,`category_id`);--> statement-breakpoint
CREATE TABLE `promo_code_course_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`code_id` text NOT NULL,
	`course_id` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`code_id`) REFERENCES `promo_codes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `promo_code_course_rules_course_idx` ON `promo_code_course_rules` (`course_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `promo_code_course_rules_code_course_uq` ON `promo_code_course_rules` (`code_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `promo_code_user_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`code_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`code_id`) REFERENCES `promo_codes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `promo_code_user_rules_user_idx` ON `promo_code_user_rules` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `promo_code_user_rules_code_user_uq` ON `promo_code_user_rules` (`code_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `promo_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`code_type` text DEFAULT 'MANUAL' NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`discount_type` text DEFAULT 'PERCENTAGE' NOT NULL,
	`discount_value` text DEFAULT '0' NOT NULL,
	`owner_user_id` text,
	`affiliate_id` text,
	`is_single_use` integer DEFAULT false NOT NULL,
	`max_users` integer,
	`redemption_count` integer DEFAULT 0 NOT NULL,
	`valid_from` integer,
	`valid_until` integer,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`affiliate_id`) REFERENCES `promo_affiliates`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "promo_codes_max_users_check" CHECK("promo_codes"."max_users" IS NULL OR "promo_codes"."max_users" >= 1),
	CONSTRAINT "promo_codes_window_check" CHECK("promo_codes"."valid_from" IS NULL OR "promo_codes"."valid_until" IS NULL OR "promo_codes"."valid_until" > "promo_codes"."valid_from"),
	CONSTRAINT "promo_codes_discount_value_check" CHECK("promo_codes"."discount_value" >= 0),
	CONSTRAINT "promo_codes_percentage_bounds_check" CHECK("promo_codes"."discount_type" <> 'PERCENTAGE' OR "promo_codes"."discount_value" <= 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `promo_codes_code_uq` ON `promo_codes` (`code`);--> statement-breakpoint
CREATE INDEX `promo_codes_owner_idx` ON `promo_codes` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `promo_codes_affiliate_idx` ON `promo_codes` (`affiliate_id`);--> statement-breakpoint
CREATE INDEX `promo_codes_status_idx` ON `promo_codes` (`status`);--> statement-breakpoint
CREATE INDEX `promo_codes_valid_window_idx` ON `promo_codes` (`valid_from`,`valid_until`);--> statement-breakpoint
CREATE TABLE `promo_redemptions` (
	`id` text PRIMARY KEY NOT NULL,
	`code_id` text NOT NULL,
	`student_id` text NOT NULL,
	`course_id` text NOT NULL,
	`enrollment_id` text,
	`payment_id` text,
	`status` text DEFAULT 'CONFIRMED' NOT NULL,
	`original_price` text NOT NULL,
	`discount_amount` text NOT NULL,
	`final_price` text NOT NULL,
	`currency` text NOT NULL,
	`affiliate_id` text,
	`affiliate_commission_amount` text,
	`ip_address` text,
	`user_agent` text,
	`device_type` text,
	`redeemed_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`code_id`) REFERENCES `promo_codes`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`affiliate_id`) REFERENCES `promo_affiliates`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "promo_redemptions_discount_check" CHECK("promo_redemptions"."discount_amount" >= 0),
	CONSTRAINT "promo_redemptions_final_price_check" CHECK("promo_redemptions"."final_price" >= 0),
	CONSTRAINT "promo_redemptions_final_price_bounds_check" CHECK("promo_redemptions"."final_price" <= "promo_redemptions"."original_price")
);
--> statement-breakpoint
CREATE INDEX `promo_redemptions_code_idx` ON `promo_redemptions` (`code_id`);--> statement-breakpoint
CREATE INDEX `promo_redemptions_student_idx` ON `promo_redemptions` (`student_id`,"redeemed_at" desc);--> statement-breakpoint
CREATE INDEX `promo_redemptions_course_idx` ON `promo_redemptions` (`course_id`);--> statement-breakpoint
CREATE INDEX `promo_redemptions_affiliate_idx` ON `promo_redemptions` (`affiliate_id`);--> statement-breakpoint
CREATE INDEX `promo_redemptions_enrollment_idx` ON `promo_redemptions` (`enrollment_id`);--> statement-breakpoint
CREATE INDEX `promo_redemptions_payment_idx` ON `promo_redemptions` (`payment_id`);--> statement-breakpoint
CREATE INDEX `promo_redemptions_active_code_student_idx` ON `promo_redemptions` (`code_id`,`student_id`) WHERE "promo_redemptions"."status" IN ('RESERVED', 'CONFIRMED') AND "promo_redemptions"."code_id" IS NOT NULL;--> statement-breakpoint
CREATE TABLE `promo_usage_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`code_id` text,
	`actor_id` text,
	`action` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`ip_address` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`code_id`) REFERENCES `promo_codes`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `promo_usage_logs_code_idx` ON `promo_usage_logs` (`code_id`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `promo_usage_logs_action_idx` ON `promo_usage_logs` (`action`,"created_at" desc);--> statement-breakpoint
CREATE TABLE `refresh_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`ip_address` text,
	`user_agent` text,
	`last_used_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `refresh_sessions_user_idx` ON `refresh_sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `refresh_sessions_expires_idx` ON `refresh_sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `refresh_sessions_active_idx` ON `refresh_sessions` (`user_id`,`expires_at`) WHERE "refresh_sessions"."revoked_at" IS NULL;--> statement-breakpoint
CREATE TABLE `report_exports` (
	`id` text PRIMARY KEY NOT NULL,
	`requested_by` text NOT NULL,
	`report_type` text NOT NULL,
	`format` text NOT NULL,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`filters_json` text DEFAULT '{}' NOT NULL,
	`selected_columns_json` text,
	`sort_json` text,
	`locale` text DEFAULT 'en' NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`requested_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`failed_at` integer,
	`cancelled_at` integer,
	`expires_at` integer,
	`row_count` integer,
	`file_storage_key` text,
	`original_file_name` text,
	`mime_type` text,
	`file_size` integer,
	`checksum` text,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`maximum_attempts` integer DEFAULT 3 NOT NULL,
	`failure_code` text,
	`failure_message` text,
	`deduplication_key` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`requested_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "report_exports_attempts_check" CHECK("report_exports"."maximum_attempts" > 0 AND "report_exports"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE INDEX `report_exports_requester_created_idx` ON `report_exports` (`requested_by`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `report_exports_status_created_idx` ON `report_exports` (`status`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `report_exports_expiry_idx` ON `report_exports` (`status`,`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `report_exports_active_dedup_uq` ON `report_exports` (`deduplication_key`) WHERE "report_exports"."deduplication_key" IS NOT NULL AND "report_exports"."status" IN ('QUEUED','PROCESSING');--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`assigned_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `role_permissions_permission_idx` ON `role_permissions` (`permission_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_system` integer DEFAULT false NOT NULL,
	`archived_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_code_unique` ON `roles` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE INDEX `roles_active_code_idx` ON `roles` (`archived_at`,`code`);--> statement-breakpoint
CREATE TABLE `sms_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`recipient_phone` text NOT NULL,
	`message_text` text NOT NULL,
	`template_code` text NOT NULL,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`priority` text DEFAULT 'NORMAL' NOT NULL,
	`deduplication_key` text,
	`related_entity_type` text,
	`related_entity_id` text,
	`scheduled_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`sent_at` integer,
	`failed_at` integer,
	`cancelled_at` integer,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`maximum_attempts` integer DEFAULT 3 NOT NULL,
	`last_attempt_at` integer,
	`next_attempt_at` integer,
	`locked_at` integer,
	`locked_by` text,
	`provider_message_id` text,
	`provider_log_id` text,
	`failure_code` text,
	`failure_message` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "sms_deliveries_attempts_check" CHECK("sms_deliveries"."maximum_attempts" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sms_deliveries_deduplication_key_uq` ON `sms_deliveries` (`deduplication_key`) WHERE "sms_deliveries"."deduplication_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `sms_deliveries_claim_idx` ON `sms_deliveries` ("priority" desc,`scheduled_at`,`id`) WHERE "sms_deliveries"."status" IN ('QUEUED', 'RETRY_SCHEDULED');--> statement-breakpoint
CREATE INDEX `sms_deliveries_user_created_idx` ON `sms_deliveries` (`user_id`,"created_at" desc,`id`);--> statement-breakpoint
CREATE INDEX `sms_deliveries_status_created_idx` ON `sms_deliveries` (`status`,"created_at" desc,`id`);--> statement-breakpoint
CREATE TABLE `sms_delivery_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`delivery_id` text NOT NULL,
	`attempt_number` integer NOT NULL,
	`worker_id` text,
	`started_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`completed_at` integer,
	`status` text DEFAULT 'PROCESSING' NOT NULL,
	`provider_response_code` text,
	`provider_message_id` text,
	`failure_code` text,
	`failure_message` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`delivery_id`) REFERENCES `sms_deliveries`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sms_delivery_attempts_delivery_created_idx` ON `sms_delivery_attempts` (`delivery_id`,"created_at" desc,`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sms_delivery_attempts_delivery_number_uq` ON `sms_delivery_attempts` (`delivery_id`,`attempt_number`);--> statement-breakpoint
CREATE TABLE `uploaded_files` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`storage_key` text NOT NULL,
	`variant_storage_key` text,
	`original_file_name` text NOT NULL,
	`stored_file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`checksum` text NOT NULL,
	`width` integer,
	`height` integer,
	`related_user_id` text,
	`created_by` text NOT NULL,
	`deleted_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`related_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "uploaded_files_size_check" CHECK("uploaded_files"."file_size" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uploaded_files_storage_key_unique` ON `uploaded_files` (`storage_key`);--> statement-breakpoint
CREATE INDEX `uploaded_files_category_idx` ON `uploaded_files` (`category`,"created_at" desc);--> statement-breakpoint
CREATE INDEX `uploaded_files_created_by_idx` ON `uploaded_files` (`created_by`);--> statement-breakpoint
CREATE UNIQUE INDEX `uploaded_files_active_avatar_uq` ON `uploaded_files` (`related_user_id`) WHERE "uploaded_files"."category" = 'AVATAR' AND "uploaded_files"."deleted_at" IS NULL;--> statement-breakpoint
CREATE TABLE `user_notification_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email_security` integer DEFAULT true NOT NULL,
	`email_learning` integer DEFAULT true NOT NULL,
	`email_payments` integer DEFAULT true NOT NULL,
	`email_certificates` integer DEFAULT true NOT NULL,
	`in_app_learning` integer DEFAULT true NOT NULL,
	`in_app_payments` integer DEFAULT true NOT NULL,
	`in_app_certificates` integer DEFAULT true NOT NULL,
	`sms_security` integer DEFAULT true NOT NULL,
	`sms_learning` integer DEFAULT true NOT NULL,
	`sms_payments` integer DEFAULT true NOT NULL,
	`sms_certificates` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_notification_preferences_user_id_unique` ON `user_notification_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`phone` text,
	`bio` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_profiles_user_id_unique` ON `user_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` text NOT NULL,
	`role_id` text NOT NULL,
	`assigned_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`assigned_by` text,
	PRIMARY KEY(`user_id`, `role_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `user_roles_role_idx` ON `user_roles` (`role_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_normalized` text NOT NULL,
	`password_hash` text NOT NULL,
	`google_id` text,
	`avatar_url` text,
	`provider` text DEFAULT 'LOCAL' NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	`archived_at` integer,
	`last_login_at` integer,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_normalized_uidx` ON `users` (`email_normalized`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_id_uidx` ON `users` (`google_id`);--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`status`);--> statement-breakpoint
CREATE INDEX `users_active_idx` ON `users` (`id`) WHERE "users"."status" = 'ACTIVE' AND "users"."archived_at" IS NULL;