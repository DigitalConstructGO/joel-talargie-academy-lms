import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import sharp from 'sharp';
import { API_PREFIX, API_VERSION } from '../../common/constants/api.constants';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import {
  AVATAR_DIMENSIONS,
  COURSE_THUMBNAIL_DIMENSIONS,
  IMAGE_QUALITY,
  STORAGE_HEADER_SNIFF_BYTES,
  UPLOAD_CATEGORY_FOLDER,
  WEBP_VARIANT_QUALITY,
} from './constants/storage.constants';
import type { FileStreamDescriptor } from './interfaces/local-storage.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { StorageRepository } from './repositories/storage.repository';
import { sha256Buffer, sha256File } from './utils/checksum.util';
import { buildStoredFileName } from './utils/filename.util';
import { validateUploadFile } from './validators/upload.validator';

interface ProcessedImage {
  primary: Buffer;
  webp: Buffer;
  width: number;
  height: number;
}

@Injectable()
export class StorageService {
  private readonly avatarBaseUrl: string;

  constructor(
    private readonly local: LocalStorageProvider,
    private readonly repository: StorageRepository,
  ) {
    this.avatarBaseUrl = `/${API_PREFIX}/v${API_VERSION}/storage/avatar`;
  }

  async uploadAvatar(actor: AuthUser, file?: Express.Multer.File) {
    if (!file?.buffer?.length)
      throw new UnprocessableEntityException({
        code: 'FILE_REQUIRED',
        message: 'An image file is required',
      });
    const header = file.buffer.subarray(0, STORAGE_HEADER_SNIFF_BYTES);
    const validated = validateUploadFile({
      category: 'AVATAR',
      originalName: file.originalname,
      size: file.size,
      header,
    });
    const processed = await this.processImage(
      file.buffer,
      validated.extension,
      {
        width: AVATAR_DIMENSIONS.width,
        height: AVATAR_DIMENSIONS.height,
        fit: 'cover',
      },
    );
    const id = randomUUID();
    const storedFileName = `${id}${validated.extension}`;
    const key = `${UPLOAD_CATEGORY_FOLDER.AVATAR}/${storedFileName}`;
    const variantKey = `${UPLOAD_CATEGORY_FOLDER.AVATAR}/${id}.webp`;
    const checksum = sha256Buffer(processed.primary);
    await this.local.upload({
      key,
      body: processed.primary,
      contentType: validated.mimeType,
    });
    await this.local.upload({
      key: variantKey,
      body: processed.webp,
      contentType: 'image/webp',
    });
    const { inserted, previous } = await this.repository.replaceAvatar({
      category: 'AVATAR',
      storageKey: key,
      variantStorageKey: variantKey,
      originalFileName: validated.originalFileName,
      storedFileName,
      mimeType: validated.mimeType,
      fileSize: processed.primary.length,
      checksum,
      width: processed.width,
      height: processed.height,
      relatedUserId: actor.id,
      createdBy: actor.id,
    });
    if (previous) {
      await this.local.delete(previous.storageKey).catch(() => undefined);
      if (previous.variantStorageKey)
        await this.local
          .delete(previous.variantStorageKey)
          .catch(() => undefined);
    }
    return {
      id: inserted.id,
      originalFileName: inserted.originalFileName,
      mimeType: inserted.mimeType,
      fileSize: inserted.fileSize,
      checksum: inserted.checksum,
      width: inserted.width,
      height: inserted.height,
      downloadUrl: `${this.avatarBaseUrl}/${actor.id}`,
    };
  }

  async deleteAvatar(actor: AuthUser) {
    const removed = await this.repository.softDeleteAvatar(actor.id);
    if (!removed)
      throw new NotFoundException({
        code: 'AVATAR_NOT_FOUND',
        message: 'No avatar to delete',
      });
    await this.local.delete(removed.storageKey).catch(() => undefined);
    if (removed.variantStorageKey)
      await this.local.delete(removed.variantStorageKey).catch(() => undefined);
    return { message: 'Avatar deleted' };
  }

  async streamAvatar(
    requester: AuthUser,
    targetUserId: string,
  ): Promise<FileStreamDescriptor> {
    if (
      requester.id !== targetUserId &&
      !requester.roles.includes('ADMINISTRATOR')
    )
      throw new ForbiddenException({
        code: 'AVATAR_ACCESS_DENIED',
        message: 'You cannot access this avatar',
      });
    const record = await this.repository.findActiveAvatar(targetUserId);
    if (!record)
      throw new NotFoundException({
        code: 'AVATAR_NOT_FOUND',
        message: 'Avatar not found',
      });
    try {
      return await this.local.readDescriptor(
        record.storageKey,
        record.originalFileName,
      );
    } catch {
      throw new NotFoundException({
        code: 'AVATAR_NOT_FOUND',
        message: 'Avatar not found',
      });
    }
  }

  async registerCourseThumbnail(actor: AuthUser, file?: Express.Multer.File) {
    if (!file?.buffer?.length)
      throw new UnprocessableEntityException({
        code: 'FILE_REQUIRED',
        message: 'An image file is required',
      });
    const header = file.buffer.subarray(0, STORAGE_HEADER_SNIFF_BYTES);
    const validated = validateUploadFile({
      category: 'COURSE_THUMBNAIL',
      originalName: file.originalname,
      size: file.size,
      header,
    });
    const processed = await this.processImage(
      file.buffer,
      validated.extension,
      {
        width: COURSE_THUMBNAIL_DIMENSIONS.width,
        height: COURSE_THUMBNAIL_DIMENSIONS.height,
        fit: 'inside',
        withoutEnlargement: true,
      },
    );
    const id = randomUUID();
    const storedFileName = `${id}${validated.extension}`;
    const key = `${UPLOAD_CATEGORY_FOLDER.COURSE_THUMBNAIL}/${storedFileName}`;
    const variantKey = `${UPLOAD_CATEGORY_FOLDER.COURSE_THUMBNAIL}/${id}.webp`;
    const checksum = sha256Buffer(processed.primary);
    await this.local.upload({
      key,
      body: processed.primary,
      contentType: validated.mimeType,
    });
    await this.local.upload({
      key: variantKey,
      body: processed.webp,
      contentType: 'image/webp',
    });
    const inserted = await this.repository.insert({
      category: 'COURSE_THUMBNAIL',
      storageKey: key,
      variantStorageKey: variantKey,
      originalFileName: validated.originalFileName,
      storedFileName,
      mimeType: validated.mimeType,
      fileSize: processed.primary.length,
      checksum,
      width: processed.width,
      height: processed.height,
      createdBy: actor.id,
    });
    return {
      id: inserted.id,
      thumbnailKey: key,
      variantKey,
      originalFileName: inserted.originalFileName,
      mimeType: inserted.mimeType,
      fileSize: inserted.fileSize,
      checksum: inserted.checksum,
      width: inserted.width,
      height: inserted.height,
    };
  }

  async registerLessonResource(actor: AuthUser, file?: Express.Multer.File) {
    if (!file?.path)
      throw new UnprocessableEntityException({
        code: 'FILE_REQUIRED',
        message: 'A file is required',
      });
    try {
      const header = await this.readHeaderBytes(
        file.path,
        STORAGE_HEADER_SNIFF_BYTES,
      );
      const validated = validateUploadFile({
        category: 'LESSON_RESOURCE',
        originalName: file.originalname,
        size: file.size,
        header,
      });
      const checksum = await sha256File(file.path);
      const storedFileName = buildStoredFileName(validated.extension);
      const key = `${UPLOAD_CATEGORY_FOLDER.LESSON_RESOURCE}/${storedFileName}`;
      const { fileSize } = await this.local.commitFromTempPath(file.path, key);
      const inserted = await this.repository.insert({
        category: 'LESSON_RESOURCE',
        storageKey: key,
        originalFileName: validated.originalFileName,
        storedFileName,
        mimeType: validated.mimeType,
        fileSize,
        checksum,
        createdBy: actor.id,
      });
      return {
        id: inserted.id,
        storageKey: key,
        originalFileName: inserted.originalFileName,
        mimeType: inserted.mimeType,
        fileSize: inserted.fileSize,
        checksum: inserted.checksum,
      };
    } catch (error) {
      await fs.rm(file.path, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  async streamByToken(token: string): Promise<FileStreamDescriptor> {
    const verification = this.local.verifyToken(token);
    if (!verification.valid)
      throw new UnauthorizedException({
        code:
          verification.reason === 'EXPIRED'
            ? 'DOWNLOAD_LINK_EXPIRED'
            : 'DOWNLOAD_LINK_INVALID',
        message:
          verification.reason === 'EXPIRED'
            ? 'This download link has expired'
            : 'This download link is invalid',
      });
    try {
      return await this.local.readDescriptor(verification.payload.key);
    } catch {
      throw new NotFoundException({
        code: 'FILE_NOT_FOUND',
        message: 'File not found',
      });
    }
  }

  private async readHeaderBytes(path: string, length: number): Promise<Buffer> {
    const handle = await fs.open(path, 'r');
    try {
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await handle.read(buffer, 0, length, 0);
      return buffer.subarray(0, bytesRead);
    } finally {
      await handle.close();
    }
  }

  private async processImage(
    buffer: Buffer,
    extension: string,
    options: {
      width: number;
      height: number;
      fit: 'cover' | 'inside';
      withoutEnlargement?: boolean;
    },
  ): Promise<ProcessedImage> {
    const resized = sharp(buffer)
      .rotate()
      .resize(options.width, options.height, {
        fit: options.fit,
        withoutEnlargement: options.withoutEnlargement,
      });
    const primary =
      extension === '.png'
        ? await resized.clone().png({ compressionLevel: 8 }).toBuffer()
        : extension === '.webp'
          ? await resized.clone().webp({ quality: IMAGE_QUALITY }).toBuffer()
          : await resized
              .clone()
              .jpeg({ quality: IMAGE_QUALITY, mozjpeg: true })
              .toBuffer();
    const webp =
      extension === '.webp'
        ? primary
        : await resized
            .clone()
            .webp({ quality: WEBP_VARIANT_QUALITY })
            .toBuffer();
    const meta = await sharp(primary).metadata();
    return {
      primary,
      webp,
      width: meta.width ?? options.width,
      height: meta.height ?? options.height,
    };
  }
}
