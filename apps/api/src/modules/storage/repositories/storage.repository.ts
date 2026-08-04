import { Injectable } from '@nestjs/common';
import { and, eq, isNull, schema } from '@joel-academy/database';
import { DatabaseService } from '../../../common/database/database.service';
import type { UploadCategory } from '../constants/storage.constants';

export interface UploadedFileRecord {
  id: string;
  category: UploadCategory;
  storageKey: string;
  variantStorageKey: string | null;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  width: number | null;
  height: number | null;
  relatedUserId: string | null;
  createdBy: string;
}

export interface InsertUploadedFileInput {
  category: UploadCategory;
  storageKey: string;
  variantStorageKey?: string | null;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  checksum: string;
  width?: number | null;
  height?: number | null;
  relatedUserId?: string | null;
  createdBy: string;
}

@Injectable()
export class StorageRepository {
  constructor(private readonly database: DatabaseService) {}
  private get db() {
    return this.database.client;
  }

  insert(input: InsertUploadedFileInput): Promise<UploadedFileRecord> {
    return this.db
      .insert(schema.uploadedFiles)
      .values({
        category: input.category,
        storageKey: input.storageKey,
        variantStorageKey: input.variantStorageKey ?? null,
        originalFileName: input.originalFileName,
        storedFileName: input.storedFileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        checksum: input.checksum,
        width: input.width ?? null,
        height: input.height ?? null,
        relatedUserId: input.relatedUserId ?? null,
        createdBy: input.createdBy,
      })
      .returning()
      .then(([row]) => row as UploadedFileRecord);
  }

  findActiveAvatar(userId: string): Promise<UploadedFileRecord | undefined> {
    return this.db.query.uploadedFiles.findFirst({
      where: and(
        eq(schema.uploadedFiles.category, 'AVATAR'),
        eq(schema.uploadedFiles.relatedUserId, userId),
        isNull(schema.uploadedFiles.deletedAt),
      ),
    }) as Promise<UploadedFileRecord | undefined>;
  }

  /** Replaces a user's avatar row atomically: soft-deletes the old one, inserts the new one. */
  async replaceAvatar(
    input: InsertUploadedFileInput & { relatedUserId: string },
  ): Promise<{
    inserted: UploadedFileRecord;
    previous: UploadedFileRecord | null;
  }> {
    return this.db.transaction(async (tx) => {
      const previous = await tx.query.uploadedFiles.findFirst({
        where: and(
          eq(schema.uploadedFiles.category, 'AVATAR'),
          eq(schema.uploadedFiles.relatedUserId, input.relatedUserId),
          isNull(schema.uploadedFiles.deletedAt),
        ),
      });
      if (previous)
        await tx
          .update(schema.uploadedFiles)
          .set({ deletedAt: new Date() })
          .where(eq(schema.uploadedFiles.id, previous.id));
      const [inserted] = await tx
        .insert(schema.uploadedFiles)
        .values({
          category: input.category,
          storageKey: input.storageKey,
          variantStorageKey: input.variantStorageKey ?? null,
          originalFileName: input.originalFileName,
          storedFileName: input.storedFileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          checksum: input.checksum,
          width: input.width ?? null,
          height: input.height ?? null,
          relatedUserId: input.relatedUserId,
          createdBy: input.createdBy,
        })
        .returning();
      await tx
        .update(schema.users)
        .set({ avatarUrl: null, updatedAt: new Date() })
        .where(eq(schema.users.id, input.relatedUserId));
      return {
        inserted: inserted as UploadedFileRecord,
        previous: (previous as UploadedFileRecord | undefined) ?? null,
      };
    });
  }

  async softDeleteAvatar(userId: string): Promise<UploadedFileRecord | null> {
    return this.db.transaction(async (tx) => {
      const current = await tx.query.uploadedFiles.findFirst({
        where: and(
          eq(schema.uploadedFiles.category, 'AVATAR'),
          eq(schema.uploadedFiles.relatedUserId, userId),
          isNull(schema.uploadedFiles.deletedAt),
        ),
      });
      if (!current) return null;
      await tx
        .update(schema.uploadedFiles)
        .set({ deletedAt: new Date() })
        .where(eq(schema.uploadedFiles.id, current.id));
      await tx
        .update(schema.users)
        .set({ avatarUrl: null, updatedAt: new Date() })
        .where(eq(schema.users.id, userId));
      return current as UploadedFileRecord;
    });
  }
}
