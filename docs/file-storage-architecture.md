# File storage architecture (Backend Phase 13)

## Why an abstraction

The application never touches the filesystem directly outside `apps/api/src/modules/storage`. Every feature module (certificates, payments, reports, and now avatars/course-thumbnails/lesson-resources) depends only on the `StorageService` contract:

```ts
interface StorageService {
  upload(input: { key: string; body: Uint8Array; contentType: string }): Promise<{ key: string }>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
```

Two providers implement it:

- `LocalStorageProvider` (`STORAGE_DRIVER=local`, the default) - writes to the local filesystem.
- `S3StorageProvider` (`STORAGE_DRIVER=s3`) - the pre-existing S3-compatible provider from earlier phases.

`storage.module.ts` binds the `STORAGE_SERVICE` DI token to whichever driver is configured. Certificates, payments, and report exports were written entirely against the interface, so switching drivers (the eventual Phase 18 S3 migration) requires zero changes in those modules.

## Folder structure

All local files live under a single root, resolved once by walking up from the process cwd to the nearest `package.json` that declares npm `workspaces` (so it's always `<repo>/storage`, never `apps/api/storage`, regardless of whether the process was started from the repo root or the `apps/api` workspace). Override with `STORAGE_ROOT` if needed.

```
storage/
├── avatars/
├── course-thumbnails/
├── lesson-files/
├── payment-receipts/
├── certificates/
├── temp/
└── exports/
```

Every folder is created automatically on boot (`LocalStorageProvider.onModuleInit`) and the temp folder for multipart lesson-resource uploads is (re)created lazily before each request.

## Signed download tokens

`LocalStorageProvider.getSignedUrl(key, ttl)` doesn't hand back a bucket URL - there is no bucket. It mints an HMAC-SHA256 token (`STORAGE_SIGNING_SECRET`, falls back to `JWT_ACCESS_SECRET` in development) embedding `{ key, exp }`, and returns a URL pointing at this API's own streaming endpoint: `GET /api/v1/storage/files/:token`. That route is `@Public()` - the token itself is the credential, exactly like an S3 presigned URL - and is rate-limited (30 req/min) against enumeration. An expired or tampered token returns `401 Unauthorized`; a valid token for a file that no longer exists returns `404 Not Found`. Default TTL is 15 minutes (`STORAGE_SIGNED_URL_TTL_SECONDS`); certificates/payments/reports explicitly request a tighter 5-minute window, unchanged from before this phase.

This one route is what backs every existing `getSignedUrl()` call site - certificate downloads, receipt downloads, report export downloads - so none of those modules needed to change beyond the storage-key prefix realignment described below.

## New upload/download surface

| Route                                    | Auth                                  | Purpose                                                                                                                                             |
| ---------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/storage/avatar`            | Any authenticated user                | Upload/replace own avatar (resized, optimized, WebP variant generated)                                                                              |
| `DELETE /api/v1/storage/avatar`          | Any authenticated user                | Delete own avatar                                                                                                                                   |
| `GET /api/v1/storage/avatar/:userId`     | Owner or Administrator                | Stream an avatar image                                                                                                                              |
| `POST /api/v1/storage/course-thumbnails` | `courses.update` permission           | Upload + optimize a course thumbnail, returns a `thumbnailKey` to paste into the existing course create/update DTO                                  |
| `POST /api/v1/storage/lesson-resources`  | `lessons.manage_resources` permission | Upload a lesson resource (streamed to disk, never buffered in memory), returns a `storageKey` to paste into the existing resource create/update DTO |
| `GET /api/v1/storage/files/:token`       | Signed token (public route)           | Streams any file behind a `getSignedUrl()` result                                                                                                   |

Course-thumbnail and lesson-resource uploads are intentionally two-step: upload returns a storage key, the admin then calls the existing (Phase 1-12) course/lesson endpoints with that key. This avoids coupling the storage module to the catalog module's schema and preserves those endpoints exactly as they were.

## Validation and content protection

`validators/upload.validator.ts` enforces, per category (`AVATAR`, `COURSE_THUMBNAIL`, `LESSON_RESOURCE`):

- a fixed extension allow-list,
- a maximum size (5MB / 10MB / 500MB),
- a magic-byte signature check against the file's own bytes (never the client-supplied `Content-Type`),
- rejection of double-extension filenames (`resume.pdf.exe`),
- filename sanitization (`[A-Za-z0-9._-]` only, path separators stripped).

The resolved `mimeType` stored in the database is always derived from the signature-verified extension, never trusted from the client. `utils/safe-path.util.ts` independently guarantees every storage key resolves inside `STORAGE_ROOT` before any filesystem call - directory traversal (`../../etc/passwd`, absolute paths, null bytes) is rejected before a single byte is read or written, regardless of where the key came from.

Lesson resources (up to 500MB) are written directly to `/storage/temp` via multer `diskStorage`, never buffered in memory; the checksum is computed by streaming the temp file, and the file is committed into its final key via an atomic `rename` (same filesystem, so it's instant regardless of size). A validation failure always cleans up the temp file.

## Image processing

Avatars and course thumbnails are processed with `sharp`:

- Avatar: `512x512`, `cover` fit (square crop).
- Course thumbnail: fits inside `1280x720`, never upscaled.
- Original format re-encoded at quality 85 (mozjpeg for JPEG); a WebP variant is always generated alongside at quality 82.

## Database

One additive table, `uploaded_files` (migration `0016_mean_black_tom.sql`), tracks everything the storage module directly manages: category, storage key (+ optional WebP variant key), original filename, stored (UUID) filename, mime type, size, SHA-256 checksum, image dimensions, the owning user (avatars only), the uploading admin, and a soft-delete timestamp. A partial unique index enforces at most one active avatar per user. Existing tables (`courses.thumbnail_key`, `lesson_resources.storage_key/original_file_name/mime_type/file_size`, `payment_receipts`, `certificate_files`) were reused as-is - no columns were added to them.

## Realigned storage keys

Certificate PDFs, payment receipts, and report exports previously wrote under a `private/` (or `reports/`) prefix that didn't match the folder structure mandated for this phase. Their key templates were updated to drop that prefix (`certificates/...`, `payment-receipts/...`, `exports/...`) so files land in the correct top-level folder. This only changes where new files are written going forward - no other behavior changed, and the one test asserting on the old prefix was updated alongside it.

## Environment variables

| Variable                                                                                                                  | Default                           | Purpose                                                       |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------- |
| `STORAGE_DRIVER`                                                                                                          | `local`                           | `local` or `s3`                                               |
| `STORAGE_ROOT`                                                                                                            | _(auto-detected)_                 | Override the resolved `/storage` root                         |
| `STORAGE_SIGNING_SECRET`                                                                                                  | falls back to `JWT_ACCESS_SECRET` | HMAC secret for signed download tokens                        |
| `STORAGE_SIGNED_URL_TTL_SECONDS`                                                                                          | `900`                             | Default signed URL lifetime when a caller doesn't specify one |
| `STORAGE_ENDPOINT`/`STORAGE_REGION`/`STORAGE_BUCKET`/`STORAGE_ACCESS_KEY`/`STORAGE_SECRET_KEY`/`STORAGE_FORCE_PATH_STYLE` | _(empty)_                         | Only read when `STORAGE_DRIVER=s3`                            |

## Deferred to a later phase

This phase is the storage/upload/download infrastructure itself. Deliberately out of scope, left for the dedicated content-delivery phase that builds on top of it:

- Wiring `thumbnailKey`/lesson `storageKey` into the catalog/learning modules' API responses as resolved URLs (requires enrollment/publication verification per lesson - the catalog and learning modules were not modified).
- HTTP Range requests / partial content for video seeking (`Accept-Ranges` is intentionally not claimed yet - claiming it without honoring `Range` would break real players).
- Per-download activity logging and dedicated rate-limit tiers for download abuse (a modest throttle is already in place on the token route as defense in depth).
