import {
  constants as fsConstants,
  createReadStream,
  promises as fs,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lookup as lookupMimeType } from 'mime-types';
import {
  API_PREFIX,
  API_VERSION,
} from '../../../common/constants/api.constants';
import {
  DEFAULT_SIGNED_URL_TTL_SECONDS,
  MAX_SIGNED_URL_TTL_SECONDS,
  MIN_SIGNED_URL_TTL_SECONDS,
  STORAGE_FOLDERS,
} from '../constants/storage.constants';
import type {
  FileStreamDescriptor,
  StoredFileStat,
} from '../interfaces/local-storage.interface';
import type { StorageService, UploadInput } from '../storage.interface';
import { resolveSafeStoragePath } from '../utils/safe-path.util';
import {
  signStorageToken,
  verifyStorageToken,
  type StorageTokenVerification,
} from '../utils/signed-token.util';
import {
  ensureStorageFolders,
  resolveStorageRoot,
} from '../utils/storage-root.util';

/**
 * Filesystem-backed StorageService. All reads/writes are resolved through
 * `resolveSafeStoragePath` so a key can never escape STORAGE_ROOT. Signed
 * URLs are HMAC tokens pointing back at this API's own streaming endpoint -
 * there is no S3 to hand out a presigned URL for, so the API itself becomes
 * the short-lived, expiring download link.
 */
@Injectable()
export class LocalStorageProvider implements StorageService, OnModuleInit {
  private readonly logger = new Logger(LocalStorageProvider.name);
  readonly root: string;
  readonly tempDir: string;
  private readonly signingSecret: string;
  private readonly defaultTtlSeconds: number;
  private readonly publicApiBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.root = resolveStorageRoot(config.get<string>('STORAGE_ROOT') ?? '');
    this.tempDir = join(this.root, STORAGE_FOLDERS.TEMP);
    this.signingSecret =
      config.get<string>('STORAGE_SIGNING_SECRET') ||
      config.get<string>('JWT_ACCESS_SECRET') ||
      'development-storage-signing-secret';
    this.defaultTtlSeconds =
      config.get<number>('STORAGE_SIGNED_URL_TTL_SECONDS') ??
      DEFAULT_SIGNED_URL_TTL_SECONDS;
    const apiBaseUrl = config.get<string>('API_URL')?.trim();
    const webBaseUrl = config.get<string>('WEB_URL')?.trim();
    const baseUrl = apiBaseUrl || webBaseUrl || '';
    this.publicApiBaseUrl = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/${API_PREFIX}/v${API_VERSION}`
      : `/${API_PREFIX}/v${API_VERSION}`;
  }

  onModuleInit(): void {
    ensureStorageFolders(this.root);
  }

  /** Read/write access check on the storage root - no file I/O, so it's cheap enough to call on every readiness probe. */
  async checkHealth(): Promise<'available' | 'unavailable'> {
    try {
      await fs.access(this.root, fsConstants.R_OK | fsConstants.W_OK);
      return 'available';
    } catch {
      return 'unavailable';
    }
  }

  async upload(input: UploadInput): Promise<{ key: string }> {
    const path = resolveSafeStoragePath(this.root, input.key);
    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, input.body);
    return { key: input.key };
  }

  async delete(key: string): Promise<void> {
    const path = resolveSafeStoragePath(this.root, key);
    await fs.rm(path, { force: true });
  }

  async getSignedUrl(key: string, expiresInSeconds?: number): Promise<string> {
    // Touch the path resolver so an unsafe key fails loudly before a token is ever minted.
    resolveSafeStoragePath(this.root, key);
    const ttl = Math.min(
      Math.max(
        expiresInSeconds ?? this.defaultTtlSeconds,
        MIN_SIGNED_URL_TTL_SECONDS,
      ),
      MAX_SIGNED_URL_TTL_SECONDS,
    );
    const token = signStorageToken(key, this.signingSecret, ttl);
    return `${this.publicApiBaseUrl}/storage/files/${token}`;
  }

  verifyToken(token: string): StorageTokenVerification {
    return verifyStorageToken(token, this.signingSecret);
  }

  /** Atomically moves a multer diskStorage temp file into its final key location. */
  async commitFromTempPath(
    tempPath: string,
    key: string,
  ): Promise<{ key: string; fileSize: number }> {
    const destination = resolveSafeStoragePath(this.root, key);
    await fs.mkdir(dirname(destination), { recursive: true });
    try {
      await fs.rename(tempPath, destination);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EXDEV') {
        await fs.copyFile(tempPath, destination);
        await fs.rm(tempPath, { force: true });
      } else {
        throw error;
      }
    }
    const info = await fs.stat(destination);
    return { key, fileSize: info.size };
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(resolveSafeStoragePath(this.root, key));
      return true;
    } catch {
      return false;
    }
  }

  async stat(key: string): Promise<StoredFileStat> {
    const info = await fs.stat(resolveSafeStoragePath(this.root, key));
    return { size: info.size, mtimeMs: info.mtimeMs };
  }

  /** Opens a read stream plus everything needed to set safe HTTP response headers. */
  async readDescriptor(
    key: string,
    fallbackFileName?: string,
  ): Promise<FileStreamDescriptor> {
    const path = resolveSafeStoragePath(this.root, key);
    const info = await fs.stat(path);
    const mimeType = lookupMimeType(path) || 'application/octet-stream';
    return {
      stream: createReadStream(path),
      size: info.size,
      mimeType,
      fileName: fallbackFileName ?? key.split('/').pop() ?? 'file',
      etag: `"${info.size}-${Math.floor(info.mtimeMs)}"`,
      lastModified: info.mtime,
    };
  }

  async cleanupTempFiles(maxAgeMs: number): Promise<number> {
    let removed = 0;
    let entries: string[];
    try {
      entries = await fs.readdir(this.tempDir);
    } catch {
      return 0;
    }
    const cutoff = Date.now() - maxAgeMs;
    for (const entry of entries) {
      const path = join(this.tempDir, entry);
      try {
        const info = await fs.stat(path);
        if (info.isFile() && info.mtimeMs < cutoff) {
          await fs.rm(path, { force: true });
          removed += 1;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to inspect temp file "${entry}": ${String(error)}`,
        );
      }
    }
    return removed;
  }
}
