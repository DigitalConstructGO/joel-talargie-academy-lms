export const UPLOAD_CATEGORIES = [
  'AVATAR',
  'COURSE_THUMBNAIL',
  'LESSON_RESOURCE',
] as const;
export type UploadCategory = (typeof UPLOAD_CATEGORIES)[number];

/** Top-level folder every category (and every legacy feature module) writes under. */
export const STORAGE_FOLDERS = {
  AVATAR: 'avatars',
  COURSE_THUMBNAIL: 'course-thumbnails',
  LESSON_RESOURCE: 'lesson-files',
  PAYMENT_RECEIPT: 'payment-receipts',
  CERTIFICATE: 'certificates',
  TEMP: 'temp',
  EXPORT: 'exports',
} as const;

/** Every folder auto-created under STORAGE_ROOT on boot. */
export const ALL_STORAGE_FOLDERS = Object.values(STORAGE_FOLDERS);

export const UPLOAD_CATEGORY_FOLDER: Record<UploadCategory, string> = {
  AVATAR: STORAGE_FOLDERS.AVATAR,
  COURSE_THUMBNAIL: STORAGE_FOLDERS.COURSE_THUMBNAIL,
  LESSON_RESOURCE: STORAGE_FOLDERS.LESSON_RESOURCE,
};

export const MAX_UPLOAD_BYTES: Record<UploadCategory, number> = {
  AVATAR: 5 * 1024 * 1024,
  COURSE_THUMBNAIL: 10 * 1024 * 1024,
  LESSON_RESOURCE: 500 * 1024 * 1024,
};

export const IMAGE_CATEGORIES: readonly UploadCategory[] = [
  'AVATAR',
  'COURSE_THUMBNAIL',
];

export const AVATAR_DIMENSIONS = { width: 512, height: 512 } as const;
export const COURSE_THUMBNAIL_DIMENSIONS = {
  width: 1280,
  height: 720,
} as const;

export const IMAGE_QUALITY = 85;
export const WEBP_VARIANT_QUALITY = 82;

export const DEFAULT_SIGNED_URL_TTL_SECONDS = 900;
export const MIN_SIGNED_URL_TTL_SECONDS = 30;
export const MAX_SIGNED_URL_TTL_SECONDS = 86_400;

export const STORAGE_HEADER_SNIFF_BYTES = 16;

/** Temp files older than this are considered abandoned uploads and purged. */
export const TEMP_FILE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
