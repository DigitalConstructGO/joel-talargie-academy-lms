import { authClient, unwrap } from '@/lib/api/auth-client';

export interface StorageUploadResult {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  storageKey?: string;
  thumbnailKey?: string;
  variantKey?: string;
}

/** Real uploads only - no mock fallback (nothing meaningful to fake for a binary upload). */
export const adminStorageApi = {
  uploadCourseThumbnail: async (file: File) => {
    const form = new FormData();
    form.set('file', file);
    return unwrap<StorageUploadResult>(
      await authClient.post('/storage/course-thumbnails', form, {
        timeout: 120_000,
      }),
    );
  },

  uploadLessonResource: async (file: File) => {
    const form = new FormData();
    form.set('file', file);
    return unwrap<StorageUploadResult>(
      await authClient.post('/storage/lesson-resources', form, {
        timeout: 120_000,
      }),
    );
  },
};
