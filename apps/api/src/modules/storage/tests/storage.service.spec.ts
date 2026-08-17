import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { StorageService } from '../storage.service';

jest.mock('sharp', () => {
  const chain: Record<string, jest.Mock> = {};
  chain.rotate = jest.fn(() => chain);
  chain.resize = jest.fn(() => chain);
  chain.clone = jest.fn(() => chain);
  chain.png = jest.fn(() => chain);
  chain.jpeg = jest.fn(() => chain);
  chain.webp = jest.fn(() => chain);
  chain.toBuffer = jest
    .fn()
    .mockResolvedValue(Buffer.from('processed-image-bytes'));
  chain.metadata = jest.fn().mockResolvedValue({ width: 512, height: 512 });
  return jest.fn(() => chain);
});

const PNG_HEADER = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const PDF_HEADER = Buffer.from('%PDF-1.7 rest-of-file', 'ascii');

function pngFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    buffer: Buffer.concat([PNG_HEADER, Buffer.alloc(100)]),
    originalname: 'avatar.png',
    mimetype: 'image/png',
    size: PNG_HEADER.length + 100,
    ...overrides,
  } as Express.Multer.File;
}

describe('StorageService', () => {
  const local = {
    upload: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    readDescriptor: jest.fn(),
    commitFromTempPath: jest.fn(),
    verifyToken: jest.fn(),
  };
  const repository = {
    replaceAvatar: jest.fn(),
    softDeleteAvatar: jest.fn(),
    findActiveAvatar: jest.fn(),
    insert: jest.fn(),
  };
  const service = new StorageService(
    local as never,
    repository as never,
    {} as never,
    {} as never,
  );
  const actor = { id: 'user-1', roles: ['STUDENT'] } as never;
  const admin = { id: 'admin-1', roles: ['ADMINISTRATOR'] } as never;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadAvatar', () => {
    it('throws when no file is provided', async () => {
      await expect(service.uploadAvatar(actor, undefined)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(repository.replaceAvatar).not.toHaveBeenCalled();
    });

    it('rejects an invalid signature without touching storage or the repository', async () => {
      const file = pngFile({ buffer: Buffer.alloc(50) });
      await expect(service.uploadAvatar(actor, file)).rejects.toThrow(
        UnsupportedMediaTypeException,
      );
      expect(local.upload).not.toHaveBeenCalled();
      expect(repository.replaceAvatar).not.toHaveBeenCalled();
    });

    it('uploads the primary + webp variant and replaces any previous avatar', async () => {
      repository.replaceAvatar.mockResolvedValue({
        inserted: {
          id: 'upload-1',
          originalFileName: 'avatar.png',
          mimeType: 'image/png',
          fileSize: 22,
          checksum: 'abc',
          width: 512,
          height: 512,
        },
        previous: {
          storageKey: 'avatars/old.png',
          variantStorageKey: 'avatars/old.webp',
        },
      });

      const result = await service.uploadAvatar(actor, pngFile());

      expect(local.upload).toHaveBeenCalledTimes(2);
      expect(repository.replaceAvatar).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'AVATAR',
          relatedUserId: 'user-1',
          createdBy: 'user-1',
        }),
      );
      expect(local.delete).toHaveBeenCalledWith('avatars/old.png');
      expect(local.delete).toHaveBeenCalledWith('avatars/old.webp');
      expect(result).toMatchObject({
        id: 'upload-1',
        downloadUrl: '/api/v1/storage/avatar/user-1',
      });
    });

    it('does not attempt to delete anything when there was no previous avatar', async () => {
      repository.replaceAvatar.mockResolvedValue({
        inserted: {
          id: 'upload-1',
          originalFileName: 'avatar.png',
          mimeType: 'image/png',
          fileSize: 22,
          checksum: 'abc',
          width: 512,
          height: 512,
        },
        previous: null,
      });
      await service.uploadAvatar(actor, pngFile());
      expect(local.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteAvatar', () => {
    it('throws NotFoundException when there is nothing to delete', async () => {
      repository.softDeleteAvatar.mockResolvedValue(null);
      await expect(service.deleteAvatar(actor)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes the primary and variant files on success', async () => {
      repository.softDeleteAvatar.mockResolvedValue({
        storageKey: 'avatars/a.png',
        variantStorageKey: 'avatars/a.webp',
      });
      await service.deleteAvatar(actor);
      expect(local.delete).toHaveBeenCalledWith('avatars/a.png');
      expect(local.delete).toHaveBeenCalledWith('avatars/a.webp');
    });
  });

  describe('streamAvatar', () => {
    it('allows the owner to stream their own avatar', async () => {
      repository.findActiveAvatar.mockResolvedValue({
        storageKey: 'avatars/a.png',
      });
      local.readDescriptor.mockResolvedValue({ fileName: 'avatar.png' });
      await expect(
        service.streamAvatar(actor, 'user-1'),
      ).resolves.toMatchObject({
        fileName: 'avatar.png',
      });
    });

    it('allows an administrator to stream a different avatar', async () => {
      repository.findActiveAvatar.mockResolvedValue({
        storageKey: 'avatars/a.png',
      });
      local.readDescriptor.mockResolvedValue({ fileName: 'avatar.png' });
      await expect(
        service.streamAvatar(admin, 'user-1'),
      ).resolves.toBeDefined();
    });

    it('forbids a student from streaming a different avatar', async () => {
      await expect(service.streamAvatar(actor, 'someone-else')).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.findActiveAvatar).not.toHaveBeenCalled();
    });

    it('returns NotFoundException when the target user has no avatar', async () => {
      repository.findActiveAvatar.mockResolvedValue(undefined);
      await expect(service.streamAvatar(actor, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('registerCourseThumbnail', () => {
    it('returns a pasteable thumbnailKey', async () => {
      repository.insert.mockResolvedValue({
        id: 'thumb-1',
        originalFileName: 'cover.png',
        mimeType: 'image/png',
        fileSize: 22,
        checksum: 'abc',
        width: 1280,
        height: 720,
      });
      const result = await service.registerCourseThumbnail(
        admin,
        pngFile({ originalname: 'cover.png' }),
      );
      expect(result.thumbnailKey).toMatch(/^course-thumbnails\//);
      expect(repository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'COURSE_THUMBNAIL',
          createdBy: 'admin-1',
        }),
      );
    });
  });

  describe('registerLessonResource', () => {
    let dir: string;

    beforeEach(async () => {
      dir = await fs.mkdtemp(join(tmpdir(), 'jta-lesson-'));
    });

    afterEach(async () => {
      await fs.rm(dir, { recursive: true, force: true });
    });

    it('commits a valid PDF and registers it', async () => {
      const path = join(dir, 'upload.tmp');
      await fs.writeFile(path, PDF_HEADER);
      local.commitFromTempPath.mockResolvedValue({
        key: 'lesson-files/x.pdf',
        fileSize: PDF_HEADER.length,
      });
      repository.insert.mockResolvedValue({
        id: 'res-1',
        originalFileName: 'syllabus.pdf',
        mimeType: 'application/pdf',
        fileSize: PDF_HEADER.length,
        checksum: 'abc',
      });

      const result = await service.registerLessonResource(admin, {
        path,
        originalname: 'syllabus.pdf',
        size: PDF_HEADER.length,
      } as Express.Multer.File);

      expect(result.storageKey).toMatch(/^lesson-files\/[0-9a-f-]+\.pdf$/);
      expect(repository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'LESSON_RESOURCE',
          createdBy: 'admin-1',
        }),
      );
    });

    it('cleans up the temp file when validation fails', async () => {
      const path = join(dir, 'upload.tmp');
      await fs.writeFile(path, Buffer.from('not-a-real-pdf'));

      await expect(
        service.registerLessonResource(admin, {
          path,
          originalname: 'syllabus.pdf',
          size: 14,
        } as Express.Multer.File),
      ).rejects.toThrow(UnsupportedMediaTypeException);

      await expect(fs.access(path)).rejects.toThrow();
      expect(local.commitFromTempPath).not.toHaveBeenCalled();
      expect(repository.insert).not.toHaveBeenCalled();
    });
  });

  describe('streamByToken', () => {
    it('streams the file for a valid token', async () => {
      local.verifyToken.mockReturnValue({
        valid: true,
        payload: { key: 'certificates/x.pdf' },
      });
      local.readDescriptor.mockResolvedValue({ fileName: 'x.pdf' });
      await expect(service.streamByToken('token')).resolves.toMatchObject({
        fileName: 'x.pdf',
      });
      expect(local.readDescriptor).toHaveBeenCalledWith('certificates/x.pdf');
    });

    it('throws Unauthorized for an expired token', async () => {
      local.verifyToken.mockReturnValue({ valid: false, reason: 'EXPIRED' });
      await expect(service.streamByToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws Unauthorized for a malformed/invalid token', async () => {
      local.verifyToken.mockReturnValue({
        valid: false,
        reason: 'SIGNATURE_INVALID',
      });
      await expect(service.streamByToken('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws NotFoundException when the underlying file is missing', async () => {
      local.verifyToken.mockReturnValue({
        valid: true,
        payload: { key: 'certificates/gone.pdf' },
      });
      local.readDescriptor.mockRejectedValue(new Error('ENOENT'));
      await expect(service.streamByToken('token')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
