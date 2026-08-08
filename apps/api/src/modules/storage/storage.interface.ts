export interface UploadInput {
  key: string;
  body: Uint8Array;
  contentType: string;
}
export interface StorageService {
  upload(input: UploadInput): Promise<{ key: string }>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
