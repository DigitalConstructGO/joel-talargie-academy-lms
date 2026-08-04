import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { diskStorage } from 'multer';
import { STORAGE_FOLDERS } from '../constants/storage.constants';
import { ensureStorageFolders, resolveStorageRoot } from './storage-root.util';

/**
 * Multer decorator options are static (evaluated once, no DI available), so
 * the temp destination is resolved lazily per-request from the same
 * STORAGE_ROOT logic the LocalStorageProvider uses - keeping both in sync
 * without wiring Nest DI into a multer config object.
 */
export const lessonResourceDiskStorage = diskStorage({
  destination: (_request, _file, callback) => {
    const root = resolveStorageRoot(process.env.STORAGE_ROOT ?? '');
    ensureStorageFolders(root);
    callback(null, join(root, STORAGE_FOLDERS.TEMP));
  },
  filename: (_request, _file, callback) => {
    callback(null, `upload-${randomUUID()}.tmp`);
  },
});
