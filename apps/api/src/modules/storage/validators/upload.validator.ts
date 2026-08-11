import {
  PayloadTooLargeException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import {
  MAX_UPLOAD_BYTES,
  type UploadCategory,
} from '../constants/storage.constants';
import {
  extensionOf,
  hasDoubleExtension,
  sanitizeOriginalFileName,
} from '../utils/filename.util';
import {
  isJpeg,
  isMp3,
  isMp4,
  isPdf,
  isPng,
  isWebp,
  isZipFamily,
} from './file-signature.validators';

interface CategoryFileRule {
  extension: string;
  mimeType: string;
  matches: (header: Buffer) => boolean;
}

const IMAGE_RULES: CategoryFileRule[] = [
  { extension: '.jpg', mimeType: 'image/jpeg', matches: isJpeg },
  { extension: '.jpeg', mimeType: 'image/jpeg', matches: isJpeg },
  { extension: '.png', mimeType: 'image/png', matches: isPng },
  { extension: '.webp', mimeType: 'image/webp', matches: isWebp },
];

export const CATEGORY_FILE_RULES: Record<UploadCategory, CategoryFileRule[]> = {
  AVATAR: IMAGE_RULES,
  COURSE_THUMBNAIL: IMAGE_RULES,
  LESSON_RESOURCE: [
    { extension: '.pdf', mimeType: 'application/pdf', matches: isPdf },
    { extension: '.zip', mimeType: 'application/zip', matches: isZipFamily },
    {
      extension: '.docx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      matches: isZipFamily,
    },
    {
      extension: '.pptx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      matches: isZipFamily,
    },
    {
      extension: '.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      matches: isZipFamily,
    },
    { extension: '.mp4', mimeType: 'video/mp4', matches: isMp4 },
    { extension: '.mp3', mimeType: 'audio/mpeg', matches: isMp3 },
  ],
};

export interface ValidatedUpload {
  extension: string;
  mimeType: string;
  originalFileName: string;
}

/**
 * Validates size, extension, double-extension filenames, and the magic-byte
 * signature against a fixed per-category allow-list. The declared client
 * mimetype is never trusted for the stored record - `mimeType` here is
 * always derived from the (signature-verified) extension.
 */
export function validateUploadFile(input: {
  category: UploadCategory;
  originalName: string;
  size: number;
  header: Buffer;
}): ValidatedUpload {
  if (!input.size)
    throw new UnprocessableEntityException({
      code: 'FILE_EMPTY',
      message: 'File is empty',
    });
  const limit = MAX_UPLOAD_BYTES[input.category];
  if (input.size > limit)
    throw new PayloadTooLargeException({
      code: 'FILE_TOO_LARGE',
      message: `File exceeds the ${Math.floor(limit / (1024 * 1024))}MB limit for this upload type`,
    });
  const originalFileName = sanitizeOriginalFileName(input.originalName);
  const extension = extensionOf(originalFileName);
  const rule = CATEGORY_FILE_RULES[input.category].find(
    (r) => r.extension === extension,
  );
  if (!rule)
    throw new UnsupportedMediaTypeException({
      code: 'FILE_TYPE_NOT_ALLOWED',
      message: 'File type is not allowed for this upload',
    });
  if (hasDoubleExtension(originalFileName, extension))
    throw new UnsupportedMediaTypeException({
      code: 'FILE_NAME_INVALID',
      message: 'Double-extension filenames are rejected',
    });
  if (!rule.matches(input.header))
    throw new UnsupportedMediaTypeException({
      code: 'FILE_SIGNATURE_INVALID',
      message: 'File signature does not match its extension',
    });
  return { extension, mimeType: rule.mimeType, originalFileName };
}
