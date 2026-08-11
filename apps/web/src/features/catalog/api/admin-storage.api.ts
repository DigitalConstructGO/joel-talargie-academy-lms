import { authClient, unwrap } from '@/lib/api/auth-client';

export interface StorageUploadResult {
  id: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
}

/** Real uploads only - no mock fallback (nothing meaningful to fake for a binary upload). */
export const adminStorageApi = {
  uploadCourseThumbnail: async (file: File) => {
    const form = new FormData();
    form.set('file', file);
    return unwrap<StorageUploadResult>(
      await authClient.post('/storage/course-thumbnails', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },

  uploadLessonResource: async (file: File) => {
    const form = new FormData();
    form.set('file', file);
    return unwrap<StorageUploadResult>(
      await authClient.post('/storage/lesson-resources', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },
};
