import type { Readable } from 'node:stream';

export interface StoredFileStat {
  size: number;
  mtimeMs: number;
}

export interface FileStreamDescriptor {
  stream: Readable;
  size: number;
  mimeType: string;
  fileName: string;
  etag: string;
  lastModified: Date;
}

export interface ProcessedImageResult {
  key: string;
  variantKey: string;
  storedFileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  width: number;
  height: number;
}

export interface CommittedResourceResult {
  key: string;
  storedFileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
}
