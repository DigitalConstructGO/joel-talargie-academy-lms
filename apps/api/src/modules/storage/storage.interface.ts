import type { StorageDisposition } from './utils/signed-token.util';

export interface UploadInput {
  key: string;
  body: Uint8Array;
  contentType: string;
}
export interface StorageService {
  upload(input: UploadInput): Promise<{ key: string }>;
  delete(key: string): Promise<void>;
  exists?(key: string): Promise<boolean>;
  /** `disposition` defaults to `'attachment'` (forces a download) - pass `'inline'` for browser-renderable previews. */
  getSignedUrl(
    key: string,
    expiresInSeconds?: number,
    disposition?: StorageDisposition,
  ): Promise<string>;
}
export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
