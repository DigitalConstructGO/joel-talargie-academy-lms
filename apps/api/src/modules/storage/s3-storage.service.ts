import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { StorageService, UploadInput } from './storage.interface';

@Injectable()
export class S3StorageService implements StorageService {
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('STORAGE_BUCKET') ?? '';
    const endpoint = config.get<string>('STORAGE_ENDPOINT') || undefined;
    const accessKeyId = config.get<string>('STORAGE_ACCESS_KEY') ?? '';
    const secretAccessKey = config.get<string>('STORAGE_SECRET_KEY') ?? '';
    this.client = new S3Client({
      endpoint,
      region: config.get<string>('STORAGE_REGION') || 'auto',
      forcePathStyle: config.get<boolean>('STORAGE_FORCE_PATH_STYLE') ?? false,
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });
  }

  async upload(input: UploadInput) {
    this.assertConfigured();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: 'private, no-store',
      }),
    );
    return { key: input.key };
  }

  async delete(key: string) {
    this.assertConfigured();
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async getSignedUrl(key: string, expiresInSeconds = 300) {
    this.assertConfigured();
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseCacheControl: 'private, no-store',
      }),
      { expiresIn: Math.min(Math.max(expiresInSeconds, 30), 300) },
    );
  }

  private assertConfigured() {
    if (!this.bucket) throw new Error('STORAGE_NOT_CONFIGURED');
  }
}
